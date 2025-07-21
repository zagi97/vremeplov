import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Upload, X, Calendar, MapPin, User, Image as ImageIcon } from "lucide-react";
import { photoService } from '../services/firebaseService';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { CharacterCounter } from "./ui/character-counter";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "@/lib/utils";
/* import { CalendarYearPicker } from "./DatePicker"; */

interface PhotoUploadProps {
  locationName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Helper function to compress image
const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      resolve(file); // Fallback if canvas context is not available
      return;
    }
    
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
    
    img.onerror = () => {
      resolve(file); // Fallback to original if image loading fails
    };
    
    img.src = URL.createObjectURL(file);
  });
};

const PhotoUpload: React.FC<PhotoUploadProps> = ({ 
  locationName, 
  onSuccess, 
  onCancel 
}) => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [yearPopoverOpen, setYearPopoverOpen] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    year: '',
    description: '',
    detailedDescription: '',
    author: '',
    tags: [] as string[]
  });

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Check if form is valid
  const isFormValid = (): boolean => {
    return !!(selectedFile && formData.year && formData.description && formData.author);
  };

  // Handle file selection with compression
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

          // Clean up previous preview URL
          if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
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
        } catch (error) {
          console.error('Image compression failed:', error);
          setSelectedFile(file); // Use original if compression fails
        }
      } else {
        toast.error('Please select an image file');
      }
    }
  };

  // Remove selected file
  const removeFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  };

  // Handle form submission with proper error handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to upload photos');
      return;
    }
    
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
      
      // Upload file first (most likely to fail)
      const imageUrl = await photoService.uploadPhotoFile(selectedFile, photoId);
      
      console.log('File upload successful, creating database record...');
      
      // Extract user name from authenticated user
      let uploaderName = 'Unknown';
      
      if (user?.displayName && user.displayName.trim() !== '') {
        uploaderName = user.displayName.trim();
      } else if (user?.email && user.email.trim() !== '') {
        // Extract name from email if displayName is not available
        uploaderName = user.email.split('@')[0].trim();
      }
      
      console.log('User uploading photo:', uploaderName);
      
      // Only create Firestore record if upload succeeds
const finalPhotoId = await photoService.addPhoto({
  imageUrl: imageUrl,
  imageStoragePath: `photos/${photoId}/${Date.now()}_${selectedFile.name}`,
  year: formData.year,
  description: formData.description,
  detailedDescription: formData.detailedDescription,
  author: formData.author,
  authorId: user.uid, // ✅ Add this line - store the actual user UID
  location: locationName,
  tags: formData.tags,
  uploadedBy: uploaderName,
  uploadedAt: new Date().toISOString()
});
      
      console.log('Database record created successfully with ID:', finalPhotoId);
      
      toast.success('Photo uploaded successfully! It will be reviewed and published soon.');
      
      // Reset form
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
      }
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
      
      console.error('Error details:', {
        message: errorMessage,
        code: errorCode,
        name: error instanceof Error ? error.name : 'Unknown'
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

  // Generate year options (current year back to 1900)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from(
    { length: currentYear - 1899 }, 
    (_, i) => currentYear - i
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Add Historical Photo to {locationName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            {!selectedFile ? (
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Click to upload a historical photo
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      PNG, JPG, JPEG up to 5MB
                    </span>
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-64 mx-auto rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeFile}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
{/* Year */}
<div>
  <label className="block text-sm font-medium mb-2">
    <Calendar className="inline h-4 w-4 mr-1" />
    Year *
  </label>
  <select
    value={formData.year}
    onChange={(e) => {
      console.log('HTML select changed:', e.target.value);
      setFormData(prev => ({...prev, year: e.target.value}));
    }}
    className="w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-input text-sm"
    required
  >
    <option value="" disabled hidden>Select year</option>
    {yearOptions.map((year) => (
      <option key={year} value={year.toString()}>
        {year}
      </option>
    ))}
  </select>
</div>


            {/* Author */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Photo Author *
              </label>
              <Input
                type="text"
                placeholder="Who took this photo?"
                value={formData.author}
                onChange={(e) => setFormData({...formData, author: e.target.value})}
                maxLength={40}
                className={formData.author.length >= 38 ? "border-red-300 focus:border-red-500" : ""}
            />
            <CharacterCounter currentLength={formData.author.length} maxLength={40} />
            </div>
          </div>

          {/* Location (readonly) */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <MapPin className="inline h-4 w-4 mr-1" />
              Location
            </label>
            <Input
              type="text"
              value={locationName}
              disabled
              className="bg-gray-50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Description *
            </label>
            <Input
              type="text"
              placeholder="Brief description of the photo"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              maxLength={120}
               className={formData.description.length >= 114 ? "border-red-300 focus:border-red-500" : ""}
            />
            <CharacterCounter currentLength={formData.description.length} maxLength={120} />
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Detailed Story (Optional)
            </label>
            <Textarea
              placeholder="Share the story behind this photo, historical context, or personal memories..."
              value={formData.detailedDescription}
              onChange={(e) => setFormData({...formData, detailedDescription: e.target.value})}
              maxLength={250}
              rows={3}
               className={formData.detailedDescription.length >= 238 ? "border-red-300 focus:border-red-500" : ""}
            />
            <CharacterCounter currentLength={formData.detailedDescription.length} maxLength={250} />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={uploading || !isOnline || !isFormValid()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {uploading ? 'Uploading...' : !isOnline ? 'No Connection' : !isFormValid() ? 'Fill Required Fields' : 'Share Memory'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PhotoUpload;