/// <reference lib="dom" />
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { moduleTwoStartPrompt } from '../shared/module-two-start-prompt'
import { portfolioPackageArtifactPaths } from '../shared/contracts'
import { PracticeStartPrompt } from '../src/renderer/src/components/PracticeStartPrompt'
import { PracticeDefinitionRepository } from '../electron/main/practice-definition-repository'
import { portfolioContinuationInstructions } from '../electron/main/portfolio-continuation-instructions'
import { PORTFOLIO_BUILD_INSTRUCTIONS } from '../electron/main/portfolio-build-instructions'
import { portfolioReleaseInstructions } from '../electron/main/portfolio-release-instructions'
import { practiceTaskName } from '../electron/main/practice-task-policy'

describe('Module 2 learner-owned start prompt', () => {
  it('uses one readable portfolio name throughout planning, building and release', async () => {
    const definitions = new PracticeDefinitionRepository(join(process.cwd(), '../pilot-workspace/course/practices'))
    for (const [id, version] of [
      ['m2-portfolio-planning', '2.0.0'], ['m3-portfolio-build', '2.0.0'], ['m4-portfolio-release', '1.0.0']
    ]) {
      expect(practiceTaskName(await definitions.load(id!, version!))).toBe('Portfolio của tôi')
    }
  })

  it('specifies the selected portfolio root, five separate contract paths and learner approval', () => {
    for (const path of portfolioPackageArtifactPaths) expect(moduleTwoStartPrompt).toContain(path)
    expect(moduleTwoStartPrompt).toContain('Mọi đường dẫn bên dưới đều tính từ thư mục portfolio đó')
    expect(moduleTwoStartPrompt).toContain('năm tài liệu riêng biệt')
    expect(moduleTwoStartPrompt).toContain('Không tạo task hoặc thư mục portfolio mới')
    expect(moduleTwoStartPrompt).toContain('chờ tôi đọc, duyệt PRD cùng kế hoạch triển khai hiện tại')
    expect(moduleTwoStartPrompt).toContain('chờ tôi đồng ý trước khi đổi tên, di chuyển, xóa hay ghi đè')
  })

  it('preserves the exact course prompt in a collapsed disclosure with an always-available copy action', () => {
    const html = renderToStaticMarkup(createElement(PracticeStartPrompt, { practiceId: 'm2-portfolio-planning' }))
    expect(html).toContain(`<p>${moduleTwoStartPrompt}</p>`)
    expect(html).toContain('<details>')
    expect(html).not.toContain('open=""')
    expect(html).toContain('SAO CHÉP PROMPT</button>')
    expect(html.indexOf('</button>')).toBeLessThan(html.indexOf('<details>'))
  })

  it('keeps the course transition bound to the same shared prompt', async () => {
    const scenes = await readFile(join(process.cwd(), 'src/renderer/src/course/modules/module-2/scenes.tsx'), 'utf8')
    expect(scenes).toContain("import { moduleTwoStartPrompt } from '../../../../../../shared/module-two-start-prompt'")
    expect(scenes).toMatch(/'module-2-portfolio-practice': \{[\s\S]*?copyPrompt: moduleTwoStartPrompt/)
  })

  it.each(['m1-codex-safe-setup', 'm3-portfolio-build', 'm4-portfolio-release'])(
    'keeps the Module 2 prompt out of %s', (practiceId) => {
      expect(renderToStaticMarkup(createElement(PracticeStartPrompt, { practiceId }))).toBe('')
    }
  )

  it.each(['m3-portfolio-build', 'm4-portfolio-release'])('renders the verified %s contract with a repeatable copy action', (practiceId) => {
    const html = renderToStaticMarkup(createElement(PracticeStartPrompt, { practiceId,
      title: 'Portfolio Practice', prompt: 'Existing contract with verified source checkpoint.' }))
    expect(html).toContain('Portfolio Practice</strong>')
    expect(html).toContain('Existing contract with verified source checkpoint.</p>')
    expect(html).toContain('SAO CHÉP PROMPT</button>')
    expect(html).not.toContain(moduleTwoStartPrompt)
    expect(html).not.toContain('open=""')
  })

  it('keeps the approved build instructions and release source checkpoint intact in copied contracts', async () => {
    const definitions = new PracticeDefinitionRepository(join(process.cwd(), '../pilot-workspace/course/practices'))
    const build = await definitions.load('m3-portfolio-build', '2.0.0')
    const release = await definitions.load('m4-portfolio-release', '1.0.0')
    const checkpoint = `sha256:${'a'.repeat(64)}`
    expect(portfolioContinuationInstructions(build)).toContain(PORTFOLIO_BUILD_INSTRUCTIONS)
    expect(PORTFOLIO_BUILD_INSTRUCTIONS).toContain('không phải khuôn mẫu bắt buộc')
    expect(PORTFOLIO_BUILD_INSTRUCTIONS).toContain('Không bắt buộc tên hoặc số lượng đề mục')
    expect(PORTFOLIO_BUILD_INSTRUCTIONS).not.toContain('check chạy typecheck rồi lint rồi build')
    expect(build.criteria.find((criterion) => criterion.id === 'final-validation-current')?.assertion)
      .toContain('equivalent command names, composition and tooling are acceptable')
    expect(portfolioContinuationInstructions(release, checkpoint)).toContain(portfolioReleaseInstructions(checkpoint))
    expect(portfolioReleaseInstructions(checkpoint)).toContain('lệnh kiểm tra đã thực sự chạy')
    expect(portfolioReleaseInstructions(checkpoint)).not.toContain('command: "npm run check"')
    expect(() => portfolioContinuationInstructions(release)).toThrow('verified Module 3 source checkpoint')
  })

  it('keeps the prompt on the transition page and in the active task help surface independent of guide completion', async () => {
    const [brief, teacher, component] = await Promise.all([
      readFile(join(process.cwd(), 'src/renderer/src/components/PracticeBrief.tsx'), 'utf8'),
      readFile(join(process.cwd(), 'src/renderer/src/components/TeacherWorkspace.tsx'), 'utf8'),
      readFile(join(process.cwd(), 'src/renderer/src/components/PracticeStartPrompt.tsx'), 'utf8')
    ])
    expect(brief).toContain('<PracticeStartPrompt practiceId={identity.practiceId} prompt={workspace.startPrompt} title={workspace.title} />')
    expect(teacher).toContain('practiceId={workspace.activePractice.practiceId}')
    expect(teacher.indexOf('<PracticeStartPrompt')).toBeLessThan(teacher.indexOf('<PracticeProgress'))
    expect(component).toContain('navigator.clipboard.writeText(text)')
    expect(component).not.toContain('window.courseCompanion')
  })
})
