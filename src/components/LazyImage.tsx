// Kreirajte novu datoteku: src/components/LazyImage.tsx

import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  fallbackSrc?: string;
  placeholder?: React.ReactNode;
  threshold?: number; // Koliko daleko prije učitavanja (0.0 - 1.0)
  rootMargin?: string; // Margin za Intersection Observer
}

const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  onError,
  placeholder,
  threshold = 0.1,
  rootMargin = '100px' // Počni učitavati 100px prije nego što slika dođe u viewport
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Intersection Observer - detektira kad slika ulazi u viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInView) {
          console.log('LazyImage: Slika ušla u viewport, započinje učitavanje');
          setIsInView(true);
          setIsLoading(true);
          observer.disconnect(); // Prekini praćenje kad se jednom počne učitavati
        }
      },
      { 
        threshold,
        rootMargin
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, isInView]);

  // Handle kada se slika uspješno učita
  const handleLoad = () => {
    console.log('LazyImage: Slika uspješno učitana');
    setIsLoaded(true);
    setIsLoading(false);
    setHasError(false);
  };

  // Handle greška pri učitavanju
  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.warn('LazyImage: Greška pri učitavanju slike');
    setHasError(true);
    setIsLoading(false);
    
    if (onError) {
      onError(e);
    }
  };

  // Default placeholder ako nije poskuton
  const defaultPlaceholder = (
    <div className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}>
      <div className="text-gray-400 text-center">
        <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
        <span className="text-xs">Loading...</span>
      </div>
    </div>
  );

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Placeholder - prikazuje se dok se slika ne učita */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0">
          {placeholder || defaultPlaceholder}
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Glavna slika - učitava se samo kad je u viewport-u */}
      {isInView && (
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy" // Browser native lazy loading kao backup
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className={`flex items-center justify-center bg-gray-100 text-gray-500 ${className}`}>
          <div className="text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-xs">Slika se ne može učitati</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LazyImage;