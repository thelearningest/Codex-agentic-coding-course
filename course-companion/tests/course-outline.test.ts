import { describe, expect, it } from 'vitest'
import type { LessonId, PracticeCompletionReceipt, SceneId } from '../shared/contracts'
import { adjacentOutlinePage, courseOutline, outlineSectionIndex, reviewableOutlinePages, reviewTrail } from '../shared/course/outline'
import { portfolioModuleDefinitions } from '../shared/course/registry'

describe('review trail for Previous and Continue', () => {
  const next = (pairs: Record<string, string>) => (sceneId: SceneId) => pairs[sceneId] as SceneId | undefined
  const currentModuleTwoOrder = next({
    'module-2-prd-definition': 'module-2-prd-review-workflow',
    'module-2-prd-review-workflow': 'module-2-prd-agent-workflow',
    'module-2-prd-agent-workflow': 'module-2-implementation-plan-intro',
    'module-2-implementation-plan-intro': 'module-2-portfolio-folder'
  })

  it('keeps a history that already follows the current page order', () => {
    const history: SceneId[] = ['module-2-prd-definition', 'module-2-prd-review-workflow', 'module-2-prd-agent-workflow']
    expect(reviewTrail(history, 'module-2-implementation-plan-intro', currentModuleTwoOrder)).toEqual(history)
  })

  it('shows a page added after the learner had already passed that point', () => {
    const history: SceneId[] = ['module-2-prd-definition', 'module-2-prd-review-workflow', 'module-2-implementation-plan-intro']
    expect(reviewTrail(history, 'module-2-portfolio-folder', currentModuleTwoOrder)).toEqual([
      'module-2-prd-definition',
      'module-2-prd-review-workflow',
      'module-2-prd-agent-workflow',
      'module-2-implementation-plan-intro'
    ])
  })

  it('fills a gap between the last visited page and the current learning page', () => {
    expect(reviewTrail(['module-2-prd-review-workflow'], 'module-2-implementation-plan-intro', currentModuleTwoOrder))
      .toEqual(['module-2-prd-review-workflow', 'module-2-prd-agent-workflow'])
  })

  it('keeps the visited path when the current order does not lead to the next visited page', () => {
    const history: SceneId[] = ['module-1-codex-orientation', 'module-1-codex-model-intro']
    const branch = next({ 'module-1-codex-orientation': 'module-1-agents-intro', 'module-1-agents-intro': 'module-1-skills-intro' })
    expect(reviewTrail(history, 'module-1-codex-effort-speed', branch)).toEqual(history)
    expect(reviewTrail(history, 'module-1-codex-effort-speed', next({}))).toEqual(history)
  })
})

describe('course outline coverage and reading order', () => {
  it('exposes release completion for review only after the same course earned its reviewed return', () => {
    const pages: SceneId[] = ['module-4-portfolio-practice', 'module-4-complete']
    const receipt: PracticeCompletionReceipt = {
      schemaVersion: 1, courseRunId: 'current', practiceId: 'm4-portfolio-release', practiceVersion: '1.0.0',
      runId: 'release', checkpointId: 'm4-portfolio-release', status: 'completed', completedAt: '2026-10-29T00:00:00Z',
      evidenceSummary: '', masterySummary: '', submissionDigest: 'a'.repeat(64),
      destination: { lessonId: 'module-4', checkpointId: 'm4-complete', sceneId: 'module-4-complete' }
    }
    const progress = { courseRunId: 'current', completedCheckpointIds: ['m4-portfolio-release' as const], practiceCompletions: [receipt], sceneId: 'module-4-portfolio-practice' as const, sceneHistory: [] }
    expect(reviewableOutlinePages(pages, progress)).toEqual(pages)
    expect(reviewableOutlinePages(pages, { ...progress, practiceCompletions: [] })).toEqual([pages[0]])
    expect(reviewableOutlinePages(pages, { ...progress, courseRunId: 'another' })).toEqual([pages[0]])
    expect(reviewableOutlinePages(pages, { ...progress, completedCheckpointIds: [] })).toEqual([pages[0]])
    expect(reviewableOutlinePages(pages, { ...progress, practiceCompletions: [{ ...receipt, submissionDigest: undefined }] })).toEqual([pages[0]])
    expect(pages).toEqual(['module-4-portfolio-practice', 'module-4-complete'])
  })
  for (const [summary, before] of [
    ['module-1-final-summary', 'module-1-codex-projects'],
    ['module-2-portfolio-mastery-summary', 'module-2-portfolio-practice'],
    ['module-3-mastery-summary', 'module-3-pre-practice-summary']
  ] as const) {
    it(`keeps ${summary} closed in the outline until the learner reaches it`, () => {
      const pages: SceneId[] = [before, summary]
      const progress = { courseRunId: 'current', completedCheckpointIds: [], practiceCompletions: [], sceneId: before, sceneHistory: [] as SceneId[] }
      expect(reviewableOutlinePages(pages, progress)).toEqual([before])
      expect(reviewableOutlinePages(pages, { ...progress, sceneId: summary, sceneHistory: [before] })).toEqual(pages)
      expect(reviewableOutlinePages(pages, { ...progress, sceneHistory: [summary] })).toEqual(pages)
    })
  }
  for (const module of portfolioModuleDefinitions) {
    it(`covers every ${module.id} page with ordered, unique section starts`, () => {
      const pages = module.scenes.map((scene) => scene.id) as SceneId[]
      const sections = courseOutline[module.id]
      const starts = sections.map((section) => pages.indexOf(section.startSceneId))
      expect(starts[0]).toBe(0)
      expect(starts.every((index) => index >= 0)).toBe(true)
      expect(new Set(starts).size).toBe(starts.length)
      expect(starts).toEqual([...starts].sort((a, b) => a - b))
      for (const [index, page] of pages.entries()) {
        const sectionIndex = outlineSectionIndex(sections, pages, page)
        expect(sectionIndex).toBeGreaterThanOrEqual(0)
        expect(starts[sectionIndex]).toBeLessThanOrEqual(index)
        expect(starts[sectionIndex + 1] ?? pages.length).toBeGreaterThan(index)
        expect(adjacentOutlinePage(pages, page, -1)).toBe(pages[index - 1])
        expect(adjacentOutlinePage(pages, page, 1)).toBe(pages[index + 1])
      }
    })
  }

  it('keeps Practice in all modules and assessments only in Modules 1-3', () => {
    for (const moduleId of ['module-1', 'module-2', 'module-3', 'module-4'] as const) {
      const sections = courseOutline[moduleId]
      // Module 3 opens Practice directly from its pre-Practice summary page.
      const practiceSections = moduleId === 'module-3'
        ? sections.filter((section) => section.startSceneId === 'module-3-pre-practice-summary')
        : sections.filter((section) => /^(Thực hành|Practice):/.test(section.title))
      expect(practiceSections).toHaveLength(1)
      expect(sections.filter((section) => section.title.startsWith('Kiểm tra cuối'))).toHaveLength(moduleId === 'module-4' ? 0 : 1)
      expect(sections.filter((section) => section.title.startsWith('Tổng kết'))).toHaveLength(moduleId === 'module-4' ? 0 : 1)
    }
  })

  it('keeps destinations in their own module and does not invent progress for unknown pages', () => {
    for (const [moduleId, sections] of Object.entries(courseOutline)) {
      expect(sections.every((section) => section.startSceneId.startsWith(`${moduleId}-`))).toBe(true)
      expect(new Set(sections.map((section) => section.title)).size).toBe(sections.length)
    }
    const pages = ['module-3-git-intro', 'module-3-git-github'] as const
    expect(adjacentOutlinePage(pages, 'module-4-after-video', 1)).toBeUndefined()
    expect(outlineSectionIndex(courseOutline['module-3' satisfies LessonId], pages, 'module-4-after-video')).toBe(-1)
  })
})
