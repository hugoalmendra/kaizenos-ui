/* ─── Auth gate (screen 0) ────────────────────────────────────────
 * Sign in / create account, ahead of the founder intake.
 *
 * Prototype only. There is no identity provider behind this: the
 * Google button pauses and continues, and any well-formed email and
 * password is accepted. The point is the flow and the states, not the
 * authentication.
 *
 * Deliberately NOT mocked: Google's own account-chooser and consent
 * screens. A button that starts the flow is standard OAuth UI; a
 * replica of Google's sign-in page is an impersonation of Google, and
 * that is not something to build even in a prototype.
 */
(function auth() {
  'use strict';

  const screen = document.querySelector('.screen[data-screen="0"]');
  if (!screen) return;

  const els = {
    kicker:  document.getElementById('authKicker'),
    title:   document.getElementById('authTitle'),
    sub:     document.getElementById('authSub'),
    divider: document.getElementById('authDivider'),
    google:  document.getElementById('authGoogle'),
    gLabel:  document.getElementById('authGoogleLabel'),
    email:   document.getElementById('authEmail'),
    pwd:     document.getElementById('authPwd'),
    pwd2:    document.getElementById('authPwd2'),
    confirm: document.getElementById('authConfirmWrap'),
    submit:  document.getElementById('authSubmit'),
    switch:  document.getElementById('authSwitch'),
  };

  const COPY = {
    in: {
      kicker: 'Sign In',
      title: 'Welcome <span class="accent">back.</span>',
      sub: 'Sign in to pick up where you left off.',
      divider: 'or sign in with email',
      google: 'Continue with Google',
      submit: 'Sign in',
      switch: 'New to Kaiso? <a class="link" role="button" tabindex="0" data-mode="up">Create an account</a>',
    },
    up: {
      kicker: 'Create Account',
      title: 'Start with <span class="accent">Kaiso.</span>',
      sub: 'Create an account, then tell Kaiso about your venture.',
      divider: 'or sign up with email',
      google: 'Sign up with Google',
      submit: 'Create account',
      switch: 'Already with Kaiso? <a class="link" role="button" tabindex="0" data-mode="in">Sign in</a>',
    },
  };

  let mode = 'in';

  function setMode(next) {
    mode = next === 'up' ? 'up' : 'in';
    const c = COPY[mode];
    els.kicker.textContent = c.kicker;
    els.title.innerHTML = c.title;
    els.sub.textContent = c.sub;
    els.divider.textContent = c.divider;
    els.gLabel.textContent = c.google;
    els.submit.textContent = c.submit;
    els.switch.innerHTML = c.switch;
    els.confirm.hidden = mode !== 'up';
    els.pwd.setAttribute('autocomplete', mode === 'up' ? 'new-password' : 'current-password');
    screen.querySelectorAll('.auth-tab').forEach((t) => {
      const on = t.dataset.mode === mode;
      t.classList.toggle('sel', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  function toast(msg) {
    // The landing page has no toast element; fall back to the field state.
    const el = document.getElementById('ktoast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 2600);
  }

  function reject(input, msg) {
    input.classList.add('invalid');
    input.focus();
    toast(msg);
    setTimeout(() => input.classList.remove('invalid'), 1600);
  }

  /* Hand the identity to the rest of the flow and move to the intake. */
  function signedIn(email) {
    try { sessionStorage.setItem('kaiso_auth_email', email); } catch (e) {}

    // Prefill everywhere the flow already asks for an address.
    const lead = document.getElementById('leadEmail');
    if (lead && !lead.dataset.userEdited) lead.value = email;
    const signup = document.getElementById('signupEmail');
    if (signup) signup.value = email;
    const sentTo = document.getElementById('sentTo');
    if (sentTo) sentTo.textContent = email;

    showChip(email);
    if (window.kaisoShowScreen) window.kaisoShowScreen(1);
  }

  /* A quiet reminder of who is signed in, at the top of the intake. */
  function showChip(email) {
    const head = document.querySelector('.screen[data-screen="1"] .ph');
    if (!head || head.querySelector('.auth-chip')) return;
    const badge = head.querySelector('.badge');
    const chip = document.createElement('span');
    chip.className = 'auth-chip';
    const initial = document.createElement('i');
    initial.textContent = (email[0] || '?').toUpperCase();
    const label = document.createElement('span');
    label.textContent = email;
    chip.append(initial, label);
    head.insertBefore(chip, badge || null);
    if (badge) badge.remove();
  }

  function pause(btn, ms, done) {
    const loading = window.KaisoLoader ? window.KaisoLoader.button(btn) : null;
    setTimeout(() => { if (loading) loading.close(); done(); }, ms);
  }

  /* ── wiring ── */
  screen.querySelectorAll('.auth-tab').forEach((t) =>
    t.addEventListener('click', () => setMode(t.dataset.mode)));

  screen.addEventListener('click', (e) => {
    const link = e.target.closest('[data-mode]');
    if (link && link.classList.contains('link')) { e.preventDefault(); setMode(link.dataset.mode); }
  });

  els.google.addEventListener('click', () => {
    // Stands in for the OAuth round trip.
    pause(els.google, 900, () => signedIn('hugo@nexgent.com'));
  });

  els.submit.addEventListener('click', () => {
    const email = els.email.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return reject(els.email, 'Enter a valid email address');
    }
    if (els.pwd.value.length < 8) {
      return reject(els.pwd, 'Use at least 8 characters');
    }
    if (mode === 'up' && els.pwd.value !== els.pwd2.value) {
      return reject(els.pwd2, 'The two passwords do not match');
    }
    pause(els.submit, 800, () => signedIn(email));
  });

  // Enter submits from either field.
  [els.email, els.pwd, els.pwd2].forEach((input) =>
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') els.submit.click(); }));

  setMode('in');
})();
