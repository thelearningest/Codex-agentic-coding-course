import { execFile } from 'node:child_process'
import { access } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, posix } from 'node:path'
import { promisify } from 'node:util'

const execute = promisify(execFile)
const options = { encoding: 'utf8' as const, windowsHide: true, timeout: 5000, maxBuffer: 16 * 1024 }

type RuntimeDependencies = {
  platform: NodeJS.Platform
  env: NodeJS.ProcessEnv
  home: string
  exists: (path: string) => Promise<boolean>
  run: (command: string, args: string[]) => Promise<string>
}

const defaults: RuntimeDependencies = {
  platform: process.platform,
  env: process.env,
  home: homedir(),
  exists: (path) => access(path).then(() => true, () => false),
  run: async (command, args) => (await execute(command, args, options)).stdout
}

export class CodexRuntimeError extends Error {
  readonly code = 'CODEX_RUNTIME_INCOMPATIBLE'

  constructor(readonly result: CodexRuntimeFailure) {
    super('Codex CLI compatibility check failed: ' + result.status)
  }
}

export const minimumCodexVersion = '0.164.0'
type RuntimeSource = 'codex-desktop' | 'chatgpt-desktop' | 'inherited' | 'standalone'
type RuntimeCandidate = { command: string; source: RuntimeSource }
type CodexRuntimeFailure = { source: RuntimeSource } & (
  { status: 'outdated'; version: string } | { status: 'missing' | 'unverified'; version?: never }
)

// Resolve afresh on each connection: the desktop updater can replace its runtime
// while Course Companion remains open. Never assume PATH tracks desktop updates.
async function findCandidate(deps: RuntimeDependencies): Promise<RuntimeCandidate> {
  if (deps.platform === 'win32') {
    try {
      const location = (await deps.run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
        "Get-AppxPackage -Name OpenAI.Codex | Select-Object -First 1 -ExpandProperty InstallLocation"
      ])).trim()
      const candidate = location ? join(location, 'app', 'resources', 'codex.exe') : ''
      if (candidate && await deps.exists(candidate)) return { command: candidate, source: 'codex-desktop' }
    } catch { /* A standalone CLI installation may be the only available runtime. */ }
  }
  if (deps.platform === 'darwin') {
    for (const root of ['/Applications', posix.join(deps.home, 'Applications')]) {
      for (const name of ['Codex.app', 'ChatGPT.app']) {
        const candidate = posix.join(root, name, 'Contents', 'Resources', 'codex')
        if (await deps.exists(candidate)) {
          return { command: candidate, source: name === 'Codex.app' ? 'codex-desktop' : 'chatgpt-desktop' }
        }
      }
    }
  }
  // An inherited path can still exist after the desktop app has updated. Prefer
  // the current installation above; use the inherited runtime only as a fallback.
  if (deps.env.CODEX_APP_RUNTIME_CLI_PATH
    && await deps.exists(deps.env.CODEX_APP_RUNTIME_CLI_PATH)) {
    return { command: deps.env.CODEX_APP_RUNTIME_CLI_PATH, source: 'inherited' }
  }
  return { command: 'codex', source: 'standalone' }
}

export async function inspectCodexRuntime(deps: RuntimeDependencies = defaults): Promise<
  (RuntimeCandidate & { status: 'ready'; version: string }) | CodexRuntimeFailure
> {
  const { command, source } = await findCandidate(deps)
  let output: string
  try {
    output = await deps.run(command, ['--version'])
  } catch (error) {
    const missing = source === 'standalone' && (error as NodeJS.ErrnoException)?.code === 'ENOENT'
    return { status: missing ? 'missing' : 'unverified', source }
  }
  const match = /^codex-cli ((\d+)\.(\d+)\.\d+(?:[-+][\w.-]+)?)\s*$/m.exec(output)
  if (!match?.[1]) return { status: 'unverified', source }
  const version = match[1]
  const minimumMinor = Number(minimumCodexVersion.split('.')[1])
  if (Number(match[2]) === 0 && Number(match[3]) < minimumMinor) {
    return { status: 'outdated', source, version }
  }
  return { status: 'ready', source, version, command }
}

export async function resolveCodexRuntimeCommand(deps: RuntimeDependencies = defaults): Promise<string> {
  const result = await inspectCodexRuntime(deps)
  if (result.status !== 'ready') throw new CodexRuntimeError(result)
  return result.command
}

export function codexPracticeRecovery(error: unknown): string | undefined {
  if (!(error instanceof CodexRuntimeError)) return undefined
  const { status, source, version } = error.result
  const application = source === 'chatgpt-desktop' ? 'ChatGPT' : 'Codex'
  if (status === 'missing') {
    return 'Chưa tìm thấy Codex để mở phần thực hành. Bạn hãy nhờ Codex trong cuộc trò chuyện thiết lập khóa học hướng dẫn cài bản phù hợp, rồi quay lại thử.'
  }
  if (status === 'outdated') {
    const nextStep = source === 'standalone' || source === 'inherited'
      ? 'Bạn hãy nhờ Codex trong cuộc trò chuyện thiết lập khóa học cập nhật đúng bản đang dùng'
      : `Bạn hãy cập nhật ứng dụng ${application}`
    return `Course Companion đang dùng Codex CLI ${version} để kết nối với Codex. Phần thực hành cần phiên bản ${minimumCodexVersion} trở lên. ${nextStep}, rồi quay lại thử.`
  }
  return 'Course Companion chưa kiểm tra được phiên bản Codex để mở phần thực hành. Bạn hãy nhờ Codex trong cuộc trò chuyện thiết lập khóa học kiểm tra lại, rồi quay lại thử.'
}
