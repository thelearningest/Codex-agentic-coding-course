export type Introduction = {
  title: string
  purpose: string
  context: string
  portfolioProject?: boolean
  steps: readonly string[]
  referenceTitle: string
  referenceNote?: string
  reference: readonly (readonly [string, string, string])[]
}

const settings = [
  ['Effort', 'Medium hoặc High', 'Mức độ suy luận của Codex khi xử lý yêu cầu.'],
  ['Speed', 'Standard', 'Chế độ tốc độ xử lý của task.'],
  ['Approval', 'Approve for me', 'Cách Codex xử lý yêu cầu phê duyệt hành động.'],
  ['Full access', 'Tắt', 'Giữ chế độ toàn quyền ở trạng thái tắt.']
] as const

const introductions: Record<string, Introduction> = {
  'm1-codex-safe-setup': {
    title: 'Làm quen với cài đặt Codex',
    purpose: 'Bạn sẽ thực hành chọn cách Codex làm việc và kiểm tra các quyền được cấp cho task.',
    context: 'Task là cuộc trò chuyện với Codex dành riêng cho bài thực hành này.',
    steps: [
      'Mở task thực hành trong Codex.',
      'Kiểm tra bốn cài đặt theo hướng dẫn bên dưới. Bạn tự chọn Model phù hợp.',
      'Nhờ Triết kiểm tra kết quả. Nếu cần sửa, bạn tiếp tục trong cùng task.'
    ],
    referenceTitle: 'Xem bốn cài đặt cần kiểm tra',
    reference: settings
  },
  'm2-portfolio-planning': {
    portfolioProject: true,
    title: 'Lập kế hoạch cho portfolio',
    purpose: 'Bạn sẽ biến ý tưởng portfolio thành một kế hoạch rõ ràng trước khi xây website.',
    context: 'Bạn làm việc trong một task Codex và thư mục portfolio đã chọn. Phần này chỉ lập kế hoạch, chưa viết code hay đưa website lên mạng.',
    steps: [
      'Trao đổi với Codex về người xem, nội dung và phạm vi portfolio.',
      'Đọc và duyệt PRD (bản yêu cầu cho website) cùng kế hoạch triển khai.',
      'Nộp năm tài liệu để Triết kiểm tra. Nếu cần sửa, tiếp tục trong cùng task.'
    ],
    referenceTitle: 'Xem năm tài liệu cần hoàn thiện',
    referenceNote: 'Codex soạn và lưu tài liệu; bạn đọc, góp ý và duyệt PRD cùng kế hoạch hiện tại trước khi nộp.',
    reference: [
      ['Bản mô tả portfolio', 'planning/portfolio-brief.md', 'Người xem, mục tiêu và phạm vi của website.'],
      ['Nội dung và bằng chứng', 'planning/content-evidence-inventory.md', 'Tư liệu bạn có, nguồn và quyền sử dụng.'],
      ['Tham chiếu thiết kế', 'planning/reference/reference.md', 'Điều muốn học từ các website tham khảo và giới hạn không sao chép.'],
      ['Yêu cầu cho website', 'planning/PRD.md', 'Website cần làm được gì và cách xác nhận kết quả.'],
      ['Kế hoạch triển khai', 'planning/implementation-plan.md', 'Thứ tự xây từng phần và cách kiểm tra.']
    ]
  },
  'm3-portfolio-build': {
    portfolioProject: true,
    title: 'Xây portfolio theo kế hoạch',
    purpose: 'Bạn sẽ điều phối Codex xây từng phần của website, tự xem kết quả và quyết định cần sửa gì.',
    context: 'Tiếp tục task Codex và thư mục portfolio từ Module 2.',
    steps: [
      'Xây từng phần theo kế hoạch đã duyệt. Xem và chấp nhận từng phần trước khi tiếp tục.',
      'Đề xuất một cải thiện và điều tra một lỗi có bằng chứng. Việc đã làm trong lúc xây được tính.',
      'Kiểm tra website theo PRD, chấp nhận phiên bản hiện tại rồi nộp để Triết duyệt.'
    ],
    referenceTitle: 'Xem ba hồ sơ Codex cần ghi lại',
    referenceNote: 'Codex ghi lại quá trình; bạn kiểm tra website và đưa ra quyết định. Sau khi Practice đạt, bạn còn năm câu tổng kết.',
    reference: [
      ['Quá trình xây website', 'evidence/module-3/build-log.md', 'Các phần đã xây và quyết định của bạn sau mỗi phần.'],
      ['Cải thiện và gỡ lỗi', 'evidence/module-3/learning-record.md', 'Một cải thiện do bạn đề xuất và một lần điều tra, kiểm tra lại lỗi.'],
      ['Kiểm tra website', 'evidence/module-3/browser-validation.md', 'Kết quả kiểm tra website hiện tại so với PRD.']
    ]
  },
  'm4-portfolio-release': {
    portfolioProject: true,
    title: 'Đưa portfolio lên mạng',
    purpose: 'Bạn sẽ có đường link để chia sẻ portfolio và biết cách kiểm tra website trên máy tính và điện thoại.',
    context: 'Tiếp tục task Codex và thư mục portfolio từ Module 3. Bạn tự đăng nhập, cấp quyền và quyết định phát hành.',
    steps: [
      'Cùng Codex chuẩn bị phiên bản portfolio và đưa website lên Vercel sau khi bạn đồng ý.',
      'Mở đường link khi chưa đăng nhập, kiểm tra nội dung, ảnh và liên kết trên máy tính và điện thoại.',
      'Chấp nhận portfolio trên mạng rồi nộp để Triết duyệt. Phần này không có bài kiểm tra cuối.'
    ],
    referenceTitle: 'Xem hồ sơ triển khai Codex cần ghi lại',
    referenceNote: 'Bạn xem website và quyết định chấp nhận; Codex ghi kết quả vào một hồ sơ hỗ trợ.',
    reference: [
      ['Kết quả triển khai', 'evidence/module-4/deployment-record.json', 'Phiên bản website, đường link và kết quả kiểm tra trên máy tính, điện thoại.']
    ]
  }
}

export function getPracticeIntroduction(practiceId: string): Introduction | undefined {
  return introductions[practiceId]
}
