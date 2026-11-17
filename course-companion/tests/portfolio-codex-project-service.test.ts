import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { PortfolioCodexProjectService } from '../electron/main/portfolio-codex-project-service'
import type { CodexDesktopProjects } from '../electron/main/codex-desktop-project-registry'
import type { CodexRequestClient } from '../electron/main/executor-chat-coordinator'

const root = resolve('Portfolio của tôi')
const target = { id: 'server-project-1', name: 'My existing project', roots: [{ path: root }] }
const desktopTarget = { id: 'desktop-project-1', serverId: target.id }
const discovery = { attempts: 3, wait: async () => undefined }

describe('automatic portfolio Codex desktop project registration', () => {
  it('opens the native folder link once and verifies the visible project across concurrent retries', async () => {
    let registered = false
    let opens = 0
    const calls: Array<[string, Record<string, unknown>]> = []
    const service = new PortfolioCodexProjectService({ async request(method, params = {}) {
      calls.push([method, params])
      return { project: target }
    } }, {
      async find() { return registered ? desktopTarget : null },
      async open(path) { expect(path).toBe(root); registered = true; opens += 1 }
    }, discovery)
    const results = await Promise.all([service.ensure(root), service.ensure(root)])
    expect(results).toEqual([{ id: target.id, name: target.name }, { id: target.id, name: target.name }])
    expect(opens).toBe(1)
    expect(calls).toEqual(Array.from({ length: 2 }, () => ['project/read', { projectId: target.id }]))
  })

  it('rejects a backend-only project even when its root matches', async () => {
    const calls: string[] = []
    const service = new PortfolioCodexProjectService({ async request(method) {
      calls.push(method)
      return { project: target }
    } }, { async find() { return null }, async open() {} }, discovery)
    await expect(service.ensure(root)).rejects.toThrow('desktop project registration was not confirmed')
    expect(calls).toEqual([])
  })

  it('waits for durable desktop registration after the native open acknowledgement', async () => {
    let reads = 0
    const service = new PortfolioCodexProjectService({ async request() { return { project: target } } }, {
      async find() { return ++reads < 4 ? null : desktopTarget }, async open() {}
    }, discovery)
    await expect(service.ensure(root)).resolves.toEqual({ id: target.id, name: target.name })
  })

  it('uses the desktop-mapped server ID and preserves the existing name, including file URI roots', async () => {
    const service = new PortfolioCodexProjectService({ async request(method, params) {
      expect([method, params]).toEqual(['project/read', { projectId: desktopTarget.serverId }])
      return { project: { ...target, roots: [{ path: pathToFileURL(root).href }] } }
    } }, {
      async find() { return desktopTarget }, async open() { throw new Error('Must not reopen an existing project') }
    }, discovery)
    await expect(service.ensure(root)).resolves.toEqual({ id: target.id, name: target.name })
  })

  it('rejects a desktop mapping whose backend primary folder changed', async () => {
    const service = new PortfolioCodexProjectService({ async request() {
      return { project: { ...target, roots: [{ path: resolve('another-folder') }, { path: root }] } }
    } }, { async find() { return desktopTarget }, async open() {} }, discovery)
    await expect(service.ensure(root)).rejects.toThrow('verification failed')
  })

  it('rejects a desktop project removed or remapped during backend verification', async () => {
    for (const after of [null, { ...desktopTarget, serverId: 'another-project' }]) {
      let verified = false
      const service = new PortfolioCodexProjectService({ async request() {
        verified = true
        return { project: target }
      } }, { async find() { return verified ? after : desktopTarget }, async open() {} }, discovery)
      await expect(service.ensure(root)).rejects.toThrow('verification failed')
    }
  })

  it('recovers after connection failure and closes each bootstrap', async () => {
    let failed = false
    let closed = 0
    const client: CodexRequestClient = {
      async request() {
        if (!failed) { failed = true; throw new Error('Disconnected') }
        return { project: target }
      }, async close() { closed += 1 }
    }
    const desktop: CodexDesktopProjects = { async find() { return desktopTarget }, async open() {} }
    const service = new PortfolioCodexProjectService(client, desktop, discovery)
    await expect(service.ensure(root)).rejects.toThrow('Disconnected')
    await expect(service.ensure(root)).resolves.toEqual({ id: target.id, name: target.name })
    expect(closed).toBe(2)
  })
})
