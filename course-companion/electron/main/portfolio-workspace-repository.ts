import { constants } from 'node:fs'
import {
  access,
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  stat,
  writeFile
} from 'node:fs/promises'
import { basename, dirname, isAbsolute, join, relative, resolve, sep, win32 } from 'node:path'
import type {
  PortfolioCodexProjectRequest,
  PortfolioCodexProject,
  PortfolioWorkspaceRequest,
  PortfolioWorkspaceView
} from '../../shared/contracts'
import { portfolioAgentsFileName, portfolioAgentsTemplate } from '../../shared/portfolio-agents-template'

const SAFE_ID = /^[A-Za-z0-9_-]{1,160}$/
const STATE_SCHEMA_VERSION = 1

type WorkspaceRecord = {
  canonicalPath: string
  selectedAt: string
  planningApprovedAt: string | null
  codexProjectConfirmedAt?: string
  codexProject?: PortfolioCodexProject
}

type WorkspaceState = {
  schemaVersion: typeof STATE_SCHEMA_VERSION
  workspaces: Record<string, WorkspaceRecord>
}

export type PathOperations = Pick<typeof import('node:path'), 'relative' | 'isAbsolute' | 'sep'>

export function isPathWithin(
  root: string,
  candidate: string,
  pathOperations: PathOperations = { relative, isAbsolute, sep }
): boolean {
  const pathFromRoot = pathOperations.relative(root, candidate)
  return pathFromRoot === '' || (
    !pathFromRoot.startsWith(`..${pathOperations.sep}`)
    && pathFromRoot !== '..'
    && !pathOperations.isAbsolute(pathFromRoot)
  )
}

export const windowsPathOperations: PathOperations = {
  relative: win32.relative,
  isAbsolute: win32.isAbsolute,
  sep: win32.sep
}

export type PortfolioWorkspaceErrorCode =
  | 'invalid-course-run'
  | 'course-repository'
  | 'application-data'
  | 'not-directory'
  | 'permission-denied'
  | 'not-empty'
  | 'path-changed'
  | 'unsafe-planning-directory'

export class PortfolioWorkspaceError extends Error {
  constructor(
    readonly code: PortfolioWorkspaceErrorCode,
    message: string
  ) {
    super(message)
    this.name = 'PortfolioWorkspaceError'
  }
}

function emptyState(): WorkspaceState {
  return { schemaVersion: STATE_SCHEMA_VERSION, workspaces: {} }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isWorkspaceState(value: unknown): value is WorkspaceState {
  if (!isRecord(value) || value.schemaVersion !== STATE_SCHEMA_VERSION || !isRecord(value.workspaces)) {
    return false
  }
  return Object.entries(value.workspaces).every(([courseRunId, record]) =>
    SAFE_ID.test(courseRunId)
    && isRecord(record)
    && typeof record.canonicalPath === 'string'
    && isAbsolute(record.canonicalPath)
    && typeof record.selectedAt === 'string'
    && !Number.isNaN(Date.parse(record.selectedAt))
    && (record.planningApprovedAt === null
      || (typeof record.planningApprovedAt === 'string'
        && !Number.isNaN(Date.parse(record.planningApprovedAt))))
    && (record.codexProjectConfirmedAt === undefined
      || (typeof record.codexProjectConfirmedAt === 'string'
        && !Number.isNaN(Date.parse(record.codexProjectConfirmedAt))))
    && (record.codexProject === undefined || (isRecord(record.codexProject)
      && typeof record.codexProject.id === 'string' && SAFE_ID.test(record.codexProject.id)
      && typeof record.codexProject.name === 'string' && record.codexProject.name.length > 0
      && record.codexProject.name.length <= 500 && typeof record.codexProject.registeredAt === 'string'
      && !Number.isNaN(Date.parse(record.codexProject.registeredAt))))
  )
}

function errorCode(error: unknown): string | undefined {
  return isRecord(error) && typeof error.code === 'string' ? error.code : undefined
}

async function existingAgentsFile(canonicalPath: string): Promise<string | undefined> {
  const agentsPath = join(canonicalPath, portfolioAgentsFileName)
  try {
    const info = await lstat(agentsPath)
    return info.isFile() && !info.isSymbolicLink() ? agentsPath : undefined
  } catch (error) {
    if (errorCode(error) === 'ENOENT') return undefined
    throw error
  }
}

function validateRequest(request: PortfolioWorkspaceRequest): void {
  if (!isRecord(request) || !SAFE_ID.test(String(request.courseRunId))) {
    throw new PortfolioWorkspaceError('invalid-course-run', 'Không thể xác định hành trình học hiện tại.')
  }
}

export class PortfolioWorkspaceRepository {
  private readonly statePath: string
  private readonly temporaryPath: string
  private operationQueue: Promise<void> = Promise.resolve()

  constructor(
    private readonly dataDirectory: string,
    private readonly courseRoot: string,
    private readonly now: () => Date = () => new Date()
  ) {
    this.statePath = join(dataDirectory, 'portfolio-workspaces.json')
    this.temporaryPath = join(dataDirectory, 'portfolio-workspaces.json.tmp')
  }

  load(request: PortfolioWorkspaceRequest): Promise<PortfolioWorkspaceView> {
    validateRequest(request)
    return this.runExclusive(async () => {
      const state = await this.readState()
      const record = state.workspaces[request.courseRunId]
      if (!record) return this.view(request.courseRunId, 'unselected')
      return this.inspectRecord(request.courseRunId, record)
    })
  }

  selectPath(
    request: PortfolioWorkspaceRequest,
    selectedPath: string
  ): Promise<PortfolioWorkspaceView> {
    validateRequest(request)
    return this.runExclusive(async () => {
      const canonicalPath = await this.validateNewSelection(selectedPath)
      const state = await this.readState()
      const selectedAt = this.now().toISOString()
      state.workspaces[request.courseRunId] = {
        canonicalPath,
        selectedAt,
        planningApprovedAt: null
      }
      await this.writeState(state)
      return this.view(request.courseRunId, 'awaiting-confirmation', {
        canonicalPath,
        message: 'Hãy kiểm tra đường dẫn trước khi tạo thư mục planning.'
      })
    })
  }

  confirmPlanning(request: PortfolioWorkspaceRequest): Promise<PortfolioWorkspaceView> {
    validateRequest(request)
    return this.runExclusive(async () => {
      const state = await this.readState()
      const record = state.workspaces[request.courseRunId]
      if (!record) return this.view(request.courseRunId, 'unselected')

      const inspected = await this.inspectRecord(request.courseRunId, record)
      if (inspected.status === 'missing' || inspected.status === 'permission-denied') return inspected
      const canonicalPath = record.canonicalPath
      const entries = (await readdir(canonicalPath)).filter((entry) => entry !== '.DS_Store')
      const planningPath = join(canonicalPath, 'planning')

      if (!record.planningApprovedAt && entries.some((entry) => entry !== 'planning' && entry !== portfolioAgentsFileName)) {
        throw new PortfolioWorkspaceError(
          'not-empty',
          'Thư mục này đã có nội dung khác. Hãy chọn một thư mục trống dành riêng cho portfolio.'
        )
      }

      try {
        const planningInfo = await lstat(planningPath)
        if (!planningInfo.isDirectory() || planningInfo.isSymbolicLink()) {
          throw new PortfolioWorkspaceError(
            'unsafe-planning-directory',
            'Đường dẫn planning hiện tại không phải một thư mục an toàn.'
          )
        }
      } catch (error) {
        if (errorCode(error) !== 'ENOENT') throw error
        await mkdir(planningPath)
      }

      // Codex reads AGENTS.md from the portfolio root. Never overwrite a learner-edited copy.
      try {
        await writeFile(join(canonicalPath, portfolioAgentsFileName), portfolioAgentsTemplate, { encoding: 'utf8', flag: 'wx' })
      } catch (error) {
        if (errorCode(error) !== 'EEXIST') throw error
      }

      record.planningApprovedAt = this.now().toISOString()
      await this.writeState(state)
      return this.view(request.courseRunId, 'ready', {
        canonicalPath,
        planningPath,
        agentsPath: await existingAgentsFile(canonicalPath),
        codexProject: record.codexProject,
        message: 'Portfolio đã sẵn sàng cho phần lập kế hoạch.'
      })
    })
  }

  reset(): Promise<void> {
    return this.runExclusive(async () => {
      await Promise.all([
        rm(this.statePath, { force: true }),
        rm(this.temporaryPath, { force: true })
      ])
    })
  }

  saveCodexProject(request: PortfolioCodexProjectRequest, project: { id: string; name: string }): Promise<PortfolioWorkspaceView> {
    validateRequest(request)
    if (!SAFE_ID.test(project.id) || !project.name.trim() || project.name.length > 500) {
      throw new Error('Invalid Codex project binding')
    }
    return this.runExclusive(async () => {
      const state = await this.readState()
      const record = state.workspaces[request.courseRunId]
      if (!record || request.expectedPath !== record.canonicalPath) {
        throw new PortfolioWorkspaceError('path-changed', 'Thư mục portfolio đã thay đổi. Hãy kiểm tra lại đường dẫn.')
      }
      const inspected = await this.inspectRecord(request.courseRunId, record)
      if (inspected.status !== 'ready') return inspected
      record.codexProject = { ...project, registeredAt: record.codexProject?.id === project.id
        ? record.codexProject.registeredAt : this.now().toISOString() }
      await this.writeState(state)
      return this.inspectRecord(request.courseRunId, record)
    })
  }

  private async validateNewSelection(selectedPath: string): Promise<string> {
    const configuredPath = resolve(selectedPath)
    await mkdir(this.dataDirectory, { recursive: true })
    if (isPathWithin(resolve(this.courseRoot), configuredPath)) {
      throw new PortfolioWorkspaceError(
        'course-repository',
        'Portfolio phải nằm ngoài thư mục của khóa học.'
      )
    }
    if (isPathWithin(resolve(this.dataDirectory), configuredPath)) {
      throw new PortfolioWorkspaceError(
        'application-data',
        'Không thể dùng thư mục dữ liệu của Course Companion làm portfolio.'
      )
    }
    let canonicalPath: string
    try {
      canonicalPath = await realpath(configuredPath)
      const info = await stat(canonicalPath)
      if (!info.isDirectory()) {
        throw new PortfolioWorkspaceError('not-directory', 'Hãy chọn một thư mục, không chọn một tệp.')
      }
      await access(canonicalPath, constants.R_OK | constants.W_OK)
    } catch (error) {
      if (error instanceof PortfolioWorkspaceError) throw error
      if (errorCode(error) === 'EACCES' || errorCode(error) === 'EPERM') {
        throw new PortfolioWorkspaceError(
          'permission-denied',
          'Course Companion chưa có quyền đọc và ghi trong thư mục này.'
        )
      }
      throw error
    }

    const [canonicalCourseRoot, canonicalDataDirectory] = await Promise.all([
      realpath(resolve(this.courseRoot)),
      realpath(resolve(this.dataDirectory))
    ])
    if (isPathWithin(canonicalCourseRoot, canonicalPath)) {
      throw new PortfolioWorkspaceError(
        'course-repository',
        'Portfolio phải nằm ngoài thư mục của khóa học.'
      )
    }
    if (isPathWithin(canonicalDataDirectory, canonicalPath)) {
      throw new PortfolioWorkspaceError(
        'application-data',
        'Không thể dùng thư mục dữ liệu của Course Companion làm portfolio.'
      )
    }

    const unrelatedEntries = (await readdir(canonicalPath)).filter((entry) => entry !== '.DS_Store')
    if (unrelatedEntries.length > 0) {
      throw new PortfolioWorkspaceError(
        'not-empty',
        'Thư mục này đã có nội dung. Hãy chọn một thư mục trống dành riêng cho portfolio.'
      )
    }
    return canonicalPath
  }

  private async inspectRecord(
    courseRunId: string,
    record: WorkspaceRecord
  ): Promise<PortfolioWorkspaceView> {
    try {
      const canonicalPath = await realpath(record.canonicalPath)
      if (canonicalPath !== record.canonicalPath) {
        return this.view(courseRunId, 'missing', {
          canonicalPath: record.canonicalPath,
          message: 'Thư mục portfolio đã được di chuyển hoặc thay đổi đường dẫn.'
        })
      }
      const info = await stat(canonicalPath)
      if (!info.isDirectory()) {
        return this.view(courseRunId, 'missing', {
          canonicalPath,
          message: 'Đường dẫn portfolio không còn là một thư mục.'
        })
      }
      await access(canonicalPath, constants.R_OK | constants.W_OK)
      if (!record.planningApprovedAt) {
        return this.view(courseRunId, 'awaiting-confirmation', {
          canonicalPath,
          message: 'Hãy kiểm tra đường dẫn trước khi tạo thư mục planning.'
        })
      }

      const planningPath = join(canonicalPath, 'planning')
      const planningInfo = await lstat(planningPath)
      if (!planningInfo.isDirectory() || planningInfo.isSymbolicLink()) {
        return this.view(courseRunId, 'missing', {
          canonicalPath,
          message: 'Không tìm thấy thư mục planning đã được xác nhận.'
        })
      }
      return this.view(courseRunId, 'ready', {
        canonicalPath,
        planningPath,
        agentsPath: await existingAgentsFile(canonicalPath),
        codexProject: record.codexProject,
        message: 'Portfolio đã sẵn sàng cho phần lập kế hoạch.'
      })
    } catch (error) {
      if (errorCode(error) === 'EACCES' || errorCode(error) === 'EPERM') {
        return this.view(courseRunId, 'permission-denied', {
          canonicalPath: record.canonicalPath,
          message: 'Course Companion không còn quyền truy cập thư mục portfolio.'
        })
      }
      if (errorCode(error) === 'ENOENT') {
        return this.view(courseRunId, 'missing', {
          canonicalPath: record.canonicalPath,
          message: 'Không tìm thấy thư mục portfolio đã chọn.'
        })
      }
      throw error
    }
  }

  private view(
    courseRunId: string,
    status: PortfolioWorkspaceView['status'],
    options: {
      canonicalPath?: string
      planningPath?: string
      agentsPath?: string
      codexProject?: PortfolioCodexProject
      message?: string
    } = {}
  ): PortfolioWorkspaceView {
    return {
      schemaVersion: 1,
      courseRunId,
      status,
      ...(options.canonicalPath
        ? {
            selectedPath: options.canonicalPath,
            folderName: basename(options.canonicalPath)
          }
        : {}),
      ...(options.planningPath ? { planningPath: options.planningPath } : {}),
      ...(options.agentsPath ? { agentsPath: options.agentsPath } : {}),
      ...(options.codexProject ? { codexProject: structuredClone(options.codexProject) } : {}),
      observedAt: this.now().toISOString(),
      message: options.message ?? 'Chọn một thư mục trống dành riêng cho portfolio.',
      canChoose: status !== 'ready',
      canConfirmPlanning: status === 'awaiting-confirmation'
    }
  }

  private async readState(): Promise<WorkspaceState> {
    try {
      const parsed: unknown = JSON.parse(await readFile(this.statePath, 'utf8'))
      if (!isWorkspaceState(parsed)) throw new Error('Invalid portfolio workspace state')
      return structuredClone(parsed)
    } catch (error) {
      if (errorCode(error) === 'ENOENT') return emptyState()
      throw error
    }
  }

  private async writeState(state: WorkspaceState): Promise<void> {
    await mkdir(dirname(this.statePath), { recursive: true })
    await writeFile(this.temporaryPath, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
    await rename(this.temporaryPath, this.statePath)
  }

  private runExclusive<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.operationQueue.then(operation, operation)
    this.operationQueue = result.then(
      () => undefined,
      () => undefined
    )
    return result
  }
}
