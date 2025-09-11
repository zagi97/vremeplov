import React from 'react';
import { Button } from "./ui/button";
import { Upload, X } from "lucide-react";
import LazyImage from './LazyImage'; // DODANO

interface ImageUploadProps {
  imagePreview: string;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
}

const ImageUpload = ({ imagePreview, onImageChange, onRemoveImage }: ImageUploadProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Photo *</label>
      {!imagePreview ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="image-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Click to upload an image
                </span>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={onImageChange}
                  className="hidden"
                  required
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* ZAMIJENIO img s LazyImage */}
          <LazyImage
            src={imagePreview}
            alt="Preview"
            className="w-full h-64 object-cover rounded-lg"
            threshold={0.1} // Upload preview - učitaj odmah
            rootMargin="0px" // Bez margin-a jer korisnik eksplicitno gleda preview
            placeholder={
              <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded-lg">
                <div className="text-center text-gray-500">
                  <Upload className="h-8 w-8 mx-auto mb-2" />
                  <span className="text-sm">Loading preview...</span>
                </div>
              </div>
            }
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onRemoveImage}
            className="absolute top-2 right-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;