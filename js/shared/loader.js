/* ─── Kaiso loader ───────────────────────────────────────────────
 * One way to say "this is working". Every call returns a handle with
 * .close(); calling close twice is safe, so callers can put it in a
 * finally block without guarding.
 *
 *   const l = KaisoLoader.overlay('Waking Kaiso');   l.close();
 *   const l = KaisoLoader.into(panelEl, 'Building');  l.close();
 *   const l = KaisoLoader.button(btnEl);              l.close();
 */
(function kaisoLoader() {
  'use strict';

  function build(label, cls) {
    const root = document.createElement('span');
    root.className = 'kload' + (cls ? ' ' + cls : '');
    root.setAttribute('role', 'status');
    root.setAttribute('aria-live', 'polite');

    // Still mark in the middle, two rings turning around it.
    const mark = document.createElement('span');
    mark.className = 'kload-mark';
    mark.setAttribute('aria-hidden', 'true');
    ['kload-ring', 'kload-arc', 'kload-os'].forEach((cls) => {
      const part = document.createElement('span');
      part.className = cls;
      mark.appendChild(part);
    });
    root.appendChild(mark);

    if (label) {
      const cap = document.createElement('span');
      cap.className = 'kload-label';
      cap.textContent = label;
      root.appendChild(cap);
    }

    // Announced even when the label is hidden (inline placement).
    const sr = document.createElement('span');
    sr.className = 'kload-sr';
    sr.textContent = label || 'Loading';
    root.appendChild(sr);

    return root;
  }

  function handle(close) {
    let done = false;
    return {
      close() {
        if (done) return;
        done = true;
        try { close(); } catch (err) { /* the DOM moved on; nothing to undo */ }
      },
    };
  }

  const KaisoLoader = {
    /* Whole screen is waiting. */
    overlay(label) {
      const scrim = document.createElement('div');
      scrim.className = 'kload-overlay';
      scrim.appendChild(build(label || null));
      document.body.appendChild(scrim);
      return handle(() => scrim.remove());
    },

    /* A container's content is being fetched. Replaces what is there and
       puts it back on close, so a failed load does not lose the panel. */
    into(el, label) {
      if (!el) return handle(() => {});
      const previous = el.innerHTML;
      el.innerHTML = '';
      el.appendChild(build(label || null, 'kload-block'));
      return handle(() => { el.innerHTML = previous; });
    },

    /* A button kicked off work. Keeps the button's width so the row does
       not jump, and blocks a second press. */
    button(btn, label) {
      if (!btn) return handle(() => {});
      const previous = btn.innerHTML;
      const width = btn.offsetWidth;
      btn.style.minWidth = width + 'px';
      btn.classList.add('kload-busy');
      btn.setAttribute('aria-busy', 'true');
      btn.innerHTML = '';
      btn.appendChild(build(label || 'Working', 'kload-inline'));
      return handle(() => {
        btn.innerHTML = previous;
        btn.classList.remove('kload-busy');
        btn.removeAttribute('aria-busy');
        btn.style.minWidth = '';
      });
    },
  };

  window.KaisoLoader = KaisoLoader;
})();
