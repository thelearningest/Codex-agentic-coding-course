import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CSSProperties } from 'react'
import teacherImage from '../assets/teacher-triet.png'
import './onboarding-tour.css'

export const ONBOARDING_ANCHOR_ATTRIBUTE = 'data-onboarding-anchor'

export type OnboardingAnchorId = 'home-teacher' | 'locked-module' | 'lesson-teacher' | 'current-module' | 'outline-menu'

export type OnboardingTourStep = {
  id: string
  anchor: OnboardingAnchorId
  title: string
  body: string
  hint?: string
  /** The learner may click the highlighted element itself; doing so completes the tour. */
  action?: boolean
  nextLabel?: string
}

type OnboardingTourProps = {
  steps: readonly OnboardingTourStep[]
  /** Last step confirmed, or the highlighted element clicked on an action step. */
  onComplete: () => void
  /** "Bỏ qua" or Escape. */
  onSkip: () => void
}

type Rect = { left: number; top: number; right: number; bottom: number }
type Side = 'below' | 'above' | 'left' | 'right' | 'sheet'
type Layout = { hole: Rect | null; side: Side; x: number; y: number; arrow: number }

const MARGIN = 16
const PADDING = 8
const GAP = 18
const arrowBySide: Partial<Record<Side, string>> = { below: '↑', above: '↓', left: '→', right: '←' }

function anchorsOf(id: OnboardingAnchorId): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(`[${ONBOARDING_ANCHOR_ATTRIBUTE}="${id}"]`)]
    .filter((element) => element.getClientRects().length > 0)
}

function holeAround(elements: HTMLElement[]): Rect | null {
  if (elements.length === 0) return null
  const rects = elements.map((element) => element.getBoundingClientRect())
  return {
    left: Math.max(4, Math.min(...rects.map((rect) => rect.left)) - PADDING),
    top: Math.max(4, Math.min(...rects.map((rect) => rect.top)) - PADDING),
    right: Math.min(window.innerWidth - 4, Math.max(...rects.map((rect) => rect.right)) + PADDING),
    bottom: Math.min(window.innerHeight - 4, Math.max(...rects.map((rect) => rect.bottom)) + PADDING)
  }
}

function layoutFor(hole: Rect | null, bubbleWidth: number, bubbleHeight: number): Layout {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const clampX = (x: number) => Math.min(Math.max(MARGIN, x), vw - bubbleWidth - MARGIN)
  const clampY = (y: number) => Math.min(Math.max(MARGIN, y), vh - bubbleHeight - MARGIN)
  if (!hole) {
    return { hole: null, side: 'sheet', x: clampX((vw - bubbleWidth) / 2), y: clampY((vh - bubbleHeight) / 2), arrow: 0 }
  }
  const width = hole.right - hole.left
  const cx = hole.left + width / 2
  const cy = hole.top + (hole.bottom - hole.top) / 2
  const options: Record<Exclude<Side, 'sheet'>, { ok: boolean; x: number; y: number }> = {
    below: { ok: hole.bottom + GAP + bubbleHeight <= vh - MARGIN, x: clampX(cx - bubbleWidth / 2), y: hole.bottom + GAP },
    above: { ok: hole.top - GAP - bubbleHeight >= MARGIN, x: clampX(cx - bubbleWidth / 2), y: hole.top - GAP - bubbleHeight },
    left: { ok: hole.left - GAP - bubbleWidth >= MARGIN, x: hole.left - GAP - bubbleWidth, y: clampY(cy - bubbleHeight / 2) },
    right: { ok: hole.right + GAP + bubbleWidth <= vw - MARGIN, x: hole.right + GAP, y: clampY(cy - bubbleHeight / 2) }
  }
  // Wide targets (roadmap cards) read best with the bubble below or above;
  // small targets low on screen (the Home Triết card) prefer above or left.
  const order: Exclude<Side, 'sheet'>[] = width > vw * 0.5
    ? ['below', 'above', 'left', 'right']
    : cy > vh * 0.6 ? ['above', 'left', 'below', 'right'] : ['below', 'left', 'above', 'right']
  const side = order.find((candidate) => options[candidate].ok)
  if (!side) {
    return { hole, side: 'sheet', x: clampX((vw - bubbleWidth) / 2), y: hole.top > vh / 2 ? MARGIN : vh - bubbleHeight - MARGIN, arrow: 0 }
  }
  const { x, y } = options[side]
  const arrow = side === 'below' || side === 'above'
    ? Math.min(Math.max(14, cx - x - 7), bubbleWidth - 28)
    : Math.min(Math.max(14, cy - y - 7), bubbleHeight - 28)
  return { hole, side, x, y, arrow }
}

export function OnboardingTour({ steps, onComplete, onSkip }: OnboardingTourProps) {
  const [index, setIndex] = useState(0)
  const [layout, setLayout] = useState<Layout | null>(null)
  const bubbleRef = useRef<HTMLElement>(null)
  const primaryRef = useRef<HTMLButtonElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const step = steps[Math.min(index, steps.length - 1)]!
  const isLast = index >= steps.length - 1
  const solo = steps.length === 1

  // Restore focus to wherever the learner was once the tour closes.
  useEffect(() => {
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    return () => {
      // Only restore when focus was left behind by the removed tour; if the learner
      // clicked the real element (e.g. Triết opens chat), keep focus there.
      const previous = restoreFocusRef.current
      const active = document.activeElement
      if (previous && previous.isConnected && (!active || active === document.body)) {
        previous.focus({ preventScroll: true })
      }
    }
  }, [])

  useLayoutEffect(() => {
    let frame = 0
    anchorsOf(step.anchor)[0]?.scrollIntoView({ block: 'nearest' })
    const position = () => {
      const bubble = bubbleRef.current
      if (!bubble) return
      const anchors = anchorsOf(step.anchor)
      // A resize can push the target out of a scrolling area (e.g. the Home Triết card
      // at narrow widths); bring it back so the highlight is never off screen.
      const first = anchors[0]?.getBoundingClientRect()
      if (first && (first.top < 0 || first.bottom > window.innerHeight)) {
        anchors[0]!.scrollIntoView({ block: 'nearest' })
      }
      setLayout(layoutFor(holeAround(anchors), bubble.offsetWidth, bubble.offsetHeight))
    }
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(position)
    }
    position()
    window.addEventListener('resize', schedule)
    window.addEventListener('scroll', schedule, true)
    const observer = new ResizeObserver(schedule)
    anchorsOf(step.anchor).forEach((element) => observer.observe(element))
    if (bubbleRef.current) observer.observe(bubbleRef.current)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', schedule)
      window.removeEventListener('scroll', schedule, true)
    }
  }, [step.anchor, step.id])

  useEffect(() => {
    primaryRef.current?.focus({ preventScroll: true })
  }, [step.id])

  // On an action step, clicking the real element (for example the Triết button)
  // does its normal job and also completes the tour.
  useEffect(() => {
    if (!step.action) return
    const elements = anchorsOf(step.anchor)
    const handle = () => onComplete()
    elements.forEach((element) => element.addEventListener('click', handle))
    return () => elements.forEach((element) => element.removeEventListener('click', handle))
  }, [onComplete, step.action, step.anchor, step.id])

  const next = useCallback(() => {
    if (isLast) onComplete()
    else setIndex((current) => current + 1)
  }, [isLast, onComplete])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onSkip()
        return
      }
      if (event.key !== 'Tab' || !bubbleRef.current) return
      const items = [
        ...(step.action ? anchorsOf(step.anchor) : []),
        ...bubbleRef.current.querySelectorAll<HTMLElement>('button')
      ]
      if (items.length === 0) return
      event.preventDefault()
      const current = items.indexOf(document.activeElement as HTMLElement)
      const nextIndex = event.shiftKey
        ? (current <= 0 ? items.length - 1 : current - 1)
        : (current === items.length - 1 ? 0 : current + 1)
      items[nextIndex]!.focus()
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [onSkip, step.action, step.anchor])

  const nudge = () => {
    // Restart the CSS animation without remounting the bubble, so focus stays put.
    const bubble = bubbleRef.current
    if (bubble) {
      bubble.classList.remove('is-wiggle')
      void bubble.offsetWidth
    }
    bubble?.classList.add('is-wiggle')
  }
  const hole = layout?.hole ?? null
  const vw = typeof window === 'undefined' ? 0 : window.innerWidth
  const vh = typeof window === 'undefined' ? 0 : window.innerHeight
  const blockers: CSSProperties[] = hole
    ? [
        { left: 0, top: 0, width: vw, height: hole.top },
        { left: 0, top: hole.bottom, width: vw, height: Math.max(0, vh - hole.bottom) },
        { left: 0, top: hole.top, width: hole.left, height: hole.bottom - hole.top },
        { left: hole.right, top: hole.top, width: Math.max(0, vw - hole.right), height: hole.bottom - hole.top }
      ]
    : [{ inset: 0 }]
  const holeStyle: CSSProperties | undefined = hole
    ? { left: hole.left, top: hole.top, width: hole.right - hole.left, height: hole.bottom - hole.top }
    : undefined
  const arrowStyle: CSSProperties = layout?.side === 'left' || layout?.side === 'right'
    ? { top: layout.arrow }
    : { left: layout?.arrow ?? 0 }
  const arrowGlyph = layout ? arrowBySide[layout.side] : undefined
  // The bubble uses opacity (not visibility) before it is measured so it can take focus immediately.

  return createPortal(
    <div className="onboarding-tour" data-onboarding-tour={step.id}>
      {blockers.map((style, position) => (
        <div className="onboarding-tour__blocker" style={style} key={position} onClick={nudge} aria-hidden="true" />
      ))}
      {holeStyle ? (
        <>
          <div className={`onboarding-tour__hole${step.action ? ' is-pulsing' : ''}`} style={holeStyle} aria-hidden="true" />
          {step.action ? null : <div className="onboarding-tour__guard" style={holeStyle} onClick={nudge} aria-hidden="true" />}
        </>
      ) : null}
      <section
        ref={bubbleRef}
        className={`onboarding-tour__bubble${step.action ? ' is-action' : ''}`}
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.classList.remove('is-wiggle')
        }}
        data-side={layout?.side ?? 'sheet'}
        style={{ left: layout?.x ?? MARGIN, top: layout?.y ?? MARGIN, opacity: layout ? 1 : 0 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboardingTourTitle"
        aria-describedby="onboardingTourBody"
      >
        <i className="onboarding-tour__arrow" style={arrowStyle} aria-hidden="true" />
        <div className="onboarding-tour__head">
          <span className="onboarding-tour__avatar"><img src={teacherImage} alt="" /></span>
          <div>
            <small>{solo ? 'TRIẾT' : `TRIẾT · ${index + 1}/${steps.length}`}</small>
            <h2 id="onboardingTourTitle">{step.title}</h2>
          </div>
        </div>
        <p className="onboarding-tour__body" id="onboardingTourBody">
          {step.body}
          {step.hint ? <span className="onboarding-tour__hint">{arrowGlyph ? `${arrowGlyph} ` : ''}{step.hint}</span> : null}
        </p>
        <div className="onboarding-tour__foot">
          {solo ? null : (
            <span className="onboarding-tour__dots" aria-hidden="true">
              {steps.map((item, position) => <i className={position <= index ? 'is-on' : ''} key={item.id} />)}
            </span>
          )}
          {solo || isLast ? null : (
            <button className="onboarding-tour__link" type="button" onClick={onSkip}>Bỏ qua</button>
          )}
          {index > 0 ? (
            <button className="onboarding-tour__back" type="button" onClick={() => setIndex((current) => current - 1)}>Quay lại</button>
          ) : null}
          <button ref={primaryRef} className="onboarding-tour__next" type="button" onClick={next}>
            {step.nextLabel ?? 'Tiếp'}
          </button>
        </div>
      </section>
    </div>,
    document.body
  )
}
