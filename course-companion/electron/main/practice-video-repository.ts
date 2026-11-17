import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { practiceVideo, videoComplete, type PracticeVideoProgress, type PracticeVideoUpdate } from '../../shared/practice-video'

const idPattern = /^[A-Za-z0-9_-]{1,160}$/
function valid(value: unknown): value is PracticeVideoProgress {
  if (!value || typeof value !== 'object') return false
  const p = value as PracticeVideoProgress
  return typeof p.courseRunId === 'string' && idPattern.test(p.courseRunId)
    && typeof p.videoId === 'string' && idPattern.test(p.videoId)
    && typeof p.version === 'string' && /^[A-Za-z0-9._-]{1,80}$/.test(p.version)
    && Number.isFinite(p.watched) && p.watched >= 0 && p.watched <= 86400
    && Number.isFinite(p.position) && p.position >= 0 && p.position <= p.watched + 0.05
    && typeof p.confirmed === 'boolean'
    && (p.videoId !== practiceVideo.videoId || p.version !== practiceVideo.version || (p.watched <= practiceVideo.durationSeconds && (!p.confirmed || videoComplete(p))))
}

export class PracticeVideoRepository {
  private queue: Promise<void> = Promise.resolve()
  private path: string
  private backup: string
  constructor(private directory: string) {
    this.path = join(directory, 'practice-video.json')
    this.backup = join(directory, 'practice-video.backup.json')
  }
  private exclusive<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.queue.then(operation)
    this.queue = result.then(() => undefined, () => undefined)
    return result
  }
  private async read(path: string): Promise<PracticeVideoProgress[] | null> {
    try {
      const data: unknown = JSON.parse(await readFile(path, 'utf8'))
      if (!Array.isArray(data) || !data.every(valid)) throw new Error('Invalid video progress')
      return data
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
      throw error
    }
  }
  private async readAll(): Promise<PracticeVideoProgress[]> {
    try { return (await this.read(this.path)) ?? (await this.read(this.backup)) ?? [] }
    catch {
      const backup = await this.read(this.backup)
      if (!backup) throw new Error('Cannot recover video progress')
      return backup
    }
  }
  private empty(courseRunId: string): PracticeVideoProgress {
    if (!idPattern.test(courseRunId)) throw new Error('Invalid course run')
    return { courseRunId, videoId: practiceVideo.videoId, version: practiceVideo.version, watched: 0, position: 0, confirmed: false }
  }
  load(courseRunId: string): Promise<PracticeVideoProgress> {
    return this.exclusive(async () => (await this.readAll()).find((p) => p.courseRunId === courseRunId && p.videoId === practiceVideo.videoId && p.version === practiceVideo.version) ?? this.empty(courseRunId))
  }
  update(courseRunId: string, update: PracticeVideoUpdate): Promise<PracticeVideoProgress> {
    return this.exclusive(async () => {
      if (!valid(update) || update.courseRunId !== courseRunId || update.videoId !== practiceVideo.videoId || update.version !== practiceVideo.version || (update.confirmed && !videoComplete(update))) throw new Error('Invalid video progress update')
      const entries = await this.readAll()
      const current = entries.find((p) => p.courseRunId === courseRunId && p.videoId === practiceVideo.videoId && p.version === practiceVideo.version) ?? this.empty(courseRunId)
      const next = { ...update, watched: Math.max(current.watched, update.watched), confirmed: current.confirmed || update.confirmed }
      const records = [...entries.filter((p) => !(p.courseRunId === courseRunId && p.videoId === practiceVideo.videoId && p.version === practiceVideo.version)), next]
      await mkdir(this.directory, { recursive: true })
      const body = JSON.stringify(records)
      await writeFile(this.path + '.tmp', body, 'utf8')
      await rename(this.path + '.tmp', this.path)
      await writeFile(this.backup + '.tmp', body, 'utf8')
      await rename(this.backup + '.tmp', this.backup)
      return next
    })
  }
}
