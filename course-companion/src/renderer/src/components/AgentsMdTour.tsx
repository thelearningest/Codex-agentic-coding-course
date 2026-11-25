import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { agentsMdExcerpt, agentsMdTourSlides } from '../../../../shared/agents-md-tour'
import './agents-md-tour.css'

function lineKind(text: string): string {
  if (text.startsWith('# ')) return 'is-heading is-title'
  if (text.startsWith('#')) return 'is-heading'
  return ''
}

export function AgentsMdTour() {
  const [index, setIndex] = useState(0)
  const figure = useRef<HTMLElement>(null)
  const shot = useRef<HTMLDivElement>(null)
  const callout = useRef<HTMLParagraphElement>(null)
  const arrow = useRef<SVGPathElement>(null)
  const slide = agentsMdTourSlides[index]
  const total = agentsMdTourSlides.length

  // Route the arrow through the left lane so it never crosses the file text,
  // then point right at the highlighted line(s).
  const drawArrow = useCallback(() => {
    const box = figure.current?.getBoundingClientRect()
    const shotBox = shot.current?.getBoundingClientRect()
    const calloutBox = callout.current?.getBoundingClientRect()
    const targets = shot.current?.querySelectorAll('.is-target')
    const first = targets?.[0]?.getBoundingClientRect()
    const last = targets?.[targets.length - 1]?.getBoundingClientRect()
    if (!box || !shotBox || !calloutBox || !first || !last || !arrow.current) return
    const lane = shotBox.left - box.left - 13
    const endX = shotBox.left - box.left - 3
    const endY = (first.top + last.bottom) / 2 - box.top
    const startX = calloutBox.left - box.left + 22
    const startY = calloutBox.top - box.top - 2
    const turnY = startY - 10
    const r = 8
    arrow.current.setAttribute('d', [
      `M ${startX} ${startY}`,
      `V ${turnY + r}`, `Q ${startX} ${turnY} ${startX - r} ${turnY}`,
      `H ${lane + r}`, `Q ${lane} ${turnY} ${lane} ${turnY - r}`,
      `V ${endY + r}`, `Q ${lane} ${endY} ${lane + r} ${endY}`,
      `H ${endX}`
    ].join(' '))
  }, [])

  useLayoutEffect(drawArrow, [drawArrow, index])

  useEffect(() => {
    const element = figure.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(drawArrow)
    observer.observe(element)
    return () => observer.disconnect()
  }, [drawArrow])

  const go = (next: number) => {
    if (next >= 0 && next < total) setIndex(next)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      go(index - 1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      go(index + 1)
    }
  }

  if (!slide) return null

  return (
    <section className="agents-md-tour" aria-labelledby="agents-md-tour-title">
      <h3 id="agents-md-tour-title">Agents.md của khoá học có những gì?</h3>
      <figure
        ref={figure}
        className="agents-md-tour__figure"
        tabIndex={0}
        role="group"
        aria-roledescription="trình chiếu"
        aria-label="Các đoạn trong tệp AGENTS.md vừa tạo"
        onKeyDown={onKeyDown}
      >
        <div ref={shot} className="agents-md-tour__shot">
          <div className="agents-md-tour__bar">
            <span aria-hidden="true"><i /><i /><i /></span>
            <code>AGENTS.md</code>
          </div>
          <ol aria-label={`Dòng ${slide.from}–${slide.to} trong AGENTS.md`}>
            {agentsMdExcerpt(slide).map((line) => (
              <li
                key={line.number}
                data-line={line.number}
                className={`${lineKind(line.text)}${slide.targets.includes(line.number) ? ' is-target' : ''}`}
              >
                <span>{line.text || ' '}</span>
              </li>
            ))}
          </ol>
        </div>
        <p ref={callout} className="agents-md-tour__callout">{slide.callout}</p>
        <svg className="agents-md-tour__arrow" aria-hidden="true">
          <defs>
            <marker id="agents-md-tour-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" />
            </marker>
          </defs>
          <path ref={arrow} markerEnd="url(#agents-md-tour-head)" />
        </svg>
        <figcaption className="agents-md-tour__nav">
          <small><code>AGENTS.md</code> · {index + 1}/{total}</small>
          <div>
            <button type="button" aria-label="Đoạn trước" disabled={index === 0} onClick={() => go(index - 1)}>‹</button>
            <button type="button" aria-label="Đoạn tiếp theo" disabled={index === total - 1} onClick={() => go(index + 1)}>›</button>
          </div>
        </figcaption>
        <p className="agents-md-tour__live" aria-live="polite">{`Đoạn ${index + 1}/${total}. ${slide.callout}`}</p>
      </figure>
      <p className="agents-md-tour__note">Tẹo nữa đến phần thực hành, agent của khoá học sẽ làm theo những quy tắc này.</p>
    </section>
  )
}
