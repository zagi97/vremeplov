import type { PhotoWithCoordinates } from '@/utils/mapClustering';

interface MapStatisticsProps {
  photos: PhotoWithCoordinates[];
  availableDecades: number[];
  t: (key: string) => string;
}

const MapStatistics: React.FC<MapStatisticsProps> = ({ photos, availableDecades, t }) => {
  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm text-center">
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">{photos.length}</div>
        <div className="text-gray-600 dark:text-gray-300">{t('mapView.locatedPhotos')}</div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm text-center">
        <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
          {new Set(photos.map(p => p.location)).size}
        </div>
        <div className="text-gray-600 dark:text-gray-300">{t('mapView.cities')}</div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm text-center">
        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
          {photos.filter(p => p.address).length}
        </div>
        <div className="text-gray-600 dark:text-gray-300">{t('mapView.specificAddresses')}</div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm text-center">
        <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
          {availableDecades.length}
        </div>
        <div className="text-gray-600 dark:text-gray-300">{t('mapView.differentDecades')}</div>
      </div>
    </div>
  );
};

export default MapStatistics;
