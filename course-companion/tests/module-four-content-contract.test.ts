import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repositoryRoot = resolve(process.cwd(), '..')
const courseRoot = resolve(repositoryRoot, 'pilot-workspace', 'course')

async function read(relativePath: string): Promise<string> {
  return readFile(resolve(courseRoot, relativePath), 'utf8')
}

async function moduleFour() {
  const structure = JSON.parse(await read('course-structure.json')) as {
    modules: Array<Record<string, unknown>>
  }
  const module = structure.modules.find((candidate) => candidate.id === 'module-4')
  if (!module) throw new Error('Missing Module 4 manifest')
  return module as {
    titleVi: string
    estimatedMinutes?: number
    checkpoints: string[]
    lessons: Array<{ id: string; estimatedMinutes?: number; checkpoints: string[] }>
    contentDevelopment: Record<string, string>
    viewportContract: Record<string, { width: number; height: number }>
    nextLessonId: null
  }
}

describe('Module 4 content-first contract', () => {
  it('locks five ordered content milestones without claiming Practice completion', async () => {
    const module = await moduleFour()
    expect(module.titleVi).toBe('Đăng tải portfolio lên mạng')
    expect(module.estimatedMinutes).toBeUndefined()
    expect(module.lessons.map((lesson) => lesson.id)).toEqual([
      'm4-release-validation',
      'm4-security-publication',
      'm4-preview-deployment',
      'm4-production-decision',
      'm4-ownership-transfer'
    ])
    expect(module.lessons.flatMap((lesson) => lesson.checkpoints)).toEqual(module.checkpoints)
    expect(module.lessons.every((lesson) => lesson.estimatedMinutes === undefined)).toBe(true)
    expect(module.contentDevelopment).toEqual({
      practiceWiring: 'deferred',
      officialCompletion: 'disabled',
      reviewMode: 'session-only'
    })
    expect(module.viewportContract).toEqual({
      desktop: { width: 1440, height: 900 },
      mobile: { width: 390, height: 844 }
    })
    expect(module.nextLessonId).toBeNull()
  })

  it('keeps lesson, Teacher script and start prompt aligned to content-only review', async () => {
    const [lesson, script, prompt] = await Promise.all([
      read('lessons/module-4.vi.md'),
      read('lesson-scripts/module-4.script.vi.md'),
      read('prompts/start-module-4.vi.md')
    ])
    const combined = `${lesson}\n${script}\n${prompt}`
    for (const content of [lesson, script]) {
      let previous = -1
      for (const heading of ['Milestone 1 —', 'Milestone 3 —']) {
        const current = content.indexOf(heading)
        expect(current).toBeGreaterThan(previous)
        previous = current
      }
    }
    for (const content of [lesson, script, prompt]) {
      expect(content).toContain('portfolio trên mạng')
      expect(content).not.toMatch(/tám câu|sáu tình huống|Preview.*bắt buộc|hai điều kiện độc lập/i)
    }
    expect(combined).toMatch(/không (?:cần|yêu cầu).*đọc code/i)
    expect(combined).toMatch(/không (?:tạo|ghi nhận).*biên nhận/i)
    expect(combined).not.toMatch(/ước tính.*(?:phút|giờ)|hoàn thành trong \d+/i)
    expect(combined).not.toContain('docs/internal/target-learner-definition.md')
  })

  it('has no Module 4 assessment or mastery requirement', async () => {
    const quiz = JSON.parse(await read('quizzes/module-4.quiz.json')) as {
      groups: unknown[]
      masteryPolicy?: unknown
    }
    expect(quiz.groups).toEqual([])
    expect(quiz.masteryPolicy).toBeUndefined()
    expect((await moduleFour()).checkpoints).not.toContain('m4-mastery')
  })
})
