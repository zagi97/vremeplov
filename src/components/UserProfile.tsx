import React from 'react';
import { User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface UserProfileProps {
  className?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ className = '' }) => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {user.photoURL ? (
        <img 
          src={user.photoURL} 
          alt={user.displayName || 'User'} 
          className="w-8 h-8 rounded-full"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
          <User className="w-4 h-4" />
        </div>
      )}
      <span className="text-sm font-medium">
        {user.displayName || 'Anonymous'}
      </span>
    </div>
  );
};

export default UserProfile;