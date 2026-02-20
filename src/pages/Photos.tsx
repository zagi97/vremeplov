import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Image, MapPin, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { photoService, Photo } from '../services/firebaseService';
import { useLanguage } from '../contexts/LanguageContext';
import { formatYear } from '@/utils/dateUtils';
import LazyImage from '@/components/LazyImage';
import PageHeader from '@/components/PageHeader';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import EmptyState from '@/components/EmptyState';

const PHOTOS_PER_PAGE = 12;

const Photos = () => {
  const { t } = useLanguage();
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        setLoading(true);
        const photos = await photoService.getRecentPhotos(200);
        setAllPhotos(photos);
      } catch (error) {
        console.error('Error loading photos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPhotos();
  }, []);

  const totalPages = Math.ceil(allPhotos.length / PHOTOS_PER_PAGE);
  const startIndex = (currentPage - 1) * PHOTOS_PER_PAGE;
  const currentPhotos = allPhotos.slice(startIndex, startIndex + PHOTOS_PER_PAGE);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-gray-900">
        <PageHeader title="Vremeplov.hr" />
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-10 mt-16 shadow-sm">
          <div className="container max-w-6xl mx-auto px-4 text-center">
            <Skeleton className="h-10 w-10 rounded-full mx-auto mb-4" />
            <Skeleton className="h-8 w-48 mx-auto mb-3" />
            <Skeleton className="h-4 w-80 mx-auto" />
          </div>
        </div>
        <section className="py-12 px-4 flex-1">
          <div className="container max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-lg" />
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-gray-900">
      <SEO
        title={t('photos.pageTitle') || 'Galerija fotografija'}
        description={t('photos.pageDescription') || 'Pregledajte sve povijesne fotografije iz hrvatskih gradova i općina.'}
        url="/photos"
      />
      <PageHeader title="Vremeplov.hr" />

      {/* Hero */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-10 mt-16 shadow-sm">
        <div className="container max-w-6xl mx-auto px-4 text-center">
          <Image className="h-10 w-10 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            {t('photos.pageTitle') || 'Galerija fotografija'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t('photos.pageDescription') || 'Pregledajte sve povijesne fotografije iz hrvatskih gradova i općina.'}
          </p>
          {allPhotos.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {allPhotos.length} {allPhotos.length === 1 ? (t('photos.photo') || 'fotografija') : (t('photos.photosCount') || 'fotografija')}
            </p>
          )}
        </div>
      </div>

      {/* Photo grid */}
      <section className="py-12 px-4 flex-1">
        <div className="container max-w-6xl mx-auto">
          {allPhotos.length === 0 ? (
            <EmptyState
              icon={Image}
              title={t('gallery.noPhotos')}
              description={t('gallery.noPhotosDesc')}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentPhotos.map((photo, index) => (
                  <Link
                    key={photo.id}
                    to={`/photo/${photo.id}`}
                    className="group relative overflow-hidden rounded-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 block bg-white dark:bg-gray-800"
                  >
                    <div className="aspect-[4/3] overflow-hidden relative">
                      <LazyImage
                        src={photo.imageUrl}
                        alt={`${photo.location}, ${formatYear(photo.year, t)}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        responsiveImages={photo.responsiveImages}
                        priority={index < 3 && currentPage === 1}
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-80" />
                    <div className="absolute bottom-0 left-0 p-4 w-full">
                      <h3 className="text-white text-base sm:text-lg font-semibold line-clamp-1">
                        {photo.description}
                      </h3>
                      <div className="flex items-center mt-2 text-gray-200 text-sm">
                        <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="mr-3 truncate">{photo.location}</span>
                        <Clock className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span>{formatYear(photo.year, t)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="dark:border-gray-600 dark:text-gray-300"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {getPageNumbers().map((page, i) =>
                    page === 'ellipsis' ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-gray-400">...</span>
                    ) : (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(page)}
                        className={currentPage === page
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "dark:border-gray-600 dark:text-gray-300"
                        }
                      >
                        {page}
                      </Button>
                    )
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="dark:border-gray-600 dark:text-gray-300"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Photos;
