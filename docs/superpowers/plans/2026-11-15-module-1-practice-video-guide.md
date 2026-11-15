# Module 1 Practice Video Guide Implementation Plan

> **For agentic workers:** Use subagent-driven-development for the scoped implementation and review. The owner approved the complete design on 15 November 2026 and explicitly requested proceeding without further confirmation.

**Goal:** Ship a locally bundled Vietnamese walkthrough and require full viewing plus explicit learner confirmation before Module 1's Codex handoff.

**Architecture:** A focused renderer video player reports contiguous watched coverage to a recoverable Electron-owned repository. A versioned receipt is bound to the authoritative course run and checked by Module 1 start/resume handlers. The video is produced separately from disposable demonstration captures and original Vietnamese narration.

**Tech Stack:** Existing React/TypeScript, Electron preload IPC, Vitest, Playwright Electron, FFmpeg, Python and Vietnamese speech synthesis for original narration; no runtime dependencies added.

## Global constraints

- Preserve existing copy, routes, pages, assessment, linked tasks and fresh-review return gates.
- Use natural Vietnamese with complete diacritics.
- Keep viewing state in Electron application data, never browser localStorage or source control.
- Keep recording and tests in disposable profiles; do not touch normal learner progress or personal Codex task settings.
- Require full playback and a separate explicit confirmation; seeking or `ended` alone does not unlock the handoff.
- Replace the old interactive Practice guide entirely, as the owner subsequently requested. Offer video replay in full/compact Practice and retain legacy saved history.
- Persist per course run and video version; allow replay and resume without requiring a new full viewing.
- No autoplay, external hosting, analytics, paid generation service or new runtime dependency.
- Owner approval covers implementation direction; technical verification does not imply learner acceptance.

## Task 1: Local narrated video

**Ownership:** Main agent: `scripts/create-practice-video*`, media source/captions/transcript/poster/video under `course-companion/src/renderer/src/assets/practice-video/`, and `course-companion/shared/practice-video-manifest.json`.

- [x] Create original narration from the approved storyboard and synthesize Vietnamese audio with captions.
- [x] Capture existing Practice UI using disposable simulated data. Clearly identify the example and keep all personal data out of the frames.
- [x] Compose the approximately three-minute walkthrough with readable holds, highlights, real UI, captions and narration. Explain task selection, the four required settings (Model freely chosen, per the concurrent policy change), help/window controls, review/correction and return.
- [x] Write manifest with exact media duration/version, media source notes and transcript. Decode with FFmpeg and inspect representative frames and complete timeline.

## Task 2: Viewing state and confirmation gate

**Ownership:** Scoped implementer: shared typed video contracts/helper; Electron video repository and main/preload wiring; `PracticeVideoGuide.tsx`, `PracticeBrief.tsx`, scoped CSS; focused unit tests. Do not change media production assets.

**Interface:** `loadPracticeVideo(): Promise<PracticeVideoProgress>` and `updatePracticeVideo(request: PracticeVideoUpdate): Promise<PracticeVideoProgress>`. Bind updates to the loaded authoritative `courseRunId` and manifest video version. Return watched frontier, saved position, completed/confirmed state. Keep writes serialized and recoverable. The renderer must block seeking beyond the watched frontier and credit only visible, active, continuous playback.

- [x] Test incomplete and seeked playback, explicit confirmation, wrong course/video identity, persistence, corruption and concurrent saves.
- [x] Implement repository, typed API and preload handlers. Main process rejects Module 1 start/resume without the current receipt, including requests without an explicit identity that resume Module 1.
- [x] Add the player within the existing Module 1 introduction before unchanged controls. Pause on hidden/unmount, restore position, retain completed viewing after save errors and expose accessible retry/transcript/fullscreen/captions.
- [x] Disable both start/resume until confirmation; handler checks remain independent of disabled buttons. Other Practices retain their current behavior.
- [x] Run focused tests and typecheck and review the scoped diff.

## Task 3: Integration and regression verification

**Ownership:** Main agent: `course-companion/tests/practice-video-electron.mjs`, disposable test helpers and existing smoke/guide tests requiring an explicit introduction fixture. No production bypass.

- [x] Exercise real local media playback, seek attempts, pause, visibility changes, full viewing, confirmation, manual start, reopen/restart and narrow/desktop layout.
- [x] Seed explicit introduction receipts only in disposable profiles for unrelated lifecycle tests. The new gate test starts without a receipt and must watch actual media.
- [x] Run typecheck, lint, full unit/startup, production build and complete Electron suite after the coherent batch; review screenshots and page preservation.

## Task 4: Review and delivery evidence

- [x] Review implementation for spec compliance and code quality; fix material findings and repeat only affected checks.
- [x] Update the approved design status and implementation-plan Foundation/I4 ledger using actual outputs. Keep learner/native acceptance pending.
- [x] Review all changed files and `git diff --check`; report delivered media, behavior, validation and material limits. Do not push, publish or reset a learner profile.

## Plan self-review

All approved spec sections map to media production, the typed persisted gate or Electron verification. The video manifest supplies one duration/version shared by both layers. Historical Pilot screenshot/report drift is recorded in the design and remains outside this change. The owner selected continuous execution, so there is no additional approval checkpoint.

## Requested revision: actual desktop walkthrough

The owner found the first media insufficient. This is a scoped revision of the
approved video, with no further design-confirmation checkpoint. Existing checked
tasks above describe v1 technical implementation, not acceptance of its teaching
quality. Do not replace the currently playable asset until revised media passes.

- [x] Write a concrete 12-scene narration and recording sequence, starting with
  the real handoff click, then native Codex plus windowed Teacher and a complete
  review/fix/pass/return attempt. Source: `scripts/practice-desktop-video-storyboard.json`.
- [x] Record safe native Codex and Teacher footage in disposable demonstration
  state. The owner provided a separate window. Direct window capture excludes
  private chats; the actual demo passed and returned after a real correction.
- [x] Edit continuous desktop footage with readable wide views, contextual
  zooms, individual highlights and burned-in Vietnamese captions. Keep the
  narration synchronized with each demonstrated action, including genuine
  settings menus and review output. The speech-service interruption was resolved
  with Nam Minh narration. Captions are embedded and limited to two lines. The
  guide's own handoff/replay retakes now show its current duration and content.
- [x] Publish revised media/captions/transcript/poster
  and manifest version `1.1.0` with actual duration. Avoid duplicate default
  captions when the movie already contains them. Source takes and the first
  assembled timeline were inspected during production; final visual UI review
  belongs to the owner under the narrowed verification request.
- [x] Run decoding, caption integrity, real watch/confirm playback, typecheck/
  build, lint and focused main-feature tests after the coherent batch. The owner
  explicitly requested main-behavior checks and will verify the visual UI;
  another manual layout/screenshot audit is outside this final verification.
  Synchronize the Foundation/I4 ledger from actual evidence.

Final revision evidence: `core-unit.log` records 29 passing tests in four files;
`core-build.log` includes successful typecheck/build; lint passed; the published
movie matches the fully decoded final render and all 12 script chapters and 55
ordered caption cues match. `core-electron-retry.log` records full actual playback,
seek prevention, hidden/restart persistence, separate confirmation, failed-save
retry, manual handoff, replay and review/return. The first long run stopped paused
at 0:52 with no media/renderer error; diagnostic rerun passed without a production
change. Visual UI acceptance remains with the owner. No full unrelated regression
suite or additional manual layout audit was run for this narrowed revision.

## Requested concise edit: 2–3 minutes

- [x] Shorten the narration to the complete main workflow, retaining all four
  settings, help, task recovery, window controls, real review/fix/pass and return.
- [x] Remove top chapter/wait banners and animated camera moves. Retain captions
  and contextual highlights on the stationary desktop.
- [x] Render the 2–3 minute version; refresh self-referential handoff/replay
  footage and bundled media, transcript, captions, poster and version `1.2.0`.
- [x] Verify full decoding, script/caption integrity, duration and actual
  watch/confirmation/handoff with the existing narrow main-feature checks.
  Synchronize the Foundation/I4 ledger; leave final visual UI review to the owner.

Final concise version: 157.879667 seconds, version `1.2.0`, 12 chapters and
30 embedded caption cues. There are no animated cameras or top chapter/wait
banners. Final media decoding, caption integrity, build/typecheck, lint and
29 focused tests passed. `short-final-electron.log` records successful actual
full playback, seek blocking, pause/hide/restart persistence, separate
confirmation, save retry, manual handoff, replay and reviewed return. This
remains the owner's main-feature acceptance scope; visual UI review is theirs.
