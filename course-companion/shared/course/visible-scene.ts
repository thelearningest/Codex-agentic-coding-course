import type { SceneId } from '../contracts'

// The saved Practice handoff remains a distinct scene, but its lesson position
// is the preceding visible lesson page.
export function visibleLessonScene(sceneId: SceneId): SceneId {
  return sceneId === 'module-1-setup-checklist' ? 'module-1-skills-portfolio' : sceneId
}
