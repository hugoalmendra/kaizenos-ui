#!/usr/bin/env python3
"""Render every desktop screen to a PNG for the Figma reference file.

    python3 design/desktop-png/make.py [id ...]

Mobile is 45 static artboards, one file each, so make.py there is a loop
over a directory. Desktop has no artboards — it has two running
prototypes, index.html (sign-in and the founder intake) and mentor.html
(the app) — so a screen here is a state: `screens.py` names it and the
recipe that reaches it, `driver.js` drives the app's own hooks to get
there, and this takes the picture.

Chrome is driven over the DevTools protocol rather than with
`--headless --screenshot`. That flag decides for itself when a page is
finished and it decides wrong: it fires mid-paint, and a panel comes
back missing — differently on each run, so two renders of the same 71
screens disagreed on 62 of them. Here the driver says when the state is
set and settled and the shot is taken then.

One browser serves every screen, and the driver is injected with
Page.addScriptToEvaluateOnNewDocument, so nothing is written into the
repo to carry it and two runs at once cannot collide. Takes about three
minutes for all 71. `index.json` comes out alongside, carrying each
render's title, page, grid position, source and state recipe.

Nothing reaches a network. The prototype's own calls fail and are caught
where they are made, which is what happens with the Wi-Fi off anyway.
"""
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from cdp import Browser  # noqa: E402
from screens import SCREENS  # noqa: E402

HERE = Path(__file__).parent
ROOT = HERE.resolve().parents[1]
OUT = HERE / 'png'
SCALE = 2
MAX_FULL_H = 12000     # a page taller than this is a mistake, not a page
COLS, GAP = 4, 140     # the grid the frames land on in Figma

READY = "document.documentElement.getAttribute('data-shot-ready')"
HEIGHT = "+document.documentElement.getAttribute('data-shot-height')"


def driver_source():
    recipes = {s['id']: s['recipe'] for s in SCREENS if s['recipe'] is not None}
    return 'window.__RECIPES = ' + json.dumps(recipes) + ';\n' + (HERE / 'driver.js').read_text()


def shoot(b, s):
    out = OUT / (s['id'] + '.png')
    url = (ROOT / s['src']).as_uri() + '?shot=' + s['id']

    # First pass at the nominal size: the state has to exist before the
    # page can say how tall it is.
    b.viewport(s['w'], s['h'], SCALE)
    if not b.goto(url, READY):
        raise RuntimeError('never became ready: ' + s['id'])

    h = s['h']
    if s['full']:
        measured = b.evaluate(HEIGHT)
        h = max(s['h'], min(int(measured), MAX_FULL_H))
        if h != s['h']:
            # Re-lay it out at its real height and let it settle again,
            # so nothing is half-way through a reflow in the picture.
            b.viewport(s['w'], h, SCALE)
            time.sleep(0.3)

    b.screenshot(out)
    if not out.exists() or out.stat().st_size < 4096:
        raise RuntimeError('implausible png for ' + s['id'])
    return s['id'], s['w'], h


def layout(size):
    """Each page is its own board, four frames to a row."""
    index, by_page = [], {}
    for s in SCREENS:
        by_page.setdefault(s['page'], []).append(s)
    for page, group in by_page.items():
        col, x, y, row_h = 0, 0, 0, 0
        for s in group:
            w, h = size.get(s['id'], (s['w'], s['h']))
            if col == COLS:
                col, x, y, row_h = 0, 0, y + row_h + GAP, 0
            index.append(dict(id=s['id'], png=s['id'] + '.png', title=s['title'],
                              page=page, x=x, y=y, w=w, h=h,
                              source=s['src'], state=s['recipe'] or None))
            col += 1
            x += w + GAP
            row_h = max(row_h, h)
    return index


def main():
    wanted = set(sys.argv[1:])
    todo = [s for s in SCREENS if not wanted or s['id'] in wanted]
    OUT.mkdir(exist_ok=True)

    b = Browser()
    try:
        b.on_new_document(driver_source())
        done = []
        for i, s in enumerate(todo, 1):
            done.append(shoot(b, s))
            print('%3d/%d  %s' % (i, len(todo), s['id']), flush=True)
    finally:
        b.close()

    size = {i: (w, h) for i, w, h in done}
    if not wanted:
        (HERE / 'index.json').write_text(json.dumps(layout(size), indent=1) + '\n')
    print(f'{len(done)} screens → {OUT}')


if __name__ == '__main__':
    main()
