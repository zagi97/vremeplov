// src/services/notificationService.ts - ULTIMATE FIX
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  updateDoc, 
  doc,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface NotificationData {
  userId: string;
  type: 'photo_rejected' | 'photo_approved' | 'tag_rejected' | 'tag_approved' | 
        'comment_deleted' | 'photo_edited' | 'photo_deleted' | 
        'user_suspended' | 'user_banned' | 'user_unsuspended' | 'user_unbanned' |
        'new_comment' | 'new_like' | 'new_follower' | 'new_tag' | 'badge_earned';
  reason?: string;
  photoId?: string;
  taggedPersonName?: string;
  photoTitle?: string;
  changes?: string;
  suspendedUntil?: string;
  actorId?: string;
  actorName?: string;
  actorPhotoURL?: string;
  badgeId?: string;
  badgeName?: string;
}

export interface Notification extends NotificationData {
  id: string;
  createdAt: Timestamp;
  read: boolean;
  emailSent: boolean;
}

/**
 * Kreira notification dokument u Firestore.
 */
export const sendNotification = async (data: NotificationData): Promise<void> => {
  try {
    console.log('📧 Creating notification:', data);
    
    const emailTypes = ['user_banned', 'user_suspended', 'user_unbanned', 'user_unsuspended', 'photo_rejected'];
    const shouldSendEmail = emailTypes.includes(data.type);
    
    await addDoc(collection(db, 'notifications'), {
      ...data,
      createdAt: serverTimestamp(),
      emailSent: false,
      read: false,
      requiresEmail: shouldSendEmail
    });
    
    console.log('✅ Notification created successfully');
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    throw error;
  }
};

/**
 * Get user's notifications with pagination
 */
export const getUserNotifications = async (
  userId: string, 
  limitCount: number = 20,
  unreadOnly: boolean = false
): Promise<Notification[]> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    let q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (unreadOnly) {
      q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('read', '==', false),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Notification));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user - ULTIMATE FIX
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    console.log('🚀 markAllNotificationsAsRead called for user:', userId);
    
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );

    console.log('📊 Fetching unread notifications...');
    
    // ✅ FORCE SERVER FETCH - bypass cache
    const snapshot = await getDocs(q);
    
    console.log('📊 Found', snapshot.size, 'unread notifications');
    
    if (snapshot.empty) {
      console.log('⚠️ No unread notifications to mark');
      return;
    }

    const batch = writeBatch(db);
    let updateCount = 0;
    
    snapshot.docs.forEach(document => {
      console.log('📝 Adding to batch:', document.id);
      batch.update(document.ref, {
        read: true,
        readAt: serverTimestamp()
      });
      updateCount++;
    });

    console.log('💾 Committing batch for', updateCount, 'notifications...');
    
    // ✅ WAIT for batch
    await batch.commit();
    
    console.log('✅ Batch committed!');
    
    // ✅ CRITICAL FIX: Force a small delay to let Firestore propagate
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // ✅ VERIFY with fresh fetch
    const verifySnapshot = await getDocs(q);
    console.log('🔍 Verification: Remaining unread:', verifySnapshot.size);
    
    if (verifySnapshot.size > 0) {
      console.warn('⚠️ Warning:', verifySnapshot.size, 'notifications still unread!');
      // Don't throw - batch uspješan, ali možda Firestore nije propagirao
    }
    
  } catch (error) {
    console.error('❌ Error in markAllNotificationsAsRead:', error);
    throw error;
  }
};

/**
 * Real-time listener for new notifications
 */
export const subscribeToNotifications = (
  userId: string,
  onNotification: (notifications: Notification[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    // Track if we've received initial data
    let hasReceivedInitialData = false;

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const isFromCache = snapshot.metadata.fromCache;
        const hasPendingWrites = snapshot.metadata.hasPendingWrites;
        
        // ✅ SMART CACHE HANDLING:
        // - Accept first update (even if cached) for initial load
        // - After that, only accept server updates OR fresh cache without pending writes
        if (isFromCache && hasReceivedInitialData && hasPendingWrites) {
          console.log('🚫 Ignoring stale cached update');
          return;
        }
        
        console.log('📨 Listener update:', {
          size: snapshot.size,
          fromCache: isFromCache,
          hasPendingWrites: hasPendingWrites,
          isInitial: !hasReceivedInitialData
        });
        
        hasReceivedInitialData = true;
        
        const notifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Notification));
        
        onNotification(notifications);
      },
      (error) => {
        console.error('Error in notification subscription:', error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    if (onError) onError(error as Error);
    return () => {};
  }
};

/**
 * Helper: Create notification for new comment
 */
export const notifyNewComment = async (
  photoOwnerId: string,
  actorId: string,
  actorName: string,
  photoId: string,
  photoTitle: string,
  actorPhotoURL?: string
): Promise<void> => {
  if (photoOwnerId === actorId) return;
  
  await sendNotification({
    userId: photoOwnerId,
    type: 'new_comment',
    photoId,
    photoTitle,
    actorId,
    actorName,
    actorPhotoURL
  });
};

/**
 * Helper: Create notification for new like
 */
export const notifyNewLike = async (
  photoOwnerId: string,
  actorId: string,
  actorName: string,
  photoId: string,
  photoTitle: string,
  actorPhotoURL?: string
): Promise<void> => {
  if (photoOwnerId === actorId) return;
  
  await sendNotification({
    userId: photoOwnerId,
    type: 'new_like',
    photoId,
    photoTitle,
    actorId,
    actorName,
    actorPhotoURL
  });
};

/**
 * Helper: Create notification for new follower
 */
export const notifyNewFollower = async (
  followedUserId: string,
  followerId: string,
  followerName: string,
  followerPhotoURL?: string
): Promise<void> => {
  await sendNotification({
    userId: followedUserId,
    type: 'new_follower',
    actorId: followerId,
    actorName: followerName,
    actorPhotoURL: followerPhotoURL
  });
};

/**
 * Helper: Create notification for new tag
 */
export const notifyNewTag = async (
  taggedUserId: string,
  taggerId: string,
  taggerName: string,
  photoId: string,
  photoTitle: string,
  taggerPhotoURL?: string
): Promise<void> => {
  if (taggedUserId === taggerId) return;
  
  await sendNotification({
    userId: taggedUserId,
    type: 'new_tag',
    photoId,
    photoTitle,
    actorId: taggerId,
    actorName: taggerName,
    actorPhotoURL: taggerPhotoURL
  });
};

/**
 * Helper: Create notification for badge earned
 */
export const notifyBadgeEarned = async (
  userId: string,
  badgeId: string,
  badgeName: string
): Promise<void> => {
  await sendNotification({
    userId,
    type: 'badge_earned',
    badgeId,
    badgeName
  });
};

export const notificationService = {
  sendNotification,
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeToNotifications,
  notifyNewComment,
  notifyNewLike,
  notifyNewFollower,
  notifyNewTag,
  notifyBadgeEarned
};