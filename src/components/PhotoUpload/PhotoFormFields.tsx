import React from 'react';
import { Calendar, User, Tag, MapPin } from "lucide-react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { CharacterCounter } from "../ui/character-counter";
import YearPicker from "../YearPicker";

interface PhotoFormData {
  year: string;
  description: string;
  detailedDescription: string;
  author: string;
  photoType: string;
}

interface PhotoTypeOption {
  value: string;
  label: string;
}

interface PhotoFormFieldsProps {
  formData: PhotoFormData;
  locationName: string;
  photoTypes: PhotoTypeOption[];
  onChange: (data: Partial<PhotoFormData>) => void;
  t: (key: string) => string;
}

export const PhotoFormFields: React.FC<PhotoFormFieldsProps> = ({
  formData,
  locationName,
  photoTypes,
  onChange,
  t
}) => {
  return (
    <>
      {/* Year and Author row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Year */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            <Calendar className="inline h-4 w-4 mr-1" />
            {t('upload.year')} *
          </label>
          <YearPicker
            selectedYear={formData.year}
            onYearSelect={(year) => onChange({ year })}
            t={t}
            required={true}
          />
        </div>

        {/* Author */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            <User className="inline h-4 w-4 mr-1" />
            {t('upload.author')} *
          </label>
          <Input
            type="text"
            placeholder={t('upload.whoTookPhoto')}
            value={formData.author}
            onChange={(e) => onChange({ author: e.target.value })}
            maxLength={40}
            className={`bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 ${formData.author.length >= 38 ? "border-red-300 focus:border-red-500" : ""}`}
          />
          <CharacterCounter currentLength={formData.author.length} maxLength={40} />
        </div>

        {/* Photo Type */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            <Tag className="inline h-4 w-4 mr-1" />
            {t('upload.photoType')} *
          </label>
          <Select
            value={formData.photoType}
            onValueChange={(value) => onChange({ photoType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('upload.selectPhotoType')} />
            </SelectTrigger>
            <SelectContent>
              {photoTypes.map(type => (
                <SelectItem
                  key={type.value}
                  value={type.value}
                  className="hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                >
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Location (readonly) */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
          <MapPin className="inline h-4 w-4 mr-1" />
          {t('upload.location')}
        </label>
        <Input
          type="text"
          value={locationName}
          disabled
          className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
          {t('upload.description')} *
        </label>
        <Input
          type="text"
          placeholder={t('upload.briefDescription')}
          value={formData.description}
          onChange={(e) => onChange({ description: e.target.value })}
          maxLength={120}
          className={`bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 ${formData.description.length >= 114 ? "border-red-300 focus:border-red-500" : ""}`}
        />
        <CharacterCounter currentLength={formData.description.length} maxLength={120} />
      </div>

      {/* Detailed Description */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
          {t('upload.detailedStory')}
        </label>
        <Textarea
          placeholder={t('upload.shareStory')}
          value={formData.detailedDescription}
          onChange={(e) => {
            const value = e.target.value.slice(0, 250);
            onChange({ detailedDescription: value });
          }}
          maxLength={250}
          rows={3}
          className={`bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 ${formData.detailedDescription.length >= 238 ? "border-red-300 focus:border-red-500" : ""}`}
        />
        <CharacterCounter currentLength={formData.detailedDescription.length} maxLength={250} />
      </div>
    </>
  );
};
