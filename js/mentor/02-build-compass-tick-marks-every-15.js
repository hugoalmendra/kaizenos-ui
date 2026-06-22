  // ─── Build compass tick marks (every 15°) ───────────────
  (function buildTicks() {
    const g = document.getElementById('compass-ticks');
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const major = i % 6 === 0;
      const r1 = major ? 110 : 116;
      const r2 = 124;
      const x1 = r1 * Math.cos(a), y1 = r1 * Math.sin(a);
      const x2 = r2 * Math.cos(a), y2 = r2 * Math.sin(a);
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      t.setAttribute('class', 'grid-tick');
      t.setAttribute('x1', x1.toFixed(2)); t.setAttribute('y1', y1.toFixed(2));
      t.setAttribute('x2', x2.toFixed(2)); t.setAttribute('y2', y2.toFixed(2));
      t.setAttribute('stroke-opacity', major ? '0.22' : '0.12');
      g.appendChild(t);
    }
  })();

  (function buildInnerOrbits() {
    const NS = 'http://www.w3.org/2000/svg';
    function populate(gid, count, radius, rad) {
      const g = document.getElementById(gid);
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 - Math.PI / 2;
        const x = radius * Math.cos(a);
        const y = radius * Math.sin(a);
        const m = document.createElementNS(NS, 'circle');
        m.setAttribute('class', 'moon');
        m.setAttribute('cx', x.toFixed(2));
        m.setAttribute('cy', y.toFixed(2));
        m.setAttribute('r', String(rad != null ? rad : 1));
        g.appendChild(m);
      }
    }
    populate('orbit-az-stars', 6, 146, 0.85);
    populate('orbit-a-stars', 8, 176, 0.7);
    populate('orbit-b-stars', 10, 207, 1);
    // Randomize Orbit B per-star animation delay + duration so the
    // blinks are sporadic instead of synchronized.
    document.querySelectorAll('.orbit-b .moon').forEach(m => {
      const delay = (Math.random() * 4).toFixed(2);
      const dur   = (1.8 + Math.random() * 2.6).toFixed(2);
      m.style.animationDelay    = delay + 's';
      m.style.animationDuration = dur   + 's';
    });
  })();

  (function buildMoons() {
    const moonsG = document.getElementById('moons');
    const N = 13;
    const R = 240;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 - Math.PI / 2;
      const x = R * Math.cos(a);
      const y = R * Math.sin(a);
      // a "lead" moon slightly larger to mark phase
      const isLead = i === 0;
      const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      glow.setAttribute('class', 'moon-glow');
      glow.setAttribute('cx', x); glow.setAttribute('cy', y);
      glow.setAttribute('r', isLead ? 3 : 2);
      moonsG.appendChild(glow);
      const m = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      m.setAttribute('class', 'moon');
      m.setAttribute('cx', x); m.setAttribute('cy', y);
      m.setAttribute('r', isLead ? 1.4 : 1);
      moonsG.appendChild(m);
    }
  })();
