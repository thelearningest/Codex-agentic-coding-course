import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export type CodexDesktopProject = { id: string; serverId: string }
export type CodexDesktopProjects = {
  find(root: string): Promise<CodexDesktopProject | null>
  open(root: string): Promise<void>
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function samePath(left: string, right: string): boolean {
  const path = (value: string): string => {
    const normalized = resolve(value.startsWith('file:') ? fileURLToPath(value) : value)
    return process.platform === 'win32' ? normalized.toLowerCase() : normalized
  }
  return path(left) === path(right)
}

// App Server project/create alone does not register a project in the desktop
// sidebar. Let Codex own that mutation through its native folder-opening link.
// This adapter only reads its registry to verify the desktop/server ID mapping;
// an unsupported registry shape must never become a successful registration.
export class CodexDesktopProjectRegistry implements CodexDesktopProjects {
  constructor(
    private readonly codexHome: string,
    private readonly openExternal: (url: string) => Promise<void>
  ) {}

  async find(root: string): Promise<CodexDesktopProject | null> {
    let state: unknown
    try {
      state = JSON.parse(await readFile(join(this.codexHome, '.codex-global-state.json'), 'utf8'))
    } catch (error) {
      if (error instanceof SyntaxError || (record(error) && error.code === 'ENOENT')) return null
      throw error
    }
    if (!record(state) || !record(state['local-projects'])) return null
    const mappings = state['app-server-project-id-by-legacy-project-id-by-host']
    if (!record(mappings)) return null
    const mapping = Object.entries(mappings).find(([host]) =>
      host.startsWith('local:') && samePath(host.slice('local:'.length), this.codexHome)
    )?.[1]
    if (!record(mapping)) return null
    for (const [id, project] of Object.entries(state['local-projects'])) {
      if (!record(project) || project.id !== id || !Array.isArray(project.rootPaths)
        || typeof project.rootPaths[0] !== 'string' || !samePath(project.rootPaths[0], root)) continue
      const serverId = mapping[id]
      if (/^[A-Za-z0-9_-]{1,160}$/.test(id) && typeof serverId === 'string'
        && /^[A-Za-z0-9_-]{1,160}$/.test(serverId)) return { id, serverId }
    }
    return null
  }

  open(root: string): Promise<void> {
    return this.openExternal(`codex://new?path=${encodeURIComponent(root)}`)
  }
}
