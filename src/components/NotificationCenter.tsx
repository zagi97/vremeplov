// src/components/NotificationCenter.tsx - FINAL with Optimistic Updates
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  MessageCircle, 
  UserPlus, 
  Tag, 
  Award,
  CheckCheck,
  X,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Edit,
  Ban,
  ArrowRight,
  Bell
} from 'lucide-react';
import { Notification, notificationService } from '../services/notificationService';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

interface NotificationCenterProps {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  onClose: () => void;
  onMarkAllRead?: () => void; // ✅ NEW - callback for optimistic update
}

const NotificationCenter = ({ 
  notifications, 
  unreadCount, 
  loading,
  onClose,
  onMarkAllRead // ✅ NEW
}: NotificationCenterProps) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [markingAllRead, setMarkingAllRead] = useState(false);

  // Get icon and color for notification type
  const getNotificationIcon = (type: string) => {
    const iconMap: { [key: string]: { icon: any; color: string } } = {
      new_comment: { icon: MessageCircle, color: 'text-blue-600 bg-blue-50' },
      new_like: { icon: Heart, color: 'text-red-600 bg-red-50' },
      new_follower: { icon: UserPlus, color: 'text-green-600 bg-green-50' },
      new_tag: { icon: Tag, color: 'text-orange-600 bg-orange-50' },
      badge_earned: { icon: Award, color: 'text-yellow-600 bg-yellow-50' },
      photo_approved: { icon: CheckCheck, color: 'text-green-600 bg-green-50' },
      photo_rejected: { icon: X, color: 'text-red-600 bg-red-50' },
      photo_edited: { icon: Edit, color: 'text-blue-600 bg-blue-50' },
      photo_deleted: { icon: Trash2, color: 'text-gray-600 bg-gray-50' },
      tag_approved: { icon: CheckCheck, color: 'text-green-600 bg-green-50' },
      tag_rejected: { icon: X, color: 'text-red-600 bg-red-50' },
      comment_deleted: { icon: Trash2, color: 'text-gray-600 bg-gray-50' },
      user_banned: { icon: Ban, color: 'text-red-600 bg-red-50' },
      user_suspended: { icon: ShieldAlert, color: 'text-orange-600 bg-orange-50' },
      user_unbanned: { icon: ShieldCheck, color: 'text-green-600 bg-green-50' },
      user_unsuspended: { icon: ShieldCheck, color: 'text-green-600 bg-green-50' }
    };
    return iconMap[type] || { icon: AlertCircle, color: 'text-gray-600 bg-gray-50' };
  };

  // Get notification message - using t() for translations
  const getNotificationMessage = (notification: Notification): string => {
    const { type, actorName, photoTitle, badgeName, taggedPersonName, reason } = notification;

    // Helper to format with reason
    const withReason = (msg: string) => reason ? `${msg}: ${reason}` : msg;

    switch (type) {
      case 'new_comment':
        return `${actorName} ${t('notifications.commented')} "${photoTitle}"`;
      case 'new_like':
        return `${actorName} ${t('notifications.liked')} "${photoTitle}"`;
      case 'new_follower':
        return `${actorName} ${t('notifications.following')}`;
      case 'new_tag':
        return `${actorName} ${t('notifications.tagged')} "${photoTitle}"`;
      case 'badge_earned':
        return `${t('notifications.congratulations')} ${badgeName}`;
      case 'photo_approved':
        return `${t('notifications.yourPhoto')} "${photoTitle}" ${t('notifications.approved')}`;
      case 'photo_rejected':
        return withReason(`${t('notifications.yourPhoto')} "${photoTitle}" ${t('notifications.rejected')}`);
      case 'photo_edited':
        return `${t('notifications.yourPhoto')} "${photoTitle}" ${t('notifications.edited')}`;
      case 'photo_deleted':
        return withReason(`${t('notifications.yourPhoto')} "${photoTitle}" ${t('notifications.deleted')}`);
      case 'tag_approved':
        return `${t('notifications.tag')} "${taggedPersonName}" ${t('notifications.approved')}`;
      case 'tag_rejected':
        return withReason(`${t('notifications.tag')} "${taggedPersonName}" ${t('notifications.rejected')}`);
      case 'comment_deleted':
        return withReason(t('notifications.yourCommentDeleted'));
      case 'user_banned':
        return withReason(t('notifications.accountBanned'));
      case 'user_suspended':
        return withReason(t('notifications.accountSuspended'));
      case 'user_unbanned':
        return t('notifications.accountActive');
      case 'user_unsuspended':
        return t('notifications.suspensionLifted');
      default:
        return t('notifications.newNotification');
    }
  };

  // Get notification link - return null for deleted/rejected photos and edited content
  const getNotificationLink = (notification: Notification): string | null => {
    // Don't link to deleted, rejected, or edited photos/content
    const nonClickableTypes = [
      'photo_deleted',
      'photo_rejected', 
      'photo_edited',
      'comment_deleted',
      'tag_rejected',
      'user_banned',
      'user_suspended',
      'user_unbanned',
      'user_unsuspended'
    ];
    
    if (nonClickableTypes.includes(notification.type)) {
      return null;
    }
    
    // Link to photo for photo-related notifications
    if (notification.photoId) {
      return `/photo/${notification.photoId}`;
    }
    
    // Link to user profile for follower notifications
    if (notification.actorId && notification.type === 'new_follower') {
      return `/user/${notification.actorId}`;
    }
    
    return null;
  };

  // Format time ago - using t() for time labels
  const formatTimeAgo = (timestamp: any): string => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('notifications.time.justNow');
    
    // Different format for Croatian and English
    if (language === 'hr') {
      // Hrvatski: "prije X min/h/d"
      if (diffMins < 60) return `${t('notifications.time.ago')} ${diffMins} ${t('notifications.time.min')}`;
      if (diffHours < 24) return `${t('notifications.time.ago')} ${diffHours}${t('notifications.time.hours')}`;
      if (diffDays < 7) return `${t('notifications.time.ago')} ${diffDays}${t('notifications.time.days')}`;
      // Hrvatski datum: DD.MM.YYYY.
      return date.toLocaleDateString('hr-HR');
    } else {
      // English: "X min ago / Xh ago / Xd ago"
      if (diffMins < 60) return `${diffMins} ${t('notifications.time.min')}`;
      if (diffHours < 24) return `${diffHours}${t('notifications.time.hours')}`;
      if (diffDays < 7) return `${diffDays}${t('notifications.time.days')}`;
      // English datum: MM/DD/YYYY
      return date.toLocaleDateString('en-US');
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || !user) return;
    
    setMarkingAllRead(true);
    
    // ✅ Optimistic update - immediately update UI
    if (onMarkAllRead) {
      onMarkAllRead();
    }
    
    try {
      await notificationService.markAllNotificationsAsRead(user.uid);
      toast.success(t('notifications.allRead'));
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error(t('notifications.markError'));
    } finally {
      setMarkingAllRead(false);
    }
  };

  // Mark single notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle notification click with navigation
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await handleMarkAsRead(notification.id);
    }

    const link = getNotificationLink(notification);
    if (link) {
      navigate(link);
      onClose();
    }
  };

  // Display only last 5 notifications in dropdown
  const displayNotifications = notifications.slice(0, 5);

  return (
    <div 
      className="w-full sm:w-96 max-w-[calc(100vw-1rem)] bg-white rounded-lg shadow-xl border border-gray-200 max-h-[80vh] sm:max-h-[600px] flex flex-col overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-lg z-10">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{t('notifications.title')}</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markingAllRead}
              className="text-xs sm:text-sm px-2 sm:px-3"
            >
              <CheckCheck className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
              <span className="hidden sm:inline">{t('notifications.markAll')}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">{t('notifications.loading')}</p>
          </div>
        ) : displayNotifications.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {displayNotifications.map((notification) => {
              const { icon: IconComponent, color } = getNotificationIcon(notification.type);
              const message = getNotificationMessage(notification);
              const timeAgo = formatTimeAgo(notification.createdAt);
              const link = getNotificationLink(notification);
              const isClickable = link !== null;

              return (
                <div
                  key={notification.id}
                  title={!isClickable ? t('notifications.notAvailable') : undefined}
                  className={`p-3 sm:p-4 transition-colors ${
                    isClickable ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default opacity-70'
                  } ${!notification.read ? 'bg-blue-50/50' : ''}`}
                  onClick={() => isClickable && handleNotificationClick(notification)}
                >
                  <div className="flex gap-2 sm:gap-3">
                    <div className={`p-1.5 sm:p-2 rounded-full ${color} flex-shrink-0 h-fit`}>
                      <IconComponent className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs sm:text-sm ${!notification.read ? 'font-semibold' : 'font-medium'} text-gray-900 break-words`}>
                        {message}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">{timeAgo}</p>
                    </div>

                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 sm:p-8 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 font-medium">{t('notifications.noNotifications')}</p>
            <p className="text-xs text-gray-500 mt-1">{t('notifications.noNotificationsDesc')}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {displayNotifications.length > 0 && (
        <div className="p-2 sm:p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <Link
            to="/notifications"
            onClick={onClose}
            className="block text-center text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors py-1"
          >
            {t('notifications.viewAll')}
            <ArrowRight className="inline h-3 w-3 sm:h-4 sm:w-4 ml-1" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;