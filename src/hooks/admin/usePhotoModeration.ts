// src/hooks/admin/usePhotoModeration.ts
import { useState, useCallback, useEffect } from 'react';
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

  // 🔄 Universal loader
  const loadPhotos = useCallback(async () => {
    try {
      setLoading(true);
      const photos = await photoService.getAllPhotosForAdmin();

      const pending = photos.filter(p => !p.isApproved);
      const approved = photos.filter(p => p.isApproved === true);

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

  // ✅ APPROVE (Optimistic)
  const handleApprovePhoto = useCallback(async (photoId: string, adminUid: string) => {
    try {
      const photo = await photoService.getPhotoById(photoId);
      if (!photo) {
        toast.error('Photo not found');
        return;
      }

      // 🔥 OPTIMISTIC UI UPDATE
      setPendingPhotos(prev => prev.filter(p => p.id !== photoId));
      setApprovedPhotos(prev => [...prev, { ...photo, isApproved: true }]);
      setAllPhotos(prev => prev.map(p => p.id === photoId ? { ...p, isApproved: true } : p));

      // Firestore update (photoService.approvePhoto already handles notification)
      await photoService.approvePhoto(photoId, adminUid);

      toast.success('Fotografija odobrena i statistike ažurirane! 🎉');

      // Background sync
      loadPhotos();

    } catch (error) {
      console.error('❌ Error approving photo:', error);
      toast.error(t('errors.photoApprovalFailed'));
    }
  }, [t, loadPhotos]);

  // ❌ REJECT (Optimistic)
  const handleRejectPhoto = useCallback(async (photoId: string, reason: string) => {
    try {
      const photo = await photoService.getPhotoById(photoId);
      if (!photo) {
        toast.error('Photo not found');
        return;
      }

      // 🔥 OPTIMISTIC
      setPendingPhotos(prev => prev.filter(p => p.id !== photoId));
      setAllPhotos(prev => prev.filter(p => p.id !== photoId));

      if (photo.authorId && reason) {
        await sendNotification({
          userId: photo.authorId,
          type: 'photo_rejected',
          photoId,
          photoTitle: photo.description || 'Nepoznata fotografija',
          reason
        });
      }

      await photoService.deletePhoto(photoId);

      toast.success(t('admin.photoRejected'));
      loadPhotos(); // background

    } catch (error) {
      console.error('Error rejecting photo:', error);
      toast.error(t('errors.photoDeleteFailed'));
    }
  }, [t, loadPhotos]);

  // ✏ EDIT (Optimistic)
  const handleEditPhoto = useCallback(async (photoId: string, updates: Partial<Photo>) => {
    try {
      const originalPhoto = await photoService.getPhotoById(photoId);
      if (!originalPhoto) {
        toast.error('Photo not found');
        return;
      }

      // 🔥 OPTIMISTIC
      setAllPhotos(prev => prev.map(p => p.id === photoId ? { ...p, ...updates } : p));
      setPendingPhotos(prev => prev.map(p => p.id === photoId ? { ...p, ...updates } : p));
      setApprovedPhotos(prev => prev.map(p => p.id === photoId ? { ...p, ...updates } : p));

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
          photoId,
          photoTitle: originalPhoto.description,
          changes: changes.join('; ')
        });
      }

      toast.success(t('admin.photoUpdated'));
      loadPhotos();

    } catch (error) {
      console.error('Error updating photo:', error);
      toast.error(t('errors.photoUpdateFailed'));
    }
  }, [t, loadPhotos]);

  // 🗑 DELETE (Optimistic)
  const handleDeletePhoto = useCallback(async (photoId: string, reason: string) => {
    try {
      const photo = await photoService.getPhotoById(photoId);
      if (!photo) {
        toast.error('Photo not found');
        return;
      }

      // 🔥 OPTIMISTIC
      setPendingPhotos(prev => prev.filter(p => p.id !== photoId));
      setApprovedPhotos(prev => prev.filter(p => p.id !== photoId));
      setAllPhotos(prev => prev.filter(p => p.id !== photoId));

      if (photo.authorId && reason) {
        await sendNotification({
          userId: photo.authorId,
          type: 'photo_deleted',
          photoId,
          photoTitle: photo.description,
          reason
        });
      }

      await photoService.deletePhoto(photoId);

      toast.success(t('admin.photoDeleted'));
      loadPhotos();

    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error(t('errors.photoDeleteFailed'));
    }
  }, [t, loadPhotos]);
  
// ✅ DODAJTE OVO PRIJE return BLOKA:
  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  
  return {
    pendingPhotos,
    approvedPhotos,
    allPhotos,
    loading,
    pendingPhotoPage,
    approvedPhotoPage,
    setPendingPhotoPage,
    setApprovedPhotoPage,
    loadPhotos,
    handleApprovePhoto,
    handleRejectPhoto,
    handleEditPhoto,
    handleDeletePhoto,
  };
}
