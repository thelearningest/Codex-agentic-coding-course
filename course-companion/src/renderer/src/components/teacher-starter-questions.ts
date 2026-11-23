import type { LessonId } from '../../../../shared/contracts'

// Example questions shown as chips in Triết's empty theory chat, by the module the
// learner is currently in. Wording approved by the owner on 23 November 2026.
const moduleOneQuestions = [
  'Chat và Work khác nhau thế nào?',
  'Approval trong Codex là gì?',
  'Mình nên chọn model nào để bắt đầu?'
] as const

const questionsByLesson: Record<LessonId, readonly string[]> = {
  intro: moduleOneQuestions,
  'module-1': moduleOneQuestions,
  'module-2': [
    'Vì sao nên lập kế hoạch trước khi nhờ agent code?',
    'PRD khác implementation plan ở điểm nào?',
    'Làm sao để agent không hiểu sai ý mình?'
  ],
  'module-3': [
    'Khi gặp lỗi, mình nên gửi gì cho Codex?',
    'Commit và push khác nhau thế nào?',
    'Vì sao không nên oneshot (nhồi tất cả workload vào một prompt) để tạo một sản phẩm?'
  ],
  'module-4': [
    'Làm sao đăng portfolio lên mạng?',
    'Sau khi đăng, mình cập nhật portfolio thế nào?',
    'Vercel là gì?'
  ]
}

export function starterQuestionsFor(lessonId: LessonId | undefined): readonly string[] {
  return questionsByLesson[lessonId ?? 'module-1'] ?? moduleOneQuestions
}
