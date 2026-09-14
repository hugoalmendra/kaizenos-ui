  // ─── Session HUD: session time, library, plan & sign out ────
  (function sessionHud() {
    const meter   = document.getElementById('tokenMeter');
    const countEl = document.getElementById('tokCount');
    const totalEl = document.getElementById('tokTotal');
    const barEl   = document.getElementById('tokBar');
    const rateEl  = document.getElementById('tokRate');
    const accountBtn  = document.getElementById('accountBtn');
    const accountMenu = document.getElementById('accountMenu');
    const modal       = document.getElementById('kmodal');
    const panelLibrary = document.getElementById('panelLibrary');
    const panelPlan    = document.getElementById('panelPlan');
    const panelExec    = document.getElementById('panelExec');
    const panelLanding = document.getElementById('panelLanding');
    const panelDeck    = document.getElementById('panelDeck');
    const panelPitch   = document.getElementById('panelPitch');
    const panelOrg     = document.getElementById('panelOrg');
    const panelBrand   = document.getElementById('panelBrand');
    const panelYcApply = document.getElementById('panelYcApply');
    const toast        = document.getElementById('ktoast');
    if (!meter || !accountBtn) return;

    // ─ State ─────────────────────────────────────────────────
    // Tokens stay the billing unit; the founder only ever sees time
    // (KAIZ-159). MIN_PER_TOKEN is a PLACEHOLDER, picked so the plan's
    // 500 tokens reads as the ≈ 8 h its copy promises. The real rate is
    // the 75th percentile of measured tokens per minute — a busier-than-
    // average minute — so a balance never runs out sooner than it says.
    const MIN_PER_TOKEN = 0.96;

    // Two kinds of time. Plan time is the month's allowance: it resets
    // at each renewal and never rolls over. Extra time is the free grant
    // and top-ups: it carries across months, top-ups for 12 months each.
    // Spend draws plan time first, then the oldest extra time.
    let planTokens = 0;
    let extra = [{ tokens: 48, expiresAt: null, kind: 'free' }];
    let total = 60;
    let plan = null;        // { renewsAt, cancelAt, pastDue } once subscribed
    let warnedLow = false;

    const extraTokens = () => extra.reduce((n, lot) => n + lot.tokens, 0);
    const balanceOf = () => planTokens + extraTokens();

    const minutesOf = (t) => Math.round(t * MIN_PER_TOKEN);

    // A balance is exact: a founder shown "5 min" must not run out in two.
    function fmtLeft(t) {
      const m = minutesOf(t);
      if (m < 60) return m + ' min';
      const h = Math.floor(m / 60), r = m % 60;
      return r ? h + ' h ' + r + ' min' : h + ' h';
    }

    // An allowance is a promise about the future, so it rounds to the
    // half hour rather than pretending to a precision it does not have.
    function fmtAllowance(t) {
      const half = Math.round((t * MIN_PER_TOKEN) / 30) / 2;
      const whole = Math.floor(half);
      return '≈ ' + (half % 1 ? (whole || '') + '½' : whole) + ' h';
    }

    const isLow = () => { const b = balanceOf(); return b > 0 && b <= total * 0.2; };

    function refilled() {
      total = Math.max(total, balanceOf());
      warnedLow = false;
      render();
    }

    const api = {
      MIN_PER_TOKEN, minutesOf, fmtLeft, fmtAllowance,
      state() {
        const dated = extra.filter((l) => l.expiresAt && l.tokens > 0);
        return {
          balance: balanceOf(), total, low: isLow(),
          planTokens, extraTokens: extraTokens(),
          extraExpiresAt: dated.length ? dated[0].expiresAt : null,
          plan: plan && Object.assign({}, plan),
        };
      },
      // A top-up is its own lot with its own expiry.
      addTopUp(tokens, expiresAt) {
        extra.push({ tokens, expiresAt, kind: 'topup' });
        refilled();
      },
      // Start or renew the plan: the allowance replaces what was left of
      // last month's, it is not added to it.
      setPlanTime(tokens) {
        planTokens = tokens;
        refilled();
      },
      setPlan(next) { plan = next ? Object.assign({}, next) : null; render(); },
    };
    window.KaisoTime = api;

    function render() {
      const balance = balanceOf();
      const low = isLow();
      countEl.textContent = fmtLeft(balance);
      totalEl.textContent = 'left';
      barEl.style.width = Math.max(0, Math.min(100, (balance / Math.max(total, 1)) * 100)) + '%';
      meter.classList.toggle('low', low);
      meter.classList.toggle('plan', !!plan);
      meter.classList.toggle('empty', balance === 0);
      meter.setAttribute('aria-label', fmtLeft(balance) + ' of session time left. Open Plan and Tokens.');
      rateEl.textContent = balance === 0 ? 'Paused · add time to resume'
        : plan && plan.pastDue ? 'Payment failed · update card'
        : low ? 'Running low · add time'
        : plan ? 'Monthly plan · live session'
        : 'Spending · live session';
      document.body.classList.toggle('time-paused', balance === 0);
      window.dispatchEvent(new CustomEvent('kaiso:time', { detail: api.state() }));
    }

    let toastTimer = null;
    function showToast(msg) {
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
    }

    // A plan is an allowance, not unlimited time, so it spends too.
    function spend(n) {
      if (balanceOf() <= 0) return;
      let left = n;
      const fromPlan = Math.min(planTokens, left);
      planTokens -= fromPlan;
      left -= fromPlan;
      for (const lot of extra) {
        if (!left) break;
        const take = Math.min(lot.tokens, left);
        lot.tokens -= take;
        left -= take;
      }
      extra = extra.filter((lot) => lot.tokens > 0);
      render();
      if (balanceOf() === 0) {
        // Paused, not ended: the session is held and resumes on top-up.
        showToast('Out of time — Kaiso paused, nothing is lost');
        openPanel('plan', 'paused');
      } else if (!warnedLow && isLow()) {
        warnedLow = true;
        window.dispatchEvent(new CustomEvent('kaiso:time-low', { detail: api.state() }));
      }
    }

    meter.setAttribute('role', 'button');
    meter.setAttribute('tabindex', '0');
    meter.addEventListener('click', () => openPanel('plan'));
    meter.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPanel('plan'); }
    });

    // Live voice spend — ticks down while Kaiso is engaged.
    setInterval(() => { if (document.body.classList.contains('active')) spend(1); }, 4500);
    // Each typed turn costs a little more.
    const chatForm = document.getElementById('chatForm');
    if (chatForm) chatForm.addEventListener('submit', () => spend(2));

    // ─ Account menu ──────────────────────────────────────────
    accountBtn.addEventListener('click', (e) => { e.stopPropagation(); accountMenu.classList.toggle('open'); });
    document.addEventListener('click', (e) => {
      if (!accountMenu.contains(e.target) && e.target !== accountBtn) accountMenu.classList.remove('open');
    });
    accountMenu.querySelectorAll('[data-panel]').forEach((b) =>
      b.addEventListener('click', () => { accountMenu.classList.remove('open'); openPanel(b.dataset.panel); }));

    // ─ Modal ─────────────────────────────────────────────────
    function openPanel(which, context) {
      panelLibrary.classList.toggle('show', which === 'library');
      panelPlan.classList.toggle('show', which === 'plan');
      const panelKos = document.getElementById('panelKos');
      const kosInd = document.getElementById('kosIndicator');
      if (panelKos) panelKos.classList.toggle('show', which === 'kos');
      if (kosInd) {
        kosInd.classList.toggle('open', which === 'kos');
        kosInd.setAttribute('aria-expanded', which === 'kos' ? 'true' : 'false');
      }
      if (panelExec) panelExec.classList.toggle('show', which === 'exec');
      if (panelLanding) panelLanding.classList.toggle('show', which === 'landing');
      if (panelDeck) panelDeck.classList.toggle('show', which === 'deck');
      if (panelPitch) panelPitch.classList.toggle('show', which === 'pitch');
      if (panelOrg) panelOrg.classList.toggle('show', which === 'org');
      if (panelBrand) panelBrand.classList.toggle('show', which === 'brand');
      if (panelYcApply) panelYcApply.classList.toggle('show', which === 'yc');
      const panelFeedback = document.getElementById('panelFeedback');
      const panelAccount  = document.getElementById('panelAccount');
      if (panelFeedback) panelFeedback.classList.toggle('show', which === 'feedback');
      if (panelAccount)  panelAccount.classList.toggle('show', which === 'account');
      // Reopening the account panel always starts at the top level.
      if (which === 'account') window.dispatchEvent(new Event('kaiso:open-account'));
      if (which === 'plan') window.dispatchEvent(new CustomEvent('kaiso:open-plan', { detail: { context: context || 'menu' } }));
      if (which === 'yc' && window.kaisoYc) window.kaisoYc.render();
      modal.classList.add('open');
    }
    function closeModal() { modal.classList.remove('open'); }
    window.KaisoPanels = { open: openPanel, close: closeModal };
    modal.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeModal));

    window.addEventListener('kaiso:open-forge', (e) => {
      if (e.detail) openPanel(e.detail);
    });

    const applyYcBtnHud = document.getElementById('applyYcBtn');
    if (applyYcBtnHud) {
      applyYcBtnHud.addEventListener('click', (e) => {
        e.stopPropagation();
        openPanel('yc');
      });
    }

    // Capture Escape before the stage-dismiss handler when the modal is open.
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) { e.stopPropagation(); closeModal(); }
    }, true);

    // ─ Forged assets (exec, pitch, landing, org, brand, deck) ──
    const execDateEl = document.getElementById('execDate');
    if (execDateEl) {
      execDateEl.textContent = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    function printForge(docId, titlePrefix, styleKey) {
      const docEl = document.getElementById(docId);
      if (!docEl || !window.kaisoPrint) return;
      const coName = (docEl.querySelector('.exec-co, .land-logo, .deck-title, .brand-word') || {}).textContent || 'Venture';
      const dateStr = new Date().toISOString().slice(0, 10);
      const ok = window.kaisoPrint(
        docEl,
        coName.trim() + ' — ' + titlePrefix + ' (' + dateStr + ')',
        window.kaisoPrintStyles?.[styleKey] || ''
      );
      if (!ok) showToast('Allow popups to download the PDF');
    }

    document.getElementById('execDownloadBtn')?.addEventListener('click', () => printForge('execPrintable', 'Executive Summary', 'exec'));
    document.getElementById('landingExportBtn')?.addEventListener('click', () => {
      if (window.kaisoExportLandingCode?.()) showToast('Landing page code downloaded');
      else showToast('Export failed — open the landing page first');
    });
    document.getElementById('deckDownloadBtn')?.addEventListener('click', () => printForge('deckPrintable', 'Pitch Deck', 'deck'));
    document.getElementById('orgDownloadBtn')?.addEventListener('click', () => printForge('orgPrintable', 'Org Chart', 'org'));
    document.getElementById('brandDownloadBtn')?.addEventListener('click', () => printForge('brandPrintable', 'Brand Kit', 'brand'));

    // ─ Sign out ──────────────────────────────────────────────
    document.getElementById('signOutBtn').addEventListener('click', () => {
      accountMenu.classList.remove('open');
      showToast('Signing out…');
      setTimeout(() => { window.location.href = 'index.html'; }, 750);
    });

    render();
  })();
