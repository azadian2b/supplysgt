import { useState, useEffect, useRef } from 'react';
import { generateClient } from 'aws-amplify/api';
import { 
  createAccountabilitySession, 
  createAccountabilityItem, 
  updateAccountabilitySession,
  updateAccountabilityItem
} from '../../../graphql/mutations';
import { 
  accountabilitySessionsByUIC,
  accountabilityItemsBySessionID
} from '../../../graphql/queries';
import { 
  onUpdateAccountabilityItem
} from '../../../graphql/subscriptions';

/**
 * Custom hook to manage accountability sessions
 * @param {string} uicID The UIC ID
 * @param {string} userID The current user ID
 * @returns {Object} Accountability session management functions and state
 */
const useAccountabilitySession = (uicID, userID) => {
  const [activeSession, setActiveSession] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
  const [accountabilityItems, setAccountabilityItems] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [pendingItems, setPendingItems] = useState([]);
  const client = generateClient();
  
  // Refs for subscription cleanup
  const itemUpdateSubscriptionRef = useRef(null);
  
  // Load active sessions for UIC
  useEffect(() => {
    if (uicID) {
      loadActiveSessions();
    }
    
    return () => {
      // Clean up any subscriptions
      if (itemUpdateSubscriptionRef.current) {
        itemUpdateSubscriptionRef.current.unsubscribe();
      }
    };
  }, [uicID]);
  
  // Load active accountability sessions
  const loadActiveSessions = async () => {
    if (!uicID) return;
    
    try {
      const response = await client.graphql({
        query: accountabilitySessionsByUIC,
        variables: {
          uicID,
          filter: { status: { eq: 'ACTIVE' } }
        }
      });
      
      const sessions = response.data.accountabilitySessionsByUIC.items;
      setActiveSessions(sessions);
      return sessions;
    } catch (error) {
      console.error('Error loading active sessions:', error);
      throw error;
    }
  };
  
  // Start a new accountability session
  const startAccountabilitySession = async (selectedItems) => {
    if (!selectedItems || selectedItems.length === 0) {
      throw new Error('No items selected');
    }
    
    setProcessing(true);
    
    try {
      // Create new session
      const createResponse = await client.graphql({
        query: createAccountabilitySession,
        variables: {
          input: {
            uicID,
            conductedByID: userID,
            status: 'ACTIVE',
            startedAt: new Date().toISOString(),
            itemCount: selectedItems.length,
            accountedForCount: 0
          }
        }
      });
      
      const session = createResponse.data.createAccountabilitySession;
      
      // Create accountability items for each selected item
      for (const item of selectedItems) {
        await client.graphql({
          query: createAccountabilityItem,
          variables: {
            input: {
              sessionID: session.id,
              equipmentItemID: item.id,
              status: 'NOT_ACCOUNTED_FOR',
              verificationMethod: 'DIRECT'
            }
          }
        });
      }
      
      // Set active session
      setActiveSession(session);
      
      // Load accountability items
      await loadAccountabilityItems(session.id);
      
      // Subscribe to updates
      subscribeToItemUpdates(session.id);
      
      // Refresh active sessions list
      await loadActiveSessions();
      
      return session;
    } catch (error) {
      console.error('Error starting accountability session:', error);
      throw error;
    } finally {
      setProcessing(false);
    }
  };
  
  // Load accountability items for a session
  const loadAccountabilityItems = async (sessionId) => {
    if (!sessionId) return [];
    
    try {
      const response = await client.graphql({
        query: accountabilityItemsBySessionID,
        variables: {
          sessionID: sessionId
        }
      });
      
      const items = response.data.accountabilityItemsBySessionID.items;
      setAccountabilityItems(items);
      
      // Update pending items
      const pending = items.filter(item => item.status === 'VERIFICATION_PENDING');
      setPendingItems(pending);
      
      return items;
    } catch (error) {
      console.error('Error loading accountability items:', error);
      throw error;
    }
  };
  
  // Subscribe to item updates
  const subscribeToItemUpdates = (sessionId) => {
    if (itemUpdateSubscriptionRef.current) {
      itemUpdateSubscriptionRef.current.unsubscribe();
    }
    
    const subscription = client.graphql({
      query: onUpdateAccountabilityItem,
      filter: {
        sessionID: { eq: sessionId }
      }
    }).subscribe({
      next: ({ data }) => {
        const updatedItem = data.onUpdateAccountabilityItem;
        
        // Update items in state
        setAccountabilityItems(prev => 
          prev.map(item => 
            item.id === updatedItem.id ? updatedItem : item
          )
        );
        
        // Update session stats
        updateSessionStats(sessionId);
      },
      error: (error) => console.error('Subscription error:', error)
    });
    
    itemUpdateSubscriptionRef.current = subscription;
  };
  
  // Mark item as accounted for directly
  const markItemAsAccountedFor = async (item) => {
    if (!item) return null;
    
    setProcessing(true);
    
    try {
      const result = await client.graphql({
        query: updateAccountabilityItem,
        variables: {
          input: {
            id: item.id,
            status: 'ACCOUNTED_FOR',
            verificationMethod: 'DIRECT',
            verifiedByID: userID,
            verifiedAt: new Date().toISOString(),
            confirmationStatus: 'CONFIRMED',
            confirmedAt: new Date().toISOString(),
            _version: item._version
          }
        }
      });
      
      // Update session stats
      await updateSessionStats(item.sessionID);
      
      return result.data.updateAccountabilityItem;
    } catch (error) {
      console.error('Error marking item as accounted for:', error);
      throw error;
    } finally {
      setProcessing(false);
    }
  };
  
  // Handle verification from end user
  const verifyItemBySerialNumber = async (serialNumber, sessionId = null) => {
    if (!serialNumber || (!sessionId && activeSessions.length === 0)) {
      throw new Error('Serial number or active session required');
    }
    
    setProcessing(true);
    
    try {
      // If no specific session is provided, search all active sessions
      const sessionsToSearch = sessionId ? 
        [{ id: sessionId }] : activeSessions;
      
      for (const session of sessionsToSearch) {
        // Load items for this session if not already loaded
        const sessionItems = await loadAccountabilityItems(session.id);
        
        // Find matching item by serial number
        const matchingItems = sessionItems.filter(item => 
          item.equipmentItem?.serialNumber?.toLowerCase() === serialNumber.toLowerCase() &&
          item.status === 'NOT_ACCOUNTED_FOR'
        );
        
        if (matchingItems.length > 0) {
          // Update item status to VERIFICATION_PENDING
          const updatedItem = await client.graphql({
            query: updateAccountabilityItem,
            variables: {
              input: {
                id: matchingItems[0].id,
                status: 'VERIFICATION_PENDING',
                verificationMethod: 'SELF_SERVICE',
                verifiedByID: userID,
                verifiedAt: new Date().toISOString(),
                confirmationStatus: 'PENDING',
                _version: matchingItems[0]._version
              }
            }
          });
          
          return updatedItem.data.updateAccountabilityItem;
        }
      }
      
      // If we get here, no matching item was found
      throw new Error(`No matching item found with serial number ${serialNumber}`);
    } catch (error) {
      console.error('Error verifying item:', error);
      throw error;
    } finally {
      setProcessing(false);
    }
  };
  
  // Confirm a pending verification
  const confirmVerificationStatus = async (item, isConfirmed = true) => {
    if (!item) return null;
    
    setProcessing(true);
    
    try {
      const status = isConfirmed ? 'ACCOUNTED_FOR' : 'NOT_ACCOUNTED_FOR';
      const confirmStatus = isConfirmed ? 'CONFIRMED' : 'FAILED';
      const confirmedAt = new Date().toISOString();
      
      const result = await client.graphql({
        query: updateAccountabilityItem,
        variables: {
          input: {
            id: item.id,
            status,
            confirmationStatus: confirmStatus,
            confirmedAt,
            _version: item._version
          }
        }
      });
      
      // Update pendingItems state
      setPendingItems(prev => prev.filter(i => i.id !== item.id));
      
      // Update session stats
      await updateSessionStats(item.sessionID);
      
      return result.data.updateAccountabilityItem;
    } catch (error) {
      console.error('Error confirming verification:', error);
      throw error;
    } finally {
      setProcessing(false);
    }
  };
  
  // Update session statistics
  const updateSessionStats = async (sessionId) => {
    if (!sessionId) return;
    
    try {
      // Reload items to get accurate count
      const items = await loadAccountabilityItems(sessionId);
      
      // Count accounted for items
      const accountedForCount = items.filter(item => 
        item.status === 'ACCOUNTED_FOR'
      ).length;
      
      // Update session with new count
      if (activeSession && activeSession.id === sessionId) {
        await client.graphql({
          query: updateAccountabilitySession,
          variables: {
            input: {
              id: sessionId,
              accountedForCount,
              _version: activeSession._version
            }
          }
        });
        
        // Update local state
        setActiveSession(prev => ({
          ...prev,
          accountedForCount,
          _version: prev._version + 1
        }));
      }
    } catch (error) {
      console.error('Error updating session stats:', error);
    }
  };
  
  // Complete an accountability session
  const completeAccountabilitySession = async (sessionId) => {
    if (!sessionId) return null;
    
    setProcessing(true);
    
    try {
      const session = activeSession?.id === sessionId ? 
        activeSession : 
        activeSessions.find(s => s.id === sessionId);
        
      if (!session) {
        throw new Error('Session not found');
      }
      
      const result = await client.graphql({
        query: updateAccountabilitySession,
        variables: {
          input: {
            id: sessionId,
            status: 'COMPLETED',
            completedAt: new Date().toISOString(),
            _version: session._version
          }
        }
      });
      
      // If this was the active session, clear it
      if (activeSession?.id === sessionId) {
        setActiveSession(null);
      }
      
      // Refresh active sessions list
      await loadActiveSessions();
      
      return result.data.updateAccountabilitySession;
    } catch (error) {
      console.error('Error completing session:', error);
      throw error;
    } finally {
      setProcessing(false);
    }
  };
  
  // Create summary data for reporting
  const buildSummaryData = (items) => {
    if (!items || items.length === 0) return null;
    
    // Group by nomenclature
    const groupedByNomenclature = {};
    
    items.forEach(item => {
      if (!item.equipmentItem?.equipmentMaster) return;
      
      const nomenclature = item.equipmentItem.equipmentMaster.commonName || 'Unknown Item';
      
      if (!groupedByNomenclature[nomenclature]) {
        groupedByNomenclature[nomenclature] = {
          total: 0,
          accountedFor: 0,
          notAccountedFor: 0
        };
      }
      
      groupedByNomenclature[nomenclature].total++;
      
      if (item.status === 'ACCOUNTED_FOR') {
        groupedByNomenclature[nomenclature].accountedFor++;
      } else {
        groupedByNomenclature[nomenclature].notAccountedFor++;
      }
    });
    
    // Create summary array
    const summaryArray = Object.entries(groupedByNomenclature).map(([nomenclature, stats]) => ({
      nomenclature,
      ...stats
    }));
    
    // Get totals
    const totalItems = items.length;
    const accountedFor = items.filter(item => item.status === 'ACCOUNTED_FOR').length;
    
    return {
      items: summaryArray,
      total: totalItems,
      accountedFor,
      percentComplete: totalItems > 0 ? (accountedFor / totalItems) * 100 : 0,
      completedAt: new Date().toISOString()
    };
  };
  
  return {
    activeSession,
    activeSessions,
    accountabilityItems,
    pendingItems,
    processing,
    loadActiveSessions,
    loadAccountabilityItems,
    startAccountabilitySession,
    markItemAsAccountedFor,
    verifyItemBySerialNumber,
    confirmVerificationStatus,
    completeAccountabilitySession,
    buildSummaryData
  };
};

export default useAccountabilitySession; 