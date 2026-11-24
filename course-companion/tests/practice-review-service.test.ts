import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type {
  CodexTaskConfigurationSnapshot,
  ExecutorActivitySnapshot
} from '../shared/contracts'
import { PracticeCoordinator } from '../electron/main/practice-coordinator'
import { PracticeDefinitionRepository } from '../electron/main/practice-definition-repository'
import { DeterministicPracticeReviewEvaluator } from '../electron/main/practice-review-evaluator'
import { PracticeReviewService } from '../electron/main/practice-review-service'
import {
  defaultPracticeWorkspaceRecord,
  PracticeRunRepository
} from '../electron/main/practice-run-repository'
import { ProgressRepository } from '../electron/main/progress-repository'

const directories: string[] = []
const timestamp = '2026-08-09T00:00:00.000Z'

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })))
})

function configuration(
  overrides: Partial<CodexTaskConfigurationSnapshot> = {}
): CodexTaskConfigurationSnapshot {
  return {
    schemaVersion: 1,
    runId: 'run-1',
    threadId: 'thread-1',
    source: 'thread-resume',
    eventTimestampMs: 1,
    observedAt: timestamp,
    freshness: 'fresh',
    connection: 'connected',
    model: { protocolValue: 'gpt-5.6-sol', label: '5.6 Sol' },
    reasoningEffort: { protocolValue: 'high', label: 'High' },
    serviceTier: { protocolValue: 'standard', label: 'Standard' },
    approvalPolicy: { protocolValue: 'on-request', label: 'Approve for me' },
    fullAccess: { protocolValue: 'off', label: 'Off' },
    sandboxType: 'workspaceWrite',
    activePermissionProfile: null,
    ...overrides
  }
}

function activity(config: CodexTaskConfigurationSnapshot | null): ExecutorActivitySnapshot {
  return {
    schemaVersion: 1,
    runId: 'run-1',
    threadId: 'thread-1',
    status: config?.connection === 'disconnected' ? 'disconnected' : 'ready',
    cursor: '',
    learnerPrompts: [],
    executorResponses: [],
    approvalEvents: [],
    changedFiles: [],
    verificationEvidence: [],
    reportedChangedFiles: [],
    reportedVerificationEvidence: [],
    workspaceConfirmedChangedFiles: [],
    workspaceCommittedReportedFilesSinceRunStart: [],
    workspaceCurrentlyDirtyReportedFiles: [],
    observedAt: timestamp,
    workspaceBaseline: null,
    configuration: config
  }
}

async function harness(
  initial: CodexTaskConfigurationSnapshot | null = configuration()
) {
  const directory = await mkdtemp(join(tmpdir(), 'course-companion-m1-review-'))
  directories.push(directory)
  const definitions = new PracticeDefinitionRepository(join(process.cwd(), 'content', 'practices'))
  const definition = await definitions.load('m1-codex-safe-setup', '2.0.0')
  const runs = new PracticeRunRepository(directory)
  const progress = new ProgressRepository(directory, () => new Date(timestamp))
  await progress.save({
    currentLessonId: 'module-1',
    currentCourseLessonId: 'm1-assessment',
    checkpointId: 'm1-setup-checklist',
    sceneId: 'module-1-setup-checklist',
    sceneHistory: [],
    completedCheckpointIds: ['m1-codex-orientation'],
    decisions: {}
  })
  const binding = {
    runId: 'run-1',
    threadId: 'thread-1',
    name: 'Practice · Module 1',
    workspaceRoot: directory,
    createdAt: timestamp
  }
  await runs.save({
    ...defaultPracticeWorkspaceRecord(),
    activeRun: {
      runId: 'run-1',
      generation: 1,
      status: 'active',
      practiceId: definition.practiceId,
      practiceVersion: definition.version,
      workspaceKind: definition.workspaceKind,
      taskPolicy: definition.taskPolicy,
      evidenceProfile: definition.evidenceProfile,
      binding,
      startedAt: timestamp,
      updatedAt: timestamp,
      checklist: definition.checklist.map((step, index) => ({
        id: step.id,
        title: step.title,
        status: index === 0 ? 'current' : 'pending'
      })),
      learnerDecisions: {},
      learnerApprovals: {},
      evidence: null,
      invalidations: [],
      reviewStatus: 'not-reviewed'
    }
  })
  let current: ExecutorActivitySnapshot = activity(initial)
  let currentTime = timestamp
  let releases = 0
  let reads = 0
  let configurationAfterFirstRead: CodexTaskConfigurationSnapshot | null | undefined
  const observer = {
    async read() {
      reads += 1
      if (reads > 1 && configurationAfterFirstRead !== undefined) {
        current = activity(configurationAfterFirstRead)
      }
      return structuredClone(current)
    }
  }
  const coordinator = new PracticeCoordinator(
    runs,
    definitions,
    {
      async createTarget() { throw new Error('not used') },
      async prepareTarget() { throw new Error('not used') },
      async openTarget() { throw new Error('not used') }
    }
  )
  const createService = () => new PracticeReviewService(
      definitions,
      runs,
      coordinator,
      progress,
      observer,
      new DeterministicPracticeReviewEvaluator(),
      () => new Date(currentTime),
      undefined,
      async () => { releases += 1 }
    )
  const service = createService()
  return {
    progress,
    runs,
    service,
    restartService: createService,
    releaseCount() { return releases },
    advanceClock() {
      currentTime = '2026-08-09T00:01:00.000Z'
    },
    setConfiguration(value: CodexTaskConfigurationSnapshot | null) {
      reads = 0
      configurationAfterFirstRead = undefined
      current = activity(value)
    },
    changeConfigurationDuringReview(value: CodexTaskConfigurationSnapshot | null) {
      reads = 0
      configurationAfterFirstRead = value
    },
    setActivityStatus(status: ExecutorActivitySnapshot['status']) {
      current = { ...current, status }
    }
  }
}

describe('Module 1 Practice review service', () => {
  it('passes only all three required fresh values and persists the observed task configuration', async () => {
    const { progress, runs, service, releaseCount } = await harness()

    const response = await service.review()

    expect(Object.keys(response)).toEqual(['workspace'])
    expect(response.workspace.review).toMatchObject({ status: 'passed', canReturn: true })
    expect(response.workspace.checklist.every((step) => step.status === 'completed')).toBe(true)
    expect(releaseCount()).toBe(1)
    const receipt = await service.passedCompletion()
    expect(receipt).toMatchObject({
      practiceId: 'm1-codex-safe-setup',
      checkpointId: 'm1-setup-checklist',
      destination: { checkpointId: 'm1-mastery', sceneId: 'module-1-mastery' },
      approvedConfiguration: {
        model: 'gpt-5.6-sol',
        reasoningEffort: 'high'
      }
    })
    expect((await progress.load()).status).toBe('returning')
    expect((await runs.load()).activeRun).toMatchObject({
      reviewStatus: 'passed',
      binding: { configuration: configuration() }
    })
  })

  it.each([
    ['Effort', { reasoningEffort: { protocolValue: 'low', label: 'Low' } }],
    ['Approval', { approvalPolicy: { protocolValue: 'never', label: 'Never' } }],
    ['Full access', { fullAccess: { protocolValue: 'on', label: 'On' } }]
  ])('rejects a %s mismatch and gives exactly one next settings action', async (
    label,
    overrides
  ) => {
    const { service } = await harness(configuration(overrides))

    const response = await service.review()

    expect(response.workspace.review).toMatchObject({ status: 'needs-work', canReturn: false })
    expect(response.workspace.review?.result?.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ explanation: expect.stringContaining(label) })
    ]))
    await expect(service.passedCompletion()).rejects.toThrow()
  })

  it.each([{ protocolValue: 'priority', label: 'Fast' }, { protocolValue: null, label: null }])(
    'passes with an unassessed service tier %j', async (serviceTier) => {
      const { service } = await harness(configuration({ serviceTier }))
      const { workspace } = await service.review()
      expect(workspace.review?.status).toBe('passed')
      expect(workspace.review?.result?.criteria.map(item => item.criterionId))
        .toEqual(['effort-matches', 'approval-matches', 'full-access-off'])
      expect((await service.passedCompletion()).approvedConfiguration).not.toHaveProperty('serviceTier')
    })

  it('credits Approval and Full access when only Effort is unset', async () => {
    const { service } = await harness(configuration({ reasoningEffort: { protocolValue: null, label: null } }))
    const { workspace } = await service.review()
    expect(workspace.review).toMatchObject({ status: 'needs-work', canReturn: false })
    expect(workspace.review?.result?.criteria.map(c => c.status)).toEqual(['unverifiable', 'satisfied', 'satisfied'])
    expect(workspace.checklist.map(step => step.status)).toEqual(['current', 'completed', 'completed'])
  })

  it('preserves Medium in the approved configuration for the next module', async () => {
    const { service } = await harness(configuration({ reasoningEffort: { protocolValue: 'medium', label: 'Medium' } }))
    const response = await service.review()
    expect(response.workspace.review?.status).toBe('passed')
    expect((await service.passedCompletion()).approvedConfiguration?.reasoningEffort).toBe('medium')
  })

  it.each(['gpt-5.6-terra', 'gpt-6-astra', 'another-model', null])('accepts model %s without weakening the other checks', async (model) => {
    const { service } = await harness(configuration({ model: { protocolValue: model, label: model } }))
    const response = await service.review()
    expect(response.workspace.review?.status).toBe('passed')
    expect(response.workspace.review?.result?.criteria).toHaveLength(3)
    const receipt = await service.passedCompletion()
    expect(receipt.approvedConfiguration?.model).toBe(model ?? undefined)
  })

  it.each([
    ['missing', null],
    ['stale', configuration({ freshness: 'stale' })],
    ['disconnected', configuration({ freshness: 'stale', connection: 'disconnected' })],
    ['unknown', configuration({
      model: { protocolValue: null, label: null },
      freshness: 'unverifiable'
    })]
  ])('rejects %s configuration evidence', async (_label, value) => {
    const { service } = await harness(value)
    await expect(service.review()).resolves.toMatchObject({
      workspace: { review: { status: 'needs-work', canReturn: false } }
    })
  })

  it('passes after reconnect and keeps review, receipt, and return idempotent', async () => {
    const disconnected = configuration({ freshness: 'stale', connection: 'disconnected' })
    const { progress, runs, service, restartService, setConfiguration } = await harness(disconnected)
    expect((await service.review()).workspace.review).toMatchObject({ status: 'needs-work' })

    setConfiguration(configuration({ eventTimestampMs: 2 }))
    expect((await service.review()).workspace.review).toMatchObject({ status: 'passed' })
    const receipt = await service.passedCompletion()
    await expect(restartService().passedCompletion()).resolves.toEqual(receipt)
    await expect(service.review()).resolves.toMatchObject({
      workspace: { review: { status: 'passed' } }
    })
    expect((await progress.load()).status).toBe('returning')
    await expect(service.returnPassedPractice()).resolves.toEqual(receipt)
    await expect(service.returnPassedPractice()).resolves.toEqual(receipt)
    const closed = await runs.load()
    expect(closed.activeRun).toBeNull()
    expect(closed.archivedRuns.at(-1)).toMatchObject({
      runId: receipt.runId,
      outcome: 'completed'
    })
  })

  it('refreshes evidence and blocks return when configuration changed after a pass', async () => {
    const { progress, runs, service, setConfiguration } = await harness()
    await expect(service.review()).resolves.toMatchObject({
      workspace: { review: { status: 'passed' } }
    })

    setConfiguration(configuration({
      eventTimestampMs: 2,
      reasoningEffort: { protocolValue: 'low', label: 'Low' }
    }))
    await expect(service.returnPassedPractice()).rejects.toThrow('chưa được Triết xác nhận')

    const activeRun = (await runs.load()).activeRun
    expect(activeRun?.reviewStatus).toBe('needs-work')
    expect(activeRun).not.toHaveProperty('completion')
    const loadedProgress = await progress.load()
    expect(loadedProgress.status).toBe('returning')
    if (loadedProgress.status === 'returning' || loadedProgress.status === 'recovered') {
      expect(loadedProgress.progress.practiceCompletions).toEqual([])
      expect(loadedProgress.progress.checkpointId).toBe('m1-setup-checklist')
    }
  })

  it('rejects a configuration change between observation and persistence', async () => {
    const { runs, service, changeConfigurationDuringReview } = await harness()
    changeConfigurationDuringReview(configuration({
      eventTimestampMs: 2,
      reasoningEffort: { protocolValue: 'low', label: 'Low' }
    }))

    await expect(service.review()).rejects.toThrow('PRACTICE_EVIDENCE_CHANGED')
    expect((await runs.load()).activeRun).toMatchObject({ reviewStatus: 'not-reviewed' })
  })

  it('does not review while the exact Practice task is still working', async () => {
    const { runs, service, setActivityStatus } = await harness()
    setActivityStatus('working')

    await expect(service.review()).rejects.toThrow('PRACTICE_SNAPSHOT_BUSY')
    expect((await runs.load()).activeRun).toMatchObject({ reviewStatus: 'not-reviewed' })
  })

  it('returns a still-passed Practice when the review clock has advanced', async () => {
    const { progress, runs, service, advanceClock } = await harness()
    await service.review()
    const original = await service.passedCompletion()
    advanceClock()

    await expect(service.returnPassedPractice()).resolves.toEqual(original)
    await expect(progress.load()).resolves.toMatchObject({
      progress: { sceneId: 'module-1-mastery', checkpointId: 'm1-mastery' }
    })
    expect((await runs.load()).activeRun).toBeNull()
  })

  it('replaces a stale receipt when changed evidence still passes', async () => {
    const { progress, service, advanceClock, setConfiguration } = await harness()
    await service.review()
    const original = await service.passedCompletion()
    advanceClock()
    setConfiguration(configuration({
      eventTimestampMs: 2,
      observedAt: '2026-08-09T00:01:00.000Z'
    }))

    const returned = await service.returnPassedPractice()
    expect(returned.destination.sceneId).toBe('module-1-mastery')
    const loaded = await progress.load()
    expect(loaded).toMatchObject({ progress: { sceneId: 'module-1-mastery' } })
    if (loaded.status === 'returning' || loaded.status === 'recovered') {
      expect(loaded.progress.practiceCompletions).toContainEqual(returned)
      expect(loaded.progress.practiceCompletions).not.toContainEqual(original)
    }
  })
})
