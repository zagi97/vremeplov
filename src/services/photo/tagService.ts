// src/services/photo/tagService.ts
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
  Timestamp
} from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { mapDocumentsWithId } from '../../utils/firestoreMappers';
import { isFirebaseError } from '../../types/firebase';
import type { TaggedPerson } from '../firebaseService';

export class TagService {
  private taggedPersonsCollection = collection(db, 'taggedPersons');
  private photosCollection = collection(db, 'photos');

  // ========================================
  // TAG OPERATIONS
  // ========================================

  /**
   * Add tagged person (requires approval)
   */
  async addTaggedPerson(tagData: Omit<TaggedPerson, 'id' | 'createdAt' | 'isApproved'>): Promise<string> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User not authenticated");

      // Fetch photo document
      const photoRef = doc(this.photosCollection, tagData.photoId);
      const photoSnap = await getDoc(photoRef);
      if (!photoSnap.exists()) {
        throw new Error("Photo not found");
      }
      const photoData = photoSnap.data();
      if (!photoData) {
        throw new Error("Photo data is empty");
      }

      // Create tag with photoAuthorId
      const tag: Omit<TaggedPerson, 'id'> = {
        ...tagData,
        addedByUid: currentUser.uid,
        photoAuthorId: photoData.authorId,
        createdAt: Timestamp.now(),
        isApproved: false
      };

      const docRef = await addDoc(this.taggedPersonsCollection, tag);
      return docRef.id;
    } catch (error) {
      console.error('Error adding tagged person:', error);
      throw error;
    }
  }

  /**
   * Approve tagged person
   */
  async approveTaggedPerson(tagId: string, adminUid: string): Promise<void> {
    try {
      const tagRef = doc(this.taggedPersonsCollection, tagId);
      const tagDoc = await getDoc(tagRef);

      if (!tagDoc.exists()) {
        throw new Error('Tag not found');
      }

      const tagData = tagDoc.data() as TaggedPerson;

      // Fetch photo data for activity
      const photoDoc = await getDoc(doc(this.photosCollection, tagData.photoId));
      const photoData = photoDoc.exists() ? photoDoc.data() : null;

      // Approve tag
      await updateDoc(tagRef, {
        isApproved: true,
        moderatedAt: Timestamp.now(),
        moderatedBy: adminUid
      });

      // Create activity after approval
      if (tagData.addedByUid && photoData) {
        const { userService } = await import('../userService');

        await userService.addUserActivity(
          tagData.addedByUid,
          'person_tagged',
          tagData.photoId,
          {
            photoTitle: photoData.description,
            location: photoData.location,
            targetId: tagData.photoId
          }
        );

        console.log('✅ Tag approved and activity created for user:', tagData.addedByUid);
      }
    } catch (error) {
      console.error('Error approving tagged person:', error);
      throw error;
    }
  }

  /**
   * Reject (delete) tagged person
   */
  async rejectTaggedPerson(tagId: string): Promise<void> {
    try {
      const docRef = doc(this.taggedPersonsCollection, tagId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error rejecting tagged person:', error);
      throw error;
    }
  }

  /**
   * Update tagged person
   */
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

  // ========================================
  // TAG QUERIES
  // ========================================

  /**
   * Get tagged persons for photo (only approved)
   */
  async getTaggedPersonsByPhotoId(photoId: string): Promise<TaggedPerson[]> {
    try {
      const q = query(
        this.taggedPersonsCollection,
        where('photoId', '==', photoId),
        where('isApproved', '==', true)
      );

      const querySnapshot = await getDocs(q);
      return mapDocumentsWithId<TaggedPerson>(querySnapshot.docs);
    } catch (error) {
      console.error('Error getting tagged persons:', error);
      return [];
    }
  }

  /**
   * Get tagged persons for user (approved only, public view)
   */
  async getTaggedPersonsByPhotoIdForUser(photoId: string, userId?: string, photoAuthorId?: string): Promise<TaggedPerson[]> {
    try {
      const q = query(
        this.taggedPersonsCollection,
        where('photoId', '==', photoId),
        where('isApproved', '==', true)
      );

      const snapshot = await getDocs(q);
      return mapDocumentsWithId<TaggedPerson>(snapshot.docs);

    } catch (error: unknown) {
      console.error('Error in getTaggedPersonsByPhotoIdForUser:', error);

      if (isFirebaseError(error) && error.code === 'permission-denied') {
        console.warn('Permission denied for taggedPersons, returning empty array');
      }
      return [];
    }
  }

  /**
   * Get tagged persons for admin (all tags)
   */
  async getTaggedPersonsByPhotoIdForAdmin(photoId: string): Promise<TaggedPerson[]> {
    try {
      const q = query(
        this.taggedPersonsCollection,
        where('photoId', '==', photoId)
      );

      const querySnapshot = await getDocs(q);
      return mapDocumentsWithId<TaggedPerson>(querySnapshot.docs);
    } catch (error) {
      console.error('Error getting tagged persons for admin:', error);
      throw error;
    }
  }

  /**
   * Get tagged persons for photo owner (approved + own pending tags)
   */
  async getTaggedPersonsForPhotoOwner(photoId: string, userId: string): Promise<TaggedPerson[]> {
    try {
      console.log('🏠 Getting tags for photo owner:', { photoId, userId });

      // 1. Get approved tags
      const approvedQuery = query(
        this.taggedPersonsCollection,
        where('photoId', '==', photoId),
        where('isApproved', '==', true)
      );
      const approvedSnapshot = await getDocs(approvedQuery);
      const approvedTags = mapDocumentsWithId<TaggedPerson>(approvedSnapshot.docs);

      console.log('🏠 Approved tags:', approvedTags.length);

      // 2. Get pending tags added by user
      const userPendingQuery = query(
        this.taggedPersonsCollection,
        where('photoId', '==', photoId),
        where('addedByUid', '==', userId),
        where('isApproved', '==', false)
      );
      const userPendingSnapshot = await getDocs(userPendingQuery);
      const userPendingTags = mapDocumentsWithId<TaggedPerson>(userPendingSnapshot.docs);

      console.log('🏠 User pending tags:', userPendingTags.length);

      // 3. Get pending tags on user's photo
      const photoPendingQuery = query(
        this.taggedPersonsCollection,
        where('photoId', '==', photoId),
        where('photoAuthorId', '==', userId),
        where('isApproved', '==', false)
      );
      const photoPendingSnapshot = await getDocs(photoPendingQuery);
      const photoPendingTags = mapDocumentsWithId<TaggedPerson>(photoPendingSnapshot.docs);

      console.log('🏠 Photo pending tags:', photoPendingTags.length);

      // 4. Combine and remove duplicates
      const allTags = [...approvedTags, ...userPendingTags, ...photoPendingTags];
      const uniqueTags = allTags.filter((tag, index, self) =>
        index === self.findIndex(t => t.id === tag.id)
      );

      console.log('🏠 Total unique tags:', uniqueTags.length);
      return uniqueTags;

    } catch (error) {
      console.error('Error getting tags for photo owner:', error);
      return [];
    }
  }

  /**
   * Get all tagged persons for admin (including pending)
   */
  async getAllTaggedPersonsForAdmin(): Promise<TaggedPerson[]> {
    try {
      const q = query(
        this.taggedPersonsCollection,
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return mapDocumentsWithId<TaggedPerson>(querySnapshot.docs);
    } catch (error) {
      console.error('Error getting all tagged persons for admin:', error);
      throw error;
    }
  }

  /**
   * Get pending tagged persons for admin moderation
   */
  async getPendingTaggedPersons(): Promise<TaggedPerson[]> {
    try {
      const q = query(
        this.taggedPersonsCollection,
        where('isApproved', '==', false),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return mapDocumentsWithId<TaggedPerson>(querySnapshot.docs);
    } catch (error) {
      console.error('Error getting pending tagged persons:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const tagService = new TagService();
