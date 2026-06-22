  // ─── Activation flow ───────────────────────────────────────
  const sacred = document.getElementById('sacred');
  const flash  = document.getElementById('flash');
  const sigil1 = document.getElementById('sigil-1');
  const sigil2 = document.getElementById('sigil-2');

  function toggle() {
    if (active) { dismiss(); return; }
    awaken();
  }

  function awaken() {
    if (active) return;
    active = true;
    document.body.classList.add('active');

    flash.classList.remove('fire');
    sigil1.classList.remove('fire');
    sigil2.classList.remove('fire');
    void flash.offsetWidth;
    flash.classList.add('fire');
    sigil1.classList.add('fire');
    sigil2.classList.add('fire');
  }

  function dismiss() {
    if (!active) return;
    active = false;
    document.body.classList.remove('active');
  }

  sacred.addEventListener('click', toggle);
  sacred.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (document.body.classList.contains('chat-open')) {
        document.body.classList.remove('chat-open');
      } else if (active) {
        dismiss();
        window.dispatchEvent(new CustomEvent('kaiso-disengage'));
      }
    }
  });
