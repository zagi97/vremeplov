// src/components/PhotoDetails/PhotoTagging.tsx
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CharacterCounter } from "@/components/ui/character-counter";
import { Dialog, DialogContent, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Tag, Users, Clock, AlertTriangle, ZoomIn, X } from "lucide-react";
import { useLanguage, translateWithParams } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import LazyImage from "@/components/LazyImage";
import { User } from 'firebase/auth';
import { Photo } from '@/services/firebaseService';
import { authService } from '@/services/authService';

interface TaggedPerson {
  id: string;
  name: string;
  x: number;
  y: number;
  addedByUid?: string;
  isApproved?: boolean;
}

interface RateLimitInfo {
  tagsInLastHour: number;
  tagsInLastDay: number;
  canTag: boolean;
  reason: string;
}

interface PhotoTaggingProps {
  photoId: string;
  photoImageUrl: string;
  photoDescription: string;
  responsiveImages?: Photo['responsiveImages'];
  photoAuthorId?: string;
  user: User | null;
  taggedPersons: TaggedPerson[];
  rateLimitInfo: RateLimitInfo;
  onAddTag: (tag: { name: string; x: number; y: number }) => Promise<void>;
  onCheckRateLimit: () => Promise<void>;
  MAX_TAGS_PER_PHOTO: number;
  MAX_TAGS_PER_HOUR: number;
  MAX_TAGS_PER_DAY: number;
  isPhotoPending?: boolean;
}

export const PhotoTagging: React.FC<PhotoTaggingProps> = ({
  photoId,
  photoImageUrl,
  photoDescription,
  responsiveImages,
  photoAuthorId,
  user,
  taggedPersons,
  rateLimitInfo,
  onAddTag,
  onCheckRateLimit,
  MAX_TAGS_PER_PHOTO,
  MAX_TAGS_PER_HOUR,
  MAX_TAGS_PER_DAY,
  isPhotoPending = false
}) => {
  const { t } = useLanguage();
  const [isTagging, setIsTagging] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [tagPosition, setTagPosition] = useState({ x: 0, y: 0 });
  const [hasSelectedPosition, setHasSelectedPosition] = useState(false);
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isTagging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setTagPosition({ x, y });
    setHasSelectedPosition(true);

    toast.info(t('photoDetail.positionSelected'));
  };

  const handleSubmitTag = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Rate limit check
    if (!rateLimitInfo.canTag) {
      toast.error(`${t('tag.rateLimitErrorPrefix')}${rateLimitInfo.reason}`, { duration: 5000 });
      return;
    }

    if (taggedPersons.length >= MAX_TAGS_PER_PHOTO) {
      toast.error(`${t('tag.rateLimitErrorPrefix')}${translateWithParams(t, 'tag.maxPerPhoto', { limit: MAX_TAGS_PER_PHOTO })}`, { duration: 5000 });
      return;
    }

    if (!newTagName.trim() || !hasSelectedPosition) {
      toast.error(t('photoDetail.enterNameAndPosition'));
      return;
    }

    await onAddTag({
      name: newTagName,
      x: tagPosition.x,
      y: tagPosition.y
    });

    setNewTagName("");
    setIsTagging(false);
    setHasSelectedPosition(false);
    toast.success(translateWithParams(t, 'photoDetail.taggedSuccess', { name: newTagName }));

    await onCheckRateLimit();
  };

  const cancelTagging = () => {
    setIsTagging(false);
    setNewTagName("");
    setHasSelectedPosition(false);
  };

  // ✅ Block tagging on pending photos
  const canUserTag = user && (user.uid === photoAuthorId || authService.isAdmin(user)) && !isPhotoPending;

  return (
    <>
      {/* Image with tagging overlay */}
      <div className="relative w-full">
        <div
          className="relative w-full cursor-pointer group"
          onClick={handleImageClick}
        >
          <LazyImage
            src={photoImageUrl}
            alt={photoDescription}
            className="w-full h-auto max-h-[80vh] rounded-lg"
            responsiveImages={responsiveImages}
            priority={true}
            aspectRatio="auto"
            objectFit="contain"
          />

          {/* Zoom button - opens fullscreen image view */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                onClick={(e) => e.stopPropagation()}
                variant="secondary"
                size="icon"
                className="absolute top-4 right-4 z-30 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 backdrop-blur-sm shadow-lg"
                aria-label={t('photoDetail.zoomImage')}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-transparent border-none [&>button]:hidden">
              {/* Custom close button - outside image */}
              <DialogClose className="absolute -top-12 right-0 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-lg transition-colors">
                <X className="h-6 w-6" />
                <span className="sr-only">Close</span>
              </DialogClose>
              <img
                src={photoImageUrl}
                alt={photoDescription}
                className="w-full h-full object-contain max-h-[85vh] rounded-lg"
              />
            </DialogContent>
          </Dialog>

          {/* Overlay container for tags and buttons */}
          <div className="absolute inset-0 rounded-lg overflow-hidden">
            {/* Tagged Persons - Mobile: always visible, Desktop: show on hover */}
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
              } else if (isPending && photoAuthorId === user?.uid) {
                // Someone else's pending tag on user's photo - purple
                tagStyle = {
                  bgColor: "bg-purple-500",
                  borderColor: "border-white",
                  icon: <Clock className="w-3 h-3 text-white" />
                };
              }

              return (
                <div
                  key={person.id}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none transition-opacity duration-200 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                >
                  <div
                    onMouseEnter={() => setHoveredTag(person.id)}
                    onMouseLeave={() => setHoveredTag(null)}
                    className={`pointer-events-auto absolute w-6 h-6 ${tagStyle.bgColor} backdrop-blur-sm rounded-full cursor-pointer hover:scale-110 transition-all duration-200 flex items-center justify-center shadow-lg -ml-3 -mt-3`}
                    style={{ left: `${person.x}%`, top: `${person.y}%` }}
                  >
                    {tagStyle.icon}
                  </div>

                  {/* Name tooltip on hover */}
                  {hoveredTag === person.id && (
                    <div
                      className="absolute bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap shadow-lg border border-gray-200 dark:border-gray-700 z-20 animate-fade-in"
                      style={{
                        left: `${person.x}%`,
                        top: `calc(${person.y}% + 2rem)`,
                        transform: 'translateX(-50%)'
                      }}
                    >
                      <div className="font-medium">{person.name}</div>
                      {isPending && (
                        <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                          {isUsersPendingTag ? t('tag.yourPendingTag') : t('tag.pendingApproval')}
                        </div>
                      )}
                      {/* Tooltip arrow */}
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white dark:bg-gray-800 border-l border-t border-gray-200 dark:border-gray-700 rotate-45"></div>
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
            {canUserTag && (
              <div className="absolute bottom-4 right-4 z-30 transition-opacity duration-200 opacity-100 md:opacity-0 md:pointer-events-auto md:group-hover:opacity-100">
                {!isTagging && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!rateLimitInfo.canTag) {
                        toast.error(`${t('tag.rateLimitErrorPrefix')}${rateLimitInfo.reason}`, { duration: 4000 });
                        return;
                      }
                      setIsTagging(true);
                    }}
                    variant="secondary"
                    className="bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 backdrop-blur-sm shadow-lg"
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

      {/* Rate Limit Warning */}
      {canUserTag && !rateLimitInfo.canTag && (
        <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/30 border-l-4 border-orange-500 dark:border-orange-600 rounded">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-orange-800 dark:text-orange-300 text-sm">{t('tag.limitedTitle')}</p>
              <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">{rateLimitInfo.reason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tag Statistics */}
      {canUserTag && rateLimitInfo.canTag && (
        <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded text-xs text-gray-600 dark:text-gray-400 flex items-center justify-center gap-3">
          <span>📸 {translateWithParams(t, 'tags.onPhoto', { count: taggedPersons.length, max: MAX_TAGS_PER_PHOTO })}</span>
          <span>⏰ {translateWithParams(t, 'tags.hourly', { count: rateLimitInfo.tagsInLastHour, max: MAX_TAGS_PER_HOUR })}</span>
          <span>📅 {translateWithParams(t, 'tags.daily', { count: rateLimitInfo.tagsInLastDay, max: MAX_TAGS_PER_DAY })}</span>
        </div>
      )}

      {/* Tagging Interface - Below the image */}
      {isTagging && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {!hasSelectedPosition ? (
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('photoDetail.clickToPosition')}</p>
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
                className={`dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${
                  newTagName.length >= 38
                    ? "border-red-300 focus:border-red-500 dark:border-red-500 dark:focus:border-red-400"
                    : ""
                }`}
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
    </>
  );
};