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
      if (panelExec) panelExec.classList.toggle('show', which === 'exec');
      if (which === 'plan') renderPlanDetail();
      modal.classList.add('open');
    }
    function closeModal() { modal.classList.remove('open'); }
    modal.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeModal));
    // Capture Escape before the stage-dismiss handler when the modal is open.
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) { e.stopPropagation(); closeModal(); }
    }, true);

    // ─ Executive Summary ─────────────────────────────────────
    const execDateEl = document.getElementById('execDate');
    if (execDateEl) {
      execDateEl.textContent = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    const execOpenBtn = document.getElementById('execOpenBtn');
    if (execOpenBtn) {
      execOpenBtn.addEventListener('click', () => {
        if (execOpenBtn.disabled) return; // only when the artifact is forged
        openPanel('exec');
      });
    }
    const execDownloadBtn = document.getElementById('execDownloadBtn');
    if (execDownloadBtn) execDownloadBtn.addEventListener('click', downloadExecPDF);

    // Open the one-pager in a clean popup and trigger the browser's print → Save as PDF.
    function downloadExecPDF() {
      const docEl = document.getElementById('execPrintable');
      if (!docEl) return;

      const coName = (docEl.querySelector('.exec-co') || {}).textContent || 'Venture';
      const dateStr = new Date().toISOString().slice(0, 10);

      // Inline every readable stylesheet so the popup renders identically.
      let allCSS = '';
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules || []) allCSS += rule.cssText + '\n';
        } catch (e) { /* cross-origin — skip */ }
      }

      const printCSS = `
        html, body { height: auto !important; overflow: visible !important;
          background: #ffffff !important; margin: 0; padding: 0;
          -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body { display: block !important; padding: 28px;
          font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
        .exec-doc { background: #ffffff !important; border: none !important; box-shadow: none !important;
          max-width: 860px; margin: 0 auto; padding: 8px 4px !important; color: #1a1a1a !important; }
        .exec-banner { border-bottom: 1px solid #d8c98f !important; }
        .exec-banner-mark { color: #b78f1f !important; text-shadow: none !important; }
        .exec-eyebrow, .exec-sec-title, .es-val, .exec-foot-co, .exec-foot-mark { color: #8a6a1c !important; }
        .exec-co { color: #1a1a1a !important; }
        .exec-tag { color: #3a3a3a !important; }
        .exec-meta { color: #6a6a6a !important; }
        .exec-meta .exec-dot { color: #b78f1f !important; }
        .exec-sec-title { border-bottom: 1px solid #d8c98f !important; }
        .exec-sec-body { color: #2a2a2a !important; }
        .exec-sec-body b { color: #111 !important; }
        .exec-stat { background: #faf7ed !important; border: 0.5px solid #d8c98f !important; }
        .es-lbl { color: #5a4a1e !important; }
        .exec-foot { border-top: 1px solid #d8c98f !important; }
        .exec-foot-contact { color: #4a4a4a !important; }
        .exec-foot-mark { color: #6a6a6a !important; }
        .exec-sec, .exec-band, .exec-foot, .exec-banner { break-inside: avoid; page-break-inside: avoid; }
        @media print { @page { size: A4; margin: 14mm; } body { padding: 0; } .exec-doc { max-width: 100%; } }
      `;

      const safeName = String(coName).replace(/[<>&"]/g, '');
      const popupHTML = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">'
        + '<title>' + safeName + ' — Executive Summary (' + dateStr + ')</title>'
        + '<style>' + allCSS + printCSS + '</style></head><body>'
        + docEl.outerHTML
        + '<scr' + 'ipt>'
        + 'window.addEventListener("load",function(){'
        + 'var go=function(){setTimeout(function(){window.print();},250);};'
        + 'if(document.fonts&&document.fonts.ready){document.fonts.ready.then(go);}else{setTimeout(go,500);}'
        + '});'
        + 'window.addEventListener("afterprint",function(){setTimeout(function(){window.close();},300);});'
        + '</scr' + 'ipt></body></html>';

      const popup = window.open('', '_blank', 'width=900,height=1200,resizable=yes,scrollbars=yes');
      if (!popup) {
        showToast('Allow popups to download the PDF');
        return;
      }
      popup.document.open();
      popup.document.write(popupHTML);
      popup.document.close();
      popup.focus();
    }

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
