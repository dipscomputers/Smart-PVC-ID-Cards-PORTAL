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

  const htmlToImageOptions = {
    pixelRatio,
    backgroundColor,
    cacheBust: true,
    skipFonts: true,
    fontEmbedCSS: '',
    filter: (node: HTMLElement) => {
      // Filter out external cross-origin link/style nodes if cloned
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

  try {
    const canvas = await htmlToImage.toCanvas(element, htmlToImageOptions);
    return canvas;
  } catch (error) {
    console.warn('htmlToImage.toCanvas initial attempt failed, trying toPng fallback:', error);
    const dataUrl = await htmlToImage.toPng(element, htmlToImageOptions);

    return await new Promise<HTMLCanvasElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          resolve(canvas);
        } else {
          reject(new Error('Failed to obtain 2D canvas rendering context'));
        }
      };
      img.onerror = (e) => reject(new Error('Failed to load rasterized image onto canvas: ' + String(e)));
      img.src = dataUrl;
    });
  }
}
