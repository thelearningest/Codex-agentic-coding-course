import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { ProgressRepository } from '../electron/main/progress-repository'
import type { ProgressUpdate } from '../shared/contracts'

const temporaryDirectories: string[] = []

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'course-companion-progress-'))
  temporaryDirectories.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))
  )
})

const introStart: ProgressUpdate = {
  currentLessonId: 'intro',
  currentCourseLessonId: 'intro-overview',
  checkpointId: 'intro-visual-onboarding',
  sceneId: 'intro-visual-onboarding',
  sceneHistory: [],
  completedCheckpointIds: [],
  decisions: {}
}

const moduleOneStart: ProgressUpdate = {
  currentLessonId: 'module-1',
  currentCourseLessonId: 'm1-understand-codex',
  checkpointId: 'm1-codex-orientation',
  sceneId: 'module-1-codex-orientation',
  sceneHistory: ['intro-visual-onboarding'],
  completedCheckpointIds: ['intro-visual-onboarding'],
  decisions: {}
}

const moduleTwoStart: ProgressUpdate = {
  currentLessonId: 'module-2',
  currentCourseLessonId: 'm2-when-to-plan',
  checkpointId: 'm2-why-planning',
  sceneId: 'module-2-why-planning',
  sceneHistory: ['intro-visual-onboarding'],
  completedCheckpointIds: ['intro-visual-onboarding'],
  decisions: { planningApproach: 'plan-first' }
}

describe('ProgressRepository', () => {
  it('reports a new journey when no local state exists', async () => {
    const repository = new ProgressRepository(await temporaryDirectory())
    await expect(repository.load()).resolves.toEqual({ status: 'new' })
  })

  it('saves an exact checkpoint and preserves the original start time', async () => {
    const directory = await temporaryDirectory()
    const timestamps = [
      new Date('2026-08-06T10:00:00.000Z'),
      new Date('2026-08-06T10:00:01.000Z'),
      new Date('2026-08-06T10:05:00.000Z'),
      new Date('2026-08-06T10:05:01.000Z')
    ]
    const repository = new ProgressRepository(directory, () => timestamps.shift() ?? new Date())

    const started = await repository.save(introStart)
    const resumed = await repository.save(moduleOneStart)

    expect(resumed.startedAt).toBe(started.startedAt)
    await expect(repository.load()).resolves.toEqual({ status: 'returning', progress: resumed })
    const activity = await readFile(join(directory, 'activity-log.jsonl'), 'utf8')
    expect(activity.trim().split('\n')).toHaveLength(2)
  })

  it('resumes past the former Module 1 completion page and removes it from review history', async () => {
    const directory = await temporaryDirectory()
    const repository = new ProgressRepository(directory)
    const started = await repository.save(moduleOneStart)
    const decisions = { setupMastery: 'passed-three-of-four' }
    const oldProgress = {
      ...started, currentCourseLessonId: 'm1-assessment', checkpointId: 'm1-complete',
      sceneId: 'module-1-complete', sceneHistory: ['module-1-final-summary'],
      completedCheckpointIds: ['m1-mastery'], decisions
    }
    const statePath = join(directory, 'learner-state.json')
    await writeFile(statePath, JSON.stringify(oldProgress))
    const expected = {
      ...oldProgress, currentLessonId: 'module-2', currentCourseLessonId: 'm2-portfolio-brief',
      checkpointId: 'm2-portfolio-brief', sceneId: 'module-2-portfolio-workspace',
      completedCheckpointIds: ['m1-mastery', 'm1-complete']
    }
    await expect(repository.load()).resolves.toEqual({ status: 'returning', progress: expected })
    await writeFile(statePath, JSON.stringify({
      ...expected, sceneHistory: ['module-1-final-summary', 'module-1-complete']
    }))
    await expect(repository.load()).resolves.toEqual({ status: 'returning', progress: expected })
  })

  it('moves retired Harness progress to setup Practice', async () => {
    const directory = await temporaryDirectory()
    const repository = new ProgressRepository(directory)
    const started = await repository.save(moduleOneStart)
    const retiredProgress = {
      ...started,
      currentCourseLessonId: 'm1-agents-guidance',
      checkpointId: 'm1-agents-guidance',
      sceneId: 'module-1-harness-codex',
      sceneHistory: [
        ...started.sceneHistory,
        'module-1-agents-guidance',
        'module-1-harness-intro'
      ],
      completedCheckpointIds: [
        ...started.completedCheckpointIds,
        'm1-agents-guidance',
        'm1-skills'
      ]
    }
    await writeFile(
      join(directory, 'learner-state.json'),
      `${JSON.stringify(retiredProgress, null, 2)}\n`,
      'utf8'
    )

    await expect(repository.load()).resolves.toMatchObject({
      status: 'returning',
      progress: {
        currentCourseLessonId: 'm1-assessment',
        checkpointId: 'm1-setup-checklist',
        sceneId: 'module-1-setup-checklist',
        sceneHistory: ['intro-visual-onboarding'],
        completedCheckpointIds: ['intro-visual-onboarding']
      }
    })
    const migrated = JSON.parse(await readFile(join(directory, 'learner-state.json'), 'utf8'))
    expect(JSON.stringify(migrated)).not.toContain('harness')
    expect(JSON.stringify(migrated)).not.toContain('m1-agents-guidance')
  })

  it('moves progress from the removed configuration page to setup Practice', async () => {
    const directory = await temporaryDirectory()
    const repository = new ProgressRepository(directory)
    const started = await repository.save(moduleOneStart)
    const retiredProgress = {
      ...started,
      currentCourseLessonId: 'm1-skills-and-checklist',
      checkpointId: 'm1-model-choice',
      sceneId: 'module-1-model-choice',
      sceneHistory: [
        ...started.sceneHistory,
        'module-1-skills-intro',
        'module-1-model-use-cases'
      ],
      completedCheckpointIds: [
        ...started.completedCheckpointIds,
        'm1-agents-and-skills',
        'm1-model-choice'
      ],
      decisions: {
        modelChoice: 'sol-high-standard'
      }
    }
    await writeFile(
      join(directory, 'learner-state.json'),
      `${JSON.stringify(retiredProgress, null, 2)}\n`,
      'utf8'
    )

    await expect(repository.load()).resolves.toMatchObject({
      status: 'returning',
      progress: {
        currentCourseLessonId: 'm1-assessment',
        checkpointId: 'm1-setup-checklist',
        sceneId: 'module-1-setup-checklist',
        sceneHistory: ['intro-visual-onboarding', 'module-1-skills-intro'],
        completedCheckpointIds: ['intro-visual-onboarding', 'm1-agents-and-skills'],
        decisions: {}
      }
    })
    const migrated = JSON.parse(await readFile(join(directory, 'learner-state.json'), 'utf8'))
    expect(JSON.stringify(migrated)).not.toContain('module-1-model')
    expect(JSON.stringify(migrated)).not.toContain('m1-model-choice')
    expect(migrated.decisions).not.toHaveProperty('modelChoice')
  })

  it('moves retired AGENTS.md progress to the restored guidance lesson', async () => {
    const directory = await temporaryDirectory()
    const repository = new ProgressRepository(directory)
    const started = await repository.save(moduleOneStart)
    await writeFile(
      join(directory, 'learner-state.json'),
      `${JSON.stringify({
        ...started,
        currentCourseLessonId: 'm1-agents-guidance',
        checkpointId: 'm1-agents-guidance',
        sceneId: 'module-1-agents-guidance'
      }, null, 2)}\n`,
      'utf8'
    )

    await expect(repository.load()).resolves.toMatchObject({
      status: 'returning',
      progress: {
        currentCourseLessonId: 'm1-agents-and-skills',
        checkpointId: 'm1-agents-and-skills',
        sceneId: 'module-1-agents-intro'
      }
    })
  })

  it('moves progress from a retired fifth Module 1 question to the first unanswered remaining question', async () => {
    const directory = await temporaryDirectory()
    const repository = new ProgressRepository(directory)
    const started = await repository.save(moduleOneStart)
    const retiredProgress = {
      ...started,
      currentCourseLessonId: 'm1-assessment',
      checkpointId: 'm1-mastery',
      sceneId: 'module-1-final-5',
      sceneHistory: [
        ...started.sceneHistory,
        'module-1-final-4',
        'module-1-final-5'
      ],
      decisions: {
        ...started.decisions,
        'assessment:m1-q1': 'correct:0',
        'assessment:m1-q2': 'correct:0',
        'assessment:m1-q3': 'correct:0',
        'assessment:m1-q4': 'correct:self-review:Câu trả lời của người học.'
      }
    }
    await writeFile(
      join(directory, 'learner-state.json'),
      `${JSON.stringify(retiredProgress, null, 2)}\n`,
      'utf8'
    )

    const loaded = await repository.load()
    expect(loaded).toMatchObject({
      status: 'returning',
      progress: {
        currentCourseLessonId: 'm1-assessment',
        checkpointId: 'm1-mastery',
        // Questions 1 and 2 are kept; the former fifth question is now third.
        sceneId: 'module-1-final-3',
        sceneHistory: ['intro-visual-onboarding', 'module-1-final-4']
      }
    })
    if (loaded.status !== 'returning') throw new Error('Expected returning progress')
    expect(loaded.progress.decisions).toMatchObject({
      'assessment:m1-q1': 'correct:0',
      'assessment:m1-q2': 'correct:0'
    })
    expect(loaded.progress.decisions).not.toHaveProperty('assessment:m1-q3')
    expect(loaded.progress.decisions).not.toHaveProperty('assessment:m1-q4')
  })

  it('moves a completed old Module 1 review on a retired question page to the summary', async () => {
    const directory = await temporaryDirectory()
    const repository = new ProgressRepository(directory)
    const started = await repository.save(moduleOneStart)
    await writeFile(join(directory, 'learner-state.json'), `${JSON.stringify({
      ...started,
      currentCourseLessonId: 'm1-assessment',
      checkpointId: 'm1-mastery',
      sceneId: 'module-1-final-6',
      sceneHistory: [...started.sceneHistory, 'module-1-final-5', 'module-1-final-6'],
      decisions: {
        ...started.decisions,
        'assessment:m1-q1': 'correct:0',
        'assessment:m1-q2': 'correct:0',
        'assessment:m1-q3': 'correct:0',
        'assessment:m1-q4': 'correct:0',
        'assessment:m1-q5-agents': 'correct:0',
        'assessment:m1-q6-skills': 'correct:0'
      }
    }, null, 2)}\n`, 'utf8')

    await expect(repository.load()).resolves.toMatchObject({
      status: 'returning',
      progress: { sceneId: 'module-1-final-summary', sceneHistory: ['intro-visual-onboarding'] }
    })
  })

  it('redirects saved progress from the retired PRD anatomy page to PRD review', async () => {
    const directory = await temporaryDirectory()
    const repository = new ProgressRepository(directory)
    const started = await repository.save({
      currentLessonId: 'module-2',
      currentCourseLessonId: 'm2-portfolio-brief',
      checkpointId: 'm2-portfolio-brief',
      sceneId: 'module-2-prd-definition',
      sceneHistory: ['module-2-portfolio-workspace'],
      completedCheckpointIds: [],
      decisions: {}
    })
    const anatomyProgress = {
      ...started,
      sceneId: 'module-2-prd-anatomy',
      sceneHistory: [
        ...started.sceneHistory,
        'module-2-prd-definition'
      ]
    }
    await writeFile(
      join(directory, 'learner-state.json'),
      `${JSON.stringify(anatomyProgress, null, 2)}\n`,
      'utf8'
    )

    await expect(repository.load()).resolves.toMatchObject({
      status: 'returning',
      progress: {
        currentCourseLessonId: 'm2-portfolio-brief',
        checkpointId: 'm2-portfolio-brief',
        sceneId: 'module-2-prd-review-workflow',
        sceneHistory: [
          'module-2-portfolio-workspace',
          'module-2-prd-definition'
        ]
      }
    })
  })

  it.each([
    ['module-2-prd-sample-prompt', 'module-2-prd-agent-workflow'],
    ['module-2-implementation-plan-sample-prompt', 'module-2-portfolio-folder']
  ])('redirects saved progress from the removed %s page to %s', async (retiredSceneId, destination) => {
    const directory = await temporaryDirectory()
    const repository = new ProgressRepository(directory)
    const started = await repository.save({
      currentLessonId: 'module-2',
      currentCourseLessonId: 'm2-portfolio-brief',
      checkpointId: 'm2-portfolio-brief',
      sceneId: 'module-2-prd-review-workflow',
      sceneHistory: ['module-2-portfolio-workspace', 'module-2-prd-definition'],
      completedCheckpointIds: [],
      decisions: {}
    })
    await writeFile(
      join(directory, 'learner-state.json'),
      `${JSON.stringify({
        ...started,
        sceneId: retiredSceneId,
        sceneHistory: [...started.sceneHistory, 'module-2-prd-review-workflow', 'module-2-prd-sample-prompt']
      }, null, 2)}\n`,
      'utf8'
    )

    await expect(repository.load()).resolves.toMatchObject({
      status: 'returning',
      progress: {
        checkpointId: 'm2-portfolio-brief',
        sceneId: destination,
        sceneHistory: ['module-2-portfolio-workspace', 'module-2-prd-definition', 'module-2-prd-review-workflow']
      }
    })
  })

  it('redirects saved progress from the retired one-task page to the five-stage map', async () => {
    const directory = await temporaryDirectory()
    const repository = new ProgressRepository(directory)
    const started = await repository.save({
      currentLessonId: 'module-2',
      currentCourseLessonId: 'm2-portfolio-brief',
      checkpointId: 'm2-portfolio-brief',
      sceneId: 'module-2-prd-review-workflow',
      sceneHistory: [
        'module-2-portfolio-workspace',
        'module-2-prd-definition'
      ],
      completedCheckpointIds: [],
      decisions: {}
    })
    const retiredProgress = {
      ...started,
      sceneId: 'module-2-prd-introduction',
      sceneHistory: [
        ...started.sceneHistory,
        'module-2-prd-review-workflow',
        'module-2-prd-introduction'
      ]
    }
    await writeFile(
      join(directory, 'learner-state.json'),
      `${JSON.stringify(retiredProgress, null, 2)}\n`,
      'utf8'
    )

    await expect(repository.load()).resolves.toMatchObject({
      status: 'returning',
      progress: {
        currentCourseLessonId: 'm2-portfolio-brief',
        checkpointId: 'm2-portfolio-brief',
        sceneId: 'module-2-prd-agent-workflow',
        sceneHistory: [
          'module-2-portfolio-workspace',
          'module-2-prd-definition',
          'module-2-prd-review-workflow'
        ]
      }
    })
    const migrated = JSON.parse(await readFile(join(directory, 'learner-state.json'), 'utf8'))
    expect(JSON.stringify(migrated)).not.toContain('module-2-prd-introduction')
  })

  it('redirects all retired implementation-plan pages to the combined introduction', async () => {
    const directory = await temporaryDirectory()
    const repository = new ProgressRepository(directory)
    const started = await repository.save({
      currentLessonId: 'module-2',
      currentCourseLessonId: 'm2-portfolio-brief',
      checkpointId: 'm2-portfolio-brief',
      sceneId: 'module-2-implementation-plan-intro',
      sceneHistory: [
        'module-2-portfolio-workspace',
        'module-2-prd-definition',
        'module-2-prd-review-workflow',
        'module-2-prd-agent-workflow'
      ],
      completedCheckpointIds: [],
      decisions: {}
    })
    const retiredProgress = {
      ...started,
      sceneId: 'module-2-plan-risks',
      sceneHistory: [
        ...started.sceneHistory,
        'module-2-plan-example',
        'module-2-plan-requirements',
        'module-2-plan-steps',
        'module-2-plan-testing'
      ]
    }
    await writeFile(
      join(directory, 'learner-state.json'),
      `${JSON.stringify(retiredProgress, null, 2)}\n`,
      'utf8'
    )

    await expect(repository.load()).resolves.toMatchObject({
      status: 'returning',
      progress: {
        currentCourseLessonId: 'm2-portfolio-brief',
        checkpointId: 'm2-portfolio-brief',
        sceneId: 'module-2-implementation-plan-intro',
        sceneHistory: [
          'module-2-portfolio-workspace',
          'module-2-prd-definition',
          'module-2-prd-review-workflow',
          'module-2-prd-agent-workflow'
        ]
      }
    })
    const migrated = JSON.parse(await readFile(join(directory, 'learner-state.json'), 'utf8'))
    expect(JSON.stringify(migrated)).not.toContain('module-2-plan-example')
    expect(JSON.stringify(migrated)).not.toContain('module-2-plan-requirements')
    expect(JSON.stringify(migrated)).not.toContain('module-2-plan-steps')
    expect(JSON.stringify(migrated)).not.toContain('module-2-plan-testing')
    expect(JSON.stringify(migrated)).not.toContain('module-2-plan-risks')
  })

  it('redirects retired Module 2 Practice-setup slides directly to Practice while preserving the workspace picker', async () => {
    const directory = await temporaryDirectory()
    const repository = new ProgressRepository(directory)
    const started = await repository.save({
      currentLessonId: 'module-2',
      currentCourseLessonId: 'm2-portfolio-brief',
      checkpointId: 'm2-portfolio-brief',
      sceneId: 'module-2-implementation-plan-intro',
      sceneHistory: [
        'module-2-portfolio-workspace',
        'module-2-prd-definition',
        'module-2-prd-review-workflow',
        'module-2-prd-agent-workflow'
      ],
      completedCheckpointIds: [],
      decisions: {}
    })
    const retiredSceneIds = [
      'module-2-portfolio-practice-intro',
      'module-2-portfolio-agents-setup',
      'module-2-portfolio-brief',
      'module-2-portfolio-brief-example',
      'module-2-check-brief-viewer',
      'module-2-check-brief-success',
      'module-2-content-evidence-inventory',
      'module-2-content-evidence-example',
      'module-2-check-evidence-status',
      'module-2-check-evidence-permission',
      'module-2-visual-reference',
      'module-2-visual-reference-example',
      'module-2-check-reference-boundary',
      'module-2-check-reference-record',
      'module-2-portfolio-prd',
      'module-2-portfolio-prd-example',
      'module-2-check-prd-requirement',
      'module-2-check-prd-accessibility',
      'module-2-implementation-contract',
      'module-2-implementation-contract-example',
      'module-2-check-delayed-scope',
      'module-2-check-delayed-evidence'
    ]
    await writeFile(
      join(directory, 'learner-state.json'),
      `${JSON.stringify({
        ...started,
        currentCourseLessonId: 'm2-implementation-contract',
        checkpointId: 'm2-implementation-contract',
        sceneId: retiredSceneIds.at(-1),
        sceneHistory: [...started.sceneHistory, ...retiredSceneIds]
      }, null, 2)}\n`,
      'utf8'
    )

    await expect(repository.load()).resolves.toMatchObject({
      status: 'returning',
      progress: {
        currentCourseLessonId: 'm2-portfolio-brief',
        checkpointId: 'm2-portfolio-planning',
        sceneId: 'module-2-portfolio-practice',
        sceneHistory: started.sceneHistory
      }
    })
    const migrated = await readFile(join(directory, 'learner-state.json'), 'utf8')
    for (const retiredSceneId of retiredSceneIds) expect(migrated).not.toContain(retiredSceneId)
    expect(migrated).not.toContain('m2-implementation-contract')

    await repository.save({
      ...started,
      sceneId: 'module-2-portfolio-folder',
      sceneHistory: [...started.sceneHistory, 'module-2-implementation-plan-intro']
    })
    await expect(repository.load()).resolves.toMatchObject({
      status: 'returning',
      progress: {
        checkpointId: 'm2-portfolio-brief',
        sceneId: 'module-2-portfolio-folder'
      }
    })
  })

  it('redirects saved progress from retired Module 3 opening pages to debugging', async () => {
    const directory = await temporaryDirectory()
    const repository = new ProgressRepository(directory)
    const started = await repository.save(introStart)
    const retiredProgress = {
      ...started,
      currentLessonId: 'module-3',
      currentCourseLessonId: 'm3-scaffold-baseline',
      checkpointId: 'm3-scaffold-baseline',
      sceneId: 'module-3-implementation-cycle',
      sceneHistory: ['module-3-readiness', 'module-3-implementation-cycle'],
      completedCheckpointIds: [],
      decisions: {}
    }
    await writeFile(
      join(directory, 'learner-state.json'),
      `${JSON.stringify(retiredProgress, null, 2)}\n`,
      'utf8'
    )

    await expect(repository.load()).resolves.toMatchObject({
      status: 'returning',
      progress: {
        currentCourseLessonId: 'm3-complete-first-version',
        checkpointId: 'm3-complete-first-version',
        sceneId: 'module-3-debugging-intro',
        sceneHistory: []
      }
    })
    const migrated = JSON.parse(await readFile(join(directory, 'learner-state.json'), 'utf8'))
    expect(JSON.stringify(migrated)).not.toContain('module-3-implementation-cycle')
    expect(JSON.stringify(migrated)).not.toContain('module-3-readiness')
  })

  it('redirects retired Module 3 Practice-setup scenes directly to Practice', async () => {
    const retiredSceneIds = [
      'module-3-enhancement-intro',
      'module-3-check-enhancement-boundary',
      'module-3-practice-intro'
    ]

    for (const retiredSceneId of retiredSceneIds) {
      const directory = await temporaryDirectory()
      const repository = new ProgressRepository(directory)
      const started = await repository.save(introStart)
      await writeFile(
        join(directory, 'learner-state.json'),
        `${JSON.stringify({
          ...started,
          currentLessonId: 'module-3',
          currentCourseLessonId: 'm3-evidence-debugging',
          checkpointId: 'm3-evidence-debugging',
          sceneId: retiredSceneId,
          sceneHistory: ['module-3-git-branch', ...retiredSceneIds],
          completedCheckpointIds: [],
          decisions: {}
        }, null, 2)}\n`,
        'utf8'
      )

      await expect(repository.load()).resolves.toMatchObject({
        status: 'returning',
        progress: {
          currentCourseLessonId: 'm3-evidence-debugging',
          checkpointId: 'm3-portfolio-build',
          sceneId: 'module-3-portfolio-practice',
          sceneHistory: ['module-3-git-branch']
        }
      })
      const migrated = await readFile(join(directory, 'learner-state.json'), 'utf8')
      for (const sceneId of retiredSceneIds) expect(migrated).not.toContain(sceneId)
    }
  })

  it('removes saved progress for retired Module 2 mastery questions', async () => {
    const directory = await temporaryDirectory()
    const repository = new ProgressRepository(directory)
    const started = await repository.save({
      currentLessonId: 'module-2',
      currentCourseLessonId: 'm2-portfolio-brief',
      checkpointId: 'm2-portfolio-planning',
      sceneId: 'module-2-portfolio-practice',
      sceneHistory: ['module-2-portfolio-practice'],
      completedCheckpointIds: ['m2-portfolio-planning'],
      decisions: {}
    })
    const retiredProgress = {
      ...started,
      checkpointId: 'm2-portfolio-mastery',
      sceneId: 'module-2-mastery-scenario-reference',
      sceneHistory: [
        ...started.sceneHistory,
        'module-2-portfolio-mastery',
        'module-2-mastery-scenario-viewer',
        'module-2-mastery-scenario-evidence',
        'module-2-mastery-scenario-reference',
        'module-2-mastery-owned-scope',
        'module-2-mastery-owned-evidence',
        'module-2-mastery-owned-validation'
      ],
      decisions: {
        'assessment:mastery-1': 'correct:1',
        'assessment:mastery-2': 'correct:1',
        'assessment:mastery-3': 'correct:1',
        'assessment:mastery-scope-boundary': 'correct:self-review:Phạm vi đã đối chiếu.',
        'assessment:mastery-evidence-gap': 'correct:self-review:Khoảng trống đã đối chiếu.',
        'assessment:mastery-requirement-validation': 'correct:self-review:Yêu cầu đã đối chiếu.'
      }
    }
    await writeFile(
      join(directory, 'learner-state.json'),
      `${JSON.stringify(retiredProgress, null, 2)}\n`,
      'utf8'
    )

    await expect(repository.load()).resolves.toMatchObject({
      status: 'returning',
      progress: {
        sceneId: 'module-2-mastery-scenario-viewer',
        sceneHistory: [
          'module-2-portfolio-practice',
          'module-2-portfolio-mastery',
          'module-2-mastery-scenario-viewer'
        ],
        decisions: {
          'assessment:mastery-1': 'correct:1'
        }
      }
    })
    const migrated = JSON.parse(await readFile(join(directory, 'learner-state.json'), 'utf8'))
    expect(JSON.stringify(migrated)).not.toContain('mastery-2')
    expect(JSON.stringify(migrated)).not.toContain('mastery-3')
    expect(JSON.stringify(migrated)).not.toContain('mastery-scope-boundary')
    expect(JSON.stringify(migrated)).not.toContain('mastery-evidence-gap')
    expect(JSON.stringify(migrated)).not.toContain('mastery-requirement-validation')
    expect(JSON.stringify(migrated)).not.toContain('module-2-mastery-scenario-evidence')
    expect(JSON.stringify(migrated)).not.toContain('module-2-mastery-scenario-reference')
    expect(JSON.stringify(migrated)).not.toContain('module-2-mastery-owned-scope')
    expect(JSON.stringify(migrated)).not.toContain('module-2-mastery-owned-evidence')
    expect(JSON.stringify(migrated)).not.toContain('module-2-mastery-owned-validation')
  })

  it('moves learners off the removed Module 2 audience question and keeps the four scenario answers', async () => {
    const directory = await temporaryDirectory()
    const repository = new ProgressRepository(directory)
    const started = await repository.save({
      currentLessonId: 'module-2',
      currentCourseLessonId: 'm2-portfolio-brief',
      checkpointId: 'm2-portfolio-planning',
      sceneId: 'module-2-portfolio-practice',
      sceneHistory: ['module-2-portfolio-practice'],
      completedCheckpointIds: ['m2-portfolio-planning'],
      decisions: {}
    })
    const scenarioAnswers = {
      'assessment:mastery-1': 'correct:1',
      'assessment:mastery-4': 'correct:1',
      'assessment:mastery-5': 'correct:1',
      'assessment:mastery-6': 'correct:2'
    }
    await writeFile(join(directory, 'learner-state.json'), `${JSON.stringify({
      ...started,
      checkpointId: 'm2-portfolio-mastery',
      sceneId: 'module-2-mastery-owned-audience',
      sceneHistory: [
        ...started.sceneHistory,
        'module-2-portfolio-mastery',
        'module-2-mastery-scenario-viewer',
        'module-2-mastery-scenario-first-task',
        'module-2-mastery-owned-audience'
      ],
      decisions: {
        ...scenarioAnswers,
        'assessment:mastery-audience-choice': 'correct:self-review:Nhà tuyển dụng cần xem dự án thật.'
      }
    }, null, 2)}\n`, 'utf8')

    await expect(repository.load()).resolves.toMatchObject({
      status: 'returning',
      progress: {
        sceneId: 'module-2-mastery-scenario-viewer',
        sceneHistory: [
          'module-2-portfolio-practice',
          'module-2-portfolio-mastery',
          'module-2-mastery-scenario-viewer',
          'module-2-mastery-scenario-first-task'
        ],
        decisions: scenarioAnswers
      }
    })
    const migrated = await readFile(join(directory, 'learner-state.json'), 'utf8')
    expect(migrated).not.toContain('mastery-audience-choice')
    expect(migrated).not.toContain('module-2-mastery-owned-audience')
  })

  it('resumes an exact page inside the opening introduction', async () => {
    const repository = new ProgressRepository(await temporaryDirectory())
    await repository.save(introStart)

    const overviewPageTwo = await repository.save({
      currentLessonId: 'intro',
      currentCourseLessonId: 'intro-overview',
      checkpointId: 'intro-visual-onboarding',
      sceneId: 'intro-course-overview-2',
      sceneHistory: ['intro-visual-onboarding'],
      completedCheckpointIds: [],
      decisions: {}
    })

    await expect(repository.load()).resolves.toEqual({
      status: 'returning',
      progress: overviewPageTwo
    })
  })

  it('resumes a source-backed teaching example inside a Module 2 checkpoint', async () => {
    const repository = new ProgressRepository(await temporaryDirectory())
    const promptExample = await repository.save({
      currentLessonId: 'module-2',
      currentCourseLessonId: 'm2-prd-prompt',
      checkpointId: 'm2-prd-interview',
      sceneId: 'module-2-prompt-example',
      sceneHistory: [
        'module-2-why-planning',
        'module-2-contentpilot-brief',
        'module-2-prd-concept',
        'module-2-prd-interview'
      ],
      completedCheckpointIds: [
        'intro-visual-onboarding',
        'm2-why-planning',
        'm2-contentpilot-brief',
        'm2-prd-concept'
      ],
      decisions: {
        planningApproach: 'plan-first',
        clarificationFocus: 'product-requirements',
        prdClassification: 'scope-in-prd'
      }
    })

    await expect(repository.load()).resolves.toEqual({
      status: 'returning',
      progress: promptExample
    })
  })

  it('resumes the exact sourced assessment question and its saved result', async () => {
    const repository = new ProgressRepository(await temporaryDirectory())
    const promptQuestion = await repository.save({
      currentLessonId: 'module-2',
      currentCourseLessonId: 'm2-prd-prompt',
      checkpointId: 'm2-prd-interview',
      sceneId: 'module-2-check-prompt-2',
      sceneHistory: ['module-2-prd-interview', 'module-2-check-prompt-1'],
      completedCheckpointIds: [
        'intro-visual-onboarding',
        'm2-why-planning',
        'm2-contentpilot-brief',
        'm2-prd-concept'
      ],
      decisions: {
        'assessment:planning-prd-1': 'correct:1',
        'assessment:planning-prd-2': 'correct:0',
        'assessment:planning-prd-3': 'correct:0',
        'assessment:prompt-1': 'correct:1'
      }
    })

    await expect(repository.load()).resolves.toEqual({
      status: 'returning',
      progress: promptQuestion
    })
  })

  it.each([
    { schemaVersion: 5, courseVersion: '0.2.0' },
    { schemaVersion: 2, courseVersion: '0.1.0' }
  ])(
    'silently starts a new run for obsolete state $courseVersion/schema-$schemaVersion',
    async ({ schemaVersion, courseVersion }) => {
      const directory = await temporaryDirectory()
      const oldProgress = {
        schemaVersion,
        courseVersion,
        currentLessonId: 'module-2',
        currentCourseLessonId: 'm2-assessment',
        checkpointId: 'm2-complete',
        sceneId: 'module-2-complete',
        sceneHistory: ['module-2-mastery'],
        completedCheckpointIds: ['m2-mastery'],
        decisions: { masteryEvidence: 'old-contentpilot-evidence' },
        practice: { missionId: 'm2-planning-package', status: 'completed' },
        practiceCompletions: [{ practiceId: 'm2-planning-package' }],
        courseRunId: 'old-course-run',
        startedAt: '2026-08-06T10:00:00.000Z',
        updatedAt: '2026-08-06T10:05:00.000Z'
      }
      const serialized = `${JSON.stringify(oldProgress, null, 2)}\n`
      await Promise.all([
        writeFile(join(directory, 'learner-state.json'), serialized, 'utf8'),
        writeFile(join(directory, 'learner-state.backup.json'), serialized, 'utf8')
      ])

      const repository = new ProgressRepository(directory)
      await expect(repository.load()).resolves.toEqual({ status: 'new' })
      await expect(readFile(join(directory, 'learner-state.json'), 'utf8')).resolves.toBe(serialized)
      await expect(readFile(join(directory, 'learner-state.backup.json'), 'utf8')).resolves.toBe(serialized)
      await expect(readFile(join(directory, 'activity-log.jsonl'), 'utf8')).rejects.toMatchObject({
        code: 'ENOENT'
      })
    }
  )

  it('serializes overlapping saves so atomic temporary files cannot collide', async () => {
    const repository = new ProgressRepository(await temporaryDirectory())
    await repository.save(moduleTwoStart)

    await Promise.all([
      repository.save({
        currentLessonId: 'module-2',
        currentCourseLessonId: 'm2-when-to-plan',
        checkpointId: 'm2-contentpilot-brief',
        sceneId: 'module-2-contentpilot-brief',
        sceneHistory: ['module-2-why-planning'],
        completedCheckpointIds: ['intro-visual-onboarding', 'm2-why-planning'],
        decisions: { planningApproach: 'plan-first' }
      }),
      repository.save({
        currentLessonId: 'module-2',
        currentCourseLessonId: 'm2-product-requirements',
        checkpointId: 'm2-prd-concept',
        sceneId: 'module-2-prd-concept',
        sceneHistory: ['module-2-why-planning', 'module-2-contentpilot-brief'],
        completedCheckpointIds: [
          'intro-visual-onboarding',
          'm2-why-planning',
          'm2-contentpilot-brief'
        ],
        decisions: {
          planningApproach: 'plan-first',
          clarificationFocus: 'product-requirements'
        }
      })
    ])

    await expect(repository.load()).resolves.toMatchObject({
      status: 'returning',
      progress: { sceneId: 'module-2-prd-concept' }
    })
  })

  it('recovers the last known-good state when the primary file is damaged', async () => {
    const directory = await temporaryDirectory()
    const repository = new ProgressRepository(directory)
    const first = await repository.save(introStart)
    await repository.save({
      currentLessonId: 'intro',
      currentCourseLessonId: 'intro-overview',
      checkpointId: 'intro-visual-onboarding',
      sceneId: 'intro-course-overview-2',
      sceneHistory: ['intro-visual-onboarding'],
      completedCheckpointIds: [],
      decisions: {}
    })
    await writeFile(join(directory, 'learner-state.json'), '{damaged', 'utf8')

    await expect(repository.load()).resolves.toEqual({ status: 'recovered', progress: first })
    expect(JSON.parse(await readFile(join(directory, 'learner-state.json'), 'utf8'))).toEqual(first)
  })

  it('requires reset when neither the primary nor backup state is valid', async () => {
    const directory = await temporaryDirectory()
    await writeFile(join(directory, 'learner-state.json'), '{}', 'utf8')
    await writeFile(join(directory, 'learner-state.backup.json'), '[]', 'utf8')
    const repository = new ProgressRepository(directory)

    await expect(repository.load()).resolves.toMatchObject({ status: 'reset-required' })
  })

  it('removes journey and activity data on reset', async () => {
    const repository = new ProgressRepository(await temporaryDirectory())
    await repository.save(introStart)
    await repository.reset()
    await expect(repository.load()).resolves.toEqual({ status: 'new' })
  })
})
