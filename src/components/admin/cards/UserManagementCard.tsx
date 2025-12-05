// src/components/admin/cards/UserManagementCard.tsx
import React, { useState } from 'react';
import { UserProfileExtended } from '@/services/user';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import { User, MapPin, Calendar, Image, Trash2 } from 'lucide-react';
import { TEXT_LIMITS } from '@/constants';

interface UserManagementCardProps {
  user: UserProfileExtended;
  onSuspend: (days: number, reason: string) => void;
  onBan: (reason: string) => void;
  onUnsuspend: () => void;
  onUnban: () => void;
  onDelete: () => void;
}

export default 
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
        <div className="flex items-start justify-between mb-4 gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {/* User Avatar */}
            <div className="w-16 h-16 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {user.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>

            {/* User Info */}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-lg break-words">{user.displayName || 'Unknown User'}</h3>
              <p className="text-sm text-muted-foreground break-words">{user.email}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
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
              <p className="text-xs text-orange-600 mt-1 break-words">Reason: {user.suspendReason}</p>
            )}
          </div>
        )}

        {user.status === 'banned' && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded">
            <p className="text-sm font-medium text-red-800">Permanently Banned</p>
            {user.banReason && (
              <p className="text-xs text-red-600 mt-1 break-words">Reason: {user.banReason}</p>
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
                        onChange={(e) => setSuspendReason(e.target.value.slice(0, TEXT_LIMITS.DESCRIPTION))}
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
                        onChange={(e) => setBanReason(e.target.value.slice(0, TEXT_LIMITS.DESCRIPTION))}
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
