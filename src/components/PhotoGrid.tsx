import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "./ui/card";
import { Calendar, User, Eye, Heart } from "lucide-react";
import { Photo, photoService } from '../services/firebaseService';
import { toast } from "sonner";
import { useAuth } from '../contexts/AuthContext';

interface PhotoGridProps {
  photos: Photo[];
  currentPhotoId?: string;
  onPhotoUpdate?: (photoId: string, updatedPhoto: Photo) => void;
}

const PhotoGrid: React.FC<PhotoGridProps> = ({ photos, currentPhotoId, onPhotoUpdate }) => {
  const [photosState, setPhotosState] = useState<Photo[]>(photos);
  const { user } = useAuth();
  
  // Update local state when photos prop changes
  React.useEffect(() => {
    setPhotosState(photos);
  }, [photos]);
  
  // Filter out current photo if viewing photo details
  const displayPhotos = currentPhotoId 
    ? photosState.filter(photo => photo.id !== currentPhotoId)
    : photosState;

  const handleLike = async (e: React.MouseEvent, photoId: string) => {
    e.preventDefault(); // Prevent navigation to photo detail
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please sign in to like photos');
      return;
    }
    
    try {
      const result = await photoService.toggleLike(photoId, user.uid);
      
      if (result.alreadyLiked) {
        toast.info('You have already liked this photo');
        return;
      }
      
      // Update local state
      setPhotosState(prev => 
        prev.map(photo => 
          photo.id === photoId 
            ? { ...photo, likes: result.newLikesCount }
            : photo
        )
      );
      
      // Call parent update if provided
      if (onPhotoUpdate) {
        const updatedPhoto = photosState.find(p => p.id === photoId);
        if (updatedPhoto) {
          onPhotoUpdate(photoId, { ...updatedPhoto, likes: result.newLikesCount });
        }
      }
      
      toast.success('Photo liked!');
    } catch (error) {
      console.error('Error liking photo:', error);
      toast.error('Failed to like photo');
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
            <div className="aspect-[4/3] overflow-hidden">
              <img 
                src={photo.imageUrl} 
                alt={photo.description}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  // Fallback for broken images
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=1932';
                }}
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
                  
                  {photo.tags && photo.tags.length > 0 && (
                    <div className="flex gap-1">
                      {photo.tags.slice(0, 2).map((tag, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {photo.tags.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{photo.tags.length - 2}
                        </span>
                      )}
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