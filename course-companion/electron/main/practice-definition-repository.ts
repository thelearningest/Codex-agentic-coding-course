import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  checkpointIds,
  lessonIds,
  practiceEvidenceProfiles,
  practiceTaskPolicies,
  practiceWorkspaceKinds,
  sceneCheckpoint,
  sceneIds,
  type LegacyPracticeDefinitionV1,
  type PracticeChecklistDefinition,
  type PracticeCriterionDefinition,
  type PracticeDefinition,
  type PracticeEvidenceKind,
  type PracticeEvidenceProfile,
  type PracticeStageDefinition,
  type PracticeTaskPolicy
} from '../../shared/contracts'

const ID = /^[A-Za-z0-9_-]{1,160}$/
const VERSION = /^[0-9]+.[0-9]+.[0-9]+$/
const evidenceKinds = new Set<PracticeEvidenceKind>([
  'bound-thread-activity',
  'workspace-confirmed-change',
  'executor-reported-verification',
  'learner-decision',
  'artifact',
  'teacher-assessment',
  'codex-task-configuration',
  'planning-artifact',
  'learner-approval',
  'scope-decision',
  'artifact-alignment',
  'unexpected-workspace-change'
])
const checkpoints = new Set<string>(checkpointIds)
const scenes = new Set<string>(sceneIds)
const lessons = new Set<string>(lessonIds)
const workspaceKinds = new Set<string>(practiceWorkspaceKinds)
const taskPolicies = new Set<string>(practiceTaskPolicies)
const evidenceProfiles = new Set<string>(practiceEvidenceProfiles)
const supportedPolicyByProfile: Record<PracticeEvidenceProfile, PracticeTaskPolicy> = {
  'codex-task-configuration': 'inherit-configuration-only',
  'planning-package': 'safe-workspace-write',
  'portfolio-planning': 'safe-workspace-write',
  'portfolio-build': 'safe-workspace-write',
  'portfolio-release': 'safe-workspace-write'
}
const portfolioProfiles = new Set<PracticeEvidenceProfile>([
  'portfolio-planning',
  'portfolio-build',
  'portfolio-release'
])
const ARTIFACT_PATH = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._/-]{1,240}$/

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function exactKeys(value: Record<string, unknown>, expected: string[]): boolean {
  const actual = Object.keys(value).sort()
  const sortedExpected = [...expected].sort()
  return actual.length === sortedExpected.length
    && actual.every((key, index) => key === sortedExpected[index])
}

function exactOptionalKeys(
  value: Record<string, unknown>,
  required: string[],
  optional: string[]
): boolean {
  const keys = new Set(Object.keys(value))
  return required.every((key) => keys.has(key))
    && [...keys].every((key) => required.includes(key) || optional.includes(key))
}

function bounded(value: unknown, maximum: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maximum
}

function boundedLearnerLabel(value: unknown, maximum: number): value is string {
  return bounded(value, maximum) && value.trim().length > 0
}

function parseChecklist(value: unknown, legacy: boolean): PracticeChecklistDefinition[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20) {
    throw new Error('Invalid Practice checklist')
  }
  const checklist = value.map((entry) => {
    const step = record(entry)
    const validShape = legacy
      ? Boolean(step && exactKeys(step, ['id', 'title']))
      : Boolean(step && exactOptionalKeys(step, ['id', 'title'], ['dependsOn']))
    if (!step || !validShape) throw new Error('Invalid Practice checklist step')
    if (!bounded(step.id, 160) || !ID.test(step.id) || !bounded(step.title, 300)) {
      throw new Error('Invalid Practice checklist step')
    }
    const dependsOn = step.dependsOn ?? []
    if (!Array.isArray(dependsOn)
      || dependsOn.length > 20
      || !dependsOn.every((dependency) => bounded(dependency, 160) && ID.test(dependency))) {
      throw new Error('Invalid Practice step dependencies')
    }
    if (new Set(dependsOn).size !== dependsOn.length) {
      throw new Error('Duplicate Practice step dependency')
    }
    return { id: step.id, title: step.title, dependsOn: [...dependsOn] }
  })
  const stepIds = new Set(checklist.map((step) => step.id))
  if (stepIds.size !== checklist.length) throw new Error('Duplicate Practice checklist step')
  for (const step of checklist) {
    for (const dependency of step.dependsOn) {
      if (!stepIds.has(dependency)) throw new Error('Practice step references an unknown dependency')
      if (dependency === step.id) throw new Error('Practice step cannot depend on itself')
    }
  }
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const byId = new Map(checklist.map((step) => [step.id, step]))
  const visit = (stepId: string): void => {
    if (visiting.has(stepId)) throw new Error('Practice step dependency cycle')
    if (visited.has(stepId)) return
    visiting.add(stepId)
    for (const dependency of byId.get(stepId)?.dependsOn ?? []) visit(dependency)
    visiting.delete(stepId)
    visited.add(stepId)
  }
  for (const step of checklist) visit(step.id)
  return checklist
}

function parseCriterion(value: unknown, stepIds: Set<string>): PracticeCriterionDefinition {
  const item = record(value)
  if (!item || !exactKeys(item, [
    'acceptedEvidence',
    'assertion',
    'checklistStepId',
    'description',
    'freshness',
    'id',
    'required'
  ])) throw new Error('Invalid Practice criterion shape')
  if (!bounded(item.id, 160) || !ID.test(item.id)) throw new Error('Invalid Practice criterion id')
  if (!bounded(item.description, 500) || !bounded(item.assertion, 1000)) {
    throw new Error('Invalid Practice criterion text')
  }
  if (typeof item.required !== 'boolean') throw new Error('Invalid Practice criterion requirement')
  if (!bounded(item.checklistStepId, 160) || !stepIds.has(item.checklistStepId)) {
    throw new Error('Practice criterion references an unknown checklist step')
  }
  if (!Array.isArray(item.acceptedEvidence) || item.acceptedEvidence.length < 1) {
    throw new Error('Practice criterion requires accepted evidence')
  }
  const acceptedEvidence = item.acceptedEvidence.map((kind) => {
    if (typeof kind !== 'string' || !evidenceKinds.has(kind as PracticeEvidenceKind)) {
      throw new Error('Unsupported Practice evidence kind')
    }
    return kind as PracticeEvidenceKind
  })
  if (new Set(acceptedEvidence).size !== acceptedEvidence.length) {
    throw new Error('Duplicate Practice evidence kind')
  }
  if (item.freshness !== 'fresh' && item.freshness !== 'any') {
    throw new Error('Invalid Practice evidence freshness')
  }
  return {
    id: item.id,
    description: item.description,
    required: item.required,
    checklistStepId: item.checklistStepId,
    acceptedEvidence,
    assertion: item.assertion,
    freshness: item.freshness
  }
}

function parseCriteria(value: unknown, checklist: PracticeChecklistDefinition[]): PracticeCriterionDefinition[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 40) {
    throw new Error('Invalid Practice criteria')
  }
  const stepIds = new Set(checklist.map((step) => step.id))
  const criteria = value.map((criterion) => parseCriterion(criterion, stepIds))
  if (new Set(criteria.map((criterion) => criterion.id)).size !== criteria.length) {
    throw new Error('Duplicate Practice criterion')
  }
  return criteria
}

function parseStages(value: unknown): PracticeStageDefinition[] {
  if (!Array.isArray(value) || value.length !== 5) {
    throw new Error('Portfolio Practice requires exactly five stages')
  }
  const stages = value.map((entry, index) => {
    const stage = record(entry)
    if (!stage || !exactKeys(stage, ['dependsOn', 'id', 'order', 'requiredArtifactPaths'])) {
      throw new Error('Invalid Practice stage shape')
    }
    if (!bounded(stage.id, 160) || !ID.test(stage.id) || stage.order !== index + 1) {
      throw new Error('Invalid Practice stage order')
    }
    if (!Array.isArray(stage.dependsOn)
      || stage.dependsOn.length > 4
      || !stage.dependsOn.every((dependency) => bounded(dependency, 160) && ID.test(dependency))
      || new Set(stage.dependsOn).size !== stage.dependsOn.length) {
      throw new Error('Invalid Practice stage dependencies')
    }
    if (!Array.isArray(stage.requiredArtifactPaths)
      || stage.requiredArtifactPaths.length < 1
      || stage.requiredArtifactPaths.length > 40
      || !stage.requiredArtifactPaths.every((path) => typeof path === 'string' && ARTIFACT_PATH.test(path))
      || new Set(stage.requiredArtifactPaths).size !== stage.requiredArtifactPaths.length) {
      throw new Error('Invalid Practice stage artifact paths')
    }
    return {
      id: stage.id,
      order: stage.order as PracticeStageDefinition['order'],
      dependsOn: [...stage.dependsOn] as string[],
      requiredArtifactPaths: [...stage.requiredArtifactPaths] as string[]
    }
  })
  const ids = new Set(stages.map((stage) => stage.id))
  if (ids.size !== stages.length) throw new Error('Duplicate Practice stage')
  for (const stage of stages) {
    const priorIds = new Set(stages.slice(0, stage.order - 1).map((candidate) => candidate.id))
    if (stage.dependsOn.some((dependency) => !priorIds.has(dependency))) {
      throw new Error('Practice stage dependency must reference an earlier stage')
    }
  }
  return stages
}

function parseDestination(
  value: unknown,
  legacy: false
): PracticeDefinition['completionDestination']
function parseDestination(
  value: unknown,
  legacy: true
): Omit<LegacyPracticeDefinitionV1['completionDestination'], 'label'>
function parseDestination(
  value: unknown,
  legacy: boolean
): PracticeDefinition['completionDestination'] | Omit<LegacyPracticeDefinitionV1['completionDestination'], 'label'> {
  const destination = record(value)
  const expectedKeys = legacy
    ? ['checkpointId', 'lessonId', 'sceneId']
    : ['checkpointId', 'label', 'lessonId', 'sceneId']
  if (!destination || !exactKeys(destination, expectedKeys)) {
    throw new Error('Invalid Practice completion destination')
  }
  if (!legacy && !boundedLearnerLabel(destination.label, 200)) {
    throw new Error('Invalid Practice completion destination label')
  }
  if (typeof destination.lessonId !== 'string'
    || !lessons.has(destination.lessonId)
    || typeof destination.checkpointId !== 'string'
    || !checkpoints.has(destination.checkpointId)
    || typeof destination.sceneId !== 'string'
    || !scenes.has(destination.sceneId)
    || sceneCheckpoint[destination.sceneId as keyof typeof sceneCheckpoint] !== destination.checkpointId
    || !destination.sceneId.startsWith(destination.lessonId)) {
    throw new Error('Invalid Practice completion destination')
  }
  return destination as PracticeDefinition['completionDestination']
}

export function parsePracticeDefinition(value: unknown): PracticeDefinition {
  const input = record(value)
  if (!input || !exactOptionalKeys(input, [
    'checkpointId',
    'checklist',
    'completionDestination',
    'criteria',
    'evidenceProfile',
    'expectedOutcome',
    'objective',
    'practiceId',
    'schemaVersion',
    'taskPolicy',
    'title',
    'version',
    'workspaceKind'
  ], ['stages'])) throw new Error('Invalid Practice definition shape')
  if (input.schemaVersion !== 2) throw new Error('Unsupported current Practice definition schema')
  if (!bounded(input.practiceId, 160) || !ID.test(input.practiceId)) throw new Error('Invalid Practice id')
  if (!boundedLearnerLabel(input.title, 160)) throw new Error('Invalid Practice title')
  if (!bounded(input.version, 40) || !VERSION.test(input.version)) throw new Error('Invalid Practice version')
  if (typeof input.checkpointId !== 'string' || !checkpoints.has(input.checkpointId)) {
    throw new Error('Invalid Practice checkpoint')
  }
  if (!bounded(input.objective, 1000) || !bounded(input.expectedOutcome, 1000)) {
    throw new Error('Invalid Practice objective')
  }
  if (typeof input.workspaceKind !== 'string' || !workspaceKinds.has(input.workspaceKind)) {
    throw new Error('Unsupported Practice workspace kind')
  }
  if (typeof input.taskPolicy !== 'string' || !taskPolicies.has(input.taskPolicy)) {
    throw new Error('Unsupported Practice task policy')
  }
  if (typeof input.evidenceProfile !== 'string' || !evidenceProfiles.has(input.evidenceProfile)) {
    throw new Error('Unsupported Practice evidence profile')
  }
  if (supportedPolicyByProfile[input.evidenceProfile as PracticeEvidenceProfile] !== input.taskPolicy) {
    throw new Error('Unsupported Practice task policy and evidence profile combination')
  }
  const evidenceProfile = input.evidenceProfile as PracticeEvidenceProfile
  const usesPortfolioWorkspace = input.workspaceKind === 'learner-portfolio'
  const usesPortfolioProfile = portfolioProfiles.has(evidenceProfile)
  if (usesPortfolioWorkspace !== usesPortfolioProfile) {
    throw new Error('Unsupported Practice workspace and evidence profile combination')
  }
  if (!usesPortfolioProfile && input.stages !== undefined) {
    throw new Error('Legacy Practice profiles cannot declare stages')
  }
  const stages = usesPortfolioProfile ? parseStages(input.stages) : undefined
  const checklist = parseChecklist(input.checklist, false)
  const criteria = parseCriteria(input.criteria, checklist)
  const completionDestination = parseDestination(input.completionDestination, false)
  return structuredClone({
    ...input,
    ...(stages ? { stages } : {}),
    checklist,
    criteria,
    completionDestination
  }) as PracticeDefinition
}

export function parseLegacyPracticeDefinitionV1(value: unknown): LegacyPracticeDefinitionV1 {
  const input = record(value)
  if (!input || !exactKeys(input, [
    'checkpointId',
    'checklist',
    'completionDestination',
    'criteria',
    'expectedOutcome',
    'objective',
    'practiceId',
    'schemaVersion',
    'version'
  ])) throw new Error('Invalid legacy Practice definition shape')
  if (input.schemaVersion !== 1) throw new Error('Unsupported legacy Practice definition schema')
  if (!bounded(input.practiceId, 160) || !ID.test(input.practiceId)) throw new Error('Invalid Practice id')
  if (!bounded(input.version, 40) || !VERSION.test(input.version)) throw new Error('Invalid Practice version')
  if (typeof input.checkpointId !== 'string' || !checkpoints.has(input.checkpointId)) {
    throw new Error('Invalid Practice checkpoint')
  }
  if (!bounded(input.objective, 1000) || !bounded(input.expectedOutcome, 1000)) {
    throw new Error('Invalid Practice objective')
  }
  const checklist = parseChecklist(input.checklist, true)
  const criteria = parseCriteria(input.criteria, checklist)
  const completionDestination = parseDestination(input.completionDestination, true)
  return structuredClone({
    ...input,
    title: 'Bài thực hành',
    checklist,
    criteria,
    completionDestination: {
      ...completionDestination,
      label: 'Bước tiếp theo trong khóa học'
    }
  }) as LegacyPracticeDefinitionV1
}

export class PracticeDefinitionRepository {
  constructor(
    private readonly directory: string,
    private readonly fallbackDirectory?: string
  ) {}

  private async readDefinition(practiceId: string): Promise<unknown> {
    try {
      return JSON.parse(await readFile(join(this.directory, practiceId + '.json'), 'utf8')) as unknown
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT' || !this.fallbackDirectory) throw error
      return JSON.parse(await readFile(join(this.fallbackDirectory, practiceId + '.json'), 'utf8')) as unknown
    }
  }

  async load(practiceId: string, expectedVersion?: string): Promise<PracticeDefinition> {
    if (!ID.test(practiceId)) throw new Error('Invalid Practice id')
    if (expectedVersion !== undefined && !VERSION.test(expectedVersion)) {
      throw new Error('Invalid Practice version')
    }
    const parsed = await this.readDefinition(practiceId)
    let definition = parsePracticeDefinition(parsed)
    if (['m2-portfolio-planning', 'm3-portfolio-build'].includes(practiceId) && expectedVersion === '1.0.0' && definition.version !== expectedVersion) {
      definition = parsePracticeDefinition(await this.readDefinition(practiceId + '.v1'))
    }
    if (practiceId === 'm3-portfolio-build' && expectedVersion === '2.0.0' && definition.version !== expectedVersion) {
      definition = parsePracticeDefinition(await this.readDefinition(practiceId + '.v2'))
    }
    if (definition.practiceId !== practiceId) throw new Error('Practice definition id mismatch')
    if (expectedVersion !== undefined && definition.version !== expectedVersion) {
      throw new Error('Practice definition version mismatch')
    }
    return definition
  }

  async loadLegacyV1(practiceId: string): Promise<LegacyPracticeDefinitionV1> {
    if (!ID.test(practiceId)) throw new Error('Invalid Practice id')
    const parsed = await this.readDefinition(practiceId)
    const definition = parseLegacyPracticeDefinitionV1(parsed)
    if (definition.practiceId !== practiceId) throw new Error('Practice definition id mismatch')
    return definition
  }
}
