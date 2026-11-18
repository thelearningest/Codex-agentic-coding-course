import assert from 'node:assert/strict'
import { mkdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const expectedStarts = {
  intro: ['intro-visual-onboarding', 'intro-course-overview-2', 'intro-learning-method'],
  'module-1': ['module-1-codex-orientation', 'module-1-codex-examples', 'module-1-codex-model-intro', 'module-1-codex-slash-commands', 'module-1-agents-intro', 'module-1-codex-projects', 'module-1-mastery', 'module-1-final-summary'],
  'module-2': ['module-2-portfolio-workspace', 'module-2-prd-definition', 'module-2-prd-review-workflow', 'module-2-prd-agent-workflow', 'module-2-implementation-plan-intro', 'module-2-portfolio-practice', 'module-2-portfolio-mastery', 'module-2-portfolio-mastery-summary'],
  'module-3': ['module-3-first-build', 'module-3-local-preview', 'module-3-debugging-intro', 'module-3-git-intro', 'module-3-pre-practice-summary', 'module-3-portfolio-practice', 'module-3-portfolio-mastery', 'module-3-mastery-summary'],
  'module-4': ['module-4-hosting-intro', 'module-4-vercel-benefits', 'module-4-after-video', 'module-4-vercel-preview', 'module-4-portfolio-practice']
}

export async function verifyOutlineNavigation(page, moduleId, statePath, screenshotDirectory) {
  screenshotDirectory ??= process.env.COURSE_COMPANION_OUTLINE_SCREENSHOT_DIR
  const before = await readFile(statePath, 'utf8')
  const originalViewport = page.viewportSize() ?? await page.evaluate(() => ({ width: globalThis.innerWidth, height: globalThis.innerHeight }))
  const shell = page.locator('main[data-scene-id]')
  const anchor = await shell.getAttribute('data-scene-id')
  const outline = page.locator('.pixel-outline')
  const summary = outline.locator('summary')
  const waitForScene = (id) => page.locator(`main[data-scene-id="${id}"]`).waitFor()

  for (const viewport of [{ width: 1440, height: 900 }, { width: 1180, height: 748 }]) {
    await page.setViewportSize(viewport)
    await summary.click()
    const bounds = await outline.locator('.pixel-outline-menu').boundingBox()
    assert.ok(bounds && bounds.y >= 0 && bounds.y + bounds.height <= viewport.height, `${moduleId}: menu fits desktop height`)
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= viewport.width, `${moduleId}: menu fits desktop width`)
    assert.equal(await page.evaluate(() => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth), true)
    if (screenshotDirectory) {
      await mkdir(screenshotDirectory, { recursive: true })
      await page.screenshot({ path: join(screenshotDirectory, `outline-${moduleId}-${viewport.width}.png`) })
    }
    await summary.press('Escape')
    assert.equal(await outline.getAttribute('open'), null)
  }

  for (const [index, sceneId] of expectedStarts[moduleId].entries()) {
    await summary.click()
    const items = outline.locator('li > button')
    assert.equal(await items.count(), expectedStarts[moduleId].length)
    // Keyboard activation is exercised as well as pointer activation.
    if (index === 0) {
      await items.nth(index).focus()
      await items.nth(index).press('Enter')
    } else {
      await items.nth(index).click()
    }
    await waitForScene(sceneId)
    assert.equal(await shell.getAttribute('data-outline-preview'), 'true')
    assert.equal(await outline.getAttribute('open'), null)
    assert.equal(await outline.locator('li.is-active').count(), 1)
    assert.equal(await outline.locator('li.is-complete').count(), 0)
    assert.equal(await page.locator('.pixel-practice-bypass:visible, .pixel-assessment-controls:visible').count(), 0)
    assert.equal(await readFile(statePath, 'utf8'), before, `${moduleId}: jumping must preserve saved progress`)
    const next = page.getByRole('button', { name: 'Tiếp tục', exact: true }).filter({ visible: true })
    if (await next.count()) {
      await next.click()
      assert.notEqual(await shell.getAttribute('data-scene-id'), sceneId)
      await page.getByRole('button', { name: '← Trang trước', exact: true }).filter({ visible: true }).click()
      await waitForScene(sceneId)
    }
    await summary.click()
    await outline.getByRole('button', { name: 'Về trang đang học', exact: true }).click()
    await waitForScene(anchor)
    assert.equal(await shell.getAttribute('data-outline-preview'), 'false')
    assert.equal(await readFile(statePath, 'utf8'), before, `${moduleId}: browsing and returning must preserve saved progress`)
  }
  await page.setViewportSize(originalViewport)
  await page.evaluate(() => {
    globalThis.document.querySelector('.pixel-learning-shell')?.scrollTo(0, 0)
    globalThis.scrollTo(0, 0)
  })
  console.log(`Outline navigation: ${moduleId} destinations, keyboard, desktop bounds and unchanged progress passed`)
}
