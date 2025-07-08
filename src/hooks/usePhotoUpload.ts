import { useState } from 'react';
import { photoService } from '../services/firebaseService';
import { toast } from 'sonner';

interface PhotoFormData {
  year: string;
  description: string;
  detailedDescription: string;
  author: string;
  tags: string[];
}

// Helper function to compress image
const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        } else {
          resolve(file); // Fallback to original
        }
      }, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Helper function to retry upload with exponential backoff
const retryUpload = async (uploadFn: () => Promise<string>, maxRetries: number = 3): Promise<string> => {
  let lastError: Error | unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Upload attempt ${attempt}/${maxRetries}`);
      return await uploadFn();
    } catch (error: unknown) {
      lastError = error;
      console.log(`Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

export const usePhotoUpload = (locationName: string, onSuccess?: () => void) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<PhotoFormData>({
    year: '',
    description: '',
    detailedDescription: '',
    author: '',
    tags: []
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        try {
          // Check file size (5MB limit)
          if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB. Please compress your image.');
            return;
          }

          // Show original preview first
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
          
          // Compress image for better mobile upload
          const compressedFile = await compressImage(file);
          console.log(`Original size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
          console.log(`Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
          
          setSelectedFile(compressedFile);
          
          if (compressedFile.size < file.size) {
            toast.success(`Image compressed from ${(file.size / 1024 / 1024).toFixed(1)}MB to ${(compressedFile.size / 1024 / 1024).toFixed(1)}MB for better upload`);
          }
        } catch (error: unknown) {
          console.error('Image compression failed:', error);
          setSelectedFile(file); // Use original if compression fails
        }
      } else {
        toast.error('Please select an image file');
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const isFormValid = () => {
    return selectedFile && formData.year && formData.description && formData.author;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Please select a photo to upload');
      return;
    }

    if (!formData.year || !formData.description || !formData.author) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check connection
    if (!navigator.onLine) {
      toast.error('No internet connection. Please check your network and try again.');
      return;
    }

    setUploading(true);

    try {
      // Generate a unique ID first
      const photoId = Date.now().toString();
      
      console.log('Starting upload process for photoId:', photoId);
      console.log('File details:', { 
        name: selectedFile.name, 
        size: selectedFile.size, 
        type: selectedFile.type 
      });
      
      // Upload file with retry logic (most likely to fail)
      const imageUrl = await retryUpload(async () => {
        return await photoService.uploadPhotoFile(selectedFile, photoId);
      });
      
      console.log('File upload successful, creating database record...');
      
      // Only create Firestore record if upload succeeds
      const finalPhotoId = await photoService.addPhoto({
        imageUrl: imageUrl,
        imageStoragePath: `photos/${photoId}/${Date.now()}_${selectedFile.name}`,
        year: formData.year,
        description: formData.description,
        detailedDescription: formData.detailedDescription,
        author: formData.author,
        location: locationName,
        tags: formData.tags
      });
      
      console.log('Database record created successfully with ID:', finalPhotoId);
      
      toast.success('Photo uploaded successfully! It will be reviewed and published soon.');
      
      // Reset form
      setSelectedFile(null);
      setPreviewUrl('');
      setFormData({
        year: '',
        description: '',
        detailedDescription: '',
        author: '',
        tags: []
      });

      onSuccess?.();
      
    } catch (error: unknown) {
      console.error('Upload error:', error);
      
      // Type-safe error handling
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorCode = (error as any)?.code;
      const errorName = error instanceof Error ? error.name : 'Unknown';
      
      console.error('Error details:', {
        message: errorMessage,
        code: errorCode,
        name: errorName
      });
      
      // More specific error messages for mobile users
      if (errorCode === 'storage/unauthorized') {
        toast.error('Upload failed: Storage permissions issue. Please try again.');
      } else if (errorCode === 'storage/quota-exceeded') {
        toast.error('Upload failed: Storage quota exceeded.');
      } else if (errorMessage?.includes('CORS')) {
        toast.error('Upload failed: CORS configuration issue.');
      } else if (errorMessage?.includes('ERR_INTERNET_DISCONNECTED') || errorMessage?.includes('network')) {
        toast.error('Upload failed: Poor internet connection. Please check your mobile hotspot and try again.');
      } else {
        toast.error('Upload failed: Please check your internet connection and try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  return {
    selectedFile,
    previewUrl,
    uploading,
    formData,
    setFormData,
    handleFileChange,
    removeFile,
    handleSubmit,
    isFormValid
  };
};