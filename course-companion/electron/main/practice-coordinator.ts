import { randomUUID } from 'node:crypto'
import { portfolioContinuationInstructions } from './portfolio-continuation-instructions'
import { portfolioBuildSliceIds } from '../../shared/contracts'
import type { PortfolioPackageApprovalRequest, PortfolioPackageHandoff } from '../../shared/contracts'
import { currentPortfolioPackageApproval, isPortfolioPackage, isPortfolioBuildPackage, isPortfolioReleasePackage, isReviewedPortfolioPackage, portfolioPackageEvidence, portfolioPackageIsReady } from './portfolio-package-state'
import type {
  ApprovedCodexConfiguration,
  PracticeAdapterEvidenceState,
  PracticeCompletionReceipt,
  PracticeDefinition,
  PracticeChecklistStep,
  PracticeIdentity,
  PracticeTaskOpenRequest,
  PracticePanelUpdate,
  PlanningPracticeActionRequest,
  PortfolioStageActionRequest,
  PracticeStartRequest,
  PracticeWorkspaceAdapter,
  PracticeWorkspaceView
} from '../../shared/contracts'
import type { ExecutorChatCoordinator } from './executor-chat-coordinator'
import { PracticeDefinitionRepository } from './practice-definition-repository'
import {
  type PortfolioPackageMigrationRecovery,
  type ExecutorChatBinding,
  type PracticeRunRecord,
  type PracticeTransitionRecord,
  type PracticeWorkspaceRecord,
  PracticeRunRepository
} from './practice-run-repository'
import {
  selectiveTransferCapability,
  selectiveTransferUnavailable
} from './selective-handoff'
import type { PracticeEvidenceAdapterRegistry } from './practice-evidence-adapter-registry'
import { derivePracticeReviewComparison } from './practice-review-comparison'

function initialChecklist(definition: PracticeDefinition): PracticeChecklistStep[] {
  return definition.checklist.map((step, index) => ({
    id: step.id,
    title: step.title,
    status: index === 0 ? 'current' : 'pending',
    dependencyInputs: {}
  }))
}

function transitionLabel(transition: PracticeTransitionRecord, failed: boolean): string {
  if (transition.practiceId === 'm3-portfolio-build' || transition.practiceId === 'm4-portfolio-release') {
    if (failed) return 'Chưa thể tiếp tục task Codex đã bàn giao.'
    return transition.stage === 'creating-target'
      ? 'Đang kiểm tra task Codex đã bàn giao…'
      : 'Đang kết nối lại task Codex đã bàn giao…'
  }
  return transition.stage === 'creating-target'
    ? 'Đang tạo task Codex mới…'
    : 'Đang xác nhận task Codex mới…'
}

function safeCreationError(error: unknown): string {
  const message = error instanceof Error ? error.message : ''
  if (message === 'PORTFOLIO_RELEASE_CONTINUATION_UNAVAILABLE') {
    return 'Chưa thể tiếp tục task portfolio từ Module 3. Hãy kiểm tra bàn giao và kết nối lại đúng task; dữ liệu đã lưu vẫn được giữ.'
  }
  if (message === 'PORTFOLIO_CONTINUATION_UNAVAILABLE') {
    return 'Chưa thể tiếp tục task portfolio đã bàn giao. Hãy kiểm tra gói planning và kết nối lại đúng task; ứng dụng không tạo task thay thế.'
  }
  if (message === 'Approved Module 1 configuration is required') {
    return 'Bạn cần hoàn thành Practice thiết lập Codex ở Module 1 trước khi bắt đầu Practice này.'
  }
  if (message === 'Codex created an Executor task with incompatible safety settings' ||
      message === 'Codex returned incomplete effective task settings') {
    return 'Codex chưa áp dụng đúng cấu hình an toàn đã duyệt ở Module 1. Không có chỉ dẫn nào được gửi vào task.'
  }
  if (message === 'Codex created the Executor task in an unexpected workspace') {
    return 'Task Codex không nằm trong Pilot workspace đã được Course Companion xác nhận. Không có chỉ dẫn nào được gửi.'
  }
  if (message === 'Codex could not read the Executor chat after creation') {
    return 'Task Codex đã được tạo nhưng ứng dụng chưa đọc lại được dữ liệu đã lưu. Hãy thử lại.'
  }
  if (message === 'Invalid Executor chat binding') {
    return 'Task Codex đã lưu không còn hợp lệ. Hãy hủy lần chuyển này và bắt đầu lại.'
  }
  if (message === 'Codex Executor bootstrap did not close') {
    return 'Course Companion chưa bàn giao được task cho Codex desktop. Hãy thử lại.'
  }
  if (message === 'Codex did not create the Executor chat' ||
      message === 'Codex created an invalid Executor chat') {
    return 'Codex App Server không trả về một task Codex hợp lệ. Hãy thử lại.'
  }
  return 'Không thể tạo task Codex mới. Practice cũ vẫn được giữ nguyên.'
}

function planningWorkspaceView(active: PracticeRunRecord): NonNullable<PracticeWorkspaceView['planning']> {
  const evidence = active.evidence
  const snapshots = new Map(evidence?.planningArtifacts?.map((artifact) => [artifact.path, artifact]))
  const issues = new Map(evidence?.artifactIssues?.map((issue) => [issue.path, issue]))
  const prdDigest = snapshots.get('artifacts/PRD.md')?.digest
  const planDigest = snapshots.get('artifacts/implementation-plan.md')?.digest
  const invalidatedSteps = new Set(active.invalidations.flatMap((item) => item.affectedStepIds))

  const approval = (
    key: 'prd-approval' | 'plan-approval',
    required: Array<'artifacts/PRD.md' | 'artifacts/implementation-plan.md'>
  ): 'approved' | 'pending' | 'revision-requested' | 'stale' => {
    const decision = active.learnerApprovals[key]
    if (!decision) return 'pending'
    if (decision.decision === 'revision-requested') return 'revision-requested'
    return required.every((path) =>
      decision.artifactDigests[path] === snapshots.get(path)?.digest)
      ? 'approved'
      : 'stale'
  }

  const artifact = (path: 'artifacts/PRD.md' | 'artifacts/implementation-plan.md') => {
    const issue = issues.get(path)
    const snapshot = snapshots.get(path)
    const approvalKey = path === 'artifacts/PRD.md' ? 'prd-approval' : 'plan-approval'
    const required = path === 'artifacts/PRD.md'
      ? ['artifacts/PRD.md'] as const
      : ['artifacts/PRD.md', 'artifacts/implementation-plan.md'] as const
    const availability = !snapshot
      ? 'missing' as const
      : issue && issue.code !== 'unchanged'
        ? 'invalid' as const
        : 'available' as const
    const freshness = issue?.code === 'unchanged'
      ? 'stale' as const
      : evidence?.freshness ?? 'unverifiable' as const
    return {
      path,
      availability,
      approval: approval(approvalKey, [...required]),
      freshness,
      ...(issue ? { issue: issue.code } : {})
    }
  }

  const alignmentKey = prdDigest && planDigest ? `${prdDigest}:${planDigest}` : null
  const alignment = invalidatedSteps.has('reconcile-alignment')
    ? 'stale' as const
    : alignmentKey && active.learnerDecisions['alignment-confirmed'] === alignmentKey
      ? 'confirmed' as const
      : 'pending' as const

  return {
    freshness: evidence?.freshness ?? 'unverifiable',
    ...(evidence?.observedAt ? { observedAt: evidence.observedAt } : {}),
    artifacts: [artifact('artifacts/PRD.md'), artifact('artifacts/implementation-plan.md')],
    alignment,
    unexpectedChangedPaths: structuredClone(evidence?.unexpectedChangedPaths ?? []),
    invalidations: structuredClone(active.invalidations),
    actionContext: {
      generation: active.generation,
      ...(evidence?.planningActivity?.cursor
        ? { activityCursor: evidence.planningActivity.cursor }
        : {}),
      ...(prdDigest ? { prdDigest } : {}),
      ...(planDigest ? { planDigest } : {})
    }
  }
}

function isPortfolioProfile(profile: PracticeRunRecord['evidenceProfile']): boolean {
  return profile === 'portfolio-planning'
    || profile === 'portfolio-build'
    || profile === 'portfolio-release'
}

function portfolioPlanningWorkspaceView(
  active: PracticeRunRecord,
  definition: PracticeDefinition
): NonNullable<PracticeWorkspaceView['portfolioPlanning']> {
  const evidence = active.evidence?.portfolioPlanning
  const stageEvidence = new Map(evidence?.stages.map((stage) => [stage.stageId, stage]))
  const receipts = new Map(active.stageReceipts?.map((receipt) => [receipt.stageId, receipt]))
  let priorCurrent = true
  const stages = (definition.stages ?? []).map((stage) => {
    const receipt = receipts.get(stage.id)
    const observed = stageEvidence.get(stage.id)
    const status = receipt?.freshness === 'current'
      ? 'completed' as const
      : receipt?.freshness === 'stale'
        ? 'stale' as const
        : !priorCurrent
          ? 'pending' as const
          : observed?.status === 'ready'
            ? 'ready' as const
            : 'blocked' as const
    priorCurrent = status === 'completed'
    return {
      stageId: stage.id,
      stageIndex: stage.order,
      status,
      artifactPaths: [...stage.requiredArtifactPaths],
      issueCodes: [...(observed?.issueCodes ?? [])],
      ...(receipt?.staleReason ? { staleReason: receipt.staleReason } : {})
    }
  })
  return {
    freshness: active.evidence?.freshness ?? 'unverifiable',
    ...(active.evidence?.observedAt ? { observedAt: active.evidence.observedAt } : {}),
    unexpectedPaths: [...(evidence?.unexpectedPaths ?? [])],
    stages
  }
}

function portfolioBuildWorkspaceView(
  active: PracticeRunRecord,
  definition: PracticeDefinition
): NonNullable<PracticeWorkspaceView['portfolioBuild']> {
  const evidence = active.evidence?.portfolioBuild
  const stageEvidence = new Map(evidence?.stages.map((stage) => [stage.stageId, stage]))
  const receipts = new Map(active.stageReceipts?.map((receipt) => [receipt.stageId, receipt]))
  let priorCurrent = true
  const stages = (definition.stages ?? []).map((stage) => {
    const receipt = receipts.get(stage.id)
    const observed = stageEvidence.get(stage.id)
    const status = receipt?.freshness === 'current'
      ? 'completed' as const
      : receipt?.freshness === 'stale'
        ? 'stale' as const
        : !priorCurrent
          ? 'pending' as const
          : observed?.status === 'ready'
            ? 'ready' as const
            : 'blocked' as const
    priorCurrent = status === 'completed'
    return {
      stageId: stage.id,
      stageIndex: stage.order,
      status,
      artifactPaths: [...stage.requiredArtifactPaths],
      issueCodes: [...(observed?.issueCodes ?? [])],
      ...(receipt?.staleReason ? { staleReason: receipt.staleReason } : {})
    }
  })
  let priorSliceCurrent = true
  const slices = portfolioBuildSliceIds.map((sliceId, index) => {
    const receipt = active.buildSliceReceipts?.find((item) => item.sliceId === sliceId)
    const issueCodes = (evidence?.issues ?? [])
      .filter((item) => item.path === `evidence/module-3/build-log.${sliceId}`)
      .map((item) => item.code)
    const hasDigest = evidence?.artifacts.some((item) =>
      item.path === `evidence/module-3/build-log.${sliceId}` && item.byteLength > 0)
    const status = receipt?.freshness === 'current'
      ? 'completed' as const
      : receipt?.freshness === 'stale'
        ? 'stale' as const
        : !priorSliceCurrent
          ? 'pending' as const
          : hasDigest && issueCodes.length === 0
            ? 'ready' as const
            : 'blocked' as const
    priorSliceCurrent = status === 'completed'
    return {
      sliceId,
      sliceIndex: (index + 1) as 1 | 2 | 3 | 4,
      status,
      issueCodes: [...new Set(issueCodes)],
      ...(receipt?.staleReason ? { staleReason: receipt.staleReason } : {})
    }
  })
  return {
    freshness: active.evidence?.freshness ?? 'unverifiable',
    ...(active.evidence?.observedAt ? { observedAt: active.evidence.observedAt } : {}),
    unexpectedPaths: [...(evidence?.unexpectedPaths ?? [])],
    stages,
    slices
  }
}

export class PracticeCoordinator implements PracticeWorkspaceAdapter {
  private operationTail: Promise<void> = Promise.resolve()
  private lastError = ''

  constructor(
    private readonly repository: PracticeRunRepository,
    private readonly definitions: PracticeDefinitionRepository,
    private readonly executor: Pick<ExecutorChatCoordinator, 'createTarget' | 'prepareTarget' | 'openTarget'>
      & Partial<Pick<ExecutorChatCoordinator, 'validateExistingTarget'>>,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = randomUUID,
    private readonly prepareExecutor?: (binding: PracticeRunRecord['binding'], captureBaseline: boolean) => Promise<void>,
    private readonly loadApprovedConfiguration?: () => Promise<ApprovedCodexConfiguration | null>,
    private readonly evidenceAdapters?: PracticeEvidenceAdapterRegistry,
    private readonly revokeCompletion?: (receipt: PracticeCompletionReceipt) => Promise<unknown>,
    private readonly handoffExecutor?: (openTarget: () => Promise<void>) => Promise<void>,
    private readonly loadPortfolioHandoff?: () => Promise<PortfolioPackageHandoff | null>,
    private readonly loadPortfolioMigrationRecovery?: () => Promise<Omit<PortfolioPackageMigrationRecovery, 'validateTask'> | null>,
    private readonly loadPortfolioReleaseHandoff?: () => Promise<{
      task: ExecutorChatBinding
      workspace: { canonicalPath: string }
      sourceCheckpoint: string
    } | null>
  ) {}

  async loadWorkspace(identity?: PracticeIdentity): Promise<PracticeWorkspaceView> {
    return this.runExclusive(async () => {
      const refreshError = 'Chưa thể làm mới bằng chứng từ Codex. Trạng thái đã lưu vẫn được giữ để bạn kết nối lại.'
      let refreshFailed = false
      let record = await this.repository.load()
      let verifiedArchive: PracticeRunRecord | undefined
      let archiveRefreshFailed = false
      if (identity && isPortfolioBuildPackage(identity) && !record.pendingTransition) {
        const prior = record.activeRun ?? [...record.archivedRuns].reverse().find((archive) =>
          archive.practiceId === identity.practiceId && archive.retainedRun)?.retainedRun
        if (prior?.practiceId === identity.practiceId
          && (!record.activeRun || prior.practiceVersion !== identity.practiceVersion)) {
          const definition = await this.definitions.load(identity.practiceId, identity.practiceVersion)
          if (await this.executor.validateExistingTarget?.(prior.binding, definition).catch(() => false)) {
            if (!record.activeRun && prior.practiceVersion === identity.practiceVersion) {
              try {
                if (!this.evidenceAdapters) throw new Error('Portfolio evidence adapter is unavailable')
                await this.prepareExecutor?.(prior.binding, false)
                const evidence = await this.evidenceAdapters.resolve(prior.evidenceProfile).collect({
                  definition,
                  runId: prior.runId,
                  generation: prior.generation,
                  workspaceRoot: prior.binding.workspaceRoot,
                  allowedLegacyArtifactPaths: prior.allowedLegacyArtifactPaths,
                  task: { threadId: prior.binding.threadId, workspaceRoot: prior.binding.workspaceRoot }
                })
                if (evidence.sourceDigest !== prior.evidence?.sourceDigest) {
                  record = await this.repository.migratePortfolioBuild(definition, prior.binding, this.now().toISOString())
                } else {
                  const current = { ...prior, evidence }
                  if (current.reviewStatus === 'passed' && current.reviewResult?.verdict === 'passed'
                    && current.completion && currentPortfolioPackageApproval(current)) {
                    verifiedArchive = current
                    this.lastError = ''
                  } else {
                    this.lastError = refreshError
                    archiveRefreshFailed = true
                  }
                }
              } catch {
                this.lastError = refreshError
                archiveRefreshFailed = true
              }
            } else {
              record = await this.repository.migratePortfolioBuild(definition, prior.binding, this.now().toISOString())
            }
          } else this.lastError = 'Chưa đọc được task Module 3 cũ. Hãy kết nối lại; tệp và lịch sử vẫn được giữ.'
        }
      }
      if (identity && isPortfolioPackage(identity)) {
        const definition = await this.definitions.load(identity.practiceId, identity.practiceVersion)
        const migration = await this.loadPortfolioMigrationRecovery?.().catch(() => null) ?? null
        record = await this.repository.migratePortfolioPackage(
          definition,
          this.now().toISOString(),
          migration && this.executor.validateExistingTarget
            ? {
                ...migration,
                validateTask: (binding) => this.executor.validateExistingTarget!(binding, definition)
              }
            : undefined)
      }
      if (record.pendingTransition && !this.lastError) {
        this.lastError = 'Lần chuyển trước bị gián đoạn. Bạn có thể thử lại hoặc hủy.'
      }
      try {
        record = await this.refreshPracticeEvidence(record)
        if (this.lastError === refreshError && !archiveRefreshFailed) this.lastError = ''
      } catch {
        this.lastError = refreshError
        refreshFailed = true
      }
      const view = await this.toView(record, identity, verifiedArchive)
      // Keep the saved result visible, but do not offer fresh acceptance when
      // its current task/evidence could not actually be read.
      if (refreshFailed && view.portfolioPackage) view.portfolioPackage.ready = false
      return view
    })
  }

  approvePortfolioPackage(request: PortfolioPackageApprovalRequest): Promise<PracticeWorkspaceView> {
    return this.runExclusive(async () => {
      if (!(isPortfolioBuildPackage(request) || isPortfolioReleasePackage(request) ? 'approveWebsite' in request && request.approveWebsite === true : isPortfolioPackage(request) && 'approvePrd' in request && request.approvePrd === true && request.approvePlan === true)) {
        throw new Error('Explicit approval of the current PRD and plan is required')
      }
      await this.refreshPracticeEvidence(await this.repository.load())
      const record = await this.repository.approvePortfolioPackage({ ...request, updatedAt: this.now().toISOString() })
      return this.toView(record, request)
    })
  }

  startNew(request: PracticeStartRequest): Promise<PracticeWorkspaceView> {
    if (request.transfer) return Promise.reject(selectiveTransferUnavailable())
    return this.runExclusive(async () => {
      this.lastError = ''
      const record = await this.repository.load()
      if (record.pendingTransition) throw new Error('A Practice switch is already pending')
      if (record.activeRun && isReviewedPortfolioPackage(record.activeRun) && record.activeRun.reviewStatus === 'reviewing') {
        throw new Error('Wait for the current portfolio review before switching Practice')
      }
      const definition = await this.definitions.load(request.practiceId, request.practiceVersion)
      const approvedConfiguration = definition.taskPolicy === 'safe-workspace-write'
        ? await this.loadApprovedConfiguration?.() ?? undefined
        : undefined
      const startedAt = this.now().toISOString()
      const transition: PracticeTransitionRecord = {
        transitionId: this.createId(),
        sourceRunId: record.activeRun?.runId ?? null,
        targetRunId: this.createId(),
        practiceId: request.practiceId,
        practiceVersion: request.practiceVersion,
        stage: 'creating-target',
        startedAt
      }
      const pending = await this.repository.save({ ...record, pendingTransition: transition })
      let targetBinding
      let committed
      try {
        targetBinding = await this.createPracticeTarget({
          runId: transition.targetRunId,
          definition,
          approvedConfiguration
        })
        const targetCreated = await this.repository.save({
          ...pending,
          pendingTransition: { ...transition, stage: 'target-created', targetBinding }
        })
        if (definition.evidenceProfile === 'planning-package') {
          await this.prepareExecutor?.(targetBinding, true)
        }
        await this.preparePracticeTarget(targetBinding, definition)
        committed = await this.commitTarget(targetCreated)
      } catch (error) {
        this.lastError = safeCreationError(error)
        throw new Error(this.lastError, { cause: error })
      }
      await this.openTarget(targetBinding)
      return this.toView(committed)
    })
  }

  resume(identity?: PracticeIdentity): Promise<PracticeWorkspaceView> {
    return this.runExclusive(async () => {
      const record = await this.repository.load()
      if (!record.activeRun || record.pendingTransition) {
        throw new Error('Không có Practice đang hoạt động để tiếp tục.')
      }
      if (identity
        && (record.activeRun.practiceId !== identity.practiceId
          || record.activeRun.practiceVersion !== identity.practiceVersion)) {
        throw new Error('Practice đang hoạt động không khớp nội dung được yêu cầu.')
      }
      if (record.activeRun.practiceId === 'm4-portfolio-release') {
        try {
          await this.preparePracticeTarget(record.activeRun.binding,
            await this.definitions.load(record.activeRun.practiceId, record.activeRun.practiceVersion))
        } catch (error) {
          this.lastError = safeCreationError(error)
          throw new Error(this.lastError, { cause: error })
        }
      } else if (isReviewedPortfolioPackage(record.activeRun) || record.activeRun.evidenceProfile === 'portfolio-build') {
        await this.executor.prepareTarget(record.activeRun.binding,
          await this.definitions.load(record.activeRun.practiceId, record.activeRun.practiceVersion),
          await this.loadApprovedConfiguration?.() ?? undefined)
      }
      await this.openTarget(record.activeRun.binding)
      return this.toView(record)
    })
  }

  retry(): Promise<PracticeWorkspaceView> {
    return this.runExclusive(async () => {
      const record = await this.repository.load()
      const transition = record.pendingTransition
      if (!transition) throw new Error('Không có lần chuyển nào để thử lại.')
      const definition = await this.definitions.load(
        transition.practiceId,
        transition.practiceVersion
      )
      const approvedConfiguration = definition.taskPolicy === 'safe-workspace-write'
        ? await this.loadApprovedConfiguration?.() ?? undefined
        : undefined
      if (transition.stage === 'target-created' && transition.targetBinding) {
        let committed
        try {
          if (definition.evidenceProfile === 'planning-package') {
            await this.prepareExecutor?.(transition.targetBinding, true)
          }
          await this.preparePracticeTarget(transition.targetBinding, definition)
          committed = await this.commitTarget(record)
        } catch (error) {
          this.lastError = safeCreationError(error)
          throw new Error(this.lastError, { cause: error })
        }
        await this.openTarget(transition.targetBinding)
        return this.toView(committed)
      }
      let targetBinding
      try {
        targetBinding = await this.createPracticeTarget({
          runId: transition.targetRunId,
          definition,
          approvedConfiguration
        })
      } catch (error) {
        this.lastError = safeCreationError(error)
        throw new Error(this.lastError, { cause: error })
      }
      const targetCreated = await this.repository.save({
        ...record,
        pendingTransition: { ...transition, stage: 'target-created', targetBinding }
      })
      let committed
      try {
        if (definition.evidenceProfile === 'planning-package') {
          await this.prepareExecutor?.(targetBinding, true)
        }
        await this.preparePracticeTarget(targetBinding, definition)
        committed = await this.commitTarget(targetCreated)
      } catch (error) {
        this.lastError = safeCreationError(error)
        throw new Error(this.lastError, { cause: error })
      }
      await this.openTarget(targetBinding)
      return this.toView(committed)
    })
  }

  cancel(): Promise<PracticeWorkspaceView> {
    return this.runExclusive(async () => {
      const record = await this.repository.load()
      if (!record.pendingTransition) throw new Error('Không có lần chuyển nào để hủy.')
      this.lastError = ''
      return this.toView(await this.repository.save({ ...record, pendingTransition: null }))
    })
  }

  openTask(request: PracticeTaskOpenRequest): Promise<void> {
    return this.runExclusive(async () => {
      const record = await this.repository.load()
      const active = record.activeRun
      if (!active || record.pendingTransition || active.runId !== request.runId
        || active.generation !== request.generation) {
        throw new Error('Practice task no longer matches the displayed run')
      }
      // Navigation only: use the persisted binding without preparing a task,
      // sending instructions or refreshing/mutating review evidence.
      const open = () => this.executor.openTarget(active.binding)
      if (this.handoffExecutor) await this.handoffExecutor(open)
      else await open()
    })
  }

  private async createPracticeTarget(input: Parameters<ExecutorChatCoordinator['createTarget']>[0]): Promise<PracticeRunRecord['binding']> {
    if (input.definition.practiceId === 'm4-portfolio-release') {
      const handoff = await this.loadPortfolioReleaseHandoff?.()
      if (!handoff || !/^sha256:[a-f0-9]{64}$/.test(handoff.sourceCheckpoint)
        || handoff.task.workspaceRoot !== handoff.workspace.canonicalPath) {
        throw new Error('PORTFOLIO_RELEASE_CONTINUATION_UNAVAILABLE')
      }
      return { ...handoff.task, runId: input.runId }
    }
    if (input.definition.practiceId !== 'm3-portfolio-build') return this.executor.createTarget(input)
    const handoff = await this.loadPortfolioHandoff?.()
    if (!handoff) throw new Error('PORTFOLIO_CONTINUATION_UNAVAILABLE')
    if (handoff.task.workspaceRoot !== handoff.workspace.canonicalPath
      || handoff.task.threadId !== handoff.approval.threadId) throw new Error('The approved portfolio task binding is invalid')
    return { ...handoff.task, runId: input.runId }
  }

  private async preparePracticeTarget(binding: PracticeRunRecord['binding'], definition: PracticeDefinition): Promise<void> {
    const approvedConfiguration = definition.taskPolicy === 'safe-workspace-write'
      ? await this.loadApprovedConfiguration?.() ?? undefined
      : undefined
    if (definition.practiceId === 'm4-portfolio-release') {
      try {
        const handoff = await this.loadPortfolioReleaseHandoff?.()
        if (!handoff || !/^sha256:[a-f0-9]{64}$/.test(handoff.sourceCheckpoint)
          || handoff.task.workspaceRoot !== handoff.workspace.canonicalPath
          || binding.threadId !== handoff.task.threadId || binding.workspaceRoot !== handoff.workspace.canonicalPath) {
          throw new Error('Portfolio handoff changed')
        }
        await this.executor.prepareTarget(binding, definition, approvedConfiguration, handoff.sourceCheckpoint)
        return
      } catch (error) {
        throw new Error('PORTFOLIO_RELEASE_CONTINUATION_UNAVAILABLE', { cause: error })
      }
    }
    if (definition.practiceId !== 'm3-portfolio-build') return this.executor.prepareTarget(binding, definition, approvedConfiguration)
    try {
      const handoff = await this.loadPortfolioHandoff?.()
      if (!handoff || binding.threadId !== handoff.task.threadId || binding.workspaceRoot !== handoff.workspace.canonicalPath) {
        throw new Error('Portfolio handoff changed')
      }
      await this.executor.prepareTarget(binding, definition, approvedConfiguration)
    } catch (error) {
      throw new Error('PORTFOLIO_CONTINUATION_UNAVAILABLE', { cause: error })
    }
  }

  selectPanel(update: PracticePanelUpdate): Promise<PracticeWorkspaceView> {
    return this.runExclusive(async () => {
      return this.toView(await this.repository.selectPanel(update.surface, update.panel))
    })
  }

  recordPlanningAction(request: PlanningPracticeActionRequest): Promise<PracticeWorkspaceView> {
    return this.runExclusive(async () => {
      const record = await this.repository.load()
      const active = record.activeRun
      if (!active
        || active.runId !== request.runId
        || active.generation !== request.generation
        || active.practiceId !== request.practiceId
        || active.practiceVersion !== request.practiceVersion) {
        throw new Error('Practice action does not belong to the active run')
      }
      if (active.evidenceProfile !== 'planning-package' || !this.evidenceAdapters) {
        throw new Error('Module 2 Practice actions are unavailable')
      }
      const definition = await this.definitions.load(active.practiceId, active.practiceVersion)
      await this.prepareExecutor?.(active.binding, false)
      const evidence = await this.evidenceAdapters.resolve(active.evidenceProfile).collect({
        definition,
        runId: active.runId,
        generation: active.generation,
        workspaceRoot: active.binding.workspaceRoot,
        task: {
          threadId: active.binding.threadId,
          workspaceRoot: active.binding.workspaceRoot
        }
      })
      const refreshed = await this.saveEvidence(active, evidence)
      if (!refreshed.activeRun
        || refreshed.activeRun.runId !== active.runId
        || refreshed.activeRun.generation !== active.generation) {
        throw new Error('Practice changed while evidence was refreshed')
      }
      const saved = await this.repository.applyPlanningAction({
        runId: active.runId,
        generation: active.generation,
        practiceId: active.practiceId,
        practiceVersion: active.practiceVersion,
        action: request.action,
        updatedAt: this.now().toISOString()
      })
      return this.toView(saved)
    })
  }

  recordPortfolioStageAction(request: PortfolioStageActionRequest): Promise<PracticeWorkspaceView> {
    return this.runExclusive(async () => {
      let record = await this.repository.load()
      let active = record.activeRun
      if (!active
        || active.runId !== request.runId
        || active.generation !== request.generation
        || active.practiceId !== request.practiceId
        || active.practiceVersion !== request.practiceVersion
        || (active.evidenceProfile !== 'portfolio-planning' && active.evidenceProfile !== 'portfolio-build')
        || isReviewedPortfolioPackage(active)
        || !this.evidenceAdapters) {
        throw new Error('Portfolio stage action does not belong to the active Practice run')
      }
      const definition = await this.definitions.load(active.practiceId, active.practiceVersion)
      record = await this.refreshPortfolioEvidence(record, definition)
      active = record.activeRun
      if (!active
        || active.runId !== request.runId
        || active.generation !== request.generation) {
        throw new Error('Practice changed while portfolio evidence was refreshed')
      }
      const stage = definition.stages?.find((candidate) => candidate.id === request.stageId)
      const portfolioEvidence = active.evidenceProfile === 'portfolio-build'
        ? active.evidence?.portfolioBuild
        : active.evidence?.portfolioPlanning
      const observed = portfolioEvidence?.stages.find((candidate) =>
        candidate.stageId === request.stageId)
      if (!stage || !observed || !portfolioEvidence) throw new Error('Unknown portfolio Practice stage')
      if (request.decision === 'revision-requested') {
        const saved = await this.repository.saveLearnerDecision({
          runId: active.runId,
          generation: active.generation,
          practiceId: active.practiceId,
          practiceVersion: active.practiceVersion,
          key: `${stage.id}-decision`,
          value: 'revision-requested',
          updatedAt: this.now().toISOString()
        })
        return this.toView(saved)
      }
      if (active.evidence?.freshness !== 'fresh'
        || Object.keys(observed.artifactDigests).length === 0) {
        throw new Error('Portfolio stage does not have fresh, corroborated artifact evidence')
      }
      const approvedAt = this.now().toISOString()
      if (active.evidenceProfile === 'portfolio-build' && request.sliceId) {
        const sliceIndex = portfolioBuildSliceIds.indexOf(request.sliceId) + 1
        const path = `evidence/module-3/build-log.${request.sliceId}`
        const artifact = portfolioEvidence.artifacts.find((item) => item.path === path)
        const sliceIssues = portfolioEvidence.issues.filter((item) => item.path === path)
        if (stage.id !== 'complete-first-version' || sliceIndex < 1 || !artifact || sliceIssues.length > 0) {
          throw new Error('Build slice does not have fresh corroborated evidence')
        }
        const digests = {
          'planning/PRD.md': portfolioEvidence.artifacts.find((item) => item.path === 'planning/PRD.md')?.digest ?? '',
          'evidence/module-3/design-direction.md': portfolioEvidence.artifacts.find((item) => item.path === 'evidence/module-3/design-direction.md')?.digest ?? '',
          [path]: artifact.digest
        }
        if (Object.values(digests).some((value) => !value)) throw new Error('Build slice inputs are incomplete')
        const saved = await this.repository.saveBuildSliceReceipt({
          runId: active.runId,
          generation: active.generation,
          practiceId: active.practiceId,
          practiceVersion: active.practiceVersion,
          receipt: {
            schemaVersion: 1,
            courseRunId: request.courseRunId,
            practiceId: active.practiceId,
            practiceVersion: active.practiceVersion,
            runId: active.runId,
            stageId: 'complete-first-version',
            stageIndex: 2,
            sliceId: request.sliceId,
            sliceIndex: sliceIndex as 1 | 2 | 3 | 4,
            workspace: { canonicalPath: active.binding.workspaceRoot, identityDigest: portfolioEvidence.workspaceIdentityDigest },
            artifactDigests: digests,
            approval: { approvedAt, artifactDigests: { ...digests } },
            evidence: { executorReportedChecks: [...observed.executorReportedChecks], corroboratedArtifacts: { ...digests } },
            status: 'completed',
            freshness: 'current',
            observedAt: active.evidence.observedAt
          },
          updatedAt: approvedAt
        })
        return this.toView(saved)
      }
      if (observed.status !== 'ready') throw new Error('Portfolio stage is not ready')
      const saved = await this.repository.saveStageReceipt({
        runId: active.runId,
        generation: active.generation,
        practiceId: active.practiceId,
        practiceVersion: active.practiceVersion,
        definition,
        receipt: {
          schemaVersion: 1,
          courseRunId: request.courseRunId,
          practiceId: active.practiceId,
          practiceVersion: active.practiceVersion,
          runId: active.runId,
          stageId: stage.id,
          stageIndex: stage.order,
          workspace: {
            canonicalPath: active.binding.workspaceRoot,
            identityDigest: portfolioEvidence.workspaceIdentityDigest
          },
          artifactDigests: { ...observed.artifactDigests },
          approval: {
            approvedAt,
            artifactDigests: { ...observed.artifactDigests }
          },
          evidence: {
            executorReportedChecks: [...observed.executorReportedChecks],
            corroboratedArtifacts: { ...observed.corroboratedArtifacts }
          },
          status: 'completed',
          freshness: 'current',
          observedAt: active.evidence.observedAt
        },
        updatedAt: approvedAt
      })
      return this.toView(saved)
    })
  }

  reset(): Promise<void> {
    this.lastError = ''
    return this.repository.reset()
  }

  private runExclusive<T>(operation: () => Promise<T>): Promise<T> {
    const running = this.operationTail.then(operation)
    this.operationTail = running.then(() => undefined, () => undefined)
    return running
  }

  private async openTarget(binding: PracticeRunRecord['binding']): Promise<void> {
    try {
      const open = () => this.executor.openTarget(binding)
      if (this.handoffExecutor) await this.handoffExecutor(open)
      else await open()
      this.lastError = ''
    } catch {
      this.lastError =
        'Task Codex đã được tạo nhưng chưa mở được. Hãy dùng Tiếp tục Practice để thử lại.'
      throw new Error(this.lastError)
    }
  }

  private async refreshPracticeEvidence(record: PracticeWorkspaceRecord): Promise<PracticeWorkspaceRecord> {
    const active = record.activeRun
    if (!active || record.pendingTransition || !this.evidenceAdapters) {
      return record
    }
    const definition = await this.definitions.load(active.practiceId, active.practiceVersion)
    if (isPortfolioProfile(active.evidenceProfile)) {
      return this.refreshPortfolioEvidence(record, definition)
    }
    if (active.evidenceProfile !== 'planning-package') return record
    await this.prepareExecutor?.(active.binding, false)
    const evidence = await this.evidenceAdapters.resolve('planning-package').collect({
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
    return this.saveEvidence(active, evidence)
  }

  private async refreshPortfolioEvidence(
    record: PracticeWorkspaceRecord,
    definition: PracticeDefinition
  ): Promise<PracticeWorkspaceRecord> {
    const active = record.activeRun
    if (!active || !isPortfolioProfile(active.evidenceProfile) || !this.evidenceAdapters) {
      return record
    }
    await this.prepareExecutor?.(active.binding, false)
    const evidence = await this.evidenceAdapters.resolve(active.evidenceProfile).collect({
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
    let refreshed = await this.saveEvidence(active, evidence)
    if (isReviewedPortfolioPackage(active)) return refreshed
    const current = refreshed.activeRun
    if (!current || current.runId !== active.runId || current.generation !== active.generation) {
      return refreshed
    }
    const currentArtifactDigests = Object.fromEntries(
      (portfolioPackageEvidence(evidence)?.artifacts ?? []).map((artifact) => [artifact.path, artifact.digest])
    )
    refreshed = await this.repository.reconcileStageArtifacts({
      runId: current.runId,
      generation: current.generation,
      practiceId: current.practiceId,
      practiceVersion: current.practiceVersion,
      definition,
      currentArtifactDigests,
      updatedAt: evidence.observedAt
    })
    return refreshed
  }

  private async saveEvidence(
    active: PracticeRunRecord,
    evidence: PracticeAdapterEvidenceState
  ): Promise<PracticeWorkspaceRecord> {
    const saved = await this.repository.saveEvidence({
      runId: active.runId,
      generation: active.generation,
      practiceId: active.practiceId,
      practiceVersion: active.practiceVersion,
      evidence,
      checklist: active.checklist,
      invalidations: evidence.invalidations,
      updatedAt: evidence.observedAt
    })
    if (!isReviewedPortfolioPackage(active) && active.completion && !saved.activeRun?.completion) {
      await this.revokeCompletion?.(active.completion)
    }
    return saved
  }

  private async commitTarget(record: PracticeWorkspaceRecord): Promise<PracticeWorkspaceRecord> {
    const transition = record.pendingTransition
    if (transition?.stage !== 'target-created' || !transition.targetBinding) {
      throw new Error('Practice target is not ready')
    }
    const definition = await this.definitions.load(
      transition.practiceId,
      transition.practiceVersion
    )
    const timestamp = this.now().toISOString()
    const generation = (record.activeRun?.generation ?? 0) + 1
    const activeRun: PracticeRunRecord = {
      runId: transition.targetRunId,
      generation,
      practiceId: definition.practiceId,
      practiceVersion: definition.version,
      workspaceKind: definition.workspaceKind,
      taskPolicy: definition.taskPolicy,
      evidenceProfile: definition.evidenceProfile,
      reviewStatus: 'not-reviewed',
      reviewHistory: [],
      status: 'active',
      binding: transition.targetBinding,
      startedAt: transition.startedAt,
      updatedAt: timestamp,
      checklist: initialChecklist(definition),
      learnerDecisions: {},
      learnerApprovals: {},
      evidence: null,
      invalidations: [],
      ...(definition.stages ? { stageReceipts: [] } : {}),
      ...(definition.evidenceProfile === 'portfolio-build' ? { buildSliceReceipts: [] } : {})
    }
    const archivedRuns = record.activeRun
      ? [
          ...record.archivedRuns,
          {
            runId: record.activeRun.runId,
            generation: record.activeRun.generation,
            practiceId: record.activeRun.practiceId,
            practiceVersion: record.activeRun.practiceVersion,
            threadId: record.activeRun.binding.threadId,
            name: record.activeRun.binding.name,
            outcome: 'replaced' as const,
            archivedAt: timestamp,
            ...(['portfolio-planning', 'portfolio-build', 'portfolio-release'].includes(record.activeRun.evidenceProfile ?? '')
              ? { retainedRun: structuredClone(record.activeRun) } : {}),
            reviewHistory: structuredClone(
              record.activeRun.reviewHistory
                ?? (record.activeRun.reviewResult ? [record.activeRun.reviewResult] : [])
            )
          }
        ].slice(-100)
      : record.archivedRuns
    return this.repository.save({
      ...record,
      activeRun,
      archivedRuns,
      pendingTransition: null,
      presentation: { fullPanel: 'teacher', compactPanel: 'teacher' }
    })
  }

  private async toView(
    record: PracticeWorkspaceRecord,
    requestedIdentity?: PracticeIdentity,
    verifiedArchive?: PracticeRunRecord
  ): Promise<PracticeWorkspaceView> {
    const transition = record.pendingTransition
    const requestedMatchesActive = !requestedIdentity || Boolean(record.activeRun
      && record.activeRun.practiceId === requestedIdentity.practiceId
      && record.activeRun.practiceVersion === requestedIdentity.practiceVersion)
    const displayedRun = !transition ? (requestedMatchesActive ? record.activeRun : null) ?? verifiedArchive : null
    const identity = transition
      ?? requestedIdentity
      ?? record.activeRun
    const definition = identity
      ? await this.definitions.load(identity.practiceId, identity.practiceVersion)
      : null
    let startPrompt: string | undefined
    if (definition?.practiceId === 'm3-portfolio-build' && definition.version === '2.0.0') {
      startPrompt = portfolioContinuationInstructions(definition)
    } else if (definition?.practiceId === 'm4-portfolio-release') {
      const handoff = await this.loadPortfolioReleaseHandoff?.().catch(() => null)
      if (handoff && /^sha256:[a-f0-9]{64}$/.test(handoff.sourceCheckpoint)) {
        startPrompt = portfolioContinuationInstructions(definition, handoff.sourceCheckpoint)
      }
    }
    const planningReviewStep = displayedRun?.checklist.find((step) =>
      step.id === 'explain-scope-and-review')
    const canReview = Boolean(record.activeRun && displayedRun && (!isPortfolioProfile(displayedRun.evidenceProfile) || isReviewedPortfolioPackage(displayedRun)) && (
      displayedRun.evidenceProfile !== 'planning-package'
      || (displayedRun.learnerDecisions['scope-decision']
        && (planningReviewStep?.status === 'current' || planningReviewStep?.status === 'completed'))
    ))
    return {
      schemaVersion: 1,
      ...(startPrompt ? { startPrompt } : {}),
      phase: transition ? 'switching' : displayedRun && record.activeRun ? 'active' : this.lastError ? 'error' : 'brief',
      title: definition?.title ?? 'Bài thực hành',
      objective: definition?.objective ?? '',
      expectedOutcome: definition?.expectedOutcome ?? '',
      checklist: structuredClone(
        displayedRun?.evidenceProfile === 'codex-task-configuration' && definition
          ? definition.checklist.map((step) => displayedRun.checklist.find((saved) => saved.id === step.id)
            ?? { id: step.id, title: step.title, status: 'pending' as const })
          : displayedRun?.checklist ?? (definition ? initialChecklist(definition) : [])
      ),
      ...(definition
        ? {
            completionDestination: {
              ...structuredClone(definition.completionDestination),
              label: definition.completionDestination.label || 'Bước tiếp theo trong khóa học'
            }
          }
        : {}),
      review: {
        status: displayedRun?.reviewStatus ?? 'not-reviewed',
        canReview,
        canReturn: Boolean(record.activeRun && displayedRun?.reviewStatus === 'passed' && displayedRun.completion),
        ...(displayedRun?.reviewResult && definition
          ? {
              result: structuredClone(displayedRun.reviewResult),
              comparison: derivePracticeReviewComparison({
                definition,
                previous: displayedRun.reviewHistory?.at(-2) ?? null,
                current: displayedRun.reviewResult,
                checklist: displayedRun.checklist
              })
            }
          : {})
      },
      ...(displayedRun?.completion ? { completion: structuredClone(displayedRun.completion) } : {}),
      ...(displayedRun?.binding.configuration
        ? { configuration: structuredClone(displayedRun.binding.configuration) }
        : {}),
      ...(displayedRun?.evidenceProfile === 'planning-package'
        ? { planning: planningWorkspaceView(displayedRun) }
        : {}),
      ...(displayedRun && isReviewedPortfolioPackage(displayedRun) ? { portfolioPackage: {
        kind: isPortfolioReleasePackage(displayedRun) ? 'release' : isPortfolioBuildPackage(displayedRun) ? 'build' : 'planning',
        sourceDigest: displayedRun.evidence?.sourceDigest ?? null,
        ready: portfolioPackageIsReady(displayedRun),
        approved: Boolean(currentPortfolioPackageApproval(displayedRun)),
        artifactPaths: portfolioPackageEvidence(displayedRun.evidence)?.artifacts.map((artifact) => artifact.path) ?? [],
        issues: portfolioPackageEvidence(displayedRun.evidence)?.issues.map((issue) => issue.path + ': ' + issue.message) ?? [],
        unexpectedPaths: portfolioPackageEvidence(displayedRun.evidence)?.unexpectedPaths ?? [],
        ...(displayedRun.evidence?.portfolioRelease?.deployment
          ? { deployment: structuredClone(displayedRun.evidence.portfolioRelease.deployment) } : {})
      } } : {}),
      ...(displayedRun?.evidenceProfile === 'portfolio-planning' && !isReviewedPortfolioPackage(displayedRun) && definition
        ? { portfolioPlanning: portfolioPlanningWorkspaceView(displayedRun, definition) }
        : {}),
      ...(displayedRun?.evidenceProfile === 'portfolio-build' && !isPortfolioBuildPackage(displayedRun) && definition
        ? { portfolioBuild: portfolioBuildWorkspaceView(displayedRun, definition) }
        : {}),
      ...(record.activeRun
        ? {
            activePractice: {
              runId: record.activeRun.runId,
              generation: record.activeRun.generation,
              practiceId: record.activeRun.practiceId,
              practiceVersion: record.activeRun.practiceVersion,
              executorChatName: record.activeRun.binding.name,
              startedAt: record.activeRun.startedAt
            }
          }
        : {}),
      ...(transition
        ? {
            transition: {
              stage: transition.stage,
              label: transitionLabel(transition, Boolean(this.lastError)),
              canCancel: true,
              canRetry: true
            }
          }
        : {}),
      presentation: structuredClone(record.presentation),
      capabilities: {
        canStartNew: !transition,
        canResume: Boolean(record.activeRun && displayedRun),
        selectiveTransferAvailable: selectiveTransferCapability.available,
        selectiveTransferReason: selectiveTransferCapability.reason
      },
      ...(this.lastError ? { error: this.lastError } : {})
    }
  }
}
