# KaizenOS Mobile App — screen designs

39 native-app screens at 390 × 844 (iPhone points), grouped into five
pages that mirror the app's information architecture. This folder is
the source of truth for the designs: every screen is a self-contained
HTML file, and the canvas layout is `canvas.json`.

There are three ways to use it, from quickest to most capable.

## 1. Just look at the screens (no Claude needed)

Open the gallery on GitHub Pages:

    https://hugoalmendra.github.io/kaizenos-ui/design/mobile-app/

Or locally, from the repo root:

```bash
python3 -m http.server 8080
# then open http://localhost:8080/design/mobile-app/
```

Every screen renders at its real size, grouped by page, with the same
titles as the canvas. Each `.dc.html` also opens directly in a browser
on its own.

## 2. Regenerate the design canvas in your own Claude account

The screens were built as a Claude Design canvas (an early preview that
runs inside Claude Code). The canvas cannot be shared across accounts
at the moment, but it can be rebuilt from this folder in a couple of
minutes, and the result is identical: same 39 artboards, same layout,
same page split, same sticky notes.

Prerequisites: Claude Code (desktop app, CLI, or the web version at
claude.ai/code) signed in to your own account, and a clone of this
repo.

1. Open Claude Code in the repo root (`kaizenos-ui`).
2. Start the design skill by typing `/design` and paste this brief:

   ```
   Rebuild a design canvas from the existing artboards in
   design/mobile-app/ EXACTLY as they are. Do not redesign, rewrite,
   restyle, rename or reorder anything. Use every .dc.html file in
   that folder as an artboard, design/mobile-app/canvas.json as the
   layout (keep its pages, positions, titles, launch view and
   annotations), and design/mobile-app/kaizenOS.png as the image.
   Title the canvas "KaizenOS Mobile App". Then give me the link.
   ```

3. Claude assembles the canvas from these files and saves it as an
   Artifact under your account. Open the link it gives you.

What you get is the full editor: pan and zoom across all screens,
click any element to inspect its exact CSS values in the properties
panel, edit text in place, and export PNG per artboard or one PDF of
everything. Saving from the canvas creates a new version for whoever
has the link.

To change a screen and keep the canvas in sync, edit the `.dc.html`
here, commit it, and run the same brief again. The files in this
folder win; treat the canvas as a viewer.

## 3. Read the source directly

Each `.dc.html` is plain HTML with inline styles and a `<style>` block
of tokens. There is no framework and no build step. Colours, spacing,
radii, font sizes and line heights are the values to implement, not
approximations. Icons are inline SVG on a 20/22/24 px stroke grid.

The `<script src="./support.js">` line and the trailing
`<script data-dc-script>` block are canvas plumbing. Ignore them; they
do nothing outside the canvas.

## Screen index

| Page | ID | Title | File |
|---|---|---|---|
| First run | A1 | Launch | `Main.dc.html` |
| First run | A2 | What Kaiso does | `Offer.dc.html` |
| First run | A3 | Create account | `SignUp.dc.html` |
| First run | A4 | Sign in | `SignIn.dc.html` |
| First run | A5 | Reset password | `ForgotPassword.dc.html` |
| First run | A6 | Intake · Company | `Intake.dc.html` |
| First run | A7 | Intake · Founders | `IntakeFounders.dc.html` |
| First run | A8 | Intake · Traction | `IntakeTraction.dc.html` |
| First run | A9 | Intake · Legal | `IntakeLegal.dc.html` |
| First run | A10 | Venture Profile | `VentureProfile.dc.html` |
| First run | A11 | Email opt-in | `EmailOptIn.dc.html` |
| First run | A12 | Report sent | `InboxSent.dc.html` |
| First run | A13 | Free time granted | `TokensGranted.dc.html` |
| First run | A14 | Forming backstage | `SneakPeek.dc.html` |
| Kaiso | B1 | Home · idle | `SessionIdle.dc.html` |
| Kaiso | B2 | Live · listening | `SessionHome.dc.html` |
| Kaiso | B3 | Live · speaking | `KaisoSpeaking.dc.html` |
| Kaiso | B4 | Scribe sheet | `Scribe.dc.html` |
| Kaiso | B5 | Asset ready | `AssetReady.dc.html` |
| Kaiso | B6 | Session recap | `SessionRecap.dc.html` |
| Kaiso | B7 | Time spent | `OutOfTokens.dc.html` |
| Kaiso | B8 | Connection lost | `SessionError.dc.html` |
| Kaiso | B9 | Offline | `Offline.dc.html` |
| Plan | C1 | Plan | `PlanTab.dc.html` |
| Plan | C2 | Pillar · Company | `KosPlan.dc.html` |
| Plan | C3 | Node detail | `NodeDetail.dc.html` |
| Library | D1 | Library | `Library.dc.html` |
| Library | D2 | Library · first run | `LibraryEmpty.dc.html` |
| Library | D3 | Executive Summary | `ExecSummary.dc.html` |
| Library | D4 | Landing Page | `LandingAsset.dc.html` |
| Library | D5 | Pitch Deck | `PitchDeck.dc.html` |
| Library | D6 | YC Application | `YCPack.dc.html` |
| You | E1 | You | `YouTab.dc.html` |
| You | E2 | Manage account | `Profile.dc.html` |
| You | E3 | Plan & Tokens | `PlanTokens.dc.html` |
| You | E4 | Purchase | `Checkout.dc.html` |
| You | E5 | Sessions | `Sessions.dc.html` |
| You | E6 | Notifications | `NotificationSettings.dc.html` |
| You | E7 | Feedback | `Feedback.dc.html` |

## Design decisions (from the canvas notes)

**Information architecture.** Restructured as a native app, not a port
of the web build. The web version is one canvas with everything stacked
on it as modals; that does not survive contact with a phone. Four tabs:
Kaiso (the session), Plan, Library, You. Progress and outputs are
destinations, not overlays. The session goes immersive: B1 is home with
the tab bar; the moment a session is live (B2, B3) the chrome recedes to
one line of context up top and one control row at the bottom (mute,
end, scribe). Time, not tokens: everywhere a founder sees their balance
it reads "14 min left". Tokens are the billing unit; minutes are what
they are spending. Safe areas are reserved, not drawn: 59pt top, 34pt
bottom. No fake status bar or keyboard in any screen.

**First run.** Intake is a stepped native form: nav bar with "Step n of
4" and a Skip, one thin progress rule, a large title, 44pt+ controls
throughout. A10 is the profile Kaiso builds from the intake; A11 and
A12 keep the emailed copy. Dropped: the standalone onboarding tour and
the mic priming screen. Mic permission is asked at the first tap of
Start talking, in context.

**Session states.** B4 the scribe is a real sheet with a grabber that
drags between peek and full. B5 replaces the old toast-plus-badge: a
ready asset arrives as a banner with a View action, on screen long
enough to act on (this is KAIZ-117). B7 sells more time at the moment it
runs out and says plainly that nothing was lost. B8 and B9 make the same
promise.

**Plan.** Three levels: all nine pillars (C1), the nodes inside one
(C2), a single node (C3). C3 shows what Kaiso already has, what is still
missing, the question it will ask next, and a button to go talk about
exactly that. Pillar colours are the wheel's own; node names match the
live build.

**Library.** A tab, not a modal. Assets are cards with real state;
tapping opens a full-screen document with a nav bar and the system
share sheet. D2 is the first-run empty state. `[YOUR RAISE AMOUNT]` on
D3 is a deliberate placeholder; do not ship it as written.

**You.** Replaces the corner dropdown. Time remaining is first on the
screen with an Add time action beside it. E3 sells hours, not tokens.
E4 is the platform subscription sheet (StoreKit / Play Billing), not the
web card form. E2 is redrawn out of the default Clerk chrome.

## Tokens

```
--gold:        #c8a84e
--gold-bright: #e8c870
--gold-soft:   #8a7434
--void:        #03030a
--ink:         #eae3c8
--line:        rgba(200,168,78,0.22)
--line-soft:   rgba(200,168,78,0.12)
font:          system UI stack (SF Pro on iOS, Roboto on Android)
```

Pillar colours: Company `#e06c5a`, People `#5cb85c`, Product `#4a9de0`,
Finance `#d4a04a`, Goals `#c25fa8`, Systems `#7a8b9c`, Technology
`#5fb8b8`, Playbooks `#d8a566`, Data `#9f7aea`.

## Related

- Jira: the mobile-app epics and stories in the KaizenOS project
  reference these screen IDs (A1 … E7).
- Web prototype these were derived from: `../../mentor.html` in this
  repo, live at https://hugoalmendra.github.io/kaizenos-ui/mentor.html
