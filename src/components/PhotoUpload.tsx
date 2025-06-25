// src/components/PhotoUpload.tsx
import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Upload, X, Calendar, MapPin, User, Image } from "lucide-react";
import { photoService } from '../services/firebaseService';
import { toast } from 'sonner';

interface PhotoUploadProps {
  locationName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ 
  locationName, 
  onSuccess, 
  onCancel 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    year: '',
    description: '',
    detailedDescription: '',
    author: '',
    tags: [] as string[]
  });

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        toast.error('Please select an image file');
      }
    }
  };

  // Remove selected file
  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
  };

  // Handle form submission - improved flow
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

    setUploading(true);

    try {
     // Generate a unique ID first
     const photoId = Date.now().toString();
      
     console.log('Starting upload process for photoId:', photoId);
     
     // Upload file first (most likely to fail)
     const imageUrl = await photoService.uploadPhotoFile(selectedFile, photoId);
     
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
      
    } catch (error) {
      console.error('Upload error:', error);
  
      // Type guard to safely access error properties
      const firebaseError = error as any; // or create a proper type
      
      console.error('Error details:', {
        message: firebaseError?.message,
        code: firebaseError?.code,
        name: firebaseError?.name
      });
      
      // More specific error messages
      if (firebaseError?.code === 'storage/unauthorized') {
        toast.error('Upload failed: Storage permissions issue. Please check CORS configuration.');
      } else if (firebaseError?.code === 'storage/quota-exceeded') {
        toast.error('Upload failed: Storage quota exceeded.');
      } else if (firebaseError?.message?.includes('CORS')) {
        toast.error('Upload failed: CORS configuration issue. Please check your Firebase Storage CORS settings.');
      } else {
        toast.error('Failed to upload photo. Please try again.');
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
          <Image className="h-5 w-5" />
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
                      PNG, JPG, JPEG up to 10MB
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
              <Select 
                value={formData.year} 
                onValueChange={(value) => setFormData({...formData, year: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              />
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
            />
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
              rows={3}
            />
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
              disabled={uploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {uploading ? 'Uploading...' : 'Share Memory'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PhotoUpload;