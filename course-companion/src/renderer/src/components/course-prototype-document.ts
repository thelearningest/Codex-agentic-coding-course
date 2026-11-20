import source from '../../../../../plan/module-3-prototype/index.html?raw'
import room from '../../../../../prototypes/mvp-3-course-experience-companion/assets/home-base.png?inline'
import teacher from '../assets/teacher-triet.png?inline'

// Embed the two local images so the sandboxed example also works offline in the packaged app.
export const prototypeDocument = source
  .replace('../../prototypes/mvp-3-course-experience-companion/assets/home-base.png', room)
  .replace('../../course-companion/src/renderer/src/assets/teacher-triet.png', teacher)
