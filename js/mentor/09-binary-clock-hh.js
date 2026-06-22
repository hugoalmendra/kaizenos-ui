  // ─── Binary clock (HH:MM:SS as binary dots) ─────────────────
  (function binaryClock() {
    const root = document.getElementById('binaryClock');
    if (!root) return;
    // Build 6 columns (H tens, H ones, M tens, M ones, S tens, S ones)
    // with separators between pairs.
    // Bits per column: tens cols use 3 bits (0-5), ones cols use 4 bits (0-9).
    const layout = [
      { bits: 3, sepAfter: false }, // H tens (0-2)
      { bits: 4, sepAfter: true  }, // H ones
      { bits: 3, sepAfter: false }, // M tens
      { bits: 4, sepAfter: true  }, // M ones
      { bits: 3, sepAfter: false }, // S tens
      { bits: 4, sepAfter: false }, // S ones
    ];
    const cols = [];
    layout.forEach((l, idx) => {
      const col = document.createElement('div');
      col.className = 'col';
      const bits = [];
      for (let i = 0; i < l.bits; i++) {
        const b = document.createElement('div');
        b.className = 'bit';
        col.appendChild(b);
        bits.push(b);
      }
      cols.push(bits);
      root.appendChild(col);
      if (l.sepAfter) {
        const sep = document.createElement('div');
        sep.className = 'sep';
        root.appendChild(sep);
      }
    });

    function setCol(bits, value) {
      for (let i = 0; i < bits.length; i++) {
        bits[i].classList.toggle('on', !!((value >> i) & 1));
      }
    }
    function tick() {
      const d = new Date();
      const h = d.getHours();
      const m = d.getMinutes();
      const s = d.getSeconds();
      setCol(cols[0], Math.floor(h / 10));
      setCol(cols[1], h % 10);
      setCol(cols[2], Math.floor(m / 10));
      setCol(cols[3], m % 10);
      setCol(cols[4], Math.floor(s / 10));
      setCol(cols[5], s % 10);
    }
    tick();
    setInterval(tick, 1000);
  })();
