import { describe, expect, it } from 'vitest'
import type {
  PracticeDefinition,
  PracticeEvidenceReference
} from '../shared/contracts'
import {
  derivePracticeChecklist,
  parsePracticeReviewResult
} from '../electron/main/practice-review-contracts'

const definition: PracticeDefinition = {
  schemaVersion: 2,
  practiceId: 'generic-practice',
  title: 'Bài thực hành',
  version: '1.0.0',
  checkpointId: 'm1-setup-checklist',
  objective: 'Produce the requested artifact.',
  expectedOutcome: 'The artifact satisfies its task-defined criterion.',
  checklist: [
    { id: 'produce', title: 'Produce artifact', dependsOn: [] },
    { id: 'review', title: 'Review evidence', dependsOn: ['produce'] }
  ],
  criteria: [
    {
      id: 'artifact-exists',
      description: 'Artifact exists',
      required: true,
      checklistStepId: 'produce',
      acceptedEvidence: ['artifact'],
      assertion: 'The artifact exists.',
      freshness: 'any'
    },
    {
      id: 'teacher-reviewed',
      description: 'Teacher reviewed evidence',
      required: true,
      checklistStepId: 'review',
      acceptedEvidence: ['teacher-assessment'],
      assertion: 'The review is complete.',
      freshness: 'fresh'
    }
  ],
  workspaceKind: 'pilot-workspace',
  taskPolicy: 'inherit-configuration-only',
  evidenceProfile: 'codex-task-configuration',
  completionDestination: {
    lessonId: 'module-1',
    checkpointId: 'm1-mastery',
    sceneId: 'module-1-mastery',
    label: 'Bước tiếp theo trong khóa học'
  }
}

const evidence: PracticeEvidenceReference[] = [
  { id: 'artifact:1', kind: 'artifact', text: 'artifact.md', freshness: 'fresh' },
  { id: 'teacher-assessment:1', kind: 'teacher-assessment', text: 'review', freshness: 'fresh' }
]

function proposal(secondStatus: 'satisfied' | 'unsatisfied' = 'satisfied') {
  return JSON.stringify({
    schemaVersion: 1,
    practiceId: definition.practiceId,
    practiceVersion: definition.version,
    runId: 'run-1',
    verdict: secondStatus === 'satisfied' ? 'passed' : 'needs-work',
    criteria: [
      {
        criterionId: 'artifact-exists',
        status: 'satisfied',
        evidenceRefs: ['artifact:1'],
        explanation: 'Artifact evidence is present.'
      },
      {
        criterionId: 'teacher-reviewed',
        status: secondStatus,
        evidenceRefs: secondStatus === 'satisfied' ? ['teacher-assessment:1'] : [],
        explanation: secondStatus === 'satisfied' ? 'Review complete.' : 'Review incomplete.'
      }
    ],
    summary: secondStatus === 'satisfied' ? 'Passed.' : 'Needs work.'
  })
}

describe('Practice review contracts', () => {
  it('validates a generic pass and derives a fully completed checklist', () => {
    const result = parsePracticeReviewResult({
      text: proposal(),
      definition,
      runId: 'run-1',
      evidence,
      reviewedAt: '2026-08-09T00:00:00.000Z'
    })

    expect(result.verdict).toBe('passed')
    expect(result.sourceDigest).toMatch(/^[a-f0-9]{64}$/)
    expect(derivePracticeChecklist(definition, result).map((step) => step.status)).toEqual([
      'completed',
      'completed'
    ])
  })

  it('keeps the earliest unmet task-defined step current', () => {
    const result = parsePracticeReviewResult({
      text: proposal('unsatisfied'),
      definition,
      runId: 'run-1',
      evidence,
      reviewedAt: '2026-08-09T00:00:00.000Z'
    })

    expect(derivePracticeChecklist(definition, result).map((step) => step.status)).toEqual([
      'completed',
      'current'
    ])
  })

  it('keeps problem and next step only as a pair on unmet criteria', () => {
    const parse = (value: unknown) => parsePracticeReviewResult({
      text: JSON.stringify(value),
      definition,
      runId: 'run-1',
      evidence,
      reviewedAt: '2026-08-09T00:00:00.000Z'
    })
    const withGuidance = JSON.parse(proposal('unsatisfied'))
    withGuidance.criteria[0].problem = 'Đã đạt nên không cần.'
    withGuidance.criteria[0].nextStep = 'Không cần làm gì.'
    withGuidance.criteria[1].problem = 'Kế hoạch chưa khớp PRD.'
    withGuidance.criteria[1].nextStep = 'Nhắn Codex sửa kế hoạch rồi nộp lại.'
    const parsed = parse(withGuidance)
    expect(parsed.criteria[0]).not.toHaveProperty('problem')
    expect(parsed.criteria[0]).not.toHaveProperty('nextStep')
    expect(parsed.criteria[1]).toMatchObject({
      problem: 'Kế hoạch chưa khớp PRD.',
      nextStep: 'Nhắn Codex sửa kế hoạch rồi nộp lại.'
    })

    const half = JSON.parse(proposal('unsatisfied'))
    half.criteria[1].problem = 'Kế hoạch chưa khớp PRD.'
    expect(parse(half).criteria[1]).not.toHaveProperty('problem')

    expect(parse(JSON.parse(proposal('unsatisfied'))).criteria[1]).not.toHaveProperty('nextStep')

    for (const invalid of ['', 'x'.repeat(301), 42]) {
      const bad = JSON.parse(proposal('unsatisfied'))
      bad.criteria[1].problem = 'Kế hoạch chưa khớp PRD.'
      bad.criteria[1].nextStep = invalid
      expect(() => parse(bad)).toThrow('Invalid Practice criterion review')
    }
  })

  it('rejects conversational or contradictory pass output', () => {
    expect(() => parsePracticeReviewResult({
      text: 'You passed!',
      definition,
      runId: 'run-1',
      evidence,
      reviewedAt: '2026-08-09T00:00:00.000Z'
    })).toThrow()

    const contradictory = JSON.parse(proposal('unsatisfied'))
    contradictory.verdict = 'passed'
    expect(() => parsePracticeReviewResult({
      text: JSON.stringify(contradictory),
      definition,
      runId: 'run-1',
      evidence,
      reviewedAt: '2026-08-09T00:00:00.000Z'
    })).toThrow('verdict contradicts')
  })
  it('rejects evidence whose provenance is not accepted by the criterion', () => {
    const wrongEvidence = JSON.parse(proposal())
    wrongEvidence.criteria[0].evidenceRefs = ['teacher-assessment:1']

    expect(() => parsePracticeReviewResult({
      text: JSON.stringify(wrongEvidence),
      definition,
      runId: 'run-1',
      evidence,
      reviewedAt: '2026-08-09T00:00:00.000Z'
    })).toThrow('unacceptable evidence')
  })
})
