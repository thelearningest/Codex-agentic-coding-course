import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { PortfolioCodexProjectService } from '../electron/main/portfolio-codex-project-service'

const root = resolve('Portfolio của tôi')
const target = { id: 'project-1', name: 'Portfolio của tôi', roots: [{ path: root }] }

describe('automatic portfolio Codex project registration', () => {
  it('creates and verifies once, then reuses registration across concurrent retries', async () => {
    const projects: typeof target[] = []
    const calls: Array<[string, Record<string, unknown>]> = []
    const service = new PortfolioCodexProjectService({ async request(method, params = {}) {
      calls.push([method, params])
      if (method === 'project/list') return { data: projects, nextCursor: null }
      if (method === 'project/create') { projects.push(target); return { project: target } }
      return { project: target }
    } })
    const results = await Promise.all([service.ensure(root), service.ensure(root)])
    expect(results).toEqual([{ id: target.id, name: target.name }, { id: target.id, name: target.name }])
    expect(calls.filter(([method]) => method === 'project/create')).toHaveLength(1)
    expect(calls.find(([method]) => method === 'project/create')![1]).toMatchObject({
      name: target.name, roots: [{ path: root }], idempotencyKey: expect.stringMatching(/^course-portfolio-[a-f0-9]{64}$/)
    })
    expect(calls.at(-1)![0]).toBe('project/read')
  })

  it('reuses a primary folder project with its existing name, including file URI roots', async () => {
    const service = new PortfolioCodexProjectService({ async request(method) {
      const project = { ...target, name: 'My existing project', roots: [{ path: pathToFileURL(root).href }] }
      if (method === 'project/create') throw new Error('Must not create a duplicate')
      return method === 'project/list' ? { data: [project], nextCursor: null } : { project }
    } })
    expect(await service.ensure(root)).toEqual({ id: target.id, name: 'My existing project' })
  })

  it('rejects an existing project whose primary folder changed', async () => {
    const service = new PortfolioCodexProjectService({ async request() {
      return { project: { ...target, roots: [{ path: resolve('another-folder') }, { path: root }] } }
    } })
    await expect(service.ensure(root, target.id)).rejects.toThrow('root changed')
  })

  it('does not report success when the durable read has another folder', async () => {
    const service = new PortfolioCodexProjectService({ async request(method) {
      if (method === 'project/list') return { data: [], nextCursor: null }
      return { project: method === 'project/create' ? target : { ...target, roots: [{ path: resolve('other') }] } }
    } })
    await expect(service.ensure(root)).rejects.toThrow('verification failed')
  })

  it('recovers the connection after failure and closes each bootstrap', async () => {
    let failed = false; let closed = 0
    const service = new PortfolioCodexProjectService({ async request(method) {
      if (!failed) { failed = true; throw new Error('Disconnected') }
      return method === 'project/list' ? { data: [target], nextCursor: null } : { project: target }
    }, async close() { closed += 1 } })
    await expect(service.ensure(root)).rejects.toThrow('Disconnected')
    await expect(service.ensure(root)).resolves.toEqual({ id: target.id, name: target.name })
    expect(closed).toBe(2)
  })
})
