import type { PortfolioCodexProject } from '../../../../shared/contracts'

export function PortfolioCodexProjectSetup({
  path, project, error, errorCode, busy, pending, onRetry, onContinue
}: {
  path: string
  project?: PortfolioCodexProject
  error?: string
  errorCode?: string
  busy: boolean
  pending?: boolean
  onRetry: () => void
  onContinue?: () => void
}) {
  return (
    <section className="portfolio-codex-project" aria-labelledby="portfolio-codex-project-title">
      <div className="portfolio-folder-confirmed"><span aria-hidden="true">✓</span> Thư mục đã sẵn sàng trên máy bạn</div>
      <h2 id="portfolio-codex-project-title" aria-live="polite">
        {busy ? 'Đang thêm portfolio vào Codex…' : pending ? 'Đang kết nối thư mục của bạn với Codex' : error ? 'Chưa kết nối được với Codex' : 'Project Codex đã sẵn sàng'}
      </h2>
      {pending ?
        <p>Nếu Codex hỏi “Trust this folder?”, bạn xem đường dẫn có khớp với thư mục bên dưới không nhé. Nếu đúng và bạn tin tưởng thư mục này, bạn có thể xác nhận trong Codex.</p>
      : error ? <div role="alert">
        <p>{error}</p>
        {errorCode ? <p>Mã lỗi <code>{errorCode}</code></p> : null}
      </div> : null}
      <div className="portfolio-codex-project-path">
        {project ? <strong>{project.name}</strong> : null}
        <code>{path}</code>
      </div>
      {pending && <p id="portfolio-connection-wait">Bạn cứ để trang này mở. Khi kết nối xong, nút <strong>Tiếp tục với thư mục này</strong> sẽ tự bật.</p>}
      <div className="portfolio-connection-actions">
        {onContinue && <button className="portfolio-workspace-continue" type="button"
          disabled={busy || pending || !project || Boolean(error)} aria-describedby={pending ? 'portfolio-connection-wait' : undefined}
          onClick={onContinue}>Tiếp tục với thư mục này</button>}
        {(error || pending) && !busy ? <button className="portfolio-reopen" type="button" onClick={onRetry}>{pending ? 'Mở lại trong Codex' : 'Thử kết nối lại với Codex'}</button> : null}
      </div>
    </section>
  )
}
