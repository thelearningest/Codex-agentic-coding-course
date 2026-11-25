import { portfolioAgentsTemplate } from './portfolio-agents-template'

export type AgentsMdTourSlide = {
  /** First and last 1-based line numbers of the excerpt in the portfolio AGENTS.md. */
  from: number
  to: number
  /** Line numbers the arrow points at. */
  targets: readonly number[]
  callout: string
}

// Owner-approved callouts for issue #13. Line numbers refer to portfolioAgentsTemplate;
// tests/agents-md-tour.test.ts fails if the template moves these lines.
export const agentsMdTourSlides: readonly AgentsMdTourSlide[] = [
  {
    from: 1, to: 3, targets: [1],
    callout: 'Đây là những quy luật mà agent của khoá học này sẽ tuân theo'
  },
  {
    from: 16, to: 20, targets: [19],
    callout: 'Quy luật này nhằm đảm bảo Agent không làm hành động nào ngáo đá'
  },
  {
    from: 35, to: 44, targets: [39, 40, 41, 42, 43, 44],
    callout: 'Quy luật này sẽ giúp Codex biết được cần kiểm tra gì sau bài tập thực hành của module 2'
  },
  {
    from: 52, to: 55, targets: [52],
    callout: 'Quy luật này sẽ định hình cách Codex tương tác với bạn'
  }
]

export const portfolioAgentsLines = portfolioAgentsTemplate.split('\n')

export function agentsMdExcerpt(slide: AgentsMdTourSlide): Array<{ number: number; text: string }> {
  return portfolioAgentsLines
    .slice(slide.from - 1, slide.to)
    .map((text, offset) => ({ number: slide.from + offset, text }))
}
