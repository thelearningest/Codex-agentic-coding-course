import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { portfolioBuildRecordPaths, portfolioPackageArtifactPaths, type PracticeWorkspaceView } from '../shared/contracts'
import { PracticeProgress } from '../src/renderer/src/components/PracticeProgress'

function workspace(): PracticeWorkspaceView {
  return { schemaVersion: 1, phase: 'active', title: 'Planning', objective: 'Năm tài liệu', expectedOutcome: 'Gói được duyệt',
    checklist: [{ id: 'portfolio-brief', title: 'Bản mô tả', status: 'current' }],
    review: { status: 'not-reviewed', canReview: true, canReturn: false },
    portfolioPackage: { ready: true, approved: true, sourceDigest: 'a'.repeat(64), artifactPaths: [...portfolioPackageArtifactPaths], issues: [], unexpectedPaths: [] },
    activePractice: { runId: 'run-1', generation: 2, practiceId: 'm2-portfolio-planning', practiceVersion: '2.0.0', executorChatName: 'Portfolio', startedAt: '2026-09-11T00:00:00.000Z' },
    presentation: { fullPanel: 'teacher', compactPanel: 'teacher' },
    capabilities: { canStartNew: true, canResume: true, selectiveTransferAvailable: false, selectiveTransferReason: '' }
  }
}

describe('five-document Practice submission surface', () => {
  it.each([false, true])('shows files read and the single blocker instead of five unreviewed failures in compact=%s', (compact) => {
    const view = workspace()
    const message = 'Kế hoạch cần mô tả phụ thuộc hoặc thứ tự thực hiện.'
    view.portfolioPackage!.ready = false
    view.portfolioPackage!.approved = false
    view.portfolioPackage!.artifactPaths.push('planning/reference/screenshots/example.png')
    view.portfolioPackage!.issues = [`planning/implementation-plan.md: ${message}`]
    view.review!.status = 'needs-work'
    view.review!.result = {
      schemaVersion: 1, practiceId: 'm2-portfolio-planning', practiceVersion: '2.0.0', runId: 'run-1',
      verdict: 'needs-work', summary: 'Gói planning chưa sẵn sàng.',
      reviewedAt: '2026-11-17T00:00:00.000Z', sourceDigest: 'a'.repeat(64),
      criteria: Array.from({ length: 5 }, (_, index) => ({
        criterionId: `criterion-${index}`, status: 'unverifiable', evidenceRefs: [], explanation: message
      }))
    }
    const html = renderToStaticMarkup(createElement(PracticeProgress, { workspace: view, compact }))
    expect(html).toContain('Đã đọc 5/5 tài liệu.')
    expect(html).toContain('Chưa duyệt nội dung.')
    expect(html.split(message)).toHaveLength(2)
    expect(html).not.toContain('bước đã xác minh')
    expect(html).not.toContain('Kết quả theo từng tiêu chí')
    expect(html).toMatch(/type="checkbox"[^>]*disabled=""/)
    expect(html).toMatch(/disabled=""[^>]*>Duyệt và nộp gói planning/)
  })

  it('counts only documents actually read', () => {
    const view = workspace()
    view.portfolioPackage!.ready = false
    view.portfolioPackage!.approved = false
    view.portfolioPackage!.artifactPaths = portfolioPackageArtifactPaths.slice(0, 3)
    const html = renderToStaticMarkup(createElement(PracticeProgress, { workspace: view, compact: true }))
    expect(html).toContain('Đã đọc 3/5 tài liệu.')
    expect(html).not.toContain('bước đã xác minh')
  })

  it.each(['m2-portfolio-planning', 'm3-portfolio-build', 'm4-portfolio-release'])(
    'shows actual unmet review criteria in the compact panel for %s', (practiceId) => {
    const view = workspace()
    view.activePractice!.practiceId = practiceId
    view.portfolioPackage!.kind = practiceId === 'm4-portfolio-release' ? 'release' : practiceId === 'm3-portfolio-build' ? 'build' : 'planning'
    view.review!.status = 'needs-work'
    view.review!.result = {
      schemaVersion: 1, practiceId: 'm2-portfolio-planning', practiceVersion: '2.0.0', runId: 'run-1',
      verdict: 'needs-work', summary: 'Làm rõ hai quyết định còn thiếu.',
      reviewedAt: '2026-10-29T00:00:00.000Z', sourceDigest: 'a'.repeat(64),
      criteria: [
        { criterionId: 'brief-current-and-approved', status: 'unsatisfied', evidenceRefs: [], explanation: 'Ghi hành động mong muốn của người xem.' },
        { criterionId: 'reference-sourced-and-bounded', status: 'unverifiable', evidenceRefs: [], explanation: 'Chốt hướng trình bày từ nguồn đã chọn.' },
        { criterionId: 'prd-semantic-contract', status: 'satisfied', evidenceRefs: [], explanation: 'PRD đã đáp ứng.' }
      ]
    }
    const html = renderToStaticMarkup(createElement(PracticeProgress, { workspace: view, compact: true }))
    expect(html).toContain('aria-label="Kết quả duyệt Practice"')
    expect(html).toContain('Làm rõ hai quyết định còn thiếu.')
    expect(html).toContain('Ghi hành động mong muốn của người xem.')
    expect(html).toContain('Chốt hướng trình bày từ nguồn đã chọn.')
    expect(html).not.toContain('Hoàn thành bước hiện tại:')
    expect(html).not.toContain('PRD đã đáp ứng.')
  })

  it.each([
    ['m3-portfolio-build', 'build', 'Chấp nhận website và nộp bài'],
    ['m4-portfolio-release', 'release', 'Chấp nhận portfolio trên mạng và nộp bài']
  ] as const)('points a ready, unapproved %s package to its own submission action', (practiceId, kind, label) => {
    const view = workspace()
    view.activePractice!.practiceId = practiceId
    view.portfolioPackage!.kind = kind
    view.portfolioPackage!.approved = false
    view.review!.status = 'needs-work'
    for (const compact of [false, true]) {
      const html = renderToStaticMarkup(createElement(PracticeProgress, { workspace: view, compact }))
      expect(html).toContain(`<strong>${label}</strong>`)
      expect(html).not.toContain('Hoàn thành bước hiện tại:')
      expect(html).not.toContain('checked=""')
    }
  })

  it.each([false, true])('points ready but unapproved planning work to submission in compact=%s', (compact) => {
    const view = workspace()
    view.portfolioPackage!.approved = false
    view.review!.status = 'needs-work'
    const html = renderToStaticMarkup(createElement(PracticeProgress, { workspace: view, compact }))
    expect(html).toContain('Duyệt và nộp gói planning')
    expect(html).not.toContain('Hoàn thành bước hiện tại: Bản mô tả.')
    expect(html).not.toContain('checked=""')
    expect(html).toContain('Đã đọc 5/5 tài liệu.')
    expect(html).toContain('Chưa duyệt nội dung.')
    expect(html).not.toContain('bước đã xác minh')
    if (!compact) expect(html).toContain('<li class="is-current">')
  })

  it.each([false, true])('uses website acceptance and three supporting records for build v2 in compact=%s', (compact) => {
    const view = workspace()
    view.activePractice!.practiceId = 'm3-portfolio-build'
    view.portfolioPackage!.kind = 'build'
    const html = renderToStaticMarkup(createElement(PracticeProgress, { workspace: view, compact }))
    expect(html.match(/type="checkbox"/g)).toHaveLength(1)
    for (const path of portfolioBuildRecordPaths) expect(html.split(path)).toHaveLength(2)
    expect(html).toContain('Chấp nhận website và nộp bài')
    expect(html).not.toContain('Duyệt và nộp gói planning')
    expect(html).not.toContain('Tôi đã đọc và duyệt PRD')
    expect(html).not.toContain('Chấp nhận phần này')
    expect(html).not.toContain('checked=""')
  })
  it.each([false, true])('shows every required path once while preserving distinct issues in compact=%s', (compact) => {
    const view = workspace()
    view.portfolioPackage!.ready = false
    view.portfolioPackage!.issues = [
      'planning/PRD.md: Chưa có tài liệu bắt buộc.',
      'planning/PRD.md: Chưa có tài liệu bắt buộc.',
      'planning/PRD.md: Thiếu mục bắt buộc.',
      'Cần làm mới bằng chứng.'
    ]
    const html = renderToStaticMarkup(createElement(PracticeProgress, { workspace: view, compact, showObjective: false }))
    for (const path of portfolioPackageArtifactPaths) expect(html.split(path)).toHaveLength(2)
    expect(html.split('Chưa có tài liệu bắt buộc.')).toHaveLength(2)
    expect(html).toContain('Thiếu mục bắt buộc.')
    expect(html).toContain('Cần làm mới bằng chứng.')
    expect(html).not.toContain('practice-package-documents')
    expect(html).not.toContain('>Năm tài liệu</strong>')
    if (!compact) {
      expect(html).toContain('<details class="practice-package-progress">')
      expect(html).toContain('Xem tiến độ chi tiết')
      expect(html).not.toContain('<details class="practice-package-progress" open')
    }
    expect(html).not.toContain('Hoàn thành bước hiện tại: Bản mô tả.')
  })
  it.each([false, true])('shows one explicit, initially unchecked approval in compact=%s', (compact) => {
    const html = renderToStaticMarkup(createElement(PracticeProgress, { workspace: workspace(), compact }))
    expect(html.match(/type="checkbox"/g)).toHaveLength(1)
    expect(html).not.toContain('checked=""')
    expect(html).toContain('Tôi đã đọc và duyệt PRD cùng kế hoạch triển khai hiện tại.')
    expect(html).toMatch(/disabled=""[^>]*>Duyệt và nộp gói planning/)
    for (const path of portfolioPackageArtifactPaths) expect(html).toContain(path)
    expect(html).not.toContain('first-bounded-task.md')
    expect(html).not.toContain('requirement-validation-map.md')
  })

  it.each([false, true])('keeps one refresh action available until submission is busy in compact=%s', (compact) => {
    const props = { workspace: workspace(), compact, onRefresh: () => {} }
    const available = renderToStaticMarkup(createElement(PracticeProgress, props))
    expect(available.match(/>Làm mới bằng chứng<\/button>/g)).toHaveLength(1)
    expect(available).not.toMatch(/disabled=""[^>]*>Làm mới bằng chứng/)
    const busy = renderToStaticMarkup(createElement(PracticeProgress, { ...props, actionBusy: true }))
    expect(busy).toMatch(/disabled=""[^>]*>Làm mới bằng chứng/)
  })
})
