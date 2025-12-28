// src/components/admin/cards/TagModerationCard.tsx
import React, { useState, useEffect } from 'react';
import { TaggedPerson, Photo, photoService } from '@/services/firebaseService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Check, X, Edit, Expand, User } from 'lucide-react';
import LazyImage from '@/components/LazyImage';
import { CharacterCounter } from '@/components/ui/character-counter';

interface TagModerationCardProps {
  tag: TaggedPerson;
  onApprove: () => void;
  onReject: () => void;
  onEdit: (updates: Partial<TaggedPerson>) => void;
}

export default function TagModerationCard({
  tag,
  onApprove,
  onReject,
  onEdit,
}: TagModerationCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: tag.name,
    description: tag.description || '',
  });
  const [photo, setPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    const loadPhoto = async () => {
      try {
        const photoData = await photoService.getPhotoById(tag.photoId);
        setPhoto(photoData);
      } catch (error) {
        console.error('Error loading photo for tag:', error);
      }
    };
    loadPhoto();
  }, [tag.photoId]);

  const hasChanges =
    editData.name !== tag.name ||
    editData.description !== (tag.description || '');
  const isFormValid = editData.name.trim() !== '';
  const canSave = hasChanges && isFormValid;

  const handleSaveEdit = () => {
    onEdit(editData);
    setIsEditing(false);
  };

  return (
    <Card className="overflow-hidden dark:bg-gray-800 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-6">
        {photo && (
          <div className="flex-shrink-0 relative group w-full sm:w-48">
            <Dialog>
              <DialogTrigger asChild>
                <div className="relative cursor-pointer w-full h-32">
                  <LazyImage
                    src={photo.imageUrl}
                    alt={photo.description}
                    className="w-full h-full object-cover rounded-lg transition-all group-hover:brightness-75"
                    threshold={0.3}
                    rootMargin="100px"
                  />
                  <div
                    className="absolute w-6 h-6 bg-red-500 border-2 border-white rounded-full -ml-3 -mt-3 animate-pulse"
                    style={{
                      left: `${tag.x}%`,
                      top: `${tag.y}%`,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Expand className="h-8 w-8 text-white" />
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                <div className="relative">
                  <img
                    src={photo.imageUrl}
                    alt={photo.description}
                    className="w-full h-auto object-contain rounded-lg"
                  />
                  <div
                    className="absolute w-8 h-8 bg-red-500 border-2 border-white rounded-full -ml-4 -mt-4"
                    style={{
                      left: `${tag.x}%`,
                      top: `${tag.y}%`,
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Badge variant="outline" className="text-orange-600 dark:text-orange-400 border-orange-600 dark:border-orange-500">
                Pending Tag Review
              </Badge>
              <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
                Tagged: {tag.createdAt?.toDate()?.toLocaleDateString('hr-HR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}{' '}
                by {tag.addedBy}
              </p>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 dark:text-green-400 border-green-600 dark:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/30"
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Approve Person Tag</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to approve this person tag? It will be
                      visible to all users.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onApprove}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Approve Tag
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 dark:text-red-400 border-red-600 dark:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reject Person Tag</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to reject this person tag? This action
                      cannot be undone and the tag will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onReject}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Reject Tag
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium dark:text-gray-200">Person Name *</label>
                <Input
                  value={editData.name}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, 40);
                    setEditData((prev) => ({ ...prev, name: value }));
                  }}
                  maxLength={40}
                  placeholder="Enter person's name"
                  className={`dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${
                    editData.name.length >= 38 ? "border-red-300 focus:border-red-500 dark:border-red-500 dark:focus:border-red-400" : ""
                  }`}
                />
                <CharacterCounter currentLength={editData.name.length} maxLength={40} />
              </div>
              <div>
                <label className="text-sm font-medium dark:text-gray-200">Description (Optional)</label>
                <Textarea
                  value={editData.description}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, 100);
                    setEditData((prev) => ({ ...prev, description: value }));
                  }}
                  maxLength={100}
                  placeholder="Additional information about this person"
                  rows={2}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                />
                <CharacterCounter currentLength={editData.description.length} maxLength={100} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} disabled={!canSave}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="min-w-0 overflow-hidden">
              <h3 className="font-medium flex items-center gap-2 dark:text-gray-200">
                <User className="h-4 w-4 flex-shrink-0 dark:text-gray-400" />
                <span className="break-words min-w-0 flex-1">{tag.name}</span>
              </h3>
              <p className="text-sm text-muted-foreground dark:text-gray-400 break-words">
                Tagged in: {photo?.description} • {photo?.location} • {photo?.year}
              </p>
              {tag.description && <p className="text-sm mt-2 break-words dark:text-gray-300">{tag.description}</p>}
              <p className="text-xs text-muted-foreground dark:text-gray-500 mt-2">
                Position: {tag.x.toFixed(1)}%, {tag.y.toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
