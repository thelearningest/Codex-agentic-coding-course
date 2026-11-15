import manifest from './practice-video-manifest.json'

export const practiceVideo = manifest
export const practiceVideoPracticeId = 'm1-codex-safe-setup'
export type PracticeVideoProgress = {
  courseRunId: string
  videoId: string
  version: string
  watched: number
  position: number
  confirmed: boolean
}
export type PracticeVideoUpdate = PracticeVideoProgress
export function videoComplete(progress: PracticeVideoProgress): boolean {
  return progress.watched >= practiceVideo.durationSeconds - 0.05
}
export function advanceWatched(frontier: number, previous: number, current: number, elapsedSeconds: number, rate: number, active: boolean): number {
  const delta = current - previous
  if (!active || previous > frontier + 0.05 || delta < 0 || delta > elapsedSeconds * rate + 0.3) return frontier
  return Math.max(frontier, current)
}
export type PlaybackBaseline = { time: number; wall: number; rate: number }
export function reconcilePlayback(frontier: number, time: number, wall: number, baseline: PlaybackBaseline | null, active: boolean): { watched: number; position: number; rewound: boolean } {
  const watched = baseline && active
    ? advanceWatched(frontier, baseline.time, time, (wall - baseline.wall) / 1000, baseline.rate, true)
    : frontier
  const rewound = time > watched + 0.05
  return { watched, position: rewound ? watched : Math.min(time, watched), rewound }
}
