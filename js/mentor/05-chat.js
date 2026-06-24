  // ─── Chat — wired to the live KOS Agent Harness ─────────
  // Talks to the deployed harness at API_URL (configurable via URL params or
  // window.KAISO_CONFIG). Uses Web Speech API for en-GB STT (mic) and TTS
  // (Kaiso's voice). Falls back to text-only if speech APIs are unavailable.
  (function chat() {
    // ─ Config (override via ?api=… / ?principal=… / ?lang=… / ?voice=… / ?stt=0 / ?tts=0)
    const cfg = Object.assign({
      apiUrl:    '',  // same-origin when served from harness /mentor; override with ?api=…
      principal: 'org_pilot_1:user_pilot_founder:founder',
      voiceLang: 'en-GB',     // British English — STT recognition language
      voiceName: null,         // null = pick the best available en-GB voice (browser-fallback TTS only)
      kaisoVoice: 'Charon',   // Gemini TTS voice for cloud TTS (legacy mentor voice)
      sttEnabled: true,
      ttsEnabled: true,
    }, window.KAISO_CONFIG || {});
    const params = new URLSearchParams(location.search);
    if (params.get('api'))       cfg.apiUrl = params.get('api');
    if (params.get('principal')) cfg.principal = params.get('principal');
    if (params.get('lang'))      cfg.voiceLang = params.get('lang');
    if (params.get('voice'))     cfg.voiceName = params.get('voice');
    if (params.get('kaisoVoice')) cfg.kaisoVoice = params.get('kaisoVoice');
    // Voice provider — 'haiku-charon' (default: Haiku + Gemini Charon TTS,
    // sequential REST hops) or 'grok-realtime' (xAI Voice Agent over a
    // single WebSocket, sub-1s claimed time-to-first-audio).
    cfg.voiceProvider = params.get('voice') === 'grok-realtime'
      ? 'grok-realtime'
      : 'haiku-charon';
    if (params.get('stt') === '0') cfg.sttEnabled = false;
    if (params.get('tts') === '0') cfg.ttsEnabled = false;

    const toggleBtn = document.getElementById('scrollToggle');
    const closeBtn  = document.getElementById('chatClose');
    const log       = document.getElementById('chatLog');
    const form      = document.getElementById('chatForm');
    const input     = document.getElementById('chatInput');
    const micBtn    = document.getElementById('chatMic');
    const sendBtn   = document.getElementById('chatSend');
    const doneBtn   = document.getElementById('doneTalking');

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const isSecure = window.isSecureContext === true
                  || location.protocol === 'https:'
                  || location.hostname === 'localhost'
                  || location.hostname === '127.0.0.1';

    let sessionId   = null;
    let pendingTurn = false;
    let liveInterim = '';       // latest STT preview — not yet finalized by the browser
    let skipNextFinal = false;  // drop one SR final after a manual "done talking" commit

    // ─ DOM helpers ────────────────────────────────────────
    function escapeHtml(s) {
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
    /** Kaiso replies: ⟨Purpose⟩ → bold node name only; strip stray markdown. */
    function formatMentorBody(text) {
      return escapeHtml(text || '')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/⟨([^⟩]+)⟩/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '$1');
    }
    function setKaisoBody(bodyEl, text) {
      bodyEl.innerHTML = formatMentorBody(text);
    }
    function appendMsg(who, text) {
      const el = document.createElement('div');
      el.className = 'msg ' + who;
      const label = document.createElement('div');
      label.className = 'who';
      label.textContent = who === 'user' ? 'YOU' : (who === 'live' ? 'LIVE' : 'KAISO');
      const body = document.createElement('div');
      body.className = 'body';
      if (text && text.length > 60) body.classList.add('long');
      if (who === 'kaiso' && text) setKaisoBody(body, text);
      else body.textContent = text || '';
      el.appendChild(label);
      el.appendChild(body);
      log.appendChild(el);
      log.scrollTop = log.scrollHeight;
      return el;
    }
    function appendErr(message) {
      const el = appendMsg('kaiso', '');
      const b = el.querySelector('.body');
      b.classList.add('error', 'long');
      b.textContent = '(error) ' + message;
      return el;
    }

    // ─ Harness HTTP ───────────────────────────────────────
    function reqHeaders() {
      return {
        'Content-Type': 'application/json',
        'X-Dev-Principal': cfg.principal,
      };
    }
    async function apiPost(path, body) {
      const r = await fetch(cfg.apiUrl + path, {
        method: 'POST', headers: reqHeaders(),
        body: JSON.stringify(body || {}),
      });
      const text = await r.text();
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + text.slice(0, 200));
      return text ? JSON.parse(text) : {};
    }
    async function startSession() {
      if (sessionId) return sessionId;
      const r = await apiPost('/api/session/start', { mode: 'surfacing' });
      sessionId = r.session_id;
      return sessionId;
    }
    async function endSession() {
      if (!sessionId) return;
      const sid = sessionId;
      sessionId = null;
      try { await apiPost('/api/session/' + sid + '/end', {}); }
      catch (e) { /* fire-and-forget */ }
    }
    // Conversation history kept client-side and sent with every /api/chat
    // call. Lets us hit the fast Haiku endpoint without a Postgres round-trip
    // for context. Trimmed to last 20 messages.
    const chatHistory = [];

    async function sendTurn(text) {
      if (!text || pendingTurn) return;
      // Every user turn feeds the Library outputs (forge progress), whether or
      // not a backend is wired up — so the artifacts build as you talk.
      window.dispatchEvent(new CustomEvent('kaiso:exchange'));
      pendingTurn = true;
      syncDoneBtn();
      sendBtn.disabled = true;
      const thinkEl = appendMsg('kaiso', '');
      const body = thinkEl.querySelector('.body');
      body.classList.add('thinking');
      let accumulated = '';
      try {
        // Stream from /api/chat-stream so text appears as Haiku generates
        // it (~500ms first token vs ~1s waiting for full reply). When the
        // full message lands, fire /api/tts on it for spoken playback.
        const resp = await fetch(cfg.apiUrl + '/api/chat-stream', {
          method: 'POST',
          headers: reqHeaders(),
          body: JSON.stringify({ text, history: chatHistory.slice(-20) }),
        });
        if (!resp.ok || !resp.body) {
          throw new Error('HTTP ' + resp.status);
        }
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        let finalText = '';
        body.classList.remove('thinking');
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          // SSE frames are separated by \n\n
          let idx;
          while ((idx = buf.indexOf('\n\n')) !== -1) {
            const frame = buf.slice(0, idx).trim();
            buf = buf.slice(idx + 2);
            if (!frame.startsWith('data:')) continue;
            const payload = frame.slice(5).trim();
            if (!payload) continue;
            let evt; try { evt = JSON.parse(payload); } catch (_) { continue; }
            if (evt.delta) {
              accumulated += evt.delta;
              body.textContent = accumulated;
              if (accumulated.length > 60) body.classList.add('long');
              log.scrollTop = log.scrollHeight;
            } else if (evt.error) {
              throw new Error(evt.error);
            } else if (evt.done) {
              finalText = (evt.text || accumulated).trim();
            }
          }
        }
        if (!finalText) finalText = accumulated.trim();
        setKaisoBody(body, finalText || '(no reply)');
        chatHistory.push({ role: 'user', content: text });
        chatHistory.push({ role: 'assistant', content: finalText });
        speak(finalText);
      } catch (e) {
        if (!accumulated) thinkEl.remove();
        else { body.classList.remove('thinking'); }
        appendErr(e.message);
      } finally {
        pendingTurn = false;
        sendBtn.disabled = false;
        syncDoneBtn();
        log.scrollTop = log.scrollHeight;
      }
    }

    function syncDoneBtn() {
      if (!doneBtn) return;
      const show = !!log.dataset.engaged
        && !kaisoSpeaking
        && !pendingTurn
        && (cfg.voiceProvider === 'grok-realtime'
          ? !!(grokRealtime && grokRealtime.isReady && grokRealtime.isReady())
          : !!(listening && !micMuted));
      doneBtn.hidden = !show;
      doneBtn.classList.toggle('visible', show);
      doneBtn.disabled = !show;
    }

    function finishTalking() {
      if (!log.dataset.engaged || pendingTurn || kaisoSpeaking) return;
      if (cfg.voiceProvider === 'grok-realtime') {
        grokRealtime.commitTurn();
        return;
      }
      const text = liveInterim.trim();
      if (text) {
        skipNextFinal = true;
        liveInterim = '';
        commitLive(text);
        syncDoneBtn();
        sendTurn(text);
        if (recognition && !micMuted) {
          echoFlushing = true;
          try { recognition.abort(); } catch (_) {}
        }
        return;
      }
      // No preview yet — nudge the browser STT to finalize whatever it heard.
      if (recognition && listening && !micMuted) {
        try { recognition.stop(); } catch (_) {}
      }
    }

    // ─ Lifecycle: voice-first, scribe-optional ─────────────
    // engageKaiso runs on awaken — starts session + mic + greeting.
    // It does NOT open the scribe panel; voice is the primary interface.
    // The scribe panel is for monitoring transcript / typing as fallback,
    // and the user opens it explicitly via the scroll-toggle button.
    function isMicHardwareAvailable() {
      return !!(SR && cfg.sttEnabled && isSecure);
    }
    function setMicMentorActive(mentorOn) {
      if (!micBtn) return;
      micBtn.classList.remove('unavailable');
      if (!mentorOn) {
        micBtn.classList.remove('mic-on', 'muted');
        return;
      }
      if (!isMicHardwareAvailable()) {
        micBtn.classList.add('unavailable');
        micBtn.title = SR ? 'Speech-to-text disabled' : 'Speech recognition not supported — use text input';
        micBtn.setAttribute('aria-label', micBtn.title);
        return;
      }
      syncMicVisual();
    }
    function syncMicVisual() {
      if (!micBtn) return;
      if (cfg.voiceProvider === 'grok-realtime') {
        const isMuted = grokRealtime.isMuted();
        const title = isMuted ? 'Unmute microphone' : 'Mute microphone';
        micBtn.classList.toggle('mic-on', !isMuted);
        micBtn.classList.toggle('muted', isMuted);
        micBtn.title = title;
        micBtn.setAttribute('aria-label', title);
        return;
      }
      const title = micMuted ? 'Unmute microphone' : 'Mute microphone';
      micBtn.classList.toggle('mic-on', !micMuted);
      micBtn.classList.toggle('muted', micMuted);
      micBtn.title = title;
      micBtn.setAttribute('aria-label', title);
    }
    function engageKaiso() {
      if (log.dataset.engaged) return;
      log.dataset.engaged = '1';
      micMuted = false;
      setMicMentorActive(true);
      syncMicVisual();
      if (cfg.voiceProvider === 'grok-realtime') {
        // Single bidirectional WebSocket to xAI; the agent handles STT+LLM+TTS.
        grokRealtime.engage().then(() => {
          syncMicVisual();
          syncDoneBtn();
        }).catch((e) => {
          appendErr('Grok realtime engage failed: ' + e.message);
          // Soft fallback to Haiku+Charon path if realtime fails.
          cfg.voiceProvider = 'haiku-charon';
          startSession().catch((err) => appendErr('Session start failed: ' + err.message));
          startListening();
          if (!log.dataset.greeted) {
            const greeting = "I'm listening. We begin with Purpose — why you exist beyond revenue. Walk me through why you started this.";
            appendMsg('kaiso', greeting);
            log.dataset.greeted = '1';
            speak(greeting);
          }
        });
        return;
      }
      // Default path: Haiku /api/chat-stream + Gemini Charon /api/tts.
      // Session tracking is optional for chat-stream (no Postgres required to talk).
      if (!log.dataset.greeted) {
        const greeting = "I'm listening. Speak, or write a question to the scribe.";
        appendMsg('kaiso', greeting);
        log.dataset.greeted = '1';
        speak(greeting);
      }
      startSession().catch((e) => console.warn('[kaiso] session start skipped:', e.message));
      startListening();
      syncDoneBtn();
    }
    function disengageKaiso() {
      if (!log.dataset.engaged) return;
      delete log.dataset.engaged;
      micMuted = false;
      echoFlushing = false;
      liveInterim = '';
      skipNextFinal = false;
      if (cfg.voiceProvider === 'grok-realtime') {
        grokRealtime.disengage();
      }
      stopCapture();
      cancelSpeech();
      endSession();
      closeScribe();
      setMicMentorActive(false);
      syncDoneBtn();
    }
    function openScribe() {
      if (!document.body.classList.contains('active')) return;
      document.body.classList.add('chat-open');
      if (micBtn) {
        micBtn.style.display = 'flex';
        micBtn.style.visibility = 'visible';
        if (log.dataset.engaged) syncMicVisual();
        else micBtn.classList.add('mic-on');
      }
      setTimeout(() => input.focus(), 250);
    }
    function closeScribe() {
      document.body.classList.remove('chat-open');
    }
    // Aliases so existing call sites keep working — openChat is now just
    // the panel toggle, NOT the lifecycle entry point.
    function openChat() { openScribe(); }
    function closeChat() { closeScribe(); }

    window.addEventListener('kaiso-disengage', () => disengageKaiso());
    toggleBtn.addEventListener('click', () => {
      if (document.body.classList.contains('chat-open')) closeScribe();
      else openScribe();
    });
    closeBtn.addEventListener('click', closeScribe);

    // Sacred glyph drives the lifecycle: first click engages voice (mic
    // on, session running, greeting spoken). The scribe panel stays
    // closed by default — the user opens it only if they want to see the
    // transcript or type. Second sacred click disengages everything.
    const sacredEl = document.getElementById('sacred');
    if (sacredEl) {
      // Run synchronously inside the click — the outer-IIFE awaken/dismiss
      // listener is registered earlier so by the time our handler runs the
      // .active class has already been toggled. Synchronous keeps the user
      // gesture chain intact for getUserMedia / SpeechRecognition.
      sacredEl.addEventListener('click', () => {
        const isActive = document.body.classList.contains('active');
        if (isActive) engageKaiso();
        else disengageKaiso();
      });
    }

    // ─ Form submit → real turn ────────────────────────────
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = input.value.trim();
      if (!v) return;
      appendMsg('user', v);
      input.value = '';
      cancelSpeech();
      sendTurn(v);
    });

    // ─ Live STT (Web Speech API, en-GB) ───────────────────
    let recognition = null;
    let listening   = false;   // SR engine currently running
    let micMuted    = false;   // user mute — independent of echo-flush restarts
    let echoFlushing = false;  // internal abort to drop TTS echo, not a user mute
    // While Kaiso is speaking, SR keeps running but we drop every result
    // (interim or final). This is more reliable than abort()/restart —
    // restarting the recognizer requires user-activation, which is lost
    // after a setTimeout, so the mic would silently stay off after the
    // first turn. Keeping it continuously running avoids that entirely.
    let kaisoSpeaking = false;
    const TTS_TAIL_OFF_MS = 600;
    let kaisoSpeakingTimer = null;
    function setKaisoSpeaking(on) {
      // Internal state only — the UI deliberately doesn't change while
      // Kaiso is speaking. The talk-cta keeps showing "Listening" so the
      // experience feels seamless. Echo is suppressed two ways: results
      // are dropped while the flag is set, and the recognizer's audio
      // buffer is flushed via abort() after the tail-off so any of
      // Kaiso's last syllable that SR was still chewing on can't sneak in
      // as a turn. The 'end' handler then auto-restarts a fresh session.
      if (kaisoSpeakingTimer) { clearTimeout(kaisoSpeakingTimer); kaisoSpeakingTimer = null; }
      if (on) {
        kaisoSpeaking = true;
        syncDoneBtn();
      } else {
        kaisoSpeakingTimer = setTimeout(() => {
          kaisoSpeaking = false;
          kaisoSpeakingTimer = null;
          syncDoneBtn();
          // Flush any in-flight buffer so SR can't post-deliver echo.
          if (recognition && !micMuted && log.dataset.engaged) {
            echoFlushing = true;
            try { recognition.abort(); } catch (_) {}
            // 'end' handler auto-restarts a fresh recognition session;
            // permission is already granted so no user-activation needed.
          }
        }, TTS_TAIL_OFF_MS);
      }
    }
    let liveEl      = null;

    function ensureRecognition() {
      if (recognition || !SR) return recognition;
      recognition = new SR();
      recognition.lang = cfg.voiceLang;     // en-GB by default
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.addEventListener('result', (ev) => {
        // Drop everything while Kaiso is speaking (or in the tail-off window
        // immediately after) — that's just echo of his own voice.
        if (kaisoSpeaking) return;
        let interim = '', final = '';
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const t = ev.results[i][0].transcript;
          if (ev.results[i].isFinal) final += t; else interim += t;
        }
        if (interim) {
          liveInterim = interim;
          showLive(interim);
          syncDoneBtn();
        }
        if (final.trim()) {
          if (skipNextFinal) {
            skipNextFinal = false;
            return;
          }
          liveInterim = '';
          commitLive(final.trim());
          syncDoneBtn();
          sendTurn(final.trim());
        }
      });
      recognition.addEventListener('error', (ev) => {
        if (ev.error === 'aborted') {
          if (echoFlushing) echoFlushing = false;
          return;
        }
        if (ev.error === 'no-speech') return;
        const msg = {
          'not-allowed':         'Microphone permission denied. Click the lock icon in the address bar and allow Microphone, then click the mic again.',
          'service-not-allowed': 'Speech service blocked. This usually means file:// — open over HTTPS or http://localhost.',
          'audio-capture':       'No microphone found. Plug one in or pick the right input device.',
          'network':             'Speech recognition lost network. Check your connection.',
        }[ev.error];
        if (msg) {
          listening = false;
          micMuted = true;
          syncMicVisual();
          appendErr(msg);
        } else {
          console.warn('STT error:', ev.error);
        }
      });
      recognition.addEventListener('end', () => {
        // Auto-restart while the user wants the mic live. Continuous mode
        // usually keeps the engine alive, but Chrome can still close the
        // session after silence or after our echo-flush abort().
        if (!micMuted && log.dataset.engaged) {
          listening = true;
          try { recognition.start(); } catch (_) { /* already started */ }
          syncMicVisual();
          syncDoneBtn();
        } else {
          listening = false;
          syncMicVisual();
          syncDoneBtn();
        }
      });
      return recognition;
    }
    let micPermissionGranted = false;
    async function ensureMicPermission() {
      // getUserMedia gives the most reliable permission popup across
      // Chrome / Edge / Safari. SpeechRecognition.start() sometimes
      // fails to surface a popup if permission was previously dismissed.
      if (micPermissionGranted) return true;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        appendErr('Browser cannot access the microphone (no mediaDevices API).');
        return false;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        // We don't need the stream itself — SR uses its own pipeline.
        // Stop the tracks immediately so the OS-level mic indicator turns off
        // until recognition.start() reopens it.
        stream.getTracks().forEach(t => t.stop());
        micPermissionGranted = true;
        return true;
      } catch (e) {
        const name = e && e.name || 'Error';
        if (name === 'NotAllowedError') {
          appendErr('Microphone permission denied. Click the lock/info icon in the address bar, set Microphone to "Allow", then try again.');
        } else if (name === 'NotFoundError') {
          appendErr('No microphone detected. Check your input device in System Settings → Sound.');
        } else if (name === 'NotReadableError') {
          appendErr('Microphone is in use by another app. Close other tabs/apps that might be holding it.');
        } else {
          appendErr('Microphone error: ' + name + (e.message ? ' — ' + e.message : ''));
        }
        return false;
      }
    }

    function stopCapture() {
      listening = false;
      if (recognition) try { recognition.stop(); } catch (_) {}
      if (liveEl) { liveEl.remove(); liveEl = null; }
    }
    function muteMic() {
      if (!log.dataset.engaged) return;
      micMuted = true;
      stopCapture();
      syncMicVisual();
      syncDoneBtn();
    }
    function unmuteMic() {
      if (!log.dataset.engaged) return;
      micMuted = false;
      syncMicVisual();
      startListening();
      syncDoneBtn();
    }
    function handleMicClick() {
      if (!log.dataset.engaged) {
        appendErr('Enable Kaiso first — click the hexagram to start the mentor session.');
        return;
      }
      if (!isMicHardwareAvailable()) {
        if (!SR) {
          appendErr('Speech recognition is unavailable in this browser. Try Chrome, Edge, or Safari.');
        } else if (!cfg.sttEnabled) {
          appendErr('Speech-to-text is disabled by config. Remove ?stt=0 from the URL.');
        } else if (!isSecure) {
          appendErr('Microphone needs HTTPS or http://localhost.');
        }
        return;
      }
      if (micBtn.classList.contains('unavailable')) return;
      cancelSpeech();
      if (cfg.voiceProvider === 'grok-realtime') {
        grokRealtime.toggleMute();
        syncMicVisual();
        return;
      }
      if (micMuted) unmuteMic();
      else muteMic();
    }

    async function startListening() {
      console.log('[kaiso] startListening() — SR=', !!SR, 'isSecure=', isSecure, 'sttEnabled=', cfg.sttEnabled);
      if (!log.dataset.engaged || micMuted) return;
      if (!SR) {
        appendErr('Speech recognition is unavailable in this browser. Try Chrome, Edge, or Safari.');
        return;
      }
      if (!isSecure) {
        appendErr('Microphone needs HTTPS or http://localhost. Open https://kaiso-harness-justins-projects-a39c6ed9.vercel.app/mentor — or serve this file with: python3 -m http.server 8000');
        return;
      }
      // Force the permission popup via getUserMedia first. This makes the
      // Chrome mic-permission flow deterministic instead of hidden.
      const ok = await ensureMicPermission();
      if (!ok) return;
      const rec = ensureRecognition();
      if (!rec) return;
      try {
        rec.start();
        listening = true;
        syncMicVisual();
        syncDoneBtn();
        console.log('[kaiso] recognition.start() called, listening=true');
        // Unmissable visible feedback in the chat itself.
        if (!log.dataset.listenedOnce) {
          appendMsg('kaiso', '🎙 Listening — speak now (en-GB).');
          log.dataset.listenedOnce = '1';
        }
      } catch (e) {
        // start() throws InvalidStateError if already running — that's fine.
        // For other errors, surface them so the user knows what happened.
        if (e && e.name && e.name !== 'InvalidStateError') {
          appendErr('Could not start microphone: ' + (e.message || e.name));
        }
      }
    }
    function stopListening() {
      micMuted = true;
      stopCapture();
      syncMicVisual();
    }
    function showLive(text) {
      if (!liveEl) liveEl = appendMsg('live', '');
      const b = liveEl.querySelector('.body');
      if (text.length > 60) b.classList.add('long');
      b.textContent = '';
      b.appendChild(document.createTextNode(text));
      const caret = document.createElement('span');
      caret.className = 'caret';
      b.appendChild(caret);
      log.scrollTop = log.scrollHeight;
    }
    function commitLive(text) {
      if (!liveEl) liveEl = appendMsg('live', text);
      liveEl.classList.remove('live');
      liveEl.classList.add('user');
      liveEl.querySelector('.who').textContent = 'YOU';
      liveEl.querySelector('.body').textContent = text;
      liveEl = null;
      liveInterim = '';
    }
    micBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleMicClick();
    });
    if (doneBtn) {
      doneBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        finishTalking();
      });
    }

    // ─ "Tap to talk" — primary voice entry, mirrors /diag pattern ──
    // This is the path most users will hit. Same gesture chain as /diag,
    // which is known to work in the user's browser. The big button is
    // hard to miss; pulses gold when listening.


    // ─ TTS (Web Speech API, en-GB) ────────────────────────
    let pickedVoice = null;
    function pickVoice() {
      if (!cfg.ttsEnabled || !window.speechSynthesis) return null;
      const voices = window.speechSynthesis.getVoices() || [];
      if (!voices.length) return null;
      if (cfg.voiceName) {
        const named = voices.find(v => v.name === cfg.voiceName);
        if (named) return named;
      }
      // Preferred en-GB voices across macOS / Chrome / Edge.
      const wanted = [
        'Daniel', 'Daniel (Enhanced)', 'Daniel (Premium)',
        'Arthur', 'Oliver',
        'Kate', 'Serena', 'Serena (Enhanced)', 'Serena (Premium)',
        'Google UK English Male', 'Google UK English Female',
        'Microsoft Ryan Online (Natural) - English (United Kingdom)',
        'Microsoft Libby Online (Natural) - English (United Kingdom)',
        'Microsoft Sonia Online (Natural) - English (United Kingdom)',
      ];
      for (const name of wanted) {
        const v = voices.find(v => v.name === name);
        if (v) return v;
      }
      return voices.find(v => v.lang === cfg.voiceLang)
          || voices.find(v => (v.lang || '').startsWith('en-GB'))
          || voices.find(v => (v.lang || '').startsWith('en'))
          || null;
    }
    // Cloud TTS — Gemini 2.5 Flash with Charon voice via /api/tts. Returns
    // a high-quality WAV the browser plays via Audio(). Falls back to the
    // browser's robotic Web Speech API only if the cloud call fails.
    let currentAudio = null;
    let currentAudioUrl = null;

    async function speak(text) {
      if (!cfg.ttsEnabled || !text) return;
      cancelSpeech();
      setKaisoSpeaking(true);
      try {
        const r = await fetch(cfg.apiUrl + '/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice: cfg.kaisoVoice || undefined }),
        });
        if (!r.ok) {
          const errText = await r.text().catch(() => '');
          throw new Error('tts ' + r.status + ' ' + errText.slice(0, 160));
        }
        const blob = await r.blob();
        currentAudioUrl = URL.createObjectURL(blob);
        currentAudio = new Audio(currentAudioUrl);
        currentAudio.addEventListener('ended', () => {
          if (currentAudioUrl) { URL.revokeObjectURL(currentAudioUrl); currentAudioUrl = null; }
          currentAudio = null;
          setKaisoSpeaking(false);
        });
        currentAudio.addEventListener('error', () => {
          setKaisoSpeaking(false);
        });
        await currentAudio.play();
      } catch (e) {
        console.warn('[kaiso] cloud TTS failed, falling back to browser voice:', e);
        if (window.speechSynthesis) {
          try {
            const u = new SpeechSynthesisUtterance(text);
            if (!pickedVoice) pickedVoice = pickVoice();
            if (pickedVoice) { u.voice = pickedVoice; u.lang = pickedVoice.lang; }
            else { u.lang = cfg.voiceLang; }
            u.rate = 0.97; u.pitch = 1.02; u.volume = 1.0;
            u.onend = () => setKaisoSpeaking(false);
            u.onerror = () => setKaisoSpeaking(false);
            window.speechSynthesis.speak(u);
          } catch (_) {
            setKaisoSpeaking(false);
          }
        } else {
          setKaisoSpeaking(false);
        }
      }
    }
    function cancelSpeech() {
      const wasSpeaking = !!currentAudio;
      if (currentAudio) {
        try { currentAudio.pause(); } catch (_) {}
        currentAudio = null;
      }
      if (currentAudioUrl) {
        URL.revokeObjectURL(currentAudioUrl);
        currentAudioUrl = null;
      }
      if (window.speechSynthesis) try { window.speechSynthesis.cancel(); } catch (_) {}
      // If we cancelled mid-utterance, clear the speaking flag too so the
      // mic isn't perma-muted after the user interrupts Kaiso.
      if (wasSpeaking) setKaisoSpeaking(false);
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => { pickedVoice = pickVoice(); };
      pickedVoice = pickVoice();
    }

    // ─ Misc ───────────────────────────────────────────────
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('chat-open')) {
        e.stopPropagation();
      }
    });
    // If the user starts typing, drop the live STT preview so it doesn't fight.
    input.addEventListener('focus', () => {
      if (liveEl) { liveEl.remove(); liveEl = null; liveInterim = ''; syncDoneBtn(); }
    });

    // ─ Grok Voice Agent (alternate path, ?voice=grok-realtime) ─────
    // Single bidirectional WebSocket to wss://api.x.ai/v1/realtime.
    // The agent handles STT + reasoning + TTS in one stream — sub-1s
    // claimed time-to-first-audio. We send 24kHz Int16 PCM mic chunks
    // and play back 24kHz Int16 PCM audio chunks via Web Audio API.
    const grokRealtime = (function () {
      let ws = null;
      let audioCtx = null;
      let micStream = null;
      let micSource = null;
      let micProcessor = null;
      let playClock = 0;        // running schedule cursor for gapless playback
      let playSources = [];     // recently scheduled buffer sources (for cancel)
      let liveTranscript = '';  // accumulating Kaiso transcript per response
      let liveEl = null;
      let userTranscriptEl = null;
      let userTranscriptText = '';
      let muted = false;        // when true, drop mic frames before sending

      async function fetchConfig() {
        const r = await fetch(cfg.apiUrl + '/api/voice-agent/config', {
          headers: { 'X-Dev-Principal': cfg.principal },
        });
        if (!r.ok) throw new Error('voice-agent config: HTTP ' + r.status);
        return r.json();
      }

      function int16ToBase64(int16) {
        // Encode an Int16Array as base64 little-endian PCM.
        const bytes = new Uint8Array(int16.buffer, int16.byteOffset, int16.byteLength);
        let bin = '';
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        return btoa(bin);
      }
      function base64ToInt16(b64) {
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return new Int16Array(bytes.buffer);
      }

      // Down-sample browser's native sample rate (usually 48kHz) to 24kHz.
      function downsampleTo24k(input, inRate) {
        if (inRate === 24000) {
          const out = new Int16Array(input.length);
          for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
          return out;
        }
        const ratio = inRate / 24000;
        const outLen = Math.floor(input.length / ratio);
        const out = new Int16Array(outLen);
        for (let i = 0; i < outLen; i++) {
          const s = Math.max(-1, Math.min(1, input[Math.floor(i * ratio)]));
          out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        return out;
      }

      function playPcmChunk(int16) {
        if (!audioCtx) return;
        // Mobile browsers can re-suspend the context if the page is
        // backgrounded; resume defensively before every chunk so audio
        // doesn't silently drop on tab-switch / phone-lock.
        if (audioCtx.state === 'suspended') {
          audioCtx.resume().catch(() => {});
        }
        const buf = audioCtx.createBuffer(1, int16.length, 24000);
        const data = buf.getChannelData(0);
        for (let i = 0; i < int16.length; i++) {
          data[i] = int16[i] / 0x8000;
        }
        const src = audioCtx.createBufferSource();
        src.buffer = buf;
        src.connect(audioCtx.destination);
        const startAt = Math.max(audioCtx.currentTime, playClock);
        src.start(startAt);
        playClock = startAt + buf.duration;
        playSources.push(src);
        if (playSources.length > 256) playSources = playSources.slice(-256);
      }

      function cancelPlayback() {
        playSources.forEach((s) => { try { s.stop(); } catch (_) {} });
        playSources = [];
        playClock = audioCtx ? audioCtx.currentTime : 0;
      }

      async function startMicCapture() {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
            sampleRate: 24000,
          },
        });
        // AudioContext was created synchronously inside engage() to keep
        // the user gesture chain intact for mobile Safari. If that didn't
        // happen for some reason, create now as a safety net.
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') {
          try { await audioCtx.resume(); } catch (_) {}
        }
        micSource = audioCtx.createMediaStreamSource(micStream);
        // ScriptProcessor is deprecated but universally supported and
        // perfectly adequate at sub-100ms latency for our use case. Worklet
        // path is better for production — see PR comments.
        const bufSize = 2048;  // ~43ms at 48kHz
        micProcessor = audioCtx.createScriptProcessor(bufSize, 1, 1);
        micProcessor.onaudioprocess = (ev) => {
          if (muted) return;                                    // user-muted
          if (!ws || ws.readyState !== WebSocket.OPEN) return;  // WS not ready yet
          const inputData = ev.inputBuffer.getChannelData(0);
          const pcm24k = downsampleTo24k(inputData, audioCtx.sampleRate);
          ws.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: int16ToBase64(pcm24k),
          }));
        };
        micSource.connect(micProcessor);
        micProcessor.connect(audioCtx.destination);  // required for onaudioprocess to fire in some browsers
      }
      function stopMicCapture() {
        if (micProcessor) { try { micProcessor.disconnect(); } catch (_) {} }
        if (micSource) { try { micSource.disconnect(); } catch (_) {} }
        if (micStream) { try { micStream.getTracks().forEach((t) => t.stop()); } catch (_) {} }
        micProcessor = null; micSource = null; micStream = null;
      }

      function openWs(config) {
        // xAI's documented browser pattern: backend mints an ephemeral
        // token via POST /v1/realtime/client_secrets, browser passes it
        // in Sec-WebSocket-Protocol prefixed with "xai-client-secret.".
        // Long-lived API key never reaches the browser.
        const wsUrl = config.ws_url;
        const token = config.ephemeral_token;
        if (!token) {
          appendErr('No ephemeral token in voice-agent config — backend may be misconfigured.');
          return;
        }
        ws = new WebSocket(wsUrl, ['xai-client-secret.' + token]);

        ws.addEventListener('open', () => {
          console.log('[grok] WS open');
          ws.send(JSON.stringify({ type: 'session.update', session: config.session }));
        });

        ws.addEventListener('message', (ev) => {
          let evt; try { evt = JSON.parse(ev.data); } catch (_) { return; }
          handleEvent(evt);
        });

        ws.addEventListener('error', (ev) => {
          console.warn('[grok] WS error', ev);
          appendErr('Voice agent WebSocket error. Check console.');
        });
        ws.addEventListener('close', (ev) => {
          console.log('[grok] WS close code=' + ev.code + ' reason=' + (ev.reason || '(none)') + ' wasClean=' + ev.wasClean);
          if (!ev.wasClean && ev.code !== 1000) {
            // 1006 = abnormal closure (often auth rejection or network).
            // 1008/4xxx = policy/violation. Surface for diagnosis.
            appendErr('Grok WS closed (' + ev.code + ' ' + (ev.reason || 'no reason') + '). Check console.');
          }
          stopMicCapture();
        });
      }

      function handleEvent(evt) {
        switch (evt.type) {
          case 'session.created':
            console.log('[grok] session created:', evt.session && evt.session.id);
            // Mic capture was already started inside engage() — synchronously
            // with the user gesture — so we don't need to (re)start it here.
            // Open with a single-sentence greeting using response.create's
            // per-call instruction override — no fake user message in history.
            ws.send(JSON.stringify({
              type: 'response.create',
              response: {
                modalities: ['text', 'audio'],
                instructions: "Greet the user briefly as Kaiso. One short sentence. Mention you're listening.",
              },
            }));
            break;
          case 'input_audio_buffer.speech_started':
            // Barge-in: cancel current Kaiso reply.
            try { ws.send(JSON.stringify({ type: 'response.cancel' })); } catch (_) {}
            cancelPlayback();
            break;
          case 'response.output_audio.delta':
            try {
              const pcm = base64ToInt16(evt.delta);
              playPcmChunk(pcm);
            } catch (e) { console.warn('[grok] audio decode failed', e); }
            break;
          case 'response.output_audio_transcript.delta':
            if (!liveEl) {
              liveEl = appendMsg('kaiso', '');
              liveEl.querySelector('.body').classList.add('long');
            }
            liveTranscript += evt.delta || '';
            liveEl.querySelector('.body').textContent = liveTranscript;
            log.scrollTop = log.scrollHeight;
            break;
          case 'response.done':
            console.log('[grok] response.done — tokens:',
                        evt.response && evt.response.usage && evt.response.usage.total_tokens);
            liveEl = null;
            liveTranscript = '';
            break;
          case 'conversation.item.input_audio_transcription.completed':
            // The user's spoken turn was transcribed by the agent.
            if (evt.transcript && evt.transcript.trim()) {
              appendMsg('user', evt.transcript.trim());
            }
            userTranscriptEl = null;
            userTranscriptText = '';
            break;
          case 'error':
            console.warn('[grok] error event', evt);
            appendErr('Grok: ' + (evt.error && evt.error.message || JSON.stringify(evt).slice(0, 200)));
            break;
        }
      }

      async function engage() {
        if (ws && ws.readyState === WebSocket.OPEN) return;
        // Create AudioContext SYNCHRONOUSLY here, before any await. Mobile
        // Safari/Chrome require the AudioContext to be created during a
        // user gesture; once we hit our first `await` (getUserMedia /
        // fetchConfig) the gesture is gone and a later context creation
        // returns a permanently-suspended context that never plays audio.
        if (!audioCtx) {
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
          // Fire-and-forget; iOS rejects from non-gesture contexts, but
          // creating + resuming inside the click is the common pattern
          // that does work.
          audioCtx.resume().catch(() => {});
        }
        // Now do the async work — mic capture (audio frames buffer locally
        // until WS opens) and config fetch.
        try {
          await startMicCapture();
        } catch (e) {
          appendErr('Mic capture failed: ' + (e.message || e.name));
          throw e;
        }
        const config = await fetchConfig();
        openWs(config);
      }
      function disengage() {
        if (ws) {
          try { ws.close(1000); } catch (_) {}
          ws = null;
        }
        cancelPlayback();
        stopMicCapture();
        muted = false;
        liveEl = null; liveTranscript = '';
      }
      function toggleMute() {
        muted = !muted;
        return muted;
      }
      function sendText(text) {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        ws.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'message', role: 'user',
            content: [{ type: 'input_text', text }],
          },
        }));
        ws.send(JSON.stringify({ type: 'response.create' }));
      }

      function commitTurn() {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        try {
          ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
          ws.send(JSON.stringify({ type: 'response.create' }));
        } catch (e) {
          console.warn('[grok] commitTurn failed', e);
        }
      }
      function isReady() {
        return !!(ws && ws.readyState === WebSocket.OPEN);
      }

      return {
        engage, disengage, sendText, toggleMute, commitTurn, isReady,
        isMuted: () => muted,
        _state: () => ({ ws: ws && ws.readyState, audioCtx: audioCtx && audioCtx.state, muted }),
      };
    })();

    // Hook the form submit to route through Grok WS when active.
    const _origSendTurn = sendTurn;
    sendTurn = async function (text) {
      if (cfg.voiceProvider === 'grok-realtime') {
        if (!text) return;
        window.dispatchEvent(new CustomEvent('kaiso:exchange'));
        appendMsg('user', text);
        chatHistory.push({ role: 'user', content: text });
        grokRealtime.sendText(text);
        return;
      }
      return _origSendTurn(text);
    };

    // Tiny diagnostics handle for the console.
    window.kaiso = {
      cfg,
      session: () => sessionId,
      end: endSession,
      send: sendTurn,
      voices: () => (window.speechSynthesis ? window.speechSynthesis.getVoices() : []),
      pickedVoice: () => pickedVoice,
      grok: grokRealtime,
    };
  })();
