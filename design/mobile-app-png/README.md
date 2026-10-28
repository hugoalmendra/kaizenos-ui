# Flat renders of the mobile artboards

`python3 make.py` writes one PNG per artboard at 2x (780 × 1688), named so
they sort into the same order and pages as the prototype canvas:

    p4-09-D9-brand-kit.png

Headless Chrome renders them, because it is the engine the artboards were
designed against and nothing else here draws CSS radial gradients. Takes
about 90 seconds for all 45. `index.json` comes out alongside, carrying
each render's title, page, canvas position and source file.

**The PNGs are gitignored.** 22 MB of renders that regenerate from the
artboards in 90 seconds do not belong in the repo.

## In Figma

These are placed in **KaizenOS — Mobile screens (reference)**:
https://www.figma.com/design/AIEk3QJSNLdqiLEO48zSQu

Five pages — First run, Kaiso, Plan, Library, You — with the 45 frames at
the same grid positions as `../mobile-app/canvas.json` (5 columns, 470 ×
990 pitch). Frames are named by their canvas title, `A1 · Launch` through
`E8 · Plan · billed on web`.

**They are images, not editable layers.** That was the choice: a reference
wall to review, annotate and comment on. The HTML artboards stay the source
of truth — change a screen there, re-run `make.py`, re-upload.

If the file ever needs to become real design layers instead, the route is
the `html.to.design` plugin pointed at the published artboard URLs
(`https://hugoalmendra.github.io/kaizenos-ui/design/mobile-app/<Name>.dc.html`),
which are self-contained: inline CSS, inline SVG, no web fonts, and no
working JavaScript to wait for. The `support.js` reference in each file
404s and nothing depends on it.
