import React, { useState, useEffect } from 'react';
import '../styles/UpdateNotification.css';

function UpdateNotification() {
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);

  useEffect(() => {
    // Listen for service worker update events
    if ('serviceWorker' in navigator) {
      let refreshing = false;
      
      // This will fire when the service worker detects an update
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload(); // Reload the page to apply update
        }
      });
      
      // Check if there's a waiting service worker (which means an update is available)
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg && reg.waiting) {
          setShowUpdateBanner(true);
        }
        
        // Also listen for future update events
        navigator.serviceWorker.addEventListener('message', event => {
          if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
            setShowUpdateBanner(true);
          }
        });
      });
    }
  }, []);

  const applyUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg && reg.waiting) {
          // Send message to service worker to skip waiting and activate new version
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    }
  };

  if (!showUpdateBanner) return null;

  return (
    <div className="update-notification">
      <p>A new version of Supply Sergeant is available!</p>
      <button onClick={applyUpdate}>Update Now</button>
    </div>
  );
}

export default UpdateNotification; 