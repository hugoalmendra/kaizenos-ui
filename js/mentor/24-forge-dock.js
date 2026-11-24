  // ─── Forge dock — assets assemble in the open, beside the talk ──
  //
  // The six forged assets used to live in the shared modal: you talked,
  // a toast said something was ready, you opened a 760px box over a
  // blurred backdrop, read it, dismissed it, and the screen looked
  // exactly as it had before. Nothing accumulated and the build happened
  // where you were not looking.
  //
  // Here the documents have a surface of their own. It persists, it sits
  // beside the conversation rather than on top of it, and each document
  // is on screen from the first exchange as a skeleton that fills in
  // section by section as the nodes complete. The document IS the
  // progress bar; there is no separate one to read.
  (function forgeDock() {
    const stageEl = document.querySelector('.stage');
    if (!stageEl) return;

    // Which blocks of each document land one at a time. These are the
    // same structures the print styles and the provenance pass already
    // key on, so a section is a section everywhere in the build.
    const ASSETS = [
      { key: 'pitch',   panel: 'panelPitch',   label: 'Elevator Pitch',     sel: '.pitch-block' },
      { key: 'exec',    panel: 'panelExec',    label: 'Executive Summary',  sel: '.exec-banner, .exec-sec, .exec-band, .exec-foot' },
      { key: 'landing', panel: 'panelLanding', label: 'Landing Page',       sel: '.land-block' },
      { key: 'org',     panel: 'panelOrg',     label: 'Org Chart',          sel: '.org-node' },
      { key: 'brand',   panel: 'panelBrand',   label: 'Brand Kit',          sel: '.brand-block' },
      { key: 'deck',    panel: 'panelDeck',    label: 'Pitch Deck',         sel: '.deck-slide' },
    ];

    // ── Build the dock ───────────────────────────────────────────
    const dock = document.createElement('aside');
    dock.className = 'fdock';
    dock.id = 'forgeDock';
    dock.setAttribute('aria-label', 'Forged assets');
    dock.innerHTML =
      '<div class="fdock-head">'
      + '<span class="tm-dot"></span>'
      + '<span class="fdock-title" id="fdockTitle">The Forge</span>'
      + '<span class="fdock-state" id="fdockState"></span>'
      + '<button class="fdock-act" id="fdockRead" type="button" title="Read at full size" aria-label="Read at full size">⤢</button>'
      + '<button class="fdock-act" id="fdockClose" type="button" title="Set aside" aria-label="Set aside">✕</button>'
      + '</div>'
      + '<div class="fdock-shelf" id="fdockShelf"></div>'
      + '<div class="fdock-stage" id="fdockStage"></div>';

    const veil = document.createElement('div');
    veil.className = 'fdock-veil';

    const handle = document.createElement('button');
    handle.type = 'button';
    handle.className = 'fdock-handle';
    handle.id = 'fdockHandle';
    handle.innerHTML = 'The Forge · <b id="fdockCount">0</b>';

    document.body.appendChild(veil);
    document.body.appendChild(dock);
    document.body.appendChild(handle);

    const titleEl = dock.querySelector('#fdockTitle');
    const stateEl = dock.querySelector('#fdockState');
    const shelfEl = dock.querySelector('#fdockShelf');
    const docStage = dock.querySelector('#fdockStage');
    const countEl = handle.querySelector('#fdockCount');

    // ── Move the asset panels out of the modal ───────────────────
    // They keep their ids, so the print wiring, the Ask-Kaiso edit pass
    // and the document provenance pass all still find them.
    const live = [];
    ASSETS.forEach((a) => {
      const panel = document.getElementById(a.panel);
      if (!panel) return;
      panel.classList.add('fasset');
      docStage.appendChild(panel);
      const libItem = document.querySelector('.lib-item[data-output="' + a.key + '"]');
      const secs = Array.from(panel.querySelectorAll(a.sel));
      secs.forEach((s) => s.classList.add('fsec'));
      live.push({
        cfg: a,
        panel,
        secs,
        need: Math.max(1, parseInt(libItem && libItem.dataset.need, 10) || 5),
        shown: 0,
        wasReady: false,
        chip: null,
      });
    });
    if (!live.length) return;

    // Where the pen is. A document that is 60% built looks finished if
    // the unbuilt part is below the fold, so the boundary gets a marker
    // that travels with it and says plainly that more is coming.
    const cursor = document.createElement('div');
    cursor.className = 'fforge-cursor';
    cursor.innerHTML = '<span class="ffc-dot"></span><span class="ffc-txt"></span>';
    const cursorTxt = cursor.querySelector('.ffc-txt');

    const empty = document.createElement('div');
    empty.className = 'fdock-empty';
    empty.innerHTML =
      '<div class="fdock-empty-mark">✦</div>'
      + '<h4>Nothing forged yet</h4>'
      + '<p>Talk with Kaiso. Your documents assemble here as you go —'
      + ' you will see them fill in, not wait for them.</p>';
    docStage.appendChild(empty);

    // ── Shelf ────────────────────────────────────────────────────
    live.forEach((o) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'fchip';
      chip.dataset.key = o.cfg.key;
      chip.innerHTML = '<span class="fchip-ring"></span><span class="fchip-name"></span>';
      chip.querySelector('.fchip-name').textContent = o.cfg.label;
      chip.addEventListener('click', () => { userPicked = true; focus(o.cfg.key); });
      shelfEl.appendChild(chip);
      o.chip = chip;
    });

    // ── State ────────────────────────────────────────────────────
    let exchanges = 0;
    let active = null;
    let userPicked = false;

    // Put the section that just landed a little above centre, so the
    // ghost of the next one is visible under it.
    let scrollT = null;
    function frontier(sec, slow) {
      clearTimeout(scrollT);
      scrollT = setTimeout(() => {
        const r = sec.getBoundingClientRect();
        const s = docStage.getBoundingClientRect();
        // Anchor on the END of the section that just landed, not its
        // start: a tall section anchored at the top pushes the pen and
        // the ghost of the next one back off the bottom of the view,
        // which is the whole thing we are trying to show. The ask bar
        // sits on the floor, so leave it room too.
        const want = docStage.scrollTop + (r.bottom - s.top) - s.height * 0.56;
        try {
          docStage.scrollTo({ top: Math.max(0, want), behavior: 'smooth' });
        } catch (e) { docStage.scrollTop = Math.max(0, want); }
      }, slow ? 850 : 90);
    }

    function pctOf(o) {
      return Math.max(0, Math.min(100, Math.round((exchanges / o.need) * 100)));
    }

    function focus(key) {
      const o = live.find((x) => x.cfg.key === key);
      if (!o) return;
      active = key;
      live.forEach((x) => {
        x.panel.classList.toggle('fasset-on', x === o);
        x.chip.classList.toggle('active', x === o);
      });
      empty.style.display = 'none';
      titleEl.textContent = o.cfg.label;
      const n = o.secs.length;
      if (o.shown > 0 && o.shown < n) {
        cursorTxt.textContent = 'Kaiso is forging section ' + (o.shown + 1) + ' of ' + n;
        o.secs[o.shown - 1].insertAdjacentElement('afterend', cursor);
      } else if (cursor.parentNode) {
        cursor.parentNode.removeChild(cursor);
      }
      docStage.scrollTop = 0;
      paintState();
    }

    function paintState() {
      const o = live.find((x) => x.cfg.key === active);
      if (!o) { stateEl.textContent = ''; return; }
      const pct = pctOf(o);
      stateEl.textContent = pct >= 100
        ? 'Complete'
        : pct === 0 ? 'Not started' : 'Forging · ' + pct + '%';
    }

    function render() {
      let ready = 0;
      live.forEach((o) => {
        const pct = pctOf(o);
        const n = o.secs.length;
        // Something is always on screen once the forge is running, so the
        // document reads as a document from the first exchange.
        const target = pct <= 0 ? 0 : Math.max(1, Math.round((n * pct) / 100));

        let landed = null;
        const first = o.shown === 0;
        o.secs.forEach((sec, i) => {
          const was = !sec.classList.contains('fsec-skel');
          const now = i < target;
          sec.classList.toggle('fsec-skel', !now);
          if (now && !was) {
            sec.classList.remove('fsec-land');
            // reflow so the animation re-runs on a section that lands twice
            void sec.offsetWidth;
            sec.classList.add('fsec-land');
            setTimeout(() => sec.classList.remove('fsec-land'), 1000);
            landed = sec;
          }
        });
        o.shown = target;
        // Built content fills the view from the top, so without this the
        // edge between what exists and what is still forming is always
        // just below the fold — and the one thing worth watching is the
        // one thing you never see. Hold the frontier on screen instead.
        if (landed && o.cfg.key === active) frontier(landed, first);

        // The cursor belongs to whichever document is on screen.
        if (o.cfg.key === active) {
          if (target > 0 && target < n) {
            cursorTxt.textContent = 'Kaiso is forging section ' + (target + 1) + ' of ' + n;
            o.secs[target - 1].insertAdjacentElement('afterend', cursor);
          } else if (cursor.parentNode) {
            cursor.parentNode.removeChild(cursor);
          }
        }

        o.chip.style.setProperty('--p', pct);
        o.chip.classList.toggle('ready', pct >= 100);
        if (pct >= 100) {
          ready += 1;
          if (!o.wasReady) {
            o.wasReady = true;
            if (exchanges > 0) {
              o.chip.classList.add('flare');
              setTimeout(() => o.chip.classList.remove('flare'), 1600);
            }
          }
        }
      });
      countEl.textContent = String(ready);
      // A tab that says six documents are waiting should not look the
      // same as one that says none.
      handle.classList.toggle('has', ready > 0);
      paintState();
    }

    // ── Open / close ─────────────────────────────────────────────
    function open(key) {
      if (key) { userPicked = true; focus(key); }
      else if (!active) focus(bestFocus());
      document.body.classList.add('fdock-open', 'fdock-ready');
    }
    function close() {
      document.body.classList.remove('fdock-open', 'fdock-read');
    }
    function bestFocus() {
      // Whatever is closest to landing without having landed — that is
      // the one worth watching. If everything is done, the last one done.
      const forging = live.filter((o) => pctOf(o) < 100).sort((a, b) => pctOf(b) - pctOf(a));
      if (forging.length) return forging[0].cfg.key;
      return live[live.length - 1].cfg.key;
    }

    dock.querySelector('#fdockClose').addEventListener('click', close);
    handle.addEventListener('click', () => open());
    veil.addEventListener('click', () => document.body.classList.remove('fdock-read'));
    dock.querySelector('#fdockRead').addEventListener('click', () => {
      document.body.classList.toggle('fdock-read');
      document.body.classList.add('fdock-open');
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (document.body.classList.contains('fdock-read')) document.body.classList.remove('fdock-read');
      else if (document.body.classList.contains('fdock-open')) close();
    });

    // ── Wiring ───────────────────────────────────────────────────
    window.addEventListener('kaiso:exchange', () => {
      exchanges += 1;
      // Which document is on screen has to be settled before the render,
      // because the render is what moves the pen and follows the build
      // frontier — and both of those are about the active document.
      if (exchanges === 1) {
        document.body.classList.add('fdock-ready');
        if (!userPicked) focus(bestFocus());
        open();
      } else if (!userPicked) {
        // Move on only once the one being watched has actually landed,
        // so the view never jumps away from a document mid-build.
        const cur = live.find((x) => x.cfg.key === active);
        const best = bestFocus();
        if (best !== active && (!cur || pctOf(cur) >= 100)) focus(best);
      }
      render();
    });

    window.KaisoForge = {
      open,
      close,
      focus,
      keys: live.map((o) => o.cfg.key),
    };

    render();
  })();
