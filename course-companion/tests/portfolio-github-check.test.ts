import { execFileSync } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { checkPortfolioGitHubRepository, parseGitHubRepository } from '../electron/main/portfolio-github-check'

const roots: string[] = []
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

function git(root: string, ...args: string[]) {
  return execFileSync('git', args, {
    cwd: root, encoding: 'utf8',
    env: { ...process.env, GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 'test@example.invalid',
      GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 'test@example.invalid' }
  })
}

async function portfolio({ commit = true, remote }: { commit?: boolean; remote?: string } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'portfolio-github-check-'))
  roots.push(root)
  git(root, 'init', '--quiet', '--initial-branch=main')
  if (commit) {
    await writeFile(join(root, 'index.html'), '<h1>Portfolio</h1>\n')
    git(root, 'add', 'index.html')
    git(root, 'commit', '--quiet', '-m', 'First version')
  }
  if (remote) git(root, 'remote', 'add', 'origin', remote)
  return root
}

/** A successful push leaves the pushed commit on the remote-tracking branch. */
const recordPush = (root: string) => git(root, 'update-ref', 'refs/remotes/origin/main', 'HEAD')

describe('parseGitHubRepository', () => {
  it.each([
    ['https://github.com/thelearningest/your-portfolio-name.git', 'thelearningest/your-portfolio-name'],
    ['https://github.com/an-nguyen/portfolio', 'an-nguyen/portfolio'],
    ['  github.com/an/portfolio/  ', 'an/portfolio'],
    ['http://www.github.com/an/my.portfolio', 'an/my.portfolio'],
    ['https://github.com/an/portfolio/tree/main?tab=readme', 'an/portfolio'],
    ['git@github.com:an/portfolio.git', 'an/portfolio'],
    ['ssh://git@github.com/an/portfolio.git', 'an/portfolio']
  ])('reads %s', (link, repository) => {
    expect(parseGitHubRepository(link)).toBe(repository)
  })

  it.each([
    'portfolio', 'https://gitlab.com/an/portfolio', 'https://github.com/an', 'https://github.com/',
    'https://notgithub.com/an/portfolio', 'https://github.com.evil.example/an/portfolio', ''
  ])('rejects %s', (link) => {
    expect(parseGitHubRepository(link)).toBeNull()
  })
})

describe('checkPortfolioGitHubRepository', () => {
  it('passes when the pasted repository is linked and the latest commit was pushed', async () => {
    const root = await portfolio({ remote: 'https://github.com/an/portfolio.git' })
    recordPush(root)
    await expect(checkPortfolioGitHubRepository(root, 'https://github.com/An/Portfolio'))
      .resolves.toEqual({ status: 'passed', repository: 'an/portfolio' })
  })

  it('rejects text that is not a GitHub repository link before reading the folder', async () => {
    await expect(checkPortfolioGitHubRepository('/does/not/exist', 'my portfolio'))
      .resolves.toEqual({ status: 'invalid-link' })
  })

  it('reports a folder that was never linked to GitHub', async () => {
    const root = await portfolio()
    await expect(checkPortfolioGitHubRepository(root, 'https://github.com/an/portfolio'))
      .resolves.toEqual({ status: 'no-remote' })
  })

  it('names the linked repository when the pasted link is a different one', async () => {
    const root = await portfolio({ remote: 'git@github.com:an/portfolio.git' })
    recordPush(root)
    await expect(checkPortfolioGitHubRepository(root, 'https://github.com/an/other-repo'))
      .resolves.toEqual({ status: 'different-repository', repository: 'an/portfolio' })
  })

  it('reports a linked repository that does not have the latest commit yet', async () => {
    const root = await portfolio({ remote: 'https://github.com/an/portfolio.git' })
    recordPush(root)
    await writeFile(join(root, 'about.html'), '<p>About</p>\n')
    git(root, 'add', 'about.html')
    git(root, 'commit', '--quiet', '-m', 'Add about page')
    await expect(checkPortfolioGitHubRepository(root, 'https://github.com/an/portfolio'))
      .resolves.toEqual({ status: 'not-pushed', repository: 'an/portfolio' })
  })

  it('reports a linked repository with nothing committed yet as not pushed', async () => {
    const root = await portfolio({ commit: false, remote: 'https://github.com/an/portfolio.git' })
    await expect(checkPortfolioGitHubRepository(root, 'https://github.com/an/portfolio'))
      .resolves.toEqual({ status: 'not-pushed', repository: 'an/portfolio' })
  })

  it('reports the folder as unavailable when Git cannot read it', async () => {
    const root = await mkdtemp(join(tmpdir(), 'portfolio-github-check-missing-'))
    roots.push(root)
    await expect(checkPortfolioGitHubRepository(root, 'https://github.com/an/portfolio', async () => {
      throw new Error('not a git repository')
    })).resolves.toEqual({ status: 'unavailable' })
  })
})
