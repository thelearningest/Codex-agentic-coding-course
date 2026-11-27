import { useEffect, useState } from 'react'
import type { PortfolioWorkspaceView } from '../../../../shared/contracts'
import { AgentsMdTour } from './AgentsMdTour'
import { PortfolioCodexProjectSetup } from './PortfolioCodexProjectSetup'

function initialView(courseRunId: string): PortfolioWorkspaceView {
  return {
    schemaVersion: 1,
    courseRunId,
    status: 'unselected',
    observedAt: new Date(0).toISOString(),
    message: 'Chọn một thư mục trống dành riêng cho portfolio.',
    canChoose: true,
    canConfirmPlanning: false
  }
}

export function PortfolioWorkspaceStatusPanel({
  busy,
  onChoose,
  onConfirm,
  view
}: {
  busy: boolean
  onChoose: () => void
  onConfirm: () => void
  view: PortfolioWorkspaceView
}) {
  const isReady = view.status === 'ready'
  const needsRecovery = view.status === 'missing' || view.status === 'permission-denied'
  const hasRejectedSelection = view.status === 'rejected' || view.status === 'error'

  return (
    <section
      className={`portfolio-workspace-picker is-${view.status}`}
      aria-labelledby="portfolio-workspace-title"
      aria-live="polite"
    >
      <header>
        <span aria-hidden="true">⌂</span>
        <div>
          <small>Không gian làm việc</small>
          <h2 id="portfolio-workspace-title">
            {isReady ? 'Thư mục portfolio đã sẵn sàng' : 'Chọn nơi lưu portfolio'}
          </h2>
        </div>
      </header>

      <p>{view.message}</p>

      {view.selectedPath ? (
        <div className="portfolio-workspace-path">
          <small>{needsRecovery ? 'Đường dẫn cần khôi phục' : 'Thư mục đã chọn'}</small>
          <strong>{view.folderName}</strong>
          <code>{view.selectedPath}</code>
        </div>
      ) : (
        <div className="portfolio-workspace-guidance">
          <span>01</span>
          <p>Tạo một thư mục trống bên ngoài thư mục khóa học.</p>
          <span>02</span>
          <p>Course Companion sẽ dùng đúng thư mục này trong Modules 2–4.</p>
        </div>
      )}

      {isReady && view.planningPath ? (
        <div className="portfolio-workspace-ready">
          <span>✓</span>
          <div><strong>Đã tạo thư mục planning</strong><code>{view.planningPath}</code></div>
        </div>
      ) : null}

      {isReady && view.agentsPath ? (
        <div className="portfolio-workspace-ready">
          <span>✓</span>
          <div><strong>Đã tạo AGENTS.md</strong><p>Đây là luật làm việc của khoá học này, Codex sẽ dựa vào đây để hướng dẫn bạn.</p></div>
        </div>
      ) : null}

      {isReady && view.agentsPath ? <AgentsMdTour /> : null}

      {view.status === 'awaiting-confirmation' ? (
        <p className="portfolio-workspace-consent">
          Bước tiếp theo sẽ thiết lập thư mục portfolio: tạo thư mục <code>planning</code> và tệp <code>AGENTS.md</code> chứa quy tắc cho Codex. Chưa có tệp ứng dụng nào được tạo.
        </p>
      ) : null}

      <div className="portfolio-workspace-actions">
        {view.canChoose ? (
          <button className={view.canConfirmPlanning ? 'is-secondary' : 'is-primary'} disabled={busy} type="button" onClick={onChoose}>
            {busy ? 'Đang kiểm tra…' : needsRecovery || hasRejectedSelection ? 'Chọn lại thư mục' : 'Chọn thư mục'}
          </button>
        ) : null}
        {view.canConfirmPlanning ? (
          <button className="is-primary" disabled={busy} type="button" onClick={onConfirm}>
            {busy ? 'Đang tạo…' : 'Thiết lập thư mục portfolio'}
          </button>
        ) : null}
      </div>
    </section>
  )
}

export function PortfolioWorkspacePicker({
  courseRunId,
  onContinue
}: {
  courseRunId: string
  onContinue?: () => void
}) {
  const [view, setView] = useState<PortfolioWorkspaceView>(() => initialView(courseRunId))
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      let loaded = await window.courseCompanion?.loadPortfolioWorkspace({ courseRunId })
      if (loaded?.status === 'ready' && loaded.selectedPath && window.courseCompanion) {
        if (active) setView(loaded)
        loaded = await window.courseCompanion.ensurePortfolioCodexProject({ courseRunId, expectedPath: loaded.selectedPath })
      }
      if (active && loaded) {
        setView(loaded)
        setError('')
      }
      if (active) setBusy(false)
    }
    void load().catch(() => {
      if (active) {
        setView({
          ...initialView(courseRunId),
          status: 'error',
          message: 'Không thể đọc thư mục portfolio đã lưu. Hãy thử lại.'
        })
        setBusy(false)
      }
    })
    return () => {
      active = false
    }
  }, [courseRunId])

  const choose = async () => {
    if (!window.courseCompanion) return
    setBusy(true)
    setError('')
    try {
      setView(await window.courseCompanion.choosePortfolioWorkspace({ courseRunId }))
    } finally {
      setBusy(false)
    }
  }

  const confirm = async () => {
    if (!window.courseCompanion) return
    setBusy(true)
    setError('')
    try {
      setView(await window.courseCompanion.confirmPortfolioPlanning({ courseRunId }))
    } finally {
      setBusy(false)
    }
  }

  const continueWithProject = async () => {
    if (busy || view.status !== 'ready' || !view.selectedPath || !onContinue) return
    if (!view.codexProject || view.codexProjectError) return
    onContinue()
  }

  const retryProject = async () => {
    if (busy || !view.selectedPath || !window.courseCompanion) return
    setBusy(true)
    setError('')
    try {
      const next = await window.courseCompanion.ensurePortfolioCodexProject({
        courseRunId,
        expectedPath: view.selectedPath
      })
      setView(next)
    } catch {
      setError('Chưa kết nối được với Codex. Hãy thử lại.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PortfolioWorkspaceStatusPanel
        busy={busy}
        view={view}
        onChoose={() => void choose()}
        onConfirm={() => void confirm()}
      />
      {view.status === 'ready' && view.selectedPath ? (
        <PortfolioCodexProjectSetup
          key={view.selectedPath}
          path={view.selectedPath}
          project={view.codexProject}
          error={view.codexProjectError || error}
          errorCode={error ? undefined : view.codexProjectErrorCode}
          busy={busy}
          onRetry={() => void retryProject()}
        />
      ) : null}
      {error ? <p className="portfolio-codex-project-error" role="alert">{error}</p> : null}
      {view.status === 'ready' && onContinue ? (
        <button className="portfolio-workspace-continue" disabled={busy || !view.codexProject || Boolean(view.codexProjectError)}
          type="button" onClick={() => void continueWithProject()}>
          Tiếp tục với thư mục này
        </button>
      ) : null}
    </>
  )
}
