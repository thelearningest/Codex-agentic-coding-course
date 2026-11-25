import { describe, expect, it } from 'vitest'
import {
  agentsMdExcerpt,
  agentsMdTourSlides,
  portfolioAgentsLines,
  type AgentsMdTourSlide
} from '../shared/agents-md-tour'

const line = (number: number): string => portfolioAgentsLines[number - 1] ?? ''

function slideAt(index: number): AgentsMdTourSlide {
  const slide = agentsMdTourSlides[index]
  if (!slide) throw new Error(`Missing AGENTS.md tour slide ${index + 1}`)
  return slide
}

// The callouts point at specific lines of the AGENTS.md that Course Companion writes.
// If the template moves these lines, update the line numbers in shared/agents-md-tour.ts.
describe('AGENTS.md tour excerpts', () => {
  it('keeps every excerpt inside the template with its targets in range', () => {
    expect(agentsMdTourSlides).toHaveLength(4)
    for (const slide of agentsMdTourSlides) {
      expect(slide.from).toBeGreaterThanOrEqual(1)
      expect(slide.to).toBeLessThanOrEqual(portfolioAgentsLines.length)
      expect(agentsMdExcerpt(slide)).toHaveLength(slide.to - slide.from + 1)
      for (const target of slide.targets) {
        expect(target).toBeGreaterThanOrEqual(slide.from)
        expect(target).toBeLessThanOrEqual(slide.to)
        expect(line(target).trim()).not.toBe('')
      }
    }
  })

  it('points each arrow at the line its callout describes', () => {
    const title = slideAt(0)
    const data = slideAt(1)
    const packageList = slideAt(2)
    const interview = slideAt(3)

    expect(title.targets.map(line)).toEqual(['# Quy tắc làm việc cho portfolio này'])
    expect(line(data.from)).toBe('## Tài liệu và dữ liệu')
    expect(data.targets.map(line)).toEqual([
      expect.stringMatching(/^- Chờ người học đồng ý trước khi đổi tên/)
    ])
    expect(line(packageList.from)).toBe('## Module 2: gói kế hoạch')
    expect(packageList.targets.map((number) => line(number).slice(0, 12)))
      .toEqual(['1. planning/', '2. planning/', '3. planning/', '4. planning/', '5. planning/', '6. planning/'])
    expect(interview.targets.map(line)).toEqual(['### Cách phỏng vấn người học'])
  })
})
