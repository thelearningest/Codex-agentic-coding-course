import {
  portfolioCheckpointCourseLesson,
  portfolioCheckpointIds,
  portfolioCourseLessonIds,
  portfolioModuleDefinitions,
  portfolioSceneCheckpoint,
  portfolioSceneIds,
  type PortfolioCheckpointId,
  type PortfolioCourseLessonId,
  type PortfolioModuleId,
  type PortfolioSceneId
} from './course/registry'

export type RuntimeInfo = {
  appVersion: string
  platform: string
  packaged: boolean
  testFixturesEnabled: boolean
}

export type CompanionMode = 'compact' | 'expanded'

export type AppSettings = {
  companionMode: CompanionMode
  companionAlwaysOnTop: boolean
}

export type AppSettingsUpdate = Pick<AppSettings, 'companionAlwaysOnTop'>

export const COURSE_VERSION = '0.3.0'
export const LEARNER_STATE_SCHEMA_VERSION = 6

const legacyCheckpointIds = [
  'intro-visual-onboarding',
  'm1-codex-orientation',
  'm1-agents-and-skills',
  'm1-model-choice',
  'm1-setup-checklist',
  'm1-mastery',
  'm1-complete',
  'm2-why-planning',
  'm2-contentpilot-brief',
  'm2-prd-concept',
  'm2-prd-interview',
  'm2-prd-approved',
  'm2-implementation-plan',
  'm2-alignment-review',
  'm2-planning-package',
  'm2-mastery',
  'm2-complete'
] as const

const introAndModuleOneCheckpointIds = [
  'intro-visual-onboarding',
  'm1-codex-orientation',
  'm1-agents-and-skills',
  'm1-setup-checklist',
  'm1-mastery',
  'm1-complete'
] as const

// Introduction and Module 1 stay on the legacy renderer. Modules 2–4 use the
// typed registry. Retired checkpoints remain readable, but only checkpoints
// with current teaching/Practice scenes count toward runnable course progress.
export const runnableCheckpointIds = [
  ...introAndModuleOneCheckpointIds,
  ...new Set(portfolioModuleDefinitions.flatMap((module) => module.scenes.map((scene) => scene.checkpointId)))
] as const

export const checkpointIds = [
  ...legacyCheckpointIds,
  ...portfolioCheckpointIds
] as const satisfies readonly (typeof legacyCheckpointIds[number] | PortfolioCheckpointId)[]

const legacySceneIds = [
  'intro-visual-onboarding',
  'intro-course-overview-2',
  'intro-learning-method',
  'module-1-codex-orientation',
  'module-1-codex-examples',
  'module-1-codex-model-intro',
  'module-1-codex-effort-speed',
  'module-1-codex-slash-commands',
  'module-1-agents-intro',
  'module-1-skills-intro',
  'module-1-skills-portfolio',
  'module-1-model-choice',
  'module-1-model-use-cases',
  'module-1-reasoning-effort',
  'module-1-project-setup',
  'module-1-setup-checklist',
  'module-1-mastery',
  'module-1-final-1',
  'module-1-final-2',
  'module-1-final-3',
  'module-1-final-4',
  'module-1-final-5',
  'module-1-final-6',
  'module-1-final-summary',
  'module-2-why-planning',
  'module-2-planning-example',
  'module-2-why-planning-check',
  'module-2-planning-cost',
  'module-2-contentpilot-brief',
  'module-2-implementation-too-soon',
  'module-2-prd-concept',
  'module-2-prd-example',
  'module-2-prd-visual-examples',
  'module-2-prd-code-examples',
  'module-2-check-planning-prd-1',
  'module-2-check-planning-prd-2',
  'module-2-check-planning-prd-3',
  'module-2-prd-check',
  'module-2-prd-misclassification',
  'module-2-prd-interview',
  'module-2-prompt-example',
  'module-2-prompt-guided-practice',
  'module-2-check-prompt-1',
  'module-2-check-prompt-2',
  'module-2-check-prompt-3',
  'module-2-prd-approved',
  'module-2-implementation-plan',
  'module-2-implementation-plan-example',
  'module-2-check-plan-1',
  'module-2-check-plan-2',
  'module-2-alignment-review',
  'module-2-alignment-mismatch',
  'module-2-planning-package',
  'module-2-mastery',
  'module-2-mastery-repair',
  'module-2-final-1',
  'module-2-final-2',
  'module-2-final-3',
  'module-2-final-4',
  'module-2-final-5',
  'module-2-final-6',
  'module-2-final-7',
  'module-2-final-8',
  'module-2-final-9',
  'module-2-final-10',
  'module-2-final-11',
  'module-2-final-12',
  'module-2-final-13',
  'module-2-final-14',
  'module-2-final-15',
  'module-2-final-summary',
  'module-2-complete'
] as const

export const sceneIds = [
  ...legacySceneIds,
  ...portfolioSceneIds
] as const satisfies readonly (typeof legacySceneIds[number] | PortfolioSceneId)[]

export const lessonIds = [
  'intro',
  'module-1',
  ...portfolioModuleDefinitions.map((module) => module.id)
] as const satisfies readonly ('intro' | 'module-1' | PortfolioModuleId)[]

export type LessonId = (typeof lessonIds)[number]
export type CheckpointId = (typeof checkpointIds)[number]
export type SceneId = (typeof sceneIds)[number]

const legacyCourseLessonIds = [
  'intro-overview',
  'm1-understand-codex',
  'm1-agents-and-skills',
  'm1-skills-and-checklist',
  'm1-assessment',
  'm2-when-to-plan',
  'm2-product-requirements',
  'm2-prd-prompt',
  'm2-implementation-plan',
  'm2-prd-review',
  'm2-assessment'
] as const

export const courseLessonIds = [
  ...legacyCourseLessonIds,
  ...portfolioCourseLessonIds
] as const satisfies readonly (typeof legacyCourseLessonIds[number] | PortfolioCourseLessonId)[]

export type CourseLessonId = (typeof courseLessonIds)[number]

export const sceneCheckpoint: Record<SceneId, CheckpointId> = {
  'intro-visual-onboarding': 'intro-visual-onboarding',
  'intro-course-overview-2': 'intro-visual-onboarding',
  'intro-learning-method': 'intro-visual-onboarding',
  'module-1-codex-orientation': 'm1-codex-orientation',
  'module-1-codex-examples': 'm1-codex-orientation',
  'module-1-codex-model-intro': 'm1-codex-orientation',
  'module-1-codex-effort-speed': 'm1-codex-orientation',
  'module-1-codex-slash-commands': 'm1-codex-orientation',
  'module-1-agents-intro': 'm1-agents-and-skills',
  'module-1-skills-intro': 'm1-agents-and-skills',
  'module-1-skills-portfolio': 'm1-agents-and-skills',
  'module-1-model-choice': 'm1-model-choice',
  'module-1-model-use-cases': 'm1-model-choice',
  'module-1-reasoning-effort': 'm1-model-choice',
  'module-1-project-setup': 'm1-model-choice',
  'module-1-setup-checklist': 'm1-setup-checklist',
  'module-1-mastery': 'm1-mastery',
  'module-1-final-1': 'm1-mastery',
  'module-1-final-2': 'm1-mastery',
  'module-1-final-3': 'm1-mastery',
  'module-1-final-4': 'm1-mastery',
  'module-1-final-5': 'm1-mastery',
  'module-1-final-6': 'm1-mastery',
  'module-1-final-summary': 'm1-mastery',
  'module-2-why-planning': 'm2-why-planning',
  'module-2-planning-example': 'm2-why-planning',
  'module-2-why-planning-check': 'm2-why-planning',
  'module-2-planning-cost': 'm2-why-planning',
  'module-2-contentpilot-brief': 'm2-contentpilot-brief',
  'module-2-implementation-too-soon': 'm2-contentpilot-brief',
  'module-2-prd-concept': 'm2-prd-concept',
  'module-2-prd-example': 'm2-prd-concept',
  'module-2-prd-visual-examples': 'm2-prd-concept',
  'module-2-prd-code-examples': 'm2-prd-concept',
  'module-2-check-planning-prd-1': 'm2-prd-concept',
  'module-2-check-planning-prd-2': 'm2-prd-concept',
  'module-2-check-planning-prd-3': 'm2-prd-concept',
  'module-2-prd-check': 'm2-prd-concept',
  'module-2-prd-misclassification': 'm2-prd-concept',
  'module-2-prd-interview': 'm2-prd-interview',
  'module-2-prompt-example': 'm2-prd-interview',
  'module-2-prompt-guided-practice': 'm2-prd-interview',
  'module-2-check-prompt-1': 'm2-prd-interview',
  'module-2-check-prompt-2': 'm2-prd-interview',
  'module-2-check-prompt-3': 'm2-prd-interview',
  'module-2-prd-approved': 'm2-prd-approved',
  'module-2-implementation-plan': 'm2-implementation-plan',
  'module-2-implementation-plan-example': 'm2-implementation-plan',
  'module-2-check-plan-1': 'm2-implementation-plan',
  'module-2-check-plan-2': 'm2-implementation-plan',
  'module-2-alignment-review': 'm2-alignment-review',
  'module-2-alignment-mismatch': 'm2-alignment-review',
  'module-2-planning-package': 'm2-planning-package',
  'module-2-mastery': 'm2-mastery',
  'module-2-mastery-repair': 'm2-mastery',
  'module-2-final-1': 'm2-mastery',
  'module-2-final-2': 'm2-mastery',
  'module-2-final-3': 'm2-mastery',
  'module-2-final-4': 'm2-mastery',
  'module-2-final-5': 'm2-mastery',
  'module-2-final-6': 'm2-mastery',
  'module-2-final-7': 'm2-mastery',
  'module-2-final-8': 'm2-mastery',
  'module-2-final-9': 'm2-mastery',
  'module-2-final-10': 'm2-mastery',
  'module-2-final-11': 'm2-mastery',
  'module-2-final-12': 'm2-mastery',
  'module-2-final-13': 'm2-mastery',
  'module-2-final-14': 'm2-mastery',
  'module-2-final-15': 'm2-mastery',
  'module-2-final-summary': 'm2-mastery',
  'module-2-complete': 'm2-complete',
  ...portfolioSceneCheckpoint
}

export const checkpointCourseLesson: Record<CheckpointId, CourseLessonId> = {
  'intro-visual-onboarding': 'intro-overview',
  'm1-codex-orientation': 'm1-understand-codex',
  'm1-agents-and-skills': 'm1-agents-and-skills',
  'm1-model-choice': 'm1-skills-and-checklist',
  'm1-setup-checklist': 'm1-assessment',
  'm1-mastery': 'm1-assessment',
  'm1-complete': 'm1-assessment',
  'm2-why-planning': 'm2-when-to-plan',
  'm2-contentpilot-brief': 'm2-when-to-plan',
  'm2-prd-concept': 'm2-product-requirements',
  'm2-prd-interview': 'm2-prd-prompt',
  'm2-prd-approved': 'm2-prd-review',
  'm2-implementation-plan': 'm2-implementation-plan',
  'm2-alignment-review': 'm2-implementation-plan',
  'm2-planning-package': 'm2-prd-review',
  'm2-mastery': 'm2-assessment',
  'm2-complete': 'm2-assessment',
  ...portfolioCheckpointCourseLesson
}

export { portfolioModuleDefinitions }

export function courseLessonIdForScene(sceneId: SceneId): CourseLessonId {
  return checkpointCourseLesson[sceneCheckpoint[sceneId]]
}

export const practiceScenarios = [
  'started',
  'approval_required',
  'success',
  'stale',
  'offline',
  'error'
] as const

export type PracticeScenario = (typeof practiceScenarios)[number]
export type PracticeStatus =
  | 'idle'
  | 'active'
  | 'approval_required'
  | 'completed'
  | 'stale'
  | 'offline'
  | 'error'

export type PracticeEvidence = {
  prdArtifact: string
  implementationPlanArtifact: string
  alignment: string
  observedAt: string
  freshness: 'current' | 'stale'
}

export type PracticeEvent = {
  id: string
  missionId: 'm2-planning-package'
  scenario: PracticeScenario
  status: Exclude<PracticeStatus, 'idle'>
  source: 'fixture'
  correlationId: string
  timestamp: string
  summary: string
  evidence?: PracticeEvidence
}

export type PracticeState = {
  missionId: 'm2-planning-package'
  status: PracticeStatus
  latestEvent?: PracticeEvent
}

export type PracticeFixtureRequest = {
  scenario: PracticeScenario
}

export type LearnerProgress = {
  schemaVersion: typeof LEARNER_STATE_SCHEMA_VERSION
  courseVersion: typeof COURSE_VERSION
  courseRunId: string
  currentLessonId: LessonId
  currentCourseLessonId: CourseLessonId
  checkpointId: CheckpointId
  sceneId: SceneId
  sceneHistory: SceneId[]
  completedCheckpointIds: CheckpointId[]
  decisions: Record<string, string>
  practice: PracticeState
  practiceCompletions: PracticeCompletionReceipt[]
  startedAt: string
  updatedAt: string
}

export type ProgressUpdate = Pick<
  LearnerProgress,
  | 'currentLessonId'
  | 'currentCourseLessonId'
  | 'checkpointId'
  | 'sceneId'
  | 'sceneHistory'
  | 'completedCheckpointIds'
  | 'decisions'
>

export type ProgressLoadResult =
  | { status: 'new' }
  | { status: 'returning'; progress: LearnerProgress }
  | { status: 'recovered'; progress: LearnerProgress }
  | { status: 'reset-required'; reason: string }

export type TeacherContext = {
  lessonId: LessonId
  checkpointId: CheckpointId
  sceneId: SceneId
}

export type TeacherConnectionState = 'simulated' | 'connecting' | 'ready' | 'live' | 'stale' | 'offline'
export type TeacherContextFreshness = 'unavailable' | 'fresh' | 'stale' | 'disconnected'
export type TeacherMemoryStatus = 'ready' | 'pending'
export type TeacherDeliveryStatus = 'pending' | 'delivered' | 'failed'

export type TeacherRuntimeView = {
  connection: TeacherConnectionState
  memory: TeacherMemoryStatus
  observedAt?: string
  contextFreshness?: TeacherContextFreshness
  error?: string
}

export type TeacherMessage = {
  schemaVersion?: 1
  id: string
  role: 'learner' | 'teacher'
  source: 'learner' | 'fixture' | 'live'
  content: string
  timestamp: string
  checkpointId?: CheckpointId
  practiceRunId?: string
  deliveryStatus?: TeacherDeliveryStatus
}

export type TeacherConversation = {
  messages: TeacherMessage[]
  recovered: boolean
}

export type TeacherSendRequest = {
  content: string
  context?: TeacherContext
}

export type TeacherSendResult = {
  learnerMessage: TeacherMessage
  teacherMessage: TeacherMessage
}

export type CompanionState = {
  mode: CompanionMode
  conversation: TeacherConversation
  teacher: TeacherRuntimeView
}

export type ExecutorActivityStatus =
  | 'ready'
  | 'working'
  | 'waiting-for-learner'
  | 'response-ready'
  | 'stale'
  | 'disconnected'

export type WorkspaceEvidenceBaseline = {
  schemaVersion: 1
  capturedAt: string
  gitAvailable: boolean
  head: string | null
  entries: Record<string, string>
}

export type WorkspaceEvidenceReconciliation = {
  changedSinceBaseline: string[]
  committedReportedFilesSinceRunStart: string[]
  currentlyDirtyReportedFiles: string[]
}

export type CodexConfigurationValue = {
  protocolValue: string | null
  label: string | null
}

export type CodexTaskConfigurationSnapshot = {
  schemaVersion: 1
  runId: string
  threadId: string
  source: 'thread-start' | 'thread-resume' | 'thread-settings-updated' | 'thread-settings-snapshot'
  eventTimestampMs: number
  observedAt: string
  freshness: 'fresh' | 'stale' | 'unverifiable'
  connection: 'connected' | 'disconnected'
  model: CodexConfigurationValue
  reasoningEffort: CodexConfigurationValue
  serviceTier: CodexConfigurationValue
  approvalPolicy: CodexConfigurationValue
  fullAccess: CodexConfigurationValue
  sandboxType: string | null
  activePermissionProfile: { id: string; extends: string | null } | null
}

export type ExecutorActivitySnapshot = {
  schemaVersion: 1
  runId: string
  threadId: string
  status: ExecutorActivityStatus
  cursor: string
  learnerPrompts: string[]
  learnerAuthoredPrompts?: string[]
  executorResponses: string[]
  approvalEvents: string[]
  changedFiles: string[]
  verificationEvidence: string[]
  reportedChangedFiles: string[]
  reportedVerificationEvidence: string[]
  workspaceConfirmedChangedFiles: string[]
  workspaceCommittedReportedFilesSinceRunStart: string[]
  workspaceCurrentlyDirtyReportedFiles: string[]
  observedAt: string
  workspaceBaseline: WorkspaceEvidenceBaseline | null
  workspaceEvidenceStatus?: 'available' | 'git-unavailable' | 'failed'
  configuration: CodexTaskConfigurationSnapshot | null
}

export type PracticeLearningSignal = {
  text: string
  basis: 'observed' | 'inferred'
  sourceRunId: string
}

export type PracticeRunSummary = {
  schemaVersion: 1
  practiceId: string
  practiceVersion: string
  runId: string
  attempt: number
  outcome: 'completed' | 'replaced' | 'abandoned' | 'error'
  objective: string
  approach: string
  learnerDecisions: string[]
  approvals: string[]
  changedFiles: string[]
  verificationEvidence: string[]
  learningSignals: PracticeLearningSignal[]
  unresolvedIssues: string[]
  nextAttemptGuidance: string[]
  startedAt: string
  endedAt: string
  summarizedAt: string
  sourceDigest: string
  model: string
  freshness: 'current' | 'stale'
  quality: 'live' | 'pending-refinement'
}

export type TeacherMemoryDocument = {
  schemaVersion: 1
  learnerDecisions: string[]
  learningSignals: PracticeLearningSignal[]
  unresolvedNeeds: PracticeLearningSignal[]
  practiceSummaries: Record<string, PracticeRunSummary[]>
  archivedPracticeSummaries: Record<string, PracticeRunSummary[]>
  updatedAt: string
}

export type PracticePanel = 'teacher' | 'progress'
export type PracticeStepStatus = 'completed' | 'current' | 'pending' | 'stale' | 'upcoming'
export type PracticeReviewStatus = 'not-reviewed' | 'reviewing' | 'needs-work' | 'passed'

export type PracticeEvidenceKind =
  | 'bound-thread-activity'
  | 'workspace-confirmed-change'
  | 'executor-reported-verification'
  | 'learner-decision'
  | 'artifact'
  | 'teacher-assessment'
  | 'codex-task-configuration'
  | 'planning-artifact'
  | 'learner-approval'
  | 'scope-decision'
  | 'artifact-alignment'
  | 'unexpected-workspace-change'

export type PracticeChecklistDefinition = {
  id: string
  title: string
  dependsOn: string[]
}

export type PracticeCriterionDefinition = {
  id: string
  description: string
  required: boolean
  checklistStepId: string
  acceptedEvidence: PracticeEvidenceKind[]
  assertion: string
  freshness: 'fresh' | 'any'
}

export const practiceWorkspaceKinds = ['pilot-workspace', 'learner-portfolio'] as const
export const practiceTaskPolicies = [
  'inherit-configuration-only',
  'safe-workspace-write'
] as const
export const practiceEvidenceProfiles = [
  'codex-task-configuration',
  'planning-package',
  'portfolio-planning',
  'portfolio-build',
  'portfolio-release'
] as const

export type PracticeWorkspaceKind = (typeof practiceWorkspaceKinds)[number]
export type PracticeTaskPolicy = (typeof practiceTaskPolicies)[number]
export type PracticeEvidenceProfile = (typeof practiceEvidenceProfiles)[number]

export type ApprovedCodexConfiguration = {
  schemaVersion: 1
  sourcePracticeId: 'm1-codex-safe-setup'
  sourcePracticeVersion: string
  model?: string
  reasoningEffort: 'medium' | 'high'
  serviceTier: 'standard'
  approvedAt: string
}

export type LegacyPracticeDefinitionV1 = {
  schemaVersion: 1
  practiceId: string
  title: string
  version: string
  checkpointId: CheckpointId
  objective: string
  expectedOutcome: string
  checklist: PracticeChecklistDefinition[]
  criteria: PracticeCriterionDefinition[]
  completionDestination: {
    lessonId: LessonId
    checkpointId: CheckpointId
    sceneId: SceneId
    label: string
  }
}

export type PracticeCompletionDestination = {
  lessonId: LessonId
  checkpointId: CheckpointId
  sceneId: SceneId
}

export type PracticeStageDefinition = {
  id: string
  order: 1 | 2 | 3 | 4 | 5
  dependsOn: string[]
  requiredArtifactPaths: string[]
}

export type PracticeDefinition = {
  schemaVersion: 2
  practiceId: string
  title: string
  version: string
  checkpointId: CheckpointId
  objective: string
  expectedOutcome: string
  workspaceKind: PracticeWorkspaceKind
  taskPolicy: PracticeTaskPolicy
  evidenceProfile: PracticeEvidenceProfile
  stages?: PracticeStageDefinition[]
  checklist: PracticeChecklistDefinition[]
  criteria: PracticeCriterionDefinition[]
  completionDestination: PracticeCompletionDestination & { label: string }
}

export type PracticeStageReceipt = {
  schemaVersion: 1
  courseRunId: string
  practiceId: string
  practiceVersion: string
  runId: string
  stageId: string
  stageIndex: 1 | 2 | 3 | 4 | 5
  workspace: {
    canonicalPath: string
    identityDigest: string
  }
  artifactDigests: Record<string, string>
  approval: {
    approvedAt: string
    artifactDigests: Record<string, string>
  }
  evidence: {
    executorReportedChecks: string[]
    corroboratedArtifacts: Record<string, string>
  }
  status: 'completed' | 'stale'
  freshness: 'current' | 'stale'
  observedAt: string
  staleReason?: string
}

export const portfolioBuildSliceIds = [
  'foundation-hero',
  'selected-work',
  'about-contact-footer',
  'responsive-accessibility'
] as const

export type PortfolioBuildSliceId = (typeof portfolioBuildSliceIds)[number]

export type PracticeBuildSliceReceipt = Omit<PracticeStageReceipt, 'stageId' | 'stageIndex'> & {
  stageId: 'complete-first-version'
  stageIndex: 2
  sliceId: PortfolioBuildSliceId
  sliceIndex: 1 | 2 | 3 | 4
}

export const portfolioPlanningArtifactPaths = [
  'planning/portfolio-brief.md',
  'planning/content-evidence-inventory.md',
  'planning/reference/reference.md',
  'planning/PRD.md',
  'planning/requirement-validation-map.md',
  'planning/implementation-plan.md',
  'planning/first-bounded-task.md'
] as const

export type PortfolioPlanningArtifactPath = (typeof portfolioPlanningArtifactPaths)[number]

export const portfolioPackageVersion = '2.0.0' as const
export const portfolioBuildVersion = '2.0.0' as const
export const portfolioReleaseVersion = '1.0.0' as const
export const portfolioReleaseRecordPath = 'evidence/module-4/deployment-record.json' as const

export type PortfolioPublicUrlObservation = {
  url: string
  finalUrl: string | null
  reachable: boolean
  status: number | null
  checkedAt: string
  title?: string
  textExcerpt?: string
  error?: string
}

export type PortfolioDeploymentRecord = {
  schemaVersion: 1
  moduleThreeSourceCheckpoint: string
  sourceRevision: string
  deployment: { url: string; provider: 'vercel'; deploymentId: string; sourceRevision: string; buildStatus: 'ready'; deployedAt: string }
  validation: { checkedAt: string; command: string; passed: true; desktop: { url: string; observations: string }; mobile: { url: string; observations: string }; limitations: string[] }
  publication: { learnerApproved: true; observedPublicAccess: true }
}
export const portfolioBuildRecordPaths = [
  'evidence/module-3/build-log.md',
  'evidence/module-3/learning-record.md',
  'evidence/module-3/browser-validation.md'
] as const
export const portfolioPackageArtifactPaths = [
  'planning/portfolio-brief.md',
  'planning/content-evidence-inventory.md',
  'planning/reference/reference.md',
  'planning/PRD.md',
  'planning/implementation-plan.md'
] as const

export type PortfolioPackageApproval = {
  courseRunId: string
  runId: string
  generation: number
  threadId: string
  workspaceIdentityDigest: string
  sourceDigest: string
  artifactDigests: Record<string, string>
  recordedAt: string
}

export type PortfolioPlanningArtifactSnapshot = {
  path: string
  digest: string
  byteLength: number
  modifiedAt: string
  observedAt: string
  content?: string
}

export type PortfolioPlanningIssue = {
  stageId: string
  path: string
  code:
    | 'missing'
    | 'empty'
    | 'oversized'
    | 'directory'
    | 'symlink'
    | 'escaping'
    | 'invalid-utf8'
    | 'placeholder'
    | 'missing-section'
    | 'missing-approval'
    | 'invalid-evidence-label'
    | 'privacy-review-incomplete'
    | 'permission-metadata-missing'
    | 'missing-reference-screenshot'
    | 'requirement-coverage'
    | 'invalid-plan-boundary'
    | 'unexpected-workspace-change'
  message: string
}

export type PortfolioPlanningStageEvidence = {
  stageId: string
  stageIndex: 1 | 2 | 3 | 4 | 5
  status: 'ready' | 'blocked'
  artifactDigests: Record<string, string>
  executorReportedChecks: string[]
  corroboratedArtifacts: Record<string, string>
  issueCodes: PortfolioPlanningIssue['code'][]
}

export type PortfolioPlanningEvidenceState = {
  schemaVersion: 1
  workspaceIdentityDigest: string
  artifacts: PortfolioPlanningArtifactSnapshot[]
  issues: PortfolioPlanningIssue[]
  unexpectedPaths: string[]
  stages: PortfolioPlanningStageEvidence[]
}

export type PracticeEvidenceReference = {
  id: string
  kind: PracticeEvidenceKind
  text: string
  freshness: 'fresh' | 'stale'
}

export type PracticeAdapterStepState = {
  stepId: string
  status: 'pending' | 'current' | 'completed' | 'stale'
  reason?: string
  dependencyInputs: Record<string, string>
}

export type PracticeEvidenceInvalidation = {
  changedInput: string
  affectedStepIds: string[]
  reason: string
  nextAction: string
}

export const planningArtifactPaths = [
  'artifacts/PRD.md',
  'artifacts/implementation-plan.md'
] as const

export type PlanningArtifactPath = (typeof planningArtifactPaths)[number]

export type PlanningArtifactSnapshot = {
  schemaVersion: 1
  path: PlanningArtifactPath
  content: string
  digest: string
  byteLength: number
  modifiedAt: string
  observedAt: string
}

export type PlanningArtifactIssue = {
  path: PlanningArtifactPath
  code: 'missing' | 'empty' | 'oversized' | 'directory' | 'symlink' | 'escaping' | 'invalid-utf8' | 'unchanged'
  message: string
}

export type PlanningActivityEvidence = {
  schemaVersion: 1
  cursor: string
  observedAt: string
  learnerTurnCount: number
  executorTurnCount: number
  prdPrompt: {
    text: string
    digest: string
  } | null
}

export type PracticeLearnerApproval = {
  decision: 'approved' | 'revision-requested'
  recordedAt: string
  artifactDigests: Partial<Record<PlanningArtifactPath, string>>
}

export type PracticeAdapterEvidenceState = {
  schemaVersion: 1
  practiceId: string
  practiceVersion: string
  runId: string
  evidenceProfile: PracticeEvidenceProfile
  observedAt: string
  freshness: 'fresh' | 'stale' | 'unverifiable'
  sourceDigest: string | null
  evidence: PracticeEvidenceReference[]
  steps: PracticeAdapterStepState[]
  invalidations: PracticeEvidenceInvalidation[]
  configuration?: CodexTaskConfigurationSnapshot
  planningArtifacts?: PlanningArtifactSnapshot[]
  artifactIssues?: PlanningArtifactIssue[]
  unexpectedChangedPaths?: string[]
  planningActivity?: PlanningActivityEvidence
  portfolioPlanning?: PortfolioPlanningEvidenceState
  portfolioBuild?: PortfolioPlanningEvidenceState
  portfolioRelease?: PortfolioPlanningEvidenceState & { deployment?: PortfolioPublicUrlObservation }
}

export type PracticeCriterionReview = {
  criterionId: string
  status: 'satisfied' | 'unsatisfied' | 'unverifiable'
  evidenceRefs: string[]
  explanation: string
}

export type PracticeReviewResult = {
  schemaVersion: 1
  practiceId: string
  practiceVersion: string
  runId: string
  verdict: 'needs-work' | 'passed'
  criteria: PracticeCriterionReview[]
  summary: string
  reviewedAt: string
  sourceDigest: string
}

export type PracticeReviewChangedStep = {
  stepId: string
  title: string
  reason?: string
}

export type PracticeReviewComparisonView = {
  kind: 'first-review' | 'unchanged' | 'changed'
  previousReviewedAt: string | null
  currentReviewedAt: string
  previousCompletedCount: number | null
  currentCompletedCount: number
  totalStepCount: number
  newlyVerified: PracticeReviewChangedStep[]
  needsReverification: PracticeReviewChangedStep[]
}

export type PracticeCompletionReceipt = {
  schemaVersion: 1
  courseRunId: string
  practiceId: string
  practiceVersion: string
  runId: string
  checkpointId: CheckpointId
  status: 'completed'
  completedAt: string
  evidenceSummary: string
  masterySummary: string
  submissionDigest?: string
  taskEvidenceDigest?: string
  destination: PracticeCompletionDestination
  approvedConfiguration?: ApprovedCodexConfiguration
  portfolioPlanningHandoff?: PortfolioPlanningHandoff
  portfolioBuildHandoff?: PortfolioBuildHandoff
}

export type PortfolioBuildHandoff = LegacyPortfolioBuildHandoff | {
  schemaVersion: 2
  workspace: { canonicalPath: string; identityDigest: string }
  artifactDigests: Record<string, string>
  approval: PortfolioPackageApproval
  submissionDigest: string
  sourceCheckpoint: string
  moduleFourInput: { workspacePath: string; sourceCheckpoint: string }
}

export type LegacyPortfolioBuildHandoff = {
  schemaVersion: 1
  workspace: { canonicalPath: string; identityDigest: string }
  artifactDigests: Record<string, string>
  stageReceiptIds: string[]
  buildSliceReceiptIds: PortfolioBuildSliceId[]
  sourceCheckpoint: string
  moduleFourInput: { workspacePath: string; sourceCheckpoint: string }
}

export type PortfolioPlanningHandoff = LegacyPortfolioPlanningHandoff | PortfolioPackageHandoff

export type PortfolioPackageHandoff = Omit<LegacyPortfolioPlanningHandoff, 'schemaVersion' | 'stageReceipts'> & {
  schemaVersion: 2
  approval: PortfolioPackageApproval
  submission: { runId: string; generation: number; sourceDigest: string; reviewDigest: string; reviewedAt: string }
  task: { runId: string; threadId: string; name: string; workspaceRoot: string; createdAt: string; projectId?: string }
}

export type LegacyPortfolioPlanningHandoff = {
  schemaVersion: 1
  workspace: {
    canonicalPath: string
    identityDigest: string
  }
  artifacts: Array<{
    path: PortfolioPlanningArtifactPath
    digest: string
  }>
  stageReceipts: Array<{
    stageId: string
    stageIndex: 1 | 2 | 3 | 4 | 5
    observedAt: string
    artifactDigests: Record<string, string>
  }>
  mastery: {
    questionIds: string[]
    answerDigest: string
  }
  summary: {
    learnerDecision: string
    evidenceBoundary: string
    firstBuild: string
    deliberatelyOutOfScope: string
  }
  moduleThreeInput: {
    workspacePath: string
    artifactReferences: Array<{
      path: PortfolioPlanningArtifactPath
      digest: string
    }>
  }
}

export type PracticeChecklistStep = {
  id: string
  title: string
  status: PracticeStepStatus
  reason?: string
  dependencyInputs?: Record<string, string>
}

export type PracticePlanningArtifactView = {
  path: PlanningArtifactPath
  availability: 'available' | 'missing' | 'invalid'
  approval: 'approved' | 'pending' | 'revision-requested' | 'stale'
  freshness: 'fresh' | 'stale' | 'unverifiable'
  issue?: PlanningArtifactIssue['code']
}

export type PracticePlanningWorkspaceView = {
  freshness: 'fresh' | 'stale' | 'unverifiable'
  observedAt?: string
  artifacts: PracticePlanningArtifactView[]
  alignment: 'confirmed' | 'pending' | 'stale'
  unexpectedChangedPaths: string[]
  invalidations: PracticeEvidenceInvalidation[]
  actionContext: {
    generation: number
    activityCursor?: string
    prdDigest?: string
    planDigest?: string
  }
}

export type PracticeWorkspaceView = {
  startPrompt?: string
  schemaVersion: 1
  phase: 'brief' | 'switching' | 'active' | 'error'
  title: string
  objective: string
  expectedOutcome: string
  checklist: PracticeChecklistStep[]
  review?: {
    status: PracticeReviewStatus
    canReview: boolean
    canReturn: boolean
    result?: PracticeReviewResult
    comparison?: PracticeReviewComparisonView
  }
  completion?: PracticeCompletionReceipt
  configuration?: CodexTaskConfigurationSnapshot
  planning?: PracticePlanningWorkspaceView
  portfolioPackage?: {
    kind?: 'planning' | 'build' | 'release'
    deployment?: PortfolioPublicUrlObservation
    sourceDigest: string | null
    ready: boolean
    approved: boolean
    artifactPaths: string[]
    issues: string[]
    unexpectedPaths: string[]
  }
  portfolioPlanning?: {
    freshness: 'fresh' | 'stale' | 'unverifiable'
    observedAt?: string
    unexpectedPaths: string[]
    stages: Array<{
      stageId: string
      stageIndex: 1 | 2 | 3 | 4 | 5
      status: 'completed' | 'ready' | 'blocked' | 'stale' | 'pending'
      artifactPaths: string[]
      issueCodes: PortfolioPlanningIssue['code'][]
      staleReason?: string
    }>
  }
  portfolioBuild?: {
    freshness: 'fresh' | 'stale' | 'unverifiable'
    observedAt?: string
    unexpectedPaths: string[]
    stages: Array<{
      stageId: string
      stageIndex: 1 | 2 | 3 | 4 | 5
      status: 'completed' | 'ready' | 'blocked' | 'stale' | 'pending'
      artifactPaths: string[]
      issueCodes: PortfolioPlanningIssue['code'][]
      staleReason?: string
    }>
    slices: Array<{
      sliceId: PortfolioBuildSliceId
      sliceIndex: 1 | 2 | 3 | 4
      status: 'completed' | 'ready' | 'blocked' | 'stale' | 'pending'
      issueCodes: PortfolioPlanningIssue['code'][]
      staleReason?: string
    }>
  }
  completionDestination?: PracticeDefinition['completionDestination']

  activePractice?: {
    runId: string
    generation: number
    practiceId: string
    practiceVersion: string
    executorChatName: string
    startedAt: string
  }
  transition?: {
    stage: 'creating-target' | 'target-created'
    label: string
    canCancel: boolean
    canRetry: boolean
  }
  presentation: {
    fullPanel: PracticePanel
    compactPanel: PracticePanel
  }
  capabilities: {
    canStartNew: boolean
    canResume: boolean
    selectiveTransferAvailable: false
    selectiveTransferReason: string
  }
  error?: string
}

export type PracticeStartRequest = {
  practiceId: string
  practiceVersion: string
  transfer: boolean
}

export type PracticeIdentity = Pick<PracticeStartRequest, 'practiceId' | 'practiceVersion'>

export type PracticeTaskOpenRequest = { runId: string; generation: number }
export const practiceGuidePresentationTypes = [
  'intro-dialog',
  'orientation-card',
  'coach-mark',
  'mastery-confirmation'
] as const
export type PracticeGuidePresentationType = (typeof practiceGuidePresentationTypes)[number]

export const practiceGuideAdvancementModes = [
  'continue',
  'review-requested',
  'course-returned'
] as const
export type PracticeGuideAdvancementMode = (typeof practiceGuideAdvancementModes)[number]

export const practiceGuideAnchorIds = [
  'configuration-evidence',
  'review-progress',
  'return-to-course'
] as const
export type PracticeGuideAnchorId = (typeof practiceGuideAnchorIds)[number]

export type PracticeGuideStageDefinition = {
  id: string
  presentation: PracticeGuidePresentationType
  advancement: PracticeGuideAdvancementMode
  anchor?: PracticeGuideAnchorId
  title: string
  body: string
  primaryLabel?: string
  secondaryLabel?: string
}

export type PracticeGuideDefinition = {
  schemaVersion: 1
  guideId: string
  version: string
  eligiblePractice: {
    practiceId: string
    minimumVersion: string
    maximumVersion: string
  }
  replayPolicy: 'once-per-course-run'
  stages: PracticeGuideStageDefinition[]
}
export type PracticeGuideStatus = 'not-started' | 'in-progress' | 'paused' | 'skipped' | 'completed'

export type PracticeGuideStateIdentity = {
  guideId: string
  guideVersion: string
  courseRunId: string
  practiceId: string
  practiceRunId: string
}

export type PracticeGuideStateRecord = PracticeGuideStateIdentity & {
  schemaVersion: 1
  status: PracticeGuideStatus
  lastStageId: string
  masteryConfirmation: 'pending' | 'dismissed' | null
  createdAt: string
  updatedAt: string
}

export type PracticeGuideView = {
  schemaVersion: 1
  guideId: string
  guideVersion: string
  courseRunId: string
  practiceId: string
  practiceRunId: string
  status: PracticeGuideStatus
  currentStageId: string | null
  step: number
  stepCount: number
  presentation: PracticeGuidePresentationType | null
  anchor: PracticeGuideAnchorId | null
  title: string | null
  body: string | null
  primaryLabel: string | null
  secondaryLabel: string | null
  replay: boolean
  masteryConfirmation: 'pending' | 'dismissed' | null
  error?: string
  actionNotice?: string
  primaryDisabled?: boolean
}

export type PracticeGuideSurfaceContext = {
  surface: 'full' | 'compact' | 'learning'
  activeTab?: 'teacher' | 'progress'
}

export type PracticeGuideContext = {
  progress: LearnerProgress | null
  workspace: PracticeWorkspaceView | null
  surface: 'full' | 'compact' | 'learning'
  activeTab?: 'teacher' | 'progress'
}

export type PracticeGuideUpdateRequest =
  | { type: 'start' }
  | { type: 'continue'; expectedStageId: string }
  | { type: 'pause'; expectedStageId: string }
  | { type: 'resume' }
  | { type: 'skip'; expectedStageId: string }
  | { type: 'replay' }
  | { type: 'dismiss-confirmation' }
  | { type: 'review-requested'; expectedStageId: string }
  | { type: 'course-returned'; expectedStageId: string }

export type PracticeGuideCoordinatorAdapter = {
  load: (context: PracticeGuideContext) => Promise<PracticeGuideView | null>
  update: (request: PracticeGuideUpdateRequest, context: PracticeGuideContext) => Promise<PracticeGuideView | null>
  reset: () => Promise<void>
}

export type PortfolioWorkspaceStatus =
  | 'unselected'
  | 'awaiting-confirmation'
  | 'ready'
  | 'missing'
  | 'permission-denied'
  | 'rejected'
  | 'error'

export type PortfolioWorkspaceView = {
  schemaVersion: 1
  courseRunId: string
  status: PortfolioWorkspaceStatus
  selectedPath?: string
  folderName?: string
  planningPath?: string
  agentsPath?: string
  codexProject?: PortfolioCodexProject
  codexProjectError?: string
  observedAt: string
  message: string
  canChoose: boolean
  canConfirmPlanning: boolean
}

export type PortfolioCodexProject = {
  id: string
  name: string
  registeredAt: string
}

export type PortfolioWorkspaceRequest = {
  courseRunId: string
}

export type PortfolioCodexProjectRequest = PortfolioWorkspaceRequest & {
  expectedPath: string
}

type PlanningActionIdentity = PracticeIdentity & {
  runId: string
  generation: number
}

export type PlanningPracticeActionRequest = PlanningActionIdentity & {
  action:
    | { type: 'capture-prd-prompt'; expectedActivityCursor: string }
    | { type: 'complete-interview'; expectedActivityCursor: string }
    | { type: 'approve-prd' | 'request-prd-revision'; expectedPrdDigest: string }
    | {
        type: 'confirm-alignment' | 'approve-plan' | 'request-plan-revision'
        expectedPrdDigest: string
        expectedPlanDigest: string
      }
    | {
        type: 'record-scope-decision'
        value: string
        expectedPrdDigest: string
        expectedPlanDigest: string
      }
}

export type PortfolioStageActionRequest = PlanningActionIdentity & {
  courseRunId: string
  stageId: string
  sliceId?: PortfolioBuildSliceId
  decision: 'approved' | 'revision-requested'
}

export type PortfolioPackageApprovalRequest = PlanningActionIdentity & {
  courseRunId: string
  sourceDigest: string
} & ({ approvePrd: true; approvePlan: true } | { approveWebsite: true })

export type PracticePanelUpdate = {
  surface: 'full' | 'compact'
  panel: PracticePanel
}

export type PracticeWorkspaceAdapter = {
  loadWorkspace: (identity?: PracticeIdentity) => Promise<PracticeWorkspaceView>
  startNew: (request: PracticeStartRequest) => Promise<PracticeWorkspaceView>
  resume: (identity?: PracticeIdentity) => Promise<PracticeWorkspaceView>
  retry: () => Promise<PracticeWorkspaceView>
  cancel: () => Promise<PracticeWorkspaceView>
  recordPlanningAction: (request: PlanningPracticeActionRequest) => Promise<PracticeWorkspaceView>
  recordPortfolioStageAction: (request: PortfolioStageActionRequest) => Promise<PracticeWorkspaceView>
  approvePortfolioPackage?: (request: PortfolioPackageApprovalRequest) => Promise<PracticeWorkspaceView>
  selectPanel: (update: PracticePanelUpdate) => Promise<PracticeWorkspaceView>
  reset: () => Promise<void>
}

export type TeacherAdapter = {
  loadConversation: () => Promise<TeacherConversation>
  sendMessage: (request: TeacherSendRequest) => Promise<TeacherSendResult>
  reset: () => Promise<void>
}

export type PracticeAdapter = {
  loadState: () => Promise<PracticeState>
  emitFixture: (request: PracticeFixtureRequest) => Promise<PracticeState>
}

export type PracticeReviewSuccess = {
  workspace: PracticeWorkspaceView
}

export type PracticeHintRequest = { runId: string; generation: number }
export type PracticeHint = PracticeHintRequest & {
  content: string
  level: 1 | 2 | 3
  observedAt: string
  source: 'live' | 'fixture'
}
export type PracticeHintResponse = { hint: PracticeHint } | { error: { message: string } }

export type PracticeReviewResponse = PracticeReviewSuccess | {
  error: {
    code: 'task-busy' | 'metadata-unavailable' | 'transport-unavailable' | 'binding-mismatch' | 'evidence-changed' | 'review-unavailable'
    message: string
  }
}

export type CourseCompanionApi = {
  getRuntimeInfo: () => Promise<RuntimeInfo>
  loadProgress: () => Promise<ProgressLoadResult>
  saveProgress: (update: ProgressUpdate) => Promise<LearnerProgress>
  completePortfolioPlanningModule: () => Promise<LearnerProgress>
  completePortfolioBuildModule: () => Promise<LearnerProgress>
  resetProgress: () => Promise<void>
  loadCompanionState: () => Promise<CompanionState>
  sendTeacherMessage: (request: TeacherSendRequest) => Promise<TeacherSendResult>
  loadPracticeState: () => Promise<PracticeState>
  emitPracticeFixture: (request: PracticeFixtureRequest) => Promise<PracticeState>
  onFullTeacherRequested: (callback: () => void) => () => void
  onCompanionModeChanged: (callback: (mode: CompanionMode) => void) => () => void
  loadPortfolioWorkspace: (request: PortfolioWorkspaceRequest) => Promise<PortfolioWorkspaceView>
  choosePortfolioWorkspace: (request: PortfolioWorkspaceRequest) => Promise<PortfolioWorkspaceView>
  confirmPortfolioPlanning: (request: PortfolioWorkspaceRequest) => Promise<PortfolioWorkspaceView>
  ensurePortfolioCodexProject: (request: PortfolioCodexProjectRequest) => Promise<PortfolioWorkspaceView>
  loadPracticeWorkspace: (identity?: PracticeIdentity) => Promise<PracticeWorkspaceView>
  hasActivePractice: () => Promise<boolean>
  startPractice: (request: PracticeStartRequest) => Promise<PracticeWorkspaceView>
  resumePractice: (identity?: PracticeIdentity) => Promise<PracticeWorkspaceView>
  openPracticeTask: (request: PracticeTaskOpenRequest) => Promise<void>
  retryPracticeSwitch: () => Promise<PracticeWorkspaceView>
  cancelPracticeSwitch: () => Promise<PracticeWorkspaceView>
  recordPlanningAction: (request: PlanningPracticeActionRequest) => Promise<PracticeWorkspaceView>
  recordPortfolioStageAction: (request: PortfolioStageActionRequest) => Promise<PracticeWorkspaceView>
  approvePortfolioPackage?: (request: PortfolioPackageApprovalRequest) => Promise<PracticeWorkspaceView>
  selectPracticePanel: (update: PracticePanelUpdate) => Promise<PracticeWorkspaceView>
  reviewPractice: () => Promise<PracticeReviewResponse>
  requestPracticeHint: (request: PracticeHintRequest) => Promise<PracticeHintResponse>
  loadPracticeGuide: (
    context: PracticeGuideSurfaceContext
  ) => Promise<PracticeGuideView | null>
  updatePracticeGuide: (request: PracticeGuideUpdateRequest, context: PracticeGuideSurfaceContext)
    => Promise<PracticeGuideView | null>
  returnPassedPractice: () => Promise<void>
  onPracticeWorkspaceChanged: (callback: () => void) => () => void
  onPracticeReturned: (callback: () => void) => () => void
  loadAppSettings: () => Promise<AppSettings>
  saveAppSettings: (update: AppSettingsUpdate) => Promise<AppSettings>
  showFullTeacher: () => Promise<void>
  setFullTeacherVisible: (visible: boolean) => Promise<void>
  setCompanionMode: (mode: CompanionMode) => Promise<void>
  quitApp: () => Promise<void>
}
