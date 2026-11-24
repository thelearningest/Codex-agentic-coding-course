# Kịch bản — Module 1: Bắt đầu làm việc với Codex

## Bước 1 — Codex và coding agent (`m1-codex-orientation`)

[Mở đầu bằng hai trang theo thứ tự: đọc nguyên văn `course/codex-setup/chat-work.vi.md`, sau đó `course/codex-setup/why-codex.vi.md`. Cho Learner xem ảnh trên từng trang trước khi tiếp tục phần dưới.]

Teacher nói: "Codex là coding agent của OpenAI. Trong bài này, bạn chỉ cần hiểu
coding agent là một trợ lý có thể thực hiện công việc liên quan đến code: tạo
ứng dụng, xây trang web, chỉnh sửa dự án và tự động hóa những việc lặp lại."

Teacher nói: "Codex không chỉ trả lời. Khi được bạn cho phép, Codex có thể đọc
tệp, dùng công cụ, chạy lệnh và kiểm tra kết quả. Bạn vẫn là người đặt mục tiêu,
chọn phạm vi và duyệt kết quả cuối cùng."

[Dùng `WORKSPACE_ROOT` để tạo link Markdown cục bộ tuyệt đối tới
`course/codex-setup/index.html` với nhãn **Mở phần giới thiệu Codex**. Không chạy
server và không yêu cầu cài dependency.]

Teacher nói: "Approval cho biết khi nào Codex cần dừng để bạn quyết định. Ask
for approval hỏi thường xuyên hơn. Approve for me tự xử lý hành động thông
thường nhưng vẫn dừng ở hành động có rủi ro. Full access gỡ bỏ các ranh giới
bảo vệ thông thường. Nếu mới bắt đầu, mình khuyên bạn dùng Approve for me và
để Full access tắt."

Teacher nói: "Ở góc dưới bên phải, ngay cạnh nút microphone, bạn sẽ thấy menu
Model, Effort và Speed. Model chọn dòng model phù hợp với công việc. Effort điều
chỉnh lượng công sức dành cho phân tích. Speed chọn tốc độ xử lý."

### Model

Teacher nói: "Hiện tại, model của OpenAI có bốn dòng chính: Astra, Sol, Terra và Luna."

Teacher nói: "Thú thực, mình thấy khá khó để phân biệt khi nào nên dùng model nào. Với các công việc thông thường hằng ngày, mình thường dùng Sol."

Teacher nói: "Khi cần làm việc phức tạp hơn, chẳng hạn lên kế hoạch trước khi xây dựng ứng dụng, mình sẽ chuyển sang Astra."

Teacher nói: "Mình chỉ dùng Terra làm sub-agent, tức trợ lý AI phụ, để xử lý những việc nhỏ như tìm kiếm trong mã nguồn của dự án."

Teacher nói: "Mình hầu như không dùng Luna. Nhưng mình nghĩ dòng này có thể hữu ích với các công ty lớn muốn phục vụ AI cho hàng triệu người và cần giảm chi phí."

[Xem tài liệu từ OpenAI](https://learn.chatgpt.com/docs/models?surface=app)

### Effort

Teacher nói: "Nhìn chung, effort càng cao thì model AI càng dành nhiều thời gian để suy nghĩ, từ đó làm việc chất lượng hơn. Tuy nhiên kèm theo đó thì nó cũng làm việc lâu hơn và cũng đốt nhiều tiền hơn."

Teacher nói: "Cá nhân mình thường dùng Medium hoặc high, medium cho các tác vụ thông thường và high cho những tác vụ cần chi tiết như tạo plan, mình thường không bao giờ dùng Extra High vì chậm mà cũng không cần thiết. Bạn nên tự thử các mức effort để chọn xem mức nào phù hợp với tác vụ mà bạn muốn. Không phải cứ chọn Extra High là model tự động thông minh hơn. Đôi khi chọn Extra High khiến model overthink và đưa ra những lựa chọn ngu không cần thiết."

### Speed

Teacher nói: "Speed thì dễ thôi, nếu bạn không có gói pro 200$ thì đừng bật chế độ fast. Ngốn tiền và usage kinh khủng"

[Giữ hai trang học hiện có. Trang đầu có Tổng quan và Model; trang kế tiếp có Effort và Speed. Đặt ảnh `model-controls.png` bên trái, nội dung bên phải. Dùng mũi tên và highlight để chỉ vị trí tương ứng trên ảnh, không thêm chữ chú thích ở cột ảnh.]

[Dừng chờ Learner xem phần giới thiệu Codex, màn hình Model, Effort và Speed.
Sau đó hỏi: "Coding agent khác một chatbot chỉ trả lời ở điểm nào?" Đạt khi
Learner nêu được ít nhất một khả năng hành động như đọc tệp, dùng công cụ, chạy
lệnh hoặc kiểm tra kết quả. Checkpoint `m1-codex-orientation`.]

## Bước 2 — `AGENTS.md` và Skills (`m1-agents-and-skills`)

Teacher hỏi: "Vậy, giả dụ có một thông tin mình muốn agent ghi nhớ mà không cần
phải nhắc đi nhắc lại thì mình sẽ làm gì?"

Teacher nói: "Bạn có thể lưu thông tin đó trong `AGENTS.md`. Đây là tệp văn bản
chứa những quy tắc và thông tin coding agent cần biết trước khi làm việc."

Teacher chỉ giới thiệu hai level:

1. Global `AGENTS.md` áp dụng cho mọi repo được mở bằng Codex.
2. Current repo `AGENTS.md` chỉ áp dụng cho repo đang mở và bổ sung quy tắc cụ
   thể hơn cho dự án đó.

Teacher dùng thiết lập thật của Triết làm ví dụ. Global chứa nguyên tắc dùng cho
nhiều dự án. Current repo của khóa học chứa quy tắc giữ nguyên trang chưa được
yêu cầu thay đổi và viết nội dung dành cho người học bằng tiếng Việt tự nhiên.
Teacher chưa yêu cầu Learner tạo tệp. Teacher nói: "Ở Module 2, Course Companion
sẽ tạo sẵn một tệp `AGENTS.md` cho thư mục portfolio của bạn." Course Companion
tạo tệp này khi Learner bấm “Tạo thư mục planning”.

Teacher nói: "Thông thường ta dùng `AGENTS.md` để dạy cho model làm theo những
hành động ta muốn mà ta không cần phải nhắc đi nhắc lại. Nhưng giả dụ ta muốn nó
làm những tác vụ cụ thể như viết lách, thì sao? Chả lẽ ta viết hết tất cả những
mẹo viết hay vào `AGENTS.md`? Và giả dụ ta có 100 kỹ năng muốn agents học thì
sao? Ta không thể dùng một file `AGENTS.md` để dạy coding agents tất cả kỹ năng
mà ta muốn nó học. Đó là lúc ta sử dụng Skill."

Teacher giải thích mỗi skill có tệp chính `SKILL.md`, trong đó mô tả khi nào nên
dùng, các bước cần thực hiện và điều cần kiểm tra.

Ở trang Skill đầu tiên, Teacher mở một panel duy nhất chứa đoạn trích tiếng Anh
từ `impeccable`; không dùng ảnh chụp và không hiển thị toàn bộ skill.

Teacher nói: "Theo kinh nghiệm của mình, agent thường xử lý chỉ dẫn kỹ thuật
bằng tiếng Anh ổn định hơn. Vì vậy, phần hướng dẫn dành cho agent trong khóa học
này sẽ ưu tiên tiếng Anh. Bạn vẫn có thể trao đổi với Codex bằng tiếng Việt."

Ở trang Skill thứ hai, Teacher giới thiệu `impeccable` cho giao diện
portfolio và `copywriting` cho nội dung dựa trên thông tin thật. Teacher giới
thiệu `skills.sh` là nơi khám phá skill do cộng đồng chia sẻ và nói rõ Learner
chưa cần cài thêm skill trong Module 1.

### Làm quen với Project trong Codex

Teacher nói: "Xuyên suốt khóa học, bạn sẽ sử dụng tính năng Projects của Codex để thực hành."

Teacher nói: "Bạn có thể tìm thấy mục Projects trong thanh bên ở phía trái cửa sổ Codex."

[Cho Learner xem ảnh `course/codex-setup/images/projects-sidebar.png`.]

Teacher nói: "Trong khóa học này, chúng mình đã chuẩn bị sẵn một project cho bạn, nó sẽ tự động hiện lên lúc bạn bắt đầu thực hành."

Teacher nói: "Project giúp Codex làm việc với ngữ cảnh liên quan đến dự án, chẳng hạn như thư mục đang sử dụng, nội dung cuộc trò chuyện và hướng dẫn riêng trong tệp AGENTS.md."

Teacher nói: "Ở bước này, bạn chỉ cần biết cách nhận ra project của khóa học trong mục Projects. Chúng mình sẽ hướng dẫn các thao tác cần thiết khi bạn bắt đầu thực hành."

[Dừng chờ Learner xem đủ năm trang của bài `AGENTS.md` và Skills. Khi chuyển sang
phần thực hành, lưu checkpoint `m1-agents-and-skills`. Không kiểm tra tệp và không
yêu cầu ảnh chụp.]

## Bước 3 — Nộp cấu hình để Triết duyệt (`m1-setup-checklist`)

Teacher nói: "Bây giờ Course Companion sẽ mở một task Codex riêng để bạn cài
cấu hình thật. Ứng dụng chỉ đọc metadata cấu hình hiệu lực của đúng task này;
không đọc ảnh, không cần Codex lập báo cáo và không tự thay đổi cài đặt."

Teacher nói: "Model do bạn tự chọn. Kiểm tra Effort là Medium hoặc High và Approval là
Approve for me trong task Codex. Nếu hai mục đã đúng, bấm Nộp bài."

> Hãy kiểm tra cấu hình trong hai ảnh. Chỉ quan sát, không thay đổi cài đặt.
> Báo cáo dưới tiêu đề `Verification`, gồm Effort và Approval.
> Cảnh báo nếu có mục nào khác cấu hình Triết khuyên dùng.

[Mở Practice `m1-codex-safe-setup`. Chỉ dùng đúng task Executor được liên kết.
Checkpoint `m1-setup-checklist` khi metadata mới của task đã có đủ hai mục.]

## Bước 4 — Triết duyệt bằng chứng

[Khi Learner chọn **Yêu cầu Triết duyệt tiến độ**, đối chiếu metadata hiệu lực
theo Practice definition. Không nhận lời tự xác nhận thay cho dữ liệu của đúng
task. Nếu thiếu, cũ, mất kết nối hoặc sai, nêu các giá trị đang khớp, các giá
trị chưa khớp và đúng một thao tác cài đặt tiếp theo.]

Teacher nói khi đạt: "Mình đã xác minh Effort và Approval trong đúng task Codex của bài."

[Lưu kết quả Practice đạt. Chưa hoàn thành checkpoint `m1-mastery`.]

## Bước 5 — Ôn tập cuối Module 1 (`m1-mastery`)

Teacher nói: "Bạn đã thiết lập Codex và kiểm tra bằng chứng thật. Bây giờ, bốn
câu ôn tập sẽ giúp bạn giải thích, áp dụng và phân tích những gì vừa học. Bạn
cần đạt ít nhất ba câu để hoàn thành Module 1."

[Dùng đủ bốn câu trong `course/quizzes/module-1.quiz.json`. Mở Assessment State
cho từng câu và hỏi từng câu một. Chỉ hiện phản hồi, lời giải cùng nguồn sau khi
Learner đã trả lời. Nếu chưa đạt 3/4, cho làm lại bài ôn tập. Khi đạt, lưu
checkpoint `m1-mastery`.]

## Bước 6 — Hoàn thành Module 1 (`m1-complete`)

Teacher nói: "Bạn đã có cấu hình an toàn để bắt đầu ContentPilot. Quan trọng
hơn, bạn biết cách chọn model, mức suy luận và quyền truy cập phù hợp trước khi
giao việc cho Codex."

Teacher nói: "Khi sẵn sàng, dùng `$start-course-lesson module-2`."

[Chạy lệnh complete cho `module-1`. Chỉ báo hoàn thành khi lệnh thành công và
state chuyển sang `module-2`.]
