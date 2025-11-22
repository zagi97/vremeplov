// src/pages/AdminDashboard.tsx - REFACTORED
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Check, X, Eye, BarChart3, Users, MessageSquare, Tag, LogOut } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// Import custom hooks
import { usePhotoModeration } from '@/hooks/admin/usePhotoModeration';
import { useTagModeration } from '@/hooks/admin/useTagModeration';
import { useCommentModeration } from '@/hooks/admin/useCommentModeration';
import { useUserManagement } from '@/hooks/admin/useUserManagement';

// Import tab components
import PendingPhotosTab from '@/components/admin/tabs/PendingPhotosTab';
import ApprovedPhotosTab from '@/components/admin/tabs/ApprovedPhotosTab';
import TagModerationTab from '@/components/admin/tabs/TagModerationTab';
import CommentModerationTab from '@/components/admin/tabs/CommentModerationTab';
import UserManagementTab from '@/components/admin/tabs/UserManagementTab';

export default function AdminDashboard() {
  const { user, isAdmin, exitAdminMode } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('pending');
  const [stats, setStats] = useState({
    totalPhotos: 0,
    pendingPhotos: 0,
    approvedPhotos: 0,
    rejectedPhotos: 0,
    totalViews: 0,
    totalLikes: 0,
    pendingTags: 0,
    totalTags: 0,
  });

  // Use hooks
  const photoMod = usePhotoModeration();
  const tagMod = useTagModeration();
  const commentMod = useCommentModeration();
  const userMod = useUserManagement();

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

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, exitAdminMode]);

  const loadAdminData = async () => {
    try {
      const [photos, tags] = await Promise.all([
        photoMod.loadPhotos(),
        tagMod.loadTags(),
      ]);

      // Load comments and users in parallel (don't wait for them to calculate stats)
      commentMod.loadComments();
      userMod.loadUsers();

      const rejectedCount = parseInt(
        localStorage.getItem('rejectedPhotosCount') || '0',
        10
      );

      setStats({
        totalPhotos: photos.length,
        pendingPhotos: photoMod.pendingPhotos.length,
        approvedPhotos: photoMod.approvedPhotos.length,
        rejectedPhotos: rejectedCount,
        totalViews: photos.reduce((sum, photo) => sum + photo.views, 0),
        totalLikes: photos.reduce((sum, photo) => sum + photo.likes, 0),
        pendingTags: tags.filter((t) => !t.isApproved).length,
        totalTags: tags.length,
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await exitAdminMode();
      navigate('/admin-login');
    } catch (error) {
      console.error('Error exiting admin mode:', error);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center text-destructive">
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => (window.location.href = '/admin-login')}
                className="w-full"
              >
                Go to Admin Login
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = '/')}
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

  if (photoMod.loading && tagMod.loading) {
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
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8 border-t-4 border-blue-500">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-gray-600 text-sm md:text-base mt-2">
                  Manage photos, tags, users, and content moderation
                </p>
              </div>

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
        <div className="grid gap-6 mb-8 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
          {[
            {
              title: 'Total Photos',
              value: stats.totalPhotos,
              colors: 'from-blue-500 to-purple-600',
              border: 'border-blue-200',
              icon: <Eye className="h-5 w-5 text-white" />,
              textGradient: 'from-blue-600 to-purple-600',
            },
            {
              title: 'Pending Photos',
              value: stats.pendingPhotos,
              colors: 'from-orange-400 to-red-500',
              border: 'border-orange-200',
              icon: <BarChart3 className="h-5 w-5 text-white" />,
              textGradient: 'text-orange-600',
            },
            {
              title: 'Approved',
              value: stats.approvedPhotos,
              colors: 'from-green-400 to-emerald-600',
              border: 'border-green-200',
              icon: <Check className="h-5 w-5 text-white" />,
              textGradient: 'text-green-600',
            },
            {
              title: 'Rejected',
              value: stats.rejectedPhotos,
              colors: 'from-red-400 to-rose-600',
              border: 'border-red-200',
              icon: <X className="h-5 w-5 text-white" />,
              textGradient: 'text-red-600',
            },
            {
              title: 'Pending Tags',
              value: stats.pendingTags,
              colors: 'from-purple-400 to-pink-500',
              border: 'border-purple-200',
              icon: <Tag className="h-5 w-5 text-white" />,
              textGradient: 'text-purple-600',
            },
            {
              title: 'Total Tags',
              value: stats.totalTags,
              colors: 'from-indigo-400 to-blue-600',
              border: 'border-indigo-200',
              icon: <Users className="h-5 w-5 text-white" />,
              textGradient: 'from-indigo-600 to-blue-600',
            },
            {
              title: 'Total Views',
              value: stats.totalViews,
              colors: 'from-cyan-400 to-blue-600',
              border: 'border-cyan-200',
              icon: <Eye className="h-5 w-5 text-white" />,
              textGradient: 'from-cyan-600 to-blue-600',
            },
            {
              title: 'Total Likes',
              value: stats.totalLikes,
              colors: 'from-pink-400 to-rose-500',
              border: 'border-pink-200',
              icon: <MessageSquare className="h-5 w-5 text-white" />,
              textGradient: 'from-pink-600 to-rose-600',
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
                    item.textGradient.startsWith('text-')
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
                <span className="hidden sm:inline">Tagged Persons</span>
                <span className="sm:hidden">Tags</span>
                <span className="ml-1">({stats.pendingTags})</span>
              </TabsTrigger>
              <TabsTrigger
                value="comments"
                className="whitespace-nowrap data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
              >
                <span className="hidden sm:inline">Comments</span>
                <span className="sm:hidden">Comments</span>
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="whitespace-nowrap data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
              >
                <span className="hidden sm:inline">User Management</span>
                <span className="sm:hidden">Users</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="pending" className="space-y-6">
            <PendingPhotosTab
              pendingPhotos={photoMod.pendingPhotos}
              loading={photoMod.loading}
              pendingPhotoPage={photoMod.pendingPhotoPage}
              setPendingPhotoPage={photoMod.setPendingPhotoPage}
              handleApprovePhoto={(photoId) =>
                photoMod.handleApprovePhoto(photoId, user?.uid || 'admin')
              }
              handleRejectPhoto={photoMod.handleRejectPhoto}
              handleEditPhoto={photoMod.handleEditPhoto}
            />
          </TabsContent>

          <TabsContent value="approved" className="space-y-6">
            <ApprovedPhotosTab
              approvedPhotos={photoMod.approvedPhotos}
              loading={photoMod.loading}
              approvedPhotoPage={photoMod.approvedPhotoPage}
              setApprovedPhotoPage={photoMod.setApprovedPhotoPage}
              handleEditPhoto={photoMod.handleEditPhoto}
              handleDeletePhoto={photoMod.handleDeletePhoto}
            />
          </TabsContent>

          <TabsContent value="tags" className="space-y-6">
            <TagModerationTab adminUid={user?.uid || 'admin'} />
          </TabsContent>

          <TabsContent value="comments" className="space-y-6">
            <CommentModerationTab />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagementTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
