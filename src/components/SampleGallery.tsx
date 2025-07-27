import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Skeleton } from './ui/skeleton'
import { Clock, MapPin, Image } from "lucide-react";
import { Link } from 'react-router-dom';
import { photoService, Photo } from "../services/firebaseService";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className, onError }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div ref={imgRef} className={className}>
      {!isLoaded && (
        <Skeleton className="w-full h-full absolute inset-0" />
      )}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={onError}
        />
      )}
    </div>
  );
};
const SampleGallery = () => {
  const [recentPhotos, setRecentPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

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

   const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=1932';
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
      <div className="text-center py-12">
        <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No photos yet</h3>
        <p className="text-gray-600">
          Be the first to share a historical photo and help preserve Croatian heritage!
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
              alt={`${photo.location}, ${photo.year}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={handleImageError}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-80"></div>
          <div className="absolute bottom-0 left-0 p-4 w-full">
            <h3 className="text-white text-lg font-semibold">{photo.description}</h3>
            <div className="flex items-center mt-2 text-gray-200 text-sm">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="mr-3">{photo.location}</span>
              <Clock className="h-4 w-4 mr-1" />
              <span>{photo.year}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default SampleGallery;