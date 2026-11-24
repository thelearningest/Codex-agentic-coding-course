import { createHash } from 'node:crypto'
import { lstat, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { isAbsolute, join, resolve } from 'node:path'
import type {
  PracticeAdapterEvidenceState,
  PracticeChecklistStep,
  PracticeCompletionReceipt,
  PracticeEvidenceInvalidation,
  PracticeEvidenceProfile,
  PracticeDefinition,
  PracticeLearnerApproval,
  PortfolioPackageApproval,
  PracticeBuildSliceReceipt,
  PracticeStageReceipt,
  PlanningPracticeActionRequest,
  PracticePanel,
  PracticeReviewResult,
  PracticeTaskPolicy,
  PracticeWorkspaceKind
} from '../../shared/contracts'
import {
  portfolioBuildSliceIds,
  practiceEvidenceProfiles,
  practiceTaskPolicies,
  practiceWorkspaceKinds
} from '../../shared/contracts'
import { isApprovedCodexConfiguration } from './practice-task-policy'
import { currentPortfolioPackageApproval, isPortfolioPackage, isPortfolioBuildPackage, isReviewedPortfolioPackage, portfolioPackageEvidence, legacyPortfolioPackagePaths, portfolioPackageDigests, portfolioPackageIsReady } from './portfolio-package-state'
import { isCodexTaskConfigurationSnapshot } from './codex-configuration-normalizer'
import {
  applyPlanningPracticeAction,
  reconcilePlanningStepState
} from './practice-step-state'

export type ExecutorChatBinding = {
  runId: string
  threadId: string
  name: string
  workspaceRoot: string
  createdAt: string
  configuration?: import('../../shared/contracts').CodexTaskConfigurationSnapshot
  projectId?: string
}

export type PracticeRunRecord = {
  runId: string
  generation: number
  status: 'active'
  practiceId: string
  practiceVersion: string
  workspaceKind: PracticeWorkspaceKind
  taskPolicy: PracticeTaskPolicy
  evidenceProfile: PracticeEvidenceProfile
  binding: ExecutorChatBinding
  startedAt: string
  updatedAt: string
  checklist: PracticeChecklistStep[]
  learnerDecisions: Record<string, string>
  learnerApprovals: Record<string, PracticeLearnerApproval>
  evidence: PracticeAdapterEvidenceState | null
  invalidations: PracticeEvidenceInvalidation[]
  stageReceipts?: PracticeStageReceipt[]
  buildSliceReceipts?: PracticeBuildSliceReceipt[]
  reviewStatus: 'not-reviewed' | 'reviewing' | 'needs-work' | 'passed'
  reviewResult?: PracticeReviewResult
  reviewHistory?: PracticeReviewResult[]
  completion?: PracticeCompletionReceipt
  packageApproval?: PortfolioPackageApproval
  allowedLegacyArtifactPaths?: string[]
}

export type ArchivedPracticeReceipt = {
  runId: string
  generation: number
  practiceId: string
  practiceVersion: string
  threadId: string
  name: string
  outcome: 'completed' | 'replaced' | 'historical'
  archivedAt: string
  reviewHistory?: PracticeReviewResult[]
  retainedRun?: PracticeRunRecord
}

export type PracticeTransitionRecord = {
  transitionId: string
  sourceRunId: string | null
  targetRunId: string
  practiceId: string
  practiceVersion: string
  stage: 'creating-target' | 'target-created'
  targetBinding?: ExecutorChatBinding
  startedAt: string
}

export type PracticeWorkspaceRecord = {
  schemaVersion: 2
  activeRun: PracticeRunRecord | null
  archivedRuns: ArchivedPracticeReceipt[]
  pendingTransition: PracticeTransitionRecord | null
  presentation: {
    fullPanel: PracticePanel
    compactPanel: PracticePanel
  }
}

export type PortfolioPackageMigrationRecovery = {
  courseRunId: string
  runId: string
  workspaceRoot: string
  validateTask: (binding: ExecutorChatBinding) => Promise<boolean>
}

export function selectPortfolioPackageMigrationRecovery(input: {
  courseRunId: string
  selectedWorkspaceRoot: string
  record: PracticeWorkspaceRecord
  completions: PracticeCompletionReceipt[]
}): Omit<PortfolioPackageMigrationRecovery, 'validateTask'> | null {
  if (!ID.test(input.courseRunId) || !isAbsolute(input.selectedWorkspaceRoot)) return null
  const workspaceRoot = resolve(input.selectedWorkspaceRoot)
  const active = input.record.activeRun
  if (active?.practiceId === 'm2-portfolio-planning' && active.practiceVersion === '1.0.0'
    && resolve(active.binding.workspaceRoot) === workspaceRoot) {
    return { courseRunId: input.courseRunId, runId: active.runId, workspaceRoot }
  }
  const completion = [...input.completions].reverse().find((receipt) => {
    const handoff = receipt.portfolioPlanningHandoff
    if (receipt.courseRunId !== input.courseRunId
      || receipt.practiceId !== 'm2-portfolio-planning'
      || receipt.checkpointId !== 'm2-portfolio-complete'
      || (receipt.practiceVersion !== '1.0.0' && receipt.practiceVersion !== '2.0.0')
      || (handoff?.schemaVersion !== 1 && handoff?.schemaVersion !== 2)
      || resolve(handoff.workspace.canonicalPath) !== workspaceRoot
      || handoff.workspace.identityDigest !== practiceWorkspaceIdentityDigest(workspaceRoot)) return false
    return input.record.archivedRuns.some((archive) => archive.runId === receipt.runId
      && archive.practiceId === receipt.practiceId
      && archive.practiceVersion === receipt.practiceVersion
      && (receipt.practiceVersion === '1.0.0' || archive.retainedRun !== undefined))
  })
  if (completion) {
    return { courseRunId: input.courseRunId, runId: completion.runId, workspaceRoot }
  }
  const retained = [...input.record.archivedRuns].reverse().find((archive) =>
    archive.practiceId === 'm2-portfolio-planning'
    && (archive.practiceVersion === '1.0.0' || archive.practiceVersion === '2.0.0')
    && archive.retainedRun
    && resolve(archive.retainedRun.binding.workspaceRoot) === workspaceRoot)
  if (retained) {
    return { courseRunId: input.courseRunId, runId: retained.runId, workspaceRoot }
  }
  const legacyArchives = input.record.archivedRuns.filter((archive) =>
    archive.practiceId === 'm2-portfolio-planning'
    && archive.practiceVersion === '1.0.0'
    && archive.retainedRun === undefined)
  const currentTaskLegacy = active?.practiceId === 'm3-portfolio-build'
    && resolve(active.binding.workspaceRoot) === workspaceRoot
    ? legacyArchives.filter((archive) => archive.threadId === active.binding.threadId)
    : []
  const unambiguousLegacy = currentTaskLegacy.length === 1
    ? currentTaskLegacy[0]
    : legacyArchives.length === 1
      ? legacyArchives[0]
      : null
  return unambiguousLegacy
    ? { courseRunId: input.courseRunId, runId: unambiguousLegacy.runId, workspaceRoot }
    : null
}

const ID = /^[A-Za-z0-9_-]{1,160}$/
const VERSION = /^[0-9]+\.[0-9]+\.[0-9]+$/
const THREAD_ID = /^[A-Za-z0-9_-]{1,160}$/
const STEP_STATUSES = new Set(['completed', 'current', 'pending', 'stale', 'upcoming'])
const WORKSPACE_KINDS = new Set<string>(practiceWorkspaceKinds)
const TASK_POLICIES = new Set<string>(practiceTaskPolicies)
const EVIDENCE_PROFILES = new Set<string>(practiceEvidenceProfiles)
const PORTFOLIO_PROFILES = new Set<PracticeEvidenceProfile>([
  'portfolio-planning',
  'portfolio-build',
  'portfolio-release'
])
const DIGEST = /^[a-f0-9]{64}$/
const ARTIFACT_PATH = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._/-]{1,240}$/

export function practiceWorkspaceIdentityDigest(canonicalPath: string): string {
  return createHash('sha256').update(resolve(canonicalPath)).digest('hex')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isIso(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    return new Date(value).toISOString() === value
  } catch {
    return false
  }
}

function isPanel(value: unknown): value is PracticePanel {
  return value === 'teacher' || value === 'progress'
}

function isBinding(value: unknown): value is ExecutorChatBinding {
  if (!isRecord(value)) return false
  return (
    ID.test(String(value.runId)) &&
    THREAD_ID.test(String(value.threadId)) &&
    typeof value.name === 'string' &&
    value.name.length > 0 &&
    value.name.length <= 500 &&
    typeof value.workspaceRoot === 'string' &&
    value.workspaceRoot.length > 0 &&
    isIso(value.createdAt) &&
    (value.projectId === undefined || (typeof value.projectId === 'string' && ID.test(value.projectId))) &&
    (value.configuration === undefined || (isCodexTaskConfigurationSnapshot(value.configuration)
      && value.configuration.runId === value.runId
      && value.configuration.threadId === value.threadId))
  )
}

function isChecklist(value: unknown): value is PracticeChecklistStep[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20) return false
  let current = 0
  const ids = new Set<string>()
  for (const step of value) {
    if (!isRecord(step) || !ID.test(String(step.id)) || ids.has(String(step.id))) return false
    if (typeof step.title !== 'string' || step.title.length < 1 || step.title.length > 300) return false
    if (!STEP_STATUSES.has(String(step.status))) return false
    if (step.status === 'current') current += 1
    if (step.reason !== undefined && (typeof step.reason !== 'string' || step.reason.length > 1000)) return false
    if (step.dependencyInputs !== undefined && !isStringRecord(step.dependencyInputs, 20, 500)) return false
    ids.add(String(step.id))
  }
  return current <= 1
}

function isStringRecord(value: unknown, maximumEntries: number, maximumText: number): value is Record<string, string> {
  return isRecord(value)
    && Object.keys(value).length <= maximumEntries
    && Object.entries(value).every(([key, item]) => (
      ID.test(key) && typeof item === 'string' && item.length <= maximumText
    ))
}

function isDigestRecord(value: unknown, maximumEntries = 80): value is Record<string, string> {
  return isRecord(value)
    && Object.keys(value).length <= maximumEntries
    && Object.keys(value).every((path) => ARTIFACT_PATH.test(path))
    && Object.values(value).every((digest) => typeof digest === 'string' && DIGEST.test(digest))
}

function sameDigestRecord(left: Record<string, string>, right: Record<string, string>): boolean {
  const keys = Object.keys(left).sort()
  return keys.length === Object.keys(right).length
    && keys.every((key) => left[key] === right[key])
}

export function isPracticeStageReceipt(value: unknown): value is PracticeStageReceipt {
  if (!isRecord(value) || !isRecord(value.workspace) || !isRecord(value.approval)
    || !isRecord(value.evidence)) return false
  if (value.schemaVersion !== 1
    || !ID.test(String(value.courseRunId))
    || !ID.test(String(value.practiceId))
    || !VERSION.test(String(value.practiceVersion))
    || !ID.test(String(value.runId))
    || !ID.test(String(value.stageId))
    || ![1, 2, 3, 4, 5].includes(Number(value.stageIndex))
    || typeof value.workspace.canonicalPath !== 'string'
    || !isAbsolute(value.workspace.canonicalPath)
    || !DIGEST.test(String(value.workspace.identityDigest))
    || !isDigestRecord(value.artifactDigests)
    || !isIso(value.approval.approvedAt)
    || !isDigestRecord(value.approval.artifactDigests)
    || !sameDigestRecord(value.artifactDigests, value.approval.artifactDigests)
    || !Array.isArray(value.evidence.executorReportedChecks)
    || value.evidence.executorReportedChecks.length > 40
    || !value.evidence.executorReportedChecks.every((check) =>
      typeof check === 'string' && check.length > 0 && check.length <= 500)
    || !isDigestRecord(value.evidence.corroboratedArtifacts)
    || !Object.entries(value.evidence.corroboratedArtifacts).every(([path, digest]) =>
      (value.artifactDigests as Record<string, string>)[path] === digest)
    || !isIso(value.observedAt)) return false
  if (value.status === 'completed') {
    return value.freshness === 'current' && value.staleReason === undefined
  }
  return value.status === 'stale'
    && value.freshness === 'stale'
    && typeof value.staleReason === 'string'
    && value.staleReason.length > 0
    && value.staleReason.length <= 1000
}

function isStageReceipts(value: unknown, active: {
  practiceId: string
  practiceVersion: string
  runId: string
  workspaceRoot: string
}): value is PracticeStageReceipt[] {
  if (!Array.isArray(value) || value.length > 5 || !value.every(isPracticeStageReceipt)) return false
  const stageIds = new Set<string>()
  const stageIndexes = new Set<number>()
  const courseRunIds = new Set(value.map((receipt) => receipt.courseRunId))
  const workspaceDigests = new Set(value.map((receipt) => receipt.workspace.identityDigest))
  if (courseRunIds.size > 1 || workspaceDigests.size > 1) return false
  return value.every((receipt) => {
    if (stageIds.has(receipt.stageId)) return false
    if (stageIndexes.has(receipt.stageIndex)) return false
    stageIds.add(receipt.stageId)
    stageIndexes.add(receipt.stageIndex)
    return receipt.practiceId === active.practiceId
      && receipt.practiceVersion === active.practiceVersion
      && receipt.runId === active.runId
      && resolve(receipt.workspace.canonicalPath) === resolve(active.workspaceRoot)
      && receipt.workspace.identityDigest === practiceWorkspaceIdentityDigest(receipt.workspace.canonicalPath)
  })
}

function isBuildSliceReceipts(value: unknown, active: {
  practiceId: string
  practiceVersion: string
  runId: string
  workspaceRoot: string
}): value is PracticeBuildSliceReceipt[] {
  if (!Array.isArray(value) || value.length > 4) return false
  const ids = new Set<string>()
  const indexes = new Set<number>()
  return value.every((receipt) => {
    if (!isPracticeStageReceipt(receipt)) return false
    const slice = receipt as PracticeBuildSliceReceipt
    if (slice.stageId !== 'complete-first-version'
      || slice.stageIndex !== 2
      || !portfolioBuildSliceIds.includes(slice.sliceId)
      || ![1, 2, 3, 4].includes(slice.sliceIndex)
      || ids.has(slice.sliceId)
      || indexes.has(slice.sliceIndex)) return false
    ids.add(slice.sliceId)
    indexes.add(slice.sliceIndex)
    return slice.practiceId === active.practiceId
      && slice.practiceVersion === active.practiceVersion
      && slice.runId === active.runId
      && resolve(slice.workspace.canonicalPath) === resolve(active.workspaceRoot)
      && slice.workspace.identityDigest === practiceWorkspaceIdentityDigest(slice.workspace.canonicalPath)
  })
}

function isApprovals(value: unknown): boolean {
  return isRecord(value)
    && Object.keys(value).length <= 20
    && Object.entries(value).every(([key, approval]) => (
      ID.test(key)
      && isRecord(approval)
      && (approval.decision === 'approved' || approval.decision === 'revision-requested')
      && isIso(approval.recordedAt)
      && isRecord(approval.artifactDigests)
      && Object.keys(approval.artifactDigests).length <= 2
      && Object.entries(approval.artifactDigests).every(([path, digest]) =>
        (path === 'artifacts/PRD.md' || path === 'artifacts/implementation-plan.md')
        && typeof digest === 'string'
        && /^[a-f0-9]{64}$/.test(digest))
    ))
}

function isEvidence(value: unknown): value is PracticeAdapterEvidenceState {
  return isRecord(value)
    && value.schemaVersion === 1
    && ID.test(String(value.practiceId))
    && VERSION.test(String(value.practiceVersion))
    && ID.test(String(value.runId))
    && EVIDENCE_PROFILES.has(String(value.evidenceProfile))
    && isIso(value.observedAt)
    && ['fresh', 'stale', 'unverifiable'].includes(String(value.freshness))
    && (value.sourceDigest === null || /^[a-f0-9]{64}$/.test(String(value.sourceDigest)))
    && Array.isArray(value.evidence)
    && Array.isArray(value.steps)
    && Array.isArray(value.invalidations)
    && (value.configuration === undefined || (isCodexTaskConfigurationSnapshot(value.configuration)
      && value.configuration.runId === value.runId))
    && (value.portfolioPlanning === undefined || (
      value.evidenceProfile === 'portfolio-planning'
      && isPortfolioPlanningEvidence(value.portfolioPlanning)
    ))
    && (value.portfolioBuild === undefined || (
      value.evidenceProfile === 'portfolio-build'
      && isPortfolioPlanningEvidence(value.portfolioBuild)
    ))
    && (value.portfolioRelease === undefined || (
      value.evidenceProfile === 'portfolio-release'
      && isPortfolioPlanningEvidence(value.portfolioRelease)
      && isRecord(value.portfolioRelease)
      && (value.portfolioRelease.deployment === undefined || (
        isRecord(value.portfolioRelease.deployment)
        && typeof value.portfolioRelease.deployment.url === 'string'
        && typeof value.portfolioRelease.deployment.reachable === 'boolean'
        && isIso(value.portfolioRelease.deployment.checkedAt)
        && (value.portfolioRelease.deployment.status === null || Number.isInteger(value.portfolioRelease.deployment.status))
      ))
    ))
}

function isPortfolioPlanningEvidence(value: unknown): boolean {
  if (!isRecord(value)
    || value.schemaVersion !== 1
    || !DIGEST.test(String(value.workspaceIdentityDigest))
    || !Array.isArray(value.artifacts)
    || value.artifacts.length > 100
    || !Array.isArray(value.issues)
    || value.issues.length > 200
    || !Array.isArray(value.unexpectedPaths)
    || value.unexpectedPaths.length > 500
    || !value.unexpectedPaths.every((path) => typeof path === 'string' && path.length <= 500)
    || !Array.isArray(value.stages)
    || value.stages.length !== 5) return false
  if (!value.artifacts.every((artifact) => isRecord(artifact)
    && typeof artifact.path === 'string'
    && artifact.path.length > 0
    && artifact.path.length <= 500
    && DIGEST.test(String(artifact.digest))
    && Number.isSafeInteger(artifact.byteLength)
    && Number(artifact.byteLength) > 0
    && isIso(artifact.modifiedAt)
    && (artifact.content === undefined || (typeof artifact.content === 'string' && Buffer.byteLength(artifact.content, 'utf8') <= 128 * 1024))
    && isIso(artifact.observedAt))) return false
  if (!value.issues.every((item) => isRecord(item)
    && ID.test(String(item.stageId))
    && typeof item.path === 'string'
    && item.path.length <= 500
    && typeof item.code === 'string'
    && item.code.length <= 100
    && typeof item.message === 'string'
    && item.message.length <= 1000)) return false
  const indexes = new Set<number>()
  const ids = new Set<string>()
  return value.stages.every((stage) => {
    if (!isRecord(stage)
      || !ID.test(String(stage.stageId))
      || ![1, 2, 3, 4, 5].includes(Number(stage.stageIndex))
      || (stage.status !== 'ready' && stage.status !== 'blocked')
      || !isDigestRecord(stage.artifactDigests)
      || !isDigestRecord(stage.corroboratedArtifacts)
      || !sameDigestRecord(stage.artifactDigests, stage.corroboratedArtifacts)
      || !Array.isArray(stage.executorReportedChecks)
      || stage.executorReportedChecks.length > 40
      || !stage.executorReportedChecks.every((check) => typeof check === 'string' && check.length <= 500)
      || !Array.isArray(stage.issueCodes)
      || stage.issueCodes.length > 30
      || !stage.issueCodes.every((code) => typeof code === 'string' && code.length <= 100)) return false
    const stageIndex = Number(stage.stageIndex)
    const stageId = String(stage.stageId)
    if (indexes.has(stageIndex) || ids.has(stageId)) return false
    indexes.add(stageIndex)
    ids.add(stageId)
    return true
  })
}

function isInvalidations(value: unknown): value is PracticeEvidenceInvalidation[] {
  return Array.isArray(value)
    && value.length <= 40
    && value.every((item) => (
      isRecord(item)
      && typeof item.changedInput === 'string'
      && item.changedInput.length <= 300
      && Array.isArray(item.affectedStepIds)
      && item.affectedStepIds.every((stepId) => ID.test(String(stepId)))
      && typeof item.reason === 'string'
      && item.reason.length <= 1000
      && typeof item.nextAction === 'string'
      && item.nextAction.length <= 1000
    ))
}
function isReviewResult(value: unknown): value is PracticeReviewResult {
  if (!isRecord(value)) return false
  return value.schemaVersion === 1
    && ID.test(String(value.practiceId))
    && typeof value.practiceVersion === 'string'
    && ID.test(String(value.runId))
    && (value.verdict === 'needs-work' || value.verdict === 'passed')
    && Array.isArray(value.criteria)
    && typeof value.summary === 'string'
    && value.summary.length <= 1500
    && isIso(value.reviewedAt)
    && /^[a-f0-9]{64}$/.test(String(value.sourceDigest))
}

function isReviewHistory(
  value: unknown,
  identity: { practiceId: string; practiceVersion: string; runId: string }
): value is PracticeReviewResult[] {
  return Array.isArray(value)
    && value.length <= 5
    && value.every((result) => isReviewResult(result)
      && result.practiceId === identity.practiceId
      && result.practiceVersion === identity.practiceVersion
      && result.runId === identity.runId)
}

function isCompletion(value: unknown): value is PracticeCompletionReceipt {
  if (!isRecord(value)) return false
  const destination = isRecord(value.destination) ? value.destination : null
  return value.schemaVersion === 1
    && ID.test(String(value.courseRunId))
    && ID.test(String(value.practiceId))
    && typeof value.practiceVersion === 'string'
    && ID.test(String(value.runId))
    && typeof value.checkpointId === 'string'
    && value.status === 'completed'
    && isIso(value.completedAt)
    && typeof value.evidenceSummary === 'string'
    && typeof value.masterySummary === 'string'
    && Boolean(destination)
    && (value.approvedConfiguration === undefined ||
      isApprovedCodexConfiguration(value.approvedConfiguration))
}

function isRun(value: unknown): value is PracticeRunRecord {
  if (!isRecord(value)) return false
  return (
    ID.test(String(value.runId)) &&
    Number.isSafeInteger(value.generation) &&
    Number(value.generation) > 0 &&
    value.status === 'active' &&
    ID.test(String(value.practiceId)) &&
    VERSION.test(String(value.practiceVersion)) &&
    WORKSPACE_KINDS.has(String(value.workspaceKind)) &&
    TASK_POLICIES.has(String(value.taskPolicy)) &&
    EVIDENCE_PROFILES.has(String(value.evidenceProfile)) &&
    ((value.evidenceProfile === 'codex-task-configuration' && value.taskPolicy === 'inherit-configuration-only')
      || (value.evidenceProfile === 'planning-package' && value.taskPolicy === 'safe-workspace-write')
      || (PORTFOLIO_PROFILES.has(value.evidenceProfile as PracticeEvidenceProfile)
        && value.workspaceKind === 'learner-portfolio'
        && value.taskPolicy === 'safe-workspace-write')) &&
    isBinding(value.binding) &&
    value.binding.runId === value.runId &&
    isIso(value.startedAt) &&
    isIso(value.updatedAt) &&
    isStringRecord(value.learnerDecisions, 40, 2000) &&
    isApprovals(value.learnerApprovals) &&
    (value.allowedLegacyArtifactPaths === undefined || (Array.isArray(value.allowedLegacyArtifactPaths)
      && value.allowedLegacyArtifactPaths.length <= 2
      && value.allowedLegacyArtifactPaths.every((path) => legacyPortfolioPackagePaths.includes(path)))) &&
    (value.packageApproval === undefined || (isRecord(value.packageApproval)
      && isReviewedPortfolioPackage({ practiceId: String(value.practiceId), practiceVersion: String(value.practiceVersion) })
      && ID.test(String(value.packageApproval.courseRunId))
      && value.packageApproval.runId === value.runId
      && value.packageApproval.generation === value.generation
      && value.packageApproval.threadId === (value.binding as ExecutorChatBinding).threadId
      && DIGEST.test(String(value.packageApproval.workspaceIdentityDigest))
      && DIGEST.test(String(value.packageApproval.sourceDigest))
      && isDigestRecord(value.packageApproval.artifactDigests)
      && isIso(value.packageApproval.recordedAt))) &&
    (value.evidence === null || (isEvidence(value.evidence)
      && value.evidence.practiceId === value.practiceId
      && value.evidence.practiceVersion === value.practiceVersion
      && value.evidence.runId === value.runId
      && value.evidence.evidenceProfile === value.evidenceProfile)) &&
    isInvalidations(value.invalidations) &&
    (PORTFOLIO_PROFILES.has(value.evidenceProfile as PracticeEvidenceProfile)
      ? isStageReceipts(value.stageReceipts, {
          practiceId: String(value.practiceId),
          practiceVersion: String(value.practiceVersion),
          runId: String(value.runId),
          workspaceRoot: (value.binding as ExecutorChatBinding).workspaceRoot
        }) && (value.evidenceProfile !== 'portfolio-build'
          ? value.buildSliceReceipts === undefined
          : isBuildSliceReceipts(value.buildSliceReceipts, {
              practiceId: String(value.practiceId),
              practiceVersion: String(value.practiceVersion),
              runId: String(value.runId),
              workspaceRoot: (value.binding as ExecutorChatBinding).workspaceRoot
            }))
      : value.stageReceipts === undefined) &&
    ['not-reviewed', 'reviewing', 'needs-work', 'passed'].includes(String(value.reviewStatus)) &&
    (value.reviewResult === undefined || isReviewResult(value.reviewResult)) &&
    (value.reviewHistory === undefined || isReviewHistory(value.reviewHistory, {
      practiceId: String(value.practiceId),
      practiceVersion: String(value.practiceVersion),
      runId: String(value.runId)
    })) &&
    (value.completion === undefined || isCompletion(value.completion)) &&
    (value.reviewResult === undefined || (
      value.practiceId === value.reviewResult.practiceId
      && value.practiceVersion === value.reviewResult.practiceVersion
      && value.runId === value.reviewResult.runId
    )) &&
    (value.completion === undefined || (
      value.practiceId === value.completion.practiceId
      && value.practiceVersion === value.completion.practiceVersion
      && value.runId === value.completion.runId
    )) &&
    isChecklist(value.checklist)
  )
}

function isArchive(value: unknown): value is ArchivedPracticeReceipt {
  if (!isRecord(value)) return false
  return (
    ID.test(String(value.runId)) &&
    Number.isSafeInteger(value.generation) &&
    Number(value.generation) > 0 &&
    ID.test(String(value.practiceId)) &&
    VERSION.test(String(value.practiceVersion)) &&
    THREAD_ID.test(String(value.threadId)) &&
    typeof value.name === 'string' &&
    value.name.length > 0 &&
    value.name.length <= 500 &&
    (value.outcome === 'completed' || value.outcome === 'replaced' || value.outcome === 'historical') &&
    isIso(value.archivedAt) &&
    (value.retainedRun === undefined || (isRun(value.retainedRun)
      && value.retainedRun.runId === value.runId
      && value.retainedRun.generation === value.generation
      && value.retainedRun.practiceId === value.practiceId
      && value.retainedRun.practiceVersion === value.practiceVersion
      && value.retainedRun.binding.threadId === value.threadId)) &&
    (value.reviewHistory === undefined || isReviewHistory(value.reviewHistory, {
      practiceId: String(value.practiceId),
      practiceVersion: String(value.practiceVersion),
      runId: String(value.runId)
    }))
  )
}

function isTransition(value: unknown): value is PracticeTransitionRecord {
  if (!isRecord(value)) return false
  if (!ID.test(String(value.transitionId)) || !ID.test(String(value.targetRunId))) return false
  if (value.sourceRunId !== null && !ID.test(String(value.sourceRunId))) return false
  if (!ID.test(String(value.practiceId)) || !VERSION.test(String(value.practiceVersion))) return false
  if (!['creating-target', 'target-created'].includes(String(value.stage))) return false
  if (!isIso(value.startedAt)) return false
  return value.stage === 'target-created'
    ? isBinding(value.targetBinding) && value.targetBinding.runId === value.targetRunId
    : value.targetBinding === undefined
}

export function defaultPracticeWorkspaceRecord(): PracticeWorkspaceRecord {
  return {
    schemaVersion: 2,
    activeRun: null,
    archivedRuns: [],
    pendingTransition: null,
    presentation: { fullPanel: 'teacher', compactPanel: 'teacher' }
  }
}

function normalizeWorkspaceRecord(record: PracticeWorkspaceRecord, recoverInterruptedReview: boolean): PracticeWorkspaceRecord {
  const archivedRuns = record.archivedRuns.map((archived) => ({
    ...archived,
    reviewHistory: structuredClone(archived.reviewHistory ?? [])
  }))
  if (!record.activeRun) return { ...record, archivedRuns }
  const active = record.activeRun
  const retiredSpeedStep = active.practiceId === 'm1-codex-safe-setup'
    ? active.checklist.find(step => step.id === 'set-speed')
    : undefined
  const checklist = retiredSpeedStep ? active.checklist.filter(step => step !== retiredSpeedStep) : active.checklist
  if (retiredSpeedStep?.status === 'current') {
    const nextStep = checklist.findIndex(step => step.status !== 'completed')
    if (nextStep >= 0) checklist[nextStep] = { ...checklist[nextStep]!, status: 'current' }
  }
  const retryOldReview = retiredSpeedStep && active.reviewResult?.verdict === 'needs-work'
  const reviewStatus = recoverInterruptedReview && active.reviewStatus === 'reviewing'
    ? active.reviewResult?.verdict ?? 'not-reviewed'
    : active.reviewStatus
  return {
    ...record,
    archivedRuns,
    activeRun: {
      ...active,
      reviewHistory: structuredClone(active.reviewHistory ?? (active.reviewResult ? [active.reviewResult] : [])),
      reviewStatus,
      checklist,
      ...(retryOldReview ? { reviewResult: undefined, reviewStatus: 'not-reviewed' as const } : {})
    }
  }
}

function migrateHistoricalWorkspace(value: unknown, archivedAt: string): PracticeWorkspaceRecord | null {
  if (!isRecord(value) || value.schemaVersion !== 1) return null
  const migrated = defaultPracticeWorkspaceRecord()
  if (isRecord(value.presentation)
    && isPanel(value.presentation.fullPanel)
    && isPanel(value.presentation.compactPanel)) {
    migrated.presentation = {
      fullPanel: value.presentation.fullPanel,
      compactPanel: value.presentation.compactPanel
    }
  }
  const receipts: ArchivedPracticeReceipt[] = []
  if (Array.isArray(value.archivedRuns)) {
    for (const item of value.archivedRuns) {
      if (!isRecord(item)
        || !ID.test(String(item.runId))
        || !Number.isSafeInteger(item.generation)
        || Number(item.generation) < 1
        || !THREAD_ID.test(String(item.threadId))
        || typeof item.name !== 'string'
        || !isIso(item.archivedAt)) continue
      receipts.push({
        runId: String(item.runId),
        generation: Number(item.generation),
        practiceId: 'historical-unknown',
        practiceVersion: '1.0.0',
        threadId: String(item.threadId),
        name: item.name,
        outcome: 'historical',
        archivedAt: item.archivedAt
      })
    }
  }
  const active = isRecord(value.activeRun) ? value.activeRun : null
  const binding = active && isBinding(active.binding) ? active.binding : null
  if (active
    && binding
    && ID.test(String(active.runId))
    && Number.isSafeInteger(active.generation)
    && Number(active.generation) > 0) {
    receipts.push({
      runId: String(active.runId),
      generation: Number(active.generation),
      practiceId: ID.test(String(active.practiceId)) ? String(active.practiceId) : 'historical-unknown',
      practiceVersion: VERSION.test(String(active.practiceVersion)) ? String(active.practiceVersion) : '1.0.0',
      threadId: binding.threadId,
      name: binding.name,
      outcome: 'historical',
      archivedAt
    })
  }
  migrated.archivedRuns = receipts.slice(-100)
  return migrated
}

export function isPracticeWorkspaceRecord(value: unknown): value is PracticeWorkspaceRecord {
  if (!isRecord(value) || value.schemaVersion !== 2) return false
  if (value.activeRun !== null && !isRun(value.activeRun)) return false
  if (!Array.isArray(value.archivedRuns) || !value.archivedRuns.every(isArchive)) return false
  if (value.archivedRuns.length > 100) return false
  if (value.pendingTransition !== null && !isTransition(value.pendingTransition)) return false
  if (!isRecord(value.presentation)) return false
  if (!isPanel(value.presentation.fullPanel) || !isPanel(value.presentation.compactPanel)) return false
  if (
    value.pendingTransition &&
    value.pendingTransition.sourceRunId !== (value.activeRun?.runId ?? null)
  ) {
    return false
  }
  return true
}

type RunIdentity = {
  runId: string
  generation: number
  practiceId: string
  practiceVersion: string
}

function matchesRun(active: PracticeRunRecord | null, identity: RunIdentity): active is PracticeRunRecord {
  return Boolean(active
    && active.runId === identity.runId
    && active.generation === identity.generation
    && active.practiceId === identity.practiceId
    && active.practiceVersion === identity.practiceVersion)
}

function portfolioStages(definition: PracticeDefinition): NonNullable<PracticeDefinition['stages']> {
  if (!PORTFOLIO_PROFILES.has(definition.evidenceProfile)
    || definition.workspaceKind !== 'learner-portfolio'
    || definition.taskPolicy !== 'safe-workspace-write'
    || definition.stages?.length !== 5) {
    throw new Error('Practice definition does not support staged portfolio receipts')
  }
  return definition.stages
}

function dependentStageIds(
  definition: PracticeDefinition,
  changedStageIds: Set<string>
): Set<string> {
  const affected = new Set(changedStageIds)
  let changed = true
  while (changed) {
    changed = false
    for (const stage of portfolioStages(definition)) {
      if (!affected.has(stage.id) && stage.dependsOn.some((dependency) => affected.has(dependency))) {
        affected.add(stage.id)
        changed = true
      }
    }
  }
  return affected
}

function stagedChecklist(
  definition: PracticeDefinition,
  checklist: PracticeChecklistStep[],
  receipts: PracticeStageReceipt[]
): PracticeChecklistStep[] {
  const byStage = new Map(receipts.map((receipt) => [receipt.stageId, receipt]))
  let priorCurrent = true
  return checklist.map((step) => {
    const stage = portfolioStages(definition).find((candidate) => candidate.id === step.id)
    if (!stage) return step
    const receipt = byStage.get(stage.id)
    const status = receipt?.freshness === 'current'
      ? 'completed' as const
      : receipt?.freshness === 'stale'
        ? 'stale' as const
        : priorCurrent
          ? 'current' as const
          : 'pending' as const
    priorCurrent = status === 'completed'
    return {
      ...step,
      status,
      ...(receipt?.staleReason ? { reason: receipt.staleReason } : { reason: undefined })
    }
  })
}

export class PracticeRunRepository {
  private readonly statePath: string
  private readonly temporaryPath: string
  private readonly corruptPath: string
  private queue: Promise<void> = Promise.resolve()
  private initialized = false

  constructor(private readonly dataDirectory: string) {
    this.statePath = join(dataDirectory, 'practice-runs.json')
    this.temporaryPath = join(dataDirectory, 'practice-runs.json.tmp')
    this.corruptPath = join(dataDirectory, 'practice-runs.corrupt.json')
  }

  load(): Promise<PracticeWorkspaceRecord> {
    return this.runExclusive(() => this.loadDirect())
  }

  save(record: PracticeWorkspaceRecord): Promise<PracticeWorkspaceRecord> {
    if (!isPracticeWorkspaceRecord(record)) {
      return Promise.reject(new Error('Invalid Practice workspace record'))
    }
    return this.runExclusive(() => this.saveDirect(normalizeWorkspaceRecord(record, false)))
  }

  savePreparedProjectBinding(binding: ExecutorChatBinding): Promise<PracticeWorkspaceRecord> {
    return this.runExclusive(async () => {
      const record = await this.loadDirect()
      const active = record.activeRun
      if (!isBinding(binding) || !binding.projectId || !active || record.pendingTransition
        || active.runId !== binding.runId || active.binding.threadId !== binding.threadId
        || resolve(active.binding.workspaceRoot) !== resolve(binding.workspaceRoot)) {
        throw new Error('Practice changed before the project binding could be saved')
      }
      return this.saveDirect({ ...record, activeRun: {
        ...active, binding: { ...active.binding, projectId: binding.projectId }
      } })
    })
  }

  selectPanel(surface: 'full' | 'compact', panel: PracticePanel): Promise<PracticeWorkspaceRecord> {
    return this.runExclusive(async () => {
      const record = await this.loadDirect()
      const presentation = surface === 'full'
        ? { ...record.presentation, fullPanel: panel }
        : { ...record.presentation, compactPanel: panel }
      return this.saveDirect({
        ...record,
        presentation
      })
    })
  }

  migratePortfolioPackage(
    definition: PracticeDefinition,
    updatedAt: string,
    recovery?: PortfolioPackageMigrationRecovery
  ): Promise<PracticeWorkspaceRecord> {
    return this.runExclusive(async () => {
      const record = await this.loadDirect()
      if (!isPortfolioPackage({ practiceId: definition.practiceId, practiceVersion: definition.version })
        || record.pendingTransition) return record
      if (record.activeRun && isPortfolioPackage(record.activeRun)) return record

      if (!recovery || !ID.test(recovery.courseRunId) || !ID.test(recovery.runId)
        || !isAbsolute(recovery.workspaceRoot)) return record
      const workspaceRoot = resolve(recovery.workspaceRoot)
      const activePrior = record.activeRun?.practiceId === definition.practiceId
        && record.activeRun.practiceVersion === '1.0.0'
        && record.activeRun.runId === recovery.runId
        && resolve(record.activeRun.binding.workspaceRoot) === workspaceRoot
        ? record.activeRun
        : null
      const archivedIndex = activePrior ? -1 : record.archivedRuns.findLastIndex((archive) =>
        archive.practiceId === definition.practiceId
        && archive.runId === recovery.runId
        && (archive.practiceVersion === '1.0.0'
          || (archive.practiceVersion === definition.version && archive.retainedRun !== undefined)))
      const archivedPrior = archivedIndex >= 0 ? record.archivedRuns[archivedIndex]! : null
      let prior = activePrior ?? archivedPrior?.retainedRun ?? null

      if (!prior && archivedPrior?.practiceVersion === '1.0.0') {
        const binding: ExecutorChatBinding = {
          runId: archivedPrior.runId,
          threadId: archivedPrior.threadId,
          name: archivedPrior.name,
          workspaceRoot,
          createdAt: archivedPrior.archivedAt
        }
        prior = {
          runId: archivedPrior.runId,
          generation: archivedPrior.generation,
          status: 'active',
          practiceId: archivedPrior.practiceId,
          practiceVersion: archivedPrior.practiceVersion,
          workspaceKind: definition.workspaceKind,
          taskPolicy: definition.taskPolicy,
          evidenceProfile: definition.evidenceProfile,
          binding,
          startedAt: archivedPrior.archivedAt,
          updatedAt: archivedPrior.archivedAt,
          checklist: definition.checklist.map((step, index) => ({
            id: step.id,
            title: step.title,
            status: index === 0 ? 'current' : 'pending'
          })),
          learnerDecisions: {},
          learnerApprovals: {},
          evidence: null,
          invalidations: [],
          stageReceipts: [],
          reviewStatus: 'not-reviewed',
          reviewHistory: []
        }
      }
      if (!prior || prior.practiceId !== definition.practiceId
        || (prior.practiceVersion !== '1.0.0' && prior.practiceVersion !== definition.version)) return record
      if (recovery.runId !== prior.runId
        || resolve(prior.binding.workspaceRoot) !== workspaceRoot
        || !await recovery.validateTask(prior.binding)) return record
      if (record.activeRun && !activePrior
        && (record.activeRun.practiceId !== 'm3-portfolio-build'
          || resolve(record.activeRun.binding.workspaceRoot) !== workspaceRoot)) return record

      const preservePrior = Boolean(activePrior || prior.practiceVersion === '1.0.0')
      const additions = (preservePrior ? 1 : 0) + (record.activeRun && !activePrior ? 1 : 0)
      if (record.archivedRuns.length + additions > 100) return record

      const archivedRuns = structuredClone(record.archivedRuns)
      if (preservePrior) {
        archivedRuns.push({
          runId: prior.runId,
          generation: prior.generation,
          practiceId: prior.practiceId,
          practiceVersion: prior.practiceVersion,
          threadId: prior.binding.threadId,
          name: prior.binding.name,
          outcome: 'historical',
          archivedAt: updatedAt,
          retainedRun: structuredClone(prior),
          reviewHistory: structuredClone(archivedPrior?.reviewHistory
            ?? prior.reviewHistory
            ?? (prior.reviewResult ? [prior.reviewResult] : []))
        })
      }
      if (record.activeRun && !activePrior) {
        const displaced = record.activeRun
        archivedRuns.push({
          runId: displaced.runId,
          generation: displaced.generation,
          practiceId: displaced.practiceId,
          practiceVersion: displaced.practiceVersion,
          threadId: displaced.binding.threadId,
          name: displaced.binding.name,
          outcome: 'historical',
          archivedAt: updatedAt,
          retainedRun: structuredClone(displaced),
          reviewHistory: structuredClone(displaced.reviewHistory ?? (displaced.reviewResult ? [displaced.reviewResult] : []))
        })
      }
      const preservedLegacyPaths = prior.practiceVersion === '1.0.0'
        ? (await Promise.all(legacyPortfolioPackagePaths.map(async (path) => {
            try { return (await lstat(join(prior.binding.workspaceRoot, path))).isFile() ? path : null }
            catch (error) {
              if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
              throw error
            }
          }))).filter((path): path is (typeof legacyPortfolioPackagePaths)[number] => path !== null)
        : prior.allowedLegacyArtifactPaths
      const highestGeneration = Math.max(
        prior.generation,
        record.activeRun?.generation ?? 0,
        ...record.archivedRuns.map((archive) => archive.generation)
      )
      if (!Number.isSafeInteger(highestGeneration + 1)) return record
      const activeRun: PracticeRunRecord = {
        ...prior, generation: highestGeneration + 1, practiceVersion: definition.version,
        updatedAt, checklist: definition.checklist.map((step, index) => ({
          id: step.id, title: step.title, status: index === 0 ? 'current' : 'pending'
        })), learnerApprovals: {}, stageReceipts: [], evidence: null, invalidations: [],
        packageApproval: undefined, completion: undefined, reviewResult: undefined,
        reviewHistory: [], reviewStatus: 'not-reviewed',
        allowedLegacyArtifactPaths: preservedLegacyPaths
      }
      return this.saveDirect({ ...record, activeRun, archivedRuns })
    })
  }

  migratePortfolioBuild(definition: PracticeDefinition, binding: ExecutorChatBinding, updatedAt: string): Promise<PracticeWorkspaceRecord> {
    return this.runExclusive(async () => {
      const record = await this.loadDirect()
      if (!isPortfolioBuildPackage({ practiceId: definition.practiceId, practiceVersion: definition.version })
        || record.pendingTransition || record.archivedRuns.length >= 100) return record
      const prior = record.activeRun ?? [...record.archivedRuns].reverse().find((archive) =>
        archive.practiceId === definition.practiceId && archive.retainedRun)?.retainedRun
      if (!prior || prior.practiceId !== definition.practiceId || prior.binding.threadId !== binding.threadId
        || prior.runId !== binding.runId || resolve(prior.binding.workspaceRoot) !== resolve(binding.workspaceRoot)
        || !['1.0.0', '2.0.0', definition.version].includes(prior.practiceVersion)
        || (record.activeRun && prior.practiceVersion === definition.version)) return record
      const generation = Math.max(prior.generation, ...record.archivedRuns.map((archive) => archive.generation)) + 1
      if (!Number.isSafeInteger(generation)) return record
      const archive: ArchivedPracticeReceipt = {
        runId: prior.runId, generation: prior.generation, practiceId: prior.practiceId, practiceVersion: prior.practiceVersion,
        threadId: prior.binding.threadId, name: prior.binding.name, outcome: 'historical', archivedAt: updatedAt,
        retainedRun: structuredClone(prior), reviewHistory: structuredClone(prior.reviewHistory ?? [])
      }
      const activeRun: PracticeRunRecord = {
        ...prior, generation, practiceVersion: definition.version, updatedAt,
        checklist: definition.checklist.map((step, index) => ({ id: step.id, title: step.title, status: index === 0 ? 'current' : 'pending' })),
        learnerDecisions: {}, learnerApprovals: {}, stageReceipts: [], buildSliceReceipts: [], evidence: null,
        invalidations: [], packageApproval: undefined, completion: undefined, reviewResult: undefined,
        reviewHistory: [], reviewStatus: 'not-reviewed'
      }
      return this.saveDirect({ ...record, activeRun, archivedRuns: record.activeRun ? [...record.archivedRuns, archive] : record.archivedRuns })
    })
  }

  approvePortfolioPackage(input: RunIdentity & {
    courseRunId: string; sourceDigest: string; updatedAt: string
  }): Promise<PracticeWorkspaceRecord> {
    return this.runExclusive(async () => {
      const record = await this.loadDirect()
      const run = record.activeRun
      if (!matchesRun(run, input) || !portfolioPackageIsReady(run)
        || run.reviewStatus === 'reviewing' || record.pendingTransition
        || run.evidence?.sourceDigest !== input.sourceDigest || !ID.test(input.courseRunId)) {
        throw new Error('The portfolio package changed or is not ready for approval')
      }
      const approval: PortfolioPackageApproval = {
        courseRunId: input.courseRunId, runId: run.runId, generation: run.generation,
        threadId: run.binding.threadId, workspaceIdentityDigest: portfolioPackageEvidence(run.evidence)!.workspaceIdentityDigest,
        sourceDigest: input.sourceDigest, artifactDigests: portfolioPackageDigests(run.evidence), recordedAt: input.updatedAt
      }
      return this.saveDirect({ ...record, activeRun: { ...run, packageApproval: approval, updatedAt: input.updatedAt } })
    })
  }

  closeCompletedRun(input: RunIdentity & { updatedAt: string }): Promise<PracticeWorkspaceRecord> {
    return this.runExclusive(async () => {
      const record = await this.loadDirect()
      const active = record.activeRun
      if (!matchesRun(active, input)
        || active.reviewStatus !== 'passed'
        || (isReviewedPortfolioPackage(active) && record.pendingTransition !== null)
        || !active.completion) {
        throw new Error('Only the exact passed Practice run can be closed')
      }
      return this.saveDirect({
        ...record,
        activeRun: null,
        pendingTransition: null,
        archivedRuns: [...record.archivedRuns, {
          runId: active.runId,
          generation: active.generation,
          practiceId: active.practiceId,
          practiceVersion: active.practiceVersion,
          threadId: active.binding.threadId,
          name: active.binding.name,
          outcome: 'completed' as const,
          archivedAt: input.updatedAt,
          ...(['portfolio-planning', 'portfolio-build', 'portfolio-release'].includes(active.evidenceProfile) ? { retainedRun: structuredClone(active) } : {}),
          reviewHistory: structuredClone(active.reviewHistory ?? (active.reviewResult ? [active.reviewResult] : []))
        }].slice(-100),
        presentation: { fullPanel: 'teacher', compactPanel: 'teacher' }
      })
    })
  }

  advanceChecklist(input: RunIdentity & {
    currentStepId: string
    updatedAt: string
  }): Promise<PracticeWorkspaceRecord> {
    return this.runExclusive(async () => {
      const record = await this.loadDirect()
      if (!matchesRun(record.activeRun, input)) return record
      const targetIndex = record.activeRun.checklist.findIndex((step) => step.id === input.currentStepId)
      const currentIndex = record.activeRun.checklist.findIndex((step) => step.status === 'current')
      if (targetIndex < 0 || currentIndex < 0 || currentIndex >= targetIndex) return record
      const checklist = record.activeRun.checklist.map((step, index) => ({
        ...step,
        status: index < targetIndex ? 'completed' as const : index === targetIndex ? 'current' as const : 'pending' as const
      }))
      return this.saveDirect({
        ...record,
        activeRun: { ...record.activeRun, checklist, updatedAt: input.updatedAt }
      })
    })
  }

  saveStageReceipt(input: RunIdentity & {
    definition: PracticeDefinition
    receipt: PracticeStageReceipt
    updatedAt: string
  }): Promise<PracticeWorkspaceRecord> {
    return this.runExclusive(async () => {
      const record = await this.loadDirect()
      const active = record.activeRun
      if (!matchesRun(active, input)) {
        throw new Error('Stage receipt does not belong to the active Practice run')
      }
      const stages = portfolioStages(input.definition)
      const receipt = input.receipt
      const stage = stages.find((candidate) => candidate.id === receipt.stageId)
      if (!stage || !isPracticeStageReceipt(receipt)
        || receipt.status !== 'completed'
        || receipt.freshness !== 'current'
        || receipt.stageIndex !== stage.order
        || receipt.practiceId !== active.practiceId
        || receipt.practiceVersion !== active.practiceVersion
        || receipt.runId !== active.runId
        || input.definition.practiceId !== active.practiceId
        || input.definition.version !== active.practiceVersion
        || input.definition.evidenceProfile !== active.evidenceProfile
        || resolve(receipt.workspace.canonicalPath) !== resolve(active.binding.workspaceRoot)
        || receipt.workspace.identityDigest !== practiceWorkspaceIdentityDigest(active.binding.workspaceRoot)) {
        throw new Error('Invalid Practice stage receipt identity')
      }
      const receipts = active.stageReceipts ?? []
      const establishedCourseRunId = receipts[0]?.courseRunId
      const establishedWorkspaceDigest = receipts[0]?.workspace.identityDigest
      if ((establishedCourseRunId && establishedCourseRunId !== receipt.courseRunId)
        || (establishedWorkspaceDigest
          && establishedWorkspaceDigest !== receipt.workspace.identityDigest)) {
        throw new Error('Stage receipt changed its course run or workspace identity')
      }
      const priorStages = stages.filter((candidate) => candidate.order < stage.order)
      const currentByStage = new Map(receipts.map((candidate) => [candidate.stageId, candidate]))
      if (!priorStages.every((candidate) => {
        const prior = currentByStage.get(candidate.id)
        return prior?.status === 'completed' && prior.freshness === 'current'
      }) || !stage.dependsOn.every((dependency) => {
        const prior = currentByStage.get(dependency)
        return prior?.status === 'completed' && prior.freshness === 'current'
      })) {
        throw new Error('Practice stages must be completed in order with current dependencies')
      }
      if (!stage.requiredArtifactPaths.every((path) =>
        receipt.artifactDigests[path]
        && receipt.evidence.corroboratedArtifacts[path] === receipt.artifactDigests[path])) {
        throw new Error('Stage receipt is missing corroborated artifact evidence')
      }
      if (active.evidenceProfile === 'portfolio-build'
        && stage.id === 'complete-first-version'
        && !portfolioBuildSliceIds.every((sliceId) =>
          active.buildSliceReceipts?.find((item) => item.sliceId === sliceId)?.freshness === 'current')) {
        throw new Error('Four current build slice receipts are required')
      }

      const previous = currentByStage.get(stage.id)
      const changedStage = Boolean(previous
        && !sameDigestRecord(previous.artifactDigests, receipt.artifactDigests))
      const affected = changedStage
        ? dependentStageIds(input.definition, new Set([stage.id]))
        : new Set<string>()
      const nextReceipts = receipts
        .filter((candidate) => candidate.stageId !== stage.id)
        .map((candidate) => affected.has(candidate.stageId)
          ? {
              ...candidate,
              status: 'stale' as const,
              freshness: 'stale' as const,
              staleReason: `Artifact của stage ${stage.id} đã thay đổi.`
            }
          : candidate)
      nextReceipts.push(structuredClone(receipt))
      nextReceipts.sort((left, right) => left.stageIndex - right.stageIndex)
      return this.saveDirect({
        ...record,
        activeRun: {
          ...active,
          stageReceipts: nextReceipts,
          checklist: stagedChecklist(input.definition, active.checklist, nextReceipts),
          reviewStatus: 'not-reviewed',
          reviewResult: undefined,
          completion: undefined,
          updatedAt: input.updatedAt
        }
      })
    })
  }

  saveBuildSliceReceipt(input: RunIdentity & {
    receipt: PracticeBuildSliceReceipt
    updatedAt: string
  }): Promise<PracticeWorkspaceRecord> {
    return this.runExclusive(async () => {
      const record = await this.loadDirect()
      const active = record.activeRun
      const receipt = input.receipt
      if (!matchesRun(active, input)
        || active.evidenceProfile !== 'portfolio-build'
        || !isBuildSliceReceipts([receipt], {
          practiceId: active.practiceId,
          practiceVersion: active.practiceVersion,
          runId: active.runId,
          workspaceRoot: active.binding.workspaceRoot
        })) throw new Error('Invalid portfolio build slice receipt')
      const scaffold = active.stageReceipts?.find((item) => item.stageId === 'scaffold-baseline')
      if (scaffold?.freshness !== 'current') throw new Error('The scaffold stage must be current')
      const current = active.buildSliceReceipts ?? []
      if (!portfolioBuildSliceIds.slice(0, receipt.sliceIndex - 1).every((sliceId) =>
        current.find((item) => item.sliceId === sliceId)?.freshness === 'current')) {
        throw new Error('Build slices must be accepted in order')
      }
      const next = current.filter((item) => item.sliceId !== receipt.sliceId)
      next.push(structuredClone(receipt))
      next.sort((left, right) => left.sliceIndex - right.sliceIndex)
      return this.saveDirect({
        ...record,
        activeRun: {
          ...active,
          buildSliceReceipts: next,
          reviewStatus: 'not-reviewed',
          reviewResult: undefined,
          completion: undefined,
          updatedAt: input.updatedAt
        }
      })
    })
  }

  reconcileStageArtifacts(input: RunIdentity & {
    definition: PracticeDefinition
    currentArtifactDigests: Record<string, string>
    updatedAt: string
  }): Promise<PracticeWorkspaceRecord> {
    if (!isDigestRecord(input.currentArtifactDigests)) {
      return Promise.reject(new Error('Invalid current artifact digest set'))
    }
    return this.runExclusive(async () => {
      const record = await this.loadDirect()
      const active = record.activeRun
      if (!matchesRun(active, input)) {
        throw new Error('Artifact reconciliation does not belong to the active Practice run')
      }
      portfolioStages(input.definition)
      if (input.definition.practiceId !== active.practiceId
        || input.definition.version !== active.practiceVersion
        || input.definition.evidenceProfile !== active.evidenceProfile) {
        throw new Error('Artifact reconciliation uses the wrong Practice definition')
      }
      const receipts = active.stageReceipts ?? []
      const directlyChanged = new Set(receipts
        .filter((receipt) => receipt.status === 'completed'
          && Object.entries(receipt.artifactDigests).some(([path, digest]) =>
            input.currentArtifactDigests[path] !== digest))
        .map((receipt) => receipt.stageId))
      const changedSliceIndex = active.evidenceProfile === 'portfolio-build'
        ? (active.buildSliceReceipts ?? []).reduce<number | null>((earliest, receipt) => {
            const changed = Object.entries(receipt.artifactDigests).some(([path, digest]) =>
              input.currentArtifactDigests[path] !== digest)
            return changed && (earliest === null || receipt.sliceIndex < earliest)
              ? receipt.sliceIndex
              : earliest
          }, null)
        : null
      if (directlyChanged.size === 0 && changedSliceIndex === null) return record
      const affected = dependentStageIds(input.definition, directlyChanged)
      const changedPaths = new Set(receipts.flatMap((receipt) =>
        directlyChanged.has(receipt.stageId)
          ? Object.entries(receipt.artifactDigests)
              .filter(([path, digest]) => input.currentArtifactDigests[path] !== digest)
              .map(([path]) => path)
          : []))
      const reason = `Artifact đã thay đổi: ${[...changedPaths].sort().join(', ')}`
      const nextReceipts = receipts.map((receipt) => affected.has(receipt.stageId)
        ? {
            ...receipt,
            status: 'stale' as const,
            freshness: 'stale' as const,
            staleReason: reason
          }
        : receipt)
      const nextSlices = changedSliceIndex === null
        ? active.buildSliceReceipts
        : (active.buildSliceReceipts ?? []).map((receipt) => receipt.sliceIndex >= changedSliceIndex
          ? {
              ...receipt,
              status: 'stale' as const,
              freshness: 'stale' as const,
              staleReason: 'Bằng chứng của phần xây dựng này hoặc một phần trước đó đã thay đổi.'
            }
          : receipt)
      return this.saveDirect({
        ...record,
        activeRun: {
          ...active,
          stageReceipts: nextReceipts,
          ...(nextSlices ? { buildSliceReceipts: nextSlices } : {}),
          checklist: stagedChecklist(input.definition, active.checklist, nextReceipts),
          reviewStatus: 'not-reviewed',
          reviewResult: undefined,
          completion: undefined,
          updatedAt: input.updatedAt
        }
      })
    })
  }

  invalidatePortfolioTaskReview(input: RunIdentity & { expectedTaskEvidenceDigest?: string; updatedAt: string }): Promise<PracticeWorkspaceRecord> {
    return this.runExclusive(async () => {
      const record = await this.loadDirect()
      const active = record.activeRun
      if (!matchesRun(active, input) || !isReviewedPortfolioPackage(active)
        || active.reviewStatus !== 'passed' || active.completion?.taskEvidenceDigest !== input.expectedTaskEvidenceDigest) return record
      return this.saveDirect({ ...record, activeRun: { ...active, packageApproval: undefined,
        completion: undefined, reviewResult: undefined, reviewStatus: 'not-reviewed', updatedAt: input.updatedAt } })
    })
  }

  saveEvidence(input: RunIdentity & {
    evidence: PracticeAdapterEvidenceState
    checklist: PracticeChecklistStep[]
    invalidations: PracticeEvidenceInvalidation[]
    updatedAt: string
  }): Promise<PracticeWorkspaceRecord> {
    return this.runExclusive(async () => {
      const record = await this.loadDirect()
      if (!matchesRun(record.activeRun, input)) return record
      const planningState = record.activeRun.evidenceProfile === 'planning-package'
        ? reconcilePlanningStepState({
            checklist: record.activeRun.checklist,
            previousEvidence: record.activeRun.evidence,
            evidence: input.evidence,
            learnerDecisions: record.activeRun.learnerDecisions,
            learnerApprovals: record.activeRun.learnerApprovals,
            priorInvalidations: record.activeRun.invalidations,
            reviewStatus: record.activeRun.reviewStatus,
            hasCompletion: Boolean(record.activeRun.completion)
          })
        : null
      const checklist = planningState?.checklist ?? input.checklist
      const invalidations = planningState?.invalidations ?? input.invalidations
      const evidence = {
        ...structuredClone(input.evidence),
        steps: checklist.map((step) => ({
          stepId: step.id,
          status: step.status === 'upcoming' ? 'pending' as const : step.status,
          ...(step.reason ? { reason: step.reason } : {}),
          dependencyInputs: structuredClone(step.dependencyInputs ?? {})
        })),
        invalidations: structuredClone(invalidations)
      }
      const packageChanged = isReviewedPortfolioPackage(record.activeRun) && Boolean(record.activeRun.packageApproval)
        && !currentPortfolioPackageApproval({ ...record.activeRun, evidence })
      const invalidated = invalidations.length > 0 || packageChanged
      return this.saveDirect({
        ...record,
        activeRun: {
          ...record.activeRun,
          evidence,
          checklist: structuredClone(checklist),
          learnerDecisions: planningState?.learnerDecisions ?? record.activeRun.learnerDecisions,
          learnerApprovals: planningState?.learnerApprovals ?? record.activeRun.learnerApprovals,
          packageApproval: packageChanged ? undefined : record.activeRun.packageApproval,
          invalidations: structuredClone(invalidations),
          reviewStatus: invalidated ? 'not-reviewed' : record.activeRun.reviewStatus,
          reviewResult: invalidated ? undefined : record.activeRun.reviewResult,
          completion: invalidated ? undefined : record.activeRun.completion,
          updatedAt: input.updatedAt
        }
      })
    })
  }

  saveConfiguration(input: RunIdentity & {
    configuration: import('../../shared/contracts').CodexTaskConfigurationSnapshot | null
    updatedAt: string
  }): Promise<PracticeWorkspaceRecord> {
    return this.runExclusive(async () => {
      const record = await this.loadDirect()
      if (!matchesRun(record.activeRun, input)) return record
      if (input.configuration
        && (!isCodexTaskConfigurationSnapshot(input.configuration)
          || input.configuration.runId !== record.activeRun.runId
          || input.configuration.threadId !== record.activeRun.binding.threadId)) {
        return record
      }
      const binding = structuredClone(record.activeRun.binding)
      delete binding.configuration
      return this.saveDirect({
        ...record,
        activeRun: {
          ...record.activeRun,
          binding: input.configuration
            ? { ...binding, configuration: structuredClone(input.configuration) }
            : binding,
          updatedAt: input.updatedAt
        }
      })
    })
  }

  saveLearnerDecision(input: RunIdentity & {
    key: string
    value: string
    approval?: PracticeLearnerApproval
    updatedAt: string
  }): Promise<PracticeWorkspaceRecord> {
    return this.runExclusive(async () => {
      const record = await this.loadDirect()
      if (!matchesRun(record.activeRun, input)
        || !ID.test(input.key)
        || input.value.length > 2000
        || (input.approval && !isIso(input.approval.recordedAt))) return record
      return this.saveDirect({
        ...record,
        activeRun: {
          ...record.activeRun,
          learnerDecisions: {
            ...record.activeRun.learnerDecisions,
            [input.key]: input.value
          },
          learnerApprovals: input.approval
            ? {
                ...record.activeRun.learnerApprovals,
                [input.key]: structuredClone(input.approval)
              }
            : record.activeRun.learnerApprovals,
          updatedAt: input.updatedAt
        }
      })
    })
  }

  applyPlanningAction(input: RunIdentity & {
    action: PlanningPracticeActionRequest['action']
    updatedAt: string
  }): Promise<PracticeWorkspaceRecord> {
    return this.runExclusive(async () => {
      const record = await this.loadDirect()
      const active = record.activeRun
      if (!matchesRun(active, input)) return record
      if (active.evidenceProfile !== 'planning-package' || !active.evidence) {
        throw new Error('Module 2 evidence is unavailable')
      }
      const result = applyPlanningPracticeAction({
        state: {
          checklist: active.checklist,
          previousEvidence: active.evidence,
          evidence: active.evidence,
          learnerDecisions: active.learnerDecisions,
          learnerApprovals: active.learnerApprovals,
          priorInvalidations: active.invalidations,
          reviewStatus: active.reviewStatus,
          hasCompletion: Boolean(active.completion)
        },
        action: input.action,
        recordedAt: input.updatedAt
      })
      const invalidated = result.invalidations.length > 0
      const evidence = {
        ...active.evidence,
        steps: result.checklist.map((step) => ({
          stepId: step.id,
          status: step.status === 'upcoming' ? 'pending' as const : step.status,
          ...(step.reason ? { reason: step.reason } : {}),
          dependencyInputs: structuredClone(step.dependencyInputs ?? {})
        })),
        invalidations: structuredClone(result.invalidations)
      }
      return this.saveDirect({
        ...record,
        activeRun: {
          ...active,
          evidence,
          checklist: result.checklist,
          learnerDecisions: result.learnerDecisions,
          learnerApprovals: result.learnerApprovals,
          invalidations: result.invalidations,
          reviewStatus: invalidated ? 'not-reviewed' : active.reviewStatus,
          reviewResult: invalidated ? undefined : active.reviewResult,
          completion: invalidated ? undefined : active.completion,
          updatedAt: input.updatedAt
        }
      })
    })
  }

  beginReview(input: {
    runId: string
    generation: number
    practiceId: string
    practiceVersion: string
    updatedAt: string
  }): Promise<PracticeWorkspaceRecord> {
    return this.runExclusive(async () => {
      const record = await this.loadDirect()
      const active = record.activeRun
      if (!matchesRun(active, input)) return record
      if (isReviewedPortfolioPackage(active) && record.pendingTransition) throw new Error('A portfolio Practice switch is pending')
      return this.saveDirect({
        ...record,
        activeRun: {
          ...active,
          reviewStatus: 'reviewing',
          updatedAt: input.updatedAt
        }
      })
    })
  }

  clearReviewing(input: {
    runId: string
    generation: number
    practiceId: string
    practiceVersion: string
    updatedAt: string
  }): Promise<PracticeWorkspaceRecord> {
    return this.runExclusive(async () => {
      const record = await this.loadDirect()
      const active = record.activeRun
      if (!matchesRun(active, input)
        || active.reviewStatus !== 'reviewing') return record
      return this.saveDirect({
        ...record,
        activeRun: {
          ...active,
          reviewStatus: active.reviewResult?.verdict ?? 'not-reviewed',
          updatedAt: input.updatedAt
        }
      })
    })
  }

  saveReview(input: {
    runId: string
    generation: number
    practiceId: string
    practiceVersion: string
    result: PracticeReviewResult
    checklist: PracticeChecklistStep[]
    completion?: PracticeCompletionReceipt
    updatedAt: string
    expectedPackageDigest?: string
  }): Promise<PracticeWorkspaceRecord> {
    return this.runExclusive(async () => {
      const record = await this.loadDirect()
      const active = record.activeRun
      if (!matchesRun(active, input)) {
        return record
      }
      if (isReviewedPortfolioPackage(active) && (record.pendingTransition !== null || active.evidence?.sourceDigest !== input.expectedPackageDigest
        || (input.result.verdict === 'passed' && !currentPortfolioPackageApproval(active, input.completion?.courseRunId)))) {
        throw new Error('Portfolio package changed before the review could be saved')
      }
      const nextActive: PracticeRunRecord = {
        ...active,
        reviewStatus: input.result.verdict,
        reviewResult: structuredClone(input.result),
        reviewHistory: [
          ...(active.reviewHistory ?? (active.reviewResult ? [active.reviewResult] : [])),
          structuredClone(input.result)
        ].slice(-5),
        checklist: structuredClone(input.checklist),
        updatedAt: input.updatedAt
      }
      if (input.completion) nextActive.completion = structuredClone(input.completion)
      else delete nextActive.completion
      return this.saveDirect({
        ...record,
        activeRun: nextActive
      })
    })
  }
  reset(): Promise<void> {
    return this.runExclusive(async () => {
      await Promise.all([
        rm(this.statePath, { force: true }),
        rm(this.temporaryPath, { force: true }),
        rm(this.corruptPath, { force: true })
      ])
    })
  }

  private async loadDirect(): Promise<PracticeWorkspaceRecord> {
    try {
      const recoverInterruptedReview = !this.initialized
      this.initialized = true
      const parsed: unknown = JSON.parse(await readFile(this.statePath, 'utf8'))
      if (isPracticeWorkspaceRecord(parsed)) {
        const normalized = normalizeWorkspaceRecord(parsed, recoverInterruptedReview)
        if (JSON.stringify(normalized) !== JSON.stringify(parsed)) {
          return this.saveDirect(normalized)
        }
        return structuredClone(normalized)
      }
      const migrated = migrateHistoricalWorkspace(parsed, new Date().toISOString())
      if (migrated) return this.saveDirect(migrated)
      await this.quarantine()
    } catch (error) {
      if (isRecord(error) && error.code !== 'ENOENT') await this.quarantine()
    }
    return defaultPracticeWorkspaceRecord()
  }

  private async saveDirect(record: PracticeWorkspaceRecord): Promise<PracticeWorkspaceRecord> {
    if (!isPracticeWorkspaceRecord(record)) throw new Error('Invalid Practice workspace record')
    this.initialized = true
    await mkdir(this.dataDirectory, { recursive: true })
    await writeFile(this.temporaryPath, JSON.stringify(record, null, 2) + '\n', 'utf8')
    await rename(this.temporaryPath, this.statePath)
    return structuredClone(record)
  }

  private runExclusive<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.queue.then(operation, operation)
    this.queue = result.then(
      () => undefined,
      () => undefined
    )
    return result
  }

  private async quarantine(): Promise<void> {
    await mkdir(this.dataDirectory, { recursive: true })
    await rm(this.corruptPath, { force: true })
    await rename(this.statePath, this.corruptPath).catch(() => undefined)
  }
}
