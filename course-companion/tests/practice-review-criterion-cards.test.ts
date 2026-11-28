import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PracticeProgress } from '../src/renderer/src/components/PracticeProgress'
import type { PracticeCriterionReview, PracticeWorkspaceView } from '../shared/contracts'

function moduleTwo(criteria: PracticeCriterionReview[]): PracticeWorkspaceView {
  return {
    schemaVersion: 1,
    phase: 'active',
    title: 'Lập kế hoạch cho portfolio',
    objective: '',
    expectedOutcome: '',
    activePractice: { runId: 'run-1', generation: 1, practiceId: 'm2-portfolio-planning', practiceVersion: '2.0.0', executorChatName: 'Practice', startedAt: '2026-11-28T00:00:00.000Z' },
    checklist: [{ id: 'portfolio-brief', title: 'Hoàn thiện bản mô tả portfolio', status: 'completed' }],
    review: {
      status: 'needs-work',
      canReview: true,
      canReturn: false,
      result: {
        schemaVersion: 1, practiceId: 'm2-portfolio-planning', practiceVersion: '2.0.0', runId: 'run-1',
        verdict: 'needs-work', summary: 'Còn một chỗ cần sửa.', reviewedAt: '2026-11-28T03:32:33.000Z',
        sourceDigest: 'a'.repeat(64), criteria
      }
    },
    portfolioPackage: { kind: 'planning', ready: true, approved: true, sourceDigest: 'a'.repeat(64), artifactPaths: [], issues: [], unexpectedPaths: [] }
  } as unknown as PracticeWorkspaceView
}

const met: PracticeCriterionReview = {
  criterionId: 'brief-current-and-approved', status: 'satisfied', evidenceRefs: [], explanation: 'Bạn đã xác định người xem.'
}
const unmet: PracticeCriterionReview = {
  criterionId: 'plan-phased-and-bounded', status: 'unsatisfied', evidenceRefs: [],
  explanation: 'Phạm vi phiên bản đầu vẫn lệch giữa các tài liệu.',
  problem: 'Bản mô tả portfolio ghi vài dự án, nhưng PRD chỉ làm Vanver.',
  nextStep: 'Nhắn Codex sửa để mọi tài liệu ghi giống nhau, rồi nộp lại.'
}

describe('Practice review criterion cards', () => {
  it('names each card, lists unmet criteria first and folds passed ones', () => {
    const html = renderToStaticMarkup(createElement(PracticeProgress, { workspace: moduleTwo([met, unmet]) }))
    expect(html).toContain('Các bước làm và phạm vi')
    expect(html).toContain('Người xem, mục tiêu và phạm vi')
    expect(html.indexOf('Các bước làm và phạm vi')).toBeLessThan(html.indexOf('Xem 1 tiêu chí đã đáp ứng'))
    expect(html.indexOf('Xem 1 tiêu chí đã đáp ứng')).toBeLessThan(html.indexOf('Người xem, mục tiêu và phạm vi'))
  })

  it('shows problem and next step, and puts the next step in Tiếp theo', () => {
    const html = renderToStaticMarkup(createElement(PracticeProgress, { workspace: moduleTwo([met, unmet]) }))
    expect(html).toContain('<b>Vấn đề:</b> Bản mô tả portfolio ghi vài dự án, nhưng PRD chỉ làm Vanver.')
    expect(html).toContain('<b>Việc cần làm:</b> Nhắn Codex sửa để mọi tài liệu ghi giống nhau, rồi nộp lại.')
    expect(html).not.toContain('Phạm vi phiên bản đầu vẫn lệch giữa các tài liệu.')
    const start = html.indexOf('practice-review-next-action')
    const nextAction = html.slice(start, html.indexOf('</div>', start))
    expect(nextAction).toContain('Nhắn Codex sửa để mọi tài liệu ghi giống nhau, rồi nộp lại.')
  })

  it('builds a fix prompt from unmet cards in screen order', () => {
    const unverifiable: PracticeCriterionReview = {
      criterionId: 'inventory-honest-and-publishable', status: 'unverifiable', evidenceRefs: [],
      explanation: 'Chưa rõ ai cho phép đăng ảnh Vanver.'
    }
    const rendered = renderToStaticMarkup(createElement(PracticeProgress, { workspace: moduleTwo([met, unverifiable, unmet]) }))
    const promptStart = rendered.indexOf('<p>', rendered.indexOf('Prompt để dán vào Codex'))
    const prompt = rendered.slice(promptStart, rendered.indexOf('</p>', promptStart))
    expect(prompt).toContain('Nếu điểm nào cần mình quyết định, hãy hỏi mình trước.')
    expect(prompt).toContain('1. Các bước làm và phạm vi\nVấn đề: Bản mô tả portfolio ghi vài dự án, nhưng PRD chỉ làm Vanver.\nViệc cần làm: Nhắn Codex sửa để mọi tài liệu ghi giống nhau, rồi nộp lại.')
    expect(prompt).toContain('2. Tư liệu, nguồn và quyền sử dụng\nChưa rõ ai cho phép đăng ảnh Vanver.')
    expect(prompt).not.toContain('Người xem, mục tiêu và phạm vi')

    const html = renderToStaticMarkup(createElement(PracticeProgress, { workspace: moduleTwo([met, unmet]) }))
    expect(html).toContain('Nhờ Codex sửa những điểm trên')
    expect(html).toContain('Sao chép prompt')
    expect(html.indexOf('Nhờ Codex sửa những điểm trên')).toBeLessThan(html.indexOf('Xem 1 tiêu chí đã đáp ứng'))
    const compact = renderToStaticMarkup(createElement(PracticeProgress, { workspace: moduleTwo([met, unmet]), compact: true }))
    expect(compact).toContain('Nhờ Codex sửa những điểm trên')
  })

  it('offers the fix prompt only for Module 2 results that still need work', () => {
    const moduleThree = moduleTwo([met, unmet])
    moduleThree.activePractice = { ...moduleThree.activePractice!, practiceId: 'm3-portfolio-build', practiceVersion: '2.1.0' }
    expect(renderToStaticMarkup(createElement(PracticeProgress, { workspace: moduleThree }))).not.toContain('Nhờ Codex sửa')
    const allMet = renderToStaticMarkup(createElement(PracticeProgress, { workspace: moduleTwo([met]) }))
    expect(allMet).not.toContain('Nhờ Codex sửa')
  })

  it('falls back to the explanation for results without a problem and next step', () => {
    const older = { ...unmet, problem: undefined, nextStep: undefined }
    const html = renderToStaticMarkup(createElement(PracticeProgress, { workspace: moduleTwo([met, older]) }))
    expect(html).not.toContain('Vấn đề:')
    expect(html).toContain('Phạm vi phiên bản đầu vẫn lệch giữa các tài liệu.')
  })
})
