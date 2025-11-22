// src/pages/Notifications.tsx - FIXED VERSION
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Notification, notificationService } from '../services/notificationService';
import { formatTimeAgo } from '../utils/dateUtils';
import { getNotificationIcon } from '../constants/activityIcons';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Footer from '../components/Footer';
import PageHeader from '@/components/PageHeader';

const NotificationsPage = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false); // ✅ Track marking operation
  const [displayedCount, setDisplayedCount] = useState(20);
const [loadingMore, setLoadingMore] = useState(false);
const [allNotificationsLoaded, setAllNotificationsLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    setLoading(true);

    // Subscribe to real-time notifications
    const unsubscribe = notificationService.subscribeToNotifications(
      user.uid,
      (newNotifications) => {
        // ✅ Ignore listener updates while marking all as read
        if (isMarkingAllRead) {
          console.log('🚫 Ignoring listener update during mark all operation');
          return;
        }
        
        setNotifications(newNotifications);
        setLoading(false);
      },
      (error) => {
        console.error('Notification subscription error:', error);
        toast.error(t('notifications.markError'));
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user, navigate, isMarkingAllRead]); // ✅ Re-subscribe when isMarkingAllRead changes


  // Get notification message
  const getNotificationMessage = (notification: Notification): string => {
    const { type, actorName, photoTitle, badgeName, taggedPersonName, reason } = notification;
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


  const handleLoadMore = () => {
  setLoadingMore(true);
  setTimeout(() => {
    setDisplayedCount(prev => Math.min(prev + 20, filteredNotifications.length));
    setLoadingMore(false);
    
    if (displayedCount + 20 >= filteredNotifications.length) {
      setAllNotificationsLoaded(true);
    }
  }, 300);
};

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    setMarkingAllRead(true);
    setIsMarkingAllRead(true); // ✅ Block listener updates
    
    // ✅ Optimistic update - immediately update local state
    setNotifications(prevNotifications => 
      prevNotifications.map(n => ({ ...n, read: true }))
    );
    
    try {
      await notificationService.markAllNotificationsAsRead(user.uid);
      toast.success(t('notifications.allRead'))
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error(t('notifications.markError'));
    } finally {
      setMarkingAllRead(false);
      
      // ✅ Re-enable listener after 2 seconds
      setTimeout(() => {
        setIsMarkingAllRead(false);
      }, 2000);
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

  // Filter notifications
  const filteredNotifications = activeFilter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

return (
  <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
    {/* Navigation Header */}
    <PageHeader title="Vremeplov.hr" />
                      
    <div className="bg-white border-b border-gray-200 py-12 pt-28">
      <div className="container max-w-5xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          {t('notifications.title')}
        </h2>
      </div>
    </div>

    {/* Main Content */}
    <section className="py-6 sm:py-12 px-2 sm:px-4 flex-1">
      <div className="w-full max-w-full sm:max-w-4xl mx-auto">
        <Card>
          <CardHeader className="border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl">{t('notifications.title')}</CardTitle>
                  {unreadCount > 0 && (
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                      {unreadCount} {t(unreadCount === 1 ? 'notifications.newNotificationSingular' : 'notifications.newNotifications')}
                    </p>
                  )}
                </div>
              </div>

              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={markingAllRead}
                  className="w-full sm:w-auto"
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  {t('notifications.markAllLikeRead')}
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as 'all' | 'unread')} className="w-full">
              <div className="border-b border-gray-200 px-4 sm:px-6">
                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="all" className="flex-1 sm:flex-none">
                    {t('notifications.All')} ({notifications.length})
                  </TabsTrigger>
                  <TabsTrigger value="unread" className="flex-1 sm:flex-none">
                    {t('notifications.Unread')} ({unreadCount})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={activeFilter} className="mt-0">
                {loading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-4">{t('notifications.loadNotifications')}</p>
                  </div>
                ) : filteredNotifications.length > 0 ? (
                  <>
                    <div className="divide-y divide-gray-100">
                      {filteredNotifications.slice(0, displayedCount).map((notification) => {
                        const { icon: IconComponent, color } = getNotificationIcon(notification.type);
                        const message = getNotificationMessage(notification);
                        const link = getNotificationLink(notification);
                        const timeAgo = formatTimeAgo(notification.createdAt, language, t);
                        const isClickable = link !== null;

                        const NotificationContent = (
                          <div 
                            className={`p-4 sm:p-6 transition-colors ${
                              isClickable ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default opacity-70'
                            } ${!notification.read ? 'bg-blue-50/30' : ''}`}
                            onClick={(e) => {
                              if (!notification.read) {
                                handleMarkAsRead(notification.id, e);
                              }
                            }}
                          >
                            <div className="flex gap-3 sm:gap-4">
                              <div className={`p-2.5 sm:p-3 rounded-full ${color} flex-shrink-0 h-fit`}>
                                <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm sm:text-base ${!notification.read ? 'font-semibold' : 'font-medium'} text-gray-900 break-words`}>
                                  {message}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1.5">{timeAgo}</p>
                              </div>

                              {!notification.read && (
                                <div className="flex-shrink-0 pt-1">
                                  <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        );

                        return isClickable ? (
                          <Link key={notification.id} to={link}>
                            {NotificationContent}
                          </Link>
                        ) : (
                          <div key={notification.id}>
                            {NotificationContent}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* ✅ Load More Button */}
                    {!allNotificationsLoaded && displayedCount < filteredNotifications.length && (
                      <div className="p-4 border-t">
                        <Button
                          onClick={handleLoadMore}
                          disabled={loadingMore}
                          variant="outline"
                          className="w-full"
                        >
                          {loadingMore ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                              {t('common.loading')}
                            </>
                          ) : (
                            <>
                              📬 {t('notifications.loadMore')} ({filteredNotifications.length - displayedCount} {t('notifications.remaining')})
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-12 sm:p-16 text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                      {activeFilter === 'unread' 
                        ? t('notifications.zeroUnreadNotifications')
                        : t('notifications.zeroNotifications')}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {activeFilter === 'unread' 
                        ? t('notifications.notificationsAllRead')
                        : t('notifications.hereAppearNotifications')}
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </section>

    {/* Footer */}
    <Footer />
  </div>
);
};

export default NotificationsPage;