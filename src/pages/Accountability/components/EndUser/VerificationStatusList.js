import React from 'react';

/**
 * Component to display verification status for end users
 */
const VerificationStatusList = ({
  pendingVerifications = [],
  completedVerifications = [],
  masterItems = {}
}) => {
  // Render a verification item
  const renderVerificationItem = (item, status) => {
    const equipment = item.equipmentItem || {};
    const masterData = equipment.equipmentMaster || masterItems[equipment.equipmentMasterID] || {};
    const itemName = masterData.commonName || 'Unknown Item';
    const serialNumber = equipment.serialNumber || 'N/A';
    const verifiedAt = item.verifiedAt ? new Date(item.verifiedAt).toLocaleString() : 'Unknown';
    const confirmedAt = item.confirmedAt ? new Date(item.confirmedAt).toLocaleString() : null;
    
    let statusLabel = 'Pending';
    let statusClass = 'status-pending';
    
    if (status === 'completed') {
      if (item.confirmationStatus === 'CONFIRMED') {
        statusLabel = 'Confirmed';
        statusClass = 'status-confirmed';
      } else if (item.confirmationStatus === 'FAILED') {
        statusLabel = 'Rejected';
        statusClass = 'status-rejected';
      }
    }
    
    return (
      <div key={item.id} className={`verification-item ${statusClass}`}>
        <div className="verification-item-header">
          <div className="verification-item-name">{itemName}</div>
          <div className={`verification-item-status ${statusClass}`}>{statusLabel}</div>
        </div>
        <div className="verification-item-details">
          <p><strong>Serial Number:</strong> {serialNumber}</p>
          <p><strong>Submitted:</strong> {verifiedAt}</p>
          {confirmedAt && <p><strong>Confirmed:</strong> {confirmedAt}</p>}
        </div>
      </div>
    );
  };
  
  return (
    <div className="verification-status-list">
      <h3>Your Verifications</h3>
      
      {pendingVerifications.length > 0 && (
        <div className="pending-verifications">
          <h4>Pending Verifications</h4>
          {pendingVerifications.map(item => renderVerificationItem(item, 'pending'))}
        </div>
      )}
      
      {completedVerifications.length > 0 && (
        <div className="completed-verifications">
          <h4>Completed Verifications</h4>
          {completedVerifications.map(item => renderVerificationItem(item, 'completed'))}
        </div>
      )}
    </div>
  );
};

export default VerificationStatusList; 