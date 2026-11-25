# Open Course Companion for a learner

Use this guide for “Mở khóa học giúp mình”, “Open my course”, or first-time
setup. The learner works in Vietnamese. Handle setup yourself and keep replies
short. Check both the learning window and the Codex connection needed for Practice.

## Find the course

1. Use the selected folder if it contains this guide and both launchers. Also
   check for an existing course checkout immediately inside it. Reuse it.
2. For a first download, use the official repository from the learner's prompt:
   `https://github.com/thelearningest/Vibe-coding-101.git`. Clone
   into the selected empty folder, or a new child folder if it contains other
   work. Leave existing files, versions and learning progress intact.

## Prepare the machine

The first-time README prompt authorizes the course download and tools required
to run it. Honor any narrower instructions from the learner. A plain “open”
request can launch an installed course. If setup requires an install and consent
is missing, describe the missing tools and ask once in chat. Honor any Codex or
operating system permission dialog. The learner enters their own password.

Check the OS, Git (if cloning), Node.js and npm. Node must be 22.12 or newer.

- On macOS, if Git is needed, request Apple's installer with
  `xcode-select --install`. If Node is missing or too old and Homebrew is
  already available, install `node@24` with the learner's consent and prepend
  its bin directory to PATH for this launch. Otherwise open the official
  macOS LTS installer page at https://nodejs.org/en/download. Tell the learner
  which installer action needs their input, then recheck and resume.
- On Windows, use `winget install --id Git.Git -e` if Git is needed. If winget
  is unavailable, open the official installer at https://git-scm.com/download/win.
  The Windows launcher handles missing Node with winget. If it reports winget
  is unavailable, guide the learner through the official Node.js LTS installer.
  Refresh the command environment after installation if necessary. When using
  Codex Desktop, preserve its `CODEX_APP_RUNTIME_CLI_PATH`. If it is unset
  and the CLI is missing from PATH, check the installed OpenAI.Codex Appx
  package for `app/resources/codex.exe` and pass that existing executable in
  the launch environment.

## Launch from the course root

Run the matching command directly in your command tool. Use the desktop
permissions required to open a GUI. Leave the command running through the
build and wait for its result.

| Platform | Open | Open with the learner's install consent |
| --- | --- | --- |
| macOS | `./start-course.command --agent` | `./start-course.command --agent --install` |
| Windows | `.\start-course.cmd --agent` | `.\start-course.cmd --agent --install` |

The last column authorizes only the launcher's course setup plan. There is no
Terminal question. After a successful launch the command exits and the app
stays open. Repeating it restores the existing learning window for this profile.

Wait for the command to finish and read both results. `COURSE_WINDOW_VISIBLE`
confirms the lessons are open. `COURSE_PRACTICE_RUNTIME` is a JSON result from
the running Course Companion and reports the status of the Codex CLI it would
use for Practice.

- With `ready` and a visible window, tell the learner in chat that they can
  start learning and that the Codex version check for Practice passed.
- With `outdated`, report that the lessons are open and Practice needs an
  update. Use `version`, `requiredVersion`, and `source` to identify the right
  update. Update Codex for `codex-desktop` or ChatGPT for `chatgpt-desktop`.
  For `inherited` or `standalone`, identify the selected installation before
  choosing how to update it. Updating another copy may leave the result unchanged.
- With `missing`, help the learner get a compatible Codex installation. With
  `unverified`, inspect the selected installation before choosing a recovery
  step. With `unknown` or a missing readiness result, report that the version
  could not be checked. If an older Course Companion instance is still running,
  ask the learner to close and reopen it when convenient.

Give setup feedback in chat. The learner may already be using the course window
and may never see the launcher output. If fixing Codex requires an install,
update, or a click in another app, follow the learner's consent and ask for
only the action that needs their input. After the fix, rerun the same launcher
and confirm the version check passed only after it reports `ready`. If the
learner defers the fix, tell them they can start the lessons.

If the launcher fails to open the window, read its output yourself, address the
named cause and retry. After two failures at the same step, report the specific
error in plain Vietnamese.

Keep work scoped to setup. Do not edit course files, change pinned packages,
reset progress, or teach a lesson during launch.
