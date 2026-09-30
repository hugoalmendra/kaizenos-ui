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
Arizona 85042 — confirmed as a real Arizona address, so Arizona law and
the Maricopa County courts stand; team@kaizenos.ai and +1 (408) 916-7923
for both privacy and support; Clerk, AWS, Anthropic (Claude), Resend and
PostHog in the sub-processor table beside Stripe and Apple; 90 days to
delete after an account closes, seven years for billing and tax records,
90 days for logs, and a US$100 floor under the liability cap.

Still open:

| Placeholder | Notes |
|---|---|
| Sub-processor table | One row: speech. See below — it is the row the audio promise rests on |
| `[DATE]` | Last updated and effective date, both files. Set them at publication, not before |

## The company is in the US — what follows from that

There is no US equivalent of a European data protection authority, so the
policy names no single regulator over us. It routes complaints three ways
instead: to us first, then to the FTC or a state attorney general in the
US, or to the reader's own authority in the UK or EEA.

Governing law is Arizona and the Maricopa County courts, confirmed as the
place the business actually is rather than inferred from a mailing
address.

One question is still for the lawyer, and it is not a placeholder anyone
can fill from the file:

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

## The speech row is the one that matters

It is the only sub-processor that touches a founder's voice, and the
policy commits to audio being streamed, transcribed and discarded. That
claim is only as good as the contract with whoever does the transcribing,
so the row cannot be filled from a hunch.

The prototype proves nothing either way: it runs the browser's own
Web Speech API by default and an xAI Voice Agent behind `?voice=grok-realtime`.
Neither is a production decision.

Two consequences worth deciding before the row is written:

- **On iOS, if the app uses Apple's Speech framework, Apple is the speech
  processor** — recognition is sent to Apple's servers unless on-device
  recognition is forced. Apple then belongs in this table for that, not
  only for purchases.
- **If a realtime voice agent handles the whole exchange**, the same
  provider is doing speech *and* conversation, and the no-audio-retention
  promise rests entirely on its terms. Check them before the policy
  goes live, not after.

## Claims that must stay true

The policy states plainly that **voice audio is not stored** — streamed,
transcribed, discarded — and that **transcripts and documents are never
used to train AI models**. Both are commitments, not descriptions. If the
build ever retains audio or sends content to a provider that trains on
it, the policy has to change first.

A third claim arrives with PostHog: the policy says analytics cookies are
set **only where the reader has agreed to them**. That is the right
default, and it is now a commitment — for UK and EEA visitors the web app
needs a consent gate that actually holds PostHog back until they say yes,
and the mobile SDK needs the equivalent before it starts identifying a
device. Loading it on page one for everyone would contradict the policy.

It also names Apple In-App Purchase as the payment path inside the iOS
app and Stripe on the web, which matches the mobile design: E4 is the
platform subscription sheet, E8 covers a founder who pays by card on the
web and should not be charged twice.
