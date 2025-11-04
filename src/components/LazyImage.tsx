// src/components/LazyImage.tsx
// ✅ FINAL VERSION - With Safety Checks!

import React, { useState, useEffect, useRef } from 'react';

interface ResponsiveImages {
  webp?: Array<{ url: string; width: number; suffix: string }>;
  jpeg?: Array<{ url: string; width: number; suffix: string }>;
  original?: string;
}

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  placeholder?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  aspectRatio?: string;
  responsiveImages?: ResponsiveImages;
}

const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  onError,
  placeholder,
  threshold = 0.1,
  rootMargin = '100px',
  aspectRatio = '4/3',  // ← Default value
  responsiveImages
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // ✅ Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInView) {
          setIsInView(true);
          setIsLoading(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin, isInView]);

  // ✅ Handle load/error
  const handleLoad = () => {
    setIsLoaded(true);
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.warn('LazyImage: Error loading', src);
    setHasError(true);
    setIsLoading(false);
    onError?.(e);
  };

  // ✅ Generate srcset - SAFE VERSION
  const generateSrcSet = (images: Array<{ url: string; width: number }> | undefined): string | undefined => {
    if (!images || images.length === 0) return undefined;
    
    try {
      return images
        .sort((a, b) => a.width - b.width)
        .map(img => `${img.url} ${img.width}w`)
        .join(', ');
    } catch (err) {
      console.error('LazyImage: Error generating srcset', err);
      return undefined;
    }
  };

  // ✅ Smart sizes based on aspectRatio
  const getSizesAttribute = (): string => {
    if (aspectRatio === '4/3') {
      return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
    }
    return '(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 1200px';
  };

  // ✅ SAFE: Smart fallback src
  const getFallbackSrc = (): string => {
    try {
      // Priority 1: Original
      if (responsiveImages?.original) {
        return responsiveImages.original;
      }
      
      // Priority 2: Largest WebP
      if (responsiveImages?.webp && responsiveImages.webp.length > 0) {
        const largest = responsiveImages.webp.reduce((prev, curr) => 
          curr.width > prev.width ? curr : prev
        );
        return largest.url;
      }
      
      // Priority 3: Largest JPEG
      if (responsiveImages?.jpeg && responsiveImages.jpeg.length > 0) {
        const largest = responsiveImages.jpeg.reduce((prev, curr) => 
          curr.width > prev.width ? curr : prev
        );
        return largest.url;
      }
    } catch (err) {
      console.error('LazyImage: Error in fallback logic', err);
    }
    
    // Priority 4: Legacy fallback
    return src;
  };

  // ✅ Placeholder
  const defaultPlaceholder = (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
  );

  // ✅ SAFE: CSS aspect-ratio syntax
  const getAspectRatioStyle = (): React.CSSProperties => {
    try {
      // ✅ SAFETY CHECK: Validate aspectRatio prop
      if (!aspectRatio || aspectRatio === 'auto') {
        return {};
      }
      
      // ✅ SAFETY CHECK: Only process if it contains '/'
      if (aspectRatio.includes('/')) {
        return { aspectRatio: aspectRatio.replace('/', ' / ') };
      }
      
      // ✅ SAFETY CHECK: If already valid format (e.g., "4 / 3")
      return { aspectRatio };
      
    } catch (err) {
      console.error('LazyImage: Error setting aspect ratio', err);
      return {};
    }
  };

  return (
    <div 
      ref={imgRef} 
      className={`relative overflow-hidden bg-gray-100 ${className}`}
      style={getAspectRatioStyle()}
    >
      {/* Placeholder */}
      {!isLoaded && !hasError && (placeholder || defaultPlaceholder)}

      {/* Loading spinner */}
      {isLoading && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      )}

      {/* ✅ RESPONSIVE IMAGE - Only render if in view */}
      {isInView && !hasError && (
        <picture>
          {/* WebP source */}
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
          
          {/* Img tag with smart fallback */}
          <img
            src={getFallbackSrc()}
            alt={alt}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
            decoding="async"
          />
        </picture>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
          <div className="text-center p-4">
            <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">Failed to load image</p>
            <p className="text-xs text-gray-400 mt-1">Try refreshing the page</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LazyImage;