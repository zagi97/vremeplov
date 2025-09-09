import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { toast } from "sonner";
import { authService } from '../services/firebaseService';

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
const [isAdminMode, setIsAdminMode] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);


      // Check if we're in admin mode from session storage
      const adminModeFromStorage = sessionStorage.getItem('adminMode') === 'true';
      setIsAdminMode(adminModeFromStorage && user?.email === 'vremeplov.app@gmail.com');

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Successfully signed in!');
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error('Failed to sign in');
    }
  };

  const signInAdmin = async (email: string, password: string) => {
    try {
      const result = await authService.signInAdmin(email, password);
      if (result.success) {
          setIsAdminMode(true);
          sessionStorage.setItem('adminMode', 'true');
        toast.success('Successfully signed in as admin!');
      } else {
        toast.error(result.error || 'Failed to sign in');
      }
      return result;
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error('Failed to sign in');
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

   const exitAdminMode = async () => {
    try {
      setIsAdminMode(false);
      sessionStorage.removeItem('adminMode');
      await signOut(auth);
      toast.success('Exited admin mode');
    } catch (error) {
      console.error('Error exiting admin mode:', error);
      toast.error('Failed to exit admin mode');
    }
  };

  const logout = async () => {
    try {
       setIsAdminMode(false);
      sessionStorage.removeItem('adminMode');
      await signOut(auth);
      toast.success('Successfully signed out!');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const isAdmin = user ? authService.isAdmin(user) : false;

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