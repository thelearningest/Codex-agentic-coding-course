import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getPracticeIntroduction } from '../src/renderer/src/components/practice-introduction-copy'

const components = resolve(process.cwd(), 'src', 'renderer', 'src', 'components')

describe('Module 3 Practice guide', () => {
  it('mirrors the Module 2 guide with one illustrated tab per Practice step', async () => {
    const [guide, brief] = await Promise.all([
      readFile(resolve(components, 'PortfolioBuildGuide.tsx'), 'utf8'),
      readFile(resolve(components, 'PracticeBrief.tsx'), 'utf8')
    ])
    const labels = ['Mở bản đầu', 'Đối chiếu PRD', 'Sửa lỗi', 'Commit và nộp']
    expect(getPracticeIntroduction('m3-portfolio-build')!.steps).toHaveLength(labels.length)
    for (const label of labels) expect(guide).toContain(`['${label}',`)
    expect(guide).toContain('className="planning-guide build-guide"')
    expect(guide).toContain('<figcaption aria-live="polite">{introduction.steps[step]}</figcaption>')
    expect(guide).toContain('<PracticeStartPrompt practiceId="m3-portfolio-build" prompt={prompt} guideActions={controls} />')
    expect(guide).toContain('{!prompt && controls}')
    expect(brief).toContain("const buildGuide = identity.practiceId === 'm3-portfolio-build' && !firstBuild && Boolean(introduction)")
    expect(brief).toContain("{planningPractice ? 'Module 2' : 'Module 3'}")
  })
})
