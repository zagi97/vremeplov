// src/hooks/admin/useStoryModeration.ts
import { useState } from 'react';
import { storyService, Story } from '../../services/firebaseService';
import { sendNotification } from '../../services/notificationService';
import { toast } from 'sonner';

export function useStoryModeration() {
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [storyPage, setStoryPage] = useState(1);

  const pendingStories = allStories.filter(s => !s.isApproved);
  const approvedStories = allStories.filter(s => s.isApproved);

  const loadStories = async () => {
    try {
      setLoading(true);
      const stories = await storyService.getAllStoriesForAdmin();
      setAllStories(stories);
      return stories;
    } catch (error) {
      console.error('Error loading stories:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleApproveStory = async (storyId: string, adminUid: string) => {
    try {
      await storyService.approveStory(storyId, adminUid);
      setAllStories(prev =>
        prev.map(s => s.id === storyId ? { ...s, isApproved: true } : s)
      );
      toast.success('Priča odobrena');
    } catch (error) {
      console.error('Error approving story:', error);
      toast.error('Greška pri odobravanju priče');
    }
  };

  const handleRejectStory = async (storyId: string, reason: string) => {
    try {
      const story = allStories.find(s => s.id === storyId);

      // Optimistic update
      setAllStories(prev => prev.filter(s => s.id !== storyId));

      // Send rejection notification to author
      if (story?.authorId && reason) {
        await sendNotification({
          userId: story.authorId,
          type: 'story_rejected',
          storyId,
          storyTitle: story.title || 'Nepoznata priča',
          reason
        });
      }

      await storyService.deleteStory(storyId);
      toast.success('Priča odbijena');
      loadStories();
    } catch (error) {
      console.error('Error rejecting story:', error);
      toast.error('Greška pri odbijanju priče');
    }
  };

  const handleDeleteStory = async (storyId: string, reason: string) => {
    try {
      const story = allStories.find(s => s.id === storyId);

      // Optimistic update
      setAllStories(prev => prev.filter(s => s.id !== storyId));

      // Send deletion notification to author
      if (story?.authorId && reason) {
        await sendNotification({
          userId: story.authorId,
          type: 'story_deleted',
          storyId,
          storyTitle: story.title || 'Nepoznata priča',
          reason
        });
      }

      await storyService.deleteStory(storyId);
      toast.success('Priča obrisana');
      loadStories();
    } catch (error) {
      console.error('Error deleting story:', error);
      toast.error('Greška pri brisanju priče');
    }
  };

  const handleEditStory = async (storyId: string, updates: Partial<Story>) => {
    try {
      // Optimistic update
      setAllStories(prev =>
        prev.map(s => s.id === storyId ? { ...s, ...updates } : s)
      );

      await storyService.updateStory(storyId, updates);
      toast.success('Priča ažurirana');
      loadStories();
    } catch (error) {
      console.error('Error editing story:', error);
      toast.error('Greška pri uređivanju priče');
    }
  };

  return {
    allStories,
    pendingStories,
    approvedStories,
    loading,
    storyPage,
    setStoryPage,
    loadStories,
    handleApproveStory,
    handleRejectStory,
    handleDeleteStory,
    handleEditStory,
  };
}
