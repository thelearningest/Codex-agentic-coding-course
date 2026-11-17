// Recording harness only: a disposable real-Codex course, never the learner profile.
// It deliberately omits the video wait in the demo; the edited movie must label
// that omission. No Practice verdict or Codex configuration is seeded.
import { createRequire } from 'node:module'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createInterface } from 'node:readline'
import { createDisposablePracticeWorkspace } from '../course-companion/tests/support/disposable-practice-workspace.mjs'

const root = resolve(import.meta.dirname, '..')
const require = createRequire(join(root, 'course-companion/package.json'))
const resume = process.argv.includes('--resume-recording')
const prior = resume ? JSON.parse(await readFile(join(root, '.superpowers/qa/practice-desktop-v2/recording-session.json'), 'utf8')) : null
if (prior && (!resolve(prior.profile).startsWith(resolve(tmpdir(), 'practice-desktop-recording-'))
  || !resolve(prior.workspace).startsWith(resolve(tmpdir(), 'course-companion-practice-')))) throw new Error('Disposable recording paths required')
const workspace = prior ? { root: prior.workspace } : await createDisposablePracticeWorkspace({ repositoryRoot: root })
const profile = prior ? prior.profile : await mkdtemp(join(tmpdir(), 'practice-desktop-recording-'))
const app = await require('playwright-core')._electron.launch({
  executablePath: require('electron'), args: [join(root, 'course-companion/out/main/index.js')],
  env: { ...process.env, COURSE_COMPANION_USER_DATA_DIR: profile,
    COURSE_COMPANION_WORKSPACE_ROOT: workspace.root, COURSE_COMPANION_FAKE_CODEX: '0' }
})
const learning = app.windows().find(w => w.url().includes('#/learning'))
  ?? await app.waitForEvent('window', { predicate: w => w.url().includes('#/learning') })
await app.evaluate(({ BrowserWindow, screen }) => {
  BrowserWindow.getAllWindows().find(w => w.webContents.getURL().includes('#/learning'))?.setBounds(screen.getPrimaryDisplay().workArea)
})
await learning.waitForFunction(() => Boolean(globalThis.courseCompanion))
if (!resume) await learning.evaluate(() => globalThis.courseCompanion.saveProgress({
  currentLessonId: 'module-1', currentCourseLessonId: 'm1-agents-and-skills',
  checkpointId: 'm1-agents-and-skills', sceneId: 'module-1-skills-intro',
  sceneHistory: [], completedCheckpointIds: [], decisions: {}
}))
const saved = await learning.evaluate(() => globalThis.courseCompanion.loadProgress())
const manifest = JSON.parse(await readFile(join(root, 'course-companion/shared/practice-video-manifest.json'), 'utf8'))
await writeFile(join(profile, 'practice-video.json'), JSON.stringify([{
  courseRunId: saved.progress.courseRunId, videoId: manifest.videoId,
  version: manifest.version, watched: manifest.durationSeconds,
  position: manifest.durationSeconds, confirmed: resume
}]))
await learning.reload()
await writeFile(join(root, '.superpowers/qa/practice-desktop-v2/recording-session.json'),
  JSON.stringify({ profile, workspace: workspace.root, simulated: false,
    learningWindow: await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()
      .find(w => w.webContents.getURL().includes('#/learning')).getNativeWindowHandle().readUInt32LE(0)) }, null, 2))
console.log(JSON.stringify({ ready: true, profile, workspace: workspace.root }))

// Commands are limited to the app under development, not the Codex UI.
for await (const line of createInterface({ input: process.stdin, terminal: false })) {
  try {
    const command = JSON.parse(line)
    const page = command.surface === 'companion'
      ? app.windows().find(w => w.url().includes('#/companion')) : learning
    if (command.action === 'status') {
      console.log(JSON.stringify({ text: await page.locator('body').innerText() }))
    } else if (command.action === 'click') {
      await page.getByRole(command.role ?? 'button', { name: command.name, exact: true }).click()
      console.log(JSON.stringify({ clicked: command.name }))
    } else if (command.action === 'state') {
      console.log(JSON.stringify(await page.evaluate(() => globalThis.courseCompanion.loadPracticeWorkspace())))
    } else if (command.action === 'bounds') {
      await app.evaluate(({ BrowserWindow }, bounds) => {
        BrowserWindow.getAllWindows().find(w => w.webContents.getURL().includes('#/learning'))?.setBounds(bounds)
      }, command.bounds)
      console.log(JSON.stringify({ bounds: command.bounds }))
    } else if (command.action === 'close') {
      await app.close()
      break
    } else throw new Error('Unsupported recording command')
  } catch (error) {
    console.error(JSON.stringify({ error: error.message }))
  }
}
