// src/components/PhotoGrid.tsx
import { Link } from 'react-router-dom';
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { MessageSquare, Calendar, User, MapPin } from "lucide-react";

// Photo type definition
export interface Photo {
  id: number;
  imageUrl: string;
  year: string;
  description: string;
  author: string;
  location: string;
  comments: any[]; // Could be more specific if needed
  taggedPersons?: { id: number; name: string; x: number; y: number }[];
}

interface PhotoGridProps {
  photos: Photo[];
  currentPhotoId?: number;
}

const PhotoGrid = ({ photos, currentPhotoId }: PhotoGridProps) => {
  // Filter out the current photo if viewing details
  const filteredPhotos = currentPhotoId 
    ? photos.filter(photo => photo.id !== currentPhotoId)
    : photos;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
      {filteredPhotos.map((photo) => (
        <Card key={photo.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <div className="relative aspect-video bg-gray-200">
            <img 
              src={photo.imageUrl} 
              alt={photo.description} 
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
              <Calendar className="h-4 w-4 inline mr-1" />
              {photo.year}
            </div>
          </div>
          <CardContent className="p-5">
            <h3 className="font-semibold text-lg mb-2">{photo.description}</h3>
            <div className="flex items-center text-gray-600 mb-3">
              <User className="h-4 w-4 mr-1" />
              <span className="text-sm">{photo.author}</span>
              <MapPin className="h-4 w-4 ml-4 mr-1" />
              <span className="text-sm">{photo.location}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-gray-600">
                <MessageSquare className="h-4 w-4 inline mr-1" />
                <span className="text-sm">{photo.comments.length} Comments</span>
              </div>
              <Link to={`/photo/${photo.id}`}>
                <Button 
                  variant="ghost" 
                  size="sm"
                >
                  View Details
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PhotoGrid;
