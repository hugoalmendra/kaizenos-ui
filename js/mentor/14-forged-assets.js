  // ─── Forged assets — shared print + library open wiring ────────
  (function forgedAssets() {
    const FORGE_PANEL = { exec: 'exec', landing: 'landing', deck: 'deck' };

    document.querySelectorAll('.lib-item[data-output]').forEach((item) => {
      const btn = item.querySelector('.kbtn');
      if (!btn) return;
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        const panel = FORGE_PANEL[item.dataset.output];
        if (panel) {
          window.dispatchEvent(new CustomEvent('kaiso:open-forge', { detail: panel }));
        }
      });
    });

    // Popup print → Save as PDF (shared by exec, landing, deck).
    window.kaisoPrint = function (docEl, docTitle, printCSS) {
      if (!docEl) return false;
      let allCSS = '';
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules || []) allCSS += rule.cssText + '\n';
        } catch (e) { /* cross-origin — skip */ }
      }
      const safeTitle = String(docTitle).replace(/[<>&"]/g, '');
      const popupHTML = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">'
        + '<title>' + safeTitle + '</title>'
        + '<style>' + allCSS + (printCSS || '') + '</style></head><body>'
        + docEl.outerHTML
        + '<scr' + 'ipt>'
        + 'window.addEventListener("load",function(){'
        + 'var go=function(){setTimeout(function(){window.print();},250);};'
        + 'if(document.fonts&&document.fonts.ready){document.fonts.ready.then(go);}else{setTimeout(go,500);}'
        + '});'
        + 'window.addEventListener("afterprint",function(){setTimeout(function(){window.close();},300);});'
        + '</scr' + 'ipt></body></html>';
      const popup = window.open('', '_blank', 'width=900,height=1200,resizable=yes,scrollbars=yes');
      if (!popup) return false;
      popup.document.open();
      popup.document.write(popupHTML);
      popup.document.close();
      popup.focus();
      return true;
    };

    const BASE_PRINT = `
      html, body { height: auto !important; overflow: visible !important;
        background: #ffffff !important; margin: 0; padding: 0;
        -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      body { display: block !important; padding: 28px;
        font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
      @media print { @page { size: A4; margin: 14mm; } body { padding: 0; } }
    `;

    window.kaisoPrintStyles = {
      exec: BASE_PRINT + `
        .exec-doc { background: #fff !important; border: none !important; max-width: 860px; margin: 0 auto;
          color: #1a1a1a !important; }
        .exec-banner-mark, .exec-eyebrow, .exec-sec-title, .es-val, .exec-foot-co { color: #8a6a1c !important; }
        .exec-co { color: #1a1a1a !important; }
        .exec-sec-body, .exec-tag { color: #2a2a2a !important; }
        .exec-stat { background: #faf7ed !important; border: 0.5px solid #d8c98f !important; }
        .exec-sec, .exec-band, .exec-foot, .exec-banner { break-inside: avoid; page-break-inside: avoid; }
      `,
      landing: BASE_PRINT + `
        .land-doc { background: #fff !important; border: none !important; max-width: 720px; margin: 0 auto;
          color: #1a1a1a !important; }
        .land-hero { background: #faf7ed !important; border-bottom: 1px solid #d8c98f !important; }
        .land-logo, .land-lbl { color: #8a6a1c !important; }
        .land-hero h1 { color: #111 !important; }
        .land-tag, .land-body { color: #333 !important; }
        .land-cta { color: #140e04 !important; }
        .land-feat, .land-stat { border: 0.5px solid #d8c98f !important; background: #faf7ed !important; }
        .land-feat b, .land-stat b { color: #8a6a1c !important; }
        .land-block { border-color: #e8dfc8 !important; }
      `,
      deck: BASE_PRINT + `
        .deck-doc { max-width: 720px; margin: 0 auto; gap: 0 !important; }
        .deck-slide { aspect-ratio: auto !important; min-height: 0 !important; height: auto !important;
          background: #faf7ed !important; border: 0.5px solid #d8c98f !important;
          color: #1a1a1a !important; margin-bottom: 16px;
          break-inside: avoid; page-break-inside: avoid; page-break-after: always; }
        .deck-title { color: #111 !important; }
        .deck-body, .deck-sub { color: #333 !important; }
        .deck-eyebrow, .deck-glyph, .deck-cell b { color: #8a6a1c !important; }
        .deck-cell { border-color: #d8c98f !important; background: #fff !important; }
      `,
    };
  })();
