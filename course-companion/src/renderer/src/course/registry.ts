import type { CourseLessonId, SceneId } from '../../../../shared/contracts'
import {
  portfolioModuleDefinitions,
  validateCourseModuleDefinitions
} from '../../../../shared/course/registry'
import type { RendererModuleDefinition, RegistrySceneContent } from './module-contracts'
import { moduleTwoDefinition } from './modules/module-2/definition'
import { moduleTwoScenes } from './modules/module-2/scenes'
import { moduleThreeDefinition } from './modules/module-3/definition'
import { moduleThreeScenes } from './modules/module-3/scenes'
import { moduleFourDefinition } from './modules/module-4/definition'
import { moduleFourScenes } from './modules/module-4/scenes'

const rendererModules = [
  {
    id: moduleTwoDefinition.id,
    titleVi: moduleTwoDefinition.titleVi,
    lessons: moduleTwoDefinition.lessons,
    lessonPages: {
      'm2-portfolio-brief': [
        ['module-2-portfolio-workspace'],
        ['module-2-prd-definition'],
        ['module-2-prd-review-workflow'],
        ['module-2-prd-agent-workflow'],
        ['module-2-html-design-prototype'],
        ['module-2-impeccable-skill'],
        ['module-2-implementation-plan-intro'],
        ['module-2-portfolio-folder'],
        ['module-2-portfolio-practice'],
        ['module-2-portfolio-mastery'],
        ['module-2-mastery-scenario-viewer'],
        ['module-2-mastery-scenario-prd'],
        ['module-2-mastery-scenario-validation'],
        ['module-2-mastery-scenario-first-task'],
        ['module-2-portfolio-mastery-summary'],
        ['module-2-portfolio-complete']
      ]
    },
    scenes: moduleTwoScenes
  },
  {
    id: moduleThreeDefinition.id,
    titleVi: moduleThreeDefinition.titleVi,
    lessons: moduleThreeDefinition.lessons,
    lessonPages: {
      'm3-complete-first-version': [
        ['module-3-first-build'],
        ['module-3-local-preview'],
        ['module-3-debugging-intro'],
        ['module-3-visible-error'],
        ['module-3-visible-error-prompt'],
        ['module-3-terminal-logs'],
        ['module-3-repeated-error']
      ],
      'm3-whole-page-revision': [
        ['module-3-git-intro'],
        ['module-3-git-github'],
        ['module-3-git-commit'],
        ['module-3-git-push'],
        ['module-3-git-branch'],
        ['module-3-git-merge'],
        ['module-3-security-env'],
        ['module-3-security-chat-secrets'],
        ['module-3-security-approvals']
      ],
      'm3-evidence-debugging': [
        ['module-3-pre-practice-summary']
      ],
      'm3-independent-enhancement': [
        ['module-3-portfolio-mastery'],
        ['module-3-mastery-plan'],
        ['module-3-mastery-visible-error'],
        ['module-3-mastery-logs'],
        ['module-3-mastery-repeated-error'],
        ['module-3-mastery-branch'],
        ['module-3-mastery-summary'],
        ['module-3-complete']
      ]
    },
    scenes: moduleThreeScenes
  },
  {
    id: moduleFourDefinition.id,
    titleVi: moduleFourDefinition.titleVi,
    // Preserve shared checkpoint contracts for lessons whose teaching pages were retired.
    lessons: moduleFourDefinition.lessons.filter((lesson) =>
      lesson.id !== 'm4-security-publication' && lesson.id !== 'm4-production-decision'),
    lessonPages: {
      'm4-release-validation': [
        ['module-4-hosting-intro'],
        ['module-4-vercel-benefits'],
        ['module-4-after-video']
      ],
      'm4-security-publication': [
      ],
      'm4-preview-deployment': [
        ['module-4-vercel-preview']
      ],
      'm4-production-decision': [
      ],
      'm4-ownership-transfer': [
        ['module-4-portfolio-practice'],
        ['module-4-complete']
      ]
    },
    scenes: moduleFourScenes
  }
] as const satisfies readonly RendererModuleDefinition[]

export function validateRendererRegistry(
  modules: readonly RendererModuleDefinition[] = rendererModules
): void {
  validateCourseModuleDefinitions(portfolioModuleDefinitions)
  const moduleIds = new Set<string>()
  const sceneIds = new Set<string>()

  for (const module of modules) {
    if (moduleIds.has(module.id)) throw new Error(`Duplicate renderer module id: ${module.id}`)
    moduleIds.add(module.id)
    const contract = portfolioModuleDefinitions.find((candidate) => candidate.id === module.id)
    if (!contract) throw new Error(`Renderer module has no shared contract: ${module.id}`)

    const contractScenes = new Set(contract.scenes.map((scene) => scene.id))
    for (const sceneId of Object.keys(module.scenes)) {
      if (sceneIds.has(sceneId)) throw new Error(`Duplicate renderer scene id: ${sceneId}`)
      if (!contractScenes.has(sceneId as never)) {
        throw new Error(`Renderer scene is missing from its shared contract: ${sceneId}`)
      }
      sceneIds.add(sceneId)
    }
    for (const sceneId of contractScenes) {
      if (!module.scenes[sceneId as SceneId]) {
        throw new Error(`Shared scene is missing renderer content: ${sceneId}`)
      }
    }

    for (const lesson of module.lessons) {
      const pages = module.lessonPages[lesson.id]
      if (!pages || pages.length === 0) throw new Error(`Lesson has no pages: ${lesson.id}`)
      for (const sceneId of pages.flat()) {
        if (!module.scenes[sceneId]) throw new Error(`Lesson references unknown scene: ${sceneId}`)
      }
    }
  }
}

validateRendererRegistry()

export const registrySceneContent = Object.assign(
  {},
  ...rendererModules.map((module) => module.scenes)
) as Partial<Record<SceneId, RegistrySceneContent>>

export const registryLessonDefinitions = rendererModules.flatMap((module) =>
  module.lessons.map((lesson) => ({ id: lesson.id, titleVi: lesson.titleVi }))
)

export const registryLessonPages = Object.assign(
  {},
  ...rendererModules.map((module) => module.lessonPages)
) as Partial<Record<CourseLessonId, readonly (readonly SceneId[])[]>>

export const registryModuleLessonIds = Object.fromEntries(
  rendererModules.map((module) => [module.id, module.lessons.map((lesson) => lesson.id)])
) as Record<'module-2' | 'module-3' | 'module-4', CourseLessonId[]>
