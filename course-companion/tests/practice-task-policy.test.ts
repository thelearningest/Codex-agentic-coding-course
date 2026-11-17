import { describe, expect, it } from 'vitest'
import type { ApprovedCodexConfiguration, PracticeDefinition } from '../shared/contracts'
import {
  buildPracticeTaskStartPlan,
  parseEffectivePracticeTask,
  validateEffectivePracticeTask
} from '../electron/main/practice-task-policy'

const definition: PracticeDefinition = {
  schemaVersion: 2,
  practiceId: 'm2-planning-package',
  title: 'Xây dựng planning package',
  version: '2.0.0',
  checkpointId: 'm2-planning-package',
  objective: 'Lập kế hoạch.',
  expectedOutcome: 'Hai artifact được duyệt.',
  workspaceKind: 'pilot-workspace',
  taskPolicy: 'safe-workspace-write',
  evidenceProfile: 'planning-package',
  checklist: [{ id: 'start', title: 'Bắt đầu', dependsOn: [] }],
  criteria: [],
  completionDestination: {
    lessonId: 'module-2',
    checkpointId: 'm2-mastery',
    sceneId: 'module-2-mastery',
    label: 'Bài kiểm tra và hoàn thành Module 2'
  }
}

const approved: ApprovedCodexConfiguration = {
  schemaVersion: 1,
  sourcePracticeId: 'm1-codex-safe-setup',
  sourcePracticeVersion: '2.0.0',
  model: 'gpt-5.6-sol',
  reasoningEffort: 'high',
  serviceTier: 'standard',
  approvedAt: '2026-08-10T00:00:00.000Z'
}

describe('Practice task policy', () => {
  it.each(['gpt-6-astra', undefined])('accepts the learner model %s or inherits it when unavailable', (model) => {
    const plan = buildPracticeTaskStartPlan({ runId: 'run-1', definition, workspaceRoot: 'D:\\course',
      approvedConfiguration: { ...approved, model } })
    if (model) expect(plan.startParams.model).toBe(model)
    else expect(plan.startParams).not.toHaveProperty('model')
    expect(plan.startParams).toMatchObject({ approvalPolicy: 'on-request', sandbox: 'workspace-write',
      config: { model_reasoning_effort: 'high' } })
  })

  it('requires a complete approved configuration for safe workspace-write', () => {
    expect(() => buildPracticeTaskStartPlan({
      runId: 'run-1', definition, workspaceRoot: 'D:\\course'
    })).toThrow('Approved Module 1 configuration is required')
  })

  it('parses and accepts an exact safe effective response', () => {
    const plan = buildPracticeTaskStartPlan({
      runId: 'run-1', definition, workspaceRoot: 'D:\\course', approvedConfiguration: approved
    })
    const effective = parseEffectivePracticeTask({
      thread: { id: 'thread-1' },
      cwd: 'D:\\course',
      model: 'gpt-5.6-sol',
      reasoningEffort: 'high',
      serviceTier: null,
      approvalPolicy: 'on-request',
      sandbox: { type: 'workspaceWrite', writableRoots: ['D:\\course'] }
    })

    expect(() => validateEffectivePracticeTask({
      effective, plan, workspaceRoot: 'D:\\course', approvedConfiguration: approved,
      samePath: (left, right) => left === right
    })).not.toThrow()
  })

  it('rejects incomplete effective response fields', () => {
    expect(() => parseEffectivePracticeTask({
      thread: { id: 'thread-1' }, cwd: 'D:\\course', model: 'gpt-5.6-sol'
    })).toThrow('incomplete effective task settings')
  })
})
