# Module 1 Practice video guide and learner confirmation

Date: 15 November 2026

Status: Owner approved the design and immediate implementation on 15 November
2026, with no further confirmation. During production the owner explicitly
requested replacing the existing interactive Practice guide entirely with this
video. Implementation and media production are complete; video-specific
verification passed, including the final combined unit/build/Electron checks.
Final learner/video acceptance remains separate from technical checks. The owner
subsequently found the delivered guide insufficient and requested the full
desktop revision below; the original media is not an accepted final guide.

## Requested concise edit — 15 November 2026

Status: `implemented`, verification `passed` for main behavior. The owner rejected the prominent
chapter/wait banners and slow camera movement, then explicitly requested a
2–3 minute guide. Version `1.2.0` supersedes the duration and camera choices below:
retain the real desktop workflow, use stationary wide views and contextual
highlights, remove both top banners, and shorten the narration and waiting.
Retain embedded captions, the four settings, task recovery, hints, window
controls, a genuine correction/pass, replay/resume and saved course return.
Main playback/gate checks remain the final technical acceptance scope; the owner
will review the visual UI. No additional approval pause is required.

The final version is 157.879667 seconds (2:38), with 12 concise narration chapters
and 30 caption cues. The opening/replay retakes show the shorter guide. Full
decoding, script/caption integrity, build/typecheck, lint, 29 focused tests and
actual full-video Electron playback/confirmation/handoff passed. Evidence stays
under `.superpowers/qa/practice-desktop-v2/short-*`. Visual owner acceptance is
pending; the historical broader v1 suite was not repeated for this media edit.

## Historical full-desktop revision — 15 November 2026

Status: `implemented`; version `1.1.0` is bundled and main verification
checks `passed`. The owner requested main-behavior verification and will
perform visual UI review; do not add another UI approval pause.
The watch-to-end and explicit-confirmation implementation remains verified.

Start with the actual click on **Chuyển sang Codex để thực hành** and show its
real resulting screen. Follow one complete Module 1 attempt, with the native
Codex chat and windowed Teacher visible together. Keep the full window chrome,
task name, composer and Teacher position recognizable. Demonstrate each action
before explaining the next one. No opening slide should postpone this first
view. Do not substitute isolated screenshots or a recreated Codex interface.

Use short zooms onto the actual target and return to the wide view after each
action. Highlight one control at a time. Burn natural Vietnamese captions into
the movie so the instructions remain visible without enabling a caption track.
Retain the accessible transcript and optional external captions, avoiding two
simultaneously enabled caption layers. Let the complete workflow determine the
duration; do not compress it to the original 2:41 target.

The shot-by-shot narration and recording requirements are in
`scripts/practice-desktop-video-storyboard.json`. It covers the handoff and
manual confirmation/start, full desktop orientation, Teacher movement and
window modes, exact task recovery and the initially blank chat, next step and checklist,
hints, each native setting menu, a genuine first review with one deliberate
Effort mismatch, correction in the same task, fresh passing review, replay and
resume, and the actual saved return to the next course scene. Observe installed
Codex controls before recording; reconcile label/behavior differences before
publishing. Do not claim simulated review output is live evidence.

Use a disposable Course Companion profile and a dedicated demo Codex chat with
no personal account history visible. Automatic approval review rejected capture
of the existing signed-in window because it contains private conversations
outside the recording scope. A separate Chromium/Codex-home profile still loads
account history and is not safe to record. A clean user-prepared demo window has
been provided by the owner. The final sources record only that separate native
demo window and disposable Course Companion windows through Windows Graphics
Capture, excluding other applications and the private window. Desktop-capture
experiments are excluded. The real demo completed a Medium → High correction,
fresh passing review and saved return. The speech-service interruption was
resolved with the Vietnamese Nam Minh voice. The local video is approximately
5:01 (301.545333 seconds), with 12 narration chapters and 55 embedded caption
cues. Full decoding, caption/script integrity, build/typecheck, lint, 29 focused
tests and actual full-video Electron playback/confirmation/handoff checks passed.
The first long run paused without a decoding or renderer error; a diagnostic
rerun passed without a production change. Final visual review remains with the
owner; the broader historical v1 suite was not repeated for this media revision.

On completion, replace the existing media, poster, captions and transcript;
publish version `1.1.0` with its measured duration. The existing per-version gate
will require the revised introduction before the next Module 1 handoff. Verify
the whole movie, actual playback/confirmation and current Practice flow before
delivery. Keep original technical evidence below as historical v1 evidence.

## Requested outcome

Add an easy-to-understand video of the main Practice features and workflow to
the existing Module 1 page where the learner switches to Codex. The learner
watches the complete video and explicitly confirms readiness before continuing.

The user delegated the choice of story and presentation. Use natural Vietnamese
and a simple example: Minh opens the first Practice, checks the linked Codex
task, encounters one incorrect setting, uses a hint, fixes it and returns after
a successful review. Watching the example never completes the learner's work.

## Approach and alternatives

Recommended: a bundled, approximately three-minute screen walkthrough with
Vietnamese narration and synchronized captions. Show the real Practice UI in
a disposable demonstration profile, with deliberate zooms and one highlighted
action at a time. Bundle the media locally so playback needs no account,
internet connection or external video service.

A captions-only screen walkthrough needs less media production but makes the
learner read while locating controls. A clickable tour is easier to update and
already exists after entering Practice, but does not provide the requested
video. The owner subsequently selected replacing that tour entirely; provide
video replay from the Practice panel instead.

## Placement and page behavior

Use the existing Module 1 Practice introduction in `PracticeBrief.tsx`, for
`m1-codex-safe-setup`. Place the video after the three existing instructions and
before the start/resume controls. Keep all existing surrounding text verbatim,
including the title, instructions, settings disclosure and button labels.

Add the heading **Xem cách thực hành cùng Codex và Triết** and the instruction
**Xem hết video, sau đó xác nhận để bắt đầu thực hành.** Display a poster,
elapsed/total duration, pause/resume, replay, volume, fullscreen and captions.
Do not autoplay. Keep an accessible transcript in an expandable section.

Before confirmation, keep start and resume visible but disabled with an adjacent
explanation of what unlocks them. Keep closing the page and returning to lessons
available. Closing does not grant confirmation. Reopening restores saved viewing
progress. Existing Practice/task/history must remain intact.

After full playback, enable the separate confirmation action:

**Tôi đã xem hết và hiểu cách thực hành**

Confirming saves the introduction receipt and unlocks the existing start/resume
action; it does not open Codex automatically. The learner chooses that action
when ready. The video remains replayable after confirmation.

## Viewing and confirmation rules

- Require playback of the complete timeline, followed by explicit confirmation.
  Reaching an `ended` event or seeking to the end alone is insufficient.
- Allow pause, backward seeking and review of already watched portions. Prevent
  forward seeking from skipping unwatched material. Normal playback speed
  controls may remain available; count media coverage rather than imposing a
  separate wall-clock timer.
- Pause when the page is closed, unmounted or the application window becomes
  hidden. Do not credit time while paused, buffering or hidden.
- Save viewing coverage/position and confirmation through Electron-owned
  application-data persistence, keyed by current course run, Practice identity
  and video version. Do not use browser localStorage or repository files.
- Require the video once per course run and video version, rather than every
  time the learner reopens Practice. A new Practice attempt in the same course
  run does not erase the introduction receipt.
- Existing learners without a receipt watch before the next Module 1 start or
  resume action from this page. Do not cancel, replace or reset their task.
- On receipt-load failure, keep the handoff locked and offer retry. On save
  failure, preserve the completed viewing state and retry confirmation without
  requiring another full viewing in that session.
- On media failure, show a clear playback error and retry. The transcript helps
  understanding but does not silently bypass the requested video requirement.
- Enforce the receipt in the Module 1 start/resume action path as well as its
  visible controls. Keep other modules and their existing gates unchanged.
- Watching and confirming is an introduction gate, never evidence of Practice
  mastery, a passed Teacher review or learner approval of unrelated actions.

## Storyboard and narration

Original target: about three minutes, adjusted to natural narration and readable
holds. Delivered duration: 2:41 (161.302333 seconds). The timestamp ranges below
are storyboard estimates; the shipped captions use the actual speech timing.
Split long narration into short synchronized caption cues. Keep captions clear
of the highlighted control. Use a brief **Ví dụ minh họa** label at the opening;
the demonstration is separate from the learner's live progress.

### 1. Understand the three roles — 0:00–0:20

Show the introduction and a simple sequence: lesson → linked Codex task → Triết
review → lesson. Narration:

> Đây là Minh, lần đầu làm Practice. Bạn sẽ làm giống Minh: nhận mục tiêu từ
> bài học, thực hành trong Codex, rồi nhờ Triết kiểm tra. Task là cuộc trò
> chuyện Codex dành riêng cho bài này. Bạn quyết định và thực hiện; Triết giúp
> bạn biết phần nào đã đúng và bước nào cần làm tiếp.

### 2. Open and recognize the correct task — 0:20–0:45

Show the four-setting reference, **Bắt đầu thực hành**, the linked task name,
the Teacher bubble/panel and **Mở lại task Codex**. Narration:

> Sau video, bạn xác nhận đã hiểu rồi bấm Bắt đầu thực hành. Ứng dụng mở và
> liên kết task Codex của bài. Hãy làm trong đúng task này. Nếu lạc sang cửa sổ
> khác, chọn Mở lại task Codex. Khi quay lại bài đang làm, chọn Tiếp tục
> Practice để giữ nguyên công việc.

### 3. Check the four required settings — 0:45–1:25

Show each actual setting control and its required value, one at a time. Use the
installed Codex interface for the recording; verify visible control locations
before recording rather than inventing menu paths. Narration:

> Module 1 yêu cầu bốn cài đặt. Model do bạn tự chọn và không dùng để đánh giá.
> Effort là mức độ suy luận: chọn High. Speed là chế độ tốc độ:
> chọn Standard. Approval là cách xử lý yêu cầu phê duyệt: bài này dùng Approve
> for me. Giữ Full access ở trạng thái tắt. Kiểm tra từng mục trong task đang
> liên kết; nếu đã đúng thì giữ nguyên. Bạn không cần viết ứng dụng ở bước này.

Hold the final four-value checklist long enough to read. These values belong
to this repository's existing Practice definition, not a general recommendation
for every Codex task.

### 4. Use the Practice controls and help — 1:25–1:55

Show opening the Teacher panel, expanding/minimizing it, the next action,
progress count, expandable steps and hint button. Show video pause and replay
in place of the retired interactive tour. Narration:

> Mở Triết để xem bước tiếp theo và tiến độ. Bạn có thể thu nhỏ thành bong
> bóng, mở lại hoặc mở toàn màn hình. Mở danh sách các bước khi cần xem chi
> tiết. Nếu chưa biết làm gì, bấm Cần gợi ý?, rồi thực hiện gợi ý trong Codex.
> Trong Practice, bạn trao đổi công việc với Codex; Triết hỗ trợ bằng gợi ý và
> duyệt kết quả. Video hướng dẫn này có thể tạm dừng và xem lại ngay trong Practice.

### 5. Review, understand feedback and repair — 1:55–2:40

Show **Cập nhật và kiểm tra tiến độ**, a single mismatch (Effort differs), its
actionable feedback, correction in the same linked task and fresh review.
Briefly show how unavailable evidence differs from an incorrect value.
Narration:

> Khi đã kiểm tra xong, bấm Cập nhật và kiểm tra tiến độ. Triết đọc bốn cài đặt cần kiểm tra
> từ đúng task; bạn không cần gửi ảnh chụp hay viết báo cáo. Ví dụ, Effort của
> Minh chưa phải High nên kết quả còn mục cần bổ sung. Minh sửa đúng mục đó
> trong cùng task, rồi bấm kiểm tra lại. Nếu thấy Chưa thể xác minh, hãy mở lại
> đúng task và thử cập nhật; điều đó chưa có nghĩa là bạn làm sai. Đọc bước
> tiếp theo và dùng gợi ý nếu vẫn còn vướng.

### 6. Save the passed result and return — 2:40–3:00

Show a genuinely simulated **passed** state in the isolated demonstration,
then **Lưu kết quả và quay lại khóa học**, returning to the real Module 1
destination. Narration:

> Khi tất cả yêu cầu đã đạt và nút quay lại được mở, chọn Lưu kết quả và quay
> lại khóa học. Kết quả được lưu và bạn đến phần tiếp theo của Module 1. Nếu
> bạn đổi cài đặt sau khi đã duyệt, hãy kiểm tra lại kết quả hiện tại trước
> khi quay về.

### 7. Recap and learner readiness — 3:00–3:15

Show four short actions: **Đúng task → Kiểm tra cài đặt → Nhờ Triết duyệt →
Lưu và quay lại**. Narration:

> Bạn chỉ cần nhớ: làm trong đúng task, xem bước tiếp theo, sửa theo góp ý và
> nhờ Triết kiểm tra lại. Bây giờ, hãy xác nhận bạn đã hiểu. Khi sẵn sàng, bấm
> Bắt đầu thực hành để tự làm bài của mình.

## Content authority and preservation

A concurrent task changed the shared runtime during production: Model is freely
chosen and four settings are required. The video follows those current
requirements; this task does not implement or reverse that separate policy.

The running app and its renderer tests currently use direct linked-task
configuration metadata. The Pilot JSON still describes two screenshots and a
Verification report. The existing October design explicitly records that
historical mismatch and excludes reconciliation from presentation work. This
video follows the current working app and does not reintroduce those obsolete
requirements or alter source curriculum as an incidental cleanup.

Keep every existing scene, navigation target, checklist item, linked-task
constraint, evidence freshness requirement, hint behavior, review retry and
reviewed course-return gate. Replace the existing interactive guide with video
replay in the Practice panel, as explicitly requested by the owner. Preserve
legacy guide history without showing the old tour. No learner settings are
changed by the video.

## Implementation boundaries after approval

Use a focused video component inside the Module 1 introduction and scoped
responsive styles. Add only the typed preload/IPC and recoverable repository
operations needed for viewing progress and the confirmation receipt. Bind
operations to the current course run in the main process; reject stale or
wrong-version receipts. Keep recording/render scripts reproducible and separate
from shipped media. Add a media source note and synchronized caption/transcript
assets. Never ship demonstration learner profiles, task history or QA receipts.

Do not add a hosting service, account, analytics, dependency or paid media
generation service merely for this feature. A narration failure must be
reported rather than silently replacing the agreed narrated video with slides.

## Verification and delivery

Use focused behavioral checks for watch completion, seek-ahead attempts,
pause/visibility changes, explicit confirmation, reopen/restart persistence,
receipt/version isolation and failed media or persistence operations. Exercise
the actual Module 1 start/resume actions and preserve unrelated active-Practice
switch confirmation. Watching alone must never start or complete Practice.

In a disposable Electron profile, verify real video playback, readable captions,
keyboard controls, confirmation followed by manual handoff, and the existing
review/fix/return cycle. Inspect desktop and narrow layouts for reachable
controls, usable scrolling and no horizontal overflow. Decode the final media
with FFmpeg and review its full timeline for legibility and correct instructions.

Run required typecheck, lint, unit/startup, build and full Electron checks once
after the coherent implementation batch. Review all scoped changes and page
inventory. Update the Foundation / I4 Practice presentation ledger with actual
implementation and verification evidence; keep owner visual acceptance and
beginner-pilot/native-platform acceptance separate. No progress-reset or live
learner profile is permitted for recording or verification.

## Design review checklist

- [x] Inspect repository guidance, handoffs, current Practice and learner needs.
- [x] Consider video and tour alternatives; recommend narrated local video.
- [x] Specify the story, exact new copy, viewing gate and recovery behavior.
- [x] Check scope, preserved copy/routes and historical-contract mismatch.
- [x] Owner approves this design and storyboard.
- [x] Record the approved specification and prepare the implementation plan.
- [x] Produce the video, implement the gate and verify the complete video workflow.

The final combined Electron run passed. See the Foundation / I4 ledger for
verification evidence and the next permitted action; no learner or overall
course acceptance is inferred.

Self-review: The design covers full playback and a separate confirmation,
keeps Practice assessment independent, specifies the resume policy and failure
states, and supplies a complete narration draft. Runtime implementation and
media production were explicitly approved; the later request replaces the old
interactive guide entirely. No further approval is needed for this scope.
