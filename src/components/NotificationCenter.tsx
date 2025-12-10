// src/components/NotificationCenter.tsx - ULTIMATE FIX
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Bell, CheckCheck } from 'lucide-react';
import { Notification, notificationService } from '../services/notificationService';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { formatTimeAgo } from '../utils/dateUtils';
import { getNotificationIcon } from '../constants/activityIcons';

interface NotificationCenterProps {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  onClose: () => void;
  onMarkAllRead?: () => Promise<void>;
}

const NotificationCenter = ({ 
  notifications, 
  unreadCount, 
  loading,
  onClose,
  onMarkAllRead
}: NotificationCenterProps) => {
  const { t, language } = useLanguage();
  useAuth();
  const navigate = useNavigate();
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const getNotificationMessage = (notification: Notification): string => {
    const { type, actorName, photoTitle, badgeName, taggedPersonName } = notification;

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
        return `${t('notifications.yourPhoto')} "${photoTitle}" ${t('notifications.rejected')}: ${t('notifications.tagRejectedReason')}`;
      case 'photo_edited':
        return `${t('notifications.yourPhoto')} "${photoTitle}" ${t('notifications.edited')}`;
      case 'photo_deleted':
        return `${t('notifications.yourPhoto')} "${photoTitle}" ${t('notifications.deleted')}`;
      case 'tag_approved':
        return `${t('notifications.tag')} "${taggedPersonName}" ${t('notifications.approved')}`;
      case 'tag_rejected':
        return `${t('notifications.tag')} "${taggedPersonName}" ${t('notifications.rejected')}: ${t('notifications.tagRejectedReason')}`;
      case 'comment_deleted':
        return t('notifications.yourCommentDeleted');
      case 'user_banned':
        return t('notifications.accountBanned');
      case 'user_suspended':
        return t('notifications.accountSuspended');
      case 'user_unbanned':
        return t('notifications.accountActive');
      case 'user_unsuspended':
        return t('notifications.suspensionLifted');
      default:
        return t('notifications.newNotification');
    }
  };

  const getNotificationLink = (notification: Notification): string | null => {
    const nonClickableTypes = [
      'photo_deleted', 'photo_rejected', 'photo_edited',
      'comment_deleted', 'tag_rejected',
      'user_banned', 'user_suspended', 'user_unbanned', 'user_unsuspended'
    ];
    
    if (nonClickableTypes.includes(notification.type)) return null;
    if (notification.photoId) return `/photo/${notification.photoId}`;
    if (notification.actorId && notification.type === 'new_follower') {
      return `/user/${notification.actorId}`;
    }
    return null;
  };

  // ✅ Call parent's mark all handler
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || !onMarkAllRead || markingAllRead) return;

    setMarkingAllRead(true);

    try {
      await onMarkAllRead();
      toast.success(t('notifications.allRead'));
      // ✅ Keep panel open - let user decide when to close
    } catch (error) {
      console.error('❌ Error:', error);
      toast.error(t('notifications.markError'));
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

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

  const displayNotifications = notifications.slice(0, 5);

  return (
  <div 
    className="w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 max-h-[85vh] sm:max-h-[600px] flex flex-col overflow-hidden"
  >
    {/* Header - kompaktniji na mobilnom */}
    <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
          {t('notifications.title')}
        </h3>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium">
            {unreadCount}
          </span>
        )}
      </div>
      
      {unreadCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMarkAllAsRead}
          disabled={markingAllRead}
          className="text-[11px] sm:text-xs px-2 h-7 sm:h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          <CheckCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
          <span className="hidden xs:inline">{t('notifications.markAll')}</span>
          <span className="xs:hidden">{t('notifications.All')}</span>
        </Button>
      )}
    </div>

    {/* Scrollable content */}
    <div className="overflow-y-auto flex-1 overscroll-contain">
      {loading || markingAllRead ? (
        <div className="p-6 sm:p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            {markingAllRead ? t('notifications.markingRead') : t('notifications.loading')}
          </p>
        </div>
      ) : displayNotifications.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {displayNotifications.map((notification) => {
            const { icon: IconComponent, color } = getNotificationIcon(notification.type);
            const message = getNotificationMessage(notification);
            const timeAgo = formatTimeAgo(notification.createdAt, language, t);
            const link = getNotificationLink(notification);
            const isClickable = link !== null;

            return (
              <div
                key={notification.id}
                title={!isClickable ? t('notifications.notAvailable') : undefined}
                className={`p-3 sm:p-4 transition-colors ${
                  isClickable ? 'hover:bg-blue-50 active:bg-blue-100 cursor-pointer' : 'cursor-default opacity-70'
                } ${!notification.read ? 'bg-blue-50/50' : ''}`}
                onClick={() => isClickable && handleNotificationClick(notification)}
              >
                <div className="flex gap-2.5 sm:gap-3">
                  {/* Icon */}
                  <div className={`p-1.5 sm:p-2 rounded-full ${color} flex-shrink-0 h-fit`}>
                    <IconComponent className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] sm:text-sm leading-snug ${
                      !notification.read ? 'font-semibold' : 'font-medium'
                    } text-gray-900 break-words`}>
                      {message}
                    </p>
                    <p className="text-[11px] sm:text-xs text-gray-500 mt-1">{timeAgo}</p>
                  </div>

                  {/* Unread indicator */}
                  {!notification.read && (
                    <div className="flex-shrink-0 pt-0.5">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 sm:p-12 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 font-medium">{t('notifications.noNotifications')}</p>
          <p className="text-xs text-gray-500 mt-1">{t('notifications.noNotificationsDesc')}</p>
        </div>
      )}
    </div>

    {/* Footer - vidi sve */}
    {displayNotifications.length > 0 && (
      <div className="p-2.5 sm:p-3 border-t border-gray-200 bg-gray-50">
        <Link
          to="/notifications"
          onClick={onClose}
          className="flex items-center justify-center gap-1 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors py-1.5 sm:py-1"
        >
          {t('notifications.viewAll')}
          <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Link>
      </div>
    )}
  </div>
);
};

export default NotificationCenter;