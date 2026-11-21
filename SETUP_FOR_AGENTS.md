# Course setup for coding agents

Use this file when a learner asks you to install, start or open the course
(for example "start", "bắt đầu", "mở khóa học"). The learner is not technical.
Your only goal is to open Course Companion. Do not teach lessons here.

## Rules

- Speak Vietnamese with full diacritics. One step per message, short sentences.
- Ask before every install, download or command that changes the machine.
  Version checks may run after one combined explanation.
- Do not edit course files, change versions, run `npm audit fix`, update
  packages, or read contributor documents (`docs/planning/`, handoffs).
- Do not reset or delete Course Companion progress.
- Do not run installers yourself or type passwords. The learner clicks the
  installer and enters their own password.
- If a step fails twice, stop, show the exact error and the step name, and
  suggest sending them to the course support contact.

## Step 1 — Explain

Say: "Mình sẽ kiểm tra máy đã có Git và Node.js chưa, tải khóa học, rồi mở
ứng dụng học Course Companion. Khi cần cài thêm, mình sẽ hỏi bạn trước.
Codex có thể hiện nút xin quyền chạy lệnh; bạn bấm đồng ý khi thấy lệnh đúng
như mình vừa nói."

## Step 2 — Check the machine

Detect the OS. Run `git --version`, `node --version`, `npm --version`.
Node must be 22.12 or newer (not just 22).

## Step 3 — Git missing

- macOS: ask, then run `xcode-select --install`. Say: "Một cửa sổ của Apple
  sẽ hiện ra. Bấm Cài đặt và chờ xong (có thể mất 10–20 phút). Xong thì báo
  mình." Wait, then check again.
- Windows: ask, then run `winget install --id Git.Git -e`. If winget is
  missing, open https://git-scm.com/download/win and guide the learner.
  Ask them to reopen Codex afterwards if `git` is still not found.

## Step 4 — Node.js missing or older than 22.12

- macOS: open https://nodejs.org/en/download. Say: "Tải bản LTS cho macOS
  (tệp .pkg), nhấp đúp để cài và nhập mật khẩu máy khi được hỏi. Xong thì báo
  mình." Check again.
- Windows: skip; `start-course.cmd` offers the installation itself.

## Step 5 — Get the course

If this folder does not contain `start-course.command`, ask, then run
`git clone https://github.com/DiligentPenguinn/Codex-agentic-coding-course.git`.
Use the cloned folder from now on. Never download the ZIP.

## Step 6 — Open Course Companion in its own window

Do not run the launcher inside your own command tool. It asks a question you
cannot answer and the app would close when your command ends.

- macOS: `open -a Terminal "<course folder>/start-course.command"`
- Windows: `start "" "<course folder>\start-course.cmd"`

Say: "Một cửa sổ Terminal vừa mở. Khi thấy câu hỏi có [y/N], gõ y rồi nhấn
Enter. Lần đầu mất khoảng một đến vài phút. Đừng đóng cửa sổ Terminal đó khi
đang học, vì ứng dụng sẽ tắt theo."

## Step 7 — Confirm and hand over

Ask the learner whether the Course Companion window is open. If yes, say:
"Course Companion đã mở. Từ giờ bạn học trong ứng dụng đó. Lần sau, chỉ cần
nhấp đúp start-course.command trong thư mục khóa học."
If not, ask them to paste the last lines of the Terminal window, and explain
the error in plain Vietnamese.
