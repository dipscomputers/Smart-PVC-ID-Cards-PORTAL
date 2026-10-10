/**
 * Utility function to process signature images and remove white/light backgrounds,
 * converting them into crisp transparent PNG data URLs.
 */
export const removeWhiteBackground = (dataUrl: string, threshold = 205): Promise<string> => {
  return new Promise((resolve) => {
    if (!dataUrl) {
      resolve('');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Perceptual brightness calculation
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;

        if (brightness > threshold) {
          if (brightness >= 235) {
            data[i + 3] = 0; // Make fully transparent
          } else {
            // Smooth gradient transition for clean anti-aliased stroke edges
            const alphaFactor = (235 - brightness) / (235 - threshold);
            data[i + 3] = Math.min(data[i + 3], Math.floor(255 * alphaFactor));
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
};
