import React from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Upload, Calendar, MapPin, User, Navigation, Tag } from "lucide-react";
import { useLanguage } from '../contexts/LanguageContext';
import { CharacterCounter } from "./ui/character-counter";
import PhotoTagger from "./PhotoTagger";
import { TooltipProvider } from "./ui/tooltip";
import YearPicker from "../components/YearPicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { municipalityData } from '../../data/municipalities';
import { parseLocationFromUrl } from '@/utils/locationUtils';
import { getUploadTitle, getPhotoTypeOptions } from '@/utils/photoUploadHelpers';
import { isPhotoUploadFormValid } from '@/utils/photoUploadValidation';
import { ManualLocationPicker } from './PhotoUpload/ManualLocationPicker';
import { LocationConfirmation } from './PhotoUpload/LocationConfirmation';
import { AddressAutocomplete } from './PhotoUpload/AddressAutocomplete';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';

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
  const { t } = useLanguage();

  const decodedLocationName = decodeURIComponent(locationName);
  const parsedLocation = parseLocationFromUrl(decodedLocationName, municipalityData);

  const PHOTO_TYPES = getPhotoTypeOptions(t);

  const {
    formData,
    setFormData,
    uploading,
    isOnline,
    selectedFile,
    previewUrl,
    addressSearch,
    selectedAddress,
    coordinates,
    needsManualPositioning,
    streetOnlyCoordinates,
    streetName,
    houseNumber,
    taggedPersons,
    handleSubmit,
    handleFileChange,
    removeFile,
    handleAddressSelect,
    handleManualPositioning,
    handleClearAddress,
    handleAddTag,
    handleManualLocationSelect,
    handleChangeLocation,
    handleAddressSearchChange,
  } = usePhotoUpload({ locationName, onSuccess });

  return (
    <Card className="w-full max-w-2xl mx-auto dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          {getUploadTitle(parsedLocation.type, parsedLocation.displayName, t)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
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
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            ) : (
              <TooltipProvider>
                <PhotoTagger
                  taggedPersons={taggedPersons}
                  onAddTag={handleAddTag}
                  imageUrl={previewUrl}
                  onRemoveFile={removeFile}
                  photoId={undefined}
                />
              </TooltipProvider>
            )}
          </div>

          {/* ADDRESS AUTOCOMPLETE */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              <Navigation className="inline h-4 w-4 mr-1" />
              {t('upload.specificAddress')} {locationName} {t('upload.optional')}
            </label>

            <AddressAutocomplete
              locationName={locationName}
              value={addressSearch}
              onChange={handleAddressSearchChange}
              onAddressSelect={handleAddressSelect}
              onManualPositioning={handleManualPositioning}
              placeholder={t('upload.searchAddress')}
              t={t}
            />

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
              💡 {t('upload.addressHelp')}
            </p>

            {/* Error message if user typed but didn't select */}
            {addressSearch.trim() !== '' && !selectedAddress && (
              <div className="mt-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {t('upload.mustSelectAddress')}
              </div>
            )}
          </div>

          {/* MANUAL POSITIONING SECTION */}
          {needsManualPositioning && streetOnlyCoordinates && (
            <ManualLocationPicker
              streetOnlyCoordinates={streetOnlyCoordinates}
              streetName={streetName}
              houseNumber={houseNumber}
              onLocationSelect={handleManualLocationSelect}
              t={t}
            />
          )}

          {/* LOCATION CONFIRMATION SECTION */}
          {coordinates && selectedAddress && !needsManualPositioning && (
            <LocationConfirmation
              coordinates={coordinates}
              selectedAddress={selectedAddress}
              streetName={streetName}
              houseNumber={houseNumber}
              onChangeLocation={handleChangeLocation}
              onReset={handleClearAddress}
              t={t}
            />
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Year */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                <Calendar className="inline h-4 w-4 mr-1" />
                {t('upload.year')} *
              </label>
              <YearPicker
                selectedYear={formData.year}
                onYearSelect={(year) => setFormData(prev => ({...prev, year}))}
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
                onChange={(e) => setFormData({...formData, author: e.target.value})}
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
                onValueChange={(value) => setFormData({...formData, photoType: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('upload.selectPhotoType')} />
                </SelectTrigger>
                <SelectContent>
                  {PHOTO_TYPES.map(type => (
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

          {/* Sublocation */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              <MapPin className="inline h-4 w-4 mr-1" />
              {t('upload.sublocation')} {t('upload.optional')}
            </label>
            <Input
              type="text"
              placeholder={t('upload.sublocationPlaceholder')}
              value={formData.sublocation}
              onChange={(e) => setFormData({...formData, sublocation: e.target.value})}
              maxLength={50}
              className={`bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 ${formData.sublocation.length >= 48 ? "border-red-300 focus:border-red-500" : ""}`}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('upload.sublocationHelp')}
            </p>
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
              onChange={(e) => setFormData({...formData, description: e.target.value})}
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
                setFormData({...formData, detailedDescription: value});
              }}
              maxLength={250}
              rows={3}
              className={`bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 ${formData.detailedDescription.length >= 238 ? "border-red-300 focus:border-red-500" : ""}`}
            />
            <CharacterCounter currentLength={formData.detailedDescription.length} maxLength={250} />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                {t('common.cancel')}
              </Button>
            )}
            <Button
              type="submit"
              disabled={uploading || !isOnline || !isPhotoUploadFormValid(formData, selectedFile, addressSearch, selectedAddress, coordinates)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {uploading ? t('upload.uploading') : !isOnline ? t('upload.noConnection') : !isPhotoUploadFormValid(formData, selectedFile, addressSearch, selectedAddress, coordinates) ? t('upload.fillRequired') : t('upload.shareMemory')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PhotoUpload;
