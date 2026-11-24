import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import type { CodexTaskConfigurationSnapshot, ExecutorActivitySnapshot, PracticeAdapterEvidenceState } from '../shared/contracts'
import { PracticeDefinitionRepository } from '../electron/main/practice-definition-repository'
import { defaultPracticeWorkspaceRecord, type PracticeRunRecord } from '../electron/main/practice-run-repository'
import { PracticeHintService, PRACTICE_HINT_PEDAGOGY } from '../electron/main/practice-hint-service'
import { CodexConfigurationEvidenceAdapter } from '../electron/main/codex-configuration-evidence-adapter'

const timestamp = '2026-09-12T06:00:00.000Z'
const request = { runId: 'run-1', generation: 1 }

async function harness(portfolio = false) {
  const definitions = new PracticeDefinitionRepository(join(process.cwd(), 'content/practices'),
    join(process.cwd(), '../pilot-workspace/course/practices'))
  const definition = await definitions.load(portfolio ? 'm2-portfolio-planning' : 'm1-codex-safe-setup', '2.0.0')
  const run: PracticeRunRecord = {
    ...request, status: 'active', practiceId: definition.practiceId, practiceVersion: definition.version,
    workspaceKind: definition.workspaceKind, taskPolicy: definition.taskPolicy, evidenceProfile: definition.evidenceProfile,
    binding: { runId: request.runId, threadId: 'thread-1', name: 'Practice', workspaceRoot: '/practice', createdAt: timestamp },
    startedAt: timestamp, updatedAt: timestamp, checklist: [], learnerDecisions: {}, learnerApprovals: {},
    evidence: null, invalidations: [], reviewStatus: 'not-reviewed'
  }
  const record = { ...defaultPracticeWorkspaceRecord(), activeRun: run as PracticeRunRecord | null }
  const configuration: CodexTaskConfigurationSnapshot = {
    schemaVersion: 1, runId: request.runId, threadId: 'thread-1', source: 'thread-settings-snapshot', eventTimestampMs: 1,
    observedAt: timestamp, freshness: 'fresh', connection: 'connected',
    model: { protocolValue: 'gpt-5.6-sol', label: '5.6 Sol' },
    reasoningEffort: { protocolValue: 'high', label: 'High' },
    serviceTier: { protocolValue: 'standard', label: 'Standard' },
    approvalPolicy: { protocolValue: 'on-request', label: 'Approve for me' },
    fullAccess: { protocolValue: 'off', label: 'Off' }, sandboxType: 'workspaceWrite', activePermissionProfile: null
  }
  const activity: ExecutorActivitySnapshot = {
    schemaVersion: 1, runId: request.runId, threadId: 'thread-1', status: 'ready', cursor: '',
    learnerPrompts: [], executorResponses: [], approvalEvents: [], changedFiles: [], verificationEvidence: [],
    reportedChangedFiles: [], reportedVerificationEvidence: [], workspaceConfirmedChangedFiles: [],
    workspaceCommittedReportedFilesSinceRunStart: [], workspaceCurrentlyDirtyReportedFiles: [],
    observedAt: timestamp, workspaceBaseline: null, configuration
  }
  const evidence: PracticeAdapterEvidenceState = {
    schemaVersion: 1, practiceId: definition.practiceId, practiceVersion: definition.version, runId: run.runId,
    evidenceProfile: definition.evidenceProfile, observedAt: timestamp, freshness: 'unverifiable', sourceDigest: 'partial-1',
    evidence: [], steps: [], invalidations: [], portfolioPlanning: {
      schemaVersion: 1, workspaceIdentityDigest: 'workspace-1', artifacts: [{
        path: 'planning/PRD.md', digest: 'prd-1', byteLength: 20, modifiedAt: timestamp, observedAt: timestamp,
        content: 'Audience: students. token=secret-value'
      }], issues: [], unexpectedPaths: [], stages: []
    }
  }
  const adapter = new CodexConfigurationEvidenceAdapter({ current: async () => activity })
  const read = vi.fn(async () => structuredClone(activity))
  const collect = vi.fn(async () => structuredClone(evidence))
  const respond = vi.fn<(input: string, policy: string) => Promise<string>>()
    .mockResolvedValue('Hãy đối chiếu một điểm bạn chưa chắc trong task Codex.')
  const release = vi.fn(async () => {})
  const service = new PracticeHintService(definitions, { load: async () => structuredClone(record) }, { read },
    { resolve: () => portfolio ? { evidenceProfile: definition.evidenceProfile, collect } : adapter },
    { respond }, false, release)
  return { service, record, run, activity, configuration, evidence, read, collect, respond, release }
}

describe('Practice hints', () => {
  it('refreshes the exact bound task and gives capped, incremental hints without mutating Practice', async () => {
    const h = await harness()
    const before = structuredClone(h.record)
    const levels = []
    for (let index = 0; index < 4; index++) levels.push((await h.service.request(request)).level)
    expect(levels).toEqual([1, 2, 3, 3])
    expect(h.record).toEqual(before)
    expect(h.respond.mock.calls[0]![0]).not.toMatch(/serviceTier|set-speed|speed-matches|Speed Standard/)
    expect(h.read).toHaveBeenCalledTimes(8)
    expect(h.read).toHaveBeenCalledWith(h.run.binding)
    expect(JSON.parse(h.respond.mock.calls[1]![0]).previousHints).toHaveLength(1)
    expect(h.respond.mock.calls[0]![1]).toBe(PRACTICE_HINT_PEDAGOGY)
    expect(h.respond.mock.calls[0]![1]).toContain('refer to yourself as "mình"')
    expect(h.respond.mock.calls[0]![1]).toContain('do not diagnose an unobserved obstacle')
    expect(h.release).toHaveBeenCalledTimes(4)
  })

  it('ignores timestamp-only refreshes but fades support when observed work changes', async () => {
    const h = await harness()
    await h.service.request(request)
    h.configuration.observedAt = '2026-09-12T06:01:00.000Z'
    expect((await h.service.request(request)).level).toBe(2)
    h.configuration.model = { protocolValue: 'different', label: 'Different' }
    expect((await h.service.request(request)).level).toBe(1)
    expect(JSON.parse(h.respond.mock.calls[2]![0]).previousHints).toEqual([])
  })

  it('collects partial portfolio contents and recent learner/task context with redaction', async () => {
    const h = await harness(true)
    h.activity.status = 'waiting-for-learner'
    h.activity.learnerPrompts = ['I need help choosing my audience.']
    h.activity.executorResponses = ['Which audience? password=private-value']
    h.activity.reportedVerificationEvidence = ['Executor claims checks passed']
    await h.service.request(request)
    const input = h.respond.mock.calls[0]![0]
    expect(input).toContain('Audience: students.')
    expect(input).toContain('I need help choosing my audience.')
    expect(input).toContain('Executor claims checks passed')
    expect(input).not.toContain('secret-value')
    expect(input).not.toContain('private-value')
    expect(h.collect).toHaveBeenCalledTimes(2)
    expect(h.record.activeRun?.reviewStatus).toBe('not-reviewed')
  })

  it('supports a fresh portfolio task before Git is initialized', async () => {
    const h = await harness(true)
    h.activity.status = 'stale'
    h.activity.workspaceEvidenceStatus = 'git-unavailable'
    expect((await h.service.request(request)).level).toBe(1)
  })

  it('reads portfolio progress with unknown model settings and no Git repository', async () => {
    const h = await harness(true)
    h.activity.status = 'stale'
    h.activity.workspaceEvidenceStatus = 'git-unavailable'
    h.configuration.freshness = 'unverifiable'
    h.configuration.model = { protocolValue: 'gpt-6-astra', label: null }
    h.configuration.reasoningEffort = { protocolValue: null, label: null }
    h.activity.learnerPrompts = ['I chose students as my audience.']
    await expect(h.service.request(request)).resolves.toMatchObject({ level: 1 })
    expect(h.respond.mock.calls[0]![0]).toContain('I chose students as my audience.')
    expect(JSON.parse(h.respond.mock.calls[0]![0]).snapshot.task).toMatchObject({
      status: 'ready', workspaceEvidenceStatus: 'git-unavailable'
    })
    expect(h.collect).toHaveBeenCalledTimes(2)
    expect(h.record.activeRun?.reviewStatus).toBe('not-reviewed')
  })

  it.each(['stale-settings', 'disconnected-settings', 'wrong-task', 'git-failure', 'working'])(
    'still rejects unreadable portfolio progress: %s', async (failure) => {
      const h = await harness(true)
      h.activity.status = 'stale'
      h.activity.workspaceEvidenceStatus = 'git-unavailable'
      h.configuration.freshness = 'unverifiable'
      if (failure === 'stale-settings') h.configuration.freshness = 'stale'
      if (failure === 'disconnected-settings') h.configuration.connection = 'disconnected'
      if (failure === 'wrong-task') h.configuration.threadId = 'another-task'
      if (failure === 'git-failure') h.activity.workspaceEvidenceStatus = 'failed'
      if (failure === 'working') h.activity.status = 'working'
      await expect(h.service.request(request)).rejects.toThrow()
      expect(h.respond).not.toHaveBeenCalled()
    })

  it.each(['stale', 'disconnected', 'working'] as const)('rejects %s snapshots without fabricating a hint', async (status) => {
    const h = await harness()
    h.activity.status = status
    await expect(h.service.request(request)).rejects.toThrow()
    expect(h.respond).not.toHaveBeenCalled()
    expect(h.release).toHaveBeenCalledOnce()
  })

  it('rejects missing or mismatched runs and task bindings', async () => {
    const h = await harness()
    await expect(h.service.request({ ...request, generation: 2 })).rejects.toThrow('Practice đã thay đổi')
    h.activity.threadId = 'unrelated-task'
    await expect(h.service.request(request)).rejects.toThrow('đúng task')
    h.record.activeRun = null
    await expect(h.service.request(request)).rejects.toThrow('Practice đã thay đổi')
    expect(h.respond).not.toHaveBeenCalled()
  })

  it('deduplicates concurrent clicks and discards responses when the run changes', async () => {
    const h = await harness()
    h.respond.mockImplementationOnce(async () => {
      h.record.activeRun = null
      return 'A stale hint'
    })
    const first = h.service.request(request)
    expect(h.service.request(request)).toBe(first)
    await expect(first).rejects.toThrow('Practice đã thay đổi')
    expect(h.respond).toHaveBeenCalledOnce()
  })

  it('discards evidence changed during inference and retries at the first level', async () => {
    const h = await harness(true)
    h.respond.mockImplementationOnce(async () => {
      h.evidence.sourceDigest = 'partial-2'
      return 'A stale hint'
    })
    await expect(h.service.request(request)).rejects.toThrow('Tiến độ vừa thay đổi')
    expect((await h.service.request(request)).level).toBe(1)
  })

  it('keeps inference failure out of hint history and releases ownership', async () => {
    const h = await harness()
    h.respond.mockRejectedValueOnce(new Error('offline'))
    await expect(h.service.request(request)).rejects.toThrow('offline')
    expect((await h.service.request(request)).level).toBe(1)
    expect(h.release).toHaveBeenCalledTimes(2)
  })
})
