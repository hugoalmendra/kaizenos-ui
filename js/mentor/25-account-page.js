  // ─── Account — a page with its own nav, not a dropdown of modals ──
  //
  // Everything that was not the session itself hung off one dropdown
  // and opened as a modal over the stage: plan, documents, company,
  // feedback, the account itself. Ten items in a list is a menu you
  // read rather than scan, and five modals is five ways to lose your
  // place.
  //
  // It is a page now, in the same region a document opens in, with a
  // grouped nav down its left and the section beside it — the shape
  // the Settings page in IronPipeline uses, for the same reason.
  //
  // Nothing inside the sections was rebuilt. The panels are moved and
  // keep their ids, so the billing flows, the document upload, the
  // account sub-views and the company render all still find what they
  // are wired to. The items that are actions rather than sections —
  // the tour, cookie choices, sign out — forward the click to the
  // original menu button, so their wiring is untouched too.
  (function accountPage() {
    const menu = document.getElementById('accountMenu');
    const btn = document.getElementById('accountBtn');
    if (!menu || !btn) return;

    const icon = (sel) => {
      const el = menu.querySelector(sel + ' .ic') || document.querySelector(sel + ' .ic');
      return el ? el.cloneNode(true) : null;
    };

    // pane: a section of the page. act: forwards to the original item.
    const GROUPS = [
      { label: 'Your venture', items: [
        { id: 'company',  label: 'Your Company',   pane: 'companySurface', ic: '#companyOverviewBtn' },
        { id: 'kos',      label: 'Your Plan',      pane: 'panelKos',       ic: '[data-panel="plan"]' },
        { id: 'docs',     label: 'Your Documents', pane: 'panelDocs',      ic: '[data-panel="docs"]' },
      ] },
      { label: 'Session', items: [
        { id: 'plan',     label: 'Plan & Tokens',  pane: 'panelPlan',      ic: '[data-panel="plan"]' },
      ] },
      { label: 'Account', items: [
        { id: 'account',  label: 'Manage account', pane: 'panelAccount',   ic: '[data-panel="account"]' },
      ] },
      { label: 'Help', items: [
        { id: 'feedback', label: 'Give Feedback',  pane: 'panelFeedback',  ic: '[data-panel="feedback"]' },
        { id: 'tour',     label: 'Replay Tour',    act: '#tourReplay',     ic: '#tourReplay', closes: true },
      ] },
      { label: 'Legal', items: [
        { id: 'cookies',  label: 'Cookie choices', act: '#cookieChoices',  ic: '#cookieChoices' },
        { id: 'terms',    label: 'Terms',          href: 'https://kaizenos.ai/terms/',   ic: 'a[href*="/terms/"]' },
        { id: 'privacy',  label: 'Privacy',        href: 'https://kaizenos.ai/privacy/', ic: 'a[href*="/privacy/"]' },
      ] },
    ];

    const page = document.createElement('section');
    page.className = 'kacct';
    page.id = 'accountPage';
    page.setAttribute('aria-label', 'Account');
    page.innerHTML =
      '<div class="kacct-head">'
      + '<span class="tm-dot"></span>'
      + '<span class="kacct-ttl">Account</span>'
      + '<span class="kacct-sec" id="kacctSec"></span>'
      + '<button class="kacct-x" id="kacctClose" type="button" title="Close" aria-label="Close account">&#10005;</button>'
      + '</div>'
      + '<div class="kacct-body">'
      + '<nav class="kacct-nav" id="kacctNav" aria-label="Account sections"></nav>'
      + '<div class="kacct-main" id="kacctMain"></div>'
      + '</div>';
    document.body.appendChild(page);

    const navEl = page.querySelector('#kacctNav');
    const mainEl = page.querySelector('#kacctMain');
    const secEl = page.querySelector('#kacctSec');
    const panes = {};
    const rows = {};

    GROUPS.forEach((g) => {
      const h = document.createElement('div');
      h.className = 'kacct-grp';
      h.textContent = g.label;
      navEl.appendChild(h);

      g.items.forEach((it) => {
        const row = it.href ? document.createElement('a') : document.createElement('button');
        row.className = 'kacct-row';
        if (it.href) { row.href = it.href; row.target = '_blank'; row.rel = 'noopener'; }
        else row.type = 'button';
        const ic = icon(it.ic);
        if (ic) row.appendChild(ic);
        const lbl = document.createElement('span');
        lbl.className = 'kacct-row-lbl';
        lbl.textContent = it.label;
        row.appendChild(lbl);
        navEl.appendChild(row);
        rows[it.id] = row;

        if (it.pane) {
          const node = document.getElementById(it.pane);
          if (node) {
            node.classList.add('kacct-pane');
            mainEl.appendChild(node);
            panes[it.id] = { node, label: it.label };
          }
          row.addEventListener('click', () => show(it.id));
        } else if (it.act) {
          row.addEventListener('click', () => {
            const orig = document.querySelector(it.act);
            // Close first where the action needs the stage back.
            if (it.closes) close();
            if (orig) orig.click();
          });
        }
      });
    });

    // Sign out is not a section, so it does not sit in the list of them.
    const foot = document.createElement('div');
    foot.className = 'kacct-foot';
    const out = document.createElement('button');
    out.type = 'button';
    out.className = 'kacct-row danger';
    const outIc = icon('#signOutBtn');
    if (outIc) out.appendChild(outIc);
    const outLbl = document.createElement('span');
    outLbl.className = 'kacct-row-lbl';
    outLbl.textContent = 'Sign out';
    out.appendChild(outLbl);
    out.addEventListener('click', () => {
      const orig = document.getElementById('signOutBtn');
      close();
      if (orig) orig.click();
    });
    foot.appendChild(out);
    navEl.appendChild(foot);

    function show(id) {
      const p = panes[id];
      if (!p) return;
      Object.keys(panes).forEach((k) => panes[k].node.classList.toggle('on', k === id));
      Object.keys(rows).forEach((k) => rows[k].classList.toggle('active', k === id));
      secEl.textContent = p.label;
      mainEl.scrollTop = 0;
      // The sections render themselves on open; these are the hooks they
      // already expose for exactly that.
      if (id === 'company' && window.KaisoCompany) window.KaisoCompany.open();
      if (id === 'account') window.dispatchEvent(new Event('kaiso:open-account'));
      if (id === 'plan') {
        window.dispatchEvent(new CustomEvent('kaiso:open-plan', { detail: { context: 'menu' } }));
      }
      if (id === 'kos' && window.KaisoWheel) window.KaisoWheel.renderPlan();
      // The KOS indicator lights while the plan is the open section, so
      // every section change has to say which one it is.
      window.dispatchEvent(new CustomEvent('kaiso:account-section', { detail: { section: id } }));
    }

    let last = 'company';
    function open(id) {
      document.body.classList.add('account-open');
      menu.classList.remove('open');
      show(id && panes[id] ? (last = id) : last);
    }
    function close() {
      document.body.classList.remove('account-open');
      window.dispatchEvent(new CustomEvent('kaiso:account-section', { detail: { section: null } }));
      // The company surface locks body scroll while it is "open".
      if (window.KaisoCompany) window.KaisoCompany.close();
      document.body.style.overflow = '';
    }

    page.querySelector('#kacctClose').addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('account-open')) close();
    });

    window.KaisoAccountPage = { open, close, show, sections: Object.keys(panes) };
  })();
