  // ─── Live caption — the last sentence, on the stage ────────────
  // A founder in a session is looking at the medallion, not at the
  // scribe. One line of what is being said right now keeps them
  // oriented without opening anything: Kaiso's sentence while it
  // speaks, their own words while they talk.
  //
  // It is one line, not a growing block. The scribe holds the history;
  // this is the present tense, and it fades when nobody is talking so
  // the stage goes back to being quiet.
  //
  // Kaiso's line is paced against the audio it is reading, not a guess:
  // the sentences share out the clip's real duration by their length, so
  // the band turns over roughly when the voice reaches the next one.
  (function liveCaption() {
    const band = document.getElementById('liveCaption');
    const btn = document.getElementById('captionToggle');
    if (!band) return;

    const whoEl = band.querySelector('.cap-who');
    const lineEl = band.querySelector('.cap-line');

    const KEY = 'kaiso.caption';
    const LINGER_MS = 2600;   // a finished line stays readable this long
    const CHARS_PER_SEC = 13.5; // fallback pace when there is no audio to follow

    // On by default. The first thing a founder doubts is whether it heard
    // them right, and the stage has the room. The choice is remembered.
    let on = true;
    try { on = localStorage.getItem(KEY) !== '0'; } catch (_) {}

    let fadeTimer = null;
    let walk = null;        // the sentence walk in flight, if any

    function syncBtn() {
      if (!btn) return;
      btn.classList.toggle('off', !on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.setAttribute('aria-label', on ? 'Turn the live caption off' : 'Turn the live caption on');
      btn.title = on ? 'Live caption on' : 'Live caption off';
    }

    function hide() {
      band.classList.remove('up');
      if (fadeTimer) { clearTimeout(fadeTimer); fadeTimer = null; }
    }

    function show(who, text) {
      if (!on || !text) return;
      if (fadeTimer) { clearTimeout(fadeTimer); fadeTimer = null; }
      band.dataset.who = who;
      whoEl.textContent = who === 'you' ? 'You' : 'Kaiso';
      lineEl.textContent = text;
      band.classList.add('up');
    }

    function fadeSoon(after) {
      if (fadeTimer) clearTimeout(fadeTimer);
      fadeTimer = setTimeout(hide, after == null ? LINGER_MS : after);
    }

    /* ── one sentence out of a longer line ── */
    // ⟨Purpose⟩ marks which node the turn belongs to. The scribe shows it
    // as a label; on one line of caption it just reads as noise.
    const plain = (t) => String(t || '')
      .replace(/⟨[^⟩]*⟩/g, ' ')
      .replace(/\*\*?([^*]+)\*\*?/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();

    function sentences(text) {
      const raw = plain(text).match(/[^.!?…]+[.!?…]*\s*/g) || [];
      const out = [];
      raw.forEach((s) => {
        s = s.trim();
        if (!s) return;
        // A long sentence is two lines of caption and unreadable at a
        // glance, so break it at the nearest clause instead.
        while (s.length > 150) {
          const cut = s.lastIndexOf(', ', 150);
          const dash = s.lastIndexOf(' — ', 150);
          const at = Math.max(cut, dash);
          if (at < 60) break;
          out.push(s.slice(0, at + (at === cut ? 1 : 3)).trim());
          s = s.slice(at + (at === cut ? 2 : 3)).trim();
        }
        if (s) out.push(s);
      });
      return out;
    }

    const lastOf = (text) => {
      const parts = sentences(text);
      return parts.length ? parts[parts.length - 1] : plain(text);
    };

    function stopWalk() {
      if (!walk) return;
      if (walk.timer) clearTimeout(walk.timer);
      if (walk.audio && walk.onTime) walk.audio.removeEventListener('timeupdate', walk.onTime);
      walk = null;
    }

    /* ── Kaiso speaking: walk the sentences alongside the audio ── */
    function speech(text, audio) {
      stopWalk();
      if (!on) return;
      const parts = sentences(text);
      if (!parts.length) return;
      if (parts.length === 1) {
        show('kaiso', parts[0]);
        // With audio, the chat module fades it when playback ends.
        if (!audio) fadeSoon((parts[0].length / CHARS_PER_SEC) * 1000 + LINGER_MS);
        return;
      }

      const chars = parts.map((s) => s.length);
      const total = chars.reduce((a, b) => a + b, 0);
      let i = -1;
      const step = (next) => {
        if (next === i || next >= parts.length) return;
        i = next;
        show('kaiso', parts[i]);
      };
      step(0);

      // With the clip in hand, share its real duration out by length and
      // follow playback. Without one, read at a plain pace.
      const follow = () => {
        const dur = audio.duration;
        if (!isFinite(dur) || dur <= 0) return paced();
        const edges = [];
        let acc = 0;
        chars.forEach((c) => { acc += c; edges.push((acc / total) * dur); });
        const onTime = () => {
          const t = audio.currentTime;
          let next = 0;
          while (next < edges.length - 1 && t >= edges[next]) next += 1;
          step(next);
        };
        audio.addEventListener('timeupdate', onTime);
        walk = { audio, onTime };
      };

      const paced = () => {
        walk = { timer: null };
        const tick = () => {
          const next = i + 1;
          const wait = (chars[i] / CHARS_PER_SEC) * 1000;
          if (next >= parts.length) {
            // Read to the end with nothing to follow: let the last line go.
            if (!audio) fadeSoon(wait + LINGER_MS);
            return;
          }
          walk.timer = setTimeout(() => { step(next); tick(); }, wait);
        };
        tick();
      };

      if (audio && typeof audio.addEventListener === 'function') {
        if (isFinite(audio.duration) && audio.duration > 0) follow();
        else audio.addEventListener('loadedmetadata', follow, { once: true });
      } else {
        paced();
      }
    }

    /* ── the hooks the chat module calls ── */
    window.KaisoCaption = {
      // The founder's words as they are recognised, or Kaiso's one-liner.
      say(who, text) {
        if (who !== 'you') stopWalk();
        show(who, lastOf(text));
      },
      // Kaiso's reply, with the audio it is being read from if there is one.
      speech,
      // Speech ended or the turn closed: let the last line linger, then go.
      done(after) { stopWalk(); fadeSoon(after); },
      clear() { stopWalk(); hide(); },
      enabled() { return on; },
    };

    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        on = !on;
        try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (_) {}
        syncBtn();
        if (!on) { stopWalk(); hide(); }
      });
    }
    syncBtn();

    // Nothing to caption once the stage is dormant, and the scribe says it
    // better when it is open.
    new MutationObserver(() => {
      if (!document.body.classList.contains('active')) { stopWalk(); hide(); }
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  })();
