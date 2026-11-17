import { contextBridge, ipcRenderer } from 'electron'
import type {
  CompanionMode,
  AppSettings,
  AppSettingsUpdate,
  CompanionState,
  CourseCompanionApi,
  LearnerProgress,
  PracticePanelUpdate,
  PlanningPracticeActionRequest,
  PortfolioStageActionRequest,
  PortfolioPackageApprovalRequest,
  PortfolioWorkspaceRequest,
  PortfolioCodexProjectRequest,
  PortfolioWorkspaceView,
  PracticeReviewResponse,
  PracticeHintResponse,
  PracticeGuideSurfaceContext,
  PracticeGuideUpdateRequest,
  PracticeGuideView,
  PracticeStartRequest,
  PracticeWorkspaceView,
  PracticeFixtureRequest,
  PracticeIdentity,
  PracticeTaskOpenRequest,
  PracticeState,
  ProgressLoadResult,
  ProgressUpdate,
  RuntimeInfo,
  TeacherSendRequest,
  TeacherSendResult
} from '../../shared/contracts'

const courseCompanionApi: CourseCompanionApi = {
  getRuntimeInfo: () => ipcRenderer.invoke('course:get-runtime-info') as Promise<RuntimeInfo>,
  loadProgress: () =>
    ipcRenderer.invoke('course:load-progress') as Promise<ProgressLoadResult>,
  saveProgress: (update: ProgressUpdate) =>
    ipcRenderer.invoke('course:save-progress', update) as Promise<LearnerProgress>,
  completePortfolioPlanningModule: () =>
    ipcRenderer.invoke('course:complete-portfolio-planning-module') as Promise<LearnerProgress>,
  completePortfolioBuildModule: () =>
    ipcRenderer.invoke('course:complete-portfolio-build-module') as Promise<LearnerProgress>,
  resetProgress: () => ipcRenderer.invoke('course:reset-progress') as Promise<void>,
  loadCompanionState: () =>
    ipcRenderer.invoke('course:load-companion-state') as Promise<CompanionState>,
  sendTeacherMessage: (request: TeacherSendRequest) =>
    ipcRenderer.invoke('course:send-teacher-message', request) as Promise<TeacherSendResult>,
  loadPracticeState: () =>
    ipcRenderer.invoke('course:load-practice-state') as Promise<PracticeState>,
  emitPracticeFixture: (request: PracticeFixtureRequest) =>
    ipcRenderer.invoke('course:emit-practice-fixture', request) as Promise<PracticeState>,
  loadPracticeWorkspace: (identity?: PracticeIdentity) =>
    ipcRenderer.invoke('course:load-practice-workspace', identity) as Promise<PracticeWorkspaceView>,
  hasActivePractice: () =>
    ipcRenderer.invoke('course:has-active-practice') as Promise<boolean>,
  startPractice: (request: PracticeStartRequest) =>
    ipcRenderer.invoke('course:start-practice', request) as Promise<PracticeWorkspaceView>,
  resumePractice: (identity?: PracticeIdentity) =>
    ipcRenderer.invoke('course:resume-practice', identity) as Promise<PracticeWorkspaceView>,
  openPracticeTask: (request: PracticeTaskOpenRequest) =>
    ipcRenderer.invoke('course:open-practice-task', request) as Promise<void>,
  retryPracticeSwitch: () =>
    ipcRenderer.invoke('course:retry-practice-switch') as Promise<PracticeWorkspaceView>,
  cancelPracticeSwitch: () =>
    ipcRenderer.invoke('course:cancel-practice-switch') as Promise<PracticeWorkspaceView>,
  recordPlanningAction: (request: PlanningPracticeActionRequest) =>
    ipcRenderer.invoke('course:record-planning-action', request) as Promise<PracticeWorkspaceView>,
  recordPortfolioStageAction: (request: PortfolioStageActionRequest) =>
    ipcRenderer.invoke('course:record-portfolio-stage-action', request) as Promise<PracticeWorkspaceView>,
  approvePortfolioPackage: (request: PortfolioPackageApprovalRequest) =>
    ipcRenderer.invoke('course:approve-portfolio-package', request) as Promise<PracticeWorkspaceView>,
  selectPracticePanel: (update: PracticePanelUpdate) =>
    ipcRenderer.invoke('course:select-practice-panel', update) as Promise<PracticeWorkspaceView>,
  reviewPractice: () =>
    ipcRenderer.invoke('course:review-practice') as Promise<PracticeReviewResponse>,
  requestPracticeHint: (request) =>
    ipcRenderer.invoke('course:practice-hint', request) as Promise<PracticeHintResponse>,
  loadPracticeGuide: (context: PracticeGuideSurfaceContext) =>
    ipcRenderer.invoke('course:load-practice-guide', context) as Promise<PracticeGuideView | null>,
  updatePracticeGuide: (request: PracticeGuideUpdateRequest, context: PracticeGuideSurfaceContext) =>
    ipcRenderer.invoke('course:update-practice-guide', request, context) as Promise<PracticeGuideView | null>,
  returnPassedPractice: () =>
    ipcRenderer.invoke('course:return-passed-practice') as Promise<void>,
  onPracticeWorkspaceChanged: (callback: () => void) => {
    const listener = () => callback()
    ipcRenderer.on('course:practice-workspace-changed', listener)
    return () => ipcRenderer.removeListener('course:practice-workspace-changed', listener)
  },
  onPracticeReturned: (callback: () => void) => {
    const listener = () => callback()
    ipcRenderer.on('course:practice-returned', listener)
    return () => ipcRenderer.removeListener('course:practice-returned', listener)
  },
  onFullTeacherRequested: (callback: () => void) => {
    const listener = () => callback()
    ipcRenderer.on('course:full-teacher-requested', listener)
    return () => ipcRenderer.removeListener('course:full-teacher-requested', listener)
  },
  onCompanionModeChanged: (callback: (mode: CompanionMode) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, mode: CompanionMode) => callback(mode)
    ipcRenderer.on('course:companion-mode-changed', listener)
    return () => ipcRenderer.removeListener('course:companion-mode-changed', listener)
  },
  loadPortfolioWorkspace: (request: PortfolioWorkspaceRequest) =>
    ipcRenderer.invoke('course:load-portfolio-workspace', request) as Promise<PortfolioWorkspaceView>,
  choosePortfolioWorkspace: (request: PortfolioWorkspaceRequest) =>
    ipcRenderer.invoke('course:choose-portfolio-workspace', request) as Promise<PortfolioWorkspaceView>,
  confirmPortfolioPlanning: (request: PortfolioWorkspaceRequest) =>
    ipcRenderer.invoke('course:confirm-portfolio-planning', request) as Promise<PortfolioWorkspaceView>,
  ensurePortfolioCodexProject: (request: PortfolioCodexProjectRequest) =>
    ipcRenderer.invoke('course:ensure-portfolio-codex-project', request) as Promise<PortfolioWorkspaceView>,
  loadAppSettings: () =>
    ipcRenderer.invoke('course:load-app-settings') as Promise<AppSettings>,
  saveAppSettings: (update: AppSettingsUpdate) =>
    ipcRenderer.invoke('course:save-app-settings', update) as Promise<AppSettings>,
  showFullTeacher: () => ipcRenderer.invoke('course:show-full-teacher') as Promise<void>,
  setFullTeacherVisible: (visible: boolean) => ipcRenderer.invoke('course:set-full-teacher-visible', visible) as Promise<void>,
  setCompanionMode: (mode: CompanionMode) =>
    ipcRenderer.invoke('course:set-companion-mode', mode) as Promise<void>,
  quitApp: () => ipcRenderer.invoke('course:quit') as Promise<void>
}

contextBridge.exposeInMainWorld('courseCompanion', courseCompanionApi)
