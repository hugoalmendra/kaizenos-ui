# Legal pages — Privacy Policy and Terms

Two self-contained pages for the App Store submission and the web app.
No build step and no dependencies — five files: `privacy.html`,
`terms.html`, `_style.css`, `kaizenOS.png` and `favicon.png`.

They wear the same chrome as the rest of KaizenOS: the void background,
the three star-field layers, the nebula, the fixed wordmark, and the
gold-hairline panel with the glow across its top edge. The values are
lifted from `css/landing/00-base.css`, `01-star-field.css` and
`03-stage-panel.css` rather than approximated, so a reader arrives from
the app and does not feel they have left it. The CSS is duplicated on
purpose: the folder has to survive being copied onto kaizenos.ai whole.

**These are drafts.** They are written around what KaizenOS actually
does, but they are binding documents and a qualified lawyer in the
entity's jurisdiction should review them before submission.

## Where they belong

Publish at **kaizenos.ai/privacy** and **kaizenos.ai/terms**, not on the
dev subdomain:

- The URLs go in the App Store listing and stay there. `dev.` reads as a
  development environment to a reviewer, and any URL that later gets
  retired, gated behind auth or password-protected breaks the listing.
- They must be reachable by anyone, with no sign-in. Product subdomains
  tend to end up behind a login; marketing sites do not.
- Apple checks that the Privacy Policy URL resolves and is a real policy.

Copy all five files into the marketing site and route `/privacy` and
`/terms` to them. If that site's routing serves extensionless paths,
update the cross-links in the footers (`terms.html` → `/terms`).

## Fill these in before publishing

Every placeholder is marked in the source with `<span class="fill">` and
renders highlighted, so nothing can be missed by eye. Search for `fill`.

| Placeholder | Notes |
|---|---|
| `[DATE]` | Last updated and effective date, both files |
| `[REGISTERED ADDRESS]`, `[COMPANY NUMBER]` | Kaizen Business Mastery's registered details |
| `[PRIVACY EMAIL]`, `[SUPPORT EMAIL]` | Aliases that will still exist in two years |
| `[SUPERVISORY AUTHORITY]` | The DPA where the entity is established |
| `[JURISDICTION]` | Governing law and courts |
| `[AMOUNT]` | Liability cap floor |
| Retention periods | Post-closure, tax records, logs |
| Sub-processor table | The real auth, hosting, speech, AI model, email and analytics providers |

## Claims that must stay true

The policy states plainly that **voice audio is not stored** — streamed,
transcribed, discarded — and that **transcripts and documents are never
used to train AI models**. Both are commitments, not descriptions. If the
build ever retains audio or sends content to a provider that trains on
it, the policy has to change first.

It also names Apple In-App Purchase as the payment path inside the iOS
app and Stripe on the web, which matches the mobile design: E4 is the
platform subscription sheet, E8 covers a founder who pays by card on the
web and should not be charged twice.
