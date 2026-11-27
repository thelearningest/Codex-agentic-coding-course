import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

export type CodexDesktopProject = { id: string; serverId: string }
export type CodexDesktopProjects = {
  find(root: string): Promise<CodexDesktopProject | null>
  open(root: string): Promise<void>
}

const registryReadRetryDelays = [50, 150]
const retryableReadCodes = new Set(['EACCES', 'EBUSY', 'EPERM'])
const invalidFileUrlCodes = new Set(['ERR_INVALID_URL', 'ERR_INVALID_FILE_URL_HOST', 'ERR_INVALID_FILE_URL_PATH'])

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function samePath(left: string, right: string): boolean {
  const path = (value: string): string => {
    const normalized = resolve(value.startsWith('file:') ? fileURLToPath(value) : value)
    return process.platform === 'win32' ? normalized.toLowerCase() : normalized
  }
  try {
    return path(left) === path(right)
  } catch (error) {
    if (error instanceof URIError || (record(error) && typeof error.code === 'string' && invalidFileUrlCodes.has(error.code))) {
      return false
    }
    throw error
  }
}

// App Server project/create alone does not register a project in the desktop
// sidebar. Let Codex own that mutation through its native folder-opening link.
// This adapter only reads its registry to verify the desktop/server ID mapping;
// an unsupported registry shape must never become a successful registration.
export class CodexDesktopProjectRegistry implements CodexDesktopProjects {
  constructor(
    private readonly codexHome: string,
    private readonly openExternal: (url: string) => Promise<void>,
    private readonly readRegistryFile: (path: string, encoding: 'utf8') => Promise<string> = readFile
  ) {}

  async find(root: string): Promise<CodexDesktopProject | null> {
    const state = await this.readState()
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

  private async readState(): Promise<unknown> {
    const file = join(this.codexHome, '.codex-global-state.json')
    for (let attempt = 0; ; attempt += 1) {
      try {
        return JSON.parse(await this.readRegistryFile(file, 'utf8'))
      } catch (error) {
        const code = record(error) ? error.code : undefined
        if (error instanceof SyntaxError || code === 'ENOENT') return null
        const retryDelay = registryReadRetryDelays[attempt]
        if (retryDelay === undefined || typeof code !== 'string' || !retryableReadCodes.has(code)) throw error
        await delay(retryDelay)
      }
    }
  }
}
