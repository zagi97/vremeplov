// src/components/admin/tabs/CommentModerationTab.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { FilterBar } from '@/components/ui/filter-bar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { MessageSquare, User, Image, MapPin, ExternalLink, Flag, Trash2 } from 'lucide-react';
import { useCommentModeration } from '@/hooks/admin/useCommentModeration';

export default function CommentModerationTab() {
  const {
    loading,
    commentPage,
    commentFilter,
    commentSearch,
    commentSort,
    paginatedComments,
    totalCommentPages,
    COMMENTS_PER_PAGE,
    setCommentPage,
    setCommentFilter,
    setCommentSearch,
    setCommentSort,
    handleFlagComment,
    handleUnflagComment,
    handleDeleteComment,
  } = useCommentModeration();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading comments...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">💬 Comment Moderation</h2>
        <Badge variant="secondary">{paginatedComments.length} comments</Badge>
      </div>

      <FilterBar
        searchValue={commentSearch}
        onSearchChange={(value) => {
          setCommentSearch(value);
          setCommentPage(1);
        }}
        searchPlaceholder="🔍 Search comments, users, photos..."
        filterValue={commentFilter}
        onFilterChange={(value) => {
          setCommentFilter(value);
          setCommentPage(1);
        }}
        filterOptions={[
          { value: 'all', label: 'All Comments' },
          { value: 'flagged', label: 'Flagged Only', icon: '⚠️' },
          { value: 'recent', label: 'Last 24h', icon: '🕐' },
        ]}
        sortValue={commentSort}
        onSortChange={setCommentSort}
        sortOptions={[
          { value: 'newest', label: 'Newest First' },
          { value: 'oldest', label: 'Oldest First' },
        ]}
      />

      {paginatedComments.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {commentSearch ? 'No comments match your search' : 'No comments found'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6">
            {paginatedComments.map((comment) => (
              <Card
                key={comment.id}
                className={`overflow-hidden transition-colors ${
                  comment.isFlagged ? 'border-red-300 bg-red-50' : ''
                }`}
              >
                <CardContent className="p-6">
                  {/* Comment Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-3 break-words">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="font-medium">{comment.userName}</span>
                        <span className="text-gray-400 text-sm">•</span>
                        <span className="text-gray-500 text-sm break-words">
                          {comment.userEmail}
                        </span>
                        {comment.isFlagged && (
                          <Badge variant="destructive" className="ml-2">
                            ⚠️ Flagged
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                        <Image className="h-4 w-4 flex-shrink-0" />
                        <span>Photo: {comment.photoTitle}</span>
                        {comment.photoLocation && (
                          <>
                            <span>•</span>
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span>{comment.photoLocation}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <span className="text-muted-foreground text-sm whitespace-nowrap flex-shrink-0">
                      {comment.createdAt?.toDate?.()?.toLocaleDateString('hr-HR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      }) || 'Unknown'}
                    </span>
                  </div>

                  {/* Comment Text */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                    <p className="text-gray-800 leading-relaxed break-words">
                      {comment.text}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/photo/${comment.photoId}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Photo
                    </Button>

                    {!comment.isFlagged ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFlagComment(comment.id!)}
                      >
                        <Flag className="h-4 w-4 mr-1" />
                        Flag
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleUnflagComment(comment.id!)}
                      >
                        <Flag className="h-4 w-4 mr-1" />
                        Unflag
                      </Button>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this comment? The user will
                            receive an email notification explaining that their comment was
                            removed.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteComment(comment)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Comment
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Pagination
            currentPage={commentPage}
            totalPages={totalCommentPages}
            onPageChange={setCommentPage}
            totalItems={paginatedComments.length}
            itemsPerPage={COMMENTS_PER_PAGE}
            itemName="comments"
          />
        </>
      )}
    </div>
  );
}
