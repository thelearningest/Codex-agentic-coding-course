import { Fragment } from 'react'
import { HighlightedDialogue } from './HighlightedDialogue'

const designReferenceLinks = [
  { label: 'Pafolios', href: 'https://pafolios.com/' },
  { label: 'Awwwards', href: 'https://www.awwwards.com/' },
  { label: 'Dribbble', href: 'https://dribbble.com/' },
  { label: 'Mobbin', href: 'https://mobbin.com/' },
  { label: 'Pinterest', href: 'https://www.pinterest.com/' },
  { label: 'tài liệu chính thức của Impeccable', href: 'https://impeccable.style/docs/' }
] as const

const linkByLabel = new Map<string, string>(
  designReferenceLinks.map(({ href, label }) => [label, href])
)
const linkPattern = /(Pafolios|Awwwards|Dribbble|Mobbin|Pinterest|tài liệu chính thức của Impeccable)/g

export function DesignReferenceDialogue({ dialogue, highlightTerms }: { dialogue: string; highlightTerms?: readonly string[] }) {
  return (
    <>
      {dialogue.split('\n\n').map((paragraph, paragraphIndex) => (
        <Fragment key={paragraph}>
          {paragraphIndex > 0 ? <><br /><br /></> : null}
          {paragraph.split(linkPattern).map((segment, segmentIndex) => {
            const href = linkByLabel.get(segment)
            return href ? (
              <a
                className="pixel-dialogue-link"
                href={href}
                key={`${segment}-${segmentIndex}`}
                rel="noreferrer"
                target="_blank"
                title={`Mở ${segment} trong ứng dụng`}
              >
                {segment}
              </a>
            ) : highlightTerms ? <HighlightedDialogue key={segmentIndex} dialogue={segment} highlightTerms={highlightTerms} /> : segment
          })}
        </Fragment>
      ))}
    </>
  )
}
