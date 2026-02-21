import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { BookOpen, MapPin, Calendar, User, ArrowRight } from 'lucide-react';
import { storyService, Story } from '../services/firebaseService';
import { useLanguage } from '../contexts/LanguageContext';
import { Skeleton } from './ui/skeleton';

const LatestStories = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const loadStories = async () => {
      try {
        const recentStories = await storyService.getRecentStories(3);
        setStories(recentStories);
      } catch (error) {
        console.error('Error loading latest stories:', error);
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
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>{t('home.noStoriesYet')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        {stories.map((story) => (
          <Link key={story.id} to={`/story/${story.id}`} className="block">
            <Card className="hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-5 sm:p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-1">
                  {story.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
                  {story.content}
                </p>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {story.authorName}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {story.location}
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

      <div className="text-center mt-8">
        <Link
          to="/stories"
          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
        >
          {t('home.viewAllStories')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default LatestStories;
