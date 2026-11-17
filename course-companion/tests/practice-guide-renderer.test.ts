import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = (path: string) => readFile(join(process.cwd(), path), 'utf8')

describe('Practice screenshot guide', () => {
  it('keeps the retired video and tour out of the Practice windows', async () => {
    const teacher = await source('src/renderer/src/components/TeacherWorkspace.tsx')
    const learning = await source('src/renderer/src/surfaces/LearningWindow.tsx')
    expect(teacher).not.toContain('Xem lại video hướng dẫn Practice')
    expect(teacher).not.toContain('<PracticeVideoGuide')
    expect(teacher).toContain('reviewPractice()')
    expect(teacher).toContain('returnPassedPractice()')
    for (const surface of [teacher, learning]) {
      expect(surface).not.toContain('<PracticeGuide')
      expect(surface).not.toContain('loadPracticeGuide(')
      expect(surface).not.toContain('updatePracticeGuide(')
    }
  })
  it('keeps the screenshot rehearsal separate from starting or reviewing real Practice', async () => {
    const brief = await source('src/renderer/src/components/PracticeBrief.tsx')
    const guide = await source('src/renderer/src/components/PracticeScreenshotGuide.tsx')
    expect(brief).toContain('<PracticeScreenshotGuide')
    expect(brief).not.toContain('PracticeVideoGuide')
    expect(guide).not.toContain('window.courseCompanion')
    expect(guide).toContain('Đã thử nộp bài')
  })
})
