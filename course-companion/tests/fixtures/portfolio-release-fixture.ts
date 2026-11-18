import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import type { PortfolioDeploymentRecord, PracticeCompletionReceipt } from '../../shared/contracts'
import { portfolioReleaseRecordPath } from '../../shared/contracts'
import { applicationSnapshot } from '../../electron/main/portfolio-build-package-evidence'
import { PortfolioReleaseEvidenceAdapter, type PortfolioReleaseContinuation } from '../../electron/main/portfolio-release-evidence-adapter'
import type { PublicPortfolioObservation } from '../../electron/main/public-portfolio-url'
import { PracticeDefinitionRepository } from '../../electron/main/practice-definition-repository'
import { PracticeRunRepository, defaultPracticeWorkspaceRecord } from '../../electron/main/practice-run-repository'
import { PracticeCoordinator } from '../../electron/main/practice-coordinator'
import { PracticeEvidenceAdapterRegistry } from '../../electron/main/practice-evidence-adapter-registry'
import { CodexConfigurationEvidenceAdapter } from '../../electron/main/codex-configuration-evidence-adapter'
import { PlanningPackageEvidenceAdapter } from '../../electron/main/planning-package-evidence-adapter'
import { PortfolioPlanningEvidenceAdapter } from '../../electron/main/portfolio-planning-evidence-adapter'
import { ProgressRepository } from '../../electron/main/progress-repository'
import { PracticeReviewService } from '../../electron/main/practice-review-service'
import type { PracticeReviewEnvelope } from '../../electron/main/practice-review-context'
import { practiceWorkspaceIdentityDigest } from '../../electron/main/practice-run-repository'
import { buildRun, writeBuildPackage } from './portfolio-build-fixture'
import { portfolioPackageActivity } from './portfolio-package-fixture'

const execute = promisify(execFile)
export const releaseObservedAt = '2026-10-22T02:00:00.000Z'
export const releaseFixtureUrl = 'https://portfolio-fixture.vercel.app/'

// Local Git evidence is real. Provider, browser, prerequisite acceptance and AI
// responses below are disposable simulations; this fixture never publishes.
export async function portfolioReleaseFixture(registerRoot: (root: string) => void) {
  const root = await mkdtemp(join(tmpdir(), 'release-package-'))
  registerRoot(root)
  const workspace = join(root, 'portfolio')
  const hooks = join(root, 'empty-hooks')
  await mkdir(workspace)
  await mkdir(hooks)
  await writeBuildPackage(workspace)
  const git = async (...args: string[]) => (await execute('git', [
    '-c', 'user.name=Disposable Practice Fixture', '-c', 'user.email=fixture@example.invalid',
    '-c', 'core.autocrlf=false', '-c', `core.hooksPath=${hooks}`, '-c', 'commit.gpgsign=false', ...args
  ], { cwd: workspace, encoding: 'utf8', windowsHide: true, timeout: 5000 })).stdout.trim()
  await git('init', '--quiet')
  await git('add', '--', 'src', 'index.html', 'package.json')
  await git('commit', '--quiet', '-m', 'Disposable portfolio source fixture; no publication')
  const revision = await git('rev-parse', 'HEAD')
  const baseline = await applicationSnapshot(workspace)
  const sourceCheckpoint = `sha256:${baseline.digest}`
  const definitions = new PracticeDefinitionRepository(join(process.cwd(), '..', 'pilot-workspace/course/practices'))
  const definition = await definitions.load('m4-portfolio-release', '1.0.0')
  const runs = new PracticeRunRepository(join(root, 'data'))
  const run = { ...buildRun(definition, workspace), runId: 'run-release-fixture',
    evidenceProfile: 'portfolio-release' as const, buildSliceReceipts: undefined,
    binding: { ...buildRun(definition, workspace).binding, runId: 'run-release-fixture' } }
  await runs.save({ ...defaultPracticeWorkspaceRecord(), activeRun: run })
  let continuation: PortfolioReleaseContinuation | null = {
    task: run.binding, workspace: { canonicalPath: workspace }, sourceCheckpoint
  }
  const record: PortfolioDeploymentRecord = {
    schemaVersion: 1, moduleThreeSourceCheckpoint: sourceCheckpoint, sourceRevision: revision,
    deployment: { url: releaseFixtureUrl, provider: 'vercel', deploymentId: 'dpl_fixture_simulated',
      sourceRevision: revision, buildStatus: 'ready', deployedAt: '2026-10-22T01:00:00.000Z' },
    validation: { checkedAt: '2026-10-22T01:10:00.000Z', command: 'npm run check', passed: true,
      desktop: { url: releaseFixtureUrl, observations: 'SIMULATED desktop inspection: Alpha project opens correctly; contact link and keyboard focus work without horizontal overflow.' },
      mobile: { url: releaseFixtureUrl, observations: 'SIMULATED mobile inspection: project images fit the viewport; contact link remains visible and tappable without horizontal overflow.' },
      limitations: ['Disposable test data: provider results and browser observations are simulated, not live acceptance.'] },
    publication: { learnerApproved: true, observedPublicAccess: true }
  }
  const recordPath = join(workspace, portfolioReleaseRecordPath)
  await mkdir(join(workspace, 'evidence/module-4'), { recursive: true })
  const writeRecord = async (value: unknown = record) => writeFile(recordPath, JSON.stringify(value), 'utf8')
  await writeRecord()
  type Verify = (url: string) => Promise<PublicPortfolioObservation>
  const verificationCalls: string[] = []
  let verify: Verify = async (url) => ({ url, finalUrl: url, reachable: true, status: 200, checkedAt: releaseObservedAt,
    title: 'SIMULATED portfolio fixture', textExcerpt: 'SIMULATED public response: portfolio owner, Alpha project and contact link.' })
  const adapter = new PortfolioReleaseEvidenceAdapter(async () => structuredClone(continuation), {
    async verify(url) { verificationCalls.push(url); return verify(url) }
  }, () => new Date(releaseObservedAt))
  const source = { async current() { return null } }
  const registry = new PracticeEvidenceAdapterRegistry([
    new CodexConfigurationEvidenceAdapter(source), new PlanningPackageEvidenceAdapter(source),
    new PortfolioPlanningEvidenceAdapter(), adapter
  ])
  const progress = new ProgressRepository(join(root, 'data'), () => new Date(releaseObservedAt))
  const learner = await progress.save({ currentLessonId: 'module-2', currentCourseLessonId: 'm2-portfolio-brief',
    checkpointId: 'm2-portfolio-planning', sceneId: 'module-2-portfolio-practice', sceneHistory: [], completedCheckpointIds: [], decisions: {} })
  // This explicitly simulated prerequisite isolates Module 4 lifecycle tests;
  // the full prior-module learner journey is covered by separate rehearsals.
  const simulatedPrerequisite: PracticeCompletionReceipt = {
    schemaVersion: 1, courseRunId: learner.courseRunId, practiceId: 'm3-portfolio-build', practiceVersion: '2.1.0',
    runId: 'run-simulated-prerequisite', checkpointId: 'm3-complete', status: 'completed', completedAt: releaseObservedAt,
    submissionDigest: 'b'.repeat(64), evidenceSummary: 'SIMULATED Module 3 prerequisite for isolated Module 4 lifecycle test.',
    masterySummary: 'SIMULATED prerequisite; no learner acceptance is claimed.',
    destination: { lessonId: 'module-3', checkpointId: 'm3-complete', sceneId: 'module-3-complete' },
    portfolioBuildHandoff: { schemaVersion: 2, workspace: { canonicalPath: workspace, identityDigest: practiceWorkspaceIdentityDigest(workspace) },
      artifactDigests: { 'application/source': baseline.digest }, sourceCheckpoint, submissionDigest: 'b'.repeat(64),
      approval: { courseRunId: learner.courseRunId, runId: 'run-simulated-prerequisite', generation: 1,
        threadId: run.binding.threadId, workspaceIdentityDigest: practiceWorkspaceIdentityDigest(workspace),
        sourceDigest: 'c'.repeat(64), artifactDigests: { 'application/source': baseline.digest }, recordedAt: releaseObservedAt },
      moduleFourInput: { workspacePath: workspace, sourceCheckpoint } }
  }
  await progress.recordPracticeCompletion(simulatedPrerequisite)
  await progress.save({ currentLessonId: 'module-4', currentCourseLessonId: 'm4-ownership-transfer', checkpointId: 'm4-portfolio-release',
    sceneId: 'module-4-portfolio-practice', sceneHistory: [], completedCheckpointIds: [], decisions: {} })
  let taskReadable = true
  const coordinator = new PracticeCoordinator(runs, definitions, {
    async createTarget() { throw new Error('Tests must keep the original task') },
    async prepareTarget() {}, async openTarget() {}, async validateExistingTarget() { return true }
  }, () => new Date(releaseObservedAt), undefined, async () => {
    if (!taskReadable) throw new Error('PRACTICE_METADATA_BINDING_MISMATCH')
  }, undefined, registry)
  const activity = portfolioPackageActivity({ runId: run.runId, threadId: run.binding.threadId,
    learnerAuthoredPrompts: ['SIMULATED learner: I approve pushing this reviewed source and publishing it to Vercel.',
      'SIMULATED learner: I opened the shared URL on desktop and mobile; Alpha project and contact work. I accept this website.'],
    executorResponses: ['SIMULATED provider result: deployment dpl_fixture_simulated is ready for the recorded revision.'],
    reportedVerificationEvidence: [`SIMULATED npm run check passed; Vercel deployment ready for ${revision}; desktop/mobile links checked.`] })
  const envelopes: PracticeReviewEnvelope[] = []
  let verdict: 'passed' | 'needs-work' = 'passed'
  let duringReview: (() => Promise<void>) | undefined
  const service = new PracticeReviewService(definitions, runs, coordinator, progress,
    { async read() { return structuredClone(activity) } }, {
      async evaluate(envelope) {
        envelopes.push(envelope)
        await duringReview?.()
        return JSON.stringify({ schemaVersion: 1, practiceId: definition.practiceId, practiceVersion: definition.version,
          runId: run.runId, verdict, summary: 'SIMULATED reviewer judgment; no live learner or deployment acceptance.',
          criteria: definition.criteria.map((criterion) => ({ criterionId: criterion.id,
            status: verdict === 'passed' ? 'satisfied' : 'unsatisfied', evidenceRefs: [envelope.evidence[0]!.id],
            explanation: 'SIMULATED evaluation of disposable fixture evidence.' })) })
      }
    }, () => new Date(releaseObservedAt), registry)
  const context = { definition, runId: run.runId, generation: run.generation, workspaceRoot: workspace,
    task: { threadId: run.binding.threadId, workspaceRoot: workspace } }
  const collect = () => adapter.collect(context)
  const approve = async () => {
    const view = await coordinator.loadWorkspace(run)
    const requestedEvidence = (await runs.load()).activeRun?.evidence
    try {
      return await coordinator.approvePortfolioPackage({ ...run, courseRunId: learner.courseRunId,
        sourceDigest: view.portfolioPackage!.sourceDigest!, approveWebsite: true })
    } catch (error) {
      const current = (await runs.load()).activeRun?.evidence
      throw new Error(JSON.stringify({ requestedDigest: view.portfolioPackage?.sourceDigest,
        requestedReady: view.portfolioPackage?.ready, requestedIssues: requestedEvidence?.portfolioRelease?.issues,
        requestedArtifacts: requestedEvidence?.portfolioRelease?.artifacts.map(({ path, digest }) => ({ path, digest })),
        collectedDigest: current?.sourceDigest, issues: current?.portfolioRelease?.issues,
        artifacts: current?.portfolioRelease?.artifacts.map(({ path, digest }) => ({ path, digest })) }), { cause: error })
    }
  }
  return { root, workspace, definitions, definition, runs, run, adapter, coordinator, registry, progress, learner, service,
    setTaskReadable: (readable: boolean) => { taskReadable = readable },
    context, collect, approve, record, recordPath, writeRecord, git, revision, sourceCheckpoint, activity, envelopes, verificationCalls,
    getContinuation: () => continuation!, setContinuation: (next: PortfolioReleaseContinuation | null) => { continuation = next },
    setVerifier: (next: Verify) => { verify = next }, setVerdict: (next: typeof verdict) => { verdict = next },
    duringReview: (callback: () => Promise<void>) => { duringReview = callback } }
}
