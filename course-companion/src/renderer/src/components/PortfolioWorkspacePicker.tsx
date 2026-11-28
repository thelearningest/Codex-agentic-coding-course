import { useEffect, useState } from 'react'
import type { PortfolioWorkspaceView } from '../../../../shared/contracts'
import { AgentsMdTour } from './AgentsMdTour'
import { PortfolioCodexProjectSetup } from './PortfolioCodexProjectSetup'

type WorkspaceAction = 'load' | 'choose' | 'confirm' | 'reopen' | null

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
  action,
  error,
  onChoose,
  onConfirm,
  view
}: {
  action: WorkspaceAction
  error: string
  onChoose: () => void
  onConfirm: () => void
  view: PortfolioWorkspaceView
}) {
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
            Chọn nơi lưu portfolio
          </h2>
        </div>
      </header>

      <p>{view.status === 'unselected'
        ? 'Chọn một thư mục trống bên ngoài thư mục khóa học để làm portfolio từ Module 2 đến Module 4.'
        : view.message}</p>

      {view.selectedPath ? (
        <div className="portfolio-workspace-path">
          <small>{needsRecovery ? 'Đường dẫn cần khôi phục' : 'Thư mục đã chọn'}</small>
          <strong>{view.folderName}</strong>
          <code>{view.selectedPath}</code>
        </div>
      ) : null}

      {view.status === 'awaiting-confirmation' ? (
        <p className="portfolio-workspace-consent">
          Bước tiếp theo sẽ thiết lập thư mục portfolio: tạo thư mục <code>planning</code> và tệp <code>AGENTS.md</code> chứa quy tắc cho Codex. Chưa có tệp ứng dụng nào được tạo.
        </p>
      ) : null}

      {error && <p role="alert">{error}</p>}
      <div className="portfolio-workspace-actions">
        {view.canChoose ? (
          <button className={view.canConfirmPlanning ? 'is-secondary' : 'is-primary'} disabled={action !== null} type="button" onClick={onChoose}>
            {action === 'choose' ? 'Đang chọn thư mục…' : view.canConfirmPlanning ? 'Chọn thư mục khác' : needsRecovery || hasRejectedSelection ? 'Chọn lại thư mục' : 'Chọn thư mục'}
          </button>
        ) : null}
        {view.canConfirmPlanning ? (
          <button className="is-primary" disabled={action !== null} type="button" onClick={onConfirm}>
            {action === 'confirm' ? 'Đang thiết lập…' : 'Thiết lập thư mục portfolio'}
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
  const [action, setAction] = useState<WorkspaceAction>('load')
  const busy = action !== null
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      let loaded = await window.courseCompanion?.loadPortfolioWorkspace({ courseRunId })
      if (active && loaded?.status === 'ready' && loaded.selectedPath && window.courseCompanion) {
        if (active) setView(loaded)
        loaded = await window.courseCompanion.ensurePortfolioCodexProject({ courseRunId, expectedPath: loaded.selectedPath, checkOnly: true })
      }
      if (active && loaded) {
        setView(loaded)
        setError('')
      }
      if (active) setAction(null)
    }
    void load().catch(() => {
      if (active) {
        setView({
          ...initialView(courseRunId),
          status: 'error',
          message: 'Không thể đọc thư mục portfolio đã lưu. Hãy thử lại.'
        })
        setAction(null)
      }
    })
    return () => {
      active = false
    }
  }, [courseRunId])

  const pendingPath = view.courseRunId === courseRunId && view.codexProjectPending ? view.selectedPath : undefined
  useEffect(() => {
    const api = window.courseCompanion
    if (!pendingPath || !api || busy || error) return
    let active = true
    let inFlight = false
    const check = async () => {
      if (!active || inFlight) return
      inFlight = true
      try {
        const next = await api.ensurePortfolioCodexProject({
          courseRunId, expectedPath: pendingPath, checkOnly: true
        })
        if (active && !next.codexProjectPending) setView(next)
      } catch {
        if (active) setError('Chưa kiểm tra được kết nối với Codex. Hãy thử lại.')
      } finally {
        inFlight = false
      }
    }
    const interval = window.setInterval(check, 2000)
    window.addEventListener('focus', check)
    return () => {
      active = false
      window.clearInterval(interval)
      window.removeEventListener('focus', check)
    }
  }, [pendingPath, courseRunId, busy, error])

  const choose = async () => {
    if (!window.courseCompanion) return
    setAction('choose')
    setError('')
    try {
      setView(await window.courseCompanion.choosePortfolioWorkspace({ courseRunId }))
    } catch {
      setError('Chưa chọn được thư mục. Bạn thử chọn lại nhé.')
    } finally {
      setAction(null)
    }
  }

  const confirm = async () => {
    if (!window.courseCompanion) return
    setAction('confirm')
    setError('')
    try {
      setView(await window.courseCompanion.confirmPortfolioPlanning({ courseRunId }))
    } catch {
      setError('Chưa thiết lập được thư mục. Bạn thử lại nhé.')
    } finally {
      setAction(null)
    }
  }

  const retryProject = async () => {
    if (busy || !view.selectedPath || !window.courseCompanion) return
    setAction('reopen')
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
      setAction(null)
    }
  }

  if (view.status === 'ready' && view.selectedPath) {
    return (
      <div className="portfolio-folder-setup" key={view.selectedPath}>
        <PortfolioCodexProjectSetup
          path={view.selectedPath}
          project={view.codexProject}
          pending={Boolean(pendingPath) && !error}
          error={view.codexProjectError || error}
          errorCode={error ? undefined : view.codexProjectErrorCode}
          busy={busy}
          onRetry={() => void retryProject()}
          onContinue={onContinue}
        />
        {(view.planningPath || view.agentsPath) && (
          <details className="portfolio-folder-details">
            <summary>Xem những gì đã tạo trong thư mục</summary>
            {view.planningPath && <div className="portfolio-workspace-ready">
              <strong>Đã tạo thư mục planning</strong><code>{view.planningPath}</code>
            </div>}
            {view.agentsPath && <>
              <div className="portfolio-workspace-ready">
                <strong>Đã tạo AGENTS.md</strong>
                <p>Đây là luật làm việc của khoá học này, Codex sẽ dựa vào đây để hướng dẫn bạn.</p>
              </div>
              <AgentsMdTour />
            </>}
          </details>
        )}
      </div>
    )
  }

  return (
    <PortfolioWorkspaceStatusPanel
      action={action}
      error={error}
      view={view}
      onChoose={() => void choose()}
      onConfirm={() => void confirm()}
    />
  )
}
