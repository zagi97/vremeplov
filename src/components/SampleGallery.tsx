// Update your SampleGallery.tsx - UKLONI handleImageError kompletno:

import React, { useState, useEffect } from 'react'; // ← Ukloni useCallback
import { Skeleton } from './ui/skeleton'
import { Clock, MapPin, Image } from "lucide-react";
import { Link } from 'react-router-dom';
import { photoService, Photo } from "../services/firebaseService";
import LazyImage from "./LazyImage";
import { useLanguage } from '../contexts/LanguageContext';

const SampleGallery = () => {
  const [recentPhotos, setRecentPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  // Helper to display year with translation for unknown
  const formatYear = (year: string) => {
    const translated = t('upload.unknownYear');
    console.log('[DEBUG formatYear]', { year, translated, language: localStorage.getItem('language') });
    return year === 'unknown' ? translated : year;
  };

  useEffect(() => {
    const loadRecentPhotos = async () => {
      try {
        const photos = await photoService.getRecentPhotos(6);
        setRecentPhotos(photos);
      } catch (error) {
        console.error('Error loading recent photos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecentPhotos();
  }, []);


  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
         <Skeleton key={index} className="aspect-[4/3] rounded-lg" />
        ))}
      </div>
    );
  }

  if (recentPhotos.length === 0) {
    return (
      <div className="text-center py-12 px-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
        <Image className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('gallery.noPhotos')}</h3>
        <p className="text-gray-600 dark:text-gray-400">
          {t('gallery.noPhotosDesc')}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recentPhotos.map((photo) => (
        <Link 
          key={photo.id} 
          to={`/photo/${photo.id}`}
          className="group relative overflow-hidden rounded-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 block"
        >
          <div className="aspect-[4/3] overflow-hidden relative">
            <LazyImage
              src={photo.imageUrl}
              alt={`${photo.location}, ${formatYear(photo.year)}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-80"></div>
          <div className="absolute bottom-0 left-0 p-4 w-full">
            <h3 className="text-white text-lg font-semibold line-clamp-1">{photo.description}</h3>
            <div className="flex items-center mt-2 text-gray-200 text-sm">
              <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="mr-3 truncate">{photo.location}</span>
              <Clock className="h-4 w-4 mr-1 flex-shrink-0" />
              <span>{formatYear(photo.year)}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default SampleGallery;