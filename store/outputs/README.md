# Example of every output

`./make.sh` writes one standalone HTML and one PDF per output, for
sending to people who are not going to click through the prototype.

| File | Pages | What it is |
|---|---|---|
| `elevator-pitch` | 2 | 30 / 60 / 90-second versions, with when to use each |
| `executive-summary` | 1 | the one-pager |
| `landing-page` | 1 | the deploy-ready page, as a document |
| `org-chart` | 1 | today and twelve months out, every role's reasoning |
| `brand-kit` | 3 | logo directions, palette, type, voice |
| `pitch-deck` | 6 | twelve slides, two to a page |

Each HTML file is self-contained: the markup is lifted from `mentor.html`
and the stylesheets are inlined, so it opens anywhere with no server, no
network and no JavaScript. **Nothing here is written by hand** — the
markup is read from the prototype, so these cannot drift from it.
Regenerate after changing an output rather than editing a file here.

The print rules come from `js/mentor/14-forged-assets.js`, the same ones
the Download-as-PDF buttons use, so what gets sent is what a founder
would get out of the product.

## Two things that were wrong and are worth not re-introducing

**`@page` cannot live in the shared base.** It used to sit in
`BASE_PRINT` alongside the colour overrides. Two `@page` rules in one
sheet do not resolve the way the cascade suggests: Chrome took the later
rule for the paper size but the earlier one for the layout width. Each
output now declares its own page and none inherit one.

**The deck is a portrait handout, not landscape.** Landscape is the
obvious answer and it does not work. Headless Chrome lays the page out
at the *portrait* width whatever `@page { size: A4 landscape }` says, and
scales the overflow by 210/297 to fit — which silently dropped four of
the twelve slides off the end. A minimal document of twelve 297mm-wide
blocks reproduces it exactly, so it is Chrome, not this CSS. Laying out
at the width Chrome is actually using avoids the scale, and every slide
survives. If someone "fixes" this back to landscape, count the pages:
six means all twelve slides, eight means four are gone.

## What is not here

The YC Application Pack and the session recap email are generated at
runtime rather than sitting in `mentor.html`, so they are not in this
set. Add them the same way if anyone asks.
