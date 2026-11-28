import type { PortfolioGitHubCheckResult } from '../../../../shared/contracts'

export const githubPushPrompt = 'Hãy push portfolio này lên repo GitHub có link bên dưới. Trước khi push, kiểm tra để chắc trong code không có secret hay thông tin riêng tư. Nếu cần đăng nhập GitHub, hãy hướng dẫn tôi từng bước. Push xong thì báo cho tôi.\n\nLink repo: '

export const githubCheckMessages: Record<Exclude<PortfolioGitHubCheckResult['status'], 'passed'>, string> = {
  'invalid-link': 'Link này chưa phải link repo GitHub. Link đúng có dạng github.com/tên-tài-khoản/tên-repo.',
  'different-repository': 'Link này khác với repo mà thư mục portfolio đang gắn. Hãy kiểm tra lại link, hoặc hỏi agent repo đã được đưa lên đâu.',
  'not-pushed': 'Repo đã có trên GitHub nhưng còn thay đổi mới chưa đưa lên. Hãy nhờ agent push phiên bản mới nhất rồi kiểm tra lại.',
  'no-remote': 'Agent chưa đưa portfolio lên repo GitHub nào. Hãy làm lại bước 3: dán prompt kèm link repo vào Codex.',
  unavailable: 'Chưa đọc được thư mục portfolio của bạn. Hãy đóng rồi mở lại Course Companion, sau đó kiểm tra lại.'
}
