# Repository Guidance

## Read this handoff first

- Before reviewing this integration or starting follow-up work, read [Practice and Teacher handoff for triet-v3-planning](docs/planning/practice-teacher-handoff-triet-v3-2026-09-12.md) first. It explains what changed, what to preserve, what was tested, and which decisions remain open. Then follow the scoped instructions below.

## Instruction routing

- Before changing files under `pilot-workspace/`, read `pilot-workspace/AGENTS.md`, even when the task starts from the repository root.
- Before changing files under `course-companion/`, read `course-companion/AGENTS.md`.
- Before changing files under `starters/contentpilot/` or a runnable scaffold under `prototypes/`, read the closest nested `AGENTS.md`.
- Apply the closest scoped guidance together with this file; keep cross-repository rules here and specialized implementation details near the files they govern.

## Consequential decisions

- Resolve small, reversible details from repository evidence or a safe default.
- For consequential product, curriculum, architecture, or workflow choices, explain why the decision matters, recommend a direction, describe meaningful alternatives and tradeoffs, and state which downstream choices it settles.
- Group linked choices into one decision packet and ask only one packet at a time. Escalate scope, learner outcomes, cost, safety, external effects, or difficult reversals separately.

## Trivial-edit fast path

- Treat an edit as trivial when the user specifies an exact file, value, or otherwise unambiguous change of only a few reversible lines; the change does not affect security, persisted data, schemas, migrations, dependencies, or external systems; and the user has not requested broader verification.
- Make a trivial edit directly without proposing a plan or requesting approval. Inspect the target before editing and review only the scoped diff afterward.
- Do not run the full test suite, build, Electron verification, screenshot testing, planning-ledger synchronization, or checkpoint commit for a trivial edit unless the user requests it or a narrow syntax check is clearly necessary.
- When a trivial edit changes visible behavior and the user says they will verify it, leave runtime verification to the user and state explicitly that it was not run.

## Verification batching

- For small, related, user-approved changes, define the batch scope first, implement the changes together, and run narrow focused checks while iterating.
- Run the required full test suite, build, Electron verification, planning-ledger synchronization, and any eligible checkpoint commit once after the coherent batch is complete. This does not apply to an edit that qualifies for the trivial-edit fast path.
- Verify a change separately when it is unrelated, high-risk, must be delivered independently, or focused evidence shows that earlier full verification is necessary.
- Never use batching to skip required final verification or postpone a failing focused check.

## Keep published course source clean

- Never commit personal learner progress, Teacher history or memory, Practice runs,
  local app profiles, completed learner submissions, QA waivers or temporary test
  workspaces. Keep canonical blank templates and deliberately named test fixtures.
- Run desktop rehearsals and documentation captures with a disposable
  `COURSE_COMPANION_USER_DATA_DIR`; do not reset the normal learner profile to make
  a test or screenshot start at the introduction.
- Before each commit or push, run `node scripts/check-clean-course-source.mjs`
  after staging the intended files. It checks the Git index, including newly
  staged files, for private state and test residue.
- A new checkout on the same computer and OS account can resume the existing
  Course Companion profile stored in the operating system's application-data
  directory. That is separate from Git. Do not delete local progress or alter
  normal resume behavior unless the user explicitly requests a reset.

## Implementation-plan synchronization

- Treat `docs/planning/portfolio-course-implementation-plan.md` as part of the definition of done for work that implements, verifies, changes, or blocks a numbered checkpoint or acceptance gate.
- Before the final response and before a qualifying checkpoint commit, re-read the affected checkpoint, inspect the actual changes and verification output, then update its progress ledger, remaining gaps, and next permitted action.
- Set implementation only to `not-started`, `in-progress`, or `implemented`, and verification only to `pending`, `passed`, `failed`, or `blocked`, when repository evidence supports the transition.
- Never infer owner approval or pilot acceptance. Mark owner approval only after explicit user approval and pilot acceptance only after the required rehearsal or learner evidence.
- Do not begin the next module while the current module still lacks its required approval or acceptance gate.
- If implementation changed but the plan cannot be synchronized safely, stop before committing and report the mismatch.

## Course routing and authority

- `pilot-workspace/` is the only runnable private-course authority; `docs/planning/` is the public-course plan.
- Use `$start-course-lesson intro` for the normal start and `$start-course-lesson module-1` only for an intentional intro skip. Never offer historical `module-0`.
- Use `$course-teacher` to teach, assess, resume, or review Pilot lessons. Follow the current lesson `scriptPath`, ask assessed questions one at a time, and require learner-owned written examples.
- If the user asks to resume without specifying time, ask whether they have 10, 20, 30, 45, or 60 minutes.
- Read `docs/internal/target-learner-definition.md` before curriculum, product, or learner-experience decisions. Keep it internal and out of learner-facing or public packages.
- Treat `starters/contentpilot/` as the real application baseline. Treat `prototypes/` and `codex_content_creator_course_plan_v8.html` as historical references only; never fall back to them when current Pilot material is missing.

## Page preservation

- Never remove an existing application or course page, learner-facing lesson scene, route, or navigation target unless the user explicitly requests removal of that exact page.
- Changes to adjacent content must not merge away, hide, skip, orphan, repurpose, or otherwise make an unrequested page unreachable.
- Before committing a changed learner flow, compare the affected page and scene inventory with the baseline and restore any removal that the user did not explicitly approve.

## Copy preservation

- Treat existing application and course copy as user-owned approved text. Never rewrite, polish, shorten, expand, translate, or change its tone unless the user explicitly requests a change to that exact copy.
- Product, curriculum, layout, and navigation work must preserve surrounding copy verbatim, including wording, punctuation, and capitalization.
- If a technical or consistency issue appears to require a copy change, keep the current copy unchanged, explain the issue, and ask for approval before editing it.

## Vietnamese

- Write learner-facing Vietnamese naturally with complete diacritics and tone marks.
- Do not use ASCII-only Vietnamese unless quoting intentionally unaccented input.
