// src/components/admin/tabs/UserManagementTab.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { FilterBar } from '@/components/ui/filter-bar';
import { Users } from 'lucide-react';
import UserManagementCard from '../cards/UserManagementCard';
import { useUserManagement } from '@/hooks/admin/useUserManagement';

export default function UserManagementTab() {
  const {
    loading,
    userPage,
    userFilter,
    userSearch,
    userSort,
    paginatedUsers,
    filteredUsers,
    totalUserPages,
    USERS_PER_PAGE,
    setUserPage,
    setUserFilter,
    setUserSearch,
    setUserSort,
    handleSuspendUser,
    handleBanUser,
    handleUnsuspendUser,
    handleUnbanUser,
    handleDeleteUser,
  } = useUserManagement();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">👥 User Management</h2>
        <Badge variant="secondary">{filteredUsers.length} total users</Badge>
      </div>

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
          { value: 'banned', label: 'Banned', icon: '🚫' },
        ]}
        sortValue={userSort}
        onSortChange={setUserSort}
        sortOptions={[
          { value: 'newest', label: 'Newest First' },
          { value: 'oldest', label: 'Oldest First' },
          { value: 'most-photos', label: 'Most Photos' },
        ]}
      />

      {paginatedUsers.length === 0 ? (
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
                onSuspend={(days, reason) => handleSuspendUser(user.uid, days, reason)}
                onBan={(reason) => handleBanUser(user.uid, reason)}
                onUnsuspend={() => handleUnsuspendUser(user.uid)}
                onUnban={() => handleUnbanUser(user.uid)}
                onDelete={() => handleDeleteUser(user.uid)}
              />
            ))}
          </div>

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
    </div>
  );
}
