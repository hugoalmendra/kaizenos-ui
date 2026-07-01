/** Build a founder summary report from intake payload (Tier A · offline). */
window.KaisoIntakeReport = (function () {
  function esc(s) {
    if (s == null || s === '') return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtMoney(n) {
    if (n == null || n === '' || !Number.isFinite(Number(n))) return null;
    return '$' + Number(n).toLocaleString('en-US');
  }

  function yesNo(v) {
    if (v === true) return 'Yes';
    if (v === false) return 'No';
    return '—';
  }

  function listOrDash(arr) {
    if (!arr || !arr.length) return '—';
    return arr.join(', ');
  }

  function teamSize(team) {
    var ft = team.team_fulltime;
    var pt = team.team_parttime;
    var tech = team.team_technical;
    var parts = [];
    if (ft != null) parts.push(ft + ' FT');
    if (pt != null) parts.push(pt + ' PT');
    if (tech != null) parts.push(tech + ' technical');
    return parts.length ? parts.join(' · ') : 'Founders only';
  }

  function tractionSummary(traction) {
    if (!traction.has_users) {
      return 'Pre-customer — focus is on validating demand and reaching first users.';
    }
    var parts = [];
    if (traction.users_paying != null) {
      parts.push(traction.users_paying + ' paying customer' + (traction.users_paying === 1 ? '' : 's'));
    }
    if (traction.customer_size_segments && traction.customer_size_segments.length) {
      parts.push('serving ' + traction.customer_size_segments.join(', '));
    }
    if (traction.top_customer) {
      var top = traction.top_customer;
      var amt = fmtMoney(traction.top_customer_amount);
      if (amt) top += ' (' + amt + ')';
      parts.push('top account: ' + top);
    }
    return parts.length ? parts.join('; ') + '.' : 'Early customer traction — details captured in your intake.';
  }

  function legalSummary(legal) {
    if (!legal.is_incorporated) {
      return 'Not yet incorporated — entity structure is an open item before fundraising.';
    }
    var s = (legal.entity_type || 'Entity') + ' in ' + (legal.jurisdiction || '—');
    if (legal.noncompete_ip_conflicts) s += '. IP / noncompete flag noted — worth resolving before diligence.';
    if (legal.prior_accelerators_flag && legal.prior_accelerators_detail) {
      s += ' Prior programs: ' + legal.prior_accelerators_detail + '.';
    }
    return s;
  }

  function nextStep(company, traction, team) {
    var stage = (company.progress_stage || '').toLowerCase();
    if (!traction.has_users) {
      return 'Kaiso will pressure-test your ICP and first-go-to-market motion — then forge a Landing Page and Pitch Deck anchored on what you submitted.';
    }
    if (stage.indexOf('revenue') >= 0 || stage.indexOf('launch') >= 0) {
      return 'With traction on the board, Kaiso can turn this profile into an Executive Summary and investor-ready narrative in your first session.';
    }
    if ((team.team_fulltime || 0) + (team.team_parttime || 0) === 0) {
      return 'You\'re building lean — Kaiso will help sharpen the story and artifacts before you scale the team.';
    }
    return 'Your intake gives Kaiso enough context to skip the basics and start forging your venture kit in the first conversation.';
  }

  function build(payload) {
    payload = payload || {};
    var company = payload.company || {};
    var founders = payload.founders || [];
    var team = payload.team || {};
    var traction = payload.traction || {};
    var legal = payload.legal || {};
    var primary = founders[0] || {};
    var name = company.company_name || 'Your venture';
    var stage = company.progress_stage || 'Stage TBD';
    var category = company.company_category || '—';
    var months = team.time_commitment_duration != null ? team.time_commitment_duration : '—';

    var founderLines = founders.map(function (f, i) {
      var line = (f.founder_name || 'Founder ' + (i + 1));
      if (f.time_commitment_fulltime === true) line += ' · full-time';
      else if (f.time_commitment_fulltime === false) line += ' · part-time';
      return line;
    });

    var tech = listOrDash(company.core_technology);
    var location = company.founder_location || '—';
    var hq = company.hq_location || '—';

    var headline = name;
    var tagline = stage + ' · ' + category;

    var intro = 'Hi ' + (primary.founder_name ? primary.founder_name.split(' ')[0] : 'founder') + ' — ';
    intro += 'here\'s the venture profile Kaiso built from your intake. This is the baseline your mentor session will extend — not repeat.';

    var sections = [
      {
        label: 'Venture snapshot',
        body: name + ' is at the ' + stage.toLowerCase() + ' stage in ' + category + '. '
          + (company.company_url ? 'Product: ' + company.company_url + '. ' : '')
          + (tech !== '—' ? 'Stack: ' + tech + '. ' : '')
          + 'Based in ' + location + (hq !== location ? '; planned HQ: ' + hq : '') + '.'
      },
      {
        label: 'Team profile',
        body: (team.founder_count || founders.length) + ' founder' + ((team.founder_count || founders.length) === 1 ? '' : 's')
          + ' (' + founderLines.join('; ') + '), '
          + months + ' months on the project. Team beyond founders: ' + teamSize(team) + '.'
      },
      {
        label: 'Traction signal',
        body: tractionSummary(traction)
          + (traction.engagement_retention ? ' Engagement notes: ' + traction.engagement_retention : '')
      },
      {
        label: 'Corporate & legal',
        body: legalSummary(legal)
      },
      {
        label: 'What Kaiso sees next',
        body: nextStep(company, traction, team)
      }
    ];

    var mailSubj = 'Your Venture Profile: ' + name;
    var mailPreview = stage + ' · ' + category + ' — ' + tractionSummary(traction).slice(0, 120);
    var preheader = mailPreview;

    return {
      headline: headline,
      tagline: tagline,
      intro: intro,
      sections: sections,
      mailSubj: mailSubj,
      mailPreview: mailPreview,
      preheader: preheader,
      companyName: name,
      primaryName: primary.founder_name || 'Founder'
    };
  }

  function buildPayloadFromDraft() {
    if (!window.KaisoIntakeStorage) return null;
    var final = window.KaisoIntakeStorage.loadFinal();
    if (final) return final;
    var draft = window.KaisoIntakeStorage.loadDraft();
    if (draft && draft.state && window.KaisoIntakeSchema) {
      return window.KaisoIntakeSchema.buildPayload(window.KaisoIntakeSchema.mergeState(draft.state));
    }
    return null;
  }

  function loadPayload() {
    return buildPayloadFromDraft();
  }

  function updateInboxPreview(report) {
    var subj = document.getElementById('reportMailSubj');
    var prev = document.getElementById('reportMailPrev');
    if (subj) subj.textContent = report.mailSubj;
    if (prev) prev.textContent = report.mailPreview;
  }

  function renderEmailPage() {
    var payload = buildPayloadFromDraft();
    if (!payload) return;
    var report = build(payload);

    document.title = 'Kaiso — ' + report.mailSubj;

    var pre = document.getElementById('reportPreheader');
    if (pre) pre.textContent = report.preheader;

    var badge = document.getElementById('reportBadge');
    if (badge) badge.textContent = 'Venture Profile';

    var eyebrow = document.getElementById('reportEyebrow');
    if (eyebrow) eyebrow.textContent = 'Your Venture Profile';

    var headline = document.getElementById('reportHeadline');
    if (headline) headline.innerHTML = esc(report.headline);

    var tagline = document.getElementById('reportTagline');
    if (tagline) tagline.textContent = report.tagline;

    var intro = document.getElementById('reportIntro');
    if (intro) intro.textContent = report.intro;

    var mount = document.getElementById('reportSections');
    if (mount) {
      mount.innerHTML = report.sections.map(function (sec) {
        return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid rgba(200,168,78,0.14);border-radius:14px;margin-bottom:12px;">'
          + '<tr><td style="padding:14px 16px;">'
          + '<div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#c8a84e;margin-bottom:6px;">' + esc(sec.label) + '</div>'
          + '<div style="font-size:14px;line-height:1.6;color:rgba(234,227,200,0.7);">' + esc(sec.body) + '</div>'
          + '</td></tr></table>';
      }).join('');
    }

    var footer = document.getElementById('reportFooterNote');
    if (footer) footer.innerHTML = 'You\'re receiving this because you completed the Kaiso Founder Intake for <b style="color:rgba(232,200,112,0.7);">' + esc(report.companyName) + '</b>.';
  }

  return {
    build: build,
    loadPayload: loadPayload,
    updateInboxPreview: updateInboxPreview,
    renderEmailPage: renderEmailPage
  };
})();
