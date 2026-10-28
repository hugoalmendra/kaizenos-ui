#!/usr/bin/env python3
"""Flat PNG renders of every mobile artboard, named and ordered for Figma.

One PNG per artboard at 2x (780 x 1688), named so they sort into the
same order and pages as the prototype canvas:

    p1-01-A1-launch.png

Headless Chrome renders them because it is the same engine the artboards
were designed against; nothing else here draws CSS radial gradients.

    python3 make.py
"""
import json, pathlib, re, subprocess, sys

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE.parent / 'mobile-app'
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
SCALE = 2

def slug(s):
    s = s.split('·', 1)[-1] if '·' in s else s
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

def code(title):
    m = re.match(r'\s*([A-Z]+\d+)', title)
    return m.group(1) if m else 'X'

def main():
    if not pathlib.Path(CHROME).exists():
        sys.exit('Google Chrome not found')
    canvas = json.loads((SRC / 'canvas.json').read_text())
    pages = {p['id']: p['name'] for p in canvas['pages']}
    order = {pid: 0 for pid in pages}
    index = []

    for a in canvas['artboards']:
        pid = a['page']
        order[pid] += 1
        pnum = pid.split('-')[-1]
        name = f"p{pnum}-{order[pid]:02d}-{code(a['title'])}-{slug(a['title'])}.png"
        out = HERE / name
        subprocess.run([
            CHROME, '--headless', '--disable-gpu', '--hide-scrollbars',
            f'--window-size={a["w"]},{a["h"]}',
            f'--force-device-scale-factor={SCALE}',
            f'--screenshot={out}', f'file://{SRC / a["file"]}',
        ], check=True, capture_output=True)
        index.append({'png': name, 'title': a['title'], 'page': pages[pid],
                      'pageId': pid, 'x': a['x'], 'y': a['y'],
                      'w': a['w'], 'h': a['h'], 'source': a['file']})
        print(f"{name:<34} {a['title']}")

    (HERE / 'index.json').write_text(json.dumps(index, indent=2) + '\n')
    print(f"\n{len(index)} artboards across {len(pages)} pages")

if __name__ == '__main__':
    main()
