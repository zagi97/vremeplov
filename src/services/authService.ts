// src/services/authService.ts
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';
import {
  doc,
  getDoc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { getErrorMessage } from '../types/firebase';
import type { UserDocument } from './firebaseService';

// Admin email - should be moved to environment variable in production
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'vremeplov.app@gmail.com';

export class AuthService {
  /**
   * Sign in as admin
   */
  async signInAdmin(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Check if this is the admin email
      if (userCredential.user.email === ADMIN_EMAIL) {
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
    } catch (error: unknown) {
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Sign out current user
   */
  async signOut() {
    try {
      await firebaseSignOut(auth);
      return { success: true };
    } catch (error: unknown) {
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser() {
    return auth.currentUser;
  }

  /**
   * Check if user is admin
   */
  isAdmin(user: { email?: string | null } | null) {
    return user?.email === ADMIN_EMAIL;
  }

  /**
   * Get user by ID
   */
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

  /**
   * Create or update user document when they sign in
   */
  async createOrUpdateUser(user: { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null }): Promise<void> {
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
        // Create new user document with full profile
        const { userService } = await import('./user');
        await userService.createUserProfile(user.uid, {
          ...userData,
          bio: '',
          location: ''
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

// Create singleton instance
export const authService = new AuthService();
