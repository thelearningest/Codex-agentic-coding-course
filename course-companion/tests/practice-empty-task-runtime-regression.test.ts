import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = (path: string) => readFile(join(process.cwd(), path), 'utf8')

describe('newly created Codex task runtime regression', () => {
  it('keeps the real empty-rollout shape in coverage without making review depend on it', async () => {
    const [rollout, snapshot, main] = await Promise.all([
      source('tests/fixtures/codex-empty-task-rollout.jsonl'),
      source('electron/main/executor-activity-snapshot-reader.ts'),
      source('electron/main/index.ts')
    ])
    const items = rollout.trim().split(/\r?\n/).map((line) => JSON.parse(line) as {
      type: string
      payload?: { type?: string }
    })

    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ type: 'session_meta' })
    expect(items.some((item) => item.type === 'event_msg'
      && item.payload?.type === 'thread_settings_applied')).toBe(false)
    expect(snapshot).not.toContain("'thread/resume'")
    expect(snapshot).toContain('this.metadata.read(binding,')
    expect(snapshot).not.toContain('thread_settings_applied')
    expect(main).toContain('CodexTaskMetadataReader')
  })
})
