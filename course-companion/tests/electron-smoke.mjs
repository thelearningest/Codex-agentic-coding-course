import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { verifyOutlineNavigation } from './support/outline-navigation.mjs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import electronExecutable from 'electron'
import { _electron as electron } from 'playwright-core'
import {
  createDisposablePracticeWorkspace,
  fingerprintTree
} from './support/disposable-practice-workspace.mjs'

const mainEntry = join(process.cwd(), 'out/main/index.js')
const userDataDirectory = await mkdtemp(join(tmpdir(), 'course-companion-electron-'))
const repositoryRoot = resolve(process.cwd(), '..')
const practiceWorkspace = await createDisposablePracticeWorkspace({ repositoryRoot })
const canonicalStarterFingerprint = await fingerprintTree(practiceWorkspace.canonicalStarter)
const learningPortfolioWorkspaceDirectory = await mkdtemp(join(tmpdir(), 'portfolio hành trình module 2-'))
const screenshotDirectory = process.env.COURSE_COMPANION_SCREENSHOT_DIR
const screenshotFilter = process.env.COURSE_COMPANION_SCREENSHOT_FILTER
const setupQuiz = JSON.parse(
  await readFile(join(process.cwd(), '..', 'pilot-workspace', 'course', 'quizzes', 'module-1.quiz.json'), 'utf8')
)
const planningQuiz = JSON.parse(
  await readFile(join(process.cwd(), '..', 'pilot-workspace', 'course', 'quizzes', 'module-2.quiz.json'), 'utf8')
)
const buildQuiz = JSON.parse(
  await readFile(join(process.cwd(), '..', 'pilot-workspace', 'course', 'quizzes', 'module-3.quiz.json'), 'utf8')
)
const releaseQuiz = JSON.parse(
  await readFile(join(process.cwd(), '..', 'pilot-workspace', 'course', 'quizzes', 'module-4.quiz.json'), 'utf8')
)
const approvedModuleTwoOpening = 'Sau khi hoàn thành module 1, hy vọng các bạn đã hiểu hơn về cách sử dụng Codex. Tiếp theo, chúng ta sẽ cùng tìm hiểu về cách planning khi sử dụng Coding agents. Nhiều bạn mới bắt đầu code với AI thường bỏ qua phần lên kế hoạch mà nhảy thẳng vào phần thực thi.\n\n Các bạn ấy nghĩ rằng mình đang tiết kiệm thời gian, nhưng thực chất các bạn đang lầm. Nếu có một kế hoạch tốt trước khi bắt đầu xây sản phẩm. Bạn sẽ tiết kiệm được biết bao thời gian debug và sửa lại từ đầu vì không đúng ý. Tin mình đi, mình đã phạm phải sai lầm này và đã phải trả giá.'
const approvedImplementationPlanIntro = 'Vậy, sau khi có PRD rồi thì làm gì? Ta sẽ tạo implementation plan.\n\nImplementation plan về căn bản sẽ viết ra những bước chi tiết để coding agent có thể hiện thực hoá PRD. Bạn có thể hiểu nếu PRD là bản kế hoạch tổng quan, thì implementation plan sẽ ghi chi tiết từng bước để thực hiện kế hoạch đó.\n\nThông thường một implementation plan sẽ được chia ra thành nhiều giai đoạn. Mỗi giai đoạn sẽ có tiêu chí hoàn thành rõ ràng.\n\nThường agent tạo PRD và Implementation plan khá tốt nên bạn chỉ cần bảo nó tạo rồi duyệt là được.\n\nPrompt mẫu sẽ được cung cấp ở phần thực hành cuối module.'
const approvedPracticeTransitionCopy = 'Okay, không để các bạn đợi lâu nữa, bây giờ các bạn có thể qua Codex để tiếp tục thực hành rồi.'
const approvedPortfolioPracticePrompt = [
  'Tôi muốn xây dựng một portfolio cá nhân nhưng chưa biết nên bắt đầu từ đâu. Hãy giúp tôi lập kế hoạch từ đầu bằng cách phỏng vấn tôi từng câu một. Trước tiên, hãy tìm hiểu mục tiêu của portfolio, người tôi muốn thuyết phục, nội dung tôi có thể đưa vào và phiên bản đầu tiên nên gồm những gì. Nếu tôi chưa chắc về câu trả lời, hãy đưa ra một vài lựa chọn dễ hiểu để tôi cân nhắc. Sau mỗi phần quan trọng, hãy tóm tắt những gì đã thống nhất và chờ tôi xác nhận trước khi tiếp tục. Trong quá trình này, chỉ tạo hoặc cập nhật tài liệu trong thư mục planning; chưa viết code, cài gói phụ thuộc hay tạo ứng dụng.',
  'Hãy làm theo AGENTS.md trong thư mục này.'
].join('\n\n')
const approvedPortfolioMasteryTransitionCopy = 'Hãy cùng ôn tập lại kiến thức một chút nhen'
const designReferenceLinks = [
  ['Pafolios', 'https://pafolios.com/'],
  ['Awwwards', 'https://www.awwwards.com/'],
  ['Dribbble', 'https://dribbble.com/'],
  ['Mobbin', 'https://mobbin.com/'],
  ['Pinterest', 'https://www.pinterest.com/']
]
async function openModuleTwoPractice(page, stepsRemaining = 5) {
  for (let index = 0; index < stepsRemaining; index += 1) {
    await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  }
  await page.getByRole('heading', { name: 'Chọn nơi lưu portfolio', exact: true }).waitFor()
  assert.deepEqual(await readdir(learningPortfolioWorkspaceDirectory), [])
  await page.getByRole('button', { name: 'Chọn thư mục', exact: true }).click()
  await page.getByRole('button', { name: 'Tạo thư mục planning', exact: true }).waitFor()
  assert.deepEqual(await readdir(learningPortfolioWorkspaceDirectory), [])
  await page.getByRole('button', { name: 'Tạo thư mục planning', exact: true }).click()
  await page.getByRole('button', { name: 'Tiếp tục với thư mục này', exact: true }).waitFor()
  await page.getByRole('heading', { name: 'Project Codex đã sẵn sàng', exact: true }).waitFor()
  assert.deepEqual((await readdir(learningPortfolioWorkspaceDirectory)).sort(), ['AGENTS.md', 'planning'])
  await page.getByRole('button', { name: 'Tiếp tục với thư mục này', exact: true }).click()
  await page.getByText(approvedPracticeTransitionCopy, { exact: true }).waitFor()
}

function assessmentGroup(groupId) {
  if (groupId === 'setup-final-assessment') {
    return {
      id: groupId,
      mode: 'mastery',
      questions: setupQuiz.questions
    }
  }
  const group = [...planningQuiz.groups, ...buildQuiz.groups, ...releaseQuiz.groups]
    .find((candidate) => candidate.id === groupId)
  assert.ok(group, `Expected assessment group ${groupId}`)
  return group
}

async function answerAssessmentGroup(page, groupId, { retryFirstChoice = false } = {}) {
  const group = assessmentGroup(groupId)
  for (const question of group.questions) {
    await page.getByText(question.prompt, { exact: true }).waitFor()
  }
  assert.equal(await page.locator('.pixel-assessment-question').count(), group.questions.length)
  assert.equal(await page.locator('.pixel-assessment-source').count(), 0)
  assert.equal(await page.locator('.pixel-scene-title').count(), 0)
  assert.equal(await page.locator('.pixel-dialogue.has-assessment > .pixel-speaker').count(), 0)
  assert.equal(await page.locator('.pixel-dialogue.has-assessment > p').count(), 0)
  assert.equal(await page.locator('.pixel-assessment-header').count(), 0)
  assert.equal(await page.locator('.pixel-dialogue.has-assessment[aria-label^="Câu hỏi Module"]').count(), 1)
  await capture(page, `${groupId}-questions-only.png`)

  if (retryFirstChoice) {
    const assessmentLayout = await page.evaluate(() => {
      const hud = globalThis.document.querySelector('.pixel-hud')
      const dialogue = globalThis.document.querySelector('.pixel-dialogue.has-assessment.has-no-scene-title')
      const backButton = globalThis.document.querySelector('.pixel-dialogue.has-assessment .pixel-page-back')
      const questions = [...globalThis.document.querySelectorAll('.pixel-assessment-question')]
      const firstQuestion = questions[0]
      if (!hud || !dialogue || !backButton || !firstQuestion) {
        return { backPosition: null, contentGap: null, questionGap: null, overlapsQuestion: true }
      }
      const hudBounds = hud.getBoundingClientRect()
      const dialogueBounds = dialogue.getBoundingClientRect()
      const backBounds = backButton.getBoundingClientRect()
      const firstQuestionBounds = firstQuestion.getBoundingClientRect()
      return {
        backPosition: globalThis.getComputedStyle(backButton).position,
        contentGap: dialogueBounds.top - hudBounds.bottom,
        questionGap: firstQuestionBounds.top - dialogueBounds.top,
        overlapsQuestion: questions.some((question) => {
          const questionBounds = question.getBoundingClientRect()
          return backBounds.left < questionBounds.right
            && backBounds.right > questionBounds.left
            && backBounds.top < questionBounds.bottom
            && backBounds.bottom > questionBounds.top
        })
      }
    })
    assert.equal(assessmentLayout.backPosition, 'static')
    assert.ok(assessmentLayout.contentGap !== null && assessmentLayout.contentGap <= 24)
    assert.ok(assessmentLayout.questionGap !== null && assessmentLayout.questionGap <= 24)
    assert.equal(assessmentLayout.overlapsQuestion, false)
    await capture(page, 'module-2-assessment-group.png')
    await page.setViewportSize({ width: 390, height: 844 })
    const assessmentWidths = await page.evaluate(() => ({
      body: globalThis.document.body.scrollWidth,
      document: globalThis.document.documentElement.scrollWidth,
      viewport: globalThis.innerWidth
    }))
    assert.equal(assessmentWidths.body, assessmentWidths.viewport)
    assert.equal(assessmentWidths.document, assessmentWidths.viewport)
    const narrowAssessmentLayout = await page.evaluate(() => {
      const hud = globalThis.document.querySelector('.pixel-hud')
      const dialogue = globalThis.document.querySelector('.pixel-dialogue.has-assessment.has-no-scene-title')
      const backButton = globalThis.document.querySelector('.pixel-dialogue.has-assessment .pixel-page-back')
      const firstQuestion = globalThis.document.querySelector('.pixel-assessment-question')
      if (!hud || !dialogue || !backButton || !firstQuestion) {
        return { contentGap: null, questionGap: null, overlapsQuestion: true }
      }
      const hudBounds = hud.getBoundingClientRect()
      const dialogueBounds = dialogue.getBoundingClientRect()
      const backBounds = backButton.getBoundingClientRect()
      const firstQuestionBounds = firstQuestion.getBoundingClientRect()
      return {
        contentGap: dialogueBounds.top - hudBounds.bottom,
        questionGap: firstQuestionBounds.top - dialogueBounds.top,
        overlapsQuestion: [...globalThis.document.querySelectorAll('.pixel-assessment-question')].some((question) => {
          const questionBounds = question.getBoundingClientRect()
          return backBounds.left < questionBounds.right
            && backBounds.right > questionBounds.left
            && backBounds.top < questionBounds.bottom
            && backBounds.bottom > questionBounds.top
        })
      }
    })
    assert.ok(narrowAssessmentLayout.contentGap !== null && narrowAssessmentLayout.contentGap <= 24)
    assert.ok(narrowAssessmentLayout.questionGap !== null && narrowAssessmentLayout.questionGap <= 24)
    assert.equal(narrowAssessmentLayout.overlapsQuestion, false)
    await page.locator('.pixel-assessment-question').first().scrollIntoViewIfNeeded()
    await capture(page, 'module-2-assessment-group-390px.png')
    await page.setViewportSize({ width: 1180, height: 780 })
  }

  let firstChoiceQuestion
  const answerQuestions = async (answerFirstChoiceIncorrectly) => {
    for (const question of group.questions) {
      const questionCard = page.locator('.pixel-assessment-question').filter({ hasText: question.prompt })
      if (question.type === 'multiple-choice') {
        const answerIndex = answerFirstChoiceIncorrectly && !firstChoiceQuestion
          ? (question.answerIndex + 1) % question.choices.length
          : question.answerIndex
        if (!firstChoiceQuestion) firstChoiceQuestion = question
        await questionCard.getByRole('button', { name: question.choices[answerIndex], exact: true }).click()
      } else {
        await questionCard.getByRole('textbox', { name: 'Câu trả lời của bạn' }).fill(
          `Câu trả lời do người học tự viết để đáp ứng các tiêu chí công khai của câu ${question.id}.`
        )
      }
    }
  }

  await answerQuestions(retryFirstChoice)
  await page.getByRole('button', { name: `Nộp ${group.questions.length} câu trả lời`, exact: true }).click()

  if (group.id === 'final-assessment') {
    await page.getByText(`Bạn đã trả lời ${group.questions.length}/${group.questions.length} câu`, { exact: false }).waitFor()
    assert.equal(await page.getByRole('button', { name: `Xem kết quả ${group.questions.length} câu`, exact: true }).count(), 0)
    if (retryFirstChoice) {
      await page.getByRole('button', { name: `Làm lại ${group.questions.length} câu`, exact: true }).click()
      for (const question of group.questions) {
        await page.getByText(question.prompt, { exact: true }).waitFor()
      }
      await answerQuestions(false)
      await page.getByRole('button', { name: `Nộp ${group.questions.length} câu trả lời`, exact: true }).click()
      await page.getByText(`Bạn đã trả lời ${group.questions.length}/${group.questions.length} câu`, { exact: false }).waitFor()
    }
    return
  }

  if (retryFirstChoice && firstChoiceQuestion) {
    const retryButton = page.getByRole('button', { name: 'Chọn lại câu chưa đúng', exact: true })
    await retryButton.waitFor()
    await retryButton.scrollIntoViewIfNeeded()
    await capture(page, 'module-2-assessment-feedback-retry.png')
    await retryButton.click()
    const firstQuestionCard = page.locator('.pixel-assessment-question').filter({ hasText: firstChoiceQuestion.prompt })
    await firstQuestionCard.getByRole('button', {
      name: firstChoiceQuestion.choices[firstChoiceQuestion.answerIndex],
      exact: true
    }).click()
    await page.getByRole('button', { name: `Nộp ${group.questions.length} câu trả lời`, exact: true }).click()
    assert.equal(await page.getByRole('button', { name: 'Chọn lại câu chưa đúng', exact: true }).count(), 0)
  }

  for (const question of group.questions) {
    const questionCard = page.locator('.pixel-assessment-question').filter({ hasText: question.prompt })
    const sourcePanel = questionCard.locator('.pixel-assessment-source')
    assert.equal(await sourcePanel.count(), 0)
    if (question.type !== 'multiple-choice') {
      await questionCard.getByRole('button', { name: 'Câu trả lời đáp ứng đủ tiêu chí', exact: true }).click()
    }
  }

  const continueLabel = group.mode === 'mastery'
    ? `Xem kết quả ${group.questions.length} câu`
    : 'Tiếp tục bài học'
  await page.getByRole('button', { name: continueLabel, exact: true }).click()
}

async function completeSetupModule(page, companionPage, electronApp, verifyResponsiveLayout = false) {
  await page.getByRole('button', { name: /MODULE 1.*MỞ BÀI HỌC/ }).click()
  await page.getByText('MODULE 1 · BÀI 1/3 · TRANG 1/7', { exact: true }).first().waitFor()
  await verifyOutlineNavigation(page, 'module-1', join(userDataDirectory, 'learner-state.json'), screenshotDirectory)
  assert.ok(await page.getByRole('button', { name: '← Trang trước', exact: true }).isDisabled())
  for (const id of ['module-1-chat-work', 'module-1-why-codex']) {
    const scene = page.locator(`main[data-scene-id="${id}"]`)
    await scene.locator('.module-one-opening img').evaluate(image => image.decode())
    await scene.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  }
  await page.getByText('MODULE 1 · BÀI 1/3 · TRANG 3/7', { exact: true }).first().waitFor()
  assert.equal(
    await page.locator('.pixel-dialogue > p').textContent(),
    'Codex là coding agent của OpenAI. Ở bài này, mình chỉ cần bạn hiểu coding agent là một trợ lý có thể thực hiện công việc liên quan đến code: tạo ứng dụng, xây trang web, chỉnh sửa dự án và tự động hóa những việc lặp lại.'
  )
  assert.equal(await page.getByText('pilot-workspace/', { exact: true }).count(), 0)
  assert.equal(await page.locator('.pixel-lesson-visual').count(), 1)
  assert.equal(await page.locator('.pixel-lesson-visual figcaption').count(), 0)
  assert.equal(await page.getByRole('button', { name: 'Phóng to ảnh minh họa', exact: true }).count(), 1)
  assert.equal(
    await page.getByRole('button', { name: '← Trang trước', exact: true }).isDisabled(),
    false
  )
  await capture(page, 'module-1-codex-introduction.png')

  if (verifyResponsiveLayout) {
    await page.setViewportSize({ width: 390, height: 844 })
    const introductionNarrowWidths = await page.evaluate(() => {
      const browserDocument = globalThis.document
      return {
        body: browserDocument.body.scrollWidth,
        document: browserDocument.documentElement.scrollWidth,
        viewport: globalThis.innerWidth
      }
    })
    assert.equal(introductionNarrowWidths.body, introductionNarrowWidths.viewport)
    assert.equal(introductionNarrowWidths.document, introductionNarrowWidths.viewport)
    const lessonVisualBounds = await page.locator('.pixel-lesson-visual').boundingBox()
    assert.ok(lessonVisualBounds)
    assert.ok(lessonVisualBounds.width <= introductionNarrowWidths.viewport)
    await capture(page, 'module-1-codex-introduction-390px.png')
    await page.setViewportSize({ width: 1180, height: 780 })
  }

  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByText('MODULE 1 · BÀI 1/3 · TRANG 4/7', { exact: true }).first().waitFor()
  assert.equal(
    await page.getByRole('button', { name: '← Trang trước', exact: true }).isDisabled(),
    false
  )
  assert.equal(await page.locator('.pixel-lesson-visual').count(), 1)
  assert.equal(await page.locator('.pixel-lesson-visual img').getAttribute('data-fit'), 'contain')
  assert.match(await page.locator('.pixel-dialogue > p').textContent(), /Được rồi, vậy chúng ta sẽ bắt đầu tìm hiểu Codex cùng nhau nha/)
  assert.match(await page.locator('.pixel-dialogue > p').textContent(), /Ask for approval luôn hỏi bạn trước khi chỉnh sửa tệp bên ngoài dự án hoặc sử dụng Internet/)
  assert.match(await page.locator('.pixel-dialogue > p').textContent(), /mình khuyên bạn dùng Approve for me/)
  assert.equal(await page.locator('.pixel-approval-focus').count(), 3)
  assert.equal(await page.locator('.pixel-approval-term').count(), 4)
  const approvalFocus = (focus) => page.locator(`.pixel-approval-focus[data-approval-focus="${focus}"]`)
  const approvalTerm = (focus) => page.locator(`.pixel-approval-term[data-approval-focus="${focus}"]`)
  await approvalTerm('ask').click()
  assert.equal(await approvalTerm('ask').getAttribute('aria-pressed'), 'true')
  assert.equal(await approvalFocus('ask').evaluate((element) => element.classList.contains('is-active')), true)
  assert.equal(await approvalFocus('approve').evaluate((element) => element.classList.contains('is-active')), false)
  await approvalTerm('full').focus()
  await approvalTerm('full').press('Enter')
  assert.equal(await approvalTerm('full').getAttribute('aria-pressed'), 'true')
  assert.equal(await approvalFocus('full').evaluate((element) => element.classList.contains('is-active')), true)
  await approvalTerm('approve').last().click()
  assert.equal(await approvalTerm('approve').last().getAttribute('aria-pressed'), 'true')
  assert.equal(await approvalFocus('approve').evaluate((element) => element.classList.contains('is-active')), true)
  assert.equal(await page.locator('.pixel-approval-frame').evaluate((element) => element.classList.contains('is-manual')), true)
  assert.equal(await page.locator('.pixel-lesson-visual figcaption').count(), 0)
  const expandVisualButton = page.getByRole('button', { name: 'Phóng to ảnh minh họa', exact: true })
  await expandVisualButton.click()
  const visualLightbox = page.getByRole('dialog', { name: 'Ảnh minh họa phóng to', exact: true })
  await visualLightbox.waitFor()
  assert.equal(
    await visualLightbox.locator('.pixel-approval-focus[data-approval-focus="approve"]').evaluate((element) => element.classList.contains('is-active')),
    true
  )
  assert.equal(
    await page.getByRole('button', { name: 'Đóng ảnh phóng to', exact: true }).evaluate((element) => element === globalThis.document.activeElement),
    true
  )
  await capture(page, 'module-1-codex-approval-expanded.png')
  await page.keyboard.press('Escape')
  assert.equal(await visualLightbox.count(), 0)
  await page.evaluate(() => new Promise((resolve) => globalThis.requestAnimationFrame(() =>
    globalThis.requestAnimationFrame(resolve)
  )))
  const approvalVisualBounds = await page.locator('.pixel-lesson-visual').boundingBox()
  const approvalDialogueBounds = await page.locator('.pixel-dialogue').boundingBox()
  assert.ok(approvalVisualBounds)
  assert.ok(approvalDialogueBounds)
  if (verifyResponsiveLayout) assert.ok(approvalVisualBounds.y + approvalVisualBounds.height < approvalDialogueBounds.y)
  await capture(page, 'module-1-codex-approval-intro.png')
  if (verifyResponsiveLayout) {
    await page.setViewportSize({ width: 390, height: 844 })
    const approvalNarrowWidths = await page.evaluate(() => {
      const browserDocument = globalThis.document
      return {
        body: browserDocument.body.scrollWidth,
        document: browserDocument.documentElement.scrollWidth,
        viewport: globalThis.innerWidth
      }
    })
    assert.equal(approvalNarrowWidths.body, approvalNarrowWidths.viewport)
    assert.equal(approvalNarrowWidths.document, approvalNarrowWidths.viewport)
    const approvalNarrowVisualBounds = await page.locator('.pixel-lesson-visual').boundingBox()
    assert.ok(approvalNarrowVisualBounds)
    assert.ok(approvalNarrowVisualBounds.width <= approvalNarrowWidths.viewport)
    assert.ok(approvalNarrowVisualBounds.width >= approvalNarrowWidths.viewport - 48)
    await expandVisualButton.click()
    await visualLightbox.waitFor()
    const approvalNarrowLightboxBounds = await visualLightbox.boundingBox()
    assert.ok(approvalNarrowLightboxBounds)
    assert.ok(approvalNarrowLightboxBounds.width <= approvalNarrowWidths.viewport)
    await capture(page, 'module-1-codex-approval-expanded-390px.png')
    await page.getByRole('button', { name: 'Đóng ảnh phóng to', exact: true }).click()
    await capture(page, 'module-1-codex-approval-intro-390px.png')
    await page.setViewportSize({ width: 1180, height: 780 })
  }
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByText('MODULE 1 · BÀI 1/3 · TRANG 5/7', { exact: true }).first().waitFor()
  const modelIntroBoard = page.locator('.model-controls')
  await modelIntroBoard.waitFor()
  await modelIntroBoard.getByRole('heading', { name: 'Có 3 cấu hình bạn cần để ý', exact: true }).waitFor()
  assert.equal(await modelIntroBoard.locator('[data-highlight]').count(), 3)
  assert.equal(await modelIntroBoard.locator('.model-controls__figure').textContent(), '')
  const progressBeforeModelTab = await page.evaluate(() => globalThis.courseCompanion.loadProgress())
  await page.getByRole('button', { name: 'Tìm hiểu Model →', exact: true }).click()
  await modelIntroBoard.getByRole('heading', { name: 'Model', exact: true }).waitFor()
  assert.equal(await modelIntroBoard.locator('[data-highlight="model"]').count(), 1)
  assert.equal(await modelIntroBoard.locator('[data-highlight]').count(), 1)
  assert.deepEqual(await page.evaluate(() => globalThis.courseCompanion.loadProgress()), progressBeforeModelTab)
  const approvedModelCopy = JSON.parse(await readFile(join(repositoryRoot, 'pilot-workspace/course/codex-setup/model-controls.vi.json'), 'utf8'))
  assert.deepEqual(await modelIntroBoard.locator('.model-controls__personal-copy p').allTextContents(), approvedModelCopy.model)
  const modelDocsLink = modelIntroBoard.getByRole('link', { name: 'Xem tài liệu từ OpenAI' })
  assert.equal(await modelDocsLink.getAttribute('href'), 'https://learn.chatgpt.com/docs/models?surface=app')
  assert.equal(await modelDocsLink.locator('small').count(), 0)
  await page.getByRole('button', { name: '← Trang trước', exact: true }).click()
  await modelIntroBoard.getByRole('heading', { name: 'Có 3 cấu hình bạn cần để ý', exact: true }).waitFor()
  await modelIntroBoard.getByRole('button', { name: '01 Model', exact: true }).click()
  await capture(page, 'module-1-codex-model-intro.png')
  for (const size of [{ width: 1024, height: 768 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(size)
    const layout = await page.evaluate(() => {
      const d = globalThis.document
      const figure = d.querySelector('.model-controls__figure').getBoundingClientRect()
      const detail = d.querySelector('.model-controls__detail').getBoundingClientRect()
      const footer = d.querySelector('.model-controls__actions').getBoundingClientRect()
      const hud = d.querySelector('.pixel-hud').getBoundingClientRect()
      const board = d.querySelector('.model-controls').getBoundingClientRect()
      return { body: d.body.scrollWidth, document: d.documentElement.scrollWidth, viewport: globalThis.innerWidth,
        gap: detail.left - figure.right, footerBottom: footer.bottom, height: globalThis.innerHeight,
        boardTop: board.top, hudBottom: hud.bottom }
    })
    assert.equal(layout.body, layout.viewport)
    assert.equal(layout.document, layout.viewport)
    assert.ok(layout.gap >= 24)
    assert.ok(layout.footerBottom <= layout.height)
    assert.ok(layout.boardTop >= layout.hudBottom)
    await capture(page, `module-1-model-controls-${size.width}px.png`)
  }
  await page.setViewportSize({ width: 390, height: 844 })
  assert.equal(await page.evaluate(() => globalThis.document.documentElement.scrollWidth), 390)
  const narrowFigure = await modelIntroBoard.locator('.model-controls__figure').boundingBox()
  const narrowDetail = await modelIntroBoard.locator('.model-controls__detail').boundingBox()
  assert.ok(narrowDetail.y >= narrowFigure.y + narrowFigure.height)
  await capture(page, 'module-1-model-controls-390px.png')
  await modelDocsLink.scrollIntoViewIfNeeded()
  const narrowSource = await modelDocsLink.boundingBox()
  const narrowActions = await modelIntroBoard.locator('.model-controls__actions').boundingBox()
  assert.ok(narrowSource.y >= 0 && narrowSource.y + narrowSource.height <= narrowActions.y)
  await capture(page, 'module-1-model-controls-390px-scrolled.png')
  await page.setViewportSize({ width: 1180, height: 780 })
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByText('MODULE 1 · BÀI 1/3 · TRANG 6/7', { exact: true }).first().waitFor()
  const effortSpeedBoard = page.locator('.model-controls')
  await effortSpeedBoard.getByRole('heading', { name: 'Effort', exact: true }).waitFor()
  assert.deepEqual(await effortSpeedBoard.locator('.model-controls__personal-copy p').allTextContents(), approvedModelCopy.effort)
  assert.equal(await effortSpeedBoard.locator('[data-highlight="effort"]').count(), 1)
  await capture(page, 'module-1-codex-effort-speed.png')
  assert.deepEqual(await effortSpeedBoard.locator('.model-controls__tabs button').allTextContents(),
    ['Tổng quan', '01 Model', '02 Effort', '03 Speed'])
  await effortSpeedBoard.getByRole('button', { name: '01 Model', exact: true }).click()
  await page.getByText('MODULE 1 · BÀI 1/3 · TRANG 5/7', { exact: true }).first().waitFor()
  await modelIntroBoard.getByRole('heading', { name: 'Model', exact: true }).waitFor()
  await modelIntroBoard.getByRole('button', { name: '02 Effort', exact: true }).click()
  await page.getByText('MODULE 1 · BÀI 1/3 · TRANG 6/7', { exact: true }).first().waitFor()
  await effortSpeedBoard.getByRole('heading', { name: 'Effort', exact: true }).waitFor()
  await page.getByRole('button', { name: 'Tìm hiểu Speed →', exact: true }).click()
  await effortSpeedBoard.getByRole('heading', { name: 'Speed', exact: true }).waitFor()
  assert.deepEqual(await effortSpeedBoard.locator('.model-controls__personal-copy p').allTextContents(), approvedModelCopy.speed)
  assert.equal(await effortSpeedBoard.locator('[data-highlight="speed"]').count(), 1)
  await capture(page, 'module-1-codex-speed.png')
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByText('MODULE 1 · BÀI 1/3 · TRANG 7/7', { exact: true }).first().waitFor()
  const commandVisuals = page.locator('.pixel-lesson-visual-group .pixel-lesson-visual')
  assert.equal(await commandVisuals.count(), 2)
  const commandDialogueText = await page.locator('.pixel-dialogue > p').textContent()
  assert.match(commandDialogueText, /\/status/)
  assert.match(commandDialogueText, /\/goal/)
  assert.match(commandDialogueText, /150\.000 token/)
  assert.match(commandDialogueText, /một đoạn chat trong tài khoản ChatGPT/)
  const slashExpandButton = page.getByRole('button', { name: 'Phóng to ảnh minh họa lệnh /', exact: true })
  const atExpandButton = page.getByRole('button', { name: 'Phóng to ảnh minh họa dấu @', exact: true })
  await slashExpandButton.click()
  await visualLightbox.waitFor()
  assert.match(await visualLightbox.locator('img').getAttribute('alt'), /dấu gạch chéo/)
  await page.getByRole('button', { name: 'Đóng ảnh phóng to', exact: true }).click()
  await atExpandButton.click()
  await visualLightbox.waitFor()
  assert.match(await visualLightbox.locator('img').getAttribute('alt'), /dấu @/)
  await page.keyboard.press('Escape')
  await capture(page, 'module-1-codex-slash-commands.png')
  if (verifyResponsiveLayout) {
    await page.setViewportSize({ width: 390, height: 844 })
    const commandNarrowWidths = await page.evaluate(() => {
      const browserDocument = globalThis.document
      return {
        body: browserDocument.body.scrollWidth,
        document: browserDocument.documentElement.scrollWidth,
        viewport: globalThis.innerWidth
      }
    })
    assert.equal(commandNarrowWidths.body, commandNarrowWidths.viewport)
    assert.equal(commandNarrowWidths.document, commandNarrowWidths.viewport)
    const firstCommandVisualBounds = await commandVisuals.nth(0).boundingBox()
    const secondCommandVisualBounds = await commandVisuals.nth(1).boundingBox()
    assert.ok(firstCommandVisualBounds)
    assert.ok(secondCommandVisualBounds)
    assert.ok(firstCommandVisualBounds.width <= commandNarrowWidths.viewport)
    assert.ok(secondCommandVisualBounds.width <= commandNarrowWidths.viewport)
    assert.ok(secondCommandVisualBounds.y >= firstCommandVisualBounds.y + firstCommandVisualBounds.height)
    await capture(page, 'module-1-codex-slash-commands-390px.png')
    await page.setViewportSize({ width: 1180, height: 780 })
  }
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByText('MODULE 1 · BÀI 2/3 · TRANG 1/4', { exact: true }).first().waitFor()
  const agentsBoard = page.locator('.pixel-guidance-board.is-agents')
  await agentsBoard.waitFor()
  assert.doesNotMatch(await agentsBoard.textContent(), /AGENTS\.md - bộ quy luật cho coding agents/)
  assert.match(await agentsBoard.textContent(), /Vậy, giả dụ có một thông tin mình muốn agent ghi nhớ/)
  assert.match(await agentsBoard.textContent(), /GLOBAL/)
  assert.match(await agentsBoard.textContent(), /CURRENT REPO/)
  assert.doesNotMatch(await agentsBoard.textContent(), /Bạn sẽ tạo Current repo AGENTS\.md.*Module 2/)
  assert.equal(await agentsBoard.locator('figure, img').count(), 0)
  const agentsCopyBounds = await agentsBoard.locator('.pixel-guidance-board__copy').boundingBox()
  const agentsLevelsBounds = await agentsBoard.locator('.pixel-agents-levels').boundingBox()
  assert.ok(agentsCopyBounds)
  assert.ok(agentsLevelsBounds)
  assert.ok(agentsLevelsBounds.y >= agentsCopyBounds.y + agentsCopyBounds.height)
  await capture(page, 'module-1-agents-introduction.png')
  if (verifyResponsiveLayout) {
    await page.setViewportSize({ width: 390, height: 844 })
    const agentsNarrowWidths = await page.evaluate(() => ({
      body: globalThis.document.body.scrollWidth,
      document: globalThis.document.documentElement.scrollWidth,
      viewport: globalThis.innerWidth
    }))
    assert.equal(agentsNarrowWidths.body, agentsNarrowWidths.viewport)
    assert.equal(agentsNarrowWidths.document, agentsNarrowWidths.viewport)
    const agentsLevelCards = agentsBoard.locator('.pixel-agents-levels article')
    const globalLevelBounds = await agentsLevelCards.nth(0).boundingBox()
    const repoLevelBounds = await agentsLevelCards.nth(1).boundingBox()
    assert.ok(globalLevelBounds)
    assert.ok(repoLevelBounds)
    assert.ok(repoLevelBounds.y >= globalLevelBounds.y + globalLevelBounds.height)
    await capture(page, 'module-1-agents-introduction-390px.png')
    await page.setViewportSize({ width: 1180, height: 780 })
  }
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByText('MODULE 1 · BÀI 2/3 · TRANG 2/4', { exact: true }).first().waitFor()
  const skillBoard = page.locator('.pixel-guidance-board.is-skills')
  await skillBoard.waitFor()
  assert.equal(await skillBoard.locator('.pixel-skill-excerpt').count(), 1)
  assert.equal(await skillBoard.locator('figure, img').count(), 0)
  assert.match(await skillBoard.textContent(), /Thông thường ta dùng AGENTS\.md để dạy cho model/)
  assert.match(await skillBoard.textContent(), /Đó là lúc ta sử dụng Skill/)
  assert.match(await skillBoard.textContent(), /name: frontend-design/)
  assert.doesNotMatch(await skillBoard.textContent(), /copywriting/)
  assert.doesNotMatch(await skillBoard.textContent(), /skills\.sh/)
  assert.match(await skillBoard.textContent(), /Bạn vẫn có thể trao đổi với Codex bằng tiếng Việt/)
  const skillKickerTypography = await skillBoard.locator('.pixel-guidance-board__skill-kicker').evaluate((element) => {
    const skillName = element.querySelector('strong')
    const skillDescription = element.querySelector('span')
    if (!skillName || !skillDescription) return null
    return {
      name: Number.parseFloat(globalThis.getComputedStyle(skillName).fontSize),
      description: Number.parseFloat(globalThis.getComputedStyle(skillDescription).fontSize)
    }
  })
  assert.ok(skillKickerTypography)
  assert.ok(skillKickerTypography.name > skillKickerTypography.description)
  if (verifyResponsiveLayout) {
    await page.setViewportSize({ width: 390, height: 844 })
    const skillsNarrowWidths = await page.evaluate(() => ({
      body: globalThis.document.body.scrollWidth,
      document: globalThis.document.documentElement.scrollWidth,
      viewport: globalThis.innerWidth
    }))
    assert.equal(skillsNarrowWidths.body, skillsNarrowWidths.viewport)
    assert.equal(skillsNarrowWidths.document, skillsNarrowWidths.viewport)
    await page.setViewportSize({ width: 1180, height: 780 })
  }
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByText('MODULE 1 · BÀI 2/3 · TRANG 3/4', { exact: true }).first().waitFor()
  await verifySequentialReview(page, 6, 'module-1')
  const portfolioSkillsBoard = page.locator('.pixel-guidance-board.is-skills-portfolio')
  await portfolioSkillsBoard.waitFor()
  assert.equal(await portfolioSkillsBoard.locator('.pixel-skill-excerpt').count(), 0)
  assert.match(await portfolioSkillsBoard.textContent(), /Hai skill bạn sẽ dùng để xây portfolio/)
  assert.match(await portfolioSkillsBoard.textContent(), /frontend-design/)
  assert.match(await portfolioSkillsBoard.textContent(), /copywriting/)
  assert.match(await portfolioSkillsBoard.textContent(), /skills\.sh/)
  if (verifyResponsiveLayout) {
    await page.setViewportSize({ width: 390, height: 844 })
    const portfolioSkillsNarrowWidths = await page.evaluate(() => ({
      body: globalThis.document.body.scrollWidth,
      document: globalThis.document.documentElement.scrollWidth,
      viewport: globalThis.innerWidth
    }))
    assert.equal(portfolioSkillsNarrowWidths.body, portfolioSkillsNarrowWidths.viewport)
    assert.equal(portfolioSkillsNarrowWidths.document, portfolioSkillsNarrowWidths.viewport)
    const portfolioSkillCards = portfolioSkillsBoard.locator('.pixel-guidance-board__skills article')
    const frontendSkillBounds = await portfolioSkillCards.nth(0).boundingBox()
    const copywritingSkillBounds = await portfolioSkillCards.nth(1).boundingBox()
    assert.ok(frontendSkillBounds)
    assert.ok(copywritingSkillBounds)
    assert.ok(copywritingSkillBounds.y >= frontendSkillBounds.y + frontendSkillBounds.height)
    await page.setViewportSize({ width: 1180, height: 780 })
  }
  await portfolioSkillsBoard.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByText('MODULE 1 · BÀI 2/3 · TRANG 4/4', { exact: true }).first().waitFor()
  await page.getByRole('heading', { name: 'Làm quen với Project trong Codex', exact: true }).waitFor()
  await page.getByRole('button', { name: 'Chuyển sang Codex để thực hành', exact: true }).click()
  await page.locator('.practice-brief-overlay').waitFor()
  assert.equal(await page.getByText('Chứng minh cấu hình thật trong Codex', { exact: true }).count(), 0)
  assert.equal(await page.locator('.pixel-harness-board').count(), 0)
  assert.equal(await page.getByText('Dùng cấu hình đã chọn', { exact: true }).count(), 0)
  const practiceBrief = page.locator('.practice-brief-overlay')
  await practiceBrief.getByRole('heading', {
    name: 'Làm quen với cài đặt Codex',
    exact: true
  }).waitFor()
  assert.equal(await practiceBrief.locator('.practice-setup-instructions > li').count(), 3)
  assert.equal(await practiceBrief.locator('.practice-progress').count(), 0)
  assert.equal(await practiceBrief.getByText('Không xác minh được', { exact: true }).count(), 0)
  const setupReference = practiceBrief.locator('.practice-setup-reference')
  assert.equal(await setupReference.getAttribute('open'), null)
  const startPractice = practiceBrief.getByRole('button', { name: 'Bắt đầu thực hành', exact: true })
  await startPractice.scrollIntoViewIfNeeded()
  const desktopStartBounds = await startPractice.boundingBox()
  assert.ok(desktopStartBounds && desktopStartBounds.y >= 0
    && desktopStartBounds.y + desktopStartBounds.height <= await page.evaluate(() => globalThis.innerHeight))
  await capture(page, 'module-1-codex-setup-practice.png')
  await setupReference.locator('summary').focus()
  await page.keyboard.press('Enter')
  assert.equal(await setupReference.getAttribute('open'), '')
  assert.equal(await setupReference.locator('dt').count(), 4)
  for (const value of ['Medium hoặc High', 'Standard', 'Approve for me', 'Tắt']) {
    await setupReference.getByText(value, { exact: true }).waitFor()
  }
  await capture(page, 'module-1-codex-settings-expanded.png')
  await setupReference.locator('summary').press('Enter')
  assert.equal(await setupReference.getAttribute('open'), null)

  if (verifyResponsiveLayout) {
    await page.setViewportSize({ width: 390, height: 844 })
    const narrowWidths = await page.evaluate(() => {
      const browserDocument = globalThis.document
      return {
        body: browserDocument.body.scrollWidth,
        document: browserDocument.documentElement.scrollWidth,
        viewport: globalThis.innerWidth
      }
    })
    assert.equal(narrowWidths.body, narrowWidths.viewport)
    assert.equal(narrowWidths.document, narrowWidths.viewport)
    await capture(page, 'module-1-codex-setup-390px.png')
    const narrowPracticeAction = startPractice
    await narrowPracticeAction.scrollIntoViewIfNeeded()
    const narrowPracticeActionBounds = await narrowPracticeAction.boundingBox()
    assert.ok(narrowPracticeActionBounds)
    assert.ok(narrowPracticeActionBounds.y >= 0)
    assert.ok(narrowPracticeActionBounds.y + narrowPracticeActionBounds.height <= 844)
    await page.setViewportSize({ width: 320, height: 780 })
    await setupReference.locator('summary').click()
    assert.equal(await page.evaluate(() => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth), false)
    await capture(page, 'module-1-codex-settings-320px.png')
    await setupReference.locator('summary').click()
    await page.setViewportSize({ width: 1180, height: 780 })
  }

  await startPractice.click()
  await waitForSnapshot(
    electronApp,
    (windows) => learningWindow(windows)?.visible === false && companionWindow(windows)?.visible === true,
    'Expected Module 1 Practice to leave the lesson and open the Codex companion'
  )
  await companionPage.getByRole('button', { name: 'Mở cửa sổ Triết', exact: true }).click()
  const compactReview = companionPage.getByRole('region', { name: 'Duyệt Practice với Triết' })
  await compactReview.waitFor()
  await compactReview.getByRole('region', { name: 'Tiến độ Practice', exact: true }).waitFor()
  await compactReview.getByText(/\d+\/\d+ bước đã xác minh/).waitFor()
  await compactReview.locator('.practice-compact-next').waitFor()
  assert.equal(await compactReview.locator('.practice-compact-next').count(), 1)
  const hintBefore = await companionPage.evaluate(() => globalThis.courseCompanion.loadPracticeWorkspace())
  await compactReview.locator('.pixel-practice').evaluate((element) => { element.scrollTop = element.scrollHeight })
  await compactReview.getByRole('button', { name: 'Cần gợi ý cho Practice?', exact: true }).click()
  await compactReview.locator('.practice-hint').waitFor()
  assert.match(await compactReview.locator('.practice-hint').innerText(), /Gợi ý mô phỏng/)
  await assertHintPresented(compactReview)
  const hintAfter = await companionPage.evaluate(() => globalThis.courseCompanion.loadPracticeWorkspace())
  assert.deepEqual(hintAfter.review, hintBefore.review)
  assert.deepEqual(hintAfter.checklist, hintBefore.checklist)
  assert.equal(await companionPage.evaluate(() => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth), false)
  await capture(companionPage, 'practice-hint-compact.png')
  await compactReview.getByText('Xem tất cả 4 bước', { exact: true }).click()
  const compactSteps = compactReview.locator('.practice-compact-checklist > li > button')
  assert.equal(await compactSteps.count(), 4)
  for (let index = 0; index < 4; index += 1) {
    assert.equal(await compactSteps.nth(index).getAttribute('aria-expanded'), 'false')
  }
  await compactSteps.nth(0).click()
  await compactReview.getByRole('region', { name: 'Hướng dẫn: Chọn Effort Medium hoặc High', exact: true }).waitFor()
  await compactSteps.nth(1).click()
  assert.equal(await compactSteps.nth(0).getAttribute('aria-expanded'), 'false')
  assert.equal(await compactSteps.nth(1).getAttribute('aria-expanded'), 'true')
  assert.equal(await compactReview.getByRole('region', { name: 'Hướng dẫn: Chọn Effort Medium hoặc High', exact: true }).count(), 0)
  assert.equal(await compactReview.getByText('Mục tiêu', { exact: true }).count(), 0)
  assert.equal(await compactReview.getByText('Kết quả theo từng tiêu chí', { exact: true }).count(), 0)
  assert.equal(await compactReview.getByText('CẤU HÌNH ĐÃ QUAN SÁT', { exact: true }).count(), 0)
  assert.equal(await compactReview.getByText('Bước học hiện tại', { exact: true }).count(), 0)
  await companionPage.getByRole('button', { name: 'Mở Triết toàn màn hình', exact: true }).click()
  await waitForSnapshot(
    electronApp,
    (windows) => learningWindow(windows)?.visible === true && companionWindow(windows)?.visible === false,
    'Expected Practice to continue in the full Teacher workspace'
  )
  const fullTeacher = page.locator('.pixel-teacher-overlay.is-practice-full')
  await fullTeacher.waitFor()
  assert.equal(await page.locator('.practice-guide').count(), 0)
  assert.equal(await fullTeacher.locator('video, .practice-video-replay').count(), 0)
  await fullTeacher.getByRole('button', { name: 'Cần gợi ý cho Practice?', exact: true }).click()
  await fullTeacher.locator('.practice-hint').waitFor()
  assert.match(await fullTeacher.locator('.practice-hint').innerText(), /Mình khuyên bạn nhìn vào một điểm/)
  await assertHintPresented(fullTeacher)
  await capture(page, 'practice-hint-desktop.png')
  if (verifyResponsiveLayout) {
    await page.setViewportSize({ width: 390, height: 844 })
    assert.equal(await page.evaluate(() => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth), false)
    await assertHintPresented(fullTeacher)
    await capture(page, 'practice-hint-narrow.png')
    await page.setViewportSize({ width: 1180, height: 780 })
  }
  await fullTeacher.getByRole('button', { name: 'Đóng gợi ý', exact: true }).click()
  assert.equal(await fullTeacher.getByRole('button', { name: 'Cần gợi ý cho Practice?', exact: true }).evaluate(
    (element) => globalThis.document.activeElement === element), true)
  assert.equal(await fullTeacher.locator('.pixel-chat-composer').count(), 0)
  assert.equal(await fullTeacher.locator('.pixel-chat-log').count(), 0)
  await fullTeacher.getByRole('button', { name: 'Nộp bài', exact: true }).click()
  const reviewOutcome = await Promise.race([
    fullTeacher.getByText('Đã đạt', { exact: true }).waitFor().then(() => 'passed'),
    fullTeacher.locator('.pixel-chat-warning[role="alert"]').waitFor().then(async () =>
      `error: ${await fullTeacher.locator('.pixel-chat-warning[role="alert"]').innerText()}`)
  ])
  assert.equal(reviewOutcome, 'passed')
  const repeatedReview = await page.evaluate(() => globalThis.courseCompanion?.reviewPractice())
  assert.equal('error' in repeatedReview, false)
  assert.equal(repeatedReview.workspace.review.comparison.kind, 'unchanged')
  assert.equal(repeatedReview.workspace.review.comparison.previousCompletedCount, 4)
  assert.equal(repeatedReview.workspace.review.comparison.currentCompletedCount, 4)
  assert.deepEqual(repeatedReview.workspace.review.comparison.needsReverification, [])
  assert.deepEqual(repeatedReview.workspace.review.comparison.newlyVerified, [])
  await fullTeacher.getByRole('button', { name: 'Lưu kết quả và quay lại khóa học', exact: true }).click()
  await waitForSnapshot(
    electronApp,
    (windows) => learningWindow(windows)?.visible === true && companionWindow(windows)?.visible === false,
    'Expected the passed Module 1 Practice to return to the lesson'
  )
  assert.equal(await page.locator('.practice-guide, .practice-guide-mastery').count(), 0)
  await companionPage.evaluate(() => globalThis.courseCompanion?.setCompanionMode('compact'))
  await page.getByText('Bây giờ hãy cùng nhau trả lời các câu hỏi ôn tập để củng cố kiến thức vừa học nhen!', { exact: true }).waitFor()
  assert.equal(await page.locator('.pixel-scene-title').count(), 0)
  assert.equal(await page.locator('.pixel-consequence').count(), 0)
  await capture(page, 'module-1-codex-setup-approved.png')
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  const assessmentQuestions = page.locator('.pixel-assessment-question')
  await assessmentQuestions.first().waitFor()
  assert.equal(await assessmentQuestions.count(), 4)
  const moduleOneAssessment = page.getByRole('region', { name: 'Câu hỏi Module 1', exact: true })
  assert.equal(await moduleOneAssessment.locator('.pixel-speaker').count(), 0)
  assert.equal(await moduleOneAssessment.getByText('Bạn có thể xem toàn bộ câu hỏi trước khi nộp.', { exact: true }).count(), 0)
  assert.equal(await page.locator('.pixel-scene-title').count(), 0)
  assert.equal(await moduleOneAssessment.locator('.pixel-assessment-header').count(), 0)
  await capture(page, 'module-1-final-questions.png')
  await answerAssessmentGroup(page, 'setup-final-assessment')

  await page.getByText(/Bạn đạt 4\/4 câu/).waitFor()
  await page.locator('.pixel-outline summary').getByText(/TRANG 6\/6/).waitFor()
  await capture(page, 'module-1-final-review.png')
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByRole('heading', { name: 'Lộ trình khóa học' }).waitFor()
  await page.getByText('HOÀN THÀNH', { exact: true }).first().waitFor()
}

async function assertNavigationAlignment(page, label) {
  const layout = await page.evaluate(() => {
    if (globalThis.innerWidth < 1000) return []
    const rows = globalThis.document.querySelectorAll(
      '.pixel-lesson-actions.is-paired, .pixel-model-board__actions, .pixel-guidance-board__actions, .pixel-plan-board__actions, .pixel-assessment-actions, .pixel-summary-navigation'
    )
    return [...rows].flatMap((row) => {
      if (!row.checkVisibility()) return []
      const back = row.querySelector('.pixel-page-back')
      const buttons = [...row.querySelectorAll('button')].filter((button) => button !== back && button.checkVisibility())
      const next = buttons.at(-1)
      if (!back || !next) return []
      const previous = back.getBoundingClientRect()
      const following = next.getBoundingClientRect()
      return [{
        row: row.className,
        topDifference: Math.abs(previous.top - following.top),
        bottomDifference: Math.abs(previous.bottom - following.bottom),
        gap: following.left - previous.right,
        left: previous.left,
        right: following.right,
        viewport: globalThis.innerWidth
      }]
    })
  })
  for (const row of layout) {
    assert.ok(row.topDifference <= 2 && row.bottomDifference <= 2, `${label}: navigation should have equal height and alignment: ${JSON.stringify(row)}`)
    assert.ok(row.gap >= 8 && row.left >= 0 && row.right <= row.viewport, `${label}: navigation should have visible space without horizontal overflow: ${JSON.stringify(row)}`)
  }
}

async function verifySequentialReview(page, count, label) {
  const statePath = join(userDataDirectory, 'learner-state.json')
  const before = await readFile(statePath, 'utf8')
  const signature = () => page.locator('.pixel-outline summary').textContent()
  const current = await signature()
  const history = []
  for (let index = 0; index < count; index += 1) {
    await page.getByRole('button', { name: '← Trang trước', exact: true }).click()
    history.unshift(await signature())
    await assertNavigationAlignment(page, `${label} back ${index + 1}`)
  }
  for (const [index, expected] of [...history.slice(1), current].entries()) {
    const topic = await page.locator('.model-controls').getAttribute('data-topic', { timeout: 100 }).catch(() => null)
    if (topic === 'overview' || topic === 'effort') {
      await page.getByRole('button', { name: topic === 'overview' ? 'Tìm hiểu Model →' : 'Tìm hiểu Speed →', exact: true }).click()
    }
    await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
    assert.equal(await signature(), expected, `${label}: continue must advance exactly one visited page`)
    await assertNavigationAlignment(page, `${label} forward ${index + 1}`)
    await capture(page, `${label}-review-forward-${index + 1}.png`)
  }
  assert.equal(await readFile(statePath, 'utf8'), before, `${label}: history navigation must not change saved progress`)
}

async function waitForImageDecode(image) {
  await image.evaluate(async (element) => {
    if (!element.complete) {
      await new Promise((resolve, reject) => {
        element.addEventListener('load', resolve, { once: true })
        element.addEventListener('error', reject, { once: true })
      })
    }
    if (typeof element.decode === 'function') await element.decode()
  })
}

async function assertHintPresented(teacher) {
  const hint = teacher.getByRole('status', { name: 'Gợi ý của Triết', exact: true })
  const layout = await hint.evaluate((element) => {
    const paragraph = element.querySelector('p')
    const scrollArea = element.closest('.pixel-practice')
    const nextContent = element.nextElementSibling
    const bounds = element.getBoundingClientRect()
    const viewport = scrollArea.getBoundingClientRect()
    return {
      focused: globalThis.document.activeElement === element,
      visibleStart: bounds.top >= Math.max(0, viewport.top) - 1
        && paragraph.getBoundingClientRect().top < Math.min(globalThis.innerHeight, viewport.bottom),
      beforeContent: !nextContent || bounds.bottom <= nextContent.getBoundingClientRect().top,
      nestedScroll: paragraph.scrollHeight > paragraph.clientHeight,
      overflow: element.scrollWidth > element.clientWidth,
      fontSize: Number.parseFloat(globalThis.getComputedStyle(paragraph).fontSize)
    }
  })
  assert.equal(layout.focused, true, 'A returned hint must receive focus automatically')
  assert.equal(layout.visibleStart, true, 'The hint heading and start of its text must be in view without manual scrolling')
  assert.equal(layout.beforeContent, true, 'Hint feedback must precede the prompt and guide')
  assert.equal(layout.nestedScroll, false, 'Read the hint using the Practice scrollbar, without an inner text scrollbar')
  assert.equal(layout.overflow, false)
  assert.ok(layout.fontSize >= 13)
}

async function capture(page, filename) {
  for (const picture of await page.locator('img:visible').all()) await waitForImageDecode(picture)
  await assertNavigationAlignment(page, filename)
  const palette = await page.evaluate(() => {
    const colorProperties = [
      'color',
      'backgroundColor',
      'borderTopColor',
      'borderRightColor',
      'borderBottomColor',
      'borderLeftColor',
      'outlineColor'
    ]
    const samples = new Map()

    const parseColor = (value) => {
      const match = value.match(/^rgba?\(\s*(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)(?:\D+(\d+(?:\.\d+)?))?\s*\)$/)
      if (!match) return null
      const alpha = match[4] === undefined ? 1 : Number(match[4])
      if (alpha < 0.05) return null
      return [Number(match[1]), Number(match[2]), Number(match[3])]
    }

    const classify = ([red, green, blue]) => {
      const maximum = Math.max(red, green, blue)
      const minimum = Math.min(red, green, blue)
      const relativeChroma = maximum === 0 ? 0 : (maximum - minimum) / maximum
      if (maximum < 72 || relativeChroma < 0.22) return 'neutral'
      if (red > 185 && green > 170 && blue > 155) return 'neutral'
      if (red > 190 && green > 145 && blue < 170) return 'yellow'
      if (green > red + 28 && green > blue + 18) return 'success'
      if (red > green + 34 && red > blue + 22) return 'danger'
      if (blue > red + 22 || (green > red + 28 && blue >= green - 22)) return 'information'
      return 'other'
    }

    for (const element of globalThis.document.querySelectorAll('body *')) {
      // The approved CSS illustration has its own palette, like the screenshots.
      if (element.closest('img, picture, video, canvas, .planning-guide .desk')) continue
      const style = globalThis.getComputedStyle(element)
      const rect = element.getBoundingClientRect()
      if (
        style.display === 'none'
        || style.visibility === 'hidden'
        || Number(style.opacity) < 0.05
        || rect.width < 1
        || rect.height < 1
      ) continue

      for (const property of colorProperties) {
        const value = style[property]
        if (element.matches('.planning-guide .step[aria-current="step"] span')
          && property.startsWith('border') && value === 'rgb(173, 149, 92)') continue
        const parsed = parseColor(value)
        if (!parsed) continue
        const family = classify(parsed)
        const familySamples = samples.get(family) ?? new Set()
        if (familySamples.size < 5) familySamples.add(value)
        samples.set(family, familySamples)
      }
    }

    return Object.fromEntries(
      [...samples.entries()].map(([family, values]) => [family, [...values]])
    )
  })
  const families = Object.keys(palette)
  const unexpectedFamilies = families.filter((family) => !['neutral', 'yellow'].includes(family))
  assert.deepEqual(
    unexpectedFamilies,
    [],
    `${filename} uses colors outside neutral and yellow: ${JSON.stringify(palette)}`
  )
  if (!screenshotDirectory || (screenshotFilter && !filename.includes(screenshotFilter))) return
  await mkdir(screenshotDirectory, { recursive: true })
  await page.bringToFront()
  await page.screenshot({
    animations: 'disabled',
    path: join(screenshotDirectory, filename)
  })
}

async function verifyDesignReferenceLinks(page) {
  for (const [label, href] of designReferenceLinks) {
    const link = page.getByRole('link', { name: label, exact: true })
    assert.equal(await link.count(), 1)
    assert.equal(await link.getAttribute('href'), href)
    assert.equal(await link.getAttribute('target'), '_blank')
    assert.equal(await link.getAttribute('rel'), 'noreferrer')
  }

  const firstLink = page.getByRole('link', { name: 'Pafolios', exact: true })
  const defaultColor = await firstLink.evaluate((element) => globalThis.getComputedStyle(element).color)
  await firstLink.hover()
  await page.waitForTimeout(150)
  const hoverColor = await firstLink.evaluate((element) => globalThis.getComputedStyle(element).color)
  assert.notEqual(hoverColor, defaultColor)
  await page.keyboard.press('Tab')
  await firstLink.focus()
  assert.notEqual(
    await firstLink.evaluate((element) => globalThis.getComputedStyle(element).outlineStyle),
    'none'
  )
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).focus()
}

async function moduleTwoHistoryReviewLayout(page) {
  return page.evaluate(() => {
    const dialogue = globalThis.document.querySelector('.pixel-dialogue.is-module-two-review')?.getBoundingClientRect()
    const dialogueText = globalThis.document.querySelector('.pixel-dialogue.is-module-two-review > p')?.getBoundingClientRect()
    const backButton = globalThis.document.querySelector('.pixel-dialogue.is-module-two-review .pixel-page-back')?.getBoundingClientRect()
    const returnButton = globalThis.document.querySelector('.pixel-dialogue.is-module-two-review .pixel-lesson-actions .pixel-choice')?.getBoundingClientRect()
    return {
      body: globalThis.document.body.scrollWidth,
      document: globalThis.document.documentElement.scrollWidth,
      viewportWidth: globalThis.innerWidth,
      viewportHeight: globalThis.innerHeight,
      dialogue: dialogue ? { top: dialogue.top, right: dialogue.right, bottom: dialogue.bottom, left: dialogue.left } : null,
      dialogueText: dialogueText ? { top: dialogueText.top, right: dialogueText.right, bottom: dialogueText.bottom, left: dialogueText.left } : null,
      backButton: backButton ? { top: backButton.top, right: backButton.right, bottom: backButton.bottom, left: backButton.left } : null,
      returnButton: returnButton ? { top: returnButton.top, right: returnButton.right, bottom: returnButton.bottom, left: returnButton.left } : null
    }
  })
}

function assertModuleTwoHistoryReviewLayout(layout, label) {
  assert.equal(layout.body, layout.viewportWidth, `${label} body should not overflow horizontally`)
  assert.equal(layout.document, layout.viewportWidth, `${label} document should not overflow horizontally`)
  assert.ok(layout.dialogue, `${label} should render the Module 2 review dialogue`)
  assert.ok(layout.dialogueText, `${label} should render the review copy`)
  assert.ok(layout.backButton, `${label} should render the previous-page control`)
  assert.ok(layout.returnButton, `${label} should render the return control`)
  assert.ok(layout.dialogue.top >= 16, `${label} should preserve visible space above the lowered dialogue: ${JSON.stringify(layout)}`)
  assert.ok(layout.dialogue.bottom <= layout.viewportHeight, `${label} dialogue should remain inside the viewport: ${JSON.stringify(layout)}`)
  assert.ok(
    Math.abs((layout.dialogueText.left - layout.dialogue.left) - (layout.dialogue.right - layout.dialogueText.right)) <= 2,
    `${label} review copy should be horizontally centered: ${JSON.stringify(layout)}`
  )
  assert.ok(
    Math.abs(layout.backButton.bottom - layout.returnButton.bottom) <= 2,
    `${label} review controls should share one bottom row: ${JSON.stringify(layout)}`
  )
  assert.ok(
    Math.min(layout.backButton.top, layout.returnButton.top) - layout.dialogueText.bottom >= 8,
    `${label} review copy should not overlap the controls: ${JSON.stringify(layout)}`
  )
  assert.ok(layout.backButton.left >= layout.dialogue.left && layout.returnButton.right <= layout.dialogue.right)
  assert.ok(layout.backButton.bottom <= layout.dialogue.bottom && layout.returnButton.bottom <= layout.dialogue.bottom)
}


async function launchCourseCompanion(environment = {}) {
  return electron.launch({
    executablePath: electronExecutable,
    args: [mainEntry],
    env: {
      ...process.env,
      COURSE_COMPANION_USER_DATA_DIR: userDataDirectory,
      COURSE_COMPANION_WORKSPACE_ROOT: practiceWorkspace.root,
      COURSE_COMPANION_FAKE_CODEX: '1',
      COURSE_COMPANION_FAKE_CONFIGURATION_READY: '1',
      COURSE_COMPANION_FAKE_TEACHER_LIVE_MODE: '1',
      COURSE_COMPANION_FAKE_TEACHER_FAIL_ONCE: '1',
      ...environment
    }
  })
}

async function windowSnapshot(electronApp) {
  return electronApp.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows().map((window) => {
      const preferences = window.webContents.getLastWebPreferences()
      return {
        url: window.webContents.getURL(),
        visible: window.isVisible(),
        alwaysOnTop: window.isAlwaysOnTop(),
        bounds: window.getBounds(),
        security: {
          contextIsolation: preferences.contextIsolation,
          nodeIntegration: preferences.nodeIntegration,
          sandbox: preferences.sandbox
        }
      }
    })
  )
}

async function waitForSnapshot(electronApp, predicate, message) {
  const deadline = Date.now() + 5_000
  let latest = await windowSnapshot(electronApp)

  while (Date.now() < deadline) {
    if (predicate(latest)) return latest
    await new Promise((resolve) => setTimeout(resolve, 50))
    latest = await windowSnapshot(electronApp)
  }

  throw new Error(`${message}\nLatest state: ${JSON.stringify(latest, null, 2)}`)
}

function learningWindow(windows) {
  return windows.find((window) => window.url.includes('#/learning'))
}

function companionWindow(windows) {
  return windows.find((window) => window.url.includes('#/companion'))
}

async function loadWindows(electronApp) {
  const learningPage =
    electronApp.windows().find((page) => page.url().includes('#/learning')) ??
    (await electronApp.waitForEvent('window', {
      predicate: (page) => page.url().includes('#/learning')
    }))
  await learningPage.waitForLoadState('domcontentloaded')

  const companionPage =
    electronApp.windows().find((page) => page.url().includes('#/companion')) ??
    (await electronApp.waitForEvent('window', {
      predicate: (page) => page.url().includes('#/companion')
    }))
  await companionPage.waitForLoadState('domcontentloaded')
  return { learningPage, companionPage }
}

async function verifyHomeBase(page) {
  await page.getByRole('heading', { name: 'Lộ trình khóa học' }).waitFor()
  await page.getByText('TIẾN ĐỘ TOÀN KHÓA', { exact: true }).waitFor()
  await page.getByText('BẠN ĐANG Ở ĐÂY', { exact: true }).waitFor()
  assert.equal(
    await page
      .getByText('Chọn chặng có nhãn “Bạn đang ở đây” để tiếp tục học.', { exact: true })
      .count(),
    0
  )
  const typography = await page.evaluate(async () => {
    await globalThis.document.fonts.ready
    const heading = globalThis.document.querySelector('#homeBaseTitle')
    return {
      body: globalThis.getComputedStyle(globalThis.document.body).fontFamily,
      heading: heading ? globalThis.getComputedStyle(heading).fontFamily : '',
      regularLoaded: globalThis.document.fonts.check('400 16px "Be Vietnam Pro"', 'Tiếng Việt có dấu'),
      boldLoaded: globalThis.document.fonts.check('800 16px "Be Vietnam Pro"', 'Lộ trình khóa học')
    }
  })
  assert.match(typography.body, /Be Vietnam Pro/)
  assert.match(typography.heading, /Be Vietnam Pro/)
  assert.equal(typography.regularLoaded, true)
  assert.equal(typography.boldLoaded, true)
  assert.equal(await page.locator('.pixel-app-current').count(), 0)
  const teacherAnimation = await page
    .locator('.pixel-home-teacher img')
    .evaluate((element) => globalThis.getComputedStyle(element).animationName)
  assert.match(teacherAnimation, /pixel-teacher-idle/)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(
    await page
      .locator('.pixel-home-teacher img')
      .evaluate((element) => globalThis.getComputedStyle(element).animationName),
    'none'
  )
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  assert.equal(await page.getByRole('navigation', { name: 'Điều hướng Course Companion' }).count(), 0)
  assert.equal(await page.getByRole('button', { name: 'Bài học', exact: true }).count(), 0)
  await page.getByText('SẮP TỚI', { exact: true }).first().waitFor()
  assert.equal(await page.getByText('00', { exact: true }).count(), 0)
  assert.equal(await page.getByText('Giới thiệu khóa học', { exact: true }).count(), 0)
  await page
    .getByText('Bắt đầu làm việc với Codex', { exact: true })
    .waitFor()
  await page
    .getByText('Planning và PRD trước khi code với AI', { exact: true })
    .waitFor()
  await page.getByText('MODULE 1 · 3 BÀI HỌC', { exact: true }).waitFor()
  await page.getByText('MODULE 2 · 1 BÀI HỌC', { exact: true }).waitFor()
  await capture(page, 'home-base.png')
  if (screenshotDirectory) {
    await page.setViewportSize({ width: 390, height: 844 })
    const narrowWidths = await page.evaluate(() => {
      const browserDocument = globalThis.document
      return {
        body: browserDocument.body.scrollWidth,
        document: browserDocument.documentElement.scrollWidth,
        viewport: globalThis.innerWidth
      }
    })
    assert.equal(narrowWidths.body, narrowWidths.viewport)
    assert.equal(narrowWidths.document, narrowWidths.viewport)
    await capture(page, 'home-base-390px.png')
    await page.setViewportSize({ width: 1180, height: 780 })
  }
}

let firstLaunch
let resumedLaunch
let chatHistoryLaunch

try {
  firstLaunch = await launchCourseCompanion()
  const firstWindows = await loadWindows(firstLaunch)
  const initial = await waitForSnapshot(
    firstLaunch,
    (windows) => learningWindow(windows)?.visible === true && companionWindow(windows)?.visible === false,
    'Expected the learning window to open while the companion stays hidden'
  )

  for (const window of initial) {
    assert.deepEqual(window.security, {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    })
  }
  assert.equal(companionWindow(initial)?.alwaysOnTop, true)

  await firstWindows.learningPage
    .getByRole('heading', { name: 'Chào mừng bạn đến với Vibecoding 101' })
    .waitFor()
  assert.equal(await firstWindows.learningPage.getByText('HÀNH TRÌNH MỚI', { exact: true }).count(), 0)
  const welcomeSurface = await firstWindows.learningPage.evaluate(() => {
    const panel = globalThis.document.querySelector('.pixel-entry-panel')
    const primary = globalThis.document.querySelector('.pixel-entry-primary')
    const world = globalThis.document.querySelector('.pixel-scene-world')
    return {
      shellIsWelcome: globalThis.document.querySelector('.pixel-entry-shell')?.classList.contains('is-welcome'),
      panelBackground: panel ? globalThis.getComputedStyle(panel).backgroundColor : '',
      panelBorderRadius: panel ? globalThis.getComputedStyle(panel).borderRadius : '',
      primaryBorderRadius: primary ? globalThis.getComputedStyle(primary).borderRadius : '',
      worldFilter: world ? globalThis.getComputedStyle(world).filter : ''
    }
  })
  assert.equal(welcomeSurface.shellIsWelcome, true)
  assert.equal(welcomeSurface.panelBackground, 'rgba(0, 0, 0, 0.97)')
  assert.equal(welcomeSurface.panelBorderRadius, '16px')
  assert.equal(welcomeSurface.primaryBorderRadius, '10px')
  assert.match(welcomeSurface.worldFilter, /saturate\(0\.66\)/)
  assert.match(welcomeSurface.worldFilter, /brightness\(0\.5\)/)
  await capture(firstWindows.learningPage, 'welcome-obsidian.png')
  await firstWindows.learningPage.setViewportSize({ width: 390, height: 844 })
  const welcomeNarrowWidths = await firstWindows.learningPage.evaluate(() => ({
    body: globalThis.document.body.scrollWidth,
    document: globalThis.document.documentElement.scrollWidth,
    viewport: globalThis.innerWidth
  }))
  assert.equal(welcomeNarrowWidths.body, welcomeNarrowWidths.viewport)
  assert.equal(welcomeNarrowWidths.document, welcomeNarrowWidths.viewport)
  await capture(firstWindows.learningPage, 'welcome-obsidian-390px.png')
  await firstWindows.learningPage.setViewportSize({ width: 1180, height: 780 })

  await firstWindows.learningPage
    .getByRole('button', { name: 'Cùng bắt đầu nhé' })
    .click()
  await firstWindows.learningPage
    .getByText('GIỚI THIỆU KHÓA HỌC · TRANG 1/3', { exact: true })
    .waitFor()
  await verifyOutlineNavigation(firstWindows.learningPage, 'intro', join(userDataDirectory, 'learner-state.json'), screenshotDirectory)
  await firstWindows.learningPage.getByRole('button', { name: '← Trang trước', exact: true }).waitFor()
  assert.equal(
    await firstWindows.learningPage.getByRole('button', { name: '← Trang trước', exact: true }).isDisabled(),
    true
  )
  assert.equal(await firstWindows.learningPage.locator('.pixel-scene-title').count(), 0)
  assert.equal(await firstWindows.learningPage.locator('.pixel-consequence').count(), 0)
  assert.equal(
    await firstWindows.learningPage.locator('.pixel-dialogue > p').textContent(),
    'Trong khoá học này, bạn sẽ được học cách dùng coding agents thông qua một dự án thực hành: Xây Portfolio cá nhân.'
  )
  const desktopContinueButton = await firstWindows.learningPage
    .getByRole('button', { name: 'Tiếp tục' })
    .boundingBox()
  const desktopChoiceArea = await firstWindows.learningPage
    .locator('.pixel-choices')
    .boundingBox()
  assert.ok(desktopContinueButton)
  assert.ok(desktopChoiceArea)
  assert.ok(desktopContinueButton.width <= 240)
  assert.ok(Math.abs((desktopContinueButton.x + desktopContinueButton.width) - (desktopChoiceArea.x + desktopChoiceArea.width)) <= 1)
  await capture(firstWindows.learningPage, 'lesson-progress.png')
  await firstWindows.learningPage
    .getByRole('button', { name: 'Tiếp tục' })
    .click()
  await firstWindows.learningPage
    .getByRole('button', { name: 'Tiếp tục', exact: true })
    .waitFor()
  await firstWindows.learningPage.getByRole('button', { name: '← Trang trước', exact: true }).click()
  await firstWindows.learningPage
    .getByRole('button', { name: 'Tiếp tục', exact: true })
    .waitFor()
  assert.equal(await firstWindows.learningPage.locator('.pixel-review-notice').count(), 0)
  await capture(firstWindows.learningPage, 'lesson-review-mode.png')
  await firstWindows.learningPage
    .getByRole('button', { name: 'Tiếp tục', exact: true })
    .click()
  await firstWindows.learningPage
    .getByRole('button', { name: 'Tiếp tục', exact: true })
    .waitFor()
  assert.equal(await firstWindows.learningPage.locator('.pixel-scene-title').count(), 0)
  assert.equal(await firstWindows.learningPage.locator('.pixel-consequence').count(), 0)
  assert.equal(
    await firstWindows.learningPage.locator('.pixel-dialogue > p').textContent(),
    'Cuối khoá này, bạn sẽ có một web portfolio thật để có thể gửi cho nhà tuyển dụng.'
  )
  await capture(firstWindows.learningPage, 'course-introduction-page-2.png')
  await firstWindows.learningPage
    .getByRole('button', { name: 'Tiếp tục', exact: true })
    .click()
  await firstWindows.learningPage
    .getByRole('button', { name: 'Bắt đầu Module 1', exact: true })
    .waitFor()
  assert.equal(await firstWindows.learningPage.locator('.pixel-scene-title').count(), 0)
  assert.equal(await firstWindows.learningPage.locator('.pixel-consequence').count(), 0)
  assert.equal(
    await firstWindows.learningPage.locator('.pixel-dialogue > p').textContent(),
    'Những kỹ năng bạn học được trong khoá này không chỉ giúp bạn xây Portfolio, mà còn trang bị cho bạn kiến thức để tạo bất kỳ công cụ nào bạn muốn với AI'
  )
  await capture(firstWindows.learningPage, 'course-introduction-page-3.png')
  if (screenshotDirectory) {
    await firstWindows.learningPage.setViewportSize({ width: 390, height: 844 })
    const introductionNarrowWidths = await firstWindows.learningPage.evaluate(() => {
      const browserDocument = globalThis.document
      return {
        body: browserDocument.body.scrollWidth,
        document: browserDocument.documentElement.scrollWidth,
        viewport: globalThis.innerWidth
      }
    })
    assert.equal(introductionNarrowWidths.body, introductionNarrowWidths.viewport)
    assert.equal(introductionNarrowWidths.document, introductionNarrowWidths.viewport)
    const narrowStartButton = await firstWindows.learningPage
      .getByRole('button', { name: 'Bắt đầu Module 1', exact: true })
      .boundingBox()
    const narrowChoiceArea = await firstWindows.learningPage
      .locator('.pixel-choices')
      .boundingBox()
    const narrowBackButton = await firstWindows.learningPage
      .getByRole('button', { name: '← Trang trước', exact: true })
      .boundingBox()
    assert.ok(narrowStartButton)
    assert.ok(narrowChoiceArea)
    assert.ok(narrowBackButton)
    assert.ok(Math.abs(narrowStartButton.width - narrowChoiceArea.width) <= 1)
    assert.ok(Math.abs(narrowBackButton.width - narrowChoiceArea.width) <= 1)
    assert.ok(narrowStartButton.y + narrowStartButton.height < narrowBackButton.y)
    await capture(firstWindows.learningPage, 'course-introduction-page-3-390px.png')
    await firstWindows.learningPage.setViewportSize({ width: 1180, height: 780 })
  }
  await firstWindows.learningPage
    .getByRole('button', { name: 'Bắt đầu Module 1', exact: true })
    .click()
  await verifyHomeBase(firstWindows.learningPage)
  await completeSetupModule(firstWindows.learningPage, firstWindows.companionPage, firstLaunch)
  assert.equal(await fingerprintTree(practiceWorkspace.canonicalStarter), canonicalStarterFingerprint)
  await verifyHomeBase(firstWindows.learningPage)
  await firstWindows.learningPage
    .getByRole('button', { name: /MODULE 2.*MỞ BÀI HỌC/ })
    .click()
  await firstWindows.learningPage
    .locator('main[data-scene-id="module-2-portfolio-workspace"]')
    .waitFor()
  await firstWindows.learningPage
    .getByText('MODULE 2 · PHẦN 1/8', { exact: true })
    .first()
    .waitFor()
  assert.equal(await firstWindows.learningPage.locator('.pixel-dialogue > p').textContent(), approvedModuleTwoOpening)
  assert.equal(await firstWindows.learningPage.locator('.pixel-consequence').count(), 0)
  assert.equal(await firstWindows.learningPage.locator('.pixel-lesson-visual').count(), 1)
  assert.equal(await firstWindows.learningPage.locator('.pixel-lesson-visual img').getAttribute('data-fit'), 'contain')
  assert.equal(await firstWindows.learningPage.locator('.portfolio-workspace-picker').count(), 0)
  const desktopHudBounds = await firstWindows.learningPage.locator('.pixel-hud').boundingBox()
  const desktopOutlineBounds = await firstWindows.learningPage.locator('.pixel-outline').boundingBox()
  const desktopActionsBounds = await firstWindows.learningPage.locator('.pixel-hud-actions').boundingBox()
  assert.ok(desktopHudBounds)
  assert.ok(desktopOutlineBounds)
  assert.ok(desktopActionsBounds)
  assert.ok(desktopActionsBounds.x > desktopOutlineBounds.x + desktopOutlineBounds.width)
  assert.ok(Math.abs((desktopActionsBounds.x + desktopActionsBounds.width) - (desktopHudBounds.x + desktopHudBounds.width - 22)) <= 2)
  await firstWindows.learningPage.locator('.pixel-outline summary').click()
  assert.equal(await firstWindows.learningPage.locator('.pixel-outline-menu li').count(), 8)
  assert.equal(await firstWindows.learningPage.getByText('Năm giai đoạn, năm tài liệu', { exact: true }).count(), 0)
  assert.equal(await firstWindows.learningPage.locator('.pixel-outline-menu li.is-active').count(), 1)
  await capture(firstWindows.learningPage, 'module-2-opening.png')
  await firstWindows.learningPage.locator('.pixel-outline summary').click()
  if (screenshotDirectory) {
    await firstWindows.learningPage.setViewportSize({ width: 390, height: 844 })
    const moduleTwoNarrowWidths = await firstWindows.learningPage.evaluate(() => {
      const browserDocument = globalThis.document
      return {
        body: browserDocument.body.scrollWidth,
        document: browserDocument.documentElement.scrollWidth,
        viewport: globalThis.innerWidth
      }
    })
    assert.equal(moduleTwoNarrowWidths.body, moduleTwoNarrowWidths.viewport)
    assert.equal(moduleTwoNarrowWidths.document, moduleTwoNarrowWidths.viewport)
    const narrowOutlineBounds = await firstWindows.learningPage.locator('.pixel-outline').boundingBox()
    const narrowActionsBounds = await firstWindows.learningPage.locator('.pixel-hud-actions').boundingBox()
    assert.ok(narrowOutlineBounds)
    assert.ok(narrowActionsBounds)
    assert.ok(narrowActionsBounds.x > narrowOutlineBounds.x)
    assert.equal(await firstWindows.learningPage.getByRole('button', { name: 'Trò chuyện với Triết', exact: true }).isVisible(), true)
    assert.equal(await firstWindows.learningPage.getByRole('button', { name: 'THOÁT', exact: true }).isVisible(), true)
    await firstWindows.learningPage.locator('.pixel-outline summary').click()
    await capture(firstWindows.learningPage, 'module-2-opening-390px.png')
    await firstWindows.learningPage.locator('.pixel-outline summary').click()
    const narrowContinueButton = firstWindows.learningPage
      .getByRole('button', { name: 'Tiếp tục', exact: true })
    await narrowContinueButton.scrollIntoViewIfNeeded()
    const narrowContinueBounds = await narrowContinueButton.boundingBox()
    assert.ok(narrowContinueBounds)
    assert.ok(narrowContinueBounds.y >= 0)
    assert.ok(
      narrowContinueBounds.y + narrowContinueBounds.height <= 845,
      `Expected Module 2 continue button inside 390 × 844 viewport, got ${JSON.stringify(narrowContinueBounds)}`
    )
    await firstWindows.learningPage.setViewportSize({ width: 1180, height: 780 })
  }
  await firstWindows.learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await firstWindows.learningPage.locator('main[data-scene-id="module-2-prd-definition"]').waitFor()
  await firstWindows.learningPage.getByRole('button', { name: '← Trang trước', exact: true }).click()
  await firstWindows.learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).waitFor()
  assertModuleTwoHistoryReviewLayout(
    await moduleTwoHistoryReviewLayout(firstWindows.learningPage),
    'Module 2 review at 1180 × 780'
  )
  await capture(firstWindows.learningPage, 'module-2-opening-review-1180x780.png')
  await firstWindows.learningPage.setViewportSize({ width: 1512, height: 982 })
  assertModuleTwoHistoryReviewLayout(
    await moduleTwoHistoryReviewLayout(firstWindows.learningPage),
    'Module 2 review at 1512 × 982'
  )
  await capture(firstWindows.learningPage, 'module-2-opening-review-1512x982.png')
  await firstWindows.learningPage.setViewportSize({ width: 1180, height: 780 })
  await firstWindows.learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await firstWindows.learningPage.locator('main[data-scene-id="module-2-prd-definition"]').waitFor()
  assert.equal(await firstWindows.learningPage.locator('.pixel-consequence').count(), 0)
  assert.equal(await firstWindows.learningPage.locator('.pixel-lesson-visual').count(), 1)
  assert.equal(await firstWindows.learningPage.locator('.pixel-lesson-visual img').getAttribute('data-fit'), 'contain')
  await firstWindows.learningPage.locator('.pixel-outline summary').click()
  assert.equal(await firstWindows.learningPage.locator('.pixel-outline-menu li.is-complete').count(), 0)
  assert.equal(await firstWindows.learningPage.locator('.pixel-outline-menu li.is-active').count(), 1)
  assert.equal(await firstWindows.learningPage.locator('.pixel-outline-menu li.is-upcoming').count(), 0)
  await capture(firstWindows.learningPage, 'module-2-part-2-outline.png')
  await firstWindows.learningPage.locator('.pixel-outline summary').click()
  await capture(firstWindows.learningPage, 'module-2-prd-definition.png')
  await firstWindows.learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await firstWindows.learningPage.locator('main[data-scene-id="module-2-prd-review-workflow"]').waitFor()
  assert.equal(await firstWindows.learningPage.locator('.pixel-consequence').count(), 0)
  assert.equal(await firstWindows.learningPage.locator('.pixel-lesson-visual').count(), 1)
  assert.equal(await firstWindows.learningPage.locator('.pixel-lesson-visual img').getAttribute('data-fit'), 'contain')
  await capture(firstWindows.learningPage, 'module-2-prd-review-workflow.png')
  await firstWindows.learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await firstWindows.learningPage.getByLabel('Hai nguồn tham khảo thiết kế', { exact: true }).waitFor()
  assert.equal(await firstWindows.learningPage.locator('.pixel-scene-title').count(), 0)
  assert.equal(await firstWindows.learningPage.locator('.pixel-consequence').count(), 0)
  assert.equal(await firstWindows.learningPage.getByLabel('Hai nguồn tham khảo thiết kế', { exact: true }).count(), 1)
  assert.equal(await firstWindows.learningPage.locator('.pixel-lesson-visual-group img').count(), 2)
  assert.equal(await firstWindows.learningPage.getByRole('link', { name: 'Pafolios', exact: true }).count(), 1)
  assert.equal(await firstWindows.learningPage.getByRole('link', { name: 'Awwwards', exact: true }).count(), 1)
  await verifyDesignReferenceLinks(firstWindows.learningPage)
  assert.equal(await firstWindows.learningPage.getByText('Trước khi bắt đầu xây sản phẩm thật, bạn cũng có thể nhờ coding agent tạo một visual prototype bằng HTML — tức là một bản mẫu giao diện có thể mở trong trình duyệt.', { exact: false }).count(), 1)
  await capture(firstWindows.learningPage, 'module-2-five-stage-map.png')
  if (screenshotDirectory) {
    await firstWindows.learningPage.setViewportSize({ width: 390, height: 844 })
    const moduleTwoMapNarrowWidths = await firstWindows.learningPage.evaluate(() => ({
      body: globalThis.document.body.scrollWidth,
      document: globalThis.document.documentElement.scrollWidth,
      viewport: globalThis.innerWidth
    }))
    assert.equal(moduleTwoMapNarrowWidths.body, moduleTwoMapNarrowWidths.viewport)
    assert.equal(moduleTwoMapNarrowWidths.document, moduleTwoMapNarrowWidths.viewport)
    const mapContinueButton = firstWindows.learningPage.getByRole('button', { name: 'Tiếp tục', exact: true })
    await mapContinueButton.scrollIntoViewIfNeeded()
    await capture(firstWindows.learningPage, 'module-2-five-stage-map-390px.png')
    await firstWindows.learningPage.setViewportSize({ width: 1180, height: 780 })
  }
  await firstWindows.learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  const implementationPlanBoard = firstWindows.learningPage.locator('.pixel-plan-board')
  await implementationPlanBoard.waitFor()
  await implementationPlanBoard.getByRole('heading', { name: 'Implementation plan là gì?', exact: true }).waitFor()
  assert.deepEqual(
    await implementationPlanBoard.locator('.pixel-plan-board__lesson-copy p').allTextContents(),
    approvedImplementationPlanIntro.split('\n\n')
  )
  assert.equal(await implementationPlanBoard.locator('.pixel-plan-document > section').count(), 4)
  assert.equal(await implementationPlanBoard.locator('.pixel-plan-phase__criteria:visible').count(), 4)
  assert.match(await implementationPlanBoard.textContent(), /Portfolio mở được trong trình duyệt/)
  assert.match(await implementationPlanBoard.textContent(), /Ảnh giao diện desktop và điện thoại đã được lưu/)
  assert.equal(await implementationPlanBoard.getByText('Chia việc xây sản phẩm thành nhiều phase', { exact: true }).count(), 0)
  assert.equal(await implementationPlanBoard.getByText('Biết khi nào một phase đã hoàn thành', { exact: true }).count(), 0)
  await capture(firstWindows.learningPage, 'module-2-implementation-plan-combined.png')
  if (screenshotDirectory) {
    await firstWindows.learningPage.setViewportSize({ width: 390, height: 844 })
    const planNarrowWidths = await firstWindows.learningPage.evaluate(() => ({
      body: globalThis.document.body.scrollWidth,
      document: globalThis.document.documentElement.scrollWidth,
      viewport: globalThis.innerWidth
    }))
    assert.equal(planNarrowWidths.body, planNarrowWidths.viewport)
    assert.equal(planNarrowWidths.document, planNarrowWidths.viewport)
    await capture(firstWindows.learningPage, 'module-2-implementation-plan-combined-390px.png')
    await firstWindows.learningPage.setViewportSize({ width: 1180, height: 780 })
  }
  await firstWindows.learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await firstWindows.learningPage.getByRole('heading', { name: 'Chọn nơi lưu portfolio', exact: true }).waitFor()
  assert.equal(await firstWindows.learningPage.getByText(approvedPracticeTransitionCopy, { exact: true }).count(), 0)
  await capture(firstWindows.learningPage, 'module-2-portfolio-workspace-boundary.png')
  await firstLaunch.close()
  firstLaunch = undefined

  resumedLaunch = await launchCourseCompanion({
    COURSE_COMPANION_TEST_PORTFOLIO_WORKSPACE: learningPortfolioWorkspaceDirectory
  })
  const { learningPage, companionPage } = await loadWindows(resumedLaunch)

  await learningPage
    .getByRole('heading', { name: 'Tiếp tục đúng nơi bạn dừng lại' })
    .waitFor()
  await learningPage
    .getByText('Mục đích của portfolio này là gì?', { exact: true })
    .waitFor()
  await learningPage.getByRole('button', { name: 'Bắt đầu lại' }).click()
  await learningPage
    .getByRole('heading', { name: 'Bắt đầu lại từ đầu?' })
    .waitFor()
  await learningPage.getByRole('button', { name: 'Xóa và bắt đầu lại' }).click()
  await learningPage
    .getByRole('heading', { name: 'Chào mừng bạn đến với Vibecoding 101' })
    .waitFor()
  await learningPage.getByRole('button', { name: 'Cùng bắt đầu nhé' }).click()
  await learningPage.getByRole('button', { name: 'Tiếp tục' }).click()
  await learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await learningPage.getByRole('button', { name: 'Bắt đầu Module 1', exact: true }).click()
  await learningPage.getByRole('heading', { name: 'Lộ trình khóa học' }).waitFor()
  await completeSetupModule(learningPage, companionPage, resumedLaunch)
  assert.equal(await fingerprintTree(practiceWorkspace.canonicalStarter), canonicalStarterFingerprint)
  await learningPage.getByRole('button', { name: 'Mở Triết, giáo viên đồng hành' }).click()
  await learningPage.getByText('TRIẾT ĐÃ SẴN SÀNG', { exact: true }).waitFor()
  const teacherBounds = await learningPage.locator('.pixel-teacher-overlay').boundingBox()
  assert.ok(teacherBounds)
  assert.ok(teacherBounds.x > 1180 / 2)
  await capture(learningPage, 'teacher-overlay.png')
  await learningPage.locator('.pixel-teacher-overlay').getByRole('button', { name: 'Đóng Triết' }).click()
  await learningPage.getByRole('button', { name: 'Cài đặt', exact: true }).click()
  assert.equal(await learningPage.getByRole('button', { name: 'Thu nhỏ', exact: true }).count(), 0)
  await capture(learningPage, 'settings.png')
  const alwaysOnTopSwitch = learningPage.getByRole('switch', {
    name: 'Luôn ở phía trên cửa sổ khác'
  })
  await alwaysOnTopSwitch.click()
  const notFloating = await waitForSnapshot(
    resumedLaunch,
    (windows) => companionWindow(windows)?.alwaysOnTop === false,
    'Expected Settings to disable always-on-top for the Teacher companion'
  )
  assert.equal(companionWindow(notFloating)?.alwaysOnTop, false)
  await alwaysOnTopSwitch.click()
  await waitForSnapshot(
    resumedLaunch,
    (windows) => companionWindow(windows)?.alwaysOnTop === true,
    'Expected Settings to restore always-on-top for the Teacher companion'
  )
  await learningPage.getByRole('button', { name: 'Về Home Base', exact: true }).click()
  await learningPage
    .getByRole('button', { name: /MODULE 2.*MỞ BÀI HỌC/ })
    .click()
  await learningPage
    .locator('main[data-scene-id="module-2-portfolio-workspace"]')
    .waitFor()
  assert.equal(await learningPage.locator('.pixel-dialogue > p').textContent(), approvedModuleTwoOpening)
  await openModuleTwoPractice(learningPage)
  assert.equal(await learningPage.locator('.pixel-copy-prompt').count(), 0)
  assert.equal(await learningPage.locator('.pixel-dialogue > p').textContent(), approvedPracticeTransitionCopy)
  assert.equal(await learningPage.locator('.pixel-scene-title').count(), 0)
  assert.equal(await learningPage.locator('.pixel-consequence').count(), 0)
  await learningPage
    .getByRole('button', { name: 'Chuyển sang Codex để thực hành', exact: true })
    .click()
  await learningPage.locator('.practice-brief-overlay').waitFor()
  await learningPage.getByRole('heading', { name: 'Lập kế hoạch cho portfolio', exact: true }).waitFor()
  await learningPage.getByRole('button', { name: 'Bắt đầu thực hành', exact: true }).waitFor()
  const guide = learningPage.locator('.planning-guide')
  for (const title of ['Duyệt kế hoạch', 'Nộp bài', 'Trao đổi']) {
    const step = guide.getByRole('button', { name: new RegExp(title) })
    await step.click()
    assert.equal(await step.getAttribute('aria-current'), 'step')
  }
  await guide.getByRole('button', { name: 'Sao chép prompt', exact: true }).click()
  await guide.getByRole('button', { name: 'ĐÃ SAO CHÉP', exact: true }).waitFor()
  const clipboard = await learningPage.evaluate(() => navigator.clipboard.readText())
  assert.equal(clipboard.replace(/\r\n/g, '\n'), approvedPortfolioPracticePrompt)
  if (screenshotDirectory) {
    await learningPage.setViewportSize({ width: 390, height: 844 })
    assert.ok(await guide.evaluate(el => el.scrollWidth <= el.clientWidth))
    await capture(learningPage, 'module-2-portfolio-practice-brief-390px.png')
    await learningPage.setViewportSize({ width: 1180, height: 780 })
  }
  await capture(learningPage, 'module-2-portfolio-practice-brief.png')
  await learningPage.getByRole('button', { name: 'Đóng trang Practice', exact: true }).click()

  // Simulated prerequisite for this theory-only journey. The separate portfolio
  // rehearsal exercises actual collection, approval, review and task continuity.
  const masterySeedPath = join(userDataDirectory, 'learner-state.json')
  const masterySeed = JSON.parse(await readFile(masterySeedPath, 'utf8'))
  masterySeed.practiceCompletions.push({
    schemaVersion: 1, courseRunId: masterySeed.courseRunId,
    practiceId: 'm2-portfolio-planning', practiceVersion: '2.0.0', runId: 'simulated-theory-prerequisite',
    checkpointId: 'm2-portfolio-planning', status: 'completed', completedAt: new Date().toISOString(),
    submissionDigest: '0'.repeat(64), evidenceSummary: 'Simulated theory-only prerequisite.',
    masterySummary: 'Simulated review; not live or pilot evidence.',
    destination: { lessonId: 'module-2', checkpointId: 'm2-portfolio-mastery', sceneId: 'module-2-portfolio-mastery' }
  })
  await writeFile(masterySeedPath, JSON.stringify(masterySeed), 'utf8')

  await learningPage.evaluate(async () => {
    const loaded = await globalThis.courseCompanion?.loadProgress()
    if (!loaded || (loaded.status !== 'returning' && loaded.status !== 'recovered')) {
      throw new Error('Expected current progress before mastery seed')
    }
    await globalThis.courseCompanion?.saveProgress({
      currentLessonId: 'module-2',
      currentCourseLessonId: 'm2-portfolio-brief',
      checkpointId: 'm2-portfolio-mastery',
      sceneId: 'module-2-portfolio-mastery',
      sceneHistory: [...loaded.progress.sceneHistory, loaded.progress.sceneId].slice(-200),
      completedCheckpointIds: [...new Set([
        ...loaded.progress.completedCheckpointIds,
        'm2-portfolio-brief',
        'm2-content-evidence-inventory',
        'm2-visual-reference',
        'm2-portfolio-prd',
        'm2-implementation-contract',
        'm2-portfolio-planning'
      ])],
      decisions: {
        ...loaded.progress.decisions,
        portfolioPlanningPractice: 'simulated-five-document-review'
      }
    })
  })
  await learningPage.reload()
  await learningPage.getByRole('heading', { name: 'Tiếp tục đúng nơi bạn dừng lại' }).waitFor()
  await learningPage.getByRole('button', { name: 'Mở Course Companion', exact: true }).click()
  await learningPage.getByRole('button', { name: /MODULE 2.*MỞ BÀI HỌC/ }).click({ force: true })
  await learningPage.getByText(approvedPortfolioMasteryTransitionCopy, { exact: true }).waitFor()
  assert.equal(await learningPage.locator('.pixel-scene-title').count(), 0)
  assert.equal(await learningPage.locator('.pixel-consequence').count(), 0)
  assert.equal(await learningPage.locator('.pixel-dialogue > p').textContent(), approvedPortfolioMasteryTransitionCopy)
  await capture(learningPage, 'module-2-portfolio-mastery-intro.png')
  if (screenshotDirectory) {
    await learningPage.setViewportSize({ width: 390, height: 844 })
    const masteryIntroNarrowWidths = await learningPage.evaluate(() => ({
      body: globalThis.document.body.scrollWidth,
      document: globalThis.document.documentElement.scrollWidth,
      viewport: globalThis.innerWidth
    }))
    assert.equal(masteryIntroNarrowWidths.body, masteryIntroNarrowWidths.viewport)
    assert.equal(masteryIntroNarrowWidths.document, masteryIntroNarrowWidths.viewport)
    await learningPage.locator('.pixel-dialogue').scrollIntoViewIfNeeded()
    await capture(learningPage, 'module-2-portfolio-mastery-intro-390px.png')
    await learningPage.setViewportSize({ width: 1180, height: 780 })
  }
  await learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await answerAssessmentGroup(learningPage, 'final-assessment', { retryFirstChoice: true })
  await learningPage.getByText('Bạn đã trả lời 4/4 câu.', { exact: false }).waitFor()
  assert.equal(await learningPage.locator('.pixel-scene-title').count(), 0)
  await capture(learningPage, 'module-2-portfolio-mastery-summary.png')

  await resumedLaunch.evaluate(({ BrowserWindow }) => {
    const learning = BrowserWindow.getAllWindows().find((window) =>
      window.webContents.getURL().includes('#/learning')
    )
    learning?.close()
  })
  await waitForSnapshot(
    resumedLaunch,
    (windows) => learningWindow(windows)?.visible === false && companionWindow(windows)?.visible === true,
    'Expected the native close control to preserve the companion'
  )

  await companionPage
    .getByRole('button', { name: 'Mở cửa sổ Triết' })
    .click()
  await companionPage.getByRole('button', { name: 'Thoát ứng dụng' }).click()
  await resumedLaunch.waitForEvent('close')
  resumedLaunch = undefined

  const persisted = JSON.parse(
    await readFile(join(userDataDirectory, 'learner-state.json'), 'utf8')
  )
  assert.equal(persisted.sceneId, 'module-2-portfolio-mastery-summary')
  assert.equal(persisted.checkpointId, 'm2-portfolio-mastery')
  assert.equal(persisted.schemaVersion, 6)
  assert.equal(persisted.courseVersion, '0.3.0')
  assert.equal(persisted.currentCourseLessonId, 'm2-portfolio-brief')
  assert.ok(persisted.sceneHistory.length > 10)
  assert.equal(persisted.decisions.portfolioPlanningPractice, 'simulated-five-document-review')
  assert.equal(persisted.decisions.setupPractice, 'teacher-reviewed-setup')
  assert.equal(persisted.decisions.setupMastery, 'passed-three-of-four')
  assert.equal(persisted.decisions.masteryEvidence, undefined)
  assert.equal(
    Object.entries(persisted.decisions).filter(
      ([key, value]) => key.startsWith('assessment:mastery-') && String(value).startsWith('correct')
    ).length,
    4
  )
  assert.equal(persisted.practice.status, 'idle')

  chatHistoryLaunch = await launchCourseCompanion()
  const historyWindows = await loadWindows(chatHistoryLaunch)
  await waitForSnapshot(
    chatHistoryLaunch,
    (windows) => learningWindow(windows)?.visible === true,
    'Expected the learning window to finish its startup show before testing restored companion state'
  )
  await chatHistoryLaunch.evaluate(({ BrowserWindow }) => {
    const learning = BrowserWindow.getAllWindows().find((window) =>
      window.webContents.getURL().includes('#/learning')
    )
    learning?.hide()
    const companion = BrowserWindow.getAllWindows().find((window) =>
      window.webContents.getURL().includes('#/companion')
    )
    companion?.showInactive()
  })
  const restoredChat = await waitForSnapshot(
    chatHistoryLaunch,
    (windows) =>
      learningWindow(windows)?.visible === false &&
      companionWindow(windows)?.visible === true &&
      companionWindow(windows)?.bounds.width === 380,
    'Expected the expanded Teacher chat mode to survive a full restart'
  )
  assert.equal(companionWindow(restoredChat)?.bounds.height, 640)
  await historyWindows.learningPage.evaluate(async () => {
    await globalThis.courseCompanion?.resetProgress()
    await globalThis.courseCompanion?.saveProgress({
      currentLessonId: 'module-2',
      currentCourseLessonId: 'm2-portfolio-brief',
      checkpointId: 'm2-portfolio-brief',
      sceneId: 'module-2-portfolio-workspace',
      sceneHistory: [],
      completedCheckpointIds: [],
      decisions: {}
    })
  })
  await historyWindows.companionPage.getByRole('button', { name: 'Thoát ứng dụng' }).click()
  await chatHistoryLaunch.waitForEvent('close')
  chatHistoryLaunch = undefined
  assert.equal(
    await fingerprintTree(practiceWorkspace.canonicalStarter),
    canonicalStarterFingerprint
  )

  console.log(
    'Electron smoke: frozen course regression, responsive layout, review-safe back navigation, roadmap entry, Teacher overlay, settings, journey resume/reset, in-app mock Practice, mastery, persistence, security, and companion lifecycle passed'
  )
} finally {
  await firstLaunch?.close().catch(() => undefined)
  await resumedLaunch?.close().catch(() => undefined)
  await chatHistoryLaunch?.close().catch(() => undefined)
  await rm(userDataDirectory, { recursive: true, force: true })
  await rm(learningPortfolioWorkspaceDirectory, { recursive: true, force: true })
  await practiceWorkspace.cleanup()
}
