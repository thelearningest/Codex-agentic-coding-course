"""Record explicitly selected demo windows with Windows Graphics Capture.

Uses isolated authoring dependencies; never captures the monitor or enumerates
other windows. Select HWNDs using the Computer Use inventory before invocation.
Teacher is a second live source, composited over the full Codex window like OBS.
No input, focus changes, private-window manipulation or profile access occurs.
"""
import argparse
import ctypes
from pathlib import Path
import subprocess
import sys
import threading
import time
from ctypes import wintypes

ROOT = Path(__file__).resolve().parent.parent
SCRATCH = ROOT / '.superpowers/qa/practice-desktop-v2'
sys.path.insert(0, str(SCRATCH / 'capture-libs'))
import cv2
import numpy as np
from windows_capture import WindowsCapture
cv2.setNumThreads(1)


def bounds(handle):
    rect = wintypes.RECT()
    if ctypes.windll.dwmapi.DwmGetWindowAttribute(handle, 9, ctypes.byref(rect), ctypes.sizeof(rect)):
        raise RuntimeError('Cannot read the selected demo window bounds')
    return rect.left, rect.top, rect.right-rect.left, rect.bottom-rect.top


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--window', required=True, type=int)
    parser.add_argument('--teacher', type=int)
    parser.add_argument('--seconds', type=float, default=45)
    parser.add_argument('--output', required=True)
    parser.add_argument('--probe', action='store_true')
    args = parser.parse_args()
    output = (SCRATCH / args.output).resolve()
    if not output.is_relative_to(SCRATCH.resolve()):
        raise ValueError('Recording output must remain in the ignored recording directory')
    handles = {'base': args.window}
    if args.teacher:
        handles['teacher'] = args.teacher
    frames, controls, captures, lock = {}, [], [], threading.Lock()
    for name, handle in handles.items():
        capture = WindowsCapture(window_hwnd=handle, cursor_capture=True, draw_border=True,
                                 secondary_window=True, minimum_update_interval=100)

        def frame_arrived(frame, control, key=name):
            with lock:
                frames[key] = frame.frame_buffer.copy()

        capture.frame_handler = frame_arrived
        capture.closed_handler = lambda: None
        controls.append(capture.start_free_threaded())
        captures.append(capture)
    deadline = time.monotonic() + 12
    while 'base' not in frames and time.monotonic() < deadline:
        time.sleep(.05)
    if 'base' not in frames:
        raise RuntimeError('Selected demo window supplied no frames; no desktop fallback is permitted')
    if args.teacher:
        deadline = time.monotonic() + 2
        while 'teacher' not in frames and time.monotonic() < deadline:
            time.sleep(.05)
    fps, width, height = 10, 1920, 1080
    encoder = None
    if not args.probe:
        encoder = subprocess.Popen(['ffmpeg', '-hide_banner', '-loglevel', 'warning', '-y',
            '-use_wallclock_as_timestamps', '1', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{width}x{height}', '-r', str(fps), '-i', 'pipe:0',
            '-an', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '18', '-threads', '2', '-pix_fmt', 'yuv420p',
            '-fps_mode', 'vfr', '-movflags', '+faststart', str(output)], stdin=subprocess.PIPE,
            creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
    start = time.monotonic()
    print(f'Recording selected demo HWND {args.window}; Teacher {args.teacher}; output {output.name}', flush=True)
    try:
        index = 0
        while (args.probe and index == 0) or (not args.probe and time.monotonic()-start < args.seconds):
            with lock:
                base = frames['base']
                teacher = frames.get('teacher')
            # Preserve the windows' actual positions in the known recording area.
            # The neutral background replaces other applications, never their UI.
            sources = [('base', base)]
            if teacher is not None and ctypes.windll.user32.IsWindowVisible(args.teacher):
                sources.append(('teacher', teacher))
            canvas_height = max(1128, *(bounds(handles[name])[1]+bounds(handles[name])[3] for name, _ in sources))
            canvas = np.full((canvas_height, 1920, 3), 25, dtype=np.uint8)
            for name, pixels in sources:
                x, y, sw, sh = bounds(handles[name])
                overlay = cv2.resize(pixels, (sw, sh))
                left, top, right, bottom = max(0,x), max(0,y), min(1920,x+sw), min(canvas_height,y+sh)
                if right <= left or bottom <= top:
                    continue
                overlay = overlay[top-y:bottom-y, left-x:right-x]
                target = canvas[top:bottom, left:right]
                if name == 'base':
                    target[:] = overlay[:, :, :3]
                else:
                    alpha = overlay[:, :, 3:4].astype(np.float32)/255
                    if alpha.max() == 0:
                        alpha = np.ones_like(alpha)
                    target[:] = overlay[:, :, :3]*alpha + target*(1-alpha)
            canvas = cv2.resize(canvas, (width, height))
            if args.probe:
                cv2.imwrite(str(output), canvas)
            else:
                encoder.stdin.write(canvas.tobytes())
                remaining = start + (index+1)/fps - time.monotonic()
                if remaining > 0:
                    time.sleep(remaining)
            index += 1
    finally:
        for control in controls:
            control.stop()
        if encoder:
            encoder.stdin.close()
            if encoder.wait(timeout=30):
                raise RuntimeError('Recording encoder failed')
    print(f'Finished {output.name}', flush=True)


if __name__ == '__main__':
    main()
