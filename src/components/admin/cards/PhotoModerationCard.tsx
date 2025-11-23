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
import { Check, X, Edit, Expand } from 'lucide-react';
import LazyImage from '@/components/LazyImage';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { TEXT_LIMITS } from '@/constants';

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
  const [uploading, setUploading] = useState(false);
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const newImageUrl = await photoService.uploadPhotoFile(file, photo.id!);
      setEditData(prev => ({ ...prev, imageUrl: newImageUrl }));
      toast.success(t('admin.imageUploaded'));
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(t('upload.error'));
    } finally {
      setUploading(false);
    }
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
        
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                Pending Review
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                Uploaded: {photo.createdAt?.toDate()?.toLocaleDateString('hr-HR', {
                  day: '2-digit',
                  month: '2-digit', 
                  year: 'numeric'
                })}
              </p>
            </div>
            
            <div className="flex gap-2">
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
                    className="text-green-600 border-green-600 hover:bg-green-50"
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
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-xl">
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
                        <span className="text-sm">Niska kvaliteta slike</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rejectReason.notRelevant}
                          onChange={(e) => setRejectReason(prev => ({ ...prev, notRelevant: e.target.checked }))}
                          className="w-4 h-4 text-red-600 rounded"
                        />
                        <span className="text-sm">Sadržaj nije relevantan</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rejectReason.wrongLocation}
                          onChange={(e) => setRejectReason(prev => ({ ...prev, wrongLocation: e.target.checked }))}
                          className="w-4 h-4 text-red-600 rounded"
                        />
                        <span className="text-sm">Netočna lokacija ili godina</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rejectReason.duplicate}
                          onChange={(e) => setRejectReason(prev => ({ ...prev, duplicate: e.target.checked }))}
                          className="w-4 h-4 text-red-600 rounded"
                        />
                        <span className="text-sm">Duplikat postojeće fotografije</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rejectReason.inappropriate}
                          onChange={(e) => setRejectReason(prev => ({ ...prev, inappropriate: e.target.checked }))}
                          className="w-4 h-4 text-red-600 rounded"
                        />
                        <span className="text-sm">Neprimjeren sadržaj</span>
                      </label>
                    </div>
                    
                    <div>
  <label className="text-sm font-medium block mb-2">Ostalo (ručni unos):</label>
  <Textarea
    value={rejectReason.custom}
    onChange={(e) => {
      const value = e.target.value.slice(0, TEXT_LIMITS.DESCRIPTION);
      setRejectReason(prev => ({ ...prev, custom: value }));
    }}
    placeholder="Dodatni razlog odbijanja..."
    rows={3}
    maxLength={250}
    className={`w-full ${rejectReason.custom.length >= 240 ? 'border-red-300 focus:border-red-500' : ''}`}
  />
  <p className={`text-sm mt-1 ${
    rejectReason.custom.length > 240 
      ? 'text-red-600 font-bold' 
      : 'text-muted-foreground'
  }`}>
    {rejectReason.custom.length}/250 znakova
  </p>
</div>
                    
                    {!hasRejectReason && (
                      <p className="text-sm text-red-600">
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
                <label className="text-sm font-medium">Author</label>
                <Input
                  value={editData.author}
                  onChange={(e) => setEditData(prev => ({ ...prev, author: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Year</label>
                <Input
                  value={editData.year}
                  onChange={(e) => setEditData(prev => ({ ...prev, year: e.target.value }))}
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
                  rows={2}
                  maxLength={250}
                />
                {/* ✅ Character counter */}
  <p className={`text-sm mt-1 ${
  editData.description.length > 240 
    ? 'text-red-600 font-bold' 
    : 'text-muted-foreground'
}`}>
  {editData.description.length}/250 znakova
</p>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Replace Image</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="cursor-pointer"
                />
                {uploading && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    Uploading image...
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Upload replacement image file (JPG, PNG, etc.) when user sends better version via email
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} disabled={!canSave && !uploading}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="font-medium">{photo.description}</h3>
              <p className="text-sm text-muted-foreground">
                By {photo.author} • {photo.year} • {photo.location}
              </p>
              {photo.detailedDescription && (
                <p className="text-sm mt-2">{photo.detailedDescription}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
