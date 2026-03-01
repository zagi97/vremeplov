import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { BookOpen, Search, X, User, Calendar } from 'lucide-react';
import type { Story } from '../../services/firebaseService';
import { formatFullDate } from '../../utils/dateUtils';
import EmptyState from '../EmptyState';

interface LocationStoriesProps {
  stories: Story[];
  storiesLoading: boolean;
  t: (key: string) => string;
}

const LocationStories: React.FC<LocationStoriesProps> = ({
  stories,
  storiesLoading,
  t,
}) => {
  const [storySearchText, setStorySearchText] = useState('');
  const [visibleStoriesCount, setVisibleStoriesCount] = useState(10);

  // Filter stories by search text
  const filteredStories = useMemo(() => {
    if (!storySearchText.trim()) return stories;
    const lower = storySearchText.toLowerCase().trim();
    return stories.filter(s =>
      s.title.toLowerCase().includes(lower) ||
      s.content.toLowerCase().includes(lower) ||
      s.authorName.toLowerCase().includes(lower)
    );
  }, [stories, storySearchText]);

  // Reset visible stories when search changes
  useEffect(() => {
    setVisibleStoriesCount(10);
  }, [storySearchText]);

  const visibleStories = filteredStories.slice(0, visibleStoriesCount);
  const hasMoreStories = visibleStoriesCount < filteredStories.length;

  if (storiesLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400">{t('stories.loading')}</p>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title={t('stories.noStories')}
        description={t('stories.noStoriesDesc')}
      />
    );
  }

  return (
    <>
      {/* Search bar */}
      <div className="mb-6 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder={t('stories.searchPlaceholder') || 'Pretraži priče...'}
              value={storySearchText}
              onChange={(e) => setStorySearchText(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            />
          </div>
          {storySearchText && (
            <Button
              variant="ghost"
              onClick={() => setStorySearchText('')}
              className="text-red-500 hover:text-red-600 dark:text-red-400 px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {storySearchText && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filteredStories.length} {t('common.of')} {stories.length}
          </p>
        )}
      </div>

      {filteredStories.length === 0 ? (
        <EmptyState
          icon={Search}
          title={t('stories.noResults') || 'Nema rezultata'}
          description={t('stories.noResultsDesc') || 'Pokušajte promijeniti pretragu.'}
          action={{
            label: t('stories.clearSearch') || 'Očisti pretragu',
            onClick: () => setStorySearchText(''),
          }}
        />
      ) : (
        <>
          <div className="space-y-4">
            {visibleStories.map((story) => (
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
                        <Calendar className="h-3 w-3" />
                        {formatFullDate(story.createdAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {hasMoreStories && (
            <div className="mt-8 text-center">
              <Button
                onClick={() => setVisibleStoriesCount(prev => prev + 10)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {t('community.loadMore') || 'Učitaj više'}
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default LocationStories;
