#!/usr/bin/env python3
"""Standalone copies of every output Kaiso forges, for sending to people
who are not going to click through the prototype.

Each file is one document, self-contained: the markup is lifted from
mentor.html and the stylesheets are inlined, so it opens anywhere with
no server, no network and no JavaScript.

    python3 make.py          # writes the HTML
    ./make.sh                # HTML, then PDFs via headless Chrome

The markup is read from mentor.html rather than kept as a second copy,
so these cannot drift from the prototype. Regenerate after changing an
output instead of editing the files here.
"""
import pathlib, re, sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent

# id in mentor.html, file stem, the name a person would use, print key
OUTPUTS = [
    ('pitchPrintable',   'elevator-pitch',    'Elevator Pitch',    'pitch'),
    ('execPrintable',    'executive-summary', 'Executive Summary', 'exec'),
    ('landingPrintable', 'landing-page',      'Landing Page',      'landing'),
    ('orgPrintable',     'org-chart',         'Org Chart',         'org'),
    ('brandPrintable',   'brand-kit',         'Brand Kit',         'brand'),
    ('deckPrintable',    'pitch-deck',        'Pitch Deck',        'deck'),
]

def extract(html, el_id):
    """The element with this id, with its children, by tag depth."""
    m = re.search(r'<(\w+)[^>]*\bid="' + re.escape(el_id) + r'"', html)
    if not m:
        raise SystemExit('not found in mentor.html: ' + el_id)
    tag = m.group(1)
    depth, i = 0, m.start()
    for t in re.finditer(r'<(/?)' + tag + r'\b', html[m.start():]):
        depth += -1 if t.group(1) else 1
        if depth == 0:
            end = m.start() + t.end()
            return html[m.start():html.index('>', end) + 1]
    raise SystemExit('unbalanced <' + tag + '> around ' + el_id)

def print_css(key):
    """The per-output print rules the prototype already carries, pulled
    from 14-forged-assets.js so there is one copy of them."""
    js = (ROOT / 'js/mentor/14-forged-assets.js').read_text()
    base = re.search(r'const BASE_PRINT = `(.*?)`;', js, re.S).group(1)
    page = re.search(r'const PAGE_A4 = `(.*?)`;', js, re.S).group(1)
    if not key:
        return base + page
    m = re.search(r'\n      ' + key + r': BASE_PRINT \+( PAGE_A4 \+)? `(.*?)`,', js, re.S)
    if not m:
        return base + page
    return base + (page if m.group(1) else '') + m.group(2)

def build():
    html = (ROOT / 'mentor.html').read_text()
    sheets = sorted((ROOT / 'css/mentor').glob('*.css'))
    css = '\n'.join(p.read_text() for p in sheets)

    for el_id, stem, title, key in OUTPUTS:
        doc = extract(html, el_id)
        page = (
            '<!DOCTYPE html>\n<html lang="en">\n<head>\n'
            '<meta charset="UTF-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
            f'<title>{title} — KaizenOS</title>\n'
            '<style>\n' + css + '\n' + print_css(key) + '\n'
            # The prototype draws these on a dark stage. On their own they
            # are documents: white, so they print and read as one.
            #
            # Scoped to screen. Unscoped, this padding beat BASE_PRINT's
            # `@media print { body { padding: 0 } }` by coming later, the
            # full-bleed deck slides then overflowed the page, and Chrome
            # silently shrank the whole deck to fit -- which packed twelve
            # slides onto eight pages.
            '  body { background: #fff; display: block; overflow: auto; }\n'
            '  @media screen { body { padding: 28px; } }\n'
            '  @media print { body { padding: 0 !important; margin: 0 !important; } }\n'
            '</style>\n</head>\n<body>\n' + doc + '\n</body>\n</html>\n'
        )
        (HERE / (stem + '.html')).write_text(page)
        print(f'{stem + ".html":<26} {len(page)/1024:6.0f} KB   {title}')

if __name__ == '__main__':
    build()
