  // ─── Output forge — Library outputs build as you talk with Kaiso ──
  (function outputForge() {
    const items = Array.from(document.querySelectorAll('.lib-item[data-output]'));
    if (!items.length) return;
    const toast = document.getElementById('ktoast');
    let toastT;
    // The sigil carries the news: it flares gold for as long as the toast
    // sits under it, and the status line steps aside so only one of them
    // speaks at a time. CSS owns the animation; this owns the moment.
    function showToast(msg) {
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('show');
      document.body.classList.add('forged');
      clearTimeout(toastT);
      toastT = setTimeout(() => {
        toast.classList.remove('show');
        document.body.classList.remove('forged');
      }, 2600);
    }
    let exchanges = 0;
    const outputs = items.map((el) => ({
      el,
      need: Math.max(1, parseInt(el.dataset.need, 10) || 5),
      fill: el.querySelector('.lib-prog-fill'),
      status: el.querySelector('.lib-status'),
      btn: el.querySelector('.kbtn'),
      name: (el.querySelector('b') || {}).textContent || 'Output',
      wasReady: false,
    }));
    function render() {
      outputs.forEach((o) => {
        const pct = Math.max(0, Math.min(100, Math.round((exchanges / o.need) * 100)));
        const ready = pct >= 100;
        if (o.fill) o.fill.style.width = pct + '%';
        o.el.classList.toggle('ready', ready);
        o.el.classList.toggle('locked', !ready);
        if (o.btn) {
          o.btn.disabled = !ready;
          o.btn.textContent = ready ? 'Open' : 'Forging';
        }
        if (o.status) {
          o.status.textContent = ready
            ? 'Ready · stored in your account'
            : exchanges === 0
              ? 'Not started — talk with Kaiso to forge it'
              : 'Forging as you talk · ' + pct + '%';
        }
        if (ready && !o.wasReady) {
          o.wasReady = true;
          if (exchanges > 0) showToast(o.name + ' is ready in your Library');
        }
      });
    }
    window.addEventListener('kaiso:exchange', () => { exchanges += 1; render(); });
    render();
  })();
