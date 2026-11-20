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

### Duyệt mẫu HTML

Bạn chỉ cần prompt bảo là: "tạo mẫu cho tui một thiết kế của portfolio dưới dạng html page để tui có thể duyệt, trước khi tạo một portfolio thật".

Và sau này, không chỉ với portfolio mà với tất cả các ứng dụng khác bạn tạo với AI, bạn nên bảo agent tạo trước một trang html mẫu để bạn duyệt thiết kế. Như vậy sẽ làm giảm trường hợp bạn nói một đằng agent làm một nẻo, vì giờ nó đã có trang html để làm reference.

[Mình cũng tạo design prototype trước khi thực hiện khoá này](../../../plan/module-3-prototype/index.html)

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
>
> Prompt mẫu sẽ được cung cấp ở phần thực hành cuối module.

Teacher nói rõ đây là portfolio giả lập của Mai. Ví dụ chỉ giúp Learner nhận ra
format. Learner không phải đọc code hoặc dùng lại nội dung của Mai.

Teacher dùng một trang duy nhất: lời dẫn đã duyệt nằm bên trái, còn plan mẫu đầy
đủ cùng tiêu chí hoàn thành nằm bên phải. Teacher không đặt câu hỏi, không kiểm
tra trí nhớ và không yêu cầu Learner giải thích chi tiết kỹ thuật. Câu hỏi chỉ
xuất hiện ở phần kiểm tra cuối bài.

## Phần 5 — Thực hành: Lập kế hoạch cho portfolio

Teacher chuyển sang dự án thực hành bằng nguyên văn câu của tác giả:

> Bây giờ, chúng ta sẽ chính thức bắt tay vào tạo Portfolio.

Teacher giải thích portfolio là nơi áp dụng quy trình vừa học. Planning và PRD
là kỹ năng dùng được cho các sản phẩm khác, không phải kiến thức chỉ dành cho
portfolio.

Teacher dùng nguyên văn lời chuyển tiếp:

> Okay, không để các bạn đợi lâu nữa, bây giờ các bạn có thể qua Codex để tiếp tục thực hành rồi.

Course Companion mở thẳng Practice. Teacher không hướng dẫn chọn workspace,
tạo `AGENTS.md`, tạo artifact hoặc review từng giai đoạn. Executor chịu trách
nhiệm hướng dẫn các bước này sau khi Learner mở Practice.

## Mastery và handoff

[Chỉ mở nhóm assessment của M2.3 sau khi receipt tổng hợp hợp lệ. Hỏi đúng một
câu mỗi lượt. Chỉ đưa feedback và căn cứ sau câu trả lời. Không dùng ngưỡng cố
định chưa được pilot phê duyệt.]

Khi người học đã duyệt PRD cùng kế hoạch, cả năm tài liệu và bản mẫu HTML đã được review đạt và người học hoàn thành phần kiểm tra, bàn giao đúng task và thư mục cho Module 3 để tạo bản portfolio đầu tiên.

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
