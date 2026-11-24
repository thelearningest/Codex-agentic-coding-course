import teacherChat from '../assets/practice-preview/teacher-chat.webp'
import './teacher-orientation.css'

const chatAreas = [
  {
    label: 'Đầu khung chat',
    description: 'Xem trạng thái kết nối của Triết. Bấm dấu × để đóng khung chat.'
  },
  {
    label: 'Bước học hiện tại',
    description: 'Triết dựa vào bài bạn đang học để trả lời câu hỏi.'
  },
  {
    label: 'Cuộc trò chuyện',
    description: 'Đọc lại câu hỏi của bạn và câu trả lời của Triết.'
  },
  {
    label: 'Ô nhắn tin',
    description: 'Nhập câu hỏi rồi bấm Gửi hoặc nhấn Enter. Nhấn Shift+Enter để xuống dòng.'
  }
]

export function TeacherOrientation() {
  return (
    <section className="teacher-orientation" aria-labelledby="teacher-orientation-title">
      <header>
        <h2 id="teacher-orientation-title">Làm quen với Triết</h2>
        <p>
          Triết là trợ lý AI của khóa học. Trong lúc học, bấm <strong>Trò chuyện với Triết</strong> nếu bạn không biết phải làm gì tiếp theo.
        </p>
      </header>

      <figure>
        <div className="teacher-orientation-shot">
          <img src={teacherChat} width={380} height={520} alt="Khung chat Triết với bốn vị trí được giải thích trong danh sách." />
          {chatAreas.map(({ label }, index) => <span key={label} aria-hidden="true">{index + 1}</span>)}
        </div>
        <figcaption>Giao diện Course Companion với tin nhắn mẫu.</figcaption>
      </figure>

      <ol className="teacher-orientation-areas" role="list">
        {chatAreas.map(({ label, description }, index) => (
          <li key={label}>
            <span className="teacher-orientation-number">{index + 1}</span>
            <div><h3>{label}</h3><p>{description}</p></div>
          </li>
        ))}
      </ol>

      <div className="teacher-orientation-next">
        <p>
          Khi vào Practice, khung chat chuyển sang chế độ hướng dẫn và duyệt bài.
          Nếu vướng ở bước nào, bấm <strong>Cần gợi ý?</strong> Khi chỉnh xong cấu hình trong task Codex, hãy bấm <strong>nút Nộp bài</strong> để Triết check bài cho bạn.
        </p>
      </div>
    </section>
  )
}
