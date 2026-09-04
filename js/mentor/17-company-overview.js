  // ─── Your Company — the overview ──────────────────────────────
  // Everything Kaiso has captured about the venture, as one growing
  // document. Only captured nodes are drawn; a pillar appears the
  // moment its first node does. Each entry says which node it is and
  // where it came from, and can be edited in place.
  //
  // Separate from the pillar dropdown, which is untouched. Reads the
  // plan model from window.KaisoWheel so the two cannot disagree about
  // what a node is called or which pillar it belongs to.
  //
  // Prototype: edits live in memory. The captured text is a stand-in —
  // there is no extraction pipeline behind it.
  (function companyOverview() {
    const el = document.getElementById('companySurface');
    if (!el || !window.KaisoWheel) return;

    const W = window.KaisoWheel;
    const body   = document.getElementById('coBody');
    const metaEl = document.getElementById('coMeta');

    const key = (s) => s.pillar.id + ':' + s.node;
    const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    /* What has been captured so far. Keyed by pillar:node. Seeded with
       what a founder has after their first couple of sessions — the
       Company pillar — and grown from the wheel as it advances. */
    const captured = {
      'company:Mission': {
        text: 'Solo founders lose months turning a rough idea into something an investor can read. Helm exists so the sequence is not the hard part — the work is.',
        source: 'Your session on 12 Aug', mine: false,
      },
      'company:Vision': {
        text: 'Every serious founder walks into a raise with the same quality of material a well-funded team would have.',
        source: 'Your session on 12 Aug', mine: false,
      },
    };

    /* Stand-in text for nodes the wheel completes during the prototype
       session. In the product this is the extraction from the
       conversation; here it is a placeholder, and the source line says
       so honestly. */
    const STANDIN = {
      'company:Wedge': 'A spoken mentor that interviews the founder and forges the artifacts out of the conversation itself — nothing to fill in, nothing to format.',
      'company:Moat': 'The interview data. Every session makes the next artifact better, and nobody else has the transcript.',
      'company:Why Now': 'Real-time voice models crossed the threshold this year. A conversation this natural was not possible eighteen months ago.',
      'company:BHAG': 'The default first step for every founder raising for the first time.',
    };

    let order = [];   // keys in the order they were captured, so the page grows downward

    function toast(msg) {
      const t = document.getElementById('ktoast');
      if (!t) return;
      t.textContent = msg;
      t.classList.add('show');
      clearTimeout(toast._t);
      toast._t = setTimeout(() => t.classList.remove('show'), 2600);
    }

    /* Pull anything the wheel now counts as complete into the overview. */
    function syncFromWheel() {
      let added = [];
      W.steps.forEach((s) => {
        const k = key(s);
        if (captured[k]) return;
        if (W.state(s.stepIndex).pct === 100) {
          captured[k] = {
            text: STANDIN[k] || ('What you told Kaiso about ' + s.node + '.'),
            source: 'Your session today', mine: false,
          };
          added.push(k);
        }
      });
      Object.keys(captured).forEach((k) => { if (!order.includes(k)) order.push(k); });
      return added;
    }

    function companyName() {
      const exec = document.querySelector('.exec-co, .land-logo');
      return (exec && exec.textContent.trim()) || 'Your venture';
    }

    /* ── render ── */
    function render(highlight) {
      highlight = highlight || [];
      const entries = order.filter((k) => captured[k]);

      if (!entries.length) {
        body.innerHTML = `<div class="co-empty">
          <svg viewBox="-70 -70 140 140" width="72" height="72" style="opacity:.45">
            <circle r="62" fill="none" stroke="#c8a84e" stroke-opacity=".3" stroke-width="1" stroke-dasharray="2 4"/>
            <circle r="50" fill="none" stroke="#c8a84e" stroke-opacity=".45" stroke-width="1"/>
            <g fill="#e8c870" opacity=".6">${[-33,-21,-9,3,15,27].map((y) => `<rect x="-30" y="${y}" width="60" height="6" rx="2"/>`).join('')}</g>
          </svg>
          <h2>Nothing here yet.</h2>
          <p>As you talk, Kaiso captures what you say about your company and it appears here — one entry per node, in the order you cover them.</p>
        </div>`;
        metaEl.textContent = '';
        return;
      }

      // group by pillar, in the wheel's pillar order; a pillar only
      // shows if it has at least one captured node
      const sections = W.pillars.map((p) => {
        const steps = W.steps.filter((s) => s.pillar.id === p.id && captured[key(s)]);
        if (!steps.length) return '';
        const cards = steps.map((s) => {
          const k = key(s);
          const c = captured[k];
          return `<article class="co-card${highlight.includes(k) ? ' new' : ''}" data-key="${esc(k)}">
            <div class="co-card-top">
              <span class="co-node">${esc(s.node)}</span>
              <button class="co-edit" type="button" data-edit="${esc(k)}">Edit</button>
            </div>
            <p class="co-text">${esc(c.text)}</p>
            <div class="co-source">
              <span class="co-source-tag${c.mine ? ' mine' : ''}">${c.mine ? 'Edited by you' : esc(c.source)}</span>
              ${c.mine ? '<span>Kaiso will ask before changing this.</span>' : ''}
            </div>
          </article>`;
        }).join('');
        return `<section class="co-section">
          <div class="co-section-head">
            <span class="co-section-dot" style="background:${p.color};box-shadow:0 0 8px ${p.color}"></span>
            <span class="co-section-name" style="color:${p.color}">${esc(p.name)}</span>
            <span class="co-section-count">${steps.length} of ${p.nodes.length}</span>
          </div>
          ${cards}
        </section>`;
      }).join('');

      body.innerHTML = `<header class="co-head">
        <div class="co-eyebrow">Your company</div>
        <h1 class="co-name">${esc(companyName())}</h1>
        <p class="co-sub">Everything Kaiso has captured so far. It grows as you talk.</p>
      </header>${sections}`;

      metaEl.textContent = entries.length + ' captured · ' +
        W.pillars.filter((p) => W.steps.some((s) => s.pillar.id === p.id && captured[key(s)])).length + ' of ' +
        W.pillars.length + ' pillars';
    }

    /* ── editing in place ── */
    body.addEventListener('click', (e) => {
      const editBtn = e.target.closest('[data-edit]');
      if (editBtn) { startEdit(editBtn.dataset.edit); return; }
      const save = e.target.closest('[data-save]');
      if (save) { finishEdit(save.dataset.save, true); return; }
      const cancel = e.target.closest('[data-cancel]');
      if (cancel) { finishEdit(cancel.dataset.cancel, false); }
    });

    function startEdit(k) {
      const card = body.querySelector(`.co-card[data-key="${CSS.escape(k)}"]`);
      if (!card || card.classList.contains('editing')) return;
      const c = captured[k];
      card.classList.add('editing');
      card.querySelector('.co-text').outerHTML =
        `<textarea class="co-textarea" data-field="${esc(k)}">${esc(c.text)}</textarea>`;
      card.querySelector('.co-source').insertAdjacentHTML('afterend',
        `<div class="co-card-actions">
          <button class="kbtn" type="button" data-cancel="${esc(k)}">Cancel</button>
          <button class="kbtn primary" type="button" data-save="${esc(k)}">Save</button>
        </div>`);
      card.querySelector('.co-edit').hidden = true;
      const ta = card.querySelector('textarea');
      ta.focus();
      ta.setSelectionRange(ta.value.length, ta.value.length);
    }

    function finishEdit(k, save) {
      const card = body.querySelector(`.co-card[data-key="${CSS.escape(k)}"]`);
      if (!card) return;
      if (save) {
        const v = card.querySelector('textarea').value.trim();
        if (!v) { toast('Nothing to save'); return; }
        if (v !== captured[k].text) {
          captured[k].text = v;
          captured[k].mine = true;
          toast('Saved — Kaiso will ask before changing it');
        }
      }
      render();
    }

    /* ── grows as the founder talks ── */
    window.addEventListener('kaiso:exchange', () => {
      const added = syncFromWheel();
      if (el.classList.contains('open')) render(added);
    });

    /* ── open / close ── */
    function open() {
      const added = syncFromWheel();
      el.classList.add('open');
      document.body.style.overflow = 'hidden';
      render(added);
    }
    function close() {
      el.classList.remove('open');
      document.body.style.overflow = '';
    }

    document.getElementById('coClose').addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && el.classList.contains('open')) close();
    });

    const menuBtn = document.getElementById('companyOverviewBtn');
    if (menuBtn) menuBtn.addEventListener('click', () => {
      document.getElementById('accountMenu')?.classList.remove('open');
      open();
    });

    syncFromWheel();
    window.KaisoCompany = { open, close };
  })();
