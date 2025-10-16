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
import { Check, X, Edit, Eye, MessageSquare, Users, BarChart3, Expand, Upload, Image, Trash2, LogOut, Tag, User, ExternalLink, Flag, MapPin } from 'lucide-react';
import LazyImage from '../components/LazyImage';
import { useLanguage } from "../contexts/LanguageContext";
import { sendNotification } from '../services/notificationService';
import { Pagination } from '../components/ui/pagination';
import { FilterBar } from '../components/ui/filter-bar';
import { userService, UserProfileExtended } from '../services/userService';
import { auth } from '../lib/firebase';

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
const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
const [deleteReason, setDeleteReason] = useState({ 
  reported: false,
  duplicate: false,
  inappropriate: false,
  outdated: false,
  copyrightViolation: false,
  custom: ''
});
const [comments, setComments] = useState<Comment[]>([]);
const [loadingComments, setLoadingComments] = useState(false);
// Comment moderation state
const [commentPage, setCommentPage] = useState(1);
const [commentFilter, setCommentFilter] = useState('all');
const [commentSearch, setCommentSearch] = useState('');
const [commentSort, setCommentSort] = useState('newest');

// User management state
const [users, setUsers] = useState<UserProfileExtended[]>([]);
const [loadingUsers, setLoadingUsers] = useState(false);
const [userPage, setUserPage] = useState(1);
const [userFilter, setUserFilter] = useState('all'); // all, active, suspended, banned
const [userSearch, setUserSearch] = useState('');
const [userSort, setUserSort] = useState('newest'); // newest, oldest, most-photos

// Photo moderation state
const [pendingPhotoPage, setPendingPhotoPage] = useState(1);
const [approvedPhotoPage, setApprovedPhotoPage] = useState(1);
const [tagPage, setTagPage] = useState(1);
const COMMENTS_PER_PAGE = 10;
const USERS_PER_PAGE = 10;
const PHOTOS_PER_PAGE = 10;
const TAGS_PER_PAGE = 10;
   const { t } = useLanguage();

  useEffect(() => {
    if (!isAdmin) return;
    loadAdminData();
    loadComments();
    loadUsers();
  }, [isAdmin]);


  // Auto-exit admin mode when leaving dashboard
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (user?.email === 'vremeplov.app@gmail.com') {
        await exitAdminMode();
      }
    };


    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, exitAdminMode]);

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
       toast.error(t('errors.adminDataLoadFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Load all comments for moderation
const loadComments = async () => {
  try {
    setLoadingComments(true);
    const allComments = await photoService.getAllCommentsForAdmin();
    setComments(allComments);
    console.log('✅ Loaded comments:', allComments.length);
  } catch (error) {
    console.error('Error loading comments:', error);
    toast.error('Failed to load comments');
  } finally {
    setLoadingComments(false);
  }
};
// Load all users for admin
const loadUsers = async () => {
  try {
    setLoadingUsers(true);
    const allUsers = await userService.getAllUsersForAdmin();
    setUsers(allUsers);
    console.log('✅ Loaded users:', allUsers.length);
  } catch (error) {
    console.error('Error loading users:', error);
    toast.error('Failed to load users');
  } finally {
    setLoadingUsers(false);
  }
};

 const handleApprovePhoto = async (photoId: string) => {
  try {
    // 1. Prvo dohvati podatke o fotografiji
    const photo = await photoService.getPhotoById(photoId);
    if (!photo) {
      toast.error('Photo not found');
      return;
    }

    // 2. Odobri fotografiju
    await photoService.updatePhoto(photoId, { isApproved: true });

    // 3. ✅ TEK SADA kreiraj aktivnost
    if (photo.authorId) {
      const { userService } = await import('../services/userService');
      
      await userService.addUserActivity(
        photo.authorId,
        'photo_upload',
        photoId,
        {
          photoTitle: photo.description,
          location: photo.location,
          targetId: photoId
        }
      );
    }

    // 4. ✅ DODAJ OVO - Pošalji email notifikaciju
    if (photo.authorId) {
      await sendNotification({
        userId: photo.authorId,
        type: 'photo_approved',
        photoId: photoId
      });
    }

    toast.success(t('admin.photoApproved'));
    loadAdminData();
  } catch (error) {
    console.error('Error approving photo:', error);
    toast.error(t('errors.photoApprovalFailed'));
  }
};

  const handleRejectPhoto = async (photoId: string, reason: string) => {
  try {
    console.log('Rejecting (deleting) photo with ID:', photoId);
    
    // 1. Dohvati photo podatke PRIJE brisanja
    const photo = await photoService.getPhotoById(photoId);
    if (!photo) {
      toast.error('Photo not found');
      return;
    }
    
    // 2. Pošalji email notifikaciju PRIJE brisanja
    if (photo.authorId && reason) {
      await sendNotification({
        userId: photo.authorId,
        type: 'photo_rejected',
        photoId: photoId,
        reason: reason
      });
    }
    
    // 3. Obriši fotografiju
    await photoService.deletePhoto(photoId);
    
    const currentCount = parseInt(localStorage.getItem('rejectedPhotosCount') || '0', 10);
    localStorage.setItem('rejectedPhotosCount', (currentCount + 1).toString());
    
    console.log('Photo deleted successfully, updating UI...');
    toast.success(t('admin.photoRejected'));
    loadAdminData();
  } catch (error) {
    console.error('Error deleting photo:', error);
    toast.error(t('errors.photoDeleteFailed'));
  }
};

  const handleEditPhoto = async (photoId: string, updates: Partial<Photo>) => {
  try {
    // 1. Dohvati original photo podatke
    const originalPhoto = await photoService.getPhotoById(photoId);
    if (!originalPhoto) {
      toast.error('Photo not found');
      return;
    }
    
    // 2. Update photo
    await photoService.updatePhoto(photoId, updates);
    
    // 3. Kreiraj string s promjenama
    const changes: string[] = [];
    if (updates.author && updates.author !== originalPhoto.author) {
      changes.push(`Autor: "${originalPhoto.author}" → "${updates.author}"`);
    }
    if (updates.description && updates.description !== originalPhoto.description) {
      changes.push(`Opis: "${originalPhoto.description}" → "${updates.description}"`);
    }
    if (updates.year && updates.year !== originalPhoto.year) {
      changes.push(`Godina: "${originalPhoto.year}" → "${updates.year}"`);
    }
    
    // 4. Pošalji email notifikaciju SAMO ako je approved I ima promjena
    if (originalPhoto.isApproved && originalPhoto.authorId && changes.length > 0) {
      await sendNotification({
        userId: originalPhoto.authorId,
        type: 'photo_edited',
        photoId: photoId,
        photoTitle: originalPhoto.description,
        changes: changes.join('; ')
      });
    }
    
    toast.success(t('admin.photoUpdated'));
    loadAdminData();
  } catch (error) {
    console.error('Error updating photo:', error);
    toast.error(t('errors.photoUpdateFailed'));
  }
};

  const handleDeletePhoto = async (photoId: string, reason: string) => {
  try {
    // 1. Dohvati photo podatke PRIJE brisanja
    const photo = await photoService.getPhotoById(photoId);
    if (!photo) {
      toast.error('Photo not found');
      return;
    }
    
    // 2. Pošalji email notifikaciju PRIJE brisanja
    if (photo.authorId && reason) {
      await sendNotification({
        userId: photo.authorId,
        type: 'photo_deleted',
        photoId: photoId,
        photoTitle: photo.description,
        reason: reason
      });
    }
    
    // 3. Obriši fotografiju
    await photoService.deletePhoto(photoId);
    
    toast.success(t('admin.photoDeleted'));
    loadAdminData();
  } catch (error) {
    console.error('Error deleting photo:', error);
    toast.error(t('errors.photoDeleteFailed'));
  }
};

  // Tag moderation handlers
  const handleApproveTag = async (tagId: string) => {
  try {
    // 1. Prvo dohvati tag podatke iz pendingTags state-a
    const tag = pendingTags.find(t => t.id === tagId);
    
    if (!tag) {
      toast.error('Tag not found');
      return;
    }

    // 2. Dohvati photo podatke za context
    const photo = await photoService.getPhotoById(tag.photoId);
    
    // 3. Odobri tag
    await photoService.approveTaggedPerson(tagId, user!.uid);
    
    // 4. ✅ Pošalji email notifikaciju
    if (tag.addedByUid) {
      await sendNotification({
        userId: tag.addedByUid,
        type: 'tag_approved',
        photoId: tag.photoId,
        taggedPersonName: tag.name
      });
    }
    
    toast.success(t('admin.tagApproved'));
    loadAdminData();
  } catch (error) {
    console.error('Error approving tag:', error);
    toast.error(t('errors.photoTagApprovalFailed'));
  }
};

  const handleRejectTag = async (tagId: string) => {
    try {
      // 1. Dohvati tag podatke
    const tag = pendingTags.find(t => t.id === tagId);
    
    if (!tag) {
      toast.error('Tag not found');
      return;
    }
    
    // 2. Pošalji email notifikaciju PRIJE brisanja
    if (tag.addedByUid) {
      await sendNotification({
        userId: tag.addedByUid,
        type: 'tag_rejected',
        photoId: tag.photoId,
        taggedPersonName: tag.name,
        reason: 'Tag je odbijen jer ne zadovoljava kriterije kvalitete.' // Default razlog
      });
    }
    
    // 3. Obriši tag
    await photoService.rejectTaggedPerson(tagId);
      toast.success(t('admin.tagRejected'));
      loadAdminData();
    } catch (error) {
      console.error('Error rejecting tag:', error);
      toast.error(t('errors.photoTagRejectionFailed'));
    }
  };

  const handleEditTag = async (tagId: string, updates: Partial<TaggedPerson>) => {
    try {
      await photoService.updateTaggedPerson(tagId, updates);
      toast.success(t('admin.tagUpdated'));
      loadAdminData();
    } catch (error) {
      console.error('Error updating tag:', error);
      toast.error(t('errors.photoTagUpdateFailed'));
    }
  };

  const handleLogout = async () => {
    try {
      await exitAdminMode();
      navigate('/admin-login');
    } catch (error) {
      console.error('Error exiting admin mode:', error);
      
      toast.error(t('errors.adminModeExit'));
    }
  };

  // Filter and sort comments
  const filteredComments = React.useMemo(() => {
    let filtered = [...comments];
    
    // Filter by status
    if (commentFilter === 'flagged') {
      filtered = filtered.filter(c => c.isFlagged);
    } else if (commentFilter === 'recent') {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      filtered = filtered.filter(c => {
        const commentDate = c.createdAt?.toDate?.() || new Date(0);
        return commentDate >= dayAgo;
      });
    }
    
    // Search filter
    if (commentSearch) {
      const searchLower = commentSearch.toLowerCase();
      filtered = filtered.filter(c =>
        c.text.toLowerCase().includes(searchLower) ||
        c.userName?.toLowerCase().includes(searchLower) ||
        c.userEmail?.toLowerCase().includes(searchLower) ||
        c.photoTitle?.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.()?.getTime() || 0;
      const dateB = b.createdAt?.toDate?.()?.getTime() || 0;
      return commentSort === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    return filtered;
  }, [comments, commentFilter, commentSearch, commentSort]);

  // Pagination
  const totalCommentPages = Math.ceil(filteredComments.length / COMMENTS_PER_PAGE);
  const paginatedComments = filteredComments.slice(
    (commentPage - 1) * COMMENTS_PER_PAGE,
    commentPage * COMMENTS_PER_PAGE
  );

  // Filter and sort users
const filteredUsers = React.useMemo(() => {
  let filtered = [...users];
  
  // Filter by status
  if (userFilter === 'active') {
    filtered = filtered.filter(u => !u.status || u.status === 'active');
  } else if (userFilter === 'suspended') {
    filtered = filtered.filter(u => u.status === 'suspended');
  } else if (userFilter === 'banned') {
    filtered = filtered.filter(u => u.status === 'banned');
  }
  
  // Search filter
  if (userSearch) {
    const searchLower = userSearch.toLowerCase();
    filtered = filtered.filter(u =>
      u.displayName?.toLowerCase().includes(searchLower) ||
      u.email?.toLowerCase().includes(searchLower) ||
      u.location?.toLowerCase().includes(searchLower)
    );
  }
  
  // Sort
  filtered.sort((a, b) => {
    if (userSort === 'newest') {
      const dateA = a.joinedAt?.toDate?.()?.getTime() || 0;
      const dateB = b.joinedAt?.toDate?.()?.getTime() || 0;
      return dateB - dateA;
    } else if (userSort === 'oldest') {
      const dateA = a.joinedAt?.toDate?.()?.getTime() || 0;
      const dateB = b.joinedAt?.toDate?.()?.getTime() || 0;
      return dateA - dateB;
    } else if (userSort === 'most-photos') {
      return (b.stats?.totalPhotos || 0) - (a.stats?.totalPhotos || 0);
    }
    return 0;
  });
  
  return filtered;
}, [users, userFilter, userSearch, userSort]);

// User pagination
const totalUserPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
const paginatedUsers = filteredUsers.slice(
  (userPage - 1) * USERS_PER_PAGE,
  userPage * USERS_PER_PAGE
);

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
  <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
    <div className="container mx-auto py-8">
<div className="mb-8">
  <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8 border-t-4 border-blue-500">
    {/* ✅ Stack vertikalno na mobitel, horizontalno na desktop */}
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 text-sm md:text-base mt-2">
          Manage photos, tags, users, and content moderation
        </p>
      </div>
      
      {/* ✅ User info i logout na mobitel stack-aju */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
        <span className="text-xs md:text-sm text-gray-600 truncate max-w-[200px] sm:max-w-none">
          Welcome, {user?.email}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="flex items-center gap-2 border-blue-300 hover:bg-blue-50 transition-colors w-full sm:w-auto"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  </div>
</div>

        {/* Stats Cards */}
        {/* Stats Cards */}
<div className="grid gap-6 mb-8 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
  {[
    {
      title: "Total Photos",
      value: stats.totalPhotos,
      colors: "from-blue-500 to-purple-600",
      border: "border-blue-200",
      icon: <Eye className="h-5 w-5 text-white" />,
      textGradient: "from-blue-600 to-purple-600",
    },
    {
      title: "Pending Photos",
      value: stats.pendingPhotos,
      colors: "from-orange-400 to-red-500",
      border: "border-orange-200",
      icon: <BarChart3 className="h-5 w-5 text-white" />,
      textGradient: "text-orange-600",
    },
    {
      title: "Approved",
      value: stats.approvedPhotos,
      colors: "from-green-400 to-emerald-600",
      border: "border-green-200",
      icon: <Check className="h-5 w-5 text-white" />,
      textGradient: "text-green-600",
    },
    {
      title: "Rejected",
      value: stats.rejectedPhotos,
      colors: "from-red-400 to-rose-600",
      border: "border-red-200",
      icon: <X className="h-5 w-5 text-white" />,
      textGradient: "text-red-600",
    },
    {
      title: "Pending Tags",
      value: stats.pendingTags,
      colors: "from-purple-400 to-pink-500",
      border: "border-purple-200",
      icon: <Tag className="h-5 w-5 text-white" />,
      textGradient: "text-purple-600",
    },
    {
      title: "Total Tags",
      value: stats.totalTags,
      colors: "from-indigo-400 to-blue-600",
      border: "border-indigo-200",
      icon: <Users className="h-5 w-5 text-white" />,
      textGradient: "from-indigo-600 to-blue-600",
    },
    {
      title: "Total Views",
      value: stats.totalViews,
      colors: "from-cyan-400 to-blue-600",
      border: "border-cyan-200",
      icon: <Eye className="h-5 w-5 text-white" />,
      textGradient: "from-cyan-600 to-blue-600",
    },
    {
      title: "Total Likes",
      value: stats.totalLikes,
      colors: "from-pink-400 to-rose-500",
      border: "border-pink-200",
      icon: <MessageSquare className="h-5 w-5 text-white" />,
      textGradient: "from-pink-600 to-rose-600",
    },
  ].map((item, idx) => (
    <Card
      key={idx}
      className={`${item.border} hover:shadow-lg transition-all duration-300 hover:scale-[1.03]`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-700">
          {item.title}
        </CardTitle>
        <div
          className={`h-10 w-10 rounded-full bg-gradient-to-br ${item.colors} flex items-center justify-center shadow-md`}
        >
          {item.icon}
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={`text-3xl font-bold ${
            item.textGradient.startsWith("text-")
              ? item.textGradient
              : `bg-gradient-to-r ${item.textGradient} bg-clip-text text-transparent`
          }`}
        >
          {item.value}
        </div>
      </CardContent>
    </Card>
  ))}
</div>


        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* ✅ Scrollable tabs na mobitel */}
  <div className="-mx-4 px-4 md:mx-0 md:px-0">
  <TabsList className="flex flex-wrap justify-start gap-2 md:grid md:grid-cols-5 md:gap-0 mb-12">

      <TabsTrigger 
        value="pending"
        className="whitespace-nowrap data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
      >
        <span className="hidden sm:inline">Pending Photos</span>
        <span className="sm:hidden">Pending</span>
        <span className="ml-1">({stats.pendingPhotos})</span>
      </TabsTrigger>
      <TabsTrigger 
        value="approved"
        className="whitespace-nowrap data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
      >
        <span className="hidden sm:inline">Approved Photos</span>
        <span className="sm:hidden">Approved</span>
        <span className="ml-1">({stats.approvedPhotos})</span>
      </TabsTrigger>
      <TabsTrigger 
        value="tags"
        className="whitespace-nowrap data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
      >
        <span className="hidden sm:inline">Person Tags</span>
        <span className="sm:hidden">Tags</span>
        <span className="ml-1">({stats.pendingTags})</span>
      </TabsTrigger>
      <TabsTrigger 
        value="comments"
        className="whitespace-nowrap data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
      >
        Comments
      </TabsTrigger>
      <TabsTrigger 
        value="users"
        className="whitespace-nowrap data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
      >
        Users
      </TabsTrigger>
    </TabsList>
  </div>

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
              <>
              <div className="grid gap-6">
                {pendingPhotos
          .slice((pendingPhotoPage - 1) * PHOTOS_PER_PAGE, pendingPhotoPage * PHOTOS_PER_PAGE)
          .map((photo) => (
            <PhotoModerationCard
              key={photo.id}
              photo={photo}
              onApprove={() => handleApprovePhoto(photo.id!)}
              onReject={(reason) => handleRejectPhoto(photo.id!, reason)}
              onEdit={(updates) => handleEditPhoto(photo.id!, updates)}
            />
          ))}
              </div>
              {/* ✅ NOVO: Pagination */}
      <Pagination
        currentPage={pendingPhotoPage}
        totalPages={Math.ceil(pendingPhotos.length / PHOTOS_PER_PAGE)}
        onPageChange={setPendingPhotoPage}
        totalItems={pendingPhotos.length}
        itemsPerPage={PHOTOS_PER_PAGE}
        itemName="pending photos"
      />
      </>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-6">
  <div className="flex items-center justify-between">
    <h2 className="text-xl font-semibold">Approved Photos</h2>
    <Badge variant="secondary">{approvedPhotos.length} approved</Badge>
  </div>
  
  {approvedPhotos.length === 0 ? (
    <Card>
      <CardContent className="flex items-center justify-center py-12">
        <div className="text-center">
          <Check className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium">No approved photos yet</h3>
          <p className="text-muted-foreground">Approved photos will appear here.</p>
        </div>
      </CardContent>
    </Card>
  ) : (
    <>
      <div className="grid gap-6">
        {approvedPhotos
          .slice(
            (approvedPhotoPage - 1) * PHOTOS_PER_PAGE,
            approvedPhotoPage * PHOTOS_PER_PAGE
          )
          .map((photo) => (
            <PhotoManagementCard
              key={photo.id}
              photo={photo}
              onEdit={(updates) => handleEditPhoto(photo.id!, updates)}
              onDelete={(reason) => handleDeletePhoto(photo.id!, reason)}
            />
          ))}
      </div>
      
      {/* Pagination */}
      <Pagination
        currentPage={approvedPhotoPage}
        totalPages={Math.ceil(approvedPhotos.length / PHOTOS_PER_PAGE)}
        onPageChange={setApprovedPhotoPage}
        totalItems={approvedPhotos.length}
        itemsPerPage={PHOTOS_PER_PAGE}
        itemName="approved photos"
      />
    </>
  )}
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
    <>
      <div className="grid gap-6">
        {pendingTags
          .slice((tagPage - 1) * TAGS_PER_PAGE, tagPage * TAGS_PER_PAGE)
          .map((tag) => (
            <TagModerationCard
              key={tag.id}
              tag={tag}
              onApprove={() => handleApproveTag(tag.id!)}
              onReject={() => handleRejectTag(tag.id!)}
              onEdit={(updates) => handleEditTag(tag.id!, updates)}
            />
          ))}
      </div>
      
      {/* Pagination */}
      <Pagination
        currentPage={tagPage}
        totalPages={Math.ceil(pendingTags.length / TAGS_PER_PAGE)}
        onPageChange={setTagPage}
        totalItems={pendingTags.length}
        itemsPerPage={TAGS_PER_PAGE}
        itemName="pending tags"
      />
    </>
  )}
</TabsContent>
<TabsContent value="comments" className="space-y-6">
  <div className="flex items-center justify-between">
    <h2 className="text-xl font-semibold">💬 Comment Moderation</h2>
    <Badge variant="secondary">{comments.length} total comments</Badge>
  </div>
  
  {/* Filter Bar */}
  <FilterBar
    searchValue={commentSearch}
    onSearchChange={(value) => {
      setCommentSearch(value);
      setCommentPage(1);
    }}
    searchPlaceholder="🔍 Search comments, users, photos..."
    
    filterValue={commentFilter}
    onFilterChange={(value) => {
      setCommentFilter(value);
      setCommentPage(1);
    }}
    filterOptions={[
      { value: 'all', label: 'All Comments' },
      { value: 'flagged', label: 'Flagged Only', icon: '⚠️' },
      { value: 'recent', label: 'Last 24h', icon: '🕐' }
    ]}
    
    sortValue={commentSort}
    onSortChange={setCommentSort}
    sortOptions={[
      { value: 'newest', label: 'Newest First' },
      { value: 'oldest', label: 'Oldest First' }
    ]}
  />
  
  {loadingComments ? (
    <Card>
      <CardContent className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading comments...</p>
        </div>
      </CardContent>
    </Card>
  ) : filteredComments.length === 0 ? (
    <Card>
      <CardContent className="flex items-center justify-center py-12">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {commentSearch ? 'No comments match your search' : 'No comments found'}
          </p>
        </div>
      </CardContent>
    </Card>
  ) : (
    <>
      <div className="grid gap-6">
        {paginatedComments.map((comment) => (
          <Card key={comment.id} className={`overflow-hidden transition-colors ${comment.isFlagged ? 'border-red-300 bg-red-50' : ''}`}>
            <CardContent className="p-6">
              {/* ... existing comment card content ... */}
              {/* (copy from previous version - header, text, actions) */}
              
              {/* Comment Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 mb-3 break-words">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="font-medium">{comment.userName}</span>
                    <span className="text-gray-400 text-sm">•</span>
                    <span className="text-gray-500 text-sm break-words">{comment.userEmail}</span>
                    {comment.isFlagged && (
                      <Badge variant="destructive" className="ml-2">⚠️ Flagged</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                    <Image className="h-4 w-4 flex-shrink-0" />
                    <span>Photo: {comment.photoTitle}</span>
                    {comment.photoLocation && (
                      <>
                        <span>•</span>
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span>{comment.photoLocation}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <span className="text-muted-foreground text-sm whitespace-nowrap flex-shrink-0">
                  {comment.createdAt?.toDate?.()?.toLocaleDateString('hr-HR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  }) || 'Unknown'}
                </span>
              </div>

              {/* Comment Text */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                <p className="text-gray-800 leading-relaxed break-words">{comment.text}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`/photo/${comment.photoId}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View Photo
                </Button>
                
                {!comment.isFlagged ? (
  <Button
    size="sm"
    variant="outline"
    onClick={async () => {
      try {
        await photoService.flagComment(comment.id!);
        toast.success('Comment flagged for review');
        loadComments();
      } catch (error) {
        toast.error('Failed to flag comment');
      }
    }}
  >
    <Flag className="h-4 w-4 mr-1" />
    Flag
  </Button>
) : (
  <Button
    size="sm"
    variant="secondary"
    onClick={async () => {
      try {
        await photoService.unflagComment(comment.id!);
        toast.success('Comment unflagged');
        loadComments();
      } catch (error) {
        toast.error('Failed to unflag comment');
      }
    }}
  >
    <Flag className="h-4 w-4 mr-1" />
    Unflag
  </Button>
)}

                
                <AlertDialog>
  <AlertDialogTrigger asChild>
    <Button size="sm" variant="destructive">
      <Trash2 className="h-4 w-4 mr-1" />
      Delete
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Comment</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to delete this comment? The user will receive an email notification explaining that their comment was removed.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        onClick={async () => {
          try {
            // 1. Send email notification BEFORE deleting
            if (comment.userId) {
              await sendNotification({
                userId: comment.userId,
                type: 'comment_deleted',
                photoId: comment.photoId,
                photoTitle: comment.photoTitle
              });
            }
            
            // 2. Delete comment
            await photoService.deleteComment(comment.id!);
            
            toast.success('Comment deleted and user notified');
            loadComments();
          } catch (error) {
            console.error('Error deleting comment:', error);
            toast.error('Failed to delete comment');
          }
        }}
        className="bg-red-600 hover:bg-red-700"
      >
        Delete Comment
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Pagination */}
      <Pagination
        currentPage={commentPage}
        totalPages={totalCommentPages}
        onPageChange={setCommentPage}
        totalItems={filteredComments.length}
        itemsPerPage={COMMENTS_PER_PAGE}
        itemName="comments"
      />
    </>
  )}
</TabsContent>

          <TabsContent value="users" className="space-y-6">
  <div className="flex items-center justify-between">
    <h2 className="text-xl font-semibold">👥 User Management</h2>
    <Badge variant="secondary">{users.length} total users</Badge>
  </div>
  
  {/* Filter Bar */}
  <FilterBar
    searchValue={userSearch}
    onSearchChange={(value) => {
      setUserSearch(value);
      setUserPage(1);
    }}
    searchPlaceholder="🔍 Search users by name, email, location..."
    
    filterValue={userFilter}
    onFilterChange={(value) => {
      setUserFilter(value);
      setUserPage(1);
    }}
    filterOptions={[
      { value: 'all', label: 'All Users' },
      { value: 'active', label: 'Active', icon: '✅' },
      { value: 'suspended', label: 'Suspended', icon: '⏸️' },
      { value: 'banned', label: 'Banned', icon: '🚫' }
    ]}
    
    sortValue={userSort}
    onSortChange={setUserSort}
    sortOptions={[
      { value: 'newest', label: 'Newest First' },
      { value: 'oldest', label: 'Oldest First' },
      { value: 'most-photos', label: 'Most Photos' }
    ]}
  />
  
  {loadingUsers ? (
    <Card>
      <CardContent className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </CardContent>
    </Card>
  ) : filteredUsers.length === 0 ? (
    <Card>
      <CardContent className="flex items-center justify-center py-12">
        <div className="text-center">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {userSearch ? 'No users match your search' : 'No users found'}
          </p>
        </div>
      </CardContent>
    </Card>
  ) : (
    <>
      <div className="grid gap-6">
        {paginatedUsers.map((user) => (
          <UserManagementCard
            key={user.uid}
            user={user}
            onSuspend={async (days, reason) => {
              try {
                await userService.suspendUser(user.uid, days, reason, auth.currentUser!.uid);
                
                // Send email notification
                await sendNotification({
                  userId: user.uid,
                  type: 'user_suspended',
                  reason: reason,
                  suspendedUntil: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
                });
                
                toast.success(`User suspended for ${days} days`);
                loadUsers();
              } catch (error) {
                toast.error('Failed to suspend user');
              }
            }}
            onBan={async (reason) => {
              try {
                await userService.banUser(user.uid, reason, auth.currentUser!.uid);
                
                // Send email notification
                await sendNotification({
                  userId: user.uid,
                  type: 'user_banned',
                  reason: reason
                });
                
                toast.success('User banned permanently');
                loadUsers();
              } catch (error) {
                toast.error('Failed to ban user');
              }
            }}
            onUnsuspend={async () => {
              try {
                await userService.unsuspendUser(user.uid);
                
                // Send email notification
                await sendNotification({
                  userId: user.uid,
                  type: 'user_unsuspended'
                });
                
                toast.success('User unsuspended');
                loadUsers();
              } catch (error) {
                toast.error('Failed to unsuspend user');
              }
            }}
            onUnban={async () => {
              try {
                await userService.unbanUser(user.uid);
                
                // Send email notification
                await sendNotification({
                  userId: user.uid,
                  type: 'user_unbanned'
                });
                
                toast.success('User unbanned');
                loadUsers();
              } catch (error) {
                toast.error('Failed to unban user');
              }
            }}
            onDelete={async () => {
              try {
                await userService.deleteUserAccount(user.uid);
                toast.success('User account deleted permanently');
                loadUsers();
              } catch (error) {
                toast.error('Failed to delete user account');
              }
            }}
          />
        ))}
      </div>
      
      {/* Pagination */}
      <Pagination
        currentPage={userPage}
        totalPages={totalUserPages}
        onPageChange={setUserPage}
        totalItems={filteredUsers.length}
        itemsPerPage={USERS_PER_PAGE}
        itemName="users"
      />
    </>
  )}
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
// Component for moderating pending photos
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
      const value = e.target.value.slice(0, 250);
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
      // ✅ Ograniči na 250 karaktera
      const value = e.target.value.slice(0, 250);
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

// Component for managing all photos
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
  const [uploading, setUploading] = useState(false);
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Upload new image to Firebase Storage
      const newImageUrl = await photoService.uploadPhotoFile(file, photo.id!);
      
      // Update editData with new image URL
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
              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
  <AlertDialogTrigger asChild>
    <Button
      size="sm"
      variant="outline"
      className="text-red-600 border-red-600 hover:bg-red-50"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent className="max-w-xl">
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
          <span className="text-sm">Prijavljeno od drugih korisnika</span>
        </label>
        
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={deleteReason.duplicate}
            onChange={(e) => setDeleteReason(prev => ({ ...prev, duplicate: e.target.checked }))}
            className="w-4 h-4 text-red-600 rounded"
          />
          <span className="text-sm">Duplikat postojeće fotografije</span>
        </label>
        
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={deleteReason.inappropriate}
            onChange={(e) => setDeleteReason(prev => ({ ...prev, inappropriate: e.target.checked }))}
            className="w-4 h-4 text-red-600 rounded"
          />
          <span className="text-sm">Neprimjeren sadržaj</span>
        </label>
        
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={deleteReason.outdated}
            onChange={(e) => setDeleteReason(prev => ({ ...prev, outdated: e.target.checked }))}
            className="w-4 h-4 text-red-600 rounded"
          />
          <span className="text-sm">Zastarjele/netočne informacije</span>
        </label>
        
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={deleteReason.copyrightViolation}
            onChange={(e) => setDeleteReason(prev => ({ ...prev, copyrightViolation: e.target.checked }))}
            className="w-4 h-4 text-red-600 rounded"
          />
          <span className="text-sm">Kršenje autorskih prava</span>
        </label>
      </div>
      
      <div>
        <label className="text-sm font-medium block mb-2">Ostalo (ručni unos):</label>
        <Textarea
          value={deleteReason.custom}
          onChange={(e) => {
            const value = e.target.value.slice(0, 250);
            setDeleteReason(prev => ({ ...prev, custom: value }));
          }}
          placeholder="Dodatni razlog brisanja..."
          rows={3}
          maxLength={250}
          className={`w-full ${deleteReason.custom.length >= 240 ? 'border-red-300 focus:border-red-500' : ''}`}
        />
        <p className={`text-sm mt-1 ${
          deleteReason.custom.length > 240 
            ? 'text-red-600 font-bold' 
            : 'text-muted-foreground'
        }`}>
          {deleteReason.custom.length}/250 znakova
        </p>
      </div>
      
      {!hasDeleteReason && (
        <p className="text-sm text-red-600">
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
                  onChange={(e) => {
      // ✅ Ograniči na 250 karaktera
      const value = e.target.value.slice(0, 250);
      setEditData(prev => ({ ...prev, description: value }));
    }}
                  placeholder="Description"
                  rows={2}
                  maxLength={250}
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

// Component for managing users
function UserManagementCard({ 
  user,
  onSuspend,
  onBan,
  onUnsuspend,
  onUnban,
  onDelete
}: { 
  user: UserProfileExtended;
  onSuspend: (days: number, reason: string) => void;
  onBan: (reason: string) => void;
  onUnsuspend: () => void;
  onUnban: () => void;
  onDelete: () => void;
}) {
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [suspendDays, setSuspendDays] = useState(7);
  const [suspendReason, setSuspendReason] = useState('');
  const [banReason, setBanReason] = useState('');

  const getStatusBadge = () => {
    if (user.status === 'banned') {
      return <Badge variant="destructive">🚫 Banned</Badge>;
    }
    if (user.status === 'suspended') {
      const suspendUntil = user.suspendedUntil?.toDate();
      const daysLeft = suspendUntil ? Math.ceil((suspendUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
      return <Badge className="bg-orange-500">⏸️ Suspended ({daysLeft}d left)</Badge>;
    }
    return <Badge className="bg-green-500">✅ Active</Badge>;
  };

  const joinDate = user.joinedAt?.toDate?.()?.toLocaleDateString('hr-HR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }) || 'Unknown';

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        {/* User Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* User Avatar */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {user.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
            
            {/* User Info */}
            <div>
              <h3 className="font-semibold text-lg">{user.displayName || 'Unknown User'}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge()}
                <span className="text-xs text-muted-foreground">Joined: {joinDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{user.stats?.totalPhotos || 0}</div>
            <div className="text-xs text-muted-foreground">Photos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{user.stats?.totalLikes || 0}</div>
            <div className="text-xs text-muted-foreground">Likes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{user.stats?.totalViews || 0}</div>
            <div className="text-xs text-muted-foreground">Views</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{user.stats?.locationsContributed || 0}</div>
            <div className="text-xs text-muted-foreground">Locations</div>
          </div>
        </div>

        {/* Suspension/Ban Info */}
        {user.status === 'suspended' && user.suspendedUntil && (
          <div className="bg-orange-50 border-l-4 border-orange-500 p-3 mb-4 rounded">
            <p className="text-sm font-medium text-orange-800">Suspended until: {user.suspendedUntil.toDate().toLocaleDateString('hr-HR')}</p>
            {user.suspendReason && (
              <p className="text-xs text-orange-600 mt-1">Reason: {user.suspendReason}</p>
            )}
          </div>
        )}

        {user.status === 'banned' && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded">
            <p className="text-sm font-medium text-red-800">Permanently Banned</p>
            {user.banReason && (
              <p className="text-xs text-red-600 mt-1">Reason: {user.banReason}</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 justify-end flex-wrap">
           {/* View Profile Button - ZAKOMENTIRANO */}
  {/* TODO: Implement admin-specific user detail view at /admin/users/{uid}
      For now, all necessary info is visible in the table. */}
          {/* View Activity Button */}
          {/* 
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(`/profile/${user.uid}`, '_blank')}
          >
            <Eye className="h-4 w-4 mr-1" />
            View Profile
          </Button>
          */}

          {/* Conditional Actions based on status */}
          {user.status === 'suspended' ? (
            <Button
              size="sm"
              variant="outline"
              className="text-green-600 border-green-600"
              onClick={onUnsuspend}
            >
              ✅ Unsuspend
            </Button>
          ) : user.status === 'banned' ? (
            <Button
              size="sm"
              variant="outline"
              className="text-green-600 border-green-600"
              onClick={onUnban}
            >
              ✅ Unban
            </Button>
          ) : (
            <>
              {/* Suspend Dropdown */}
              <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="text-orange-600 border-orange-600">
                    ⏸️ Suspend
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Suspend User</AlertDialogTitle>
                    <AlertDialogDescription>
                      Suspend this user temporarily. They won't be able to upload photos, comment, or tag during suspension.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-sm font-medium block mb-2">Suspension Duration:</label>
                      <select
                        value={suspendDays}
                        onChange={(e) => setSuspendDays(Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value={7}>7 days</option>
                        <option value={30}>30 days</option>
                        <option value={90}>90 days</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium block mb-2">Reason:</label>
                      <Textarea
                        value={suspendReason}
                        onChange={(e) => setSuspendReason(e.target.value.slice(0, 250))}
                        placeholder="Explain why this user is being suspended..."
                        rows={3}
                        maxLength={250}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        {suspendReason.length}/250 characters
                      </p>
                    </div>
                  </div>
                  
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button
                      onClick={() => {
                        if (suspendReason.trim()) {
                          onSuspend(suspendDays, suspendReason);
                          setShowSuspendDialog(false);
                          setSuspendReason('');
                        }
                      }}
                      disabled={!suspendReason.trim()}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Suspend User
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Ban Button */}
              <AlertDialog open={showBanDialog} onOpenChange={setShowBanDialog}>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="text-red-600 border-red-600">
                    🚫 Ban
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Ban User Permanently</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently ban the user from the platform. They will not be able to access their account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-sm font-medium block mb-2">Reason:</label>
                      <Textarea
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value.slice(0, 250))}
                        placeholder="Explain why this user is being banned..."
                        rows={3}
                        maxLength={250}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        {banReason.length}/250 characters
                      </p>
                    </div>
                  </div>
                  
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button
                      onClick={() => {
                        if (banReason.trim()) {
                          onBan(banReason);
                          setShowBanDialog(false);
                          setBanReason('');
                        }
                      }}
                      disabled={!banReason.trim()}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Ban User
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          {/* Delete Account Button */}
          {/* // ⚠️ NOTE: User deletion is NOT implemented yet.
          // For now, use BAN for permanent account restrictions.
          // DELETE functionality requires GDPR compliance and 
          // cascading deletion of all user data (photos, comments, tags, etc.) */}
          {/* <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive">
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete User Account</AlertDialogTitle>
                <AlertDialogDescription>
                  ⚠️ This will PERMANENTLY delete the user and ALL their data (photos, comments, tags, etc.). This action cannot be undone!
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete Permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog> */}
        </div>
      </CardContent>
    </Card>
  );
}