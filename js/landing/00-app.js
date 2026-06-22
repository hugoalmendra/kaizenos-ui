  const SCREEN_COUNT = document.querySelectorAll('.screen').length;
  let current = 1;

  // Clone glyph crests
  const tpl = document.querySelector('#glyphTpl .glyph-g');
  document.querySelectorAll('[data-crest]').forEach(slot => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '-70 -70 140 140');
    svg.appendChild(tpl.cloneNode(true));
    slot.appendChild(svg);
  });

  function show(id) {
    id = Math.max(1, Math.min(SCREEN_COUNT, id));
    current = id;
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', +s.dataset.screen === id));
    try { history.replaceState(null, '', '?s=' + id); } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Each screen advances through its own CTA buttons (final product flow).
  document.addEventListener('click', e => {
    const go = e.target.closest('[data-goto]');
    if (go) { e.preventDefault(); show(+go.dataset.goto); }
  });

  // Survey
  const opts = document.getElementById('surveyOpts');
  opts.addEventListener('click', e => {
    const o = e.target.closest('.opt');
    if (!o) return;
    opts.querySelectorAll('.opt').forEach(x => x.classList.remove('sel'));
    o.classList.add('sel');
  });
  let q = 1;
  document.getElementById('surveyNext').onclick = () => {
    if (q >= 6) { show(2); q = 1; updateSurvey(); return; }
    q++; updateSurvey();
  };
  function updateSurvey() {
    const pct = Math.round((q / 6) * 100);
    document.getElementById('qNum').textContent = q;
    document.getElementById('qPct').textContent = pct + '%';
    document.getElementById('qBar').style.width = pct + '%';
    document.getElementById('surveyNext').textContent = q >= 6 ? 'Email me my report →' : 'Next';
  }

  // Carry the lead email into the confirmation screen
  const leadEmail = document.getElementById('leadEmail');
  if (leadEmail) leadEmail.addEventListener('input', () => {
    const v = leadEmail.value || 'you@venture.com';
    document.getElementById('sentTo').textContent = v;
    document.getElementById('signupEmail').value = v;
  });

  // Plan selection
  const planGrid = document.getElementById('planGrid');
  planGrid.addEventListener('click', e => {
    const p = e.target.closest('.plan');
    if (!p) return;
    planGrid.querySelectorAll('.plan').forEach(x => x.classList.remove('sel'));
    p.classList.add('sel');
  });

  // Deep-link via ?s=N
  const startId = parseInt(new URLSearchParams(location.search).get('s'), 10);
  show(Number.isFinite(startId) ? startId : 1);
