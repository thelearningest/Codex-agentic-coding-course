import { appendFile, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import {
  checkpointIds,
  sceneIds,
  type AppSettings,
  type AppSettingsUpdate,
  type CheckpointId,
  type CompanionMode,
  type TeacherAdapter,
  type TeacherContext,
  type TeacherConversation,
  type TeacherMessage,
  type TeacherSendRequest,
  type TeacherSendResult
} from '../../shared/contracts'

const checkpointSet = new Set<string>(checkpointIds)
const sceneSet = new Set<string>(sceneIds)
const MAX_MESSAGE_LENGTH = 2_000
const MAX_LOADED_MESSAGES = 100

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isCompanionMode(value: unknown): value is CompanionMode {
  return value === 'compact' || value === 'expanded'
}

const defaultAppSettings: AppSettings = {
  companionMode: 'compact',
  companionAlwaysOnTop: true
}

function isAppSettings(value: unknown): value is AppSettings {
  return (
    isRecord(value) &&
    isCompanionMode(value.companionMode) &&
    typeof value.companionAlwaysOnTop === 'boolean'
  )
}

export function isAppSettingsUpdate(value: unknown): value is AppSettingsUpdate {
  return isRecord(value) && typeof value.companionAlwaysOnTop === 'boolean'
}

function isCheckpointId(value: unknown): value is CheckpointId {
  return typeof value === 'string' && checkpointSet.has(value)
}

function isTeacherContext(value: unknown): value is TeacherContext {
  return (
    isRecord(value) &&
    (value.lessonId === 'intro' || value.lessonId === 'module-1' || value.lessonId === 'module-2') &&
    isCheckpointId(value.checkpointId) &&
    typeof value.sceneId === 'string' &&
    sceneSet.has(value.sceneId)
  )
}

function isTeacherMessage(value: unknown): value is TeacherMessage {
  if (!isRecord(value)) return false
  if (value.schemaVersion !== undefined && value.schemaVersion !== 1) return false
  if (typeof value.id !== 'string' || value.id.length < 1 || value.id.length > 100) return false
  if (value.role !== 'learner' && value.role !== 'teacher') return false
  if (value.source !== 'learner' && value.source !== 'fixture' && value.source !== 'live') return false
  if (value.role === 'learner' && value.source !== 'learner') return false
  if (value.role === 'teacher' && value.source !== 'fixture' && value.source !== 'live') return false
  if (typeof value.content !== 'string' || value.content.length < 1 || value.content.length > MAX_MESSAGE_LENGTH) return false
  if (typeof value.timestamp !== 'string' || Number.isNaN(Date.parse(value.timestamp))) return false
  if (value.checkpointId !== undefined && !isCheckpointId(value.checkpointId)) return false
  if (
    value.practiceRunId !== undefined &&
    (typeof value.practiceRunId !== 'string' || value.practiceRunId.length < 1 || value.practiceRunId.length > 100)
  ) return false
  if (
    value.deliveryStatus !== undefined &&
    value.deliveryStatus !== 'pending' &&
    value.deliveryStatus !== 'delivered' &&
    value.deliveryStatus !== 'failed'
  ) return false
  return true
}

export function isTeacherSendRequest(value: unknown): value is TeacherSendRequest {
  if (!isRecord(value)) return false
  if (typeof value.content !== 'string') return false
  const trimmed = value.content.trim()
  if (trimmed.length < 1 || trimmed.length > MAX_MESSAGE_LENGTH) return false
  return value.context === undefined || isTeacherContext(value.context)
}

function replyFor(context?: TeacherContext): string {
  if (!context) {
    return 'Hãy mở chặng có nhãn “Bạn đang ở đây”. Khi có checkpoint, mình sẽ nhắc đúng điều cần kiểm tra ở bước đó.'
  }

  if (context.checkpointId === 'm1-codex-orientation') {
    return 'Codex là coding agent của OpenAI. Nó có thể đọc tệp, dùng công cụ, chạy lệnh và kiểm tra kết quả trong phạm vi bạn cho phép.'
  }
  if (context.checkpointId === 'm1-model-choice') {
    return 'Mình đề xuất 5.6 Sol, Effort Medium hoặc High và Speed Standard cho ContentPilot. Đây là lựa chọn cho dự án này, không phải mặc định của mọi tài khoản Codex.'
  }
  if (context.checkpointId === 'm1-setup-checklist') {
    return 'Hãy sửa từng giá trị trong đúng task Codex. Triết sẽ đối chiếu trực tiếp Model, Effort, Speed, Approval và Full access; nội dung chat không thể tự đánh dấu đạt.'
  }

  if (context.checkpointId === 'm2-prd-interview') {
    return 'Prompt phỏng vấn nên có mục tiêu, bối cảnh, cách hỏi một câu mỗi lượt, output PRD một trang và ràng buộc chưa viết code.'
  }
  if (context.checkpointId === 'm2-prd-approved') {
    return 'Trước khi duyệt, hãy kiểm tra PRD có đủ tám phần, Done When quan sát được và không lẫn chi tiết implementation.'
  }
  if (context.checkpointId === 'm2-implementation-plan') {
    return 'Mỗi bước trong implementation plan cần có mục tiêu, thành phần hoặc tệp, kết quả quan sát được, cách kiểm tra và yêu cầu PRD liên quan.'
  }
  if (
    context.checkpointId === 'm2-alignment-review' ||
    context.checkpointId === 'm2-planning-package'
  ) {
    return 'Hãy đối chiếu bốn điểm: đủ yêu cầu trong phạm vi, không có scope creep, mỗi bước truy ngược về PRD và mỗi Done When có cách kiểm tra. Nếu PRD hoặc plan đổi, hãy làm lại đúng các bước bị đánh dấu cũ.'
  }
  if (context.lessonId === 'module-2') {
    return 'Ở Module 2, hãy giữ planning trước code: làm rõ quyết định sản phẩm, review PRD rồi mới chuyển sang implementation plan.'
  }

  return 'Phần giới thiệu giúp bạn hiểu dự án thực hành. Sau đó Course Companion sẽ đưa bạn vào Module 1 để thiết lập Codex trước khi planning.'
}

export class TeacherChatRepository {
  private readonly chatPath: string
  private readonly settingsPath: string
  private readonly settingsTempPath: string

  constructor(private readonly dataDirectory: string) {
    this.chatPath = join(dataDirectory, 'teacher-chat.jsonl')
    this.settingsPath = join(dataDirectory, 'companion-settings.json')
    this.settingsTempPath = join(dataDirectory, 'companion-settings.json.tmp')
  }

  async loadConversation(): Promise<TeacherConversation> {
    try {
      const lines = (await readFile(this.chatPath, 'utf8'))
        .split('\n')
        .filter((line) => line.trim().length > 0)
      const messages: TeacherMessage[] = []
      let recovered = false

      for (const line of lines) {
        try {
          const parsed: unknown = JSON.parse(line)
          if (isTeacherMessage(parsed)) messages.push(parsed)
          else recovered = true
        } catch {
          recovered = true
        }
      }

      const latestById = new Map(messages.map((message) => [message.id, message]))
      const deduplicated = [...latestById.values()].sort((left, right) => left.timestamp.localeCompare(right.timestamp))
      return { messages: deduplicated.slice(-MAX_LOADED_MESSAGES), recovered }
    } catch (error) {
      if (isRecord(error) && error.code === 'ENOENT') {
        return { messages: [], recovered: false }
      }
      return { messages: [], recovered: true }
    }
  }

  async append(messages: TeacherMessage[]): Promise<void> {
    if (!messages.every(isTeacherMessage)) throw new Error('Invalid teacher message')
    await mkdir(this.dataDirectory, { recursive: true })
    await appendFile(
      this.chatPath,
      messages.map((message) => JSON.stringify(message)).join('\n') + '\n',
      'utf8'
    )
  }

  async loadMode(): Promise<CompanionMode> {
    return (await this.loadSettings()).companionMode
  }

  async loadSettings(): Promise<AppSettings> {
    try {
      const parsed: unknown = JSON.parse(await readFile(this.settingsPath, 'utf8'))
      if (isAppSettings(parsed)) return parsed
      if (isRecord(parsed) && isCompanionMode(parsed.mode)) {
        return { ...defaultAppSettings, companionMode: parsed.mode }
      }
      return defaultAppSettings
    } catch {
      return defaultAppSettings
    }
  }

  async saveMode(mode: CompanionMode): Promise<void> {
    if (!isCompanionMode(mode)) throw new Error('Unsupported companion mode')
    const current = await this.loadSettings()
    await this.saveSettings({ ...current, companionMode: mode })
  }

  async saveSettings(settings: AppSettings): Promise<AppSettings> {
    if (!isAppSettings(settings)) throw new Error('Invalid app settings')
    await mkdir(this.dataDirectory, { recursive: true })
    await writeFile(this.settingsTempPath, `${JSON.stringify(settings, null, 2)}\n`, 'utf8')
    await rename(this.settingsTempPath, this.settingsPath)
    return settings
  }

  async reset(): Promise<void> {
    await Promise.all([
      rm(this.chatPath, { force: true }),
      rm(this.settingsPath, { force: true }),
      rm(this.settingsTempPath, { force: true })
    ])
  }
}

export class FixtureTeacherAdapter implements TeacherAdapter {
  constructor(
    private readonly repository: TeacherChatRepository,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = () => randomUUID()
  ) {}

  loadConversation(): Promise<TeacherConversation> {
    return this.repository.loadConversation()
  }

  async sendMessage(request: TeacherSendRequest): Promise<TeacherSendResult> {
    if (!isTeacherSendRequest(request)) throw new Error('Invalid teacher message request')
    const timestamp = this.now().toISOString()
    const learnerMessage: TeacherMessage = {
      id: this.createId(),
      role: 'learner',
      source: 'learner',
      content: request.content.trim(),
      timestamp,
      checkpointId: request.context?.checkpointId
    }
    const teacherMessage: TeacherMessage = {
      id: this.createId(),
      role: 'teacher',
      source: 'fixture',
      content: replyFor(request.context),
      timestamp,
      checkpointId: request.context?.checkpointId
    }
    await this.repository.append([learnerMessage, teacherMessage])
    return { learnerMessage, teacherMessage }
  }

  reset(): Promise<void> {
    return this.repository.reset()
  }
}
