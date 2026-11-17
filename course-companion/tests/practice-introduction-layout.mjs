import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'
import electronExecutable from 'electron'
import { _electron as electron } from 'playwright-core'

// Render the real shared introduction with its production stylesheet.
// This is isolated presentation QA, not learner or live AI acceptance.
const require = createRequire(import.meta.url)
const componentCache = new Map()
function loadComponent(path) {
  const absolute = resolve(path)
  if (componentCache.has(absolute)) return componentCache.get(absolute)
  const exports = {}
  componentCache.set(absolute, exports)
  const compiled = ts.transpileModule(readFileSync(absolute, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX
  } }).outputText
  new Function('require', 'exports', compiled)((id) => {
    if (id.startsWith('.')) {
      const base = resolve(dirname(absolute), id)
      const dependency = [base + '.ts', base + '.tsx'].find((candidate) => existsSync(candidate))
      if (dependency) return loadComponent(dependency)
    }
    return require(id)
  }, exports)
  return exports
}
const { PracticeIntroduction } = loadComponent('src/renderer/src/components/PracticeIntroduction.tsx')
const { getPracticeIntroduction } = loadComponent('src/renderer/src/components/practice-introduction-copy.ts')
const { PracticeProgress } = loadComponent('src/renderer/src/components/PracticeProgress.tsx')
const root = await mkdtemp(join(tmpdir(), 'practice-introduction-layout-'))
const screenshots = resolve('../.superpowers/sdd/screenshots/practice-introductions')
await mkdir(screenshots, { recursive: true })
const assets = resolve('out/renderer/assets')
const stylesheet = (await readdir(assets)).find((name) => name.endsWith('.css'))
assert.ok(stylesheet, 'Build Course Companion before layout QA')
const main = join(root, 'main.cjs')
await writeFile(main, `const {app, BrowserWindow}=require('electron'); app.whenReady().then(() => {
  const window = new BrowserWindow({show:true, width:1180, height:780, webPreferences:{contextIsolation:true, sandbox:true, backgroundThrottling:false}});
  window.loadURL('about:blank');
});`)
const measurements = []
let app
try {
  app = await electron.launch({ executablePath: electronExecutable, args: [main] })
  const page = await app.firstWindow()
  for (const [index, id] of ['m1-codex-safe-setup', 'm2-portfolio-planning', 'm3-portfolio-build', 'm4-portfolio-release'].entries()) {
    const introduction = getPracticeIntroduction(id)
    const markup = renderToStaticMarkup(createElement(PracticeIntroduction, {
      introduction, showReference: true,
      children: createElement('div', { className: 'practice-brief-actions' },
        createElement('button', { type: 'button', className: 'is-primary' }, 'Bắt đầu thực hành'))
    }))
    const fixture = join(root, `module-${index + 1}.html`)
    await writeFile(fixture, `<meta charset="utf-8"><link rel="stylesheet" href="${pathToFileURL(join(assets, stylesheet)).href}">
      <main class="practice-brief-overlay practice-workflow has-clear-introduction">
        <header class="practice-brief-header"><button aria-label="Đóng trang Practice">×</button><div><small>Practice</small><strong>${introduction.title}</strong></div><span aria-hidden="true">◆</span></header>
        <section class="practice-brief-card" aria-labelledby="practiceObjective">${markup}</section>
      </main>`)
    for (const width of [1180, 390, 320]) {
      await page.setViewportSize({ width, height: 780 })
      await page.goto(pathToFileURL(fixture).href)
      await page.evaluate(() => globalThis.document.fonts.ready)
      const layout = await page.evaluate(() => {
        const action = globalThis.document.querySelector('.practice-brief-actions button').getBoundingClientRect()
        return {
          overflow: globalThis.document.body.scrollWidth > globalThis.innerWidth || globalThis.document.documentElement.scrollWidth > globalThis.innerWidth,
          actionBottom: action.bottom, viewportHeight: globalThis.innerHeight,
          steps: globalThis.document.querySelectorAll('.practice-setup-instructions li').length,
          referenceOpen: globalThis.document.querySelector('details').open
        }
      })
      measurements.push({ module: index + 1, width, ...layout })
      assert.equal(layout.overflow, false)
      assert.equal(layout.steps, 3)
      assert.equal(layout.referenceOpen, false)
      if (width === 1180) assert.ok(layout.actionBottom <= layout.viewportHeight, 'Desktop start action fits the first screen')
      await page.screenshot({ path: join(screenshots, `module-${index + 1}-${width}.png`), animations: 'disabled' })
      const summary = page.locator('.practice-setup-reference > summary')
      await summary.focus()
      await summary.press('Enter')
      assert.equal(await page.locator('details').getAttribute('open'), '')
      assert.equal(await page.evaluate(() => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth), false)
      if (width === 320) {
        await summary.scrollIntoViewIfNeeded()
        await page.screenshot({ path: join(screenshots, `module-${index + 1}-${width}-reference.png`), animations: 'disabled' })
      }
      await summary.press('Enter')
      assert.equal(await page.locator('details').getAttribute('open'), null)
    }
  }
  const workspace = {
    schemaVersion: 1, phase: 'active', title: 'Practice', objective: 'Practice', expectedOutcome: 'Practice',
    checklist: [
      { id: 'set-model', title: 'Chọn Model 5.6 Sol', status: 'completed' },
      { id: 'set-effort', title: 'Chọn Effort Medium hoặc High', status: 'current' },
      { id: 'set-speed', title: 'Chọn Speed Standard', status: 'completed' },
      { id: 'set-approval', title: 'Chọn Approval: Approve for me', status: 'completed' },
      { id: 'disable-full-access', title: 'Giữ Full access ở trạng thái tắt', status: 'pending' }
    ],
    review: { status: 'needs-work', canReview: true, canReturn: false,
      result: { criteria: [{ criterionId: 'effort-matches', status: 'unsatisfied', explanation: 'Effort cần là Medium hoặc High.' }] },
      comparison: { kind: 'first-review', needsReverification: [], newlyVerified: [] }
    },
    activePractice: { runId: 'disposable-layout', generation: 1, practiceId: 'm1-codex-safe-setup', practiceVersion: '2.0.0', executorChatName: 'Practice', startedAt: '2026-10-28T00:00:00Z' },
    presentation: { fullPanel: 'progress', compactPanel: 'progress' },
    capabilities: { canStartNew: true, canResume: true, selectiveTransferAvailable: false, selectiveTransferReason: '' }
  }
  for (const state of ['needs-work', 'passed']) {
    const view = state === 'passed' ? { ...workspace, review: { status: 'passed', canReview: true, canReturn: true },
      checklist: workspace.checklist.map((step) => ({ ...step, status: 'completed' })) } : workspace
    const markup = renderToStaticMarkup(createElement(PracticeProgress, { workspace: view, compact: true, onReturn: () => {} }))
    const fixture = join(root, `${state}.html`)
    await writeFile(fixture, `<meta charset="utf-8"><link rel="stylesheet" href="${pathToFileURL(join(assets, stylesheet)).href}">
      <main class="pixel-companion-surface--expanded"><section class="pixel-teacher-panel practice-workflow" style="max-width:560px;margin:auto">
        <header><div class="pixel-teacher-identity"><strong>Duyệt Practice</strong></div></header>
        <section class="pixel-practice">${markup}</section>
      </section></main>`)
    for (const width of [560, 390, 320]) {
      await page.setViewportSize({ width, height: 780 })
      await page.goto(pathToFileURL(fixture).href)
      await page.evaluate(() => globalThis.document.fonts.ready)
      assert.equal(await page.evaluate(() => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth), false)
      if (state === 'needs-work') {
        const next = await page.locator('.practice-compact-next').boundingBox()
        const progress = await page.locator('.practice-compact-progress').boundingBox()
        const disclosure = await page.locator('.practice-compact-details > summary').boundingBox()
        assert.ok(next.y + next.height <= progress.y)
        assert.ok(progress.y + progress.height <= disclosure.y)
        assert.equal(await page.getByText('Đã hoàn tất lần kiểm tra đầu tiên.', { exact: true }).count(), 0)
      } else {
        await page.getByRole('heading', { name: 'Làm tốt lắm!', exact: true }).waitFor()
        const action = await page.getByRole('button', { name: 'Lưu kết quả và quay lại khóa học', exact: true }).boundingBox()
        assert.ok(action.y + action.height <= 780)
        await page.emulateMedia({ reducedMotion: 'reduce' })
        assert.equal(await page.locator('.practice-success-badge svg').evaluate((element) => globalThis.getComputedStyle(element).animationName), 'none')
      }
      await page.screenshot({ path: join(screenshots, `review-${state}-${width}.png`), animations: 'disabled' })
    }
  }
  await writeFile(join(screenshots, 'measurements.json'), JSON.stringify(measurements, null, 2))
  console.log('All four Practice introductions and needs-work/success states: desktop/narrow no overflow, next-action hierarchy, return action, keyboard disclosure and reduced motion passed')
} finally {
  await app?.close()
  await rm(root, { recursive: true, force: true })
}
