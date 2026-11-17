import { mkdir, rm, symlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { portfolioReleaseRecordPath } from '../shared/contracts'
import { portfolioReleaseFixture } from './fixtures/portfolio-release-fixture'
import { currentPortfolioPackageApproval, portfolioPackageIsReady } from '../electron/main/portfolio-package-state'
import { parsePortfolioDeploymentRecord } from '../electron/main/portfolio-release-evidence-adapter'
import { PublicPortfolioUrlVerifier } from '../electron/main/public-portfolio-url'
import { buildPracticeReviewPrompt } from '../electron/main/practice-review-context'

const roots: string[] = []
const fixture = () => portfolioReleaseFixture((root) => roots.push(root))
afterEach(async () => { await Promise.all(roots.splice(0).map((root) =>
  rm(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }))) })

describe('Module 4 deployment evidence', () => {
  it('passes alternate check commands, concise observations and extra metadata to semantic review', async () => {
    const f = await fixture()
    const record = {
      ...f.record, notes: 'Independent release notes are not a schema failure.',
      deployment: { ...f.record.deployment, provider: 'Vercel', buildStatus: 'READY', region: 'Singapore' },
      validation: { ...f.record.validation, command: 'pnpm lint && pnpm test && pnpm build',
        desktop: { ...f.record.validation.desktop, observations: 'Liên kết hoạt động.', viewport: '1280 × 720' },
        mobile: { ...f.record.validation.mobile, observations: 'Không cuộn ngang.', viewport: '360 × 800' }
      }
    }
    expect(parsePortfolioDeploymentRecord(record).validation).toMatchObject(record.validation)
    expect(parsePortfolioDeploymentRecord(record).deployment).toMatchObject({ provider: 'vercel', buildStatus: 'ready' })
    await f.writeRecord(record)
    const evidence = await f.collect()
    expect(evidence.portfolioRelease?.issues).toEqual([])
    const artifact = evidence.portfolioRelease?.artifacts.find((item) => item.path === portfolioReleaseRecordPath)
    expect(artifact?.content).toContain('pnpm lint && pnpm test && pnpm build')
    expect(artifact?.content).toContain('Không cuộn ngang.')
    expect(artifact?.content).toContain('Independent release notes')
    // Collection establishes provenance/readability; no content pass is awarded.
    expect(currentPortfolioPackageApproval({ ...f.run, evidence })).toBeNull()
  })

  it('accepts equivalent revision/checkpoint letter case and URL spelling without editing the record', async () => {
    const f = await fixture()
    const record = structuredClone(f.record)
    record.moduleThreeSourceCheckpoint = record.moduleThreeSourceCheckpoint.toUpperCase()
    record.sourceRevision = record.sourceRevision.toUpperCase()
    record.deployment.sourceRevision = record.deployment.sourceRevision.toLowerCase()
    record.deployment.url = 'https://PORTFOLIO-FIXTURE.vercel.app:443'
    const before = structuredClone(record)
    const parsed = parsePortfolioDeploymentRecord(record)
    expect(parsed.sourceRevision).toBe(f.revision)
    expect(parsed.moduleThreeSourceCheckpoint).toBe(f.sourceCheckpoint)
    expect(parsed.deployment.url).toBe(f.record.deployment.url)
    expect(record).toEqual(before)
    await f.writeRecord(record)
    expect((await f.collect()).portfolioRelease!.issues).toEqual([])
  })

  it('still rejects a different release revision or browser URL path', async () => {
    const f = await fixture()
    const wrongRevision = structuredClone(f.record)
    wrongRevision.deployment.sourceRevision = 'f'.repeat(40)
    expect(() => parsePortfolioDeploymentRecord(wrongRevision)).toThrow('Invalid deployment evidence')
    const wrongUrl = structuredClone(f.record)
    wrongUrl.validation.desktop.url += 'other-website'
    expect(() => parsePortfolioDeploymentRecord(wrongUrl)).toThrow('Missing concrete browser observations')
  })

  it('collects the actual committed local revision and three independent package artifacts', async () => {
    const f = await fixture()
    const evidence = await f.collect()

    expect(f.revision).toMatch(/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/)
    expect(f.record.sourceRevision).toBe(await f.git('rev-parse', 'HEAD'))
    expect(evidence).toMatchObject({ practiceId: f.run.practiceId, practiceVersion: '1.0.0', runId: f.run.runId,
      evidenceProfile: 'portfolio-release', freshness: 'fresh' })
    expect(evidence.portfolioRelease?.issues).toEqual([])
    const source = evidence.portfolioRelease?.artifacts.find((artifact) => artifact.path === 'application/source')
    expect(source?.content).toContain(`Independently verified Git HEAD: ${f.revision}`)
    expect(source?.content).toContain('committed, tracked and clean')
    expect(source?.content).toContain(f.sourceCheckpoint)
    expect(source?.content).toContain(f.run.binding.threadId)
    expect(evidence.portfolioRelease?.artifacts.map((artifact) => artifact.path)).toEqual([
      portfolioReleaseRecordPath, 'application/source', 'deployment/public-url'
    ])
    expect(evidence.portfolioRelease?.deployment).toMatchObject({ reachable: true, status: 200, title: 'SIMULATED portfolio fixture' })
    expect(portfolioPackageIsReady({ ...f.run, evidence })).toBe(true)
    expect(f.verificationCalls).toEqual([f.record.deployment.url])
    expect(await f.git('remote')).toBe('')
  })

  it.each(['missing', 'empty', 'malformed', 'invalid-utf8', 'oversized', 'directory'])(
    'rejects a %s deployment record without consulting the network', async (problem) => {
      const f = await fixture()
      if (problem === 'missing' || problem === 'directory') await rm(f.recordPath)
      if (problem === 'directory') await mkdir(f.recordPath)
      if (problem === 'empty') await writeFile(f.recordPath, '')
      if (problem === 'malformed') await writeFile(f.recordPath, '{broken json')
      if (problem === 'invalid-utf8') await writeFile(f.recordPath, new Uint8Array([0xc3, 0x28]))
      if (problem === 'oversized') await writeFile(f.recordPath, ' '.repeat(64 * 1024 + 1))

      const evidence = await f.collect()

      expect(evidence.portfolioRelease?.issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: portfolioReleaseRecordPath })
      ]))
      expect(portfolioPackageIsReady({ ...f.run, evidence })).toBe(false)
      expect(f.verificationCalls).toEqual([])
    }
  )

  it('rejects a symlinked parent directory instead of reading an external deployment record', async ({ skip }) => {
    const f = await fixture()
    const outside = join(f.root, 'outside-records')
    await mkdir(outside)
    await writeFile(join(outside, 'deployment-record.json'), JSON.stringify(f.record))
    await rm(join(f.workspace, 'evidence/module-4'), { recursive: true })
    try {
      await symlink(outside, join(f.workspace, 'evidence/module-4'), process.platform === 'win32' ? 'junction' : 'dir')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EPERM') { skip('Symlink creation is unavailable on this platform.'); return }
      throw error
    }

    const evidence = await f.collect()

    expect(evidence.portfolioRelease?.issues.some((issue) => issue.path === portfolioReleaseRecordPath)).toBe(true)
    expect(f.verificationCalls).toEqual([])
  })

  it('rejects a deployment record that is itself a symlink', async ({ skip }) => {
    const f = await fixture()
    const outside = join(f.root, 'external-record.json')
    await writeFile(outside, JSON.stringify(f.record))
    await rm(f.recordPath)
    try {
      await symlink(outside, f.recordPath, 'file')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EPERM') { skip('File symlink creation is unavailable on this platform.'); return }
      throw error
    }

    const evidence = await f.collect()

    expect(evidence.portfolioRelease?.issues.some((issue) => issue.path === portfolioReleaseRecordPath)).toBe(true)
    expect(f.verificationCalls).toEqual([])
  })

  it.each(['missing', 'thread', 'task-workspace', 'selected-workspace', 'baseline'])(
    'blocks a %s Module 3 continuation mismatch', async (problem) => {
      const f = await fixture()
      const continuation = structuredClone(f.getContinuation())
      if (problem === 'thread') continuation.task.threadId = 'unrelated-task'
      if (problem === 'task-workspace') continuation.task.workspaceRoot = join(f.root, 'wrong-workspace')
      if (problem === 'selected-workspace') continuation.workspace.canonicalPath = join(f.root, 'wrong-workspace')
      if (problem === 'baseline') continuation.sourceCheckpoint = `sha256:${'d'.repeat(64)}`
      f.setContinuation(problem === 'missing' ? null : continuation)

      const evidence = await f.collect()

      expect(evidence.portfolioRelease?.issues.some((issue) => issue.path === 'module-3/handoff')).toBe(true)
      expect(portfolioPackageIsReady({ ...f.run, evidence })).toBe(false)
      expect(f.verificationCalls).toEqual([])
    }
  )

  it('rejects a collector task context whose workspace differs from the bound portfolio', async () => {
    const f = await fixture()
    const evidence = await f.adapter.collect({ ...f.context,
      task: { ...f.context.task, workspaceRoot: join(f.root, 'unrelated-context-workspace') } })

    expect(evidence.portfolioRelease?.issues.some((issue) => issue.path === 'module-3/handoff')).toBe(true)
    expect(portfolioPackageIsReady({ ...f.run, evidence })).toBe(false)
  })

  it.each(['modified', 'deleted', 'untracked', 'staged', 'ignored'])(
    'blocks %s application source rather than approving a claimed clean deployment', async (problem) => {
      const f = await fixture()
      if (problem === 'ignored') {
        await writeFile(join(f.workspace, '.git/info/exclude'), 'src/ignored.ts\n')
        await writeFile(join(f.workspace, 'src/ignored.ts'), 'export const excludedFromCommit = true')
      } else if (problem === 'deleted') await rm(join(f.workspace, 'src/main.tsx'))
      else await writeFile(join(f.workspace, problem === 'untracked' ? 'src/untracked.ts' : 'src/main.tsx'), 'export const unpublished = true')
      if (problem === 'staged') await f.git('add', '--', 'src/main.tsx')

      const evidence = await f.collect()

      expect(evidence.portfolioRelease?.issues.some((issue) => issue.path === 'application/source')).toBe(true)
      expect(portfolioPackageIsReady({ ...f.run, evidence })).toBe(false)
    }
  )

  it('allows ignored installed dependencies, build output and root Vercel metadata outside the application inventory', async () => {
    const f = await fixture()
    await writeFile(join(f.workspace, '.git/info/exclude'), 'node_modules/\ndist/\n.vercel/\n')
    await mkdir(join(f.workspace, 'node_modules/disposable-dependency'), { recursive: true })
    await mkdir(join(f.workspace, 'dist'))
    await mkdir(join(f.workspace, '.vercel'))
    await writeFile(join(f.workspace, 'node_modules/disposable-dependency/index.js'), 'SIMULATED installed dependency')
    await writeFile(join(f.workspace, 'dist/index.html'), '<p>SIMULATED generated build output</p>')
    await writeFile(join(f.workspace, '.vercel/project.json'), JSON.stringify({ projectId: 'fixture-local-project', orgId: 'fixture-local-org' }))

    const evidence = await f.collect()

    expect(evidence.portfolioRelease?.issues).toEqual([])
    expect(portfolioPackageIsReady({ ...f.run, evidence })).toBe(true)
  })

  it('requires both the deployment revision and current repository HEAD to match the record', async () => {
    const f = await fixture()
    const wrongDeployment = structuredClone(f.record)
    wrongDeployment.deployment.sourceRevision = '0'.repeat(40)
    expect(() => parsePortfolioDeploymentRecord(wrongDeployment)).toThrow('deployment evidence')
    const oldRevision = structuredClone(f.record)
    oldRevision.sourceRevision = '0'.repeat(40)
    oldRevision.deployment.sourceRevision = oldRevision.sourceRevision
    await f.writeRecord(oldRevision)

    const evidence = await f.collect()

    expect(evidence.portfolioRelease?.issues.some((issue) => issue.path === 'application/source')).toBe(true)
    expect(f.verificationCalls).toEqual([])
  })

  it('requires nonempty observations, the same shared URL, reported passing results and sensible timestamps', async () => {
    const f = await fixture()
    const invalidRecords = [
      { ...f.record, validation: { ...f.record.validation, desktop: { ...f.record.validation.desktop, observations: ' ' } } },
      { ...f.record, validation: { ...f.record.validation, command: ' ' } },
      { ...f.record, validation: { ...f.record.validation, mobile: { ...f.record.validation.mobile, url: 'https://different.vercel.app/' } } },
      { ...f.record, validation: { ...f.record.validation, passed: false } },
      { ...f.record, validation: { ...f.record.validation, checkedAt: '2026-10-21T01:00:00.000Z' } },
      { ...f.record, publication: { ...f.record.publication, learnerApproved: false } }
    ]
    for (const record of invalidRecords) expect(() => parsePortfolioDeploymentRecord(record)).toThrow()
    await f.writeRecord({ ...f.record, validation: { ...f.record.validation, checkedAt: '2026-10-23T01:00:00.000Z' } })
    expect((await f.collect()).portfolioRelease?.issues.some((issue) => issue.path === portfolioReleaseRecordPath)).toBe(true)
  })

  it.each(['https://127.0.0.1/', 'https://10.0.0.1/', 'https://portfolio.internal/'])(
    'rejects a private or internal sharing destination %s without network access', async (url) => {
      const f = await fixture()
      const record = structuredClone(f.record)
      record.deployment.url = record.validation.desktop.url = record.validation.mobile.url = url
      await f.writeRecord(record)
      const verifier = new PublicPortfolioUrlVerifier({
        async lookup() { throw new Error('Private destinations must not reach DNS') },
        async request() { throw new Error('Private destinations must not be requested') }
      })
      f.setVerifier((candidate) => verifier.verify(candidate))

      const evidence = await f.collect()

      expect(evidence.portfolioRelease?.issues.some((issue) => issue.path === 'deployment/public-url')).toBe(true)
      expect(evidence.portfolioRelease?.deployment?.reachable).toBe(false)
    }
  )

  it.each(['protected', 'login-page', 'unreachable'])(
    'rejects %s public URL observations', async (problem) => {
      const f = await fixture()
      const verifier = new PublicPortfolioUrlVerifier({
        async lookup() { return [{ address: '8.8.8.8', family: 4 }] },
        async request() {
          if (problem === 'unreachable') throw new Error('SIMULATED network unavailable')
          return { status: problem === 'protected' ? 401 : 200, headers: { 'content-type': 'text/html' },
            body: Buffer.from('<title>Sign in</title><input type="password">') }
        }
      })
      f.setVerifier((candidate) => verifier.verify(candidate))

      const evidence = await f.collect()

      expect(evidence.portfolioRelease?.issues.some((issue) => issue.path === 'deployment/public-url')).toBe(true)
      expect(portfolioPackageIsReady({ ...f.run, evidence })).toBe(false)
    }
  )

  it.each(['record', 'source', 'head'])(
    'rejects a deployment snapshot if %s changes while the public URL is being checked', async (part) => {
      const f = await fixture()
      f.setVerifier(async (url) => {
        if (part === 'record') {
          f.record.validation.limitations.push('Record changed during the simulated network observation.')
          await f.writeRecord()
        } else {
          await writeFile(join(f.workspace, 'src/main.tsx'), 'export const changedDuringPublicCheck = true')
          if (part === 'head') {
            await f.git('add', '--', 'src/main.tsx')
            await f.git('commit', '--quiet', '-m', 'Disposable source changed during public URL check')
          }
        }
        return { url, finalUrl: url, reachable: true, status: 200, checkedAt: '2026-10-22T02:00:00.000Z',
          title: 'SIMULATED portfolio response', textExcerpt: 'SIMULATED network observation after a concurrent local edit.' }
      })

      const evidence = await f.collect()

      expect(portfolioPackageIsReady({ ...f.run, evidence })).toBe(false)
      expect(evidence.portfolioRelease?.issues.length).toBeGreaterThan(0)
    }
  )
})

// Each lifecycle performs repeated real Git checks before and after simulated
// network/review work; allow Windows process startup overhead for those checks.
describe('Module 4 approval and simulated review lifecycle', { timeout: 15_000 }, () => {
  it('preserves saved evidence but blocks acceptance while the bound task cannot be refreshed', async () => {
    const f = await fixture()
    const ready = await f.coordinator.loadWorkspace(f.run)
    expect(ready.portfolioPackage?.ready).toBe(true)
    const before = await f.runs.load()
    f.setTaskReadable(false)
    const unavailable = await f.coordinator.loadWorkspace(f.run)
    expect(unavailable.error).toContain('Chưa thể làm mới bằng chứng từ Codex')
    expect(unavailable.portfolioPackage?.ready).toBe(false)
    expect(await f.runs.load()).toEqual(before)
    f.setTaskReadable(true)
    const recovered = await f.coordinator.loadWorkspace(f.run)
    expect(recovered.error).toBeUndefined()
    expect(recovered.portfolioPackage?.ready).toBe(true)
  })

  it('requires explicit website approval independently of reported publication booleans', async () => {
    const f = await fixture()
    expect((await f.service.review()).workspace.review?.status).toBe('needs-work')
    expect(f.envelopes).toEqual([])
    await expect(f.coordinator.approvePortfolioPackage({ ...f.run, courseRunId: f.learner.courseRunId,
      sourceDigest: (await f.collect()).sourceDigest!, approvePrd: true, approvePlan: true })).rejects.toThrow()

    await f.approve()
    const result = await f.service.review()

    expect(result.workspace.review?.status).toBe('passed')
    expect(result.workspace.portfolioPackage?.kind).toBe('release')
    expect(result.workspace.portfolioPackage?.deployment?.reachable).toBe(true)
    expect(f.envelopes[0]?.portfolioPackage?.taskEvidence?.learnerPrompts).toEqual(f.activity.learnerAuthoredPrompts)
    expect(buildPracticeReviewPrompt(f.envelopes[0]!)).toContain('external publication')
    expect(result.workspace.completion?.destination.sceneId).toBe('module-4-complete')
  })

  it.each(['learner-messages', 'reported-checks', 'task-identity'])(
    'does not accept an AI pass when %s evidence is missing or mismatched', async (problem) => {
      const f = await fixture()
      await f.approve()
      if (problem === 'learner-messages') f.activity.learnerAuthoredPrompts = []
      if (problem === 'reported-checks') {
        f.activity.reportedVerificationEvidence = []
        f.activity.executorResponses = []
      }
      if (problem === 'task-identity') f.activity.threadId = 'unrelated-thread'

      await expect(f.service.review()).rejects.toThrow()

      expect((await f.runs.load()).activeRun?.completion).toBeUndefined()
    }
  )

  it('lets AI judge full task reports when keyword extraction finds no checks', async () => {
    const f = await fixture()
    await f.approve()
    f.activity.reportedVerificationEvidence = []
    f.activity.executorResponses = ['SIMULATED: Liên hệ mở đúng địa chỉ; trang vừa màn hình, có thể đi qua từng mục bằng phím Tab.']
    f.setVerdict('needs-work')
    const result = await f.service.review()
    expect(result.workspace.review?.status).toBe('needs-work')
    expect(result.workspace.completion).toBeUndefined()
    expect(f.envelopes[0]?.portfolioPackage?.taskEvidence?.reportedChecks).toEqual([])
    expect(f.envelopes[0]?.evidence.some((item) => item.kind === 'executor-reported-verification'
      && item.text.includes(f.activity.executorResponses[0]!))).toBe(true)
  })

  it.each(['record', 'source', 'url'])(
    'invalidates approval and passed review when the current %s changes', async (part) => {
      const f = await fixture()
      await f.approve()
      await f.service.review()
      if (part === 'record') {
        f.record.validation.limitations.push('Newly observed limitation after review.')
        await f.writeRecord()
      }
      if (part === 'source') await writeFile(join(f.workspace, 'src/main.tsx'), 'export const changedAfterReview = true')
      if (part === 'url') {
        f.record.deployment.url = f.record.validation.desktop.url = f.record.validation.mobile.url = 'https://changed-fixture.vercel.app/'
        await f.writeRecord()
      }

      const view = await f.coordinator.loadWorkspace(f.run)
      const saved = await f.runs.load()

      expect(view.review?.status).toBe('not-reviewed')
      expect(view.completion).toBeUndefined()
      expect(currentPortfolioPackageApproval(saved.activeRun!)).toBeNull()
      expect(saved.activeRun?.binding).toEqual(f.run.binding)
      expect((await f.service.review()).workspace.review?.status).toBe('needs-work')
    }
  )

  it('keeps a failed simulated review in the same task and allows resubmission', async () => {
    const f = await fixture()
    await f.approve()
    f.setVerdict('needs-work')
    expect((await f.service.review()).workspace.review?.status).toBe('needs-work')
    f.setVerdict('passed')
    expect((await f.service.review()).workspace.review?.status).toBe('passed')
    expect((await f.runs.load()).activeRun?.binding).toEqual(f.run.binding)
  })

  it.each(['source', 'task-consent'])(
    'discards a simulated AI result when %s changes during the review', async (part) => {
      const f = await fixture()
      await f.approve()
      f.duringReview(async () => {
        if (part === 'source') await writeFile(join(f.workspace, 'src/main.tsx'), 'export const changedDuringReview = true')
        else f.activity.learnerAuthoredPrompts!.push('SIMULATED learner: I withdraw my acceptance of this version.')
      })

      await expect(f.service.review()).rejects.toThrow('đã thay đổi')

      expect((await f.runs.load()).activeRun?.completion).toBeUndefined()
    }
  )

  it('returns a passed release directly to Module 4 completion and archives the reviewed attempt', async () => {
    const f = await fixture()
    await f.approve()
    await f.service.review()

    const receipt = await f.service.returnPassedPractice()
    const saved = await f.runs.load()
    const progress = await f.progress.load()

    expect(saved.activeRun).toBeNull()
    expect(saved.archivedRuns.at(-1)).toMatchObject({ outcome: 'completed', retainedRun: { reviewStatus: 'passed', binding: f.run.binding } })
    expect(progress.status).toBe('returning')
    if (progress.status !== 'returning') throw new Error('Disposable learner progress must remain readable')
    expect(progress.progress.sceneId).toBe('module-4-complete')
    expect(progress.progress.completedCheckpointIds).toContain('m4-portfolio-release')
    expect(progress.progress.completedCheckpointIds).toContain('m4-complete')
    expect(receipt.destination.sceneId).toBe('module-4-complete')
    expect(await f.service.returnPassedPractice()).toEqual(receipt)
  })

  it('blocks return after source changes and preserves the original task for another review', async () => {
    const f = await fixture()
    await f.approve()
    await f.service.review()
    await writeFile(join(f.workspace, 'src/main.tsx'), 'export const unpublishedAfterReview = true')

    await expect(f.service.returnPassedPractice()).rejects.toThrow('changed')

    expect((await f.runs.load()).activeRun?.binding).toEqual(f.run.binding)
    expect((await f.runs.load()).activeRun?.completion).toBeUndefined()
    expect((await f.runs.load()).archivedRuns).toEqual([])
  })

  it('requires fresh approval and review when the learner withdraws acceptance after a passed review', async () => {
    const f = await fixture()
    await f.approve()
    const passed = await f.service.review()
    f.activity.learnerAuthoredPrompts!.push('SIMULATED learner: I withdraw acceptance; do not mark this website complete.')

    await expect(f.service.returnPassedPractice()).rejects.toThrow()

    const saved = await f.runs.load()
    expect(saved.activeRun?.reviewStatus).toBe('not-reviewed')
    expect(saved.activeRun?.packageApproval).toBeUndefined()
    expect(saved.activeRun?.completion).toBeUndefined()
    expect(saved.activeRun?.binding).toEqual(f.run.binding)
    expect(saved.archivedRuns).toEqual([])
    const progress = await f.progress.load()
    if (progress.status !== 'returning') throw new Error('Disposable progress must remain readable')
    expect(progress.progress.sceneId).toBe('module-4-portfolio-practice')
    expect(progress.progress.practiceCompletions).not.toContainEqual(passed.workspace.completion)
  })
})
