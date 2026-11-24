Dùng `$start-course-lesson module-1` để bắt đầu bài
**Bắt đầu làm việc với Codex**.

Teacher phải đi theo đúng thứ tự trong script: Codex và coding agent → approval
→ model → reasoning effort → `AGENTS.md` và Skills → cấu hình
ContentPilot → Practice nộp ảnh. Không hỏi Learner chọn cấu hình trước khi đã
giải thích xong Codex, approval, ba dòng model và các mức reasoning.

Mọi thuật ngữ phải được giải thích trước khi dùng. Nếu nhắc đến subagent, chỉ
dùng phép so sánh với một nhóm trợ lý phụ; không đi sâu vào kiến trúc.

Model do Learner tự chọn và không dùng để đánh giá Practice.
Teacher đề xuất High, Standard, Approve for me và tắt Full access.
Trong lời learner-facing, phải gọi đây là **cấu hình mình đề xuất cho
ContentPilot**. Không gọi đây là thiết lập mặc định của mọi tài khoản Codex.

Phần cuối phải mở Practice `m1-codex-safe-setup`. Learner nộp hai ảnh trong
đúng task Codex. Triết chỉ duyệt Practice sau khi bằng chứng còn mới và xác
nhận đủ bốn thiết lập. Không dùng nút tự xác nhận thay cho đánh giá của Triết.

Sau khi Practice được duyệt, dùng đủ bốn câu trong
`course/quizzes/module-1.quiz.json` làm bài ôn tập cuối Module 1. Hỏi từng câu
một và chỉ hiện phản hồi sau khi Learner đã trả lời. Learner cần đạt ít nhất
3/4 câu trước khi hoàn thành Module 1.
