import { appendFile, mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { describe, expect, it } from 'vitest'
import { CodexTaskMetadataReader } from '../electron/main/codex-task-metadata-reader'
import { normalizeCodexTaskConfiguration } from '../electron/main/codex-configuration-normalizer'

const THREAD_ID = '01a019f0-f875-76e2-8e50-976539a7974f'
const WORKSPACE = 'D:\\course\\pilot-workspace'

async function fixture(overrides: {
  rowThreadId?: string
  rowWorkspace?: string
  sessionThreadId?: string
  settingsWorkspace?: string
  omitSettings?: boolean
  omitEffort?: boolean
  modeEffort?: string
  omitBaseline?: boolean
  omitServiceTier?: boolean
  serviceTier?: unknown
  settingsTimestamp?: string
  duplicateSession?: boolean
  duplicateSessionThreadId?: string
  duplicateSessionWorkspace?: string
  wrongFilename?: boolean
  rolloutOutsideSessions?: boolean
  incompatibleSchema?: boolean
} = {}) {
  const root = await mkdtemp(join(tmpdir(), 'practice-task-metadata-'))
  const sessions = join(root, 'sessions')
  await mkdir(sessions)
  const rollout = join(
    overrides.rolloutOutsideSessions ? root : sessions,
    overrides.wrongFilename ? 'rollout-wrong-thread.jsonl' : `rollout-${THREAD_ID}.jsonl`
  )
  const rows = [
    {
      timestamp: '2026-08-19T12:00:00.000Z',
      type: 'session_meta',
      payload: {
        id: overrides.sessionThreadId ?? THREAD_ID,
        cwd: WORKSPACE
      }
    },
    ...(overrides.duplicateSession ? [{
      timestamp: '2026-08-19T12:00:30.000Z',
      type: 'session_meta',
      payload: { id: overrides.duplicateSessionThreadId ?? THREAD_ID, cwd: overrides.duplicateSessionWorkspace ?? WORKSPACE }
    }] : []),
    ...(!overrides.omitSettings ? [{
      timestamp: overrides.settingsTimestamp ?? '2026-08-19T12:01:00.000Z',
      type: 'event_msg',
      payload: {
        type: 'thread_settings_applied',
        thread_settings: {
          model: 'gpt-5.6-sol',
          ...(!overrides.omitEffort ? { reasoning_effort: 'high' } : {}),
          collaboration_mode: { settings: { model: 'gpt-5.6-sol', reasoning_effort: overrides.modeEffort ?? null } },
          ...(!overrides.omitServiceTier ? { service_tier: overrides.serviceTier ?? null } : {}),
          approval_policy: 'on-request',
          approvals_reviewer: 'auto_review',
          permission_profile: {
            type: 'managed',
            file_system: { type: 'restricted', entries: [] }
          },
          active_permission_profile: { id: ':workspace' },
          cwd: overrides.settingsWorkspace ?? WORKSPACE
        }
      }
    }] : [])
  ]
  await writeFile(rollout, rows.map((row) => JSON.stringify(row)).join('\n') + '\n', 'utf8')
  const databasePath = join(root, 'state_5.sqlite')
  const database = new DatabaseSync(databasePath)
  if (overrides.incompatibleSchema) {
    database.exec('CREATE TABLE threads (id TEXT PRIMARY KEY, cwd TEXT NOT NULL)')
  } else {
    database.exec(`
      CREATE TABLE threads (
        id TEXT PRIMARY KEY,
        cwd TEXT NOT NULL,
        rollout_path TEXT NOT NULL,
        updated_at_ms INTEGER
      )
    `)
    database.prepare('INSERT INTO threads (id, cwd, rollout_path, updated_at_ms) VALUES (?, ?, ?, ?)')
      .run(overrides.rowThreadId ?? THREAD_ID, overrides.rowWorkspace ?? WORKSPACE, rollout, Date.parse('2026-08-19T12:01:00.000Z'))
  }
  database.close()
  const baseline = normalizeCodexTaskConfiguration({
    runId: 'run-1',
    threadId: THREAD_ID,
    source: 'thread-start',
    payload: {
      model: 'gpt-5.6-sol',
      reasoningEffort: 'high',
      serviceTier: 'priority',
      approvalPolicy: 'on-request',
      approvalsReviewer: 'guardian_subagent',
      sandbox: { type: 'workspaceWrite' },
      activePermissionProfile: { id: ':workspace', extends: null }
    },
    observedAt: '2026-08-19T12:00:00.000Z',
    eventTimestampMs: Date.parse('2026-08-19T12:00:00.000Z')
  })
  return {
    rollout,
    reader: new CodexTaskMetadataReader(databasePath, sessions, () => new Date('2026-08-19T12:02:00.000Z')),
    binding: {
      runId: 'run-1',
      threadId: THREAD_ID,
      name: 'Practice',
      workspaceRoot: WORKSPACE,
      createdAt: '2026-08-19T11:59:00.000Z',
      ...(!overrides.omitBaseline ? { configuration: baseline } : {})
    }
  }
}

describe('CodexTaskMetadataReader', () => {
  it('reads exact persisted task settings without loading or resuming the thread', async () => {
    const { reader, binding } = await fixture()
    const snapshot = await reader.read(binding)

    expect(snapshot).toMatchObject({
      runId: 'run-1',
      threadId: THREAD_ID,
      source: 'thread-settings-snapshot',
      freshness: 'fresh',
      connection: 'connected',
      model: { protocolValue: 'gpt-5.6-sol', label: '5.6 Sol' },
      reasoningEffort: { protocolValue: 'high', label: 'High' },
      serviceTier: { protocolValue: 'standard', label: 'Standard' },
      approvalMode: { protocolValue: 'approve-for-me', label: 'Approve for me' },
      fullAccess: { protocolValue: 'off', label: 'Off' },
      activePermissionProfile: { id: ':workspace', extends: null }
    })
  })

  it('reads the configured effort for the same model without guessing an unset default', async () => {
    const { reader, binding } = await fixture({ omitEffort: true })
    const sameModel = { id: THREAD_ID, model: 'gpt-5.6-sol', reasoningEffort: 'medium' }
    expect((await reader.read(binding, sameModel)).reasoningEffort.protocolValue).toBe('medium')
    for (const thread of [undefined, { ...sameModel, model: 'another-model' }]) {
      expect(await reader.read(binding, thread)).toMatchObject({
        freshness: 'fresh', reasoningEffort: { protocolValue: null },
        approvalPolicy: { protocolValue: 'on-request' }, fullAccess: { protocolValue: 'off' }
      })
    }
    await expect(reader.read(binding, { ...sameModel, id: 'other-task' })).rejects.toThrow('BINDING_MISMATCH')
    const mode = await fixture({ omitEffort: true, modeEffort: 'high' })
    expect((await mode.reader.read(mode.binding)).reasoningEffort.protocolValue).toBe('high')
  })

  it('re-reads each Approval change on the bound task with no learner turns', async () => {
    const { binding, reader, rollout } = await fixture()
    expect((await reader.read(binding)).approvalMode?.protocolValue).toBe('approve-for-me')

    for (const [second, reviewer, expected] of [
      ['01', 'user', 'ask-for-approval'],
      ['02', 'auto_review', 'approve-for-me']
    ]) {
      await appendFile(rollout, JSON.stringify({
        timestamp: `2026-08-19T12:01:${second}.000Z`,
        type: 'event_msg',
        payload: {
          type: 'thread_settings_applied',
          thread_settings: {
            cwd: WORKSPACE,
            model: 'gpt-5.6-sol',
            reasoning_effort: 'medium',
            approval_policy: 'on-request',
            approvals_reviewer: reviewer,
            permission_profile: { type: 'workspaceWrite' },
            active_permission_profile: { id: ':workspace' }
          }
        }
      }) + '\n')
      expect((await reader.read(binding)).approvalMode?.protocolValue).toBe(expected)
    }
  })

  it('does not turn a missing service tier into Standard', async () => {
    const { reader, binding } = await fixture({ omitServiceTier: true })
    const snapshot = await reader.read(binding)
    expect(snapshot.serviceTier).toEqual({ protocolValue: null, label: null })
    expect(snapshot.freshness).toBe('fresh')
  })

  it('reads settings after the same task is reopened with another matching session header', async () => {
    const { reader, binding } = await fixture({ duplicateSession: true, serviceTier: 'priority' })
    const snapshot = await reader.read(binding)
    expect(snapshot.threadId).toBe(THREAD_ID)
    expect(snapshot.source).toBe('thread-settings-snapshot')
    expect(snapshot.freshness).toBe('fresh')
    expect(snapshot.serviceTier.protocolValue).toBe('priority')
  })

  it('uses the exact saved thread-start snapshot when the empty task has no update event', async () => {
    const { reader, binding } = await fixture({ omitSettings: true })
    const snapshot = await reader.read(binding)

    expect(snapshot).toMatchObject({
      runId: 'run-1',
      threadId: THREAD_ID,
      source: 'thread-start',
      freshness: 'fresh',
      connection: 'connected',
      model: { protocolValue: 'gpt-5.6-sol', label: '5.6 Sol' },
      reasoningEffort: { protocolValue: 'high', label: 'High' },
      serviceTier: { protocolValue: 'priority', label: 'Fast' },
      approvalMode: { protocolValue: 'approve-for-me', label: 'Approve for me' },
      fullAccess: { protocolValue: 'off', label: 'Off' }
    })
  })

  it('reads Medium on an untouched task with an older partial start snapshot', async () => {
    const { reader, binding } = await fixture({ omitSettings: true })
    binding.configuration!.reasoningEffort = { label: null, protocolValue: null }
    binding.configuration!.freshness = 'unverifiable'
    expect(await reader.read(binding)).toMatchObject({
      freshness: 'fresh', reasoningEffort: { protocolValue: null }, fullAccess: { protocolValue: 'off' }
    })
    expect(await reader.read(binding, { id: THREAD_ID, model: 'gpt-5.6-sol', reasoningEffort: 'medium' }))
      .toMatchObject({ freshness: 'fresh', reasoningEffort: { protocolValue: 'medium' } })
  })

  it('does not reuse a previously resolved picker fallback as a saved effort', async () => {
    const { reader, binding } = await fixture({ omitSettings: true })
    binding.configuration!.reasoningEffort = { protocolValue: 'medium', label: 'Medium' }
    binding.configuration!.reasoningEffortSource = 'desktop-picker-default'
    const snapshot = await reader.read(binding)
    expect(snapshot.reasoningEffort.protocolValue).toBeNull()
    expect(snapshot.reasoningEffortSource).toBeUndefined()
  })

  it('preserves the persisted priority tier as Fast', async () => {
    const { reader, binding } = await fixture({ serviceTier: 'priority' })
    const snapshot = await reader.read(binding)
    expect(snapshot.serviceTier).toEqual({ protocolValue: 'priority', label: 'Fast' })
    expect(snapshot.freshness).toBe('fresh')
  })

  it('canonicalizes the persisted default tier as Standard', async () => {
    const { reader, binding } = await fixture({ serviceTier: 'default' })
    const snapshot = await reader.read(binding)
    expect(snapshot.serviceTier).toEqual({ protocolValue: 'standard', label: 'Standard' })
    expect(snapshot.freshness).toBe('fresh')
  })

  it.each([
    [{ rowWorkspace: 'D:\\wrong' }, 'PRACTICE_METADATA_BINDING_MISMATCH'],
    [{ sessionThreadId: 'wrong-thread' }, 'PRACTICE_METADATA_BINDING_MISMATCH'],
    [{ settingsWorkspace: 'D:\\wrong' }, 'PRACTICE_METADATA_BINDING_MISMATCH'],
    [{ omitSettings: true, omitBaseline: true }, 'PRACTICE_METADATA_UNAVAILABLE'],
    [{ settingsTimestamp: 'not-a-timestamp' }, 'PRACTICE_METADATA_ROLLOUT_INVALID'],
    [{ duplicateSession: true, duplicateSessionThreadId: 'other-task' }, 'PRACTICE_METADATA_BINDING_MISMATCH'],
    [{ duplicateSession: true, duplicateSessionWorkspace: 'D:\\other-portfolio' }, 'PRACTICE_METADATA_BINDING_MISMATCH'],
    [{ wrongFilename: true }, 'PRACTICE_METADATA_BINDING_MISMATCH'],
    [{ rolloutOutsideSessions: true }, 'PRACTICE_METADATA_PATH_INVALID'],
    [{ incompatibleSchema: true }, 'PRACTICE_METADATA_SCHEMA_INCOMPATIBLE']
  ])('fails closed when exact metadata cannot be verified', async (overrides, message) => {
    const { reader, binding } = await fixture(overrides)
    await expect(reader.read(binding)).rejects.toThrow(message)
  })
})
