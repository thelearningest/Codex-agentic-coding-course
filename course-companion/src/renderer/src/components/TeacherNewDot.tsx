import './teacher-new-dot.css'

// Small yellow dot on the Triết buttons until the learner opens chat once.
// Decorative: the buttons keep their existing accessible names.
export function TeacherNewDot() {
  return <i className="pixel-teacher-new-dot" data-teacher-new-dot="" aria-hidden="true" />
}
