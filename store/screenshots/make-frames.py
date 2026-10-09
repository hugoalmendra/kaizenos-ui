#!/usr/bin/env python3
"""Caption frames for the App Store, one per slot.

Both frames come from here so they cannot drift apart. Colours are the
app's own tokens, lifted from css/landing/00-base.css and 01-star-field.css
rather than eyeballed.

    python3 make-frames.py
"""
import random, pathlib

GOLD_BRIGHT = '#e8c870'
GOLD        = '#c8a84e'
INK_BRIGHT  = '#f4ecd2'

FRAMES = [
    # name, canvas, title px, subtitle px, device slot (x, y, w, h)
    ('caption-frame.svg',      1290, 2796, 104, 46, 165,  520,  960, 2076),
    ('caption-frame-ipad.svg', 2064, 2752, 150, 66, 282,  560, 1500, 2000),
]

def stars(w, h, n, seed):
    random.seed(seed)
    out = []
    for _ in range(n):
        x, y = random.randint(0, w), random.randint(0, h)
        r = random.choice([1.2, 1.2, 1.6, 2.0, 2.6])
        fill = GOLD_BRIGHT if random.random() < 0.28 else '#ffffff'
        op = round(random.uniform(0.18, 0.75), 2)
        out.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" opacity="{op}"/>')
    return out

def frame(name, w, h, t_size, s_size, sx, sy, sw, sh):
    # star density follows area, so the iPad is not sparser than the phone
    n = int(150 * (w * h) / (1290 * 2796))
    t_y = int(h * 0.107)
    s_y = int(h * 0.142)
    cx = w // 2
    ped_cy = sy + sh // 2
    body = '\n'.join('    ' + s for s in stars(w, h, n, 7))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
  <title>KaizenOS — App Store screenshot frame {w}×{h}</title>
  <desc>Background and caption slots. Drop the device capture into the dashed
  area. Colours are the app's own tokens.</desc>

  <defs>
    <radialGradient id="void" cx="0.5" cy="0.3" r="0.78">
      <stop offset="0%" stop-color="#0a0817"/>
      <stop offset="55%" stop-color="#04030a"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>
    <radialGradient id="neb1" cx="0.3" cy="0.25" r="0.6">
      <stop offset="0%" stop-color="#4b3278" stop-opacity="0.30"/>
      <stop offset="70%" stop-color="#4b3278" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="neb2" cx="0.75" cy="0.75" r="0.5">
      <stop offset="0%" stop-color="#785032" stop-opacity="0.20"/>
      <stop offset="70%" stop-color="#785032" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="pedestal" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="{GOLD}" stop-opacity="0.13"/>
      <stop offset="100%" stop-color="{GOLD}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="{w}" height="{h}" fill="url(#void)"/>
  <rect width="{w}" height="{h}" fill="url(#neb1)"/>
  <rect width="{w}" height="{h}" fill="url(#neb2)"/>

  <g id="stars">
{body}
  </g>

  <text x="{cx}" y="{t_y}" text-anchor="middle"
        font-family="SF Pro Display, -apple-system, Helvetica Neue, Arial, sans-serif"
        font-size="{t_size}" font-weight="700" letter-spacing="-1" fill="{INK_BRIGHT}">Just talk.</text>
  <text x="{cx}" y="{s_y}" text-anchor="middle"
        font-family="SF Pro Text, -apple-system, Helvetica Neue, Arial, sans-serif"
        font-size="{s_size}" font-weight="400" fill="{GOLD_BRIGHT}" opacity="0.82">Kaiso asks what a good advisor would.</text>

  <ellipse cx="{cx}" cy="{ped_cy}" rx="{int(sw*0.67)}" ry="{int(sh*0.25)}" fill="url(#pedestal)"/>
  <rect x="{sx}" y="{sy}" width="{sw}" height="{sh}" rx="{int(w*0.053)}"
        fill="none" stroke="{GOLD}" stroke-opacity="0.18" stroke-width="2" stroke-dasharray="14 12"/>
  <text x="{cx}" y="{ped_cy}" text-anchor="middle"
        font-family="SF Pro Text, -apple-system, Helvetica Neue, Arial, sans-serif"
        font-size="{int(s_size*0.74)}" fill="{GOLD}" opacity="0.45">device capture goes here · {sw} × {sh}</text>
</svg>
'''

here = pathlib.Path(__file__).parent
for name, w, h, t, s, sx, sy, sw, sh in FRAMES:
    (here / name).write_text(frame(name, w, h, t, s, sx, sy, sw, sh))
    print(f'{name:<26} {w} × {h}   slot {sw} × {sh}   title {t}px  subtitle {s}px')


# ── Creative assets: product page header and search results ──────────
# Apple's specs, confirmed at developer.apple.com/help/app-store-connect/
#   reference/app-information/creative-assets-specifications/
#   header  21:9  3840 × 1646      search  3:2  3840 × 2560 (1920×1280 min)
# No alpha, .png only. Focal point centred, because Apple crops these
# differently per device and placement.
#
# Two kinds of file come out of here:
#   *-header*  final artwork — the medallion IS the subject, nothing to drop in
#   *-search*  a template — Apple asks search results to show the interface,
#              so a capture slot is left for the real screenshot
# Every asset also gets a -guides twin with the safe area drawn on it. The
# guides are never the deliverable; the clean file is.

# The medallion, lifted from mentor.html's .sacred-svg rather than redrawn,
# in its ACTIVE state (gold-bright bars, pineal core lit) — that is the state
# people see while they are talking, and it is the one that reads as "voice".
# Local units: frontier ring r=168, bezel r=92, hexagram scaled 0.8.
SIGIL_DEFS = '''
    <radialGradient id="pinealCore" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#ffffff" stop-opacity="0.92"/>
      <stop offset="18%"  stop-color="#fff5d6" stop-opacity="0.80"/>
      <stop offset="42%"  stop-color="#f1d27a" stop-opacity="0.52"/>
      <stop offset="72%"  stop-color="#c8a84e" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#c8a84e" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="pinealHalo" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#fff5d6" stop-opacity="0.34"/>
      <stop offset="60%"  stop-color="#c8a84e" stop-opacity="0.11"/>
      <stop offset="100%" stop-color="#c8a84e" stop-opacity="0"/>
    </radialGradient>'''

def sigil(cx, cy, scale):
    """The KaizenOS medallion at (cx, cy). scale 1.0 = 336px across the
    frontier ring. Geometry matches mentor.html exactly."""
    bars = ''.join(
        f'<rect x="-60" y="{y}" width="120" height="10" rx="2" fill="#e8c870"/>'
        for y in (-65, -41, -17, 7, 31, 55))
    return f'''<g transform="translate({cx},{cy}) scale({scale:.4f})">
    <circle cx="0" cy="0" r="170" fill="url(#pinealHalo)"/>
    <circle cx="0" cy="0" r="80"  fill="url(#pinealCore)"/>
    <g fill="none" stroke="#e8c870" stroke-width="0.5" stroke-opacity="0.18">
      <line x1="0" y1="-120" x2="0" y2="120"/><line x1="-120" y1="0" x2="120" y2="0"/>
      <line x1="-85" y1="-85" x2="85" y2="85"/><line x1="-85" y1="85" x2="85" y2="-85"/>
      <circle cx="0" cy="0" r="40"/><circle cx="0" cy="0" r="60"/><circle cx="0" cy="0" r="100"/>
    </g>
    <circle cx="0" cy="0" r="92"  fill="none" stroke="#e8c870" stroke-opacity="0.7"
            stroke-width="1" stroke-dasharray="3 5"/>
    <circle cx="0" cy="0" r="128" fill="none" stroke="#e8c870" stroke-opacity="0.42"
            stroke-width="3.5" stroke-dasharray="0.1 6" stroke-linecap="round"/>
    <circle cx="0" cy="0" r="168" fill="none" stroke="#e8c870" stroke-opacity="0.18"
            stroke-width="0.6" stroke-dasharray="1 5"/>
    <g transform="scale(0.8)">{bars}</g>
  </g>'''

# Type is sized off the WIDTH, not the height: these two canvases share a
# width but not an aspect, and a height-derived size blows the 3:2 title
# clean through the safe area.
WIDE = [
    # stem, w, h, label, subject, headline, subhead
    ('creative-header', 3840, 1646, 'Product page header · 21:9', 'sigil',
     'Just talk. Kaiso builds the rest.', None),
    ('creative-search', 3840, 2560, 'Search results · 3:2', 'captures',
     'Just talk.', 'Kaiso asks what a good advisor would.'),
]

def wide_frame(w, h, label, subject_kind, headline, subhead, guides):
    n = int(150 * (w * h) / (1290 * 2796))
    body = '\n'.join('    ' + x for x in stars(w, h, n, 11))
    cx = w // 2
    safe = int(min(w, h) * 0.06)
    t_size = int(w * 0.047)

    def text(y, size, fill, weight, family, s, op=None):
        o = f' opacity="{op}"' if op else ''
        return (f'\n  <text x="{cx}" y="{y}" text-anchor="middle" '
                f'font-family="{family}, Helvetica Neue, Helvetica, Arial, sans-serif" '
                f'font-size="{size}" font-weight="{weight}" letter-spacing="-3" '
                f'fill="{fill}"{o}>{s}</text>')

    if subject_kind == 'sigil':
        # 21:9 is too short for a portrait phone — a capture ends up a stamp
        # in a wide field. The medallion is round, is the brand, and says
        # "voice" without a device: the one clear idea Apple asks a header
        # for. Its frontier ring is allowed to bleed past the safe area — a
        # 0.18-opacity halo is atmosphere, not content a crop can cost us.
        subject = (sigil(cx, int(h * 0.44), (h * 0.26) / 92)
                   + text(int(h * 0.90), t_size, INK_BRIGHT, 700,
                          'SF Pro Display', headline))
    else:
        # 3:2 has room for the interface, which is what Apple asks search
        # results to show. Three captures, not one: the width then has a job
        # and the row tells the whole product at a glance. All three sit
        # inside the safe area, so a crop takes background, never a device.
        slot_h = int(h * 0.545)
        slot_w = int(slot_h * 1290 / 2796)
        gap    = int(w * 0.028)
        sy     = int(h * 0.365)
        caps   = ''
        shots  = ('the conversation', 'the live caption', 'what it produced')
        x0     = cx - (len(shots) * slot_w + (len(shots) - 1) * gap) // 2
        for i, cap in enumerate(shots):
            x  = x0 + i * (slot_w + gap)
            mid = x + slot_w // 2
            caps += (
                f'\n  <rect x="{x}" y="{sy}" width="{slot_w}" height="{slot_h}" '
                f'rx="{int(slot_w*0.07)}" fill="#05040d" stroke="{GOLD}" '
                'stroke-opacity="0.22" stroke-width="3" stroke-dasharray="18 14"/>'
                f'\n  <text x="{mid}" y="{sy + slot_h//2 - 14}" text-anchor="middle" '
                'font-family="SF Pro Text, Helvetica Neue, Helvetica, Arial, sans-serif" '
                f'font-size="{int(t_size*0.28)}" fill="{GOLD}" opacity="0.55">{cap}</text>'
                f'\n  <text x="{mid}" y="{sy + slot_h//2 + 50}" text-anchor="middle" '
                'font-family="SF Pro Text, Helvetica Neue, Helvetica, Arial, sans-serif" '
                f'font-size="{int(t_size*0.24)}" fill="{GOLD}" opacity="0.4">'
                f'{slot_w} × {slot_h}</text>'
            )
        subject = (sigil(cx, int(h * 0.125), (h * 0.048) / 92)
                   + text(int(h * 0.245), t_size, INK_BRIGHT, 700,
                          'SF Pro Display', headline)
                   + text(int(h * 0.300), int(t_size * 0.42), GOLD_BRIGHT, 400,
                          'SF Pro Text', subhead, '0.82')
                   + caps)

    overlay = '' if not guides else (
        f'\n  <rect x="{safe}" y="{safe}" width="{w-safe*2}" height="{h-safe*2}" rx="{safe}"\n'
        f'        fill="none" stroke="#ff4d4d" stroke-opacity="0.3" stroke-width="3" '
        'stroke-dasharray="26 20"/>\n'
        f'  <text x="{safe + 24}" y="{h - safe - int(t_size*0.14)}" text-anchor="start"\n'
        '        font-family="SF Pro Text, Helvetica Neue, Helvetica, Arial, sans-serif"\n'
        f'        font-size="{int(t_size*0.2)}" fill="#ff4d4d" opacity="0.55">'
        'safe area — keep wording inside this; Apple crops the edges</text>'
    )

    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
  <title>KaizenOS — {label}{' (with guides)' if guides else ''}</title>
  <desc>Creative asset. Focal point centred because Apple crops these
  differently across devices and placements. Background is opaque: no alpha.</desc>

  <defs>
    <radialGradient id="void" cx="0.5" cy="0.4" r="0.82">
      <stop offset="0%" stop-color="#0a0817"/>
      <stop offset="55%" stop-color="#04030a"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>
    <radialGradient id="neb1" cx="0.26" cy="0.3" r="0.55">
      <stop offset="0%" stop-color="#4b3278" stop-opacity="0.32"/>
      <stop offset="70%" stop-color="#4b3278" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="neb2" cx="0.78" cy="0.72" r="0.5">
      <stop offset="0%" stop-color="#785032" stop-opacity="0.22"/>
      <stop offset="70%" stop-color="#785032" stop-opacity="0"/>
    </radialGradient>{SIGIL_DEFS}
  </defs>

  <rect width="{w}" height="{h}" fill="#000000"/>
  <rect width="{w}" height="{h}" fill="url(#void)"/>
  <rect width="{w}" height="{h}" fill="url(#neb1)"/>
  <rect width="{w}" height="{h}" fill="url(#neb2)"/>

  <g id="stars">
{body}
  </g>

  {subject}{overlay}
</svg>
"""

for stem, w, h, label, kind, headline, subhead in WIDE:
    for guides in (False, True):
        name = f'{stem}-guides.svg' if guides else f'{stem}.svg'
        (here / name).write_text(wide_frame(w, h, label, kind, headline, subhead, guides))
        print(f'{name:<30} {w} × {h}   {label}')
