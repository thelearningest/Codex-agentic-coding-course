import type { PortfolioGitHubCheckResult } from '../../shared/contracts'
import { readPortfolioReleaseGit } from './portfolio-release-git'

type GitRead = (root: string, args: string[]) => Promise<string>

const owner = '([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))'
const name = '([A-Za-z0-9._-]+?)'
const patterns = [
  // https://github.com/owner/repo(.git), with optional www, scheme, trailing path, query or hash.
  new RegExp(`^(?:https?://)?(?:www\\.)?github\\.com/${owner}/${name}(?:\\.git)?(?:[/?#].*)?$`, 'i'),
  // git@github.com:owner/repo(.git)
  new RegExp(`^git@github\\.com:${owner}/${name}(?:\\.git)?/?$`, 'i'),
  // ssh://git@github.com/owner/repo(.git)
  new RegExp(`^ssh://git@github\\.com/${owner}/${name}(?:\\.git)?/?$`, 'i')
]

/** Returns "owner/repo" for a GitHub repository link, or null when the text is not one. */
export function parseGitHubRepository(link: string): string | null {
  const text = link.trim()
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1] && match[2] && match[2] !== '.' && match[2] !== '..') return `${match[1]}/${match[2]}`
  }
  return null
}

const sameRepository = (left: string, right: string) => left.toLowerCase() === right.toLowerCase()

/**
 * Checks, without network access, that the portfolio folder is linked to the pasted GitHub
 * repository and that its latest commit is already on that repository's remote-tracking branches.
 * Remote-tracking refs are updated by a successful push, so a private repository works too.
 */
export async function checkPortfolioGitHubRepository(
  workspaceRoot: string,
  link: string,
  git: GitRead = readPortfolioReleaseGit
): Promise<PortfolioGitHubCheckResult> {
  const pasted = parseGitHubRepository(link)
  if (!pasted) return { status: 'invalid-link' }

  let remoteLines: string[]
  try {
    remoteLines = (await git(workspaceRoot, ['remote', '-v'])).split(/\r?\n/)
  } catch {
    return { status: 'unavailable' }
  }
  const remotes = new Map<string, string>()
  for (const line of remoteLines) {
    const [remote, url] = line.split(/\s+/)
    const repository = url ? parseGitHubRepository(url) : null
    if (remote && repository && !remotes.has(remote)) remotes.set(remote, repository)
  }
  if (remotes.size === 0) return { status: 'no-remote' }

  const matched = [...remotes].find(([, repository]) => sameRepository(repository, pasted))
  if (!matched) return { status: 'different-repository', repository: [...remotes.values()][0]! }
  const [remote, repository] = matched

  try {
    await git(workspaceRoot, ['rev-parse', '--verify', '--quiet', 'HEAD^{commit}'])
  } catch {
    return { status: 'not-pushed', repository }
  }
  try {
    const containing = await git(workspaceRoot,
      ['for-each-ref', '--contains', 'HEAD', '--format=%(refname)', `refs/remotes/${remote}/`])
    return containing.trim() ? { status: 'passed', repository } : { status: 'not-pushed', repository }
  } catch {
    return { status: 'unavailable' }
  }
}
