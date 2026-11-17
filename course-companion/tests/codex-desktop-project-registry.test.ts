import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
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

  it('opens only the encoded portfolio folder with no prompt or new persisted chat', async () => {
    const { root, registry, opened } = await fixture()
    await registry.open(root)
    expect(opened).toEqual([`codex://new?path=${encodeURIComponent(root)}`])
    const url = new URL(opened[0]!)
    expect([...url.searchParams.keys()]).toEqual(['path'])
    expect(url.searchParams.get('path')).toBe(root)
  })
})
