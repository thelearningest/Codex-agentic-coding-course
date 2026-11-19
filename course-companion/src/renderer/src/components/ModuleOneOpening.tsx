import { useEffect, useRef, useState } from 'react'
import Markdown, { type Components } from 'react-markdown'
import chatStart from '../../../../../pilot-workspace/course/codex-setup/images/chat-start.png'
import workStart from '../../../../../pilot-workspace/course/codex-setup/images/work-start.png'
import workComparison from '../../../../../pilot-workspace/course/codex-setup/images/work-vendor-comparison.png'
import codexImage from '../../../../../pilot-workspace/course/codex-setup/images/codex-new-chat.png'
import './ModuleOneOpening.css'

const illustrations: Record<string, string> = {
  'images/chat-start.png': chatStart,
  'images/work-start.png': workStart,
  'images/work-vendor-comparison.png': workComparison,
  'images/codex-new-chat.png': codexImage
}

type Illustration = { src: string; alt: string }

function IllustrationDialog({ image, onClose }: { image: Illustration; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [originalSize, setOriginalSize] = useState(false)
  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])

  return (
    <dialog ref={dialog} className="opening-image-dialog" aria-label="Xem ảnh"
      onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
      <div className="opening-image-actions">
        <button type="button" onClick={() => setOriginalSize(!originalSize)}>
          {originalSize ? 'Vừa màn hình' : 'Xem kích thước gốc'}
        </button>
        <button type="button" onClick={onClose}>Đóng</button>
      </div>
      <div className="opening-image-viewer" data-original-size={originalSize}>
        <img src={image.src} alt={image.alt} />
      </div>
    </dialog>
  )
}

export function ModuleOneOpening({ content }: { content: string }) {
  const [expanded, setExpanded] = useState<Illustration | null>(null)
  // Mode headings introduce the columns. Horizontal rules separate the example and reference.
  const [comparison = '', example, reference] = content.split(/^---$/m)
  const [introduction = '', ...modes] = comparison.split(/(?=^## )/m)
  const compareModes = modes.length > 0 && example !== undefined && reference !== undefined
  const components: Components = {
    a: ({ href, children }) => <a className="pixel-dialogue-link" href={href} target="_blank" rel="noreferrer">{children}</a>,
    img: ({ src, alt = '' }) => {
      const url = illustrations[String(src)]
      if (!compareModes || !url) return <img src={url} alt={alt} />
      return (
        <button className="opening-photo" type="button" aria-label={`Phóng to ảnh. ${alt}`}
          onClick={() => setExpanded({ src: url, alt })}>
          <img src={url} alt={alt} />
          <span aria-hidden="true">⤢</span>
        </button>
      )
    }
  }
  const renderMarkdown = (text: string) => <Markdown components={components}>{text}</Markdown>
  if (!compareModes) return <article className="module-one-opening">{renderMarkdown(content)}</article>

  return (
    <article className="module-one-opening opening-comparison">
      <div className="opening-introduction">{renderMarkdown(introduction)}</div>
      <div className="opening-modes">
        {modes.map(mode => <section key={mode.trim().split('\n')[0]}>{renderMarkdown(mode)}</section>)}
      </div>
      <div className="opening-example">{renderMarkdown(example)}</div>
      <footer>{renderMarkdown(reference)}</footer>
      {expanded && <IllustrationDialog image={expanded} onClose={() => setExpanded(null)} />}
    </article>
  )
}
