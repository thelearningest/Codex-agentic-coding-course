import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  COURSE_VERSION,
  LEARNER_STATE_SCHEMA_VERSION,
  type LearnerProgress,
  type LessonId
} from '../shared/contracts'
import {
  TeacherCourseContextRepository
} from '../electron/main/teacher-course-context-repository'

const timestamp = '2026-08-19T00:00:00.000Z'
const pilotWorkspace = resolve(process.cwd(), '..', 'pilot-workspace')
const directories: string[] = []

const activeState: Record<LessonId, Pick<LearnerProgress, 'currentCourseLessonId' | 'checkpointId' | 'sceneId'>> = {
  intro: {
    currentCourseLessonId: 'intro-overview',
    checkpointId: 'intro-visual-onboarding',
    sceneId: 'intro-visual-onboarding'
  },
  'module-1': {
    currentCourseLessonId: 'm1-understand-codex',
    checkpointId: 'm1-codex-orientation',
    sceneId: 'module-1-codex-orientation'
  },
  'module-2': {
    currentCourseLessonId: 'm2-when-to-plan',
    checkpointId: 'm2-why-planning',
    sceneId: 'module-2-why-planning'
  },
  'module-3': {
    currentCourseLessonId: 'm3-complete-first-version',
    checkpointId: 'm3-complete-first-version',
    sceneId: 'module-3-debugging-intro'
  },
  'module-4': {
    currentCourseLessonId: 'm4-release-validation',
    checkpointId: 'm4-release-validation',
    sceneId: 'module-4-hosting-intro'
  }
}

function progress(moduleId: LessonId): LearnerProgress {
  return {
    schemaVersion: LEARNER_STATE_SCHEMA_VERSION,
    courseVersion: COURSE_VERSION,
    courseRunId: 'course-run-1',
    currentLessonId: moduleId,
    ...activeState[moduleId],
    sceneHistory: [],
    completedCheckpointIds: [],
    decisions: { audience: 'Nhà tuyển dụng sản phẩm số' },
    practice: { missionId: 'm2-planning-package', status: 'idle' },
    practiceCompletions: [],
    startedAt: timestamp,
    updatedAt: timestamp
  }
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

async function copiedPilotWorkspace(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'teacher-course-context-'))
  directories.push(directory)
  const target = join(directory, 'pilot-workspace')
  await mkdir(join(target, '.agents', 'skills'), { recursive: true })
  await cp(join(pilotWorkspace, 'course'), join(target, 'course'), { recursive: true })
  await cp(
    join(pilotWorkspace, '.agents', 'skills', 'triet-pedagogy'),
    join(target, '.agents', 'skills', 'triet-pedagogy'),
    { recursive: true }
  )
  return target
}

describe('TeacherCourseContextRepository', () => {
  it('loads a complete, digested authoritative package for every runnable module', async () => {
    const repository = new TeacherCourseContextRepository(pilotWorkspace)

    for (const moduleId of Object.keys(activeState) as LessonId[]) {
      const result = await repository.load(progress(moduleId))
      expect(result.moduleId).toBe(moduleId)
      expect(result.sources).toHaveLength(11)
      expect(result.sources.every((source) => /^[a-f0-9]{64}$/.test(source.digest))).toBe(true)
      expect(result.sources.some((source) => source.path === `course/lessons/${moduleId}.vi.md`)).toBe(true)
      expect(result.sources.some((source) => source.path === `course/quizzes/${moduleId}.quiz.json`)).toBe(true)
      expect(result.pedagogyInstructions).toContain('Protect open assessments')
      expect(result.digest).toMatch(/^[a-f0-9]{64}$/)
      if (moduleId === 'module-4') expect(result.activeAssessment).toBeNull()
    }
  })

  it('keeps the complete Module 2 package above the former envelope limit', async () => {
    const result = await new TeacherCourseContextRepository(pilotWorkspace).load(progress('module-2'))

    expect(result.characterCount).toBeGreaterThan(24_000)
    expect(result.sources.find((source) => source.path.endsWith('module-2.script.vi.md'))?.content)
      .toContain('Teacher nói:')
    expect(result.sources.find((source) => source.path.endsWith('module-2.quiz.json'))?.content)
      .toContain('answerIndex')
  })

  it('binds the exact displayed assessment question and authoritative answer state', async () => {
    const repository = new TeacherCourseContextRepository(pilotWorkspace)
    const openProgress = {
      ...progress('module-1'),
      currentCourseLessonId: 'm1-assessment' as const,
      checkpointId: 'm1-mastery' as const,
      sceneId: 'module-1-final-1' as const
    }
    const open = await repository.load(openProgress)
    const answered = await repository.load({
      ...openProgress,
      decisions: { ...openProgress.decisions, ...Object.fromEntries(
        ['m1-q1', 'm1-q2-approval', 'm1-q3', 'm1-q4', 'm1-q5-agents', 'm1-q6-skills'].map((id) => [`assessment:${id}`, 'correct:0'])) }
    })

    expect(open.activeAssessment).toMatchObject({
      groupId: 'setup-final-assessment',
      mode: 'mastery',
      questionId: 'm1-q1',
      sceneId: 'module-1-final-1',
      status: 'open',
      question: { id: 'm1-q1', type: 'multiple-choice' }
    })
    expect(open.activeAssessment?.question.prompt).toContain('coding agent')
    expect(answered.activeAssessment).toMatchObject({ status: 'answered', learnerResult: 'correct:0' })
  })

  it('binds grouped Module 2–3 assessment scenes directly from their quiz definitions', async () => {
    const states = [
      { moduleId: 'module-2' as const, currentCourseLessonId: 'm2-portfolio-brief' as const, checkpointId: 'm2-portfolio-mastery' as const, sceneId: 'module-2-mastery-scenario-viewer' as const, questionId: 'mastery-1' },
      { moduleId: 'module-3' as const, currentCourseLessonId: 'm3-independent-enhancement' as const, checkpointId: 'm3-mastery' as const, sceneId: 'module-3-mastery-plan' as const, questionId: 'm3-mastery-plan' },
    ]
    const repository = new TeacherCourseContextRepository(pilotWorkspace)

    for (const state of states) {
      const result = await repository.load({
        ...progress(state.moduleId),
        currentCourseLessonId: state.currentCourseLessonId,
        checkpointId: state.checkpointId,
        sceneId: state.sceneId
      })
      expect(result.activeAssessment?.questionId).toBe(state.questionId)
      expect(result.activeAssessment?.status).toBe('open')
    }
  })

  it('rejects inconsistent authoritative progress', async () => {
    const invalid = { ...progress('module-1'), checkpointId: 'm1-mastery' as const }

    await expect(new TeacherCourseContextRepository(pilotWorkspace).load(invalid))
      .rejects.toMatchObject({ code: 'COURSE_CONTEXT_INVALID_PROGRESS' })

    const crossModule = {
      ...progress('module-2'),
      currentLessonId: 'module-1' as const
    }
    await expect(new TeacherCourseContextRepository(pilotWorkspace).load(crossModule))
      .rejects.toMatchObject({ code: 'COURSE_CONTEXT_INVALID_PROGRESS' })
  })

  it('keeps grouped quizzes open until every displayed question has an authoritative result', async () => {
    const repository = new TeacherCourseContextRepository(pilotWorkspace)
    const states = [
      { moduleId: 'module-1' as const, currentCourseLessonId: 'm1-assessment' as const, checkpointId: 'm1-mastery' as const, sceneId: 'module-1-final-1' as const, first: 'm1-q1', second: 'm1-q2-approval' },
      { moduleId: 'module-2' as const, currentCourseLessonId: 'm2-portfolio-brief' as const, checkpointId: 'm2-portfolio-mastery' as const, sceneId: 'module-2-mastery-scenario-viewer' as const, first: 'mastery-1', second: 'mastery-4' },
      { moduleId: 'module-3' as const, currentCourseLessonId: 'm3-independent-enhancement' as const, checkpointId: 'm3-mastery' as const, sceneId: 'module-3-mastery-plan' as const, first: 'm3-mastery-plan', second: 'm3-mastery-visible-error' },
    ]
    for (const state of states) {
      const result = await repository.load({ ...progress(state.moduleId), ...state,
        decisions: { [`assessment:${state.first}`]: 'correct:0' } })
      expect(result.activeAssessment).toMatchObject({ questionId: state.second, status: 'open' })
    }
  })

  it('fails closed when a required source is missing', async () => {
    const root = await copiedPilotWorkspace()
    await rm(join(root, 'course', 'quizzes', 'module-1.quiz.json'))

    await expect(new TeacherCourseContextRepository(root).load(progress('module-1')))
      .rejects.toMatchObject({ code: 'COURSE_CONTEXT_SOURCE_UNAVAILABLE' })
  })

  it('fails closed when the active quiz is malformed', async () => {
    const root = await copiedPilotWorkspace()
    await writeFile(join(root, 'course', 'quizzes', 'module-1.quiz.json'), '{not-json', 'utf8')

    await expect(new TeacherCourseContextRepository(root).load(progress('module-1')))
      .rejects.toMatchObject({ code: 'COURSE_CONTEXT_SOURCE_INVALID' })
  })

  it('rejects a package-wide snapshot when an earlier source changes during assembly', async () => {
    const root = await copiedPilotWorkspace()
    const lesson = join(root, 'course', 'lessons', 'module-1.vi.md')
    const repository = new TeacherCourseContextRepository(root, undefined, async () => {
      await writeFile(lesson, '# changed during package assembly', 'utf8')
    })

    await expect(repository.load(progress('module-1')))
      .rejects.toMatchObject({ code: 'COURSE_CONTEXT_SOURCE_CHANGED' })
  })

  it('rejects a required source that resolves outside the authoritative root', async () => {
    const root = await copiedPilotWorkspace()
    const outside = await mkdtemp(join(tmpdir(), 'teacher-course-outside-'))
    directories.push(outside)
    await writeFile(join(outside, 'module-1.quiz.json'), '{}', 'utf8')
    const quizzes = join(root, 'course', 'quizzes')
    await rm(quizzes, { recursive: true, force: true })
    await symlink(outside, quizzes, 'junction')

    await expect(new TeacherCourseContextRepository(root).load(progress('module-1')))
      .rejects.toMatchObject({ code: 'COURSE_CONTEXT_SOURCE_ESCAPE' })
  })

  it('rejects an otherwise complete package beyond the configured atomic ceiling', async () => {
    await expect(new TeacherCourseContextRepository(pilotWorkspace, 100).load(progress('intro')))
      .rejects.toMatchObject({ code: 'COURSE_CONTEXT_TOO_LARGE' })
  })
})
