import React from 'react';
import useOnlineStatus from '../../hooks/useOnlineStatus';

const ConnectivityStatus = ({ className = '', showLabel = true }) => {
  const isOnline = useOnlineStatus();
  
  return (
    <div className={`connectivity-status ${isOnline ? 'status-online' : 'status-offline'} ${className}`}>
      <div className={`status-indicator ${isOnline ? 'indicator-online' : 'indicator-offline'}`}></div>
      {showLabel && <span>{isOnline ? 'Online' : 'Offline'}</span>}
    </div>
  );
};

export default ConnectivityStatus; 