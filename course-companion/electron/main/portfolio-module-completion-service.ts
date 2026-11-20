import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import {
  portfolioPackageArtifactPaths,
  type LearnerProgress,
  type PracticeCompletionReceipt
} from '../../shared/contracts'
import type { PortfolioPlanningEvidenceAdapter } from './portfolio-planning-evidence-adapter'
import type { PortfolioBuildEvidenceAdapter } from './portfolio-build-evidence-adapter'
import type { PortfolioWorkspaceRepository } from './portfolio-workspace-repository'
import type { PracticeDefinitionRepository } from './practice-definition-repository'
import type { PracticeRunRepository } from './practice-run-repository'
import type { ProgressRepository } from './progress-repository'
import { currentPortfolioPackageApproval, isPortfolioBuildPackage, isPortfolioPackage } from './portfolio-package-state'
import { buildPracticeReviewEnvelope } from './practice-review-context'

const masteryQuestionIds = [
  'mastery-1',
  'mastery-4',
  'mastery-5',
  'mastery-6'
] as const

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function bounded(value: string, maximum = 650): string {
  const compact = value.replace(/\s+/g, ' ').trim()
  return compact.length <= maximum ? compact : `${compact.slice(0, maximum - 1).trimEnd()}…`
}

function requireText(value: string, label: string): string {
  const text = bounded(value)
  if (!text) throw new Error(`Completion summary is missing ${label}`)
  return text
}

function sameDigests(left: Record<string, string>, right: Map<string, string>): boolean {
  const entries = Object.entries(left)
  return entries.length > 0 && entries.every(([path, value]) => right.get(path) === value)
}

export class PortfolioModuleCompletionService {
  constructor(
    private readonly progressRepository: ProgressRepository,
    private readonly workspaceRepository: PortfolioWorkspaceRepository,
    private readonly practiceRunRepository: PracticeRunRepository,
    private readonly definitionRepository: PracticeDefinitionRepository,
    private readonly evidenceAdapter: PortfolioPlanningEvidenceAdapter,
    private readonly now: () => Date = () => new Date(),
    private readonly buildEvidenceAdapter?: PortfolioBuildEvidenceAdapter
  ) {}

  async completeModuleTwo(): Promise<LearnerProgress> {
    const loaded = await this.progressRepository.load()
    if (loaded.status !== 'returning' && loaded.status !== 'recovered') throw new Error('Learner progress is unavailable')
    const progress = loaded.progress
    const priorCompletion = [...progress.practiceCompletions].reverse().find((receipt) =>
      receipt.practiceId === 'm2-portfolio-planning' && receipt.practiceVersion === '2.0.0'
      && receipt.courseRunId === progress.courseRunId && receipt.checkpointId === 'm2-portfolio-complete')
    if (progress.sceneId !== 'module-2-portfolio-mastery-summary' && !priorCompletion) {
      throw new Error('Finish the Module 2 mastery assessment before completing the module')
    }
    const workspace = await this.workspaceRepository.load({ courseRunId: progress.courseRunId })
    if (workspace.status !== 'ready' || !workspace.selectedPath) throw new Error('The selected portfolio workspace is not ready')
    const record = await this.practiceRunRepository.load()
    const active = record.activeRun && isPortfolioPackage(record.activeRun)
      ? record.activeRun
      : [...record.archivedRuns].reverse().map((archive) => archive.retainedRun).find((run) => run && isPortfolioPackage(run)
          && run.completion?.courseRunId === progress.courseRunId)
    if (!active || !active.completion || !active.reviewResult
      || active.reviewStatus !== 'passed' || active.reviewResult.verdict !== 'passed' || record.pendingTransition
      || resolve(active.binding.workspaceRoot) !== resolve(workspace.selectedPath)) {
      throw new Error('A fresh six-file submission review is required; legacy receipts remain historical')
    }
    const definition = await this.definitionRepository.load(active.practiceId, active.practiceVersion)
    const context = { definition, runId: active.runId, generation: active.generation,
      workspaceRoot: active.binding.workspaceRoot, task: { threadId: active.binding.threadId, workspaceRoot: active.binding.workspaceRoot },
      allowedLegacyArtifactPaths: active.allowedLegacyArtifactPaths }
    const fresh = await this.evidenceAdapter.collect(context)
    const approval = currentPortfolioPackageApproval({ ...active, evidence: fresh }, progress.courseRunId)
    const envelope = buildPracticeReviewEnvelope({ definition, run: { ...active, evidence: fresh }, activity: null, generatedAt: this.now().toISOString() })
    if (!approval || !envelope.portfolioPackage?.ready
      || envelope.portfolioPackage.evidenceDigest !== active.completion.submissionDigest
      || !progress.practiceCompletions.some((receipt) => receipt.runId === active.runId
        && receipt.practiceVersion === '2.0.0' && receipt.courseRunId === progress.courseRunId
        && receipt.submissionDigest === active.completion?.submissionDigest)) {
      throw new Error('The approved portfolio package changed; return to the same Practice task and submit a fresh review')
    }
    const masteryAnswers = masteryQuestionIds.map((questionId) => ({ questionId, result: progress.decisions[`assessment:${questionId}`] ?? '' }))
    if (masteryAnswers.some(({ result }) => !result.startsWith('correct'))) throw new Error('All Module 2 mastery evidence must be satisfied')
    const artifacts = portfolioPackageArtifactPaths.map((path) => ({ path, digest: approval.artifactDigests[path]! }))
    const contents = new Map(envelope.portfolioPackage.artifacts.map((artifact) => [artifact.path, artifact.content]))
    const excerpt = (path: string, headings: RegExp) => {
      const content = contents.get(path) ?? ''
      const sections = content.split(/(?=^#{1,6}\s)/m)
      return requireText(sections.filter((part) => headings.test(part.split('\n')[0] ?? '')).join(' ') || content, path)
    }
    const summary = {
      learnerDecision: excerpt('planning/portfolio-brief.md', /người xem|quyết định|audience|decision/i),
      evidenceBoundary: excerpt('planning/content-evidence-inventory.md', /khoảng trống|công khai|gap|privacy|permission/i),
      // Compatibility display key: this is the implementation order, not a first-task document.
      firstBuild: excerpt('planning/implementation-plan.md', /giai đoạn|bước|phase|step|order/i),
      deliberatelyOutOfScope: excerpt('planning/PRD.md', /ngoài phạm vi|non-goals|out.of.scope|constraints|ràng buộc/i)
    }
    const latest = await this.evidenceAdapter.collect(context)
    if (latest.sourceDigest !== fresh.sourceDigest || latest.freshness !== 'fresh') throw new Error('Portfolio evidence changed before completion')
    const latestRecord = await this.practiceRunRepository.load()
    const latestRun = latestRecord.activeRun?.practiceId === active.practiceId ? latestRecord.activeRun
      : [...latestRecord.archivedRuns].reverse().find((item) => item.runId === active.runId && item.generation === active.generation)?.retainedRun
    if (latestRecord.pendingTransition || !latestRun || latestRun.runId !== active.runId
      || latestRun.generation !== active.generation || latestRun.reviewStatus !== 'passed'
      || latestRun.reviewResult?.sourceDigest !== active.reviewResult.sourceDigest) throw new Error('The current portfolio submission changed before completion')
    if (priorCompletion) {
      if (priorCompletion.submissionDigest === active.completion.submissionDigest) return progress
    }
    const receipt: PracticeCompletionReceipt = {
      schemaVersion: 1, courseRunId: progress.courseRunId, practiceId: active.practiceId,
      practiceVersion: active.practiceVersion, runId: active.runId, checkpointId: 'm2-portfolio-complete',
      status: 'completed', completedAt: this.now().toISOString(), submissionDigest: active.completion.submissionDigest,
      evidenceSummary: bounded(active.reviewResult.summary, 1500),
      masterySummary: 'Đã đối chiếu 4 tình huống trên planning package hiện tại.',
      destination: {
        lessonId: 'module-3',
        checkpointId: 'm3-complete-first-version',
        sceneId: 'module-3-first-build'
      },
      portfolioPlanningHandoff: {
        schemaVersion: 2, workspace: { canonicalPath: active.binding.workspaceRoot, identityDigest: approval.workspaceIdentityDigest },
        artifacts, approval, submission: { runId: active.runId, generation: active.generation,
          sourceDigest: approval.sourceDigest, reviewDigest: active.reviewResult.sourceDigest, reviewedAt: active.reviewResult.reviewedAt },
        task: { runId: active.runId, threadId: active.binding.threadId, workspaceRoot: active.binding.workspaceRoot,
          name: active.binding.name, createdAt: active.binding.createdAt,
          ...(active.binding.projectId ? { projectId: active.binding.projectId } : {}) },
        mastery: { questionIds: [...masteryQuestionIds], answerDigest: digest(JSON.stringify(masteryAnswers)) },
        summary, moduleThreeInput: { workspacePath: active.binding.workspaceRoot, artifactReferences: artifacts }
      }
    }
    return progress.sceneId === 'module-2-portfolio-mastery-summary'
      ? this.progressRepository.completePortfolioPlanning(receipt)
      : this.progressRepository.recordPracticeCompletion(receipt)
  }

  async completeModuleThree(): Promise<LearnerProgress> {
    if (!this.buildEvidenceAdapter) throw new Error('Module 3 evidence adapter is unavailable')
    const progressResult = await this.progressRepository.load()
    if (progressResult.status !== 'returning' && progressResult.status !== 'recovered') throw new Error('Learner progress is unavailable')
    const progress = progressResult.progress
    if (progress.sceneId !== 'module-3-mastery-summary') throw new Error('Finish Module 3 mastery before completing the module')
    const workspace = await this.workspaceRepository.load({ courseRunId: progress.courseRunId })
    if (workspace.status !== 'ready' || !workspace.selectedPath) throw new Error('The selected portfolio workspace is not ready')
    const canonicalPath = resolve(workspace.selectedPath)
    const record = await this.practiceRunRepository.load()
    const active = record.activeRun ?? [...record.archivedRuns].reverse().find((archive) =>
      archive.retainedRun && isPortfolioBuildPackage(archive.retainedRun)
      && archive.retainedRun.completion?.courseRunId === progress.courseRunId)?.retainedRun
    if (active && isPortfolioBuildPackage(active)) {
      if (record.pendingTransition || resolve(active.binding.workspaceRoot) !== canonicalPath
        || active.reviewStatus !== 'passed' || active.reviewResult?.verdict !== 'passed' || !active.completion) {
        throw new Error('A current Module 3 website submission review is required')
      }
      const definition = await this.definitionRepository.load(active.practiceId, active.practiceVersion)
      const context = { definition, runId: active.runId, generation: active.generation, workspaceRoot: canonicalPath,
        task: { threadId: active.binding.threadId, workspaceRoot: active.binding.workspaceRoot } }
      const evidence = await this.buildEvidenceAdapter.collect(context)
      const run = { ...active, evidence }
      const approval = currentPortfolioPackageApproval(run, progress.courseRunId)
      const envelope = buildPracticeReviewEnvelope({ definition, run, activity: null, generatedAt: this.now().toISOString() })
      if (!approval || !envelope.portfolioPackage?.ready
        || active.completion.submissionDigest !== envelope.portfolioPackage.evidenceDigest
        || !progress.practiceCompletions.some((receipt) => receipt.runId === active.runId
          && receipt.practiceVersion === active.practiceVersion && receipt.courseRunId === progress.courseRunId
          && receipt.submissionDigest === active.completion?.submissionDigest)) {
        throw new Error('The website or its evidence changed; reopen the same Practice task and submit a fresh review')
      }
      const mastery = ['m3-mastery-plan', 'm3-mastery-visible-error', 'm3-mastery-logs', 'm3-mastery-repeated-error', 'm3-mastery-branch']
      if (!mastery.every((id) => progress.decisions[`assessment:${id}`]?.startsWith('correct'))) throw new Error('Module 3 mastery evidence is incomplete')
      const latest = await this.buildEvidenceAdapter.collect(context)
      const latestRecord = await this.practiceRunRepository.load()
      const latestRun = latestRecord.activeRun?.runId === active.runId ? latestRecord.activeRun
        : [...latestRecord.archivedRuns].reverse().find((archive) => archive.runId === active.runId && archive.generation === active.generation)?.retainedRun
      if (latest.sourceDigest !== evidence.sourceDigest || latestRecord.pendingTransition
        || !latestRun || latestRun.generation !== active.generation || latestRun.reviewStatus !== 'passed'
        || latestRun.completion?.submissionDigest !== active.completion.submissionDigest) throw new Error('Module 3 changed before completion')
      const sourceCheckpoint = `sha256:${approval.artifactDigests['application/source']}`
      return this.progressRepository.completePortfolioBuild({
        schemaVersion: 1, courseRunId: progress.courseRunId, practiceId: active.practiceId, practiceVersion: active.practiceVersion,
        runId: active.runId, checkpointId: 'm3-complete', status: 'completed', completedAt: this.now().toISOString(),
        submissionDigest: active.completion.submissionDigest,
        evidenceSummary: 'Đã duyệt kết quả kiểm tra theo PRD và quan sát của người học trên phiên bản hiện tại.',
        masterySummary: 'Đã lưu năm câu trả lời tổng kết Module 3.',
        destination: { lessonId: 'module-3', checkpointId: 'm3-complete', sceneId: 'module-3-complete' },
        portfolioBuildHandoff: { schemaVersion: 2, workspace: { canonicalPath, identityDigest: approval.workspaceIdentityDigest },
          artifactDigests: approval.artifactDigests, approval, submissionDigest: active.completion.submissionDigest!, sourceCheckpoint,
          moduleFourInput: { workspacePath: canonicalPath, sourceCheckpoint } }
      })
    }
    if (!active || active.practiceId !== 'm3-portfolio-build' || active.practiceVersion !== '1.0.0'
      || resolve(active.binding.workspaceRoot) !== canonicalPath) throw new Error('The active build Practice does not match this portfolio workspace')
    const definition = await this.definitionRepository.load(active.practiceId, active.practiceVersion)
    const fresh = await this.buildEvidenceAdapter.collect({
      definition, runId: active.runId, generation: active.generation, workspaceRoot: canonicalPath,
      task: { threadId: active.binding.threadId, workspaceRoot: active.binding.workspaceRoot }
    })
    const build = fresh.portfolioBuild
    if (fresh.freshness !== 'fresh' || !build || build.issues.length > 0 || build.unexpectedPaths.length > 0) {
      throw new Error('The current portfolio build has missing or invalid evidence')
    }
    const digests = new Map(build.artifacts.map((artifact) => [artifact.path, artifact.digest]))
    const requiredArtifacts = definition.stages?.flatMap((stage) => stage.requiredArtifactPaths) ?? []
    if (!requiredArtifacts.every((path) => digests.has(path))) throw new Error('All eight Module 3 artifacts are required')
    const receipts = active.stageReceipts ?? []
    if (receipts.length !== 5 || !definition.stages?.every((stage) => {
      const receipt = receipts.find((item) => item.stageId === stage.id)
      return receipt?.courseRunId === progress.courseRunId && receipt.freshness === 'current'
        && receipt.workspace.identityDigest === build.workspaceIdentityDigest
        && sameDigests(receipt.artifactDigests, digests)
    })) throw new Error('Five current stage receipts are required')
    const slices = active.buildSliceReceipts ?? []
    if (slices.length !== 4 || !slices.every((receipt, index) => receipt.courseRunId === progress.courseRunId
      && receipt.sliceIndex === index + 1 && receipt.freshness === 'current'
      && sameDigests(receipt.artifactDigests, digests))) throw new Error('Four current build slice receipts are required')
    const questionIds = [
      'm3-mastery-plan',
      'm3-mastery-visible-error',
      'm3-mastery-logs',
      'm3-mastery-repeated-error',
      'm3-mastery-branch'
    ]
    const answers = questionIds.map((id) => progress.decisions[`assessment:${id}`] ?? '')
    if (answers.some((answer) => !answer.startsWith('correct'))) {
      throw new Error('Module 3 mastery evidence is incomplete')
    }
    const sourceCheckpoint = receipts.find((item) => item.stageId === 'independent-enhancement')?.evidence.executorReportedChecks.find((item) => /checkpoint|commit/i.test(item))
      ?? `practice-${active.runId}`
    const completedAt = this.now().toISOString()
    return this.progressRepository.completePortfolioBuild({
      schemaVersion: 1,
      courseRunId: progress.courseRunId,
      practiceId: active.practiceId,
      practiceVersion: active.practiceVersion,
      runId: active.runId,
      checkpointId: 'm3-complete',
      status: 'completed',
      completedAt,
      evidenceSummary: 'Đã đối chiếu tám artifact, năm stage, bốn phần xây dựng, npm run check và bằng chứng trình duyệt hiện tại.',
      masterySummary: 'Đã lưu năm câu trả lời tổng kết Module 3.',
      destination: { lessonId: 'module-3', checkpointId: 'm3-complete', sceneId: 'module-3-complete' },
      portfolioBuildHandoff: {
        schemaVersion: 1,
        workspace: { canonicalPath, identityDigest: build.workspaceIdentityDigest },
        artifactDigests: Object.fromEntries(digests),
        stageReceiptIds: receipts.sort((a, b) => a.stageIndex - b.stageIndex).map((item) => item.stageId),
        buildSliceReceiptIds: slices.sort((a, b) => a.sliceIndex - b.sliceIndex).map((item) => item.sliceId),
        sourceCheckpoint,
        moduleFourInput: { workspacePath: canonicalPath, sourceCheckpoint }
      }
    })
  }
}
