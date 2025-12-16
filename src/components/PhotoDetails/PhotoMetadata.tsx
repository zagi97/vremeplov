// src/components/PhotoDetails/PhotoMetadata.tsx
import React from 'react';
import { Calendar, Camera, MapPin, Upload, User, Users } from "lucide-react";
import { useLanguage, translateWithParams } from "@/contexts/LanguageContext";

interface TaggedPerson {
  id: string;
  name: string;
  x: number;
  y: number;
  isApproved?: boolean;
}

interface PhotoMetadataProps {
  year: number;
  author: string;
  location: string;
  uploadedBy?: string;
  uploadedAt?: string;
  description: string;
  detailedDescription?: string;
  taggedPersons: TaggedPerson[];
}

export const PhotoMetadata: React.FC<PhotoMetadataProps> = ({
  year,
  author,
  location,
  uploadedBy,
  uploadedAt,
  description,
  detailedDescription,
  taggedPersons
}) => {
  const { t } = useLanguage();

  // Filter only approved tags
  const approvedTags = taggedPersons.filter(person => person.isApproved === true);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden m-6">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('photoDetail.aboutPhoto')}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{t('photo.historicalDetails')}</p>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <Calendar className="h-6 w-6 mx-auto text-blue-600 dark:text-blue-400 mb-2" />
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">{t('photoDetail.year')}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{year}</p>
          </div>

          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <Camera className="h-6 w-6 mx-auto text-purple-600 dark:text-purple-400 mb-2" />
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">{t('photoDetail.author')}</p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 break-all">{author}</p>
          </div>

          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <MapPin className="h-6 w-6 mx-auto text-green-600 dark:text-green-400 mb-2" />
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">{t('photoDetail.location')}</p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 break-all">{location}</p>
          </div>

          {uploadedBy && (
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <Upload className="h-6 w-6 mx-auto text-orange-600 dark:text-orange-400 mb-2" />
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">{t('photoDetail.uploadedBy')}</p>
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{uploadedBy}</p>
              {uploadedAt && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(uploadedAt).toLocaleDateString('hr-HR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed break-all">
            {detailedDescription || translateWithParams(t, 'photoDetail.defaultDescription', {
              year,
              description,
              location,
              author
            })}
          </p>
        </div>

        {/* Tagged People - only approved tags */}
        {approvedTags.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t('photoDetail.taggedPeople')} ({approvedTags.length})
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {approvedTags.map((person) => (
                <span
                  key={person.id || `temp-${person.x}-${person.y}`}
                  className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors break-all"
                >
                  <User className="h-3 w-3 flex-shrink-0" />
                  <span className="break-all">{person.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
