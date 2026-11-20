import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { PracticeReviewEnvelope } from '../electron/main/practice-review-context'
import type { PracticeReviewEvaluator } from '../electron/main/practice-review-evaluator'
import { CodexConfigurationEvidenceAdapter } from '../electron/main/codex-configuration-evidence-adapter'
import { normalizeCodexTaskConfiguration } from '../electron/main/codex-configuration-normalizer'
import { PlanningPackageEvidenceAdapter } from '../electron/main/planning-package-evidence-adapter'
import { PortfolioPlanningEvidenceAdapter } from '../electron/main/portfolio-planning-evidence-adapter'
import { PortfolioModuleCompletionService } from '../electron/main/portfolio-module-completion-service'
import { PortfolioWorkspaceRepository } from '../electron/main/portfolio-workspace-repository'
import { PracticeCoordinator } from '../electron/main/practice-coordinator'
import { PracticeDefinitionRepository } from '../electron/main/practice-definition-repository'
import { PracticeEvidenceAdapterRegistry } from '../electron/main/practice-evidence-adapter-registry'
import { PracticeReviewService } from '../electron/main/practice-review-service'
import { PracticeRunRepository, selectPortfolioPackageMigrationRecovery } from '../electron/main/practice-run-repository'
import { ProgressRepository } from '../electron/main/progress-repository'
import { collectPortfolioPackage } from '../electron/main/portfolio-package-evidence'
import {
  portfolioPackageActivity,
  portfolioPackageDocuments,
  portfolioPackageTimestamp,
  savePortfolioPackageRun,
  writePortfolioPackage
} from './fixtures/portfolio-package-fixture'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })))
})

function reviewJson(envelope: PracticeReviewEnvelope, verdict: 'passed' | 'needs-work', failedCriterionId?: string): string {
  return JSON.stringify({
    schemaVersion: 1,
    practiceId: envelope.definition.practiceId,
    practiceVersion: envelope.definition.version,
    runId: envelope.run.runId,
    verdict,
    criteria: envelope.definition.criteria.map((criterion, index) => {
      const unsatisfied = verdict === 'needs-work' && (failedCriterionId ? criterion.id === failedCriterionId : index === 0)
      const evidence = envelope.evidence.find((candidate) =>
        criterion.acceptedEvidence.includes(candidate.kind))
      return {
        criterionId: criterion.id,
        status: unsatisfied ? 'unsatisfied' : 'satisfied',
        evidenceRefs: unsatisfied || !evidence ? [] : [evidence.id],
        explanation: unsatisfied
          ? 'planning/portfolio-brief.md chưa nêu đủ tín hiệu thành công có thể quan sát.'
          : 'Nội dung và bằng chứng hiện tại đáp ứng tiêu chí.'
      }
    }),
    summary: verdict === 'passed'
      ? 'Năm tài liệu tạo thành một gói planning nhất quán, khả thi và có thể kiểm chứng.'
      : 'Bản mô tả portfolio cần bổ sung một ranh giới nội dung cụ thể.'
  })
}

async function harness(options: {
  approve?: boolean
  approvalCourseRunId?: string
  migrateLegacy?: boolean
} = {}) {
  const root = await mkdtemp(join(tmpdir(), 'portfolio-package-review-'))
  temporaryDirectories.push(root)
  const dataDirectory = join(root, 'data')
  const workspaceRoot = join(root, 'portfolio')
  const courseRoot = join(root, 'course')
  await Promise.all([mkdir(dataDirectory), mkdir(workspaceRoot), mkdir(courseRoot)])
  const definitions = new PracticeDefinitionRepository(
    join(process.cwd(), '..', 'pilot-workspace', 'course', 'practices'))
  const definition = await definitions.load('m2-portfolio-planning', '2.0.0')
  const runs = new PracticeRunRepository(dataDirectory)
  const progress = new ProgressRepository(dataDirectory, () => new Date(portfolioPackageTimestamp))
  const savedProgress = await progress.save({
    currentLessonId: 'module-2',
    currentCourseLessonId: 'm2-portfolio-brief',
    checkpointId: 'm2-portfolio-planning',
    sceneId: 'module-2-portfolio-practice',
    sceneHistory: [],
    completedCheckpointIds: ['m2-alignment-review'],
    decisions: {}
  })
  const workspaceRepository = new PortfolioWorkspaceRepository(
    dataDirectory, courseRoot, () => new Date(portfolioPackageTimestamp))
  await workspaceRepository.selectPath({ courseRunId: savedProgress.courseRunId }, workspaceRoot)
  await workspaceRepository.confirmPlanning({ courseRunId: savedProgress.courseRunId })
  await writePortfolioPackage(workspaceRoot)
  const seeded = await savePortfolioPackageRun({
    runs,
    definition,
    workspaceRoot,
    approve: options.migrateLegacy ? false : options.approve,
    courseRunId: options.approvalCourseRunId ?? savedProgress.courseRunId
  })
  const legacyContents = {
    'planning/requirement-validation-map.md': '# Historical validation map\n\nPreserve this learner file.',
    'planning/first-bounded-task.md': '# Historical first task\n\nPreserve this learner file.'
  }
  if (options.migrateLegacy) {
    await Promise.all(Object.entries(legacyContents).map(([path, content]) =>
      writeFile(join(workspaceRoot, path), content, 'utf8')))
    const legacyDefinition = await definitions.load(definition.practiceId, '1.0.0')
    await runs.save({
      ...(await runs.load()),
      activeRun: {
        ...seeded,
        generation: 1,
        practiceVersion: legacyDefinition.version,
        checklist: legacyDefinition.checklist.map((step, index) => ({
          id: step.id,
          title: step.title,
          status: index === 0 ? 'current' : 'pending'
        })),
        evidence: null,
        packageApproval: undefined,
        reviewStatus: 'not-reviewed',
        reviewResult: undefined,
        reviewHistory: [],
        completion: undefined
      }
    })
  }

  let currentActivity = portfolioPackageActivity()
  let evaluatorMode: 'passed' | 'needs-work' | 'malformed' | 'error' = 'passed'
  let failedCriterionId: string | undefined
  let evaluatorCalls = 0
  let duringEvaluation: (() => Promise<void>) | undefined
  const activitySource = { async current() { return structuredClone(currentActivity) } }
  const registry = new PracticeEvidenceAdapterRegistry([
    new CodexConfigurationEvidenceAdapter(activitySource),
    new PlanningPackageEvidenceAdapter(activitySource),
    new PortfolioPlanningEvidenceAdapter(undefined, () => new Date(portfolioPackageTimestamp))
  ])
  const coordinator = new PracticeCoordinator(
    runs,
    definitions,
    {
      async createTarget() { throw new Error('not used') },
      async prepareTarget() { throw new Error('not used') },
      async openTarget() { throw new Error('not used') },
      async validateExistingTarget() { return true }
    },
    () => new Date(portfolioPackageTimestamp),
    undefined,
    undefined,
    undefined,
    registry,
    undefined,
    undefined,
    undefined,
    async () => {
      const loaded = await progress.load()
      if (loaded.status !== 'returning' && loaded.status !== 'recovered') return null
      const workspace = await workspaceRepository.load({ courseRunId: loaded.progress.courseRunId })
      if (workspace.status !== 'ready' || !workspace.selectedPath) return null
      return selectPortfolioPackageMigrationRecovery({
        courseRunId: loaded.progress.courseRunId,
        selectedWorkspaceRoot: workspace.selectedPath,
        record: await runs.load(),
        completions: loaded.progress.practiceCompletions
      })
    }
  )
  if (options.migrateLegacy) {
    await coordinator.loadWorkspace({ practiceId: definition.practiceId, practiceVersion: definition.version })
  }
  const observedEnvelopes: PracticeReviewEnvelope[] = []
  const evaluator: PracticeReviewEvaluator = {
    async evaluate(envelope) {
      evaluatorCalls += 1
      observedEnvelopes.push(structuredClone(envelope))
      await duringEvaluation?.()
      if (evaluatorMode === 'error') throw new Error('semantic review unavailable')
      if (evaluatorMode === 'malformed') return '{"verdict":"passed"}'
      return reviewJson(envelope, evaluatorMode, failedCriterionId)
    }
  }
  const service = new PracticeReviewService(
    definitions,
    runs,
    coordinator,
    progress,
    { async read() { return structuredClone(currentActivity) } },
    evaluator,
    () => new Date(portfolioPackageTimestamp),
    registry
  )

  async function refreshAndApprove(): Promise<void> {
    const active = (await runs.load()).activeRun
    if (!active) throw new Error('No active package run')
    const evidence = await collectPortfolioPackage({
      definition,
      runId: active.runId,
      generation: active.generation,
      workspaceRoot,
      task: { threadId: active.binding.threadId, workspaceRoot }
    }, () => new Date(portfolioPackageTimestamp))
    await runs.saveEvidence({
      runId: active.runId,
      generation: active.generation,
      practiceId: active.practiceId,
      practiceVersion: active.practiceVersion,
      evidence,
      checklist: active.checklist,
      invalidations: evidence.invalidations,
      updatedAt: portfolioPackageTimestamp
    })
    await runs.approvePortfolioPackage({
      runId: active.runId,
      generation: active.generation,
      practiceId: active.practiceId,
      practiceVersion: active.practiceVersion,
      courseRunId: savedProgress.courseRunId,
      sourceDigest: evidence.sourceDigest!,
      updatedAt: portfolioPackageTimestamp
    })
  }

  return {
    definition,
    courseRunId: savedProgress.courseRunId,
    progress,
    runs,
    coordinator,
    service,
    workspaceRoot,
    workspaceRepository,
    observedEnvelopes,
    evaluatorCallCount: () => evaluatorCalls,
    setEvaluatorMode: (mode: typeof evaluatorMode, criterionId?: string) => { evaluatorMode = mode; failedCriterionId = criterionId },
    setActivity: (overrides: Parameters<typeof portfolioPackageActivity>[0]) => {
      currentActivity = portfolioPackageActivity(overrides)
    },
    setDuringEvaluation: (operation: (() => Promise<void>) | undefined) => {
      duringEvaluation = operation
    },
    refreshAndApprove,
    legacyContents
  }
}

describe('six-file portfolio package review', () => {
  it.each([
    ['valid prose', 'passed', undefined],
    ['prototype contradicts the agreed layout', 'needs-work', 'prototype-reflects-design'],
    ['missing dependencies', 'needs-work', 'plan-phased-and-bounded'],
    ['uncovered requirements', 'needs-work', 'requirements-covered-once'],
    ['unverifiable acceptance criteria', 'needs-work', 'prd-semantic-contract']
  ] as const)('honors a simulated semantic verdict for %s instead of formatting rules', async (_case, verdict, failedCriterion) => {
    const test = await harness()
    // Deliberately no headings, exact keywords or REQ/AC identifier syntax.
    const prd = 'Giới thiệu: người xem đọc được tên và vai trò. Dự án: người xem mở được hai ví dụ được phép công bố. Liên hệ: dùng được bằng bàn phím trên điện thoại và máy tính.'
    const plan = 'Chuẩn bị nội dung đã duyệt cho Giới thiệu; khi xong mới thêm Dự án và Liên hệ. Mở từng liên kết bằng bàn phím trên màn hình hẹp và rộng, lưu nhận xét để người học xem. Chưa tạo ứng dụng trong Module 2.'
    await writeFile(join(test.workspaceRoot, 'planning/PRD.md'), prd)
    await writeFile(join(test.workspaceRoot, 'planning/implementation-plan.md'), plan)
    await test.refreshAndApprove()
    test.setEvaluatorMode(verdict, failedCriterion)
    const response = await test.service.review()
    if ('error' in response) throw new Error('Expected a completed semantic review')
    expect(test.evaluatorCallCount()).toBe(1)
    expect(test.observedEnvelopes[0]?.portfolioPackage?.artifacts).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'planning/PRD.md', content: prd }),
      expect.objectContaining({ path: 'planning/implementation-plan.md', content: plan })
    ]))
    expect(response.workspace.review).toMatchObject({ status: verdict, canReturn: verdict === 'passed' })
    if (failedCriterion) {
      expect(response.workspace.review?.result?.criteria).toContainEqual(expect.objectContaining({ criterionId: failedCriterion, status: 'unsatisfied' }))
      expect((await test.runs.load()).activeRun?.completion).toBeUndefined()
    }
  })

  it('reviews body-written dependencies only after current learner approval', async () => {
    const test = await harness()
    await writeFile(join(test.workspaceRoot, 'planning/implementation-plan.md'),
      '# Kế hoạch\n\n## Giai đoạn 1\nChuẩn bị nội dung cho REQ-HERO.\n\n## Giai đoạn 2\nPhụ thuộc vào việc duyệt giai đoạn 1. Bổ sung REQ-WORK-02.\n\n## Kiểm tra\nĐối chiếu hai yêu cầu trên trang.')
    await expect(test.service.review()).resolves.toMatchObject({
      workspace: { portfolioPackage: { ready: true, approved: false }, review: { status: 'needs-work', canReturn: false } }
    })
    expect(test.evaluatorCallCount()).toBe(0)
    await test.refreshAndApprove()
    await expect(test.service.review()).resolves.toMatchObject({
      workspace: { review: { status: 'passed', canReturn: true } }
    })
    expect(test.evaluatorCallCount()).toBe(1)
  })

  it('sends the bounded contents of all six required files to the semantic evaluator', async () => {
    const test = await harness({ approve: true })

    await test.service.review()

    const packageEnvelope = test.observedEnvelopes[0]?.portfolioPackage
    expect(packageEnvelope?.artifacts.map((artifact) => artifact.path).sort()).toEqual(
      Object.keys(portfolioPackageDocuments).sort())
    expect(Object.fromEntries(packageEnvelope!.artifacts.map(({ path, content }) => [path, content])))
      .toEqual(portfolioPackageDocuments)
    expect(packageEnvelope?.artifacts.every(({ content }) => content.length <= 128 * 1024)).toBe(true)
  })

  it('migrates, refreshes, approves and reviews with both preserved legacy files', async () => {
    const test = await harness({ migrateLegacy: true })
    const migrated = (await test.runs.load()).activeRun!

    expect(migrated).toMatchObject({
      generation: 2,
      practiceVersion: '2.0.0',
      binding: { threadId: 'thread-package', workspaceRoot: test.workspaceRoot },
      allowedLegacyArtifactPaths: Object.keys(test.legacyContents),
      evidence: { portfolioPlanning: { issues: [], unexpectedPaths: [] } }
    })
    expect((await test.runs.load()).archivedRuns.at(-1)?.retainedRun).toMatchObject({
      practiceVersion: '1.0.0',
      binding: { threadId: migrated.binding.threadId }
    })

    await test.coordinator.approvePortfolioPackage({
      practiceId: migrated.practiceId,
      practiceVersion: migrated.practiceVersion,
      runId: migrated.runId,
      generation: migrated.generation,
      courseRunId: test.courseRunId,
      sourceDigest: migrated.evidence!.sourceDigest!,
      approvePrd: true,
      approvePlan: true
    })
    await expect(test.service.review()).resolves.toMatchObject({
      workspace: { review: { status: 'passed', canReturn: true } }
    })
    expect(test.evaluatorCallCount()).toBe(1)
    for (const [path, content] of Object.entries(test.legacyContents)) {
      await expect(readFile(join(test.workspaceRoot, path), 'utf8')).resolves.toBe(content)
    }
  })

  it('returns needs-work for a valid but unapproved package without invoking semantic AI', async () => {
    const test = await harness()

    const response = await test.service.review()

    expect(response.workspace.review).toMatchObject({ status: 'needs-work', canReturn: false })
    expect(test.evaluatorCallCount()).toBe(0)
    expect((await test.runs.load()).activeRun).toMatchObject({
      reviewStatus: 'needs-work',
      reviewHistory: [expect.objectContaining({ verdict: 'needs-work' })]
    })
    await expect(test.service.passedCompletion()).rejects.toThrow()
  })

  it('passes an approved, structurally valid package only when the simulated semantic evaluator passes it', async () => {
    const test = await harness({ approve: true })

    const response = await test.service.review()

    expect(response.workspace.review).toMatchObject({ status: 'passed', canReturn: true })
    expect(test.evaluatorCallCount()).toBe(1)
    const receipt = await test.service.passedCompletion()
    expect(receipt).toMatchObject({
      practiceId: 'm2-portfolio-planning',
      practiceVersion: '2.0.0',
      runId: 'run-package',
      submissionDigest: expect.stringMatching(/^[a-f0-9]{64}$/)
    })
    await expect(test.progress.load()).resolves.toMatchObject({
      progress: { practiceCompletions: [expect.objectContaining({ submissionDigest: receipt.submissionDigest })] }
    })
  })

  it.each(['known', 'unknown'] as const)('accepts exact readable v2 task activity without Git and with %s settings', async (settings) => {
    const test = await harness({ approve: true })
    const configuration = normalizeCodexTaskConfiguration({
      runId: 'run-package',
      threadId: 'thread-package',
      source: 'thread-settings-snapshot',
      payload: {
        model: settings === 'known' ? 'gpt-5.6-sol' : 'gpt-6-astra',
        reasoningEffort: settings === 'known' ? 'high' : null,
        serviceTier: 'standard',
        approvalPolicy: 'on-request',
        sandbox: { type: 'workspaceWrite' }
      },
      observedAt: portfolioPackageTimestamp,
      eventTimestampMs: Date.parse(portfolioPackageTimestamp)
    })
    test.setActivity({
      status: 'stale',
      workspaceEvidenceStatus: 'git-unavailable',
      workspaceBaseline: {
        schemaVersion: 1,
        capturedAt: portfolioPackageTimestamp,
        gitAvailable: false,
        head: null,
        entries: {}
      },
      configuration
    })

    await expect(test.service.review()).resolves.toMatchObject({
      workspace: { review: { status: 'passed', canReturn: true } }
    })
    expect(test.evaluatorCallCount()).toBe(1)
    await expect(test.service.returnPassedPractice()).resolves.toMatchObject({
      practiceId: 'm2-portfolio-planning',
      practiceVersion: '2.0.0'
    })
  })

  it('still fails closed for generic reconciliation failure in the v2 review path', async () => {
    const test = await harness({ approve: true })
    const configuration = normalizeCodexTaskConfiguration({
      runId: 'run-package',
      threadId: 'thread-package',
      source: 'thread-settings-snapshot',
      payload: { model: 'gpt-5.6-sol', reasoningEffort: 'high', serviceTier: 'standard', approvalPolicy: 'on-request', sandbox: { type: 'workspaceWrite' } },
      observedAt: portfolioPackageTimestamp,
      eventTimestampMs: Date.parse(portfolioPackageTimestamp)
    })
    test.setActivity({ status: 'stale', workspaceEvidenceStatus: 'failed', configuration })

    await expect(test.service.review()).rejects.toThrow('PRACTICE_EVIDENCE_UNAVAILABLE')
    expect(test.evaluatorCallCount()).toBe(0)
  })

  it('persists substantive semantic needs-work feedback and cannot expose a passing receipt', async () => {
    const test = await harness({ approve: true })
    test.setEvaluatorMode('needs-work')

    const response = await test.service.review()

    expect(response.workspace.review?.result).toMatchObject({
      verdict: 'needs-work',
      criteria: expect.arrayContaining([expect.objectContaining({
        criterionId: 'brief-current-and-approved',
        status: 'unsatisfied',
        explanation: expect.stringContaining('planning/portfolio-brief.md')
      })])
    })
    await expect(test.service.passedCompletion()).rejects.toThrow()
  })

  it('rejects an AI result and clears package approval when a document changes during evaluation', async () => {
    const test = await harness()
    await test.service.review()
    const priorHistory = (await test.runs.load()).activeRun?.reviewHistory
    await test.refreshAndApprove()
    test.setDuringEvaluation(async () => {
      await writeFile(
        join(test.workspaceRoot, 'planning/PRD.md'),
        `${portfolioPackageDocuments['planning/PRD.md']}\n\nChanged during review.`,
        'utf8')
    })

    await expect(test.service.review()).rejects.toThrow('thay đổi trong khi Triết đang duyệt')

    const active = (await test.runs.load()).activeRun
    expect(active?.packageApproval).toBeUndefined()
    expect(active?.reviewResult).toBeUndefined()
    expect(active?.reviewHistory).toEqual(priorHistory)
    expect(active?.completion).toBeUndefined()
  })

  it.each([
    ['malformed AI output', 'malformed', undefined],
    ['AI disconnection', 'error', undefined],
    ['Executor disconnection', 'passed', { status: 'disconnected' as const }],
    ['busy Executor', 'passed', { status: 'working' as const }]
  ])('preserves review history and cannot pass after %s', async (_label, mode, activity) => {
    const test = await harness({ approve: true })
    test.setEvaluatorMode('needs-work')
    await test.service.review()
    const before = (await test.runs.load()).activeRun!
    test.setEvaluatorMode(mode as 'passed' | 'needs-work' | 'malformed' | 'error')
    if (activity) test.setActivity(activity)

    await expect(test.service.review()).rejects.toThrow()

    const after = (await test.runs.load()).activeRun
    expect(after?.reviewStatus).toBe('needs-work')
    expect(after?.reviewResult).toEqual(before.reviewResult)
    expect(after?.reviewHistory).toEqual(before.reviewHistory)
    expect(after?.completion).toBeUndefined()
    await expect(test.service.passedCompletion()).rejects.toThrow()
  })

  it('does not accept package approval from another course run', async () => {
    const test = await harness({ approve: true, approvalCourseRunId: 'other-course-run' })

    await expect(test.service.review()).resolves.toMatchObject({
      workspace: { review: { status: 'needs-work', canReturn: false } }
    })
    expect(test.evaluatorCallCount()).toBe(0)
    await expect(test.service.passedCompletion()).rejects.toThrow()
  })

  it('rejects activity from a different Practice run without overwriting prior review history', async () => {
    const test = await harness({ approve: true })
    test.setEvaluatorMode('needs-work')
    await test.service.review()
    const before = (await test.runs.load()).activeRun!
    test.setActivity({ runId: 'another-run' })

    await expect(test.service.review()).rejects.toThrow('PRACTICE_EVIDENCE_UNAVAILABLE')
    expect((await test.runs.load()).activeRun).toMatchObject({
      reviewStatus: 'needs-work',
      reviewResult: before.reviewResult,
      reviewHistory: before.reviewHistory
    })
  })

  it('supports revision, fresh approval, and resubmission while retaining both review attempts', async () => {
    const test = await harness({ approve: true })
    test.setEvaluatorMode('needs-work')
    await test.service.review()
    const firstDigest = (await test.runs.load()).activeRun?.evidence?.sourceDigest
    await writeFile(
      join(test.workspaceRoot, 'planning/portfolio-brief.md'),
      `${portfolioPackageDocuments['planning/portfolio-brief.md']}\n\nSuccess is a written interview invitation based on the two case studies.`,
      'utf8')
    await test.refreshAndApprove()
    test.setEvaluatorMode('passed')

    await expect(test.service.review()).resolves.toMatchObject({
      workspace: { review: { status: 'passed', canReturn: true } }
    })

    const active = (await test.runs.load()).activeRun!
    expect(active.evidence?.sourceDigest).not.toBe(firstDigest)
    expect(active.reviewHistory?.map(({ verdict }) => verdict)).toEqual(['needs-work', 'passed'])
    expect(active.completion?.submissionDigest).toBeTruthy()
    expect(active.completion?.submissionDigest).not.toBe(firstDigest)

    const semanticCalls = test.evaluatorCallCount()
    const returned = await test.service.returnPassedPractice()
    expect(test.evaluatorCallCount()).toBe(semanticCalls)
    expect(returned).toEqual(active.completion)
    expect((await test.runs.load()).archivedRuns.at(-1)).toMatchObject({
      outcome: 'completed',
      retainedRun: {
        runId: active.runId,
        binding: { threadId: active.binding.threadId, workspaceRoot: test.workspaceRoot },
        completion: { submissionDigest: active.completion?.submissionDigest }
      }
    })
  })

  it('reopens an archived v2 pass in the same task for revision and records a fresh completion', async () => {
    const test = await harness({ approve: true })
    await test.service.review()
    await test.service.returnPassedPractice()
    const masteryDecisions = Object.fromEntries([
      ...[1, 4, 5, 6].map((index) => [`assessment:mastery-${index}`, 'correct:1'])
    ])
    await test.progress.save({
      currentLessonId: 'module-2',
      currentCourseLessonId: 'm2-portfolio-brief',
      checkpointId: 'm2-portfolio-mastery',
      sceneId: 'module-2-portfolio-mastery-summary',
      sceneHistory: ['module-2-portfolio-practice'],
      completedCheckpointIds: ['m2-portfolio-planning'],
      decisions: masteryDecisions
    })
    const completion = new PortfolioModuleCompletionService(
      test.progress,
      test.workspaceRepository,
      test.runs,
      new PracticeDefinitionRepository(join(process.cwd(), '..', 'pilot-workspace', 'course', 'practices')),
      new PortfolioPlanningEvidenceAdapter(undefined, () => new Date(portfolioPackageTimestamp)),
      () => new Date(portfolioPackageTimestamp)
    )
    const first = await completion.completeModuleTwo()
    const firstFinal = first.practiceCompletions.find((receipt) => receipt.checkpointId === 'm2-portfolio-complete')!
    const archived = await test.runs.load()
    const retained = archived.archivedRuns.at(-1)!.retainedRun!
    await writeFile(
      join(test.workspaceRoot, 'planning/portfolio-brief.md'),
      `${portfolioPackageDocuments['planning/portfolio-brief.md']}\n\nRevised audience evidence.`,
      'utf8'
    )

    await expect(completion.completeModuleTwo()).rejects.toThrow('changed')
    await test.coordinator.loadWorkspace({ practiceId: retained.practiceId, practiceVersion: retained.practiceVersion })
    const reopened = (await test.runs.load()).activeRun!
    expect(reopened).toMatchObject({
      runId: retained.runId,
      generation: retained.generation + 1,
      binding: retained.binding,
      reviewStatus: 'not-reviewed',
      reviewHistory: []
    })
    expect(reopened.packageApproval).toBeUndefined()
    expect(reopened.reviewResult).toBeUndefined()
    expect(reopened.completion).toBeUndefined()
    const reopenedRecord = await test.runs.load()
    await test.coordinator.loadWorkspace({ practiceId: reopened.practiceId, practiceVersion: reopened.practiceVersion })
    expect(await test.runs.load()).toEqual(reopenedRecord)

    await test.coordinator.approvePortfolioPackage({
      practiceId: reopened.practiceId,
      practiceVersion: reopened.practiceVersion,
      runId: reopened.runId,
      generation: reopened.generation,
      courseRunId: test.courseRunId,
      sourceDigest: reopened.evidence!.sourceDigest!,
      approvePrd: true,
      approvePlan: true
    })
    await test.service.review()
    await test.service.returnPassedPractice()
    const second = await completion.completeModuleTwo()
    const finalReceipts = second.practiceCompletions.filter((receipt) => receipt.checkpointId === 'm2-portfolio-complete')
    expect(finalReceipts).toHaveLength(2)
    expect(finalReceipts[0]).toEqual(firstFinal)
    expect(finalReceipts[1]?.submissionDigest).not.toBe(firstFinal.submissionDigest)
    await expect(new PortfolioModuleCompletionService(
      test.progress,
      test.workspaceRepository,
      test.runs,
      new PracticeDefinitionRepository(join(process.cwd(), '..', 'pilot-workspace', 'course', 'practices')),
      new PortfolioPlanningEvidenceAdapter(undefined, () => new Date(portfolioPackageTimestamp)),
      () => new Date(portfolioPackageTimestamp)
    ).completeModuleTwo()).resolves.toEqual(second)
  })
})
