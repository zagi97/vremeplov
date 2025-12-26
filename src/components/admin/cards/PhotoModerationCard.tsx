// src/components/admin/cards/PhotoModerationCard.tsx
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
import { Check, X, Edit, Expand, MapPin } from 'lucide-react';
import LazyImage from '@/components/LazyImage';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { TEXT_LIMITS } from '@/constants';
import { CharacterCounter } from '@/components/ui/character-counter';
import YearPicker from '@/components/YearPicker';

interface PhotoModerationCardProps {
  photo: Photo;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onEdit: (updates: Partial<Photo>) => void;
}

export default 
function PhotoModerationCard({ 
  photo, 
  onApprove, 
  onReject, 
  onEdit 
}: { 
  photo: Photo; 
  onApprove: () => void; 
  onReject: (reason: string) => void; // ✅ PROMJENA - prima reason
  onEdit: (updates: Partial<Photo>) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false); // ✅ NOVO
  const [rejectReason, setRejectReason] = useState({ // ✅ NOVO
    lowQuality: false,
    notRelevant: false,
    wrongLocation: false,
    duplicate: false,
    inappropriate: false,
    custom: ''
  });
  const [editData, setEditData] = useState({
    author: photo.author,
    description: photo.description,
    year: photo.year
  });
  const { t } = useLanguage();

  // Check if any changes have been made and all fields are valid
  const hasChanges = editData.author !== photo.author || 
                    editData.description !== photo.description || 
                    editData.year !== photo.year;
  
  const isFormValid = editData.author.trim() !== '' && 
                     editData.description.trim() !== '' && 
                     editData.year.trim() !== '';

  const canSave = hasChanges && isFormValid;

  // ✅ NOVO - Check if at least one reason is selected
const hasRejectReason = (
  rejectReason.lowQuality || 
  rejectReason.notRelevant || 
  rejectReason.wrongLocation || 
  rejectReason.duplicate || 
  rejectReason.inappropriate || 
  (rejectReason.custom.trim() !== '' && rejectReason.custom.length <= 250)
);

  // ✅ NOVO - Build reason text from selected options
  const buildReasonText = () => {
    const reasons: string[] = [];
    if (rejectReason.lowQuality) reasons.push('Niska kvaliteta slike');
    if (rejectReason.notRelevant) reasons.push('Sadržaj nije relevantan');
    if (rejectReason.wrongLocation) reasons.push('Netočna lokacija ili godina');
    if (rejectReason.duplicate) reasons.push('Duplikat postojeće fotografije');
    if (rejectReason.inappropriate) reasons.push('Neprimjeren sadržaj');
    if (rejectReason.custom.trim()) reasons.push(rejectReason.custom.trim());
    
    return reasons.join('; ');
  };

  // ✅ NOVO - Handle reject with reason
  const handleRejectWithReason = () => {
    const reasonText = buildReasonText();
    onReject(reasonText);
    setShowRejectDialog(false);
    // Reset form
    setRejectReason({
      lowQuality: false,
      notRelevant: false,
      wrongLocation: false,
      duplicate: false,
      inappropriate: false,
      custom: ''
    });
  };

  const handleSaveEdit = () => {
    onEdit(editData);
    setIsEditing(false);
  };

  return (
    <Card className="overflow-hidden dark:bg-gray-800 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-6">
        <div className="flex-shrink-0 relative group w-full sm:w-48">
          <Dialog>
            <DialogTrigger asChild>
              <div className="relative cursor-pointer w-full h-32">
                <LazyImage
                  src={photo.imageUrl}
                  alt={photo.description}
                  className="w-full h-full object-cover rounded-lg transition-all group-hover:brightness-75"
                  threshold={0.2}
                  rootMargin="150px"
                  placeholder={
                    <div className="w-full h-full bg-orange-100 animate-pulse flex items-center justify-center rounded-lg">
                      <div className="text-center text-orange-600">
                        <div className="text-xs font-medium">Pending Review</div>
                        <div className="text-xs">{photo.location}</div>
                      </div>
                    </div>
                  }
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Expand className="h-8 w-8 text-white" />
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0">
              <img
                src={photo.imageUrl}
                alt={photo.description}
                className="w-full h-auto object-contain rounded-lg"
              />
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Badge variant="outline" className="text-orange-600 dark:text-orange-400 border-orange-600 dark:border-orange-500">
                Pending Review
              </Badge>
              <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
                Uploaded: {photo.createdAt?.toDate()?.toLocaleDateString('hr-HR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
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
                    <AlertDialogTitle>Approve Memory</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to approve this memory? It will be published and visible to all users.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onApprove} className="bg-green-600 hover:bg-green-700">
                      Approve Memory
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              {/* ✅ NOVO - Reject Dialog with Reasons */}
              <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
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
                <AlertDialogContent className="max-w-xl dark:bg-gray-800 dark:border-gray-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reject Memory</AlertDialogTitle>
                    <AlertDialogDescription>
                      Please select the reason(s) for rejecting this memory. The user will receive an email with this information.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-3">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rejectReason.lowQuality}
                          onChange={(e) => setRejectReason(prev => ({ ...prev, lowQuality: e.target.checked }))}
                          className="w-4 h-4 text-red-600 rounded"
                        />
                        <span className="text-sm dark:text-gray-200">Niska kvaliteta slike</span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rejectReason.notRelevant}
                          onChange={(e) => setRejectReason(prev => ({ ...prev, notRelevant: e.target.checked }))}
                          className="w-4 h-4 text-red-600 rounded"
                        />
                        <span className="text-sm dark:text-gray-200">Sadržaj nije relevantan</span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rejectReason.wrongLocation}
                          onChange={(e) => setRejectReason(prev => ({ ...prev, wrongLocation: e.target.checked }))}
                          className="w-4 h-4 text-red-600 rounded"
                        />
                        <span className="text-sm dark:text-gray-200">Netočna lokacija ili godina</span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rejectReason.duplicate}
                          onChange={(e) => setRejectReason(prev => ({ ...prev, duplicate: e.target.checked }))}
                          className="w-4 h-4 text-red-600 rounded"
                        />
                        <span className="text-sm dark:text-gray-200">Duplikat postojeće fotografije</span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rejectReason.inappropriate}
                          onChange={(e) => setRejectReason(prev => ({ ...prev, inappropriate: e.target.checked }))}
                          className="w-4 h-4 text-red-600 rounded"
                        />
                        <span className="text-sm dark:text-gray-200">Neprimjeren sadržaj</span>
                      </label>
                    </div>

                    <div>
  <label className="text-sm font-medium block mb-2 dark:text-gray-200">Ostalo (ručni unos):</label>
  <Textarea
    value={rejectReason.custom}
    onChange={(e) => {
      const value = e.target.value.slice(0, TEXT_LIMITS.DESCRIPTION);
      setRejectReason(prev => ({ ...prev, custom: value }));
    }}
    placeholder="Dodatni razlog odbijanja..."
    rows={3}
    maxLength={250}
    className={`w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${
      rejectReason.custom.length >= 240 ? 'border-red-300 focus:border-red-500 dark:border-red-500 dark:focus:border-red-400' : ''
    }`}
  />
  <p className={`text-sm mt-1 ${
    rejectReason.custom.length > 240
      ? 'text-orange-600 dark:text-orange-400 font-bold'
      : 'text-muted-foreground dark:text-gray-400'
  }`}>
    {rejectReason.custom.length}/250 znakova
  </p>
</div>
                    
                    {!hasRejectReason && (
                      <p className="text-sm text-orange-600 dark:text-orange-400">
                        Morate odabrati barem jedan razlog ili napisati prilagođeni razlog.
                      </p>
                    )}
                  </div>
                  
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button
                      onClick={handleRejectWithReason}
                      disabled={!hasRejectReason}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Reject Memory
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium dark:text-gray-200">Author *</label>
                <Input
                  value={editData.author}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, 40);
                    setEditData(prev => ({ ...prev, author: value }));
                  }}
                  maxLength={40}
                  className={`dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${editData.author.length >= 38 ? "border-red-300 focus:border-red-500 dark:border-red-500" : ""}`}
                />
                <CharacterCounter currentLength={editData.author.length} maxLength={40} />
              </div>
              <div>
                <label className="text-sm font-medium dark:text-gray-200">Year *</label>
                <YearPicker
                  selectedYear={editData.year}
                  onYearSelect={(year) => setEditData(prev => ({ ...prev, year }))}
                  placeholder="Select year"
                  required={true}
                  t={t}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1 dark:text-gray-200">Description</label>
                <Textarea
                  value={editData.description}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, TEXT_LIMITS.DESCRIPTION);
                    setEditData(prev => ({ ...prev, description: value }));
                  }}
                  rows={2}
                  maxLength={250}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
                {/* ✅ Character counter */}
  <p className={`text-sm mt-1 ${
  editData.description.length > 240
    ? 'text-orange-600 dark:text-orange-400 font-bold'
    : 'text-muted-foreground dark:text-gray-400'
}`}>
  {editData.description.length}/250 znakova
</p>
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
              <h3 className="font-medium break-all dark:text-gray-100">{photo.description}</h3>
              <p className="text-sm text-muted-foreground dark:text-gray-400 break-all">
                By {photo.author} • {photo.year} • {photo.location}
              </p>
              {photo.detailedDescription && (
                <p className="text-sm mt-2 break-all dark:text-gray-300">{photo.detailedDescription}</p>
              )}
              {/* Show coordinates/address if available */}
              {photo.coordinates && (
                <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-800 dark:text-blue-300">
                        📍 {photo.coordinates.address || 'Lokacija označena'}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Koordinate: {photo.coordinates.latitude.toFixed(5)}, {photo.coordinates.longitude.toFixed(5)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
