  // ─── Shooting stars between core and moon orbit ──────────
  (function shootingStars() {
    const NS = 'http://www.w3.org/2000/svg';
    const g = document.getElementById('shooters-g');
    const R_INNER = 150;   // start outside Kaiso core
    const R_OUTER = 215;   // end inside moon orbit (240)

    function spawn() {
      // pick a random angle, random tangential offset, random length
      const a = Math.random() * Math.PI * 2;
      const lenT = 30 + Math.random() * 70;          // streak length along tangent
      const r = R_INNER + Math.random() * (R_OUTER - R_INNER);
      // start point
      const sx = r * Math.cos(a);
      const sy = r * Math.sin(a);
      // tangential direction
      const tx = -Math.sin(a);
      const ty =  Math.cos(a);
      const dir = Math.random() < 0.5 ? 1 : -1;
      const ex = sx + tx * lenT * dir;
      const ey = sy + ty * lenT * dir;

      const line = document.createElementNS(NS, 'line');
      line.setAttribute('class', 'shooter');
      line.setAttribute('x1', sx.toFixed(2));
      line.setAttribute('y1', sy.toFixed(2));
      line.setAttribute('x2', sx.toFixed(2));
      line.setAttribute('y2', sy.toFixed(2));
      // rotate gradient with the streak
      const ang = Math.atan2(ey - sy, ex - sx) * 180 / Math.PI;
      line.style.transformOrigin = `${sx}px ${sy}px`;
      line.setAttribute('transform', `rotate(${ang} ${sx} ${sy})`);
      g.appendChild(line);

      const dur = 700 + Math.random() * 700;
      const t0 = performance.now();
      function animate(now) {
        const t = Math.min(1, (now - t0) / dur);
        // ease-out
        const e = 1 - Math.pow(1 - t, 2.2);
        const cx = sx + (ex - sx) * e;
        const cy = sy + (ey - sy) * e;
        line.setAttribute('x2', cx.toFixed(2));
        line.setAttribute('y2', cy.toFixed(2));
        // fade in then out
        const op = t < 0.2 ? (t / 0.2) : (1 - (t - 0.2) / 0.8);
        line.setAttribute('opacity', Math.max(0, op).toFixed(3));
        if (t < 1) requestAnimationFrame(animate);
        else line.remove();
      }
      requestAnimationFrame(animate);
    }

    function loop() {
      spawn();
      // sometimes a quick double
      if (Math.random() < 0.25) setTimeout(spawn, 120 + Math.random() * 200);
      const next = 900 + Math.random() * 2200;
      setTimeout(loop, next);
    }
    setTimeout(loop, 600);
  })();
