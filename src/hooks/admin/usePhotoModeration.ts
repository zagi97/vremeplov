// src/hooks/admin/usePhotoModeration.ts
import { useState, useCallback } from 'react';
import { Photo, photoService } from '@/services/firebaseService';
import { sendNotification } from '@/services/notificationService';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export function usePhotoModeration() {
  const { t } = useLanguage();
  const [pendingPhotos, setPendingPhotos] = useState<Photo[]>([]);
  const [approvedPhotos, setApprovedPhotos] = useState<Photo[]>([]);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  const [pendingPhotoPage, setPendingPhotoPage] = useState(1);
  const [approvedPhotoPage, setApprovedPhotoPage] = useState(1);

  const loadPhotos = useCallback(async () => {
    try {
      setLoading(true);

      const photos = await photoService.getAllPhotosForAdmin();
      console.log('All photos from database:', photos);

      const pending = photos.filter(photo =>
        photo.isApproved === undefined ||
        photo.isApproved === null ||
        photo.isApproved === false
      );

      const approved = photos.filter(photo =>
        photo.isApproved === true
      );

      setPendingPhotos(pending);
      setApprovedPhotos(approved);
      setAllPhotos(photos);

      return photos;
    } catch (error) {
      console.error('Error loading photos:', error);
      toast.error(t('errors.adminDataLoadFailed'));
      return [];
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleApprovePhoto = useCallback(async (photoId: string, adminUid: string) => {
    try {
      console.log('🟢 Starting approval process for photo:', photoId);

      const photo = await photoService.getPhotoById(photoId);
      if (!photo) {
        toast.error('Photo not found');
        return;
      }

      await photoService.approvePhoto(photoId, adminUid);

      if (photo.authorId) {
        await sendNotification({
          userId: photo.authorId,
          type: 'photo_approved',
          photoId: photoId,
          photoTitle: photo.description || 'Nepoznata fotografija'
        });
      }

      toast.success('Fotografija odobrena i user statistike ažurirane! 🎉');
      await loadPhotos();
    } catch (error) {
      console.error('❌ Error approving photo:', error);
      toast.error(t('errors.photoApprovalFailed'));
    }
  }, [t, loadPhotos]);

  const handleRejectPhoto = useCallback(async (photoId: string, reason: string) => {
    try {
      console.log('Rejecting (deleting) photo with ID:', photoId);

      const photo = await photoService.getPhotoById(photoId);
      if (!photo) {
        toast.error('Photo not found');
        return;
      }

      if (photo.authorId && reason) {
        await sendNotification({
          userId: photo.authorId,
          type: 'photo_rejected',
          photoId: photoId,
          photoTitle: photo.description || 'Nepoznata fotografija',
          reason: reason
        });
      }

      await photoService.deletePhoto(photoId);

      const currentCount = parseInt(localStorage.getItem('rejectedPhotosCount') || '0', 10);
      localStorage.setItem('rejectedPhotosCount', (currentCount + 1).toString());

      console.log('Photo deleted successfully, updating UI...');
      toast.success(t('admin.photoRejected'));
      await loadPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error(t('errors.photoDeleteFailed'));
    }
  }, [t, loadPhotos]);

  const handleEditPhoto = useCallback(async (photoId: string, updates: Partial<Photo>) => {
    try {
      const originalPhoto = await photoService.getPhotoById(photoId);
      if (!originalPhoto) {
        toast.error('Photo not found');
        return;
      }

      await photoService.updatePhoto(photoId, updates);

      const changes: string[] = [];
      if (updates.author && updates.author !== originalPhoto.author) {
        changes.push(`Autor: "${originalPhoto.author}" → "${updates.author}"`);
      }
      if (updates.description && updates.description !== originalPhoto.description) {
        changes.push(`Opis: "${originalPhoto.description}" → "${updates.description}"`);
      }
      if (updates.year && updates.year !== originalPhoto.year) {
        changes.push(`Godina: "${originalPhoto.year}" → "${updates.year}"`);
      }

      if (originalPhoto.isApproved && originalPhoto.authorId && changes.length > 0) {
        await sendNotification({
          userId: originalPhoto.authorId,
          type: 'photo_edited',
          photoId: photoId,
          photoTitle: originalPhoto.description,
          changes: changes.join('; ')
        });
      }

      toast.success(t('admin.photoUpdated'));
      await loadPhotos();
    } catch (error) {
      console.error('Error updating photo:', error);
      toast.error(t('errors.photoUpdateFailed'));
    }
  }, [t, loadPhotos]);

  const handleDeletePhoto = useCallback(async (photoId: string, reason: string) => {
    try {
      const photo = await photoService.getPhotoById(photoId);
      if (!photo) {
        toast.error('Photo not found');
        return;
      }

      if (photo.authorId && reason) {
        await sendNotification({
          userId: photo.authorId,
          type: 'photo_deleted',
          photoId: photoId,
          photoTitle: photo.description,
          reason: reason
        });
      }

      await photoService.deletePhoto(photoId);

      toast.success(t('admin.photoDeleted'));
      await loadPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error(t('errors.photoDeleteFailed'));
    }
  }, [t, loadPhotos]);

  return {
    // State
    pendingPhotos,
    approvedPhotos,
    allPhotos,
    loading,
    pendingPhotoPage,
    approvedPhotoPage,

    // Setters
    setPendingPhotoPage,
    setApprovedPhotoPage,

    // Actions
    loadPhotos,
    handleApprovePhoto,
    handleRejectPhoto,
    handleEditPhoto,
    handleDeletePhoto,
  };
}
