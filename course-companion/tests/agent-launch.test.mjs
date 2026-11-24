import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { agentInstallConsent, openCourseWindow } from '../../scripts/agent-launch.mjs'
import { launchElectron, main as runWindowsSetup } from '../../scripts/setup-and-start.mjs'

test('agent install consent requires both flags', () => {
  for (const args of [[], ['--agent'], ['--install']]) {
    assert.equal(agentInstallConsent('Course install plan', args), false)
  }
  assert.equal(agentInstallConsent('Course install plan', ['--agent', '--install']), true)
})

test('Windows agent builds before opening the course window with its own runtime', async () => {
  const calls = []
  const root = path.resolve('course folder')
  const result = await launchElectron({
    root, agent: true,
    run: async (cmd, args, options) => {
      calls.push([cmd, ...args, options.cwd])
      return { exitCode: 0 }
    },
    openWindow: async (runtime, cwd) => { calls.push([runtime, cwd]); return 0 }
  })
  assert.equal(result, 0)
  assert.deepEqual(calls, [
    ['npm', 'run', 'build', root],
    [path.join(root, 'node_modules', 'electron', 'dist', 'electron.exe'), root]
  ])
})

test('Windows agent reports a failed build without launching', async () => {
  assert.equal(await launchElectron({
    agent: true, run: async () => ({ exitCode: 1 }), openWindow: assert.fail
  }), 1)
})

test('Windows agent setup opens lessons even when its launcher cannot find Codex', async () => {
  const lock = '{"lockfileVersion":3}'
  const fingerprint = createHash('sha256').update(lock).digest('hex')
  const commands = []
  let opened = false
  await runWindowsSetup({
    agent: true,
    output: { write() {} },
    readFirstRun: assert.fail,
    execute: assert.fail,
    launch: async ({ agent }) => {
      assert.equal(agent, true)
      opened = true
      return 0
    },
    dependencyOverrides: {
      platform: 'win32',
      nodeVersion: '22.12.0',
      fileExists: async () => true,
      readFile: async (path) => path.endsWith('.sha256') ? fingerprint : lock,
      commandExists: async (command) => {
        commands.push(command)
        return command === 'npm'
      },
      commandSucceeds: assert.fail
    }
  })
  assert.equal(opened, true)
  assert.deepEqual(commands, ['npm', 'npm'])
})

test('agent reports a visible window separately from an outdated CLI and sees a compatible version on retry', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'course-agent-test-'))
  const pids = []
  try {
    await writeFile(path.join(root, 'index.cjs'), `
      const fs = require('node:fs')
      const path = require('node:path')
      const ticket = process.argv[2].slice('--course-launch='.length)
      fs.writeFileSync('pid', String(process.pid))
      const receipt = path.join(require('node:os').tmpdir(), ticket)
      setTimeout(() => fs.writeFileSync(path.join(receipt, 'visible'), String(process.pid)), 200)
      setTimeout(() => fs.copyFileSync('readiness.json', path.join(receipt, 'practice-runtime')), 400)
      setTimeout(() => {}, 10000)
    `)
    await writeFile(path.join(root, 'package.json'), JSON.stringify({ main: 'index.cjs' }))
    for (const [status, version] of [['outdated', '0.147.0'], ['ready', '0.164.0']]) {
      const readiness = { status, version, requiredVersion: '0.164.0', source: 'codex-desktop' }
      await writeFile(path.join(root, 'readiness.json'), JSON.stringify(readiness))
      const output = []
      assert.equal(await openCourseWindow(process.execPath, root, { report: (line) => output.push(line) }), 0)
      const pid = Number(await readFile(path.join(root, 'pid'), 'utf8'))
      pids.push(pid)
      assert.doesNotThrow(() => process.kill(pid, 0))
      assert.deepEqual(output, ['COURSE_WINDOW_VISIBLE ' + pid, 'COURSE_PRACTICE_RUNTIME ' + JSON.stringify(readiness)])
    }
  } finally {
    for (const pid of pids) process.kill(pid)
    await rm(root, { recursive: true, force: true })
  }
})

test('agent reports an unavailable runtime without claiming a window opened', async () => {
  await assert.rejects(openCourseWindow(path.join(tmpdir(), 'nonexistent-course-runtime'), tmpdir()), { code: 'ENOENT' })
})
