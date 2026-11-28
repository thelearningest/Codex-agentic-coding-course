import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CodexDesktopProjectRegistry } from '../electron/main/codex-desktop-project-registry'

const directories: string[] = []
afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

async function fixture() {
  const home = await mkdtemp(join(tmpdir(), 'codex-desktop-registry-'))
  directories.push(home)
  const root = join(home, 'Portfolio của tôi')
  const file = join(home, '.codex-global-state.json')
  const state = {
    'local-projects': { 'desktop-id': { id: 'desktop-id', name: 'Existing name', rootPaths: [root] } },
    'app-server-project-id-by-legacy-project-id-by-host': { [`local:${home}`]: { 'desktop-id': 'server-id' } }
  }
  const opened: string[] = []
  const registry = new CodexDesktopProjectRegistry(home, async (url) => { opened.push(url) })
  return { home, root, file, state, registry, opened }
}

describe('Codex desktop project registration readback', () => {
  it('uses current global SQLite settings even when legacy JSON is stale', async () => {
    const { home, root, file, state, registry } = await fixture()
    const staleRoot = join(home, 'Old portfolio')
    await writeFile(file, JSON.stringify({
      ...state,
      'local-projects': { 'desktop-id': { id: 'desktop-id', rootPaths: [staleRoot] } }
    }))
    const db = new DatabaseSync(join(home, '.codex-global-state.sqlite'))
    try {
      db.exec('CREATE TABLE settings (scope TEXT, key TEXT, value TEXT, PRIMARY KEY(scope, key))')
      const insert = db.prepare('INSERT INTO settings VALUES (?, ?, ?)')
      for (const [key, value] of Object.entries(state)) {
        insert.run('global', key, JSON.stringify(value))
        insert.run('other', key, '{}')
      }
      await expect(registry.find(root)).resolves.toEqual({ id: 'desktop-id', serverId: 'server-id' })
      await expect(registry.find(staleRoot)).resolves.toBeNull()
      db.exec("DELETE FROM settings WHERE key = 'app-server-project-id-by-legacy-project-id-by-host'")
      await expect(registry.find(root)).resolves.toBeNull()
      await expect(registry.find(staleRoot)).resolves.toBeNull()
    } finally {
      db.close()
    }
  })

  it('surfaces an unreadable SQLite schema even if JSON could confirm the folder', async () => {
    const { home, root, file, state, registry } = await fixture()
    await writeFile(file, JSON.stringify(state))
    new DatabaseSync(join(home, '.codex-global-state.sqlite')).close()
    await expect(registry.find(root)).rejects.toThrow(/settings/)
  })

  it('reads the visible primary-root project and its distinct server ID without changing desktop state', async () => {
    const { root, file, state, registry } = await fixture()
    const original = JSON.stringify(state)
    await writeFile(file, original)
    await expect(registry.find(root)).resolves.toEqual({ id: 'desktop-id', serverId: 'server-id' })
    expect(await readFile(file, 'utf8')).toBe(original)
  })

  it('does not confirm a missing, incomplete or unsupported desktop registry', async () => {
    const { root, file, state, registry } = await fixture()
    await expect(registry.find(root)).resolves.toBeNull()
    for (const value of ['{', '{}', JSON.stringify({ 'local-projects': state['local-projects'] })]) {
      await writeFile(file, value)
      await expect(registry.find(root)).resolves.toBeNull()
    }
  })

  it('rejects secondary folders and mappings from a different Codex home', async () => {
    const { home, root, file, state, registry } = await fixture()
    state['local-projects']['desktop-id'].rootPaths = [join(home, 'other'), root]
    await writeFile(file, JSON.stringify(state))
    await expect(registry.find(root)).resolves.toBeNull()
    state['local-projects']['desktop-id'].rootPaths = [root]
    state['app-server-project-id-by-legacy-project-id-by-host'] = { [`local:${join(home, 'other')}`]: { 'desktop-id': 'server-id' } }
    await writeFile(file, JSON.stringify(state))
    await expect(registry.find(root)).resolves.toBeNull()
  })

  it('finds the exact project after malformed saved host and project paths', async () => {
    const { home, root, file, state, registry } = await fixture()
    state['local-projects']['desktop-id'].rootPaths = [pathToFileURL(root).href]
    await writeFile(file, JSON.stringify({
      'local-projects': {
        'broken-project': { id: 'broken-project', rootPaths: ['file:///C:/old%2Fproject'] },
        ...state['local-projects']
      },
      'app-server-project-id-by-legacy-project-id-by-host': {
        'local:file://%broken': { 'broken-project': 'wrong-server-id' },
        [`local:${pathToFileURL(home).href}`]: { 'desktop-id': 'server-id' }
      }
    }))
    await expect(registry.find(root)).resolves.toEqual({ id: 'desktop-id', serverId: 'server-id' })
  })

  it('does not confirm a project with an invalid primary path and a matching secondary path', async () => {
    const { root, file, state, registry } = await fixture()
    state['local-projects']['desktop-id'].rootPaths = ['file:///C:/broken%FF', root]
    await writeFile(file, JSON.stringify(state))
    await expect(registry.find(root)).resolves.toBeNull()
  })

  it('retries a busy or temporarily inaccessible registry and uses the readable result', async () => {
    const { home, root, file, state } = await fixture()
    const read = vi.fn()
      .mockRejectedValueOnce(Object.assign(new Error('sharing violation'), { code: 'EBUSY' }))
      .mockRejectedValueOnce(Object.assign(new Error('temporarily inaccessible'), { code: 'EPERM' }))
      .mockResolvedValueOnce(JSON.stringify(state))
    const registry = new CodexDesktopProjectRegistry(home, async () => {}, read)

    await expect(registry.find(root)).resolves.toEqual({ id: 'desktop-id', serverId: 'server-id' })
    expect(read.mock.calls).toEqual([[file, 'utf8'], [file, 'utf8'], [file, 'utf8']])
  })

  it.each([['EACCES', 3], ['EIO', 1]])('preserves %s after at most %i read attempts', async (code, attempts) => {
    const { home, root } = await fixture()
    const failure = Object.assign(new Error('registry read failed'), { code })
    const read = vi.fn().mockRejectedValue(failure)
    const registry = new CodexDesktopProjectRegistry(home, async () => {}, read)

    await expect(registry.find(root)).rejects.toBe(failure)
    expect(read).toHaveBeenCalledTimes(attempts)
  })

  it('opens only the encoded portfolio folder with no prompt or new persisted chat', async () => {
    const { root, registry, opened } = await fixture()
    await registry.open(root)
    expect(opened).toEqual([`codex://new?path=${encodeURIComponent(root)}`])
    const url = new URL(opened[0]!)
    expect([...url.searchParams.keys()]).toEqual(['path'])
    expect(url.searchParams.get('path')).toBe(root)
  })
})
