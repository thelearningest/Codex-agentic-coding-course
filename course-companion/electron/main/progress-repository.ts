import {
  appendFile,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile
} from 'node:fs/promises'
import { isAbsolute, join } from 'node:path'
import {
  checkpointIds,
  courseLessonIdForScene,
  courseLessonIds,
  COURSE_VERSION,
  LEARNER_STATE_SCHEMA_VERSION,
  lessonIds,
  portfolioPlanningArtifactPaths,
  portfolioPackageArtifactPaths,
  sceneCheckpoint,
  sceneIds,
  type CourseLessonId,
  type CheckpointId,
  type LearnerProgress,
  type LessonId,
  type PracticeCompletionReceipt,
  type PracticeEvent,
  type PracticeState,
  type ProgressLoadResult,
  type ProgressUpdate,
  type SceneId
} from '../../shared/contracts'
import { isApprovedCodexConfiguration } from './practice-task-policy'

const checkpointSet = new Set<string>(checkpointIds)
const sceneSet = new Set<string>(sceneIds)
const SAFE_ID = /^[A-Za-z0-9_-]{1,160}$/
const courseLessonSet = new Set<string>(courseLessonIds)
const lessonSet = new Set<string>(lessonIds)
const RETIRED_MODULE_ONE_SCENES = new Set([
  'module-1-permissions',
  'module-1-approval-choice',
  'module-1-agents-guidance',
  'module-1-harness-intro',
  'module-1-harness-codex',
  'module-1-skills',
  'module-1-model-choice',
  'module-1-model-use-cases',
  'module-1-reasoning-effort',
  'module-1-project-setup'
])
const RETIRED_MODULE_ONE_ASSESSMENT_SCENES = new Set<string>()
// The Module 1 review keeps four questions; the former questions 3 and 4 and
// their fifth and sixth question pages are retired.
const MODULE_ONE_MASTERY_QUESTION_IDS = ['m1-q1', 'm1-q2', 'm1-q5-agents', 'm1-q6-skills'] as const
const RETIRED_MODULE_ONE_MASTERY_QUESTION_IDS = new Set(['m1-q3', 'm1-q4'])
const RETIRED_MODULE_ONE_QUESTION_SCENES = new Set(['module-1-final-5', 'module-1-final-6'])
const RETIRED_MODULE_TWO_PLAN_SCENES = new Set([
  'module-2-plan-example',
  'module-2-plan-requirements',
  'module-2-plan-steps',
  'module-2-plan-testing',
  'module-2-plan-risks'
])
const RETIRED_MODULE_TWO_PRACTICE_SETUP_SCENES = new Set([
  'module-2-portfolio-practice-intro',
  'module-2-portfolio-agents-setup',
  'module-2-portfolio-brief',
  'module-2-portfolio-brief-example',
  'module-2-check-brief-viewer',
  'module-2-check-brief-success',
  'module-2-content-evidence-inventory',
  'module-2-content-evidence-example',
  'module-2-check-evidence-status',
  'module-2-check-evidence-permission',
  'module-2-visual-reference',
  'module-2-visual-reference-example',
  'module-2-check-reference-boundary',
  'module-2-check-reference-record',
  'module-2-portfolio-prd',
  'module-2-portfolio-prd-example',
  'module-2-check-prd-requirement',
  'module-2-check-prd-accessibility',
  'module-2-implementation-contract',
  'module-2-implementation-contract-example',
  'module-2-check-delayed-scope',
  'module-2-check-delayed-evidence'
])
const RETIRED_MODULE_TWO_SCENES = new Set([
  'module-2-prd-anatomy',
  'module-2-prd-introduction',
  'module-2-prd-sample-prompt',
  'module-2-implementation-plan-sample-prompt',
  ...RETIRED_MODULE_TWO_PLAN_SCENES,
  ...RETIRED_MODULE_TWO_PRACTICE_SETUP_SCENES,
  'module-2-mastery-scenario-evidence',
  'module-2-mastery-scenario-reference',
  'module-2-mastery-owned-scope',
  'module-2-mastery-owned-evidence',
  'module-2-mastery-owned-validation',
  'module-2-mastery-owned-audience'
])
const RETIRED_MODULE_TWO_LESSONS = new Set([
  'm2-content-evidence-inventory',
  'm2-visual-reference',
  'm2-portfolio-prd',
  'm2-implementation-contract'
])
const RETIRED_MODULE_ONE_CHECKPOINTS = new Set([
  'm1-permissions',
  'm1-agents-guidance',
  'm1-skills',
  'm1-model-choice'
])
const RETIRED_MODULE_ONE_LESSONS = new Set([
  'm1-workspace-permissions',
  'm1-agents-guidance',
  'm1-skills-and-checklist'
])
const DIGEST = /^[a-f0-9]{64}$/
const moduleTwoMasteryQuestionIds = [
  'mastery-1',
  'mastery-4',
  'mastery-5',
  'mastery-6'
] as const
// Module 2 completions recorded before the written audience question was removed.
const fiveQuestionModuleTwoMasteryQuestionIds = [
  ...moduleTwoMasteryQuestionIds,
  'mastery-audience-choice'
] as const
const previousModuleTwoMasteryQuestionIds = [
  ...fiveQuestionModuleTwoMasteryQuestionIds,
  'mastery-3',
  'mastery-scope-boundary',
  'mastery-evidence-gap',
  'mastery-requirement-validation'
] as const
const legacyModuleTwoMasteryQuestionIds = [
  ...previousModuleTwoMasteryQuestionIds,
  'mastery-2'
] as const
const RETIRED_MODULE_TWO_MASTERY_QUESTION_IDS = new Set([
  'mastery-2',
  'mastery-3',
  'mastery-scope-boundary',
  'mastery-evidence-gap',
  'mastery-requirement-validation',
  'mastery-audience-choice'
])
const RETIRED_MODULE_THREE_SCENE_DESTINATIONS = new Map<string, SceneId>([
  ['module-3-scaffold-intro', 'module-3-debugging-intro'],
  ['module-3-check-scaffold-boundary', 'module-3-debugging-intro'],
  ['module-3-implementation-cycle', 'module-3-debugging-intro'],
  ['module-3-readiness', 'module-3-debugging-intro'],
  ['module-3-first-version-intro', 'module-3-debugging-intro'],
  ['module-3-check-slice-gate', 'module-3-debugging-intro'],
  ['module-3-revision-intro', 'module-3-git-intro'],
  ['module-3-check-revision-scope', 'module-3-git-intro'],
  ['module-3-check-debug-order', 'module-3-repeated-error'],
  ['module-3-enhancement-intro', 'module-3-portfolio-practice'],
  ['module-3-check-enhancement-boundary', 'module-3-portfolio-practice'],
  ['module-3-practice-intro', 'module-3-portfolio-practice'],
  ['module-3-mastery-scaffold', 'module-3-portfolio-mastery'],
  ['module-3-mastery-slice', 'module-3-portfolio-mastery'],
  ['module-3-mastery-debug', 'module-3-portfolio-mastery'],
  ['module-3-mastery-owned-revision', 'module-3-portfolio-mastery'],
  ['module-3-mastery-owned-enhancement', 'module-3-portfolio-mastery']
])
const RETIRED_MODULE_THREE_MASTERY_QUESTION_IDS = new Set([
  'm3-mastery-1',
  'm3-mastery-2',
  'm3-mastery-3',
  'm3-mastery-owned-revision',
  'm3-mastery-owned-enhancement'
])

function hasRetiredModuleOneReferences(value: Record<string, unknown>): boolean {
  return (
    (typeof value.sceneId === 'string' && (
      RETIRED_MODULE_ONE_SCENES.has(value.sceneId)
      || RETIRED_MODULE_ONE_ASSESSMENT_SCENES.has(value.sceneId)
    )) ||
    (typeof value.checkpointId === 'string' && RETIRED_MODULE_ONE_CHECKPOINTS.has(value.checkpointId)) ||
    (typeof value.currentCourseLessonId === 'string' && RETIRED_MODULE_ONE_LESSONS.has(value.currentCourseLessonId)) ||
    (Array.isArray(value.sceneHistory) && value.sceneHistory.some(
      (sceneId) => typeof sceneId === 'string' && (
        RETIRED_MODULE_ONE_SCENES.has(sceneId)
        || RETIRED_MODULE_ONE_ASSESSMENT_SCENES.has(sceneId)
      )
    )) ||
    (Array.isArray(value.completedCheckpointIds) && value.completedCheckpointIds.some(
      (checkpointId) => typeof checkpointId === 'string' && RETIRED_MODULE_ONE_CHECKPOINTS.has(checkpointId)
    )) ||
    (isRecord(value.decisions) && Object.hasOwn(value.decisions, 'modelChoice'))
  )
}

function redirectRetiredModuleOneReferences(raw: Record<string, unknown>): Record<string, unknown> {
  if (!hasRetiredModuleOneReferences(raw)) return raw
  const retiredSceneDestination = raw.sceneId === 'module-1-agents-guidance'
    ? 'module-1-agents-intro'
    : raw.sceneId === 'module-1-skills'
      ? 'module-1-skills-intro'
      : typeof raw.sceneId === 'string' && RETIRED_MODULE_ONE_SCENES.has(raw.sceneId)
        ? 'module-1-setup-checklist'
        : undefined
  const routesToGuidanceLesson = retiredSceneDestination === 'module-1-agents-intro'
    || retiredSceneDestination === 'module-1-skills-intro'
  return {
    ...raw,
    sceneId: typeof raw.sceneId === 'string' && RETIRED_MODULE_ONE_ASSESSMENT_SCENES.has(raw.sceneId)
      ? 'module-1-final-summary'
      : retiredSceneDestination
        ? retiredSceneDestination
        : raw.sceneId,
    checkpointId: retiredSceneDestination
      ? routesToGuidanceLesson ? 'm1-agents-and-skills' : 'm1-setup-checklist'
      : raw.checkpointId === 'm1-agents-guidance' || raw.checkpointId === 'm1-skills'
        ? 'm1-agents-and-skills'
        : raw.checkpointId === 'm1-permissions' || raw.checkpointId === 'm1-model-choice'
          ? 'm1-setup-checklist'
      : raw.checkpointId,
    currentCourseLessonId: retiredSceneDestination
      ? routesToGuidanceLesson ? 'm1-agents-and-skills' : 'm1-assessment'
      : raw.currentCourseLessonId === 'm1-agents-guidance'
        ? 'm1-agents-and-skills'
        : raw.currentCourseLessonId === 'm1-workspace-permissions'
          || raw.currentCourseLessonId === 'm1-skills-and-checklist'
          ? 'm1-assessment'
      : raw.currentCourseLessonId,
    sceneHistory: Array.isArray(raw.sceneHistory)
      ? raw.sceneHistory.filter((sceneId) => typeof sceneId !== 'string' || (
          !RETIRED_MODULE_ONE_SCENES.has(sceneId)
          && !RETIRED_MODULE_ONE_ASSESSMENT_SCENES.has(sceneId)
        ))
      : raw.sceneHistory,
    completedCheckpointIds: Array.isArray(raw.completedCheckpointIds)
      ? raw.completedCheckpointIds.filter(
          (checkpointId) => typeof checkpointId !== 'string' || !RETIRED_MODULE_ONE_CHECKPOINTS.has(checkpointId)
        )
      : raw.completedCheckpointIds,
    decisions: isRecord(raw.decisions)
      ? Object.fromEntries(Object.entries(raw.decisions).filter(([key]) => key !== 'modelChoice'))
      : raw.decisions
  }
}

function redirectRetiredModuleOneAssessment(raw: Record<string, unknown>): Record<string, unknown> {
  const isRetiredAnswerKey = (key: string) => key.startsWith('assessment:')
    && RETIRED_MODULE_ONE_MASTERY_QUESTION_IDS.has(key.slice('assessment:'.length))
  const hasRetiredAnswer = isRecord(raw.decisions) && Object.keys(raw.decisions).some(isRetiredAnswerKey)
  const isRetiredPage = typeof raw.sceneId === 'string' && RETIRED_MODULE_ONE_QUESTION_SCENES.has(raw.sceneId)
  const hasRetiredHistory = Array.isArray(raw.sceneHistory) && raw.sceneHistory.some(
    (sceneId) => typeof sceneId === 'string' && RETIRED_MODULE_ONE_QUESTION_SCENES.has(sceneId)
  )
  if (!hasRetiredAnswer && !isRetiredPage && !hasRetiredHistory) return raw
  const decisions = isRecord(raw.decisions)
    ? Object.fromEntries(Object.entries(raw.decisions).filter(([key]) => !isRetiredAnswerKey(key)))
    : raw.decisions
  // A learner part-way through the old six-question review resumes at the
  // first remaining question still unanswered, or at the summary.
  const isOnQuestionPage = typeof raw.sceneId === 'string' && /^module-1-final-[0-9]+$/.test(raw.sceneId)
  const resumesReview = isOnQuestionPage && (hasRetiredAnswer || isRetiredPage)
  const firstUnanswered = MODULE_ONE_MASTERY_QUESTION_IDS.findIndex((questionId) =>
    !(isRecord(decisions) && typeof decisions[`assessment:${questionId}`] === 'string'))
  return {
    ...raw,
    sceneId: resumesReview
      ? firstUnanswered >= 0 ? `module-1-final-${firstUnanswered + 1}` : 'module-1-final-summary'
      : raw.sceneId,
    sceneHistory: Array.isArray(raw.sceneHistory)
      ? raw.sceneHistory.filter((sceneId) => typeof sceneId !== 'string' || !RETIRED_MODULE_ONE_QUESTION_SCENES.has(sceneId))
      : raw.sceneHistory,
    decisions
  }
}

function skipRetiredModuleOneCompletionPage(raw: Record<string, unknown>): Record<string, unknown> {
  const retiredPage = 'module-1-complete'
  const sceneHistory = Array.isArray(raw.sceneHistory)
    ? raw.sceneHistory.filter((id) => id !== retiredPage)
    : raw.sceneHistory
  if (raw.sceneId !== retiredPage) return { ...raw, sceneHistory }
  if (raw.currentLessonId !== 'module-1' || raw.currentCourseLessonId !== 'm1-assessment'
    || raw.checkpointId !== 'm1-complete' || !Array.isArray(raw.completedCheckpointIds)) return raw
  const destination = 'module-2-portfolio-workspace'
  return {
    ...raw,
    currentLessonId: 'module-2',
    currentCourseLessonId: courseLessonIdForScene(destination),
    checkpointId: sceneCheckpoint[destination],
    sceneId: destination,
    sceneHistory,
    completedCheckpointIds: [...new Set([...raw.completedCheckpointIds, 'm1-complete'])]
  }
}

function redirectRetiredModuleTwoReferences(raw: Record<string, unknown>): Record<string, unknown> {
  const hasRetiredScene = typeof raw.sceneId === 'string' && RETIRED_MODULE_TWO_SCENES.has(raw.sceneId)
  const hasRetiredLesson = typeof raw.currentCourseLessonId === 'string'
    && RETIRED_MODULE_TWO_LESSONS.has(raw.currentCourseLessonId)
  const hasRetiredHistory = Array.isArray(raw.sceneHistory) && raw.sceneHistory.some(
    (sceneId) => typeof sceneId === 'string' && RETIRED_MODULE_TWO_SCENES.has(sceneId)
  )
  const hasRetiredMasteryAnswer = isRecord(raw.decisions)
    && Object.keys(raw.decisions).some((key) =>
      key.startsWith('assessment:')
      && RETIRED_MODULE_TWO_MASTERY_QUESTION_IDS.has(key.slice('assessment:'.length)))
  if (!hasRetiredScene && !hasRetiredLesson && !hasRetiredHistory && !hasRetiredMasteryAnswer) return raw
  const destination = typeof raw.sceneId === 'string'
    && RETIRED_MODULE_TWO_PRACTICE_SETUP_SCENES.has(raw.sceneId)
    ? 'module-2-portfolio-practice'
    : undefined
  return {
    ...raw,
    sceneId: destination
      ? destination
      : raw.sceneId === 'module-2-prd-anatomy'
      ? 'module-2-prd-review-workflow'
      : raw.sceneId === 'module-2-prd-introduction'
        ? 'module-2-prd-agent-workflow'
        : raw.sceneId === 'module-2-prd-sample-prompt'
        ? 'module-2-prd-agent-workflow'
        : raw.sceneId === 'module-2-implementation-plan-sample-prompt'
        ? 'module-2-portfolio-folder'
        : typeof raw.sceneId === 'string' && RETIRED_MODULE_TWO_PLAN_SCENES.has(raw.sceneId)
          ? 'module-2-implementation-plan-intro'
          : typeof raw.sceneId === 'string' && RETIRED_MODULE_TWO_SCENES.has(raw.sceneId)
            ? 'module-2-mastery-scenario-viewer'
            : raw.sceneId,
    checkpointId: destination ? sceneCheckpoint[destination] : raw.checkpointId,
    currentCourseLessonId: destination || hasRetiredLesson
      ? 'm2-portfolio-brief'
      : raw.currentCourseLessonId,
    sceneHistory: Array.isArray(raw.sceneHistory)
      ? raw.sceneHistory.filter(
          (sceneId) => typeof sceneId !== 'string' || !RETIRED_MODULE_TWO_SCENES.has(sceneId)
        )
      : raw.sceneHistory,
    decisions: isRecord(raw.decisions)
      ? Object.fromEntries(Object.entries(raw.decisions).filter(([key]) =>
          !key.startsWith('assessment:')
          || !RETIRED_MODULE_TWO_MASTERY_QUESTION_IDS.has(key.slice('assessment:'.length))))
      : raw.decisions
  }
}

function redirectRetiredModuleThreeReferences(raw: Record<string, unknown>): Record<string, unknown> {
  const destination = typeof raw.sceneId === 'string'
    ? RETIRED_MODULE_THREE_SCENE_DESTINATIONS.get(raw.sceneId)
    : undefined
  const hasRetiredHistory = Array.isArray(raw.sceneHistory) && raw.sceneHistory.some(
    (sceneId) => typeof sceneId === 'string' && RETIRED_MODULE_THREE_SCENE_DESTINATIONS.has(sceneId)
  )
  const hasRetiredMasteryAnswer = isRecord(raw.decisions)
    && Object.keys(raw.decisions).some((key) =>
      key.startsWith('assessment:')
      && RETIRED_MODULE_THREE_MASTERY_QUESTION_IDS.has(key.slice('assessment:'.length)))
  if (!destination && !hasRetiredHistory && !hasRetiredMasteryAnswer) return raw
  return {
    ...raw,
    sceneId: destination ?? raw.sceneId,
    checkpointId: destination ? sceneCheckpoint[destination] : raw.checkpointId,
    currentCourseLessonId: destination ? courseLessonIdForScene(destination) : raw.currentCourseLessonId,
    sceneHistory: Array.isArray(raw.sceneHistory)
      ? raw.sceneHistory.filter((sceneId) =>
          typeof sceneId !== 'string' || !RETIRED_MODULE_THREE_SCENE_DESTINATIONS.has(sceneId))
      : raw.sceneHistory,
    decisions: isRecord(raw.decisions)
      ? Object.fromEntries(Object.entries(raw.decisions).filter(([key]) =>
          !key.startsWith('assessment:')
          || !RETIRED_MODULE_THREE_MASTERY_QUESTION_IDS.has(key.slice('assessment:'.length))))
      : raw.decisions
  }
}

export function defaultPracticeState(): PracticeState {
  return {
    missionId: 'm2-planning-package',
    status: 'idle'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index])
}

function isDigestRecord(value: unknown): value is Record<string, string> {
  return isRecord(value)
    && Object.keys(value).length <= 20
    && Object.values(value).every((digest) => typeof digest === 'string' && DIGEST.test(digest))
}

function isPortfolioPlanningHandoff(value: unknown): boolean {
  if (isRecord(value) && value.schemaVersion === 2) return isPortfolioPackageHandoff(value)
  if (!isRecord(value) || !hasExactKeys(value, [
    'schemaVersion',
    'workspace',
    'artifacts',
    'stageReceipts',
    'mastery',
    'summary',
    'moduleThreeInput'
  ]) || value.schemaVersion !== 1) return false
  const workspace = isRecord(value.workspace) ? value.workspace : null
  const mastery = isRecord(value.mastery) ? value.mastery : null
  const summary = isRecord(value.summary) ? value.summary : null
  const input = isRecord(value.moduleThreeInput) ? value.moduleThreeInput : null
  if (!workspace || !hasExactKeys(workspace, ['canonicalPath', 'identityDigest'])
    || typeof workspace.canonicalPath !== 'string'
    || !isAbsolute(workspace.canonicalPath)
    || !DIGEST.test(String(workspace.identityDigest))) return false
  if (!Array.isArray(value.artifacts)
    || value.artifacts.length !== portfolioPlanningArtifactPaths.length) return false
  const artifactMap = new Map<string, string>()
  for (const artifact of value.artifacts) {
    if (!isRecord(artifact) || !hasExactKeys(artifact, ['path', 'digest'])
      || !portfolioPlanningArtifactPaths.includes(artifact.path as never)
      || !DIGEST.test(String(artifact.digest))
      || artifactMap.has(String(artifact.path))) return false
    artifactMap.set(String(artifact.path), String(artifact.digest))
  }
  if (!portfolioPlanningArtifactPaths.every((path) => artifactMap.has(path))) return false
  if (!Array.isArray(value.stageReceipts) || value.stageReceipts.length !== 5) return false
  const stageIndexes = new Set<number>()
  const stageIds = new Set<string>()
  for (const receipt of value.stageReceipts) {
    if (!isRecord(receipt) || !hasExactKeys(receipt, [
      'stageId', 'stageIndex', 'observedAt', 'artifactDigests'
    ]) || !SAFE_ID.test(String(receipt.stageId))
      || ![1, 2, 3, 4, 5].includes(Number(receipt.stageIndex))
      || !isIsoDate(receipt.observedAt)
      || !isDigestRecord(receipt.artifactDigests)
      || stageIds.has(String(receipt.stageId))
      || stageIndexes.has(Number(receipt.stageIndex))) return false
    stageIds.add(String(receipt.stageId))
    stageIndexes.add(Number(receipt.stageIndex))
  }
  if (!mastery || !hasExactKeys(mastery, ['questionIds', 'answerDigest'])
    || !Array.isArray(mastery.questionIds)) return false
  const masteryQuestionValues = mastery.questionIds
  const hasQuestionIds = (expected: readonly string[]) => masteryQuestionValues.length === expected.length
    && expected.every((id) => masteryQuestionValues.includes(id))
  if (!masteryQuestionValues.every((id) => typeof id === 'string')
    || (!hasQuestionIds(moduleTwoMasteryQuestionIds)
      && !hasQuestionIds(fiveQuestionModuleTwoMasteryQuestionIds)
      && !hasQuestionIds(previousModuleTwoMasteryQuestionIds)
      && !hasQuestionIds(legacyModuleTwoMasteryQuestionIds))
    || !DIGEST.test(String(mastery.answerDigest))) return false
  if (!summary || !hasExactKeys(summary, [
    'learnerDecision', 'evidenceBoundary', 'firstBuild', 'deliberatelyOutOfScope'
  ]) || !Object.values(summary).every((item) =>
    typeof item === 'string' && item.trim().length > 0 && item.length <= 700)) return false
  if (!input || !hasExactKeys(input, ['workspacePath', 'artifactReferences'])
    || input.workspacePath !== workspace.canonicalPath
    || !Array.isArray(input.artifactReferences)
    || JSON.stringify(input.artifactReferences) !== JSON.stringify(value.artifacts)) return false
  return true
}

function isPortfolioPackageHandoff(value: Record<string, unknown>): boolean {
  if (!hasExactKeys(value, ['schemaVersion', 'workspace', 'artifacts', 'mastery', 'summary', 'moduleThreeInput', 'approval', 'submission', 'task'])) return false
  const { workspace, artifacts, mastery, summary, moduleThreeInput: input, approval, submission, task } = value
  if (!isRecord(workspace) || !isRecord(mastery) || !isRecord(summary) || !isRecord(input)
    || !isRecord(approval) || !isRecord(submission) || !isRecord(task)) return false
  if (typeof workspace.canonicalPath !== 'string' || !isAbsolute(workspace.canonicalPath)
    || !DIGEST.test(String(workspace.identityDigest)) || task.workspaceRoot !== workspace.canonicalPath
    || !SAFE_ID.test(String(task.threadId)) || !SAFE_ID.test(String(task.runId))
    || (task.projectId !== undefined && (typeof task.projectId !== 'string' || !SAFE_ID.test(task.projectId)))
    || typeof task.name !== 'string' || !task.name.trim() || task.name.length > 500 || !isIsoDate(task.createdAt)) return false
  if (!Array.isArray(artifacts) || artifacts.length !== portfolioPackageArtifactPaths.length
    || !artifacts.every((artifact) => isRecord(artifact) && hasExactKeys(artifact, ['path', 'digest'])
      && portfolioPackageArtifactPaths.includes(artifact.path as never) && DIGEST.test(String(artifact.digest)))
    || new Set(artifacts.map((artifact) => artifact.path)).size !== artifacts.length) return false
  if (!SAFE_ID.test(String(approval.courseRunId)) || approval.runId !== task.runId || approval.threadId !== task.threadId
    || !Number.isSafeInteger(approval.generation) || Number(approval.generation) < 1
    || approval.workspaceIdentityDigest !== workspace.identityDigest || !DIGEST.test(String(approval.sourceDigest))
    || !isIsoDate(approval.recordedAt) || !isDigestRecord(approval.artifactDigests)
    || !artifacts.every((artifact) => approval.artifactDigests && (approval.artifactDigests as Record<string, string>)[artifact.path] === artifact.digest)) return false
  if (submission.runId !== task.runId || submission.generation !== approval.generation
    || submission.sourceDigest !== approval.sourceDigest || !DIGEST.test(String(submission.reviewDigest))
    || !isIsoDate(submission.reviewedAt)) return false
  return Array.isArray(mastery.questionIds)
    && [moduleTwoMasteryQuestionIds, fiveQuestionModuleTwoMasteryQuestionIds].some((expected) =>
      (mastery.questionIds as string[]).length === expected.length
      && expected.every((id) => (mastery.questionIds as string[]).includes(id)))
    && DIGEST.test(String(mastery.answerDigest))
    && hasExactKeys(summary, ['learnerDecision', 'evidenceBoundary', 'firstBuild', 'deliberatelyOutOfScope'])
    && Object.values(summary).every((text) => typeof text === 'string' && text.trim().length > 0 && text.length <= 700)
    && input.workspacePath === workspace.canonicalPath && JSON.stringify(input.artifactReferences) === JSON.stringify(artifacts)
}

function isLessonId(value: unknown): value is LessonId {
  return typeof value === 'string' && lessonSet.has(value)
}

function isCheckpointId(value: unknown): value is CheckpointId {
  return typeof value === 'string' && checkpointSet.has(value)
}

function isSceneId(value: unknown): value is SceneId {
  return typeof value === 'string' && sceneSet.has(value)
}

export function isPracticeCompletionReceipt(value: unknown): value is PracticeCompletionReceipt {
  if (!isRecord(value) || value.schemaVersion !== 1 || value.status !== 'completed') return false
  const destination = value.destination
  return SAFE_ID.test(String(value.courseRunId))
    && SAFE_ID.test(String(value.practiceId))
    && typeof value.practiceVersion === 'string'
    && value.practiceVersion.length > 0
    && value.practiceVersion.length <= 40
    && SAFE_ID.test(String(value.runId))
    && isCheckpointId(value.checkpointId)
    && isIsoDate(value.completedAt)
    && typeof value.evidenceSummary === 'string'
    && value.evidenceSummary.length > 0
    && value.evidenceSummary.length <= 1500
    && typeof value.masterySummary === 'string'
    && value.masterySummary.length > 0
    && value.masterySummary.length <= 1500
    && isRecord(destination)
    && isLessonId(destination.lessonId)
    && isCheckpointId(destination.checkpointId)
    && isSceneId(destination.sceneId)
    && sceneCheckpoint[destination.sceneId] === destination.checkpointId
    && ((destination.lessonId === 'intro' && destination.sceneId.startsWith('intro-'))
      || (destination.lessonId !== 'intro'
        && destination.sceneId.startsWith(`${destination.lessonId}-`)))
    && (value.approvedConfiguration === undefined ||
      isApprovedCodexConfiguration(value.approvedConfiguration))
    && (value.portfolioPlanningHandoff === undefined
      || isPortfolioPlanningHandoff(value.portfolioPlanningHandoff))
    && (value.submissionDigest === undefined || DIGEST.test(String(value.submissionDigest)))
    && (value.taskEvidenceDigest === undefined || DIGEST.test(String(value.taskEvidenceDigest)))
    && (!isRecord(value.portfolioBuildHandoff) || value.portfolioBuildHandoff.schemaVersion !== 2
      || (value.practiceId === 'm3-portfolio-build' && value.practiceVersion === '2.0.0'
        && value.submissionDigest === value.portfolioBuildHandoff.submissionDigest
        && DIGEST.test(String(value.submissionDigest))
        && isRecord(value.portfolioBuildHandoff.workspace)
        && isRecord(value.portfolioBuildHandoff.approval)
        && value.portfolioBuildHandoff.approval.courseRunId === value.courseRunId
        && value.portfolioBuildHandoff.approval.runId === value.runId
        && value.portfolioBuildHandoff.approval.workspaceIdentityDigest === value.portfolioBuildHandoff.workspace.identityDigest
        && isRecord(value.portfolioBuildHandoff.artifactDigests)
        && DIGEST.test(String(value.portfolioBuildHandoff.artifactDigests['application/source']))
        && value.portfolioBuildHandoff.sourceCheckpoint === `sha256:${value.portfolioBuildHandoff.artifactDigests['application/source']}`
        && isRecord(value.portfolioBuildHandoff.moduleFourInput)
        && value.portfolioBuildHandoff.moduleFourInput.sourceCheckpoint === value.portfolioBuildHandoff.sourceCheckpoint
        && value.portfolioBuildHandoff.moduleFourInput.workspacePath === value.portfolioBuildHandoff.workspace.canonicalPath))
    && (!isRecord(value.portfolioPlanningHandoff) || value.portfolioPlanningHandoff.schemaVersion !== 2
      || (value.practiceVersion === '2.0.0' && isRecord(value.portfolioPlanningHandoff.approval)
        && value.portfolioPlanningHandoff.approval.courseRunId === value.courseRunId
        && value.portfolioPlanningHandoff.approval.runId === value.runId))
}

function completionKey(receipt: PracticeCompletionReceipt): string {
  const base = `${receipt.courseRunId}:${receipt.practiceId}:${receipt.practiceVersion}:${receipt.runId}`
  return ((['m2-portfolio-planning', 'm3-portfolio-build'].includes(receipt.practiceId) && receipt.practiceVersion === '2.0.0')
    || (receipt.practiceId === 'm4-portfolio-release' && receipt.practiceVersion === '1.0.0'))
    ? `${base}:${receipt.checkpointId}:${receipt.submissionDigest ?? ''}:${receipt.taskEvidenceDigest ?? ''}` : base
}

const moduleTwoFinalQuestionIds = Array.from({ length: 15 }, (_, index) => `final-${index + 1}`)

function hasPassedPlanningPractice(progress: LearnerProgress): boolean {
  return progress.practiceCompletions.some((receipt) =>
    receipt.courseRunId === progress.courseRunId
    && receipt.practiceId === 'm2-planning-package'
    && receipt.checkpointId === 'm2-planning-package'
    && receipt.destination.lessonId === 'module-2'
    && receipt.destination.checkpointId === 'm2-mastery'
    && receipt.destination.sceneId === 'module-2-mastery')
}

function moduleTwoMasteryScore(decisions: Record<string, string>): number {
  return moduleTwoFinalQuestionIds.filter((questionId) =>
    decisions[`assessment:${questionId}`]?.startsWith('correct')).length
}

function assertModuleTwoCompletionGate(update: ProgressUpdate, current: LearnerProgress | null): void {
  if (update.sceneId !== 'module-2-complete') return
  if (!current || !hasPassedPlanningPractice(current)
    || !update.completedCheckpointIds.includes('m2-planning-package')) {
    throw new Error('Module 2 requires a passed planning Practice before completion')
  }
  if (moduleTwoMasteryScore(update.decisions) < 12
    || !update.completedCheckpointIds.includes('m2-mastery')) {
    throw new Error('Module 2 requires a 12/15 mastery score before completion')
  }
}

function hasPortfolioModuleCompletion(progress: LearnerProgress): boolean {
  return progress.practiceCompletions.some((receipt) =>
    receipt.courseRunId === progress.courseRunId
    && receipt.practiceId === 'm2-portfolio-planning'
    && receipt.checkpointId === 'm2-portfolio-complete'
    && receipt.practiceVersion === '2.0.0'
    && receipt.destination.lessonId === 'module-3'
    && (receipt.destination.sceneId === 'module-3-local-preview'
      || receipt.destination.sceneId === 'module-3-debugging-intro')
    && receipt.portfolioPlanningHandoff?.schemaVersion === 2)
}

function assertModuleThreeUnlockGate(update: ProgressUpdate, current: LearnerProgress | null): void {
  if (update.currentLessonId !== 'module-3') return
  if (!current || !hasPortfolioModuleCompletion(current)) {
    throw new Error('Module 3 requires an atomic Module 2 completion receipt')
  }
}

function assertPortfolioMasteryGate(update: ProgressUpdate, current: LearnerProgress | null): void {
  if (update.currentLessonId !== 'module-2' || update.checkpointId !== 'm2-portfolio-mastery') return
  if (!current?.practiceCompletions.some((receipt) => receipt.courseRunId === current.courseRunId
    && receipt.practiceId === 'm2-portfolio-planning' && receipt.practiceVersion === '2.0.0'
    && receipt.checkpointId === 'm2-portfolio-planning' && Boolean(receipt.submissionDigest))) {
    throw new Error('Module 2 mastery requires a passed five-document Practice submission')
  }
}

function hasPortfolioBuildCompletion(progress: LearnerProgress): boolean {
  return progress.practiceCompletions.some((receipt) =>
    receipt.courseRunId === progress.courseRunId
    && receipt.practiceId === 'm3-portfolio-build'
    && receipt.checkpointId === 'm3-complete'
    && receipt.destination.sceneId === 'module-3-complete'
    && receipt.practiceVersion === '2.0.0' && receipt.portfolioBuildHandoff?.schemaVersion === 2)
}

function assertModuleFourUnlockGate(update: ProgressUpdate, current: LearnerProgress | null): void {
  if (update.currentLessonId !== 'module-4') return
  if (!current || !hasPortfolioBuildCompletion(current)) {
    throw new Error('Module 4 requires an atomic Module 3 completion receipt')
  }
}

function courseRunId(startedAt: string): string {
  return `course-${startedAt.replace(/[^0-9]/g, '').slice(0, 17)}`
}

function isCourseLessonId(value: unknown): value is CourseLessonId {
  return typeof value === 'string' && courseLessonSet.has(value)
}

function decisionsAreValid(value: unknown): value is Record<string, string> {
  return (
    isRecord(value) &&
    Object.entries(value).every(
      ([key, decision]) => key.length <= 80 && typeof decision === 'string' && decision.length <= 500
    )
  )
}

function isPracticeEvidence(value: unknown): boolean {
  return (
    isRecord(value) &&
    value.prdArtifact === 'PRD.md · đã duyệt' &&
    value.implementationPlanArtifact === 'implementation-plan.md · đã duyệt' &&
    typeof value.alignment === 'string' &&
    isIsoDate(value.observedAt) &&
    (value.freshness === 'current' || value.freshness === 'stale')
  )
}

function isPracticeEvent(value: unknown): value is PracticeEvent {
  if (!isRecord(value)) return false
  if (typeof value.id !== 'string' || value.id.length < 1 || value.id.length > 160) return false
  if (value.missionId !== 'm2-planning-package') return false
  if (!['started', 'approval_required', 'success', 'stale', 'offline', 'error'].includes(String(value.scenario))) return false
  if (!['active', 'approval_required', 'completed', 'stale', 'offline', 'error'].includes(String(value.status))) return false
  if (value.source !== 'fixture') return false
  if (typeof value.correlationId !== 'string' || value.correlationId.length < 1 || value.correlationId.length > 160) return false
  if (!isIsoDate(value.timestamp)) return false
  if (typeof value.summary !== 'string' || value.summary.length > 500) return false
  return value.evidence === undefined || isPracticeEvidence(value.evidence)
}

export function isPracticeState(value: unknown): value is PracticeState {
  if (!isRecord(value) || value.missionId !== 'm2-planning-package') return false
  if (!['idle', 'active', 'approval_required', 'completed', 'stale', 'offline', 'error'].includes(String(value.status))) return false
  if (value.status === 'idle') return value.latestEvent === undefined
  return isPracticeEvent(value.latestEvent) && value.latestEvent.status === value.status
}

export function isProgressUpdate(value: unknown): value is ProgressUpdate {
  if (!isRecord(value)) return false
  if (!isLessonId(value.currentLessonId)) return false
  if (!isCheckpointId(value.checkpointId)) return false
  if (!isSceneId(value.sceneId)) return false
  if (sceneCheckpoint[value.sceneId] !== value.checkpointId) return false
  if (!isCourseLessonId(value.currentCourseLessonId)) return false
  if (courseLessonIdForScene(value.sceneId) !== value.currentCourseLessonId) return false
  if (value.currentLessonId === 'intro' && !value.sceneId.startsWith('intro-')) return false
  if (value.currentLessonId !== 'intro'
    && !value.sceneId.startsWith(`${value.currentLessonId}-`)) return false
  if (!Array.isArray(value.sceneHistory) || value.sceneHistory.length > 200) return false
  if (!value.sceneHistory.every(isSceneId)) return false
  if (!Array.isArray(value.completedCheckpointIds)) return false
  if (!value.completedCheckpointIds.every(isCheckpointId)) return false
  if (new Set(value.completedCheckpointIds).size !== value.completedCheckpointIds.length) return false
  return decisionsAreValid(value.decisions)
}

export function isLearnerProgress(value: unknown): value is LearnerProgress {
  if (!isRecord(value)) return false
  if (value.schemaVersion !== LEARNER_STATE_SCHEMA_VERSION) return false
  if (value.courseVersion !== COURSE_VERSION) return false
  if (!SAFE_ID.test(String(value.courseRunId))) return false
  if (!isIsoDate(value.startedAt) || !isIsoDate(value.updatedAt)) return false
  if (!Array.isArray(value.practiceCompletions)
    || value.practiceCompletions.length > 100
    || !value.practiceCompletions.every(isPracticeCompletionReceipt)
    || new Set(value.practiceCompletions.map(completionKey)).size !== value.practiceCompletions.length) return false
  const practice = value.practice
  if (!isProgressUpdate(value)) return false
  return isPracticeState(practice)
}

function normalizeCurrentModuleTwoOrder(raw: Record<string, unknown>): Record<string, unknown> {
  if (raw.currentLessonId !== 'module-2') return raw
  const completed = Array.isArray(raw.completedCheckpointIds)
    ? [...raw.completedCheckpointIds]
    : raw.completedCheckpointIds

  if (raw.sceneId === 'module-2-prd-approved') {
    return {
      ...raw,
      currentCourseLessonId: 'm2-implementation-plan',
      checkpointId: 'm2-implementation-plan',
      sceneId: 'module-2-implementation-plan',
      completedCheckpointIds: Array.isArray(completed)
        ? [...new Set([...completed, 'm2-prd-interview'])]
        : completed
    }
  }
  if (raw.sceneId === 'module-2-alignment-review' || raw.sceneId === 'module-2-alignment-mismatch') {
    return {
      ...raw,
      currentCourseLessonId: 'm2-prd-review',
      checkpointId: 'm2-planning-package',
      sceneId: 'module-2-planning-package',
      completedCheckpointIds: Array.isArray(completed)
        ? [...new Set([...completed, 'm2-implementation-plan'])]
        : completed
    }
  }
  if (raw.sceneId === 'module-2-planning-package') {
    return { ...raw, currentCourseLessonId: 'm2-prd-review' }
  }
  if (raw.sceneId === 'module-2-check-plan-2') {
    return {
      ...raw,
      currentCourseLessonId: 'm2-implementation-plan',
      checkpointId: 'm2-implementation-plan'
    }
  }
  return raw
}

function migrateLearnerProgress(value: unknown): LearnerProgress | null {
  if (!isRecord(value)) return null
  const raw = value as Record<string, unknown>
  const schemaVersion = raw.schemaVersion
  const courseVersion = raw.courseVersion
  const startedAt = raw.startedAt
  const updatedAt = raw.updatedAt
  if (!isIsoDate(startedAt) || !isIsoDate(updatedAt)) return null

  if (schemaVersion === LEARNER_STATE_SCHEMA_VERSION && courseVersion === COURSE_VERSION) {
    const redirected = redirectRetiredModuleThreeReferences(
      redirectRetiredModuleTwoReferences(redirectRetiredModuleOneAssessment(redirectRetiredModuleOneReferences(raw)))
    )
    const compatible = {
      ...redirected,
      ...(redirected.courseRunId === undefined ? { courseRunId: courseRunId(startedAt) } : {}),
      ...(redirected.practiceCompletions === undefined ? { practiceCompletions: [] } : {})
    }
    const normalized = normalizeCurrentModuleTwoOrder(skipRetiredModuleOneCompletionPage(compatible))
    if (!isLearnerProgress(normalized)) return null
    const requiresFreshPortfolioReview = normalized.currentLessonId === 'module-3'
      && !hasPortfolioModuleCompletion(normalized)
      && normalized.practiceCompletions.some((receipt) => receipt.practiceId === 'm2-portfolio-planning'
        && receipt.practiceVersion === '1.0.0' && receipt.courseRunId === normalized.courseRunId)
    return requiresFreshPortfolioReview ? {
      ...normalized, currentLessonId: 'module-2', currentCourseLessonId: 'm2-portfolio-brief',
      checkpointId: 'm2-portfolio-planning', sceneId: 'module-2-portfolio-practice'
    } : normalized
  }

  return null
}

function isObsoleteCourseProgress(value: unknown): boolean {
  return isRecord(value)
    && typeof value.courseVersion === 'string'
    && typeof value.schemaVersion === 'number'
    && (value.courseVersion !== COURSE_VERSION
      || value.schemaVersion !== LEARNER_STATE_SCHEMA_VERSION)
}

type ReadResult =
  | { status: 'missing' }
  | { status: 'obsolete' }
  | { status: 'invalid' }
  | { status: 'valid'; progress: LearnerProgress; migrated: boolean }

export class ProgressRepository {
  private readonly statePath: string
  private readonly stateTempPath: string
  private readonly backupPath: string
  private readonly backupTempPath: string
  private readonly activityPath: string
  private operationQueue: Promise<void> = Promise.resolve()

  constructor(
    private readonly dataDirectory: string,
    private readonly now: () => Date = () => new Date()
  ) {
    this.statePath = join(dataDirectory, 'learner-state.json')
    this.stateTempPath = join(dataDirectory, 'learner-state.json.tmp')
    this.backupPath = join(dataDirectory, 'learner-state.backup.json')
    this.backupTempPath = join(dataDirectory, 'learner-state.backup.json.tmp')
    this.activityPath = join(dataDirectory, 'activity-log.jsonl')
  }

  load(): Promise<ProgressLoadResult> {
    return this.runExclusive(() => this.loadUnlocked())
  }

  private async loadUnlocked(): Promise<ProgressLoadResult> {
    const primary = await this.readProgress(this.statePath)
    if (primary.status === 'valid') {
      if (primary.migrated) {
        await this.writeAtomic(this.statePath, this.stateTempPath, primary.progress)
        await this.writeAtomic(this.backupPath, this.backupTempPath, primary.progress)
        await this.appendActivity('progress_migrated', primary.progress)
      }
      return { status: 'returning', progress: primary.progress }
    }

    const backup = await this.readProgress(this.backupPath)
    if (backup.status === 'valid') {
      await this.writeAtomic(this.statePath, this.stateTempPath, backup.progress)
      await this.appendActivity('progress_recovered', backup.progress)
      return { status: 'recovered', progress: backup.progress }
    }

    if ((primary.status === 'missing' || primary.status === 'obsolete')
      && (backup.status === 'missing' || backup.status === 'obsolete')) {
      return { status: 'new' }
    }

    return {
      status: 'reset-required',
      reason: 'Không thể đọc tiến trình hiện tại hoặc bản sao khôi phục.'
    }
  }

  save(update: ProgressUpdate): Promise<LearnerProgress> {
    if (!isProgressUpdate(update)) {
      return Promise.reject(new Error('Invalid learner progress update'))
    }
    return this.runExclusive(() => this.saveUnlocked(update))
  }

  private async saveUnlocked(update: ProgressUpdate): Promise<LearnerProgress> {
    const current = await this.readProgress(this.statePath)
    assertModuleTwoCompletionGate(update, current.status === 'valid' ? current.progress : null)
    assertPortfolioMasteryGate(update, current.status === 'valid' ? current.progress : null)
    assertModuleThreeUnlockGate(update, current.status === 'valid' ? current.progress : null)
    assertModuleFourUnlockGate(update, current.status === 'valid' ? current.progress : null)
    if (update.sceneId === 'module-4-complete' && (current.status !== 'valid'
      || !current.progress.completedCheckpointIds.includes('m4-portfolio-release')
      || !current.progress.practiceCompletions.some((receipt) => receipt.courseRunId === current.progress.courseRunId
        && receipt.practiceId === 'm4-portfolio-release' && receipt.practiceVersion === '1.0.0'
        && receipt.destination.sceneId === 'module-4-complete' && Boolean(receipt.submissionDigest)))) {
      throw new Error('Module 4 completion requires return from the current reviewed Practice')
    }
    const timestamp = this.now().toISOString()
    const progress: LearnerProgress = {
      ...update,
      schemaVersion: LEARNER_STATE_SCHEMA_VERSION,
      courseVersion: COURSE_VERSION,
      practice: current.status === 'valid' ? current.progress.practice : defaultPracticeState(),
      courseRunId: current.status === 'valid'
        ? current.progress.courseRunId
        : courseRunId(timestamp),
      startedAt: current.status === 'valid' ? current.progress.startedAt : timestamp,
      practiceCompletions: current.status === 'valid' ? current.progress.practiceCompletions : [],
      updatedAt: timestamp
    }

    await mkdir(this.dataDirectory, { recursive: true })
    if (current.status === 'valid') {
      await this.writeAtomic(this.backupPath, this.backupTempPath, current.progress)
    }

    await this.writeAtomic(this.statePath, this.stateTempPath, progress)

    if (current.status !== 'valid') {
      await this.writeAtomic(this.backupPath, this.backupTempPath, progress)
    }

    await this.appendActivity('progress_saved', progress)
    return progress
  }

  completePortfolioPlanning(receipt: PracticeCompletionReceipt): Promise<LearnerProgress> {
    if (!isPracticeCompletionReceipt(receipt)
      || receipt.practiceId !== 'm2-portfolio-planning'
      || receipt.checkpointId !== 'm2-portfolio-complete'
      || receipt.destination.lessonId !== 'module-3'
      || receipt.destination.checkpointId !== 'm3-complete-first-version'
      || (receipt.destination.sceneId !== 'module-3-local-preview'
        && receipt.destination.sceneId !== 'module-3-debugging-intro')
      || receipt.practiceVersion !== '2.0.0'
      || receipt.portfolioPlanningHandoff?.schemaVersion !== 2) {
      return Promise.reject(new Error('Invalid Module 2 completion receipt'))
    }
    return this.runExclusive(async () => {
      const current = await this.readProgress(this.statePath)
      if (current.status !== 'valid') throw new Error('Learner progress is unavailable')
      const progress = current.progress
      if (receipt.portfolioPlanningHandoff?.schemaVersion === 2 && progress.practiceCompletions.some((item) =>
        completionKey(item) === completionKey(receipt) && JSON.stringify(item) === JSON.stringify(receipt))) return progress
      if (progress.sceneId !== 'module-2-portfolio-mastery-summary'
        || receipt.courseRunId !== progress.courseRunId) {
        throw new Error('Module 2 completion does not match the current learner checkpoint')
      }
      const allMasteryCurrent = moduleTwoMasteryQuestionIds.every((questionId) =>
        progress.decisions[`assessment:${questionId}`]?.startsWith('correct'))
      if (!allMasteryCurrent) throw new Error('Module 2 mastery evidence is incomplete')

      const completedCheckpointIds = [...new Set([
        ...progress.completedCheckpointIds,
        'm2-portfolio-planning' as CheckpointId,
        'm2-portfolio-mastery' as CheckpointId,
        'm2-portfolio-complete' as CheckpointId
      ])]
      const completions = progress.practiceCompletions.filter((candidate) =>
        receipt.practiceVersion === '2.0.0' ? completionKey(candidate) !== completionKey(receipt)
          : !(candidate.courseRunId === receipt.courseRunId
          && candidate.practiceId === receipt.practiceId
          && candidate.runId === receipt.runId))
      const updated: LearnerProgress = {
        ...progress,
        currentLessonId: 'module-3',
        currentCourseLessonId: 'm3-complete-first-version',
        checkpointId: 'm3-complete-first-version',
        sceneId: receipt.destination.sceneId,
        sceneHistory: [...progress.sceneHistory, progress.sceneId].slice(-200),
        completedCheckpointIds,
        practiceCompletions: [...completions, structuredClone(receipt)],
        updatedAt: this.now().toISOString()
      }
      if (!isLearnerProgress(updated)) throw new Error('Invalid completed Module 2 progress')
      await this.writeAtomic(this.backupPath, this.backupTempPath, progress)
      await this.writeAtomic(this.statePath, this.stateTempPath, updated)
      await this.appendActivity('module_2_completed', updated)
      return updated
    })
  }

  completePortfolioBuild(receipt: PracticeCompletionReceipt): Promise<LearnerProgress> {
    if (!isPracticeCompletionReceipt(receipt)
      || receipt.practiceId !== 'm3-portfolio-build'
      || receipt.checkpointId !== 'm3-complete'
      || receipt.destination.lessonId !== 'module-3'
      || receipt.destination.checkpointId !== 'm3-complete'
      || receipt.destination.sceneId !== 'module-3-complete'
      || !receipt.portfolioBuildHandoff) {
      return Promise.reject(new Error('Invalid Module 3 completion receipt'))
    }
    return this.runExclusive(async () => {
      const current = await this.readProgress(this.statePath)
      if (current.status !== 'valid') throw new Error('Learner progress is unavailable')
      const progress = current.progress
      if (progress.sceneId !== 'module-3-mastery-summary' || receipt.courseRunId !== progress.courseRunId) {
        throw new Error('Module 3 completion does not match the current learner checkpoint')
      }
      const masteryIds = [
        'm3-mastery-plan',
        'm3-mastery-visible-error',
        'm3-mastery-logs',
        'm3-mastery-repeated-error',
        'm3-mastery-branch'
      ]
      if (!masteryIds.every((id) => progress.decisions[`assessment:${id}`]?.startsWith('correct'))) {
        throw new Error('Module 3 mastery evidence is incomplete')
      }
      const completedCheckpointIds = [...new Set([
        ...progress.completedCheckpointIds,
        'm3-portfolio-build' as CheckpointId,
        'm3-mastery' as CheckpointId,
        'm3-complete' as CheckpointId
      ])]
      const completions = progress.practiceCompletions.filter((item) =>
        !(item.courseRunId === receipt.courseRunId && item.practiceId === receipt.practiceId && item.runId === receipt.runId))
      const updated: LearnerProgress = {
        ...progress,
        currentLessonId: 'module-3',
        currentCourseLessonId: 'm3-independent-enhancement',
        checkpointId: 'm3-complete',
        sceneId: 'module-3-complete',
        sceneHistory: [...progress.sceneHistory, progress.sceneId].slice(-200),
        completedCheckpointIds,
        practiceCompletions: [...completions, structuredClone(receipt)],
        updatedAt: this.now().toISOString()
      }
      if (!isLearnerProgress(updated)) throw new Error('Invalid completed Module 3 progress')
      await this.writeAtomic(this.backupPath, this.backupTempPath, progress)
      await this.writeAtomic(this.statePath, this.stateTempPath, updated)
      await this.appendActivity('module_3_completed', updated)
      return updated
    })
  }

  async loadPracticeState(): Promise<PracticeState> {
    const result = await this.load()
    if (result.status === 'new') return defaultPracticeState()
    if (result.status === 'reset-required') throw new Error(result.reason)
    return result.progress.practice
  }

  savePractice(practice: PracticeState): Promise<PracticeState> {
    if (!isPracticeState(practice)) return Promise.reject(new Error('Invalid practice state'))
    return this.runExclusive(() => this.savePracticeUnlocked(practice))
  }

  recordPracticeCompletion(receipt: PracticeCompletionReceipt): Promise<LearnerProgress> {
    if (!isPracticeCompletionReceipt(receipt)) {
      return Promise.reject(new Error('Invalid Practice completion receipt'))
    }
    return this.runExclusive(async () => {
      const current = await this.readProgress(this.statePath)
      if (current.status !== 'valid') throw new Error('Learner progress is required')
      if (receipt.courseRunId !== current.progress.courseRunId) {
        throw new Error('Practice completion belongs to another course run')
      }
      const key = completionKey(receipt)
      const existing = current.progress.practiceCompletions.find((item) => completionKey(item) === key)
      if (existing) {
        if (JSON.stringify(existing) !== JSON.stringify(receipt)) {
          throw new Error('A different completion receipt already exists for this Practice run')
        }
        return current.progress
      }
      const progress: LearnerProgress = {
        ...current.progress,
        practiceCompletions: [...current.progress.practiceCompletions, structuredClone(receipt)].slice(-100),
        updatedAt: this.now().toISOString()
      }
      await this.writeAtomic(this.backupPath, this.backupTempPath, current.progress)
      await this.writeAtomic(this.statePath, this.stateTempPath, progress)
      await this.appendActivity('practice_completion_recorded', progress)
      return progress
    })
  }

  revokePracticeCompletion(receipt: PracticeCompletionReceipt): Promise<LearnerProgress> {
    if (!isPracticeCompletionReceipt(receipt)) {
      return Promise.reject(new Error('Invalid Practice completion receipt'))
    }
    return this.runExclusive(async () => {
      const current = await this.readProgress(this.statePath)
      if (current.status !== 'valid') throw new Error('Learner progress is required')
      if (receipt.courseRunId !== current.progress.courseRunId) {
        throw new Error('Practice completion belongs to another course run')
      }
      const key = completionKey(receipt)
      const existing = current.progress.practiceCompletions.find((item) => completionKey(item) === key)
      if (!existing) return current.progress
      if (JSON.stringify(existing) !== JSON.stringify(receipt)) {
        throw new Error('Practice completion receipt is not authoritative')
      }
      if (current.progress.checkpointId !== receipt.checkpointId
        || current.progress.completedCheckpointIds.includes(receipt.checkpointId)) {
        throw new Error('A returned Practice completion cannot be revoked')
      }
      const progress: LearnerProgress = {
        ...current.progress,
        practiceCompletions: current.progress.practiceCompletions
          .filter((item) => completionKey(item) !== key),
        updatedAt: this.now().toISOString()
      }
      await this.writeAtomic(this.backupPath, this.backupTempPath, current.progress)
      await this.writeAtomic(this.statePath, this.stateTempPath, progress)
      await this.appendActivity('practice_completion_revoked', progress)
      return progress
    })
  }

  returnFromPractice(receipt: PracticeCompletionReceipt): Promise<LearnerProgress> {
    if (!isPracticeCompletionReceipt(receipt)) {
      return Promise.reject(new Error('Invalid Practice completion receipt'))
    }
    return this.runExclusive(async () => {
      const current = await this.readProgress(this.statePath)
      if (current.status !== 'valid') throw new Error('Learner progress is required')
      if (receipt.courseRunId !== current.progress.courseRunId) {
        throw new Error('Practice completion belongs to another course run')
      }
      const stored = current.progress.practiceCompletions.find((item) =>
        completionKey(item) === completionKey(receipt))
      if (!stored || JSON.stringify(stored) !== JSON.stringify(receipt)) {
        throw new Error('Practice completion receipt is not authoritative')
      }
      if (current.progress.completedCheckpointIds.includes(receipt.checkpointId)
        && current.progress.checkpointId !== receipt.checkpointId) {
        return current.progress
      }
      if (current.progress.checkpointId !== receipt.checkpointId) {
        throw new Error('Practice completion does not match the current course checkpoint')
      }
      const completedCheckpointIds = [...new Set([
        ...current.progress.completedCheckpointIds,
        receipt.checkpointId,
        ...(receipt.practiceId === 'm4-portfolio-release'
          && receipt.destination.sceneId === 'module-4-complete'
          ? ['m4-complete' as const] : [])
      ])]
      const progress: LearnerProgress = {
        ...current.progress,
        currentLessonId: receipt.destination.lessonId,
        currentCourseLessonId: courseLessonIdForScene(receipt.destination.sceneId),
        checkpointId: receipt.destination.checkpointId,
        sceneId: receipt.destination.sceneId,
        completedCheckpointIds,
        updatedAt: this.now().toISOString()
      }
      await this.writeAtomic(this.backupPath, this.backupTempPath, current.progress)
      await this.writeAtomic(this.statePath, this.stateTempPath, progress)
      await this.appendActivity('practice_return_applied', progress)
      return progress
    })
  }

  private async savePracticeUnlocked(practice: PracticeState): Promise<PracticeState> {
    const current = await this.readProgress(this.statePath)
    if (current.status !== 'valid') {
      throw new Error('Learner progress is required before practice can start')
    }

    const progress: LearnerProgress = {
      ...current.progress,
      practice,
      schemaVersion: LEARNER_STATE_SCHEMA_VERSION,
      updatedAt: this.now().toISOString()
    }
    await this.writeAtomic(this.backupPath, this.backupTempPath, current.progress)
    await this.writeAtomic(this.statePath, this.stateTempPath, progress)
    await this.appendActivity(
      practice.latestEvent ? `practice_fixture_${practice.latestEvent.scenario}` : 'practice_reset',
      progress
    )
    return practice
  }

  reset(): Promise<void> {
    return this.runExclusive(async () => {
      await Promise.all([
        rm(this.statePath, { force: true }),
        rm(this.stateTempPath, { force: true }),
        rm(this.backupPath, { force: true }),
        rm(this.backupTempPath, { force: true }),
        rm(this.activityPath, { force: true })
      ])
    })
  }

  private runExclusive<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.operationQueue.then(operation, operation)
    this.operationQueue = result.then(
      () => undefined,
      () => undefined
    )
    return result
  }

  private async readProgress(path: string): Promise<ReadResult> {
    try {
      const parsed: unknown = JSON.parse(await readFile(path, 'utf8'))
      const progress = migrateLearnerProgress(parsed)
      return progress
        ? {
            status: 'valid',
            progress,
            migrated: isRecord(parsed) && JSON.stringify(parsed) !== JSON.stringify(progress)
          }
        : isObsoleteCourseProgress(parsed)
          ? { status: 'obsolete' }
          : { status: 'invalid' }
    } catch (error) {
      if (isRecord(error) && error.code === 'ENOENT') return { status: 'missing' }
      return { status: 'invalid' }
    }
  }

  private async writeAtomic(path: string, temporaryPath: string, progress: LearnerProgress): Promise<void> {
    await mkdir(this.dataDirectory, { recursive: true })
    await writeFile(temporaryPath, `${JSON.stringify(progress, null, 2)}\n`, 'utf8')
    await rename(temporaryPath, path)
  }

  private async appendActivity(event: string, progress: LearnerProgress): Promise<void> {
    await mkdir(this.dataDirectory, { recursive: true })
    await appendFile(
      this.activityPath,
      `${JSON.stringify({
        event,
        moduleId: progress.currentLessonId,
        lessonId: progress.currentCourseLessonId,
        checkpointId: progress.checkpointId,
        sceneId: progress.sceneId,
        timestamp: this.now().toISOString()
      })}\n`,
      'utf8'
    )
  }
}
