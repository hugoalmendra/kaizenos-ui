  // ─── Session HUD: token spend, library, plan & sign out ─────
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
    const panelYcApply = document.getElementById('panelYcApply');
    const planDetail   = document.getElementById('planDetail');
    const toast        = document.getElementById('ktoast');
    if (!meter || !accountBtn) return;

    // ─ State ─────────────────────────────────────────────────
    let balance = 48, total = 60, planActive = false;
    let selectedPlan = 'monthly', selectedPack = 250;
    const PACKS = [{ t: 100, p: '$6' }, { t: 250, p: '$12' }, { t: 600, p: '$24' }];

    function render() {
      countEl.textContent = balance;
      totalEl.textContent = planActive ? '∞' : total;
      const pct = planActive ? 100 : Math.max(0, Math.min(100, (balance / total) * 100));
      barEl.style.width = pct + '%';
      const low = !planActive && balance <= total * 0.2;
      meter.classList.toggle('low', low && balance > 0);
      meter.classList.toggle('plan', planActive);
      rateEl.textContent = planActive ? 'Monthly plan · active'
        : balance === 0 ? 'Out of tokens · add more'
        : low ? 'Running low · top up'
        : 'Spending · live session';
    }

    let toastTimer = null;
    function showToast(msg) {
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
    }

    function spend(n) {
      if (planActive || balance <= 0) return;
      balance = Math.max(0, balance - n);
      render();
      if (balance === 0) { showToast('Free tokens spent — add more time'); openPanel('plan'); }
    }

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
    function openPanel(which) {
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
      if (panelYcApply) panelYcApply.classList.toggle('show', which === 'yc');
      if (which === 'plan') renderPlanDetail();
      if (which === 'yc' && window.kaisoYc) window.kaisoYc.render();
      modal.classList.add('open');
    }
    function closeModal() { modal.classList.remove('open'); }
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

    // ─ Forged assets (exec, landing, deck) ─────────────────────
    const execDateEl = document.getElementById('execDate');
    if (execDateEl) {
      execDateEl.textContent = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    function printForge(docId, titlePrefix, styleKey) {
      const docEl = document.getElementById(docId);
      if (!docEl || !window.kaisoPrint) return;
      const coName = (docEl.querySelector('.exec-co, .land-logo, .deck-title') || {}).textContent || 'Venture';
      const dateStr = new Date().toISOString().slice(0, 10);
      const ok = window.kaisoPrint(
        docEl,
        coName.trim() + ' — ' + titlePrefix + ' (' + dateStr + ')',
        window.kaisoPrintStyles?.[styleKey] || ''
      );
      if (!ok) showToast('Allow popups to download the PDF');
    }

    document.getElementById('execDownloadBtn')?.addEventListener('click', () => printForge('execPrintable', 'Executive Summary', 'exec'));
    document.getElementById('landingDownloadBtn')?.addEventListener('click', () => printForge('landingPrintable', 'Landing Page', 'landing'));
    document.getElementById('deckDownloadBtn')?.addEventListener('click', () => printForge('deckPrintable', 'Pitch Deck', 'deck'));

    // ─ Plan selection ────────────────────────────────────────
    panelPlan.querySelectorAll('[data-plan]').forEach((c) =>
      c.addEventListener('click', () => {
        panelPlan.querySelectorAll('[data-plan]').forEach((x) => x.classList.remove('sel'));
        c.classList.add('sel');
        selectedPlan = c.dataset.plan;
        renderPlanDetail();
      }));

    function renderPlanDetail() {
      if (selectedPlan === 'monthly') {
        planDetail.innerHTML =
          '<div class="kp-lbl">Monthly plan</div>' +
          '<p class="kp-sub" style="margin:8px 0 14px">500 tokens every month, auto-renews. Cancel anytime — best for ongoing work with Kaiso.</p>' +
          '<button class="kbtn primary block" id="confirmPlan">Enroll · $29 / month</button>';
        planDetail.querySelector('#confirmPlan').addEventListener('click', () => {
          planActive = true; balance = 500; total = 500; render(); closeModal();
          showToast('Monthly plan active · 500 tokens');
        });
      } else {
        const chips = PACKS.map((p) =>
          '<button class="pack' + (p.t === selectedPack ? ' sel' : '') + '" data-pack="' + p.t + '">' +
          '<b>+' + p.t + '</b><span>' + p.p + '</span></button>').join('');
        planDetail.innerHTML =
          '<div class="kp-lbl">Buy tokens</div>' +
          '<div class="pack-grid">' + chips + '</div>' +
          '<button class="kbtn primary block" id="confirmBuy" style="margin-top:14px">Add tokens</button>';
        planDetail.querySelectorAll('[data-pack]').forEach((b) =>
          b.addEventListener('click', () => { selectedPack = +b.dataset.pack; renderPlanDetail(); }));
        planDetail.querySelector('#confirmBuy').addEventListener('click', () => {
          balance += selectedPack; total = Math.max(total, balance); render(); closeModal();
          showToast('Added ' + selectedPack + ' tokens');
        });
      }
    }

    // ─ Sign out ──────────────────────────────────────────────
    document.getElementById('signOutBtn').addEventListener('click', () => {
      accountMenu.classList.remove('open');
      showToast('Signing out…');
      setTimeout(() => { window.location.href = 'index.html'; }, 750);
    });

    render();
  })();
