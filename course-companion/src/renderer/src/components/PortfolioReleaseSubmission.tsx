import { useEffect, useRef, useState } from 'react'
import { portfolioReleaseRecordPath } from '../../../../shared/contracts'
import type { PortfolioPackageSubmissionProps } from './PortfolioPackageSubmission'

export function PortfolioReleaseSubmission({ workspace, api, disabled, onWorkspaceChange, onBusyChange, onRefresh }: PortfolioPackageSubmissionProps) {
  const [approvedKey, setApprovedKey] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const errorRef = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    if (!error) return
    errorRef.current?.focus({ preventScroll: true })
    errorRef.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
  }, [error])
  const release = workspace.portfolioPackage
  const active = workspace.activePractice
  if (release?.kind !== 'release' || !active) return null
  const key = `${active.runId}:${active.generation}:${release.sourceDigest}`
  const approved = approvedKey === key && release.ready
  const observation = release.deployment

  const submit = async () => {
    if (!approved || busy || disabled || !release.sourceDigest || !api?.approvePortfolioPackage) return
    setBusy(true)
    onBusyChange?.(true)
    setError('')
    try {
      const loaded = await api.loadProgress()
      if (loaded.status !== 'returning' && loaded.status !== 'recovered') throw new Error('Progress unavailable')
      const confirmed = await api.approvePortfolioPackage({ runId: active.runId, generation: active.generation,
        practiceId: active.practiceId, practiceVersion: active.practiceVersion, courseRunId: loaded.progress.courseRunId,
        sourceDigest: release.sourceDigest, approveWebsite: true })
      onWorkspaceChange?.(confirmed)
      const reviewed = await api.reviewPractice()
      if ('error' in reviewed) setError(reviewed.error.message)
      else onWorkspaceChange?.(reviewed.workspace)
    } catch {
      setApprovedKey(null)
      setError('Chưa thể nộp phiên bản hiện tại. Hãy kiểm tra hồ sơ và đường link, làm mới bằng chứng rồi thử lại.')
    } finally {
      setBusy(false)
      onBusyChange?.(false)
    }
  }

  return <section className="practice-planning-evidence practice-package-submission" aria-label="Nộp bài phát hành portfolio">
    <h3 className="practice-package-heading">Portfolio trên mạng của bạn</h3>
    <p>Tiếp tục trong task Codex hiện tại để đưa portfolio lên Vercel. Bạn tự đăng nhập, cấp quyền và quyết định phát hành.</p>
    <p style={{ overflowWrap: 'anywhere' }}><code>{portfolioReleaseRecordPath}</code></p>
    {observation?.reachable && observation.finalUrl ? <p className="practice-package-notice" style={{ overflowWrap: 'anywhere' }}>
      Đường link đã phản hồi khi kiểm tra không dùng tài khoản: <a href={observation.finalUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>{observation.finalUrl}</a>.
      {' '}Bạn vẫn cần tự xem nội dung, ảnh và liên kết trên máy tính và điện thoại.
    </p> : <p className="practice-package-notice">Chưa xác nhận được đường link chia sẻ. Nhờ Codex cập nhật hồ sơ triển khai rồi làm mới bằng chứng.</p>}
    {[...new Set(release.issues)].map((issue) => <p className="practice-package-notice" role="status" key={issue}>{issue}</p>)}
    <label className="practice-package-approval">
      <input type="checkbox" checked={approved} disabled={busy || disabled || !release.ready}
        onChange={() => setApprovedKey(approved ? null : key)} />
      Tôi đã mở đường link khi chưa đăng nhập, kiểm tra trên máy tính và điện thoại, và chấp nhận portfolio hiện tại.
    </label>
    <div className="practice-brief-actions">
      {onRefresh ? <button type="button" disabled={busy || disabled} onClick={() => { setApprovedKey(null); onRefresh() }}>Làm mới bằng chứng</button> : null}
      <button type="button" aria-busy={busy} disabled={busy || disabled || !approved || !api?.approvePortfolioPackage || !onWorkspaceChange}
        onClick={() => void submit()}>{busy ? 'Đang kiểm tra website…' : 'Chấp nhận portfolio trên mạng và nộp bài'}</button>
    </div>
    {error ? <p className="practice-package-notice" ref={errorRef} tabIndex={-1} role="alert">{error}</p> : null}
  </section>
}
