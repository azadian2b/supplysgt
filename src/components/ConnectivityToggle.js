import React, { useEffect, useState } from 'react';
import '../styles/ConnectivityToggle.css';
import { getConnectivityMode, subscribeConnectivityMode } from '../offline/connectivityMode';

const ConnectivityToggle = ({ onConnectivityChange }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getConnectivityMode().then(mode => {
      if (!cancelled) {
        setIsOnline(mode !== 'offline');
      }
    });

    const unsubscribe = subscribeConnectivityMode(mode => {
      setIsOnline(mode !== 'offline');
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const toggleConnectivity = async () => {
    if (!isChanging) {
      const nextOnline = !isOnline;
      setIsChanging(true);
      try {
        if (onConnectivityChange) {
          await onConnectivityChange(nextOnline);
        }
        setIsOnline(nextOnline);
      } finally {
        setIsChanging(false);
      }
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
