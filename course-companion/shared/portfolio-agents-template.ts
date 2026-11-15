export const portfolioAgentsFileName = 'AGENTS.md'

export const portfolioAgentsTemplate = `# Quy tắc làm việc cho portfolio này

Course Companion tạo tệp này khi bạn chọn thư mục portfolio. Codex tự đọc tệp này trước khi làm việc trong thư mục.

## Cách dùng tệp này

- Các mục "Thư mục làm việc" và "Tài liệu và dữ liệu" áp dụng cho mọi module.
- Mỗi mục "Module …" bên dưới chỉ áp dụng cho đúng module đó. Chỉ làm theo mục của module hiện tại và bỏ qua các mục module khác, kể cả khi chúng có vẻ liên quan.
- Module hiện tại là module được nêu trong chỉ dẫn Course Companion gửi vào task. Nếu chỉ dẫn không nêu module và thư mục chưa có mã ứng dụng, đó là Module 2. Nếu vẫn chưa rõ, hãy hỏi người học trước khi làm.

## Thư mục làm việc

- Đây là thư mục portfolio người học đã chọn trong Course Companion. Mọi đường dẫn bên dưới đều tính từ thư mục này.
- Không tạo task hoặc thư mục portfolio mới. Nếu chưa xác định được đúng thư mục, hãy hỏi người học trước khi tạo hay sửa tệp.

## Tài liệu và dữ liệu

- Nếu đã có tài liệu hoặc quyết định được xác nhận trong task, hãy dùng lại và chỉ hỏi những phần còn thiếu.
- Chờ người học đồng ý trước khi đổi tên, di chuyển, xóa hay ghi đè tài liệu hiện có.
- Những điểm chưa biết cần được làm rõ với người học hoặc ghi nhận trung thực, không tự bịa dữ liệu.

## Module 2: gói kế hoạch

Gói nộp Module 2 phải có đủ năm tài liệu riêng biệt, đúng tên và đường dẫn sau:

1. planning/portfolio-brief.md — người xem, mục tiêu và phạm vi portfolio.
2. planning/content-evidence-inventory.md — nội dung, bằng chứng, nguồn và quyền sử dụng.
3. planning/reference/reference.md — tham chiếu thiết kế, nguồn và giới hạn không sao chép.
4. planning/PRD.md — yêu cầu có mã REQ-* và tiêu chí chấp nhận.
5. planning/implementation-plan.md — các giai đoạn, phụ thuộc, thứ tự thực hiện và cách kiểm chứng từng yêu cầu REQ-* trong PRD.

- Mỗi tài liệu phải có ít nhất hai mục Markdown với nội dung thực tế, không để mục rỗng hay chỗ giữ chỗ.
- Nếu có một bản kế hoạch tổng hợp như planning/portfolio-plan.md, hãy đề xuất cách tách hoặc đổi tên để hoàn thiện năm tài liệu trên.
- Chỉ lưu ảnh tham chiếu nếu cần trong planning/reference/screenshots/ và dẫn ảnh trong planning/reference/reference.md.
- Trước khi kết thúc, đối chiếu gói nộp với đủ năm đường dẫn trên, giải thích nội dung còn thiếu và chờ người học đọc, duyệt PRD cùng kế hoạch triển khai hiện tại.
- Sau đó nhắc người học quay lại Course Companion để xác nhận đã duyệt và nộp gói cho Triết kiểm tra; không tự phê duyệt hoặc tuyên bố Practice đã hoàn thành.

## Module 3: xây website

- Đọc năm tài liệu trong planning/ làm nguồn yêu cầu; chỉ sửa chúng khi người học yêu cầu.
- Dùng React, TypeScript và Vite. Chạy npm run check trước khi báo một phần đã xong.
- Làm từng phần nhỏ theo implementation plan. Sau mỗi phần, chờ người học tự xem website rồi chấp nhận hoặc yêu cầu sửa trước khi làm tiếp.
- Commit sau mỗi phần người học đã chấp nhận. Khi người học muốn thêm tính năng mới, đề xuất tạo branch riêng.
- Không thêm backend, dịch vụ xử lý dữ liệu hay triển khai lên hosting trong Module 3.
- Trước khi push lên GitHub, kiểm tra secret, token và dữ liệu riêng tư, nói rõ nội dung nào sẽ công khai và chờ người học đồng ý.

## Module 4: đưa portfolio lên mạng

- Giữ nguyên năm tài liệu planning, mã nguồn và hồ sơ Module 3; không thêm tính năng ngoài phạm vi phát hành.
- Trước mỗi lần commit, push, tạo project trên Vercel hay triển khai, nói rõ phạm vi, nội dung sẽ công khai và chi phí nếu có; chờ người học đồng ý cho đúng hành động đó.
- Không ghi secret vào chat hay tệp. Không tự mua tên miền hay dịch vụ.
- Sau khi phát hành, mọi thay đổi về sau đều sửa và kiểm tra ở local trước; người học thấy ổn thì mới commit và push lên main.
`
