// src/pages/Stories.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { BookOpen, MapPin, Calendar, User, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { storyService, Story } from '../services/firebaseService';
import { useLanguage } from '../contexts/LanguageContext';
import { formatFullDate } from '../utils/dateUtils';
import PageHeader from '@/components/PageHeader';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import LoadingScreen from '@/components/LoadingScreen';
import EmptyState from '@/components/EmptyState';

const STORIES_PER_PAGE = 10;

const Stories = () => {
  const { t } = useLanguage();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const loadStories = async () => {
      try {
        setLoading(true);
        const recentStories = await storyService.getRecentStories(200);
        setStories(recentStories);
      } catch (error) {
        console.error('Error loading stories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStories();
  }, []);


  // Filter stories by search text
  const filteredStories = useMemo(() => {
    if (!searchText.trim()) return stories;
    const lower = searchText.toLowerCase().trim();
    return stories.filter(s =>
      s.title.toLowerCase().includes(lower) ||
      s.content.toLowerCase().includes(lower) ||
      s.location.toLowerCase().includes(lower) ||
      s.authorName.toLowerCase().includes(lower)
    );
  }, [stories, searchText]);

  // Reset page on search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText]);

  const totalPages = Math.ceil(filteredStories.length / STORIES_PER_PAGE);
  const startIndex = (currentPage - 1) * STORIES_PER_PAGE;
  const currentStories = filteredStories.slice(startIndex, startIndex + STORIES_PER_PAGE);

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
    return <LoadingScreen message={t('stories.loading')} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-gray-900">
      <SEO
        title={t('stories.pageTitle')}
        description={t('stories.pageDescription')}
        url="/stories"
      />
      <PageHeader title="Vremeplov.hr" />

      {/* Hero */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-10 mt-16 shadow-sm">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <BookOpen className="h-10 w-10 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            {t('stories.pageTitle')}
            {stories.length > 0 && (
              <span className="text-lg sm:text-xl md:text-2xl font-normal text-gray-500 dark:text-gray-400 ml-2">
                ({stories.length})
              </span>
            )}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t('stories.pageDescription')}
          </p>
        </div>
      </div>

      {/* Stories list */}
      <section className="py-8 px-4 flex-1">
        <div className="container max-w-4xl mx-auto">
          {/* Search bar */}
          <div className="mb-6 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={t('stories.searchPlaceholder') || 'Pretraži priče...'}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                />
              </div>
              {searchText && (
                <Button
                  variant="ghost"
                  onClick={() => setSearchText('')}
                  className="text-red-500 hover:text-red-600 dark:text-red-400 px-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Result count - only when searching */}
            {searchText && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filteredStories.length} {t('common.of')} {stories.length}
              </p>
            )}
          </div>

          {filteredStories.length === 0 ? (
            stories.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title={t('stories.noStories')}
                description={t('stories.noStoriesDesc')}
              />
            ) : (
              <EmptyState
                icon={Search}
                title={t('stories.noResults') || 'Nema rezultata'}
                description={t('stories.noResultsDesc') || 'Pokušajte promijeniti pretragu.'}
                action={{
                  label: t('stories.clearSearch') || 'Očisti pretragu',
                  onClick: () => setSearchText(''),
                }}
              />
            )
          ) : (
            <>
              <div className="space-y-4">
                {currentStories.map((story) => (
                  <Link key={story.id} to={`/story/${story.id}`} className="block">
                    <Card className="hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700">
                      <CardContent className="p-5 sm:p-6">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-1">
                          {story.title}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
                          {story.content}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {story.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {story.authorName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatFullDate(story.createdAt)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
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

export default Stories;
