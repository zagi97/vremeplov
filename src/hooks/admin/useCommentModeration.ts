// src/hooks/admin/useCommentModeration.ts
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Comment, commentService } from '@/services/firebaseService';
import { sendNotification } from '@/services/notificationService';
import { toast } from 'sonner';
import { ITEMS_PER_PAGE } from '@/constants';
import { useLanguage } from '@/contexts/LanguageContext';

export function useCommentModeration() {
  const { t } = useLanguage();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination and filtering
  const [commentPage, setCommentPage] = useState(1);
  const [commentFilter, setCommentFilter] = useState('all');
  const [commentSearch, setCommentSearch] = useState('');
  const [commentSort, setCommentSort] = useState('newest');

  const COMMENTS_PER_PAGE = ITEMS_PER_PAGE.ADMIN_PHOTOS;

  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      const allComments = await commentService.getAllCommentsForAdmin();
      setComments(allComments);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error(t('admin.commentLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleFlagComment = useCallback(async (commentId: string) => {
    try {
      await commentService.flagComment(commentId);
      toast.success(t('admin.commentFlagged'));
      await loadComments();
    } catch (error) {
      toast.error(t('admin.commentFlagFailed'));
    }
  }, [loadComments, t]);

  const handleUnflagComment = useCallback(async (commentId: string) => {
    try {
      await commentService.unflagComment(commentId);
      toast.success(t('admin.commentUnflagged'));
      await loadComments();
    } catch (error) {
      toast.error(t('admin.commentUnflagFailed'));
    }
  }, [loadComments, t]);

  const handleDeleteComment = useCallback(async (comment: Comment) => {
    try {
      if (comment.userId) {
        await sendNotification({
          userId: comment.userId,
          type: 'comment_deleted',
          photoId: comment.photoId,
          photoTitle: comment.photoTitle
        });
      }

      await commentService.deleteComment(comment.id!);
      toast.success(t('admin.commentDeleted'));
      await loadComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error(t('admin.commentDeleteFailed'));
    }
  }, [loadComments, t]);

  // Filter and sort comments
  const filteredComments = useMemo(() => {
    let filtered = [...comments];

    // Filter by status
    if (commentFilter === 'flagged') {
      filtered = filtered.filter(c => c.isFlagged);
    } else if (commentFilter === 'recent') {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      filtered = filtered.filter(c => {
        const commentDate = c.createdAt?.toDate?.() || new Date(0);
        return commentDate >= dayAgo;
      });
    }

    // Search filter
    if (commentSearch) {
      const searchLower = commentSearch.toLowerCase();
      filtered = filtered.filter(c =>
        c.text.toLowerCase().includes(searchLower) ||
        c.userName?.toLowerCase().includes(searchLower) ||
        c.userEmail?.toLowerCase().includes(searchLower) ||
        c.photoTitle?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.()?.getTime() || 0;
      const dateB = b.createdAt?.toDate?.()?.getTime() || 0;
      return commentSort === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [comments, commentFilter, commentSearch, commentSort]);

  // Pagination
  const totalCommentPages = Math.ceil(filteredComments.length / COMMENTS_PER_PAGE);
  const paginatedComments = filteredComments.slice(
    (commentPage - 1) * COMMENTS_PER_PAGE,
    commentPage * COMMENTS_PER_PAGE
  );

  // ✅ DODAJTE OVO: Pozovite loadComments samo jednom nakon montiranja hooka
  useEffect(() => {
    loadComments();
  }, [loadComments]);

  return {
    // State
    comments,
    loading,
    commentPage,
    commentFilter,
    commentSearch,
    commentSort,
    filteredComments,
    paginatedComments,
    totalCommentPages,
    COMMENTS_PER_PAGE,

    // Setters
    setCommentPage,
    setCommentFilter,
    setCommentSearch,
    setCommentSort,

    // Actions
    loadComments,
    handleFlagComment,
    handleUnflagComment,
    handleDeleteComment,
  };
}
