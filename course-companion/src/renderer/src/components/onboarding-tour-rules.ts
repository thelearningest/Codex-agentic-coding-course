import type { LearnerProgress, LessonId } from '../../../../shared/contracts'

// Stored in learner progress decisions so it lives in Electron-owned app data
// and is cleared together with progress by "Xóa và học lại".
export const ONBOARDING_TOUR_DECISION_KEY = 'onboardingTour'

export type OnboardingTourState = 'not-started' | 'home-done' | 'skipped' | 'complete'

const storedStates = new Set<OnboardingTourState>(['home-done', 'skipped', 'complete'])

export function readOnboardingTourState(decisions: Record<string, string> | undefined): OnboardingTourState {
  const value = decisions?.[ONBOARDING_TOUR_DECISION_KEY]
  return storedStates.has(value as OnboardingTourState) ? value as OnboardingTourState : 'not-started'
}

// The Home tour explains that modules unlock in order, so it only fits learners
// who are still in Module 1 and have not finished it.
export function shouldShowHomeTour(
  progress: Pick<LearnerProgress, 'currentLessonId' | 'completedCheckpointIds'>,
  state: OnboardingTourState
): boolean {
  return state === 'not-started'
    && progress.currentLessonId === 'module-1'
    && !progress.completedCheckpointIds.includes('m1-complete')
}

// Shown once, on the first module lesson opened after the Home tour was finished.
// Skipping the Home tour skips this tip too.
export function shouldShowLessonTip(state: OnboardingTourState, lessonId: LessonId): boolean {
  return state === 'home-done' && lessonId !== 'intro'
}

// Saved the first time the learner opens Triết chat from the learning window.
export const TEACHER_CHAT_OPENED_DECISION_KEY = 'teacherChatOpened'

// The yellow "new" dot on the Triết buttons stays until chat is opened once.
// Learners who already have a conversation never see it. While the history check
// is still loading (`hasConversation === null`) the dot stays hidden to avoid a flash.
export function shouldShowTeacherDot(
  decisions: Record<string, string> | undefined,
  hasConversation: boolean | null
): boolean {
  return hasConversation === false && decisions?.[TEACHER_CHAT_OPENED_DECISION_KEY] !== 'yes'
}
