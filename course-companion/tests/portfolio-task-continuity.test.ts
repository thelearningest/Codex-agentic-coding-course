import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { portfolioPackageArtifactPaths, type ApprovedCodexConfiguration, type PortfolioPackageHandoff } from '../shared/contracts'
import { ExecutorChatCoordinator } from '../electron/main/executor-chat-coordinator'
import { PracticeCoordinator } from '../electron/main/practice-coordinator'
import { PracticeDefinitionRepository } from '../electron/main/practice-definition-repository'
import { defaultPracticeWorkspaceRecord, PracticeRunRepository } from '../electron/main/practice-run-repository'

const directories: string[] = []
const time = '2026-09-11T00:00:00.000Z'
const approved: ApprovedCodexConfiguration = {
  schemaVersion: 1, sourcePracticeId: 'm1-codex-safe-setup', sourcePracticeVersion: '2.0.0',
  model: 'gpt-5.6-sol', reasoningEffort: 'high', serviceTier: 'standard', approvedAt: time
}
const definitions = new PracticeDefinitionRepository(resolve('../pilot-workspace/course/practices'))
afterEach(async () => { await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true }))) })

function handoff(workspace: string): PortfolioPackageHandoff {
  const artifacts = portfolioPackageArtifactPaths.map((path) => ({ path, digest: 'a'.repeat(64) }))
  return { schemaVersion: 2, workspace: { canonicalPath: workspace, identityDigest: 'b'.repeat(64) }, artifacts,
    mastery: { questionIds: [], answerDigest: 'c'.repeat(64) },
    summary: { learnerDecision: 'Audience', evidenceBoundary: 'Private', firstBuild: 'Plan order', deliberatelyOutOfScope: 'Deploy' },
    moduleThreeInput: { workspacePath: workspace, artifactReferences: artifacts },
    approval: { courseRunId: 'course-1', runId: 'planning-1', generation: 1, threadId: 'original-task',
      workspaceIdentityDigest: 'b'.repeat(64), sourceDigest: 'd'.repeat(64), artifactDigests: Object.fromEntries(artifacts.map((item) => [item.path, item.digest])), recordedAt: time },
    submission: { runId: 'planning-1', generation: 1, sourceDigest: 'd'.repeat(64), reviewDigest: 'e'.repeat(64), reviewedAt: time },
    task: { runId: 'planning-1', threadId: 'original-task', name: 'Original portfolio', workspaceRoot: workspace, createdAt: time }
  }
}

describe('portfolio task continuation', () => {
  it('repairs a backend-only project binding on resume while preserving the task and saved learner work', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'portfolio-desktop-repair-'))
    directories.push(workspace)
    const repository = new PracticeRunRepository(workspace)
    let desiredProject = 'backend-only-project'
    let assignedProject = desiredProject
    const calls: string[] = []
    const executor = new ExecutorChatCoordinator({ async request(method, params = {}) {
      calls.push(method)
      if (method === 'thread/start') return {
        thread: { id: 'original-task', projectId: assignedProject }, cwd: workspace,
        model: approved.model, reasoningEffort: approved.reasoningEffort,
        serviceTier: approved.serviceTier, approvalPolicy: 'on-request',
        sandbox: { type: 'workspaceWrite', writableRoots: [workspace] }
      }
      if (method === 'thread/name/set') return {}
      if (method === 'thread/metadata/update') {
        assignedProject = String(params.projectId)
        const latest = await repository.load()
        latest.activeRun!.learnerDecisions['during-reconnect'] = 'Preserve this learner decision'
        await repository.save(latest)
        return {}
      }
      if (method === 'thread/read') return { thread: { id: 'original-task', cwd: workspace, projectId: assignedProject, turns: [] } }
      throw new Error(`Unexpected automatic task action: ${method}`)
    } }, { resolve: async () => workspace, resolveProjectId: async () => desiredProject }, async () => undefined)
    const coordinator = new PracticeCoordinator(repository, definitions, executor,
      () => new Date(time), undefined, undefined, async () => approved)
    await coordinator.startNew({ practiceId: 'm2-portfolio-planning', practiceVersion: '2.0.0', transfer: false })
    const before = await repository.load()
    desiredProject = 'desktop-mapped-project'
    calls.length = 0
    await coordinator.resume()
    const expected = structuredClone(before)
    expected.activeRun!.binding.projectId = desiredProject
    expected.activeRun!.learnerDecisions['during-reconnect'] = 'Preserve this learner decision'
    expect(await repository.load()).toEqual(expected)
    expect(calls).toEqual(['thread/read', 'thread/metadata/update', 'thread/read'])
    calls.length = 0
    await coordinator.resume()
    expect(calls).toEqual(['thread/read'])
  })

  it('opens an empty Module 2 task after failed preparation, Retry and Resume without sending learner instructions', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'portfolio-learner-start-'))
    directories.push(workspace)
    const repository = new PracticeRunRepository(workspace)
    const definition = await definitions.load('m2-portfolio-planning', '2.0.0')
    const calls: Array<[string, Record<string, unknown>]> = []
    const turns: unknown[] = []
    let failRead = true
    let closes = 0
    const open = vi.fn(async () => undefined)
    const executor = new ExecutorChatCoordinator({
      async request(method, params = {}) {
        calls.push([method, params])
        if (method === 'thread/start') return {
          thread: { id: 'learner-task' }, cwd: workspace,
          model: approved.model, reasoningEffort: approved.reasoningEffort,
          serviceTier: approved.serviceTier, approvalPolicy: 'on-request',
          sandbox: { type: 'workspaceWrite', writableRoots: [workspace] }
        }
        if (method === 'thread/name/set') return {}
        if (method === 'thread/read') {
          if (failRead) { failRead = false; throw new Error('Temporary discovery failure') }
          return { thread: { id: 'learner-task', cwd: workspace, turns } }
        }
        throw new Error(`Unexpected automatic task action: ${method}`)
      },
      async close() { closes += 1 }
    }, { resolve: async () => workspace }, open, () => new Date(time), { attempts: 1 })
    const coordinator = new PracticeCoordinator(repository, definitions, executor,
      () => new Date(time), undefined, undefined, async () => approved)

    await expect(coordinator.startNew({
      practiceId: definition.practiceId, practiceVersion: definition.version, transfer: false
    })).rejects.toThrow('Task Codex đã được tạo')
    expect((await repository.load()).pendingTransition?.targetBinding?.threadId).toBe('learner-task')
    expect(open).not.toHaveBeenCalled()
    await coordinator.retry()
    await coordinator.resume()

    const state = await repository.load()
    expect(state.pendingTransition).toBeNull()
    expect(state.activeRun?.binding.threadId).toBe('learner-task')
    expect(state.activeRun?.binding.configuration?.model.protocolValue).toBe(approved.model)
    expect(calls.map(([method]) => method)).toEqual([
      'thread/start', 'thread/name/set', 'thread/read', 'thread/read', 'thread/read'
    ])
    expect(calls[0]?.[1]).toMatchObject({
      cwd: workspace, model: approved.model, approvalPolicy: 'on-request', sandbox: 'workspace-write'
    })
    expect(turns).toEqual([])
    expect(open.mock.calls).toHaveLength(2)
    expect(open).toHaveBeenCalledWith('codex://threads/learner-task')
    expect(closes).toBe(4)
  })

  it('starts Module 3 in the exact handed-off task and never creates a replacement on failed preparation or retry', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'portfolio-continuity-'))
    directories.push(workspace)
    const repository = new PracticeRunRepository(workspace)
    const createTarget = vi.fn(async () => { throw new Error('Must not create') })
    const prepareTarget = vi.fn(async (): Promise<void> => { throw new Error('Disconnected') })
    const openTarget = vi.fn(async () => undefined)
    const ids = ['switch-1', 'build-1']
    const coordinator = new PracticeCoordinator(repository, definitions, { createTarget, prepareTarget, openTarget },
      () => new Date(time), () => ids.shift()!, undefined, undefined, undefined, undefined, undefined, async () => handoff(workspace))
    await expect(coordinator.startNew({ practiceId: 'm3-portfolio-build', practiceVersion: '1.0.0', transfer: false })).rejects.toThrow('không tạo task thay thế')
    expect(createTarget).not.toHaveBeenCalled()
    expect((await repository.load()).pendingTransition?.targetBinding).toMatchObject({ threadId: 'original-task', runId: 'build-1', workspaceRoot: workspace })
    prepareTarget.mockImplementation(async () => undefined)
    await coordinator.retry()
    expect(createTarget).not.toHaveBeenCalled()
    expect(openTarget).toHaveBeenCalledWith(expect.objectContaining({ threadId: 'original-task', runId: 'build-1' }))
    expect((await repository.load()).activeRun?.binding.threadId).toBe('original-task')
  })

  it('creates one build chat in the planning Project and reopens it after retry and resume', async () => {
    const root = await mkdtemp(join(tmpdir(), 'module-three-chat-'))
    directories.push(root)
    const receipt = handoff(root)
    receipt.task.projectId = 'portfolio-project'
    const repository = new PracticeRunRepository(root)
    let failRead = true
    const request = vi.fn(async (method: string) => {
      if (method === 'thread/start') return {
        thread: { id: 'build-chat', projectId: receipt.task.projectId }, cwd: root,
        model: approved.model, reasoningEffort: approved.reasoningEffort, serviceTier: approved.serviceTier,
        approvalPolicy: 'on-request', sandbox: { type: 'workspaceWrite', writableRoots: [root] }
      }
      if (method === 'thread/name/set') return {}
      if (method === 'thread/read' && !failRead) return {
        thread: { id: 'build-chat', cwd: root, projectId: receipt.task.projectId, turns: [] }
      }
      throw new Error('Unavailable')
    })
    const open = vi.fn(async () => undefined)
    const executor = new ExecutorChatCoordinator({ request }, {
      resolve: async () => root, resolveProjectId: async () => receipt.task.projectId
    }, open, undefined, { attempts: 1 })
    const coordinator = new PracticeCoordinator(repository, definitions, executor, undefined, undefined,
      undefined, async () => approved, undefined, undefined, undefined, async () => receipt)
    await expect(coordinator.startNew({ practiceId: 'm3-portfolio-build', practiceVersion: '2.1.0', transfer: false })).rejects.toThrow()
    expect((await repository.load()).pendingTransition?.targetBinding?.threadId).toBe('build-chat')
    failRead = false
    await coordinator.retry()
    await coordinator.resume()
    expect(request).toHaveBeenCalledWith('thread/start', expect.objectContaining({ cwd: root, projectId: 'portfolio-project' }))
    expect(request.mock.calls.filter(([method]) => method === 'thread/start')).toHaveLength(1)
    expect(request.mock.calls.some(([method]) => method === 'turn/start')).toBe(false)
    expect(open.mock.calls).toEqual([['codex://threads/build-chat'], ['codex://threads/build-chat']])
  })

  it.each(['different-folder', 'different-project', 'missing-project'])('blocks %s before creating a build chat', async (problem) => {
    const root = resolve('approved-portfolio-folder')
    const request = vi.fn()
    const executor = new ExecutorChatCoordinator({ request }, {
      resolve: async () => problem === 'different-folder' ? resolve('other-folder') : root,
      resolveProjectId: async () => problem === 'missing-project' ? undefined : 'other-project'
    }, async () => undefined)
    await expect(executor.createTarget({ runId: 'build-run', definition: await definitions.load('m3-portfolio-build', '2.1.0'),
      approvedConfiguration: approved, portfolio: { workspaceRoot: root, projectId: 'planning-project' }
    })).rejects.toThrow('PORTFOLIO_CONTINUATION_UNAVAILABLE')
    expect(request).not.toHaveBeenCalled()
  })

  it.each([true, false])('splits a legacy planning chat only when it is untouched (%s)', async (untouched) => {
    const root = await mkdtemp(join(tmpdir(), 'legacy-build-chat-'))
    directories.push(root)
    const repository = new PracticeRunRepository(root)
    const receipt = handoff(root)
    const createTarget = vi.fn(async ({ runId }: { runId: string }) => ({
      ...receipt.task, runId, threadId: 'new-build-chat', projectId: 'portfolio-project'
    }))
    const validateExistingTarget = vi.fn(async () => untouched)
    const openTarget = vi.fn()
    const coordinator = new PracticeCoordinator(repository, definitions, {
      createTarget, prepareTarget: async () => undefined, validateExistingTarget, openTarget
    }, undefined, undefined, undefined, async () => approved, undefined, undefined, undefined, async () => receipt)
    // Reproduce the persisted state produced by the previous release.
    await coordinator.startNew({ practiceId: 'm3-portfolio-build', practiceVersion: '1.0.0', transfer: false })
    const state = await repository.load()
    const legacy = state.activeRun!
    legacy.practiceVersion = '2.1.0'
    state.archivedRuns.push({ runId: receipt.task.runId, generation: 1, practiceId: 'm2-portfolio-planning',
      practiceVersion: '2.0.0', threadId: receipt.task.threadId, name: 'Planning', outcome: 'completed', archivedAt: time })
    await repository.save(state)
    await coordinator.resume()
    await coordinator.resume()
    expect(validateExistingTarget).toHaveBeenCalledWith(legacy.binding, expect.anything(), legacy.startedAt)
    expect(createTarget).toHaveBeenCalledTimes(untouched ? 1 : 0)
    const result = await repository.load()
    expect(result.activeRun?.binding.threadId).toBe(untouched ? 'new-build-chat' : receipt.task.threadId)
    if (untouched) expect(result.archivedRuns.at(-1)?.retainedRun).toEqual(legacy)
  })

  it('fails closed with no handed-off task', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'portfolio-no-handoff-'))
    directories.push(workspace)
    const createTarget = vi.fn(async () => { throw new Error('Must not create') })
    const coordinator = new PracticeCoordinator(new PracticeRunRepository(workspace), definitions, {
      createTarget, prepareTarget: async () => undefined, openTarget: async () => undefined
    })
    await expect(coordinator.startNew({ practiceId: 'm3-portfolio-build', practiceVersion: '1.0.0', transfer: false })).rejects.toThrow('không tạo task thay thế')
    expect(createTarget).not.toHaveBeenCalled()
  })

  it.each(['1.0.0', '2.0.0'])('preserves existing Module 2 conversation on repeated preparation (%s)', async (version) => {
    const workspace = resolve('portfolio-task-fixture')
    const target = handoff(workspace).task
    const turns: unknown[] = [{ input: 'Old planning discussion' }]
    const request = vi.fn(async (method: string) => {
      if (method === 'thread/read') return { thread: { id: target.threadId, cwd: workspace, turns } }
      throw new Error('Module 2 preparation must only read the existing task')
    })
    const executor = new ExecutorChatCoordinator({ request }, { resolve: async () => workspace }, async () => undefined)
    const definition = await definitions.load('m2-portfolio-planning', version)
    await executor.prepareTarget(target, definition, approved)
    await executor.prepareTarget(target, definition, approved)
    expect(request.mock.calls.map(([method]) => method)).toEqual(['thread/read', 'thread/read'])
    expect(turns).toEqual([{ input: 'Old planning discussion' }])
  })

  it('validates an existing task by exact read-only identity and workspace without starting a turn', async () => {
    const workspace = resolve('portfolio-task-fixture')
    const target = handoff(workspace).task
    const request = vi.fn(async (method: string) => {
      if (method === 'thread/read') return { thread: { id: target.threadId, cwd: workspace, turns: [] } }
      throw new Error('Migration validation must remain read-only')
    })
    const executor = new ExecutorChatCoordinator({ request }, { resolve: async () => workspace }, async () => undefined)
    const definition = await definitions.load('m2-portfolio-planning', '2.0.0')

    await expect(executor.validateExistingTarget(target, definition)).resolves.toBe(true)
    expect(request).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenCalledWith('thread/read', { threadId: target.threadId, includeTurns: false })

    const boundary = Date.parse(time) / 1000
    for (const [updatedAt, untouched] of [[boundary - 1, true], [boundary, false], [boundary + 10, false], [null, false]] as const) {
      request.mockResolvedValueOnce({ thread: { id: target.threadId, cwd: workspace, turns: [], updatedAt } } as Awaited<ReturnType<typeof request>>)
      await expect(executor.validateExistingTarget(target, definition, time)).resolves.toBe(untouched)
    }
    request.mockResolvedValueOnce({ thread: { id: target.threadId, cwd: resolve('wrong-workspace'), turns: [] } })
    await expect(executor.validateExistingTarget(target, definition)).resolves.toBe(false)
    request.mockRejectedValueOnce(new Error('unreadable'))
    await expect(executor.validateExistingTarget(target, definition)).resolves.toBe(false)
    expect(request.mock.calls.some(([method]) => method === 'thread/start' || method === 'turn/start')).toBe(false)
  })

  it('relaunches an archive-only v1 attempt through validated coordinator recovery exactly once', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'portfolio-archive-continuity-'))
    directories.push(workspace)
    const repository = new PracticeRunRepository(workspace)
    const definition = await definitions.load('m2-portfolio-planning', '2.0.0')
    await repository.save({
      ...defaultPracticeWorkspaceRecord(),
      archivedRuns: [{
        runId: 'legacy-run', generation: 3, practiceId: definition.practiceId, practiceVersion: '1.0.0',
        threadId: 'legacy-task', name: 'Historical Module 2', outcome: 'completed', archivedAt: time,
        reviewHistory: []
      }]
    })
    const validateExistingTarget = vi.fn(async () => true)
    const createTarget = vi.fn(async () => { throw new Error('must not create') })
    const coordinator = new PracticeCoordinator(
      repository,
      definitions,
      { createTarget, prepareTarget: async () => undefined, openTarget: async () => undefined, validateExistingTarget },
      () => new Date(time),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      async () => ({ courseRunId: 'course-1', runId: 'legacy-run', workspaceRoot: workspace })
    )

    await coordinator.loadWorkspace({ practiceId: definition.practiceId, practiceVersion: definition.version })
    const migrated = await repository.load()
    await coordinator.loadWorkspace({ practiceId: definition.practiceId, practiceVersion: definition.version })

    expect(migrated.activeRun).toMatchObject({
      runId: 'legacy-run', generation: 4, practiceVersion: '2.0.0',
      binding: { threadId: 'legacy-task', workspaceRoot: workspace }
    })
    expect(await repository.load()).toEqual(migrated)
    expect(validateExistingTarget).toHaveBeenCalledTimes(1)
    expect(createTarget).not.toHaveBeenCalled()
  })
})
