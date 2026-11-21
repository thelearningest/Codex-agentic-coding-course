import { spawn } from 'node:child_process'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import readline from 'node:readline/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'

import {
  buildInstallPlan,
  detectSetup,
  executeInstallPlan,
  minimumNodeVersion,
  nodeDownloadUrl,
  startupCommands
} from './macos-course-startup-core.mjs'

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const appRoot = path.join(repositoryRoot, 'course-companion')

function runProcess(command, args, { cwd, stdio = 'ignore', env, capture = false, onSpawn } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: env ?? process.env,
      shell: false,
      stdio: capture ? ['ignore', 'pipe', 'pipe'] : stdio
    })
    let output = ''
    if (capture) {
      child.stdout.on('data', (chunk) => { output += chunk })
      child.stderr.on('data', (chunk) => { output += chunk })
    }
    if (onSpawn) child.once('spawn', onSpawn)
    child.once('error', reject)
    child.once('exit', (exitCode) => resolve({ exitCode: exitCode ?? 1, output }))
  })
}

async function commandSucceeds(command, args) {
  try {
    const result = await runProcess(command, args)
    return result.exitCode === 0
  } catch {
    return false
  }
}

async function fileExists(targetPath) {
  try {
    await access(targetPath)
    return true
  } catch {
    return false
  }
}

async function confirmInstall(formattedPlan) {
  const terminal = readline.createInterface({ input: process.stdin, output: process.stdout })
  try {
    process.stdout.write(`${formattedPlan}\n\n`)
    const answer = await terminal.question(
      'Nhập y rồi nhấn Enter để tiếp tục, hoặc chỉ nhấn Enter để dừng. [y/N] '
    )
    return /^(y|yes)$/i.test(answer.trim())
  } finally {
    terminal.close()
  }
}

function printWelcome() {
  process.stdout.write(
    [
      '',
      'CONTENT BUILDER ACADEMY',
      'Đang chuẩn bị Course Companion trên máy Mac của bạn.',
      '',
      'Không có gì được cài nếu bạn chưa đồng ý.',
      ''
    ].join('\n')
  )
}

export async function main({ smoke = process.argv.includes('--smoke') } = {}) {
  printWelcome()

  const lockPath = path.join(appRoot, 'package-lock.json')
  const stampPath = path.join(appRoot, 'node_modules', '.course-lock.sha256')
  const electronRuntimePath = path.join(
    appRoot,
    'node_modules',
    'electron',
    'dist',
    'Electron.app',
    'Contents',
    'MacOS',
    'Electron'
  )

  const setupDependencies = {
    platform: process.platform,
    nodeVersion: process.versions.node,
    commandSucceeds,
    fileExists,
    appRoot,
    lockPath,
    stampPath,
    electronRuntimePath,
    readFile
  }
  const report = await detectSetup(setupDependencies)

  if (!report.platformSupported) {
    throw Object.assign(new Error('Trình khởi động này chỉ dành cho macOS.'), {
      code: 'UNSUPPORTED_PLATFORM',
      layer: 'kiểm tra hệ điều hành'
    })
  }
  if (!report.nodeCompatible) {
    throw Object.assign(
      new Error(
        `Máy cần Node.js ${minimumNodeVersion} trở lên. Bản hiện có là ${process.versions.node}.`
      ),
      {
        code: 'PREREQUISITE_MISSING',
        layer: 'kiểm tra Node.js',
        openDownload: true
      }
    )
  }
  if (!report.npmAvailable) {
    throw Object.assign(new Error('Máy chưa có npm, công cụ đi kèm Node.js.'), {
      code: 'PREREQUISITE_MISSING',
      layer: 'kiểm tra npm',
      openDownload: true
    })
  }

  process.stdout.write(`Đã có Node.js ${process.versions.node} và npm.\n`)
  const plan = buildInstallPlan(report)
  if (plan.length > 0) {
    await executeInstallPlan(plan, {
      confirm: confirmInstall,
      run: runProcess,
      writeFile: async (targetPath, contents, encoding) => {
        await mkdir(path.dirname(targetPath), { recursive: true })
        await writeFile(targetPath, contents, encoding)
      }
    })
    const finalReport = await detectSetup(setupDependencies)
    if (!finalReport.lockMatches || !finalReport.electronRuntimeAvailable) {
      throw Object.assign(new Error('Phần mở ứng dụng (Electron) vẫn chưa đầy đủ.'), {
        code: 'INSTALL_FAILED',
        actionId: 'electron-runtime'
      })
    }
  } else {
    process.stdout.write('Các tệp của ứng dụng học đã sẵn sàng.\n')
  }

  if (smoke) process.stdout.write('Running the complete Electron startup rehearsal...\n\n')

  for (const step of startupCommands({ smoke, electronRuntimePath })) {
    if (step.id === 'build') {
      process.stdout.write('Đang chuẩn bị ứng dụng, thường mất khoảng 10 giây...\n')
    }
    const result = await runProcess(step.command, step.args, {
      cwd: appRoot,
      stdio: 'inherit',
      capture: step.quiet,
      onSpawn:
        step.id === 'app'
          ? () =>
              process.stdout.write(
                [
                  '',
                  'Course Companion đang mở trong một cửa sổ riêng.',
                  'Nếu chưa thấy cửa sổ, hãy nhấn Cmd+Tab và chọn Electron.',
                  'Đừng đóng cửa sổ Terminal này khi đang học, vì ứng dụng sẽ tắt theo.',
                  ''
                ].join('\n') + '\n'
              )
          : undefined
    })
    if (result.exitCode !== 0) {
      if (step.quiet && result.output) process.stderr.write(`\n${result.output}\n`)
      throw Object.assign(
        new Error(
          step.id === 'build'
            ? 'Chưa chuẩn bị xong ứng dụng học.'
            : 'Course Companion đã dừng bất ngờ.'
        ),
        {
          code: 'APP_FAILED',
          layer: smoke ? 'Electron rehearsal' : step.id === 'build' ? 'chuẩn bị ứng dụng' : 'Course Companion'
        }
      )
    }
  }

  process.stdout.write(
    smoke
      ? '\nThe macOS startup rehearsal passed.\n'
      : '\nCourse Companion đã đóng. Tiến độ của bạn đã được lưu trên máy. Bạn có thể đóng cửa sổ này.\n'
  )
}

function safeFailure(error) {
  if (error?.code === 'INSTALL_DECLINED') {
    return {
      exitCode: 2,
      layer: 'chuẩn bị tệp',
      recovery: 'Khi sẵn sàng, chạy lại start-course.command và đồng ý với kế hoạch chuẩn bị.'
    }
  }
  if (error?.code === 'INSTALL_FAILED') {
    return {
      exitCode: 4,
      layer: 'chuẩn bị tệp',
      recovery: 'Xem lỗi npm phía trên, rồi chạy lại start-course.command.'
    }
  }
  if (error?.code === 'APP_FAILED') {
    return {
      exitCode: 5,
      layer: error.layer,
      recovery: 'Xem lỗi phía trên, rồi chạy lại start-course.command.'
    }
  }
  return {
    exitCode: 3,
    layer: error?.layer ?? 'kiểm tra công cụ',
    recovery: error?.openDownload
      ? `Trang tải Node.js vừa được mở. Tải bản LTS cho macOS (tệp .pkg), nhấp đúp để cài, rồi chạy lại start-course.command.`
      : `Cài Node.js ${minimumNodeVersion} trở lên từ ${nodeDownloadUrl}, rồi chạy lại start-course.command.`
  }
}

const isDirect =
  process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url

if (isDirect) {
  main().catch((error) => {
    const failure = safeFailure(error)
    if (error?.openDownload) {
      spawn('open', [nodeDownloadUrl], { stdio: 'ignore', detached: true }).on('error', () => {}).unref()
    }
    process.stderr.write(
      `\nChưa mở được Course Companion (bước: ${failure.layer}).\n${error.message}\n${failure.recovery}\n`
    )
    process.exitCode = failure.exitCode
  })
}
