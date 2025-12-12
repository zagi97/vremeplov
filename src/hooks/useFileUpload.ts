/**
 * Custom hook for handling file upload, validation, and compression
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  compressImage,
  isValidImageType,
  isGifFile,
  isFileTooLarge,
  getCompressionStats,
} from '@/utils/imageCompression';
import { translateWithParams, TranslationFunction } from '@/contexts/LanguageContext';

interface UseFileUploadReturn {
  selectedFile: File | null;
  previewUrl: string;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  removeFile: () => void;
}

export const useFileUpload = (t: TranslationFunction): UseFileUploadReturn => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  /**
   * Handle file selection with validation and compression
   */
  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validation: Check if file is an image
      if (!isValidImageType(file)) {
        toast.error(t('errors.invalidImageType'));
        return;
      }

      // Validation: Block GIF files
      if (isGifFile(file)) {
        toast.error(
          '🚫 GIF animacije nisu podržane. Molimo koristite JPG, PNG ili WebP format.',
          { duration: 5000 }
        );
        event.target.value = ''; // Reset input field
        return;
      }

      // Validation: Check file size (20MB limit)
      if (isFileTooLarge(file)) {
        toast.error(t('errors.imageTooLarge'));
        return;
      }

      try {
        // Clean up previous preview URL
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }

        // Create preview
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);

        // Show loading toast for compression
        const loadingToast = toast.loading(t('upload.compressing'));

        // Compress image
        const compressedFile = await compressImage(file);

        // Remove loading toast
        toast.dismiss(loadingToast);

        // Set compressed file
        setSelectedFile(compressedFile);

        // Log compression stats (removed toast to avoid redundancy with upload success toast)
        const stats = getCompressionStats(file, compressedFile);
        if (stats.wasCompressed) {
          console.log(`📸 Image compressed: ${stats.originalSize}MB → ${stats.compressedSize}MB (${stats.reductionPercent}% reduction)`);
        } else {
          console.log(`📸 Image is optimal size (${stats.originalSize}MB)`);
        }
      } catch (error) {
        console.error('Error during compression:', error);
        toast.error(t('errors.compressionError'));
        // In case of error, use original file
        setSelectedFile(file);
      }
    },
    [t, previewUrl]
  );

  /**
   * Remove selected file and clean up
   */
  const removeFile = useCallback(() => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  }, [previewUrl]);

  return {
    selectedFile,
    previewUrl,
    handleFileChange,
    removeFile,
  };
};
