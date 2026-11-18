import { access, mkdir, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { createHash } from 'node:crypto'
import type {
  CodexConnectionListener,
  CodexNotification,
  CodexNotificationListener
} from './codex-app-server-client'
import type { CodexRequestClient } from './executor-chat-coordinator'
import type { CodexDesktopProject } from './codex-desktop-project-registry'

type TestThread = {
  id: string
  cwd: string
  name?: string
  ephemeral?: boolean
  serviceName?: string
  model: string
  reasoningEffort: string
  serviceTier: string | null
  approvalPolicy: unknown
  sandbox: Record<string, unknown>
  turns: Array<{ id: string; status: string; items: unknown[] }>
  configurationExercise: boolean
  configurationStage: number
  projectId?: string
}

type TestCodexGatewayOptions = {
  unsafeLaterTask?: boolean
}

function effectiveThread(thread: TestThread): Record<string, unknown> {
  return {
    thread,
    cwd: thread.cwd,
    model: thread.model,
    reasoningEffort: thread.reasoningEffort,
    serviceTier: thread.serviceTier,
    approvalPolicy: thread.approvalPolicy,
    sandbox: thread.sandbox
  }
}

export class TestCodexGateway implements CodexRequestClient {
  private readonly threads = new Map<string, TestThread>()
  private readonly projects = new Map<string, { id: string; name: string; roots: Array<{ path: string }> }>()
  private readonly desktopProjects = new Map<string, CodexDesktopProject>()
  private failProjectRead = process.env.COURSE_COMPANION_FAKE_PROJECT_FAILURE_ONCE === '1'
  private readonly notificationListeners = new Set<CodexNotificationListener>()
  private failTeacherTurn = process.env.COURSE_COMPANION_FAKE_TEACHER_FAIL_ONCE === '1'
  private readonly connectionListeners = new Set<CodexConnectionListener>()
  private sequence = 0
  private readonly unsafeLaterTask: boolean
  private readonly configurationReady = process.env.COURSE_COMPANION_FAKE_CONFIGURATION_READY === '1'

  constructor(
    private readonly workspaceRoot: string,
    options: TestCodexGatewayOptions = {}
  ) {
    this.unsafeLaterTask = options.unsafeLaterTask
      ?? process.env.COURSE_COMPANION_FAKE_UNSAFE_LATER_TASK === '1'
  }

  onNotification(listener: CodexNotificationListener): () => void {
    this.notificationListeners.add(listener)
    return () => this.notificationListeners.delete(listener)
  }

  async findDesktopProject(root: string): Promise<CodexDesktopProject | null> {
    return this.desktopProjects.get(root) ?? null
  }

  async openDesktopProject(root: string): Promise<void> {
    const result = await this.request('project/create', {
      name: basename(root), roots: [{ path: root }], idempotencyKey: root
    }) as { project: { id: string } }
    this.desktopProjects.set(root, { id: `desktop-${result.project.id}`, serverId: result.project.id })
  }

  onConnectionState(listener: CodexConnectionListener): () => void {
    this.connectionListeners.add(listener)
    listener('connected')
    return () => this.connectionListeners.delete(listener)
  }

  async request(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    if (method === 'project/list') return { data: [...this.projects.values()], nextCursor: null }
    if (method === 'project/create') {
      const id = 'simulated-project-' + createHash('sha256').update(String(params.idempotencyKey)).digest('hex').slice(0, 16)
      if (!this.projects.has(id)) this.projects.set(id, { id, name: String(params.name), roots: params.roots as Array<{ path: string }> })
      return { project: this.projects.get(id) }
    }
    if (method === 'project/read') {
      if (this.failProjectRead) { this.failProjectRead = false; throw new Error('Simulated project connection failure') }
      const project = this.projects.get(String(params.projectId))
      if (!project) throw new Error('Unknown simulated project')
      return { project }
    }
    if (method === 'model/list') {
      return {
        data: [
          { id: 'mock-teacher-model', model: 'mock-teacher-model', hidden: false, isDefault: true }
        ],
        nextCursor: null
      }
    }
    if (method === 'thread/start') {
      const id = `course-companion-smoke-${++this.sequence}`
      const config = typeof params.config === 'object' && params.config !== null
        ? params.config as Record<string, unknown>
        : {}
      const configurationExercise = params.serviceName === 'content_builder_academy_practice'
        && typeof params.model !== 'string'
      const model = typeof params.model === 'string'
        ? params.model
        : configurationExercise && !this.configurationReady ? 'gpt-5.6-terra' : 'gpt-5.6-sol'
      const reasoningEffort = typeof config.model_reasoning_effort === 'string'
        ? config.model_reasoning_effort
        : configurationExercise && !this.configurationReady ? 'medium' : 'high'
      const serviceTier = typeof params.serviceTier === 'string'
        ? params.serviceTier
        : configurationExercise ? this.configurationReady ? 'standard' : 'fast' : null
      const approvalPolicy = params.approvalPolicy
        ?? (configurationExercise && !this.configurationReady ? 'never' : 'on-request')
      const requestedSandbox = typeof params.sandbox === 'string'
        ? params.sandbox
        : configurationExercise && !this.configurationReady ? 'danger-full-access' : 'workspace-write'
      const sandboxMode = this.unsafeLaterTask
        && params.serviceName === 'content_builder_academy_practice'
        && typeof params.model === 'string'
        ? 'danger-full-access'
        : requestedSandbox
      const sandbox = sandboxMode === 'danger-full-access'
        ? { type: 'dangerFullAccess' }
        : sandboxMode === 'read-only'
          ? { type: 'readOnly', networkAccess: false }
          : {
              type: 'workspaceWrite',
              writableRoots: [typeof params.cwd === 'string' ? params.cwd : this.workspaceRoot],
              networkAccess: false,
              excludeTmpdirEnvVar: false,
              excludeSlashTmp: false
            }
      const thread: TestThread = {
        id,
        cwd: typeof params.cwd === 'string' ? params.cwd : this.workspaceRoot,
        ephemeral: params.ephemeral === true,
        serviceName: typeof params.serviceName === 'string' ? params.serviceName : undefined,
        model,
        reasoningEffort,
        serviceTier,
        approvalPolicy,
        sandbox,
        turns: [],
        configurationExercise,
        configurationStage: configurationExercise && this.configurationReady ? 5 : 0,
        ...(typeof params.projectId === 'string' ? { projectId: params.projectId } : {})
      }
      this.threads.set(id, thread)
      return effectiveThread(thread)
    }

    if (method === 'thread/list') {
      return { data: [...this.threads.values()] }
    }

    const threadId = typeof params.threadId === 'string' ? params.threadId : ''
    const thread = this.threads.get(threadId)
    if (!thread) throw new Error(`Unknown smoke-test thread: ${threadId}`)

    if (method === 'thread/name/set') {
      thread.name = typeof params.name === 'string' ? params.name : undefined
      return {}
    }
    if (method === 'thread/metadata/update') {
      if (!this.projects.has(String(params.projectId))) throw new Error('Unknown simulated project')
      thread.projectId = String(params.projectId)
      return { thread }
    }
    if (method === 'thread/read') {
      // The learner-directed continuation no longer sends an automatic turn.
      // Disposable package files explicitly enable the matching simulated
      // conversation, without changing the production continuation workflow.
      if (process.env.COURSE_COMPANION_FAKE_BUILD_EVIDENCE === '1'
        && await access(join(thread.cwd, 'evidence/module-3/build-log.md')).then(() => true, () => false)) {
        this.appendPortfolioEvidence(thread, 'Module 3 v2:')
      }
      if (process.env.COURSE_COMPANION_FAKE_RELEASE_EVIDENCE === '1'
        && await access(join(thread.cwd, 'evidence/module-4/deployment-record.json')).then(() => true, () => false)) {
        this.appendPortfolioEvidence(thread, 'Module 4: Tiếp tục chính task')
      }
      return { thread }
    }
    if (method === 'thread/resume') {
      if (thread.configurationExercise) this.advanceConfiguration(thread.id)
      return effectiveThread(thread)
    }
    if (method === 'thread/unsubscribe' || method === 'turn/interrupt') return {}
    if (method === 'turn/start') {
      if (thread.serviceName === 'content_builder_academy_teacher' || thread.serviceName === 'content_builder_academy_teacher_memory') {
        const delay = Number(process.env[thread.serviceName === 'content_builder_academy_teacher_memory'
          ? 'COURSE_COMPANION_FAKE_TEACHER_SUMMARY_DELAY_MS' : 'COURSE_COMPANION_FAKE_TEACHER_DELAY_MS'] ?? 0)
        if (Number.isFinite(delay) && delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, Math.min(delay, 10_000)))
        }
      }
      const turnId = `turn-${++this.sequence}`
      if (thread.serviceName === 'content_builder_academy_teacher' && this.failTeacherTurn) {
        this.failTeacherTurn = false
        queueMicrotask(() => {
          this.emit({
            method: 'error',
            params: {
              threadId,
              turnId,
              error: { message: 'Injected transient Teacher failure', codexErrorInfo: 'internalServerError' }
            }
          })
        })
        return { turn: { id: turnId } }
      }
      const input = Array.isArray(params.input) ? params.input : []
      const text = input.map((item) => typeof item === 'object' && item && 'text' in item ? String(item.text) : '').join('\n')
      const answer = thread.serviceName === 'content_builder_academy_practice'
        ? 'Sẵn sàng nhận brief từ người học.'
        : thread.serviceName === 'content_builder_academy_teacher_memory'
          ? summaryAnswer(text) || JSON.stringify({
            approach: '\u0110\u00e3 th\u1ef1c hi\u1ec7n m\u1ed9t l\u01b0\u1ee3t Practice c\u00f3 ph\u1ea1m vi.',
            learnerDecisions: [],
            strengths: ['\u0110\u00e3 y\u00eau c\u1ea7u b\u1eb1ng ch\u1ee9ng tr\u01b0\u1edbc khi k\u1ebft lu\u1eadn.'],
            mistakes: [],
            approvals: [],
            changedFiles: [],
            verificationEvidence: [],
            unresolvedIssues: [],
            nextAttemptGuidance: ['Ti\u1ebfp t\u1ee5c ki\u1ec3m tra ph\u1ea1m vi v\u00e0 b\u1eb1ng ch\u1ee9ng.']
            })
          : teacherAnswer(text)
      const userItem = {
        id: `user-${turnId}`,
        type: 'userMessage',
        content: [{ type: 'text', text }]
      }
      const item = { id: `message-${turnId}`, type: 'agentMessage', phase: 'final_answer', text: answer }
      const turn = { id: turnId, status: 'completed', items: [userItem, item] }
      thread.turns.push(turn)
      this.appendPortfolioEvidence(thread, text)
      if (thread.name?.includes('m2-planning-package')
        && !thread.turns.some((candidate) => candidate.id === 'planning-interview-1')) {
        await writePlanningArtifacts(thread.cwd)
        thread.turns.push(...planningInterviewTurns())
      }
      queueMicrotask(() => {
        this.emit({ method: 'item/completed', params: { threadId, turnId, item } })
        this.emit({ method: 'turn/completed', params: { threadId, turn } })
      })
      return { turn: { id: turnId } }
    }

    throw new Error(`Unsupported smoke-test Codex method: ${method}`)
  }

  private appendPortfolioEvidence(thread: TestThread, text: string): void {
      if (process.env.COURSE_COMPANION_FAKE_BUILD_EVIDENCE === '1' && text.includes('Module 3 v2:')
        && !thread.turns.some((candidate) => candidate.id === 'build-v2-simulated-evidence')) {
        thread.turns.push({ id: 'build-v2-simulated-evidence', status: 'completed', items: [
          { id: 'build-v2-learner', type: 'userMessage', content: [{ type: 'text', text: 'Simulated learner: I opened both project links and contact on desktop and mobile. I accept the current website as it is.' }] },
          { id: 'build-v2-checks', type: 'agentMessage', phase: 'final_answer', text: 'Simulated verification: npm run check passed (typecheck, lint, build). Desktop/mobile browser and keyboard checks passed. This is disposable test evidence, not a live learner run.' }
        ] })
      }
      if (process.env.COURSE_COMPANION_FAKE_RELEASE_EVIDENCE === '1' && text.includes('Module 4: Tiếp tục chính task')
        && !thread.turns.some((candidate) => candidate.id === 'release-simulated-evidence')) {
        thread.turns.push({ id: 'release-simulated-evidence', status: 'completed', items: [
          { id: 'release-learner', type: 'userMessage', content: [{ type: 'text', text: 'Disposable simulated learner: I authorize publishing this fixture portfolio to its test provider. I opened the signed-out shared URL, checked desktop and mobile images and links, and accept the current online result. This is test data, not live consent.' }] },
          { id: 'release-checks', type: 'agentMessage', phase: 'final_answer', text: 'Disposable simulated deployment: Vercel ready for the fixture source revision. npm run check and reported desktop/mobile public URL observations passed. No live provider action occurred.' }
        ] })
      }
  }

  emitExecutorActivity(threadId: string, item: Record<string, unknown>): void {
    const turnId = `executor-turn-${++this.sequence}`
    this.emit({ method: 'item/completed', params: { threadId, turnId, item } })
  }

  advanceConfiguration(threadId: string): Record<string, unknown> {
    const thread = this.threads.get(threadId)
    if (!thread) throw new Error(`Unknown smoke-test thread: ${threadId}`)
    thread.configurationStage = Math.min(5, thread.configurationStage + 1)
    if (thread.configurationStage >= 1) thread.model = 'gpt-5.6-sol'
    if (thread.configurationStage >= 2) thread.reasoningEffort = 'high'
    if (thread.configurationStage >= 3) thread.serviceTier = 'standard'
    if (thread.configurationStage >= 4) thread.approvalPolicy = 'on-request'
    if (thread.configurationStage >= 5) {
      thread.sandbox = {
        type: 'workspaceWrite',
        writableRoots: [thread.cwd],
        networkAccess: false,
        excludeTmpdirEnvVar: false,
        excludeSlashTmp: false
      }
    }
    const threadSettings = {
      model: thread.model,
      effort: thread.reasoningEffort,
      serviceTier: thread.serviceTier,
      approvalPolicy: thread.approvalPolicy,
      sandboxPolicy: thread.sandbox,
      activePermissionProfile: thread.sandbox.type === 'dangerFullAccess'
        ? { id: ':danger-full-access', extends: null }
        : null
    }
    this.emit({
      method: 'thread/settings/updated',
      emittedAtMs: Date.now() + thread.configurationStage,
      params: { threadId, threadSettings }
    })
    return structuredClone(threadSettings)
  }

  disconnectThread(threadId: string): void {
    if (!this.threads.has(threadId)) throw new Error(`Unknown smoke-test thread: ${threadId}`)
    this.emit({ method: 'thread/closed', params: { threadId } })
  }

  setConnectionState(state: 'connecting' | 'connected' | 'disconnected'): void {
    for (const listener of this.connectionListeners) listener(state)
  }

  private emit(notification: CodexNotification): void {
    for (const listener of this.notificationListeners) listener(notification)
  }
}

const deterministicPrd = `# PRD ContentPilot

## 1. Ý tưởng sản phẩm
Tạo một công cụ giúp người làm nội dung biến một ý tưởng thành bản nháp có cấu trúc.

## 2. Luồng sử dụng cốt lõi
Người dùng nhập ý tưởng, chọn giọng điệu, xem bản nháp rồi tự quyết định có sử dụng hay không.

## 3. Input
Một ý tưởng ngắn và lựa chọn giọng điệu.

## 4. Output
Một bản nháp hiển thị rõ tiêu đề, nội dung và gợi ý chỉnh sửa.

## 5. Phạm vi phiên bản 1
Nhận ý tưởng, tạo một bản nháp và cho phép sao chép kết quả.

## 6. Ngoài phạm vi
Không tự động đăng bài, không quản lý tài khoản mạng xã hội và không thu thập dữ liệu riêng tư.

## 7. Done When
- Người dùng nhập được ý tưởng và nhận một bản nháp có thể quan sát.
- Bản nháp hiển thị tốt và có thể sao chép.
- Không có chức năng tự động đăng bài.

## 8. Câu hỏi còn mở
- Cần hỗ trợ những giọng điệu nào trong phiên bản đầu?
`

const deterministicPlan = `# Implementation plan ContentPilot

Nguồn duy nhất cho phạm vi: artifacts/PRD.md đã được người học duyệt.

## 1. Cách tiếp cận tổng thể
Chia luồng tạo bản nháp thành các bước nhỏ, giữ ranh giới ngoài phạm vi và kiểm tra sau mỗi bước.

## 2. Các bước triển khai

### Bước 1 — Thu thập ý tưởng
Mục tiêu: Nhận ý tưởng và giọng điệu từ người dùng.
Thành phần hoặc file dự kiến: Biểu mẫu đầu vào ContentPilot.
Kết quả có thể quan sát: Dữ liệu hợp lệ được hiển thị trước khi tạo bản nháp.
Cách kiểm tra: Nhập dữ liệu hợp lệ và thiếu dữ liệu để quan sát phản hồi.
Phụ thuộc: Không có.
Yêu cầu PRD liên quan: Input và luồng sử dụng cốt lõi.

### Bước 2 — Trình bày bản nháp
Mục tiêu: Trả kết quả có tiêu đề, nội dung và thao tác sao chép.
Thành phần hoặc file dự kiến: Vùng kết quả ContentPilot.
Kết quả có thể quan sát: Bản nháp hiển thị rõ và sao chép được.
Cách kiểm tra: Hoàn thành toàn bộ luồng và so sánh với Done When.
Phụ thuộc: Bước 1.
Yêu cầu PRD liên quan: Output, phạm vi phiên bản 1 và Done When.

## 3. Giả định, rủi ro và quyết định kỹ thuật còn mở
Giả định dịch vụ tạo nội dung sẵn sàng; cần quyết định cách báo lỗi dễ hiểu cho người mới.

## 4. Kiểm tra toàn bộ luồng
- Mọi yêu cầu trong phạm vi PRD đều có bước triển khai.
- Mọi bước đều truy ngược được về một yêu cầu trong PRD.
- Không có nội dung thuộc phần ngoài phạm vi.
- Mọi mục \`Done When\` của PRD đều có cách kiểm tra tương ứng.
`

async function writePlanningArtifacts(workspaceRoot: string): Promise<void> {
  const artifacts = join(workspaceRoot, 'artifacts')
  await mkdir(artifacts, { recursive: true })
  await Promise.all([
    writeFile(join(artifacts, 'PRD.md'), deterministicPrd, 'utf8'),
    writeFile(join(artifacts, 'implementation-plan.md'), deterministicPlan, 'utf8')
  ])
}

function planningInterviewTurns(): TestThread['turns'] {
  return [
    {
      id: 'planning-interview-1',
      status: 'completed',
      items: [
        {
          id: 'planning-learner-prompt',
          type: 'userMessage',
          content: [{ type: 'text', text: 'Hãy phỏng vấn tôi từng câu một để tạo PRD ContentPilot đủ tám phần; chưa viết code và không tự quyết định phạm vi.' }]
        },
        {
          id: 'planning-executor-question',
          type: 'agentMessage',
          phase: 'final_answer',
          text: 'Ai là người dùng chính và kết quả quan sát được họ cần là gì?'
        }
      ]
    },
    {
      id: 'planning-interview-2',
      status: 'completed',
      items: [
        {
          id: 'planning-learner-answer',
          type: 'userMessage',
          content: [{ type: 'text', text: 'Người làm nội dung cần nhận bản nháp có cấu trúc, còn tự động đăng bài nằm ngoài phạm vi V1.' }]
        },
        {
          id: 'planning-executor-result',
          type: 'agentMessage',
          phase: 'final_answer',
          text: 'Cuộc phỏng vấn đã hoàn tất; PRD và implementation plan đã được tạo để người học xem xét.'
        }
      ]
    }
  ]
}

function summaryAnswer(input: string): string {
  const marker = 'FROZEN_PRACTICE_RUN\n'
  const end = '\nReturn JSON'
  const startIndex = input.indexOf(marker)
  const endIndex = input.indexOf(end)
  let activity: Record<string, unknown> = {}
  let learnerDecisions: string[] = []
  if (startIndex >= 0 && endIndex > startIndex) {
    try {
      const frozen = JSON.parse(input.slice(startIndex + marker.length, endIndex)) as {
        activity?: Record<string, unknown> | null
        teacherChat?: Array<{ role?: string; content?: string }>
      }
      activity = frozen.activity ?? {}
      learnerDecisions = (frozen.teacherChat ?? [])
        .filter((message) => message.role === 'learner' && typeof message.content === 'string')
        .slice(-2)
        .map((message) => String(message.content))
    } catch {
      // The deterministic fallback below remains valid when frozen test input is malformed.
    }
  }
  const strings = (value: unknown): string[] => Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
  return JSON.stringify({
    approach: strings(activity.learnerPrompts).at(-1) ?? 'Đã thực hiện một lượt Practice có phạm vi.',
    learnerDecisions,
    strengths: ['Đã yêu cầu bằng chứng trước khi kết luận.'],
    mistakes: [],
    approvals: strings(activity.approvalEvents),
    changedFiles: strings(activity.changedFiles),
    verificationEvidence: strings(activity.verificationEvidence),
    unresolvedIssues: [],
    nextAttemptGuidance: ['Tiếp tục kiểm tra phạm vi và bằng chứng.']
  })
}
function teacherAnswer(input: string): string {
  const marker = 'TEACHER_CONTEXT_ENVELOPE\n'
  const end = '\nRECENT_TEACHER_CHAT'
  const startIndex = input.indexOf(marker)
  const endIndex = input.indexOf(end)
  if (startIndex >= 0 && endIndex > startIndex) {
    try {
      const envelope = JSON.parse(input.slice(startIndex + marker.length, endIndex)) as {
        freshness?: 'fresh' | 'stale' | 'disconnected'
        practice?: { activity?: { executorResponses?: string[]; changedFiles?: string[]; reportedChangedFiles?: string[]; reportedVerificationEvidence?: string[]; workspaceConfirmedChangedFiles?: string[] } }
      }
      const latest = envelope.practice?.activity?.executorResponses?.at(-1)
      const changed = envelope.practice?.activity?.changedFiles?.length ?? 0
      const reportedFiles = envelope.practice?.activity?.reportedChangedFiles ?? []
      const reportedEvidence = envelope.practice?.activity?.reportedVerificationEvidence ?? []
      const confirmedFiles = envelope.practice?.activity?.workspaceConfirmedChangedFiles ?? []
      if (reportedFiles.length > 0) {
        const confirmation = confirmedFiles.length > 0
          ? 'Workspace xác nhận tệp đang thay đổi: ' + confirmedFiles.join(', ') + '.'
          : 'Course Companion chưa xác nhận độc lập thay đổi tệp trong workspace.'
        return 'Codex báo đã thay đổi: ' + reportedFiles.join(', ') + '. ' + confirmation
          + ' Bằng chứng kiểm tra do Codex báo cáo, chưa được Course Companion chạy lại: '
          + reportedEvidence.join(' ')
      }
      if (envelope.freshness !== 'fresh') {
        const disclosure = envelope.freshness === 'disconnected'
          ? 'Ngữ cảnh Codex hiện bị mất kết nối.'
          : 'Ngữ cảnh Codex hiện đã cũ.'
        return latest
          ? `${disclosure} Bản ghi gần nhất: ${latest} Số tệp thay đổi: ${changed}.`
          : `${disclosure} Tôi chưa thể xác nhận trạng thái mới nhất.`
      }
      if (latest) return `Tôi đang theo dõi đúng Practice hiện tại. Codex báo: ${latest} Số tệp thay đổi: ${changed}.`
    } catch {
      // The fake response remains bounded and deterministic if its test envelope is malformed.
    }
  }
  return 'B\u1ea1n \u0111ang \u1edf b\u01b0\u1edbc duy\u1ec7t k\u1ebf ho\u1ea1ch. H\u00e3y ki\u1ec3m tra b\u1ed1n \u0111i\u1ec3m: t\u1ec7p s\u1ebd \u0111\u1ed5i, thay \u0111\u1ed5i d\u1ef1 ki\u1ebfn, r\u1ee7i ro v\u00e0 c\u00e1ch ki\u1ec3m ch\u1ee9ng tr\u01b0\u1edbc khi ch\u1ea5p thu\u1eadn.'
}
