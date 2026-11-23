import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { agentInstallConsent, openCourseWindow } from '../../scripts/agent-launch.mjs'
import { launchElectron } from '../../scripts/setup-and-start.mjs'

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

test('agent waits for the window receipt and leaves the app running when it returns', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'course-agent-test-'))
  let pid
  try {
    await writeFile(path.join(root, 'index.cjs'), `
      const fs = require('node:fs')
      const path = require('node:path')
      const ticket = process.argv[2].slice('--course-launch='.length)
      fs.writeFileSync('pid', String(process.pid))
      setTimeout(() => fs.writeFileSync(path.join(require('node:os').tmpdir(), ticket, 'visible'), String(process.pid)), 200)
      setTimeout(() => {}, 10000)
    `)
    await writeFile(path.join(root, 'package.json'), JSON.stringify({ main: 'index.cjs' }))
    assert.equal(await openCourseWindow(process.execPath, root), 0)
    pid = Number(await readFile(path.join(root, 'pid'), 'utf8'))
    assert.doesNotThrow(() => process.kill(pid, 0))
  } finally {
    if (pid) process.kill(pid)
    await rm(root, { recursive: true, force: true })
  }
})

test('agent reports an unavailable runtime without claiming a window opened', async () => {
  await assert.rejects(openCourseWindow(path.join(tmpdir(), 'nonexistent-course-runtime'), tmpdir()), { code: 'ENOENT' })
})
