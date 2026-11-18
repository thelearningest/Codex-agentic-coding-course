import { isSetupEffort, setupSettings } from '../../shared/setup-settings'
import { createHash } from 'node:crypto'
import type {
  PracticeCompletionReceipt,
  PracticeDefinition,
  PracticeReviewResult,
  PracticeReviewSuccess
} from '../../shared/contracts'
import type { ExecutorActivitySnapshotReader } from './executor-activity-snapshot-reader'
import type { PracticeCoordinator } from './practice-coordinator'
import type { ProgressRepository } from './progress-repository'
import { PracticeDefinitionRepository } from './practice-definition-repository'
import {
  derivePracticeChecklist,
  parsePracticeReviewResult,
  reviewSourceDigest
} from './practice-review-contracts'
import {
  buildPracticeReviewEnvelope,
  type PracticeReviewEnvelope
} from './practice-review-context'
import type { PracticeReviewEvaluator } from './practice-review-evaluator'
import { PracticeRunRepository, type PracticeRunRecord } from './practice-run-repository'
import type { PracticeEvidenceAdapterRegistry } from './practice-evidence-adapter-registry'
import { reconcilePlanningStepState } from './practice-step-state'
import { currentPortfolioPackageApproval, isReviewedPortfolioPackage } from './portfolio-package-state'
import { portfolioActivityUnavailable } from './portfolio-activity-availability'

function evaluateConfiguration(
  envelope: PracticeReviewEnvelope,
  definition: PracticeDefinition,
  runId: string,
  reviewedAt: string
): PracticeReviewResult {
  const configuration = envelope.configuration
  const fresh = configuration?.freshness === 'fresh' && configuration.connection === 'connected'
  const criteria = setupSettings.map((check) => {
    const value = configuration?.[check.key]
    const status = !fresh || !value || value.protocolValue === null
      ? 'unverifiable' as const
      : check.matches(value.protocolValue)
        ? 'satisfied' as const
        : 'unsatisfied' as const
    return {
      criterionId: check.criterionId,
      status,
      evidenceRefs: value ? ['configuration-' + check.key] : [],
      explanation: status === 'satisfied'
        ? check.label + ' đang khớp: ' + (value?.label ?? value?.protocolValue) + '.'
        : status === 'unsatisfied'
          ? check.label + ' hiện là ' + (value?.label ?? value?.protocolValue ?? 'không rõ')
            + '; cần ' + check.expectedLabel + '.'
          : 'Triết chưa đọc được ' + check.label + ' hiện tại. Mở đúng task Codex rồi thử kiểm tra lại.'
    }
  })
  const passed = criteria.every((criterion) => criterion.status === 'satisfied')
  return {
    schemaVersion: 1,
    practiceId: definition.practiceId,
    practiceVersion: definition.version,
    runId,
    verdict: passed ? 'passed' : 'needs-work',
    criteria,
    summary: passed
      ? 'Triết đã xác minh trực tiếp: cả bốn thiết lập của task đều khớp cấu hình khuyến nghị.'
      : 'Triết chưa thể xác nhận cấu hình an toàn vì còn giá trị chưa khớp hoặc chưa xác minh được.',
    reviewedAt,
    sourceDigest: reviewSourceDigest({
      practiceId: definition.practiceId,
      practiceVersion: definition.version,
      runId,
      configuration: configuration ?? null,
      criteria
    })
  }
}

function configurationIdentity(
  configuration: import('../../shared/contracts').CodexTaskConfigurationSnapshot | null
): string | null {
  if (!configuration) return null
  return JSON.stringify({
    freshness: configuration.freshness,
    connection: configuration.connection,
    reasoningEffort: configuration.reasoningEffort,
    serviceTier: configuration.serviceTier,
    approvalPolicy: configuration.approvalPolicy,
    fullAccess: configuration.fullAccess,
    sandboxType: configuration.sandboxType,
    activePermissionProfile: configuration.activePermissionProfile
  })
}

export class PracticeReviewService {
  private readonly pending = new Map<string, Promise<PracticeReviewSuccess>>()
  private lastReturnedCompletion: PracticeCompletionReceipt | null = null

  constructor(
    private readonly definitions: PracticeDefinitionRepository,
    private readonly runs: PracticeRunRepository,
    private readonly coordinator: PracticeCoordinator,
    private readonly progress: ProgressRepository,
    private readonly activity: Pick<ExecutorActivitySnapshotReader, 'read'>,
    private readonly evaluator: PracticeReviewEvaluator,
    private readonly now: () => Date = () => new Date(),
    private readonly evidenceAdapters?: PracticeEvidenceAdapterRegistry,
    private readonly releaseExecutor?: () => Promise<void>
  ) {}

  review(): Promise<PracticeReviewSuccess> {
    return this.reviewCurrentRun()
  }

  private async reviewCurrentRun(): Promise<PracticeReviewSuccess> {
    const active = (await this.runs.load()).activeRun
    if (!active) throw new Error('Kh\u00f4ng c\u00f3 Practice \u0111ang ho\u1ea1t \u0111\u1ed9ng \u0111\u1ec3 duy\u1ec7t.')
    const key = [active.runId, active.generation, active.practiceId, active.practiceVersion].join(':')
    const pending = this.pending.get(key)
    if (pending) return pending
    const operation = this.reviewDirect(active).finally(() => {
      if (this.pending.get(key) === operation) this.pending.delete(key)
    })
    this.pending.set(key, operation)
    return operation
  }

  private async reviewDirect(active: PracticeRunRecord): Promise<PracticeReviewSuccess> {
    try {
      return await this.reviewWithOwnership(active)
    } finally {
      await this.releaseExecutor?.()
    }
  }

  private async reviewWithOwnership(active: PracticeRunRecord): Promise<PracticeReviewSuccess> {
    const definition = await this.definitions.load(active.practiceId, active.practiceVersion)
    const reviewedAt = this.now().toISOString()
    let reviewRun = active
    const portfolioPackage = isReviewedPortfolioPackage(active)
    let activity = definition.evidenceProfile === 'planning-package' || portfolioPackage
      ? await this.activity.read(active.binding)
      : null
    if (definition.evidenceProfile === 'codex-task-configuration') {
      activity = await this.activity.read(active.binding)
      const refreshed = await this.runs.saveConfiguration({
        runId: active.runId,
        generation: active.generation,
        practiceId: active.practiceId,
        practiceVersion: active.practiceVersion,
        configuration: activity.configuration,
        updatedAt: activity.configuration?.observedAt ?? reviewedAt
      })
      if (!refreshed.activeRun
        || refreshed.activeRun.runId !== active.runId
        || refreshed.activeRun.generation !== active.generation) {
        throw new Error('Practice đã thay đổi trước khi Triết thu thập cấu hình task.')
      }
      if (active.completion && !refreshed.activeRun.completion) {
        await this.progress.revokePracticeCompletion(active.completion)
      }
      reviewRun = refreshed.activeRun
    }
    if (activity?.status === 'working' || activity?.status === 'waiting-for-learner') {
      throw new Error('PRACTICE_SNAPSHOT_BUSY')
    }
    if (definition.evidenceProfile === 'planning-package' || portfolioPackage) {
      if (!this.evidenceAdapters) throw new Error('Module 2 evidence adapter is unavailable.')
      const evidence = await this.evidenceAdapters.resolve(definition.evidenceProfile).collect({
        definition,
        runId: active.runId,
        generation: active.generation,
        workspaceRoot: active.binding.workspaceRoot,
        allowedLegacyArtifactPaths: active.allowedLegacyArtifactPaths,
        task: {
          threadId: active.binding.threadId,
          workspaceRoot: active.binding.workspaceRoot
        }
      })
      const refreshed = await this.runs.saveEvidence({
        runId: active.runId,
        generation: active.generation,
        practiceId: active.practiceId,
        practiceVersion: active.practiceVersion,
        evidence,
        checklist: active.checklist,
        invalidations: evidence.invalidations,
        updatedAt: evidence.observedAt
      })
      if (!refreshed.activeRun
        || refreshed.activeRun.runId !== active.runId
        || refreshed.activeRun.generation !== active.generation) {
        throw new Error('Practice đã thay đổi trước khi Triết thu thập bằng chứng.')
      }
      reviewRun = refreshed.activeRun
    }
    const reviewing = await this.runs.beginReview({
      runId: reviewRun.runId,
      generation: reviewRun.generation,
      practiceId: definition.practiceId,
      practiceVersion: definition.version,
      updatedAt: reviewedAt
    })
    if (reviewing.activeRun?.runId !== reviewRun.runId
      || reviewing.activeRun.generation !== reviewRun.generation
      || reviewing.activeRun.reviewStatus !== 'reviewing') {
      throw new Error('Practice đã thay đổi trước khi Triết bắt đầu duyệt.')
    }

    try {
      const progressResult = await this.progress.load()
      const learnerProgress = progressResult.status === 'returning' || progressResult.status === 'recovered'
        ? progressResult.progress
        : null
      if (!learnerProgress) throw new Error('Kh\u00f4ng th\u1ec3 t\u1ea3i ti\u1ebfn tr\u00ecnh kh\u00f3a h\u1ecdc \u0111\u1ec3 duy\u1ec7t Practice.')

      activity ??= await this.activity.read(reviewRun.binding)
      if (portfolioPackage && portfolioActivityUnavailable(activity, reviewRun)) {
        throw new Error('PRACTICE_EVIDENCE_UNAVAILABLE')
      }
      const frozenRun = reviewing.activeRun
      const envelope = buildPracticeReviewEnvelope({
        definition,
        run: frozenRun,
        activity,
        decisions: definition.evidenceProfile === 'planning-package'
          ? frozenRun.learnerDecisions
          : learnerProgress.decisions,
        generatedAt: reviewedAt
      })
      if (envelope.portfolioPackage && !currentPortfolioPackageApproval(frozenRun, learnerProgress.courseRunId)) {
        envelope.portfolioPackage.approved = false
        envelope.evidence = envelope.evidence.filter((reference) => reference.id !== 'portfolio-package-approval')
      }
      const packageFailure = envelope.portfolioPackage && (!envelope.portfolioPackage.ready || !envelope.portfolioPackage.approved)
        ? JSON.stringify({ schemaVersion: 1, practiceId: definition.practiceId, practiceVersion: definition.version, runId: active.runId,
            verdict: 'needs-work', summary: envelope.portfolioPackage?.kind === 'release' ? 'Bài phát hành portfolio chưa sẵn sàng. Kiểm tra hồ sơ triển khai, đường link và xác nhận website hiện tại.' : envelope.portfolioPackage?.kind === 'build' ? 'Bài xây portfolio chưa sẵn sàng. Kiểm tra bằng chứng và chấp nhận website hiện tại.' : 'Gói planning chưa sẵn sàng. Kiểm tra tài liệu và duyệt PRD cùng kế hoạch hiện tại.',
            criteria: definition.criteria.map((criterion) => ({ criterionId: criterion.id, status: 'unverifiable', evidenceRefs: [],
              explanation: (envelope.portfolioPackage!.issues.join('; ') || (envelope.portfolioPackage?.kind === 'release' ? 'Cần hồ sơ triển khai, đường link chia sẻ được và xác nhận website hiện tại.' : envelope.portfolioPackage?.kind === 'build' ? 'Cần đủ hồ sơ thực hành, tệp ứng dụng và xác nhận website hiện tại.' : 'Cần đủ năm tài liệu hợp lệ và phê duyệt PRD cùng kế hoạch hiện tại.')).slice(0, 1000) })) })
        : undefined
      const result = definition.evidenceProfile === 'codex-task-configuration'
        ? evaluateConfiguration(envelope, definition, active.runId, reviewedAt)
        : parsePracticeReviewResult({
            text: packageFailure ?? await this.evaluator.evaluate(envelope),
            definition,
            runId: active.runId,
            evidence: envelope.evidence,
            reviewedAt,
            planningEvidenceDigest: envelope.planning?.evidenceDigest ?? envelope.portfolioPackage?.evidenceDigest,
            portfolioPackage: envelope.portfolioPackage
          })
      if (definition.evidenceProfile === 'codex-task-configuration') {
        const latestActivity = await this.activity.read(reviewRun.binding)
        if (latestActivity.status === 'working' || latestActivity.status === 'waiting-for-learner') {
          throw new Error('PRACTICE_SNAPSHOT_BUSY')
        }
        if (configurationIdentity(latestActivity.configuration) !== configurationIdentity(activity.configuration)) {
          throw new Error('PRACTICE_EVIDENCE_CHANGED')
        }
        activity = latestActivity
      }
      if (definition.evidenceProfile === 'planning-package' || portfolioPackage) {
        const latestActivity = await this.activity.read(reviewRun.binding)
        activity = latestActivity
        if (latestActivity.status === 'working' || latestActivity.status === 'waiting-for-learner') throw new Error('PRACTICE_SNAPSHOT_BUSY')
        if (portfolioPackage && portfolioActivityUnavailable(latestActivity, reviewRun)) {
          throw new Error('PRACTICE_EVIDENCE_UNAVAILABLE')
        }
        const latestEvidence = await this.evidenceAdapters!.resolve(definition.evidenceProfile).collect({
          definition,
          runId: reviewRun.runId,
          generation: reviewRun.generation,
          workspaceRoot: reviewRun.binding.workspaceRoot,
          allowedLegacyArtifactPaths: reviewRun.allowedLegacyArtifactPaths,
          task: {
            threadId: reviewRun.binding.threadId,
            workspaceRoot: reviewRun.binding.workspaceRoot
          }
        })
        const latestWorkspace = await this.runs.saveEvidence({
          runId: reviewRun.runId,
          generation: reviewRun.generation,
          practiceId: reviewRun.practiceId,
          practiceVersion: reviewRun.practiceVersion,
          evidence: latestEvidence,
          checklist: frozenRun.checklist,
          invalidations: latestEvidence.invalidations,
          updatedAt: latestEvidence.observedAt
        })
        const latestRun = latestWorkspace.activeRun
        if (!latestRun
          || latestRun.runId !== reviewRun.runId
          || latestRun.generation !== reviewRun.generation) {
          throw new Error('Practice đã thay đổi trong khi Triết đang duyệt.')
        }
        if (!portfolioPackage && frozenRun.completion && !latestRun.completion) {
          await this.progress.revokePracticeCompletion(frozenRun.completion)
        }
        const latestEnvelope = buildPracticeReviewEnvelope({
          definition,
          run: latestRun,
          activity: latestActivity,
          decisions: latestRun.learnerDecisions,
          generatedAt: reviewedAt
        })
        const frozenDigest = envelope.planning?.evidenceDigest ?? envelope.portfolioPackage?.evidenceDigest
        const latestDigest = latestEnvelope.planning?.evidenceDigest ?? latestEnvelope.portfolioPackage?.evidenceDigest
        if (!frozenDigest || latestDigest !== frozenDigest || ((envelope.portfolioPackage?.kind === 'build' || envelope.portfolioPackage?.kind === 'release') && JSON.stringify(envelope.portfolioPackage.taskEvidence) !== JSON.stringify(latestEnvelope.portfolioPackage?.taskEvidence))) {
          throw new Error('Artifact hoặc quyết định của Practice đã thay đổi trong khi Triết đang duyệt. Kết quả cũ không được lưu.')
        }
        reviewRun = latestRun
      }
      const checklist = definition.evidenceProfile === 'planning-package'
        ? reconcilePlanningStepState({
            checklist: reviewRun.checklist,
            previousEvidence: reviewRun.evidence,
            evidence: reviewRun.evidence!,
            learnerDecisions: reviewRun.learnerDecisions,
            learnerApprovals: reviewRun.learnerApprovals,
            priorInvalidations: reviewRun.invalidations,
            reviewStatus: result.verdict,
            hasCompletion: false
          }).checklist
        : derivePracticeChecklist(definition, result, active.checklist)
      const generatedCompletion: PracticeCompletionReceipt | undefined = result.verdict === 'passed'
        ? {
            schemaVersion: 1,
            courseRunId: learnerProgress.courseRunId,
            practiceId: definition.practiceId,
            practiceVersion: definition.version,
            runId: active.runId,
            checkpointId: definition.checkpointId,
            status: 'completed',
            completedAt: reviewedAt,
            evidenceSummary: result.summary,
            masterySummary: envelope.portfolioPackage?.kind === 'release'
              ? 'Đã duyệt phiên bản portfolio trên mạng, kết quả kiểm tra đường link và xác nhận hiện tại của người học. Module 4 không có bài kiểm tra cuối.' : envelope.portfolioPackage?.kind === 'build'
              ? 'Đã đối chiếu kế hoạch, kết quả kiểm tra theo PRD và xác nhận website hiện tại; phần tổng kết vẫn cần hoàn thành.'
              : portfolioPackage
              ? 'Năm tài liệu đã được kiểm tra cấu trúc, phạm vi và nội dung; PRD và kế hoạch được người học duyệt trên phiên bản hiện tại.'
              : definition.evidenceProfile === 'planning-package'
              ? 'Triết đã duyệt semantic PRD, implementation plan, alignment, phạm vi và quyền sở hữu của người học trên đúng hai digest hiện tại.'
              : 'Triết đã xác minh đủ bốn thiết lập Codex bắt buộc từ metadata hiệu lực của đúng task.',
            destination: structuredClone(definition.completionDestination),
            ...(portfolioPackage ? { submissionDigest: envelope.portfolioPackage!.evidenceDigest } : {}),
            ...((envelope.portfolioPackage?.kind === 'build' || envelope.portfolioPackage?.kind === 'release')
              ? { taskEvidenceDigest: createHash('sha256').update(JSON.stringify(envelope.portfolioPackage.taskEvidence ?? null)).digest('hex') } : {}),
            ...(definition.practiceId === 'm1-codex-safe-setup' && envelope.configuration && isSetupEffort(envelope.configuration.reasoningEffort.protocolValue)
              ? {
                  approvedConfiguration: {
                    schemaVersion: 1 as const,
                    sourcePracticeId: 'm1-codex-safe-setup' as const,
                    sourcePracticeVersion: definition.version,
                    ...(envelope.configuration.model.protocolValue
                      ? { model: envelope.configuration.model.protocolValue } : {}),
                    reasoningEffort: envelope.configuration.reasoningEffort.protocolValue,
                    serviceTier: 'standard' as const,
                    approvedAt: reviewedAt
                  }
                }
              : {})
          }
        : undefined
      const priorPackageCompletion = portfolioPackage && generatedCompletion
        ? learnerProgress.practiceCompletions.find((receipt) => receipt.courseRunId === learnerProgress.courseRunId
            && receipt.practiceId === active.practiceId && receipt.practiceVersion === active.practiceVersion
            && receipt.runId === active.runId && receipt.checkpointId === definition.checkpointId
            && receipt.submissionDigest === generatedCompletion.submissionDigest
            && receipt.taskEvidenceDigest === generatedCompletion.taskEvidenceDigest) : undefined
      const completion = priorPackageCompletion ?? (generatedCompletion
        && reviewRun.completion
        && reviewRun.reviewResult?.sourceDigest === result.sourceDigest
        && reviewRun.completion.taskEvidenceDigest === generatedCompletion.taskEvidenceDigest
        ? structuredClone(reviewRun.completion)
        : generatedCompletion)
      if (portfolioPackage) {
        const latestProgress = await this.progress.load()
        if ((latestProgress.status !== 'returning' && latestProgress.status !== 'recovered')
          || latestProgress.progress.courseRunId !== learnerProgress.courseRunId) throw new Error('The course changed during portfolio review')
      }
      const saved = await this.runs.saveReview({
        runId: reviewRun.runId,
        generation: reviewRun.generation,
        practiceId: definition.practiceId,
        practiceVersion: definition.version,
        result,
        checklist,
        completion,
        ...(portfolioPackage ? { expectedPackageDigest: reviewRun.evidence?.sourceDigest ?? undefined } : {}),
        updatedAt: reviewedAt
      })
      if (saved.activeRun?.runId !== reviewRun.runId
        || saved.activeRun.generation !== reviewRun.generation
        || saved.activeRun.reviewResult?.sourceDigest !== result.sourceDigest) {
        throw new Error('Practice đã thay đổi trong khi Triết đang duyệt. Kết quả cũ không được lưu.')
      }
      if (!portfolioPackage && reviewRun.completion && !saved.activeRun.completion) {
        await this.progress.revokePracticeCompletion(reviewRun.completion)
      }
      if (!portfolioPackage && reviewRun.completion && saved.activeRun.completion
        && JSON.stringify(reviewRun.completion) !== JSON.stringify(saved.activeRun.completion)) {
        await this.progress.revokePracticeCompletion(reviewRun.completion)
      }
      if (saved.activeRun.completion) {
        await this.progress.recordPracticeCompletion(saved.activeRun.completion)
      }

      const workspace = await this.coordinator.loadWorkspace({
          practiceId: active.practiceId,
          practiceVersion: active.practiceVersion
        })
      return { workspace: envelope.configuration
        ? { ...workspace, configuration: structuredClone(envelope.configuration) }
        : workspace }
    } catch (error) {
      await this.runs.clearReviewing({
        runId: active.runId,
        generation: active.generation,
        practiceId: definition.practiceId,
        practiceVersion: definition.version,
        updatedAt: this.now().toISOString()
      }).catch(() => undefined)
      throw error
    }
  }

  async passedCompletion(): Promise<PracticeCompletionReceipt> {
    const active = (await this.runs.load()).activeRun
    if (!active || active.reviewStatus !== 'passed' || !active.completion) {
      throw new Error('Practice chưa được Triết xác nhận là đã đạt.')
    }
    return structuredClone(active.completion)
  }

  async returnPassedPractice(): Promise<PracticeCompletionReceipt> {
    const active = (await this.runs.load()).activeRun
    if (!active) {
      if (this.lastReturnedCompletion) return structuredClone(this.lastReturnedCompletion)
      throw new Error('Practice chưa được Triết xác nhận là đã đạt.')
    }
    if (isReviewedPortfolioPackage(active)) {
      if (active.reviewStatus !== 'passed' || !active.completion || !this.evidenceAdapters) throw new Error('Portfolio package has not passed review')
      const definition = await this.definitions.load(active.practiceId, active.practiceVersion)
      const activity = await this.activity.read(active.binding)
      if (['working', 'waiting-for-learner'].includes(activity.status)
        || portfolioActivityUnavailable(activity, active)) throw new Error('PRACTICE_EVIDENCE_UNAVAILABLE')
      const evidence = await this.evidenceAdapters.resolve(definition.evidenceProfile).collect({ definition, runId: active.runId,
        generation: active.generation, workspaceRoot: active.binding.workspaceRoot,
        task: { threadId: active.binding.threadId, workspaceRoot: active.binding.workspaceRoot }, allowedLegacyArtifactPaths: active.allowedLegacyArtifactPaths })
      const saved = await this.runs.saveEvidence({ ...active, evidence, invalidations: evidence.invalidations, updatedAt: evidence.observedAt })
      const run = saved.activeRun
      const latestEnvelope = run ? buildPracticeReviewEnvelope({ definition, run, activity, generatedAt: evidence.observedAt }) : null
      if ((latestEnvelope?.portfolioPackage?.kind === 'build' || latestEnvelope?.portfolioPackage?.kind === 'release')
        && active.completion.taskEvidenceDigest !== createHash('sha256').update(JSON.stringify(latestEnvelope.portfolioPackage.taskEvidence ?? null)).digest('hex')) {
        await this.runs.invalidatePortfolioTaskReview({ ...active, expectedTaskEvidenceDigest: active.completion.taskEvidenceDigest,
          updatedAt: this.now().toISOString() })
        await this.progress.revokePracticeCompletion(active.completion)
        throw new Error('Task evidence changed after review; submit a fresh review before returning')
      }
      if (!run || run.runId !== active.runId || run.generation !== active.generation || !run.completion
        || !currentPortfolioPackageApproval(run, active.completion.courseRunId)
        || buildPracticeReviewEnvelope({ definition, run, activity, generatedAt: evidence.observedAt }).portfolioPackage?.evidenceDigest !== active.completion.submissionDigest) {
        throw new Error('The portfolio package changed; approve and submit it again')
      }
    } else await this.review()
    const receipt = await this.passedCompletion()
    await this.progress.returnFromPractice(receipt)
    await this.runs.closeCompletedRun({
      runId: active.runId,
      generation: active.generation,
      practiceId: active.practiceId,
      practiceVersion: active.practiceVersion,
      updatedAt: this.now().toISOString()
    })
    this.lastReturnedCompletion = structuredClone(receipt)
    return receipt
  }
}
