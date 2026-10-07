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
