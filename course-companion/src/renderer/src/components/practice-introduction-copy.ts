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
    context: 'Bạn làm việc trong một task Codex và thư mục portfolio đã chọn. Bạn sẽ mở bản mẫu HTML để xem bố cục trước khi xây website.',
    steps: [
      'Trao đổi với Codex về người xem, nội dung và phạm vi portfolio. Khi đã chọn hướng thiết kế, hãy cùng Codex tạo bản mẫu HTML và mở xem bố cục.',
      'Đọc và duyệt PRD (bản yêu cầu cho website) cùng kế hoạch triển khai.',
      'Nộp năm tài liệu và bản mẫu HTML để Triết kiểm tra. Nếu cần sửa, tiếp tục trong cùng task.'
    ],
    referenceTitle: 'Xem sáu tệp cần nộp',
    referenceNote: 'Codex soạn và lưu tài liệu; bạn đọc, góp ý và duyệt PRD cùng kế hoạch hiện tại trước khi nộp.',
    reference: [
      ['Bản mô tả portfolio', 'planning/portfolio-brief.md', 'Người xem, mục tiêu và phạm vi của website.'],
      ['Nội dung và bằng chứng', 'planning/content-evidence-inventory.md', 'Tư liệu bạn có, nguồn và quyền sử dụng.'],
      ['Tham chiếu thiết kế', 'planning/reference/reference.md', 'Điều muốn học từ các website tham khảo và giới hạn không sao chép.'],
      ['Yêu cầu cho website', 'planning/PRD.md', 'Website cần làm được gì và cách xác nhận kết quả.'],
      ['Kế hoạch triển khai', 'planning/implementation-plan.md', 'Thứ tự xây từng phần và cách kiểm tra.'],
      ['Bản mẫu giao diện', 'planning/reference/design-prototype.html', 'Bố cục và thứ tự nội dung portfolio mà bạn muốn thử.']
    ]
  },
  'm3-portfolio-build': {
    portfolioProject: true,
    title: 'Xây portfolio theo kế hoạch',
    purpose: 'Đối chiếu portfolio với PRD và tự quyết định phiên bản nào sẵn sàng để phát hành.',
    context: 'Tiếp tục task Codex và thư mục portfolio từ Module 2.',
    steps: [
      'Mở lại first draft của website bạn đã tạo ở đầu module',
      'Thử website trên máy tính, đối chiếu với PRD và bản mẫu giao diện để tìm lỗi thiết kế.',
      'Áp dụng quy tắc đã được dạy để sửa lỗi nếu có. Không có lỗi nào thì có thể bỏ qua phần này',
      'Khi hài lòng, nhờ agent tạo commit cho phiên bản này rồi nộp để teacher agent duyệt.'
    ],
    referenceTitle: 'Xem ba hồ sơ Codex cần ghi lại',
    referenceNote: 'Codex ghi lại quá trình; bạn kiểm tra website và đưa ra quyết định. Sau khi Practice đạt, bạn còn năm câu tổng kết.',
    reference: [
      ['Quá trình xây website', 'evidence/module-3/build-log.md', 'Phạm vi đã xây và kết quả kiểm tra kỹ thuật.'],
      ['Quan sát và quyết định', 'evidence/module-3/learning-record.md', 'Điều bạn đã thử và kết quả bạn quan sát được.'],
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
