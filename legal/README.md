# Legal pages — Privacy Policy and Terms

Two self-contained pages for the App Store submission and the web app.
No build step and no dependencies — five files: `privacy.html`,
`terms.html`, `style.css`, `kaizenOS.png` and `favicon.png`.

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
`/terms` to them.

Do not give any of them a leading underscore. GitHub Pages runs Jekyll,
which silently drops files and folders that start with one: the pages
serve, the stylesheet 404s, and they render as unstyled text. The repo
root carries a `.nojekyll` file for the same reason. If that site's routing serves extensionless paths,
update the cross-links in the footers (`terms.html` → `/terms`).

## Fill these in before publishing

Every placeholder is marked in the source with `<span class="fill">` and
renders highlighted, so nothing can be missed by eye. Search for `fill`.

Filled in: Kaizen Business Mastery LLC, 6825 S 7th St #8208, Phoenix,
Arizona 85042; team@kaizenos.ai and +1 (408) 916-7923 for both privacy
and support; Arizona law and the Maricopa County courts.

Still open:

| Placeholder | Notes |
|---|---|
| `[DATE]` | Last updated and effective date, both files — set them when the documents are final, not before |
| Sub-processor table | The real auth, hosting, speech, AI model, email and analytics providers, six rows |
| Retention periods | Post-closure, tax records, logs |
| `[AMOUNT]` | The floor under the liability cap, in dollars |

## The company is in the US — what follows from that

There is no US equivalent of a European data protection authority, so the
policy names no single regulator over us. It routes complaints three ways
instead: to us first, then to the FTC or a state attorney general in the
US, or to the reader's own authority in the UK or EEA.

Two things still need deciding, and neither is a placeholder a lawyer can
fill from the file alone:

- **Governing law.** Written as Arizona, and the Maricopa County courts,
  because that is where the business is. If the LLC was actually formed in
  another state — Delaware and Wyoming are the usual ones, and a suite
  number at a Phoenix street address is often a registered-agent or
  mail-forwarding address rather than an office — say so and the clause
  should change with it.
- **An EU representative.** If founders in the EEA or the UK use
  KaizenOS, GDPR reaches a US company anyway, and Article 27 generally
  requires a named representative in the EEA — with a UK one as well for
  UK users. Nothing has been written into the policy claiming one exists,
  because none has been appointed. If the answer is that EU users are in
  scope, that appointment and a line naming them both belong here.

US companies commonly add an arbitration clause and a class-action
waiver to their terms. Deliberately not written in: it is a real choice
with real consequences for consumers, and it is the lawyer's call, not a
drafting default.

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
