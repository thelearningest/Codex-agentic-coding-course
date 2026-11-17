import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

type PracticeDefinition = {
  practiceId: string
  checkpointId: string
  objective: string
  expectedOutcome: string
  reportTitle: string
  requiredSettings: Array<{ id: string; label: string; value: string }>
  criteria: Array<{
    id: string
    description: string
    required: boolean
    acceptedEvidence: string[]
    assertion: string
    freshness: string
  }>
}

async function loadJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8')) as unknown
}

describe('Module 1 Practice definition', () => {
  const practicePath = join(
    process.cwd(),
    '..',
    'pilot-workspace',
    'course',
    'practices',
    'm1-codex-safe-setup.json'
  )

  it('is discoverable from the runnable course structure', async () => {
    const course = await loadJson(join(
      process.cwd(),
      '..',
      'pilot-workspace',
      'course',
      'course-structure.json'
    )) as {
      modules: Array<{ id: string; lessons: Array<{ id: string; practicePath?: string }> }>
    }
    const assessment = course.modules
      .find((module) => module.id === 'module-1')
      ?.lessons.find((lesson) => lesson.id === 'm1-assessment')

    expect(assessment?.practicePath).toBe('course/practices/m1-codex-safe-setup.json')
  })

  it('defines the exact outcome and machine-readable passing evidence', async () => {
    const practice = await loadJson(practicePath) as PracticeDefinition

    expect(practice.practiceId).toBe('m1-codex-safe-setup')
    expect(practice.checkpointId).toBe('m1-setup-checklist')
    expect(practice.objective.length).toBeGreaterThan(40)
    expect(practice.expectedOutcome).toContain('hai ảnh')
    expect(practice.reportTitle).toBe('Verification')
    expect(Object.fromEntries(
      practice.requiredSettings.map((setting) => [setting.label, setting.value])
    )).toEqual({
      Effort: 'High',
      Speed: 'Standard',
      Approval: 'Approve for me',
      'Full access': 'Tắt'
    })
    expect(practice.criteria).toHaveLength(5)
    expect(new Set(practice.criteria.map((criterion) => criterion.id)).size).toBe(5)
    for (const criterion of practice.criteria) {
      expect(criterion.required).toBe(true)
      expect(criterion.description.length).toBeGreaterThan(20)
      expect(criterion.acceptedEvidence.length).toBeGreaterThan(0)
      expect(criterion.assertion.length).toBeGreaterThan(30)
      expect(criterion.freshness).toBe('fresh')
    }
  })
})
