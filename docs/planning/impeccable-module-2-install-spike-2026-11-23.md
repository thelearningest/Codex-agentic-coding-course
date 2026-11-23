# Impeccable in Module 2: install spike

23 November 2026. Phase 1 of the plan to introduce the Impeccable design skill in
Module 2 and have learners install it during Practice step 3 (visual reference and
HTML prototype). No course, app or Practice file was changed in this phase.

## Decisions already made by the owner

- Learners install Impeccable **globally**, not in the portfolio folder.
- When Codex offers the install, it must remind the learner that this is the
  global environment, reinforcing the Module 1 distinction between global and
  current-repo `AGENTS.md`.
- Learners install upstream `skill-v4.10.0`, pinned by tag, not the locally
  edited 4.9.2 copy (decided 23 November 2026).
- Impeccable vs `frontend-design`: recommended Impeccable as the single design
  skill, teaching only `shape` and `critique` by name. Not yet decided; Module 1
  copy that names `frontend-design` stays unchanged until the owner approves exact
  replacement wording.

## Findings

### 1. No Practice installs `frontend-design` or `copywriting` today

A search of tracked files finds them only in Module 1 lesson text, the Module 1
script, renderer scenes in `LearningWindow.tsx` and tests
(`electron-smoke.mjs`, `frozen-intro-module-one.test.ts`). No Practice, prompt or
`AGENTS.md` template installs them. A learner without them already installed
never gets them. Replacing them in Module 1 would touch those scenes and tests.

### 2. Global skill location: `~/.agents/skills`

The Codex skills docs list `$HOME/.agents/skills` as the `USER` scope (alongside
`$CWD/.agents/skills`, `$REPO_ROOT/.agents/skills`, `/etc/codex/skills` and
bundled `SYSTEM` skills). Codex detects new skills automatically; restart only if
one does not appear.

Caution: the built-in `$skill-installer` defaults to `$CODEX_HOME/skills`
(`~/.codex/skills`), which the current docs do not list. Instructions must pass
`--dest ~/.agents/skills` (on Windows, `%USERPROFILE%\.agents\skills`) so the
skill lands in the documented global location.

### 3. Install method that needs no Node.js

| Method | Needs | Verdict |
|---|---|---|
| `$skill-installer` with `--url https://github.com/pbakaus/impeccable/tree/<tag>/.agents/skills/impeccable --dest ~/.agents/skills` | Python (Codex's bundled runtime ships one under `~/.cache/codex-runtimes/.../dependencies/python`), network | Recommended. Built into Codex, pin-able to a tag, no Node. |
| `npx impeccable install --providers=codex --scope=global` | Node.js | Not for Module 2: Node is only checked in Module 3. |
| Manual ZIP from impeccable.style | Browser, file manager | Fallback if the installer fails. |

The upstream repo keeps the Codex-ready folder at `.agents/skills/impeccable`
(same layout as the untracked copy in this repository).

Not yet verified: that a fresh Codex install on macOS and Windows exposes the
bundled Python to the agent's shell. This machine has `/usr/bin/python3` and Xcode,
so it cannot show the fresh-machine case.

### 4. Sandbox behaviour (tested with `codex sandbox -P :workspace`)

Inside the default workspace sandbox:

- network: blocked (`curl` exit 6);
- write to `~/.agents/skills`, `~/.codex/skills`, `~/.impeccable/bin`: denied;
- write inside the workspace: allowed.

So both the skill install and Impeccable's first-run engine download need an
escalation. Under **Approve for me**, Codex will stop or auto-review and the
learner may see an approval prompt. That is expected and should be explained
beforehand, not treated as an error.

### 5. First-run engine download and fallback

The skill's launcher downloads a verified engine binary from GitHub releases into
`~/.impeccable/bin/<version>/` on first use. Simulating a fresh machine inside the
sandbox produced:

```text
impeccable: could not download engine 0.1.25 from https://github.com/pbakaus/impeccable/releases/download/engine-v0.1.25/impeccable-darwin-arm64; check network access, ...
exit=127
```

The skill's own instructions say that when the launcher fails, the agent reads
existing context files directly and continues, so a failed download does not block
the prototype. The `AGENTS.md` guidance should still tell Codex to request
network approval for the first run and, if it fails, continue without it.

### 6. License and version

- License: Apache-2.0. Impeccable began from Anthropic's `frontend-design`
  skill.
- Latest upstream tags: `skill-v4.10.0` and `engine-v0.1.28` (18 November 2026).
- The untracked copy in this repository is skill 4.9.2 / engine 0.1.25 and has
  local edits in `SKILL.md` core principles (subtext and eyebrow rules). Learners
  installing from upstream will not get those edits.

## Constraints for Phase 3 (Practice guidance)

- Global install means **no change** to `portfolio-package-evidence.ts`, the
  Practice version or the scope check, provided Impeccable writes nothing into the
  portfolio folder. Its `init` writes `PRODUCT.md` and other commands may write
  `DESIGN.md`; both would fail `scope-control-clean`. The `AGENTS.md` template
  must tell Codex not to run `init` or write those files in Module 2 and to use
  the brief and `reference.md` as product context.
- `shape` asks two or three questions per round; the template's step 3 rule of
  one question per turn must take precedence.
- Before installing, Codex must explain: what Impeccable is, that it goes to the
  global skills folder (like global `AGENTS.md`), and that Codex will ask for
  internet and write permission. The owner later chose no yes/no question: Codex
  presents it as a widely trusted design skill and installs it.
- The prototype requirement and review criteria stay as they are; using the
  skill is not assessed, and a refused permission or failed install does not
  block the prototype.

## Implemented after this spike

Phases 2 and 3 added the lesson page and the step 3 install guidance. See the
"Impeccable skill in Module 2" entry in
[portfolio-course-implementation-plan.md](portfolio-course-implementation-plan.md).

## Open questions for the owner

1. Impeccable replaces `frontend-design` in Module 1, or both stay?
2. A Windows check (`impeccable.cmd`, `%USERPROFILE%\.agents\skills`, bundled
   Python) needs a Windows machine; run it before pilot.
