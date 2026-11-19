import Markdown from 'react-markdown'
import workImage from '../../../../../pilot-workspace/course/codex-setup/images/work-vendor-comparison.jpg'
import codexImage from '../../../../../pilot-workspace/course/codex-setup/images/codex-new-chat.png'

const illustrations: Record<string, string> = {
  'images/work-vendor-comparison.jpg': workImage,
  'images/codex-new-chat.png': codexImage
}

export function ModuleOneOpening({ content }: { content: string }) {
  return (
    <article className="module-one-opening">
      <Markdown components={{
        a: ({ href, children }) => <a className="pixel-dialogue-link" href={href} target="_blank" rel="noreferrer">{children}</a>,
        img: ({ src, alt }) => <img src={illustrations[String(src)]} alt={alt} />
      }}>{content}</Markdown>
    </article>
  )
}
