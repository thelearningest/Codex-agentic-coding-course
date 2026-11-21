import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { moduleThreeDefinition } from '../shared/course/modules/module-3'
import { moduleFourDefinition } from '../shared/course/modules/module-4'

const root = resolve(process.cwd(), '..')
const read = async (path: string) => (await readFile(resolve(root, path), 'utf8')).replace(/\r\n/g, '\n')
const rendererPath = (module: number) => `course-companion/src/renderer/src/course/modules/module-${module}/scenes.tsx`

function sceneBlocks(source: string) {
  return [...source.matchAll(/^ {2}'(module-[34]-[^']+)': \{\n([\s\S]*?)^ {2}\},?$/gm)]
    .map((match) => ({ id: match[1]!, body: match[2]! }))
}

describe('GitHub and Vercel publication content', () => {
  it('keeps renderer next-page routes and ordered page inventories aligned with shared contracts', async () => {
    const registry = await read('course-companion/src/renderer/src/course/registry.ts')
    for (const module of [moduleThreeDefinition, moduleFourDefinition]) {
      const source = await read(rendererPath(module.order))
      const pages = module.lessons.flatMap((lesson) => {
        const block = registry.split(`      '${lesson.id}': [`)[1]!.split('\n      ]')[0]!
        return [...block.matchAll(/\['([^']+)'\]/g)].map((match) => match[1])
      })
      expect(pages).toEqual(module.scenes.map((scene) => scene.id))
      for (const block of sceneBlocks(source)) {
        const next = block.body.match(/next: '([^']+)'/)?.[1]
        if (!next) continue
        const definition = module.scenes.find((scene) => scene.id === block.id)!
        if (block.id === module.scenes.at(-1)!.id && module.completionDestination) {
          expect(module.completionDestination.sceneId, block.id).toBe(next)
          expect(moduleFourDefinition.scenes.some((scene) => scene.id === next)).toBe(true)
          continue
        }
        expect('nextSceneId' in definition && definition.nextSceneId, block.id).toBe(next)
      }
    }
  })

  it('routes Merge to the recap and reminds learners to publish before mastery', async () => {
    const ids = moduleThreeDefinition.scenes.map((scene) => String(scene.id))
    expect(ids.slice(ids.indexOf('module-3-git-merge'), ids.indexOf('module-3-portfolio-mastery') + 1)).toEqual([
      'module-3-git-merge',
      'module-3-pre-practice-summary', 'module-3-portfolio-mastery'
    ])
    const source = await read(rendererPath(3))
    const mastery = sceneBlocks(source).find((scene) => scene.id === 'module-3-portfolio-mastery')!
    expect(mastery.body).toContain("Trước khi kết thúc bài học, bạn hãy nhờ agent publish repo của bạn lên github. Sau khi hoàn thành, chúng ta sẽ cùng làm một vài câu hỏi để ôn tập nhé.")
    expect(mastery.body).toContain('preservePrimaryLabel: true')
    const script = await read('pilot-workspace/course/lesson-scripts/module-3.script.vi.md')
    expect(script).toContain("Trước khi kết thúc bài học, bạn hãy nhờ agent publish repo của bạn lên github. Sau khi hoàn thành, chúng ta sẽ cùng làm một vài câu hỏi để ôn tập nhé.")
  })

  it('preserves instructional Module 4 pages without mid-lesson questions and preserves the target Practice action', async () => {
    const ids = moduleFourDefinition.scenes.map((scene) => String(scene.id))
    const preserved = [
      'hosting-intro', 'after-video',
      'vercel-preview',
      'portfolio-practice', 'complete'
    ]
    expect(ids).toEqual(expect.arrayContaining(preserved.map((id) => `module-4-${id}`)))
    expect(ids.slice(1, 5)).toEqual([
      'module-4-vercel-benefits', 'module-4-after-video',
      'module-4-vercel-preview', 'module-4-portfolio-practice'
    ])
    for (const retired of ["module-4-access-check", "module-4-vercel-limits", "module-4-environments", "module-4-release-intro", "module-4-release-checklist", "module-4-security-intro", "module-4-security-access", "module-4-security-setup", "module-4-preview-intro", "module-4-vercel-import", "module-4-vercel-repository", "module-4-vercel-prepare", "module-4-vercel-config", "module-4-vercel-deploy"]) expect(ids).not.toContain(retired)
    for (const retired of [
      'module-4-update-local',
      'module-4-update-preview',
      'module-4-preview-review',
      'module-4-production-intro',
      'module-4-production-publish',
      'module-4-production-checks',
      'module-4-share-details',
      'module-4-update-workflow',
      'module-4-update-verify',
      'module-4-deploy-errors',
      'module-4-rollback',
      'module-4-rollback-resume',
      'module-4-ownership-intro',
      'module-4-handover',
      'module-4-transfer'
    ]) expect(ids).not.toContain(retired)
    expect(ids.some((id) => id.includes('mastery'))).toBe(false)
    expect(moduleFourDefinition.quizGroupIds).toEqual([])
    const practice = moduleFourDefinition.scenes.find((scene) => scene.id === 'module-4-portfolio-practice')!
    expect(practice.nextSceneId).toBe('module-4-complete')
    const source = await read(rendererPath(4))
    expect(sceneBlocks(source).find((scene) => scene.id === 'module-4-portfolio-practice')!.body).toContain("action: 'practice'")
  })

  it('keeps new instructional paragraphs in the Pilot authority and renderer', async () => {
    for (const module of [3, 4]) {
      const lesson = await read(`pilot-workspace/course/lessons/module-${module}.vi.md`)
      const source = await read(rendererPath(module))
      for (const scene of sceneBlocks(source)) {
        const newInstruction = module === 3 ? scene.id.startsWith('module-3-github-') : (
          !scene.id.includes('-hosting-') && !scene.id.includes('-mastery') && !scene.id.includes('-check-')
          && !scene.id.endsWith('-practice') && !scene.id.endsWith('-complete')
        )
        if (newInstruction) {
          const quoted = scene.body.match(/dialogue: ("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/)?.[1]
          expect(quoted, scene.id).toBeDefined()
          const dialogue = quoted!.startsWith('"') ? JSON.parse(quoted!) as string : quoted!.slice(1, -1)
          for (const paragraph of dialogue.split('\n\n')) expect(lesson, scene.id).toContain(paragraph)
        }
      }
    }
  })
})
