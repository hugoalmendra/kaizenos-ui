  // ─── Eye galaxy starfield ──────────────────────────────
  (function buildGalaxyStars() {
    const NS_G = 'http://www.w3.org/2000/svg';
    const g = document.getElementById('galaxy-stars');
    if (!g) return;
    function inEye(x, y) {
      const r = 240;
      return (x*x + y*y) < (r*r) * 0.95;
    }
    const N = 220;
    let placed = 0, attempts = 0;
    while (placed < N && attempts < N * 14) {
      attempts++;
      const x = (Math.random() * 2 - 1) * 240;
      const y = (Math.random() * 2 - 1) * 240;
      if (!inEye(x, y)) continue;
      const c = document.createElementNS(NS_G, 'circle');
      c.setAttribute('cx', x.toFixed(1));
      c.setAttribute('cy', y.toFixed(1));
      const size = Math.random() < 0.85
        ? 0.4 + Math.random() * 0.7
        : 1.1 + Math.random() * 1.0;
      c.setAttribute('r', size.toFixed(2));
      const baseOp = 0.15 + Math.random() * 0.45;
      c.setAttribute('class', 'tw');
      c.style.setProperty('--ob',  baseOp.toFixed(2));
      c.style.setProperty('--td',  (1.6 + Math.random() * 4).toFixed(2) + 's');
      c.style.setProperty('--del', (Math.random() * 5).toFixed(2) + 's');
      g.appendChild(c);
      placed++;
    }
  })();
