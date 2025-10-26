// src/components/NotificationBell.tsx - FINAL VERSION with debounced listener
import { useState, useEffect, useRef } from 'react';
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
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false); // ✅ Track if marking all
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = notificationService.subscribeToNotifications(
      user.uid,
      (newNotifications) => {
        // ✅ Ignore listener updates while marking all as read
        if (isMarkingAllRead) {
          console.log('🚫 Ignoring listener update during mark all operation');
          return;
        }
        
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
  }, [user, isMarkingAllRead]); // ✅ Re-subscribe when isMarkingAllRead changes

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  // ✅ Optimistic update with debounce protection
  const handleMarkAllRead = () => {
    setIsMarkingAllRead(true); // ✅ Block listener updates
    
    // Instant UI update
    setNotifications(prevNotifications => 
      prevNotifications.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
    
    // ✅ Re-enable listener after 2 seconds (enough time for Firestore batch to complete)
    setTimeout(() => {
      setIsMarkingAllRead(false);
    }, 2000);
  };

  if (!user) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`relative ${className} hover:bg-white/20 transition-all`}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center animate-pulse shadow-lg">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          <div className="absolute top-full right-0 mt-2 z-[9999]">
            <NotificationCenter
              notifications={notifications}
              unreadCount={unreadCount}
              loading={loading}
              onClose={() => setIsOpen(false)}
              onMarkAllRead={handleMarkAllRead}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;