import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import electronExecutable from 'electron'
import { _electron as electron } from 'playwright-core'

// Mount the real Teacher components with deferred, explicitly simulated replies.
// This tests completion feedback and busy ownership, not live grading quality.
const root = await mkdtemp(join(tmpdir(), 'practice-review-feedback-'))
const screenshots = resolve('../.superpowers/qa/review-feedback')
await mkdir(screenshots, { recursive: true })
const main = join(root, 'main.cjs')
await mkdir(join(root, 'data'))
await writeFile(main, `const { app, BrowserWindow } = require('electron');
app.setPath('userData', ${JSON.stringify(join(root, 'data'))});
app.whenReady().then(() => {
  const window = new BrowserWindow({ show: true, width: 1180, height: 780,
    webPreferences: { contextIsolation: true, sandbox: true } });
  window.loadFile(${JSON.stringify(join(root, 'index.html'))});
});`)
await writeFile(join(root, 'index.html'), '<meta charset="utf-8"><link rel="stylesheet" href="fixture.css"><style>body{margin:0;background:#000}</style><div id="root"></div><script src="fixture.js"></script>')
await build({
  stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
import { createRoot } from 'react-dom/client'
import { TeacherWorkspace } from './src/renderer/src/components/TeacherWorkspace'
import '@fontsource/be-vietnam-pro/400.css'
import '@fontsource/be-vietnam-pro/700.css'
import '@fontsource/be-vietnam-pro/800.css'
import './src/renderer/src/styles.css'
const root = createRoot(document.getElementById('root'))
let workspace
let pending
let fixtureId = 0
let listener = () => {}
let holdStartup = false
let releaseStartup
window.courseCompanion = {
  loadCompanionState: async () => {
    if (holdStartup) await new Promise(resolve => { releaseStartup = resolve })
    return { mode: 'expanded', conversation: { messages: [], recovered: false }, teacher: { connection: 'simulated', memory: 'ready' } }
  },
  loadPracticeWorkspace: async () => structuredClone(workspace),
  getRuntimeInfo: async () => ({ testFixturesEnabled: false }),
  loadPracticeState: async () => ({ missionId: 'feedback-fixture', status: 'idle' }),
  loadProgress: async () => ({ status: 'returning', progress: { courseRunId: 'fixture-course', currentLessonId: 'module-3', checkpointId: 'm3-build', sceneId: 'fixture' } }),
  onPracticeWorkspaceChanged: callback => { listener = callback; return () => { listener = () => {} } },
  setFullTeacherVisible: async () => {},
  openPracticeTask: async () => {},
  approvePortfolioPackage: async () => {
    workspace.portfolioPackage.approved = true
    return structuredClone(workspace)
  },
  reviewPractice: () => new Promise((resolve, reject) => { pending = { resolve, reject } })
}
window.feedbackFixture = {
  mount(embedded, restoreSavedReview = false) {
    const savedReview = restoreSavedReview ? structuredClone(workspace.review) : null
    holdStartup = restoreSavedReview
    releaseStartup = null
    fixtureId++
    pending = null
    workspace = {
      schemaVersion: 1, phase: 'active', title: 'Simulated Module 3 review', objective: 'Fixture only', expectedOutcome: 'Fixture only',
      startPrompt: 'Simulated instructions. '.repeat(180),
      activePractice: { runId: 'fixture-' + fixtureId, generation: 1, practiceId: 'm3-portfolio-build', practiceVersion: '2.0.0', executorChatName: 'Fixture', startedAt: '2026-10-29T00:00:00Z' },
      presentation: { compactPanel: 'progress', fullPanel: 'progress' },
      checklist: Array.from({ length: 5 }, (_, index) => ({ id: 'fixture-step-' + index, title: 'Simulated step ' + index, status: 'pending' })),
      review: { status: 'not-reviewed', canReview: true, canReturn: false },
      portfolioPackage: { kind: 'build', ready: true, approved: false, sourceDigest: 'a'.repeat(64), artifactPaths: [], issues: [], unexpectedPaths: [] }
    }
    if (savedReview) {
      savedReview.result.runId = workspace.activePractice.runId
      workspace.review = savedReview
    }
    root.render(<main className={embedded ? 'pixel-teacher-overlay is-practice-full' : 'pixel-companion-surface pixel-companion-surface--expanded'}>
      <TeacherWorkspace key={fixtureId} embedded={embedded} onClose={() => {}} />
    </main>)
  },
  isStartupPending() { return Boolean(releaseStartup) },
  releaseStartup() { holdStartup = false; releaseStartup(); releaseStartup = null },
  settle(verdict) {
    if (!pending) throw new Error('No pending fixture review')
    if (verdict === 'error') {
      pending.resolve({ error: { code: 'review-unavailable', message: 'Simulated review failure; retry is available.' } })
      return
    }
    workspace.review = {
      status: verdict, canReview: true, canReturn: verdict === 'passed',
      result: { schemaVersion: 1, practiceId: 'm3-portfolio-build', practiceVersion: '2.0.0', runId: workspace.activePractice.runId,
        verdict, summary: 'Simulated review result, not learner evidence.', reviewedAt: new Date().toISOString(), sourceDigest: String(fixtureId).repeat(64).slice(0, 64),
        criteria: [{ criterionId: 'final-validation-current', status: verdict === 'passed' ? 'satisfied' : 'unverifiable', evidenceRefs: [], explanation: 'Simulated criterion feedback.' }] }
    }
    pending.resolve({ workspace: structuredClone(workspace) })
  },
  refresh() { listener() }
}
` },
  outfile: join(root, 'fixture.js'), bundle: true, platform: 'browser', format: 'iife', jsx: 'automatic',
  loader: { '.png': 'dataurl', '.jpg': 'dataurl', '.mp4': 'file', '.vtt': 'file', '.woff': 'dataurl', '.woff2': 'dataurl' }, logLevel: 'silent'
})

let app
try {
  app = await electron.launch({ executablePath: electronExecutable, args: [main] })
  const page = await app.firstWindow()
  await page.goto(pathToFileURL(join(root, 'index.html')).href)
  for (const embedded of [false, true]) {
    for (const verdict of ['needs-work', 'passed', 'error']) {
      await page.setViewportSize({ width: embedded ? 1180 : 380, height: embedded ? 780 : 640 })
      await page.evaluate(embedded => globalThis.feedbackFixture.mount(embedded), embedded)
      const acceptance = page.getByRole('checkbox', { name: 'Tôi đã xem website, đối chiếu kết quả kiểm tra và chấp nhận phiên bản hiện tại.', exact: true })
      await acceptance.waitFor()
      await acceptance.check()
      await page.getByRole('button', { name: 'Chấp nhận website và nộp bài', exact: true }).click()
      const reviewButton = page.getByRole('button', { name: 'Cập nhật và kiểm tra tiến độ Practice', exact: true })
      assert.equal(await reviewButton.isDisabled(), true)
      await page.getByRole('timer').waitFor()
      await page.waitForFunction(() => globalThis.document.querySelector('[role="timer"]')?.textContent !== '0 giây')
      await page.emulateMedia({ reducedMotion: 'reduce' })
      assert.equal(await page.locator('.pixel-review-spinner').evaluate(element => globalThis.getComputedStyle(element).animationName), 'none')
      await page.evaluate(verdict => globalThis.feedbackFixture.settle(verdict), verdict)
      await page.waitForFunction(() => {
        const element = globalThis.document.activeElement
        return element?.matches('.practice-review-result, .practice-success, .practice-package-notice[role="alert"]')
      })
      assert.equal(await reviewButton.isEnabled(), true)
      assert.equal(await page.getByRole('timer').count(), 0)
      const feedback = await page.evaluate(() => {
        const element = globalThis.document.activeElement
        const bounds = element.getBoundingClientRect()
        const embedded = element.closest('.pixel-teacher-panel').classList.contains('is-embedded')
        const scrollArea = element.closest(embedded ? '.pixel-practice-review' : '.pixel-practice').getBoundingClientRect()
        return { visible: bounds.top >= Math.max(0, scrollArea.top) - 1
            && bounds.top < Math.min(globalThis.innerHeight, scrollArea.bottom),
          text: element.textContent, overflow: globalThis.document.documentElement.scrollWidth > globalThis.innerWidth }
      })
      assert.equal(feedback.visible, true, 'Completion or failure must be in view without manual scrolling')
      assert.equal(feedback.overflow, false)
      if (verdict === 'error') assert.match(feedback.text, /Simulated review failure/)
      else if (verdict === 'needs-work') assert.match(feedback.text, /Simulated review result/)
      else assert.match(feedback.text, /Làm tốt lắm/)
      await app.evaluate(({ BrowserWindow }) => {
        const window = BrowserWindow.getAllWindows()[0]
        window.restore(); window.show(); window.focus()
      })
      await page.waitForFunction(() => !globalThis.document.hidden)
      await page.screenshot({ path: join(screenshots, `${embedded ? 'full' : 'compact'}-${verdict}.png`), animations: 'disabled' })
      // A background refresh of the same result must preserve the reader's place.
      if (verdict !== 'error') {
        await page.getByRole('button', { name: 'Cần gợi ý cho Practice?', exact: true }).focus()
        await page.evaluate(async () => {
          globalThis.feedbackFixture.refresh()
          await new Promise(resolve => globalThis.requestAnimationFrame(() => globalThis.requestAnimationFrame(resolve)))
        })
        assert.equal(await page.getByRole('button', { name: 'Cần gợi ý cho Practice?', exact: true }).evaluate(element => globalThis.document.activeElement === element), true)
      }
      if (verdict === 'needs-work') {
        // The real IPC loader can publish workspace before the rest of startup
        // resolves. Do not consume the focus request while only a loader exists.
        await page.evaluate(embedded => globalThis.feedbackFixture.mount(embedded, true), embedded)
        await page.waitForFunction(() => globalThis.feedbackFixture.isStartupPending())
        await page.getByText('Đang tải không gian của Triết…', { exact: true }).waitFor()
        await page.evaluate(() => globalThis.feedbackFixture.releaseStartup())
        await page.waitForFunction(() => globalThis.document.activeElement?.matches('.practice-review-result'))
      }
      await page.emulateMedia({ reducedMotion: 'no-preference' })
    }
  }
  console.log('Review feedback: deferred Module 3 submissions, elapsed time with reduced motion, busy release, automatic visible needs-work/passed/error feedback, and stable background refresh passed in compact/full views')
} finally {
  await app?.close().catch(() => undefined)
  assert.ok(resolve(root).startsWith(resolve(tmpdir()) + '\\') || resolve(root).startsWith(resolve(tmpdir()) + '/'))
  await rm(root, { recursive: true, force: true })
}
