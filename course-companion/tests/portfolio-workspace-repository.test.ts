import {
  chmod,
  mkdtemp,
  mkdir,
  readFile,
  realpath,
  rename,
  rm,
  stat,
  symlink,
  writeFile
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  isPathWithin,
  PortfolioWorkspaceError,
  PortfolioWorkspaceRepository,
  windowsPathOperations
} from '../electron/main/portfolio-workspace-repository'

const roots: string[] = []
const request = { courseRunId: 'course-202608140001' }

async function fixture(): Promise<{
  root: string
  courseRoot: string
  dataDirectory: string
  workspace: string
}> {
  const root = await mkdtemp(join(tmpdir(), 'portfolio-workspace-'))
  roots.push(root)
  const courseRoot = join(root, 'course-repository')
  const dataDirectory = join(root, 'course-companion-data')
  const workspace = join(root, 'Hồ sơ nghề nghiệp')
  await Promise.all([mkdir(courseRoot), mkdir(dataDirectory), mkdir(workspace)])
  return { root, courseRoot, dataDirectory, workspace }
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe('PortfolioWorkspaceRepository', () => {
  it('persists verified registration only for the ready folder and retains it across relaunch', async () => {
    const { courseRoot, dataDirectory, workspace } = await fixture()
    const repository = new PortfolioWorkspaceRepository(dataDirectory, courseRoot)
    await repository.selectPath(request, workspace)
    const identity = { ...request, expectedPath: await realpath(workspace) }
    const project = { id: 'portfolio-project-1', name: 'Portfolio của tôi' }
    expect((await repository.saveCodexProject(identity, project)).status).toBe('awaiting-confirmation')
    await repository.confirmPlanning(request)
    expect((await repository.load(request)).codexProject).toBeUndefined()
    const registered = await repository.saveCodexProject(identity, project)
    expect(registered.codexProject).toMatchObject({ ...project, registeredAt: expect.any(String) })
    const resumed = new PortfolioWorkspaceRepository(dataDirectory, courseRoot)
    expect((await resumed.load(request)).codexProject).toEqual(registered.codexProject)
    expect((await resumed.saveCodexProject(identity, project)).codexProject).toEqual(registered.codexProject)
    expect((await resumed.confirmPlanning(request)).codexProject).toEqual(registered.codexProject)
  })

  it('rejects stale project bindings and clears registration when another folder is selected', async () => {
    const { root, courseRoot, dataDirectory, workspace } = await fixture()
    const other = join(root, 'Other portfolio')
    await mkdir(other)
    const repository = new PortfolioWorkspaceRepository(dataDirectory, courseRoot)
    const project = { id: 'portfolio-project-1', name: 'Portfolio của tôi' }
    await repository.selectPath(request, workspace)
    await repository.confirmPlanning(request)
    await expect(repository.saveCodexProject({ ...request, expectedPath: other }, project))
      .rejects.toMatchObject({ code: 'path-changed' })
    await expect(repository.saveCodexProject({ courseRunId: 'other-course', expectedPath: workspace }, project))
      .rejects.toMatchObject({ code: 'path-changed' })
    await repository.saveCodexProject({ ...request, expectedPath: await realpath(workspace) }, project)
    await repository.selectPath(request, other)
    expect((await repository.confirmPlanning(request)).codexProject).toBeUndefined()
  })

  it('does not record a project for a folder that disappeared', async () => {
    const { root, courseRoot, dataDirectory, workspace } = await fixture()
    const repository = new PortfolioWorkspaceRepository(dataDirectory, courseRoot)
    await repository.selectPath(request, workspace)
    await repository.confirmPlanning(request)
    const expectedPath = await realpath(workspace)
    await rename(workspace, join(root, 'moved'))
    const missing = await repository.saveCodexProject({ ...request, expectedPath }, { id: 'project-1', name: 'Portfolio' })
    expect(missing.status).toBe('missing')
    const stored = JSON.parse(await readFile(join(dataDirectory, 'portfolio-workspaces.json'), 'utf8'))
    expect(stored.workspaces[request.courseRunId].codexProject).toBeUndefined()
  })

  it('persists one canonical path and waits for confirmation before creating planning', async () => {
    const { courseRoot, dataDirectory, workspace } = await fixture()
    const repository = new PortfolioWorkspaceRepository(dataDirectory, courseRoot, () =>
      new Date('2026-08-14T10:00:00.000Z'))

    const selected = await repository.selectPath(request, workspace)
    expect(selected).toMatchObject({
      status: 'awaiting-confirmation',
      selectedPath: await realpath(workspace),
      folderName: 'Hồ sơ nghề nghiệp',
      canConfirmPlanning: true
    })
    await expect(readFile(join(workspace, 'planning'), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })

    const ready = await repository.confirmPlanning(request)
    expect(ready).toMatchObject({
      status: 'ready',
      planningPath: join(await realpath(workspace), 'planning'),
      canChoose: false,
      canConfirmPlanning: false
    })
    const state = JSON.parse(await readFile(join(dataDirectory, 'portfolio-workspaces.json'), 'utf8'))
    expect(Object.keys(state.workspaces[request.courseRunId])).toEqual([
      'canonicalPath',
      'selectedAt',
      'planningApprovedAt'
    ])
  })

  it('resumes the exact approved path after relaunch without indexing learner files', async () => {
    const { courseRoot, dataDirectory, workspace } = await fixture()
    const first = new PortfolioWorkspaceRepository(dataDirectory, courseRoot)
    await first.selectPath(request, workspace)
    await first.confirmPlanning(request)
    await writeFile(join(workspace, 'planning', 'private-notes.md'), 'Không lưu nội dung này vào app data.', 'utf8')

    const resumed = await new PortfolioWorkspaceRepository(dataDirectory, courseRoot).load(request)
    expect(resumed).toMatchObject({ status: 'ready', selectedPath: await realpath(workspace) })
    const stored = await readFile(join(dataDirectory, 'portfolio-workspaces.json'), 'utf8')
    expect(stored).not.toContain('private-notes.md')
    expect(stored).not.toContain('Không lưu nội dung này')
  })

  it.each([
    ['the course repository', 'course-repository'],
    ['a folder inside the course repository', 'course-child'],
    ['the application-data directory', 'application-data'],
    ['a folder inside application data', 'application-data-child']
  ])('rejects %s', async (_label, target) => {
    const { courseRoot, dataDirectory, root } = await fixture()
    const courseChild = join(courseRoot, 'portfolio')
    const dataChild = join(dataDirectory, 'portfolio')
    await Promise.all([mkdir(courseChild), mkdir(dataChild)])
    const selectedPath = {
      'course-repository': courseRoot,
      'course-child': courseChild,
      'application-data': dataDirectory,
      'application-data-child': dataChild
    }[target] ?? root
    const repository = new PortfolioWorkspaceRepository(dataDirectory, courseRoot)

    await expect(repository.selectPath(request, selectedPath)).rejects.toBeInstanceOf(PortfolioWorkspaceError)
  })

  it('rejects a file and a non-empty unrelated project', async () => {
    const { courseRoot, dataDirectory, root, workspace } = await fixture()
    const filePath = join(root, 'portfolio.txt')
    await writeFile(filePath, 'not a directory', 'utf8')
    await writeFile(join(workspace, 'package.json'), '{}', 'utf8')
    const repository = new PortfolioWorkspaceRepository(dataDirectory, courseRoot)

    await expect(repository.selectPath(request, filePath)).rejects.toMatchObject({ code: 'not-directory' })
    await expect(repository.selectPath(request, workspace)).rejects.toMatchObject({ code: 'not-empty' })
  })

  it('rejects a symlink located inside the course repository even when it points outside', async () => {
    const { courseRoot, dataDirectory, workspace } = await fixture()
    const linkedPath = join(courseRoot, 'linked-portfolio')
    await symlink(workspace, linkedPath, 'junction')

    await expect(new PortfolioWorkspaceRepository(dataDirectory, courseRoot).selectPath(request, linkedPath))
      .rejects.toMatchObject({ code: 'course-repository' })
  })

  it('reports a recoverable missing state after the selected folder is moved', async () => {
    const { courseRoot, dataDirectory, root, workspace } = await fixture()
    const repository = new PortfolioWorkspaceRepository(dataDirectory, courseRoot)
    await repository.selectPath(request, workspace)
    await repository.confirmPlanning(request)
    await rename(workspace, join(root, 'portfolio-moved'))

    await expect(repository.load(request)).resolves.toMatchObject({
      status: 'missing',
      canChoose: true,
      canConfirmPlanning: false
    })
  })

  it.runIf(process.platform !== 'win32')('reports permission loss without choosing a fallback', async () => {
    const { courseRoot, dataDirectory, workspace } = await fixture()
    const repository = new PortfolioWorkspaceRepository(dataDirectory, courseRoot)
    await repository.selectPath(request, workspace)
    await chmod(workspace, 0o000)
    try {
      await expect(repository.load(request)).resolves.toMatchObject({
        status: 'permission-denied',
        selectedPath: await realpath(workspace)
      })
    } finally {
      await chmod(workspace, 0o700)
    }
  })

  it('handles Windows paths with spaces and Vietnamese characters', () => {
    expect(isPathWithin(
      'C:\\Khóa học',
      'C:\\Khóa học\\Dự án của tôi',
      windowsPathOperations
    )).toBe(true)
    expect(isPathWithin(
      'C:\\Khóa học',
      'D:\\Portfolio của Triết',
      windowsPathOperations
    )).toBe(false)
  })

  it('removes only the persisted binding during a course reset', async () => {
    const { courseRoot, dataDirectory, workspace } = await fixture()
    const repository = new PortfolioWorkspaceRepository(dataDirectory, courseRoot)
    await repository.selectPath(request, workspace)
    await repository.confirmPlanning(request)
    await repository.reset()

    await expect(repository.load(request)).resolves.toMatchObject({ status: 'unselected' })
    await expect(stat(join(workspace, 'planning'))).resolves.toMatchObject({})
    expect((await stat(join(workspace, 'planning'))).isDirectory()).toBe(true)
  })
})
