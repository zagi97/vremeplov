import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { toast } from "sonner";
import { authService } from '../services/authService';
import { useLanguage } from "../contexts/LanguageContext";

interface AuthContextType {
  user: User | null;
  loading: boolean;
   isAdmin: boolean;
   isAdminMode: boolean;
  signInWithGoogle: () => Promise<void>;
   signInAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
   exitAdminMode: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const { t } = useLanguage();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      // Load user's admin status from Firestore
      if (user) {
        const userIsAdmin = await authService.checkIsAdminFromFirestore(user.uid);
        setIsAdmin(userIsAdmin);

        // Check if we're in admin mode from session storage
        const adminModeFromStorage = sessionStorage.getItem('adminMode') === 'true';
        setIsAdminMode(adminModeFromStorage && userIsAdmin);
      } else {
        setIsAdmin(false);
        setIsAdminMode(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
    toast.success(t('auth.signInSuccess'));
  } catch (error: unknown) {
    console.error('Error signing in:', error);

    const isAuthError = (err: unknown): err is { code: string } => {
      return typeof err === 'object' && err !== null && 'code' in err;
    };

    // ✅ Ignoriraj errore kad korisnik zatvori popup
    if (isAuthError(error) && (
      error.code === 'auth/popup-closed-by-user' ||
      error.code === 'auth/cancelled-popup-request'
    )) {
      // Ne prikazuj error - korisnik je samo zatvorio popup
      return;
    }
    
    // ✅ Prikaži error samo za prave greške
    toast.error(t('errors.signInFailed'));
  }
};

  const signInAdmin = async (email: string, password: string) => {
    try {
      const result = await authService.signInAdmin(email, password);
      if (result.success && result.user) {
        // Check admin status from Firestore
        const userIsAdmin = await authService.checkIsAdminFromFirestore(result.user.uid);

        if (userIsAdmin) {
          // Set session storage so onAuthStateChanged can pick it up
          sessionStorage.setItem('adminMode', 'true');

          // onAuthStateChanged will be triggered by Firebase auth
          // and will set isAdmin and isAdminMode based on sessionStorage
          // We wait a bit for the auth state to propagate
          await new Promise(resolve => setTimeout(resolve, 300));

          toast.success(t('auth.adminSignInSuccess'));
        } else {
          // Not an admin, sign them out
          await authService.signOut();
          sessionStorage.removeItem('adminMode');
          toast.error('Unauthorized: Admin access only');
          return { success: false, error: 'Not an admin user' };
        }
      } else {
        toast.error(t('errors.signInFailed'));
      }
      return result;
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error(t('errors.signInFailed'));
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

   const exitAdminMode = async () => {
    try {
      setIsAdminMode(false);
      setIsAdmin(false);
      sessionStorage.removeItem('adminMode');
      await signOut(auth);
      toast.success(t('admin.adminModeExited'));
    } catch (error) {
      console.error('Error exiting admin mode:', error);
      toast.error(t('errors.adminModeExit'));
    }
  };

  const logout = async () => {
    try {
      setIsAdminMode(false);
      setIsAdmin(false);
      sessionStorage.removeItem('adminMode');
      await signOut(auth);
      toast.success(t('auth.signOutSuccess'));
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error(t('errors.signOutFailed'));
    }
  };

  const value = {
    user,
    loading,
    isAdmin,
     isAdminMode,
    signInWithGoogle,
    signInAdmin,
    exitAdminMode,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};