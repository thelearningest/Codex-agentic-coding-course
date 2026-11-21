import type { LearnerProgress, LessonId, SceneId } from '../contracts'
import { moduleTwoOutlineSections } from './modules/module-2'

export type OutlineSection = { title: string; startSceneId: SceneId }

export const courseOutline: Record<LessonId, readonly OutlineSection[]> = {
  intro: [
    { title: 'Bạn sẽ xây gì trong khóa học?', startSceneId: 'intro-visual-onboarding' },
    { title: 'Kết quả cuối khóa', startSceneId: 'intro-course-overview-2' },
    { title: 'Áp dụng kỹ năng sau khóa học', startSceneId: 'intro-learning-method' }
  ],
  'module-1': [
    { title: 'Chat, Work và Codex', startSceneId: 'module-1-chat-work' },
    { title: 'Approval: quyền thực hiện thao tác', startSceneId: 'module-1-codex-examples' },
    { title: 'Model và mức suy luận', startSceneId: 'module-1-codex-model-intro' },
    { title: 'Lệnh / và menu @', startSceneId: 'module-1-codex-slash-commands' },
    { title: 'AGENTS.md và Skills', startSceneId: 'module-1-agents-intro' },
    { title: 'Thực hành: Thiết lập Codex', startSceneId: 'module-1-codex-projects' },
    { title: 'Kiểm tra cuối Module 1', startSceneId: 'module-1-mastery' },
    { title: 'Tổng kết Module 1', startSceneId: 'module-1-final-summary' }
  ],
  'module-2': [
    'module-2-portfolio-workspace',
    'module-2-prd-definition',
    'module-2-prd-review-workflow',
    'module-2-prd-agent-workflow',
    'module-2-implementation-plan-intro',
    'module-2-portfolio-practice',
    'module-2-portfolio-mastery',
    'module-2-portfolio-mastery-summary'
  ].map((startSceneId, index) => ({ title: moduleTwoOutlineSections[index]!, startSceneId: startSceneId as SceneId })),
  'module-3': [
    { title: 'Tạo bản portfolio đầu tiên', startSceneId: 'module-3-first-build' },
    { title: 'Mở portfolio trên máy', startSceneId: 'module-3-local-preview' },
    { title: 'Debug cùng coding agent', startSceneId: 'module-3-debugging-intro' },
    { title: 'Git và GitHub', startSceneId: 'module-3-git-intro' },
    { title: 'Tổng hợp trước Practice', startSceneId: 'module-3-pre-practice-summary' },
    { title: 'Kiểm tra cuối Module 3', startSceneId: 'module-3-portfolio-mastery' },
    { title: 'Tổng kết Module 3', startSceneId: 'module-3-mastery-summary' }
  ],
  'module-4': [
    { title: 'Hosting là gì?', startSceneId: 'module-4-hosting-intro' },
    { title: 'Đưa portfolio lên Vercel', startSceneId: 'module-4-vercel-benefits' },
    { title: 'Kiểm tra website sau video', startSceneId: 'module-4-after-video' },
    { title: 'Thử cập nhật một câu', startSceneId: 'module-4-vercel-preview' },
    { title: 'Practice: Phát hành portfolio', startSceneId: 'module-4-portfolio-practice' },
  ]
}

// Sections partition the existing page order; they never create or skip pages.
export function outlineSectionIndex(sections: readonly OutlineSection[], pages: readonly SceneId[], sceneId: SceneId): number {
  const pageIndex = pages.indexOf(sceneId)
  for (let index = sections.length - 1; index >= 0; index -= 1) {
    const startIndex = pages.indexOf(sections[index]!.startSceneId)
    if (startIndex >= 0 && startIndex <= pageIndex) return index
  }
  return -1
}

// Previous/Continue review walks the saved history. Pages added to the course
// after the learner passed that point are inserted only when the current page
// order leads from one visited page to the next one; other paths stay as visited.
export function reviewTrail(
  history: readonly SceneId[],
  currentSceneId: SceneId,
  nextPageOf: (sceneId: SceneId) => SceneId | undefined,
  maxInsertedPages = 12
): SceneId[] {
  const visited = new Set<SceneId>([...history, currentSceneId])
  const trail: SceneId[] = []
  history.forEach((sceneId, index) => {
    trail.push(sceneId)
    const target = history[index + 1] ?? currentSceneId
    const inserted: SceneId[] = []
    let next = nextPageOf(sceneId)
    while (next && next !== target && !visited.has(next) && inserted.length < maxInsertedPages) {
      inserted.push(next)
      next = nextPageOf(next)
    }
    if (next === target) trail.push(...inserted)
  })
  return trail
}

export function adjacentOutlinePage(pages: readonly SceneId[], sceneId: SceneId, direction: -1 | 1): SceneId | undefined {
  const index = pages.indexOf(sceneId)
  return index < 0 ? undefined : pages[index + direction]
}

// The release success page remains available after the authoritative return.
// Reading lessons through the outline must not announce an unearned result.
export function reviewableOutlinePages(pages: readonly SceneId[], progress: Pick<LearnerProgress,
  'courseRunId' | 'completedCheckpointIds' | 'practiceCompletions'>): SceneId[] {
  const releaseCompleted = progress.completedCheckpointIds.includes('m4-portfolio-release')
    && progress.practiceCompletions.some((receipt) => receipt.courseRunId === progress.courseRunId
      && receipt.practiceId === 'm4-portfolio-release' && receipt.practiceVersion === '1.0.0'
      && receipt.destination.sceneId === 'module-4-complete' && Boolean(receipt.submissionDigest))
  return pages.filter((page) => page !== 'module-4-complete' || releaseCompleted)
}
