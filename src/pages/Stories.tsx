// src/pages/Stories.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { BookOpen, MapPin, Calendar, User } from 'lucide-react';
import { storyService, Story } from '../services/firebaseService';
import { useLanguage } from '../contexts/LanguageContext';
import PageHeader from '@/components/PageHeader';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import LoadingScreen from '@/components/LoadingScreen';
import EmptyState from '@/components/EmptyState';

const Stories = () => {
  const { t } = useLanguage();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStories = async () => {
      try {
        setLoading(true);
        const recentStories = await storyService.getRecentStories(50);
        setStories(recentStories);
      } catch (error) {
        console.error('Error loading stories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStories();
  }, []);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('hr-HR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
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
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t('stories.pageDescription')}
          </p>
        </div>
      </div>

      {/* Stories list */}
      <section className="py-12 px-4 flex-1">
        <div className="container max-w-4xl mx-auto">
          {stories.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title={t('stories.noStories')}
              description={t('stories.noStoriesDesc')}
            />
          ) : (
            <div className="space-y-6">
              {stories.map((story) => (
                <Link key={story.id} to={`/story/${story.id}`} className="block">
                  <Card className="hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700">
                    <CardContent className="p-6">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                        {story.title}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-4">
                        {story.content}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
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
                          {formatDate(story.createdAt)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Stories;
