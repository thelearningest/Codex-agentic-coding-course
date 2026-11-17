import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { resolve, sep } from 'node:path'

// Lifecycle tests unrelated to video playback explicitly seed this receipt in
// their disposable profile. The dedicated video test must never use this helper.
export async function seedPracticeVideoReceipt(page, profile) {
  const directory = resolve(profile)
  assert.ok(directory.startsWith(resolve(tmpdir()) + sep), 'Video fixture belongs only in a temporary test profile')
  const loaded = await page.evaluate(() => globalThis.courseCompanion.loadProgress())
  assert.ok(loaded.progress?.courseRunId, 'Create the disposable course run first')
  const manifest = JSON.parse(await readFile(new URL('../../shared/practice-video-manifest.json', import.meta.url), 'utf8'))
  const receipt = [{ courseRunId: loaded.progress.courseRunId, videoId: manifest.videoId, version: manifest.version,
    watched: manifest.durationSeconds, position: 0, confirmed: true }]
  await writeFile(join(directory, 'practice-video.json'), JSON.stringify(receipt))
  await writeFile(join(directory, 'practice-video.backup.json'), JSON.stringify(receipt))
}
