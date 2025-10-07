// Ažurirani PhotoGrid.tsx s LazyImage

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "./ui/card";
import { Calendar, User, Eye, Heart } from "lucide-react";
import { Photo, photoService } from '../services/firebaseService';
import { toast } from "sonner";
import { useAuth } from '../contexts/AuthContext';
import LazyImage from './LazyImage'; // DODANO
import { useLanguage } from "../contexts/LanguageContext";

interface PhotoGridProps {
  photos: Photo[];
  currentPhotoId?: string;
  onPhotoUpdate?: (photoId: string, updatedPhoto: Photo) => void;
}

const PhotoGrid: React.FC<PhotoGridProps> = ({ photos, currentPhotoId, onPhotoUpdate }) => {
  const [photosState, setPhotosState] = useState<Photo[]>(photos);
  const { user } = useAuth();
  const { t } = useLanguage();
  
  // Update local state when photos prop changes
  React.useEffect(() => {
    setPhotosState(photos);
  }, [photos]);
  
  // Filter out current photo if viewing photo details
  const displayPhotos = currentPhotoId 
    ? photosState.filter(photo => photo.id !== currentPhotoId)
    : photosState;

  const handleLike = async (e: React.MouseEvent, photoId: string) => {
    e.preventDefault(); 
    e.stopPropagation();
    
    if (!user) {
      toast.error(t('errors.signInRequired'));
      return;
    }
    
    try {
      const result = await photoService.toggleLike(photoId, user.uid);
      
      setPhotosState(prev => 
        prev.map(photo => 
          photo.id === photoId 
            ? { ...photo, likes: result.newLikesCount }
            : photo
        )
      );
      
      if (onPhotoUpdate) {
        const updatedPhoto = photosState.find(p => p.id === photoId);
        if (updatedPhoto) {
          onPhotoUpdate(photoId, { ...updatedPhoto, likes: result.newLikesCount });
        }
      }
      
      if (result.liked) {
        toast.success(t('photoDetail.photoLiked'));
      } else {
        
        toast.success(t('photoDetail.photoUnliked'));
      }
    } catch (error) {
      console.error('Error liking photo:', error);
       toast.error(t('errors.likeFailed'));
    }
  };

  if (displayPhotos.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No photos found</h3>
        <p className="text-gray-600">
          Be the first to share a historical photo of this location!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {displayPhotos.map((photo) => (
        <Link 
          key={photo.id} 
          to={`/photo/${photo.id}`}
          className="group block"
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="relative w-full h-64 overflow-hidden"> {/* Fiksna visina */}
  <LazyImage
    src={photo.imageUrl}
    alt={photo.description}
    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
    threshold={0.2}
    rootMargin="150px"
    placeholder={
      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-sm font-medium">{photo.location}</div>
          <div className="text-xs">{photo.year}</div>
        </div>
      </div>
    }
  />
</div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors">
                {photo.description}
              </h3>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{photo.year}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{photo.author}</span>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{photo.views || 0}</span>
                    </div>
                    <button 
                      onClick={(e) => handleLike(e, photo.id!)}
                      className="flex items-center gap-1 hover:text-red-500 transition-colors"
                    >
                      <Heart className="h-3 w-3" />
                      <span>{photo.likes || 0}</span>
                    </button>
                  </div>
                  
                  {photo.photoType && (
                    <div className="flex gap-1">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {photo.photoType}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default PhotoGrid;