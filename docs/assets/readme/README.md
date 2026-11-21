# Main README media

These GIFs and PNGs are original captures of the repository's Course Companion
interface, made for the root README. No generated mockups, stock screenshots,
personal learner profiles or real learner submissions are used.

The lesson text, illustrations and video come from the current course build.
Teacher replies and Practice reviews use the existing simulated Codex gateway
in isolated profiles; the root README explicitly identifies them as demos.
Later-module footage is reached through the existing disposable portfolio
journey, which retains its normal
review, approval, freshness and completion checks. Its results are demonstration
and regression evidence, not beginner-pilot or live AI acceptance.

## Captures

| Asset | What it shows |
| --- | --- |
| `module-1-codex` | Lesson navigation through Codex, approval and model guidance. |
| `module-2-planning` | Planning, PRD and reviewing requirements with a coding agent. |
| `module-3-debugging` | Debugging explanation and a visible-error example. |
| `module-4-publishing` | Hosting, the Vercel lesson video and the follow-up explanation. |
| `teacher-companion` | Typing a synthetic question and receiving a simulated Teacher reply. |
| `practice-review` | Module 1 Practice guidance, checklist and simulated review feedback. |

Every clip is captured as a continuous Chromium screencast and encoded as
30 fps video, then exported as a looping 15 fps GIF at 960px width. Capture
timestamps preserve reading pauses and the timing of real UI transitions.
Static `.png` files are retained as capture references; the main README embeds
only the GIFs.

## Codex project setup screenshots — 21 November 2026

- `codex-folder-1-projects.png`, `codex-folder-2-create-project.png` and
  `codex-folder-3-new-folder.png`: macOS screenshots supplied by the course owner
  for the README steps that create an empty project folder in Codex.
- The first two are unedited. The third keeps the New Folder dialog sharp and
  blurs the Finder window behind it so personal file names cannot be read.
- These are not produced by `scripts/capture-readme-media.mjs`; replace them by
  hand when the Codex project dialog changes.

## Reproduce

Requires the locked Course Companion dependencies, its current production build,
and `ffmpeg` on PATH. From the repository root:

```text
node scripts/capture-readme-media.mjs
```

The capture script launches Electron with fresh temporary profiles and copies of
the Practice workspace. Intermediate frames, timestamps and diagnostic logs stay
under ignored `.superpowers/qa/readme-media/`. Only the reviewed GIFs, PNGs and
this note belong in Git. Running the script does not reset normal course progress
or create a live Codex task or deployment.

## Copywriting reference

Applied [Corey Haines's Copywriting skill](https://github.com/coreyhaines31/marketingskills/tree/main/skills/copywriting)
and its [AI-tells checklist](https://github.com/coreyhaines31/marketingskills/blob/main/skills/copywriting/references/ai-tells.md):
keep the existing Vietnamese voice, explain learner benefits with concrete
examples, place visual evidence beside each module and give readers a clear
path to setup. No performance statistics, testimonials or learner success claims
were added. The skill was consulted online; it was not installed globally.
