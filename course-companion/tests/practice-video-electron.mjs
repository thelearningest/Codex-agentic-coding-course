import assert from 'node:assert/strict'
import { cp, mkdir, mkdtemp, readFile, rm, rmdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve, sep } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import electronExecutable from 'electron'
import { _electron as electron } from 'playwright-core'
import { createDisposablePracticeWorkspace } from './support/disposable-practice-workspace.mjs'

// Real media playback in an isolated simulated course; never seeds a receipt.
const profile = await mkdtemp(join(tmpdir(), 'practice-video-electron-'))
const snapshot = join(profile, 'application')
// A long playback must not read assets that another workspace build can replace.
await cp(resolve('out'), join(snapshot, 'out'), { recursive: true })
await cp(resolve('content'), join(snapshot, 'content'), { recursive: true })
await cp(resolve('package.json'), join(snapshot, 'package.json'))
const workspace = await createDisposablePracticeWorkspace({ repositoryRoot: resolve('..') })
const shots = resolve('../.superpowers/qa/practice-video/playback')
await mkdir(shots, { recursive: true })
const manifest = JSON.parse(await readFile('shared/practice-video-manifest.json', 'utf8'))
let app, page
const errors = []

async function launch() {
  app = await electron.launch({ executablePath: electronExecutable, args: [join(snapshot, 'out/main/index.js')], env: {
    ...process.env, COURSE_COMPANION_USER_DATA_DIR: profile, COURSE_COMPANION_WORKSPACE_ROOT: workspace.root,
    COURSE_COMPANION_FAKE_CODEX: '1', COURSE_COMPANION_FAKE_CONFIGURATION_READY: '1',
    COURSE_COMPANION_FAKE_TEACHER_FAIL_ONCE: '0', COURSE_COMPANION_FAKE_TEACHER_LIVE_MODE: '0',
    COURSE_COMPANION_PRACTICE_DEFINITIONS_DIR: join(snapshot, 'content/practices'),
    COURSE_COMPANION_PRACTICE_GUIDES_DIR: join(snapshot, 'content/practice-guides')
  } })
  page = app.windows().find(w => w.url().includes('#/learning'))
    ?? await app.waitForEvent('window', { predicate: w => w.url().includes('#/learning') })
  page.on('pageerror', error => { errors.push(error.message); console.error('Video renderer:', error.message) })
  page.setDefaultTimeout(15000)
  await page.waitForFunction(() => Boolean(globalThis.courseCompanion))
  await page.setViewportSize({ width: 1180, height: 780 })
  // Keep occlusion by other test windows from throttling decoding. The native
  // hide signal still pauses playback and is explicitly exercised below.
  await app.evaluate(({ BrowserWindow }, url) => {
    BrowserWindow.getAllWindows().find(w => w.webContents.getURL() === url).webContents.setBackgroundThrottling(false)
  }, page.url())
}
async function openBrief() {
  await page.getByRole('button', { name: 'Mở Course Companion', exact: true }).click()
  await page.getByRole('button', { name: /MODULE 1.*MỞ BÀI HỌC/ }).click()
  for (let i = 0; i < 6 && !await page.locator('.practice-brief-overlay').isVisible(); i++) {
    await page.locator('.pixel-choice.is-primary').filter({ visible: true }).first().click()
    await delay(150)
  }
  await page.locator('.practice-video-guide video[controls]').waitFor()
  await page.waitForFunction(() => globalThis.document.querySelector('video')?.readyState >= 1)
}
async function checkLayout(width, name) {
  await page.setViewportSize({ width, height: 780 })
  await showLearningWindow()
  assert.equal(await page.evaluate(() => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth), false)
  const confirm = page.getByRole('button', { name: /Tôi đã xem hết|Đã xác nhận/ })
  await confirm.scrollIntoViewIfNeeded()
  const bounds = await confirm.boundingBox()
  assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= width + 1 && bounds.y >= 0 && bounds.y + bounds.height <= 781)
  await page.screenshot({ path: join(shots, name) })
}
async function showLearningWindow() {
  await app.evaluate(({ BrowserWindow }, url) => {
    const target = BrowserWindow.getAllWindows().find(w => w.webContents.getURL() === url)
    target.restore(); target.show(); target.focus()
  }, page.url())
  await page.waitForFunction(() => !globalThis.document.hidden)
}
async function playVideo(video, rate = 2) {
  const result = await video.evaluate(async (v, playbackRate) => {
    const events = []
    const names = ['play', 'playing', 'pause', 'waiting', 'seeking', 'seeked', 'ratechange']
    const trace = event => { events.push([event.type, v.currentTime, v.paused, v.seeking]); if (events.length > 24) events.shift() }
    names.forEach(name => v.addEventListener(name, trace))
    v.muted = true
    v.playbackRate = playbackRate
    let timeout
    try {
      return await Promise.race([
        v.play().then(() => ({ started: true })),
        new Promise(resolve => { timeout = setTimeout(() => resolve({ started: false, currentTime: v.currentTime, paused: v.paused, seeking: v.seeking, events }), 8000) })
      ])
    } finally { clearTimeout(timeout); names.forEach(name => v.removeEventListener(name, trace)) }
  }, rate)
  assert.equal(result.started, true, `Playback did not start: ${JSON.stringify(result)}`)
}

try {
  await launch()
  console.log('Video check: isolated app launched')
  await page.evaluate(() => globalThis.courseCompanion.saveProgress({ currentLessonId: 'module-1', currentCourseLessonId: 'm1-agents-and-skills',
    checkpointId: 'm1-agents-and-skills', sceneId: 'module-1-skills-intro', sceneHistory: [], completedCheckpointIds: [], decisions: {} }))
  await page.reload()
  await openBrief()
  console.log('Video check: handoff page and real media loaded')
  let video = page.locator('.practice-video-guide video')
  let start = page.getByRole('button', { name: 'Bắt đầu thực hành', exact: true })
  let confirm = page.getByRole('button', { name: 'Tôi đã xem hết và hiểu cách thực hành', exact: true })
  assert.equal(await video.evaluate(v => v.paused), true, 'Never autoplay')
  assert.equal(await video.evaluate(v => v.textTracks[0].mode), 'disabled', 'Embedded captions do not get a duplicate default overlay')
  await video.evaluate(v => { v.textTracks[0].mode = 'hidden' })
  await page.waitForFunction(() => globalThis.document.querySelector('video track')?.readyState === 2)
  assert.ok(await video.evaluate(v => v.textTracks[0].cues.length > 0), 'Vietnamese captions actually load')
  assert.equal(await video.evaluate(v => v.textTracks[0].mode), 'hidden')
  await video.evaluate(v => { v.textTracks[0].mode = 'disabled' })
  assert.ok(Math.abs(await video.evaluate(v => v.duration) - manifest.durationSeconds) < 0.1)
  assert.equal(await start.isDisabled(), true)
  assert.equal(await confirm.isDisabled(), true)
  const blocked = await page.evaluate(async () => {
    try { await globalThis.courseCompanion.startPractice({ practiceId: 'm1-codex-safe-setup', practiceVersion: '2.0.0', transfer: false }); return false }
    catch { return true }
  })
  assert.equal(blocked, true, 'Main process rejects a handoff without confirmation')
  const earlyConfirm = await page.evaluate(async () => {
    const p = await globalThis.courseCompanion.loadPracticeVideo()
    try { await globalThis.courseCompanion.updatePracticeVideo({ ...p, confirmed: true }); return false }
    catch { return true }
  })
  assert.equal(earlyConfirm, true)
  console.log('Video check: main-process and early confirmation locks passed')
  await video.evaluate(v => { v.currentTime = v.duration - 0.1 })
  await delay(400)
  assert.ok(await video.evaluate(v => v.currentTime) < 0.1, 'Seeking cannot skip unwatched content')
  assert.equal(await confirm.isDisabled(), true)
  console.log('Video check: seek lock passed')
  await checkLayout(1180, 'desktop-before-watching.png')
  await checkLayout(390, 'narrow-before-watching.png')
  await checkLayout(320, 'small-before-watching.png')
  console.log('Video check: desktop and narrow layouts passed')
  await page.setViewportSize({ width: 1180, height: 780 })
  await video.scrollIntoViewIfNeeded()
  await app.evaluate(({ BrowserWindow }, url) => {
    const target = BrowserWindow.getAllWindows().find(w => w.webContents.getURL() === url)
    target.restore(); target.show(); target.focus()
  }, page.url())
  await delay(200)
  await playVideo(video)
  await page.waitForFunction(() => globalThis.document.querySelector('video')?.currentTime > 6)
  assert.ok(await video.evaluate(v => v.getVideoPlaybackQuality().totalVideoFrames > 0), 'Actual video frames decode')
  const rateChangeAt = await video.evaluate(v => { v.playbackRate = 0.5; return v.currentTime })
  await page.waitForFunction(previous => globalThis.document.querySelector('video')?.currentTime > previous + 0.3, rateChangeAt)
  await video.evaluate(v => { v.playbackRate = 2 })
  await video.evaluate(v => v.pause())
  await page.waitForFunction(async () => (await globalThis.courseCompanion.loadPracticeVideo()).watched > 5)
  const partial = await page.evaluate(() => globalThis.courseCompanion.loadPracticeVideo())
  assert.equal(partial.confirmed, false)
  console.log(`Actual playback saved at ${partial.position.toFixed(1)}s; checking window visibility and restart`)
  await video.evaluate(async v => { await v.play() })
  await app.evaluate(({ BrowserWindow }, url) => BrowserWindow.getAllWindows().find(w => w.webContents.getURL() === url).hide(), page.url())
  assert.equal(await app.evaluate(({ BrowserWindow }, url) => BrowserWindow.getAllWindows().find(w => w.webContents.getURL() === url).isVisible(), page.url()), false)
  await page.waitForFunction(() => globalThis.document.querySelector('video')?.paused)
  const hidden = await page.evaluate(() => globalThis.courseCompanion.loadPracticeVideo())
  await delay(600)
  assert.equal((await page.evaluate(() => globalThis.courseCompanion.loadPracticeVideo())).watched, hidden.watched)
  await app.evaluate(({ BrowserWindow }, url) => BrowserWindow.getAllWindows().find(w => w.webContents.getURL() === url).show(), page.url())
  await page.waitForFunction(() => !globalThis.document.hidden)
  await page.getByRole('button', { name: 'Đóng trang Practice', exact: true }).click()
  await page.getByRole('button', { name: 'Chuyển sang Codex để thực hành', exact: true }).click()
  await page.locator('.practice-video-guide video[controls]').waitFor()
  assert.equal(await start.isDisabled(), true)
  const beforeRestart = await page.evaluate(() => globalThis.courseCompanion.loadPracticeVideo())
  console.log('Video check: saved restart scene', (await page.evaluate(() => globalThis.courseCompanion.loadProgress())).progress.sceneId)
  await app.close()
  await launch()
  await openBrief()
  video = page.locator('.practice-video-guide video')
  start = page.getByRole('button', { name: 'Bắt đầu thực hành', exact: true })
  confirm = page.getByRole('button', { name: 'Tôi đã xem hết và hiểu cách thực hành', exact: true })
  assert.ok(Math.abs(await video.evaluate(v => v.currentTime) - beforeRestart.position) < 0.3)
  assert.equal(await start.isDisabled(), true)
  assert.equal(await page.locator('.practice-guide, .practice-guide-mastery').count(), 0)
  assert.ok(await video.locator('track[kind="captions"]').count())
  await video.scrollIntoViewIfNeeded()
  await video.evaluate(v => {
    globalThis.practiceVideoEvents = []
    const record = type => {
      globalThis.practiceVideoEvents.push({ type, time: v.currentTime, hidden: globalThis.document.hidden, at: Date.now() })
      if (globalThis.practiceVideoEvents.length > 30) globalThis.practiceVideoEvents.shift()
    }
    for (const name of ['play', 'playing', 'pause', 'waiting', 'seeking', 'seeked', 'ended', 'error']) v.addEventListener(name, () => record(name))
    globalThis.document.addEventListener('visibilitychange', () => record('visibilitychange'))
    globalThis.courseCompanion.onPracticeVideoHidden(() => record('native-hidden'))
  })
  await showLearningWindow()
  await playVideo(video)
  console.log('Video check: restored playback started')
  // Play the complete remaining timeline. A native desktop minimize can pause
  // this interactive test window; resume only a recorded native-hide pause,
  // without seeking, seeding coverage or tolerating unexplained player pauses.
  const playbackDeadline = Date.now() + Math.ceil(manifest.durationSeconds / 2 + 45) * 1000
  let resumedHideAt = 0
  let playbackEnded = false
  while (Date.now() < playbackDeadline) {
    const state = await video.evaluate(v => ({
      ended: v.ended, paused: v.paused,
      hiddenAt: globalThis.practiceVideoEvents?.findLast(event => event.type === 'native-hidden')?.at ?? 0
    }))
    if (state.ended) { playbackEnded = true; break }
    if (state.paused && state.hiddenAt > resumedHideAt) {
      resumedHideAt = state.hiddenAt
      await showLearningWindow()
      await playVideo(video)
      console.log('Video check: resumed actual playback after native desktop hide')
    }
    await delay(300)
  }
  assert.equal(playbackEnded, true, 'The complete actual media timeline must finish within the playback deadline')
  await page.waitForFunction(() => ![...globalThis.document.querySelectorAll('button')].find(b => b.textContent.includes('Tôi đã xem hết'))?.disabled)
  assert.equal(await start.isDisabled(), true, 'Watching alone never confirms or starts Practice')
  assert.equal(await page.evaluate(() => globalThis.courseCompanion.hasActivePractice()), false)
  await page.waitForFunction(async duration => (await globalThis.courseCompanion.loadPracticeVideo()).watched >= duration - 0.05, manifest.durationSeconds)
  // Force a real, recoverable save failure without altering prior viewing data.
  const blockedWrite = join(profile, 'practice-video.json.tmp')
  await mkdir(blockedWrite)
  await confirm.click()
  await page.getByRole('alert').filter({ hasText: 'Không thể lưu tiến độ xem video' }).waitFor()
  assert.equal(await start.isDisabled(), true)
  await rmdir(blockedWrite)
  await page.getByRole('alert').getByRole('button', { name: 'Thử lại', exact: true }).click()
  await page.getByRole('button', { name: 'Đã xác nhận', exact: true }).waitFor()
  assert.equal(await start.isEnabled(), true)
  assert.equal(await page.evaluate(() => globalThis.courseCompanion.hasActivePractice()), false, 'Confirmation never auto-starts')
  await checkLayout(390, 'confirmed-narrow.png')
  await page.setViewportSize({ width: 1180, height: 780 })
  await start.click()
  await page.getByRole('button', { name: 'Bắt đầu Practice mới', exact: true }).waitFor({ state: 'attached' })
  const compact = app.windows().find(w => w.url().includes('#/companion'))
  await compact.getByRole('button', { name: 'Mở cửa sổ Triết', exact: true }).click()
  await compact.locator('.practice-video-replay > summary').click()
  await compact.locator('.practice-video-guide video[controls]').waitFor()
  assert.equal(await compact.locator('.practice-guide').count(), 0)
  const runBeforeReplay = await readFile(join(profile, 'practice-runs.json'), 'utf8')
  await compact.locator('.practice-video-guide video').evaluate(async v => { v.muted = true; v.currentTime = 0; await v.play() })
  await delay(1000)
  await compact.locator('.practice-video-replay > summary').click()
  await compact.locator('.practice-video-guide video').waitFor({ state: 'detached' })
  assert.equal(await compact.locator('.practice-video-guide video').count(), 0, 'Closing replay unmounts and pauses its player')
  assert.equal(await readFile(join(profile, 'practice-runs.json'), 'utf8'), runBeforeReplay, 'Replay never reviews or changes Practice')
  await compact.getByRole('button', { name: 'Mở Triết toàn màn hình', exact: true }).click()
  await page.locator('.practice-video-replay > summary').waitFor()
  assert.equal(await page.locator('.practice-guide').count(), 0)
  await page.getByRole('button', { name: 'Cập nhật và kiểm tra tiến độ Practice', exact: true }).click()
  await page.locator('.practice-success').waitFor()
  await page.getByRole('button', { name: 'Lưu kết quả và quay lại khóa học', exact: true }).click()
  await page.locator('main[data-scene-id="module-1-mastery"]').waitFor()
  assert.equal(await page.locator('.practice-guide, .practice-guide-mastery').count(), 0)
  assert.deepEqual(errors, [])
  console.log('Practice video: real full playback, seek prevention, pause/hidden/restart persistence, explicit confirmation, manual handoff, replay, retired tour, review/return and desktop/narrow layouts passed')
} catch (error) {
  console.error('Media state:', await page?.locator('video').first().evaluate(v => ({ currentTime: v.currentTime, paused: v.paused, seeking: v.seeking,
    readyState: v.readyState, rate: v.playbackRate, hidden: globalThis.document.hidden, frames: v.getVideoPlaybackQuality().totalVideoFrames,
    buffered: Array.from({ length: v.buffered.length }, (_, i) => [v.buffered.start(i), v.buffered.end(i)]) })).catch(() => null))
  console.error('Video renderer errors:', errors)
  console.error('Playback events:', await page?.evaluate(() => globalThis.practiceVideoEvents).catch(() => null))
  await page?.screenshot({ path: join(shots, 'failure.png') }).catch(() => {})
  console.error(await page?.locator('body').innerText().catch(() => 'No renderer'))
  throw error
} finally {
  await app?.close().catch(() => {})
  await workspace.cleanup()
  assert.ok(resolve(profile).startsWith(resolve(tmpdir()) + sep))
  await rm(profile, { recursive: true, force: true })
}
