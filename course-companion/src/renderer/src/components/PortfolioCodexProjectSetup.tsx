import type { PortfolioCodexProject } from '../../../../shared/contracts'

export function PortfolioCodexProjectSetup({
  path, project, error, busy, onRetry
}: {
  path: string
  project?: PortfolioCodexProject
  error?: string
  busy: boolean
  onRetry: () => void
}) {
  return (
    <section className="portfolio-codex-project" aria-labelledby="portfolio-codex-project-title" aria-live="polite">
      <h3 id="portfolio-codex-project-title">
        {busy ? 'Đang thêm portfolio vào Codex…' : error ? 'Chưa kết nối được với Codex' : 'Project Codex đã sẵn sàng'}
      </h3>
      {error ? <p role="alert">{error}</p> : <p>
        Course Companion tự thêm thư mục portfolio vào Codex và dùng lại cùng project cho mọi bài thực hành portfolio trong Modules 2–4.
      </p>}
      <div className="portfolio-codex-project-path">
        {project ? <strong>{project.name}</strong> : null}
        <code>{path}</code>
      </div>
      {error && !busy ? <button type="button" onClick={onRetry}>Thử kết nối lại với Codex</button> : null}
    </section>
  )
}
