import { useRef, useState } from 'react'
import './course-prototype.css'

export function CoursePrototypeButton() {
  const dialog = useRef<HTMLDialogElement>(null)
  const [document, setDocument] = useState('')

  async function open() {
    dialog.current?.showModal()
    if (!document) {
      const { prototypeDocument } = await import('./course-prototype-document')
      setDocument(prototypeDocument)
    }
  }

  return <>
    <button className="pixel-visual-expand" type="button" onClick={() => void open()}>Mở mẫu HTML</button>
    <dialog className="course-prototype-dialog" ref={dialog} aria-label="Mẫu HTML của Module 3">
      <form method="dialog"><button className="pixel-page-back" aria-label="Đóng mẫu HTML">Đóng</button></form>
      {document && <iframe title="Mẫu HTML của Module 3" sandbox="allow-scripts" srcDoc={document} />}
    </dialog>
  </>
}
