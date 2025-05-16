import React, { useState } from 'react';
import ConnectivityStatus from '../common/ConnectivityStatus';

/**
 * Verification form for end users to verify their equipment
 */
const VerificationForm = ({
  activeSessions = [],
  onVerifyItem,
  loading = false,
  online = true
}) => {
  const [serialNumber, setSerialNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Handle verification form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!online) {
      setError('You must be online to verify items.');
      return;
    }
    
    if (!serialNumber.trim()) {
      setError('Please enter a serial number.');
      return;
    }
    
    if (activeSessions.length === 0) {
      setError('There are no active accountability sessions at this time.');
      return;
    }
    
    setError('');
    setSuccess('');
    
    try {
      await onVerifyItem(serialNumber);
      setSuccess(`Successfully submitted verification for item with serial number ${serialNumber}`);
      setSerialNumber('');
    } catch (error) {
      setError(error.message || 'Failed to verify item. Please try again.');
    }
  };
  
  return (
    <div className="self-service-verification">
      <h2>Verify Your Equipment</h2>
      
      <ConnectivityStatus />
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="active-sessions-info">
        <h3>Active Accountability Sessions</h3>
        {activeSessions.length === 0 ? (
          <p>There are no active accountability sessions at this time.</p>
        ) : (
          <div className="active-sessions-list">
            {activeSessions.map(session => {
              const startDate = new Date(session.startedAt);
              return (
                <div key={session.id} className="active-session-item">
                  <p>
                    <strong>Conducted by:</strong> {session.conductedBy 
                      ? `${session.conductedBy.rank} ${session.conductedBy.lastName}, ${session.conductedBy.firstName}` 
                      : 'Unknown'}
                  </p>
                  <p><strong>Started:</strong> {startDate.toLocaleString()}</p>
                  <p><strong>Progress:</strong> {session.accountedForCount}/{session.itemCount} items</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <form className="verification-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="serialNumber">Enter Item Serial Number:</label>
          <input
            id="serialNumber"
            type="text"
            placeholder="Enter serial number..."
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            disabled={!online || activeSessions.length === 0 || loading}
          />
        </div>
        
        <button 
          type="submit"
          className="primary-button"
          disabled={!online || activeSessions.length === 0 || !serialNumber.trim() || loading}
        >
          {loading ? 'Processing...' : 'Verify Item'}
        </button>
      </form>
    </div>
  );
};

export default VerificationForm; 