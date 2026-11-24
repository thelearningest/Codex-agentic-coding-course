import type {
  CodexConfigurationValue,
  CodexTaskConfigurationSnapshot
} from '../../shared/contracts'

type ConfigurationSource = CodexTaskConfigurationSnapshot['source']

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function value(protocolValue: string | null, label: string | null): CodexConfigurationValue {
  return { protocolValue, label }
}

function configurationValue(value: unknown): value is CodexConfigurationValue {
  const item = record(value)
  return Boolean(item
    && (item.protocolValue === null || typeof item.protocolValue === 'string')
    && (item.label === null || typeof item.label === 'string'))
}

export function isCodexTaskConfigurationSnapshot(
  value: unknown
): value is CodexTaskConfigurationSnapshot {
  const item = record(value)
  const profile = record(item?.activePermissionProfile)
  return Boolean(item
    && item.schemaVersion === 1
    && typeof item.runId === 'string'
    && typeof item.threadId === 'string'
    && ['thread-start', 'thread-resume', 'thread-settings-updated', 'thread-settings-snapshot'].includes(String(item.source))
    && Number.isSafeInteger(item.eventTimestampMs)
    && typeof item.observedAt === 'string'
    && !Number.isNaN(Date.parse(item.observedAt))
    && ['fresh', 'stale', 'unverifiable'].includes(String(item.freshness))
    && (item.connection === 'connected' || item.connection === 'disconnected')
    && configurationValue(item.model)
    && configurationValue(item.reasoningEffort)
    && configurationValue(item.serviceTier)
    && configurationValue(item.approvalPolicy)
    && configurationValue(item.fullAccess)
    && (item.sandboxType === null || typeof item.sandboxType === 'string')
    && (item.activePermissionProfile === null || Boolean(profile
      && typeof profile.id === 'string'
      && (profile.extends === null || typeof profile.extends === 'string'))))
}

const modelLabels: Record<string, string> = {
  'gpt-5.6-sol': '5.6 Sol',
  'gpt-5.6-terra': '5.6 Terra',
  'gpt-5.6-luna': '5.6 Luna',
  'gpt-5.5': '5.5',
  'gpt-5.4': '5.4',
  'gpt-5.4-mini': '5.4 mini',
  'gpt-5.3-codex-spark': '5.3 Codex Spark'
}

const effortLabels: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  xhigh: 'Extra high',
  max: 'Max',
  ultra: 'Ultra'
}

const tierLabels: Record<string, string> = {
  standard: 'Standard',
  default: 'Standard',
  priority: 'Fast',
  fast: 'Fast',
  flex: 'Flex'
}

const approvalLabels: Record<string, string> = {
  'on-request': 'Approve for me',
  untrusted: 'Untrusted only',
  never: 'Never'
}

function normalizeString(
  raw: unknown,
  labels: Record<string, string>
): CodexConfigurationValue {
  if (typeof raw !== 'string') return value(null, null)
  return value(raw, labels[raw] ?? null)
}

export function normalizeCodexEffort(raw: unknown): CodexConfigurationValue {
  return normalizeString(raw, effortLabels)
}

export function configurationFreshness(
  settings: Pick<CodexTaskConfigurationSnapshot, 'reasoningEffort' | 'approvalPolicy' | 'fullAccess'>
): 'fresh' | 'unverifiable' {
  // A current observation may contain only some of the required settings.
  return [settings.reasoningEffort, settings.approvalPolicy, settings.fullAccess].some(field => field.label !== null)
    ? 'fresh' : 'unverifiable'
}

function normalizeTier(settings: Record<string, unknown>): CodexConfigurationValue {
  if (!Object.hasOwn(settings, 'serviceTier')) return value(null, null)
  if (settings.serviceTier === null || settings.serviceTier === 'default' || settings.serviceTier === 'standard') {
    return value('standard', 'Standard')
  }
  return normalizeString(settings.serviceTier, tierLabels)
}

function normalizePermissionProfile(raw: unknown): CodexTaskConfigurationSnapshot['activePermissionProfile'] {
  if (raw === null || raw === undefined) return null
  const profile = record(raw)
  if (!profile || typeof profile.id !== 'string' ||
    (profile.extends !== null && typeof profile.extends !== 'string')) return null
  return { id: profile.id, extends: profile.extends }
}

function normalizeFullAccess(
  sandboxRaw: unknown,
  profile: CodexTaskConfigurationSnapshot['activePermissionProfile']
): { value: CodexConfigurationValue; sandboxType: string | null } {
  const sandbox = record(sandboxRaw)
  const sandboxType = typeof sandbox?.type === 'string' ? sandbox.type : null
  const fullAccessProfile = profile?.id === ':danger-full-access' ||
    profile?.extends === ':danger-full-access'
  if (sandboxType === 'dangerFullAccess' || sandboxType === 'danger-full-access' || fullAccessProfile) {
    return { value: value('on', 'On'), sandboxType }
  }
  if (sandboxType === 'readOnly' || sandboxType === 'workspaceWrite' ||
    sandboxType === 'externalSandbox' || (sandboxType === 'managed' && record(sandbox?.file_system)?.type === 'restricted')) {
    return { value: value('off', 'Off'), sandboxType }
  }
  return { value: value(null, null), sandboxType }
}

export function normalizeCodexTaskConfiguration(input: {
  runId: string
  threadId: string
  source: ConfigurationSource
  payload: unknown
  observedAt: string
  eventTimestampMs: number
}): CodexTaskConfigurationSnapshot {
  const envelope = record(input.payload)
  const settings = input.source === 'thread-settings-updated'
    ? record(envelope?.threadSettings)
    : envelope
  const source = settings ?? {}
  const profile = normalizePermissionProfile(source.activePermissionProfile)
  const fullAccess = normalizeFullAccess(source.sandboxPolicy ?? source.sandbox, profile)
  const model = normalizeString(source.model, modelLabels)
  const reasoningEffort = normalizeCodexEffort(source.effort ?? source.reasoningEffort)
  const serviceTier = normalizeTier(source)
  const approvalPolicy = normalizeString(source.approvalPolicy, approvalLabels)
  return {
    schemaVersion: 1,
    runId: input.runId,
    threadId: input.threadId,
    source: input.source,
    eventTimestampMs: input.eventTimestampMs,
    observedAt: input.observedAt,
    freshness: configurationFreshness({ reasoningEffort, approvalPolicy, fullAccess: fullAccess.value }),
    connection: 'connected',
    model,
    reasoningEffort,
    serviceTier,
    approvalPolicy,
    fullAccess: fullAccess.value,
    sandboxType: fullAccess.sandboxType,
    activePermissionProfile: profile
  }
}

export function mergeCodexTaskConfiguration(
  previous: CodexTaskConfigurationSnapshot | null,
  next: CodexTaskConfigurationSnapshot
): CodexTaskConfigurationSnapshot {
  if (!previous) return structuredClone(next)
  if (previous.runId !== next.runId || previous.threadId !== next.threadId) {
    return structuredClone(previous)
  }
  return next.eventTimestampMs > previous.eventTimestampMs
    ? structuredClone(next)
    : structuredClone(previous)
}

export function staleCodexTaskConfiguration(
  snapshot: CodexTaskConfigurationSnapshot | null,
  disconnected: boolean
): CodexTaskConfigurationSnapshot | null {
  return snapshot
    ? {
        ...structuredClone(snapshot),
        freshness: 'stale',
        connection: disconnected ? 'disconnected' : snapshot.connection
      }
    : null
}
