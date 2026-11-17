import { describe, expect, it } from 'vitest'
import { visibleLessonScene } from '../shared/course/visible-scene'

describe('saved Practice handoff position', () => {
  it('shows the preceding visible lesson for Module 1 without changing other scene identities', () => {
    expect(visibleLessonScene('module-1-setup-checklist')).toBe('module-1-skills-portfolio')
    expect(visibleLessonScene('module-1-mastery')).toBe('module-1-mastery')
    expect(visibleLessonScene('module-2-portfolio-practice')).toBe('module-2-portfolio-practice')
  })
})
