import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { PortfolioBuildEvidenceAdapter } from '../electron/main/portfolio-build-evidence-adapter'
import { PracticeDefinitionRepository } from '../electron/main/practice-definition-repository'
import { writeBuildPackage } from './fixtures/portfolio-build-fixture'

const roots: string[] = []
afterEach(async () => { await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))) })

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'portfolio-source-scope-'))
  roots.push(root)
  await writeBuildPackage(root)
  const definition = await new PracticeDefinitionRepository(join(process.cwd(), '..', 'pilot-workspace/course/practices'))
    .load('m3-portfolio-build', '2.1.0')
  const adapter = new PortfolioBuildEvidenceAdapter()
  const collect = () => adapter.collect({ definition, runId: 'source-scope', generation: 1, workspaceRoot: root, task: null })
  return { root, collect }
}

describe('Module 3 application source coverage', () => {
  it.each(['src/evidence/projects.ts', 'src/planning/routes.ts', 'src/dist/view.ts', 'src/out/view.ts', 'public/evidence/project.json'])(
    'invalidates review evidence when application file %s changes', async (path) => {
      const f = await fixture()
      await mkdir(dirname(join(f.root, path)), { recursive: true })
      await writeFile(join(f.root, path), 'original project')
      const before = await f.collect()
      await writeFile(join(f.root, path), 'different project')
      const after = await f.collect()
      const fingerprint = (evidence: typeof before) => evidence.portfolioBuild?.artifacts.find((artifact) => artifact.path === 'application/source')?.digest
      expect(fingerprint(before)).toMatch(/^[a-f0-9]{64}$/)
      expect(fingerprint(after)).not.toBe(fingerprint(before))
      expect(after.sourceDigest).not.toBe(before.sourceDigest)
    }
  )

  it('ignores Finder metadata changes while keeping application source stable', async () => {
    const f = await fixture()
    const baseline = await f.collect()
    for (const path of ['.DS_Store', 'src/.DS_Store']) await writeFile(join(f.root, path), 'metadata')
    const withMetadata = await f.collect()
    for (const path of ['.DS_Store', 'src/.DS_Store']) await writeFile(join(f.root, path), 'changed metadata')
    const withChangedMetadata = await f.collect()
    expect(withMetadata.sourceDigest).toBe(baseline.sourceDigest)
    expect(withChangedMetadata.sourceDigest).toBe(baseline.sourceDigest)
  })
})
