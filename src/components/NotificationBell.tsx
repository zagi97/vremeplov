// src/components/NotificationBell.tsx
import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { notificationService, Notification } from '../services/notificationService';
import NotificationCenter from './NotificationCenter';
import { Button } from './ui/button';

interface NotificationBellProps {
  className?: string;
}

const NotificationBell = ({ className = '' }: NotificationBellProps) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Subscribe to real-time notifications
    const unsubscribe = notificationService.subscribeToNotifications(
      user.uid,
      (newNotifications) => {
        setNotifications(newNotifications);
        const unread = newNotifications.filter(n => !n.read).length;
        setUnreadCount(unread);
        setLoading(false);
      },
      (error) => {
        console.error('Notification subscription error:', error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user]);

  if (!user) return null;

  return (
    <div className="relative z-[999]">

  <Button
    variant="ghost"
    size="icon"
    onClick={() => setIsOpen(!isOpen)}
    className={`relative ${className} hover:bg-white/10`}
    aria-label="Notifications"
  >
    <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
    {unreadCount > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center animate-pulse">
        {unreadCount > 9 ? '9+' : unreadCount}
      </span>
    )}
  </Button>

{isOpen && (
  <>
    <div 
      className="fixed inset-0 z-[998] bg-black/20 md:hidden"
      onClick={() => setIsOpen(false)}
    />
    <div className="absolute right-0 top-full mt-2 z-[999]">
      <NotificationCenter
        notifications={notifications}
        unreadCount={unreadCount}
        loading={loading}
        onClose={() => setIsOpen(false)}
      />
    </div>
     </>
  )}
</div>

  );
};

export default NotificationBell;