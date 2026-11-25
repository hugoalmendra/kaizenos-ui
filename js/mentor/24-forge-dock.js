  // ─── The forge shell — a rail of assets, a document, Kaiso above it ─
  //
  // The assets used to open in the shared modal: you talked, a toast
  // said something was ready, you opened a 760px box over a blurred
  // backdrop, read it, dismissed it, and the screen looked exactly as
  // it had before. Nothing accumulated and the build happened where you
  // were not looking.
  //
  // So the layout belongs to them. A rail on the left carries every
  // asset and how far along it is, always visible, so the work in
  // progress is never something you have to go and find. Picking one
  // opens it as a column down the whole right side — a column rather
  // than an overlay, so opening a document narrows the room instead of
  // covering it, and closing it gives the room back. Kaiso and the
  // scribe are untouched in between.
  //
  // Each document is there from the first exchange as a skeleton and
  // fills in section by section as the nodes complete. The document is
  // the progress bar; there is no second one to read.
  (function forgeShell() {
    const stageEl = document.querySelector('.stage');
    if (!stageEl) return;

    // The blocks of each document that land one at a time. These are the
    // same structures the print styles and the provenance pass key on,
    // so a section is a section everywhere in the build.
    const ASSETS = [
      { key: 'pitch',   panel: 'panelPitch',   label: 'Elevator Pitch',    sel: '.pitch-block' },
      { key: 'exec',    panel: 'panelExec',    label: 'Executive Summary', sel: '.exec-banner, .exec-sec, .exec-band, .exec-foot' },
      { key: 'landing', panel: 'panelLanding', label: 'Landing Page',      sel: '.land-block' },
      { key: 'org',     panel: 'panelOrg',     label: 'Org Chart',         sel: '.org-node' },
      { key: 'brand',   panel: 'panelBrand',   label: 'Brand Kit',         sel: '.brand-block' },
      { key: 'deck',    panel: 'panelDeck',    label: 'Pitch Deck',        sel: '.deck-slide' },
    ];

    // ── Rail ─────────────────────────────────────────────────────
    const rail = document.createElement('aside');
    rail.className = 'krail';
    rail.id = 'kaisoRail';
    rail.setAttribute('aria-label', 'Your assets');
    rail.innerHTML =
      '<div class="krail-head">'
      + '<span class="tm-dot"></span>'
      + '<span class="krail-ttl">The Forge</span>'
      + '<button class="krail-min" id="krailMin" type="button" title="Collapse" aria-label="Collapse the rail">&#8249;</button>'
      + '</div>'
      + '<div class="krail-top" id="krailTop"></div>'
      + '<div class="krail-count" id="krailFoot"></div>'
      + '<div class="krail-list" id="krailList" role="list"></div>'
      + '<div class="krail-base" id="krailBase"></div>';

    // ── Document region ──────────────────────────────────────────
    const dock = document.createElement('section');
    dock.className = 'fdock';
    dock.id = 'forgeDock';
    dock.setAttribute('aria-label', 'Open asset');
    dock.innerHTML =
      '<div class="fdock-head">'
      + '<span class="tm-dot"></span>'
      + '<span class="fdock-title" id="fdockTitle">The Forge</span>'
      + '<span class="fdock-state" id="fdockState"></span>'
      + '<button class="fdock-act" id="fdockRead" type="button" title="Read at full size" aria-label="Read at full size">&#10530;</button>'
      + '<button class="fdock-act" id="fdockClose" type="button" title="Close" aria-label="Close this asset">&#10005;</button>'
      + '</div>'
      + '<div class="fdock-stage" id="fdockStage"></div>';

    const veil = document.createElement('div');
    veil.className = 'fdock-veil';

    // On a phone the rail cannot lie down any more: it carries the
    // clock, the readiness grade and the account now, and a strip of
    // pills has nowhere to put those. It becomes a drawer instead.
    const railVeil = document.createElement('div');
    railVeil.className = 'krail-veil';
    const railOpen = document.createElement('button');
    railOpen.type = 'button';
    railOpen.className = 'krail-open';
    railOpen.id = 'krailOpen';
    railOpen.setAttribute('aria-label', 'Your assets and session');
    railOpen.innerHTML = '<span></span><span></span><span></span>';

    document.body.appendChild(veil);
    document.body.appendChild(railVeil);
    document.body.appendChild(railOpen);
    document.body.appendChild(rail);
    document.body.appendChild(dock);

    const titleEl = dock.querySelector('#fdockTitle');
    const stateEl = dock.querySelector('#fdockState');
    const listEl = rail.querySelector('#krailList');
    const footEl = rail.querySelector('#krailFoot');

    // The session HUD moves into the rail. The nodes themselves are
    // moved rather than rebuilt, so every id the meters, the readiness
    // grade, the YC button and the account menu are wired to still
    // resolves — none of that code knows the furniture changed. The
    // empty rail it leaves behind goes with it.
    const hudTop = document.getElementById('hudTop');
    const readiness = document.getElementById('readiness');
    const tokenMeter = document.getElementById('tokenMeter');
    const accountBtn = document.getElementById('accountBtn');
    if (readiness) rail.querySelector('#krailTop').appendChild(readiness);
    const base = rail.querySelector('#krailBase');
    if (tokenMeter) base.appendChild(tokenMeter);
    if (accountBtn) {
      const lbl = document.createElement('span');
      lbl.className = 'account-btn-lbl';
      lbl.textContent = 'Account';
      accountBtn.appendChild(lbl);
      base.appendChild(accountBtn);
    }
    if (hudTop && !hudTop.children.length) hudTop.remove();
    const docStage = dock.querySelector('#fdockStage');

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
        cfg: a, panel, secs,
        need: Math.max(1, parseInt(libItem && libItem.dataset.need, 10) || 5),
        shown: 0, wasReady: false, row: null,
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

    live.forEach((o) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'krow';
      row.setAttribute('role', 'listitem');
      row.dataset.key = o.cfg.key;
      row.title = o.cfg.label;
      row.innerHTML =
        '<span class="krow-ring"></span>'
        + '<span class="krow-main">'
        + '<span class="krow-name"></span>'
        + '<span class="krow-state"></span>'
        + '</span>';
      row.querySelector('.krow-name').textContent = o.cfg.label;
      row.addEventListener('click', () => {
        userPicked = true;
        focus(o.cfg.key);
        document.body.classList.remove('rail-out');   // the drawer has served
      });
      listEl.appendChild(row);
      o.row = row;
    });

    // ── State ────────────────────────────────────────────────────
    let exchanges = 0;
    let active = null;
    let userPicked = false;
    let dismissed = false;   // the asset column was closed on purpose

    function pctOf(o) { return Math.max(0, Math.min(100, Math.round((exchanges / o.need) * 100))); }

    function stateWord(pct) {
      return pct >= 100 ? 'Complete' : pct === 0 ? 'Not started' : 'Forging · ' + pct + '%';
    }

    function placeCursor(o) {
      const n = o.secs.length;
      if (o.shown > 0 && o.shown < n) {
        cursorTxt.textContent = 'Kaiso is forging section ' + (o.shown + 1) + ' of ' + n;
        o.secs[o.shown - 1].insertAdjacentElement('afterend', cursor);
      } else if (cursor.parentNode) {
        cursor.parentNode.removeChild(cursor);
      }
    }

    function focus(key) {
      const o = live.find((x) => x.cfg.key === key);
      if (!o) return;
      active = key;
      live.forEach((x) => {
        x.panel.classList.toggle('fasset-on', x === o);
        x.row.classList.toggle('active', x === o);
      });
      titleEl.textContent = o.cfg.label;
      stateEl.textContent = stateWord(pctOf(o));
      docStage.scrollTop = 0;
      placeCursor(o);
      document.body.classList.add('asset-open');
    }

    // Closing gives the room back to Kaiso and takes the rail's
    // selection off, so nothing claims to be open when nothing is.
    function closeAsset() {
      dismissed = true;
      active = null;
      document.body.classList.remove('asset-open', 'fdock-read');
      live.forEach((x) => {
        x.panel.classList.remove('fasset-on');
        x.row.classList.remove('active');
      });
      if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
    }

    // Put the boundary that just moved where it can be seen.
    let scrollT = null;
    function frontier(sec, slow) {
      clearTimeout(scrollT);
      scrollT = setTimeout(() => {
        const r = sec.getBoundingClientRect();
        const s = docStage.getBoundingClientRect();
        // Anchor on the END of the section that just landed, not its
        // start: a tall section anchored at the top pushes the pen and
        // the ghost of the next one off the bottom of the view, which is
        // the whole thing we are trying to show.
        const want = docStage.scrollTop + (r.bottom - s.top) - s.height * 0.56;
        try { docStage.scrollTo({ top: Math.max(0, want), behavior: 'smooth' }); }
        catch (e) { docStage.scrollTop = Math.max(0, want); }
      }, slow ? 850 : 90);
    }

    function render() {
      let ready = 0;
      live.forEach((o) => {
        const pct = pctOf(o);
        const n = o.secs.length;
        const first = o.shown === 0;
        // Something is always on screen once the forge is running, so a
        // document reads as a document from the first exchange.
        const target = pct <= 0 ? 0 : Math.max(1, Math.round((n * pct) / 100));

        let landed = null;
        o.secs.forEach((sec, i) => {
          const was = !sec.classList.contains('fsec-skel');
          const now = i < target;
          sec.classList.toggle('fsec-skel', !now);
          if (now && !was) {
            sec.classList.remove('fsec-land');
            void sec.offsetWidth;   // reflow, so a section can land twice
            sec.classList.add('fsec-land');
            setTimeout(() => sec.classList.remove('fsec-land'), 1000);
            landed = sec;
          }
        });
        o.shown = target;

        if (o.cfg.key === active) {
          if (landed) frontier(landed, first);
          placeCursor(o);
          stateEl.textContent = stateWord(pct);
        }

        o.row.style.setProperty('--p', pct);
        o.row.classList.toggle('done', pct >= 100);
        o.row.querySelector('.krow-state').textContent = stateWord(pct);
        if (pct >= 100) {
          ready += 1;
          if (!o.wasReady) {
            o.wasReady = true;
            if (exchanges > 0) {
              o.row.classList.add('flare');
              setTimeout(() => o.row.classList.remove('flare'), 1700);
            }
          }
        }
      });
      footEl.innerHTML = '<b>' + ready + '</b> of ' + live.length + ' complete';
    }

    function bestFocus() {
      // Whatever is closest to landing without having landed — that is
      // the one worth watching. If everything is done, the last one done.
      const forging = live.filter((o) => pctOf(o) < 100).sort((a, b) => pctOf(b) - pctOf(a));
      return forging.length ? forging[0].cfg.key : live[live.length - 1].cfg.key;
    }

    function open(key) {
      document.body.classList.add('shell-on');
      dismissed = false;
      if (key) { userPicked = true; focus(key); }
      else if (!active) focus(bestFocus());
    }

    // ── Controls ─────────────────────────────────────────────────
    railOpen.addEventListener('click', () => document.body.classList.toggle('rail-out'));
    railVeil.addEventListener('click', () => document.body.classList.remove('rail-out'));
    rail.querySelector('#krailMin').addEventListener('click', () => {
      const min = document.body.classList.toggle('rail-min');
      rail.querySelector('#krailMin').innerHTML = min ? '&#8250;' : '&#8249;';
    });
    dock.querySelector('#fdockRead').addEventListener('click', () => {
      document.body.classList.toggle('fdock-read');
    });
    dock.querySelector('#fdockClose').addEventListener('click', closeAsset);
    veil.addEventListener('click', () => document.body.classList.remove('fdock-read'));
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      // Out of the drawer, then read mode, then the document.
      if (document.body.classList.contains('rail-out')) document.body.classList.remove('rail-out');
      else if (document.body.classList.contains('fdock-read')) document.body.classList.remove('fdock-read');
      else if (document.body.classList.contains('asset-open')) closeAsset();
    });

    // ── Wiring ───────────────────────────────────────────────────
    window.addEventListener('kaiso:exchange', () => {
      exchanges += 1;
      // Which document is on screen has to be settled before the render,
      // because the render moves the pen and follows the build frontier,
      // and both of those are about the active document.
      document.body.classList.add('shell-on');
      // The column shows itself once, on the first thing there is to
      // show. After that it is the user's: a close is respected and the
      // rail is how you come back.
      if (exchanges === 1) {
        if (!dismissed) open();
      } else if (!userPicked && !dismissed && active) {
        // Move on only once the one being watched has landed, so the
        // view never jumps away from a document mid-build.
        const cur = live.find((x) => x.cfg.key === active);
        const best = bestFocus();
        if (best !== active && (!cur || pctOf(cur) >= 100)) focus(best);
      }
      render();
    });

    window.KaisoForge = { open, close: closeAsset, focus, keys: live.map((o) => o.cfg.key) };

    render();
  })();
