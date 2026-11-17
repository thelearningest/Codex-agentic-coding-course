import { PracticeVideoRepository } from './practice-video-repository'
import { PortfolioCodexProjectService } from './portfolio-codex-project-service'
import { CodexDesktopProjectRegistry } from './codex-desktop-project-registry'
import { practiceVideoPracticeId, type PracticeVideoUpdate } from '../../shared/practice-video'
import { app, BrowserWindow, dialog, ipcMain, screen, shell } from 'electron'
import { existsSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type {
  CompanionMode,
  AppSettingsUpdate,
  PracticeFixtureRequest,
  PracticeGuideContext,
  PracticeGuideSurfaceContext,
  PracticeGuideUpdateRequest,
  PracticeReviewResponse,
  PracticeWorkspaceView,
  PracticePanelUpdate,
  PlanningPracticeActionRequest,
  PortfolioStageActionRequest,
  PortfolioPackageApprovalRequest,
  PortfolioWorkspaceRequest,
  PortfolioWorkspaceView,
  PracticeStartRequest,
  ProgressUpdate,
  RuntimeInfo,
  TeacherSendRequest
} from '../../shared/contracts'
import { isProgressUpdate, ProgressRepository } from './progress-repository'
import { CodexAppServerClient } from './codex-app-server-client'
import { resolveCodexRuntimeCommand } from './codex-runtime'
import { AppServerLifecycle } from './app-server-lifecycle'
import { ExecutorActivityObserver } from './executor-activity-observer'
import { ExecutorActivityRepository } from './executor-activity-repository'
import { ExecutorActivitySnapshotReader } from './executor-activity-snapshot-reader'
import { CodexTaskMetadataReader } from './codex-task-metadata-reader'
import { ExecutorChatCoordinator } from './executor-chat-coordinator'
import { PracticeCoordinator } from './practice-coordinator'
import { PracticeRunRepository, selectPortfolioPackageMigrationRecovery } from './practice-run-repository'
import { PracticeDefinitionRepository } from './practice-definition-repository'
import { PracticeGuideDefinitionRepository } from './practice-guide-definition-repository'
import { PracticeGuideStateRepository } from './practice-guide-state-repository'
import { PracticeGuideCoordinator } from './practice-guide-coordinator'
import { PracticeWorkspaceResolver } from './practice-workspace-resolver'
import {
  DeterministicPracticeReviewEvaluator,
  LivePracticeReviewEvaluator
} from './practice-review-evaluator'
import { PracticeReviewService } from './practice-review-service'
import { PracticeHintService } from './practice-hint-service'
import { FixturePracticeAdapter, isPracticeFixtureRequest } from './practice-fixture'
import {
  isAppSettingsUpdate,
  isTeacherSendRequest,
  TeacherChatRepository
} from './teacher-fixture'
import { RealTeacherAdapter } from './real-teacher-adapter'
import { TeacherMemoryRepository } from './teacher-memory-repository'
import { TeacherService } from './teacher-service'
import { TeacherCourseContextRepository } from './teacher-course-context-repository'
import { getCompanionBounds } from './window-layout'
import { TestCodexGateway } from './test-codex-gateway'
import { PracticeEvidenceAdapterRegistry } from './practice-evidence-adapter-registry'
import { CodexConfigurationEvidenceAdapter } from './codex-configuration-evidence-adapter'
import { PlanningPackageEvidenceAdapter } from './planning-package-evidence-adapter'
import { PortfolioPlanningEvidenceAdapter } from './portfolio-planning-evidence-adapter'
import { PortfolioBuildEvidenceAdapter } from './portfolio-build-evidence-adapter'
import { PortfolioReleaseEvidenceAdapter } from './portfolio-release-evidence-adapter'
import { portfolioPlanningHandoffIsCurrent } from './portfolio-planning-handoff-validation'
import { PortfolioModuleCompletionService } from './portfolio-module-completion-service'
import {
  PortfolioWorkspaceError,
  PortfolioWorkspaceRepository
} from './portfolio-workspace-repository'

if (process.env.COURSE_COMPANION_USER_DATA_DIR) {
  app.setPath('userData', process.env.COURSE_COMPANION_USER_DATA_DIR)
}

let mainWindow: BrowserWindow | null = null
let companionWindow: BrowserWindow | null = null
let practiceHintPending = false
let practiceReviewRequests = 0

function broadcastPracticeWorkspaceChanged(): void {
  for (const target of [mainWindow, companionWindow]) {
    if (target && !target.isDestroyed()) {
      target.webContents.send('course:practice-workspace-changed')
    }
  }
}
let isQuitting = false
let companionMode: CompanionMode = 'compact'
let fullTeacherVisible = false
let companionAnchor: { right: number; bottom: number } | undefined
let pendingPracticeReturn: Promise<void> | null = null

function practiceDefinitionsDirectory(): string {
  const override = process.env.COURSE_COMPANION_PRACTICE_DEFINITIONS_DIR
  if (override) return resolve(override)
  const candidates = [
    join(app.getAppPath(), 'content', 'practices'),
    join(process.resourcesPath, 'content', 'practices'),
    resolve(app.getAppPath(), '..', '..', 'content', 'practices')
  ]
  return candidates.find((candidate) => existsSync(candidate)) ??
    join(app.getAppPath(), 'content', 'practices')
}

function pilotPracticeDefinitionsDirectory(): string {
  const candidates = [
    resolve(app.getAppPath(), '..', 'pilot-workspace', 'course', 'practices'),
    resolve(app.getAppPath(), '..', '..', 'pilot-workspace', 'course', 'practices'),
    resolve(app.getAppPath(), '..', '..', '..', 'pilot-workspace', 'course', 'practices')
  ]
  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0]!
}


function practiceGuidesDirectory(): string {
  const override = process.env.COURSE_COMPANION_PRACTICE_GUIDES_DIR
  if (override) return resolve(override)
  const candidates = [
    join(app.getAppPath(), 'content', 'practice-guides'),
    join(process.resourcesPath, 'content', 'practice-guides'),
    resolve(app.getAppPath(), '..', '..', 'content', 'practice-guides')
  ]
  return candidates.find((candidate) => existsSync(candidate)) ??
    join(app.getAppPath(), 'content', 'practice-guides')
}
const practiceDefinitionRepository = new PracticeDefinitionRepository(
  practiceDefinitionsDirectory(),
  pilotPracticeDefinitionsDirectory()
)
let companionAlwaysOnTop = true
const practiceVideoRepository = new PracticeVideoRepository(app.getPath('userData'))
const progressRepository = new ProgressRepository(app.getPath('userData'))
const courseRoot = process.env.COURSE_COMPANION_WORKSPACE_ROOT || resolve(app.getAppPath(), '..')
const practiceGuideDefinitionRepository = new PracticeGuideDefinitionRepository(practiceGuidesDirectory())
const practiceGuideStateRepository = new PracticeGuideStateRepository(app.getPath('userData'))
const practiceGuideCoordinator = new PracticeGuideCoordinator(
  practiceGuideDefinitionRepository, practiceGuideStateRepository
)
const portfolioWorkspaceRepository = new PortfolioWorkspaceRepository(
  app.getPath('userData'),
  courseRoot
)
const practiceAdapter = new FixturePracticeAdapter(progressRepository)
const teacherRepository = new TeacherChatRepository(app.getPath('userData'))

const practiceRunRepository = new PracticeRunRepository(app.getPath('userData'))
const practiceWorkspaceResolver = new PracticeWorkspaceResolver(courseRoot, async () => {
  const progress = await progressRepository.load()
  if (progress.status !== 'returning' && progress.status !== 'recovered') return null
  const workspace = await portfolioWorkspaceRepository.load({
    courseRunId: progress.progress.courseRunId
  })
  return workspace.status === 'ready' ? workspace.selectedPath ?? null : null
}, async (expectedRoot) => {
  const loaded = await progressRepository.load()
  if (loaded.status !== 'returning' && loaded.status !== 'recovered') throw new Error('Course progress unavailable')
  const workspace = await portfolioWorkspaceRepository.load({ courseRunId: loaded.progress.courseRunId })
  if (workspace.status !== 'ready' || workspace.selectedPath !== expectedRoot) throw new Error('Portfolio workspace unavailable')
  const ready = await ensurePortfolioCodexProject({ courseRunId: workspace.courseRunId, expectedPath: workspace.selectedPath })
  if (!ready.codexProject || ready.codexProjectError) throw new Error('Portfolio Codex project unavailable')
  return ready.codexProject.id
})
const useTestCodexGateway = !app.isPackaged && process.env.COURSE_COMPANION_FAKE_CODEX === '1'
const presentTestTeacherAsLive = useTestCodexGateway && process.env.COURSE_COMPANION_FAKE_TEACHER_LIVE_MODE === '1'
const appServerClient = new CodexAppServerClient()
const appServerLifecycle = new AppServerLifecycle(
  () => appServerClient.start(),
  () => appServerClient.stop()
)
const practiceSnapshotClient = new CodexAppServerClient()
const practiceSnapshotLifecycle = new AppServerLifecycle(
  () => practiceSnapshotClient.start(),
  () => practiceSnapshotClient.stop()
)
const executorBootstrapClient = new CodexAppServerClient({ experimentalApi: true })
const portfolioProjectClient = new CodexAppServerClient({ experimentalApi: true })
let portfolioProjectClientStarted = false
let executorBootstrapStart: Promise<void> | null = null

async function ensureAppServer(): Promise<void> {
  await appServerLifecycle.ensure()
}

async function releaseAppServer(): Promise<void> {
  if (useTestCodexGateway) return
  await appServerLifecycle.release()
}

async function ensureExecutorBootstrap(): Promise<void> {
  if (!executorBootstrapStart) {
    executorBootstrapStart = executorBootstrapClient.start().catch((error: unknown) => {
      executorBootstrapStart = null
      throw error
    })
  }
  await executorBootstrapStart
}

async function closeExecutorBootstrap(): Promise<void> {
  const starting = executorBootstrapStart
  executorBootstrapStart = null
  if (starting) await starting.catch(() => undefined)
  await executorBootstrapClient.stop()
}

const appServerGateway = useTestCodexGateway
  ? new TestCodexGateway(courseRoot)
  : {
      async request(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
        await ensureAppServer()
        return appServerClient.request(method, params)
      },
      onNotification(listener: Parameters<CodexAppServerClient['onNotification']>[0]) {
        return appServerClient.onNotification(listener)
      },
      onConnectionState(listener: Parameters<CodexAppServerClient['onConnectionState']>[0]) {
        return appServerClient.onConnectionState(listener)
      }
    }
const executorBootstrapGateway = useTestCodexGateway
  ? {
      request(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
        return appServerGateway.request(method, params)
      },
      async close(): Promise<void> {}
    }
  : {
      async request(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
        await ensureExecutorBootstrap()
        return executorBootstrapClient.request(method, params)
      },
      close: closeExecutorBootstrap
    }
const codexDataDirectory = process.env.CODEX_HOME?.trim()
  ? resolve(process.env.CODEX_HOME)
  : join(app.getPath('home'), '.codex')
const portfolioCodexProjects = new PortfolioCodexProjectService(useTestCodexGateway
  ? { request: (method, params) => appServerGateway.request(method, params) }
  : {
      async request(method, params) {
        if (!portfolioProjectClientStarted) {
          await portfolioProjectClient.start()
          portfolioProjectClientStarted = true
        }
        return portfolioProjectClient.request(method, params)
      },
      async close() {
        portfolioProjectClientStarted = false
        await portfolioProjectClient.stop()
      }
    }, useTestCodexGateway ? {
      find: (root) => (appServerGateway as TestCodexGateway).findDesktopProject(root),
      open: (root) => (appServerGateway as TestCodexGateway).openDesktopProject(root)
    } : new CodexDesktopProjectRegistry(codexDataDirectory, async (url) => {
      await resolveCodexRuntimeCommand()
      await shell.openExternal(url)
    }))

async function ensurePortfolioCodexProject(request: { courseRunId: string; expectedPath: string }): Promise<PortfolioWorkspaceView> {
  const workspace = await portfolioWorkspaceRepository.load({ courseRunId: request.courseRunId })
  if (workspace.status !== 'ready' || workspace.selectedPath !== request.expectedPath) return workspace
  try {
    const project = await portfolioCodexProjects.ensure(request.expectedPath)
    return await portfolioWorkspaceRepository.saveCodexProject(request, project)
  } catch {
    return { ...workspace, codexProjectError: 'Chưa thêm được portfolio vào Codex. Hãy mở hoặc cập nhật Codex rồi thử lại.' }
  }
}
const openExecutorChat = useTestCodexGateway
  ? async (): Promise<void> => undefined
  : async (url: string): Promise<void> => {
      await resolveCodexRuntimeCommand()
      await shell.openExternal(url)
    }
const executorChatCoordinator = new ExecutorChatCoordinator(
  executorBootstrapGateway,
  practiceWorkspaceResolver,
  openExecutorChat
)
const activityRepository = new ExecutorActivityRepository(app.getPath('userData'))
const activityObserver = new ExecutorActivityObserver(appServerGateway, activityRepository)
const persistedPracticeActivity = {
  async current() {
    const activeRun = (await practiceRunRepository.load()).activeRun
    return activeRun ? activityRepository.load(activeRun.runId) : null
  }
}
const taskMetadataReader = new CodexTaskMetadataReader(
  join(codexDataDirectory, 'state_5.sqlite'),
  join(codexDataDirectory, 'sessions')
)
const activitySnapshotReader = new ExecutorActivitySnapshotReader(
  {
    async request(method, params) {
      if (method !== 'thread/read') throw new Error('Practice snapshot transport is read-only')
      await practiceSnapshotLifecycle.ensure()
      return practiceSnapshotClient.request(method, params)
    }
  },
  activityRepository,
  taskMetadataReader
)
const practiceReviewActivity = useTestCodexGateway
  ? {
      read: (
        binding: Parameters<ExecutorActivityObserver['bind']>[0],
        options?: Parameters<ExecutorActivityObserver['bind']>[1]
      ) => activityObserver.bind(binding, options)
    }
  : {
      async read(
        binding: Parameters<ExecutorActivitySnapshotReader['read']>[0],
        options?: Parameters<ExecutorActivitySnapshotReader['read']>[1]
      ) {
        try {
          return await activitySnapshotReader.read(binding, options)
        } finally {
          await practiceSnapshotLifecycle.release()
        }
      }
    }
const practiceEvidenceActivity = useTestCodexGateway ? activityObserver : persistedPracticeActivity
const portfolioPlanningEvidenceAdapter = new PortfolioPlanningEvidenceAdapter(practiceEvidenceActivity)
const portfolioBuildEvidenceAdapter = new PortfolioBuildEvidenceAdapter(practiceEvidenceActivity)
async function loadPortfolioReleaseContinuation() {
  const loaded = await progressRepository.load()
  if (loaded.status !== 'returning' && loaded.status !== 'recovered') return null
  const receipt = [...loaded.progress.practiceCompletions].reverse().find((item) =>
    item.courseRunId === loaded.progress.courseRunId && item.practiceId === 'm3-portfolio-build'
    && item.practiceVersion === '2.0.0' && item.checkpointId === 'm3-complete'
    && item.portfolioBuildHandoff?.schemaVersion === 2)
  const handoff = receipt?.portfolioBuildHandoff
  if (!receipt || handoff?.schemaVersion !== 2) return null
  const workspace = await portfolioWorkspaceRepository.load({ courseRunId: loaded.progress.courseRunId })
  if (workspace.status !== 'ready' || !workspace.selectedPath
    || resolve(workspace.selectedPath) !== resolve(handoff.workspace.canonicalPath)) return null
  const record = await practiceRunRepository.load()
  const source = [record.activeRun, ...record.archivedRuns.map((archive) => archive.retainedRun)].find((run) =>
    run?.runId === receipt.runId && run.generation === handoff.approval.generation
    && run.practiceId === 'm3-portfolio-build' && run.practiceVersion === '2.0.0')
  if (!source || source.reviewStatus !== 'passed' || source.completion?.submissionDigest !== handoff.submissionDigest
    || source.binding.threadId !== handoff.approval.threadId || handoff.approval.courseRunId !== loaded.progress.courseRunId
    || resolve(source.binding.workspaceRoot) !== resolve(handoff.workspace.canonicalPath)) return null
  return { task: source.binding, workspace: handoff.workspace, sourceCheckpoint: handoff.sourceCheckpoint }
}
const simulatedReleaseUrl = useTestCodexGateway ? process.env.COURSE_COMPANION_TEST_PUBLIC_PORTFOLIO_URL : undefined
const portfolioReleaseEvidenceAdapter = new PortfolioReleaseEvidenceAdapter(loadPortfolioReleaseContinuation,
  simulatedReleaseUrl ? { async verify(url) {
    const matched = url === simulatedReleaseUrl
    return { url, finalUrl: matched ? url : null, reachable: matched, status: matched ? 200 : null,
      checkedAt: new Date().toISOString(), textExcerpt: 'Disposable simulated public portfolio observation; not live provider evidence.',
      ...(matched ? {} : { error: 'Simulated URL mismatch' }) }
  } } : undefined)
const evidenceAdapters = new PracticeEvidenceAdapterRegistry([
  new CodexConfigurationEvidenceAdapter(practiceEvidenceActivity),
  new PlanningPackageEvidenceAdapter(practiceEvidenceActivity),
  portfolioPlanningEvidenceAdapter,
  portfolioBuildEvidenceAdapter,
  portfolioReleaseEvidenceAdapter
])
const practiceCoordinator = new PracticeCoordinator(
  practiceRunRepository,
  practiceDefinitionRepository,
  executorChatCoordinator,
  undefined,
  undefined,
  (binding, captureBaseline) => captureBaseline && !useTestCodexGateway
    ? activitySnapshotReader.captureBaseline(binding).then(() => undefined)
    : practiceReviewActivity.read(binding, { captureBaseline }).then(() => undefined),
  async () => {
    const result = await progressRepository.load()
    if (result.status !== 'returning' && result.status !== 'recovered') return null
    const receipt = [...result.progress.practiceCompletions].reverse().find((item) =>
      item.practiceId === 'm1-codex-safe-setup' && item.approvedConfiguration)
    return receipt?.approvedConfiguration ?? null
  },
  evidenceAdapters,
  (receipt) => progressRepository.revokePracticeCompletion(receipt),
  (openTarget) => useTestCodexGateway ? openTarget() : appServerLifecycle.handoff(openTarget),
  async () => {
    const loaded = await progressRepository.load()
    if (loaded.status !== 'returning' && loaded.status !== 'recovered') return null
    const receipt = [...loaded.progress.practiceCompletions].reverse().find((item) =>
      item.courseRunId === loaded.progress.courseRunId && item.checkpointId === 'm2-portfolio-complete'
      && item.practiceVersion === '2.0.0' && item.portfolioPlanningHandoff?.schemaVersion === 2)
    const handoff = receipt?.portfolioPlanningHandoff
    if (handoff?.schemaVersion !== 2) return null
    const definition = await practiceDefinitionRepository.load('m2-portfolio-planning', '2.0.0')
    const runRecord = await practiceRunRepository.load()
    const source = [runRecord.activeRun, ...runRecord.archivedRuns.map((item) => item.retainedRun)].find((run) =>
      run?.runId === handoff.submission.runId && run.generation === handoff.submission.generation)
    if (!source) return null
    const evidence = await portfolioPlanningEvidenceAdapter.collect({ definition, runId: source.runId, generation: source.generation,
      workspaceRoot: handoff.workspace.canonicalPath, task: handoff.task, allowedLegacyArtifactPaths: source.allowedLegacyArtifactPaths })
    return portfolioPlanningHandoffIsCurrent(handoff, evidence) ? handoff : null
  },
  async () => {
    const loaded = await progressRepository.load()
    if (loaded.status !== 'returning' && loaded.status !== 'recovered') return null
    const workspace = await portfolioWorkspaceRepository.load({ courseRunId: loaded.progress.courseRunId })
    if (workspace.status !== 'ready' || !workspace.selectedPath) return null
    return selectPortfolioPackageMigrationRecovery({
      courseRunId: loaded.progress.courseRunId,
      selectedWorkspaceRoot: workspace.selectedPath,
      record: await practiceRunRepository.load(),
      completions: loaded.progress.practiceCompletions
    })
  },
  loadPortfolioReleaseContinuation
)
const portfolioModuleCompletionService = new PortfolioModuleCompletionService(
  progressRepository,
  portfolioWorkspaceRepository,
  practiceRunRepository,
  practiceDefinitionRepository,
  portfolioPlanningEvidenceAdapter,
  undefined,
  portfolioBuildEvidenceAdapter
)
const memoryRepository = new TeacherMemoryRepository(app.getPath('userData'))
const teacherCourseContextRepository = new TeacherCourseContextRepository(
  resolve(pilotPracticeDefinitionsDirectory(), '..', '..')
)
const teacherRuntimeDirectory = join(app.getPath('userData'), 'teacher-runtime')
mkdirSync(teacherRuntimeDirectory, { recursive: true })
const realTeacherAdapter = new RealTeacherAdapter(appServerGateway, teacherRuntimeDirectory)
const realTeacherSummaryAdapter = new RealTeacherAdapter(appServerGateway, teacherRuntimeDirectory)
const realTeacherReviewAdapter = new RealTeacherAdapter(appServerGateway, teacherRuntimeDirectory)
const realTeacherHintAdapter = new RealTeacherAdapter(appServerGateway, teacherRuntimeDirectory)
const practiceHintService = new PracticeHintService(
  practiceDefinitionRepository, practiceRunRepository, practiceReviewActivity, evidenceAdapters,
  {
    async respond(input, policy) {
      if (useTestCodexGateway) {
        const { level } = JSON.parse(input) as { level: number }
        return level === 1
          ? 'Gợi ý mô phỏng: Mình cùng xem từng bước nhé. Bạn chọn một mục mình còn chưa chắc rồi đối chiếu với yêu cầu của mục đó trong task Codex.'
          : level === 2
            ? 'Gợi ý mô phỏng: Mình khuyên bạn nhìn vào một điểm khác nhau giữa kết quả hiện tại và yêu cầu, để dễ tìm chỗ cần chỉnh. Bạn muốn làm rõ điểm nào trong task Codex?'
            : 'Gợi ý mô phỏng: Mình gợi ý cách diễn đạt này để bạn nói rõ chỗ còn vướng: “Tôi đang ở bước […], tôi thấy […], nhưng chưa hiểu […].” Bạn thử điền bằng tình huống của bạn trong task Codex nhé.'
      }
      // Each frozen hint has an isolated Teacher context, even after a run switch.
      await realTeacherHintAdapter.resetTransport(true)
      return realTeacherHintAdapter.respond(input, policy)
    }
  },
  useTestCodexGateway,
  async () => {
    await realTeacherHintAdapter.resetTransport(true)
    await releaseAppServer()
  }
)
const practiceReviewEvaluator = useTestCodexGateway
  ? new DeterministicPracticeReviewEvaluator()
  : new LivePracticeReviewEvaluator(realTeacherReviewAdapter)
const practiceReviewService = new PracticeReviewService(
  practiceDefinitionRepository,
  practiceRunRepository,
  practiceCoordinator,
  progressRepository,
  practiceReviewActivity,
  practiceReviewEvaluator,
  undefined,
  evidenceAdapters,
  releaseAppServer
)
const teacherService = new TeacherService(
  teacherRepository,
  progressRepository,
  teacherCourseContextRepository,
  practiceRunRepository,
  practiceDefinitionRepository,
  activityRepository,
  activityObserver,
  memoryRepository,
  realTeacherSummaryAdapter,
  realTeacherAdapter,
  useTestCodexGateway && !presentTestTeacherAsLive
)
const removeTeacherConnection = appServerGateway.onConnectionState((state) => {
  if (state === 'disconnected') {
    appServerLifecycle.markDisconnected()
    void realTeacherAdapter.resetTransport()
    void realTeacherSummaryAdapter.resetTransport()
    void realTeacherReviewAdapter.resetTransport()
    void realTeacherHintAdapter.resetTransport()
  }
  teacherService.onConnectionState(state)
})


function rendererPreloadPath(): string {
  return join(__dirname, '../preload/index.js')
}

async function loadSurface(
  targetWindow: BrowserWindow,
  surface: 'learning' | 'companion'
): Promise<void> {
  if (process.env.ELECTRON_RENDERER_URL) {
    await targetWindow.loadURL(`${process.env.ELECTRON_RENDERER_URL}#/${surface}`)
    return
  }

  await targetWindow.loadFile(join(__dirname, '../renderer/index.html'), {
    hash: `/${surface}`
  })
}

function openNewWindowsInDefaultBrowser(targetWindow: BrowserWindow): void {
  targetWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const destination = new URL(url)
      if (destination.protocol === 'https:') {
        void shell.openExternal(destination.toString())
      }
    } catch {
      // Reject malformed or non-web destinations without navigating the app.
    }

    return { action: 'deny' }
  })
}

function notifyVideoWhenWindowHidden(window: BrowserWindow): void {
  const notify = () => {
    if (!window.webContents.isDestroyed()) window.webContents.send('course:practice-video-hidden')
  }
  window.on('hide', notify)
  window.on('minimize', notify)
}

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 760,
    minHeight: 620,
    show: false,
    title: 'Course Companion',
    backgroundColor: '#f4efe5',
    webPreferences: {
      preload: rendererPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  notifyVideoWhenWindowHidden(window)
  openNewWindowsInDefaultBrowser(window)
  window.once('ready-to-show', () => window.show())

  window.on('minimize', () => {
    if (!fullTeacherVisible || isQuitting) return
    window.hide()
    companionMode = 'expanded'
    companionWindow?.webContents.send('course:companion-mode-changed', companionMode)
    positionCompanion(companionMode)
    void teacherRepository.saveMode(companionMode).catch(() => {
      console.error('Unable to save Teacher window mode')
    })
  })

  window.on('close', (event) => {
    if (isQuitting) return

    event.preventDefault()
    window.hide()
    companionWindow?.show()
  })

  void loadSurface(window, 'learning')
  return window
}

function createCompanionWindow(mode: CompanionMode): BrowserWindow {
  const display = screen.getPrimaryDisplay()
  const initialBounds = getCompanionBounds(display.workArea, mode)
  const window = new BrowserWindow({
    ...initialBounds,
    ...(process.platform === 'darwin' ? { type: 'panel' } : {}),
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: companionAlwaysOnTop,
    hasShadow: false,
    webPreferences: {
      preload: rendererPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  notifyVideoWhenWindowHidden(window)
  applyCompanionTopmost(window)
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  window.on('show', () => applyCompanionTopmost(window))
  // Native user moves only; programmatic expansion must not overwrite the anchor.
  window.on('will-move', (_event, bounds) => {
    companionAnchor = { right: bounds.x + bounds.width, bottom: bounds.y + bounds.height }
  })
  window.on('close', (event) => {
    if (isQuitting) return
    event.preventDefault()
  })

  void loadSurface(window, 'companion')
  return window
}

function applyCompanionTopmost(target: BrowserWindow | null = companionWindow): void {
  if (!target) return
  if (!companionAlwaysOnTop) {
    target.setAlwaysOnTop(false)
    return
  }
  target.setAlwaysOnTop(true, 'screen-saver')
  if (target.isVisible()) target.moveTop()
}

function positionCompanion(mode: CompanionMode, show = true): void {
  if (!companionWindow) return

  const display = screen.getDisplayMatching(companionWindow.getBounds())
  companionWindow.setBounds(getCompanionBounds(display.workArea, mode, companionAnchor), true)
  applyCompanionTopmost()
  if (show) {
    companionWindow.showInactive()
    applyCompanionTopmost()
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function practiceReviewFailure(error: unknown): Extract<PracticeReviewResponse, { error: unknown }> {
  const detail = error instanceof Error ? error.message : ''
  if (detail.includes('PRACTICE_SNAPSHOT_BUSY')) {
    return { error: { code: 'task-busy', message: 'Task Codex vẫn đang xử lý. Hãy chờ task hoàn tất rồi duyệt lại.' } }
  }
  if (detail.includes('PRACTICE_EVIDENCE_CHANGED') || detail.includes('CHANGED_DURING_READ') || detail.includes('đã thay đổi trong khi')) {
    return { error: { code: 'evidence-changed', message: 'Bằng chứng vừa thay đổi trong lúc duyệt. Hãy đợi task ổn định rồi thử lại.' } }
  }
  if (detail.includes('BINDING_MISMATCH') || detail.includes('PATH_INVALID') || detail.includes('BINDING_INVALID')) {
    return { error: { code: 'binding-mismatch', message: 'Không thể xác minh đúng task Codex của Practice này. Hãy quay lại đúng task rồi thử lại.' } }
  }
  if (detail.includes('PRACTICE_METADATA')) {
    return { error: { code: 'metadata-unavailable', message: 'Triết chưa đọc được cài đặt hiện tại của task Codex. Tiến độ cũ vẫn được giữ; hãy mở đúng task rồi thử lại.' } }
  }
  if (detail.includes('APP_SERVER') || detail.toLowerCase().includes('disconnected')) {
    return { error: { code: 'transport-unavailable', message: 'Chưa kết nối được để đọc bằng chứng Practice. Hãy thử lại sau ít phút.' } }
  }
  return { error: { code: 'review-unavailable', message: 'Chưa thể duyệt tiến độ Practice. Kết quả gần nhất vẫn được giữ; hãy thử lại.' } }
}

function isPracticeStartRequest(value: unknown): value is PracticeStartRequest {
  return isRecord(value)
    && Object.keys(value).length === 3
    && /^[A-Za-z0-9_-]{1,160}$/.test(String(value.practiceId))
    && /^[0-9]+.[0-9]+.[0-9]+$/.test(String(value.practiceVersion))
    && typeof value.transfer === 'boolean'
}

function isPracticePanelUpdate(value: unknown): value is PracticePanelUpdate {
  return (
    isRecord(value) &&
    Object.keys(value).length === 2 &&
    (value.surface === 'full' || value.surface === 'compact') &&
    (value.panel === 'teacher' || value.panel === 'progress')
  )
}

function isPortfolioWorkspaceRequest(value: unknown): value is PortfolioWorkspaceRequest {
  return isRecord(value)
    && Object.keys(value).length === 1
    && /^[A-Za-z0-9_-]{1,160}$/.test(String(value.courseRunId))
}

function portfolioWorkspaceFailure(
  request: PortfolioWorkspaceRequest,
  error: unknown
): PortfolioWorkspaceView {
  return {
    schemaVersion: 1,
    courseRunId: request.courseRunId,
    status: error instanceof PortfolioWorkspaceError ? 'rejected' : 'error',
    observedAt: new Date().toISOString(),
    message: error instanceof PortfolioWorkspaceError
      ? error.message
      : 'Không thể kiểm tra thư mục này. Hãy thử lại.',
    canChoose: true,
    canConfirmPlanning: false
  }
}

function isDigest(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
}

function isPlanningPracticeActionRequest(value: unknown): value is PlanningPracticeActionRequest {
  if (!isRecord(value)
    || !/^[A-Za-z0-9_-]{1,160}$/.test(String(value.runId))
    || !Number.isSafeInteger(value.generation)
    || Number(value.generation) < 1
    || value.practiceId !== 'm2-planning-package'
    || !/^[0-9]+\.[0-9]+\.[0-9]+$/.test(String(value.practiceVersion))
    || !isRecord(value.action)
    || typeof value.action.type !== 'string') return false
  const action = value.action
  if (action.type === 'capture-prd-prompt' || action.type === 'complete-interview') {
    return Object.keys(action).length === 2
      && typeof action.expectedActivityCursor === 'string'
      && action.expectedActivityCursor.length > 0
      && action.expectedActivityCursor.length <= 500
  }
  if (action.type === 'approve-prd' || action.type === 'request-prd-revision') {
    return Object.keys(action).length === 2 && isDigest(action.expectedPrdDigest)
  }
  if (action.type === 'confirm-alignment'
    || action.type === 'approve-plan'
    || action.type === 'request-plan-revision') {
    return Object.keys(action).length === 3
      && isDigest(action.expectedPrdDigest)
      && isDigest(action.expectedPlanDigest)
  }
  if (action.type === 'record-scope-decision') {
    return Object.keys(action).length === 4
      && typeof action.value === 'string'
      && action.value.trim().length >= 20
      && action.value.length <= 2_000
      && isDigest(action.expectedPrdDigest)
      && isDigest(action.expectedPlanDigest)
  }
  return false
}

function isPortfolioStageActionRequest(value: unknown): value is PortfolioStageActionRequest {
  return isRecord(value)
    && (Object.keys(value).length === 7 || Object.keys(value).length === 8)
    && /^[A-Za-z0-9_-]{1,160}$/.test(String(value.runId))
    && Number.isSafeInteger(value.generation)
    && Number(value.generation) > 0
    && (value.practiceId === 'm2-portfolio-planning' || value.practiceId === 'm3-portfolio-build')
    && value.practiceVersion === '1.0.0'
    && /^[A-Za-z0-9_-]{1,160}$/.test(String(value.courseRunId))
    && /^[A-Za-z0-9_-]{1,160}$/.test(String(value.stageId))
    && (value.sliceId === undefined || ['foundation-hero', 'selected-work', 'about-contact-footer', 'responsive-accessibility'].includes(String(value.sliceId)))
    && (value.decision === 'approved' || value.decision === 'revision-requested')
}

function isPortfolioPackageApprovalRequest(value: unknown): value is PortfolioPackageApprovalRequest {
  return isRecord(value)
    && ((value.practiceId === 'm2-portfolio-planning' && value.practiceVersion === '2.0.0' && Object.keys(value).length === 8 && value.approvePrd === true && value.approvePlan === true)
      || (value.practiceId === 'm3-portfolio-build' && value.practiceVersion === '2.0.0' && Object.keys(value).length === 7 && value.approveWebsite === true)
      || (value.practiceId === 'm4-portfolio-release' && value.practiceVersion === '1.0.0' && Object.keys(value).length === 7 && value.approveWebsite === true))
    && typeof value.runId === 'string' && /^[A-Za-z0-9_-]{1,160}$/.test(value.runId)
    && Number.isSafeInteger(value.generation) && Number(value.generation) > 0
    && typeof value.courseRunId === 'string' && /^[A-Za-z0-9_-]{1,160}$/.test(value.courseRunId)
    && typeof value.sourceDigest === 'string' && /^[a-f0-9]{64}$/.test(value.sourceDigest)
}

function isPracticeGuideSurfaceContext(value: unknown): value is PracticeGuideSurfaceContext {
  return isRecord(value)
    && (value.surface === 'full' || value.surface === 'compact' || value.surface === 'learning')
    && (value.activeTab === undefined || value.activeTab === 'teacher' || value.activeTab === 'progress')
    && Object.keys(value).every((key) => key === 'surface' || key === 'activeTab')
}

function isPracticeGuideUpdateRequest(value: unknown): value is PracticeGuideUpdateRequest {
  if (!isRecord(value) || typeof value.type !== 'string') return false
  const withoutStage = new Set(['start', 'resume', 'replay', 'dismiss-confirmation'])
  if (withoutStage.has(value.type)) return Object.keys(value).length === 1
  const withStage = new Set([
    'continue', 'pause', 'skip', 'review-requested', 'course-returned'
  ])
  return withStage.has(value.type)
    && Object.keys(value).length === 2
    && /^[A-Za-z0-9_-]{1,160}$/.test(String(value.expectedStageId))
}

async function authoritativeGuideContext(
  surface: PracticeGuideSurfaceContext,
  knownWorkspace?: PracticeWorkspaceView
): Promise<PracticeGuideContext> {
  const result = await progressRepository.load()
  const progress = result.status === 'returning' || result.status === 'recovered'
    ? result.progress
    : null
  let workspace = knownWorkspace ?? null
  if (surface.surface !== 'learning') {
    workspace ??= await practiceCoordinator.loadWorkspace().catch(() => null)
  }
  return { progress, workspace, ...surface }
}

async function reconcilePracticeGuide(surface: PracticeGuideSurfaceContext, workspace?: PracticeWorkspaceView): Promise<void> {
  const context = await authoritativeGuideContext(surface, workspace)
  await practiceGuideCoordinator.load(context).catch(() => null)
}

async function enterPracticeCompanion(): Promise<void> {
  companionMode = 'compact'
  await teacherRepository.saveMode(companionMode)
  mainWindow?.hide()
  companionWindow?.webContents.send('course:companion-mode-changed', companionMode)
  positionCompanion(companionMode)
}

function registerIpcHandlers(): void {
  ipcMain.handle('course:get-runtime-info', (): RuntimeInfo => ({
    appVersion: app.getVersion(),
    platform: process.platform,
    packaged: app.isPackaged,
    testFixturesEnabled: useTestCodexGateway
  }))

  ipcMain.handle('course:load-progress', () => progressRepository.load())

  ipcMain.handle('course:save-progress', (_event, update: ProgressUpdate) => {
    if (!isProgressUpdate(update)) throw new Error('Invalid learner progress update')
    return progressRepository.save(update)
  })

  ipcMain.handle('course:complete-portfolio-planning-module', () =>
    portfolioModuleCompletionService.completeModuleTwo())

  ipcMain.handle('course:complete-portfolio-build-module', () =>
    portfolioModuleCompletionService.completeModuleThree())

  ipcMain.handle('course:reset-progress', async () => {
    await Promise.all([
      progressRepository.reset(),
      portfolioWorkspaceRepository.reset(),
      teacherService.reset(),
      practiceCoordinator.reset(),
      practiceGuideCoordinator.reset()
    ])
    companionMode = 'compact'
    companionAlwaysOnTop = true
    applyCompanionTopmost()
    positionCompanion(companionMode, false)
  })

  ipcMain.handle('course:load-companion-state', async () => {
    if (!useTestCodexGateway) await ensureAppServer().catch(() => undefined)
    return teacherService.loadState(companionMode)
  })

  ipcMain.handle('course:load-practice-state', () => practiceAdapter.loadState())

  ipcMain.handle('course:load-app-settings', () => teacherRepository.loadSettings())

  ipcMain.handle('course:load-portfolio-workspace', (_event, request: PortfolioWorkspaceRequest) => {
    if (!isPortfolioWorkspaceRequest(request)) throw new Error('Invalid portfolio workspace request')
    return portfolioWorkspaceRepository.load(request).catch((error) =>
      portfolioWorkspaceFailure(request, error))
  })

  ipcMain.handle('course:choose-portfolio-workspace', async (_event, request: PortfolioWorkspaceRequest) => {
    if (!isPortfolioWorkspaceRequest(request)) throw new Error('Invalid portfolio workspace request')
    const deterministicPath = useTestCodexGateway
      ? process.env.COURSE_COMPANION_TEST_PORTFOLIO_WORKSPACE
      : undefined
    const selection = deterministicPath
      ? { canceled: false, filePaths: [deterministicPath] }
      : mainWindow
        ? await dialog.showOpenDialog(mainWindow, {
            title: 'Chọn thư mục dành cho portfolio',
            buttonLabel: 'Chọn thư mục này',
            properties: ['openDirectory', 'createDirectory']
          })
        : await dialog.showOpenDialog({
            title: 'Chọn thư mục dành cho portfolio',
            buttonLabel: 'Chọn thư mục này',
            properties: ['openDirectory', 'createDirectory']
          })
    if (selection.canceled || !selection.filePaths[0]) {
      return portfolioWorkspaceRepository.load(request)
    }
    return portfolioWorkspaceRepository.selectPath(request, selection.filePaths[0]).catch((error) =>
      portfolioWorkspaceFailure(request, error))
  })

  ipcMain.handle('course:confirm-portfolio-planning', async (_event, request: PortfolioWorkspaceRequest) => {
    if (!isPortfolioWorkspaceRequest(request)) throw new Error('Invalid portfolio workspace request')
    const workspace = await portfolioWorkspaceRepository.confirmPlanning(request).catch((error) =>
      portfolioWorkspaceFailure(request, error))
    return workspace.status === 'ready' && workspace.selectedPath
      ? ensurePortfolioCodexProject({ ...request, expectedPath: workspace.selectedPath }) : workspace
  })

  ipcMain.handle('course:ensure-portfolio-codex-project', (_event, request: unknown) => {
    if (!isRecord(request) || Object.keys(request).length !== 2
      || !isPortfolioWorkspaceRequest({ courseRunId: request.courseRunId })
      || typeof request.expectedPath !== 'string' || !request.expectedPath) {
      throw new Error('Invalid portfolio Codex project request')
    }
    return ensurePortfolioCodexProject({ courseRunId: String(request.courseRunId), expectedPath: request.expectedPath })
  })

  ipcMain.handle('course:load-practice-workspace', (_event, identity) => (
    practiceCoordinator.loadWorkspace(isRecord(identity) ? {
      practiceId: String(identity.practiceId),
      practiceVersion: String(identity.practiceVersion)
    } : undefined)
  ))

  // Presence checks must remain repository-only. The compact companion polls this
  // endpoint and must never refresh evidence or reconnect to the learner's task.
  ipcMain.handle('course:has-active-practice', async () => (
    Boolean((await practiceRunRepository.load()).activeRun)
  ))

  const currentVideoCourseRun = async () => {
    const loaded = await progressRepository.load()
    if (loaded.status !== 'returning' && loaded.status !== 'recovered') throw new Error('Course progress unavailable')
    return loaded.progress.courseRunId
  }
  const requireVideoReceipt = async () => {
    if (!(await practiceVideoRepository.load(await currentVideoCourseRun())).confirmed) throw new Error('Practice video confirmation required')
  }
  ipcMain.handle('course:load-practice-video', async () => practiceVideoRepository.load(await currentVideoCourseRun()))
  ipcMain.handle('course:update-practice-video', async (_event, request: PracticeVideoUpdate) => practiceVideoRepository.update(await currentVideoCourseRun(), request))

  ipcMain.handle('course:start-practice', async (_event, request: PracticeStartRequest) => {
    const previousRun = (await practiceRunRepository.load()).activeRun
    if (!isPracticeStartRequest(request)) throw new Error('Invalid Practice start request')
    if (request.practiceId === practiceVideoPracticeId) await requireVideoReceipt()
    const view = await practiceCoordinator.startNew(request)
    const activeRun = (await practiceRunRepository.load()).activeRun
    if (activeRun) await teacherService.activatePracticeRun(activeRun.runId)
    if (previousRun && previousRun.runId !== activeRun?.runId) {
      void teacherService.summarizeReplacedRun(previousRun)
    }
    await enterPracticeCompanion()
    return view
  })

  ipcMain.handle('course:resume-practice', async (_event, identity) => {
    const active = (await practiceRunRepository.load()).activeRun
    if ((isRecord(identity) ? identity.practiceId : active?.practiceId) === practiceVideoPracticeId) await requireVideoReceipt()
    const view = await practiceCoordinator.resume(isRecord(identity) ? {
      practiceId: String(identity.practiceId),
      practiceVersion: String(identity.practiceVersion)
    } : undefined)
    const activeRun = (await practiceRunRepository.load()).activeRun
    if (activeRun) await teacherService.activatePracticeRun(activeRun.runId)
    await enterPracticeCompanion()
    return view
  })

  ipcMain.handle('course:open-practice-task', async (_event, request: unknown) => {
    if (!isRecord(request) || typeof request.runId !== 'string'
      || !/^[A-Za-z0-9_-]{1,500}$/.test(request.runId)
      || typeof request.generation !== 'number' || !Number.isSafeInteger(request.generation)
      || request.generation < 1) throw new Error('Invalid Practice task open request')
    await practiceCoordinator.openTask({ runId: request.runId, generation: request.generation })
    await enterPracticeCompanion()
  })

  ipcMain.handle('course:retry-practice-switch', async () => {
    const previous = await practiceRunRepository.load()
    const previousRun = previous.activeRun
    if (previous.pendingTransition?.practiceId === practiceVideoPracticeId) await requireVideoReceipt()
    const view = await practiceCoordinator.retry()
    const activeRun = (await practiceRunRepository.load()).activeRun
    if (activeRun) await teacherService.activatePracticeRun(activeRun.runId)
    if (previousRun && previousRun.runId !== activeRun?.runId) {
      void teacherService.summarizeReplacedRun(previousRun)
    }
    await enterPracticeCompanion()
    return view
  })

  ipcMain.handle('course:cancel-practice-switch', () => practiceCoordinator.cancel())

  ipcMain.handle(
    'course:record-planning-action',
    (_event, request: PlanningPracticeActionRequest) => {
      if (!isPlanningPracticeActionRequest(request)) {
        throw new Error('Invalid Module 2 Practice action')
      }
      return practiceCoordinator.recordPlanningAction(request)
    }
  )

  ipcMain.handle(
    'course:record-portfolio-stage-action',
    (_event, request: PortfolioStageActionRequest) => {
      if (!isPortfolioStageActionRequest(request)) {
        throw new Error('Invalid portfolio Practice stage action')
      }
      return practiceCoordinator.recordPortfolioStageAction(request)
    }
  )

  ipcMain.handle('course:select-practice-panel', (_event, update: PracticePanelUpdate) => {
    if (!isPracticePanelUpdate(update)) throw new Error('Invalid Practice panel update')
    return practiceCoordinator.selectPanel(update)
  })

  ipcMain.handle('course:approve-portfolio-package', async (_event, request: PortfolioPackageApprovalRequest) => {
    if (!isPortfolioPackageApprovalRequest(request)) throw new Error('Invalid portfolio package approval')
    const loaded = await progressRepository.load()
    if ((loaded.status !== 'returning' && loaded.status !== 'recovered') || loaded.progress.courseRunId !== request.courseRunId) {
      throw new Error('Portfolio approval does not match the current course run')
    }
    return practiceCoordinator.approvePortfolioPackage(request)
  })

  ipcMain.handle('course:load-practice-guide', async (_event, surface) => {
    if (!isPracticeGuideSurfaceContext(surface)) throw new Error('Invalid Practice guide surface')
    return practiceGuideCoordinator.load(await authoritativeGuideContext(surface))
  })

  ipcMain.handle('course:update-practice-guide', async (_event, request, surface) => {
    if (!isPracticeGuideUpdateRequest(request)) throw new Error('Invalid Practice guide update')
    if (!isPracticeGuideSurfaceContext(surface)) throw new Error('Invalid Practice guide surface')
    const view = await practiceGuideCoordinator.update(request, await authoritativeGuideContext(surface))
    broadcastPracticeWorkspaceChanged()
    return view
  })

  ipcMain.handle('course:review-practice', async () => {
    if (practiceHintPending) return { error: { code: 'review-unavailable', message: 'Triết đang chuẩn bị gợi ý. Hãy chờ gợi ý xong rồi kiểm tra tiến độ.' } }
    practiceReviewRequests += 1
    try {
      const response = await practiceReviewService.review()
      broadcastPracticeWorkspaceChanged()
      // Guide housekeeping must not hold an already-saved review response open.
      void reconcilePracticeGuide({ surface: 'full' }, response.workspace).catch(() => undefined)
      return response
    } catch (error) {
      broadcastPracticeWorkspaceChanged()
      return practiceReviewFailure(error)
    } finally {
      practiceReviewRequests -= 1
    }
  })

  ipcMain.handle('course:practice-hint', async (_event, request: unknown) => {
    if (!request || typeof request !== 'object' || !('runId' in request)
      || typeof request.runId !== 'string' || !/^[A-Za-z0-9_-]{1,500}$/.test(request.runId)
      || !('generation' in request) || typeof request.generation !== 'number'
      || !Number.isSafeInteger(request.generation) || request.generation < 1) {
      return { error: { message: 'Yêu cầu gợi ý không khớp Practice hiện tại.' } }
    }
    if (practiceHintPending || practiceReviewRequests > 0 || pendingPracticeReturn) {
      return { error: { message: 'Triết đang xử lý yêu cầu Practice trước. Hãy chờ xong rồi xin gợi ý.' } }
    }
    practiceHintPending = true
    try {
      return { hint: await practiceHintService.request({ runId: request.runId, generation: request.generation }) }
    } catch (error) {
      // Do not expose transport errors, paths, or credentials to the renderer.
      const message = error instanceof Error && error.message === 'PRACTICE_SNAPSHOT_BUSY'
        ? 'Codex đang làm việc. Hãy chờ lượt hiện tại kết thúc rồi xin gợi ý.'
        : error instanceof Error && /^(Practice đã|Triết |Chưa xác minh|Codex đang|Tiến độ vừa)/.test(error.message)
          ? error.message : 'Triết tạm thời chưa thể đưa gợi ý. Hãy thử lại.'
      return { error: { message } }
    } finally {
      practiceHintPending = false
    }
  })

  ipcMain.handle('course:return-passed-practice', async () => {
    if (practiceHintPending) throw new Error('Triết đang chuẩn bị gợi ý. Hãy chờ gợi ý xong rồi quay lại khóa học.')
    if (pendingPracticeReturn) return pendingPracticeReturn
    const operation = (async () => {
      const completedRun = (await practiceRunRepository.load()).activeRun
      const guideContextBeforeReturn = await authoritativeGuideContext({ surface: 'full' })
      const receipt = await practiceReviewService.returnPassedPractice()
      if (!completedRun
        || completedRun.runId !== receipt.runId
        || completedRun.practiceId !== receipt.practiceId
        || completedRun.practiceVersion !== receipt.practiceVersion) {
        throw new Error('Passed Practice changed before its completion summary could be saved.')
      }
      await teacherService.leavePracticeRun(completedRun.runId)
      await practiceGuideCoordinator.completeCourseReturn(guideContextBeforeReturn).catch(() => null)
      const authoritative = await progressRepository.load()
      if (authoritative.status !== 'returning' && authoritative.status !== 'recovered') {
        throw new Error('Authoritative learner progress is unavailable after Practice return.')
      }
      mainWindow?.show()
      mainWindow?.focus()
      companionMode = 'compact'
      companionWindow?.webContents.send('course:companion-mode-changed', companionMode)
      positionCompanion(companionMode, false)
      companionWindow?.hide()
      await teacherRepository.saveMode(companionMode)
      mainWindow?.webContents.send('course:practice-returned')
      // Progress and the return are already committed. A slow or unavailable
      // memory summary must not hold the learner on the completed Practice.
      void teacherService.summarizeCompletedRun(completedRun).catch(() => undefined)
    })().finally(() => {
      if (pendingPracticeReturn === operation) pendingPracticeReturn = null
    })
    pendingPracticeReturn = operation
    return operation
  })

  ipcMain.handle('course:save-app-settings', async (_event, update: AppSettingsUpdate) => {
    if (!isAppSettingsUpdate(update)) throw new Error('Invalid app settings update')
    companionAlwaysOnTop = update.companionAlwaysOnTop
    applyCompanionTopmost()
    return teacherRepository.saveSettings({
      companionMode,
      companionAlwaysOnTop
    })
  })

  ipcMain.handle(
    'course:emit-practice-fixture',
    (_event, request: PracticeFixtureRequest) => {
      if (!useTestCodexGateway) throw new Error('Practice fixtures are available only in deterministic test mode')
      if (!isPracticeFixtureRequest(request)) throw new Error('Invalid practice fixture request')
      return practiceAdapter.emitFixture(request)
    }
  )

  ipcMain.handle(
    'course:send-teacher-message',
    async (_event, request: TeacherSendRequest) => {
      if (!isTeacherSendRequest(request)) throw new Error('Invalid teacher message request')
      return teacherService.sendMessage({ content: request.content })
    }
  )

  ipcMain.handle('course:show-full-teacher', async () => {
    companionMode = 'compact'
    await teacherRepository.saveMode(companionMode)
    if (mainWindow?.isMinimized()) mainWindow.restore()
    mainWindow?.show()
    mainWindow?.focus()
    mainWindow?.webContents.send('course:full-teacher-requested')
    companionWindow?.hide()
    companionWindow?.webContents.send('course:companion-mode-changed', companionMode)
  })

  ipcMain.handle('course:set-full-teacher-visible', (event, visible: unknown) => {
    if (event.sender.id !== mainWindow?.webContents.id || typeof visible !== 'boolean') {
      throw new Error('Invalid Teacher window state')
    }
    fullTeacherVisible = visible
  })

  ipcMain.handle('course:set-companion-mode', async (_event, mode: CompanionMode) => {
    if (mode !== 'compact' && mode !== 'expanded') {
      throw new Error('Unsupported companion mode')
    }
    companionMode = mode
    positionCompanion(companionMode)
    companionWindow?.webContents.send('course:companion-mode-changed', companionMode)
    await teacherRepository.saveMode(companionMode)
  })

  ipcMain.handle('course:quit', () => app.quit())
}

app.on('before-quit', () => {
  isQuitting = true
  void appServerClient.stop()
  void practiceSnapshotClient.stop()
  void portfolioProjectClient.stop()
  void closeExecutorBootstrap()
  removeTeacherConnection()
  void teacherService.dispose()
  void realTeacherReviewAdapter.dispose()
  void realTeacherHintAdapter.dispose()
})

app.on('activate', () => {
  if (!mainWindow) {
    mainWindow = createMainWindow()
  } else {
    mainWindow.show()
  }
})

app.whenReady().then(async () => {
  registerIpcHandlers()
  const settings = await teacherRepository.loadSettings()
  companionMode = settings.companionMode
  companionAlwaysOnTop = settings.companionAlwaysOnTop
  companionWindow = createCompanionWindow(companionMode)
  mainWindow = createMainWindow()
})
