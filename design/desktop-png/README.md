# Flat renders of the desktop screens

`python3 make.py` writes one PNG per screen at 2x. Takes about three
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
- `cdp.py` drives Chrome over the DevTools protocol and takes the shot
  when the driver says the state is set, not before.

Nothing reaches a network. The prototype's own calls fail and are caught
where they are made, which is what happens with the Wi-Fi off anyway.

**Why CDP and not `--headless --screenshot`.** That flag decides for
itself when a page is finished, and it decides wrong: it fires mid-paint
and a whole panel comes back missing — silently, and differently each
run. Two renders of the same 71 screens disagreed on 62 of them, and
three of the set that first went to Figma were wrong: Terms and Privacy
part-rendered, and "Ask Kaiso to change · the way in" with no panel at
all. Chasing it through GPU flags and parallelism did not fix it, and both
of those turned out to be red herrings: `--disable-gpu` does not drop
backdrop-filter, it just loses the race more often. The only honest fix
was to stop guessing. The driver now raises
`data-shot-ready` when the state is set and settled, and `cdp.py` waits
for that. One browser serves all 71 and the driver is injected with
`Page.addScriptToEvaluateOnNewDocument`, so nothing is written into the
repo to carry it and two runs at once cannot collide.

Three things the driver has to do that are worth knowing about:

- **Transitions are killed.** Chrome takes the shot early in virtual
  time, and a panel still easing in photographs as a ghost.
- **The ignition flash is cleared** after `K.engage()`. It is a frame of
  an animation, not a state, and at shot time it is a white sheet.
- **`K.freeze()`** stops timers longer than 800 ms, for the states that
  exist only between two of them — "Confirming payment", "Outcome
  unknown". Without it the clock runs straight past them. `hold()` then
  cancels every pending timer once the recipe has had `SETTLE`, which
  also stops the session meter ticking the balance down between the
  state being set and the camera firing.

`Math.random` is seeded before any module runs, so the star field
scatters the same way every time and a re-render can be diffed against
the last one.

**The PNGs are gitignored.** 68 MB of renders that regenerate in three
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
