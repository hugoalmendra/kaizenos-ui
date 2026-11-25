  // ─── YC Application Pack ─────────────────────────────────────
  (function ycApplicationPack() {
    const YC_APPLY_URL = 'https://www.ycombinator.com/apply';
    const STORAGE_KEY = 'kaiso_yc_pack';

    const fieldsEl = document.getElementById('ycFields');
    if (!fieldsEl) return;

    const toast = document.getElementById('ktoast');
    let toastT;
    function showToast(msg) {
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(toastT);
      toastT = setTimeout(() => toast.classList.remove('show'), 2600);
    }

    function execSec(title) {
      const doc = document.getElementById('execPrintable');
      if (!doc) return '';
      for (const s of doc.querySelectorAll('.exec-sec')) {
        if (s.querySelector('.exec-sec-title')?.textContent.trim() === title)
          return s.querySelector('.exec-sec-body')?.textContent.trim() || '';
      }
      return '';
    }

    function execBandStats(bandTitle) {
      const doc = document.getElementById('execPrintable');
      if (!doc) return [];
      const lines = [];
      doc.querySelectorAll('.exec-band').forEach((band) => {
        if (band.querySelector('.exec-sec-title')?.textContent.trim() !== bandTitle) return;
        band.querySelectorAll('.exec-stat').forEach((st) => {
          const v = st.querySelector('.es-val')?.textContent.trim() || '';
          const l = st.querySelector('.es-lbl')?.textContent.trim() || '';
          if (v || l) lines.push(v + (l ? ' · ' + l : ''));
        });
      });
      return lines;
    }

    function getUserMessages() {
      const hist = window.kaiso?.history?.();
      if (hist && hist.length) {
        return hist.filter((m) => m.role === 'user').map((m) => m.content.trim()).filter(Boolean);
      }
      const log = document.getElementById('chatLog');
      if (!log) return [];
      return Array.from(log.querySelectorAll('.msg.user .body'))
        .map((el) => el.textContent.trim()).filter(Boolean);
    }

    function scrapeExec() {
      const doc = document.getElementById('execPrintable');
      if (!doc) return {};
      const contact = doc.querySelector('.exec-foot-contact')?.textContent.trim() || '';
      const parts = contact.split('·').map((s) => s.trim());
      const urlPart = parts.find((s) => !s.includes('@') && /\.\w{2,}/.test(s))
        || (parts.find((s) => s.includes('@'))?.split('@')[1] || '');
      return {
        company: doc.querySelector('.exec-co')?.textContent.trim() || '',
        tagline: doc.querySelector('.exec-tag')?.textContent.trim() || '',
        problem: execSec('The Problem'),
        solution: execSec('The Solution'),
        businessModel: execSec('Business Model'),
        whyNow: execSec('Why Now'),
        team: execSec('Team'),
        ask: execSec('The Ask'),
        contact,
        companyUrl: urlPart && !urlPart.startsWith('http') ? 'https://' + urlPart : urlPart,
        traction: execBandStats('Traction'),
        market: execBandStats('Market Opportunity'),
      };
    }

    function truncate50(s) {
      if (!s) return '';
      if (s.length <= 50) return s;
      return s.slice(0, 47) + '...';
    }

    // YC asks for a one-minute founder video and almost nobody has one
    // ready on the day. This is a read-aloud script, timed, built from
    // the same session the rest of the pack comes from.
    function videoScript(e, userMsgs) {
      if (!e.company) return '(Keep talking with Kaiso — the script needs your own words)';
      const who = (e.team || '').split('.')[0].replace(/<[^>]*>/g, '').trim();
      const first = (userMsgs[0] || '').trim();
      return [
        '0:00 — 0:10  Who you are',
        (who || 'Your name, and the one credential that makes this your problem to solve') + '.',
        '',
        '0:10 — 0:25  What you are building',
        e.tagline + ' ' + (e.solution || ''),
        '',
        '0:25 — 0:40  Why it matters',
        e.problem || '(the problem, in one breath)',
        '',
        '0:40 — 0:50  What is true already',
        e.traction.length ? e.traction.join(' · ') : '(what exists today — users, revenue, or the thing you built last week)',
        '',
        '0:50 — 1:00  Why now, and why you',
        (e.whyNow || '') + (first ? ' ' + first : ''),
      ].join('\n');
    }

    function buildYcPackTierA() {
      const e = scrapeExec();
      const userMsgs = getUserMessages();
      const chatStory = userMsgs.join('\n\n');
      const tractionText = e.traction.length
        ? e.traction.join('; ')
        : '(Add traction numbers on YC or keep talking with Kaiso)';
      const revenueNote = e.traction.find((t) => /mrr|revenue|\$/i.test(t)) || '';
      const progressNarrative = [
        e.whyNow,
        e.traction.length ? 'Traction: ' + e.traction.join('; ') : '',
      ].filter(Boolean).join('\n\n');

      const productDesc = [e.problem, e.solution].filter(Boolean).join('\n\n');
      const whyYou = chatStory
        || '(Kaiso needs more from your session — keep talking about why you\'re building this)';

      return {
        generatedAt: new Date().toISOString(),
        source: 'tier-a',
        sections: [
          {
            name: 'Company',
            fields: [
              { ycLabel: 'Company name', ycHint: 'Company section', value: e.company || '(Your company name)', source: e.company ? 'session' : 'empty' },
              { ycLabel: 'Company URL', ycHint: 'Company section', value: e.companyUrl || '(Leave blank if none — better than a placeholder)', source: e.companyUrl ? 'session' : 'empty' },
              { ycLabel: '50-character pitch', ycHint: 'Company section', value: truncate50(e.tagline), maxLen: 50, source: e.tagline ? 'session' : 'empty', pushback: 'If a stranger cannot repeat this back after one read, it is not done.' },
              { ycLabel: 'What is your company going to make?', ycHint: 'Company section', value: productDesc || '(Describe your product on YC)', source: productDesc ? 'session' : 'empty', pushback: 'They will look for the verb. What does it do, not what it enables.' },
              { ycLabel: 'Location', ycHint: 'Company section', value: '(Fill on YC — city where founders will be during the batch)', source: 'empty' },
            ],
          },
          {
            name: 'Progress',
            fields: [
              { ycLabel: 'How many active users or customers? Who is paying you the most?', ycHint: 'Progress · if "Are people using your product?" = Yes', value: tractionText, source: e.traction.length ? 'session' : 'empty', pushback: 'A small real number beats a large vague one. Name the biggest customer if you have one.' },
              { ycLabel: 'Revenue (6-month table)', ycHint: 'Progress · if "Do you have revenue?" = Yes', value: revenueNote ? revenueNote + '\n\n(Enter monthly USD on YC — oldest month first, not cumulative)' : '(Enter monthly revenue on YC if applicable)', source: revenueNote ? 'session' : 'empty' },
              { ycLabel: 'Growth narrative', ycHint: 'Progress · "Anything else regarding revenue or growth?"', value: progressNarrative || '(Share growth context on YC)', source: progressNarrative ? 'session' : 'empty' },
            ],
          },
          {
            name: 'Idea',
            fields: [
              { ycLabel: 'Why did you pick this idea?', ycHint: 'Idea section', value: whyYou, source: chatStory ? 'session' : 'empty', pushback: 'The strongest version is a thing that happened to you, with a date on it.' },
              { ycLabel: 'Why now?', ycHint: 'Idea section', value: e.whyNow || '(Explain timing on YC)', source: e.whyNow ? 'session' : 'empty' },
              { ycLabel: 'Competitors / alternatives', ycHint: 'Idea section', value: e.solution ? 'The incumbent way of doing this, and the spreadsheet people use instead. Our edge: ' + truncate50(e.tagline) : '(Describe alternatives on YC)', source: e.solution ? 'session' : 'empty', pushback: 'Saying you have no competitors reads as not having looked. Name the status quo.' },
            ],
          },
          {
            name: 'Founder profile',
            fields: [
              { ycLabel: 'Most impressive thing', ycHint: 'Founder bio · Accomplishments', value: e.team || '(Your strongest credential)', source: e.team ? 'session' : 'empty', pushback: 'It does not have to be about startups. It has to be hard and verifiable.' },
              { ycLabel: 'Background & role', ycHint: 'Founder bio · Background', value: e.team || '(Your background on YC bio page)', source: e.team ? 'session' : 'empty' },
            ],
          },
          {
            name: 'Founder video · 60 seconds',
            fields: [
              { ycLabel: 'Script', ycHint: 'YC asks for a 1-minute founder video. Read this, do not perform it.',
                value: videoScript(e, userMsgs), source: e.company ? 'session' : 'empty',
                pushback: 'Shot on a phone, one take, good light, no slides. They are looking at you, not production value.' },
            ],
          },
          {
            name: 'Other',
            fields: [
              { ycLabel: 'Business model', ycHint: 'Context for YC reviewers', value: e.businessModel || '(Describe pricing on YC if asked)', source: e.businessModel ? 'session' : 'empty' },
              { ycLabel: 'Fundraising / the ask', ycHint: 'Equity section context', value: e.ask || '(Fill equity and prior funding on YC)', source: e.ask ? 'session' : 'empty' },
              { ycLabel: 'Batch preference', ycHint: 'Batch Preference section', value: 'Apply at ycombinator.com/apply for the current open batch.', source: 'session' },
            ],
          },
        ],
      };
    }

    /*
     * Tier B — backend LLM extraction (when harness API is available):
     *   POST {cfg.apiUrl}/api/yc-pack
     *   Body: { history: chatHistory[], exec: scrapeExec() }
     *   Response: { sections: [{ name, fields: [{ ycLabel, ycHint, value, maxLen?, source }] }] }
     * Cached in localStorage (kaiso_yc_pack) when successful.
     */
    async function fetchYcPackFromApi() {
      const cfg = window.kaiso?.cfg;
      if (!cfg?.apiUrl) return null;
      try {
        const r = await fetch(cfg.apiUrl + '/api/yc-pack', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Dev-Principal': cfg.principal || '',
          },
          body: JSON.stringify({
            history: window.kaiso.history?.() || [],
            exec: scrapeExec(),
          }),
        });
        if (!r.ok) return null;
        const data = await r.json();
        if (!data || !Array.isArray(data.sections)) return null;
        data.source = 'tier-b';
        data.generatedAt = data.generatedAt || new Date().toISOString();
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (err) {}
        return data;
      } catch (err) {
        return null;
      }
    }

    let currentPack = null;

    async function buildYcPack() {
      const apiPack = await fetchYcPackFromApi();
      if (apiPack) return apiPack;
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.source === 'tier-b' && Array.isArray(parsed.sections)) return parsed;
        }
      } catch (err) {}
      return buildYcPackTierA();
    }

    function esc(s) {
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function renderYcPanel(pack) {
      currentPack = pack;
      if (!pack || !Array.isArray(pack.sections)) {
        fieldsEl.innerHTML = '<p class="kp-sub">Unable to build application pack.</p>';
        return;
      }
      fieldsEl.innerHTML = pack.sections.map((sec) => {
        const fields = (sec.fields || []).map((f) => {
          const empty = f.source === 'empty' || !f.value || String(f.value).startsWith('(');
          // Only the 50-character pitch has a limit we can state as YC's.
          // Everything else gets a length, which is information without
          // being a claim about a form we do not control.
          const lenHtml = f.maxLen
            ? '<div class="yc-char-count' + (f.value.length > f.maxLen ? ' over' : '') + '">'
              + f.value.length + ' / ' + f.maxLen + ' chars</div>'
            : (empty ? '' : '<div class="yc-char-count soft">' + f.value.length + ' chars</div>');
          const push = f.pushback
            ? '<div class="yc-push"><b>They will press on this.</b> ' + esc(f.pushback) + '</div>'
            : '';
          return '<div class="yc-field' + (empty ? ' is-empty' : '') + '" data-yc-label="' + esc(f.ycLabel) + '">'
            + '<div class="yc-field-head">'
            + '<div class="yc-field-label">' + esc(f.ycLabel)
            + (f.ycHint ? '<small>' + esc(f.ycHint) + '</small>' : '')
            + '</div>'
            + '<button class="kbtn yc-field-copy" type="button">Copy</button>'
            + '</div>'
            + '<div class="yc-field-value' + (empty ? ' empty' : '') + '">' + esc(f.value) + '</div>'
            + lenHtml
            + push
            + '</div>';
        }).join('');
        return '<div class="yc-section"><div class="yc-sec-name">' + esc(sec.name) + '</div>' + fields + '</div>';
      }).join('');

      fieldsEl.querySelectorAll('.yc-field-copy').forEach((btn) => {
        btn.addEventListener('click', () => {
          const field = btn.closest('.yc-field');
          const val = field?.querySelector('.yc-field-value')?.textContent || '';
          const label = field?.dataset.ycLabel || 'field';
          navigator.clipboard.writeText(val).then(() => {
            // Ticking the row is the whole trick: the founder is looking
            // at another tab most of the time and needs to find their
            // place again in one glance, not re-read the list.
            field.classList.add('done');
            btn.textContent = 'Copied';
            paintProgress();
            showToast('Copied — paste into YC\'s ' + label);
          }).catch(() => showToast('Copy failed — select text manually'));
        });
      });
      paintProgress();
    }

    function paintProgress() {
      const all = fieldsEl.querySelectorAll('.yc-field:not(.is-empty)');
      const done = fieldsEl.querySelectorAll('.yc-field.done');
      const el = document.getElementById('ycProgressText');
      if (el) el.textContent = done.length + ' of ' + all.length + ' copied';
      const bar = document.getElementById('ycProgressFill');
      if (bar) bar.style.width = (all.length ? (done.length / all.length) * 100 : 0) + '%';
    }

    function packToMarkdown(pack) {
      if (!pack) return '';
      let md = '# YC Application Pack\n\nGenerated by Kaiso · ' + (pack.generatedAt || new Date().toISOString()) + '\n\n';
      (pack.sections || []).forEach((sec) => {
        md += '## ' + sec.name + '\n\n';
        (sec.fields || []).forEach((f) => {
          md += '### ' + f.ycLabel + '\n';
          if (f.ycHint) md += '_' + f.ycHint + '_\n\n';
          md += (f.value || '') + '\n\n';
        });
      });
      md += '---\nApply at https://www.ycombinator.com/apply\n';
      return md;
    }

    function downloadMarkdown() {
      if (!currentPack) return;
      const co = scrapeExec().company || 'venture';
      const safe = co.replace(/[^a-zA-Z0-9가-힣一-龯_-]/g, '_').slice(0, 30);
      const dateStr = new Date().toISOString().slice(0, 10);
      const blob = new Blob([packToMarkdown(currentPack)], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kaiso_yc_pack_' + safe + '_' + dateStr + '.md';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Application pack downloaded');
    }

    async function render() {
      // Tier B goes out to the LLM, so this can sit for a few seconds.
      const loading = window.KaisoLoader
        ? window.KaisoLoader.into(fieldsEl, 'Building your pack')
        : null;
      try {
        const pack = await buildYcPack();
        if (loading) loading.close();
        renderYcPanel(pack);
      } catch (err) {
        if (loading) loading.close();
        fieldsEl.innerHTML = '<p class="kp-sub">Could not build the pack just now. Try again in a moment.</p>';
      }
    }

    // ─ Apply mode ────────────────────────────────────────────
    // YC has no API and no prefill, so nothing can submit for the
    // founder. What it can do is stop being a page they have to leave:
    // the app narrows to a companion column beside the YC tab, the
    // answers sit in YC's own order, and each one is a tap and a paste.
    // An extension could type into the form, but it would ask for an
    // install at the exact moment of intent and break the week YC
    // rebuilds the form — which is the week everybody uses it.
    function enterApplyMode() {
      document.body.classList.add('yc-apply');
      window.open(YC_APPLY_URL, '_blank', 'noopener,noreferrer');
    }
    function exitApplyMode() {
      document.body.classList.remove('yc-apply');
    }
    document.getElementById('ycOpenApplyBtn')?.addEventListener('click', enterApplyMode);
    document.getElementById('ycExitApplyBtn')?.addEventListener('click', exitApplyMode);
    document.getElementById('ycDownloadMdBtn')?.addEventListener('click', downloadMarkdown);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('yc-apply')) exitApplyMode();
    });

    window.kaisoYc = {
      render, buildYcPack, packToMarkdown,
      apply: enterApplyMode, exitApply: exitApplyMode,
    };
  })();
