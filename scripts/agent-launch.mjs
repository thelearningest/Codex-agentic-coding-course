import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

// With no install consent, report the plan and return control to the agent.
export function agentInstallConsent(plan, args = process.argv.slice(2)) {
  console.log(plan)
  return args.includes('--agent') && args.includes('--install')
}

export async function openCourseWindow(runtime, root) {
  const directory = await mkdtemp(join(tmpdir(), 'course-launch-'))
  try {
    const env = { ...process.env }
    delete env.ELECTRON_RUN_AS_NODE
    const child = spawn(runtime, ['.', '--course-launch=' + basename(directory)], {
      cwd: root, env, detached: true, stdio: 'ignore', windowsHide: false
    })
    let failure
    child.once('error', (error) => { failure = error })
    child.once('exit', (code, signal) => {
      // A second instance exits successfully after forwarding the launch request.
      if (code !== 0) failure = new Error('Electron exited: ' + (signal ?? code))
    })
    child.unref()
    const deadline = Date.now() + 60_000
    while (Date.now() < deadline) {
      if (failure) throw failure
      try {
        const pid = (await readFile(join(directory, 'visible'), 'utf8')).trim()
        if (/^[1-9]\d*$/.test(pid)) {
          console.log('COURSE_WINDOW_VISIBLE ' + pid)
          return 0
        }
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
      }
      await delay(150)
    }
    throw new Error('Course Companion did not confirm a visible course window within 60 seconds.')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}
