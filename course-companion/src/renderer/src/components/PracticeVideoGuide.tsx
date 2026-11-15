import { useEffect, useRef, useState } from 'react'
import { reconcilePlayback, practiceVideo, videoComplete, type PlaybackBaseline, type PracticeVideoProgress } from '../../../../shared/practice-video'
import videoUrl from '../assets/practice-video/module-1-practice.mp4'
import captionsUrl from '../assets/practice-video/module-1-practice.vi.vtt?url'
import posterUrl from '../assets/practice-video/poster.jpg'

export function PracticeVideoGuide({ onConfirmed }: { onConfirmed?: (confirmed: boolean, courseRunId: string) => void }) {
  const player = useRef<HTMLVideoElement>(null)
  const progress = useRef<PracticeVideoProgress | null>(null)
  const baseline = useRef<PlaybackBaseline | null>(null)
  const saving = useRef<Promise<void>>(Promise.resolve())
  const playing = useRef(false)
  const lastSaved = useRef(0)
  const mounted = useRef(false)
  const loadRevision = useRef(0)
  const confirmationRetry = useRef(false)
  const restored = useRef(false)
  const [state, setState] = useState<PracticeVideoProgress | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [mediaError, setMediaError] = useState(false)
  const [pending, setPending] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [coverageNotice, setCoverageNotice] = useState('')

  const restorePosition = () => {
    const media = player.current
    const current = progress.current
    if (!media || !current || restored.current || media.readyState < 2) return
    restored.current = true
    if (current.position > 0 && Math.abs(media.currentTime - current.position) > 0.05) {
      media.currentTime = current.position
    } else {
      setReady(true)
    }
  }
  const load = async () => {
    const revision = ++loadRevision.current
    try {
      if (!window.courseCompanion) throw new Error('Practice API unavailable')
      const value = await window.courseCompanion.loadPracticeVideo()
      if (!mounted.current || revision !== loadRevision.current) return
      setError('')
      progress.current = value
      setState(value)
      onConfirmed?.(value.confirmed, value.courseRunId)
      restorePosition()
    } catch { if (mounted.current && revision === loadRevision.current) setError('Không thể đọc tiến độ xem video. Hãy thử lại.') }
  }
  const persist = (value: PracticeVideoProgress) => {
    saving.current = saving.current.catch(() => undefined).then(async () => {
      try {
        if (!window.courseCompanion) throw new Error('Practice API unavailable')
        const saved = await window.courseCompanion.updatePracticeVideo(value)
        if (mounted.current && progress.current && progress.current.courseRunId === saved.courseRunId) {
          progress.current = { ...progress.current, watched: Math.max(progress.current.watched, saved.watched), confirmed: saved.confirmed }
          setState({ ...progress.current })
          if (saved.confirmed) confirmationRetry.current = false
          onConfirmed?.(saved.confirmed, saved.courseRunId)
        }
        if (mounted.current && (!confirmationRetry.current || saved.confirmed)) setError('')
      } catch { if (mounted.current) setError('Không thể lưu tiến độ xem video. Hãy thử lại.') }
    })
    return saving.current
  }
  const update = () => {
    const media = player.current
    const current = progress.current
    if (!media || !current || media.seeking) return
    const wall = performance.now()
    const previous = baseline.current
    const time = Math.min(media.currentTime, practiceVideo.durationSeconds)
    const active = playing.current && !media.seeking && !document.hidden
    const result = reconcilePlayback(current.watched, time, wall, previous, active)
    current.watched = result.watched
    current.position = result.position
    if (result.rewound) {
      baseline.current = null
      media.currentTime = result.position
      setCoverageNotice('Video đã trở về đoạn đã xem để tiếp tục ghi nhận tiến độ.')
    } else {
      baseline.current = active ? { time, wall, rate: media.playbackRate } : null
    }
    setElapsed(result.position)
    setState({ ...current })
    if (current.watched - lastSaved.current >= 5) { lastSaved.current = current.watched; void persist({ ...current }) }
  }
  useEffect(() => {
    mounted.current = true
    // Loading the persisted receipt is asynchronous.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
    const element = player.current
    const revision = loadRevision
    const pauseAndSave = () => {
      update()
      element?.pause()
      playing.current = false
      baseline.current = null
      if (progress.current) void persist({ ...progress.current })
    }
    const visibility = () => { if (document.hidden) pauseAndSave() }
    document.addEventListener('visibilitychange', visibility)
    const unsubscribe = window.courseCompanion?.onPracticeVideoHidden(pauseAndSave)
    return () => {
      document.removeEventListener('visibilitychange', visibility)
      unsubscribe?.()
      element?.pause()
      playing.current = false
      baseline.current = null
      if (progress.current) void persist({ ...progress.current })
      mounted.current = false
      revision.current++
    }
    // This player is mounted for a single Practice introduction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  const seek = () => {
    const media = player.current
    const current = progress.current
    baseline.current = null
    if (!media || !current) return
    if (media.currentTime > current.watched + 0.05) {
      media.currentTime = current.watched
      setCoverageNotice('Video đã trở về đoạn đã xem để tiếp tục ghi nhận tiến độ.')
    }
    current.position = Math.min(media.currentTime, current.watched)
    setElapsed(current.position)
    void persist({ ...current })
  }
  const confirm = async () => {
    const current = progress.current
    if (!current || !videoComplete(current) || pending) return
    setPending(true)
    confirmationRetry.current = true
    await persist({ ...current, confirmed: true })
    setPending(false)
  }
  const format = (n: number) => `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, '0')}`
  return <section className="practice-video-guide" aria-labelledby="practice-video-heading">
    <h2 id="practice-video-heading">Xem cách thực hành cùng Codex và Triết</h2>
    <p>Xem hết video, sau đó xác nhận để bắt đầu thực hành.</p>
    <video ref={player} aria-label="Video hướng dẫn thực hành cùng Codex và Triết" playsInline controls={Boolean(state) && ready} preload="auto" poster={posterUrl} onLoadedData={restorePosition} onPlay={() => {
      const media = player.current
      const current = progress.current
      if (!media || !current) { media?.pause(); return }
      baseline.current = { time: Math.min(media.currentTime, current.watched), wall: performance.now(), rate: media.playbackRate }
    }} onTimeUpdate={update} onRateChange={() => { if (playing.current) update() }} onPlaying={() => {
      const media = player.current
      const current = progress.current
      playing.current = true
      if (media && current && !baseline.current) baseline.current = {
        time: Math.min(media.currentTime, current.watched), wall: performance.now(), rate: media.playbackRate
      }
    }} onWaiting={() => { if (playing.current) update(); playing.current = false; baseline.current = null }}
    onPause={() => { if (playing.current) update(); playing.current = false; baseline.current = null; if (progress.current) void persist({ ...progress.current }) }}
    onSeeking={seek} onSeeked={() => {
      const media = player.current
      const current = progress.current
      if (media && current && restored.current) setReady(true)
      if (media && current && !media.paused) baseline.current = {
        time: Math.min(media.currentTime, current.watched), wall: performance.now(), rate: media.playbackRate
      }
    }} onEnded={() => { if (progress.current) void persist({ ...progress.current }) }}
    onError={() => setMediaError(true)}>
      <source src={videoUrl} type="video/mp4" />
      <track kind="captions" src={captionsUrl} srcLang="vi" label="Tiếng Việt" />
    </video>
    <p>{format(elapsed)} / {format(practiceVideo.durationSeconds)}</p>
    {coverageNotice ? <p role="status">{coverageNotice}</p> : null}
    {mediaError ? <p role="alert">Không thể phát video. <button type="button" onClick={() => { setMediaError(false); player.current?.load() }}>Thử lại video</button></p> : null}
    {error ? <p role="alert">{error} <button type="button" onClick={() => { if (progress.current) void persist({ ...progress.current, confirmed: progress.current.confirmed || confirmationRetry.current }); else void load() }}>Thử lại</button></p> : null}
    <div className="practice-video-actions">
      <button type="button" disabled={!state || !ready} onClick={() => { if (player.current) { player.current.currentTime = 0; void player.current.play() } }}>Xem lại</button>
      <button className="practice-video-confirm" type="button" disabled={!state || !videoComplete(state) || state.confirmed || pending} onClick={() => void confirm()}>
        {state?.confirmed ? 'Đã xác nhận' : 'Tôi đã xem hết và hiểu cách thực hành'}
      </button>
    </div>
  </section>
}
