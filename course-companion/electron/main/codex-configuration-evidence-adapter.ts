import { setupSettings } from '../../shared/setup-settings'
import { createHash } from 'node:crypto'
import type {
  CodexTaskConfigurationSnapshot,
  ExecutorActivitySnapshot,
  PracticeAdapterEvidenceState,
  PracticeAdapterStepState,
  PracticeEvidenceReference
} from '../../shared/contracts'
import type {
  PracticeEvidenceAdapter,
  PracticeEvidenceAdapterContext
} from './practice-evidence-adapter'

type ConfigurationSource = {
  current: () => Promise<ExecutorActivitySnapshot | null>
}

function digest(snapshot: CodexTaskConfigurationSnapshot): string {
  return createHash('sha256').update(JSON.stringify(snapshot)).digest('hex')
}

function evidence(snapshot: CodexTaskConfigurationSnapshot): PracticeEvidenceReference[] {
  return setupSettings.map(({ key }) => ({
    id: 'configuration-' + key,
    kind: 'codex-task-configuration',
    text: !snapshot[key]?.label
      ? key + ': không xác minh được'
      : key + ': ' + snapshot[key]?.label,
    freshness: snapshot.freshness === 'fresh' && snapshot.connection === 'connected' && snapshot[key]?.label ? 'fresh' : 'stale'
  }))
}

function stepStates(
  context: Readonly<PracticeEvidenceAdapterContext>,
  snapshot: CodexTaskConfigurationSnapshot | null,
  sourceDigest: string | null
): PracticeAdapterStepState[] {
  const checks = snapshot
    ? setupSettings.map(setting => setting.matches(snapshot[setting.key]?.protocolValue))
    : []
  const current = snapshot?.freshness === 'fresh' && snapshot.connection === 'connected'
  const firstUnmet = current ? checks.indexOf(false) : 0
  return context.definition.checklist.map((step, index) => {
    const dependencyInputs: Record<string, string> = sourceDigest
      ? { configuration: sourceDigest }
      : {}
    return {
      stepId: step.id,
      status: current && checks[index]
        ? 'completed'
        : index === firstUnmet
          ? 'current'
          : 'pending',
      ...(snapshot?.freshness === 'stale' && index > 0
        ? { reason: 'Cấu hình task hiện đã cũ hoặc mất kết nối.' }
        : {}),
      dependencyInputs
    }
  })
}

export class CodexConfigurationEvidenceAdapter implements PracticeEvidenceAdapter {
  readonly evidenceProfile = 'codex-task-configuration' as const

  constructor(private readonly source: ConfigurationSource) {}

  async collect(
    context: Readonly<PracticeEvidenceAdapterContext>
  ): Promise<PracticeAdapterEvidenceState> {
    const activity = await this.source.current()
    const snapshot = activity?.configuration ?? null
    const configuration = snapshot
      && activity?.runId === context.runId
      && context.task?.threadId === snapshot.threadId
      && snapshot.runId === context.runId
      ? structuredClone(snapshot)
      : null
    const sourceDigest = configuration ? digest(configuration) : null
    return {
      schemaVersion: 1,
      practiceId: context.definition.practiceId,
      practiceVersion: context.definition.version,
      runId: context.runId,
      evidenceProfile: this.evidenceProfile,
      observedAt: configuration?.observedAt ?? new Date(0).toISOString(),
      freshness: configuration?.freshness ?? 'unverifiable',
      sourceDigest,
      evidence: configuration ? evidence(configuration) : [],
      steps: stepStates(context, configuration, sourceDigest),
      invalidations: [],
      ...(configuration ? { configuration } : {})
    }
  }
}
