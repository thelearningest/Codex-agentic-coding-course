import type { CheckpointId, CourseLessonId, SceneId } from '../../../../../../shared/contracts'
import planningQuiz from '../../../../../../../pilot-workspace/course/quizzes/module-2.quiz.json'
import type { RegistrySceneContent } from '../../module-contracts'

type QuizGroup = {
  id: string
  title: string
  mode: 'formative' | 'mastery'
  questions: Array<{ id: string; sceneId: string; prompt: string; type: string }>
}

const groupRoute: Record<string, {
  checkpointId: CheckpointId
  courseLessonId: CourseLessonId
  step: number
}> = {
  'final-assessment': { checkpointId: 'm2-portfolio-mastery', courseLessonId: 'm2-portfolio-brief', step: 5 }
}

const quizGroups = planningQuiz.groups as QuizGroup[]

const assessmentScenes = Object.fromEntries(quizGroups.flatMap((group) => {
  const route = groupRoute[group.id]
  if (!route) throw new Error(`Nhóm câu hỏi Module 2 chưa có tuyến hiển thị: ${group.id}`)
  return group.questions.map((question, index) => [question.sceneId, {
    lessonId: 'module-2',
    checkpointId: route.checkpointId,
    step: route.step,
    totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO',
    mission: group.title,
    objective: `Câu ${index + 1}/${group.questions.length}`,
    panelLabel: group.mode === 'mastery' ? 'KIỂM TRA TỔNG HỢP' : 'KIỂM TRA NHANH',
    panelStatus: `CÂU ${index + 1}/${group.questions.length}`,
    tone: 'neutral',
    request: 'Trả lời trước. Lời giải và nguồn sẽ hiện sau khi bạn trả lời.',
    evidence: [
      { label: 'HÌNH THỨC', value: question.type === 'multiple-choice' ? 'Chọn một đáp án' : 'Trả lời bằng tài liệu của bạn' },
      { label: 'TIẾN ĐỘ', value: `${index + 1}/${group.questions.length}` }
    ],
    dialogue: question.prompt,
    choices: [],
    assessmentQuestionId: question.id,
    assessmentGroupId: group.id,
    showTitle: false
  } satisfies RegistrySceneContent])
})) as Partial<Record<SceneId, RegistrySceneContent>>

const instructionalScenes = {
  'module-2-portfolio-workspace': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-brief', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Lập kế hoạch trước khi xây',
    objective: 'Chốt điều cần làm trước khi Codex chọn cách làm', panelLabel: 'RANH GIỚI MODULE 2',
    panelStatus: 'KẾ HOẠCH TRƯỚC · CODE SAU', tone: 'neutral',
    request: 'Module 2 kết thúc ở kế hoạch triển khai. Module 3 mới bắt đầu xây.',
    evidence: [
      { label: 'MỤC TIÊU', value: 'Portfolio cần truyền đạt điều gì' },
      { label: 'PHẠM VI', value: 'Điều thuộc và chưa thuộc phiên bản đầu' },
      { label: 'KIỂM CHỨNG', value: 'Cách biết từng yêu cầu đã đạt' }
    ],
    dialogue: 'Sau khi hoàn thành module 1, hy vọng các bạn đã hiểu hơn về cách sử dụng Codex. Tiếp theo, chúng ta sẽ cùng tìm hiểu về cách planning khi sử dụng Coding agents. Nhiều bạn mới bắt đầu code với AI thường bỏ qua phần lên kế hoạch mà nhảy thẳng vào phần thực thi.\n\n Các bạn ấy nghĩ rằng mình đang tiết kiệm thời gian, nhưng thực chất các bạn đang lầm. Nếu có một kế hoạch tốt trước khi bắt đầu xây sản phẩm. Bạn sẽ tiết kiệm được biết bao thời gian debug và sửa lại từ đầu vì không đúng ý. Tin mình đi, mình đã phạm phải sai lầm này và đã phải trả giá.',
    choices: [{ label: 'Xem cách Module 2 diễn ra', next: 'module-2-prd-definition', primary: true }]
  },
  'module-2-prd-definition': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-brief', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 2 · PLANNING VÀ PRD', mission: 'PRD là gì?',
    objective: 'Giữ quyết định về sản phẩm trước khi chọn cách xây', panelLabel: 'PRD',
    panelStatus: 'PRODUCT REQUIREMENTS DOCUMENT', tone: 'neutral',
    request: 'PRD mô tả sản phẩm cần giải quyết vấn đề gì và kết quả nào phải đạt được.',
    evidence: [
      { label: 'VẤN ĐỀ', value: 'Vì sao sản phẩm cần tồn tại' },
      { label: 'KẾT QUẢ', value: 'Người dùng cần làm được gì' },
      { label: 'RANH GIỚI', value: 'Điều thuộc và không thuộc phiên bản đầu' }
    ],
    dialogue: 'Để lên được một kế hoạch tốt, mình sẽ giới thiệu cho các bạn một khái niệm thường được dùng trong quá trình phát triển phần mềm - PRD. PRD là viết tắt của Product Requirements Document, hay tài liệu yêu cầu sản phẩm. Tài liệu này giúp bạn và coding agent thống nhất sản phẩm cần làm gì trước khi bàn đến chi tiết kỹ thuật như framework, thư viện hoặc cấu trúc code.',
    choices: [{ label: 'Xem một PRD tốt cần có gì', next: 'module-2-prd-review-workflow', primary: true }]
  },
  'module-2-prd-review-workflow': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-brief', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 2 · PLANNING VÀ PRD', mission: 'Tạo và review PRD cùng coding agent',
    objective: 'Để AI hỗ trợ mà không giao luôn quyền quyết định', panelLabel: 'QUY TRÌNH 4 BƯỚC',
    panelStatus: 'BỐI CẢNH · HỎI · REVIEW · DUYỆT', tone: 'neutral',
    request: 'Coding agent soạn bản nháp; bạn giữ quyền quyết định mục tiêu, phạm vi và tiêu chí chấp nhận.',
    evidence: [
      { label: '1 · BỐI CẢNH', value: 'Nêu ý tưởng và thông tin đã biết' },
      { label: '2 · LÀM RÕ', value: 'Yêu cầu hỏi từng câu còn thiếu' },
      { label: '3 · REVIEW', value: 'Tìm điểm mơ hồ, mâu thuẫn và tự ý mở rộng' },
      { label: '4 · DUYỆT', value: 'Chỉ chuyển sang plan khi bạn đồng ý' }
    ],
    dialogue: 'Bạn có thể yêu cầu coding agent phỏng vấn mình từng câu, soạn bản nháp PRD rồi tự rà soát những điểm còn mơ hồ. Tuy nhiên, agent không được tự quyết định những điểm chính trong PRD thay bạn. Bạn cần prompt cho agents hỏi bạn cho đến khi nào cả hai đồng ý với nhau mới thôi. Sau khi PRD được duyệt, agent mới chuyển từng yêu cầu thành các bước triển khai nhỏ có cách kiểm tra.',
    choices: [{ label: 'Xem năm giai đoạn', next: 'module-2-prd-agent-workflow', primary: true }]
  },
  'module-2-prd-agent-workflow': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-brief', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Năm giai đoạn, năm tài liệu',
    objective: 'Từ mục đích đến kế hoạch triển khai', panelLabel: 'LỘ TRÌNH MODULE 2',
    panelStatus: '5 GIAI ĐOẠN · 5 TÀI LIỆU', tone: 'neutral',
    request: 'Sau Giai đoạn 5, Module 2 dừng. Module 3 mới đề xuất task đầu tiên.',
    evidence: [
      { label: '1 · MỤC ĐÍCH', value: 'Bản định hướng portfolio' },
      { label: '2 · HIỆN CÓ', value: 'Tư liệu cho portfolio' },
      { label: '3 · THAM KHẢO', value: 'Nguồn tham khảo cho portfolio' },
      { label: '4 · PRD', value: 'PRD của portfolio' },
      { label: '5 · KẾ HOẠCH', value: 'Kế hoạch triển khai' }
    ],
    dialogue: 'Ngoài nội dung ra thì bạn cũng cần lên kế hoạch cho thiết kế của ứng dụng bạn muốn tạo. Trong phần này, nếu bạn có thể tự vẽ đồ hoạ chi tiết thì quá tốt. Nhưng nếu bạn cũng hơi mù thiết kế giống như mình, bạn có thể gửi cho agent ảnh mà bạn thích và những phần cụ thể bạn muốn bắt chước trong ảnh đó. Khi thiết kế portfolio, hai trang web mình hay dùng nhất là Pafolios và Awwwards. Còn nếu thiết kế ứng dụng thì mình sẽ tìm thêm ở hai trang là Dribbble và Mobbin. Hoặc bạn cũng có thể vào Pinterest để tìm cảm hứng.\n\nTrước khi bắt đầu xây sản phẩm thật, bạn cũng có thể nhờ coding agent tạo một visual prototype bằng HTML — tức là một bản mẫu giao diện có thể mở trong trình duyệt. Hãy dùng bản mẫu này để xem bố cục, thứ tự thông tin và cảm giác tổng thể có đúng với điều bạn hình dung hay chưa. Sau khi bạn góp ý và duyệt hướng thiết kế, agent mới bắt đầu xây sản phẩm. Cách làm này giúp bạn nhìn thấy ý tưởng sớm và tránh phải sửa lại quá nhiều khi sản phẩm đã được xây.',
    choices: [{ label: 'Tiếp tục', next: 'module-2-html-design-prototype', primary: true }],
    showTitle: false,
    showPanel: false
  },
  'module-2-html-design-prototype': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-brief', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Duyệt mẫu HTML',
    objective: 'Duyệt mẫu HTML', panelLabel: '', panelStatus: '', tone: 'neutral',
    request: '', evidence: [],
    dialogue: 'Bạn chỉ cần prompt bảo là:\n"tạo mẫu cho tui một thiết kế của portfolio dưới dạng html page để tui có thể duyệt, trước khi tạo một portfolio thật".\n\nVà sau này, không chỉ với portfolio mà với tất cả các ứng dụng khác bạn tạo với AI, bạn nên bảo agent tạo trước một trang html mẫu để bạn duyệt thiết kế. Như vậy sẽ làm giảm trường hợp bạn nói một đằng agent làm một nẻo, vì giờ nó đã có trang html để làm reference.',
    highlightTerms: ['"tạo mẫu cho tui một thiết kế của portfolio dưới dạng html page để tui có thể duyệt, trước khi tạo một portfolio thật".'],
    choices: [{ label: 'Tìm hiểu skill Impeccable', next: 'module-2-impeccable-skill', primary: true }],
    showTitle: false,
    showPanel: false
  },
  'module-2-impeccable-skill': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-brief', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Skill Impeccable',
    objective: 'Skill Impeccable', panelLabel: '', panelStatus: '', tone: 'neutral',
    request: '', evidence: [],
    dialogue: 'Để agent thiết kế giao diện tốt hơn, mình hay dùng thêm một skill tên là Impeccable. Impeccable là một skill (a.k.a file hướng dẫn) giúp agent thực hiện những tác vụ thiết kế một cách chuyên nghiệp hơn, sử dụng những từ vựng và workflow mà một designer thường sử dụng.\n\nMột số tác vụ bạn có thể làm với impeccable:\n\n• Bắt đầu tạo một thiết kế: $impeccable [prompt để tạo sản phẩm]; VD: $impeccable giúp tôi tạo prototype cho portfolio\n• Thấy thiết kế xấu nhưng không biết cải thiện thế nào: $impeccable critique [tên chi tiết]; VD: $impeccable critique trang giới thiệu dự án\n\nThực ra $ hay / đều có thể dùng để gọi skill, nhưng tài liệu chính thức của Impeccable dùng $ nên mình cũng sẽ tuân thủ.\n\nTẹo nữa phần thực hành bạn sẽ được hướng dẫn chi tiết hơn cách cài đặt và sử dụng skill impeccable',
    highlightTerms: ['$impeccable giúp tôi tạo prototype cho portfolio', '$impeccable critique trang giới thiệu dự án'],
    choices: [{ label: 'Tìm hiểu implementation plan', next: 'module-2-implementation-plan-intro', primary: true }],
    showTitle: false,
    showPanel: false
  },
  'module-2-implementation-plan-intro': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-brief', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 2 · IMPLEMENTATION PLAN', mission: 'Từ PRD đến implementation plan',
    objective: 'Implementation plan là gì?', panelLabel: 'IMPLEMENTATION PLAN',
    panelStatus: 'TỪ TỔNG QUAN ĐẾN TỪNG BƯỚC', tone: 'neutral',
    request: 'Implementation plan ghi chi tiết các bước coding agent cần thực hiện để hiện thực hoá PRD.',
    evidence: [],
    dialogue: 'Vậy, sau khi có PRD rồi thì làm gì? Ta sẽ tạo implementation plan.\n\nImplementation plan về căn bản sẽ viết ra những bước chi tiết để coding agent có thể hiện thực hoá PRD. Bạn có thể hiểu nếu PRD là bản kế hoạch tổng quan, thì implementation plan sẽ ghi chi tiết từng bước để thực hiện kế hoạch đó.\n\nThông thường một implementation plan sẽ được chia ra thành nhiều giai đoạn. Mỗi giai đoạn sẽ có tiêu chí hoàn thành rõ ràng.\n\nThường agent tạo PRD và Implementation plan khá tốt nên bạn chỉ cần bảo nó tạo rồi duyệt là được.\n\nPrompt mẫu sẽ được cung cấp ở phần thực hành cuối module.',
    choices: [{ label: 'Tiếp tục tới Practice', next: 'module-2-portfolio-folder', primary: true }],
    showPanel: false
  },
  'module-2-portfolio-folder': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-brief', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Chọn nơi làm portfolio',
    objective: 'Dành một thư mục trống cho hành trình của bạn', panelLabel: 'KHÔNG GIAN LÀM VIỆC',
    panelStatus: 'CHỜ BẠN CHỌN', tone: 'neutral',
    request: 'Course Companion sẽ dùng đúng thư mục này trong Modules 2–4.', evidence: [],
    dialogue: 'Chúng ta sẽ bắt đầu từ một thư mục trống do bạn chọn. Module này chỉ tạo tài liệu trong thư mục planning; chưa cài đặt, chưa tạo ứng dụng và chưa xuất bản.',
    choices: [], showPanel: false
  },
  'module-2-portfolio-practice': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-planning', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Hoàn thành năm tài liệu planning',
    objective: 'Dùng một task Codex qua năm giai đoạn', panelLabel: 'PHẠM VI ĐƯỢC PHÉP',
    panelStatus: '5 TÀI LIỆU · 1 TASK · 5 LẦN DUYỆT', tone: 'good',
    request: 'Executor tạo và cập nhật tài liệu; Course Companion kiểm tra tệp thật trước mỗi lần bạn duyệt.',
    evidence: [
      { label: 'TASK', value: 'Một task xuyên suốt năm giai đoạn', ready: true },
      { label: 'ỨNG DỤNG', value: 'Chưa được tạo', ready: true },
      { label: 'PHÊ DUYỆT', value: 'Bạn duyệt từng phiên bản hiện tại' }
    ],
    dialogue: 'Okay, không để các bạn đợi lâu nữa, bây giờ các bạn có thể qua Codex để tiếp tục thực hành rồi.',
    choices: [{ label: 'Mở Practice lập kế hoạch', action: 'practice', primary: true }],
    showTitle: false,
    showPanel: false
  },
  'module-2-portfolio-mastery': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-mastery', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Chứng minh bạn sở hữu kế hoạch',
    objective: 'Mastery là một gate riêng với Practice', panelLabel: 'BẰNG CHỨNG HỌC TẬP',
    panelStatus: '5 TÌNH HUỐNG · 4 CÂU TỪ ARTIFACT', tone: 'good',
    request: 'Bạn cần áp dụng nguyên tắc và dẫn chiếu các quyết định thật trong planning package của mình.',
    evidence: [
      { label: 'PRACTICE', value: 'Năm giai đoạn đã được duyệt', ready: true },
      { label: 'ARTIFACT', value: 'Năm phiên bản hiện tại', ready: true },
      { label: 'MASTERY', value: 'Không được thay bằng receipt Practice' }
    ],
    dialogue: 'Hãy cùng ôn tập lại kiến thức một chút nhen',
    choices: [{ label: 'Bắt đầu kiểm tra tổng hợp', next: 'module-2-mastery-scenario-viewer', primary: true }],
    showTitle: false,
    showPanel: false
  },
  'module-2-portfolio-mastery-summary': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-mastery', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Hoàn tất phần trả lời',
    objective: 'Đối chiếu mastery với tài liệu hiện tại', panelLabel: 'KẾT QUẢ',
    panelStatus: 'CHỜ GATE HOÀN THÀNH', tone: 'neutral', request: 'Ngưỡng mastery không được công bố trong bản pilot.',
    evidence: [], dialogue: '', choices: [], assessmentGroupId: 'final-assessment', assessmentSummary: true, showTitle: false
  },
  'module-2-portfolio-complete': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-complete', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Sẵn sàng bắt đầu xây',
    objective: 'Module 2 đã hoàn thành', panelLabel: 'ĐẦU VÀO MODULE 3',
    panelStatus: 'ĐÃ LƯU AN TOÀN', tone: 'good', request: 'Biên nhận hoàn thành gắn đúng thư mục, năm tệp, năm lần duyệt và kết quả làm chủ hiện tại.',
    evidence: [
      { label: 'THƯ MỤC', value: 'Đã gắn đúng đường dẫn', ready: true },
      { label: 'TỆP', value: '5 phiên bản hiện tại', ready: true },
      { label: 'BÀN GIAO', value: 'Không chứa lịch sử chat', ready: true }
    ], dialogue: 'Cửa kiểm tra đã lưu biên nhận hoàn thành trước khi mở điểm sẵn sàng của Module 3.', choices: []
  }
} as const satisfies Partial<Record<SceneId, RegistrySceneContent>>

export const moduleTwoScenes = {
  ...instructionalScenes,
  ...assessmentScenes
} satisfies Partial<Record<SceneId, RegistrySceneContent>>
