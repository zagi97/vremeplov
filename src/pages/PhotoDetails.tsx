import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { ArrowLeft, Calendar, User, MapPin, Tag, Heart, Eye } from "lucide-react";
import UserProfile from "../components/UserProfile";
import PhotoGrid from "../components/PhotoGrid";
import PhotoTagger from "../components/PhotoTagger";
import PhotoComments from "../components/PhotoComments";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "../components/ui/tooltip";
import { CharacterCounter } from "../components/ui/character-counter";
import { photoService, Photo } from "../services/firebaseService";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

const PhotoDetail = () => {
  const { photoId } = useParams<{ photoId: string }>();
  const { user } = useAuth();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [relatedPhotos, setRelatedPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [taggedPersons, setTaggedPersons] = useState<any[]>([]);
  const [likes, setLikes] = useState(0);
  const [views, setViews] = useState(0);
  const [isTagging, setIsTagging] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [tagPosition, setTagPosition] = useState({ x: 0, y: 0 });
  const [hasSelectedPosition, setHasSelectedPosition] = useState(false);

  
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
        console.log('Loaded photo data:', photoData);
        console.log('Photo uploadedBy:', photoData.uploadedBy);
        console.log('Photo uploadedAt:', photoData.uploadedAt);
        setLikes(photoData.likes || 0);
        setViews(photoData.views || 0);
        
        // Increment view count (only if user is logged in)
        if (user) {
          await photoService.incrementViews(photoId, user.uid);
          setViews(prev => prev + 1);
        }
        
        // Load comments
        const photoComments = await photoService.getCommentsByPhotoId(photoId);
        setComments(photoComments.map(comment => ({
          id: comment.id,
          author: comment.author,
          text: comment.text,
          date: comment.createdAt.toDate().toLocaleDateString()
        })));
        
        // Load tagged persons with proper visibility rules
        let taggedPersonsData;
        if (user?.email === 'vremeplov.app@gmail.com') {
          // Admin sees all tags
          taggedPersonsData = await photoService.getTaggedPersonsByPhotoIdForAdmin(photoId);
        } else {
          // Regular users see approved tags + their own pending tags + pending tags on their photos
          taggedPersonsData = await photoService.getTaggedPersonsByPhotoIdForUser(photoId, user?.uid, photoData.authorId);
        }
        
        console.log('Loaded tagged persons:', taggedPersonsData);
        
        // Also load tagged persons from photo document (if any)
        const photoTaggedPersons = photoData.taggedPersons || [];
        console.log('Tagged persons from photo document:', photoTaggedPersons);
        
        // Combine both sources, giving priority to the separate collection
        const allTaggedPersons = [
          ...taggedPersonsData,
          ...photoTaggedPersons.map((person, index) => ({
            id: `photo_${index}`,
            name: person.name,
            x: person.x,
            y: person.y,
            photoId: photoId,
            addedBy: 'System'
          }))
        ];
        
        setTaggedPersons(allTaggedPersons);
        
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
  }, [photoId, user]);
  
  const handleAddTag = async (newTag: Omit<{ id: number; name: string; x: number; y: number; }, 'id'>) => {
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
        id: parseInt(tagId),
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
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isTagging) return;
    
    // Get the image container element
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Calculate exact mouse position within the image as percentage
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    console.log('Tag position calculated:', { x, y });
    
    // Store the exact position values
    setTagPosition({ x, y });
    setHasSelectedPosition(true);
    
    toast.info("Position selected. Please enter a name for the tag.");
  };
  
  const handleSubmitTag = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!newTagName.trim() || !hasSelectedPosition) {
      toast.error("Please enter a name and select a position on the image");
      return;
    }
    
    // Save the tag with the exact position
    handleAddTag({
      name: newTagName,
      x: tagPosition.x,
      y: tagPosition.y
    });
    
    console.log('Tag saved with position:', tagPosition);
    
    // Reset the form
    setNewTagName("");
    setIsTagging(false);
    setHasSelectedPosition(false);
    toast.success(`Tagged ${newTagName} in the photo!`);
  };
  
  const cancelTagging = () => {
    setIsTagging(false);
    setNewTagName("");
    setHasSelectedPosition(false);
  };
    
  
  const handleAddComment = async (text: string) => {
    if (!photoId || !user) return;
    
    try {
      const authorName = user.displayName || user.email || 'Anonymous User';
      console.log('Adding new comment:', text);
      const commentId = await photoService.addComment(photoId, authorName, text);
      
      const newComment = {
        id: commentId,
        author: authorName,
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

  const handleLike = async () => {
    if (!photoId) return;
    
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
      
      setLikes(result.newLikesCount);
      toast.success('Photo liked!');
    } catch (error) {
      console.error('Error liking photo:', error);
      toast.error('Failed to like photo');
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Link to={`/location/${encodeURIComponent(photo.location)}`}>
                <Button variant="ghost" className="text-white hover:bg-white/10 p-2 mr-2">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold">Vremeplov.hr</h1>
            </div>
            <div className="flex items-center gap-4">
              
            </div>
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
          <div className="relative w-full">
            <TooltipProvider>
              <div 
                className="relative w-full cursor-pointer"
                onClick={handleImageClick}
              >
                <img 
                  src={photo.imageUrl} 
                  alt={photo.description} 
                  className="w-full h-auto object-cover"
                />
                
                {/* Tagged persons dots */}
                {taggedPersons.map((person) => (
                  <Tooltip key={person.id}>
                    <TooltipTrigger asChild>
                      <div 
                        className="absolute w-6 h-6 bg-blue-500 border-2 border-white rounded-full -ml-3 -mt-3 cursor-pointer hover:scale-110 transition-transform"
                        style={{ 
                          left: `${person.x}%`, 
                          top: `${person.y}%` 
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <span className="font-medium text-gray-500">{person.name}</span>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
                
                {/* Current tag position marker */}
                {isTagging && hasSelectedPosition && (
                  <div 
                    className="absolute w-6 h-6 bg-green-500 border-2 border-white rounded-full -ml-3 -mt-3 animate-pulse"
                    style={{ 
                      left: `${tagPosition.x}%`, 
                      top: `${tagPosition.y}%` 
                    }}
                  />
                )}
                
                {/* Tag Button - Only show if user is authenticated */}
                {user && (
                  <div className="absolute bottom-4 right-4">
                    {!isTagging && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsTagging(true);
                        }}
                        variant="secondary"
                        className="bg-white/80 hover:bg-white/90"
                      >
                        <Tag className="h-4 w-4 mr-2" />
                        Tag Person
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </TooltipProvider>
          </div>

          {/* Tagging Interface - Below the image */}
          {isTagging && (
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              {!hasSelectedPosition ? (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Click on the photo to position the tag</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitTag} className="space-y-3 max-w-md mx-auto">
                  <Input
                    type="text"
                    placeholder="Person's name"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    maxLength={40}
                    autoFocus
                    className={newTagName.length >= 38 ? "border-red-300 focus:border-red-500" : ""}
                  />
                  <CharacterCounter currentLength={newTagName.length} maxLength={40} />
                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={!newTagName.trim() || !hasSelectedPosition}
                    >
                      Save Tag
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={cancelTagging}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          

          {/* Photo Stats and Actions */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-gray-600">
                  <Eye className="h-5 w-5" />
                  <span className="text-sm">{views} views</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Heart className="h-5 w-5" />
                  <span className="text-sm">{likes} likes</span>
                </div>
              </div>
             {user ? (
                <Button 
                  onClick={handleLike}
                  variant="outline" 
                  className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                >
                  <Heart className="h-4 w-4" />
                  Like Photo
                </Button>
              ) : (
  <Button 
    onClick={() => {
      toast.info('Please sign in to like photos and interact with memories');
      // Optionally, you can trigger your sign-in modal here
    }}
    variant="outline" 
    className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
  >
    <Heart className="h-4 w-4" />
    Sign In to Like
  </Button>
)}
            </div>
          </div>

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
                  {photo.uploadedBy && (
                    <div className="flex items-center gap-2 col-span-2">
                      <User className="h-5 w-5 text-green-600" />
                      <span>Uploaded by: {photo.uploadedBy}</span>
                      {photo.uploadedAt && (
                        <span className="text-gray-500 ml-2">
                          on {new Date(photo.uploadedAt).toLocaleDateString('hr-HR', {
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric'
                          })}
                        </span>
                      )}
                    </div>
                  )}
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
        
        {/* Related Photos Grid */}
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