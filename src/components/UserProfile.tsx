// UserProfile.tsx - optimizirana za male ekrane
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { User, LogOut, Trophy } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface UserProfileProps {
  className?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ className }) => {
  const { user, signInWithGoogle, logout } = useAuth();
  const { t } = useLanguage();

  if (!user) {
    return (  
      <Button 
        onClick={signInWithGoogle} 
        variant="ghost" 
        size="sm"
        className={cn("text-white hover:bg-white/20 transition-colors text-xs sm:text-sm px-2 sm:px-4", className)}
      >
        {t('nav.login')}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("h-auto p-1 sm:p-2 hover:bg-white/20 transition-colors", className)}>
          <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
            <AvatarFallback className="bg-blue-600 text-white text-xs">
              {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link to={`/user/${user.uid}`} className="flex items-center gap-2 cursor-pointer">
            <User className="h-4 w-4" />
            {t('userProfile.myProfile')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/community" className="flex items-center gap-2 cursor-pointer">
            <Trophy className="h-4 w-4" />
            {t('userProfile.community')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={logout} className="flex items-center gap-2 cursor-pointer">
          <LogOut className="h-4 w-4" />
          {t('userProfile.signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfile;