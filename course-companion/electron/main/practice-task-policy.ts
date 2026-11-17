import { isSetupEffort } from '../../shared/setup-settings'
import type {
  ApprovedCodexConfiguration,
  PracticeDefinition,
  PracticeTaskPolicy
} from '../../shared/contracts'

export type PracticeTaskStartPlan = {
  taskPolicy: PracticeTaskPolicy
  name: string
  startParams: Record<string, unknown>
}

export type EffectivePracticeTask = {
  threadId: string
  cwd: string
  model: string
  reasoningEffort: string | null
  serviceTier: string | null
  approvalPolicy: unknown
  sandbox: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function moduleLabel(practiceId: string): string {
  const match = /^m([0-9]+)-/.exec(practiceId)
  return match ? 'Module ' + match[1] : 'Course'
}

export function practiceTaskName(definition: PracticeDefinition): string {
  if (definition.workspaceKind === 'learner-portfolio') return 'Portfolio của tôi'
  if (definition.practiceId === 'm1-codex-safe-setup') return 'Làm quen với Codex · Module 1'
  return [definition.title, moduleLabel(definition.practiceId)].join(' · ')
}

export function isApprovedCodexConfiguration(
  value: unknown
): value is ApprovedCodexConfiguration {
  if (!isRecord(value)) return false
  return value.schemaVersion === 1
    && value.sourcePracticeId === 'm1-codex-safe-setup'
    && typeof value.sourcePracticeVersion === 'string'
    && /^[0-9]+\.[0-9]+\.[0-9]+$/.test(value.sourcePracticeVersion)
    && (value.model === undefined || (typeof value.model === 'string'
      && value.model.trim().length > 0 && value.model.length <= 160))
    && isSetupEffort(value.reasoningEffort)
    && value.serviceTier === 'standard'
    && typeof value.approvedAt === 'string'
    && !Number.isNaN(Date.parse(value.approvedAt))
}

export function buildPracticeTaskStartPlan(input: {
  runId: string
  definition: PracticeDefinition
  workspaceRoot: string
  approvedConfiguration?: ApprovedCodexConfiguration
}): PracticeTaskStartPlan {
  const common = {
    cwd: input.workspaceRoot,
    ephemeral: false,
    serviceName: 'content_builder_academy_practice'
  }
  const name = practiceTaskName(input.definition)
  if (input.definition.taskPolicy === 'inherit-configuration-only') {
    return { taskPolicy: input.definition.taskPolicy, name, startParams: common }
  }
  if (!isApprovedCodexConfiguration(input.approvedConfiguration)) {
    throw new Error('Approved Module 1 configuration is required')
  }
  return {
    taskPolicy: input.definition.taskPolicy,
    name,
    startParams: {
      ...common,
      ...(input.approvedConfiguration.model ? { model: input.approvedConfiguration.model } : {}),
      serviceTier: input.approvedConfiguration.serviceTier,
      approvalPolicy: 'on-request',
      sandbox: 'workspace-write',
      config: { model_reasoning_effort: input.approvedConfiguration.reasoningEffort }
    }
  }
}

export function parseEffectivePracticeTask(value: unknown): EffectivePracticeTask {
  if (!isRecord(value) || !isRecord(value.thread) ||
    typeof value.thread.id !== 'string' ||
    typeof value.cwd !== 'string' ||
    typeof value.model !== 'string' ||
    (value.reasoningEffort !== null && typeof value.reasoningEffort !== 'string') ||
    (value.serviceTier !== null && typeof value.serviceTier !== 'string')) {
    throw new Error('Codex returned incomplete effective task settings')
  }
  return {
    threadId: value.thread.id,
    cwd: value.cwd,
    model: value.model,
    reasoningEffort: value.reasoningEffort,
    serviceTier: value.serviceTier,
    approvalPolicy: value.approvalPolicy,
    sandbox: value.sandbox
  }
}

function standardTier(value: string | null): boolean {
  return value === null || value === 'standard' || value === 'default'
}

export function validateEffectivePracticeTask(input: {
  effective: EffectivePracticeTask
  plan: PracticeTaskStartPlan
  workspaceRoot: string
  samePath: (left: unknown, right: string) => boolean
  approvedConfiguration?: ApprovedCodexConfiguration
}): void {
  if (!input.samePath(input.effective.cwd, input.workspaceRoot)) {
    throw new Error('Codex created the Executor task in an unexpected workspace')
  }
  if (input.plan.taskPolicy === 'inherit-configuration-only') return
  if (!isApprovedCodexConfiguration(input.approvedConfiguration)) {
    throw new Error('Approved Module 1 configuration is required')
  }
  const sandbox = isRecord(input.effective.sandbox) ? input.effective.sandbox : null
  const writableRoots = sandbox && Array.isArray(sandbox.writableRoots)
    ? sandbox.writableRoots
    : []
  if ((input.approvedConfiguration.model && input.effective.model !== input.approvedConfiguration.model) ||
    input.effective.reasoningEffort !== input.approvedConfiguration.reasoningEffort ||
    !standardTier(input.effective.serviceTier) ||
    input.effective.approvalPolicy !== 'on-request' ||
    sandbox?.type !== 'workspaceWrite' ||
    writableRoots.some((root) => !input.samePath(root, input.workspaceRoot))) {
    throw new Error('Codex created an Executor task with incompatible safety settings')
  }
}
