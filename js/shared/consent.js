  // ─── Cookie consent ───────────────────────────────────────────
  // The policy says analytics cookies are set only where the reader has
  // agreed to them, so nothing analytical may run until this says so.
  //
  // The rules this follows, none of them decoration:
  //   · reject is as easy as accept — same size, same weight, first layer
  //   · analytics starts off, and nothing is pre-ticked
  //   · essential storage is never gated; the session has to work
  //   · the choice can be changed later, as easily as it was given
  //   · no cookie wall: refusing costs the visitor nothing
  //
  // Anything that loads a tracker waits for this:
  //     if (window.KaisoConsent.analytics()) startPostHog();
  //     window.addEventListener('kaiso:consent', (e) => { … e.detail.analytics … });
  (function cookieConsent() {
    // The published policy has one address, wherever the banner is shown.
    const PRIVACY_URL = 'https://kaizenos.ai/privacy/';
    const KEY = 'kaiso.consent';   // { analytics: bool, at: ISO, v: n }
    const VERSION = 1;             // bump to ask again after a material change

    let state = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.v === VERSION) state = parsed;
      }
    } catch (_) { /* private mode — treat as undecided, and never throw */ }

    function save(analytics) {
      state = { analytics: !!analytics, at: new Date().toISOString(), v: VERSION };
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {}
      window.dispatchEvent(new CustomEvent('kaiso:consent', { detail: { analytics: !!analytics } }));
      // Withdrawing has to actually take effect, not just be recorded.
      if (!analytics) clearAnalyticsCookies();
    }

    // Best effort: drop what a previous yes may have left behind.
    function clearAnalyticsCookies() {
      const host = location.hostname;
      const domains = ['', host, '.' + host, '.' + host.split('.').slice(-2).join('.')];
      document.cookie.split(';').forEach((c) => {
        const name = c.split('=')[0].trim();
        if (!/^(ph_|_posthog)/.test(name)) return;
        domains.forEach((d) => {
          document.cookie = name + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : '');
        });
      });
      try {
        Object.keys(localStorage)
          .filter((k) => /^(ph_|posthog)/.test(k))
          .forEach((k) => localStorage.removeItem(k));
      } catch (_) {}
    }

    /* ── the banner ── */
    let el = null;
    function build() {
      if (el) return el;
      el = document.createElement('section');
      el.className = 'consent';
      el.id = 'consent';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'false');
      el.setAttribute('aria-labelledby', 'consentTitle');
      el.innerHTML =
        '<div class="consent-body">' +
          '<p class="consent-title" id="consentTitle">Cookies</p>' +
          '<p class="consent-copy">KaizenOS needs a few cookies to sign you in and keep ' +
            'your session running. Separately, we would like to measure how the product is ' +
            'used, so we can fix what gets in your way. That part is up to you, and saying ' +
            'no changes nothing about how KaizenOS works for you.</p>' +
        '</div>' +
        '<div class="consent-acts">' +
          '<button type="button" class="consent-btn" data-consent="reject">Essential only</button>' +
          '<button type="button" class="consent-btn" data-consent="accept">Allow analytics</button>' +
          '<a class="consent-link" href="' + PRIVACY_URL + '" target="_blank" rel="noopener">Privacy Policy</a>' +
        '</div>';
      document.body.appendChild(el);
      el.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-consent]');
        if (!btn) return;
        save(btn.dataset.consent === 'accept');
        close();
      });
      return el;
    }

    function open() {
      build();
      requestAnimationFrame(() => el.classList.add('up'));
    }
    function close() {
      if (!el) return;
      el.classList.remove('up');
    }

    window.KaisoConsent = {
      // The only question a tracker should ask.
      analytics() { return !!(state && state.analytics); },
      decided() { return !!state; },
      // Reopen the choice — withdrawing has to be as easy as giving.
      open() {
        build();
        const yes = el.querySelector('[data-consent="accept"]');
        const no = el.querySelector('[data-consent="reject"]');
        const on = !!(state && state.analytics);
        // Filled = what you chose, not what we would prefer. On a first
        // visit there is no choice yet and neither is filled.
        yes.classList.toggle('primary', !!state && on);
        no.classList.toggle('primary', !!state && !on);
        yes.textContent = on ? 'Analytics are on' : 'Allow analytics';
        no.textContent = on ? 'Turn analytics off' : 'Essential only';
        open();
      },
      set(analytics) { save(analytics); close(); },
    };

    // Anything marked [data-consent-open] reopens the choice, on any page.
    document.addEventListener('click', (e) => {
      const t = e.target.closest('[data-consent-open]');
      if (!t) return;
      e.preventDefault();
      window.KaisoConsent.open();
    });

    // First visit, on whatever page they landed on — not only the landing page.
    if (!state) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(open, 900));
      } else {
        setTimeout(open, 900);
      }
    }
  })();
