import { useRef } from 'react'
import type { AnimationEvent, ReactNode } from 'react'
import { ONBOARDING_ANCHOR_ATTRIBUTE } from './OnboardingTour'
import './locked-roadmap-stage.css'

const NOTE_ANIMATION = 'locked-roadmap-note'

// A roadmap module that is not open yet. It stays a (disabled) button so mouse,
// keyboard and screen-reader users all get the same response: pressing it shakes
// the card and briefly highlights the card's existing "how to unlock" line.
export function LockedRoadmapStage({ children, status }: { children: ReactNode; status: string }) {
  const ref = useRef<HTMLButtonElement>(null)

  const nudge = () => {
    const card = ref.current
    if (!card) return
    card.classList.remove('is-nudged')
    void card.offsetWidth // restart the animation on repeated presses
    card.classList.add('is-nudged')
  }

  const settle = (event: AnimationEvent<HTMLButtonElement>) => {
    if (event.animationName === NOTE_ANIMATION) event.currentTarget.classList.remove('is-nudged')
  }

  return (
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
      <em>
        <svg className="pixel-roadmap-lock" viewBox="0 0 12 12" aria-hidden="true">
          <rect x="2" y="5" width="8" height="6" fill="currentColor" />
          <path d="M4 5V3.5a2 2 0 0 1 4 0V5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        {status}
      </em>
    </button>
  )
}
