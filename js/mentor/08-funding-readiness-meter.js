  // ─── Funding readiness meter — grade climbs as you talk ──────
  (function readinessMeter() {
    const root = document.getElementById('readiness');
    const gauge = document.getElementById('rdGauge');
    const gradeEl = document.getElementById('rdGrade');
    const verdictEl = document.getElementById('rdVerdict');
    const applyYcBtn = document.getElementById('applyYcBtn');
    if (!root || !gauge) return;
    const toast = document.getElementById('ktoast');
    let toastT;
    function showToast(msg) {
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(toastT);
      toastT = setTimeout(() => toast.classList.remove('show'), 2800);
    }
    // Verdict tiers — top to bottom by score threshold.
    const TIERS = [
      { min: 85, grade: 'A+', verdict: 'Likely to get funded' },
      { min: 70, grade: 'A',  verdict: 'Investor-ready' },
      { min: 55, grade: 'B',  verdict: 'Gaining traction' },
      { min: 40, grade: 'C',  verdict: 'Taking shape' },
      { min: 20, grade: 'D',  verdict: 'Early signal' },
      { min: 0,  grade: 'F',  verdict: 'Just getting started' },
    ];
    let exchanges = 0;
    let celebrated = false;
    // Ease-out curve: big early gains, then a satisfying climb toward A+.
    function scoreFor(n) { return Math.round(100 * (1 - Math.pow(0.78, n))); }
    function tierFor(s) { return TIERS.find((t) => s >= t.min) || TIERS[TIERS.length - 1]; }
    function render() {
      if (exchanges === 0) {
        gauge.style.setProperty('--p', 0);
        gradeEl.textContent = '—';
        verdictEl.textContent = 'Talk with Kaiso to begin';
        root.classList.remove('funded');
        if (applyYcBtn) applyYcBtn.hidden = true;
        return;
      }
      const score = scoreFor(exchanges);
      const tier = tierFor(score);
      gauge.style.setProperty('--p', score);
      gradeEl.textContent = tier.grade;
      verdictEl.textContent = tier.verdict;
      const funded = tier.grade === 'A+';
      root.classList.toggle('funded', funded);
      if (applyYcBtn) applyYcBtn.hidden = !funded;
      if (funded && !celebrated) {
        celebrated = true;
        showToast('A+ — your venture is likely to get funded');
      }
    }
    window.addEventListener('kaiso:exchange', () => { exchanges += 1; render(); });
    render();
  })();
