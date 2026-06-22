  // ─── Audio bars: the 4 inner lines of Hexagram #1 ─────────
  // Top (line 1) and bottom (line 6) are FIXED in the SVG.
  // The four <rect class="hex-audio"> elements animate their width
  // (horizontal length) symmetrically about x=0, while y stays fixed
  // and the rect height stays fixed. So the hexagram stays vertical
  // and the inner lines visualize live audio in place.
  const audioBars = Array.from(document.querySelectorAll('.hex-audio'));

  // Per-bar state for organic motion
  const barState = audioBars.map(() => ({
    phase: Math.random() * Math.PI * 2,
    speed: 1.6 + Math.random() * 1.6,
    skew:  0.85 + Math.random() * 0.3,   // multiplier
  }));

  const FULL_W = 120;          // resting length
  const MAX_W  = 132;          // max length when pulsing strongly
  const MIN_W  = 22;           // min length when "low signal"
  const REST_AMPLITUDE = 0;    // dormant: lines stay full

  let active = false;
  let t0 = performance.now();

  function tick(now) {
    const t = (now - t0) / 1000;

    if (active) {
      // Layered envelopes — a slow speech-like rise/fall + faster syllable cadence
      const macro  = 0.55 + 0.45 * Math.sin(t * 0.7);
      const syll   = 0.5  + 0.5  * Math.sin(t * 1.6 + 0.6);

      audioBars.forEach((bar, i) => {
        const s = barState[i];
        const wave =
          0.55 * Math.sin(t * s.speed + s.phase) +
          0.30 * Math.sin(t * s.speed * 2.3 + s.phase * 1.5) +
          0.15 * Math.sin(t * s.speed * 4.1 + s.phase * 0.7);
        const jitter = (Math.random() - 0.5) * 0.10;
        // factor: 0 = collapsed, 1 = full length, can briefly exceed for emphasis
        const factor =
          (0.45 + 0.55 * (0.5 + 0.5 * wave) * macro * (0.6 + 0.4 * syll) + jitter)
          * s.skew;
        const clamped = Math.max(0.18, Math.min(1.12, factor));
        const w = MIN_W + (MAX_W - MIN_W) * clamped;
        // center symmetrically about x=0
        bar.setAttribute('x', (-w / 2).toFixed(2));
        bar.setAttribute('width', w.toFixed(2));
      });
    } else {
      // dormant: full-length solid yang lines (resting)
      audioBars.forEach(bar => {
        bar.setAttribute('x', (-FULL_W / 2).toFixed(2));
        bar.setAttribute('width', FULL_W.toFixed(2));
      });
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
