// src/components/PhotoGrid.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "./ui/card";
import { Calendar, User, Eye, Heart } from "lucide-react";
import { Photo } from '../services/firebaseService';

interface PhotoGridProps {
  photos: Photo[];
  currentPhotoId?: string;
}

const PhotoGrid: React.FC<PhotoGridProps> = ({ photos, currentPhotoId }) => {
  // Filter out current photo if viewing photo details
  const displayPhotos = currentPhotoId 
    ? photos.filter(photo => photo.id !== currentPhotoId)
    : photos;

  if (displayPhotos.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No photos found</h3>
        <p className="text-gray-600">
          Be the first to share a historical photo!
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
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      <span>{photo.likes || 0}</span>
                    </div>
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