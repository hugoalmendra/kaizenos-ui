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

## State: published, not lawyer-reviewed

Both documents are complete and dated 30 September 2026. Nothing is left
blank.

They have **not** been reviewed by a lawyer. That was a deliberate,
informed decision, and the risk it leaves is worth naming precisely,
because it is not the one people assume:

- **Length is not the risk.** A shorter policy would have passed App Store
  review just as easily — Apple checks that the URL resolves and is a
  plausible policy, not whether it is accurate. Detail does not create
  liability.
- **Specificity is the risk, and also the protection.** These documents
  make checkable promises. Kept, they are the strongest defence there is.
  Broken, a specific promise is worse than a vague one, because it is a
  specific false statement.

So the thing to guard is not the wording. It is the three claims in
"Claims that must stay true" below, and the one dependency under "The
speech row".

## To deploy

1. Copy all five files to the marketing site and route `/privacy` and
   `/terms` to them.
2. Put those two URLs in App Store Connect, and in the app beside the
   subscription price and renewal wording.
3. Answer the App Store App Privacy questionnaire from the table in
   section 6, not from memory. If the two disagree, that is a rejection
   reason and, worse, a contradiction on the record.

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

## The voice provider is Hume, and it does more than transcribe

Hume AI runs the whole voice side: it converts speech to text, **measures
vocal expression** — tone, pace, emphasis — and generates Kaiso's voice.
Section 3 of the policy says all three, in that order, and says the middle
one plainly rather than burying it. Reading emotion from someone's voice
without telling them is the kind of omission that turns a privacy policy
into a misrepresentation, and it is the sort of thing that gets found.

Two things follow that are not the policy's job to fix:

- **Hume's retention setting is not verified.** The policy no longer
  claims that nobody retains the audio, because nobody has checked. It
  says what is true — KaizenOS keeps the transcript, not the audio, and we
  instruct Hume to keep nothing beyond producing the response — and offers
  the current position on request. **Check it, then tighten the sentence
  back.** This is the single highest-value thing on this list.
- **The app should say it too, not only this page.** Under the EU AI Act,
  people exposed to an emotion recognition system have to be told they
  are. A line at the moment the microphone is first requested does that
  far better than a policy nobody opens, and it is also just fair warning.

## Claims that must stay true

The policy states plainly that **voice audio is not stored** — streamed,
transcribed, discarded — and that **transcripts and documents are never
used to train AI models**. Both are commitments, not descriptions. If the
build ever retains audio or sends content to a provider that trains on
it, the policy has to change first.

The voice claim is now narrower than it was, on purpose: KaizenOS does not
store recordings, and Hume is instructed to keep nothing beyond producing
the response. It no longer asserts that Hume retains nothing, because that
has not been verified. Verify it and the stronger sentence can come back.

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
