# Module 2 — Planning và PRD trước khi code với AI

## Phần 1 — Tại sao cần planning trước khi code với AI?

Sau khi hoàn thành module 1, hy vọng các bạn đã hiểu hơn về cách sử dụng Codex. Đầu tiên, chúng ta sẽ cùng tìm hiểu về cách planning khi sử dụng Coding agents. Nhiều bạn mới bắt đầu code với AI thường bỏ qua phần lên kế hoạch mà nhảy thẳng vào phần thực thi. Các bạn ấy nghĩ rằng mình đang tiết kiệm thời gian, nhưng thực chất các bạn đang lầm. Nếu có một kế hoạch tốt trước khi bắt đầu xây sản phẩm. Bạn sẽ tiết kiệm được biết bao thời gian debug và sửa lại từ đầu vì không đúng ý. Tin mình đi, mình đã phạm phải sai lầm này và đã phải trả giá.

Vậy, như thế nào là một kế hoạch tốt?

Không phải việc nào cũng cần planning. Nếu yêu cầu nhỏ, kết quả đã rõ và dễ làm
lại khi có lỗi, bạn có thể giao trực tiếp cho coding agent. Tuy nhiên, bạn nên
lập kế hoạch trước khi xây một sản phẩm mới hoặc xử lý công việc có nhiều quyết
định phụ thuộc nhau.

## Phần 2 — PRD là gì và dùng để làm gì?

PRD là viết tắt của Product Requirements Document, hay tài liệu yêu cầu sản
phẩm. Tài liệu này mô tả sản phẩm cần giải quyết vấn đề gì, dành cho ai và kết
quả nào phải đạt được. PRD giúp bạn và coding agent thống nhất điều cần xây
trước khi chọn cách xây.

PRD không phải bản mô tả kỹ thuật. Nó chưa quyết định framework, thư viện, cấu
trúc code hoặc tên tệp. PRD cũng không phải một prompt để AI xây toàn bộ ứng
dụng ngay lập tức.

Ví dụ, câu “Hãy tạo một ứng dụng giúp tôi theo dõi thói quen hằng ngày” mới chỉ
là một ý tưởng. Coding agent vẫn chưa biết ai sẽ dùng ứng dụng, thói quen được
ghi lại như thế nào, phiên bản đầu cần làm gì và dấu hiệu nào cho thấy sản phẩm
đã đáp ứng yêu cầu. PRD giữ những quyết định đó.

## Phần 3 — Dùng coding agent để tạo, review và duyệt PRD

Bạn không cần tự viết PRD từ một trang giấy trắng. Trước tiên, hãy cung cấp ý
tưởng và những thông tin đã biết. Sau đó, yêu cầu coding agent hỏi từng câu để
làm rõ phần còn thiếu, rồi soạn một bản nháp để bạn review.

Khi review, hãy yêu cầu agent tìm yêu cầu mơ hồ, điểm mâu thuẫn, tiêu chí chưa
thể kiểm tra và nội dung tự ý mở rộng. Bạn vẫn là người quyết định mục tiêu,
người dùng, phạm vi và tiêu chí chấp nhận. Chỉ sau khi bạn duyệt PRD, coding
agent mới nên chuyển từng yêu cầu thành các bước triển khai nhỏ có cách kiểm
tra.

## Phần 4 — Đọc một implementation plan mẫu

Vậy, sau khi có PRD rồi thì làm gì? Ta sẽ tạo implementation plan.

Implementation plan về căn bản sẽ viết ra những bước chi tiết để coding agent
có thể hiện thực hoá PRD. Bạn có thể hiểu nếu PRD là bản kế hoạch tổng quan,
thì implementation plan sẽ ghi chi tiết từng bước để thực hiện kế hoạch đó.

Thông thường một implementation plan sẽ được chia ra thành nhiều giai đoạn. Mỗi
giai đoạn sẽ có tiêu chí hoàn thành rõ ràng.

Thường agent tạo PRD và Implementation plan khá tốt nên bạn chỉ cần bảo nó tạo
rồi duyệt là được.

Plan mẫu đầy đủ nằm tại
`course/examples/module-2-portfolio-implementation-plan.md`.

## Phần 5 — Thực hành: Lập kế hoạch cho portfolio

Bây giờ, chúng ta sẽ chính thức bắt tay vào tạo Portfolio. Bạn sẽ dùng portfolio
làm dự án thực hành để áp dụng quy trình planning và PRD vừa học. Những kỹ năng
này không chỉ dành cho portfolio; bạn có thể dùng lại khi làm việc với coding
agent trên các sản phẩm khác.

Okay, không để các bạn đợi lâu nữa, bây giờ các bạn có thể qua Codex để tiếp tục thực hành rồi.

Từ đây, Executor sẽ hướng dẫn bạn chọn workspace, thiết lập quy tắc dự án và
hoàn thành từng bước của Practice. Course Companion không lặp lại các bước
thiết lập đó thành slide.

## Nguồn phương pháp

- [OpenAI — Prompting](https://learn.chatgpt.com/docs/prompting): mục tiêu, bối
  cảnh, ràng buộc, kết quả mong đợi và kiểm tra cuối cần được nói rõ cho công
  việc lớn.
- [GOV.UK — Learning about users and their needs](https://www.gov.uk/service-manual/user-research/start-by-learning-user-needs): bắt đầu từ người dùng và mục tiêu; ý kiến chưa có bằng chứng phải được coi là giả định.
- [Microsoft Engineering Playbook — Task Design Review](https://microsoft.github.io/code-with-engineering-playbook/design/design-reviews/recipes/templates/template-task-design-review/): giữ rõ vấn đề, mục tiêu, phạm vi, ngoài phạm vi, lựa chọn và câu hỏi mở.
- [Microsoft Engineering Playbook — Test planning](https://microsoft.github.io/code-with-engineering-playbook/automated-testing/test-planning/): phép kiểm tra cần xuất phát từ tiêu chí chấp nhận và có thể làm lộ điểm mơ hồ trước khi triển khai.
- [W3C WAI — Evaluating Web Accessibility](https://www.w3.org/WAI/test-evaluate/): đánh giá khả năng tiếp cận cần bắt đầu sớm, kết hợp công cụ với kiểm tra của con người.

Các nguồn trên hỗ trợ cách làm. Cấu trúc gói năm tài liệu là quyết
định chương trình cần tiếp tục được kiểm chứng qua pilot với người học.
