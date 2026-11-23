import { useState, type ReactNode } from 'react'
import portrait from '../assets/teacher-triet.png'
import { PracticeStartPrompt } from './PracticeStartPrompt'
import type { Introduction } from './practice-introduction-copy'
import './portfolio-planning-guide.css'
import './portfolio-build-guide.css'

// Mirrors the Module 2 planning guide: one illustrated window, one tab per Practice step.
const scenes = [
  ['Mở bản đầu', 'Trình duyệt / localhost'],
  ['Đối chiếu PRD', 'Portfolio / planning'],
  ['Sửa lỗi', 'Codex / Portfolio'],
  ['Commit và nộp', 'Course Companion / Practice']
] as const

function DraftSite({ compact = false }: { compact?: boolean }) {
  return (
    <div className={'draft-site' + (compact ? ' is-compact' : '')} aria-hidden="true">
      <div className="draft-nav"><b /><span /><span /><span /></div>
      <div className="draft-hero"><i /><i /><i /></div>
      <div className="draft-cards"><span /><span /></div>
    </div>
  )
}

export function PortfolioBuildGuide({ introduction, controls, prompt }: {
  introduction: Introduction
  controls: ReactNode
  prompt?: string
}) {
  const [step, setStep] = useState(0)
  const previousScene = scenes[step - 1]
  const nextScene = scenes[step + 1]
  return (
    <div className="planning-guide build-guide">
      <h1 id="practiceObjective">{introduction.title}</h1>
      <nav aria-label="Chọn hình hướng dẫn">
        {scenes.map(([label], index) => <button key={label} type="button" className="step"
          aria-current={index === step ? 'step' : undefined} onClick={() => setStep(index)}>
          <span>{index + 1}</span>{label}
        </button>)}
      </nav>
      <figure>
        <div className="desk"><div className="window">
          <div className="bar"><i /><i /><i /><span>{scenes[step]?.[1]}</span><small>Minh họa</small></div>
          {step === 0 && <div className="browser-view"><DraftSite /></div>}
          {step === 1 && <div className="papers">
            <article className="paper">
              <small>PRD.md</small>
              <strong>Yêu cầu cho website</strong>
              <ul className="prd-checks">
                <li className="is-pass">Người xem mở được dự án từ trang chủ.</li>
                <li className="is-fail">Nút liên hệ mở đúng email.</li>
              </ul>
            </article>
            <DraftSite compact />
          </div>}
          {step === 2 && <div className="chat">
            <div className="bubble bug-report">
              <span className="bug-shot" aria-hidden="true"><DraftSite compact /></span>
              <p>Mình bấm nút liên hệ. Mong đợi: mở email. Thực tế: không có gì xảy ra.</p>
            </div>
            <div className="speaker"><span className="logo" aria-hidden="true">›_</span>Codex</div>
            <p className="question">Đã sửa xong. Bạn thử bấm lại đúng nút đó nhé.</p>
          </div>}
          {step === 3 && <div className="submit-view">
            <div className="commit-view">
              <span className="commit-line"><i aria-hidden="true" /><code>a1b2c3d</code> Phiên bản portfolio đem nộp</span>
              <span className="commit-line is-earlier"><i aria-hidden="true" /><code>9f8e7d6</code> Bản đầu của portfolio</span>
            </div>
            <div className="review"><img className="portrait" src={portrait} alt="Triết" /><b>Duyệt website</b></div>
          </div>}
        </div>
          <div className="build-scene-arrows">
            <button type="button" className="previous" aria-label={previousScene?.[0] ?? scenes[0][0]}
              disabled={!previousScene} onClick={() => setStep(step - 1)} />
            <button type="button" className="next" aria-label={nextScene?.[0] ?? scenes[3][0]}
              disabled={!nextScene} onClick={() => setStep(step + 1)} />
          </div>
        </div>
        <figcaption aria-live="polite">{introduction.steps[step]}</figcaption>
      </figure>
      <PracticeStartPrompt practiceId="m3-portfolio-build" prompt={prompt} guideActions={controls} />
      {!prompt && controls}
    </div>
  )
}
