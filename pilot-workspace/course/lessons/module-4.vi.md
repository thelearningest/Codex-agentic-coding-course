# Module 4 — Đăng tải portfolio lên mạng

## Hosting là gì?

Bạn đã làm xong portfolio và mở được nó trên máy. Bây giờ, bạn muốn gửi cho một người bạn xem. Nhưng đường dẫn `localhost` bạn đang dùng chỉ trỏ về máy đang mở nó, nên gửi đường dẫn này chưa giúp người kia xem được portfolio.

Bạn cần đặt website ở một nơi có thể truy cập qua Internet. Dịch vụ cung cấp nơi đó được gọi là **hosting**.

Khi website đã được đưa lên đó, người khác có thể mở bằng đường link, kể cả khi bạn đã tắt máy. Trong khóa học này, chúng ta sẽ dùng Vercel để làm việc đó.

## Máy tính, GitHub và Vercel làm gì?

Trong bài thực hành này, mỗi nơi có một vai trò:

| Nơi | Vai trò trong bài thực hành |
|---|---|
| Máy tính của bạn | Nơi bạn cùng agent xây và sửa portfolio. |
| GitHub | Nơi lưu code và lịch sử thay đổi của dự án trên mạng. |
| Vercel | Lấy code của dự án và đưa website lên để người khác truy cập. |

GitHub lưu code của bạn, còn Vercel giúp người khác mở website.

## Milestone 1 — Hosting, Vercel và bản chuẩn bị phát hành

### Vercel giúp bạn làm gì?

Hãy xem video để biết cách đưa portfolio lên Vercel.

[Xem video hướng dẫn](../../../course-companion/src/renderer/src/assets/lesson-visuals/module-4/vercel-portfolio-captioned.mp4)

### Mở portfolio vừa đưa lên mạng

Khi thực hành đưa portfolio lên Vercel, bạn hãy mở đường link mà Vercel cung cấp.

 Sau đó, hãy xem nội dung đã hiện đúng ý bạn chưa, ảnh có tải được không, v.v. Thử cả trên máy tính và điện thoại.

 Nếu website chưa mở được hoặc còn lỗi, bạn hãy nhờ agent tìm nguyên nhân và sửa nó. Thường là quá trình này khá đơn giản nên cũng sẽ không có lỗi gì nghiêm trọng xảy ra.

## Milestone 3 — Thực hành cập nhật một thay đổi nhỏ

### Chọn một thay đổi nhỏ

Sau khi phát hành portfolio trong Practice, bạn sẽ có một website để gửi cho người khác xem. Nếu bạn muốn dùng tên miền riêng thay cho địa chỉ có đuôi .vercel.app thì bạn có thể mua ngay trong Vercel.

Sau này nếu bạn muốn thay đổi bất kỳ chi tiết gì, bạn có thể sửa và kiểm tra trước ở môi trường local. Sau đó, nếu thấy ưng ý rồi thì hãy commit và push lên branch main. Nếu main là branch Vercel đang dùng để phát hành website, Vercel sẽ tự động cập nhật thay đổi của bạn sau khi triển khai thành công.

## Thực hành phát hành portfolio

Bây giờ, hãy chuyển sang Codex để đưa portfolio của bạn lên mạng theo hướng dẫn vừa học. Khi bạn có một portfolio mở được bằng đường link để gửi cho người khác xem, bạn đã đạt mục tiêu của Module 4 rồi. Không có bài kiểm tra cuối phần này.

## Trạng thái bản duyệt nội dung

Mục tiêu của Module 4 là có portfolio trên mạng để gửi cho người khác xem. Ứng dụng hiện chưa tự ghi nhận kết quả thực hành này.

## Tài liệu để đối chiếu khi cần

Các bước và hình được đối chiếu ngày 14/09/2026. Giao diện có thể thay đổi; hãy đọc tên mục và kiểm tra dự án thật trước khi làm theo. Ảnh trong bài không chứng minh portfolio của bạn đã triển khai thành công.

- [Vercel: bắt đầu và import từ dashboard](https://vercel.com/docs/getting-started-with-vercel).
- [Vercel: Local, Preview, Production và lần triển khai đầu](https://vercel.com/docs/deployments/environments).
- [Vercel: gói Hobby](https://vercel.com/docs/plans/hobby).
- [Vercel: quyền truy cập và quyền mặc định](https://vercel.com/docs/deployment-protection).
- [Vercel: cài đặt bản dựng](https://vercel.com/docs/builds/configure-a-build).
- [Vercel: nối GitHub và tự triển khai khi push](https://vercel.com/docs/git/vercel-for-github).
- [Vercel: đọc nhật ký lỗi bản dựng](https://vercel.com/docs/deployments/logs).
- [Vercel: khôi phục và Undo Rollback](https://vercel.com/docs/instant-rollback).
- [Vercel: thêm tên miền](https://vercel.com/docs/domains/working-with-domains/add-a-domain).
