export const moduleThreeDefinition = {
  id: 'module-3',
  order: 3,
  titleVi: 'Bắt đầu tạo portfolio',
  lessons: [
    { id: 'm3-complete-first-version', titleVi: 'Debug cùng coding agent' },
    { id: 'm3-whole-page-revision', titleVi: 'Git và GitHub' },
    { id: 'm3-evidence-debugging', titleVi: 'Practice: Xây portfolio' },
    { id: 'm3-independent-enhancement', titleVi: 'Tổng kết Module 3' }
  ],
  checkpoints: [
    { id: 'm3-scaffold-baseline', courseLessonId: 'm3-complete-first-version' },
    { id: 'm3-complete-first-version', courseLessonId: 'm3-complete-first-version' },
    { id: 'm3-whole-page-revision', courseLessonId: 'm3-whole-page-revision' },
    { id: 'm3-evidence-debugging', courseLessonId: 'm3-evidence-debugging' },
    { id: 'm3-portfolio-build', courseLessonId: 'm3-evidence-debugging' },
    { id: 'm3-independent-enhancement', courseLessonId: 'm3-independent-enhancement' },
    { id: 'm3-mastery', courseLessonId: 'm3-independent-enhancement' },
    { id: 'm3-complete', courseLessonId: 'm3-independent-enhancement' }
  ],
  scenes: [
    { id: 'module-3-first-build', checkpointId: 'm3-complete-first-version', courseLessonId: 'm3-complete-first-version', nextSceneId: 'module-3-local-preview' },
    { id: 'module-3-local-preview', checkpointId: 'm3-complete-first-version', courseLessonId: 'm3-complete-first-version', nextSceneId: 'module-3-debugging-intro' },
    { id: 'module-3-debugging-intro', checkpointId: 'm3-complete-first-version', courseLessonId: 'm3-complete-first-version', nextSceneId: 'module-3-visible-error' },
    { id: 'module-3-visible-error', checkpointId: 'm3-complete-first-version', courseLessonId: 'm3-complete-first-version', nextSceneId: 'module-3-visible-error-prompt' },
    { id: 'module-3-visible-error-prompt', checkpointId: 'm3-complete-first-version', courseLessonId: 'm3-complete-first-version', nextSceneId: 'module-3-terminal-logs' },
    { id: 'module-3-terminal-logs', checkpointId: 'm3-complete-first-version', courseLessonId: 'm3-complete-first-version', nextSceneId: 'module-3-repeated-error' },
    { id: 'module-3-repeated-error', checkpointId: 'm3-complete-first-version', courseLessonId: 'm3-complete-first-version', nextSceneId: 'module-3-git-intro' },
    { id: 'module-3-git-intro', checkpointId: 'm3-whole-page-revision', courseLessonId: 'm3-whole-page-revision', nextSceneId: 'module-3-git-github' },
    { id: 'module-3-git-github', checkpointId: 'm3-whole-page-revision', courseLessonId: 'm3-whole-page-revision', nextSceneId: 'module-3-git-commit' },
    { id: 'module-3-git-commit', checkpointId: 'm3-whole-page-revision', courseLessonId: 'm3-whole-page-revision', nextSceneId: 'module-3-git-push' },
    { id: 'module-3-git-push', checkpointId: 'm3-whole-page-revision', courseLessonId: 'm3-whole-page-revision', nextSceneId: 'module-3-git-branch' },
    { id: 'module-3-git-branch', checkpointId: 'm3-whole-page-revision', courseLessonId: 'm3-whole-page-revision', nextSceneId: 'module-3-git-merge' },
    { id: 'module-3-git-merge', checkpointId: 'm3-whole-page-revision', courseLessonId: 'm3-whole-page-revision', nextSceneId: 'module-3-pre-practice-summary' },
    { id: 'module-3-pre-practice-summary', checkpointId: 'm3-portfolio-build', courseLessonId: 'm3-evidence-debugging', nextSceneId: 'module-3-portfolio-mastery' },
    { id: 'module-3-portfolio-mastery', checkpointId: 'm3-mastery', courseLessonId: 'm3-independent-enhancement', nextSceneId: 'module-3-mastery-plan' },
    { id: 'module-3-mastery-plan', checkpointId: 'm3-mastery', courseLessonId: 'm3-independent-enhancement' },
    { id: 'module-3-mastery-visible-error', checkpointId: 'm3-mastery', courseLessonId: 'm3-independent-enhancement' },
    { id: 'module-3-mastery-logs', checkpointId: 'm3-mastery', courseLessonId: 'm3-independent-enhancement' },
    { id: 'module-3-mastery-repeated-error', checkpointId: 'm3-mastery', courseLessonId: 'm3-independent-enhancement' },
    { id: 'module-3-mastery-branch', checkpointId: 'm3-mastery', courseLessonId: 'm3-independent-enhancement' },
    { id: 'module-3-mastery-summary', checkpointId: 'm3-mastery', courseLessonId: 'm3-independent-enhancement' },
    { id: 'module-3-complete', checkpointId: 'm3-complete', courseLessonId: 'm3-independent-enhancement' }
  ],
  quizGroupIds: ['m3-final-assessment'],
  practice: {
    id: 'm3-portfolio-build',
    version: '2.1.0',
    evidenceProfile: 'portfolio-build'
  },
  artifactPaths: [
    'evidence/module-3/build-log.md',
    'evidence/module-3/learning-record.md',
    'evidence/module-3/browser-validation.md'
  ],
  completionDestination: { moduleId: 'module-4', sceneId: 'module-4-hosting-intro' }
} as const
