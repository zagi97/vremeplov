// src/components/admin/tabs/StoryModerationTab.tsx
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Check, X, BookOpen, MapPin, User, Calendar } from 'lucide-react';
import type { Story } from '../../../services/firebaseService';

interface StoryModerationTabProps {
  pendingStories: Story[];
  approvedStories: Story[];
  loading: boolean;
  adminUid: string;
  handleApproveStory: (storyId: string, adminUid: string) => void;
  handleDeleteStory: (storyId: string) => void;
}

const formatDate = (timestamp: any) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('hr-HR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function StoryModerationTab({
  pendingStories,
  approvedStories,
  loading,
  adminUid,
  handleApproveStory,
  handleDeleteStory,
}: StoryModerationTabProps) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading stories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Pending Stories */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-orange-500" />
          Pending Stories ({pendingStories.length})
        </h3>

        {pendingStories.length === 0 ? (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="py-8 text-center text-gray-500 dark:text-gray-400">
              No pending stories to review.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingStories.map((story) => (
              <Card key={story.id} className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                        {story.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-4 mb-3">
                        {story.content}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
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
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleApproveStory(story.id!, adminUid)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteStory(story.id!)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Approved Stories */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-green-500" />
          Approved Stories ({approvedStories.length})
        </h3>

        {approvedStories.length === 0 ? (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="py-8 text-center text-gray-500 dark:text-gray-400">
              No approved stories yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {approvedStories.map((story) => (
              <Card key={story.id} className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">
                        {story.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                        {story.content}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {story.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {story.authorName}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteStory(story.id!)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
