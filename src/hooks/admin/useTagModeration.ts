// src/hooks/admin/useTagModeration.ts
import { useState, useCallback, useEffect } from 'react';
import { TaggedPerson, photoService, tagService } from '@/services/firebaseService';
import { sendNotification } from '@/services/notificationService';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export function useTagModeration() {
  const { t } = useLanguage();
  const [pendingTags, setPendingTags] = useState<TaggedPerson[]>([]);
  const [allTags, setAllTags] = useState<TaggedPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagPage, setTagPage] = useState(1);

  const loadTags = useCallback(async () => {
    try {
      setLoading(true);
      const allTaggedPersons = await tagService.getAllTaggedPersonsForAdmin();
      const pendingTaggedPersons = allTaggedPersons.filter(tag => !tag.isApproved);

      setPendingTags(pendingTaggedPersons);
      setAllTags(allTaggedPersons);

      return allTaggedPersons;
    } catch (error) {
      console.error('Error loading tags:', error);
      toast.error(t('errors.adminDataLoadFailed'));
      return [];
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleApproveTag = useCallback(async (tagId: string, adminUid: string, currentPendingTags: TaggedPerson[]) => {
    try {
      const tag = currentPendingTags.find(t => t.id === tagId);

      if (!tag) {
        toast.error('Tag not found');
        return;
      }

      // 🔥 OPTIMISTIC UI UPDATE - immediately remove from pending
      setPendingTags(prev => prev.filter(t => t.id !== tagId));
      setAllTags(prev => prev.map(t => t.id === tagId ? { ...t, isApproved: true } : t));

      const photo = await photoService.getPhotoById(tag.photoId);

      await tagService.approveTaggedPerson(tagId, adminUid);

      if (tag.addedByUid) {
        await sendNotification({
          userId: tag.addedByUid,
          type: 'tag_approved',
          photoId: tag.photoId,
          taggedPersonName: tag.name
        });
      }

      toast.success(t('admin.tagApproved'));

      // Background refresh to sync with Firestore
      loadTags();
    } catch (error) {
      console.error('Error approving tag:', error);
      toast.error(t('errors.photoTagApprovalFailed'));
      // Rollback on error
      await loadTags();
    }
  }, [t, loadTags]);

  const handleRejectTag = useCallback(async (tagId: string, currentPendingTags: TaggedPerson[]) => {
    try {
      const tag = currentPendingTags.find(t => t.id === tagId);

      if (!tag) {
        toast.error('Tag not found');
        return;
      }

      // 🔥 OPTIMISTIC UI UPDATE - immediately remove from pending
      setPendingTags(prev => prev.filter(t => t.id !== tagId));
      setAllTags(prev => prev.filter(t => t.id !== tagId));

      if (tag.addedByUid) {
        await sendNotification({
          userId: tag.addedByUid,
          type: 'tag_rejected',
          photoId: tag.photoId,
          taggedPersonName: tag.name,
          reason: 'Tag je odbijen jer ne zadovoljava kriterije kvalitete.'
        });
      }

      await tagService.rejectTaggedPerson(tagId);
      toast.success(t('admin.tagRejected'));

      // Background refresh to sync with Firestore
      loadTags();
    } catch (error) {
      console.error('Error rejecting tag:', error);
      toast.error(t('errors.photoTagRejectionFailed'));
      // Rollback on error
      await loadTags();
    }
  }, [t, loadTags]);

  const handleEditTag = useCallback(async (tagId: string, updates: Partial<TaggedPerson>) => {
    try {
      await tagService.updateTaggedPerson(tagId, updates);
      toast.success(t('admin.tagUpdated'));
      await loadTags();
    } catch (error) {
      console.error('Error updating tag:', error);
      toast.error(t('errors.photoTagUpdateFailed'));
    }
  }, [t, loadTags]);

  // ✅ DODAJTE OVO: Pozovite loadTags samo jednom nakon montiranja hooka
  useEffect(() => {
    loadTags();
  }, [loadTags]); // Ovisnost o loadTags je potrebna jer je loadTags useCallback

  return {
    // State
    pendingTags,
    allTags,
    tags: allTags, // Alias for backwards compatibility
    loading,
    tagPage,

    // Setters
    setTagPage,

    // Actions
    loadTags,
    handleApproveTag,
    handleRejectTag,
    handleEditTag,
  };
}
