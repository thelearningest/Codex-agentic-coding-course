// Capture the shipped course UI using isolated, explicitly simulated profiles.
// From the repository root, after building course-companion/: node scripts/capture-readme-media.mjs
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { promisify } from 'node:util'
import { setTimeout as delay } from 'node:timers/promises'
import { createDisposablePracticeWorkspace } from '../course-companion/tests/support/disposable-practice-workspace.mjs'

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(join(repository, 'course-companion/package.json'))
const { _electron: electron } = require('playwright-core')
const electronExecutable = require('electron')
const execute = promisify(execFile)
const output = join(repository, 'docs/assets/readme')
const scratch = join(repository, '.superpowers/qa/readme-media')
const viewport = { width: 1180, height: 748 }

export async function recordReadmeClip(page, name, actions, electronApp) {
  const frames = join(scratch, `${name}-video`)
  await mkdir(frames, { recursive: true })
  await electronApp.evaluate(({ BrowserWindow }, url) => {
    const window = BrowserWindow.getAllWindows().find(candidate => candidate.webContents.getURL() === url)
    if (!window) throw new Error('Capture window disappeared')
    window.webContents.setBackgroundThrottling(false)
    window.restore()
    window.show()
  }, page.url())
  const session = await page.context().newCDPSession(page)
  const timeline = []
  const writes = []
  const errors = []
  session.on('Page.screencastFrame', frame => {
    const file = `${String(timeline.length).padStart(5, '0')}.jpg`
    timeline.push({ file, at: frame.metadata.timestamp * 1000 })
    writes.push(writeFile(join(frames, file), Buffer.from(frame.data, 'base64'))
      .catch(error => { errors.push(error) }))
    // Acknowledge immediately so disk I/O cannot throttle the video stream.
    void session.send('Page.screencastFrameAck', { sessionId: frame.sessionId })
      .catch(error => { errors.push(error) })
  })
  await session.send('Page.startScreencast', {
    format: 'jpeg', quality: 95, maxWidth: 960, maxHeight: 609, everyNthFrame: 1
  })
  const startedAt = Date.now()
  let stoppedAt
  try {
    await delay(1800)
    await actions()
    await delay(2400)
  } finally {
    stoppedAt = Date.now()
    await session.send('Page.stopScreencast')
    await session.detach()
    await Promise.all(writes)
  }
  assert.equal(errors.length, 0, `Video stream failed for ${name}: ${errors[0]}`)
  // Chromium emits changed frames only; reading pauses do not need redraws.
  assert.ok(timeline.length >= 3, `Video stream did not capture the walkthrough for ${name}`)
  assert.ok(timeline.every(frame => Number.isFinite(frame.at)), `Missing frame timestamps for ${name}`)
  const durationSeconds = (stoppedAt - startedAt) / 1000
  const endedAt = timeline[0].at + durationSeconds * 1000
  const sequence = timeline.flatMap((frame, i) => [`file '${frame.file}'`, 'option framerate 1000',
    `duration ${Math.max(0.001, ((timeline[i + 1]?.at ?? endedAt) - frame.at) / 1000)}`])
  sequence.push(`file '${timeline.at(-1).file}'`, 'option framerate 1000')
  await writeFile(join(frames, 'frames.txt'), sequence.join('\n') + '\n')
  const video = join(frames, 'recording.mp4')
  await execute('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0',
    '-i', join(frames, 'frames.txt'), '-vf', 'fps=30,scale=960:608:flags=lanczos',
    '-t', String(durationSeconds), '-c:v', 'libx264', '-preset', 'fast', '-crf', '16', '-pix_fmt', 'yuv420p', video],
    { windowsHide: true, maxBuffer: 1024 * 1024 })
  const path = join(output, `${name}.gif`)
  // Palette and rectangle differencing keep text clear and repository files small.
  await execute('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', video, '-filter_complex',
    '[0:v]fps=15,split[a][b];[a]palettegen=stats_mode=diff:reserve_transparent=1[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle',
    '-loop', '0', path], { windowsHide: true, maxBuffer: 1024 * 1024 })
  await execute('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', path,
    '-vf', 'reverse', '-frames:v', '1', join(output, `${name}.png`)],
    { windowsHide: true, maxBuffer: 1024 * 1024 })
  const entry = { name, capturedFrames: timeline.length, videoFps: 30, gifFps: 15, durationSeconds,
    receivedFramesPerSecond: timeline.length / durationSeconds,
    motionFrameIntervalsMs: timeline.slice(1).map((frame, index) => frame.at - timeline[index].at)
      .filter(interval => interval > 0 && interval < 100),
    sourceScenes: await page.locator('main[data-scene-id]').getAttribute('data-scene-id') }
  await writeFile(join(scratch, `${name}.json`), JSON.stringify(entry, null, 2) + '\n')
  console.log(`Captured ${name}: ${timeline.length} streamed frames over ${durationSeconds.toFixed(1)}s, 30 fps video / 15 fps GIF`)
  return entry
}

async function main() {
  const profile = await mkdtemp(join(tmpdir(), 'readme-course-demo-'))
  const workspace = await createDisposablePracticeWorkspace({ repositoryRoot: repository })
  await mkdir(output, { recursive: true })
  await mkdir(scratch, { recursive: true })
  const manifest = { capturedAt: new Date().toISOString(), viewport, simulated: true, clips: [] }
  let app
  let page
  async function openLesson(module, scene, lesson, checkpoint) {
    await page.evaluate(async ({ module, scene, lesson, checkpoint }) => globalThis.courseCompanion.saveProgress({
      currentLessonId: module, currentCourseLessonId: lesson, checkpointId: checkpoint,
      sceneId: scene, sceneHistory: [], completedCheckpointIds: [], decisions: {}
    }), { module, scene, lesson, checkpoint })
    await page.reload()
    await page.getByRole('button', { name: 'Mở Course Companion', exact: true }).click()
    await page.getByRole('button', { name: new RegExp(`MODULE ${module.split('-')[1]}.*MỞ BÀI HỌC`) }).click()
    await page.locator(`main[data-scene-id="${scene}"]`).waitFor()
    await page.evaluate(() => globalThis.document.fonts.ready)
    await delay(450)
  }
  async function next() {
    await page.getByRole('button', { name: 'Tiếp tục', exact: true }).filter({ visible: true }).click()
    await delay(500)
  }
  async function record(name, actions) {
    manifest.clips.push(await recordReadmeClip(page, name, actions, app))
  }
  try {
    app = await electron.launch({ executablePath: electronExecutable,
      args: [join(repository, 'course-companion/out/main/index.js')], env: {
        ...process.env, COURSE_COMPANION_USER_DATA_DIR: profile,
        COURSE_COMPANION_WORKSPACE_ROOT: workspace.root,
        COURSE_COMPANION_FAKE_CODEX: '1', COURSE_COMPANION_FAKE_CONFIGURATION_READY: '1',
        COURSE_COMPANION_FAKE_TEACHER_LIVE_MODE: '0',
        COURSE_COMPANION_FAKE_TEACHER_DELAY_MS: '1800', COURSE_COMPANION_FAKE_TEACHER_FAIL_ONCE: '0'
      } })
    page = app.windows().find(window => window.url().includes('#/learning'))
      ?? await app.waitForEvent('window', { predicate: window => window.url().includes('#/learning') })
    page.setDefaultTimeout(15000)
    await page.setViewportSize(viewport)
    await page.waitForFunction(() => Boolean(globalThis.courseCompanion))

    if (!process.argv.includes('--reuse-lessons')) {
      await openLesson('module-1', 'module-1-codex-orientation', 'm1-understand-codex', 'm1-codex-orientation')
      await record('module-1-codex', async () => {
        await next()
        await delay(2500)
        await next()
        await delay(1800)
      })

      await openLesson('module-2', 'module-2-portfolio-workspace', 'm2-portfolio-brief', 'm2-portfolio-brief')
      await record('module-2-planning', async () => {
        await next()
        await delay(2600)
        await next()
        await delay(1800)
      })
    }

    await openLesson('module-2', 'module-2-portfolio-workspace', 'm2-portfolio-brief', 'm2-portfolio-brief')
    await page.getByRole('button', { name: 'HỎI TRIẾT', exact: true }).click()
    await record('teacher-companion', async () => {
      const composer = page.getByRole('textbox', { name: 'Nhắn cho Triết' })
      await composer.fill('Mình nên kiểm tra những gì')
      await delay(600)
      await composer.fill('Mình nên kiểm tra những gì trước khi duyệt kế hoạch?')
      await delay(500)
      await composer.press('Enter')
      await page.locator('.pixel-chat-message.is-teacher').last().waitFor()
      await delay(1600)
    })

    await page.getByRole('button', { name: 'Đóng Triết', exact: true }).click()
    await openLesson('module-1', 'module-1-skills-intro', 'm1-agents-and-skills', 'm1-agents-and-skills')
    await page.evaluate(async () => {
      await globalThis.courseCompanion.startPractice({ practiceId: 'm1-codex-safe-setup', practiceVersion: '2.0.0', transfer: false })
      await globalThis.courseCompanion.setCompanionMode('expanded')
    })
    const compact = app.windows().find(window => window.url().includes('#/companion'))
      ?? await app.waitForEvent('window', { predicate: window => window.url().includes('#/companion') })
    await compact.getByRole('button', { name: 'Mở Triết toàn màn hình', exact: true }).click()
    await page.locator('.pixel-teacher-overlay').waitFor()
    const guide = page.locator('.practice-guide')
    await record('practice-review', async () => {
      if (await guide.isVisible()) {
        const skip = guide.getByRole('button', { name: /Bỏ qua/ })
        if (await skip.count()) await skip.first().click()
      }
      await delay(1200)
      await page.getByRole('button', { name: 'Cập nhật và kiểm tra tiến độ Practice', exact: true }).click()
      await page.locator('.practice-success, .practice-review-result').first().waitFor()
      await delay(2400)
    })
    await writeFile(join(scratch, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
  } catch (error) {
    await page?.screenshot({ path: join(scratch, 'capture-failure.png') }).catch(() => {})
    console.error(await page?.locator('body').innerText().catch(() => 'No page text'))
    throw error
  } finally {
    await app?.close()
    await workspace.cleanup()
    assert.ok(resolve(profile).startsWith(resolve(tmpdir()) + sep)
      && profile.split(sep).at(-1).startsWith('readme-course-demo-'))
    await rm(profile, { recursive: true, force: true })
  }
  await captureLaterModules()
}

async function captureLaterModules() {
  // Run the existing disposable journey unchanged except for capture hooks.
  // It earns simulated Practice receipts through the normal review APIs;
  // neither product gates nor test assertions are disabled for documentation.
  let source = await readFile(join(repository, 'course-companion/tests/portfolio-package-electron.mjs'), 'utf8')
  for (const name of ['electron', 'playwright-core', 'typescript']) {
    const entry = name === 'playwright-core' ? join(dirname(require.resolve(name)), 'index.mjs') : require.resolve(name)
    source = source.replace(`from '${name}'`, `from '${pathToFileURL(entry).href}'`)
  }
  source = source.replace("from './support/disposable-practice-workspace.mjs'",
    `from '${pathToFileURL(join(repository, 'course-companion/tests/support/disposable-practice-workspace.mjs')).href}'`)
  source = `import { recordReadmeClip } from '${import.meta.url}';\n` + source
  const hooks = [
    ['module-3-local-preview', 'module-3-debugging', 'm3-complete-first-version', 'm3-complete-first-version', 3],
    ['module-4-hosting-intro', 'module-4-publishing', 'm4-release-validation', 'm4-release-validation', 4]
  ]
  for (const [scene, name, lesson, checkpoint, module] of hooks) {
    const anchor = `await page.locator('main[data-scene-id="${scene}"]').waitFor()`
    assert.equal(source.split(anchor).length, 2, `Expected exactly one capture anchor for ${scene}`)
    const video = module === 4 ? `
      const video = page.locator('video');
      if (await video.count()) {
        await video.first().evaluate(element => { element.muted = true; return element.play(); });
        await new Promise(resolve => setTimeout(resolve, 3000));
        await video.first().evaluate(element => element.pause());
      }
    ` : ''
    source = source.replace(anchor, anchor + `;
    await page.setViewportSize({ width: 1180, height: 748 });
    await recordReadmeClip(page, '${name}', async () => {
      await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
      await new Promise(resolve => setTimeout(resolve, 2600));
      ${video}
      await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
      await new Promise(resolve => setTimeout(resolve, 2300));
    }, app);
    await page.evaluate(async () => {
      const { progress } = await globalThis.courseCompanion.loadProgress();
      await globalThis.courseCompanion.saveProgress({ ...progress, sceneId: '${scene}',
        currentCourseLessonId: '${lesson}', checkpointId: '${checkpoint}' });
    });
    await page.reload();
    await page.getByRole('button', { name: 'Mở Course Companion', exact: true }).click();
    await page.getByRole('button', { name: /MODULE ${module}.*MỞ BÀI HỌC/ }).click();
    await page.locator('main[data-scene-id="${scene}"]').waitFor();`)
  }
  const runner = join(scratch, 'portfolio-capture-journey.mjs')
  await writeFile(runner, source)
  const { stdout, stderr } = await execute(process.execPath, [runner], {
    cwd: join(repository, 'course-companion'), windowsHide: true, timeout: 300000, maxBuffer: 4 * 1024 * 1024
  })
  await writeFile(join(scratch, 'portfolio-capture.log'), stdout + stderr)
  console.log(stdout.trim())
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  if (process.argv.includes('--later-only')) await captureLaterModules()
  else await main()
}
