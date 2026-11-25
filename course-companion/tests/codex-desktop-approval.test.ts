import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { readDesktopApprovalsReviewer } from '../electron/main/codex-desktop-approval'

let directory: string | undefined

afterEach(async () => {
  if (directory) await rm(directory, { recursive: true })
  directory = undefined
})

describe('readDesktopApprovalsReviewer', () => {
  it.each([
    [{ kind: 'agent-mode', agentMode: 'guardian-approvals' }, 'auto_review'],
    [{ kind: 'agent-mode', agentMode: 'auto' }, 'user'],
    [{ kind: 'agent-mode', agentMode: 'full-access' }, undefined],
    [{ kind: 'profile', profileId: 'custom' }, undefined],
    [undefined, undefined]
  ])('maps the active local profile selection %j to %s', async (selection, reviewer) => {
    directory = await mkdtemp(join(tmpdir(), 'course-desktop-approval-'))
    await writeFile(join(directory, '.codex-global-state.json'), JSON.stringify({
      'electron-renderer-content-owner': 'active-owner',
      'electron-owner-atoms:other-owner': {
        'permission-selection-by-host-id:local': { kind: 'agent-mode', agentMode: 'guardian-approvals' }
      },
      'electron-owner-atoms:active-owner': { 'permission-selection-by-host-id:local': selection }
    }))

    expect(await readDesktopApprovalsReviewer(directory)).toBe(reviewer)
  })

  it('leaves the choice to Codex if Desktop state is unavailable', async () => {
    directory = await mkdtemp(join(tmpdir(), 'course-desktop-approval-'))
    expect(await readDesktopApprovalsReviewer(directory)).toBeUndefined()
  })
})
