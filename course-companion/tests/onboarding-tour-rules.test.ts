import { describe, expect, it } from 'vitest'
import {
  ONBOARDING_TOUR_DECISION_KEY,
  readOnboardingTourState,
  shouldShowHomeTour,
  shouldShowLessonTip,
  shouldShowTeacherDot,
  moduleUnlockedBetween,
  TEACHER_CHAT_OPENED_DECISION_KEY,
  OUTLINE_REVIEW_TIP_DECISION_KEY,
  shouldShowOutlineReviewTip
} from '../src/renderer/src/components/onboarding-tour-rules'

describe('onboarding tour rules', () => {
  it('reads only known saved states and treats anything else as not started', () => {
    expect(readOnboardingTourState(undefined)).toBe('not-started')
    expect(readOnboardingTourState({})).toBe('not-started')
    expect(readOnboardingTourState({ [ONBOARDING_TOUR_DECISION_KEY]: 'home-done' })).toBe('home-done')
    expect(readOnboardingTourState({ [ONBOARDING_TOUR_DECISION_KEY]: 'skipped' })).toBe('skipped')
    expect(readOnboardingTourState({ [ONBOARDING_TOUR_DECISION_KEY]: 'complete' })).toBe('complete')
    expect(readOnboardingTourState({ [ONBOARDING_TOUR_DECISION_KEY]: 'something-else' })).toBe('not-started')
  })

  it('shows the Home tour only to Module 1 learners who have not seen it or finished Module 1', () => {
    const moduleOne = { currentLessonId: 'module-1' as const, completedCheckpointIds: [] }
    expect(shouldShowHomeTour(moduleOne, 'not-started')).toBe(true)
    expect(shouldShowHomeTour(moduleOne, 'home-done')).toBe(false)
    expect(shouldShowHomeTour(moduleOne, 'skipped')).toBe(false)
    expect(shouldShowHomeTour(moduleOne, 'complete')).toBe(false)
    expect(shouldShowHomeTour({ currentLessonId: 'intro', completedCheckpointIds: [] }, 'not-started')).toBe(false)
    expect(shouldShowHomeTour({ currentLessonId: 'module-2', completedCheckpointIds: [] }, 'not-started')).toBe(false)
    expect(shouldShowHomeTour({ currentLessonId: 'module-1', completedCheckpointIds: ['m1-complete'] }, 'not-started')).toBe(false)
  })

  it('shows the lesson tip once, only after the Home tour was finished and outside the intro', () => {
    expect(shouldShowLessonTip('home-done', 'module-1')).toBe(true)
    expect(shouldShowLessonTip('home-done', 'intro')).toBe(false)
    expect(shouldShowLessonTip('not-started', 'module-1')).toBe(false)
    expect(shouldShowLessonTip('skipped', 'module-1')).toBe(false)
    expect(shouldShowLessonTip('complete', 'module-1')).toBe(false)
  })

  it('shows the Triết dot until chat is opened, never for learners with a conversation', () => {
    expect(shouldShowTeacherDot({}, false)).toBe(true)
    expect(shouldShowTeacherDot(undefined, false)).toBe(true)
    expect(shouldShowTeacherDot({ [TEACHER_CHAT_OPENED_DECISION_KEY]: 'yes' }, false)).toBe(false)
    expect(shouldShowTeacherDot({}, true)).toBe(false)
    // Still checking history: stay hidden instead of flashing.
    expect(shouldShowTeacherDot({}, null)).toBe(false)
  })

  it('announces a module only when it unlocks during the session', () => {
    expect(moduleUnlockedBetween('module-1', 'module-2')).toBe('module-2')
    expect(moduleUnlockedBetween('module-2', 'module-3')).toBe('module-3')
    expect(moduleUnlockedBetween('module-3', 'module-4')).toBe('module-4')
    // Loading saved progress, the intro → Module 1 step, staying put or going back never count.
    expect(moduleUnlockedBetween(null, 'module-2')).toBeNull()
    expect(moduleUnlockedBetween('intro', 'module-1')).toBeNull()
    expect(moduleUnlockedBetween('module-2', 'module-2')).toBeNull()
    expect(moduleUnlockedBetween('module-3', 'module-2')).toBeNull()
    expect(moduleUnlockedBetween('module-2', null)).toBeNull()
  })

  it('shows the outline review tip once, on a passed summary the learner is actually on', () => {
    const passed = { onSummary: true, passed: true, browsing: false }
    expect(shouldShowOutlineReviewTip({}, passed)).toBe(true)
    expect(shouldShowOutlineReviewTip(undefined, passed)).toBe(true)
    expect(shouldShowOutlineReviewTip({ [OUTLINE_REVIEW_TIP_DECISION_KEY]: 'yes' }, passed)).toBe(false)
    expect(shouldShowOutlineReviewTip({}, { ...passed, passed: false })).toBe(false)
    expect(shouldShowOutlineReviewTip({}, { ...passed, browsing: true })).toBe(false)
    expect(shouldShowOutlineReviewTip({}, { ...passed, onSummary: false })).toBe(false)
  })
})
