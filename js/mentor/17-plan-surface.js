  // ─── Your Plan — Surface 2 ────────────────────────────────────
  // Where the founder reads back everything Kaiso captured and
  // corrects it. Driven entirely off window.KaisoWheel so the pillar
  // and node structure can never drift from the rest of the app.
  //
  // Prototype: edits live in memory only. What is real here is the
  // shape — coverage on the left, one node's content on the right,
  // with provenance and an explicit "yours" state.
  (function planSurface() {
    const el = document.getElementById('planSurface');
    if (!el || !window.KaisoWheel) return;

    const W = window.KaisoWheel;
    const mapEl    = document.getElementById('planMap');
    const detailEl = document.getElementById('planNodeDetail'); // not #planDetail — that id already belongs to the Plan & Tokens panel
    const readyEl  = document.getElementById('planSurfaceReady');
    const countEl  = document.getElementById('planSurfaceCount');
    const filterEl = document.getElementById('planFilter');

    /* The nodes that gate intake completion. KAIZ-95 specifies 16
       blocking fields in V2.1 §6.2 — this is a stand-in list until
       that spec is wired in, not the real set. */
    const BLOCKING = new Set([
      'company:Mission', 'company:Wedge', 'company:Why Now',
      'people:Founder Edge', 'people:Co-founders',
      'product:What it Is', 'product:Problem', 'product:Traction', 'product:Distribution',
      'finance:The Ask', 'finance:Use of Funds', 'finance:Runway', 'finance:Unit Economics',
      'goals:North Star', 'goals:Top 3 Priorities',
      'systems:Core Process',
    ]);

    /* Why each node matters, and the question Kaiso opens with. Only
       the nodes a founder reaches early are written out; the rest fall
       back to a generic line rather than inventing copy for 49. */
    const NOTES = {
      'company:Mission': {
        why: 'Why the company exists, in a sentence someone else could repeat back. Investors read this as evidence you know what you are building.',
        ask: '"If this worked perfectly, what would be different in the world?"',
      },
      'company:Vision': {
        why: 'Where this goes if it works. Far enough out to be ambitious, close enough to be credible.',
        ask: '"Five years from now, what does the company look like?"',
      },
      'company:Wedge': {
        why: 'The narrow thing you do better than anyone, that gets you in the door.',
        ask: '"What is the one thing you do that nobody else does well?"',
      },
      'company:Moat': {
        why: 'What stops a well-funded competitor copying you in six months.',
        ask: '"What gets harder for someone else to copy the longer you run?"',
      },
      'company:Why Now': {
        why: 'What changed recently that makes this possible today and not three years ago.',
        ask: '"Why could this not have been built before?"',
      },
      'company:BHAG': {
        why: 'The big, uncomfortable goal. The one that sounds slightly unreasonable out loud.',
        ask: '"What would make this a company people write about?"',
      },
    };

    /* What Kaiso has captured so far. Early sessions cover Company, so
       that is what carries content — everything else is genuinely
       empty and shows the empty state, which is the honest default. */
    const CAPTURED = {
      'company:Mission': {
        text: 'Solo founders lose months turning a rough idea into something an investor can read. Helm exists so the sequence is not the hard part — the work is.',
        source: 'Your session on 12 Aug',
      },
      'company:Vision': {
        text: 'Every serious founder walks into a raise with the same quality of material a well-funded team would have.',
        source: 'Your session on 12 Aug',
      },
    };

    const edited = {};      // nodes the founder has overridden
    const drafts = {};      // in-memory edits
    let openPillar = 'company';
    let selected = null;    // stepIndex

    const key = (s) => s.pillar.id + ':' + s.node;
    const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    function toast(msg) {
      const t = document.getElementById('ktoast');
      if (!t) return;
      t.textContent = msg;
      t.classList.add('show');
      clearTimeout(toast._t);
      toast._t = setTimeout(() => t.classList.remove('show'), 2600);
    }

    /* ── coverage map ── */
    function renderMap() {
      const onlyBlocking = filterEl.classList.contains('on');
      let filled = 0;

      mapEl.innerHTML = W.pillars.map((p) => {
        const steps = W.steps.filter((s) => s.pillar.id === p.id);
        const done = steps.filter((s) => W.state(s.stepIndex).pct === 100).length;
        filled += done;

        const cells = steps.map((s) => {
          const st = W.state(s.stepIndex);
          const cls = ['plan-cell',
            st.pct === 100 ? 'done' : st.pct > 0 ? 'part' : '',
            BLOCKING.has(key(s)) && st.pct < 100 ? 'blocking' : '',
            st.current ? 'current' : ''].filter(Boolean).join(' ');
          return `<span class="${cls}" title="${esc(s.node)}"></span>`;
        }).join('');

        const rows = openPillar !== p.id ? '' :
          `<div class="plan-nodes-list">` + steps.filter((s) => !onlyBlocking || BLOCKING.has(key(s))).map((s) => {
            const st = W.state(s.stepIndex);
            return `<button class="plan-node-row${selected === s.stepIndex ? ' sel' : ''}" type="button" data-step="${s.stepIndex}">
              <span class="nm">${esc(s.node)}</span>
              ${BLOCKING.has(key(s)) && st.pct < 100 ? '<span class="blk">Blocking</span>' : ''}
              <span class="pc">${st.pct}%</span>
            </button>`;
          }).join('') + `</div>`;

        return `<div class="plan-pil${openPillar === p.id ? ' open' : ''}" data-pillar="${p.id}">
          <div class="plan-pil-head">
            <span class="plan-pil-dot" style="background:${p.color};box-shadow:0 0 8px ${p.color}"></span>
            <span class="plan-pil-name">${esc(p.name)}</span>
            <span class="plan-pil-count">${done}/${steps.length}</span>
          </div>
          <div class="plan-cells">${cells}</div>
          ${rows}
        </div>`;
      }).join('');

      const total = W.steps.length;
      readyEl.textContent = Math.round((filled / total) * 100);
      countEl.textContent = filled + ' of ' + total + ' nodes';
    }

    /* ── detail pane ── */
    function renderDetail() {
      if (selected === null) {
        detailEl.innerHTML = `<div class="plan-empty">
          <h2>Pick a node.</h2>
          <p>Everything Kaiso has captured lives here. Choose one on the left to read it back, correct it, or send Kaiso at it.</p>
        </div>`;
        return;
      }

      const s = W.steps[selected];
      const st = W.state(selected);
      const k = key(s);
      const note = NOTES[k] || {};
      const cap = CAPTURED[k];
      const isMine = !!edited[k];
      const value = drafts[k] !== undefined ? drafts[k] : (cap ? cap.text : '');
      const blocking = BLOCKING.has(k);

      detailEl.innerHTML = `<div class="plan-detail-inner">
        <div class="plan-crumb">
          <span class="plan-chip" style="border:1px solid ${s.pillar.color}55;background:${s.pillar.color}14">
            <i style="background:${s.pillar.color}"></i>
            <span style="color:${s.pillar.color}">${esc(s.pillar.name)}</span>
          </span>
          <span class="plan-pos">Node ${s.nodeIndex + 1} of ${s.pillar.nodes.length}</span>
          ${blocking && st.pct < 100 ? '<span class="blk" style="font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:#e8a870;border:1px solid rgba(232,168,112,.4);border-radius:999px;padding:4px 9px">Blocking intake</span>' : ''}
        </div>

        <h1 class="plan-h">${esc(s.node)}</h1>
        <p class="plan-why">${esc(note.why || 'Kaiso fills this from your conversation. Talk it through and it appears here.')}</p>

        <div class="plan-sec-lbl">What Kaiso captured</div>
        <textarea class="plan-captured" id="planCaptured"
          placeholder="Nothing captured yet. Write it yourself, or talk to Kaiso and it will appear here.">${esc(value)}</textarea>

        <div class="plan-source">
          ${cap || isMine
            ? `<span class="plan-source-tag${isMine ? ' mine' : ''}">${isMine ? 'Edited by you' : esc(cap.source)}</span>`
            : '<span class="plan-source-tag">Not captured yet</span>'}
          ${isMine ? '<span>Kaiso will ask before changing this.</span>' : ''}
        </div>

        <div class="plan-next">
          <div class="plan-sec-lbl" style="margin-bottom:0">Kaiso will ask next</div>
          <p>${esc(note.ask || 'Kaiso will open on whatever it still needs for this node.')}</p>
        </div>

        <div class="plan-actions">
          <button class="kbtn" type="button" id="planSave">Save changes</button>
          <button class="kbtn primary" type="button" id="planTalk">Talk about this now</button>
        </div>
      </div>`;

      const ta = document.getElementById('planCaptured');
      ta.addEventListener('input', () => { drafts[k] = ta.value; });

      document.getElementById('planSave').addEventListener('click', () => {
        const v = ta.value.trim();
        if (!v) { toast('Nothing to save yet'); return; }
        drafts[k] = v;
        edited[k] = true;
        // A hand-edited node counts as filled.
        W.setNodeProgress(selected, 100);
        toast('Saved — Kaiso will ask before changing it');
        renderMap();
        renderDetail();
      });

      document.getElementById('planTalk').addEventListener('click', () => {
        W.setStep(s.pillar.id, s.node);
        close();
        toast('Kaiso will open on ' + s.node);
      });
    }

    /* ── wiring ── */
    mapEl.addEventListener('click', (e) => {
      const row = e.target.closest('.plan-node-row');
      if (row) { selected = +row.dataset.step; renderMap(); renderDetail(); return; }
      const pil = e.target.closest('.plan-pil');
      if (pil) { openPillar = openPillar === pil.dataset.pillar ? null : pil.dataset.pillar; renderMap(); }
    });

    filterEl.addEventListener('click', () => {
      filterEl.classList.toggle('on');
      filterEl.setAttribute('aria-pressed', filterEl.classList.contains('on') ? 'true' : 'false');
      renderMap();
    });

    function open() {
      // Land on whatever Kaiso is working through, so the surface opens
      // somewhere meaningful rather than on an arbitrary first node.
      const current = W.steps.findIndex((s) => W.state(s.stepIndex).current);
      if (selected === null && current >= 0) {
        selected = current;
        openPillar = W.steps[current].pillar.id;
      }
      el.classList.add('open');
      document.body.style.overflow = 'hidden';
      renderMap();
      renderDetail();
    }

    function close() {
      el.classList.remove('open');
      document.body.style.overflow = '';
      const ind = document.getElementById('kosIndicator');
      if (ind) { ind.classList.remove('open'); ind.setAttribute('aria-expanded', 'false'); }
    }

    document.getElementById('planClose').addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && el.classList.contains('open')) close();
    });

    window.KaisoPlanSurface = { open, close };
  })();
