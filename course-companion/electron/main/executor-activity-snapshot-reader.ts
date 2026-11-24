import { resolve, win32 } from 'node:path'
import type { ExecutorActivitySnapshot } from '../../shared/contracts'
import type { ExecutorChatBinding } from './practice-run-repository'
import type { ExecutorActivityRepository } from './executor-activity-repository'
import type { CodexTaskMetadataReader } from './codex-task-metadata-reader'
import {
  initialActivity,
  projectExecutorActivity,
  reconcileExecutorActivity
} from './executor-activity-observer'
import { GitWorkspaceEvidenceProvider, type WorkspaceEvidenceProvider } from './workspace-evidence-provider'

type ReadClient = {
  request: (method: string, params?: Record<string, unknown>) => Promise<unknown>
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function withoutExtendedPrefix(value: string): string {
  if (/^\\\\\?\\UNC\\/i.test(value)) return `\\\\${value.slice(8)}`
  if (/^\\\\\?\\[A-Za-z]:\\/.test(value)) return value.slice(4)
  if (value.startsWith('\\\\?\\')) throw new Error('PRACTICE_SNAPSHOT_BINDING_MISMATCH')
  return value
}

function samePath(left: unknown, right: string): boolean {
  if (typeof left !== 'string') return false
  const a = withoutExtendedPrefix(left)
  const b = withoutExtendedPrefix(right)
  if (win32.isAbsolute(a) || win32.isAbsolute(b)) {
    return win32.resolve(a).toLocaleLowerCase('en-US') === win32.resolve(b).toLocaleLowerCase('en-US')
  }
  return resolve(a) === resolve(b)
}

export class ExecutorActivitySnapshotReader {
  constructor(
    private readonly client: ReadClient,
    private readonly repository: Pick<ExecutorActivityRepository, 'load' | 'save'>,
    private readonly metadata: Pick<CodexTaskMetadataReader, 'read'>,
    private readonly now: () => Date = () => new Date(),
    private readonly workspaceEvidence: WorkspaceEvidenceProvider = new GitWorkspaceEvidenceProvider()
  ) {}

  async captureBaseline(binding: ExecutorChatBinding): Promise<ExecutorActivitySnapshot> {
    const previous = await this.repository.load(binding.runId) ?? initialActivity(binding, this.now)
    if (previous.workspaceBaseline) return previous
    const capturedAt = this.now().toISOString()
    return this.repository.save({
      ...previous,
      workspaceBaseline: await this.workspaceEvidence.capture(binding.workspaceRoot, capturedAt),
      observedAt: capturedAt
    })
  }

  async read(
    binding: ExecutorChatBinding,
    options: { captureBaseline?: boolean } = {}
  ): Promise<ExecutorActivitySnapshot> {
    let previous = await this.repository.load(binding.runId) ?? initialActivity(binding, this.now)
    if (options.captureBaseline && !previous.workspaceBaseline) {
      const capturedAt = this.now().toISOString()
      previous = {
        ...previous,
        workspaceBaseline: await this.workspaceEvidence.capture(binding.workspaceRoot, capturedAt),
        observedAt: capturedAt
      }
    }
    const result = await this.client.request('thread/read', { threadId: binding.threadId, includeTurns: true })
    const thread = record(record(result)?.thread)
    if (!thread || thread.id !== binding.threadId || !samePath(thread.cwd, binding.workspaceRoot)) {
      throw new Error('PRACTICE_SNAPSHOT_BINDING_MISMATCH')
    }
    if ((Array.isArray(thread.turns) ? thread.turns : []).some((value) => record(value)?.status === 'inProgress')) {
      throw new Error('PRACTICE_SNAPSHOT_BUSY')
    }
    const configuration = await this.metadata.read(binding, { id: thread.id, model: thread.model, reasoningEffort: thread.reasoningEffort })
    const projected = projectExecutorActivity(previous, binding, thread, configuration, this.now)
    const reconciled = await reconcileExecutorActivity(
      projected,
      previous,
      binding,
      this.workspaceEvidence
    )
    return this.repository.save(reconciled)
  }
}
