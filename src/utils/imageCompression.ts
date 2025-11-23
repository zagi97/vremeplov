/**
 * Image Compression and File Handling Utilities
 *
 * Handles image compression, validation, and optimization
 */

export const IMAGE_COMPRESSION_CONFIG = {
  MAX_WIDTH: 1920,
  DEFAULT_QUALITY: 0.85,
  QUALITY_LARGE_FILE: 0.7, // For files > 10MB
  QUALITY_MEDIUM_FILE: 0.8, // For files 5-10MB
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB
  LARGE_FILE_THRESHOLD: 10 * 1024 * 1024, // 10MB
  MEDIUM_FILE_THRESHOLD: 5 * 1024 * 1024, // 5MB
};

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Validate if file is an allowed image type
 */
export const isValidImageType = (file: File): boolean => {
  return ALLOWED_IMAGE_TYPES.includes(file.type);
};

/**
 * Check if file is a GIF (not supported)
 */
export const isGifFile = (file: File): boolean => {
  return file.type === 'image/gif';
};

/**
 * Check if file exceeds maximum allowed size
 */
export const isFileTooLarge = (file: File): boolean => {
  return file.size > IMAGE_COMPRESSION_CONFIG.MAX_FILE_SIZE;
};

/**
 * Determine optimal compression quality based on file size
 */
const getCompressionQuality = (fileSize: number): number => {
  if (fileSize > IMAGE_COMPRESSION_CONFIG.LARGE_FILE_THRESHOLD) {
    return IMAGE_COMPRESSION_CONFIG.QUALITY_LARGE_FILE;
  } else if (fileSize > IMAGE_COMPRESSION_CONFIG.MEDIUM_FILE_THRESHOLD) {
    return IMAGE_COMPRESSION_CONFIG.QUALITY_MEDIUM_FILE;
  }
  return IMAGE_COMPRESSION_CONFIG.DEFAULT_QUALITY;
};

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 */
const calculateOptimalDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number
): { width: number; height: number } => {
  // If image is already smaller than maxWidth, don't resize
  if (originalWidth <= maxWidth && originalHeight <= maxWidth) {
    return { width: originalWidth, height: originalHeight };
  }

  const aspectRatio = originalWidth / originalHeight;

  if (originalWidth > originalHeight) {
    // Landscape - limit width
    const width = Math.min(originalWidth, maxWidth);
    const height = width / aspectRatio;
    return { width, height };
  } else {
    // Portrait - limit height
    const height = Math.min(originalHeight, maxWidth);
    const width = height * aspectRatio;
    return { width, height };
  }
};

/**
 * Compress image file
 *
 * @param file - Original image file
 * @param maxWidth - Maximum width for the compressed image (default: 1920)
 * @param quality - Compression quality 0-1 (default: 0.85)
 * @returns Promise<File> - Compressed image file
 */
export const compressImage = (
  file: File,
  maxWidth: number = IMAGE_COMPRESSION_CONFIG.MAX_WIDTH,
  quality: number = IMAGE_COMPRESSION_CONFIG.DEFAULT_QUALITY
): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      console.warn('Canvas not supported, returning original file');
      resolve(file);
      return;
    }

    img.onload = () => {
      // Calculate optimal dimensions
      const { width, height } = calculateOptimalDimensions(img.width, img.height, maxWidth);

      // If dimensions haven't changed, skip compression
      if (width === img.width && height === img.height) {
        console.log('Image is already optimal size, skipping compression');
        resolve(file);
        return;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Optimize rendering quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw image
      ctx.drawImage(img, 0, 0, width, height);

      // Determine final quality based on file size
      const finalQuality = getCompressionQuality(file.size);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);
            const compressedSizeMB = (compressedFile.size / 1024 / 1024).toFixed(2);
            const reduction = ((1 - compressedFile.size / file.size) * 100).toFixed(1);

            console.log(`📸 Compression successful:`);
            console.log(`   Original: ${originalSizeMB}MB`);
            console.log(`   Compressed: ${compressedSizeMB}MB`);
            console.log(`   Reduced by: ${reduction}%`);
            console.log(`   Dimensions: ${img.width}x${img.height} → ${width}x${height}`);

            resolve(compressedFile);
          } else {
            console.error('Compression failed, returning original');
            resolve(file);
          }
        },
        'image/jpeg',
        finalQuality
      );
    };

    img.onerror = () => {
      console.error('Error loading image for compression');
      resolve(file);
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Calculate compression stats
 */
export const getCompressionStats = (originalFile: File, compressedFile: File) => {
  const originalSizeMB = (originalFile.size / 1024 / 1024).toFixed(1);
  const compressedSizeMB = (compressedFile.size / 1024 / 1024).toFixed(1);
  const reduction = ((1 - compressedFile.size / originalFile.size) * 100).toFixed(0);

  return {
    originalSize: originalSizeMB,
    compressedSize: compressedSizeMB,
    reductionPercent: reduction,
    wasCompressed: compressedFile.size < originalFile.size,
  };
};
