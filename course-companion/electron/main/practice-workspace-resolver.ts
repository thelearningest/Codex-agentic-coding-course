import { access, realpath, stat } from 'node:fs/promises'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'
import type { PracticeWorkspaceKind } from '../../shared/contracts'

function isContained(root: string, candidate: string): boolean {
  const pathFromRoot = relative(root, candidate)
  return pathFromRoot === '' ||
    (!pathFromRoot.startsWith(`..${sep}`) && pathFromRoot !== '..' && !isAbsolute(pathFromRoot))
}

export type PracticeWorkspaceResolverPort = {
  resolve: (kind: PracticeWorkspaceKind) => Promise<string>
  resolveProjectId?: (kind: PracticeWorkspaceKind, workspaceRoot?: string) => Promise<string | undefined>
}

export class PracticeWorkspaceResolver implements PracticeWorkspaceResolverPort {
  constructor(
    private readonly courseRoot: string,
    private readonly loadPortfolioPath?: () => Promise<string | null>,
    private readonly loadPortfolioProjectId?: (expectedRoot: string) => Promise<string>
  ) {}

  async resolveProjectId(kind: PracticeWorkspaceKind, workspaceRoot?: string): Promise<string | undefined> {
    return kind === 'learner-portfolio' ? this.loadPortfolioProjectId?.(workspaceRoot ?? await this.resolve(kind)) : undefined
  }

  async resolve(kind: PracticeWorkspaceKind): Promise<string> {
    if (kind === 'learner-portfolio') {
      const selectedPath = await this.loadPortfolioPath?.()
      if (!selectedPath || !isAbsolute(selectedPath)) {
        throw new Error('A ready learner portfolio workspace is required')
      }
      const canonicalCourseRoot = await realpath(resolve(this.courseRoot))
      const canonicalPortfolio = await realpath(resolve(selectedPath))
      if (!(await stat(canonicalPortfolio)).isDirectory()
        || isContained(canonicalCourseRoot, canonicalPortfolio)) {
        throw new Error('Learner portfolio workspace is unavailable or unsafe')
      }
      await access(canonicalPortfolio)
      return canonicalPortfolio
    }
    if (kind !== 'pilot-workspace') throw new Error('Unsupported Practice workspace kind')

    const configuredRoot = resolve(this.courseRoot)
    const canonicalRoot = await realpath(configuredRoot)
    if (!(await stat(canonicalRoot)).isDirectory()) {
      throw new Error('Course root is not a directory')
    }

    const candidate = join(canonicalRoot, 'pilot-workspace')
    const canonicalWorkspace = await realpath(candidate)
    if (!(await stat(canonicalWorkspace)).isDirectory() ||
      !isContained(canonicalRoot, canonicalWorkspace)) {
      throw new Error('Practice workspace escapes the validated course root')
    }

    return canonicalWorkspace
  }
}
