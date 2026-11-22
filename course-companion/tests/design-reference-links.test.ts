import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const designReferenceLinks = [
  { label: 'Pafolios', href: 'https://pafolios.com/' },
  { label: 'Awwwards', href: 'https://www.awwwards.com/' },
  { label: 'Dribbble', href: 'https://dribbble.com/' },
  { label: 'Mobbin', href: 'https://mobbin.com/' },
  { label: 'Pinterest', href: 'https://www.pinterest.com/' }
]

describe('Module 2 design-reference links', () => {
  it('renders all five approved destinations without changing their visible labels', async () => {
    const component = await readFile(
      resolve(process.cwd(), 'src/renderer/src/components/DesignReferenceDialogue.tsx'),
      'utf8'
    )

    for (const { href, label } of designReferenceLinks) {
      expect(component).toContain(`{ label: '${label}', href: '${href}' }`)
    }
    expect(component).toContain('className="pixel-dialogue-link"')
    expect(component).toContain('target="_blank"')
    expect(component).toContain('rel="noreferrer"')
    expect(component).toContain('Mở ${segment} trong ứng dụng')
  })
})
