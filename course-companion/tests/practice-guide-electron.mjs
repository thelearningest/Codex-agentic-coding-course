import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import electronExecutable from 'electron'
import { _electron as electron } from 'playwright-core'
import { createDisposablePracticeWorkspace } from './support/disposable-practice-workspace.mjs'

const profile = await mkdtemp(join(tmpdir(), 'practice-screenshot-guide-'))
const workspace = await createDisposablePracticeWorkspace({ repositoryRoot: resolve('..') })
const shots = resolve('../.superpowers/qa/practice-screenshot-guide')
await mkdir(shots, { recursive: true })
let app
try {
  app = await electron.launch({ executablePath: electronExecutable, args: [resolve('out/main/index.js')], env: {
    ...process.env, ELECTRON_RENDERER_URL: '', COURSE_COMPANION_USER_DATA_DIR: profile,
    COURSE_COMPANION_WORKSPACE_ROOT: workspace.root, COURSE_COMPANION_FAKE_CODEX: '1',
    COURSE_COMPANION_FAKE_CONFIGURATION_READY: '1'
  } })
  const page = app.windows().find(w => w.url().includes('#/learning')) ??
    await app.waitForEvent('window', { predicate: w => w.url().includes('#/learning') })
  await page.evaluate(() => globalThis.courseCompanion.saveProgress({
    currentLessonId: 'module-1', currentCourseLessonId: 'm1-agents-and-skills',
    checkpointId: 'm1-agents-and-skills', sceneId: 'module-1-codex-projects', sceneHistory: [], completedCheckpointIds: [],
    // Onboarding is covered by electron-smoke; start this run past it.
    decisions: { onboardingTour: 'complete' }
  }))
  await page.reload()
  await page.getByRole('button', { name: 'Mở Course Companion', exact: true }).click()
  await page.getByRole('button', { name: /^01.*MỞ BÀI HỌC/ }).click()
  await page.getByRole('button', { name: 'Chuyển sang Codex để thực hành', exact: true }).click()
  const start = page.getByRole('button', { name: 'Bắt đầu thực hành', exact: true })
  const guide = page.locator('.practice-screenshot-guide')
  assert.ok(await start.isEnabled())
  assert.match(await start.evaluate(button => globalThis.getComputedStyle(button, '::after').content), /→/)
  assert.equal(await guide.locator('video').count(), 0)
  for (const width of [1180, 390, 320]) {
    await page.setViewportSize({ width, height: 780 })
    await guide.locator('.photo').evaluate(image => image.decode())
    const overflow = await page.locator('.practice-brief-overlay').evaluate(el => el.scrollWidth - el.clientWidth)
    assert.ok(overflow <= 1)
    await page.screenshot({ path: join(shots, 'image-guide-' + width + '.png') })
    await guide.locator('.lens').click()
    await guide.locator('.submit').waitFor()
    await guide.locator('.photo').evaluate(image => image.decode())
    await page.screenshot({ path: join(shots, 'image-panel-' + width + '.png') })
    await guide.locator('.submit').press('Enter')
    await guide.getByText('Đã thử nộp bài', { exact: true }).waitFor()
    await guide.getByRole('button', { name: 'Xem lại', exact: true }).click()
  }
  assert.equal(await page.evaluate(() => globalThis.courseCompanion.hasActivePractice()), false)
  await page.setViewportSize({ width: 1180, height: 780 })
  await page.getByRole('button', { name: 'Đóng trang Practice', exact: true }).click()
  await page.getByRole('button', { name: 'Chuyển sang Codex để thực hành', exact: true }).click()
  await start.click()
  const compact = app.windows().find(w => w.url().includes('#/companion'))
  await compact.getByRole('button', { name: 'Mở cửa sổ Triết', exact: true }).click()
  const panel = compact.locator('.pixel-teacher-panel.is-practice-review')
  await panel.getByRole('button', { name: 'Nộp bài', exact: true }).waitFor()
  await panel.getByText(/Chọn Effort Medium hoặc High/).first().waitFor()
  assert.equal(await panel.locator('video, .practice-video-replay').count(), 0)
  await panel.screenshot({ path: join(shots, 'triet-panel.png') })
  await panel.getByRole('button', { name: 'Nộp bài', exact: true }).click()
  await panel.locator('.practice-success').waitFor()
  await panel.getByRole('button', { name: 'Lưu kết quả và quay lại khóa học', exact: true }).click()
  await page.locator('main[data-scene-id="module-1-mastery"]').waitFor()
  console.log('Desktop and narrow screenshot guide, direct Practice start, submit, reviewed return passed')
} finally {
  await app?.close()
  await workspace.cleanup()
  await rm(profile, { recursive: true, force: true })
}
