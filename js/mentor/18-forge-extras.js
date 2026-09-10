  // ─── Elevator Pitch · Org Chart · Brand Kit — document behaviour ──
  // The three newer forged assets. Each one carries the interaction its
  // format implies: spoken copy is counted and copyable, the org chart
  // opens a role to explain it, the brand kit hands over hex values and
  // CSS tokens. Preview only — nothing here talks to a backend.
  (function forgeExtras() {
    const toastEl = document.getElementById('ktoast');
    let toastT;
    function toast(msg) {
      if (!toastEl) return;
      toastEl.textContent = msg;
      toastEl.classList.add('show');
      clearTimeout(toastT);
      toastT = setTimeout(() => toastEl.classList.remove('show'), 2600);
    }

    function download(text, filename, mime) {
      const url = URL.createObjectURL(new Blob([text], { type: mime + ';charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }

    // execCommand path covers file:// and any context where the async
    // clipboard is refused for want of user activation.
    function legacyCopy(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      return ok ? Promise.resolve() : Promise.reject(new Error('copy blocked'));
    }

    function copy(text) {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text).catch(() => legacyCopy(text));
      }
      return legacyCopy(text);
    }

    function ventureName() {
      const el = document.querySelector('.exec-co, .land-logo');
      return (el && el.textContent.trim()) || 'venture';
    }
    function slug(v) {
      return String(v).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'venture';
    }
    const today = () => new Date().toISOString().slice(0, 10);

    /* ── Elevator Pitch ──────────────────────────────────────────
       Counted rather than hard-coded: the word count is the thing a
       founder checks against the clock, so it has to follow the copy
       if the copy is ever re-cut. ~140 words per minute spoken. */
    const pitchDoc = document.getElementById('pitchPrintable');
    if (pitchDoc) {
      const WPM = 140;
      const blocks = Array.from(pitchDoc.querySelectorAll('.pitch-block'));

      const wordsIn = (el) => (el.textContent.trim().match(/\S+/g) || []).length;

      blocks.forEach((b) => {
        const words = Array.from(b.querySelectorAll('.pitch-body')).reduce((n, p) => n + wordsIn(p), 0);
        const secs = Math.round((words / WPM) * 60);
        const countEl = b.querySelector('.pitch-count');
        if (countEl) countEl.textContent = words + ' words · ~' + secs + 's spoken';
      });

      function pitchText() {
        const co = ventureName();
        const line = pitchDoc.querySelector('.pitch-line');
        const out = [co.toUpperCase() + ' — ELEVATOR PITCH', 'Forged by Kaiso · ' + today(), '', 'ONE LINE', line ? line.textContent.trim() : ''];
        blocks.forEach((b) => {
          const dur = b.querySelector('.pitch-dur');
          const when = b.querySelector('.pitch-when');
          out.push('', '');
          out.push((dur ? dur.textContent.trim().toUpperCase() : 'VERSION') + (when ? '  (' + when.textContent.trim() + ')' : ''));
          out.push('');
          Array.from(b.querySelectorAll('.pitch-body')).forEach((p, i, all) => {
            out.push(p.textContent.trim());
            if (i < all.length - 1) out.push('');
          });
        });
        return out.join('\n') + '\n';
      }

      document.getElementById('pitchCopyBtn')?.addEventListener('click', () => {
        copy(pitchText())
          .then(() => toast('Elevator pitch copied'))
          .catch(() => toast('Copy blocked — download the .txt instead'));
      });

      document.getElementById('pitchDownloadBtn')?.addEventListener('click', () => {
        download(pitchText(), 'kaiso_elevator_pitch_' + slug(ventureName()) + '_' + today() + '.txt', 'text/plain');
        toast('Elevator pitch downloaded');
      });
    }

    /* ── Org Chart ───────────────────────────────────────────────
       A role on its own is a job title; the reason it exists is the
       part an investor asks about. One node open at a time keeps the
       tree from reflowing under the cursor. */
    const orgDoc = document.getElementById('orgPrintable');
    if (orgDoc) {
      const nodes = Array.from(orgDoc.querySelectorAll('.org-node'));
      nodes.forEach((n) => {
        n.setAttribute('aria-expanded', 'false');
        n.addEventListener('click', () => {
          const open = !n.classList.contains('expanded');
          nodes.forEach((o) => {
            o.classList.toggle('expanded', o === n && open);
            o.setAttribute('aria-expanded', o === n && open ? 'true' : 'false');
          });
        });
      });
    }

    /* ── Brand Kit ───────────────────────────────────────────────
       Hex on click, and the whole palette as custom properties so a
       developer can paste it into a stylesheet without retyping six
       values from a PDF. */
    const brandDoc = document.getElementById('brandPrintable');
    if (brandDoc) {
      const swatches = Array.from(brandDoc.querySelectorAll('.brand-swatch'));
      swatches.forEach((sw) => {
        sw.addEventListener('click', () => {
          const hex = sw.dataset.hex || '';
          copy(hex)
            .then(() => {
              sw.classList.add('copied');
              const label = sw.querySelector('.brand-hex');
              if (label) {
                label.textContent = 'Copied';
                setTimeout(() => { label.textContent = hex; sw.classList.remove('copied'); }, 1200);
              }
              toast(hex + ' copied');
            })
            .catch(() => toast('Copy blocked in this browser'));
        });
      });

      /* Logo direction. The mark is generated as SVG rather than as a
         raster image: it has to recolour from the palette, stay sharp at
         a 16px favicon and open in Figma, none of which a PNG does. The
         founder picks a direction, the lockups follow, and the file that
         leaves is monochrome so it can be recoloured downstream. */
      const opts = Array.from(brandDoc.querySelectorAll('.brand-mark-opt'));
      const lockDark = document.getElementById('brandMarkDark');
      const lockLight = document.getElementById('brandMarkLight');
      let markName = 'waterline';

      function selectMark(btn) {
        markName = btn.dataset.mark || 'mark';
        const art = btn.querySelector('.mo-art svg');
        if (!art) return;
        opts.forEach((o) => {
          o.classList.toggle('sel', o === btn);
          o.setAttribute('aria-pressed', o === btn ? 'true' : 'false');
        });
        if (lockDark) lockDark.innerHTML = art.outerHTML;
        if (lockLight) lockLight.innerHTML = art.outerHTML;
      }

      opts.forEach((btn) => btn.addEventListener('click', () => selectMark(btn)));

      document.getElementById('brandSvgBtn')?.addEventListener('click', () => {
        const sel = brandDoc.querySelector('.brand-mark-opt.sel .mo-art svg');
        if (!sel) { toast('Pick a direction first'); return; }
        const co = ventureName();
        // currentColor only resolves inside a page; a standalone file needs
        // a real value, so it ships in the palette's ink colour.
        const ink = (brandDoc.querySelector('.brand-swatch[data-token="hull"]') || {}).dataset?.hex || '#10141C';
        const body = sel.outerHTML
          .replace(/\s*aria-hidden="true"/g, '')
          .replace(/currentColor/g, ink);
        const svg = '<?xml version="1.0" encoding="UTF-8"?>\n'
          + '<!-- ' + co + ' — ' + markName + ' mark. Direction, not a cleared trademark. -->\n'
          + '<!-- Monochrome by design: recolour by replacing ' + ink + '. -->\n'
          + body.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" ') + '\n';
        download(svg, 'kaiso_mark_' + slug(co) + '_' + markName + '_' + today() + '.svg', 'image/svg+xml');
        toast('Mark downloaded as SVG');
      });

      document.getElementById('brandTokensBtn')?.addEventListener('click', () => {
        const co = ventureName();
        const lines = [
          '/* ' + co + ' — brand tokens */',
          '/* Forged by Kaiso · ' + today() + ' */',
          '',
          ':root {',
        ];
        swatches.forEach((sw) => {
          const name = (sw.querySelector('b') || {}).textContent || sw.dataset.token || 'color';
          lines.push('  --' + slug(co) + '-' + (sw.dataset.token || slug(name)) + ': ' + (sw.dataset.hex || '') + ';  /* ' + name.trim() + ' */');
        });
        lines.push('');
        lines.push('  --font-display: "Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif;');
        lines.push('  --font-body: "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;');
        lines.push('  --font-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace;');
        lines.push('}');
        download(lines.join('\n') + '\n', 'kaiso_brand_tokens_' + slug(co) + '_' + today() + '.css', 'text/css');
        toast('Brand tokens downloaded');
      });
    }
  })();
