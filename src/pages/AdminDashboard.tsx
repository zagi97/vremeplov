import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { photoService, Photo, Comment, TaggedPerson } from '../services/firebaseService';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogTrigger } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { toast } from 'sonner';
import { Check, X, Edit, Eye, MessageSquare, Users, BarChart3, Expand, Upload, Image, Trash2, LogOut, Tag, User } from 'lucide-react';
import LazyImage from '../components/LazyImage';


export default function AdminDashboard() {
const { user, isAdmin, exitAdminMode } = useAuth();
const navigate = useNavigate();
  const [pendingPhotos, setPendingPhotos] = useState<Photo[]>([]);
  const [approvedPhotos, setApprovedPhotos] = useState<Photo[]>([]);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [pendingTags, setPendingTags] = useState<TaggedPerson[]>([]);
  const [allTags, setAllTags] = useState<TaggedPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [stats, setStats] = useState({
    totalPhotos: 0,
    pendingPhotos: 0,
    approvedPhotos: 0,
    rejectedPhotos: 0,
    totalViews: 0,
    totalLikes: 0,
    pendingTags: 0,
    totalTags: 0
  });

  useEffect(() => {
    if (!isAdmin) return;
    loadAdminData();
  }, [isAdmin]);


  // Auto-exit admin mode when leaving dashboard
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (user?.email === 'vremeplov.app@gmail.com') {
        await exitAdminMode();
      }
    };

    const handleVisibilityChange = async () => {
      if (document.hidden && user?.email === 'vremeplov.app@gmail.com') {
        setTimeout(async () => {
          await exitAdminMode();
          navigate('/');
        }, 100);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, exitAdminMode, navigate]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Load photos
      const photos = await photoService.getAllPhotosForAdmin();
      console.log('All photos from database:', photos);
      
      const pending = photos.filter(photo => 
        photo.isApproved === undefined || 
        photo.isApproved === null || 
        photo.isApproved === false
      );
      
      const approved = photos.filter(photo => photo.isApproved === true || photo.approved === true);
      
      // Load tags
      const allTaggedPersons = await photoService.getAllTaggedPersonsForAdmin();
      const pendingTaggedPersons = allTaggedPersons.filter(tag => !tag.isApproved);
      
      const rejectedCount = parseInt(localStorage.getItem('rejectedPhotosCount') || '0', 10);
      
      setPendingPhotos(pending);
      setApprovedPhotos(approved);
      setAllPhotos(photos);
      setPendingTags(pendingTaggedPersons);
      setAllTags(allTaggedPersons);
      
      setStats({
        totalPhotos: photos.length,
        pendingPhotos: pending.length,
        approvedPhotos: approved.length,
        rejectedPhotos: rejectedCount,
        totalViews: photos.reduce((sum, photo) => sum + photo.views, 0),
        totalLikes: photos.reduce((sum, photo) => sum + photo.likes, 0),
        pendingTags: pendingTaggedPersons.length,
        totalTags: allTaggedPersons.length
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePhoto = async (photoId: string) => {
    try {
      await photoService.updatePhoto(photoId, { isApproved: true });
      toast.success('Photo approved successfully');
      loadAdminData();
    } catch (error) {
      console.error('Error approving photo:', error);
      toast.error('Failed to approve photo');
    }
  };

  const handleRejectPhoto = async (photoId: string) => {
    try {
      console.log('Rejecting (deleting) photo with ID:', photoId);
      await photoService.deletePhoto(photoId);
      
      const currentCount = parseInt(localStorage.getItem('rejectedPhotosCount') || '0', 10);
      localStorage.setItem('rejectedPhotosCount', (currentCount + 1).toString());
      
      console.log('Photo deleted successfully, updating UI...');
      toast.success('Photo rejected and deleted');
      loadAdminData();
    } catch (error) {
      console.error('Error deleting photo:', error);
      console.error('Full error details:', error);
      toast.error('Failed to delete photo');
    }
  };

  const handleEditPhoto = async (photoId: string, updates: Partial<Photo>) => {
    try {
      await photoService.updatePhoto(photoId, updates);
      toast.success('Photo updated successfully');
      loadAdminData();
    } catch (error) {
      console.error('Error updating photo:', error);
      toast.error('Failed to update photo');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await photoService.deletePhoto(photoId);
      toast.success('Photo deleted successfully');
      loadAdminData();
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Failed to delete photo');
    }
  };

  // Tag moderation handlers
  const handleApproveTag = async (tagId: string) => {
    try {
      await photoService.approveTaggedPerson(tagId, user!.uid);
      toast.success('Tag approved successfully');
      loadAdminData();
    } catch (error) {
      console.error('Error approving tag:', error);
      toast.error('Failed to approve tag');
    }
  };

  const handleRejectTag = async (tagId: string) => {
    try {
      await photoService.rejectTaggedPerson(tagId);
      toast.success('Tag rejected and deleted');
      loadAdminData();
    } catch (error) {
      console.error('Error rejecting tag:', error);
      toast.error('Failed to reject tag');
    }
  };

  const handleEditTag = async (tagId: string, updates: Partial<TaggedPerson>) => {
    try {
      await photoService.updateTaggedPerson(tagId, updates);
      toast.success('Tag updated successfully');
      loadAdminData();
    } catch (error) {
      console.error('Error updating tag:', error);
      toast.error('Failed to update tag');
    }
  };

  const handleLogout = async () => {
    try {
      await exitAdminMode();
      navigate('/');
      toast.success('Exited admin mode successfully');
    } catch (error) {
      console.error('Error exiting admin mode:', error);
      toast.error('Failed to exit admin mode');
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => window.location.href = '/admin-login'}
                className="w-full"
              >
                Go to Admin Login
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage photos, tags, users, and content moderation</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Photos</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPhotos}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Photos</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingPhotos}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <Check className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approvedPhotos}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <X className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejectedPhotos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tags</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingTags}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tags</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTags}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalViews}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLikes}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="pending">
              Pending Photos ({stats.pendingPhotos})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved Photos ({stats.approvedPhotos})
            </TabsTrigger>
            <TabsTrigger value="tags">
              Person Tags ({stats.pendingTags})
            </TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Photos Awaiting Approval</h2>
              <Badge variant="secondary">{pendingPhotos.length} pending</Badge>
            </div>
            
            {pendingPhotos.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">All caught up!</h3>
                    <p className="text-muted-foreground">No photos pending approval.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {pendingPhotos.map((photo) => (
                  <PhotoModerationCard
                    key={photo.id}
                    photo={photo}
                    onApprove={() => handleApprovePhoto(photo.id!)}
                    onReject={() => handleRejectPhoto(photo.id!)}
                    onEdit={(updates) => handleEditPhoto(photo.id!, updates)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Approved Photos</h2>
              <Badge variant="secondary">{approvedPhotos.length} approved</Badge>
            </div>
            
            <div className="grid gap-6">
              {approvedPhotos.map((photo) => (
                <PhotoManagementCard
                  key={photo.id}
                  photo={photo}
                  onEdit={(updates) => handleEditPhoto(photo.id!, updates)}
                  onDelete={() => handleDeletePhoto(photo.id!)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tags" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Person Tags Awaiting Approval</h2>
              <Badge variant="secondary">{pendingTags.length} pending</Badge>
            </div>
            
            {pendingTags.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">All caught up!</h3>
                    <p className="text-muted-foreground">No person tags pending approval.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {pendingTags.map((tag) => (
                  <TagModerationCard
                    key={tag.id}
                    tag={tag}
                    onApprove={() => handleApproveTag(tag.id!)}
                    onReject={() => handleRejectTag(tag.id!)}
                    onEdit={(updates) => handleEditTag(tag.id!, updates)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="comments">
            <Card>
              <CardHeader>
                <CardTitle>Comment Moderation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This section will allow you to moderate user comments on photos - view, approve, edit or delete inappropriate comments.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">User management features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Component for moderating person tags
function TagModerationCard({ 
  tag, 
  onApprove, 
  onReject, 
  onEdit 
}: { 
  tag: TaggedPerson; 
  onApprove: () => void; 
  onReject: () => void; 
  onEdit: (updates: Partial<TaggedPerson>) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: tag.name,
    description: tag.description || ''
  });
  const [photo, setPhoto] = useState<Photo | null>(null);

  // Load photo data for context
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

  const hasChanges = editData.name !== tag.name || editData.description !== (tag.description || '');
  const isFormValid = editData.name.trim() !== '';
  const canSave = hasChanges && isFormValid;

  const handleSaveEdit = () => {
    onEdit(editData);
    setIsEditing(false);
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex gap-6 p-6">
        {photo && (
          <div className="flex-shrink-0 relative group w-48">
<Dialog>
  <DialogTrigger asChild>
    <div className="relative cursor-pointer w-full h-32">
      <LazyImage
        src={photo.imageUrl}
        alt={photo.description}
        className="w-full h-full object-cover rounded-lg transition-all group-hover:brightness-75"
        threshold={0.3} // Admin - učitaj kad je 30% vidljivo
        rootMargin="100px" // Učitaj 100px prije viewport-a
      />
      {/* Show tag position */}
      <div 
        className="absolute w-6 h-6 bg-red-500 border-2 border-white rounded-full -ml-3 -mt-3 animate-pulse"
        style={{ 
          left: `${tag.x}%`, 
          top: `${tag.y}%` 
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Expand className="h-8 w-8 text-white" />
      </div>
    </div>
  </DialogTrigger>
  <DialogContent className="max-w-4xl max-h-[90vh] p-0">
    <div className="relative">
      {/* MODAL slika - NE mijenjaj ovu, učitava se tek kad korisnik klikne */}
      <img
        src={photo.imageUrl}
        alt={photo.description}
        className="w-full h-auto object-contain rounded-lg"
      />
      <div 
        className="absolute w-8 h-8 bg-red-500 border-2 border-white rounded-full -ml-4 -mt-4"
        style={{ 
          left: `${tag.x}%`, 
          top: `${tag.y}%` 
        }}
      />
    </div>
  </DialogContent>
</Dialog>
          </div>
        )}
        
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                Pending Tag Review
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                Tagged: {tag.createdAt?.toDate()?.toLocaleDateString('hr-HR', {
                  day: '2-digit',
                  month: '2-digit', 
                  year: 'numeric'
                })} by {tag.addedBy}
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
                    <AlertDialogTitle>Approve Person Tag</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to approve this person tag? It will be visible to all users.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onApprove} className="bg-green-600 hover:bg-green-700">
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
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reject Person Tag</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to reject this person tag? This action cannot be undone and the tag will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onReject} className="bg-red-600 hover:bg-red-700">
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
                <label className="text-sm font-medium">Person Name</label>
                <Input
                  value={editData.name}
                  onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter person's name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (Optional)</label>
                <Textarea
                  value={editData.description}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional information about this person"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} disabled={!canSave}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                {tag.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                Tagged in: {photo?.description} • {photo?.location} • {photo?.year}
              </p>
              {tag.description && (
                <p className="text-sm mt-2">{tag.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Position: {tag.x.toFixed(1)}%, {tag.y.toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// Component for moderating pending photos
function PhotoModerationCard({ 
  photo, 
  onApprove, 
  onReject, 
  onEdit 
}: { 
  photo: Photo; 
  onApprove: () => void; 
  onReject: () => void; 
  onEdit: (updates: Partial<Photo>) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editData, setEditData] = useState({
    author: photo.author,
    description: photo.description,
    year: photo.year
  });

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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Upload new image to Firebase Storage
      const newImageUrl = await photoService.uploadPhotoFile(file, photo.id!);
      
      // Update editData with new image URL
      setEditData(prev => ({ ...prev, imageUrl: newImageUrl }));
      
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex gap-6 p-6">
        <div className="flex-shrink-0 relative group w-48">
<Dialog>
  <DialogTrigger asChild>
    <div className="relative cursor-pointer w-full h-32">
      <LazyImage
        src={photo.imageUrl}
        alt={photo.description}
        className="w-full h-full object-cover rounded-lg transition-all group-hover:brightness-75"
        threshold={0.2} // Pending slike - važnije, učitaj ranije
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
    {/* MODAL slika - ostavi kao img jer se učitava tek kad korisnik klikne */}
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
              <AlertDialog>
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
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reject Memory</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to reject this memory? This action cannot be undone and the memory will not be published.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onReject} className="bg-red-600 hover:bg-red-700">
                      Reject Memory
                    </AlertDialogAction>
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
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
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

// Component for managing all photos
function PhotoManagementCard({ 
  photo, 
  onEdit,
  onDelete 
}: { 
  photo: Photo; 
  onEdit: (updates: Partial<Photo>) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editData, setEditData] = useState({
    author: photo.author,
    description: photo.description,
    year: photo.year
  });

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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Upload new image to Firebase Storage
      const newImageUrl = await photoService.uploadPhotoFile(file, photo.id!);
      
      // Update editData with new image URL
      setEditData(prev => ({ ...prev, imageUrl: newImageUrl }));
      
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex gap-6 p-6">
        <div className="flex-shrink-0 relative group w-48">
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
        
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <Badge variant={photo.isApproved ? "default" : "secondary"}>
                {photo.isApproved ? "Approved" : "Pending"}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {photo.views} views • {photo.likes} likes
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
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Memory</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure that you want to delete this memory? This action cannot be undone and will permanently remove the photo and all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
                      Delete Memory
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">Author</label>
                <Input
                  value={editData.author}
                  onChange={(e) => setEditData(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="Author"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Year</label>
                <Input
                  value={editData.year}
                  onChange={(e) => setEditData(prev => ({ ...prev, year: e.target.value }))}
                  placeholder="Year"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Description</label>
                <Textarea
                  value={editData.description}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description"
                  rows={2}
                />
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
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}