// src/hooks/usePhotoDetails.ts
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { photoService, Photo, tagService, viewService, TaggedPerson } from "@/services/firebaseService";
import { likeService } from '@/services/photo/likeService';
import { notificationService } from '@/services/notificationService';
import { authService } from '@/services/authService';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from "sonner";
import { translateWithParams } from '@/contexts/LanguageContext';
import { User } from 'firebase/auth';

const MAX_TAGS_PER_PHOTO = 10;
const MAX_TAGS_PER_DAY = 20;
const MAX_TAGS_PER_HOUR = 10;

interface UsePhotoDetailsProps {
  photoId: string | undefined;
  user: User | null;
  t: (key: string) => string;
}

export const usePhotoDetails = ({ photoId, user, t }: UsePhotoDetailsProps) => {
  const navigate = useNavigate();

  const [photo, setPhoto] = useState<Photo | null>(null);
  const [relatedPhotos, setRelatedPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [taggedPersons, setTaggedPersons] = useState<TaggedPerson[]>([]);
  const [likes, setLikes] = useState(0);
  const [views, setViews] = useState(0);
  const [userHasLiked, setUserHasLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState({
    tagsInLastHour: 0,
    tagsInLastDay: 0,
    canTag: true,
    reason: ''
  });

  // ✅ Function to reload tags only - wrapped in useCallback
  const reloadTags = useCallback(async () => {
    if (!photoId || !photo) {
      console.log('🔍 [RELOAD] Skipped - no photoId or photo', { photoId, hasPhoto: !!photo });
      return;
    }

    try {
      console.log('🔍 [RELOAD] Starting reload for photoId:', photoId);
      let taggedPersonsData: TaggedPerson[] = [];

      if (authService.isAdmin(user)) {
        taggedPersonsData = await tagService.getTaggedPersonsByPhotoIdForAdmin(photoId);
        console.log('🔍 [RELOAD] Admin loaded tags:', taggedPersonsData);
      } else if (photo.authorId === user?.uid && user) {
        taggedPersonsData = await tagService.getTaggedPersonsForPhotoOwner(photoId, user.uid);
        console.log('🔍 [RELOAD] Owner loaded tags:', taggedPersonsData);
      } else {
        taggedPersonsData = await tagService.getTaggedPersonsByPhotoId(photoId);
        console.log('🔍 [RELOAD] Public loaded tags:', taggedPersonsData);
      }

      const photoTaggedPersons = photo.taggedPersons || [];

      const allTaggedPersons = [
        ...taggedPersonsData,
        ...photoTaggedPersons.map((person, index) => ({
          id: `photo_${index}`,
          name: person.name,
          x: person.x,
          y: person.y,
          photoId: photoId,
          addedBy: 'System',
          addedByUid: photo.authorId,
          isApproved: true,
          createdAt: Timestamp.now()
        }))
      ];

      console.log('🔍 [RELOAD] All tagged persons (before filter):', allTaggedPersons);

      let visibleTags = allTaggedPersons;

      if (!authService.isAdmin(user)) {
        visibleTags = allTaggedPersons.filter(tag => {
          const approved = tag.isApproved === true;
          const userOwned = tag.isApproved === false && tag.addedByUid === user?.uid;
          const photoOwned = tag.isApproved === false && photo.authorId === user?.uid;
          console.log(`🔍 [RELOAD] Tag "${tag.name}":`, {
            isApproved: tag.isApproved,
            approved,
            userOwned,
            photoOwned,
            visible: approved || userOwned || photoOwned
          });
          if (approved) return true;
          if (userOwned) return true;
          if (photoOwned) return true;
          return false;
        });
      }

      console.log('🔍 [RELOAD] Final visible tags:', visibleTags);
      setTaggedPersons(visibleTags);
    } catch (error) {
      console.error('❌ [RELOAD] Error reloading tags:', error);
    }
  }, [photoId, photo, user]);

  // Load photo data
  useEffect(() => {
    const loadPhotoData = async () => {
      if (!photoId) return;

      try {
        setLoading(true);

        // Load photo
        const photoData = await photoService.getPhotoById(photoId);

        // Handle missing photo
        if (!photoData) {
          toast.error(t('photoDetail.notFound'));
          navigate('/');
          return;
        }

        // CHECK PENDING STATUS
        if (photoData.isApproved === false) {
          const isAdmin = authService.isAdmin(user);
          const isOwner = user?.uid === photoData.authorId;

          if (isOwner && !isAdmin) {
            toast.info('Ovo je tvoja fotografija koja čeka odobrenje.', {
              duration: 5000,
              icon: '⏳'
            });
          } else if (isAdmin) {
            toast.info('Admin pregled: Pending fotografija', {
              duration: 3000,
              icon: '👑'
            });
          }
        }

        // Set photo data
        setPhoto(photoData);
        setLikes(photoData.likes || 0);
        setViews(photoData.views || 0);

        if (user?.uid) {
          const userId = user.uid; // Capture value to prevent race condition
          const hasLiked = await likeService.hasUserLiked(photoId, userId);
          setUserHasLiked(hasLiked);

          await viewService.incrementViews(photoId, userId);
        }

        // Tagged Persons
        let taggedPersonsData: TaggedPerson[] = [];

        try {
          if (authService.isAdmin(user)) {
            taggedPersonsData = await tagService.getTaggedPersonsByPhotoIdForAdmin(photoId);
          } else if (photoData.authorId === user?.uid && user) {
            taggedPersonsData = await tagService.getTaggedPersonsForPhotoOwner(photoId, user.uid);
          } else {
            taggedPersonsData = await tagService.getTaggedPersonsByPhotoId(photoId);
          }
        } catch (tagError) {
          console.warn('Could not load tagged persons:', tagError);
          taggedPersonsData = [];
        }

        const photoTaggedPersons = photoData.taggedPersons || [];

        const allTaggedPersons = [
          ...taggedPersonsData,
          ...photoTaggedPersons.map((person, index) => ({
            id: `photo_${index}`,
            name: person.name,
            x: person.x,
            y: person.y,
            photoId: photoId,
            addedBy: 'System',
            addedByUid: photoData.authorId,
            isApproved: true,
            createdAt: Timestamp.now()
          }))
        ];

        let visibleTags = allTaggedPersons;

        if (!authService.isAdmin(user)) {
          visibleTags = allTaggedPersons.filter(tag => {
            if (tag.isApproved === true) return true;
            if (tag.isApproved === false && tag.addedByUid === user?.uid) return true;
            if (tag.isApproved === false && photoData.authorId === user?.uid) return true;
            return false;
          });
        }

        setTaggedPersons(visibleTags);

        // Load related photos
        if (photoData.location) {
          const locationPhotos = await photoService.getPhotosByLocation(photoData.location);
          const related = locationPhotos.filter(p => p.id !== photoId).slice(0, 6);
          setRelatedPhotos(related);
        }

      } catch (error: unknown) {
        console.error('❌ Error loading photo:', error);

        // FIRESTORE PERMISSION DENIED
        const isFirebaseError = (err: unknown): err is { code: string; message: string } => {
          return typeof err === 'object' && err !== null && 'code' in err;
        };

        if (isFirebaseError(error) &&
            (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions'))) {
          toast.error('Nemate pristup ovoj fotografiji.', {
            duration: 4000,
            icon: '🔒'
          });
          navigate('/');
          return;
        }

        // Generic error
        toast.error(t('upload.error'));
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadPhotoData();
  }, [photoId, user, t, navigate]);

  // ✅ Refresh tags when page regains focus (e.g., returning from admin dashboard)
  useEffect(() => {
    if (!photo) return; // Only set up listener after photo is loaded

    const handleFocus = () => {
      console.log('🔄 Page focused - reloading tags...');
      reloadTags();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [photo, reloadTags]);

  // Check rate limits
  const checkUserTagRateLimit = async () => {
    if (!user) return;

    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const tagsRef = collection(db, 'taggedPersons');
      const q = query(tagsRef, where('addedByUid', '==', user.uid));

      const snapshot = await getDocs(q);
      const userTags = snapshot.docs
        .map(doc => ({
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        }))
        .filter(t => t.createdAt && t.createdAt > oneDayAgo);

      const tagsInLastHour = userTags.filter(
        t => t.createdAt && t.createdAt > oneHourAgo
      ).length;

      const tagsInLastDay = userTags.length;

      let canTag = true;
      let reason = '';

      if (taggedPersons.length >= MAX_TAGS_PER_PHOTO) {
        canTag = false;
        reason = `Maksimalno ${MAX_TAGS_PER_PHOTO} osoba po fotografiji`;
      } else if (tagsInLastHour >= MAX_TAGS_PER_HOUR) {
        canTag = false;
        reason = `Dostigao si satni limit (${MAX_TAGS_PER_HOUR} tagova/sat)`;
      } else if (tagsInLastDay >= MAX_TAGS_PER_DAY) {
        canTag = false;
        reason = `Dostigao si dnevni limit (${MAX_TAGS_PER_DAY} tagova/dan)`;
      }

      setRateLimitInfo({ tagsInLastHour, tagsInLastDay, canTag, reason });
    } catch (error) {
      console.error('Error checking tag rate limit:', error);
    }
  };

  useEffect(() => {
    if (!user || !photoId) return;
    checkUserTagRateLimit();
  }, [user, photoId, taggedPersons.length]);

  // Handle adding tags
  const handleAddTag = async (newTag: { name: string; x: number; y: number }) => {
    if (!photoId || !user) return;

    try {
      const tagId = await tagService.addTaggedPerson({
        photoId,
        name: newTag.name,
        x: newTag.x,
        y: newTag.y,
        description: '',
        addedBy: user.displayName || user.email || 'User'
      });

      // Add tag to local state with pending status
      const newTagWithId = {
        id: tagId,
        name: newTag.name,
        x: newTag.x,
        y: newTag.y,
        photoId,
        addedBy: user.displayName || user.email || 'User',
        addedByUid: user.uid,
        isApproved: false,
        createdAt: Timestamp.now()
      };

      setTaggedPersons([...taggedPersons, newTagWithId]);

      toast.success(
        translateWithParams(t, 'photoDetail.tagPending', { name: newTag.name }),
        { duration: 4000 }
      );
    } catch (error) {
      console.error('Error adding tag:', error);
      toast.error(t('photoDetail.tagSaveFailed'));
    }
  };

  // Handle like
const handleLike = async () => {
  if (!photoId || likeLoading) {
    return;
  }

  if (!user) {
    toast.error(t('photoDetail.signInMessage'));
    return;
  }

  // ✅ Sačuvaj originalne vrijednosti PRIJE bilo kakvih promjena
  const originalLiked = userHasLiked;
  const originalLikes = likes;

  try {
    setLikeLoading(true);

    console.log('🔵 BEFORE toggleLike:', { userHasLiked, likes });

    // ✅ OPTIMISTIC UPDATE: Update UI immediately
    const optimisticLiked = !userHasLiked;
    const optimisticLikes = optimisticLiked ? likes + 1 : Math.max(0, likes - 1);

    setUserHasLiked(optimisticLiked);
    setLikes(optimisticLikes);

    console.log('🟡 OPTIMISTIC UPDATE:', { optimisticLiked, optimisticLikes });

    // Koristi likeService za prebacivanje lajka
    const result = await likeService.toggleLike(photoId, user.uid);

    console.log('🟢 AFTER toggleLike:', { result, liked: result.liked, newLikesCount: result.newLikesCount });

    // ✅ SYNC with server response (in case of mismatch)
    setLikes(result.newLikesCount);
    setUserHasLiked(result.liked);

    console.log('🟣 AFTER setState:', { newUserHasLiked: result.liked, newLikes: result.newLikesCount });

    // Send notification ONLY if user liked (not unliked)
    if (result.liked && photo?.uploadedBy && photo.uploadedBy !== user.uid) {
      try {
        await notificationService.notifyNewLike(
          photo.uploadedBy,
          user.uid,
          user.displayName || 'Anonymous',
          photoId,
          photo.description || 'untitled',
          user.photoURL || undefined
        );
      } catch (notifError) {
        console.error('❌ [LIKE] Failed to send notification:', notifError);
      }
    }

    if (result.liked) {
      toast.success(t('photoDetail.photoLiked'));
    } else {
      toast.success(t('photoDetail.photoUnliked'));
    }

  } catch (error) {
    console.error('❌ [LIKE] Error:', error);

    // ✅ ROLLBACK na ORIGINALNE vrijednosti (ne invertiraj ponovno!)
    setUserHasLiked(originalLiked);
    setLikes(originalLikes);

    toast.error(t('photoDetail.likeFailed'));
  } finally {
    setLikeLoading(false);
  }
};

  return {
    photo,
    relatedPhotos,
    loading,
    taggedPersons,
    likes,
    views,
    userHasLiked,
    likeLoading,
    rateLimitInfo,
    handleAddTag,
    handleLike,
    checkUserTagRateLimit,
    reloadTags,
    MAX_TAGS_PER_PHOTO,
    MAX_TAGS_PER_HOUR,
    MAX_TAGS_PER_DAY
  };
};
