# Module 3 — Bản thiết kế nội dung đang soạn

- **Trạng thái:** Đã được chủ sở hữu duyệt đầy đủ
- **Phạm vi:** Nội dung Module 3 dành cho người học
- **Triển khai vào Course Companion:** Đã triển khai; còn chờ chạy lại Electron smoke sau khi giới hạn sử dụng của nền tảng được gỡ
- **Mức duyệt:** Nội dung giảng dạy, hình minh hoạ, trải nghiệm Practice và năm câu hỏi tổng kết đã được chủ sở hữu duyệt
- **Nhánh làm việc:** `practice-disabled-content-development`

Tài liệu này lưu lại toàn bộ nội dung Module 3 đã được duyệt để việc triển khai không phụ thuộc vào lịch sử hội thoại. Tài liệu không thay thế cổng nghiệm thu trong kế hoạch triển khai toàn khóa học.

**Cập nhật ngày 18/11/2026.** Các phần bên dưới lưu lại thiết kế ban đầu. Trong luồng hiện hành, người học mở lại task từ Module 2 để tạo và xem portfolio, rồi quay lại trang “Mở portfolio trên máy”. Cuối Module 3, họ thử các yêu cầu trong PRD theo implementation plan và xác nhận phiên bản sẽ phát hành. Bản đầu có thể đạt ngay. Xem [kế hoạch triển khai](portfolio-course-implementation-plan.md#module-3-first-build-and-final-review-18-november-2026) để đối chiếu tiêu chí và kết quả kiểm tra.

## 1. Mục đích của Module 3

### Câu mở đầu đã duyệt nguyên văn

> Kết thúc module 2, chúng ta đã có một PRD và một implementation plan. Trong module 3, chúng ta sẽ cùng hiện thực hoá nó.
>
> Chúng ta sẽ thực hiện từng đoạn một của implementation plan, và kiểm tra lại sau mỗi giai đoạn để chắc chắn rằng chúng ta đang đi đúng hướng. Cách này dù lâu nhưng sẽ đảm bảo về sau ta ít bị mắc lỗi hơn

Module 3 giúp người học chuyển từ một implementation plan đã được duyệt sang một sản phẩm hoạt động được. Người học không giao toàn bộ sản phẩm cho agent trong một prompt lớn. Thay vào đó, họ cùng agent thực hiện từng giai đoạn nhỏ của plan.

Cuối mỗi giai đoạn, agent chạy các kiểm tra phù hợp và trình bày kết quả bằng ngôn ngữ dễ hiểu. Người học xem hành vi thực tế của sản phẩm, đối chiếu với plan rồi mới quyết định có chuyển sang giai đoạn tiếp theo hay không.

Cách làm này có thể lâu hơn việc yêu cầu agent tạo toàn bộ sản phẩm trong một lần. Đổi lại, người học dễ phát hiện khi sản phẩm đi sai hướng, giữ lại những phần đã làm đúng và có nhiều quyền kiểm soát hơn đối với kết quả cuối cùng.

Module này cũng dạy người học cách xử lý lỗi cùng agent và dùng Git như một lớp bảo vệ trong quá trình xây dựng. Portfolio chỉ là sản phẩm thực hành; kỹ năng có thể chuyển sang dự án khác là biết giao việc theo từng phần, kiểm tra kết quả, điều tra lỗi và quay lại một phiên bản ổn định khi cần.

## 2. Nguyên tắc thiết kế đã thống nhất

1. Giới thiệu một khái niệm quan trọng tại một thời điểm; không cần vội.
2. Không giả định người học biết lập trình, terminal, Git, GitHub hoặc repository.
3. Người học đánh giá kết quả qua hành vi quan sát được, ảnh chụp màn hình và phần giải thích dễ hiểu. Không bắt họ đọc code hoặc diff.
4. Khi thực hiện plan, chia sản phẩm thành nhiều giai đoạn nhỏ. Chỉ chuyển sang giai đoạn sau khi giai đoạn hiện tại đã được kiểm tra.
5. Agent thực hiện thao tác kỹ thuật. Người học cần hiểu mục đích và hệ quả để có thể quyết định bước tiếp theo, nhưng không phải ghi nhớ câu lệnh.
6. Tất cả câu hỏi dành cho người học được đặt ở cuối bài, không chen câu hỏi sau từng trang giải thích.
7. Nội dung được bàn và duyệt hết trước khi chỉnh sửa các trang Module 3 trong Course Companion.

## 3. Cấu trúc nội dung hiện tại

Module 3 được chia thành hai phần lớn:

1. **Debug cùng agent khi sản phẩm gặp lỗi.**
2. **Dùng Git và GitHub để lưu phiên bản, khôi phục và thử nghiệm an toàn.**

Sau phần mở đầu, debugging được giới thiệu như một phần khó tránh khỏi trong quá trình xây sản phẩm. Git và GitHub xuất hiện sau phần debugging để giúp người học lưu phiên bản, khôi phục và thử nghiệm an toàn. Các câu hỏi tổng kết sẽ được thiết kế sau cùng.

## 4. Debug cùng agent

### Câu mở đầu đã duyệt nguyên văn

> Okay, bây giờ bạn đã có một implementation plan và bắt đầu thực hiện nó. Đến giai đoạn này, có một điều mình chắc chắn bạn sẽ không thể tránh khỏi. Đó chính là gặp bug (lỗi phần mềm). Hiện tại coding agent chưa phát triển đến mức làm hoàn hảo mọi yêu cầu của bạn mà không có tí lỗi nào.
>
> Thực ra hồi mới bắt đầu code với Coding agents, đâu đó tầm 40% thời gian mình dành để lên kế hoạch và xây sản phẩm thôi, 60% thời gian còn lại mình dành cho debugging (khắc phục lỗi). Thực ra hoàn thành tốt giai đoạn planning và implementation plan đã giúp bạn giảm khá khá bugs rồi. Nhưng vẫn khó tránh khỏi việc bạn sẽ gặp bug trong quá trình xây sản phẩm.
>
> Vậy khi gặp bug thì xử lý thế nào?

### Trang 1 — Khi lỗi xuất hiện trên màn hình

> Khi gặp một bug có thể nhìn thấy trên màn hình, hãy chụp lại bug đó và gửi ảnh cho coding agent.
>
> Đừng chỉ gửi ảnh. Hãy nói thêm bạn đang làm gì, bạn mong đợi điều gì và kết quả thực tế ra sao. Từ những thông tin này, agent có thể kiểm tra code, tìm nguyên nhân và giải thích lỗi bằng ngôn ngữ dễ hiểu trước khi sửa.
>
> Sau khi agent sửa xong, hãy thực hiện lại đúng thao tác đã gây lỗi. Nếu lỗi không còn xuất hiện, chúng ta có thể tiếp tục.

Ví dụ prompt được đặt trực tiếp trong một hình minh hoạ để người học thấy cách gửi ảnh lỗi cùng phần mô tả:

> Tôi đang kiểm tra phần giới thiệu trên website portfolio. Tôi mong đợi nút “Xem dự án” nằm bên dưới phần mô tả. Hiện tại nút đang che lên nội dung, như trong ảnh đính kèm. Hãy kiểm tra nguyên nhân, giải thích ngắn gọn và sửa lỗi này. Sau khi sửa, hãy kiểm tra lại giao diện ở kích thước 1440 × 900 và 390 × 844.

![Ví dụ gửi ảnh chụp và prompt mô tả lỗi cho coding agent](assets/module-3/visible-error-prompt-example.png)

Dưới hình minh hoạ, Teacher nói:

> Trên đây là ví dụ của một prompt bạn có thể áp dụng. Trong trường hợp này, lỗi có thể thấy ngay ở trên trang web, nên bạn chỉ việc cắt screenshot và nhắn prompt như trên là được.

### Trang 2 — Khi ảnh chụp chưa cho thấy nguyên nhân

> Đôi khi ảnh chụp chỉ cho thấy kết quả bị sai, nhưng chưa cho biết vì sao lỗi xảy ra.
>
> Nếu bạn đã gửi ảnh lỗi mà agent vẫn chưa sửa được, bạn có thể yêu cầu agent thêm log, tức là thông tin ghi lại những hoạt động diễn ra khi ứng dụng đang chạy. Log có thể giúp agent có thêm thông tin về nguyên nhân gây ra lỗi, thay vì chỉ đoán mò

> **Prompt mẫu:** “Hãy thêm log cần thiết để tìm nguyên nhân lỗi. Nếu cần tôi thực hiện lại thao tác gây lỗi, hãy hướng dẫn tôi. Sau khi sửa, hãy kiểm tra lại và xóa những log tạm không còn cần thiết.”

### Trang 3 — Khi lỗi vẫn quay lại

> Nếu lỗi vẫn quay lại sau nhiều lần sửa, hãy yêu cầu AI tạm dừng và liệt kê những nguyên nhân có thể khiến lỗi xảy ra. Cách này giúp quá trình điều tra có hệ thống hơn và thường tìm ra nguyên nhân gốc, thay vì chỉ vá những biểu hiện trước mắt.
>
> Sau đó, hãy yêu cầu coding agent kiểm tra từng nguyên nhân và dựa vào bằng chứng để xác định nguyên nhân nào thực sự gây ra lỗi.

### Hướng hình ảnh đã duyệt

Module 3 dùng ảnh do khóa học tự tạo thay vì sử dụng lại ảnh tìm thấy trên Internet. Cách này giúp tình huống trong ảnh khớp với nội dung bài học, không chứa thông tin cá nhân và không phụ thuộc vào quyền sử dụng của nguồn bên ngoài.

Ảnh cho lỗi nhìn thấy trên màn hình sử dụng một lỗi bố cục rõ ràng: nút “Xem dự án” che lên phần giới thiệu của portfolio. Một ảnh tiếp theo đặt tình huống này bên cạnh prompt hoàn chỉnh mà người học có thể gửi cho coding agent.

![Hình minh hoạ một lỗi có thể nhìn thấy trên màn hình](assets/module-3/visible-screen-error-example.png)

Ảnh cho lỗi trong log chỉ làm nổi bật một thông báo ngắn trong Terminal. Người học không cần hiểu toàn bộ nội dung kỹ thuật trong ảnh. Họ chỉ cần nhận ra đây là thông tin có thể gửi cho agent để điều tra.

![Hình minh hoạ lỗi xuất hiện trong log ở Terminal](assets/module-3/terminal-log-error-example.png)

Hai ảnh đầu tiên và các nhãn tiếng Việt trong ảnh đã được chủ sở hữu duyệt. Ảnh minh hoạ prompt được bổ sung theo yêu cầu mới nhất của chủ sở hữu. Các ảnh chỉ được đưa vào Course Companion sau khi toàn bộ thiết kế Module 3 được duyệt.

### Quy trình dành cho người mới

1. Nếu nhìn thấy lỗi trên màn hình, người học chụp lại màn hình và gửi cho agent để agent điều tra, giải thích rồi sửa.
2. Nếu vẫn chưa tìm được lỗi, yêu cầu agent thêm log và quan sát thông tin xuất hiện trong terminal.
3. Nếu lỗi tiếp tục quay lại sau nhiều lần sửa, yêu cầu agent tạm dừng và liệt kê các nguyên nhân có thể xảy ra.

Quy trình này phải được trình bày như một cách làm thực tế, dễ nhớ. Không biến phần mở đầu thành một quy trình điều tra kỹ thuật phức tạp.

### Điều người học cần hiểu

Agent có thể thực hiện phần lớn việc debug, nhưng người học vẫn cần biết lỗi nhìn thấy là gì, agent đã dựa vào thông tin nào và kết quả sau khi sửa có thực sự giải quyết lỗi hay không.

## 5. Git và GitHub

Git và GitHub sẽ có một cụm trang riêng. Nội dung không bị nhét vào một trang dài.

Cụm năm trang này nằm sau phần debug cùng agent.

### Thứ tự trang đã thống nhất

| Trang | Chủ đề | Trạng thái nội dung |
| --- | --- | --- |
| 1 | Vì sao cần Git? | Đã duyệt |
| 2 | Git khác GitHub như thế nào? | Đã duyệt |
| 3 | Commit: lưu một phiên bản của dự án | Đã duyệt |
| 4 | Push: đưa commit lên GitHub | Đã duyệt |
| 5 | Branch: thử nghiệm mà không ảnh hưởng phiên bản ổn định | Đã duyệt |

Commit phải được giới thiệu trước push.

### Trang 1 — Vì sao cần Git?

> Trong quá trình debugging, có thể bạn sẽ cần phải khôi phục phiên bản trước khi có lỗi, để xem lỗi nằm ở đâu. Đó là lúc Git có tác dụng
>
> Git là một hệ thống quản lý phiên bản phân tán. Hệ thống quản lý phiên bản giúp ghi lại những thay đổi của dự án theo thời gian và cho phép quay lại một phiên bản trước đó khi cần.
>
> Repository, hay kho lưu trữ dự án, là nơi Git quản lý các tệp của dự án cùng lịch sử thay đổi của chúng.
>
> “Phân tán” có nghĩa là repository trên máy tính của bạn không chỉ giữ phiên bản mới nhất, mà còn có lịch sử của dự án. Bạn có thể thấy được tất cả phiên bản cũ mà bạn từng làm, cũng như các phiên bản mà hiện tại bạn đang phát triển.

Trang này chỉ giới thiệu mục đích của Git, chưa dạy câu lệnh.

### Trang 2 — Git khác GitHub như thế nào?

> Git và GitHub thường được nhắc đến cùng nhau, nhưng thực ra chúng là hai khái niệm khác nhau.
>
> Git là một hệ thống hoạt động trên máy tính của bạn. Git theo dõi các tệp trong repository và lưu lại lịch sử thay đổi của chúng. Bạn có thể dùng Git mà không cần kết nối với GitHub.
>
> GitHub là một nền tảng trực tuyến. Bạn có thể đưa repository từ máy tính lên GitHub để lưu thêm một bản trên mạng. Sau đó, bạn có thể truy cập dự án từ máy khác hoặc chia sẻ với người khác.
>
> GitHub cũng cung cấp các công cụ giúp mọi người cùng thảo luận và quản lý công việc.

### Trang 3 — Commit: lưu một phiên bản của dự án

Nội dung và ảnh minh họa dưới đây đã được duyệt.

Bây giờ, mình sẽ giới thiệu thêm một số khái niệm để bạn hiểu thêm về cách Git hoạt động.

Đầu tiên là Commit.

Về căn bản, Commit là một phiên bản của dự án mà bạn đã lưu lại tại một thời điểm cụ thể. Giả dụ sau khi bạn sửa xong hiệu ứng animation của portfolio thấy đẹp quá nên bạn muốn lưu nó lại để sau này nếu lỡ phá code thì vẫn tìm lại phiên bản cũ được. Commit sẽ giúp bạn làm điều đó.

Hình ở góc bên phải màn hình chính là git tree, biểu đồ để minh hoạ lịch sử của dự án. Các bạn có thể thấy mỗi chấm là một commit, và nhiều chấm nối lại với nhau tạo thành lịch sử phát triển dự án.

Các bạn nên tạo commit ngay sau mỗi thay đổi lớn trong dự án, hoặc thay đổi nào mà bạn thấy thích, để nếu lỡ làm hỏng code thì vẫn tìm lại được. Bạn chỉ cần bảo agents là "commit all the current changes with appropriate messages" là được.

![Ví dụ về nhiều commit nối tiếp nhau trong lịch sử Git](assets/module-3/commit-history-example.png)

Chú thích đi cùng ảnh:

> Trong hình, mỗi dòng đại diện cho một **commit** — tức một phiên bản của dự án đã được lưu lại.

### Trang 4 — Push: đưa commit lên GitHub

Trang này nối trực tiếp với commit đã được tạo trên máy tính.

Khi bạn muốn chuyển một commit từ môi trường máy tính của bạn lên GitHub, bạn sẽ sử dụng lệnh 'git push' (cụ thể như nào thì bạn có thể nhờ agent làm). Sau khi push thành công, lịch sử commit của bạn cũng sẽ được lưu trên github và bạn có thể chia sẻ nó cho người khác.

### Trang 5 — Branch: thử nghiệm mà không ảnh hưởng phiên bản ổn định

Nội dung dưới đây đã được duyệt:

Bây giờ, giả sử bạn đang phát triển một tính năng mới. Bạn chưa chắc mình có muốn đưa tính năng đó vào sản phẩm hay không, nhưng vẫn muốn thử nghiệm thêm.

Bạn không nên thử trực tiếp trên phiên bản đang hoạt động ổn định. Những thay đổi chưa hoàn thiện có thể làm hỏng phần đang hoạt động tốt.

Đây là lúc bạn có thể dùng branch. Branch là một hướng phát triển riêng trong cùng repository. Nó cho phép bạn thử nghiệm tính năng mới mà chưa làm thay đổi phiên bản ổn định.

Sau khi thử nghiệm, bạn xem kết quả rồi quyết định có đưa tính năng vào phiên bản ổn định hay không. Agent sẽ thực hiện phần kỹ thuật sau khi bạn lựa chọn.

### Trang chốt trước khi Practice

Nội dung dưới đây đã được duyệt:

4 điều cần nhớ trước khi bắt đầu Practice:

- Khi debug, đa số bạn chỉ cần chụp screenshot và mô tả kỹ lỗi của bạn cho agent là được. Nếu vẫn không được thì bảo agent add log vào terminal để xem lỗi là gì, paste cái log đó vào coding agent và bảo nó sửa lại lần nữa
- Bạn nên bảo agent hãy commit sau mỗi quyết định lớn, để sau này bạn sẽ dễ quay lại phiên bản cũ hơn nếu gặp bug.
- Mỗi khi muốn phát triển một tính năng mới, hãy tạo một branch mới để lỡ agent có quậy thì cũng không ảnh hưởng đến tính năng hiện tại. Bạn chỉ cần bảo agent tạo branch là nó sẽ tự động hướng dẫn cho bạn
- Bạn có thể tạo một tài khoản github rồi bảo agent push code hiện tại của bạn lên đó nếu bạn muốn hợp tác với một người khác

## 6. Practice

### Bản sửa đã được chủ sở hữu duyệt — 13 September 2026

Phần Practice v2 thay thế yêu cầu và cách nộp của bản trước trong mục này.
Thiết kế triển khai: [Module 3 Practice v2](module-3-practice-v2-design.md).
Các trang lý thuyết và năm câu hỏi tổng kết giữ nguyên.

Người học tiếp tục task Module 2 và xây các phần theo PRD cùng implementation
plan đã duyệt. Họ tự xem kết quả, chấp nhận hoặc yêu cầu sửa trước khi Codex đi
tiếp. Không bắt buộc bốn phần xây cố định.

Một cải thiện do người học đề xuất và một lần gỡ lỗi có bằng chứng trong lúc
xây được tính, theo bất kỳ thứ tự nào. Không bắt thêm tính năng. Nếu chưa có
lỗi thật, chỉ dùng lỗi thực hành nhỏ sau khi người học đồng ý; phải loại bỏ và
kiểm tra lại trước khi nộp.

Codex duy trì ba hồ sơ hỗ trợ: build-log.md, learning-record.md và
browser-validation.md dưới evidence/module-3/. Người học sở hữu quan sát,
giải thích và quyết định; không cần tự điền digest hoặc duyệt lại từng tệp.

Người học xem website rồi chọn **Chấp nhận website và nộp bài**. Course
Companion đọc tệp, kiểm tra phiên bản nguồn và xác nhận của người học. AI đọc
nội dung hồ sơ cùng năm tài liệu planning và bằng chứng từ đúng task để đánh
giá. Nếu thiếu hoặc cũ, tiếp tục cùng task và nộp lại. Teacher không mở chat
song song; gợi ý và review không thay lời quyết định của người học.

V1 được giữ làm lịch sử; chỉ review mới theo v2 mới có thể hoàn thành v2.
Sau khi Practice đạt, người học vẫn phải làm năm câu tổng kết hiện có.

## 7. Viewport kiểm tra đã chốt

- **Desktop:** `1440 × 900`
- **Mobile:** `390 × 844`

Cùng một cặp viewport được dùng trong hướng dẫn, ảnh chụp và kiểm tra giao diện của Module 3. Ở cả hai kích thước, website không được cuộn ngang và các nội dung chính phải đọc được. Các giá trị này có thể được điều chỉnh sau khi có bằng chứng từ pilot, nhưng không thay đổi giữa chừng trong cùng một phiên bản khóa học.

## 8. Câu hỏi tổng kết cuối bài

Các câu hỏi được đặt cùng nhau ở cuối bài. Cả năm câu dưới đây đã được chủ sở hữu duyệt.

Quy tắc thiết kế câu hỏi:

- Các lựa chọn sai phải hợp lý và gần với đáp án đúng. Trong mỗi câu, ít nhất hai lựa chọn phải đủ gần nhau để người học cần phân biệt bằng nội dung đã học.
- Vị trí đáp án đúng được thay đổi giữa các câu, không lặp một vị trí theo khuôn.
- Độ khó đến từ việc phân biệt các cách xử lý gần giống nhau, không đến từ câu chữ mơ hồ hoặc mẹo ngôn ngữ.

### Câu 1 — Thực hiện plan theo từng phần

**Câu hỏi**

> Coding agent vừa hoàn thành một phần của implementation plan. Bạn nên làm gì trước khi cho agent chuyển sang phần tiếp theo?

**Lựa chọn**

1. Chuyển ngay vì implementation plan đã được duyệt từ trước.
2. Xem kết quả thực tế, đọc phần giải thích và kết quả kiểm tra của agent, rồi chấp nhận hoặc yêu cầu chỉnh sửa.
3. Yêu cầu agent hoàn thành luôn toàn bộ phần còn lại để tiết kiệm thời gian.
4. Chỉ tạo một commit mà không cần mở website.

**Đáp án:** 2

**Giải thích sau khi trả lời**

> Implementation plan định hướng công việc, nhưng mỗi phần vẫn cần được kiểm tra. Bạn chỉ nên chuyển sang phần tiếp theo sau khi đã xem kết quả thực tế và xác nhận phần hiện tại đi đúng hướng.

### Câu 2 — Báo lỗi bằng ảnh chụp

**Câu hỏi**

> Bạn nhìn thấy nút **Xem dự án** đang che lên phần giới thiệu của website. Thông tin nào nên được gửi cho coding agent để agent điều tra lỗi?

**Lựa chọn**

1. Gửi ảnh chụp, mô tả thao tác vừa thực hiện, rồi chỉ rõ phần giao diện bạn muốn agent sửa.
2. Gửi ảnh chụp, mô tả kết quả mong đợi, rồi yêu cầu agent kiểm tra phần giao diện đang bị che.
3. Gửi ảnh chụp, mô tả thao tác vừa thực hiện, kết quả mong đợi và kết quả thực tế.
4. Gửi ảnh chụp, mô tả kết quả thực tế, rồi liệt kê các tệp agent vừa thay đổi.

**Đáp án:** 3

**Giải thích sau khi trả lời**

> Các lựa chọn 1 và 2 cung cấp một phần bối cảnh, nhưng vẫn thiếu thông tin cần thiết để tái hiện hoặc xác định chính xác lỗi. Khi có ảnh chụp, thao tác vừa thực hiện, kết quả mong đợi và kết quả thực tế, coding agent sẽ có đủ bằng chứng để bắt đầu điều tra.

### Câu 3 — Dùng log để tìm nguyên nhân

**Câu hỏi**

> Bạn đã gửi ảnh lỗi nhưng coding agent vẫn chưa xác định được nguyên nhân. Bước tiếp theo phù hợp nhất là gì?

**Lựa chọn**

1. Yêu cầu agent xem lại ảnh, chọn nguyên nhân có khả năng nhất rồi sửa thử để kiểm tra.
2. Yêu cầu agent thêm log, tái hiện lỗi rồi sửa phần code nằm gần dòng log xuất hiện cuối cùng.
3. Yêu cầu agent liệt kê các nguyên nhân có thể xảy ra, chọn một nguyên nhân rồi sửa trước.
4. Yêu cầu agent thêm log cần thiết, tái hiện lỗi và dùng thông tin trong terminal để xác định nguyên nhân trước khi sửa.

**Đáp án:** 4

**Giải thích sau khi trả lời**

> Lựa chọn 2 cũng sử dụng log, nhưng dòng code nằm gần một thông báo chưa chắc là nguyên nhân gây lỗi. Coding agent cần tái hiện lỗi và dùng thông tin trong terminal làm bằng chứng trước khi sửa. Sau khi lỗi đã được khắc phục, bạn có thể yêu cầu agent xoá những đoạn log không còn cần thiết.

### Câu 4 — Khi lỗi liên tục quay lại

**Câu hỏi**

> Coding agent đã sửa cùng một lỗi nhiều lần nhưng lỗi vẫn quay lại. Bạn nên yêu cầu agent làm gì?

**Lựa chọn**

1. Tạm dừng sửa, nêu các nguyên nhân có thể rồi dùng log và việc tái hiện lỗi để kiểm tra nguyên nhân nào có bằng chứng.
2. Tạm dừng sửa, chọn nguyên nhân có vẻ hợp lý nhất rồi sửa thử; nếu chưa được thì chuyển sang nguyên nhân khác.
3. Khôi phục commit ổn định gần nhất và bỏ qua tính năng đang gây lỗi.
4. Tiếp tục chỉnh phần đang hiển thị sai cho đến khi lỗi không còn xuất hiện.

**Đáp án:** 1

**Giải thích sau khi trả lời**

> Cả lựa chọn 1 và 2 đều bắt đầu từ những nguyên nhân có thể xảy ra. Điểm khác biệt là lựa chọn 1 kiểm tra bằng chứng trước khi sửa, còn lựa chọn 2 tiếp tục sửa theo phỏng đoán. Kiểm tra log và tái hiện lỗi giúp agent xác định nguyên nhân thực sự, thay vì chỉ thử lần lượt nhiều cách sửa.

### Câu 5 — Thử nghiệm trên branch

**Câu hỏi**

> Website đang hoạt động ổn định, nhưng những thay đổi mới nhất chưa được lưu thành commit. Bạn muốn thử một bố cục mới và chưa chắc sẽ giữ lại. Bạn nên yêu cầu coding agent làm gì?

**Lựa chọn**

1. Tạo branch mới ngay, thử bố cục rồi tạo một commit chứa cả phiên bản ổn định và phần thử nghiệm.
2. Tạo commit cho phiên bản ổn định, sau đó tạo một branch riêng để thử bố cục mới.
3. Tạo commit cho phiên bản ổn định, sau đó thử bố cục mới trên branch hiện tại và quay lại commit cũ nếu không thích.
4. Push các tệp hiện tại lên GitHub, sau đó thử bố cục mới vì GitHub sẽ tự lưu phiên bản cũ.

**Đáp án:** 2

**Giải thích sau khi trả lời**

> Lựa chọn 2 và 3 đều lưu phiên bản ổn định bằng commit. Điểm khác biệt là branch riêng giữ phần thử nghiệm tách khỏi phiên bản đang hoạt động tốt. Nếu không muốn giữ bố cục mới, bạn vẫn có thể quay lại branch ổn định mà không phải gỡ các thay đổi thử nghiệm khỏi đó.

## 9. Nguồn tham khảo

Nguồn chính thức dùng để kiểm tra khái niệm:

- [OpenAI — Introducing Codex](https://openai.com/index/introducing-codex/)
- [OpenAI — Image inputs](https://learn.chatgpt.com/docs/image-inputs)
- [Git — About Version Control](https://git-scm.com/book/en/v2/Getting-Started-About-Version-Control)
- [Git — What is Git?](https://git-scm.com/book/en/v2/Getting-Started-What-is-Git%3F)
- [Git — Branches in a Nutshell](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell)
- [Git — git-restore](https://git-scm.com/docs/git-restore)
- [GitHub — What is GitHub?](https://docs.github.com/en/get-started/start-your-journey/what-is-github)
- [GitHub — About remote repositories](https://docs.github.com/en/get-started/git-basics/about-remote-repositories)
- [GitHub — About repositories](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories)

Nguồn bổ sung do người dùng cung cấp:

- [Git Tutorial P1 trên Viblo](https://viblo.asia/p/git-tutorial-p1-5y8Rr7oAMob3)

Bài Viblo được dùng để tham khảo danh sách khái niệm cần thiết, không dùng làm nguồn duy nhất cho câu lệnh hoặc hành vi hiện tại của Git.

## 10. Bước tiếp theo được phép

Triển khai toàn bộ thiết kế Module 3 đã duyệt vào `pilot-workspace/` và Course Companion, sau đó chạy các bước kiểm tra bắt buộc và đồng bộ implementation plan.
