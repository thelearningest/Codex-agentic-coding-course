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
      busy: false, onRetry: () => {}, onContinue: () => {}
    }))
    expect(html).toContain(path)
    expect(html).toContain('Project Codex đã sẵn sàng')
    expect(html).toContain('Tiếp tục với thư mục này')
    expect(html).not.toContain('disabled=""')
    expect(html).not.toContain('Course Companion tự thêm thư mục')
    expect(html).not.toContain('Sao chép đường dẫn')
    expect(html).not.toContain('type="checkbox"')
  })

  it('offers a retry when automatic registration failed', () => {
    const html = renderToStaticMarkup(createElement(PortfolioCodexProjectSetup, {
      path: 'D:\\Portfolio', error: 'Chưa kết nối được.', errorCode: 'M2-READ/RPC(-32601)', busy: false, onRetry: () => {}
    }))
    expect(html).toContain('role="alert"')
    expect(html).toContain('Mã lỗi <code>M2-READ/RPC(-32601)</code>')
    expect(html).toContain('Thử kết nối lại với Codex')
    expect(html).not.toContain('Project Codex đã sẵn sàng')
  })

  it('explains folder trust while waiting and keeps manual reopening secondary', () => {
    const html = renderToStaticMarkup(createElement(PortfolioCodexProjectSetup, {
      path: 'D:/Portfolio', pending: true, busy: false, onRetry: () => {}, onContinue: () => {}
    }))
    expect(html).toContain('Trust this folder?')
    expect(html).toContain('Thư mục đã sẵn sàng trên máy bạn')
    expect(html).toContain('Đang kết nối thư mục của bạn với Codex')
    expect(html).toContain('disabled=""')
    expect(html).toContain('D:/Portfolio')
    expect(html).toContain('Mở lại trong Codex')
    expect(html).not.toContain('role="alert"')
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
    expect(source).toContain('{view.agentsPath &&')
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
