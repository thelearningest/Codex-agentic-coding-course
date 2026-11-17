# Module 1 Practice walkthrough · version 1.2.0

The 2:38 Vietnamese guide (157.879667 seconds) meets the owner's 2–3 minute
target and replaces the first slideshow-style video and the retired interactive
Practice tour. It starts at the actual **Chuyển sang
Codex để thực hành** action, then shows the native Codex task and windowed
Teacher together, the four settings, checklist, hints, review/correction, window
controls, replay/resume and the saved return to the next lesson.

## Recorded sources

Codex footage comes from a dedicated demonstration chat in the installed Windows
application. Course Companion uses disposable recording profiles and copies of
the blank Pilot workspace. Its Codex gateway is real. The central Medium → High
correction, fresh passing review of all four requirements, and saved course
return were recorded from the same bound demonstration task. No passing verdict
was seeded or substituted. Model remains freely chosen.

Recordings use [Windows Graphics Capture](https://github.com/NiiightmareXD/windows-capture/tree/main/windows-capture-python)
through windows-capture 2.0.1, targeted only to the selected demo windows. The two
live sources retain their actual positions against a neutral background; other
applications and private chats are excluded. Account avatars are covered.
The actual menus show the effort slider, Fast/Standard lightning
toggle and permissions selection, including Full access remaining unselected.

Authoring retakes use disposable course state. The opening omits waiting through
the entire guide itself before demonstrating the
separate confirmation and start actions. This recording-only receipt is not a
production bypass. The main playback test starts without a receipt and watches
actual media. Raw takes, profiles, intermediate audio and diagnostics stay in
ignored QA or operating-system temporary directories and are never shipped.

## Narration and editing

The original script and shot list are in
`scripts/practice-desktop-video-storyboard.json`. Speech uses vi-VN-NamMinhNeural
through [edge-tts](https://github.com/rany2/edge-tts) 7.3.1. Only the original
narration text was submitted for synthesis. Cached word boundaries must match
the current script exactly. Audio is normalized to -18 LUFS and a -2 dB
true-peak target. There is no music or stock footage.

The desktop remains stationary, with individual gold highlights directing
attention. The slow animated zooms and top chapter/wait banners were removed at
the owner's request. The narration was shortened rather than sped up.
Thirty Vietnamese caption cues are embedded and limited to two lines. Optional WebVTT
remains available; an extra caption overlay is disabled by default. The transcript
is retained as authoring source and is not displayed in the player. Window controls follow the successful review to preserve the recorded
progress sequence. Replay/resume illustrates the conditional unfinished case.

## Reproduction and main checks

Build Course Companion, prepare disposable recording data, and select safe
window handles through Computer Use. The scripts never fall back to capturing
the monitor. From the repository root:

```powershell
node scripts/prepare-practice-desktop-recording.mjs
python scripts/record-practice-windows.py --window DEMO_HWND --teacher TEACHER_HWND --seconds 60 --output take.mp4
python scripts/render-practice-desktop-video.py --narration-only
python scripts/render-practice-desktop-video.py --edit scripts/practice-desktop-video-edit.json
```

FFmpeg, Pillow, edge-tts, windows-capture, NumPy and OpenCV are authoring tools,
not application dependencies. Raw takes are intentionally not shipped. The edit
recipe records their trims, camera moves, masks and highlights. The legacy
create-practice-video.py command refuses to overwrite this version; its shared
speech helpers remain in use by the desktop renderer.

The shared manifest holds the measured duration and version. The final file is
1920 × 1080 H.264/AAC with 30 fps output. Main verification covers full decoding,
caption/script integrity and actual Electron playback, seek blocking, saved
progress, explicit confirmation and handoff. The owner requested main-behavior
checks and will perform visual UI review; technical checks do not establish
owner acceptance or learner-pilot acceptance.
