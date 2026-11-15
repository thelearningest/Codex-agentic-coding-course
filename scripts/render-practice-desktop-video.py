"""Render the native desktop walkthrough; source recordings stay in ignored QA.

python scripts/render-practice-desktop-video.py --narration-only
python scripts/render-practice-desktop-video.py --edit .superpowers/qa/practice-desktop-v2/edit.json

The edit maps scene IDs to recorded takes, trim ranges and timed control
highlight rectangles. No screenshots or fabricated UI replace missing footage.
Rendering writes a draft; --publish is a separate local operation after QA.
"""
import argparse
import asyncio
import importlib.util
import json
import math
import os
from pathlib import Path
import re
import shutil
import textwrap

ROOT = Path(__file__).resolve().parent.parent
SCRATCH = ROOT / '.superpowers/qa/practice-desktop-v2'
OUT = ROOT / 'course-companion/src/renderer/src/assets/practice-video'
STORYBOARD = ROOT / 'scripts/practice-desktop-video-storyboard.json'
spec = importlib.util.spec_from_file_location('practice_video_authoring', ROOT / 'scripts/create-practice-video.py')
authoring = importlib.util.module_from_spec(spec)
spec.loader.exec_module(authoring)
FPS = 30


def cues_for(scene, index):
    words = json.loads((SCRATCH / 'narration' / f'voice-{index}.json').read_text(encoding='utf-8'))
    normalize = lambda value: re.findall(r'\w+', value.casefold())
    if normalize(' '.join(word['text'] for word in words)) != normalize(scene['text']):
        raise ValueError(f"Stale narration: {scene['id']}")
    tokens = scene['text'].split()
    if len(tokens) == len(words) and all(normalize(token) == normalize(word['text']) for token, word in zip(tokens, words)):
        words = [{**word, 'text': token} for token, word in zip(tokens, words)]
    result, line, start, end = [], [], None, None
    for word in words:
        candidate = ' '.join(line + [word['text']])
        if line and (len(candidate) > 84 or len(textwrap.wrap(candidate, width=47)) > 2 or (end-start > 5 and line[-1].endswith(('.', '?', '!')))):
            result.append((start, end, '\n'.join(textwrap.wrap(' '.join(line), width=47))))
            line, start = [], None
        if start is None:
            start = word['offset'] / 10_000_000
        end = (word['offset'] + word['duration']) / 10_000_000
        line.append(word['text'])
    if line:
        result.append((start, end, '\n'.join(textwrap.wrap(' '.join(line), width=47))))
    return result


def ass_time(seconds):
    cs = round(seconds * 100)
    return f'{cs//360000}:{cs//6000%60:02}:{cs//100%60:02}.{cs%100:02}'


def ass_file(path, cues):
    header = '''[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 2
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,Segoe UI,42,&H00F4F3EE,&H00F4F3EE,&H00121010,&H00121010,0,0,0,0,100,100,0,0,1,0,0,2,90,90,18,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''
    rows = []
    for start, end, caption in cues:
        rows.append(f'Dialogue: 0,{ass_time(start)},{ass_time(end)},Caption,,0,0,0,,' + caption.replace('\n', r'\N'))
    path.write_text(header + '\n'.join(rows) + '\n', encoding='utf-8')


def compose_take(output, pieces):
    """Join trims from real recorded windows without replacing their contents."""
    inputs = []
    filters = []
    for index, piece in enumerate(pieces):
        source = (SCRATCH / piece['capture']).resolve()
        if not source.is_relative_to(SCRATCH.resolve()) or not source.is_file():
            raise ValueError('Compound take needs a local source recording')
        start, end, *rate = piece['cut']
        if not 0 <= start < end <= authoring.duration(source)+.08:
            raise ValueError('Invalid compound source trim')
        inputs.extend(['-ss', start, '-t', end-start, '-i', source])
        filters.append(f'[{index}:v]setpts=(PTS-STARTPTS)/{rate[0] if rate else 1},fps={FPS},scale=1920:1080,setsar=1[v{index}]')
    filters.append(''.join(f'[v{i}]' for i in range(len(pieces))) + f'concat=n={len(pieces)}:v=1:a=0[video]')
    script = output.with_suffix('.compose.ffmpeg')
    script.write_text(';\n'.join(filters), encoding='utf-8')
    authoring.run('ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *inputs,
        '-filter_complex_script', script, '-map', '[video]', '-an', '-c:v', 'libx264', '-preset', 'fast',
        '-crf', '19', '-threads', '2', '-pix_fmt', 'yuv420p', output)


def finish_captions(scenes, voice_indices):
    cues, offset = [], 0.0
    for scene in scenes:
        cues.extend((offset+start, offset+end, text) for start, end, text in cues_for(scene, voice_indices[scene['id']]))
        offset += authoring.duration(SCRATCH / f'{scene["id"]}-edited.mp4')
    if any(len(text.splitlines()) > 2 for _, _, text in cues):
        raise ValueError('Captions must fit two lines')
    ass_file(SCRATCH / 'desktop-final.ass', cues)
    fonts = SCRATCH / 'caption-fonts'
    fonts.mkdir(exist_ok=True)
    for name in ['segoeui.ttf', 'seguisb.ttf']:
        shutil.copyfile(Path('C:/Windows/Fonts') / name, fonts / name)
    movie = SCRATCH / 'module-1-practice-v2.mp4'
    captioned = SCRATCH / 'module-1-practice-captioned.mp4'
    old_cwd = Path.cwd()
    try:
        os.chdir(SCRATCH)
        authoring.run('ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', movie,
            '-vf', "drawbox=x=0:y=936:w=iw:h=144:color=0x121010:t=fill,ass=filename=desktop-final.ass:fontsdir=caption-fonts",
            '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-threads', '4', '-pix_fmt', 'yuv420p',
            '-c:a', 'copy', '-movflags', '+faststart', captioned)
    finally:
        os.chdir(old_cwd)
    authoring.run('ffmpeg', '-hide_banner', '-loglevel', 'error', '-i', captioned, '-f', 'null', '-')
    os.replace(captioned, movie)
    vtt = ['WEBVTT', '']
    for start, end, text in cues:
        vtt.extend([f'{authoring.timestamp(start)} --> {authoring.timestamp(end)}', text, ''])
    (SCRATCH / 'module-1-practice.vi.vtt').write_text('\n'.join(vtt), encoding='utf-8')
    print(f'Final captions: {len(cues)} cues, at most two lines, fully decoded', flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--narration-only', action='store_true')
    parser.add_argument('--edit', type=Path)
    parser.add_argument('--publish', action='store_true')
    parser.add_argument('--render-scenes', help='Comma-separated scene IDs to rerender after a recording retake')
    parser.add_argument('--captions-only', action='store_true')
    args = parser.parse_args()
    storyboard = json.loads(STORYBOARD.read_text(encoding='utf-8'))
    source_scenes = storyboard['scenes']
    voice_indices = {scene['id']: index for index, scene in enumerate(source_scenes)}
    by_id = {scene['id']: scene for scene in source_scenes}
    scenes = [by_id[key] for key in storyboard.get('playbackOrder', list(by_id))]
    authoring.SCRATCH = SCRATCH / 'narration'
    authoring.SCRATCH.mkdir(parents=True, exist_ok=True)
    authoring.VOICE = storyboard['voice']
    if args.captions_only:
        finish_captions(scenes, voice_indices)
        return
    if args.narration_only:
        asyncio.run(authoring.synthesize(source_scenes))
        return
    if not args.edit:
        parser.error('--edit is required to render actual recordings')
    edit = json.loads(args.edit.read_text(encoding='utf-8'))
    if set(edit) != {scene['id'] for scene in scenes}:
        raise ValueError('Every storyboard scene needs an explicit recording edit')
    rendered, all_cues, offset = [], [], 0.0
    selected = set(args.render_scenes.split(',')) if args.render_scenes else None
    for scene in scenes:
        index = voice_indices[scene['id']]
        settings = edit[scene['id']]
        source = (SCRATCH / settings.get('capture', scene['capture'])).resolve()
        if settings.get('compose') and (selected is None or scene['id'] in selected):
            compose_take(source, settings['compose'])
        if not source.is_relative_to(SCRATCH.resolve()) or not source.is_file():
            raise ValueError(f'Missing local recording: {source.name}')
        source_duration = authoring.duration(source)
        cuts = settings['cuts']
        if any(not (0 <= cut[0] < cut[1] <= source_duration + .08) or (len(cut) > 2 and cut[2] <= 0) for cut in cuts):
            raise ValueError(f"Invalid capture trims: {scene['id']}")
        audio = authoring.SCRATCH / f'voice-{index}.mp3'
        narration_duration = authoring.duration(audio)
        visual_duration = sum((cut[1]-cut[0])/(cut[2] if len(cut)>2 else 1) for cut in cuts)
        seconds = math.ceil(max(narration_duration + 0.45, visual_duration) * FPS) / FPS
        cues = cues_for(scene, index)
        subtitle = SCRATCH / f'{scene["id"]}.ass'
        ass_file(subtitle, cues)
        filters = [f'[0:v]split={len(cuts)}' + ''.join(f'[in{i}]' for i in range(len(cuts)))]
        for cut_index, cut in enumerate(cuts):
            start, end = cut[:2]
            rate = cut[2] if len(cut) > 2 else 1
            filters.append(f'[in{cut_index}]trim=start={start}:end={end},setpts=(PTS-STARTPTS)/{rate}[v{cut_index}]')
        filters.append(''.join(f'[v{i}]' for i in range(len(cuts))) + f'concat=n={len(cuts)}:v=1:a=0,fps={FPS},scale=1920:1080,setsar=1[cut]')
        operations = []
        # Keep the desktop stationary; use one contextual highlight at a time.
        for rect in settings.get('privacy', []):
            x, y, w, h = rect
            operations.append(f'drawbox=x={x}:y={y}:w={w}:h={h}:color=0x191919:t=fill')
        for highlight in settings.get('highlights', []):
            x, y, w, h = highlight['rect']
            start, end = highlight['time']
            operations.append(f"drawbox=x={x}:y={y}:w={w}:h={h}:color=0xffd45a:t=4:enable='between(t,{start},{end})'")
        operations.extend([
            'scale=1706:960,pad=1920:1080:107:0:color=0x121010',
            f'tpad=stop_mode=clone:stop_duration={max(0,seconds-visual_duration):.6f}',
            # Captions are burned once after joining, with the real clip offsets.
        ])
        filters.append('[cut]' + ','.join(operations) + '[video]')
        script = SCRATCH / f'{scene["id"]}.ffmpeg'
        script.write_text(';\n'.join(filters), encoding='utf-8')
        output = SCRATCH / f'{scene["id"]}-edited.mp4'
        old_cwd = Path.cwd()
        try:
            os.chdir(SCRATCH)
            if selected is not None and scene['id'] not in selected:
                if not output.is_file() or abs(authoring.duration(output)-seconds) > .1:
                    raise ValueError('Retained chapter must already exist with the expected duration')
            else:
                authoring.run('ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-filter_complex_threads', '2', '-i', source, '-i', audio,
                '-filter_complex_script', script, '-map', '[video]', '-map', '1:a', '-af', 'apad,loudnorm=I=-18:TP=-2:LRA=7',
                '-t', seconds, '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '18', '-threads', '4', '-pix_fmt', 'yuv420p',
                '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', output)
        finally:
            os.chdir(old_cwd)
        rendered.append(output)
        all_cues.extend((offset+start, offset+end, caption) for start, end, caption in cues)
        offset += seconds
        print(f'Rendered {scene["id"]}: {seconds:.2f}s', flush=True)
    concat = SCRATCH / 'desktop-chapters.txt'
    concat.write_text('\n'.join(f"file '{path.as_posix()}'" for path in rendered), encoding='utf-8')
    movie = SCRATCH / 'module-1-practice-v2.mp4'
    authoring.run('ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', concat,
        '-c', 'copy', '-movflags', '+faststart', movie)
    authoring.run('ffmpeg', '-hide_banner', '-loglevel', 'error', '-i', movie, '-f', 'null', '-')
    vtt = ['WEBVTT', '']
    for start, end, caption in all_cues:
        vtt.extend([f'{authoring.timestamp(start)} --> {authoring.timestamp(end)}', caption, ''])
    (SCRATCH / 'module-1-practice.vi.vtt').write_text('\n'.join(vtt), encoding='utf-8')
    finish_captions(scenes, voice_indices)
    if args.publish:
        if not settings or not json.loads((SCRATCH / 'visual-qa.json').read_text(encoding='utf-8')).get('passed'):
            raise ValueError('Inspect the draft timeline and record visual-qa.json before publishing')
        import shutil
        shutil.copyfile(movie, OUT / 'module-1-practice.mp4')
        shutil.copyfile(SCRATCH / 'module-1-practice.vi.vtt', OUT / 'module-1-practice.vi.vtt')
        (OUT / 'transcript.json').write_text(json.dumps([{'title':s['title'],'text':s['text']} for s in scenes], ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
        manifest = {'videoId': storyboard['videoId'], 'version': storyboard['version'], 'durationSeconds': authoring.duration(movie), 'captionsEmbedded': True}
        (ROOT / 'course-companion/shared/practice-video-manifest.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({'draft':str(movie),'durationSeconds':authoring.duration(movie)}), flush=True)


if __name__ == '__main__':
    main()
