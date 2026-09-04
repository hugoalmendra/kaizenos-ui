  // ─── Your Company — the overview ──────────────────────────────
  // Everything Kaiso has captured about the venture, laid out as cards
  // grouped by pillar. Every node is drawn: captured ones are lit and
  // carry the answer; the rest sit dimmed with the question Kaiso will
  // ask, so the founder can see the whole shape of what is coming and
  // how far along they are. A card opens on click to show the question
  // it answers, the captured text, where it came from, and an Edit.
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

    /* The question Kaiso asks for each node. Shown on captured cards as
       "Kaiso asked" and on the dimmed ones as "Kaiso will ask" — the
       question is what makes an empty card worth opening. One per node
       so the founder can read the whole interview ahead of time. */
    const QUESTIONS = {
      // Company
      'company:Mission':  'If this worked perfectly, what would be different in the world?',
      'company:Vision':   'Five years from now, what does the company look like?',
      'company:Wedge':    'What is the one thing you do that nobody else does well?',
      'company:Moat':     'What gets harder for someone else to copy the longer you run?',
      'company:Why Now':  'Why could this not have been built before?',
      'company:BHAG':     'What would make this a company people write about?',
      // People
      'people:Founder Edge':  'What do you know about this problem that most people get wrong?',
      'people:Co-founders':   'Who else is in this with you, and what do they own?',
      'people:Culture Code':  'What behaviour would get someone quietly pushed out of your team?',
      'people:First 5 Hires': 'If you could only hire five people this year, who are they?',
      'people:Advisors':      'Who do you call when you are stuck, and why do they pick up?',
      'people:Org Shape':     'What does the team look like at twenty people?',
      // Product
      'product:What it Is':    'Describe the product to me as if I had never seen software.',
      'product:Problem':       'What is the pain, and how are people getting around it today?',
      'product:Magic Moment':  'When does a new user first think, "oh — this is different"?',
      'product:Roadmap':       'What ships in the next ninety days, and what deliberately does not?',
      'product:Traction':      'What is the one number that proves people want this?',
      'product:Distribution':  'How does the next hundred customers find out you exist?',
      // Finance
      'finance:The Ask':          'How much are you raising, and what does it buy?',
      'finance:Use of Funds':     'Where does the first dollar go, and where does the last one go?',
      'finance:Milestones':       'What has to be true before the next round makes sense?',
      'finance:Unit Economics':   'What does one customer cost you, and what do they pay you back?',
      'finance:Runway':           'How many months until the money runs out at today\'s burn?',
      'finance:Investor Returns': 'If this works, what does an investor get back — and when?',
      // Goals
      'goals:North Star':       'What one number, if it went up, would mean everything is working?',
      'goals:Quarterly OKRs':   'What are you committing to finish by the end of this quarter?',
      'goals:KPIs':             'Which three numbers do you look at every Monday morning?',
      'goals:Review Cadence':   'How often do you stop and check whether the plan is still right?',
      'goals:Top 3 Priorities': 'If you could only do three things this month, what are they?',
      // Systems
      'systems:Core Process':      'Walk me through how work goes from an idea to a customer.',
      'systems:SOPs':              'What do you do the same way every time, and is it written down?',
      'systems:Operating Rituals': 'What meetings would the company fall apart without?',
      'systems:Tooling Stack':     'What tools does the team live in, and which one would you not give up?',
      'systems:Bottleneck':        'Where does work pile up, and whose desk is it on?',
      // Technology
      'technology:Tech Stack':       'What is the product built on, and why those choices?',
      'technology:Architecture Bet': 'What technical decision would be painful to reverse?',
      'technology:AI Posture':       'Where does AI sit in the product — core, feature, or not yet?',
      'technology:Security':         'What is the worst thing that could leak, and how is it protected?',
      'technology:Tech Debt':        'What did you build fast that you already know you will rebuild?',
      // Playbooks
      'playbooks:GTM Playbook': 'What is the repeatable sequence that turns a stranger into a customer?',
      'playbooks:Sales Motion': 'Who sells, to whom, and how long does it take?',
      'playbooks:Onboarding':   'What happens in a customer\'s first hour, and where do they get lost?',
      'playbooks:Retention':    'Why does a customer stay in month six?',
      'playbooks:Expansion':    'How does a small customer become a big one?',
      // Data
      'data:Data Model':        'What are the five things your system knows about, and how do they relate?',
      'data:Data Moat':         'What data do you collect that competitors cannot buy?',
      'data:Dashboards':        'What does the company look at to know how it is doing?',
      'data:Experiment Engine': 'How do you decide whether an idea worked?',
      'data:Governance':        'Who owns the data, who can see it, and how do you know?',
    };
    const fallbackQ = (s) => 'Tell me about ' + s.node.toLowerCase() + ' for ' + s.pillar.name.toLowerCase() + '.';

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

    const openKeys = new Set();   // which cards are expanded — survives re-render
    let firstPaint = true;

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
      const added = [];
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
      return added;
    }

    function companyName() {
      const exec = document.querySelector('.exec-co, .land-logo');
      return (exec && exec.textContent.trim()) || 'Your venture';
    }

    /* ── render ── */
    function card(s, ignite) {
      const k = key(s);
      const c = captured[k];
      const q = QUESTIONS[k] || fallbackQ(s);
      const isOpen = openKeys.has(k);
      const cls = ['co-card', c ? 'captured' : 'ghost', isOpen ? 'open' : '', ignite ? 'ignite' : ''].filter(Boolean).join(' ');

      const inner = c
        ? `<div class="co-q"><span class="co-q-mark">?</span><div><span class="co-q-lbl">Kaiso asked</span><p>${esc(q)}</p></div></div>
           <p class="co-text">${esc(c.text)}</p>
           <div class="co-source">
             <span class="co-source-tag${c.mine ? ' mine' : ''}">${c.mine ? 'Edited by you' : esc(c.source)}</span>
             ${c.mine ? '<span>Kaiso will ask before changing this.</span>' : ''}
           </div>
           <div class="co-card-actions"><button class="kbtn" type="button" data-edit="${esc(k)}">Edit</button></div>`
        : `<div class="co-q"><span class="co-q-mark">?</span><div><span class="co-q-lbl">Kaiso will ask</span><p>${esc(q)}</p></div></div>
           <p class="co-ghost-note">Nothing captured yet. Bring it up in your next session and it fills in here.</p>
           <div class="co-card-actions"><button class="kbtn primary" type="button" data-talk="${esc(k)}">Talk about this now</button></div>`;

      return `<article class="${cls}" data-key="${esc(k)}">
        <button class="co-card-head" type="button" data-toggle="${esc(k)}" aria-expanded="${isOpen}">
          <span class="co-status"></span>
          <span class="co-node">${esc(s.node)}</span>
          <span class="co-preview">${c ? esc(c.text) : esc(q)}</span>
          <span class="co-chev">›</span>
        </button>
        <div class="co-card-body"><div class="co-card-inner"><div class="co-card-pad">${inner}</div></div></div>
      </article>`;
    }

    function render(ignite) {
      ignite = ignite || [];
      const total = W.steps.length;
      const done  = W.steps.filter((s) => captured[key(s)]).length;

      const sections = W.pillars.map((p, i) => {
        const steps = W.steps.filter((s) => s.pillar.id === p.id);
        const n = steps.filter((s) => captured[key(s)]).length;
        return `<section class="co-section" style="--i:${i}">
          <div class="co-section-head">
            <span class="co-section-dot" style="background:${p.color};box-shadow:0 0 8px ${p.color}"></span>
            <span class="co-section-name" style="color:${p.color}">${esc(p.name)}</span>
            <span class="co-section-count">${n} of ${steps.length}</span>
          </div>
          <div class="co-section-bar"><span style="width:${(n / steps.length) * 100}%"></span></div>
          ${steps.map((s) => card(s, ignite.includes(key(s)))).join('')}
        </section>`;
      }).join('');

      body.innerHTML = `<header class="co-head">
        <div class="co-eyebrow">Your company</div>
        <h1 class="co-name">${esc(companyName())}</h1>
        <p class="co-sub">${done ? 'Everything Kaiso has captured so far. The rest fills in as you talk.' : 'Nothing captured yet. Every card below fills in as you talk to Kaiso.'}</p>
      </header>${sections}`;

      metaEl.textContent = done + ' of ' + total + ' captured';
      // sections rise in once; a re-render while open shouldn't replay it
      body.classList.toggle('settled', !firstPaint);
      firstPaint = false;
    }

    /* ── interactions ── */
    body.addEventListener('click', (e) => {
      const t = e.target.closest('[data-toggle]');
      if (t) { toggle(t.dataset.toggle); return; }
      const editBtn = e.target.closest('[data-edit]');
      if (editBtn) { startEdit(editBtn.dataset.edit); return; }
      const save = e.target.closest('[data-save]');
      if (save) { finishEdit(save.dataset.save, true); return; }
      const cancel = e.target.closest('[data-cancel]');
      if (cancel) { finishEdit(cancel.dataset.cancel, false); return; }
      const talk = e.target.closest('[data-talk]');
      if (talk) { talkAbout(talk.dataset.talk); }
    });

    function cardEl(k) { return body.querySelector(`.co-card[data-key="${CSS.escape(k)}"]`); }

    function toggle(k) {
      const c = cardEl(k);
      if (!c) return;
      if (c.classList.contains('editing')) return;   // don't collapse mid-edit
      const open = !openKeys.has(k);
      open ? openKeys.add(k) : openKeys.delete(k);
      c.classList.toggle('open', open);
      c.querySelector('[data-toggle]').setAttribute('aria-expanded', String(open));
    }

    /* A dimmed card's call to action: point the wheel at that node and
       go back to the conversation. */
    function talkAbout(k) {
      const s = W.steps.find((x) => key(x) === k);
      if (!s) return;
      W.setStep(s.pillar.id, s.node);
      close();
      toast('Kaiso will pick up ' + s.node + ' next');
    }

    function startEdit(k) {
      const c = cardEl(k);
      if (!c || c.classList.contains('editing')) return;
      c.classList.add('editing');
      c.querySelector('.co-text').outerHTML =
        `<textarea class="co-textarea" data-field="${esc(k)}">${esc(captured[k].text)}</textarea>`;
      c.querySelector('.co-card-actions').innerHTML =
        `<button class="kbtn" type="button" data-cancel="${esc(k)}">Cancel</button>
         <button class="kbtn primary" type="button" data-save="${esc(k)}">Save</button>`;
      const ta = c.querySelector('textarea');
      ta.focus();
      ta.setSelectionRange(ta.value.length, ta.value.length);
    }

    function finishEdit(k, save) {
      const c = cardEl(k);
      if (!c) return;
      if (save) {
        const v = c.querySelector('textarea').value.trim();
        if (!v) { toast('Nothing to save'); return; }
        if (v !== captured[k].text) {
          captured[k].text = v;
          captured[k].mine = true;
          toast('Saved — Kaiso will ask before changing it');
        }
      }
      // swap just this card back, so the rest of the page doesn't blink
      const s = W.steps.find((x) => key(x) === k);
      c.outerHTML = card(s, false);
    }

    /* ── grows as the founder talks ── */
    window.addEventListener('kaiso:exchange', () => {
      const added = syncFromWheel();
      if (!el.classList.contains('open')) return;
      added.forEach((k) => openKeys.add(k));   // a fresh capture opens itself
      render(added);
      if (added.length) cardEl(added[0])?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    /* ── open / close ── */
    function open() {
      firstPaint = true;
      const added = syncFromWheel();
      added.forEach((k) => openKeys.add(k));
      el.classList.add('open');
      document.body.style.overflow = 'hidden';
      render(added);
      el.querySelector('.co-scroll').scrollTop = 0;
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
