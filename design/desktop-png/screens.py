# The desktop surface, screen by screen.
#
# The mobile set is 45 static artboards, one file each. Desktop is two
# running prototypes — the entry flow and the app — so a screen here is
# a state rather than a file: the recipe drives the real modules through
# their own public hooks and the shot is taken once it has settled.
#
# `recipe` is a function body, run after boot with `K` in scope.

MENTOR = 'mentor.html'   # the app
ENTRY = 'index.html'     # sign-in and the founder intake, before the app
W, H = 1440, 900         # the desktop viewport every screen is read at


def app(sid, title, page, recipe, src=MENTOR, w=W, h=H):
    return dict(id=sid, title=title, page=page, src=src, recipe=recipe, w=w, h=h, full=False)


def entry(sid, title, recipe):
    # The entry flow scrolls the document rather than a panel inside it,
    # so a screen here is as tall as it runs, never one screenful of it.
    s = app(sid, title, 'A · First run', recipe, src=ENTRY)
    s['full'] = True
    return s


def doc(sid, title, page, path, w=W):
    """A standalone page — captured whole, however tall it runs."""
    return dict(id=sid, title=title, page=page, src=path, recipe='', w=w, h=H, full=True)


# ── shared fragments ────────────────────────────────────────────
ENGAGE = "K.engage();"
# Twelve turns of talking: enough that every output has forged, the
# readiness meter has a verdict and the wheel has moved off its first node.
TALK = "K.engage(); K.exchanges(12); K.quiet();"
BUY = "K.panel('plan'); K.click('#buyContinue');"


SCREENS = [
    # ── A · Before the app ──────────────────────────────────────
    entry('a1', 'Sign in', "K.screen(0);"),
    entry('a2', 'Create account', "K.screen(0); K.click('[data-mode=\"up\"]');"),
    entry('a3', 'Founder intake · 1 Company', "K.intake(1);"),
    entry('a4', 'Founder intake · 2 Founders & Team', "K.intake(2);"),
    entry('a5', 'Founder intake · 3 Traction', "K.intake(3);"),
    entry('a6', 'Founder intake · 4 Legal & Corporate', "K.intake(4);"),
    entry('a7', 'Email opt-in', "K.screen(2);"),
    entry('a8', 'Check your inbox', "K.screen(3);"),
    entry('a9', 'Talk with Kaiso', "K.screen(4);"),
    entry('a10', 'Create your account', "K.screen(5);"),
    entry('a11', 'Free tokens granted', "K.screen(6);"),
    entry('a12', 'Voice session', "K.screen(7);"),
    entry('a13', 'Sneak peek', "K.screen(8);"),
    entry('a14', 'Choose plan & pay', "K.screen(9);"),
    entry('a15', 'Generated outputs', "K.screen(10);"),
    entry('a16', 'Outputs library', "K.screen(11);"),
    entry('a17', 'Returning sign-in', "K.screen(12);"),

    # ── B · Stage and session ───────────────────────────────────
    app('b1', 'Stage · dormant', 'B · Stage', ""),
    app('b2', 'Onboarding tour · 1 of 6', 'B · Stage', "K.tour(0);"),
    app('b3', 'Onboarding tour · 4 of 6', 'B · Stage', "K.tour(3);"),
    app('b4', 'Stage · Kaiso engaged', 'B · Stage', ENGAGE),
    app('b5', 'Live caption', 'B · Stage',
        ENGAGE + "window.KaisoCaption.say('kaiso', "
        "'So the wedge is agencies with ten to fifty people — who inside one feels this first?');"),
    app('b6', 'Scribe · conversation', 'B · Stage', ENGAGE + "K.scribe();"),
    app('b7', 'Scribe · earlier sessions', 'B · Stage', ENGAGE + "K.scribe(true);"),
    app('b8', 'Asset ready', 'B · Stage', "K.engage(); K.exchanges(8);"),
    app('b9', 'Funding readiness · ready to apply', 'B · Stage', TALK),
    app('b10', 'Time running low', 'B · Stage', ENGAGE + "K.low();"),
    app('b11', 'Account menu', 'B · Stage',
        TALK + "document.getElementById('accountMenu').classList.add('open');"),
    app('b12', 'Cookie choices', 'B · Stage', ENGAGE + "window.KaisoConsent.open();"),

    # ── C · Plan and tokens ─────────────────────────────────────
    app('c1', 'Plan & Tokens · choose', 'C · Plan', TALK + "K.panel('plan');"),
    app('c2', 'Plan & Tokens · top up', 'C · Plan',
        TALK + "K.panel('plan'); K.click('#panelPlan .plan-card[data-kind=\"pack\"]');"),
    app('c3', 'Checkout', 'C · Plan', TALK + BUY),
    app('c4', 'Checkout · confirming payment', 'C · Plan',
        TALK + BUY + "K.freeze(); K.click('[data-outcome=\"success\"]');"),
    app('c5', 'Checkout · verify with your bank', 'C · Plan',
        TALK + BUY + "K.click('[data-outcome=\"verify\"]');"),
    app('c6', 'Checkout · card declined', 'C · Plan',
        TALK + BUY + "K.click('[data-outcome=\"declined\"]');"),
    app('c7', 'Checkout · outcome unknown', 'C · Plan',
        TALK + BUY + "K.freeze(); K.click('[data-outcome=\"pending\"]');"),
    app('c8', 'Checkout · done', 'C · Plan',
        TALK + BUY + "K.click('[data-outcome=\"success\"]');"),
    app('c9', 'Out of time · session paused', 'C · Plan', TALK + "K.empty();"),

    # ── D · Library, plan, company ──────────────────────────────
    app('d1', 'Library · nothing forged yet', 'D · Library', ENGAGE + "K.panel('library');"),
    app('d2', 'Library · all six ready', 'D · Library', TALK + "K.panel('library');"),
    app('d3', 'Your plan · KOS nodes', 'D · Library', TALK + "K.panel('kos');"),
    app('d4', 'Your Company', 'D · Library', TALK + "window.KaisoCompany.open();"),

    # ── E · Outputs ─────────────────────────────────────────────
    app('e1', 'Elevator Pitch', 'E · Outputs', TALK + "K.panel('pitch');"),
    app('e2', 'Executive Summary', 'E · Outputs', TALK + "K.panel('exec');"),
    app('e3', 'Landing Page', 'E · Outputs', TALK + "K.panel('landing');"),
    app('e4', 'Org Chart', 'E · Outputs', TALK + "K.panel('org');"),
    app('e5', 'Brand Kit', 'E · Outputs', TALK + "K.panel('brand');"),
    app('e6', 'Pitch Deck', 'E · Outputs', TALK + "K.panel('deck');"),
    app('e7', 'YC Application Pack', 'E · Outputs', TALK + "K.panel('yc');"),
    app('e8', 'Ask Kaiso to change · the way in', 'E · Outputs',
        TALK + "K.panel('exec'); K.aim('#panelExec .exec-sec');"),
    app('e9', 'Ask Kaiso to change · the ask', 'E · Outputs',
        TALK + "K.panel('exec'); K.click('#panelExec .kedit-open'); K.top('#panelExec');"),
    app('e10', 'Ask Kaiso to change · changed', 'E · Outputs',
        TALK + "K.panel('exec'); K.click('#panelExec .kedit-open');"
        "K.click('#panelExec .kedit-chip'); K.top('#panelExec');"),

    # ── F · Account ─────────────────────────────────────────────
    app('f1', 'Manage account', 'F · Account', TALK + "K.acct('root');"),
    app('f2', 'Profile', 'F · Account', TALK + "K.acct('edit');"),
    app('f3', 'Add email', 'F · Account', TALK + "K.acct('add-email');"),
    app('f4', 'Verify email', 'F · Account', TALK + "K.acct('verify');"),
    app('f5', 'Password', 'F · Account', TALK + "K.acct('password');"),
    app('f6', 'Active devices', 'F · Account', TALK + "K.acct('devices');"),
    app('f7', 'Delete account', 'F · Account', TALK + "K.acct('delete');"),
    app('f8', 'Plan & billing', 'F · Account', TALK + "K.acct('billing');"),
    app('f9', 'Cancel plan', 'F · Account', TALK + "K.acct('cancel-plan');"),
    app('f10', 'Refund', 'F · Account', TALK + "K.acct('refund');"),
    app('f11', 'Give feedback', 'F · Account', TALK + "K.panel('feedback');"),
]

# ── G · The forged documents, whole ─────────────────────────────
for _i, (_stem, _name) in enumerate([
    ('elevator-pitch', 'Elevator Pitch'), ('executive-summary', 'Executive Summary'),
    ('landing-page', 'Landing Page'), ('org-chart', 'Org Chart'),
    ('brand-kit', 'Brand Kit'), ('pitch-deck', 'Pitch Deck'),
], 1):
    SCREENS.append(doc('g%d' % _i, _name + ' · whole document', 'G · Documents',
                       'store/outputs/%s.html' % _stem, w=900))

# ── H · Legal ───────────────────────────────────────────────────
SCREENS.append(doc('h1', 'Terms', 'H · Legal', 'legal/terms.html'))
SCREENS.append(doc('h2', 'Privacy', 'H · Legal', 'legal/privacy.html'))
