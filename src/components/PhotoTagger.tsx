import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tag, X, User, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useAuth } from "../contexts/AuthContext";
import { CharacterCounter } from "./ui/character-counter";
import LazyImage from './LazyImage';
import { useLanguage, translateWithParams } from "../contexts/LanguageContext";
import { useTagRateLimit, TAG_RATE_LIMIT_CONFIG } from '@/hooks/useMultiWindowRateLimit';
import { authService } from '@/services/authService';

interface TaggedPerson {
  id: string;
  name: string;
  x: number;
  y: number;
  isApproved?: boolean;
  addedByUid?: string;
}

interface PhotoTaggerProps {
  taggedPersons: TaggedPerson[];
  onAddTag: (newTag: Omit<TaggedPerson, 'id'>) => void;
  imageUrl: string;
  onRemoveFile?: () => void;
  showRemoveButton?: boolean;
  photoAuthorId?: string;
  photoId?: string;
}

const MAX_TAGS_PER_PHOTO = 10;

const PhotoTagger: React.FC<PhotoTaggerProps> = ({
  taggedPersons,
  onAddTag,
  imageUrl,
  onRemoveFile,
  showRemoveButton = true,
  photoAuthorId,
  photoId
}) => {
  const [isTagging, setIsTagging] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [tagPosition, setTagPosition] = useState({ x: 0, y: 0 });
  const [hasSelectedPosition, setHasSelectedPosition] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();

  // ✅ RATE LIMITING - using centralized hook
  const [rateLimitState, refreshRateLimit] = useTagRateLimit(user?.uid, photoId);

  // Extract constants for cleaner code
  const MAX_TAGS_PER_HOUR = TAG_RATE_LIMIT_CONFIG.timeWindows[0].maxRequests;
  const MAX_TAGS_PER_DAY = TAG_RATE_LIMIT_CONFIG.timeWindows[1].maxRequests;

  // Helper getters for cleaner code
  const tagsInLastHour = rateLimitState.counts[0] || 0;
  const tagsInLastDay = rateLimitState.counts[1] || 0;
  const canTag = !rateLimitState.isLimited && taggedPersons.length < MAX_TAGS_PER_PHOTO;

  // Get reason for rate limit
  const getRateLimitReason = (): string => {
    if (taggedPersons.length >= MAX_TAGS_PER_PHOTO) {
      return translateWithParams(t, 'tag.maxPerPhoto', { limit: MAX_TAGS_PER_PHOTO });  // PREVEDENO
    }
    return rateLimitState.reason || '';
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isTagging) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setTagPosition({ x, y });
    setHasSelectedPosition(true);
    toast.info(t("photoDetail.positionSelected"));
  };
  
  const handleSubmitTag = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!newTagName.trim() || !hasSelectedPosition) {
      toast.error(t('photoDetail.enterNameAndPosition'));
      return;
    }

    // ✅ PROVJERA RATE LIMITA
    if (!canTag) {
      const reason = getRateLimitReason();
      toast.error(t('tag.rateLimitError'), {
        duration: 5000
      });
      return;
    }

    onAddTag({
      name: newTagName,
      x: tagPosition.x,
      y: tagPosition.y,
      isApproved: false
    });

    setNewTagName("");
    setIsTagging(false);
    setHasSelectedPosition(false);

    toast.success(translateWithParams(t, 'photoDetail.taggedSuccess', { name: newTagName }), {
      duration: 4000
    });

    // ✅ REFRESH rate limit
    await refreshRateLimit();
  };
  
  const cancelTagging = () => {
    setIsTagging(false);
    setNewTagName("");
    setHasSelectedPosition(false);
  };

  const approvedTags = taggedPersons.filter(person => person.isApproved !== false);
  const userOwnPendingTags = taggedPersons.filter(person => 
    person.isApproved === false && person.addedByUid === user?.uid
  );
  const photoOwnerPendingTags = taggedPersons.filter(person => 
    person.isApproved === false && 
    person.addedByUid !== user?.uid && 
    photoAuthorId === user?.uid
  );

 return (
    <>
      <div 
        className="relative cursor-pointer w-full"
        onClick={handleImageClick}
      >
        <LazyImage
          src={imageUrl}
          alt="Preview"
          className="w-full h-auto max-h-[500px] object-contain mx-auto rounded-lg"
          threshold={0.1}
          rootMargin="0px"
          placeholder={
            <div className="w-full h-auto max-h-[500px] bg-gray-100 flex items-center justify-center rounded-lg" style={{ minHeight: '300px' }}>
              <div className="text-center text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Tag className="h-8 w-8 text-gray-400" />
                </div>
                <span className="text-sm font-medium">{t('photo.loadingForTagging')}</span>  {/* PREVEDENO */}
              </div>
            </div>
          }
        />
        
        {/* Approved tags - blue */}
        {approvedTags.map((person) => (
          <Tooltip key={person.id || `temp-${person.x}-${person.y}`}>
            <TooltipTrigger asChild>
              <div 
                className="absolute w-6 h-6 bg-blue-500 border-2 border-white rounded-full -ml-3 -mt-3 cursor-pointer hover:scale-110 transition-transform"
                style={{ left: `${person.x}%`, top: `${person.y}%` }}
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

        {/* User pending tags - orange */}
        {userOwnPendingTags.map((person) => (
          <Tooltip key={person.id || `temp-${person.x}-${person.y}`}>
            <TooltipTrigger asChild>
              <div 
                className="absolute w-6 h-6 bg-orange-500 border-2 border-white rounded-full -ml-3 -mt-3 cursor-pointer hover:scale-110 transition-transform"
                style={{ left: `${person.x}%`, top: `${person.y}%` }}
              />
            </TooltipTrigger>
            <TooltipContent className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
                <span className="font-medium text-gray-500">{person.name}</span>
                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">{t('tag.pendingApprovalBadge')}</span>  {/* Ako treba prijevod, dodaj ključ */}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}

        {/* Photo owner pending tags - purple */}
        {photoOwnerPendingTags.map((person) => (
          <Tooltip key={person.id || `temp-${person.x}-${person.y}`}>
            <TooltipTrigger asChild>
              <div 
                className="absolute w-6 h-6 bg-purple-500 border-2 border-white rounded-full -ml-3 -mt-3 cursor-pointer hover:scale-110 transition-transform"
                style={{ left: `${person.x}%`, top: `${person.y}%` }}
              />
            </TooltipTrigger>
            <TooltipContent className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
                <span className="font-medium text-gray-500">{person.name}</span>
                <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">{t('tag.pendingApprovalBadge')}</span>  {/* Ako treba prijevod, dodaj ključ */}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
        
        {/* Current tag position */}
        {isTagging && hasSelectedPosition && (
          <div 
            className="absolute w-6 h-6 bg-green-500 border-2 border-white rounded-full -ml-3 -mt-3 animate-pulse"
            style={{ left: `${tagPosition.x}%`, top: `${tagPosition.y}%` }}
          />
        )}
        
        {/* Tag Button */}
        {user && (user.uid === photoAuthorId || authService.isAdmin(user)) && (
          <div className="absolute bottom-4 right-4">
            {!isTagging && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();

                  if (!canTag) {
                    const reason = getRateLimitReason();
                    toast.error(`🚫 ${reason}`, { duration: 4000 });
                    return;
                  }

                  setIsTagging(true);
                }}
                variant="secondary"
                className="bg-white/80 hover:bg-white/90"
                disabled={!canTag}
              >
                <Tag className="h-4 w-4 mr-2" />
                {t('tag.buttonLabel')}  {/* PREVEDENO */}
              </Button>
            )}
          </div>
        )}

        {/* Remove Button */}
        {showRemoveButton && onRemoveFile && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveFile();
            }}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 z-10"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ✅ RATE LIMIT WARNING */}
      {user && (user.uid === photoAuthorId || authService.isAdmin(user)) && !canTag && (
        <div className="mt-3 p-3 bg-orange-50 border-l-4 border-orange-500 rounded">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-orange-800 text-sm">{t('tag.limitedTitle')}</p>  {/* PREVEDENO */}
              <p className="text-xs text-orange-700 mt-1">{getRateLimitReason()}</p>
            </div>
          </div>
        </div>
      )}

      {/* ✅ TAG STATISTICS */}
      {user && (user.uid === photoAuthorId || authService.isAdmin(user)) && canTag && photoId && (
        <div className="text-xs text-gray-500 flex items-center gap-4 flex-wrap">
          <span>📸 {t('tags.onPhoto')}: <strong>{taggedPersons.length}/{MAX_TAGS_PER_PHOTO}</strong></span>
          <span>⏰ {t('tags.hourly')}: <strong>{tagsInLastHour}/{MAX_TAGS_PER_HOUR}</strong></span>
          <span>📅 {t('tags.daily')}: <strong>{tagsInLastDay}/{MAX_TAGS_PER_DAY}</strong></span>
        </div>
      )}

      {/* Pending tags notification */}
      {(userOwnPendingTags.length > 0 || photoOwnerPendingTags.length > 0) && (
        <div className="mt-2 p-3 bg-gradient-to-r from-orange-50 to-purple-50 border border-orange-200 rounded-lg">
          {userOwnPendingTags.length > 0 && (
            <div className="flex items-center gap-2 text-orange-700 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                {translateWithParams(t, 'tag.yourPendingTags', { count: userOwnPendingTags.length, plural: userOwnPendingTags.length !== 1 ? 's' : '' })}  {/* PREVEDENO */}
              </span>
            </div>
          )}
          {photoOwnerPendingTags.length > 0 && (
            <div className="flex items-center gap-2 text-purple-700 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                {translateWithParams(t, 'tag.photoPendingTags', { count: photoOwnerPendingTags.length, plural: photoOwnerPendingTags.length !== 1 ? 's' : '' })}  {/* PREVEDENO */}
              </span>
            </div>
          )}
          <p className="text-xs text-gray-600 mt-1">
            {userOwnPendingTags.length > 0 && photoOwnerPendingTags.length > 0 ? 
              t('tag.pendingDotsDescriptionBoth') :  // PREVEDENO
              userOwnPendingTags.length > 0 ?
              t('tag.pendingDotsDescriptionOwn') :  // PREVEDENO
              t('tag.pendingDotsDescriptionOthers')  // PREVEDENO
            }
          </p>
        </div>
      )}

      {/* Tagging Interface */}
      {isTagging && (
        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
          {!hasSelectedPosition ? (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">{t('tag.clickToPosition')}</p>  {/* PREVEDENO */}
              <p className="text-xs text-gray-500">{t('tag.noteApprovalRequired')}</p>  {/* PREVEDENO */}
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                type="text"
                placeholder={t('tag.personNamePlaceholder')}
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                maxLength={40}
                autoFocus
                className={newTagName.length >= 38 ? "border-red-300 focus:border-red-500" : ""}
              />
              <CharacterCounter currentLength={newTagName.length} maxLength={40} />
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <p className="text-xs text-blue-700">
                  <strong>{t('tag.noteLabel')}</strong> {t('tag.noteSubmitForApproval')}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button"
                  onClick={handleSubmitTag}
                  disabled={!newTagName.trim() || !hasSelectedPosition}
                >
                  {t('tag.submitButton')}  {/* PREVEDENO */}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={cancelTagging}
                >
                  {t('tag.cancelButton')}  {/* PREVEDENO */}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default PhotoTagger;