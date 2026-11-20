import { useId, useState, type ReactNode } from 'react'
import { moduleTwoStartPrompt } from '../../../../shared/module-two-start-prompt'

export function PracticeStartPrompt({ practiceId, prompt, title, guideActions }: { practiceId: string; prompt?: string; title?: string; guideActions?: ReactNode }) {
  const titleId = useId()
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  const text = practiceId === 'm2-portfolio-planning' ? moduleTwoStartPrompt : prompt
  const heading = !guideActions && (practiceId === 'm2-portfolio-planning' ? 'Bắt đầu lập kế hoạch portfolio' : title)
  if (!text) return null

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setStatus('copied')
    } catch {
      setStatus('error')
    }
  }

  return (
    <aside className="practice-start-prompt" data-copy-state={status} aria-label={heading ? undefined : 'Prompt để dán vào Codex'} aria-labelledby={heading ? titleId : undefined}>
      <header>
        {heading && <strong id={titleId}>{heading}</strong>}
        <button type="button" onClick={() => void copyPrompt()}>
          {status === 'copied' ? 'ĐÃ SAO CHÉP' : status === 'error' ? 'THỬ LẠI' : guideActions ? 'Sao chép prompt' : 'SAO CHÉP PROMPT'}
        </button>
      </header>
      <details>
        <summary>{guideActions ? 'Prompt để dán vào Codex' : 'PROMPT ĐỂ DÁN VÀO CODEX'}</summary>
        <p>{text}</p>
      </details>
      {status !== 'idle' ? (
        <p className="practice-start-prompt-status" role="status">
          {status === 'copied'
            ? 'Đã sao chép prompt. Bạn có thể dán vào Codex.'
            : 'Chưa thể sao chép. Hãy thử lại.'}
        </p>
      ) : null}
      {guideActions}
    </aside>
  )
}
