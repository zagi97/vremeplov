// src/components/NotificationBell.tsx - ULTIMATE FIX
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
  
  // ✅ Refs to control listener behavior
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isMarkingRef = useRef(false);

  // ✅ Setup listener
  const setupListener = () => {
    if (!user) return;

    console.log('🔄 Setting up notification listener');
    
    const unsubscribe = notificationService.subscribeToNotifications(
      user.uid,
      (newNotifications) => {
        // ✅ Ignore updates while batch is running
        if (isMarkingRef.current) {
          console.log('🚫 BLOCKED - Batch in progress, ignoring listener update');
          return;
        }
        
        console.log('📨 Listener update:', {
          total: newNotifications.length,
          unread: newNotifications.filter(n => !n.read).length
        });
        
        setNotifications(newNotifications);
        const unread = newNotifications.filter(n => !n.read).length;
        setUnreadCount(unread);
        setLoading(false);
      },
      (error) => {
        console.error('❌ Notification subscription error:', error);
        setLoading(false);
      }
    );

    unsubscribeRef.current = unsubscribe;
  };

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setupListener();

    return () => {
      console.log('🧹 Cleaning up notification listener');
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  // ✅ Mark all with proper batch execution
  const handleMarkAllRead = async () => {
    if (!user) return;

    console.log('🔘 Mark all clicked');
    
    try {
      // ✅ Block listener IMMEDIATELY
      isMarkingRef.current = true;
      console.log('🔒 Listener BLOCKED');

      // ✅ Execute batch
      console.log('🚀 Executing batch...');
      await notificationService.markAllNotificationsAsRead(user.uid);
      console.log('✅ Batch completed');

      // ✅ Wait a bit for Firestore to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));

      // ✅ Unblock listener and force refresh
      console.log('🔓 Listener UNBLOCKED - forcing refresh');
      isMarkingRef.current = false;

      // ✅ Force re-fetch by unsubscribing and re-subscribing
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      setupListener();

    } catch (error) {
      console.error('❌ Error in mark all:', error);
      isMarkingRef.current = false;
    }
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