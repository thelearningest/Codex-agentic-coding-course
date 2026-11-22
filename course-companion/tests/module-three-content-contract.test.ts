import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repositoryRoot = resolve(process.cwd(), '..')
const courseRoot = resolve(repositoryRoot, 'pilot-workspace', 'course')
const artifactRoot = resolve(repositoryRoot, 'pilot-workspace', 'artifacts')

async function read(relativePath: string): Promise<string> {
  return readFile(resolve(courseRoot, relativePath), 'utf8')
}

async function moduleThree() {
  const structure = JSON.parse(await read('course-structure.json')) as {
    modules: Array<Record<string, unknown>>
  }
  const module = structure.modules.find((candidate) => candidate.id === 'module-3')
  if (!module) throw new Error('Missing Module 3 manifest')
  return module as {
    titleVi: string
    estimatedMinutes?: number
    artifactPaths: string[]
    viewportContract: {
      desktop: { width: number; height: number }
      mobile: { width: number; height: number }
    }
    checkpoints: string[]
    lessons: Array<{ id: string; titleVi: string; estimatedMinutes?: number; checkpoints: string[] }>
    unlockGate: Record<string, unknown>
    nextLessonId: string
  }
}

describe('Module 3 content and evidence contract', () => {
  it('registers the four remaining learner-facing sections and viewport pair', async () => {
    const module = await moduleThree()
    expect(module.titleVi).toBe('Bắt đầu tạo portfolio')
    expect(module.estimatedMinutes).toBeUndefined()
    expect(module.lessons.map((lesson) => lesson.titleVi)).toEqual([
      'Debug cùng coding agent',
      'Git và GitHub',
      'Practice: Xây portfolio',
      'Tổng kết Module 3'
    ])
    expect(module.lessons.flatMap((lesson) => lesson.checkpoints)).toEqual(module.checkpoints)
    expect(module.viewportContract).toEqual({
      desktop: { width: 1440, height: 900 },
      mobile: { width: 390, height: 844 }
    })
    expect(module.unlockGate).toMatchObject({
      nextLessonId: 'module-4',
      requiresReviewedBuildPackageVersion: '2.1.0',
      requiresCurrentCheck: true,
      requiresBrowserValidation: true,
      requiresMasteryReceipt: true
    })
  })

  it('uses three supporting records and preserves legacy templates', async () => {
    const module = await moduleThree()
    expect(module.artifactPaths).toHaveLength(3)
    expect(new Set(module.artifactPaths).size).toBe(3)
    const templates = await Promise.all(module.artifactPaths.map((path) =>
      readFile(resolve(artifactRoot, path), 'utf8')))
    expect(templates.join('\n')).toContain('1440 × 900')
    // Module 3 checks desktop only; mobile is checked on a real phone in Module 4.
    expect(templates.join('\n')).not.toContain('390 × 844')
    expect(templates.join('\n')).toContain('Commit của phiên bản đem nộp')
  })

  it('widens explanatory dialogue without changing Practice or assessment layouts', async () => {
    const [learningWindow, styles] = await Promise.all([
      readFile(resolve(process.cwd(), 'src', 'renderer', 'src', 'surfaces', 'LearningWindow.tsx'), 'utf8'),
      readFile(resolve(process.cwd(), 'src', 'renderer', 'src', 'styles.css'), 'utf8')
    ])
    expect(learningWindow).toContain("scene.lessonId === 'module-3' ? ' is-module-three' : ''")
    expect(styles).toContain('.pixel-learning-shell.is-module-three .pixel-dialogue.has-single-choice > p')
    expect(styles).toContain('max-width: 1200px;')
  })

  it('preserves the approved lesson wording and teaching order', async () => {
    const [lesson, script, prompt, sceneSource] = await Promise.all([
      read('lessons/module-3.vi.md'),
      read('lesson-scripts/module-3.script.vi.md'),
      read('prompts/start-module-3.vi.md'),
      readFile(resolve(process.cwd(), 'src', 'renderer', 'src', 'course', 'modules', 'module-3', 'scenes.tsx'), 'utf8')
    ])
    expect(lesson).not.toContain('Kết thúc module 2, chúng ta đã có một PRD và một implementation plan. Trong module 3, chúng ta sẽ cùng hiện thực hoá nó.')
    expect(lesson).toContain('Trên đây là ví dụ của một prompt bạn có thể áp dụng. Trong trường hợp này, lỗi có thể thấy ngay ở trên trang web, nên bạn chỉ việc cắt screenshot và nhắn prompt như trên là được.')
    expect(lesson).not.toContain('Ví dụ prompt gửi cùng ảnh lỗi:')
    expect(lesson).not.toContain('Log là những dòng thông tin ứng dụng ghi lại trong lúc hoạt động.')
    expect(sceneSource).not.toContain('Log là những dòng thông tin ứng dụng ghi lại trong lúc hoạt động.')
    expect(sceneSource).toContain("dialogue: 'Trên đây là ví dụ của một prompt bạn có thể áp dụng. Trong trường hợp này, lỗi có thể thấy ngay ở trên trang web, nên bạn chỉ việc cắt screenshot và nhắn prompt như trên là được.'")
    expect(lesson).toContain('Nếu bạn đã gửi ảnh lỗi mà agent vẫn chưa sửa được, bạn có thể yêu cầu agent thêm log, tức là thông tin ghi lại những hoạt động diễn ra khi ứng dụng đang chạy. Log có thể giúp agent có thêm thông tin về nguyên nhân gây ra lỗi, thay vì chỉ đoán mò')
    expect(lesson).toContain('Nếu lỗi vẫn quay lại sau nhiều lần sửa, hãy yêu cầu AI tạm dừng và liệt kê những nguyên nhân có thể khiến lỗi xảy ra.')
    const headings = [
      '## Mở portfolio trên máy',
      '## Debug cùng coding agent',
      '## Git và GitHub',
      '### Commit: lưu một phiên bản của dự án',
      '### Push: đưa commit lên GitHub',
      '### Branch: thử nghiệm mà không ảnh hưởng phiên bản ổn định',
      '## Tóm lại',
      '## Practice: Xây portfolio'
    ]
    let prior = -1
    for (const heading of headings) {
      const current = lesson.indexOf(heading)
      expect(current).toBeGreaterThan(prior)
      prior = current
    }
    expect(`${script}\n${prompt}`).toContain('Không chèn câu hỏi kiểm tra giữa các trang giải thích')
    expect(`${script}\n${prompt}`).toContain('Teacher Triết không mở chat')
  })

  it('keeps all Module 3 knowledge pages and routes the approved recap into Practice', async () => {
    const [lesson, sceneSource, rendererRegistry, learningWindow, styles] = await Promise.all([
      read('lessons/module-3.vi.md'),
      readFile(resolve(process.cwd(), 'src', 'renderer', 'src', 'course', 'modules', 'module-3', 'scenes.tsx'), 'utf8'),
      readFile(resolve(process.cwd(), 'src', 'renderer', 'src', 'course', 'registry.ts'), 'utf8'),
      readFile(resolve(process.cwd(), 'src', 'renderer', 'src', 'surfaces', 'LearningWindow.tsx'), 'utf8'),
      readFile(resolve(process.cwd(), 'src', 'renderer', 'src', 'styles.css'), 'utf8')
    ])
    const retainedKnowledgeScenes = [
      'module-3-local-preview',
      'module-3-debugging-intro',
      'module-3-visible-error',
      'module-3-visible-error-prompt',
      'module-3-terminal-logs',
      'module-3-repeated-error',
      'module-3-git-intro',
      'module-3-git-github',
      'module-3-git-commit',
      'module-3-git-push',
      'module-3-git-branch',
      'module-3-git-merge',
      'module-3-pre-practice-summary'
    ]
    for (const sceneId of retainedKnowledgeScenes) expect(sceneSource).toContain(`'${sceneId}': {`)
    expect(sceneSource).toContain("choices: [{ label: 'Tiếp tục', next: 'module-3-pre-practice-summary', primary: true }]")
    expect(sceneSource).toMatch(/'module-3-pre-practice-summary': \{[\s\S]*?choices: \[\{ label: 'Mở Practice', action: 'practice', preservePrimaryLabel: true, primary: true \}\]/)
    expect(sceneSource).not.toContain("'module-3-portfolio-practice': {")
    expect(lesson).toContain('4 điều cần nhớ trước khi bắt đầu Practice:')
    expect(sceneSource).toContain("objective: 'Điều cần nhớ', panelLabel: '4'")
    expect(sceneSource).toContain("panelStatus: 'TÓM LẠI', tone: 'good'")
    expect(sceneSource).toContain("request: 'trước khi bắt đầu Practice'")
    expect(learningWindow).toContain("displayedSceneId === 'module-3-pre-practice-summary'")
    expect(learningWindow).toContain('className="pixel-scene-title is-pre-practice-summary"')
    expect(styles).toContain('.pixel-scene-title.is-pre-practice-summary')
    expect(styles).toContain('.pixel-recap-title__count')
    expect(sceneSource).toContain('Khi debug, trong đa số trường hợp, bạn chỉ cần chụp screenshot và mô tả kỹ lỗi của bạn cho agent là được.')
    expect(sceneSource).not.toContain('Thực hiện implementation plan theo từng phần. Sau mỗi phần, hãy xem kết quả thực tế')
    expect(sceneSource).not.toContain("'module-3-practice-intro': {")
    expect(rendererRegistry).not.toContain("['module-3-practice-intro']")
    expect(rendererRegistry).toMatch(/'m3-evidence-debugging': \[\r?\n\s*\['module-3-pre-practice-summary'\]\r?\n\s*\]/)
    expect(rendererRegistry).not.toContain("['module-3-portfolio-practice']")
  })

  it('ships all six approved Module 3 illustrations', async () => {
    const visualRoot = resolve(process.cwd(), 'src', 'renderer', 'src', 'assets', 'lesson-visuals')
    for (const name of [
      'm3-visible-screen-error-example.png',
      'm3-visible-error-prompt-example.png',
      'm3-terminal-log-error-example.png',
      'm3-repeated-error-codex-prompt.png',
      'm3-commit-history-example.png',
      'm3-git-github.png'
    ]) await expect(access(resolve(visualRoot, name))).resolves.toBeUndefined()
  })

  it('shows the approved Codex prompt illustration on the repeated-error page', async () => {
    const learningWindow = await readFile(
      resolve(process.cwd(), 'src', 'renderer', 'src', 'surfaces', 'LearningWindow.tsx'),
      'utf8'
    )
    expect(learningWindow).toMatch(/'module-3-repeated-error': \{\r?\n\s*image: m3RepeatedErrorCodexPromptImage/)
    expect(learningWindow).toContain('Codex nhận yêu cầu dừng sửa, liệt kê các nguyên nhân có thể và kiểm tra từng nguyên nhân bằng bằng chứng')
  })

  it('uses the supplied Git and GitHub image instead of the right-side title box', async () => {
    const [sceneSource, learningWindow, styles] = await Promise.all([
      readFile(resolve(process.cwd(), 'src', 'renderer', 'src', 'course', 'modules', 'module-3', 'scenes.tsx'), 'utf8'),
      readFile(resolve(process.cwd(), 'src', 'renderer', 'src', 'surfaces', 'LearningWindow.tsx'), 'utf8'),
      readFile(resolve(process.cwd(), 'src', 'renderer', 'src', 'styles.css'), 'utf8')
    ])
    expect(sceneSource).toMatch(/'module-3-git-github': \{[\s\S]*?showTitle: false,[\s\S]*?choices:/)
    expect(learningWindow).toMatch(/'module-3-git-github': \{\r?\n\s*image: m3GitGithubImage/)
    expect(learningWindow).toContain("displayedSceneId === 'module-3-git-github' ? ' is-title-replacement' : ''")
    expect(styles).toContain('.pixel-lesson-visual.is-title-replacement { top: 100px; width: min(500px, 46vw); }')
    expect(styles).toContain('.pixel-lesson-visual.is-title-replacement { top: auto; width: 100%; }')
  })

  it('enlarges both prompt-based examples while preserving the narrow layout', async () => {
    const [learningWindow, styles] = await Promise.all([
      readFile(resolve(process.cwd(), 'src', 'renderer', 'src', 'surfaces', 'LearningWindow.tsx'), 'utf8'),
      readFile(resolve(process.cwd(), 'src', 'renderer', 'src', 'styles.css'), 'utf8')
    ])
    expect(learningWindow).toContain("displayedSceneId === 'module-3-visible-error-prompt' || displayedSceneId === 'module-3-repeated-error' ? ' is-featured-example' : ''")
    expect(styles).toContain('.pixel-lesson-visual.is-featured-example { width: min(500px, 46vw); }')
    expect(styles).toContain('.pixel-lesson-visual.is-featured-example { width: 100%; }')
  })

  it('places five plausible multiple-choice questions together at the end', async () => {
    const quiz = JSON.parse(await read('quizzes/module-3.quiz.json')) as {
      delivery: Record<string, unknown>
      masteryPolicy: Record<string, unknown>
      groups: Array<{
        id: string
        mode: string
        questions: Array<{
          id: string
          type: string
          choices: string[]
          answerIndex: number
          source: { kind: string; url: string; basis: string }
        }>
      }>
    }
    expect(quiz.delivery).toMatchObject({
      mode: 'one-question-at-a-time',
      doNotStackQuestions: true,
      feedbackTiming: 'after-answer'
    })
    expect(quiz.masteryPolicy).toMatchObject({
      publishThreshold: false,
      requiresCurrentArtifactDigests: true,
      requiresPracticeReceipt: true
    })
    expect(quiz.groups).toHaveLength(1)
    const final = quiz.groups[0]!
    expect(final).toMatchObject({ id: 'm3-final-assessment', mode: 'mastery' })
    expect(final.questions).toHaveLength(5)
    expect(final.questions.every((question) => question.type === 'multiple-choice')).toBe(true)
    expect(final.questions.map((question) => question.answerIndex)).toEqual([1, 0, 3, 0, 1])
    expect(final.questions.every((question) => question.choices.length === 4)).toBe(true)
    for (const question of final.questions) {
      expect(question.source.basis.length).toBeGreaterThan(40)
      expect(question.source.kind === 'authoritative-source'
        ? new URL(question.source.url).protocol
        : question.source.url.startsWith('docs/planning/')).toBeTruthy()
    }
  })
})
