# One Codex project for portfolio Practice

The owner approved adding project setup immediately after Module 2 portfolio
folder confirmation and reusing the same project for all portfolio practices.

## Learner flow

After `planning` is created on the existing folder page, Course Companion
automatically creates or reuses the Codex project for the canonical portfolio
root. Re-read the actual project before enabling Continue. Save its ID, name
and registration time in application data. No copy-path instructions or
self-confirmation checkbox remain. Show a recoverable error and retry if
registration fails; preserve the folder and never claim readiness from a
request acknowledgement alone. The owner explicitly requested this automatic
flow after trying the initial guided setup.

Modules 2–4 reuse this verified project ID. New portfolio tasks start with that
assignment; existing linked tasks can be attached through metadata and re-read
to verify membership, without acquiring a writer or sending a prompt. Keep the
exact task/workspace handoff, resubmission and review behavior.
Module 1 setup sequencing remains unchanged. Do not initialize Git or create a
second folder.

The owner also requested readable Practice chat names. New Module 1 chats use
`Làm quen với Codex · Module 1`; the single continuing portfolio chat uses
`Portfolio của tôi`. Run IDs remain internal. Project grouping does not enforce
unique chat names; identity continues to use the exact thread and run IDs.
Existing chats retain their current titles, including learner customizations.

The owner subsequently removed the Module 1 Model requirement. Assess only
Effort High, Speed Standard, Approval Approve for me and Full access off.
Unknown or missing model metadata must not make these four settings
unverifiable. Carry the observed model into later task creation when present;
otherwise inherit Codex's model. Preserve safety checks, exact binding,
freshness and the remaining approval boundaries. Synchronize only related
Practice instructions, canonical lesson/script/prompt, legacy checklist,
walkthrough and their preservation baselines. Model theory examples remain.

## Implementation and compatibility

Add an optional verified project binding to the existing workspace record and
view. Older records remain valid, but a legacy manual acknowledgement is never
treated as verified registration. Use narrow IPC bound to the expected
canonical path. Reject stale path bindings, missing folders and registration
before planning is ready. Folder reselection clears the project binding.
Reset removes only Course Companion metadata, never a Codex project or task.

The installed Codex protocol exposes experimental `project/list`,
`project/create`, `project/read`, `thread/start.projectId` and
`thread/metadata/update.projectId`. Use an experimental-capable, short-lived
client, a deterministic creation idempotency key, and primary-root matching.
Preserve existing project names. Do not edit Codex's private storage or change
Git. An unsupported runtime gets a retry/update error, not a manual success
flag. No additional assessed completion criterion is introduced.

### Desktop registration correction — 17 November 2026

The owner's live Windows test showed that an App Server project is not by
itself a visible Codex desktop project. The prior isolated protocol probe did
not establish desktop registration. Keep the approved automatic folder-page
flow, but open the native `codex://new?path=<encoded-folder>` link when the
folder is missing from the desktop registry. This opens a composer without
sending a prompt or creating a persisted conversation. Codex owns the project
mutation; Course Companion never writes Codex's private state.

Read the desktop registry and its local desktop-to-server project ID mapping,
then verify that mapped server record and its primary root. Wait for durable
registration after the native open acknowledgement. Unsupported or missing
registry data cannot satisfy readiness. This readback depends on the installed
desktop registry format and must fail closed if that format changes.

Reuse existing desktop projects and their names. Older backend-only bindings
are repaired to the visible project's server ID during preparation, retaining
the exact portfolio thread, folder, approvals and evidence. Save the repaired
binding for subsequent handoffs. Keep any old backend record rather than
deleting projects or chats. Verification must distinguish actual desktop
visibility from simulated Electron journeys and backend protocol checks.

## Verification

Check registration reuse, persistence, stale paths, missing folders,
reselection, rendering and Module 1 exclusion. Probe the real protocol with a
disposable Codex home and no model prompts. Rehearse the actual folder page in
an isolated simulated Electron profile at desktop and narrow widths, including
reload and connection failure/retry. Run required typecheck, lint, unit/startup, build and
Electron checks once for the complete batch, plus the existing portfolio
continuity journey. Update the implementation ledger from observed results.
