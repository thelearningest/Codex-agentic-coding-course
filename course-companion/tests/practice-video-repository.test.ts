import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { PracticeVideoRepository } from '../electron/main/practice-video-repository'
import { advanceWatched, reconcilePlayback, practiceVideo } from '../shared/practice-video'

const directories: string[] = []
afterEach(async () => { await Promise.all(directories.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))) })
async function setup() {
  const dir = await mkdtemp(join(tmpdir(), 'practice-video-test-'))
  directories.push(dir)
  return { dir, repo: new PracticeVideoRepository(dir) }
}
describe('Practice video receipts', () => {
  it('requires explicit confirmation and persists separately per course and version', async () => {
    const { dir, repo } = await setup()
    const initial = await repo.load('run-one')
    await expect(repo.update('run-one', { ...initial, confirmed: true })).rejects.toThrow()
    const watched = { ...initial, watched: practiceVideo.durationSeconds, position: practiceVideo.durationSeconds }
    await repo.update('run-one', watched)
    expect((await repo.load('run-one')).confirmed).toBe(false)
    await repo.update('run-one', { ...watched, confirmed: true })
    expect((await new PracticeVideoRepository(dir).load('run-one')).confirmed).toBe(true)
    expect((await repo.load('run-two')).watched).toBe(0)
    await expect(repo.update('run-two', watched)).rejects.toThrow()
    await expect(repo.update('run-one', { ...watched, version: 'other' })).rejects.toThrow()
  })
  it('serializes saves, retains the furthest frontier and recovers corruption', async () => {
    const { dir, repo } = await setup()
    const start = await repo.load('run-one')
    await Promise.all([
      repo.update('run-one', { ...start, watched: 10, position: 10 }),
      repo.update('run-one', { ...start, watched: 5, position: 5 })
    ])
    expect((await repo.load('run-one')).watched).toBe(10)
    await writeFile(join(dir, 'practice-video.json'), 'broken')
    expect((await repo.load('run-one')).watched).toBe(10)
    await repo.update('run-one', { ...start, watched: 12, position: 12 })
    expect(JSON.parse(await readFile(join(dir, 'practice-video.json'), 'utf8'))[0].watched).toBe(12)
  })
  it('recovers its write queue after an I/O failure', async () => {
    const { dir } = await setup()
    const blocked = join(dir, 'blocked')
    await writeFile(blocked, 'not a directory')
    const repo = new PracticeVideoRepository(blocked)
    const initial = { courseRunId: 'run-one', videoId: practiceVideo.videoId, version: practiceVideo.version, watched: 1, position: 1, confirmed: false }
    await expect(repo.update('run-one', initial)).rejects.toThrow()
    await rm(blocked)
    expect((await repo.update('run-one', initial)).watched).toBe(1)
  })
  it('rejects impossible ranges and allows later writes after a failed update', async () => {
    const { repo } = await setup()
    const start = await repo.load('run-one')
    await expect(repo.update('run-one', { ...start, position: 10 })).rejects.toThrow()
    await expect(repo.update('run-one', { ...start, watched: Number.NaN })).rejects.toThrow()
    expect((await repo.update('run-one', { ...start, watched: 2, position: 2 })).watched).toBe(2)
  })
})

describe('continuous playback coverage', () => {
  it('counts continuous playback but rejects seeks, buffering and hidden playback', () => {
    expect(advanceWatched(5, 5, 6, 1, 1, true)).toBe(6)
    expect(advanceWatched(5, 5, 50, 1, 1, true)).toBe(5)
    expect(advanceWatched(5, 20, 21, 1, 1, true)).toBe(5)
    expect(advanceWatched(5, 5, 6, 1, 1, false)).toBe(5)
    expect(advanceWatched(5, 4, 5, 1, 1, true)).toBe(5)
    expect(advanceWatched(5, 5, 7, 1, 2, true)).toBe(7)
  })
  it('credits the previous rate when slowing down, then continues at the new rate', () => {
    const beforeChange = reconcilePlayback(10, 12, 1000, { time: 10, wall: 0, rate: 2 }, true)
    expect(beforeChange).toEqual({ watched: 12, position: 12, rewound: false })
    const afterChange = reconcilePlayback(beforeChange.watched, 12.25, 2000, { time: 12, wall: 1000, rate: 0.25 }, true)
    expect(afterChange).toEqual({ watched: 12.25, position: 12.25, rewound: false })
  })
  it('rewinds rejected gaps and resumes credit from the frontier', () => {
    const rejected = reconcilePlayback(10, 14, 1000, { time: 10, wall: 0, rate: 1 }, true)
    expect(rejected).toEqual({ watched: 10, position: 10, rewound: true })
    const resumed = reconcilePlayback(rejected.watched, 11, 2000, { time: rejected.position, wall: 1000, rate: 1 }, true)
    expect(resumed).toEqual({ watched: 11, position: 11, rewound: false })
  })
})
