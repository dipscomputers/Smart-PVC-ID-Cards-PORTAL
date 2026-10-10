import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export interface CropBox {
  x: number; // Percentage (0 - 100)
  y: number; // Percentage (0 - 100)
  width: number; // Percentage (0 - 100)
  height: number; // Percentage (0 - 100)
}

// Standard calibrated default coordinates for Maha ID PDF (Exact edge-to-edge fit with ZERO empty space on bottom/right)
// Front: x=4.8%, y=2.0%, width=55.0%, height=24.6%
// Back: x=4.8%, y=30.6%, width=55.0%, height=24.6%
export const DEFAULT_FRONT_CROP: CropBox = {
  x: 4.8,
  y: 2.0,
  width: 55.0,
  height: 24.6,
};

export const DEFAULT_BACK_CROP: CropBox = {
  x: 4.8,
  y: 30.6,
  width: 55.0,
  height: 24.6,
};

// Calibrated crop coordinates for official "Mera Ration Card" (मेरा रेशन कार्ड)
// Front Card: Page 1, x: 7.2%, y: 26.6%, width: 85.6%, height: 46.4%
// Back Card: Page 2, x: 7.2%, y: 7.8%, width: 85.6%, height: 27.4%
export const RATION_FRONT_CROP: CropBox = {
  x: 7.2,
  y: 26.6,
  width: 85.6,
  height: 46.4,
};

export const RATION_BACK_CROP: CropBox = {
  x: 7.2,
  y: 7.8,
  width: 85.6,
  height: 27.4,
};

export const RATION_SINGLE_PAGE_BACK_CROP: CropBox = {
  x: 7.2,
  y: 52.0,
  width: 85.6,
  height: 42.0,
};

// Calibrated crop coordinates for official "ABHA Card" (National Health Authority - Ayushman Bharat Health Account)
// Single-page PDF containing Front Card (top half) and Back Card (bottom half)
export const ABHA_FRONT_CROP: CropBox = {
  x: 2.2,
  y: 2.0,
  width: 95.6,
  height: 48.2,
};

export const ABHA_BACK_CROP: CropBox = {
  x: 2.2,
  y: 52.4,
  width: 95.6,
  height: 47.0,
};

// Calibrated crop coordinates for official "Ayushman Bharat PM-JAY / MJPJAY Card" (आयुष्मान कार्ड)
// Landscape PDF: Left side Front Card, Right side Back Card
export const AYUSHMAN_FRONT_CROP: CropBox = {
  x: 12.3,
  y: 32.8,
  width: 36.3,
  height: 50.2,
};

export const AYUSHMAN_BACK_CROP: CropBox = {
  x: 51.5,
  y: 32.8,
  width: 36.3,
  height: 50.2,
};

// Calibrated crop coordinates for official "e-Shram Card" (ई-श्रम कार्ड - Ministry of Labour & Employment)
// Single-page PDF containing Front Card (top) and Back Card (bottom)
export const ESHRAM_FRONT_CROP: CropBox = {
  x: 30.6,
  y: 7.2,
  width: 38.6,
  height: 18.3,
};

export const ESHRAM_BACK_CROP: CropBox = {
  x: 30.6,
  y: 26.2,
  width: 38.6,
  height: 18.3,
};

/**
 * Renders multiple pages of a PDF file to HTML5 Canvases.
 */
export async function renderPdfPagesToCanvases(
  file: File | Blob,
  maxPages = 2,
  scale = 2.5,
  password?: string
): Promise<{ canvases: HTMLCanvasElement[]; numPages: number }> {
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    password: password || undefined,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
  });

  try {
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const pagesToRender = Math.min(numPages, maxPages);
    const canvases: HTMLCanvasElement[] = [];

    for (let pageNum = 1; pageNum <= pagesToRender; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Canvas 2D context error');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: ctx,
        viewport,
        canvas,
      } as any).promise;

      canvases.push(canvas);
    }

    return { canvases, numPages };
  } catch (err: any) {
    if (
      err?.name === 'PasswordException' ||
      err?.code === 1 ||
      err?.code === 2 ||
      err?.message?.toLowerCase().includes('password')
    ) {
      const errorObj = new Error('PASSWORD_REQUIRED');
      (errorObj as any).isPasswordRequired = true;
      (errorObj as any).isIncorrectPassword =
        err?.code === 2 || err?.message?.toLowerCase().includes('incorrect');
      throw errorObj;
    }
    throw err;
  }
}

/**
 * Renders page 1 of a PDF file to a High-Res HTML5 Canvas.
 */
export async function renderPdfFileToCanvas(
  file: File | Blob,
  scale = 2.5,
  password?: string
): Promise<HTMLCanvasElement> {
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    password: password || undefined,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
  });

  try {
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas 2D context error');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
      canvas,
    } as any).promise;

    return canvas;
  } catch (err: any) {
    if (
      err?.name === 'PasswordException' ||
      err?.code === 1 ||
      err?.code === 2 ||
      err?.message?.toLowerCase().includes('password')
    ) {
      const errorObj = new Error('PASSWORD_REQUIRED');
      (errorObj as any).isPasswordRequired = true;
      (errorObj as any).isIncorrectPassword =
        err?.code === 2 || err?.message?.toLowerCase().includes('incorrect');
      throw errorObj;
    }
    throw err;
  }
}

/**
 * Loads an uploaded image (PNG/JPG/WEBP) onto a canvas
 */
export function renderImageFileToCanvas(file: File | Blob): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return reject(new Error('Canvas 2D context error'));
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Crops a portion of the canvas according to percentage coordinates and returns a High-Res Data URL.
 */
export function cropCanvasToDataUrl(
  sourceCanvas: HTMLCanvasElement,
  crop: CropBox
): string {
  const srcW = sourceCanvas.width;
  const srcH = sourceCanvas.height;

  const cropX = Math.max(0, Math.floor((crop.x / 100) * srcW));
  const cropY = Math.max(0, Math.floor((crop.y / 100) * srcH));
  const cropW = Math.min(srcW - cropX, Math.floor((crop.width / 100) * srcW));
  const cropH = Math.min(srcH - cropY, Math.floor((crop.height / 100) * srcH));

  // Target standard CR80 PVC card size at 300 DPI (85.6 mm x 54.0 mm)
  const targetW = 1012;
  const targetH = 638;

  const destCanvas = document.createElement('canvas');
  destCanvas.width = targetW;
  destCanvas.height = targetH;
  const destCtx = destCanvas.getContext('2d');
  if (!destCtx) return '';

  destCtx.fillStyle = '#ffffff';
  destCtx.fillRect(0, 0, targetW, targetH);

  destCtx.imageSmoothingEnabled = true;
  destCtx.imageSmoothingQuality = 'high';

  destCtx.drawImage(
    sourceCanvas,
    cropX,
    cropY,
    cropW,
    cropH,
    0,
    0,
    targetW,
    targetH
  );

  // Crisp clean card cutting boundary line / border for PVC alignment
  destCtx.strokeStyle = '#0f172a';
  destCtx.lineWidth = 2.5;
  destCtx.strokeRect(1, 1, targetW - 2, targetH - 2);

  return destCanvas.toDataURL('image/jpeg', 0.98);
}
