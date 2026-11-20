import { PortfolioPlanningGuide } from './PortfolioPlanningGuide'
import { PracticeScreenshotGuide } from './PracticeScreenshotGuide'
import { useEffect, useState } from 'react'
import type { PracticeIdentity, PracticeWorkspaceView } from '../../../../shared/contracts'
import { PracticeProgress } from './PracticeProgress'
import { PracticeSwitchDialog } from './PracticeSwitchDialog'
import { PracticeIntroduction } from './PracticeIntroduction'
import { getPracticeIntroduction } from './practice-introduction-copy'
import { PracticeStartPrompt } from './PracticeStartPrompt'
import { TeacherOrientation } from './TeacherOrientation'

type PracticeBriefProps = {
  identity: PracticeIdentity
  firstBuild?: boolean
  courseRunId?: string
  onClose: () => void
  onPortfolioComplete?: () => void | Promise<void>
}

const previewWorkspace: PracticeWorkspaceView = {
  schemaVersion: 1,
  phase: 'brief',
  title: 'Bài thực hành',
  objective: 'Đang tải mục tiêu Practice…',
  expectedOutcome: 'Course Companion sẽ hiển thị kết quả cần đạt từ định nghĩa Practice.',
  checklist: [],
  presentation: { fullPanel: 'teacher', compactPanel: 'teacher' },
  capabilities: {
    canStartNew: true,
    canResume: false,
    selectiveTransferAvailable: false,
    selectiveTransferReason: 'Tạm thời không khả dụng trong bản Codex hiện tại.'
  }
}

export function PracticeBrief({
  identity,
  firstBuild = false,
  courseRunId,
  onClose,
  onPortfolioComplete
}: PracticeBriefProps) {
  const [workspace, setWorkspace] = useState<PracticeWorkspaceView | null>(null)
  const [busy, setBusy] = useState(false)
  const [returnBusy, setReturnBusy] = useState(false)
  const [switchOpen, setSwitchOpen] = useState(false)
  const [error, setError] = useState('')
  const planningPractice = identity.practiceId === 'm2-portfolio-planning'
  const setupPractice = identity.practiceId === 'm1-codex-safe-setup'

  const load = async () => {
    try {
      setWorkspace(
        window.courseCompanion
          ? await window.courseCompanion.loadPracticeWorkspace(identity)
          : previewWorkspace
      )
    } catch {
      setError('Không thể đọc trạng thái Practice. Hãy thử lại.')
    }
  }

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const initialWorkspace = window.courseCompanion
          ? await window.courseCompanion.loadPracticeWorkspace(identity)
          : await Promise.resolve(previewWorkspace)
        setWorkspace(initialWorkspace)
      } catch {
        setError('Không thể đọc trạng thái Practice. Hãy thử lại.')
      }
    }

    void loadInitial()
  }, [identity])

  const start = async () => {
    if (!workspace || busy) return
    if (workspace.activePractice && !switchOpen) {
      setSwitchOpen(true)
      return
    }
    setBusy(true)
    setError('')
    try {
      const next = window.courseCompanion
        ? await window.courseCompanion.startPractice({ ...identity, transfer: false })
        : workspace
      setWorkspace(next)
      setSwitchOpen(false)
    } catch {
      setError('')
      await load()
      setSwitchOpen(false)
    } finally {
      setBusy(false)
    }
  }

  const resume = async () => {
    if (!workspace || busy) return
    setBusy(true)
    setError('')
    try {
      setWorkspace(
        window.courseCompanion
          ? await window.courseCompanion.resumePractice(identity)
          : workspace
      )
    } catch {
      setError('Không thể mở task Codex đang hoạt động. Hãy thử lại.')
      await load()
    } finally {
      setBusy(false)
    }
  }

  const retry = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      if (window.courseCompanion) {
        setWorkspace(await window.courseCompanion.retryPracticeSwitch())
      }
    } catch {
      setError('')
      await load()
    } finally {
      setBusy(false)
    }
  }

  const cancelTransition = async () => {
    if (!window.courseCompanion || busy) return
    setBusy(true)
    try {
      setWorkspace(await window.courseCompanion.cancelPracticeSwitch())
    } catch {
      setError('Không thể hủy lần chuyển ở giai đoạn hiện tại.')
    } finally {
      setBusy(false)
    }
  }

  const recordPortfolioStage = async (
    stageId: string,
    decision: 'approved' | 'revision-requested',
    sliceId?: import('../../../../shared/contracts').PortfolioBuildSliceId
  ) => {
    const active = workspace?.activePractice
    if (!active || !courseRunId || busy || !window.courseCompanion) return
    setBusy(true)
    setError('')
    try {
      const next = await window.courseCompanion.recordPortfolioStageAction({
        runId: active.runId,
        generation: active.generation,
        practiceId: active.practiceId,
        practiceVersion: active.practiceVersion,
        courseRunId,
        stageId,
        ...(sliceId ? { sliceId } : {}),
        decision
      })
      setWorkspace(next)
      if (decision === 'approved'
        && (next.portfolioPlanning ?? next.portfolioBuild)?.stages.every((stage) => stage.status === 'completed')) {
        await onPortfolioComplete?.()
      }
    } catch {
      setError('Không thể ghi nhận quyết định trên bằng chứng hiện tại. Hãy làm mới rồi thử lại.')
      await load()
    } finally {
      setBusy(false)
    }
  }

  if (!workspace) {
    return (
      <main className="practice-brief-overlay is-loading" aria-live="polite">
        <span className="practice-loading-orbit" aria-hidden="true" />
        <strong>{error || 'Đang đọc Practice…'}</strong>
        {error ? <button type="button" onClick={() => void load()}>Thử lại</button> : null}
      </main>
    )
  }

  const switching = workspace.phase === 'switching'
  const introduction = getPracticeIntroduction(identity.practiceId)
  const hasRequestedPractice = workspace.activePractice?.practiceId === identity.practiceId
    && workspace.activePractice.practiceVersion === identity.practiceVersion
  const startPrompt = identity.practiceId === 'm3-portfolio-build' && !firstBuild && hasRequestedPractice && workspace.startPrompt
    ? 'Tiếp tục Module 3 trên bản portfolio hiện tại. Hãy giúp tôi đối chiếu từng yêu cầu PRD theo cách kiểm tra trong implementation plan. Tôi sẽ tự thử website, nêu kết quả và quyết định có cần sửa trước khi nộp.'
    : workspace.startPrompt
  const preferResume = Boolean(introduction && hasRequestedPractice && workspace.capabilities.canResume)
  const resumeButton = workspace.capabilities.canResume ? (
    <button className={preferResume ? 'is-primary' : undefined} type="button" disabled={busy || switching} onClick={() => void resume()}>
      Tiếp tục Practice
    </button>
  ) : null
  const controls = <>
    <div className="practice-brief-actions">
      {preferResume ? resumeButton : null}
      {!(preferResume && identity.practiceId === 'm3-portfolio-build') && <button className={preferResume ? undefined : 'is-primary'} type="button" disabled={busy || switching} onClick={() => void start()}>
        {busy ? 'Đang chuẩn bị…' : introduction && !hasRequestedPractice ? 'Bắt đầu thực hành' : 'Bắt đầu Practice mới'}
      </button>}
      {!preferResume ? resumeButton : null}
    </div>

    {switching && workspace.transition ? (
      <div className="practice-transition" aria-live="polite">
        {busy || !(error || workspace.error) ? <span className="practice-loading-orbit" aria-hidden="true" /> : null}
        <strong>{workspace.transition.label}</strong>
        {workspace.transition.canRetry ? <button type="button" disabled={busy} onClick={() => void retry()}>Thử lại</button> : null}
        {workspace.transition.canCancel ? (
          <button type="button" disabled={busy} onClick={() => void cancelTransition()}>Hủy</button>
        ) : null}
      </div>
    ) : null}
    {error || workspace.error ? <p className="practice-brief-error" role="alert">{error || workspace.error}</p> : null}
  </>
  return (
    <main className={'practice-brief-overlay practice-workflow' + (introduction ? ' has-clear-introduction' : '') + (planningPractice ? ' has-planning-guide' : '') + (setupPractice ? ' has-screenshot-guide' : '')}>
      <header className="practice-brief-header">
        {planningPractice ? <div className="planning-context"><strong>Module 2</strong> / Practice</div> : null}
        <button type="button" aria-label="Đóng trang Practice" onClick={onClose}>{planningPractice ? '← Trang trước' : '×'}</button>
        {setupPractice && introduction ? (
          <div className="practice-module-context"><small>Module 1</small><span aria-hidden="true">/</span><h1 id="practiceObjective">{introduction.title}</h1></div>
        ) : planningPractice ? null : <>
          <div><small>Practice</small><strong>{workspace.title}</strong></div>
          <span aria-hidden="true">◆</span>
        </>}
      </header>

      <section className="practice-brief-card" aria-labelledby="practiceObjective">
        {firstBuild ? <>
          <h1 id="practiceObjective">Tạo bản portfolio đầu tiên</h1>
          <p>Tiếp tục task Codex từ Module 2. Dán hướng dẫn vào task để agent xây website theo kế hoạch đã duyệt và gửi bạn đường dẫn.</p>
          {controls}
        </> : planningPractice && introduction ? (
          <PortfolioPlanningGuide introduction={introduction} controls={controls} />
        ) : introduction ? (
          <PracticeIntroduction introduction={introduction} showReference={!hasRequestedPractice} imageFirst={setupPractice}>
            {setupPractice && !hasRequestedPractice ? <TeacherOrientation /> : null}
            {setupPractice ? <PracticeScreenshotGuide key={courseRunId}>{controls}</PracticeScreenshotGuide> : controls}
          </PracticeIntroduction>
        ) : <>
        <small>Mục tiêu / kết quả</small>
        <h1 id="practiceObjective">{workspace.title}</h1>
        <p>{workspace.objective}</p>
        <p>{workspace.expectedOutcome}</p>
        {controls}
        </>}
        {!planningPractice && <PracticeStartPrompt practiceId={identity.practiceId} prompt={startPrompt} title={workspace.title} />}
      </section>

      {!firstBuild && (!introduction || hasRequestedPractice) ? <PracticeProgress
        workspace={workspace}
        showObjective={false}
        api={window.courseCompanion}
        onWorkspaceChange={setWorkspace}
        onBusyChange={setBusy}
        actionBusy={busy}
        returnBusy={returnBusy}
        returnDisabled={busy}
        onReturn={() => {
          if (busy || !window.courseCompanion) return
          setBusy(true)
          setReturnBusy(true)
          void window.courseCompanion.returnPassedPractice().then(() => {
            onClose()
          }).catch(() => setError('Không thể quay lại khóa học. Hãy làm mới gói và thử lại.')).finally(() => {
            setBusy(false)
            setReturnBusy(false)
          })
        }}
        onPortfolioStageAction={courseRunId ? (stageId, decision, sliceId) => void recordPortfolioStage(stageId, decision, sliceId) : undefined}
        onRefresh={() => void load()}
      /> : null}

      {switchOpen ? (
        <PracticeSwitchDialog
          busy={busy}
          continuesTask={identity.practiceId === 'm3-portfolio-build' || identity.practiceId === 'm4-portfolio-release'}
          onFresh={() => void start()}
          onCancel={() => setSwitchOpen(false)}
        />
      ) : null}
    </main>
  )
}
