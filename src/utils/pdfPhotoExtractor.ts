import { getPdfJs } from './pdfWorkerInit';
import { enhancePhotoToHd, DEFAULT_HD_PRESETS } from './photoHdEnhancer';

/**
 * Extracts the farmer photo from an uploaded PDF of the AgriStack / Maharashtra Farmer Registration Form.
 * Uses high-resolution rendering, embedded XObject extraction, and auto HD enhancement.
 */
export async function extractPhotoFromDocument(file: File): Promise<string | null> {
  try {
    let rawPhoto: string | null = null;
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000));
      rawPhoto = await Promise.race([extractPhotoFromPdf(file), timeout]);
    } else if (file.type.startsWith('image/')) {
      rawPhoto = await extractPhotoFromImage(file);
    }

    if (rawPhoto) {
      // Automatically apply HD Enhancement to make extracted photo crisp & vivid
      try {
        const hdPhoto = await enhancePhotoToHd(rawPhoto, DEFAULT_HD_PRESETS.auto);
        return hdPhoto || rawPhoto;
      } catch (hdErr) {
        console.warn('Auto HD enhance fallback:', hdErr);
        return rawPhoto;
      }
    }
  } catch (err) {
    console.error('Photo extraction error:', err);
  }
  return null;
}

async function extractPhotoFromPdf(file: File): Promise<string | null> {
  const pdfjsLib = await getPdfJs();
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  if (pdf.numPages < 1) return null;

  const page = await pdf.getPage(1);

  // Strategy 1: Attempt to extract embedded photo image directly from PDF objects (highest fidelity, 0% cut)
  try {
    const operatorList = await page.getOperatorList();
    const fnArray = operatorList.fnArray;
    const argsArray = operatorList.argsArray;

    for (let i = 0; i < fnArray.length; i++) {
      if (fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
        const imgName = argsArray[i][0];
        const imgObj = await new Promise<any>((resolve) => {
          page.objs.get(imgName, (obj: any) => resolve(obj));
        });

        if (imgObj && (imgObj.width || imgObj.data)) {
          const w = imgObj.width;
          const h = imgObj.height;
          const aspect = w / h;

          // Passport photo dimensions: aspect ratio ~0.6 to ~1.3, minimum 70px, not full-page banner
          if (w >= 70 && h >= 80 && aspect >= 0.55 && aspect <= 1.35 && w <= 2400) {
            const imgCanvas = document.createElement('canvas');
            imgCanvas.width = w;
            imgCanvas.height = h;
            const imgCtx = imgCanvas.getContext('2d');
            if (imgCtx) {
              if (imgObj.data) {
                const imgData = imgCtx.createImageData(w, h);
                if (imgObj.data.length === w * h * 4) {
                  imgData.data.set(imgObj.data);
                } else if (imgObj.data.length === w * h * 3) {
                  for (let p = 0, q = 0; p < imgObj.data.length; p += 3, q += 4) {
                    imgData.data[q] = imgObj.data[p];
                    imgData.data[q + 1] = imgObj.data[p + 1];
                    imgData.data[q + 2] = imgObj.data[p + 2];
                    imgData.data[q + 3] = 255;
                  }
                }
                imgCtx.putImageData(imgData, 0, 0);
              } else if (imgObj.bitmap) {
                imgCtx.drawImage(imgObj.bitmap, 0, 0);
              } else {
                imgCtx.drawImage(imgObj, 0, 0);
              }
              const passportPhoto = cropCanvasToPassportPhoto(imgCanvas, { x: 0, y: 0, w, h });
              if (passportPhoto) return passportPhoto;
            }
          }
        }
      }
    }
  } catch (embeddedErr) {
    console.warn('Direct embedded image extraction fallback:', embeddedErr);
  }

  // Strategy 2: High-Resolution Page Canvas Rendering & Bounding-Box Detection
  const scale = 3.5; // High resolution rendering for sharp face details
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: ctx,
    viewport: viewport,
    canvas: canvas,
  }).promise;

  const isLandscape = viewport.width > viewport.height;

  // Search for text anchors on Page 1: "Farmer Photograph" and "Farmer Details"
  let photoLabelX: number | null = null;
  let photoLabelY: number | null = null;

  try {
    const textContent = await page.getTextContent();
    for (const item of textContent.items as any[]) {
      if (!item.str) continue;
      const str = item.str.trim();
      if (/Farmer\s*Photograph|Photograph|छायाचित्र|फोटो/i.test(str)) {
        const pt = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
        photoLabelX = pt[0];
        photoLabelY = pt[1];
      }
    }
  } catch (textErr) {
    console.warn('Text anchor search in PDF photo extractor:', textErr);
  }

  // Determine photo search window based on orientation and text anchors
  let searchLeft: number;
  let searchRight: number;
  let searchTop: number;
  let searchBottom: number;

  if (photoLabelX !== null && photoLabelY !== null) {
    // In Maharashtra farmer registration PDFs, the label is directly below the photo frame
    const spanV = Math.floor(140 * scale);
    const spanH = Math.floor(70 * scale);
    searchTop = Math.max(0, Math.floor(photoLabelY - spanV));
    searchBottom = Math.min(canvas.height, Math.floor(photoLabelY + (15 * scale)));
    searchLeft = Math.max(0, Math.floor(photoLabelX - spanH));
    searchRight = Math.min(canvas.width, Math.floor(photoLabelX + spanH));
  } else if (isLandscape) {
    searchLeft = Math.floor(canvas.width * 0.72);
    searchRight = Math.floor(canvas.width * 0.95);
    searchTop = Math.floor(canvas.height * 0.07);
    searchBottom = Math.floor(canvas.height * 0.32);
  } else {
    searchLeft = Math.floor(canvas.width * 0.70);
    searchRight = Math.floor(canvas.width * 0.96);
    searchTop = Math.floor(canvas.height * 0.06);
    searchBottom = Math.floor(canvas.height * 0.32);
  }

  const searchW = Math.max(10, searchRight - searchLeft);
  const searchH = Math.max(10, searchBottom - searchTop);

  try {
    const imgData = ctx.getImageData(searchLeft, searchTop, searchW, searchH);
    const data = imgData.data;

    // Scan for continuous dark border lines forming the photo frame
    const darkPixelsPerRow = new Int32Array(searchH);
    const darkPixelsPerCol = new Int32Array(searchW);

    for (let y = 0; y < searchH; y++) {
      for (let x = 0; x < searchW; x++) {
        const idx = (y * searchW + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        if (r < 160 && g < 160 && b < 160) {
          darkPixelsPerRow[y]++;
          darkPixelsPerCol[x]++;
        }
      }
    }

    // 1. Find left border
    let leftBorderX = -1;
    const vertMinSpan = Math.floor(searchH * 0.25);
    for (let x = 0; x < Math.floor(searchW * 0.45); x++) {
      if (darkPixelsPerCol[x] >= vertMinSpan) {
        leftBorderX = x;
        break;
      }
    }

    // 2. Find right border
    let rightBorderX = -1;
    for (let x = searchW - 1; x > Math.floor(searchW * 0.45); x--) {
      if (darkPixelsPerCol[x] >= vertMinSpan) {
        rightBorderX = x;
        break;
      }
    }

    // 3. Find top border
    let topBorderY = -1;
    const horizMinSpan = Math.floor(searchW * 0.30);
    for (let y = 0; y < Math.floor(searchH * 0.45); y++) {
      if (darkPixelsPerRow[y] >= horizMinSpan) {
        topBorderY = y;
        break;
      }
    }

    // 4. Find bottom border
    let bottomBorderY = -1;
    for (let y = searchH - 1; y > Math.floor(searchH * 0.45); y--) {
      if (darkPixelsPerRow[y] >= horizMinSpan) {
        bottomBorderY = y;
        break;
      }
    }

    // If borders were found with good dimensions, crop cleanly inside them
    if (topBorderY !== -1 && bottomBorderY !== -1 && leftBorderX !== -1 && rightBorderX !== -1) {
      const boxW = (rightBorderX - leftBorderX) - 2;
      const boxH = (bottomBorderY - topBorderY) - 2;
      if (boxW >= 40 && boxH >= 40) {
        const boxX = searchLeft + leftBorderX + 1;
        const boxY = searchTop + topBorderY + 1;
        return cropCanvasToPassportPhoto(canvas, {
          x: boxX,
          y: boxY,
          w: boxW,
          h: boxH,
        });
      }
    }
  } catch (scanErr) {
    console.warn('Border scan error in photo extractor, falling back:', scanErr);
  }

  // Calibrated default coordinates matching government farmer registration forms
  const photoBounds = isLandscape
    ? {
        x: canvas.width * 0.77,
        y: canvas.height * 0.08,
        w: canvas.width * 0.14,
        h: canvas.height * 0.20,
      }
    : {
        x: photoLabelX !== null ? Math.max(0, photoLabelX - canvas.width * 0.08) : canvas.width * 0.72,
        y: photoLabelY !== null ? Math.max(0, photoLabelY - canvas.height * 0.22) : canvas.height * 0.07,
        w: canvas.width * 0.18,
        h: canvas.height * 0.22,
      };

  return cropCanvasToPassportPhoto(canvas, photoBounds);
}

async function extractPhotoFromImage(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        resolve(null);
        return;
      }
      const img = new Image();
      img.onload = () => {
        // If image is already a passport photo or portrait image, standardize to 600x800
        const aspect = img.width / img.height;
        if (aspect >= 0.5 && aspect <= 1.5 && img.width <= 1800) {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const standardPhoto = cropCanvasToPassportPhoto(canvas, {
              x: 0,
              y: 0,
              w: img.width,
              h: img.height,
            });
            resolve(standardPhoto || dataUrl);
            return;
          }
          resolve(dataUrl);
          return;
        }

        // Full document page scan fallback
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0);

        const photoBounds = {
          x: img.width * 0.72,
          y: img.height * 0.07,
          w: img.width * 0.20,
          h: img.height * 0.22,
        };

        const result = cropCanvasToPassportPhoto(canvas, photoBounds);
        resolve(result || dataUrl);
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

function cropCanvasToPassportPhoto(
  sourceCanvas: HTMLCanvasElement,
  bounds: { x: number; y: number; w: number; h: number }
): string | null {
  try {
    const cleanX = Math.max(0, Math.floor(bounds.x));
    const cleanY = Math.max(0, Math.floor(bounds.y));
    const cleanW = Math.min(Math.floor(bounds.w), sourceCanvas.width - cleanX);
    const cleanH = Math.min(Math.floor(bounds.h), sourceCanvas.height - cleanY);

    if (cleanW < 20 || cleanH < 20) return null;

    // High-Resolution 600x800 px 3:4 passport aspect ratio for crisp HD PVC print
    const targetW = 600;
    const targetH = 800;
    const targetCanvas = document.createElement('canvas');
    targetCanvas.width = targetW;
    targetCanvas.height = targetH;
    const targetCtx = targetCanvas.getContext('2d');
    if (!targetCtx) return null;

    targetCtx.fillStyle = '#ffffff';
    targetCtx.fillRect(0, 0, targetW, targetH);
    targetCtx.imageSmoothingEnabled = true;
    targetCtx.imageSmoothingQuality = 'high';

    const imgAspect = cleanW / cleanH;
    const frameAspect = targetW / targetH; // 0.75

    let drawW = targetW;
    let drawH = targetH;
    let drawX = 0;
    let drawY = 0;

    // If source aspect is close to passport 3:4 (0.68 to 0.85), fit perfectly edge-to-edge
    if (imgAspect >= 0.68 && imgAspect <= 0.85) {
      drawW = targetW;
      drawH = targetH;
      drawX = 0;
      drawY = 0;
    } else if (imgAspect > frameAspect) {
      // Wider image: fit height, center horizontally
      drawH = targetH;
      drawW = Math.round(targetH * imgAspect);
      drawX = Math.round((targetW - drawW) / 2);
      drawY = 0;
    } else {
      // Taller image: fit width, start from top so head/hair are never cut
      drawW = targetW;
      drawH = Math.round(targetW / imgAspect);
      drawX = 0;
      drawY = 0;
    }

    targetCtx.drawImage(
      sourceCanvas,
      cleanX,
      cleanY,
      cleanW,
      cleanH,
      drawX,
      drawY,
      drawW,
      drawH
    );

    return targetCanvas.toDataURL('image/jpeg', 0.98);
  } catch (err) {
    console.warn('Canvas cropping error:', err);
    return null;
  }
}
