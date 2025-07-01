import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tag, X, User } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface TaggedPerson {
  id: number;
  name: string;
  x: number;
  y: number;
  description?: string;
}

interface PhotoTaggerProps {
  taggedPersons: TaggedPerson[];
  onAddTag: (newTag: Omit<TaggedPerson, 'id'>) => void;
}

const PhotoTagger = ({ taggedPersons, onAddTag }: PhotoTaggerProps) => {
  const [isTagging, setIsTagging] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagDescription, setNewTagDescription] = useState("");
  const [tagPosition, setTagPosition] = useState({ x: 0, y: 0 });
  const [hasSelectedPosition, setHasSelectedPosition] = useState(false);
  
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
      description: newTagDescription
    });
    
    console.log('Tag saved with position:', tagPosition);
    
    // Reset the form
    setNewTagName("");
    setNewTagDescription("");
    setIsTagging(false);
    setHasSelectedPosition(false);
    toast.success(`Tagged ${newTagName} in the photo!`);
  };
  
  const cancelTagging = () => {
    setIsTagging(false);
    setNewTagName("");
    setNewTagDescription("");
    setHasSelectedPosition(false);
  };

  return {
    handleImageClick,
    renderTaggingUI: () => (
      <>
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
                {person.description && (
                  <span className="text-sm text-gray-600">{person.description}</span>
                )}
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
        
        {/* Tag Button - Kept at the bottom right of the image */}
        <div className="absolute bottom-4 right-4">
          {isTagging ? (
            <div></div> // Empty placeholder, we'll only use the cancel button in the form below
          ) : (
            <Button
              onClick={() => setIsTagging(true)}
              variant="secondary"
              className="bg-white/80 hover:bg-white/90"
            >
              <Tag className="h-4 w-4 mr-2" />
              Tag Person
            </Button>
          )}
        </div>
      </>
    ),
    // Additional UI element that will be rendered OUTSIDE the image
    renderTaggingForm: () => (
      <>
        {/* Tagging Interface - Completely outside the image */}
        {isTagging && (
          <div className="mt-4 p-4 border rounded-lg bg-gray-50">
            {!hasSelectedPosition ? (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Click on the photo to position the tag</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitTag} className="space-y-3">
                <Input
                  type="text"
                  placeholder="Person's name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  autoFocus
                />
                <Input
                  type="text"
                  placeholder="Description (optional)"
                  value={newTagDescription}
                  onChange={(e) => setNewTagDescription(e.target.value)}
                />
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
      </>
    ),
    isTagging
  };
};

export default PhotoTagger;