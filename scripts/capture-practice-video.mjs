// Capture the shipped Practice UI in a disposable, explicitly simulated profile.
// Run before editing/building the walkthrough gate, or seed the introduction
// receipt in this disposable profile when re-recording a later application.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { createDisposablePracticeWorkspace } from '../course-companion/tests/support/disposable-practice-workspace.mjs'

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(join(repository, 'course-companion/package.json'))
const { _electron: electron } = require('playwright-core')
const executablePath = require('electron')
const { createElement } = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const ts = require('typescript')
const componentCache = new Map()
function component(path) {
  const absolute = resolve(path)
  if (componentCache.has(absolute)) return componentCache.get(absolute)
  const exports = {}
  componentCache.set(absolute, exports)
  const source = ts.transpileModule(readFileSync(absolute, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX
  } }).outputText
  new Function('require', 'exports', source)(id => {
    if (id.startsWith('.')) {
      const base = resolve(dirname(absolute), id)
      const dependency = [base + '.ts', base + '.tsx'].find(existsSync)
      if (dependency) return component(dependency)
    }
    return require(id)
  }, exports)
  return exports
}
function exampleCorrection() {
  const { PracticeProgress } = component(join(repository, 'course-companion/src/renderer/src/components/PracticeProgress.tsx'))
  const observedAt = '2026-11-15T00:00:00.000Z'
  const checklist = [
    ['set-effort', 'Chọn Effort High'], ['set-speed', 'Chọn Speed Standard'],
    ['set-approval', 'Chọn Approval: Approve for me'], ['disable-full-access', 'Giữ Full access ở trạng thái tắt']
  ].map(([id, title]) => ({ id, title, status: id === 'set-effort' ? 'current' : 'completed' }))
  const workspace = { schemaVersion: 1, phase: 'active', title: 'Thiết lập Codex an toàn', objective: '', expectedOutcome: '', checklist,
    review: { status: 'needs-work', canReview: true, canReturn: false, result: {
      schemaVersion: 1, practiceId: 'm1-codex-safe-setup', practiceVersion: '2.0.0', runId: 'video-example', verdict: 'needs-work',
      summary: 'Ba cài đặt đã đúng. Đổi Effort thành High trong cùng task Codex, rồi kiểm tra lại.',
      criteria: [{ criterionId: 'effort-matches', status: 'unsatisfied', evidenceRefs: ['example-configuration'], explanation: 'Effort hiện là Medium. Bài này cần High.' }],
      reviewedAt: observedAt, sourceDigest: '0'.repeat(64) } },
    configuration: { schemaVersion: 1, runId: 'video-example', threadId: 'video-task', source: 'thread-resume', eventTimestampMs: 1,
      observedAt, freshness: 'fresh', connection: 'connected', model: { protocolValue: 'gpt-5.6-sol', label: '5.6 Sol' },
      reasoningEffort: { protocolValue: 'medium', label: 'Medium' }, serviceTier: { protocolValue: 'standard', label: 'Standard' },
      approvalPolicy: { protocolValue: 'on-request', label: 'Approve for me' }, fullAccess: { protocolValue: 'off', label: 'Off' },
      sandboxType: 'workspaceWrite', activePermissionProfile: null },
    activePractice: { runId: 'video-example', generation: 1, practiceId: 'm1-codex-safe-setup', practiceVersion: '2.0.0', executorChatName: 'Practice · Module 1 · Ví dụ của Minh', startedAt: observedAt },
    presentation: { fullPanel: 'teacher', compactPanel: 'teacher' }, capabilities: { canStartNew: true, canResume: true, selectiveTransferAvailable: false, selectiveTransferReason: '' } }
  return renderToStaticMarkup(createElement(PracticeProgress, { workspace, showObjective: false }))
}
const output = join(repository, '.superpowers/qa/practice-video/captures')
await mkdir(output, { recursive: true })

async function capture(ready) {
  const profile = await mkdtemp(join(tmpdir(), 'practice-video-capture-'))
  const workspace = await createDisposablePracticeWorkspace({ repositoryRoot: repository })
  let app
  let page
  async function shot(surface, name) {
    await surface.evaluate(() => document.fonts.ready)
    await delay(500)
    await surface.screenshot({ path: join(output, `${name}.png`) })
    console.log(`Captured ${name}`)
  }
  try {
    app = await electron.launch({ executablePath, args: [join(repository, 'course-companion/out/main/index.js')], env: {
      ...process.env, COURSE_COMPANION_USER_DATA_DIR: profile,
      COURSE_COMPANION_WORKSPACE_ROOT: workspace.root,
      COURSE_COMPANION_FAKE_CODEX: '1', COURSE_COMPANION_FAKE_CONFIGURATION_READY: ready ? '1' : '0',
      COURSE_COMPANION_FAKE_TEACHER_LIVE_MODE: '0', COURSE_COMPANION_FAKE_TEACHER_FAIL_ONCE: '0'
    } })
    page = app.windows().find(w => w.url().includes('#/learning'))
      ?? await app.waitForEvent('window', { predicate: w => w.url().includes('#/learning') })
    page.setDefaultTimeout(15000)
    page.on('pageerror', error => console.error('Renderer:', error.message))
    await page.waitForFunction(() => Boolean(globalThis.courseCompanion))
    await page.setViewportSize({ width: 1180, height: 780 })
    await page.evaluate(() => globalThis.courseCompanion.saveProgress({ currentLessonId: 'module-1', currentCourseLessonId: 'm1-agents-and-skills',
      checkpointId: 'm1-agents-and-skills', sceneId: 'module-1-skills-intro', sceneHistory: [], completedCheckpointIds: [], decisions: {} }))
    // Re-recording support is test-profile-only; never add a production bypass.
    const manifest = JSON.parse(await readFile(join(repository, 'course-companion/shared/practice-video-manifest.json'), 'utf8'))
    const saved = await page.evaluate(() => globalThis.courseCompanion.loadProgress())
    await writeFile(join(profile, 'practice-video.json'), JSON.stringify([{ courseRunId: saved.progress.courseRunId,
      videoId: manifest.videoId, version: manifest.version, watched: manifest.durationSeconds,
      position: 0, confirmed: true }]))
    await page.reload()
    await page.getByRole('button', { name: 'Mở Course Companion', exact: true }).click()
    await delay(800)
    await page.getByRole('button', { name: /MODULE 1.*MỞ BÀI HỌC/ }).click()
    for (let i = 0; i < 12 && !await page.locator('.practice-brief-overlay').isVisible(); i++) {
      await page.locator('.pixel-choice.is-primary').filter({ visible: true }).first().click()
      await delay(400)
    }
    await page.locator('.practice-brief-overlay').waitFor()
    if (ready) {
      await shot(page, 'introduction')
      await page.getByText('Xem bốn cài đặt cần kiểm tra', { exact: true }).click()
      await shot(page, 'settings-reference')
    }
    await page.getByRole('button', { name: 'Bắt đầu thực hành', exact: true }).click()
    await page.getByRole('button', { name: 'Bắt đầu Practice mới', exact: true }).waitFor({ state: 'attached' })
    const compact = app.windows().find(w => w.url().includes('#/companion'))
      ?? await app.waitForEvent('window', { predicate: w => w.url().includes('#/companion') })
    compact.setDefaultTimeout(15000)
    await compact.setViewportSize({ width: 560, height: 780 })
    await compact.getByRole('button', { name: 'Mở cửa sổ Triết', exact: true }).click()
    await compact.getByRole('button', { name: 'Cần gợi ý cho Practice?', exact: true }).waitFor()
    const guide = compact.locator('.practice-guide')
    if (await guide.isVisible()) await guide.getByRole('button', { name: /Bỏ qua/ }).first().click()
    await shot(compact, ready ? 'practice-panel' : 'before-correction')
    if (ready) {
      await compact.getByRole('button', { name: 'Cần gợi ý cho Practice?', exact: true }).click()
      await compact.locator('.practice-hint').waitFor()
      await shot(compact, 'hint')
      await compact.getByRole('button', { name: 'Đóng gợi ý', exact: true }).click()
      await compact.locator('.practice-compact-details > summary').click()
      await compact.locator('.practice-compact-checklist button').first().click()
      await shot(compact, 'steps')
      if (await compact.locator('.practice-video-replay > summary').count()) {
        await compact.locator('.practice-video-replay > summary').click()
        await shot(compact, 'video-replay')
        await compact.locator('.practice-video-replay > summary').click()
      }
    }
    await compact.getByRole('button', { name: 'Mở Triết toàn màn hình', exact: true }).click()
    await page.locator('.pixel-teacher-overlay').waitFor()
    await delay(900)
    if (await page.locator('.practice-guide').isVisible()) {
      await page.locator('.practice-guide').getByRole('button', { name: /Bỏ qua/ }).first().click()
    }
    // Old builds can restore the retired tour from another window's stale view.
    // Recording only: the owner explicitly retired this overlay in the new UI.
    await page.addStyleTag({ content: '.practice-guide-layer { display: none !important; }' })
    if (ready) await shot(page, 'full-panel')
    if (ready) {
      await page.getByRole('button', { name: 'Cập nhật và kiểm tra tiến độ Practice', exact: true }).click()
      await page.locator('.practice-success, .practice-review-result').first().waitFor()
    } else {
      // A deliberately named, synthetic one-mismatch example rendered by the
      // production component. No fake lifecycle result is written to progress.
      await page.locator('.pixel-practice').evaluate((element, html) => { element.innerHTML = html }, exampleCorrection())
      await page.locator('.pixel-practice-review__primary [role="status"] > strong').evaluate(element => { element.textContent = 'Có mục cần bổ sung' })
      await page.locator('.pixel-practice').evaluate(element => { element.scrollTop = 0 })
    }
    await shot(page, ready ? 'passed' : 'needs-work')
    if (ready) {
      await page.getByRole('button', { name: 'Lưu kết quả và quay lại khóa học', exact: true }).click()
      await page.locator('main[data-scene-id="module-1-mastery"]').waitFor()
      await shot(page, 'return-to-course')
    }
  } catch (error) {
    for (const surface of app?.windows() ?? []) console.error(surface.url(), await surface.locator('body').innerText().catch(() => 'unavailable'))
    await page?.screenshot({ path: join(output, 'failure.png') }).catch(() => {})
    console.error(await page?.locator('body').innerText().catch(() => 'No renderer'))
    throw error
  } finally {
    await app?.close()
    await workspace.cleanup()
    assert.ok(resolve(profile).startsWith(resolve(tmpdir()) + sep) && profile.includes('practice-video-capture-'))
    await rm(profile, { recursive: true, force: true })
  }
}

if (!process.argv.includes('--needs-work-only')) await capture(true)
await capture(false)
await writeFile(join(output, 'source.json'), JSON.stringify({ simulated: true, personalData: false,
  description: 'Shipped Course Companion components, isolated deterministic Codex/Teacher; not learner evidence.',
  capturedAt: new Date().toISOString() }, null, 2))
