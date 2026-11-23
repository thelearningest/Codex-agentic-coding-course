import { describe, expect, it } from 'vitest'
import { lessonIds } from '../shared/contracts'
import { starterQuestionsFor } from '../src/renderer/src/components/teacher-starter-questions'

describe('Triết example questions', () => {
  it('offers three questions for every lesson, including before progress loads', () => {
    for (const lessonId of [...lessonIds, undefined]) {
      expect(starterQuestionsFor(lessonId)).toHaveLength(3)
    }
  })

  it('uses the Module 1 questions for the introduction and the module of the current lesson otherwise', () => {
    expect(starterQuestionsFor('intro')).toEqual(starterQuestionsFor('module-1'))
    expect(starterQuestionsFor(undefined)).toEqual(starterQuestionsFor('module-1'))
    expect(starterQuestionsFor('module-1')).toContain('Approval trong Codex là gì?')
    expect(starterQuestionsFor('module-2')).toContain('PRD khác implementation plan ở điểm nào?')
    expect(starterQuestionsFor('module-3')).toContain('Vì sao không nên oneshot (nhồi tất cả workload vào một prompt) để tạo một sản phẩm?')
    expect(starterQuestionsFor('module-4')).toContain('Vercel là gì?')
  })
})
