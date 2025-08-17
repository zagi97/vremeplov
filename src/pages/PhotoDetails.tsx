// PhotoDetail.tsx
import LazyImage from "../components/LazyImage";
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ArrowLeft, Calendar, User, MapPin, Tag, Heart, Eye } from "lucide-react";
import PhotoGrid from "../components/PhotoGrid";
import PhotoComments from "../components/PhotoComments";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "../components/ui/tooltip";
import { CharacterCounter } from "../components/ui/character-counter";
import { photoService, Photo } from "../services/firebaseService";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import LanguageSelector from "../components/LanguageSelector";
import { useLanguage, translateWithParams } from "../contexts/LanguageContext";
import PhotoLocationMap from "../components/PhotoLocationMap";
import { useNavigate } from 'react-router-dom';

const PhotoDetail = () => {
  const { t } = useLanguage();
  const { photoId } = useParams<{ photoId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
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
  const [userHasLiked, setUserHasLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const handleBack = () => {
    if (window.history.length > 1 && document.referrer) {
      navigate(-1);
    } else {
      if (photo?.location) {
        navigate(`/location/${encodeURIComponent(photo.location)}`);
      } else {
        navigate('/');
      }
    }
  };
  
  // Load photo data
  useEffect(() => {
    const loadPhotoData = async () => {
      if (!photoId) return;
      
      try {
        setLoading(true);
        
        const photoData = await photoService.getPhotoById(photoId);
        if (!photoData) {
          toast.error(t('photoDetail.notFound'));
          return;
        }
        
        setPhoto(photoData);
        setLikes(photoData.likes || 0);
        setViews(photoData.views || 0);
        
        if (user) {
          const hasLiked = await photoService.hasUserLiked(photoId, user.uid);
          setUserHasLiked(hasLiked);
          
          await photoService.incrementViews(photoId, user.uid);
        }
        
        const photoComments = await photoService.getCommentsByPhotoId(photoId);
        setComments(photoComments.map(comment => ({
          id: comment.id,
          author: comment.author,
          text: comment.text,
          date: comment.createdAt.toDate().toLocaleDateString()
        })));
        
        let taggedPersonsData;
        if (user?.email === 'vremeplov.app@gmail.com') {
          taggedPersonsData = await photoService.getTaggedPersonsByPhotoIdForAdmin(photoId);
        } else {
          taggedPersonsData = await photoService.getTaggedPersonsByPhotoIdForUser(photoId, user?.uid, photoData.authorId);
        }
        
        const photoTaggedPersons = photoData.taggedPersons || [];
        
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
        toast.error(t('upload.error'));
      } finally {
        setLoading(false);
      }
    };

    loadPhotoData();
  }, [photoId, user, t]);
  
  const handleAddTag = async (newTag: Omit<{ id: number; name: string; x: number; y: number; }, 'id'>) => {
    if (!photoId) return;
    
    try {
      const tagId = await photoService.addTaggedPerson({
        photoId,
        name: newTag.name,
        x: newTag.x,
        y: newTag.y,
        description: '',
        addedBy: 'User'
      });
      
      const newTagWithId = {
        id: parseInt(tagId),
        name: newTag.name,
        x: newTag.x,
        y: newTag.y,
        photoId,
        addedBy: 'User'
      };
      
      setTaggedPersons([...taggedPersons, newTagWithId]);
      toast.success(t('photoDetail.taggedSuccess'));
    } catch (error) {
      console.error('Error adding tag:', error);
      toast.error(t('photoDetail.tagSaveFailed'));
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isTagging) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setTagPosition({ x, y });
    setHasSelectedPosition(true);
    
    toast.info(t('photoDetail.positionSelected'));
  };
  
  const handleSubmitTag = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!newTagName.trim() || !hasSelectedPosition) {
      toast.error(t('photoDetail.enterNameAndPosition'));
      return;
    }
    
    handleAddTag({
      name: newTagName,
      x: tagPosition.x,
      y: tagPosition.y
    });
    
    setNewTagName("");
    setIsTagging(false);
    setHasSelectedPosition(false);
    toast.success(translateWithParams(t, 'photoDetail.taggedSuccess', { name: newTagName }));
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
      const commentId = await photoService.addComment(photoId, authorName, text);
      
      const newComment = {
        id: commentId,
        author: authorName,
        text,
        date: "Just now"
      };
      
      setComments([newComment, ...comments]);
      toast.success(t('photoDetail.commentAdded'));
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error(t('photoDetail.commentFailed'));
    }
  };

  const handleLike = async () => {
    if (!photoId || !user || likeLoading) return;
    
    if (!user) {
      toast.error(t('photoDetail.signInMessage'));
      return;
    }
    
    try {
      setLikeLoading(true);
      
      const result = await photoService.toggleLike(photoId, user.uid);
      
      setLikes(result.newLikesCount);
      setUserHasLiked(result.liked);
      
      if (result.liked) {
        toast.success(t('photoDetail.photoLiked'));
      } else {
        toast.success(t('photoDetail.photoUnliked'));
      }
      
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error(t('photoDetail.likeFailed'));
    } finally {
      setLikeLoading(false);
    }
  };

  const debugLike = async () => {
    if (!photoId || !user) return;
    
    console.log('=== LIKE DEBUG START ===');
    console.log('Photo ID:', photoId);
    console.log('User ID:', user.uid);
    
    try {
      const hasLiked = await photoService.hasUserLiked(photoId, user.uid);
      console.log('User has liked before:', hasLiked);
      
      const currentPhoto = await photoService.getPhotoById(photoId);
      console.log('Current photo likes:', currentPhoto?.likes);
      
      const result = await photoService.toggleLike(photoId, user.uid);
      console.log('Toggle result:', result);
      
      const newLikeStatus = await photoService.hasUserLiked(photoId, user.uid);
      console.log('New like status:', newLikeStatus);
      
      const updatedPhoto = await photoService.getPhotoById(photoId);
      console.log('Updated photo likes:', updatedPhoto?.likes);
      
      console.log('=== LIKE DEBUG END ===');
      
      setLikes(result.newLikesCount);
      setUserHasLiked(result.liked);
      
      const { userService } = await import('../services/userService');
      if (updatedPhoto?.authorId) {
        await userService.forceRecalculateUserStats(updatedPhoto.authorId);
        console.log('User stats recalculated for:', updatedPhoto.authorId);
      }
      
    } catch (error) {
      console.error('Debug like error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('photoDetail.loading')}</p>
        </div>
      </div>
    );
  }

  if (!photo) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('photoDetail.notFound')}</h2>
          <p className="text-gray-600 mb-4">{t('photoDetail.notFoundDesc')}</p>
          <Link to="/">
            <Button className="bg-blue-600 hover:bg-blue-700">
              {t('photoDetail.returnHome')}
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
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/10 p-2 mr-2"
                onClick={handleBack}
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl md:text-3xl font-bold">Vremeplov.hr</h1>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSelector />
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
                <LazyImage
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
                        {t('photoDetail.tagPerson')}
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
                  <p className="text-sm text-gray-600 mb-2">{t('photoDetail.clickToPosition')}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitTag} className="space-y-3 max-w-md mx-auto">
                  <Input
                    type="text"
                    placeholder={t('photoDetail.personName')}
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
                      {t('photoDetail.saveTag')}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={cancelTagging}
                    >
                      {t('photoDetail.cancel')}
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
                  <span className="text-sm">{views} {t('photoDetail.views')}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Heart className="h-5 w-5" />
                  <span className="text-sm">{likes} {t('photoDetail.likes')}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {user ? (
                  <>
                    <Button 
                      onClick={handleLike}
                      disabled={likeLoading}
                      variant={userHasLiked ? "default" : "outline"}
                      className={`flex items-center gap-2 ${
                        userHasLiked 
                          ? "bg-red-600 text-white hover:bg-red-700" 
                          : "hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                      }`}
                    >
                      {likeLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                      ) : (
                        <Heart className={`h-4 w-4 ${userHasLiked ? "fill-current" : ""}`} />
                      )}
                      {userHasLiked ? t('photoDetail.unlikePhoto') : t('photoDetail.likePhoto')}
                    </Button>
                    
                    {/* Debug Button - Remove after testing */}
                    <Button 
                      onClick={debugLike} 
                      variant="outline" 
                      size="sm"
                      className="text-xs"
                    >
                      Debug Like ({likes})
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => {
                      toast.info(t('photoDetail.signInMessage'));
                    }}
                    variant="outline" 
                    className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                  >
                    <Heart className="h-4 w-4" />
                    {t('photoDetail.signInToLike')}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-8 p-6">
            {/* Left Column - Main Content */}
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">{t('photoDetail.aboutPhoto')}</h2>
                <div className="grid grid-cols-2 gap-y-4 text-gray-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">{t('photoDetail.year')}: {photo.year}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <span>{t('photoDetail.author')}: {photo.author}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <span>{t('photoDetail.location')}: {photo.location}</span>
                  </div>
                  {photo.uploadedBy && (
                    <div className="flex items-center gap-2 col-span-2">
                      <User className="h-5 w-5 text-green-600" />
                      <span>{t('photoDetail.uploadedBy')}: {photo.uploadedBy}</span>
                      {photo.uploadedAt && (
                        <span className="text-gray-500 ml-2">
                          {t('photoDetail.on')} {new Date(photo.uploadedAt).toLocaleDateString('hr-HR', {
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
                    {photo.detailedDescription || translateWithParams(t, 'photoDetail.defaultDescription', {
                      year: photo.year,
                      description: photo.description,
                      location: photo.location,
                      author: photo.author
                    })}
                  </p>
                </div>
                
                {/* Tagged People List */}
                {taggedPersons.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">{t('photoDetail.taggedPeople')}</h3>
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
            
            {/* Right Column - Sidebar */}
            <div className="hidden md:block">
              {/* Location Map */}
              <PhotoLocationMap 
                photo={{
                  id: photo.id || '',
                  description: photo.description,
                  location: photo.location,
                  coordinates: photo.coordinates
                }}
                nearbyPhotos={relatedPhotos.slice(0, 3).map(p => ({
                  id: p.id || '',
                  description: p.description,
                  imageUrl: p.imageUrl,
                  year: p.year
                }))}
              />
              
              {/* Historical Context */}
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <h3 className="font-medium text-lg mb-3">{t('photoDetail.historicalContext')}</h3>
                <p className="text-gray-700">
                  {translateWithParams(t, 'photoDetail.historicalContextDesc', {
                    location: photo.location
                  })}
                </p>
              </div>
              
              {/* Related Photos */}
              {relatedPhotos.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium text-lg mb-3">{t('photoDetail.relatedPhotos')}</h3>
                  <div className="space-y-3">
                    {relatedPhotos.slice(0, 2).map((relatedPhoto) => (
                      <Link 
                        key={relatedPhoto.id} 
                        to={`/photo/${relatedPhoto.id}`}
                        className="block hover:opacity-90 transition-opacity"
                      >
                        <div className="aspect-[4/3] overflow-hidden rounded-md mb-2">
                          <LazyImage
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
              )}
            </div>
          </div>
        </div>
        
        {/* Related Photos Grid */}
        {relatedPhotos.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">{t('photoDetail.morePhotosFrom')} {photo.location}</h2>
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
              <p className="mt-2">{t('footer.tagline')}</p>
            </div>
            <div className="flex space-x-6">
              <Link to="/" className="hover:text-white transition-colors">{t('footer.about')}</Link>
              <Link to="/" className="hover:text-white transition-colors">{t('footer.privacy')}</Link>
              <Link to="/" className="hover:text-white transition-colors">{t('footer.terms')}</Link>
              <Link to="/" className="hover:text-white transition-colors">{t('footer.contact')}</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p>© {new Date().getFullYear()} Vremeplov.hr. {t('footer.rights')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PhotoDetail;