import type { PracticeDefinition } from '../../shared/contracts'
import { PORTFOLIO_BUILD_INSTRUCTIONS } from './portfolio-build-instructions'
import { portfolioReleaseInstructions } from './portfolio-release-instructions'

export function portfolioContinuationInstructions(definition: PracticeDefinition, sourceCheckpoint?: string): string {
  return [
    'Tiếp tục trong chính task này với các tài liệu đã có; không tạo task hoặc workspace thay thế.',
    ...(definition.practiceId === 'm3-portfolio-build' ? [
      'Đọc năm tài liệu planning đã được duyệt làm nguồn yêu cầu. Thực hiện kế hoạch người học đã duyệt; giữ nguyên phạm vi đã thống nhất. Giữ nguyên ranh giới và các cổng kiểm chứng hiện hành của Module 3.'
    ] : []),
    'Thực hiện Practice ' + definition.practiceId + '.',
    'Mục tiêu: ' + definition.objective,
    'Kết quả cần đạt: ' + definition.expectedOutcome,
    'Chỉ làm trong phạm vi Practice và dừng tại mọi điểm cần người học duyệt.',
    definition.practiceId === 'm4-portfolio-release'
      ? portfolioReleaseInstructions(sourceCheckpoint)
      : PORTFOLIO_BUILD_INSTRUCTIONS
  ].join('\n\n')
}
