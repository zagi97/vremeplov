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
import { db, storage } from '../lib/firebase';

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
  createdAt: Timestamp;
  updatedAt: Timestamp;
  likes: number;
  views: number;
  isApproved: boolean;
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

// Photo Services
export class PhotoService {
  private photosCollection = collection(db, 'photos');
  private commentsCollection = collection(db, 'comments');
  private taggedPersonsCollection = collection(db, 'taggedPersons');

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

  // Add new photo
  async addPhoto(photoData: Omit<Photo, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'views' | 'isApproved'>): Promise<string> {
    try {
      const now = Timestamp.now();
      const photo: Omit<Photo, 'id'> = {
        ...photoData,
        createdAt: now,
        updatedAt: now,
        likes: 0,
        views: 0,
        isApproved: false // Photos need approval by default
      };

      const docRef = await addDoc(this.photosCollection, photo);
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

  // Increment photo views
  async incrementViews(photoId: string): Promise<void> {
    try {
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
}

// Create singleton instance
export const photoService = new PhotoService();