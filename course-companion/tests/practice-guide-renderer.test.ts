import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = (path: string) => readFile(join(process.cwd(), path), 'utf8')

describe('Practice video integration', () => {
  it('offers video replay in Practice without restoring the old interactive tour', async () => {
    const teacher = await source('src/renderer/src/components/TeacherWorkspace.tsx')
    const learning = await source('src/renderer/src/surfaces/LearningWindow.tsx')
    expect(teacher).toContain('Xem lại video hướng dẫn Practice')
    expect(teacher).toContain('<PracticeVideoGuide />')
    expect(teacher).toContain('reviewPractice()')
    expect(teacher).toContain('returnPassedPractice()')
    for (const surface of [teacher, learning]) {
      expect(surface).not.toContain('<PracticeGuide')
      expect(surface).not.toContain('loadPracticeGuide(')
      expect(surface).not.toContain('updatePracticeGuide(')
    }
  })
  it('keeps both handoff buttons gated independently of the video replay', async () => {
    const brief = await source('src/renderer/src/components/PracticeBrief.tsx')
    expect(brief).toContain('videoReceipt.courseRunId !== courseRunId')
    expect(brief.match(/disabled=\{busy \|\| switching \|\| videoLocked\}/g)).toHaveLength(2)
    expect(brief.match(/if \(!workspace \|\| busy \|\| videoLocked\) return/g)).toHaveLength(2)
  })
  it('pauses and saves when Electron hides either window and on unmount', async () => {
    const [main, preload, player] = await Promise.all([
      source('electron/main/index.ts'),
      source('electron/preload/index.ts'),
      source('src/renderer/src/components/PracticeVideoGuide.tsx')
    ])
    expect(main).toContain("window.on('hide', notify)")
    expect(main).toContain("window.on('minimize', notify)")
    expect(main.match(/notifyVideoWhenWindowHidden\(window\)/g)).toHaveLength(2)
    expect(preload).toContain("ipcRenderer.on('course:practice-video-hidden', listener)")
    expect(player).toContain('onPracticeVideoHidden(pauseAndSave)')
    expect(player).toContain('unsubscribe?.()')
    expect(player).toContain('if (progress.current) void persist({ ...progress.current })')
  })
})
