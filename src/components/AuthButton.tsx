import React from 'react';
import { Button } from './ui/button';
import { LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

const AuthButton: React.FC<AuthButtonProps> = ({ 
  variant = 'outline', 
  size = 'default',
  className = ''
}) => {
  const { user, loading, signInWithGoogle, logout } = useAuth();

  if (loading) {
    return (
      <Button 
        variant={variant} 
        size={size} 
        className={`bg-transparent border-2 border-white text-white ${className}`}
        disabled
      >
        <User className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    );
  }

  if (user) {
    return (
      <Button 
        variant={variant} 
        size={size} 
        className={`bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 transition-colors ${className}`}
        onClick={logout}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    );
  }

  return (
    <Button 
      variant={variant} 
      size={size} 
      className={`bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 transition-colors ${className}`}
      onClick={signInWithGoogle}
    >
      <LogIn className="h-4 w-4 mr-2" />
      Sign In
    </Button>
  );
};

export default AuthButton;