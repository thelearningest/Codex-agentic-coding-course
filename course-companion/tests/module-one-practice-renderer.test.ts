import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PracticeProgress } from '../src/renderer/src/components/PracticeProgress'
import type {
  CodexTaskConfigurationSnapshot,
  PracticeWorkspaceView
} from '../shared/contracts'

const observedAt = '2026-08-11T00:00:00.000Z'

function configuration(
  overrides: Partial<CodexTaskConfigurationSnapshot> = {}
): CodexTaskConfigurationSnapshot {
  return {
    schemaVersion: 1,
    runId: 'run-1',
    threadId: 'thread-1',
    source: 'thread-resume',
    eventTimestampMs: 1,
    observedAt,
    freshness: 'fresh',
    connection: 'connected',
    model: { protocolValue: 'gpt-5.6-sol', label: '5.6 Sol' },
    reasoningEffort: { protocolValue: 'high', label: 'High' },
    serviceTier: { protocolValue: 'standard', label: 'Standard' },
    approvalPolicy: { protocolValue: 'on-request', label: 'Approve for me' },
    fullAccess: { protocolValue: 'off', label: 'Off' },
    sandboxType: 'workspaceWrite',
    activePermissionProfile: null,
    ...overrides
  }
}

function workspace(
  config: CodexTaskConfigurationSnapshot | null = configuration()
): PracticeWorkspaceView {
  return {
    schemaVersion: 1,
    phase: 'active',
    title: 'Thiết lập Codex an toàn',
    objective: 'Thiết lập Codex an toàn.',
    expectedOutcome: 'Đủ bốn giá trị.',
    checklist: [
      { id: 'set-effort', title: 'Chọn Effort Medium hoặc High', status: 'current' }
    ],
    review: { status: 'not-reviewed', canReview: true, canReturn: false },
    ...(config ? { configuration: config } : {}),
    activePractice: {
      runId: 'run-1',
      generation: 1,
      practiceId: 'm1-codex-safe-setup',
      practiceVersion: '2.0.0',
      executorChatName: 'Practice · Module 1',
      startedAt: observedAt
    },
    presentation: { fullPanel: 'teacher', compactPanel: 'teacher' },
    capabilities: {
      canStartNew: true,
      canResume: true,
      selectiveTransferAvailable: false,
      selectiveTransferReason: 'Không khả dụng.'
    }
  }
}

describe('Module 1 Practice renderer', () => {
  it('communicates the direct metadata flow without screenshots or an Executor report', async () => {
    const source = await readFile(join(
      process.cwd(),
      'src',
      'renderer',
      'src',
      'surfaces',
      'LearningWindow.tsx'
    ), 'utf8')
    expect(source).toContain('PRACTICE · METADATA TRỰC TIẾP')
    expect(source).toContain('KHÔNG CẦN ẢNH CHỤP')
    expect(source).toContain('Triết duyệt trực tiếp bốn giá trị')
    expect(source).not.toContain('PRACTICE · 2 ẢNH')
  })

  it('opens the real Practice workflow instead of marking the checkpoint complete locally', async () => {
    const source = await readFile(join(
      process.cwd(),
      'src',
      'renderer',
      'src',
      'surfaces',
      'LearningWindow.tsx'
    ), 'utf8')
    expect(source).toContain('if (practiceScene.practice')
    expect(source).toContain("next: 'module-1-setup-checklist', action: 'practice'")
    expect(source).toContain("if (choice.next && choice.next !== progress.sceneId) await advanceToScene(choice.next, progress.decisions)")
    expect(source).toContain("if (loadedProgress.sceneId === 'module-1-setup-checklist') setPracticeBriefOpen(true)")
    expect(source).toContain("progress.sceneId === 'module-1-setup-checklist'")
    expect(source).toContain('visibleLessonScene(progress.sceneId)')
    expect(source).toContain('? setupPracticeDefinition : scenes[progress.sceneId].practice')
    expect(source).not.toContain("'m1-assessment': [\n    ['module-1-setup-checklist']")
    expect(source).toContain('practiceVersion: activePracticeDefinition.version')
    expect(source).not.toContain('mock-completed')
    expect(source).not.toContain('practicePreview:')
  })

  it('defines an announced loading state before workspace metadata is available', async () => {
    const source = await readFile(join(
      process.cwd(),
      'src',
      'renderer',
      'src',
      'components',
      'PracticeBrief.tsx'
    ), 'utf8')
    expect(source).toContain('Đang đọc Practice')
    expect(source).toContain('aria-live')
  })

  it('shows the four required values and a fresh Effort mismatch without assessing Model', () => {
    const html = renderToStaticMarkup(createElement(PracticeProgress, {
      workspace: workspace(configuration({
        model: { protocolValue: 'gpt-6-astra', label: null },
        reasoningEffort: { protocolValue: 'low', label: 'Low' }
      }))
    }))
    expect(html).toContain('Cấu hình task được phát hiện')
    expect(html).not.toContain('Cần 5.6 Sol')
    expect(html.match(/<dt>/g)).toHaveLength(4)
    expect(html).toContain('Cần kiểm tra: Effort.')
    expect(html.indexOf('Cần kiểm tra: Effort.')).toBeLessThan(html.indexOf('<details'))
    expect(html).not.toContain('<dt>Model</dt>')
    expect(html).toContain('data-practice-guide-anchor="configuration-evidence"')
    expect(html).not.toContain('<details open')
  })

  it('discloses stale, disconnected, and unavailable metadata', () => {
    const stale = renderToStaticMarkup(createElement(PracticeProgress, {
      workspace: workspace(configuration({
        freshness: 'stale',
        connection: 'disconnected'
      }))
    }))
    expect(stale).toContain('Chưa thể xác minh')
    expect(stale).toContain('Chưa đọc được')

    const unavailable = renderToStaticMarkup(createElement(PracticeProgress, {
      workspace: workspace(null)
    }))
    expect(unavailable).toContain('Chưa có dữ liệu')
    expect(unavailable).toContain('Không xác minh được')
    expect(unavailable).toContain('Mở đúng task Codex, sau đó nhờ Triết kiểm tra lại.')
  })

  it('renders pass and native keyboard-operable return controls in full and compact modes', () => {
    const passed = {
      ...workspace(),
      review: {
        status: 'passed' as const,
        canReview: true,
        canReturn: true
      }
    }
    const full = renderToStaticMarkup(createElement(PracticeProgress, {
      workspace: passed,
      onReturn: () => undefined
    }))
    const compact = renderToStaticMarkup(createElement(PracticeProgress, {
      workspace: passed,
      compact: true,
      onReturn: () => undefined
    }))
    expect(full).toContain('Đã đạt')
    expect(full).toContain('Lưu kết quả và quay lại khóa học')
    expect(compact).toContain('practice-progress is-compact')
  })

  it('keeps the return action geometry and icon stable while loading', async () => {
    const [action, css] = await Promise.all([
      readFile(join(process.cwd(), 'src', 'renderer', 'src', 'components', 'PracticeReturnAction.tsx'), 'utf8'),
      readFile(join(process.cwd(), 'src', 'renderer', 'src', 'styles.css'), 'utf8')
    ])
    expect(action).toContain('Đang lưu kết quả và quay lại…')
    expect(action).toContain('practice-return-action__icon')
    expect(action).toContain('practice-return-action__spinner')
    expect(css).toMatch(/\.practice-return-action__spinner[^{]*\{[^}]*border-radius:\s*50%/s)
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it.each(['m1-codex-safe-setup', 'm2-portfolio-planning', 'm3-portfolio-build', 'm4-portfolio-release'])(
    'celebrates a current passed review for %s with one return action', (practiceId) => {
      const passed = workspace()
      passed.activePractice!.practiceId = practiceId
      passed.review = { status: 'passed', canReview: true, canReturn: true }
      for (const compact of [false, true]) {
        const html = renderToStaticMarkup(createElement(PracticeProgress, {
          workspace: passed, compact, onReturn: () => undefined
        }))
        expect(html).toContain('Làm tốt lắm!')
        expect(html).toContain('aria-label="Practice hoàn thành"')
        expect(html.match(/aria-label="Lưu kết quả và quay lại khóa học"/g)).toHaveLength(1)
        expect(html.indexOf('practice-success')).toBeLessThan(html.indexOf('<details'))
      }
    })

  it('does not celebrate checklist completion or a passed result that cannot return', () => {
    for (const review of [
      { status: 'not-reviewed' as const, canReview: true, canReturn: false },
      { status: 'passed' as const, canReview: true, canReturn: false }
    ]) {
      const view = workspace()
      view.checklist[0]!.status = 'completed'
      view.review = review
      const html = renderToStaticMarkup(createElement(PracticeProgress, { workspace: view, compact: true }))
      expect(html).not.toContain('Làm tốt lắm!')
    }
  })

  it('keeps objectives, criteria, configuration, and timestamps out of compact mode', () => {
    const compact = renderToStaticMarkup(createElement(PracticeProgress, {
      workspace: {
        ...workspace(),
        review: {
          status: 'needs-work',
          canReview: true,
          canReturn: false,
          result: {
            schemaVersion: 1,
            practiceId: 'm1-codex-safe-setup',
            practiceVersion: '2.0.0',
            runId: 'run-1',
            verdict: 'needs-work',
            criteria: [{
              criterionId: 'unmapped-private-detail',
              status: 'unsatisfied',
              evidenceRefs: ['configuration-model'],
              explanation: 'PRIVATE CRITERION EXPLANATION'
            }],
            summary: 'PRIVATE REVIEW SUMMARY',
            reviewedAt: observedAt,
            sourceDigest: 'a'.repeat(64)
          }
        }
      },
      compact: true
    }))

    expect(compact).toContain('0/1 bước đã xác minh')
    expect(compact).toContain('Hoàn thành bước hiện tại: Chọn Effort Medium hoặc High.')
    expect(compact.indexOf('aria-label="Hành động tiếp theo"')).toBeLessThan(compact.indexOf('practice-compact-progress'))
    expect(compact.indexOf('practice-compact-progress')).toBeLessThan(compact.indexOf('<details'))
    expect(compact).toContain('Tất cả các bước Practice')
    expect(compact).toContain('aria-expanded="false"')
    expect(compact).not.toContain('Mở bộ chọn Model trong task Codex')
    expect(compact).not.toContain('Thiết lập Codex an toàn.')
    expect(compact).not.toContain('Đủ bốn giá trị.')
    expect(compact).not.toContain('PRIVATE CRITERION EXPLANATION')
    expect(compact).not.toContain('PRIVATE REVIEW SUMMARY')
    expect(compact).not.toContain('Cấu hình task được phát hiện')
    expect(compact).not.toContain(observedAt)
  })

  it('explains a regression without presenting prior work as never started', () => {
    const compact = renderToStaticMarkup(createElement(PracticeProgress, {
      workspace: {
        ...workspace(),
        checklist: [
          { id: 'set-model', title: 'Chọn Model 5.6 Sol', status: 'completed' },
          { id: 'set-effort', title: 'Chọn Effort Medium hoặc High', status: 'stale', reason: 'Effort đã thay đổi.' }
        ],
        review: {
          status: 'needs-work', canReview: true, canReturn: false,
          comparison: {
            kind: 'changed',
            previousReviewedAt: '2026-08-11T00:00:00.000Z',
            currentReviewedAt: '2026-08-11T00:01:00.000Z',
            previousCompletedCount: 2,
            currentCompletedCount: 1,
            totalStepCount: 2,
            newlyVerified: [],
            needsReverification: [{ stepId: 'set-effort', title: 'Chọn Effort Medium hoặc High', reason: 'Effort đã thay đổi.' }]
          }
        }
      },
      compact: true
    }))

    expect(compact).toContain('1/2 bước đã xác minh')
    expect(compact).toContain('Cần xác minh lại: Chọn Effort Medium hoặc High.')
    expect(compact).toContain('Cần xác minh lại')
    expect(compact).toContain('Xem tất cả 2 bước')
    expect(compact).not.toContain('Chọn Effort Medium hoặc High</strong></span><span class="practice-compact-step-state">Chưa bắt đầu')
  })

  it('keeps Practice animation disabled for reduced-motion users', async () => {
    const css = await readFile(join(
      process.cwd(),
      'src',
      'renderer',
      'src',
      'styles.css'
    ), 'utf8')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toContain('.practice-loading-orbit { animation: none;')
  })
})

describe('Module 2 Practice renderer', () => {
  const planningWorkspace: PracticeWorkspaceView = {
    schemaVersion: 1,
    phase: 'active',
    title: 'Xây dựng planning package',
    objective: 'Tạo planning package.',
    expectedOutcome: 'Hai artifact đã duyệt và khớp nhau.',
    checklist: [
      { id: 'approve-prd', title: 'Duyệt PRD', status: 'completed' },
      {
        id: 'reconcile-alignment',
        title: 'Đối chiếu alignment',
        status: 'stale',
        reason: 'PRD đã thay đổi sau lần đối chiếu trước.'
      },
      { id: 'approve-plan', title: 'Duyệt plan', status: 'pending' }
    ],
    review: { status: 'needs-work', canReview: false, canReturn: false },
    completionDestination: {
      lessonId: 'module-2',
      checkpointId: 'm2-mastery',
      sceneId: 'module-2-mastery',
      label: 'Bài kiểm tra và hoàn thành Module 2'
    },
    planning: {
      freshness: 'fresh',
      observedAt,
      artifacts: [
        {
          path: 'artifacts/PRD.md',
          availability: 'available',
          approval: 'stale',
          freshness: 'fresh'
        },
        {
          path: 'artifacts/implementation-plan.md',
          availability: 'available',
          approval: 'approved',
          freshness: 'stale'
        }
      ],
      alignment: 'stale',
      unexpectedChangedPaths: ['app/globals.css'],
      invalidations: [{
        changedInput: 'artifacts/PRD.md',
        affectedStepIds: ['reconcile-alignment', 'approve-plan'],
        reason: 'PRD đã thay đổi sau khi plan được duyệt.',
        nextAction: 'Đối chiếu lại PRD và plan.'
      }],
      actionContext: {
        generation: 2,
        prdDigest: 'prd-current',
        planDigest: 'plan-current'
      }
    },
    activePractice: {
      runId: 'run-2',
      generation: 2,
      practiceId: 'm2-planning-package',
      practiceVersion: '2.0.0',
      executorChatName: 'Practice · Module 2',
      startedAt: observedAt
    },
    presentation: { fullPanel: 'teacher', compactPanel: 'teacher' },
    capabilities: {
      canStartNew: true,
      canResume: true,
      selectiveTransferAvailable: false,
      selectiveTransferReason: 'Không khả dụng.'
    }
  }

  it('shows artifact, alignment, scope, invalidation, recovery, and destination state', () => {
    const html = renderToStaticMarkup(createElement(PracticeProgress, {
      workspace: planningWorkspace,
      onPlanningAction: () => undefined,
      onRefresh: () => undefined
    }))
    expect(html).toContain('Planning package')
    expect(html).toContain('PRD.md')
    expect(html).toContain('implementation-plan.md')
    expect(html).toContain('Cần đối chiếu lại')
    expect(html).toContain('app/globals.css')
    expect(html).toContain('Dependency vừa thay đổi')
    expect(html).toContain('Bước cần xem lại: Đối chiếu alignment, Duyệt plan')
    expect(html).not.toContain('reconcile-alignment, approve-plan')
    expect(html).toContain('Tiếp theo: Đối chiếu lại PRD và plan.')
    expect(html).toContain('Xác nhận bốn điểm alignment')
    expect(html).toContain('Làm mới bằng chứng')
    expect(html).toContain('Sau khi đạt: Bài kiểm tra và hoàn thành Module 2')
    expect(html).not.toContain('m2-mastery')
    expect(html).not.toContain('m2-planning-package')
  })

  it('uses a progress-only projection in compact mode', () => {
    const html = renderToStaticMarkup(createElement(PracticeProgress, {
      workspace: planningWorkspace,
      compact: true
    }))
    expect(html).toContain('practice-progress is-compact')
    expect(html).toContain('1/3 bước đã xác minh')
    expect(html).toContain('Hoàn thành bước hiện tại: Đối chiếu alignment.')
    expect(html).toContain('Cần bổ sung')
    for (const step of planningWorkspace.checklist) expect(html).toContain(step.title)
    expect(html.match(/aria-expanded="false"/g)).toHaveLength(planningWorkspace.checklist.length)
    expect(html).not.toContain('Hướng dẫn')
    expect(html).not.toContain('Dependency vừa thay đổi')
    expect(html).not.toContain('app/globals.css')
    expect(html).not.toContain('Planning package')
    expect(html).not.toContain('PRD.md')
  })
})

describe('Portfolio planning Practice renderer', () => {
  it('shows five ordered stages and exposes approval only for fresh ready evidence', () => {
    const portfolioWorkspace: PracticeWorkspaceView = {
      schemaVersion: 1,
      phase: 'active',
      title: 'Hoàn thiện gói planning cho portfolio',
      objective: 'Hoàn thiện năm giai đoạn.',
      expectedOutcome: 'Bảy tài liệu hiện hành.',
      checklist: [],
      review: { status: 'not-reviewed', canReview: false, canReturn: false },
      portfolioPlanning: {
        freshness: 'fresh',
        observedAt,
        unexpectedPaths: ['package.json'],
        stages: [
          { stageId: 'portfolio-brief', stageIndex: 1, status: 'completed', artifactPaths: ['planning/portfolio-brief.md'], issueCodes: [] },
          { stageId: 'content-evidence-inventory', stageIndex: 2, status: 'ready', artifactPaths: ['planning/content-evidence-inventory.md'], issueCodes: [] },
          { stageId: 'visual-reference', stageIndex: 3, status: 'blocked', artifactPaths: ['planning/reference/reference.md'], issueCodes: ['permission-metadata-missing'] },
          { stageId: 'portfolio-prd', stageIndex: 4, status: 'pending', artifactPaths: ['planning/PRD.md'], issueCodes: [] },
          { stageId: 'implementation-contract', stageIndex: 5, status: 'pending', artifactPaths: ['planning/implementation-plan.md'], issueCodes: [] }
        ]
      },
      activePractice: {
        runId: 'run-portfolio',
        generation: 1,
        practiceId: 'm2-portfolio-planning',
        practiceVersion: '1.0.0',
        executorChatName: 'Practice · Module 2 · portfolio',
        startedAt: observedAt
      },
      presentation: { fullPanel: 'teacher', compactPanel: 'teacher' },
      capabilities: {
        canStartNew: true,
        canResume: true,
        selectiveTransferAvailable: false,
        selectiveTransferReason: 'Không khả dụng.'
      }
    }

    const html = renderToStaticMarkup(createElement(PracticeProgress, {
      workspace: portfolioWorkspace,
      onPortfolioStageAction: () => undefined,
      onRefresh: () => undefined
    }))
    expect(html).toContain('Gói lập kế hoạch portfolio')
    expect(html).toContain('Giai đoạn 5/5')
    expect(html).toContain('package.json')
    expect(html).toContain('Thiếu nguồn hoặc quyền sử dụng')
    expect(html.match(/Chấp nhận phiên bản hiện tại/g)).toHaveLength(1)
    expect(html.match(/Yêu cầu sửa/g)).toHaveLength(2)
    expect(html).toContain('Làm mới bằng chứng')
  })
})
