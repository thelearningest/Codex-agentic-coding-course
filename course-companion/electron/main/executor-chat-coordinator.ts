import { isPortfolioBuildPackageVersion } from '../../shared/contracts'
import { resolve } from 'node:path'
import type {
  ApprovedCodexConfiguration,
  PracticeDefinition
} from '../../shared/contracts'
import type { ExecutorChatBinding } from './practice-run-repository'
import {
  buildPracticeTaskStartPlan,
  parseEffectivePracticeTask,
  validateEffectivePracticeTask
} from './practice-task-policy'
import type { PracticeWorkspaceResolverPort } from './practice-workspace-resolver'
import { normalizeCodexTaskConfiguration } from './codex-configuration-normalizer'
import { portfolioReleaseInstructions } from './portfolio-release-instructions'

export type CodexRequestClient = {
  request: (method: string, params?: Record<string, unknown>) => Promise<unknown>
  close?: () => Promise<void>
}

type OpenExternal = (url: string) => Promise<void>
type DiscoveryOptions = {
  attempts?: number
  intervalMs?: number
  wait?: (milliseconds: number) => Promise<void>
}

const THREAD_ID = /^[A-Za-z0-9_-]{1,160}$/
const defaultWait = (milliseconds: number): Promise<void> => new Promise((resolve) => {
  setTimeout(resolve, milliseconds)
})

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function samePath(left: unknown, right: string): boolean {
  if (typeof left !== 'string') return false
  return resolve(left).replaceAll('/', '\\').toLocaleLowerCase('en-US') ===
    resolve(right).replaceAll('/', '\\').toLocaleLowerCase('en-US')
}

export class ExecutorChatCoordinator {
  constructor(
    private readonly client: CodexRequestClient,
    private readonly workspaces: PracticeWorkspaceResolverPort,
    private readonly openExternal: OpenExternal,
    private readonly now: () => Date = () => new Date(),
    private readonly discovery: DiscoveryOptions = {}
  ) {}

  async createTarget(input: {
    runId: string
    definition: PracticeDefinition
    approvedConfiguration?: ApprovedCodexConfiguration
  }): Promise<ExecutorChatBinding> {
    const workspaceRoot = await this.workspaces.resolve(input.definition.workspaceKind)
    const projectId = await this.workspaces.resolveProjectId?.(input.definition.workspaceKind, workspaceRoot)
    const plan = buildPracticeTaskStartPlan({
      ...input,
      workspaceRoot
    })
    return this.withBootstrap(async () => {
      const started = await this.client.request('thread/start', {
        ...plan.startParams, ...(projectId ? { projectId } : {})
      })
      const effective = parseEffectivePracticeTask(started)
      if (!THREAD_ID.test(effective.threadId)) {
        throw new Error('Codex created an invalid Executor chat')
      }
      validateEffectivePracticeTask({
        effective,
        plan,
        workspaceRoot,
        samePath,
        approvedConfiguration: input.approvedConfiguration
      })
      if (projectId && (!isRecord(started) || !isRecord(started.thread) || started.thread.projectId !== projectId)) {
        throw new Error('Codex created the task outside the portfolio project')
      }
      const threadId = effective.threadId
      const name = plan.name
      await this.client.request('thread/name/set', { threadId, name })
      const observed = this.now()
      return {
        runId: input.runId,
        threadId,
        name,
        workspaceRoot,
        ...(projectId ? { projectId } : {}),
        createdAt: observed.toISOString(),
        configuration: normalizeCodexTaskConfiguration({
          runId: input.runId,
          threadId,
          source: 'thread-start',
          payload: started,
          observedAt: observed.toISOString(),
          eventTimestampMs: observed.getTime()
        })
      }
    })
  }

  async prepareTarget(
    binding: ExecutorChatBinding,
    definition: PracticeDefinition,
    approvedConfiguration?: ApprovedCodexConfiguration,
    releaseSourceCheckpoint?: string
  ): Promise<void> {
    const workspaceRoot = await this.workspaces.resolve(definition.workspaceKind)
    if (!THREAD_ID.test(binding.threadId) || !samePath(binding.workspaceRoot, workspaceRoot)) {
      throw new Error('Invalid Executor chat binding')
    }
    const projectId = await this.workspaces.resolveProjectId?.(definition.workspaceKind, workspaceRoot)
    await this.withBootstrap(async () => {
      const learnerDirected = definition.practiceId === 'm2-portfolio-planning'
        || (definition.practiceId === 'm3-portfolio-build' && isPortfolioBuildPackageVersion(definition.version))
        || definition.practiceId === 'm4-portfolio-release'
      const thread = await this.waitUntilReadable(
        binding.threadId,
        workspaceRoot,
        definition.taskPolicy === 'safe-workspace-write' && !learnerDirected
      )
      if (projectId && thread.projectId !== projectId) {
        await this.client.request('thread/metadata/update', { threadId: binding.threadId, projectId })
        const assigned = await this.client.request('thread/read', { threadId: binding.threadId, includeTurns: false })
        if (!isRecord(assigned) || !isRecord(assigned.thread) || assigned.thread.id !== binding.threadId
          || !samePath(assigned.thread.cwd, workspaceRoot) || assigned.thread.projectId !== projectId) {
          throw new Error('Codex could not verify portfolio task membership')
        }
      }
      // Keep the saved handoff aligned when repairing an older backend-only
      // project binding. The caller persists this prepared binding.
      if (projectId) binding.projectId = projectId
      // Portfolio work is directed in desktop by the learner. A second server
      // must only verify the saved binding, never acquire its writer or send work.
      if (learnerDirected) return
      if (definition.taskPolicy === 'safe-workspace-write') {
        const continuesPortfolio = definition.practiceId === 'm3-portfolio-build' || definition.practiceId === 'm4-portfolio-release'
        const marker = 'PRACTICE_CONTRACT:' + binding.runId + ':' + definition.practiceId + ':' + definition.version
        const needsInstruction = (candidate: Record<string, unknown>): boolean => {
          const turns = Array.isArray(candidate.turns) ? candidate.turns : []
          return turns.length === 0 || (continuesPortfolio && !JSON.stringify(turns).includes(marker))
        }
        if (needsInstruction(thread)) {
          const plan = buildPracticeTaskStartPlan({
            runId: binding.runId, definition, workspaceRoot, approvedConfiguration
          })
          // createTarget closes its server. Reading persisted history on the next
          // server does not load the task for turn/start. Empty-task resumes may
          // also fall back to defaults, so reapply the approved Practice settings.
          const resumed = await this.client.request('thread/resume', {
            threadId: binding.threadId,
            cwd: workspaceRoot,
            model: plan.startParams.model,
            serviceTier: plan.startParams.serviceTier,
            approvalPolicy: plan.startParams.approvalPolicy,
            sandbox: plan.startParams.sandbox,
            config: plan.startParams.config
          })
          if (!isRecord(resumed) || !isRecord(resumed.thread)
            || resumed.thread.id !== binding.threadId || !samePath(resumed.thread.cwd, workspaceRoot)) {
            throw new Error('Invalid Executor chat binding')
          }
          validateEffectivePracticeTask({
            effective: parseEffectivePracticeTask(resumed),
            plan, workspaceRoot, samePath, approvedConfiguration
          })
          if (!needsInstruction(resumed.thread)) return
          await this.client.request('turn/start', {
            threadId: binding.threadId,
            input: [{
              type: 'text',
              text: [
                ...(continuesPortfolio ? [marker,
                  'Tiếp tục trong chính task này với các tài liệu đã có; không tạo task hoặc workspace thay thế.',
                  ...(definition.practiceId === 'm3-portfolio-build' ? [
                    'Đọc năm tài liệu planning đã được duyệt làm nguồn yêu cầu. Trước khi viết ứng dụng, xác nhận tác vụ triển khai đầu tiên với người học; không cần first-bounded-task.md. Giữ nguyên ranh giới và các cổng kiểm chứng hiện hành của Module 3.'
                  ] : [])] : []),
                'Thực hiện Practice ' + definition.practiceId + '.',
                'Mục tiêu: ' + definition.objective,
                'Kết quả cần đạt: ' + definition.expectedOutcome,
                'Chỉ làm trong phạm vi Practice và dừng tại mọi điểm cần người học duyệt.',
                ...(definition.practiceId === 'm4-portfolio-release'
                  ? [portfolioReleaseInstructions(releaseSourceCheckpoint)]
                  : definition.practiceId === 'm3-portfolio-build' && isPortfolioBuildPackageVersion(definition.version)
                  ? [PORTFOLIO_BUILD_INSTRUCTIONS]
                  : definition.evidenceProfile === 'planning-package'
                  ? [
                      'Chỉ được thay đổi artifacts/PRD.md và artifacts/implementation-plan.md; không viết implementation code.',
                      'Dùng chính task này cho toàn bộ Practice, phỏng vấn từng câu một, và chờ các nút phê duyệt trong Course Companion. Tin nhắn trong chat không thay thế phê duyệt của người học.'
                    ]
                  : definition.stages
                    ? [
                        'Dùng chính task này cho cả năm stage; không tạo task mới cho từng milestone.',
                        'Dừng sau mỗi stage để Course Companion đối chiếu artifact hiện tại và ghi nhận phê duyệt. Kết quả do Codex tự báo cáo không thay thế bằng chứng tệp được kiểm tra độc lập.',
                        ...(definition.evidenceProfile === 'portfolio-planning'
                          ? [
                              `Chỉ được tạo hoặc sửa các tệp sau: ${definition.stages.flatMap((stage) => stage.requiredArtifactPaths).join(', ')}; ảnh chụp tham chiếu chỉ được lưu dưới planning/reference/screenshots/.`,
                              'Không tạo application code, package manifest, dependency, build output, cấu hình deployment hoặc tệp nào khác. Nếu cần việc ngoài phạm vi, hãy dừng và báo cho người học.'
                            ]
                          : [])
                      ]
                    : [])
              ].join('\n\n')
            }]
          })
        }
      }
    })
  }

  async validateExistingTarget(
    binding: ExecutorChatBinding,
    definition: PracticeDefinition
  ): Promise<boolean> {
    try {
      const workspaceRoot = await this.workspaces.resolve(definition.workspaceKind)
      if (!THREAD_ID.test(binding.threadId)
        || !samePath(binding.workspaceRoot, workspaceRoot)) return false
      return await this.withBootstrap(async () => {
        const read = await this.client.request('thread/read', {
          threadId: binding.threadId,
          includeTurns: false
        })
        return isRecord(read)
          && isRecord(read.thread)
          && read.thread.id === binding.threadId
          && samePath(read.thread.cwd, workspaceRoot)
      })
    } catch {
      return false
    }
  }

  private async waitUntilReadable(
    threadId: string,
    workspaceRoot: string,
    includeTurns: boolean
  ): Promise<Record<string, unknown>> {
    const attempts = Math.max(1, this.discovery.attempts ?? 30)
    const intervalMs = Math.max(0, this.discovery.intervalMs ?? 100)
    const wait = this.discovery.wait ?? defaultWait
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const read = await this.client.request('thread/read', {
          threadId,
          includeTurns
        })
        if (isRecord(read) && isRecord(read.thread) && read.thread.id === threadId &&
          samePath(read.thread.cwd, workspaceRoot)) return read.thread
      } catch {
        // State persistence can briefly lag process startup; retry the exact read only.
      }
      if (attempt + 1 < attempts) await wait(intervalMs)
    }
    throw new Error('Codex could not read the Executor chat after creation')
  }

  async openTarget(binding: ExecutorChatBinding): Promise<void> {
    if (!THREAD_ID.test(binding.threadId)) throw new Error('Invalid Executor chat ID')
    await this.openExternal(`codex://threads/${encodeURIComponent(binding.threadId)}`)
  }

  private async withBootstrap<T>(operation: () => Promise<T>): Promise<T> {
    let result: T | undefined
    let operationFailed = false
    let operationError: unknown
    try {
      result = await operation()
    } catch (error) {
      operationFailed = true
      operationError = error
    }
    let closeError: unknown
    try {
      await this.client.close?.()
    } catch (error) {
      closeError = error
    }
    if (operationFailed) throw operationError
    if (closeError !== undefined) {
      throw new Error('Codex Executor bootstrap did not close', { cause: closeError })
    }
    return result as T
  }
}
import { PORTFOLIO_BUILD_INSTRUCTIONS } from './portfolio-build-instructions'
