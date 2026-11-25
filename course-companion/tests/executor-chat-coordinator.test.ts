import { describe, expect, it } from 'vitest'
import type { ApprovedCodexConfiguration, PracticeDefinition } from '../shared/contracts'
import {
  ExecutorChatCoordinator,
  type CodexRequestClient
} from '../electron/main/executor-chat-coordinator'
import type { ExecutorChatBinding } from '../electron/main/practice-run-repository'

const approved: ApprovedCodexConfiguration = {
  schemaVersion: 1,
  sourcePracticeId: 'm1-codex-safe-setup',
  sourcePracticeVersion: '2.0.0',
  model: 'gpt-5.6-sol',
  reasoningEffort: 'high',
  serviceTier: 'standard',
  approvedAt: '2026-08-10T00:00:00.000Z'
}

function definition(policy: 'inherit-configuration-only' | 'safe-workspace-write'): PracticeDefinition {
  const moduleTwo = policy === 'safe-workspace-write'
  return {
    schemaVersion: 2,
    practiceId: moduleTwo ? 'm2-planning-package' : 'm1-codex-safe-setup',
    title: moduleTwo ? 'Xây dựng planning package' : 'Thiết lập Codex an toàn',
    version: '2.0.0',
    checkpointId: moduleTwo ? 'm2-planning-package' : 'm1-setup-checklist',
    objective: 'Hoàn thành mục tiêu Practice.',
    expectedOutcome: 'Tạo kết quả có thể duyệt.',
    workspaceKind: 'pilot-workspace',
    taskPolicy: policy,
    evidenceProfile: moduleTwo ? 'planning-package' : 'codex-task-configuration',
    checklist: [{ id: 'start', title: 'Bắt đầu', dependsOn: [] }],
    criteria: [],
    completionDestination: moduleTwo
      ? { lessonId: 'module-2', checkpointId: 'm2-mastery', sceneId: 'module-2-mastery', label: 'Bài kiểm tra và hoàn thành Module 2' }
      : { lessonId: 'module-1', checkpointId: 'm1-mastery', sceneId: 'module-1-mastery', label: 'Phần tổng kết Module 1' }
  }
}

function effective(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    thread: { id: 'thread-target' },
    cwd: 'D:\\course\\pilot-workspace',
    model: 'gpt-5.6-sol',
    reasoningEffort: 'high',
    serviceTier: null,
    approvalPolicy: 'on-request',
    sandbox: { type: 'workspaceWrite', writableRoots: ['D:\\course\\pilot-workspace'] },
    ...overrides
  }
}

function binding(name = 'Làm quen với Codex · Module 1'): ExecutorChatBinding {
  return {
    runId: 'run-123456',
    threadId: 'thread-target',
    name,
    workspaceRoot: 'D:\\course\\pilot-workspace',
    createdAt: '2026-08-10T00:00:00.000Z'
  }
}

function coordinator(client: CodexRequestClient, reviewer?: 'user' | 'auto_review'): ExecutorChatCoordinator {
  return new ExecutorChatCoordinator(
    client,
    { resolve: async () => 'D:\\course\\pilot-workspace' },
    async () => undefined,
    () => new Date('2026-08-10T00:00:00.000Z'),
    {
      attempts: 2,
      intervalMs: 0,
      wait: async () => undefined,
      readDesktopApprovalsReviewer: async () => reviewer
    }
  )
}

describe('ExecutorChatCoordinator', () => {
  it('creates a portfolio task in the verified project without sending a turn', async () => {
    const calls: Array<[string, Record<string, unknown>]> = []
    const client: CodexRequestClient = { async request(method, params = {}) {
      calls.push([method, params])
      return method === 'thread/start' ? effective({ thread: { id: 'thread-target', projectId: 'portfolio-project' } }) : {}
    } }
    const instance = new ExecutorChatCoordinator(client, {
      resolve: async () => 'D:\\course\\pilot-workspace', resolveProjectId: async () => 'portfolio-project'
    }, async () => undefined)
    const task = await instance.createTarget({ runId: 'run-123456',
      definition: { ...definition('safe-workspace-write'), practiceId: 'm2-portfolio-planning', workspaceKind: 'learner-portfolio' },
      approvedConfiguration: approved })
    expect(task).toMatchObject({ name: 'Portfolio của tôi', projectId: 'portfolio-project', threadId: 'thread-target' })
    expect(calls[0]![1]).toHaveProperty('projectId', 'portfolio-project')
    expect(calls.some(([method]) => method === 'turn/start')).toBe(false)
  })

  it('attaches the same legacy task to its project using metadata, without a writer or prompt', async () => {
    const calls: string[] = []; let assigned = false
    const instance = new ExecutorChatCoordinator({ async request(method) {
      calls.push(method)
      if (method === 'thread/metadata/update') { assigned = true; return {} }
      return { thread: { id: 'thread-target', cwd: 'D:\\course\\pilot-workspace', projectId: assigned ? 'portfolio-project' : null } }
    } }, { resolve: async () => 'D:\\course\\pilot-workspace', resolveProjectId: async () => 'portfolio-project' }, async () => undefined)
    await instance.prepareTarget(binding(), { ...definition('safe-workspace-write'), practiceId: 'm2-portfolio-planning' }, approved)
    expect(calls).toEqual(['thread/read', 'thread/metadata/update', 'thread/read'])
  })

  it('creates a Practice-aware Module 1 task without configuration overrides', async () => {
    const calls: Array<[string, Record<string, unknown>]> = []
    const client: CodexRequestClient = {
      async request(method, params = {}) {
        calls.push([method, params])
        return method === 'thread/start' ? effective({ sandbox: { type: 'dangerFullAccess' } }) : {}
      },
      async close() {}
    }

    const target = await coordinator(client).createTarget({
      runId: 'run-123456',
      definition: definition('inherit-configuration-only')
    })

    expect(target).toMatchObject(binding())
    expect(target.configuration).toMatchObject({
      runId: 'run-123456',
      threadId: 'thread-target',
      source: 'thread-start',
      fullAccess: { protocolValue: 'on', label: 'On' }
    })
    expect(calls[0]).toEqual(['thread/start', {
      cwd: 'D:\\course\\pilot-workspace',
      ephemeral: false,
      serviceName: 'content_builder_academy_practice'
    }])
    expect(calls[0]![1]).not.toHaveProperty('model')
    expect(calls[0]![1]).not.toHaveProperty('config')
    expect(calls[0]![1]).not.toHaveProperty('serviceTier')
    expect(calls[0]![1]).not.toHaveProperty('approvalPolicy')
    expect(calls[0]![1]).not.toHaveProperty('sandbox')
    expect(calls[1]).toEqual(['thread/name/set', {
      threadId: 'thread-target',
      name: 'Làm quen với Codex · Module 1'
    }])
  })

  it.each([
    ['user', 'ask-for-approval'],
    ['auto_review', 'approve-for-me']
  ] as const)('persists the Desktop reviewer %s before handing off a Module 1 task', async (reviewer, approvalMode) => {
    const calls: Array<[string, Record<string, unknown>]> = []
    const target = await coordinator({
      async request(method, params = {}) {
        calls.push([method, params])
        return method === 'thread/start' ? effective({ approvalsReviewer: params.approvalsReviewer }) : {}
      }
    }, reviewer).createTarget({ runId: 'run-123456', definition: definition('inherit-configuration-only') })

    expect(calls.map(([method]) => method)).toEqual(['thread/start', 'thread/name/set', 'thread/settings/update'])
    expect(calls[0]?.[1]).toHaveProperty('approvalsReviewer', reviewer)
    expect(calls[2]?.[1]).toEqual({ threadId: 'thread-target', approvalsReviewer: reviewer })
    expect(target.configuration?.approvalMode?.protocolValue).toBe(approvalMode)
  })

  it('leaves Approval unverified at startup if Codex cannot persist the reviewer', async () => {
    const target = await coordinator({
      async request(method, params = {}) {
        if (method === 'thread/settings/update') throw new Error('Codex App Server request failed: Method not found')
        return method === 'thread/start' ? effective({ approvalsReviewer: params.approvalsReviewer }) : {}
      }
    }, 'auto_review').createTarget({ runId: 'run-123456', definition: definition('inherit-configuration-only') })

    expect(target.configuration?.approvalMode?.protocolValue).toBeNull()
  })

  it('sends no turn while preparing an inherit-configuration-only task', async () => {
    const calls: Array<[string, Record<string, unknown>]> = []
    const client: CodexRequestClient = {
      async request(method, params = {}) {
        calls.push([method, params])
        if (method === 'thread/read' || method === 'thread/resume') return effective({ thread: { id: 'thread-target', cwd: 'D:\\course\\pilot-workspace', turns: [] } })
        return {}
      },
      async close() {}
    }

    await coordinator(client).prepareTarget(binding(), definition('inherit-configuration-only'))

    expect(calls).toEqual([['thread/read', { threadId: 'thread-target', includeTurns: false }]])
    expect(calls.map(([method]) => method)).not.toContain('turn/start')
  })

  it('creates a safe later task from the approved configuration and starts one instructional turn', async () => {
    const calls: Array<[string, Record<string, unknown>]> = []
    const client: CodexRequestClient = {
      async request(method, params = {}) {
        calls.push([method, params])
        if (method === 'thread/start') return effective()
        if (method === 'thread/read' || method === 'thread/resume') return effective({ thread: { id: 'thread-target', cwd: 'D:\\course\\pilot-workspace', turns: [] } })
        return {}
      },
      async close() {}
    }
    const instance = coordinator(client)
    const target = await instance.createTarget({
      runId: 'run-123456',
      definition: definition('safe-workspace-write'),
      approvedConfiguration: approved
    })
    await instance.prepareTarget(target, definition('safe-workspace-write'), approved)

    expect(calls[0]).toEqual(['thread/start', {
      cwd: 'D:\\course\\pilot-workspace',
      ephemeral: false,
      serviceName: 'content_builder_academy_practice',
      model: 'gpt-5.6-sol',
      serviceTier: 'standard',
      approvalPolicy: 'on-request',
      sandbox: 'workspace-write',
      config: { model_reasoning_effort: 'high' }
    }])
    expect(target.name).toBe('Xây dựng planning package · Module 2')
    expect(calls.filter(([method]) => method === 'turn/start')).toHaveLength(1)
  })

  it('blocks a safe task before thread/start when the Module 1 receipt is missing', async () => {
    const calls: string[] = []
    const client: CodexRequestClient = {
      async request(method) { calls.push(method); return {} },
      async close() {}
    }

    await expect(coordinator(client).createTarget({
      runId: 'run-123456',
      definition: definition('safe-workspace-write')
    })).rejects.toThrow('Approved Module 1 configuration is required')
    expect(calls).toEqual([])
  })

  it('preserves historical Module 3 v1 bootstrap retry without duplicating instructions', async () => {
    const calls: Array<[string, Record<string, unknown>]> = []
    const turns: Array<{ id: string; input: unknown }> = []
    let loaded = false
    let failResume = true
    let closes = 0
    const client: CodexRequestClient = {
      async request(method, params = {}) {
        calls.push([method, params])
        if (method === 'thread/start') {
          loaded = true
          return effective()
        }
        if (method === 'thread/resume') {
          if (failResume) {
            failResume = false
            throw new Error('Temporary resume failure')
          }
          loaded = true
        }
        if (method === 'thread/read' || method === 'thread/resume') {
          return effective({ thread: { id: 'thread-target', cwd: 'D:\\course\\pilot-workspace', turns: structuredClone(turns) } })
        }
        if (method === 'turn/start') {
          if (!loaded) throw new Error('thread not found: thread-target')
          turns.push({ id: 'instruction-turn', input: params.input })
          // The server accepted the turn, but the caller lost its acknowledgement.
          throw new Error('Lost turn acknowledgement')
        }
        return {}
      },
      async close() { loaded = false; closes += 1 }
    }
    const instance = coordinator(client)
    const portfolio: PracticeDefinition = {
      ...definition('safe-workspace-write'),
      practiceId: 'm3-portfolio-build',
      version: '1.0.0',
      workspaceKind: 'learner-portfolio',
      evidenceProfile: 'portfolio-build'
    }
    const target = await instance.createTarget({
      runId: 'run-123456', definition: portfolio, approvedConfiguration: approved
    })
    expect(loaded).toBe(false)
    await expect(instance.prepareTarget(target, portfolio, approved)).rejects.toThrow('Temporary resume failure')
    expect(turns).toHaveLength(0)
    await expect(instance.prepareTarget(target, portfolio, approved)).rejects.toThrow('Lost turn acknowledgement')
    await instance.prepareTarget(target, portfolio, approved)
    expect(turns).toHaveLength(1)
    expect(calls.filter(([method]) => method === 'thread/start')).toHaveLength(1)
    const resumeParams = {
      threadId: target.threadId,
      cwd: target.workspaceRoot,
      model: approved.model,
      serviceTier: approved.serviceTier,
      approvalPolicy: 'on-request',
      sandbox: 'workspace-write',
      config: { model_reasoning_effort: approved.reasoningEffort }
    }
    expect(calls.filter(([method]) => method === 'thread/resume')).toEqual([
      ['thread/resume', resumeParams],
      ['thread/resume', resumeParams]
    ])
    expect(calls.filter(([method]) => method === 'turn/start')).toHaveLength(1)
    expect(closes).toBe(4)
  })

  it.each(['m3-portfolio-build', 'm4-portfolio-release'])('only reads a desktop-owned %s task on preparation and retry', async (practiceId) => {
    const calls: Array<[string, Record<string, unknown>]> = []
    let closes = 0
    const client: CodexRequestClient = {
      async request(method, params = {}) {
        calls.push([method, params])
        if (method !== 'thread/read') throw new Error('already has an active writer')
        return { thread: { id: 'thread-target', cwd: 'D:\\course\\pilot-workspace' } }
      },
      async close() { closes += 1 }
    }
    const practice = { ...definition('safe-workspace-write'), practiceId,
      version: practiceId === 'm3-portfolio-build' ? '2.0.0' : '1.0.0' }
    const instance = coordinator(client)
    await instance.prepareTarget(binding(), practice, approved)
    await instance.prepareTarget(binding(), practice, approved)
    expect(calls).toEqual(Array.from({ length: 2 }, () => ['thread/read', { threadId: 'thread-target', includeTurns: false }]))
    expect(closes).toBe(2)
  })

  it.each([
    { id: 'other-thread', cwd: 'D:\\course\\pilot-workspace' },
    { id: 'thread-target', cwd: 'D:\\other' }
  ])('rejects a mismatched desktop-owned task without sending work: %j', async (thread) => {
    const calls: string[] = []
    const instance = coordinator({ async request(method) { calls.push(method); return { thread } } })
    await expect(instance.prepareTarget(binding(), { ...definition('safe-workspace-write'), practiceId: 'm3-portfolio-build' }, approved))
      .rejects.toThrow('could not read')
    expect(calls.every((method) => method === 'thread/read')).toBe(true)
  })

  it.each([
    { id: 'different-task', cwd: 'D:\\course\\pilot-workspace', turns: [] },
    { id: 'thread-target', cwd: 'D:\\different-workspace', turns: [] }
  ])('sends no instruction if resume returns a different task or workspace: %j', async (thread) => {
    const calls: string[] = []
    const client: CodexRequestClient = {
      async request(method) {
        calls.push(method)
        if (method === 'thread/read') return { thread: { ...thread, id: 'thread-target', cwd: 'D:\\course\\pilot-workspace' } }
        if (method === 'thread/resume') return { thread }
        return {}
      }
    }
    await expect(coordinator(client).prepareTarget(binding(), definition('safe-workspace-write'), approved))
      .rejects.toThrow('Invalid Executor chat binding')
    expect(calls).not.toContain('turn/start')
  })

  it('rechecks resumed history before sending an instruction already accepted by another connection', async () => {
    const calls: string[] = []
    const client: CodexRequestClient = {
      async request(method) {
        calls.push(method)
        return effective({ thread: {
          id: 'thread-target', cwd: 'D:\\course\\pilot-workspace',
          turns: method === 'thread/resume' ? [{ id: 'instruction-turn' }] : []
        } })
      }
    }
    await coordinator(client).prepareTarget(binding(), definition('safe-workspace-write'), approved)
    expect(calls).toEqual(['thread/read', 'thread/resume'])
  })

  it.each([
    { sandbox: { type: 'dangerFullAccess' } },
    { sandbox: { type: 'readOnly' } },
    { reasoningEffort: null },
    { approvalPolicy: 'never' }
  ])('blocks instructions if resume does not restore approved settings: %j', async (overrides) => {
    const calls: string[] = []
    const client: CodexRequestClient = {
      async request(method) {
        calls.push(method)
        return effective({
          thread: { id: 'thread-target', cwd: 'D:\\course\\pilot-workspace', turns: [] },
          ...(method === 'thread/resume' ? overrides : {})
        })
      }
    }
    await expect(coordinator(client).prepareTarget(binding(), definition('safe-workspace-write'), approved))
      .rejects.toThrow('incompatible safety settings')
    expect(calls).not.toContain('turn/start')
  })

  it.each([
    ['unsafe permissions', { sandbox: { type: 'dangerFullAccess' } }],
    ['wrong approval policy', { approvalPolicy: 'never' }],
    ['wrong model', { model: 'gpt-5.6-terra' }],
    ['wrong effort', { reasoningEffort: 'medium' }],
    ['wrong workspace', { cwd: 'D:\\other' }],
  ])('rejects %s before naming or starting a turn', async (_label, overrides) => {
    const calls: string[] = []
    const client: CodexRequestClient = {
      async request(method) { calls.push(method); return effective(overrides) },
      async close() {}
    }

    await expect(coordinator(client).createTarget({
      runId: 'run-123456',
      definition: definition('safe-workspace-write'),
      approvedConfiguration: approved
    })).rejects.toThrow()
    expect(calls).toEqual(['thread/start'])
  })

  it('does not duplicate the later-task turn when retry discovers existing turns', async () => {
    const calls: string[] = []
    const client: CodexRequestClient = {
      async request(method) {
        calls.push(method)
        return { thread: { id: 'thread-target', cwd: 'D:\\course\\pilot-workspace', turns: [{ id: 'existing' }] } }
      },
      async close() {}
    }

    await coordinator(client).prepareTarget(
      binding('Practice · Module 2 · m2-planning-package · 123456'),
      definition('safe-workspace-write')
    )
    expect(calls).toEqual(['thread/read'])
  })

  it('bootstraps one reusable staged portfolio task without planning-package assumptions', async () => {
    const calls: Array<[string, Record<string, unknown>]> = []
    const client: CodexRequestClient = {
      async request(method, params = {}) {
        calls.push([method, params])
        if (method === 'thread/read' || method === 'thread/resume') {
          return effective({ thread: { id: 'thread-target', cwd: 'D:\\course\\pilot-workspace', turns: [] } })
        }
        return {}
      },
      async close() {}
    }
    const staged: PracticeDefinition = {
      ...definition('safe-workspace-write'),
      practiceId: 'm3-portfolio-build',
      version: '1.0.0',
      workspaceKind: 'learner-portfolio',
      evidenceProfile: 'portfolio-build',
      stages: Array.from({ length: 5 }, (_, index) => ({
        id: `stage-${index + 1}`,
        order: (index + 1) as 1 | 2 | 3 | 4 | 5,
        dependsOn: index === 0 ? [] : [`stage-${index}`],
        requiredArtifactPaths: [`evidence/module-3/stage-${index + 1}.md`]
      }))
    }

    await coordinator(client).prepareTarget(binding(), staged, approved)

    const turn = calls.find(([method]) => method === 'turn/start')?.[1]
    expect(JSON.stringify(turn)).toContain('cả năm stage')
    expect(JSON.stringify(turn)).toContain('không tạo task mới')
    expect(JSON.stringify(turn)).not.toContain('artifacts/PRD.md')
    expect(calls.filter(([method]) => method === 'turn/start')).toHaveLength(1)
  })

  it('leaves the historical portfolio-planning task untouched when preparing it', async () => {
    const calls: Array<[string, Record<string, unknown>]> = []
    const client: CodexRequestClient = {
      async request(method, params = {}) {
        calls.push([method, params])
        if (method === 'thread/read' || method === 'thread/resume') {
          return effective({ thread: { id: 'thread-target', cwd: 'D:\\course\\pilot-workspace', turns: [] } })
        }
        return {}
      },
      async close() {}
    }
    const paths = [
      'planning/portfolio-brief.md',
      'planning/content-evidence-inventory.md',
      'planning/reference/reference.md',
      'planning/PRD.md',
      'planning/requirement-validation-map.md',
      'planning/implementation-plan.md',
      'planning/first-task-brief.md'
    ]
    const staged: PracticeDefinition = {
      ...definition('safe-workspace-write'),
      practiceId: 'm2-portfolio-planning',
      version: '1.0.0',
      workspaceKind: 'learner-portfolio',
      evidenceProfile: 'portfolio-planning',
      stages: Array.from({ length: 5 }, (_, index) => ({
        id: `stage-${index + 1}`,
        order: (index + 1) as 1 | 2 | 3 | 4 | 5,
        dependsOn: index === 0 ? [] : [`stage-${index}`],
        requiredArtifactPaths: index < 3 ? [paths[index]!] : index === 3 ? [paths[3]!] : paths.slice(4)
      }))
    }

    await coordinator(client).prepareTarget(binding(), staged, approved)

    expect(calls).toEqual([['thread/read', { threadId: 'thread-target', includeTurns: false }]])
  })
})
