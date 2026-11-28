import type { RegistrySceneContent } from '../../module-contracts'

export const moduleThreeScenes = {
  'module-3-first-build': {
    lessonId: 'module-3', checkpointId: 'm3-complete-first-version', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 3 · PRACTICE', mission: 'Tạo bản portfolio đầu tiên',
    objective: 'Tạo bản portfolio đầu tiên', panelLabel: 'PRACTICE', panelStatus: 'TASK CODEX TỪ MODULE 2',
    copyPromptTitle: 'Tạo bản portfolio đầu tiên',
    copyPrompt: 'Bắt đầu Module 3. Hãy dùng năm tài liệu planning đã duyệt để xây bản portfolio đầu tiên theo implementation plan. Chạy website và gửi tôi đường dẫn để xem trên trình duyệt.',
    tone: 'neutral', request: 'Dùng kế hoạch đã duyệt để xây portfolio.', evidence: [],
    showTitle: false, showPanel: false,
    dialogue: 'Bây giờ, sau khi đã xong giai đoạn planning, chúng ta sẽ đến với bước mà ắt bạn đang rất mong chờ, tạo portfolio. Bạn chỉ cần copy prompt này và paste vào codex là được. Sau khi codex làm xong, sau khi codex làm xong và bạn thấy được portfolio hiện lên thì hãy bấm vào teacher agent và chọn quay lại bài học, chưa cần biết đẹp xấu đúng sai như nào.\n\nChắc chắn sẽ còn nhiều điểm cần cải thiện vì thường lần tạo đầu tiên không bao giờ hoàn hảo. Nhưng chúng mình sẽ cùng nhau cải thiện dần qua module 3',
    choices: [{ label: 'Tiếp tục đến Practice', action: 'practice', preservePrimaryLabel: true, primary: true }]
  },
  'module-3-local-preview': {
    lessonId: 'module-3', checkpointId: 'm3-complete-first-version', step: 2, totalSteps: 5,
    lessonLabel: 'MODULE 3 · LOCAL', mission: 'Mở portfolio trên máy',
    objective: 'Mở portfolio trên máy', panelLabel: 'XEM PORTFOLIO',
    panelStatus: 'CHẠY TRÊN MÁY CỦA BẠN', tone: 'neutral',
    request: 'Nhờ agent chạy portfolio và gửi đường dẫn để xem.',
    evidence: [],
    dialogue: "Từ giờ, mỗi lần bạn muốn xem lại bản portfolio hiện tại của mình, bạn có thể nhắn cho agent “Hãy chạy lại portfolio và gửi tôi đường dẫn để xem trên trình duyệt.”\n\nBây giờ, bản portfolio của bạn đang ở môi trường local, tức là chỉ tồn tại trong máy tính của bạn. Đừng copy link mà bạn thấy trên trình duyệt rồi gửi cho người khác xem portfolio, sẽ có vấn đề đấy :> Module 4 sẽ chỉ bạn cách để triển khai website trên cloud để người khác xem được.",
    highlightTerms: ['local'],
    choices: [{ label: 'Debug cùng coding agent', next: 'module-3-debugging-intro', primary: true }]
  },
  'module-3-debugging-intro': {
    lessonId: 'module-3', checkpointId: 'm3-complete-first-version', step: 2, totalSteps: 5,
    lessonLabel: 'MODULE 3 · DEBUG', mission: 'Chuẩn bị khi gặp bug',
    objective: 'Biết cách phối hợp với coding agent khi sản phẩm gặp lỗi', panelLabel: 'BUG',
    panelStatus: 'KHÓ TRÁNH KHỎI', tone: 'neutral',
    request: 'Planning tốt giúp giảm lỗi, nhưng không loại bỏ hoàn toàn việc debugging.',
    evidence: [],
    dialogue: 'Okay, bây giờ bạn đã có một implementation plan và bắt đầu thực hiện nó. Đến giai đoạn này, có một điều mình chắc chắn bạn sẽ không thể tránh khỏi. Đó chính là gặp bug (lỗi phần mềm). Hiện tại coding agent chưa phát triển đến mức làm hoàn hảo mọi yêu cầu của bạn mà không có tí lỗi nào.\n\nThực ra hồi mới bắt đầu code với Coding agents, đâu đó tầm 40% thời gian mình dành để lên kế hoạch và xây sản phẩm thôi, 60% thời gian còn lại mình dành cho debugging (khắc phục lỗi). Thực ra hoàn thành tốt giai đoạn planning và implementation plan đã giúp bạn giảm khá khá bugs rồi. Nhưng vẫn khó tránh khỏi việc bạn sẽ gặp bug trong quá trình xây sản phẩm.\n\nVậy khi gặp bug thì xử lý thế nào?',
    highlightTerms: ['implementation plan', 'bug', 'bugs', 'lỗi phần mềm', 'debugging', 'khắc phục lỗi', 'planning'],
    choices: [{ label: 'Khi lỗi xuất hiện trên màn hình', next: 'module-3-visible-error', primary: true }]
  },
  'module-3-visible-error': {
    lessonId: 'module-3', checkpointId: 'm3-complete-first-version', step: 2, totalSteps: 5,
    lessonLabel: 'MODULE 3 · DEBUG', mission: 'Gửi bằng chứng nhìn thấy được',
    objective: 'Mô tả lỗi đủ rõ để agent bắt đầu điều tra', panelLabel: 'ẢNH LỖI',
    panelStatus: 'THÊM BỐI CẢNH', tone: 'neutral',
    request: 'Gửi ảnh cùng thao tác, kết quả mong đợi và kết quả thực tế.',
    evidence: [
      { label: 'BẠN ĐANG LÀM GÌ', value: 'Thao tác vừa thực hiện' },
      { label: 'SO SÁNH', value: 'Mong đợi · thực tế' }
    ],
    dialogue: 'Khi gặp một bug có thể nhìn thấy trên màn hình, hãy chụp lại bug đó và gửi ảnh cho coding agent.\n\nĐừng chỉ gửi ảnh. Hãy nói thêm bạn đang làm gì, bạn mong đợi điều gì và kết quả thực tế ra sao. Từ những thông tin này, agent có thể kiểm tra code, tìm nguyên nhân và giải thích lỗi bằng ngôn ngữ dễ hiểu trước khi sửa.\n\nSau khi agent sửa xong, hãy thực hiện lại đúng thao tác đã gây lỗi. Nếu lỗi không còn xuất hiện, chúng ta có thể tiếp tục.',
    highlightTerms: ['bug'],
    choices: [{ label: 'Xem ví dụ prompt', next: 'module-3-visible-error-prompt', primary: true }]
  },
  'module-3-visible-error-prompt': {
    lessonId: 'module-3', checkpointId: 'm3-complete-first-version', step: 2, totalSteps: 5,
    lessonLabel: 'MODULE 3 · DEBUG', mission: 'Đọc một prompt báo lỗi',
    objective: 'Hình dung cách gửi ảnh lỗi cho coding agent', panelLabel: 'PROMPT MẪU',
    panelStatus: 'ẢNH · MONG ĐỢI · THỰC TẾ', tone: 'good',
    request: 'Prompt trong hình cung cấp đủ bối cảnh để agent bắt đầu điều tra.',
    evidence: [],
    dialogue: 'Trên đây là ví dụ của một prompt bạn có thể áp dụng. Trong trường hợp này, lỗi có thể thấy ngay ở trên trang web, nên bạn chỉ việc cắt screenshot và nhắn prompt như trên là được.',
    highlightTerms: ['prompt', 'screenshot'],
    choices: [{ label: 'Khi ảnh chưa cho thấy nguyên nhân', next: 'module-3-terminal-logs', primary: true }]
  },
  'module-3-terminal-logs': {
    lessonId: 'module-3', checkpointId: 'm3-complete-first-version', step: 2, totalSteps: 5,
    lessonLabel: 'MODULE 3 · DEBUG', mission: 'Dùng log để tìm nguyên nhân',
    objective: 'Cho agent thêm bằng chứng vào terminal', panelLabel: 'LOG TRONG TERMINAL',
    panelStatus: 'BẰNG CHỨNG', tone: 'neutral',
    request: 'Sau khi sửa xong, agent có thể xoá những đoạn log không còn cần thiết.',
    evidence: [
      { label: 'TRƯỚC KHI SỬA', value: 'Thêm log · tái hiện lỗi' },
      { label: 'SAU KHI SỬA', value: 'Xoá log không cần thiết' }
    ],
    dialogue: 'Đôi khi ảnh chụp chỉ cho thấy kết quả bị sai, nhưng chưa cho biết vì sao lỗi xảy ra.\n\nNếu bạn đã gửi ảnh lỗi mà agent vẫn chưa sửa được, bạn có thể yêu cầu agent thêm log, tức là thông tin ghi lại những hoạt động diễn ra khi ứng dụng đang chạy. Log có thể giúp agent có thêm thông tin về nguyên nhân gây ra lỗi, thay vì chỉ đoán mò\n\nPrompt mẫu: “Hãy thêm log cần thiết để tìm nguyên nhân lỗi. Nếu cần tôi thực hiện lại thao tác gây lỗi, hãy hướng dẫn tôi. Sau khi sửa, hãy kiểm tra lại và xóa những log tạm không còn cần thiết.”',
    highlightTerms: ['log', 'logs', 'terminal'],
    choices: [{ label: 'Khi lỗi vẫn quay lại', next: 'module-3-repeated-error', primary: true }]
  },
  'module-3-repeated-error': {
    lessonId: 'module-3', checkpointId: 'm3-complete-first-version', step: 2, totalSteps: 5,
    lessonLabel: 'MODULE 3 · DEBUG', mission: 'Dừng việc sửa theo phỏng đoán',
    objective: 'Liệt kê các lỗi có thể xảy ra trước khi sửa tiếp', panelLabel: 'LỖI QUAY LẠI',
    panelStatus: 'TẠM DỪNG VÀ ĐIỀU TRA', tone: 'neutral',
    request: 'Nêu các nguyên nhân có thể, rồi kiểm tra nguyên nhân nào thực sự có bằng chứng.',
    evidence: [],
    dialogue: 'Nếu lỗi vẫn quay lại sau nhiều lần sửa, hãy yêu cầu AI tạm dừng và liệt kê những nguyên nhân có thể khiến lỗi xảy ra. Cách này giúp quá trình điều tra có hệ thống hơn, giúp bạn tìm ra nguyên nhân gốc, thay vì chỉ vá những biểu hiện trước mắt.\n\nSau đó, hãy yêu cầu coding agent kiểm tra từng nguyên nhân và dựa vào bằng chứng để xác định nguyên nhân nào thực sự gây ra lỗi.',
    highlightTerms: ['nguyên nhân gốc'],
    choices: [{ label: 'Tìm hiểu Git', next: 'module-3-git-intro', primary: true }]
  },
  'module-3-git-intro': {
    lessonId: 'module-3', checkpointId: 'm3-whole-page-revision', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 3 · GIT', mission: 'Lưu lịch sử của dự án',
    objective: 'Hiểu vì sao Git giúp quá trình xây dựng an toàn hơn', panelLabel: 'GIT',
    panelStatus: 'QUẢN LÝ PHIÊN BẢN', tone: 'good',
    request: 'Bạn cần hiểu mục đích; agent sẽ xử lý các thao tác kỹ thuật.',
    evidence: [
      { label: 'REPOSITORY', value: 'Tệp dự án và lịch sử thay đổi' },
      { label: 'KHI CẦN', value: 'Quay lại một phiên bản trước' }
    ],
    dialogue: 'Trong quá trình debugging, có thể bạn sẽ cần phải khôi phục phiên bản trước khi có lỗi, để xem lỗi nằm ở đâu. Đó là lúc Git có tác dụng\n\nGit là một hệ thống quản lý phiên bản phân tán. Nó giúp ghi lại những thay đổi của dự án theo thời gian và cho phép quay lại một phiên bản trước đó khi cần.',
    highlightTerms: ['debugging', 'Git', 'hệ thống quản lý phiên bản', 'phân tán', 'repository', 'kho lưu trữ dự án', 'phiên bản'],
    choices: [{ label: 'Phân biệt Git và GitHub', next: 'module-3-git-github', primary: true }]
  },
  'module-3-git-github': {
    lessonId: 'module-3', checkpointId: 'm3-whole-page-revision', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 3 · GIT VÀ GITHUB', mission: 'Phân biệt hai khái niệm',
    objective: 'Biết điều gì nằm trên máy và điều gì nằm trên mạng', panelLabel: 'KHÁC NHAU',
    panelStatus: 'GIT ≠ GITHUB', tone: 'neutral',
    showTitle: false,
    request: 'Bạn có thể dùng Git mà không cần kết nối với GitHub.',
    evidence: [
      { label: 'GIT', value: 'Hoạt động trên máy tính' },
      { label: 'GITHUB', value: 'Nền tảng trực tuyến' }
    ],
    dialogue: 'Git và GitHub thường được nhắc đến cùng nhau, nhưng thực ra chúng là hai khái niệm khác nhau.\n\nGit là một hệ thống hoạt động trên máy tính của bạn. Git theo dõi các tệp trong repository và lưu lại lịch sử thay đổi của chúng. Bạn có thể dùng Git mà không cần kết nối với GitHub.\n\nGitHub là một nền tảng trực tuyến. Bạn có thể đưa repository từ máy tính lên GitHub để lưu thêm một bản trên mạng. Sau đó, bạn có thể truy cập dự án từ máy khác hoặc chia sẻ với người khác.\n',
    highlightTerms: ['Git', 'GitHub', 'repository'],
    choices: [{ label: 'Commit là gì?', next: 'module-3-git-commit', primary: true }]
  },
  'module-3-git-commit': {
    lessonId: 'module-3', checkpointId: 'm3-whole-page-revision', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 3 · COMMIT', mission: 'Lưu một phiên bản của dự án',
    objective: 'Hiểu lịch sử Git được tạo như thế nào', panelLabel: 'COMMIT',
    panelStatus: 'MỘT PHIÊN BẢN ĐÃ LƯU', tone: 'good',
    request: 'Nhiều commit nối tiếp nhau tạo thành lịch sử của dự án.',
    evidence: [
      { label: 'NƠI LƯU', value: 'Repository trên máy tính' },
      { label: 'MÔ TẢ', value: 'Một lời nhắn ngắn' }
    ],
    dialogue: 'Bây giờ, mình sẽ giới thiệu thêm một số khái niệm để bạn hiểu thêm về cách Git hoạt động.\n\nĐầu tiên là Commit.\n\nVề căn bản, Commit là một phiên bản của dự án mà bạn đã lưu lại tại một thời điểm cụ thể. Giả dụ sau khi bạn sửa xong hiệu ứng animation của portfolio, bạn thấy đẹp quá nên bạn muốn lưu nó lại, để sau này nếu lỡ phá code thì vẫn tìm lại phiên bản cũ được. Commit sẽ giúp bạn làm điều đó.\n\nHình ở góc bên phải màn hình chính là git tree, biểu đồ để minh hoạ lịch sử của dự án. Các bạn có thể thấy mỗi chấm là một commit, và nhiều chấm nối lại với nhau tạo thành lịch sử phát triển dự án.\n\nCác bạn nên tạo commit ngay sau mỗi thay đổi lớn trong dự án, hoặc thay đổi nào mà bạn thấy thích, để có thể tìm lại phiên bản đã lưu nếu lỡ sửa hỏng code. Bạn chỉ cần bảo agents là "commit all the current changes with appropriate messages" là được.',
    highlightTerms: ['Commit', 'lịch sử Git', 'repository trên máy tính của bạn', 'GitHub'],
    choices: [{ label: 'Đưa commit lên GitHub', next: 'module-3-git-push', primary: true }]
  },
  'module-3-git-push': {
    lessonId: 'module-3', checkpointId: 'm3-whole-page-revision', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 3 · PUSH', mission: 'Đưa commit lên GitHub',
    objective: 'Phân biệt tạo commit và gửi commit', panelLabel: 'PUSH',
    panelStatus: 'MÁY TÍNH → GITHUB', tone: 'neutral',
    request: 'Push không tạo commit mới và không tự động xảy ra sau mỗi giai đoạn.',
    evidence: [],
    dialogue: 'Khi bạn muốn chuyển một commit từ môi trường máy tính của bạn lên GitHub, bạn sẽ sử dụng lệnh \'git push\' (cụ thể như nào thì bạn có thể nhờ agent làm). Sau khi push thành công, lịch sử commit của bạn cũng sẽ được lưu trên github và bạn có thể chia sẻ nó cho người khác.',
    highlightTerms: ['push', 'commit', 'commits', 'repository', 'GitHub'],
    choices: [{ label: 'Thử nghiệm bằng branch', next: 'module-3-git-branch', primary: true }]
  },
  'module-3-git-branch': {
    lessonId: 'module-3', checkpointId: 'm3-whole-page-revision', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 3 · BRANCH', mission: 'Thử nghiệm an toàn',
    objective: 'Tách phần thử nghiệm khỏi phiên bản ổn định', panelLabel: 'BRANCH',
    panelStatus: 'HƯỚNG PHÁT TRIỂN RIÊNG', tone: 'good',
    request: 'Sau khi thử, bạn quyết định có đưa thay đổi vào phiên bản ổn định hay không.',
    evidence: [],
    dialogue: "Một khái niệm nữa mà mình muốn giới thiệu cho bạn là branch, hay còn gọi là nhánh.\n\nGiả sử portfolio của bạn đang hoạt động ổn, nhưng bạn muốn thử tạo thêm một khối 3D. Tính năng này khá phức tạp, và bạn chưa chắc làm xong có đẹp hay không. Nếu sửa trực tiếp trên nhánh chính, bạn có thể làm hỏng cả những phần đang chạy tốt.\n\nLúc này, bạn có thể tạo một branch riêng để phát triển tính năng 3D. Cứ hình dung đó là một “vùng riêng” để quậy. Những thay đổi bạn thực hiện và commit trên branch này sẽ không ảnh hưởng đến nhánh chính, cho đến khi bạn quyết định gộp chúng vào.\n\nNếu thử nghiệm không ổn, bạn có thể nhờ agent xử lý phần đang làm dở và quay lại nhánh chính. Bạn không bắt buộc phải đưa tính năng 3D vào portfolio, cũng không cần xóa branch ngay nếu muốn giữ lại để thử tiếp sau này.\n\nĐể bắt đầu, bạn chỉ cần bảo agent:\n\nTạo và chuyển sang branch feature/3d-development (hoặc bất kỳ tên nào bạn thích) để phát triển tính năng 3D.",
    highlightTerms: ['branch', 'repository', 'phiên bản ổn định'],
    choices: [{ label: 'Tiếp tục', next: 'module-3-git-merge', primary: true }]
  },
  'module-3-git-merge': {
    lessonId: 'module-3', checkpointId: 'm3-whole-page-revision', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 3 · MERGE', mission: 'Gộp nhánh và xử lý xung đột',
    objective: 'Hiểu merge và xung đột khi gộp nhánh', panelLabel: 'MERGE',
    panelStatus: 'GỘP NHÁNH', tone: 'neutral',
    request: 'Sau khi thử, bạn quyết định có đưa thay đổi vào phiên bản ổn định hay không.',
    evidence: [],
    dialogue: "Sau khi đã xem và kiểm tra tính năng, nếu muốn đưa nó vào nhánh chính, bạn có thể bảo:\n\n“Gộp branch hiện tại vào nhánh chính main. Nếu có xung đột, hãy giải thích và đề xuất cách xử lý để tôi quyết định. Sau khi gộp, kiểm tra lại tính năng một lần nữa để chắc không có lỗi gì xảy ra”\n\nThao tác gộp nhánh này được gọi là merge.\n\nNgoài ra, khi merge hai nhánh lại với nhau, đôi khi sẽ có những vùng xung đột xảy ra. Ví dụ, file hiệu ứng 3D của nhanh a quy định khối 3D xoay sang trái, trong khi nhánh b sửa cùng dòng đó để khối 3D xoay sang phải. Git sẽ không biết phải chọn cái nào, khiến xung đột (conflict) xảy ra\n\nXử lý conflict là một chủ đề khá rộng nên mình sẽ không đi sâu trong khóa này. Tạm thời bạn có thể nhờ agent xử lý là sẽ ổn thoả trong 85% trường hợp.",
    highlightTerms: ['branch', 'repository', 'phiên bản ổn định'],
    choices: [{ label: 'Tiếp tục', next: 'module-3-security-env', primary: true }]
  },
  'module-3-security-env': {
    lessonId: 'module-3', checkpointId: 'm3-whole-page-revision', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 3 · BẢO MẬT', mission: 'Giữ file .env trên máy',
    objective: 'Không đưa thông tin bí mật lên GitHub', panelLabel: '.GITIGNORE',
    panelStatus: 'GIT BỎ QUA FILE NÀY', tone: 'good',
    request: 'Thêm .env vào .gitignore trước khi push dự án lên GitHub.',
    evidence: [],
    dialogue: 'Tiếp theo, các bạn sẽ học một số quy tắc để vibecode một cách an toàn, bảo mật.\n\nĐầu tiên, nếu dự án của bạn có file .env, tuyệt đối không được push lên GitHub. File .env là nơi dự án cất những thông tin bí mật, như API key (mã khoá để dùng các dịch vụ như OpenAI hay Google). Bạn có thể bỏ .env vào .gitignore (những file mà git sẽ không bao giờ đụng vào), để tránh việc agent đẩy file .env của bạn lên mạng.',
    highlightTerms: ['.env', '.gitignore', 'API key', 'push', 'GitHub'],
    choices: [{ label: 'Không dán key vào khung chat', next: 'module-3-security-chat-secrets', primary: true }]
  },
  'module-3-security-chat-secrets': {
    lessonId: 'module-3', checkpointId: 'm3-whole-page-revision', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 3 · BẢO MẬT', mission: 'Không dán thông tin nhạy cảm',
    objective: 'Không dán key hay bất kỳ thông tin nhạy cảm nào vào khung chat.', panelLabel: 'KHUNG CHAT',
    panelStatus: 'KHÔNG DÁN KEY', tone: 'neutral',
    request: 'Tự copy paste mật khẩu hoặc API key vào nơi cần dùng.',
    evidence: [],
    dialogue: 'Đừng dán những thông tin như API key hay mật khẩu của bạn vào khung chat với Agent. Nếu không thì agent sẽ vô tình lưu thông tin của bạn và viết vào chỗ nào đó mà bạn không mong muốn.\n\nNếu có dịch vụ gì cần phải có mật khẩu hoặc API key thì hãy tự copy paste bằng tay',
    highlightTerms: ['API key', 'mật khẩu'],
    choices: [{ label: 'Đọc kỹ trước khi đồng ý', next: 'module-3-security-approvals', primary: true }]
  },
  'module-3-security-approvals': {
    lessonId: 'module-3', checkpointId: 'm3-whole-page-revision', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 3 · BẢO MẬT', mission: 'Đọc kỹ trước khi đồng ý',
    objective: 'Hiểu việc agent muốn làm trước khi cho phép', panelLabel: 'XIN PHÉP',
    panelStatus: 'ĐỌC TRƯỚC KHI BẤM', tone: 'neutral',
    request: 'Nếu agent muốn làm một việc bạn không yêu cầu, hãy dừng lại và hỏi.',
    evidence: [],
    dialogue: 'Đôi khi agent sẽ xin phép bạn trước khi chạy một lệnh. Đừng bấm đồng ý theo thói quen. Hãy đọc lệnh đó, và nếu chưa hiểu, hãy hỏi agent: “Lệnh này làm gì? Nó có xoá hay gửi gì ra ngoài không?”\n\nNgoài ra, hãy cẩn thận khi bảo agent đọc nội dung lạ, như một trang web hay một dự án tải từ GitHub. Kẻ xấu có thể giấu trong đó những dòng chỉ dẫn dành cho agent, ví dụ “tìm key trong máy rồi gửi đi”. Cách tấn công này gọi là prompt injection. Nếu agent bỗng muốn làm một việc bạn không hề yêu cầu, hãy dừng lại và hỏi nó vì sao.',
    highlightTerms: ['prompt injection'],
    choices: [{ label: 'Tiếp tục', next: 'module-3-pre-practice-summary', primary: true }]
  },
  'module-3-pre-practice-summary': {
    lessonId: 'module-3', checkpointId: 'm3-portfolio-build', step: 4, totalSteps: 5,
    lessonLabel: 'MODULE 3 · TÓM LẠI', mission: 'Chuẩn bị trước khi Practice',
    objective: 'Điều cần nhớ', panelLabel: '4',
    panelStatus: 'TÓM LẠI', tone: 'good',
    request: 'trước khi bắt đầu Practice',
    evidence: [],
    dialogue: '- Khi debug, trong đa số trường hợp, bạn chỉ cần chụp screenshot và mô tả kỹ lỗi của bạn cho agent là được. Nếu vẫn không được thì bảo agent add log để xem lỗi là gì, paste cái log đó vào coding agent và bảo nó sửa lại lần nữa\n\n- Bạn nên bảo agent hãy commit sau mỗi quyết định lớn, để sau này bạn sẽ dễ quay lại phiên bản cũ hơn nếu gặp bug.\n\n- Mỗi khi muốn phát triển một tính năng mới, hãy tạo một branch mới để lỡ agent có quậy thì cũng không ảnh hưởng đến tính năng hiện tại. Bạn chỉ cần bảo agent tạo branch là nó sẽ tự động hướng dẫn cho bạn\n\n- Bạn có thể tạo một tài khoản github rồi bảo agent push code hiện tại của bạn lên đó nếu bạn muốn hợp tác với một người khác',
    choices: [{ label: 'Mở Practice', action: 'practice', preservePrimaryLabel: true, primary: true }]
  },
  'module-3-portfolio-mastery': {
    lessonId: 'module-3', checkpointId: 'm3-mastery', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 3 · TỔNG KẾT', mission: 'Kiểm tra những gì bạn vừa học',
    objective: 'Phân biệt các cách làm gần giống nhau', panelLabel: 'BÀI KIỂM TRA',
    panelStatus: '5 CÂU', tone: 'good',
    request: 'Các câu hỏi được đặt cùng nhau ở cuối bài.',
    evidence: [],
    dialogue: "Trước khi kết thúc bài học, bạn hãy nhờ agent publish repo của bạn lên github. Sau khi hoàn thành, chúng ta sẽ cùng làm một vài câu hỏi để ôn tập nhé.",
    highlightTerms: ['publish', 'repo', 'github'],
    choices: [{ label: 'Bắt đầu ôn tập', preservePrimaryLabel: true, next: 'module-3-mastery-plan', primary: true }]
  },
  'module-3-mastery-plan': {
    lessonId: 'module-3', checkpointId: 'm3-mastery', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 3 · TỔNG KẾT', mission: 'Thực hiện plan theo từng phần', objective: 'Kiểm tra trước khi đi tiếp',
    panelLabel: 'CÂU 1/5', panelStatus: 'TÌNH HUỐNG', tone: 'neutral', request: 'Chọn cách xử lý phù hợp nhất.', evidence: [], dialogue: '', choices: [],
    assessmentQuestionId: 'm3-mastery-plan', assessmentGroupId: 'm3-final-assessment'
  },
  'module-3-mastery-visible-error': {
    lessonId: 'module-3', checkpointId: 'm3-mastery', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 3 · TỔNG KẾT', mission: 'Phân biệt Git và GitHub', objective: 'Hiểu vai trò của Git và GitHub',
    panelLabel: 'CÂU 2/5', panelStatus: 'KHÁI NIỆM', tone: 'neutral', request: 'Chọn phát biểu đúng.', evidence: [], dialogue: '', choices: [],
    assessmentQuestionId: 'm3-mastery-visible-error', assessmentGroupId: 'm3-final-assessment'
  },
  'module-3-mastery-logs': {
    lessonId: 'module-3', checkpointId: 'm3-mastery', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 3 · TỔNG KẾT', mission: 'Dùng log', objective: 'Tìm nguyên nhân trước khi sửa',
    panelLabel: 'CÂU 3/5', panelStatus: 'TÌNH HUỐNG', tone: 'neutral', request: 'Chọn cách xử lý phù hợp nhất.', evidence: [], dialogue: '', choices: [],
    assessmentQuestionId: 'm3-mastery-logs', assessmentGroupId: 'm3-final-assessment'
  },
  'module-3-mastery-repeated-error': {
    lessonId: 'module-3', checkpointId: 'm3-mastery', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 3 · TỔNG KẾT', mission: 'Lỗi liên tục quay lại', objective: 'Kiểm tra nguyên nhân bằng bằng chứng',
    panelLabel: 'CÂU 4/5', panelStatus: 'TÌNH HUỐNG', tone: 'neutral', request: 'Chọn cách xử lý phù hợp nhất.', evidence: [], dialogue: '', choices: [],
    assessmentQuestionId: 'm3-mastery-repeated-error', assessmentGroupId: 'm3-final-assessment'
  },
  'module-3-mastery-branch': {
    lessonId: 'module-3', checkpointId: 'm3-mastery', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 3 · TỔNG KẾT', mission: 'Thử nghiệm trên branch', objective: 'Giữ phiên bản ổn định an toàn',
    panelLabel: 'CÂU 5/5', panelStatus: 'TÌNH HUỐNG', tone: 'neutral', request: 'Chọn cách xử lý phù hợp nhất.', evidence: [], dialogue: '', choices: [],
    assessmentQuestionId: 'm3-mastery-branch', assessmentGroupId: 'm3-final-assessment'
  },
  'module-3-mastery-summary': {
    lessonId: 'module-3', checkpointId: 'm3-mastery', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 3 · TỔNG KẾT', mission: 'Đối chiếu kết quả', objective: 'Kết hợp câu trả lời với Practice hiện tại',
    panelLabel: 'KẾT QUẢ', panelStatus: 'CHỜ ĐỐI CHIẾU', tone: 'neutral', request: 'Practice và phần tổng kết đều phải hoàn thành.',
    evidence: [], dialogue: '', choices: [], assessmentGroupId: 'm3-final-assessment', assessmentSummary: true
  },
  'module-3-complete': {
    lessonId: 'module-3', checkpointId: 'm3-complete', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 3 · HOÀN THÀNH', mission: 'Sẵn sàng cho Module 4', objective: 'Module 3 đã hoàn thành',
    panelLabel: 'BÀN GIAO MODULE 4', panelStatus: 'WEBSITE ĐÃ ĐƯỢC CHẤP NHẬN', tone: 'good',
    request: 'Module 4 tiếp tục từ workspace và bằng chứng hiện tại.', evidence: [],
    dialogue: 'Bạn đã hiện thực hoá implementation plan, xử lý lỗi cùng coding agent và dùng Git để làm việc an toàn hơn.',
    highlightTerms: ['implementation plan', 'Git'], choices: [{ label: 'Tiếp tục', next: 'module-4-hosting-intro', primary: true }]
  }
} as const satisfies Record<string, RegistrySceneContent>
