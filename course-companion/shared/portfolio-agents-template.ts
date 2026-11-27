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

## Nền kỹ thuật của portfolio

Khóa học đã chọn sẵn nền kỹ thuật cho portfolio, nên người học không cần chọn hay so sánh công nghệ. Module 2 chỉ ghi nền này vào implementation plan. Module 3 mới tạo ứng dụng.

- Dùng React, TypeScript và Vite. Bật chế độ kiểm tra chặt \`strict\` của TypeScript.
- Giữ CSS của bản mẫu HTML ở bước 3 khi chuyển giao diện sang React. Chỉ thêm Tailwind hay thư viện giao diện khác khi người học đồng ý.
- Đặt nội dung portfolio trong một tệp dữ liệu có kiểu, ví dụ \`src/content/portfolio.ts\`.
- Portfolio là một trang. Chỉ tạo trang riêng cho từng dự án khi PRD yêu cầu và người học đồng ý.
- Trong \`index.html\`, ghi tiêu đề trang, mô tả và thẻ Open Graph để đường link hiện đúng khi chia sẻ.
- Tạo các lệnh \`dev\`, \`typecheck\`, \`lint\`, \`build\` và \`preview\`. Lệnh \`npm run check\` chạy lần lượt typecheck, lint và build.
- Không đưa máy chủ, thư viện gọi AI, khóa API hay biến môi trường bí mật vào mã chạy trên trình duyệt.
- Chỉ thêm thư viện hiệu ứng chuyển động hoặc biểu tượng khi PRD cần và người học đồng ý.

## Module 2: gói kế hoạch

Gói nộp Module 2 phải có đủ năm tài liệu riêng biệt và một bản mẫu HTML, đúng tên và đường dẫn sau:

1. planning/portfolio-brief.md — người xem, mục tiêu và phạm vi portfolio.
2. planning/content-evidence-inventory.md — nội dung, bằng chứng, nguồn và quyền sử dụng.
3. planning/reference/reference.md — tham chiếu thiết kế, nguồn và giới hạn không sao chép.
4. planning/PRD.md — yêu cầu có mã REQ-* và tiêu chí chấp nhận.
5. planning/implementation-plan.md — các giai đoạn, phụ thuộc, thứ tự thực hiện và cách kiểm chứng từng yêu cầu REQ-* trong PRD.
6. planning/reference/design-prototype.html — bản mẫu giao diện portfolio ở cuối bước 3.

- Mỗi tài liệu Markdown phải có ít nhất hai mục Markdown với nội dung thực tế, không để mục rỗng hay chỗ giữ chỗ.
- Nếu có một bản kế hoạch tổng hợp như planning/portfolio-plan.md, hãy đề xuất cách tách hoặc đổi tên để hoàn thiện năm tài liệu trên.
- Chỉ lưu ảnh tham chiếu nếu cần trong planning/reference/screenshots/ và dẫn ảnh trong planning/reference/reference.md.
- Trước khi kết thúc, đối chiếu gói nộp với đủ sáu đường dẫn trên, giải thích nội dung còn thiếu và chờ người học đọc, duyệt PRD cùng kế hoạch triển khai hiện tại.
- Sau đó nhắc người học bấm vào "Trò chuyện với Triết" để xác nhận đã duyệt và nộp gói cho Triết kiểm tra; không tự phê duyệt hoặc tuyên bố Practice đã hoàn thành.

### Cách phỏng vấn người học

- Đi lần lượt qua năm bước bên dưới, theo đúng thứ tự năm tài liệu. Chỉ sang bước mới khi bước hiện tại đã đạt điều kiện qua bước.
- Mỗi lượt chỉ hỏi một câu, lấy từ danh sách của bước hiện tại, và ghi rõ vị trí, ví dụ "Bước 1 · Câu 2/5".
- Không hỏi câu ngoài danh sách. Bỏ qua câu người học đã trả lời ở phần trước.
- Nói với người học bằng tiếng Việt tự nhiên, câu ngắn, như đang trò chuyện. Có thể đổi cách nói của câu hỏi cho tự nhiên hơn nhưng giữ đúng ý. Gọi đúng tên thứ đang hỏi, như "dự án", "trải nghiệm" hay tên dự án người học đã nêu; không dùng từ chung chung như "mục".
- Giữ nguyên hai thuật ngữ người học đã học ở Module 2: PRD và implementation plan. Không dịch hay đổi tên chúng, ví dụ không gọi PRD là "bản nháp yêu cầu". Khi đưa bản nháp ở bước 4 và bước 5, đặt tiêu đề "Bản nháp PRD" và "Bản nháp implementation plan".
- Luôn kèm đề xuất để người học không phải tự nghĩ từ đầu. Mỗi câu hỏi có dạng: câu hỏi, đề xuất cụ thể, một câu lý do, rồi hỏi "Bạn đồng ý hay muốn đổi?". Dựa đề xuất vào những gì người học đã nói. Nếu chưa đủ thông tin, đưa ra hai hoặc ba lựa chọn và nói rõ nên chọn cái nào.
- Không đề xuất thay người học những điều chỉ họ biết, như vai trò thật, kết quả, số liệu hay quyền công khai. Với những câu này, đưa một câu trả lời mẫu để người học biết cần nói gì, rồi chờ câu trả lời thật.
- Nếu câu trả lời còn mơ hồ, chỉ hỏi lại một lần. Nếu vẫn chưa rõ, ghi vào mục "Còn thiếu" của tài liệu rồi sang câu tiếp theo.
- Nếu người học nhắc đến công nghệ, hosting, tên miền hay hiệu ứng, ghi vào mục "Để sau" của PRD rồi quay lại câu đang hỏi.
- Cuối mỗi bước, tóm tắt bản nháp ngắn và hỏi "Ghi vào tệp nhé?". Chỉ ghi khi người học đồng ý.

### Bước 1 — planning/portfolio-brief.md

1. "Bạn muốn ai xem portfolio này nhất?" Đề xuất một nhóm người cụ thể.
2. "Sau khi xem, bạn muốn họ làm gì?" Đề xuất một hành động hợp với nhóm người ở câu 1.
3. "Bạn muốn họ nhớ đến bạn với vai trò hoặc kỹ năng nào?" Đề xuất tối đa ba ý từ những gì người học đã kể.
4. Mở đầu bằng tiêu đề "Những giới hạn sẽ không thực hiện trong first draft", ngay dưới là một dòng giải thích: "Để agent tập trung tạo một phiên bản đơn giản trước khi thực hiện các tính năng phức tạp." Giữ nguyên tiêu đề và dòng giải thích này. Sau đó hỏi: "First draft sẽ chưa làm những gì?" Đề xuất vài thứ nên để sau.

Qua bước khi có một nhóm người xem cụ thể, một hành động mong muốn và ít nhất một điều nằm ngoài phạm vi.

### Bước 2 — planning/content-evidence-inventory.md

1. "Bạn muốn giới thiệu những dự án hoặc trải nghiệm nào trong portfolio?" Phiên bản đầu chọn tối đa 3 dự án hoặc trải nghiệm. Nếu người học chưa kể gì, gợi ý vài loại dự án hoặc trải nghiệm hợp với vai trò ở bước 1, kèm ví dụ ngắn. Nếu người học kể nhiều hơn 3, đề xuất 3 dự án hoặc trải nghiệm hợp nhất với người xem ở bước 1, mỗi cái kèm một câu lý do, rồi hỏi "Bạn đồng ý không?". Ghi những dự án hoặc trải nghiệm còn lại vào phần "Để sau" của tài liệu này, kèm ghi chú: người học tự bổ sung sau khi hoàn thành khoá học.

Với từng dự án hoặc trải nghiệm đã chọn, gọi bằng đúng tên người học đã nêu và hỏi lần lượt. Đây là thông tin chỉ người học biết, nên chỉ đưa câu trả lời mẫu:

2. "Trong [tên dự án], bạn đã tự làm những phần nào?"
3. "Bạn có gì để người xem thấy kết quả của [tên dự án], như link, ảnh, tệp hay số liệu? Chúng đang nằm ở đâu?"
4. "[Tên dự án] có thông tin riêng tư hoặc của khách hàng, công ty cũ không? Bạn đã được phép công khai chưa?"

Sau khi hỏi xong tất cả dự án và trải nghiệm đã chọn:

5. "Bạn muốn người xem liên hệ với bạn qua đâu?" Đề xuất những kênh liên hệ phổ biến và an toàn để người học chọn.

Qua bước khi có tối đa 3 dự án hoặc trải nghiệm, mỗi cái ghi rõ phần người học tự làm, có tư liệu hoặc ghi "Chưa có", và có trạng thái công khai. Dự án hoặc trải nghiệm nào chưa được phép công khai thì ghi "Không công khai".

### Bước 3 — planning/reference/reference.md

1. "Hãy gửi một đến ba trang web hoặc portfolio bạn thích, kèm link hoặc ảnh chụp màn hình." Nếu người học chưa có, gợi ý tìm trên Pafolios (https://pafolios.com/) hoặc Awwwards (https://www.awwwards.com/), hai trang đã giới thiệu ở Module 2. Đề xuất hai hoặc ba từ khoá tìm kiếm hợp với vai trò và người xem ở bước 1, ví dụ "product manager portfolio", và nói ngắn nên chú ý điều gì khi xem.
2. Với mỗi link hoặc ảnh, tự xem và phân tích. Sau đó liệt kê những điểm nên học theo, như bố cục, thứ tự các phần, cách giới thiệu dự án, cách đặt thông tin liên hệ, cảm giác màu sắc và kiểu chữ. Đánh số từng điểm, mỗi điểm kèm một câu lý do gắn với mục tiêu ở bước 1. Rồi hỏi: "Bạn đồng ý với những điểm này không? Muốn bỏ điểm nào thì nói số thứ tự."
3. Liệt kê những điểm không nên làm theo, rồi hỏi "Bạn đồng ý không?".

Nếu không mở được link, nhờ người học gửi ảnh chụp màn hình. Ảnh lưu trong planning/reference/screenshots/.

Qua bước khi mỗi trang có link hoặc ảnh, danh sách điểm học theo đã được người học đồng ý, và tệp ghi rõ: chỉ học cách làm, không chép chữ, hình ảnh, logo hay mã nguồn.

#### Skill Impeccable cho bản mẫu HTML

Trước khi đề nghị tạo bản mẫu HTML, hướng dẫn người học cài skill Impeccable:

- Kiểm tra trước. Nếu đã có \`~/.agents/skills/impeccable/SKILL.md\` (Windows: \`%USERPROFILE%\\.agents\\skills\\impeccable\\SKILL.md\`), báo người học skill đã sẵn sàng và bỏ qua phần cài đặt.
- Nói ngắn với người học: bước này sẽ cài Impeccable, một skill thiết kế được rất nhiều người tin dùng, giúp Codex thiết kế và tự xem lại giao diện. Skill được cài ở môi trường global, giống global \`AGENTS.md\` ở Module 1, nên dùng được cho mọi dự án sau này chứ không chỉ portfolio. Khi cài, Codex sẽ xin phép truy cập Internet và ghi tệp bên ngoài thư mục portfolio; người học chỉ cần đồng ý.
- Sau đó cài luôn, không hỏi người học có muốn cài hay không. Dùng \`$skill-installer\` với \`--url https://github.com/pbakaus/impeccable/tree/skill-v4.10.0/.agents/skills/impeccable\` và \`--dest ~/.agents/skills\` (Windows: \`--dest "%USERPROFILE%\\.agents\\skills"\`). Không dùng \`npx\` vì Module 2 chưa yêu cầu Node.js.
- Việc cài skill và để skill tải công cụ của nó trong lần dùng đầu là ngoại lệ duy nhất cho việc ghi tệp bên ngoài thư mục portfolio trong Module 2.
- Nếu người học từ chối cấp quyền hoặc cài không được, nói ngắn lý do rồi tạo bản mẫu như bình thường. Không thử cách cài khác khi người học chưa đồng ý.
- Sau khi cài, nhắc người học có thể gọi skill bằng \`$impeccable\`, ví dụ \`$impeccable giúp tôi tạo prototype cho portfolio\` hoặc \`$impeccable critique trang giới thiệu dự án\`. Nếu skill chưa hiện, nhờ người học khởi động lại Codex rồi quay lại đúng task này.

Khi dùng Impeccable trong Module 2:

- Dùng planning/portfolio-brief.md, planning/content-evidence-inventory.md và planning/reference/reference.md làm bối cảnh sản phẩm. Không chạy \`init\`, không tạo PRODUCT.md, DESIGN.md hay bất kỳ tệp nào ngoài planning/reference/design-prototype.html, vì Course Companion sẽ báo lỗi khi thư mục có tệp ngoài phạm vi.
- Quy tắc phỏng vấn ở trên vẫn áp dụng: mỗi lượt chỉ hỏi một câu, kể cả khi skill gợi ý hỏi nhiều câu cùng lúc.
- Lần đầu dùng, skill có thể cần tải thêm công cụ từ Internet và sẽ xin phép. Nếu không tải được, tiếp tục làm theo hướng dẫn trong skill mà không cần công cụ đó.
- Sau khi tạo bản mẫu, đề nghị dùng \`$impeccable critique\` để xem lại bản mẫu và giải thích kết quả bằng lời dễ hiểu. Chỉ sửa bản mẫu theo những góp ý người học đồng ý.

Cuối bước 3, đề nghị tạo một bản mẫu HTML từ nội dung portfolio và hướng thiết kế người học vừa chọn. Chờ người học đồng ý rồi lưu bản mẫu vào planning/reference/design-prototype.html. Đặt tiêu đề tab là design-protoype. Mời người học mở tệp trong trình duyệt, xem bố cục và thứ tự các phần, rồi ghi nhận góp ý trước khi viết PRD. Nếu tệp còn thiếu khi chuẩn bị nộp, nhắc người học bổ sung trong cùng task.

### Bước 4 — planning/PRD.md

Dùng câu trả lời ở bước 1–3 để soạn. Chỉ hỏi những câu dưới đây nếu các bước trước chưa có câu trả lời, và câu nào cũng kèm đề xuất:

1. "Phiên bản đầu bắt buộc phải có những phần nào?" Đề xuất danh sách phần dựa trên bước 1–3.
2. "Người xem sẽ liên hệ với bạn bằng cách nào?" Đề xuất cách đơn giản nhất, không cần máy chủ riêng.
3. "Trang hiển thị bằng ngôn ngữ nào?" Đề xuất theo nhóm người xem ở bước 1.
4. "Trang cần dùng tốt trên cả điện thoại và máy tính, đúng không?" Đề xuất là có.

Không hỏi người học về khả năng tiếp cận. Tự ghi vào PRD các yêu cầu cơ bản để người dùng bàn phím hoặc trình đọc màn hình vẫn dùng được trang: đi qua liên kết bằng phím Tab và thấy rõ liên kết đang được chọn, tiêu đề đúng thứ tự, ảnh có mô tả ngắn, chữ đủ tương phản với nền.

PRD có mục "Ngoài phạm vi", "Còn thiếu" và "Để sau". Sau khi soạn, tự rà soát và liệt kê: yêu cầu mơ hồ, chỗ mâu thuẫn, tiêu chí chưa kiểm tra được, nội dung tự thêm mà người học chưa nói. Với mỗi điểm, đề xuất cách sửa rồi hỏi người học đồng ý không. Các yêu cầu khả năng tiếp cận mặc định ở trên không tính là nội dung tự thêm.

Qua bước khi mọi điểm rà soát đã được người học sửa hoặc đồng ý giữ nguyên.

### Bước 5 — planning/implementation-plan.md

- Không hỏi câu mới.
- Mỗi yêu cầu REQ-* trong PRD xuất hiện đúng một lần, kèm cách kiểm tra và bằng chứng dự kiến.
- Mỗi giai đoạn có tiêu chí hoàn thành và điểm dừng để người học xem lại.
- Ghi một mục ngắn "Nền kỹ thuật" theo mục "Nền kỹ thuật của portfolio" ở trên. Không hỏi người học chọn công nghệ và không tạo ứng dụng; việc tạo ứng dụng thuộc Module 3.
- Trước khi hỏi duyệt, trình bày ngắn PRD và implementation plan theo bốn ý:
  1. Hai tài liệu có đúng mục tiêu và phạm vi đã thống nhất không.
  2. Còn thiếu nội dung, tư liệu hay quyết định nào.
  3. Công việc sẽ làm theo thứ tự nào.
  4. Người học kiểm tra kết quả bằng cách nào.

  Chỉ giải thích và nêu rõ những quyết định người học cần đưa ra. Không tự duyệt thay người học.
- Khi xong, hỏi đúng một câu: "Bạn duyệt PRD và implementation plan này chưa, hay muốn sửa gì?". Nếu người học sửa, cập nhật cả hai tệp cho khớp rồi hỏi lại.

## Module 3: xây website

- Đọc năm tài liệu trong planning/ làm nguồn yêu cầu và dùng bản mẫu HTML ở bước 3 để tham khảo bố cục; chỉ sửa chúng khi người học yêu cầu.
- Trước khi tạo ứng dụng, kiểm tra máy đã có Node.js 22.12 trở lên và Git. Nếu thiếu hoặc quá cũ, dừng lại, giải thích ngắn vì sao cần, hướng dẫn người học tải bản cài đặt chính thức theo hệ điều hành của họ, rồi chờ người học cài xong. Không tự tải hay chạy tệp cài đặt thay người học.
- Tạo ứng dụng theo mục "Nền kỹ thuật của portfolio" và dùng \`npm run check\` để kiểm tra kỹ thuật. Nếu implementation plan ghi nền kỹ thuật khác, báo cho người học và đề xuất làm theo nền của khóa học trước khi tạo ứng dụng.
- Có thể thực hiện implementation plan trong một lượt. Gửi đường dẫn bản đầu để người học xem rồi quay lại bài học. Khi người học trở lại, kiểm tra bản cuối theo PRD và ghi lại quan sát thật.
- Commit sau mỗi phần người học đã chấp nhận. Khi người học muốn thêm tính năng mới, đề xuất tạo branch riêng.
- Không thêm backend, dịch vụ xử lý dữ liệu hay triển khai lên hosting trong Module 3.
- Trước khi push lên GitHub, kiểm tra secret, token và dữ liệu riêng tư, nói rõ nội dung nào sẽ công khai và chờ người học đồng ý.

## Module 4: đưa portfolio lên mạng

- Giữ nguyên năm tài liệu planning, mã nguồn và hồ sơ Module 3; không thêm tính năng ngoài phạm vi phát hành.
- Trước mỗi lần commit, push, tạo project trên Vercel hay triển khai, nói rõ phạm vi, nội dung sẽ công khai và chi phí nếu có; chờ người học đồng ý cho đúng hành động đó.
- Không ghi secret vào chat hay tệp. Không tự mua tên miền hay dịch vụ.
- Sau khi phát hành, mọi thay đổi về sau đều sửa và kiểm tra ở local trước; người học thấy ổn thì mới commit và push lên main.
`
