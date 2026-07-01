/** Renders the 4-section founder intake wizard inside #intakeRoot */
window.KaisoIntakeForm = (function () {
  var Schema = window.KaisoIntakeSchema;
  var Options = window.KaisoIntakeOptions;
  var Storage = window.KaisoIntakeStorage;

  var root, state, sectionIdx = 0, errors = {}, onSubmit;

  function el(tag, cls, html) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html != null) node.innerHTML = html;
    return node;
  }

  function saveDraft() {
    Storage.saveDraft({ sectionIdx: sectionIdx, state: state });
  }

  function setProgress() {
    var sec = Schema.SECTIONS[sectionIdx];
    var pct = Math.round(((sectionIdx + 1) / Schema.SECTIONS.length) * 100);
    var numEl = document.getElementById('intakeSecNum');
    var pctEl = document.getElementById('intakePct');
    var barEl = document.getElementById('intakeBar');
    var titleEl = document.getElementById('intakeSecTitle');
    var subEl = document.getElementById('intakeSecSub');
    if (numEl) numEl.textContent = sec.num;
    if (pctEl) pctEl.textContent = pct + '%';
    if (barEl) barEl.style.width = pct + '%';
    if (titleEl) titleEl.innerHTML = sec.title + ' <span class="accent">·</span> ' + sec.num + ' of 4';
    if (subEl) subEl.textContent = sec.subtitle;
  }

  function fieldWrap(label, required, optional, gate, conditional, inner) {
    var wrap = el('div', 'intake-field');
    if (gate) wrap.classList.add('is-gate');
    if (conditional) wrap.classList.add('is-conditional');
    var lbl = el('span', 'lbl intake-lbl');
    lbl.textContent = label + (required ? ' *' : optional ? ' (optional)' : '');
    wrap.appendChild(lbl);
    wrap.appendChild(inner);
    return wrap;
  }

  function errMsg(key) {
    if (!errors[key]) return null;
    var e = el('div', 'intake-err');
    e.textContent = errors[key];
    return e;
  }

  function attachErr(wrap, key) {
    var e = errMsg(key);
    if (e) wrap.appendChild(e);
    if (errors[key]) wrap.classList.add('has-error');
  }

  function textInput(key, opts) {
    opts = opts || {};
    var wrap = el('div', 'field');
    var inp = document.createElement('input');
    inp.type = opts.type || 'text';
    inp.placeholder = opts.placeholder || '';
    inp.value = opts.value != null ? opts.value : (state[key] || '');
    inp.dataset.key = key;
    inp.addEventListener('input', function () {
      state[key] = inp.value;
      delete errors[key];
      saveDraft();
    });
    wrap.appendChild(inp);
    return wrap;
  }

  function founderInput(fi, key, opts) {
    opts = opts || {};
    var errKey = 'founders.' + fi + '.' + key;
    var wrap = el('div', 'field');
    var inp = document.createElement('input');
    inp.type = opts.type || 'text';
    inp.placeholder = opts.placeholder || '';
    inp.value = state.founders[fi][key] || '';
    inp.addEventListener('input', function () {
      state.founders[fi][key] = inp.value;
      delete errors[errKey];
      saveDraft();
    });
    wrap.appendChild(inp);
    return wrap;
  }

  function selectInput(key, options) {
    var wrap = el('div', 'field');
    var sel = document.createElement('select');
    sel.dataset.key = key;
    var blank = document.createElement('option');
    blank.value = '';
    blank.textContent = 'Select…';
    sel.appendChild(blank);
    options.forEach(function (o) {
      var opt = document.createElement('option');
      opt.value = o;
      opt.textContent = o;
      if (state[key] === o) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', function () {
      state[key] = sel.value;
      delete errors[key];
      saveDraft();
      render();
    });
    wrap.appendChild(sel);
    return wrap;
  }

  function textareaInput(key, placeholder) {
    var wrap = el('div', 'field');
    var ta = document.createElement('textarea');
    ta.placeholder = placeholder || '';
    ta.value = state[key] || '';
    ta.rows = 3;
    ta.addEventListener('input', function () {
      state[key] = ta.value;
      delete errors[key];
      saveDraft();
    });
    wrap.appendChild(ta);
    return wrap;
  }

  function toggleInput(key, gate) {
    var wrap = el('div', 'intake-toggle-row');
    [['Yes', true], ['No', false]].forEach(function (pair) {
      var btn = el('button', 'intake-toggle' + (state[key] === pair[1] ? ' sel' : ''), pair[0]);
      btn.type = 'button';
      btn.addEventListener('click', function () {
        state[key] = pair[1];
        delete errors[key];
        if (gate && pair[1] === false) clearGateFields(key);
        saveDraft();
        render();
      });
      wrap.appendChild(btn);
    });
    return wrap;
  }

  function clearGateFields(gateKey) {
    if (gateKey === 'has_users') {
      state.customer_size_segments = [];
      state.users_paying = '';
      state.top_customer = '';
      state.top_customer_amount = '';
    }
    if (gateKey === 'is_incorporated') {
      state.entity_type = '';
      state.jurisdiction = '';
    }
    if (gateKey === 'noncompete_ip_conflicts') state.noncompete_detail = '';
    if (gateKey === 'prior_accelerators_flag') state.prior_accelerators_detail = '';
  }

  function multiselectChips(key, options) {
    var wrap = el('div', 'intake-chips');
    var selected = state[key] || [];
    options.forEach(function (o) {
      var chip = el('button', 'intake-chip' + (selected.indexOf(o) >= 0 ? ' sel' : ''), o);
      chip.type = 'button';
      chip.addEventListener('click', function () {
        var idx = selected.indexOf(o);
        if (idx >= 0) selected.splice(idx, 1);
        else selected.push(o);
        state[key] = selected.slice();
        delete errors[key];
        saveDraft();
        render();
      });
      wrap.appendChild(chip);
    });
    return wrap;
  }

  function tagInput(key) {
    var wrap = el('div', 'intake-tags');
    var list = el('div', 'intake-tag-list');
    (state[key] || []).forEach(function (tag, i) {
      var pill = el('span', 'intake-tag', tag + ' <button type="button" aria-label="Remove">&times;</button>');
      pill.querySelector('button').addEventListener('click', function () {
        state[key].splice(i, 1);
        saveDraft();
        render();
      });
      list.appendChild(pill);
    });
    wrap.appendChild(list);
    var row = el('div', 'intake-tag-add field');
    var inp = document.createElement('input');
    inp.placeholder = 'Type a technology and press Enter';
    inp.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      var v = inp.value.trim();
      if (!v) return;
      if (!state[key]) state[key] = [];
      if (state[key].indexOf(v) < 0) state[key].push(v);
      inp.value = '';
      saveDraft();
      render();
    });
    row.appendChild(inp);
    wrap.appendChild(row);
    var sug = el('div', 'intake-suggestions');
    Options.tech_suggestions.slice(0, 8).forEach(function (t) {
      if ((state[key] || []).indexOf(t) >= 0) return;
      var b = el('button', 'intake-sug', t);
      b.type = 'button';
      b.addEventListener('click', function () {
        if (!state[key]) state[key] = [];
        state[key].push(t);
        saveDraft();
        render();
      });
      sug.appendChild(b);
    });
    if (sug.childNodes.length) wrap.appendChild(sug);
    return wrap;
  }

  function stepper(key, min, max) {
    var wrap = el('div', 'intake-stepper');
    var minus = el('button', 'intake-step', '−');
    var val = el('span', 'intake-step-val', String(state[key]));
    var plus = el('button', 'intake-step', '+');
    minus.type = plus.type = 'button';
    minus.addEventListener('click', function () {
      var n = Math.max(min, (Number(state[key]) || min) - 1);
      state[key] = n;
      Schema.syncFounderCount(state);
      saveDraft();
      render();
    });
    plus.addEventListener('click', function () {
      var n = Math.min(max, (Number(state[key]) || min) + 1);
      state[key] = n;
      Schema.syncFounderCount(state);
      saveDraft();
      render();
    });
    wrap.appendChild(minus);
    wrap.appendChild(val);
    wrap.appendChild(plus);
    return wrap;
  }

  function renderEducation(fi) {
    var block = el('div', 'intake-nested');
    var items = state.founders[fi].founder_education || [];
    if (!items.length) items = [Schema.emptyEducation()];
    state.founders[fi].founder_education = items;

    items.forEach(function (row, ri) {
      var card = el('div', 'intake-nested-card');
      card.appendChild(el('span', 'intake-nested-title', 'Education ' + (ri + 1)));
      ['school', 'degree', 'grad_year'].forEach(function (k) {
        var f = el('div', 'field');
        var inp = document.createElement('input');
        inp.placeholder = k === 'school' ? 'School' : k === 'degree' ? 'Degree' : 'Grad year';
        inp.value = row[k] || '';
        inp.addEventListener('input', function () {
          row[k] = inp.value;
          saveDraft();
        });
        f.appendChild(inp);
        card.appendChild(f);
      });
      if (items.length > 1) {
        var rm = el('button', 'intake-link-btn', 'Remove');
        rm.type = 'button';
        rm.addEventListener('click', function () {
          items.splice(ri, 1);
          saveDraft();
          render();
        });
        card.appendChild(rm);
      }
      block.appendChild(card);
    });
    var add = el('button', 'intake-link-btn', '+ Add education');
    add.type = 'button';
    add.addEventListener('click', function () {
      items.push(Schema.emptyEducation());
      saveDraft();
      render();
    });
    block.appendChild(add);
    return block;
  }

  function renderEmployment(fi) {
    var block = el('div', 'intake-nested');
    var items = state.founders[fi].founder_employment_history || [];
    if (!items.length) items = [Schema.emptyEmployment()];
    state.founders[fi].founder_employment_history = items;

    items.forEach(function (row, ri) {
      var card = el('div', 'intake-nested-card');
      card.appendChild(el('span', 'intake-nested-title', 'Role ' + (ri + 1)));
      [['employer', 'Employer'], ['title', 'Title'], ['dates', 'Dates (e.g. 2020–2023)']].forEach(function (pair) {
        var f = el('div', 'field');
        var inp = document.createElement('input');
        inp.placeholder = pair[1];
        inp.value = row[pair[0]] || '';
        inp.addEventListener('input', function () {
          row[pair[0]] = inp.value;
          saveDraft();
        });
        f.appendChild(inp);
        card.appendChild(f);
      });
      if (items.length > 1) {
        var rm = el('button', 'intake-link-btn', 'Remove');
        rm.type = 'button';
        rm.addEventListener('click', function () {
          items.splice(ri, 1);
          saveDraft();
          render();
        });
        card.appendChild(rm);
      }
      block.appendChild(card);
    });
    var add = el('button', 'intake-link-btn', '+ Add role');
    add.type = 'button';
    add.addEventListener('click', function () {
      items.push(Schema.emptyEmployment());
      saveDraft();
      render();
    });
    block.appendChild(add);
    return block;
  }

  function renderFounderCard(fi) {
    var card = el('div', 'intake-founder-card');
    card.appendChild(el('div', 'intake-founder-head', 'Founder ' + (fi + 1)));

    var f;
    f = fieldWrap('Full name', true, false, false, false, founderInput(fi, 'founder_name', { placeholder: 'Jane Doe' }));
    attachErr(f, 'founders.' + fi + '.founder_name');
    card.appendChild(f);

    f = fieldWrap('Email', true, false, false, false, founderInput(fi, 'founder_email', { type: 'email', placeholder: 'jane@company.com' }));
    attachErr(f, 'founders.' + fi + '.founder_email');
    card.appendChild(f);

    f = fieldWrap('Phone', true, false, false, false, founderInput(fi, 'founder_phone', { type: 'tel', placeholder: '+1 555 0100' }));
    attachErr(f, 'founders.' + fi + '.founder_phone');
    card.appendChild(f);

    f = fieldWrap('LinkedIn profile', false, true, false, false, founderInput(fi, 'linkedin_url', { placeholder: 'linkedin.com/in/…' }));
    attachErr(f, 'founders.' + fi + '.linkedin_url');
    card.appendChild(f);

    f = fieldWrap('Full-time on this venture?', true, false, false, false, el('div'));
    var trow = el('div', 'intake-toggle-row');
    [['Yes', true], ['No', false]].forEach(function (pair) {
      var btn = el('button', 'intake-toggle' + (state.founders[fi].time_commitment_fulltime === pair[1] ? ' sel' : ''), pair[0]);
      btn.type = 'button';
      btn.addEventListener('click', function () {
        state.founders[fi].time_commitment_fulltime = pair[1];
        delete errors['founders.' + fi + '.time_commitment_fulltime'];
        saveDraft();
        render();
      });
      trow.appendChild(btn);
    });
    f.appendChild(trow);
    attachErr(f, 'founders.' + fi + '.time_commitment_fulltime');
    card.appendChild(f);

    card.appendChild(fieldWrap('Education', false, true, false, false, renderEducation(fi)));
    card.appendChild(fieldWrap('Work history', false, true, false, false, renderEmployment(fi)));

    return card;
  }

  function renderCompany(mount) {
    var fields = [
      ['company_name', 'Company / startup name', true, textInput('company_name', { placeholder: 'Acme Inc.' })],
      ['company_url', 'Website / product URL', false, textInput('company_url', { type: 'url', placeholder: 'https://…' })],
      ['company_category', 'Category / industry', true, selectInput('company_category', Options.company_category)],
      ['core_technology', 'Core technology / tech stack', false, tagInput('core_technology')],
      ['demo_url', 'Demo / product link', false, textInput('demo_url', { type: 'url', placeholder: 'Video, recording, or live URL' })],
      ['progress_stage', 'Stage of development', true, selectInput('progress_stage', Options.progress_stage)],
      ['founder_location', 'Current location', true, textInput('founder_location', { placeholder: 'City, country' })],
      ['hq_location', 'Planned HQ (after program)', true, textInput('hq_location', { placeholder: 'City, country' })]
    ];
    fields.forEach(function (row) {
      var w = fieldWrap(row[1], row[2], !row[2], false, false, row[3]);
      attachErr(w, row[0]);
      mount.appendChild(w);
    });
  }

  function renderFounders(mount) {
    var w = fieldWrap('Number of founders', true, false, false, false, stepper('founder_count', 1, 10));
    attachErr(w, 'founder_count');
    mount.appendChild(w);

    Schema.syncFounderCount(state);
    for (var i = 0; i < state.founder_count; i++) mount.appendChild(renderFounderCard(i));

    w = fieldWrap('Time on project (months)', true, false, false, false, textInput('time_commitment_duration', { type: 'number', placeholder: '12' }));
    attachErr(w, 'time_commitment_duration');
    mount.appendChild(w);

    mount.appendChild(el('span', 'lbl intake-team-lbl', 'Team size (excl. founders)'));
    [
      ['team_fulltime', 'Full-time employees'],
      ['team_parttime', 'Part-time employees'],
      ['team_technical', 'Technical staff'],
      ['team_directors', 'Directors']
    ].forEach(function (row) {
      w = fieldWrap(row[1], false, true, false, false, textInput(row[0], { type: 'number', placeholder: '0' }));
      attachErr(w, row[0]);
      mount.appendChild(w);
    });
  }

  function renderTraction(mount) {
    var w = fieldWrap('Do you have customers?', true, false, true, false, toggleInput('has_users', true));
    attachErr(w, 'has_users');
    mount.appendChild(w);

    if (Schema.gateOpen(state, 'has_users')) {
      w = fieldWrap('Customer size(s)', true, false, false, true, multiselectChips('customer_size_segments', Options.customer_size_segments));
      attachErr(w, 'customer_size_segments');
      mount.appendChild(w);

      w = fieldWrap('Paying customers', true, false, false, true, textInput('users_paying', { type: 'number', placeholder: '0' }));
      attachErr(w, 'users_paying');
      mount.appendChild(w);

      var topWrap = el('div', 'intake-split');
      topWrap.appendChild(textInput('top_customer', { placeholder: 'Top customer name' }));
      topWrap.appendChild(textInput('top_customer_amount', { type: 'number', placeholder: 'Amount ($)' }));
      w = fieldWrap('Top customer + amount', true, false, false, true, topWrap);
      attachErr(w, 'top_customer');
      attachErr(w, 'top_customer_amount');
      mount.appendChild(w);
    }

    w = fieldWrap('Engagement & retention', false, true, false, false, textareaInput('engagement_retention', 'Retention %, DAU/MAU, cohort notes…'));
    mount.appendChild(w);
  }

  function renderLegal(mount) {
    var w = fieldWrap('Incorporated?', true, false, true, false, toggleInput('is_incorporated', true));
    attachErr(w, 'is_incorporated');
    mount.appendChild(w);

    if (Schema.gateOpen(state, 'is_incorporated')) {
      w = fieldWrap('Entity type', true, false, false, true, selectInput('entity_type', Options.entity_type));
      attachErr(w, 'entity_type');
      mount.appendChild(w);

      w = fieldWrap('Jurisdiction', true, false, false, true, textInput('jurisdiction', { placeholder: 'Delaware, USA' }));
      attachErr(w, 'jurisdiction');
      mount.appendChild(w);
    }

    w = fieldWrap('Noncompete / IP conflict?', true, false, true, false, toggleInput('noncompete_ip_conflicts', true));
    attachErr(w, 'noncompete_ip_conflicts');
    mount.appendChild(w);

    if (Schema.gateOpen(state, 'noncompete_ip_conflicts')) {
      w = fieldWrap('Noncompete / IP detail', true, false, false, true, textareaInput('noncompete_detail', 'Explain the conflict…'));
      attachErr(w, 'noncompete_detail');
      mount.appendChild(w);
    }

    w = fieldWrap('Prior accelerators / incubators?', false, true, true, false, toggleInput('prior_accelerators_flag', true));
    mount.appendChild(w);

    if (Schema.gateOpen(state, 'prior_accelerators_flag')) {
      w = fieldWrap('Prior accelerators detail', true, false, false, true, textareaInput('prior_accelerators_detail', 'Which programs…'));
      attachErr(w, 'prior_accelerators_detail');
      mount.appendChild(w);
    }
  }

  function renderNav(mount) {
    var row = el('div', 'btn-row intake-nav');
    if (sectionIdx > 0) {
      var back = el('button', 'btn', 'Back');
      back.type = 'button';
      back.addEventListener('click', function () {
        sectionIdx--;
        errors = {};
        setProgress();
        render();
      });
      row.appendChild(back);
    }
    var next = el('button', 'btn primary', sectionIdx >= Schema.SECTIONS.length - 1 ? 'Submit intake →' : 'Continue');
    next.type = 'button';
    next.style.flex = sectionIdx > 0 ? '1' : '';
    next.addEventListener('click', function () {
      var sec = Schema.SECTIONS[sectionIdx];
      errors = Schema.validateSection(sec.id, state);
      if (Object.keys(errors).length) {
        render();
        var first = root.querySelector('.has-error');
        if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (sectionIdx >= Schema.SECTIONS.length - 1) {
        var payload = Schema.buildPayload(state);
        Storage.saveFinal(payload);
        if (typeof onSubmit === 'function') onSubmit(payload);
        return;
      }
      sectionIdx++;
      errors = {};
      setProgress();
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    row.appendChild(next);
    mount.appendChild(row);
  }

  function render() {
    if (!root) return;
    root.innerHTML = '';
    var body = el('div', 'intake-body');
    var sec = Schema.SECTIONS[sectionIdx];
    if (sec.id === 'company') renderCompany(body);
    else if (sec.id === 'founders') renderFounders(body);
    else if (sec.id === 'traction') renderTraction(body);
    else if (sec.id === 'legal') renderLegal(body);
    root.appendChild(body);
    renderNav(root);
    setProgress();
  }

  function init(opts) {
    opts = opts || {};
    root = document.getElementById('intakeRoot');
    if (!root) return;
    onSubmit = opts.onSubmit;

    try {
      var draft = Storage.loadDraft();
      if (draft && draft.state) {
        state = Schema.mergeState(draft.state);
        sectionIdx = Math.max(0, Math.min(Schema.SECTIONS.length - 1, draft.sectionIdx || 0));
      } else {
        state = Schema.defaultState();
        sectionIdx = 0;
      }
    } catch (err) {
      console.error('Invalid intake draft; starting fresh.', err);
      Storage.clearDraft();
      state = Schema.defaultState();
      sectionIdx = 0;
    }
    errors = {};
    render();
  }

  function getPrimaryEmail() {
    if (!state || !state.founders || !state.founders.length) return '';
    return state.founders[0].founder_email || '';
  }

  return { init: init, getPrimaryEmail: function () { return getPrimaryEmail(); } };
})();
