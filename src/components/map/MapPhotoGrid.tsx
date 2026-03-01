import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, User } from 'lucide-react';
import { Button } from '../ui/button';
import LazyImage from '../LazyImage';
import { formatYear } from '@/utils/dateUtils';
import type { PhotoWithCoordinates } from '@/utils/mapClustering';

interface MapPhotoGridProps {
  photos: PhotoWithCoordinates[];
  t: (key: string) => string;
}

const MapPhotoGrid: React.FC<MapPhotoGridProps> = ({ photos, t }) => {
  const [displayedCount, setDisplayedCount] = useState(12);
  const [loadingMore, setLoadingMore] = useState(false);

  // Reset when photos change
  useEffect(() => {
    setDisplayedCount(12);
  }, [photos.length]);

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayedCount(prev => prev + 12);
      setLoadingMore(false);
    }, 300);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {photos.slice(0, displayedCount).map((photo) => (
          <div key={photo.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-64 overflow-hidden bg-gray-100 dark:bg-gray-700">
              <LazyImage
                src={photo.imageUrl}
                alt={photo.description}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>

            <div className="p-5 space-y-3">
              <h3 className="font-bold text-lg line-clamp-2 min-h-[3.5rem] text-gray-900 dark:text-gray-100">
                {photo.description}
              </h3>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{photo.location}</span>
                </div>

                {photo.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 flex-shrink-0 text-blue-500 dark:text-blue-400" />
                    <span className="truncate text-blue-600 dark:text-blue-400 text-xs">{photo.address}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>{formatYear(photo.year, t)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{photo.author}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
                <span>❤️ {photo.likes || 0}</span>
                <span>👁️ {photo.views || 0}</span>
              </div>

              <Link to={`/photo/${photo.id}`} className="block mt-3">
                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  {t('mapView.viewDetails')}
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {displayedCount < photos.length && (
        <div className="text-center mt-8">
          <Button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8"
          >
            {loadingMore ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t('common.loading')}
              </>
            ) : (
              <>
                📸 {t('mapView.loadMorePhotos')} ({photos.length - displayedCount} {t('mapView.remaining')})
              </>
            )}
          </Button>
        </div>
      )}
    </>
  );
};

export default MapPhotoGrid;
