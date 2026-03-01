import { MapPin } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import PageHeader from '../PageHeader';
import Footer from '../Footer';

const MapViewSkeleton = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 flex flex-col">
      <PageHeader title="Vremeplov.hr" fixed={false} />

      {/* Hero section skeleton */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-12">
        <div className="container max-w-5xl mx-auto px-4 text-center">
          <div className="h-9 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto mb-3" />
          <div className="h-6 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
        </div>
      </div>

      {/* Filters skeleton */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-4">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-10 flex-1 md:flex-initial md:max-w-xs bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse md:ml-auto" />
          </div>
        </div>
      </div>

      {/* Map skeleton */}
      <div className="container max-w-6xl mx-auto px-4 py-6 flex-1">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="h-[50vh] md:h-[60vh] lg:h-[600px] bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">{t('mapView.loadingMemoryMap')}</p>
            </div>
          </div>
        </div>

        {/* Photo grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/3" />
                <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Statistics skeleton */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm text-center">
              <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto mb-2" />
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>

        {/* Info box skeleton */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="h-5 w-48 bg-blue-200 dark:bg-blue-800 rounded animate-pulse mb-2" />
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-blue-200 dark:bg-blue-800 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MapViewSkeleton;
