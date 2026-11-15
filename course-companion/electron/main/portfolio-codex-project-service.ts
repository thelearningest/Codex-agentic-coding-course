import { createHash } from 'node:crypto'
import { basename, isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CodexRequestClient } from './executor-chat-coordinator'

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

  constructor(private readonly client: CodexRequestClient) {}

  ensure(root: string, existingId?: string): Promise<{ id: string; name: string }> {
    const operation = this.queue.then(async () => {
      try {
        let target: Project | undefined
        if (existingId) {
          const read = await this.client.request('project/read', { projectId: existingId })
          target = project(record(read) ? read.project : null)
          if (target.id !== existingId || !matches(target, root)) throw new Error('Portfolio project root changed')
        } else {
          let cursor: string | null = null
          const visited = new Set<string>()
          do {
            const page = await this.client.request('project/list', { cursor, limit: 100 })
            if (!record(page) || !Array.isArray(page.data)
              || (page.nextCursor !== null && typeof page.nextCursor !== 'string')) {
              throw new Error('Codex returned an invalid project list')
            }
            target = page.data.map(project).find((candidate) => matches(candidate, root))
            cursor = page.nextCursor
            if (cursor && visited.has(cursor)) throw new Error('Codex project list did not advance')
            if (cursor) visited.add(cursor)
          } while (!target && cursor)
          if (!target) {
            const created = await this.client.request('project/create', {
              name: basename(root),
              roots: [{ path: root }],
              idempotencyKey: 'course-portfolio-' + createHash('sha256').update(normalizedPath(root)).digest('hex')
            })
            target = project(record(created) ? created.project : null)
          }
        }
        // Re-read durable registration before enabling Practice.
        const read = await this.client.request('project/read', { projectId: target.id })
        const verified = project(record(read) ? read.project : null)
        if (verified.id !== target.id || !matches(verified, root)) throw new Error('Portfolio project verification failed')
        return { id: verified.id, name: verified.name }
      } finally {
        await this.client.close?.()
      }
    })
    this.queue = operation.catch(() => undefined)
    return operation
  }
}
