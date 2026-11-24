import { createReadStream } from 'node:fs'
import { realpath, stat } from 'node:fs/promises'
import { resolve, relative, win32 } from 'node:path'
import readline from 'node:readline'
import { DatabaseSync } from 'node:sqlite'
import type { CodexTaskConfigurationSnapshot } from '../../shared/contracts'
import type { ExecutorChatBinding } from './practice-run-repository'
import {
  configurationFreshness,
  isCodexTaskConfigurationSnapshot,
  normalizeCodexEffort,
  normalizeCodexTaskConfiguration
} from './codex-configuration-normalizer.ts'

const THREAD_ID = /^[A-Za-z0-9_-]{1,160}$/
const MAX_ROLLOUT_BYTES = 128 * 1024 * 1024
const MAX_LINE_LENGTH = 2 * 1024 * 1024

type ReadThread = {
  id: unknown
  model?: unknown
  reasoningEffort?: unknown
}

type ThreadRow = {
  id: string
  cwd: string
  rollout_path: string
  updated_at_ms: number | null
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function withoutExtendedPrefix(value: string): string {
  if (/^\\\\\?\\UNC\\/i.test(value)) return `\\\\${value.slice(8)}`
  if (/^\\\\\?\\[A-Za-z]:\\/.test(value)) return value.slice(4)
  if (value.startsWith('\\\\?\\')) throw new Error('PRACTICE_METADATA_PATH_INVALID')
  return value
}

function samePath(left: string, right: string): boolean {
  const a = withoutExtendedPrefix(left)
  const b = withoutExtendedPrefix(right)
  if (win32.isAbsolute(a) || win32.isAbsolute(b)) {
    return win32.resolve(a).toLocaleLowerCase('en-US') === win32.resolve(b).toLocaleLowerCase('en-US')
  }
  return resolve(a) === resolve(b)
}

function inside(parent: string, child: string): boolean {
  const normalizedParent = withoutExtendedPrefix(parent)
  const normalizedChild = withoutExtendedPrefix(child)
  const result = (win32.isAbsolute(normalizedParent) || win32.isAbsolute(normalizedChild))
    ? win32.relative(normalizedParent, normalizedChild)
    : relative(normalizedParent, normalizedChild)
  return Boolean(result) && !result.startsWith('..') && !win32.isAbsolute(result)
}

function timestamp(value: unknown): number | null {
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    if (!Number.isNaN(parsed)) return parsed
  }
  return null
}

export class CodexTaskMetadataReader {
  private readonly stateDatabasePath: string
  private readonly sessionsDirectory: string
  private readonly now: () => Date

  constructor(
    stateDatabasePath: string,
    sessionsDirectory: string,
    now: () => Date = () => new Date()
  ) {
    this.stateDatabasePath = stateDatabasePath
    this.sessionsDirectory = sessionsDirectory
    this.now = now
  }

  async read(binding: ExecutorChatBinding, thread?: ReadThread): Promise<CodexTaskConfigurationSnapshot> {
    if (!THREAD_ID.test(binding.threadId)) throw new Error('PRACTICE_METADATA_BINDING_INVALID')
    if (thread && thread.id !== binding.threadId) throw new Error('PRACTICE_METADATA_BINDING_MISMATCH')
    const row = this.readThreadRow(binding.threadId)
    if (!row || row.id !== binding.threadId || !samePath(row.cwd, binding.workspaceRoot)) {
      throw new Error('PRACTICE_METADATA_BINDING_MISMATCH')
    }

    let sessionsRoot: string
    let rolloutPath: string
    try {
      sessionsRoot = await realpath(this.sessionsDirectory)
      rolloutPath = await realpath(withoutExtendedPrefix(row.rollout_path))
    } catch (error) {
      throw new Error('PRACTICE_METADATA_ROLLOUT_UNAVAILABLE', { cause: error })
    }
    if (!inside(sessionsRoot, rolloutPath)) throw new Error('PRACTICE_METADATA_PATH_INVALID')
    const details = await stat(rolloutPath).catch((error) => {
      throw new Error('PRACTICE_METADATA_ROLLOUT_UNAVAILABLE', { cause: error })
    })
    if (!details.isFile() || details.size > MAX_ROLLOUT_BYTES) {
      throw new Error('PRACTICE_METADATA_ROLLOUT_INVALID')
    }
    if (!win32.basename(rolloutPath).includes(binding.threadId)) {
      throw new Error('PRACTICE_METADATA_BINDING_MISMATCH')
    }

    let latest: Awaited<ReturnType<CodexTaskMetadataReader['readLatestSettings']>>
    try {
      latest = await this.readLatestSettings(rolloutPath, binding)
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('PRACTICE_METADATA_')) throw error
      throw new Error('PRACTICE_METADATA_ROLLOUT_UNAVAILABLE', { cause: error })
    }
    const after = await stat(rolloutPath).catch((error) => {
      throw new Error('PRACTICE_METADATA_ROLLOUT_UNAVAILABLE', { cause: error })
    })
    if (after.size !== details.size || after.mtimeMs !== details.mtimeMs) {
      throw new Error('PRACTICE_METADATA_CHANGED_DURING_READ')
    }
    if (!latest) {
      const baseline = binding.configuration
      if (!isCodexTaskConfigurationSnapshot(baseline)
        || baseline.runId !== binding.runId
        || baseline.threadId !== binding.threadId
        || baseline.source !== 'thread-start'
        || baseline.freshness === 'stale'
        || baseline.connection !== 'connected') {
        throw new Error('PRACTICE_METADATA_UNAVAILABLE')
      }
      const snapshot = structuredClone(baseline)
      if (thread && typeof thread.model === 'string' && thread.model === snapshot.model.protocolValue
        && typeof thread.reasoningEffort === 'string') {
        snapshot.reasoningEffort = normalizeCodexEffort(thread.reasoningEffort)
      }
      snapshot.freshness = configurationFreshness(snapshot)
      return snapshot
    }
    const observed = this.now()
    return normalizeCodexTaskConfiguration({
      runId: binding.runId,
      threadId: binding.threadId,
      source: 'thread-settings-snapshot',
      payload: {
        ...latest.settings,
        reasoningEffort: latest.settings.reasoningEffort ?? (thread && typeof thread.model === 'string' && thread.model === latest.settings.model
          ? thread.reasoningEffort : null)
      },
      observedAt: observed.toISOString(),
      eventTimestampMs: latest.eventTimestampMs
    })
  }

  private readThreadRow(threadId: string): ThreadRow | null {
    let database: DatabaseSync | null = null
    try {
      database = new DatabaseSync(this.stateDatabasePath, { readOnly: true })
      const columns = new Set((database.prepare('PRAGMA table_info(threads)').all() as Array<{ name?: unknown }>)
        .map((column) => column.name)
        .filter((name): name is string => typeof name === 'string'))
      for (const required of ['id', 'cwd', 'rollout_path', 'updated_at_ms']) {
        if (!columns.has(required)) throw new Error('PRACTICE_METADATA_SCHEMA_INCOMPATIBLE')
      }
      const row = database.prepare(`
        SELECT id, cwd, rollout_path, updated_at_ms
        FROM threads
        WHERE id = ?
      `).get(threadId) as ThreadRow | undefined
      if (!row) return null
      if (typeof row.id !== 'string' || typeof row.cwd !== 'string' ||
        typeof row.rollout_path !== 'string' ||
        (row.updated_at_ms !== null && !Number.isSafeInteger(row.updated_at_ms))) {
        throw new Error('PRACTICE_METADATA_SCHEMA_INCOMPATIBLE')
      }
      return row
    } catch (error) {
      if (error instanceof Error && error.message === 'PRACTICE_METADATA_SCHEMA_INCOMPATIBLE') throw error
      throw new Error('PRACTICE_METADATA_STORE_UNAVAILABLE', { cause: error })
    } finally {
      database?.close()
    }
  }

  private async readLatestSettings(
    rolloutPath: string,
    binding: ExecutorChatBinding
  ): Promise<{ settings: Record<string, unknown>; eventTimestampMs: number } | null> {
    let sessionVerified = false
    let latest: { settings: Record<string, unknown>; eventTimestampMs: number } | null = null
    const lines = readline.createInterface({
      input: createReadStream(rolloutPath, { encoding: 'utf8' }),
      crlfDelay: Infinity
    })
    try {
      for await (const line of lines) {
        if (line.length > MAX_LINE_LENGTH) throw new Error('PRACTICE_METADATA_LINE_INVALID')
        let item: Record<string, unknown> | null = null
        try {
          item = record(JSON.parse(line))
        } catch {
          throw new Error('PRACTICE_METADATA_ROLLOUT_INVALID')
        }
        const payload = record(item?.payload)
        if (item?.type === 'session_meta') {
          const sessionId = payload?.id ?? payload?.session_id
          if (sessionId !== binding.threadId || typeof payload?.cwd !== 'string' ||
            !samePath(payload.cwd, binding.workspaceRoot)) {
            throw new Error('PRACTICE_METADATA_BINDING_MISMATCH')
          }
          // Desktop can append another session header when the same task is
          // reopened. Verify every header against the binding; repetition alone
          // does not mean the task or workspace changed.
          sessionVerified = true
        }
        if (item?.type !== 'event_msg' || payload?.type !== 'thread_settings_applied') continue
        if (!sessionVerified) throw new Error('PRACTICE_METADATA_BINDING_MISMATCH')
        const source = record(payload.thread_settings)
        if (!source || typeof source.cwd !== 'string' || !samePath(source.cwd, binding.workspaceRoot)) {
          throw new Error('PRACTICE_METADATA_BINDING_MISMATCH')
        }
        const modeSettings = record(record(source.collaboration_mode)?.settings)
        const activeProfile = record(source.active_permission_profile)
        const settings: Record<string, unknown> = {
            model: source.model,
            reasoningEffort: source.reasoning_effort ?? (modeSettings?.model === source.model ? modeSettings?.reasoning_effort : null),
            approvalPolicy: source.approval_policy,
            sandboxPolicy: source.permission_profile,
            activePermissionProfile: activeProfile ? {
              id: activeProfile.id,
              extends: activeProfile.extends ?? null
            } : null
        }
        if (Object.hasOwn(source, 'service_tier')) settings.serviceTier = source.service_tier
        const eventTimestampMs = timestamp(item.timestamp)
        if (eventTimestampMs === null) throw new Error('PRACTICE_METADATA_ROLLOUT_INVALID')
        latest = { settings, eventTimestampMs }
      }
    } finally {
      lines.close()
    }
    if (!sessionVerified) throw new Error('PRACTICE_METADATA_BINDING_MISMATCH')
    return latest
  }
}
