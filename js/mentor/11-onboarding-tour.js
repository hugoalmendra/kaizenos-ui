  // ─── Onboarding tour — brief walkthrough on first landing ───
  (function onboardingTour() {
    const block  = document.getElementById('tourBlock');
    const spot   = document.getElementById('tourSpot');
    const tip    = document.getElementById('tourTip');
    const stepEl = document.getElementById('ttStep');
    const titleEl = document.getElementById('ttTitle');
    const bodyEl = document.getElementById('ttBody');
    const dotsEl = document.getElementById('ttDots');
    const nextBtn = document.getElementById('ttNext');
    const skipBtn = document.getElementById('ttSkip');
    if (!spot || !tip) return;

    const STEPS = [
      { sel: '.sacred', round: true, pad: -28,
        title: 'Welcome to Kaiso',
        body: 'Tap the sigil to begin. Kaiso listens and replies in real time — speak naturally, like a mentor across the table.' },
      { sel: '#tokenMeter', pad: 8,
        title: 'Your session time',
        body: 'Every session spends time. Track what’s left here — Kaiso warns you before it runs low, and a click adds more.' },
      { sel: '#readiness', pad: 8,
        title: 'Funding readiness',
        body: 'As you talk, Kaiso grades how fundable your venture looks — climb from F to A+ and watch your odds rise.' },
      { sel: '#accountBtn', round: true, pad: 6,
        title: 'Library, plan & account',
        body: 'Open your account for the Library of generated outputs, Plan & Tokens, and Sign out.' },
      { sel: '#scrollToggle', sel2: '#captionToggle', pad: 6,
        title: 'Reading along',
        body: 'The Scribe keeps the full transcript and lets you type instead of talk. Beside it, CC puts the last sentence said on screen while you speak — leave it on, or turn it off here.' },
      { sel: '.sacred', round: true, pad: -28,
        title: 'You\u2019re ready',
        body: 'Tap the sigil whenever you\u2019re ready and start building your Pitch Deck, Landing Page & Executive Summary.' },
    ];

    let idx = 0;
    STEPS.forEach(() => { const i = document.createElement('i'); dotsEl.appendChild(i); });

    function place(i) {
      const step = STEPS[i];
      const el = document.querySelector(step.sel);
      if (!el) return;
      let r = el.getBoundingClientRect();
      // Some steps cover a pair of neighbouring controls: spotlight both.
      const el2 = step.sel2 ? document.querySelector(step.sel2) : null;
      if (el2) {
        const r2 = el2.getBoundingClientRect();
        const left = Math.min(r.left, r2.left), top = Math.min(r.top, r2.top);
        r = new DOMRect(left, top, Math.max(r.right, r2.right) - left,
                                   Math.max(r.bottom, r2.bottom) - top);
      }
      const pad = (step.pad != null) ? step.pad : 10;
      spot.style.width  = (r.width  + pad * 2) + 'px';
      spot.style.height = (r.height + pad * 2) + 'px';
      spot.style.top    = (r.top  - pad) + 'px';
      spot.style.left   = (r.left - pad) + 'px';
      spot.style.borderRadius = (step.round || step.sel2) ? (step.sel2 ? '999px' : '50%') : '16px';

      stepEl.textContent = 'Step ' + (i + 1) + ' of ' + STEPS.length;
      titleEl.textContent = step.title;
      bodyEl.textContent = step.body;
      nextBtn.textContent = (i === STEPS.length - 1) ? 'Enter Kaiso' : 'Next';
      dotsEl.querySelectorAll('i').forEach((d, k) => d.classList.toggle('on', k === i));

      // Position tooltip: below the target if it sits in the upper half, else above.
      const tipW = tip.offsetWidth || 268;
      const tipH = tip.offsetHeight || 150;
      let left = r.left + r.width / 2 - tipW / 2;
      left = Math.max(16, Math.min(window.innerWidth - tipW - 16, left));
      const cy = r.top + r.height / 2;
      let top;
      if (cy < window.innerHeight / 2) top = r.bottom + pad + 16;
      else top = r.top - pad - 16 - tipH;
      top = Math.max(16, Math.min(window.innerHeight - tipH - 16, top));
      tip.style.left = left + 'px';
      tip.style.top = top + 'px';
    }

    function start() {
      idx = 0;
      document.body.classList.add('tour');
      // wait a frame so revealed HUD elements have layout
      requestAnimationFrame(() => requestAnimationFrame(() => place(idx)));
    }
    function finish() {
      document.body.classList.remove('tour');
      try { localStorage.setItem('kaiso_onboarded', '1'); } catch (e) {}
    }
    function next() { if (idx >= STEPS.length - 1) { finish(); return; } idx++; place(idx); }

    nextBtn.addEventListener('click', next);
    skipBtn.addEventListener('click', finish);
    block.addEventListener('click', () => {}); // swallow clicks behind the tour
    window.addEventListener('keydown', (e) => {
      if (!document.body.classList.contains('tour')) return;
      if (e.key === 'Escape') { e.stopPropagation(); finish(); }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next(); }
    }, true);
    window.addEventListener('resize', () => { if (document.body.classList.contains('tour')) place(idx); });

    // Replay from the account menu
    const replay = document.getElementById('tourReplay');
    if (replay) replay.addEventListener('click', () => {
      const menu = document.getElementById('accountMenu');
      if (menu) menu.classList.remove('open');
      start();
    });

    // Auto-start on first landing (or when ?tour=1 is present).
    const forced = new URLSearchParams(location.search).get('tour') === '1';
    let onboarded = false;
    try { onboarded = localStorage.getItem('kaiso_onboarded') === '1'; } catch (e) {}
    if (forced || !onboarded) setTimeout(start, 800);
  })();
