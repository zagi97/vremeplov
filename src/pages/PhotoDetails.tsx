import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { ArrowLeft, Calendar, User, MapPin, Tag } from "lucide-react";
import PhotoGrid from "../components/PhotoGrid";
import PhotoTagger from "../components/PhotoTagger";
import PhotoComments from "../components/PhotoComments";
import { TooltipProvider } from "../components/ui/tooltip";
import { photoService, Photo } from "../services/firebaseService";
import { toast } from "sonner";

const PhotoDetail = () => {
  const { photoId } = useParams<{ photoId: string }>();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [relatedPhotos, setRelatedPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [taggedPersons, setTaggedPersons] = useState<any[]>([]);
  
  // Load photo data
  useEffect(() => {
    const loadPhotoData = async () => {
      if (!photoId) return;
      
      try {
        setLoading(true);
        
        // Load the main photo
        const photoData = await photoService.getPhotoById(photoId);
        if (!photoData) {
          toast.error('Photo not found');
          return;
        }
        
        setPhoto(photoData);
        
        // Increment view count
        await photoService.incrementViews(photoId);
        
        // Load comments
        const photoComments = await photoService.getCommentsByPhotoId(photoId);
        setComments(photoComments.map(comment => ({
          id: comment.id,
          author: comment.author,
          text: comment.text,
          date: comment.createdAt.toDate().toLocaleDateString()
        })));
        
        // Load tagged persons
        const taggedPersonsData = await photoService.getTaggedPersonsByPhotoId(photoId);
        console.log('Loaded tagged persons:', taggedPersonsData);
        setTaggedPersons(taggedPersonsData);
        
        // Load related photos from the same location
        if (photoData.location) {
          const locationPhotos = await photoService.getPhotosByLocation(photoData.location);
          // Filter out current photo and take first 6 for related photos
          const related = locationPhotos.filter(p => p.id !== photoId).slice(0, 6);
          setRelatedPhotos(related);
        }
        
      } catch (error) {
        console.error('Error loading photo data:', error);
        toast.error('Failed to load photo details');
      } finally {
        setLoading(false);
      }
    };

    loadPhotoData();
  }, [photoId]);
  
  const { handleImageClick, renderTaggingUI, renderTaggingForm, isTagging } = PhotoTagger({
    taggedPersons,
    onAddTag: async (newTag) => {
      if (!photoId) return;
      
      try {
        console.log('Adding new tag:', newTag);
        const tagId = await photoService.addTaggedPerson({
          photoId,
          name: newTag.name,
          x: newTag.x,
          y: newTag.y,
          description: '',
          addedBy: 'User' // In a real app, this would be the current user
        });
        // Create the new tag object with Firebase ID
        const newTagWithId = {
          id: tagId,
          name: newTag.name,
          x: newTag.x,
          y: newTag.y,
          photoId,
          addedBy: 'User'
        };
         
        console.log('Tag saved with ID:', tagId);
        setTaggedPersons([...taggedPersons, newTagWithId]);
        toast.success('Person tagged successfully!');
      } catch (error) {
        console.error('Error adding tag:', error);
        toast.error('Failed to add tag');
      }
    }
  });
  
  const handleAddComment = async (text: string) => {
    if (!photoId) return;
    
    try {
      console.log('Adding new comment:', text);
      const commentId = await photoService.addComment(photoId, 'You', text);
      
      const newComment = {
        id: commentId,
        author: "You",
        text,
        date: "Just now"
      };
      console.log('Comment saved with ID:', commentId);
      setComments([newComment, ...comments]);
      toast.success('Comment added successfully!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading memory...</p>
        </div>
      </div>
    );
  }

  if (!photo) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Photo not found</h2>
          <p className="text-gray-600 mb-4">The requested memory could not be found.</p>
          <Link to="/">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Return to Homepage
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
         {/* Photo Section */}
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

          {/* Tagging Form */}
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
                  {photo.detailedDescription || `This historical photograph from ${photo.year} shows ${photo.description} in ${photo.location}. It was contributed to the Vremeplov.hr archive by ${photo.author}.`}
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
                {relatedPhotos.length > 0 && (
                  <>
                    <h3 className="font-medium text-lg mt-6 mb-3">Related Photos</h3>
                    <div className="space-y-3">
                      {relatedPhotos.slice(0, 2).map((relatedPhoto) => (
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
                  </>
                )}

              </div>
            </div>
          </div>
        </div>
        
        {relatedPhotos.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">More Photos from {photo.location}</h2>
            <PhotoGrid 
              photos={relatedPhotos} 
              currentPhotoId={photoId}
            />
          </div>
        )}
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