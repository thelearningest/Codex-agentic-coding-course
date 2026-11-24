# Kịch bản — Giới thiệu khóa học

## Bước 1 — Xem phần giới thiệu trực quan (`intro-visual-onboarding`)

Teacher nói: "Chào bạn. Mình sẽ hướng dẫn bạn làm việc cùng coding agent để
biến một mục tiêu thành thay đổi có thể kiểm chứng. Chúng ta sẽ dùng
ContentPilot làm dự án thực hành xuyên suốt. Phần giới thiệu trực quan mất
khoảng 3 phút. Sau phần này, bạn sẽ biết mình học gì, thực hành ở đâu và giữ
quyền quyết định như thế nào."

[Dùng `WORKSPACE_ROOT` để tạo link Markdown cục bộ tuyệt đối tới
`course/onboarding/index.html` với nhãn **Mở phần giới thiệu khóa học**.
Không chạy server, không yêu cầu cài dependency và không mở ứng dụng bên ngoài
thay Learner.]

Teacher nói: "Trang HTML này chỉ giải thích bằng hình ảnh; nó không thể đọc,
sửa hoặc chạy bất kỳ thứ gì trong workspace. Hãy xem đến màn hình cuối, rồi
quay lại task Codex này và gửi câu mà trang đã chuẩn bị. Sau đó chúng ta mới
bắt đầu bài thực hành trong workspace thật."

[Dừng chờ Learner. Chỉ đạt khi Learner quay lại sau trải nghiệm và gửi câu xác
nhận "Tôi đã xem xong phần giới thiệu. Hãy bắt đầu bài thực hành chỉ đọc trong
Codex.", hoặc nói rõ họ đã hoàn thành. Sau đó checkpoint
`intro-visual-onboarding`. Không giả định rằng bất kỳ hành động nào trong trang
HTML đã tác động đến workspace.]

## Bước 2 — Bài thực hành chỉ đọc đầu tiên (`intro-first-safe-win`)

Teacher nói: "Bạn đã quay lại Codex. Từ đây, Codex có thể làm việc với
workspace thật. Bước đầu tiên chỉ cho phép đọc file để hiểu đúng dự án và tránh
sửa nhầm. Codex sẽ báo ba loại bằng chứng: đúng dự án thực hành, đúng phần học
hiện có và đúng các file đã đọc."

Teacher nói: "Trước khi Codex đọc, bạn dự đoán báo cáo sẽ xác nhận điều gì:
đúng dự án thực hành, đúng phạm vi phần mở đầu và bài học đầu tiên, hay đúng các
file nguồn? Ba ý này bổ sung cho nhau; mình khuyến nghị kiểm tra cả ba."

[Mở Assessment State dạng prediction. Dừng chờ Learner. Cần thấy Learner hiểu
đây là bước chỉ đọc và chọn ít nhất một bằng chứng muốn kiểm tra. Không biến câu
hỏi thành bài đánh đố. Dùng hint ladder nếu cần.]

[Khi prediction đạt, nói ngắn rằng Executor sẽ chỉ đọc. Trong cùng thread, đọc
`START_HERE.md`, `course/course-structure.json` và liệt kê các thư mục cấp cao
của workspace. Không sửa file, không cài dependency, không dùng network. Báo
ba bằng chứng: tên workspace, phần học hiện có và các đường dẫn đã đọc.]

Teacher nói: "Codex vừa đọc workspace mà không thay đổi gì. Hãy chỉ ra một
chi tiết cụ thể trong báo cáo cho thấy nó đã đọc đúng dự án."

[Dừng chờ Learner. Chấp nhận một bằng chứng cụ thể từ output như tên
ContentPilot, phần giới thiệu + bài học đầu tiên hoặc đường dẫn file. Khi đạt, checkpoint
`intro-first-safe-win`.]

## Bước 3 — Chọn thời lượng học hôm nay (`intro-time-budget`)

Teacher nói: "Bạn vừa hoàn thành vòng cộng tác đầu tiên: dự đoán, cho Codex
đọc và kiểm tra bằng chứng. Tiếp theo, chúng ta sẽ gắn nội dung khóa học với
một quy trình nội dung thật của bạn."

Teacher nói: "Hôm nay bạn có bao nhiêu phút: 10, 20, 30, 45 hay 60?"

[Dừng chờ Learner. Ghi time budget bằng checkpoint `intro-time-budget`. Nếu
dưới 20 phút, nói rõ mốc phù hợp và vẫn bắt đầu Bước 4.]

Teacher nói: "Kết quả của phần mở đầu là một phiếu định hướng cá nhân. Phiếu
này ghi đối tượng, nền tảng, vấn đề cần giải quyết, tiêu chí duyệt và những
quyết định bạn muốn tự giữ. Nhờ vậy, các bài sau phục vụ công việc của bạn thay
vì một ví dụ chung chung."

## Bước 4 — Hiểu vai trò của dự án thực hành (`intro-graduation`)

Teacher nói: "ContentPilot là dự án để bạn luyện các vòng agentic coding trên
một codebase thật. Đến cuối khóa, ứng dụng sẽ nhận dữ liệu thương hiệu, tạo 10
ý tưởng, để bạn chọn 5, rồi giúp tạo, duyệt, lưu và xuất 5 bộ nội dung. Mỗi mốc
xây dựng sẽ rèn một kỹ năng có thể dùng lại cho sản phẩm khác. Để chứng minh
tích hợp AI hoạt động, bạn cần chạy API thật ít nhất một lần; dữ liệu mô phỏng
chỉ dùng để học và sửa lỗi."

Teacher nói: "Bạn luôn giữ quyền quyết định cuối cùng. Bạn muốn trực tiếp kiểm
soát phần nào: chọn ý tưởng, kiểm tra thông tin, giọng viết, hình ảnh hay xuất
bản? Các lựa chọn có thể kết hợp; mình khuyến nghị ít nhất giữ quyền duyệt nội
dung và quyết định xuất bản."

[Dừng chờ Learner. Không yêu cầu một đáp án duy nhất; cần một quyết định có lý
do như chọn ý tưởng, duyệt claim, giọng viết, hình ảnh hoặc xuất bản. Khi đạt,
checkpoint `intro-graduation`.]

## Bước 5 — Chọn vấn đề nội dung hằng tuần (`intro-problem`)

Teacher nói: "Hãy chọn một việc nội dung lặp lại mỗi tuần đang tốn thời gian,
khó giữ nhất quán hoặc bị kẹt ở khâu duyệt. Chỉ cần mô tả một việc cụ thể. Nếu
chưa có tình huống thật, bạn có thể dùng thương hiệu mẫu Mộc Học; mình khuyến
nghị dùng công việc thật nếu bạn đã có."

[Dừng chờ Learner. Nếu quá chung, hỏi một biến làm rõ: loại bài, người nhận,
deadline hoặc khâu duyệt. Khi đạt, checkpoint `intro-problem`.]

## Bước 6 — Chọn nền tảng nội dung chính (`intro-platform`)

Teacher nói: "Nếu dự án thực hành chỉ được tối ưu đầu ra cho một nền tảng trước, bạn chọn
nền tảng nào và vì sao? Ví dụ: LinkedIn để tiếp cận khách hàng chuyên nghiệp,
Facebook để nuôi cộng đồng hoặc Instagram để ưu tiên nội dung hình ảnh. Hãy
chọn nền tảng quan trọng nhất với công việc hiện tại của bạn."

[Dừng chờ Learner. Khi có platform và lý do, checkpoint `intro-platform`.]

## Bước 7 — Hoàn thành phiếu định hướng (`intro-quest-card`)

Teacher nói: "Giờ hãy hoàn thành phiếu định hướng bằng nội dung của bạn. Dùng
khung trong `artifacts/quest-card.template.md`. Ở dòng tiêu chí duyệt, hãy viết
một dấu hiệu có thể kiểm tra được, chẳng hạn đúng giọng thương hiệu, không có
thông tin chưa được xác minh hoặc có lời kêu gọi hành động rõ. Bạn có thể kết
hợp nhiều tiêu chí phù hợp với công việc của mình."

[Dừng chờ Learner. Teacher không điền thay. Sau khi Learner trả lời đủ, xin phép
tạo `artifacts/quest-card.md` từ nội dung họ đã viết. Khi file được tạo,
checkpoint `intro-quest-card`.]

## Bước 8 — Kiểm tra sẵn sàng (`intro-readiness`)

Teacher nói: "Phiếu định hướng đã đủ thông tin để dùng trong Module 1. Trước khi
chuyển bài, mình sẽ hỏi hai câu ngắn: một câu về tiêu chí duyệt nội dung và một
câu về lý do cần chạy API thật. Mình sẽ hỏi từng câu một."

[Dùng `course/quizzes/intro.quiz.json`. Khi pass, checkpoint
`intro-readiness`.]

## Bước 9 — Chuyển sang Module 1 (`intro-complete`)

Teacher nói: "Bạn đã có đích đến, dự án thực hành và quyền quyết định rõ ràng.
Module 1 sẽ giúp bạn thiết lập môi trường làm việc với Codex: hiểu Codex là gì,
chọn approval an toàn, tìm hiểu model và reasoning effort rồi
nộp cấu hình thật để mình duyệt. Module 2 mới đi vào planning, PRD và
implementation plan cho ContentPilot. Bạn chưa cần biết code hoặc chuẩn bị dữ
liệu."

Teacher nói: "Khi sẵn sàng, dùng `$start-course-lesson module-1`."

[Đánh dấu intro complete, chuyển current lesson sang `module-1`, checkpoint
`intro-complete`.]
