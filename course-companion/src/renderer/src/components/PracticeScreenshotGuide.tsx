import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import codexImage from '../assets/practice-preview/codex.jpg'
import panelImage from '../assets/practice-preview/triet-panel.jpg'
import detailImage from '../assets/practice-preview/triet-detail.jpg'
import './practice-screenshot-guide.css'

type Stage = 'codex' | 'panel' | 'submitted'

export function PracticeScreenshotGuide({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState<Stage>('codex')
  const target = useRef<HTMLButtonElement>(null)
  const moveFocus = useRef(false)

  function advance(next: Stage) {
    moveFocus.current = true
    setStage(next)
  }

  useLayoutEffect(() => {
    if (moveFocus.current) {
      target.current?.focus({ preventScroll: true })
      moveFocus.current = false
    }
  }, [stage])

  return (
    <section className="practice-screenshot-guide" aria-labelledby="practice-screenshot-title">
      <h2 id="practice-screenshot-title">Xem cách thực hành cùng Codex và Triết</h2>
      <p>Mở khung chat bên cạnh và làm theo hướng dẫn của mình. Khi làm xong, bạn bấm <strong>Nộp bài</strong> nhé.</p>
      <figure aria-label="Hình hướng dẫn tương tác">
        <div className="viewport"><div className="scene">
          <img className="photo" src={stage === 'codex' ? codexImage : panelImage}
            alt={stage === 'codex' ? 'Nút Mở Triết nằm cạnh hình Triết ở góc dưới bên phải cửa sổ Codex.' : 'Bảng hướng dẫn của Triết mở bên phải Codex. Đọc mục Tiếp theo, rồi nộp bài ở đầu bảng khi làm xong.'} />
          {stage === 'codex' && <>
            <span className="leader" aria-hidden="true" />
            <button className="open" type="button" aria-label="Mở Triết" ref={target} onClick={() => advance('panel')}>
              <span className="lens" aria-hidden="true"><img src={detailImage} alt="" /><span className="lens-label">Mở Triết ↗</span></span>
              <span className="origin" aria-hidden="true" />
            </button>
          </>}
          {stage === 'panel' && <button className="submit" type="button" ref={target} onClick={() => advance('submitted')}>Nộp bài</button>}
          {stage === 'submitted' && <div className="receipt"><div className="receipt-inner">
            <p role="status">Đã thử nộp bài</p>
            <button className="replay" type="button" ref={target} onClick={() => advance('codex')}>Xem lại</button>
          </div></div>}
        </div></div>
        <figcaption className="controls">
          <nav className="steps" aria-label="Chọn hình hướng dẫn">
            <button className="step" type="button" aria-current={stage === 'codex' ? 'step' : undefined} onClick={() => setStage('codex')}>
              <span aria-hidden="true">1</span>Mở Triết
            </button>
            <span className="join" aria-hidden="true" />
            <button className="step" type="button" aria-current={stage === 'codex' ? undefined : 'step'} onClick={() => setStage('panel')}>
              <span aria-hidden="true">2</span>Nộp bài
            </button>
          </nav>
          {children}
        </figcaption>
      </figure>
    </section>
  )
}
