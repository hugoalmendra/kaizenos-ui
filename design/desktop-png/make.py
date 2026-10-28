#!/usr/bin/env python3
"""Render every desktop screen to a PNG for the Figma reference file.

Mobile is 45 files, one artboard each, so make.py there is a loop over a
directory. Desktop is one running prototype, so each screen is a state:
a throwaway copy of mentor.html carries a driver that puts the app into
that state, and headless Chrome runs the clock forward and takes the
shot. Standalone pages (the landing page, the forged documents, the
email templates, the legal pages) are measured first and captured whole.

    python3 design/desktop-png/make.py [id ...]

Takes about three minutes for all of them. Nothing here reaches a
network; the prototype's own calls fail and are caught where they are
made, which is the same thing that happens with the Wi-Fi off.
"""
import json
import re
import shutil
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from screens import SCREENS  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).parent / 'png'
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
SCALE = 2
BUDGET = 2500          # virtual ms — the clock runs forward this far, fast
MEASURE_BUDGET = 2500
MAX_FULL_H = 12000     # a page taller than this is a mistake, not a page
COLS, GAP = 4, 140     # the grid the frames land on in Figma

# scrollHeight believes whatever min-height the page claims, which on a
# centred card is a screenful of nothing under it. The real bottom is the
# lowest thing actually drawn.
TAG = '<script src="__shot-driver.js"></script>'

MEASURE = (
    "<script>addEventListener('load',function(){setTimeout(function(){"
    "var b=0;document.querySelectorAll('body *').forEach(function(e){"
    "var r=e.getBoundingClientRect();"
    "if(r.width&&r.height)b=Math.max(b,r.bottom+window.scrollY);});"
    "document.title='KH:'+Math.ceil(b+40);},600);});</script>"
)


def chrome(url, out, w, h, budget=BUDGET, dump=False):
    # Metal, not --disable-gpu. Half this interface is glass: the HUD
    # rail, the modal scrim and the panels all sit on backdrop-filter,
    # and software rasterisation drops those layers entirely — the shot
    # comes back with the stage and nothing on it.
    cmd = [CHROME, '--headless', '--use-angle=metal', '--hide-scrollbars',
           '--no-first-run', '--no-default-browser-check',
           f'--window-size={w},{h}', f'--virtual-time-budget={budget}']
    if dump:
        cmd.append('--dump-dom')
    else:
        cmd += [f'--force-device-scale-factor={SCALE}', f'--screenshot={out}']
    cmd.append(url)
    r = subprocess.run(cmd, capture_output=True, text=True)
    return r.stdout


def measure(path: Path, w: int) -> int:
    """How tall the page actually runs, asked of the page itself."""
    src = path.read_text()
    probe = path.with_name(path.stem + '.__measure.html')
    probe.write_text(src.replace('</head>', MEASURE + '</head>', 1)
                     if '</head>' in src else MEASURE + src)
    try:
        dom = chrome(probe.as_uri(), None, w, 900, MEASURE_BUDGET, dump=True)
    finally:
        probe.unlink(missing_ok=True)
    m = re.search(r'<title>KH:(\d+)</title>', dom)
    return min(int(m.group(1)), MAX_FULL_H) if m else 900


def shoot(s, harness):
    out = OUT / (s['id'] + '.png')
    if s['recipe'] is not None and s['src'] in harness:
        url = harness[s['src']].as_uri() + '?shot=' + s['id']
        h = s['h']
        if s['full']:
            dom = chrome(url, None, s['w'], s['h'], MEASURE_BUDGET, dump=True)
            found = re.search(r'<title>KH:(\d+)</title>', dom)
            if found:
                h = max(s['h'], min(int(found.group(1)), MAX_FULL_H))
        chrome(url, out, s['w'], h)
    else:
        path = ROOT / s['src']
        h = measure(path, s['w'])
        chrome(path.as_uri(), out, s['w'], h)
    if not out.exists():
        raise RuntimeError('no png for ' + s['id'])
    return s['id'], s['w'], h


def main():
    wanted = set(sys.argv[1:])
    todo = [s for s in SCREENS if not wanted or s['id'] in wanted]
    OUT.mkdir(exist_ok=True)

    # A harness has to sit beside the page it copies or every relative
    # path in it breaks. They are deleted again below, whatever happens.
    driver = ROOT / '__shot-driver.js'
    recipes = {s['id']: s['recipe'] for s in SCREENS if s['recipe'] is not None}
    driver.write_text('window.__RECIPES = ' + json.dumps(recipes) + ';\n'
                      + (Path(__file__).parent / 'driver.js').read_text())
    harness = {}
    for src in sorted({s['src'] for s in SCREENS if s['recipe']}):
        page = ROOT / src
        h = page.with_name(page.stem + '.__shot.html')
        h.write_text(page.read_text().replace('</head>', TAG + '</head>', 1))
        harness[src] = h

    try:
        with ThreadPoolExecutor(max_workers=4) as pool:
            done = list(pool.map(lambda s: shoot(s, harness), todo))
    finally:
        for h in harness.values():
            h.unlink(missing_ok=True)
        driver.unlink(missing_ok=True)

    size = {i: (w, h) for i, w, h in done}

    # Lay the grid out per page, so a page reads as its own board.
    index, by_page = [], {}
    for s in SCREENS:
        by_page.setdefault(s['page'], []).append(s)
    for page, group in by_page.items():
        rows, x, y, row_h = [], 0, 0, 0
        for s in group:
            w, h = size.get(s['id'], (s['w'], s['h']))
            if len(rows) == COLS:
                x, y, row_h, rows = 0, y + row_h + GAP, 0, []
            index.append(dict(id=s['id'], png=s['id'] + '.png', title=s['title'],
                              page=page, x=x, y=y, w=w, h=h,
                              source=s['src'], state=s['recipe'] or None))
            rows.append(s)
            x += w + GAP
            row_h = max(row_h, h)

    (Path(__file__).parent / 'index.json').write_text(json.dumps(index, indent=1) + '\n')
    print(f'{len(done)} screens → {OUT}')


if __name__ == '__main__':
    main()
