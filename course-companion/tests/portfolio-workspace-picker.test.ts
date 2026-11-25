import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PortfolioCodexProjectSetup } from '../src/renderer/src/components/PortfolioCodexProjectSetup'

describe('portfolio workspace picker', () => {
  it('shows verified automatic registration with the exact root and no manual setup controls', () => {
    const path = 'D:\\Portfolio của tôi'
    const html = renderToStaticMarkup(createElement(PortfolioCodexProjectSetup, {
      path, project: { id: 'project-1', name: 'Portfolio của tôi', registeredAt: '2026-11-15T00:00:00.000Z' },
      busy: false, onRetry: () => {}
    }))
    expect(html).toContain(path)
    expect(html).toContain('Project Codex đã sẵn sàng')
    expect(html).toContain('Modules 2–4')
    expect(html).not.toContain('Sao chép đường dẫn')
    expect(html).not.toContain('type="checkbox"')
  })

  it('offers a retry when automatic registration failed', () => {
    const html = renderToStaticMarkup(createElement(PortfolioCodexProjectSetup, {
      path: 'D:\\Portfolio', error: 'Chưa kết nối được.', busy: false, onRetry: () => {}
    }))
    expect(html).toContain('role="alert"')
    expect(html).toContain('Thử kết nối lại với Codex')
    expect(html).not.toContain('Project Codex đã sẵn sàng')
  })

  it('uses the native folder-selection API and requires a second confirmation before planning', async () => {
    const source = await readFile(join(
      process.cwd(),
      'src',
      'renderer',
      'src',
      'components',
      'PortfolioWorkspacePicker.tsx'
    ), 'utf8')
    expect(source).toContain('choosePortfolioWorkspace')
    expect(source).toContain('confirmPortfolioPlanning')
    expect(source).toContain('Thiết lập thư mục portfolio')
    expect(source).toContain('Chưa có tệp ứng dụng nào được tạo.')
    expect(source).not.toContain('pilot-workspace')
  })

  it('announces the course AGENTS.md only when the ready workspace has one', async () => {
    const source = await readFile(join(process.cwd(), 'src', 'renderer', 'src', 'components', 'PortfolioWorkspacePicker.tsx'), 'utf8')
    expect(source).toContain('{isReady && view.agentsPath ? (')
    expect(source).toContain('<strong>Đã tạo AGENTS.md</strong>')
    expect(source).toContain('Đây là luật làm việc của khoá học này, Codex sẽ dựa vào đây để hướng dẫn bạn.')
  })

  it('provides distinct recovery, ready, focus, and narrow-layout states', async () => {
    const css = await readFile(join(process.cwd(), 'src', 'renderer', 'src', 'styles.css'), 'utf8')
    expect(css).toContain('.portfolio-workspace-picker.is-missing')
    expect(css).toContain('.portfolio-workspace-picker.is-permission-denied')
    expect(css).toContain('.portfolio-workspace-ready')
    expect(css).toContain('.portfolio-workspace-actions button:focus-visible')
    expect(css).toContain('@media (max-width: 640px)')
  })
})
