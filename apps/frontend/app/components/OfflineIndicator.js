'use client';

import { useState, useEffect } from 'react';
import { WifiOff, Wifi, X } from 'lucide-react';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    if (!navigator.onLine) setShowBanner(true);

    const handleOnline = () => {
      setIsOnline(true);
      setJustReconnected(true);
      setShowBanner(true);
      // Auto-hide the "back online" banner after 4s
      setTimeout(() => {
        setShowBanner(false);
        setJustReconnected(false);
      }, 4000);

      // Trigger background sync if available
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.sync.register('sync-prestart').catch(() => {});
          reg.sync.register('sync-services').catch(() => {});
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
      setJustReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
        isOnline
          ? 'bg-green-600 text-white'
          : 'bg-amber-500 text-white'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi size={18} />
          <span className="text-sm font-medium">Back online — syncing data...</span>
        </>
      ) : (
        <>
          <WifiOff size={18} />
          <span className="text-sm font-medium">
            You&apos;re offline — changes will sync when reconnected
          </span>
        </>
      )}
      <button
        onClick={() => setShowBanner(false)}
        className="ml-2 p-0.5 rounded hover:bg-white/20 transition"
      >
        <X size={14} />
      </button>
    </div>
  );
}
