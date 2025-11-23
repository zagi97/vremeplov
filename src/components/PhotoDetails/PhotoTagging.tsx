// src/components/PhotoDetails/PhotoTagging.tsx
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CharacterCounter } from "@/components/ui/character-counter";
import { Tag, Users, Clock, AlertTriangle } from "lucide-react";
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
  MAX_TAGS_PER_DAY
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
      toast.error(`🚫 ${rateLimitInfo.reason}`, { duration: 5000 });
      return;
    }

    if (taggedPersons.length >= MAX_TAGS_PER_PHOTO) {
      toast.error(`🚫 Maksimalno ${MAX_TAGS_PER_PHOTO} osoba po fotografiji!`, { duration: 5000 });
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

  const canUserTag = user && (user.uid === photoAuthorId || authService.isAdmin(user));

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
            className="w-full h-auto rounded-lg"
            responsiveImages={responsiveImages}
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
            {canUserTag && (
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

      {/* Rate Limit Warning */}
      {canUserTag && !rateLimitInfo.canTag && (
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

      {/* Tag Statistics */}
      {canUserTag && rateLimitInfo.canTag && (
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
    </>
  );
};
