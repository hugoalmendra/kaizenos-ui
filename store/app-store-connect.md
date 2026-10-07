# App Store Connect — listing copy

Paste-ready. Character counts are checked against Apple's limits in
`check.py`; run it after any edit.

Everything here describes the product as built. If the app ships without
one of these capabilities, cut the line rather than shipping a listing
that oversells — Apple rejects under 2.3.1 for describing functionality
the app does not have, and a founder who downloads on a promise and does
not find it leaves a one-star review that outlives the fix.

---

## App name · 30 max

The app is **KaizenOS**. Kaiso is the mentor inside it, and the two are not
interchangeable: a founder downloads KaizenOS and talks to Kaiso.

```
KaizenOS
```

The description uses both, which is correct, but it has to introduce the
relationship once before leaning on the mentor's name — otherwise someone
downloads one thing and reads about another. The opening line does that.

## Subtitle · 30 max

```
Talk. Kaiso builds the rest.
```

## Promotional text · 170 max

Changeable without a new review — use it for what is true this month.

```
Your first session is free. Talk for an hour and leave with an executive summary, a landing page and a deck built from what you actually said.
```

## Before pasting the description — check these against the build

Three passages describe things that exist in the prototype and the
backlog, not necessarily in the binary Ashvin is uploading. **Cut any that
are not in the build.** Apple rejects under 2.3.1 for describing
functionality the app does not have, and it is the kind of claim a
reviewer tests directly.

| Passage | Depends on | Status |
|---|---|---|
| "ASK FOR CHANGES IN WORDS" — the whole section | KAIZ-207 | **To Do. Cut it unless it shipped.** |
| The seven outputs listed under WHAT IT BUILDS | KAIZ-3 and the generator stories | Trim the list to what v1 actually forges |
| "Say something once and Kaiso carries it forward" | the profile write-back | Cut if the transcript does not yet feed later sessions |

The rest — spoken sessions, the nine pillars, the transcript, ownership,
no stored audio, the pricing — is true of the product as designed and
agreed. The pricing line matches the build: $29 for ≈ 8 h, plan always
the lowest per hour.

## Description · 4000 max

```
Most founders know what to do. They just don't know what order to do it in — and the work that proves a venture is real keeps getting pushed behind the work that feels urgent.

KaizenOS gives you Kaiso: a mentor you talk to. Not a form, not a chat window, but a spoken conversation about your company, in which the documents build themselves out of your answers.

HOW IT WORKS

Tell Kaiso about your venture. It listens, asks the question a good advisor would ask next, and turns the conversation into finished work. You talk; the artifacts form in the background.

WHAT IT BUILDS

• Executive Summary — the one-pager investors ask for
• Landing Page — ready to publish
• Pitch Deck — structured the way a seed deck is expected to be
• Elevator Pitch — a one-liner, and 30, 60 and 90 second versions
• Org Chart — who you have, and the roles you are missing
• Brand Kit — marks, palette and type, in one place
• YC Application — the questions answered in your own words

NINE PILLARS

Kaiso works through a map of the business, not a list of prompts: Company, People, Product, Finance, Goals, Systems, Technology, Playbooks and Data. It tracks what you have covered and what is still thin, so the next session picks up where the last one stopped.

IT KEEPS EVERY WORD

Every session is transcribed and kept. The scribe is the record — searchable, yours, and the source your documents are generated from. Say something once and Kaiso carries it forward.

ASK FOR CHANGES IN WORDS

Read the deck, decide the problem slide is too soft, and say so. Kaiso rewrites the part you pointed at and remembers the correction, so your other documents say it the same way.

WHAT YOU OWN

Everything Kaiso forges is yours. Use it to raise, to sell, to publish, without paying us anything further.

YOUR VOICE

Sessions are spoken, so the app needs your microphone. Your speech is converted to text live and the audio is never stored — not by us and not by our voice provider. The transcript is what persists, and you can delete it whenever you like.

TIME, NOT TOKENS

A subscription is $29 a month for about eight hours with Kaiso. Top-ups are available if you need more, and the plan is always the lower price per hour. Your first session is free, and nothing you say is ever lost when time runs out.

Kaiso is a mentor, not an advisor in the regulated sense. It does not provide legal, tax, accounting, financial or investment advice, and what it writes should be read before you rely on it.
```

## Keywords · 100 max

Comma separated, no spaces after commas — a space costs a character.
Words already in the app name and subtitle are indexed separately, so
they are not repeated here.

```
founder,startup,pitch,deck,investor,fundraise,venture,business,plan,mentor,coach,advisor,strategy
```

## Copyright

App Store Connect prepends the © itself.

```
2026 Kaizen Business Mastery LLC
```

---

## Screenshots — these have to come from the real build

I cannot produce these and neither should a designer. Apple requires
screenshots to show the app as it actually is (guideline 2.3.3);
rendering them from mockups is a rejection risk and, worse, sets an
expectation the build has to meet on download.

**Sizes.** One set at **6.9"** is enough — 1320 × 2868 or 1290 × 2796 px,
portrait. Apple scales that set down for smaller iPhones. iPad sizes are
needed only if the app ships for iPad. Up to 10 per size; three to five
is the usual working number, and the first two are what almost everyone
actually sees.

**The set, in order.** Each line is the screen to capture and the caption
to put above it. The order is an argument, not a tour: what it is, what
you get, how it works, what it costs.

| # | Screen | Caption |
|---|---|---|
| 1 | Live session, Kaiso speaking (B3) | A mentor you talk to |
| 2 | Library with outputs ready (D1) | Your deck, summary and landing page — built from the conversation |
| 3 | Executive Summary open (D3) | Finished work, not notes |
| 4 | Ask Kaiso to change (D10) | Say what is wrong. It rewrites it. |
| 5 | Plan & Tokens (E3) | $29 a month. First session free. |

Captions sit **above** the device image, in the brand gold on the void
background, so the screenshot reads at thumbnail size in search results —
which is where the decision is actually made.

---

## Not on Ashvin's list, but needed before submission

* **Support URL** — a required field. There is no support page yet;
  `https://kaizenos.ai` works if it carries a contact route, otherwise one
  needs making.
* **Privacy Policy URL** — https://kaizenos.ai/privacy/ (done)
* **App Privacy questionnaire** — answer it from section 6 of the privacy
  policy, not from memory. It must account for audio and the vocal
  expression measurement, not only the transcript. A listing that
  contradicts the policy is a rejection and a contradiction on the record.
* **Age rating** — 18+ to match the Terms.
* **Category** — Business, most likely, with Productivity as secondary.
