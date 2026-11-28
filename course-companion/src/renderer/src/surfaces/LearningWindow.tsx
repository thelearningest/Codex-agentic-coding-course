import { visibleLessonScene } from '../../../../shared/course/visible-scene'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import {
  COURSE_VERSION,
  LEARNER_STATE_SCHEMA_VERSION,
  courseLessonIdForScene,
  runnableCheckpointIds,
  isPortfolioBuildLesson,
  portfolioBuildVersion,
  type CourseLessonId,
  type PracticeState,
  type PracticeReturnTarget,
  type CheckpointId,
  type LearnerProgress,
  type LessonId,
  type ProgressLoadResult,
  type ProgressUpdate,
  type RuntimeInfo,
  type SceneId
} from '../../../../shared/contracts'
import { ModuleOneOpening } from '../components/ModuleOneOpening'
import chatWorkCopy from '../../../../../pilot-workspace/course/codex-setup/chat-work.vi.md?raw'
import whyCodexCopy from '../../../../../pilot-workspace/course/codex-setup/why-codex.vi.md?raw'
import roomImage from '../../../../../prototypes/mvp-3-course-experience-companion/assets/home-base.png'
import courseStructure from '../../../../../pilot-workspace/course/course-structure.json'
import setupPracticeDefinitionSource from '../../../../../pilot-workspace/course/practices/m1-codex-safe-setup.json'
import setupQuiz from '../../../../../pilot-workspace/course/quizzes/module-1.quiz.json'
import planningQuiz from '../../../../../pilot-workspace/course/quizzes/module-2.quiz.json'
import buildQuiz from '../../../../../pilot-workspace/course/quizzes/module-3.quiz.json'
import releaseQuiz from '../../../../../pilot-workspace/course/quizzes/module-4.quiz.json'
import teacherImage from '../assets/teacher-triet.png'
import m1ApprovalMenuImage from '../../../../../pilot-workspace/course/codex-setup/images/approval-menu.png'
import m1ModelSettingsImage from '../../../../../pilot-workspace/course/codex-setup/images/model-controls.png'
import { ModelLessonBoard, type ModelLessonTopic } from '../components/ModelLessonBoard'
import { ProjectsLessonBoard } from '../components/ProjectsLessonBoard'
import projectsCopy from '../../../../../pilot-workspace/course/codex-setup/projects.vi.json'
import m1AssessmentImage from '../assets/lesson-visuals/m1-assessment.webp'
import m2WhenToPlanImage from '../assets/lesson-visuals/m2-when-to-plan.webp'
import m2ProductRequirementsImage from '../assets/lesson-visuals/m2-product-requirements.webp'
import m2PrdPromptImage from '../assets/lesson-visuals/m2-prd-prompt.webp'
import m2PrdReviewImage from '../assets/lesson-visuals/m2-prd-review.webp'
import m2ImplementationPlanImage from '../assets/lesson-visuals/m2-implementation-plan.webp'
import m2AssessmentImage from '../assets/lesson-visuals/m2-assessment.webp'
import m2PafoliosImage from '../assets/lesson-visuals/m2-pafolios.webp'
import prototypeThumbnail from '../../../../../plan/module-3-prototype/preview.png'
import '../components/course-prototype.css'
import m2AwwwardsImage from '../assets/lesson-visuals/m2-awwwards.webp'
import m3VisibleScreenErrorImage from '../assets/lesson-visuals/m3-visible-screen-error-example.png'
import m3VisibleErrorPromptImage from '../assets/lesson-visuals/m3-visible-error-prompt-example.png'
import m3TerminalLogErrorImage from '../assets/lesson-visuals/m3-terminal-log-error-example.png'
import m3RepeatedErrorCodexPromptImage from '../assets/lesson-visuals/m3-repeated-error-codex-prompt.png'
import m3CommitHistoryImage from '../assets/lesson-visuals/m3-commit-history-example.png'
import m3GitGithubImage from '../assets/lesson-visuals/m3-git-github.png'
import m3GithubPushedCommitsImage from '../assets/lesson-visuals/m3-github-pushed-commits.png'
import m3GithubBranchesImage from '../assets/lesson-visuals/m3-github-branches.png'
import m3GitignoreEnvImage from '../assets/lesson-visuals/m3-gitignore-env.png'
import m4ProjectsOverviewImage from '../assets/lesson-visuals/module-4/vercel-projects-overview.png'
import m4PortfolioVideo from '../assets/lesson-visuals/module-4/vercel-portfolio-captioned.mp4'
import { PracticeBrief } from '../components/PracticeBrief'
import { PracticeStartPrompt } from '../components/PracticeStartPrompt'
import { TeacherWorkspace } from '../components/TeacherWorkspace'
import { OnboardingTour, ONBOARDING_ANCHOR_ATTRIBUTE, type OnboardingTourStep } from '../components/OnboardingTour'
import { LockedRoadmapStage } from '../components/LockedRoadmapStage'
import { TeacherNewDot } from '../components/TeacherNewDot'
import './roadmap-unlock.css'
import {
  ONBOARDING_TOUR_DECISION_KEY,
  readOnboardingTourState,
  shouldShowHomeTour,
  shouldShowLessonTip,
  shouldShowTeacherDot,
  moduleUnlockedBetween,
  TEACHER_CHAT_OPENED_DECISION_KEY,
  OUTLINE_REVIEW_TIP_DECISION_KEY,
  shouldShowOutlineReviewTip,
  type OnboardingTourState
} from '../components/onboarding-tour-rules'
import { DesignReferenceDialogue } from '../components/DesignReferenceDialogue'
import { PortfolioWorkspacePicker } from '../components/PortfolioWorkspacePicker'
import { GitHubPracticeGuide } from '../components/GitHubPracticeGuide'
import { HighlightedDialogue } from '../components/HighlightedDialogue'
import { adjacentOutlinePage, courseOutline, outlineSectionIndex, reviewableOutlinePages, reviewTrail } from '../../../../shared/course/outline'
import {
  registryLessonDefinitions,
  registryLessonPages,
  registryModuleLessonIds,
  registrySceneContent
} from '../course/registry'

type EvidenceItem = {
  label: string
  value: string
  ready?: boolean
}

type PracticeDefinition = {
  practiceId: string
  version: string
  objective: string
  expectedOutcome: string
  reportTitle: string
  requiredSettings: Array<{
    id: string
    label: string
    value: string
  }>
  criteria: Array<{
    id: string
    description: string
    required: boolean
  }>
}

const setupPracticeDefinition: PracticeDefinition = setupPracticeDefinitionSource

type LessonVisual = {
  image: string
  alt: string
  caption?: string
  fit?: 'cover' | 'contain'
  annotations?: ReadonlyArray<{ x: number; y: number; label: string }>
  crop?: { x: number; y: number; width: number; height: number; sourceWidth: number }
}

type Choice = {
  label: string
  next?: SceneId
  primary?: boolean
  preservePrimaryLabel?: boolean
  danger?: boolean
  action?: 'practice' | 'home' | 'review-module'
  afterSave?: 'home'
  decision?: { key: string; value: string }
}

function yellowChoiceLabel(choice: Choice): string {
  if (!choice.primary) return choice.label
  if (choice.preservePrimaryLabel) return choice.label
  if (choice.action === 'practice') return 'Chuyển sang Codex để thực hành'
  if (choice.next) return 'Tiếp tục'
  return choice.label
}

type SceneContent = {
  lessonId: LessonId
  checkpointId: CheckpointId
  step: number
  totalSteps: number
  lessonLabel: string
  mission: string
  objective: string
  panelLabel: string
  panelStatus: string
  tone: 'neutral' | 'bad' | 'good'
  request: string
  evidence: EvidenceItem[]
  dialogue?: string
  highlightTerms?: readonly string[]
  choices: Choice[]
  copyPrompt?: string
  copyPromptLabel?: string
  copyPromptTitle?: string
  practice?: PracticeDefinition
  assessmentQuestionId?: string
  assessmentGroupId?: string
  assessmentSummary?: boolean
  showTitle?: boolean
  showPanel?: boolean
}

type AssessmentSource = {
  kind?: 'authoritative-source' | 'curriculum-judgment'
  label: string
  url: string
  basis: string
}

type ChoiceAssessmentQuestion = {
  id: string
  sceneId: SceneId
  type: 'multiple-choice'
  prompt: string
  choices: string[]
  answerIndex: number
  explanation: string
  source: AssessmentSource
}

type WrittenAssessmentQuestion = {
  id: string
  sceneId: SceneId
  type: 'short-answer' | 'artifact-answer'
  prompt: string
  criteria: string[]
  explanation: string
  source: AssessmentSource
}

type AssessmentQuestion = ChoiceAssessmentQuestion | WrittenAssessmentQuestion

type AssessmentGroup = {
  id: string
  title: string
  placement: string
  mode: 'formative' | 'mastery'
  passingScore?: number
  questions: AssessmentQuestion[]
}

const setupAssessmentGroup: AssessmentGroup = {
  id: 'setup-final-assessment',
  title: setupQuiz.title,
  placement: 'Cuối Module 1',
  mode: 'mastery',
  passingScore: setupQuiz.passingScore / setupQuiz.questions.length,
  questions: setupQuiz.questions.map((question, index) => ({
    ...question,
    sceneId: `module-1-final-${index + 1}` as SceneId,
    explanation: question.explanation ?? 'Hãy tự đối chiếu câu trả lời với các tiêu chí và nguồn chính thức.',
    ...('expectedSignals' in question ? { criteria: question.expectedSignals } : {})
  })) as AssessmentQuestion[]
}

const assessmentGroups = [
  setupAssessmentGroup,
  ...(planningQuiz.groups as AssessmentGroup[]),
  ...(buildQuiz.groups as AssessmentGroup[]),
  ...(releaseQuiz.groups as AssessmentGroup[])
]
const assessmentQuestions = assessmentGroups.flatMap((group) => group.questions)
const assessmentQuestionById = new Map(assessmentQuestions.map((question) => [question.id, question]))
const assessmentGroupById = new Map(assessmentGroups.map((group) => [group.id, group]))
const assessmentDecisionKey = (questionId: string) => `assessment:${questionId}`

const openingScene = {
  lessonId: 'module-1', checkpointId: 'm1-codex-orientation', step: 1, totalSteps: 6,
  lessonLabel: 'MODULE 1 · THIẾT LẬP CODEX', tone: 'neutral',
  panelLabel: '', panelStatus: '', request: '', evidence: [], showTitle: false, showPanel: false
} satisfies Partial<SceneContent>

const staticScenes: Partial<Record<SceneId, SceneContent>> = {
  'intro-visual-onboarding': {
    lessonId: 'intro',
    checkpointId: 'intro-visual-onboarding',
    step: 1,
    totalSteps: 1,
    lessonLabel: 'GIỚI THIỆU KHÓA HỌC',
    mission: 'Giới thiệu khóa học',
    objective: 'Bạn sẽ xây gì trong khóa học này?',
    panelLabel: 'PORTFOLIO',
    panelStatus: 'TRANG 1/2',
    tone: 'neutral',
    request: 'Portfolio bạn sẽ xây trong khóa học',
    evidence: [
      { label: 'DỰ ÁN', value: 'Portfolio cá nhân' },
      { label: 'KẾT QUẢ', value: 'Một web portfolio thật' },
      { label: 'NGƯỜI XEM', value: 'Nhà tuyển dụng' }
    ],
    dialogue: 'Trong khoá học này, bạn sẽ được học cách dùng coding agents thông qua một dự án thực hành: Xây Portfolio cá nhân.',
    choices: [{ label: 'Tiếp tục', next: 'intro-course-overview-2', primary: true }],
    showTitle: false,
    showPanel: false
  },
  'intro-course-overview-2': {
    lessonId: 'intro',
    checkpointId: 'intro-visual-onboarding',
    step: 1,
    totalSteps: 1,
    lessonLabel: 'GIỚI THIỆU KHÓA HỌC',
    mission: 'Giới thiệu khóa học',
    objective: 'Bạn sẽ xây gì trong khóa học này?',
    panelLabel: 'CÁCH HỌC',
    panelStatus: 'WEB PORTFOLIO THẬT',
    tone: 'neutral',
    request: 'Kết quả bạn sẽ có vào cuối khóa',
    evidence: [
      { label: 'SẢN PHẨM', value: 'Web portfolio' },
      { label: 'MỤC ĐÍCH', value: 'Gửi nhà tuyển dụng' },
      { label: 'QUYỀN DUYỆT', value: 'Thuộc về bạn' }
    ],
    dialogue: 'Cuối khoá này, bạn sẽ có một web portfolio thật để có thể gửi cho nhà tuyển dụng.',
    choices: [{ label: 'Bắt đầu khóa học', next: 'intro-learning-method', primary: true }],
    showTitle: false,
    showPanel: false
  },
  'intro-learning-method': {
    lessonId: 'intro',
    checkpointId: 'intro-visual-onboarding',
    step: 1,
    totalSteps: 1,
    lessonLabel: 'GIỚI THIỆU KHÓA HỌC',
    mission: 'Giới thiệu khóa học',
    objective: 'Bạn sẽ học như thế nào?',
    panelLabel: 'MODULE 1',
    panelStatus: 'THIẾT LẬP CODEX',
    tone: 'neutral',
    request: 'Codex → approval → model → reasoning → Practice',
    evidence: [
      { label: 'KIẾN THỨC CODE', value: 'Chưa cần' },
      { label: 'DỮ LIỆU', value: 'Chưa cần chuẩn bị' },
      { label: 'KẾT QUẢ', value: 'Cấu hình được Triết duyệt' }
    ],
    dialogue: 'Những kỹ năng bạn học được trong khoá này không chỉ giúp bạn xây Portfolio, mà còn trang bị cho bạn kiến thức để tạo bất kỳ công cụ nào bạn muốn với AI',
    choices: [{ label: 'Bắt đầu Module 1', next: 'module-1-chat-work', afterSave: 'home', primary: true, preservePrimaryLabel: true }],
    showTitle: false,
    showPanel: false
  },
  'module-1-chat-work': {
    ...openingScene,
    mission: 'Chat và Work',
    objective: 'Chat và Work',
    dialogue: chatWorkCopy,
    choices: [{ label: 'Tiếp tục', next: 'module-1-why-codex', primary: true }]
  },
  'module-1-why-codex': {
    ...openingScene,
    mission: 'Codex',
    objective: 'Codex',
    dialogue: whyCodexCopy,
    choices: [{ label: 'Tiếp tục', next: 'module-1-codex-examples', primary: true }]
  },
  'module-1-codex-examples': {
    lessonId: 'module-1',
    checkpointId: 'm1-codex-orientation',
    step: 1,
    totalSteps: 6,
    lessonLabel: 'MODULE 1 · THIẾT LẬP CODEX',
    mission: 'Làm quen với giao diện Codex',
    objective: 'Bạn quyết định khi nào Codex cần xin phép',
    panelLabel: 'APPROVAL',
    panelStatus: 'BẠN GIỮ QUYỀN QUYẾT ĐỊNH',
    tone: 'neutral',
    request: 'Approval cho biết khi nào Codex cần dừng để xin phép.',
    evidence: [
      { label: 'VỊ TRÍ', value: 'Bên dưới ô soạn tin' },
      { label: 'VAI TRÒ', value: 'Kiểm soát quyền hành động' },
      { label: 'HỌC KỸ HƠN', value: 'Ở phần Approval' }
    ],
    dialogue: 'Được rồi, vậy chúng ta sẽ bắt đầu tìm hiểu Codex cùng nhau nha. Đầu tiên, hãy nhìn qua Approval. Khi nhấn vào biểu tượng Codex bên trái dấu cộng, bạn sẽ thấy một hộp gồm ba lựa chọn. Đây là phần cài đặt Approval, nơi bạn thiết lập mức độ kiểm soát đối với coding agent.\n\nTrước tiên, Ask for approval luôn hỏi bạn trước khi chỉnh sửa tệp bên ngoài dự án hoặc sử dụng Internet. Tiếp theo, Approve for me chỉ hỏi khi phát hiện một hành động có thể không an toàn. Cuối cùng, Full access cho phép Codex truy cập Internet và mọi tệp trên máy tính mà không bị giới hạn.\n\nNếu mới bắt đầu, mình khuyên bạn dùng Approve for me. Chế độ này không yêu cầu bạn duyệt mọi hành động, nhưng cũng không trao toàn bộ quyền kiểm soát cho coding agent.',
    choices: [{ label: 'Tiếp theo: Model', next: 'module-1-codex-model-intro', primary: true }]
  },
  'module-1-codex-model-intro': {
    lessonId: 'module-1',
    checkpointId: 'm1-codex-orientation',
    step: 1,
    totalSteps: 6,
    lessonLabel: 'MODULE 1 · THIẾT LẬP CODEX',
    mission: 'Làm quen với giao diện Codex',
    objective: 'Model, Effort và Speed: chọn thế nào?',
    panelLabel: 'MODEL',
    panelStatus: 'CHỌN CÁCH CODEX XỬ LÝ CÔNG VIỆC',
    tone: 'neutral',
    request: 'Xem Model, Effort và Speed đang dùng cho task.',
    evidence: [
      { label: 'MODEL', value: 'Khả năng chính' },
      { label: 'EFFORT', value: 'Mức suy luận' },
      { label: 'SPEED', value: 'Tốc độ xử lý' }
    ],
    dialogue: 'Ở góc dưới bên phải, ngay cạnh nút microphone, bạn sẽ thấy menu Model, Effort và Speed. Màn hình này giải thích từng lựa chọn, các trường hợp sử dụng và cấu hình mình đề xuất cho ContentPilot.',
    choices: [{ label: 'Tiếp theo: Effort và Speed', next: 'module-1-codex-effort-speed', primary: true }]
  },
  'module-1-codex-effort-speed': {
    lessonId: 'module-1',
    checkpointId: 'm1-codex-orientation',
    step: 1,
    totalSteps: 6,
    lessonLabel: 'MODULE 1 · THIẾT LẬP CODEX',
    mission: 'Làm quen với giao diện Codex',
    objective: 'Effort và Speed',
    panelLabel: 'EFFORT · SPEED',
    panelStatus: 'CHỌN MỨC SUY LUẬN VÀ TỐC ĐỘ',
    tone: 'neutral',
    request: 'Xem Effort và Speed đang dùng cho task.',
    evidence: [
      { label: 'EFFORT', value: 'Mức suy luận' },
      { label: 'SPEED', value: 'Tốc độ xử lý' },
      { label: 'ĐỀ XUẤT', value: 'Medium hoặc High · Standard' }
    ],
    dialogue: 'Effort điều chỉnh mức suy luận của model. Speed điều chỉnh tốc độ xử lý và mức dùng credit. Với ContentPilot, mình đề xuất Effort Medium hoặc High và Speed Standard.',
    choices: [{ label: 'Tiếp theo: AGENTS.md', next: 'module-1-agents-intro', primary: true }]
  },
  'module-1-agents-intro': {
    lessonId: 'module-1',
    checkpointId: 'm1-agents-and-skills',
    step: 2,
    totalSteps: 6,
    lessonLabel: 'MODULE 1 · AGENTS.MD VÀ SKILLS',
    mission: 'AGENTS.md và hai level',
    objective: 'Lưu thông tin để agent ghi nhớ qua nhiều task',
    panelLabel: 'AGENTS.md',
    panelStatus: 'BỘ QUY LUẬT CHO CODING AGENTS',
    tone: 'neutral',
    request: 'Global đặt nguyên tắc chung. Current repo bổ sung quy tắc cho dự án đang mở.',
    evidence: [
      { label: 'GLOBAL', value: 'Áp dụng cho mọi repo' },
      { label: 'CURRENT REPO', value: 'Chỉ áp dụng cho repo đang mở' }
    ],
    dialogue: 'Vậy, giả dụ có một thông tin mình muốn agent ghi nhớ mà không cần phải nhắc đi nhắc lại thì mình sẽ làm gì? Bạn có thể lưu thông tin đó trong AGENTS.md. Đây là một tệp văn bản chứa các quy tắc và thông tin coding agent cần biết trước khi bắt đầu công việc. Codex đọc tệp này để hiểu cách bạn muốn dự án được xử lý.',
    choices: [{ label: 'Tiếp theo: hai level AGENTS.md', next: 'module-1-agents-levels', primary: true }]
  },
  'module-1-agents-levels': {
    lessonId: 'module-1',
    checkpointId: 'm1-agents-and-skills',
    step: 2,
    totalSteps: 6,
    lessonLabel: 'MODULE 1 · AGENTS.MD VÀ SKILLS',
    mission: 'Hai level AGENTS.md',
    objective: 'Biết AGENTS.md nằm ở đâu và áp dụng cho dự án nào',
    panelLabel: 'AGENTS.md',
    panelStatus: 'GLOBAL VÀ CURRENT REPO',
    tone: 'neutral',
    request: 'Global đặt nguyên tắc chung. Current repo bổ sung quy tắc cho dự án đang mở.',
    evidence: [
      { label: 'GLOBAL', value: 'Áp dụng cho mọi repo' },
      { label: 'CURRENT REPO', value: 'Chỉ áp dụng cho repo đang mở' }
    ],
    dialogue: 'Hai level AGENTS.md bạn cần biết. Global (~/.codex/AGENTS.md) áp dụng cho bất kỳ dự án nào mà bạn xây dựng với coding agent sau này. Current repo (AGENTS.md) chỉ áp dụng cho dự án hiện tại. Ở Module 2, Course Companion sẽ tạo sẵn một tệp AGENTS.md cho thư mục portfolio của bạn.',
    choices: [{ label: 'Tiếp theo: Skill', next: 'module-1-skills-intro', primary: true }]
  },
  'module-1-skills-intro': {
    lessonId: 'module-1',
    checkpointId: 'm1-agents-and-skills',
    step: 2,
    totalSteps: 6,
    lessonLabel: 'MODULE 1 · AGENTS.MD VÀ SKILLS',
    mission: 'Skill là gì?',
    objective: 'Dạy coding agent cách thực hiện một loại công việc',
    panelLabel: 'SKILL',
    panelStatus: 'QUY TRÌNH CHUYÊN BIỆT CHO CODING AGENTS',
    tone: 'neutral',
    request: 'Mỗi skill hướng dẫn một loại công việc theo quy trình có thể dùng lại.',
    evidence: [
      { label: 'IMPECCABLE', value: 'Thiết kế và kiểm tra giao diện' },
      { label: 'COPYWRITING', value: 'Viết nội dung dựa trên thông tin thật' }
    ],
    dialogue: 'Thông thường ta dùng AGENTS.md để dạy cho model làm theo những hành động ta muốn mà ta không cần phải nhắc đi nhắc lại. Nhưng giả dụ ta muốn nó làm những tác vụ cụ thể như viết lách, thì sao? Chả lẽ ta viết hết tất cả những mẹo viết hay vào AGENTS.md? Và giả dụ ta có 100 kỹ năng muốn agents học thì sao? Ta không thể dùng một file AGENTS.md để dạy coding agents tất cả kỹ năng mà ta muốn nó học. Đó là lúc ta sử dụng Skill.',
    choices: [{ label: 'Tiếp theo: hai skill cho portfolio', next: 'module-1-skills-portfolio', primary: true }]
  },
  'module-1-skills-portfolio': {
    lessonId: 'module-1',
    checkpointId: 'm1-agents-and-skills',
    step: 2,
    totalSteps: 6,
    lessonLabel: 'MODULE 1 · AGENTS.MD VÀ SKILLS',
    mission: 'Skills cho portfolio',
    objective: 'Biết hai skill sẽ được dùng trong khóa học',
    panelLabel: 'SKILL',
    panelStatus: 'IMPECCABLE VÀ COPYWRITING',
    tone: 'neutral',
    request: 'Mỗi skill hỗ trợ một loại công việc cụ thể trong portfolio.',
    evidence: [
      { label: 'IMPECCABLE', value: 'Thiết kế và kiểm tra giao diện' },
      { label: 'COPYWRITING', value: 'Viết nội dung dựa trên thông tin thật' }
    ],
    dialogue: 'Trong quá trình xây portfolio, bạn sẽ dùng impeccable cho giao diện và copywriting cho nội dung. Bạn cũng có thể tự khám phá thêm skill tại skills.sh.',
    choices: [{ label: 'Tiếp tục', next: 'module-1-codex-projects', primary: true }]
  },
  'module-1-codex-projects': {
    lessonId: 'module-1',
    checkpointId: 'm1-agents-and-skills',
    step: 2,
    totalSteps: 6,
    lessonLabel: 'MODULE 1 · THIẾT LẬP CODEX',
    mission: projectsCopy.title,
    objective: projectsCopy.title,
    panelLabel: 'PROJECTS',
    panelStatus: '',
    tone: 'neutral',
    request: projectsCopy.introduction[0]!,
    evidence: [],
    dialogue: [...projectsCopy.introduction, ...projectsCopy.details].join('\n\n'),
    practice: setupPracticeDefinition,
    choices: [{ label: 'Tiếp theo: thực hành cấu hình', next: 'module-1-setup-checklist', action: 'practice', primary: true }]
  },
  'module-1-setup-checklist': {
    lessonId: 'module-1',
    checkpointId: 'm1-setup-checklist',
    step: 4,
    totalSteps: 6,
    lessonLabel: 'MODULE 1 · THIẾT LẬP CODEX',
    mission: 'Nộp cấu hình để Triết duyệt',
    objective: 'Chứng minh cấu hình thật trong Codex',
    panelLabel: 'PRACTICE · METADATA TRỰC TIẾP',
    panelStatus: 'KHÔNG CẦN ẢNH CHỤP',
    tone: 'neutral',
    request: 'Kiểm tra Effort và Approval ngay trong task Codex của bài.',
    evidence: [
      { label: 'CẤU HÌNH', value: 'Medium hoặc High' },
      { label: 'QUYỀN', value: 'Approve for me' },
      { label: 'BẰNG CHỨNG', value: 'Metadata đúng task và còn mới' }
    ],
    dialogue: 'Course Companion sẽ mở một task riêng bằng cấu hình mặc định và chưa gửi prompt nào. Trong task đó, kiểm tra Effort là Medium hoặc High và Approval là Approve for me. Nếu hai mục đã đúng, bấm Nộp bài. Bạn tự chọn Model và có thể nộp ngay trong Course Companion.',
    practice: setupPracticeDefinition,
    choices: [{ label: 'Sang Codex thiết lập cấu hình', action: 'practice', primary: true }]
  },
  'module-1-mastery': {
    lessonId: 'module-1',
    checkpointId: 'm1-mastery',
    step: 5,
    totalSteps: 6,
    lessonLabel: 'MODULE 1 · THIẾT LẬP CODEX',
    mission: 'Ôn tập cuối Module 1',
    objective: 'Sẵn sàng cho 4 câu ôn tập',
    panelLabel: 'PRACTICE ĐÃ ĐƯỢC DUYỆT',
    panelStatus: 'ĐÃ ĐẠT · TIẾP TỤC ÔN TẬP',
    tone: 'good',
    request: 'Bốn câu tiếp theo yêu cầu bạn giải thích, áp dụng hoặc phân tích kiến thức vừa học.',
    evidence: [
      { label: 'EFFORT', value: 'Medium hoặc High', ready: true },
      { label: 'QUYỀN', value: 'Approve for me', ready: true }
    ],
    dialogue: 'Bây giờ hãy cùng nhau trả lời các câu hỏi ôn tập để củng cố kiến thức vừa học nhen!',
    choices: [{ label: 'Bắt đầu 4 câu ôn tập', next: 'module-1-final-1', primary: true, decision: { key: 'setupPractice', value: 'teacher-reviewed-setup' } }],
    showTitle: false,
    showPanel: false
  },
  'module-2-why-planning': {
    lessonId: 'module-2',
    checkpointId: 'm2-why-planning',
    step: 1,
    totalSteps: 8,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Planning trước khi code',
    objective: 'Vì sao planning giúp bạn tiết kiệm thời gian?',
    panelLabel: 'Ý TƯỞNG BAN ĐẦU',
    panelStatus: 'CÒN NHIỀU ĐIỂM MƠ HỒ',
    tone: 'neutral',
    request: '“Hãy xây cho tôi một ứng dụng tạo ý tưởng nội dung.”',
    evidence: [
      { label: 'WORKFLOW', value: 'Chưa rõ' },
      { label: 'PHẠM VI V1', value: 'Chưa rõ' },
      { label: 'DONE WHEN', value: 'Chưa có' }
    ],
    // Keep this wording verbatim with pilot-workspace/course/lesson-scripts/module-2.script.vi.md.
    dialogue: 'Cũng giống như con người, có một kế hoạch kỹ càng trước khi xây sẽ giúp coding agent tránh phạm những sai lầm ngớ ngẩn sau này. Nó tưởng chừng tốn thời gian, nhưng thực chất planning kỹ sẽ giúp bạn đỡ phải debug và sửa một ứng dụng không vừa ý mình. Tin mình đi, sửa một ứng dụng đã đi sai hướng sẽ tốn thời gian hơn nhiều so với planning kỹ ngay từ đầu.\n\nKhông phải việc nào cũng cần planning. Bạn có thể giao trực tiếp cho coding agent nếu yêu cầu nhỏ và kết quả đã rõ. Hãy lập kế hoạch trước khi bắt đầu xây một sản phẩm mới. Bạn cũng nên planning nếu chưa xác định được hướng đi hoặc thứ tự thực hiện.',
    choices: [{ label: 'Xem khi nào cần planning', next: 'module-2-planning-example', primary: true }],
    showPanel: false
  },
  'module-2-planning-example': {
    lessonId: 'module-2',
    checkpointId: 'm2-why-planning',
    step: 1,
    totalSteps: 8,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Planning trước khi code',
    objective: 'Nhận ra công việc nào cần planning',
    panelLabel: 'NGUỒN PHƯƠNG PHÁP · MICROSOFT',
    panelStatus: 'KHÔNG PHẢI VIỆC NÀO CŨNG CẦN PLANNING',
    tone: 'neutral',
    request: 'Planning có ích khi yêu cầu còn mơ hồ, có nhiều điều chưa biết hoặc chưa thể chỉ ra đầy đủ các bước.',
    evidence: [
      { label: 'YÊU CẦU', value: 'Còn mơ hồ' },
      { label: 'ĐIỀU CHƯA BIẾT', value: 'Còn nhiều' },
      { label: 'CÁC BƯỚC', value: 'Chưa thể liệt kê' }
    ],
    dialogue: 'Hướng dẫn thiết kế của Microsoft khuyên chỉ planning khi công việc thật sự cần. Ví dụ, tạo một ứng dụng mới từ đầu cần planning vì luồng sử dụng, đầu vào, đầu ra và phạm vi phiên bản đầu còn phải được quyết định. Ngược lại, bạn có thể giao trực tiếp việc sửa chữ hoặc màu của một nút nhỏ khi vị trí và kết quả mới đã rõ.',
    choices: [{
      label: 'Áp dụng vào ContentPilot',
      next: 'module-2-contentpilot-brief',
      primary: true,
      decision: { key: 'planningApproach', value: 'plan-first' }
    }]
  },
  'module-2-why-planning-check': {
    lessonId: 'module-2',
    checkpointId: 'm2-why-planning',
    step: 1,
    totalSteps: 8,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Planning trước khi code',
    objective: 'Khi nào một yêu cầu nên được planning trước?',
    panelLabel: 'KIỂM TRA NHANH',
    panelStatus: 'SAU PHẦN GIẢI THÍCH VÀ VÍ DỤ',
    tone: 'neutral',
    request: 'Chọn dấu hiệu cho thấy coding agent cần làm rõ công việc trước khi viết code.',
    evidence: [
      { label: 'VIỆC NHỎ', value: 'Có thể giao trực tiếp' },
      { label: 'NHIỀU QUYẾT ĐỊNH', value: 'Nên planning' },
      { label: 'NHIỀU BƯỚC', value: 'Nên planning' }
    ],
    dialogue: 'Theo bạn, dấu hiệu nào cho thấy một yêu cầu nên được planning trước?',
    choices: [
      { label: 'Một thay đổi nhỏ, rõ ràng và dễ hoàn tác', next: 'module-2-planning-cost', danger: true },
      { label: 'Một công việc còn nhiều quyết định chưa rõ hoặc nhiều bước phụ thuộc nhau', next: 'module-2-contentpilot-brief', primary: true, decision: { key: 'planningApproach', value: 'plan-first' } }
    ]
  },
  'module-2-planning-cost': {
    lessonId: 'module-2',
    checkpointId: 'm2-why-planning',
    step: 1,
    totalSteps: 8,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Planning trước khi code',
    objective: 'Phân biệt việc nhỏ với việc cần planning',
    panelLabel: 'YÊU CẦU NHỎ',
    panelStatus: 'CÓ THỂ GIAO TRỰC TIẾP',
    tone: 'neutral',
    request: 'Một thay đổi nhỏ, rõ ràng và dễ hoàn tác có thể giao trực tiếp.',
    evidence: [
      { label: 'PHẠM VI', value: 'Nhỏ' },
      { label: 'YÊU CẦU', value: 'Rõ ràng' },
      { label: 'HOÀN TÁC', value: 'Dễ' }
    ],
    dialogue: 'Không phải việc nào cũng cần planning. Nếu yêu cầu nhỏ và dễ làm lại khi có lỗi, bạn có thể giao trực tiếp cho coding agent. Tuy nhiên, khi bắt đầu xây một sản phẩm hoặc khi công việc còn nhiều quyết định chưa rõ và nhiều bước phụ thuộc nhau, hãy lập kế hoạch trước. Nhờ đó, coding agent có thể hiểu đúng vấn đề rồi mới viết code.',
    choices: [{ label: 'Xem lại dấu hiệu cần planning', next: 'module-2-why-planning-check', primary: true }]
  },
  'module-2-contentpilot-brief': {
    lessonId: 'module-2',
    checkpointId: 'm2-contentpilot-brief',
    step: 2,
    totalSteps: 8,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Làm rõ ý tưởng ContentPilot',
    objective: 'Nhìn ra điều còn thiếu trong một ý tưởng',
    panelLabel: 'Ý TƯỞNG CONTENTPILOT',
    panelStatus: 'MỘT CÂU KHỞI ĐẦU',
    tone: 'neutral',
    request: 'Phân tích bài viết hiện có trên profile — hoặc profile mẫu — rồi đề xuất ý tưởng có khả năng bắt kịp xu hướng.',
    evidence: [
      { label: 'ĐẦU VÀO', value: 'Cần làm rõ' },
      { label: 'ĐẦU RA', value: 'Cần làm rõ' },
      { label: 'PHẠM VI V1', value: 'Cần quyết định' }
    ],
    dialogue: 'Đây mới là ý tưởng, chưa phải kế hoạch. Ta còn cần làm rõ luồng sử dụng, đầu vào, đầu ra, phạm vi phiên bản đầu và dấu hiệu hoàn thành. PRD sẽ giữ các quyết định đó trước khi coding agent đề xuất cách xây.',
    choices: [{ label: 'Tìm hiểu PRD', next: 'module-2-prd-concept', primary: true, decision: { key: 'clarificationFocus', value: 'product-requirements' } }]
  },
  'module-2-implementation-too-soon': {
    lessonId: 'module-2',
    checkpointId: 'm2-contentpilot-brief',
    step: 2,
    totalSteps: 8,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Làm rõ ý tưởng ContentPilot',
    objective: 'Chưa vội chọn cách xây',
    panelLabel: 'QUYẾT ĐỊNH QUÁ SỚM',
    panelStatus: 'BIẾT CÁCH XÂY · CHƯA BIẾT XÂY GÌ',
    tone: 'bad',
    request: 'Chọn công nghệ không thể thay thế quyết định về sản phẩm cần tạo ra kết quả gì.',
    evidence: [
      { label: 'WORKFLOW', value: 'Vẫn chưa rõ' },
      { label: 'OUTPUT', value: 'Vẫn chưa rõ' },
      { label: 'DONE WHEN', value: 'Vẫn chưa có' }
    ],
    dialogue: 'Ở Module 2, bạn chỉ cần quyết định sản phẩm cần làm gì. Coding agent sẽ đề xuất cách xây ở implementation plan sau.',
    choices: [{ label: 'Làm rõ yêu cầu sản phẩm', next: 'module-2-prd-concept', primary: true, decision: { key: 'clarificationFocus', value: 'product-requirements' } }]
  },
  'module-2-prd-concept': {
    lessonId: 'module-2',
    checkpointId: 'm2-prd-concept',
    step: 3,
    totalSteps: 8,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Hiểu PRD trước khi phân loại',
    objective: 'PRD giữ những quyết định nào?',
    panelLabel: 'PRD MỘT TRANG',
    panelStatus: '8 PHẦN CẦN CÓ',
    tone: 'neutral',
    request: 'Ý tưởng · luồng sử dụng · đầu vào · đầu ra · phạm vi V1 · ngoài phạm vi · Done When · câu hỏi còn mở.',
    evidence: [
      { label: 'MỤC ĐÍCH', value: 'Làm rõ sản phẩm' },
      { label: 'PHẠM VI', value: 'Trong và ngoài V1' },
      { label: 'DONE WHEN', value: 'Kiểm tra được' }
    ],
    dialogue: 'PRD mô tả sản phẩm cần đạt kết quả gì, vì sao sản phẩm cần tồn tại, phạm vi phiên bản đầu và cách nhận biết sản phẩm đã đáp ứng yêu cầu. PRD chưa quyết định code hoặc công nghệ.',
    choices: [{ label: 'Xem một ví dụ PRD', next: 'module-2-prd-example', primary: true }]
  },
  'module-2-prd-example': {
    lessonId: 'module-2',
    checkpointId: 'm2-prd-concept',
    step: 3,
    totalSteps: 8,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Hiểu PRD trước khi phân loại',
    objective: 'Từ giả định đến yêu cầu sản phẩm',
    panelLabel: 'VÍ DỤ TỪ ATLASSIAN',
    panelStatus: 'GIẢ ĐỊNH → YÊU CẦU',
    tone: 'neutral',
    request: 'Giả định: phần lớn người dùng truy cập bằng máy tính bảng. Yêu cầu: giao diện phải hiển thị tốt trên máy tính bảng.',
    evidence: [
      { label: 'GIẢ ĐỊNH', value: 'Dùng máy tính bảng' },
      { label: 'YÊU CẦU', value: 'Hiển thị tốt' },
      { label: 'PHẠM VI', value: 'Ghi rõ giới hạn' }
    ],
    dialogue: 'Mẫu PRD của Atlassian còn dành chỗ cho câu hỏi chưa có đáp án và những gì nằm ngoài phạm vi. Nhờ vậy, nhóm biết điều gì đã được quyết định và điều gì chưa được phép tự thêm vào sản phẩm.',
    choices: [{ label: 'Cho coding agent xem ví dụ', next: 'module-2-prd-visual-examples', primary: true }]
  },
  'module-2-prd-visual-examples': {
    lessonId: 'module-2',
    checkpointId: 'm2-prd-concept',
    step: 3,
    totalSteps: 8,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Làm PRD rõ hơn bằng ví dụ',
    objective: 'Cho coding agent xem ví dụ bằng hình ảnh',
    panelLabel: 'VÍ DỤ BẰNG HÌNH ẢNH',
    panelStatus: 'CHỌN ĐÚNG · NÓI RÕ',
    tone: 'neutral',
    request: 'Pinterest: tìm ý tưởng · Mobbin: xem màn hình và luồng thật · Dribbble: xem bản thiết kế giao diện.',
    evidence: [
      { label: 'CHỌN', value: 'Ảnh liên quan' },
      { label: 'NÓI RÕ', value: 'Điều muốn học theo' },
      { label: 'TRÁNH', value: 'Ảnh không liên quan' }
    ],
    dialogue: 'Ảnh chụp hoặc bản thiết kế giúp coding agent nhìn thấy bố cục, cách sắp xếp thông tin và luồng bạn muốn. OpenAI Docs khuyên dùng ảnh rõ ràng và đưa thêm các trạng thái thật sự cần thiết. Khi gửi ảnh, hãy nói rõ bạn muốn học theo phần nào thay vì chỉ bảo “làm giống ảnh này”.',
    choices: [{ label: 'Xem ví dụ bằng code', next: 'module-2-prd-code-examples', primary: true }]
  },
  'module-2-prd-code-examples': {
    lessonId: 'module-2',
    checkpointId: 'm2-prd-concept',
    step: 3,
    totalSteps: 8,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Làm PRD rõ hơn bằng ví dụ',
    objective: 'Cho coding agent xem ví dụ bằng code',
    panelLabel: 'VÍ DỤ BẰNG CODE',
    panelStatus: 'CHỈ ĐÚNG PHẦN CẦN XEM',
    tone: 'neutral',
    request: 'Đoạn HTML · thành phần giao diện · repository có giấy phép phù hợp.',
    evidence: [
      { label: 'CHỈ RÕ', value: 'Tệp hoặc đoạn code' },
      { label: 'MUỐN HỌC', value: 'Cách sắp xếp, hoạt động' },
      { label: 'GIẤY PHÉP', value: 'Kiểm tra trước' }
    ],
    dialogue: 'Một đoạn HTML, một thành phần giao diện hoặc repository có thể cho coding agent thấy cách sắp xếp và cách phần đó hoạt động. Hãy chỉ đúng phần cần xem và nói rõ điều muốn học theo. Ví dụ không bắt agent dùng cùng cách xây. Với repository công khai, hãy kiểm tra giấy phép trước khi dùng lại code.',
    choices: [{ label: 'Làm 3 câu kiểm tra Planning và PRD', next: 'module-2-check-planning-prd-1', primary: true }]
  },
  'module-2-prd-check': {
    lessonId: 'module-2',
    checkpointId: 'm2-prd-concept',
    step: 3,
    totalSteps: 8,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Phân biệt PRD và implementation plan',
    objective: 'Biết tài liệu nào giữ quyết định phạm vi',
    panelLabel: 'HAI TÀI LIỆU',
    panelStatus: 'SẢN PHẨM · CÁCH THỰC HIỆN',
    tone: 'neutral',
    request: 'PRD giữ quyết định về sản phẩm. Implementation plan giữ các bước thực hiện và kiểm tra.',
    evidence: [
      { label: 'PRD', value: 'Sản phẩm cần đạt gì?' },
      { label: 'PLAN', value: 'Thực hiện thế nào?' },
      { label: 'THỨ TỰ', value: 'PRD trước' }
    ],
    dialogue: 'Câu “Phiên bản đầu chưa tự động đăng bài” thuộc tài liệu nào?',
    choices: [
      { label: 'Implementation plan', next: 'module-2-prd-misclassification', danger: true },
      { label: 'PRD · Đây là quyết định phạm vi', next: 'module-2-prd-interview', primary: true, decision: { key: 'prdClassification', value: 'scope-in-prd' } }
    ]
  },
  'module-2-prd-misclassification': {
    lessonId: 'module-2',
    checkpointId: 'm2-prd-concept',
    step: 3,
    totalSteps: 8,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Phân biệt PRD và implementation plan',
    objective: 'Đưa quyết định phạm vi về đúng tài liệu',
    panelLabel: 'PHÂN LOẠI CHƯA ĐÚNG',
    panelStatus: 'ĐÂY LÀ PHẠM VI SẢN PHẨM',
    tone: 'bad',
    request: '“Chưa tự động đăng bài” mô tả điều phiên bản đầu chủ động không làm, không phải một bước kỹ thuật.',
    evidence: [
      { label: 'LOẠI QUYẾT ĐỊNH', value: 'Ngoài phạm vi' },
      { label: 'TÀI LIỆU', value: 'PRD', ready: true },
      { label: 'LÝ DO', value: 'Xác định xây gì' }
    ],
    dialogue: 'Hãy ghi quyết định này trong phần ngoài phạm vi của PRD.',
    choices: [{ label: 'Đưa vào PRD', next: 'module-2-prd-interview', primary: true, decision: { key: 'prdClassification', value: 'scope-in-prd' } }]
  },
  'module-2-prd-interview': {
    lessonId: 'module-2',
    checkpointId: 'm2-prd-interview',
    step: 4,
    totalSteps: 8,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Hiểu prompt trước khi tự viết',
    objective: 'Một prompt planning cần nói rõ điều gì?',
    panelLabel: '5 CÂU HỎI DỄ NHỚ',
    panelStatus: 'LỜI GIAO VIỆC RÕ RÀNG',
    tone: 'neutral',
    request: 'Muốn agent làm gì? · Agent cần biết gì? · Làm việc thế nào? · Không được tự làm gì? · Kết quả cần có gì?',
    evidence: [
      { label: 'VIỆC CẦN LÀM', value: 'Nói rõ' },
      { label: 'CÁCH LÀM VIỆC', value: 'Nói rõ' },
      { label: 'KẾT QUẢ CUỐI', value: 'Nói rõ' }
    ],
    dialogue: 'Prompt là lời giao việc cho coding agent. Prompt engineering là cách làm lời giao việc đó đủ rõ để agent hiểu đúng và trả lại kết quả bạn có thể kiểm tra. Không phải prompt nào cũng cần dài; năm câu hỏi này hữu ích khi công việc có nhiều quyết định.',
    choices: [{ label: 'Xem một prompt có nguồn', next: 'module-2-prompt-example', primary: true }]
  },
  'module-2-prompt-example': {
    lessonId: 'module-2',
    checkpointId: 'm2-prd-interview',
    step: 4,
    totalSteps: 8,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Hiểu prompt trước khi tự viết',
    objective: 'Nhìn thấy từng phần trong một prompt',
    panelLabel: 'VÍ DỤ TỪ OPENAI DOCS',
    panelStatus: 'VIỆC LÀM · BẰNG CHỨNG · KẾT QUẢ',
    tone: 'neutral',
    request: 'Xem xét kế hoạch chuyển dữ liệu · tìm nguy cơ mất dữ liệu hoặc gián đoạn · dẫn lại bước liên quan · xếp năm rủi ro quan trọng nhất.',
    evidence: [
      { label: 'VIỆC CẦN LÀM', value: 'Xem xét kế hoạch' },
      { label: 'ĐIỀU CẦN TÌM', value: 'Nguy cơ cụ thể' },
      { label: 'KẾT QUẢ', value: '5 rủi ro có thứ tự' }
    ],
    dialogue: 'Tài liệu chính thức của OpenAI dùng ví dụ này để cho thấy một prompt hướng đến kết quả: agent biết phải làm gì, cần dựa vào bằng chứng nào và phải trình bày kết quả ra sao. Mình chuyển nguyên tắc đó thành năm câu hỏi để bạn dễ áp dụng.',
    choices: [{ label: 'Áp dụng vào ContentPilot', next: 'module-2-prompt-guided-practice', primary: true }]
  },
  'module-2-prompt-guided-practice': {
    lessonId: 'module-2',
    checkpointId: 'm2-prd-interview',
    step: 4,
    totalSteps: 8,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Hiểu prompt trước khi tự viết',
    objective: 'Chuẩn bị prompt phỏng vấn PRD',
    panelLabel: 'CONTENTPILOT · 5 CÂU TRẢ LỜI',
    panelStatus: 'SẴN SÀNG TỰ VIẾT',
    tone: 'neutral',
    request: 'Tạo PRD · biết ý tưởng ban đầu · hỏi một câu mỗi lượt · không tự quyết định hoặc viết code · PRD một trang có tám phần.',
    evidence: [
      { label: 'CÁCH TRAO ĐỔI', value: 'Một câu mỗi lượt', ready: true },
      { label: 'KHÔNG ĐƯỢC LÀM', value: 'Tự quyết định, viết code', ready: true },
      { label: 'KẾT QUẢ CUỐI', value: 'PRD đủ 8 phần', ready: true }
    ],
    dialogue: 'Bạn đã được học khái niệm, xem ví dụ và đối chiếu năm câu hỏi với ContentPilot. Tiếp theo là ba câu kiểm tra ngắn. Sau đó, bạn mới dùng năm câu hỏi để viết prompt tạo PRD bằng lời của mình.',
    choices: [{ label: 'Làm 3 câu kiểm tra Prompt engineering', next: 'module-2-check-prompt-1', primary: true }]
  },
  'module-2-prd-approved': {
    lessonId: 'module-2',
    checkpointId: 'm2-prd-approved',
    step: 5,
    totalSteps: 8,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Review và duyệt PRD',
    objective: 'Biết một PRD tốt trông như thế nào',
    panelLabel: 'PRD MỘT TRANG',
    panelStatus: '8 PHẦN ĐÃ REVIEW',
    tone: 'good',
    request: 'Ý tưởng · luồng sử dụng · đầu vào · đầu ra · phạm vi V1 · ngoài phạm vi · Done When · câu hỏi còn mở.',
    evidence: [
      { label: 'DONE WHEN', value: 'Kiểm tra được', ready: true },
      { label: 'CHI TIẾT CODE', value: 'Không có', ready: true },
      { label: 'QUYỀN DUYỆT', value: 'Thuộc về bạn', ready: true }
    ],
    dialogue: 'PRD tốt đủ rõ để giữ sản phẩm đi đúng hướng nhưng chưa quyết định cách viết code. Hãy duyệt sau khi bạn đã kiểm tra đủ tám phần.',
    choices: [{ label: 'Duyệt PRD đã xem xét', next: 'module-2-implementation-plan', primary: true, decision: { key: 'prdApproval', value: 'reviewed-eight-sections' } }]
  },
  'module-2-implementation-plan': {
    lessonId: 'module-2',
    checkpointId: 'm2-implementation-plan',
    step: 5,
    totalSteps: 8,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Hiểu implementation plan trước khi tạo',
    objective: 'Plan biến PRD thành các bước như thế nào?',
    panelLabel: 'MỖI BƯỚC TRONG PLAN',
    panelStatus: '4 TRƯỜNG BẮT BUỘC',
    tone: 'neutral',
    request: 'Mục tiêu · thành phần hoặc tệp · kết quả quan sát được · cách kiểm tra.',
    evidence: [
      { label: 'NGUỒN PHẠM VI', value: 'PRD đã duyệt', ready: true },
      { label: 'THỨ TỰ', value: 'Bước nhỏ, có phụ thuộc' },
      { label: 'CODE', value: 'Chưa viết' }
    ],
    dialogue: 'PRD giữ điều sản phẩm cần đạt. Implementation plan biến yêu cầu đã duyệt thành các bước xây dựng có thứ tự. Bạn chưa cần biết tên file; coding agent phải đề xuất và giải thích bằng ngôn ngữ dành cho người mới.',
    choices: [{ label: 'Xem PRD trở thành plan', next: 'module-2-implementation-plan-example', primary: true }]
  },
  'module-2-implementation-plan-example': {
    lessonId: 'module-2',
    checkpointId: 'm2-implementation-plan',
    step: 5,
    totalSteps: 8,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Hiểu implementation plan trước khi tạo',
    objective: 'Nối yêu cầu sản phẩm với cách kiểm tra',
    panelLabel: 'VÍ DỤ ATLASSIAN → MICROSOFT',
    panelStatus: 'YÊU CẦU → BƯỚC → KIỂM TRA',
    tone: 'neutral',
    request: 'PRD: hiển thị tốt trên máy tính bảng. Plan: chỉnh bố cục và kiểm tra ở chiều rộng máy tính bảng.',
    evidence: [
      { label: 'YÊU CẦU PRD', value: 'Hỗ trợ máy tính bảng' },
      { label: 'BƯỚC PLAN', value: 'Chỉnh bố cục' },
      { label: 'BẰNG CHỨNG', value: 'Kiểm tra chiều rộng' }
    ],
    dialogue: 'Mẫu thiết kế công việc của Microsoft tách rõ phạm vi, phương án, thành phần cần thay đổi và câu hỏi còn mở. Mình rút gọn thành từng bước có mục tiêu, thành phần, kết quả quan sát và cách kiểm tra.',
    choices: [{ label: 'Làm 2 câu kiểm tra Implementation plan', next: 'module-2-check-plan-1', primary: true }]
  },
  'module-2-alignment-review': {
    lessonId: 'module-2',
    checkpointId: 'm2-alignment-review',
    step: 7,
    totalSteps: 8,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Đối chiếu PRD và implementation plan',
    objective: 'Phát hiện scope creep trước khi code',
    panelLabel: 'ALIGNMENT REVIEW',
    panelStatus: 'PHÁT HIỆN MỘT ĐIỂM LỆCH',
    tone: 'neutral',
    request: 'PRD: chưa tự động đăng bài. Plan: Bước 6 — tự động đăng bài lên Facebook.',
    evidence: [
      { label: 'PRD', value: 'Ngoài phạm vi' },
      { label: 'PLAN', value: 'Đang thêm vào' },
      { label: 'KẾT LUẬN', value: 'Chưa khớp' }
    ],
    dialogue: 'Bạn sẽ xử lý điểm lệch này thế nào trước khi duyệt planning package?',
    choices: [
      { label: 'Giữ lại vì agent đã đề xuất', next: 'module-2-alignment-mismatch', danger: true },
      { label: 'Loại bước đăng bài khỏi plan', next: 'module-2-planning-package', primary: true, decision: { key: 'alignmentDecision', value: 'remove-scope-creep' } }
    ]
  },
  'module-2-alignment-mismatch': {
    lessonId: 'module-2',
    checkpointId: 'm2-alignment-review',
    step: 7,
    totalSteps: 8,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Đối chiếu PRD và implementation plan',
    objective: 'Không để agent tự mở rộng phạm vi',
    panelLabel: 'SCOPE CREEP',
    panelStatus: 'PLAN KHÔNG CÒN THEO PRD',
    tone: 'bad',
    request: 'Một đề xuất kỹ thuật không tự động trở thành yêu cầu sản phẩm đã được duyệt.',
    evidence: [
      { label: 'NGUỒN PHẠM VI', value: 'PRD' },
      { label: 'BƯỚC THỪA', value: 'Tự động đăng bài' },
      { label: 'HÀNH ĐỘNG', value: 'Loại hoặc sửa PRD' }
    ],
    dialogue: 'Nếu muốn thêm đăng bài, bạn phải sửa và duyệt lại PRD. Với phạm vi hiện tại, hãy loại bước đó khỏi plan.',
    choices: [{ label: 'Loại scope creep', next: 'module-2-planning-package', primary: true, decision: { key: 'alignmentDecision', value: 'remove-scope-creep' } }]
  },
  'module-2-planning-package': {
    lessonId: 'module-2',
    checkpointId: 'm2-planning-package',
    step: 6,
    totalSteps: 8,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Hoàn thiện planning package',
    objective: 'Tạo hai artifact trước khi implementation',
    panelLabel: 'CHECKPOINT BẮT BUỘC',
    panelStatus: 'CHỜ THỰC HÀNH TRONG CODEX',
    tone: 'good',
    request: 'Planning package = PRD.md đã duyệt + implementation-plan.md đã duyệt và khớp PRD.',
    evidence: [
      { label: 'PRD.md', value: 'Cần tạo' },
      { label: 'IMPLEMENTATION PLAN', value: 'Cần tạo' },
      { label: 'CODE', value: 'Chưa bắt đầu', ready: true }
    ],
    dialogue: 'Bạn đã học xong PRD, prompt và implementation plan, đồng thời hoàn thành đủ 3 + 3 + 2 câu kiểm tra. Bây giờ Course Companion sẽ mở một Practice duy nhất trong Codex. Bạn sẽ tự viết prompt, hoàn thành phỏng vấn, duyệt hai artifact, đối chiếu alignment, giải thích một quyết định phạm vi và yêu cầu Triết duyệt trước khi quay lại làm bài kiểm tra cuối.',
    choices: [
      { label: 'Xem lại Module 2', action: 'review-module' },
      { label: 'Sang Codex tạo planning package', action: 'practice', primary: true }
    ]
  },
  'module-2-mastery': {
    lessonId: 'module-2',
    checkpointId: 'm2-mastery',
    step: 7,
    totalSteps: 8,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Kiểm tra tổng hợp Module 2',
    objective: 'Sẵn sàng cho 15 câu kiểm tra cuối',
    panelLabel: 'KIỂM TRA CUỐI MODULE',
    panelStatus: '15 CÂU · CẦN ĐẠT 80%',
    tone: 'good',
    request: 'PRD.md đã duyệt · implementation-plan.md đã duyệt · mọi Done When có cách kiểm tra tương ứng.',
    evidence: [
      { label: 'PRD', value: 'Đã duyệt', ready: true },
      { label: 'PLAN', value: 'Đã duyệt', ready: true },
      { label: 'ALIGNMENT', value: 'Khớp', ready: true }
    ],
    dialogue: 'Bạn đã học đủ bốn vùng kiến thức và hoàn thành planning package. Phần cuối gồm mười câu lựa chọn, ba câu trả lời ngắn và hai câu đối chiếu artifact của chính bạn. Nguồn cùng lời giải sẽ hiện sau mỗi câu.',
    choices: [{ label: 'Bắt đầu 15 câu kiểm tra cuối', next: 'module-2-final-1', primary: true }]
  },
  'module-2-mastery-repair': {
    lessonId: 'module-2',
    checkpointId: 'm2-mastery',
    step: 7,
    totalSteps: 8,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Kiểm tra planning package',
    objective: 'Dựa vào artifact thay vì lời khẳng định',
    panelLabel: 'BẰNG CHỨNG CHƯA ĐỦ',
    panelStatus: 'LỜI NÓI KHÔNG PHẢI CHECKPOINT',
    tone: 'bad',
    request: 'Trạng thái “đã xong” không chứng minh PRD và plan tồn tại, được duyệt hoặc khớp nhau.',
    evidence: [
      { label: 'ARTIFACT', value: 'Cần kiểm tra' },
      { label: 'PHÊ DUYỆT', value: 'Cần xác nhận' },
      { label: 'ALIGNMENT', value: 'Cần đối chiếu' }
    ],
    dialogue: 'Hãy quay lại bằng chứng có thể quan sát: hai artifact, trạng thái duyệt và mapping giữa PRD với plan.',
    choices: [{ label: 'Duyệt bằng artifact và alignment', next: 'module-2-complete', primary: true, decision: { key: 'masteryEvidence', value: 'artifacts-approved-and-aligned' } }]
  },
  'module-2-complete': {
    lessonId: 'module-2',
    checkpointId: 'm2-complete',
    step: 8,
    totalSteps: 8,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Planning trước implementation',
    objective: 'Module 2 đã hoàn thành',
    panelLabel: 'PLANNING PACKAGE',
    panelStatus: 'SẴN SÀNG CHO MODULE 3',
    tone: 'good',
    request: 'Bạn đã biến một ý tưởng một câu thành PRD và implementation plan đủ rõ để bắt đầu xây.',
    evidence: [
      { label: 'PRD', value: 'Đã duyệt', ready: true },
      { label: 'PLAN', value: 'Đã duyệt', ready: true },
      { label: 'BƯỚC TIẾP', value: 'Implementation & debugging', ready: true }
    ],
    dialogue: 'Ở Module 3, hai tài liệu này sẽ là điểm xuất phát cho implementation và debugging. Module 2 dừng ở đây, trước khi viết code.',
    choices: [{ label: 'Về Home Base', action: 'home', primary: true }]
  }
}

function assessmentScene(question: AssessmentQuestion, group: AssessmentGroup, index: number): SceneContent {
  const isSetupFinal = group.id === 'setup-final-assessment'
  const isFinal = group.id === 'final-assessment'
  const checkpointId: CheckpointId = isSetupFinal
    ? 'm1-mastery'
    : isFinal
    ? 'm2-mastery'
    : group.id === 'planning-prd-check'
      ? 'm2-prd-concept'
      : group.id === 'prompt-check'
        ? 'm2-prd-interview'
        : 'm2-implementation-plan'
  const step = isSetupFinal ? 5 : isFinal ? 7 : group.id === 'planning-prd-check' ? 3 : group.id === 'prompt-check' ? 4 : 5
  const questionType = question.type === 'multiple-choice'
    ? 'Chọn một đáp án'
    : question.type === 'artifact-answer'
      ? 'Đối chiếu artifact'
      : 'Trả lời ngắn'

  return {
    lessonId: isSetupFinal ? 'module-1' : 'module-2',
    checkpointId,
    step,
    totalSteps: isSetupFinal ? 6 : 8,
    lessonLabel: isSetupFinal ? 'MODULE 1 · THIẾT LẬP CODEX' : 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: group.title,
    objective: `Câu ${index + 1}/${group.questions.length}`,
    panelLabel: group.mode === 'mastery' ? 'KIỂM TRA TỔNG HỢP' : 'KIỂM TRA THEO CỤM',
    panelStatus: `CÂU ${index + 1}/${group.questions.length}`,
    tone: 'neutral',
    request: 'Trả lời trước. Lời giải và nguồn chính thức sẽ hiện ngay sau đó.',
    evidence: [
      { label: 'HÌNH THỨC', value: questionType },
      { label: 'NGUỒN', value: 'Hiện sau khi trả lời' },
      { label: 'TIẾN ĐỘ', value: `${index + 1}/${group.questions.length}` }
    ],
    dialogue: question.prompt,
    choices: [],
    assessmentQuestionId: question.id,
    assessmentGroupId: group.id
  }
}

const generatedAssessmentScenes = Object.fromEntries(
  assessmentGroups.flatMap((group) =>
    group.questions.map((question, index) => [question.sceneId, assessmentScene(question, group, index)])
  )
) as Partial<Record<SceneId, SceneContent>>

const scenes = {
  ...staticScenes,
  ...generatedAssessmentScenes,
  ...registrySceneContent,
  'module-1-final-summary': {
    lessonId: 'module-1',
    checkpointId: 'm1-mastery',
    step: 5,
    totalSteps: 6,
    lessonLabel: 'MODULE 1 · THIẾT LẬP CODEX',
    mission: 'Kết quả kiểm tra thiết lập Codex',
    objective: 'Đối chiếu kết quả trước khi hoàn thành',
    panelLabel: 'KẾT QUẢ',
    panelStatus: '4 CÂU · MỐC ĐẠT 3/4',
    tone: 'neutral',
    request: 'Mỗi câu đúng hoặc tự đối chiếu đạt được tính một điểm.',
    evidence: [],
    dialogue: '',
    choices: [],
    assessmentGroupId: 'setup-final-assessment',
    assessmentSummary: true
  },
  'module-2-final-summary': {
    lessonId: 'module-2',
    checkpointId: 'm2-mastery',
    step: 7,
    totalSteps: 8,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Kết quả kiểm tra tổng hợp',
    objective: 'Đối chiếu kết quả trước khi hoàn thành',
    panelLabel: 'KẾT QUẢ',
    panelStatus: '15 CÂU · MỐC ĐẠT 12/15',
    tone: 'neutral',
    request: 'Mỗi câu đúng hoặc tự đối chiếu đạt được tính một điểm.',
    evidence: [],
    dialogue: '',
    choices: [],
    assessmentGroupId: 'final-assessment',
    assessmentSummary: true
  }
} as Record<SceneId, SceneContent>

// The single forward page of a linear scene; branching and action choices have none.
function nextReviewPageOf(sceneId: SceneId): SceneId | undefined {
  const forward = (scenes[sceneId]?.choices ?? []).filter((choice) => choice.next && !choice.action)
  return forward.length === 1 ? forward[0]!.next : undefined
}

type CourseLessonDefinition = {
  id: CourseLessonId
  titleVi: string
}

type LearningPosition = {
  lessonId: CourseLessonId
  lessonTitle: string
  lessonIndex: number
  totalLessons: number
  page: number
  totalPages: number
}

const introModule = courseStructure.modules.find((module) => module.id === 'intro')
const setupModule = courseStructure.modules.find((module) => module.id === 'module-1')
const planningModule = courseStructure.modules.find((module) => module.id === 'module-2')

const courseLessonDefinitions: CourseLessonDefinition[] = [
  ...(introModule?.lessons ?? []).map((lesson) => ({
    id: lesson.id as CourseLessonId,
    titleVi: lesson.titleVi
  })),
  ...(setupModule?.lessons ?? []).map((lesson) => ({
    id: lesson.id as CourseLessonId,
    titleVi: lesson.titleVi
  })),
  ...registryLessonDefinitions
]
const courseLessonTitle = new Map(
  courseLessonDefinitions.map((lesson) => [lesson.id, lesson.titleVi])
)
const moduleLessonIds: Record<Exclude<LessonId, 'intro'>, CourseLessonId[]> = {
  'module-1': setupModule?.lessons?.map((lesson) => lesson.id as CourseLessonId) ?? [],
  'module-2': registryModuleLessonIds['module-2'],
  'module-3': registryModuleLessonIds['module-3'],
  'module-4': registryModuleLessonIds['module-4']
}

const lessonVisuals: Partial<Record<CourseLessonId, LessonVisual>> = {
  'm1-assessment': {
    image: m1AssessmentImage,
    alt: 'Giao diện Codex hiển thị kết quả, các tệp đã tạo và những điểm cần người dùng kiểm tra'
  },
  'm2-when-to-plan': {
    image: m2WhenToPlanImage,
    alt: 'Codex trình bày cách tiếp cận và những nguồn sẽ kiểm tra trước khi hành động'
  },
  'm2-product-requirements': {
    image: m2ProductRequirementsImage,
    alt: 'Một yêu cầu tạo PRD nêu vấn đề, người dùng, phạm vi, rủi ro và câu hỏi còn mở'
  },
  'm2-prd-prompt': {
    image: m2PrdPromptImage,
    alt: 'Codex giải thích kế hoạch thu thập bằng chứng trước khi soạn tài liệu PRD'
  },
  'm2-prd-review': {
    image: m2PrdReviewImage,
    alt: 'Tài liệu PRD được mở cạnh cuộc trao đổi với Codex để người dùng xem xét'
  },
  'm2-implementation-plan': {
    image: m2ImplementationPlanImage,
    alt: 'Tài liệu hiển thị bảng mốc triển khai, quyết định và nội dung cần kiểm tra'
  },
  'm2-assessment': {
    image: m2AssessmentImage,
    alt: 'Codex và tài liệu hoàn chỉnh được đặt cạnh nhau để người dùng đối chiếu trước khi duyệt'
  }
}

const sceneVisuals: Partial<Record<SceneId, LessonVisual>> = {
  'module-4-hosting-intro': {
    image: m4ProjectsOverviewImage,
    alt: 'Trang quản lý dự án trên Vercel hiển thị portfolio-smu và địa chỉ minhtrietportfolio.dev',
    caption: 'dashboard của Vercel',
    fit: 'contain'
  },
  'module-1-codex-examples': {
    image: m1ApprovalMenuImage,
    alt: 'Menu Approval của Codex hiển thị Ask for approval, Approve for me và Full access',
    fit: 'contain'
  },
  'module-1-codex-model-intro': {
    image: m1ModelSettingsImage,
    alt: 'Menu Codex với GPT-6 Astra, High, thanh trượt và biểu tượng tia sét'
  },
  'module-1-codex-effort-speed': {
    image: m1ModelSettingsImage,
    alt: 'Menu Codex với GPT-6 Astra, High, thanh trượt và biểu tượng tia sét'
  },
  'module-2-portfolio-workspace': {
    image: m2WhenToPlanImage,
    alt: 'Codex đọc các nguồn liên quan và nêu cách tiếp cận trước khi bắt đầu thực hiện',
    fit: 'contain'
  },
  'module-2-prd-definition': {
    image: m2ProductRequirementsImage,
    alt: 'Một yêu cầu tạo PRD nêu nguồn thông tin và những phần sản phẩm cần làm rõ',
    fit: 'contain'
  },
  'module-2-prd-review-workflow': {
    image: m2ImplementationPlanImage,
    alt: 'Cuộc trao đổi với Codex được đặt cạnh tài liệu PRD để người dùng đọc và review',
    fit: 'contain'
  },
  'module-2-prd-agent-workflow': {
    image: m2PafoliosImage,
    alt: 'Ảnh chụp Pafolios với hai portfolio được tuyển chọn',
    caption: 'Pafolios',
    fit: 'contain'
  },
  'module-2-html-design-prototype': {
    image: prototypeThumbnail,
    alt: 'Bản mẫu Module 3 với trang Tạo bản portfolio đầu tiên',
    caption: 'Mình cũng tạo design prototype trước khi thực hiện khoá này',
    fit: 'contain'
  },
  'module-3-visible-error': {
    image: m3VisibleScreenErrorImage,
    alt: 'Nút Xem dự án che lên phần giới thiệu của một website portfolio',
    fit: 'contain'
  },
  'module-3-visible-error-prompt': {
    image: m3VisibleErrorPromptImage,
    alt: 'Ảnh lỗi giao diện được gửi cùng prompt mô tả kết quả mong đợi và kết quả thực tế',
    fit: 'contain'
  },
  'module-3-terminal-logs': {
    image: m3TerminalLogErrorImage,
    alt: 'Terminal hiển thị một dòng log được làm nổi bật để coding agent điều tra lỗi',
    fit: 'contain'
  },
  'module-3-repeated-error': {
    image: m3RepeatedErrorCodexPromptImage,
    alt: 'Codex nhận yêu cầu dừng sửa, liệt kê các nguyên nhân có thể và kiểm tra từng nguyên nhân bằng bằng chứng',
    fit: 'contain'
  },
  'module-3-git-github': {
    image: m3GitGithubImage,
    alt: 'Logo Git và GitHub được đặt cạnh nhau để minh hoạ hai khái niệm khác nhau',
    fit: 'contain'
  },
  'module-3-git-commit': {
    image: m3CommitHistoryImage,
    alt: 'Danh sách nhiều commit nối tiếp nhau trong lịch sử Git',
    caption: 'Trong hình, mỗi dòng đại diện cho một commit — tức một phiên bản của dự án đã được lưu lại.',
    fit: 'contain'
  },
  'module-3-git-merge': {
    image: m3GithubBranchesImage,
    alt: 'Danh sách các branch của một dự án trên GitHub',
    caption: 'ảnh các branches trong một dự án trên github của mình',
    fit: 'contain'
  },
  'module-3-git-push': {
    image: m3GithubPushedCommitsImage,
    alt: 'Danh sách commit của dự án trên GitHub sau khi push',
    caption: 'commit của dự án khi được push lên github',
    fit: 'contain'
  },
  'module-3-github-intro': {
    image: m3GithubPushedCommitsImage,
    alt: 'Danh sách commit của dự án trên GitHub sau khi push',
    caption: 'commit của dự án khi được push lên github',
    fit: 'contain'
  },
  'module-3-security-env': {
    image: m3GitignoreEnvImage,
    alt: 'File .gitignore liệt kê .env và các file môi trường khác để Git bỏ qua',
    fit: 'contain'
  }
}

const sceneSecondaryVisuals: Partial<Record<SceneId, LessonVisual>> = {
  'module-2-prd-agent-workflow': {
    image: m2AwwwardsImage,
    alt: 'Ảnh chụp trang Site of the Day trên Awwwards',
    caption: 'Awwwards',
    fit: 'contain'
  }
}

const courseLessonPages = {
  'intro-overview': [
    ['intro-visual-onboarding'],
    ['intro-course-overview-2'],
    ['intro-learning-method']
  ],
  'm1-understand-codex': [
    ['module-1-chat-work'],
    ['module-1-why-codex'],
    ['module-1-codex-examples'],
    ['module-1-codex-model-intro'],
    ['module-1-codex-effort-speed']
  ],
  'm1-agents-and-skills': [
    ['module-1-agents-intro'],
    ['module-1-agents-levels'],
    ['module-1-skills-intro'],
    ['module-1-skills-portfolio'],
    ['module-1-codex-projects']
  ],
  'm1-assessment': [
    ['module-1-mastery'],
    ['module-1-final-1'],
    ['module-1-final-2'],
    ['module-1-final-3'],
    ['module-1-final-4'],
    ['module-1-final-summary']
  ],
  ...registryLessonPages
} as Record<CourseLessonId, readonly (readonly SceneId[])[]>

function lessonModuleId(lessonId: CourseLessonId): LessonId {
  if (lessonId === 'intro-overview') return 'intro'
  if (lessonId.startsWith('m1-')) return 'module-1'
  if (lessonId.startsWith('m2-')) return 'module-2'
  if (lessonId.startsWith('m3-')) return 'module-3'
  return 'module-4'
}

const learningPositionByScene = Object.fromEntries(
  Object.entries(courseLessonPages).flatMap(([lessonId, pages]) => {
    const typedLessonId = lessonId as CourseLessonId
    const moduleId = lessonModuleId(typedLessonId)
    const lessonIds = moduleId === 'intro' ? ['intro-overview'] : moduleLessonIds[moduleId]
    const lessonIndex = lessonIds.indexOf(typedLessonId) + 1
    const totalLessons = lessonIds.length
    return pages.flatMap((scenePage, pageIndex) =>
      scenePage.map((sceneId) => [sceneId, {
        lessonId: typedLessonId,
        lessonTitle: courseLessonTitle.get(typedLessonId) ?? scenes[sceneId].mission,
        lessonIndex,
        totalLessons,
        page: pageIndex + 1,
        totalPages: pages.length
      } satisfies LearningPosition])
    )
  })
) as Record<SceneId, LearningPosition>

type View = 'loading' | 'welcome' | 'resume' | 'app' | 'reset-confirm' | 'reset-required' | 'error'
type AppDestination = 'home' | 'lesson' | 'settings'
type ApprovalFocus = 'ask' | 'approve' | 'full'

const sceneStyle = { '--pixel-room-image': `url("${roomImage}")` } as CSSProperties

function initialUpdate(): ProgressUpdate {
  return {
    currentLessonId: 'intro',
    currentCourseLessonId: 'intro-overview',
    checkpointId: 'intro-visual-onboarding',
    sceneId: 'intro-visual-onboarding',
    sceneHistory: [],
    completedCheckpointIds: [],
    decisions: {}
  }
}

function emptyPracticeState(): PracticeState {
  return { missionId: 'm2-planning-package', status: 'idle' }
}

function previewProgress(update: ProgressUpdate, previous?: LearnerProgress): LearnerProgress {
  const timestamp = new Date().toISOString()
  return {
    ...update,
    schemaVersion: LEARNER_STATE_SCHEMA_VERSION,
    courseVersion: COURSE_VERSION,
    practice: previous?.practice ?? emptyPracticeState(),
    courseRunId: previous?.courseRunId ?? `preview-${Date.now()}`,
    startedAt: previous?.startedAt ?? timestamp,
    practiceCompletions: previous?.practiceCompletions ?? [],
    updatedAt: timestamp
  }
}

function LessonPracticeBrief({ definition }: { definition: PracticeDefinition }) {
  const requiredCriteria = definition.criteria.filter((criterion) => criterion.required)

  return (
    <div className="pixel-practice-brief" data-practice-id={definition.practiceId}>
      <section>
        <h3>MỤC TIÊU</h3>
        <p>{definition.objective}</p>
      </section>
      <section>
        <h3>KẾT QUẢ CẦN NỘP</h3>
        <p>{definition.expectedOutcome}</p>
        <div className="pixel-practice-report-title">
          <span>TIÊU ĐỀ BÁO CÁO</span>
          <strong>{definition.reportTitle}</strong>
        </div>
        <dl className="pixel-practice-settings">
          {definition.requiredSettings.map((setting) => (
            <div key={setting.id}>
              <dt>{setting.label}</dt>
              <dd>{setting.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section>
        <h3>ĐIỀU KIỆN ĐẠT</h3>
        <ol>
          {requiredCriteria.map((criterion) => <li key={criterion.id}>{criterion.description}</li>)}
        </ol>
      </section>
    </div>
  )
}

function ApprovalTerm({
  activeFocus,
  children,
  focus,
  onSelect
}: {
  activeFocus: ApprovalFocus | null
  children: string
  focus: ApprovalFocus
  onSelect: (focus: ApprovalFocus) => void
}) {
  return (
    <button
      aria-label={`Làm nổi bật ${children} trong ảnh minh họa`}
      aria-pressed={activeFocus === focus}
      className={`pixel-approval-term${activeFocus === focus ? ' is-active' : ''}`}
      data-approval-focus={focus}
      type="button"
      onClick={() => onSelect(focus)}
    >
      {children}
    </button>
  )
}

function ApprovalTourDialogue({
  activeFocus,
  onSelect
}: {
  activeFocus: ApprovalFocus | null
  onSelect: (focus: ApprovalFocus) => void
}) {
  return (
    <>
      Được rồi, vậy chúng ta sẽ bắt đầu tìm hiểu Codex cùng nhau nha. Khi bắt đầu thực hiện một tác vụ trong Codex, có ba cài đặt căn bản bạn cần chú ý. Đầu tiên, hãy nhìn qua Approval. Khi nhấn vào biểu tượng Codex bên trái dấu cộng, bạn sẽ thấy một hộp gồm ba lựa chọn. Đây là phần cài đặt Approval, nơi bạn thiết lập mức độ kiểm soát đối với coding agent.
      <br /><br />
      Trước tiên, <ApprovalTerm activeFocus={activeFocus} focus="ask" onSelect={onSelect}>Ask for approval (Yêu cầu phê duyệt)</ApprovalTerm> luôn hỏi bạn trước khi chỉnh sửa tệp bên ngoài dự án hoặc sử dụng Internet. Tiếp theo, <ApprovalTerm activeFocus={activeFocus} focus="approve" onSelect={onSelect}>Approve for me (Phê duyệt giúp tôi)</ApprovalTerm> chỉ hỏi khi phát hiện một hành động có thể không an toàn. Cuối cùng, <ApprovalTerm activeFocus={activeFocus} focus="full" onSelect={onSelect}>Full access (Toàn quyền truy cập)</ApprovalTerm> cho phép Codex truy cập Internet và mọi tệp trên máy tính mà không bị giới hạn.
      <br /><br />
      Nếu mới bắt đầu, mình khuyên bạn dùng <ApprovalTerm activeFocus={activeFocus} focus="approve" onSelect={onSelect}>Approve for me (Phê duyệt giúp tôi)</ApprovalTerm>. Chế độ này không yêu cầu bạn duyệt mọi hành động, nhưng cũng không trao toàn bộ quyền kiểm soát cho coding agent.
    </>
  )
}

function LessonVisualMedia({
  activeFocus,
  isApprovalTour,
  visual
}: {
  activeFocus: ApprovalFocus | null
  isApprovalTour: boolean
  visual: LessonVisual
}) {
  if (visual.annotations) {
    return (
      <div className="pixel-publication-image" style={visual.crop ? { aspectRatio: `${visual.crop.width} / ${visual.crop.height}` } : undefined}>
        <img
          src={visual.image} alt={visual.alt} decoding="async" fetchPriority="high"
          style={visual.crop ? {
            position: 'absolute', maxWidth: 'none',
            width: `${visual.crop.sourceWidth / visual.crop.width * 100}%`,
            left: `${-visual.crop.x / visual.crop.width * 100}%`,
            top: `${-visual.crop.y / visual.crop.height * 100}%`
          } : undefined}
        />
        {visual.annotations.map((annotation, index) => (
          <span
            key={annotation.label}
            className="pixel-publication-marker"
            style={{ left: `${annotation.x}%`, top: `${annotation.y}%` }}
            role="img"
            aria-label={`${index + 1}. ${annotation.label}`}
            title={annotation.label}
          >{index + 1}</span>
        ))}
      </div>
    )
  }

  if (!isApprovalTour) {
    return (
      <img
        src={visual.image}
        alt={visual.alt}
        data-fit={visual.fit ?? 'cover'}
        decoding="async"
        fetchPriority="high"
      />
    )
  }

  return (
    <div className={`pixel-approval-frame${activeFocus ? ' is-manual' : ''}`}>
      <img
        src={visual.image}
        alt={visual.alt}
        data-fit={visual.fit ?? 'cover'}
        decoding="async"
        fetchPriority="high"
      />
      <span className={`pixel-approval-focus${activeFocus === 'ask' ? ' is-active' : ''}`} data-approval-focus="ask" aria-hidden="true"><small>1/3</small></span>
      <span className={`pixel-approval-focus${activeFocus === 'approve' ? ' is-active' : ''}`} data-approval-focus="approve" aria-hidden="true"><small>2/3</small></span>
      <span className={`pixel-approval-focus${activeFocus === 'full' ? ' is-active' : ''}`} data-approval-focus="full" aria-hidden="true"><small>3/3</small></span>
    </div>
  )
}

function CopyPromptCard({
  dialogSafe = false,
  label = 'PROMPT ĐỂ DÁN VÀO CODEX',
  prompt,
  title = 'Bắt đầu lập kế hoạch portfolio'
}: {
  dialogSafe?: boolean
  label?: string
  prompt: string
  title?: string
}) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle')

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setStatus('copied')
    } catch {
      setStatus('error')
    }
  }

  return (
    <aside
      className={`pixel-copy-prompt${dialogSafe ? ' is-dialog-safe' : ''}`}
      aria-labelledby="practicePromptTitle"
    >
      <header>
        <small>{label}</small>
        <strong id="practicePromptTitle">{title}</strong>
      </header>
      <p>{prompt}</p>
      <div className="pixel-copy-prompt__actions">
        <span aria-live="polite">
          {status === 'copied'
            ? 'Đã sao chép prompt. Bạn có thể dán vào Codex.'
            : status === 'error'
              ? 'Chưa thể sao chép. Hãy thử lại.'
              : ''}
        </span>
        <button type="button" onClick={() => void copyPrompt()}>
          {status === 'copied' ? 'ĐÃ SAO CHÉP' : status === 'error' ? 'THỬ LẠI' : 'SAO CHÉP PROMPT'}
        </button>
      </div>
    </aside>
  )
}

function LessonVisualLightbox({
  activeFocus,
  isApprovalTour,
  onClose,
  visual
}: {
  activeFocus: ApprovalFocus | null
  isApprovalTour: boolean
  onClose: () => void
  visual: LessonVisual
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key === 'Tab') {
        event.preventDefault()
        closeButtonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    closeButtonRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [])

  return (
    <div className="pixel-visual-lightbox" onClick={onClose}>
      <section
        aria-label="Ảnh minh họa phóng to"
        aria-modal="true"
        className="pixel-visual-lightbox__panel"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          aria-label="Đóng ảnh phóng to"
          className="pixel-visual-lightbox__close"
          type="button"
          onClick={onClose}
        >
          ĐÓNG
        </button>
        <div className="pixel-visual-lightbox__media">
          <LessonVisualMedia
            activeFocus={activeFocus}
            isApprovalTour={isApprovalTour}
            visual={visual}
          />
        </div>
        {visual.annotations && visual.caption ? <p className="pixel-publication-caption">{visual.caption}</p> : null}
      </section>
    </div>
  )
}

type ModelLessonBoardKind = 'models' | 'settings'

const modelLessonBoardByScene: Partial<Record<SceneId, ModelLessonBoardKind>> = {
  'module-1-codex-model-intro': 'models',
  'module-1-codex-effort-speed': 'settings'
}

const modelLessonSceneByKind: Record<ModelLessonBoardKind, SceneId> = {
  models: 'module-1-codex-model-intro',
  settings: 'module-1-codex-effort-speed'
}

type GuidanceLessonBoardKind = 'agents' | 'agents-levels' | 'skills' | 'skills-portfolio'

// Short global example; the full format lives at agents.md.
const agentsExampleLines = [
  '# Quy tắc chung cho mọi dự án',
  '',
  '## Trước khi làm',
  '- Nêu kế hoạch và chờ mình đồng ý rồi mới sửa tệp.',
  '',
  '## An toàn',
  '- Không push hay đưa thay đổi lên mạng khi mình chưa yêu cầu.',
  '- Không ghi khóa API hay mật khẩu vào tệp.'
] as const

function agentsExampleLineKind(line: string): string | undefined {
  if (line.startsWith('# ')) return 'is-title'
  if (line.startsWith('## ')) return 'is-section'
  return undefined
}

const guidanceLessonBoardByScene: Partial<Record<SceneId, GuidanceLessonBoardKind>> = {
  'module-1-agents-intro': 'agents',
  'module-1-agents-levels': 'agents-levels',
  'module-1-skills-intro': 'skills',
  'module-1-skills-portfolio': 'skills-portfolio'
}

const impeccableSkillExcerpt = `SKILL.md                                  EXCERPT

---
name: impeccable
description: Use when the user wants to design,
redesign, critique, audit, polish or otherwise
improve a frontend interface…
---

# Commands

shape      Plan UX/UI before writing code
critique   UX design review with heuristic scoring
polish     Final quality pass before shipping
audit      Technical quality checks (a11y, perf,
           responsive)

…`

function GuidanceLessonBoard({
  busy,
  canOpenPreviousPage,
  kind,
  nextLabel,
  onBack,
  onNext
}: {
  busy: boolean
  canOpenPreviousPage: boolean
  kind: GuidanceLessonBoardKind
  nextLabel: string
  onBack: () => void
  onNext: () => void
}) {
  const titleId = `guidance-lesson-${kind}`

  const isSkillsPage = kind === 'skills' || kind === 'skills-portfolio'

  return (
    <section
      className={`pixel-guidance-board is-${kind}${isSkillsPage ? ' is-skills' : ''}`}
      aria-labelledby={titleId}
    >
      <div className="pixel-guidance-board__copy">
        {kind === 'agents' ? (
          <>
            <header>
              <h1 id={titleId}>Vậy, giả dụ có một thông tin mình muốn agent ghi nhớ mà không cần phải nhắc đi nhắc lại thì mình sẽ làm gì?</h1>
              <p>Bạn có thể lưu thông tin đó trong <code>AGENTS.md</code>.</p>
              <p>Đây là một tệp văn bản chứa các quy tắc và thông tin coding agent cần biết trước khi bắt đầu công việc. Codex đọc tệp này để hiểu cách bạn muốn dự án được xử lý.</p>
            </header>
          </>
        ) : kind === 'agents-levels' ? (
          <>
            <header>
              <h1 id={titleId}>Hai level <code>AGENTS.md</code> bạn cần biết</h1>
            </header>
            <div className="pixel-agents-levels">
              <article>
                <span>GLOBAL</span>
                <ul className="pixel-agents-levels__tree" aria-label="~/.codex/AGENTS.md">
                  <li>~/.codex/</li>
                  <li className="is-file">AGENTS.md</li>
                </ul>
                <p>Áp dụng cho bất kỳ dự án nào mà bạn xây dựng với coding agent sau này.</p>
              </article>
              <article>
                <span>CURRENT REPO</span>
                <ul className="pixel-agents-levels__tree" aria-label="portfolio/AGENTS.md">
                  <li>portfolio/</li>
                  <li className="is-file">AGENTS.md</li>
                </ul>
                <p>Chỉ áp dụng cho dự án hiện tại.</p>
                <p>Ở Module 2, Course Companion sẽ tạo sẵn một tệp <code>AGENTS.md</code> cho thư mục portfolio của bạn.</p>
              </article>
            </div>
          </>
        ) : kind === 'skills' ? (
          <>
            <header>
              <h1 id={titleId}><strong className="pixel-guidance-board__skill-label">Skill</strong> - Dạy coding agent cách thực hiện một loại công việc</h1>
              <p>Thông thường ta dùng <code>AGENTS.md</code> để dạy cho model làm theo những hành động ta muốn mà ta không cần phải nhắc đi nhắc lại.</p>
              <p>Nhưng giả dụ ta muốn nó làm những tác vụ cụ thể như viết lách, thì sao? Chả lẽ ta viết hết tất cả những mẹo viết hay vào <code>AGENTS.md</code>? Và giả dụ ta có 100 kỹ năng muốn agents học thì sao?</p>
              <p>Ta không thể dùng một file <code>AGENTS.md</code> để dạy coding agents tất cả kỹ năng mà ta muốn nó học. Đó là lúc ta sử dụng Skill.</p>
              <p>Mỗi skill có một tệp chính tên là <code>SKILL.md</code>. Tệp này mô tả khi nào nên dùng skill, các bước cần thực hiện và những điều cần kiểm tra trước khi hoàn thành.</p>
            </header>
          </>
        ) : (
          <>
            <header>
              <small className="pixel-guidance-board__skill-kicker">
                <strong>SKILL</strong>
                <span>HAI SKILL CHO PORTFOLIO</span>
              </small>
              <h1 id={titleId}>Hai skill bạn sẽ dùng để xây portfolio</h1>
            </header>
            <div className="pixel-guidance-board__skills">
              <article><strong>impeccable</strong><p>Dùng khi thiết kế hoặc chỉnh sửa giao diện portfolio. Skill giúp Codex xác định mục tiêu của trang, chọn hướng thiết kế, xây giao diện responsive và kiểm tra kết quả thực tế.</p></article>
              <article><strong>copywriting</strong><p>Dùng khi viết nội dung cho portfolio. Skill giúp Codex viết tiêu đề, phần giới thiệu, mô tả dự án và lời kêu gọi hành động dựa trên thông tin thật của bạn.</p></article>
            </div>
          </>
        )}
      </div>

      {kind === 'agents-levels' ? null : <aside className="pixel-guidance-board__panel">
        {kind === 'agents' ? (
          <>
            <div className="pixel-agents-example" role="group" aria-label="Ví dụ tệp AGENTS.md">
              <div className="pixel-agents-example__bar"><span aria-hidden="true"><i /><i /><i /></span><code>AGENTS.md</code></div>
              <ol>
                {agentsExampleLines.map((line, index) => (
                  <li key={index} className={agentsExampleLineKind(line)}><span>{line || ' '}</span></li>
                ))}
              </ol>
            </div>
            <p className="pixel-guidance-board__directory">Xem định dạng đầy đủ và thêm ví dụ tại <a href="https://agents.md/" target="_blank" rel="noreferrer">agents.md ↗</a></p>
          </>
        ) : kind === 'skills' ? (
          <>
            <div className="pixel-skill-excerpt" aria-label="Ví dụ rút gọn từ skill impeccable">
              <pre><code>{impeccableSkillExcerpt}</code></pre>
            </div>
            <p className="pixel-guidance-board__language">Phần ví dụ dùng tiếng Anh vì theo kinh nghiệm của mình, agent thường xử lý chỉ dẫn kỹ thuật bằng tiếng Anh ổn định hơn. Bạn vẫn có thể trao đổi với Codex bằng tiếng Việt.</p>
          </>
        ) : (
          <div className="pixel-skill-directory-card">
            <small>KHÁM PHÁ THÊM</small>
            <h2>Kho skill cộng đồng</h2>
            <p className="pixel-guidance-board__directory">Khám phá thêm skill do cộng đồng chia sẻ tại <a href="https://skills.sh/" target="_blank" rel="noreferrer">skills.sh</a>. Bạn chưa cần cài thêm skill trong Module 1.</p>
          </div>
        )}
      </aside>}

      <footer className="pixel-guidance-board__actions">
        <button className="pixel-page-back" disabled={!canOpenPreviousPage} type="button" onClick={onBack}>← Trang trước</button>
        <button className="pixel-choice is-primary" disabled={busy} type="button" onClick={onNext}>{busy ? 'Đang lưu checkpoint…' : nextLabel}</button>
      </footer>
    </section>
  )
}

const implementationPlanBoardByScene: Partial<Record<SceneId, true>> = {
  'module-2-implementation-plan-intro': true
}

function ImplementationPlanLessonBoard({
  busy,
  canOpenPreviousPage,
  dialogue,
  eyebrow,
  nextLabel,
  onBack,
  onNext,
  title
}: {
  busy: boolean
  canOpenPreviousPage: boolean
  dialogue: string
  eyebrow: string
  nextLabel: string
  onBack: () => void
  onNext: () => void
  title: string
}) {
  return (
    <section className="pixel-plan-board is-completion" aria-labelledby="implementation-plan-title">
      <div className="pixel-plan-board__lesson">
        <header>
          <small>{eyebrow}</small>
          <h1 id="implementation-plan-title">{title}</h1>
        </header>
        <div className="pixel-plan-board__lesson-copy">
          {dialogue.split('\n\n').map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </div>

      <article className="pixel-plan-document" aria-label="Implementation plan mẫu cho portfolio của Mai">
        <header>
          <small>IMPLEMENTATION PLAN MẪU</small>
          <h2>Portfolio của Mai</h2>
          <p>UX Designer · phiên bản đầu</p>
        </header>

        <section aria-label="Phase 1 — Tạo nền dự án">
          <span>01</span>
          <div>
            <h3>Phase 1 — Tạo nền dự án</h3>
            <div className="pixel-plan-phase__criteria">
              <strong>HOÀN THÀNH KHI</strong>
              <ul>
                <li>Portfolio mở được trong trình duyệt.</li>
                <li>Lệnh build chạy không báo lỗi.</li>
              </ul>
            </div>
          </div>
        </section>

        <section aria-label="Phase 2 — Xây cấu trúc và nội dung chính">
          <span>02</span>
          <div>
            <h3>Phase 2 — Xây cấu trúc và nội dung chính</h3>
            <div className="pixel-plan-phase__criteria">
              <strong>HOÀN THÀNH KHI</strong>
              <ul>
                <li>Trang hiển thị phần giới thiệu.</li>
                <li>Hai dự án xuất hiện đầy đủ.</li>
                <li>Người xem mở được thông tin liên hệ.</li>
              </ul>
            </div>
          </div>
        </section>

        <section aria-label="Phase 3 — Hoàn thiện giao diện">
          <span>03</span>
          <div>
            <h3>Phase 3 — Hoàn thiện giao diện</h3>
            <div className="pixel-plan-phase__criteria">
              <strong>HOÀN THÀNH KHI</strong>
              <ul>
                <li>Trang không cuộn ngang trên điện thoại.</li>
                <li>Mọi liên kết dùng được bằng bàn phím.</li>
              </ul>
            </div>
          </div>
        </section>

        <section aria-label="Phase 4 — Kiểm tra và lưu bằng chứng">
          <span>04</span>
          <div>
            <h3>Phase 4 — Kiểm tra và lưu bằng chứng</h3>
            <div className="pixel-plan-phase__criteria">
              <strong>HOÀN THÀNH KHI</strong>
              <ul>
                <li>Tất cả kiểm tra đều đạt.</li>
                <li>Ảnh giao diện desktop và điện thoại đã được lưu.</li>
              </ul>
            </div>
          </div>
        </section>
      </article>

      <footer className="pixel-plan-board__actions">
        <button className="pixel-page-back" disabled={!canOpenPreviousPage} type="button" onClick={onBack}>← Trang trước</button>
        <button className="pixel-choice is-primary" disabled={busy} type="button" onClick={onNext}>{busy ? 'Đang lưu checkpoint…' : nextLabel}</button>
      </footer>
    </section>
  )
}

function assessmentDraft(question: AssessmentQuestion, result?: string): string {
  if (!result) return ''
  if (question.type === 'multiple-choice') return result.split(':').at(-1) ?? ''
  const separator = ':self-review:'
  const answerIndex = result.indexOf(separator)
  return answerIndex >= 0 ? result.slice(answerIndex + separator.length) : ''
}

function AssessmentControls({
  group,
  results,
  busy,
  error,
  questionOnly,
  continueLabel,
  backControl,
  onConfirmWritten,
  onSubmit,
  onContinue
}: {
  group: AssessmentGroup
  results: Record<string, string | undefined>
  busy: boolean
  error?: string
  questionOnly?: boolean
  continueLabel: string
  backControl: ReactNode
  onConfirmWritten: (question: AssessmentQuestion, answer: string) => Promise<boolean>
  onSubmit: (answers: Record<string, string>) => Promise<boolean>
  onContinue: () => void
}) {
  const [answers, setAnswers] = useState<Record<string, string>>(() => Object.fromEntries(
    group.questions.map((question) => [question.id, assessmentDraft(question, results[question.id])])
  ))
  const hasSubmittedResults = group.questions.every((question) => Boolean(results[question.id]))
  const [editing, setEditing] = useState(!hasSubmittedResults)
  const submissionErrorRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (error) submissionErrorRef.current?.scrollIntoView({ block: 'nearest' })
  }, [error])
  const showFeedback = hasSubmittedResults && !editing
  const allAnswered = group.questions.every((question) => {
    const answer = answers[question.id]?.trim() ?? ''
    return question.type === 'multiple-choice' ? answer !== '' : answer.length >= 20
  })
  const incorrectChoiceCount = group.questions.filter((question) =>
    question.type === 'multiple-choice' && results[question.id]?.startsWith('incorrect')
  ).length
  const pendingWrittenCount = group.questions.filter((question) =>
    question.type !== 'multiple-choice' && !results[question.id]?.startsWith('correct')
  ).length

  const updateAnswer = (questionId: string, answer: string) => {
    setAnswers((current) => ({ ...current, [questionId]: answer }))
  }

  const submit = async () => {
    if (!allAnswered || busy) return
    if (await onSubmit(answers)) setEditing(false)
  }

  const retryIncorrect = () => {
    setEditing(true)
  }

  return (
    <div className={`pixel-assessment${questionOnly ? ' is-question-only' : ''}`}>
      {questionOnly ? null : (
        <header className="pixel-assessment-header">
          <strong>{group.title}</strong>
          <span>{group.questions.length} câu hỏi</span>
          <p>Trả lời tất cả câu hỏi rồi nộp một lần. Kết quả, lời giải và nguồn chỉ hiện sau khi bạn nộp.</p>
        </header>
      )}

      <div className="pixel-assessment-list">
        {group.questions.map((question, questionIndex) => {
          const result = results[question.id]
          const correct = result?.startsWith('correct') ?? false
          const questionResult = showFeedback
            ? question.type === 'multiple-choice'
              ? correct ? 'correct' : 'incorrect'
              : correct ? 'correct' : 'review'
            : undefined
          const canEdit = editing && (!hasSubmittedResults || !correct)

          return (
            <article
              className="pixel-assessment-question"
              data-result={questionResult}
              key={question.id}
              tabIndex={questionResult === 'incorrect' ? -1 : undefined}
            >
              <header>
                <span>CÂU {questionIndex + 1}/{group.questions.length}</span>
                {showFeedback ? (
                  <strong>{question.type === 'multiple-choice'
                    ? correct ? 'Đúng' : 'Chưa đúng'
                    : correct ? 'Đã tự đối chiếu' : 'Chờ tự đối chiếu'}</strong>
                ) : null}
              </header>
              <p>{question.prompt}</p>

              {question.type === 'multiple-choice' ? (
                <div className="pixel-assessment-options">
                  {question.choices.map((choice, index) => {
                    const selected = answers[question.id] === String(index)
                    return (
                      <button
                        aria-pressed={selected}
                        className={selected ? 'is-selected' : ''}
                        disabled={busy || !canEdit}
                        key={choice}
                        type="button"
                        onClick={() => updateAnswer(question.id, String(index))}
                      >
                        <span aria-hidden="true">{String.fromCharCode(65 + index)}</span>{choice}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="pixel-assessment-written">
                  <label htmlFor={`assessment-${question.id}`}>Câu trả lời của bạn</label>
                  <textarea
                    id={`assessment-${question.id}`}
                    disabled={busy || !canEdit}
                    onChange={(event) => updateAnswer(question.id, event.target.value)}
                    placeholder="Viết bằng lời của bạn trước khi xem tiêu chí…"
                    maxLength={450}
                    rows={4}
                    value={answers[question.id] ?? ''}
                  />
                </div>
              )}

              {showFeedback ? (
                <section className="pixel-assessment-feedback" data-result={questionResult}>
                  <strong>{question.type === 'multiple-choice'
                    ? correct ? 'Bạn đã chọn đúng' : 'Chưa đúng ở lần nộp này'
                    : correct ? 'Bạn đã xác nhận sau khi tự đối chiếu' : 'Tự đối chiếu trước khi tiếp tục'}</strong>
                  <p>{question.explanation}</p>
                  {question.type !== 'multiple-choice' ? (
                    <ul>
                      {question.criteria.map((criterion) => <li key={criterion}>{criterion}</li>)}
                    </ul>
                  ) : null}
                  {question.type !== 'multiple-choice' && !correct ? (
                    <div className="pixel-assessment-review-actions">
                      <button disabled={busy} type="button" onClick={() => setEditing(true)}>Viết lại</button>
                      <button
                        className="is-primary"
                        disabled={busy}
                        type="button"
                        onClick={() => void onConfirmWritten(question, answers[question.id]!.trim())}
                      >
                        Câu trả lời đáp ứng đủ tiêu chí
                      </button>
                    </div>
                  ) : null}
                </section>
              ) : null}
            </article>
          )
        })}
      </div>

      {error ? <div className="pixel-save-error" role="alert" ref={submissionErrorRef}>{error}</div> : null}
      <footer className="pixel-assessment-actions">
        {backControl}
        {showFeedback ? (
          <>
            {incorrectChoiceCount > 0 ? (
              <button disabled={busy} type="button" onClick={retryIncorrect}>Chọn lại câu chưa đúng</button>
            ) : null}
            <button className="is-primary" disabled={busy || pendingWrittenCount > 0} type="button" onClick={onContinue}>
              {continueLabel}
            </button>
          </>
        ) : (
          <button className="is-primary" disabled={busy || !allAnswered} type="button" onClick={() => void submit()}>
            {busy ? 'Đang lưu câu trả lời…' : `Nộp ${group.questions.length} câu trả lời`}
          </button>
        )}
      </footer>
    </div>
  )
}

function EntryScreen({
  mode,
  progress,
  recovered,
  busy,
  onPrimary,
  onReset,
  onCancelReset
}: {
  mode: 'welcome' | 'resume' | 'reset-confirm' | 'reset-required'
  progress: LearnerProgress | null
  recovered: boolean
  busy: boolean
  onPrimary: () => void
  onReset: () => void
  onCancelReset: () => void
}) {
  const scene = progress ? scenes[progress.sceneId] : null
  const learningPosition = progress ? learningPositionByScene[visibleLessonScene(progress.sceneId)] : null
  const isWelcome = mode === 'welcome'
  const isConfirm = mode === 'reset-confirm' || mode === 'reset-required'
  const title = isWelcome
    ? 'Chào mừng bạn đến với Vibecoding 101'
    : isConfirm
      ? 'Bắt đầu lại từ đầu?'
      : 'Tiếp tục đúng nơi bạn dừng lại'
  const description = isWelcome
    ? 'Khoá học này sẽ giúp bạn biết cách sử dụng Coding agent để tạo ra những công cụ hữu ích cho công việc. Chúng mình sẽ không chỉ dạy cho bạn lý thuyết, mà sẽ đồng hành cùng bạn để xây dựng một ứng dụng thực tế.'
    : mode === 'reset-required'
      ? 'Tiến trình hiện tại và bản khôi phục đều không đọc được. Bạn có thể xóa dữ liệu hỏng để bắt đầu an toàn.'
      : isConfirm
        ? 'Toàn bộ tiến trình và lựa chọn cục bộ của hành trình này sẽ bị xóa.'
        : `${learningPosition?.lessonTitle ?? scene?.lessonLabel ?? 'BÀI HỌC'} · ${scene?.objective ?? progress?.checkpointId}`

  return (
    <main className={`pixel-learning-shell pixel-entry-shell${isWelcome ? ' is-welcome' : ''}`}>
      <div className="pixel-scene-world" style={sceneStyle} aria-hidden="true" />
      <div className="pixel-entry-brand">VIBECODING 101 · TRIẾT &amp; DUY</div>
      <img className="pixel-entry-teacher" src={teacherImage} alt="Triết, giáo viên đồng hành" />
      <section className="pixel-entry-panel" aria-live="polite">
        {!isWelcome ? <small>{recovered ? 'ĐÃ KHÔI PHỤC BẢN LƯU GẦN NHẤT' : 'CHECKPOINT ĐÃ LƯU'}</small> : null}
        <h1>{title}</h1>
        <p>{description}</p>
        {progress && !isConfirm ? (
          <div className="pixel-entry-checkpoint">
            <span>{progress.currentLessonId === 'intro'
              ? 'PHẦN GIỚI THIỆU'
              : `MODULE ${progress.currentLessonId.slice(-1)} · BÀI ${learningPosition?.lessonIndex}/${learningPosition?.totalLessons}`}</span>
            <strong>{learningPosition?.lessonTitle ?? scene?.mission}</strong>
            <em>Cập nhật {new Date(progress.updatedAt).toLocaleString('vi-VN')}</em>
          </div>
        ) : null}
        <div className="pixel-entry-actions">
          {mode === 'reset-confirm' ? (
            <button type="button" className="pixel-entry-secondary" disabled={busy} onClick={onCancelReset}>
              Giữ tiến trình
            </button>
          ) : progress ? (
            <button type="button" className="pixel-entry-secondary" disabled={busy} onClick={onReset}>
              Bắt đầu lại
            </button>
          ) : null}
          <button type="button" className="pixel-entry-primary" disabled={busy} onClick={onPrimary}>
            {busy ? 'Đang lưu…' : isWelcome ? 'Cùng bắt đầu nhé' : isConfirm ? 'Xóa và bắt đầu lại' : 'Mở Course Companion'}
          </button>
        </div>
      </section>
    </main>
  )
}

// The four course Practices, in order. A Practice counts as done once its
// checkpoint is recorded; titles match the course outline wording.
const coursePractices = [
  { moduleLabel: 'Module 1', title: 'Thực hành: Thiết lập Codex', checkpointId: 'm1-setup-checklist' },
  { moduleLabel: 'Module 2', title: 'Thực hành: Lập kế hoạch cho portfolio', checkpointId: 'm2-portfolio-planning' },
  { moduleLabel: 'Module 3', title: 'Practice: Xây portfolio', checkpointId: 'm3-portfolio-build' },
  { moduleLabel: 'Module 4', title: 'Practice: Phát hành portfolio', checkpointId: 'm4-portfolio-release' }
] as const satisfies readonly { moduleLabel: string; title: string; checkpointId: CheckpointId }[]

const futureModules = ['Đăng tải portfolio lên mạng']



// Onboarding copy approved in the 22 November 2026 prototype review.
const homeTourSteps = [
  {
    id: 'home-teacher',
    anchor: 'home-teacher',
    title: 'Đây là Triết',
    body: 'Có gì chưa rõ về nội dung khóa học, cứ hỏi Triết nhé.'
  },
  {
    id: 'locked-modules',
    anchor: 'locked-module',
    title: 'Các module mở lần lượt',
    body: 'Học xong Module 1 thì Module 2 mới mở.',
    nextLabel: 'Đã hiểu'
  }
] as const satisfies readonly OnboardingTourStep[]

const lessonTipSteps = [
  {
    id: 'lesson-teacher',
    anchor: 'lesson-teacher',
    title: 'Triết luôn ở góc trên này',
    body: 'Trong lúc học, bấm vào đây bất cứ lúc nào để hỏi Triết.',
    hint: 'Bấm thử để mở khung chat.',
    action: true,
    nextLabel: 'Đã hiểu'
  }
] as const satisfies readonly OnboardingTourStep[]

// End-of-module reminder, approved 26 November 2026.
const outlineReviewTipSteps = [
  {
    id: 'outline-review',
    anchor: 'outline-menu',
    title: 'Xem lại bài đã học',
    body: 'Bấm vào đây bất cứ lúc nào để mở mục lục và xem lại các phần bạn đã học. Các phần phía sau sẽ mở dần khi bạn học tới.',
    hint: 'Bấm thử để mở mục lục.',
    action: true,
    nextLabel: 'Đã hiểu'
  }
] as const satisfies readonly OnboardingTourStep[]

// Unlock moment: wording from the approved prototype, numbered for each module.
const unlockStepsFor = (lessonId: LessonId): OnboardingTourStep[] => {
  const module = Number(lessonId.slice(-1))
  return [{
    id: `unlock-${lessonId}`,
    anchor: 'current-module',
    title: `Module ${module} đã mở`,
    body: `Bạn đã xong Module ${module - 1}. Module ${module} giờ đã sẵn sàng.`,
    hint: `Bấm vào Module ${module} để học tiếp.`,
    action: true,
    nextLabel: 'Đã hiểu'
  }]
}

const currentModuleAnchor = { [ONBOARDING_ANCHOR_ATTRIBUTE]: 'current-module' }

type TeacherOverlayProps = {
  onClose: () => void
  practiceMode?: boolean
  hidden?: boolean
}

function TeacherOverlay({ onClose, practiceMode = false, hidden = false }: TeacherOverlayProps) {
  return (
    <aside hidden={hidden} className={'pixel-teacher-overlay' + (practiceMode ? ' is-practice-full' : '')} aria-label="Triết, giáo viên đồng hành">
      <TeacherWorkspace embedded visible={!hidden} onClose={onClose} />
    </aside>
  )
}

// Shown for a moment when a learner presses a locked module (approved 23 November 2026).
const unlockHintFor = (previousModule: number) => `Học xong Module ${previousModule} để mở`

function RoadmapStage({ children, status, className, onReview, unlockHint = '' }: {
  children: ReactNode
  status: string
  className: string
  onReview?: () => void
  unlockHint?: string
}) {
  if (onReview) {
    return (
      <button className={`pixel-roadmap-stage ${className}`} type="button" onClick={onReview}>
        {children}<em>{status}</em>
      </button>
    )
  }
  if (className.split(' ').includes('is-locked')) {
    return <LockedRoadmapStage status={status} unlockHint={unlockHint}>{children}</LockedRoadmapStage>
  }
  return <article className={className}>{children}<em>{status}</em></article>
}

type PixelAppShellProps = {
  progress: LearnerProgress
  runtime: RuntimeInfo | null
  destination: AppDestination
  teacherOpen: boolean
  onNavigate: (destination: AppDestination) => void
  onReviewModule: (moduleId: Exclude<LessonId, 'intro'>) => void
  onOpenTeacher: () => void
  onCloseTeacher: () => void
  onQuit: () => void
  onReset: () => void
  showHomeTour: boolean
  showTeacherDot: boolean
  unlockedModule: LessonId | null
  onUnlockSeen: () => void
  onHomeTourComplete: () => void
  onHomeTourSkip: () => void
}

function PixelAppShell({
  progress,
  runtime,
  destination,
  teacherOpen,
  onNavigate,
  onReviewModule,
  onOpenTeacher,
  onCloseTeacher,
  onQuit,
  onReset,
  showHomeTour,
  showTeacherDot,
  unlockedModule,
  onUnlockSeen,
  onHomeTourComplete,
  onHomeTourSkip
}: PixelAppShellProps) {
  const resetDialogRef = useRef<HTMLDialogElement>(null)
  const resetOpenerRef = useRef<HTMLButtonElement>(null)
  const scene = scenes[progress.sceneId]
  const learningPosition = learningPositionByScene[visibleLessonScene(progress.sceneId)]
  const completed = new Set(progress.completedCheckpointIds)
  if (progress.sceneId === 'module-2-complete') {
    completed.add(progress.checkpointId)
  }
  const completedCheckpointCount = runnableCheckpointIds.filter((id) => completed.has(id)).length
  const progressPercent = Math.round((completedCheckpointCount / runnableCheckpointIds.length) * 100)
  const currentModuleId = progress.currentLessonId === 'intro' ? 'module-1' : progress.currentLessonId
  const justUnlocked = unlockedModule === currentModuleId
  const moduleOneComplete = completed.has('m1-complete')
  const moduleOneMigrated = progress.decisions.setupModuleMigration === 'continued-existing-planning-progress'
  const moduleTwoComplete = completed.has('m2-portfolio-complete')
  const moduleThreeComplete = completed.has('m3-complete')
  const moduleOneLessonCount = setupModule?.lessons?.length ?? 5
  const moduleTwoLessonCount = planningModule?.lessons?.length ?? 6
  const practice = progress.practice
  const currentModule = courseStructure.modules.find((module) => module.id === progress.currentLessonId)
  const currentModuleLabel = progress.currentLessonId === 'intro' ? 'Giới thiệu' : `Module ${progress.currentLessonId.slice(-1)}`
  const currentModuleTitle = currentModule?.titleVi ?? scene.mission
  const practiceDone = coursePractices.map((item) => completed.has(item.checkpointId))
  const practicesDone = practiceDone.filter(Boolean).length
  const firstOpenPractice = practiceDone.indexOf(false)
  const practiceStatuses = practiceDone.map((done, index) => done ? 'done' : index === firstOpenPractice ? 'next' : 'todo')


  return (
    <main className="pixel-course-app">
      <div className="pixel-scene-world" style={sceneStyle} aria-hidden="true" />

      <header className="pixel-app-header">
        <button className="pixel-app-brand" type="button" onClick={() => onNavigate('home')}>
          <span aria-hidden="true"><img src={teacherImage} alt="" /></span>
          <span><strong>VIBECODING 101</strong></span>
        </button>
        <div className="pixel-app-actions">
          <button
            aria-current={destination === 'settings' ? 'page' : undefined}
            className={destination === 'settings' ? 'is-active' : ''}
            type="button"
            onClick={() => onNavigate('settings')}
          >Cài đặt</button>
          <button type="button" onClick={onQuit}>Thoát · v{runtime?.appVersion ?? '…'}</button>
        </div>
      </header>

      {destination === 'home' ? (
        <section className="pixel-home-base" aria-labelledby="homeBaseTitle">
          <div className="pixel-home-roadmap-shell">
            <div className="pixel-home-heading">
              <div>
                <h1 id="homeBaseTitle">Lộ trình khóa học</h1>
              </div>
              <div className="pixel-course-progress">
                <small>TIẾN ĐỘ TOÀN KHÓA</small>
                <strong>{completedCheckpointCount}/{runnableCheckpointIds.length} checkpoint · {progressPercent}%</strong>
              </div>
            </div>

            <div className="pixel-roadmap" aria-label="Lộ trình học">
              {currentModuleId === 'module-1' ? (
                <button className={`pixel-roadmap-stage is-current${moduleOneComplete ? ' is-complete' : ''}`} type="button" onClick={() => onNavigate('lesson')}>
                  <span>01</span><div><strong>{setupModule?.titleVi ?? 'Bắt đầu làm việc với Codex'}</strong><p>Bài {learningPosition.lessonIndex}/{moduleOneLessonCount} · {learningPosition.lessonTitle} · Trang {learningPosition.page}/{learningPosition.totalPages}</p></div><em>{moduleOneComplete ? 'HOÀN THÀNH' : <><span>BẠN ĐANG Ở ĐÂY</span><b>MỞ BÀI HỌC →</b></>}</em>
                </button>
              ) : (
                <RoadmapStage
                  className={moduleOneMigrated ? 'is-migrated' : 'is-complete'}
                  status={moduleOneMigrated ? 'ĐÃ CHUYỂN TIẾP' : 'HOÀN THÀNH'}
                  onReview={moduleOneMigrated ? undefined : () => onReviewModule('module-1')}
                >
                  <span>01</span><div><strong>{setupModule?.titleVi ?? 'Bắt đầu làm việc với Codex'}</strong><p>{moduleOneMigrated ? 'Tiến độ Planning cũ được giữ nguyên; học phần setup không được tự đánh dấu hoàn thành.' : 'Bạn đã hoàn tất nền tảng làm việc với Codex.'}</p></div>
                </RoadmapStage>
              )}
              {currentModuleId === 'module-2' ? (
                <button className={`pixel-roadmap-stage is-current${moduleTwoComplete ? ' is-complete' : ''}${justUnlocked ? ' is-just-unlocked' : ''}`} type="button" onClick={() => onNavigate('lesson')} {...currentModuleAnchor}>
                  <span>02</span><div><strong>{planningModule?.titleVi ?? 'Lên kế hoạch sao cho hiệu quả?'}</strong><p>Bài {learningPosition.lessonIndex}/{moduleTwoLessonCount} · {learningPosition.lessonTitle} · Trang {learningPosition.page}/{learningPosition.totalPages}</p></div><em>{moduleTwoComplete ? 'HOÀN THÀNH' : <><span>BẠN ĐANG Ở ĐÂY</span><b>MỞ BÀI HỌC →</b></>}</em>
                </button>
              ) : (
                <RoadmapStage
                  className={moduleTwoComplete ? 'is-complete' : 'is-locked'}
                  status={moduleTwoComplete ? 'HOÀN THÀNH' : 'SẮP TỚI'}
                  unlockHint={unlockHintFor(1)}
                  onReview={moduleTwoComplete ? () => onReviewModule('module-2') : undefined}
                >
                  <span>02</span><div><strong>{planningModule?.titleVi ?? 'Lên kế hoạch sao cho hiệu quả?'}</strong><p>{moduleTwoComplete ? 'Bộ tài liệu planning và kết quả làm chủ đã được lưu trong biên nhận hoàn thành.' : 'Học cách viết PRD và implementation plan, để coding agent không hiểu sai ý bạn'}</p></div>
                </RoadmapStage>
              )}
              {currentModuleId === 'module-3' ? (
                <button className={`pixel-roadmap-stage is-current${moduleThreeComplete ? ' is-complete' : ''}${justUnlocked ? ' is-just-unlocked' : ''}`} type="button" onClick={() => onNavigate('lesson')} {...currentModuleAnchor}>
                  <span>03</span><div><strong>Bắt đầu tạo portfolio</strong><p>Năm tệp planning hiện tại đã được bàn giao; nội dung chat cũ không được dùng làm đầu vào.</p></div><em>{moduleThreeComplete ? 'HOÀN THÀNH' : <><span>BẠN ĐANG Ở ĐÂY</span><b>MỞ BÀI HỌC →</b></>}</em>
                </button>
              ) : (
                <RoadmapStage
                  className={moduleThreeComplete ? 'is-complete' : 'is-locked'}
                  status={moduleThreeComplete ? 'HOÀN THÀNH' : 'SẮP TỚI'}
                  unlockHint={unlockHintFor(2)}
                  onReview={moduleThreeComplete ? () => onReviewModule('module-3') : undefined}
                >
                  <span>03</span><div><strong>Bắt đầu tạo portfolio</strong><p>{moduleThreeComplete ? scenes['module-3-complete'].objective : 'Học cách sửa lỗi và lưu lại các phiên bản làm việc'}</p></div>
                </RoadmapStage>
              )}
              {futureModules.map((title, index) => currentModuleId === `module-${index + 4}` ? (
                <button className={`pixel-roadmap-stage is-current${completed.has('m4-complete') ? ' is-complete' : ''}${justUnlocked ? ' is-just-unlocked' : ''}`} type="button" key={title} onClick={() => onNavigate('lesson')} {...currentModuleAnchor}>
                  <span>{String(index + 4).padStart(2, '0')}</span><div><strong>{title}</strong><p>{scene.mission}</p></div><em>{completed.has('m4-complete') ? 'HOÀN THÀNH' : <><span>BẠN ĐANG Ở ĐÂY</span><b>MỞ BÀI HỌC →</b></>}</em>
                </button>
              ) : (
                <LockedRoadmapStage key={title} status="SẮP TỚI" unlockHint={unlockHintFor(index + 3)}>
                  <span>{String(index + 4).padStart(2, '0')}</span><div><strong>{title}</strong><p>Đăng tải portfolio lên mạng và học cách cập nhật khi cần</p></div>
                </LockedRoadmapStage>
              ))}
            </div>
          </div>

          <button className="pixel-home-teacher" type="button" onClick={onOpenTeacher} aria-label="Mở Triết, giáo viên đồng hành" {...{ [ONBOARDING_ANCHOR_ATTRIBUTE]: 'home-teacher' }}>
            <img src={teacherImage} alt="" />
            <span><small>TEACHER</small><strong>Triết</strong><em>Hỏi khi cần</em></span>
            {showTeacherDot ? <TeacherNewDot /> : null}
          </button>
        </section>
      ) : destination === 'lesson' ? null : (
        <section className={`pixel-app-surface is-${destination}`}>

          {destination === 'settings' ? (
            <div className="pixel-progress-surface">
              <section className="pixel-progress-position" aria-labelledby="progress-position-title">
                <div>
                  <small>Bạn đang ở bước</small>
                  <h1 id="progress-position-title">{learningPosition.lessonTitle}</h1>
                  <p>{currentModuleLabel} · Bài {learningPosition.lessonIndex}/{learningPosition.totalLessons} · {currentModuleTitle}</p>
                </div>
                <button type="button" onClick={() => onNavigate('lesson')}>
                  {completedCheckpointCount === 0 ? 'Bắt đầu học' : 'Học tiếp'} <span aria-hidden="true">→</span>
                </button>
                <div className="pixel-progress-bar-row">
                  <div><span>Tiến độ khóa học</span><span><b>{completedCheckpointCount}/{runnableCheckpointIds.length}</b> bước đã xong · {progressPercent}%</span></div>
                  <div
                    className="pixel-progress-bar"
                    role="progressbar"
                    aria-label="Tiến độ khóa học"
                    aria-valuemin={0}
                    aria-valuemax={runnableCheckpointIds.length}
                    aria-valuenow={completedCheckpointCount}
                  ><i style={{ width: `${progressPercent}%` }} /></div>
                </div>
              </section>
              <section className="pixel-progress-practice" aria-labelledby="progress-practice-title">
                <div className="pixel-progress-practice-head">
                  <small>Thực hành</small>
                  <span>{practicesDone}/{coursePractices.length} bài đã xong</span>
                </div>
                <h2 id="progress-practice-title">
                  {practicesDone === 0 ? 'Chưa có bài thực hành nào' : practicesDone === coursePractices.length ? 'Đã xong cả 4 bài thực hành' : 'Bài thực hành của bạn'}
                </h2>
                {practicesDone === coursePractices.length ? null : (
                  <p>
                    {practicesDone === 0
                      ? 'Bài thực hành là nơi bạn tự làm với Codex. Mỗi bài xong và được Triết duyệt sẽ hiện ở đây.'
                      : `Bạn chỉ còn ${coursePractices.length - practicesDone} bài để trở thành cao thủ vibe coding thôii`}
                  </p>
                )}
                <ul>
                  {coursePractices.map((item, index) => {
                    const status = practiceStatuses[index]
                    return (
                      <li key={item.checkpointId} className={`is-${status}`}>
                        <span className="pixel-progress-practice-icon" aria-hidden="true">{status === 'done' ? '✓' : index + 1}</span>
                        <span>
                          <small>{item.moduleLabel}</small>
                          <strong>{item.title}</strong>
                          {status === 'done' ? <em>Thầy giáo Triết đã xem bài tập của bạn</em> : null}
                        </span>
                        <b>{status === 'done' ? 'Đã duyệt' : status === 'next' ? 'Bài tiếp theo' : 'Chưa làm'}</b>
                      </li>
                    )
                  })}
                </ul>
              </section>
              {practice.latestEvent?.evidence ? (
                <section className="pixel-evidence-receipt">
                  <small>BẰNG CHỨNG TỪ BÀI LUYỆN TẬP</small>
                  <strong>{practice.latestEvent.summary}</strong>
                  <div><span>{practice.latestEvent.evidence.prdArtifact}</span><span>{practice.latestEvent.evidence.implementationPlanArtifact}</span><span>{practice.latestEvent.evidence.alignment}</span></div>
                </section>
              ) : null}
              <section className="pixel-settings-data" aria-labelledby="settings-data-title">
                <small id="settings-data-title">Dữ liệu trên máy này</small>
                <div>
                  <div>
                    <strong>Học lại từ đầu</strong>
                    <span>Xóa toàn bộ tiến độ, bài thực hành, tin nhắn với Triết và cài đặt trên máy này.</span>
                  </div>
                  <button ref={resetOpenerRef} type="button" onClick={() => resetDialogRef.current?.showModal()}>Xóa và học lại</button>
                </div>
              </section>
              <dialog
                ref={resetDialogRef}
                className="pixel-reset-dialog"
                aria-labelledby="reset-dialog-title"
                aria-describedby="reset-dialog-description"
                onClose={() => window.setTimeout(() => resetOpenerRef.current?.focus(), 0)}
              >
                <h2 id="reset-dialog-title">Bắt đầu lại từ đầu?</h2>
                <p id="reset-dialog-description">Toàn bộ tiến trình và lựa chọn cục bộ của hành trình này sẽ bị xóa.</p>
                <div>
                  <button type="button" autoFocus onClick={() => resetDialogRef.current?.close()}>Giữ tiến trình</button>
                  <button type="button" onClick={() => { resetDialogRef.current?.close(); onReset() }}>Xóa và bắt đầu lại</button>
                </div>
              </dialog>
            </div>
          ) : null}
        </section>
      )}

      {teacherOpen ? (
        <TeacherOverlay onClose={onCloseTeacher} />
      ) : null}

      {justUnlocked && unlockedModule && destination === 'home' && !teacherOpen && !showHomeTour ? (
        <OnboardingTour steps={unlockStepsFor(unlockedModule)} onComplete={onUnlockSeen} onSkip={onUnlockSeen} />
      ) : null}

      {showHomeTour && destination === 'home' && !teacherOpen ? (
        <OnboardingTour steps={homeTourSteps} onComplete={onHomeTourComplete} onSkip={onHomeTourSkip} />
      ) : null}
    </main>
  )
}

export function LearningWindow() {
  const [runtime, setRuntime] = useState<RuntimeInfo | null>(null)
  const [view, setView] = useState<View>('loading')
  const [savedProgress, setProgress] = useState<LearnerProgress | null>(null)
  const progress = useMemo(() => {
    if (!savedProgress) return null
    const removedPage = 'module-1-codex-orientation'
    if (savedProgress.sceneId !== removedPage && !savedProgress.sceneHistory.includes(removedPage)) return savedProgress
    return {
      ...savedProgress,
      sceneId: savedProgress.sceneId === removedPage ? 'module-1-codex-examples' as const : savedProgress.sceneId,
      sceneHistory: savedProgress.sceneHistory.filter(id => id !== removedPage)
    }
  }, [savedProgress])
  const [recovered, setRecovered] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [destination, setDestination] = useState<AppDestination>('home')
  const [teacherOpen, setTeacherOpen] = useState(false)
  const [decisionOverrides, setDecisionOverrides] = useState<Record<string, string>>({})
  const pendingDecisionsRef = useRef<Record<string, string>>({})
  // Unlock moment: compare the current module with the one seen on the previous render.
  // Updating state during render (instead of in an effect) is React's pattern for
  // reacting to a changed value; loading saved progress starts from null, so it never counts.
  const [seenLessonId, setSeenLessonId] = useState<LessonId | null>(null)
  const [unlockedModule, setUnlockedModule] = useState<LessonId | null>(null)
  const currentLessonId = progress?.currentLessonId ?? null
  if (currentLessonId !== seenLessonId) {
    setSeenLessonId(currentLessonId)
    const unlocked = moduleUnlockedBetween(seenLessonId, currentLessonId)
    if (unlocked) setUnlockedModule(unlocked)
  }
  // null while unknown; learners with an existing Triết conversation never see the "new" dot.
  const [hasTeacherConversation, setHasTeacherConversation] = useState<boolean | null>(null)
  const [practiceBriefOpen, setPracticeBriefOpen] = useState(false)
  const [verifiedGitHubRepository, setVerifiedGitHubRepository] = useState<string>()
  const [practiceFullOpen, setPracticeFullOpen] = useState(false)
  // Set while the learner rereads slides from an active Practice.
  const [practiceReturnTarget, setPracticeReturnTarget] = useState<PracticeReturnTarget | null>(null)
  const [practiceReturnBusy, setPracticeReturnBusy] = useState(false)
  const [outlineSceneId, setOutlineSceneId] = useState<SceneId | null>(null)
  const outlineRef = useRef<HTMLDetailsElement | null>(null)
  const [reviewHistoryIndex, setReviewHistoryIndex] = useState<number | null>(null)
  const [approvalFocus, setApprovalFocus] = useState<ApprovalFocus | null>(null)
  const [visualExpanded, setVisualExpanded] = useState(false)
  const [secondaryVisualExpanded, setSecondaryVisualExpanded] = useState(false)
  const [modelLessonEntry, setModelLessonEntry] = useState<{ sceneId: SceneId, topic: ModelLessonTopic } | null>(null)
  const practiceAdvanceRef = useRef<Promise<LearnerProgress> | null>(null)

  useEffect(() => {
    // Each page opened from the outline starts at the top, including after
    // browsing a long assessment or a short desktop window.
    document.querySelector('.pixel-learning-shell')?.scrollTo(0, 0)
    window.scrollTo(0, 0)
  }, [outlineSceneId, reviewHistoryIndex, progress?.sceneId])

  const advanceFromCompletedPractice = async (current: LearnerProgress): Promise<LearnerProgress> => {
    if (current.sceneId !== 'module-2-planning-package' || current.practice.status !== 'completed') return current
    const hasPassedReceipt = current.practiceCompletions.some((receipt) =>
      receipt.practiceId === 'm2-planning-package'
      && receipt.checkpointId === 'm2-planning-package'
      && receipt.status === 'completed')
    if (!hasPassedReceipt) return current
    if (practiceAdvanceRef.current) return practiceAdvanceRef.current
    const completed = new Set(current.completedCheckpointIds)
    completed.add('m2-planning-package')
    const update: ProgressUpdate = {
      currentLessonId: 'module-2',
      currentCourseLessonId: 'm2-assessment',
      checkpointId: 'm2-mastery',
      sceneId: 'module-2-mastery',
      sceneHistory: [...current.sceneHistory, current.sceneId].slice(-200),
      completedCheckpointIds: [...completed],
      decisions: current.decisions
    }
    const advance = window.courseCompanion
      ? window.courseCompanion.saveProgress(update)
      : Promise.resolve(previewProgress(update, current))
    practiceAdvanceRef.current = advance
    try {
      return await advance
    } finally {
      practiceAdvanceRef.current = null
    }
  }

  const refreshAfterPractice = async () => {
    if (!window.courseCompanion) return
    const loadResult = await window.courseCompanion.loadProgress()
    if (loadResult.status !== 'returning' && loadResult.status !== 'recovered') return
    const updated = await advanceFromCompletedPractice(loadResult.progress)
    setProgress(updated)
  }

  useEffect(() => {
    const load = async () => {
      try {
        const api = window.courseCompanion
        const [runtimeInfo, loadResult]: [RuntimeInfo | null, ProgressLoadResult] = await Promise.all([
          api?.getRuntimeInfo() ?? Promise.resolve(null),
          api?.loadProgress() ?? Promise.resolve({ status: 'new' as const })
        ])
        setRuntime(runtimeInfo)

        if (loadResult.status === 'new') {
          setView('welcome')
          return
        }
        if (loadResult.status === 'reset-required') {
          setError(loadResult.reason)
          setView('reset-required')
          return
        }

        const loadedProgress = await advanceFromCompletedPractice(loadResult.progress)
        setProgress(loadedProgress)
        if (loadedProgress.sceneId === 'module-1-setup-checklist') setPracticeBriefOpen(true)
        setRecovered(loadResult.status === 'recovered')
        setView('resume')
      } catch {
        setError('Không thể tải tiến trình cục bộ.')
        setView('error')
      }
    }

    void load()
  }, [])

  useEffect(() => {
    if (view !== 'app' || hasTeacherConversation !== null) return
    let cancelled = false
    void (async () => {
      try {
        const state = await window.courseCompanion?.loadCompanionState()
        if (!cancelled) setHasTeacherConversation((state?.conversation.messages.length ?? 0) > 0)
      } catch {
        // History unknown: stay quiet rather than mark Triết as new.
        if (!cancelled) setHasTeacherConversation(true)
      }
    })()
    return () => { cancelled = true }
  }, [view, hasTeacherConversation])

  useEffect(() => {
    const unsubscribe = window.courseCompanion?.onPracticeReturned(() => {
      void (async () => {
        try {
          const loadResult = await window.courseCompanion?.loadProgress()
          if (!loadResult || (loadResult.status !== 'returning' && loadResult.status !== 'recovered')) return
          setProgress(loadResult.progress)
          setPracticeBriefOpen(false)
          setPracticeFullOpen(false)
          setPracticeReturnTarget(null)
          setTeacherOpen(false)
          setDestination('lesson')
          setView('app')
        } catch {
          setError('Kh\u00f4ng th\u1ec3 kh\u00f4i ph\u1ee5c b\u00e0i h\u1ecdc sau Practice. K\u1ebft qu\u1ea3 \u0111\u1ea1t v\u1eabn \u0111\u01b0\u1ee3c l\u01b0u.')
        }
      })()
    })
    return () => unsubscribe?.()
  }, [])
  const persist = async (update: ProgressUpdate): Promise<LearnerProgress> => {
    const saved = window.courseCompanion
      ? await window.courseCompanion.saveProgress(update)
      : previewProgress(update, progress ?? undefined)
    setProgress(saved)
    return saved
  }

  // Onboarding flags are applied immediately (so a slow or failed save never shows
  // them twice in a session) and every save carries all of them, so two flags saved
  // back to back — e.g. closing the lesson tip by opening chat — never undo each other.
  const effectiveDecisions = { ...progress?.decisions, ...decisionOverrides }
  const onboardingState = readOnboardingTourState(effectiveDecisions)
  const saveOnboardingDecision = (key: string, value: string) => {
    pendingDecisionsRef.current = { ...pendingDecisionsRef.current, [key]: value }
    setDecisionOverrides(pendingDecisionsRef.current)
    if (!progress) return
    void persist({
      currentLessonId: progress.currentLessonId,
      currentCourseLessonId: progress.currentCourseLessonId,
      checkpointId: progress.checkpointId,
      sceneId: progress.sceneId,
      sceneHistory: progress.sceneHistory,
      completedCheckpointIds: progress.completedCheckpointIds,
      decisions: { ...progress.decisions, ...pendingDecisionsRef.current }
    }).catch(() => {
      // Not critical: the in-session override keeps it hidden; it may show again next launch.
    })
  }
  const saveOnboardingState = (value: OnboardingTourState) => saveOnboardingDecision(ONBOARDING_TOUR_DECISION_KEY, value)
  const showTeacherDot = shouldShowTeacherDot(effectiveDecisions, hasTeacherConversation)
  const clearOnboardingDecisions = () => {
    pendingDecisionsRef.current = {}
    setDecisionOverrides({})
  }
  const returnToPractice = async () => {
    const api = window.courseCompanion
    if (!api || !practiceReturnTarget || practiceReturnBusy) return
    setPracticeReturnBusy(true)
    setError('')
    try {
      if (practiceReturnTarget === 'full') {
        await api.showFullTeacher()
      } else if (!(await api.returnToPracticePanel())) {
        setPracticeReturnTarget(null)
        return
      }
      setPracticeReturnTarget(null)
    } catch {
      setError('Chưa quay lại được Practice. Hãy thử lại.')
    } finally {
      setPracticeReturnBusy(false)
    }
  }
  // Every way into Triết chat from this window goes through here.
  const openTeacher = () => {
    if (practiceReturnTarget === 'full') {
      void returnToPractice()
      return
    }
    setTeacherOpen(true)
    if (effectiveDecisions[TEACHER_CHAT_OPENED_DECISION_KEY] !== 'yes') {
      saveOnboardingDecision(TEACHER_CHAT_OPENED_DECISION_KEY, 'yes')
    }
  }

  // Declared after openTeacher so the listener always uses the current version.
  useEffect(() => {
    const unsubscribe = window.courseCompanion?.onFullTeacherRequested(() => {
      setPracticeBriefOpen(false)
      setPracticeFullOpen(true)
      setPracticeReturnTarget(null)
      openTeacher()
    })
    return () => {
      unsubscribe?.()
    }
  })

  // Rereading slides keeps Practice active; resume the saved learning page.
  useEffect(() => {
    const unsubscribe = window.courseCompanion?.onLessonReviewRequested((returnTarget) => {
      setPracticeBriefOpen(false)
      // A full review stays mounted but hidden, so its hint and scroll survive the switch.
      if (returnTarget === 'compact') {
        setPracticeFullOpen(false)
        setTeacherOpen(false)
      }
      setOutlineSceneId(null)
      setReviewHistoryIndex(null)
      setDestination('lesson')
      setPracticeReturnTarget(returnTarget)
    })
    return () => unsubscribe?.()
  }, [])



  const startNew = async () => {
    setBusy(true)
    setError('')
    clearOnboardingDecisions()
    try {
      await persist(initialUpdate())
      setRecovered(false)
      setOutlineSceneId(null)
      setReviewHistoryIndex(null)
      setDestination('lesson')
      setTeacherOpen(false)
      setView('app')
    } catch {
      setError('Không thể tạo tiến trình mới.')
      setView('error')
    } finally {
      setBusy(false)
    }
  }

  const reset = async () => {
    setBusy(true)
    try {
      await window.courseCompanion?.resetProgress()
      setProgress(null)
      clearOnboardingDecisions()
      // Reset also clears Teacher history, so the "new" dot comes back.
      setHasTeacherConversation(null)
      setDestination('home')
      setTeacherOpen(false)
      setOutlineSceneId(null)
      setReviewHistoryIndex(null)
      setRecovered(false)
      setView('welcome')
    } catch {
      setError('Không thể xóa tiến trình cục bộ.')
      setView('error')
    } finally {
      setBusy(false)
    }
  }


  const completePortfolioPlanningModule = async () => {
    if (!window.courseCompanion || busy) return
    setBusy(true)
    setError('')
    try {
      const completed = await window.courseCompanion.completePortfolioPlanningModule()
      setProgress(completed)
      setOutlineSceneId(null)
      setReviewHistoryIndex(null)
      setTeacherOpen(false)
      setDestination('home')
    } catch {
      setError('Gate chưa đạt. Hãy làm lại câu chưa đúng và làm mới Practice nếu artifact hoặc biên nhận đã thay đổi.')
    } finally {
      setBusy(false)
    }
  }

  const completePortfolioBuildModule = async () => {
    if (!window.courseCompanion || busy) return
    setBusy(true)
    setError('')
    try {
      const completed = await window.courseCompanion.completePortfolioBuildModule()
      setProgress(completed)
      setOutlineSceneId(null)
      setReviewHistoryIndex(null)
      setDestination('lesson')
    } catch {
      setError('Gate Module 3 chưa đạt. Hãy làm mới Practice và bổ sung artifact, biên nhận phần xây dựng hoặc câu trả lời còn thiếu.')
    } finally {
      setBusy(false)
    }
  }

  const advanceToScene = async (nextSceneId: SceneId, decisions: Record<string, string>) => {
    if (!progress) return
    const currentScene = scenes[progress.sceneId]
    const nextScene = scenes[nextSceneId]
    const completed = new Set(progress.completedCheckpointIds)
    if (currentScene.checkpointId !== nextScene.checkpointId) {
      completed.add(currentScene.checkpointId)
    }
    if (progress.sceneId === 'module-1-final-summary' && nextSceneId === 'module-2-portfolio-workspace') {
      completed.add('m1-complete')
    }
    await persist({
      currentLessonId: nextScene.lessonId,
      currentCourseLessonId: courseLessonIdForScene(nextSceneId),
      checkpointId: nextScene.checkpointId,
      sceneId: nextSceneId,
      sceneHistory: [...progress.sceneHistory, progress.sceneId].slice(-200),
      completedCheckpointIds: [...completed],
      decisions
    })
  }

  const saveAssessmentResult = async (question: AssessmentQuestion, result: string) => {
    if (!progress || busy) return false
    setBusy(true)
    setError('')
    try {
      await persist({
        currentLessonId: progress.currentLessonId,
        currentCourseLessonId: progress.currentCourseLessonId,
        checkpointId: progress.checkpointId,
        sceneId: progress.sceneId,
        sceneHistory: progress.sceneHistory,
        completedCheckpointIds: progress.completedCheckpointIds,
        decisions: {
          ...progress.decisions,
          [assessmentDecisionKey(question.id)]: result
        }
      })
      return true
    } catch {
      setError('Không thể lưu câu trả lời này. Hãy thử lại trước khi tiếp tục.')
      return false
    } finally {
      setBusy(false)
    }
  }

  const saveAssessmentBatch = async (group: AssessmentGroup, answers: Record<string, string>) => {
    if (!progress || busy) return false
    setBusy(true)
    setError('')
    try {
      const assessmentDecisions = Object.fromEntries(group.questions.map((question) => {
        const answer = answers[question.id]?.trim() ?? ''
        if (question.type !== 'multiple-choice') {
          const currentResult = progress.decisions[assessmentDecisionKey(question.id)]
          if (currentResult?.startsWith('correct')) {
            return [assessmentDecisionKey(question.id), currentResult]
          }
          return [assessmentDecisionKey(question.id), `review:self-review:${answer}`]
        }
        const answerIndex = Number(answer)
        return [
          assessmentDecisionKey(question.id),
          answerIndex === question.answerIndex ? `correct:${answerIndex}` : `incorrect:${answerIndex}`
        ]
      }))
      const decisions = {
        ...progress.decisions,
        ...assessmentDecisions
      }
      if (group.id === 'final-assessment') {
        await advanceToScene('module-2-portfolio-mastery-summary', decisions)
        return true
      }
      await persist({
        currentLessonId: progress.currentLessonId,
        currentCourseLessonId: progress.currentCourseLessonId,
        checkpointId: progress.checkpointId,
        sceneId: progress.sceneId,
        sceneHistory: progress.sceneHistory,
        completedCheckpointIds: progress.completedCheckpointIds,
        decisions
      })
      return true
    } catch {
      setError('Không thể lưu phần trả lời này. Hãy thử lại trước khi tiếp tục.')
      return false
    } finally {
      setBusy(false)
    }
  }

  const continueAssessment = async (question: AssessmentQuestion, group: AssessmentGroup) => {
    if (!progress || busy) return
    const questionIndex = group.questions.findIndex((candidate) => candidate.id === question.id)
    const nextQuestion = group.questions[questionIndex + 1]
    const exitScene: Record<string, SceneId> = {
      'setup-final-assessment': 'module-1-final-summary',
      'final-assessment': 'module-2-portfolio-mastery-summary',
      'm3-final-assessment': 'module-3-mastery-summary',
      'planning-prd-check': 'module-2-prd-interview',
      'prompt-check': 'module-2-implementation-plan',
      'implementation-plan-check': 'module-2-planning-package',
      'legacy-final-assessment': 'module-2-final-summary'
    }
    const nextSceneId = nextQuestion?.sceneId ?? exitScene[group.id]
    if (!nextSceneId) return

    setBusy(true)
    setError('')
    try {
      const decisions = { ...progress.decisions }
      if (!nextQuestion && group.id === 'prompt-check') {
        decisions.promptMethod = 'one-question-at-a-time'
      }
      if (!nextQuestion && group.id === 'implementation-plan-check') {
        decisions.planStructure = 'observable-and-verifiable'
        decisions.alignmentDecision = 'remove-scope-creep'
      }
      await advanceToScene(nextSceneId, decisions)
    } catch {
      setError('Không thể mở câu tiếp theo. Hãy thử lại trước khi tiếp tục.')
    } finally {
      setBusy(false)
    }
  }

  const retryFinalAssessment = async () => {
    if (!progress || busy) return
    const finalGroupId = scenes[progress.sceneId].assessmentGroupId ?? 'final-assessment'
    const finalGroup = assessmentGroupById.get(finalGroupId)
    const firstQuestion = finalGroup?.questions[0]
    if (!finalGroup || !firstQuestion) return

    setBusy(true)
    setError('')
    try {
      const finalQuestionIds = new Set(finalGroup.questions.map((question) => assessmentDecisionKey(question.id)))
      const decisions = Object.fromEntries(
        Object.entries(progress.decisions).filter(([key]) => !finalQuestionIds.has(key))
      )
      await advanceToScene(firstQuestion.sceneId, decisions)
    } catch {
      setError('Không thể bắt đầu lại phần kiểm tra. Hãy thử lại.')
    } finally {
      setBusy(false)
    }
  }

  const choose = async (choice: Choice) => {
    if (!progress || busy) return
    if (choice.action === 'home') {
      setTeacherOpen(false)
      setOutlineSceneId(null)
      setReviewHistoryIndex(null)
      setDestination('home')
      return
    }
    if (choice.action === 'review-module') {
      const firstModuleSceneIndex = reviewTrail(progress.sceneHistory, progress.sceneId, nextReviewPageOf)
        .findIndex((sceneId) => sceneId.startsWith('module-2-'))
      if (firstModuleSceneIndex >= 0) setReviewHistoryIndex(firstModuleSceneIndex)
      return
    }
    if (choice.action === 'practice') {
      const practiceScene = scenes[progress.sceneId]
      if (practiceScene.practice
        || progress.sceneId === 'module-1-setup-checklist'
        || progress.sceneId === 'module-2-portfolio-practice'
        || progress.sceneId === 'module-3-first-build'
        || progress.sceneId === 'module-3-pre-practice-summary'
        || progress.sceneId === 'module-4-portfolio-practice') {
        setBusy(true)
        setOutlineSceneId(null)
        setReviewHistoryIndex(null)
        setError('')
        try {
          if (choice.next && choice.next !== progress.sceneId) await advanceToScene(choice.next, progress.decisions)
          setPracticeBriefOpen(true)
        } catch {
          setError('Không thể lưu checkpoint này. Hãy thử lại trước khi tiếp tục.')
        } finally {
          setBusy(false)
        }
      }
      return
    }
    if (!choice.next) return

    setBusy(true)
    setOutlineSceneId(null)
    setReviewHistoryIndex(null)
    setError('')
    try {
      const decisions = choice.decision
        ? { ...progress.decisions, [choice.decision.key]: choice.decision.value }
        : progress.decisions
      await advanceToScene(choice.next, decisions)
      setApprovalFocus(null)
      setVisualExpanded(false)
      setSecondaryVisualExpanded(false)
      if (choice.afterSave === 'home') {
        setTeacherOpen(false)
        setDestination('home')
      }
    } catch {
      setError('Không thể lưu checkpoint này. Hãy thử lại trước khi tiếp tục.')
    } finally {
      setBusy(false)
    }
  }

  if (view === 'loading') {
    return <main className="pixel-loading">ĐANG ĐỌC TIẾN TRÌNH…</main>
  }

  if (view === 'welcome' || view === 'resume' || view === 'reset-confirm' || view === 'reset-required') {
    return (
      <EntryScreen
        mode={view}
        progress={progress}
        recovered={recovered}
        busy={busy}
        onPrimary={() => {
          if (view === 'resume') {
            setOutlineSceneId(null)
            setReviewHistoryIndex(null)
            setDestination(progress?.currentLessonId === 'intro' ? 'lesson' : 'home')
            setTeacherOpen(false)
            setView('app')
            return
          }
          void (view === 'welcome' ? startNew() : reset())
        }}
        onReset={() => setView('reset-confirm')}
        onCancelReset={() => setView(progress ? 'resume' : 'welcome')}
      />
    )
  }

  if (view === 'error' || !progress) {
    return (
      <main className="pixel-loading pixel-loading--error">
        <strong>KHÔNG THỂ TIẾP TỤC</strong>
        <span>{error || 'Không tìm thấy checkpoint.'}</span>
        <button type="button" onClick={() => setView(progress ? 'resume' : 'welcome')}>Quay lại</button>
      </main>
    )
  }

  const clearPageOverlays = () => {
    setApprovalFocus(null)
    setVisualExpanded(false)
    setSecondaryVisualExpanded(false)
    setPracticeBriefOpen(false)
    if (practiceReturnTarget !== 'full') {
      setPracticeFullOpen(false)
      setTeacherOpen(false)
    }
    setError('')
  }

  if (destination !== 'lesson') {
    return (
      <PixelAppShell
        progress={progress}
        runtime={runtime}
        destination={destination}
        teacherOpen={teacherOpen}
        onNavigate={(nextDestination) => {
          setTeacherOpen(false)
          setDestination(nextDestination)
        }}
        onReviewModule={(moduleId) => {
          clearPageOverlays()
          setReviewHistoryIndex(null)
          setOutlineSceneId(courseOutline[moduleId][0]!.startSceneId)
          setDestination('lesson')
        }}
        onOpenTeacher={openTeacher}
        onCloseTeacher={() => setTeacherOpen(false)}
        onQuit={() => void window.courseCompanion?.quitApp()}
        onReset={() => void reset()}
        showHomeTour={shouldShowHomeTour(progress, onboardingState)}
        showTeacherDot={showTeacherDot}
        unlockedModule={unlockedModule}
        onUnlockSeen={() => setUnlockedModule(null)}
        onHomeTourComplete={() => saveOnboardingState('home-done')}
        onHomeTourSkip={() => saveOnboardingState('skipped')}
      />
    )
  }

  const reviewSceneTrail = reviewTrail(progress.sceneHistory, progress.sceneId, nextReviewPageOf)
  const reviewingSceneId = reviewHistoryIndex === null
    ? undefined
    : reviewSceneTrail[reviewHistoryIndex]
  const isReviewing = outlineSceneId !== null || reviewingSceneId !== undefined
  const currentReviewIndex = reviewHistoryIndex ?? reviewSceneTrail.length
  const displayedSceneId = outlineSceneId ?? reviewingSceneId ?? visibleLessonScene(progress.sceneId)
  const scene = scenes[displayedSceneId]
  const activePracticeDefinition = progress.sceneId === 'module-1-setup-checklist'
    ? setupPracticeDefinition : scenes[progress.sceneId].practice
  const learningPosition = learningPositionByScene[displayedSceneId]
  const modulePages = (scene.lessonId === 'intro' ? ['intro-overview' as const] : moduleLessonIds[scene.lessonId])
    .flatMap((lessonId) => courseLessonPages[lessonId].flat())
  const outlineItems = courseOutline[scene.lessonId]
  const reviewPages = reviewableOutlinePages(modulePages, progress)
  const outlineCurrentIndex = outlineSectionIndex(outlineItems, modulePages, displayedSceneId)
  const outlineModuleLabel = scene.lessonId === 'intro'
    ? 'GIỚI THIỆU'
    : `MODULE ${scene.lessonId.slice(-1)}`
  const closeOutline = () => {
    if (outlineRef.current) {
      outlineRef.current.open = false
      outlineRef.current.querySelector('summary')?.focus({ preventScroll: true })
    }
  }
  const openOutlinePage = (sceneId: SceneId) => {
    if (busy || !reviewPages.includes(sceneId)) return
    clearPageOverlays()
    setReviewHistoryIndex(null)
    setOutlineSceneId(sceneId)
    closeOutline()
  }
  const returnToLearningPage = () => {
    clearPageOverlays()
    setOutlineSceneId(null)
    setReviewHistoryIndex(null)
    closeOutline()
  }
  const isFirstModuleOneSlide = displayedSceneId === 'module-1-chat-work'
  const canOpenPreviousPage = !isFirstModuleOneSlide && (outlineSceneId !== null
    ? adjacentOutlinePage(reviewPages, displayedSceneId, -1) !== undefined
    : isReviewing
      ? currentReviewIndex > 0
      : reviewSceneTrail.length > 0)
  const openPreviousPage = () => {
    if (!canOpenPreviousPage) return
    clearPageOverlays()
    if (outlineSceneId !== null) {
      setOutlineSceneId(adjacentOutlinePage(reviewPages, displayedSceneId, -1) ?? outlineSceneId)
      return
    }
    setReviewHistoryIndex(isReviewing ? currentReviewIndex - 1 : reviewSceneTrail.length - 1)
  }
  const openNextReviewPage = () => {
    if (!isReviewing) return
    clearPageOverlays()
    if (displayedSceneId === 'module-2-portfolio-mastery-summary'
      && progress.completedCheckpointIds.includes('m2-portfolio-complete')) {
      // A finished Module 2 returns to Home Base instead of paging into Module 3.
      setOutlineSceneId(null)
      setReviewHistoryIndex(null)
      setTeacherOpen(false)
      setDestination('home')
      return
    }
    if (outlineSceneId !== null) {
      // Browsing is session-only, including Practice and assessment pages.
      // Resuming the saved learning page is an explicit action.
      setOutlineSceneId(adjacentOutlinePage(reviewPages, displayedSceneId, 1) ?? null)
      return
    }
    const nextIndex = currentReviewIndex + 1
    setReviewHistoryIndex(nextIndex < reviewSceneTrail.length ? nextIndex : null)
  }
  const reviewNextLabel = outlineSceneId !== null && !adjacentOutlinePage(reviewPages, displayedSceneId, 1)
    ? 'Về trang đang học'
    : 'Tiếp tục'
  const lessonContextLabel = scene.lessonId === 'module-2'
    ? outlineItems[outlineCurrentIndex]!.title
    : scene.lessonId === 'intro'
    ? `GIỚI THIỆU KHÓA HỌC · TRANG ${learningPosition.page}/${learningPosition.totalPages}`
    : `MODULE ${scene.lessonId.slice(-1)} · BÀI ${learningPosition.lessonIndex}/${learningPosition.totalLessons} · TRANG ${learningPosition.page}/${learningPosition.totalPages}`
  const assessmentQuestion = scene.assessmentQuestionId
    ? assessmentQuestionById.get(scene.assessmentQuestionId)
    : undefined
  const assessmentGroup = scene.assessmentGroupId
    ? assessmentGroupById.get(scene.assessmentGroupId)
    : undefined
  const assessmentResults = assessmentGroup
    ? Object.fromEntries(assessmentGroup.questions.map((question) => [
        question.id,
        progress.decisions[assessmentDecisionKey(question.id)]
      ]))
    : {}
  const isAssessmentQuestionPage = Boolean(assessmentQuestion && assessmentGroup)
  const assessmentContinueLabel = assessmentGroup?.mode === 'mastery'
    ? `Xem kết quả ${assessmentGroup.questions.length} câu`
    : 'Tiếp tục bài học'
  const finalAssessment = scene.assessmentSummary && scene.assessmentGroupId
    ? assessmentGroupById.get(scene.assessmentGroupId)
    : assessmentGroupById.get('final-assessment')
  const finalQuestionCount = finalAssessment?.questions.length ?? 0
  const finalAnsweredCount = finalAssessment?.questions.filter((question) =>
    Boolean(progress.decisions[assessmentDecisionKey(question.id)]))
  .length ?? 0
  const finalCorrectCount = finalAssessment?.questions.filter((question) =>
    progress.decisions[assessmentDecisionKey(question.id)]?.startsWith('correct')
  ).length ?? 0
  const finalPassingCount = finalAssessment
    ? Math.ceil(finalAssessment.questions.length * (finalAssessment.passingScore ?? 0.8))
    : 0
  const finalPassed = finalCorrectCount >= finalPassingCount
  const isPortfolioMasterySummary = displayedSceneId === 'module-2-portfolio-mastery-summary'
    || displayedSceneId === 'module-3-mastery-summary'
  const isPassFailSummary = Boolean(scene.assessmentSummary) && !isPortfolioMasterySummary
  const portfolioPlanningHandoff = [...progress.practiceCompletions].reverse().find((receipt) =>
    receipt.practiceId === 'm2-portfolio-planning'
    && receipt.practiceVersion === '2.0.0'
    && receipt.courseRunId === progress.courseRunId
    && receipt.portfolioPlanningHandoff?.schemaVersion === 2)?.portfolioPlanningHandoff
  const lessonVisual = sceneVisuals[displayedSceneId] ?? (learningPosition.page === 1
    ? lessonVisuals[learningPosition.lessonId]
    : undefined)
  const secondaryLessonVisual = sceneSecondaryVisuals[displayedSceneId]
  const modelLessonBoardKind = modelLessonBoardByScene[displayedSceneId]
  const guidanceLessonBoardKind = guidanceLessonBoardByScene[displayedSceneId]
  const usesImplementationPlanBoard = Boolean(implementationPlanBoardByScene[displayedSceneId])
  const usesModelLessonBoard = Boolean(modelLessonBoardKind && lessonVisual)
  const usesGuidanceLessonBoard = Boolean(guidanceLessonBoardKind)
  const usesProjectsLessonBoard = displayedSceneId === 'module-1-codex-projects'
  const firstBuildPage = displayedSceneId === 'module-3-first-build'
  const canEnterFirstBuild = firstBuildPage && isPortfolioBuildLesson(progress.checkpointId)
  const enterFirstBuild = async () => {
    const api = window.courseCompanion
    if (busy || !canEnterFirstBuild) return
    if (!api) {
      setError('Hãy mở Course Companion trên máy để tiếp tục trong project Codex từ Module 2.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const identity = { practiceId: 'm3-portfolio-build', practiceVersion: portfolioBuildVersion }
      const workspace = await api.loadPracticeWorkspace(identity)
      if (workspace.transition) {
        setPracticeBriefOpen(true)
        return
      }
      if (workspace.activePractice?.practiceId === identity.practiceId) {
        await api.resumePractice(identity)
      } else {
        await api.startPractice({ ...identity, transfer: false })
      }
      setOutlineSceneId(null)
      setReviewHistoryIndex(null)
    } catch {
      const current = await api.loadPracticeWorkspace().catch(() => null)
      setError(current?.error || 'Chưa mở được task Codex từ Module 2. Hãy thử lại.')
    } finally {
      setBusy(false)
    }
  }
  const floatingCopyPrompt = firstBuildPage ? undefined : scene.copyPrompt
  const usesLessonBoard = usesModelLessonBoard || usesGuidanceLessonBoard || usesImplementationPlanBoard || usesProjectsLessonBoard
  const isApprovalTour = displayedSceneId === 'module-1-codex-examples'
  const isVercelTutorial = displayedSceneId === 'module-4-vercel-benefits'
  const isGitHubPractice = displayedSceneId === 'module-3-github-practice'
  // Saved when the learner continues; kept in state until then so a passed check is not lost.
  const githubRepository = verifiedGitHubRepository ?? progress.decisions.portfolioGitHubRepository
  const isModuleOneOpening = displayedSceneId === 'module-1-chat-work' || displayedSceneId === 'module-1-why-codex'
  const standaloneReadingPage = isModuleOneOpening || isVercelTutorial || isGitHubPractice
  const canExpandLessonVisual = scene.lessonId !== 'intro'
  const canShowSceneMedia = !assessmentQuestion && !scene.assessmentSummary
  const usesPairedLessonNavigation = isReviewing || (!assessmentQuestion && !scene.assessmentSummary)
  const showsSceneTitle = scene.showTitle !== false
    && !usesLessonBoard
    && !isAssessmentQuestionPage
  const usesModuleTwoVisualGallery = scene.lessonId === 'module-2'
    && canShowSceneMedia
    && Boolean(lessonVisual)
    && Boolean(secondaryLessonVisual)
    && !usesLessonBoard
  const isCoursePrototype = displayedSceneId === 'module-2-html-design-prototype'
  const usesModuleTwoVisualDialogue = scene.lessonId === 'module-2'
    && canShowSceneMedia
    && Boolean(lessonVisual)
    && !usesLessonBoard
    && (showsSceneTitle || usesModuleTwoVisualGallery || isCoursePrototype)
  const pageBackControl = (
    <button
      className="pixel-page-back"
      disabled={!canOpenPreviousPage}
      type="button"
      onClick={openPreviousPage}
    >
      ← Trang trước
    </button>
  )

  return (
    <main data-scene-id={displayedSceneId} data-outline-preview={outlineSceneId !== null} className={`pixel-learning-shell${scene.lessonId === 'module-2' ? ' is-module-two' : ''}${scene.lessonId === 'module-3' ? ' is-module-three' : ''}${scene.lessonId === 'module-4' ? ' is-module-four' : ''}${lessonVisual?.annotations ? ' has-publication-walkthrough' : ''}${usesLessonBoard ? ' has-model-lesson-board' : ''}${floatingCopyPrompt ? ' has-stacked-copy-prompt' : ''}${usesModuleTwoVisualDialogue ? ' has-module-two-visual-dialogue' : ''}${usesModuleTwoVisualGallery ? ' has-module-two-visual-gallery' : ''}${displayedSceneId === 'module-3-git-commit' || displayedSceneId === 'module-3-git-push' || displayedSceneId === 'module-3-github-intro' || displayedSceneId === 'module-3-git-merge' || displayedSceneId === 'module-1-setup-checklist' || displayedSceneId === 'module-4-hosting-intro' || lessonVisual?.annotations ? ' has-stacked-visual-dialogue' : ''}`}>
      <div className="pixel-scene-world" style={sceneStyle} aria-hidden="true" />

      <header className={`pixel-hud${practiceReturnTarget ? ' has-practice-return' : ''}`}>
        <button className="pixel-brand pixel-brand--button" type="button" onClick={() => {
          setApprovalFocus(null)
          setVisualExpanded(false)
          setSecondaryVisualExpanded(false)
          setTeacherOpen(false)
          setOutlineSceneId(null)
          setReviewHistoryIndex(null)
          setDestination('home')
        }}>
          <span className="pixel-brand__mark" aria-hidden="true">C</span>
          <span><strong>VIBECODING 101</strong><small>VỀ HOME BASE</small></span>
        </button>
        <details className="pixel-outline" ref={outlineRef} onKeyDown={(event) => {
          if (event.key === 'Escape') closeOutline()
        }}>
          <summary aria-label={`Mở mục lục ${outlineModuleLabel}`} {...{ [ONBOARDING_ANCHOR_ATTRIBUTE]: 'outline-menu' }}>
            <span className="pixel-outline__dots" aria-hidden="true">•••</span>
            <span className="pixel-outline__label">{scene.lessonId === 'module-2'
              ? `${outlineModuleLabel} · PHẦN ${outlineCurrentIndex + 1}/${outlineItems.length}`
              : lessonContextLabel}</span>
            {practiceReturnTarget ? (
              <span className="pixel-outline__short" aria-hidden="true">{outlineCurrentIndex + 1}/{outlineItems.length}</span>
            ) : null}
          </summary>
          <div className="pixel-outline-menu">
            <strong>{outlineModuleLabel} · {outlineItems.length} PHẦN</strong>
            <ol>
              {outlineItems.map((item, index) => {
                const locked = !reviewPages.includes(item.startSceneId)
                return (
                  <li
                    className={index === outlineCurrentIndex ? 'is-active' : locked ? 'is-locked' : undefined}
                    aria-current={index === outlineCurrentIndex ? 'step' : undefined}
                    title={locked ? 'Hoàn thành phần trước để mở' : undefined}
                    key={item.startSceneId}
                  >
                    <button type="button" disabled={busy || locked} aria-label={locked ? `${item.title} (Hoàn thành phần trước để mở)` : undefined} onClick={() => openOutlinePage(item.startSceneId)}>
                      {locked ? (
                        <svg className="pixel-outline-lock" viewBox="0 0 12 12" aria-hidden="true">
                          <path d="M3.5 5V3.75a2.5 2.5 0 0 1 5 0V5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                          <rect x="2" y="5" width="8" height="6" rx="1.5" fill="currentColor" />
                        </svg>
                      ) : <i aria-hidden="true" />}
                      <span>{item.title}</span>
                    </button>
                  </li>
                )
              })}
            </ol>
            {isReviewing ? (
              <button className="pixel-outline-resume" type="button" onClick={returnToLearningPage}>
                Về trang đang học
              </button>
            ) : null}
          </div>
        </details>
        <div className="pixel-hud-actions">
          {practiceReturnTarget ? (
            <button
              className="pixel-practice-return"
              type="button"
              aria-busy={practiceReturnBusy}
              disabled={practiceReturnBusy}
              onClick={() => void returnToPractice()}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>
              Quay lại Practice
            </button>
          ) : null}
          {/* The button clips its zoomed portrait, so the dot sits on a wrapper. */}
          <span className="pixel-teacher-dot-anchor">
            <button className="pixel-hud-teacher" type="button" onClick={openTeacher} aria-label="Trò chuyện với Triết" title="Trò chuyện với Triết" {...{ [ONBOARDING_ANCHOR_ATTRIBUTE]: 'lesson-teacher' }}>
              <img src={teacherImage} alt="" />
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path fill="currentColor" stroke="var(--pixel-yellow)" d="M4 2h8a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3H8l-4 3v-3a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3Z" />
                <path stroke="var(--pixel-yellow)" strokeLinecap="round" strokeWidth="1.6" d="M5 7h.1M8 7h.1M11 7h.1" />
              </svg>
            </button>
            {showTeacherDot ? <TeacherNewDot /> : null}
          </span>
          <button className="pixel-quit" type="button" onClick={() => void window.courseCompanion?.quitApp()}>
            THOÁT <span className="pixel-quit-version">· v{runtime?.appVersion ?? '…'}</span>
          </button>
        </div>
      </header>

      {displayedSceneId === 'module-3-pre-practice-summary' ? (
        <aside className="pixel-scene-title is-pre-practice-summary">
          <strong>Túm lại, đây là 4 điều cần nhớ trước khi bạn bắt đầu thực hành</strong>
        </aside>
      ) : null}

      {floatingCopyPrompt && !usesLessonBoard ? (
        <CopyPromptCard
          label={scene.copyPromptLabel}
          prompt={floatingCopyPrompt}
          title={scene.copyPromptTitle}
        />
      ) : null}
      {assessmentQuestion || scene.assessmentSummary || usesLessonBoard || standaloneReadingPage
        ? null
        : <img className="pixel-teacher-character" src={teacherImage} alt="Triết, giáo viên đồng hành" />}

      {canShowSceneMedia && lessonVisual && secondaryLessonVisual && !usesLessonBoard
        ? (
            <div
              className="pixel-lesson-visual-group is-reference-gallery"
              aria-label="Hai nguồn tham khảo thiết kế"
            >
              {[lessonVisual, secondaryLessonVisual].map((visual, index) => (
                <figure className="pixel-lesson-visual is-grouped" key={visual.image}>
                  <LessonVisualMedia
                    activeFocus={null}
                    isApprovalTour={false}
                    visual={visual}
                  />
                  {canExpandLessonVisual ? (
                    <button
                      aria-label={`Phóng to ảnh ${visual.caption}`}
                      className="pixel-visual-expand"
                      type="button"
                      onClick={() => index === 0 ? setVisualExpanded(true) : setSecondaryVisualExpanded(true)}
                    >
                      PHÓNG TO
                    </button>
                  ) : null}
                  {visual.caption ? <figcaption>{visual.caption}</figcaption> : null}
                </figure>
              ))}
            </div>
          )
        : canShowSceneMedia && lessonVisual && !usesLessonBoard
          ? (
            <figure className={`pixel-lesson-visual${isApprovalTour ? ' is-approval-tour' : ''}${displayedSceneId === 'module-3-visible-error-prompt' || displayedSceneId === 'module-3-repeated-error' ? ' is-featured-example' : ''}${displayedSceneId === 'module-3-git-github' ? ' is-title-replacement' : ''}`}>
              <LessonVisualMedia
                activeFocus={approvalFocus}
                isApprovalTour={isApprovalTour}
                visual={lessonVisual}
              />
              {(isCoursePrototype || displayedSceneId === 'module-3-git-push' || displayedSceneId === 'module-3-github-intro' || displayedSceneId === 'module-3-git-merge' || displayedSceneId === 'module-4-hosting-intro' || lessonVisual.annotations) && lessonVisual.caption ? (
                <figcaption>{lessonVisual.caption}</figcaption>
              ) : null}
              {canExpandLessonVisual ? (
                <button
                  aria-label="Phóng to ảnh minh họa"
                  className="pixel-visual-expand"
                  type="button"
                  onClick={() => setVisualExpanded(true)}
                >
                  PHÓNG TO
                </button>
              ) : null}
            </figure>
          )
          : null}

      {isModuleOneOpening && scene.dialogue ? <ModuleOneOpening content={scene.dialogue} /> : null}

      {isVercelTutorial ? (
        <div className="pixel-vercel-tutorial-stage">
          <p>{scene.dialogue}</p>
          <video
            className="pixel-vercel-tutorial"
            src={m4PortfolioVideo}
            controls
            playsInline
            preload="metadata"
            aria-label="Video hướng dẫn đưa portfolio lên Vercel, có phụ đề tiếng Việt"
          />
        </div>
      ) : null}

      {isGitHubPractice ? (
        <GitHubPracticeGuide
          key={progress.courseRunId}
          verifiedRepository={githubRepository}
          onVerified={setVerifiedGitHubRepository}
          api={window.courseCompanion}
        />
      ) : null}

      {modelLessonBoardKind && lessonVisual ? (
        <ModelLessonBoard
          key={displayedSceneId}
          busy={busy}
          canOpenPreviousPage={canOpenPreviousPage}
          initialTopic={modelLessonEntry?.sceneId === displayedSceneId ? modelLessonEntry.topic : undefined}
          kind={modelLessonBoardKind}
          nextLabel={isReviewing ? reviewNextLabel : yellowChoiceLabel(scene.choices[0] ?? { label: 'Tiếp tục', primary: true })}
          onBack={(topic) => {
            setModelLessonEntry(topic ? { sceneId: modelLessonSceneByKind.models, topic } : null)
            openPreviousPage()
          }}
          onInitialTopicApplied={() => setModelLessonEntry(null)}
          onNext={(topic) => {
            setModelLessonEntry(topic ? { sceneId: modelLessonSceneByKind.settings, topic } : null)
            if (isReviewing) {
              openNextReviewPage()
              return
            }
            const choice = scene.choices[0]
            if (choice) void choose(choice)
          }}
        />
      ) : null}

      {usesProjectsLessonBoard ? (
        <ProjectsLessonBoard
          busy={busy}
          canOpenPreviousPage={canOpenPreviousPage}
          nextLabel={isReviewing ? reviewNextLabel : yellowChoiceLabel(scene.choices[0] ?? { label: 'Tiếp tục', primary: true })}
          onBack={openPreviousPage}
          onNext={() => {
            if (isReviewing) {
              openNextReviewPage()
              return
            }
            const choice = scene.choices[0]
            if (choice) void choose(choice)
          }}
        />
      ) : null}

      {guidanceLessonBoardKind ? (
        <GuidanceLessonBoard
          busy={busy}
          canOpenPreviousPage={canOpenPreviousPage}
          kind={guidanceLessonBoardKind}
          nextLabel={isReviewing ? reviewNextLabel : yellowChoiceLabel(scene.choices[0] ?? { label: 'Tiếp tục', primary: true })}
          onBack={openPreviousPage}
          onNext={() => {
            if (isReviewing) {
              openNextReviewPage()
              return
            }
            const choice = scene.choices[0]
            if (choice) void choose(choice)
          }}
        />
      ) : null}

      {usesImplementationPlanBoard ? (
        <ImplementationPlanLessonBoard
          busy={busy}
          canOpenPreviousPage={canOpenPreviousPage}
          dialogue={scene.dialogue ?? ''}
          eyebrow={scene.lessonLabel}
          nextLabel={isReviewing ? reviewNextLabel : yellowChoiceLabel(scene.choices[0] ?? { label: 'Tiếp tục', primary: true })}
          title={scene.objective}
          onBack={openPreviousPage}
          onNext={() => {
            if (isReviewing) {
              openNextReviewPage()
              return
            }
            const choice = scene.choices[0]
            if (choice) void choose(choice)
          }}
        />
      ) : null}

      {visualExpanded && lessonVisual && canExpandLessonVisual ? (
        <LessonVisualLightbox
          activeFocus={approvalFocus}
          isApprovalTour={isApprovalTour}
          visual={lessonVisual}
          onClose={() => setVisualExpanded(false)}
        />
      ) : null}

      {secondaryVisualExpanded && secondaryLessonVisual && canExpandLessonVisual ? (
        <LessonVisualLightbox
          activeFocus={null}
          isApprovalTour={false}
          visual={secondaryLessonVisual}
          onClose={() => setSecondaryVisualExpanded(false)}
        />
      ) : null}

      <section
        aria-label={standaloneReadingPage ? 'Điều hướng bài học' : isAssessmentQuestionPage ? `Câu hỏi Module ${scene.lessonId.slice(-1)}` : undefined}
        aria-labelledby={isAssessmentQuestionPage || standaloneReadingPage ? undefined : 'teacherName'}
        className={standaloneReadingPage ? 'pixel-lesson-navigation' : `pixel-dialogue${displayedSceneId === 'module-3-git-intro' ? ' is-git-intro' : ''}${scene.choices.length === 1 ? ' has-single-choice' : ''}${scene.choices.length > 3 ? ' has-many-choices' : ''}${assessmentQuestion || scene.assessmentSummary ? ' has-assessment' : ''}${scene.assessmentSummary ? ' is-assessment-summary' : ''} has-no-scene-title${displayedSceneId === 'module-1-codex-examples' ? ' has-approval-tour' : ''}${approvalFocus ? ' has-manual-approval-focus' : ''}${usesLessonBoard ? ' is-model-board-source' : ''}${scene.practice ? ' has-practice-brief' : ''}${isReviewing && scene.lessonId === 'module-2' ? ' is-module-two-review' : ''}`}
      >
        {isAssessmentQuestionPage || standaloneReadingPage || isPassFailSummary ? null : <div className="pixel-speaker"><img src={teacherImage} alt="" /><span>TEACHER</span><strong id="teacherName">Triết</strong></div>}
        {isAssessmentQuestionPage || standaloneReadingPage || isPassFailSummary ? null : displayedSceneId === 'module-2-portfolio-folder' && !isReviewing ? (
          <PortfolioWorkspacePicker
            courseRunId={progress.courseRunId}
            onContinue={() => void advanceToScene('module-2-portfolio-practice', progress.decisions)}
          />
        ) : scene.practice ? <LessonPracticeBrief definition={scene.practice} /> : (
          <p>{scene.assessmentSummary
            ? isPortfolioMasterySummary
              ? displayedSceneId === 'module-2-portfolio-mastery-summary'
                ? `Bạn đã trả lời ${finalAnsweredCount}/${finalQuestionCount} câu. ${finalCorrectCount !== finalQuestionCount
                  ? `Còn ${finalQuestionCount - finalCorrectCount} câu chưa đúng. Hãy chọn “Làm lại ${finalQuestionCount} câu” để sửa trước khi hoàn thành Module 2 và tiếp tục sang Module 3.`
                  : 'Course Companion sẽ đối chiếu câu trả lời với năm tài liệu hiện tại trước khi mở Module 3.'}`
                : displayedSceneId === 'module-3-mastery-summary'
                  ? `Bạn đã trả lời ${finalAnsweredCount}/${finalQuestionCount} câu. Course Companion sẽ đối chiếu câu trả lời với tám tài liệu và bằng chứng tạo bản dựng hiện tại.`
                  : `Bạn đã trả lời ${finalAnsweredCount}/${finalQuestionCount} câu. Kết quả tốt nghiệp chỉ được ghi nhận sau khi Practice và các bằng chứng phát hành đều đạt.`
              : null
            : assessmentGroup
              ? 'Bạn có thể xem toàn bộ câu hỏi trước khi nộp.'
            : displayedSceneId === 'module-1-codex-examples'
              ? <ApprovalTourDialogue activeFocus={approvalFocus} onSelect={setApprovalFocus} />
              : displayedSceneId === 'module-2-prd-agent-workflow' || displayedSceneId === 'module-2-impeccable-skill'
                ? <DesignReferenceDialogue dialogue={scene.dialogue ?? ''} highlightTerms={scene.highlightTerms} />
              : scene.highlightTerms
                ? <HighlightedDialogue dialogue={scene.dialogue ?? ''} highlightTerms={scene.highlightTerms} />
              : scene.dialogue}</p>
        )}
        {firstBuildPage && (
          <PracticeStartPrompt practiceId="m3-portfolio-build" prompt={scene.copyPrompt} title={scene.copyPromptTitle} />
        )}
        {isReviewing && assessmentQuestion ? (
          <article className="pixel-assessment-question">
            <p>{assessmentQuestion.prompt}</p>
            {assessmentQuestion.type === 'multiple-choice' ? (
              <ol type="A">{assessmentQuestion.choices.map((choice) => <li key={choice}>{choice}</li>)}</ol>
            ) : null}
          </article>
        ) : null}
        {displayedSceneId === 'module-3-debugging-intro' && portfolioPlanningHandoff ? (
          <details className="pixel-planning-handoff">
            <summary>{`Module 2 đã bàn giao ${portfolioPlanningHandoff.moduleThreeInput.artifactReferences.length} artifact hiện tại trong workspace ${portfolioPlanningHandoff.moduleThreeInput.workspacePath}.`}</summary>
            <ul>{portfolioPlanningHandoff.moduleThreeInput.artifactReferences.map(({ path }) => <li key={path}><code>{path}</code></li>)}</ul>
          </details>
        ) : null}
        {error && !(assessmentQuestion && assessmentGroup) ? <div className="pixel-save-error" role="alert">{error}</div> : null}
        {canEnterFirstBuild ? (
          <div className="pixel-lesson-actions is-paired">
            {pageBackControl}
            <div className="pixel-choices">
              <button className="pixel-choice is-primary" type="button" disabled={busy} onClick={() => void enterFirstBuild()}>
                {busy ? 'Đang mở task Codex…' : scene.choices[0]?.label}
              </button>
            </div>
          </div>
        ) : isReviewing ? (
          <div className="pixel-lesson-actions is-paired">
            {pageBackControl}
            <div className="pixel-choices">
              <button className="pixel-choice is-primary" type="button" onClick={openNextReviewPage}>
                {reviewNextLabel}
              </button>
            </div>
          </div>
        ) : assessmentQuestion && assessmentGroup ? (
          <AssessmentControls
            backControl={pageBackControl}
            busy={busy}
            error={error}
            continueLabel={assessmentContinueLabel}
            group={assessmentGroup}
            key={assessmentGroup.id}
            questionOnly={isAssessmentQuestionPage}
            results={assessmentResults}
            onSubmit={(answers) => saveAssessmentBatch(assessmentGroup, answers)}
            onConfirmWritten={(question, answer) => saveAssessmentResult(question, `correct:self-review:${answer}`)}
            onContinue={() => void continueAssessment(assessmentGroup.questions.at(-1)!, assessmentGroup)}
          />
        ) : scene.assessmentSummary ? (
          <div className="pixel-assessment-summary" data-result={isPortfolioMasterySummary ? 'review' : finalPassed ? 'pass' : 'retry'}>
            <strong>{isPortfolioMasterySummary ? 'ĐÃ TRẢ LỜI' : finalPassed ? 'ĐẠT' : 'CHƯA ĐẠT'}</strong>
            <span>{isPortfolioMasterySummary ? finalAnsweredCount : finalCorrectCount}/{finalQuestionCount} câu</span>
            <div className="pixel-summary-navigation">
              {pageBackControl}
            {isPortfolioMasterySummary ? (
              <div className="pixel-assessment-review-actions">
                <button disabled={busy} type="button" onClick={() => void retryFinalAssessment()}>
                  Làm lại {finalQuestionCount} câu
                </button>
                {displayedSceneId === 'module-2-portfolio-mastery-summary' ? (
                  <button className="pixel-choice is-primary" disabled={busy || finalCorrectCount !== finalQuestionCount} type="button" onClick={() => void completePortfolioPlanningModule()}>
                    {busy ? 'Đang đối chiếu…' : 'Hoàn thành Module 2'}
                  </button>
                ) : displayedSceneId === 'module-3-mastery-summary' ? (
                  <button className="pixel-choice is-primary" disabled={busy || finalAnsweredCount !== finalQuestionCount} type="button" onClick={() => void completePortfolioBuildModule()}>
                    {busy ? 'Đang đối chiếu…' : 'Hoàn thành Module 3'}
                  </button>
                ) : null}
              </div>
            ) : (
              <button
                className="pixel-choice is-primary"
                disabled={busy}
                type="button"
                onClick={() => finalPassed
                  ? void choose({
                      label: scene.lessonId === 'module-1' ? 'Hoàn thành Module 1' : 'Hoàn thành Module 2',
                      next: scene.lessonId === 'module-1' ? 'module-2-portfolio-workspace' : 'module-2-complete',
                      afterSave: scene.lessonId === 'module-1' ? 'home' : undefined,
                      decision: scene.lessonId === 'module-1'
                        ? { key: 'setupMastery', value: 'passed-three-of-four' }
                        : { key: 'masteryEvidence', value: 'artifacts-approved-and-aligned' }
                    })
                  : void retryFinalAssessment()}
              >
                {busy
                  ? 'Đang lưu…'
                  : finalPassed
                    ? 'Tiếp tục'
                    : `Làm lại ${finalQuestionCount} câu`}
              </button>
            )}
            </div>
          </div>
        ) : (
          <div className={`pixel-lesson-actions${usesPairedLessonNavigation ? ' is-paired' : ''}`}>
            {usesPairedLessonNavigation ? pageBackControl : null}
            <div className="pixel-choices">
              {scene.choices.map((choice) => (
                <button
                  className={`pixel-choice${scene.choices.length === 1 && choice.primary ? ' is-primary' : ''}${scene.choices.length === 1 && choice.danger ? ' is-danger' : ''}`}
                  disabled={busy || (isGitHubPractice && !githubRepository)}
                  key={choice.label}
                  type="button"
                  onClick={() => void choose(isGitHubPractice && githubRepository
                    ? { ...choice, decision: { key: 'portfolioGitHubRepository', value: githubRepository } }
                    : choice)}
                >
                  {busy ? 'Đang lưu checkpoint…' : yellowChoiceLabel(choice)}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {practiceBriefOpen ? (
        <PracticeBrief
          identity={activePracticeDefinition
            ? {
                practiceId: activePracticeDefinition.practiceId,
                practiceVersion: activePracticeDefinition.version
              }
            : progress.sceneId === 'module-2-portfolio-practice'
              ? { practiceId: 'm2-portfolio-planning', practiceVersion: '2.0.0' }
              : progress.sceneId === 'module-4-portfolio-practice'
                ? { practiceId: 'm4-portfolio-release', practiceVersion: '1.0.0' }
              : { practiceId: 'm3-portfolio-build', practiceVersion: '2.1.0' }}
          firstBuild={firstBuildPage}
          courseRunId={progress.courseRunId}
          onClose={() => setPracticeBriefOpen(false)}
          onPortfolioComplete={async () => {
            const isModuleThree = progress.sceneId === 'module-3-pre-practice-summary'
            await advanceToScene(isModuleThree ? 'module-3-portfolio-mastery' : 'module-2-portfolio-mastery', {
              ...progress.decisions,
              [isModuleThree ? 'portfolioBuildPractice' : 'portfolioPlanningPractice']:
                isModuleThree ? 'five-stages-four-slices-current' : 'five-current-stage-receipts'
            })
            setPracticeBriefOpen(false)
          }}
        />
      ) : null}

      {teacherOpen ? (
        <TeacherOverlay
          practiceMode={practiceFullOpen}
          hidden={practiceReturnTarget === 'full'}
          onClose={() => {
            const returningToLesson = practiceFullOpen
            setTeacherOpen(false)
            setPracticeFullOpen(false)
            if (returningToLesson) {
              void refreshAfterPractice()
              // Closing the full review must not leave an active Practice without Triết.
              void window.courseCompanion?.showLessonDuringPractice().catch(() => false)
            }
          }}
        />
      ) : null}

      {shouldShowLessonTip(onboardingState, scene.lessonId) && !teacherOpen && !practiceBriefOpen && !practiceFullOpen ? (
        <OnboardingTour
          steps={lessonTipSteps}
          onComplete={() => saveOnboardingState('complete')}
          onSkip={() => saveOnboardingState('complete')}
        />
      ) : shouldShowOutlineReviewTip(effectiveDecisions, {
        onSummary: Boolean(scene.assessmentSummary),
        passed: isPassFailSummary ? finalPassed : true,
        browsing: isReviewing
      }) && !teacherOpen && !practiceBriefOpen && !practiceFullOpen ? (
        <OnboardingTour
          steps={outlineReviewTipSteps}
          onComplete={() => saveOnboardingDecision(OUTLINE_REVIEW_TIP_DECISION_KEY, 'yes')}
          onSkip={() => saveOnboardingDecision(OUTLINE_REVIEW_TIP_DECISION_KEY, 'yes')}
        />
      ) : null}
    </main>
  )
}
