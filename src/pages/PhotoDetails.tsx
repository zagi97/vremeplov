import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { ArrowLeft, Calendar, User, MapPin, Tag } from "lucide-react";
import { MOCK_PHOTOS } from "../utils/mockData";
import PhotoGrid from "../components/PhotoGrid";
import PhotoTagger from "../components/PhotoTagger";
import PhotoComments from "../components/PhotoComments";
import { TooltipProvider } from "../components/ui/tooltip";
import { Photo } from "../services/firebaseService";

const PhotoDetail = () => {
  const { photoId } = useParams<{ photoId: string }>();
  const photoIdNumber = parseInt(photoId || "0", 10);
  
  const photo = MOCK_PHOTOS.find(p => p.id === photoIdNumber) || MOCK_PHOTOS[0];
  const [comments, setComments] = useState(photo.comments);
  const [taggedPersons, setTaggedPersons] = useState(photo.taggedPersons || []);
  
  const { handleImageClick, renderTaggingUI, renderTaggingForm, isTagging } = PhotoTagger({
    taggedPersons,
    onAddTag: (newTag) => {
      const newTagWithId = {
        ...newTag,
        id: Date.now() // Use timestamp for unique ID
      };
      setTaggedPersons([...taggedPersons, newTagWithId]);
    }
  });
  
  const handleAddComment = (text: string) => {
    const newCommentObj = {
      id: comments.length + 1,
      author: "You",
      text,
      date: "Just now"
    };
    
    setComments([newCommentObj, ...comments]);
  };


  // Convert mock photos to Firebase Photo format for the grid
  const convertedPhotos: Photo[] = MOCK_PHOTOS.map(mockPhoto => ({
    id: mockPhoto.id.toString(),
    imageUrl: mockPhoto.imageUrl,
    imageStoragePath: '',
    year: mockPhoto.year,
    description: mockPhoto.description,
    detailedDescription: '',
    author: mockPhoto.author,
    location: mockPhoto.location,
    createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
    updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
    likes: 0,
    views: 0,
    isApproved: true,
    tags: []
  }));

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-6">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex items-center mb-4">
            <Link to={`/location/${encodeURIComponent(photo.location)}`}>
              <Button variant="ghost" className="text-white hover:bg-white/10 p-2 mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold">Vremeplov.hr</h1>
          </div>
          <div className="mt-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">{photo.description}</h2>
            <p className="text-gray-300">{photo.location}, {photo.year}</p>
          </div>
        </div>
      </header>

      <div className="container max-w-5xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Photo Section - This is where the user clicks to add a tag */}
          <div className="relative">
            <TooltipProvider>
              <div 
                className="relative aspect-[16/9] cursor-pointer" 
                onClick={handleImageClick}
              >
                <img 
                  src={photo.imageUrl} 
                  alt={photo.description} 
                  className="w-full h-full object-cover"
                />
                
                {renderTaggingUI()}
              </div>
            </TooltipProvider>
          </div>

          {/* Tagging Form - Now rendered OUTSIDE the image */}
          {renderTaggingForm()}

          {/* Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-8 p-6">
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">About this photo</h2>
                <div className="grid grid-cols-2 gap-y-4 text-gray-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Year: {photo.year}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <span>Author: {photo.author}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <span>Location: {photo.location}</span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <p className="text-gray-700 leading-relaxed">
                    This historical photograph from {photo.year} shows {photo.description} in {photo.location}. 
                    It was contributed to the Vremeplov.hr archive by {photo.author}.
                  </p>
                </div>
                
                {/* Tagged People List */}
                {taggedPersons.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Tagged People</h3>
                    <div className="flex flex-wrap gap-2">
                      {taggedPersons.map((person) => (
                        <div key={person.id} className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                          <User className="h-3 w-3 mr-1 text-gray-600" />
                          <span className="text-sm">{person.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Comments Section */}
              <PhotoComments 
                comments={comments}
                onAddComment={handleAddComment}
              />
            </div>
            
            <div className="hidden md:block">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-lg mb-3">Historical Context</h3>
                <p className="text-gray-700">
                  This period marked significant developments in the local history of {photo.location}. 
                  Many similar photographs from this era document the changing landscape and 
                  daily life of inhabitants.
                </p>
                
                <h3 className="font-medium text-lg mt-6 mb-3">Related Photos</h3>
                <div className="space-y-3">
                  {MOCK_PHOTOS.filter(p => p.id !== photo.id).slice(0, 2).map((relatedPhoto) => (
                    <Link 
                      key={relatedPhoto.id} 
                      to={`/photo/${relatedPhoto.id}`}
                      className="block hover:opacity-90 transition-opacity"
                    >
                      <div className="aspect-[4/3] overflow-hidden rounded-md mb-2">
                        <img 
                          src={relatedPhoto.imageUrl} 
                          alt={relatedPhoto.description} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-sm font-medium">{relatedPhoto.description}</p>
                      <p className="text-xs text-gray-500">{relatedPhoto.year}, {relatedPhoto.location}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Related Photos Grid */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">More Photos from {photo.location}</h2>
          <PhotoGrid 
           photos={convertedPhotos} 
          currentPhotoId={photoIdNumber.toString()}
          />
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-10 px-4 bg-gradient-to-r from-gray-900 to-gray-800 text-gray-400 mt-12">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold text-white">Vremeplov.hr</h2>
              <p className="mt-2">Preserving Croatian heritage, one memory at a time.</p>
            </div>
            <div className="flex space-x-6">
              <Link to="/" className="hover:text-white transition-colors">About</Link>
              <Link to="/" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p>© {new Date().getFullYear()} Vremeplov.hr. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PhotoDetail;