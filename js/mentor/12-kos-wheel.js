  // ─── KOS wheel — show the pillar & node being filled, tint to match ──
  (function kosWheel() {
    // The 9 pillars of the Kaizen Operating System, with their wheel colours
    // and the nodes (fields) the founder fills under each. Mirrors the KOS tab.
    const PILLARS = [
      { id: 'company',    name: 'Company',    color: '#e06c5a',
        nodes: ['Mission', 'Vision', 'Wedge', 'Moat', 'Why Now', 'BHAG'] },
      { id: 'people',     name: 'People',     color: '#5cb85c',
        nodes: ['Founder Edge', 'Co-founders', 'Culture Code', 'First 5 Hires', 'Advisors', 'Org Shape'] },
      { id: 'product',    name: 'Product',    color: '#4a9de0',
        nodes: ['What it Is', 'Problem', 'Magic Moment', 'Roadmap', 'Traction', 'Distribution'] },
      { id: 'finance',    name: 'Finance',    color: '#d4a04a',
        nodes: ['The Ask', 'Use of Funds', 'Milestones', 'Unit Economics', 'Runway', 'Investor Returns'] },
      { id: 'goals',      name: 'Goals',      color: '#c25fa8',
        nodes: ['North Star', 'Quarterly OKRs', 'KPIs', 'Review Cadence', 'Top 3 Priorities'] },
      { id: 'systems',    name: 'Systems',    color: '#7a8b9c',
        nodes: ['Core Process', 'SOPs', 'Operating Rituals', 'Tooling Stack', 'Bottleneck'] },
      { id: 'technology', name: 'Technology', color: '#5fb8b8',
        nodes: ['Tech Stack', 'Architecture Bet', 'AI Posture', 'Security', 'Tech Debt'] },
      { id: 'playbooks',  name: 'Playbooks',  color: '#d8a566',
        nodes: ['GTM Playbook', 'Sales Motion', 'Onboarding', 'Retention', 'Expansion'] },
      { id: 'data',       name: 'Data',       color: '#9f7aea',
        nodes: ['Data Model', 'Data Moat', 'Dashboards', 'Experiment Engine', 'Governance'] },
    ];

    // Flatten into a single ordered walk through every node of every pillar.
    const STEPS = [];
    PILLARS.forEach((p) => p.nodes.forEach((n, i) =>
      STEPS.push({ pillar: p, node: n, nodeIndex: i })));

    const ind     = document.getElementById('kosIndicator');
    const tint    = document.getElementById('kosTint');
    const gem     = document.getElementById('kosGem');
    const pillarEl = document.getElementById('kosPillar');
    const nodeEl  = document.getElementById('kosNode');
    const countEl = document.getElementById('kosCount');
    if (!ind || !pillarEl) return;

    function hexToRgba(hex, a) {
      const n = parseInt(hex.slice(1), 16);
      return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
    }

    let idx = 0;
    function render() {
      const step = STEPS[Math.max(0, Math.min(idx, STEPS.length - 1))];
      const c = step.pillar.color;
      pillarEl.textContent = step.pillar.name;
      nodeEl.textContent = step.node;
      if (countEl) countEl.textContent = (step.nodeIndex + 1) + ' / ' + step.pillar.nodes.length;
      if (gem) { gem.style.background = c; gem.style.boxShadow = '0 0 10px ' + c; }
      document.documentElement.style.setProperty('--kos-pillar-color', c);
      document.documentElement.style.setProperty('--kos-pillar-border', hexToRgba(c, 0.4));
      if (tint) tint.style.setProperty('--kos-color', hexToRgba(c, 0.22));
    }

    function advance() { if (idx < STEPS.length - 1) idx += 1; render(); }
    function reset() { idx = 0; render(); }

    // Public API — lets the harness drive the wheel precisely when it knows
    // exactly which pillar/node the conversation is on.
    window.KaisoWheel = {
      pillars: PILLARS,
      steps: STEPS,
      setStep(pillarId, nodeLabel) {
        const i = STEPS.findIndex((s) =>
          s.pillar.id === pillarId &&
          (!nodeLabel || s.node.toLowerCase() === String(nodeLabel).toLowerCase()));
        if (i >= 0) { idx = i; render(); }
      },
      next: advance,
      reset,
    };

    // Harness hook: dispatch new CustomEvent('kaiso:node', { detail:{ pillar, node } }).
    window.addEventListener('kaiso:node', (e) => {
      if (e.detail && e.detail.pillar) window.KaisoWheel.setStep(e.detail.pillar, e.detail.node);
    });
    // Otherwise, walk the wheel one node per exchange as the founder talks.
    window.addEventListener('kaiso:exchange', advance);
    window.addEventListener('kaiso-disengage', reset);

    render();
  })();
