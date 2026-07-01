/** Section metadata + validation helpers for the 33-field founder intake survey */
window.KaisoIntakeSchema = (function () {
  var SECTIONS = [
    { id: 'company', num: 1, title: 'Company', subtitle: 'Tell us about your venture.' },
    { id: 'founders', num: 2, title: 'Founders & Team', subtitle: 'Who is building this, and how big is the team?' },
    { id: 'traction', num: 3, title: 'Traction', subtitle: 'Where you are with customers today.' },
    { id: 'legal', num: 4, title: 'Legal & Corporate', subtitle: 'Entity structure and prior programs.' }
  ];

  function isUrl(v) {
    if (!v || !String(v).trim()) return true;
    try {
      var u = new URL(v.indexOf('://') === -1 ? 'https://' + v : v);
      return !!u.hostname && u.hostname.includes('.');
    } catch (e) {
      return false;
    }
  }

  function isEmail(v) {
    if (!v || !String(v).trim()) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());
  }

  function isTel(v) {
    if (!v || !String(v).trim()) return false;
    return /^[\d\s+\-().]{7,}$/.test(String(v).trim());
  }

  function isNonNegNumber(v) {
    if (v === '' || v === null || v === undefined) return true;
    var n = Number(v);
    return Number.isFinite(n) && n >= 0;
  }

  function emptyFounder() {
    return {
      founder_name: '',
      founder_email: '',
      founder_phone: '',
      founder_education: [],
      founder_employment_history: [],
      linkedin_url: '',
      time_commitment_fulltime: null
    };
  }

  function emptyEducation() {
    return { school: '', degree: '', grad_year: '' };
  }

  function emptyEmployment() {
    return { employer: '', title: '', dates: '' };
  }

  function defaultState() {
    return {
      company_name: '',
      company_url: '',
      company_category: '',
      core_technology: [],
      demo_url: '',
      progress_stage: '',
      founder_location: '',
      hq_location: '',
      founder_count: 1,
      founders: [emptyFounder()],
      time_commitment_duration: '',
      team_fulltime: '',
      team_parttime: '',
      team_technical: '',
      team_directors: '',
      has_users: null,
      customer_size_segments: [],
      users_paying: '',
      top_customer: '',
      top_customer_amount: '',
      engagement_retention: '',
      is_incorporated: null,
      entity_type: '',
      jurisdiction: '',
      noncompete_ip_conflicts: null,
      noncompete_detail: '',
      prior_accelerators_flag: null,
      prior_accelerators_detail: ''
    };
  }

  function mergeState(saved) {
    var base = defaultState();
    if (!saved || typeof saved !== 'object') return base;
    Object.keys(base).forEach(function (k) {
      if (saved[k] === undefined || saved[k] === null) return;
      base[k] = saved[k];
    });
    if (!Array.isArray(base.founders)) base.founders = [emptyFounder()];
    if (!Array.isArray(base.core_technology)) base.core_technology = [];
    if (!Array.isArray(base.customer_size_segments)) base.customer_size_segments = [];
    base.founders = base.founders.map(function (f) {
      if (!f || typeof f !== 'object') return emptyFounder();
      if (!Array.isArray(f.founder_education)) f.founder_education = [];
      if (!Array.isArray(f.founder_employment_history)) f.founder_employment_history = [];
      return f;
    });
    syncFounderCount(base);
    return base;
  }

  function syncFounderCount(state) {
    if (!Array.isArray(state.founders)) state.founders = [emptyFounder()];
    var n = Math.max(1, Math.min(10, Number(state.founder_count) || 1));
    state.founder_count = n;
    while (state.founders.length < n) state.founders.push(emptyFounder());
    while (state.founders.length > n) state.founders.pop();
  }

  function gateOpen(state, gateId) {
    if (gateId === 'has_users') return state.has_users === true;
    if (gateId === 'is_incorporated') return state.is_incorporated === true;
    if (gateId === 'noncompete_ip_conflicts') return state.noncompete_ip_conflicts === true;
    if (gateId === 'prior_accelerators_flag') return state.prior_accelerators_flag === true;
    return true;
  }

  function validateSection(sectionId, state) {
    var errors = {};

    function req(key, msg) {
      errors[key] = msg || 'Required';
    }

    if (sectionId === 'company') {
      if (!String(state.company_name || '').trim()) req('company_name');
      if (state.company_url && !isUrl(state.company_url)) errors.company_url = 'Enter a valid URL';
      if (!state.company_category) req('company_category');
      if (state.demo_url && !isUrl(state.demo_url)) errors.demo_url = 'Enter a valid URL';
      if (!state.progress_stage) req('progress_stage');
      if (!String(state.founder_location || '').trim()) req('founder_location');
      if (!String(state.hq_location || '').trim()) req('hq_location');
    }

    if (sectionId === 'founders') {
      if (!isNonNegNumber(state.founder_count)) errors.founder_count = 'Must be 0 or more';
      syncFounderCount(state);
      state.founders.forEach(function (f, i) {
        var p = 'founders.' + i + '.';
        if (!String(f.founder_name || '').trim()) req(p + 'founder_name', 'Founder name required');
        if (!isEmail(f.founder_email)) req(p + 'founder_email', 'Valid email required');
        if (!isTel(f.founder_phone)) req(p + 'founder_phone', 'Valid phone required');
        if (f.linkedin_url && !isUrl(f.linkedin_url)) errors[p + 'linkedin_url'] = 'Enter a valid URL';
        if (f.time_commitment_fulltime !== true && f.time_commitment_fulltime !== false) {
          req(p + 'time_commitment_fulltime', 'Select Yes or No');
        }
      });
      if (state.time_commitment_duration === '' || !isNonNegNumber(state.time_commitment_duration)) {
        req('time_commitment_duration', 'Enter months (0 or more)');
      }
      ['team_fulltime', 'team_parttime', 'team_technical', 'team_directors'].forEach(function (k) {
        if (state[k] !== '' && !isNonNegNumber(state[k])) errors[k] = 'Must be 0 or more';
      });
    }

    if (sectionId === 'traction') {
      if (state.has_users !== true && state.has_users !== false) req('has_users', 'Select Yes or No');
      if (gateOpen(state, 'has_users')) {
        if (!state.customer_size_segments || !state.customer_size_segments.length) {
          req('customer_size_segments', 'Select at least one segment');
        }
        if (state.users_paying === '' || !isNonNegNumber(state.users_paying)) {
          req('users_paying', 'Enter count (0 or more)');
        }
        if (!String(state.top_customer || '').trim()) req('top_customer');
        if (state.top_customer_amount !== '' && !isNonNegNumber(state.top_customer_amount)) {
          errors.top_customer_amount = 'Must be 0 or more';
        }
      }
    }

    if (sectionId === 'legal') {
      if (state.is_incorporated !== true && state.is_incorporated !== false) req('is_incorporated');
      if (gateOpen(state, 'is_incorporated')) {
        if (!state.entity_type) req('entity_type');
        if (!String(state.jurisdiction || '').trim()) req('jurisdiction');
      }
      if (state.noncompete_ip_conflicts !== true && state.noncompete_ip_conflicts !== false) {
        req('noncompete_ip_conflicts');
      }
      if (gateOpen(state, 'noncompete_ip_conflicts') && !String(state.noncompete_detail || '').trim()) {
        req('noncompete_detail');
      }
      if (gateOpen(state, 'prior_accelerators_flag') && !String(state.prior_accelerators_detail || '').trim()) {
        req('prior_accelerators_detail');
      }
    }

    return errors;
  }

  function buildPayload(state) {
    syncFounderCount(state);
    return {
      version: 1,
      submittedAt: new Date().toISOString(),
      company: {
        company_name: state.company_name,
        company_url: state.company_url,
        company_category: state.company_category,
        core_technology: state.core_technology.slice(),
        demo_url: state.demo_url,
        progress_stage: state.progress_stage,
        founder_location: state.founder_location,
        hq_location: state.hq_location
      },
      founders: state.founders.map(function (f) {
        return {
          founder_name: f.founder_name,
          founder_email: f.founder_email,
          founder_phone: f.founder_phone,
          founder_education: (f.founder_education || []).slice(),
          founder_employment_history: (f.founder_employment_history || []).slice(),
          linkedin_url: f.linkedin_url,
          time_commitment_fulltime: f.time_commitment_fulltime
        };
      }),
      team: {
        founder_count: state.founder_count,
        time_commitment_duration: Number(state.time_commitment_duration) || 0,
        team_fulltime: state.team_fulltime === '' ? null : Number(state.team_fulltime),
        team_parttime: state.team_parttime === '' ? null : Number(state.team_parttime),
        team_technical: state.team_technical === '' ? null : Number(state.team_technical),
        team_directors: state.team_directors === '' ? null : Number(state.team_directors)
      },
      traction: {
        has_users: state.has_users,
        customer_size_segments: state.customer_size_segments.slice(),
        users_paying: state.users_paying === '' ? null : Number(state.users_paying),
        top_customer: state.top_customer,
        top_customer_amount: state.top_customer_amount === '' ? null : Number(state.top_customer_amount),
        engagement_retention: state.engagement_retention
      },
      legal: {
        is_incorporated: state.is_incorporated,
        entity_type: state.entity_type,
        jurisdiction: state.jurisdiction,
        noncompete_ip_conflicts: state.noncompete_ip_conflicts,
        noncompete_detail: state.noncompete_detail,
        prior_accelerators_flag: state.prior_accelerators_flag,
        prior_accelerators_detail: state.prior_accelerators_detail
      }
    };
  }

  return {
    SECTIONS: SECTIONS,
    defaultState: defaultState,
    mergeState: mergeState,
    syncFounderCount: syncFounderCount,
    gateOpen: gateOpen,
    validateSection: validateSection,
    buildPayload: buildPayload,
    emptyFounder: emptyFounder,
    emptyEducation: emptyEducation,
    emptyEmployment: emptyEmployment,
    isUrl: isUrl,
    isEmail: isEmail
  };
})();
