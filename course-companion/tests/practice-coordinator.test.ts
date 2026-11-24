import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { CodexRuntimeError } from '../electron/main/codex-runtime'
import { PracticeCoordinator } from '../electron/main/practice-coordinator'
import { PracticeDefinitionRepository } from '../electron/main/practice-definition-repository'
import { PracticeEvidenceAdapterRegistry } from '../electron/main/practice-evidence-adapter-registry'
import { planningPracticeStepIds } from '../electron/main/practice-step-state'
import type { PracticeEvidenceAdapter } from '../electron/main/practice-evidence-adapter'
import {
  defaultPracticeWorkspaceRecord,
  PracticeRunRepository,
  type ExecutorChatBinding,
  type PracticeWorkspaceRecord
} from '../electron/main/practice-run-repository'

const temporaryDirectories: string[] = []
const m1Identity = { practiceId: 'm1-codex-safe-setup', practiceVersion: '2.0.0' }
const m2Identity = { practiceId: 'm2-planning-package', practiceVersion: '2.0.0' }

async function temporaryDirectory(prefix: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), prefix))
  temporaryDirectories.push(directory)
  return directory
}

async function definitions(): Promise<PracticeDefinitionRepository> {
  const directory = await temporaryDirectory('course-companion-definitions-')
  const base = {
    schemaVersion: 2,
    version: '2.0.0',
    workspaceKind: 'pilot-workspace',
    checklist: [
      { id: 'open-task', title: 'Mở task' },
      { id: 'review', title: 'Duyệt bằng chứng', dependsOn: ['open-task'] }
    ],
    criteria: [{
      id: 'reviewed',
      description: 'Bằng chứng đã được duyệt.',
      required: true,
      checklistStepId: 'review',
      acceptedEvidence: ['teacher-assessment'],
      assertion: 'The current evidence was reviewed.',
      freshness: 'fresh'
    }]
  }
  const m1 = {
    ...base,
    practiceId: m1Identity.practiceId,
    title: 'Thiết lập Codex an toàn',
    version: m1Identity.practiceVersion,
    checkpointId: 'm1-setup-checklist',
    objective: 'Thiết lập Codex an toàn.',
    expectedOutcome: 'Năm thiết lập được xác nhận.',
    taskPolicy: 'inherit-configuration-only',
    evidenceProfile: 'codex-task-configuration',
    completionDestination: {
      lessonId: 'module-1',
      checkpointId: 'm1-mastery',
      sceneId: 'module-1-mastery',
      label: 'Phần tổng kết Module 1'
    }
  }
  const m2 = {
    ...base,
    practiceId: m2Identity.practiceId,
    title: 'Xây dựng planning package',
    version: m2Identity.practiceVersion,
    checkpointId: 'm2-planning-package',
    objective: 'Tạo planning package.',
    expectedOutcome: 'PRD và implementation plan đã duyệt.',
    taskPolicy: 'safe-workspace-write',
    evidenceProfile: 'planning-package',
    checklist: planningPracticeStepIds.map((id, index) => ({
      id,
      title: 'Bước ' + String(index + 1),
      dependsOn: index === 0 ? [] : [planningPracticeStepIds[index - 1]]
    })),
    criteria: [{
      id: 'package-reviewed',
      description: 'Planning package đã được duyệt.',
      required: true,
      checklistStepId: 'explain-scope-and-review',
      acceptedEvidence: ['teacher-assessment'],
      assertion: 'The current planning package was reviewed.',
      freshness: 'fresh'
    }],
    completionDestination: {
      lessonId: 'module-2',
      checkpointId: 'm2-mastery',
      sceneId: 'module-2-mastery',
      label: 'Bài kiểm tra và hoàn thành Module 2'
    }
  }
  await Promise.all([
    writeFile(join(directory, m1.practiceId + '.json'), JSON.stringify(m1), 'utf8'),
    writeFile(join(directory, m2.practiceId + '.json'), JSON.stringify(m2), 'utf8')
  ])
  return new PracticeDefinitionRepository(directory)
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))
  )
})

function harness(options: { failCreate?: boolean; failPrepare?: string } = {}) {
  const calls: string[] = []
  let created = 0
  const executor = {
    async createTarget(input: { runId: string }): Promise<ExecutorChatBinding> {
      const runId = input.runId
      calls.push('create:' + runId)
      if (options.failCreate) throw new Error('private runtime detail')
      created += 1
      return {
        runId,
        threadId: 'thread-' + created,
        name: 'Practice ' + created,
        workspaceRoot: 'D:\\course',
        createdAt: '2026-08-08T00:00:00.000Z'
      }
    },
    async prepareTarget(binding: ExecutorChatBinding): Promise<void> {
      calls.push('prepare-target:' + binding.threadId)
      if (options.failPrepare) throw new Error(options.failPrepare)
    },
    async openTarget(binding: ExecutorChatBinding): Promise<void> {
      calls.push('open:' + binding.threadId)
    }
  }
  const ids = ['transition-1', 'run-1', 'transition-2', 'run-2']
  return { calls, executor, createId: () => ids.shift() ?? 'fallback-id' }
}

describe('PracticeCoordinator', () => {
  it('reports an outdated CLI, retries the pending start, and resumes the same task after recovery', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory('practice-outdated-codex-'))
    const testHarness = harness()
    let outdated = true
    const coordinator = new PracticeCoordinator(repository, await definitions(), testHarness.executor,
      undefined, testHarness.createId, undefined, undefined, undefined, undefined, undefined, undefined,
      undefined, undefined, async () => {
        if (outdated) {
          throw new CodexRuntimeError({ status: 'outdated', source: 'codex-desktop', version: '0.147.0' })
        }
        return 'codex'
      })

    await expect(coordinator.startNew({ ...m1Identity, transfer: false })).rejects.toThrow('0.147.0')
    const blocked = await coordinator.loadWorkspace(m1Identity)
    expect(blocked.error).toContain('0.164.0')
    expect(blocked.transition?.canRetry).toBe(true)
    expect(testHarness.calls).toEqual([])

    outdated = false
    await coordinator.retry()
    const active = (await repository.load()).activeRun
    expect(active?.binding.threadId).toBe('thread-1')
    outdated = true
    await expect(coordinator.resume(m1Identity)).rejects.toThrow('0.147.0')
    expect((await coordinator.loadWorkspace(m1Identity)).error).toContain('0.164.0')
    outdated = false
    await coordinator.resume(m1Identity)
    expect((await repository.load()).activeRun?.binding.threadId).toBe('thread-1')
    expect(testHarness.calls).toEqual(['create:run-1', 'prepare-target:thread-1', 'open:thread-1', 'open:thread-1'])
  })

  it('reopens only the exact active task without preparing it or changing saved Practice state', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory('practice-open-task-'))
    const testHarness = harness()
    const coordinator = new PracticeCoordinator(repository, await definitions(), testHarness.executor,
      undefined, testHarness.createId, undefined, undefined, undefined, undefined, async (open) => {
        testHarness.calls.push('release-to-codex')
        await open()
      })
    await coordinator.startNew({ ...m1Identity, transfer: false })
    const before = await repository.load()
    testHarness.calls.length = 0
    await coordinator.openTask({ runId: before.activeRun!.runId, generation: before.activeRun!.generation })
    expect(testHarness.calls).toEqual(['release-to-codex', 'open:thread-1'])
    expect(await repository.load()).toEqual(before)

    await expect(coordinator.openTask({ runId: 'other-run', generation: before.activeRun!.generation })).rejects.toThrow('no longer matches')
    await expect(coordinator.openTask({ runId: before.activeRun!.runId, generation: before.activeRun!.generation + 1 })).rejects.toThrow('no longer matches')
    expect(testHarness.calls).toEqual(['release-to-codex', 'open:thread-1'])
  })

  it('keeps failed task opens retryable and refuses navigation while switching or without an active run', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory('practice-open-retry-'))
    const testHarness = harness()
    const coordinator = new PracticeCoordinator(repository, await definitions(), testHarness.executor,
      undefined, testHarness.createId)
    await expect(coordinator.openTask({ runId: 'run-1', generation: 1 })).rejects.toThrow('no longer matches')
    await coordinator.startNew({ ...m1Identity, transfer: false })
    const before = await repository.load()
    const target = { runId: before.activeRun!.runId, generation: before.activeRun!.generation }
    const open = testHarness.executor.openTarget
    testHarness.executor.openTarget = async () => { throw new Error('OS open failed') }
    await expect(coordinator.openTask(target)).rejects.toThrow('OS open failed')
    expect(await repository.load()).toEqual(before)
    testHarness.executor.openTarget = open
    await coordinator.openTask(target)
    await repository.save({ ...before, pendingTransition: {
      transitionId: 'pending-switch', sourceRunId: target.runId, targetRunId: 'new-run',
      ...m1Identity, stage: 'creating-target', startedAt: '2026-09-12T00:00:00.000Z'
    } })
    await expect(coordinator.openTask(target)).rejects.toThrow('no longer matches')
  })

  it('hands off ownership before every new and resumed Codex open without a pre-open observation', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory('practice-runs-'))
    const testHarness = harness()
    const handoff: string[] = []
    const coordinator = new PracticeCoordinator(
      repository,
      await definitions(),
      {
        ...testHarness.executor,
        async openTarget(binding: ExecutorChatBinding): Promise<void> {
          handoff.push('open:' + binding.threadId)
        }
      },
      () => new Date('2026-08-08T00:00:00.000Z'),
      testHarness.createId,
      async (binding) => { handoff.push('observe:' + binding.threadId) },
      undefined,
      undefined,
      undefined,
      async (openTarget) => {
        handoff.push('release')
        await openTarget()
      }
    )

    await coordinator.startNew({ ...m1Identity, transfer: false })
    await coordinator.resume(m1Identity)

    expect(handoff).toEqual([
      'release', 'open:thread-1',
      'release', 'open:thread-1'
    ])
  })

  it('preserves the active run and does not open Codex when ownership release fails', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory('practice-runs-'))
    const testHarness = harness()
    const coordinator = new PracticeCoordinator(
      repository,
      await definitions(),
      testHarness.executor,
      () => new Date('2026-08-08T00:00:00.000Z'),
      testHarness.createId,
      async () => undefined,
      undefined,
      undefined,
      undefined,
      async () => { throw new Error('ownership still held') }
    )

    await expect(coordinator.startNew({ ...m1Identity, transfer: false }))
      .rejects.toThrow('Task Codex đã được tạo nhưng chưa mở được')
    expect((await repository.load()).activeRun).toMatchObject({ runId: 'run-1' })
    expect(testHarness.calls).not.toContain('open:thread-1')
  })

  it('creates, resumes, and switches explicitly identified Practices', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory('practice-runs-'))
    const testHarness = harness()
    const coordinator = new PracticeCoordinator(
      repository,
      await definitions(),
      testHarness.executor,
      () => new Date('2026-08-08T00:00:00.000Z'),
      testHarness.createId
    )

    const first = await coordinator.startNew({ ...m1Identity, transfer: false })
    expect(first.activePractice).toMatchObject({ runId: 'run-1', ...m1Identity })
    expect(first.objective).toBe('Thiết lập Codex an toàn.')
    expect(first.checklist.map((step) => step.status)).toEqual(['current', 'pending'])

    await coordinator.resume(m1Identity)
    const second = await coordinator.startNew({ ...m2Identity, transfer: false })
    expect(second.activePractice).toMatchObject({ runId: 'run-2', ...m2Identity })
    expect(second.objective).toBe('Tạo planning package.')
    expect(second.review?.canReview).toBe(false)

    const stored = await repository.load()
    expect(stored.activeRun).toMatchObject({
      practiceId: 'm2-planning-package',
      taskPolicy: 'safe-workspace-write',
      evidenceProfile: 'planning-package'
    })
    expect(stored.archivedRuns).toEqual([
      expect.objectContaining({
        runId: 'run-1',
        practiceId: 'm1-codex-safe-setup',
        outcome: 'replaced'
      })
    ])
  })

  it('rejects selective transfer and identity-mismatched resume', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory('practice-runs-'))
    const testHarness = harness()
    const coordinator = new PracticeCoordinator(repository, await definitions(), testHarness.executor)

    await expect(coordinator.startNew({ ...m1Identity, transfer: true })).rejects.toMatchObject({
      code: 'SELECTIVE_TRANSFER_UNAVAILABLE'
    })
    await coordinator.startNew({ ...m1Identity, transfer: false })
    await expect(coordinator.resume(m2Identity)).rejects.toThrow('không khớp')
  })

  it('shows the requested Practice brief while another Practice remains active', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory('practice-runs-'))
    const testHarness = harness()
    const coordinator = new PracticeCoordinator(
      repository,
      await definitions(),
      testHarness.executor,
      () => new Date('2026-08-08T00:00:00.000Z'),
      testHarness.createId
    )
    await coordinator.startNew({ ...m1Identity, transfer: false })

    const brief = await coordinator.loadWorkspace(m2Identity)

    expect(brief).toMatchObject({
      phase: 'brief',
      title: 'Xây dựng planning package',
      objective: 'Tạo planning package.',
      completionDestination: { label: 'Bài kiểm tra và hoàn thành Module 2' },
      expectedOutcome: 'PRD và implementation plan đã duyệt.',
      activePractice: m1Identity,
      capabilities: { canStartNew: true, canResume: false },
      review: { status: 'not-reviewed', canReturn: false }
    })
    expect(brief.checklist.map((step) => step.status))
      .toEqual(['current', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending'])
    expect(brief.configuration).toBeUndefined()
    expect(brief.planning).toBeUndefined()
  })

  it('serializes overlapping operations without replacing a learner action with a refresh result', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory('practice-runs-'))
    const testHarness = harness()
    let releaseCreation: () => void = () => undefined
    const creationGate = new Promise<void>((resolve) => { releaseCreation = resolve })
    const coordinator = new PracticeCoordinator(
      repository,
      await definitions(),
      {
        ...testHarness.executor,
        async createTarget(input: { runId: string }) {
          await creationGate
          return testHarness.executor.createTarget(input)
        }
      },
      () => new Date('2026-08-08T00:00:00.000Z'),
      testHarness.createId
    )

    const starting = coordinator.startNew({ ...m1Identity, transfer: false })
    const loadingRequestedBrief = coordinator.loadWorkspace(m2Identity)
    releaseCreation()

    await expect(starting).resolves.toMatchObject({ activePractice: m1Identity })
    await expect(loadingRequestedBrief).resolves.toMatchObject({
      phase: 'brief',
      title: 'Xây dựng planning package',
      objective: 'Tạo planning package.',
      activePractice: m1Identity
    })
  })

  it('captures the Module 2 workspace baseline before sending its first instruction', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory('practice-runs-'))
    const testHarness = harness()
    const coordinator = new PracticeCoordinator(
      repository,
      await definitions(),
      testHarness.executor,
      () => new Date('2026-08-08T00:00:00.000Z'),
      testHarness.createId,
      async (binding, captureBaseline) => {
        testHarness.calls.push(
          'observe:' + binding.threadId + ':' + String(captureBaseline)
        )
      }
    )

    await coordinator.startNew({ ...m2Identity, transfer: false })

    expect(testHarness.calls).toEqual([
      'create:run-1',
      'observe:thread-1:true',
      'prepare-target:thread-1',
      'open:thread-1'
    ])
  })

  it('keeps the active run authoritative when replacement creation fails', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory('practice-runs-'))
    const firstHarness = harness()
    const definitionRepository = await definitions()
    const first = new PracticeCoordinator(repository, definitionRepository, firstHarness.executor)
    await first.startNew({ ...m1Identity, transfer: false })

    const failing = new PracticeCoordinator(
      repository,
      definitionRepository,
      harness({ failCreate: true }).executor
    )
    await expect(failing.startNew({ ...m2Identity, transfer: false }))
      .rejects.toThrow('Không thể tạo task Codex mới')
    expect((await repository.load()).activeRun?.practiceId).toBe('m1-codex-safe-setup')
    await expect(failing.cancel()).resolves.toMatchObject({
      activePractice: { practiceId: 'm1-codex-safe-setup' }
    })
  })

  it('records bounded planning actions only for the current run and current activity cursor', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory('practice-runs-'))
    const testHarness = harness()
    const adapter = (evidenceProfile: PracticeEvidenceAdapter['evidenceProfile']): PracticeEvidenceAdapter => ({
      evidenceProfile,
      async collect(context) {
        return {
          schemaVersion: 1,
          practiceId: context.definition.practiceId,
          practiceVersion: context.definition.version,
          runId: context.runId,
          evidenceProfile,
          observedAt: '2026-08-08T00:01:00.000Z',
          freshness: 'unverifiable',
          sourceDigest: 'a'.repeat(64),
          evidence: [],
          steps: [],
          invalidations: [],
          ...(evidenceProfile === 'planning-package'
            ? {
                planningArtifacts: [],
                artifactIssues: [],
                unexpectedChangedPaths: [],
                planningActivity: {
                  schemaVersion: 1 as const,
                  cursor: 'cursor-current',
                  observedAt: '2026-08-08T00:01:00.000Z',
                  learnerTurnCount: 2,
                  executorTurnCount: 1,
                  prdPrompt: {
                    text: 'Hãy phỏng vấn tôi từng câu để tạo PRD cho ContentPilot.',
                    digest: 'b'.repeat(64)
                  }
                }
              }
            : {})
        }
      }
    })
    const coordinator = new PracticeCoordinator(
      repository,
      await definitions(),
      testHarness.executor,
      () => new Date('2026-08-08T00:02:00.000Z'),
      testHarness.createId,
      async () => undefined,
      undefined,
      new PracticeEvidenceAdapterRegistry([
        adapter('codex-task-configuration'),
        adapter('planning-package'),
        adapter('portfolio-planning')
      ])
    )
    await coordinator.startNew({ ...m2Identity, transfer: false })

    const updated = await coordinator.recordPlanningAction({
      runId: 'run-1',
      generation: 1,
      ...m2Identity,
      action: {
        type: 'capture-prd-prompt',
        expectedActivityCursor: 'cursor-current'
      }
    })
    expect(updated.checklist.slice(0, 2).map((step) => step.status))
      .toEqual(['completed', 'current'])
    expect(updated.planning).toMatchObject({
      freshness: 'unverifiable',
      alignment: 'pending',
      actionContext: {
        generation: 1,
        activityCursor: 'cursor-current'
      }
    })
    expect(updated.planning?.artifacts.map((artifact) => artifact.availability))
      .toEqual(['missing', 'missing'])
    expect((await repository.load()).activeRun?.learnerDecisions['prd-prompt'])
      .toContain('ContentPilot')

    await expect(coordinator.recordPlanningAction({
      runId: 'run-1',
      generation: 2,
      ...m2Identity,
      action: {
        type: 'complete-interview',
        expectedActivityCursor: 'cursor-current'
      }
    })).rejects.toThrow('active run')
  })

  it('projects bounded planning status without exposing artifact contents or digests', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory('practice-runs-'))
    const testHarness = harness()
    const coordinator = new PracticeCoordinator(
      repository,
      await definitions(),
      testHarness.executor,
      () => new Date('2026-08-08T00:02:00.000Z'),
      testHarness.createId
    )
    await coordinator.startNew({ ...m2Identity, transfer: false })
    const record = await repository.load()
    const active = record.activeRun!
    const prdDigest = 'a'.repeat(64)
    const planDigest = 'b'.repeat(64)
    await repository.save({
      ...record,
      activeRun: {
        ...active,
        learnerDecisions: { 'alignment-confirmed': `${prdDigest}:${planDigest}` },
        learnerApprovals: {
          'prd-approval': {
            decision: 'approved',
            recordedAt: '2026-08-08T00:01:00.000Z',
            artifactDigests: { 'artifacts/PRD.md': prdDigest }
          },
          'plan-approval': {
            decision: 'approved',
            recordedAt: '2026-08-08T00:01:00.000Z',
            artifactDigests: {
              'artifacts/PRD.md': prdDigest,
              'artifacts/implementation-plan.md': planDigest
            }
          }
        },
        invalidations: [{
          changedInput: 'artifacts/PRD.md',
          affectedStepIds: ['reconcile-alignment', 'approve-plan'],
          reason: 'PRD vừa thay đổi.',
          nextAction: 'Cập nhật plan rồi đối chiếu lại.'
        }],
        evidence: {
          schemaVersion: 1,
          practiceId: m2Identity.practiceId,
          practiceVersion: m2Identity.practiceVersion,
          runId: active.runId,
          evidenceProfile: 'planning-package',
          observedAt: '2026-08-08T00:01:00.000Z',
          freshness: 'fresh',
          sourceDigest: 'c'.repeat(64),
          evidence: [],
          steps: [],
          invalidations: [],
          planningArtifacts: [
            {
              schemaVersion: 1,
              path: 'artifacts/PRD.md',
              content: 'PRIVATE PRD CONTENT',
              digest: prdDigest,
              byteLength: 19,
              modifiedAt: '2026-08-08T00:01:00.000Z',
              observedAt: '2026-08-08T00:01:00.000Z'
            },
            {
              schemaVersion: 1,
              path: 'artifacts/implementation-plan.md',
              content: 'PRIVATE PLAN CONTENT',
              digest: planDigest,
              byteLength: 20,
              modifiedAt: '2026-08-08T00:01:00.000Z',
              observedAt: '2026-08-08T00:01:00.000Z'
            }
          ],
          artifactIssues: [],
          unexpectedChangedPaths: ['src/unexpected.ts'],
          planningActivity: {
            schemaVersion: 1,
            cursor: 'cursor-current',
            observedAt: '2026-08-08T00:01:00.000Z',
            learnerTurnCount: 3,
            executorTurnCount: 3,
            prdPrompt: null
          }
        }
      }
    })

    const view = await coordinator.loadWorkspace(m2Identity)
    expect(view.planning).toMatchObject({
      freshness: 'fresh',
      alignment: 'stale',
      unexpectedChangedPaths: ['src/unexpected.ts'],
      artifacts: [
        { path: 'artifacts/PRD.md', availability: 'available', approval: 'approved' },
        { path: 'artifacts/implementation-plan.md', availability: 'available', approval: 'approved' }
      ]
    })
    expect(view.planning?.invalidations[0]).toMatchObject({
      changedInput: 'artifacts/PRD.md',
      affectedStepIds: ['reconcile-alignment', 'approve-plan'],
      nextAction: 'Cập nhật plan rồi đối chiếu lại.'
    })
    expect(JSON.stringify(view.planning)).not.toContain('PRIVATE PRD CONTENT')
    expect(JSON.stringify(view.planning?.artifacts)).not.toContain(prdDigest)
    expect(view.planning?.artifacts[0]).not.toHaveProperty('content')
  })

  it('keeps stored Module 2 status visible when live evidence refresh disconnects', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory('practice-runs-'))
    const testHarness = harness()
    const failingAdapter = (evidenceProfile: PracticeEvidenceAdapter['evidenceProfile']): PracticeEvidenceAdapter => ({
      evidenceProfile,
      async collect() {
        throw new Error('disconnected')
      }
    })
    const coordinator = new PracticeCoordinator(
      repository,
      await definitions(),
      testHarness.executor,
      () => new Date('2026-08-08T00:02:00.000Z'),
      testHarness.createId,
      async () => undefined,
      undefined,
      new PracticeEvidenceAdapterRegistry([
        failingAdapter('codex-task-configuration'),
        failingAdapter('planning-package'),
        failingAdapter('portfolio-planning')
      ])
    )
    await coordinator.startNew({ ...m2Identity, transfer: false })

    await expect(coordinator.loadWorkspace(m2Identity)).resolves.toMatchObject({
      phase: 'active',
      activePractice: m2Identity,
      error: expect.stringContaining('Trạng thái đã lưu vẫn được giữ')
    })
  })

  it('recovers a durable target-created transition without duplicate creation', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory('practice-runs-'))
    const record: PracticeWorkspaceRecord = {
      ...defaultPracticeWorkspaceRecord(),
      pendingTransition: {
        transitionId: 'transition-1',
        sourceRunId: null,
        targetRunId: 'run-1',
        ...m1Identity,
        stage: 'target-created',
        targetBinding: {
          runId: 'run-1',
          threadId: 'thread-1',
          name: 'Practice 1',
          workspaceRoot: 'D:\\course',
          createdAt: '2026-08-08T00:00:00.000Z'
        },
        startedAt: '2026-08-08T00:00:00.000Z'
      }
    }
    await repository.save(record)
    const testHarness = harness()
    const coordinator = new PracticeCoordinator(
      repository,
      await definitions(),
      testHarness.executor,
      () => new Date('2026-08-08T00:01:00.000Z')
    )

    const recovered = await coordinator.retry()
    expect(recovered.activePractice).toMatchObject({ runId: 'run-1', ...m1Identity })
    expect(testHarness.calls).toEqual(['prepare-target:thread-1', 'open:thread-1'])
  })

  it('fails before task creation for unknown IDs or version mismatches', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory('practice-runs-'))
    const testHarness = harness()
    const coordinator = new PracticeCoordinator(repository, await definitions(), testHarness.executor)

    await expect(coordinator.startNew({
      practiceId: 'unknown-practice',
      practiceVersion: '2.0.0',
      transfer: false
    })).rejects.toThrow()
    await expect(coordinator.startNew({
      practiceId: 'm1-codex-safe-setup',
      practiceVersion: '9.0.0',
      transfer: false
    })).rejects.toThrow('version mismatch')
    expect(testHarness.calls).toEqual([])
  })
})
