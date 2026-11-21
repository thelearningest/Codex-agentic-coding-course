#!/bin/zsh

set -u

COURSE_ROOT="$(cd -- "$(dirname -- "$0")" && pwd -P)"
STARTUP_SCRIPT="$COURSE_ROOT/scripts/macos-course-startup.mjs"

if [[ "$(uname -s)" != "Darwin" ]]; then
  print -u2 "Trình khởi động này chỉ dành cho macOS."
  print -u2 "Trên Windows, hãy chạy start-course.cmd."
  exit 3
fi

if ! command -v node >/dev/null 2>&1; then
  print -u2 "Máy chưa có Node.js 22.12 trở lên. Node.js là phần mềm cần để chạy ứng dụng học."
  print -u2 "Trang tải Node.js vừa được mở. Tải bản LTS cho macOS (tệp .pkg), nhấp đúp để cài, rồi chạy lại start-course.command."
  open "https://nodejs.org/en/download" >/dev/null 2>&1
  exit 3
fi

exec node "$STARTUP_SCRIPT" "$@"
