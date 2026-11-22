export const moduleFourDefinition = {
  id: 'module-4',
  order: 4,
  titleVi: 'Đăng tải portfolio lên mạng',
  lessons: [
    { id: 'm4-release-validation', titleVi: 'Hosting và chuẩn bị triển khai' },
    { id: 'm4-security-publication', titleVi: 'Bảo mật và quyền truy cập' },
    { id: 'm4-preview-deployment', titleVi: 'Đưa portfolio lên Vercel và xem thử' },
    { id: 'm4-production-decision', titleVi: 'Công bố, cập nhật và khôi phục' },
    { id: 'm4-ownership-transfer', titleVi: 'Quản lý portfolio và áp dụng kỹ năng' }
  ],
  checkpoints: [
    { id: 'm4-release-validation', courseLessonId: 'm4-release-validation' },
    { id: 'm4-security-publication', courseLessonId: 'm4-security-publication' },
    { id: 'm4-preview-deployment', courseLessonId: 'm4-preview-deployment' },
    { id: 'm4-production-decision', courseLessonId: 'm4-production-decision' },
    { id: 'm4-ownership-transfer', courseLessonId: 'm4-ownership-transfer' },
    { id: 'm4-portfolio-release', courseLessonId: 'm4-ownership-transfer' },
    { id: 'm4-complete', courseLessonId: 'm4-ownership-transfer' }
  ],
  scenes: [
    { id: 'module-4-hosting-intro', checkpointId: 'm4-release-validation', courseLessonId: 'm4-release-validation', nextSceneId: 'module-4-vercel-benefits' },
    { id: 'module-4-vercel-benefits', checkpointId: 'm4-release-validation', courseLessonId: 'm4-release-validation', nextSceneId: 'module-4-after-video' },
    { id: 'module-4-after-video', checkpointId: 'm4-release-validation', courseLessonId: 'm4-release-validation', nextSceneId: 'module-4-vercel-preview' },
    { id: 'module-4-vercel-preview', checkpointId: 'm4-preview-deployment', courseLessonId: 'm4-preview-deployment', nextSceneId: 'module-4-portfolio-practice' },
    { id: 'module-4-portfolio-practice', checkpointId: 'm4-portfolio-release', courseLessonId: 'm4-ownership-transfer', nextSceneId: 'module-4-complete' },
    { id: 'module-4-complete', checkpointId: 'm4-complete', courseLessonId: 'm4-ownership-transfer' }
  ],
  quizGroupIds: [],
  practice: {
    id: 'm4-portfolio-release',
    version: '1.0.0',
    evidenceProfile: 'portfolio-release'
  },
  artifactPaths: [],
  completionDestination: null
} as const
