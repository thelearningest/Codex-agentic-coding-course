import copy from '../../../../../pilot-workspace/course/codex-setup/projects.vi.json'
import sidebarImage from '../../../../../pilot-workspace/course/codex-setup/images/projects-sidebar.png'
import './model-lesson-board.css'
import './projects-lesson-board.css'

export function ProjectsLessonBoard({ busy, canOpenPreviousPage, nextLabel, onBack, onNext }: {
  busy: boolean
  canOpenPreviousPage: boolean
  nextLabel: string
  onBack: () => void
  onNext: () => void
}) {
  return (
    <section className="model-controls projects-lesson" aria-labelledby="projects-lesson-title">
      <div className="projects-lesson__body">
        <header className="projects-lesson__header">
          <h1 id="projects-lesson-title">{copy.title}</h1>
          {copy.introduction.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </header>
        <div className="projects-lesson__content">
          <figure className="projects-lesson__figure">
            <img src={sidebarImage} width="500" height="551"
              alt="Mục Projects trong thanh bên Codex, với tên project và các cuộc trò chuyện bên dưới" />
          </figure>
          <div className="projects-lesson__copy">
            {copy.details.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </div>
      </div>
      <footer className="model-controls__actions">
        <button className="pixel-page-back" type="button" disabled={busy || !canOpenPreviousPage}
          onClick={onBack}>← Trang trước</button>
        <button className="pixel-choice is-primary" type="button" disabled={busy} onClick={onNext}>
          {busy ? 'Đang lưu checkpoint…' : nextLabel}
        </button>
      </footer>
    </section>
  )
}
