import React, { useEffect, useState } from 'react';
import '../styles/ConnectivityToggle.css';

const ConnectivityToggle = ({ onConnectivityChange }) => {
  // Get the initial connectivity mode from localStorage or default to 'online'
  const [isOnline, setIsOnline] = useState(() => {
    const savedMode = localStorage.getItem('connectivityMode');
    return savedMode ? savedMode === 'online' : true;
  });
  const [isChanging, setIsChanging] = useState(false);

  // Apply the connectivity mode when component mounts or mode changes
  useEffect(() => {
    const mode = isOnline ? 'online' : 'offline';
    localStorage.setItem('connectivityMode', mode);
    
    // Notify parent components about the change
    if (onConnectivityChange) {
      const applyChange = async () => {
        setIsChanging(true);
        try {
          await onConnectivityChange(isOnline);
        } finally {
          setIsChanging(false);
        }
      };
      applyChange();
    }
  }, [isOnline, onConnectivityChange]);
  
  // Listen for storage events (changes from other tabs)
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'connectivityMode') {
        const newMode = event.newValue;
        setIsOnline(newMode === 'online');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const toggleConnectivity = () => {
    if (!isChanging) {
      setIsOnline(!isOnline);
    }
  };

  return (
    <div className="connectivity-toggle">
      <div className="toggle-label">
        {isChanging 
          ? 'Switching...' 
          : (isOnline ? 'Connected' : 'Offline')
        }
      </div>
      <label className={`switch ${isChanging ? 'disabled' : ''}`}>
        <input 
          type="checkbox" 
          checked={isOnline}
          onChange={toggleConnectivity}
          disabled={isChanging}
        />
        <span className="slider round"></span>
      </label>
    </div>
  );
};

export default ConnectivityToggle; 