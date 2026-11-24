import { useRef, useState } from 'react'
import type { CourseCompanionApi, PracticeTaskOpenRequest } from '../../../../shared/contracts'

type Props = {
  task: PracticeTaskOpenRequest
  api?: Pick<CourseCompanionApi, 'openPracticeTask'>
  disabled?: boolean
}

export function PracticeTaskLink({ task, api, disabled }: Props) {
  const opening = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const open = async () => {
    if (opening.current || disabled || !api?.openPracticeTask) return
    opening.current = true
    setBusy(true)
    setError('')
    try {
      const recovery = await api.openPracticeTask(task)
      if (recovery) setError(recovery)
    } catch {
      setError('Chưa thể mở task Codex. Hãy thử lại; nếu bạn vừa đổi Practice, hãy đóng rồi mở lại bảng này.')
    } finally {
      opening.current = false
      setBusy(false)
    }
  }

  return <div className="practice-task-navigation">
    <button className="practice-task-link" type="button"
      aria-label="Mở lại task Codex của Practice này" aria-busy={busy}
      disabled={busy || disabled || !api?.openPracticeTask} onClick={() => void open()}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6m0-6L10 14M10 4H4v16h16v-6" /></svg>
      <span>{busy ? 'Đang mở task Codex…' : 'Mở lại task Codex'}</span>
    </button>
    {error ? <p className="practice-task-link-error" role="alert">{error}</p> : null}
  </div>
}
