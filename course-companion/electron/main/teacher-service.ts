import { setupSettings } from '../../shared/setup-settings'
import { randomUUID } from 'node:crypto'
import type {
  CompanionMode,
  CompanionState,
  LearnerProgress,
  PracticeRunSummary,
  TeacherConversation,
  TeacherMessage,
  TeacherRuntimeView,
  TeacherSendRequest,
  TeacherSendResult
} from '../../shared/contracts'
import type { CodexConnectionState } from './codex-app-server-client'
import { ExecutorActivityObserver } from './executor-activity-observer'
import { ExecutorActivityRepository } from './executor-activity-repository'
import { PracticeDefinitionRepository } from './practice-definition-repository'
import type { PracticeRunRecord } from './practice-run-repository'
import { PracticeRunRepository } from './practice-run-repository'
import { ProgressRepository } from './progress-repository'
import { RealTeacherAdapter, TeacherInferenceError, type RunSummaryProposal } from './real-teacher-adapter'
import { buildTeacherEnvelope, buildTeacherTurnInput, sourceDigest } from './teacher-context-broker'
import {
  TeacherCourseContextError,
  TeacherCourseContextRepository
} from './teacher-course-context-repository'
import { TeacherChatRepository } from './teacher-fixture'
import { practiceSummaryKey, TeacherMemoryRepository } from './teacher-memory-repository'

export function conversationForRun(conversation: TeacherConversation, runId: string | null): TeacherConversation {
  return {
    ...conversation,
    messages: conversation.messages.filter((message) => (
      runId ? message.practiceRunId === runId : message.practiceRunId === undefined
    ))
  }
}

export class TeacherService {
  private runtime: TeacherRuntimeView
  private boundRunId: string | null = null
  private responseRunId: string | null = null
  private transportStarted = false
  private refinement: Promise<void> | null = null
  private readonly activeMessageIds = new Set<string>()
  private generation = 0
  private readonly activeSends = new Set<Promise<TeacherSendResult>>()
  private transportState: CodexConnectionState = 'disconnected'

  constructor(
    private readonly chatRepository: TeacherChatRepository,
    private readonly progressRepository: ProgressRepository,
    private readonly courseContextRepository: TeacherCourseContextRepository,
    private readonly practiceRepository: PracticeRunRepository,
    private readonly definitionRepository: PracticeDefinitionRepository,
    private readonly activityRepository: ExecutorActivityRepository,
    private readonly activityObserver: ExecutorActivityObserver,
    private readonly memoryRepository: TeacherMemoryRepository,
    private readonly summaryInference: RealTeacherAdapter,
    private readonly inference: RealTeacherAdapter,
    private readonly simulated: boolean,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = randomUUID
  ) {
    this.runtime = { connection: simulated ? 'simulated' : 'connecting', memory: 'ready', contextFreshness: 'unavailable' }
  }

  onConnectionState(state: CodexConnectionState): void {
    if (this.simulated) return
    this.transportState = state
    if (state === 'connecting') {
      this.transportStarted = true
      this.runtime = { ...this.runtime, connection: 'connecting', error: undefined }
      return
    }
    if (state === 'connected') {
      this.transportStarted = true
      void this.refinePendingSummaries()
      this.runtime = { ...this.runtime, connection: 'ready', error: undefined }
      return
    }
    if (this.transportStarted) {
      this.runtime = {
        ...this.runtime,
        connection: 'offline',
        error: 'M\u1ea5t k\u1ebft n\u1ed1i v\u1edbi Codex App Server. H\u00e3y th\u1eed l\u1ea1i.'
      }
    }
  }

  async loadState(mode: CompanionMode): Promise<CompanionState> {
    const generation = this.generation
    const [loadedConversation, memory, activityState] = await Promise.all([
      this.chatRepository.loadConversation(),
      this.memoryRepository.load(),
      this.refreshActiveActivity(false)
    ])
    if (generation !== this.generation) throw new Error('Teacher state load was cancelled by course reset.')
    const activity = activityState.activity
    const activeRunId = activityState.activeRun?.runId ?? null
    let conversation = conversationForRun(loadedConversation, activeRunId)
    const abandoned = conversation.messages.filter((message) => (
      message.deliveryStatus === 'pending' && !this.activeMessageIds.has(message.id)
    ))
    if (abandoned.length > 0) {
      if (generation !== this.generation) throw new Error('Teacher state load was cancelled by course reset.')
      await this.chatRepository.append(abandoned.map((message) => ({ ...message, deliveryStatus: 'failed' as const })))
      conversation = conversationForRun(await this.chatRepository.loadConversation(), activeRunId)
    }
    if (generation !== this.generation) throw new Error('Teacher state load was cancelled by course reset.')
    if (this.memoryRepository.hasPending(memory)) {
      this.runtime.memory = 'pending'
      if (this.runtime.connection === 'ready' || this.runtime.connection === 'live') void this.refinePendingSummaries()
    }
    else this.runtime.memory = 'ready'
    this.runtime.contextFreshness = !activity
      ? 'unavailable'
      : activity.status === 'disconnected'
      ? 'disconnected'
      : activity.status === 'stale' ? 'stale' : 'fresh'
    return { mode, conversation, teacher: structuredClone(this.runtime) }
  }

  private async refreshActiveActivity(observePractice = true): Promise<{
    activity: Awaited<ReturnType<ExecutorActivityObserver['refresh']>>
    activeRun: PracticeRunRecord | null
  }> {
    let workspace = await this.practiceRepository.load()
    if (!workspace.activeRun) return { activity: null, activeRun: null }
    const activity = !observePractice
      ? await this.activityRepository.load(workspace.activeRun.runId)
      : this.boundRunId === workspace.activeRun.runId
        ? await this.activityObserver.refresh()
        : await this.activityObserver.bind(workspace.activeRun.binding)
    this.boundRunId = workspace.activeRun.runId
    if (activity) {
      const active = workspace.activeRun
      const configuration = activity.configuration
      const configurationMatches = configuration
        ? setupSettings.map(setting => setting.matches(configuration[setting.key]?.protocolValue))
        : []
      const firstConfigurationMismatch = configurationMatches.findIndex((matches) => !matches)
      const setupChecklist = active.checklist.filter(step => step.id !== 'set-model')
      const configurationTarget = active.evidenceProfile === 'codex-task-configuration'
        ? setupChecklist[
            configuration?.freshness === 'fresh'
              ? firstConfigurationMismatch === -1
                ? setupChecklist.length - 1
                : firstConfigurationMismatch
              : 0
          ]?.id ?? null
        : null
      const hasConfirmedChange = activity.changedFiles.length > 0 || activity.workspaceConfirmedChangedFiles.length > 0 || activity.workspaceCommittedReportedFilesSinceRunStart.length > 0
      const hasExecutorActivity = activity.learnerPrompts.length > 0 || activity.executorResponses.length > 0
      const target = active.evidenceProfile === 'codex-task-configuration'
        ? configurationTarget
        : hasConfirmedChange ? 'review-evidence' as const : hasExecutorActivity ? 'build-and-verify' as const : null
      if (target) {
        workspace = await this.practiceRepository.advanceChecklist({
          runId: workspace.activeRun.runId,
          generation: workspace.activeRun.generation,
          practiceId: workspace.activeRun.practiceId,
          practiceVersion: workspace.activeRun.practiceVersion,
          currentStepId: target,
          updatedAt: activity.observedAt
        })
      }
    }
    return { activity, activeRun: workspace.activeRun }
  }

  sendMessage(request: TeacherSendRequest): Promise<TeacherSendResult> {
    const operation = this.sendMessageDirect(request)
    this.activeSends.add(operation)
    void operation.then(
      () => this.activeSends.delete(operation),
      () => this.activeSends.delete(operation)
    )
    return operation
  }

  private async sendMessageDirect(request: TeacherSendRequest): Promise<TeacherSendResult> {
    const content = request.content.trim()
    const generation = this.generation
    const progressResult = await this.progressRepository.load()
    if (progressResult.status !== 'returning' && progressResult.status !== 'recovered') {
      this.runtime.error = 'Hãy mở một bài học trước khi hỏi Triết.'
      throw new Error('Teacher context is unavailable until the course starts')
    }
    const practiceWorkspace = await this.practiceRepository.load()
    if (practiceWorkspace.activeRun) {
      this.runtime.error = 'Trong Practice, Triết chỉ cập nhật và duyệt tiến độ. Hãy làm việc trực tiếp trong task Codex đã liên kết.'
      throw new Error('Direct Teacher chat is unavailable during Practice')
    }
    let coursePackage
    try {
      coursePackage = await this.courseContextRepository.load(progressResult.progress)
    } catch (cause) {
      this.runtime.error = teacherContextFailureMessage(cause)
      throw new Error('Teacher course context is unavailable.', { cause })
    }
    const activityState = await this.refreshActiveActivity()
    const workspace = { activeRun: activityState.activeRun }
    if (generation !== this.generation) {
      throw new Error('Teacher request was cancelled by course reset.')
    }
    const confirmedProgress = await this.progressRepository.load()
    if ((confirmedProgress.status !== 'returning' && confirmedProgress.status !== 'recovered')
      || teacherProgressIdentity(confirmedProgress.progress) !== teacherProgressIdentity(progressResult.progress)) {
      this.runtime.error = 'Bài học vừa thay đổi. Hãy gửi lại câu hỏi để Triết dùng đúng ngữ cảnh mới nhất.'
      throw new Error('Teacher course context changed while the request was assembled.')
    }
    const conversation = await this.chatRepository.loadConversation()
    const retry = [...conversation.messages].reverse().find((message) => (
      message.role === 'learner'
      && message.deliveryStatus === 'failed'
      && message.content === content
      && message.practiceRunId === workspace.activeRun?.runId
      && message.checkpointId === progressResult.progress.checkpointId
    ))
    const timestamp = this.now().toISOString()
    const learnerMessage: TeacherMessage = retry
      ? { ...retry, timestamp, deliveryStatus: 'pending' }
      : {
          schemaVersion: 1,
          id: this.createId(),
          role: 'learner',
          source: 'learner',
          content,
          timestamp,
          checkpointId: progressResult.progress.checkpointId,
          practiceRunId: workspace.activeRun?.runId,
          deliveryStatus: 'pending'
        }
    try {
      await this.chatRepository.append([learnerMessage])
    } catch {
      this.runtime.error = 'Kh\u00f4ng th\u1ec3 l\u01b0u tin nh\u1eafn c\u1ee5c b\u1ed9. Tin nh\u1eafn ch\u01b0a \u0111\u01b0\u1ee3c g\u1eedi.'
      throw new Error('Teacher message could not be saved locally.')
    }
    if (generation !== this.generation) {
      throw new Error('Teacher request was cancelled by course reset.')
    }
    this.runtime.connection = this.simulated ? 'simulated' : 'connecting'
    this.activeMessageIds.add(learnerMessage.id)

    try {
      const [memory, currentConversation] = await Promise.all([
        this.memoryRepository.load(),
        this.chatRepository.loadConversation()
      ])
      const activity = activityState.activity
      const definition = workspace.activeRun
        ? await this.definitionRepository.load(
            workspace.activeRun.practiceId,
            workspace.activeRun.practiceVersion
          )
        : null
      const contextualActivity = definition?.evidenceProfile === 'codex-task-configuration'
        && activity
        ? {
            ...activity,
            learnerPrompts: [],
            executorResponses: [],
            approvalEvents: [],
            changedFiles: [],
            verificationEvidence: [],
            reportedChangedFiles: [],
            reportedVerificationEvidence: [],
            workspaceConfirmedChangedFiles: [],
            workspaceCommittedReportedFilesSinceRunStart: [],
            workspaceCurrentlyDirtyReportedFiles: [],
            workspaceBaseline: null
          }
        : activity
      const context = buildTeacherEnvelope({
        progress: progressResult.progress,
        coursePackage,
        definition,
        activeRun: workspace.activeRun,
        activity: contextualActivity,
        memory,
        conversation: currentConversation,
        excludeMessageId: learnerMessage.id,
        now: this.now
      })
      const answer = await this.inference.respond(
        buildTeacherTurnInput(context, content),
        coursePackage.pedagogyInstructions
      )
      if (generation !== this.generation) {
        throw new TeacherInferenceError('adapter', 'TEACHER_RESET', 'Teacher request was cancelled by course reset')
      }
      const latestProgress = await this.progressRepository.load()
      const latestPractice = await this.practiceRepository.load()
      if (latestPractice.activeRun
        || (latestProgress.status !== 'returning' && latestProgress.status !== 'recovered')
        || teacherProgressIdentity(latestProgress.progress) !== teacherProgressIdentity(progressResult.progress)) {
        throw new TeacherInferenceError('adapter', 'TEACHER_CONTEXT_CHANGED', 'Course context changed during Teacher inference')
      }
      const deliveredLearner = { ...learnerMessage, deliveryStatus: 'delivered' as const }
      const teacherMessage: TeacherMessage = {
        schemaVersion: 1,
        id: this.createId(),
        role: 'teacher',
        source: this.simulated ? 'fixture' : 'live',
        content: answer,
        timestamp: this.now().toISOString(),
        checkpointId: progressResult.progress.checkpointId,
        practiceRunId: workspace.activeRun?.runId,
        deliveryStatus: 'delivered'
      }
      await this.chatRepository.append([deliveredLearner, teacherMessage])
      this.runtime = {
        connection: this.simulated ? 'simulated' : 'live',
        memory: this.memoryRepository.hasPending(memory) ? 'pending' : 'ready',
        observedAt: context.envelope.practice.activity?.observedAt,
        contextFreshness: context.envelope.freshness
      }
      return { learnerMessage: deliveredLearner, teacherMessage }
    } catch (cause) {
      if (generation !== this.generation) {
        throw new Error('Teacher request was cancelled by course reset.', { cause })
      }
      await this.chatRepository.append([{ ...learnerMessage, deliveryStatus: 'failed' }])
      this.runtime = {
        connection: this.simulated
          ? 'simulated'
          : this.transportState === 'connected' ? 'ready' : 'offline',
        memory: this.runtime.memory,
        contextFreshness: this.runtime.contextFreshness,
        error: teacherFailureMessage(cause)
      }
      throw new Error('Teacher is unavailable. Retry the saved message.', { cause })
    } finally {
      this.activeMessageIds.delete(learnerMessage.id)
    }
  }

  async summarizeReplacedRun(run: PracticeRunRecord): Promise<PracticeRunSummary> {
    return this.summarizeRun(run, 'replaced')
  }

  async summarizeCompletedRun(run: PracticeRunRecord): Promise<PracticeRunSummary> {
    return this.summarizeRun(run, 'completed')
  }

  private async summarizeRun(
    run: PracticeRunRecord,
    outcome: 'completed' | 'replaced'
  ): Promise<PracticeRunSummary> {
    const generation = this.generation
    const [activity, conversation, definition, memory] = await Promise.all([
      this.activityRepository.load(run.runId),
      this.chatRepository.loadConversation(),
      this.definitionRepository.load(run.practiceId, run.practiceVersion),
      this.memoryRepository.load()
    ])
    const existing = memory.practiceSummaries[
      practiceSummaryKey(run.practiceId, run.practiceVersion)
    ]?.find((summary) => summary.runId === run.runId && summary.outcome === outcome)
    if (existing) return structuredClone(existing)
    const frozen = {
      run,
      activity,
      teacherChat: conversation.messages.filter((message) => message.practiceRunId === run.runId)
    }
    const base = {
      schemaVersion: 1 as const,
      practiceId: run.practiceId,
      practiceVersion: run.practiceVersion,
      runId: run.runId,
      attempt: run.generation,
      outcome,
      objective: definition.objective,
      startedAt: run.startedAt,
      endedAt: outcome === 'completed'
        ? run.completion?.completedAt ?? this.now().toISOString()
        : this.now().toISOString(),
      sourceDigest: sourceDigest(frozen),
      freshness: activity?.status === 'stale' || activity?.status === 'disconnected' ? 'stale' as const : 'current' as const
    }

    try {
      const proposal = await this.summaryInference.summarize([
        'FROZEN_PRACTICE_RUN',
        JSON.stringify(frozen),
        'Return JSON with approach, learnerDecisions, strengths, mistakes, approvals, changedFiles, verificationEvidence, unresolvedIssues, and nextAttemptGuidance arrays. changedFiles may use only structured or workspace-confirmed files. verificationEvidence may use only structured receipts; put Codex-reported verification in unresolvedIssues and label it not independently rerun.'
      ].join('\n'))
      validateProposal(proposal, activity)
      const summary: PracticeRunSummary = {
        ...base,
        approach: proposal.approach,
        learnerDecisions: [...new Set([...structuredLearnerDecisions(run), ...proposal.learnerDecisions])],
        approvals: [...new Set([...structuredLearnerApprovals(run), ...proposal.approvals])],
        changedFiles: summarizedChangedFiles(run, activity),
        verificationEvidence: summarizedVerificationEvidence(run, activity),
        learningSignals: [
          ...proposal.strengths.map((text) => ({ text, basis: 'inferred' as const, sourceRunId: run.runId })),
          ...proposal.mistakes.map((text) => ({ text, basis: 'inferred' as const, sourceRunId: run.runId }))
        ],
        unresolvedIssues: summarizedUnresolvedIssues(run, proposal.unresolvedIssues, activity),
        nextAttemptGuidance: proposal.nextAttemptGuidance,
        summarizedAt: this.now().toISOString(),
        model: 'codex-default',
        quality: 'live'
      }
      if (generation !== this.generation) return summary
      await this.memoryRepository.upsertSummary(summary)
      this.runtime.memory = 'ready'
      return summary
    } catch {
      const summary: PracticeRunSummary = {
        ...base,
        approach: activity?.learnerPrompts.at(-1) ?? 'Chưa ghi nhận được cách tiếp cận.',
        learnerDecisions: structuredLearnerDecisions(run),
        approvals: [...new Set([...structuredLearnerApprovals(run), ...(activity?.approvalEvents ?? [])])],
        changedFiles: summarizedChangedFiles(run, activity),
        verificationEvidence: summarizedVerificationEvidence(run, activity),
        learningSignals: [],
        unresolvedIssues: summarizedUnresolvedIssues(run, [
          'Cần Triết hoàn thiện bản tóm tắt khi kết nối được khôi phục.'
        ], activity),
        nextAttemptGuidance: [],
        summarizedAt: this.now().toISOString(),
        model: 'fallback',
        quality: 'pending-refinement'
      }
      if (generation !== this.generation) return summary
      await this.memoryRepository.upsertSummary(summary)
      this.runtime.memory = 'pending'
      return summary
    }
  }

  private refinePendingSummaries(): Promise<void> {
    if (this.refinement) return this.refinement
    const task = (async () => {
      const generation = this.generation
      const memory = await this.memoryRepository.load()
      const pending = Object.values(memory.practiceSummaries)
        .flat()
        .filter((summary) => summary.quality === 'pending-refinement')
      for (const summary of pending) {
        try {
          const [activity, conversation] = await Promise.all([
            this.activityRepository.load(summary.runId),
            this.chatRepository.loadConversation()
          ])
          const frozen = {
            priorSummary: summary,
            activity,
            teacherChat: conversation.messages.filter((message) => message.practiceRunId === summary.runId)
          }
          const proposal = await this.summaryInference.summarize([
            'FROZEN_PRACTICE_RUN',
            JSON.stringify(frozen),
            'Return JSON with approach, learnerDecisions, strengths, mistakes, approvals, changedFiles, verificationEvidence, unresolvedIssues, and nextAttemptGuidance arrays. changedFiles may use only structured or workspace-confirmed files. verificationEvidence may use only structured receipts; put Codex-reported verification in unresolvedIssues and label it not independently rerun.'
          ].join('\n'))
          validateProposal(proposal, activity)
          if (generation !== this.generation) return
          await this.memoryRepository.upsertSummary({
            ...summary,
            approach: proposal.approach,
            learnerDecisions: [...new Set([...summary.learnerDecisions, ...proposal.learnerDecisions])],
            approvals: [...new Set([...summary.approvals, ...proposal.approvals])],
            changedFiles: [...new Set([...summary.changedFiles, ...groundedChangedFiles(activity)])],
            verificationEvidence: [...new Set([
              ...summary.verificationEvidence,
              ...groundedVerificationEvidence(activity)
            ])],
            learningSignals: [
              ...proposal.strengths.map((text) => ({ text, basis: 'inferred' as const, sourceRunId: summary.runId })),
              ...proposal.mistakes.map((text) => ({ text, basis: 'inferred' as const, sourceRunId: summary.runId }))
            ],
            unresolvedIssues: [...new Set([
              ...summary.unresolvedIssues,
              ...groundedUnresolvedIssues(proposal.unresolvedIssues, activity)
            ])],
            nextAttemptGuidance: [...new Set([
              ...summary.nextAttemptGuidance,
              ...proposal.nextAttemptGuidance
            ])],
            summarizedAt: this.now().toISOString(),
            model: 'codex-default',
            quality: 'live'
          })
        } catch {
          // Keep the grounded fallback and retry after the next successful connection/load.
        }
      }
      if (generation !== this.generation) return
      this.runtime.memory = this.memoryRepository.hasPending(await this.memoryRepository.load()) ? 'pending' : 'ready'
    })()
    this.refinement = task.finally(() => {
      this.refinement = null
    })
    return this.refinement
  }

  async activatePracticeRun(runId: string): Promise<void> {
    if (!runId || this.responseRunId === runId) return
    this.responseRunId = runId
    this.generation += 1
    await this.inference.resetTransport(true)
    await Promise.allSettled([...this.activeSends])
    this.runtime = {
      ...this.runtime,
      connection: this.simulated
        ? 'simulated'
        : this.transportState === 'connected' ? 'ready' : this.transportStarted ? 'offline' : 'connecting',
      error: undefined
    }
  }

  async leavePracticeRun(runId: string): Promise<void> {
    if (this.boundRunId === runId) this.boundRunId = null
    if (this.responseRunId === runId) {
      this.responseRunId = null
      this.generation += 1
      await this.inference.resetTransport(true)
      await Promise.allSettled([...this.activeSends])
    }
    await this.activityObserver.reset()
  }

  async reset(): Promise<void> {
    this.boundRunId = null
    this.responseRunId = null
    this.generation += 1
    await Promise.all([
      this.inference.resetTransport(true),
      this.summaryInference.resetTransport(true)
    ])
    await Promise.allSettled([...this.activeSends])
    this.runtime = {
      connection: this.simulated
        ? 'simulated'
        : this.transportState === 'connected' ? 'ready' : this.transportStarted ? 'offline' : 'connecting',
      memory: 'ready',
      contextFreshness: 'unavailable'
    }
    await this.activityObserver.reset()
    await Promise.all([
      this.chatRepository.reset(),
      this.memoryRepository.reset(),
      this.activityRepository.reset()
    ])
  }

  dispose(): Promise<void> {
    this.activityObserver.dispose()
    return Promise.all([
      this.inference.dispose(),
      this.summaryInference.dispose()
    ]).then(() => undefined)
  }
}

function groundedChangedFiles(
  activity: Awaited<ReturnType<ExecutorActivityRepository['load']>>
): string[] {
  return [...new Set([
    ...(activity?.changedFiles ?? []),
    ...(activity?.workspaceConfirmedChangedFiles ?? []),
    ...(activity?.workspaceCommittedReportedFilesSinceRunStart ?? [])
  ])]
}

function structuredLearnerDecisions(run: PracticeRunRecord): string[] {
  return Object.entries(run.learnerDecisions).map(([key, value]) => `${key}: ${value}`)
}

function structuredLearnerApprovals(run: PracticeRunRecord): string[] {
  return Object.entries(run.learnerApprovals).map(([path, approval]) => (
    `${path}: ${approval.decision} (${Object.values(approval.artifactDigests).join(', ')})`
  ))
}

function summarizedChangedFiles(
  run: PracticeRunRecord,
  activity: Awaited<ReturnType<ExecutorActivityRepository['load']>>
): string[] {
  return [...new Set([
    ...groundedChangedFiles(activity),
    ...(run.evidence?.planningArtifacts ?? []).map((artifact) => artifact.path)
  ])]
}

function summarizedVerificationEvidence(
  run: PracticeRunRecord,
  activity: Awaited<ReturnType<ExecutorActivityRepository['load']>>
): string[] {
  return [...new Set([
    ...groundedVerificationEvidence(activity),
    ...(run.reviewResult?.criteria ?? [])
      .filter((criterion) => criterion.status === 'satisfied')
      .map((criterion) => `${criterion.criterionId}: ${criterion.explanation}`)
  ])]
}

function groundedVerificationEvidence(
  activity: Awaited<ReturnType<ExecutorActivityRepository['load']>>
): string[] {
  return [...new Set(activity?.verificationEvidence ?? [])]
}

function groundedUnresolvedIssues(
  proposed: string[],
  activity: Awaited<ReturnType<ExecutorActivityRepository['load']>>
): string[] {
  return [...new Set([
    ...proposed,
    ...(activity?.reportedVerificationEvidence ?? []).map((item) => (
      'Codex-reported verification, not independently rerun: ' + item
    )),
    ...(activity?.workspaceCurrentlyDirtyReportedFiles ?? []).map((item) => (
      'Currently dirty and report-matching, but not attributable without a Practice baseline: ' + item
    ))
  ])]
}

function summarizedUnresolvedIssues(
  run: PracticeRunRecord,
  proposed: string[],
  activity: Awaited<ReturnType<ExecutorActivityRepository['load']>>
): string[] {
  return [...new Set([
    ...groundedUnresolvedIssues(proposed, activity),
    ...run.invalidations.map((item) => `${item.reason} Tiếp theo: ${item.nextAction}`),
    ...(run.reviewResult?.criteria ?? [])
      .filter((criterion) => criterion.status !== 'satisfied')
      .map((criterion) => criterion.explanation)
  ])]
}

function validateProposal(
  proposal: RunSummaryProposal,
  activity: Awaited<ReturnType<ExecutorActivityRepository['load']>>
): void {
  const subset = (values: string[], allowed: string[]) => values.every((value) => allowed.includes(value))
  const allowedFiles = [...new Set([...(activity?.changedFiles ?? []), ...(activity?.workspaceConfirmedChangedFiles ?? []), ...(activity?.workspaceCommittedReportedFilesSinceRunStart ?? [])])]
  if (!subset(proposal.changedFiles, allowedFiles)) throw new Error('Teacher summary introduced an unknown file')
  if (!subset(proposal.approvals, activity?.approvalEvents ?? [])) throw new Error('Teacher summary introduced an unknown approval')
  if (!subset(proposal.verificationEvidence, activity?.verificationEvidence ?? [])) throw new Error('Teacher summary introduced unknown evidence')
}

function teacherFailureMessage(error: unknown): string {
  if (!(error instanceof TeacherInferenceError)) {
    return 'Triết gặp lỗi không xác định. Tin nhắn đã được lưu; hãy thử lại.'
  }
  if (error.code === 'TEACHER_CONTEXT_CHANGED') {
    return 'Bước học vừa thay đổi khi Triết đang trả lời. Hãy gửi lại câu hỏi ở bước hiện tại.'
  }
  if (error.code === 'TEACHER_TIMEOUT') {
    return 'Triết phản hồi quá thời gian. Tin nhắn đã được lưu; hãy thử lại.'
  }
  if (error.code === 'TEACHER_MODEL_UNAVAILABLE' || /newer version|upgrade/i.test(error.message)) {
    return 'Codex hiện tại không có model tương thích cho Triết. Hãy cập nhật Codex rồi thử lại.'
  }
  return 'Triết tạm thời chưa thể phản hồi. Tin nhắn đã được lưu; hãy thử lại.'
}

function teacherContextFailureMessage(error: unknown): string {
  if (!(error instanceof TeacherCourseContextError)) {
    return 'Triết chưa thể tải ngữ cảnh bài học. Hãy thử lại.'
  }
  if (error.code === 'COURSE_CONTEXT_TOO_LARGE') {
    return 'Ngữ cảnh bài học hiện quá lớn để Triết tải an toàn. Hãy thử lại sau khi nội dung được kiểm tra.'
  }
  if (error.code === 'COURSE_CONTEXT_INVALID_PROGRESS') {
    return 'Bước học hiện tại chưa đồng bộ. Hãy quay lại bài học rồi thử hỏi Triết lần nữa.'
  }
  return 'Triết chưa thể tải đầy đủ nội dung bài học. Hãy thử lại.'
}

function teacherProgressIdentity(progress: LearnerProgress): string {
  return sourceDigest({
    lessonId: progress.currentLessonId,
    courseLessonId: progress.currentCourseLessonId,
    checkpointId: progress.checkpointId,
    sceneId: progress.sceneId,
    completedCheckpointIds: progress.completedCheckpointIds,
    decisions: progress.decisions,
    practice: progress.practice,
    updatedAt: progress.updatedAt
  })
}
