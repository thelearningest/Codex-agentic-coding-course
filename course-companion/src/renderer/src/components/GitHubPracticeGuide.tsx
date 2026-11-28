import { useId, useState, type FormEvent, type ReactNode } from 'react'
import type { CourseCompanionApi, PortfolioGitHubCheckResult } from '../../../../shared/contracts'
import signupImage from '../assets/lesson-visuals/m3-github-signup.webp'
import newRepoImage from '../assets/lesson-visuals/m3-github-new-repo-button.webp'
import createRepoImage from '../assets/lesson-visuals/m3-github-create-repo.png'
import emptyRepoImage from '../assets/lesson-visuals/m3-github-empty-repo.webp'
import './github-practice-guide.css'
import { githubCheckMessages, githubPushPrompt } from './github-practice-copy'

type GuideApi = Pick<CourseCompanionApi, 'checkPortfolioGitHubRepository' | 'loadPracticeWorkspace' | 'openPracticeTask'>
type StepNumber = 1 | 2 | 3 | 4
const stepNumbers: readonly StepNumber[] = [1, 2, 3, 4]

function Step({ number, title, open, done, onToggle, children }: {
  number: StepNumber
  title: string
  open: boolean
  done: boolean
  onToggle: () => void
  children: ReactNode
}) {
  const bodyId = useId()
  return (
    <li className={`github-practice-step${open ? ' is-open' : ''}${done ? ' is-done' : ''}`} data-github-step={number}>
      <button type="button" className="github-practice-step__head" aria-expanded={open} aria-controls={bodyId} onClick={onToggle}>
        <span className="github-practice-step__number" aria-hidden="true">{done ? '✓' : number}</span>
        <span className="github-practice-step__title">{title}</span>
        <span className="github-practice-step__tag">{done ? 'Xong' : open ? 'Đang làm' : ''}</span>
      </button>
      <div className="github-practice-step__body" id={bodyId} hidden={!open}>{children}</div>
    </li>
  )
}

export function GitHubPracticeGuide({ verifiedRepository, onVerified, api }: {
  /** Repository already verified and saved in progress, for example when the learner reviews this page. */
  verifiedRepository?: string
  onVerified: (repository: string) => void
  api?: GuideApi
}) {
  const [open, setOpen] = useState<StepNumber | 0>(verifiedRepository ? 4 : 1)
  const [done, setDone] = useState<ReadonlySet<StepNumber>>(() => new Set(verifiedRepository ? stepNumbers : []))
  const [link, setLink] = useState(verifiedRepository ? `https://github.com/${verifiedRepository}` : '')
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<PortfolioGitHubCheckResult | null>(
    verifiedRepository ? { status: 'passed', repository: verifiedRepository } : null)
  const [copied, setCopied] = useState<'idle' | 'copied' | 'error'>('idle')
  const [taskError, setTaskError] = useState('')
  const linkId = useId()
  const resultId = useId()

  const markDone = (step: StepNumber) => {
    const next = new Set(done).add(step)
    const following = stepNumbers.find((item) => !next.has(item)) ?? step
    setDone(next)
    setOpen(following)
    // The finished step's button is hidden, so keyboard focus moves to the step that opens next.
    requestAnimationFrame(() => document
      .querySelector<HTMLButtonElement>(`[data-github-step="${following}"] .github-practice-step__head`)?.focus())
  }
  const toggle = (step: StepNumber) => setOpen((current) => current === step ? 0 : step)

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(githubPushPrompt)
      setCopied('copied')
    } catch {
      setCopied('error')
    }
  }

  const openTask = async () => {
    setTaskError('')
    try {
      const workspace = await api?.loadPracticeWorkspace()
      const active = workspace?.activePractice
      if (!api || !active) throw new Error('No active Codex task')
      await api.openPracticeTask({ runId: active.runId, generation: active.generation })
    } catch {
      setTaskError('Chưa mở được task Codex. Hãy mở Codex và chọn task portfolio của bạn.')
    }
  }

  const check = async (event: FormEvent) => {
    event.preventDefault()
    if (!link.trim() || checking) return
    setChecking(true)
    setResult(null)
    try {
      const checked = api ? await api.checkPortfolioGitHubRepository(link) : { status: 'unavailable' as const }
      setResult(checked)
      if (checked.status === 'passed') {
        setDone(new Set(stepNumbers))
        onVerified(checked.repository)
      }
    } catch {
      setResult({ status: 'unavailable' })
    } finally {
      setChecking(false)
    }
  }

  const failed = result && result.status !== 'passed' ? githubCheckMessages[result.status] : ''

  return (
    <section className="github-practice" aria-labelledby="githubPracticeTitle">
      <h1 id="githubPracticeTitle">Đưa portfolio lên GitHub</h1>
      <p className="github-practice__lead">Làm lần lượt bốn bước. Ở bước cuối, app sẽ tự kiểm tra repo của bạn.</p>
      <div className="github-practice__progress">
        <div className="github-practice__bar" aria-hidden="true"><i style={{ width: `${(done.size / 4) * 100}%` }} /></div>
        <span>{done.size}/4 bước</span>
      </div>

      <ol className="github-practice__steps">
        <Step number={1} title="Tạo tài khoản GitHub" open={open === 1} done={done.has(1)} onToggle={() => toggle(1)}>
          <p>GitHub là nơi lưu code của bạn trên mạng. Nếu chưa có tài khoản, hãy đăng ký miễn phí.</p>
          <p className="github-practice__safety">Bạn tự nhập email và mật khẩu. Đừng gửi mật khẩu cho agent.</p>
          <img className="github-practice__shot" src={signupImage} alt="Trang đăng ký tài khoản GitHub với các ô email, mật khẩu và tên người dùng" />
          <div className="github-practice__actions">
            <a className="github-practice__button" href="https://github.com/signup" target="_blank" rel="noreferrer">Mở trang đăng ký GitHub ↗</a>
            <button type="button" className="github-practice__button is-primary" onClick={() => markDone(1)}>Tôi đã có tài khoản</button>
          </div>
        </Step>

        <Step number={2} title="Tạo repo trên GitHub" open={open === 2} done={done.has(2)} onToggle={() => toggle(2)}>
          <ol className="github-practice__sub-steps">
            <li>
              <p>Mở trang GitHub của bạn, chọn tab <b>Repositories</b> rồi bấm nút xanh <b>New</b>.</p>
              <img className="github-practice__shot" src={newRepoImage} alt="Tab Repositories trên GitHub với nút New màu xanh ở góc phải" />
            </li>
            <li>
              <p>Đặt tên repo, ví dụ <code>portfolio</code>. Ở mục <b>Choose visibility</b>, chọn <b>Private</b> để chỉ mình bạn xem được code. Để nguyên các mục còn lại rồi bấm <b>Create repository</b>.</p>
              <img className="github-practice__shot" src={createRepoImage} alt="Trang tạo repo mới: ô tên repo, mục Choose visibility đang chọn Private và nút Create repository" />
            </li>
            <li>
              <p>GitHub mở trang repo còn trống. Ở ô <b>Quick setup</b>, giữ lựa chọn <b>HTTPS</b> rồi bấm nút sao chép ở cuối ô link.</p>
              <img className="github-practice__shot" src={emptyRepoImage} alt="Trang repo trống với ô Quick setup chứa link HTTPS và nút sao chép" />
            </li>
          </ol>
          <div className="github-practice__actions">
            <a className="github-practice__button" href="https://github.com/new" target="_blank" rel="noreferrer">Mở trang tạo repo ↗</a>
            <button type="button" className="github-practice__button is-primary" onClick={() => markDone(2)}>Đã sao chép link repo</button>
          </div>
        </Step>

        <Step number={3} title="Nhờ agent push portfolio lên repo" open={open === 3} done={done.has(3)} onToggle={() => toggle(3)}>
          <p>Sao chép prompt dưới đây, dán vào task Codex của portfolio, rồi dán link repo vừa sao chép ngay sau chữ “Link repo:”.</p>
          <div className="github-practice__prompt">
            <header>
              <span>Prompt để dán vào Codex</span>
              <button type="button" onClick={() => void copyPrompt()}>{copied === 'copied' ? 'Đã sao chép' : copied === 'error' ? 'Thử lại' : 'Sao chép prompt'}</button>
            </header>
            <p>{githubPushPrompt}</p>
          </div>
          {copied !== 'idle' ? <p className="github-practice__status" role="status">{copied === 'copied'
            ? 'Đã sao chép prompt. Bạn có thể dán vào Codex.'
            : 'Chưa thể sao chép. Hãy thử lại.'}</p> : null}
          <p className="github-practice__safety">Nếu agent cần bạn đăng nhập GitHub, bạn tự đăng nhập trên trình duyệt. Đừng gửi mật khẩu cho agent.</p>
          <div className="github-practice__actions">
            <button type="button" className="github-practice__button" onClick={() => void openTask()}>Mở lại task Codex</button>
            <button type="button" className="github-practice__button is-primary" onClick={() => markDone(3)}>Agent đã push xong</button>
          </div>
          {taskError ? <p className="github-practice__status" role="alert">{taskError}</p> : null}
        </Step>

        <Step number={4} title="Dán link repo để kiểm tra" open={open === 4} done={done.has(4)} onToggle={() => toggle(4)}>
          <p>Dán link repo vào đây. Bạn có thể dùng lại link đã sao chép ở bước 2.</p>
          <form className="github-practice__field" noValidate onSubmit={(event) => void check(event)}>
            <label htmlFor={linkId}>Link repo GitHub</label>
            <div>
              <input
                id={linkId}
                type="url"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                placeholder="https://github.com/ten-tai-khoan/portfolio"
                value={link}
                aria-invalid={Boolean(failed)}
                aria-describedby={resultId}
                onChange={(event) => {
                  setLink(event.target.value)
                  if (!checking) setResult(null)
                }}
              />
              <button type="submit" className="github-practice__button is-primary" disabled={!link.trim() || checking}>
                {checking ? 'Đang kiểm tra…' : 'Kiểm tra'}
              </button>
            </div>
          </form>
          <p className={`github-practice__result${failed ? ' is-error' : ''}`} id={resultId} aria-live="polite">
            {checking ? <><span className="github-practice__spinner" aria-hidden="true" />Đang kiểm tra repo trên máy của bạn…</> : failed}
          </p>
          <details className="github-practice__help">
            <summary>Tìm link repo ở đâu?</summary>
            <p>Mở repo trên GitHub. Link nằm trên thanh địa chỉ và có dạng github.com/tên-tài-khoản/tên-repo. Link có đuôi .git sao chép từ ô Quick setup cũng dùng được.</p>
          </details>
          {result?.status === 'passed' ? (
            <div className="github-practice__success" role="status">
              <strong>Portfolio của bạn đã có trên GitHub</strong>
              <ul>
                <li>Repo: <code>github.com/{result.repository}</code></li>
                <li>Link khớp với repo mà thư mục portfolio đang gắn.</li>
                <li>Phiên bản mới nhất trên máy đã được đưa lên.</li>
              </ul>
            </div>
          ) : null}
        </Step>
      </ol>
    </section>
  )
}
