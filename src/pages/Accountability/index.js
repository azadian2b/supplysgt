import React, { useState, useEffect, useRef } from 'react';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import SupplySergeantView from './components/SupplySergeant';
import EndUserView from './components/EndUser';
import '../Pages.css';
import './Accountability.css';

// Import hooks
import useHandReceiptedEquipment from '../../hooks/useHandReceiptedEquipment';

// Import GraphQL queries and mutations
import { accountabilityItemsBySessionID, accountabilitySessionsByUicID } from '../../graphql/queries';
import { createAccountabilitySession, createAccountabilityItem, updateAccountabilityItem, updateAccountabilitySession } from '../../graphql/mutations';
import { onUpdateAccountabilityItem } from '../../graphql/subscriptions';

/**
 * Main Accountability page component
 */
const Accountability = () => {
  // Client state
  const client = generateClient();
  const [initialLoading, setInitialLoading] = useState(true); // Tracks initial user/UIC loading
  const [pageError, setPageError] = useState(''); // Combined error state
  const [success, setSuccess] = useState('');
  const [userRole, setUserRole] = useState('');
  const [uicID, setUicID] = useState(null);
  const [userID, setUserID] = useState(null);
  const [online, setOnline] = useState(navigator.onLine);
  
  // Function selection state
  const [activeFunction, setActiveFunction] = useState(null);
  
  // Use our custom hook for equipment data
  const {
    loading: equipmentLoading, // Rename loading state from hook
    error: equipmentError, // Rename error state from hook
    handReceiptedItems,
    soldiersMap,
    groups,
    groupsMap,
    masterItems,
    getGroupItems,
    filterAndSortEquipment
  } = useHandReceiptedEquipment(uicID);
  
  // Selection and filtering state
  const [selectedItems, setSelectedItems] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBySoldier, setFilterBySoldier] = useState('all');
  const [sortBy, setSortBy] = useState('nomenclature');
  const [keepGrouped, setKeepGrouped] = useState(true);
  
  // Accountability session state
  const [activeSession, setActiveSession] = useState(null);
  const [accountabilityItems, setAccountabilityItems] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [processingAction, setProcessingAction] = useState(false);
  
  // Self-service state
  const [serialNumber, setSerialNumber] = useState('');
  const [activeSessions, setActiveSessions] = useState([]);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState('verification');
  
  // Summary state
  const [summaryData, setSummaryData] = useState(null);
  
  // Subscription ref
  const subscriptionRef = useRef(null);

  // Load initial user/UIC data
  useEffect(() => {
    loadInitialUserData();
    
    // Set up online/offline detection
    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);
    
    return () => {
      window.removeEventListener('online', handleConnectionChange);
      window.removeEventListener('offline', handleConnectionChange);
      
      // Clean up any active subscriptions
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []); // Run only once on mount

  // Update page error state when hook error changes
  useEffect(() => {
    if (equipmentError) {
      setPageError(equipmentError);
    }
  }, [equipmentError]);

  // Handle online/offline status
  const handleConnectionChange = () => {
    setOnline(navigator.onLine);
  };

  // Fetch initial user data and active sessions
  const loadInitialUserData = async () => {
    try {
      setInitialLoading(true);
      setPageError('');
      
      // Get current user and UIC
      const { username } = await getCurrentUser();
      
      const userResponse = await client.graphql({
        query: `query GetUserByOwner($owner: String!) {
          usersByOwner(owner: $owner, limit: 1) {
            items {
              id
              uicID
              role
            }
          }
        }`,
        variables: { owner: username }
      });
      
      const userData = userResponse.data.usersByOwner.items[0];
      if (!userData || !userData.uicID) {
        setPageError('You must be assigned to a UIC to view this page.');
        setInitialLoading(false);
        return;
      }
      
      setUicID(userData.uicID);
      setUserID(userData.id);
      setUserRole(userData.role);
      
      // Load active accountability sessions after getting UIC ID
      await loadActiveSessions(userData.uicID);
      
      setInitialLoading(false);
    } catch (error) {
      console.error('Error loading initial user data:', error);
      setPageError('Failed to load user data. Please try again.');
      setInitialLoading(false);
    }
  };

  // Load active accountability sessions (now separate)
  const loadActiveSessions = async (uicId) => {
    try {
      const response = await client.graphql({
        query: accountabilitySessionsByUicID,
        variables: { 
          uicID: uicId, 
          filter: { status: { eq: 'ACTIVE' } }
        }
      });
      
      const sessions = response.data.accountabilitySessionsByUicID.items;
      setActiveSessions(sessions);
      
      return sessions;
    } catch (error) {
      console.error('Error loading active sessions:', error);
      // Don't set page error here, maybe just log or handle differently
      // setPageError('Failed to load active sessions.'); 
      throw error; // Re-throw if needed elsewhere
    }
  };

  // Toggle selection of an item
  const toggleItemSelection = (item) => {
    if (selectedItems.some(i => i.id === item.id)) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  // Toggle expansion of a group
  const toggleGroupExpansion = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Get filtered and sorted equipment
  const filteredAndSortedEquipment = () => {
    return filterAndSortEquipment(searchTerm, filterBySoldier, sortBy, keepGrouped);
  };

  // Start accountability session
  const startAccountabilitySession = async () => {
    try {
      if (selectedItems.length === 0) {
        setPageError('Please select at least one item to conduct accountability.');
        return;
      }
      
      setProcessingAction(true);
      setPageError('');
      setSuccess('');
      
      // Create new session
      const createResponse = await client.graphql({
        query: createAccountabilitySession,
        variables: {
          input: {
            uicID: uicID,
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
      
      // Set active session and switch to carousel view
      setActiveSession(session);
      
      // Load accountability items
      await loadAccountabilityItems(session.id);
      
      // Subscribe to updates
      subscribeToItemUpdates(session.id);
      
      setCurrentCardIndex(0);
      setSuccess(`Started accountability session with ${selectedItems.length} items.`);
    } catch (error) {
      console.error('Error starting accountability session:', error);
      setPageError('Failed to start accountability session. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  };

  // Load accountability items for a session
  const loadAccountabilityItems = async (sessionId) => {
    try {
      const response = await client.graphql({
        query: accountabilityItemsBySessionID,
        variables: {
          sessionID: sessionId
        }
      });
      
      const items = response.data.accountabilityItemsBySessionID.items;
      setAccountabilityItems(items);
      
      return items;
    } catch (error) {
      console.error('Error loading accountability items:', error);
      throw error;
    }
  };

  // Subscribe to item updates
  const subscribeToItemUpdates = (sessionId) => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }
    
    const subscription = client.graphql({
      query: onUpdateAccountabilityItem,
      filter: {
        sessionID: {
          eq: sessionId
        }
      }
    }).subscribe({
      next: ({ data }) => {
        const updatedItem = data.onUpdateAccountabilityItem;
        
        setAccountabilityItems(prev => 
          prev.map(item => 
            item.id === updatedItem.id ? updatedItem : item
          )
        );
        
        // Update session stats
        const accountedForCount = accountabilityItems.filter(item => 
          item.status === 'ACCOUNTED_FOR'
        ).length;
        
        setActiveSession(prev => ({
          ...prev,
          accountedForCount
        }));
      },
      error: (error) => console.error('Subscription error:', error)
    });
    
    subscriptionRef.current = subscription;
  };

  // Mark item as accounted for
  const markItemAsAccountedFor = async (item, method = 'DIRECT') => {
    try {
      if (!online) {
        setPageError('You must be online to mark items as accounted for.');
        return;
      }
      
      setProcessingAction(true);
      
      await client.graphql({
        query: updateAccountabilityItem,
        variables: {
          input: {
            id: item.id,
            status: 'ACCOUNTED_FOR',
            verificationMethod: method,
            verifiedByID: userID,
            verifiedAt: new Date().toISOString(),
            _version: item._version
          }
        }
      });
      
      // Update local state
      setAccountabilityItems(prev => 
        prev.map(i => 
          i.id === item.id 
            ? {...i, status: 'ACCOUNTED_FOR', verificationMethod: method, verifiedByID: userID} 
            : i
        )
      );
      
      // Update session stats
      const newCount = accountabilityItems.filter(i => 
        i.id === item.id ? true : i.status === 'ACCOUNTED_FOR'
      ).length;
      
      await client.graphql({
        query: updateAccountabilitySession,
        variables: {
          input: {
            id: activeSession.id,
            accountedForCount: newCount,
            _version: activeSession._version
          }
        }
      });
      
      setActiveSession(prev => ({
        ...prev,
        accountedForCount: newCount,
        _version: prev._version + 1
      }));
      
      // Move to next card if available
      if (currentCardIndex < accountabilityItems.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
      }
    } catch (error) {
      console.error('Error marking item as accounted for:', error);
      setPageError('Failed to update item status. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  };

  // Confirm or reject a verification status
  const confirmVerificationStatus = async (item, isConfirmed = true) => {
    try {
      if (!online) {
        setPageError('You must be online to confirm verification status.');
        return;
      }
      
      setProcessingAction(true);
      
      // Set the new status based on confirmation
      const newStatus = isConfirmed ? 'ACCOUNTED_FOR' : 'NOT_ACCOUNTED_FOR';
      const confirmationStatus = isConfirmed ? 'CONFIRMED' : 'FAILED';
      
      await client.graphql({
        query: updateAccountabilityItem,
        variables: {
          input: {
            id: item.id,
            status: newStatus,
            confirmationStatus: confirmationStatus,
            confirmedAt: new Date().toISOString(),
            _version: item._version
          }
        }
      });
      
      // Update local state
      setAccountabilityItems(prev => 
        prev.map(i => 
          i.id === item.id 
            ? {...i, 
                status: newStatus, 
                confirmationStatus: confirmationStatus,
                confirmedAt: new Date().toISOString()
              } 
            : i
        )
      );
      
      // Update session stats if the item was confirmed
      if (isConfirmed) {
        const newCount = accountabilityItems.filter(i => 
          i.id === item.id ? true : i.status === 'ACCOUNTED_FOR'
        ).length;
        
        await client.graphql({
          query: updateAccountabilitySession,
          variables: {
            input: {
              id: activeSession.id,
              accountedForCount: newCount,
              _version: activeSession._version
            }
          }
        });
        
        setActiveSession(prev => ({
          ...prev,
          accountedForCount: newCount,
          _version: prev._version + 1
        }));
      }
      
      // Show success message
      setSuccess(isConfirmed 
        ? `Item verification confirmed.` 
        : `Item verification rejected.`
      );
      
      // Move to next card if available
      if (currentCardIndex < accountabilityItems.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
      }
    } catch (error) {
      console.error('Error confirming verification status:', error);
      setPageError('Failed to update verification status. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  };

  // Verify an item via serial number
  const verifyItemBySerialNumber = async () => {
    try {
      if (!online) {
        setPageError('You must be online to verify items.');
        return;
      }
      
      if (!serialNumber.trim()) {
        setPageError('Please enter a serial number.');
        return;
      }
      
      setProcessingAction(true);
      setPageError('');
      
      // Find the item in any active session
      for (const session of activeSessions) {
        const itemsResponse = await client.graphql({
          query: accountabilityItemsBySessionID,
          variables: {
            sessionID: session.id
          }
        });
        
        const sessionItems = itemsResponse.data.accountabilityItemsBySessionID.items;
        
        // Find matching item
        const matchingItems = sessionItems.filter(item => 
          item.equipmentItem?.serialNumber?.toLowerCase() === serialNumber.toLowerCase() &&
          item.status === 'NOT_ACCOUNTED_FOR'
        );
        
        if (matchingItems.length > 0) {
          // Set item status to VERIFICATION_PENDING for supply sergeant to confirm
          await client.graphql({
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
          
          setSuccess(`Successfully submitted item with serial number ${serialNumber} for verification.`);
          setSerialNumber('');
          return;
        }
      }
      
      // If we get here, no matching item was found
      setPageError(`No matching item found with serial number ${serialNumber}`);
    } catch (error) {
      console.error('Error verifying item:', error);
      setPageError('Failed to verify item. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  };

  // Complete the accountability session
  const completeAccountabilitySession = async () => {
    try {
      setProcessingAction(true);
      
      // Build summary data
      const summary = buildSummaryData();
      setSummaryData(summary);
      
      // Update session status to COMPLETED
      await client.graphql({
        query: updateAccountabilitySession,
        variables: {
          input: {
            id: activeSession.id,
            status: 'COMPLETED',
            completedAt: new Date().toISOString(),
            _version: activeSession._version
          }
        }
      });
      
      // Show summary modal
      setModalContent('summary');
      setShowModal(true);
      
      // Refresh active sessions list
      await loadActiveSessions(uicID);
    } catch (error) {
      console.error('Error completing session:', error);
      setPageError('Failed to complete accountability session. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  };

  // Build summary data for reporting
  const buildSummaryData = () => {
    // Group by nomenclature
    const groupedByNomenclature = {};
    
    accountabilityItems.forEach(item => {
      const nomenclature = masterItems[item.equipmentItem.equipmentMasterID]?.commonName || 'Unknown Item';
      
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
    const totalItems = accountabilityItems.length;
    const totalAccountedFor = accountabilityItems.filter(item => item.status === 'ACCOUNTED_FOR').length;
    
    return {
      items: summaryArray,
      total: totalItems,
      accountedFor: totalAccountedFor,
      percentComplete: totalItems > 0 ? (totalAccountedFor / totalItems) * 100 : 0,
      completedAt: new Date().toISOString()
    };
  };

  // Reset the accountability session
  const resetAccountabilitySession = () => {
    // Clean up and reset state
    setActiveSession(null);
    setAccountabilityItems([]);
    setSelectedItems([]);
    setCurrentCardIndex(0);
    setSummaryData(null);
    setShowModal(false);
    
    // Clean up subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
  };

  // Determine overall loading state
  const isLoading = initialLoading || equipmentLoading;

  return (
    <div className="page-container">
      <h1>Accountability</h1>
      
      {pageError && <div className="error-message">{pageError}</div>}
      {success && <div className="success-message">{success}</div>}
      
      {isLoading ? (
        <div className="loading">Loading data...</div>
      ) : (
        <div className="accountability-container">
          {/* Function selection buttons */}
          {!activeSession && (
            <div className="function-selection">
              <button 
                className={`function-button ${activeFunction === 'supplySergeant' ? 'active' : ''}`}
                onClick={() => setActiveFunction('supplySergeant')}
              >
                Supply Sergeant Functions
              </button>
              <button 
                className={`function-button ${activeFunction === 'endUser' ? 'active' : ''}`}
                onClick={() => setActiveFunction('endUser')}
              >
                Verify Your Equipment
              </button>
            </div>
          )}
          
          {/* Main content area */}
          {!activeFunction && !activeSession ? (
            <p>Select a function above to get started.</p>
          ) : activeSession ? (
            // Render Accountability Carousel (using accountabilityItems state)
            <div className="accountability-carousel">
              <h2>Accountability Session</h2>
              
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${(accountabilityItems.filter(item => item.status === 'ACCOUNTED_FOR').length / accountabilityItems.length) * 100}%` }}></div>
              </div>
              
              <p>{accountabilityItems.filter(item => item.status === 'ACCOUNTED_FOR').length} of {accountabilityItems.length} items accounted for ({accountabilityItems.length > 0 ? ((accountabilityItems.filter(item => item.status === 'ACCOUNTED_FOR').length / accountabilityItems.length) * 100).toFixed(1) : 0}%)</p>
              
              <div className="carousel-container">
                <div className="carousel-cards">
                  {accountabilityItems.map((item, index) => {
                    if (!item || !item.equipmentItem) return null;
                    
                    const equipment = item.equipmentItem;
                    const masterData = masterItems[equipment.equipmentMasterID];
                    const soldier = soldiersMap[equipment.assignedToID];
                    
                    // Determine status class
                    let statusClass = '';
                    let statusText = '';
                    
                    if (item.status === 'ACCOUNTED_FOR') {
                      statusClass = 'status-accounted';
                      statusText = 'Accounted For';
                    } else if (item.status === 'VERIFICATION_PENDING') {
                      statusClass = 'status-pending';
                      statusText = 'Verification Pending';
                    } else {
                      statusClass = 'status-not-accounted';
                      statusText = 'Not Accounted For';
                    }
                    
                    return (
                      <div 
                        key={item.id} 
                        className={`carousel-card ${statusClass}`}
                        style={{display: index === currentCardIndex ? 'block' : 'none'}}
                      >
                        <div className="carousel-card-header">
                          <h3>{masterData ? masterData.commonName : 'Unknown Item'}</h3>
                          <div className={`card-status ${statusClass}`}>
                            {statusText}
                          </div>
                        </div>
                        
                        <div className="carousel-card-details">
                          <p><strong>NSN:</strong> {equipment.nsn}</p>
                          <p><strong>LIN:</strong> {equipment.lin || 'N/A'}</p>
                          <p><strong>Serial Number:</strong> {equipment.serialNumber || 'N/A'}</p>
                          <p><strong>Stock Number:</strong> {equipment.stockNumber || 'N/A'}</p>
                          <p><strong>Assigned To:</strong> {soldier ? `${soldier.rank} ${soldier.lastName}, ${soldier.firstName}` : 'Unknown'}</p>
                          
                          {item.status === 'ACCOUNTED_FOR' && (
                            <p><strong>Verification Method:</strong> {item.verificationMethod === 'DIRECT' ? 'Direct' : 'Self Service'}</p>
                          )}
                          
                          {item.status === 'VERIFICATION_PENDING' && (
                            <p><strong>Self-reported:</strong> Yes, awaiting confirmation</p>
                          )}
                        </div>
                        
                        <div className="carousel-card-actions">
                          {item.status === 'NOT_ACCOUNTED_FOR' && (
                            <button 
                              className="primary-button"
                              onClick={() => markItemAsAccountedFor(item)}
                              disabled={processingAction || !online}
                            >
                              Mark as Accounted For
                            </button>
                          )}
                          
                          {item.status === 'VERIFICATION_PENDING' && (
                            <div className="verification-buttons">
                              <button 
                                className="confirm-button"
                                onClick={() => confirmVerificationStatus(item, true)}
                                disabled={processingAction || !online}
                              >
                                Confirm
                              </button>
                              <button 
                                className="reject-button"
                                onClick={() => confirmVerificationStatus(item, false)}
                                disabled={processingAction || !online}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="carousel-controls">
                  <button 
                    className="carousel-control-button"
                    onClick={() => setCurrentCardIndex(Math.max(0, currentCardIndex - 1))}
                    disabled={currentCardIndex === 0}
                  >
                    Previous
                  </button>
                  <button 
                    className="carousel-control-button"
                    onClick={() => setCurrentCardIndex(Math.min(accountabilityItems.length - 1, currentCardIndex + 1))}
                    disabled={currentCardIndex === accountabilityItems.length - 1}
                  >
                    Next
                  </button>
                </div>
                
                <div className="carousel-pagination">
                  {accountabilityItems.map((_, index) => (
                    <span 
                      key={index}
                      className={`pagination-dot ${index === currentCardIndex ? 'active' : ''}`}
                      onClick={() => setCurrentCardIndex(index)}
                    ></span>
                  ))}
                </div>
              </div>
              
              <div className="action-buttons">
                <button 
                  className="primary-button"
                  onClick={completeAccountabilitySession}
                  disabled={processingAction}
                >
                  Complete Accountability
                </button>
              </div>
            </div>
          ) : activeFunction === 'supplySergeant' ? (
            // Pass necessary props from hook and state
            <SupplySergeantView 
              uicID={uicID} 
              userID={userID} 
              handReceiptedItems={handReceiptedItems}
              soldiersMap={soldiersMap}
              groups={groups}
              groupsMap={groupsMap}
              masterItems={masterItems}
              getGroupItems={getGroupItems}
              filterAndSortEquipment={filterAndSortEquipment}
              selectedItems={selectedItems}
              setSelectedItems={setSelectedItems}
              expandedGroups={expandedGroups}
              toggleGroupExpansion={toggleGroupExpansion}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterBySoldier={filterBySoldier}
              setFilterBySoldier={setFilterBySoldier}
              sortBy={sortBy}
              setSortBy={setSortBy}
              keepGrouped={keepGrouped}
              setKeepGrouped={setKeepGrouped}
              startAccountabilitySession={startAccountabilitySession}
              processingAction={processingAction}
            />
          ) : (
            // Pass necessary props from state
            <EndUserView 
              uicID={uicID} 
              userID={userID} 
              activeSessions={activeSessions}
              online={online}
              serialNumber={serialNumber}
              setSerialNumber={setSerialNumber}
              verifyItemBySerialNumber={verifyItemBySerialNumber}
              processingAction={processingAction}
            />
          )}
          
          {/* Modals - Add logic to render based on showModal and modalContent */}
          {showModal && modalContent === 'summary' && 
            <div>{/* Placeholder for Summary Modal */}</div>
          }
        </div>
      )}
    </div>
  );
};

export default Accountability; 