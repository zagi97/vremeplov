// src/utils/imageOptimization.ts

/**
 * Image optimization configuration
 */
export const IMAGE_CONFIG = {
  sizes: [
    { width: 800, suffix: '800w', quality: 0.85 },
    { width: 1200, suffix: '1200w', quality: 0.85 },
    { width: 1600, suffix: '1600w', quality: 0.85 },
  ],
  webp: { quality: 0.85, enabled: true },
  jpeg: { quality: 0.90, enabled: true },
  maxOriginalWidth: 2400,
  maxOriginalHeight: 2400,
};

/**
 * Resize image to specified dimensions with quality control
 */
export const resizeImage = (
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number,
  quality: number,
  format: 'image/webp' | 'image/jpeg' = 'image/jpeg'
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    let width = img.width;
    let height = img.height;

    // Calculate new dimensions while maintaining aspect ratio
    if (width > height) {
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
    } else {
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    // High-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas to Blob conversion failed'));
      },
      format,
      quality
    );
  });
};

/**
 * Generate multiple image sizes (responsive images)
 */
export const generateImageSizes = async (
  file: File
): Promise<{
  original: { blob: Blob; width: number; height: number };
  webp: Array<{ blob: Blob; suffix: string; width: number }>;
  jpeg: Array<{ blob: Blob; suffix: string; width: number }>;
}> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = async (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = async () => {
      try {
        const results = {
          original: { blob: null as any, width: img.width, height: img.height },
          webp: [] as Array<{ blob: Blob; suffix: string; width: number }>,
          jpeg: [] as Array<{ blob: Blob; suffix: string; width: number }>,
        };

        // Generate original (resized to max dimensions)
        const originalBlob = await resizeImage(
          img,
          IMAGE_CONFIG.maxOriginalWidth,
          IMAGE_CONFIG.maxOriginalHeight,
          IMAGE_CONFIG.jpeg.quality,
          'image/jpeg'
        );
        results.original.blob = originalBlob;

        // Generate responsive sizes
        for (const size of IMAGE_CONFIG.sizes) {
          // Skip if original is smaller than target size
          if (img.width < size.width) continue;

          // Generate WebP version
          if (IMAGE_CONFIG.webp.enabled) {
            const webpBlob = await resizeImage(
              img,
              size.width,
              size.width * (img.height / img.width),
              size.quality,
              'image/webp'
            );
            results.webp.push({
              blob: webpBlob,
              suffix: size.suffix,
              width: size.width,
            });
          }

          // Generate JPEG version
          if (IMAGE_CONFIG.jpeg.enabled) {
            const jpegBlob = await resizeImage(
              img,
              size.width,
              size.width * (img.height / img.width),
              IMAGE_CONFIG.jpeg.quality,
              'image/jpeg'
            );
            results.jpeg.push({
              blob: jpegBlob,
              suffix: size.suffix,
              width: size.width,
            });
          }
        }

        resolve(results);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    reader.readAsDataURL(file);
  });
};
