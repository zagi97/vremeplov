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
import Footer from "@/components/Footer";
import { userService } from "@/services/userService";
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AlertTriangle } from "lucide-react";
import { notificationService } from '../services/notificationService';
import PageHeader from "@/components/PageHeader";

const PhotoDetail = () => {
  const { t } = useLanguage();
  const { photoId } = useParams<{ photoId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [relatedPhotos, setRelatedPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
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

    const MAX_TAGS_PER_PHOTO = 10;
const MAX_TAGS_PER_DAY = 20;
const MAX_TAGS_PER_HOUR = 10;

const [rateLimitInfo, setRateLimitInfo] = useState({
  tagsInLastHour: 0,
  tagsInLastDay: 0,
  canTag: true,
  reason: ''
});

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
  
// PhotoDetail.tsx - IMPROVED useEffect

useEffect(() => {
  const loadPhotoData = async () => {
    console.log('=== PHOTO LOAD DEBUG ===');
    console.log('PhotoId:', photoId);
    console.log('User:', user?.email);
    
    if (!photoId) return;

    try {
      setLoading(true);
      
      // 🔒 Pokušaj učitati sliku
      const photoData = await photoService.getPhotoById(photoId);
      
      // Handle missing photo
      if (!photoData) {
        toast.error(t('photoDetail.notFound'));
        navigate('/');
        return;
      }
      
      // 🔒 CHECK PENDING STATUS
      if (photoData.isApproved === false) {
        const isAdmin = user?.email === 'vremeplov.app@gmail.com';
        const isOwner = user?.uid === photoData.authorId;
        
        console.log('🔒 Pending photo:', {
          isApproved: photoData.isApproved,
          isAdmin,
          isOwner,
          photoAuthor: photoData.authorId,
          currentUser: user?.uid
        });
        
        // ✅ Firebase Rules će već blokirati unauthorized pristup
        // Ovaj kod se izvršava SAMO ako user ima pristup
        
        if (isOwner && !isAdmin) {
          // Vlasnik vidi svoju pending sliku
          toast.info('Ovo je tvoja fotografija koja čeka odobrenje.', {
            duration: 5000,
            icon: '⏳'
          });
        } else if (isAdmin) {
          // Admin vidi pending sliku
          toast.info('Admin pregled: Pending fotografija', {
            duration: 3000,
            icon: '👑'
          });
        }
      }
      
      // ✅ NASTAVI S UČITAVANJEM
      setPhoto(photoData);
      setLikes(photoData.likes || 0);
      setViews(photoData.views || 0);
      
      if (user) {
        const hasLiked = await photoService.hasUserLiked(photoId, user.uid);
        setUserHasLiked(hasLiked);
        
        await photoService.incrementViews(photoId, user.uid);
      }
      
      // Tagged Persons
      let taggedPersonsData: any[] = [];

      try {
        if (user?.email === 'vremeplov.app@gmail.com') {
          taggedPersonsData = await photoService.getTaggedPersonsByPhotoIdForAdmin(photoId);
        } else if (photoData.authorId === user?.uid && user) {
          taggedPersonsData = await photoService.getTaggedPersonsForPhotoOwner(photoId, user.uid);
        } else {
          taggedPersonsData = await photoService.getTaggedPersonsByPhotoId(photoId);
        }
      } catch (tagError) {
        console.warn('Could not load tagged persons:', tagError);
        taggedPersonsData = [];
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
          addedBy: 'System',
          isApproved: true
        }))
      ];

      let visibleTags = allTaggedPersons;

      if (user?.email !== 'vremeplov.app@gmail.com') {
        visibleTags = allTaggedPersons.filter(tag => {
          if (tag.isApproved === true) return true;
          if (tag.isApproved === false && tag.addedByUid === user?.uid) return true;
          if (tag.isApproved === false && photoData.authorId === user?.uid) return true;
          return false;
        });
      }
      
      setTaggedPersons(visibleTags);
      
      // Load related photos
      if (photoData.location) {
        const locationPhotos = await photoService.getPhotosByLocation(photoData.location);
        const related = locationPhotos.filter(p => p.id !== photoId).slice(0, 6);
        setRelatedPhotos(related);
      }
      
    } catch (error: any) {
      console.error('❌ Error loading photo:', error);
      
      // 🔒 FIRESTORE PERMISSION DENIED
      if (error?.code === 'permission-denied' || 
          error?.message?.includes('Missing or insufficient permissions')) {
        console.log('🔒 Firebase Rules blocked access');
        toast.error('Nemate pristup ovoj fotografiji.', {
          duration: 4000,
          icon: '🔒'
        });
        navigate('/');
        return;
      }
      
      // Generic error
      toast.error(t('upload.error'));
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  loadPhotoData();
}, [photoId, user, t, navigate]);

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

useEffect(() => {
  if (!user || !photoId) return;
  checkUserTagRateLimit();
}, [user, photoId, taggedPersons.length]);
  
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
    
    toast.success(
  translateWithParams(t, 'photoDetail.tagPending', { name: newTag.name }),
  { duration: 4000 }
);
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

  const checkUserTagRateLimit = async () => {
  if (!user) return;

  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const tagsRef = collection(db, 'taggedPersons');
    const q = query(tagsRef, where('addedByUid', '==', user.uid));

    const snapshot = await getDocs(q);
    const userTags = snapshot.docs
      .map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }))
      .filter(t => t.createdAt && t.createdAt > oneDayAgo);

    const tagsInLastHour = userTags.filter(
      t => t.createdAt && t.createdAt > oneHourAgo
    ).length;

    const tagsInLastDay = userTags.length;

    let canTag = true;
    let reason = '';

    if (taggedPersons.length >= MAX_TAGS_PER_PHOTO) {
      canTag = false;
      reason = `Maksimalno ${MAX_TAGS_PER_PHOTO} osoba po fotografiji`;
    } else if (tagsInLastHour >= MAX_TAGS_PER_HOUR) {
      canTag = false;
      reason = `Dostigao si satni limit (${MAX_TAGS_PER_HOUR} tagova/sat)`;
    } else if (tagsInLastDay >= MAX_TAGS_PER_DAY) {
      canTag = false;
      reason = `Dostigao si dnevni limit (${MAX_TAGS_PER_DAY} tagova/dan)`;
    }

    setRateLimitInfo({ tagsInLastHour, tagsInLastDay, canTag, reason });
  } catch (error) {
    console.error('Error checking tag rate limit:', error);
  }
};
  
const handleSubmitTag = async (e: React.FormEvent) => {
  // ✅ RATE LIMIT PROVJERA
  if (!rateLimitInfo.canTag) {
    toast.error(`🚫 ${rateLimitInfo.reason}`, { duration: 5000 });
    return;
  }

  if (taggedPersons.length >= MAX_TAGS_PER_PHOTO) {
    toast.error(`🚫 Maksimalno ${MAX_TAGS_PER_PHOTO} osoba po fotografiji!`, { duration: 5000 });
    return;
  }
  
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
  
  await checkUserTagRateLimit();
};
  
  const cancelTagging = () => {
    setIsTagging(false);
    setNewTagName("");
    setHasSelectedPosition(false);
  };
    
  

 // PhotoDetail.tsx - handleLike funkcija sa DEBUGGINGOM

const handleLike = async () => {
  console.log('🔵 [LIKE] Button clicked');
  
  if (!photoId || !user || likeLoading) {
    console.log('❌ [LIKE] Early return:', { photoId, user: !!user, likeLoading });
    return;
  }
  
  if (!user) {
    console.log('❌ [LIKE] No user');
    toast.error(t('photoDetail.signInMessage'));
    return;
  }
  
  try {
    setLikeLoading(true);
    console.log('🔵 [LIKE] Toggling like...');
    
    const result = await photoService.toggleLike(photoId, user.uid);
    console.log('✅ [LIKE] Toggle result:', result);

    // ✅ Send notification ONLY if user liked (not unliked)
    console.log('🔵 [LIKE] Checking notification conditions:', {
      'result.liked': result.liked,
      'photo': !!photo,
      'photo.uploadedBy': photo?.uploadedBy,
      'user.uid': user.uid,
      'isDifferentUser': photo?.uploadedBy !== user.uid
    });

    if (result.liked && photo?.uploadedBy && photo.uploadedBy !== user.uid) {
      console.log('🔵 [LIKE] Sending notification...');
      try {
        await notificationService.notifyNewLike(
          photo.uploadedBy,                  // Photo owner ID
          user.uid,                          // Liker ID
          user.displayName || 'Anonymous',   // Liker name
          photoId,                           // Photo ID
          photo.description || 'untitled',   // Photo description
          user.photoURL || undefined         // Liker avatar
        );
        console.log('✅ [LIKE] Notification sent successfully!');
      } catch (notifError) {
        console.error('❌ [LIKE] Failed to send notification:', notifError);
      }
    } else {
      console.log('⏭️ [LIKE] Skipping notification:', {
        reason: !result.liked ? 'User unliked' : 
                !photo?.uploadedBy ? 'No photo owner' : 
                photo.uploadedBy === user.uid ? 'Own photo' : 'Unknown'
      });
    }
    
    setLikes(result.newLikesCount);
    setUserHasLiked(result.liked);
    
    if (result.liked) {
      toast.success(t('photoDetail.photoLiked'));
    } else {
      toast.success(t('photoDetail.photoUnliked'));
    }
    
  } catch (error) {
    console.error('❌ [LIKE] Error:', error);
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
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Header */}
<PageHeader title="Vremeplov.hr" />
    {/* Main content - dodaj mt-16 ako header prekrije sadržaj */}
    <div className="container max-w-5xl mx-auto px-4 py-12 mt-20">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="relative w-full">
          <div 
            className="relative w-full cursor-pointer group"
            onClick={handleImageClick}
          >
            <LazyImage
              src={photo.imageUrl}
              alt={photo.description}
              className="w-full h-auto rounded-lg"
              responsiveImages={photo.responsiveImages}
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
    if (!rateLimitInfo.canTag) {
      toast.error(`🚫 ${rateLimitInfo.reason}`, { duration: 4000 });
      return;
    }
    setIsTagging(true);
  }}
  variant="secondary"
  className="bg-white/90 hover:bg-white backdrop-blur-sm shadow-lg"
  disabled={!rateLimitInfo.canTag}
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

{/* ✅ Rate Limit Warning - FIXED POSITION */}
{user && (user.uid === photo?.authorId || user.email === 'vremeplov.app@gmail.com') && !rateLimitInfo.canTag && (
  <div className="mb-4 p-3 bg-orange-50 border-l-4 border-orange-500 rounded">
    <div className="flex items-start gap-2">
      <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-orange-800 text-sm">Tagging ograničen</p>
        <p className="text-xs text-orange-700 mt-1">{rateLimitInfo.reason}</p>
      </div>
    </div>
  </div>
)}

{/* ✅ Tag Statistics - FIXED */}
{user && (user.uid === photo?.authorId || user.email === 'vremeplov.app@gmail.com') && rateLimitInfo.canTag && (
  <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-gray-600 flex items-center justify-center gap-3">
    <span>📸 Na slici: <strong>{taggedPersons.length}/{MAX_TAGS_PER_PHOTO}</strong></span>
    <span>⏰ Satno: <strong>{rateLimitInfo.tagsInLastHour}/{MAX_TAGS_PER_HOUR}</strong></span>
    <span>📅 Dnevno: <strong>{rateLimitInfo.tagsInLastDay}/{MAX_TAGS_PER_DAY}</strong></span>
  </div>
)}

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

{/* Photo Stats and Actions */}
<div className="p-6 border-b border-gray-200">
  {/* Desktop layout (md and up) - original design */}
  <div className="hidden md:flex items-center justify-between">
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

  {/* Mobile layout (below md) - stacked design */}
  <div className="md:hidden space-y-4">
    {/* Stats */}
    <div className="flex flex-wrap items-center gap-4">
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
    
    {/* Like Button - full width */}
    <div className="w-full">
      {user ? (
        <Button 
          onClick={handleLike}
          disabled={likeLoading}
          variant={userHasLiked ? "default" : "outline"}
          className={`w-full flex items-center justify-center gap-2 ${
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
      ) : (
        <Button 
          onClick={() => {
            toast.info(t('photoDetail.signInMessage'));
          }}
          variant="outline" 
          className="w-full flex items-center justify-center gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
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
    <div className="text-sm text-blue-800 flex flex-col gap-1">
      <p className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        {t('photo.tag.tip.desktop')}
      </p>
      <p className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        {t('photo.tag.tip.mobile')}
      </p>
    </div>
  </div>
)}

  
  {/* Pending tags notification */}
  {taggedPersons.some(tag => tag.isApproved === false && tag.addedByUid === user?.uid) && (
    <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
      <p className="text-sm text-orange-800 flex items-center gap-2">
        <Clock className="h-4 w-4" />
        {t('photo.tag.pendingInfo')}
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
  photoId={photoId!}
  photoAuthor={photo.uploadedBy || photo.author}
  photoAuthorId={photo.authorId}
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
                nearbyPhotos={relatedPhotos
          .filter(p => p.coordinates?.latitude && p.coordinates?.longitude) // ✅ Filter out photos without coordinates
          .slice(0, 3)
          .map(p => ({
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
    <LazyImage
  src={relatedPhoto.imageUrl}
  alt={relatedPhoto.description}
  className="w-full"
  responsiveImages={relatedPhoto.responsiveImages}
  threshold={0.2}
/>
    <p className="text-sm font-medium mt-2">{relatedPhoto.description}</p>
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
      
      {/* Footer */}
      <Footer/>
    </div>
  );
};

export default PhotoDetail;