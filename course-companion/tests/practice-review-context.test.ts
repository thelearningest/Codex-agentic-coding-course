import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type {
  CodexTaskConfigurationSnapshot,
  ExecutorActivitySnapshot
} from '../shared/contracts'
import { PracticeDefinitionRepository } from '../electron/main/practice-definition-repository'
import { buildPracticeReviewEnvelope, buildPracticeReviewPrompt, PLANNING_DOCUMENT_LEARNER_NAMES, type PracticeReviewEnvelope } from '../electron/main/practice-review-context'
import { getPracticeIntroduction } from '../src/renderer/src/components/practice-introduction-copy'
import type { PracticeRunRecord } from '../electron/main/practice-run-repository'

const timestamp = '2026-08-10T00:00:00.000Z'
const definitions = new PracticeDefinitionRepository(join(process.cwd(), 'content', 'practices'))

const run: PracticeRunRecord = {
  runId: 'run-1',
  generation: 1,
  status: 'active',
  practiceId: 'm1-codex-safe-setup',
  practiceVersion: '2.0.0',
  workspaceKind: 'pilot-workspace',
  taskPolicy: 'inherit-configuration-only',
  evidenceProfile: 'codex-task-configuration',
  binding: {
    runId: 'run-1',
    threadId: 'thread-1',
    name: 'Practice · Module 1',
    workspaceRoot: 'D:\\course',
    createdAt: timestamp
  },
  startedAt: timestamp,
  updatedAt: timestamp,
  checklist: [{ id: 'set-model', title: 'Chọn Model', status: 'current' }],
  learnerDecisions: {},
  learnerApprovals: {},
  evidence: null,
  invalidations: [],
  reviewStatus: 'not-reviewed'
}

function configuration(
  overrides: Partial<CodexTaskConfigurationSnapshot> = {}
): CodexTaskConfigurationSnapshot {
  return {
    schemaVersion: 1,
    runId: 'run-1',
    threadId: 'thread-1',
    source: 'thread-resume',
    eventTimestampMs: 1,
    observedAt: timestamp,
    freshness: 'fresh',
    connection: 'connected',
    model: { protocolValue: 'gpt-5.6-sol', label: '5.6 Sol' },
    reasoningEffort: { protocolValue: 'high', label: 'High' },
    serviceTier: { protocolValue: 'standard', label: 'Standard' },
    approvalPolicy: { protocolValue: 'on-request', label: 'On request' },
    approvalMode: { protocolValue: 'approve-for-me', label: 'Approve for me' },
    fullAccess: { protocolValue: 'off', label: 'Off' },
    sandboxType: 'workspaceWrite',
    activePermissionProfile: null,
    ...overrides
  }
}

function activity(config: CodexTaskConfigurationSnapshot | null): ExecutorActivitySnapshot {
  return {
    schemaVersion: 1,
    runId: 'run-1',
    threadId: 'thread-1',
    status: 'response-ready',
    cursor: 'turn:item',
    learnerPrompts: ['raw learner transcript TOKEN=secret-value'],
    executorResponses: ['raw executor transcript Bearer abc.def.ghi'],
    approvalEvents: [],
    changedFiles: ['should-not-be-reviewed.ts'],
    verificationEvidence: [],
    reportedChangedFiles: [],
    reportedVerificationEvidence: ['untrusted report'],
    workspaceConfirmedChangedFiles: ['should-not-be-reviewed.ts'],
    workspaceCommittedReportedFilesSinceRunStart: [],
    workspaceCurrentlyDirtyReportedFiles: [],
    observedAt: timestamp,
    workspaceBaseline: null,
    configuration: config
  }
}

describe('Module 1 Practice review context', () => {
  it('uses only three fresh effective configuration values from the bound task', async () => {
    const definition = await definitions.load('m1-codex-safe-setup', '2.0.0')
    const envelope = buildPracticeReviewEnvelope({
      definition,
      run,
      activity: activity(configuration()),
      decisions: { secret: 'Bearer private-value' },
      generatedAt: timestamp
    })

    expect(envelope.evidence).toHaveLength(3)
    expect(new Set(envelope.evidence.map((item) => item.kind))).toEqual(
      new Set(['codex-task-configuration'])
    )
    expect(envelope.evidence.every((item) => item.freshness === 'fresh')).toBe(true)
    const text = JSON.stringify(envelope)
    expect(text).not.toContain('raw learner')
    expect(text).not.toContain('untrusted report')
    expect(text).not.toContain('should-not-be-reviewed')
    expect(text).not.toContain('private-value')
  })

  it('rejects configuration metadata from the wrong task identity', async () => {
    const definition = await definitions.load('m1-codex-safe-setup', '2.0.0')
    const envelope = buildPracticeReviewEnvelope({
      definition,
      run,
      activity: activity(configuration({ threadId: 'thread-other' })),
      generatedAt: timestamp
    })

    expect(envelope.configuration).toBeUndefined()
    expect(envelope.evidence).toEqual([])
  })

  it('marks disconnected or stale configuration evidence stale', async () => {
    const definition = await definitions.load('m1-codex-safe-setup', '2.0.0')
    const envelope = buildPracticeReviewEnvelope({
      definition,
      run,
      activity: activity(configuration({
        freshness: 'stale',
        connection: 'disconnected'
      })),
      generatedAt: timestamp
    })

    expect(envelope.evidence.every((item) => item.freshness === 'stale')).toBe(true)
  })
})

describe('beginner portfolio review policy', () => {
  it.each(['m3-portfolio-build', 'm4-portfolio-release'])(
    'lets semantic review recognize bound-task reports without extractor keywords for %s', async (practiceId) => {
      const version = practiceId === 'm3-portfolio-build' ? '2.0.0' : '1.0.0'
      const definition = await new PracticeDefinitionRepository(join(process.cwd(), '../pilot-workspace/course/practices')).load(practiceId, version)
      const observed = { ...activity(null), reportedVerificationEvidence: [], executorResponses: ['Les liens répondent correctement au clavier et la page reste lisible à 390 px.'] }
      const input = { definition, run: { ...run, practiceId, practiceVersion: version }, activity: observed, generatedAt: timestamp }
      const envelope = buildPracticeReviewEnvelope(input)
      expect(envelope.evidence).toContainEqual(expect.objectContaining({
        kind: 'executor-reported-verification', text: expect.stringContaining(observed.executorResponses[0]!)
      }))
      const prompt = buildPracticeReviewPrompt(envelope)
      expect(prompt).toContain('not prevalidated checks')
      expect(prompt).toContain('generic completion claim')
      expect(buildPracticeReviewEnvelope({ ...input, activity: { ...observed, threadId: 'wrong-task' } }).evidence)
        .not.toContainEqual(expect.objectContaining({ kind: 'executor-reported-verification' }))
    }
  )

  it.each([
    ['m2-portfolio-planning', '2.0.0', 'planning'],
    ['m3-portfolio-build', '2.1.0', 'build'],
    ['m4-portfolio-release', '1.0.0', 'release']
  ] as const)('accepts the stated minimum for %s without dropping required gates', async (practiceId, version, kind) => {
    const definition = await new PracticeDefinitionRepository(join(process.cwd(), '../pilot-workspace/course/practices')).load(practiceId, version)
    const envelope: PracticeReviewEnvelope = { schemaVersion: 1, definition,
      run: { runId: 'beginner', generation: 1, threadId: 'bound', startedAt: timestamp },
      evidence: [], generatedAt: timestamp,
      portfolioPackage: { kind, evidenceDigest: 'a'.repeat(64), sourceDigest: null,
        ready: false, approved: false, artifacts: [], issues: [], unexpectedPaths: [] } }
    const prompt = buildPracticeReviewPrompt(envelope)
    expect(prompt).toContain('beginner completion standard, not professional polish')
    expect(prompt).toContain('when the current approved planning scope permits it')
    expect(prompt).toContain('mobile viewport emulation with concrete observations')
    expect(prompt).toContain('single smallest blocking next action')
    expect(prompt).toContain('Never ask the learner to calculate, compare, reconcile or edit these details')
    expect(prompt).toContain('A representation difference alone is not evidence of changed source')
    expect(prompt).toContain('document digest, package digest, application fingerprint, Git revision and handoff checkpoint are distinct identities')
    expect(prompt).toContain('Never pass fabricated evidence, stale source, a broken required outcome or missing publishing permission')
    for (const criterion of definition.criteria) expect(prompt).toContain(criterion.assertion)
    expect(envelope.portfolioPackage?.approved).toBe(false)
    if (kind === 'planning') {
      expect(prompt).toContain('Judge meaning, not formatting')
      expect(prompt).toContain('arbitrary headings or no headings')
      expect(prompt).toContain('stable IDs or unambiguous descriptive names')
      expect(prompt).toContain('Do not demand invented dependencies')
      expect(prompt).toContain('A ready package only means the files passed filesystem checks')
      expect(prompt).toContain('absent meaningful validation')
      expect(prompt).toContain('must still prevent a pass')
      expect(prompt).toContain('A particular REQ-* naming convention is not required')
      expect(prompt).not.toContain('Report concrete issues and document paths')
      expect(prompt).toContain('Report concrete issues by naming the document')
      expect(prompt).toContain('Never write file paths, file names or backticked identifiers in learner-facing text')
      for (const [path, name] of PLANNING_DOCUMENT_LEARNER_NAMES) expect(prompt).toContain(path + ' = "' + name + '"')
      expect(prompt).toContain('"problem":"unmet criteria only')
      expect(prompt).toContain('"nextStep":"unmet criteria only')
      expect(prompt).toContain('For an unsatisfied or unverifiable criterion, also return problem and nextStep')
    } else {
      expect(prompt).not.toContain('Never write file paths, file names or backticked identifiers')
      expect(prompt).not.toContain('"problem"')
      expect(prompt).not.toContain('nextStep')
    }
    if (kind === 'build') {
      expect(prompt).toContain('Judge build records by meaning')
      expect(prompt).toContain('Honest TODOs, deferred scope and labelled placeholders')
      expect(prompt).toContain('Do not infer successful execution from a script declaration')
    }
    if (kind === 'release') {
      expect(prompt).toContain('Equivalent commands, different package managers, brief concrete observations')
      expect(prompt).toContain('independently confirmed failures still block completion')
    }
  })

  it('names Module 2 documents the way the Practice introduction shows them', () => {
    const reference = getPracticeIntroduction('m2-portfolio-planning')?.reference ?? []
    const shown = new Map(reference.map(([name, path]) => [path, name]))
    expect(PLANNING_DOCUMENT_LEARNER_NAMES.map(([path]) => path)).toEqual([...shown.keys()])
    for (const [path, name] of PLANNING_DOCUMENT_LEARNER_NAMES) {
      // The lesson teaches "PRD"; every other name matches the introduction table.
      if (path !== 'planning/PRD.md') expect(name).toBe(shown.get(path))
    }
  })
})
