// src/pages/Notifications.tsx - FIXED VERSION
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  ArrowLeft,
  Bell,
  Filter
} from 'lucide-react';
import { Notification, notificationService } from '../services/notificationService';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';
import UserProfile from '../components/UserProfile';
import Footer from '../components/Footer';
import PageHeader from '@/components/PageHeader';

const NotificationsPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false); // ✅ Track marking operation

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
        toast.error('Greška pri učitavanju obavijesti');
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user, navigate, isMarkingAllRead]); // ✅ Re-subscribe when isMarkingAllRead changes

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
    return date.toLocaleDateString('hr-HR', { day: 'numeric', month: 'short', year: 'numeric' });
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
      toast.success('Sve obavijesti označene kao pročitane');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Greška pri označavanju obavijesti');
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
                        
                        <div className="bg-white border-b border-gray-200 py-12 mt-16">
                          <div className="container max-w-5xl mx-auto px-4 text-center">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                              {t('privacy.title')}
                            </h2>
                            <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
                              {t('privacy.subtitle')}
                            </p>
                          </div>
                        </div>

      {/* Main Content */}
      <section className="py-6 sm:py-12 px-2 sm:px-4">
        <div className="w-full max-w-full sm:max-w-4xl mx-auto">
          <Card>
            <CardHeader className="border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl">Obavijesti</CardTitle>
                    {unreadCount > 0 && (
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                        {unreadCount} {unreadCount === 1 ? 'nova obavijest' : 'novih obavijesti'}
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
                    Označi sve kao pročitano
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as 'all' | 'unread')} className="w-full">
                <div className="border-b border-gray-200 px-4 sm:px-6">
                  <TabsList className="w-full sm:w-auto">
                    <TabsTrigger value="all" className="flex-1 sm:flex-none">
                      Sve ({notifications.length})
                    </TabsTrigger>
                    <TabsTrigger value="unread" className="flex-1 sm:flex-none">
                      Nepročitano ({unreadCount})
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value={activeFilter} className="mt-0">
                  {loading ? (
                    <div className="p-12 text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-4">Učitavanje obavijesti...</p>
                    </div>
                  ) : filteredNotifications.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {filteredNotifications.map((notification) => {
                        const { icon: IconComponent, color } = getNotificationIcon(notification.type);
                        const message = getNotificationMessage(notification);
                        const link = getNotificationLink(notification);
                        const timeAgo = formatTimeAgo(notification.createdAt);
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
                  ) : (
                    <div className="p-12 sm:p-16 text-center">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                        {activeFilter === 'unread' ? 'Nemaš nepročitanih obavijesti' : 'Nemaš obavijesti'}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {activeFilter === 'unread' 
                          ? 'Sve obavijesti su pročitane' 
                          : 'Ovdje će se pojaviti tvoje obavijesti'
                        }
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