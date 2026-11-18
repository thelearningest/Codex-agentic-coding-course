import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { portfolioBuildRecordPaths, portfolioPackageArtifactPaths, portfolioReleaseRecordPath } from '../shared/contracts'
import { PracticeIntroduction } from '../src/renderer/src/components/PracticeIntroduction'
import { getPracticeIntroduction } from '../src/renderer/src/components/practice-introduction-copy'

describe('beginner Practice introductions', () => {
  it.each(['m2-portfolio-planning', 'm3-portfolio-build', 'm4-portfolio-release'])(
    'keeps %s in the same project and existing linked task', (id) => {
      const html = renderToStaticMarkup(createElement(PracticeIntroduction, {
        introduction: getPracticeIntroduction(id)!, showReference: false, children: null
      }))
      expect(html).toContain('Course Companion dùng cùng project Codex đã tạo ở Module 2')
      expect(html).toContain('mở đúng task portfolio cho bạn')
      expect(getPracticeIntroduction('m1-codex-safe-setup')!.portfolioProject).toBeUndefined()
    }
  )

  it.each([
    ['m1-codex-safe-setup', 'Làm quen với cài đặt Codex', 4],
    ['m2-portfolio-planning', 'Lập kế hoạch cho portfolio', 5],
    ['m3-portfolio-build', 'Xây portfolio theo kế hoạch', 3],
    ['m4-portfolio-release', 'Đưa portfolio lên mạng', 1]
  ])('explains %s with three steps and an initially collapsed reference', (id, title, count) => {
    const introduction = getPracticeIntroduction(String(id))!
    const html = renderToStaticMarkup(createElement(PracticeIntroduction, {
      introduction, showReference: true,
      children: createElement('button', { type: 'button' }, 'Bắt đầu thực hành')
    }))
    expect(html).toContain(title)
    expect(html).toContain(introduction.purpose)
    expect(html.match(/<li>/g)).toHaveLength(3)
    expect(html.match(/<dt>/g)).toHaveLength(Number(count))
    expect(html).toContain('<details')
    expect(html).not.toContain('open=""')
    expect(html).not.toContain('Không xác minh được')
    expect(html).not.toContain('Chưa có dữ liệu')
    expect(html.indexOf('Bắt đầu thực hành')).toBeLessThan(html.indexOf('<details'))
  })

  it('keeps the reference paths aligned with the current five-document and three-record contracts', () => {
    for (const [id, paths] of [
      ['m2-portfolio-planning', portfolioPackageArtifactPaths],
      ['m3-portfolio-build', portfolioBuildRecordPaths],
      ['m4-portfolio-release', [portfolioReleaseRecordPath]]
    ] as const) {
      expect(getPracticeIntroduction(id)!.reference.map(([, path]) => path)).toEqual([...paths])
    }
  })

  it('preserves continuation, learner approval, debugging and publication boundaries', () => {
    const planning = getPracticeIntroduction('m2-portfolio-planning')!
    const build = getPracticeIntroduction('m3-portfolio-build')!
    const release = getPracticeIntroduction('m4-portfolio-release')!
    expect(planning.context).toContain('chưa viết code')
    expect(planning.steps.join(' ')).toContain('duyệt PRD')
    expect(build.context).toContain('từ Module 2')
    expect(build.steps.join(' ')).toContain('Kiểm tra website theo PRD')
    expect(build.referenceNote).toContain('năm câu tổng kết')
    expect(release.context).toContain('từ Module 3')
    expect(release.context).toContain('Bạn tự đăng nhập, cấp quyền và quyết định phát hành')
    expect(release.steps.join(' ')).toContain('khi chưa đăng nhập')
    expect(release.steps.join(' ')).toContain('không có bài kiểm tra cuối')
  })

  it('keeps existing action content available when the reference is omitted for an active task', () => {
    const html = renderToStaticMarkup(createElement(PracticeIntroduction, {
      introduction: getPracticeIntroduction('m1-codex-safe-setup')!, showReference: false,
      children: createElement('p', { role: 'alert' }, 'Không thể mở task. Hãy thử lại.')
    }))
    expect(html).toContain('role="alert"')
    expect(html).not.toContain('<details')
    expect(getPracticeIntroduction('m1-verifiable-brief')).toBeUndefined()
  })
})
