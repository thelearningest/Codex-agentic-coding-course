import { describe, expect, it } from 'vitest'
import {
  mergeCodexTaskConfiguration,
  normalizeCodexTaskConfiguration,
  staleCodexTaskConfiguration
} from '../electron/main/codex-configuration-normalizer'

function startPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    thread: { id: 'thread-1' },
    cwd: 'D:\\course',
    model: 'gpt-5.6-sol',
    reasoningEffort: 'high',
    serviceTier: null,
    approvalPolicy: 'on-request',
    sandbox: { type: 'workspaceWrite', writableRoots: ['D:\\course'] },
    ...overrides
  }
}

function normalize(payload: unknown, eventTimestampMs = 10) {
  return normalizeCodexTaskConfiguration({
    runId: 'run-1',
    threadId: 'thread-1',
    source: 'thread-start',
    payload,
    observedAt: '2026-08-10T00:00:00.000Z',
    eventTimestampMs
  })
}

describe('Codex configuration normalizer', () => {
  it.each(['gpt-6-astra', 'unknown-model', null])('does not require a recognized model: %s', (model) => {
    expect(normalize(startPayload({ model })).freshness).toBe('fresh')
  })

  it('normalizes all five passing values and treats null service tier as Standard', () => {
    const result = normalize(startPayload())

    expect(result.freshness).toBe('fresh')
    expect(result.model).toEqual({ protocolValue: 'gpt-5.6-sol', label: '5.6 Sol' })
    expect(result.reasoningEffort).toEqual({ protocolValue: 'high', label: 'High' })
    expect(result.serviceTier).toEqual({ protocolValue: 'standard', label: 'Standard' })
    expect(result.approvalPolicy).toEqual({ protocolValue: 'on-request', label: 'Approve for me' })
    expect(result.fullAccess).toEqual({ protocolValue: 'off', label: 'Off' })
  })

  it.each([null, 'default', 'standard'])(
    'canonicalizes persisted Standard tier alias %s',
    (serviceTier) => {
      expect(normalize(startPayload({ serviceTier })).serviceTier).toEqual({
        protocolValue: 'standard',
        label: 'Standard'
      })
    }
  )

  it.each([
    ['model', { model: 'gpt-5.6-terra' }, 'gpt-5.6-terra'],
    ['effort', { reasoningEffort: 'medium' }, 'medium'],
    ['tier', { serviceTier: 'fast' }, 'fast'],
    ['approval', { approvalPolicy: 'never' }, 'never'],
    ['full access', { sandbox: { type: 'dangerFullAccess' } }, 'on']
  ])('preserves a known %s mismatch as fresh evidence', (_label, overrides, protocolValue) => {
    const result = normalize(startPayload(overrides))
    expect(result.freshness).toBe('fresh')
    expect(Object.values(result).some((item) =>
      typeof item === 'object' && item !== null && 'protocolValue' in item &&
      item.protocolValue === protocolValue)).toBe(true)
  })

  it('ignores unknown speeds but requires a known effort for fresh evidence', () => {
    expect(normalize(startPayload({ serviceTier: 'mystery' })).freshness).toBe('fresh')
    const missing = startPayload()
    delete missing.reasoningEffort
    expect(normalize(missing).freshness).toBe('unverifiable')
  })

  it('reads settings-update field names and treats a full-access profile as on', () => {
    const result = normalizeCodexTaskConfiguration({
      runId: 'run-1',
      threadId: 'thread-1',
      source: 'thread-settings-updated',
      payload: {
        threadId: 'thread-1',
        threadSettings: {
          model: 'gpt-5.6-sol', effort: 'high', serviceTier: 'standard',
          approvalPolicy: 'on-request',
          sandboxPolicy: { type: 'workspaceWrite' },
          activePermissionProfile: { id: ':danger-full-access', extends: null }
        }
      },
      observedAt: '2026-08-10T00:00:01.000Z',
      eventTimestampMs: 20
    })

    expect(result.fullAccess).toEqual({ protocolValue: 'on', label: 'On' })
  })

  it('ignores duplicate, out-of-order, and wrong-task snapshots and preserves stale evidence', () => {
    const current = normalize(startPayload(), 20)
    expect(mergeCodexTaskConfiguration(current, normalize(startPayload({ model: 'gpt-5.6-terra' }), 10)))
      .toEqual(current)
    expect(mergeCodexTaskConfiguration(current, normalize(startPayload({ model: 'gpt-5.6-terra' }), 20)))
      .toEqual(current)
    const wrongTask = { ...normalize(startPayload(), 30), threadId: 'thread-other' }
    expect(mergeCodexTaskConfiguration(current, wrongTask)).toEqual(current)
    expect(staleCodexTaskConfiguration(current, true)).toMatchObject({
      freshness: 'stale', connection: 'disconnected', model: current.model
    })
  })
})
