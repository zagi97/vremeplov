// src/hooks/admin/useStoryModeration.ts
import { useState } from 'react';
import { storyService, Story } from '../../services/firebaseService';
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
      toast.success('Story approved successfully');
    } catch (error) {
      console.error('Error approving story:', error);
      toast.error('Failed to approve story');
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    try {
      await storyService.deleteStory(storyId);
      setAllStories(prev => prev.filter(s => s.id !== storyId));
      toast.success('Story deleted successfully');
    } catch (error) {
      console.error('Error deleting story:', error);
      toast.error('Failed to delete story');
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
    handleDeleteStory,
  };
}
