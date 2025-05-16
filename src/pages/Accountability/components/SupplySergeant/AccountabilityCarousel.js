import React, { useState } from 'react';
import ConnectivityStatus from '../common/ConnectivityStatus';

/**
 * Carousel component for displaying accountability items
 */
const AccountabilityCarousel = ({
  items = [],
  onMarkAsAccountedFor,
  onConfirmVerification,
  onRejectVerification,
  onCompleteSession,
  processing = false,
  pendingItems = [],
  online = true
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (!items || items.length === 0) {
    return <div>No items to display</div>;
  }
  
  const totalItems = items.length;
  const accountedItems = items.filter(item => item.status === 'ACCOUNTED_FOR').length;
  const progress = totalItems > 0 ? (accountedItems / totalItems) * 100 : 0;
  
  // Navigate to previous item
  const goToPrevious = () => {
    setCurrentIndex(Math.max(0, currentIndex - 1));
  };
  
  // Navigate to next item
  const goToNext = () => {
    setCurrentIndex(Math.min(totalItems - 1, currentIndex + 1));
  };
  
  // Go to a specific item
  const goToIndex = (index) => {
    setCurrentIndex(Math.min(Math.max(0, index), totalItems - 1));
  };
  
  // Handle marking an item as accounted for
  const handleMarkAsAccountedFor = (item) => {
    if (!online) return;
    onMarkAsAccountedFor(item);
  };
  
  // Get current item
  const currentItem = items[currentIndex];
  
  // Check if current item has a pending verification
  const pendingVerification = pendingItems.find(item => 
    item.equipmentItemID === currentItem.equipmentItemID && 
    item.status === 'VERIFICATION_PENDING'
  );
  
  // Render the current item card
  const renderCurrentCard = () => {
    if (!currentItem || !currentItem.equipmentItem) return null;
    
    const equipment = currentItem.equipmentItem;
    const masterData = equipment.equipmentMaster;
    const soldier = equipment.assignedTo;
    
    return (
      <div 
        className={`carousel-card ${currentItem.status === 'ACCOUNTED_FOR' ? 'accounted-for' : ''}`}
      >
        <div className="carousel-card-header">
          <h3>{masterData ? masterData.commonName : 'Unknown Item'}</h3>
          <div className={`card-status ${currentItem.status === 'ACCOUNTED_FOR' ? 'status-accounted' : 'status-not-accounted'}`}>
            {currentItem.status === 'ACCOUNTED_FOR' ? 'Accounted For' : 
             currentItem.status === 'VERIFICATION_PENDING' ? 'Verification Pending' : 'Not Accounted For'}
          </div>
        </div>
        
        <div className="carousel-card-details">
          <p><strong>NSN:</strong> {equipment.nsn}</p>
          {equipment.serialNumber && <p><strong>Serial Number:</strong> {equipment.serialNumber}</p>}
          <p><strong>Assigned To:</strong> {soldier ? `${soldier.rank} ${soldier.lastName}, ${soldier.firstName}` : 'Unknown'}</p>
          {currentItem.status === 'ACCOUNTED_FOR' && (
            <p><strong>Verification Method:</strong> {currentItem.verificationMethod === 'DIRECT' ? 'Direct' : 'Self Service'}</p>
          )}
          {currentItem.status === 'VERIFICATION_PENDING' && (
            <div className="verification-pending-alert">
              <p><strong>Self-service verification pending</strong></p>
              <p>Requested by {pendingVerification?.verifiedByID || 'a user'}</p>
              <div className="verification-actions">
                <button 
                  className="primary-button"
                  onClick={() => onConfirmVerification(currentItem)}
                  disabled={processing || !online}
                >
                  Confirm Verification
                </button>
                <button 
                  className="secondary-button"
                  onClick={() => onRejectVerification(currentItem)}
                  disabled={processing || !online}
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
        
        {currentItem.status === 'NOT_ACCOUNTED_FOR' && (
          <button 
            className="primary-button"
            onClick={() => handleMarkAsAccountedFor(currentItem)}
            disabled={processing || !online}
          >
            Mark as Accounted For
          </button>
        )}
      </div>
    );
  };
  
  return (
    <div className="accountability-carousel">
      <h2>Accountability Session</h2>
      
      <ConnectivityStatus />
      
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>
      
      <p>{accountedItems} of {totalItems} items accounted for ({progress.toFixed(1)}%)</p>
      
      <div className="carousel-container">
        <div className="carousel-cards">
          {renderCurrentCard()}
        </div>
        
        <div className="carousel-controls">
          <button 
            className="carousel-control-button"
            onClick={goToPrevious}
            disabled={currentIndex === 0}
          >
            Previous
          </button>
          <button 
            className="carousel-control-button"
            onClick={goToNext}
            disabled={currentIndex === items.length - 1}
          >
            Next
          </button>
        </div>
        
        <div className="carousel-pagination">
          {items.map((_, index) => (
            <span 
              key={index}
              className={`pagination-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToIndex(index)}
            ></span>
          ))}
        </div>
      </div>
      
      <div className="action-buttons">
        <button 
          className="primary-button"
          onClick={onCompleteSession}
          disabled={processing || accountedItems === 0 || pendingItems.length > 0}
        >
          Complete Accountability
        </button>
      </div>
    </div>
  );
};

export default AccountabilityCarousel; 