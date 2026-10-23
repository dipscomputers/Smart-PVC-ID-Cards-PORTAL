import * as htmlToImage from 'html-to-image';

export interface SafeHtml2CanvasOptions {
  scale?: number;
  backgroundColor?: string;
  imageTimeout?: number;
  useCORS?: boolean;
  allowTaint?: boolean;
  logging?: boolean;
  onclone?: (doc: Document, el: HTMLElement) => void;
  [key: string]: any;
}

/**
 * High-performance, modern DOM-to-Canvas rasterizer.
 * Uses native SVG foreignObject & browser rendering engine via html-to-image.
 * Fully supports modern CSS (OKLCH, CSS color 4/5, gradients, sub-pixel text, flex/grid)
 * without any "unsupported color function oklch" or "Illegal invocation" parser errors.
 */
export async function safeHtml2Canvas(
  element: HTMLElement,
  options?: SafeHtml2CanvasOptions
): Promise<HTMLCanvasElement> {
  const pixelRatio = options?.scale || 2;
  const backgroundColor = options?.backgroundColor || '#ffffff';

  // Find print portal parent if element is inside an offscreen portal
  const parentPortal = (element.closest('#farmer-print-portal-root') ||
    element.closest('#app-print-portal') ||
    element.parentElement) as HTMLElement | null;

  const originalElementCss = element.style.cssText;
  const originalParentCss = parentPortal ? parentPortal.style.cssText : '';

  try {
    // If inside print portal, temporarily position in view at (0, 0) with zIndex 99999
    if (parentPortal && (parentPortal.id === 'farmer-print-portal-root' || parentPortal.id === 'app-print-portal')) {
      parentPortal.style.position = 'fixed';
      parentPortal.style.left = '0px';
      parentPortal.style.top = '0px';
      parentPortal.style.opacity = '1';
      parentPortal.style.visibility = 'visible';
      parentPortal.style.display = 'block';
      parentPortal.style.zIndex = '99999';
    }

    element.style.visibility = 'visible';
    element.style.display = 'block';
    element.style.opacity = '1';

    const htmlToImageOptions = {
      pixelRatio,
      backgroundColor,
      cacheBust: true,
      skipFonts: false,
      fontEmbedCSS: '',
      filter: (node: HTMLElement) => {
        if (node.tagName === 'LINK' && (node as HTMLLinkElement).rel === 'stylesheet') {
          const href = (node as HTMLLinkElement).href;
          if (href && !href.startsWith(window.location.origin)) {
            return false;
          }
        }
        return true;
      },
      ...options,
    };

    let canvas: HTMLCanvasElement;
    try {
      canvas = await htmlToImage.toCanvas(element, htmlToImageOptions);
    } catch (firstErr) {
      console.warn('htmlToImage.toCanvas with embedded fonts failed, retrying with skipFonts fallback:', firstErr);
      try {
        canvas = await htmlToImage.toCanvas(element, { ...htmlToImageOptions, skipFonts: true });
      } catch (secondErr) {
        console.warn('htmlToImage.toCanvas failed, trying toPng fallback:', secondErr);
        const dataUrl = await htmlToImage.toPng(element, { ...htmlToImageOptions, skipFonts: true });
        canvas = await new Promise<HTMLCanvasElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const c = document.createElement('canvas');
            c.width = img.naturalWidth || img.width;
            c.height = img.naturalHeight || img.height;
            const ctx = c.getContext('2d');
            if (ctx) {
              ctx.fillStyle = backgroundColor;
              ctx.fillRect(0, 0, c.width, c.height);
              ctx.drawImage(img, 0, 0);
              resolve(c);
            } else {
              reject(new Error('Failed to obtain 2D canvas context'));
            }
          };
          img.onerror = (e) => reject(new Error('Failed to load rasterized image onto canvas: ' + String(e)));
          img.src = dataUrl;
        });
      }
    }

    return canvas;
  } finally {
    // Restore original portal and element styles
    if (parentPortal && (parentPortal.id === 'farmer-print-portal-root' || parentPortal.id === 'app-print-portal')) {
      parentPortal.style.cssText = originalParentCss;
    }
    element.style.cssText = originalElementCss;
  }
}
