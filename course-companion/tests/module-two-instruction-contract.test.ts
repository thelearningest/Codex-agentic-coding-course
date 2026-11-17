import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repositoryRoot = resolve(process.cwd(), '..')
const courseRoot = resolve(repositoryRoot, 'pilot-workspace', 'course')

async function readCourseFile(relativePath: string): Promise<string> {
  return readFile(resolve(courseRoot, relativePath), 'utf8')
}

async function readCourseCompanionFile(relativePath: string): Promise<string> {
  return readFile(resolve(repositoryRoot, 'course-companion', relativePath), 'utf8')
}

const approvedPlanningOpening = 'Sau khi hoàn thành module 1, hy vọng các bạn đã hiểu hơn về cách sử dụng Codex. Đầu tiên, chúng ta sẽ cùng tìm hiểu về cách planning khi sử dụng Coding agents. Nhiều bạn mới bắt đầu code với AI thường bỏ qua phần lên kế hoạch mà nhảy thẳng vào phần thực thi. Các bạn ấy nghĩ rằng mình đang tiết kiệm thời gian, nhưng thực chất các bạn đang lầm. Nếu có một kế hoạch tốt trước khi bắt đầu xây sản phẩm. Bạn sẽ tiết kiệm được biết bao thời gian debug và sửa lại từ đầu vì không đúng ý. Tin mình đi, mình đã phạm phải sai lầm này và đã phải trả giá.'
const approvedPortfolioTransition = 'Bây giờ, chúng ta sẽ chính thức bắt tay vào tạo Portfolio.'
const approvedImplementationPlanIntro = 'Vậy, sau khi có PRD rồi thì làm gì? Ta sẽ tạo implementation plan. Implementation plan về căn bản sẽ viết ra những bước chi tiết để coding agent có thể hiện thực hoá PRD. Bạn có thể hiểu nếu PRD là bản kế hoạch tổng quan, thì implementation plan sẽ ghi chi tiết từng bước để thực hiện kế hoạch đó. Thông thường một implementation plan sẽ được chia ra thành nhiều giai đoạn. Mỗi giai đoạn sẽ có tiêu chí hoàn thành rõ ràng. Thường agent tạo PRD và Implementation plan khá tốt nên bạn chỉ cần bảo nó tạo rồi duyệt là được.'
const approvedPracticeTransitionCopy = 'Okay, không để các bạn đợi lâu nữa, bây giờ các bạn có thể qua Codex để tiếp tục thực hành rồi.'

const retiredPracticeSetupSceneIds = [
  'module-2-portfolio-practice-intro',
  'module-2-portfolio-agents-setup',
  'module-2-portfolio-brief',
  'module-2-portfolio-brief-example',
  'module-2-check-brief-viewer',
  'module-2-check-brief-success',
  'module-2-content-evidence-inventory',
  'module-2-content-evidence-example',
  'module-2-check-evidence-status',
  'module-2-check-evidence-permission',
  'module-2-visual-reference',
  'module-2-visual-reference-example',
  'module-2-check-reference-boundary',
  'module-2-check-reference-record',
  'module-2-portfolio-prd',
  'module-2-portfolio-prd-example',
  'module-2-check-prd-requirement',
  'module-2-check-prd-accessibility',
  'module-2-implementation-contract',
  'module-2-implementation-contract-example',
  'module-2-check-delayed-scope',
  'module-2-check-delayed-evidence'
]

describe('Module 2 instruction contract', () => {
  it('keeps the approved knowledge sequence and requires a ready workspace before Practice', async () => {
    const [lesson, script, prompt, moduleTwoScenes, moduleTwoContract] = await Promise.all([
      readCourseFile('lessons/module-2.vi.md'),
      readCourseFile('lesson-scripts/module-2.script.vi.md'),
      readCourseFile('prompts/start-module-2.vi.md'),
      readCourseCompanionFile('src/renderer/src/course/modules/module-2/scenes.tsx'),
      readCourseCompanionFile('shared/course/modules/module-2.ts')
    ])

    for (const content of [lesson, script]) {
      expect(content).toContain(approvedPlanningOpening)
      expect(content).toContain(approvedPortfolioTransition)
      expect(content.replace(/\s*>\s*/g, ' ').replace(/\s+/g, ' ')).toContain(approvedImplementationPlanIntro)
      expect(content).toContain(approvedPracticeTransitionCopy)
    }
    expect(moduleTwoScenes).toContain('Trước khi bắt đầu xây sản phẩm thật')

    for (const page of [
      'Lập kế hoạch trước khi xây',
      'PRD là gì?',
      'Tạo và review PRD cùng coding agent',
      'Năm giai đoạn, năm tài liệu',
      'Implementation plan là gì?'
    ]) expect(moduleTwoScenes).toContain(page)

    expect(moduleTwoContract).toContain("nextSceneId: 'module-2-portfolio-folder'")
    expect(moduleTwoContract).toContain("id: 'module-2-portfolio-folder'")
    expect(moduleTwoScenes).toContain("next: 'module-2-portfolio-folder'")
    expect(moduleTwoScenes).toContain("'module-2-portfolio-folder': {")
    expect(moduleTwoScenes).toContain('Course Companion sẽ dùng đúng thư mục này trong Modules 2–4.')
    expect(prompt).toContain('Teacher không hướng dẫn chọn workspace')
    expect(prompt).toContain('Executor sẽ hướng dẫn các bước đó')
  })

  it('removes 22 Teacher-led Practice-setup slides while retaining the technical workspace boundary', async () => {
    const [lesson, script, prompt, moduleTwoScenes, moduleTwoContract, quiz] = await Promise.all([
      readCourseFile('lessons/module-2.vi.md'),
      readCourseFile('lesson-scripts/module-2.script.vi.md'),
      readCourseFile('prompts/start-module-2.vi.md'),
      readCourseCompanionFile('src/renderer/src/course/modules/module-2/scenes.tsx'),
      readCourseCompanionFile('shared/course/modules/module-2.ts'),
      readCourseFile('quizzes/module-2.quiz.json')
    ])

    for (const sceneId of retiredPracticeSetupSceneIds) {
      expect(moduleTwoScenes).not.toContain(`'${sceneId}': {`)
      expect(moduleTwoContract).not.toContain(`id: '${sceneId}'`)
      expect(quiz).not.toContain(`"sceneId": "${sceneId}"`)
    }
    expect(moduleTwoScenes).toContain("'module-2-portfolio-folder': {")
    expect(moduleTwoContract).toContain("id: 'module-2-portfolio-folder'")
    for (const content of [lesson, script, prompt]) {
      expect(content).not.toContain('# Portfolio Project Working Agreements')
      expect(content).not.toMatch(/^## Milestone [1-5]/m)
    }
    expect(JSON.parse(quiz).groups.map((group: { id: string }) => group.id)).toEqual(['final-assessment'])
  })

  it('keeps the learner-safe fictional implementation plan example', async () => {
    const example = await readCourseFile('examples/module-2-portfolio-implementation-plan.md')
    const normalizedExample = example.replace(/\s*>\s*/g, ' ').replace(/\s+/g, ' ')

    for (const heading of [
      '## Mục tiêu',
      '## Yêu cầu và ranh giới',
      '## Các giai đoạn triển khai',
      '## Tệp dự kiến thay đổi',
      '## Cách kiểm tra toàn bộ plan',
      '## Rủi ro và giả định',
      '## Phê duyệt'
    ]) expect(example).toContain(heading)

    expect(example).toContain('Đây là ví dụ giả lập để học cách đọc format.')
    expect(normalizedExample).toContain('Đây không phải đáp án cho portfolio của bạn')
    expect(example).toContain('390 × 844')
    expect(example).toContain('chưa thực hiện')
  })

  it('keeps detailed setup in the Executor handoff instead of the Teacher flow', async () => {
    const [handoff, practice] = await Promise.all([
      readFile(resolve(repositoryRoot, 'docs', 'planning', 'module-2-teacher-executor-integration-handoff.md'), 'utf8'),
      readCourseFile('practices/m2-portfolio-planning.json')
    ])
    const parsedPractice = JSON.parse(practice) as { stages: Array<{ id: string }> }

    expect(parsedPractice.stages.map((stage) => stage.id)).toEqual([
      'portfolio-brief',
      'content-evidence-inventory',
      'visual-reference',
      'portfolio-prd',
      'implementation-contract'
    ])
    expect(handoff).toContain('**Executor** chịu trách nhiệm:')
    expect(handoff).toContain('Nối Teacher, Coordinator và Executor vào một Executor task duy nhất')
    expect(handoff).toContain('Practice năm tài liệu và integration Teacher/Executor chưa được triển khai.')
  })
})
