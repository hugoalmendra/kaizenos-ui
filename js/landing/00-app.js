(function () {
  'use strict';

  // Screen ids are authored on the elements, not implied by count —
  // the auth gate is screen 0, so the range has to be read, not assumed.
  const IDS = [...document.querySelectorAll('.screen')].map((s) => +s.dataset.screen);
  const MIN = Math.min.apply(null, IDS);
  const MAX = Math.max.apply(null, IDS);
  let current = MIN;

  function show(id) {
    id = Math.max(MIN, Math.min(MAX, id));
    current = id;
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', +s.dataset.screen === id));
    try { history.replaceState(null, '', '?s=' + id); } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (id === 3) refreshReportPreview();
  }

  function refreshReportPreview() {
    if (!window.KaisoIntakeReport) return;
    var payload = window.KaisoIntakeReport.loadPayload();
    if (!payload) return;
    window.KaisoIntakeReport.updateInboxPreview(window.KaisoIntakeReport.build(payload));
  }

  window.kaisoShowScreen = show;

  // Activate the requested screen immediately so the panel is visible even if later init fails.
  const startId = parseInt(new URLSearchParams(location.search).get('s'), 10);
  show(Number.isFinite(startId) ? startId : MIN);

  const tpl = document.querySelector('#glyphTpl .glyph-g');
  if (tpl) {
    document.querySelectorAll('[data-crest]').forEach(slot => {
      if (slot.firstChild) return;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '-70 -70 140 140');
      svg.appendChild(tpl.cloneNode(true));
      slot.appendChild(svg);
    });
  }

  document.addEventListener('click', e => {
    const go = e.target.closest('[data-goto]');
    if (go) { e.preventDefault(); show(+go.dataset.goto); }
  });

  const leadEmail = document.getElementById('leadEmail');
  function syncLeadEmail(val) {
    const v = val || 'you@venture.com';
    if (leadEmail && !leadEmail.dataset.userEdited) leadEmail.value = v;
    const sentTo = document.getElementById('sentTo');
    if (sentTo) sentTo.textContent = leadEmail ? (leadEmail.value || v) : v;
    const signupEmail = document.getElementById('signupEmail');
    if (signupEmail && !signupEmail.dataset.userEdited) signupEmail.value = leadEmail ? (leadEmail.value || v) : v;
  }

  if (leadEmail) {
    leadEmail.addEventListener('input', () => {
      leadEmail.dataset.userEdited = '1';
      const sentTo = document.getElementById('sentTo');
      if (sentTo) sentTo.textContent = leadEmail.value || 'you@venture.com';
      const signupEmail = document.getElementById('signupEmail');
      if (signupEmail) signupEmail.value = leadEmail.value;
    });
  }

  function initIntake() {
    if (!window.KaisoIntakeForm) return;
    window.KaisoIntakeForm.init({
      onSubmit: function (payload) {
        var email = payload.founders && payload.founders[0] && payload.founders[0].founder_email;
        if (email) syncLeadEmail(email);
        if (window.KaisoIntakeReport) {
          window.KaisoIntakeReport.updateInboxPreview(window.KaisoIntakeReport.build(payload));
        }
        show(2);
      }
    });
  }

  try {
    initIntake();
  } catch (err) {
    console.error('Intake init failed; clearing draft and retrying.', err);
    if (window.KaisoIntakeStorage) window.KaisoIntakeStorage.clearDraft();
    try { initIntake(); } catch (retryErr) { console.error('Intake retry failed.', retryErr); }
  }

  const planGrid = document.getElementById('planGrid');
  if (planGrid) planGrid.addEventListener('click', e => {
    const p = e.target.closest('.plan');
    if (!p) return;
    planGrid.querySelectorAll('.plan').forEach(x => x.classList.remove('sel'));
    p.classList.add('sel');
  });

  var saved = window.KaisoIntakeStorage && window.KaisoIntakeStorage.loadFinal();
  if (saved && saved.founders && saved.founders[0] && saved.founders[0].founder_email) {
    syncLeadEmail(saved.founders[0].founder_email);
  }
  if (current === 3) refreshReportPreview();
})();
