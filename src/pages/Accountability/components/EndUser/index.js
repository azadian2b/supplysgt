import React, { useState, useEffect, useRef } from 'react';
import VerificationForm from './VerificationForm';
import VerificationStatusList from './VerificationStatusList';
import useAccountabilitySession from '../../hooks/useAccountabilitySession';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import { generateClient } from 'aws-amplify/api';
import { onUpdateAccountabilityItem } from '../../../../graphql/subscriptions';

/**
 * Container component for the End User accountability flow
 */
const EndUserView = ({ uicID, userID }) => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [completedVerifications, setCompletedVerifications] = useState([]);

  // Subscription reference for cleanup
  const verificationSubscriptionRef = useRef(null);
  
  // Get online status
  const online = useOnlineStatus();
  
  // Accountability session functionality
  const accountabilitySession = useAccountabilitySession(uicID, userID);
  const client = generateClient();
  
  // Set up subscription for verification updates
  useEffect(() => {
    if (online && userID) {
      subscribeToVerificationUpdates();
    }
    
    return () => {
      if (verificationSubscriptionRef.current) {
        verificationSubscriptionRef.current.unsubscribe();
      }
    };
  }, [online, userID, accountabilitySession.activeSessions]);
  
  // Subscribe to verification status updates
  const subscribeToVerificationUpdates = () => {
    if (verificationSubscriptionRef.current) {
      verificationSubscriptionRef.current.unsubscribe();
    }
    
    // Subscribe to any updates where this user is the verifier
    const subscription = client.graphql({
      query: onUpdateAccountabilityItem,
      filter: {
        verifiedByID: { eq: userID }
      }
    }).subscribe({
      next: ({ data }) => {
        const updatedItem = data.onUpdateAccountabilityItem;
        
        // If status changed from VERIFICATION_PENDING to something else
        if (updatedItem.status !== 'VERIFICATION_PENDING') {
          // Remove from pending list
          setPendingVerifications(prev => 
            prev.filter(item => item.id !== updatedItem.id)
          );
          
          // Add to completed list
          setCompletedVerifications(prev => {
            // Check if it's already in the list
            const exists = prev.some(item => item.id === updatedItem.id);
            if (!exists) {
              return [updatedItem, ...prev];
            }
            return prev.map(item => 
              item.id === updatedItem.id ? updatedItem : item
            );
          });
          
          // Show success or error message based on confirmation status
          if (updatedItem.confirmationStatus === 'CONFIRMED') {
            setSuccess(`Verification for item ${updatedItem.equipmentItem?.serialNumber || 'unknown'} has been confirmed!`);
          } else if (updatedItem.confirmationStatus === 'FAILED') {
            setError(`Verification for item ${updatedItem.equipmentItem?.serialNumber || 'unknown'} was rejected.`);
          }
        } 
        // If it's a new pending verification or update to an existing one
        else if (updatedItem.status === 'VERIFICATION_PENDING') {
          setPendingVerifications(prev => {
            // Check if it's already in the list
            const exists = prev.some(item => item.id === updatedItem.id);
            if (!exists) {
              return [...prev, updatedItem];
            }
            return prev.map(item => 
              item.id === updatedItem.id ? updatedItem : item
            );
          });
        }
      },
      error: (error) => console.error('Verification subscription error:', error)
    });
    
    verificationSubscriptionRef.current = subscription;
  };
  
  // Handle verifying an item by serial number
  const handleVerifyItem = async (serialNumber) => {
    if (!online) {
      throw new Error('You must be online to verify items.');
    }
    
    setError('');
    
    try {
      const result = await accountabilitySession.verifyItemBySerialNumber(serialNumber);
      setSuccess(`Verification for item ${serialNumber} has been submitted. Waiting for confirmation.`);
      
      // Add to pending verifications
      setPendingVerifications(prev => [...prev, result]);
      
      return result;
    } catch (error) {
      console.error('Error verifying item:', error);
      setError(error.message || 'Failed to verify item. Please try again.');
      throw error;
    }
  };
  
  // Clear success/error messages after a delay
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [success, error]);
  
  return (
    <div className="end-user-view">
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <VerificationForm
        activeSessions={accountabilitySession.activeSessions}
        onVerifyItem={handleVerifyItem}
        loading={accountabilitySession.processing}
        online={online}
      />
      
      {/* Show verification status list if there are any pending or completed verifications */}
      {(pendingVerifications.length > 0 || completedVerifications.length > 0) && (
        <VerificationStatusList 
          pendingVerifications={pendingVerifications}
          completedVerifications={completedVerifications}
          masterItems={accountabilitySession.masterItems}
        />
      )}
    </div>
  );
};

export default EndUserView; 