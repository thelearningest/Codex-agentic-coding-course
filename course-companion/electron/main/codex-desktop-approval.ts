import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export type DesktopApprovalsReviewer = 'user' | 'auto_review'

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

export async function readDesktopApprovalsReviewer(codexHome: string): Promise<DesktopApprovalsReviewer | undefined> {
  let state: Record<string, unknown> | undefined
  try {
    state = record(JSON.parse(await readFile(join(codexHome, '.codex-global-state.json'), 'utf8')))
  } catch {
    return undefined
  }

  const owner = state?.['electron-renderer-content-owner']
  if (typeof owner !== 'string') return undefined
  const atoms = record(state?.['electron-owner-atoms:' + owner])
  const selection = record(atoms?.['permission-selection-by-host-id:local'])
  if (selection?.kind !== 'agent-mode') return undefined

  // These two Desktop presets differ in where the same approval requests go.
  if (selection.agentMode === 'guardian-approvals') return 'auto_review'
  if (selection.agentMode === 'auto') return 'user'
  return undefined
}
