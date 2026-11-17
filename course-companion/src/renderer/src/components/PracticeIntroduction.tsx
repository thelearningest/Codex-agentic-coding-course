import type { ReactNode } from 'react'
import type { Introduction } from './practice-introduction-copy'

export function PracticeIntroduction({
  introduction,
  children,
  showReference
}: {
  introduction: Introduction
  children: ReactNode
  showReference: boolean
}) {
  return (
    <>
      <h1 id="practiceObjective">{introduction.title}</h1>
      <p className="practice-setup-purpose">{introduction.purpose}</p>
      <p className="practice-setup-definition">{introduction.context}</p>
      {introduction.portfolioProject ? (
        <p className="practice-setup-definition">
          Course Companion dùng cùng project Codex đã tạo ở Module 2 và mở đúng task portfolio cho bạn.
          Tiếp tục dùng task này khi sửa hoặc nộp lại bài.
        </p>
      ) : null}
      <ol className="practice-setup-instructions" aria-label="Cách thực hành">
        {introduction.steps.map((step) => <li key={step}>{step}</li>)}
      </ol>
      {children}
      {showReference ? (
        <details className="practice-setup-reference">
          <summary>{introduction.referenceTitle}</summary>
          {introduction.referenceNote ? <p>{introduction.referenceNote}</p> : null}
          <dl>
            {introduction.reference.map(([label, value, explanation]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd><strong>{value}</strong><span>{explanation}</span></dd>
              </div>
            ))}
          </dl>
        </details>
      ) : null}
    </>
  )
}
