# Portfolio Course Implementation Plan

- **Status:** Foundation repair and the selective Triet V2 content integration are verified; Module 3 content and its approved v2 Practice are implemented and technically verified while its overall acceptance gate remains in progress. Module 1 now includes
  the approved `AGENTS.md` and Skills introduction and routes directly from it
  to setup Practice. Module 2 now keeps five Course Companion knowledge slides,
  passes through one required technical portfolio-folder boundary, and retires
  the other 22 Teacher-led Practice-setup slides. The combined fictional implementation-plan page, final assessment,
  saved-progress redirects, and detailed Teacher/Executor integration handoff
  are implemented and verified for this scoped content change. The approved
  five-document Practice runtime is implemented with final-package approval,
  actual-content review, recoverable same-task migration and versioned handoff.
  Module 2 remains `in-progress` overall because owner acceptance remains
  pending. Module 3 includes a Local preview opening and a short GitHub
  publishing reminder. Module 4 uses the approved hosting opening and deployment
  video, then goes straight to Practice with a shareable portfolio as its goal.
  Module 4 has no assessment. This integration excludes temporary content-review
  routing and Practice bypasses. The 22 October workflow-only update implements
  Module 4 Practice, its one deployment record and reviewed completion return.
  Courseapp entry/completion wiring and course-wide acceptance remain with the
  courseapp owner. The historical M4.0 CLI
  rehearsal passed on 16 August 2026; the current browser deployment path still
  needs an authenticated learner rehearsal. F0.2 was removed by
  decision on 14 August 2026.
- **Scope:** Course migration foundation plus Modules 2–4
- **Delivery rule:** Complete, verify, and accept one module before beginning the
  next module. The content-first branch has a temporary authoring-only exception:
  content and review questions may be drafted across Modules 2–4, but official
  Practice integration, completion, acceptance, and release gates remain in order.
  On 22 October 2026 the owner explicitly requested Module 4 Practice development
  alongside Module 2/3 student reviews, then restricted this work to Practice
  workflow. This authorizes that scoped implementation; it does not grant any
  preceding live acceptance, courseapp changes or graduation approval.
- **Pacing rule:** Mastery-based and resumable; no fixed lesson duration or
  completion-time promise
- **Practice project:** One learner-owned portfolio workspace shared by Modules
  2–4

## Progress ledger

Update this ledger from repository evidence as part of each affected
checkpoint's definition of done. Implementation and verification are technical
states. Owner approval and pilot acceptance require their own explicit evidence
and must never be inferred from a passing automated check.

| Phase | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| Foundation | `in-progress` — preserved integration and Practice lifecycle repairs; native macOS and overall acceptance remain outstanding | `passed` for the 22 October Windows Practice batch: typecheck, lint, 711 unit tests (three skips), nine startup checks, build, full Electron smoke/chat/guide, disposable Module 2→3→4 rehearsal and preservation/diff audits; the later exact restart-copy edit received narrow verification | `pending` overall; existing scoped approvals and requested merge remain recorded | `pending` | Present the owned workflow and obtain native macOS/overall acceptance evidence. |
| Module 2 | `in-progress` overall — five-document Practice is implemented, including Finder-metadata handling and original-task continuity; incoming theory/mastery preserved | `passed` for the 22 October Windows Practice batch and Module 2→3→4 rehearsal described below | `pending` overall; prior five-document design/migration approvals remain recorded, not final runtime acceptance | `pending` | Obtain live learner/AI evidence and explicit runtime acceptance; hand courseapp student findings to its owner. |
| Module 3 | `implemented` — approved v2 Practice, current archive/restart recovery, complete source fingerprints and task-acceptance freshness; all incoming course scenes/questions preserved | `passed` for the 22 October Windows Practice batch and Module 2→3→4 rehearsal described below | v2 design/implementation approved 13 September; student-review repairs requested 22 October; exact continuation restart copy approved; runtime acceptance `pending` | `pending` | Obtain real learner/AI and owner runtime acceptance; preserve the mixed working tree. |
| Module 4 | `in-progress` overall — Practice, course-page entry, reviewed return and terminal completion recording are `implemented`; course-wide acceptance remains separate | `passed` for the 29 October Windows delivery batch, disposable journey, live publication and QA-only completion described below; real beginner/AI/native acceptance is separate | Scoped implementation and subsequent end-user QA/repairs authorized; public sample release, two exact wording corrections, beginner review policy and current-branch commit/push explicitly approved; final learner/runtime acceptance `pending` | `pending` | Commit and push the verified current branch; retain real beginner-pilot, native macOS and overall acceptance gates. |

### Module 1 completion page removed and quiz answers reordered, 16 November 2026

Implementation: `implemented` on branch `portfolio-agents-md`. Passing the
Module 1 assessment now records `m1-complete` and returns to Home Base with
Module 2 opening at `module-2-portfolio-workspace`; the `module-1-complete`
page is gone. Saved progress on that page resumes at the same destination
and the page is dropped from review history. The small "AGENTS.md - bộ quy
luật cho coding agents" label above the Module 1 AGENTS.md page heading is
removed. Three Module 1 quiz questions now place the correct answer at
positions 3, 2 and 4 instead of first; the owner confirmed the reorder and
the frozen digest for `module-1.quiz.json` was updated.

Verification: typecheck and lint `passed`; progress-repository, frozen
Module 1, Teacher course-context and start-prompt tests pass (51). The full
unit suite, build and `test:electron` were not run.

### Portfolio AGENTS.md covers Modules 2–4, 15 November 2026

Implementation: `implemented` on branch `portfolio-agents-md`. The owner
chose to write the file once, at Module 2 folder confirmation, rather than
update it in later modules. The template keeps its existing text verbatim and
adds owner-approved wording: a "Cách dùng tệp này" section telling Codex to
follow only the current module's section (named by the Course Companion
instructions in the task; Module 2 when none is named and no application code
exists; otherwise ask the learner), plus "Module 3: xây website" and "Module
4: đưa portfolio lên mạng" sections. Because nothing rewrites the file after
Module 2, the Module 3 application fingerprint and the Module 4 clean-commit
release check are unaffected. The detailed Practice instructions sent by
Course Companion in Modules 3 and 4 are unchanged.

Verification: the new heading-order and scoping test plus the existing
template, workspace-repository and picker tests pass (29); typecheck and lint
`passed`. The full unit suite, build and `test:electron` were not run, because
the file-writing path is unchanged. Workspaces created earlier on this branch
keep the previous template, since the file is never overwritten. Next:
rehearse Modules 2 and 3 in Codex and confirm Codex applies only the current
module's section.

### Learners told about the course AGENTS.md, 15 November 2026

Implementation: `implemented` on branch `portfolio-agents-md`, with
owner-approved wording. After **Tạo thư mục planning**, the folder picker
shows "Đã tạo AGENTS.md — Đây là luật làm việc của khoá học này, Codex sẽ
dựa vào đây để hướng dẫn bạn." only when the portfolio root actually holds
a regular `AGENTS.md` file (`agentsPath` on the workspace view), so older
workspaces never see a false notice. The Module 1 "Hai level AGENTS.md"
page, the Module 1 Pilot lesson and Teacher script now say Course
Companion will create that file in Module 2; the script no longer says
the learner creates it. Frozen Module 1 digests were updated for these
two approved files.

Verification: typecheck, lint, build and `test:electron` `passed`; the
same 79 unrelated unit failures remain. Both pages were inspected at
1180×780; the notice and the added line fit without moving navigation.

### Module 2 sample-prompt pages removed, 15 November 2026

Implementation: `implemented` on branch `portfolio-agents-md`. At the owner's
explicit request, the pages `module-2-prd-sample-prompt` and
`module-2-implementation-plan-sample-prompt` were removed: their copy
buttons sat before portfolio-folder selection and invited learners to run
Codex early, outside the chosen folder. The implementation-plan intro now
ends with the owner-approved sentence "Prompt mẫu sẽ được cung cấp ở phần
thực hành cuối module."; the Teacher script quotes it and no longer
describes the removed pages. Saved progress on either page resumes at the
next page (`module-2-prd-agent-workflow` or `module-2-portfolio-folder`).

Verification: typecheck, lint, build and `test:electron` `passed`; new
redirect tests pass; the same 79 unrelated unit failures remain. The intro
page was inspected at 1180×780: the added paragraph fits and Continue stays
visible. At 390px the plan board overlaps the intro copy, identically
without this change; that narrow-layout issue is separate.

### Module 2 rules moved into the portfolio AGENTS.md, 15 November 2026

Implementation: `implemented` on branch `portfolio-agents-md`. When the
learner confirms **Tạo thư mục planning**, Course Companion also writes
`AGENTS.md` at the portfolio root (`shared/portfolio-agents-template.ts`). It
never overwrites an existing copy and is not added to existing workspaces on
load, because the Module 3 application fingerprint covers root files. The
Module 2 start prompt keeps its approved first paragraph and ends with
"Hãy làm theo AGENTS.md trong thư mục này."; the folder, package, approval
and submission rules now live in `AGENTS.md`. The picker consent line names
the new file. The owner approved the direction and the drafted wording.

Verification: typecheck, lint and build `passed`. Unit tests: the three new
or rewritten checks pass. 79 failures in
`portfolio-module-completion-service`, `portfolio-package-review` and
`portfolio-release-package` also fail identically without this change.
`test:electron` `passed` (smoke, Teacher chat, Practice guide and review
feedback), including the new `['AGENTS.md', 'planning']` folder check.

Two regressions from earlier 15 November commits were repaired to reach
that result. The navigation-only Module 1 completion page rendered its
**← Trang trước** and **Mở Module 2** buttons under the HUD, so they were
not visible or clickable; they now sit at the bottom of the stage where
dialogue actions sit on other pages (inspected at 1180×748 and 1440×900).
The smoke test also still clicked **Tiếp tục** five times to reach the
portfolio-folder page; the two sample-prompt pages make it seven.

Learners whose workspace already exists keep no `AGENTS.md`; decide whether
they need a fallback. Next: rehearse Module 2 in Codex with the short prompt
and confirm Codex reads the generated `AGENTS.md`.

### Reviewing completed modules from Home Base, 15 November 2026

Foundation navigation: `implemented`. Completed earlier modules open at their
first outline page. The learner can browse the module and return to the saved
lesson through the outline. Question previews show the prompt and choices,
and the portfolio-folder preview displays the lesson text.

Verification: `passed` for typecheck and lint under the renderer UI gate.
Desktop verification is pending. The next check is to open Module 1 from a
Module 2 roadmap, browse its lessons, then resume at the saved Module 2 page.

### Main integration verification — 15 November 2026

| Scope | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| Foundation / I4 / M2.6 / M3.8 / M4.8 — whole-branch integration | `implemented` for the existing integration; overall module states above remain unchanged | `passed` for the fresh Windows integration batch below | PR and merge of the whole current branch into `main` explicitly requested; runtime and overall course acceptance remain separate | `pending` | Deliver the verified integration through PR #7; retain beginner-pilot, native macOS and overall acceptance work. |

The owner requested integrating the complete
`codex/practice-workflow-to-triet-v3-planning` branch into `main`, including the
updated course-introduction README and its portfolio journey diagram. The
README now describes the current four-module portfolio course, five-document
planning package, continuous task, Practice review and startup flow. No runtime,
lesson, assessment, learner file or saved progress changed during this delivery.

Fresh checks at `b5cbcd9` passed:

- `npm run lint`.
- `npm exec -- vitest run --maxWorkers=2`: 93 test files, 794 tests passed and
  three existing skips. The established two-worker setting was retained.
- `npm run test:startup`: all nine startup checks passed.
- `npm run test:electron`: typecheck, production build, Electron smoke, Teacher
  chat, Practice guide and deferred review-feedback suites passed.
- `node tests/portfolio-package-electron.mjs`: the disposable Modules 2–4
  journey passed, including five-document review, original-task continuity,
  current approval, archived revision, mastery, reviewed release return and
  desktop/narrow controls.
- Root README local links, balanced Markdown code fences and scoped
  `git diff --check` passed. The diagram was checked in source; no rendered
  Mermaid preview was inspected.

Local logs are `.superpowers/qa/main-merge-{lint,unit,startup,electron,portfolio}.log`
and remain ignored. Electron and portfolio journeys used disposable simulated
profiles, not the learner's normal profile or a live deployment. These checks
do not grant beginner-pilot, native macOS, runtime or overall course acceptance.
The previously recorded assessment outline-preview presentation gap remains
open. The ledger-only delivery record does not change verified runtime code.

### Module 1 Model, Effort and Speed presentation — 4 November 2026

| Scope | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| Foundation / preserved Module 1 theory pages | `implemented` | `passed` for typecheck, lint, 797 unit tests, nine startup checks, production build and the Electron smoke/Teacher/Practice suites described below | Mockup and integration explicitly approved; final app review `pending` | `pending` | Review the integrated lesson in the normal app with the current learner progress preserved. |

The existing `module-1-codex-model-intro` and `module-1-codex-effort-speed`
pages now display the owner-supplied menu image on the left, with arrows and
highlights for the selected explanation on the right. The first page contains
Overview and Model; the second contains Effort and Speed. Local topic switches
do not save progress or award checkpoints. All scene IDs, course pages,
assessment questions, Practice rules and navigation destinations are preserved.

The approved personal Model explanation, exact Effort/Speed wording and OpenAI
reference button are synchronized with the runnable lesson and Teacher script.
Redundant captions and eyebrow text are absent; the owner also requested removal
of the Overview footer's “Làm quen với ba mục” label. Screenshot pixels remain
unchanged. Frozen-content hashes changed only for the three approved content
files; the frozen scene inventory remains unchanged.

Verification: typecheck, lint, 797 unit tests and nine startup checks passed.
Unit fixtures required `TMPDIR=/private/tmp` on macOS to avoid a noncanonical
temporary-path mismatch. Production build and Electron smoke passed, including
exact displayed copy, highlight selection, local-topic progress invariance,
back/forward review, and desktop/narrow layout checks. Visual inspection covered
1024px, 1440px and 390px windows; the narrow content scroll was repaired and the
reference link was confirmed reachable above the footer. The final full `npm run test:electron` run, including Teacher chat, Practice
guide and review-feedback suites, passed. An earlier optional Teacher screenshot
timed out; the subsequent full run completed successfully. These use disposable profiles
and simulated AI responses, not learner or live AI acceptance.

Local evidence: `/tmp/model-tests-canonical.log`, `/tmp/model-lint.log`,
`/tmp/model-final-electron.log`, `/tmp/model-other-electron.log`, and
`/private/tmp/model-controls-qa/`. The earlier, separately requested Practice
resume fix remains outside this UI checkpoint. Existing live learner progress
is retained. Overall Foundation and module acceptance gates remain unchanged.

Port to `main`, 15 November 2026 (owner-requested, design only): branch
`codex/model-controls-design` brings over `1e8bd82`, the four cross-page tabs
from `decd352` with the working navigation wiring from
`codex/module-1-checklist`, and that branch's Effort/Speed footer-stability fix.
The Module 1 self-check checklist and the 6→4 quiz reduction were deliberately
not brought over; Practice, assessment and every page are unchanged. Typecheck,
lint, 797 unit tests, build and `npm run test:electron` passed. Final app
review remains `pending`.

Same branch, 15 November 2026: the home page no longer crashes when saved
progress is on `module-1-setup-checklist` (it uses the preceding page's
position, as the lesson view already did). At the owner's explicit request the
Module 1 review drops questions `m1-q3` (Full access) and `m1-q4` (Sol vs
Luna); four questions remain and the pass mark is 3/4. Pages
`module-1-final-5` and `module-1-final-6` are retired, and saved progress on a
retired page or with retired answers resumes at the first unanswered remaining
question or the summary (migration taken from `codex/module-1-checklist`).
Only question counts and the pass mark changed in the lesson, Teacher script,
start prompt, delivery contract and mastery rubric; Practice is unchanged.
With `m1-q4` gone the review has no short-answer question; at the owner's
request the rubric no longer asks for a written explanation, and choice A of
`m1-q6-skills` now reads “Tạo một Skill với tệp SKILL.md.” The review result
pages centre their message and use a compact continue button.
Commit `31c524a` left the smoke test expecting six questions; the follow-up
commit corrects it to four. Typecheck, lint, 798 unit tests, build and
`npm run test:electron` then passed. Final app review remains `pending`.

On 15 November 2026 the owner requested removal of the blank Module 1 page
after the assessment result. The result is now page 6/6. Continuing after a
pass records completion and opens the roadmap with Module 2 ready. Reviewing
the last page returns directly to the current lesson. Existing saves on the
removed page resume at the Module 2 opening, and older review histories omit
the retired page.

Implementation is `implemented`. Scoped verification `passed` for typecheck,
lint, build, progress and outline tests, and both navigation paths in Electron
with disposable profiles. Full-suite verification `failed` on the quiz file
digest and portfolio review/completion tests. The Electron smoke run completed
the Module 1 flow and later timed out looking for “Thoát ứng dụng”. Final app
review and pilot acceptance remain pending.

### Continuation banner and Module 2 quiz-blocker feedback — 29 October 2026

| Scope | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| Foundation / I4 / M2.3 / M2.6 / M3.8 / M4.8 — feedback only | `implemented` | `passed` for scoped typecheck/build and diff review; runtime acceptance remains separate | Both feedback corrections and commit/push with handoff update explicitly requested | `pending` | Deliver the verified feedback changes on the current branch; continue the owner's manual run without resetting it and retain the separate acceptance gates. |

Module 3/4 transition labels now describe checking/reconnecting the original
handed-off task and show a failed-continuation label after an error. The brief
stops its spinner while an error is displayed and no retry is running. The
Module 2 summary explains the count of answers not correct and points to the
existing retry action when the completion button is disabled. Completion,
approval, evidence freshness, task continuity, pages and assessment rules are
unchanged. The existing successful-summary copy is preserved.

These small feedback edits used the trivial-edit fast path. Typecheck,
production builds and scoped diff review passed; full lint/unit/startup/Electron
and screenshot checks were not repeated. Local build logs are
`.superpowers/qa/course-fresh-start-build.log` and
`.superpowers/qa/module-two-summary-feedback-build.log`. The owner's fresh
manual run is ongoing, with prior app state backed up locally and external
portfolio files/Codex chats preserved. The summary fix needs the next app
restart; the current testing session was left intact. An observed blank
assessment page in outline preview remains an open presentation issue, not a
passed acceptance check or an included repair. The merge handoff records it.

### Cleaner Practice surfaces and subtle motion — 29 October 2026

| Scope | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| Foundation / I4 / M2.5 / M3.8 / M4.8 — Practice presentation only | `implemented` | `passed` for Windows build/typecheck, lint, unit/startup, Electron and visual checks below | Cleaner boundaries and subtle interaction motion explicitly requested; commit, push and updated handoff authorized 29 October; final visual acceptance remains `pending` | `pending` | Deliver this verified UI/handoff batch on the existing branch, then review it with learner-owned work; retain live learner, AI review, native macOS and overall module acceptance gates. |

Practice prompt, next-action, submission and review sections now use spacing,
typography and quiet separators instead of nested outlined cards. Secondary
controls use subdued fills, and the primary gold action loses its raised rim.
The Teacher panel has an opaque neutral background and a faint outer edge so
the application behind it does not interfere with reading. Checklist, hint,
approval, introduction and success styling follow the same quieter treatment.
Only Practice CSS changed; existing copy, pages, routes, review requirements,
task binding, persistence and learner approvals remain unchanged.

Buttons receive 180ms color/depth transitions and gentle press feedback;
primary actions lift one pixel on hover. Panel entry, feedback and disclosure
content use short reveals, with smooth disclosure height changes where
supported. All added motion respects the existing reduced-motion preference.

Verification passed: production build including typecheck, lint, 775 unit tests
(three existing skips), nine startup checks, full Electron smoke/Teacher chat/
Practice guide suites, and the disposable Module 2→3→4 portfolio journey.
Desktop and narrow screenshots were visually inspected; 320/380/1024px checks
found no body or document horizontal overflow. An isolated simulated Electron
check confirmed unframed prompt sides, hover/press transforms, disclosure
opening, and zero transitions/animations under reduced motion. The first unit
attempt encountered sandbox temporary-file rename restrictions; the full
two-worker rerun passed with the required filesystem access. The one-off visual
harness initially opened Teacher before Practice startup settled; its corrected
startup wait passed. No product assertion or gate was weakened.

Local logs and visual artifacts are `.superpowers/qa/practice-clean-*`;
the broader journey screenshots remain under `.superpowers/sdd/screenshots/`.
All automated sessions used disposable simulated profiles. These results do
not establish final owner visual approval, learner acceptance or native macOS
behavior.

The owner subsequently requested commit/push and a refreshed merge handoff.
`practice-courseapp-merge-handoff-2026-10-29.md` now records the presentation
changes, full Modules 1–4 regression coverage, the QA-waiver distinction and
remaining acceptance work. No additional runtime change was made for delivery;
the existing passing checks above remain applicable. The final scoped diff and
page/scene inventory are unchanged outside Practice CSS and these planning docs.

### Windowed Teacher minimize and reopen continuity — 29 October 2026

| Scope | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| Foundation / I4 — windowed Teacher continuity | `implemented` | `passed` Windows regression batch described below | Owner reported repeated reloads during the authorized Practice UX repair; no course copy, requirements or passing gates changed | `pending` | Commit and push the verified repair and handoff update; retain overall owner, learner-pilot and native macOS acceptance gates. |

Minimizing the windowed Teacher previously unmounted `TeacherWorkspace` and
discarded its view state. Reopening mounted it again and repeated initial
chat, Practice and context loading. The panel now mounts lazily on first open
and stays mounted, hidden from display and interaction while the launcher is
shown. Reopening refreshes current data without resetting the visible panel;
unchanged chat does not trigger an automatic jump to the newest message.
Sensitive Practice actions wait for that refresh, and changed source still
invalidates an unsubmitted acceptance draft. Hints and guide presentation are
reset when the actual Practice run/generation changes. No new persisted data,
copy, curriculum, page, dependency or assessment rule is introduced.
Completed Practice return quietly restores and saves compact presentation;
the hidden panel stops workspace/focus subscriptions. A changed run clears its
old return-busy state. These lifecycle boundaries prevent a retained view from
starting old workspace reconciliation after a reviewed return.

The new disposable chat regression first failed against the original build at
the assertion that minimizing retains the existing view. The repaired chat
cycle passed. Initial focused portfolio verification exposed a race between
reopening a replaced run and the refresh button's focus handoff; sensitive
actions now wait for the background refresh rather than act on the previous
run. A subsequent full journey caught hidden-view reconciliation after Module
4 return; the visibility/return subscription boundaries and compact return
state above resolved it. The expanded Module 2→3→4 journey now passes, including
two minimize/reopen cycles with retained acceptance draft, prompt disclosure
and exact scroll position, plus automatic stale-acceptance invalidation after
editing the PRD while minimized.

Final typecheck, lint, build, all 775 unit tests (three existing skips), all nine
startup checks, Electron smoke, Teacher chat, Practice guide and expanded
portfolio journey passed. The guide regression was updated to resume its
retained paused view rather than look for the old remount-only opener; its
cross-window resume, retry and replay checks passed on the final build. The
first unit attempt could not transform files inside the filesystem sandbox;
an unrestricted default-worker run then hit existing I/O-heavy test timeouts.
All unit assertions passed with `vitest run --maxWorkers=2`, followed by the
unchanged startup suite. No timeout, test requirement or product gate was
relaxed. Logs are `.superpowers/qa/teacher-keepalive-{build,lint,unit,electron,
chat,guide,portfolio}.log`. These fixtures use disposable profiles and do not
change personal learner progress or establish learner acceptance.

The actual normal-profile course was closed cleanly and reopened on the new
build. Through its native controls, the windowed Teacher's prompt was expanded
and scrolled, minimized to the launcher, then reopened. The same disclosure and
scroll position remained visible. Local before/after screenshots are
`.superpowers/qa/teacher-keepalive-{before,after}.png`. No acceptance checkbox,
review submission or assessment gate was changed during this live check.

### Live Module 4 QA release and beginner review repair — 29 October 2026

| Scope | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| Foundation / M2.5 / M3.8 / M4.8 — current learner route and review reliability | `implemented` | `passed` for the final Windows delivery batch and observed QA route below | Owner explicitly authorized public sample GitHub/Vercel on the free tier, exact two-sentence copy repairs, more lenient beginner review and commit/push of this branch | `pending` | Commit and push the reviewed batch; retain learner-pilot and native macOS acceptance work. |

The bound original portfolio task published only the twelve reviewed sample
application files and its labelled sample screenshot. The public repository is
`DiligentPenguinn/course-companion-qa-portfolio`; Vercel's active, non-trial Hobby
scope deployed commit `d107f736b780af7330520e617069e30b37a33e18` as
`dpl_DyDMaszWeNtFZuc39vrBb4paYQC7`, available at
`https://course-companion-qa-portfolio.vercel.app/`. Vercel fetched that GitHub
commit; no local directory upload exposed planning, evidence, backups or course
files. No paid service or domain was purchased. The accepted applicationSnapshot
remains `9930023f2825a7a2519bac7244337d85e1d8dbe8d0fa3fd56ba6d8415bbaa32e`.

The parent independently opened the deployed site and checked desktop
1440×900, mobile viewport 390×844, 320px/768px overflow, the actual image,
placeholder labels, eight hrefs, keyboard anchor focus and captured console.
CTA bounds remained 818.28–866.28px desktop and 738.67–786.67px mobile at
root scrollY=0. All tested widths had equal client/scroll width; captured
warnings/errors were empty. Mobile emulation is not physical-device coverage.

The real course refresh then exposed a new blocker: a normal task reopen had
appended a second matching `session_meta` header. The metadata reader rejected
any repetition, leaving cached ready evidence while actual submission failed.
It now verifies every header's exact task/workspace and accepts matching
reopens; wrong identities remain blocking. A failed refresh also blocks new
acceptance and exposes the existing connection warning without deleting saved
evidence. Focused regression and the actual repaired live refresh passed.

A genuine Module 4 AI review was submitted and retained as needs-work. Besides
QA-versus-learner attribution, it requested verified Git/handoff facts that the
collector had checked but omitted from the review context. Source context now
includes the independently read clean committed HEAD and verified Module 3 v2
binding/checkpoint. Vietnamese command outcomes such as “npm run check đạt” are
preserved as executor reports, never promoted to independent verification.

The owner requested a more lenient Teacher for complete beginners. Portfolio
reviews now use the stated minimum rather than professional polish, accept
honestly labelled concepts/placeholders when the approved scope permits them,
allow transparent mobile emulation, avoid additional proof formats and give one
small blocking next action. Required freshness, working outcomes, authenticity,
current acceptance and prior publishing consent remain unchanged. Module 1 and
the Practice definitions/required criteria are unchanged. This is a reviewer
policy repair, not a lower numerical threshold or a claim that agent QA proves
learner mastery.

Under the owner's explicit administrative QA authorization, a separate one-use
Module 4 waiver retained the genuine review and refreshed actual task/source/
public-URL evidence before creating a clearly labelled QA-only receipt. It did
not disable production gates. Normal course controls then saved and archived
the attempt, reached `module-4-complete`, recorded `m4-complete`, and displayed
19/19 checkpoints (100%) at Home Base. The counter now excludes retired
checkpoints while preserving their saved history. The disposable journey's
initial new expected count was corrected from 14 to 12 because that fixture
deliberately skips seven teaching checkpoints; the full live QA route reaches
all nineteen.

The original learner profile hashes remain separate from this copied QA run.
QA completion is not a passed live AI assessment or beginner-pilot acceptance.
Both original Module 3 reviews and the real Module 4 needs-work review remain
preserved. QA proof, audit and disposable logs stay in ignored `.superpowers/`.

Final delivery verification passed: typecheck, lint, 775 unit tests (three
existing skips), all nine startup checks, build, Electron smoke, Teacher chat,
Practice guide and the expanded disposable Module 2→3→4 journey. That journey
also covers delayed Teacher-summary return, retired-checkpoint history and
current Home progress. Logs are `.superpowers/qa/release-done-{lint,unit,
electron,portfolio-electron}.log`. The first exact-copy sync check correctly
failed until the two owner-approved sentences were synchronized into the Pilot
lesson; the final complete batch passed. All affected renderer scene IDs remain
present. Independent GitHub inspection confirms the public sample's exact
twelve-file tree and source SHA. All seven original learner-profile JSON hashes
still match the pre-QA audit. The isolated QA app was closed after completion;
no administrative waiver code or test state enters the production commit.

### Practice prompt access, layout and Codex compatibility — 29 October 2026

| Scope | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| Foundation / F0.4 / I2 / M2.5 — folder-button alignment, Practice heading, repeatable prompt access and runtime compatibility | `implemented` | `passed` in the later 29 October progress-refresh batch below; earlier intermittent Module 4 fixture failures remain recorded and undiagnosed | Repairs, CLI update and recurring compatibility checks explicitly requested; final runtime acceptance remains `pending` | `pending` | Continue the existing learner-owned Module 2 task and obtain live runtime acceptance; retain the intermittent fixture issue for investigation. |

The portfolio Continue button now uses block layout so its automatic margins
align it with the folder panel. The generic Practice brief uses its existing
title as the heading, preserves the full objective as body text and caps the
heading at 28px. The exact existing Module 2 prompt is shared by the course
transition, Practice start/resume page and active Teacher help panel. Its copy
action stays available while the prompt disclosure is collapsed; no prompt is
sent automatically and no new guide or assessment gate is introduced.

The owner's standalone CLI was 0.147.0 while the desktop runtime was
0.164.0-alpha.11.1. The standalone installation was updated from the matching,
hash-verified desktop binaries with a backup retained outside the repository.
Every App Server connection and task reopen now resolves and verifies the
desktop runtime, preferring the currently installed app over PATH or a stale
inherited runtime path. Standalone fallback requires CLI 0.164 or newer. The
check neither installs software nor writes learner task instructions.

The rebuilt app was restarted with existing application data. A live click on
the Teacher task link opened the original empty Module 2 task;
its title and empty composer were visually
confirmed without sending a message or replacing the task. Disposable diagnostic
tasks remained separate from learner evidence. Empty diagnostic tasks were not
included in discovery with either runtime, so discovery absence alone is not
proof of failed navigation or a sufficient regression assertion.

Desktop, 390px and 320px browser checks passed for the actual components and
production CSS: no horizontal overflow, exact folder-panel/button alignment,
short heading, persistent prompt copy, clipboard failure/retry and exact prompt
text. Screenshots are under `.superpowers/qa/prompt-copy-browser/`. Course scene
IDs and order and existing prompt text are preserved. No portfolio files,
personal completion state or approval/acceptance gates were changed.

Final typecheck, lint, production build, all nine startup checks and the complete
Electron smoke, Teacher-chat and Practice-guide scripts passed. The changed
runtime checks and prompt checks passed their focused runs. A full two-worker
unit run passed 739 tests with three existing skips before the last resolver
freshness refinement. Later full runs against the finished source intermittently
failed the unchanged Module 4 approval fixture; the final one-worker run passed
738 tests, skipped three and failed one release-package test. Its initial
approval was rejected as changed/not ready before the test's intended source
mutation. Other attempts also exposed existing five-second filesystem-test
timeouts under load. Restricted-runner junction/Git permission failures were
rerun with normal local filesystem access.

The isolated release suite passed 44 tests with one existing skip, and a bounded
diagnostic passed 80 unchanged disposable release approvals. Those results do
not clear the intermittent full-suite failure. Temporary diagnostics were
removed and both the release adapter and its fixture restored exactly; this
batch makes no release-approval changes. The final full unit gate remains
`failed`, and native macOS, live AI quality and owner/pilot acceptance remain
pending. No checkpoint commit or release was made.

**Follow-up prompt correction — 29 October:** The owner found that the copied
prompt could produce one combined plan while the checker required five separate
documents, and requested correcting the prompt and its folder instructions.
The shared prompt now explicitly anchors every relative path to the selected
portfolio folder in the existing task, names all five documents and their
existing content requirements, and explains the current PRD/plan approval and
submission step. It reuses confirmed work and requires permission before
renaming, moving, deleting or overwriting an existing plan. All three copy
surfaces use this corrected text; learner files and assessment rules are
unchanged. This supersedes the earlier preservation of the original prompt
text above. Fourteen focused prompt/introduction tests, typecheck, scoped lint,
the production build and the Electron smoke journey passed. The smoke fixture
now normalizes native Windows clipboard CRLF to LF before comparing the exact
prompt. The full backend suite and separate chat/guide suites were not repeated
for this copy-only follow-up; the previously recorded intermittent full-unit
failure and owner/pilot acceptance gates remain open.

**Follow-up progress refresh repair — 29 October:** After creating all five
documents, the owner's refresh still failed because the original combined
`planning/portfolio-plan.md` was rejected as an unexpected workspace change.
The collector now preserves that exact legacy note as background material. It
does not count it as one of the five documents or include it in the reviewed
digest. Other unexpected paths, directories and linked paths remain rejected.
Read-only collection against the owner's actual workspace found five fresh
artifacts, no issues and no unexpected paths; the original note's hash was
unchanged.

Module 2's Teacher refresh now reloads actual evidence before requesting a
review. When the package is ready but still awaits learner approval, it focuses
the existing unchecked PRD/plan approval box instead of recording another
failed review. Both progress layouts point to the existing submission action.
The user must still approve and submit the current package; the repair grants
no approval, review pass or module completion.

| Scope | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| I4 / M2.5 — combined-plan compatibility and refresh-to-approval flow | `implemented` | `passed` for typecheck, lint, 747 unit tests (three existing skips), nine startup checks, build, full Electron smoke/chat/guide and disposable Module 2→3→4 rehearsal | Repair requested; live runtime acceptance remains `pending` | `pending` | Learner confirms the current PRD/plan and submits the package in the rebuilt app; retain live AI and native macOS gates. |

Forty-three focused evidence, renderer and continuity tests passed. The extended
Electron journey verifies that refresh focuses the enabled, unchecked approval
box, leaves approval absent and review-history length unchanged, clears the
old-note blocker and preserves the note. Desktop/narrow overflow checks and
the original same-task approval/review/return journey passed. Its first run
stopped earlier at an existing companion-mode settings temporary-file rename
race; the subsequent full journey passed. The complete unit run also passed
the previously intermittent Module 4 cases, without any release-adapter or
fixture changes; this does not establish their prior cause or repair.

The personal app was restarted with the final build and existing data. A final
live UI click could not be performed because both native automation connections
reported `Computer Use helper already has an active request`, including after
session recovery. Automated click verification and read-only learner evidence
are recorded separately from that unverified live click. No learner documents,
approval or completion were edited, no pages were removed and no checkpoint
commit or release was made.

**Live submission and hidden assessment feedback — 29 October:** The owner
requested that the agent operate the actual window and submit on their behalf.
The initially disabled panel recovered after reloading the renderer without
resetting saved data. The agent then operated the real checkbox and submission
button in the bound Module 2 window. The real AI review completed and persisted
five satisfied criteria and two unsatisfied criteria: the brief's intended
viewer decision/success signal and the reference's concrete original direction.
This is a genuine `needs-work` review, not a transport failure or a passed
Practice. Three of five checklist stages are verified; no completion was granted.

The compact panel had hidden the review summary and explanations, falling back
to generic step instructions for these criterion IDs. It now displays the
existing summary and unmet explanations verbatim and uses the actual explanation
as its next action. This repair is scoped to Module 2; Module 1's frozen compact
presentation is preserved. No assessment wording or criteria were weakened.

| Scope | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| I4 / M2.5 — visible compact review feedback | `implemented` | `passed` for typecheck, lint, 748 unit tests (three existing skips), nine startup checks, build, full Electron smoke/chat/guide and live narrow feedback inspection | Repair and live submission requested; document-edit approval remains pending; final runtime acceptance `pending` | `pending` | Obtain explicit approval for the two prepared personal-document clarifications, then submit the changed package through the real review. |

The initial full unit run caught an overly broad compact fallback; it was
restricted to Module 2 and 29 focused renderer tests plus the final full suite
passed. Restricted-runner startup Git writes failed and passed when rerun with
normal local filesystem access. The rebuilt renderer was loaded in the actual
Teacher window and its accessibility tree and narrow screenshot show both
previously hidden explanations. The initial stuck UI's underlying cause is not
established; renderer recovery is recorded separately from the feedback repair.

Automatic approval review rejected editing the personal brief and reference
because of the learner-owned assessment boundary. No workaround was attempted
and those files remain unchanged. A concrete draft is saved outside the learner
workspace at `.superpowers/qa/module-2-review-clarifications.md`; an explicit
approval request is pending. The original task, document content and assessment
rules remain intact. This live needs-work result does not grant module, owner,
pilot or course acceptance. No checkpoint commit or release was made.

### Actual learner-path continuation audit — 29 October 2026

The owner explicitly approved the two prepared personal-document clarifications.
They were applied with backups, preserving the original combined plan and the
other three submitted documents. The agent resubmitted through the actual
Teacher checkbox and button. The real AI review passed all seven criteria and
the normal return action archived the original Practice. The agent completed
the five-question Module 2 group through its visible controls using decisions
already documented in the approved brief. The genuine completion gate saved
the five-file handoff and opened Module 3. This is an owner-authorized agent
walkthrough, not evidence of unaided learner mastery or beginner-pilot acceptance.
This supersedes the pending document-edit approval and needs-work status above.

The agent traversed all six debugging/local-preview pages and all seven Git
pages in their normal sequence, exercised image zoom/back/continue, opened the
Module 3 Practice transition, and read the three-record disclosure. Starting
Practice and retrying through the actual buttons failed: the retained original
Codex task already has an active writer in desktop, so a second App Server
`thread/resume` is rejected. Independent read-only collection confirms the
handoff is current, all five approved hashes match, and no workspace issues
exist. The pending transition and original task are preserved. No Module 3
Practice pass, Module 4 traversal, public deployment or graduation is claimed.

| Scope | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| I4 / M3.8 / M4.8 — actual learner-path audit and continuation repairs | `in-progress` | `passed` for 767 unit tests (three existing skips), nine startup checks, typecheck, lint, build, full Electron smoke/chat/guide, desktop/narrow embedded review and the final disposable portfolio journey; second real Module 3 review satisfies sample PRD/current-source validation but leaves four authorship criteria unverifiable; actual Module 4 traversal `blocked` | Actual end-user traversal and repairs requested; four exact Module 4 status corrections, debugging lesson restoration and copy/paste continuation approved; placeholders reiterated after the real review | `pending` | Preserve both genuine reviews and the sample revision. Continuing the live path requires actual learner evidence or an explicitly approved change to how a delegated QA rehearsal is assessed; adding sample content alone cannot satisfy the remaining authorship gate. |

The current batch extends visible needs-work feedback and refresh-to-approval
behavior to all portfolio packages, connects Module 4's Practice entry and Home
resume, restores Module 3's missing onward completion action, and applies the
four approved Module 4 status corrections. Assessment option text is readable
at desktop scale and save errors are placed within the assessment controls.
No question, assessment threshold, source freshness check or review requirement
was weakened. The attempted oversized text inserted by UI automation exceeded
the existing native textarea limit; it was corrected without changing that limit.

A separate observed Module 3 debugging page replaces its approved lesson with
raw truncated planning excerpts. A concrete proposal to restore the existing
lesson verbatim and retain the five-file reference in a disclosure is pending
owner approval. Neither that copy change nor the proposed copy/paste continuation
has been applied. Native macOS, provider rehearsal, owner acceptance and human
pilot gates remain open. No checkpoint commit, push or release was made.

Final regression details: the first full unit run caught a route assertion that
assumed every renderer destination stayed within its module. The assertion now
checks the explicit cross-module completion destination and valid Module 4
scene, and the final complete suite passed. That first run also reproduced the
previously intermittent release-approval rejection; fixture failure diagnostics
were added, but the next full run passed and no cause or repair is claimed.
The expanded disposable Electron journey now uses the Module 3 completion button,
Module 4 Home resume, all four pre-Practice lesson transitions and the real
Practice entry controls. Its initial final-return wait timed out after progress
reached the completion scene; the repeat passed with archived-attempt diagnostics
enabled. That observation remains undiagnosed rather than being labelled fixed.
Desktop and 320px release approval screenshots were inspected without horizontal
overflow. These simulated checks do not stand in for the owner's actual path.

A separate disposable two-process runtime probe reproduced the active-writer
error and confirmed that the experimental queue cannot start a message from the
second process without resuming the chat. Its disposable chat was archived; no
message was queued in the personal task. Temporary main-process diagnostic
writes were removed, and the personal app was restarted in the verified build
with its original pending Module 3 transition and task intact.

**Approved continuation and lesson repair follow-up — 29 October:** The owner
explicitly approved both prepared proposals. Current Module 3 v2 and Module 4
continuation now verifies the persisted task and workspace by read-only
`thread/read`, opens that exact desktop-owned task, and leaves work instructions
to the learner. Historical Module 3 v1 behavior is preserved. The existing
instructions remain copyable in Practice and Teacher progress; the Module 4
prompt is produced only with a verified Module 3 source checkpoint. Review,
approval, source freshness and completion requirements are unchanged.

The real retained Module 3 retry succeeded through the course button and opened
the original task. The agent copied the instructions using the visible button,
opened the linked task, pasted and sent them through its normal composer, then
accepted only the proposed first bounded part. The restored debugging lesson
was also verified through the real outline: original dialogue remains the main
content, with a collapsed reference that expands to all five planning paths.
The outline return action preserved the saved Practice checkpoint.

The agent independently opened the provided first-part preview, inspected
1440×900 and 390×844, observed no horizontal overflow, activated the keyboard
skip link and verified focus on the introduction. Part 1 was accepted, and
the agent proposed a View the project link for the next bounded part. A real
preview connection timeout and its successful same-URL recheck are recorded as
environment debugging evidence, not invented application bugs. The owner then
explicitly requested placeholders for missing personal fields. They must stay
clearly labelled and never be described as real contact, profile or repository
evidence. No publication consent, independent learner mastery, passed Module 3
or Module 4 completion is inferred.

A coordination-tool follow-up was correctly treated by the Practice task as
another chat's report rather than direct learner approval; the next part's scope
approval was therefore entered through the normal chat composer. The records
distinguish this delegated QA walkthrough from an unaided learner pilot.

Current focused continuation/prompt checks and build passed. The final full unit
run with four workers passed 759 tests (three skips), followed by all nine
startup checks. Earlier runs reproduced a release source-inspection failure
between an initially ready view and approval; the collector's safety rejection
is preserved, and the lower-level cause remains under investigation. The new
Electron regression and final UI checks for this approved batch remain pending.

**Actual submission and additional repairs — 29 October, 04:25:** The agent
completed two bounded implementation parts in the original personal task and
independently inspected the actual local portfolio at desktop/mobile sizes.
The agent proposed the project CTA, reproduced its below-fold desktop position,
requested a CSS-only revision, and verified that its 818.28–866.28px bounds fit
the first 900px viewport. Mobile focus and overflow checks remained successful.
The three records preserve delegated QA attribution and clearly labelled
placeholders; no missing identity, repository, media or contact fact was invented.

Through the actual Course Companion buttons, the agent refreshed evidence,
checked acceptance and submitted the personal Module 3 package. The real review
completed at 04:25:35 and returned needs-work: REQ-002/003/005/006/007 remain
unmet, and delegated-agent observations do not establish the learner's own
mastery or acceptance. It also requested source-fingerprint linkage and fuller
conversation excerpts. No assessment or personal progress was bypassed. The
owner was asked whether to provide those inputs or authorize a separate,
clearly labelled Module 4 QA rehearsal. Personal Module 4 remains untraversed.

The intermittent release-source failure was reproduced in a fresh disposable
repository: concurrent Git inspection sometimes returns code 128 with
`.git/index: index file open failed: Permission denied`. Release Git reads now
use `--no-optional-locks` and retry only that exact transient index-read failure
at 50/100ms, at most three attempts. Persistent failures and unrelated errors
remain blocking. Seven narrow regression tests cover the boundary; a repeat
of 40 fresh repositories at concurrency two had zero failures, versus one
reproduced failure before the repair.

A separate regression reproduced a passed Module 4 return that failed to mark
`m4-complete`. The authoritative return now records that terminal checkpoint;
other modules' mastery destinations are not automatically completed. Outline
review cannot show the Module 4 success scene before the same course's reviewed
release return. The scene remains in the inventory and becomes reviewable once
earned. No page or approved lesson copy was removed.

The real embedded Teacher panel also left only a few lines for evidence below
its fixed controls. Its embedded review now scrolls as one area; standalone
Teacher behavior is preserved. Final desktop/narrow verification is pending.
The first final disposable portfolio run failed at Module 3 submission with a
generic review error; diagnostics and a focused rerun are in progress. This
failure is not treated as a pass or as personal learner evidence. No commit,
push, publication, owner acceptance or beginner-pilot acceptance is claimed.

**Final verification follow-up:** The disposable submission failure was traced
to its fixture: simulated learner/check conversation turns had been attached
to the automatic continuation message, which the approved read-only workflow
correctly no longer sends. The test-only gateway now attaches those explicitly
labelled simulated turns when its matching disposable supporting records exist
and the corresponding test flag is enabled. No production evidence check was
weakened, no personal conversation was injected, and the temporary diagnostic
logging was removed.

The final coherent batch passed typecheck, lint, 767 unit tests (three existing
skips), all nine startup checks, build, Electron smoke, Teacher chat, Practice
guide and the expanded disposable portfolio journey. Embedded Teacher controls
were verified at 1168×746 and 360×640 with a useful scrolling viewport, fully
reachable submit action and no horizontal overflow. The release journey also
asserts that unearned completion cannot be reached through outline browsing
and that a passed return records `m4-complete`. Desktop/narrow screenshots were
visually inspected. The scene inventories remain unchanged.

The personal app was safely restarted in this verified build only after its
review ended. Normal resume, roadmap and Teacher buttons reopened the same
Module 3 checkpoint and real needs-work feedback; the repaired panel scrolls
to the full review result. The bound task and all personal records are intact.
Evidence is saved at `.superpowers/qa/actual-module-3-review.png`; final check
logs are `.superpowers/qa/final-batch-{unit,lint,electron,portfolio-electron}.log`.
These automated checks do not establish a live Module 4 deployment, personal
completion, native macOS acceptance or beginner-pilot acceptance. The separate
QA-versus-personal-path question remains pending owner input.

**Owner direction, later 29 October:** The owner answered the pending question
by reiterating “just supply some placeholder” and requested no further pause
for those inputs. The walkthrough continues with an explicitly labelled sample
portfolio/concept and authorized QA proxy observations. Through the bound task's
normal composer, the agent supplied a concrete sample persona/contact/profile
brief and approved one bounded revision: back up the five current planning
documents, reconcile their sample-versus-real scope, keep the original combined
plan/history, add only truthful current-demo content and an actual screenshot,
run current-source checks, update the three records and stop for browser review.
No human-authored mastery, passed review or publication consent is inferred.
This supersedes the pending-question status above; the real prior needs-work
review remains intact while the revised QA package is prepared.

The bounded revision produced planning revision 0.2 and a labelled Alex Nguyen
sample concept using the actual portfolio frontend as its demo. It preserves
real-data/publication requirements as a separate gate, includes a real local
screenshot and keeps five original-document backups outside planning/public.
The agent read the revised documents, independently checked the actual dev UI
at 1440×900, 390×844, 320px and 768px, and verified the media, placeholders,
overflow, anchor focus and empty warning/error console. Desktop CTA remained
818.28–866.28px; mobile became 738.67–786.67px. The agent independently invoked
the actual applicationSnapshot function: digest
`9930023f2825a7a2519bac7244337d85e1d8dbe8d0fa3fd56ba6d8415bbaa32e`,
12 files/142103 bytes, matching the new records. Production-preview checks were
reported by the bound task; the parent could not independently reopen port
4173 after its temporary server stopped, so does not claim that independent
check. The live dev URL remained available.

Through the normal bound-task composer, the agent accepted the revised sample
documents/site and gave a concise explanation of the actual CTA improvement
and debugging evidence. Attribution remains authorized QA, not unaided human
mastery. After the task finished recording these decisions, the agent used
Teacher refresh, the current acceptance checkbox and actual submit button for
a second genuine Module 3 review. Its outcome is pending; no passed result,
assessment answer, personal Module 4 completion or publication is inferred.

**Second real review outcome — 04:56:55:** Teacher now marks current PRD
validation satisfied: all REQ-001–012 of the sample revision, command/browser
checks and source fingerprint match the submitted package. The four remaining
criteria are unverifiable solely because taskEvidence explicitly identifies
the observations, decisions and explanations as delegated agent QA rather
than the learner's own demonstration. The repeated placeholder instruction has
been fulfilled; it does not provide those human observations or authorize
inventing them. Both reviews and the original bound task remain preserved.
Screenshot: `.superpowers/qa/actual-module-3-sample-review.png`.

The actual learner path therefore remains at Module 3. No assessed answer was
filled, reviewer decision overridden, passed state injected, or personal
Module 4 route unlocked. Module 4 verification in this batch is the explicitly
disposable simulated UI journey, not a live learner/provider completion.
Normal gates remain intact as requested in the approved continuation proposal.
No further personal-data question is pending; the remaining limitation is
assessment attribution, not missing placeholder fields.

**Owner-authorized QA bypass — subsequent 29 October:** The owner explicitly
identified this as QA, authorized an administrative one-time gate bypass and
asked that normal checks be re-enabled afterward. A one-use maintenance script
copied the exact saved attempt into
`.superpowers/qa/admin-walkthrough-20261029/data`, retained the two genuine
needs-work reviews, and recorded an explicitly labelled QA-only bypass receipt.
It verified the exact course/run/generation/task and current source/approval
before the write, then verified original-profile file digests were unchanged.
No production gate code was disabled; normal live mode was used immediately
after the maintenance operation. The window title visibly labels QA ONLY.
The script cannot silently run twice because its target directory must be new.

The normal quick-return control exposed a separate defect: the backend saved
the mastery destination and archived Practice, but the screen kept spinning
while it awaited an AI Teacher memory summary. The return notification now
follows authoritative persistence and local context cleanup; summarization runs
in the background afterward. Focused Teacher/typecheck checks passed. A delayed
summary regression requires the Module 3 mastery screen within five seconds
despite a ten-second simulated summary. Full verification is pending the final
coherent batch. This repair does not waive review, source freshness or approval.

The owner also requested a delegated Practice aesthetic/interaction polish
without new features and specified the existing course palette. The assigned
worker preserved copy/features/gates, used existing obsidian/gold/neutral tokens
and reduced-motion-aware styling, and passed 25 focused checks. The owner
authorized committing and pushing the completed, verified batch to the current
branch; that authorization does not assert learner or pilot acceptance.

**QA route and release preflight — 29 October, 05:42:** In the clearly labelled
copied QA profile, normal saved-progress resume reached Module 3 mastery. The
agent traversed the five questions, feedback, summary, completion and Module 4
entry using the visible course controls. This is QA routing coverage under the
owner's bypass authorization, not independent learner mastery. The original
profile and both genuine needs-work reviews remain unchanged.

The agent read all four Module 4 lesson pages in sequence, expanded the hosting
image, watched the complete 2:12 deployment video, opened the actual release
Practice, copied its repeatable prompt and used “Mở lại task Codex” to reopen
the original bound task successfully. The copied prompt was pasted and sent
through the normal task composer. Release preflight is running against the
unchanged accepted source; no repository creation, push or deployment has been
authorized or performed. Existing GitHub/Vercel sign-in was inspected without
exposing credentials. The two premature pre-Practice publication-status
sentences have a prepared exact-copy proposal awaiting owner approval; all
pages and current copy are preserved meanwhile.

The latest coherent polish/return batch again passed lint, 767 unit tests
(three existing skips), nine startup checks, typecheck and build. Electron
smoke, Teacher chat and Practice guide passed; the expanded portfolio journey
with the delayed-summary regression is still running. Logs are
`.superpowers/qa/qa-polish-final-{lint,unit,electron,portfolio-electron}.log`.
The expanded portfolio journey subsequently passed, including arrival at
Module 3 mastery within five seconds while Teacher summarization was delayed
ten seconds. All seven original-profile JSON hashes still match the bypass
audit. No production QA-bypass switch or assessment exception was introduced.

The actual bound task prepared source-only local commit
`d107f736b780af7330520e617069e30b37a33e18`; independent Git inspection confirms
exactly the twelve accepted application files, a clean worktree and unchanged
Module 3 applicationSnapshot. Planning/evidence/backups are locally excluded
and preserved. A concrete public sample GitHub/Vercel proposal is awaiting
owner consent; no remote repository, push or deployment exists. Module 4 live
deployment/review and final delivery remain pending. No pilot acceptance is
inferred.

| Current QA batch scope | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| M3/M4 continuation, return responsiveness, repeatable prompts, Practice visual polish and normal learner gate regressions | `implemented` | `passed` for Windows typecheck/lint/unit/startup/build/Electron/disposable portfolio checks | Workflow repair, QA-only administrative bypass, existing palette and eventual current-branch commit/push explicitly authorized; exact two-sentence status proposal and public sample publication remain pending | `pending` | Continue actual Module 4 publication only with the prepared explicit consent; preserve the original learner profile and normal checks. |

### Beginner Practice clarity and completion feedback — 28 October 2026

| Scope | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| Foundation / I4 / M2.5 / M3.8 / M4.8 — Practice presentation only | `implemented` | `passed` for the Windows checks below | Design and exact-page copy changes approved; owner then requested the corresponding Module 2–4 changes, clearer post-review hierarchy and visual congratulations. Final visual/runtime acceptance remains `pending`. | `pending` | Review the refreshed app with learner-owned work; keep live AI, provider, native macOS and overall module acceptance gates open. |

All four current Practice introductions now use a short learning goal, three
instructions and one primary start/resume action. The required settings or file
reference stays available in a native disclosure. Before the requested task
exists, empty telemetry and pending progress no longer compete with the brief.
Existing switching, retry, restart history and unrelated Practice rendering are
preserved. Approved Vietnamese presentation copy lives in
`practice-introduction-copy.ts`; lesson and assessment sources are unchanged.

The compact review panel now puts the next action first, followed by subdued
progress and the expandable checklist/history. It no longer repeats the current
step or announces routine first-review metadata. Refreshing a review returns the
progress scroll to the top. Full Module 1 raw configuration and portfolio
checklists remain available in disclosures with actionable blockers preserved.

A current passed review with permission to return displays a gold check
medallion, finite decorative-star animation, “Làm tốt lắm!”, the module's actual
Practice outcome and one primary save/return action. All four modules share
this presentation; it does not declare the module or course complete. Reduced
motion disables the animation. Review/return, explicit approval, task binding,
evidence freshness and the existing guide anchors remain authoritative.

Verification passed: TypeScript, lint without warnings, 723 unit tests (three
existing/environment skips), nine startup checks, production build, full
Electron smoke, Teacher chat, Practice guide and the disposable Module 2→3→4
portfolio rehearsal. The first full run caught an out-of-palette icon color and
a changed compact-renderer expectation, both repaired. Its existing 500-entry
filesystem test also timed out under concurrent build/test I/O; the focused
rerun and subsequent full run passed without changing the test or its timeout.
The smoke fixture's old Module 2 heading was updated after its first run stopped
at that expectation. The final three Electron scripts passed against the final
build. An extra npm worker flag reached the startup command rather than Vitest;
the final full unit pass used the normal worker configuration.

Isolated rendering of the actual introduction/progress components and production
CSS passed desktop, 390px and 320px no-overflow checks, desktop start visibility,
native keyboard disclosure, next-action ordering, visible success return action
and reduced motion. Desktop Module 1, narrow Module 3, the needs-work state and
the 320px success state were visually inspected. Artifacts are under
`.superpowers/sdd/screenshots/practice-introductions/`. The isolated visual
harness initially needed a visible window for reliable Windows capture and a
complete comparison fixture; those test-harness issues were corrected.

The scoped diff changes no lesson scenes, route registries, theory, assessments,
Practice definitions, backend/IPC, dependencies or persisted-data formats. All
automated journeys use disposable data and explicitly simulated AI/provider
responses. No personal progress was reset and no learner review or acceptance
was fabricated. The existing Module 4 courseapp entry integration gap remains
with its owner.

### Practice-only Module 4 and Module 2/3 student review — 22 October 2026

The owner requested Module 4 Practice and concurrent picky-student reviews of
Modules 2/3, then clarified: “we only work on the practice workflow, everything
in the courseapp is not ours”. This update supersedes the earlier development
deferral only for that scope. Existing lesson pages, dialogue, quizzes,
navigation and completion copy remain with the courseapp owner.

Practice implementation is `implemented`; final batch verification is `passed`.
Typecheck, lint, 711 unit
tests (three skips), nine startup checks, production build, full Electron
smoke/Teacher chat/Practice Guide and the disposable
Module 2→3→4 rehearsal have passed. The 500-entry filesystem test uses a scoped
15-second timeout after the first full run exceeded its default five seconds
under concurrent Windows I/O. Two pre-existing intentional skips and one
Windows file-symlink privilege skip remain; directory-junction checks ran.

| Affected checkpoint | Implementation | Verification | Current output / remaining gap |
|---|---|---|---|
| M2 Practice evidence | `implemented` | `passed` | Regular Finder metadata no longer blocks a valid package or consumes the entry budget; links/directories and unrelated dotfiles remain rejected. |
| M3.8 continuity/review | `implemented` | `passed` | Nested application paths participate in source digests; unchanged archived v2 stays archived, changed evidence reopens the original task without approval, and restart retains the full previous run. Continuation checks approved planning digests without reapplying Module 2's no-application-files constraint. Learner acceptance changes after review require fresh approval/review. |
| M4.2 / M4.4 release evidence | `implemented` | `passed` | One bounded deployment record binds the Module 3 baseline, actual clean committed application source, deployment revision and reported build/browser checks. Root generated Vercel metadata is excluded; untracked or Git-ignored application source blocks approval. |
| M4.3 / M4.5 / M4.6 sharing boundary | `implemented` for the current one-package workflow | `passed` for deterministic verification | Public HTTPS lookup/requests are bounded, DNS-pinned and exclude credentials/private destinations. Reachability is independently observed; provider revision, browser behavior and publication consent remain reported and require exact-task review. Starting Practice never commits, pushes, logs in or deploys. Live authenticated provider/learner rehearsal remains pending. |
| M4.7 removed assessments | `implemented` for the 6 October scope | `passed` | No ownership essay, transfer project, quiz, mandatory separate Preview or rollback exercise is restored. Five internal criteria/checklist entries support one final submission; they are not five learner approval gates. |
| M4.8 owned Practice lifecycle | `implemented` | `passed` | Same task/folder, explicit final acceptance, fresh source/URL/task review, immutable receipt, ordinary-progress bypass prevention, return and full archived attempt are implemented. Courseapp entry wiring, completion copy and course-wide acceptance remain outside this work. |

The extended Electron rehearsal uses actual disposable local Git commits and
actual Practice controls with explicitly simulated AI/provider/public-URL
observations. It proves the workflow, not live deployment or AI review quality.
The Module 4 host entry is invoked through the existing public Practice API;
the owner must wire its current courseapp button. Desktop 1024px and narrow
360/320px screenshots were captured; 1024/320px were visually inspected after
correcting the new record-path layout, with no horizontal overflow.

The independent preservation audit reconstructs all seven inspected courseapp/
Pilot files from the incoming merge plus the saved recovery stash. Module 3's
22 scenes and Module 4's six scenes retain their IDs and order. No new courseapp
edits from this batch remain. Courseapp student findings and exact integration
contracts are in [the owner handoff](practice-courseapp-handoff-2026-10-22.md).
After the full batch passed, the owner approved the exact continuation restart
paragraph and button. Modules 3–4 now explain that the new attempt keeps the
current task/files/history; other modules retain their existing copy. This small
copy edit received a scoped render check for both variants and the busy state,
TypeScript checking and focused lint; the full runtime suite was not repeated
for that exact-copy change under the root trivial-edit fast path.

Next permitted action: hand the Practice API
contract to the courseapp owner, and rehearse with real learner/provider/AI
evidence. Owner runtime acceptance, pilot acceptance and native macOS evidence
remain pending. The owner subsequently requested committing and pushing
everything to `codex/practice-workflow-to-triet-v3-planning`. This authorizes
including the preserved earlier mixed work in this checkpoint and publishing
the existing integrated branch history; it does not grant runtime acceptance.
No implementation changed after the recorded checks except the approved,
narrowly verified restart copy. Courseapp integration gaps remain as recorded.

### Incoming content integration — 22 October 2026

The owner requested merging `origin/triet-v3-planning` at `22e8c2b` into
`codex/practice-workflow-to-triet-v3-planning` and continuing the agreed work
split: Triết owns theory/course content; this branch owns Practice/runtime.
Incoming approved Module 3 Local preview and publication content and Module 4
hosting/video content are retained. The five-document Module 2 runtime,
workspace picker, current-task review and Practice UI remain authoritative.
New handoffs open Local preview; reviewed v2 handoffs to the previous debugging
opening remain readable without relaxing version or evidence requirements.

Integration implementation is `implemented`; combined verification is `passed`.
Merge commit `59135d9` has parents `eb00973` and `22e8c2b`; both histories are
retained. All saved uncommitted work, including the approved Module 3 Practice
v2 runtime, was restored. All 12 previously untracked files match the saved
snapshot. Stash `f19888e8fa67addf760dded6a0915e00c677da4a` remains as a recovery
copy. The restored work and follow-up rehearsal/ledger edits remain uncommitted
in the existing mixed working tree; no checkpoint packages unrelated work.

Combined Windows verification passed: typecheck, lint, 531 unit tests with two
intentional skips, nine startup checks, production build, full Electron smoke,
Teacher chat and Practice Guide, and the disposable Module 2-to-3 v2 portfolio
rehearsal. The rehearsal now explicitly verifies the Local preview destination
before continuing the same Codex task. Its targeted lint and strengthened
rehearsal passed after that assertion was added. Desktop/narrow screenshots of
Local preview (1180/390px) and v2 Practice (1180/360/320px) were captured; desktop,
390px and 320px screenshots were visually inspected and no-overflow checks pass.
The source inventory audit preserves all 22 incoming Module 3 scenes and six
Module 4 scenes in order; theory copy and all five Module 3 questions match the
incoming branch. The existing approved v2 Practice-entry instructions remain
on the Practice-owned surface. Windows newline parsing in the incoming content
audit and a stale Module 4 assessment fixture were repaired. Diff checks pass.

These checks use disposable data and simulated Codex; live AI quality, native
macOS fullscreen behavior, owner acceptance and pilot acceptance remain pending.
Next permitted action: rehearse the current Module 2/3 Practice with real
learner-owned work and record explicit acceptance. Keep Module 4 Practice and
graduation deferred until the required preceding gates and scoped approval.

### Module 3 Practice v2 — 13 September 2026

The owner approved the recommended student-perspective revision with “let's do
it”. This is explicit authorization for the scoped Module 3 Practice change,
not acceptance of Module 2/3 or permission for Module 4 integration. The
[approved design and implementation plan](module-3-practice-v2-design.md)
supersedes the former fixed-slice/eight-artifact requirements in M3.2–M3.8.
Earlier verification entries and v1 checkpoint detail remain historical.

| Checkpoint | Implementation | Verification | Current output / remaining gap |
|---|---|---|---|
| M3.1 — Practice entry and authority | `implemented` | `passed` | Practice introduction, lesson/script/prompt, manifest and three records match v2; all 21 scenes, theory wording and five questions are preserved. |
| M3.2–M3.4 — build from the approved plan | `implemented` | `passed` | Codex continues the original task and requests acceptance of manageable plan-derived parts. Fixed four-part receipts and separate neutral-scaffold approval are historical v1 rules. |
| M3.5 / M3.7 — learner-directed improvement | `implemented` | `passed` | One learner-directed improvement, including refinement during the build, is required. No separate extra feature is required. Learner authorship is cross-checked with bound-task evidence. |
| M3.6 — evidence-based debugging | `implemented` | `passed` | Earlier real debugging counts, independently of improvement order. An explicitly approved reversible practice fault is allowed only with honest labeling, removal and rechecks. Live teaching quality remains unverified. |
| M3.8 — review, continuity and completion | `implemented` | `passed` | Source/evidence digests, explicit website acceptance, review lifecycle, migration and archived completion pass focused tests and the extended Electron journey. Live AI review quality and learner acceptance remain pending. |

Technical checks passed: typecheck, lint, production build, 529 unit tests with
two intentional skips, nine startup checks, full Electron smoke/chat/guide and
the extended disposable portfolio rehearsal. The latter continues Module 2's
original task into Module 3 v2, verifies three records and one website approval,
submits a simulated content review, returns through archived completion and
requires all five mastery answers before saving the v2 handoff. The rehearsal
also caught and fixed a hardcoded v1 Practice-entry identity. Desktop (1180px)
and narrow (320px/360px) layouts passed no-overflow checks; desktop and 320px
screenshots were visually inspected. All 21 scene identities remain in order,
theory text and final questions are unchanged, and diff checks passed.

Simulated review verifies lifecycle behavior, not live AI assessment quality or
learner acceptance. Those gates remain open. No checkpoint commit was made in
the mixed working tree; pre-existing changes remain intact.

V1 definitions and templates are retained. A readable legacy attempt is
archived before conversion to a fresh v2 generation; files and the original
task remain intact. The final package contains the five planning inputs,
three supporting records and a bounded source fingerprint. Source/evidence
changes invalidate approval; source changes after the validation record require
updated checks. Completion still requires the five existing mastery answers.
No personal learner progress or linked task was used for testing.

### Portfolio progress availability repair — 12 September 2026

| Scope | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| I4 / M2.4–M2.5 — readable planning task incorrectly blocked | `implemented` | `passed` for 50 focused tests, 517 unit tests (two intentional skips), nine startup checks, lint, typecheck, build, full Electron smoke/chat/guide, disposable portfolio rehearsal and read-only reproduction against the owner's bound task | Failure investigation and repair requested; live experience acceptance remains `pending` | `pending` | Rehearse a new live hint from the existing task in the rebuilt app; automated and read-only checks do not establish live response quality. |

The owner's connected task used GPT-6 Astra with incomplete normalized model/
effort labels and a portfolio folder without Git. The settings normalizer marked
those values `unverifiable`; both hints and portfolio review incorrectly treated
that as a lost connection when optional Git evidence was unavailable. A read-only
check of the exact bound task reproduced the old rejection and confirmed the
new availability check permits this case. All five planning files were absent
at diagnosis, independently of this connection bug.

Hints, package review and return revalidation now share the same availability
check: unknown settings do not prevent reading an otherwise verified, connected
planning task without Git. Hint context describes the freshly read conversation
as ready while retaining the separate `git-unavailable` evidence limitation;
the persisted activity record is not rewritten to claim Git verification.
Stale/disconnected settings, wrong task identities,
active work and actual reconciliation failures remain blocked. Module 1's model/
effort assessment and all package content, approval and freshness gates are
unchanged. Regression cases cover unknown settings through hints, review and
return, as well as the rejected cases. No learner data or task settings were
edited by the diagnostic check.

### Practice visual consistency and Triết voice — 12 September 2026

| Scope | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| Foundation / I4 / M2.4–M2.5 — document rows, casing and Teacher voice | `implemented` | `passed` for lint, typecheck, 510 unit tests (two intentional skips), nine startup checks, build, full Electron smoke/chat/guide, disposable portfolio journey and desktop/narrow visual inspection | Changes explicitly requested; final visual and live voice acceptance remains `pending` | `pending` | Review the updated app, request a new live hint and assess the voice; technical checks do not establish live teaching quality. |

The five-document list uses muted outline document icons, aligned file/status
rows and fine separators. Removing inherited list indentation gives long paths
more room; the semantic list and all filenames/status messages remain intact.
The 320/360 px windowed layouts and desktop view were inspected without
horizontal overflow. Icons describe documents and never imply a passing review.

Practice review loading now reads “Đang cập nhật và kiểm tra…”, matching the
idle action's sentence case and wording. The sweep covers Practice progress,
evidence and stage states, guide, restart confirmation, folder selection and
launcher labels. Acronyms and canonical paths retain their required casing;
theory lesson wording and navigation remain unchanged.

Shared Teacher voice instructions follow the approved Module 2 theory dialogue
and the teacher-system-prompt language contract: Triết uses “mình” / “bạn”,
explains a useful reason, and guides one learner-owned next step. Hints no longer
infer an unmade decision from missing files. The same voice applies to chat and
learner-facing review prose; JSON contracts, evidence gates and hint limits are
unchanged. The hint footer and simulated hints follow that voice too. Automated
checks verify instruction delivery, not live model quality; owner rehearsal of
new live hints remains required.

### Movable Teacher launcher — 12 September 2026

| Scope | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| Foundation / I4 — floating Teacher launcher | `implemented` | `passed` for focused layout/control checks, full regression and disposable portfolio journey | Movement and corrected label explicitly requested; final experience acceptance remains `pending` | `pending` | Have the owner drag the portrait and open the panel in the rebuilt app; native dragging remains a manual acceptance check. |

The portrait is an Electron native drag region, separate from the keyboard-
operable “Mở Triết” button. Dragging the portrait does not activate the panel;
the button retains single-click opening and double-click full Teacher behavior.
Its accessible label is “Mở cửa sổ Triết”. Because this is a navigation control,
the old Practice-dependent label and its presence polling are removed. Teacher
still resolves the authoritative active Practice when its panel opens.

Native user moves update an in-memory screen anchor on Windows/macOS. Opening,
collapsing and returning from full Teacher preserve that anchor for the current
app session; programmatic resizing does not overwrite it. Expanded panels are
clamped to their current display work area, including negative monitor
coordinates. No saved learner data or persisted settings schema is changed.

Focused checks cover native drag/no-drag CSS regions, no activation from the
portrait, keyboard opening, a simulated OS move event and retained position
after expansion/collapse. Layout tests cover edge clamping and a secondary
display with negative coordinates. The OS drag event is simulated in the
Electron test; manual pointer dragging and native macOS behavior still require
owner/native-platform rehearsal.

### Teacher minimize and windowed density — 12 September 2026

| Scope | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| Foundation / I4 / M2.5 — native minimize, compact readability and disabled cursor | `implemented` | `passed` for lint, typecheck, 507 unit tests (two intentional skips), nine startup checks, build, full Electron smoke/chat/guide checks, extended portfolio journey, desktop/narrow visual inspection and diff checks | Changes explicitly requested; final experience acceptance remains `pending` | `pending` | Review title-bar minimize and the denser windowed panel in the updated app; broader module acceptance remains outstanding. |

The full Teacher surface no longer adds its own minimize control. While a
Teacher overlay is mounted, the app's native minimize event hides the main
window and opens the expanded floating Teacher panel. Returning to full Teacher
explicitly restores the minimized window. Closing Teacher clears that surface
state, so minimizing an ordinary course page retains the OS behavior. A narrow,
main-renderer-only IPC reports overlay visibility; no learner progress or
Practice evidence is changed by the window transition. The old renderer
minimize-to-bubble API and callback are removed.

The floating panel now prefers 380 by 640 pixels, while preserving the existing
display work-area clamp and lower-right positioning. Smaller windowed text,
tighter row/header/card spacing and a single scroll area for hints show more
content. Primary controls retain their 44-pixel minimum target. Full Teacher
and lesson typography are preserved. The package submit/refresh controls now
use the normal arrow when disabled; actual submission feedback remains inside
the button. Hovering over an unavailable action no longer implies background
work.

Focused Electron coverage exercises native minimize and restore twice in
Practice, ordinary course minimize after closing Teacher, 11.5-pixel document
text, 44-pixel navigation targets, the disabled submit cursor, and compact
360/320-pixel overflow. Desktop and compact screenshots were inspected. The
final batch also passed course chat history across native minimize and restore;
the 12-pixel windowed chat screenshot was inspected. The extended portfolio
return completed successfully in both focused and final runs for this batch.
These checks do not replace owner/native-platform acceptance.

### Practice navigation and interaction cleanup — 12 September 2026

| Scope | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| Foundation / I2 / I4 / M2.5 — return to task, restrained motion, duplicate content and fresh restart | `implemented` | `passed` for lint, typecheck, 507 unit tests (two intentional skips), nine startup checks, build, full Electron smoke/chat/guide checks, disposable portfolio journey and desktop/narrow visual inspection; transient return-test observation recorded below | Changes explicitly requested; final experience acceptance remains `pending` | `pending` | Review the updated app with the owner's existing Practice, including restart and return; existing module acceptance gates remain in force. |

Both Teacher Practice panels now provide a secondary “Mở lại task Codex”
control outside the scrolling details. A narrow IPC request identifies the
displayed run and generation; the coordinator resolves the persisted binding,
rejects stale or switching runs, releases the app's connection through the
existing handoff mechanism, and opens that exact Codex task. Navigation does
not prepare a task, send instructions, refresh evidence or change saved Practice
progress. Busy/error feedback supports retry without creating a replacement.

The owner identified redundancy in the newly styled document disclosure.
The final presentation replaces that menu plus status list with one always
visible five-document list in assignment order. Each path appears once; distinct
issues remain under their file and identical issues are deduplicated. General
issues, scope warnings and explicit package approval remain available. The
Practice sweep also removes the repeated objective/outcome below the brief,
suppresses next-step text that merely repeats the current step, avoids identical
step title/reason text, and presents the one-line active-task receipt directly.
Checklists with additional guidance, review criteria and distinct refresh/review
actions are retained. No page, route or lesson scene is removed.

Thinking dots now move by two pixels as they fade, and pending hints/submissions
use the same compact indicator. Practice controls transition for 140 ms;
hints, review results, step guidance and the restart dialog appear over 160 ms.
Reduced-motion preferences disable these added transitions and animations.

The restart popup now offers only Cancel and fresh start. The unavailable
selective-context-transfer option is removed. The native modal traps focus,
starts on Cancel, supports Escape and restores focus to its trigger. Cancel
preserves the active run; confirmed replacement uses the existing fresh-start
operation and retains old task history. Existing same-task module handoff,
learner-owned Module 2 instructions and approval gates remain unchanged.

Focused coverage checks exact task navigation and connection release, stale
identity rejection, unchanged saved state, recoverable open failures, unique
document paths and preservation of distinct issues. The disposable Electron
portfolio journey exercises compact/full navigation, keyboard activation,
scroll reachability, modal Cancel/Escape/focus restoration, confirmed
replacement with retained history, package approval, revision and completion.
Desktop, 390-pixel modal and 360/320-pixel compact screenshots were inspected.
The chat check verifies the two-pixel thinking motion and reduced-motion
fallback; the modal check verifies its reduced-motion fallback. These are
technical and simulated UI checks, not live teaching quality, native Codex
dispatch or learner acceptance evidence.

The final extended portfolio run once failed to archive a passed submission
after displaying its recoverable return error. The same complete journey passed
on two subsequent runs. Its cause is unconfirmed; bounded Electron stderr
capture is now retained by the disposable test on failure. This observation
remains part of the native/owner return rehearsal rather than being claimed as
a diagnosed or repaired runtime defect.

### Planning document panel styling — 12 September 2026 (earlier presentation)

The navigation and interaction cleanup above supersedes this entry's redundant
document disclosure. This entry records the earlier styling verification.

| Scope | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| I4 / M2.5 — document list and submission presentation | `implemented` | `passed` for typecheck, lint, 503 unit tests (two intentional skips), nine startup checks, build, full Electron smoke/chat/guide checks, extended portfolio journey and desktop/compact visual inspection | Styling repair explicitly requested; final visual acceptance remains `pending` | `pending` | Inspect the updated panel in the owner's current Practice; broader module acceptance remains outstanding. |

The five-document section previously inherited a generic disclosure and bullet
list. It now uses the existing black/gold theme, rounded borders, a styled
keyboard-operable disclosure, and separated document/status rows. Long paths
wrap within the panel, status text is subordinate to filenames, and approval
controls share the same spacing and surface. All existing wording, punctuation,
document paths, issues, submission behavior and approval gates are preserved.
No page, route or lesson content changed. The learner-directed empty Module 2
task behavior remains intact.

The disposable portfolio journey verifies exact missing-issue text, keyboard
toggle and no page/row horizontal overflow at 360 and 320 pixels. Compact
missing-document screenshots and desktop/390-pixel empty and ready states were
visually inspected. Approval, simulated review, revision, completion and the
same-task handoff still pass. Screenshots are under
`.superpowers/sdd/screenshots/portfolio-missing-*.png` and
`portfolio-package-{desktop,narrow}.png`. These checks establish presentation
and workflow integrity, not live AI quality or learner acceptance.

### Learner-directed Module 2 start — 12 September 2026

| Scope | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| I2 / M2.5 — learner-owned Codex instructions | `implemented` | `passed` for typecheck, lint, 503 unit tests (two intentional skips), nine startup checks, build, full Electron smoke/chat/guide checks, the disposable portfolio-package journey and scoped diff review | Empty Module 2 task and learner-written first instruction explicitly approved; overall module acceptance remains `pending` | `pending` | Open a new Module 2 Practice to rehearse writing the first instruction; existing task history remains available and is not erased. |

After observing the automatic prompt, the owner approved leaving work
instructions to the learner. Course Companion still presents the assignment,
creates and names the task in the selected folder with the approved settings,
and verifies its exact identity and workspace. Module 2 preparation now stops
after that read-only check. Start, Retry, Resume and legacy-task preparation do
not resume execution or send a message. The automatic five-document instruction
was removed from the task coordinator; no replacement hidden prompt, file or
prewritten learner message was added. Existing conversations, including earlier
automatic messages, remain untouched. Hints, evidence collection, approval and
review retain their existing boundaries; this adds no new assessment gate.

The regression composes the real Practice and task coordinators, injects a
discovery failure after creation, then verifies Retry and Resume open the same
empty task without an execution request. Both saved Module 2 versions preserve
their existing conversation. The disposable Electron portfolio journey still
passes approval, simulated document review, revision, completion and the
same-task Module 3 handoff. No lesson copy, page, navigation target or persisted
schema changed. The earlier resume repair below remains applicable to the
existing Module 3 instruction path; this decision supersedes automatic
instruction delivery for Module 2 only. Live learner direction, AI quality and
overall acceptance still require rehearsal evidence.

### Practice task resume repair — 12 September 2026 (earlier behavior)

| Scope | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| I2 / M2.5 — task creation and retry | `implemented` | `passed` for typecheck, lint, 501 unit tests (two intentional skips), nine startup checks, build, full Electron smoke/chat/guide checks, disposable real App Server lifecycle diagnostic and scoped diff review | Repair explicitly requested; overall runtime acceptance remains `pending` | `pending` | Retry the existing pending Module 2 task in the updated app, then continue the live learner rehearsal. |

Historical verification of the initial technical repair. The learner-directed
Module 2 decision above supersedes its instruction-delivery behavior and next
action; the underlying resume fix is retained for other instructional paths.

The owner's live Module 2 start reached `target-created`, then failed with
`thread not found` when sending its initial instructions. Creation closes the
bootstrap server; reading stored history on the next server does not load the
task for execution. The coordinator now resumes the exact task before sending
instructions, reapplies the approved Module 1 settings, validates the returned
identity, workspace and effective settings, and rechecks resumed history to
avoid repeating an accepted instruction. Failed preparation retains the pending
binding and previous Practice. Module 1 preparation and evidence-only reads
remain read-only. No course copy, page, route, approval gate or stored schema
changed, and no personal progress was reset.

The regression reproduced the original failure before the repair. Coverage now
includes server closure, failed-resume retry, lost turn acknowledgement,
duplicate prevention, and mismatched task/workspace/settings rejection. The
real diagnostic uses a disposable Codex home and workspace, sends no model
prompt, and verifies that read leaves the task unloaded while resume loads the
same task with the same effective settings. This isolated Windows profile
returns a read-only sandbox even when workspace-write is requested; it proves
the lifecycle, not the learner's full write-capable handoff or AI response.
The production coordinator rejects incompatible effective settings. Initial
diagnostic runs exposed default-setting fallback and a Windows plugin-clone
cleanup lock; explicit resume settings and disabling unrelated plugins only in
the disposable diagnostic profile resolved those checks. Live task execution,
AI review quality, native macOS and learner acceptance remain outstanding.

### Theory Teacher navigation — 12 September 2026

| Scope | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| Foundation — theory chat navigation | `implemented` | `passed` for typecheck, lint, 493 unit tests (two intentional skips), nine startup checks, build, full Electron smoke/chat/guide checks and desktop/narrow visual inspection | Removal of the theory progress tab explicitly requested; final experience acceptance remains `pending` | `pending` | Review theory chat in the updated app. |

Theory opens directly to Teacher chat without the redundant tab strip. Outside
active Practice, saved full/compact progress-panel preferences are ignored, so
older profiles cannot reopen the unrelated progress view. The actual Practice
review surface and its guide remain unchanged. The chat walkthrough now starts
from saved progress-panel preferences and verifies chat access without tabs at
Home Base and inside a theory lesson. No lesson scene, assessment or course
navigation target was removed; this removes the exact theory tab requested.

### Teacher Markdown rendering — 12 September 2026

| Scope | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| Foundation — Teacher reply formatting | `implemented` | `passed` for typecheck, lint, 493 unit tests (two intentional skips), nine startup checks, production build, full Electron smoke/chat/guide checks and scoped diff review | Markdown rendering explicitly requested; final experience acceptance remains `pending` | `pending` | Review formatted replies in the updated app. |

Teacher replies use `react-markdown` and `remark-gfm` to render paragraphs,
emphasis, headings, nested lists, quotes, code, tables and task lists. Formatting
is scoped to Teacher messages, including saved replies; learner input and the
stored conversation remain unchanged. Typography uses the course theme, long
code and tables scroll within their containers, and external HTTPS links use
the existing desktop-shell policy. Raw HTML stays escaped and image descriptions
display without automatically fetching remote media. No course page, lesson
copy, assessment gate or Practice chat boundary changed.

Four focused tests cover formatting and inert HTML/unsupported destinations.
The isolated Electron chat walkthrough verifies actual reply markup, preserved
learner text and bounded layout at 390 and 1180 pixels; screenshots were
inspected. An unrelated Git fixture timed out during the first concurrent unit
run; the standalone full rerun passed. Runtime dependency audit reports no
advisories. These checks establish rendering behavior, not live teaching quality
or learner acceptance.

### Teacher send feedback — 12 September 2026

| Scope | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| Foundation — Teacher chat send interaction | `implemented` | `passed` for typecheck, lint, 489 unit tests (two intentional skips), nine startup checks, production build, full Electron smoke/chat/guide checks and scoped diff review | Immediate message display and thinking feedback explicitly requested; final experience acceptance remains `pending` | `pending` | Test the updated Teacher chat with learner-owned questions. |

Sending now immediately displays the learner's message, clears the submitted
draft and scrolls the conversation to a visible “Triết đang suy nghĩ…” status.
The dots respect reduced-motion preferences. A synchronous send guard prevents
duplicate submissions; retry reuses the visible learner message and leaves any
unsubmitted draft alone. Confirmed replies appear before the separate history
refresh, so a refresh failure cannot turn a successful response into a failed
send. If both sending and history recovery fail, the question remains retryable
in the current view; an unsaved local attempt is not durable across reopening.

The disposable chat walkthrough covers delayed response, failure, retry,
390-pixel layout, reduced motion and a cleared composer; desktop and narrow
thinking states were visually inspected. Additional injected failures cover
unavailable history and a successful reply followed by failed history refresh.
The initial full regression stopped on an optional screenshot timeout in an
unchanged Module 1 setup screen; the rerun passed without optional suite screenshots.
Existing course pages, lesson copy, assessment gates and the active-Practice
chat exclusion remain unchanged. This is presentation and recovery evidence,
not a new live Teacher quality or learner-acceptance claim.

### Practice guide access and recovery — 12 September 2026

| Scope | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| Foundation — windowed Practice guide and progression | `implemented` | `passed` for typecheck, lint, 489 unit tests (two intentional skips), nine startup checks, production build, full Electron smoke/chat and the new guide walkthrough, and scoped diff checks | Windowed access and guide fixes explicitly requested; final experience acceptance remains `pending` | `pending` | Review the guide with learner-owned work; existing module acceptance gates remain unchanged. |

The existing Module 1 guide can be opened from the windowed Practice panel.
Its inline card uses the course theme, starts each new step at its heading, and
offers a visible pause action. Full and windowed views refresh the same saved
cursor. A needs-work review keeps its review step and explanation visible;
unavailable actions explain the wait instead of making the guide disappear.
Missing or hidden targets use a bounded fallback card outside the clipped
Teacher panel. Guide load/update errors remain actionable, and unsaved guide
steps stay in memory for the current session with a persistence warning.

Replay advances through every guide stage without submitting a review, leaving
Practice or changing durable guide/Practice results. Its review, return and
completion explanations distinguish a walkthrough from completed learner work.
Replay pause/resume and stale-click handling are covered. Existing eligibility,
course pages, mastery confirmation, assessment gates and surrounding copy are
preserved; guide-specific explanatory copy was adapted for compact and replay
contexts. No dependency or persisted-schema migration was added.

`npm run test:electron` now includes `tests/practice-guide-electron.mjs`. Its
disposable simulated journey verifies compact entry, switching views, pause and
resume, unsuccessful-review retry, all replay stages, unchanged saved results,
missing-target fallback and reachable actions without horizontal overflow at
320×500, 380×500 and 390×640. Compact and full/narrow screenshots were inspected.
Unit tests separately verify a persisted needs-work result and guide-write
failure recovery. These Windows checks do not establish live learner or macOS
acceptance; a guide step held only in memory cannot survive an app restart.

### Practice UI refinement — 12 September 2026

| Scope | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| Foundation / I4 / M2.5 — Practice window and return controls | `implemented` | `passed` for typecheck, lint, 483 unit tests (two intentional skips), nine startup checks, production build, full Electron smoke and chat checks, disposable portfolio rehearsal, isolated return-control layout checks and scoped diff checks | UI fixes explicitly requested; final experience acceptance remains `pending` | `pending` | Review the refined Practice workflow with learner-owned work; existing module and native-platform acceptance gates remain outstanding. |

Practice uses the existing course font, black surfaces, gold accent and rounded
controls. Scoped styling improves window controls, readable text, checklist
disclosures, hints, package approval and review results. The paused guide sits
in the panel layout rather than covering scrollable Practice content. Return
controls distinguish an actual return from temporary disabling during another
action; review-card styles no longer override their foreground or label margins.
No approved copy, page, scene, navigation target, review criterion or persistence
contract was removed or changed. Course chat and theory styling remain outside
this refinement. Prior uncommitted planning observations are preserved.

Compact, full and 390-pixel Practice screenshots were inspected. The real return
component was also rendered with production font assets in idle, disabled and
busy states at 560, 390 and 320 pixels: stable dimensions, centered spinners,
readable foreground, no horizontal overflow and reduced-motion handling passed
(`node tests/practice-return-layout.mjs`). The portfolio rehearsal verifies the
actual approved return and retained task, while its AI review remains simulated.
Automated Windows evidence does not establish macOS or learner acceptance.

### Beginner verification repair across Modules 1–4 — 29 October 2026

| Scope | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| Foundation / I4 / Modules 1–4 — internal verification must not become learner homework | `implemented` | `passed` for typecheck, lint, 794 unit tests (three existing skips), nine startup checks, build, full Electron suites, disposable Module 2–4 journey, independent read-only reproduction and a fresh live Module 3 review | Repair, cross-module audit and delivery by commit/push explicitly requested; overall experience acceptance remains `pending` | `pending` | Deliver on the current branch. Let the learner save the legitimately passed Module 3 Practice result and complete their own mastery responses. Keep other live module, native macOS and overall acceptance gates separate. |

The Module 3 collector now independently recomputes supported validation-record
identities from the actual application inventory. It recognizes the canonical
app identity and ordered path/per-file SHA256 line aggregates, including letter
case and LF/CRLF variants. The entire website-file scope must be covered; only
`.gitignore` may be absent from that browser-validation scope, and it remains
bound into the authoritative application/approval identity. No source digest,
approval schema, course criterion or learner document is rewritten. Unknown
methods are unresolved identity information, not proof that source changed.

The independently collected source artifact supplies the correlation to the
reviewer. A verified content match takes precedence over a timestamp-only
change; genuine changed bytes, added application files, unavailable evidence
and stale approval remain protected. Tests cover formatting equivalence,
sentence-ending paths, incomplete scope, malicious/outside path text, changed
code, added code/assets/configuration and unchanged content with a later mtime.
This is source identity corroboration, not independent execution of reported
commands or browser checks.

The shared portfolio review and all Practice hint policies now keep internal
hashes, digests, raw metadata and identity reconciliation out of learner-facing
requests. Feedback should state an observable limitation and one action the
learner can ask Codex to perform. Document, package, source, Git and handoff
identities have distinct roles and must not be compared as interchangeable
strings. Already satisfied learner work must not be repeated.

Cross-module audit findings:

- Module 1 uses direct configuration checks, not portfolio fingerprint review.
  Unreadable-settings errors now describe the current settings/task in plain
  language. Required settings and freshness checks are unchanged.
- Module 2 already binds approval to app-generated current document identities;
  no analogous cross-method comparator was found. Shared review/hint guidance
  now prevents internal identity details becoming new learner requirements.
- Module 3's independent source correlation resolves the reported false blocker
  without modifying the portfolio or requiring another learner confirmation.
- Module 4 now normalizes equivalent hexadecimal revision/checkpoint case and
  HTTPS URL spelling (host case, default port and root slash). Different Git
  revisions, URL paths, dirty source, handoff mismatches, private URLs and absent
  publishing consent still fail. Parsing preserves the supplied record unchanged.

The read-only reproduction confirmed current source correspondence with zero
issues and the same valid saved approval. After restarting the real app on its
existing profile, a normal review of the exact bound Module 3 task returned
`passed` with all five criteria satisfied. Learner-facing feedback contained no
fingerprint-reconciliation request. Review history grew from one entry to two,
preserving the earlier needs-work review; no manual pass, waiver, portfolio edit
or course reset was used. The app is left displaying the earned result; return
and mastery responses remain learner-owned. Local evidence is under
`.superpowers/qa/beginner-review/` and is not shipped as course source.

### Module 3 review completion feedback — 29 October 2026

| Scope | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| Foundation / I4 / Module 3 — review delay and hidden completion | `implemented` | `passed` for lint, typecheck/build, 775 unit tests (three existing skips), nine startup checks, full Electron smoke/chat/guide/deferred-review suites, disposable portfolio journey and actual saved-result presentation | Investigation and responsiveness repair requested; final experience acceptance remains `pending` | `pending` | Resume the learner-owned workflow from the displayed saved feedback; live grading quality, fingerprint interpretation and owner/pilot acceptance remain separate. |

The reported run had completed with a saved needs-work result. Its recorded
review-start and following evidence-refresh timestamps spanned approximately
68 seconds; these are not per-stage latency measurements. The reviewer accepted
four criteria and left final validation unverifiable because its reported
13-file fingerprint was not reconciled with the independently collected 14-file
fingerprint. This investigation preserves that verdict and does not establish
whether the two fingerprint methods should match.

The owner's subsequent grading challenge was audited by independently reading
the current portfolio files. The validation record's ordered 13-file list,
uppercase per-file SHA256 values and LF-separated aggregation reproduced its
recorded `7F757546267F782619EF1D883775A3F1DDB85968B052A511AD4B507CFE86AA5D`
exactly. The app's sorted JSON aggregation reproduced
`2d48d439bbbcb30fbac1fd0d805b300d8ae6205c2acc471b47d1070ec38d6de8`;
its only additional file was `.gitignore`. Thus these differing aggregate hashes
do not establish changed tested source. The submitted 13-file validation source
is unchanged. The app/reviewer integration lacks the comparison needed to
reconcile different declared fingerprint methods; at that audit stage the
correction was `not-started`, with read-only diagnosis `passed`. This is not a new learner task
or a reason to repeat satisfied work. The saved needs-work verdict remains
unchanged at that audit stage. The subsequent cross-module repair and fresh
live review above supersede that status; no pilot acceptance is inferred.

Package submission did not bring its returned feedback into view. New saved
results now receive focus and scroll into view on completion and when reopening
Teacher; repeated refreshes of the same result preserve the reader's place.
Presentation waits until the initial workspace loader has finished. Submission
errors also receive visible focus. An elapsed-seconds indicator remains usable
with reduced motion, where the spinner intentionally does not animate.

The review IPC now returns its saved result without awaiting guide housekeeping.
That background guide reconciliation reuses the returned workspace instead of
requesting another evidence refresh. Existing inference/transport timeouts,
current-source checks, approvals, assessment criteria, copy, pages and routes
remain unchanged; no shorter AI response time is promised.

The new disposable Electron regression covers deferred needs-work/passed/error
responses, released busy controls, elapsed time under reduced motion, delayed
startup with an existing result, and stable focus across background refreshes
in compact/full views. Screenshots use the production fonts and styles. The
normal app was reopened with its existing profile, and the saved Module 3
needs-work result was verified focused and visible without horizontal overflow.
No review was resubmitted, no learner files were edited, and no progress reset
or assessment waiver was used. Local artifacts remain under
`.superpowers/qa/review-feedback/`.

The final full unit/Electron runs passed after the saved-review startup timing
correction. The disposable Module 2–4 journey passed before that final focus-only
correction; its approval, freshness, continuity and completion checks remain
unchanged. The initial isolated screenshot harness timed out with a hidden
window; its final run uses a visible disposable window and the production fonts.
No product assertion, timeout or acceptance gate was weakened.

### Practice hint discoverability — 29 October 2026

| Scope | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| Foundation / I4 / Practice Teacher — visible hint feedback | `implemented` | `passed` for typecheck, lint, 775 unit tests (three existing skips), nine startup checks, build, full Electron smoke/chat/guide suites, compact/desktop visual inspection and current-app error visibility | Hint discoverability repair requested; final experience acceptance remains `pending` | `pending` | Review the updated hint presentation with a successful live request; retain the separate unresolved reliability investigation below. |

Hint results and errors now appear first in the Practice content, directly
below the hint action and ahead of the prompt and guide. New feedback receives
focus and scrolls into view automatically. Hints have a gold heading/accent,
larger body text and no inner paragraph scrollbar; dismissing a hint returns
focus to its action. Existing wording, pages, guide content, task binding,
evidence/freshness rules and assessment gates are preserved.

Electron regression checks start from scrolled compact content and require the
returned hint to be focused, visible without manual scrolling, ahead of other
content and free of inner text scrolling or horizontal overflow. Both compact
and full Teacher views pass, including focus returning after dismissal. Their
screenshots were visually inspected. The updated renderer was reloaded in the
owner's existing companion without resetting progress or editing portfolio
files. A live request through its actual button returned the progress-changed
freshness error, now focused and visible at the top with no horizontal overflow.
That request did not produce a hint and does not close live reliability or
owner/pilot acceptance. Local screenshots are under
`.superpowers/qa/hint-visible/` and are not shipped as course source.

### Live hint failure investigation — 29 October 2026

| Scope | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| Foundation / I4 / Module 3 — Practice hint reliability | `implemented` — no runtime change in this investigation | `pending` for the reported generic failure; 24 focused hint/Teacher adapter tests passed, and one isolated live hint succeeded | Investigation and transmission of bound-task/portfolio context for the isolated live test explicitly authorized; final experience acceptance remains `pending` | `pending` | Retain the unresolved generic failure; capture safe failure stage/code on reproduction and verify the running-app hint once its source is stable. |

The owner reported the generic hint failure in the running app. Existing unit
tests mock inference, and Electron hint checks use simulated responses. The
focused rerun passed all 24 tests after sandbox temporary-file rename failures
required normal filesystem access. An explicitly authorized isolated test used
the current Module 3 binding, refreshed task data, current portfolio evidence
and the real Teacher adapter; it returned a grounded Vietnamese hint. Activity
and Practice state for that isolated test were kept in memory.

A subsequent request through the running application's actual hint IPC rejected
the response because its source digest changed during inference. That is a
different, explicit freshness message from the owner's screenshot and does not
establish the screenshot's cause. The generic catch retains no failure-stage or
code diagnostic, so the original underlying error remains unknown. No runtime
or learner-facing copy changed, and no progress reset or assessment waiver was
used. These checks do not establish sustained reliability or owner/pilot
acceptance; full build/Electron suites were not rerun for this investigation.

### Practice hint follow-up — 12 September 2026

| Scope | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| Foundation / I4 / M2.5 — scaffolded Practice hints | `implemented` | `passed` for typecheck, lint, 478 unit tests (two intentional skips), nine startup tests, production build, full Electron smoke and scoped diff checks | Addition explicitly requested; final experience acceptance remains `pending` | `pending` | Try the new hint action with live learner work and assess grounding and teaching quality; existing module acceptance gates remain in force. |

The Practice Teacher now offers `Cần gợi ý?` in both compact and full windows.
Each request reads the exact bound task and independently collects the current
Practice evidence, including partial planning documents. Guidance progresses
from an orienting cue to a focused suggestion to a partial example; repeated
clicks cannot unlock a complete solution. Changed evidence returns to lighter
support, and evidence/run changes during inference reject the stale response.
Hint history is bounded in main-process memory for the current app session.
The dedicated no-tools Teacher context distinguishes Executor reports from
workspace evidence. Hint requests do not save reviews, approvals, checklist
changes or completion. Existing course copy, page inventory, routes, and direct
Practice chat exclusion remain intact.

Electron verification covers requests in both surfaces, preserved review and
checklist state, incremental support across surfaces, hint dismissal, and
desktop/390-pixel layouts without horizontal overflow. Screenshots were visually
inspected. An initial smoke attempt clicked behind the first-run guide dialog;
the corrected journey pauses and resumes that guide through its existing UI.
All final checks pass. Simulated responses verify plumbing and presentation,
not live model adherence or learner/pilot acceptance. The prior uncommitted
live-rehearsal observations are preserved separately from this scoped change.

### Ask Triết reliability follow-up — 12 September 2026

| Scope | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| Foundation / M2.3 / M2.5 — course Teacher chat | `implemented` | `passed` for typecheck, lint, 479 unit tests (two intentional skips), nine startup tests, production build, full Electron smoke, dedicated chat checks and scoped diff checks | Fix and isolated live check explicitly requested; final experience acceptance remains `pending` | `pending` | Try course chat with learner-owned questions; broader teaching-quality and module acceptance gates remain outstanding. |

Teacher context now selects the next unanswered question in the displayed quiz
group across Modules 1–4, preserving one-at-a-time coaching without treating the
whole group as answered after its first saved result. Replies are rejected if
the lesson context changes or Practice starts during inference. Failed learner
messages remain available for retry; stale Teacher answers are not saved.
Existing course copy, pages, routes, assessment gates and Practice chat exclusion
are unchanged.

Dedicated isolated Electron coverage verifies Home Base and lesson-page entry
points, send/retry without duplicate messages, history after reopening, unchanged
learner progress, keyboard behavior and desktop/390-pixel layouts. Screenshots
were visually inspected. The default test uses explicitly simulated responses.
One separately authorized live check sent course sources and one synthetic
Module 2 planning question through the signed-in Codex service and received a
relevant Vietnamese explanation. It used a disposable profile, with no personal
progress or chat history. This proves the live explanation path, not general
model adherence or pilot acceptance. Prior uncommitted live-rehearsal notes are
preserved separately.

## Merge into the Practice branch — 11 September 2026

### Five-document Practice implementation — 11 September 2026

The owner authorized following the new handoff and implementing the Practice
side, with advance notice before modifying theory or shared course-app code.
Baseline inspection confirmed the portfolio path used seven artifacts
and five stage receipts, disabled normal submission review, and did not supply
portfolio document contents to the AI evaluator. The baseline completion service
also depended on an active run and a first-task document.

The owner-approved implementation design is recorded in
`docs/superpowers/specs/2026-09-11-five-document-portfolio-practice-design.md`.
It replaces stage gates with final-package approval and submission, preserves
the existing review/recovery infrastructure, and defines a versioned
five-document handoff carrying the Executor task binding. The owner has been
notified of the required narrow changes to shared Practice contracts, Module 2
registry metadata, the Practice launcher, and course-structure gate metadata.

Implementation of the redesigned runtime is `implemented`; verification
is `passed` for technical checks. Versioned contracts, bounded five-document
collection, explicit final approval, actual-content AI review, retained-run
completion, and same-task handoff are implemented in the working tree.
Final technical verification passes 467 unit tests (two intentional skips), nine
startup tests, typecheck, lint, production build, full Electron smoke, and the
extended five-document rehearsal. The rehearsal verifies keyboard approval,
desktop/narrow layouts without horizontal overflow, actual persisted review,
UI return, post-return document revision, stale-completion rejection, reopening
the original task with fresh approval/review, completion, and exact Module 3 task
continuity. Mastery answers and AI review are explicitly simulated in disposable
data. Git-dependent fresh-folder rejection, legacy-path forwarding, active and
archive-only migration, retained-v2 revision, and section-summary defects found
during verification are fixed with regression coverage. Intermediate default
worker runs hit Git fixture timing failures; both the complete single-worker
suite and the final standard `npm test` pass with unchanged assertions and
timeouts. Independent final spec/quality review is approved with no remaining
actionable findings. The verified local checkpoint is complete on the existing
Practice branch; no changes were pushed to either branch.
The existing merged-runtime verification above remains historical evidence for
the old workflow only. The owner explicitly approved preserving old work/task/history
and requiring fresh five-document review. Next permitted action: seek
owner/runtime acceptance and required learner rehearsal evidence; do not invent replacement Module 3 criteria or
infer overall approval/pilot acceptance from the implementation request.

#### Reconciled checkpoint scope

Live rehearsal readiness — 12 September 2026: the owner chose a fictional
portfolio and explicitly authorized sending course materials, Practice-review
context, and fictional documents to the signed-in Codex service, excluding
saved personal progress and chat history. The earlier pre-launch authorization
block is resolved. Course Companion launched with a fresh isolated profile and
real Codex mode; no saved learner progress was copied. The owner began navigating
Module 1 setup in the visible app. Live review verification remains `pending`:
no live Module 2 AI review, learner approval, or pilot acceptance has yet been
observed. Existing technical verification remains `passed`; next permitted
action is to continue the native setup and fictional-portfolio rehearsal, with
the learner retaining all assessed answers and PRD/plan approval decisions.

Live Module 1 observation — 12 September 2026: the owner reported passing setup
without changing any settings. The isolated profile records a completed
`m1-codex-safe-setup` run with two passed reviews, an authoritative `thread-start`
configuration matching all five required values, and empty learner-prompt and
Executor-response arrays. The task policy inherits configuration; the adapter
and review check current values, not learner-performed setup actions. This is
consistent with the current technical contract but does not demonstrate setup
competence. The owner also reached the Module 1 completion gate with five of
six assessment results accepted; the written response is recorded as learner
self-review, not semantic validation. No runtime or theory changes were made
for this diagnosis. Keep learner acceptance pending; next permitted action is
owner discussion of whether setup verification needs a separate learner-owned
demonstration before changing Practice behavior or any shared assessment/copy.

The 11 September handoff and approved design supersede older per-stage approval
requirements in M2.4, M2.6, and integration checkpoints I1–I6. The five checklist
items describe the documents; they are not five learner approval gates. One
explicit approval of the current PRD and plan precedes whole-package review.
Validation coverage lives in the implementation plan; the first bounded build
task remains in Module 3. Older source handoffs remain unchanged as history.

| Checkpoint | Implementation | Verification | Remaining gap / next permitted action |
|---|---|---|---|
| I1 / M2.1 — contract | `implemented` | `passed` for focused tests | Five unique paths, v2 manifest, unchanged v1 definition retained for history; no theory/template rewrite. |
| I2 — task and migration | `implemented` | `passed` | Active v1, unambiguous replaced/complete v1 archives, retained v2 revision and active Module 3 recovery preserve task/files/history; ambiguous or unavailable task/workspace recovery fails closed. The approved learner-directed Module 2 start is technically verified: new tasks are empty and preparation never sends instructions. Rehearse a new task with the learner writing the first instruction; preserve old conversations. |
| I3 — evidence | `implemented` | `passed` for 14 filesystem tests | Bounded contents, digests, sections, requirement references, scope, optional validated images; semantic quality remains AI-assessed. |
| I4 / M2.4–M2.5 — submission | `implemented` | `passed` | Final-package approval/review, fresh-folder validation, busy/error preservation, Teacher chat exclusion and responsive controls are verified. The 12 September navigation, motion, deduplication, fresh-restart confirmation, movable launcher, document icons, sentence-case labels and shared Teacher voice instructions are technically verified. Review the recorded transient return-test observation during owner rehearsal; The false availability failure for a connected planning task with unknown model settings and no Git is repaired and technically verified; owner visual review, live hint quality and overall acceptance remain pending. |
| I5 / M2.6 — completion/handoff | `implemented` | `passed` | Five current references, original task, archived completion/revision, existing mastery and bounded relevant summaries are verified; Module 3 replacement criteria remain deferred. |
| I6 — verification | `implemented` | `passed` | Independent review and local checkpoint are complete. Native/live AI and learner/pilot acceptance are not established by simulated checks; seek those acceptance decisions next. |

### Verified merge record

Merged `origin/triet-v3-planning` at `4513318` into
`feature/course-companion-practice-workflow` at `8a18349`, retaining both
histories. Implementation: `implemented`; verification: `passed` for this
integration only. The user explicitly assigned Practice to this branch and
theory/course-app work to the incoming branch.

Theory lesson files, scripts, prompts, quizzes, illustrations, Module 3/4
renderer scenes, highlighting, and outline navigation match the incoming
branch. The shared LearningWindow differs only by the existing Practice
workspace picker; shared style differences retain the existing Practice review
and return controls. Module 2 keeps the previously approved technical folder
boundary before Practice. The source-approved retirement of
`module-3-readiness` and the redundant Module 1 setup page is retained with
their existing compatibility routes. No additional theory page was removed
or rewritten during conflict resolution.

The five conflicts were resolved by combining UI/test imports, retaining the
workspace-selection smoke expectation, keeping the cross-platform newline
assertion, and reconciling this ledger. Root guidance retains this branch's
removal of blanket approval-before-execution wording and adds the incoming
trivial-edit fast path and verification batching.

Verification on the merged Windows checkout passed: typecheck, lint, 411 tests
with two intentional skips, nine startup tests, production build, full Electron
smoke, and `git diff --check`. Electron covers responsive layouts, outline and
history navigation, Practice Guide actions, repeated-review preservation,
workspace consent/setup, launch, mastery, persistence, and resume/reset using
disposable data and simulated Codex. These checks do not establish live Codex
integration, native macOS fullscreen behavior, owner acceptance, or pilot
acceptance.

The [new handoff](./practice-handoff-duy-2026-09-11.md) is planning input, not an
implemented runtime: Module 2 should end with five documents and approved PRD
and implementation plan; review should use deterministic evidence checks plus
AI content assessment while Teacher chat stays off during Practice. Module 3
should continue the same task for building and debugging. Replacement Module 3
criteria and old-progress/receipt handling remain unresolved. Next permitted
action: summarize this integration, then reconcile the Module 2 Practice design
with that handoff. Do not infer approval of new Practice gates or begin the
next gated module from this merge.


**Current merged-branch verification — 18 August 2026:** After merging
`origin/Triet-V2-planning` into `feature/course-companion-practice-workflow`,
the combined branch passes 317 unit tests with two intentional skips, nine
startup tests, typecheck, lint, production build, full Electron smoke, and
`git diff --check`. Module 2 integration and owner/pilot acceptance remain pending.

**Hỏi Triết context and pedagogy verification — 19 August 2026:** The embedded
Teacher now receives an authoritative, integrity-checked package containing the
current module lesson, Teacher script, start prompt, quiz, active assessment,
saved learner decisions, and Practice evidence. A dedicated pedagogy Skill
prevents answer and future-question disclosure while an assessment is open.
Repository and adversarial tests cover Intro and Modules 1–4; live model checks
cover Modules 1, 2, and 4. The branch passes 340 unit tests with two intentional
skips, nine startup tests, typecheck, lint, production build, full Electron
smoke, Skill validation, and `git diff --check`. This technical verification
does not change owner approval or pilot acceptance.

**Practice-only Teacher review role verification — 19 August 2026:** While an
authoritative Practice run is active, Triết now exposes one structured review
workspace instead of direct chat: current evidence, criterion-level results,
one next action, and gated return. The main process rejects direct Teacher sends
for every active run, including mismatched progress; unavailable Practice state
fails closed. Return revalidates evidence, revokes stale completion, archives
the exact completed run, advances the lesson, completes the first-run guide, and
restores ordinary Hỏi Triết outside Practice. Focused adversarial coverage and
the full Electron journey exercise concurrent review/return, changed evidence,
failure preservation, and post-Practice restoration. Owner approval records the
approved role and Option A workspace direction; pilot acceptance remains
`pending`.

**Practice handoff, compact view, and guide repair verification — 19 August
2026:** Opening or resuming a Codex Practice now uses an atomic App Server
ownership handoff, and every review releases that ownership again on success or
failure. The compact companion polls only persisted Practice presence and shows
progress, the current step, one curated next action, review, and eligible return;
objectives, criteria, configuration, evidence, timestamps, and invalidation
details remain in the full workspace. Guide step five has an awaited `Tiếp`
action that enters a hidden waiting state, while step six remains gated on an
authoritative persisted pass in normal and replay flows. The branch passes 350
unit tests with two intentional skips, nine startup tests, typecheck, lint,
production build, full Electron smoke including reset/reopen, and independent
adversarial source review. Owner approval covers this repair design; pilot
acceptance remains `pending`.

**Non-owning Practice review and compact checklist verification — 19 August
2026:** Practice evidence refresh and review now use a dedicated read-only App
Server client that accepts only `thread/read`; it never resumes, starts, lists,
or switches the learner's task. Exact task metadata is read from the bound Codex
state and rollout with thread, workspace, schema, timestamp, and mutation checks,
then projected through the same activity and workspace-reconciliation functions
as the previous observer. Pre-open planning baseline capture is workspace-only,
so a newly created task does not require rollout metadata before Codex Desktop
opens it. Configuration review compares semantic settings before and after
evaluation, preserves the last result on failure, and returns a structured
actionable error to the Teacher workspace. The compact companion now lists every
Practice step and its progress as a single-open accordion with guidance collapsed
by default; detailed evidence and evaluation remain in the full workspace. The
Codex service-tier representations `null`, `default`, and `standard` now
canonicalize to the single strict Standard protocol value; missing and unknown
values remain unverifiable, and Fast remains distinct. The compact accordion's
font chevron was replaced by the approved outlined C2 control: CSS-drawn plus
and minus states, a 52 px row target, visible focus, and reduced-motion handling.
The branch passes 373
unit tests with two intentional skips, nine startup tests,
typecheck, lint, production build, full Electron smoke, a real read-only bound-task
diagnostic while Codex Desktop retained ownership, and independent adversarial
review. Owner approval covers this repair design; pilot acceptance remains
`pending`.

**Practice settings and guide regression repair — 22 August 2026:** A real
Module 1 Practice run invalidated the 19 August verification claim. The empty
Codex task rollout contained `session_meta` but no
`event_msg/thread_settings_applied`, while the metadata tests generated that
event synthetically. The repair now validates and uses the exact saved
`thread-start` snapshot when no later update exists; a latest valid persisted
settings event still supersedes that baseline. The review path performs one
exact `thread/read`, never resumes or owns the learner's task, and keeps the
existing fail-closed binding and stable-rollout checks. Guide step five now
advances only on semantic `review-requested`, needs-work remains visible, pass
reveals step six, and existing stranded cursors reconcile back to step five.
Verification passed with 378 tests and two intentional skips, nine startup
tests, typecheck, lint, production build, full Electron smoke through steps
5–7, an isolated installed-App-Server diagnostic reproducing an empty rollout,
and a read-only production-reader diagnostic against the original failing
active run. The latter returned its exact saved model, effort, speed, approval,
and Full access values without acquiring task ownership. Owner approval covers
the revised repair design; overall Foundation approval and pilot acceptance
remain `pending`.

**Selective Triet V2 content integration and Practice compatibility verification
— 22 August 2026:** The approved Module 2 and Module 3 teaching content, Course
Companion scenes, assessments, illustrations, and supporting app changes from
`origin/Triet-V2-planning` are integrated without adopting that branch's
Practice-definition, guide, metadata-reader, handoff, governance, or evidence-
gate changes. The destination branch remains authoritative for exact-task
metadata recovery, semantic guide progression, review/handoff behavior, five
Module 3 stage receipts, and four nested build-slice receipts. Static review
found one additional regression hidden by the incoming Electron test fixture:
the new direct Module 2 route removed every workspace-selection surface while
the real Practice resolver still rejects an unselected workspace. The integrated
route therefore retains one technical portfolio-folder picker after the fifth
knowledge slide and before Practice, while the other 22 Teacher-led setup slides
remain retired. Saved progress can resume at that picker instead of being
redirected past it. The Electron rehearsal proves no `planning/` directory
exists before learner consent, creates it only after confirmation, and then
continues through Practice, review, mastery, persistence, and the companion
lifecycle. Verification passed with 391 tests and two intentional skips, nine
startup tests, typecheck, lint, production build, full Electron smoke,
`git diff --check`, an isolated installed-App-Server empty-task diagnostic, and
an exact read-only diagnostic against Practice run
`51b70b52-b9de-4999-8287-04c27dd65413` bound to task
`01a029e9-87b1-7303-9578-96e0c4ea893e`. The bound diagnostic recovered
`gpt-5.6-sol`, high reasoning, Fast/priority service, on-request approval, and
Full access off from the saved thread-start baseline without acquiring task
ownership. Owner approval covers the selective integration and compatibility
boundary; overall Foundation or module approval and pilot acceptance remain
`pending`.

**Practice review clarity, synchronization, and guide-action repair — 23 August
2026:** A learner rehearsal exposed three verification gaps: guide step five had
no primary action, successful reviews were displayed as isolated snapshots with
no explanation when a previously verified step regressed, and only the surface
that initiated a review refreshed immediately. The repair retains the automatic
exact-task metadata path, stores the five latest review events, derives explicit
first-review/unchanged/changed comparisons, and marks a regressed completed step
as `stale` (`Cần xác minh lại`) instead of `pending` (`Chưa bắt đầu`). Failed or
interrupted reviews restore the exact prior result and history. The main process
now broadcasts persisted workspace changes to both Teacher surfaces. Compact
Practice leads with verified count, one change summary, one next action, and one
dominant action while keeping the full checklist behind disclosure; the full
workspace retains criteria, evidence, and timestamps. Guide steps five and six
invoke the real review and return operations, and the return loader preserves
its geometry and book icon while using a circular busy badge. Verification
passes 401 tests with two intentional skips, nine startup tests, typecheck, lint,
production build, full Electron smoke that directly operates both guide actions
and performs an unchanged second review, `git diff --check`, and an isolated
installed-App-Server diagnostic that recovered all five settings from
authoritative `thread-start` metadata without a settings event. Owner approval
covers this repair design; overall Foundation approval and pilot acceptance
remain `pending`.

**macOS fullscreen Companion repair — 24 August 2026:** With the owner's
explicit approval, the floating Duyệt Practice window now uses Electron's
macOS-only `panel` type while preserving `visibleOnFullScreen: true` and the
existing `screen-saver` topmost level. This keeps non-macOS window construction
unchanged and adds a focused source regression over all three window-policy
conditions. The repair passes that focused 11-test file, all 389 unit tests,
nine startup tests, typecheck, lint, production build, `git diff --check`, and
an isolated Electron runtime check that reports the Companion as visible on all
workspaces, always on top, and not fullscreenable. Full Electron smoke launches
outside the sandbox but is blocked earlier by its stale Module 1
`BÀI 1/3 · TRANG 1/4` expectation, so visible native Codex fullscreen evidence
and pilot acceptance remain pending.

## Content merge into triet-v3-planning, 11 September 2026

Merged the content-development branch through `09fd348` into target `2a779d5`.
The owner explicitly requested new content without temporary Practice bypasses.
Implementation: `implemented`; verification: `passed` for this local merge.

The target retains its Practice Guide, Teacher review, completion workflow,
separate Model and Effort/Speed pages, and current Practice entry. Temporary
content-review launchers, session-only bypass state, and per-Practice bypass
controls are absent from the merged runtime. The new Module 1 outline points
to the target's existing Skills/Practice entry. The existing approved retirement
of `module-3-readiness` in source commit `968d1c8` is retained with its saved-page
redirect; no other lesson scene was removed by this merge.

Incoming lesson copy, illustrations, Module 2 material labels, Module 3 quiz,
term highlighting, clickable outlines, and desktop layout updates are included.
Merge validation aligned stale quiz and Teacher-context fixtures with the new
content, retained the target's Practice smoke journey, replaced waits for removed
title boxes with current page identifiers, and used the approved black/white
palette for the two new screenshot captions.

Full gate passed: `npm run typecheck`, `npm run lint`, `npm test` with 398 unit
tests and nine startup tests, `npm run build`, and the Electron smoke script
against that build. The smoke exercises deterministic Codex fixtures, Practice
Guide and Teacher review, completion, restart, saved progress, and navigation.
The source audit confirms the target Practice/Teacher implementation files are
unchanged and temporary bypass identifiers are absent. Desktop renderer fixtures
verify push, merge, and recap pages at 1440 × 900 and 1180 × 748, including panel
separation, horizontal bounds, and scrolling to the longer merge page's controls.
These fixtures are local UI evidence, not live Codex integration evidence.

This run supersedes pending automated verification for the incoming content
changes. Owner content review, native fullscreen evidence, and pilot acceptance
remain separate outstanding gates. Next permitted action: owner review of the
merged content and quiz feedback. Do not infer overall module approval or start
the next gated implementation phase from this merge.

## Source-branch content verification history

These records describe the content-development branch before this merge.
They do not verify the integrated target branch.

### Shared page navigation, 8 September 2026

- Implementation: `implemented`. Previous and forward controls share a row on
  lesson boards, dialogue pages, history review, assessments, and summaries.
  Review uses `Tiếp tục` to advance one visited history entry at a time. It
  returns to the active page only after the final history entry.
- Verification: `passed`. Typecheck, lint, 314 unit tests, nine startup tests,
  production build, and full Electron smoke pass. Desktop checks cover
  `1180 × 780`, `1440 × 900`, and `1512 × 982`. Multi-page backward and forward
  journeys in Modules 1–4 preserve the saved learner-state file byte for byte.
  Alignment checks cover lesson boards, dialogue, review, assessments, and
  summaries. The scene inventory and learner copy are preserved.
- Test maintenance: the full smoke now verifies that normal Module 1 learning
  has no Practice bypass, then reaches assessment through the existing simulated
  Practice. Its Module 2 copy expectation matches the existing approved source,
  and reference-link assertions distinguish links from image captions.
- Owner approval: the shared alignment and sequential review direction was
  explicitly approved on 8 September 2026. Other learner copy and page
  inventory remain unchanged by this navigation work.
- Pilot acceptance: `pending`. Electron uses simulated Codex fixtures.
- Remaining gap and next permitted action: owner review of the rendered
  navigation and the existing live pilot acceptance remain pending. Present
  the verified navigation for owner review. This change does not authorize a
  new module or alter Practice completion gates.

### Clickable module outlines, 8 September 2026

- Implementation: `implemented`. Intro has 3 sections; Modules 1, 2, 3, and 4
  have 8, 8, 6, and 8 sections. Each section opens its existing first page and
  closes the menu. Previous and Continue follow the module's existing page
  order while browsing. The menu provides `Về trang đang học` to resume the
  saved learning page. The final browsing page also returns there.
- Browsing uses local renderer state. It does not save answers, mark skipped
  checkpoints complete, launch Practice, or unlock another module. The active
  section has a filled dot; earlier sections are no longer styled as completed
  merely because of their position. Long menus scroll within the viewport.
- Verification: `passed` with the full project gate: typecheck, lint, 319 unit
  tests, nine startup tests, production build, and full Electron smoke.
  All 33 section destinations were exercised with pointer or keyboard input.
  Desktop menu bounds and screenshots cover `1440 × 900` and `1180 × 748` in
  Intro and every module. Navigation preserves the learner-state file byte for
  byte, including the resumed-window journey. Existing page inventories and
  lesson dialogue are unchanged by this work.
- Test maintenance: the Module 2 menu assertions now cover the added sections
  and active-only highlighting. A stale Module 3 keyword assertion was aligned
  with the owner's earlier Commit copy edit and kept outside this checkpoint.
- Owner approval: the owner approved the section additions and browsing
  behavior before implementation. Overall Foundation and module approval are
  unchanged. Pilot acceptance remains `pending`; Electron uses simulated
  Codex fixtures and disposable learner data.
- Remaining gap and next permitted action: owner review of the updated menus
  and the existing live pilot acceptance. No additional module is unlocked by
  this change.

### Desktop lesson-panel alignment — 8 September 2026

- Implementation: `implemented`. The layout fix from `codex/full-window-alignment`
  was integrated into `practice-disabled-content-development` at the owner's
  request. The model, AGENTS.md, both Skill, and implementation-plan panels now
  fit their content within a 1320 px width limit and center in the desktop area.
  Skill columns share a top edge. The setup Practice illustration and instructions
  use the existing stacked flow to prevent overlap in short windows.
- Verification: `passed`. The isolated renderer audit covered 56 lesson and
  assessment pages at 1180 × 748, 1920 × 1080, and 2702 × 1514 without horizontal
  overflow. Final geometry checks covered the six changed pages and three long
  scrolling pages at those sizes and 1180 × 664. Panel bounds, column gaps,
  illustration separation, and reachable navigation passed.
- Integration verification: `passed` on the current primary checkout. Typecheck,
  lint, all 314 unit tests, nine startup tests, production build, full Electron
  smoke, and the scoped diff checks passed. The earlier worktree-only Module 2
  copy assertion failure does not recur with the target branch's current test.
- Owner approval: local integration was explicitly requested on 8 September 2026.
  Overall course approval and pilot acceptance remain pending. Electron uses
  simulated Codex fixtures and does not establish live integration or acceptance.
- Remaining gap and next permitted action: review the updated primary-checkout UI.
  No layout integration blocker remains. Existing uncommitted content edits are
  preserved separately; Practice gates and saved-progress contracts are unchanged.

## Historical temporary content-first authoring exception

On 17 August 2026, the owner approved branch
`practice-disabled-content-development` to finish and review learner content and
review questions before wiring the remaining Practices. That temporary phase
ended when the approved content was merged into `Triet-V2-planning` on 18 August
2026; none of the review-only runtime mechanisms below belongs to the integrated
branch.

The exception was intentionally narrow:

1. Home Base exposes a clearly labeled content-review launcher for Modules 2–4.
2. Review navigation, answers, and checkpoint movement exist only in renderer
   memory for that session. Exiting review restores the exact previously loaded
   learner progress.
3. Review mode never calls the progress persistence API, opens Practice, creates
   a Practice or mastery receipt, unlocks a module, or records completion.
4. The atomic Module 2-to-3 and Module 3-to-4 gates remain unchanged in
   `ProgressRepository`; Practice identities and existing Practice services are
   preserved for later wiring.
5. The exception permits Module 4 content authoring before Module 3 pilot
   acceptance only for content review. It does not permit official Module 4
   progression, external deployment, owner acceptance, pilot acceptance, or
   graduation claims.
6. Every current Practice boundary exposes a temporary secondary action for the
   owner to continue reviewing: Module 1 opens its six-question review, Module 2
   opens Module 3, Module 3 opens Module 4, and Module 4 opens its final review.
   Each action enters the same session-only review mode and leaves saved progress
   unchanged.

### Completed merge boundary — content, not Practice bypasses

The integration brought back learner content and approved question revisions
only. It did not bring back any temporary mechanism that skips, disables,
simulates, or routes around Practice.

The non-mergeable review scaffolding includes:

- the Home Base content-review launcher and `contentReviewMode` session routing;
- `contentReviewStartSceneByModule`, `practiceReviewDestinationByScene`,
  `startContentReviewAtScene`, and the `pixel-practice-bypass` button;
- tests and smoke steps whose sole purpose is to prove Practice bypass or
  persisted-progress preservation while review mode is active.

The mergeable scope includes approved lesson, Teacher-script, prompt, quiz,
source, and typed scene-content changes. Do not cherry-pick a whole mixed commit
or merge a whole mixed file merely because it contains approved content. Inspect
the diff by responsibility, retain the real Practice coordinators and completion
gates, and exclude the review-only identifiers above. Before completing the
merge, verify that no `pixel-practice-bypass` control remains and that every
module still requires authoritative Practice evidence for official progression.

On the temporary branch, Electron smoke verified the content-review path at desktop and `390 × 844`,
answers a Module 4 formative question, exits through the Home Base brand control,
and confirms that `learner-state.json` is byte-for-byte unchanged. On 17 August
2026, the same smoke journey also exercised the Module 1 bypass, opened Module 2
review, exited through Home Base, restored the exact Practice checkpoint, and
then completed the real Practice path. On 18 August 2026, the owner redirected
that temporary Module 1 bypass to its own six-question review; smoke now confirms
all six questions render and saved progress still returns to the exact Practice
checkpoint. After the owner-approved removal of the
two redundant review banners and dedicated header exit control, typecheck, lint,
284 unit tests, nine startup tests, production build, desktop and narrow
screenshot inspection, and Electron smoke passed. This verification does not
mark Foundation or any module as owner-approved or pilot-accepted.

## Purpose

This document translates the approved Beginner Agentic Portfolio Course plan
into a repository-specific implementation sequence. It does not redesign the
curriculum. It identifies the files, runtime contracts, learner artifacts,
progress reset behavior, Course Companion changes, tests, acceptance gates, and
local Git checkpoints needed to replace the ContentPilot path safely.

The implementation must remain beginner-first. The learner directs product
decisions, approvals, acceptance, and publication. Codex performs technical
inspection and implementation, then returns plain-language evidence the learner
can verify without reading source code.

## Source authority and boundaries

### Curriculum authority

The approved portable source plan currently lives at
`/Users/nguyenminhtriet/Portfolio-SMU/portfolio-course-planning/`:

- `FINAL_CURRICULUM_PLAN.md` — approved curriculum for Modules 2–4;
- `DECISION_LOG.md` — approved decisions D-001 through D-013;
- `RESEARCH_SOURCES.md` — source audit and evidence;
- `COURSE_PLAN.md` — portable planning summary.

The first implementation checkpoint copies a versioned snapshot of those files
into this repository under `docs/planning/portfolio-course-v1/`. The copy is a
provenance record for repository clones, not a second place for independent
curriculum editing. Future curriculum changes must be reconciled deliberately
between the portable plan and the implementation repository.

### Runnable authority

`pilot-workspace/` remains the only runnable course authority. Learner-facing
lesson, script, quiz, prompt, artifact-template, and Practice changes must land
there first and remain synchronized with Course Companion.

### Frozen and permitted surfaces

- The introduction before Module 1 is frozen. Do not change its content, UI,
  images, navigation, behavior, or tests, except for the explicitly approved
  `intro-learning-method` positioning update and removal of the obsolete
  Harness reference recorded below.
- On 16 August 2026, the owner explicitly reopened only
  `intro-learning-method`. The approved copy now introduces the course for
  beginners, names the personal portfolio as the practice project, and states
  the intended transfer to other coding agents and applications. The final
  action keeps its existing destination but displays `Bắt đầu Module 1`
  instead of the generic `Tiếp tục`. The renderer contract, frozen-journey
  assertion, exact-copy Electron assertion, restart path, and desktop/mobile
  overflow checks were updated and passed. This scoped approval does not mark
  overall Foundation owner approval or pilot acceptance as complete.
- On 19 August 2026, the owner explicitly reopened all three introduction
  dialogues and supplied the replacement copy. The existing three-scene flow
  now presents the portfolio practice project, the recruiter-facing web
  portfolio outcome, and the transfer of those skills to other AI-built tools.
  Scene order, navigation, buttons, layout, and progress behavior remain
  unchanged. Typecheck, lint, 294 unit tests, nine startup tests, production
  build, exact-copy regressions, desktop and `390 × 844` inspection without
  horizontal overflow, full Electron smoke, and `git diff --check` passed.
  This scoped approval does not mark overall Foundation owner approval or
  pilot acceptance as complete.
- On 16 August 2026, the owner approved removing the complete Harness
  Engineering lesson from Module 1. The runnable course now has three Module 1
  lessons and an estimated 38 minutes; `/` and `@` route directly to the Codex
  configuration lesson. The retired lesson, visual, two checkpoints and
  Harness assessment topic were removed. Existing progress at those retired
  IDs now migrate to `module-1-setup-checklist`, and the assessment gate remains
  intact with a source-backed `/status` and `/goal` question. The related introduction
  script reference, Course Companion renderer, static guide, contracts and
  regression expectations were synchronized. Typecheck, lint, 274 unit tests,
  nine startup tests, production build and full Electron smoke passed. This
  scoped approval does not mark overall Foundation owner approval or pilot
  acceptance complete; every other introduction and Module 1 surface remains
  frozen.
- On 18 August 2026, the owner explicitly reopened Module 1 to add one
  two-page `AGENTS.md` and Skills lesson. The first page introduces only the
  Global and Current repo levels, shows Triết's current setup, and postpones
  learner file creation until a portfolio workspace exists. The second page
  introduces `frontend-design`, `copywriting`, and `skills.sh`; its single
  code-native example panel contains an English excerpt from `SKILL.md` and no
  screenshot. The lesson now has four lessons and an estimated 46 minutes.
  Module 2 asks the learner to create the Current repo file only after choosing
  the portfolio folder, then records the learner's confirmation without reading
  or grading the file. The owner approved the exact learner-facing content and
  the use of “ứng dụng này” instead of the internal product name. The current
  full verification suite passed. This scoped approval does not mark overall
  Foundation or Module 2 owner acceptance, or pilot acceptance, complete.
- On 18 August 2026, the owner explicitly reopened the first `AGENTS.md` page
  again to correct its reading order. It now starts with the learner's question
  about information the agent should remember, introduces `AGENTS.md` as the
  answer, and only then presents the Global and Current repo levels. On desktop,
  the introduction occupies the full row above two side-by-side level cards. At
  390 px, the cards and action row follow in one scrollable column without
  horizontal overflow or overlap. The runnable lesson, Teacher script, renderer,
  frozen regression and Electron smoke assertions are synchronized. Typecheck,
  lint, 292 unit tests, nine startup tests, production build and the full
  Electron smoke passed. This scoped approval does not mark overall Foundation
  owner approval or pilot acceptance complete.
- On 18 August 2026, the owner explicitly removed the closing sentence that
  told learners they would create the Current repo `AGENTS.md` in Module 2. The
  runnable lesson and renderer no longer contain that sentence, and its unused
  presentation style was removed. The frozen lesson digest and Electron smoke
  now protect the revised page, including an explicit absence assertion.
  Typecheck, lint, 292 unit tests, nine startup tests, production build and the
  full Electron smoke passed. This scoped approval does not mark overall
  Foundation owner approval or pilot acceptance complete.
- On 18 August 2026, the owner explicitly replaced the Skill-page transition
  with a learner-facing problem: `AGENTS.md` can preserve recurring actions but
  should not contain every technique for many specialized skills. The new copy
  leads from writing as one example to Skill as the answer. The opening label
  now renders `SKILL` larger than its supporting description so the current
  section is immediately recognizable. The runnable lesson, Teacher script,
  renderer, responsive styling, frozen regression and Electron smoke assertions
  are synchronized. Typecheck, lint, 292 unit tests, nine startup tests,
  production build, full Electron smoke at desktop and `390 × 844`, and
  `git diff --check` passed. This scoped approval does not mark overall
  Foundation owner approval or pilot acceptance complete.
- On 18 August 2026, the owner approved splitting the crowded Skill surface
  into two pages while keeping it inside the same `m1-agents-and-skills`
  lesson. The first Skill page now contains the transition from `AGENTS.md`,
  the `SKILL.md` explanation, the English excerpt, and its language note. The
  second page contains only the `frontend-design` and `copywriting` guidance
  plus the `skills.sh` discovery panel. The lesson therefore has three pages in
  total: one `AGENTS.md` page and two Skill pages. Scene contracts, back/forward
  navigation, runnable lesson, Teacher script, frozen hashes, and responsive
  smoke assertions are synchronized. Typecheck, lint, 292 unit tests, nine
  startup tests, production build, full Electron smoke at desktop and
  `390 × 844`, and `git diff --check` passed. This scoped approval does not mark
  overall Foundation owner approval or pilot acceptance complete.
- On 18 August 2026, the owner refined the second Skill page by centering the
  title and two portfolio-skill cards vertically with the `skills.sh` panel in
  the desktop frame. The same alignment rule leaves the narrow one-column flow
  content-sized. Typecheck, lint, 293 unit tests, nine startup tests, production
  build, full responsive Electron smoke, and `git diff --check` passed. This is
  part of the scoped two-page Skill approval and does not mark overall
  Foundation owner approval or pilot acceptance complete.
- On 24 August 2026, the owner approved splitting the crowded Module 1
  Model/Effort/Speed surface into two pages. The Model page now contains only
  the main introduction and the Sol, Terra, and Luna cards. The new Effort and
  Speed page contains the existing menu image, both trade-off explanations,
  and the unchanged recommended configuration. The rendered labels
  `MODEL · EFFORT · SPEED` and `Model: chọn theo loại công việc` are removed;
  all other learner copy remains unchanged. Scene contracts, five-page lesson
  navigation, back/forward controls, focused Electron assertions, and the
  frozen renderer digest are synchronized. Typecheck, the focused frozen
  Module 1 regression (2 tests), and `git diff --check` passed. Focused Browser
  inspection at 1280 × 720 confirmed a 25.6px positive
  gap between columns, no horizontal overflow, no overlap with navigation, and
  the expected transition from page 4/5 to page 5/5. Per the owner's explicit
  instruction, the full test, lint, build, and Electron suites were not rerun.
  This scoped UI approval does not mark overall Foundation owner approval or
  pilot acceptance complete.
- On 24 August 2026, the owner explicitly removed the redundant learner-facing
  setup page immediately before Module 1 Practice. The final Skills page now
  saves the existing `m1-setup-checklist` checkpoint and opens the unchanged
  `m1-codex-safe-setup` Practice in the same action, so the ten-page assessment
  inventory becomes nine pages without weakening the Practice review or return
  contract. Existing saved progress at the technical setup route reopens the
  Practice brief. A follow-up regression repair now renders the final Skills
  page behind that technical route instead of reading a removed page position,
  preventing the blank Course Companion window while keeping the redundant
  setup page absent. The five-page first lesson and current Practice brief
  assertions are synchronized. Typecheck, lint, 389 unit tests, nine startup
  tests, the production build, focused Module 1 regressions, full Electron
  smoke, and `git diff --check` passed. This scoped UI approval does not mark
  overall Foundation owner approval or pilot acceptance complete.
- On 18 August 2026, the owner explicitly reopened the Module 1 review to add
  two multiple-choice questions about `AGENTS.md` and Skills while preserving
  the four existing questions. The new questions use project-rule and reusable-
  workflow scenarios, distinct IDs, and the current official OpenAI sources.
  The mastery gate is 5/6, so a learner may still miss one question. The fifth
  question scene is active again, a sixth scene is registered, and historical
  answers to the retired question cannot satisfy either new question. The
  runnable quiz, lesson, script, start prompt, Teacher contract, mastery rubric,
  renderer, progress handling, frozen regression, and Electron smoke are
  synchronized. Typecheck, lint, 293 unit tests, nine startup tests, production
  build, full Electron smoke, and `git diff --check` passed. This scoped approval
  does not mark overall Foundation owner approval or pilot acceptance complete.
- On 18 August 2026, the owner explicitly removed the complete `Dùng cấu hình
  đã chọn` page. Module 1 now has three lessons and an estimated 42 minutes;
  the final Skills page routes directly to setup Practice. The runnable scene,
  lesson outline, checkpoint count, stale visual, styles, Teacher script,
  frozen regression, and Electron smoke journey were synchronized. Saved
  progress on the retired configuration lesson migrates to
  `module-1-setup-checklist`, while its retired IDs remain readable only for
  migration. Typecheck, lint, 293 unit tests, nine startup tests, production
  build, full Electron smoke, and `git diff --check` passed. This scoped
  approval does not mark overall Foundation owner approval or pilot acceptance
  complete.
- On 18 August 2026, the owner redirected the temporary Module 1 Practice
  bypass from Module 2 to the Module 1 review itself. The action is now labeled
  `Bỏ qua Practice · Duyệt bài trắc nghiệm` and opens `module-1-mastery`, so the
  owner sees the review introduction before all six questions. It still uses
  session-only content-review state: it does not approve Practice, complete the
  module, or mutate saved learner progress. The content-review contract and
  Electron smoke protect the destination, six-question render, and exact saved-
  progress preservation. Typecheck, lint, 293 unit tests, nine startup tests,
  production build, full Electron smoke, and `git diff --check` passed. This
  temporary bypass remains excluded from the mergeable learner-course scope.
- On 18 August 2026, the owner simplified the Module 1 review introduction by
  removing its title box and approved-configuration box from the rendered
  screen. Triết's dialogue now reads exactly `Bây giờ hãy cùng nhau trả lời các
  câu hỏi ôn tập để củng cố kiến thức vừa học nhen!`; the Continue action and
  six-question review are unchanged. The frozen renderer contract and Electron
  smoke now protect the absence of both boxes and the exact replacement copy.
  Typecheck, lint, 293 unit tests, nine startup tests, production build, desktop
  and `390 × 844` screenshot inspection without horizontal overflow, full
  Electron smoke, and `git diff --check` passed. This scoped approval does not
  mark overall Foundation owner approval or pilot acceptance complete.
- On 18 August 2026, the owner made the six-question Module 1 assessment pages
  question-only. The standalone `TEACHER · Triết` row, its guidance, the scene
  title box, and the assessment title, count, instructions, and divider are no
  longer rendered. The unchanged question cards begin at the top of the content
  surface, while the assessment retains a Module 1 accessibility label.
  Typecheck, lint, 293 unit tests, nine startup tests, production build, desktop
  visual inspection, full responsive Electron smoke, and `git diff --check`
  passed. This scoped UI approval does not mark overall Foundation owner
  approval or pilot acceptance complete.
- On 22 August 2026, the owner made the `← Trang trước` control unavailable on
  the first Module 1 slide so the lesson cannot navigate back into the completed
  course introduction. The same control becomes available again on the second
  slide and keeps its existing behavior everywhere else. Typecheck, lint, all
  303 unit tests, nine startup tests, production build, full Electron smoke, and
  `git diff --check` passed. This scoped navigation approval does not mark
  overall Foundation owner approval or pilot acceptance complete.
- On 18 August 2026, the owner extended the same question-only presentation to
  every formative and mastery question page in Modules 2–4. A shared renderer
  rule now removes the Teacher row, dialogue, scene title, assessment title,
  count, instructions, and divider whenever an assessment question is active.
  Question content, choices, submission controls, feedback, introductions, and
  result pages remain unchanged. The existing Module 2 layout already matched
  this rule; Module 3 and Module 4 now inherit it without module-specific
  exceptions. Typecheck, lint, 294 unit tests, nine startup tests, production
  build, desktop Module 4 visual inspection, full responsive Electron smoke,
  and `git diff --check` passed. This scoped approval does not mark overall
  module owner approval or pilot acceptance complete.
- On 18 August 2026, the verified content from source checkpoint `1aafad3` was
  prepared for integration into `Triet-V2-planning` through a content-only merge.
  The merge retains the real Practice coordinator and atomic completion gates;
  it excludes the content-review launcher, session routing, per-Practice bypass
  buttons, disabled-Practice notices, and review-only tests. The merge candidate
  passed typecheck, lint, 290 unit tests, nine startup tests, production build,
  full Electron smoke, `git diff --check`, and a source audit for all named
  review-only identifiers. This verification does not infer owner approval or
  pilot acceptance for any module.
- On 21 August 2026, the owner approved removing only learner-facing
  `NGUỒN PHƯƠNG PHÁP` panels from assessment feedback across Modules 1–4.
  `QUYẾT ĐỊNH CHƯƠNG TRÌNH` panels remain visible, and all quiz source metadata
  remains unchanged for internal traceability. Typecheck, lint, production
  build, nine startup tests, focused content-review Electron smoke, and
  `git diff --check` passed. The full unit run reached 305/306 tests and remains
  non-clean only because of the separately edited Module 2 `mastery-5` copy
  contract. This scoped UI approval does not mark overall Foundation or module
  owner approval, or pilot acceptance, complete.
- Later on 21 August 2026, the owner expanded that decision to remove the
  remaining `QUYẾT ĐỊNH CHƯƠNG TRÌNH` panels as well. Assessment feedback now
  renders no source-attribution panel, while quiz source metadata remains
  unchanged for internal traceability. Typecheck, lint, production build, nine
  startup tests, focused content-review Electron smoke, and `git diff --check`
  passed. The full unit run remains at 305/306 because of the same separately
  edited Module 2 `mastery-5` copy contract. This follow-up UI approval does not
  mark overall Foundation or module owner approval, or pilot acceptance,
  complete.
- On 19 August 2026, the Module 2 Practice prompt and Teacher panel were moved
  into one responsive layout with an explicit positive gap. Long prompt content
  now scrolls inside its own region instead of expanding into the Teacher
  panel. Electron smoke measures at least 16px between the rendered desktop
  bounds and 10px at `390 × 844`; typecheck, lint, 294 unit tests, nine startup
  tests, production build, full Electron smoke, and `git diff --check` passed.
  This layout correction does not change Module 2 implementation, owner
  approval, or pilot-acceptance status.
- A separate narrow Module 1 exception is approved: forward-looking transition
  copy may stop saying that Module 2 plans ContentPilot and may point to the new
  portfolio Module 2. No other Module 1 wording may change beyond the recorded
  exceptions under this plan.
- On 16 August 2026, the owner confirmed that `Executor` is an internal
  architecture term and must not be introduced to learners. Learner-facing
  lessons, scripts, quiz copy, Practice labels, artifact templates, Teacher
  responses, status messages, and recovery copy now use `Codex` or `task Codex`.
  Internal class names, IDs, evidence kinds, agent configuration, and
  architecture documentation retain `Executor`. The frozen Intro and Module 1
  digests, Course Companion assertions, and Electron smoke journey were
  synchronized. The terminology audit found no remaining `Executor` references
  in renderer copy, learner lessons, quizzes, the Codex setup page, artifacts,
  or Teacher-spoken script lines. Typecheck, lint, 274 unit tests, nine startup
  tests, production build, and Electron smoke passed. This scoped approval does
  not mark overall owner approval or pilot acceptance complete.
- On 16 August 2026, the owner approved replacing Module 1 question `m1-q4`
  with a direct comparison between 5.6 Sol and 5.6 Luna. The revised scenario
  distinguishes an ambiguous portfolio-structure task that needs analysis and
  judgment from a clear, repeatable, high-volume transformation task with a
  fixed output. It no longer mixes model selection with an Effort decision.
  The Bloom level, five-question structure, and 4/5 mastery gate are unchanged.
  Frozen-source regression, 274 unit tests, nine startup tests, production
  build, and Electron smoke passed. This scoped approval does not mark overall
  Foundation owner approval or pilot acceptance complete.
- On 16 August 2026, the owner approved removing question `m1-q5` and reducing
  the Module 1 review to four questions. The mastery gate is now 3/4, so a
  learner may still miss one question rather than being required to earn a
  perfect score. The runnable quiz, lesson, script, Teacher contract, mastery
  rubric, renderer scenes, saved decision label, and frozen-source regression
  are synchronized. Progress paused on the retired fifth-question scene moves
  safely to the four-question summary. Frozen-source regression, lint, 275
  unit tests, nine startup tests, production build, and Electron smoke passed.
  This scoped approval does not mark overall Foundation owner approval or
  pilot acceptance complete.
- On 16 August 2026, the owner approved replacing the Module 1
  `mock-completed` shortcut with Duy's existing live Practice coordinator.
  The unchanged learner action now opens the existing Practice brief, creates
  and opens a bound Codex task, moves the lesson window to the companion while
  work is active, and returns to the four-question review only after Triết has
  approved current task metadata. No Duy-authored lesson content or UI was
  imported. The full suite passed with 276 unit tests, nine startup tests,
  lint, production build, and Electron smoke covering the live-Practice
  transition and return path. This scoped approval does not mark overall
  Foundation owner approval or pilot acceptance complete.
- On 16 August 2026, the owner approved one cross-cutting visual exception for
  Course Companion: UI chrome uses only yellow, white, and black, with neutral
  gray hierarchy produced from white/black opacity. Raster artwork and
  instructional screenshots retain their source colors. This exception changes
  no lesson copy, images, navigation, checkpoints, or course behavior. Statuses
  remain understandable through labels and border styles instead of relying on
  additional semantic colors.
- Modules 2–4 may be replaced or created according to the approved curriculum.
- Existing ContentPilot code and historical planning contracts must not be
  deleted as incidental cleanup. They are retired from the runnable path first;
  archival or deletion is a separate later decision.

## Approved implementation decisions

The following decisions are settled for this implementation:

1. The primary learner is occupation-neutral: a non-technical beginner with
   real experience, projects, or honest documented concept work to present to
   one chosen audience. Marketers and content creators remain supported but no
   longer determine the project or examples.
2. The `0.3.0` course starts a fresh run from the introduction. State from the
   `0.2.0` test course is not migrated or archived and does not produce a
   migration notice. New `0.3.0` progress remains resumable normally.
3. Course Companion uses one persistent Executor Practice per module: one for
   Module 2, one for Module 3, and one for Module 4. Each Practice contains five
   resumable milestone checkpoints. Module 3 Milestone 2 also contains small
   implementation-slice checkpoints.
4. The introduction and Module 1 continue through their existing rendering
   path. The rewritten Module 2 and new Modules 3–4 use a modular course
   registry instead of extending the current monolithic scene map.
5. The learner selects one dedicated portfolio folder. The same folder is used
   throughout Modules 2–4. It must be outside the course repository.
6. Vercel is the supported default host for Module 4. Preview and production
   actions require an explicit security, privacy, approval, live-verification,
   and recovery gate.
7. Backend contact forms, authentication, analytics, payments, databases, and
   other data-processing services are outside the required beginner course.
   Adding one requires a separate scope and security review.
8. Learners advance through evidence gates, not elapsed time. Course UI and
   content must not promise fixed-duration lessons.
9. Course Companion uses one strict UI palette: yellow, white, and black only.
   Neutral grays come from white/black opacity; raster artwork and instructional
   screenshots are exempt. Automated source and rendered-surface checks prevent
   other UI color families from returning.
10. The former content-review branch did not satisfy any evidence or completion
    gate. Its approved content is now present on `Triet-V2-planning`, while its
    session-only review surface and Practice bypasses remain excluded. Practice
    is deferred, not deleted or simulated.

## Current-to-target impact map

| Current repository surface | Current state | Required target state |
|---|---|---|
| `docs/internal/target-learner-definition.md` | Optimized for marketers/content creators building ContentPilot | Occupation-neutral portfolio learner definition with marketers/content creators as supported examples |
| `docs/planning/version-a-curriculum-blueprint.md` | Six-module ContentPilot curriculum | Marked superseded for the runnable course and linked to the imported portfolio curriculum |
| `docs/planning/graduation-assessment-v1.md` | ContentPilot artifact and real-API graduation gates | Replaced by portfolio planning, build, debugging, release, deployment, ownership, and transfer evidence |
| `docs/planning/starter-repository-progression-v1.md` | Preconfigured Next.js ContentPilot starter | Retired from the runnable course; portfolio app is created from scratch in Module 3 |
| `pilot-workspace/course/course-structure.json` | Introduction, Module 1, and ContentPilot Module 2 only | Same introduction and Module 1 plus new portfolio Modules 2–4 |
| Module 2 lesson/script/quiz/prompt | Plans ContentPilot and produces two artifacts | Plans the learner portfolio and produces the full seven-artifact build contract |
| `pilot-workspace/contentpilot/` | Current Practice workspace | Not used by the new Modules 2–4; retained until archival is decided |
| `course-companion/shared/contracts.ts` | Course `0.2.0`, state schema 5, lesson IDs through Module 2 | Course `0.3.0`, state schema 6, semantic IDs through Module 4, silent clean restart for incompatible old state |
| `LearningWindow.tsx` | Roughly 3,000 lines with hardcoded Module 2 scenes | Frozen legacy path for introduction/Module 1 plus modular registry-driven Modules 2–4 |
| Practice definitions and adapters | Two evidence profiles with planning-package behavior hardcoded in several services | Generic module Practice lifecycle plus portfolio-planning, portfolio-build, and portfolio-release evidence profiles |
| Practice workspace resolver | Resolves only `pilot-workspace/` | Resolves and validates one learner-selected portfolio path |
| Progress completion gates | Hardcoded ContentPilot Module 2 Practice and 12/15 score | Module-specific evidence receipts and pilot-calibrated assessment gates through graduation |
| Electron smoke journey | Ends after Module 2 | Can verify each module independently and the complete Module 1-to-graduation path |

## Target implementation shape

### Modular course registry

The registry is a local TypeScript index, not a database or external service.
For each new module it connects:

- module identity and display metadata;
- lesson and scene definitions;
- semantic checkpoint IDs;
- quiz groups and mastery gate;
- Practice identity and version;
- artifact expectations;
- completion destination.

Recommended implementation paths:

```text
course-companion/src/renderer/src/course/
  registry.ts
  module-contracts.ts
  modules/
    module-2/
      definition.ts
      scenes.tsx
    module-3/
      definition.ts
      scenes.tsx
    module-4/
      definition.ts
      scenes.tsx
```

`LearningWindow.tsx` may delegate Modules 2–4 to this registry while retaining
the existing introduction and Module 1 scene implementation. A full rewrite of
the frozen path is out of scope.

### Stable IDs

Do not reuse an old ContentPilot checkpoint ID for a different portfolio
meaning. Use semantic IDs that survive scene-copy changes.

Recommended module-level checkpoints:

```text
Module 2
  m2-portfolio-brief
  m2-content-evidence
  m2-visual-reference
  m2-portfolio-prd
  m2-implementation-plan
  m2-complete

Module 3
  m3-scaffold-baseline
  m3-complete-first-version
  m3-whole-page-revision
  m3-evidence-debugging
  m3-independent-enhancement
  m3-complete

Module 4
  m4-release-validation
  m4-release-candidate
  m4-preview-deployment
  m4-production-decision
  m4-ownership-transfer
  m4-complete
```

Recommended Practice identities:

```text
m2-portfolio-planning
m3-portfolio-build
m4-portfolio-release
```

### Learner workspace

One learner-selected folder carries the project through the three modules:

```text
my-portfolio/
  planning/
  evidence/
    module-3/
    module-4/
  deployment/
  src/                  # created in Module 3
  public/               # created in Module 3
  AGENTS.md              # written by Course Companion in Module 2
  README.md              # created in Module 3
  package.json           # created in Module 3
```

Module 2 creates only `planning/` content and the Course Companion-written
root `AGENTS.md`. “Create from scratch” in Module 3
means that no application source, dependency manifest, design system, portfolio
component, or deployment configuration exists before the learner approves the
scaffold. The presence of approved planning artifacts does not make the app a
prepared starter.

Course Companion stores the canonical workspace path and evidence metadata in
its application-data directory. Learner artifacts stay in the selected folder.
The app must not copy the learner portfolio into the course installation.

### Learner artifact spine

The default artifact names are implementation contracts. Learner-facing copy
may describe them naturally, but the paths remain stable for evidence adapters.

```text
planning/
  portfolio-brief.md
  content-evidence-inventory.md
  reference/
    reference.md
    screenshots/
  PRD.md
  implementation-plan.md

evidence/module-3/
  scaffold-report.md
  design-direction.md
  build-log.md
  browser-validation.md
  revision-record.md
  debugging-report.md
  enhancement-plan.md
  final-change-summary.md

evidence/module-4/
  release-validation-report.md
  release-summary.md
  security-publication-checklist.md
  preview-deployment-report.md
  production-decision.md
  ownership-walkthrough.md
  known-limitations.md
  transfer-project/
    brief.md
    requirements.md
    validation-approach.md
    first-bounded-plan.md
```

Evidence receipts record the Practice version, current artifact digest,
learner approval, observation time, source, and freshness. A chat statement
without the matching current artifact digest cannot complete a gate.

## Checkpoint contract for implementation work

Every numbered implementation checkpoint below must satisfy all five rules:

1. **Bounded change:** the checkpoint changes one coherent behavior or content
   contract and names its non-goals.
2. **Runnable state:** Course Companion and the runnable Pilot remain usable at
   the end of the checkpoint.
3. **Focused verification:** relevant unit/content tests and `git diff --check`
   pass before acceptance.
4. **Evidence review:** inspect the complete changed-file list and confirm that
   the introduction, unrelated Module 1 content, and unrelated user work are
   untouched.
5. **Local Git checkpoint:** after the approved work is coherent and verified,
   stage only exact relevant files and create the repository-required local
   major-decision commit. Never push automatically.

The full Course Companion verification suite runs at each module acceptance
gate:

```text
npm test
npm run typecheck
npm run lint
npm run build
npm run test:electron
```

Run these commands from `course-companion/`. If Electron cannot launch because
of a sandbox boundary, report the blocked live check and rerun only with the
required approval. Static or unit evidence must never be presented as a passed
Electron journey.

---

## Foundation — Migrate the course safely

The foundation is not a learner module. It is the minimum cross-cutting work
needed to implement Module 2 without hardcoding another obsolete path. Complete
all foundation checkpoints before authoring the new Module 2 journey.

### F0.1 — Import authority and mark superseded contracts

**Change**

1. Copy the four approved portable planning files into
   `docs/planning/portfolio-course-v1/` with a short provenance README containing
   source path, import date, and source file digests.
2. Revise `docs/internal/target-learner-definition.md` for the approved
   occupation-neutral portfolio learner. Keep its internal-only boundary.
3. Add clear supersession notices to the old Version A blueprint, ContentPilot
   graduation assessment, starter progression, and artifact/run-state contract.
4. Update planning indexes so a future implementer cannot mistake ContentPilot
   plans for the new runnable direction.
5. Do not delete `starters/contentpilot/`, `pilot-workspace/contentpilot/`, or
   historical plans.

**Verify**

- Imported file digests match the portable originals.
- Planning links resolve.
- The internal target learner is not copied into learner-facing content.
- `rg` finds one clearly named current curriculum authority.

**Checkpoint output:** Authoritative portfolio curriculum snapshot and an
unambiguous supersession map.

### F0.3 — Add the modular Module 2–4 registry

**Change**

1. Bump the course to `0.3.0` and learner-state schema 6. Treat incompatible
   state from the `0.2.0` test course as a new run without migration, archive,
   or learner-facing notice.
2. Define a typed module contract for metadata, scenes, checkpoints, quizzes,
   Practice identity, and completion destinations.
3. Add the registry and route only Modules 2–4 through it.
4. Keep introduction and Module 1 on the current renderer path.
5. Add validation for duplicate IDs, unknown checkpoint references, broken
   scene destinations, and module-order errors.
6. Add a frozen-journey regression test for introduction and Module 1.

**Verify**

- Existing introduction and Module 1 unit tests pass unchanged.
- A valid `0.2.0` state loads as a new course run and no migration message or
  legacy archive is created.
- Snapshot or semantic assertions prove the frozen introduction has no content,
  asset, navigation, or behavior change.
- Module registry rejects deliberately malformed fixture definitions.
- The app can render a minimal placeholder Module 2 definition without
  extending the legacy scene map.

**Checkpoint output:** A safe extension point for the rewritten and new modules.

### F0.4 — Resolve one learner-selected portfolio workspace

**Change**

1. Add a folder-selection flow before the first Module 2 Practice.
2. Canonicalize the selected path and reject:
   - the course repository or any folder inside it;
   - the Course Companion application-data directory;
   - a file path instead of a directory;
   - an unreadable or unwritable directory;
   - a non-empty unrelated project unless the learner deliberately chooses a
     separately supported import path in a future release.
3. Persist one approved path per course run and reuse it across Modules 2–4.
4. Require confirmation before creating `planning/` or any later app files.
5. Provide recoverable states for moved, renamed, missing, or permission-denied
   folders. Never fall back silently to `pilot-workspace/`.
6. Record only the path and bounded metadata; do not index unrelated files.

**Verify**

- macOS and Windows path fixtures, including spaces and non-ASCII characters.
- Symlink/canonical-path escape attempts.
- Course-repository rejection.
- Missing-folder recovery.
- Relaunch and exact-path resume.
- The old `pilot-workspace` resolver remains available only to the unchanged
  Module 1 Practice.

**Checkpoint output:** One safe, persistent learner-owned portfolio workspace.

### F0.5 — Generalize Practice stages and evidence profiles

**Change**

1. Preserve the one-active-Practice rule.
2. Replace assumptions that every writable Practice is
   `m2-planning-package` with definition-driven Practice identities.
3. Add three evidence profiles:
   - `portfolio-planning`;
   - `portfolio-build`;
   - `portfolio-release`.
4. Add stage receipts so one Practice can save five milestone checkpoints
   without spawning five Executor tasks.
5. Bind every receipt to course run, Practice run, Practice version, workspace,
   artifact digests, and freshness.
6. Retain live/stale/offline/error honesty and the distinction between
   Executor-reported checks and independently corroborated file evidence.
7. Do not append new instructions to an old Module 2 active task. The clean
   restart makes old task state ineligible for the portfolio course.

**Verify**

- Parser rejects unsupported profile/policy combinations.
- Stage order and dependency tests.
- Resume after app quit at every stage.
- Stale artifact invalidates only dependent stage receipts.
- A newer artifact digest cannot inherit an older approval.
- Module 1 configuration Practice still passes its existing tests.

**Checkpoint output:** Reusable module Practice infrastructure without a
course-long or milestone-per-task chat explosion.

### Foundation acceptance gate

Do not begin Module 2 content implementation until:

- all four retained foundation checkpoint outputs exist;
- the introduction and Module 1 frozen regression passes;
- the silent clean-restart fixture passes;
- the learner workspace is never resolved inside the course repository;
- Course Companion passes unit, type, lint, build, and Electron smoke checks;
- the scoped foundation commits contain no Module 2 learner-facing curriculum.

---

## Module 2 — Learn planning and PRDs before portfolio practice

### Module outcome

After seven focused Course Companion explanation pages, the learner
uses one persistent Codex task to turn a vague portfolio idea into five current,
learner-approved planning documents. The learner answers one plain-language
question at a time; Executor creates and updates the documents; Course
Companion independently inspects the files and current digests after every
stage. Module 2 ends with an approved implementation plan. Module 3, not Module
2, proposes the first concrete implementation task and begins building.

### Approved redesign authority — 17 August 2026

The approved product and artifact contract is recorded in
`docs/planning/module-2-redesign-working-spec.md`. It supersedes the previous
seven-artifact design for future implementation while preserving honest
historical progress notes about the runnable baseline.

The learner-facing stages and documents are:

| Stage | Learner-facing name | Current output |
| --- | --- | --- |
| 1 | Mục đích của portfolio này là gì? | `planning/portfolio-brief.md` |
| 2 | Hiện tại bạn đang có những gì? | `planning/content-evidence-inventory.md` |
| 3 | Bạn muốn portfolio của mình trông như thế nào? | `planning/reference/reference.md` plus optional sourced screenshots |
| 4 | Hoàn thành PRD | `planning/PRD.md` |
| 5 | Tạo kế hoạch triển khai | `planning/implementation-plan.md` |

The Stage 5 document absorbs requirement-to-validation coverage. The previous
`planning/requirement-validation-map.md` and
`planning/first-bounded-task.md` contracts are retired. Module 2 creates no
application, implementation task, dependency decision, command, or source file.

Course Companion owns approval timestamps, artifact digests, stage receipts,
freshness, and the review summary. Learners never fill technical metadata or
open templates as required work.

### Page-preservation correction — 18 August 2026

The owner explicitly restored the PRD definition, PRD anatomy, and coding-agent
review pages that the three-page redesign removed without a page-specific
deletion request. This changes the explanation route from three to six pages:
planning before building; PRD definition; PRD anatomy; PRD creation/review; one
persistent Codex task; and the five-stage map. The following Practice
transition remains separate. This correction changes the page count and
navigation contract only; it does not reopen the five-stage/five-document
Practice design.

### Exact-page deletion correction — 18 August 2026

The owner subsequently requested deletion of the exact “Một PRD tốt cần có
những gì?” page. The current five-page explanation route is: planning before
building; PRD definition; PRD creation/review; one persistent Codex task; and
the five-stage map. Saved progress that still points to the retired page moves
to PRD creation/review and removes that retired identity from history. No other
page or learner-facing copy is reopened by this deletion.

### One-task-page deletion correction — 18 August 2026

The owner subsequently requested deletion of the exact “Một task Codex, năm
lần duyệt” explanation page. The current four-page explanation route is:
planning before building; PRD definition; PRD creation/review; and the
five-stage map. The Practice still uses one persistent Executor task across all
five stages; only the separate explanation page is retired. Saved progress that
points to that page moves to the five-stage map and removes the retired identity
from history. No other page or learner-facing copy is reopened by this deletion.

### Implementation-plan walkthrough expansion — 19 August 2026

The owner approved a fictional portfolio implementation plan whose only purpose
is to teach the format before Practice. Five new pages follow the existing
four-page explanation route: one overview, then focused views of requirements
and boundaries, implementation stages, expected files and checks, and finally
risks, assumptions, and the approval stop. The example is explicitly labeled as
fictional and not an answer for the learner's portfolio. It does not change the
five-stage Practice contract, create a learner artifact, or claim that
implementation has started.

### Implementation-plan walkthrough simplification — 19 August 2026

The owner subsequently approved reducing the walkthrough to two informational
pages. The first page shows that an implementation plan contains multiple
ordered phases. The second page shows that every phase has its own observable
completion criteria. Neither page asks the learner a question; questions remain
in the end-of-lesson assessment. The three detail pages about requirements,
files and testing, and risks are retired from the learner route, while those
details remain available in the full fictional sample plan. Together with the
five preceding explanation pages, the current route has seven explanation pages
before Practice.

### Current repository comparison — 17 August 2026

**Preserve:**

- one selected external portfolio workspace;
- one persistent Executor task across all five stages;
- five ordered stage receipts, current-digest approval, stale invalidation,
  resumability, and atomic Module 2 completion;
- strict write scope under `planning/`, including bounded reference
  screenshots, with application code and dependency changes rejected;
- the separate mastery gate unless a later explicit owner decision reopens it;
- Module 3 receiving the selected workspace and current planning references,
  never an old chat transcript as hidden context.

**Replace or migrate:**

- the current outline and milestone-by-milestone teaching/example route with
  seven focused explanation surfaces followed by the real Practice;
- every seven-artifact list in the manifest, shared contracts, Practice
  definition, registry, evidence adapter, completion service, fixtures, and
  tests with the five-document contract;
- the learner-facing phrases `dấu hiệu thành công`, `đã kiểm chứng`, `lời tự
  khai`, and `implementation contract` with the approved questions, evidence
  labels, and stage names;
- the requirement for a URL and screenshot in every reference case with a
  source-aware contract that also permits learner-owned images and explicitly
  bounded unknown rights;
- the separate validation-map and first-bounded-task templates and all
  completion/mastery logic that reads or summarizes the first task;
- the current Module 2 Practice version and obsolete progress references so a
  receipt for the old artifact set cannot satisfy the new gate.

**Known implementation surfaces:**

- `pilot-workspace/course/course-structure.json`, the Module 2 lesson, Teacher
  script, start prompt, quiz, Practice definition, rubric, and planning
  templates;
- `course-companion/shared/contracts.ts` and the shared Module 2 registry
  definition;
- renderer scenes, outline/progress labels, Practice launch/resume routing, and
  the narrow Module 3 readiness handoff;
- `portfolio-planning-evidence-adapter.ts`,
  `portfolio-module-completion-service.ts`, Practice/progress repositories, and
  their stage/digest contracts;
- focused Module 2 curriculum, registry, evidence, completion, progress,
  coordinator, Electron smoke, and frozen-transition tests.

The pre-Module-1 introduction remains frozen. Temporary content-review Practice
bypasses on `practice-disabled-content-development` are not part of this
redesign and must not enter the real completion path.

**Planning checkpoint status — 17 August 2026:** Product design is approved and
the repository gap inventory is complete. No runnable course, contract, test,
or learner progress has been changed by this planning checkpoint. Verification
is limited to document inspection and `git diff --check`; runtime verification
remains `pending`. The next permitted action is one final owner confirmation of
the implementation scope above, followed by bounded implementation and focused
checkpoint commits. Pilot acceptance remains `pending` until a real disposable
workspace rehearsal and required learner evidence pass.

### Delegated Teacher/Executor integration boundary — 17 August 2026

The owner approved a split implementation. This repository checkpoint owns the
three Course Companion explanation pages, outline/navigation for content review,
learner-facing stage names, questions that do not require a live agent, and a
detailed technical handoff. It does **not** implement Teacher orchestration, the
persistent Executor task, document creation/update, filesystem digest review,
accept/revise receipts, stale/resume/completion behavior, progress migration,
or the Module 3 runtime handoff.

The delegated work is specified in
`docs/planning/module-2-teacher-executor-integration-handoff.md`, including the
state machine, five document contracts, file ownership, checkpoint order, test
matrix, atomic completion gate, and Module 3 first-task boundary. Until those
checkpoints pass, the redesigned Module 2 is reviewable content, not a runnable
or accepted learner flow.

### M2.1 — Lock the module manifest and artifact contracts

**Change**

1. Replace the Module 2 entry in `course-structure.json` with the five approved
   stages, learner-facing names, and semantic checkpoints.
2. Set `nextLessonId` to Module 3, but keep Module 3 locked until the Module 2
   evidence and mastery gates pass.
3. Replace the seven-artifact manifest with exactly five planning documents:
   the brief, evidence inventory, reference record, PRD, and implementation
   plan. Reference screenshots remain bounded supporting evidence rather than
   additional planning documents.
4. Retire `planning/requirement-validation-map.md` and
   `planning/first-bounded-task.md`; move requirement-validation coverage into
   `planning/implementation-plan.md` without creating a Module 3 task.
5. Define the approved headings, plain-language evidence labels, learner-owned
   decisions, source/rights boundaries, and system-managed approval metadata.
6. Bump the Module 2 Practice contract version and reject or safely redirect
   obsolete seven-artifact progress so old receipts cannot satisfy the new gate.
7. Keep technology selection, commands, dependency choices, implementation
   tasks, and application code out of Module 2.

**Verify**

- Course-structure parser accepts the manifest.
- Exactly five document paths are unique and under `planning/`.
- Templates contain no completed learner answer or hidden portfolio solution.
- The implementation plan contains both requirement-validation coverage and
  phased planning, but no first implementation task.
- Old seven-artifact receipts cannot unlock Module 3.
- Module 2 cannot open Module 3 without the gate receipt.

**Checkpoint output:** A machine-readable Module 2 contract and solution-free
artifact templates.

### M2.2 — Author the concept-first journey and five practice milestones

**Change**

Create or replace the Module 2 lesson, Teacher script, and start prompt in
natural Vietnamese:

1. Present five focused Course Companion knowledge slides before the Practice
   transition:
   - why planning matters;
   - what a PRD is and is not;
   - how a learner creates, reviews, and approves a PRD with a coding agent;
   - how visual references and a browser prototype can support planning;
   - what an implementation plan is, alongside one fictional example with
     ordered phases and observable completion criteria.
2. Retire 22 Teacher-led pre-Practice setup, example, application and
   formative-check slides. Retain one technical Course Companion folder picker
   so a learner selects and confirms the persistent portfolio workspace before
   Practice can start. Detailed
   clarification happens inside the one persistent Practice task, not across
   separate teaching tasks or learner-filled forms.
3. Keep explanations short, beginner-first, and transferable beyond portfolio
   work. Pafolios is the default discovery suggestion; Awwwards is an optional
   expressive source with an explicit complexity/copying warning.
4. Start the real portfolio-planning Practice immediately after the explanation
   surfaces and required technical workspace-readiness boundary.

The nested portfolio milestones are:

1. Determine the portfolio's purpose and create the portfolio brief.
2. Inventory current content and evidence.
3. Choose a reference and record liked, unsuitable, uncertain, source, and
   rights information without designing the UI.
4. Synthesize the first three approved documents into the PRD; ask only when a
   high-impact gap cannot be resolved from current evidence.
5. Create one implementation plan containing requirement-validation coverage
   and ordered phases, then stop before any implementation task is created.

Each milestone follows:

```text
Executor reads current approved inputs
-> asks one necessary plain-language question, if any
-> Executor creates or revises the document
-> inspect fresh evidence
-> Course Companion summarizes
-> learner accepts or requests a revision
```

Executor questions are asked one at a time with a recommended answer when the
choice is consequential. Stages 4 and 5 draft first and do not re-interview the
learner. The learner may describe preferences in ordinary language. The script
must use the approved labels `Có bằng chứng`, `Do bạn xác nhận`, `Đang giả định`,
and `Còn thiếu`, while preserving private/publication/ownership boundaries.

**Verify**

- Every curriculum milestone appears once and in approved order.
- Exactly five knowledge slides and one technical workspace picker precede one
  real Practice launch; the picker is not a Teacher-led knowledge slide.
- No fixed duration or speed promise appears.
- No learner is required to open a template, fill technical metadata, read
  code, choose dependencies, create a task, or create the app.
- The exact approved Stage 1 question replaces `dấu hiệu thành công` wording.
- Reference guidance prohibits copying content, branding, images, and source
  code while permitting an honestly bounded unknown-rights reference.
- Vietnamese content passes diacritic and terminology review.

**Checkpoint output:** Complete source-first Module 2 instruction aligned with
the five-document contract.

**Progress note — 17 August 2026:** The owner-approved four-part structure now
teaches planning and PRD concepts before introducing the portfolio practice.
The author's opening language remains in Part 1, while “Bây giờ, chúng ta sẽ
chính thức bắt tay vào tạo Portfolio.” remains at the Part 4 transition. The
dedicated “Một PRD tốt cần có những gì?” page has been retired; Part 2 now moves
directly to the coding-agent PRD workflow in Part 3. The five nested portfolio
milestones and seven-artifact contract were unchanged at that historical
checkpoint and are now superseded by the approved redesign above. Focused tests,
all 288 unit tests, nine startup tests, typecheck, lint, production build, and
full Electron smoke passed.

**Content-redesign progress note — 17 August 2026:** The renderer now presents
the approved three-page narrative: planning before building; one Codex task with
five learner approvals; and the five-stage/five-document map. The third page
mentions Pafolios and Awwwards with complexity and copying boundaries, then
routes to the Practice scope through the normal course flow. A legacy
transition remains on the runnable seven-artifact path solely to avoid claiming
that the delegated Practice migration already exists. The Teacher lesson,
script, prompt, templates, and live Practice contract remain explicitly
delegated rather than partially rewritten here.

### M2.3 — Keep the final mastery assessment

**Change**

1. Preserve the separate mastery gate because its removal has not been approved,
   but remove or rewrite assessment items that assume seven artifacts, a
   separate validation map, or a first bounded task in Module 2.
2. Remove the five formative quiz groups that existed only to support the
   retired Practice-setup slides. Do not rebuild milestone-by-milestone teaching
   pages merely to host retrieval checks.
3. Require learner-owned short answers only where they demonstrate ownership of
   audience, scope, evidence, or requirement-validation decisions in the five
   current documents.
4. Keep exact numeric passing thresholds configurable. Do not publish a final
   threshold until representative beginner pilots support it.
5. Keep Teacher-led quiz delivery one question at a time in conversation.
6. In Course Companion, show every question in the current quiz group before
   submission. For the Module 2 final group, save the fifth unscored reflection
   as self-reviewed when the learner submits, then open the summary directly.
   Keep the summary's full-group retry path when any scored answer is incorrect.
   Other assessment groups retain their existing post-submit feedback flow.

**Verify**

- Teacher-led delivery remains one question at a time.
- Course Companion submits the complete Module 2 group once, records the fifth
  reflection as self-reviewed, and opens the summary without a second
  “Xem kết quả 5 câu” action; an incorrect scored choice can be retried from the
  summary.
- Every answer traces to the imported source audit or an explicitly labeled
  curriculum judgment.
- No answer can pass merely by repeating the example portfolio.
- No question requires `planning/requirement-validation-map.md`,
  `planning/first-bounded-task.md`, or a Module 2 implementation task.
- Practice completion cannot substitute for mastery, and mastery cannot
  substitute for current artifacts.

**Checkpoint output:** Portfolio-specific final mastery assessment.

**Content-redesign progress note — 17 August 2026:** Agent-independent Module 2
questions now use the approved Stage 1 outcome wording and evidence labels.
Mastery validation reads the relevant section of
`planning/implementation-plan.md`, and the former first-task scenario now tests
the Module 2/3 boundary. The live artifact review and mastery completion service
still use the old runtime contract until delegated integration checkpoints
I1–I6 are implemented.

### M2.4 — Implement the `m2-portfolio-planning` Practice

**Change**

1. Add the version 2 Practice definition with five descriptive document
   checklist items and one final-package submission gate.
2. Open the learner-selected portfolio folder in one persistent Executor task.
3. Limit write scope to the five approved planning documents and bounded
   reference screenshots.
4. Extend planning evidence collection to validate:
   - required sections and artifact digests;
   - the approved plain-language evidence labels and privacy/permission review;
   - learner-owned or externally sourced references, optional useful
     screenshots, and explicit unknown-rights boundaries;
   - PRD scope and acceptance criteria;
   - one-to-one requirement-validation coverage inside the implementation plan;
   - phased plan dependencies, non-goals, and the absence of a Module 2
     implementation task;
   - learner approval of the current versions.
5. On submission, Course Companion inspects the current five documents and
   records explicit learner approval of the current PRD and plan before AI
   review. A needs-work result keeps the same task available for revision;
   do not require five separate approvals or additional interviews.
6. Executor synthesizes settled document inputs and asks only for unresolved
   high-impact decisions, without re-interviewing settled PRD requirements.
7. Prevent implementation source, task creation, dependency installation, or
   deployment work.

**Verify**

- Missing, stale, malformed, or unapproved packages cannot pass final review.
- Unexpected application files fail scope control.
- A reference may be a URL, screenshot, or learner-owned image; unclear rights
  remain explicitly bounded and never authorize public reuse.
- The existing task can resume after relaunch without creating a replacement.
- Approval and submission bind to the current course, run, task, workspace and
  five document digests; any changed input requires fresh approval and review.
- Returning from the passed submission opens Module 2 mastery, not Module 3.

**Checkpoint output:** A live, resumable portfolio-planning Practice with fresh
artifact evidence.

### M2.5 — Render Module 2 through the registry

**Change**

1. Build the Module 2 definition and scenes in its module package.
2. Present five focused knowledge scenes followed by one technical
   portfolio-folder readiness boundary and the single real Practice entry.
   Current repo `AGENTS.md` and stage setup belong to Executor Practice, not
   Course Companion slides.
3. Update progress display, Practice launch/resume/revision recovery, quiz, and
   mastery surfaces through the shared registry contract without exposing
   templates or technical approval metadata to the learner.
4. Use the approved learner-facing names for all five stages and documents.
5. Reuse existing visual assets where possible. Any discovery-source UI links
   directly to the current official Pafolios or Awwwards page and includes the
   approved guidance about complexity and copying.
6. Preserve the approved Module 1 transition destination and frozen
   pre-Module-1 surfaces; add assertions that unrelated frozen copy and behavior
   remain unchanged.
7. Redirect or retire obsolete Module 2 scene/progress identities without
   treating old seven-artifact progress as completion of the redesigned module.

**Verify**

- Supported desktop Course Companion layouts.
- Keyboard and focus behavior.
- No Teacher-led `AGENTS.md`, milestone example or formative-check slide appears
  between the fifth knowledge slide and Practice. The only intermediate surface
  is the technical folder picker required by the workspace resolver.
- Exactly five knowledge slides and one technical workspace picker precede the
  real Practice.
- The PRD definition routes through coding-agent review directly to the
  visual-planning and implementation-plan knowledge slides; all retired
  PRD-anatomy, one-task and Practice-setup pages are unreachable.
- Correct return/review destination after every Practice stage and quiz group.
- Exact resume from each milestone.
- Module 1 frozen-content diff/snapshot check.

**Checkpoint output:** Complete learner-facing Module 2 in Course Companion.

**Progress note — 17 August 2026:** The existing Module 2 entry scene now starts
three general planning/PRD parts before the Part 4 portfolio transition and
workspace-selection page, preserving the frozen Module 1 destination and
resumable scene identity. The lesson HUD keeps Teacher and Quit at the upper
right and places a four-part outline trigger in the center. Its open menu uses a
small circle for every part, bold yellow treatment for the current part, reduced
opacity for completed parts, and normal treatment for upcoming parts without
status labels. Electron smoke verifies desktop and `390 × 844` placement, all
three progress states, no horizontal overflow, reachable navigation, and the
complete transition into workspace selection. Saved progress on the retired
PRD-anatomy page redirects to the coding-agent PRD workflow and removes the old
scene from history. Focused progress tests and the full automated/Electron suite
passed. This is evidence for the superseded four-part baseline, not verification
of the approved three-page redesign.

**Content-redesign progress note — 17 August 2026:** The Module 2 outline now
contains exactly three learner-facing entries, the shared lesson labels use the
five approved stage names, and the Practice/mastery/completion copy describes
five target documents. Desktop and `390 × 844` screenshots and full Electron
smoke passed. This verifies layout, navigation and content only; shared artifact
paths, Practice version, evidence adapters and completion remain intentionally
unchanged for the delegated integration owner.

**Page-restoration progress note — 18 August 2026:** The current one-task page
remains intact. The PRD definition, anatomy, and coding-agent review pages are
again reachable immediately after it, followed by the five-stage map and the
Practice transition. The outline now exposes all seven learner-facing entries,
and saved progress on `module-2-prd-anatomy` resumes that restored page instead
of redirecting past it. The current full suite passed with 288 unit tests, nine
startup tests, typecheck, lint, production build, full Electron smoke, desktop
screenshot inspection, and `390 × 844` responsive checks.

**PRD-first ordering note — 18 August 2026:** At the owner's explicit request,
the restored PRD definition, anatomy, and coding-agent review pages now precede
the intact one-task workflow page. The route, outline, active-part mapping, back
history, resume fixture, and smoke coverage are synchronized without rewriting
any existing learner-facing copy. Verification passed with 288 unit tests, nine
startup tests, typecheck, lint, production build, full Electron smoke, desktop
screenshot inspection, and `390 × 844` responsive checks.

**Exact-page deletion note — 18 August 2026:** At the owner's subsequent
explicit request, `module-2-prd-anatomy` and its Pilot lesson/script section are
retired. The PRD definition now routes directly to coding-agent PRD review; the
outline, renderer registry, active-part mapping, source contract, smoke route,
and saved-progress migration are synchronized. Verification passed with 288
unit tests, nine startup tests, typecheck, lint, production build, full Electron
smoke, desktop screenshot inspection, and `390 × 844` responsive checks.

**Original-copy restoration note — 18 August 2026:** At the owner's explicit
request, the first Module 2 explanation scene again renders the author's
approved opening paragraph verbatim from the Pilot lesson and Teacher script.
The replacement paragraph introduced by the content redesign is retired. A
source-to-renderer contract assertion and Electron smoke assertion now protect
the exact wording. Verification passed with 288 unit tests, nine startup tests,
typecheck, lint, production build, full Electron smoke, desktop screenshot
inspection, and `390 × 844` responsive checks.

**Illustration-first explanation note — 18 August 2026:** The owner clarified
that the Module 2 opening scene must remain and only its summary panel should be
removed. The first three explanation scenes now use existing, source-documented
course images in place of their summary panels: Codex planning before action, a
concrete PRD request, and a PRD review beside the Codex conversation. The fourth
explanation scene keeps its existing Pafolios/Awwwards gallery. Functional
transition and workspace surfaces remain unchanged; summary panels are a
fallback when no useful illustration exists. Verification passed with 294 unit
tests, nine startup tests, typecheck, lint, production build, full Electron
smoke, desktop screenshot inspection, `390 × 844` responsive checks, and no
horizontal overflow. Overall Module 2 owner acceptance and pilot acceptance
remain pending.

**Two-page implementation-plan correction — 19 August 2026:** The owner
approved replacing the five-page walkthrough with two informational pages. The
first shows four ordered phases. The second pairs every phase with its own
observable completion criteria. There are no questions on either page; the
learner encounters questions only in the end-of-lesson assessment. The three
retired detail-page identities migrate to the remaining completion-criteria
page and are removed from saved history. The full fictional sample plan keeps
the secondary details for learners who want to inspect the complete format.
Verification passed with 299 unit tests, nine startup tests, typecheck, lint,
production build, full Electron smoke, desktop and `390 × 844` screenshot
inspection without horizontal overflow, and `git diff --check`.

**PRD-to-implementation-plan bridge — 20 August 2026:** At the owner's explicit
request, the Module 2 explanation route now places one standard Teacher page
between the PRD/design-planning page and the two-page fictional plan. The page
uses the owner's supplied explanation of an implementation plan, ordered phases,
completion criteria, and the learner's review role. Its primary action opens the
fictional plan, making the two-column document layout an intentional example
rather than an abrupt change of teaching style. Verification passed with 305
unit tests, nine startup tests, typecheck, lint, production build, focused
content-review Electron smoke, exact-copy and route assertions, and desktop
`1180 × 780` plus narrow `390 × 844` inspection without clipping or horizontal
overflow. The full Electron smoke remains blocked before Module 2 by the
unrelated missing Module 1 review-bypass control.

**Implementation-plan page consolidation — 21 August 2026:** At the owner's
explicit request, the two standalone fictional-plan pages are retired. Their
left-side explanations are removed, while the complete fictional plan with all
completion criteria is placed beside the existing “Implementation plan là gì?”
introduction. The combined page routes directly to Practice. Saved progress on
either retired page returns to the combined introduction, and both retired IDs
are removed from saved history. This reduces the explanation slice from seven
pages to five without changing the plan artifact or Module 2/3 boundary.
Typecheck, lint, 305 unit tests, nine startup tests, a production build,
`git diff --check`, and the focused content-review Electron smoke passed.
Rendered inspection at `1180 × 780` and `390 × 844` confirmed the combined page
has no overlap, clipping, or horizontal overflow. The full Electron smoke still
stops before Module 2 at the unrelated missing Module 1 review-bypass control,
so overall Module 2 verification and acceptance are not inferred from this
scoped result.

**Implementation-plan visual refinement — 21 August 2026:** At the owner's
explicit request, the combined plan page removes the yellow outer frame and its
inset line, then rounds both the board and the white sample-document surface.
No lesson copy, route, or behavior changed. Typecheck, lint, 305 unit tests, nine
startup tests, a production build, `git diff --check`, and the focused
content-review Electron smoke passed. Rendered inspection at `1180 × 780` and
`390 × 844` confirmed the rounded treatment and no horizontal overflow. The
full Electron smoke still stops before Module 2 at the unrelated missing Module
1 review-bypass control, so overall Module 2 verification and acceptance remain
pending.

**Fullscreen responsive layout correction — 21 August 2026:** At the owner's
explicit request, the first three illustration-first Module 2 pages now place
their title and illustration in one desktop grid with a measured `16px` gap,
instead of anchoring both panels independently. The bounded Teacher copy is
centered horizontally inside its panel while remaining left-aligned for
reading. Focused Electron content review passed at `1180 × 780`, fullscreen
`1512 × 982`, increased text size, and `390 × 844`; rendered bounds confirmed
positive title-to-illustration and illustration-to-Teacher gaps, balanced text
insets, action clearance, and no horizontal overflow. The same pass inspected
the two-source reference gallery and combined implementation-plan page after
their images loaded. Typecheck, lint, production build, and `git diff --check`
passed before later unrelated concurrent edits. The current full unit rerun has
one pre-existing exact-copy mismatch after the separately edited Module 2
opening. The design-reference-link typing issue is resolved; the full Electron
rerun now stops before Module 2 at the unrelated missing Module 1 review-bypass
control. Neither blocker is treated as evidence
against the focused layout result; overall Module 2 owner approval and pilot
acceptance remain pending.

**Illustration-page vertical balance — 21 August 2026:** At the owner's explicit
request, all four illustration-led Module 2 pages now treat the Teacher
character, title or two-source gallery, and dialogue as one desktop composition.
The composition centers safely when the viewport has spare height and falls
back to top-aligned scrolling when content grows. The gallery retains two
separate image columns; assessment, Practice, copy-prompt, and lesson-board
pages keep their existing specialized layouts. No lesson copy, route, progress
state, or control behavior changed. Focused content-review Electron smoke and
production build passed at `1180 × 780`, `1512 × 982`, increased text, and the
existing narrow regression viewport. Rendered bounds confirmed at least `16px`
between the upper stage and dialogue, a `14px` gallery-column gap, balanced
top-and-bottom desktop whitespace, and no horizontal overflow. Typecheck, lint,
production build, the focused Electron journey, and `git diff --check` passed.
The full unit run has 305/307 passing tests and remains non-clean for two
separately edited Module 2 copy contracts; the full Electron journey still
stops before Module 2 at the unrelated missing Module 1 review-bypass control.
Overall Module 2 owner approval and pilot acceptance remain pending.

**Content-sized title boxes — 21 August 2026:** At the owner's explicit request,
the first three illustration-led Module 2 title boxes now opt out of CSS grid's
default cross-axis stretch, so each box ends after its content and intended
bottom padding instead of inheriting empty height from the illustration row.
No lesson copy, route, control, or image changed. The shared Electron layout
regression now measures the final title-content edge against the box's computed
padding and border. Focused content-review Electron smoke passed at `1180 ×
780`, `1512 × 982`, increased text size, and the existing narrow regression
viewport; rendered inspection confirmed the reported PRD-review title box is
content-sized. Typecheck, lint, production build, and `git diff --check` passed.
All nine startup tests passed. The full unit run remains at 305/307 because of
the same two separately edited Module 2 copy contracts. The full Electron
journey still stops before Module 2 at the unrelated missing Module 1
review-bypass control. Overall Module 2 owner approval and pilot acceptance
remain pending.

**Complete content-review route — 21 August 2026:** At the owner's explicit
request, session-only Module 2 content review now follows all 23 slides between
the combined implementation-plan introduction and the Practice entry instead
of jumping directly to Practice. The workspace and Current repo `AGENTS.md`
slides remain visible but use review-only `Tiếp tục` actions: review does not
open the folder picker, require learner self-confirmation, launch Executor, or
write a portfolio decision. The five formative groups remain interactive, and
the Practice entry retains its existing review-only bypass to mastery. The real
learner route, approved lesson copy, Practice action, persistence, and
Teacher/Executor boundaries are unchanged. The focused content-review contract
passed five tests; typecheck, lint, production build, nine startup tests,
`git diff --check`, and focused Electron smoke passed. Electron traversed all 23
slides and confirmed that persisted progress was unchanged. Desktop inspection
at `1180 × 780` confirmed visible review controls and no horizontal overflow on
the workspace and `AGENTS.md` slides. The full unit run remains at 305/307 due
to two separately edited Module 2 copy contracts, and the full Electron journey
still stops before Module 2 at the unrelated missing Module 1 review-bypass
control. This verifies the approved review route only; overall Module 2 owner
acceptance and pilot acceptance remain pending.

**Practice-setup slide retirement — 21 August 2026:** The owner superseded the
temporary 23-slide review-route decision and explicitly approved a sharper
Teacher/Executor boundary. Course Companion now teaches only the five existing
knowledge slides, then routes directly from the combined implementation-plan
page to `module-2-portfolio-practice`. The 23 setup scenes are removed from the
shared course graph, renderer registry and quiz bank; the five formative groups,
folder picker, Current repo `AGENTS.md` self-confirmation slide, examples and
stage-specific checks no longer appear in either the learner or content-review
route. Module 2 renderer metadata is consolidated to one Course Companion lesson
so deleted Practice stages cannot be mistaken for completed lessons. Saved
progress on any retired scene or old Module 2 course-lesson ID is redirected to
the Practice entry and stale scene history is scrubbed. Teacher lesson, script
and start prompt now stop after the knowledge sequence; the integration handoff
remains the authority for future Executor-owned workspace setup, project rules,
five-stage guidance, approval, resume and recovery. This does not claim the
redesigned five-document Practice is runnable: the existing runtime remains on
the old seven-artifact contract until checkpoints I1–I6 are implemented.
Scoped verification passed with 306 unit tests, nine startup tests, typecheck,
lint, production build, focused content-review Electron smoke, migration
coverage for all 23 scene IDs and desktop inspection at `1180 × 780` with no
horizontal overflow. Overall Module 2 implementation remains `in-progress`,
owner acceptance remains pending overall, and pilot acceptance remains pending.

**One-task-page deletion note — 18 August 2026:** At the owner's explicit
request, `module-2-prd-introduction` is retired. Coding-agent PRD review now
routes directly to the five-stage map; the outline, renderer registry,
active-part mapping, smoke journey, and saved-progress migration are
synchronized. Verification passed with 289 unit tests, nine startup tests,
typecheck, lint, production build, and full Electron smoke including desktop
and `390 × 844` responsive checks.

**Reference-gallery revision note — 18 August 2026:** At the owner's explicit
request, the five-stage map now teaches design planning with the supplied
Pafolios and Awwwards screenshots. The former title and roadmap panel are hidden
on this page, the two images appear side by side with source captions on desktop,
and they stack on narrow screens. Verification passed with 289 unit tests, nine
startup tests, typecheck, lint, production build, full Electron smoke, desktop
and `390 × 844` screenshot inspection, and no horizontal overflow. Module 2
contains the approved content, but the redesigned five-document Practice is not
yet runnable; owner acceptance and pilot acceptance remain pending.

**Design-reference links note — 21 August 2026:** At the owner's explicit
request, the five source names in the design-planning explanation—Pafolios,
Awwwards, Dribbble, Mobbin, and Pinterest—are interactive external links. Each
link preserves the approved lesson wording, has visible hover and keyboard-focus
states, opens the HTTPS destination in the learner's default browser, and leaves
the current Course Companion page in place. The two focused link contract tests,
typecheck, lint, production build, nine startup tests, `git diff --check`, and
focused content-review Electron smoke passed. Automated hover/focus assertions
and rendered inspection at `1512 × 982` and `390 × 844` confirmed visible link
states, positive gallery-to-dialogue spacing, and no horizontal overflow. The
full unit run has 306 passing tests and one pre-existing exact-copy mismatch in
the separately edited Module 2 opening. The full Electron journey stops before
Module 2 at the unrelated missing Module 1 review-bypass control. Overall Module
2 owner approval and pilot acceptance remain pending.

**History-review dialogue spacing — 21 August 2026:** At the owner's explicit
request, Module 2 history review now keeps its long Teacher copy in a centered
`980px` reading column while preserving left-aligned prose. The review dialogue
moves `16px` lower, and “Trang trước” plus “Quay lại trang đang học” share the
same bottom action line instead of occupying different vertical positions. No
lesson copy, route, progress state, or button behavior changed. Typecheck, lint,
production build, `git diff --check`, and focused content-review Electron smoke
passed. Rendered bounds at the supported desktop sizes `1180 × 780` and
`1512 × 982` confirmed balanced text insets, visible space above the lowered
dialogue, aligned control bottoms, positive copy-to-control clearance, and no
clipping or horizontal overflow. The full unit run remains non-clean only for
the pre-existing exact-copy mismatch in the separately edited Module 2 opening;
the full Electron journey still stops before Module 2 at the unrelated missing
Module 1 review-bypass control. Overall Module 2 owner approval and pilot
acceptance remain pending.

**Copyable Practice prompt note — 18 August 2026:** At the owner's explicit
request, the Module 2 Practice transition replaces its title and scope panel
with a concise prompt that the learner can copy before opening Codex. The prompt
now starts from a first-time learner's uncertainty, guides a one-question-at-a-time
planning interview, offers plain-language choices when needed, and requests a
summary plus approval at each important decision. It does not expose stage or
module terminology, while keeping code, dependencies, and application creation
outside the planning conversation. The lower Teacher dialogue uses the owner's
supplied wording, and the desktop prompt card is centered on the viewport's
vertical axis.
Verification passed with 289 unit tests, nine startup tests, typecheck, lint,
production build, Electron assertions through the revised page, exact
clipboard-content verification, an exact desktop vertical-alignment assertion,
desktop and `390 × 844` screenshot inspection, and no horizontal overflow. A
subsequent full Electron journey passed with the four-item outline revision.
Owner acceptance and pilot acceptance remain pending.

**Outline-item removal note — 18 August 2026:** At the owner's explicit request,
the “Năm giai đoạn, năm tài liệu” entry is removed from the Module 2 outline
menu. Its lesson scene and forward route remain intact; the design-reference
page now shares the preceding outline section, and the Practice transition is
the fourth and final menu item. Verification passed with 289 unit tests, nine
startup tests, typecheck, lint, production build, full Electron smoke, desktop
and `390 × 844` screenshot inspection, and no horizontal overflow. Owner
acceptance and pilot acceptance remain pending.

**Mastery-question removal note — 18 August 2026:** At the owner's explicit
request, the unclear certificate/privacy scenario is removed from Module 2
Practice. The final mastery review now contains five multiple-choice scenarios
and four learner-owned answers. Its scene inventory, completion requirement,
summary copy, persisted decisions, and tests all use the nine-question contract.
Saved progress paused on the retired question advances to the next remaining
scenario and removes the obsolete answer, while already completed legacy
receipts remain readable. Verification passed with 290 unit tests, nine startup
tests, typecheck, lint, production build, full Electron smoke, and
`git diff --check`. Overall owner acceptance and pilot acceptance remain
pending.

**Mastery-introduction simplification note — 18 August 2026:** At the owner's
explicit request, the Module 2 mastery introduction no longer renders the title
or evidence panel. Its lower Teacher dialogue now contains only the supplied
review invitation, while the existing previous and continue controls remain
available. Verification passed with 290 unit tests, nine startup tests,
typecheck, lint, production build, full Electron smoke through the 9/9 summary,
desktop and `390 × 844` screenshot inspection, and no horizontal overflow.
Overall owner acceptance and pilot acceptance remain pending.

**Lesson-aligned mastery rewrite note — 18 August 2026:** After the owner's
explicit approval, all nine final review questions now use contextual, natural
Vietnamese tied to the Module 2 lesson. The five multiple-choice scenarios cover
when planning is necessary, the purpose of a PRD, PRD review, learner decision
ownership, and responsible use of visual references. The four learner-owned
answers retain current portfolio evidence while adding plain-language context.
Question count, Teacher-led one-at-a-time delivery, Practice separation, and
completion contracts remain unchanged. Verification passed with 291 unit tests, nine
startup tests, typecheck, lint, production build, full Electron smoke through
the 9/9 summary, and `git diff --check`. Overall owner acceptance and pilot
acceptance remain pending.

**Group-level Course Companion assessment note — 18 August 2026:** At the
owner's explicit request, Course Companion now presents every question in the
current quiz group before submission. The learner submits the complete group
once, then sees per-question results, explanations, criteria, and sources. An
incorrect multiple-choice answer can be revised and resubmitted while the other
answers remain available; the interface never advances automatically. Written
answers still require explicit self-review against their published criteria.
Teacher-led quiz delivery in conversation remains one question at a time.
Verification passed with 291 unit tests, nine startup tests, typecheck, lint,
production build, full Electron smoke through a deliberately incorrect answer,
correction, resubmission, and the 9/9 summary, desktop and `390 × 844`
screenshot inspection, no horizontal overflow, and explicit assertions that the
in-flow “Trang trước” control does not overlap any question card. Overall owner
acceptance and pilot acceptance remain pending.

**Assessment title-bar removal note — 18 August 2026:** At the owner's explicit
request, Module 2 quiz groups no longer render a standalone title/status banner
above the assessment. The assessment surface moves into the released space
directly below the HUD, while Module 1's frozen assessment presentation remains
unchanged. The Course Companion UI guidance now requires explicit owner
direction before adding a similar standalone banner in future work. Verification
requires desktop and `390 × 844` inspection, no horizontal overflow, and
assertions for the missing title, compact HUD-to-content gap, and non-overlapping
back control. The owner's direction for this bounded revision is explicit;
review of the implemented result, overall Module 2 acceptance, and pilot
acceptance remain pending.

**Assessment intro removal note — 18 August 2026:** At the owner's explicit
follow-up request, Module 2 quiz groups now begin directly with the first
question card. The Teacher identity, pre-submit introduction, group title,
question-count badge, and repeated submission guidance are not rendered above
the questions. The underlying quiz content and submission behavior remain
unchanged. Verification requires desktop and `390 × 844` inspection, no
horizontal overflow, absent intro/header elements, and a compact first-question
offset from the assessment container. Review of the implemented result, overall
Module 2 acceptance, and pilot acceptance remain pending.

**Five-question mastery note — 18 August 2026:** At the owner's explicit
request, the visual-reference scenario and the learner-owned scope, evidence,
and requirement-validation questions are removed from Module 2. The final
review now contains four multiple-choice scenarios and one learner-owned answer.
The retired question scenes, completion contract, persisted decisions, summary
count, and tests use the five-question contract. Saved progress on a retired
question returns to the first current review question and removes obsolete
answers, while historical nine- and ten-question completion receipts remain
readable. Verification passed with 291 unit tests, nine startup tests,
typecheck, lint, production build, full Electron smoke through the 5/5 summary,
and `git diff --check`. Overall owner acceptance and pilot acceptance remain
pending.

**Unscored PRD reflection copy note — 21 August 2026:** At the owner's explicit
request, the fifth Module 2 question no longer publishes marking criteria. Its
post-answer explanation now uses the exact supplied sentence: “Câu hỏi này
không tính điểm, nó chỉ tạo cơ hội cho bạn tự xem lại PRD của mình”. The
question, submission behavior, and surrounding assessment copy are unchanged.
The two focused assessment-contract checks, typecheck, lint, production build,
focused content-review Electron smoke, and `git diff --check` passed. The full
unit suite remains blocked by the pre-existing `mastery-5` wording assertion;
the full Electron smoke was stopped while still running after the owner narrowed
this task to copy only. Overall Module 2 owner acceptance and pilot acceptance
remain pending.

**Direct-to-summary assessment note — 21 August 2026:** The owner explicitly
approved removing the post-submit feedback step from the Course Companion
Module 2 final group. The learner still answers and submits all five questions
once; submission now saves the fifth unscored PRD reflection as self-reviewed
and opens `module-2-portfolio-mastery-summary` in the same progress update. The
separate “Xem kết quả 5 câu” action and fifth-question self-confirmation action
are no longer encountered in this flow. If any of the first four scored choices
is incorrect, the summary keeps “Làm lại 5 câu”; real Module 2 completion remains
disabled until all five saved results are current and correct. Teacher-led
one-question-at-a-time delivery and assessment behavior in other modules remain
unchanged. The focused contract test, typecheck, lint, production build and
focused Electron content-review journey passed. Electron verified direct
summary navigation after an intentionally incorrect first choice, full-group
retry, correct resubmission and continuation to Module 3. The complete unit run
remains at 309/310 because of the separately edited `mastery-5` wording
assertion. The complete Electron journey still stops before Module 2 at the
unrelated missing Module 1 review-bypass control. This bounded behavior has
owner approval; overall Module 2 owner acceptance and pilot acceptance remain
pending.

**Current checkpoint reconciliation — 22 August 2026:** The `mastery-5`
contract assertion follows the approved current wording without changing
learner copy. After selectively merging current content into
`Triet-V2-planning`, the integrated tree passes 388/388 unit tests, all nine
startup tests, typecheck, lint, the production build, and full Electron smoke.
`git diff --check` and the source audit also pass, with no review-only launcher,
Practice bypass, or session-only review routing restored. Module 2 and Module 3
verification therefore pass for this integrated content scope; overall owner
approval and pilot acceptance remain pending.

**Portfolio `AGENTS.md` setup note — 18 August 2026:** At the owner's explicit
request, workspace selection now leads to a dedicated setup page before the
four explanation pages. It presents the complete approved English portfolio
working-agreement template, tells the learner to keep the learning application
open while Codex creates the file, and advances only after the learner confirms
completion. Course Companion does not inspect or grade the file. The desktop
layout separates the guidance and scrollable prompt into two non-overlapping
columns; the narrow layout stacks them without horizontal overflow. Verification
passed with 292 unit tests, nine startup tests, typecheck, lint, production
build, full Electron smoke with clipboard verification, responsive DOM checks
without screenshots, and `git diff --check`. Overall Module 2 owner acceptance
and pilot acceptance remain pending.

**HTML visual-prototype guidance note — 18 August 2026:** At the owner's
explicit request, the Module 2 design-reference page now explains that a learner
can ask a coding agent for an HTML visual prototype before the real product is
built. The learner lesson and Teacher script define it immediately as a browser-
viewable interface sample, use it for learner review and design approval, and
keep actual product construction in Module 3. Verification passed with 294 unit
tests, nine startup tests, typecheck, lint, production build, full Electron
smoke, rendered-copy coverage, desktop and `390 × 844` screenshot inspection,
responsive no-overflow assertions, and `git diff --check`. Overall Module 2
owner acceptance and pilot acceptance remain pending.

**Implementation-plan walkthrough note — 19 August 2026:** At the owner's
explicit request, Module 2 now includes a fictional implementation plan for
Mai's UX Designer portfolio. One page shows the whole format; four following
pages highlight requirements and boundaries, ordered stages, expected files and
visible checks, then risks, assumptions, and the approval stop. The learner
lesson and Teacher script define the term when it first appears, and the full
example is stored under `pilot-workspace/course/examples/`. The app labels the
sample as fictional and not an answer, never requires code reading, and keeps
the real Practice and completion contract unchanged. Verification passed with
295 unit tests, nine startup tests, typecheck, lint, production build, full
Electron smoke, and desktop plus `390 × 844` rendered inspection without
horizontal overflow. Overall Module 2 owner acceptance and pilot acceptance
remain pending.

### M2.6 — Complete the Module 2 gate and handoff

**Change**

1. Require all five current documents, current final-package approval and
   passed review, and the existing mastery evidence. Historical stage receipts
   do not satisfy the version 2 gate.
2. Generate a plain-language completion summary: what the learner decided,
   which evidence is missing or bounded, the approved implementation sequence,
   and what is deliberately out of scope. Do not claim a first implementation
   task was created in Module 2.
3. Unlock Module 3 only after the completion receipt is saved atomically.
4. Pass Module 3 the workspace path, five artifact references/digests, verified
   submission and exact existing task binding, not the old chat transcript as
   hidden context. Missing or mismatched task access must fail closed.
5. Make Module 3's first action read the five current documents, propose one
   bounded implementation task with technology/dependency/file consequences,
   and wait for learner approval before writing application code.

**Verify**

- Gate rejects stale artifact digests, incomplete validation coverage inside
  the implementation plan, hidden implementation/task creation, or missing
  learner approval.
- Relaunch after completion opens Module 3 readiness without losing Module 2
  evidence.
- The completion handoff contains exactly the five current planning references
  and no reference to a retired validation-map or first-task document.
- Reset and targeted Module 2 recovery remain functional.

**Checkpoint output:** Verified Module 2 completion and explicit Module 3 input
contract.

### Module 2 acceptance gate

Module 2 is accepted only when:

- its Pilot lesson, script, prompt, quiz, templates, and Practice definition are
  synchronized;
- Course Companion completes the full new Module 2 journey using a disposable
  learner portfolio folder;
- exactly five explanation pages lead to one persistent Practice task;
- all five planning documents are reviewed semantically on their current
  digests after explicit final PRD/plan approval; the package stops at the
  implementation plan and has no five-stage approval prerequisite;
- the same Executor thread remains bound through planning, every resubmission,
  and the Module 3 handoff;
- Module 3 stays locked before the combined evidence/mastery gate;
- Module 3 proposes and waits for approval of the first concrete task instead
  of receiving one created in Module 2;
- the full Course Companion verification suite passes;
- a manual beginner-language review finds no hidden coding prerequisite;
- a disposable-workspace rehearsal proves no application source, dependency,
  command execution, or deployment work occurs in Module 2;
- the Module 2 implementation is committed locally in scoped checkpoints.

Do not author or implement Module 3 course content before this gate is accepted.

---

## Module 3 — Implement and debug in verified slices

**Current Practice authority — 13 September 2026:** The approved
[Module 3 Practice v2 design](module-3-practice-v2-design.md) and the v2 progress
table above supersede the fixed-slice and separate revision/enhancement
requirements below. M3.2–M3.8 retain their v1 detail as historical context.
Current acceptance requires plan-derived parts with learner acceptance, one
learner-directed improvement and one evidence-based debugging investigation
(which may occur during those parts), three supporting records, current website
acceptance and package review, and all five mastery answers. Same-task recovery,
honest desktop/mobile evidence, full technical verification, scoped checkpoints
and live owner/learner acceptance remain required.

### Module outcome

The learner continues the Codex task used in Module 2 and turns the approved PRD
and implementation plan into a working portfolio one part at a time. The
learner checks visible behavior after each part, gives the coding agent useful
debugging evidence when something fails, and understands how Git, GitHub,
commit, push, and branch protect the work without having to perform the
technical commands personally.

### Decision gate before Module 3 authoring

The approved curriculum defers exact desktop and mobile viewport values. Before
writing visual assertions, present one small decision packet. Recommended pilot
default: one common desktop viewport and one narrow mobile viewport, used
consistently in instruction, screenshots, and smoke tests. The values may be
recalibrated after pilot evidence, but the same release must not use conflicting
values.

### M3.1 — Lock the module manifest, lessons, and artifacts

**Authoring history merge and publication gate — 6 October 2026**

- Owner approved committing the 32 tracked authoring changes, merging into
  `triet-v3-planning`, preserving the target Practice/Teacher runtime and pushing
  the target branch to `origin` after verification.
- Source checkpoint: `8115931`, containing the approved Module 3–4 content,
  tests, video and synchronized authoring ledger. Its content gate passed
  typecheck, lint, 322 unit tests, nine startup tests, build, diff checks and
  19 instructional pages / 38 cases at 1440 × 900 and 1180 × 748. Video metadata
  and full decoding passed. Its separate historical full Electron review
  failed at an obsolete Module 2 title locator; no full source acceptance is
  claimed. Logs: `/private/tmp/branch-publish-source-*.log`.
- Implementation: `implemented` for integration. The approved content was
  already present in target baseline `e9ad2f9`. The merge records source history
  while retaining the target content, scene inventory, Module 1 Practice entry,
  Module 4 Practice action, Practice Guide, Teacher behavior and passing test
  fixtures. Temporary review controls and authoring-only review tests are
  excluded. Target application files are unchanged from that baseline. The
  smoke invocation uses its existing desktop mode instead of enabling legacy
  phone checks, matching the desktop-only learning scope.
- Verification: `passed` for the current merged target. Fresh typecheck, lint,
  400 unit tests across 71 files, nine startup tests, production build, full
  disposable-data Electron journey and diff checks passed. The Electron journey
  covers setup Practice, assessment, desktop navigation, resume/reset, Teacher,
  settings, saved progress, security and companion lifecycle. A source audit
  confirms no temporary review bypass and exact preservation of the target
  application files and Module 3–4 page inventories. The smoke invocation's
  desktop-mode adjustment also passed its focused lint check.
  Logs: `/private/tmp/branch-publish-target-*.log`. Untracked `CLAUDE.md` and
  `tmp/` are preserved outside the commit.
- Publication: merge commit `d9ac1cb` was pushed successfully to
  `origin/triet-v3-planning` on 6 October 2026. The push advanced the remote from
  `4513318` to `d9ac1cb`; local and remote-tracking refs matched afterward. This
  checkout remains on `triet-v3-planning`. Next permitted action: owner review
  of the merged content. Overall owner acceptance, pilot acceptance and live
  provider rehearsal remain pending. Automatic Module 4 Practice/graduation
  remains deferred.


**Approved Module 3–4 integration — 6 October 2026**

- Owner approved the remaining technical repairs and integration into
  `triet-v3-planning`, with separate approval for content or security changes.
  The after-video Module 4 wording was presented verbatim and explicitly
  approved before synchronizing the Pilot lesson. No security behavior changed.
- Implementation: `implemented` for the approved content batch, integrated from
  the authoring branch onto target baseline `4513318` in a separate worktree.
  Module 3 opens with Local preview, preserves its real Practice action, and ends
  with the approved publish reminder. Module 4 preserves its four instructional
  pages, uses the approved video, has no quiz, and proceeds to portfolio Practice.
  The target's existing Module 4 Practice action is preserved; its integration
  and automatic graduation remain deferred, as before.
- Verification: `passed` for the integrated automated gate: typecheck,
  `npm run lint`, 400 unit tests across 71 files, nine startup tests, production
  build and full `npm run test:electron`. The Electron journey uses disposable
  data and mock Codex; this is not live learner or provider acceptance. Logs:
  `/private/tmp/m34-target-tests.log`, `/private/tmp/m34-target-lint.log`,
  `/private/tmp/m34-target-electron.log` (includes successful typecheck/build).
- Resolved the obsolete Module 3 highlight assertion and a JSX-only presentation
  assertion rather than adding UI-copy tests. Updated Teacher test fixtures for
  the retained Module 4 scene and verified that its empty quiz creates no active
  assessment. The target Electron script is preserved unchanged and passes.
  On the authoring branch, the Module 1 repair passed that stage; its separate
  content-review smoke still has old Module 2 text expectations. That temporary
  script is excluded from this integration.
- Source audit: no content-review launcher, session routing or Practice bypass
  identifiers in integrated runtime code. Target Practice/Teacher implementations
  are preserved. The only completion/persistence changes route new Module 2
  completions to the Local preview page and continue accepting old receipts.
  Removed pages match the approved removals; no Module 1 or Module 2 page is lost.
- Next permitted action: owner review of integrated content, followed by the
  separately scoped Practice work or an explicitly authorized live rehearsal.
  No push or deployment is included. Module 4 implementation remains
  `in-progress` overall; owner module acceptance and pilot acceptance are pending.


**Remove the visual keyword assertion — 6 October 2026**

- Owner direction: resolve the stale keyword-highlight test and leave simple
  copy, color and layout checks to direct owner inspection.
- Implementation: `implemented`. Removed only the Module 3 test that locks
  the exact highlighted-word lists and yellow CSS declarations. Learner copy
  and functional/evidence tests are unchanged.
- Verification: `pending`. No test or build run for this narrow edit, following
  the small-edit working agreement. This removes the obsolete assertion but
  does not claim a new full-suite pass.
- Next permitted action: address the remaining Pilot/renderer paragraph mismatch
  and Module 1 smoke failure before the previously requested merge. No commit
  or merge was performed for this edit.


**Owner-authored Module 3 closing reminder — 6 October 2026**

- Owner direction: replace the pre-assessment dialogue with the exact supplied
  reminder to ask the agent to publish the repository to GitHub, then review.
- Implementation: `implemented` for this narrow revision. Updated the renderer
  and corresponding Pilot lesson verbatim, including the owner's lowercase
  `github`; replaced the detailed repo/branch/commit/visibility cross-check.
  The button now reads "Bắt đầu ôn tập" and retains the existing quiz route.
  Teacher/start-prompt guidance and existing copy/button expectations now use
  the same reminder. The five Module 3 questions remain unchanged.
- Verification: `pending` for this revision. No tests or build were rerun under
  the small-edit working agreement. Prior review results predate this change.
- The Module 3 closing-copy finding is addressed in source. The proposed
  Module 4 assessment reduction and other review fixes are not yet approved or
  implemented. Merge acceptance remains failed from the recorded audit;
  no checkpoint commit or merge was performed. Next permitted action: owner
  decision on the remaining Module 4 proposal, then verification before merge.


**Module 3–4 pre-merge review — 5 October 2026**

- Owner request: inspect Modules 3–4 and merge into `triet-v3-planning` only if
  no issues remain. Reviewed current working-tree content plus branch changes
  since merge-base `09fd348`; target resolves to `4513318` and current branch
  HEAD is `3c8b639`. Latest lesson edits remain uncommitted.
- Verification: `failed` for merge acceptance. Typecheck, lint, production build
  and `git diff --check` passed. Vitest: 321 passed, 2 failed out of 323; failures
  concern the obsolete Standard Protection expectation and Module 4 after-video
  renderer/Pilot wording drift. All 9 startup tests passed separately.
- The full Electron smoke launched outside the filesystem sandbox but failed
  at `tests/electron-smoke.mjs:580`, waiting for the old Module 1 completion
  label, before reaching Modules 3–4. This is not full-app verification.
- Focused desktop review passed using a disposable runner adapted to the current
  page inventory at `/private/tmp/course-m34-current-smoke.mjs`: 19 instructional
  pages, 38 cases at 1440×900 and 1180×748, both module outlines, video loading,
  eight Module 4 assessment submissions with simulated UI answers, and unchanged
  temporary saved progress. Screenshots and measurements are under
  `/private/tmp/course-m34-review`. Local-preview and short post-publication
  screenshots were visually inspected. These are UI checks, not learner or
  live-provider evidence. Long pages are allowed to scroll as designed.
- Content issue: the Module 3 mastery introduction and Teacher stop still demand
  repo/branch/commit/Private-Public evidence and refer to deleted GitHub steps,
  while the retained recap presents pushing as optional for collaboration.
  The five-page removal itself matches the approved scope.
- Next permitted action: owner decision on a short GitHub handoff or placement
  of that prerequisite in Module 4, plus the Module 4 reconciliation recorded
  below. No learner copy was changed during review. No commit, branch switch,
  merge or push was performed; conditional merge authorization is not satisfied.


**Remove the five pictured GitHub publishing pages — 5 October 2026**

- Owner direction: remove exactly the five screenshot pages, from
  `module-3-github-publish` through `module-3-github-verify`.
- Implementation: `implemented` for this removal. Merge now continues directly
  to `module-3-pre-practice-summary`. Removed the five renderer/shared scenes,
  registry entries, their outline destination, matching Pilot lesson section,
  and Teacher/start-prompt instructions to teach those pages. Updated existing
  route expectations and the Electron journey sequence.
- Preserved Local, Debug, Git concepts, recap, Practice and final assessment,
  including the separate manual GitHub evidence stop before mastery. No other
  page was removed and no completion requirements were changed.
- Verification: `pending`. No tests, typecheck, build, diff check or desktop
  verification were run for this explicitly scoped edit under the working
  agreement. No checkpoint commit was created.
- Remaining gap: the retained mastery introduction still refers to GitHub
  steps learned earlier; only the general Git/GitHub lessons now precede it.
  Next permitted action: owner review of the shortened Merge-to-recap flow.
  Earlier verification does not cover this removal; pilot acceptance is pending.


**Local preview opening page — 5 October 2026**

- Owner direction: add the approved three-paragraph local-preview explanation
  at the beginning of Module 3, immediately before Debug. Omit the rejected
  sentence defining terminal; preserve all existing lesson pages and dialogue.
- Implementation: `implemented` for this addition. Added
  `module-3-local-preview` to the renderer, shared scene inventory, lesson pages,
  outline, Pilot lesson, Teacher script and start prompt. Content review and new
  Module 2 completions enter the new page, which continues to the original
  Debug opening. Existing completion receipts targeting Debug remain accepted;
  no saved-progress migration was added. Updated affected test expectations.
- Verification: `pending`. No tests, typecheck, build, diff check or desktop
  verification were run under the small-edit working agreement. In particular,
  the new entry route and compatibility with existing completion receipts have
  not been verified. No checkpoint commit was created.
- Owner approval covers this text and its position only. Rendered acceptance,
  completion-route verification and pilot acceptance remain pending. Next
  permitted action: owner review of the new opening page, followed by requested
  verification of navigation and receipt compatibility. Prior passing evidence
  does not verify this addition.


**GitHub publishing addition — 14 September 2026**

- Implementation: `implemented` for content. Five new pages teach preflight,
  a learner-owned Private/Public repository, empty-repo creation, approved
  push, and browser comparison of repository/branch/commit/visibility.
- Existing Git/debug dialogue and the owner-supplied recap remain verbatim.
  The mastery introduction adds a manual repo-evidence stop after Practice.
  Teacher must send a learner with missing/mismatched evidence back to Codex
  before the five questions or Module 4. Its UI confirmation is explicitly
  a learner check, not an automated GitHub verification result.
- The existing Practice receipt and progress schema are unchanged. Automated
  provider reconciliation is not implemented or claimed by this batch.
- Verification: `passed` for the affected content in the final combined batch:
  40 focused tests, 323 unit tests, nine startup tests, typecheck, lint, build
  and the publication-specific Electron journey. The full Electron run is
  `failed` at the pre-existing Module 1 title expectation described under M4.1.
  Owner approval covers implementation direction; live learner acceptance
  remains `pending`. Next action: present the completed content for owner review.

**Change**

1. Add Module 3 and its four learner-facing sections to
   `course-structure.json`: debugging, Git and GitHub, Practice, and final
   mastery. Keep the implementation-loop checkpoint as an internal technical
   boundary rather than a learner-facing section.
2. Add the lesson, Teacher script, start prompt, quiz, and solution-free
   templates for the eight Module 3 evidence artifacts.
3. Teach the standard implementation loop and debugging loop in plain language.
4. Teach the five-part change summary:
   - what changed;
   - what the learner should notice;
   - what intentionally did not change;
   - checks and results;
   - risks, limitations, or remaining decisions.
5. Keep code reading, diff reading, staging, and pull-request review optional.

**Verify**

- Every milestone has an observable action, artifact, gate, and recovery path.
- No content assumes the app already exists.
- No fixed duration appears.
- Required core and optional enhancement remain visibly separate.

**Checkpoint output:** Complete Module 3 content and evidence contract.

### Terminal-log prompt example — 8 September 2026

Added the requested example prompt to the `module-3-terminal-logs` dialogue
and synchronized the Pilot lesson and Module 3 content-design draft. Existing
copy, illustration, and navigation are preserved. This M3.1 copy addition is
`implemented`; verification is `pending`. No automated checks or rendered UI
inspection ran, following the owner's instruction to leave verification of
small scoped edits to them. The next action for this addition is owner review
on the lesson screen. Overall Module 3 approval and pilot acceptance are unchanged.

### Approved debugging-log copy replacement — 10 September 2026

Replaced the M3.1 `module-3-terminal-logs` dialogue and example prompt with
the owner's exact supplied wording, synchronized the Pilot lesson and Module 3
content-design draft, and updated the existing wording contract assertion.
This copy replacement is `implemented`; verification is `pending`. No automated
checks or rendered UI inspection ran, following the owner's instruction for
small scoped edits. The remaining step is owner review of the lesson screen.
Overall Module 3 approval and pilot acceptance are unchanged.

### Approved learner-facing redesign — 19 August 2026

The owner approved a content-first redesign that removes implementation-plan
instruction from Module 3 because that instruction belongs in Module 2. The
learner-facing route now teaches the implementation loop, three debugging
situations, Git and GitHub concepts, one continuous Practice, and five final
questions. Questions do not interrupt the explanation pages. The original five
Practice stages and four build slices below remain internal evidence and
recovery boundaries; they are not exposed as separate learner navigation or a
checklist the learner must manage.

### Practice-transition slide retirement — 21 August 2026

The owner explicitly approved removing the redundant
`module-3-practice-intro` setup slide so Course Companion keeps the knowledge
sequence while Practice/Executor owns working instructions. All 11 knowledge
scenes remain unchanged apart from the final branch CTA, which now opens
`module-3-portfolio-practice` directly. The real Practice page, five-section
outline, five-question mastery assessment, completion gate, Pilot lesson,
Teacher script, start prompt and six illustrations remain. Saved progress on
the retired slide, `module-3-enhancement-intro` or
`module-3-check-enhancement-boundary` now resumes at the real Practice page and
removes stale retired IDs from history.

Focused verification passed with 47 registry, progress, Module 3 content and
content-review tests, nine startup tests, typecheck, lint, production build,
`git diff --check` and the focused Electron content-review journey. Desktop
inspection at `1440 × 900` confirmed the Practice page appears immediately
after branch without horizontal overflow. The complete unit run has 308/309
passing tests and stops
at an unrelated Module 2 copy assertion. The complete Electron journey still
stops before Module 2 at the unrelated missing Module 1 review-bypass control.
Neither blocker is attributed to this Module 3 route change, and overall owner
approval and pilot acceptance remain `pending`.

The 22 August checkpoint reconciliation resolves that Module 2 assertion. In
the selectively merged tree, the current complete unit run passes 388/388 and
full Electron smoke reaches and passes the Module 3 journey without restoring
the temporary Module 1 review-bypass control.

### Prompt-example presentation refinement — 20 August 2026

The owner approved replacing the Teacher dialogue that repeated the prompt
already visible inside the error-report illustration with one short explanation
of how to apply the example. The illustration alone receives a scene-specific
desktop width increase from `440px` to `500px`; narrow layouts continue using
the full available width without horizontal overflow. Focused content tests,
lint, all 302 unit tests, nine startup tests, a direct Electron/Vite production
build, and focused Electron inspection at `1440 × 900` and `390 × 844` passed.
The owner then removed the standalone log-definition sentence from the next
debugging page while preserving its surrounding guidance.
Full-suite blockers remain recorded in the progress ledger and do not count as
owner acceptance or pilot acceptance.

### Opening-page consolidation — 20 August 2026

The owner approved merging the first two implementation-loop explanation pages
into one page titled “Thực hiện Implementation Plan, từng bước một.” The merged
page preserves both approved dialogue blocks in their existing order and routes
directly to the debugging section. Saved progress on the retired second page is
redirected to the merged opening so a returning learner does not resume at an
invalid scene. Focused registry, progress-migration, content-contract, desktop,
and `390 × 844` Electron checks passed. The full Electron smoke remains failed
at the unrelated pre-Module-3 review-only mismatch recorded in the progress
ledger; this consolidation does not claim the overall Module 3 gate has passed.

### Opening-page retirement — 25 August 2026

The owner explicitly approved deleting the remaining Module 3 implementation-
loop opening page, `module-3-readiness`. Module 3 now opens directly on
`module-3-debugging-intro`; Module 2 completion receipts and content-review
routing use that destination. The implementation-loop checkpoint remains an
internal technical boundary under the debugging lesson. Saved progress on the
deleted page and older opening-page IDs is redirected to the debugging page so
returning learners do not reach an invalid scene. The Pilot lesson source,
Course Companion registry, content contracts and smoke expectations no longer
expose the deleted page or its copy. Overall owner approval and pilot acceptance
for Module 3 remain `pending` until the existing acceptance gate is completed.

### Module 3 dialogue-width balancing — 25 August 2026

The owner approved checking the opening-page alignment issue across Module 3.
All explanatory pages with one primary action now use a Module-3-scoped
`1200px` maximum dialogue width instead of the shared `1050px` limit. This lets
longer Vietnamese lines extend beyond the left edge of the yellow action button
and balances the dialogue panel without changing Module 1, Module 2, Module 4,
Practice or assessment layouts. Focused content-contract tests, typecheck, lint,
build and `git diff --check` passed. Electron inspection at `1440 × 900`
confirmed the wider opening, visible-error and prompt-example pages without
horizontal overflow or overlap. The focused content-review smoke then stopped
at an existing uncommitted repeated-error title expectation before the remaining
Module 3 screenshots; this does not establish overall Module 3 acceptance.

### Module 3 keyword highlighting — 25 August 2026

**Implementation:** implemented. The owner approved highlighting important
Module 3 terminology throughout the explanatory Teacher dialogue while leaving
Practice and assessment pages unchanged. Scene-owned keyword metadata now
covers the debugging terms `implementation plan`, `bug`, `debugging`, `prompt`,
`screenshot`, `terminal`, `log` and `nguyên nhân gốc`, followed by the Git terms
`Git`, `hệ thống quản lý phiên bản`, `phân tán`, `repository`, `GitHub`, `commit`,
`push`, `branch` and `phiên bản ổn định`. A shared renderer matches longer
overlapping terms first, preserves the approved source text and wraps matches
in semantic `mark` elements. After reviewing the initial yellow-background
treatment, the owner explicitly replaced it with bold yellow text on a
transparent background.

**Verification:** blocked overall. Focused term-segmentation and content-contract
tests, typecheck, lint, all 314 unit/startup tests, production build and
`git diff --check` passed. The focused Electron content-review journey passed
and desktop inspection at `1440 × 900` confirmed the Debug, repeated-error,
Git/GitHub and Commit pages remain readable without clipped text, overlap or
horizontal overflow. The required full Electron smoke still stops at the
pre-existing Module 1 review-bypass control before reaching Module 3. Owner
approval applies to this highlight treatment only; overall Module 3 approval
and pilot acceptance remain `pending`.

### Pre-Practice recap page — 25 August 2026

**Implementation:** `implemented`. The owner approved one new recap page after
`module-3-git-branch` and before `module-3-portfolio-practice`. Its heading and
four bullets preserve the supplied wording exactly, including the requested
debug, commit, branch and GitHub reminders. The page does not add an
implementation-plan reminder. The Pilot lesson, Teacher script, start prompt,
content-design draft, typed shared registry, renderer registry, focused content
contracts and Electron journey are synchronized. The retired
`module-3-practice-intro` scene remains retired.

**Verification:** `blocked` overall. The two focused registry/content-contract
files pass 22/22 tests; typecheck, lint, all 314 unit tests, nine startup tests,
production build and `git diff --check` pass. The focused Electron
content-review journey passes. Its `1440 × 900` screenshot and automated bounds
checks confirm the new page has positive title-to-dialogue and text-to-action
gaps, remains inside the viewport and has no horizontal overflow. The required
full Electron smoke launches but still stops at the pre-existing Module 1
review-bypass control before reaching Module 3. Owner approval applies to this
recap page only; overall Module 3 approval and pilot acceptance remain
`pending`. The next permitted action remains reconciling that unrelated Module
1 review-only mismatch, rerunning the full Electron smoke, then presenting the
overall Module 3 evidence for owner review.

### Pre-Practice recap visual hierarchy — 25 August 2026

**Implementation:** `implemented`. The owner approved replacing the recap's
generic sentence-style title with a scene-specific visual hierarchy: a large
yellow `4`, the heading `ĐIỀU CẦN NHỚ`, and the supporting line
`trước khi bắt đầu Practice`. The Pilot lesson and content-design draft use the
synchronized sentence `4 điều cần nhớ trước khi bắt đầu Practice:`. The four
approved reminders, previous/next navigation, recap route and every adjacent
Module 3 page remain unchanged. The specialized renderer treatment is gated to
`module-3-pre-practice-summary`, so shared titles on other scenes retain their
existing presentation.

**Verification:** `blocked` overall. Focused verification passed: the two
registry/content-contract files pass 22/22 tests, typecheck and the production
Electron build pass, and the focused content-review Electron journey passes.
Its `1440 × 900` bounds checks confirm no horizontal overflow, at least `16px`
between the recap title and dialogue, at least `10px` between the reminder text
and actions, and a count size at least twice the heading size; rendered
inspection confirms the heading dominates the supporting line without clipping
or overlap. `git diff --check` passes. Lint, the complete unit suite and the full
Electron smoke were intentionally not run because this is a scene-local copy
and presentation adjustment with no runtime, persistence, Practice, completion,
security, dependency, route or cross-module behavior change. Owner approval
applies to this recap treatment only; overall Module 3 owner approval and pilot
acceptance remain `pending`, and the next permitted action is unchanged.

### Summary-panel presentation simplification — 20 August 2026

The owner approved removing the generic right-side lesson summary panels while
retaining scene titles, real illustrations, specialized lesson boards, Practice,
assessments, and navigation. The common renderer no longer creates
`.pixel-consequence` or `.pixel-scene-summary`; the approved lesson copy remains
in the source contracts unchanged. Typecheck, lint, all 303 unit tests, nine
startup tests, a production build, `git diff --check`, and focused Electron
inspection of both the summary-free repeated-error page and the
illustration-preserving visible-error page passed at `1440 × 900` and
`390 × 844` without horizontal overflow or overlap. Overall verification remains
`failed` because the full Electron smoke still stops at the unrelated missing
Module 1 review-bypass control before reaching Module 3. This decision has owner
approval only for the presentation change; overall owner approval and pilot
acceptance remain `pending`. The next permitted action is to reconcile that
review-only mismatch without weakening the real Practice gate, then rerun the
full Electron smoke.

### Git and GitHub visual replacement — 20 August 2026

The owner supplied a Git and GitHub illustration for the Git/GitHub explanation
page and approved removing that page's standalone right-side title box. Only
`module-3-git-github` sets `showTitle: false`; its approved dialogue and
navigation remain unchanged. The supplied `1200 × 600` image uses `contain`,
occupies the former title region at desktop size, and returns to full-width
normal flow in the narrow layout. Typecheck, lint, all 304 unit tests, nine
startup tests, a production build, `git diff --check`, and the focused Electron
content-review journey passed. Rendered inspection at `1440 × 900` and
`390 × 844` confirmed the title is absent, the image is decoded at its native
dimensions, and neither viewport has horizontal overflow. Overall verification
remains `failed` because the complete Electron smoke still stops later at the
unrelated missing Module 1 review-bypass control. Overall owner approval and
pilot acceptance remain `pending`; the next permitted action is unchanged.

### Commit-history layout repair — 20 August 2026

The owner approved a scene-specific repair for `module-3-git-commit` after the
long dialogue overlapped its commit-history illustration in a short desktop
window. The scene now places its title, illustration, and dialogue in successive
grid rows with a positive gap; short desktop windows scroll the page instead of
allowing the independently anchored panels to intersect. The existing narrow
one-column flow remains unchanged, and all learner-facing copy, illustration,
navigation, and behavior are preserved. Typecheck, lint, all 304 unit tests,
nine startup tests, a production build, and `git diff --check` passed. The
focused Electron content-review journey measured at least a `16px` illustration-
to-dialogue gap at `1440 × 900` and `1180 × 664`, at least `10px` at
`390 × 844`, and no horizontal overflow at any viewport. Rendered screenshots
at all three sizes were inspected; an additional `22px` text-size check kept
the illustration visible and preserved at least `10px` between the dialogue
text and its navigation controls. The complete Electron smoke still stops at
the unrelated missing Module 1 review-bypass control before reaching Module 3,
so overall verification remains `failed`, owner approval remains `pending`
overall, pilot acceptance remains `pending`, and the next permitted action is
unchanged.

### Commit-history authoring-note removal — 20 August 2026

The owner identified one paragraph on `module-3-git-commit` as an internal
authoring note rather than learner-facing Teacher dialogue and explicitly
approved its removal. The exact paragraph was removed from the content-design
draft, the Pilot lesson authority, and the Course Companion scene without
changing the surrounding copy, illustration, navigation, or behavior. A
repository search found no remaining copy. Typecheck, lint, all 305 unit tests,
nine startup tests, a production build, `git diff --check`, and the focused
Electron content-review journey passed. The rendered scene was inspected at
`1440 × 900` and `390 × 844`; the paragraph is absent and the layout retains
positive gaps without horizontal overflow. The complete Electron smoke still
stops at the unrelated missing Module 1 review-bypass control before reaching
Module 3, so overall verification remains `failed`, owner approval remains
`pending` overall, pilot acceptance remains `pending`, and the next permitted
action is unchanged.

### Repeated-error Codex prompt illustration — 20 August 2026

The owner approved a course-created Codex mockup and requested its placement on
`module-3-repeated-error`. The `1200 × 650` illustration shows a learner asking
the coding agent to stop editing, list possible causes, and check each cause
against evidence. Its source record identifies the scene as a simulation rather
than data from a live Codex task. The approved dialogue, route, and navigation
remain unchanged. The illustration uses the existing `contain` treatment, a
`500px` desktop width, and the full available width in the narrow layout.
Typecheck, lint, all 305 unit tests, nine startup tests, a production build, and
the focused Electron content-review journey passed. Rendered inspection at
`1440 × 900` and `390 × 844` confirmed that the image decodes, no horizontal
overflow occurs, and the title, illustration, and dialogue retain positive
gaps without overlap. The complete Electron smoke still stops at the unrelated
missing Module 1 review-bypass control before reaching Module 3, so overall
verification remains `failed`. This decision has owner approval only for the
new illustration; overall owner approval and pilot acceptance remain `pending`,
and the next permitted action is unchanged.

### Git introduction paragraph removal — 8 September 2026

At the owner's request, removed the two pictured paragraphs defining repository
and distributed history from `module-3-git-intro` and the Pilot lesson authority.
The dialogue box now uses content-driven height without a minimum-height floor
on this scene. The remaining copy and page navigation are preserved.
Implementation: `implemented`; verification: `pending`. No automated or rendered
checks were run for this small edit under the owner's working agreement.
Next action for this edit: owner visual review. Overall module acceptance and
progression gates remain unchanged.

### Commit page copy replacement — 8 September 2026

Replaced the `module-3-git-commit` dialogue with the owner's four supplied
paragraphs and synchronized its image caption, Pilot lesson, and content design
draft. Implementation: `implemented`; verification: `pending`. No automated or
rendered checks were run for this small copy edit under the owner's working
agreement. Next action for this edit: owner visual review. Overall module
approval, acceptance, and progression gates remain unchanged.

### Git push dialogue replacement — 8 September 2026

Replaced the pictured dialogue on `module-3-git-push` with the owner's exact
supplied paragraph, synchronized in the Pilot lesson and content-design draft.
Implementation: `implemented`; verification: `pending`. Checks were not run
for this small copy edit under the owner's working agreement. Next action for
this edit: owner review. Overall module gates remain unchanged.

### Commit explanation with portfolio example — 10 September 2026

Replaced the pictured `module-3-git-commit` dialogue with the owner's supplied
introduction, portfolio animation example, graph explanation, and sample agent
prompt. Corrected "gốc" to "góc" and narrowed the recovery claim to finding a
saved version after accidental code changes. Synchronized the Pilot lesson and
content-design draft. The sample prompt is lesson content, not an instruction
to commit the working tree. Implementation: `implemented`; verification:
`pending`. No automated or rendered checks were run for this small copy edit
under the owner's working agreement. Next action for this edit: owner visual
review. Overall module approval, acceptance, and progression gates remain
unchanged.

### GitHub commit image on the push page — 10 September 2026

Added the owner's supplied GitHub commit-list screenshot to
`module-3-git-push`, with the exact caption
"commit của dự án khi được push lên github" below the image. Reused the
existing stacked image/dialogue layout and synchronized the Pilot lesson,
content-design draft, and TODO. Implementation: `implemented`; verification:
`pending`. No automated or rendered checks were run for this small edit under
the owner's working agreement. Next action: owner visual review. Overall
module approval, acceptance, and progression gates remain unchanged.

### Branch dialogue with 3D example — 10 September 2026

Replaced the `module-3-git-branch` dialogue with the owner's supplied passage,
including the approved left/right rotation conflict example, branch and merge
prompts, and the owner's closing wording. Synchronized the Pilot lesson and
content-design draft. Embedded prompts remain lesson content, not instructions
to create or merge a repository branch. Implementation: `implemented`;
verification: `pending`. No automated or rendered checks were run for this
small copy edit under the owner's working agreement. Next action: owner visual
review, including readability of the longer dialogue. Overall module approval,
acceptance, and progression gates remain unchanged.

### Split branch and merge into two pages — 10 September 2026

Split the approved branch passage immediately after the branch-creation prompt.
The existing `module-3-git-branch` page now leads to the new
`module-3-git-merge` page, then to `module-3-pre-practice-summary`. All dialogue
wording is preserved. Updated shared routing, renderer page inventory, Pilot
lesson, content-design draft, and existing navigation test expectations.
Implementation: `implemented`; verification: `pending`. No checks were run
under the owner's small-edit working agreement. Next action: owner desktop
review of both pages and forward/back navigation. No checkpoint commit was
created without verification. Overall module acceptance remains unchanged.

### Branches screenshot on the merge page — 10 September 2026

Added the owner's supplied GitHub branches screenshot to `module-3-git-merge`,
the page identified in the first attachment, with the exact caption
"ảnh các branches trong một dự án trên github của mình" below it. Reused the
stacked image/dialogue layout and synchronized the Pilot lesson and design
draft. Existing dialogue and navigation are preserved. Implementation:
`implemented`; verification: `pending`. No automated or rendered checks were
run under the owner's small-edit working agreement. Next action: owner desktop
visual review. Overall module acceptance remains unchanged.

### Git and GitHub assessment replacement — 11 September 2026

Replaced M3.1 mastery question 2 with the owner-approved question distinguishing
the roles of Git and GitHub, adapted from DevOps.vn question 2. Option 1 is
correct; the explanation cites GitHub documentation. Synchronized the Pilot
quiz, Course Companion question labels and assessment introduction, design
draft, and existing completion-test fixture. Existing question and scene IDs
are retained; no saved learner answers or completion rules were changed.

Implementation: `implemented`; verification: `pending`. Owner approval covers
this question replacement. No automated or rendered checks ran under the
owner's small-edit working agreement, and no checkpoint commit was created
without verification. Remaining gap and next action: owner review of question
2 and its answer feedback in Course Companion. Earlier full-app evidence does
not verify this replacement; overall Module 3 approval and pilot acceptance
remain unchanged.

### M3.2 — Implement constrained from-scratch scaffolding

**Change**

1. In the existing learner portfolio folder, ask Codex to inspect the approved
   planning package and propose the scaffold before writing.
2. The proposal must name commands, dependency versions, files, observable
   result, verification, network access, and approval needs.
3. After approval, create only React, TypeScript, Vite, a dependency lockfile,
   development/typecheck/lint/build/preview commands, ordinary entry files, a
   neutral page, minimal readable styles, `.gitignore` and `README.md`. The
   root `AGENTS.md` already exists from Module 2 and is not rewritten.
4. Define `npm run check` as typecheck, lint, and production build in a clear
   order. Preserve individual commands for diagnosis.
5. Do not create portfolio sections, final design tokens, optional libraries,
   deployment configuration, or personal content during scaffolding.
6. Create a recoverable local project checkpoint after learner acceptance.

**Verify**

- `npm run dev` shows the neutral page.
- `npm run check` passes.
- `npm run preview` serves the production build.
- Created dependencies and files match the approved proposal.
- No portfolio feature was implemented early.
- Recovery snapshot use, if unavoidable, is recorded as fallback evidence.

**Checkpoint output:** Known-good, learner-approved application baseline.

### M3.3 — Clarify and approve the design direction

**Change**

1. Give the same Executor task the approved PRD, real content inventory, and
   saved reference.
2. Have Codex explain the reference’s apparent hierarchy and visual character
   in ordinary language.
3. Recommend what to retain, adapt, simplify, or exclude.
4. Ask only high-impact questions, one at a time, with a recommendation.
5. Save and approve `evidence/module-3/design-direction.md` before app edits.

**Verify**

- Direction traces to the reference and PRD.
- It does not copy another person’s content, branding, images, or code.
- It defines a simple mobile adaptation rather than inventing it from a desktop
  screenshot.
- Optional motion or complexity is excluded unless explicitly justified.

**Checkpoint output:** Learner-approved design direction and build-slice plan.

### M3.4 — Build the complete first version in four accepted slices

Implement these slices sequentially inside the same Practice and Executor task:

1. **Foundation and Hero:** semantic page foundation, navigation, Hero, initial
   typography/color/spacing, mobile baseline, visible focus.
2. **Selected Work:** at least two evidence-rich project cases using real or
   honestly labeled concept evidence.
3. **About, Contact, and footer:** relevant story, capabilities, verified
   contact method, professional links, and focused footer.
4. **Responsive-accessibility integration:** required desktop/mobile behavior,
   heading/landmark review, keyboard operation, focus, image alternatives,
   primary links, and console review.

For every slice:

1. Codex proposes scope, files, non-goals, and checks.
2. Learner approves.
3. Codex implements only that slice.
4. Automated checks run.
5. Learner reviews the browser at the approved viewports.
6. Codex gives the five-part plain-language change summary.
7. Learner accepts or requests a bounded revision.
8. After acceptance, create a recoverable local project checkpoint and stage
   receipt before the next slice.

**Verify**

- A failed slice blocks the next slice.
- Later slices do not silently rewrite accepted content or design decisions.
- Build log records scope, evidence, learner decision, and checkpoint identity.
- The completed first version contains every required portfolio-core item.

**Checkpoint output:** Coherent first portfolio version built through four
recoverable evidence gates.

### M3.5 — Complete one whole-page revision cycle

**Change**

1. Compare the complete page with the PRD, design direction, primary-viewer
   goal, real content, and required viewports.
2. Let the learner give feedback in ordinary language.
3. Translate it into one bounded revision proposal and wait for approval.
4. Implement, verify, summarize, and record the accepted revision.

**Verify**

- The revision is prompted by observable evidence, not polish for its own sake.
- The record captures before, expected change, after, checks, and learner
  acceptance.
- Core behavior and previous accepted evidence receive regression checks.

**Checkpoint output:** One evidence-backed whole-page improvement.

### M3.6 — Complete one evidence-first debugging investigation

**Change**

1. Use an actual failure when one occurs; otherwise introduce one bounded,
   reversible course-controlled failure.
2. Follow: reproduce, expected/actual, collect evidence, one hypothesis,
   smallest justified fix, original check, regression checks.
3. Save `debugging-report.md` and require the learner to explain the visible
   failure, evidence used, and whether the accepted fix solved it.
4. Remove or reverse any course-controlled fault before completion.

**Verify**

- The report contains real commands/observations rather than invented evidence.
- The fix is causally connected to the reproduced failure.
- The original check passes and relevant regression checks pass.
- Unrelated accepted work remains intact.

**Checkpoint output:** Fresh debugging and recovery evidence.

### M3.7 — Plan and implement one independent enhancement

**Change**

1. Learner selects one bounded enhancement.
2. Learner states the goal and acceptance criteria with reduced guidance.
3. Codex proposes a small plan and waits for approval.
4. Implement through the standard loop and record acceptance evidence.
5. Do not admit backend/data-processing enhancements without a separately
   approved security scope.

**Verify**

- Enhancement is independent and bounded.
- It does not break the portfolio core.
- Learner can explain why it was selected and how success was checked.

**Checkpoint output:** Independent planning and implementation evidence.

### M3.8 — Implement the Practice, evidence adapter, and completion gate

**Change**

1. Continue the same Codex task and learner workspace used by
   `m2-portfolio-planning`; do not ask the learner to create or choose another
   task when the valid Module 2 handoff is available.
2. Present one learner-facing Practice rather than five milestone pages. Keep
   the five stages and four build slices as internal evidence and recovery
   boundaries.
3. In Teacher Triết, show `Hoàn thành bài` and `Xem objective` as the two main
   Practice actions. Do not ask the learner to inspect code, diffs, stage
   receipts, or technical metadata.
4. When the learner chooses `Hoàn thành bài`, collect current file, command,
   browser, debugging, enhancement, summary, and learner-approval evidence.
   Return either a passed review or a plain-language list of what remains.
5. Require a passed current Practice review and all five final mastery answers
   before saving the atomic Module 3 completion receipt and unlocking Module 4.

**Verify**

- Relaunch/resume preserves the continuous Practice task and its internal
  milestone/slice evidence.
- Stale PRD or design direction produces an explicit reconciliation path.
- The learner does not see stage navigation, while the final review still
  rejects missing or stale internal evidence.
- Module 4 remains locked until both product and learner-ownership gates pass.

**Checkpoint output:** Complete live Module 3 journey and reliable gate.

### Module 3 acceptance gate

Module 3 is accepted only when:

- a disposable learner workspace starts with planning artifacts but no app;
- the approved scaffold creates a neutral app and passes all three learner
  commands;
- the same Codex task continues from Module 2 and current internal evidence
  covers four build slices, one revision, one debugging investigation, and one
  enhancement;
- desktop/mobile, keyboard, focus, image, navigation, and console checks are
  represented honestly;
- Course Companion resumes the continuous Practice without exposing internal
  stage navigation;
- the full Course Companion verification suite passes;
- the module is committed locally in scoped checkpoints.

Do not implement Module 4 Practice, external deployment, official progression,
or graduation integration before this gate is accepted. Module 4 lesson content
and questions have been imported from the former content-review branch without
claiming gate completion or acceptance. Its Practice and graduation integration
remain blocked by the required preceding acceptance gates.

---

## Module 4 — Validate, publish, and prove ownership

### Module outcome

The learner deploys the portfolio version finalized in Module 3, checks
deployment security and operation, verifies a deployed preview, makes an
explicit production decision, and proves ownership and transfer. Module 4
does not repeat portfolio content approval. Assessments appear only at the
end of the module. Existing Module 3 content remains unchanged.

### M4.0 — Rehearse and lock one supported Vercel path

This is an implementation spike, not learner content.

**Rehearsal evidence:**
[Portfolio Course Vercel Rehearsal — 16 August 2026](portfolio-course-vercel-rehearsal-2026-08-16.md)
records the completed dashboard, linked-project CLI, CLI-only, protection,
responsive, log, and cleanup checks. On 16 August 2026, the owner approved the
recommended Codex-operated CLI flow with a neutral public bootstrap deployment,
Vercel Authentication verification before the real portfolio Preview, dashboard
inspection and recovery, and a separate optional Production decision.

**Historical provider observation:** Vercel assigned the first deployment of
new projects to Production in both August creation flows, and that rehearsal
used a neutral public bootstrap. Those observations do not establish that the
first Production deployment must be public.

**Browser authoring update — 14 September 2026:** Current Vercel documentation
supports team Default Protection with Vercel Authentication + All Deployments
before creating a project. The new content uses a protected first Production,
then a branch Preview, then an optional public publication decision. This
supersedes the bootstrap requirement for the learner browser path. Implementation
of the browser guide is `implemented`; authenticated provider verification is
`pending`. The August CLI evidence is preserved but does not certify this path.
The user approved this content direction, not a live deployment on their account.

**Change**

1. Test the current Git-connected Vercel dashboard flow and the smallest safe
   CLI-based alternative against a disposable Vite portfolio.
2. Compare account prerequisites, repository visibility, preview visibility,
   approval points, logs, production promotion, rollback/removal, macOS, and
   Windows behavior.
3. Select one primary beginner flow and one recovery route.
4. Record any network, package installation, login, or external-state approval.
5. Present the resulting provider-flow decision packet for approval before
   writing the learner lesson.

**Verify**

- A clean preview deploys and is opened directly.
- Public/protected status is observable rather than assumed.
- Build logs can be found and explained.
- An existing public Production site is not changed during a preview-only
  rehearsal. A new project's initial protected Production deployment requires
  explicit rehearsal authorization and verified default protection beforehand.
- A preview can be removed or access-restricted through the documented recovery
  path.

**Checkpoint output:** One currently verified, beginner-supportable Vercel
deployment path.

### M4.1 — Lock the manifest, lesson, assessment, and artifact contracts

**History merge publication gate — 6 October 2026:** Content integration is
`implemented`; current merged-target verification is `passed`. See M3.1 for
source and full target evidence, preservation scope and confirmed publication.
Automatic M4.8 Practice/graduation remains `not-started`; pilot acceptance is
pending.


**Approved Module 3–4 integration — 6 October 2026**

- Owner approved the remaining technical repairs and integration into
  `triet-v3-planning`, with separate approval for content or security changes.
  The after-video Module 4 wording was presented verbatim and explicitly
  approved before synchronizing the Pilot lesson. No security behavior changed.
- Implementation: `implemented` for the approved content batch, integrated from
  the authoring branch onto target baseline `4513318` in a separate worktree.
  Module 3 opens with Local preview, preserves its real Practice action, and ends
  with the approved publish reminder. Module 4 preserves its four instructional
  pages, uses the approved video, has no quiz, and proceeds to portfolio Practice.
  The target's existing Module 4 Practice action is preserved; its integration
  and automatic graduation remain deferred, as before.
- Verification: `passed` for the integrated automated gate: typecheck,
  `npm run lint`, 400 unit tests across 71 files, nine startup tests, production
  build and full `npm run test:electron`. The Electron journey uses disposable
  data and mock Codex; this is not live learner or provider acceptance. Logs:
  `/private/tmp/m34-target-tests.log`, `/private/tmp/m34-target-lint.log`,
  `/private/tmp/m34-target-electron.log` (includes successful typecheck/build).
- Resolved the obsolete Module 3 highlight assertion and a JSX-only presentation
  assertion rather than adding UI-copy tests. Updated Teacher test fixtures for
  the retained Module 4 scene and verified that its empty quiz creates no active
  assessment. The target Electron script is preserved unchanged and passes.
  On the authoring branch, the Module 1 repair passed that stage; its separate
  content-review smoke still has old Module 2 text expectations. That temporary
  script is excluded from this integration.
- Source audit: no content-review launcher, session routing or Practice bypass
  identifiers in integrated runtime code. Target Practice/Teacher implementations
  are preserved. The only completion/persistence changes route new Module 2
  completions to the Local preview page and continue accepting old receipts.
  Removed pages match the approved removals; no Module 1 or Module 2 page is lost.
- Next permitted action: owner review of integrated content, followed by the
  separately scoped Practice work or an explicitly authorized live rehearsal.
  No push or deployment is included. Module 4 implementation remains
  `in-progress` overall; owner module acceptance and pilot acceptance are pending.


**Portfolio outcome without a final quiz — 6 October 2026**

- Owner direction: remove all Module 4 questions and go straight to Practice.
  Success means having a portfolio; in this publishing module, the outcome is
  an online portfolio the learner can open and share by URL.
- Implementation: `implemented` for content and navigation. Removed the eight
  questions, assessment introduction and results pages, quiz outline entries,
  and review bypass into the quiz. Preserved all remaining instructional pages,
  Practice identity and the existing completion-status page.
- Synchronized the Pilot lesson, Teacher script, start prompt, manifest and quiz
  source. The quiz source keeps an empty groups array for loader compatibility.
  This supersedes the proposed five-question replacement and the earlier
  mandatory Preview, recovery, ownership-answer and transfer requirements for
  Module 4. Learner control over actual publication remains unchanged.
- Verification: `passed` for the changed Module 4 route and contracts; `failed`
  for the full pre-merge gate. Typecheck, lint, build, `git diff --check` and all
  nine startup tests passed. The full unit run passed 321/323 tests: the remaining
  failures are the pre-existing Module 3 highlight expectation and after-video
  Pilot/renderer paragraph mismatch. All changed Module 4, outline, registry and
  review-mode contracts passed. Full Electron smoke launched with disposable
  data, then failed at the existing Module 1 completion-title expectation at
  `tests/electron-smoke.mjs:580`, before Module 4.
- Desktop evidence: updated `tests/publication-content-smoke.mjs` passed 19
  instructional pages / 38 cases at 1440×900 and 1180×748, including the Module 4
  video, normal flow ending at Practice, preserved completion-status page via
  outline review, no Module 4 quiz or bypass, and unchanged saved progress.
  Practice screenshot at 1180×748 was also visually inspected. Evidence lives
  in `/var/folders/7m/ctbntkl14kv5g8gcz0l3ncxc0000gn/T/publication-content-evidence-ro9USl`;
  gate logs are `/private/tmp/m4-no-quiz-*.log`. These are disposable UI checks,
  not learner deployment or pilot-acceptance evidence.
- Remaining gaps: Practice integration and automatic completion recording remain
  deferred. Browsing still creates no completion receipt. Existing pre-merge
  findings must be evaluated separately before merging; no merge is implied.
- Next permitted action: resolve the two remaining content/test mismatches and
  the Module 1 smoke expectation before repeating the merge gate. No checkpoint
  commit was made: the full gate remains failed and files contain earlier
  uncommitted content edits. M4.1 stays `in-progress`; pilot acceptance is pending.


**Module 3–4 pre-merge review — 5 October 2026**

- Verification: `failed` for merge acceptance; see the M3.1 audit entry for exact
  automated and focused desktop results. Existing implementation is preserved.
- Spec/content findings: the current final assessment still requires branch
  Preview, Instant Rollback/Undo Rollback and personal Preview evidence after
  their teaching pages were explicitly removed. `prompts/start-module-4.vi.md`
  still directs Teacher to teach the deleted sequence; retained Practice
  requirements in the lesson still mandate a protected initial Production,
  Preview and recovery evidence. The Teacher script sends learners without a
  GitHub repo back to removed Module 3 instruction.
- Standards findings: `module-4-after-video` dialogue differs from the Pilot
  authority, failing the paragraph-parity test. The older
  `tests/publication-content-smoke.mjs` still targets deleted GitHub pages and
  assumes text dialogue on the video page; it is not the current focused runner
  and is not invoked by `npm run test:electron`.
- Next permitted action: retain the approved short lesson and obtain an owner
  decision about matching assessment/evidence scope, then synchronize Teacher
  instructions, source copy and test fixtures. Re-run affected checks and the
  full merge gate after resolution. No removed page was restored, no approved
  copy was rewritten, and no merge was performed. Pilot acceptance is pending.


**Short post-publication guidance — 5 October 2026**

- Owner direction: replace the pictured `module-4-vercel-preview` dialogue with
  two short paragraphs about buying a custom domain and updating from Local,
  relying on the Git and local-preview material already taught.
- Implementation: `implemented`. Updated only the requested renderer dialogue
  and corresponding Pilot lesson body. Retained the owner's informal opening,
  corrected the default suffix to `.vercel.app`, and specified commit/push to
  `main` with automatic updating conditional on it being the production branch
  and deployment succeeding. Existing headings, routes and surrounding copy
  remain unchanged.
- Factual references: Vercel domain purchasing and GitHub deployment docs were
  consulted. Verification: `pending` for repository/runtime behavior; no tests,
  build, diff check or visual checks were run for this narrow copy edit under
  the working agreement. No checkpoint commit was created.
- This replaces the introduction that set up the deleted update sequence.
  Unchanged Practice/assessment coverage gaps and prior content drift remain.
  Next permitted action: owner review of the replacement text. M4.1 remains
  `in-progress`; rendered and pilot acceptance remain pending.


**Local-update through transfer page removal — 5 October 2026**

- Owner direction: remove the contiguous range shown in the three screenshots,
  including both endpoints, from `module-4-update-local` through
  `module-4-transfer`.
- Implementation: `implemented` for this 15-page removal. The preserved
  `module-4-vercel-preview` page now leads to `module-4-portfolio-practice`.
  Removed corresponding renderer/shared scenes, lesson-page and outline entries,
  Pilot lesson sections and Teacher instructions. Omitted the now-empty
  Production renderer lesson while retaining shared lesson/checkpoint contracts.
  Updated affected existing content and navigation expectations.
- Verification: `pending`. No tests, typecheck, build, diff check or desktop
  verification were run for this explicitly scoped edit, following the working
  agreement. No checkpoint commit was created.
- Remaining gaps: the preserved introduction still sets up the removed update
  sequence; the unchanged Practice requirements and final assessment still cover
  removed teaching topics. Existing renderer/Pilot wording differences and the
  previously recorded Standard Protection contract mismatch remain unresolved.
- Next permitted action: owner review of the shortened flow and a separate
  decision about any replacement teaching or assessment changes. M4.1 remains
  `in-progress`; finished-content approval and pilot acceptance remain pending.


**Access-check page removal — 21 September 2026**

- Owner direction: remove the pictured `module-4-access-check` page.
- Implementation: `implemented`. The after-video page now leads directly to
  `module-4-vercel-preview`. Removed the page from the renderer, shared scene
  inventory, outline, Pilot lesson and Teacher script. Omit its now-empty
  renderer lesson while preserving the shared lesson/checkpoint identifiers.
  Updated existing route expectations. Surrounding copy and concurrent video
  edits are preserved.
- Verification: `pending`. No tests, build or runtime checks were run for this
  small, explicitly requested removal, following the working agreement.
  Earlier passing results predate this deletion.
- Next permitted action: owner review of the revised navigation. M4.1 remains
  `in-progress`; finished-content approval and pilot acceptance remain pending.


**"Chọn một thay đổi nhỏ" voice rewrite — 21 September 2026**

- Owner direction: rewrite the `module-4-vercel-preview` dialogue so it matches
  the Module 3 and early Module 4 teacher voice and reads less mechanically.
- Implementation: `implemented`. Rewrote only that scene's dialogue in
  `module-4/scenes.tsx` and the matching "Chọn một thay đổi nhỏ" section of
  `pilot-workspace/course/lessons/module-4.vi.md`, keeping the two in sync.
  Meaning preserved: pick one sentence, write the new wording, then Local →
  Internet preview → Production. All surrounding copy, headings, scene ids and
  routes untouched.
- Verification: `blocked`. `course-registry.test.ts` passes. Two Module 4
  contract tests fail for reasons predating and independent of this rewrite:
  `module-four-content-contract.test.ts` still requires "Standard Protection"
  in the lesson, which the approved access-check removal deleted; and
  `publication-content-contract.test.ts` reports `module-4-after-video` drift
  because the concurrent video edit changed the renderer dialogue without
  updating the Pilot lesson. The rewritten scene itself passes the paragraph
  parity check.
- Next permitted action: owner decides whether to retire the "Standard
  Protection" expectation and how to resync `module-4-after-video`. No commit
  was made because the focused gate cannot pass while those two mismatches
  stand. M4.1 remains `in-progress`.


**Video URL ending and music — 21 September 2026**

- Owner direction: approved a five-second ending showing the deployed URL and
  quiet instrumental background music.
- Implementation: `implemented` for this media edit. The bundled video is now
  132.9 seconds. The ending uses the owner's screenshot and the closing caption
  `thế là portfolio đã được published rồi, yay` below it. Original footage and approved
  captions are unchanged. Original synthesized music fades in and out.
- Verification: `pending` for the owner's subsequent exact-caption replacement;
  no checks were rerun for this small edit, per the working agreement.
  The preceding version `passed` the focused media gate. FFprobe reported matching
  132.9-second H.264 video and AAC audio streams at 1920 × 1080. Full-file FFmpeg
  decoding passed. Packet hashes confirm all 3,837 original video packets are
  unchanged, followed by exactly 150 new frames at 30 fps. Visual inspection
  confirmed a readable URL. Audio peaks at -12.5 dBFS without clipping.
  A disposable Chrome playback check decoded both streams, advanced across the
  join, and sought to the ending without media errors at 1440 × 900.
  `git diff --check` passed. Evidence and the render script are in
  `tmp/vercel-video-update-2026-09-21/`.
- Scope: only the bundled media and its documentation changed. Application
  tests, typecheck, a rebuild and full Electron acceptance were unnecessary
  because no code, layout, routes, dependencies or completion behavior changed.
  Native Course Companion playback was not rerun.
- Remaining gaps and next action: owner review of the finished video and music.
  M4.1 remains `in-progress` overall. Finished-content approval, live provider
  rehearsal, Practice integration and pilot acceptance remain pending.

**Post-video update exercise — 21 September 2026**

- Owner direction: approved for this revision. Remove the repeated first-deploy
  pages between `module-4-vercel-limits` and `module-4-vercel-deploy`, inclusive.
  Preserve the purpose of `module-4-vercel-preview` and split the update exercise
  into choosing a change, Local review, Preview publication, Preview review,
  approval, and Production publication.
- Implementation: `implemented` for the content revision; M4.1 remains
  `in-progress` overall. Thirteen old pages are replaced by two post-video
  checks. Two new pages separate Local editing from Preview publication.
  Lesson, Teacher script, start prompt, typed routes and outline agree.
  The remaining downstream pages and the eight final questions are preserved.
- Verification: `passed`. All 28 tests in course-registry, course-outline,
  publication-content-contract, module-four-content-contract and
  content-review-mode passed, as did `npm run typecheck`,
  `npx electron-vite build`, and `git diff --check`. A disposable Electron
  session traversed all 20 instructional pages at renderer sizes 1440 × 900
  and 1180 × 748, checked outline destinations and forward/back navigation,
  reached the eight-question form, and preserved saved progress byte-for-byte.
  No horizontal overflow or text/navigation overlap appeared. The smaller
  case also used a native non-fullscreen 1180 × 748 content area. At the larger
  size macOS constrained native height to 874; the renderer viewport was 900.
- Evidence: `tmp/m4-after-video-2026-09-21/` contains screenshots and
  `measurements.json`. The inventory comparison confirms exactly the 13
  approved retirements, four additions, and unchanged downstream page copy.
  Shared navigation behavior, persistence, Practice, receipts and unlock gates
  are unchanged. Full lint, the complete test suite and full-app Electron
  acceptance were unnecessary for this local content and routing gate.
- Source check: the environment model and Deployment Protection wording agree
  with Vercel's official environment and protection documentation. This check
  does not verify a learner's account configuration or deployment.
- Local checkpoint scope: approved on 21 September 2026 after the owner
  reviewed the explanation of a combined local commit. Include the existing
  Module 4 video, opening image, page cleanup, final-only assessment and this
  update exercise with their routes, tests and planning records. Exclude the
  unrelated Module 3 draft, `CLAUDE.md`, generated output and `tmp/`.
  The earlier turn-only patch could not apply independently against the index;
  the approved combined scope resolves that boundary. No push or deployment
  is authorized by this checkpoint approval.
- Remaining gaps: finished-content owner review, authenticated provider
  rehearsal, Practice integration and pilot acceptance. Approval covers the
  implementation direction, not finished-content acceptance. Next permitted
  action: create the approved local checkpoint, then present the revised pages
  for content review. Finished-content and pilot acceptance remain pending.


**Deployment scope and final-only assessment — 18 September 2026**

- Owner direction: approved. Use the portfolio version finalized in Module 3;
  do not repeat editorial or asset-permission review in Module 4. Preserve all
  existing Module 3 content. Ask assessment questions only at the end of
  Module 4 and remove the five intervening questions.
- Implementation: `implemented` for this content revision. The quiz bank,
  typed scene inventory, renderer routes, outline labels, lesson, Teacher
  script and start prompt agree. All 29 existing instructional pages remain;
  only the five expressly retired question pages are removed. Eight final
  questions remain, with the first now assessing a deployed-route failure.
  M4.2–M4.5 specifications now describe deployment evidence and security rather
  than repeated content approval. Their deferred runtime is not implemented.
- Verification: `passed` with 28 focused tests across registry, outline,
  publication content, Module 4 and review-mode contracts, plus typecheck and
  build. A disposable Electron session covered all 29 instructional pages at
  1440 × 900 and 1180 × 748, final-question submission, feedback and summary,
  and byte-for-byte saved-progress preservation. No horizontal overflow or
  text/navigation overlap appeared. The existing hosting opening scrolls at
  the smaller size; its owner-written text and layout remain unchanged.
- Thirty Module 3 files match their hashes from the start of this revision.
  The Module 3 sections of shared manifests and the plan are unchanged.
- Evidence: `tmp/m4-final-only-2026-09-18/` contains screenshots and
  `measurements.json`. Test answers are synthetic UI fixtures, not learner
  evidence. The focused gate covers local Module 4 content and navigation;
  no persistence, Practice, completion service, dependency or shared layout
  behavior changed, so the full app gate was not required.
- Local checkpoint: not created. The same renderer, registry and publication
  tests already contained uncommitted Module 4 page and video changes at turn
  start. A read-only check of the isolated patch against the index found
  overlapping test edits; lesson synchronization also depends on that earlier
  video change. The index remains untouched rather than checkpointing mixed
  work or claiming the isolated commit was verified.
- Remaining gaps: finished-content owner acceptance, authenticated provider
  rehearsal, Practice integration and learner pilot acceptance are pending.
  Next permitted action: owner content review, then separately authorized
  provider rehearsal. No deployment or official completion occurred.


**Complete publication content batch — 14 September 2026**

- Implementation: `implemented` for the approved content expansion; M4.1 remains
  `in-progress` overall because artifact/Practice contracts are deferred.
- Added beginner Vercel benefits/limits, Local/Preview/Production, release and
  privacy checks, GitHub import/configuration, protected first deployment,
  branch Preview, optional public publication, post-publication checks,
  sharing/domain basics, small updates, build failures, rollback, Undo Rollback,
  ownership notes and transfer to a different small application.
- Preserved the approved hosting/roles opening verbatim and every baseline
  scene ID. The five semantic checkpoint IDs, Practice ID/version, progress
  storage and completion gates are unchanged. The expanded module has five
  formative questions and eight final questions (six scenarios, two written).
- Three original browser PNGs are stored with source notes. Two documentation
  illustrations are displayed through CSS crops of full browser screenshots;
  all numbered overlays also appear in the enlargement view. They are labeled
  reference images, not a learner deployment or account configuration.
- The requested GPT-5.6 Sol, high, read-only review ran once. Required findings
  were fixed: exact opening preservation, manual GitHub evidence stop, plain
  review-state copy with the unavailable primary Practice action removed,
  lighter terminology/configuration pages, balanced answer positions and an
  explicit transfer prompt. See `module-4-content-review-2026-09-14.md`.
- Verification: `passed` for the affected content. Typecheck, lint, 40 focused
  tests, all 323 unit tests, nine startup tests and production build passed.
  The publication-specific Electron journey passed 37 instructional pages
  across 74 desktop cases (1440 × 900 and 1180 × 748), five formative and eight
  final questions, all three annotated image enlargements, outline/keyboard
  navigation and byte-for-byte unchanged disposable saved progress. Every
  baseline scene ID and the approved hosting opening were preserved. Evidence:
  `tmp/publication-content-2026-09-14/measurements.json` and its screenshots.
- The full gate was attempted because the batch touches cross-module inventories
  and the shared image renderer. Full-app Electron verification is `failed`:
  `tests/electron-smoke.mjs:580` waits for `Module 1 đã hoàn thành`, a title
  already absent from rendered output at baseline `5526b30`. The run stops
  before Module 3/4. This unrelated obsolete expectation is left for a separate
  repair; the passing scoped gate is not presented as full-app acceptance.
- Remaining gaps: authenticated browser deployment/rollback rehearsal, actual
  GitHub evidence from a learner, provider-backed Practice verification,
  official completion/graduation, Windows provider verification, owner content
  acceptance and live pilot acceptance. None is inferred from content review.
- Next permitted action: present the completed batch and scoped evidence for
  owner review, then conduct an explicitly authorized provider rehearsal and
  the separately gated Practice integration. Resolve the unrelated full Electron
  blocker before full-app verification or release. Do not start another module.

**Content-first implementation note — 17 August 2026:** The manifest, five
learner content milestones, Teacher script, start prompt, five formative checks,
six-question final review, typed renderer scenes, session-only review route, and
temporary per-Practice review bypasses are implemented on
`practice-disabled-content-development`. Artifact templates, the
`m4-portfolio-release` Practice definition file, evidence adapters, official
completion service, and graduation receipt remain deferred. Therefore M4.1 is
`in-progress`, not complete. Focused verification passed with typecheck, lint,
284 unit tests, nine startup tests, production build, desktop and narrow
screenshot inspection, and Electron smoke. The integrated branch subsequently
passed 287 unit tests, nine startup tests, typecheck, lint, production build,
Electron smoke, `git diff --check`, and the review-only identifier audit on 18
August 2026. The content itself still requires owner review.

**Hosting roles page removal — 16 September 2026**

- Implementation: `implemented`. The owner requested removal of the pictured
  `module-4-hosting-roles` page. Its renderer content and page registrations are
  removed; `module-4-hosting-intro` now leads to `module-4-vercel-benefits`.
- Existing route and page-preservation test expectations reflect the removal.
- Verification: `pending`. Checks were not run under the working agreement for
  small, explicitly scoped edits. Earlier verification predates this removal.
- Remaining gap and next action: inspect the revised opening in the app.
  M4.1 remains `in-progress`; module approval and pilot acceptance remain pending.

**Hosting opening image — 16 September 2026**

- Implementation: `implemented`. Added the owner-supplied Vercel Projects
  screenshot to `module-4-hosting-intro` using the existing image component
  with `contain` sizing. Existing copy and navigation remain unchanged.
- Verification: `pending`. Checks were not run under the working agreement for
  small, explicitly scoped edits. Earlier visual evidence predates this image.
- Remaining gap and next action: inspect the image on the opening page in the
  app. M4.1 remains `in-progress`; module approval and pilot acceptance remain
  pending.

**Hosting opening image spacing and caption — 17 September 2026**

- Implementation: `implemented`. The opening page now uses the existing stacked
  image/dialogue layout with a 24px gap and the owner-requested caption
  “dashboard của Vercel”. The layout can scroll when the window is too short.
- Verification: `pending`. Checks were not run under the working agreement for
  small, explicitly scoped edits.
- Remaining gap and next action: the owner checks image spacing and the caption
  in a non-fullscreen desktop window. M4.1 remains `in-progress`; module approval
  and pilot acceptance remain pending.

**Vercel walkthrough video — 17 September 2026**

- Implementation: `implemented`. Bundled the owner-approved, captioned OBS
  recording on `module-4-vercel-benefits`, with native playback, seeking and
  fullscreen controls. The video uses a local asset and does not autoplay.
- Per the owner's follow-up, the page immediately after the hosting opening
  centers the video, removes the Teacher dialogue box and character, and shows
  only a short invitation to watch above the player. Back/Next controls remain
  below it, with scrolling for shorter desktop windows.
- Owner approval covers the video, its inclusion and this replacement of the
  explanation on `module-4-vercel-benefits`. Other pages, navigation targets
  and completion gates remain unchanged.
- Follow-up layout fix: the video page's navigation now participates in normal
  layout instead of inheriting the dialogue's absolute positioning. The watch
  instruction uses bold yellow text at 21–26px on the checked desktop sizes.
- Verification: `passed` for the focused layout fix. `electron-vite build`,
  `npm run typecheck` and `git diff --check` passed. Browser renderer checks at
  1440 × 900 and 1180 × 748 measured a 20px video-to-navigation gap, no horizontal
  overflow and both controls inside the viewport. A native Electron inspection
  after restart confirmed the new layout and functioning video playback.
  The full app suite was unnecessary for this scene-scoped CSS correction.
- Remaining gap and next action: owner review of this revised page; fullscreen
  playback and wider module acceptance were not tested in this focused pass.
  M4.1 remains `in-progress`; module approval and pilot acceptance remain
  pending. The example deployment is not learner Practice evidence.

**Hosting opening — 14 September 2026**

- Implementation: `implemented` for this addition; M4.1 overall remains
  `in-progress` because its artifact and Practice contracts remain deferred.
- Owner approval: the user approved the beginner explanation of hosting and
  the roles of the computer, GitHub and Vercel, then requested implementation.
  This is not approval of the remaining Module 4 content or pilot acceptance.
- Added `module-4-hosting-intro` and `module-4-hosting-roles` before the existing
  release-validation page. Both belong to `m4-release-validation`; no lesson,
  checkpoint, Practice identity or completion gate was added or removed.
- The Pilot lesson, Teacher script, start prompt, renderer, page registry,
  outline and content-review entry agree on this opening. Local, Preview,
  Production and deployment configuration are kept out of the two new pages.
- Verification: `passed`. `npm run typecheck` and the four focused Vitest files
  `module-four-content-contract`, `course-registry`, `course-outline` and
  `content-review-mode` passed all 24 tests. `electron-vite build` supplied the
  current application for a focused Electron inspection. Both new pages fit
  1440 × 900 and 1180 × 748 without horizontal overflow, clipped copy or
  overlapping navigation controls. Module 4 entry, outline destinations,
  keyboard activation, forward/back navigation and return to Home Base passed;
  disposable learner progress remained byte-for-byte unchanged.
- Evidence: `tmp/module-4-hosting-2026-09-14/` contains four screenshots and
  `measurements.json`. These local inspection artifacts are not checkpointed.
- The acceptance gate is focused because this is additive content and local
  page routing. Shared navigation behavior, persistence, Practice and unlock
  gates were not changed. Full lint, the complete test suite and the full
  Electron journey were not required or claimed for this addition.
- Remaining work: review the rendered opening, then agree and implement the
  next learner section. The GitHub publishing exercise, revised browser-based
  Vercel flow, annotated screenshots and update/recovery lessons remain proposed
  work. They are not implemented by this checkpoint.

**Change**

1. Add Module 4 and its five milestones to `course-structure.json`.
2. Add lesson, Teacher script, start prompt, quiz, and artifact templates.
3. Replace the old ContentPilot graduation assessment with a portfolio
   assessment covering planning, scoped implementation, evidence review,
   debugging, security/publication judgment, deployment, ownership, and
   transfer.
4. Keep numeric passing thresholds configurable until beginner pilots support
   them. Required evidence gates remain non-negotiable.

**Verify**

- Graduation cannot be earned by visual polish alone.
- Production publication is optional; a verified preview is required.
- A protected preview counts only when protection is actually verified.
- A deliberately public preview counts only after the publication checklist
  and learner approval.

**Checkpoint output:** Complete Module 4 and graduation contract.

### M4.2 — Implement the release validation report

**Change**

1. Use the portfolio version finalized in Module 3; record its repo, branch
   and commit without repeating content or PRD approval.
2. Run `npm run check` and `npm run preview` to prepare the deployment build.
3. Record build results, deployment configuration and unresolved technical
   limits.
4. Verify deployed behavior against that version after deployment, including
   routes, assets, downloads and access at the agreed product viewports.
5. Route blocking deployment failures through the standard debugging loop.

**Verify**

- Deployment evidence identifies the source version finalized in Module 3.
- Build success never substitutes for observing the deployed website.
- Technical limits are recorded; portfolio copy and asset approval are not
  reassessed in Module 4.

**Checkpoint output:** Deployment validation report tied to the source version.

### M4.3 — Enforce the security and publication gate

**Change**

Before any unprotected preview or production action, inspect and record:

1. secrets, API keys, tokens, `.env` files, client-exposed configuration, and
   suspicious generated files;
2. repository visibility and committed history risks;
3. unintended exposure of private files through deployed URLs;
4. the files included in the deployment, using existing content approvals
   rather than asking the learner to approve portfolio material again;
5. external links and third-party resources;
6. dependency and build warnings;
7. preview visibility/protection;
8. planned rollback, removal, or access-restriction route.

If the project contains a contact-form backend, analytics, authentication,
payments, a database, or another data-processing service, stop the standard
course flow. Require a new security scope or remove the feature from the
release candidate.

**Verify**

- Test fixtures for exposed secret, committed `.env`, unintended file
  exposure, public repository, public preview, and added backend.
- Gate blocks external action until the learner reviews and approves the
  current checklist.
- Sensitive values never enter Course Companion logs or Teacher context.

**Checkpoint output:** Learner-approved security and publication decision on
the current release candidate.

### M4.4 — Review and save the release candidate

**Change**

1. Codex inspects the complete technical change set.
2. Summarize source version, build results, deployment configuration, access
   boundary, security findings and recovery route.
3. Learner reviews the deployment evidence and approves the external action;
   do not repeat portfolio content acceptance from Module 3.
4. After acceptance, create a clean local release checkpoint. Do not push or
   deploy as part of checkpoint creation.

**Verify**

- Working tree scope is understood.
- No secret or unrelated file enters the release checkpoint.
- `npm run check` still passes at the checkpoint.
- Learner approval references the current commit and artifact digests.

**Checkpoint output:** Clean, recoverable release candidate.

### M4.5 — Create and verify the deployed preview

**Change**

1. Codex proposes the exact supported Vercel steps and external effects.
2. Learner explicitly approves network, login, repository connection/push when
   required, and preview creation as separate consequential actions.
3. Create the preview using the verified path from M4.0.
4. Inspect build status and logs.
5. Open the deployed URL and check operation, responsive behavior, keyboard
   access and security against the finalized source version. Do not repeat
   editorial review of portfolio content.
6. Record discrepancies and resolve or explicitly bound them.

**Verify**

- A URL alone cannot pass.
- Deployment identity, timestamp, source revision, build status, visibility,
  and live observations are recorded.
- Local and deployed results are reconciled.
- Course Companion does not label Executor-reported deployment as independently
  verified unless it has corroborating evidence.

**Checkpoint output:** Verified preview deployment evidence.

### M4.6 — Record the production-publication decision

**Change**

1. Present the consequences of public production, including privacy,
   repository, asset, and permanence concerns.
2. Require an explicit learner choice.
3. If the learner declines, record the reason and later publication steps; do
   not block graduation.
4. If the learner approves production, require a fresh security checklist,
   explicit production action approval, live verification, and rollback path.

**Verify**

- No preview action is treated as production approval.
- Declining production still permits the graduation gate when the preview is
  verified.
- Production evidence names the exact source revision and recovery route.

**Checkpoint output:** Deliberate, auditable production decision.

### M4.7 — Complete ownership defense and transfer package

**Change**

1. Ask ownership questions one at a time.
2. Require learner-owned explanations of audience, scope, reference adaptation,
   one design decision, one evidence-driven revision, one debugging
   investigation, deployment evidence, security/publication choice, and known
   limitations.
3. Have the learner frame a different small project with reduced guidance and
   save its brief, initial requirements, validation approach, and first bounded
   plan.
4. Do not require implementation of the transfer project for this course
   version.

**Verify**

- Answers cite the learner’s own artifacts and observations.
- Repeating course wording without a concrete example does not pass.
- Transfer work is genuinely a different project, not another portfolio
  feature.

**Checkpoint output:** Learner ownership and transfer evidence.

### M4.8 — Implement the Practice and graduation gate

**Scope update — 6 October 2026:** The owner replaced Module 4's final assessment
and separate Preview/recovery/ownership/transfer requirements with the outcome
of a shareable online portfolio. The historical implementation list below is
superseded where it requires those removed learner deliverables. Automatic
Practice and graduation recording is still `not-started`, verification `pending`.
Do not activate or claim those mechanisms through this content-only change.

**Practice-only implementation update — 22 October 2026:** The later explicit
request authorizes the workflow described in the latest progress-ledger entry
and `module-4-practice-design-2026-10-22.md`. Its one-record approval/review/return
mechanism is `implemented`; current verification and integration gaps are
recorded there. This supersedes the earlier Practice-development deferral,
without changing historical owner/pilot acceptance or taking ownership of the
courseapp entry, lesson/completion copy or course-wide graduation decision.


**Change**

1. Add `m4-portfolio-release` with five milestone stages.
2. Add release, security, deployment, production-decision, ownership, and
   transfer evidence types.
3. Bind preview evidence to the accepted release checkpoint.
4. Invalidate deployment acceptance when the release source changes.
5. Require current evidence for every non-negotiable gate and human review for
   ownership/transfer.
6. Save the graduation result separately from immutable learner artifacts.

**Verify**

- Stale deployment after a new commit fails until redeployed and reverified.
- Public preview without learner approval fails.
- Production decline passes when all other gates pass.
- Missing security evidence, debugging evidence, or transfer work fails.
- Targeted resubmission reopens only failed or stale stages.

**Checkpoint output:** Complete Module 4 and evidence-gated graduation flow.

### Module 4 and graduation acceptance gate

The course implementation is accepted only when:

- a disposable learner journey completes Modules 2–4 in order;
- the same learner-selected portfolio folder persists across all three
  Practices;
- the release candidate passes local, security, and publication review;
- a live preview is opened and verified at the accepted source revision;
- production can be approved or declined without corrupting progress;
- ownership and transfer require learner-owned evidence;
- targeted recovery works from each Module 4 milestone;
- the full Course Companion verification suite passes;
- clean-install launcher and Electron smoke tests pass on the supported
  platforms;
- Module 4 is committed locally in scoped checkpoints.

## Verification matrix

| Surface | Foundation | Module 2 | Module 3 | Module 4 |
|---|---:|---:|---:|---:|
| Course manifest/schema | Required | Required | Required | Required |
| Introduction/Module 1 frozen regression | Required | Required | Required | Required |
| Silent clean restart | Required | Regression | Regression | Regression |
| Workspace path safety | Required | Required | Required | Required |
| Practice-definition parser | Required | Required | Required | Required |
| Evidence freshness/digests | Required | Planning | Build | Release/deploy |
| Lesson/script/quiz synchronization | — | Required | Required | Required |
| Teacher-led one-question-at-a-time assessment | — | Required | Required | Required |
| Course Companion group submission and post-submit route | Regression | Direct summary + full-group retry | Feedback + retry | Feedback + retry |
| Exact checkpoint resume | Required | 5 stages | 5 stages + 4 slices | 5 stages |
| Desktop/narrow Course Companion UI | Regression | Required | Required | Required |
| Learner app browser checks | — | — | Required | Required local/live |
| Security/publication gate | Boundary | Planning privacy | No backend creep | Required |
| Electron smoke | Required | Through M2 | Through M3 | Full journey |

## Pilot and rollout sequence

Implementation and learner pilots follow the same one-module-at-a-time rule.

1. **Foundation developer rehearsal:** clean-restart fixture, workspace selection,
   registry, and Module 1 regression only.
2. **Module 2 internal rehearsal:** use a disposable portfolio workspace and
   deliberately test incomplete, stale, private, and misaligned planning
   artifacts.
3. **Module 2 beginner pilot:** do not expose Module 3. Record confusion,
   unsupported help, recovery needs, and gate independence. Do not publish a
   duration claim.
4. **Module 2 acceptance:** repair and freeze the accepted Module 2 contract.
5. **Module 3 internal rehearsal and beginner pilot:** begin only after Module
   2 acceptance; test scaffold failures, slice recovery, ordinary-language
   feedback, debugging, and enhancement independence.
6. **Module 3 acceptance:** repair and freeze the accepted Module 3 contract.
7. **Module 4 provider rehearsal:** validate the current Vercel path before
   learner-facing authoring.
8. **Module 4 internal rehearsal and beginner pilot:** test public/protected
   previews, deliberate production decline, rollback, stale deployment,
   security blockers, defense, and transfer.
9. **Release candidate:** run clean-install, launcher, full Electron, and
   supported-platform checks.

Pilot research may record time spent, but learner progress and published course
claims remain mastery-based until representative evidence supports a useful
duration range.

## Risks and controls

| Risk | Control |
|---|---|
| Frozen introduction or Module 1 changes accidentally | Legacy rendering path, semantic snapshots, exact changed-file review, narrow transition-copy exception |
| Old ContentPilot completion falsely passes new Module 2 | New IDs, course/schema bump, silent clean restart, no receipt reuse |
| Module 2 registry refactor becomes a full UI rewrite | Route only Modules 2–4 through the registry; preserve legacy path |
| Learner portfolio is created inside course files | Canonical folder validation and explicit rejection |
| One Practice becomes one unreviewable change | Stage receipts, Module 3 internal slice receipts, acceptance before next stage |
| Many Practices lose context | One persistent Executor task per module; artifacts are the cross-module handoff |
| From-scratch scaffold becomes inconsistent | Constrained scaffold proposal, dependency lock, exact commands, neutral baseline, recovery snapshot only as fallback |
| Visual reference encourages copying | Source/permission metadata, adapt/simplify/exclude review, no copied content/assets/code |
| Beginner is asked to review unreadable code | Fixed five-part plain-language summary plus browser and check evidence |
| Automated checks replace human verification | Browser, responsive, keyboard, focus, content, console, and live deployment checks remain required |
| Preview is assumed private | Visibility is observed; public exposure requires privacy checklist and explicit approval |
| Optional backend expands security scope | Stop gate and separate security review or removal from release candidate |
| Production happens implicitly | Separate explicit production decision and action approval |
| Course promises an unsupported duration | No fixed time in manifest/copy; pilot measures without advancing by time |
| Historical ContentPilot files confuse contributors | Supersession notices and runnable-path removal before any deletion decision |

## Decisions intentionally deferred

The following are implementation-time decision gates, not permission to infer a
choice silently:

1. Exact desktop and mobile viewport values, before Module 3 visual assertions.
2. Final numeric quiz/mastery thresholds, after representative beginner pilot
   evidence.
3. Distribution and contents of the fallback scaffold recovery snapshot.
4. Whether and when historical ContentPilot starters, artifacts, and planning
   contracts are moved to an archive or deleted.
5. Public marketing wording and any published course-duration range.

Each decision must be presented as one consequence-based packet with a
recommendation, alternatives, tradeoffs, and downstream effects before the
hard-to-reverse implementation proceeds.

## Definition of implementation complete

This course migration is complete only when:

1. The imported portfolio curriculum is the unambiguous current planning
   authority in the repository.
2. The occupation-neutral target learner is reflected consistently in internal
   guidance and Modules 2–4.
3. Introduction remains unchanged. Module 1 differs only through the approved
   Module 2 transition copy, Harness Engineering removal, and the new
   `AGENTS.md` and Skills lesson, with synchronized references, checkpoints,
   assessment boundaries, and progress migration.
4. State from the `0.2.0` test course starts fresh without a migration notice,
   and old ContentPilot evidence cannot pass a portfolio gate.
5. Modules 2, 3, and 4 each pass their own acceptance gate before the next is
   implemented.
6. One learner-selected portfolio folder persists safely across all three
   module Practices.
7. Every required learner artifact is current, reviewable, and bound to explicit
   learner acceptance.
8. The portfolio is built through small verified slices, not generated as one
   unreviewed change.
9. Release security and publication checks run before external exposure.
10. A live preview, ownership defense, and different-project transfer package
    pass the graduation gate.
11. The complete Course Companion verification and clean-install journey pass
    on supported platforms.
12. All repository changes are delivered through scoped, verified local
    checkpoints with unrelated work preserved and no automatic push.
