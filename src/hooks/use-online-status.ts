
"use client";

import { useState, useEffect } from 'react';

/**
 * Custom hook to track the online status of the browser.
 * @returns {boolean} `true` if the browser is online, `false` otherwise.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    // Ensure this only runs on the client
    if (typeof window !== 'undefined' && typeof window.navigator.onLine !== 'undefined') {
      setIsOnline(window.navigator.onLine);
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
