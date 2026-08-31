  // ─── Feedback panel — score, optional note, send ──────────────
  (function feedback() {
    const scale = document.getElementById('fbScale');
    const note  = document.getElementById('fbNote');
    const send  = document.getElementById('fbSend');
    if (!scale || !send) return;

    let score = null;

    scale.querySelectorAll('.fb-score').forEach((btn) => {
      btn.addEventListener('click', () => {
        score = Number(btn.dataset.score);
        scale.querySelectorAll('.fb-score').forEach((b) => {
          const on = b === btn;
          b.classList.toggle('sel', on);
          b.setAttribute('aria-checked', on ? 'true' : 'false');
        });
      });
    });

    function showToast(msg) {
      const toast = document.getElementById('ktoast');
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(showToast._t);
      showToast._t = setTimeout(() => toast.classList.remove('show'), 2600);
    }

    function reset() {
      score = null;
      scale.querySelectorAll('.fb-score').forEach((b) => {
        b.classList.remove('sel');
        b.setAttribute('aria-checked', 'false');
      });
      if (note) note.value = '';
    }

    send.addEventListener('click', async () => {
      // A score alone is enough; the note is genuinely optional.
      if (score === null) { showToast('Pick a score from 1 to 5'); return; }

      const cfg = window.kaiso?.cfg;
      const loading = window.KaisoLoader ? window.KaisoLoader.button(send) : null;
      try {
        if (cfg?.apiUrl) {
          await fetch(cfg.apiUrl + '/api/feedback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Dev-Principal': cfg.principal || '',
            },
            body: JSON.stringify({
              score,
              note: note?.value?.trim() || '',
              sessionId: window.kaiso?.sessionId?.() || null,
              url: location.href,
              userAgent: navigator.userAgent,
            }),
          });
        }
        showToast('Thank you — that reached the team');
        reset();
        document.getElementById('kmodal')?.classList.remove('open');
      } catch (err) {
        showToast('Could not send just now — try again');
      } finally {
        if (loading) loading.close();
      }
    });
  })();
