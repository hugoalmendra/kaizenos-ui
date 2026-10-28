# Flat renders of the desktop screens

`python3 make.py` writes one PNG per screen at 2x. Takes about four
minutes for all 71. `index.json` comes out alongside, carrying each
render's title, page, grid position, source file and the state recipe
that produced it.

Mobile is 45 static artboards, one file each, so `make.py` over there is
a loop over a directory. Desktop has no artboards — it has two running
prototypes, `index.html` (sign-in and the founder intake) and
`mentor.html` (the app) — so a screen here is a **state**, not a file:

- `screens.py` names every screen and the recipe that reaches it.
- `driver.js` is injected into a throwaway copy of the page. It exposes
  `K`, whose helpers drive the real modules through hooks the app already
  has — `K.engage()`, `K.exchanges(12)`, `K.panel('exec')`, `K.acct('refund')`,
  `K.intake(3)`. Nothing is a hand-built likeness of a state.
- Headless Chrome runs the clock forward with `--virtual-time-budget` and
  takes the shot.

Nothing reaches a network. The prototype's own calls fail and are caught
where they are made, which is what happens with the Wi-Fi off anyway.

Three things the driver has to do that are worth knowing about:

- **Transitions are killed.** Chrome takes the shot early in virtual
  time, and a panel still easing in photographs as a ghost.
- **The ignition flash is cleared** after `K.engage()`. It is a frame of
  an animation, not a state, and at shot time it is a white sheet.
- **`K.freeze()`** stops timers longer than 800 ms, for the states that
  exist only between two of them — "Confirming payment", "Outcome
  unknown". Without it the clock runs straight past them.

Each Chrome run gets its own `--user-data-dir`. A shared profile makes
Chrome treat the runs as one browser: it hands the URL to whichever
instance got there first and silently takes no shot.

**The PNGs are gitignored.** 62 MB of renders that regenerate in four
minutes do not belong in the repo.

## In Figma

These are placed in **KaizenOS — Desktop screens (reference)**:
https://www.figma.com/design/OyUCCo3hJoZYqoSrNVLiKa

Eight pages: A first run (17) · B stage (12) · C plan (9) · D library (4)
· E outputs (10) · F account (11) · G documents (6) · H legal (2).

The app screens are 1440 × 900 — the viewport, which is what the founder
sees, since the app scrolls inside its panels rather than down the page.
The entry flow and the standalone documents scroll the page, so those are
measured and captured whole, however tall they run.

**They are images, not editable layers.** Same choice as the mobile file:
a reference wall to review, annotate and comment on. The prototype stays
the source of truth — change it, re-run `make.py`, re-upload.

Turning these into real layers is harder than it was for mobile. The
`html.to.design` route works on the self-contained mobile artboards; the
desktop app is one page of 23 scripts and 36 stylesheets whose state only
exists at runtime, so a plugin pointed at it gets the dormant stage and
nothing else. The honest route would be rebuilding the screens as Figma
components, which is design work rather than a conversion.
