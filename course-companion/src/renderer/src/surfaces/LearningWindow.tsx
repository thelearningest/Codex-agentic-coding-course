import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import {
  COURSE_VERSION,
  LEARNER_STATE_SCHEMA_VERSION,
  courseLessonIdForScene,
  runnableCheckpointIds,
  type AppSettings,
  type CourseLessonId,
  type PracticeState,
  type CheckpointId,
  type LearnerProgress,
  type LessonId,
  type ProgressLoadResult,
  type ProgressUpdate,
  type PracticeGuideUpdateRequest,
  type PracticeGuideView,
  type RuntimeInfo,
  type SceneId
} from '../../../../shared/contracts'
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
import m1SlashCommandsImage from '../../../../../pilot-workspace/course/codex-setup/images/slash-commands.png'
import m1AtMenuImage from '../../../../../pilot-workspace/course/codex-setup/images/at-menu.png'
import m1UnderstandCodexImage from '../assets/lesson-visuals/m1-understand-codex.webp'
import m1AssessmentImage from '../assets/lesson-visuals/m1-assessment.webp'
import m2WhenToPlanImage from '../assets/lesson-visuals/m2-when-to-plan.webp'
import m2ProductRequirementsImage from '../assets/lesson-visuals/m2-product-requirements.webp'
import m2PrdPromptImage from '../assets/lesson-visuals/m2-prd-prompt.webp'
import m2PrdReviewImage from '../assets/lesson-visuals/m2-prd-review.webp'
import m2ImplementationPlanImage from '../assets/lesson-visuals/m2-implementation-plan.webp'
import m2AssessmentImage from '../assets/lesson-visuals/m2-assessment.webp'
import m2PafoliosImage from '../assets/lesson-visuals/m2-pafolios.webp'
import m2AwwwardsImage from '../assets/lesson-visuals/m2-awwwards.webp'
import m3VisibleScreenErrorImage from '../assets/lesson-visuals/m3-visible-screen-error-example.png'
import m3VisibleErrorPromptImage from '../assets/lesson-visuals/m3-visible-error-prompt-example.png'
import m3TerminalLogErrorImage from '../assets/lesson-visuals/m3-terminal-log-error-example.png'
import m3RepeatedErrorCodexPromptImage from '../assets/lesson-visuals/m3-repeated-error-codex-prompt.png'
import m3CommitHistoryImage from '../assets/lesson-visuals/m3-commit-history-example.png'
import m3GitGithubImage from '../assets/lesson-visuals/m3-git-github.png'
import m3GithubPushedCommitsImage from '../assets/lesson-visuals/m3-github-pushed-commits.png'
import m3GithubBranchesImage from '../assets/lesson-visuals/m3-github-branches.png'
import m4ProjectsOverviewImage from '../assets/lesson-visuals/module-4/vercel-projects-overview.png'
import m4PortfolioVideo from '../assets/lesson-visuals/module-4/vercel-portfolio-captioned.mp4'
import { PracticeBrief } from '../components/PracticeBrief'
import { TeacherWorkspace } from '../components/TeacherWorkspace'
import { DesignReferenceDialogue } from '../components/DesignReferenceDialogue'
import { PracticeGuide } from '../components/PracticeGuide'
import { PortfolioWorkspacePicker } from '../components/PortfolioWorkspacePicker'
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
    choices: [{ label: 'Bắt đầu Module 1', next: 'module-1-codex-orientation', afterSave: 'home', primary: true, preservePrimaryLabel: true }],
    showTitle: false,
    showPanel: false
  },
  'module-1-codex-orientation': {
    lessonId: 'module-1',
    checkpointId: 'm1-codex-orientation',
    step: 1,
    totalSteps: 6,
    lessonLabel: 'MODULE 1 · THIẾT LẬP CODEX',
    mission: 'Làm quen với Codex',
    objective: 'Codex là coding agent của OpenAI',
    panelLabel: 'CODING AGENT',
    panelStatus: 'LÀM VIỆC CÙNG BẠN',
    tone: 'neutral',
    request: 'Codex là coding agent của OpenAI.',
    evidence: [
      { label: 'VAI TRÒ', value: 'Coding agent' },
      { label: 'TẠO', value: 'Ứng dụng và website' },
      { label: 'TỰ ĐỘNG HÓA', value: 'Việc lặp lại' }
    ],
    dialogue: 'Codex là coding agent của OpenAI. Ở bài này, mình chỉ cần bạn hiểu coding agent là một trợ lý có thể thực hiện công việc liên quan đến code: tạo ứng dụng, xây trang web, chỉnh sửa dự án và tự động hóa những việc lặp lại.',
    choices: [{ label: 'Làm quen với giao diện Codex', next: 'module-1-codex-examples', primary: true }]
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
      { label: 'ĐỀ XUẤT', value: 'High · Standard' }
    ],
    dialogue: 'Effort điều chỉnh mức suy luận của model. Speed điều chỉnh tốc độ xử lý và mức dùng credit. Với ContentPilot, mình đề xuất High và Standard.',
    choices: [{ label: 'Tiếp theo: Lệnh /', next: 'module-1-codex-slash-commands', primary: true }]
  },
  'module-1-codex-slash-commands': {
    lessonId: 'module-1',
    checkpointId: 'm1-codex-orientation',
    step: 1,
    totalSteps: 6,
    lessonLabel: 'MODULE 1 · THIẾT LẬP CODEX',
    mission: 'Làm quen với giao diện Codex',
    objective: 'Dùng / và @ để mở nhanh các chức năng',
    panelLabel: 'LỆNH / VÀ @',
    panelStatus: 'MỞ NGAY TRONG Ô SOẠN TIN',
    tone: 'neutral',
    request: 'Mở lệnh, nguồn hoặc công cụ ngay trong ô soạn tin.',
    evidence: [
      { label: '/STATUS', value: 'Xem mức sử dụng context' },
      { label: '/GOAL', value: 'Tạo mục tiêu bền vững' },
      { label: '@', value: 'Mở thêm nguồn và công cụ' }
    ],
    dialogue: 'Một số lệnh / bạn có thể thường xuyên sử dụng là /status và /goal. Lệnh /status cho biết mức sử dụng context window — bạn có thể hiểu đây là trí nhớ ngắn hạn của model. Nếu lượng context đã dùng vượt quá 150.000 token, bạn nên chuyển sang chat mới. Lệnh /goal tạo một mục tiêu bền vững để Codex tiếp tục theo đuổi qua nhiều lượt cho đến khi hoàn thành, bị tạm dừng hoặc cần bạn cung cấp thêm thông tin.\n\nNgoài ra, @ cũng mở một danh sách chọn nhanh tương tự /. Tuy nhiên, @ cho phép bạn truy cập thêm một số nguồn và công cụ. Chẳng hạn, bạn có thể chọn một skill cụ thể hoặc một đoạn chat trong tài khoản ChatGPT.',
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
      { label: 'FRONTEND-DESIGN', value: 'Thiết kế và kiểm tra giao diện' },
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
    panelStatus: 'FRONTEND-DESIGN VÀ COPYWRITING',
    tone: 'neutral',
    request: 'Mỗi skill hỗ trợ một loại công việc cụ thể trong portfolio.',
    evidence: [
      { label: 'FRONTEND-DESIGN', value: 'Thiết kế và kiểm tra giao diện' },
      { label: 'COPYWRITING', value: 'Viết nội dung dựa trên thông tin thật' }
    ],
    dialogue: 'Trong quá trình xây portfolio, bạn sẽ dùng frontend-design cho giao diện và copywriting cho nội dung. Bạn cũng có thể tự khám phá thêm skill tại skills.sh.',
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
    request: 'Bạn đổi cấu hình ngay trong task; Course Companion đọc metadata hiệu lực để Triết duyệt.',
    evidence: [
      { label: 'MODEL', value: '5.6 Sol · High · Standard' },
      { label: 'QUYỀN', value: 'Approve for me · Full access tắt' },
      { label: 'BẰNG CHỨNG', value: 'Metadata đúng task và còn mới' }
    ],
    dialogue: 'Course Companion sẽ mở một task riêng bằng cấu hình mặc định và chưa gửi prompt nào. Trong chính task đó, hãy chọn 5.6 Sol, High, Standard, Approve for me và tắt Full access. Bạn không cần chụp ảnh hoặc gửi báo cáo; Triết duyệt trực tiếp năm giá trị Course Companion đọc được.',
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
      { label: 'MODEL', value: '5.6 Sol · High', ready: true },
      { label: 'SPEED', value: 'Standard', ready: true },
      { label: 'QUYỀN', value: 'Approve for me · Full access tắt', ready: true }
    ],
    dialogue: 'Bây giờ hãy cùng nhau trả lời các câu hỏi ôn tập để củng cố kiến thức vừa học nhen!',
    choices: [{ label: 'Bắt đầu 4 câu ôn tập', next: 'module-1-final-1', primary: true, decision: { key: 'setupPractice', value: 'teacher-reviewed-setup' } }],
    showTitle: false,
    showPanel: false
  },
  'module-1-complete': {
    lessonId: 'module-1',
    checkpointId: 'm1-complete',
    step: 6,
    totalSteps: 6,
    lessonLabel: 'MODULE 1 · THIẾT LẬP CODEX',
    mission: 'Sẵn sàng làm việc với Codex',
    objective: 'Module 1 đã hoàn thành',
    panelLabel: 'NỀN TẢNG LÀM VIỆC',
    panelStatus: 'SẴN SÀNG CHO MODULE 2',
    tone: 'good',
    request: 'Bạn đã có ranh giới làm việc rõ trước khi bắt đầu planning.',
    evidence: [
      { label: 'CODEX', value: 'Coding agent có thể hành động', ready: true },
      { label: 'CẤU HÌNH', value: 'Đã được Triết duyệt', ready: true },
      { label: 'BƯỚC TIẾP', value: 'Planning, PRD và prompt', ready: true }
    ],
    choices: [{ label: 'Mở Module 2', next: 'module-2-portfolio-workspace', afterSave: 'home', primary: true }]
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
  'm1-understand-codex': {
    image: m1UnderstandCodexImage,
    alt: 'Giao diện Codex hiển thị danh sách công việc, dự án đang mở và ô nhập yêu cầu'
  },
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
  'module-1-codex-slash-commands': {
    image: m1SlashCommandsImage,
    alt: 'Danh sách lệnh mở trong Codex sau khi người dùng nhập dấu gạch chéo vào ô soạn tin'
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
  }
}

const sceneSecondaryVisuals: Partial<Record<SceneId, LessonVisual>> = {
  'module-1-codex-slash-commands': {
    image: m1AtMenuImage,
    alt: 'Danh sách nguồn và công cụ mở trong Codex sau khi người dùng nhập dấu @ vào ô soạn tin'
  },
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
    ['module-1-codex-orientation'],
    ['module-1-codex-examples'],
    ['module-1-codex-model-intro'],
    ['module-1-codex-effort-speed'],
    ['module-1-codex-slash-commands']
  ],
  'm1-agents-and-skills': [
    ['module-1-agents-intro'],
    ['module-1-skills-intro'],
    ['module-1-skills-portfolio']
  ],
  'm1-assessment': [
    ['module-1-mastery'],
    ['module-1-final-1'],
    ['module-1-final-2'],
    ['module-1-final-3'],
    ['module-1-final-4'],
    ['module-1-final-summary'],
    ['module-1-complete']
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
type AppDestination = 'home' | 'lesson' | 'progress' | 'settings'
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

const defaultAppSettings: AppSettings = {
  companionMode: 'compact',
  companionAlwaysOnTop: true
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
      Được rồi, vậy chúng ta sẽ bắt đầu tìm hiểu Codex cùng nhau nha. Đầu tiên, hãy nhìn qua Approval. Khi nhấn vào biểu tượng Codex bên trái dấu cộng, bạn sẽ thấy một hộp gồm ba lựa chọn. Đây là phần cài đặt Approval, nơi bạn thiết lập mức độ kiểm soát đối với coding agent.
      <br /><br />
      Trước tiên, <ApprovalTerm activeFocus={activeFocus} focus="ask" onSelect={onSelect}>Ask for approval</ApprovalTerm> luôn hỏi bạn trước khi chỉnh sửa tệp bên ngoài dự án hoặc sử dụng Internet. Tiếp theo, <ApprovalTerm activeFocus={activeFocus} focus="approve" onSelect={onSelect}>Approve for me</ApprovalTerm> chỉ hỏi khi phát hiện một hành động có thể không an toàn. Cuối cùng, <ApprovalTerm activeFocus={activeFocus} focus="full" onSelect={onSelect}>Full access</ApprovalTerm> cho phép Codex truy cập Internet và mọi tệp trên máy tính mà không bị giới hạn.
      <br /><br />
      Nếu mới bắt đầu, mình khuyên bạn dùng <ApprovalTerm activeFocus={activeFocus} focus="approve" onSelect={onSelect}>Approve for me</ApprovalTerm>. Chế độ này không yêu cầu bạn duyệt mọi hành động, nhưng cũng không trao toàn bộ quyền kiểm soát cho coding agent.
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

type GuidanceLessonBoardKind = 'agents' | 'skills' | 'skills-portfolio'

const guidanceLessonBoardByScene: Partial<Record<SceneId, GuidanceLessonBoardKind>> = {
  'module-1-agents-intro': 'agents',
  'module-1-skills-intro': 'skills',
  'module-1-skills-portfolio': 'skills-portfolio'
}

const frontendDesignSkillExcerpt = `SKILL.md                                  EXCERPT

---
name: frontend-design
description: Design and implement distinctive,
production-grade frontend interfaces with a
restrained visual language.
---

# Workflow

1. Inspect the existing product, audience,
   content, framework, and constraints before
   choosing a direction.

2. Classify the surface and read only the
   references required for the task.

3. Choose one restrained aesthetic direction
   and one distinguishing visual idea.

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
              <small>AGENTS.md - bộ quy luật cho coding agents</small>
              <h1 id={titleId}>Vậy, giả dụ có một thông tin mình muốn agent ghi nhớ mà không cần phải nhắc đi nhắc lại thì mình sẽ làm gì?</h1>
              <p>Bạn có thể lưu thông tin đó trong <code>AGENTS.md</code>.</p>
              <p>Đây là một tệp văn bản chứa các quy tắc và thông tin coding agent cần biết trước khi bắt đầu công việc. Codex đọc tệp này để hiểu cách bạn muốn dự án được xử lý.</p>
            </header>
          </>
        ) : kind === 'skills' ? (
          <>
            <header>
              <small className="pixel-guidance-board__skill-kicker">
                <strong>SKILL</strong>
                <span>QUY TRÌNH CHUYÊN BIỆT CHO CODING AGENTS</span>
              </small>
              <h1 id={titleId}>Dạy coding agent cách thực hiện một loại công việc</h1>
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
              <article><strong>frontend-design</strong><p>Dùng khi thiết kế hoặc chỉnh sửa giao diện portfolio. Skill giúp Codex xác định mục tiêu của trang, chọn hướng thiết kế, xây giao diện responsive và kiểm tra kết quả thực tế.</p></article>
              <article><strong>copywriting</strong><p>Dùng khi viết nội dung cho portfolio. Skill giúp Codex viết tiêu đề, phần giới thiệu, mô tả dự án và lời kêu gọi hành động dựa trên thông tin thật của bạn.</p></article>
            </div>
          </>
        )}
      </div>

      <aside className="pixel-guidance-board__panel">
        {kind === 'agents' ? (
          <div className="pixel-agents-levels">
            <h2>Hai level <code>AGENTS.md</code> bạn cần biết</h2>
            <p className="pixel-agents-levels__intro">Codex đọc cả hai level. Global <code>AGENTS.md</code> đặt ra những nguyên tắc chung. Current repo <code>AGENTS.md</code> bổ sung những quy tắc cụ thể hơn cho dự án đang mở.</p>
            <article>
              <span>GLOBAL</span>
              <code>~/.codex/AGENTS.md</code>
              <p>Áp dụng cho bất kỳ dự án nào mà bạn xây dựng với coding agent sau này.</p>
            </article>
            <article>
              <span>CURRENT REPO</span>
              <code>AGENTS.md</code>
              <p>Chỉ áp dụng cho dự án hiện tại.</p>
              <p>Ở Module 2, Course Companion sẽ tạo sẵn một tệp <code>AGENTS.md</code> cho thư mục portfolio của bạn.</p>
            </article>
          </div>
        ) : kind === 'skills' ? (
          <>
            <div className="pixel-skill-excerpt" aria-label="Ví dụ rút gọn từ skill frontend-design">
              <pre><code>{frontendDesignSkillExcerpt}</code></pre>
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
      </aside>

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
  const learningPosition = progress ? learningPositionByScene[progress.sceneId] : null
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

const futureModules = ['Kiểm chứng, phát hành và chứng minh quyền làm chủ']

const decisionLabels: Record<string, string> = {
  approvalApproach: 'Thiết lập approval',
  guidanceBoundary: 'Ranh giới hướng dẫn',
  skillBoundary: 'Cách dùng Skill',
  setupChecklist: 'Checklist thiết lập',
  setupPractice: 'Bằng chứng cấu hình',
  setupMastery: 'Kết quả Module 1',
  setupModuleMigration: 'Module 1',
  planningApproach: 'Cách bắt đầu',
  clarificationFocus: 'Điều cần làm rõ',
  prdClassification: 'Phân loại yêu cầu',
  promptMethod: 'Cách phỏng vấn',
  prdApproval: 'Duyệt PRD',
  planStructure: 'Cấu trúc plan',
  alignmentDecision: 'Xử lý scope creep',
  masteryEvidence: 'Bằng chứng hoàn thành'
}

const decisionValues: Record<string, string> = {
  'approve-for-me-no-full-access': 'Approve for me · Full access tắt',
  'teacher-reviewed-setup': 'Triết đã duyệt bằng chứng cấu hình',
  'recommended-default': 'Giữ thiết lập được đề xuất',
  'learner-selected': 'Dùng thiết lập do người học chọn',
  'review-purpose-source-impact': 'Xem mục đích, nguồn và tác động trước khi duyệt',
  'durable-vs-task-specific': 'AGENTS.md cho quy tắc bền vững; prompt cho task hiện tại',
  'repeatable-workflow': 'Skill cho quy trình có thể tái sử dụng',
  'reviewed-in-companion': 'Đã xem lại trong Course Companion',
  'passed-four-of-five': 'Đạt ít nhất 4/5 câu',
  'passed-three-of-four': 'Đạt ít nhất 3/4 câu',
  'passed-five-of-six': 'Đạt ít nhất 5/6 câu',
  'continued-existing-planning-progress': 'Đã chuyển tiếp từ lộ trình Planning cũ',
  'plan-first': 'Planning trước khi code',
  'product-requirements': 'Luồng sử dụng, đầu vào, đầu ra và phạm vi V1',
  'scope-in-prd': 'Quyết định phạm vi thuộc PRD',
  'one-question-at-a-time': 'Một câu hỏi mỗi lượt',
  'reviewed-eight-sections': 'Đã xem xét đủ tám phần',
  'observable-and-verifiable': 'Có kết quả và cách kiểm tra',
  'remove-scope-creep': 'Loại nội dung ngoài PRD',
  'artifacts-approved-and-aligned': 'Hai artifact đã duyệt và khớp nhau'
}

type TeacherOverlayProps = {
  onClose: () => void
  practiceMode?: boolean
}

function TeacherOverlay({ onClose, practiceMode = false }: TeacherOverlayProps) {
  return (
    <aside className={'pixel-teacher-overlay' + (practiceMode ? ' is-practice-full' : '')} aria-label="Triết, giáo viên đồng hành">
      <TeacherWorkspace embedded onClose={onClose} />
    </aside>
  )
}

function RoadmapStage({ children, status, className, onReview }: {
  children: ReactNode
  status: string
  className: string
  onReview?: () => void
}) {
  if (onReview) {
    return (
      <button className={`pixel-roadmap-stage ${className}`} type="button" onClick={onReview}>
        {children}<em>{status}</em>
      </button>
    )
  }
  return <article className={className}>{children}<em>{status}</em></article>
}

type PixelAppShellProps = {
  progress: LearnerProgress
  runtime: RuntimeInfo | null
  destination: AppDestination
  settings: AppSettings
  teacherOpen: boolean
  onNavigate: (destination: AppDestination) => void
  onReviewModule: (moduleId: Exclude<LessonId, 'intro'>) => void
  onOpenTeacher: () => void
  onCloseTeacher: () => void
  onQuit: () => void
  onReset: () => void
  onSettingsChange: (alwaysOnTop: boolean) => void
}

function PixelAppShell({
  progress,
  runtime,
  destination,
  settings,
  teacherOpen,
  onNavigate,
  onReviewModule,
  onOpenTeacher,
  onCloseTeacher,
  onQuit,
  onReset,
  onSettingsChange
}: PixelAppShellProps) {
  const [confirmReset, setConfirmReset] = useState(false)
  const scene = scenes[progress.sceneId]
  const learningPosition = learningPositionByScene[
    progress.sceneId === 'module-1-setup-checklist' ? 'module-1-skills-portfolio' : progress.sceneId
  ]
  const completed = new Set(progress.completedCheckpointIds)
  if (progress.sceneId === 'module-1-complete' || progress.sceneId === 'module-2-complete') {
    completed.add(progress.checkpointId)
  }
  const completedCheckpointCount = runnableCheckpointIds.filter((id) => completed.has(id)).length
  const progressPercent = Math.round((completedCheckpointCount / runnableCheckpointIds.length) * 100)
  const currentModuleId = progress.currentLessonId === 'intro' ? 'module-1' : progress.currentLessonId
  const moduleOneComplete = completed.has('m1-complete')
  const moduleOneMigrated = progress.decisions.setupModuleMigration === 'continued-existing-planning-progress'
  const moduleTwoComplete = completed.has('m2-portfolio-complete')
  const moduleThreeComplete = completed.has('m3-complete')
  const moduleOneLessonCount = setupModule?.lessons?.length ?? 5
  const moduleTwoLessonCount = planningModule?.lessons?.length ?? 6
  const practice = progress.practice

  const surfaceCopy: Record<Exclude<AppDestination, 'home' | 'lesson'>, { kicker?: string; title: string; description?: string }> = {
    progress: {
      title: 'Hồ sơ học tập'
    },
    settings: {
      kicker: 'CÀI ĐẶT',
      title: 'Điều khiển hành vi ứng dụng và dữ liệu cục bộ',
      description: 'Chỉ các cài đặt đang hoạt động thật mới xuất hiện ở đây.'
    }
  }

  return (
    <main className="pixel-course-app">
      <div className="pixel-scene-world" style={sceneStyle} aria-hidden="true" />

      <header className="pixel-app-header">
        <button className="pixel-app-brand" type="button" onClick={() => onNavigate('home')}>
          <span>C</span>
          <span><strong>VIBECODING 101</strong><small>COURSE COMPANION · TRIẾT &amp; DUY</small></span>
        </button>
        <div className="pixel-app-actions">
          <button
            aria-current={destination === 'progress' ? 'page' : undefined}
            className={destination === 'progress' ? 'is-active' : ''}
            type="button"
            onClick={() => onNavigate('progress')}
          >Hồ sơ học tập</button>
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
                <small>HOME BASE · LỘ TRÌNH</small>
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
                  <span>01</span><div><small>MODULE 1 · {moduleOneLessonCount} BÀI HỌC</small><strong>{setupModule?.titleVi ?? 'Bắt đầu làm việc với Codex'}</strong><p>Bài {learningPosition.lessonIndex}/{moduleOneLessonCount} · {learningPosition.lessonTitle} · Trang {learningPosition.page}/{learningPosition.totalPages}</p></div><em>{moduleOneComplete ? 'HOÀN THÀNH' : <><span>BẠN ĐANG Ở ĐÂY</span><b>MỞ BÀI HỌC →</b></>}</em>
                </button>
              ) : (
                <RoadmapStage
                  className={moduleOneMigrated ? 'is-migrated' : 'is-complete'}
                  status={moduleOneMigrated ? 'ĐÃ CHUYỂN TIẾP' : 'HOÀN THÀNH'}
                  onReview={moduleOneMigrated ? undefined : () => onReviewModule('module-1')}
                >
                  <span>01</span><div><small>MODULE 1 · {moduleOneLessonCount} BÀI HỌC</small><strong>{setupModule?.titleVi ?? 'Bắt đầu làm việc với Codex'}</strong><p>{moduleOneMigrated ? 'Tiến độ Planning cũ được giữ nguyên; học phần setup không được tự đánh dấu hoàn thành.' : 'Bạn đã hoàn tất nền tảng làm việc với Codex.'}</p></div>
                </RoadmapStage>
              )}
              {currentModuleId === 'module-2' ? (
                <button className={`pixel-roadmap-stage is-current${moduleTwoComplete ? ' is-complete' : ''}`} type="button" onClick={() => onNavigate('lesson')}>
                  <span>02</span><div><small>MODULE 2 · {moduleTwoLessonCount} BÀI HỌC</small><strong>{planningModule?.titleVi ?? 'Giao tiếp hiệu quả với coding agent: Planning, PRD và prompt'}</strong><p>Bài {learningPosition.lessonIndex}/{moduleTwoLessonCount} · {learningPosition.lessonTitle} · Trang {learningPosition.page}/{learningPosition.totalPages}</p></div><em>{moduleTwoComplete ? 'HOÀN THÀNH' : <><span>BẠN ĐANG Ở ĐÂY</span><b>MỞ BÀI HỌC →</b></>}</em>
                </button>
              ) : (
                <RoadmapStage
                  className={moduleTwoComplete ? 'is-complete' : 'is-locked'}
                  status={moduleTwoComplete ? 'HOÀN THÀNH' : 'SẮP TỚI'}
                  onReview={moduleTwoComplete ? () => onReviewModule('module-2') : undefined}
                >
                  <span>02</span><div><small>MODULE 2 · {moduleTwoLessonCount} BÀI HỌC</small><strong>{planningModule?.titleVi ?? 'Giao tiếp hiệu quả với coding agent: Planning, PRD và prompt'}</strong><p>{moduleTwoComplete ? 'Bộ tài liệu planning và kết quả làm chủ đã được lưu trong biên nhận hoàn thành.' : 'Hoàn thành Module 1 để mở phần Planning.'}</p></div>
                </RoadmapStage>
              )}
              {currentModuleId === 'module-3' ? (
                <button className={`pixel-roadmap-stage is-current${moduleThreeComplete ? ' is-complete' : ''}`} type="button" onClick={() => onNavigate('lesson')}>
                  <span>03</span><div><small>MODULE 3 · ĐIỂM SẴN SÀNG</small><strong>Xây dựng và gỡ lỗi theo từng phần đã kiểm chứng</strong><p>Năm tệp planning hiện tại đã được bàn giao; nội dung chat cũ không được dùng làm đầu vào.</p></div><em>{moduleThreeComplete ? 'HOÀN THÀNH' : <><span>BẠN ĐANG Ở ĐÂY</span><b>MỞ BÀI HỌC →</b></>}</em>
                </button>
              ) : (
                <RoadmapStage
                  className={moduleThreeComplete ? 'is-complete' : 'is-locked'}
                  status={moduleThreeComplete ? 'HOÀN THÀNH' : 'SẮP TỚI'}
                  onReview={moduleThreeComplete ? () => onReviewModule('module-3') : undefined}
                >
                  <span>03</span><div><small>MODULE 3</small><strong>Xây dựng và gỡ lỗi theo từng phần đã kiểm chứng</strong><p>{moduleThreeComplete ? scenes['module-3-complete'].objective : 'Hoàn thành gate bằng chứng và mastery của Module 2 để mở.'}</p></div>
                </RoadmapStage>
              )}
              {futureModules.map((title, index) => currentModuleId === `module-${index + 4}` ? (
                <button className={`pixel-roadmap-stage is-current${completed.has('m4-complete') ? ' is-complete' : ''}`} type="button" key={title} onClick={() => onNavigate('lesson')}>
                  <span>{String(index + 4).padStart(2, '0')}</span><div><small>MODULE {index + 4}</small><strong>{title}</strong><p>{scene.mission}</p></div><em>{completed.has('m4-complete') ? 'HOÀN THÀNH' : <><span>BẠN ĐANG Ở ĐÂY</span><b>MỞ BÀI HỌC →</b></>}</em>
                </button>
              ) : (
                <article className="is-locked" key={title}>
                  <span>{String(index + 4).padStart(2, '0')}</span><div><small>MODULE {index + 4}</small><strong>{title}</strong><p>Sẽ mở trong phần học tiếp theo</p></div><em>SẮP TỚI</em>
                </article>
              ))}
            </div>
          </div>

          <button className="pixel-home-teacher" type="button" onClick={onOpenTeacher} aria-label="Mở Triết, giáo viên đồng hành">
            <img src={teacherImage} alt="" />
            <span><small>TEACHER</small><strong>Triết</strong><em>Hỏi khi cần</em></span>
          </button>
        </section>
      ) : destination === 'lesson' ? null : (
        <section className={`pixel-app-surface is-${destination}`}>
          <header className="pixel-surface-heading">
            <div>
              {surfaceCopy[destination].kicker ? <small>{surfaceCopy[destination].kicker}</small> : null}
              <h1>{surfaceCopy[destination].title}</h1>
              {surfaceCopy[destination].description ? <p>{surfaceCopy[destination].description}</p> : null}
            </div>
            <button type="button" onClick={() => onNavigate('home')}>Về Home Base</button>
          </header>

          {destination === 'progress' ? (
            <div className="pixel-progress-surface">
              <section className="pixel-progress-summary">
                <div><small>CHECKPOINT</small><strong>{completedCheckpointCount}/{runnableCheckpointIds.length}</strong><span>Đã ghi nhận</span></div>
                <div><small>BÀI HIỆN TẠI</small><strong>{learningPosition.lessonIndex}/{learningPosition.totalLessons}</strong><span>{learningPosition.lessonTitle}</span></div>
                <div><small>THỰC HÀNH</small><strong>{practice.status === 'idle' ? 'Chưa bắt đầu' : practice.status}</strong><span>{practice.latestEvent ? 'Bài luyện tập đã lưu' : 'Chưa có kết quả'}</span></div>
              </section>
              <section className="pixel-progress-detail">
                <div>
                  <small>CHECKPOINT HIỆN TẠI</small>
                  <h2>{scene.objective}</h2>
                  <p>{scene.mission}</p>
                  <button type="button" onClick={() => onNavigate('lesson')}>Mở bài học</button>
                </div>
                <div>
                  <small>QUYẾT ĐỊNH ĐÃ LƯU</small>
                  {Object.keys(progress.decisions).length === 0 ? <p>Chưa có quyết định nào.</p> : (
                    <dl>
                      {Object.entries(progress.decisions).map(([key, value]) => (
                        <div key={key}><dt>{decisionLabels[key] ?? key}</dt><dd>{key === 'timeBudget' ? `${value} phút` : decisionValues[value] ?? value}</dd></div>
                      ))}
                    </dl>
                  )}
                </div>
              </section>
              {practice.latestEvent?.evidence ? (
                <section className="pixel-evidence-receipt">
                  <small>BẰNG CHỨNG TỪ BÀI LUYỆN TẬP</small>
                  <strong>{practice.latestEvent.summary}</strong>
                  <div><span>{practice.latestEvent.evidence.prdArtifact}</span><span>{practice.latestEvent.evidence.implementationPlanArtifact}</span><span>{practice.latestEvent.evidence.alignment}</span></div>
                </section>
              ) : null}
            </div>
          ) : null}

          {destination === 'settings' ? (
            <div className="pixel-settings">
              <section>
                <div><small>TRIẾT NỔI</small><h2>Luôn ở phía trên cửa sổ khác</h2><p>Tắt tùy chọn này nếu Triết che khuất công việc trong Codex.</p></div>
                <button
                  aria-label="Luôn ở phía trên cửa sổ khác"
                  aria-checked={settings.companionAlwaysOnTop}
                  className={settings.companionAlwaysOnTop ? 'is-on' : ''}
                  role="switch"
                  type="button"
                  onClick={() => onSettingsChange(!settings.companionAlwaysOnTop)}
                ><span>{settings.companionAlwaysOnTop ? 'BẬT' : 'TẮT'}</span></button>
              </section>
              <section>
                <div><small>KẾT NỐI</small><h2>Teacher và Codex</h2><p>Phần luyện tập hiện dùng kịch bản cục bộ và chưa quan sát trực tiếp Codex.</p></div>
                <strong className="pixel-settings-status">CHẾ ĐỘ LUYỆN TẬP</strong>
              </section>
              <section className="is-danger-zone">
                <div><small>DỮ LIỆU CỤC BỘ</small><h2>Xóa hành trình và bắt đầu lại</h2><p>Xóa checkpoint, quyết định, chat, thực hành và cài đặt trên máy này.</p></div>
                {confirmReset ? (
                  <div className="pixel-settings-confirm"><button type="button" onClick={() => setConfirmReset(false)}>Hủy</button><button type="button" onClick={onReset}>Xóa toàn bộ dữ liệu</button></div>
                ) : <button type="button" onClick={() => setConfirmReset(true)}>Bắt đầu lại</button>}
              </section>
            </div>
          ) : null}
        </section>
      )}

      {teacherOpen ? (
        <TeacherOverlay onClose={onCloseTeacher} />
      ) : null}
    </main>
  )
}

export function LearningWindow() {
  const [runtime, setRuntime] = useState<RuntimeInfo | null>(null)
  const [view, setView] = useState<View>('loading')
  const [progress, setProgress] = useState<LearnerProgress | null>(null)
  const [recovered, setRecovered] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [destination, setDestination] = useState<AppDestination>('home')
  const [teacherOpen, setTeacherOpen] = useState(false)
  const [practiceBriefOpen, setPracticeBriefOpen] = useState(false)
  const [practiceFullOpen, setPracticeFullOpen] = useState(false)
  const [outlineSceneId, setOutlineSceneId] = useState<SceneId | null>(null)
  const outlineRef = useRef<HTMLDetailsElement | null>(null)
  const [reviewHistoryIndex, setReviewHistoryIndex] = useState<number | null>(null)
  const [approvalFocus, setApprovalFocus] = useState<ApprovalFocus | null>(null)
  const [visualExpanded, setVisualExpanded] = useState(false)
  const [secondaryVisualExpanded, setSecondaryVisualExpanded] = useState(false)
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultAppSettings)
  const [practiceGuide, setPracticeGuide] = useState<PracticeGuideView | null>(null)
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
        const [runtimeInfo, loadResult, loadedSettings]: [RuntimeInfo | null, ProgressLoadResult, AppSettings] = await Promise.all([
          api?.getRuntimeInfo() ?? Promise.resolve(null),
          api?.loadProgress() ?? Promise.resolve({ status: 'new' as const }),
          api?.loadAppSettings() ?? Promise.resolve(defaultAppSettings)
        ])
        setRuntime(runtimeInfo)
        setAppSettings(loadedSettings)

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
        if (api) {
          setPracticeGuide(await api.loadPracticeGuide({ surface: 'learning' }))
        }
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
    const unsubscribe = window.courseCompanion?.onFullTeacherRequested(() => {
      setPracticeBriefOpen(false)
      setPracticeFullOpen(true)
      setTeacherOpen(true)
    })
    return () => {
      unsubscribe?.()
    }
  })

  useEffect(() => {
    const unsubscribe = window.courseCompanion?.onPracticeReturned(() => {
      void (async () => {
        try {
          const loadResult = await window.courseCompanion?.loadProgress()
          if (!loadResult || (loadResult.status !== 'returning' && loadResult.status !== 'recovered')) return
          setProgress(loadResult.progress)
          const guide = await window.courseCompanion?.loadPracticeGuide({ surface: 'learning' })
          setPracticeGuide(guide ?? null)
          setPracticeBriefOpen(false)
          setPracticeFullOpen(false)
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
  const updatePracticeGuide = async (request: PracticeGuideUpdateRequest) => {
    if (!window.courseCompanion) return
    try {
      setPracticeGuide(await window.courseCompanion.updatePracticeGuide(request, { surface: 'learning' }))
    } catch {
      // The lesson and its navigation remain authoritative if optional guidance fails.
    }
  }

  const persist = async (update: ProgressUpdate): Promise<LearnerProgress> => {
    const saved = window.courseCompanion
      ? await window.courseCompanion.saveProgress(update)
      : previewProgress(update, progress ?? undefined)
    setProgress(saved)
    return saved
  }

  const startNew = async () => {
    setBusy(true)
    setError('')
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
      setAppSettings(defaultAppSettings)
      setDestination('home')
      setPracticeGuide(null)
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

  const updateAppSettings = async (companionAlwaysOnTop: boolean) => {
    setError('')
    try {
      const saved = window.courseCompanion
        ? await window.courseCompanion.saveAppSettings({ companionAlwaysOnTop })
        : { ...appSettings, companionAlwaysOnTop }
      setAppSettings(saved)
    } catch {
      setError('Không thể lưu cài đặt Triết nổi.')
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
      setDestination('lesson')
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
          if (group.id === 'final-assessment' && question.id === 'mastery-audience-choice') {
            return [assessmentDecisionKey(question.id), `correct:self-review:${answer}`]
          }
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
        || progress.sceneId === 'module-2-portfolio-practice'
        || progress.sceneId === 'module-3-portfolio-practice'
        || progress.sceneId === 'module-4-portfolio-practice') {
        setBusy(true)
        setOutlineSceneId(null)
        setReviewHistoryIndex(null)
        setError('')
        try {
          if (choice.next) await advanceToScene(choice.next, progress.decisions)
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
    setPracticeFullOpen(false)
    setTeacherOpen(false)
    setError('')
  }

  if (destination !== 'lesson') {
    return (
      <PixelAppShell
        progress={progress}
        runtime={runtime}
        destination={destination}
        settings={appSettings}
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
        onOpenTeacher={() => setTeacherOpen(true)}
        onCloseTeacher={() => setTeacherOpen(false)}
        onQuit={() => void window.courseCompanion?.quitApp()}
        onReset={() => void reset()}
        onSettingsChange={(alwaysOnTop) => void updateAppSettings(alwaysOnTop)}
      />
    )
  }

  const reviewSceneTrail = reviewTrail(progress.sceneHistory, progress.sceneId, nextReviewPageOf)
  const reviewingSceneId = reviewHistoryIndex === null
    ? undefined
    : reviewSceneTrail[reviewHistoryIndex]
  const isReviewing = outlineSceneId !== null || reviewingSceneId !== undefined
  const currentReviewIndex = reviewHistoryIndex ?? reviewSceneTrail.length
  const displayedSceneId = outlineSceneId ?? reviewingSceneId
    ?? (progress.sceneId === 'module-1-setup-checklist'
      ? 'module-1-skills-portfolio'
      : progress.sceneId)
  const scene = scenes[displayedSceneId]
  const activePracticeDefinition = scenes[progress.sceneId].practice
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
  const isFirstModuleOneSlide = displayedSceneId === 'module-1-codex-orientation'
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
  const usesLessonBoard = usesModelLessonBoard || usesGuidanceLessonBoard || usesImplementationPlanBoard
  const isApprovalTour = displayedSceneId === 'module-1-codex-examples'
  const isVercelTutorial = displayedSceneId === 'module-4-vercel-benefits'
  const navigationOnly = isVercelTutorial || displayedSceneId === 'module-1-complete'
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
  const usesModuleTwoVisualDialogue = scene.lessonId === 'module-2'
    && canShowSceneMedia
    && Boolean(lessonVisual)
    && !usesLessonBoard
    && (showsSceneTitle || usesModuleTwoVisualGallery)
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
    <main data-scene-id={displayedSceneId} data-outline-preview={outlineSceneId !== null} className={`pixel-learning-shell${scene.lessonId === 'module-2' ? ' is-module-two' : ''}${scene.lessonId === 'module-3' ? ' is-module-three' : ''}${scene.lessonId === 'module-4' ? ' is-module-four' : ''}${lessonVisual?.annotations ? ' has-publication-walkthrough' : ''}${usesLessonBoard ? ' has-model-lesson-board' : ''}${scene.copyPrompt ? ' has-stacked-copy-prompt' : ''}${usesModuleTwoVisualDialogue ? ' has-module-two-visual-dialogue' : ''}${usesModuleTwoVisualGallery ? ' has-module-two-visual-gallery' : ''}${displayedSceneId === 'module-3-git-commit' || displayedSceneId === 'module-3-git-push' || displayedSceneId === 'module-3-git-merge' || displayedSceneId === 'module-1-setup-checklist' || displayedSceneId === 'module-4-hosting-intro' || lessonVisual?.annotations ? ' has-stacked-visual-dialogue' : ''}`}>
      <div className="pixel-scene-world" style={sceneStyle} aria-hidden="true" />

      <header className="pixel-hud">
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
          <summary aria-label={`Mở mục lục ${outlineModuleLabel}`}>
            <span className="pixel-outline__dots" aria-hidden="true">•••</span>
            <span>{scene.lessonId === 'module-2'
              ? `${outlineModuleLabel} · PHẦN ${outlineCurrentIndex + 1}/${outlineItems.length}`
              : lessonContextLabel}</span>
          </summary>
          <div className="pixel-outline-menu">
            <strong>{outlineModuleLabel} · {outlineItems.length} PHẦN</strong>
            <ol>
              {outlineItems.map((item, index) => (
                <li
                  className={index === outlineCurrentIndex ? 'is-active' : undefined}
                  aria-current={index === outlineCurrentIndex ? 'step' : undefined}
                  key={item.startSceneId}
                >
                  <button type="button" disabled={busy} onClick={() => openOutlinePage(item.startSceneId)}>
                    <i aria-hidden="true" />
                    <span>{item.title}</span>
                  </button>
                </li>
              ))}
            </ol>
            {isReviewing ? (
              <button className="pixel-outline-resume" type="button" onClick={returnToLearningPage}>
                Về trang đang học
              </button>
            ) : null}
          </div>
        </details>
        <div className="pixel-hud-actions">
          <button className="pixel-hud-teacher" type="button" onClick={() => setTeacherOpen(true)}>HỎI TRIẾT</button>
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

      {scene.copyPrompt && !usesLessonBoard ? (
        <CopyPromptCard
          label={scene.copyPromptLabel}
          prompt={scene.copyPrompt}
          title={scene.copyPromptTitle}
        />
      ) : null}
      <PracticeGuide view={practiceGuide} onUpdate={updatePracticeGuide} />
      {assessmentQuestion || scene.assessmentSummary || usesLessonBoard || isVercelTutorial
        ? null
        : <img className="pixel-teacher-character" src={teacherImage} alt="Triết, giáo viên đồng hành" />}

      {canShowSceneMedia && lessonVisual && secondaryLessonVisual && !usesLessonBoard
        ? (
            <div
              className={`pixel-lesson-visual-group${lessonVisual.caption ? ' is-reference-gallery' : ''}`}
              aria-label={lessonVisual.caption
                ? 'Hai nguồn tham khảo thiết kế'
                : 'Hai cách mở nhanh chức năng trong Codex'}
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
                      aria-label={visual.caption
                        ? `Phóng to ảnh ${visual.caption}`
                        : index === 0
                          ? 'Phóng to ảnh minh họa lệnh /'
                          : 'Phóng to ảnh minh họa dấu @'}
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
              {(displayedSceneId === 'module-3-git-push' || displayedSceneId === 'module-3-git-merge' || displayedSceneId === 'module-4-hosting-intro' || lessonVisual.annotations) && lessonVisual.caption ? (
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
        aria-label={navigationOnly ? 'Điều hướng bài học' : isAssessmentQuestionPage ? `Câu hỏi Module ${scene.lessonId.slice(-1)}` : undefined}
        aria-labelledby={isAssessmentQuestionPage || navigationOnly ? undefined : 'teacherName'}
        className={navigationOnly ? 'pixel-lesson-navigation' : `pixel-dialogue${displayedSceneId === 'module-3-git-intro' ? ' is-git-intro' : ''}${scene.choices.length === 1 ? ' has-single-choice' : ''}${scene.choices.length > 3 ? ' has-many-choices' : ''}${assessmentQuestion || scene.assessmentSummary ? ' has-assessment' : ''}${scene.assessmentSummary ? ' is-assessment-summary' : ''} has-no-scene-title${displayedSceneId === 'module-1-codex-examples' ? ' has-approval-tour' : ''}${approvalFocus ? ' has-manual-approval-focus' : ''}${usesLessonBoard ? ' is-model-board-source' : ''}${scene.practice ? ' has-practice-brief' : ''}${isReviewing && scene.lessonId === 'module-2' ? ' is-module-two-review' : ''}`}
      >
        {isAssessmentQuestionPage || navigationOnly ? null : <div className="pixel-speaker"><img src={teacherImage} alt="" /><span>TEACHER</span><strong id="teacherName">Triết</strong></div>}
        {isAssessmentQuestionPage || navigationOnly ? null : displayedSceneId === 'module-2-portfolio-folder' && !isReviewing ? (
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
              : finalPassed
              ? `Bạn đạt ${finalCorrectCount}/${finalQuestionCount} câu. Kết quả này đạt mốc ${finalPassingCount}/${finalQuestionCount} để hoàn thành ${scene.lessonId === 'module-1' ? 'Module 1' : 'Module 2'}.`
              : `Bạn đạt ${finalCorrectCount}/${finalQuestionCount} câu. Hãy làm lại phần kiểm tra để đạt ít nhất ${finalPassingCount}/${finalQuestionCount}.`
            : assessmentGroup
              ? 'Bạn có thể xem toàn bộ câu hỏi trước khi nộp.'
            : displayedSceneId === 'module-1-codex-examples'
              ? <ApprovalTourDialogue activeFocus={approvalFocus} onSelect={setApprovalFocus} />
              : displayedSceneId === 'module-2-prd-agent-workflow'
                ? <DesignReferenceDialogue dialogue={scene.dialogue ?? ''} />
              : scene.highlightTerms
                ? <HighlightedDialogue dialogue={scene.dialogue ?? ''} highlightTerms={scene.highlightTerms} />
              : scene.dialogue}</p>
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
        {isReviewing ? (
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
                      next: scene.lessonId === 'module-1' ? 'module-1-complete' : 'module-2-complete',
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
                  disabled={busy}
                  key={choice.label}
                  type="button"
                  onClick={() => void choose(choice)}
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
              : { practiceId: 'm3-portfolio-build', practiceVersion: '2.0.0' }}
          courseRunId={progress.sceneId === 'module-2-portfolio-practice'
            || progress.sceneId === 'module-3-portfolio-practice'
            || progress.sceneId === 'module-4-portfolio-practice'
            ? progress.courseRunId
            : undefined}
          onClose={() => setPracticeBriefOpen(false)}
          onPortfolioComplete={async () => {
            const isModuleThree = progress.sceneId === 'module-3-portfolio-practice'
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
          onClose={() => {
            const returningToLesson = practiceFullOpen
            setTeacherOpen(false)
            setPracticeFullOpen(false)
            if (returningToLesson) void refreshAfterPractice()
          }}
        />
      ) : null}
    </main>
  )
}
