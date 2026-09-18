  // ─── Plan & Tokens — buying session time ──────────────────────
  // choose → checkout → (bank verification) → processing → done, plus
  // the two ways a payment goes wrong: declined, and an outcome we have
  // not heard back about yet. Account → Plan & billing covers what comes
  // after: renewal, cancelling, a failed renewal, receipts.
  //
  // Stripe drops in at one seam only — the payment slot in the checkout
  // view, where Stripe's embedded checkout mounts. The order summary,
  // every state around the payment, and the balance update are ours.
  //
  // Prototype: nothing is charged and nothing reaches Stripe. The slot
  // holds an outcome picker so every branch can be walked. The billing
  // rules below are decided (KAIZ-31); in production the prices are read
  // from Stripe rather than from this file.
  (function billing() {
    const panel = document.getElementById('panelPlan');
    const acct  = document.getElementById('panelAccount');
    const T = window.KaisoTime;
    if (!panel || !T) return;

    // The plan has to win for anyone who talks to Kaiso regularly, so two
    // rules hold: every top-up is smaller than the plan's monthly time, and
    // every top-up costs noticeably more per hour. The largest pack costs
    // more than the plan and gives less — it exists to make that visible.
    // Token counts are chosen so each pack is a round number of hours at
    // the conversion rate. Prices include tax.
    const PLAN = { tokens: 500, price: '$29' };
    const PACKS = { 125: '$12', 250: '$22', 375: '$30' };
    const dollars = (p) => parseFloat(p.replace('$', ''));
    const perHour = (price, tokens) => '$' + (dollars(price) / (T.minutesOf(tokens) / 60)).toFixed(2);
    // Matches Stripe's recommended retry window: 8 tries over 2 weeks.
    const GRACE_DAYS = 14;
    const TOPUP_MONTHS = 12;
    const fmtLong = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    const $  = (sel, root) => (root || panel).querySelector(sel);
    const $$ = (sel, root) => Array.from((root || panel).querySelectorAll(sel));
    const fmtDate   = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const addDays   = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
    const addMonths = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };

    let kind = 'plan';        // 'plan' | 'pack'
    let pack = 250;
    let context = 'menu';     // why the panel opened: menu, paused, low, billing
    let view = 'choose';
    let cardOnFile = false;
    const joined = new Date();
    const history = [];       // newest first; the free grant is always last

    function toast(msg) {
      const el = document.getElementById('ktoast');
      if (!el) return;
      el.textContent = msg;
      el.classList.add('show');
      clearTimeout(toast._t);
      toast._t = setTimeout(() => el.classList.remove('show'), 2600);
    }

    function item() {
      return kind === 'plan'
        ? { kind, tokens: PLAN.tokens, price: PLAN.price, label: 'Monthly plan' }
        : { kind, tokens: pack, price: PACKS[pack], label: 'Top up · ' + T.fmtAllowance(pack) };
    }

    /* ── views ── */
    const TITLES = {
      choose: 'Plan & Tokens', checkout: 'Checkout', verify: 'Verify payment',
      processing: 'Checkout', declined: 'Checkout', pending: 'Checkout', success: 'Done',
    };
    // Back only from checkout. Mid-payment there is nowhere safe to go back to.
    const BACK = { checkout: 'choose' };

    function go(name) {
      view = name;
      $$('.buy-view').forEach((v) => { v.hidden = v.dataset.bview !== name; });
      $('#buyTitle').textContent = TITLES[name];
      $('#buyBack').hidden = !BACK[name];
      panel.scrollTop = 0;
      if (name === 'choose') renderChoose();
      if (name === 'checkout') renderCheckout();
    }

    $('#buyBack').addEventListener('click', () => { if (BACK[view]) go(BACK[view]); });
    $$('[data-buy-go]').forEach((b) => b.addEventListener('click', () => go(b.dataset.buyGo)));

    /* ── choose ── */
    function renderChoose() {
      const { balance, plan } = T.state();
      $('#buyPaused').hidden = !(context === 'paused' && balance === 0);
      $('#buyPlanLine').textContent = !plan ? 'Pay as you go'
        : plan.pastDue ? 'Monthly plan · payment failed'
        : plan.cancelAt ? 'Monthly plan · ends ' + fmtDate(plan.cancelAt)
        : 'Monthly plan · renews ' + fmtDate(plan.renewsAt);

      $$('.plan-card').forEach((c) => {
        const on = c.dataset.kind === kind;
        c.classList.toggle('sel', on);
        c.setAttribute('aria-checked', String(on));
      });
      $$('.buy-detail').forEach((d) => { d.hidden = d.dataset.detail !== kind; });
      $$('.pack').forEach((b) => {
        const on = +b.dataset.pack === pack;
        b.classList.toggle('sel', on);
        b.setAttribute('aria-checked', String(on));
      });
      $('#buyCurrent').hidden = !(plan && !plan.cancelAt && !plan.pastDue);
      // Choosing a top-up without a plan is the moment to show what the
      // plan would give instead.
      $('#buyNudge').hidden = !!plan;

      // The plan card never sells a second subscription to a subscriber.
      const btn = $('#buyContinue');
      btn.disabled = false;
      if (kind === 'plan' && plan && plan.pastDue) btn.textContent = 'Update payment method';
      else if (kind === 'plan' && plan && plan.cancelAt) btn.textContent = 'Keep my plan';
      else if (kind === 'plan' && plan) { btn.textContent = 'You’re on this plan'; btn.disabled = true; }
      else btn.textContent = 'Continue · ' + (kind === 'plan' ? PLAN.price + ' / month' : PACKS[pack]);
    }

    $$('.plan-card').forEach((c) => c.addEventListener('click', () => { kind = c.dataset.kind; renderChoose(); }));
    $$('.pack').forEach((b) => b.addEventListener('click', () => { pack = +b.dataset.pack; renderChoose(); }));
    $('#buyNudgeSwitch').addEventListener('click', () => { kind = 'plan'; renderChoose(); });

    $('#buyContinue').addEventListener('click', () => {
      const { plan } = T.state();
      if (kind === 'plan' && plan && plan.pastDue) return openBilling();
      if (kind === 'plan' && plan && plan.cancelAt) return resumePlan($('#buyContinue'), () => renderChoose());
      go('checkout');
    });

    /* ── checkout ── */
    function renderCheckout() {
      const it = item();
      $('#coItem').textContent = it.label;
      $('#coPrice').textContent = it.kind === 'plan' ? it.price + ' / mo' : it.price;
      $('#coTerms').textContent = it.kind === 'plan'
        ? T.fmtAllowance(it.tokens) + ' each month, starting now. Plan time resets at each renewal and doesn’t roll over. Next renewal ' +
          fmtDate(addMonths(new Date(), 1)) + '. Cancel any time.'
        : 'One-off payment. Adds ' + T.fmtAllowance(it.tokens) + ', usable for 12 months, after any plan time.';
    }

    const OUTCOMES = {
      success: () => process(),
      verify: () => go('verify'),
      // a card is tried before it is refused, so the spinner shows first
      declined: () => attempt(() => go('declined')),
      pending: () => startPending(),
    };
    $$('[data-outcome]').forEach((b) => b.addEventListener('click', () => OUTCOMES[b.dataset.outcome]()));

    /* ── verify (3D Secure) ── */
    $('[data-verify="approve"]').addEventListener('click', () => process());
    $('[data-verify="cancel"]').addEventListener('click', () => {
      go('checkout');
      toast('Payment cancelled — you weren’t charged');
    });

    /* ── processing ── */
    let procLoad = null;
    function spinner(host, handle) {
      if (handle) handle.close();
      host.innerHTML = '';
      return window.KaisoLoader ? window.KaisoLoader.into(host) : null;
    }
    function setProc(title, sub) {
      $('#procTitle').textContent = title;
      $('#procSub').textContent = sub;
    }

    function attempt(then) {
      go('processing');
      setProc('Confirming payment', 'Keep this window open — it only takes a moment.');
      procLoad = spinner($('#procLoader'), procLoad);
      setTimeout(then, 1100);
    }

    function process() {
      attempt(() => {
        // Two steps on purpose. Stripe confirms the payment; the time only
        // lands once our webhook has credited the ledger. Crediting on the
        // redirect instead would show time a failed payment never paid for.
        setProc('Adding time to your balance', 'Payment confirmed.');
        setTimeout(fulfil, 900);
      });
    }

    /* ── outcome unknown ── */
    let pendLoad = null, pendTimer = null;
    function startPending() {
      go('pending');
      pendLoad = spinner($('#pendLoader'), pendLoad);
      clearTimeout(pendTimer);
      pendTimer = setTimeout(fulfil, 4200);
    }
    $('#pendCheck').addEventListener('click', () => {
      clearTimeout(pendTimer);
      const l = window.KaisoLoader ? window.KaisoLoader.button($('#pendCheck'), 'Checking') : null;
      setTimeout(() => { if (l) l.close(); fulfil(); }, 900);
    });

    /* ── done ── */
    function fulfil() {
      clearTimeout(pendTimer);
      const it = item();
      const now = new Date();
      if (it.kind === 'plan') {
        T.setPlanTime(it.tokens);
        T.setPlan({ renewsAt: addMonths(now, 1), cancelAt: null, pastDue: false });
      } else {
        T.addTopUp(it.tokens, addMonths(now, TOPUP_MONTHS));
      }
      cardOnFile = true;
      history.unshift({
        date: now, label: it.kind === 'plan' ? 'Monthly plan' : 'Top up',
        detail: T.fmtAllowance(it.tokens), amount: it.price, receipt: true,
      });

      $('#okTitle').textContent = it.kind === 'plan' ? 'Your plan is active' : T.fmtAllowance(it.tokens) + ' added';
      $('#okPrimary').textContent = context === 'paused' ? 'Resume session' : 'Back to Kaiso';
      go('success');
      renderBilling();
      hideBanner();
    }

    $('#okPrimary').addEventListener('click', () => {
      const resuming = context === 'paused';
      window.KaisoPanels.close();
      if (resuming) toast('Kaiso picks up where you left off');
    });
    $('#okBilling').addEventListener('click', () => openBilling());

    /* ── opening the panel ── */
    window.addEventListener('kaiso:open-plan', (e) => {
      context = (e.detail && e.detail.context) || 'menu';
      const { plan } = T.state();
      // Out of time, or already subscribed: the answer is a top-up.
      if (context === 'paused' || context === 'low' || (plan && !plan.cancelAt && !plan.pastDue)) kind = 'pack';
      go('choose');
    });

    /* ── low-time banner ── */
    const banner = document.getElementById('timeBanner');
    function hideBanner() { if (banner) banner.hidden = true; }
    if (banner) {
      window.addEventListener('kaiso:time-low', (e) => {
        document.getElementById('tbLeft').textContent = T.fmtLeft(e.detail.balance) + ' left';
        banner.hidden = false;
      });
      document.getElementById('tbAdd').addEventListener('click', () => { hideBanner(); window.KaisoPanels.open('plan', 'low'); });
      document.getElementById('tbClose').addEventListener('click', hideBanner);
    }

    /* ── Account → Plan & billing ── */
    function openBilling() {
      window.KaisoPanels.open('account');
      if (window.KaisoAccount) window.KaisoAccount.show('billing');
    }

    const q = (sel) => acct && acct.querySelector(sel);

    function renderBilling() {
      if (!acct) return;
      const { balance, plan } = T.state();

      q('#billPlanName').textContent = plan ? 'Monthly plan' : 'Pay as you go';

      // Which time resets and which carries over is the question founders
      // ask, so the two are shown apart.
      const st = T.state();
      q('#billPlanTimeRow').hidden = !plan;
      q('#billPlanTime').textContent = T.fmtLeft(st.planTokens);
      q('#billPlanTimeSub').textContent = !plan ? ''
        : plan.pastDue ? 'Still usable during the grace period'
        : plan.cancelAt ? 'Ends ' + fmtDate(plan.cancelAt)
        : 'Resets to ' + T.fmtAllowance(PLAN.tokens) + ' on ' + fmtDate(plan.renewsAt);
      q('#billExtraTime').textContent = T.fmtLeft(st.extraTokens);
      q('#billExtraTimeSub').textContent = st.extraExpiresAt
        ? 'Top-ups and free time · oldest expires ' + fmtLong(st.extraExpiresAt)
        : 'Free time · used after plan time';
      q('#billPlanSub').textContent = !plan ? 'No subscription'
        : plan.pastDue ? PLAN.price + ' / month · payment failed'
        : plan.cancelAt ? 'Cancelled · active until ' + fmtDate(plan.cancelAt)
        : PLAN.price + ' / month · renews ' + fmtDate(plan.renewsAt);
      q('#billCancel').hidden = !plan || !!plan.cancelAt;
      q('#billResume').hidden = !plan || !plan.cancelAt;
      q('#billPastDue').hidden = !(plan && plan.pastDue);
      q('#billMethod').hidden = !cardOnFile;
      q('#billSimFail').hidden = !plan || !!plan.pastDue || !!plan.cancelAt;
      if (plan && plan.pastDue) q('[data-grace]').textContent = fmtDate(plan.graceEndsAt);

      document.querySelectorAll('[data-renews]').forEach((el) => {
        el.textContent = plan ? fmtDate(plan.cancelAt || plan.renewsAt) : '';
      });

      const rows = history.concat([{ date: joined, label: 'Free time', detail: T.fmtAllowance(60), amount: 'Free' }]);
      q('#billHistory').innerHTML = rows.map((h) =>
        '<div class="acct-row acct-row--static bill-row' + (h.failed ? ' failed' : '') + '">' +
          '<span class="tx"><b>' + h.label + '</b><i>' + fmtDate(h.date) + ' · ' + h.detail + '</i></span>' +
          '<span class="bill-amt">' + h.amount + '</span>' +
          (h.receipt ? '<button class="bill-link" type="button" data-receipt>Receipt</button>' : '') +
        '</div>').join('');

      const line = !plan ? (history.length ? 'Pay as you go' : 'Free time · no plan yet')
        : plan.pastDue ? 'Monthly plan · payment failed'
        : plan.cancelAt ? 'Monthly plan · ends ' + fmtDate(plan.cancelAt)
        : 'Monthly plan · renews ' + fmtDate(plan.renewsAt);
      const acctPlan = document.getElementById('acctPlan');
      if (acctPlan) acctPlan.textContent = line;
      const billLine = document.getElementById('acctBillLine');
      if (billLine) billLine.textContent = line + ' · ' + T.fmtLeft(balance) + ' left';
    }

    function busy(btn, ms, done) {
      const l = window.KaisoLoader ? window.KaisoLoader.button(btn) : null;
      setTimeout(() => { if (l) l.close(); done(); }, ms);
    }

    function resumePlan(btn, after) {
      busy(btn, 700, () => {
        const { plan } = T.state();
        T.setPlan(Object.assign({}, plan, { cancelAt: null }));
        renderBilling();
        toast('Your plan continues · renews ' + fmtDate(plan.renewsAt));
        if (after) after();
      });
    }

    if (acct) {
      q('#billAddTime').addEventListener('click', () => window.KaisoPanels.open('plan', 'billing'));

      q('#billConfirmCancel').addEventListener('click', (e) => {
        busy(e.currentTarget, 800, () => {
          const { plan } = T.state();
          // Cancels at the end of the paid period, never immediately.
          T.setPlan(Object.assign({}, plan, { cancelAt: plan.renewsAt }));
          renderBilling();
          window.KaisoAccount.show('billing');
          toast('Plan cancelled · active until ' + fmtDate(plan.renewsAt));
        });
      });

      q('#billResume').addEventListener('click', (e) => resumePlan(e.currentTarget));

      // Card details and invoices live in Stripe's billing portal. The
      // prototype does not imitate it; it says where the link goes.
      q('#billUpdateCard').addEventListener('click', () => toast('Opens Stripe’s billing portal to update the card'));
      q('#billPortal').addEventListener('click', () => toast('Opens Stripe’s billing portal'));
      q('#billHistory').addEventListener('click', (e) => {
        if (e.target.closest('[data-receipt]')) toast('Opens the receipt from Stripe');
      });

      q('#billSimFail').addEventListener('click', () => {
        const { plan } = T.state();
        const failedOn = plan.renewsAt;
        T.setPlan(Object.assign({}, plan, { pastDue: true, graceEndsAt: addDays(failedOn, GRACE_DAYS) }));
        history.unshift({ date: failedOn, label: 'Monthly plan · renewal', detail: 'Payment failed', amount: PLAN.price, failed: true });
        renderBilling();
        acct.scrollTop = 0;
        toast('Renewal failed — the plan stays active during the grace period');
      });

      q('#billFixCard').addEventListener('click', (e) => {
        busy(e.currentTarget, 1300, () => {
          const { plan } = T.state();
          // The retried payment settles the renewal that failed, so it can
          // never be dated before that renewal was due.
          const paidOn = new Date(Math.max(Date.now(), plan.renewsAt.getTime()));
          // The new month's allowance replaces the old one. Top-ups are
          // separate and untouched.
          T.setPlanTime(PLAN.tokens);
          T.setPlan({ renewsAt: addMonths(plan.renewsAt, 1), cancelAt: null, pastDue: false });
          history.unshift({ date: paidOn, label: 'Monthly plan · renewal', detail: T.fmtAllowance(PLAN.tokens), amount: PLAN.price, receipt: true });
          renderBilling();
          toast('Payment went through — your plan continues');
        });
      });
    }

    /* ── keep every balance on screen honest ── */
    window.addEventListener('kaiso:time', (e) => {
      document.querySelectorAll('[data-left]').forEach((el) => { el.textContent = T.fmtLeft(e.detail.balance); });
      if (banner && !banner.hidden) {
        if (!e.detail.low) hideBanner();
        else document.getElementById('tbLeft').textContent = T.fmtLeft(e.detail.balance) + ' left';
      }
      if (view === 'choose') renderChoose();
      renderBilling();
    });

    // Every price-per-hour and comparison is computed from the catalogue,
    // so changing a price cannot leave a stale claim behind.
    $$('[data-per-hour]').forEach((el) => {
      const t = +el.dataset.perHour;
      el.textContent = perHour(t === PLAN.tokens ? PLAN.price : PACKS[t], t) + ' / h';
    });
    const biggest = Math.max(...Object.keys(PACKS).map(Number));
    $('#buyNudgeText').textContent = 'The monthly plan gives ' + T.fmtAllowance(PLAN.tokens).replace('≈ ', '') +
      ' for ' + PLAN.price + ' — more time than the ' + T.fmtAllowance(biggest).replace('≈ ', '') +
      ' top-up, for less.';

    // Allowances come from the one conversion, so copy cannot drift from it.
    $$('[data-allow]').forEach((el) => {
      const a = T.fmtAllowance(+el.dataset.allow);
      el.textContent = el.classList.contains('pc-sub') ? a + ' every month' : a;
    });
    const email = document.querySelector('#acctEmails .acct-mail');
    if (email) document.querySelectorAll('[data-email]').forEach((el) => { el.textContent = email.textContent.trim(); });

    renderBilling();
    go('choose');
  })();
