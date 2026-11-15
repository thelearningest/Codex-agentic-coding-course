import { useEffect, useState } from 'react'
import copy from '../../../../../pilot-workspace/course/codex-setup/model-controls.vi.json'
import controlsImage from '../../../../../pilot-workspace/course/codex-setup/images/model-controls.png'
import './model-lesson-board.css'

export type ModelLessonTopic = 'overview' | 'model' | 'effort' | 'speed'
type Topic = ModelLessonTopic
const allTopics: readonly Topic[] = ['overview', 'model', 'effort', 'speed']
const topics = {
  overview: { label: 'Tổng quan', title: 'Có 3 cấu hình bạn cần để ý', next: 'Tìm hiểu Model →' },
  model: { label: '01 Model', title: 'Model', next: 'Tìm hiểu Effort →' },
  effort: { label: '02 Effort', title: 'Effort', next: 'Tìm hiểu Speed →' },
  speed: { label: '03 Speed', title: 'Speed', next: '' }
} as const
const overview = [
  ['Model · Chọn mô hình AI', 'Chọn dòng AI phù hợp với công việc bạn muốn làm.'],
  ['Effort · Mức suy nghĩ', 'Điều chỉnh mức độ AI suy nghĩ về yêu cầu.'],
  ['Speed · Tốc độ trả lời', 'Chọn chế độ trả lời nhanh hơn khi cần.']
]

function ControlImage({ topic }: { topic: Topic }) {
  return (
    <svg className="model-controls__image" viewBox="0 0 590 410" role="img"
      aria-label="Menu Codex với High, GPT-6 Astra, thanh trượt và biểu tượng tia sét">
      <defs>
        <marker id="model-controls-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto">
          <path d="M1,1 L7,4 L1,7" stroke="#ffda69" fill="none" strokeWidth="1.5" />
        </marker>
      </defs>
      <image href={controlsImage} x="0" y="75" width="590" height="311" />
      {(topic === 'overview' || topic === 'model') && (
        <g data-highlight="model">
          <rect className="model-controls__highlight" x="207" y="163" width="171" height="40" rx="8" />
          <path className="model-controls__arrow" d="M435 49 L435 145 Q435 183 390 183" />
        </g>
      )}
      {(topic === 'overview' || topic === 'effort') && (
        <g data-highlight="effort">
          <rect className="model-controls__highlight" x="247" y="126" width="78" height="35" rx="8" />
          <rect className="model-controls__highlight" x="68" y="219" width="433" height="53" rx="8" />
          <path className="model-controls__arrow" d="M282 48 L282 115" />
        </g>
      )}
      {(topic === 'overview' || topic === 'speed') && (
        <g data-highlight="speed">
          <rect className="model-controls__highlight" x="65" y="127" width="42" height="42" rx="8" />
          <path className="model-controls__arrow" d="M84 48 L84 115" />
        </g>
      )}
    </svg>
  )
}

export function ModelLessonBoard({ busy, canOpenPreviousPage, initialTopic, kind, nextLabel, onBack, onInitialTopicApplied, onNext }: {
  busy: boolean
  canOpenPreviousPage: boolean
  initialTopic?: Topic
  kind: 'models' | 'settings'
  nextLabel: string
  onBack: (topic?: Topic) => void
  onInitialTopicApplied?: () => void
  onNext: (topic?: Topic) => void
}) {
  // These are local explanations within the two existing course pages.
  // Changing a topic neither saves progress nor awards a checkpoint.
  const pageTopics: readonly Topic[] = kind === 'models' ? ['overview', 'model'] : ['effort', 'speed']
  // Tabs from the other page open that page through its normal back or continue path.
  const [topic, setTopic] = useState<Topic>(
    initialTopic && pageTopics.includes(initialTopic) ? initialTopic : pageTopics[0]!)
  useEffect(() => {
    if (initialTopic) onInitialTopicApplied?.()
    // Only the mount consumes the entry topic.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const topicIndex = pageTopics.indexOf(topic)
  const nextTopic = pageTopics[topicIndex + 1]
  const previousTopic = pageTopics[topicIndex - 1]
  // Effort and Speed copy differ in length. An invisible copy of the other topic
  // reserves the taller height so the footer buttons stay put when switching.
  const sizerTopics = kind === 'settings' ? pageTopics.filter((item) => item !== topic) as Array<'effort' | 'speed'> : []

  return (
    <section className="model-controls" aria-labelledby="model-controls-title" data-topic={topic}>
      <header className="model-controls__header">
        <h1 id="model-controls-title">Chọn cách Codex xử lý công việc</h1>
        <p>Làm quen với ba mục Model, Effort và Speed trong menu bên dưới ô nhập.</p>
        <nav className="model-controls__tabs" aria-label="Tìm hiểu các nút">
          {allTopics.map((item) => {
            const onThisPage = pageTopics.includes(item)
            const onPreviousPage = !onThisPage && allTopics.indexOf(item) < allTopics.indexOf(pageTopics[0]!)
            return (
              <button key={item} type="button" aria-pressed={topic === item}
                disabled={busy || (onPreviousPage && !canOpenPreviousPage)}
                onClick={() => onThisPage ? setTopic(item) : onPreviousPage ? onBack(item) : onNext(item)}>
                {topics[item].label}
              </button>
            )
          })}
        </nav>
      </header>
      <div className="model-controls__content">
        <div className="model-controls__figure"><ControlImage topic={topic} /></div>
        <section className="model-controls__detail" aria-live="polite" aria-labelledby="model-controls-topic">
          {sizerTopics.map((item) => (
            <div className="model-controls__sizer" aria-hidden="true" key={item}>
              <h2>{topics[item].title}</h2>
              {copy[item].map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          ))}
          <div className="model-controls__topic">
          <h2 id="model-controls-topic">{topics[topic].title}</h2>
          {topic === 'overview' ? overview.map(([title, description], index) => (
            <div className="model-controls__overview-item" key={title}>
              <span className="model-controls__number">0{index + 1}</span>
              <div><h3>{title}</h3><p>{description}</p></div>
            </div>
          )) : (
            <div className="model-controls__personal-copy">
              {copy[topic].map((paragraph, index) => (
                <p key={paragraph}>{topic === 'model' && index > 0
                  ? paragraph.split(/\b(Astra|Sol|Terra|Luna)\b/g).map((part, partIndex) =>
                    /^(Astra|Sol|Terra|Luna)$/.test(part) ? <strong key={partIndex}>{part}</strong> : part)
                  : paragraph}</p>
              ))}
            </div>
          )}
          {topic === 'model' && (
            <a className="model-controls__source" href={copy.source.url} target="_blank" rel="noreferrer">
              <span>{copy.source.label}</span><span aria-hidden="true">↗</span>
            </a>
          )}
          </div>
        </section>
      </div>
      <footer className="model-controls__actions">
        <button className="pixel-page-back" type="button" disabled={busy || (!previousTopic && !canOpenPreviousPage)}
          onClick={() => previousTopic ? setTopic(previousTopic) : onBack()}>← Trang trước</button>
        {topic !== 'overview' && <span>{`${topic === 'model' ? '01' : topic === 'effort' ? '02' : '03'} / 03 · ${topics[topic].title}`}</span>}
        <button className="pixel-choice is-primary" type="button" disabled={busy}
          onClick={() => nextTopic ? setTopic(nextTopic) : onNext()}>
          {busy ? 'Đang lưu checkpoint…' : nextTopic ? topics[topic].next : nextLabel}
        </button>
      </footer>
    </section>
  )
}
