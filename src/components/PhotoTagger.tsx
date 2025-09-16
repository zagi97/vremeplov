import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tag, X, User, Clock } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useAuth } from "../contexts/AuthContext";
import { CharacterCounter } from "./ui/character-counter";
import LazyImage from './LazyImage';

interface TaggedPerson {
  id: string;
  name: string;
  x: number;
  y: number;
  isApproved?: boolean; // Add approval status
  addedByUid?: string; // Add user who created the tag
}

interface PhotoTaggerProps {
  taggedPersons: TaggedPerson[];
  onAddTag: (newTag: Omit<TaggedPerson, 'id'>) => void;
  imageUrl: string;
  onRemoveFile?: () => void;
  showRemoveButton?: boolean;
  photoAuthorId?: string; // Add photo author ID to know who owns the photo
}

const PhotoTagger: React.FC<PhotoTaggerProps> = ({ 
  taggedPersons, 
  onAddTag, 
  imageUrl, 
  onRemoveFile,
  showRemoveButton = true,
  photoAuthorId
}) => {
  const [isTagging, setIsTagging] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [tagPosition, setTagPosition] = useState({ x: 0, y: 0 });
  const [hasSelectedPosition, setHasSelectedPosition] = useState(false);
  const { user } = useAuth();

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
    e.stopPropagation(); // Stop event propagation

    if (!newTagName.trim() || !hasSelectedPosition) {
      // Show error if name is empty or position not selected
      toast.error("Please enter a name and select a position on the image");
      return;
    }
    
    // Save the tag with the exact position
    onAddTag({
      name: newTagName,
      x: tagPosition.x,
      y: tagPosition.y,
      isApproved: false // All new tags require approval
    });
    
    console.log('Tag saved with position:', tagPosition);
    
    // Reset the form
    setNewTagName("");
    setIsTagging(false);
    setHasSelectedPosition(false);
    
    // Show notification about admin approval
    toast.success(`Tagged ${newTagName} in the photo! The tag will be visible after admin approval.`, {
      duration: 4000
    });
  };
  
  const cancelTagging = () => {
    setIsTagging(false);
    setNewTagName("");
    setHasSelectedPosition(false);
  };

  // Separate different types of tags
  const approvedTags = taggedPersons.filter(person => person.isApproved !== false);
  const userOwnPendingTags = taggedPersons.filter(person => 
    person.isApproved === false && person.addedByUid === user?.uid
  ); // User's own pending tags
  const photoOwnerPendingTags = taggedPersons.filter(person => 
    person.isApproved === false && 
    person.addedByUid !== user?.uid && 
    photoAuthorId === user?.uid
  ); // Pending tags on user's photo (by others)

 return (
    <>
      <div 
        className="relative cursor-pointer w-full"
        onClick={handleImageClick}
      >
        {/* ZAMIJENIO img s LazyImage */}
      <LazyImage
        src={imageUrl}
        alt="Preview"
        className="w-full h-auto max-h-[500px] object-contain mx-auto rounded-lg"
        threshold={0.1} // Upload/tagging flow - učitaj agresivno
        rootMargin="0px" // Korisnik gleda direktno na sliku za tagging
        placeholder={
          <div className="w-full h-auto max-h-[500px] bg-gray-100 flex items-center justify-center rounded-lg" style={{ minHeight: '300px' }}>
            <div className="text-center text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
                <Tag className="h-8 w-8 text-gray-400" />
              </div>
              <span className="text-sm font-medium">Loading photo for tagging...</span>
            </div>
          </div>
        }
      />
        
        {/* Approved tagged persons dots - blue */}
        {approvedTags.map((person) => (
          <Tooltip key={person.id || `temp-${person.x}-${person.y}`}>
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

        {/* User's own pending tagged persons dots - orange with clock icon */}
        {userOwnPendingTags.map((person) => (
          <Tooltip key={person.id || `temp-${person.x}-${person.y}`}>
            <TooltipTrigger asChild>
              <div 
                className="absolute w-6 h-6 bg-orange-500 border-2 border-white rounded-full -ml-3 -mt-3 cursor-pointer hover:scale-110 transition-transform flex items-center justify-center"
                style={{ 
                  left: `${person.x}%`, 
                  top: `${person.y}%` 
                }}
              >
                <Clock className="h-3 w-3 text-white" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <span className="font-medium text-gray-500">{person.name}</span>
                <span className="text-xs text-orange-600">Your tag - pending approval</span>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}

        {/* Photo owner sees pending tags by others - purple with clock icon */}
        {photoOwnerPendingTags.map((person) => (
          <Tooltip key={person.id || `temp-${person.x}-${person.y}`}>
            <TooltipTrigger asChild>
              <div 
                className="absolute w-6 h-6 bg-purple-500 border-2 border-white rounded-full -ml-3 -mt-3 cursor-pointer hover:scale-110 transition-transform flex items-center justify-center"
                style={{ 
                  left: `${person.x}%`, 
                  top: `${person.y}%` 
                }}
              >
                <Clock className="h-3 w-3 text-white" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-purple-600" />
                </div>
                <span className="font-medium text-gray-500">{person.name}</span>
                <span className="text-xs text-purple-600">Tagged by someone - pending approval</span>
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
        
{/* Tag Button - Only show if user is photo owner or admin */}
{user && (user.uid === photoAuthorId || user.email === 'vremeplov.app@gmail.com') && (
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
      {/* Remove File Button - Only show if onRemoveFile provided and showRemoveButton is true */}
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

      {/* Pending tags notification */}
      {(userOwnPendingTags.length > 0 || photoOwnerPendingTags.length > 0) && (
        <div className="mt-2 p-3 bg-gradient-to-r from-orange-50 to-purple-50 border border-orange-200 rounded-lg">
          {userOwnPendingTags.length > 0 && (
            <div className="flex items-center gap-2 text-orange-700 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                {userOwnPendingTags.length} of your tag{userOwnPendingTags.length !== 1 ? 's' : ''} awaiting admin approval
              </span>
            </div>
          )}
          {photoOwnerPendingTags.length > 0 && (
            <div className="flex items-center gap-2 text-purple-700 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                {photoOwnerPendingTags.length} tag{photoOwnerPendingTags.length !== 1 ? 's' : ''} on your photo awaiting approval
              </span>
            </div>
          )}
          <p className="text-xs text-gray-600 mt-1">
            {userOwnPendingTags.length > 0 && photoOwnerPendingTags.length > 0 ? 
              "Orange dots are your tags, purple dots are tags others made on your photo." :
              userOwnPendingTags.length > 0 ?
              "Your tags will be visible to everyone once approved by an administrator." :
              "Someone tagged people in your photo. Tags will be visible to everyone once you or an admin approves them."
            }
          </p>
        </div>
      )}

      {/* Tagging Interface - Below the image */}
      {isTagging && (
        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
          {!hasSelectedPosition ? (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Click on the photo to position the tag</p>
              <p className="text-xs text-gray-500">Note: Tags require admin approval before becoming visible to other users</p>
            </div>
          ) : (
            <div className="space-y-3">
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
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <p className="text-xs text-blue-700">
                  <strong>Note:</strong> Your tag will be submitted for admin approval and will become visible to other users once approved.
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                   type="button"
                  onClick={handleSubmitTag}
                  disabled={!newTagName.trim() || !hasSelectedPosition}
                >
                  Submit Tag for Approval
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={cancelTagging}
                >
                  Cancel
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