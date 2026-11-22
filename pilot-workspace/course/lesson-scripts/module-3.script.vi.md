# Kịch bản Teacher — Module 3: Bắt đầu tạo portfolio

## Hợp đồng điều phối

Tiếp tục task Codex từ Module 2 và yêu cầu agent thực hiện implementation plan đã duyệt. Khi agent gửi đường dẫn, mở website. Khi thấy nội dung portfolio của mình, chọn **Quay lại bài học** trong cửa sổ Triết. Sau khi người học quay lại, mở trang **Mở portfolio trên máy**, tiếp tục phần Debug, Git và GitHub, trang chốt, lượt Practice cuối và năm câu hỏi tổng kết.

Trong phần giải thích, Teacher không chèn câu hỏi kiểm tra giữa các trang. Người học chỉ trả lời câu hỏi ở cuối bài.

Teacher không yêu cầu người học đọc code hoặc diff. Khi cần đánh giá kết quả, Teacher hướng người học đến hành vi có thể quan sát, phần giải thích của Codex và kết quả kiểm tra hiện tại.

## Mở portfolio trên máy

Teacher dùng nguyên văn phần **Mở portfolio trên máy** trong lesson trước phần Debug.

## Debug cùng coding agent

Teacher dùng nguyên văn nội dung ba trang debug trong lesson.

- Với lỗi nhìn thấy trên màn hình, người học gửi ảnh cùng thao tác vừa thực hiện, kết quả mong đợi và kết quả thực tế.
- Nếu ảnh chưa đủ để xác định nguyên nhân, người học yêu cầu agent thêm log, tái hiện lỗi và đọc thông tin trong terminal.
- Nếu lỗi vẫn quay lại, người học yêu cầu agent tạm dừng, nêu các nguyên nhân có thể và kiểm tra từng nguyên nhân bằng bằng chứng.

Teacher không biến phần này thành bài đọc log hoặc bài học lập trình. Coding agent thực hiện việc điều tra kỹ thuật.

## Git và GitHub

Teacher dạy từng khái niệm theo đúng thứ tự: Git, GitHub, commit, push, branch.

Teacher giải thích mục đích và hệ quả, không yêu cầu người học ghi nhớ câu lệnh. Khi nói về push, Teacher nhắc rằng đây là hành động đưa commit lên GitHub và không tự động xảy ra sau mỗi giai đoạn.

## Trang chốt trước Practice

Teacher dùng nguyên văn phần **Tóm lại** trong lesson. Không thêm nội dung về implementation plan vào trang này.

## Practice

1. Mở lại first draft của website bạn đã tạo ở đầu module
2. Thử website trên máy tính, đối chiếu với PRD và bản mẫu giao diện để tìm lỗi thiết kế.
3. Áp dụng quy tắc đã được dạy để sửa lỗi nếu có. Không có lỗi nào thì có thể bỏ qua phần này
4. Khi hài lòng, nhờ agent tạo commit cho phiên bản này rồi nộp để teacher agent duyệt.

Khi hài lòng với phiên bản hiện tại, bạn có thể chấp nhận website và nộp bài cho Triết duyệt. Sau khi đạt, bạn làm năm câu tổng kết.

Codex duy trì build-log.md, learning-record.md và browser-validation.md dưới evidence/module-3/. Người học sở hữu quan sát, giải thích và quyết định; Codex ghi phần kỹ thuật. Teacher Triết không mở chat song song, không viết hồ sơ hoặc trả lời thay người học.

Người học xem website rồi chọn **Chấp nhận website và nộp bài**. Course Companion kiểm tra hồ sơ, mã nguồn hiện tại và xác nhận của người học; AI đối chiếu nội dung với kế hoạch và cuộc trò chuyện đúng task. Chỉ mở tổng kết khi review đạt. Nếu thiếu hoặc cũ, chỉ ra phần cần bổ sung và tiếp tục cùng task; không bỏ qua bằng chứng.

## Câu hỏi tổng kết

Sau khi Practice đạt và người học đã publish repo lên GitHub, Teacher đưa năm câu hỏi trong `course/quizzes/module-3.quiz.json`, từng câu một. Teacher chỉ hiện lời giải sau khi người học đã trả lời.

Sau câu thứ năm, Course Companion đối chiếu kết quả câu hỏi với receipt Practice hiện tại trước khi đánh dấu Module 3 hoàn thành.

## Điểm dừng trước tổng kết

Teacher dùng nguyên văn lời nhắc cuối bài trong lesson:

Trước khi kết thúc bài học, bạn hãy nhờ agent publish repo của bạn lên github. Sau khi hoàn thành, chúng ta sẽ cùng làm một vài câu hỏi để ôn tập nhé.
