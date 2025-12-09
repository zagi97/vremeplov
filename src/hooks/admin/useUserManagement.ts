// src/hooks/admin/useUserManagement.ts
import { useState, useCallback, useMemo, useEffect } from 'react';
import { userService, UserProfileExtended } from '@/services/user';
import { sendNotification } from '@/services/notificationService';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';
import { ITEMS_PER_PAGE } from '@/constants';
import { useLanguage } from '@/contexts/LanguageContext';
import { translateWithParams } from '@/contexts/LanguageContext';

export function useUserManagement() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserProfileExtended[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination and filtering
  const [userPage, setUserPage] = useState(1);
  const [userFilter, setUserFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [userSort, setUserSort] = useState('newest');

  const USERS_PER_PAGE = ITEMS_PER_PAGE.ADMIN_PHOTOS;

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const allUsers = await userService.getAllUsersForAdmin();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error(t('admin.usersLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleSuspendUser = useCallback(async (userId: string, days: number, reason: string) => {
    try {
      await userService.suspendUser(userId, days, reason, auth.currentUser!.uid);

      await sendNotification({
        userId: userId,
        type: 'user_suspended',
        reason: reason,
        suspendedUntil: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
      });

      toast.success(translateWithParams(t, 'admin.userSuspended', { days }));
      await loadUsers();
    } catch (error) {
      toast.error(t('admin.userSuspendFailed'));
    }
  }, [loadUsers, t]);

  const handleBanUser = useCallback(async (userId: string, reason: string) => {
    try {
      await userService.banUser(userId, reason, auth.currentUser!.uid);

      await sendNotification({
        userId: userId,
        type: 'user_banned',
        reason: reason
      });

      toast.success(t('admin.userBanned'));
      await loadUsers();
    } catch (error) {
      toast.error(t('admin.userBanFailed'));
    }
  }, [loadUsers, t]);

  const handleUnsuspendUser = useCallback(async (userId: string) => {
    try {
      await userService.unsuspendUser(userId);

      await sendNotification({
        userId: userId,
        type: 'user_unsuspended'
      });

      toast.success(t('admin.userUnsuspended'));
      await loadUsers();
    } catch (error) {
      toast.error(t('admin.userUnsuspendFailed'));
    }
  }, [loadUsers, t]);

  const handleUnbanUser = useCallback(async (userId: string) => {
    try {
      await userService.unbanUser(userId);

      await sendNotification({
        userId: userId,
        type: 'user_unbanned'
      });

      toast.success(t('admin.userUnbanned'));
      await loadUsers();
    } catch (error) {
      toast.error(t('admin.userUnbanFailed'));
    }
  }, [loadUsers, t]);

  const handleDeleteUser = useCallback(async (userId: string) => {
    try {
      await userService.deleteUserAccount(userId);
      toast.success(t('admin.userDeleted'));
      await loadUsers();
    } catch (error) {
      toast.error(t('admin.userDeleteFailed'));
    }
  }, [loadUsers, t]);

  // Filter and sort users
  const filteredUsers = useMemo(() => {
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

    // ✅ DODAJTE OVO: Pozovite loadUsers samo jednom nakon montiranja hooka
    useEffect(() => {
      loadUsers();
    }, [loadUsers]);

  return {
    // State
    users,
    loading,
    userPage,
    userFilter,
    userSearch,
    userSort,
    filteredUsers,
    paginatedUsers,
    totalUserPages,
    USERS_PER_PAGE,

    // Setters
    setUserPage,
    setUserFilter,
    setUserSearch,
    setUserSort,

    // Actions
    loadUsers,
    handleSuspendUser,
    handleBanUser,
    handleUnsuspendUser,
    handleUnbanUser,
    handleDeleteUser,
  };
}
