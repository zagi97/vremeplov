// src/components/NotificationCenter.tsx - FIXED VERSION
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Camera, 
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

interface NotificationCenterProps {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  onClose: () => void;
}

const NotificationCenter = ({ 
  notifications, 
  unreadCount, 
  loading,
  onClose 
}: NotificationCenterProps) => {
  const { t } = useLanguage();
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

  // Get notification message
  const getNotificationMessage = (notification: Notification): string => {
    const { type, actorName, photoTitle, badgeName, taggedPersonName, reason } = notification;

    switch (type) {
      case 'new_comment':
        return `${actorName} je komentirao/la tvoju fotografiju "${photoTitle}"`;
      case 'new_like':
        return `${actorName} je lajkao/la tvoju fotografiju "${photoTitle}"`;
      case 'new_follower':
        return `${actorName} te sada prati`;
      case 'new_tag':
        return `${actorName} te označio/la na fotografiji "${photoTitle}"`;
      case 'badge_earned':
        return `Čestitamo! Zaradio/la si značku: ${badgeName}`;
      case 'photo_approved':
        return `Tvoja fotografija "${photoTitle}" je odobrena`;
      case 'photo_rejected':
        return `Tvoja fotografija "${photoTitle}" je odbijena${reason ? `: ${reason}` : ''}`;
      case 'photo_edited':
        return `Tvoja fotografija "${photoTitle}" je uređena`;
      case 'photo_deleted':
        return `Tvoja fotografija "${photoTitle}" je obrisana${reason ? `: ${reason}` : ''}`;
      case 'tag_approved':
        return `Tag osobe "${taggedPersonName}" je odobren`;
      case 'tag_rejected':
        return `Tag osobe "${taggedPersonName}" je odbijen${reason ? `: ${reason}` : ''}`;
      case 'comment_deleted':
        return `Tvoj komentar je obrisan${reason ? `: ${reason}` : ''}`;
      case 'user_banned':
        return `Tvoj račun je bannan${reason ? `: ${reason}` : ''}`;
      case 'user_suspended':
        return `Tvoj račun je suspendiran${reason ? `: ${reason}` : ''}`;
      case 'user_unbanned':
        return `Tvoj račun je ponovo aktivan. Dobrodošao/la natrag!`;
      case 'user_unsuspended':
        return `Suspenzija tvog računa je uklonjena. Dobrodošao/la natrag!`;
      default:
        return 'Nova obavijest';
    }
  };

  // Get notification link
  const getNotificationLink = (notification: Notification): string | null => {
    if (notification.photoId) {
      return `/photo/${notification.photoId}`;
    }
    if (notification.actorId && notification.type === 'new_follower') {
      return `/user/${notification.actorId}`;
    }
    return null;
  };

  // Format time ago
  const formatTimeAgo = (timestamp: any): string => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'upravo sad';
    if (diffMins < 60) return `prije ${diffMins} min`;
    if (diffHours < 24) return `prije ${diffHours}h`;
    if (diffDays < 7) return `prije ${diffDays}d`;
    return date.toLocaleDateString('hr-HR');
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || !notifications[0]?.userId) return;
    
    setMarkingAllRead(true);
    try {
      await notificationService.markAllNotificationsAsRead(notifications[0].userId);
      toast.success('Sve obavijesti označene kao pročitane');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Greška pri označavanju obavijesti');
    } finally {
      setMarkingAllRead(false);
    }
  };

  // Mark single notification as read
  const handleMarkAsRead = async (notificationId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    try {
      await notificationService.markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Display only last 5 notifications in dropdown
  const displayNotifications = notifications.slice(0, 5);

  return (
<div 
  className="w-96 max-w-[calc(100vw-1rem)] bg-white rounded-lg shadow-xl border border-gray-200 max-h-[80vh] sm:max-h-[600px] flex flex-col overflow-hidden"
  onClick={(e) => e.stopPropagation()}
>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-lg z-10">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Obavijesti</h3>
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
              className="text-xs sm:text-sm"
            >
              <CheckCheck className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Označi sve
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Učitavanje...</p>
          </div>
        ) : displayNotifications.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {displayNotifications.map((notification) => {
              const { icon: IconComponent, color } = getNotificationIcon(notification.type);
              const message = getNotificationMessage(notification);
              const link = getNotificationLink(notification);
              const timeAgo = formatTimeAgo(notification.createdAt);

              const NotificationContent = (
                <div 
                  className={`p-3 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation(); // ✅ KEEP THIS
                    if (!notification.read) {
                      handleMarkAsRead(notification.id, e);
                    }
                    if (link) {
                      onClose();
                    }
                  }}
                >
                  <div className="flex gap-3">
                    <div className={`p-2 rounded-full ${color} flex-shrink-0 h-fit`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                        {message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
                    </div>

                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              );

              return link ? (
                <Link key={notification.id} to={link} onClick={onClose}>
                  {NotificationContent}
                </Link>
              ) : (
                <div key={notification.id}>
                  {NotificationContent}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 font-medium">Nemaš novih obavijesti</p>
            <p className="text-xs text-gray-500 mt-1">Ovdje će se pojaviti tvoje obavijesti</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {displayNotifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <Link
            to="/notifications"
            onClick={onClose}
            className="block text-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors py-1"
          >
            Prikaži sve obavijesti
            <ArrowRight className="inline h-4 w-4 ml-1" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;