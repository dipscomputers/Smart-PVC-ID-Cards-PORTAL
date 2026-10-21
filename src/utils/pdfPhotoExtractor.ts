import { getPdfJs } from './pdfWorkerInit';
import { enhancePhotoToHd, DEFAULT_HD_PRESETS } from './photoHdEnhancer';

/**
 * Extracts the farmer photo from an uploaded PDF of the AgriStack / Maharashtra Farmer Registration Form.
 * Uses high-resolution rendering, embedded XObject extraction, text-header stripping, and auto HD enhancement.
 */
export async function extractPhotoFromDocument(file: File): Promise<string | null> {
  try {
    let rawPhoto: string | null = null;
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 7000));
      rawPhoto = await Promise.race([extractPhotoFromPdf(file), timeout]);
    } else if (file.type.startsWith('image/')) {
      rawPhoto = await extractPhotoFromImage(file);
    }

    if (rawPhoto) {
      // 1. Strip any "Farmer Photograph" / "Photograph" text headers captured at top
      const noTextHeader = await stripTopTextAndTrim(rawPhoto);
      const cleanPhoto = noTextHeader || rawPhoto;

      // 2. Automatically apply HD Enhancement to make extracted photo crisp & vivid
      try {
        const hdPhoto = await enhancePhotoToHd(cleanPhoto, DEFAULT_HD_PRESETS.auto);
        return hdPhoto || cleanPhoto;
      } catch (hdErr) {
        console.warn('Auto HD enhance fallback:', hdErr);
        return cleanPhoto;
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

  // High-Resolution Page Canvas Rendering
  const scale = 3.5; // High resolution rendering for sharp face details
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  // Render Page 1 to canvas first so PDF.js fully decodes operators and image objects
  await page.render({
    canvasContext: ctx,
    viewport: viewport,
    canvas: canvas,
  }).promise;

  // Strategy 1: Direct Embedded Image XObject Extraction (Pure Raw Photo)
  try {
    const operatorList = await page.getOperatorList();
    const fnArray = operatorList.fnArray;
    const argsArray = operatorList.argsArray;

    const candidates: { canvas: HTMLCanvasElement; aspect: number; w: number; h: number }[] = [];

    for (let i = 0; i < fnArray.length; i++) {
      if (fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
        const imgName = argsArray[i][0];
        const imgObj = await new Promise<any>((resolve) => {
          page.objs.get(imgName, (obj: any) => resolve(obj));
        });

        if (imgObj) {
          const w = imgObj.width || imgObj.naturalWidth || (imgObj.bitmap && imgObj.bitmap.width) || 0;
          const h = imgObj.height || imgObj.naturalHeight || (imgObj.bitmap && imgObj.bitmap.height) || 0;

          if (w >= 40 && h >= 50) {
            const aspect = w / h;

            // Strictly portrait: width/height between 0.50 and 0.95 (excludes square QR codes & horizontal banners)
            if (aspect >= 0.50 && aspect <= 0.95 && w <= 2400) {
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

                candidates.push({ canvas: imgCanvas, aspect, w, h });
              }
            }
          }
        }
      }
    }

    if (candidates.length > 0) {
      // Pick the image closest to standard passport 3:4 aspect ratio (0.75)
      candidates.sort((a, b) => Math.abs(a.aspect - 0.75) - Math.abs(b.aspect - 0.75));
      const best = candidates[0];
      const passportPhoto = cropCanvasToPassportPhoto(best.canvas, { x: 0, y: 0, w: best.w, h: best.h });
      if (passportPhoto) return passportPhoto;
    }
  } catch (embeddedErr) {
    console.warn('Direct embedded image extraction fallback:', embeddedErr);
  }

  // Strategy 2: Strict Photo Window Scan (Constrained strictly above 'Farmer Details' table)
  // Search for text anchor "Farmer Photograph" on Page 1
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

  // Strict Bounds matching Page 1 of Maharashtra Farmer Registration Form:
  // Starts strictly below "Farmer Photograph" text header at Y = 8.2% and stops ABOVE "Farmer Details" table at Y = 21.8%!
  const searchLeft = Math.floor(canvas.width * 0.785);
  const searchRight = Math.floor(canvas.width * 0.965);
  const searchTop = photoLabelY !== null 
    ? Math.max(Math.floor(canvas.height * 0.080), Math.floor(photoLabelY + (3 * scale)))
    : Math.floor(canvas.height * 0.082);
  // HARD CAP on searchBottom: Never exceed Y = 21.8% of page height (prevents capturing 'Farmer Details' table rows)
  const searchBottom = Math.min(Math.floor(canvas.height * 0.218), Math.floor(searchTop + (canvas.height * 0.138)));

  const searchW = Math.max(10, searchRight - searchLeft);
  const searchH = Math.max(10, searchBottom - searchTop);

  try {
    const imgData = ctx.getImageData(searchLeft, searchTop, searchW, searchH);
    const data = imgData.data;

    let minX = searchW, maxX = 0, minY = searchH, maxY = 0;
    let foundPixels = 0;

    for (let y = 0; y < searchH; y++) {
      for (let x = 0; x < searchW; x++) {
        const idx = (y * searchW + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Non-white pixel check (< 240)
        if (r < 240 || g < 240 || b < 240) {
          foundPixels++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (foundPixels > 100 && maxX > minX + 15 && maxY > minY + 15) {
      const cropX = searchLeft + minX;
      const cropY = searchTop + minY;
      const cropW = maxX - minX;
      const cropH = maxY - minY;

      const result = cropCanvasToPassportPhoto(canvas, {
        x: cropX,
        y: cropY,
        w: cropW,
        h: cropH,
      });
      if (result) return result;
    }
  } catch (scanErr) {
    console.warn('Dynamic canvas scan fallback:', scanErr);
  }

  // Final Calibrated Fallback strictly inside Page 1 photo frame
  const fallbackBounds = {
    x: Math.floor(canvas.width * 0.802),
    y: Math.floor(canvas.height * 0.082),
    w: Math.floor(canvas.width * 0.142),
    h: Math.floor(canvas.height * 0.132),
  };

  return cropCanvasToPassportPhoto(canvas, fallbackBounds);
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
          x: Math.floor(img.width * 0.802),
          y: Math.floor(img.height * 0.082),
          w: Math.floor(img.width * 0.142),
          h: Math.floor(img.height * 0.132),
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

    if (imgAspect >= 0.68 && imgAspect <= 0.85) {
      drawW = targetW;
      drawH = targetH;
      drawX = 0;
      drawY = -42;
    } else if (imgAspect > frameAspect) {
      drawH = targetH;
      drawW = Math.round(targetH * imgAspect);
      drawX = Math.round((targetW - drawW) / 2);
      drawY = -42;
    } else {
      drawW = targetW;
      drawH = Math.round(targetW / imgAspect);
      drawX = 0;
      drawY = Math.round((targetH - drawH) / 2) - 42;
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

/**
 * Strips any captured text headers (like "Farmer Photograph" or "Photograph") 
 * from the top 35% of an extracted photo image and trims outer margins.
 */
export async function stripTopTextAndTrim(dataUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(dataUrl);

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        const d = imgData.data;

        // Scan top 35% for horizontal text lines (like "Farmer Photograph" or "hotograph")
        const scanH = Math.floor(img.height * 0.35);
        let textCutoffY = 0;
        let inTextBand = false;
        let textBandEnd = 0;

        for (let y = 0; y < scanH; y++) {
          let darkCount = 0;
          for (let x = 0; x < img.width; x++) {
            const idx = (y * img.width + x) * 4;
            const r = d[idx];
            const g = d[idx + 1];
            const b = d[idx + 2];
            if (r < 130 && g < 130 && b < 130) {
              darkCount++;
            }
          }

          const textRatio = darkCount / img.width;
          if (textRatio > 0.04 && textRatio < 0.65) {
            inTextBand = true;
            textBandEnd = y;
          } else if (inTextBand && textRatio <= 0.04) {
            textCutoffY = textBandEnd + 4;
            break;
          }
        }

        let startY = textCutoffY;
        let minX = img.width, maxX = 0, minY = img.height, maxY = 0;

        for (let y = startY; y < img.height; y++) {
          for (let x = 0; x < img.width; x++) {
            const idx = (y * img.width + x) * 4;
            const r = d[idx];
            const g = d[idx + 1];
            const b = d[idx + 2];

            const isWhite = r > 240 && g > 240 && b > 240;
            const isEdgeBorder = (y < img.height * 0.03 || y > img.height * 0.97 || x < img.width * 0.03 || x > img.width * 0.97) && (r < 30 && g < 30 && b < 30);

            if (!isWhite && !isEdgeBorder) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        const cropX = minX < maxX ? minX : 0;
        const cropY = minY < maxY ? minY : startY;
        const cropW = maxX > minX ? (maxX - minX) : img.width;
        const cropH = maxY > minY ? (maxY - minY) : (img.height - cropY);

        if (cropW > 20 && cropH > 20) {
          const cropped = cropCanvasToPassportPhoto(canvas, {
            x: cropX,
            y: cropY,
            w: cropW,
            h: cropH,
          });
          resolve(cropped || dataUrl);
        } else {
          resolve(dataUrl);
        }
      } catch (err) {
        console.warn('stripTopTextAndTrim error:', err);
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Trims surrounding white, gray, or dark border lines from an image data URL
 */
export async function autoTrimMargins(dataUrl: string): Promise<string | null> {
  return stripTopTextAndTrim(dataUrl);
}
