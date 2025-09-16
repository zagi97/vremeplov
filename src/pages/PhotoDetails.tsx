// PhotoDetail.tsx
import LazyImage from "../components/LazyImage";
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ArrowLeft, Calendar, User, MapPin, Tag, Heart, Eye, Users, Camera, Upload, Clock } from "lucide-react";
import PhotoGrid from "../components/PhotoGrid";
import PhotoComments from "../components/PhotoComments";
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
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);

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
  console.log('=== FIREBASE DEBUG ===');
  console.log('User email:', user?.email);
  console.log('User UID:', user?.uid);
  console.log('PhotoId:', photoId);
  console.log('Is admin:', user?.email === 'vremeplov.app@gmail.com');
  
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
    
    // Comments
    const photoComments = await photoService.getCommentsByPhotoId(photoId);
    setComments(photoComments.map(comment => ({
      id: comment.id,
      author: comment.author,
      text: comment.text,
      date: comment.createdAt.toDate().toLocaleDateString('hr-HR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    })));

    // ✅ ISPRAVKA: Tagged Persons - vlasnik slike koristi admin metodu
// ✅ FALLBACK PRISTUP: Prvo probaj obične tagove, pa ručno filtriraj
let taggedPersonsData: any[] = [];

try {
  console.log('🔍 Attempting to fetch tags for photoId:', photoId);
  console.log('🔍 User details:', { uid: user?.uid, email: user?.email, isOwner: photoData.authorId === user?.uid });
  
 if (user?.email === 'vremeplov.app@gmail.com') {
  // Admin - koristi admin metodu
  taggedPersonsData = await photoService.getTaggedPersonsByPhotoIdForAdmin(photoId);
  console.log('👑 Admin fetched tags:', taggedPersonsData.length);
} else if (photoData.authorId === user?.uid && user) {
  // Vlasnik slike - koristi novu metodu
  console.log('🏠 Photo owner detected, using owner method...');
  taggedPersonsData = await photoService.getTaggedPersonsForPhotoOwner(photoId, user.uid);
  console.log('🏠 Photo owner fetched tags:', taggedPersonsData.length);
} else {
  // Obični korisnici - samo odobreni tagovi
  taggedPersonsData = await photoService.getTaggedPersonsByPhotoId(photoId);
  console.log('👤 User fetched approved tags:', taggedPersonsData.length);
}} catch (tagError) {
  console.warn('Could not load tagged persons from Firestore:', tagError);
  taggedPersonsData = [];
}

console.log('📊 Final Firestore tags count:', taggedPersonsData.length);

// Dohvati legacy tagove iz samog photo objekta
const photoTaggedPersons = photoData.taggedPersons || [];

// Kombiniraj sve tagove
const allTaggedPersons = [
  ...taggedPersonsData,
  ...photoTaggedPersons.map((person, index) => ({
    id: `photo_${index}`,
    name: person.name,
    x: person.x,
    y: person.y,
    photoId: photoId,
    addedBy: 'System',
    isApproved: true // Legacy tagovi su automatski odobreni
  }))
];

// ✅ VRATI ORIGINALNU LOGIKU FILTRIRANJA (ali sada s ispravnim Firestore podacima)
let visibleTags = allTaggedPersons;

if (user?.email !== 'vremeplov.app@gmail.com') {
  // Nije admin - prikaži tagove prema pravilima:
  visibleTags = allTaggedPersons.filter(tag => {
    // 1. Odobreni tagovi - svi ih vide
    if (tag.isApproved === true) return true;
    // 2. Pending tagovi koje je sam korisnik dodao
    if (tag.isApproved === false && tag.addedByUid === user?.uid) return true;
    // 3. Pending tagovi na korisnikovoj slici (vlasnik vidi sve pending tagove)
    if (tag.isApproved === false && photoData.authorId === user?.uid) return true;
    return false;
  });
}

// Zamijeniti postojeći === TAG DEBUG === dio s ovim proširenim debugom:

console.log('=== DETAILED TAG DEBUG ===');
console.log('User UID:', user?.uid);
console.log('Photo Author ID:', photoData.authorId);
console.log('Is photo owner:', photoData.authorId === user?.uid);
console.log('Is admin:', user?.email === 'vremeplov.app@gmail.com');

console.log('Firestore tags details:');
taggedPersonsData.forEach((tag, index) => {
  console.log(`Tag ${index}:`, {
    id: tag.id,
    name: tag.name,
    isApproved: tag.isApproved,
    addedByUid: tag.addedByUid,
    photoAuthorId: tag.photoAuthorId,
    x: tag.x,
    y: tag.y
  });
});

console.log('All combined tags details:');
allTaggedPersons.forEach((tag, index) => {
  console.log(`Combined tag ${index}:`, {
    id: tag.id,
    name: tag.name,
    isApproved: tag.isApproved,
    addedByUid: tag.addedByUid,
    source: tag.id?.includes('photo_') ? 'legacy' : 'firestore'
  });
});

console.log('Visible tags after filtering details:');
visibleTags.forEach((tag, index) => {
  console.log(`Visible tag ${index}:`, {
    id: tag.id,
    name: tag.name,
    isApproved: tag.isApproved,
    addedByUid: tag.addedByUid,
    shouldShowAsPending: tag.isApproved === false && (tag.addedByUid === user?.uid || photoData.authorId === user?.uid)
  });
});

console.log('=== END DETAILED TAG DEBUG ===');
  
setTaggedPersons(visibleTags);

    
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

  useEffect(() => {
// U PhotoDetail komponenti, prije prosljeđivanja u PhotoLocationMap:
console.log('=== PHOTODETAIL DEBUG ===');
console.log('relatedPhotos raw:', relatedPhotos);
console.log('relatedPhotos with coordinates:', relatedPhotos.filter(p => p.coordinates));
relatedPhotos.forEach((photo, index) => {
  console.log(`Related photo ${index}:`, {
    id: photo.id,
    description: photo.description,
    coordinates: photo.coordinates
  });
});
  
  const photosWithCoords = relatedPhotos.filter(p => p.coordinates);
  console.log(`Total related photos: ${relatedPhotos.length}`);
  console.log(`Related photos with coordinates: ${photosWithCoords.length}`);
  
  console.log('=== END COORDINATES DEBUG ===');
}, [photo, relatedPhotos]);
  
const handleAddTag = async (newTag: Omit<{ id: number; name: string; x: number; y: number; }, 'id'>) => {
  if (!photoId || !user) return;
  
  try {
    console.log('🔥 Adding tag:', newTag);
    const tagId = await photoService.addTaggedPerson({
      photoId,
      name: newTag.name,
      x: newTag.x,
      y: newTag.y,
      description: '',
      addedBy: user.displayName || user.email || 'User'
    });
    
    console.log('🔥 Tag saved with ID:', tagId);
    
    // NOVO: Odmah dodaj tag u lokalni state s pending statusom
    const newTagWithId = {
      id: tagId,
      name: newTag.name,
      x: newTag.x,
      y: newTag.y,
      photoId,
      addedBy: user.displayName || user.email || 'User',
      addedByUid: user.uid,
      isApproved: false, // Pending status
      createdAt: new Date()
    };
    
    console.log('🔥 Adding to local state:', newTagWithId);
    
    // Dodaj u postojeći state
    setTaggedPersons([...taggedPersons, newTagWithId]);
    
    toast.success(`Tagged ${newTag.name}! Tag is pending admin approval.`, {
      duration: 4000
    });
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
          {/* Photo Section with Hover-Only Tags */}
          <div className="relative w-full">
            <div 
              className="relative w-full cursor-pointer group"
              onClick={handleImageClick}
            >
              <LazyImage
                src={photo.imageUrl}
                alt={photo.description}
                className="w-full h-auto object-cover"
              />
              
              {/* Hover-Only Tagged Persons */}
              <div className="absolute inset-0 rounded-lg overflow-hidden">
                {taggedPersons.map((person) => {
                  // Determine tag type and styling
                  const isApproved = person.isApproved !== false;
                  const isPending = person.isApproved === false;
                  const isUsersPendingTag = isPending && person.addedByUid === user?.uid;
                  
                  let tagStyle = {
                    bgColor: "bg-blue-500", // Approved tags - blue
                    borderColor: "border-white",
                    icon: <Users className="w-4 h-4 text-white drop-shadow-sm" />
                  };
                  
                  if (isUsersPendingTag) {
                    // User's own pending tags - orange
                    tagStyle = {
                      bgColor: "bg-orange-500",
                      borderColor: "border-white",
                      icon: <Clock className="w-3 h-3 text-white" />
                    };
                  } else if (isPending && photo?.authorId === user?.uid) {
                    // Someone else's pending tag on user's photo - purple  
                    tagStyle = {
                      bgColor: "bg-purple-500",
                      borderColor: "border-white", 
                      icon: <Clock className="w-3 h-3 text-white" />
                    };
                  }

                  return (
                    <div
                      key={person.id || `temp-${person.x}-${person.y}`}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out"
                      style={{ 
                        left: `${person.x}%`, 
                        top: `${person.y}%`,
                        zIndex: 10
                      }}
                      onMouseEnter={() => setHoveredTag(person.id)}
                      onMouseLeave={() => setHoveredTag(null)}
                    >
                      {/* Tag circle with conditional styling */}
                      <div className={`w-8 h-8 border-2 ${tagStyle.borderColor} ${tagStyle.bgColor} backdrop-blur-sm rounded-full cursor-pointer hover:scale-110 transition-all duration-200 flex items-center justify-center shadow-lg`}>
                        {tagStyle.icon}
                      </div>
                      
                      {/* Name tooltip on hover */}
                      {hoveredTag === person.id && (
                        <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white text-gray-900 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap shadow-lg border border-gray-200 z-20 animate-fade-in">
                          <div className="font-medium">{person.name}</div>
                          {isPending && (
                            <div className="text-xs text-orange-600 mt-1">
                              {isUsersPendingTag ? "Your tag - pending approval" : "Pending approval"}
                            </div>
                          )}
                          {/* Tooltip arrow */}
                          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white border-l border-t border-gray-200 rotate-45"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Current tag position marker (when tagging) */}
                {isTagging && hasSelectedPosition && (
                  <div 
                    className="absolute w-6 h-6 bg-green-500 border-2 border-white rounded-full -ml-3 -mt-3 animate-pulse z-20"
                    style={{ 
                      left: `${tagPosition.x}%`, 
                      top: `${tagPosition.y}%` 
                    }}
                  />
                )}
                
                {/* Tag Button - Only show if user is photo owner or admin */}
                {user && (user.uid === photo?.authorId || user.email === 'vremeplov.app@gmail.com') && (
                  <div className="absolute bottom-4 right-4 z-30">
                    {!isTagging && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsTagging(true);
                        }}
                        variant="secondary"
                        className="bg-white/90 hover:bg-white backdrop-blur-sm shadow-lg"
                      >
                        <Tag className="h-4 w-4 mr-2" />
                        {t('photoDetail.tagPerson')}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
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
                {taggedPersons.length > 0 && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-5 w-5" />
                    <span className="text-sm">{taggedPersons.length} {t('photoDetail.taggedPeople')}</span>
                  </div>
                )}
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
            
            {/* Hover instruction for tagged persons */}
            {taggedPersons.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <strong>💡 Tip:</strong> Hover over the photo to see tagged persons
                </p>
              </div>
            )}
            
            {/* Pending tags notification */}
            {taggedPersons.some(tag => tag.isApproved === false && tag.addedByUid === user?.uid) && (
              <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-800 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <strong>Info:</strong> You have pending tags that are awaiting admin approval. Orange dots show your pending tags.
                </p>
              </div>
            )}
          </div>

          {/* NEW: Modern Compact Layout for Photo Information */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden m-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white p-6">
              <h3 className="text-xl font-bold mb-2">{t('photoDetail.aboutPhoto')}</h3>
              <p className="text-gray-300 text-sm">Povijesni detalji i informacije</p>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Calendar className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{t('photoDetail.year')}</p>
                  <p className="text-lg font-bold text-gray-900">{photo.year}</p>
                </div>
                
                <div className="text-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Camera className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{t('photoDetail.author')}</p>
                  <p className="text-sm font-bold text-gray-900">{photo.author}</p>
                </div>
                
                <div className="text-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <MapPin className="h-6 w-6 mx-auto text-green-600 mb-2" />
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{t('photoDetail.location')}</p>
                  <p className="text-sm font-bold text-gray-900">{photo.location}</p>
                </div>
                
                {photo.uploadedBy && (
                  <div className="text-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <Upload className="h-6 w-6 mx-auto text-orange-600 mb-2" />
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{t('photoDetail.uploadedBy')}</p>
                    <p className="text-xs font-bold text-gray-900">{photo.uploadedBy}</p>
                    {photo.uploadedAt && (
                      <p className="text-xs text-gray-500">
                        {new Date(photo.uploadedAt).toLocaleDateString('hr-HR', {
                          day: '2-digit',
                          month: '2-digit', 
                          year: 'numeric'
                        })}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <p className="text-gray-700 leading-relaxed">
                  {photo.detailedDescription || translateWithParams(t, 'photoDetail.defaultDescription', {
                    year: photo.year,
                    description: photo.description,
                    location: photo.location,
                    author: photo.author
                  })}
                </p>
              </div>

              {/* Tagged People - samo odobreni tagovi */}
{taggedPersons.filter(person => person.isApproved === true).length > 0 && (
  <div className="border-t pt-4">
    <div className="flex items-center justify-between mb-3">
      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
        <Users className="h-4 w-4" />
        {t('photoDetail.taggedPeople')}
      </h4>
      <span className="text-sm text-gray-500">
        {taggedPersons.filter(person => person.isApproved === true).length} osoba
      </span>
    </div>
    <div className="flex flex-wrap gap-2">
      {taggedPersons
        .filter(person => person.isApproved === true)
        .map((person) => (
          <span 
            key={person.id || `temp-${person.x}-${person.y}`} 
            className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            <User className="h-3 w-3" />
            {person.name}
          </span>
        ))}
    </div>
  </div>
)}
            </div>
          </div>

          {/* Comments Section */}
          {/* Comments Section */}
<div className="p-6">
  <PhotoComments 
    comments={comments}
    onAddComment={handleAddComment}
    photoAuthor={photo.uploadedBy || photo.author}
  />
</div>

          {/* Right Column - Sidebar for larger screens */}
          <div className="hidden md:block p-6 border-t border-gray-200">
            <div className="mb-8">
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
    year: p.year,
    coordinates: p.coordinates // ✅ DODAJ OVO!
                }))}
              />
              
              {/* Historical Context */}
       {/*        <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-lg mb-3">{t('photoDetail.historicalContext')}</h3>
                <p className="text-gray-700">
                  {translateWithParams(t, 'photoDetail.historicalContextDesc', {
                    location: photo.location
                  })}
                </p>
              </div> */}
            </div>
            
            {/* Related Photos */}
            {relatedPhotos.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium text-lg mb-3">{t('photoDetail.relatedPhotos')}</h3>
                <div className="grid grid-cols-2 gap-3">
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
              {/* In your Location.tsx footer (around line 522-525) */}
<Link to="/about" className="hover:text-white transition-colors">{t('footer.about')}</Link>
<Link to="/privacy" className="hover:text-white transition-colors">{t('footer.privacy')}</Link>
<Link to="/terms" className="hover:text-white transition-colors">{t('footer.terms')}</Link>
<Link to="/contact" className="hover:text-white transition-colors">{t('footer.contact')}</Link>
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