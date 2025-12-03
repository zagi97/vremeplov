// src/services/photo/photoService.ts
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { db, storage, auth } from '../../lib/firebase';
import { mapDocumentsWithId } from '../../utils/firestoreMappers';
import type { Photo } from '../firebaseService';

// Cache konfiguracija
const CACHE_DURATION = 5 * 60 * 1000; // 5 minuta
const photoCache = new Map<string, { data: Photo[], timestamp: number }>();
const locationCache = new Map<string, { data: Photo[], timestamp: number }>();

const recentPhotosCache: { data: Photo[] | null, timestamp: number } = {
  data: null,
  timestamp: 0
};

// Helper funkcija za cache provjeru
const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_DURATION;
};

// Helper funkcija za cache cleanup
const cleanupCache = () => {
  const now = Date.now();

  for (const [key, value] of photoCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      photoCache.delete(key);
    }
  }

  for (const [key, value] of locationCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      locationCache.delete(key);
    }
  }

  if (now - recentPhotosCache.timestamp > CACHE_DURATION) {
    recentPhotosCache.data = null;
    recentPhotosCache.timestamp = 0;
  }
};

// Run cleanup every 10 minutes
setInterval(cleanupCache, 10 * 60 * 1000);

export class PhotoService {
  private photosCollection = collection(db, 'photos');

  // ========================================
  // PHOTO UPLOAD & STORAGE
  // ========================================

  /**
   * Upload photo file to Firebase Storage
   */
  async uploadPhotoFile(file: File, photoId: string): Promise<string> {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      // Block GIF files
      if (file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif')) {
        throw new Error('🚫 GIF datoteke nisu podržane. Molimo koristite JPG, PNG ili WebP format.');
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Nepodržan format slike: ${file.type}. Dozvoljeni: JPG, PNG, WebP`);
      }

      // Validate file size (20MB)
      const MAX_SIZE = 10 * 1024 * 1024; // Reduced from 20MB to 10MB for security
      if (file.size > MAX_SIZE) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(1);
        throw new Error(`Slika je prevelika (${sizeMB}MB). Maksimalna veličina je 10MB.`);
      }

      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      // ✅ NEW SECURE FORMAT: photos/{userId}/{photoId}/{fileName}
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User must be authenticated to upload photos');

      // ✅ Explicitly set metadata with content type
      const metadata = {
        contentType: file.type,
        customMetadata: {
          uploadedBy: userId,
          photoId: photoId,
          originalFileName: file.name
        }
      };

      const storageRef = ref(storage, `photos/${userId}/${photoId}/${fileName}`);
      const snapshot = await uploadBytes(storageRef, file, metadata);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return downloadURL;

    } catch (error) {
      console.error('❌ Error uploading photo:', error);
      throw error;
    }
  }

  /**
   * Upload generic blob/file to storage
   * ✅ FIXED: Now uses secure path format matching Firebase Storage Rules
   */
  async uploadImage(blob: Blob, fileName: string, userId?: string, photoId?: string): Promise<string> {
    const currentUserId = userId || auth.currentUser?.uid;
    const currentPhotoId = photoId || Date.now().toString();

    try {
      // ✅ Use new secure format: photos/{userId}/{photoId}/{fileName}
      if (!currentUserId) {
        throw new Error('User must be authenticated to upload photos');
      }

      // ✅ Explicitly set metadata with content type
      const metadata = {
        contentType: blob.type,
        customMetadata: {
          uploadedBy: currentUserId,
          photoId: currentPhotoId,
          originalFileName: fileName
        }
      };

      const storageRef = ref(storage, `photos/${currentUserId}/${currentPhotoId}/${fileName}`);
      const snapshot = await uploadBytes(storageRef, blob, metadata);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image blob:', error);
      console.error('Upload details:', {
        fileName,
        blobType: blob.type,
        blobSize: blob.size,
        userId: currentUserId,
        photoId: currentPhotoId
      });
      throw error;
    }
  }

  // ========================================
  // PHOTO CRUD OPERATIONS
  // ========================================

  /**
   * Update photo
   */
  async updatePhoto(photoId: string, updates: Partial<Photo>): Promise<void> {
    try {
      const docRef = doc(this.photosCollection, photoId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating photo:', error);
      throw error;
    }
  }

  /**
   * Delete photo (including from Storage)
   */
  async deletePhoto(photoId: string): Promise<void> {
    try {
      const photoDocRef = doc(this.photosCollection, photoId);
      const photoDoc = await getDoc(photoDocRef);

      if (photoDoc.exists()) {
        const photoData = photoDoc.data();

        // Delete from Storage
        if (photoData.imageUrl) {
          try {
            const url = new URL(photoData.imageUrl);
            const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
            if (pathMatch) {
              const storagePath = decodeURIComponent(pathMatch[1]);
              const storageRef = ref(storage, storagePath);
              await deleteObject(storageRef);
            }
          } catch (storageError) {
            console.error('Error deleting from storage:', storageError);
          }
        }
      }

      await deleteDoc(photoDocRef);

    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }

  /**
   * Check if user can upload today based on tier system
   */
  async canUserUploadToday(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
    uploadsToday: number;
    remainingToday: number;
    userTier: string;
    dailyLimit: number;
    nextTierInfo?: string;
  }> {
    try {
      const { userService, getUserTier, USER_TIER_LIMITS, USER_TIER_REQUIREMENTS, UserTier } = await import('../user');
      const userProfile = await userService.getUserProfile(userId);

      if (!userProfile) {
        return {
          allowed: false,
          reason: 'Korisnički profil nije pronađen.',
          uploadsToday: 0,
          remainingToday: 0,
          userTier: 'UNKNOWN',
          dailyLimit: 0
        };
      }

      const approvedPhotosCount = userProfile.stats?.totalPhotos || 0;
      const userTier = getUserTier(approvedPhotosCount);
      const dailyLimit = USER_TIER_LIMITS[userTier];

      // Check uploads today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const userPhotosToday = query(
        this.photosCollection,
        where('authorId', '==', userId),
        where('createdAt', '>=', Timestamp.fromDate(today))
      );

      const snapshot = await getDocs(userPhotosToday);
      const uploadsToday = snapshot.size;

      const remainingToday = dailyLimit - uploadsToday;

      // Generate next tier info
      let nextTierInfo: string | undefined;
      if (userTier === UserTier.NEW_USER) {
        const needed = USER_TIER_REQUIREMENTS[UserTier.VERIFIED] - approvedPhotosCount;
        nextTierInfo = `Još ${needed} odobrenih slika do Verified statusa (3 slike/dan)`;
      } else if (userTier === UserTier.VERIFIED) {
        const needed = USER_TIER_REQUIREMENTS[UserTier.CONTRIBUTOR] - approvedPhotosCount;
        nextTierInfo = `Još ${needed} odobrenih slika do Contributor statusa (5 slika/dan)`;
      } else if (userTier === UserTier.CONTRIBUTOR) {
        const needed = USER_TIER_REQUIREMENTS[UserTier.POWER_USER] - approvedPhotosCount;
        nextTierInfo = `Još ${needed} odobrenih slika do Power User statusa (10 slika/dan)`;
      }

      if (uploadsToday >= dailyLimit) {
        return {
          allowed: false,
          reason: `Dostignut dnevni limit za ${userTier} tier (${dailyLimit} slika/dan). Pokušaj sutra nakon ponoći.`,
          uploadsToday,
          remainingToday: 0,
          userTier,
          dailyLimit,
          nextTierInfo
        };
      }

      return {
        allowed: true,
        uploadsToday,
        remainingToday,
        userTier,
        dailyLimit,
        nextTierInfo
      };

    } catch (error) {
      console.error('Error checking daily upload limit:', error);
      return {
        allowed: true,
        uploadsToday: 0,
        remainingToday: 1,
        userTier: 'UNKNOWN',
        dailyLimit: 1
      };
    }
  }

  /**
   * Admin approve photo - with stats update
   */
  async approvePhoto(photoId: string, adminUid: string): Promise<void> {
    try {
      console.log('🔵 Starting photo approval for:', photoId, 'by admin:', adminUid);

      const photoDoc = await getDoc(doc(this.photosCollection, photoId));
      if (!photoDoc.exists()) {
        throw new Error('Photo not found');
      }

      const photoData = photoDoc.data();
      const photoAuthorId = photoData.authorId;
      const photoLocation = photoData.location;
      console.log('🔵 Photo data loaded:', {
        photoId,
        authorId: photoAuthorId,
        location: photoLocation,
        description: photoData.description,
        year: photoData.year,
        currentlyApproved: photoData.isApproved
      });

      console.log('🔵 Updating photo document...');
      await updateDoc(doc(this.photosCollection, photoId), {
        isApproved: true,
        approvedAt: Timestamp.now(),
        approvedBy: adminUid
      });
      console.log('✅ Photo document updated successfully');

      // Clear location cache so the photo appears on location page
      console.log('🔵 Clearing location cache for:', photoLocation);
      this.clearLocationCache(photoLocation);
      this.clearRecentPhotosCache();
      console.log('✅ Cache cleared');

      // Update author's stats
      if (photoAuthorId) {
        console.log('🔵 Updating user stats for:', photoAuthorId);
        const { userService } = await import('../user');
        await userService.forceRecalculateUserStats(photoAuthorId);
        console.log('✅ User stats updated');

        console.log('🔵 Checking badges...');
        await userService.checkAndAwardBadges(photoAuthorId);
        console.log('✅ Badges checked');

        // Send notification to author
        console.log('🔵 Sending approval notification to:', photoAuthorId);
        const { notificationService } = await import('../notificationService');
        await notificationService.notifyPhotoApproved(
          photoAuthorId,
          photoId,
          photoData.description || 'Untitled'
        );
        console.log('✅ Notification sent');
      }

      console.log('✅ Photo approval complete! Photo should now appear at location:', photoLocation);
    } catch (error) {
      console.error('❌ Error approving photo:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  /**
   * Add new photo
   */
  async addPhoto(photoData: Omit<Photo, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'views' | 'isApproved'> & { authorId?: string }): Promise<string> {
    try {
      const now = Timestamp.now();
      const currentUser = auth.currentUser;

      if (!currentUser) throw new Error('Not authenticated');

      // Rate limiting check
      const limitCheck = await this.canUserUploadToday(currentUser.uid);
      if (!limitCheck.allowed) {
        throw new Error(limitCheck.reason);
      }

      // Build photo object
      const photo = {
        imageUrl: photoData.imageUrl,
        imageStoragePath: photoData.imageStoragePath,
        year: photoData.year,
        description: photoData.description,
        detailedDescription: photoData.detailedDescription || '',
        author: photoData.author,
        authorId: photoData.authorId || currentUser?.uid,
        uploaderId: currentUser.uid, // ✅ Required by Firestore rules
        location: photoData.location,
        photoType: photoData.photoType,
        taggedPersons: photoData.taggedPersons || [],
        uploadedBy: photoData.uploadedBy || currentUser?.displayName || currentUser?.email || 'Unknown',
        uploadedAt: photoData.uploadedAt || new Date().toISOString(),
        createdAt: now,
        updatedAt: now,
        likes: 0,
        views: 0,
        isApproved: false,
        ...(photoData.coordinates ? { coordinates: photoData.coordinates } : {})
      };

      const docRef = await addDoc(this.photosCollection, photo);

      // Invalidate relevant caches
      this.clearLocationCache(photoData.location);
      this.clearRecentPhotosCache();

      // Update user stats and activities
      if (currentUser?.uid) {
        const { userService } = await import('../user');
        await userService.updateUserStats(currentUser.uid, {
          totalPhotos: 1
        });
        await userService.checkAndAwardBadges(currentUser.uid);
      }

      return docRef.id;
    } catch (error) {
      console.error('Error adding photo:', error);
      throw error;
    }
  }

  // ========================================
  // PHOTO QUERIES
  // ========================================

  /**
   * Get photos with coordinates
   */
  async getPhotosWithCoordinates(): Promise<Photo[]> {
    try {
      const photosQuery = query(
        collection(db, 'photos'),
        where('coordinates', '!=', null),
        where('isApproved', '==', true),
        orderBy('coordinates'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(photosQuery);
      return mapDocumentsWithId<Photo>(querySnapshot.docs);
    } catch (error) {
      console.error('Error fetching photos with coordinates:', error);
      return [];
    }
  }

  /**
   * Update photo coordinates
   */
  async updatePhotoCoordinates(photoId: string, coordinates: {latitude: number, longitude: number, address?: string}): Promise<void> {
    try {
      const photoRef = doc(db, 'photos', photoId);
      await updateDoc(photoRef, { coordinates });
    } catch (error) {
      console.error('Error updating coordinates:', error);
      throw error;
    }
  }

  /**
   * Get photos by location (cached)
   */
  async getPhotosByLocation(location: string): Promise<Photo[]> {
    try {
      const cacheKey = `location_${location}`;
      const cached = locationCache.get(cacheKey);

      if (cached && isCacheValid(cached.timestamp)) {
        return cached.data;
      }

      const q = query(
        this.photosCollection,
        where('location', '==', location),
        where('isApproved', '==', true),
        orderBy('year', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const photos = mapDocumentsWithId<Photo>(querySnapshot.docs);

      locationCache.set(cacheKey, { data: photos, timestamp: Date.now() });

      return photos;
    } catch (error) {
      console.error('Error getting photos by location:', error);
      throw error;
    }
  }

  /**
   * Get single photo by ID
   */
  async getPhotoById(photoId: string): Promise<Photo | null> {
    try {
      const docRef = doc(this.photosCollection, photoId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        // Ensure required fields with defaults for backward compatibility
        return {
          id: docSnap.id,
          ...data,
          likes: data.likes ?? 0,
          views: data.views ?? 0,
          taggedPersons: data.taggedPersons || [],
          isApproved: data.isApproved ?? true,
        } as Photo;
      }
      return null;
    } catch (error) {
      console.error('Error getting photo:', error);
      throw error;
    }
  }

  /**
   * Get recent photos for homepage (cached)
   */
  async getRecentPhotos(limitCount: number = 6): Promise<Photo[]> {
    try {
      if (recentPhotosCache.data && isCacheValid(recentPhotosCache.timestamp)) {
        return recentPhotosCache.data.slice(0, limitCount);
      }

      const photosQuery = query(
        this.photosCollection,
        where('isApproved', '==', true),
        orderBy('createdAt', 'desc'),
        limit(Math.max(limitCount, 12))
      );

      const snapshot = await getDocs(photosQuery);
      const photos = mapDocumentsWithId<Photo>(snapshot.docs);

      recentPhotosCache.data = photos;
      recentPhotosCache.timestamp = Date.now();

      return photos.slice(0, limitCount);
    } catch (error) {
      console.error('Error getting recent photos:', error);
      return [];
    }
  }

  /**
   * Get all photos for admin dashboard (including pending)
   */
  async getAllPhotosForAdmin(): Promise<Photo[]> {
    try {
      const photosQuery = query(
        this.photosCollection,
        orderBy('createdAt', 'desc'),
        limit(5000) // High limit for admin dashboard
      );

      const snapshot = await getDocs(photosQuery);
      const photos = mapDocumentsWithId<Photo>(snapshot.docs);

      return photos;
    } catch (error) {
      console.error('Error getting all photos for admin:', error);
      return [];
    }
  }

  /**
   * Get all approved photos
   */
  async getAllPhotos(): Promise<Photo[]> {
    try {
      const photosQuery = query(
        collection(db, 'photos'),
        where('isApproved', '==', true),
        orderBy('createdAt', 'desc')
      );

      const photoSnapshot = await getDocs(photosQuery);
      return mapDocumentsWithId<Photo>(photoSnapshot.docs);
    } catch (error) {
      console.error('Error fetching all photos:', error);
      throw error;
    }
  }

  /**
   * Get photos with pagination
   */
  async getPhotosWithPagination(limitCount: number = 50, lastPhotoId?: string): Promise<Photo[]> {
    try {
      let photosQuery;

      if (lastPhotoId) {
        const lastPhotoDoc = await getDoc(doc(db, 'photos', lastPhotoId));
        photosQuery = query(
          collection(db, 'photos'),
          where('isApproved', '==', true),
          orderBy('createdAt', 'desc'),
          startAfter(lastPhotoDoc),
          limit(limitCount)
        );
      } else {
        photosQuery = query(
          collection(db, 'photos'),
          where('isApproved', '==', true),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }

      const photoSnapshot = await getDocs(photosQuery);
      return mapDocumentsWithId<Photo>(photoSnapshot.docs);
    } catch (error) {
      console.error('Error fetching photos with pagination:', error);
      throw error;
    }
  }

  /**
   * Get user's photos
   */
  async getUserPhotos(userId: string): Promise<Photo[]> {
    try {
      const q = query(
        this.photosCollection,
        where('authorId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return mapDocumentsWithId<Photo>(querySnapshot.docs);
    } catch (error) {
      console.error('Error getting user photos:', error);
      // Fallback
      try {
        const fallbackQuery = query(
          this.photosCollection,
          orderBy('createdAt', 'desc')
        );

        const fallbackSnapshot = await getDocs(fallbackQuery);
        const allPhotos = mapDocumentsWithId<Photo>(fallbackSnapshot.docs);

        return allPhotos.filter((photo) =>
          photo.authorId === userId || photo.uploadedBy === userId
        );
      } catch (fallbackError) {
        console.error('Fallback user photos query failed:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Get photos by uploader UID
   * Shows ALL user's photos on their profile (approved and pending)
   * This allows users to see their own photos and share them with others
   */
  async getPhotosByUploader(uploaderUid: string, limitCount?: number): Promise<Photo[]> {
    try {
      let allPhotos: Photo[] = [];

      // Method 1: Query by uploaderId (matches Firestore rules check)
      try {
        const uploaderQuery = limitCount
          ? query(
              this.photosCollection,
              where('uploaderId', '==', uploaderUid),
              orderBy('createdAt', 'desc'),
              limit(limitCount)
            )
          : query(
              this.photosCollection,
              where('uploaderId', '==', uploaderUid),
              orderBy('createdAt', 'desc')
            );

        const uploaderSnapshot = await getDocs(uploaderQuery);
        const uploaderPhotos = mapDocumentsWithId<Photo>(uploaderSnapshot.docs);
        allPhotos = [...allPhotos, ...uploaderPhotos];
      } catch (error) {
        console.log('Query by uploaderId failed, trying authorId fallback');
      }

      // Method 2: Query by authorId (fallback for photos where authorId != uploaderId)
      try {
        const authorQuery = limitCount
          ? query(
              this.photosCollection,
              where('authorId', '==', uploaderUid),
              orderBy('createdAt', 'desc'),
              limit(limitCount)
            )
          : query(
              this.photosCollection,
              where('authorId', '==', uploaderUid),
              orderBy('createdAt', 'desc')
            );

        const authorSnapshot = await getDocs(authorQuery);
        const authorPhotos = mapDocumentsWithId<Photo>(authorSnapshot.docs);
        allPhotos = [...allPhotos, ...authorPhotos];
      } catch (error) {
        console.log('Query by authorId also failed');
      }

      // Fallback - legacy photos (correct userId)
      if (uploaderUid === 'JqLBVMJvyFYEZkVTON310XKYLlk1') {
        try {
          const legacyQuery = query(
            this.photosCollection,
            where('uploadedBy', '==', 'Kruno Žagar')
          );
          const legacySnapshot = await getDocs(legacyQuery);
          const legacyPhotos = mapDocumentsWithId<Photo>(legacySnapshot.docs);
          allPhotos = [...allPhotos, ...legacyPhotos];
        } catch (error) {
          // Legacy query failed, continue
        }
      }

      // Remove duplicates
      const uniquePhotos = allPhotos.filter((photo, index, self) =>
        index === self.findIndex(p => p.id === photo.id)
      );

      return limitCount ? uniquePhotos.slice(0, limitCount) : uniquePhotos;
    } catch (error) {
      console.error('❌ Error fetching photos by uploader:', error);
      return [];
    }
  }

  /**
   * Get photos by uploader name
   */
  async getPhotosByUploaderName(uploaderName: string): Promise<Photo[]> {
    try {
      const q = query(
        this.photosCollection,
        where('uploadedBy', '==', uploaderName),
        where('isApproved', '==', true),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return mapDocumentsWithId<Photo>(querySnapshot.docs);
    } catch (error) {
      console.error('Error fetching photos by uploader name:', error);
      return [];
    }
  }

  /**
   * Get all unique uploaders
   */
  async getAllUploaders(): Promise<{ uid: string; displayName: string; photoCount: number }[]> {
    try {
      const q = query(
        this.photosCollection,
        where('isApproved', '==', true)
      );

      const querySnapshot = await getDocs(q);
      const uploaderMap = new Map<string, { displayName: string; count: number }>();

      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        const uploadedBy = data.uploadedBy || 'Unknown';
        const authorId = data.authorId || uploadedBy;

        if (uploaderMap.has(authorId)) {
          uploaderMap.get(authorId)!.count++;
        } else {
          uploaderMap.set(authorId, {
            displayName: uploadedBy,
            count: 1
          });
        }
      });

      return Array.from(uploaderMap.entries()).map(([uid, data]) => ({
        uid,
        displayName: data.displayName,
        photoCount: data.count
      }));
    } catch (error) {
      console.error('Error getting all uploaders:', error);
      return [];
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userUid: string): Promise<{
    totalPhotos: number;
    totalLikes: number;
    totalViews: number;
    locationsCount: number;
  }> {
    try {
      const photos = await this.getPhotosByUploader(userUid);

      const totalLikes = photos.reduce((sum, photo) => sum + (photo.likes || 0), 0);
      const totalViews = photos.reduce((sum, photo) => sum + (photo.views || 0), 0);
      const uniqueLocations = new Set(photos.map(photo => photo.location)).size;

      return {
        totalPhotos: photos.length,
        totalLikes,
        totalViews,
        locationsCount: uniqueLocations
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        totalPhotos: 0,
        totalLikes: 0,
        totalViews: 0,
        locationsCount: 0
      };
    }
  }

  // ========================================
  // CACHE MANAGEMENT
  // ========================================

  clearLocationCache(location?: string) {
    if (location) {
      const cacheKey = `location_${location}`;
      locationCache.delete(cacheKey);
    } else {
      locationCache.clear();
    }
  }

  clearRecentPhotosCache() {
    recentPhotosCache.data = null;
    recentPhotosCache.timestamp = 0;
  }
}

// Create singleton instance
export const photoService = new PhotoService();
