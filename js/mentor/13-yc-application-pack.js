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
              { ycLabel: '50-character pitch', ycHint: 'Company section', value: truncate50(e.tagline), maxLen: 50, source: e.tagline ? 'session' : 'empty' },
              { ycLabel: 'What is your company going to make?', ycHint: 'Company section', value: productDesc || '(Describe your product on YC)', source: productDesc ? 'session' : 'empty' },
              { ycLabel: 'Location', ycHint: 'Company section', value: '(Fill on YC — city where founders will be during the batch)', source: 'empty' },
            ],
          },
          {
            name: 'Progress',
            fields: [
              { ycLabel: 'How many active users or customers? Who is paying you the most?', ycHint: 'Progress · if "Are people using your product?" = Yes', value: tractionText, source: e.traction.length ? 'session' : 'empty' },
              { ycLabel: 'Revenue (6-month table)', ycHint: 'Progress · if "Do you have revenue?" = Yes', value: revenueNote ? revenueNote + '\n\n(Enter monthly USD on YC — oldest month first, not cumulative)' : '(Enter monthly revenue on YC if applicable)', source: revenueNote ? 'session' : 'empty' },
              { ycLabel: 'Growth narrative', ycHint: 'Progress · "Anything else regarding revenue or growth?"', value: progressNarrative || '(Share growth context on YC)', source: progressNarrative ? 'session' : 'empty' },
            ],
          },
          {
            name: 'Idea',
            fields: [
              { ycLabel: 'Why did you pick this idea?', ycHint: 'Idea section', value: whyYou, source: chatStory ? 'session' : 'empty' },
              { ycLabel: 'Why now?', ycHint: 'Idea section', value: e.whyNow || '(Explain timing on YC)', source: e.whyNow ? 'session' : 'empty' },
              { ycLabel: 'Competitors / alternatives', ycHint: 'Idea section', value: e.solution ? 'Incumbent workflow tools and manual ops teams. Our edge: ' + truncate50(e.tagline) : '(Describe alternatives on YC)', source: e.solution ? 'session' : 'empty' },
            ],
          },
          {
            name: 'Founder profile',
            fields: [
              { ycLabel: 'Most impressive thing', ycHint: 'Founder bio · Accomplishments', value: e.team || '(Your strongest credential)', source: e.team ? 'session' : 'empty' },
              { ycLabel: 'Background & role', ycHint: 'Founder bio · Background', value: e.team || '(Your background on YC bio page)', source: e.team ? 'session' : 'empty' },
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
          const lenHtml = f.maxLen
            ? '<div class="yc-char-count' + (f.value.length > f.maxLen ? ' over' : '') + '">'
              + f.value.length + ' / ' + f.maxLen + ' chars</div>'
            : '';
          return '<div class="yc-field" data-yc-label="' + esc(f.ycLabel) + '">'
            + '<div class="yc-field-head">'
            + '<div class="yc-field-label">' + esc(f.ycLabel)
            + (f.ycHint ? '<small>' + esc(f.ycHint) + '</small>' : '')
            + '</div>'
            + '<button class="kbtn yc-field-copy" type="button">Copy</button>'
            + '</div>'
            + '<div class="yc-field-value' + (empty ? ' empty' : '') + '">' + esc(f.value) + '</div>'
            + lenHtml
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
            showToast('Copied — paste into YC\'s ' + label);
          }).catch(() => showToast('Copy failed — select text manually'));
        });
      });
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
      fieldsEl.innerHTML = '<p class="kp-sub">Building your application pack…</p>';
      const pack = await buildYcPack();
      renderYcPanel(pack);
    }

    document.getElementById('ycOpenApplyBtn')?.addEventListener('click', () => {
      window.open(YC_APPLY_URL, '_blank', 'noopener,noreferrer');
    });
    document.getElementById('ycDownloadMdBtn')?.addEventListener('click', downloadMarkdown);

    window.kaisoYc = { render, buildYcPack, packToMarkdown };
  })();
