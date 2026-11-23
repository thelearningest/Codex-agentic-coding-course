import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import electronExecutable from 'electron'
import { _electron as electron } from 'playwright-core'

// Live mode sends only course sources and this disposable profile's synthetic
// questions to the signed-in Codex service. Never load personal learner data.
const live = process.argv.includes('--live')
const directory = await mkdtemp(join(tmpdir(), 'course-teacher-chat-'))
let app
try {
  app = await electron.launch({ executablePath: electronExecutable, args: [join(process.cwd(), 'out/main/index.js')],
    env: { ...process.env, COURSE_COMPANION_USER_DATA_DIR: directory,
      COURSE_COMPANION_FAKE_CODEX: live ? '0' : '1',
      COURSE_COMPANION_FAKE_TEACHER_LIVE_MODE: '0',
      COURSE_COMPANION_FAKE_TEACHER_DELAY_MS: live ? '0' : '4000',
      COURSE_COMPANION_FAKE_TEACHER_FAIL_ONCE: live ? '0' : '1' } })
  let page = app.windows().find((candidate) => candidate.url().includes('#/learning'))
  if (!page) page = await app.waitForEvent('window', { predicate: (candidate) => candidate.url().includes('#/learning') })
  page.setDefaultTimeout(live ? 90_000 : 15_000)
  await page.waitForFunction(() => Boolean(globalThis.courseCompanion))
  await page.evaluate(async () => {
    await globalThis.courseCompanion.saveProgress({ currentLessonId: 'module-2', currentCourseLessonId: 'm2-portfolio-brief',
      checkpointId: 'm2-portfolio-brief', sceneId: 'module-2-portfolio-workspace', sceneHistory: [],
      completedCheckpointIds: [], decisions: {} })
    // Simulate a profile that previously selected the removed theory tab.
    await globalThis.courseCompanion.selectPracticePanel({ surface: 'full', panel: 'progress' })
    await globalThis.courseCompanion.selectPracticePanel({ surface: 'compact', panel: 'progress' })
  })
  await page.reload()
  await page.getByRole('button', { name: 'Mở Course Companion', exact: true }).click()
  await page.getByRole('button', { name: 'Mở Triết, giáo viên đồng hành', exact: true }).click()
  const panel = page.locator('.pixel-teacher-overlay')
  const composer = panel.getByRole('textbox', { name: 'Nhắn cho Triết' })
  await composer.waitFor()
  assert.equal(await panel.getByRole('tablist').count(), 0)
  const prompt = 'Tại sao cần lập kế hoạch trước khi nhờ coding agent xây portfolio? Giải thích ngắn gọn cho người mới.'
  const before = await page.evaluate(() => globalThis.courseCompanion.loadProgress())
  // The empty chat offers Module 2 example questions; they go away after the first message.
  const starters = panel.locator('.pixel-chat-starters button')
  await starters.first().waitFor()
  assert.equal(await starters.count(), 3)
  assert.equal(await starters.first().innerText(), 'Vì sao nên lập kế hoạch trước khi nhờ agent code?')
  await composer.fill(prompt)
  await composer.press('Enter')
  if (!live) {
    const thinking = panel.getByRole('status').filter({ hasText: 'Triết đang suy nghĩ…' })
    await thinking.waitFor()
    const motion = await panel.locator('.pixel-chat-thinking-dots i').first().evaluate((dot) => {
      const animation = dot.getAnimations()[0]
      return animation?.effect?.getKeyframes().some((frame) => frame.transform === 'translateY(-2px)')
    })
    assert.equal(motion, true, 'Thinking feedback has restrained visible motion')
    assert.equal(await composer.inputValue(), '')
    assert.equal(await panel.locator('.pixel-chat-message.is-learner p').innerText(), prompt)
    assert.equal(await panel.locator('.pixel-chat-empty').count(), 0)
    assert.equal(await starters.count(), 0)
    assert.equal(await panel.locator('.pixel-chat-message.is-teacher').count(), 0)
    assert.equal(await panel.getByRole('button', { name: 'ĐANG GỬI…', exact: true }).isDisabled(), true)
    if (process.env.COURSE_COMPANION_SCREENSHOT_DIR) {
      await page.screenshot({ path: join(process.env.COURSE_COMPANION_SCREENSHOT_DIR, 'teacher-thinking-desktop.png') })
    }
    await panel.getByRole('button', { name: 'Thử lại', exact: true }).waitFor()
    assert.equal(await thinking.count(), 0)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.bringToFront()
    await panel.getByRole('button', { name: 'Thử lại', exact: true }).click()
    await thinking.waitFor()
    assert.equal(await panel.locator('.pixel-chat-message.is-learner').count(), 1)
    assert.equal(await composer.inputValue(), '')
    assert.equal(await page.evaluate(() => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth), false)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    assert.equal(await panel.locator('.pixel-chat-thinking-dots i').first().evaluate((element) => globalThis.getComputedStyle(element).animationName), 'none')
    if (process.env.COURSE_COMPANION_SCREENSHOT_DIR) {
      await page.screenshot({ path: join(process.env.COURSE_COMPANION_SCREENSHOT_DIR, 'teacher-thinking-narrow.png') })
    }
  }
  const answer = panel.locator('.pixel-chat-message.is-teacher').last()
  await answer.waitFor()
  assert.equal(await panel.locator('.pixel-chat-thinking').count(), 0)
  const content = await answer.locator('p').innerText()
  assert.ok(content.trim().length > 20)
  assert.equal(await panel.locator('.pixel-chat-message.is-learner').count(), 1)
  assert.equal(await composer.inputValue(), '')
  assert.deepEqual(await page.evaluate(() => globalThis.courseCompanion.loadProgress()), before)
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find((window) => window.webContents.getURL().includes('#/learning')).minimize())
  const windowed = app.windows().find((window) => window.url().includes('#/companion'))
  const windowedTeacher = windowed.locator('.pixel-teacher-panel')
  await windowedTeacher.locator('.pixel-chat-message.is-teacher').last().waitFor()
  assert.equal(await windowedTeacher.locator('.pixel-chat-message.is-teacher p').last().innerText(), content)
  assert.equal(await windowedTeacher.locator('.teacher-markdown').first().evaluate((text) => globalThis.getComputedStyle(text).fontSize), '12px')
  assert.equal(await windowed.evaluate(() => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth), false)
  const compactScreenshots = resolve('../.superpowers/sdd/screenshots')
  await mkdir(compactScreenshots, { recursive: true })
  await windowed.screenshot({ path: join(compactScreenshots, 'teacher-windowed-density.png'), animations: 'disabled' })
  const windowedComposer = windowedTeacher.getByRole('textbox', { name: 'Nhắn cho Triết' })
  await windowedComposer.fill('Giữ câu hỏi đang viết khi thu nhỏ Triết.')
  const retainedComposer = await windowedComposer.elementHandle()
  for (let cycle = 0; cycle < 2; cycle += 1) {
    await windowedTeacher.getByRole('button', { name: 'Thu nhỏ Triết', exact: true }).click()
    const launcher = windowed.getByRole('button', { name: 'Mở cửa sổ Triết', exact: true })
    await launcher.waitFor()
    assert.equal(await retainedComposer.evaluate((element) => element.isConnected), true,
      'Minimizing keeps the existing Teacher view instead of destroying it')
    assert.equal(await windowedTeacher.isVisible(), false, 'Hidden Teacher controls are not interactive in launcher mode')
    await launcher.click()
    await windowedComposer.waitFor()
    assert.equal(await windowedComposer.inputValue(), 'Giữ câu hỏi đang viết khi thu nhỏ Triết.')
    assert.equal(await retainedComposer.evaluate((element) => element === globalThis.document.querySelector('.pixel-chat-composer textarea')), true)
    assert.equal(await windowedTeacher.getByText('Đang tải không gian của Triết…', { exact: true }).count(), 0,
      'Reopening shows the existing conversation without a loading reset')
    assert.equal(await windowedTeacher.locator('.pixel-chat-message.is-teacher p').last().innerText(), content)
  }
  await windowedComposer.fill('')
  await windowedTeacher.getByRole('button', { name: 'Mở Triết toàn màn hình', exact: true }).click()
  await composer.waitFor()
  await panel.getByRole('button', { name: 'Đóng Triết', exact: true }).click()
  await page.getByRole('button', { name: 'Mở Triết, giáo viên đồng hành', exact: true }).click()
  assert.equal(await panel.locator('.pixel-chat-message.is-teacher p').last().innerText(), content)
  await panel.getByRole('button', { name: 'Đóng Triết', exact: true }).click()
  await page.locator('button.pixel-roadmap-stage.is-current').click()
  await page.getByRole('button', { name: 'Trò chuyện với Triết', exact: true }).click()
  assert.equal(await panel.getByRole('tablist').count(), 0)
  assert.equal(await panel.locator('.pixel-chat-message.is-teacher p').last().innerText(), content)
  await page.setViewportSize({ width: 390, height: 844 })
  assert.equal(await page.evaluate(() => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth), false)
  await composer.fill('Một câu hỏi khác\nvới hai dòng')
  await composer.press('Shift+Enter')
  assert.equal(await panel.locator('.pixel-chat-message.is-learner').count(), 1)
  if (process.env.COURSE_COMPANION_SCREENSHOT_DIR) {
    await page.screenshot({ path: join(process.env.COURSE_COMPANION_SCREENSHOT_DIR, `teacher-chat-${live ? 'live' : 'fixture'}-narrow.png`) })
    await page.setViewportSize({ width: 1180, height: 780 })
    await page.screenshot({ path: join(process.env.COURSE_COMPANION_SCREENSHOT_DIR, `teacher-chat-${live ? 'live' : 'fixture'}-desktop.png`) })
  }
  const state = await page.evaluate(() => globalThis.courseCompanion.loadCompanionState())
  assert.equal(state.conversation.messages.at(-1).source, live ? 'live' : 'fixture')
  if (!live) {
    // A failure before persistence, followed by an unavailable history reload,
    // must still leave the learner's message visible and retryable in this view.
    await app.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('course:send-teacher-message')
      ipcMain.handle('course:send-teacher-message', async () => {
        await new Promise((resolve) => setTimeout(resolve, 250))
        throw new Error('Injected failure before message persistence')
      })
      ipcMain.removeHandler('course:load-companion-state')
      ipcMain.handle('course:load-companion-state', () => { throw new Error('Injected history reload failure') })
    })
    const unsaved = 'Giữ lại câu hỏi này nếu chưa gửi được.'
    await composer.fill(unsaved)
    await composer.press('Enter')
    await panel.getByRole('button', { name: 'Thử lại', exact: true }).waitFor()
    assert.equal(await panel.locator('.pixel-chat-message.is-learner').count(), 2)
    assert.equal(await panel.locator('.pixel-chat-message.is-learner p').last().innerText(), unsaved)
    assert.equal(await composer.inputValue(), '')
    assert.equal(await panel.locator('.pixel-chat-thinking').count(), 0)
    await panel.getByRole('button', { name: 'Thử lại', exact: true }).click()
    await panel.locator('.pixel-chat-thinking').waitFor({ state: 'hidden' })
    assert.equal(await panel.locator('.pixel-chat-message.is-learner').count(), 2)
    // A successful reply must survive a separate history refresh failure.
    await app.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('course:send-teacher-message')
      ipcMain.handle('course:send-teacher-message', async (_event, request) => {
        await new Promise((resolve) => setTimeout(resolve, 250))
        const timestamp = new Date().toISOString()
        return {
          learnerMessage: { id: 'confirmed-learner', role: 'learner', source: 'learner', content: request.content, timestamp, deliveryStatus: 'delivered' },
          teacherMessage: { id: 'confirmed-teacher', role: 'teacher', source: 'fixture', content: 'Phản hồi đã nhận dù lịch sử chưa tải lại được.', timestamp }
        }
      })
    })
    await panel.getByRole('button', { name: 'Thử lại', exact: true }).click()
    await panel.getByText('Phản hồi đã nhận dù lịch sử chưa tải lại được.', { exact: true }).waitFor()
    assert.equal(await panel.locator('.pixel-chat-message.is-learner').count(), 2)
    assert.equal(await panel.getByRole('button', { name: 'Thử lại', exact: true }).count(), 0)
    assert.equal(await panel.locator('.pixel-chat-thinking').count(), 0)

    const markdown = [
      'Hãy tìm phương án cho thấy Codex **thực sự hành động trong dự án và kiểm tra kết quả**.',
      '', 'Bạn chọn *A, B, C hay D* và giải thích ngắn vì sao?',
      '', '### Cách kiểm tra', '', '1. Đọc yêu cầu.', '2. Xem bằng chứng.',
      '   - Kiểm tra tệp.', '   - Chạy `npm test`.',
      '', '> Chỉ kết luận từ bằng chứng.', '', '[Tài liệu](https://example.com/docs)',
      '', '```js', `const example = "${'long-code-'.repeat(30)}"`, '```',
      '', '| Mục | Kết quả |', '| --- | --- |', '| Tệp | **Đạt** |'
    ].join('\n')
    await app.evaluate(({ ipcMain }, reply) => {
      ipcMain.removeHandler('course:send-teacher-message')
      ipcMain.handle('course:send-teacher-message', (_event, request) => {
        const timestamp = new Date().toISOString()
        return {
          learnerMessage: { id: 'markdown-learner', role: 'learner', source: 'learner', content: request.content, timestamp, deliveryStatus: 'delivered' },
          teacherMessage: { id: 'markdown-teacher', role: 'teacher', source: 'fixture', content: reply, timestamp }
        }
      })
    }, markdown)
    await composer.fill('Giữ nguyên **nội dung tôi nhập**.')
    await composer.press('Enter')
    const formatted = panel.locator('.teacher-markdown').last()
    await formatted.locator('table').waitFor()
    assert.equal(await formatted.locator('strong').first().innerText(), 'thực sự hành động trong dự án và kiểm tra kết quả')
    assert.equal(await formatted.locator('ol > li').count(), 2)
    assert.equal(await formatted.locator('ul > li').count(), 2)
    assert.equal(await formatted.locator('a').getAttribute('target'), '_blank')
    await app.evaluate(({ session }) => {
      session.fromPartition('course-web-links').protocol.handle('https', () =>
        new Response('<a href="/next" target="_blank">Next page</a>', {
          headers: { 'Content-Type': 'text/html' }
        }))
    })
    const sourceLink = formatted.getByRole('link', { name: 'Tài liệu' })
    await sourceLink.scrollIntoViewIfNeeded()
    const log = panel.locator('.pixel-chat-log')
    const scrollBefore = await log.evaluate((element) => element.scrollTop)
    const sourceUrl = page.url()
    const newWindow = app.waitForEvent('window')
    await sourceLink.click()
    const viewer = await newWindow
    await viewer.waitForURL('https://example.com/docs')
    assert.equal(await viewer.evaluate(() => typeof globalThis.courseCompanion), 'undefined')
    await viewer.getByRole('link', { name: 'Next page' }).click()
    await viewer.waitForURL('https://example.com/next')
    const viewerWindow = await app.browserWindow(viewer)
    const closed = viewer.waitForEvent('close')
    await viewerWindow.evaluate((window) => {
      window.focus()
      window.webContents.focus()
      window.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' })
      window.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' })
    })
    await closed
    assert.equal(page.url(), sourceUrl)
    assert.equal(await sourceLink.isVisible(), true)
    assert.equal(await log.evaluate((element) => element.scrollTop), scrollBefore)
    assert.equal(await panel.locator('.pixel-chat-message.is-learner').last().locator('strong').count(), 1) // Only the speaker label.
    assert.equal(await panel.locator('.pixel-chat-message.is-learner p').last().innerText(), 'Giữ nguyên **nội dung tôi nhập**.')
    for (const width of [390, 1180]) {
      await page.setViewportSize({ width, height: 844 })
      assert.equal(await page.evaluate(() => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth), false)
      assert.equal(await panel.locator('.pixel-chat-log').evaluate((element) => element.scrollWidth > element.clientWidth), false)
      assert.equal(await formatted.locator('pre').evaluate((element) => element.scrollWidth > element.clientWidth), true)
      await formatted.evaluate((element) => element.scrollIntoView({ block: 'start' }))
      if (process.env.COURSE_COMPANION_SCREENSHOT_DIR) {
        await page.screenshot({ animations: 'disabled', path: join(process.env.COURSE_COMPANION_SCREENSHOT_DIR, `teacher-markdown-${width}.png`) })
      }
    }
  }
  console.log(JSON.stringify({ mode: live ? 'live' : 'fixture', status: 'passed', answer: content }))
} finally {
  await app?.close()
  // Only this mkdtemp-created test profile is removed.
  await rm(directory, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
}
