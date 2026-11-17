"""Build the original Vietnamese Practice walkthrough from isolated UI captures.

Preparation: node scripts/capture-practice-video.mjs
Narration: python scripts/create-practice-video.py --narration-only
Render: python scripts/create-practice-video.py
Needs FFmpeg, Pillow and edge-tts 7.3.1+ for production only, never at runtime.
Set PRACTICE_VIDEO_PYTHON_LIBS to an isolated package directory when needed.
"""
import argparse
import asyncio
import json
import math
import os
from pathlib import Path
import re
import subprocess
import sys
import textwrap

ROOT = Path(__file__).resolve().parent.parent
SCRATCH = ROOT / '.superpowers/qa/practice-video'
LIBS = os.environ.get('PRACTICE_VIDEO_PYTHON_LIBS', str(SCRATCH / 'python-libs'))
if Path(LIBS).is_dir():
    sys.path.insert(0, LIBS)
from PIL import Image, ImageDraw, ImageFont, ImageOps

OUT = ROOT / 'course-companion/src/renderer/src/assets/practice-video'
CAPTURES = SCRATCH / 'captures'
SPEC = ROOT / 'docs/superpowers/specs/2026-11-15-module-1-practice-video-guide-design.md'
VOICE = 'vi-VN-HoaiMyNeural'
W, H = 1920, 1080
CREAM, MUTED, GOLD = '#f5f0e5', '#c1b9a7', '#e7be69'

CHAPTERS = [
    ('Một vòng Practice', 'Bạn làm trong Codex.\nTriết giúp bạn kiểm tra.', ['recap'], ['Bài học', 'Task Codex', 'Triết duyệt', 'Quay lại bài học']),
    ('Luôn làm trong đúng task', 'Task là cuộc trò chuyện\ndành riêng cho bài này.', ['practice-panel', 'full-panel'], ['Mở task đã liên kết', 'Giữ nguyên task khi sửa', 'Tiếp tục khi quay lại']),
    ('Kiểm tra bốn cài đặt', 'Model do bạn tự chọn.\nChưa cần viết ứng dụng.', ['model-settings', 'approval-menu'], ['Effort · High', 'Speed · Standard', 'Approval · Approve for me', 'Full access · Tắt']),
    ('Biết tìm trợ giúp', 'Một bước tiếp theo,\nmỗi lần thực hiện.', ['practice-panel', 'steps', 'hint', 'full-panel'], ['Thu nhỏ / mở toàn màn hình', 'Xem các bước chi tiết', 'Cần gợi ý?', 'Tạm dừng / xem lại video']),
    ('Chưa đạt? Sửa rồi kiểm tra lại', 'Giữ cùng task.\nChỉ sửa phần cần bổ sung.', ['needs-work', 'model-settings', 'full-panel'], ['Cập nhật và kiểm tra tiến độ', 'Đọc mục cần bổ sung', 'Sửa trong Codex', 'Nhờ Triết kiểm tra lại']),
    ('Lưu kết quả và quay lại', 'Chỉ quay về sau khi\nkết quả hiện tại đã đạt.', ['passed', 'return-to-course'], ['Nhìn kết quả Đã đạt', 'Lưu kết quả và quay lại', 'Tiếp tục phần tổng kết']),
    ('Đến lượt bạn thực hành', 'Xác nhận đã hiểu.\nBắt đầu khi bạn sẵn sàng.', ['recap'], ['Đúng task', 'Kiểm tra cài đặt', 'Nhờ Triết duyệt', 'Lưu và quay lại'])
]

def run(*args):
    return subprocess.check_output([str(a) for a in args], stderr=subprocess.STDOUT, creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))

def duration(path):
    return float(run('ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', path))

def narration():
    source = SPEC.read_text(encoding='utf-8')
    parts = re.split(r'^### [1-7]\. ', source, flags=re.M)[1:8]
    blocks = []
    for i, part in enumerate(parts):
        text = ' '.join(line[2:].strip() for line in part.splitlines() if line.startswith('> '))
        blocks.append({'title': CHAPTERS[i][0], 'text': text})
    assert len(blocks) == 7 and all(b['text'] for b in blocks)
    return blocks

async def synthesize(blocks):
    import edge_tts
    for i, block in enumerate(blocks):
        audio, boundary = SCRATCH / f'voice-{i}.mp3', SCRATCH / f'voice-{i}.json'
        if audio.exists() and boundary.exists():
            cached = json.loads(boundary.read_text(encoding='utf-8'))
            normalize = lambda text: re.findall(r'\w+', text.casefold())
            if normalize(' '.join(word['text'] for word in cached)) == normalize(block['text']):
                continue
        messages = []
        for attempt in range(3):
            try:
                with audio.open('wb') as stream:
                    async for chunk in edge_tts.Communicate(block['text'], VOICE, rate='-2%', boundary='WordBoundary', connect_timeout=12, receive_timeout=25).stream():
                        if chunk['type'] == 'audio':
                            stream.write(chunk['data'])
                        elif chunk['type'] == 'WordBoundary':
                            messages.append(chunk)
                assert audio.stat().st_size > 1000 and messages
                boundary.write_text(json.dumps(messages, ensure_ascii=False), encoding='utf-8')
                print(f'Narrated chapter {i + 1}: {duration(audio):.2f}s', flush=True)
                break
            except Exception:
                if attempt == 2:
                    raise
                messages.clear()
                await asyncio.sleep(2)

def font(size, bold=False):
    return ImageFont.truetype('C:/Windows/Fonts/seguisb.ttf' if bold else 'C:/Windows/Fonts/segoeui.ttf', size)

def wrapped(draw, text, xy, width, size, fill=CREAM, bold=False, spacing=12):
    x, y = xy
    face = font(size, bold)
    for paragraph in text.split('\n'):
        words, line = paragraph.split(), ''
        for word in words:
            candidate = (line + ' ' + word).strip()
            if line and draw.textlength(candidate, font=face) > width:
                draw.text((x, y), line, font=face, fill=fill)
                y += size + spacing
                line = word
            else:
                line = candidate
        if line:
            draw.text((x, y), line, font=face, fill=fill)
            y += size + spacing
    return y

def picture(name):
    if name in ('model-settings', 'approval-menu'):
        return Image.open(ROOT / f'pilot-workspace/course/codex-setup/images/{name}.png').convert('RGB')
    image = Image.open(CAPTURES / f'{name}.png').convert('RGB')
    crops = {'introduction': (145, 105, 1040, 620), 'full-panel': (40, 100, 1140, 650),
             'passed': (40, 150, 1140, 560), 'needs-work': (40, 150, 1140, 710)}
    return image.crop(crops[name]) if name in crops else image

def compose(chapter, image_name, step):
    title, description, images, actions = CHAPTERS[chapter]
    frame = Image.new('RGB', (W, H), '#151411')
    d = ImageDraw.Draw(frame)
    d.line((72, 104, W - 72, 104), fill='#4a4130', width=2)
    d.text((72, 42), 'MODULE 1  /  PRACTICE', font=font(27, True), fill=GOLD)
    d.text((W - 420, 42), f'{chapter + 1:02} / 07   ·   CÙNG MINH', font=font(24), fill=MUTED)
    y = wrapped(d, title, (72, 165), 480, 62, bold=True, spacing=10)
    y = wrapped(d, description, (72, y + 28), 480, 31, MUTED)
    y += 35
    for j, action in enumerate(actions):
        selected = j == step % len(actions)
        d.ellipse((74, y + 10, 84, y + 20), fill=GOLD if selected else '#625b4e')
        y = wrapped(d, action, (103, y), 435, 29, GOLD if selected else MUTED, bold=selected, spacing=8) + 19
    # Consistent, readable source viewport; no personal task/workspace paths.
    if image_name == 'recap':
        for j, action in enumerate(actions):
            yy = 220 + j * 150
            d.rounded_rectangle((660, yy, 1770, yy + 108), radius=18, fill='#28251d', outline='#5c5038', width=2)
            d.text((700, yy + 22), str(j + 1).zfill(2), font=font(42, True), fill=GOLD)
            d.text((810, yy + 20), action, font=font(43, True), fill=CREAM)
    else:
        image = picture(image_name)
        bounds = (620, 150, 1848, 930)
        if image_name in ('model-settings', 'approval-menu'):
            bounds = (650, 235, 1820, 835)
            d.rounded_rectangle((620, 150, 1848, 930), radius=20, fill='#24221d', outline='#4a4130', width=2)
        thumb = ImageOps.contain(image, (bounds[2] - bounds[0], bounds[3] - bounds[1]), Image.Resampling.LANCZOS)
        px = bounds[0] + (bounds[2] - bounds[0] - thumb.width) // 2
        py = bounds[1] + (bounds[3] - bounds[1] - thumb.height) // 2
        frame.paste(thumb, (px, py))
        d.rounded_rectangle((px - 2, py - 2, px + thumb.width + 2, py + thumb.height + 2), radius=7, outline='#a38c57', width=2)
        if image_name == 'model-settings':
            # Highlight Effort and Speed; the model row is not assessed.
            row = min(step + 1, 2) if chapter == 2 else 1
            top = py + int(thumb.height * (0.025 + row * 0.22))
            d.rounded_rectangle((px + 8, top, px + thumb.width - 20, top + int(thumb.height * 0.19)), radius=9, outline=GOLD, width=5)
    d.text((72, 1000), 'VÍ DỤ MINH HỌA · Bạn tự thực hành trong task của mình', font=font(23), fill=MUTED)
    for j in range(7):
        d.rounded_rectangle((1530 + j * 44, 1014, 1562 + j * 44, 1020), radius=3, fill=GOLD if j <= chapter else '#454036')
    return frame

def timestamp(seconds, separator='.'):
    ms = round(seconds * 1000)
    return f'{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02}{separator}{ms % 1000:03}'

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--narration-only', action='store_true')
    parser.add_argument('--reuse-narration', action='store_true')
    parser.add_argument('--resume-render', action='store_true')
    args = parser.parse_args()
    current_manifest = ROOT / 'course-companion/shared/practice-video-manifest.json'
    if current_manifest.exists() and json.loads(current_manifest.read_text(encoding='utf-8'))['version'] != '1.0.0':
        parser.error('Legacy slideshow production is retired; use scripts/render-practice-desktop-video.py')
    SCRATCH.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    blocks = narration()
    (OUT / 'transcript.json').write_text(json.dumps(blocks, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    if not args.reuse_narration:
        asyncio.run(synthesize(blocks))
    if args.narration_only:
        return
    vtt, cues, total, entries = ['WEBVTT', ''], [], 0.0, []
    for i, block in enumerate(blocks):
        audio = SCRATCH / f'voice-{i}.mp3'
        seconds = math.ceil((duration(audio) + 1.0) * 24) / 24
        images = CHAPTERS[i][2]
        # More than one real UI screen per chapter where the story changes.
        pieces = max(len(images), len(CHAPTERS[i][3]) if i == 2 else 1)
        for j in range(pieces):
            image_name = images[min(len(images) - 1, j * len(images) // pieces)]
            if i == 2:
                image_name = 'model-settings' if j < 2 else 'approval-menu'
            png, video = SCRATCH / f'frame-{i}-{j}.png', SCRATCH / f'visual-{i}-{j}.mp4'
            compose(i, image_name, j).save(png)
            length = seconds / pieces
            if not (args.resume_render and video.exists() and i != 0):
                run('ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-loop', '1', '-framerate', '24', '-i', png,
                    '-t', f'{length:.6f}', '-vf', f'scale=1920:1080,setsar=1,fade=t=in:st=0:d=0.2,fade=t=out:st={length - 0.2:.6f}:d=0.2', '-c:v', 'libx264', '-preset', 'fast', '-crf', '21', '-pix_fmt', 'yuv420p', '-threads', '2', video)
        concat = SCRATCH / f'visual-{i}.txt'
        concat.write_text('\n'.join(f"file '{(SCRATCH / f'visual-{i}-{j}.mp4').as_posix()}'" for j in range(pieces)), encoding='utf-8')
        chapter = SCRATCH / f'chapter-{i}.mp4'
        run('ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', concat, '-i', audio,
            '-af', 'apad,loudnorm=I=-18:TP=-2:LRA=7', '-t', f'{seconds:.6f}', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', chapter)
        entries.append(chapter)
        words = json.loads((SCRATCH / f'voice-{i}.json').read_text(encoding='utf-8'))
        assert re.findall(r'\w+', ' '.join(word['text'] for word in words).casefold()) == re.findall(r'\w+', block['text'].casefold()), 'Regenerate narration after a script change'
        # Speech boundaries omit punctuation. Restore the original script's
        # punctuation without changing the word timing or introducing text.
        tokens = block['text'].split()
        if len(tokens) == len(words) and all(re.findall(r'\w+', token.casefold()) == re.findall(r'\w+', word['text'].casefold()) for token, word in zip(tokens, words)):
            words = [{**word, 'text': token} for token, word in zip(tokens, words)]
        line, start, end = [], None, None
        for word in words:
            if line and len(' '.join(line + [word['text']])) > 90:
                cues.append((total + start, total + end, '\n'.join(textwrap.wrap(' '.join(line), width=48))))
                line, start = [], None
            if start is None:
                start = word['offset'] / 10000000
            end = (word['offset'] + word['duration']) / 10000000
            line.append(word['text'])
        if line:
            cues.append((total + start, total + end, '\n'.join(textwrap.wrap(' '.join(line), width=48))))
        total += seconds
        print(f'Rendered chapter {i + 1}, cumulative {total:.2f}s', flush=True)
    for start, end, caption in cues:
        vtt.extend([f'{timestamp(start)} --> {timestamp(end)}', caption, ''])
    (OUT / 'module-1-practice.vi.vtt').write_text('\n'.join(vtt), encoding='utf-8')
    final_concat = SCRATCH / 'chapters.txt'
    final_concat.write_text('\n'.join(f"file '{p.as_posix()}'" for p in entries), encoding='utf-8')
    final = SCRATCH / 'module-1-practice.mp4'
    run('ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', final_concat,
        '-c', 'copy', '-movflags', '+faststart', final)
    run('ffmpeg', '-hide_banner', '-loglevel', 'error', '-i', final, '-f', 'null', '-')
    published = OUT / 'module-1-practice.mp4'
    os.replace(final, published)
    compose(0, 'recap', 0).save(OUT / 'poster.jpg', quality=92)
    manifest = {'videoId': 'module-1-practice', 'version': '1.0.0', 'durationSeconds': duration(published)}
    (ROOT / 'course-companion/shared/practice-video-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(manifest), flush=True)

if __name__ == '__main__':
    main()
