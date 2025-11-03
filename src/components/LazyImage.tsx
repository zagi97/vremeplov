// src/components/LazyImage.tsx
// ✅ OPTIMIZED VERSION WITH RESPONSIVE SRCSET SUPPORT

import React, { useState, useEffect, useRef } from 'react';

interface ResponsiveImages {
  webp?: Array<{ url: string; width: number; suffix: string }>;
  jpeg?: Array<{ url: string; width: number; suffix: string }>;
  original?: string;
}

interface LazyImageProps {
  src: string; // Main image URL (for backward compatibility)
  alt: string;
  className?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  fallbackSrc?: string;
  placeholder?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  aspectRatio?: string;
  responsiveImages?: ResponsiveImages; // ✅ NEW: Responsive image URLs
}

const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  onError,
  placeholder,
  threshold = 0.1,
  rootMargin = '100px',
  aspectRatio = '4/3',
  responsiveImages // ✅ NEW: Optional responsive images
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // ✅ Intersection Observer - detects when image enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInView) {
          console.log('LazyImage: Image entered viewport, starting load');
          setIsInView(true);
          setIsLoading(true);
          observer.disconnect();
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

  // ✅ Handle successful image load
  const handleLoad = () => {
    console.log('LazyImage: Image loaded successfully');
    setIsLoaded(true);
    setIsLoading(false);
    setHasError(false);
  };

  // ✅ Handle image load error
  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.warn('LazyImage: Error loading image');
    setHasError(true);
    setIsLoading(false);
    
    if (onError) {
      onError(e);
    }
  };

  // ✅ Generate srcset string for responsive images
  const generateSrcSet = (images: Array<{ url: string; width: number }> | undefined): string => {
    if (!images || images.length === 0) return '';
    return images.map(img => `${img.url} ${img.width}w`).join(', ');
  };

  // ✅ Generate sizes attribute (responsive breakpoints)
  const getSizesAttribute = (): string => {
    return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
  };

  // ✅ Default placeholder
  const defaultPlaceholder = (
    <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
      <div className="text-gray-400 text-center">
        <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
        <span className="text-xs">Loading...</span>
      </div>
    </div>
  );

  return (
    <div 
      ref={imgRef} 
      className={`relative overflow-hidden ${className}`}
      style={{ 
        aspectRatio: aspectRatio
      }}
    >
      {/* ✅ Placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0">
          {placeholder || defaultPlaceholder}
        </div>
      )}

      {/* ✅ Loading indicator */}
      {isLoading && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* ✅ RESPONSIVE IMAGE with WebP support */}
      {isInView && (
        <picture>
          {/* WebP source (modern browsers) */}
          {responsiveImages?.webp && responsiveImages.webp.length > 0 && (
            <source
              type="image/webp"
              srcSet={generateSrcSet(responsiveImages.webp)}
              sizes={getSizesAttribute()}
            />
          )}
          
          {/* JPEG fallback source */}
          {responsiveImages?.jpeg && responsiveImages.jpeg.length > 0 && (
            <source
              type="image/jpeg"
              srcSet={generateSrcSet(responsiveImages.jpeg)}
              sizes={getSizesAttribute()}
            />
          )}
          
          {/* Fallback img tag */}
          <img
            ref={imageRef}
            src={responsiveImages?.original || src}
            alt={alt}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
          />
        </picture>
      )}

      {/* ✅ Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
          <div className="text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-xs">Failed to load image</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LazyImage;