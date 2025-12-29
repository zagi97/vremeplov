import React from 'react';
import { Upload } from "lucide-react";
import PhotoTagger from "../PhotoTagger";
import { TooltipProvider } from "../ui/tooltip";

interface TaggedPerson {
  id: string;
  name: string;
  x: number;
  y: number;
}

interface FileUploadAreaProps {
  selectedFile: File | null;
  previewUrl: string | null;
  taggedPersons: TaggedPerson[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddTag: (tag: { name: string; x: number; y: number }) => void;
  onRemoveFile: () => void;
  t: (key: string) => string;
}

export const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  selectedFile,
  previewUrl,
  taggedPersons,
  onFileChange,
  onAddTag,
  onRemoveFile,
  t
}) => {
  return (
    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-white dark:bg-gray-800">
      {!selectedFile ? (
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <div className="mt-4">
            <label htmlFor="photo-upload" className="cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                {t('upload.clickToUpload')}
              </span>
              <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                {t('upload.fileTypes')}
              </span>
            </label>
            <input
              id="photo-upload"
              type="file"
              className="hidden"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={onFileChange}
            />
          </div>
        </div>
      ) : (
        <TooltipProvider>
          <PhotoTagger
            taggedPersons={taggedPersons}
            onAddTag={onAddTag}
            imageUrl={previewUrl}
            onRemoveFile={onRemoveFile}
            photoId={undefined}
          />
        </TooltipProvider>
      )}
    </div>
  );
};
