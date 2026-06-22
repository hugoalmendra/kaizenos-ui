  // ─── Session timer — counts elapsed time while Kaiso is active ──
  (function sessionTimer() {
    const el = document.getElementById('sessionTimer');
    if (!el) return;
    const timeEl = el.querySelector('.st-time');
    let startTs = null;
    function fmt(ms) {
      const total = Math.floor(ms / 1000);
      const h = Math.floor(total / 3600);
      const m = Math.floor((total % 3600) / 60);
      const s = total % 60;
      const pad = (n) => String(n).padStart(2, '0');
      return (h > 0 ? pad(h) + ':' : '') + pad(m) + ':' + pad(s);
    }
    function tick() {
      const isActive = document.body.classList.contains('active');
      if (isActive) {
        if (startTs === null) startTs = Date.now();
        const elapsed = Date.now() - startTs;
        const t = fmt(elapsed);
        if (timeEl) timeEl.textContent = t;
        el.title = 'Time in this session with Kaiso · ' + t;
      } else {
        // Session ended — reset for the next invocation.
        startTs = null;
        if (timeEl) timeEl.textContent = '00:00';
      }
    }
    tick();
    setInterval(tick, 1000);
  })();
