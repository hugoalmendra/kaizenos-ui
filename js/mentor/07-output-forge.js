  // ─── Output forge — Library outputs build as you talk with Kaiso ──
  (function outputForge() {
    const items = Array.from(document.querySelectorAll('.lib-item[data-output]'));
    if (!items.length) return;
    const toast = document.getElementById('kready');
    const TOAST_MS = 4500;   // long enough to be caught, now that it is worth catching
    const AFTER_HOVER_MS = 1200;
    let toastT;
    let pending = null;      // the output this toast is about

    function hideToast() {
      clearTimeout(toastT);
      if (toast) toast.classList.remove('show');
      document.body.classList.remove('forged');
      pending = null;
    }
    function armDismiss(ms) {
      clearTimeout(toastT);
      toastT = setTimeout(hideToast, ms);
    }

    function buildButton(msg) {
      toast.textContent = '';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ktoast-btn';
      btn.title = 'Open it';
      const label = document.createElement('span');
      label.className = 'ktoast-msg';
      label.textContent = msg;
      const go = document.createElement('span');
      go.className = 'ktoast-go';
      go.setAttribute('aria-hidden', 'true');
      go.textContent = '→';
      btn.appendChild(label);
      btn.appendChild(go);

      // Opening goes through the Library's own button, so the toast and the
      // Library can never disagree about what opening an asset means.
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const o = pending;
        hideToast();
        if (o && o.btn && !o.btn.disabled) o.btn.click();
      });
      // A notification you cannot catch is not a notification: it waits
      // while the pointer or the keyboard is on it.
      ['pointerenter', 'focus'].forEach((evt) =>
        btn.addEventListener(evt, () => clearTimeout(toastT)));
      ['pointerleave', 'blur'].forEach((evt) =>
        btn.addEventListener(evt, () => {
          if (toast.classList.contains('show')) armDismiss(AFTER_HOVER_MS);
        }));
      toast.appendChild(btn);
    }

    // The sigil carries the news: it flares gold for as long as the toast
    // sits under it, and the status line steps aside so only one of them
    // speaks at a time. CSS owns the animation; this owns the moment.
    function showToast(msg, output) {
      if (!toast) return;
      buildButton(msg);
      pending = output;
      toast.classList.add('show');
      document.body.classList.add('forged');
      armDismiss(TOAST_MS);
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
          if (exchanges > 0) showToast(o.name + ' is ready in your Library', o);
        }
      });
    }
    window.addEventListener('kaiso:exchange', () => { exchanges += 1; render(); });
    render();
  })();
