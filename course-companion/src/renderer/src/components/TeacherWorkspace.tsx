import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import type {
  CompanionState,
  PracticeScenario,
  PracticeHint,
  PlanningPracticeActionRequest,
  PracticeState,
  PracticeWorkspaceView,
  TeacherContext,
  TeacherMessage,
  TeacherRuntimeView,
  TeacherSendRequest,
  TeacherSendResult
} from '../../../../shared/contracts'
import teacherImage from '../assets/teacher-triet.png'
import { PracticeProgress } from './PracticeProgress'
import { PracticeVideoGuide } from './PracticeVideoGuide'
import { practiceGuideAnchor } from './practice-guide-anchors'
import { PracticeReturnAction } from './PracticeReturnAction'
import { PracticeTaskLink } from './PracticeTaskLink'
import { PracticeStartPrompt } from './PracticeStartPrompt'
import { PracticeReviewElapsed } from './PracticeReviewElapsed'
import { TeacherMarkdown } from './TeacherMarkdown'

type TeacherWorkspaceProps = {
  embedded?: boolean
  visible?: boolean
  onClose: () => void
  onExpand?: () => void
}

function previewReply(request: TeacherSendRequest): TeacherSendResult {
  const timestamp = new Date().toISOString()
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return {
    learnerMessage: {
      id: `preview-learner-${suffix}`,
      role: 'learner',
      source: 'learner',
      content: request.content.trim(),
      timestamp,
      checkpointId: request.context?.checkpointId
    },
    teacherMessage: {
      id: `preview-teacher-${suffix}`,
      role: 'teacher',
      source: 'fixture',
      content: 'Đây là phản hồi luyện tập. Khi bạn dùng Course Companion, câu hỏi và phản hồi sẽ được lưu trên máy để bạn có thể quay lại.',
      timestamp,
      checkpointId: request.context?.checkpointId
    }
  }
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const emptyPractice: PracticeState = {
  missionId: 'm2-planning-package',
  status: 'idle'
}

const practiceLabels: Record<PracticeState['status'], { eyebrow: string; title: string }> = {
  idle: { eyebrow: 'Chưa bắt đầu', title: 'Chờ một lượt thực hành' },
  active: { eyebrow: 'Đang thực hiện', title: 'Bài luyện tập đang diễn ra' },
  approval_required: { eyebrow: 'Cần phê duyệt', title: 'Kế hoạch đang chờ bạn' },
  completed: { eyebrow: 'Đã hoàn thành', title: 'Có bằng chứng mới để duyệt' },
  stale: { eyebrow: 'Bằng chứng cũ', title: 'Chưa đủ để kết luận' },
  offline: { eyebrow: 'Mất kết nối', title: 'Không có sự kiện mới' },
  error: { eyebrow: 'Lượt chạy lỗi', title: 'Chưa tạo được bằng chứng' }
}

const scenarioControls: Array<{ scenario: PracticeScenario; label: string }> = [
  { scenario: 'started', label: 'Bắt đầu' },
  { scenario: 'approval_required', label: 'Cần phê duyệt' },
  { scenario: 'success', label: 'Hoàn thành' },
  { scenario: 'stale', label: 'Bằng chứng cũ' },
  { scenario: 'offline', label: 'Mất kết nối' },
  { scenario: 'error', label: 'Lỗi' }
]

const TEACHER_DRAFT_KEY = 'course-companion:teacher-draft'

function loadTeacherDraft(): string {
  try {
    return window.localStorage.getItem(TEACHER_DRAFT_KEY) ?? ''
  } catch {
    return ''
  }
}

export function TeacherWorkspace({
  embedded = false,
  visible = true,
  onClose,
  onExpand
}: TeacherWorkspaceProps) {
  const [messages, setMessages] = useState<TeacherMessage[]>([])
  const [teacherRuntime, setTeacherRuntime] = useState<TeacherRuntimeView>({
    connection: window.courseCompanion ? 'connecting' : 'simulated',
    memory: 'ready',
    contextFreshness: 'unavailable'
  })
  const [context, setContext] = useState<TeacherContext | undefined>()
  const [draft, setDraft] = useState(loadTeacherDraft)
  const [busy, setBusy] = useState(false)
  const sendingRef = useRef(false)
  const [pendingMessage, setPendingMessage] = useState<TeacherMessage | null>(null)
  const [recovered, setRecovered] = useState(false)
  const [error, setError] = useState('')
  const [practice, setPractice] = useState<PracticeState>(emptyPractice)
  const [workspace, setWorkspace] = useState<PracticeWorkspaceView | null>(null)
  const activeTab = workspace?.activePractice
    ? (embedded ? workspace.presentation.fullPanel : workspace.presentation.compactPanel)
    : 'teacher'
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false)
  const [workspaceRefreshing, setWorkspaceRefreshing] = useState(false)
  const [workspaceUnavailable, setWorkspaceUnavailable] = useState(false)
  const [videoOpen, setVideoOpen] = useState(false)
  const [practiceBusy, setPracticeBusy] = useState(false)
  const [reviewBusy, setReviewBusy] = useState(false)
  const [hintBusy, setHintBusy] = useState(false)
  const [hint, setHint] = useState<PracticeHint | null>(null)
  const [hintError, setHintError] = useState('')
  const [returnBusy, setReturnBusy] = useState(false)
  const [planningActionBusy, setPlanningActionBusy] = useState(false)
  const [testFixturesEnabled, setTestFixturesEnabled] = useState(false)
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const messageEndRef = useRef<HTMLDivElement>(null)
  const practiceRef = useRef<HTMLElement>(null)
  const hintResultRef = useRef<HTMLElement>(null)
  const hintErrorRef = useRef<HTMLDivElement>(null)
  const hintButtonRef = useRef<HTMLButtonElement>(null)
  const presentedReview = useRef<string | null>(null)
  const displayedChat = useRef<{ messages: TeacherMessage[]; pendingMessage: TeacherMessage | null; busy: boolean } | null>(null)
  const workspaceIdentity = useRef<string | null>(null)
  const applyWorkspace = useCallback((next: PracticeWorkspaceView | null) => {
    const identity = next?.activePractice
      ? `${next.activePractice.runId}:${next.activePractice.generation}` : null
    if (workspaceIdentity.current !== identity) {
      setHint(null)
      setHintError('')
      setVideoOpen(false)
      setReturnBusy(false)
      workspaceIdentity.current = identity
    }
    setWorkspace(next)
  }, [])

  useEffect(() => {
    if (!visible || (!hint && !hintError)) return
    const result = hint ? hintResultRef.current : hintErrorRef.current
    if (!result) return
    result.focus({ preventScroll: true })
    result.scrollIntoView({ block: 'start', behavior: 'instant' })
  }, [hint, hintError, visible])

  const reviewResult = workspace?.review?.result
  const reviewPresentationKey = workspace?.activePractice && reviewResult
    ? `${workspace.activePractice.runId}:${workspace.activePractice.generation}:${reviewResult.reviewedAt}:${reviewResult.sourceDigest}`
    : null
  useEffect(() => {
    if (!visible || reviewBusy || !workspaceLoaded) return
    if (presentedReview.current === reviewPresentationKey) return
    if (!reviewPresentationKey) {
      presentedReview.current = null
      return
    }
    const result = practiceRef.current?.querySelector<HTMLElement>('.practice-success, .practice-review-result')
    if (!result) return
    presentedReview.current = reviewPresentationKey
    result.focus({ preventScroll: true })
    result.scrollIntoView({ block: 'start', behavior: 'instant' })
  }, [reviewPresentationKey, reviewBusy, visible, workspaceLoaded])

  useEffect(() => {
    if (!embedded || !window.courseCompanion) return
    void window.courseCompanion.setFullTeacherVisible(true)
    return () => { void window.courseCompanion?.setFullTeacherVisible(false) }
  }, [embedded])

  useEffect(() => {
    if (hint && practiceRef.current) practiceRef.current.scrollTop = 0
  }, [hint])

  const refreshContext = useCallback(async () => {
    const progressResult = await window.courseCompanion?.loadProgress()
    if (progressResult?.status === 'returning' || progressResult?.status === 'recovered') {
      setContext({
        lessonId: progressResult.progress.currentLessonId,
        checkpointId: progressResult.progress.checkpointId,
        sceneId: progressResult.progress.sceneId
      })
    } else {
      setContext(undefined)
    }
  }, [])

  useEffect(() => {
    if (!visible) return
    let cancelled = false
    const load = async () => {
      setWorkspaceRefreshing(true)
      try {
        const state: CompanionState = window.courseCompanion
          ? await window.courseCompanion.loadCompanionState()
          : { mode: 'compact', conversation: { messages: [], recovered: false }, teacher: { connection: 'simulated', memory: 'ready' } }
        if (cancelled) return
        const loadedWorkspace = await window.courseCompanion?.loadPracticeWorkspace()
        if (cancelled) return
        const runtime = await window.courseCompanion?.getRuntimeInfo()
        if (cancelled) return
        setMessages((current) => JSON.stringify(current) === JSON.stringify(state.conversation.messages)
          ? current : state.conversation.messages)
        setRecovered(state.conversation.recovered)
        setTeacherRuntime(state.teacher)
        applyWorkspace(loadedWorkspace ?? null)
        setWorkspaceUnavailable(false)
        setTestFixturesEnabled(runtime?.testFixturesEnabled === true)
        setPractice(
          window.courseCompanion
            ? await window.courseCompanion.loadPracticeState()
            : emptyPractice
        )
        await refreshContext()
        if (!cancelled) setWorkspaceLoaded(true)
      } catch {
        if (cancelled) return
        setWorkspaceUnavailable(true)
        setWorkspaceLoaded(true)
        setError('Không thể xác minh trạng thái Practice. Triết tạm khóa tương tác để tránh dùng sai chế độ.')
      } finally {
        if (!cancelled) setWorkspaceRefreshing(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [embedded, visible, applyWorkspace, refreshContext])

  useEffect(() => {
    if (!visible || returnBusy || !window.courseCompanion) return
    return window.courseCompanion.onPracticeWorkspaceChanged(() => {
      void (async () => {
        try {
          const next = await window.courseCompanion?.loadPracticeWorkspace()
          if (next) {
            applyWorkspace(next)
            setWorkspaceUnavailable(false)
          }
        } catch {
          setError('Không thể đồng bộ tiến độ Practice mới nhất. Kết quả đã lưu vẫn được giữ nguyên.')
        }
      })()
    })
  }, [visible, returnBusy, applyWorkspace])

  useEffect(() => {
    if (!visible || activeTab !== 'teacher' || busy) return
    const frame = requestAnimationFrame(() => composerRef.current?.focus({ preventScroll: true }))
    return () => cancelAnimationFrame(frame)
  }, [activeTab, busy, visible])

  useEffect(() => {
    try {
      window.localStorage.setItem(TEACHER_DRAFT_KEY, draft)
    } catch {
      // Draft persistence is best-effort; the in-memory draft remains available.
    }
  }, [draft])
  useEffect(() => {
    const syncDraft = (event: StorageEvent) => {
      if (event.key === TEACHER_DRAFT_KEY) setDraft(event.newValue ?? '')
    }
    window.addEventListener('storage', syncDraft)
    return () => window.removeEventListener('storage', syncDraft)
  }, [])



  useEffect(() => {
    if (!visible || activeTab !== 'teacher') return
    const previous = displayedChat.current
    if (previous?.messages === messages && previous.pendingMessage === pendingMessage && previous.busy === busy) return
    displayedChat.current = { messages, pendingMessage, busy }

    const frame = requestAnimationFrame(() => {
      const chatLog = messageEndRef.current?.parentElement
      if (chatLog) chatLog.scrollTop = chatLog.scrollHeight
    })

    return () => cancelAnimationFrame(frame)
  }, [visible, activeTab, messages, pendingMessage, busy])

  const emitPracticeFixture = async (scenario: PracticeScenario) => {
    if (practiceBusy) return
    setPracticeBusy(true)
    setError('')
    try {
      const next = window.courseCompanion
        ? await window.courseCompanion.emitPracticeFixture({ scenario })
        : emptyPractice
      setPractice(next)
      requestAnimationFrame(() => practiceRef.current?.scrollTo({ top: 0 }))
    } catch {
      setError('Không thể lưu tình huống luyện tập. Hãy mở bài học trước khi thử lại.')
    } finally {
      setPracticeBusy(false)
    }
  }

  const reviewProgress = async () => {
    if (workspaceRefreshing || reviewBusy || hintBusy || !window.courseCompanion) return
    setReviewBusy(true)
    setError('')
    try {
      if (workspace?.portfolioPackage && workspace.activePractice) {
        const refreshed = await window.courseCompanion.loadPracticeWorkspace()
        applyWorkspace(refreshed)
        if (refreshed.error) {
          setError(refreshed.error)
          return
        }
        if (refreshed.activePractice?.runId !== workspace.activePractice.runId
          || refreshed.activePractice.generation !== workspace.activePractice.generation) return
        if (refreshed.portfolioPackage?.ready && !refreshed.portfolioPackage.approved) {
          requestAnimationFrame(() => {
            practiceRef.current?.querySelector<HTMLInputElement>('.practice-package-approval input')?.focus()
          })
          return
        }
      }
      const reviewed = await window.courseCompanion.reviewPractice()
      if ('error' in reviewed) {
        setError(reviewed.error.message)
        return
      }
      applyWorkspace(reviewed.workspace)
      practiceRef.current?.scrollTo({ top: 0 })
    } catch {
      setError('Kh\u00f4ng th\u1ec3 duy\u1ec7t ti\u1ebfn \u0111\u1ed9 Practice. H\u00e3y th\u1eed l\u1ea1i.')
    } finally {
      setReviewBusy(false)
    }
  }

  const requestHint = async () => {
    const active = workspace?.activePractice
    if (!active || workspaceRefreshing || hintBusy || reviewBusy || returnBusy || !window.courseCompanion) return
    setHintBusy(true)
    setHint(null)
    setHintError('')
    try {
      const response = await window.courseCompanion.requestPracticeHint({ runId: active.runId, generation: active.generation })
      if ('error' in response) setHintError(response.error.message)
      else setHint(response.hint)
    } catch {
      setHintError('Triết tạm thời chưa thể đưa gợi ý. Hãy thử lại.')
    } finally {
      setHintBusy(false)
    }
  }

  const refreshPracticeWorkspace = async () => {
    if (planningActionBusy || !window.courseCompanion) return
    setPlanningActionBusy(true)
    setError('')
    try {
      applyWorkspace(await window.courseCompanion.loadPracticeWorkspace())
    } catch {
      setError('Không thể làm mới bằng chứng Practice. Hãy thử lại.')
    } finally {
      setPlanningActionBusy(false)
    }
  }

  const recordPlanningAction = async (action: PlanningPracticeActionRequest['action']) => {
    const active = workspace?.activePractice
    if (!active || planningActionBusy || !window.courseCompanion) return
    setPlanningActionBusy(true)
    setError('')
    try {
      applyWorkspace(await window.courseCompanion.recordPlanningAction({
        practiceId: active.practiceId,
        practiceVersion: active.practiceVersion,
        runId: active.runId,
        generation: active.generation,
        action
      }))
    } catch {
      setError('Bằng chứng đã thay đổi hoặc chưa đủ cho xác nhận này. Hãy làm mới tiến độ rồi thử lại.')
    } finally {
      setPlanningActionBusy(false)
    }
  }

  const returnToCourse = async () => {
    if (workspaceRefreshing || returnBusy || reviewBusy || hintBusy || !window.courseCompanion) return
    setReturnBusy(true)
    setError('')
    try {
      await window.courseCompanion.returnPassedPractice()
    } catch {
      setError('Kh\u00f4ng th\u1ec3 quay l\u1ea1i kh\u00f3a h\u1ecdc. K\u1ebft qu\u1ea3 \u0111\u1ea1t v\u1eabn \u0111\u01b0\u1ee3c l\u01b0u; h\u00e3y th\u1eed l\u1ea1i.')
      setReturnBusy(false)
    }
  }

  const sendMessage = async (retryMessage?: TeacherMessage) => {
    const content = (retryMessage?.content ?? draft).trim()
    if (!content || sendingRef.current) return

    sendingRef.current = true
    const optimisticMessage: TeacherMessage = {
      id: retryMessage?.id ?? `pending-${crypto.randomUUID()}`,
      role: 'learner',
      source: 'learner',
      content,
      timestamp: new Date().toISOString(),
      checkpointId: context?.checkpointId,
      deliveryStatus: 'pending'
    }
    const knownIds = new Set(messages.map((message) => message.id))
    setPendingMessage(optimisticMessage)
    if (!retryMessage) setDraft('')
    setBusy(true)
    setError('')
    setTeacherRuntime((current) => ({ ...current, error: undefined }))
    try {
      const request: TeacherSendRequest = { content }
      const result = window.courseCompanion
        ? await window.courseCompanion.sendTeacherMessage(request)
        : previewReply(request)
      // Show the confirmed reply even if refreshing other companion state fails.
      setMessages((current) => [
        ...current.filter((message) => message.id !== optimisticMessage.id
          && message.id !== result.learnerMessage.id && message.id !== result.teacherMessage.id),
        result.learnerMessage,
        result.teacherMessage
      ])
      setPendingMessage(null)
      if (window.courseCompanion) {
        try {
          const state = await window.courseCompanion.loadCompanionState()
          setMessages(state.conversation.messages)
          setRecovered(state.conversation.recovered)
          setTeacherRuntime(state.teacher)
        } catch {
          // The send result already contains both confirmed messages.
        }
      }
    } catch {
      let runtimeError = ''
      let recoveredMessages = messages
      if (window.courseCompanion) {
        try {
          const state = await window.courseCompanion.loadCompanionState()
          recoveredMessages = state.conversation.messages
          setRecovered(state.conversation.recovered)
          setTeacherRuntime(state.teacher)
          runtimeError = state.teacher.error ?? ''
        } catch {
          // Keep the existing view if the local state cannot be reloaded.
        }
      }
      const savedAttempt = recoveredMessages.find((message) => message.role === 'learner'
        && message.content === content
        && (message.id === retryMessage?.id || !knownIds.has(message.id)))
      setMessages(savedAttempt ? recoveredMessages : [
        ...recoveredMessages.filter((message) => message.id !== optimisticMessage.id),
        { ...optimisticMessage, deliveryStatus: 'failed' }
      ])
      if (!runtimeError) {
        setError('Không thể kết nối Triết. Tin nhắn đã được lưu để bạn thử lại.')
      }
    } finally {
      setPendingMessage(null)
      sendingRef.current = false
      setBusy(false)
    }
  }

  const visibleMessages = pendingMessage
    ? [...messages.filter((message) => message.id !== pendingMessage.id), pendingMessage]
    : messages

  const submit = (event: FormEvent) => {
    event.preventDefault()
    void sendMessage()
  }

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      void sendMessage()
    }
  }

  const teacherStatus: Record<TeacherRuntimeView['connection'], { label: string; strong: string; detail: string }> = {
    simulated: {
      label: 'TEACHER \u00b7 M\u00d4 PH\u1eceNG',
      strong: 'TEACHER M\u00d4 PH\u1eceNG',
      detail: 'Ph\u1ea3n h\u1ed3i hi\u1ec7n t\u1ea1i d\u00f9ng k\u1ecbch b\u1ea3n c\u1ee5c b\u1ed9.'
    },
    connecting: {
      label: 'TEACHER · ĐANG KẾT NỐI',
      strong: 'ĐANG KẾT NỐI TRIẾT',
      detail: 'Đang khôi phục ngữ cảnh Practice.'
    },
    ready: {
      label: 'TEACHER · SẴN SÀNG',
      strong: 'TRIẾT ĐÃ SẴN SÀNG',
      detail: 'Đã kết nối. Triết sẽ nhận ngữ cảnh Practice khi bạn gửi tin nhắn.'
    },
    live: {
      label: 'TEACHER · LIVE',
      strong: 'TRIẾT ĐANG TRỰC TUYẾN',
      detail: 'Triết đang dùng ngữ cảnh Practice và hoạt động Codex hiện tại.'
    },
    stale: {
      label: 'TEACHER \u00b7 NG\u1eee C\u1ea2NH C\u0168',
      strong: 'NG\u1eee C\u1ea2NH CODEX \u0110\u00c3 C\u0168',
      detail: 'Triết vẫn có thể trả lời, nhưng hoạt động Codex mới nhất chưa được xác nhận.'
    },
    offline: {
      label: 'TEACHER \u00b7 NGO\u1ea0I TUY\u1ebeN',
      strong: 'KHÔNG THỂ KẾT NỐI TRIẾT',
      detail: 'Tin nh\u1eafn s\u1ebd \u0111\u01b0\u1ee3c l\u01b0u c\u1ee5c b\u1ed9 \u0111\u1ec3 b\u1ea1n th\u1eed l\u1ea1i.'
    }
  }
  const currentTeacherStatus = teacherStatus[teacherRuntime.connection]
  const practiceMode = Boolean(workspace?.activePractice)
  const compactPractice = practiceMode && !embedded
  const practicePassed = workspace?.review?.status === 'passed' && workspace.review.canReturn
  const contextFreshnessNote = teacherRuntime.contextFreshness === 'stale'
    ? 'Ngữ cảnh Codex đã cũ.'
    : teacherRuntime.contextFreshness === 'disconnected'
      ? 'Mất kết nối với ngữ cảnh Codex; Triết vẫn có thể trả lời từ dữ liệu đã lưu.'
      : ''
  const teacherStatusDetail = teacherRuntime.error ?? [
    currentTeacherStatus.detail,
    contextFreshnessNote,
    teacherRuntime.memory === 'pending' ? 'Trí nhớ lượt trước đang chờ tinh chỉnh.' : ''
  ].filter(Boolean).join(' · ')

  return (
    <section hidden={!visible} className={`pixel-teacher-panel${embedded ? ' is-embedded' : ''}${practiceMode ? ' is-practice-review practice-workflow' : ''}`} aria-label={practiceMode ? 'Duyệt Practice với Triết' : 'Triết, giáo viên đồng hành'}>
      <header>
        <div className="pixel-teacher-identity">
          <span className="pixel-teacher-portrait-frame" aria-hidden="true">
            <img src={teacherImage} alt="" />
          </span>
          <div>
            <small>{practiceMode ? 'Triết · Duyệt Practice' : currentTeacherStatus.label}</small>
            <strong>{practiceMode ? 'Duyệt Practice' : 'Triết'}</strong>
          </div>
        </div>
        <div className="pixel-panel-controls">
          {workspace?.review?.canReturn ? (
            <PracticeReturnAction
              busy={returnBusy}
              disabled={workspaceRefreshing || reviewBusy || hintBusy}
              quick
              onReturn={() => void returnToCourse()}
            />
          ) : null}
          {!embedded && onExpand ? (
            <button
              className="pixel-panel-control"
              type="button"
              aria-label="Mở Triết toàn màn hình"
              title="Mở toàn màn hình"
              onClick={onExpand}
            >
              {practiceMode ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4" /></svg> : <span aria-hidden="true">⛶</span>}
            </button>
          ) : null}
          <button
            className="pixel-panel-control"
            type="button"
            aria-label={embedded ? 'Đóng Triết' : 'Thu nhỏ Triết'}
            title={embedded ? 'Đóng Triết' : 'Thu nhỏ thành bong bóng'}
            onClick={onClose}
          >
            {practiceMode ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d={embedded ? 'm6 6 12 12M6 18 18 6' : 'M5 12h14'} /></svg> : embedded ? '×' : '—'}
          </button>
        </div>
      </header>

      {workspaceLoaded && !workspaceUnavailable && !practiceMode ? <div className={`pixel-fixture-notice is-${teacherRuntime.connection}`} role={teacherRuntime.error ? 'alert' : 'status'} aria-live="polite">
        <strong>{currentTeacherStatus.strong}</strong>
        <span>{teacherStatusDetail}</span>
      </div> : null}

      {!compactPractice ? <div className="pixel-chat-context">
        <span>{practiceMode ? 'Bước học hiện tại' : 'BƯỚC HỌC HIỆN TẠI'}</span>
        <strong>
          {workspace?.activePractice
            ? workspace.title
            : context ? 'Bước hiện tại trong khóa học' : 'Chưa bắt đầu bài học'}
        </strong>
      </div> : null}

      {!workspaceLoaded ? (
        <div className="pixel-practice-status" role="status">Đang tải không gian của Triết…</div>
      ) : workspaceUnavailable ? (
        <div className="pixel-practice-status is-error" role="alert">
          <strong>Chưa thể xác minh chế độ</strong>
          <p>Triết tạm khóa chat và duyệt tiến độ. Hãy đóng rồi mở lại cửa sổ này.</p>
        </div>
      ) : practiceMode ? (
        <section className="pixel-practice-review" aria-label="Duyệt tiến độ Practice">
          <div {...practiceGuideAnchor('review-progress')} className={'pixel-practice-review__primary practice-review-overview' + (practicePassed ? ' is-complete' : '')}>
            {workspace?.activePractice ? <PracticeTaskLink
              key={`${workspace.activePractice.runId}:${workspace.activePractice.generation}`}
              task={{ runId: workspace.activePractice.runId, generation: workspace.activePractice.generation }}
              api={window.courseCompanion}
              disabled={workspace.phase === 'switching' || returnBusy}
            /> : null}
            {!compactPractice ? <div role="status" aria-live="polite">
              <small>Trạng thái hiện tại</small>
              <strong>{workspace?.review?.status === 'passed'
                ? 'Tiến độ đã đạt yêu cầu'
                : workspace?.review?.status === 'needs-work'
                  ? 'Có mục cần bổ sung'
                  : 'Sẵn sàng đối chiếu tiến độ'}</strong>
              {!compactPractice ? <p>Triết sẽ cập nhật bằng chứng từ đúng task Codex rồi duyệt tiến độ hiện tại.</p> : null}
            </div> : null}
            {workspace?.review?.canReview ? (
              <button
                className={'pixel-review-primary' + (reviewBusy ? ' is-busy' : '')}
                type="button"
                aria-label="Cập nhật và kiểm tra tiến độ Practice"
                aria-busy={reviewBusy}
                disabled={workspaceRefreshing || reviewBusy || hintBusy || returnBusy}
                onClick={() => void reviewProgress()}
              >
                {reviewBusy ? <span className="pixel-review-spinner" aria-hidden="true" /> : null}
                {reviewBusy ? 'Đang cập nhật và kiểm tra…' : 'Cập nhật và kiểm tra tiến độ'}
                {reviewBusy ? <PracticeReviewElapsed /> : null}
              </button>
            ) : null}
            <button
              className="practice-hint-button"
              ref={hintButtonRef}
              type="button"
              aria-label="Cần gợi ý cho Practice?"
              aria-busy={hintBusy}
              disabled={workspaceRefreshing || hintBusy || reviewBusy || returnBusy || planningActionBusy}
              onClick={() => void requestHint()}
            >
              {hintBusy ? <span className="pixel-chat-thinking-dots" aria-hidden="true"><i /><i /><i /></span> : null}
              {hintBusy ? 'Triết đang xem tiến độ…' : 'Cần gợi ý?'}
            </button>
          </div>
          <section className="pixel-practice" aria-live="polite" ref={practiceRef}>
          {hint && hint.runId === workspace?.activePractice?.runId
            && hint.generation === workspace.activePractice.generation ? (
            <aside className="practice-hint" ref={hintResultRef} tabIndex={-1} aria-label="Gợi ý của Triết" role="status" aria-live="polite">
              <div className="practice-hint-heading">
                <strong>{hint.source === 'fixture' ? 'Gợi ý mô phỏng' : 'Gợi ý của Triết'}</strong>
                <button type="button" aria-label="Đóng gợi ý" onClick={() => {
                  setHint(null)
                  hintButtonRef.current?.focus({ preventScroll: true })
                }}>Đóng</button>
              </div>
              <p>{hint.content}</p>
              <small>Mình xem tiến độ của bạn lúc {formatTime(hint.observedAt)}. Bạn thử bước này trong task Codex nhé; nếu còn vướng, mình sẽ gợi ý tiếp.</small>
            </aside>
          ) : null}
          {hintError ? <div className="pixel-chat-warning practice-hint-error" ref={hintErrorRef} tabIndex={-1} role="alert">{hintError}</div> : null}
          {workspace?.activePractice ? <PracticeStartPrompt
            key={`${workspace.activePractice.runId}:${workspace.activePractice.generation}`}
            practiceId={workspace.activePractice.practiceId}
            prompt={workspace.startPrompt}
            title={workspace.title}
          /> : null}
          {workspace?.activePractice?.practiceId === 'm1-codex-safe-setup' ? (
            <details key={`${workspace.activePractice.runId}:${workspace.activePractice.generation}`} className="practice-video-replay" onToggle={(event) => setVideoOpen(event.currentTarget.open)}>
              <summary>Xem lại video hướng dẫn Practice</summary>
              {videoOpen && visible ? <PracticeVideoGuide /> : null}
            </details>
          ) : null}
          {error || workspace?.error ? <div className="pixel-chat-warning" role="alert">{error || workspace?.error} Kết quả gần nhất vẫn được giữ nguyên.</div> : null}
            {workspace ? (
              <PracticeProgress
                workspace={workspace}
                api={window.courseCompanion}
                onWorkspaceChange={applyWorkspace}
                onBusyChange={setReviewBusy}
                compact={!embedded}
                returnBusy={returnBusy}
                returnDisabled={workspaceRefreshing || reviewBusy || hintBusy}
                actionBusy={workspaceRefreshing || planningActionBusy || hintBusy}
                onPlanningAction={(action) => void recordPlanningAction(action)}
                onRefresh={() => void refreshPracticeWorkspace()}
                onReturn={() => void returnToCourse()}
              />
            ) : null}
          </section>
        </section>
      ) : activeTab === 'teacher' ? (
        <>
          {workspace?.planning?.invalidations[0] ? (
            <aside className="pixel-teacher-invalidation" role="status" aria-live="polite">
              <small>TRIẾT · BẰNG CHỨNG VỪA THAY ĐỔI</small>
              <strong>{workspace.planning.invalidations[0].changedInput}</strong>
              <p>{workspace.planning.invalidations[0].reason}</p>
              <span>
                Bước cần xem lại: {workspace.planning.invalidations[0].affectedStepIds.map((stepId) =>
                  workspace.checklist.find((step) => step.id === stepId)?.title ?? 'Bước cần xem lại'
                ).join(', ')}
              </span>
              <b>Tiếp theo: {workspace.planning.invalidations[0].nextAction}</b>
            </aside>
          ) : null}
          <div className="pixel-chat-log" role="log" aria-live="polite" aria-label="Lịch sử trò chuyện với Triết">
            {visibleMessages.length === 0 ? (
              <div className="pixel-chat-empty">
                <strong>Chưa có tin nhắn</strong>
                <span>Hỏi Triết điều bạn cần làm rõ ở bước học này.</span>
              </div>
            ) : (
              visibleMessages.map((message) => (
                <article className={`pixel-chat-message is-${message.role}`} key={message.id}>
                  <header>
                    <strong>{message.role === 'teacher' ? 'Triết' : 'Bạn'}</strong>
                    {message.source === 'fixture' ? <span>MÔ PHỎNG</span> : null}
                    {message.source === 'live' ? <span>LIVE</span> : null}
                    {message.deliveryStatus === 'failed' ? <span>CHƯA GỬI</span> : null}
                    <time dateTime={message.timestamp}>{formatTime(message.timestamp)}</time>
                  </header>
                  {message.deliveryStatus === 'failed' ? (
                    <button className="pixel-chat-retry" disabled={busy} onClick={() => void sendMessage(message)} type="button">
                      Thử lại
                    </button>
                  ) : null}
                  {message.role === 'teacher' ? <TeacherMarkdown content={message.content} /> : <p>{message.content}</p>}
                </article>
              ))
            )}
            {pendingMessage ? (
              <div className="pixel-chat-thinking" role="status">
                <span className="pixel-chat-thinking-dots" aria-hidden="true"><i /><i /><i /></span>
                <span>Triết đang suy nghĩ…</span>
              </div>
            ) : null}
            <div ref={messageEndRef} />
          </div>

          {recovered ? <div className="pixel-chat-warning">Một dòng lịch sử hỏng đã được bỏ qua.</div> : null}

          <form className="pixel-chat-composer" onSubmit={submit}>
            <textarea
              autoComplete="off"
              disabled={busy}
              ref={composerRef}
              aria-label="Nhắn cho Triết"
              maxLength={2000}
              name="teacherMessage"
              placeholder="Hỏi Triết về bước hiện tại…"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleComposerKeyDown}
            />
            <div>
              <small>Enter để gửi · Shift+Enter xuống dòng</small>
              <button type="submit" disabled={busy || draft.trim().length === 0}>
                {busy ? 'ĐANG GỬI…' : 'GỬI'}
              </button>
            </div>
          </form>
        </>
      ) : (
        <section className="pixel-practice" aria-live="polite" ref={practiceRef}>
          {workspace ? (
            <PracticeProgress
              workspace={workspace}
              api={window.courseCompanion}
              onWorkspaceChange={applyWorkspace}
              onBusyChange={setReviewBusy}
              compact={!embedded}
              returnBusy={returnBusy}
              actionBusy={workspaceRefreshing || planningActionBusy}
              onPlanningAction={(action) => void recordPlanningAction(action)}
              onRefresh={() => void refreshPracticeWorkspace()}
              onReturn={() => void returnToCourse()}
            />
          ) : (
            <div className="pixel-practice-status"><strong>Đang đọc tiến độ Practice…</strong></div>
          )}

          {testFixturesEnabled ? <details className="pixel-practice-fixture-evidence">
            <summary>DEV · BẰNG CHỨNG MÔ PHỎNG</summary>
            <div className={`pixel-practice-status is-${practice.status}`}>
              <span>{practiceLabels[practice.status].eyebrow} · MÔ PHỎNG</span>
              <strong>{practiceLabels[practice.status].title}</strong>
            </div>
            <p>{practice.latestEvent?.summary ?? 'Mở điều khiển dành cho nhà phát triển để phát một sự kiện cục bộ.'}</p>
            {practice.latestEvent ? <small>FIXTURE · {formatTime(practice.latestEvent.timestamp)} · {practice.latestEvent.correlationId}</small> : null}

            {practice.latestEvent?.evidence ? (
              <div className="pixel-practice-evidence">
                <div><span>PRD</span><strong>{practice.latestEvent.evidence.prdArtifact}</strong></div>
                <div><span>IMPLEMENTATION PLAN</span><strong>{practice.latestEvent.evidence.implementationPlanArtifact}</strong></div>
                <div><span>ALIGNMENT</span><strong>{practice.latestEvent.evidence.alignment}</strong></div>
                <small>{practice.latestEvent.evidence.freshness === 'current' ? 'BẰNG CHỨNG MỚI' : 'BẰNG CHỨNG ĐÃ CŨ'} · MÔ PHỎNG</small>
              </div>
            ) : null}

            <p>Các nút dưới đây tạo sự kiện cục bộ; không quan sát Codex thật.</p>
            <div className="pixel-practice-dev-controls">
              {scenarioControls.map((control) => (
                <button disabled={practiceBusy} key={control.scenario} onClick={() => void emitPracticeFixture(control.scenario)} type="button">
                  {control.label}
                </button>
              ))}
            </div>
          </details> : null}
        </section>
      )}

      {workspaceLoaded && !workspaceUnavailable && !practiceMode && error ? <div className="pixel-chat-error" role="alert">{error}</div> : null}
      {!embedded ? <footer>
        <button className="pixel-panel-quit" type="button" onClick={() => void window.courseCompanion?.quitApp()}>Thoát ứng dụng</button>
      </footer> : null}
    </section>
  )
}
