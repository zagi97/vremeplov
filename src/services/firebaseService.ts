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
  Timestamp, 
  setDoc
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
   taggedPersons?: Array<{
    name: string;
    x: number;
    y: number;
  }>;
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
  addedByUid?: string; // Store user UID who added the tag
  createdAt: Timestamp;
  isApproved: boolean; // Add approval status
  moderatedAt?: Timestamp; // When it was approved/rejected
  moderatedBy?: string; // Admin who approved/rejected
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

export interface UserDocument {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  location?: string;
  joinedAt: Timestamp;
  lastActiveAt: Timestamp;
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

async addPhoto(photoData: Omit<Photo, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'views' | 'isApproved'> & { authorId?: string }): Promise<string> {
  try {
    console.log('Adding photo with data:', photoData);
    const now = Timestamp.now();
    const currentUser = auth.currentUser;
    
    const photo: Omit<Photo, 'id'> = {
      imageUrl: photoData.imageUrl,
      imageStoragePath: photoData.imageStoragePath,
      year: photoData.year,
      description: photoData.description,
      detailedDescription: photoData.detailedDescription || '',
      author: photoData.author,
      authorId: photoData.authorId || currentUser?.uid, // Store the actual user UID
      location: photoData.location,
      tags: photoData.tags || [],
      taggedPersons: photoData.taggedPersons || [],
      uploadedBy: photoData.uploadedBy || currentUser?.displayName || currentUser?.email || 'Unknown',
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

// Add tagged person (now requires approval)
async addTaggedPerson(tagData: Omit<TaggedPerson, 'id' | 'createdAt' | 'isApproved'>): Promise<string> {
  try {
    const currentUser = auth.currentUser;
    const tag: Omit<TaggedPerson, 'id'> = {
      ...tagData,
      addedByUid: currentUser?.uid,
      createdAt: Timestamp.now(),
      isApproved: false // Requires admin approval
    };

    const docRef = await addDoc(this.taggedPersonsCollection, tag);
    return docRef.id;
  } catch (error) {
    console.error('Error adding tagged person:', error);
    throw error;
  }
}

// Approve tagged person
async approveTaggedPerson(tagId: string, adminUid: string): Promise<void> {
  try {
    const docRef = doc(this.taggedPersonsCollection, tagId);
    await updateDoc(docRef, {
      isApproved: true,
      moderatedAt: Timestamp.now(),
      moderatedBy: adminUid
    });
  } catch (error) {
    console.error('Error approving tagged person:', error);
    throw error;
  }
}

// Reject (delete) tagged person
async rejectTaggedPerson(tagId: string): Promise<void> {
  try {
    const docRef = doc(this.taggedPersonsCollection, tagId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error rejecting tagged person:', error);
    throw error;
  }
}

// Update tagged person
async updateTaggedPerson(tagId: string, updates: Partial<TaggedPerson>): Promise<void> {
  try {
    const docRef = doc(this.taggedPersonsCollection, tagId);
    await updateDoc(docRef, {
      ...updates,
      moderatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating tagged person:', error);
    throw error;
  }
}

// Get tagged persons for photo (only approved ones for public view)
async getTaggedPersonsByPhotoId(photoId: string): Promise<TaggedPerson[]> {
  try {
    const q = query(
      this.taggedPersonsCollection,
      where('photoId', '==', photoId),
      where('isApproved', '==', true) // Only approved tags for public
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
// Get tagged persons for photo including user's own pending tags + pending tags on user's photos
async getTaggedPersonsByPhotoIdForUser(photoId: string, userId?: string, photoAuthorId?: string): Promise<TaggedPerson[]> {
  try {
    if (!userId) {
      // If no user, only return approved tags
      return this.getTaggedPersonsByPhotoId(photoId);
    }

    // Get approved tags (visible to everyone)
    const approvedQuery = query(
      this.taggedPersonsCollection,
      where('photoId', '==', photoId),
      where('isApproved', '==', true)
    );
    
    // Get user's own pending tags
    const userPendingQuery = query(
      this.taggedPersonsCollection,
      where('photoId', '==', photoId),
      where('addedByUid', '==', userId),
      where('isApproved', '==', false)
    );
    
    const queries = [approvedQuery, userPendingQuery];
    
    // If user is the photo owner, also get all pending tags on their photo
    let photoOwnerPendingQuery = null;
    if (photoAuthorId && userId === photoAuthorId) {
      photoOwnerPendingQuery = query(
        this.taggedPersonsCollection,
        where('photoId', '==', photoId),
        where('isApproved', '==', false)
      );
      queries.push(photoOwnerPendingQuery);
    }
    
    const snapshots = await Promise.all(queries.map(q => getDocs(q)));
    
    const approvedTags = snapshots[0].docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TaggedPerson));
    
    const userPendingTags = snapshots[1].docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TaggedPerson));
    
    // If photo owner, get all pending tags (avoiding duplicates)
    let allPendingTags: TaggedPerson[] = [];
    if (photoOwnerPendingQuery && snapshots[2]) {
      allPendingTags = snapshots[2].docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TaggedPerson));
      
      // Remove duplicates (user's own pending tags are already included)
      const userPendingIds = new Set(userPendingTags.map(tag => tag.id));
      allPendingTags = allPendingTags.filter(tag => !userPendingIds.has(tag.id));
    }
    
    // Combine all visible tags
    return [...approvedTags, ...userPendingTags, ...allPendingTags];
  } catch (error) {
    console.error('Error getting tagged persons for user:', error);
    throw error;
  }
}

// Get tagged persons for admin (all tags)
async getTaggedPersonsByPhotoIdForAdmin(photoId: string): Promise<TaggedPerson[]> {
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
    console.error('Error getting all tagged persons for admin:', error);
    throw error;
  }
}

// Get all tagged persons for admin (including pending)
async getAllTaggedPersonsForAdmin(): Promise<TaggedPerson[]> {
  try {
    const q = query(
      this.taggedPersonsCollection,
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TaggedPerson));
  } catch (error) {
    console.error('Error getting all tagged persons for admin:', error);
    throw error;
  }
}

// Get pending tagged persons for admin moderation
async getPendingTaggedPersons(): Promise<TaggedPerson[]> {
  try {
    const q = query(
      this.taggedPersonsCollection,
      where('isApproved', '==', false),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TaggedPerson));
  } catch (error) {
    console.error('Error getting pending tagged persons:', error);
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
  // Add these methods to your PhotoService class in firebaseService.ts

// Get photos by uploader (for user profiles)
async getPhotosByUploader(uploaderUid: string): Promise<Photo[]> {
  try {
    // First try to find by authorId (if you're storing user UIDs)
    const q1 = query(
      this.photosCollection,
      where('authorId', '==', uploaderUid),
      where('isApproved', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot1 = await getDocs(q1);
    if (!querySnapshot1.empty) {
      return querySnapshot1.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Photo));
    }

    // Fallback: try to find by uploadedBy field if authorId doesn't exist
    // This searches for the user's display name or email
    const q2 = query(
      this.photosCollection,
      where('uploadedBy', '==', uploaderUid),
      where('isApproved', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot2 = await getDocs(q2);
    return querySnapshot2.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Photo));
  } catch (error) {
    console.error('Error fetching photos by uploader:', error);
    return [];
  }
}

// Get photos by uploader name (alternative method for display names)
async getPhotosByUploaderName(uploaderName: string): Promise<Photo[]> {
  try {
    const q = query(
      this.photosCollection, 
      where('uploadedBy', '==', uploaderName),
      where('isApproved', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Photo));
  } catch (error) {
    console.error('Error fetching photos by uploader name:', error);
    return [];
  }
}

// Get all unique uploaders (for leaderboard)
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

// Get user statistics (for user profiles)
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

  // Add this method to your PhotoService class:
async getUserById(userId: string): Promise<UserDocument | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return {
        uid: userSnap.id,
        ...userSnap.data()
      } as UserDocument;
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

// Create or update user document when they sign in:
async createOrUpdateUser(user: any): Promise<void> {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    const userData = {
      displayName: user.displayName || user.email || 'Unknown User',
      email: user.email || '',
      photoURL: user.photoURL || '',
      lastActiveAt: Timestamp.now()
    };
    
    if (!userDoc.exists()) {
      // Create new user document
      await setDoc(userRef, {
        ...userData,
        bio: 'Passionate about preserving Croatian heritage.',
        location: 'Croatia',
        joinedAt: Timestamp.now()
      });
    } else {
      // Update existing user
      await updateDoc(userRef, userData);
    }
  } catch (error) {
    console.error('Error creating/updating user:', error);
  }
}
}

// Create singleton instances
export const photoService = new PhotoService();
export const authService = new AuthService();