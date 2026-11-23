import { useState, type ReactNode } from 'react'
import portrait from '../assets/teacher-triet.png'
import { PracticeStartPrompt } from './PracticeStartPrompt'
import type { Introduction } from './practice-introduction-copy'
import './portfolio-planning-guide.css'

const scenes = [
  ['Trao đổi', 'Codex / Portfolio'],
  ['Duyệt kế hoạch', 'Portfolio / planning'],
  ['Nộp bài', 'Course Companion / Practice']
] as const

export function PortfolioPlanningGuide({ introduction, controls }: { introduction: Introduction; controls: ReactNode }) {
  const [step, setStep] = useState(0)
  return (
    <div className="planning-guide">
      <h1 id="practiceObjective">{introduction.title}</h1>
      <figure>
        <div className="desk"><div className="window">
          <div className="bar"><i /><i /><i /><span>{scenes[step]?.[1]}</span><small>Minh họa</small></div>
          {step === 0 && <div className="chat">
            <p className="bubble">Mình muốn lập kế hoạch cho portfolio.</p>
            <div className="speaker"><span className="logo" aria-hidden="true">›_</span>Codex</div>
            <p className="question">Bạn muốn ai xem portfolio của mình?</p>
          </div>}
          {step === 1 && <div className="papers">
            <article className="paper"><small>PRD.md</small><strong>Yêu cầu cho website</strong><p>Người xem mở được dự án từ trang chủ.</p></article>
            <article className="paper"><small>implementation-plan.md</small><strong>Kế hoạch triển khai</strong><p>Thêm liên kết đến dự án và bấm thử từ trang chủ.</p></article>
          </div>}
          {step === 2 && <div className="submit-view">
            <div><strong>▱ &nbsp;planning/</strong><div className="files">{introduction.reference.map(([, path]) =>
              <span className="file" key={path}>{path.replace(/^planning\//, '')}</span>)}</div></div>
            <div className="review"><img className="portrait" src={portrait} alt="Triết" /><b>Duyệt và nộp gói planning</b></div>
          </div>}
        </div></div>
        <figcaption aria-live="polite">{introduction.steps[step]}</figcaption>
      </figure>
      <nav aria-label="Chọn hình hướng dẫn">
        {scenes.map(([label], index) => <button key={label} type="button" className="step"
          aria-current={index === step ? 'step' : undefined} onClick={() => setStep(index)}>
          <span>{index + 1}</span>{label}
        </button>)}
      </nav>
      <PracticeStartPrompt practiceId="m2-portfolio-planning" guideActions={controls} />
    </div>
  )
}
