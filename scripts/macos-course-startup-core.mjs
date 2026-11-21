import { createHash } from 'node:crypto'
import { readFile as readFileDefault } from 'node:fs/promises'

export const minimumNodeMajor = 22
export const minimumNodeMinor = 12
export const minimumNodeVersion = `${minimumNodeMajor}.${minimumNodeMinor}`
export const nodeDownloadUrl = 'https://nodejs.org/en/download'

export function nodeMajor(version) {
  const match = String(version ?? '').match(/^v?(\d+)/)
  return match ? Number(match[1]) : 0
}

// Vite and electron-vite need Node.js 22.12 or newer, not just any 22.x.
export function nodeVersionSupported(version) {
  const match = String(version ?? '').match(/^v?(\d+)\.(\d+)/)
  if (!match) return false
  const [major, minor] = [Number(match[1]), Number(match[2])]
  return major > minimumNodeMajor || (major === minimumNodeMajor && minor >= minimumNodeMinor)
}

async function readOptional(targetPath, readFile) {
  try {
    return await readFile(targetPath, 'utf8')
  } catch (error) {
    if (error?.code === 'ENOENT') return null
    throw error
  }
}

export async function packageLockFingerprint(
  lockPath,
  { readFile = readFileDefault } = {}
) {
  const contents = await readFile(lockPath)
  return createHash('sha256').update(contents).digest('hex')
}

export async function detectSetup({
  platform,
  nodeVersion,
  commandSucceeds,
  fileExists,
  appRoot,
  lockPath,
  stampPath,
  electronRuntimePath,
  readFile
}) {
  const [npmAvailable, lockFingerprint, electronRuntimeAvailable] = await Promise.all([
    commandSucceeds('npm', ['--version']),
    packageLockFingerprint(lockPath, { readFile }),
    fileExists(electronRuntimePath)
  ])
  const installedFingerprint = await readOptional(stampPath, readFile)

  return Object.freeze({
    platformSupported: platform === 'darwin',
    nodeMajor: nodeMajor(nodeVersion),
    nodeCompatible: nodeVersionSupported(nodeVersion),
    npmAvailable,
    electronRuntimeAvailable,
    electronRuntimePath,
    lockFingerprint,
    installedFingerprint: installedFingerprint?.trim() ?? null,
    lockMatches: installedFingerprint?.trim() === lockFingerprint,
    appRoot,
    lockPath,
    stampPath
  })
}

export function buildInstallPlan(report) {
  if (report.lockMatches && report.electronRuntimeAvailable) return []

  const actions = []
  if (!report.lockMatches) {
    actions.push({
      id: 'course-companion-packages',
      title: 'Tệp của ứng dụng học',
      reason: 'Tải đúng các thư viện mà ứng dụng học cần, theo danh sách khóa học đã chốt.',
      scope: 'Chỉ lưu trong thư mục course-companion',
      command: 'npm',
      args: ['ci', '--no-audit', '--no-fund'],
      cwd: report.appRoot
    })
  }

  actions.push({
    id: 'electron-runtime',
    title: 'Phần mở ứng dụng (Electron)',
    reason: 'Kiểm tra hoặc tải phần giúp mở ứng dụng học trên macOS, đúng phiên bản khóa học dùng.',
    scope: 'Chỉ lưu trong thư mục course-companion/node_modules',
    command: 'node',
    args: ['node_modules/electron/install.js'],
    cwd: report.appRoot,
    fingerprint: report.lockFingerprint,
    stampPath: report.stampPath
  })

  return actions
}

function displayCommand(action) {
  return [action.command, ...action.args].join(' ')
}

export function formatInstallPlan(actions) {
  const lines = [
    'Để mở Course Companion, máy cần chuẩn bị thêm:',
    'Lần đầu có thể tải khoảng 220 MB và mất vài phút. Việc này không thay đổi phần khác trên máy.'
  ]

  for (const action of actions) {
    lines.push(
      '',
      `[${action.title ?? action.id}]`,
      `Lý do: ${action.reason}`,
      `Lưu ở: ${action.scope}`,
      `Lệnh: ${displayCommand(action)}`,
      `Thư mục: ${action.cwd}`
    )
  }

  return lines.join('\n')
}

export async function executeInstallPlan(
  actions,
  { confirm, run, writeFile }
) {
  if (actions.length === 0) return

  const approved = await confirm(formatInstallPlan(actions))
  if (!approved) {
    const error = new Error('Installation declined.')
    error.code = 'INSTALL_DECLINED'
    throw error
  }

  for (const action of actions) {
    let result
    try {
      result = await run(action.command, action.args, {
        cwd: action.cwd,
        stdio: 'inherit'
      })
    } catch {
      const error = new Error(`Installation action failed: ${action.id}`)
      error.code = 'INSTALL_FAILED'
      error.actionId = action.id
      throw error
    }

    if (result?.exitCode !== 0) {
      const error = new Error(`Installation action failed: ${action.id}`)
      error.code = 'INSTALL_FAILED'
      error.actionId = action.id
      throw error
    }

    if (action.stampPath && action.fingerprint) {
      await writeFile(action.stampPath, `${action.fingerprint}\n`, 'utf8')
    }
  }
}

// Learners get a quiet build and then the app; rehearsals run the full Electron suite.
export function startupCommands({ smoke = false, electronRuntimePath } = {}) {
  if (smoke) return [{ id: 'rehearsal', command: 'npm', args: ['run', 'test:electron'], quiet: false }]
  return [
    { id: 'build', command: 'npm', args: ['run', 'build', '--silent'], quiet: true },
    { id: 'app', command: electronRuntimePath, args: ['.'], quiet: false }
  ]
}
