import { useState, useEffect } from 'react';

/**
 * Custom hook to track online/offline status
 * @returns {boolean} Current online status
 */
const useOnlineStatus = () => {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleConnectionChange = () => {
      setOnline(navigator.onLine);
    };

    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);

    return () => {
      window.removeEventListener('online', handleConnectionChange);
      window.removeEventListener('offline', handleConnectionChange);
    };
  }, []);

  return online;
};

export default useOnlineStatus; 