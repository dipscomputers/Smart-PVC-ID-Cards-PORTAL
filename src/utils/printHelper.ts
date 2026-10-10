/**
 * Robust print utility for standard PVC cards and forms.
 * Mounts a top-level print portal directly on document.body to ensure
 * zero blank-page issues, independent of parent DOM tree styles or overflow properties.
 */
export interface PrintComponentOptions {
  mode?: 'a4' | 'pvc-card' | 'thermal';
  cardWidthMm?: number;
  cardHeightMm?: number;
  [key: string]: any;
}

export function printComponent(
  elementId: string, 
  pageTitle?: string, 
  options?: PrintComponentOptions
): Promise<boolean> {
  return new Promise((resolve) => {
    // If running in an iframe (e.g. AI Studio development preview),
    // calling window.print() blocks the parent window message channel and causes
    // "Window message 'chrome: call method' timed out".
    // We safely resolve false immediately so the caller performs direct PDF download.
    const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
    if (isInIframe) {
      resolve(false);
      return;
    }

    const targetEl = document.getElementById(elementId);
    if (!targetEl) {
      console.warn(`Print target #${elementId} not found.`);
      resolve(false);
      return;
    }

    const originalTitle = document.title;
    if (pageTitle) {
      document.title = pageTitle;
    }

    // 1. Remove any leftover print portal
    document.getElementById('app-print-portal')?.remove();

    // 2. Create top-level print portal directly in document.body
    const printPortal = document.createElement('div');
    printPortal.id = 'app-print-portal';
    printPortal.style.display = 'none'; // NEVER visible on screen
    document.body.appendChild(printPortal);

    // 3. Clone the target element's content into the print portal
    printPortal.innerHTML = targetEl.innerHTML;
    // Strip 'hidden' class so the cloned element is ready for print
    printPortal.className = targetEl.className.replace(/\bhidden\b/g, '').trim();
    if (targetEl.style.cssText) {
      printPortal.style.cssText = targetEl.style.cssText;
    }

    // 4. Inject print isolation styles that hide everything else and display ONLY the print portal
    const styleEl = document.createElement('style');
    styleEl.id = 'direct-print-isolation-style';
    styleEl.innerHTML = `
      #app-print-portal {
        display: none !important;
      }
      @media print {
        @page {
          size: A4 portrait;
          margin: 0mm !important;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          width: 210mm !important;
          height: 297mm !important;
          min-height: 297mm !important;
          overflow: visible !important;
        }
        /* Hide all regular app nodes */
        body > *:not(#app-print-portal) {
          display: none !important;
          visibility: hidden !important;
        }
        /* Show the isolated top-level print portal */
        #app-print-portal {
          display: block !important;
          visibility: visible !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 210mm !important;
          height: 297mm !important;
          min-height: 297mm !important;
          background: #ffffff !important;
          margin: 0 !important;
          padding: 0 !important;
          box-sizing: border-box !important;
          z-index: 999999 !important;
          overflow: visible !important;
        }
        #app-print-portal:not(.pocra-print-sheet):not(.swayam-a4-sheet):not(.farmer-id-a4-sheet):not(.a4-print-sheet) {
          margin: 0 !important;
          padding: 0 !important;
        }
        #app-print-portal * {
          visibility: visible !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        #printable-application,
        #printable-application-view {
          display: block !important;
          visibility: visible !important;
          width: 210mm !important;
          margin: 0 auto !important;
          background: #ffffff !important;
          box-sizing: border-box !important;
        }
        .a4-print-sheet {
          width: 210mm !important;
          height: 297mm !important;
          min-height: 297mm !important;
          margin: 0 auto !important;
          background: #ffffff !important;
          box-sizing: border-box !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: flex-start !important;
        }
        /* Specific 10mm top margin spacer for Farmer ID Card A4 print sheet */
        .a4-top-spacer-10mm {
          width: 100% !important;
          height: 10mm !important;
          min-height: 10mm !important;
          max-height: 10mm !important;
          flex-shrink: 0 !important;
          display: block !important;
        }
        #app-print-portal.farmer-id-a4-sheet,
        .farmer-id-a4-sheet {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: flex-start !important;
          height: 297mm !important;
          min-height: 297mm !important;
          max-height: 297mm !important;
          box-sizing: border-box !important;
        }
        #app-print-portal.farmer-id-a4-sheet .a4-cards-row,
        .farmer-id-a4-sheet .a4-cards-row {
          align-items: flex-start !important;
          justify-content: center !important;
        }
        /* Multi-Farmer A4 5-PVC Sheet Layout */
        #app-print-portal.multi-farmer-a4-sheet,
        .multi-farmer-a4-sheet {
          width: 210mm !important;
          height: 297mm !important;
          min-height: 297mm !important;
          max-height: 297mm !important;
          padding-top: 6mm !important;
          padding-bottom: 0mm !important;
          margin: 0 auto !important;
          background: #ffffff !important;
          box-sizing: border-box !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: flex-start !important;
          overflow: hidden !important;
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        .a4-sheet-top-header {
          width: 100% !important;
          display: flex !important;
          justify-content: flex-end !important;
          padding-right: 14mm !important;
          padding-bottom: 2.5mm !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          color: #64748b !important;
          letter-spacing: 0.02em !important;
          box-sizing: border-box !important;
        }
        .a4-multi-page {
          padding-top: 10mm !important;
        }
        .a4-cards-row {
          display: flex !important;
          flex-direction: row !important;
          align-items: flex-start !important;
          justify-content: center !important;
          gap: 2mm !important;
          width: 100% !important;
        }
        .a4-cards-grid {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: flex-start !important;
          gap: 2.5mm !important;
          width: 100% !important;
        }
        .card-scaled-box {
          width: 85.6mm !important;
          height: 54.0mm !important;
          min-width: 85.6mm !important;
          min-height: 54.0mm !important;
          max-width: 85.6mm !important;
          max-height: 54.0mm !important;
          overflow: hidden !important;
          position: relative !important;
          border-radius: 3.2mm !important;
          border: 0.3mm solid #1e5631 !important;
          box-sizing: border-box !important;
          background-color: #ffffff !important;
        }
        .card-scaled-box img {
          width: 100% !important;
          height: 100% !important;
          object-fit: fill !important;
          display: block !important;
        }
        #app-print-portal.pocra-print-sheet,
        #app-print-portal .pocra-print-sheet,
        .pocra-print-sheet {
          width: 210mm !important;
          height: 297mm !important;
          min-height: 297mm !important;
          max-height: 297mm !important;
          padding: 10mm 20mm 10mm 20mm !important;
          margin: 0 auto !important;
          background: #ffffff !important;
          box-sizing: border-box !important;
          font-family: 'Noto Sans Devanagari', 'Yantramanav', 'Mukta', 'Mangal', 'Arial Unicode MS', sans-serif !important;
          font-size: 15.5px !important;
          line-height: 1.9 !important;
          color: #000000 !important;
          overflow: hidden !important;
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        #app-print-portal.pocra-print-sheet *,
        .pocra-print-sheet * {
          box-sizing: border-box !important;
        }
        #app-print-portal.swayam-a4-sheet,
        #app-print-portal .swayam-a4-sheet,
        .swayam-a4-sheet,
        #app-print-portal.swayam-print-sheet,
        #app-print-portal .swayam-print-sheet,
        .swayam-print-sheet {
          width: 210mm !important;
          height: 297mm !important;
          min-height: 297mm !important;
          max-height: 297mm !important;
          padding: 4.5mm 6.5mm !important;
          margin: 0 auto !important;
          background: #ffffff !important;
          box-sizing: border-box !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          font-family: 'Noto Sans Devanagari', 'Yantramanav', 'Mukta', 'Mangal', 'Arial Unicode MS', sans-serif !important;
          color: #000000 !important;
          overflow: hidden !important;
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        .swayam-form-card {
          border: 2px solid #0284c7 !important;
          border-radius: 12px !important;
          background: #ffffff !important;
          box-sizing: border-box !important;
          height: 141.5mm !important;
          min-height: 141.5mm !important;
          max-height: 141.5mm !important;
          flex: 0 0 141.5mm !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          overflow: hidden !important;
        }
        .swayam-divider {
          width: 100% !important;
          margin: 1.5mm 0 !important;
          border-bottom: 3px solid #16813d !important;
          flex-shrink: 0 !important;
        }
      }
    `;
    document.head.appendChild(styleEl);

    let isCleanedUp = false;
    const cleanup = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      try {
        styleEl.remove();
        printPortal?.remove();
        document.getElementById('app-print-portal')?.remove();
      } catch (_) {}
      document.title = originalTitle;
      resolve(true);
    };

    window.addEventListener('afterprint', cleanup, { once: true });
    // Safety fallback: only cleanup style after 60s if afterprint didn't trigger
    setTimeout(cleanup, 60000);

    // 4. Trigger print in top-level window
    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.error('Print trigger error:', err);
        cleanup();
        resolve(false);
      }
    }, 100);
  });
}

/**
 * Print official full application form
 */
export function printApplicationForm(elementId = 'printable-application-view'): Promise<boolean> {
  return printComponent(elementId, 'Farmer_Registration_Application_Form');
}
