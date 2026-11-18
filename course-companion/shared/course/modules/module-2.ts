export const moduleTwoOutlineSections = [
  'Lập kế hoạch trước khi xây',
  'PRD là gì và dùng để làm gì?',
  'Dùng coding agent để tạo, review và duyệt PRD',
  'Tham khảo thiết kế cho portfolio',
  'Đọc một implementation plan mẫu',
  'Thực hành: Lập kế hoạch cho portfolio',
  'Kiểm tra cuối Module 2',
  'Tổng kết Module 2'
] as const

export const moduleTwoDefinition = {
  id: 'module-2',
  order: 2,
  titleVi: 'Planning và PRD trước khi code với AI',
  lessons: [
    { id: 'm2-portfolio-brief', titleVi: 'Mục đích của portfolio này là gì?' }
  ],
  checkpoints: [
    { id: 'm2-portfolio-brief', courseLessonId: 'm2-portfolio-brief' },
    { id: 'm2-content-evidence-inventory', courseLessonId: 'm2-portfolio-brief' },
    { id: 'm2-visual-reference', courseLessonId: 'm2-portfolio-brief' },
    { id: 'm2-portfolio-prd', courseLessonId: 'm2-portfolio-brief' },
    { id: 'm2-implementation-contract', courseLessonId: 'm2-portfolio-brief' },
    { id: 'm2-portfolio-planning', courseLessonId: 'm2-portfolio-brief' },
    { id: 'm2-portfolio-mastery', courseLessonId: 'm2-portfolio-brief' },
    { id: 'm2-portfolio-complete', courseLessonId: 'm2-portfolio-brief' }
  ],
  scenes: [
    { id: 'module-2-portfolio-workspace', checkpointId: 'm2-portfolio-brief', courseLessonId: 'm2-portfolio-brief', nextSceneId: 'module-2-prd-definition' },
    { id: 'module-2-prd-definition', checkpointId: 'm2-portfolio-brief', courseLessonId: 'm2-portfolio-brief', nextSceneId: 'module-2-prd-review-workflow' },
    { id: 'module-2-prd-review-workflow', checkpointId: 'm2-portfolio-brief', courseLessonId: 'm2-portfolio-brief', nextSceneId: 'module-2-prd-agent-workflow' },
    { id: 'module-2-prd-agent-workflow', checkpointId: 'm2-portfolio-brief', courseLessonId: 'm2-portfolio-brief', nextSceneId: 'module-2-implementation-plan-intro' },
    { id: 'module-2-implementation-plan-intro', checkpointId: 'm2-portfolio-brief', courseLessonId: 'm2-portfolio-brief', nextSceneId: 'module-2-portfolio-folder' },
    { id: 'module-2-portfolio-folder', checkpointId: 'm2-portfolio-brief', courseLessonId: 'm2-portfolio-brief', nextSceneId: 'module-2-portfolio-practice' },
    { id: 'module-2-portfolio-practice', checkpointId: 'm2-portfolio-planning', courseLessonId: 'm2-portfolio-brief', nextSceneId: 'module-2-portfolio-mastery' },
    { id: 'module-2-portfolio-mastery', checkpointId: 'm2-portfolio-mastery', courseLessonId: 'm2-portfolio-brief', nextSceneId: 'module-2-mastery-scenario-viewer' },
    { id: 'module-2-mastery-scenario-viewer', checkpointId: 'm2-portfolio-mastery', courseLessonId: 'm2-portfolio-brief' },
    { id: 'module-2-mastery-scenario-prd', checkpointId: 'm2-portfolio-mastery', courseLessonId: 'm2-portfolio-brief' },
    { id: 'module-2-mastery-scenario-validation', checkpointId: 'm2-portfolio-mastery', courseLessonId: 'm2-portfolio-brief' },
    { id: 'module-2-mastery-scenario-first-task', checkpointId: 'm2-portfolio-mastery', courseLessonId: 'm2-portfolio-brief' },
    { id: 'module-2-portfolio-mastery-summary', checkpointId: 'm2-portfolio-mastery', courseLessonId: 'm2-portfolio-brief' },
    { id: 'module-2-portfolio-complete', checkpointId: 'm2-portfolio-complete', courseLessonId: 'm2-portfolio-brief' }
  ],
  quizGroupIds: [
    'final-assessment'
  ],
  practice: {
    id: 'm2-portfolio-planning',
    version: '2.0.0',
    evidenceProfile: 'portfolio-planning'
  },
  artifactPaths: [
    'planning/portfolio-brief.md',
    'planning/content-evidence-inventory.md',
    'planning/reference/reference.md',
    'planning/PRD.md',
    'planning/implementation-plan.md'
  ],
  completionDestination: { moduleId: 'module-3', sceneId: 'module-3-local-preview' }
} as const
