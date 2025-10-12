import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface NotificationData {
  userId: string;
  type: 'photo_rejected' | 'photo_approved' | 'tag_rejected' | 'tag_approved' | 'comment_deleted' | 'photo_edited' | 'photo_deleted' | 'user_suspended' | 'user_banned' | 'user_unsuspended' | 'user_unbanned';
  reason?: string;
  photoId?: string;
  taggedPersonName?: string;
  photoTitle?: string;
  changes?: string;
  suspendedUntil?: string; // ISO date string
}

/**
 * Kreira notification dokument u Firestore.
 * Cloud Function će automatski uhvatiti ovaj dokument i poslati email.
 */
export const sendNotification = async (data: NotificationData): Promise<void> => {
  try {
    console.log('📧 Creating notification:', data);
    
    await addDoc(collection(db, 'notifications'), {
      ...data,
      createdAt: serverTimestamp(),
      emailSent: false
    });
    
    console.log('✅ Notification created successfully');
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    throw error;
  }
};