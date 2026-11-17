import { useEffect, useRef, useState } from 'react'
import type { CompanionMode, CompanionState } from '../../../../shared/contracts'
import teacherImage from '../assets/teacher-triet.png'
import { TeacherWorkspace } from '../components/TeacherWorkspace'

export function CompanionWindow() {
  const [mode, setMode] = useState<CompanionMode | null>(null)
  const [teacherOpened, setTeacherOpened] = useState(false)
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const state: CompanionState = window.courseCompanion
          ? await window.courseCompanion.loadCompanionState()
          : { mode: 'compact', conversation: { messages: [], recovered: false }, teacher: { connection: 'simulated', memory: 'ready' } }
        setMode(state.mode)
        if (state.mode === 'expanded') setTeacherOpened(true)
      } catch {
        setMode('compact')
      }
    }
    const unsubscribeMode = window.courseCompanion?.onCompanionModeChanged((nextMode) => {
      setMode(nextMode)
      if (nextMode === 'expanded') setTeacherOpened(true)
    })

    void load()
    return () => {
      if (clickTimer.current) clearTimeout(clickTimer.current)
      unsubscribeMode?.()
    }
  }, [])

  const changeMode = async (nextMode: CompanionMode) => {
    try {
      await window.courseCompanion?.setCompanionMode(nextMode)
      setMode(nextMode)
      if (nextMode === 'expanded') setTeacherOpened(true)
    } catch {
      setMode('compact')
    }
  }

  const showFullTeacher = async () => {
    try {
      await window.courseCompanion?.showFullTeacher()
    } catch {
      setMode('compact')
    }
  }

  const openQuickTeacher = () => {
    if (clickTimer.current) return
    clickTimer.current = setTimeout(() => {
      clickTimer.current = null
      void changeMode('expanded')
    }, 300)
  }

  const openFullTeacher = () => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current)
      clickTimer.current = null
    }
    void showFullTeacher()
  }
  if (mode === null) {
    return <main className="pixel-companion-surface" aria-label="Đang tải Triết" />
  }

  return (
    <main className={`pixel-companion-surface pixel-companion-surface--${mode}`}>
      {mode === 'compact' ? (
        <div className="pixel-teacher-launcher">
          <div className="pixel-teacher-drag-handle" title="Kéo để di chuyển Triết" aria-hidden="true">
            <img src={teacherImage} alt="" draggable={false} />
          </div>
          <button
            className="pixel-teacher-launcher-button"
            type="button"
            aria-label="Mở cửa sổ Triết"
            aria-description="Kéo hình Triết để di chuyển. Nhấp một lần để mở nhanh. Nhấp đúp để mở toàn màn hình."
            title="Nhấp một lần để mở nhanh · Nhấp đúp để mở toàn màn hình"
            onClick={openQuickTeacher}
            onDoubleClick={openFullTeacher}
          >
            Trò chuyện với Triết
          </button>
        </div>
      ) : null}
      {teacherOpened || mode === 'expanded' ? <TeacherWorkspace
        visible={mode === 'expanded'}
        onClose={() => void changeMode('compact')}
        onExpand={() => void showFullTeacher()}
      /> : null}
    </main>
  )
}
