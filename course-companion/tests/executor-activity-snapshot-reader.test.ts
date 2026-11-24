import { describe, expect, it } from 'vitest'
import { ExecutorActivitySnapshotReader } from '../electron/main/executor-activity-snapshot-reader'
import { initialActivity } from '../electron/main/executor-activity-observer'
import { normalizeCodexTaskConfiguration } from '../electron/main/codex-configuration-normalizer'

const binding = {
  runId: 'run-1',
  threadId: 'thread-1',
  name: 'Practice',
  workspaceRoot: 'D:\\course\\pilot-workspace',
  createdAt: '2026-08-19T11:00:00.000Z'
}

describe('ExecutorActivitySnapshotReader', () => {
  it('captures a planning baseline before open without reading or taking ownership of the task', async () => {
    const calls: string[] = []
    const reader = new ExecutorActivitySnapshotReader(
      { async request() { calls.push('thread'); throw new Error('must not read') } },
      {
        async load() { return null },
        async save(snapshot) { calls.push('save'); return structuredClone(snapshot) }
      },
      { async read() { calls.push('metadata'); throw new Error('must not read') } },
      () => new Date('2026-08-19T12:00:00.000Z'),
      {
        async capture(root, capturedAt) {
          calls.push(`baseline:${root}:${capturedAt}`)
          return {
            schemaVersion: 1,
            capturedAt,
            gitAvailable: true,
            head: 'abc123',
            entries: {}
          }
        },
        async reconcile() { throw new Error('must not reconcile') }
      }
    )

    const result = await reader.captureBaseline(binding)

    expect(calls).toEqual([
      `baseline:${binding.workspaceRoot}:2026-08-19T12:00:00.000Z`,
      'save'
    ])
    expect(result.workspaceBaseline?.head).toBe('abc123')
  })

  it('rebuilds semantic activity through one exact non-owning read', async () => {
    const methods: Array<[string, Record<string, unknown> | undefined]> = []
    const saved: unknown[] = []
    const configuration = normalizeCodexTaskConfiguration({
      runId: binding.runId,
      threadId: binding.threadId,
      source: 'thread-start',
      payload: {
        model: 'gpt-5.6-sol',
        reasoningEffort: 'high',
        serviceTier: 'priority',
        approvalPolicy: 'on-request',
        sandbox: { type: 'workspaceWrite' },
        activePermissionProfile: { id: ':workspace', extends: null }
      },
      observedAt: '2026-08-19T12:00:00.000Z',
      eventTimestampMs: Date.parse('2026-08-19T12:00:00.000Z')
    })
    const reader = new ExecutorActivitySnapshotReader(
      {
        async request(method, params) {
          methods.push([method, params])
          return {
            thread: {
              id: binding.threadId,
              cwd: binding.workspaceRoot,
              turns: [{
                id: 'turn-1',
                status: 'completed',
                items: [
                  { id: 'user-1', type: 'userMessage', content: [{ type: 'text', text: 'My learner prompt' }] },
                  { id: 'agent-1', type: 'agentMessage', phase: 'final_answer', text: 'Done. Verification: npm test passed.' }
                ]
              }]
            }
          }
        }
      },
      {
        async load() {
          return initialActivity(binding, () => new Date('2026-08-19T11:00:00.000Z'))
        },
        async save(snapshot) {
          saved.push(snapshot)
          return structuredClone(snapshot)
        }
      },
      { async read() { return configuration } },
      () => new Date('2026-08-19T12:00:00.000Z'),
      {
        async capture() { throw new Error('not used') },
        async reconcile() {
          return {
            changedSinceBaseline: [],
            committedReportedFilesSinceRunStart: [],
            currentlyDirtyReportedFiles: []
          }
        }
      }
    )

    const result = await reader.read(binding)

    expect(methods).toEqual([['thread/read', { threadId: 'thread-1', includeTurns: true }]])
    expect(methods.flatMap(([method]) => method)).not.toContain('thread/resume')
    expect(result.configuration).toEqual(configuration)
    expect(result.learnerAuthoredPrompts).toEqual(['My learner prompt'])
    expect(result.executorResponses).toEqual(['Done. Verification: npm test passed.'])
    expect(saved).toHaveLength(1)
  })

  it.each([
    [null, true, 'medium'],
    [null, false, null],
    ['low', true, 'low'],
    ['medium', true, 'medium'],
    ['high', true, 'high']
  ])('resolves a saved effort of %s when the model supports Medium: %s', async (savedEffort, supportsMedium, expected) => {
    const calls: string[] = []
    const configuration = normalizeCodexTaskConfiguration({
      ...binding,
      source: 'thread-settings-snapshot',
      payload: {
        model: 'gpt-6.2-astra', reasoningEffort: savedEffort, approvalPolicy: 'on-request',
        approvalsReviewer: 'auto_review', sandbox: { type: 'workspaceWrite' }
      },
      observedAt: '2026-08-19T12:00:00.000Z',
      eventTimestampMs: 1
    })
    const reader = new ExecutorActivitySnapshotReader(
      {
        async request(method) {
          calls.push(method)
          if (method === 'thread/read') {
            return { thread: { id: binding.threadId, cwd: binding.workspaceRoot, turns: [] } }
          }
          if (method !== 'model/list') throw new Error('Unexpected request')
          return { data: [
            { model: 'another-model', supportedReasoningEfforts: [{ reasoningEffort: 'medium' }] },
            { model: 'gpt-6.2-astra', supportedReasoningEfforts: supportsMedium ? [{ reasoningEffort: 'medium' }] : [] }
          ] }
        }
      },
      { async load() { return null }, async save(snapshot) { return snapshot } },
      { async read() { return structuredClone(configuration) } }
    )
    const activity = await reader.read(binding, { setupReview: true })
    expect(activity.configuration?.reasoningEffort.protocolValue).toBe(expected)
    expect(activity.configuration?.approvalMode?.protocolValue).toBe('approve-for-me')
    expect(calls).toEqual(savedEffort === null ? ['thread/read', 'model/list'] : ['thread/read'])
  })

  it('fails closed without saving when the read resolves a different task', async () => {
    let saves = 0
    const reader = new ExecutorActivitySnapshotReader(
      { async request() { return { thread: { id: 'wrong', cwd: binding.workspaceRoot, turns: [] } } } },
      {
        async load() { return null },
        async save(snapshot) { saves += 1; return snapshot }
      },
      {
        async read() {
          return normalizeCodexTaskConfiguration({
            runId: binding.runId,
            threadId: binding.threadId,
            source: 'thread-settings-snapshot',
            payload: {},
            observedAt: '2026-08-19T12:00:00.000Z',
            eventTimestampMs: 1
          })
        }
      }
    )

    await expect(reader.read(binding)).rejects.toThrow('PRACTICE_SNAPSHOT_BINDING_MISMATCH')
    expect(saves).toBe(0)
  })

  it('does not read metadata or save while the exact task has an in-progress turn', async () => {
    const calls: string[] = []
    const reader = new ExecutorActivitySnapshotReader(
      {
        async request() {
          calls.push('thread/read')
          return {
            thread: {
              id: binding.threadId,
              cwd: binding.workspaceRoot,
              turns: [{ id: 'turn-1', status: 'inProgress', items: [] }]
            }
          }
        }
      },
      {
        async load() { return null },
        async save(snapshot) { calls.push('save'); return snapshot }
      },
      { async read() { calls.push('metadata'); throw new Error('must not read') } }
    )

    await expect(reader.read(binding)).rejects.toThrow('PRACTICE_SNAPSHOT_BUSY')
    expect(calls).toEqual(['thread/read'])
  })
})
