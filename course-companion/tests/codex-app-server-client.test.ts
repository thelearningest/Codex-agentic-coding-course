import { EventEmitter } from 'node:events'
import type { ChildProcessWithoutNullStreams } from 'node:child_process'
import { describe, expect, it, vi } from 'vitest'
import { CodexAppServerClient } from '../electron/main/codex-app-server-client'

type ClientInternals = {
  pending: Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>
  handleLine: (line: string) => void
  process: ChildProcessWithoutNullStreams | null
}

describe('CodexAppServerClient JSON-RPC routing', () => {
  it('never mistakes a server callback ID for a client response ID', () => {
    const client = new CodexAppServerClient()
    const internals = client as unknown as ClientInternals
    const resolve = vi.fn()
    const reject = vi.fn()
    const notifications: string[] = []
    internals.pending.set(7, { resolve, reject })
    client.onNotification((notification) => notifications.push(notification.method))

    internals.handleLine(JSON.stringify({
      id: 7,
      method: 'item/tool/call',
      params: { threadId: 'teacher-thread', turnId: 'teacher-turn' }
    }))

    expect(resolve).not.toHaveBeenCalled()
    expect(reject).not.toHaveBeenCalled()
    expect(internals.pending.has(7)).toBe(true)
    expect(notifications).toEqual(['item/tool/call'])

    internals.handleLine(JSON.stringify({ id: 7, result: { ok: true } }))
    expect(resolve).toHaveBeenCalledWith({ ok: true })
    expect(internals.pending.has(7)).toBe(false)
  })

  it('keeps the numeric RPC error code on a rejected request', () => {
    const client = new CodexAppServerClient()
    const internals = client as unknown as ClientInternals
    const reject = vi.fn()
    internals.pending.set(7, { resolve: vi.fn(), reject })

    internals.handleLine(JSON.stringify({ id: 7, error: { code: -32601, message: 'Unknown method' } }))

    expect(reject).toHaveBeenCalledWith(expect.objectContaining({ code: 'APP_SERVER_REQUEST_FAILED', rpcCode: -32601 }))
    expect(internals.pending.has(7)).toBe(false)
  })

  it('does not resolve stop until the owned AppServer process actually exits', async () => {
    const client = new CodexAppServerClient()
    const internals = client as unknown as ClientInternals
    const child = new EventEmitter() as ChildProcessWithoutNullStreams & {
      exitCode: number | null
      stdin: ChildProcessWithoutNullStreams['stdin']
      kill: ReturnType<typeof vi.fn>
    }
    child.exitCode = null
    child.stdin = { end: vi.fn() } as unknown as ChildProcessWithoutNullStreams['stdin']
    child.kill = vi.fn(() => true)
    internals.process = child
    let settled = false

    const stopping = client.stop().then(() => { settled = true })
    await Promise.resolve()

    expect(child.stdin.end).toHaveBeenCalledOnce()
    expect(settled).toBe(false)

    child.exitCode = 0
    child.emit('exit', 0, null)
    await stopping

    expect(settled).toBe(true)
  })
})
