  // ─── Scribe — session dividers and times ──────────────────────
  // The scribe keeps everything a founder has ever said to Kaiso, so
  // without a mark in it one session runs into the next. A divider opens
  // each session with its number, day, start time and, once it is over,
  // how long it lasted.
  //
  // Times sit on a turn only after a pause. A voice transcript arrives in
  // bursts, and a clock on every line is noise rather than information.
  //
  // A session is the stage being engaged: `body.active` on, then off.
  // The earlier sessions are stand-in transcript, so the dividers can be
  // seen without talking for two days first.
  (function scribeSessions() {
    const log = document.getElementById('chatLog');
    if (!log) return;

    const GAP_MIN = 3;   // a pause this long earns the next turn a time

    const sameDay = (a, b) => a.toDateString() === b.toDateString();
    const fmtTime = (d) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const fmtDay = (d) => {
      const now = new Date();
      if (sameDay(d, now)) return 'Today';
      if (sameDay(d, new Date(now.getTime() - 864e5))) return 'Yesterday';
      return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    let count = 0;
    let session = null;    // the open one, or the last closed one
    let lastAt = null;     // when the previous turn landed
    let engagedAt = null;  // when the stage was engaged, before any turn

    function startSession(at) {
      count += 1;
      const el = document.createElement('div');
      el.className = 'scribe-sep';
      el.setAttribute('role', 'separator');
      const label = document.createElement('span');
      label.className = 'scribe-sep-label';
      el.appendChild(label);
      log.appendChild(el);
      session = { no: count, at, el, label, endedAt: null };
      paint();
      lastAt = null;
      return session;
    }

    function endSession(at) {
      if (!session || session.endedAt) return;
      session.endedAt = at;
      paint();
    }

    function paint() {
      if (!session) return;
      const { no, at, endedAt, el, label } = session;
      const tail = endedAt
        ? Math.max(1, Math.round((endedAt - at) / 60000)) + ' min'
        : 'live';
      label.textContent = 'Session ' + no + ' · ' + fmtDay(at) + ' · ' + fmtTime(at) + ' · ' + tail;
      el.classList.toggle('live', !endedAt);
    }

    function stamp(el, at) {
      const who = el.querySelector('.who');
      if (!who || who.querySelector('.at')) return;
      const t = document.createElement('span');
      t.className = 'at';
      t.textContent = fmtTime(at);
      who.appendChild(t);
    }

    /* ── the hook the chat module calls before it appends a turn ── */
    function beforeMessage(el, who) {
      if (who === 'live') return;          // the in-flight caption, not a turn
      const at = new Date();
      if (!session || session.endedAt) startSession(engagedAt || at);
      if (lastAt && at - lastAt >= GAP_MIN * 60000) stamp(el, at);
      lastAt = at;
    }
    window.KaisoScribe = { beforeMessage };

    /* ── a session is the stage being engaged ── */
    new MutationObserver(() => {
      const active = document.body.classList.contains('active');
      if (active && !engagedAt) {
        engagedAt = new Date();
        if (session && !session.endedAt) return;
      } else if (!active && engagedAt) {
        endSession(new Date());
        engagedAt = null;
      }
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

    /* ── stand-in transcript, so the dividers have something to divide ──
       The same two sessions the Company pillar was captured in. */
    function seededMsg(who, text, at) {
      const el = document.createElement('div');
      el.className = 'msg ' + who + ' seeded';
      const label = document.createElement('div');
      label.className = 'who';
      label.textContent = who === 'user' ? 'YOU' : 'KAISO';
      const body = document.createElement('div');
      body.className = 'body' + (text.length > 60 ? ' long' : '');
      body.textContent = text;
      el.appendChild(label);
      el.appendChild(body);
      log.appendChild(el);
      return el;
    }

    const at = (base, mins) => new Date(base.getTime() + mins * 60000);
    const daysAgo = (n, h, m) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      d.setHours(h, m, 0, 0);
      return d;
    };

    const SEEDS = [
      {
        at: daysAgo(42, 9, 20), minutes: 18, turns: [
          [0, 'kaiso', 'If this worked perfectly, what would be different in the world?'],
          [1, 'user', 'Solo founders would stop losing months turning a rough idea into something an investor can actually read.'],
          [3, 'kaiso', 'Say that back to me as the reason the company exists.'],
          [4, 'user', 'Helm exists so the sequence is not the hard part. The work is.'],
          [11, 'kaiso', 'Five years out. What does the company look like?'],
          [12, 'user', 'Every serious founder walks into a raise with the same quality of material a well-funded team would have.'],
        ],
      },
      {
        at: daysAgo(6, 16, 5), minutes: 9, turns: [
          [0, 'kaiso', 'What is the one thing you do that nobody else does well?'],
          [1, 'user', 'We interview the founder and forge the artifacts out of the conversation itself.'],
          [5, 'kaiso', 'And what gets harder for someone else to copy the longer you run?'],
          [6, 'user', 'The interview data. Every session makes the next artifact better, and nobody else has the transcript.'],
        ],
      },
    ];

    SEEDS.forEach((s) => {
      startSession(s.at);
      let prev = null;
      s.turns.forEach(([mins, who, text]) => {
        const when = at(s.at, mins);
        const el = seededMsg(who, text, when);
        if (prev && when - prev >= GAP_MIN * 60000) stamp(el, when);
        prev = when;
      });
      endSession(at(s.at, s.minutes));
    });
    log.scrollTop = log.scrollHeight;
  })();
