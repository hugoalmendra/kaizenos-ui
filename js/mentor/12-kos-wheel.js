  // ─── KOS wheel — pillar/node indicator, ambient tint, plan progress ──
  (function kosWheel() {
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

    const STEPS = [];
    PILLARS.forEach((p) => p.nodes.forEach((n, i) =>
      STEPS.push({ pillar: p, node: n, nodeIndex: i, stepIndex: STEPS.length })));

    const ind       = document.getElementById('kosIndicator');
    const tint      = document.getElementById('kosTint');
    const gem       = document.getElementById('kosGem');
    const pillarEl  = document.getElementById('kosPillar');
    const nodeEl    = document.getElementById('kosNode');
    const countEl   = document.getElementById('kosCount');
    const readyEl   = document.getElementById('kosReadyPct');
    const planReady = document.getElementById('planReadyPct');
    const planList  = document.getElementById('kosPlanList');
    const modal     = document.getElementById('kmodal');
    const panelKos  = document.getElementById('panelKos');
    if (!ind || !pillarEl) return;

    function hexToRgba(hex, a) {
      const n = parseInt(hex.slice(1), 16);
      return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
    }

    let idx = 0;
    const nodePct = new Array(STEPS.length).fill(0);

    function stepState(stepIndex) {
      if (stepIndex < idx) {
        return { pct: 100, status: 'Complete.', done: true, current: false };
      }
      if (stepIndex === idx) {
        const pct = nodePct[stepIndex] || 0;
        return {
          pct,
          status: pct > 0 ? 'In progress…' : 'Not started yet.',
          done: false,
          current: true,
        };
      }
      return { pct: 0, status: 'Not started yet.', done: false, current: false };
    }

    function overallReady() {
      let sum = 0;
      for (let i = 0; i < STEPS.length; i++) sum += stepState(i).pct;
      return Math.round(sum / STEPS.length);
    }

    function renderIndicator() {
      const step = STEPS[Math.max(0, Math.min(idx, STEPS.length - 1))];
      const c = step.pillar.color;
      pillarEl.textContent = step.pillar.name;
      nodeEl.textContent = step.node;
      if (countEl) countEl.textContent = (step.nodeIndex + 1) + ' / ' + step.pillar.nodes.length;
      if (gem) { gem.style.background = c; gem.style.boxShadow = '0 0 10px ' + c; }
      document.documentElement.style.setProperty('--kos-pillar-color', c);
      document.documentElement.style.setProperty('--kos-pillar-border', hexToRgba(c, 0.4));
      if (tint) tint.style.setProperty('--kos-color', hexToRgba(c, 0.22));
      const ready = overallReady();
      if (readyEl) readyEl.textContent = String(ready);
      if (planReady) planReady.textContent = String(ready);
    }

    function renderPlan() {
      if (!planList) return;
      const groups = PILLARS.map((p) => {
        const nodes = STEPS.filter((s) => s.pillar.id === p.id);
        const rows = nodes.map((s) => {
          const st = stepState(s.stepIndex);
          const cls = ['plan-node', st.done ? 'done' : '', st.current ? 'current' : ''].filter(Boolean).join(' ');
          const style = st.current ? ' style="--pillar-color:' + s.pillar.color + '"' : '';
          return '<div class="' + cls + '" data-step="' + s.stepIndex + '"' + style + '>' +
            '<div class="plan-node-main">' +
              '<span class="plan-node-name">' + s.node + '</span>' +
              '<span class="plan-node-status">' + st.status + '</span>' +
            '</div>' +
            '<span class="plan-node-pct">' + st.pct + '%</span>' +
          '</div>';
        }).join('');
        return '<div class="plan-pillar">' +
          '<div class="kp-lbl">' + p.name + '</div>' +
          '<div class="plan-nodes">' + rows + '</div>' +
        '</div>';
      }).join('');
      planList.innerHTML = groups;
    }

    function render() {
      renderIndicator();
      renderPlan();
    }

    function advance() {
      if (idx < STEPS.length) {
        nodePct[idx] = 100;
        if (idx < STEPS.length - 1) {
          idx += 1;
          nodePct[idx] = Math.max(nodePct[idx], 25);
        }
      }
      render();
    }

    function reset() {
      idx = 0;
      nodePct.fill(0);
      render();
    }

    function openPlan() {
      if (!modal || !panelKos) return;
      modal.querySelectorAll('.kpanel').forEach((p) => p.classList.remove('show'));
      panelKos.classList.add('show');
      modal.classList.add('open');
      ind.classList.add('open');
      ind.setAttribute('aria-expanded', 'true');
      renderPlan();
      const current = planList && planList.querySelector('.plan-node.current');
      if (current) current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function closePlan() {
      if (!modal) return;
      if (panelKos) panelKos.classList.remove('show');
      if (!modal.querySelector('.kpanel.show')) modal.classList.remove('open');
      ind.classList.remove('open');
      ind.setAttribute('aria-expanded', 'false');
    }

    ind.addEventListener('click', (e) => {
      e.stopPropagation();
      if (modal && modal.classList.contains('open') && panelKos && panelKos.classList.contains('show')) {
        closePlan();
      } else {
        openPlan();
      }
    });

    if (modal) {
      modal.querySelectorAll('[data-close]').forEach((el) => {
        el.addEventListener('click', () => {
          ind.classList.remove('open');
          ind.setAttribute('aria-expanded', 'false');
        });
      });
    }

    window.KaisoWheel = {
      pillars: PILLARS,
      steps: STEPS,
      overallReady,
      openPlan,
      closePlan,
      setStep(pillarId, nodeLabel) {
        const i = STEPS.findIndex((s) =>
          s.pillar.id === pillarId &&
          (!nodeLabel || s.node.toLowerCase() === String(nodeLabel).toLowerCase()));
        if (i < 0) return;
        for (let j = 0; j < i; j++) nodePct[j] = 100;
        idx = i;
        nodePct[i] = Math.max(nodePct[i], 25);
        render();
      },
      setNodeProgress(stepIndex, pct) {
        if (stepIndex >= 0 && stepIndex < nodePct.length) {
          nodePct[stepIndex] = Math.max(0, Math.min(100, pct));
          render();
        }
      },
      next: advance,
      reset,
    };

    window.addEventListener('kaiso:node', (e) => {
      if (e.detail && e.detail.pillar) window.KaisoWheel.setStep(e.detail.pillar, e.detail.node);
    });
    window.addEventListener('kaiso:exchange', advance);
    window.addEventListener('kaiso-disengage', reset);

    render();
  })();
