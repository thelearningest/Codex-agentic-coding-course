import { isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CodexRequestClient } from './executor-chat-coordinator'
import type { CodexDesktopProjects } from './codex-desktop-project-registry'

type Project = { id: string; name: string; roots: Array<{ path: string }> }

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function project(value: unknown): Project {
  if (!record(value) || typeof value.id !== 'string' || !/^[A-Za-z0-9_-]{1,160}$/.test(value.id)
    || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 500
    || !Array.isArray(value.roots) || !value.roots.length
    || !value.roots.every((root) => record(root) && typeof root.path === 'string')) {
    throw new Error('Codex returned an invalid project')
  }
  return value as Project
}

function normalizedPath(path: string): string {
  const localPath = path.startsWith('file:') ? fileURLToPath(path) : path
  if (!isAbsolute(localPath)) throw new Error('Codex project root must be absolute')
  const normalized = resolve(localPath)
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized
}

function matches(project: Project, root: string): boolean {
  // A secondary folder is not the task's default working directory.
  return normalizedPath(project.roots[0]!.path) === normalizedPath(root)
}

export class PortfolioCodexProjectService {
  private queue: Promise<unknown> = Promise.resolve()

  constructor(
    private readonly client: CodexRequestClient,
    private readonly desktop: CodexDesktopProjects,
    private readonly discovery: {
      attempts?: number
      intervalMs?: number
      wait?: (milliseconds: number) => Promise<void>
    } = {}
  ) {}

  ensure(root: string): Promise<{ id: string; name: string }> {
    const operation = this.queue.then(async () => {
      try {
        normalizedPath(root)
        let target = await this.desktop.find(root)
        if (!target) {
          await this.desktop.open(root)
          const wait = this.discovery.wait ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)))
          for (let attempt = 0; attempt < (this.discovery.attempts ?? 60); attempt += 1) {
            target = await this.desktop.find(root)
            if (target) break
            await wait(this.discovery.intervalMs ?? 500)
          }
        }
        if (!target) throw new Error('Codex desktop project registration was not confirmed')
        // The desktop ID and the server ID are different. Bind tasks to the
        // server record mapped by the visible project, including legacy repair.
        const read = await this.client.request('project/read', { projectId: target.serverId })
        const verified = project(record(read) ? read.project : null)
        const registered = await this.desktop.find(root)
        if (verified.id !== target.serverId || !matches(verified, root)
          || registered?.id !== target.id || registered.serverId !== target.serverId) {
          throw new Error('Portfolio project verification failed')
        }
        return { id: verified.id, name: verified.name }
      } finally {
        await this.client.close?.()
      }
    })
    this.queue = operation.catch(() => undefined)
    return operation
  }
}
