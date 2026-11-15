# Tiêu chí đánh giá mức độ thành thạo

Bảng tiêu chí này đánh giá khả năng thiết lập Codex và dùng planning để giao
tiếp với coding agent, không đánh giá kiến thức lập trình. Teacher chỉ đánh dấu
hoàn thành khi Learner có artifact bắt buộc và bằng chứng hiểu quyết định của
chính mình.

## Thang điểm

- **0 - Chưa thấy bằng chứng**: Learner chưa thử hoặc câu trả lời không liên quan.
- **1 - Nhận diện có hỗ trợ**: Learner làm được khi Teacher gợi ý nhiều.
- **2 - Làm được có kiểm tra**: Learner làm được với gợi ý nhẹ và biết nêu bằng chứng.
- **3 - Tự chủ**: Learner tự đưa yêu cầu rõ, kiểm soát phạm vi, review và giải thích được.

## Kỹ năng cốt lõi của Module 1

| Kỹ năng | 0 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- |
| Hiểu vai trò của Codex | Xem Codex như chatbot chỉ trả lời chữ | Nhận biết Codex là coding agent của OpenAI | Giải thích được Codex cần mục tiêu, bối cảnh và phạm vi hành động | Giao được một mục tiêu có ranh giới và cách kiểm tra kết quả |
| Chọn model | Chọn theo tên gọi hoặc mức mạnh nhất | Chấp nhận model mặc định khi được nhắc | Chọn theo loại công việc và biết khi nào cần điều chỉnh mức suy luận | Tự giải thích tradeoff giữa tốc độ, chi phí suy luận và độ phức tạp của tác vụ |
| Quyền và phê duyệt | Đồng ý hoặc từ chối mà không đọc | Biết Codex đôi khi phải xin phép | Kiểm tra mục đích, phạm vi và tác động trước khi quyết định | Tự nhận diện yêu cầu quyền bất thường hoặc rộng hơn nhiệm vụ |
| Hướng dẫn dự án | Không phân biệt prompt với `AGENTS.md` | Phân biệt được khi có ví dụ | Đặt chỉ dẫn lâu dài trong `AGENTS.md` và mục tiêu riêng trong prompt | Tự viết chỉ dẫn rõ, ngắn và kiểm tra được qua task mới |
| Dùng Skill | Xem mọi prompt là Skill | Nhận ra Skill là hướng dẫn tái sử dụng | Dùng đúng Skill có sẵn cho quy trình lặp lại | Tự đánh giá khi nào đáng tạo hoặc cài thêm Skill |

## Tiêu chí hoàn thành Module 1

Learner pass Module 1 khi đạt tất cả điều kiện:

- Đạt mức 2 trở lên ở ít nhất 4/5 kỹ năng.
- Không kỹ năng nào ở mức 0.
- `artifacts/codex-setup-checklist.md` tồn tại, có nội dung và được Learner duyệt.
- Learner đã duyệt nội dung trong khối `Learner-editable preferences` của
  `AGENTS.md` trước khi Codex sửa file.
- Learner đạt ít nhất 3/4 câu trong quiz Module 1 và giải thích câu trả lời
  tự luận bằng lời của mình.

## Kỹ năng cốt lõi của Module 2

| Kỹ năng | 0 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- |
| Người xem và ranh giới | Không xác định được portfolio phục vụ ai hoặc việc gì | Nêu nhiều nhóm nhưng chưa chọn ưu tiên | Chọn một người xem chính, quyết định của họ và ranh giới phiên bản đầu | Tự bảo vệ lựa chọn bằng mục tiêu, hệ quả và bằng chứng hiện có |
| Trung thực, riêng tư và quyền công bố | Trình bày mọi nội dung như sự thật có thể công khai | Nhận ra vấn đề khi Teacher chỉ điểm | Phân biệt đúng trạng thái bằng chứng, dữ liệu riêng tư và quyền công bố | Tự phát hiện khoảng trống, chọn cách xử lý và không phóng đại bằng chứng |
| Ranh giới tham chiếu | Muốn sao chép nguyên nguồn | Lưu nguồn nhưng chưa nói rõ điều muốn học theo | Ghi nguồn, trạng thái hữu ích, điều thích và ranh giới không sao chép | Tự giải thích cách tham chiếu hỗ trợ hướng riêng mà không chiếm dụng tài sản |
| Chất lượng PRD | PRD thiếu phạm vi, yêu cầu hoặc tiêu chí chấp nhận | Có phần chính nhưng còn mơ hồ hoặc khóa công nghệ quá sớm | Yêu cầu truy được về mục tiêu, có hành vi rộng/hẹp, khả năng tiếp cận và tiêu chí kiểm tra được | Tự phát hiện mâu thuẫn, giả định ẩn và sửa đúng điểm trước khi duyệt |
| Truy vết và kế hoạch | Yêu cầu không nối với phép kiểm tra hoặc plan đưa nội dung ngoài phạm vi trở lại | Nhận ra điểm lệch khi Teacher chỉ rõ | Map được requirement với acceptance criterion, phép kiểm tra, bằng chứng và phase liên quan | Tự phát hiện thiếu/thừa, chia phase hợp lý và giữ nhiệm vụ đầu tiên đủ hẹp |
| Quyền sở hữu quyết định | Chấp nhận đầu ra hoặc lặp lại ví dụ của bài học | Chọn duyệt/sửa khi được nhắc | Giải thích bằng lời của mình người xem, ranh giới, khoảng trống và một mapping thật | Chủ động chất vấn đề xuất của Codex bằng mục tiêu, artifact và bằng chứng hiện tại |

## Tiêu chí hoàn thành Module 2

Learner pass Module 2 khi đạt tất cả điều kiện:

- Đạt mức 2 trở lên ở ít nhất 5/6 kỹ năng theo review của Teacher.
- Không kỹ năng nào ở mức 0.
- Bảy artifact trong `planning/` tồn tại, có digest hiện tại và được Learner
  duyệt theo đúng stage.
- Practice `m2-portfolio-planning` có đủ năm stage receipt hợp lệ trên cùng
  course run, practice run và workspace hiện tại.
- Mọi requirement trong phạm vi có acceptance criterion, cách kiểm tra, bằng
  chứng dự kiến và phase tương ứng; nội dung ngoài phạm vi không quay lại plan.
- `planning/first-bounded-task.md` dừng ở một nhiệm vụ đầu tiên có thể phê duyệt,
  kiểm tra và khôi phục độc lập; chưa chọn công nghệ thay Learner hoặc tạo app.
- Learner tự trả lời bốn câu về người xem, một ranh giới, một khoảng trống bằng
  chứng và một requirement-validation mapping từ artifact của chính mình. Lặp
  lại ví dụ Mai không được tính là bằng chứng đạt.
- Các câu tình huống đạt chính sách mastery được cấu hình cho pilot hiện tại.
  Không công bố một mốc điểm số cố định trong nội dung khóa học trước khi có dữ
  liệu từ người học mới đại diện.
- Mastery receipt ghi phiên bản assessment, cấu hình chấm được dùng và kết quả
  review. Practice receipt không thay thế mastery receipt; mastery receipt cũng
  không thay thế artifact và phê duyệt hiện hành.

## Feedback mẫu

### Nếu Learner đạt

"Bạn đã đạt Module 2. Gói planning giữ rõ người xem, bằng chứng, ranh giới và
cách kiểm tra từng requirement. Bạn cũng đã tự giải thích các quyết định bằng
artifact hiện tại của mình, không dựa vào ví dụ của bài học."

### Nếu Learner gần đạt

"Bạn gần hoàn thành rồi. PRD đã rõ, nhưng một requirement chưa có cách kiểm tra
và bằng chứng tương ứng trong map. Ta sẽ sửa đúng mapping đó rồi kiểm tra lại
những receipt phụ thuộc."

### Nếu Learner chưa đạt

"Bằng chứng hiện tại chưa đủ để hoàn thành module. Ta quay lại đúng điểm đầu
tiên bị thiếu: quyết định nào chưa có nguồn, ranh giới hoặc cách kiểm tra đủ rõ
để bạn tự duyệt?"
