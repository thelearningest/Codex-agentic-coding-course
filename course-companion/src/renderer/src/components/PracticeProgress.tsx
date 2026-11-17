import { setupSettings } from '../../../../shared/setup-settings'
import { useState } from 'react'
import type {
  PlanningPracticeActionRequest,
  PortfolioStageActionRequest,
  PracticePlanningArtifactView,
  PracticeWorkspaceView
} from '../../../../shared/contracts'
import { practiceGuideAnchor } from './practice-guide-anchors'
import { PracticeReturnAction } from './PracticeReturnAction'
import { PortfolioPackageSubmission } from './PortfolioPackageSubmission'
import { PracticeSuccess } from './PracticeSuccess'

type PracticeProgressProps = {
  workspace: PracticeWorkspaceView
  api?: import('../../../../shared/contracts').CourseCompanionApi
  compact?: boolean
  showObjective?: boolean
  returnBusy?: boolean
  returnDisabled?: boolean
  onReturn?: () => void
  actionBusy?: boolean
  onPlanningAction?: (action: PlanningPracticeActionRequest['action']) => void
  onPortfolioStageAction?: (
    stageId: string,
    decision: PortfolioStageActionRequest['decision'],
    sliceId?: PortfolioStageActionRequest['sliceId']
  ) => void
  onRefresh?: () => void
  onWorkspaceChange?: (workspace: PracticeWorkspaceView) => void
  onBusyChange?: (busy: boolean) => void
}

const stepIcon = {
  completed: '✓',
  current: '→',
  pending: '·',
  stale: '!',
  upcoming: '·'
} as const

const artifactLabels = {
  'artifacts/PRD.md': 'PRD.md',
  'artifacts/implementation-plan.md': 'implementation-plan.md'
} as const

const artifactAvailability: Record<PracticePlanningArtifactView['availability'], string> = {
  available: 'Đã có',
  missing: 'Chưa có',
  invalid: 'Không hợp lệ'
}

const artifactApproval: Record<PracticePlanningArtifactView['approval'], string> = {
  approved: 'Đã duyệt',
  pending: 'Chờ duyệt',
  'revision-requested': 'Đã yêu cầu sửa',
  stale: 'Duyệt lại'
}

const portfolioStageLabels: Record<string, string> = {
  'portfolio-brief': 'Bản mô tả ngắn',
  'content-evidence-inventory': 'Nội dung và bằng chứng',
  'visual-reference': 'Tham chiếu hình ảnh',
  'portfolio-prd': 'PRD portfolio',
  'implementation-contract': 'Hợp đồng xây dựng',
  'scaffold-baseline': 'Nền ứng dụng trung tính',
  'complete-first-version': 'Phiên bản đầu tiên',
  'whole-page-revision': 'Cải thiện toàn trang',
  'evidence-debugging': 'Gỡ lỗi có bằng chứng',
  'independent-enhancement': 'Cải tiến độc lập'
}

const buildSliceLabels: Record<string, string> = {
  'foundation-hero': 'Nền trang và Hero',
  'selected-work': 'Selected Work',
  'about-contact-footer': 'About, Contact và footer',
  'responsive-accessibility': 'Responsive và accessibility'
}

const portfolioIssueLabels: Record<string, string> = {
  missing: 'Thiếu tệp',
  empty: 'Tệp trống',
  oversized: 'Tệp quá lớn',
  directory: 'Đường dẫn không phải tệp',
  symlink: 'Không chấp nhận liên kết tắt',
  escaping: 'Đường dẫn ra ngoài workspace',
  'invalid-utf8': 'Nội dung không đọc được',
  placeholder: 'Còn nội dung mẫu',
  'missing-section': 'Thiếu mục bắt buộc',
  'missing-approval': 'Thiếu xác nhận của người học',
  'invalid-evidence-label': 'Nhãn bằng chứng chưa trung thực',
  'privacy-review-incomplete': 'Chưa kiểm tra quyền riêng tư',
  'permission-metadata-missing': 'Thiếu nguồn hoặc quyền sử dụng',
  'missing-reference-screenshot': 'Thiếu ảnh chụp tham chiếu',
  'requirement-coverage': 'Requirement chưa có cách kiểm tra',
  'invalid-plan-boundary': 'Kế hoạch vượt ranh giới',
  'unexpected-workspace-change': 'Có thay đổi ngoài phạm vi'
}

const criterionNextActions: Record<string, string> = {
  'effort-matches': 'Trong task Codex, chọn Effort Medium hoặc High rồi duyệt lại.',
  'speed-matches': 'Trong task Codex, chọn Speed Standard rồi duyệt lại.',
  'approval-matches': 'Trong task Codex, chọn Approve for me rồi duyệt lại.',
  'full-access-off': 'Trong task Codex, tắt Full access rồi duyệt lại.',
  'prd-quality': 'Sửa vấn đề đầu tiên trong PRD rồi phê duyệt lại phiên bản mới.',
  'plan-quality': 'Sửa vấn đề đầu tiên trong implementation plan rồi kiểm tra lại.',
  'artifact-alignment': 'Đối chiếu lại PRD và implementation plan, sau đó xác nhận alignment.',
  'scope-control': 'Khôi phục thay đổi ngoài phạm vi rồi làm mới bằng chứng.',
  'learner-ownership': 'Hoàn tất hành động phê duyệt hoặc quyết định còn thiếu bằng lời của bạn.',
  'evidence-freshness': 'Làm mới bằng chứng từ đúng task Codex rồi duyệt lại.'
}

export function PracticeProgress({
  workspace,
  api,
  compact = false,
  showObjective = true,
  returnBusy = false,
  returnDisabled = false,
  onReturn,
  actionBusy = false,
  onPlanningAction,
  onPortfolioStageAction,
  onRefresh,
  onWorkspaceChange,
  onBusyChange
}: PracticeProgressProps) {
  const packageSubmission = workspace.portfolioPackage ? <PortfolioPackageSubmission
    key={[workspace.activePractice?.runId, workspace.activePractice?.generation, workspace.portfolioPackage.sourceDigest].join(':')}
    workspace={workspace} api={api} disabled={actionBusy || returnBusy || returnDisabled} onWorkspaceChange={onWorkspaceChange} onBusyChange={onBusyChange} onRefresh={onRefresh} /> : null
  const [scopeDraft, setScopeDraft] = useState({ runId: '', value: '' })
  const [expandedCompactStepId, setExpandedCompactStepId] = useState<string | null>(null)
  const reviewStatus = workspace.review?.status
  const practicePassed = reviewStatus === 'passed' && workspace.review?.canReturn
  const reviewResult = workspace.review?.result
  const unresolvedCriterion = reviewResult?.criteria.find((criterion) => criterion.status !== 'satisfied')
  const nextChecklistStep = workspace.checklist.find((step) =>
    step.status === 'current' || step.status === 'stale' || step.status === 'pending')
  const needsPackageSubmission = workspace.portfolioPackage?.ready && !workspace.portfolioPackage.approved
  const packageSubmissionLabel = workspace.portfolioPackage?.kind === 'release'
    ? 'Chấp nhận portfolio trên mạng và nộp bài'
    : workspace.portfolioPackage?.kind === 'build' ? 'Chấp nhận website và nộp bài' : 'Duyệt và nộp gói planning'
  const reviewNextAction = reviewStatus === 'passed'
    ? 'Quay lại khóa học để tiếp tục.'
    : needsPackageSubmission ? packageSubmissionLabel
    : unresolvedCriterion
      ? criterionNextActions[unresolvedCriterion.criterionId] ?? unresolvedCriterion.explanation
      : nextChecklistStep?.reason
        ?? (nextChecklistStep ? `Hoàn thành: ${nextChecklistStep.title}.` : 'Bổ sung bằng chứng rồi duyệt lại.')
  const configurationPractice = workspace.activePractice?.practiceId === 'm1-codex-safe-setup'
    || workspace.checklist.some((step) => step.id === 'set-model')
  const configuration = workspace.configuration
  const configurationFresh = configuration?.freshness === 'fresh'
    && configuration.connection === 'connected'
  const configurationMismatches = setupSettings.filter((row) =>
    !row.matches(configuration?.[row.key]?.protocolValue))
  const configurationNextAction = !configurationFresh
    ? 'Mở đúng task Codex, sau đó nhờ Triết kiểm tra lại.'
    : configurationMismatches.length
      ? `Cần kiểm tra: ${configurationMismatches.map((row) => row.label).join(', ')}.`
      : reviewStatus === 'passed'
          ? 'Bốn cài đặt đang khớp.'
          : 'Bốn cài đặt đang khớp. Nhờ Triết duyệt để ghi nhận kết quả.'
  const planning = workspace.planning
  const portfolioStages = workspace.portfolioPlanning ?? workspace.portfolioBuild
  const currentPlanningStep = workspace.checklist.find((step) =>
    step.status === 'current' || step.status === 'stale')
  const actionContext = planning?.actionContext
  const activeRunId = workspace.activePractice?.runId ?? ''
  const scopeDecision = scopeDraft.runId === activeRunId ? scopeDraft.value : ''
  const checklistTitle = (stepId: string) =>
    workspace.checklist.find((step) => step.id === stepId)?.title ?? 'Bước cần xem lại'
  const completedStepCount = workspace.checklist.filter((step) => step.status === 'completed').length
  const compactCurrentStep = workspace.checklist.find((step) =>
    step.status === 'current' || step.status === 'stale' || step.status === 'pending')
  const compactNextAction = reviewStatus === 'passed'
    ? 'Quay lại khóa học để tiếp tục.'
    : needsPackageSubmission ? packageSubmissionLabel
    : unresolvedCriterion && criterionNextActions[unresolvedCriterion.criterionId]
      ? criterionNextActions[unresolvedCriterion.criterionId]
      : workspace.portfolioPackage && unresolvedCriterion
        ? unresolvedCriterion.explanation
      : compactCurrentStep
        ? `Hoàn thành bước hiện tại: ${compactCurrentStep.title}.`
        : 'Bổ sung bằng chứng rồi duyệt lại.'
  const compactStepStatus = {
    completed: 'Đã hoàn thành',
    current: 'Đang thực hiện',
    pending: 'Chưa bắt đầu',
    stale: 'Cần xác minh lại',
    upcoming: 'Chưa đến lượt'
  } as const
  const compactConfigurationGuidance: Record<string, string> = {
    'set-effort': 'Mở Effort trong task Codex và chọn Medium hoặc High.',
    'set-speed': 'Mở Speed trong task Codex và chọn Standard.',
    'set-approval': 'Mở Approval trong task Codex và chọn Approve for me.',
    'disable-full-access': 'Giữ Full access ở trạng thái tắt trong task Codex.'
  }
  const compactGuidance = (step: PracticeWorkspaceView['checklist'][number]) =>
    compactConfigurationGuidance[step.id]
      ?? (step.status === 'completed'
        ? 'Bước này đã được xác minh trong lần duyệt gần nhất.'
        : step.status === 'pending' || step.status === 'upcoming'
          ? 'Hoàn thành các bước trước đó, sau đó thực hiện bước này trong đúng task Codex.'
          : 'Thực hiện yêu cầu trong tên bước tại đúng task Codex, sau đó cập nhật và duyệt lại tiến độ.')
  const comparison = workspace.review?.comparison
  const comparisonSummary = comparison?.kind === 'unchanged'
    ? 'Không có bước nào thay đổi sau lần kiểm tra trước.'
    : comparison?.needsReverification[0]
      ? `Cần xác minh lại: ${comparison.needsReverification[0].title}.`
      : comparison?.newlyVerified[0]
        ? `Mới xác minh: ${comparison.newlyVerified[0].title}.`
        : comparison?.kind === 'first-review' ? 'Đã hoàn tất lần kiểm tra đầu tiên.' : ''

  const planningAction = (action: PlanningPracticeActionRequest['action']) => {
    if (!actionBusy) onPlanningAction?.(action)
  }
  const showSummaryObjective = showObjective && !configurationPractice && !packageSubmission
  const ChecklistContainer = packageSubmission ? 'details' : 'div'
  const ReviewContainer = practicePassed ? 'details' : 'section'
  const success = practicePassed ? (
    <PracticeSuccess practiceId={workspace.activePractice?.practiceId}>
      {onReturn ? <PracticeReturnAction busy={returnBusy} disabled={returnDisabled} compact={compact} onReturn={onReturn} /> : null}
    </PracticeSuccess>
  ) : null
  if (compact) {
    return (
      <section className="practice-progress is-compact" aria-label="Tiến độ Practice">
        {success}
        {reviewStatus !== 'passed' ? (
          <div className="practice-compact-next" aria-label="Hành động tiếp theo">
            <small>Tiếp theo</small>
            <strong>{compactNextAction}</strong>
          </div>
        ) : null}
        <div className="practice-compact-progress" role="status">
          <div>
            <small>Tiến độ</small>
            <strong>{completedStepCount}/{workspace.checklist.length} bước đã xác minh</strong>
          </div>
          {!practicePassed ? <b className={`is-${reviewStatus ?? 'not-reviewed'}`}>
            {reviewStatus === 'needs-work' ? 'Cần bổ sung' : 'Chưa duyệt'}
          </b> : null}
        </div>
        {workspace.portfolioPackage && reviewStatus === 'needs-work' && reviewResult ? (
          <section className="practice-review-result is-needs-work" tabIndex={-1} aria-label="Kết quả duyệt Practice">
            <p>{reviewResult.summary}</p>
            <ol className="practice-review-criteria" aria-label="Kết quả theo từng tiêu chí">
              {reviewResult.criteria.filter((criterion) => criterion.status !== 'satisfied').map((criterion) => (
                <li className={`is-${criterion.status}`} key={criterion.criterionId}>
                  <span aria-hidden="true">{criterion.status === 'unsatisfied' ? '!' : '?'}</span>
                  <div>
                    <strong>{criterion.status === 'unsatisfied' ? 'Cần chỉnh sửa' : 'Chưa thể xác minh'}</strong>
                    <p>{criterion.explanation}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
        {!practicePassed ? packageSubmission : null}
        <details {...(configurationPractice ? practiceGuideAnchor('configuration-evidence') : {})} className="practice-compact-details">
          <summary>Xem tất cả {workspace.checklist.length} bước</summary>
          {comparisonSummary && comparison?.kind !== 'first-review' ? <p className="practice-compact-change" role="status">{comparisonSummary}</p> : null}
        <ol className="practice-compact-checklist" aria-label="Tất cả các bước Practice">
          {workspace.checklist.map((step, index) => {
            const expanded = expandedCompactStepId === step.id
            const panelId = `practice-compact-step-${step.id}`
            return (
              <li className={`is-${step.status}`} key={step.id}>
                <button
                  aria-controls={panelId}
                  aria-expanded={expanded}
                  type="button"
                  onClick={() => setExpandedCompactStepId(expanded ? null : step.id)}
                >
                  <span className="practice-compact-step-icon" aria-hidden="true">{stepIcon[step.status]}</span>
                  <span className="practice-compact-step-copy">
                    <small>Bước {index + 1}</small>
                    <strong>{step.title}</strong>
                  </span>
                  <span className="practice-compact-step-state">{compactStepStatus[step.status]}</span>
                  <span className="practice-compact-step-disclosure" aria-hidden="true" />
                </button>
                {expanded ? (
                  <div className="practice-compact-step-guide" id={panelId} role="region" aria-label={`Hướng dẫn: ${step.title}`}>
                    <small>Hướng dẫn</small>
                    <p>{compactGuidance(step)}</p>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ol>
        </details>
      </section>
    )
  }
  return (
    <section className={'practice-progress' + (compact ? ' is-compact' : '')} aria-label="Tiến độ Practice">
      {success}
      {!practicePassed ? packageSubmission : null}
      {showSummaryObjective || workspace.completionDestination ? <div className="practice-progress__summary">
        {showSummaryObjective ? <>
          <small>Mục tiêu</small>
          <strong>{workspace.objective}</strong>
          {!compact ? <p>{workspace.expectedOutcome}</p> : null}
        </> : null}
        {workspace.completionDestination ? (
          <small className="practice-destination">
            Sau khi đạt: {workspace.completionDestination.label}
          </small>
        ) : null}
      </div> : null}

      {reviewStatus === 'passed' || reviewStatus === 'needs-work' ? (
        <ReviewContainer className={practicePassed ? 'practice-success-details' : `practice-review-result is-${reviewStatus}`} tabIndex={-1} role={practicePassed ? undefined : 'status'} aria-label="Kết quả duyệt Practice">
          {practicePassed ? <summary>Xem kết quả kiểm tra</summary> : null}
          <div>
            {!practicePassed ? <div className="practice-review-next-action">
              <small>Tiếp theo</small>
              <strong>{reviewNextAction}</strong>
            </div> : null}
            <small>Kết quả duyệt</small>
            <strong>{practicePassed ? 'Các tiêu chí đã đáp ứng' : reviewStatus === 'passed' ? 'Đã đạt' : 'Cần bổ sung'}</strong>
            {comparisonSummary ? <p className="practice-review-change">{comparisonSummary}</p> : null}
            <p>{reviewResult?.summary ?? (reviewStatus === 'passed'
              ? 'Bằng chứng đáp ứng các tiêu chí bắt buộc.'
              : 'Hãy bổ sung bằng chứng theo các bước còn lại rồi yêu cầu duyệt lại.')}</p>
            {reviewResult ? (
              <ol className="practice-review-criteria" aria-label="Kết quả theo từng tiêu chí">
                {reviewResult.criteria.map((criterion) => (
                  <li className={`is-${criterion.status}`} key={criterion.criterionId}>
                    <span aria-hidden="true">{criterion.status === 'satisfied' ? '✓' : criterion.status === 'unsatisfied' ? '!' : '?'}</span>
                    <div>
                      <strong>{criterion.status === 'satisfied' ? 'Đã đáp ứng' : criterion.status === 'unsatisfied' ? 'Cần chỉnh sửa' : 'Chưa thể xác minh'}</strong>
                      <p>{criterion.explanation}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : null}
            {reviewResult?.reviewedAt ? <time dateTime={reviewResult.reviewedAt}>Duyệt lúc {new Date(reviewResult.reviewedAt).toLocaleString('vi-VN')}</time> : null}
          </div>
        </ReviewContainer>
      ) : null}

      {configurationPractice ? (
        <section {...practiceGuideAnchor('configuration-evidence')} className="practice-configuration practice-configuration-disclosure" aria-label="Cấu hình Codex được phát hiện" aria-live="polite">
          <header>
            <div>
              <small>Cấu hình task được phát hiện</small>
              <strong>
                {!configuration
                  ? 'Chưa có dữ liệu'
                  : configurationFresh ? 'Dữ liệu mới' : 'Chưa thể xác minh'}
              </strong>
            </div>
            <span className={configurationFresh ? 'is-fresh' : 'is-unavailable'}>
              {configurationFresh
                ? 'Mới'
                : !configuration ? 'Đang chờ'
                : configuration.connection === 'disconnected'
                  ? 'Chưa đọc được'
                  : configuration.freshness === 'stale' ? 'Đã cũ' : 'Không khả dụng'}
            </span>
          </header>
          <p className="practice-configuration-next">{configurationNextAction}</p>
          <details>
          <summary>Xem chi tiết cài đặt</summary>
          <p>
            Course Companion chỉ đọc metadata hiệu lực của task Codex đang liên kết;
            ứng dụng không tự thay đổi cài đặt của bạn.
          </p>
          <dl>
            {setupSettings.map((row) => {
              const value = configuration?.[row.key]
              const matches = configurationFresh && row.matches(value?.protocolValue)
              return (
                <div className={matches ? 'is-match' : 'is-mismatch'} key={row.key}>
                  <dt>{row.label}</dt>
                  <dd>{value?.label ?? 'Không xác minh được'}</dd>
                  <small>{matches ? 'Khớp' : 'Cần ' + row.expectedLabel}</small>
                </div>
              )
            })}
          </dl>
          {configuration ? (
            <time dateTime={configuration.observedAt}>
              Ghi nhận: {new Date(configuration.observedAt).toLocaleString('vi-VN')}
            </time>
          ) : null}
          </details>
        </section>
      ) : null}

      {planning ? (
        <section className="practice-planning" aria-label="Bằng chứng planning package" aria-live="polite">
          <header>
            <div>
              <small>Planning package</small>
              <strong>{planning.freshness === 'fresh' ? 'Bằng chứng hiện tại' : planning.freshness === 'stale' ? 'Cần làm mới' : 'Chưa thể xác minh'}</strong>
            </div>
            {onRefresh ? <button type="button" disabled={actionBusy} onClick={onRefresh}>Làm mới bằng chứng</button> : null}
          </header>
          <div className="practice-artifacts">
            {planning.artifacts.map((artifact) => (
              <article className={`is-${artifact.availability} is-${artifact.approval}`} key={artifact.path}>
                <small>{artifactLabels[artifact.path]}</small>
                <strong>{artifactAvailability[artifact.availability]}</strong>
                <span>{artifactApproval[artifact.approval]} · {artifact.freshness === 'fresh' ? 'Mới' : artifact.freshness === 'stale' ? 'Đã cũ' : 'Chưa xác minh'}</span>
                {artifact.issue ? <em>Mã trạng thái: {artifact.issue}</em> : null}
              </article>
            ))}
            <article className={`is-alignment-${planning.alignment}`}>
              <small>Alignment</small>
              <strong>{planning.alignment === 'confirmed' ? 'Đã đối chiếu' : planning.alignment === 'stale' ? 'Cần đối chiếu lại' : 'Chưa xác nhận'}</strong>
              <span>Bốn điểm phạm vi và Done When</span>
            </article>
          </div>

          {planning.unexpectedChangedPaths.length > 0 ? (
            <div className="practice-scope-warning" role="status">
              <strong>Có thay đổi ngoài hai tài liệu cho phép</strong>
              <ul>{planning.unexpectedChangedPaths.map((path) => <li key={path}>{path}</li>)}</ul>
            </div>
          ) : null}

          {planning.invalidations.map((item) => (
            <article className="practice-invalidation" key={`${item.changedInput}:${item.affectedStepIds.join(',')}`} role="status">
              <small>Dependency vừa thay đổi</small>
              <strong>{item.changedInput}</strong>
              <p>{item.reason}</p>
              <span>Bước cần xem lại: {item.affectedStepIds.map(checklistTitle).join(', ')}</span>
              <b>Tiếp theo: {item.nextAction}</b>
            </article>
          ))}

          {onPlanningAction && workspace.activePractice && currentPlanningStep ? (
            <div className="practice-planning-actions" aria-label="Hành động xác nhận Practice">
              {currentPlanningStep.id === 'write-prd-prompt' && actionContext?.activityCursor ? (
                <button type="button" disabled={actionBusy} onClick={() => planningAction({ type: 'capture-prd-prompt', expectedActivityCursor: actionContext.activityCursor! })}>Ghi nhận prompt của tôi</button>
              ) : null}
              {currentPlanningStep.id === 'complete-interview' && actionContext?.activityCursor ? (
                <button type="button" disabled={actionBusy} onClick={() => planningAction({ type: 'complete-interview', expectedActivityCursor: actionContext.activityCursor! })}>Xác nhận đã hoàn thành phỏng vấn</button>
              ) : null}
              {currentPlanningStep.id === 'approve-prd' && actionContext?.prdDigest ? (
                <>
                  <button type="button" disabled={actionBusy} onClick={() => planningAction({ type: 'approve-prd', expectedPrdDigest: actionContext.prdDigest! })}>Duyệt và lưu PRD</button>
                  <button type="button" disabled={actionBusy} onClick={() => planningAction({ type: 'request-prd-revision', expectedPrdDigest: actionContext.prdDigest! })}>Yêu cầu sửa PRD</button>
                </>
              ) : null}
              {currentPlanningStep.id === 'reconcile-alignment' && actionContext?.prdDigest && actionContext.planDigest ? (
                <button type="button" disabled={actionBusy} onClick={() => planningAction({ type: 'confirm-alignment', expectedPrdDigest: actionContext.prdDigest!, expectedPlanDigest: actionContext.planDigest! })}>Xác nhận bốn điểm alignment</button>
              ) : null}
              {currentPlanningStep.id === 'approve-plan' && actionContext?.prdDigest && actionContext.planDigest ? (
                <>
                  <button type="button" disabled={actionBusy} onClick={() => planningAction({ type: 'approve-plan', expectedPrdDigest: actionContext.prdDigest!, expectedPlanDigest: actionContext.planDigest! })}>Duyệt và lưu implementation plan</button>
                  <button type="button" disabled={actionBusy} onClick={() => planningAction({ type: 'request-plan-revision', expectedPrdDigest: actionContext.prdDigest!, expectedPlanDigest: actionContext.planDigest! })}>Yêu cầu sửa plan</button>
                </>
              ) : null}
              {currentPlanningStep.id === 'explain-scope-and-review' && actionContext?.prdDigest && actionContext.planDigest ? (
                <label>
                  <span>Giải thích một quyết định phạm vi bằng lời của bạn</span>
                  <textarea
                    autoComplete="off"
                    maxLength={500}
                    name="scopeDecision"
                    value={scopeDecision}
                    onChange={(event) => setScopeDraft({
                      runId: activeRunId,
                      value: String((event.currentTarget as unknown as { value: unknown }).value ?? '')
                    })}
                  />
                  <button type="button" disabled={actionBusy || scopeDecision.trim().length === 0} onClick={() => planningAction({ type: 'record-scope-decision', value: scopeDecision.trim(), expectedPrdDigest: actionContext.prdDigest!, expectedPlanDigest: actionContext.planDigest! })}>Ghi nhận quyết định phạm vi</button>
                </label>
              ) : null}
              {currentPlanningStep.id === 'draft-plan' ? <p>Quay lại Codex để tạo implementation plan từ PRD đã duyệt, rồi chọn “Làm mới bằng chứng”.</p> : null}
              {actionBusy ? <small>Đang xác nhận bằng chứng hiện tại…</small> : null}
            </div>
          ) : null}

          {planning.observedAt ? <time dateTime={planning.observedAt}>Ghi nhận: {new Date(planning.observedAt).toLocaleString('vi-VN')}</time> : null}
        </section>
      ) : null}

      {portfolioStages ? (
        <section className="practice-portfolio-planning" aria-label={workspace.portfolioBuild ? 'Bằng chứng xây dựng portfolio' : 'Bằng chứng lập kế hoạch portfolio'} aria-live="polite">
          <header>
            <div>
              <small>{workspace.portfolioBuild ? 'Xây dựng portfolio' : 'Gói lập kế hoạch portfolio'}</small>
              <strong>{portfolioStages.freshness === 'fresh'
                ? 'Bằng chứng hiện tại'
                : portfolioStages.freshness === 'stale'
                  ? 'Cần làm mới'
                  : 'Chưa thể xác minh'}</strong>
            </div>
            {onRefresh ? <button type="button" disabled={actionBusy} onClick={onRefresh}>Làm mới bằng chứng</button> : null}
          </header>

          {portfolioStages.unexpectedPaths.length > 0 ? (
            <div className="practice-scope-warning" role="status">
              <strong>Có tệp nằm ngoài phạm vi Practice</strong>
              <ul>{portfolioStages.unexpectedPaths.map((path) => <li key={path}>{path}</li>)}</ul>
            </div>
          ) : null}

          <ol className="practice-portfolio-stages">
            {portfolioStages.stages.map((stage) => (
              <li className={`is-${stage.status}`} key={stage.stageId}>
                <header>
                  <span>{stage.stageIndex}</span>
                  <div>
                    <small>Giai đoạn {stage.stageIndex}/5</small>
                    <strong>{portfolioStageLabels[stage.stageId] ?? stage.stageId}</strong>
                  </div>
                  <em>{stage.status === 'completed'
                    ? 'Đã duyệt'
                    : stage.status === 'ready'
                      ? 'Sẵn sàng duyệt'
                      : stage.status === 'stale'
                        ? 'Cần duyệt lại'
                        : stage.status === 'blocked'
                          ? 'Cần bổ sung'
                          : 'Chưa mở'}</em>
                </header>
                <div className="practice-portfolio-artifacts">
                  {stage.artifactPaths.map((path) => <code key={path}>{path}</code>)}
                </div>
                {workspace.portfolioBuild && stage.stageId === 'complete-first-version' ? (
                  <ol className="practice-build-slices" aria-label="Bốn phần xây dựng">
                    {workspace.portfolioBuild.slices.map((slice) => (
                      <li className={`is-${slice.status}`} key={slice.sliceId}>
                        <span>{slice.sliceIndex}/4</span>
                        <strong>{buildSliceLabels[slice.sliceId]}</strong>
                        <em>{slice.status === 'completed' ? 'Đã duyệt' : slice.status === 'ready' ? 'Sẵn sàng' : slice.status === 'stale' ? 'Duyệt lại' : slice.status === 'blocked' ? 'Cần bổ sung' : 'Chưa mở'}</em>
                        {onPortfolioStageAction && slice.status !== 'completed' && slice.status !== 'pending' ? (
                          <div className="practice-portfolio-actions">
                            {slice.status === 'ready' ? <button className="is-primary" disabled={actionBusy} type="button" onClick={() => onPortfolioStageAction(stage.stageId, 'approved', slice.sliceId)}>Chấp nhận phần này</button> : null}
                            <button disabled={actionBusy} type="button" onClick={() => onPortfolioStageAction(stage.stageId, 'revision-requested', slice.sliceId)}>Yêu cầu sửa</button>
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                ) : null}
                {stage.issueCodes.length > 0 ? (
                  <ul className="practice-portfolio-issues">
                    {stage.issueCodes.map((code) => <li key={code}>{portfolioIssueLabels[code] ?? code}</li>)}
                  </ul>
                ) : null}
                {stage.staleReason ? <p>{stage.staleReason}</p> : null}
                {onPortfolioStageAction && stage.status !== 'completed' && stage.status !== 'pending' ? (
                  <div className="practice-portfolio-actions">
                    {stage.status === 'ready' ? (
                      <button className="is-primary" disabled={actionBusy} type="button" onClick={() => onPortfolioStageAction(stage.stageId, 'approved')}>
                        Chấp nhận phiên bản hiện tại
                      </button>
                    ) : null}
                    <button disabled={actionBusy} type="button" onClick={() => onPortfolioStageAction(stage.stageId, 'revision-requested')}>
                      Yêu cầu sửa
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
          {actionBusy ? <small>Đang đối chiếu đúng phiên bản tài liệu hiện tại…</small> : null}
        </section>
      ) : null}

      <ChecklistContainer className={packageSubmission ? 'practice-package-progress' : undefined}>
      {packageSubmission ? <summary>Xem tiến độ chi tiết</summary> : null}
      <ol className="practice-checklist">
        {workspace.checklist.map((step) => (
          <li className={'is-' + step.status} key={step.id}>
            <span aria-hidden="true">{stepIcon[step.status]}</span>
            <div>
              <strong>{step.title}</strong>
              <small>
                {step.status === 'completed'
                  ? 'Đã hoàn thành'
                  : step.status === 'current'
                    ? 'Bước tiếp theo'
                    : step.status === 'stale'
                      ? 'Cần xem lại'
                      : 'Sắp tới'}
              </small>
              {step.reason && step.reason !== step.title ? <p>{step.reason}</p> : null}
            </div>
          </li>
        ))}
      </ol>

      {workspace.activePractice ? (
        <aside className="practice-receipt">
          <strong>Task Codex đang hoạt động</strong>
          <p>{workspace.activePractice.executorChatName}</p>
        </aside>
      ) : null}
      </ChecklistContainer>
    </section>
  )
}
