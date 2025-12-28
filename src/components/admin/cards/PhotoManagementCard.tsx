// src/components/admin/cards/PhotoManagementCard.tsx
import React, { useState } from 'react';
import { Photo, photoService } from '@/services/firebaseService';
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
import { Edit, Expand, Trash2 } from 'lucide-react';
import LazyImage from '@/components/LazyImage';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { TEXT_LIMITS } from '@/constants';
import { CharacterCounter } from '@/components/ui/character-counter';
import YearPicker from '@/components/YearPicker';

interface PhotoManagementCardProps {
  photo: Photo;
  onEdit: (updates: Partial<Photo>) => void;
  onDelete: (reason: string) => void;
}

export default 
function PhotoManagementCard({ 
  photo, 
  onEdit,
  onDelete 
}: { 
  photo: Photo; 
  onEdit: (updates: Partial<Photo>) => void;
  onDelete: (reason: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    author: photo.author,
    description: photo.description,
    year: photo.year
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
const [deleteReason, setDeleteReason] = useState({
  reported: false,
  duplicate: false,
  inappropriate: false,
  outdated: false,
  copyrightViolation: false,
  custom: ''
});
// Helper functions
const hasDeleteReason = (
  deleteReason.reported || 
  deleteReason.duplicate || 
  deleteReason.inappropriate || 
  deleteReason.outdated || 
  deleteReason.copyrightViolation || 
  (deleteReason.custom.trim() !== '' && deleteReason.custom.length <= 250)
);

const buildDeleteReasonText = () => {
  const reasons: string[] = [];
  if (deleteReason.reported) reasons.push('Prijavljeno od drugih korisnika');
  if (deleteReason.duplicate) reasons.push('Duplikat postojeće fotografije');
  if (deleteReason.inappropriate) reasons.push('Neprimjeren sadržaj');
  if (deleteReason.outdated) reasons.push('Zastarjele/netočne informacije');
  if (deleteReason.copyrightViolation) reasons.push('Kršenje autorskih prava');
  if (deleteReason.custom.trim()) reasons.push(deleteReason.custom.trim());
  
  return reasons.join('; ');
};
  const { t } = useLanguage();

  // Check if any changes have been made and all fields are valid
  const hasChanges = editData.author !== photo.author || 
                    editData.description !== photo.description || 
                    editData.year !== photo.year;
  
  const isFormValid = editData.author.trim() !== '' && 
                     editData.description.trim() !== '' && 
                     editData.year.trim() !== '';

  const canSave = hasChanges && isFormValid;

  const handleSaveEdit = () => {
    onEdit(editData);
    setIsEditing(false);
  };

  const handleDeleteWithReason = () => {
  const reasonText = buildDeleteReasonText();
  onDelete(reasonText); // ✅ Pass reason to parent
  setShowDeleteDialog(false);
  // Reset form
  setDeleteReason({
    reported: false,
    duplicate: false,
    inappropriate: false,
    outdated: false,
    copyrightViolation: false,
    custom: ''
  });
};

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-6">
        <div className="flex-shrink-0 relative group w-full sm:w-48">
<Dialog>
  <DialogTrigger asChild>
    <div className="relative cursor-pointer w-full h-32">
      <LazyImage
        src={photo.imageUrl}
        alt={photo.description}
        className="w-full h-full object-cover rounded-lg transition-all group-hover:brightness-75"
        threshold={0.3} // Approved slike - manje hitno
        rootMargin="100px"
        placeholder={
          <div className="w-full h-full bg-green-100 animate-pulse flex items-center justify-center rounded-lg">
            <div className="text-center text-green-600">
              <div className="text-xs font-medium">Approved</div>
              <div className="text-xs">{photo.location}</div>
            </div>
          </div>
        }
      />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Expand className="h-6 w-6 text-white" />
      </div>
    </div>
  </DialogTrigger>
  <DialogContent className="max-w-4xl max-h-[90vh] p-0">
    {/* MODAL slika - ostavi kao img */}
    <img
      src={photo.imageUrl}
      alt={photo.description}
      className="w-full h-auto object-contain rounded-lg"
    />
  </DialogContent>
</Dialog>
        </div>
        
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Badge variant={photo.isApproved ? "default" : "secondary"}>
                {photo.isApproved ? "Approved" : "Pending"}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {photo.views} views • {photo.likes} likes
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
              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
  <AlertDialogTrigger asChild>
    <Button
      size="sm"
      variant="outline"
      className="text-red-600 dark:text-red-400 border-red-600 dark:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent className="max-w-xl dark:bg-gray-800 dark:border-gray-700">
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Approved Memory</AlertDialogTitle>
      <AlertDialogDescription>
        Please select the reason(s) for deleting this approved photo. The user will receive an email with this information.
      </AlertDialogDescription>
    </AlertDialogHeader>
    
    <div className="space-y-4 py-4">
      <div className="space-y-3">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={deleteReason.reported}
            onChange={(e) => setDeleteReason(prev => ({ ...prev, reported: e.target.checked }))}
            className="w-4 h-4 text-red-600 rounded"
          />
          <span className="text-sm dark:text-gray-200">Prijavljeno od drugih korisnika</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={deleteReason.duplicate}
            onChange={(e) => setDeleteReason(prev => ({ ...prev, duplicate: e.target.checked }))}
            className="w-4 h-4 text-red-600 rounded"
          />
          <span className="text-sm dark:text-gray-200">Duplikat postojeće fotografije</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={deleteReason.inappropriate}
            onChange={(e) => setDeleteReason(prev => ({ ...prev, inappropriate: e.target.checked }))}
            className="w-4 h-4 text-red-600 rounded"
          />
          <span className="text-sm dark:text-gray-200">Neprimjeren sadržaj</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={deleteReason.outdated}
            onChange={(e) => setDeleteReason(prev => ({ ...prev, outdated: e.target.checked }))}
            className="w-4 h-4 text-red-600 rounded"
          />
          <span className="text-sm dark:text-gray-200">Zastarjele/netočne informacije</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={deleteReason.copyrightViolation}
            onChange={(e) => setDeleteReason(prev => ({ ...prev, copyrightViolation: e.target.checked }))}
            className="w-4 h-4 text-red-600 rounded"
          />
          <span className="text-sm dark:text-gray-200">Kršenje autorskih prava</span>
        </label>
      </div>

      <div>
        <label className="text-sm font-medium block mb-2 dark:text-gray-200">Ostalo (ručni unos):</label>
        <Textarea
          value={deleteReason.custom}
          onChange={(e) => {
            const value = e.target.value.slice(0, 250);
            setDeleteReason(prev => ({ ...prev, custom: value }));
          }}
          placeholder="Dodatni razlog brisanja..."
          rows={3}
          maxLength={250}
          className={`w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${
            deleteReason.custom.length >= 240 ? 'border-red-300 focus:border-red-500 dark:border-red-500 dark:focus:border-red-400' : ''
          }`}
        />
        <p className={`text-sm mt-1 ${
          deleteReason.custom.length > 240
            ? 'text-orange-600 dark:text-orange-400 font-bold'
            : 'text-muted-foreground dark:text-gray-400'
        }`}>
          {deleteReason.custom.length}/250 znakova
        </p>
      </div>

      {!hasDeleteReason && (
        <p className="text-sm text-orange-600 dark:text-orange-400">
          Morate odabrati barem jedan razlog ili napisati prilagođeni razlog (max 250 znakova).
        </p>
      )}
    </div>
    
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <Button
        onClick={handleDeleteWithReason}
        disabled={!hasDeleteReason}
        className="bg-red-600 hover:bg-red-700"
      >
        Delete Memory
      </Button>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">Author *</label>
                <Input
                  value={editData.author}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, 40);
                    setEditData(prev => ({ ...prev, author: value }));
                  }}
                  maxLength={40}
                  placeholder="Author"
                  className={editData.author.length >= 38 ? "border-red-300 focus:border-red-500" : ""}
                />
                <CharacterCounter currentLength={editData.author.length} maxLength={40} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Year *</label>
                <YearPicker
                  selectedYear={editData.year}
                  onYearSelect={(year) => setEditData(prev => ({ ...prev, year }))}
                  placeholder="Select year"
                  required={true}
                  t={t}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Description</label>
                <Textarea
                  value={editData.description}
                  onChange={(e) => {
      // ✅ Ograniči na TEXT_LIMITS.DESCRIPTION karaktera
      const value = e.target.value.slice(0, TEXT_LIMITS.DESCRIPTION);
      setEditData(prev => ({ ...prev, description: value }));
    }}
                  placeholder="Description"
                  rows={2}
                  maxLength={250}
                />
                <CharacterCounter currentLength={editData.description.length} maxLength={250} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} disabled={!canSave}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="min-w-0 overflow-hidden">
              <h3 className="font-medium break-words">{photo.description}</h3>
              <p className="text-sm text-muted-foreground break-words">
                By {photo.author} • {photo.year} • {photo.location}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

