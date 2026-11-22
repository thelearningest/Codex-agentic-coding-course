import { Fragment } from 'react'

const designReferenceLinks = [
  { label: 'Pafolios', href: 'https://pafolios.com/' },
  { label: 'Awwwards', href: 'https://www.awwwards.com/' },
  { label: 'Dribbble', href: 'https://dribbble.com/' },
  { label: 'Mobbin', href: 'https://mobbin.com/' },
  { label: 'Pinterest', href: 'https://www.pinterest.com/' }
] as const

const linkByLabel = new Map<string, string>(
  designReferenceLinks.map(({ href, label }) => [label, href])
)
const linkPattern = /(Pafolios|Awwwards|Dribbble|Mobbin|Pinterest)/g

export function DesignReferenceDialogue({ dialogue }: { dialogue: string }) {
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
            ) : segment
          })}
        </Fragment>
      ))}
    </>
  )
}
