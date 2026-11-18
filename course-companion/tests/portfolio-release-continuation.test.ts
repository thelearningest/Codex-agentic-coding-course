import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { ApprovedCodexConfiguration, PracticeDefinition } from '../shared/contracts'
import { ExecutorChatCoordinator } from '../electron/main/executor-chat-coordinator'
import { PracticeCoordinator } from '../electron/main/practice-coordinator'
import { PracticeDefinitionRepository } from '../electron/main/practice-definition-repository'
import { PracticeRunRepository, defaultPracticeWorkspaceRecord } from '../electron/main/practice-run-repository'
import { portfolioReleaseInstructions } from '../electron/main/portfolio-release-instructions'
import { buildRun } from './fixtures/portfolio-build-fixture'

const roots: string[] = []
const identity = { practiceId: 'm4-portfolio-release', practiceVersion: '1.0.0' }
const sourceCheckpoint = `sha256:${'a'.repeat(64)}`
const approved: ApprovedCodexConfiguration = {
  schemaVersion: 1, sourcePracticeId: 'm1-codex-safe-setup', sourcePracticeVersion: '2.0.0',
  model: 'gpt-5.6-sol', reasoningEffort: 'high', serviceTier: 'standard', approvedAt: '2026-10-22T00:00:00.000Z'
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'release-continuation-'))
  roots.push(root)
  const workspace = join(root, 'portfolio')
  const definitionDirectory = join(root, 'definitions')
  await mkdir(workspace)
  await mkdir(definitionDirectory)
  const courseDefinitions = new PracticeDefinitionRepository(join(process.cwd(), '..', 'pilot-workspace/course/practices'))
  const buildDefinition = await courseDefinitions.load('m3-portfolio-build', '2.1.0')
  const releaseDefinition: PracticeDefinition = {
    ...buildDefinition, practiceId: identity.practiceId, version: identity.practiceVersion,
    title: 'Phát hành portfolio', checkpointId: 'm4-portfolio-release', evidenceProfile: 'portfolio-release',
    completionDestination: { lessonId: 'module-4', checkpointId: 'm4-complete', sceneId: 'module-4-complete', label: 'Kết quả phát hành' }
  }
  await writeFile(join(definitionDirectory, `${buildDefinition.practiceId}.json`), JSON.stringify(buildDefinition))
  await writeFile(join(definitionDirectory, `${releaseDefinition.practiceId}.json`), JSON.stringify(releaseDefinition))
  const definitions = new PracticeDefinitionRepository(definitionDirectory)
  const runs = new PracticeRunRepository(join(root, 'data'))
  const prior = buildRun(buildDefinition, workspace)
  await runs.save({ ...defaultPracticeWorkspaceRecord(), activeRun: prior })
  type Handoff = { task: typeof prior.binding; workspace: { canonicalPath: string }; sourceCheckpoint: string }
  let handoff: Handoff | null = { task: prior.binding, workspace: { canonicalPath: workspace }, sourceCheckpoint }
  let handoffReads = 0
  let afterFirstHandoff: (() => void) | undefined
  let readable = true
  const calls: Array<{ method: string; params: Record<string, unknown> }> = []
  const turns: Array<{ id: string; input: unknown }> = [{ id: 'module-three-history', input: 'Earlier portfolio work' }]
  const opened: string[] = []
  const executor = new ExecutorChatCoordinator({
    async request(method, params = {}) {
      calls.push({ method, params })
      if (method === 'thread/start') throw new Error('A replacement task must never be created')
      if (method === 'thread/resume' || method === 'turn/start') throw new Error('already has an active writer')
      if (method === 'thread/read') {
        if (!readable) throw new Error('Original task is temporarily unreadable')
        return {
          thread: { id: prior.binding.threadId, cwd: workspace, turns: structuredClone(turns) },
          cwd: workspace, model: approved.model, reasoningEffort: approved.reasoningEffort,
          serviceTier: approved.serviceTier, approvalPolicy: 'on-request',
          sandbox: { type: 'workspaceWrite', writableRoots: [workspace] }
        }
      }
      return {}
    },
    async close() {}
  }, { async resolve() { return workspace } }, async (url) => { opened.push(url) },
  undefined, { attempts: 1, intervalMs: 0 })
  const coordinator = new PracticeCoordinator(runs, definitions, executor,
    undefined, undefined, undefined, async () => approved, undefined, undefined, undefined, undefined, undefined,
    async () => {
      handoffReads += 1
      if (handoffReads > 1) afterFirstHandoff?.()
      return structuredClone(handoff)
    })
  return {
    workspace, prior, runs, coordinator, calls, turns, opened,
    getHandoff: () => handoff!, setHandoff: (next: Handoff | null) => { handoff = next },
    setReadable: (next: boolean) => { readable = next },
    afterFirstHandoff: (callback: () => void) => { afterFirstHandoff = callback }
  }
}

describe('Module 4 continuation in the approved portfolio task', () => {
  it('opens the desktop-owned task and exposes verified release instructions without sending a message', async () => {
    const f = await fixture()
    const view = await f.coordinator.startNew({ ...identity, transfer: false })
    const saved = await f.runs.load()
    expect(saved.activeRun).toMatchObject({ practiceId: identity.practiceId, binding: {
      threadId: f.prior.binding.threadId, workspaceRoot: f.workspace
    } })
    expect(saved.activeRun?.binding.runId).toBe(view.activePractice?.runId)
    expect(saved.activeRun?.runId).not.toBe(f.prior.runId)
    expect(saved.archivedRuns.at(-1)?.retainedRun).toEqual(f.prior)
    expect(f.calls.filter(({ method }) => method === 'thread/start')).toHaveLength(0)
    expect(f.calls.every(({ method }) => method === 'thread/read')).toBe(true)
    const prompt = view.startPrompt!
    expect(prompt).toContain(sourceCheckpoint)
    expect(prompt).toContain('evidence/module-4/deployment-record.json')
    expect(prompt).toContain('git rev-parse HEAD')
    expect(prompt).toContain('moduleThreeSourceCheckpoint')
    expect(prompt).not.toContain('Dừng sau mỗi stage')
    await f.coordinator.resume(identity)
    await f.coordinator.resume(identity)
    expect(f.calls.filter(({ method }) => method === 'turn/start')).toHaveLength(0)
    expect(f.turns).toHaveLength(1)
    expect(f.opened).toEqual(Array(3).fill(`codex://threads/${f.prior.binding.threadId}`))
  })

  it.each(['missing', 'workspace', 'checkpoint', 'malformed-checkpoint', 'task-change'])(
    'preserves the existing run when the verified handoff has a %s problem', async (problem) => {
      const f = await fixture()
      if (problem === 'missing') f.setHandoff(null)
      if (problem === 'workspace') f.setHandoff({ ...f.getHandoff(), workspace: { canonicalPath: join(f.workspace, 'other') } })
      if (problem === 'checkpoint') f.setHandoff({ ...f.getHandoff(), sourceCheckpoint: '' })
      if (problem === 'malformed-checkpoint') f.setHandoff({ ...f.getHandoff(), sourceCheckpoint: 'unverified-legacy-attempt' })
      if (problem === 'task-change') f.afterFirstHandoff(() => {
        f.setHandoff({ ...f.getHandoff(), task: { ...f.prior.binding, threadId: 'thread-other' } })
      })

      await expect(f.coordinator.startNew({ ...identity, transfer: false })).rejects.toThrow()

      expect((await f.runs.load()).activeRun).toEqual(f.prior)
      expect(f.calls.filter(({ method }) => method === 'thread/start' || method === 'turn/start')).toHaveLength(0)
      expect(f.opened).toEqual([])
    }
  )

  it('retries an unreadable original task without replacing it or losing the previous run', async () => {
    const f = await fixture()
    f.setReadable(false)
    await expect(f.coordinator.startNew({ ...identity, transfer: false })).rejects.toThrow()
    const pending = await f.runs.load()
    expect(pending.activeRun).toEqual(f.prior)
    expect(pending.pendingTransition?.targetBinding?.threadId).toBe(f.prior.binding.threadId)
    f.setReadable(true)

    const retried = await f.coordinator.retry()

    expect(retried.activePractice?.runId).toBe(pending.pendingTransition?.targetRunId)
    expect((await f.runs.load()).activeRun?.binding.threadId).toBe(f.prior.binding.threadId)
    expect(f.calls.filter(({ method }) => method === 'thread/start')).toHaveLength(0)
    expect(f.calls.filter(({ method }) => method === 'turn/start')).toHaveLength(0)
    expect(retried.startPrompt).toContain(sourceCheckpoint)
  })

  it('keeps the same copyable contract available on repeated desktop-owned task opens', async () => {
    const f = await fixture()
    const started = await f.coordinator.startNew({ ...identity, transfer: false })
    const resumed = await f.coordinator.resume(identity)
    expect(resumed.startPrompt).toBe(started.startPrompt)
    expect(f.calls.filter(({ method }) => method === 'turn/start')).toHaveLength(0)
    expect(f.calls.filter(({ method }) => method === 'thread/start')).toHaveLength(0)
  })

  it('keeps a started release untouched when its continuation cannot be verified on resume', async () => {
    const f = await fixture()
    await f.coordinator.startNew({ ...identity, transfer: false })
    const saved = await f.runs.load()
    f.setHandoff(null)

    await expect(f.coordinator.resume(identity)).rejects.toThrow('Chưa thể tiếp tục task portfolio từ Module 3')

    expect(await f.runs.load()).toEqual(saved)
    expect(f.calls.filter(({ method }) => method === 'turn/start')).toHaveLength(0)
    expect(f.opened).toHaveLength(1)
  })

  it('fails closed when no verified input checkpoint is available for release instructions', () => {
    expect(() => portfolioReleaseInstructions()).toThrow('verified Module 3 source checkpoint')
    expect(() => portfolioReleaseInstructions('old-practice-name')).toThrow('verified Module 3 source checkpoint')
  })
})
