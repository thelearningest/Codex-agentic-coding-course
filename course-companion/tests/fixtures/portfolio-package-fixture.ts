import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { ExecutorActivitySnapshot, PracticeDefinition } from '../../shared/contracts'
import {
  defaultPracticeWorkspaceRecord,
  type PracticeRunRecord,
  type PracticeRunRepository
} from '../../electron/main/practice-run-repository'
import { collectPortfolioPackage } from '../../electron/main/portfolio-package-evidence'

export const portfolioPackageTimestamp = '2026-09-11T01:00:00.000Z'

export const portfolioPackageDocuments: Record<string, string> = {
  'planning/reference/design-prototype.html': '<title>design-protoype</title><main><h1>Product designer</h1><section>Project Alpha</section></main>',
  'planning/portfolio-brief.md': [
    '# Portfolio brief',
    '## Audience and decision',
    'A product lead should decide whether to invite the owner to an interview.',
    '## Observable success and first-release boundary',
    'The reviewer can find two selected projects and a contact route; a future blog is excluded.'
  ].join('\n\n'),
  'planning/content-evidence-inventory.md': [
    '# Content evidence inventory',
    '## Available material and provenance',
    'Project Alpha has an owner-authored case study and approved screenshots.',
    '## Gaps, privacy, and publication restrictions',
    'Conversion metrics and client names remain excluded until permission is confirmed.'
  ].join('\n\n'),
  'planning/reference/reference.md': [
    '# Visual reference',
    '## Source and useful direction',
    'The referenced editorial portfolio uses clear hierarchy and generous spacing.',
    '## Originality boundary',
    'Create an original layout; do not copy branding, text, imagery, or source code.'
  ].join('\n\n'),
  'planning/PRD.md': [
    '# Portfolio PRD',
    '## Product requirements',
    'REQ-HERO: Introduce the owner and their role before the first project.',
    'REQ-WORK-02: Present two evidence-backed projects on wide and narrow screens.',
    '## Acceptance criteria',
    'A reviewer can locate the owner, both projects, and the contact route with a keyboard.',
    '## Out of scope',
    'A blog, backend, analytics, and publication are excluded from this release.'
  ].join('\n\n'),
  'planning/implementation-plan.md': [
    '# Implementation plan',
    '## Delivery steps and order',
    'First establish the page shell for REQ-HERO, then add project cards for REQ-WORK-02.',
    '## Dependencies and stopping point',
    'Project cards depend on verified inventory content. Stop after local validation for learner review.',
    '## Checks, validation, and expected evidence',
    'Verify REQ-HERO and REQ-WORK-02 on desktop, mobile, and keyboard navigation; retain screenshots and check output.'
  ].join('\n\n')
}

export async function writePortfolioPackage(
  workspaceRoot: string,
  overrides: Record<string, string> = {}
): Promise<void> {
  await Promise.all(Object.entries({ ...portfolioPackageDocuments, ...overrides }).map(async ([path, content]) => {
    await mkdir(join(workspaceRoot, path, '..'), { recursive: true })
    await writeFile(join(workspaceRoot, path), content, 'utf8')
  }))
}

export function portfolioPackageActivity(
  overrides: Partial<ExecutorActivitySnapshot> = {}
): ExecutorActivitySnapshot {
  return {
    schemaVersion: 1,
    runId: 'run-package',
    threadId: 'thread-package',
    status: 'response-ready',
    cursor: 'cursor-package',
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
    observedAt: portfolioPackageTimestamp,
    workspaceBaseline: null,
    configuration: null,
    ...overrides
  }
}

export async function savePortfolioPackageRun(input: {
  runs: PracticeRunRepository
  definition: PracticeDefinition
  workspaceRoot: string
  courseRunId?: string
  approve?: boolean
}): Promise<PracticeRunRecord> {
  const run: PracticeRunRecord = {
    runId: 'run-package',
    generation: 2,
    status: 'active',
    practiceId: input.definition.practiceId,
    practiceVersion: input.definition.version,
    workspaceKind: input.definition.workspaceKind,
    taskPolicy: input.definition.taskPolicy,
    evidenceProfile: input.definition.evidenceProfile,
    binding: {
      runId: 'run-package',
      threadId: 'thread-package',
      name: 'Practice · Module 2 portfolio package',
      workspaceRoot: input.workspaceRoot,
      createdAt: portfolioPackageTimestamp
    },
    startedAt: portfolioPackageTimestamp,
    updatedAt: portfolioPackageTimestamp,
    checklist: input.definition.checklist.map((step, index) => ({
      id: step.id,
      title: step.title,
      status: index === 0 ? 'current' : 'pending',
      dependencyInputs: {}
    })),
    learnerDecisions: {},
    learnerApprovals: {},
    evidence: null,
    invalidations: [],
    stageReceipts: [],
    reviewStatus: 'not-reviewed'
  }
  await input.runs.save({ ...defaultPracticeWorkspaceRecord(), activeRun: run })
  const evidence = await collectPortfolioPackage({
    definition: input.definition,
    runId: run.runId,
    generation: run.generation,
    workspaceRoot: input.workspaceRoot,
    task: { threadId: run.binding.threadId, workspaceRoot: input.workspaceRoot }
  }, () => new Date(portfolioPackageTimestamp))
  const saved = await input.runs.saveEvidence({
    runId: run.runId,
    generation: run.generation,
    practiceId: run.practiceId,
    practiceVersion: run.practiceVersion,
    evidence,
    checklist: run.checklist,
    invalidations: evidence.invalidations,
    updatedAt: portfolioPackageTimestamp
  })
  if (!saved.activeRun) throw new Error('Portfolio package fixture did not persist an active run')
  if (!input.approve) return saved.activeRun
  if (!input.courseRunId) throw new Error('Approved portfolio package fixture requires a course run id')
  const approved = await input.runs.approvePortfolioPackage({
    runId: run.runId,
    generation: run.generation,
    practiceId: run.practiceId,
    practiceVersion: run.practiceVersion,
    courseRunId: input.courseRunId,
    sourceDigest: evidence.sourceDigest!,
    updatedAt: portfolioPackageTimestamp
  })
  if (!approved.activeRun) throw new Error('Portfolio package fixture did not retain the approved run')
  return approved.activeRun
}
