  // ─── Documents — what the founder has already written down ────
  // A founder arriving with a deck, a cap table and a model has already
  // answered a third of the wheel. Asking those questions again is the
  // fastest way to make a mentor feel like a form.
  //
  // So: they hand the documents over, Kaiso reads them, every fact it
  // finds lands on the node it answers, and the conversation walks past
  // those nodes instead of through them.
  //
  // Three beats, the same shape as Ask Kaiso to change:
  //   1. the way in      — attach, or drop anything on the stage
  //   2. the reading     — a file at a time, with what it found
  //   3. what it learned — every fact, its source, and a way to say no
  //
  // Beat 3 is the one that matters. A fact read wrongly does not just
  // sit there being wrong: it silences the question that would have
  // caught it. So nothing is silent — every filled node says which
  // document filled it, and one click hands the question back.
  (function documents() {
    const panel   = document.getElementById('panelDocs');
    const listEl  = document.getElementById('docsList');
    const factsEl = document.getElementById('docsFacts');
    const emptyEl = document.getElementById('docsEmpty');
    const countEl = document.getElementById('docsCount');
    const fileEl  = document.getElementById('docsFile');
    const attach  = document.getElementById('chatAttach');
    const stage   = document.body;
    if (!panel || !fileEl) return;

    const MAX_BYTES = 12 * 1024 * 1024;
    const READABLE = /\.(txt|md|markdown|csv|json|html?)$/i;

    const esc = (v) => String(v == null ? '' : v).replace(/[<>&"]/g, (c) => (
      { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

    const clip = (s, n) => {
      const t = String(s || '').replace(/\s+/g, ' ').trim();
      return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;
    };

    const fmtSize = (b) => b < 1024 ? b + ' B'
      : b < 1048576 ? (b / 1024).toFixed(0) + ' KB'
      : (b / 1048576).toFixed(1) + ' MB';

    /* ── What a sentence is about ────────────────────────────
     * Each node names the words that mean it. A sentence carrying one
     * of them is offered as the answer to that node, and the sentence
     * itself is kept so the founder reads what Kaiso read rather than
     * a summary of it.
     */
    const CUES = [
      ['company', 'Mission',       /\bmission\b|\bwe exist to\b|\bour purpose\b/i],
      ['company', 'Vision',        /\bvision\b|\bin (five|ten|3|5|10) years\b/i],
      ['company', 'Wedge',         /\bwedge\b|\bbeachhead\b|\bstart(ing)? with\b.*\bcustomers?\b/i],
      ['company', 'Moat',          /\bmoat\b|\bdefensib|\bunfair advantage\b|\bbarrier to entry\b/i],
      ['company', 'Why Now',       /\bwhy now\b|\btiming\b|\bonly possible (now|today)\b/i],
      ['people',  'Founder Edge',  /\bfounder(-| )market fit\b|\bfounder edge\b|\bI (previously|spent)\b/i],
      ['people',  'Co-founders',   /\bco[- ]?founder\b|\bcap table\b|\bequity split\b|\bfounders?\b.*\b%\b/i],
      ['people',  'First 5 Hires', /\bfirst (five|5) hires\b|\bhiring plan\b|\bheadcount\b/i],
      ['people',  'Advisors',      /\badvisor\b|\badvisory board\b/i],
      ['people',  'Org Shape',     /\borg chart\b|\breports? to\b|\bteam structure\b/i],
      ['product', 'What it Is',    /\bwe are building\b|\bthe product is\b|\bplatform that\b/i],
      ['product', 'Problem',       /\bproblem\b|\bpain point\b|\bcustomers? (lose|waste|struggle)\b/i],
      ['product', 'Magic Moment',  /\bmagic moment\b|\baha moment\b|\bfirst value\b/i],
      ['product', 'Roadmap',       /\broadmap\b|\bnext (quarter|release)\b|\bshipping\b/i],
      ['product', 'Traction',      /\btraction\b|\b(MRR|ARR)\b|\bpaying customers?\b|\bwaitlist\b|\bretention\b/i],
      ['product', 'Distribution',  /\bdistribution\b|\bchannel\b|\bgo[- ]to[- ]market\b|\bGTM\b/i],
      ['finance', 'The Ask',       /\brais(e|ing)\b.*[\$£€]\s?[\d.]/i],
      ['finance', 'Use of Funds',  /\buse of (funds|proceeds)\b|\ballocat(e|ion)\b.*\b(hiring|engineering)\b/i],
      ['finance', 'Milestones',    /\bmilestones?\b|\bby (Q[1-4]|end of)\b/i],
      ['finance', 'Unit Economics',/\b(CAC|LTV|gross margin|payback period)\b/i],
      ['finance', 'Runway',        /\brunway\b|\bmonths of cash\b|\bburn rate\b/i],
      ['goals',   'North Star',    /\bnorth star\b/i],
      ['goals',   'Quarterly OKRs',/\bOKRs?\b|\bobjectives? and key results\b/i],
      ['goals',   'KPIs',          /\bKPIs?\b|\bkey metrics?\b/i],
      ['systems', 'Core Process',  /\bcore process\b|\bour workflow\b/i],
      ['systems', 'Tooling Stack', /\btooling\b|\bwe use (Slack|Notion|Linear|Jira)\b/i],
      ['technology', 'Tech Stack', /\btech stack\b|\bbuilt (on|with)\b|\b(React|Postgres|Python|Rust|Node)\b/i],
      ['technology', 'Architecture Bet', /\barchitectur|\bmonolith\b|\bmicroservices\b/i],
      ['technology', 'AI Posture', /\b(LLM|AI)\b.*\b(strategy|posture|model)\b|\bwe use (Claude|GPT|Gemini)\b/i],
      ['technology', 'Security',   /\bSOC ?2\b|\bGDPR\b|\bencryption\b|\bpen ?test\b/i],
      ['playbooks', 'GTM Playbook',/\bGTM playbook\b|\bgrowth plan\b/i],
      ['playbooks', 'Sales Motion',/\bsales motion\b|\bself[- ]serve\b|\boutbound\b|\bPLG\b/i],
      ['playbooks', 'Onboarding',  /\bonboarding\b/i],
      ['playbooks', 'Retention',   /\bchurn\b|\bretention\b/i],
      ['data',    'Dashboards',    /\bdashboards?\b|\b(Looker|Metabase|Amplitude)\b/i],
      ['data',    'Governance',    /\bdata (governance|retention)\b|\bPII\b/i],
    ];

    /* ── What a document is, when it cannot be read ──────────
     * A PDF or a .pptx cannot be read in the browser without shipping a
     * parser, which this prototype is not going to do. What it can do
     * honestly is say which nodes a document of that name would answer
     * and leave the value blank, so the founder confirms rather than
     * Kaiso inventing.
     */
    const KINDS = [
      { re: /deck|pitch/i, name: 'pitch deck',
        nodes: [['product', 'Problem'], ['product', 'What it Is'], ['company', 'Why Now'],
                ['product', 'Traction'], ['finance', 'The Ask']] },
      { re: /cap[\s_-]?table|equity/i, name: 'cap table',
        nodes: [['people', 'Co-founders'], ['people', 'Advisors'], ['people', 'Org Shape']] },
      { re: /model|financial|forecast|p&l|budget/i, name: 'financial model',
        nodes: [['finance', 'Runway'], ['finance', 'Unit Economics'], ['finance', 'Milestones'],
                ['product', 'Traction']] },
      { re: /roadmap|spec|prd/i, name: 'roadmap',
        nodes: [['product', 'Roadmap'], ['product', 'What it Is']] },
      { re: /brand|identity|style[\s_-]?guide/i, name: 'brand guide',
        nodes: [['company', 'Mission'], ['company', 'Vision']] },
      { re: /org|team|people|hiring/i, name: 'org document',
        nodes: [['people', 'Org Shape'], ['people', 'First 5 Hires']] },
    ];

    const docs = [];      // { id, name, size, state, facts: [] }
    let seq = 0;

    /* ── Beat 2: the reading ─────────────────────────────── */

    // A sentence, near enough. Documents are not prose and splitting on
    // newlines as well keeps a bulleted deck from arriving as one line.
    function sentences(text) {
      return text.split(/(?:[.!?]\s+)|\n+/).map((s) => s.trim()).filter((s) => s.length > 24);
    }

    function readText(text, docName) {
      const found = [];
      const taken = new Set();
      for (const line of sentences(text)) {
        for (const [pillar, node, re] of CUES) {
          const key = pillar + '/' + node;
          if (taken.has(key) || !re.test(line)) continue;
          taken.add(key);
          found.push({ pillar, node, value: clip(line, 180), source: docName, sure: true });
        }
      }
      return found;
    }

    function readByName(name) {
      const kind = KINDS.find((k) => k.re.test(name));
      if (!kind) return [];
      return kind.nodes.map(([pillar, node]) => ({
        pillar, node, value: '', source: name, sure: false, kind: kind.name,
      }));
    }

    function file(f) {
      const doc = { id: ++seq, name: f.name, size: f.size, state: 'reading', facts: [] };
      docs.push(doc);
      render();

      const finish = (facts) => {
        doc.facts = facts;
        doc.state = facts.length ? 'read' : 'nothing';
        facts.forEach(apply);
        render();
        announce(doc);
      };

      if (f.size > MAX_BYTES) {
        doc.state = 'too-big';
        render();
        return;
      }
      if (READABLE.test(f.name)) {
        const r = new FileReader();
        r.onload = () => finish(readText(String(r.result || ''), f.name));
        r.onerror = () => { doc.state = 'failed'; render(); };
        r.readAsText(f);
      } else {
        // Nothing to parse, so nothing is claimed to have been parsed.
        setTimeout(() => finish(readByName(f.name)), 700);
      }
    }

    function apply(fact) {
      const W = window.KaisoWheel;
      if (!W) return;
      const step = W.findStep(fact.pillar, fact.node);
      if (step < 0) return;
      fact.stepIndex = step;
      // A guess from the filename is not an answer. It marks the node as
      // half-known and leaves the question standing until confirmed.
      W.fillNode(step, { pct: fact.sure ? 100 : 50, source: fact.source, value: fact.value });
    }

    function announce(doc) {
      const n = doc.facts.length;
      const msg = !n ? 'Kaiso read ' + doc.name + ' and found nothing it could place'
        : 'Kaiso read ' + doc.name + ' — ' + n + (n === 1 ? ' answer' : ' answers') + ' filled in';
      const t = document.getElementById('ktoast');
      if (!t) return;
      t.textContent = msg;
      t.classList.add('show');
      clearTimeout(announce._t);
      announce._t = setTimeout(() => t.classList.remove('show'), 4000);
    }

    /* ── Beat 3: what it learned ─────────────────────────── */

    const STATE_TEXT = {
      reading: 'Kaiso is reading…',
      nothing: 'Nothing in it answered a node',
      'too-big': 'Too large to read — 12 MB is the limit',
      failed: 'Could not be read',
    };

    function render() {
      const facts = docs.reduce((n, d) => n + d.facts.length, 0);
      const sure = docs.reduce((n, d) => n + d.facts.filter((f) => f.sure).length, 0);
      emptyEl.hidden = docs.length > 0;
      if (countEl) {
        countEl.textContent = !facts ? ''
          : sure + ' answered · ' + (facts - sure) + ' to confirm';
      }

      listEl.innerHTML = docs.map((d) => {
        // A guess from the filename has answered nothing yet, and a row
        // that counts it as an answer is the panel telling the founder
        // something it has not earned.
        const sure = d.facts.filter((f) => f.sure).length;
        const open = d.facts.length - sure;
        const parts = [];
        if (sure) parts.push(sure + (sure === 1 ? ' answer' : ' answers'));
        if (open) parts.push(open + ' to confirm');
        const sub = d.state === 'read'
          ? parts.join(' · ') + ' · ' + fmtSize(d.size)
          : STATE_TEXT[d.state] || '';
        return '<div class="doc-item' + (d.state === 'reading' ? ' reading' : '') + '">' +
          '<span class="doc-thumb" aria-hidden="true">' + (d.state === 'reading' ? '◌' : '▤') + '</span>' +
          '<span class="doc-meta"><b>' + esc(d.name) + '</b><span>' + esc(sub) + '</span></span>' +
          '<button class="kbtn doc-drop" type="button" data-forget="' + d.id + '">Remove</button>' +
        '</div>';
      }).join('');

      const rows = [];
      docs.forEach((d) => d.facts.forEach((f, i) => {
        const cls = 'doc-fact' + (f.sure ? '' : ' unsure');
        rows.push('<div class="' + cls + '">' +
          '<div class="doc-fact-head">' +
            '<span class="doc-fact-node">' + esc(f.node) + '</span>' +
            '<span class="doc-fact-src">' + esc(f.sure ? f.source : 'likely in ' + (f.kind || f.source)) + '</span>' +
          '</div>' +
          (f.value
            ? '<blockquote class="doc-fact-value">' + esc(f.value) + '</blockquote>'
            : '<p class="doc-fact-value empty">Kaiso will ask you to confirm this one — it could not read the file, only recognise what it is.</p>') +
          '<div class="doc-fact-acts">' +
            '<span class="doc-fact-note">' + (f.sure
              ? 'Kaiso won’t ask about this.'
              : 'Kaiso will still ask, briefly.') + '</span>' +
            '<button class="kbtn" type="button" data-unfill="' + d.id + ':' + i + '">Ask me anyway</button>' +
          '</div>' +
        '</div>');
      }));
      factsEl.innerHTML = rows.join('');
    }

    panel.addEventListener('click', (e) => {
      const forget = e.target.closest('[data-forget]');
      if (forget) {
        const id = +forget.dataset.forget;
        const at = docs.findIndex((d) => d.id === id);
        if (at < 0) return;
        docs[at].facts.forEach((f) => {
          if (f.stepIndex != null && window.KaisoWheel) window.KaisoWheel.clearNode(f.stepIndex);
        });
        docs.splice(at, 1);
        render();
        return;
      }
      const unfill = e.target.closest('[data-unfill]');
      if (unfill) {
        const [id, i] = unfill.dataset.unfill.split(':');
        const doc = docs.find((d) => d.id === +id);
        if (!doc) return;
        const fact = doc.facts[+i];
        if (fact && fact.stepIndex != null && window.KaisoWheel) {
          window.KaisoWheel.clearNode(fact.stepIndex);
        }
        doc.facts.splice(+i, 1);
        render();
      }
    });

    /* ── Beat 1: the way in ──────────────────────────────── */

    function take(files) {
      Array.from(files || []).forEach(file);
      if (window.KaisoPanels) window.KaisoPanels.open('docs');
    }

    fileEl.addEventListener('change', () => { take(fileEl.files); fileEl.value = ''; });
    if (attach) attach.addEventListener('click', () => fileEl.click());
    panel.querySelectorAll('[data-docs-add]').forEach((b) =>
      b.addEventListener('click', () => fileEl.click()));

    // Dropping on the stage is the shortest way in, so the stage says so
    // the moment something is dragged over it.
    let depth = 0;
    stage.addEventListener('dragenter', (e) => {
      if (!e.dataTransfer || e.dataTransfer.types.indexOf('Files') < 0) return;
      e.preventDefault();
      depth += 1;
      stage.classList.add('doc-dragging');
    });
    stage.addEventListener('dragover', (e) => {
      if (e.dataTransfer && e.dataTransfer.types.indexOf('Files') >= 0) e.preventDefault();
    });
    stage.addEventListener('dragleave', () => {
      depth = Math.max(0, depth - 1);
      if (!depth) stage.classList.remove('doc-dragging');
    });
    stage.addEventListener('drop', (e) => {
      if (!e.dataTransfer || !e.dataTransfer.files.length) return;
      e.preventDefault();
      depth = 0;
      stage.classList.remove('doc-dragging');
      take(e.dataTransfer.files);
    });

    // What the harness needs to stop asking what it has been told.
    window.KaisoDocs = {
      documents: () => docs.map((d) => ({ name: d.name, facts: d.facts.length })),
      known: () => docs.flatMap((d) => d.facts
        .filter((f) => f.sure)
        .map((f) => ({ pillar: f.pillar, node: f.node, value: f.value, source: f.source }))),
      add: take,
    };

    render();
  })();
