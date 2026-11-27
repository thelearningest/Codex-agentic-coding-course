import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { collectPortfolioPackage } from '../electron/main/portfolio-package-evidence'
import { portfolioPlanningHandoffIsCurrent } from '../electron/main/portfolio-planning-handoff-validation'
import { PracticeDefinitionRepository } from '../electron/main/practice-definition-repository'
import { portfolioPackageArtifactPaths, type PortfolioPackageHandoff } from '../shared/contracts'

const directories: string[] = []
const definitions = new PracticeDefinitionRepository(resolve('../pilot-workspace/course/practices'))
const time = '2026-10-22T00:00:00.000Z'
const screenshotPath = 'planning/reference/screenshots/home.png'
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==', 'base64')
const documents = {
  'planning/reference/design-prototype.html': '<title>design-protoype</title><main><h1>Product designer</h1><section>Project Alpha</section></main>',
  'planning/portfolio-brief.md': '# Brief\n\n## Audience\nHiring managers assess my design work.\n\n## Scope\nShow two case studies and contact details.',
  'planning/content-evidence-inventory.md': '# Inventory\n\n## Available\nTwo original case studies with screenshots.\n\n## Restrictions\nExclude client names and confidential metrics.',
  'planning/reference/reference.md': `# Reference\n\n## Direction\nUse generous spacing.\n\n## Source\n${screenshotPath} illustrates hierarchy; create an original design.`,
  'planning/PRD.md': '# PRD\n\n## Requirements\nREQ-HERO: Show the owner name.\n\n## Acceptance criteria\nA visitor identifies the owner using a keyboard.',
  'planning/implementation-plan.md': '# Plan\n\n## Delivery steps\nBuild REQ-HERO first.\n\n## Dependencies and order\nVerify inventory before adding content.\n\n## Validation\nCheck REQ-HERO on desktop and mobile using a keyboard.'
}

afterEach(async () => { await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true }))) })

async function fixture() {
  const workspace = await realpath(await mkdtemp(join(tmpdir(), 'planning-handoff-')))
  directories.push(workspace)
  await mkdir(join(workspace, 'planning/reference/screenshots'), { recursive: true })
  await Promise.all(Object.entries(documents).map(([path, text]) => writeFile(join(workspace, path), text)))
  await writeFile(join(workspace, screenshotPath), png)
  const definition = await definitions.load('m2-portfolio-planning', '2.0.0')
  const context = { definition, runId: 'planning-run', generation: 1, workspaceRoot: workspace, task: { threadId: 'portfolio-task', workspaceRoot: workspace } }
  const collect = () => collectPortfolioPackage(context)
  const evidence = await collect()
  expect(evidence.portfolioPlanning?.issues).toEqual([])
  expect(evidence.freshness).toBe('fresh')
  const planning = evidence.portfolioPlanning!
  const artifacts = portfolioPackageArtifactPaths.map((path) => ({ path, digest: planning.artifacts.find((item) => item.path === path)!.digest }))
  const handoff: PortfolioPackageHandoff = {
    schemaVersion: 2,
    workspace: { canonicalPath: workspace, identityDigest: planning.workspaceIdentityDigest },
    artifacts,
    mastery: { questionIds: [], answerDigest: 'a'.repeat(64) },
    summary: { learnerDecision: 'Audience', evidenceBoundary: 'Original content', firstBuild: 'Hero', deliberatelyOutOfScope: 'Publishing' },
    moduleThreeInput: { workspacePath: workspace, artifactReferences: artifacts },
    approval: { courseRunId: 'course-run', runId: context.runId, generation: 1, threadId: context.task.threadId,
      workspaceIdentityDigest: planning.workspaceIdentityDigest, sourceDigest: evidence.sourceDigest!,
      artifactDigests: Object.fromEntries(planning.artifacts.map(({ path, digest }) => [path, digest])), recordedAt: time },
    submission: { runId: context.runId, generation: 1, sourceDigest: evidence.sourceDigest!, reviewDigest: 'b'.repeat(64), reviewedAt: time },
    task: { runId: context.runId, threadId: context.task.threadId, name: 'Portfolio', workspaceRoot: workspace, createdAt: time }
  }
  return { workspace, collect, evidence, handoff }
}

describe('portfolioPlanningHandoffIsCurrent', () => {
  it('accepts unchanged approved planning after Module 3 adds app and evidence files, while Module 2 stays strict', async () => {
    const { workspace, collect, evidence, handoff } = await fixture()
    expect(portfolioPlanningHandoffIsCurrent(handoff, evidence)).toBe(true)
    await mkdir(join(workspace, 'src'))
    await mkdir(join(workspace, 'evidence/module-3'), { recursive: true })
    await writeFile(join(workspace, 'src/App.tsx'), 'export const App = () => null')
    await writeFile(join(workspace, 'package.json'), '{}')
    await writeFile(join(workspace, 'evidence/module-3/learning-record.md'), '# Build record')
    const afterBuild = await collect()
    expect(afterBuild.freshness).toBe('unverifiable')
    expect(afterBuild.sourceDigest).not.toBe(evidence.sourceDigest)
    expect(portfolioPlanningHandoffIsCurrent(handoff, afterBuild)).toBe(true)
  })

  it('allows an already accepted five-file handoff to continue while a new submission requires the HTML file', async () => {
    const { workspace, collect, handoff } = await fixture()
    const path = 'planning/reference/design-prototype.html'
    await rm(join(workspace, path))
    const evidence = await collect()
    expect(evidence.freshness).toBe('unverifiable')
    expect(portfolioPlanningHandoffIsCurrent(handoff, evidence)).toBe(false)
    handoff.artifacts = handoff.artifacts.filter((artifact) => artifact.path !== path)
    handoff.moduleThreeInput.artifactReferences = handoff.artifacts
    delete handoff.approval.artifactDigests[path]
    expect(portfolioPlanningHandoffIsCurrent(handoff, evidence)).toBe(true)
  })

  it('requires a new handoff after changing just the prototype', async () => {
    const { workspace, collect, handoff } = await fixture()
    await writeFile(join(workspace, 'planning/reference/design-prototype.html'), documents['planning/reference/design-prototype.html'].replace('Project Alpha', 'Selected work'))
    expect(portfolioPlanningHandoffIsCurrent(handoff, await collect())).toBe(false)
  })

  it('hands off a 2 MB prototype by fingerprint without its content', async () => {
    const { workspace, collect, handoff } = await fixture()
    await writeFile(join(workspace, 'planning/reference/design-prototype.html'), `<img src="data:image/png;base64,${'A'.repeat(2 * 1024 * 1024)}">`)
    const evidence = await collect()
    expect(evidence.freshness).toBe('fresh')
    const prototype = evidence.portfolioPlanning!.artifacts.find((item) => item.path === 'planning/reference/design-prototype.html')!
    expect(prototype.content).toBeUndefined()
    expect(prototype.byteLength).toBeGreaterThan(2 * 1024 * 1024)
    handoff.approval.artifactDigests = Object.fromEntries(evidence.portfolioPlanning!.artifacts.map(({ path, digest }) => [path, digest]))
    handoff.artifacts = portfolioPackageArtifactPaths.map((path) => ({ path, digest: handoff.approval.artifactDigests[path]! }))
    handoff.moduleThreeInput.artifactReferences = handoff.artifacts
    handoff.approval.sourceDigest = evidence.sourceDigest!
    handoff.submission.sourceDigest = evidence.sourceDigest!
    expect(portfolioPlanningHandoffIsCurrent(handoff, evidence)).toBe(true)
  })

  it.each(['edit', 'delete', 'empty', 'invalid-utf8', 'oversized', 'directory'] as const)(
    'rejects a required source document after %s', async (change) => {
      const { workspace, collect, handoff } = await fixture()
      const path = join(workspace, 'planning/PRD.md')
      if (change === 'delete' || change === 'directory') await rm(path)
      if (change === 'directory') await mkdir(path)
      if (change === 'edit') await writeFile(path, `${documents['planning/PRD.md']}\nChanged requirement.`)
      if (change === 'empty') await writeFile(path, '')
      if (change === 'invalid-utf8') await writeFile(path, new Uint8Array([0xff, 0xfe]))
      if (change === 'oversized') await writeFile(path, 'x'.repeat(128 * 1024 + 1))
      expect(portfolioPlanningHandoffIsCurrent(handoff, await collect())).toBe(false)
    })

  it.each(['edit', 'delete', 'malformed'] as const)('rejects a reference screenshot after %s', async (change) => {
    const { workspace, collect, handoff } = await fixture()
    const path = join(workspace, screenshotPath)
    if (change === 'delete') await rm(path)
    if (change === 'malformed') await writeFile(path, 'not an image')
    if (change === 'edit') { const bytes = Buffer.from(png); bytes[45] = bytes[45]! ^ 1; await writeFile(path, bytes) }
    expect(portfolioPlanningHandoffIsCurrent(handoff, await collect())).toBe(false)
  })

  it('rejects a symlinked source directory even when its target contains unchanged approved bytes', async ({ skip }) => {
    const { workspace, collect, handoff } = await fixture()
    const target = await fixture()
    await rm(join(workspace, 'planning'), { recursive: true, force: true })
    try {
      await symlink(join(target.workspace, 'planning'), join(workspace, 'planning'), process.platform === 'win32' ? 'junction' : 'dir')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EPERM') {
        skip('Symlink creation is unavailable.')
        return
      }
      throw error
    }
    expect(portfolioPlanningHandoffIsCurrent(handoff, await collect())).toBe(false)
  })

  it.each(['workspace', 'approval-workspace', 'task-workspace', 'input-workspace', 'thread', 'run', 'generation', 'submission', 'reference', 'missing-screenshot-approval', 'duplicate-artifact'] as const)(
    'rejects inconsistent %s in the persisted handoff', async (change) => {
      const { workspace, evidence, handoff } = await fixture()
      const altered = structuredClone(handoff)
      if (change === 'workspace') altered.workspace.canonicalPath = join(workspace, 'other')
      if (change === 'approval-workspace') altered.approval.workspaceIdentityDigest = 'f'.repeat(64)
      if (change === 'task-workspace') altered.task.workspaceRoot = join(workspace, 'other')
      if (change === 'input-workspace') altered.moduleThreeInput.workspacePath = join(workspace, 'other')
      if (change === 'thread') altered.approval.threadId = 'other-task'
      if (change === 'run') altered.task.runId = 'other-run'
      if (change === 'generation') altered.submission.generation += 1
      if (change === 'submission') altered.submission.sourceDigest = 'f'.repeat(64)
      if (change === 'reference') altered.moduleThreeInput.artifactReferences[0]!.digest = 'f'.repeat(64)
      if (change === 'missing-screenshot-approval') delete altered.approval.artifactDigests[screenshotPath]
      if (change === 'duplicate-artifact') altered.artifacts[1] = { ...altered.artifacts[0]! }
      expect(portfolioPlanningHandoffIsCurrent(altered, evidence)).toBe(false)
    })

  it('rejects unexpected changes inside the protected planning package', async () => {
    const { workspace, collect, handoff } = await fixture()
    await writeFile(join(workspace, 'planning/unapproved.md'), '# Unapproved planning')
    expect(portfolioPlanningHandoffIsCurrent(handoff, await collect())).toBe(false)
  })

  it('accepts an approved package with no reference screenshot when its reference document does not cite one', async () => {
    const { workspace, collect, handoff } = await fixture()
    await writeFile(join(workspace, 'planning/reference/reference.md'), '# Reference\n\n## Direction\nUse generous spacing.\n\n## Boundaries\nCreate an original design.')
    await rm(join(workspace, screenshotPath))
    const evidence = await collect()
    expect(evidence.freshness).toBe('fresh')
    const artifacts = evidence.portfolioPlanning!.artifacts
    handoff.approval.artifactDigests = Object.fromEntries(artifacts.map(({ path, digest }) => [path, digest]))
    handoff.artifacts = portfolioPackageArtifactPaths.map((path) => ({ path, digest: handoff.approval.artifactDigests[path]! }))
    handoff.moduleThreeInput.artifactReferences = handoff.artifacts
    handoff.approval.sourceDigest = evidence.sourceDigest!
    handoff.submission.sourceDigest = evidence.sourceDigest!
    expect(portfolioPlanningHandoffIsCurrent(handoff, evidence)).toBe(true)
  })

  it.each(['empty-snapshot', 'missing-snapshot', 'duplicate-snapshot', 'symlink-issue'] as const)(
    'rejects invalid independently collected state: %s', async (change) => {
      const { evidence, handoff } = await fixture()
      const planning = evidence.portfolioPlanning!
      if (change === 'empty-snapshot') planning.artifacts[0]!.byteLength = 0
      if (change === 'missing-snapshot') planning.artifacts.pop()
      if (change === 'duplicate-snapshot') planning.artifacts.push({ ...planning.artifacts[0]! })
      if (change === 'symlink-issue') planning.issues.push({
        stageId: 'portfolio-brief', path: 'planning/portfolio-brief.md', code: 'symlink', message: 'Unsafe source'
      })
      expect(portfolioPlanningHandoffIsCurrent(handoff, evidence)).toBe(false)
    })
})
