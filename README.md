# KaizenOS UI

Standalone, dependency-free front-end for the KaizenOS (Kaiso) experience —
a landing page, the interactive voice-mentor app, and a founder-report email
template. No build step, no framework: just HTML, modular CSS, and modular
vanilla JS so the UI is easy to read, lift, and reuse.

## Pages

| File | What it is |
| --- | --- |
| `index.html` | Marketing / entry landing page. |
| `mentor.html` | The main interactive app — the "sacred" glyph, live chat scribe, session HUD (tokens · funding readiness · account), onboarding tour, and the Executive Summary one-pager. |
| `report-email.html` | Venture profile report email, populated from founder intake (`kaiso:founder-intake`). Table-based with **inline styles** on purpose (email-client safety). |

## Structure

```
kaizenos-ui/
├── index.html              # landing  → links css/landing + js/landing
├── mentor.html             # app      → links css/mentor  + js/mentor
├── report-email.html       # email    → self-contained (inline styles)
├── assets/
│   └── kaizenOS.png        # wordmark logo
├── css/
│   ├── mentor/             # 20 component stylesheets (00-base … 19-kos-wheel)
│   └── landing/            # 4 stylesheets (base, star-field, chrome, stage-panel)
└── js/
    ├── mentor/             # 12 feature modules (see below)
    └── landing/            # 00-app.js
```

CSS is split **by component**; JS is split **by feature**. Every file is
prefixed with a two-digit index that reflects load order.

### Mentor CSS components (`css/mentor/`)
`00-base` (theme variables + reset) · `01-star-field` · `02-stage` ·
`03-medallion-vs-compass` · `04-galaxy-backdrop` · `05-text-labels` ·
`06-activated-state` · `07-activation-flash` · `08-brand` ·
`09-funding-readiness-meter` · `10-chat-window` · `11-mobile-breakpoints` ·
`12-chat-bubbles` · `13-hud-rail` · `14-hud-token-meter` ·
`15-account-button-menu` · `16-modal` · `17-executive-summary` ·
`18-onboarding-tour` · `19-kos-wheel` (pillar/node indicator + ambient tint).

### Mentor JS features (`js/mentor/`)
`00-eye-galaxy-starfield` · `01-shooting-stars` · `02-compass-ticks` ·
`03-audio-bars` · `04-activation-flow` · `05-chat` (text + Web Speech STT/TTS
+ realtime voice) · `06-session-timer` · `07-output-forge` ·
`08-funding-readiness-meter` · `09-binary-clock` · `10-hud-controller` ·
`11-onboarding-tour` · `12-kos-wheel` (tracks the current pillar/node; tints the
background to match the KOS wheel colour; advances on each `kaiso:exchange`).

> **Load order matters.** These are plain (non-module) scripts that share the
> global scope, so they must stay in the numbered order in `mentor.html`.
> Later files reference values defined by earlier ones.

## Running locally

The pages are static. The simplest reliable way (some features need HTTP, not
`file://`) is a local server:

```bash
cd kaizenos-ui
python3 -m http.server 8000
# open http://localhost:8000/         (landing)
# open http://localhost:8000/mentor.html
```

Microphone (Web Speech STT) requires `https://` or `http://localhost`.

## Reusing a single component

Because each piece is isolated, you can lift one in two files. Example — reuse
the top HUD rail:

```html
<link rel="stylesheet" href="css/mentor/00-base.css">     <!-- theme vars -->
<link rel="stylesheet" href="css/mentor/13-hud-rail.css">
<link rel="stylesheet" href="css/mentor/14-hud-token-meter.css">
<link rel="stylesheet" href="css/mentor/15-account-button-menu.css">
<link rel="stylesheet" href="css/mentor/09-funding-readiness-meter.css">
<script src="js/mentor/10-hud-controller.js"></script>
```

Copy the matching markup out of `mentor.html` (the `.hud-top` block) and the
gold theme variables live in `00-base.css`.

## Backend (chat & voice)

The visual UI, tour, and HUD run with no backend. The **chat and voice**
features in `js/mentor/05-chat.js` call an external "harness" API. Configure it
without editing code:

```html
<!-- before the mentor scripts -->
<script>window.KAISO_CONFIG = { apiUrl: "https://your-harness.example.com" };</script>
```

Or via URL params: `?api=…&principal=…&lang=…&voice=…&stt=0&tts=0`.
When `apiUrl` is empty the app assumes a same-origin harness.

## Deploying

Any static host works (GitHub Pages, Netlify, etc.). It's already structured so
the repo root is the web root — point the host at the project root and
`index.html` is served.

## Notes

- Product copy still reads "Kaiso" throughout; only the logo is KaizenOS. Renaming the visible text is a separate pass.
- The Executive Summary export ("print") inlines page styles via `document.styleSheets`; this works when served over HTTP, and degrades gracefully under `file://`.
