import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { CourseModuleDefinition } from '../shared/course/module-contracts'
import { checkpointIds, runnableCheckpointIds } from '../shared/contracts'
import {
  portfolioModuleDefinitions,
  validateCourseModuleDefinitions
} from '../shared/course/registry'

function mutableDefinitions(): CourseModuleDefinition[] {
  return structuredClone(portfolioModuleDefinitions) as unknown as CourseModuleDefinition[]
}

describe('portfolio course registry', () => {
  it('counts current course checkpoints without requiring retired stages or losing their history', () => {
    expect(runnableCheckpointIds).toHaveLength(19)
    expect(new Set(runnableCheckpointIds).size).toBe(runnableCheckpointIds.length)
    for (const retired of ['m2-content-evidence-inventory', 'm3-scaffold-baseline', 'm4-security-publication', 'm4-production-decision']) {
      expect(checkpointIds).toContain(retired)
      expect(runnableCheckpointIds).not.toContain(retired)
    }
    for (const module of portfolioModuleDefinitions) {
      for (const scene of module.scenes) expect(runnableCheckpointIds).toContain(scene.checkpointId)
    }
    expect(runnableCheckpointIds).toContain('m4-complete')
  })

  it('exposes ordered typed definitions for Modules 2-4', () => {
    expect(portfolioModuleDefinitions.map((module) => module.id)).toEqual([
      'module-2',
      'module-3',
      'module-4'
    ])
    expect(portfolioModuleDefinitions.flatMap((module) =>
      module.lessons.map((lesson) => lesson.id))).toEqual([
      'm2-portfolio-brief',
      'm3-complete-first-version',
      'm3-whole-page-revision',
      'm3-evidence-debugging',
      'm3-independent-enhancement',
      'm4-release-validation',
      'm4-security-publication',
      'm4-preview-deployment',
      'm4-production-decision',
      'm4-ownership-transfer'
    ])
  })

  it('starts Module 3 with local preview before debugging', () => {
    const moduleThree = portfolioModuleDefinitions[1]
    expect(moduleThree.lessons[0]?.titleVi).toBe('Debug cùng coding agent')
    expect(moduleThree.scenes.map((scene) => String(scene.id))).not.toContain('module-3-readiness')
    expect(moduleThree.scenes.map((scene) => String(scene.id)))
      .not.toContain('module-3-implementation-cycle')
  })

  it('routes Module 3 knowledge through the approved recap and into Practice', () => {
    const moduleThree = portfolioModuleDefinitions[1]
    expect(moduleThree.scenes.find((scene) => scene.id === 'module-3-git-branch')?.nextSceneId)
      .toBe('module-3-git-merge')
    expect(moduleThree.scenes.find((scene) => scene.id === 'module-3-git-merge')?.nextSceneId)
      .toBe('module-3-pre-practice-summary')
    expect(moduleThree.scenes.find((scene) => scene.id === 'module-3-pre-practice-summary')?.nextSceneId)
      .toBe('module-3-portfolio-practice')
    expect(moduleThree.scenes.map((scene) => String(scene.id)))
      .not.toContain('module-3-practice-intro')
    expect(moduleThree.scenes.map((scene) => String(scene.id)))
      .toContain('module-3-portfolio-practice')
  })

  it('rejects duplicate module ids', () => {
    const definitions = mutableDefinitions()
    definitions[1] = { ...definitions[1]!, id: 'module-2' }
    expect(() => validateCourseModuleDefinitions(definitions)).toThrow('Duplicate module id')
  })

  it('rejects unknown checkpoint references', () => {
    const definitions = mutableDefinitions()
    definitions[0] = {
      ...definitions[0]!,
      scenes: [{
      ...definitions[0]!.scenes[0]!,
      checkpointId: 'missing-checkpoint'
      }]
    }
    expect(() => validateCourseModuleDefinitions(definitions)).toThrow('Unknown checkpoint')
  })

  it('rejects broken scene destinations', () => {
    const definitions = mutableDefinitions()
    definitions[0] = {
      ...definitions[0]!,
      scenes: [{
      ...definitions[0]!.scenes[0]!,
      nextSceneId: 'missing-scene'
      }]
    }
    expect(() => validateCourseModuleDefinitions(definitions)).toThrow('Broken scene destination')
  })

  it('rejects a scene routed to a different lesson than its checkpoint', () => {
    const definitions = mutableDefinitions()
    definitions[1] = {
      ...definitions[1]!,
      scenes: [{
        ...definitions[1]!.scenes[0]!,
        courseLessonId: 'm3-whole-page-revision'
      }]
    }
    expect(() => validateCourseModuleDefinitions(definitions)).toThrow('different lessons')
  })

  it('rejects module-order errors', () => {
    const definitions = mutableDefinitions()
    definitions.reverse()
    expect(() => validateCourseModuleDefinitions(definitions)).toThrow('strictly increasing order')
  })

  it('routes registry scenes into LearningWindow without extending the legacy scene literal', async () => {
    const learningWindowSource = await readFile(join(
      process.cwd(),
      'src',
      'renderer',
      'src',
      'surfaces',
      'LearningWindow.tsx'
    ), 'utf8')
    const registrySource = await readFile(join(
      process.cwd(),
      'src',
      'renderer',
      'src',
      'course',
      'registry.ts'
    ), 'utf8')
    expect(learningWindowSource).toContain('...registrySceneContent')
    expect(learningWindowSource).not.toContain("'module-2-portfolio-placeholder': {")
    expect(registrySource).toContain('validateRendererRegistry()')
    expect(registrySource).toContain('moduleTwoScenes')
  })

  it('renders the complete Module 2 journey and every quiz scene from the registry', () => {
    const moduleTwo = portfolioModuleDefinitions[0]
    expect(moduleTwo.lessons).toHaveLength(1)
    expect(moduleTwo.quizGroupIds).toEqual(['final-assessment'])
    expect(moduleTwo.scenes.map((scene) => scene.id)).toEqual(expect.arrayContaining([
      'module-2-portfolio-workspace',
      'module-2-prd-definition',
      'module-2-prd-review-workflow',
      'module-2-prd-agent-workflow',
      'module-2-implementation-plan-intro',
      'module-2-portfolio-folder',
      'module-2-portfolio-practice',
      'module-2-portfolio-mastery',
      'module-2-portfolio-mastery-summary'
    ]))
    expect(moduleTwo.scenes.find((scene) => scene.id === 'module-2-portfolio-workspace')?.nextSceneId)
      .toBe('module-2-prd-definition')
    expect(moduleTwo.scenes.find((scene) => scene.id === 'module-2-prd-definition')?.nextSceneId)
      .toBe('module-2-prd-review-workflow')
    expect(moduleTwo.scenes.find((scene) => scene.id === 'module-2-prd-review-workflow')?.nextSceneId)
      .toBe('module-2-prd-agent-workflow')
    expect(moduleTwo.scenes.find((scene) => scene.id === 'module-2-prd-agent-workflow')?.nextSceneId)
      .toBe('module-2-html-design-prototype')
    expect(moduleTwo.scenes.find((scene) => scene.id === 'module-2-html-design-prototype')?.nextSceneId)
      .toBe('module-2-implementation-plan-intro')
    expect(moduleTwo.scenes.find((scene) => scene.id === 'module-2-implementation-plan-intro')?.nextSceneId)
      .toBe('module-2-portfolio-folder')
    expect(moduleTwo.scenes.find((scene) => scene.id === 'module-2-portfolio-folder')?.nextSceneId)
      .toBe('module-2-portfolio-practice')
    for (const retiredSceneId of [
      'module-2-prd-sample-prompt',
      'module-2-implementation-plan-sample-prompt',
      'module-2-plan-example',
      'module-2-plan-requirements',
      'module-2-plan-steps',
      'module-2-plan-testing',
      'module-2-plan-risks'
    ]) expect(moduleTwo.scenes.some((scene) => scene.id === retiredSceneId)).toBe(false)
    for (const retiredSceneId of [
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
    ]) expect(moduleTwo.scenes.some((scene) => scene.id === retiredSceneId)).toBe(false)
    expect(moduleTwo.scenes.filter((scene) => scene.id.startsWith('module-2-check-'))).toHaveLength(0)
    expect(moduleTwo.scenes.filter((scene) => scene.id.startsWith('module-2-mastery-'))).toHaveLength(4)
  })

  it('registers the complete Module 4 content journey while preserving its deferred Practice identity', () => {
    const moduleFour = portfolioModuleDefinitions[2]
    expect(moduleFour.scenes.slice(0, 3).map((scene) => scene.id)).toEqual([
      'module-4-hosting-intro',
      'module-4-vercel-benefits',
      'module-4-after-video'
    ])
    expect(moduleFour.scenes[0]?.nextSceneId).toBe('module-4-vercel-benefits')
    expect(moduleFour.scenes[1]?.nextSceneId).toBe('module-4-after-video')
    expect(moduleFour.lessons).toHaveLength(5)
    expect(moduleFour.quizGroupIds).toEqual([])
    expect(moduleFour.scenes.filter((scene) => scene.id.startsWith('module-4-check-'))).toHaveLength(0)
    expect(moduleFour.practice).toEqual({
      id: 'm4-portfolio-release',
      version: '1.0.0',
      evidenceProfile: 'portfolio-release'
    })
    expect(moduleFour.scenes.map((scene) => scene.id)).toEqual(expect.arrayContaining([
      'module-4-after-video',
      'module-4-portfolio-practice',
      'module-4-complete'
    ]))
  })
})
