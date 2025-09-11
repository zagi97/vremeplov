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
  startAfter,
  Timestamp} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL} from 'firebase/storage';
import { db, storage, auth } from '../lib/firebase';

// Cache konfiguracija - ISPRAVKA
const CACHE_DURATION = 5 * 60 * 1000; // 5 minuta
const photoCache = new Map<string, { data: Photo[], timestamp: number }>();
const locationCache = new Map<string, { data: Photo[], timestamp: number }>();

// ISPRAVKA: Proper typing for recentPhotosCache
const recentPhotosCache: { data: Photo[] | null, timestamp: number } = { 
  data: null, 
  timestamp: 0 
};

// Helper funkcija za cache provjeru
const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_DURATION;
};

// Helper funkcija za cache cleanup (run periodically)
const cleanupCache = () => {
  const now = Date.now();
  
  // Cleanup photo cache
  for (const [key, value] of photoCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      photoCache.delete(key);
    }
  }
  
  // Cleanup location cache  
  for (const [key, value] of locationCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      locationCache.delete(key);
    }
  }
  
  // Cleanup recent photos cache
  if (now - recentPhotosCache.timestamp > CACHE_DURATION) {
    recentPhotosCache.data = null;
    recentPhotosCache.timestamp = 0;
  }
};

// Run cleanup every 10 minutes
setInterval(cleanupCache, 10 * 60 * 1000);

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
  // ✅ DODAJ OVE NOVE KOORDINATE
  coordinates?: {
    latitude: number;
    longitude: number;
    address?: string; // Točna adresa unutar lokacije
  };
  uploadedBy?: string;
  uploadedAt?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  likes: number;
  views: number;
  isApproved: boolean;
  approved?: boolean; // Alternative field name used in dashboard
  photoType?: string; // Dodaj ovo
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

// ✅ ZAMIJENITI POSTOJEĆI geocodingService u firebaseService.ts

export const geocodingService = {
  // Poboljšana funkcija za dohvaćanje koordinata s randomizacijom
  async getCoordinatesFromAddress(address: string, city: string): Promise<{latitude: number, longitude: number} | null> {
    try {
      // Kombiniramo adresu i grad za bolji rezultat
      const fullAddress = address ? `${address}, ${city}, Croatia` : `${city}, Croatia`;
      const encodedAddress = encodeURIComponent(fullAddress);
      
      // Dodaj delay da ne bombardiraš API (rate limiting)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Geocoding address:', fullAddress);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=hr&accept-language=hr`,
        {
          headers: {
            'User-Agent': 'Vremeplov.hr (vremeplov.app@gmail.com)' // Uvijek dodaj User-Agent za Nominatim
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        let latitude = parseFloat(data[0].lat);
        let longitude = parseFloat(data[0].lon);
        
        // ✅ DODAJ MALU RANDOMIZACIJU za iste ulice (10-50m offset)
        const randomOffsetLat = (Math.random() - 0.5) * 0.0005; // ~25m radius
        const randomOffsetLon = (Math.random() - 0.5) * 0.0005;
        
        latitude += randomOffsetLat;
        longitude += randomOffsetLon;
        
        const result = {
          latitude,
          longitude
        };
        console.log('Geocoding successful with randomization:', result);
        return result;
      }
      
      console.log('No geocoding results found for:', fullAddress);
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  },

  // Poboljšana funkcija za pretragu adresa s boljim error handling
  async searchAddresses(searchTerm: string, city: string): Promise<string[]> {
    try {
      if (!searchTerm || searchTerm.length < 2) {
        return [];
      }

      const fullSearchTerm = `${searchTerm}, ${city}, Croatia`;
      const encodedSearch = encodeURIComponent(fullSearchTerm);
      
      console.log('Searching addresses for:', fullSearchTerm);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedSearch}&addressdetails=1&limit=10&countrycodes=hr&accept-language=hr`,
        {
          headers: {
            'User-Agent': 'Vremeplov.hr (vremeplov.app@gmail.com)'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Izvuci jedinstvenije adrese
      const addresses = new Set<string>();
      
      data.forEach((item: any) => {
        if (item.address) {
          const streetName = item.address.road || item.address.street;
          const houseNumber = item.address.house_number;
          const amenity = item.address.amenity;
          const shop = item.address.shop;
          const building = item.address.building;
          
          // Dodaj ulice s brojevima
          if (streetName) {
            if (houseNumber) {
              addresses.add(`${streetName} ${houseNumber}`);
            } else {
              addresses.add(streetName);
            }
          }
          
          // Dodaj zanimljive lokacije
          if (amenity) {
            addresses.add(amenity);
          }
          if (shop) {
            addresses.add(`${shop} (trgovina)`);
          }
          if (building) {
            addresses.add(building);
          }
        }
      });
      
      const results = Array.from(addresses).slice(0, 8);
      console.log('Address search results:', results);
      return results;
      
    } catch (error) {
      console.error('Error searching addresses:', error);
      return [];
    }
  },

  // Dohvati osnovne informacije o gradu
  async getCityInfo(city: string): Promise<{latitude: number, longitude: number, displayName: string} | null> {
    try {
      const encodedCity = encodeURIComponent(`${city}, Croatia`);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedCity}&limit=1&countrycodes=hr&accept-language=hr`,
        {
          headers: {
            'User-Agent': 'Vremeplov.hr (vremeplov.app@gmail.com)'
          }
        }
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          displayName: data[0].display_name
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting city info:', error);
      return null;
    }
  }
};

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
    // 1. Prvo dohvati podatke o slici
    const photoDocRef = doc(this.photosCollection, photoId);
    const photoDoc = await getDoc(photoDocRef);
    
    if (photoDoc.exists()) {
      const photoData = photoDoc.data();
      
      // 2. Obriši sliku iz Storage-a
      if (photoData.imageUrl) {
        try {
          const { deleteObject, ref } = await import('firebase/storage');
          
          // Izvuci storage path iz URL-a
          const url = new URL(photoData.imageUrl);
          const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
          if (pathMatch) {
            const storagePath = decodeURIComponent(pathMatch[1]);
            const storageRef = ref(storage, storagePath);
            await deleteObject(storageRef);
            console.log('Storage file deleted successfully:', storagePath);
          }
        } catch (storageError) {
          console.error('Error deleting from storage:', storageError);
          // Nastavi s brisanjem dokumenta iako je Storage brisanje neuspješno
        }
      }
    }
    
    // 3. Obriši Firestore dokument
    await deleteDoc(photoDocRef);
    console.log('Photo document deleted successfully:', photoId);
    
  } catch (error) {
    console.error('Error deleting photo:', error);
    throw error;
  }
}

  // Add new photo

// Ažuriraj addPhoto metodu da invalidira cache
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
      authorId: photoData.authorId || currentUser?.uid,
      location: photoData.location,
      // ✅ DODAJ COORDINATES
      coordinates: photoData.coordinates, // Ovo će biti undefined ako nema koordinata
      photoType: photoData.photoType,
      taggedPersons: photoData.taggedPersons || [],
      uploadedBy: photoData.uploadedBy || currentUser?.displayName || currentUser?.email || 'Unknown',
      uploadedAt: photoData.uploadedAt || new Date().toISOString(),
      createdAt: now,
      updatedAt: now,
      likes: 0,
      views: 0,
      isApproved: false
    };

    console.log('Final photo object being saved:', photo);
    const docRef = await addDoc(this.photosCollection, photo);
    console.log('Photo saved with ID:', docRef.id);

     // Invalidate relevant caches
    this.clearLocationCache(photoData.location);
    this.clearRecentPhotosCache();

    console.log('Photo saved and cache invalidated');

    // NOVO: Dodaj aktivnost i ažuriraj statistike
    if (currentUser?.uid) {
      // Import userService dinamički da izbjegneš circular dependency
      const { userService } = await import('./userService');
      
      // Dodaj aktivnost
      await userService.addUserActivity(
        currentUser.uid,
        'photo_upload',
        docRef.id,
        {
          photoTitle: photoData.description,
          location: photoData.location
        }
      );

      // Ažuriraj user statistike
      await userService.updateUserStats(currentUser.uid, {
        totalPhotos: 1
      });

      // Provjeri za nova badges
      await userService.checkAndAwardBadges(currentUser.uid);
    }

    return docRef.id;
  } catch (error) {
    console.error('Error adding photo:', error);
    throw error;
  }
}
  // ✅ NOVA FUNKCIJA za dobivanje fotografija s koordinatama
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
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Photo));
    } catch (error) {
      console.error('Error fetching photos with coordinates:', error);
      return [];
    }
  }

  // ✅ FUNKCIJA za update postojećih fotografija s koordinatama
  async updatePhotoCoordinates(photoId: string, coordinates: {latitude: number, longitude: number, address?: string}): Promise<void> {
    try {
      const photoRef = doc(db, 'photos', photoId);
      await updateDoc(photoRef, { coordinates });
      console.log('Coordinates updated for photo:', photoId);
    } catch (error) {
      console.error('Error updating coordinates:', error);
      throw error;
    }
  }

  // Get photos by location
// Cached verzija getPhotosByLocation
async getPhotosByLocation(location: string): Promise<Photo[]> {
  try {
    const cacheKey = `location_${location}`;
    const cached = locationCache.get(cacheKey);
    
    if (cached && isCacheValid(cached.timestamp)) {
      console.log('📋 Using cached photos for location:', location);
      return cached.data;
    }

    console.log('🔍 Fetching photos from Firestore for:', location);
    const q = query(
      this.photosCollection,
      where('location', '==', location),
      where('isApproved', '==', true),
      orderBy('year', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const photos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Photo));
    
    // Spremi u cache
    locationCache.set(cacheKey, { data: photos, timestamp: Date.now() });
    console.log(`💾 Cached ${photos.length} photos for ${location}`);
    
    return photos;
  } catch (error) {
    console.error('Error getting photos by location:', error);
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
      isApproved: true
    };

    const docRef = await addDoc(this.commentsCollection, comment);

    // NOVO: Dodaj aktivnost
    const currentUser = auth.currentUser;
    if (currentUser?.uid) {
      // Get photo details
      const photoDoc = await getDoc(doc(this.photosCollection, photoId));
      const photoData = photoDoc.data();

      const { userService } = await import('./userService');
      
      await userService.addUserActivity(
        currentUser.uid,
        'comment_added',
        photoId,
        {
          photoTitle: photoData?.description || 'Unknown photo',
          location: photoData?.location
        }
      );
    }

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
      const photoData = docSnap.data();
      const currentViews = photoData.views || 0;
      await updateDoc(docRef, {
        views: currentViews + 1,
        updatedAt: Timestamp.now()
      });

      // NOVO: Ažuriraj statistike vlasnika slike
      if (photoData.authorId) {
        const { userService } = await import('./userService');
        await userService.updateUserStats(photoData.authorId, {
          totalViews: 1
        });
      }
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

// Toggle like for photo (properly handles both like and unlike)
async toggleLike(photoId: string, userId: string): Promise<{ liked: boolean; newLikesCount: number }> {
  try {
    // Check if user has already liked this photo
    const hasLiked = await this.hasUserLiked(photoId, userId);
    
    const docRef = doc(this.photosCollection, photoId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Photo not found');
    }
    
    const photoData = docSnap.data();
    const currentLikes = photoData.likes || 0;
    
    if (hasLiked) {
      // ✅ UNLIKE: User has already liked, so remove the like
      
      // 1. Remove the like record
      const likeQuery = query(
        this.userLikesCollection,
        where('photoId', '==', photoId),
        where('userId', '==', userId)
      );
      const likeSnapshot = await getDocs(likeQuery);
      
      // Delete all like records (should be only one)
      const deletePromises = likeSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // 2. Decrement the photo's like count
      const newLikesCount = Math.max(0, currentLikes - 1);
      await updateDoc(docRef, {
        likes: newLikesCount,
        updatedAt: Timestamp.now()
      });
      
      // 3. Update owner's stats (decrease)
      if (photoData.authorId) {
        const { userService } = await import('./userService');
        const ownerProfile = await userService.getUserProfile(photoData.authorId);
        if (ownerProfile) {
          await userService.updateUserStats(photoData.authorId, {
            totalLikes: Math.max(0, ownerProfile.stats.totalLikes - 1)
          });
        }
      }
      
      console.log(`Photo ${photoId} unliked by user ${userId}`);
      return { liked: false, newLikesCount };
      
    } else {
      // ✅ LIKE: User hasn't liked yet, so add the like
      
      // 1. Record the user like
      await addDoc(this.userLikesCollection, {
        photoId,
        userId,
        createdAt: Timestamp.now()
      });
      
      // 2. Increment the photo's like count
      const newLikesCount = currentLikes + 1;
      await updateDoc(docRef, {
        likes: newLikesCount,
        updatedAt: Timestamp.now()
      });
      
      // 3. Add activity and update stats
      const { userService } = await import('./userService');
      
      // Add activity for like
      await userService.addUserActivity(
        userId,
        'photo_like',
        photoId,
        {
          photoTitle: photoData.description,
          location: photoData.location
        }
      );
      
      // Update owner's stats (increase)
      if (photoData.authorId) {
        const ownerProfile = await userService.getUserProfile(photoData.authorId);
        if (ownerProfile) {
          await userService.updateUserStats(photoData.authorId, {
            totalLikes: ownerProfile.stats.totalLikes + 1
          });
          
          // Check for new badges
          await userService.checkAndAwardBadges(photoData.authorId);
        }
      }
      
      console.log(`Photo ${photoId} liked by user ${userId}`);
      return { liked: true, newLikesCount };
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
}

// ✅ Also add these helper methods to make the code cleaner:

// Like a photo (separate method for clarity)
async likePhoto(photoId: string, userId: string): Promise<number> {
  const result = await this.toggleLike(photoId, userId);
  if (!result.liked) {
    throw new Error('Photo was already liked or unlike operation occurred');
  }
  return result.newLikesCount;
}

// Unlike a photo (separate method for clarity)
async unlikePhoto(photoId: string, userId: string): Promise<number> {
  const result = await this.toggleLike(photoId, userId);
  if (result.liked) {
    throw new Error('Photo was not liked or like operation occurred');
  }
  return result.newLikesCount;
}

// Check if user liked photo (alias for hasUserLiked for consistency)
async checkIfUserLikedPhoto(photoId: string, userId: string): Promise<boolean> {
  return this.hasUserLiked(photoId, userId);
}

  // Get recent photos for homepage
// ISPRAVKA u getRecentPhotos metodi (oko linije 1021):
async getRecentPhotos(limitCount: number = 6): Promise<Photo[]> {
  try {
    // Provjeri cache
    if (recentPhotosCache.data && isCacheValid(recentPhotosCache.timestamp)) {
      console.log('📋 Using cached recent photos');
      // ISPRAVKA: Check if data is not null before slicing
      return recentPhotosCache.data.slice(0, limitCount);
    }

    console.log('🔍 Fetching recent photos from Firestore');
    const photosQuery = query(
      this.photosCollection,
      where('isApproved', '==', true),
      orderBy('createdAt', 'desc'),
      limit(Math.max(limitCount, 12)) // Cache više nego što trebamo
    );
    
    const snapshot = await getDocs(photosQuery);
    const photos: Photo[] = [];
    
    snapshot.forEach(doc => {
      photos.push({ id: doc.id, ...doc.data() } as Photo);
    });
    
    // Spremi u cache
    recentPhotosCache.data = photos;
    recentPhotosCache.timestamp = Date.now();
    console.log(`💾 Cached ${photos.length} recent photos`);
    
    return photos.slice(0, limitCount);
  } catch (error) {
    console.error('Error getting recent photos:', error);
    return [];
  }
}

// Cache invalidation metode - DODANO
clearLocationCache(location?: string) {
  if (location) {
    const cacheKey = `location_${location}`;
    locationCache.delete(cacheKey);
    console.log('🗑️ Cleared cache for location:', location);
  } else {
    locationCache.clear();
    console.log('🗑️ Cleared all location cache');
  }
}

clearRecentPhotosCache() {
  recentPhotosCache.data = null;
  recentPhotosCache.timestamp = 0;
  console.log('🗑️ Cleared recent photos cache');
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

  // Get all photos (for statistics and leaderboard calculations)
async getAllPhotos(): Promise<Photo[]> {
  try {
    const photosQuery = query(
      collection(db, 'photos'),
      where('isApproved', '==', true), // Only approved photos
      orderBy('createdAt', 'desc')
    );
    
    const photoSnapshot = await getDocs(photosQuery);
    return photoSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Photo[];
  } catch (error) {
    console.error('Error fetching all photos:', error);
    throw error;
  }
}
  // Get photos with pagination for better performance
  async getPhotosWithPagination(limitCount: number = 50, lastPhotoId?: string): Promise<Photo[]> {
    try {
      let photosQuery;
      
      if (lastPhotoId) {
        // Get reference to last photo for pagination
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
      return photoSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Photo[];
    } catch (error) {
      console.error('Error fetching photos with pagination:', error);
      throw error;
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

  async getPhotosByUploader(uploaderUid: string): Promise<Photo[]> {
  try {
    console.log(`Getting photos for user: ${uploaderUid}`);
    
    let allPhotos: Photo[] = [];
    
    // 1. GLAVNA METODA - samo po authorId
    try {
      const authorQuery = query(
        this.photosCollection, 
        where('authorId', '==', uploaderUid), 
        where('isApproved', '==', true),
        orderBy('createdAt', 'desc')
      );
      const authorSnapshot = await getDocs(authorQuery);
      const authorPhotos = authorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Photo));
      allPhotos = [...allPhotos, ...authorPhotos];
      console.log(`Found ${authorPhotos.length} photos by authorId for ${uploaderUid}`);
    } catch (error) {
      console.log('AuthorId query failed:', error);
    }

    // 2. FALLBACK - samo za legacy slike koje nemaju authorId
    // Ali SAMO za specifični UID - ne za sve korisnike!
    if (uploaderUid === 'JqLBVMJvyFYZKVTQN310XYLI1') {
      try {
        const legacyQuery = query(
          this.photosCollection, 
          where('uploadedBy', '==', 'Kruno Žagar'), 
          where('isApproved', '==', true)
        );
        const legacySnapshot = await getDocs(legacyQuery);
        const legacyPhotos = legacySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Photo));
        allPhotos = [...allPhotos, ...legacyPhotos];
        console.log(`Found ${legacyPhotos.length} legacy photos for Kruno`);
      } catch (error) {
        console.log('Legacy query failed:', error);
      }
    }

    // Ukloni duplikate
    const uniquePhotos = allPhotos.filter((photo, index, self) => 
      index === self.findIndex(p => p.id === photo.id)
    );

    console.log(`Total photos for ${uploaderUid}: ${uniquePhotos.length}`);
    return uniquePhotos;
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
    // Prvo kreiraj/ažuriraj osnovni user document
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    const userData = {
      displayName: user.displayName || user.email || 'Unknown User',
      email: user.email || '',
      photoURL: user.photoURL || '',
      lastActiveAt: Timestamp.now()
    };
    
    if (!userDoc.exists()) {
      // Kreiraj novi user document s punim profilom
      const { userService } = await import('./userService');
      await userService.createUserProfile(user.uid, {
        ...userData,
        bio: '',
        location: ''
      });
    } else {
      // Ažuriraj postojeći user
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