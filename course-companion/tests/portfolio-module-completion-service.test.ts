import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { PortfolioModuleCompletionService } from '../electron/main/portfolio-module-completion-service'
import { PortfolioPlanningEvidenceAdapter } from '../electron/main/portfolio-planning-evidence-adapter'
import { PortfolioBuildEvidenceAdapter } from '../electron/main/portfolio-build-evidence-adapter'
import { buildActivity, buildRun, writeBuildPackage } from './fixtures/portfolio-build-fixture'
import { parsePracticeReviewResult } from '../electron/main/practice-review-contracts'
import { PortfolioWorkspaceRepository } from '../electron/main/portfolio-workspace-repository'
import { PracticeDefinitionRepository } from '../electron/main/practice-definition-repository'
import { buildPracticeReviewEnvelope } from '../electron/main/practice-review-context'
import { PracticeRunRepository } from '../electron/main/practice-run-repository'
import { ProgressRepository } from '../electron/main/progress-repository'
import {
  portfolioPackageArtifactPaths,
  portfolioBuildSliceIds,
  type PracticeBuildSliceReceipt,
  type PracticeStageReceipt,
  type ProgressUpdate
} from '../shared/contracts'
import {
  portfolioPackageTimestamp,
  savePortfolioPackageRun,
  writePortfolioPackage
} from './fixtures/portfolio-package-fixture'

const temporaryDirectories: string[] = []
const observedAt = portfolioPackageTimestamp

async function moduleThreeV2Fixture() {
  const base = await fixture()
  const ready = await base.service.completeModuleTwo()
  const { practiceRunRepository: runs, definitionRepository: definitions, workspaceRepository } = base.dependencies
  const definition = await definitions.load('m3-portfolio-build', '2.1.0')
  await writeBuildPackage(base.workspace)
  const run = buildRun(definition, base.workspace)
  const adapter = new PortfolioBuildEvidenceAdapter()
  const evidence = await adapter.collect({ definition, runId: run.runId, generation: run.generation, workspaceRoot: base.workspace, task: { threadId: run.binding.threadId, workspaceRoot: base.workspace } })
  await runs.save({ ...(await runs.load()), activeRun: { ...run, evidence } })
  const approved = await runs.approvePortfolioPackage({ ...run, sourceDigest: evidence.sourceDigest!, courseRunId: ready.courseRunId, updatedAt: observedAt })
  const envelope = buildPracticeReviewEnvelope({ definition, run: approved.activeRun!, activity: buildActivity(), generatedAt: observedAt })
  const result = parsePracticeReviewResult({
    text: JSON.stringify({ schemaVersion: 1, practiceId: definition.practiceId, practiceVersion: definition.version, runId: run.runId,
      verdict: 'passed', summary: 'Simulated review; real learner acceptance remains pending.', criteria: definition.criteria.map((criterion) => ({ criterionId: criterion.id, status: 'satisfied', evidenceRefs: [envelope.evidence[0]!.id], explanation: 'Disposable fixture.' })) }),
    definition, runId: run.runId, evidence: envelope.evidence, reviewedAt: observedAt,
    planningEvidenceDigest: envelope.portfolioPackage!.evidenceDigest, portfolioPackage: envelope.portfolioPackage
  })
  const receipt = { schemaVersion: 1 as const, courseRunId: ready.courseRunId, practiceId: definition.practiceId, practiceVersion: definition.version,
    runId: run.runId, checkpointId: definition.checkpointId, status: 'completed' as const, completedAt: observedAt,
    submissionDigest: envelope.portfolioPackage!.evidenceDigest, evidenceSummary: result.summary, masterySummary: 'Mastery remains required.', destination: definition.completionDestination }
  await runs.saveReview({ ...run, result, checklist: definition.checklist.map((step) => ({ ...step, status: 'completed' as const })), completion: receipt, expectedPackageDigest: evidence.sourceDigest!, updatedAt: observedAt })
  await base.progressRepository.recordPracticeCompletion(receipt)
  await runs.closeCompletedRun({ ...run, updatedAt: observedAt })
  const mastery = await base.progressRepository.save({ currentLessonId: 'module-3', currentCourseLessonId: 'm3-independent-enhancement', checkpointId: 'm3-mastery', sceneId: 'module-3-mastery-summary', sceneHistory: ['module-3-portfolio-practice'], completedCheckpointIds: ready.completedCheckpointIds,
    decisions: { ...ready.decisions, ...Object.fromEntries(['m3-mastery-plan', 'm3-mastery-visible-error', 'm3-mastery-logs', 'm3-mastery-repeated-error', 'm3-mastery-branch'].map((id) => ['assessment:' + id, 'correct:1'])) } })
  const service = new PortfolioModuleCompletionService(base.progressRepository, workspaceRepository, runs, definitions, base.dependencies.evidenceAdapter, () => new Date(observedAt), adapter)
  return { ...base, service, runs, mastery, receipt }
}

describe('Module 3 v2 reviewed completion', () => {
  it('completes from archived reviewed work with no fixed stage or slice receipts', async () => {
    const f = await moduleThreeV2Fixture()
    expect((await f.runs.load()).activeRun).toBeNull()
    const completed = await f.service.completeModuleThree()
    expect(completed.sceneId).toBe('module-3-complete')
    expect(completed.practiceCompletions.at(-1)?.portfolioBuildHandoff).toMatchObject({ schemaVersion: 2, submissionDigest: f.receipt.submissionDigest, sourceCheckpoint: expect.stringMatching(/^sha256:/) })
    expect(completed.practiceCompletions.at(-1)?.portfolioBuildHandoff).not.toHaveProperty('buildSliceReceiptIds')
  })

  it('rejects source-only changes after returning to mastery and keeps the original archived task', async () => {
    const f = await moduleThreeV2Fixture()
    await writeFile(join(f.workspace, 'src/main.tsx'), 'export const changedAfterReview = true')
    await expect(f.service.completeModuleThree()).rejects.toThrow('changed')
    expect((await f.runs.load()).archivedRuns.at(-1)?.retainedRun?.binding.threadId).toBe('thread-original-planning')
  })

  it('requires the existing five mastery answers independently of the approved website', async () => {
    const f = await moduleThreeV2Fixture()
    await f.progressRepository.save({ ...f.mastery, decisions: { ...f.mastery.decisions, 'assessment:m3-mastery-logs': 'incorrect:1' } })
    await expect(f.service.completeModuleThree()).rejects.toThrow('mastery')
  })
})

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })))
})

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

async function fixture(documentOverrides: Record<string, string> = {}) {
  const root = await mkdtemp(join(tmpdir(), 'portfolio-module-completion-'))
  temporaryDirectories.push(root)
  const dataDirectory = join(root, 'data')
  const workspace = join(root, 'portfolio')
  const courseRoot = join(root, 'course-root')
  await Promise.all([mkdir(workspace), mkdir(courseRoot), mkdir(dataDirectory)])
  const progressRepository = new ProgressRepository(dataDirectory, () => new Date(observedAt))
  const decisions = Object.fromEntries([
    ...[1, 4, 5, 6].map((index) => [`assessment:mastery-${index}`, 'correct:1'])
  ])
  const initialUpdate: ProgressUpdate = {
    currentLessonId: 'module-2',
    currentCourseLessonId: 'm2-portfolio-brief',
    checkpointId: 'm2-portfolio-planning',
    sceneId: 'module-2-portfolio-practice',
    sceneHistory: [],
    completedCheckpointIds: ['m2-portfolio-planning'],
    decisions
  }
  const initialProgress = await progressRepository.save(initialUpdate)
  const workspaceRepository = new PortfolioWorkspaceRepository(
    dataDirectory, courseRoot, () => new Date(observedAt))
  await workspaceRepository.selectPath({ courseRunId: initialProgress.courseRunId }, workspace)
  await workspaceRepository.confirmPlanning({ courseRunId: initialProgress.courseRunId })
  await writePortfolioPackage(workspace, documentOverrides)
  const definitionRepository = new PracticeDefinitionRepository(
    join(process.cwd(), '..', 'pilot-workspace', 'course', 'practices'))
  const definition = await definitionRepository.load('m2-portfolio-planning', '2.0.0')
  const practiceRunRepository = new PracticeRunRepository(dataDirectory)
  let active = await savePortfolioPackageRun({
    runs: practiceRunRepository,
    definition,
    workspaceRoot: workspace,
    courseRunId: initialProgress.courseRunId,
    approve: true
  })
  const envelope = buildPracticeReviewEnvelope({
    definition,
    run: active,
    activity: null,
    generatedAt: observedAt
  })
  const reviewResult = {
    schemaVersion: 1 as const,
    practiceId: definition.practiceId,
    practiceVersion: definition.version,
    runId: active.runId,
    verdict: 'passed' as const,
    criteria: [],
    summary: 'Năm tài liệu planning đã được duyệt như một gói cuối cùng nhất quán.',
    reviewedAt: observedAt,
    sourceDigest: 'a'.repeat(64)
  }
  const reviewCompletion = {
    schemaVersion: 1 as const,
    courseRunId: initialProgress.courseRunId,
    practiceId: definition.practiceId,
    practiceVersion: definition.version,
    runId: active.runId,
    checkpointId: 'm2-portfolio-planning' as const,
    status: 'completed' as const,
    completedAt: observedAt,
    evidenceSummary: reviewResult.summary,
    masterySummary: 'Đã duyệt PRD và kế hoạch hiện tại.',
    submissionDigest: envelope.portfolioPackage!.evidenceDigest,
    destination: {
      lessonId: 'module-2' as const,
      checkpointId: 'm2-portfolio-mastery' as const,
      sceneId: 'module-2-portfolio-mastery' as const
    }
  }
  const reviewed = await practiceRunRepository.saveReview({
    runId: active.runId,
    generation: active.generation,
    practiceId: active.practiceId,
    practiceVersion: active.practiceVersion,
    result: reviewResult,
    checklist: definition.checklist.map((step) => ({ ...step, status: 'completed' as const })),
    completion: reviewCompletion,
    expectedPackageDigest: active.evidence!.sourceDigest!,
    updatedAt: observedAt
  })
  active = reviewed.activeRun!
  await progressRepository.recordPracticeCompletion(reviewCompletion)
  const progress = await progressRepository.save({
    currentLessonId: 'module-2',
    currentCourseLessonId: 'm2-portfolio-brief',
    checkpointId: 'm2-portfolio-mastery',
    sceneId: 'module-2-portfolio-mastery-summary',
    sceneHistory: ['module-2-portfolio-practice'],
    completedCheckpointIds: ['m2-portfolio-planning'],
    decisions
  })
  const evidenceAdapter = new PortfolioPlanningEvidenceAdapter(undefined, () => new Date(observedAt))
  const dependencies = { workspaceRepository, practiceRunRepository, definitionRepository, evidenceAdapter }
  const service = new PortfolioModuleCompletionService(
    progressRepository,
    workspaceRepository,
    practiceRunRepository,
    definitionRepository,
    evidenceAdapter,
    () => new Date(observedAt)
  )
  return { root, workspace, progressRepository, progress, active, definition, dependencies, service }
}

async function moduleThreeFixture() {
  const base = await fixture()
  const moduleThreeReady = await base.service.completeModuleTwo()
  const decisions = {
    ...moduleThreeReady.decisions,
    'assessment:m3-mastery-plan': 'correct:1',
    'assessment:m3-mastery-visible-error': 'correct:0',
    'assessment:m3-mastery-logs': 'correct:3',
    'assessment:m3-mastery-repeated-error': 'correct:0',
    'assessment:m3-mastery-branch': 'correct:1'
  }
  const mastery = await base.progressRepository.save({
    currentLessonId: 'module-3',
    currentCourseLessonId: 'm3-independent-enhancement',
    checkpointId: 'm3-mastery',
    sceneId: 'module-3-mastery-summary',
    sceneHistory: ['module-3-portfolio-practice'],
    completedCheckpointIds: [...moduleThreeReady.completedCheckpointIds, 'm3-portfolio-build'],
    decisions
  })
  const stageIds = ['scaffold-baseline', 'complete-first-version', 'whole-page-revision', 'evidence-debugging', 'independent-enhancement'] as const
  const stageArtifactPaths = [
    ['evidence/module-3/scaffold-report.md'],
    ['evidence/module-3/design-direction.md', 'evidence/module-3/build-log.md', 'evidence/module-3/browser-validation.md'],
    ['evidence/module-3/revision-record.md'],
    ['evidence/module-3/debugging-report.md'],
    ['evidence/module-3/enhancement-plan.md', 'evidence/module-3/final-change-summary.md']
  ] as const
  const allPaths = [
    'planning/PRD.md', 'planning/implementation-plan.md',
    ...stageArtifactPaths.flat(),
    ...portfolioBuildSliceIds.map((id) => `evidence/module-3/build-log.${id}`)
  ]
  const digestMap = new Map(allPaths.map((path) => [path, sha256(`current:${path}`)]))
  const workspaceDigest = sha256(base.workspace)
  const receipts: PracticeStageReceipt[] = stageIds.map((stageId, index) => {
    const artifactDigests = Object.fromEntries([
      'planning/PRD.md', 'planning/implementation-plan.md', ...stageArtifactPaths[index]!
    ].map((path) => [path, digestMap.get(path)!]))
    return {
      schemaVersion: 1, courseRunId: mastery.courseRunId, practiceId: 'm3-portfolio-build', practiceVersion: '1.0.0',
      runId: 'run-build', stageId, stageIndex: (index + 1) as 1 | 2 | 3 | 4 | 5,
      workspace: { canonicalPath: base.workspace, identityDigest: workspaceDigest }, artifactDigests,
      approval: { approvedAt: observedAt, artifactDigests },
      evidence: { executorReportedChecks: ['npm run check passed', 'checkpoint commit-build'], corroboratedArtifacts: artifactDigests },
      status: 'completed', freshness: 'current', observedAt
    }
  })
  const slices: PracticeBuildSliceReceipt[] = portfolioBuildSliceIds.map((sliceId, index) => {
    const artifactDigests = Object.fromEntries([
      ['planning/PRD.md', digestMap.get('planning/PRD.md')!],
      ['evidence/module-3/design-direction.md', digestMap.get('evidence/module-3/design-direction.md')!],
      [`evidence/module-3/build-log.${sliceId}`, digestMap.get(`evidence/module-3/build-log.${sliceId}`)!]
    ])
    return {
      schemaVersion: 1, courseRunId: mastery.courseRunId, practiceId: 'm3-portfolio-build', practiceVersion: '1.0.0', runId: 'run-build',
      stageId: 'complete-first-version', stageIndex: 2, sliceId, sliceIndex: (index + 1) as 1 | 2 | 3 | 4,
      workspace: { canonicalPath: base.workspace, identityDigest: workspaceDigest }, artifactDigests,
      approval: { approvedAt: observedAt, artifactDigests }, evidence: { executorReportedChecks: ['npm run check passed'], corroboratedArtifacts: artifactDigests },
      status: 'completed', freshness: 'current', observedAt
    }
  })
  const build = {
    schemaVersion: 1 as const,
    workspaceIdentityDigest: workspaceDigest,
    artifacts: allPaths.map((path) => ({ path, digest: digestMap.get(path)!, byteLength: 100, modifiedAt: observedAt, observedAt })),
    issues: [], unexpectedPaths: [],
    stages: stageIds.map((stageId, index) => ({
      stageId, stageIndex: (index + 1) as 1 | 2 | 3 | 4 | 5, status: 'ready' as const,
      artifactDigests: receipts[index]!.artifactDigests, executorReportedChecks: ['npm run check passed'],
      corroboratedArtifacts: receipts[index]!.artifactDigests, issueCodes: []
    }))
  }
  const definition = {
    practiceId: 'm3-portfolio-build', version: '1.0.0',
    stages: stageIds.map((id, index) => ({ id, order: (index + 1) as 1 | 2 | 3 | 4 | 5, dependsOn: index ? [stageIds[index - 1]!] : [], requiredArtifactPaths: [...stageArtifactPaths[index]!] }))
  }
  const active = {
    runId: 'run-build', generation: 1, practiceId: 'm3-portfolio-build', practiceVersion: '1.0.0',
    binding: { threadId: 'thread-build', workspaceRoot: base.workspace }, stageReceipts: receipts, buildSliceReceipts: slices
  }
  const service = new PortfolioModuleCompletionService(
    base.progressRepository,
    { load: async () => ({ status: 'ready', selectedPath: base.workspace }) } as never,
    { load: async () => ({ activeRun: active }) } as never,
    { load: async () => definition } as never,
    base.dependencies.evidenceAdapter as never,
    () => new Date(observedAt),
    { collect: async () => ({ freshness: 'fresh', portfolioBuild: build }) } as never
  )
  return { ...base, mastery, receipts, slices, build, service }
}

describe('PortfolioModuleCompletionService', () => {
  it('prevents ordinary progress writes from bypassing the reviewed v2 submission gate', async () => {
    const root = await mkdtemp(join(tmpdir(), 'portfolio-module-progress-gate-'))
    temporaryDirectories.push(root)
    const repository = new ProgressRepository(root, () => new Date(observedAt))
    const progress = await repository.save({
      currentLessonId: 'module-2',
      currentCourseLessonId: 'm2-portfolio-brief',
      checkpointId: 'm2-portfolio-planning',
      sceneId: 'module-2-portfolio-practice',
      sceneHistory: [],
      completedCheckpointIds: [],
      decisions: {}
    })

    await expect(repository.save({
      currentLessonId: 'module-2',
      currentCourseLessonId: 'm2-portfolio-brief',
      checkpointId: 'm2-portfolio-mastery',
      sceneId: 'module-2-portfolio-mastery-summary',
      sceneHistory: ['module-2-portfolio-practice'],
      completedCheckpointIds: ['m2-portfolio-planning'],
      decisions: progress.decisions
    })).rejects.toThrow(/submission|completion|review/i)
  })

  it.each([
    ['active', false],
    ['retained archived', true]
  ])('atomically completes an %s reviewed v2 submission', async (_label, archived) => {
    const test = await fixture()
    if (archived) {
      await test.dependencies.practiceRunRepository.closeCompletedRun({
        runId: test.active.runId,
        generation: test.active.generation,
        practiceId: test.active.practiceId,
        practiceVersion: test.active.practiceVersion,
        updatedAt: observedAt
      })
    }

    const completed = await test.service.completeModuleTwo()

    expect(completed).toMatchObject({
      currentLessonId: 'module-3',
      sceneId: 'module-3-first-build',
      completedCheckpointIds: expect.arrayContaining([
        'm2-portfolio-planning', 'm2-portfolio-mastery', 'm2-portfolio-complete'
      ])
    })
    const receipt = completed.practiceCompletions.at(-1)!
    expect(receipt.portfolioPlanningHandoff).toMatchObject({
      schemaVersion: 2,
      workspace: { canonicalPath: test.workspace },
      task: {
        runId: test.active.runId,
        threadId: test.active.binding.threadId,
        workspaceRoot: test.workspace
      },
      moduleThreeInput: { workspacePath: test.workspace },
      submission: { runId: test.active.runId, generation: test.active.generation }
    })
    expect(receipt.portfolioPlanningHandoff?.artifacts.map(({ path }) => path))
      .toEqual(portfolioPackageArtifactPaths)
    expect(receipt.portfolioPlanningHandoff).not.toHaveProperty('stageReceipts')
    expect(receipt.submissionDigest).toBe(test.active.completion?.submissionDigest)
    await expect(new ProgressRepository(join(test.root, 'data')).load()).resolves.toMatchObject({
      status: 'returning', progress: { sceneId: 'module-3-first-build' }
    })
  })

  it('restores the lesson after the first build without granting a Practice receipt', async () => {
    const test = await fixture()
    const opening = await test.service.completeModuleTwo()
    const data = join(test.root, 'data')
    await new ProgressRepository(data).resumeLessonAfterFirstBuild()
    const restarted = new ProgressRepository(data)
    await expect(restarted.load()).resolves.toMatchObject({
      status: 'returning',
      progress: {
        courseRunId: opening.courseRunId, sceneId: 'module-3-local-preview',
        completedCheckpointIds: opening.completedCheckpointIds, practiceCompletions: opening.practiceCompletions,
        sceneHistory: expect.arrayContaining(['module-3-first-build'])
      }
    })
    await expect(restarted.resumeLessonAfterFirstBuild()).rejects.toThrow()
  })

  it('extracts late relevant sections for the bounded Module 3 handoff summary', async () => {
    const irrelevant = `IRRELEVANT-OPENING ${'generic introduction '.repeat(60)}`
    const inventory = [
      '# Content evidence inventory',
      irrelevant,
      '## Available material and provenance',
      'Project Alpha has owner-authored evidence.',
      '## Gaps, privacy, and publication restrictions',
      'LATE-PRIVACY-GAP: client names and conversion metrics remain private until permission is confirmed.'
    ].join('\n\n')
    const prd = [
      '# Portfolio PRD',
      irrelevant,
      '## Product requirements',
      'REQ-HERO: Introduce the owner before the first project.',
      '## Acceptance criteria',
      'A reviewer can locate the owner with a keyboard.',
      '## Out of scope',
      'LATE-EXCLUSION: publishing, analytics, and a backend are deliberately excluded.'
    ].join('\n\n')
    const plan = [
      '# Implementation plan',
      irrelevant,
      '## Delivery steps and order',
      'LATE-IMPLEMENTATION-ORDER: first build REQ-HERO, then validate responsive keyboard use.',
      '## Dependencies and stopping point',
      'Verified inventory content is required before implementation stops for learner review.',
      '## Checks, validation, and expected evidence',
      'Verify REQ-HERO on desktop, mobile, and keyboard navigation.'
    ].join('\n\n')
    expect(inventory.indexOf('LATE-PRIVACY-GAP')).toBeGreaterThan(650)
    expect(prd.indexOf('LATE-EXCLUSION')).toBeGreaterThan(650)
    expect(plan.indexOf('LATE-IMPLEMENTATION-ORDER')).toBeGreaterThan(650)
    const test = await fixture({
      'planning/content-evidence-inventory.md': inventory,
      'planning/PRD.md': prd,
      'planning/implementation-plan.md': plan
    })

    const completed = await test.service.completeModuleTwo()
    const summary = completed.practiceCompletions.at(-1)?.portfolioPlanningHandoff?.summary
    expect(summary?.evidenceBoundary).toContain('LATE-PRIVACY-GAP')
    expect(summary?.deliberatelyOutOfScope).toContain('LATE-EXCLUSION')
    expect(summary?.firstBuild).toContain('LATE-IMPLEMENTATION-ORDER')
    expect([summary?.evidenceBoundary, summary?.deliberatelyOutOfScope, summary?.firstBuild])
      .not.toContainEqual(expect.stringContaining('IRRELEVANT-OPENING'))
  })

  it('survives a repository relaunch before completing the reviewed submission', async () => {
    const test = await fixture()
    const relaunched = new PortfolioModuleCompletionService(
      new ProgressRepository(join(test.root, 'data'), () => new Date(observedAt)),
      new PortfolioWorkspaceRepository(join(test.root, 'data'), join(test.root, 'course-root'), () => new Date(observedAt)),
      new PracticeRunRepository(join(test.root, 'data')),
      test.dependencies.definitionRepository,
      new PortfolioPlanningEvidenceAdapter(undefined, () => new Date(observedAt)),
      () => new Date(observedAt)
    )

    await expect(relaunched.completeModuleTwo()).resolves.toMatchObject({
      sceneId: 'module-3-first-build'
    })
  })

  it('does not fall back to an archived pass while a newer active attempt is unpassed', async () => {
    const test = await fixture()
    const archived = await test.dependencies.practiceRunRepository.closeCompletedRun({
      runId: test.active.runId,
      generation: test.active.generation,
      practiceId: test.active.practiceId,
      practiceVersion: test.active.practiceVersion,
      updatedAt: observedAt
    })
    await test.dependencies.practiceRunRepository.save({
      ...archived,
      activeRun: {
        ...test.active,
        runId: 'run-package-retry',
        generation: test.active.generation + 1,
        binding: {
          ...test.active.binding,
          runId: 'run-package-retry',
          threadId: 'thread-package-retry'
        },
        evidence: null,
        stageReceipts: [],
        packageApproval: undefined,
        reviewStatus: 'not-reviewed',
        reviewResult: undefined,
        reviewHistory: [],
        completion: undefined
      }
    })

    await expect(test.service.completeModuleTwo()).rejects.toThrow('five-document submission review')
    expect((await test.dependencies.practiceRunRepository.load()).archivedRuns.at(-1)?.retainedRun)
      .toMatchObject({ runId: test.active.runId, reviewStatus: 'passed' })
  })

  it('rejects changed files without moving the learner checkpoint or deleting the review receipt', async () => {
    const test = await fixture()
    await writeFile(join(test.workspace, 'planning/PRD.md'), '# Changed PRD\n', 'utf8')

    await expect(test.service.completeModuleTwo()).rejects.toThrow('changed')
    const loaded = await test.progressRepository.load()
    expect(loaded).toMatchObject({
      status: 'returning',
      progress: {
        sceneId: 'module-2-portfolio-mastery-summary',
        practiceCompletions: [expect.objectContaining({
          checkpointId: 'm2-portfolio-planning',
          submissionDigest: test.active.completion?.submissionDigest
        })]
      }
    })
  })

  it('requires all current mastery answers before completion', async () => {
    const test = await fixture()
    await test.progressRepository.save({
      currentLessonId: 'module-2',
      currentCourseLessonId: 'm2-portfolio-brief',
      checkpointId: 'm2-portfolio-mastery',
      sceneId: 'module-2-portfolio-mastery-summary',
      sceneHistory: ['module-2-portfolio-practice'],
      completedCheckpointIds: ['m2-portfolio-planning'],
      decisions: { ...test.progress.decisions, 'assessment:mastery-4': 'incorrect:0' }
    })

    await expect(test.service.completeModuleTwo()).rejects.toThrow('mastery')
  })

  it('rejects a legacy v1 pass while preserving its historical run and completion receipt', async () => {
    const test = await fixture()
    const legacyDefinition = await test.dependencies.definitionRepository.load('m2-portfolio-planning', '1.0.0')
    const legacyResult = {
      schemaVersion: 1 as const,
      practiceId: legacyDefinition.practiceId,
      practiceVersion: legacyDefinition.version,
      runId: 'run-legacy',
      verdict: 'passed' as const,
      criteria: [],
      summary: 'Historical seven-document review.',
      reviewedAt: observedAt,
      sourceDigest: 'b'.repeat(64)
    }
    const legacyCompletion = {
      schemaVersion: 1 as const,
      courseRunId: test.progress.courseRunId,
      practiceId: legacyDefinition.practiceId,
      practiceVersion: legacyDefinition.version,
      runId: 'run-legacy',
      checkpointId: 'm2-portfolio-planning' as const,
      status: 'completed' as const,
      completedAt: observedAt,
      evidenceSummary: legacyResult.summary,
      masterySummary: 'Historical five-stage approvals.',
      destination: {
        lessonId: 'module-2' as const,
        checkpointId: 'm2-portfolio-mastery' as const,
        sceneId: 'module-2-portfolio-mastery' as const
      }
    }
    const record = await test.dependencies.practiceRunRepository.load()
    await test.dependencies.practiceRunRepository.save({
      ...record,
      activeRun: {
        runId: 'run-legacy',
        generation: 1,
        status: 'active',
        practiceId: legacyDefinition.practiceId,
        practiceVersion: legacyDefinition.version,
        workspaceKind: legacyDefinition.workspaceKind,
        taskPolicy: legacyDefinition.taskPolicy,
        evidenceProfile: legacyDefinition.evidenceProfile,
        binding: {
          runId: 'run-legacy',
          threadId: 'thread-legacy',
          name: 'Historical Module 2 Practice',
          workspaceRoot: test.workspace,
          createdAt: observedAt
        },
        startedAt: observedAt,
        updatedAt: observedAt,
        checklist: legacyDefinition.checklist.map((step) => ({ ...step, status: 'completed' as const })),
        learnerDecisions: {},
        learnerApprovals: {},
        evidence: null,
        invalidations: [],
        stageReceipts: [],
        reviewStatus: 'passed',
        reviewResult: legacyResult,
        reviewHistory: [legacyResult],
        completion: legacyCompletion
      }
    })
    await test.progressRepository.recordPracticeCompletion(legacyCompletion)

    await expect(test.service.completeModuleTwo()).rejects.toThrow('five-document submission review')
    expect((await test.dependencies.practiceRunRepository.load()).activeRun).toMatchObject({
      runId: 'run-legacy',
      practiceVersion: '1.0.0',
      reviewHistory: [legacyResult]
    })
    const loaded = await test.progressRepository.load()
    if (loaded.status === 'returning' || loaded.status === 'recovered') {
      expect(loaded.progress.practiceCompletions).toContainEqual(legacyCompletion)
    }
  })

  it('is idempotent after completion and writes only one final receipt', async () => {
    const test = await fixture()
    const first = await test.service.completeModuleTwo()
    const second = await test.service.completeModuleTwo()

    expect(second).toEqual(first)
    expect(second.practiceCompletions.filter((receipt) =>
      receipt.checkpointId === 'm2-portfolio-complete')).toHaveLength(1)
  })

  it('reset removes both the submission receipt and the unlocked destination', async () => {
    const test = await fixture()
    await test.service.completeModuleTwo()
    await test.progressRepository.reset()

    await expect(test.progressRepository.load()).resolves.toEqual({ status: 'new' })
    await expect(readFile(join(test.root, 'data', 'learner-state.json'), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('atomically completes Module 3 only with five stages, four slices and current mastery', async () => {
    const test = await moduleThreeFixture()
    const completed = await test.service.completeModuleThree()
    expect(completed).toMatchObject({ sceneId: 'module-3-complete', completedCheckpointIds: expect.arrayContaining(['m3-portfolio-build', 'm3-mastery', 'm3-complete']) })
    expect(completed.practiceCompletions.at(-1)?.portfolioBuildHandoff).toMatchObject({
      workspace: { canonicalPath: test.workspace },
      buildSliceReceiptIds: portfolioBuildSliceIds
    })
  })

  it('keeps Module 3 locked when a nested build slice receipt is missing', async () => {
    const test = await moduleThreeFixture()
    test.slices.pop()
    await expect(test.service.completeModuleThree()).rejects.toThrow('Four current build slice receipts')
    await expect(test.progressRepository.load()).resolves.toMatchObject({ status: 'returning', progress: { sceneId: 'module-3-mastery-summary' } })
  })
})
