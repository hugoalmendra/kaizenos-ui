  // ─── Ask Kaiso to change this — desktop (KAIZ-218) ──────────
  // The desktop half of KAIZ-207. The mobile flow is a sheet over a
  // scrimmed document (D10/D11) because a phone has one column and no
  // pointer. Desktop has both, so the ask happens inside the panel the
  // founder is already reading, and the target is whatever they aim at.
  //
  // Three beats, same as mobile: the way in, the ask with the passage
  // quoted, the change marked in place with Revert beside Keep.
  (function askKaisoEdit() {
    // Each output document names its own sections. One map rather than
    // six copies of the bar in the HTML, so the entry cannot drift
    // between panels -- it is learned once and it is the same thing.
    const DOCS = {
      panelExec:    { sec: '.exec-sec, .exec-band', title: '.exec-sec-title', body: '.exec-sec-body' },
      panelLanding: { sec: '.land-block',  title: '.land-lbl',   body: '.land-body' },
      panelDeck:    { sec: '.deck-slide',  title: '.deck-title', body: '.deck-body' },
      // The pitch blocks are titled by their length, so "30 sec" alone
      // would name the scope badly. `name` says what it actually is.
      panelPitch:   { sec: '.pitch-block', title: '.pitch-dur',  body: '.pitch-body',
                      name: (sec) => 'the ' + sec.querySelector('.pitch-dur').textContent.trim() + ' pitch' },
      panelBrand:   { sec: '.brand-block', title: '.brand-lbl',  body: '.brand-note' },
      // The org chart is a tree, not prose. There is no paragraph to
      // quote, so it is asked about whole rather than by section --
      // and `root` is what gets marked and restored in that case, so a
      // Revert never swallows the bar that is doing the reverting.
      panelOrg:     { sec: null, title: null, body: null, whole: 'the chart', root: '#orgPrintable' },
    };

    const COST_TOKENS = 1;          // an edit is small work, but it is work
    const SHORTCUTS = ['Shorter', 'Less jargon', 'Fix a number'];

    const svgMic = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">'
      + '<rect x="9" y="3" width="6" height="11" rx="3"/>'
      + '<path d="M5 11a7 7 0 0 0 14 0" stroke-linecap="round"/>'
      + '<path d="M12 18v3" stroke-linecap="round"/></svg>';

    const esc = (s) => String(s).replace(/[<>&"]/g, (c) => (
      { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

    function clip(s, n) {
      const t = String(s || '').replace(/\s+/g, ' ').trim();
      return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;
    }

    function timeLeft() {
      const t = window.KaisoTime;
      if (!t || !t.state) return null;
      return t.fmtLeft(t.state().balance);
    }

    // ─ One bar per panel ─────────────────────────────────────
    Object.keys(DOCS).forEach((id) => {
      const panel = document.getElementById(id);
      if (!panel) return;
      const cfg = DOCS[id];

      const bar = document.createElement('div');
      bar.className = 'kedit-bar';
      panel.appendChild(bar);

      // state for this panel
      let target = null;        // the section being changed
      let original = null;      // its HTML before the edit, for Revert

      function sections() {
        return cfg.sec ? Array.from(panel.querySelectorAll(cfg.sec)) : [];
      }

      function nameOf(sec) {
        if (!sec) return cfg.whole || 'this document';
        if (cfg.name) return clip(cfg.name(sec), 40);
        const t = cfg.title && sec.querySelector(cfg.title);
        return t ? clip(t.textContent, 40) : 'this section';
      }

      // Whole-document edits act on the document, never on the panel:
      // the panel contains this bar, and restoring it would wipe the
      // handlers mid-revert.
      const docRoot = () => (cfg.root && panel.querySelector(cfg.root)) || panel;

      function passageOf(sec) {
        if (!sec) return clip(docRoot().textContent, 220);
        const b = cfg.body && sec.querySelector(cfg.body);
        return clip((b || sec).textContent, 220);
      }

      // ─ Beat 1: the way in ─────────────────────────────────
      function showEntry() {
        target = null;
        bar.innerHTML = '<button type="button" class="kedit-open">' + svgMic
          + '<span><b>Ask Kaiso to change this</b> — or point at the part you mean</span></button>';
        bar.querySelector('.kedit-open').addEventListener('click', () => {
          showAsk(sections()[0] || null);
        });
      }

      // ─ Beat 2: the ask ────────────────────────────────────
      function showAsk(sec) {
        target = sec;
        const left = timeLeft();
        bar.innerHTML = ''
          + '<div class="kedit-sheet show">'
          +   '<div class="kedit-head">'
          +     '<span class="kedit-eyebrow">Ask Kaiso to change</span>'
          +     '<span class="kedit-scope">' + esc(nameOf(sec)) + '</span>'
          +     '<button type="button" class="kedit-x" aria-label="Close">✕</button>'
          +   '</div>'
          +   '<p class="kedit-lede">This is what Kaiso will change. Say what is wrong with it.</p>'
          +   '<blockquote class="kedit-quote">' + esc(passageOf(sec)) + '</blockquote>'
          +   '<div class="kedit-row">'
          +     '<input class="kedit-input" type="text" placeholder="Make the problem sharper" '
          +            'aria-label="Tell Kaiso what to change">'
          +     '<button type="button" class="kedit-mic" aria-label="Say it instead">' + svgMic + '</button>'
          +   '</div>'
          +   '<div class="kedit-chips">'
          +     SHORTCUTS.map((s) => '<button type="button" class="kedit-chip">' + esc(s) + '</button>').join('')
          +   '</div>'
          +   '<p class="kedit-cost">A change costs about <b>1 min</b> of your time'
          +     (left ? ' · ' + esc(left) + ' left' : '') + '</p>'
          + '</div>';

        const input = bar.querySelector('.kedit-input');
        const mic   = bar.querySelector('.kedit-mic');
        input.focus();

        bar.querySelector('.kedit-x').addEventListener('click', showEntry);
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && input.value.trim()) apply(input.value.trim());
          if (e.key === 'Escape') { e.stopPropagation(); showEntry(); }
        });
        bar.querySelectorAll('.kedit-chip').forEach((c) => {
          c.addEventListener('click', () => apply(c.textContent));
        });
        // Spoken asks arrive the same way typed ones do, so there is one
        // path through the rest of this and not two.
        mic.addEventListener('click', () => {
          mic.classList.add('live');
          setTimeout(() => {
            mic.classList.remove('live');
            apply(input.value.trim() || 'Make the problem sharper');
          }, 1100);
        });
      }

      // ─ Beat 3: applied ────────────────────────────────────
      function apply(ask) {
        const sec = target || docRoot();
        document.body.classList.add('kedit-busy');
        bar.innerHTML = '<div class="kedit-working"><span class="kedit-dot"></span>'
          + 'Kaiso is changing ' + esc(nameOf(target)) + '…</div>';

        setTimeout(() => {
          document.body.classList.remove('kedit-busy');
          if (window.KaisoTime && window.KaisoTime.spend) window.KaisoTime.spend(COST_TOKENS);

          original = { el: sec, html: sec.innerHTML };
          sec.classList.add('kedit-changed');
          const t = cfg.title && sec.querySelector(cfg.title);
          if (t && !t.querySelector('.kedit-tag')) {
            t.insertAdjacentHTML('beforeend', '<span class="kedit-tag">changed</span>');
          }
          // scrollIntoView would move the window; the panel is the
          // scroll container, so scroll that instead.
          panel.scrollTo({ top: Math.max(0, sec.offsetTop - 120), behavior: 'smooth' });

          bar.innerHTML = ''
            + '<div class="kedit-result kedit-sheet show">'
            +   '<div class="kedit-said">You asked for <b>' + esc(clip(ask, 60)) + '</b>'
            +     '<span class="kedit-spent">1 min spent</span></div>'
            +   '<p class="kedit-note">Kaiso also noted this for your other outputs, so the deck '
            +     'and the landing page will say it the same way.</p>'
            +   '<div class="kedit-acts">'
            +     '<button type="button" class="kbtn" data-kedit="revert">Revert</button>'
            +     '<button type="button" class="kbtn primary" data-kedit="keep">Keep</button>'
            +   '</div>'
            + '</div>';

          bar.querySelector('[data-kedit="revert"]').addEventListener('click', revert);
          bar.querySelector('[data-kedit="keep"]').addEventListener('click', () => { original = null; showEntry(); });
        }, 1200);
      }

      // Revert restores the document, not the time. The work was done.
      function revert() {
        if (original) {
          original.el.innerHTML = original.html;
          original.el.classList.remove('kedit-changed');
          original = null;
          wire();
        }
        showEntry();
      }

      // Hovering a section offers it as the target, so "this" is
      // resolved by aim rather than picked from a list afterwards.
      function wire() {
        sections().forEach((sec) => {
          if (sec.dataset.keditWired) return;
          sec.dataset.keditWired = '1';
          sec.classList.add('kedit-target');
          sec.addEventListener('click', (e) => {
            if (document.body.classList.contains('kedit-busy')) return;
            if (e.target.closest('button, a, input, select, textarea')) return;
            showAsk(sec);
          });
        });
      }

      wire();
      showEntry();
    });
  })();
