/* Shot driver — injected into a throwaway copy of mentor.html.
 *
 * It is never served: make.py writes the copy, takes the shots and
 * deletes both. Every helper drives the app through a hook the app
 * already exposes, so a screen here is the real state and not a
 * hand-built likeness of one.
 */
(function () {
  // Chrome takes the shot early in virtual time, so the state has to be
  // in place early and nothing may still be easing towards it. Killing
  // transitions is what makes a shot the state rather than the way in.
  var FREEZE_CSS = '*,*::before,*::after{transition:none !important}';
  var SETTLE = 3000;   // how long a recipe's own timers get to finish
  var params = new URLSearchParams(location.search);
  var id = params.get('shot');
  if (!id) return;
  var recipe = (window.__RECIPES || {})[id];
  if (recipe === undefined) return;

  // ── Holding the clock still ────────────────────────────────
  // --screenshot keeps the page alive well past the point where
  // --dump-dom would have ended it, and virtual time races ahead while
  // it waits. Left alone, a shot of the checkout comes back as the
  // out-of-time panel: the session meter has ticked the balance to zero
  // between the state being set and the camera firing.
  //
  // So two things. The session spend tick never runs at all, which also
  // means every screen reports the same balance rather than a different
  // one each time. And once the recipe has had SETTLE to finish its own
  // chains, every timer still pending is cancelled and no new one can be
  // made, which pins the frame for however long the capture takes.
  var NT = window.setTimeout, NI = window.setInterval;
  var timers = [], intervals = [];
  window.setTimeout = function () {
    var t = NT.apply(window, arguments); timers.push(t); return t;
  };
  window.setInterval = function (fn, ms) {
    if (ms === 4500) return 0;        // 10-hud-controller: spend(1) per tick
    var t = NI.apply(window, arguments); intervals.push(t); return t;
  };
  function hold() {
    timers.forEach(clearTimeout);
    intervals.forEach(clearInterval);
    window.setTimeout = function () { return 0; };
    window.setInterval = function () { return 0; };
  }

  // The tour owns the first load, so it stays out of the way unless the
  // screen is a tour screen.
  try {
    if (recipe.indexOf('K.tour(') < 0) localStorage.setItem('kaiso_onboarded', '1');
    if (recipe.indexOf('KaisoConsent') < 0) {
      localStorage.setItem('kaiso.consent',
        JSON.stringify({ analytics: false, at: new Date().toISOString(), v: 1 }));
    }
  } catch (e) {}

  var LOREM = [
    ['user', 'We help small agencies stop losing hours to status updates.'],
    ['kaiso', '⟨Problem⟩ Good. Who inside the agency feels that loss first — the person writing the update, or the one chasing it?'],
    ['user', 'The account manager. They write the same thing three times a week.'],
    ['kaiso', 'Then the buyer and the sufferer are the same person, which is the easy case. How many agencies have told you this unprompted?'],
    ['user', 'Eleven out of the fourteen we spoke to.'],
    ['kaiso', '⟨Evidence⟩ Eleven of fourteen is a signal, not a hunch. Say that number out loud in every pitch — it does more work than any adjective.'],
  ];
  var EARLIER = [
    ['user', 'I want to understand whether this is a business or a feature.'],
    ['kaiso', 'A fair question to open with. Tell me what the founder does on a Monday morning today, before your product exists.'],
  ];

  function msg(who, text) {
    var el = document.createElement('div');
    el.className = 'msg ' + who;
    var label = document.createElement('div');
    label.className = 'who';
    label.textContent = who === 'user' ? 'YOU' : 'KAISO';
    var body = document.createElement('div');
    body.className = 'body';
    if (text.length > 60) body.classList.add('long');
    if (who === 'kaiso') {
      body.innerHTML = text.replace(/⟨([^⟩]+)⟩/g, '<strong>$1</strong>');
    } else {
      body.textContent = text;
    }
    el.appendChild(label);
    el.appendChild(body);
    return el;
  }

  function sep(text, live) {
    var el = document.createElement('div');
    el.className = 'scribe-sep' + (live ? ' live' : '');
    el.setAttribute('role', 'separator');
    var l = document.createElement('span');
    l.className = 'scribe-sep-label';
    l.textContent = text;
    el.appendChild(l);
    return el;
  }

  var K = {
    click: function (sel) {
      var el = document.querySelector(sel);
      if (el) el.click();
      return el;
    },

    // The sigil drives the whole lifecycle; voice and the session call
    // fail in headless and are already caught where they are made.
    engage: function () {
      try { document.getElementById('sacred').click(); } catch (e) {}
      document.body.classList.add('active');
      // The ignition flash is a frame of an animation, not a state. At
      // the moment the shot is taken it would still be a white sheet.
      ['flash', 'sigil-1', 'sigil-2'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.classList.remove('fire');
      });
    },

    // One exchange is one turn of talking. Everything that grows — the
    // Library, the readiness meter, the KOS wheel — grows off this.
    exchanges: function (n) {
      for (var i = 0; i < n; i++) window.dispatchEvent(new CustomEvent('kaiso:exchange'));
    },

    // The forge toast is a moment, not a state. Most screens are taken
    // after it would have gone.
    quiet: function () {
      var t = document.getElementById('kready');
      if (t) t.classList.remove('show');
      document.body.classList.remove('forged');
    },

    scribe: function (withEarlier) {
      var log = document.getElementById('chatLog');
      log.innerHTML = '';
      if (withEarlier) {
        log.appendChild(sep('Session 1 · Yesterday · 16:42 · 24 min'));
        EARLIER.forEach(function (m) { log.appendChild(msg(m[0], m[1])); });
      }
      log.appendChild(sep('Session ' + (withEarlier ? 2 : 1) + ' · Today · 09:18 · live', true));
      LOREM.forEach(function (m) { log.appendChild(msg(m[0], m[1])); });
      document.body.classList.add('chat-open');
      log.scrollTop = log.scrollHeight;
    },

    // The tour starts itself 800 ms in. Nothing is waiting for that, so
    // it is started here instead and then stepped to where it is wanted.
    tour: function (step) {
      K.click('#tourReplay');
      document.getElementById('accountMenu').classList.remove('open');
      for (var i = 0; i < step; i++) K.click('#ttNext');
    },

    panel: function (name) { window.KaisoPanels.open(name); },

    acct: function (view) {
      window.KaisoPanels.open('account');
      window.KaisoAccount.show(view);
    },

    // The pointer resolves "this" on desktop, so a screen about aiming
    // has to arrive the same way a pointer would.
    aim: function (sel) {
      var el = document.querySelector(sel);
      if (!el) return;
      ['pointerenter', 'mouseenter', 'mouseover'].forEach(function (type) {
        el.dispatchEvent(new MouseEvent(type, { bubbles: type === 'mouseover' }));
      });
    },

    // A state that exists only between two timers cannot be caught by a
    // camera that runs the clock forward. This holds the long ones.
    freeze: function () {
      var orig = window.setTimeout;
      window.setTimeout = function (fn, ms) {
        if (ms >= 800) return 0;
        return orig.apply(window, arguments);
      };
    },

    low: function () { window.KaisoTime.spend(36); },
    empty: function () { window.KaisoTime.spend(60); },

    /* ── the entry flow, before the app ── */
    screen: function (n) { window.kaisoShowScreen(n); },

    // The intake refuses to advance past an unanswered section, which is
    // right for a founder and wrong for a camera. The questions are what
    // is being reviewed, so the gate comes off and the form stays empty.
    intake: function (section) {
      window.kaisoShowScreen(1);
      window.KaisoIntakeSchema.validateSection = function () { return {}; };
      for (var i = 1; i < section; i++) K.click('#intakeRoot .intake-nav .btn.primary');
    },
  };
  window.K = K;

  function run() {
    try { eval(recipe); } catch (e) { console.error('[shot] ' + id + ': ' + e.message); }
    // How tall the state turned out, for the pass that takes the shot.
    // The entry flow scrolls the document, so a screenful is not the
    // screen; the app does not, and ignores this.
    var bottom = 0;
    document.querySelectorAll('body *').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.width && r.height) bottom = Math.max(bottom, r.bottom + window.scrollY);
    });
    document.title = 'KH:' + Math.ceil(bottom + 40);
    document.documentElement.setAttribute('data-shot-ready', id);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var st = document.createElement('style');
    st.textContent = FREEZE_CSS;
    document.head.appendChild(st);
    run();
    // On the native timer, so a recipe that called K.freeze() cannot
    // drop the hold that is meant to come after it.
    NT(hold, SETTLE);
  });
})();
