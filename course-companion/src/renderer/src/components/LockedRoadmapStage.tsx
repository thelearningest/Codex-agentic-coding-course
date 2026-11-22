import { useEffect, useRef, useState } from 'react'
import type { AnimationEvent, ReactNode } from 'react'
import { ONBOARDING_ANCHOR_ATTRIBUTE } from './OnboardingTour'
import './locked-roadmap-stage.css'

const HINT_DURATION_MS = 2500

const lockIcon = (
  <svg className="pixel-roadmap-lock" viewBox="0 0 12 12" aria-hidden="true">
    <rect x="2" y="5" width="8" height="6" fill="currentColor" />
    <path d="M4 5V3.5a2 2 0 0 1 4 0V5" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

// A roadmap module that is not open yet. It stays a (disabled) button so mouse,
// keyboard and screen-reader users all get the same response: pressing it shakes
// the card and, for a moment, shows how to unlock it in place of the status.
export function LockedRoadmapStage({ children, status, unlockHint }: {
  children: ReactNode
  status: string
  unlockHint: string
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const timerRef = useRef<number | undefined>(undefined)
  const [hintVisible, setHintVisible] = useState(false)

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  const nudge = () => {
    const card = ref.current
    if (card) {
      card.classList.remove('is-nudged')
      void card.offsetWidth // restart the shake on repeated presses
      card.classList.add('is-nudged')
    }
    setHintVisible(true)
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setHintVisible(false), HINT_DURATION_MS)
  }

  const settle = (event: AnimationEvent<HTMLButtonElement>) => {
    if (event.target === event.currentTarget) event.currentTarget.classList.remove('is-nudged')
  }

  return (
    <>
      <button
        ref={ref}
        type="button"
        className="pixel-roadmap-stage is-locked"
        aria-disabled="true"
        onClick={nudge}
        onAnimationEnd={settle}
        {...{ [ONBOARDING_ANCHOR_ATTRIBUTE]: 'locked-module' }}
      >
        {children}
        <em className={hintVisible ? 'is-showing-hint' : undefined}>
          <span className="pixel-roadmap-status">{lockIcon}{status}</span>
          {hintVisible ? <span className="pixel-roadmap-hint" aria-hidden="true">{lockIcon}{unlockHint}</span> : null}
        </em>
      </button>
      <span className="pixel-roadmap-live" role="status">{hintVisible ? unlockHint : ''}</span>
    </>
  )
}
