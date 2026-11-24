import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  defaultPracticeWorkspaceRecord,
  practiceWorkspaceIdentityDigest,
  PracticeRunRepository,
  type PracticeRunRecord,
  type PracticeWorkspaceRecord
} from '../electron/main/practice-run-repository'
import { planningPracticeStepIds } from '../electron/main/practice-step-state'

const temporaryDirectories: string[] = []

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'course-companion-practice-runs-'))
  temporaryDirectories.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))
  )
})

function activeRun(overrides: Partial<PracticeRunRecord> = {}): PracticeRunRecord {
  return {
    runId: 'run-1',
    generation: 1,
    status: 'active',
    practiceId: 'm1-codex-safe-setup',
    practiceVersion: '2.0.0',
    workspaceKind: 'pilot-workspace',
    taskPolicy: 'inherit-configuration-only',
    evidenceProfile: 'codex-task-configuration',
    binding: {
      runId: 'run-1',
      threadId: 'thread-1',
      name: 'Practice · Thiết lập Codex',
      workspaceRoot: 'D:\\course',
      createdAt: '2026-08-08T00:00:00.000Z'
    },
    startedAt: '2026-08-08T00:00:00.000Z',
    updatedAt: '2026-08-08T00:00:00.000Z',
    checklist: [
      { id: 'open-task', title: 'Mở task', status: 'current', dependencyInputs: {} },
      { id: 'review-settings', title: 'Duyệt cấu hình', status: 'pending', dependencyInputs: {} }
    ],
    learnerDecisions: {},
    learnerApprovals: {},
    evidence: null,
    invalidations: [],
    reviewHistory: [],
    reviewStatus: 'not-reviewed',
    ...overrides
  }
}

function activeRecord(run = activeRun()): PracticeWorkspaceRecord {
  return { ...defaultPracticeWorkspaceRecord(), activeRun: run }
}

describe('PracticeRunRepository', () => {
  it('resumes a four-setting setup attempt without its retired speed step or correction', async () => {
    const directory = await temporaryDirectory()
    const run = activeRun()
    run.checklist = [
      { id: 'set-effort', title: 'Effort', status: 'completed' },
      { id: 'set-speed', title: 'Speed Standard', status: 'current' },
      { id: 'set-approval', title: 'Approval', status: 'pending' },
      { id: 'disable-full-access', title: 'Full access', status: 'pending' }
    ]
    run.reviewStatus = 'needs-work'
    run.reviewResult = {
      schemaVersion: 1, practiceId: run.practiceId, practiceVersion: run.practiceVersion, runId: run.runId,
      verdict: 'needs-work', criteria: [], summary: 'Speed Standard', reviewedAt: run.updatedAt, sourceDigest: 'a'.repeat(64)
    }
    run.reviewHistory = [run.reviewResult]
    await writeFile(join(directory, 'practice-runs.json'), JSON.stringify(activeRecord(run)))
    const loaded = (await new PracticeRunRepository(directory).load()).activeRun
    expect(loaded?.checklist.map(step => step.id)).toEqual(['set-effort', 'set-approval', 'disable-full-access'])
    expect(loaded?.checklist[1]?.status).toBe('current')
    expect(loaded?.reviewStatus).toBe('not-reviewed')
    expect(loaded?.reviewResult).toBeUndefined()
    expect(loaded?.reviewHistory).toEqual(run.reviewHistory)
    expect(loaded?.binding).toEqual(run.binding)
  })

  it('persists a schema-2 run with explicit identity and policy fields', async () => {
    const directory = await temporaryDirectory()
    const repository = new PracticeRunRepository(directory)
    const record = activeRecord()

    await expect(repository.save(record)).resolves.toEqual(record)
    await expect(repository.load()).resolves.toEqual(record)
    expect(JSON.parse(await readFile(join(directory, 'practice-runs.json'), 'utf8'))).toEqual(record)
  })

  it('persists ordered Module 3 build slice receipts across a repository relaunch', async () => {
    const directory = await temporaryDirectory()
    const workspace = await temporaryDirectory()
    const repository = new PracticeRunRepository(directory)
    const identity = { runId: 'run-build', generation: 1, practiceId: 'm3-portfolio-build', practiceVersion: '1.0.0' }
    const workspaceIdentity = practiceWorkspaceIdentityDigest(workspace)
    const scaffoldDigests = {
      'planning/PRD.md': 'a'.repeat(64),
      'planning/implementation-plan.md': 'b'.repeat(64),
      'evidence/module-3/scaffold-report.md': 'c'.repeat(64)
    }
    const scaffold = {
      schemaVersion: 1 as const, courseRunId: 'course-1', ...identity,
      stageId: 'scaffold-baseline', stageIndex: 1 as const,
      workspace: { canonicalPath: workspace, identityDigest: workspaceIdentity },
      artifactDigests: scaffoldDigests,
      approval: { approvedAt: '2026-08-15T00:00:00.000Z', artifactDigests: scaffoldDigests },
      evidence: { executorReportedChecks: ['npm run check passed'], corroboratedArtifacts: scaffoldDigests },
      status: 'completed' as const, freshness: 'current' as const, observedAt: '2026-08-15T00:00:00.000Z'
    }
    await repository.save(activeRecord(activeRun({
      ...identity,
      workspaceKind: 'learner-portfolio', taskPolicy: 'safe-workspace-write', evidenceProfile: 'portfolio-build',
      binding: { runId: identity.runId, threadId: 'thread-build', name: 'Practice build', workspaceRoot: workspace, createdAt: '2026-08-15T00:00:00.000Z' },
      checklist: [
        { id: 'scaffold-baseline', title: 'Scaffold', status: 'completed', dependencyInputs: {} },
        { id: 'complete-first-version', title: 'Build', status: 'current', dependencyInputs: {} },
        { id: 'whole-page-revision', title: 'Revision', status: 'pending', dependencyInputs: {} },
        { id: 'evidence-debugging', title: 'Debug', status: 'pending', dependencyInputs: {} },
        { id: 'independent-enhancement', title: 'Enhancement', status: 'pending', dependencyInputs: {} }
      ],
      stageReceipts: [scaffold], buildSliceReceipts: []
    })))
    const saveSlice = async (sliceId: 'foundation-hero' | 'selected-work', sliceIndex: 1 | 2) => {
      const artifactDigests = {
        'planning/PRD.md': 'a'.repeat(64),
        'evidence/module-3/design-direction.md': 'd'.repeat(64),
        [`evidence/module-3/build-log.${sliceId}`]: String(sliceIndex).repeat(64)
      }
      return repository.saveBuildSliceReceipt({
        ...identity,
        updatedAt: `2026-08-15T00:0${sliceIndex}:00.000Z`,
        receipt: {
          schemaVersion: 1, courseRunId: 'course-1', ...identity,
          stageId: 'complete-first-version', stageIndex: 2, sliceId, sliceIndex,
          workspace: { canonicalPath: workspace, identityDigest: workspaceIdentity }, artifactDigests,
          approval: { approvedAt: `2026-08-15T00:0${sliceIndex}:00.000Z`, artifactDigests },
          evidence: { executorReportedChecks: ['npm run check passed'], corroboratedArtifacts: artifactDigests },
          status: 'completed', freshness: 'current', observedAt: `2026-08-15T00:0${sliceIndex}:00.000Z`
        }
      })
    }
    await saveSlice('foundation-hero', 1)
    await saveSlice('selected-work', 2)
    await expect(new PracticeRunRepository(directory).load()).resolves.toMatchObject({
      activeRun: { buildSliceReceipts: [{ sliceId: 'foundation-hero' }, { sliceId: 'selected-work' }] }
    })
  })

  it('archives a historical schema-1 active run instead of reinterpreting it', async () => {
    const directory = await temporaryDirectory()
    const historical = {
      schemaVersion: 1,
      activeRun: {
        runId: 'old-run',
        generation: 3,
        practiceId: 'm1-verifiable-brief',
        practiceVersion: '1.0.0',
        binding: {
          runId: 'old-run',
          threadId: 'old-thread',
          name: 'Historical CSS Practice',
          workspaceRoot: 'D:\\course',
          createdAt: '2026-08-01T00:00:00.000Z'
        }
      },
      archivedRuns: [],
      pendingTransition: null,
      presentation: { fullPanel: 'progress', compactPanel: 'teacher' }
    }
    await writeFile(join(directory, 'practice-runs.json'), JSON.stringify(historical), 'utf8')

    const migrated = await new PracticeRunRepository(directory).load()

    expect(migrated.schemaVersion).toBe(2)
    expect(migrated.activeRun).toBeNull()
    expect(migrated.archivedRuns).toEqual([
      expect.objectContaining({
        runId: 'old-run',
        practiceId: 'm1-verifiable-brief',
        outcome: 'historical'
      })
    ])
    expect(migrated.presentation).toEqual({ fullPanel: 'progress', compactPanel: 'teacher' })
  })

  it('rejects unsafe policy/profile combinations and mismatched bindings', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory())
    const unsafe = activeRecord(activeRun({
      taskPolicy: 'safe-workspace-write',
      binding: { ...activeRun().binding, runId: 'another-run' }
    }))

    await expect(repository.save(unsafe)).rejects.toThrow('Invalid Practice workspace record')
  })

  it('guards checklist and learner-decision writes by run, generation, Practice, and version', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory())
    await repository.save(activeRecord())
    const identity = {
      runId: 'run-1',
      generation: 1,
      practiceId: 'm1-codex-safe-setup',
      practiceVersion: '2.0.0'
    }

    const decided = await repository.saveLearnerDecision({
      ...identity,
      key: 'configuration-review',
      value: 'reviewed',
      updatedAt: '2026-08-08T00:01:00.000Z'
    })
    expect(decided.activeRun?.learnerDecisions).toEqual({ 'configuration-review': 'reviewed' })

    const stale = await repository.advanceChecklist({
      ...identity,
      generation: 2,
      currentStepId: 'review-settings',
      updatedAt: '2026-08-08T00:02:00.000Z'
    })
    expect(stale.activeRun?.checklist[0]?.status).toBe('current')

    const advanced = await repository.advanceChecklist({
      ...identity,
      currentStepId: 'review-settings',
      updatedAt: '2026-08-08T00:03:00.000Z'
    })
    expect(advanced.activeRun?.checklist.map((step) => step.status)).toEqual(['completed', 'current'])
  })

  it('persists evidence and invalidation while clearing an obsolete pass', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory())
    await repository.save(activeRecord(activeRun({
      reviewStatus: 'passed',
      reviewResult: {
        schemaVersion: 1,
        practiceId: 'm1-codex-safe-setup',
        practiceVersion: '2.0.0',
        runId: 'run-1',
        verdict: 'passed',
        criteria: [],
        summary: 'Passed',
        reviewedAt: '2026-08-08T00:00:00.000Z',
        sourceDigest: 'a'.repeat(64)
      }
    })))
    const identity = {
      runId: 'run-1',
      generation: 1,
      practiceId: 'm1-codex-safe-setup',
      practiceVersion: '2.0.0'
    }
    const invalidation = {
      changedInput: 'settings',
      affectedStepIds: ['review-settings'],
      reason: 'Cấu hình đã thay đổi.',
      nextAction: 'Duyệt lại cấu hình.'
    }
    const saved = await repository.saveEvidence({
      ...identity,
      evidence: {
        schemaVersion: 1,
        practiceId: identity.practiceId,
        practiceVersion: identity.practiceVersion,
        runId: identity.runId,
        evidenceProfile: 'codex-task-configuration',
        observedAt: '2026-08-08T00:05:00.000Z',
        freshness: 'fresh',
        sourceDigest: 'b'.repeat(64),
        evidence: [],
        steps: [],
        invalidations: [invalidation]
      },
      checklist: [
        { id: 'open-task', title: 'Mở task', status: 'completed', dependencyInputs: {} },
        { id: 'review-settings', title: 'Duyệt cấu hình', status: 'stale', reason: invalidation.reason, dependencyInputs: {} }
      ],
      invalidations: [invalidation],
      updatedAt: '2026-08-08T00:05:00.000Z'
    })

    expect(saved.activeRun).toMatchObject({
      reviewStatus: 'not-reviewed',
      reviewResult: undefined,
      invalidations: [{ changedInput: 'settings' }]
    })
  })

  it('recovers an interrupted review without changing run identity', async () => {
    const directory = await temporaryDirectory()
    const first = new PracticeRunRepository(directory)
    await first.save(activeRecord(activeRun({ reviewStatus: 'reviewing' })))

    await expect(new PracticeRunRepository(directory).load()).resolves.toMatchObject({
      activeRun: {
        runId: 'run-1',
        practiceId: 'm1-codex-safe-setup',
        practiceVersion: '2.0.0',
        reviewStatus: 'not-reviewed'
      }
    })
  })

  it('migrates an existing review result into bounded review history', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory())
    const result = {
      schemaVersion: 1 as const,
      practiceId: 'm1-codex-safe-setup',
      practiceVersion: '2.0.0',
      runId: 'run-1',
      verdict: 'passed' as const,
      criteria: [],
      summary: 'Passed',
      reviewedAt: '2026-08-08T00:00:00.000Z',
      sourceDigest: 'a'.repeat(64)
    }

    const saved = await repository.save(activeRecord(activeRun({
      reviewStatus: 'passed',
      reviewResult: result,
      reviewHistory: undefined
    })))

    expect(saved.activeRun?.reviewHistory).toEqual([result])
  })

  it('retains the five latest review events, including unchanged rechecks', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory())
    await repository.save(activeRecord())
    const identity = {
      runId: 'run-1', generation: 1,
      practiceId: 'm1-codex-safe-setup', practiceVersion: '2.0.0'
    }
    for (let index = 0; index < 6; index += 1) {
      await repository.saveReview({
        ...identity,
        result: {
          schemaVersion: 1,
          practiceId: identity.practiceId,
          practiceVersion: identity.practiceVersion,
          runId: identity.runId,
          verdict: 'passed',
          criteria: [],
          summary: 'Passed',
          reviewedAt: `2026-08-08T00:0${index}:00.000Z`,
          sourceDigest: 'a'.repeat(64)
        },
        checklist: activeRun().checklist,
        updatedAt: `2026-08-08T00:0${index}:00.000Z`
      })
    }

    const history = (await repository.load()).activeRun?.reviewHistory ?? []
    expect(history).toHaveLength(5)
    expect(history.map((item) => item.reviewedAt)).toEqual([
      '2026-08-08T00:01:00.000Z',
      '2026-08-08T00:02:00.000Z',
      '2026-08-08T00:03:00.000Z',
      '2026-08-08T00:04:00.000Z',
      '2026-08-08T00:05:00.000Z'
    ])
  })

  it('restores the exact prior review after an interrupted recheck', async () => {
    const directory = await temporaryDirectory()
    const result = {
      schemaVersion: 1 as const,
      practiceId: 'm1-codex-safe-setup',
      practiceVersion: '2.0.0',
      runId: 'run-1',
      verdict: 'passed' as const,
      criteria: [],
      summary: 'Passed',
      reviewedAt: '2026-08-08T00:00:00.000Z',
      sourceDigest: 'a'.repeat(64)
    }
    await new PracticeRunRepository(directory).save(activeRecord(activeRun({
      reviewStatus: 'reviewing',
      reviewResult: result,
      reviewHistory: [result]
    })))

    await expect(new PracticeRunRepository(directory).load()).resolves.toMatchObject({
      activeRun: {
        reviewStatus: 'passed',
        reviewResult: result,
        reviewHistory: [result]
      }
    })
  })

  it('keeps multiple Practice identities separate across archived receipts', async () => {
    const record = activeRecord(activeRun({
      practiceId: 'm2-planning-package',
      practiceVersion: '2.0.0',
      taskPolicy: 'safe-workspace-write',
      evidenceProfile: 'planning-package'
    }))
    record.archivedRuns.push({
      runId: 'run-m1',
      generation: 1,
      practiceId: 'm1-codex-safe-setup',
      practiceVersion: '2.0.0',
      threadId: 'thread-m1',
      name: 'Module 1 Practice',
      outcome: 'replaced',
      archivedAt: '2026-08-08T00:00:00.000Z'
    })
    const repository = new PracticeRunRepository(await temporaryDirectory())

    await expect(repository.save(record)).resolves.toMatchObject({
      activeRun: { practiceId: 'm2-planning-package' },
      archivedRuns: [{ practiceId: 'm1-codex-safe-setup' }]
    })
  })

  it('persists Module 2 action progress across restart and ignores late-generation actions', async () => {
    const directory = await temporaryDirectory()
    const repository = new PracticeRunRepository(directory)
    const observedAt = '2026-08-08T00:01:00.000Z'
    const planning = activeRun({
      practiceId: 'm2-planning-package',
      practiceVersion: '2.0.0',
      taskPolicy: 'safe-workspace-write',
      evidenceProfile: 'planning-package',
      checklist: planningPracticeStepIds.map((id, index) => ({
        id,
        title: 'Bước ' + String(index + 1),
        status: index === 0 ? 'current' : 'pending',
        dependencyInputs: {}
      })),
      evidence: {
        schemaVersion: 1,
        practiceId: 'm2-planning-package',
        practiceVersion: '2.0.0',
        runId: 'run-1',
        evidenceProfile: 'planning-package',
        observedAt,
        freshness: 'unverifiable',
        sourceDigest: 'a'.repeat(64),
        evidence: [],
        steps: [],
        invalidations: [],
        planningArtifacts: [],
        artifactIssues: [],
        unexpectedChangedPaths: [],
        planningActivity: {
          schemaVersion: 1,
          cursor: 'cursor-1',
          observedAt,
          learnerTurnCount: 2,
          executorTurnCount: 1,
          prdPrompt: {
            text: 'Hãy phỏng vấn tôi từng câu để tạo PRD.',
            digest: 'b'.repeat(64)
          }
        }
      }
    })
    await repository.save(activeRecord(planning))
    await repository.applyPlanningAction({
      runId: 'run-1',
      generation: 1,
      practiceId: 'm2-planning-package',
      practiceVersion: '2.0.0',
      action: { type: 'capture-prd-prompt', expectedActivityCursor: 'cursor-1' },
      updatedAt: observedAt
    })

    const restarted = new PracticeRunRepository(directory)
    const restored = (await restarted.load()).activeRun
    expect(restored).toMatchObject({
      runId: 'run-1',
      learnerDecisions: { 'prd-prompt': 'Hãy phỏng vấn tôi từng câu để tạo PRD.' }
    })
    expect(restored?.checklist.slice(0, 2)).toMatchObject([
      { id: 'write-prd-prompt', status: 'completed' },
      { id: 'complete-interview', status: 'current' }
    ])

    const late = await restarted.applyPlanningAction({
      runId: 'run-1',
      generation: 2,
      practiceId: 'm2-planning-package',
      practiceVersion: '2.0.0',
      action: { type: 'complete-interview', expectedActivityCursor: 'cursor-1' },
      updatedAt: '2026-08-08T00:02:00.000Z'
    })
    expect(late.activeRun?.learnerDecisions['interview-completion']).toBeUndefined()
  })
})
