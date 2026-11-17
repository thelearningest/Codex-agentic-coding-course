/// <reference lib="dom" />
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { moduleTwoStartPrompt } from '../shared/module-two-start-prompt'
import { portfolioAgentsTemplate } from '../shared/portfolio-agents-template'
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

  it('keeps the learner request short and defers package rules to the portfolio AGENTS.md', () => {
    expect(moduleTwoStartPrompt).toContain('chỉ tạo hoặc cập nhật tài liệu trong thư mục planning')
    expect(moduleTwoStartPrompt.endsWith('Hãy làm theo AGENTS.md trong thư mục này.')).toBe(true)
    for (const path of portfolioPackageArtifactPaths) expect(moduleTwoStartPrompt).not.toContain(path)
  })

  it('specifies the selected portfolio root, five separate contract paths and learner approval in AGENTS.md', () => {
    for (const path of portfolioPackageArtifactPaths) expect(portfolioAgentsTemplate).toContain(path)
    expect(portfolioAgentsTemplate).toContain('Mọi đường dẫn bên dưới đều tính từ thư mục này')
    expect(portfolioAgentsTemplate).toContain('năm tài liệu riêng biệt')
    expect(portfolioAgentsTemplate).toContain('Không tạo task hoặc thư mục portfolio mới')
    expect(portfolioAgentsTemplate).toContain('chờ người học đọc, duyệt PRD cùng kế hoạch triển khai hiện tại')
    expect(portfolioAgentsTemplate).toContain('Chờ người học đồng ý trước khi đổi tên, di chuyển, xóa hay ghi đè')
    expect(portfolioAgentsTemplate).toContain('không tự phê duyệt hoặc tuyên bố Practice đã hoàn thành')
    expect(portfolioAgentsTemplate).not.toContain('chưa viết code')
  })

  it('scopes each module section of AGENTS.md to the current module only', () => {
    const headings = ['## Cách dùng tệp này', '## Thư mục làm việc', '## Tài liệu và dữ liệu',
      '## Module 2: gói kế hoạch', '## Module 3: xây website', '## Module 4: đưa portfolio lên mạng']
    const positions = headings.map((heading) => portfolioAgentsTemplate.indexOf(heading))
    expect(positions.every((position) => position >= 0)).toBe(true)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
    expect(portfolioAgentsTemplate).toContain('Chỉ làm theo mục của module hiện tại và bỏ qua các mục module khác')
    expect(portfolioAgentsTemplate).toContain('Nếu chỉ dẫn không nêu module và thư mục chưa có mã ứng dụng, đó là Module 2')
    expect(portfolioAgentsTemplate).toContain('Không thêm backend, dịch vụ xử lý dữ liệu hay triển khai lên hosting trong Module 3')
    expect(portfolioAgentsTemplate).toContain('chờ người học đồng ý cho đúng hành động đó')
    expect(portfolioAgentsTemplate).toContain('Không tự mua tên miền hay dịch vụ')
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
    expect(portfolioContinuationInstructions(release, checkpoint)).toContain(portfolioReleaseInstructions(checkpoint))
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
