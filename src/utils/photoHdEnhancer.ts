/**
 * High-Definition Passport Photo Enhancer & Upscaler
 * Safe GPU-accelerated Canvas Image Processing:
 * - High-DPI Upscaling (600x800 crisp passport)
 * - Dynamic Range & Contrast Optimization (Removes PDF gray haze/fog)
 * - Natural Skin Vibrance & Color Balance without pixel corruption
 */

export interface HdEnhanceOptions {
  sharpen?: number;       // 0 to 100
  contrast?: number;      // -50 to 50
  brightness?: number;    // -50 to 50
  saturation?: number;    // -50 to 50
  denoise?: boolean;
  targetWidth?: number;   // Default: 600
  targetHeight?: number;  // Default: 800
}

export const DEFAULT_HD_PRESETS: Record<string, HdEnhanceOptions> = {
  auto: {
    contrast: 12,
    brightness: 4,
    saturation: 10,
  },
  ultraSharp: {
    contrast: 18,
    brightness: 6,
    saturation: 12,
  },
  studio: {
    contrast: 15,
    brightness: 8,
    saturation: 15,
  },
  cleanDoc: {
    contrast: 10,
    brightness: 5,
    saturation: 5,
  },
};

/**
 * Enhances a passport photo URL to high definition safely without pixel artifacts.
 */
export async function enhancePhotoToHd(
  imageUrl: string,
  options: HdEnhanceOptions = DEFAULT_HD_PRESETS.auto
): Promise<string> {
  const {
    contrast = 12,
    brightness = 4,
    saturation = 10,
    targetWidth = 600,
    targetHeight = 800,
  } = options;

  return new Promise((resolve) => {
    if (!imageUrl) {
      resolve(imageUrl);
      return;
    }

    const img = new Image();
    if (!imageUrl.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(imageUrl);
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Apply clean, hardware-accelerated GPU filters
        const contrastPct = Math.max(80, Math.min(160, 100 + contrast));
        const brightnessPct = Math.max(80, Math.min(140, 100 + brightness));
        const saturatePct = Math.max(80, Math.min(160, 100 + saturation));

        const imgAspect = (img.naturalWidth || img.width) / (img.naturalHeight || img.height);
        const frameAspect = targetWidth / targetHeight;
        let drawW = targetWidth;
        let drawH = targetHeight;
        let drawX = 0;
        let drawY = 0;

        if (imgAspect > frameAspect) {
          // Wider than 3:4: fill height, center width (crop sides equally)
          drawH = targetHeight;
          drawW = targetHeight * imgAspect;
          drawX = (targetWidth - drawW) / 2;
          drawY = 0;
        } else {
          // Taller than 3:4: fill width, position with natural headroom
          drawW = targetWidth;
          drawH = targetWidth / imgAspect;
          drawX = 0;
          drawY = (targetHeight - drawH) * 0.15;
          if (drawY > 0) drawY = 0;
          if (drawY + drawH < targetHeight) drawY = targetHeight - drawH;
        }

        ctx.filter = `contrast(${contrastPct}%) brightness(${brightnessPct}%) saturate(${saturatePct}%)`;
        ctx.drawImage(img, drawX, drawY, drawW, drawH);

        resolve(canvas.toDataURL('image/jpeg', 0.98));
      } catch (err) {
        console.error('HD enhance error:', err);
        resolve(imageUrl);
      }
    };

    img.onerror = (e) => {
      console.warn('Image load error for HD enhance:', e);
      resolve(imageUrl);
    };

    img.src = imageUrl;
  });
}

