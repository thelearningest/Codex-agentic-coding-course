# Kịch bản Teacher — Module 2: Planning và PRD trước khi code với AI

## Phần 1 — Tại sao cần planning trước khi code với AI?

Teacher mở đầu bằng nguyên văn lời dẫn của tác giả:

> Sau khi hoàn thành module 1, hy vọng các bạn đã hiểu hơn về cách sử dụng Codex. Đầu tiên, chúng ta sẽ cùng tìm hiểu về cách planning khi sử dụng Coding agents. Nhiều bạn mới bắt đầu code với AI thường bỏ qua phần lên kế hoạch mà nhảy thẳng vào phần thực thi. Các bạn ấy nghĩ rằng mình đang tiết kiệm thời gian, nhưng thực chất các bạn đang lầm. Nếu có một kế hoạch tốt trước khi bắt đầu xây sản phẩm. Bạn sẽ tiết kiệm được biết bao thời gian debug và sửa lại từ đầu vì không đúng ý. Tin mình đi, mình đã phạm phải sai lầm này và đã phải trả giá.

Teacher chuyển tiếp bằng câu hỏi:

> “Vậy, như thế nào là một kế hoạch tốt?”

Teacher giải thích rằng yêu cầu nhỏ, rõ ràng và dễ làm lại có thể được giao trực
tiếp. Sản phẩm mới hoặc công việc có nhiều quyết định phụ thuộc nhau nên được
planning trước.

## Phần 2 — PRD là gì và dùng để làm gì?

Teacher nói:

> “PRD là viết tắt của Product Requirements Document, hay tài liệu yêu cầu sản
> phẩm. PRD giúp bạn và coding agent thống nhất sản phẩm cần giải quyết vấn đề
> gì, dành cho ai và kết quả nào phải đạt được trước khi chọn cách xây.”

Teacher dùng ví dụ trung tính: “Hãy tạo một ứng dụng giúp tôi theo dõi thói quen
hằng ngày.” Teacher chỉ ra rằng đây mới là ý tưởng vì chưa có người dùng chính,
luồng sử dụng, phạm vi phiên bản đầu hoặc dấu hiệu hoàn thành. Không nhắc đến
portfolio trong phần giải thích khái niệm này.

## Phần 3 — Dùng coding agent để tạo, review và duyệt PRD

Teacher hướng dẫn quy trình bốn bước:

1. Learner cung cấp ý tưởng và bối cảnh đã biết.
2. Coding agent hỏi từng câu để làm rõ phần còn thiếu.
3. Coding agent soạn bản nháp rồi rà soát điểm mơ hồ, mâu thuẫn, tiêu chí chưa
   thể kiểm tra và nội dung tự ý mở rộng.
4. Learner sửa hoặc duyệt PRD trước khi agent tạo implementation plan.

Teacher phải nói rõ rằng coding agent hỗ trợ phân tích và soạn thảo, còn Learner
giữ quyền quyết định mục tiêu, người dùng, phạm vi và tiêu chí chấp nhận.

Sau trang quy trình bốn bước, Course Companion có một trang prompt mẫu kèm nút
“SAO CHÉP PROMPT”. Khi Learner hỏi nên giao việc tạo PRD cho coding agent thế
nào, Teacher dẫn Learner dùng đúng prompt mẫu này và thay phần trong ngoặc vuông
bằng ý tưởng của mình:

> Tôi muốn viết PRD cho dự án mình đang làm: [mô tả ngắn ý tưởng của bạn]. Hãy
> phỏng vấn tôi từng câu một để làm rõ những gì PRD cần có. Đừng tự quyết định
> thay tôi những điểm chính; chỗ nào chưa rõ thì hỏi lại. Khi đủ thông tin, hãy
> soạn bản nháp PRD, chỉ ra những điểm còn mơ hồ và tiếp tục hỏi cho đến khi tôi
> xác nhận đồng ý. Chưa viết code trước khi tôi duyệt PRD.

## Phần 4 — Đọc một implementation plan mẫu

Teacher mở phần bằng nguyên văn lời dẫn của tác giả:

> Vậy, sau khi có PRD rồi thì làm gì? Ta sẽ tạo implementation plan.
>
> Implementation plan về căn bản sẽ viết ra những bước chi tiết để coding agent
> có thể hiện thực hoá PRD. Bạn có thể hiểu nếu PRD là bản kế hoạch tổng quan,
> thì implementation plan sẽ ghi chi tiết từng bước để thực hiện kế hoạch đó.
>
> Thông thường một implementation plan sẽ được chia ra thành nhiều giai đoạn.
> Mỗi giai đoạn sẽ có tiêu chí hoàn thành rõ ràng.
>
> Thường agent tạo PRD và Implementation plan khá tốt nên bạn chỉ cần bảo nó tạo
> rồi duyệt là được.

Teacher nói rõ đây là portfolio giả lập của Mai. Ví dụ chỉ giúp Learner nhận ra
format. Learner không phải đọc code hoặc dùng lại nội dung của Mai.

Teacher dùng một trang để đọc plan mẫu: lời dẫn đã duyệt nằm bên trái, còn plan mẫu đầy
đủ cùng tiêu chí hoàn thành nằm bên phải. Teacher không đặt câu hỏi, không kiểm
tra trí nhớ và không yêu cầu Learner giải thích chi tiết kỹ thuật. Câu hỏi chỉ
xuất hiện ở phần kiểm tra cuối bài.

Sau trang đọc plan mẫu, Course Companion có một trang prompt mẫu kèm nút
“SAO CHÉP PROMPT” để Learner tạo implementation plan từ PRD đã duyệt. Teacher dẫn
Learner dùng đúng prompt này và thay phần trong ngoặc vuông bằng đường dẫn tới
file PRD của mình:

> Dựa trên PRD đã duyệt trong [đường dẫn tới file PRD của bạn], hãy tạo
> implementation plan cho dự án này. Chỉ dùng PRD làm nguồn phạm vi; đừng tự thêm
> tính năng ngoài PRD. Chia plan thành nhiều giai đoạn nhỏ, mỗi giai đoạn ghi rõ
> việc cần làm, tiêu chí hoàn thành và cách kiểm tra. Chỗ nào PRD chưa rõ thì hỏi
> tôi thay vì tự đoán. Chưa viết code trước khi tôi duyệt implementation plan.

## Phần 5 — Thực hành: Lập kế hoạch cho portfolio

Teacher chuyển sang dự án thực hành bằng nguyên văn câu của tác giả:

> Bây giờ, chúng ta sẽ chính thức bắt tay vào tạo Portfolio.

Teacher giải thích portfolio là nơi áp dụng quy trình vừa học. Planning và PRD
là kỹ năng dùng được cho các sản phẩm khác, không phải kiến thức chỉ dành cho
portfolio.

Teacher dùng nguyên văn lời chuyển tiếp:

> Okay, không để các bạn đợi lâu nữa, bây giờ các bạn có thể qua Codex để tiếp tục thực hành rồi. Trước khi bấm chuyển sang Codex để thực hành, hãy copy prompt ở gốc trên bên phải để tẹo nữa paste vào Codex nha

Course Companion mở thẳng Practice. Teacher không hướng dẫn chọn workspace,
tạo `AGENTS.md`, tạo artifact hoặc review từng giai đoạn. Executor chịu trách
nhiệm hướng dẫn các bước này sau khi Learner mở Practice.

## Mastery và handoff

[Chỉ mở nhóm assessment của M2.3 sau khi receipt tổng hợp hợp lệ. Hỏi đúng một
câu mỗi lượt. Chỉ đưa feedback và căn cứ sau câu trả lời. Không dùng ngưỡng cố
định chưa được pilot phê duyệt.]

Khi mastery đạt, Teacher xác nhận gate kết hợp:

- năm stage receipt hợp lệ;
- bảy artifact có digest hiện tại;
- phê duyệt của Learner trên đúng phiên bản;
- mastery receipt hợp lệ.

Teacher kết thúc:

> “Gói planning của bạn đã sẵn sàng làm đầu vào cho Module 3. Module tiếp theo
> sẽ bắt đầu từ workspace chưa có ứng dụng và yêu cầu Codex đề xuất scaffold để
> bạn duyệt trước khi tạo. Chưa có công nghệ hay file ứng dụng nào được ngầm
> chọn trong Module 2.”

## Phục hồi

- Thiếu bằng chứng: quay về hàng hoặc artifact đầu tiên bị thiếu, không làm lại
  toàn bộ module.
- Artifact đổi digest: vô hiệu receipt phụ thuộc và review lại phiên bản mới.
- Thư mục portfolio bị thiếu hoặc mất quyền truy cập: dừng mọi ghi file, hiển
  thị đúng đường dẫn đã chọn và yêu cầu khôi phục hoặc chọn lại qua flow an toàn.
- Learner không chấp nhận: giữ cùng Practice run, sửa đúng điểm được nêu và tạo
  fresh evidence mới.
- Mastery chưa đạt: quay về khái niệm liên quan và cho Learner tự sửa câu trả lời
  hoặc artifact; không tự mở Module 3.

## Nguồn Teacher dùng khi giải thích

- OpenAI Prompting: <https://learn.chatgpt.com/docs/prompting>
- GOV.UK User needs: <https://www.gov.uk/service-manual/user-research/start-by-learning-user-needs>
- Microsoft Task Design Review: <https://microsoft.github.io/code-with-engineering-playbook/design/design-reviews/recipes/templates/template-task-design-review/>
- Microsoft Test Planning: <https://microsoft.github.io/code-with-engineering-playbook/automated-testing/test-planning/>
- W3C WAI Evaluating Accessibility: <https://www.w3.org/WAI/test-evaluate/>
