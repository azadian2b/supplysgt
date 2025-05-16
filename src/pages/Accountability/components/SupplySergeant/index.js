import React, { useState } from 'react';
import EquipmentSelect from './EquipmentSelect';
import AccountabilityCarousel from './AccountabilityCarousel';
import SummaryResults from './SummaryResults';
import useHandReceiptedEquipment from '../../hooks/useHandReceiptedEquipment';
import useAccountabilitySession from '../../hooks/useAccountabilitySession';
import useOnlineStatus from '../../hooks/useOnlineStatus';

/**
 * Container component for the Supply Sergeant accountability flow
 */
const SupplySergeantView = ({ uicID, userID }) => {
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  
  // Get online status
  const online = useOnlineStatus();
  
  // Equipment data
  const equipmentData = useHandReceiptedEquipment(uicID);
  
  // Accountability session management
  const accountabilitySession = useAccountabilitySession(uicID, userID);
  
  // Start a new accountability session
  const handleStartAccountability = async (selectedItems) => {
    try {
      await accountabilitySession.startAccountabilitySession(selectedItems);
    } catch (error) {
      console.error('Error starting accountability session:', error);
    }
  };
  
  // Mark an item as accounted for
  const handleMarkAsAccountedFor = async (item) => {
    try {
      await accountabilitySession.markItemAsAccountedFor(item);
    } catch (error) {
      console.error('Error marking item as accounted for:', error);
    }
  };
  
  // Confirm a pending verification
  const handleConfirmVerification = async (item) => {
    try {
      await accountabilitySession.confirmVerificationStatus(item, true);
    } catch (error) {
      console.error('Error confirming verification:', error);
    }
  };
  
  // Reject a pending verification
  const handleRejectVerification = async (item) => {
    try {
      await accountabilitySession.confirmVerificationStatus(item, false);
    } catch (error) {
      console.error('Error rejecting verification:', error);
    }
  };
  
  // Complete the accountability session
  const handleCompleteSession = async () => {
    try {
      // Generate summary data
      const summary = accountabilitySession.buildSummaryData(accountabilitySession.accountabilityItems);
      setSummaryData(summary);
      
      // Complete the session
      await accountabilitySession.completeAccountabilitySession(accountabilitySession.activeSession.id);
      
      // Show summary
      setShowSummary(true);
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };
  
  // Handle closing the summary
  const handleCloseSummary = () => {
    setShowSummary(false);
    setSummaryData(null);
  };
  
  // Determine which view to show
  const renderContent = () => {
    if (accountabilitySession.activeSession) {
      return (
        <AccountabilityCarousel
          items={accountabilitySession.accountabilityItems}
          onMarkAsAccountedFor={handleMarkAsAccountedFor}
          onConfirmVerification={handleConfirmVerification}
          onRejectVerification={handleRejectVerification}
          onCompleteSession={handleCompleteSession}
          processing={accountabilitySession.processing}
          pendingItems={accountabilitySession.pendingItems}
          online={online}
        />
      );
    } else {
      return (
        <EquipmentSelect
          equipment={equipmentData}
          onStartAccountability={handleStartAccountability}
          loading={accountabilitySession.processing || equipmentData.loading}
        />
      );
    }
  };
  
  return (
    <div className="supply-sergeant-view">
      {equipmentData.loading ? (
        <div className="loading">Loading equipment data...</div>
      ) : equipmentData.error ? (
        <div className="error-message">{equipmentData.error}</div>
      ) : (
        renderContent()
      )}
      
      {/* Summary modal */}
      {showSummary && (
        <SummaryResults
          summaryData={summaryData}
          onClose={handleCloseSummary}
        />
      )}
    </div>
  );
};

export default SupplySergeantView; 