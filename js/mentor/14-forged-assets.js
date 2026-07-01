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

    // Popup print → Save as PDF (exec + deck).
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

    // Deploy-ready landing page — standalone HTML download.
    const LANDING_EXPORT_CSS = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; }
      body {
        font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        color: #1a1a1a; background: #ffffff; line-height: 1.5; -webkit-font-smoothing: antialiased;
      }
      .land-doc { max-width: 760px; margin: 0 auto; }
      .land-hero {
        text-align: center; padding: 56px 24px 48px;
        background: linear-gradient(180deg, #faf7ed 0%, #ffffff 100%);
        border-bottom: 1px solid #e8dfc8;
      }
      .land-logo {
        display: inline-block; font-size: 12px; letter-spacing: 0.28em; text-transform: uppercase;
        color: #8a6a1c; font-weight: 600; margin-bottom: 16px;
      }
      .land-hero h1 { font-size: clamp(28px, 5vw, 40px); font-weight: 700; color: #111; margin: 0 0 12px; line-height: 1.15; }
      .land-tag { font-size: 17px; line-height: 1.55; color: #444; max-width: 520px; margin: 0 auto 28px; }
      .land-cta {
        display: inline-block; border-radius: 999px; padding: 14px 28px;
        font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-decoration: none;
        color: #140e04;
        background: linear-gradient(135deg, #e8c870, #c8a84e 60%, #8a7434);
        box-shadow: 0 8px 24px rgba(200, 168, 78, 0.35);
      }
      .land-cta:hover { filter: brightness(1.06); }
      .land-block { padding: 40px 24px; border-bottom: 1px solid #eee; }
      .land-lbl {
        font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase;
        color: #8a6a1c; font-weight: 600; margin: 0 0 12px;
      }
      .land-body { font-size: 16px; line-height: 1.65; color: #333; }
      .land-feats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 8px; }
      .land-feat {
        border: 1px solid #e8dfc8; border-radius: 14px; padding: 18px; background: #faf7ed;
      }
      .land-feat b { display: block; font-size: 14px; color: #111; margin-bottom: 8px; }
      .land-feat span { font-size: 14px; line-height: 1.55; color: #555; }
      .land-stats { display: flex; gap: 12px; flex-wrap: wrap; }
      .land-stat {
        flex: 1; min-width: 120px; text-align: center; padding: 18px 12px;
        border: 1px solid #e8dfc8; border-radius: 14px; background: #faf7ed;
      }
      .land-stat b { display: block; font-size: 26px; font-weight: 700; color: #8a6a1c; margin-bottom: 4px; }
      .land-stat span { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: #666; }
      .land-foot { padding: 28px 24px; text-align: center; font-size: 13px; color: #888; }
      @media (max-width: 640px) {
        .land-feats { grid-template-columns: 1fr; }
        .land-hero { padding: 40px 20px 36px; }
      }
    `;

    window.kaisoExportLandingCode = function () {
      const doc = document.getElementById('landingPrintable');
      if (!doc) return false;

      const logo = doc.querySelector('.land-logo')?.textContent?.trim() || 'venture';
      const safeName = logo.replace(/[^a-zA-Z0-9가-힣一-龯_-]/g, '_').slice(0, 30);
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = 'kaiso_landing_' + safeName + '_' + dateStr + '.html';

      // Turn preview CTA span into a real link in the export.
      let bodyHtml = doc.innerHTML.replace(
        /<span class="land-cta">([^<]*)<\/span>/,
        '<a class="land-cta" href="#signup">$1</a>'
      );

      const pageTitle = logo.replace(/[<>&"]/g, '');
      const standaloneHTML = '<!DOCTYPE html>\n<html lang="en">\n<head>\n'
        + '<meta charset="utf-8">\n'
        + '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        + '<title>' + pageTitle + ' — Landing Page</title>\n'
        + '<meta name="description" content="' + (doc.querySelector('.land-tag')?.textContent?.trim() || '').replace(/"/g, '&quot;') + '">\n'
        + '<style>' + LANDING_EXPORT_CSS + '</style>\n'
        + '</head>\n<body>\n<main class="land-doc">\n'
        + bodyHtml
        + '\n</main>\n<!-- Forged with Kaiso -->\n</body>\n</html>';

      const blob = new Blob([standaloneHTML], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    };
  })();
