// src/services/firebaseService.ts
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
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage, auth } from '../lib/firebase';

// Types based on your existing mock data
export interface Photo {
  id?: string;
  imageUrl: string;
  imageStoragePath: string;
  year: string;
  description: string;
  detailedDescription?: string;
  author: string;
  authorId?: string;
  location: string;
  uploadedBy?: string;
  uploadedAt?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  likes: number;
  views: number;
  isApproved: boolean;
  approved?: boolean; // Alternative field name used in dashboard
  tags: string[];
}

export interface Comment {
  id?: string;
  photoId: string;
  author: string;
  text: string;
  createdAt: Timestamp;
  isApproved: boolean;
}

export interface TaggedPerson {
  id?: string;
  photoId: string;
  name: string;
  x: number;
  y: number;
  description?: string;
  addedBy: string;
  createdAt: Timestamp;
}

export interface UserLike {
  id?: string;
  userId: string;
  photoId: string;
  createdAt: Timestamp;
}

export interface UserView {
  id?: string;
  userId: string;
  photoId: string;
  createdAt: Timestamp;
}

// Photo Services
export class PhotoService {
  private photosCollection = collection(db, 'photos');
  private commentsCollection = collection(db, 'comments');
  private taggedPersonsCollection = collection(db, 'taggedPersons');
  private userLikesCollection = collection(db, 'userLikes');
  private userViewsCollection = collection(db, 'userViews');

  // Upload photo to Firebase Storage
  async uploadPhotoFile(file: File, photoId: string): Promise<string> {
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `photos/${photoId}/${fileName}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  }

  // Update photo (useful for adding imageUrl after upload)
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

   // Delete photo
  async deletePhoto(photoId: string): Promise<void> {
    try {
      const docRef = doc(this.photosCollection, photoId);
      await deleteDoc(docRef);
      console.log('Photo deleted successfully:', photoId);
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }

  // Add new photo
  async addPhoto(photoData: Omit<Photo, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'views' | 'isApproved'>): Promise<string> {
    try {
      console.log('Adding photo with data:', photoData);
      const now = Timestamp.now();
      const photo: Omit<Photo, 'id'> = {
        imageUrl: photoData.imageUrl,
        imageStoragePath: photoData.imageStoragePath,
        year: photoData.year,
        description: photoData.description,
        detailedDescription: photoData.detailedDescription || '',
        author: photoData.author,
        location: photoData.location,
        tags: photoData.tags || [],
        uploadedBy: photoData.uploadedBy || 'Unknown',
        uploadedAt: photoData.uploadedAt || new Date().toISOString(),
        createdAt: now,
        updatedAt: now,
        likes: 0,
        views: 0,
        isApproved: false // Photos need approval by default
        
      };

      console.log('Final photo object being saved:', photo);
      const docRef = await addDoc(this.photosCollection, photo);
      console.log('Photo saved with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding photo:', error);
      throw error;
    }
  }

  // Get photos by location
  async getPhotosByLocation(location: string): Promise<Photo[]> {
    try {
      const q = query(
        this.photosCollection,
        where('location', '==', location),
        where('isApproved', '==', true),
        orderBy('year', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Photo));
    } catch (error) {
      console.error('Error getting photos:', error);
      throw error;
    }
  }

  // Get single photo by ID
  async getPhotoById(photoId: string): Promise<Photo | null> {
    try {
      const docRef = doc(this.photosCollection, photoId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Photo;
      }
      return null;
    } catch (error) {
      console.error('Error getting photo:', error);
      throw error;
    }
  }

  // Add comment to photo
  async addComment(photoId: string, author: string, text: string): Promise<string> {
    try {
      const comment: Omit<Comment, 'id'> = {
        photoId,
        author,
        text,
        createdAt: Timestamp.now(),
        isApproved: true // Auto-approve for now
      };

      const docRef = await addDoc(this.commentsCollection, comment);
      return docRef.id;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  // Get comments for photo
  async getCommentsByPhotoId(photoId: string): Promise<Comment[]> {
    try {
      const q = query(
        this.commentsCollection,
        where('photoId', '==', photoId),
        where('isApproved', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Comment));
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  }

  // Add tagged person
  async addTaggedPerson(tagData: Omit<TaggedPerson, 'id' | 'createdAt'>): Promise<string> {
    try {
      const tag: Omit<TaggedPerson, 'id'> = {
        ...tagData,
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(this.taggedPersonsCollection, tag);
      return docRef.id;
    } catch (error) {
      console.error('Error adding tagged person:', error);
      throw error;
    }
  }

  // Get tagged persons for photo
  async getTaggedPersonsByPhotoId(photoId: string): Promise<TaggedPerson[]> {
    try {
      const q = query(
        this.taggedPersonsCollection,
        where('photoId', '==', photoId)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TaggedPerson));
    } catch (error) {
      console.error('Error getting tagged persons:', error);
      throw error;
    }
  }

 // Check if user has already viewed this photo
 async hasUserViewed(photoId: string, userId: string): Promise<boolean> {
  try {
    const q = query(
      this.userViewsCollection,
      where('photoId', '==', photoId),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking user view:', error);
    return false;
  }
}

// Increment photo views (only if user hasn't viewed before)
async incrementViews(photoId: string, userId: string): Promise<void> {
  try {
    // Check if user has already viewed this photo
    const hasViewed = await this.hasUserViewed(photoId, userId);
    if (hasViewed) {
      return; // User has already viewed this photo
    }

    // Record the user view
    await addDoc(this.userViewsCollection, {
      photoId,
      userId,
      createdAt: Timestamp.now()
    });

    // Increment the photo's view count
    const docRef = doc(this.photosCollection, photoId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const currentViews = docSnap.data().views || 0;
      await updateDoc(docRef, {
        views: currentViews + 1,
        updatedAt: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('Error incrementing views:', error);
    // Don't throw error for view counting, it's not critical
  }
}

    // Check if user has already liked this photo
  async hasUserLiked(photoId: string, userId: string): Promise<boolean> {
    try {
      const q = query(
        this.userLikesCollection,
        where('photoId', '==', photoId),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking user like:', error);
      return false;
    }
  }

  // Toggle like for photo (only if user hasn't liked before)
  async toggleLike(photoId: string, userId: string): Promise<{ liked: boolean; newLikesCount: number; alreadyLiked: boolean }> {
    try {
      // Check if user has already liked this photo
      const hasLiked = await this.hasUserLiked(photoId, userId);
      if (hasLiked) {
        // User has already liked this photo
        const docRef = doc(this.photosCollection, photoId);
        const docSnap = await getDoc(docRef);
        const currentLikes = docSnap.exists() ? docSnap.data().likes || 0 : 0;
        return { liked: false, newLikesCount: currentLikes, alreadyLiked: true };
      }

      // Record the user like
      await addDoc(this.userLikesCollection, {
        photoId,
        userId,
        createdAt: Timestamp.now()
      });

      // Increment the photo's like count
        const docRef = doc(this.photosCollection, photoId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const currentLikes = docSnap.data().likes || 0;
          const newLikesCount = currentLikes + 1;
          
          await updateDoc(docRef, {
            likes: newLikesCount,
            updatedAt: Timestamp.now()
          });
          
          return { liked: true, newLikesCount, alreadyLiked: false };
        }
        
        return { liked: false, newLikesCount: 0, alreadyLiked: false };
      } catch (error) {
        console.error('Error toggling like:', error);
        throw error;
      }
    }

  // Get recent photos for homepage
  async getRecentPhotos(limitCount: number = 6): Promise<Photo[]> {
    try {
      const photosQuery = query(
        this.photosCollection,
        where('isApproved', '==', true),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(photosQuery);
      const photos: Photo[] = [];
      
      snapshot.forEach(doc => {
        photos.push({ id: doc.id, ...doc.data() } as Photo);
      });
      
      return photos;
    } catch (error) {
      console.error('Error getting recent photos:', error);
      return [];
    }
  }
// Get all photos for admin dashboard (including pending)
  async getAllPhotosForAdmin(): Promise<Photo[]> {
    try {
      console.log('Fetching all photos for admin dashboard...');
      const photosQuery = query(
        this.photosCollection,
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(photosQuery);
      const photos = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        } as Photo;
      });
      
      console.log(`Fetched ${photos.length} total photos for admin`);
      console.log('Sample photo approval status:', photos.slice(0, 3).map(p => ({ 
        id: p.id, 
        isApproved: p.isApproved, 
        approved: p.approved 
      })));
      
      return photos;
    } catch (error) {
      console.error('Error getting all photos for admin:', error);
      return [];
    }
  }

  // Get user's photos
  async getUserPhotos(userId: string): Promise<Photo[]> {
    try {
      const q = query(
        this.photosCollection,
        where('authorId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Photo));
    } catch (error) {
      console.error('Error getting user photos:', error);
      // Fallback: try with uploadedBy field
      try {
        const fallbackQuery = query(
          this.photosCollection,
          orderBy('createdAt', 'desc')
        );
        
        const fallbackSnapshot = await getDocs(fallbackQuery);
        const allPhotos = fallbackSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Photo));

        // Filter by userId locally
        return allPhotos.filter(photo => 
          photo.authorId === userId || photo.uploadedBy === userId
        );
      } catch (fallbackError) {
        console.error('Fallback user photos query failed:', fallbackError);
        return [];
      }
    }
  }
}

// Authentication Services
export class AuthService {
  async signInAdmin(email: string, password: string) {
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if this is the admin email
      if (userCredential.user.email === 'vremeplov.app@gmail.com') {
        return {
          success: true,
          user: userCredential.user
        };
      } else {
        // Sign out non-admin users
        await this.signOut();
        return {
          success: false,
          error: 'Unauthorized: Admin access only'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async signOut() {
    try {
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getCurrentUser() {
    return auth.currentUser;
  }

  isAdmin(user: any) {
    return user?.email === 'vremeplov.app@gmail.com';
  }
}

// Create singleton instances
export const photoService = new PhotoService();
export const authService = new AuthService();