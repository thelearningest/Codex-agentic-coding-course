import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import readline from 'node:readline'
import { resolveCodexRuntimeCommand } from './codex-runtime.ts'

type PendingRequest = {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
  timeout: ReturnType<typeof setTimeout>
}

type JsonRpcMessage = {
  id?: number | string
  result?: unknown
  error?: unknown
  method?: string
  params?: unknown
}

export type CodexEffectiveThreadSettings = {
  thread: { id: string }
  cwd: string
  model: string
  serviceTier: string | null
  approvalPolicy: unknown
  sandbox: unknown
  reasoningEffort: string | null
  activePermissionProfile?: unknown
}

export type CodexThreadSettingsUpdated = {
  threadId: string
  threadSettings: {
    cwd: string
    model: string
    serviceTier: string | null
    approvalPolicy: unknown
    sandboxPolicy: unknown
    effort: string | null
    activePermissionProfile: unknown
  }
}

export type CodexNotification = { method: string; params?: unknown; emittedAtMs?: number }
export type CodexConnectionState = 'connecting' | 'connected' | 'disconnected'
export type CodexNotificationListener = (notification: CodexNotification) => void
export type CodexConnectionListener = (state: CodexConnectionState) => void

export type CodexAppServerLaunchOptions = {
  command?: string
  env?: NodeJS.ProcessEnv
  clientName?: string
  experimentalApi?: boolean
}

export type CodexClientError = Error & { code: string; detail?: string; rpcCode?: number }

const APP_SERVER_STOP_GRACE_MS = 1_000
const APP_SERVER_STOP_TIMEOUT_MS = 5_000

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function safeRpcDetail(value: unknown): string | undefined {
  const item = record(value)
  const raw = typeof item?.message === 'string' ? item.message : ''
  if (!raw) return undefined
  const redacted = raw
    .replace(/[A-Za-z]:[\\/][^\s"']+/g, '<path>')
    .replace(/(?:bearer|token|api[_-]?key)\s*[:=]?\s*[^\s,;]+/gi, '<credential>')
    .replaceAll(/\s+/g, ' ')
    .trim()
  return [...redacted].slice(0, 300).join('')
}

function typedError(code: string, message: string, detail?: string): CodexClientError {
  return Object.assign(new Error(detail ? `${message}: ${detail}` : message), { code, detail })
}

export class CodexAppServerClient {
  private process: ChildProcessWithoutNullStreams | null = null
  private lines: readline.Interface | null = null
  private initialized = false
  private nextId = 1
  private pending = new Map<number, PendingRequest>()
  private notificationListeners = new Set<CodexNotificationListener>()
  private connectionListeners = new Set<CodexConnectionListener>()
  private connectionState: CodexConnectionState = 'disconnected'
  private readonly launch: CodexAppServerLaunchOptions

  constructor(launch: CodexAppServerLaunchOptions = {}) {
    this.launch = launch
  }

  async start(): Promise<void> {
    if (this.process) throw typedError('APP_SERVER_ALREADY_STARTED', 'Codex App Server is already running')
    const command = this.launch.command ?? await resolveCodexRuntimeCommand()
    this.setConnectionState('connecting')
    const child = spawn(command, ['app-server'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
      env: this.launch.env ?? process.env
    })
    this.process = child
    child.stderr.resume()
    this.lines = readline.createInterface({ input: child.stdout })
    this.lines.on('line', (line) => this.handleLine(line))
    child.once('exit', () => this.handleExit(child))
    child.once('error', () => this.handleExit(child))
    try {
      await this.rawRequest('initialize', {
        ...(this.launch.experimentalApi ? { capabilities: { experimentalApi: true } } : {}),
        clientInfo: {
          name: this.launch.clientName ?? 'content_builder_academy_course_companion',
          title: 'Content Builder Academy Course Companion',
          version: '0.1.0'
        }
      })
      this.write({ method: 'initialized', params: {} })
      this.initialized = true
      this.setConnectionState('connected')
    } catch (error) {
      await this.stop()
      throw error
    }
  }

  onNotification(listener: CodexNotificationListener): () => void {
    this.notificationListeners.add(listener)
    return () => this.notificationListeners.delete(listener)
  }

  onConnectionState(listener: CodexConnectionListener): () => void {
    this.connectionListeners.add(listener)
    listener(this.connectionState)
    return () => this.connectionListeners.delete(listener)
  }

  request(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    if (!this.initialized) {
      return Promise.reject(
        typedError('APP_SERVER_NOT_INITIALIZED', 'Codex App Server is not initialized')
      )
    }
    return this.rawRequest(method, params)
  }

  async stop(): Promise<void> {
    const child = this.process
    this.initialized = false
    this.process = null
    this.lines?.close()
    this.lines = null
    this.rejectPending(typedError('APP_SERVER_STOPPED', 'Codex App Server stopped'))
    this.setConnectionState('disconnected')
    if (!child || child.exitCode !== null) return
    await new Promise<void>((resolve, reject) => {
      let settled = false
      const forceKill = setTimeout(() => {
        if (!settled && child.exitCode === null) child.kill()
      }, APP_SERVER_STOP_GRACE_MS)
      const timeout = setTimeout(() => {
        cleanup()
        reject(typedError(
          'APP_SERVER_STOP_TIMEOUT',
          'Codex App Server did not stop in time'
        ))
      }, APP_SERVER_STOP_TIMEOUT_MS)
      const cleanup = (): void => {
        if (settled) return
        settled = true
        clearTimeout(timeout)
        clearTimeout(forceKill)
        child.off('exit', finish)
        child.off('close', finish)
      }
      const finish = (): void => {
        if (settled) return
        cleanup()
        resolve()
      }
      child.once('exit', finish)
      child.once('close', finish)
      if (child.exitCode !== null) {
        finish()
        return
      }
      try {
        child.stdin.end()
      } catch {
        // The exit/error listeners above remain the source of truth for ownership release.
      }
    })
  }

  private rawRequest(method: string, params: Record<string, unknown>): Promise<unknown> {
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!this.pending.delete(id)) return
        reject(typedError('APP_SERVER_REQUEST_TIMEOUT', `Codex App Server request timed out: ${method}`))
      }, 30_000)
      this.pending.set(id, { resolve, reject, timeout })
      try {
        this.write({ id, method, params })
      } catch {
        this.pending.delete(id)
        clearTimeout(timeout)
        reject(typedError('APP_SERVER_WRITE_FAILED', `Could not send App Server request: ${method}`))
      }
    })
  }

  private write(message: Record<string, unknown>): void {
    if (!this.process?.stdin.writable) {
      throw typedError('APP_SERVER_DISCONNECTED', 'Codex App Server is disconnected')
    }
    this.process.stdin.write(`${JSON.stringify(message)}\n`)
  }

  private handleLine(line: string): void {
    let message: JsonRpcMessage
    try {
      message = JSON.parse(line) as JsonRpcMessage
    } catch {
      return
    }
    if (typeof message.method === 'string' && message.method.length <= 200) {
      const notification = {
        method: message.method,
        params: message.params,
        ...(typeof (message as { emittedAtMs?: unknown }).emittedAtMs === 'number'
          ? { emittedAtMs: (message as { emittedAtMs: number }).emittedAtMs }
          : {})
      }
      if (typeof message.id === 'string' || Number.isSafeInteger(message.id)) {
        try {
          this.write({
            id: message.id,
            error: { code: -32601, message: 'Course Companion does not permit App Server callbacks' }
          })
        } catch {
          // A disconnected transport will reject the active turn separately.
        }
      }
      for (const listener of this.notificationListeners) {
        try {
          listener(notification)
        } catch {
          // Notification consumers are isolated from the App Server transport.
        }
      }
      return
    }
    if (Number.isSafeInteger(message.id)) {
      const id = Number(message.id)
      const pending = this.pending.get(id)
      if (!pending) return
      this.pending.delete(id)
      clearTimeout(pending.timeout)
      if (message.error !== undefined) {
        const failure = typedError('APP_SERVER_REQUEST_FAILED', 'Codex App Server request failed', safeRpcDetail(message.error))
        const rpcCode = record(message.error)?.code
        if (typeof rpcCode === 'number' && Number.isSafeInteger(rpcCode)) failure.rpcCode = rpcCode
        pending.reject(failure)
      } else {
        pending.resolve(message.result)
      }
      return
    }
  }

  private handleExit(child: ChildProcessWithoutNullStreams): void {
    if (child !== this.process) return
    this.process = null
    this.initialized = false
    this.lines?.close()
    this.lines = null
    this.rejectPending(typedError('APP_SERVER_EXITED', 'Codex App Server exited unexpectedly'))
    this.setConnectionState('disconnected')
  }

  private setConnectionState(state: CodexConnectionState): void {
    if (this.connectionState === state) return
    this.connectionState = state
    for (const listener of this.connectionListeners) {
      try {
        listener(state)
      } catch {
        // Connection consumers are isolated from the App Server transport.
      }
    }
  }

  private rejectPending(error: Error): void {
    for (const request of this.pending.values()) {
      clearTimeout(request.timeout)
      request.reject(error)
    }
    this.pending.clear()
  }
}
