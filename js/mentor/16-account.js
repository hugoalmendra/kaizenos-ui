  // ─── Manage Account — view stack and interactions ─────────────
  // Prototype behaviour: nothing reaches a server. Every action runs
  // the real UI path — validation, a pause on the button, a toast,
  // then the state the founder would actually land on.
  (function account() {
    const panel = document.getElementById('panelAccount');
    if (!panel) return;

    const titleEl = document.getElementById('acctTitle');
    const backBtn = document.getElementById('acctBack');
    const views   = panel.querySelectorAll('.acct-view');

    const TITLES = {
      'root': 'Manage Account',
      'edit': 'Profile',
      'add-email': 'Add Email',
      'verify': 'Verify Email',
      'password': 'Password',
      'devices': 'Active Devices',
      'delete': 'Delete Account',
      'billing': 'Plan & Billing',
      'cancel-plan': 'Cancel Plan',
    };
    // Where Back goes from a view that is not one level below the root.
    const PARENT = { 'verify': 'add-email', 'cancel-plan': 'billing' };

    let current = 'root';

    function show(name) {
      current = name;
      views.forEach((v) => { v.hidden = v.dataset.view !== name; });
      titleEl.textContent = TITLES[name] || TITLES.root;
      backBtn.hidden = name === 'root';
      closePops();
      panel.scrollTop = 0;
    }

    function toast(msg) {
      const el = document.getElementById('ktoast');
      if (!el) return;
      el.textContent = msg;
      el.classList.add('show');
      clearTimeout(toast._t);
      toast._t = setTimeout(() => el.classList.remove('show'), 2600);
    }

    // Stand-in for the round-trip, so the button state and the toast
    // land in the order they really would.
    function pretendSave(btn, ms, done) {
      const loading = window.KaisoLoader ? window.KaisoLoader.button(btn) : null;
      setTimeout(() => { if (loading) loading.close(); done(); }, ms || 650);
    }

    function markInvalid(input, msg) {
      input.classList.add('invalid');
      input.focus();
      toast(msg);
      setTimeout(() => input.classList.remove('invalid'), 1600);
    }

    /* ── navigation ── */
    backBtn.addEventListener('click', () => show(PARENT[current] || 'root'));
    panel.querySelectorAll('[data-go]').forEach((b) =>
      b.addEventListener('click', () => show(b.dataset.go)));
    panel.querySelectorAll('[data-toast]').forEach((b) =>
      b.addEventListener('click', () => toast(b.dataset.toast)));

    // Opening the panel from the menu always starts at the top.
    window.addEventListener('kaiso:open-account', () => show('root'));
    window.KaisoAccount = { show };

    /* ── the ⋯ menu on an email row ── */
    // The list clips its rows to keep the rounded corners, which would
    // also clip a menu hanging past the row. Both the list and the row
    // are opened up only while a menu is showing.
    function closePops() {
      panel.querySelectorAll('.acct-pop').forEach((p) => { p.hidden = true; });
      panel.querySelectorAll('.acct-dots').forEach((d) => d.setAttribute('aria-expanded', 'false'));
      panel.querySelectorAll('.pop-open').forEach((el) => el.classList.remove('pop-open'));
    }

    function wireDots(dots, pop) {
      dots.addEventListener('click', (e) => {
        e.stopPropagation();
        const opening = pop.hidden;
        closePops();
        if (!opening) return;
        pop.hidden = false;
        dots.setAttribute('aria-expanded', 'true');
        dots.closest('.acct-row')?.classList.add('pop-open');
        dots.closest('.acct-list')?.classList.add('pop-open');
      });
    }

    panel.querySelectorAll('.acct-dots').forEach((dots) =>
      wireDots(dots, dots.parentElement.querySelector('.acct-pop')));
    panel.querySelectorAll('.acct-pop [data-act]').forEach((b) => {
      b.addEventListener('click', () => {
        closePops();
        if (b.dataset.act === 'remove') {
          toast('A primary address cannot be removed');
        } else {
          toast('Set as primary');
        }
      });
    });
    document.addEventListener('click', (e) => { if (!panel.contains(e.target)) closePops(); });

    /* ── delete confirmation gate ── */
    const delInput = document.getElementById('acctDeleteConfirm');
    const delBtn   = document.getElementById('acctDeleteBtn');
    if (delInput && delBtn) {
      delInput.addEventListener('input', () => {
        delBtn.disabled = delInput.value.trim().toUpperCase() !== 'DELETE';
      });
    }

    /* ── saves ── */
    panel.querySelectorAll('[data-save]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const what = btn.dataset.save;

        if (what === 'profile') {
          const first = document.getElementById('acctFirst');
          if (!first.value.trim()) return markInvalid(first, 'A first name is required');
          pretendSave(btn, 650, () => {
            const last = document.getElementById('acctLast').value.trim();
            document.getElementById('acctName').textContent =
              (first.value.trim() + ' ' + last).trim();
            toast('Profile saved');
            show('root');
          });
          return;
        }

        if (what === 'add-email') {
          const input = document.getElementById('acctNewEmail');
          const value = input.value.trim();
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
            return markInvalid(input, 'Enter a valid email address');
          }
          pretendSave(btn, 750, () => {
            document.getElementById('acctVerifyTarget').textContent = value;
            document.getElementById('acctCode').value = '';
            toast('Code sent to ' + value);
            show('verify');
          });
          return;
        }

        if (what === 'verify') {
          const code = document.getElementById('acctCode');
          if (!/^\d{6}$/.test(code.value.trim())) {
            return markInvalid(code, 'Enter the 6-digit code');
          }
          pretendSave(btn, 750, () => {
            addEmailRow(document.getElementById('acctVerifyTarget').textContent);
            toast('Email address added');
            show('root');
          });
          return;
        }

        if (what === 'password') {
          const a = document.getElementById('acctPwd1');
          const b = document.getElementById('acctPwd2');
          if (a.value.length < 8) return markInvalid(a, 'Use at least 8 characters');
          if (a.value !== b.value) return markInvalid(b, 'The two passwords do not match');
          pretendSave(btn, 750, () => {
            document.getElementById('acctPwdState').textContent = 'Set · last changed just now';
            a.value = ''; b.value = '';
            toast('Password set');
            show('root');
          });
          return;
        }

        if (what === 'delete') {
          pretendSave(btn, 900, () => {
            toast('Account deleted — signing out');
            document.getElementById('kmodal')?.classList.remove('open');
          });
        }
      });
    });

    /* A verified address joins the list, above the "Add" row. */
    function addEmailRow(address) {
      const list = document.getElementById('acctEmails');
      const addRow = list.querySelector('[data-go="add-email"]');

      const row = document.createElement('div');
      row.className = 'acct-row acct-row--static';

      const mail = document.createElement('span');
      mail.className = 'acct-mail';
      mail.textContent = address;              // textContent, never innerHTML

      const more = document.createElement('span');
      more.className = 'acct-more';

      const dots = document.createElement('button');
      dots.type = 'button';
      dots.className = 'acct-dots';
      dots.setAttribute('aria-label', 'Email options');
      dots.setAttribute('aria-expanded', 'false');
      dots.textContent = '…';

      const pop = document.createElement('span');
      pop.className = 'acct-pop';
      pop.hidden = true;

      const makePrimary = document.createElement('button');
      makePrimary.type = 'button';
      makePrimary.textContent = 'Set as primary';
      makePrimary.addEventListener('click', () => { closePops(); toast('Set as primary'); });

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'danger';
      remove.textContent = 'Remove address';
      remove.addEventListener('click', () => {
        closePops();
        row.remove();
        toast('Address removed');
      });

      pop.append(makePrimary, remove);
      more.append(dots, pop);
      row.append(mail, more);
      list.insertBefore(row, addRow);
      wireDots(dots, pop);
    }

    /* ── sign a device out ── */
    panel.querySelectorAll('[data-signout-device]').forEach((b) => {
      b.addEventListener('click', () => {
        pretendSave(b, 650, () => {
          b.closest('.acct-row').remove();
          toast('Signed out on that device');
        });
      });
    });
  })();
