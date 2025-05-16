import React, { useState, useEffect, useRef } from 'react';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { DataStore } from 'aws-amplify/datastore';
import './Pages.css';
import './Accountability.css';

// Import custom hooks
import useHandReceiptedEquipment from '../hooks/useHandReceiptedEquipment';

// Import models for local storage
import { AccountabilitySession, AccountabilityItem, HandReceiptStatus, EquipmentItem, Soldier } from '../models';

// Import DataStore utility
import DataStoreUtil from '../utils/DataStoreSync';

// Import GraphQL queries and mutations
import { accountabilityItemsBySessionID } from '../graphql/queries';
import { createAccountabilitySession, createAccountabilityItem, updateAccountabilityItem, updateAccountabilitySession } from '../graphql/mutations';
import { onUpdateAccountabilityItem } from '../graphql/subscriptions';

// Create client at module level
const client = generateClient();

function Accountability() {
  // Client state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userRole, setUserRole] = useState('');
  const [uicID, setUicID] = useState(null);
  const [userID, setUserID] = useState(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [offlineMode, setOfflineMode] = useState(false);
  const [pendingSyncs, setPendingSyncs] = useState(0);
  
  // Function selection state
  const [activeFunction, setActiveFunction] = useState(null);
  
  // Session management
  const [allSessions, setAllSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionFilter, setSessionFilter] = useState('all');
  
  // Use our custom hook
  const {
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
  
  // Track if initial data has been loaded
  const initialDataLoaded = useRef(false);

  // Load initial data on mount
  useEffect(() => {
    if (!initialDataLoaded.current) {
      loadInitialData();
      initialDataLoaded.current = true;
      
      // Set up online/offline detection
      window.addEventListener('online', handleConnectionChange);
      window.addEventListener('offline', handleConnectionChange);
      
      // Listen for connectivity mode changes from the Header
      window.addEventListener('storage', handleStorageChange);
    }
    
    return () => {
      window.removeEventListener('online', handleConnectionChange);
      window.removeEventListener('offline', handleConnectionChange);
      window.removeEventListener('storage', handleStorageChange);
      
      // Clean up any active subscriptions
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  // Listen for storage events (changes from ConnectivityToggle in Header)
  const handleStorageChange = (event) => {
    if (event.key === 'connectivityMode') {
      const newMode = event.newValue;
      setOfflineMode(newMode === 'offline');
      setOnline(navigator.onLine);
    }
  };

  // Check current connectivity mode on component mount
  useEffect(() => {
    // Get initial mode from localStorage (set by Header component)
    const currentMode = localStorage.getItem('connectivityMode');
    setOfflineMode(currentMode === 'offline');
    
    // Initial check for pending syncs
    if (navigator.onLine && currentMode !== 'offline') {
      checkForPendingSyncs();
    }
  }, [uicID]);

  // Handle online/offline status
  const handleConnectionChange = () => {
    const isOnline = navigator.onLine;
    setOnline(isOnline);
    
    // Check for offline mode (as configured in the Header's toggle)
    const currentOfflineMode = localStorage.getItem('connectivityMode') === 'offline';
    setOfflineMode(currentOfflineMode);
    
    // Only check for syncs if we're online and not in offline mode
    if (isOnline && !currentOfflineMode) {
      checkForPendingSyncs();
    }
  };
  
  // Check for pending local changes that need to be synced
  const checkForPendingSyncs = async () => {
    try {
      if (!online || offlineMode) return;
      
      // Get local models that need syncing
      const localSessions = await DataStore.query(AccountabilitySession, session => 
        session.syncStatus('notSynced')
      );
      
      const localItems = await DataStore.query(AccountabilityItem, item => 
        item.syncStatus('notSynced')
      );
      
      const totalPending = localSessions.length + localItems.length;
      setPendingSyncs(totalPending);
    } catch (error) {
      console.error('Error checking for pending syncs:', error);
    }
  };
  
  // Manual sync function for when user wants to sync data
  const syncLocalData = async () => {
    try {
      if (!online) {
        setError('Cannot sync while offline. Please connect to the internet and try again.');
        return;
      }
      
      setSuccess('');
      setError('');
      
      // Use the DataStoreUtil to handle syncing
      await DataStoreUtil.setConnectivityMode(true);
      
      // Update counters
      await checkForPendingSyncs();
      
      setSuccess('Data synchronized successfully.');
      
      // Reload data from the server to get the latest
      if (uicID) {
        await loadActiveSessions(uicID);
        await loadAllSessions(uicID);
      }
      
      // If no more pending syncs, can disable offline mode
      if (pendingSyncs === 0) {
        setOfflineMode(false);
      }
    } catch (error) {
      console.error('Error syncing data:', error);
      setError('Failed to sync data: ' + error.message);
    }
  };

  // Fetch all required data
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      
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
        setError('You must be assigned to a UIC to view this page.');
        setLoading(false);
        return;
      }
      
      setUicID(userData.uicID);
      setUserID(userData.id);
      setUserRole(userData.role);
      
      // Get the current connectivity mode
      const currentMode = localStorage.getItem('connectivityMode');
      setOfflineMode(currentMode === 'offline');
      
      // Load active accountability sessions after getting UIC ID
      if (userData.uicID) {
        await loadActiveSessions(userData.uicID);
        await loadAllSessions(userData.uicID);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to load data. Please try again.');
      setLoading(false);
    }
  };

  // Load active accountability sessions
  const loadActiveSessions = async (uicId) => {
    try {
      let sessions;
      
      if (offlineMode) {
        // Use DataStore in offline mode to query local data
        sessions = await DataStore.query(
          AccountabilitySession,
          session => session.uicID.eq(uicId).status.eq('ACTIVE')
        );
      } else {
        // Use API in online mode
        const response = await client.graphql({
          query: `query GetActiveSessions($uicID: ID!) {
            accountabilitySessionsByUicID(
              uicID: $uicID,
              filter: { status: { eq: ACTIVE } }
            ) {
              items {
                id
                conductedByID
                startedAt
                itemCount
                accountedForCount
                conductedBy {
                  firstName
                  lastName
                  rank
                }
              }
            }
          }`,
          variables: { uicID: uicId }
        });
        
        sessions = response.data.accountabilitySessionsByUicID.items;
      }
      
      setActiveSessions(sessions);
      return sessions;
    } catch (error) {
      console.error('Error loading active sessions:', error);
      throw error;
    }
  };

  // Load all accountability sessions (both active and completed)
  const loadAllSessions = async (uicId) => {
    try {
      let sessions;
      
      if (offlineMode) {
        // Use DataStore in offline mode to query local data
        sessions = await DataStore.query(
          AccountabilitySession,
          session => session.uicID.eq(uicId)
        );
      } else {
        // Use API in online mode
        const response = await client.graphql({
          query: `query GetAllSessions($uicID: ID!) {
            accountabilitySessionsByUicID(
              uicID: $uicID
            ) {
              items {
                id
                conductedByID
                status
                startedAt
                completedAt
                itemCount
                accountedForCount
                conductedBy {
                  firstName
                  lastName
                  rank
                }
              }
            }
          }`,
          variables: { uicID: uicId }
        });
        
        sessions = response.data.accountabilitySessionsByUicID.items;
      }
      
      // Sort sessions with most recent first
      sessions.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
      setAllSessions(sessions);
      
      return sessions;
    } catch (error) {
      console.error('Error loading all sessions:', error);
      throw error;
    }
  };

  // Load accountability items for a session
  const loadAccountabilityItems = async (sessionId) => {
    try {
      let items;
      
      if (offlineMode) {
        // Use DataStore in offline mode
        items = await DataStore.query(
          AccountabilityItem,
          item => item.sessionID.eq(sessionId)
        );
        
        // In offline mode, we need to fetch equipment item details separately
        // and combine them with the accountability items
        if (items && items.length > 0) {
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            // Find the equipment item in DataStore by ID
            let equipmentItem;
            
            try {
              equipmentItem = await DataStore.query(EquipmentItem, item.equipmentItemID);
            } catch (e) {
              console.warn('Error fetching equipment item:', e);
            }
            
            // If not found in DataStore, check the loaded hand-receipted items
            if (!equipmentItem) {
              equipmentItem = handReceiptedItems.find(e => e.id === item.equipmentItemID);
            }
            
            if (equipmentItem) {
              // Create a similar structure to what the API would return
              items[i] = {
                ...item,
                equipmentItem: {
                  ...equipmentItem,
                  equipmentMaster: masterItems[equipmentItem.equipmentMasterID]
                }
              };
              
              // If we have the soldier data, add it
              if (equipmentItem.assignedToID && soldiersMap[equipmentItem.assignedToID]) {
                items[i].equipmentItem.assignedTo = soldiersMap[equipmentItem.assignedToID];
              }
            }
          }
        }
      } else {
        // Use API in online mode
        const response = await client.graphql({
          query: accountabilityItemsBySessionID,
          variables: {
            sessionID: sessionId
          }
        });
        
        items = response.data.accountabilityItemsBySessionID.items;
      }
      
      setAccountabilityItems(items);
      return items;
    } catch (error) {
      console.error('Error loading accountability items:', error);
      setError('Failed to load equipment data. Please try again.');
      return [];
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

  // Start accountability session
  const startAccountabilitySession = async () => {
    try {
      if (selectedItems.length === 0) {
        setError('Please select at least one item to conduct accountability.');
        return;
      }
      
      setProcessingAction(true);
      setError('');
      setSuccess('');
      
      let session;
      
      if (offlineMode) {
        // Create session in DataStore
        session = await DataStore.save(
          new AccountabilitySession({
            uicID: uicID,
            conductedByID: userID,
            status: 'ACTIVE',
            startedAt: new Date().toISOString(),
            itemCount: selectedItems.length,
            accountedForCount: 0
          })
        );
        
        // Create accountability items in DataStore
        for (const item of selectedItems) {
          await DataStore.save(
            new AccountabilityItem({
              sessionID: session.id,
              equipmentItemID: item.id,
              status: 'NOT_ACCOUNTED_FOR',
              verificationMethod: 'DIRECT'
            })
          );
        }
      } else {
        // Create new session using API
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
        
        session = createResponse.data.createAccountabilitySession;
        
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
      }
      
      // Set active session and switch to carousel view
      setActiveSession(session);
      
      // Load accountability items
      await loadAccountabilityItems(session.id);
      
      // Subscribe to updates if online and not in offline mode
      if (online && !offlineMode) {
        subscribeToItemUpdates(session.id);
      }
      
      setCurrentCardIndex(0);
      setSuccess(`Started accountability session with ${selectedItems.length} items.`);
    } catch (error) {
      console.error('Error starting accountability session:', error);
      setError('Failed to start accountability session. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  };

  // Subscribe to item updates
  const subscribeToItemUpdates = (sessionId) => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }
    
    // Only create subscription if online and not in offline mode
    if (!online || offlineMode) return;
    
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
      setProcessingAction(true);
      
      if (offlineMode) {
        // Update item in DataStore
        try {
          // For items loaded from DataStore, they will have a proper DataStore model structure
          if (item._deleted !== undefined) {
            await DataStore.save(
              AccountabilityItem.copyOf(item, updated => {
                updated.status = 'ACCOUNTED_FOR';
                updated.verificationMethod = method;
                updated.verifiedByID = userID;
                updated.verifiedAt = new Date().toISOString();
              })
            );
          } else {
            // For items from API that may not have proper DataStore structure
            const original = await DataStore.query(AccountabilityItem, item.id);
            if (original) {
              await DataStore.save(
                AccountabilityItem.copyOf(original, updated => {
                  updated.status = 'ACCOUNTED_FOR';
                  updated.verificationMethod = method;
                  updated.verifiedByID = userID;
                  updated.verifiedAt = new Date().toISOString();
                })
              );
            } else {
              // Create a new DataStore item if we can't find the original
              const newItem = new AccountabilityItem({
                id: item.id,
                sessionID: item.sessionID,
                equipmentItemID: item.equipmentItemID,
                status: 'ACCOUNTED_FOR',
                verificationMethod: method,
                verifiedByID: userID,
                verifiedAt: new Date().toISOString()
              });
              await DataStore.save(newItem);
            }
          }
          
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
          
          // Update session in DataStore
          const originalSession = await DataStore.query(AccountabilitySession, activeSession.id);
          if (originalSession) {
            const updatedSession = await DataStore.save(
              AccountabilitySession.copyOf(originalSession, updated => {
                updated.accountedForCount = newCount;
              })
            );
            
            setActiveSession(updatedSession);
          }
        } catch (error) {
          console.error('Error updating item in DataStore:', error);
          setError('Failed to update item status. Please try again.');
          return;
        }
      } else {
        if (!online) {
          setError('You must be online to mark items as accounted for when not in offline mode.');
          return;
        }
        
        // Use API in online mode
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
      }
      
      // Move to next card if available
      if (currentCardIndex < accountabilityItems.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
      }
    } catch (error) {
      console.error('Error marking item as accounted for:', error);
      setError('Failed to update item status. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  };

  // Verify an item via serial number
  const verifyItemBySerialNumber = async () => {
    try {
      if (!serialNumber.trim()) {
        setError('Please enter a serial number.');
        return;
      }
      
      setProcessingAction(true);
      setError('');
      
      if (offlineMode) {
        // Handle verification in offline mode
        // Query all active sessions from DataStore
        const allSessions = await DataStore.query(
          AccountabilitySession, 
          session => session.uicID.eq(uicID).status.eq('ACTIVE')
        );
        
        // Loop through sessions to find matching items
        let foundMatch = false;
        
        for (const session of allSessions) {
          // Get all items for this session
          const sessionItems = await DataStore.query(
            AccountabilityItem,
            item => item.sessionID.eq(session.id)
          );
          
          // For each item, find the matching equipment item
          for (const accountabilityItem of sessionItems) {
            // First check in DataStore for equipment item
            let matchingEquipment = null;
            
            try {
              // Query all equipment items
              const equipmentItems = await DataStore.query(
                EquipmentItem,
                item => item.serialNumber.eq(serialNumber)
              );
              
              // Find matching item that is also in this accountability session
              matchingEquipment = equipmentItems.find(
                item => item.id === accountabilityItem.equipmentItemID &&
                accountabilityItem.status !== 'ACCOUNTED_FOR'
              );
            } catch (e) {
              console.warn('Error querying equipment items:', e);
            }
            
            // If not found in DataStore, check handReceiptedItems
            if (!matchingEquipment) {
              matchingEquipment = handReceiptedItems.find(item => 
                item.id === accountabilityItem.equipmentItemID && 
                item.serialNumber?.toLowerCase() === serialNumber.toLowerCase() &&
                accountabilityItem.status !== 'ACCOUNTED_FOR'
              );
            }
            
            if (matchingEquipment) {
              // We found a match that's in this accountability session
              // Mark as accounted for in DataStore
              await DataStore.save(
                AccountabilityItem.copyOf(accountabilityItem, updated => {
                  updated.status = 'ACCOUNTED_FOR';
                  updated.verificationMethod = 'SELF_SERVICE';
                  updated.verifiedByID = userID;
                  updated.verifiedAt = new Date().toISOString();
                })
              );
              
              // Update session counter
              const originalSession = await DataStore.query(AccountabilitySession, session.id);
              if (originalSession) {
                await DataStore.save(
                  AccountabilitySession.copyOf(originalSession, updated => {
                    updated.accountedForCount = originalSession.accountedForCount + 1;
                  })
                );
              }
              
              foundMatch = true;
              setSuccess(`Successfully verified item with serial number ${serialNumber}`);
              break;
            }
          }
          
          if (foundMatch) break;
        }
        
        if (!foundMatch) {
          setError(`No matching item found with serial number ${serialNumber}`);
        }
      } else {
        // Online mode - use API
        if (!online) {
          setError('You must be online to verify items when not in offline mode.');
          return;
        }
        
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
            // Mark the item as accounted for
            await client.graphql({
              query: updateAccountabilityItem,
              variables: {
                input: {
                  id: matchingItems[0].id,
                  status: 'ACCOUNTED_FOR',
                  verificationMethod: 'SELF_SERVICE',
                  verifiedByID: userID,
                  verifiedAt: new Date().toISOString(),
                  _version: matchingItems[0]._version
                }
              }
            });
            
            setSuccess(`Successfully verified item with serial number ${serialNumber}`);
            setSerialNumber('');
            return;
          }
        }
        
        // If we get here, no matching item was found
        setError(`No matching item found with serial number ${serialNumber}`);
      }
      
      setSerialNumber('');
    } catch (error) {
      console.error('Error verifying item:', error);
      setError('Failed to verify item. Please try again.');
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
      
      if (offlineMode) {
        // Update session in DataStore
        const original = await DataStore.query(AccountabilitySession, activeSession.id);
        if (original) {
          await DataStore.save(
            AccountabilitySession.copyOf(original, updated => {
              updated.status = 'COMPLETED';
              updated.completedAt = new Date().toISOString();
            })
          );
        }
      } else {
        // Update session status to COMPLETED using API
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
      }
      
      // Show summary modal
      setModalContent('summary');
      setShowModal(true);
      
      // Refresh active sessions list
      await loadActiveSessions(uicID);
      
      // Check for pending syncs if we're offline but connected
      if (offlineMode && online) {
        checkForPendingSyncs();
      }
    } catch (error) {
      console.error('Error completing session:', error);
      setError('Failed to complete accountability session. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  };

  // Build summary data for reporting
  const buildSummaryData = () => {
    // Group by nomenclature
    const groupedByNomenclature = {};
    
    accountabilityItems.forEach(item => {
      // Get item details - item structure differs between online/offline mode
      let equipmentMaster, serialNumber, itemName;
      
      if (item.equipmentItem) {
        // Online mode or already populated offline item
        equipmentMaster = item.equipmentItem.equipmentMaster;
        serialNumber = item.equipmentItem.serialNumber;
      } else if (item.equipmentItemID) {
        // Unpopulated offline item - try to get details from handReceiptedItems
        const equipment = handReceiptedItems.find(e => e.id === item.equipmentItemID);
        if (equipment) {
          equipmentMaster = masterItems[equipment.equipmentMasterID];
          serialNumber = equipment.serialNumber;
        }
      }
      
      // Get item name from available data sources
      itemName = (equipmentMaster?.commonName || 'Unknown Item') + 
        (serialNumber ? ` (${serialNumber})` : '');
      
      if (!groupedByNomenclature[itemName]) {
        groupedByNomenclature[itemName] = {
          total: 0,
          accountedFor: 0,
          notAccountedFor: 0
        };
      }
      
      groupedByNomenclature[itemName].total++;
      
      if (item.status === 'ACCOUNTED_FOR') {
        groupedByNomenclature[itemName].accountedFor++;
      } else {
        groupedByNomenclature[itemName].notAccountedFor++;
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
    
    // Reload hand-receipted equipment
    filterAndSortEquipment(uicID);
  };

  // Get filtered and sorted equipment
  const filteredAndSortedEquipment = () => {
    return filterAndSortEquipment(searchTerm, filterBySoldier, sortBy, keepGrouped);
  };

  // Render a single carousel card
  const renderCarouselCard = (item, index) => {
    if (!item) return null;
    
    // Get the equipment details - different structure in offline vs online mode
    let equipment, masterData, soldier;
    
    if (item.equipmentItem) {
      // Online mode or already populated offline item
      equipment = item.equipmentItem;
      masterData = equipment.equipmentMaster;
      soldier = equipment.assignedTo;
    } else if (item.equipmentItemID) {
      // Unpopulated offline item - get data from handReceiptedItems
      equipment = handReceiptedItems.find(e => e.id === item.equipmentItemID);
      if (equipment) {
        masterData = masterItems[equipment.equipmentMasterID];
        soldier = soldiersMap[equipment.assignedToID];
      }
    }
    
    // If we still can't get equipment details, show placeholder
    if (!equipment) {
      equipment = { nsn: 'Unknown', serialNumber: '' };
      masterData = { commonName: 'Unknown Item' };
      soldier = null;
    }
    
    const statusClass = item.status === 'ACCOUNTED_FOR' ? 'accounted-for' : 'not-accounted-for';
    
    return (
      <div 
        key={item.id} 
        className={`carousel-card ${statusClass}`}
        style={{display: index === currentCardIndex ? 'flex' : 'none'}}
      >
        <div className="carousel-card-header">
          <h3>{masterData ? masterData.commonName : 'Unknown Item'}</h3>
          <div className={`card-status ${item.status === 'ACCOUNTED_FOR' ? 'status-accounted' : 'status-not-accounted'}`}>
            {item.status === 'ACCOUNTED_FOR' ? 'Accounted For' : 'Not Accounted For'}
          </div>
        </div>
        
        <div className="carousel-card-details">
          <p><strong>NSN:</strong> {equipment.nsn}</p>
          {equipment.serialNumber && <p><strong>Serial Number:</strong> {equipment.serialNumber}</p>}
          <p><strong>Assigned To:</strong> {soldier ? `${soldier.rank} ${soldier.lastName}, ${soldier.firstName}` : 'Unknown'}</p>
          {item.status === 'ACCOUNTED_FOR' && (
            <p><strong>Verification Method:</strong> {item.verificationMethod === 'DIRECT' ? 'Direct' : 'Self Service'}</p>
          )}
        </div>
        
        {item.status !== 'ACCOUNTED_FOR' && (
          <button 
            className="primary-button"
            onClick={() => markItemAsAccountedFor(item)}
            disabled={processingAction}
          >
            Mark as Accounted For
          </button>
        )}
      </div>
    );
  };

  // Render the self-service verification interface
  const renderSelfServiceVerification = () => {
    return (
      <div className="self-service-verification">
        <h2>Verify Your Equipment</h2>
        
        <div className="connectivity-controls">
          <div className={`connectivity-status ${online ? 'status-online' : 'status-offline'}`}>
            <div className={`status-indicator ${online ? 'indicator-online' : 'indicator-offline'}`}></div>
            <span>{online ? 'Online' : 'Offline'}</span>
          </div>
          
          <div className="offline-mode-indicator">
            <span>Working in {offlineMode ? 'Offline' : 'Online'} Mode</span>
            {offlineMode && pendingSyncs > 0 && online && (
              <button 
                className="sync-button"
                onClick={syncLocalData}
              >
                Sync Data ({pendingSyncs} pending)
              </button>
            )}
          </div>
        </div>
        
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
        
        <div className="verification-form">
          <div className="input-group">
            <label htmlFor="serialNumber">Enter Item Serial Number:</label>
            <input
              id="serialNumber"
              type="text"
              placeholder="Enter serial number..."
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              disabled={activeSessions.length === 0}
            />
          </div>
          
          <button 
            className="primary-button"
            onClick={verifyItemBySerialNumber}
            disabled={activeSessions.length === 0 || !serialNumber.trim() || processingAction}
          >
            Verify Item
          </button>
        </div>
      </div>
    );
  };

  // Render the summary modal
  const renderSummaryModal = () => {
    if (!summaryData) return null;
    
    const { items, total, accountedFor, percentComplete, completedAt } = summaryData;
    const dateCompleted = new Date(completedAt).toLocaleString();
    
    return (
      <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Accountability Results</h2>
            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
          </div>
          
          <div className="summary-results">
            <h3>Completed on {dateCompleted}</h3>
            
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${percentComplete}%` }}></div>
            </div>
            
            <p>{accountedFor} of {total} items accounted for ({percentComplete.toFixed(1)}%)</p>
            
            <h3>Results by Item Type</h3>
            
            {items.map((item, index) => (
              <div key={index} className="summary-item">
                <div className="summary-item-name">{item.nomenclature}</div>
                <div className="summary-item-stats">
                  {item.accountedFor}/{item.total}
                </div>
              </div>
            ))}
            
            <div className="summary-total">
              <div className="summary-item-name">Total</div>
              <div className="summary-item-stats">
                {accountedFor}/{total}
              </div>
            </div>
            
            <div className="action-buttons">
              <button 
                className="primary-button"
                onClick={resetAccountabilitySession}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Resume an existing accountability session
  const resumeAccountabilitySession = async (sessionId) => {
    try {
      setProcessingAction(true);
      setError('');
      setSuccess('');
      
      let session;
      
      if (offlineMode) {
        // Get session from DataStore
        session = await DataStore.query(AccountabilitySession, sessionId);
        
        if (!session || session.status !== 'ACTIVE') {
          throw new Error('Can only resume active sessions');
        }
      } else {
        // Get the session details from API
        const sessionResponse = await client.graphql({
          query: `query GetSession($id: ID!) {
            getAccountabilitySession(id: $id) {
              id
              uicID
              conductedByID
              status
              startedAt
              completedAt
              itemCount
              accountedForCount
              _version
            }
          }`,
          variables: { id: sessionId }
        });
        
        session = sessionResponse.data.getAccountabilitySession;
        
        if (!session || session.status !== 'ACTIVE') {
          throw new Error('Can only resume active sessions');
        }
      }
      
      // Set active session
      setActiveSession(session);
      setSelectedSession(null);
      
      // Load accountability items
      await loadAccountabilityItems(session.id);
      
      // Subscribe to updates if online and not in offline mode
      if (online && !offlineMode) {
        subscribeToItemUpdates(session.id);
      }
      
      setCurrentCardIndex(0);
      setSuccess(`Resumed accountability session`);
    } catch (error) {
      console.error('Error resuming accountability session:', error);
      setError('Failed to resume accountability session. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  };
  
  // View summary of a completed session
  const viewCompletedSession = async (sessionId) => {
    try {
      setProcessingAction(true);
      setError('');
      
      // Load accountability items for summary
      const items = await loadAccountabilityItems(sessionId);
      
      // Create summary data from items
      const summary = buildSummaryDataFromItems(items);
      setSummaryData(summary);
      
      // Show summary modal
      setModalContent('summary');
      setShowModal(true);
      setSelectedSession(null);
    } catch (error) {
      console.error('Error viewing completed session:', error);
      setError('Failed to load session summary. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  };
  
  // Build summary data from provided items
  const buildSummaryDataFromItems = (items) => {
    const groupedByNomenclature = {};
    
    items.forEach(item => {
      // Get item details - item structure differs between online/offline mode
      let equipmentMaster, serialNumber, itemName;
      
      if (item.equipmentItem) {
        // Online mode or populated offline item
        equipmentMaster = item.equipmentItem.equipmentMaster;
        serialNumber = item.equipmentItem.serialNumber;
      } else if (item.equipmentItemID) {
        // Unpopulated offline item - try to get details from handReceiptedItems
        const equipment = handReceiptedItems.find(e => e.id === item.equipmentItemID);
        if (equipment) {
          equipmentMaster = masterItems[equipment.equipmentMasterID];
          serialNumber = equipment.serialNumber;
        }
      }
      
      // Get item name from available data sources
      itemName = (equipmentMaster?.commonName || 'Unknown Item') + 
        (serialNumber ? ` (${serialNumber})` : '');
      
      if (!groupedByNomenclature[itemName]) {
        groupedByNomenclature[itemName] = {
          total: 0,
          accountedFor: 0,
          notAccountedFor: 0
        };
      }
      
      groupedByNomenclature[itemName].total++;
      
      if (item.status === 'ACCOUNTED_FOR') {
        groupedByNomenclature[itemName].accountedFor++;
      } else {
        groupedByNomenclature[itemName].notAccountedFor++;
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
      accountedFor: accountedFor,
      percentComplete: totalItems > 0 ? (accountedFor / totalItems) * 100 : 0,
      completedAt: new Date().toISOString()
    };
  };

  // Render the accountability reports interface
  const renderAccountabilityReports = () => {
    // Filter sessions based on status
    const filteredSessions = sessionFilter === 'all' ? 
      allSessions : 
      allSessions.filter(session => session.status === sessionFilter);
    
    return (
      <div className="accountability-reports">
        <h2>Accountability Reports</h2>
        
        <div className="connectivity-controls">
          <div className={`connectivity-status ${online ? 'status-online' : 'status-offline'}`}>
            <div className={`status-indicator ${online ? 'indicator-online' : 'indicator-offline'}`}></div>
            <span>{online ? 'Online' : 'Offline'}</span>
          </div>
          
          <div className="offline-mode-indicator">
            <span>Working in {offlineMode ? 'Offline' : 'Online'} Mode</span>
            {pendingSyncs > 0 && online && (
              <button 
                className="sync-button"
                onClick={syncLocalData}
              >
                Sync Data ({pendingSyncs} pending)
              </button>
            )}
          </div>
        </div>
        
        <div className="session-filter">
          <button 
            className={sessionFilter === 'all' ? 'active' : ''}
            onClick={() => setSessionFilter('all')}
          >
            All Sessions
          </button>
          <button 
            className={sessionFilter === 'ACTIVE' ? 'active' : ''}
            onClick={() => setSessionFilter('ACTIVE')}
          >
            Active Sessions
          </button>
          <button 
            className={sessionFilter === 'COMPLETED' ? 'active' : ''}
            onClick={() => setSessionFilter('COMPLETED')}
          >
            Completed Sessions
          </button>
        </div>
        
        {filteredSessions.length === 0 ? (
          <p>No {sessionFilter !== 'all' ? sessionFilter.toLowerCase() : ''} accountability sessions found.</p>
        ) : (
          <div className="session-list">
            {filteredSessions.map(session => {
              // Calculate progress percentage
              const progressPercent = session.itemCount > 0 
                ? (session.accountedForCount / session.itemCount) * 100 
                : 0;
              
              // Format dates
              const startDate = new Date(session.startedAt).toLocaleString();
              const completedDate = session.completedAt 
                ? new Date(session.completedAt).toLocaleString() 
                : 'Not completed';
              
              // Get conductor name
              const conductorName = session.conductedBy 
                ? `${session.conductedBy.rank} ${session.conductedBy.lastName}`
                : 'Unknown';
              
              return (
                <div key={session.id} className={`session-item session-${session.status.toLowerCase()}`}>
                  <div className="session-header">
                    <h3>Session {session.id.slice(-6)}</h3>
                    <span className={`session-status status-${session.status.toLowerCase()}`}>
                      {session.status}
                    </span>
                  </div>
                  
                  <div className="session-info">
                    <p><strong>Conducted By:</strong> {conductorName}</p>
                    <p><strong>Started:</strong> {startDate}</p>
                    {session.status === 'COMPLETED' && <p><strong>Completed:</strong> {completedDate}</p>}
                    
                    <div className="session-progress-info">
                      <p>
                        <strong>Progress:</strong> {session.accountedForCount} of {session.itemCount} items accounted for
                      </p>
                      <div className="session-progress">
                        <div className="session-progress-bar" style={{ width: `${progressPercent}%` }}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="action-buttons">
                    {session.status === 'ACTIVE' && (
                      <button 
                        className="primary-button"
                        onClick={() => resumeAccountabilitySession(session.id)}
                      >
                        Resume Session
                      </button>
                    )}
                    {session.status === 'COMPLETED' && (
                      <button 
                        className="primary-button"
                        onClick={() => viewCompletedSession(session.id)}
                      >
                        View Report
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Render accountability carousel
  const renderAccountabilityCarousel = () => {
    if (!activeSession) return null;
    
    const totalItems = accountabilityItems.length;
    const accountedItems = accountabilityItems.filter(item => item.status === 'ACCOUNTED_FOR').length;
    const progress = totalItems > 0 ? (accountedItems / totalItems) * 100 : 0;
    
    return (
      <div className="accountability-carousel">
        <h2>Accountability Session</h2>
        
        <div className="connectivity-controls">
          <div className={`connectivity-status ${online ? 'status-online' : 'status-offline'}`}>
            <div className={`status-indicator ${online ? 'indicator-online' : 'indicator-offline'}`}></div>
            <span>{online ? 'Online' : 'Offline'}</span>
          </div>
          
          <div className="offline-mode-indicator">
            <span>Working in {offlineMode ? 'Offline' : 'Online'} Mode</span>
          </div>
        </div>
        
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
        
        <p>{accountedItems} of {totalItems} items accounted for ({progress.toFixed(1)}%)</p>
        
        <div className="carousel-container">
          <div className="carousel-cards">
            {accountabilityItems.map((item, index) => renderCarouselCard(item, index))}
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
          
          {offlineMode && online && pendingSyncs > 0 && (
            <button 
              className="sync-button"
              onClick={syncLocalData}
            >
              Sync Data ({pendingSyncs} pending)
            </button>
          )}
        </div>
      </div>
    );
  };

  // Render the equipment selection interface
  const renderEquipmentSelection = () => {
    const sortedItems = filteredAndSortedEquipment();
    
    return (
      <div className="equipment-selection">
        <div className="connectivity-controls">
          <div className={`connectivity-status ${online ? 'status-online' : 'status-offline'}`}>
            <div className={`status-indicator ${online ? 'indicator-online' : 'indicator-offline'}`}></div>
            <span>{online ? 'Online' : 'Offline'}</span>
          </div>
          
          <div className="offline-mode-indicator">
            <span>Working in {offlineMode ? 'Offline' : 'Online'} Mode</span>
            {pendingSyncs > 0 && online && (
              <button 
                className="sync-button"
                onClick={syncLocalData}
              >
                Sync Data ({pendingSyncs} pending)
              </button>
            )}
          </div>
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <label>Search:</label>
            <input
              type="text"
              placeholder="Search equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>Filter by Soldier:</label>
            <select
              value={filterBySoldier}
              onChange={(e) => setFilterBySoldier(e.target.value)}
            >
              <option value="all">All Soldiers</option>
              {Object.values(soldiersMap).map(soldier => (
                <option key={soldier.id} value={soldier.id}>
                  {soldier.rank} {soldier.lastName}, {soldier.firstName}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Sort By:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="nomenclature">Nomenclature</option>
              <option value="assignedTo">Assigned To</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>
              <input
                type="checkbox"
                checked={keepGrouped}
                onChange={(e) => setKeepGrouped(e.target.checked)}
              />
              Keep grouped items together
            </label>
          </div>
        </div>
        
        <div className="equipment-list">
          <div className="equipment-table-header">
            <div className="checkbox-cell">
              <input 
                type="checkbox" 
                checked={selectedItems.length > 0 && selectedItems.length === handReceiptedItems.length}
                onChange={() => {
                  if (selectedItems.length === handReceiptedItems.length) {
                    setSelectedItems([]);
                  } else {
                    setSelectedItems([...handReceiptedItems]);
                  }
                }}
              />
            </div>
            <div className="equipment-name">Item</div>
            <div className="equipment-nsn">NSN</div>
            <div className="equipment-serial">Serial #</div>
            <div className="equipment-soldier">Assigned To</div>
          </div>
          
          {/* Groups section */}
          {sortBy === 'nomenclature' && keepGrouped && groups.map(group => {
            const groupItems = getGroupItems(group.id);
            const filteredGroupItems = groupItems.filter(item => {
              // Safely access masterItems to avoid null issues
              const masterItem = item.equipmentMasterID && (item.equipmentMasterID in masterItems) ? 
                masterItems[item.equipmentMasterID] : null;
              const commonName = masterItem?.commonName || '';
              
              const inSearchTerm = searchTerm === '' ||
                commonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.nsn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
              
              const matchesSoldierFilter = filterBySoldier === 'all' || item.assignedToID === filterBySoldier;
              
              return inSearchTerm && matchesSoldierFilter;
            });
            
            if (filteredGroupItems.length === 0) return null;
            
            const isExpanded = expandedGroups[group.id];
            
            return (
              <div key={group.id} className="equipment-group">
                <div className="equipment-group-header" onClick={() => toggleGroupExpansion(group.id)}>
                  <div className="expand-icon">{isExpanded ? '▼' : '►'}</div>
                  <div className="group-name">{group.name}</div>
                  <div className="group-count">{filteredGroupItems.length} items</div>
                </div>
                
                {isExpanded && (
                  <div className="equipment-group-items">
                    {filteredGroupItems.map(item => {
                      // Safely access masterItems
                      const masterItem = item.equipmentMasterID && (item.equipmentMasterID in masterItems) ? 
                        masterItems[item.equipmentMasterID] : null;
                      const soldier = soldiersMap[item.assignedToID];
                      const isSelected = selectedItems.some(i => i.id === item.id);
                      
                      return (
                        <div 
                          key={item.id} 
                          className={`equipment-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleItemSelection(item)}
                        >
                          <div className="checkbox-cell">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => {}} // Handled by row click
                            />
                          </div>
                          <div className="equipment-name">{masterItem ? masterItem.commonName : `Item ${item.nsn}`}</div>
                          <div className="equipment-nsn">{item.nsn}</div>
                          <div className="equipment-serial">{item.serialNumber || '-'}</div>
                          <div className="equipment-soldier">
                            {soldier ? `${soldier.rank} ${soldier.lastName}, ${soldier.firstName}` : '-'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Individual items */}
          {sortBy === 'nomenclature' && keepGrouped ? (
            // Show only non-grouped items when keeping groups together
            sortedItems
              .filter(item => !item.isPartOfGroup || !item.groupID)
              .map(item => {
                // Safely access masterItems
                const masterItem = item.equipmentMasterID && (item.equipmentMasterID in masterItems) ? 
                  masterItems[item.equipmentMasterID] : null;
                const soldier = soldiersMap[item.assignedToID];
                const isSelected = selectedItems.some(i => i.id === item.id);
                
                return (
                  <div 
                    key={item.id} 
                    className={`equipment-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleItemSelection(item)}
                  >
                    <div className="checkbox-cell">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => {}} // Handled by row click
                      />
                    </div>
                    <div className="equipment-name">{masterItem ? masterItem.commonName : `Item ${item.nsn}`}</div>
                    <div className="equipment-nsn">{item.nsn}</div>
                    <div className="equipment-serial">{item.serialNumber || '-'}</div>
                    <div className="equipment-soldier">
                      {soldier ? `${soldier.rank} ${soldier.lastName}, ${soldier.firstName}` : '-'}
                    </div>
                  </div>
                );
              })
          ) : (
            // Show all items in sort order when not keeping groups together
            sortedItems.map(item => {
              // Safely access masterItems
              const masterItem = item.equipmentMasterID && (item.equipmentMasterID in masterItems) ? 
                masterItems[item.equipmentMasterID] : null;
              const soldier = soldiersMap[item.assignedToID];
              const isSelected = selectedItems.some(i => i.id === item.id);
              
              return (
                <div 
                  key={item.id} 
                  className={`equipment-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleItemSelection(item)}
                >
                  <div className="checkbox-cell">
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => {}} // Handled by row click
                    />
                  </div>
                  <div className="equipment-name">{masterItem ? masterItem.commonName : `Item ${item.nsn}`}</div>
                  <div className="equipment-nsn">{item.nsn}</div>
                  <div className="equipment-serial">{item.serialNumber || '-'}</div>
                  <div className="equipment-soldier">
                    {soldier ? `${soldier.rank} ${soldier.lastName}, ${soldier.firstName}` : '-'}
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <div className="action-buttons">
          <button 
            className="primary-button"
            onClick={startAccountabilitySession}
            disabled={selectedItems.length === 0 || processingAction}
          >
            Conduct Accountability
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="page-container">
      <h1>Accountability</h1>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      {loading ? (
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
              <button 
                className={`function-button ${activeFunction === 'reports' ? 'active' : ''}`}
                onClick={() => {
                  setActiveFunction('reports');
                  loadAllSessions(uicID); // Refresh the sessions list
                }}
              >
                View Accountability Reports
              </button>
            </div>
          )}
          
          {/* Main content area */}
          {!activeFunction && !activeSession ? (
            <p>Select a function above to get started.</p>
          ) : activeSession ? (
            renderAccountabilityCarousel()
          ) : activeFunction === 'supplySergeant' ? (
            renderEquipmentSelection()
          ) : activeFunction === 'endUser' ? (
            renderSelfServiceVerification()
          ) : activeFunction === 'reports' ? (
            renderAccountabilityReports()
          ) : (
            <p>Unknown function selected.</p>
          )}
          
          {/* Modals */}
          {showModal && modalContent === 'summary' && renderSummaryModal()}
        </div>
      )}
    </div>
  );
}

export default Accountability; 