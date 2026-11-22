import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

type ModuleTwoManifest = {
  id: 'module-2'
  titleVi: string
  estimatedMinutes?: number
  artifactPaths: string[]
  artifactGateCheckpoint: string
  masteryGateCheckpoint: string
  unlockGate: {
    nextLessonId: string
    requiresCurrentArtifactDigests: boolean
    requiresLearnerApproval: boolean
    requiresPassedPracticeReview: boolean
    requiresMasteryReceipt: boolean
  }
  checkpoints: string[]
  lessons: Array<{ id: string; titleVi: string; estimatedMinutes?: number; checkpoints: string[] }>
  nextLessonId: string
}

async function manifest(): Promise<ModuleTwoManifest> {
  const structure = JSON.parse(await readFile(
    join(process.cwd(), '..', 'pilot-workspace', 'course', 'course-structure.json'),
    'utf8'
  )) as { modules: ModuleTwoManifest[] }
  const moduleTwo = structure.modules.find((module) => module.id === 'module-2')
  if (!moduleTwo) throw new Error('Missing Module 2 manifest')
  return moduleTwo
}

describe('Module 2 portfolio contract', () => {
  it('preserves the lesson and requires final-package review with current approval', async () => {
    const moduleTwo = await manifest()

    expect(moduleTwo.titleVi).toBe('Lên kế hoạch sao cho hiệu quả?')
    expect(moduleTwo.estimatedMinutes).toBeUndefined()
    expect(moduleTwo.lessons.map((lesson) => lesson.id)).toEqual([
      'm2-portfolio-brief'
    ])
    expect(moduleTwo.lessons.every((lesson) => lesson.estimatedMinutes === undefined)).toBe(true)
    expect(moduleTwo.lessons[0]?.checkpoints).toEqual(moduleTwo.checkpoints)
    expect(moduleTwo.artifactGateCheckpoint).toBe('m2-portfolio-planning')
    expect(moduleTwo.masteryGateCheckpoint).toBe('m2-portfolio-mastery')
    expect(moduleTwo.nextLessonId).toBe('module-3')
    expect(moduleTwo.unlockGate).toEqual({
      nextLessonId: 'module-3',
      requiresCurrentArtifactDigests: true,
      requiresLearnerApproval: true,
      requiresPassedPracticeReview: true,
      requiresMasteryReceipt: true
    })
  })

  it('requires five planning documents and a prototype and preserves the existing templates', async () => {
    const moduleTwo = await manifest()
    expect(moduleTwo.artifactPaths).toEqual([
      'planning/portfolio-brief.md', 'planning/content-evidence-inventory.md',
      'planning/reference/reference.md', 'planning/PRD.md', 'planning/implementation-plan.md', 'planning/reference/design-prototype.html'
    ])
    expect(new Set(moduleTwo.artifactPaths).size).toBe(6)
    expect(moduleTwo.artifactPaths.every((path) => path.startsWith('planning/'))).toBe(true)
    expect(moduleTwo.artifactPaths.every((path) => !path.includes('..'))).toBe(true)

    const templates = await Promise.all(moduleTwo.artifactPaths.filter((path) => path.endsWith('.md')).map(async (artifactPath) => ({
      artifactPath,
      content: await readFile(join(process.cwd(), '..', 'pilot-workspace', 'artifacts', artifactPath), 'utf8')
    })))
    for (const { content } of templates) {
      expect(content).toContain('Phê duyệt phiên bản hiện tại')
      expect(content).toContain('Quyết định: `chưa duyệt`')
      expect(content).not.toContain('Quyết định: `đã duyệt`')
      expect(content).not.toMatch(/```(?:jsx|tsx|ts|js|html|css)/)
    }
    const combined = templates.map(({ content }) => content).join('\n')
    expect(combined).toContain('đã kiểm chứng')
    expect(combined).toContain('lời tự khai')
    expect(combined).toContain('giả định')
    expect(combined).toContain('còn thiếu')
    expect(combined).toContain('quyền riêng tư')
    expect(combined).toContain('quyền sở hữu')
    expect(combined).toContain('planning/reference/screenshots/')
    expect(combined).not.toMatch(/```(?:jsx|tsx|ts|js|html|css)/)
  })
})
