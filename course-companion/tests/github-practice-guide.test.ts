import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { githubCheckMessages, githubPushPrompt } from '../src/renderer/src/components/github-practice-copy'

const renderer = resolve(process.cwd(), 'src', 'renderer', 'src')
const read = (...path: string[]) => readFile(resolve(renderer, ...path), 'utf8')

describe('Module 3 GitHub practice guide', () => {
  it('walks through four steps and shows a saved check as passed', async () => {
    const guide = await read('components', 'GitHubPracticeGuide.tsx')
    for (const title of ['Tạo tài khoản GitHub', 'Tạo repo trên GitHub', 'Nhờ agent push portfolio lên repo', 'Dán link repo để kiểm tra']) {
      expect(guide).toContain(`title="${title}"`)
    }
    expect(guide).toContain('{done.size}/4 bước')
    expect(guide).toContain('useState<StepNumber | 0>(verifiedRepository ? 4 : 1)')
    expect(guide).toContain('new Set(verifiedRepository ? stepNumbers : [])')
    expect(guide).toContain("verifiedRepository ? { status: 'passed', repository: verifiedRepository } : null")
    expect(guide).toContain('api.checkPortfolioGitHubRepository(link)')
    expect(guide).toContain('Đừng gửi mật khẩu cho agent.')
  })

  it('asks the agent to check for secrets and ends the prompt where the learner pastes the link', () => {
    expect(githubPushPrompt).toContain('không có secret hay thông tin riêng tư')
    expect(githubPushPrompt.endsWith('\n\nLink repo: ')).toBe(true)
  })

  it('has a learner message for every failed check', () => {
    expect(Object.keys(githubCheckMessages).sort()).toEqual(
      ['different-repository', 'invalid-link', 'no-remote', 'not-pushed', 'unavailable'])
    expect(githubCheckMessages['no-remote']).toBe('Agent chưa đưa portfolio lên repo GitHub nào. Hãy làm lại bước 3: dán prompt kèm link repo vào Codex.')
  })

  it('keeps Continue locked on the practice page until the repository check passes', async () => {
    const source = await read('surfaces', 'LearningWindow.tsx')
    expect(source).toContain('disabled={busy || (isGitHubPractice && !githubRepository)}')
    expect(source).toContain("decision: { key: 'portfolioGitHubRepository', value: githubRepository }")
  })
})
