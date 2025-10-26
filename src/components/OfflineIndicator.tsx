import { useEffect, useState } from 'react';

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      document.body.style.paddingTop = '0';
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      document.body.style.paddingTop = '40px'; // Visina bannera
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial state
    if (!navigator.onLine) {
      document.body.style.paddingTop = '40px';
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.body.style.paddingTop = '0';
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-orange-500 text-white py-2 px-4 text-center z-[9999] text-sm">
      ⚠️ Korisnik nema pristup internet mreži
    </div>
  );
};