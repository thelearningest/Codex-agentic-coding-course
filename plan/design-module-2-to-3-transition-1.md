---
goal: Cho người học xây bản portfolio đầu tiên, học trên sản phẩm đó và nghiệm thu trước khi phát hành
version: 2.0
date_created: 2026-11-18
last_updated: 2026-11-18
status: Planned
---

# Kế hoạch chuyển từ Module 2 sang Module 3

**Quyết định đã duyệt.** Module 2 kết thúc với năm tài liệu planning. Module 3 bắt đầu bằng việc dùng kế hoạch đã duyệt để tạo bản portfolio đầu tiên. Người học có thể yêu cầu Codex làm trong một lượt hoặc chia nhỏ theo dự án. Cuối module, họ đối chiếu website với PRD, dùng cách kiểm tra trong implementation plan và quyết định phiên bản nào sẵn sàng phát hành. Debug và cải thiện sản phẩm được áp dụng khi cần. Phần tổng kết kiến thức hiện có diễn ra sau khi Practice đạt.

## 1. Hành trình của người học

| Thời điểm | Người học làm gì | Khi nào đi tiếp |
|---|---|---|
| Đầu Module 3 | Mở Practice, tiếp tục đúng task Codex và thư mục từ Module 2. Giao agent thực hiện implementation plan, chạy website và gửi đường dẫn. Với portfolio nhỏ, agent có thể tạo cả bản đầu trong một lượt. | Người học tự mở đường dẫn và nhận ra nội dung portfolio của mình. Nếu chỉ thấy trang mẫu, trang trắng hoặc link lỗi, họ báo lại trong cùng task. |
| Quay lại bài học | Người học chọn quay lại khi đã thấy website. Course Companion lưu vị trí rồi mở trang **Mở portfolio trên máy**. Trang này hướng dẫn cách mở lại dự án trong lần làm việc sau. Agent có thể dùng npm run dev nếu phù hợp với dự án. | Đây là quyết định của người học. Nút quay lại không phụ thuộc build log, ảnh chụp, kết quả npm, AI review hoặc việc chấm hồ sơ. |
| Học trên bản đầu | Tiếp tục các trang Debug, Git, GitHub và phần tóm tắt. Người học có thể liên hệ ví dụ trong bài với sản phẩm vừa mở. | Từ cuối phần lý thuyết, tiếp tục đúng lượt Practice đang dở. |
| Cuối Module 3 | Đối chiếu bản hiện tại với PRD. Dùng các phép kiểm tra trong plan, thử hành vi quan trọng trên desktop và mobile, sửa và thử lại những điểm chưa đạt. Người học xác nhận phiên bản đem nộp. | Sau khi gói bằng chứng được review đạt, làm năm câu tổng kết hiện có. Module 4 dùng phiên bản được nghiệm thu để phát hành. |

## 2. Cách chấm Practice cuối module

| Trường hợp | Cách xử lý |
|---|---|
| Xây một lượt, website đáp ứng PRD | Có thể đạt ngay khi đủ kết quả kiểm tra bản hiện tại, quan sát thực tế và xác nhận của người học. |
| Người học hài lòng nhưng một yêu cầu chưa được kiểm tra | Chỉ ra yêu cầu còn thiếu và cách kiểm tra. Ví dụ, mở nút liên hệ trên màn hình điện thoại và xem có đến đúng nơi hay không. |
| Có lỗi ảnh hưởng đến yêu cầu trong PRD | Đối chiếu kết quả mong đợi với thực tế, sửa rồi thử lại đúng thao tác trên phiên bản sẽ nộp. |
| Người học muốn cải thiện thêm hoặc muốn luyện debug | Tính công việc thực tế vào hồ sơ khi có. Không tạo lỗi giả hoặc yêu cầu đổi giao diện chỉ để đủ điều kiện chấm. |

Review đọc kế hoạch, mã nguồn và hồ sơ của cùng task. Codex ghi lại kết quả kỹ thuật. Người học tự nêu điều đã quan sát và quyết định chấp nhận phiên bản cuối. Bỏ điều kiện tối thiểu hai phần xây, duyệt giữa các phần, một cải thiện và một lần gỡ lỗi. Giữ kiểm tra nguồn hiện tại, các yêu cầu PRD, bằng chứng trình duyệt, quyết định của người học và các nhiệm vụ tổng kết.

## 3. Ba file bằng chứng

Đề xuất triển khai là tận dụng các đường dẫn hiện có để giảm thay đổi trong việc đọc hồ sơ và bàn giao sang Module 4. Đây là lựa chọn kỹ thuật đề xuất; người học không phải tự điền ba biểu mẫu.

| File dưới evidence/module-3/ | Nội dung ở lần nộp cuối |
|---|---|
| build-log.md | Phạm vi thực hiện theo plan, phiên bản đã xây và kết quả kiểm tra kỹ thuật phù hợp. Một lượt xây là hợp lệ. |
| browser-validation.md | Đối chiếu yêu cầu PRD với kết quả thực tế, quan sát desktop/mobile và kết quả thử lại nếu có sửa. |
| learning-record.md | Ghi nhận quan sát thật và quyết định cuối của người học trong task. Có thể dẫn lại phép thử trong browser-validation.md. Chỉ ghi cải thiện hoặc điều tra lỗi khi hoạt động đó thực sự diễn ra. |

## 4. Thứ tự triển khai sau khi bắt đầu làm ứng dụng

1. **Soạn lời thoại để duyệt.** Chuẩn bị lời giao việc đầu Module 3, hướng dẫn mở lại website ở trang local hiện có và lời mời quay vào Practice ở cuối phần lý thuyết. Đồng bộ lesson, Teacher script và start prompt trong pilot-workspace/course/. Chỉnh riêng đoạn handoff còn mô tả bảy tài liệu của Module 2 về đúng hợp đồng năm tài liệu. Giữ các trang đã có, kể cả trang local và các ví dụ Debug.
2. **Hỗ trợ hai lượt dùng cùng Practice.** Trong Course Companion, cập nhật điều hướng shared và renderer, destination của completion Module 2 và luồng Practice. Bổ sung thao tác tạm rời sau khi tự xem website, lưu điểm học tiếp và kết nối lại đúng run, task, workspace khi trở về. Tạm rời khác với nộp bài. Xử lý đóng/mở ứng dụng ở cả hai lượt, giữ hiệu lực các completion đã cấp và vị trí hiện tại của người đang học.
3. **Đồng bộ cách chấm từ đầu đến cuối.** Bắt đầu từ pilot-workspace/course/practices/m3-portfolio-build.json và course-structure.json. Phiên bản hóa thay đổi hợp đồng, rà những nơi phụ thuộc phiên bản ở cả Module 3 và handoff Module 4. Đồng bộ prompt Executor, template AGENTS.md cho project mới, checklist người học, hướng dẫn ghi ba hồ sơ, bộ đọc bằng chứng, AI review và completion service. Xử lý hồ sơ đang làm dở theo cùng task/workspace, bảo toàn công việc cũ. Rà năm câu tổng kết và feedback, nhất là câu về thực hiện plan theo từng phần. Nếu câu hiện hành xem việc chia phần là bắt buộc với mọi dự án, trình sửa đúng câu đó để duyệt.
4. **Kiểm tra luồng thật qua giao diện.** Dùng profile thử riêng. Đi từ năm tài liệu Module 2 đến bản đầu, tạm rời, mở lại ứng dụng, học tiếp, quay lại cùng Practice và nộp. Kiểm tra cả trường hợp bản đầu đạt ngay, trường hợp phải sửa lỗi và trường hợp còn thiếu bằng chứng. Xác nhận các đường dẫn/lịch sử cũ hoạt động, bấm quay lại sớm không cấp completion, thay đổi bản đã duyệt cần review lại, Module 4 nhận đúng bản cuối. Chạy kiểm tra theo repository cho batch có thay đổi Practice, persistence và assessment; cập nhật ledger theo kết quả. Nghiệm thu với người học thật ghi riêng với test mô phỏng.

## 5. Tiêu chí nghiệm thu của thay đổi

- Người vừa hoàn thành Module 2 tạo và mở được portfolio trước khi học cách mở lại website.
- Người học có thể tạm rời rồi quay lại đúng công việc sau khi khởi động lại Course Companion.
- Người học có website đạt PRD, kiểm tra đủ và chấp nhận bản cuối có thể qua Practice dù xây trong một lượt, không gặp bug và không yêu cầu chỉnh sửa.
- Một website chỉ mở được nhưng chưa đáp ứng PRD hoặc thiếu quan sát thực tế vẫn nhận phản hồi đúng phần cần bổ sung.
- Hoàn thành Module 3 bàn giao một portfolio đã nghiệm thu và sẵn sàng chuyển sang bước phát hành.

Nguồn đối chiếu: [Practice Module 3 hiện hành](../pilot-workspace/course/practices/m3-portfolio-build.json), [chỉ dẫn Executor](../course-companion/electron/main/portfolio-build-instructions.ts), [thiết kế Practice v2](../docs/planning/module-3-practice-v2-design.md), [ledger của khóa học](../docs/planning/portfolio-course-implementation-plan.md). Bản plan này thay thế đề xuất cũ đặt toàn bộ Practice ở cuối Module 3. Quyết định thiết kế đã được duyệt; các thay đổi sản phẩm và lời thoại cụ thể vẫn ở bước lập kế hoạch.
