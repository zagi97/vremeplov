import React from 'react';
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { MessageSquare, Send, LogIn, AlertTriangle, TrendingUp } from "lucide-react";
import { CharacterCounter } from "./ui/character-counter";
import { translateWithParams } from "../contexts/LanguageContext";
import { usePhotoComments } from '@/hooks/usePhotoComments';
import CommentItem from './comments/CommentItem';

interface PhotoCommentsProps {
  photoId: string;
  photoAuthor?: string;
  photoAuthorId?: string;
  isPhotoPending?: boolean;
  isStory?: boolean;
  storyTitle?: string;
}

const PhotoComments = ({ photoId, photoAuthor, photoAuthorId, isPhotoPending = false, isStory = false, storyTitle }: PhotoCommentsProps) => {
  const {
    comments,
    newComment,
    setNewComment,
    loading,
    isSubmitting,
    visibleCount,
    canComment,
    user,
    getRateLimitMessage,
    handleSubmitComment,
    handleSignInToComment,
    loadMoreComments,
    t,
  } = usePhotoComments({ photoId, photoAuthor, photoAuthorId, isPhotoPending, isStory, storyTitle });

  return (
    <div className="mt-8 px-4 sm:px-0">
      <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-900 dark:text-gray-100">
        <MessageSquare className="h-5 w-5 mr-2 flex-shrink-0" />
        <span>
          {translateWithParams(t, 'comments.title', { count: comments.length })}
        </span>
      </h2>

      {user ? (
        <div className="mb-6">
          {/* Pending photo warning */}
          {isPhotoPending && (
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-500 dark:border-yellow-600 rounded">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                    {t('photo.pendingCommentsTitle')}
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    {t('photo.pendingCommentsMessage')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Rate limit warning */}
          {!canComment && !isPhotoPending && (
            <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/30 border-l-4 border-orange-500 dark:border-orange-600 rounded">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-800 dark:text-orange-300 mb-1">
                    {t('rateLimit.commentWarningTitle')}
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-400">
                    {getRateLimitMessage()}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmitComment}>
            <Textarea
              placeholder={t('comments.placeholder')}
              className="min-h-[80px] mb-2 w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={250}
              disabled={!canComment || isSubmitting}
            />
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CharacterCounter currentLength={newComment.length} maxLength={250} />
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!newComment.trim() || !canComment || isSubmitting}
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? t('comments.sending') : t('comments.postComment')}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
          <LogIn className="h-8 w-8 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
          <p className="text-gray-600 dark:text-gray-400 mb-4 px-4">{t('comments.signInMessage')}</p>
          <Button
            onClick={handleSignInToComment}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <LogIn className="h-4 w-4 mr-2" />
            {t('comments.signInToComment')}
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-2">{t('comments.loading')}</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400">
              {t('comments.noComments')}
            </p>
          </div>
        ) : (
          <>
            {comments.slice(0, visibleCount).map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                photoAuthorId={photoAuthorId}
                t={t}
              />
            ))}

            {comments.length > visibleCount && (
              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  onClick={loadMoreComments}
                  className="w-full sm:w-auto"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {t('community.loadMore')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PhotoComments;
