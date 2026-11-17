import { describe, expect, it } from 'vitest'
import type { PracticeDefinition } from '../shared/contracts'
import { CodexConfigurationEvidenceAdapter } from '../electron/main/codex-configuration-evidence-adapter'
import { normalizeCodexTaskConfiguration } from '../electron/main/codex-configuration-normalizer'
import { initialActivity } from '../electron/main/executor-activity-observer'
import type { ExecutorChatBinding } from '../electron/main/practice-run-repository'

const definition: PracticeDefinition = {
  schemaVersion: 2,
  practiceId: 'm1-codex-safe-setup',
  title: 'Thiết lập Codex an toàn',
  version: '2.0.0',
  checkpointId: 'm1-setup-checklist',
  objective: 'Thiết lập Codex an toàn.',
  expectedOutcome: 'Bốn cấu hình được xác nhận.',
  workspaceKind: 'pilot-workspace',
  taskPolicy: 'inherit-configuration-only',
  evidenceProfile: 'codex-task-configuration',
  checklist: [
    { id: 'set-effort', title: 'Chọn Effort Medium hoặc High', dependsOn: [] },
    { id: 'set-speed', title: 'Chọn Speed Standard', dependsOn: ['set-effort'] },
    { id: 'set-approval', title: 'Chọn Approval', dependsOn: ['set-speed'] },
    { id: 'disable-full-access', title: 'Tắt Full access', dependsOn: ['set-approval'] }
  ],
  criteria: [],
  completionDestination: {
    lessonId: 'module-1', checkpointId: 'm1-mastery', sceneId: 'module-1-mastery',
    label: 'Phần tổng kết Module 1'
  }
}

function activity(threadId = 'thread-1') {
  const configuration = normalizeCodexTaskConfiguration({
    runId: 'run-1',
    threadId,
    source: 'thread-settings-updated',
    payload: {
      threadSettings: {
        model: 'gpt-5.6-sol', effort: 'high', serviceTier: null,
        approvalPolicy: 'on-request', sandboxPolicy: { type: 'workspaceWrite' },
        activePermissionProfile: null
      }
    },
    observedAt: '2026-08-10T00:00:00.000Z',
    eventTimestampMs: 10
  })
  const binding: ExecutorChatBinding = {
    runId: 'run-1', threadId, name: 'Practice', workspaceRoot: 'D:\\course',
    createdAt: '2026-08-10T00:00:00.000Z', configuration
  }
  return initialActivity(binding, () => new Date('2026-08-10T00:00:00.000Z'))
}

const context = {
  definition,
  runId: 'run-1',
  generation: 1,
  workspaceRoot: 'D:\\course',
  task: { threadId: 'thread-1', workspaceRoot: 'D:\\course' }
}

describe('CodexConfigurationEvidenceAdapter', () => {
  it('emits bounded structured evidence for the four required configuration settings', async () => {
    const adapter = new CodexConfigurationEvidenceAdapter({ current: async () => activity() })
    const result = await adapter.collect(context)

    expect(result.freshness).toBe('fresh')
    expect(result.evidence).toHaveLength(4)
    expect(result.configuration?.model.label).toBe('5.6 Sol')
    expect(result.sourceDigest).toMatch(/^[a-f0-9]{64}$/)
    expect(result.steps.map((step) => step.status)).toEqual([
      'completed', 'completed', 'completed', 'completed'
    ])
  })

  it('does not accept configuration from another bound task', async () => {
    const adapter = new CodexConfigurationEvidenceAdapter({
      current: async () => activity('thread-other')
    })
    const result = await adapter.collect(context)

    expect(result.freshness).toBe('unverifiable')
    expect(result.configuration).toBeUndefined()
    expect(result.evidence).toEqual([])
    expect(result.sourceDigest).toBeNull()
  })
})
