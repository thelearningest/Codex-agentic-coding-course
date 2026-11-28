import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

async function source(path: string): Promise<string> {
  return readFile(join(process.cwd(), path), 'utf8')
}

describe('Teacher Practice review controls', () => {
  it('keeps the macOS companion above fullscreen Codex windows', async () => {
    const main = await source('electron/main/index.ts')
    const companionStart = main.indexOf('function createCompanionWindow')
    const companionEnd = main.indexOf('function applyCompanionTopmost', companionStart)
    const companionWindow = main.slice(companionStart, companionEnd)

    expect(companionStart).toBeGreaterThan(-1)
    expect(companionEnd).toBeGreaterThan(companionStart)
    expect(companionWindow).toContain("process.platform === 'darwin' ? { type: 'panel' } : {}")
    expect(companionWindow).toContain('visibleOnFullScreen: true')
    expect(main).toContain("target.setAlwaysOnTop(true, 'screen-saver')")
  })

  it('uses one unified review implementation for windowed and full-screen Teacher', async () => {
    const [teacher, returnAction, companion, learning] = await Promise.all([
      source('src/renderer/src/components/TeacherWorkspace.tsx'),
      source('src/renderer/src/components/PracticeReturnAction.tsx'),
      source('src/renderer/src/surfaces/CompanionWindow.tsx'),
      source('src/renderer/src/surfaces/LearningWindow.tsx')
    ])

    expect(companion).toContain('<TeacherWorkspace')
    expect(learning).toContain('<TeacherWorkspace')
    expect(teacher).toContain('pixel-practice-review__primary')
    expect(teacher).toContain('pixel-review-primary')
    expect(returnAction).toContain('pixel-panel-control--return')
    expect(teacher).toContain('Cập nhật và kiểm tra tiến độ')
    expect(teacher).toContain('Đang cập nhật và kiểm tra…')
    expect(teacher).not.toContain('ĐANG CẬP NHẬT & KIỂM TRA…')
  })

  it('keeps the upper review button as the only evidence refresh in the Practice review panel', async () => {
    const teacher = await source('src/renderer/src/components/TeacherWorkspace.tsx')
    const start = teacher.indexOf('<section className="pixel-practice-review"')
    const end = teacher.indexOf(") : activeTab === 'teacher' ? (", start)
    const practiceBranch = teacher.slice(start, end)
    const reviewStart = teacher.indexOf('const reviewProgress = async')
    const reviewEnd = teacher.indexOf('const requestHint = async', reviewStart)
    const reviewHandler = teacher.slice(reviewStart, reviewEnd)

    expect(start).toBeGreaterThan(-1)
    expect(practiceBranch).toMatch(/\{workspace\?\.activePractice \? \(\s*<button\s+className=\{'pixel-review-primary'/)
    expect(practiceBranch).not.toContain('onRefresh=')
    expect(reviewHandler.indexOf('if (!workspace?.review?.canReview)')).toBeGreaterThan(-1)
    expect(reviewHandler.indexOf('if (!workspace?.review?.canReview)'))
      .toBeLessThan(reviewHandler.indexOf('window.courseCompanion.reviewPractice()'))
  })

  it('gates return on persisted review state rather than Teacher prose', async () => {
    const teacher = await source('src/renderer/src/components/TeacherWorkspace.tsx')

    expect(teacher).toContain('workspace?.review?.canReturn')
    expect(teacher).toContain('window.courseCompanion.reviewPractice()')
    expect(teacher).toContain('window.courseCompanion.returnPassedPractice()')
    expect(teacher).not.toMatch(/message\.content.*passed/i)
  })

  it('provides accessible labels, busy state, and reduced-motion styling', async () => {
    const [teacher, returnAction, styles] = await Promise.all([
      source('src/renderer/src/components/TeacherWorkspace.tsx'),
      source('src/renderer/src/components/PracticeReturnAction.tsx'),
      source('src/renderer/src/styles.css')
    ])

    expect(teacher).toContain("aria-label={setupPractice ? 'Nộp bài' : 'Cập nhật và kiểm tra tiến độ Practice'}")
    expect(returnAction).toContain("quick ? 'Quay lại khóa học nhanh'")
    expect(teacher).toContain('onReturn={() => void returnToCourse()}')
    expect(teacher).toContain('returnBusy={returnBusy}')
    expect(teacher).toContain('aria-busy={reviewBusy}')
    expect(teacher).toContain('reviewBusy ? <span className="pixel-review-spinner" aria-hidden="true" /> : null')
    expect(styles).toContain('.pixel-review-primary .pixel-review-spinner')
    expect(styles).toContain('border-radius: 50%')
    expect(styles).toMatch(/\.practice-review-overview[^{]*\{[^}]*font-family:\s*var\(--app-font\)/s)
    expect(styles).toMatch(/\.pixel-control-spinner[^{]*\{[^}]*border-radius:\s*50%/s)
    expect(styles).toContain('animation: pixel-review-spin .7s linear infinite')
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('synchronizes persisted review changes across full and windowed Teacher surfaces', async () => {
    const [teacher, preload, main] = await Promise.all([
      source('src/renderer/src/components/TeacherWorkspace.tsx'),
      source('electron/preload/index.ts'),
      source('electron/main/index.ts')
    ])

    expect(preload).toContain("ipcRenderer.on('course:practice-workspace-changed'")
    expect(main).toContain("target.webContents.send('course:practice-workspace-changed')")
    expect(main).toContain('broadcastPracticeWorkspaceChanged()')
    expect(teacher).toContain('onPracticeWorkspaceChanged(() =>')
    expect(teacher).toContain('loadPracticeWorkspace()')
  })

  it('removes every direct chat control from the authoritative active-Practice branch', async () => {
    const [teacher, companion] = await Promise.all([
      source('src/renderer/src/components/TeacherWorkspace.tsx'),
      source('src/renderer/src/surfaces/CompanionWindow.tsx')
    ])
    const start = teacher.indexOf('<section className="pixel-practice-review"')
    const end = teacher.indexOf(") : activeTab === 'teacher' ? (", start)
    const practiceBranch = teacher.slice(start, end)

    expect(start).toBeGreaterThan(-1)
    expect(end).toBeGreaterThan(start)
    expect(practiceBranch).not.toContain('pixel-chat-log')
    expect(practiceBranch).not.toContain('pixel-chat-composer')
    expect(practiceBranch).not.toContain('sendMessage')
    expect(practiceBranch).not.toContain('Thử lại')
    expect(teacher).toContain("const practiceMode = Boolean(workspace?.activePractice)")
    expect(companion).toContain('Trò chuyện với Triết')
    expect(companion).not.toContain('DUYỆT PRACTICE')
    expect(companion).not.toContain('loadPracticeWorkspace()')
  })

  it('keeps the launcher independent of Practice polling and preserves the read-only presence API', async () => {
    const [companion, preload, main] = await Promise.all([
      source('src/renderer/src/surfaces/CompanionWindow.tsx'),
      source('electron/preload/index.ts'),
      source('electron/main/index.ts')
    ])

    expect(companion).not.toContain('hasActivePractice()')
    expect(companion).not.toContain('setInterval')
    expect(companion).not.toContain('loadPracticeWorkspace')
    expect(preload).toContain("ipcRenderer.invoke('course:has-active-practice')")
    expect(main).toContain("ipcMain.handle('course:has-active-practice'")
    const handlerStart = main.indexOf("ipcMain.handle('course:has-active-practice'")
    const handlerEnd = main.indexOf("ipcMain.handle('course:start-practice'", handlerStart)
    const presenceHandler = main.slice(handlerStart, handlerEnd)
    expect(presenceHandler).toContain('practiceRunRepository.load()')
    expect(presenceHandler).not.toContain('practiceCoordinator.loadWorkspace')
    expect(presenceHandler).not.toContain('.bind(')
  })

  it('uses a dedicated read-only snapshot boundary for real Practice observation', async () => {
    const [main, snapshot] = await Promise.all([
      source('electron/main/index.ts'),
      source('electron/main/executor-activity-snapshot-reader.ts')
    ])

    expect(main).toContain("if (method !== 'thread/read' && method !== 'model/list') throw new Error('Practice snapshot transport is read-only')")
    expect(main).toContain('return await activitySnapshotReader.read(binding, options)')
    expect(main).toContain('await practiceSnapshotLifecycle.release()')
    expect(main).toContain('const practiceEvidenceActivity = useTestCodexGateway ? activityObserver : persistedPracticeActivity')
    expect(main).toContain('(binding, captureBaseline) => captureBaseline && !useTestCodexGateway')
    expect(main).toContain('activitySnapshotReader.captureBaseline(binding)')
    expect(main).toContain('practiceReviewActivity.read(binding, { captureBaseline })')
    const reviewHandlerStart = main.indexOf("ipcMain.handle('course:review-practice'")
    const reviewHandlerEnd = main.indexOf("ipcMain.handle('course:return-passed-practice'", reviewHandlerStart)
    const reviewHandler = main.slice(reviewHandlerStart, reviewHandlerEnd)
    expect(reviewHandler).not.toContain('ensureAppServer')
    expect(reviewHandler).not.toContain('activityObserver.bind')
    expect(snapshot).toContain("this.client.request('thread/read'")
    expect(snapshot).not.toContain("'thread/resume'")
    expect(snapshot).not.toContain("'thread/start'")
    expect(main).toContain('CodexTaskMetadataReader')
  })

  it('keeps chat navigation hidden while Practice authority is loading or unavailable', async () => {
    const teacher = await source('src/renderer/src/components/TeacherWorkspace.tsx')

    expect(teacher).toContain('workspaceLoaded && !workspaceUnavailable && !practiceMode ? <div className={`pixel-fixture-notice')
    expect(teacher).not.toContain('className="pixel-companion-tabs"')
  })

  it('renders structured review criteria and one persisted next action', async () => {
    const progress = await source('src/renderer/src/components/PracticeProgress.tsx')
    expect(progress).toContain('reviewResult.criteria.map')
    expect(progress).toContain('Kết quả theo từng tiêu chí')
    expect(progress).toContain('practice-review-next-action')
    expect(progress).toContain('workspace.review?.canReturn')
  })

  it('renders every compact step as a collapsed single-open accordion', async () => {
    const [progress, styles] = await Promise.all([
      source('src/renderer/src/components/PracticeProgress.tsx'),
      source('src/renderer/src/styles.css')
    ])
    expect(progress).toContain('workspace.checklist.map')
    expect(progress).toContain('aria-expanded={expanded}')
    expect(progress).toContain('setExpandedCompactStepId(expanded ? null : step.id)')
    expect(progress).toContain('compactGuidance(step)')
    expect(progress).toContain('practice-compact-step-disclosure')
    expect(progress).not.toContain('practice-compact-step-chevron')
    expect(progress).not.toContain('>⌄</span>')
    expect(styles).toContain('.practice-compact-checklist')
    expect(styles).toContain('button[aria-expanded="true"]')
    expect(styles).toContain('.practice-compact-step-disclosure::before')
    expect(styles).toContain('.practice-compact-step-disclosure::after')
    expect(styles).toContain('width: 36px')
    expect(styles).toContain('height: 36px')
    expect(styles).toContain('button[aria-expanded="true"] .practice-compact-step-disclosure::after')
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('renders Module 2 evidence and uses explicit actions instead of chat inference', async () => {
    const [teacher, progress, styles] = await Promise.all([
      source('src/renderer/src/components/TeacherWorkspace.tsx'),
      source('src/renderer/src/components/PracticeProgress.tsx'),
      source('src/renderer/src/styles.css')
    ])

    expect(progress).toContain('planning.artifacts.map')
    expect(progress).toContain('planning.invalidations.map')
    expect(progress).toContain('planning.unexpectedChangedPaths')
    expect(progress).toContain('Ghi nhận prompt của tôi')
    expect(progress).toContain('Duyệt và lưu PRD')
    expect(progress).toContain('Xác nhận bốn điểm alignment')
    expect(progress).toContain('Ghi nhận quyết định phạm vi')
    expect(progress).toContain('workspace.completionDestination')
    expect(teacher).toContain('window.courseCompanion.recordPlanningAction')
    expect(teacher).toContain('workspace?.planning?.invalidations[0]')
    expect(teacher).not.toMatch(/message\.content.*recordPlanningAction/)
    expect(styles).toContain('.practice-progress.is-compact .practice-artifacts')
    expect(styles).toContain('.practice-planning button:focus-visible')
  })
})
