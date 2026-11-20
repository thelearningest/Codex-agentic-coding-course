import { useEffect, useRef, useState } from 'react'
import { portfolioBuildRecordPaths, portfolioPackageArtifactPaths, type CourseCompanionApi, type PracticeWorkspaceView } from '../../../../shared/contracts'
import { PortfolioReleaseSubmission } from './PortfolioReleaseSubmission'

export type PortfolioPackageSubmissionProps = {
  workspace: PracticeWorkspaceView
  api?: CourseCompanionApi
  disabled?: boolean
  onWorkspaceChange?: (workspace: PracticeWorkspaceView) => void
  onBusyChange?: (busy: boolean) => void
  onRefresh?: () => void
}

export function PortfolioPackageSubmission(props: PortfolioPackageSubmissionProps) {
  return props.workspace.portfolioPackage?.kind === 'release'
    ? <PortfolioReleaseSubmission {...props} />
    : <PortfolioDocumentSubmission {...props} />
}

function PortfolioDocumentSubmission({ workspace, api, disabled, onWorkspaceChange, onBusyChange, onRefresh }: PortfolioPackageSubmissionProps) {
  const [approved, setApproved] = useState(false)
  const [approvalDigest, setApprovalDigest] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const errorRef = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    if (!error) return
    errorRef.current?.focus({ preventScroll: true })
    errorRef.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
  }, [error])
  const packageView = workspace.portfolioPackage
  const active = workspace.activePractice
  if (!packageView || !active) return null
  const build = packageView.kind === 'build'
  const artifactPaths = build ? portfolioBuildRecordPaths : portfolioPackageArtifactPaths
  const accepted = approved && approvalDigest === packageView.sourceDigest

  const submit = async () => {
    if (!api?.approvePortfolioPackage || !accepted || !packageView.sourceDigest || busy || disabled) return
    setBusy(true)
    onBusyChange?.(true)
    setError('')
    try {
      const loaded = await api.loadProgress()
      if (loaded.status !== 'returning' && loaded.status !== 'recovered') throw new Error('Không thể đọc tiến độ khóa học.')
      const confirmed = await api.approvePortfolioPackage({
        runId: active.runId, generation: active.generation, practiceId: active.practiceId,
        practiceVersion: active.practiceVersion, courseRunId: loaded.progress.courseRunId,
        sourceDigest: packageView.sourceDigest, ...(build ? { approveWebsite: true as const } : { approvePrd: true as const, approvePlan: true as const })
      })
      onWorkspaceChange?.(confirmed)
      const reviewed = await api.reviewPractice()
      if ('error' in reviewed) setError(reviewed.error.message)
      else onWorkspaceChange?.(reviewed.workspace)
    } catch {
      setError(build ? 'Chưa thể nộp bài hiện tại. Hãy làm mới bằng chứng, xem lại website rồi thử lại.' : 'Chưa thể nộp gói hiện tại. Hãy làm mới tài liệu, kiểm tra lại PRD và kế hoạch rồi thử lại.')
    } finally {
      setBusy(false)
      onBusyChange?.(false)
    }
  }

  return (
    <section className="practice-planning-evidence practice-package-submission" aria-label={build ? 'Nộp bài xây portfolio' : 'Nộp gói planning'}>
      <h3 className="practice-package-heading">{build ? 'Bằng chứng từ quá trình xây website' : 'Sáu tệp cần nộp'}</h3>
      {!build ? <p role="status">
        Đã đọc {artifactPaths.filter((path) => packageView.artifactPaths.includes(path)).length}/{artifactPaths.length} tệp.
        {!packageView.ready || !packageView.approved ? ' Chưa duyệt nội dung.' : ''}
      </p> : null}
      {build ? <p>Trong task Codex, nêu những gì bạn đã thử và kết quả trên website. Codex ghi lại vào ba hồ sơ dưới đây.</p> : null}
      <ul className="practice-package-issues" role="list">{artifactPaths.map((path) => {
        const issues = [...new Set(packageView.issues.filter((issue) => issue.startsWith(`${path}: `)))]
        return <li key={path}>
          <svg className="practice-package-document-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5Z M14 3v5h5 M9 12h6 M9 16h6" />
          </svg>
          <div><strong>{path}{issues.length ? ':' : ''}</strong>{issues.map((issue) =>
            <span key={issue}>{' '}{issue.slice(path.length + 2)}</span>)}</div>
        </li>
      })}</ul>
      {[...new Set(packageView.issues)].filter((issue) =>
        !artifactPaths.some((path) => issue.startsWith(`${path}: `)))
        .map((issue) => <p className="practice-package-notice" key={issue}>{issue}</p>)}
      {packageView.unexpectedPaths.length > 0 ? <p className="practice-package-notice">Ngoài phạm vi: {packageView.unexpectedPaths.join(', ')}</p> : null}
      {!packageView.ready && packageView.issues.length === 0 ? <p className="practice-package-notice">{build ? 'Ghi lại kết quả kiểm tra và quan sát trên website hiện tại trước khi nộp.' : onRefresh ? 'Lưu đủ sáu tệp rồi làm mới bằng chứng để kiểm tra gói hiện tại.' : 'Lưu đủ sáu tệp rồi chọn “Cập nhật và kiểm tra tiến độ” để kiểm tra gói hiện tại.'}</p> : null}
      <label className="practice-package-approval">
        <input type="checkbox" checked={accepted} disabled={busy || disabled || !packageView.ready}
          onChange={() => { setApproved(!accepted); setApprovalDigest(packageView.sourceDigest) }} />
        {build ? 'Tôi đã xem website, đối chiếu kết quả kiểm tra và chấp nhận phiên bản hiện tại.' : 'Tôi đã đọc và duyệt PRD cùng kế hoạch triển khai hiện tại.'}
      </label>
      <div className="practice-brief-actions">
        {onRefresh ? <button type="button" disabled={busy || disabled} onClick={onRefresh}>Làm mới bằng chứng</button> : null}
        <button type="button" aria-busy={busy} disabled={busy || disabled || !accepted || !packageView.ready || !onWorkspaceChange || !api?.approvePortfolioPackage}
          onClick={() => void submit()}>{busy ? <span className="pixel-chat-thinking-dots" aria-hidden="true"><i /><i /><i /></span> : null}{busy ? 'Đang kiểm tra gói…' : build ? 'Chấp nhận website và nộp bài' : 'Duyệt và nộp gói planning'}</button>
      </div>
      {error ? <p className="practice-package-notice" ref={errorRef} tabIndex={-1} role="alert">{error}</p> : null}
    </section>
  )
}
