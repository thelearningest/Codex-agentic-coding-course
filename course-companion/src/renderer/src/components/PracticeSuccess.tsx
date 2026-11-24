import type { ReactNode } from 'react'

const outcomes: Record<string, string> = {
  'm1-codex-safe-setup': 'Effort và Approval đã được xác minh.',
  'm2-portfolio-planning': 'Kế hoạch portfolio của bạn đã được duyệt.',
  'm3-portfolio-build': 'Phiên bản portfolio hiện tại đã được duyệt.',
  'm4-portfolio-release': 'Portfolio trên mạng của bạn đã được duyệt.'
}

export function PracticeSuccess({ practiceId, children }: { practiceId?: string; children?: ReactNode }) {
  return (
    <section className="practice-success" tabIndex={-1} role="status" aria-label="Practice hoàn thành">
      <div className="practice-success-badge" aria-hidden="true">
        <span className="practice-success-spark">✦</span><span className="practice-success-spark">✦</span>
        <span className="practice-success-spark">✧</span><span className="practice-success-spark">✧</span>
        <svg viewBox="0 0 64 64"><path className="practice-success-seal" d="m32 4 8 5 9 1 2 9 5 8-4 9-1 9-9 3-10 6-9-6-9-3-1-9-4-9 5-8 2-9 9-1Z" /><path className="practice-success-check" d="m21 29 8 8 16-17" /></svg>
      </div>
      <small>Đã đạt</small>
      <h3>Làm tốt lắm!</h3>
      <p>{outcomes[practiceId ?? ''] ?? 'Bài thực hành của bạn đã đạt yêu cầu.'}</p>
      <p className="practice-success-next">Lưu kết quả để tiếp tục khóa học nhé.</p>
      {children}
    </section>
  )
}
