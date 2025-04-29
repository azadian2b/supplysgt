import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { deleteEquipmentItem, updateEquipmentItem } from '../../graphql/mutations';
import { DataStore } from '@aws-amplify/datastore';
import DataStoreUtil from '../../utils/DataStoreSync';
import DataInspector from '../../utils/DataInspector';
import './Equipment.css';

function InventoryList({ onBack }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('lin');
  const [sortDirection, setSortDirection] = useState('asc');
  const [uicID, setUicID] = useState(null);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState([]);
  const [selectedItemsToDelete, setSelectedItemsToDelete] = useState({});
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [isOnlineMode, setIsOnlineMode] = useState(localStorage.getItem('connectivityMode') !== 'offline');
  const [showOrphanedItemsModal, setShowOrphanedItemsModal] = useState(false);
  const [orphanedItems, setOrphanedItems] = useState([]);
  const [processingOrphans, setProcessingOrphans] = useState(false);
  const client = generateClient();

  // Effect to clear messages after a timeout
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        if (success) setSuccess('');
        if (error) setError('');
      }, 5000); // Clear after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Check for connectivity mode changes
  useEffect(() => {
    const checkConnectivityMode = () => {
      const mode = localStorage.getItem('connectivityMode');
      setIsOnlineMode(mode !== 'offline');
    };
    
    // Initial check
    checkConnectivityMode();
    
    // Set up event listener for storage changes
    window.addEventListener('storage', checkConnectivityMode);
    
    // Clean up the event listener
    return () => {
      window.removeEventListener('storage', checkConnectivityMode);
    };
  }, []);

  // Load inventory based on connectivity mode
  useEffect(() => {
    if (isOnlineMode) {
      fetchDirectFromAPI();
    } else {
      fetchFromLocalDataStore();
    }
  }, [isOnlineMode]);

  // Fetch data from local DataStore (offline mode)
  const fetchFromLocalDataStore = async () => {
    try {
      setLoading(true);
      setInventory([]); // Clear existing inventory
      
      // Get the current user
      const { username } = await getCurrentUser();
      
      // Query users to find the UIC ID
      const userResponse = await client.graphql({
        query: `query GetUserByOwner($owner: String!) {
          usersByOwner(owner: $owner, limit: 1) {
            items {
              id
              uicID
            }
          }
        }`,
        variables: { owner: username }
      });
      
      const userData = userResponse.data.usersByOwner.items[0];
      if (!userData || !userData.uicID) {
        setError('You must be assigned to a UIC to view inventory.');
        setLoading(false);
        return;
      }
      
      setUicID(userData.uicID);
      
      // Import the models
      const { EquipmentItem, Soldier } = await import('../../models');
      
      // Use DataStore to get equipment items from local storage
      console.log('Querying local DataStore for EquipmentItem with uicID:', userData.uicID);
      const items = await DataStore.query(
        EquipmentItem, 
        item => item.uicID.eq(userData.uicID)
      );
      console.log('Local DataStore items:', items.length, items);
      
      // Load soldiers from DataStore to handle assignments
      let soldiersMap = {};
      try {
        const soldiers = await DataStore.query(
          Soldier,
          soldier => soldier.uicID.eq(userData.uicID)
        );
        
        soldiers.forEach(soldier => {
          soldiersMap[soldier.id] = soldier;
        });
        console.log('Local DataStore soldiers:', soldiers.length);
      } catch (error) {
        console.error('Error loading soldiers from DataStore:', error);
      }
      
      if (items.length === 0) {
        console.log('No items found in local DataStore. Checking if we need to load from API first...');
        
        // If we don't have any items locally but we do have internet connection,
        // we could attempt to load from the API once
        if (navigator.onLine) {
          const shouldFetch = window.confirm(
            'No items found in local storage. Would you like to load items from the backend once before going offline?'
          );
          
          if (shouldFetch) {
            // Temporarily set to online mode
            const connectivityMode = localStorage.getItem('connectivityMode');
            try {
              localStorage.setItem('connectivityMode', 'online');
              await DataStore.start();
              await fetchDirectFromAPI();
              return; // Exit after fetching from API
            } finally {
              // Restore offline mode
              localStorage.setItem('connectivityMode', connectivityMode);
              if (connectivityMode === 'offline') {
                await DataStore.stop();
              }
            }
          }
        }
      }
      
      // Process these items to add master data (from whatever is in local DataStore)
      const processedItems = items.map(item => {
        // Add soldier information if assigned
        let assignedToName = null;
        if (item.assignedToID && soldiersMap[item.assignedToID]) {
          const soldier = soldiersMap[item.assignedToID];
          assignedToName = `${soldier.rank || ''} ${soldier.lastName}, ${soldier.firstName}`;
        }
        
        // Extract only the fields we need for display and handle potential nulls
        return {
          id: item.id,
          uicID: item.uicID,
          equipmentMasterID: item.equipmentMasterID,
          nsn: item.nsn || '',
          lin: item.lin || '',
          serialNumber: item.serialNumber || '',
          stockNumber: item.stockNumber || '',
          location: item.location || '',
          assignedToID: item.assignedToID || null,
          assignedToName: assignedToName,
          maintenanceStatus: item.maintenanceStatus || 'OPERATIONAL',
          isPartOfGroup: item.isPartOfGroup || false,
          groupID: item.groupID || null,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          _version: item._version,
          _deleted: item._deleted,
          _lastChangedAt: item._lastChangedAt,
          // Add these fields to avoid UI errors
          commonName: item.commonName || `Item ${item.nsn || ''}`,
          isSerialTracked: false,
          isSensitiveItem: false,
          isConsumable: false
        };
      });
      
      console.log('Setting inventory with local data:', processedItems.length, 'items');
      setInventory(processedItems);
    } catch (error) {
      console.error('Error fetching from local DataStore:', error);
      setError(`Failed to load inventory from local storage: ${error.message}. Try enabling online mode.`);
    } finally {
      setLoading(false);
    }
  };

  // Function to clear DataStore and force a fresh sync
  const handleSyncData = async () => {
    // Only allow sync in online mode
    if (!isOnlineMode) {
      alert('Cannot sync in offline mode. Please switch to connected mode first.');
      return;
    }
    
    try {
      setSyncInProgress(true);
      setLoading(true);
      setInventory([]); // Clear inventory in state immediately
      
      // Use our utility to clear and sync DataStore
      await DataStoreUtil.clearAndSync();
      
      // Use the direct API fetch method for consistency
      await fetchDirectFromAPI();
      
      setSyncInProgress(false);
      alert('Data successfully synced with backend. Your inventory should now be up-to-date.');
    } catch (error) {
      console.error('Error syncing data:', error);
      setError('Failed to sync data. Please try again.');
      setSyncInProgress(false);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to force a complete refresh of the page while preserving navigation
  const handleHardRefresh = () => {
    if (window.confirm('This will reload the entire page. Continue?')) {
      // Store the current URL to preserve navigation
      const currentPath = window.location.pathname;
      
      // Use sessionStorage to store that we want to stay on the /manage page
      // after the refresh
      sessionStorage.setItem('returnToPath', currentPath);
      sessionStorage.setItem('openInventoryView', 'true');
      
      // Then reload the page
      window.location.reload(true);
    }
  };
  
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const sortedInventory = () => {
    if (!inventory) return [];
    
    const filtered = inventory.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.lin?.toLowerCase().includes(searchLower) ||
        item.nsn?.toLowerCase().includes(searchLower) ||
        item.serialNumber?.toLowerCase().includes(searchLower) ||
        item.commonName?.toLowerCase().includes(searchLower) ||
        item.location?.toLowerCase().includes(searchLower)
      );
    });
    
    return filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';
      
      // Convert to string for comparison
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();
      
      if (sortDirection === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  };

  const handleEditItem = (item) => {
    setEditItem({ ...item });
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      
      // Explicitly pick only the fields that belong to EquipmentItem and are editable here
      const input = {
        id: editItem.id,
        _version: editItem._version, // Important for conflict detection
        lin: editItem.lin,
        serialNumber: editItem.serialNumber || null, // Use null for empty optional strings
        stockNumber: editItem.stockNumber || null,   // Use null for empty optional strings
        location: editItem.location || null,       // Use null for empty optional strings
        maintenanceStatus: editItem.maintenanceStatus || 'OPERATIONAL' // Ensure a valid status
        // assignedToID is handled by handleAssignToUser, do not include here unless the edit modal also changes it
      };
      
      // Remove fields that are null or undefined IF they are optional in the schema
      // (serialNumber, stockNumber, location, maintenanceStatus are optional)
      if (input.serialNumber === null) delete input.serialNumber;
      if (input.stockNumber === null) delete input.stockNumber;
      if (input.location === null) delete input.location;
      // maintenanceStatus has a default, so it should always be sent
      
      console.log("Updating item with input:", input);
      
      const updatedItemResult = await client.graphql({
        query: updateEquipmentItem,
        variables: {
          input
        }
      });
      
      const updatedItemData = updatedItemResult.data.updateEquipmentItem;
      
      // Update local state - merge with existing item to preserve frontend-only fields
      setInventory(inventory.map(item => 
        item.id === input.id 
          ? { ...item, ...updatedItemData } 
          : item
      ));
      
      // Also update in local DataStore if we're in online mode
      if (isOnlineMode) {
        try {
          const { EquipmentItem } = await import('../../models');
          const localItem = await DataStore.query(EquipmentItem, input.id);
          if (localItem) {
            await DataStore.save(
              EquipmentItem.copyOf(localItem, updated => {
                // Update only the fields that were actually changed
                updated.lin = input.lin;
                updated.serialNumber = input.serialNumber;
                updated.stockNumber = input.stockNumber;
                updated.location = input.location;
                updated.maintenanceStatus = input.maintenanceStatus;
                // Do not update assignedToID here
              })
            );
            console.log("Updated local DataStore item:", input.id);
          }
        } catch (datastoreError) {
          console.log('DataStore sync error (non-critical) during update:', datastoreError);
        }
      }
      
      setEditItem(null);
      setSuccess('Item updated successfully.');
    } catch (error) {
      console.error('Error updating item:', error);
      setError('Failed to update item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Try direct deletion using a custom mutation that ignores version conflicts
      await client.graphql({
        query: `mutation ForceDeleteEquipmentItem($id: ID!) {
          deleteEquipmentItem(input: { id: $id }, condition: null) {
            id
          }
        }`,
        variables: { id }
      });
      
      // Fetch fresh data directly after deletion
      await fetchDirectFromAPI();
      
      console.log('Successfully deleted item with force delete approach');
    } catch (error) {
      console.error('Error deleting item:', error);
      
      // If the direct mutation fails, try with the normal approach as a fallback
      try {
        await client.graphql({
          query: deleteEquipmentItem,
          variables: {
            input: { id }
          }
        });
        
        // Fetch fresh data directly after deletion
        await fetchDirectFromAPI();
        
        console.log('Successfully deleted item with standard approach');
      } catch (fallbackError) {
        console.error('Fallback delete also failed:', fallbackError);
        setError('Failed to delete item. Please try again or use the debug page to reset sync.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleAssignToUser = async (item) => {
    try {
      setLoading(true);
      
      // Get soldiers for the UIC
      const soldiersResponse = await client.graphql({
        query: `query GetSoldiersByUIC($uicID: ID!) {
          soldiersByUicID(uicID: $uicID) {
            items {
              id
              firstName
              lastName
              rank
              role
              hasAccount
            }
          }
        }`,
        variables: { uicID },
        headers: {
          "Cache-Control": "no-cache",
          "x-cache-buster": new Date().getTime().toString()
        }
      });
      
      const soldiersList = soldiersResponse.data.soldiersByUicID.items;
      
      // If no soldiers, show message
      if (!soldiersList || soldiersList.length === 0) {
        alert('No soldiers found in this unit. Please add soldiers first.');
        setLoading(false);
        return;
      }
      
      // Create simple dialog to select soldier
      const soldier = await new Promise((resolve) => {
        const selections = soldiersList.map(s => 
          `${s.id} - ${s.rank || ''} ${s.lastName}, ${s.firstName}`
        );
        
        const selected = window.prompt(
          `Select a soldier to assign this item to:\n${selections.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nEnter number or 0 to unassign:`,
          item.assignedToID ? '0' : '1'
        );
        
        if (selected === null) {
          resolve(null); // Cancelled
          return;
        }
        
        const selectedIndex = parseInt(selected.trim(), 10);
        if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex > soldiersList.length) {
          alert('Invalid selection');
          resolve(null);
          return;
        }
        
        if (selectedIndex === 0) {
          resolve({ id: null }); // Unassign
        } else {
          resolve(soldiersList[selectedIndex - 1]);
        }
      });
      
      if (!soldier) {
        setLoading(false);
        return; // Cancelled
      }
      
      // Update the item with the new assignedToID
      const updatedItem = await client.graphql({
        query: updateEquipmentItem,
        variables: {
          input: {
            id: item.id,
            assignedToID: soldier.id,
            _version: item._version
          }
        }
      });
      
      // Update local state
      setInventory(inventory.map(i => 
        i.id === item.id ? {...i, ...updatedItem.data.updateEquipmentItem} : i
      ));
      
      // Also update in local DataStore if we're in online mode
      if (isOnlineMode) {
        try {
          const { EquipmentItem } = await import('../../models');
          const localItem = await DataStore.query(EquipmentItem, item.id);
          if (localItem) {
            await DataStore.save(
              EquipmentItem.copyOf(localItem, updated => {
                updated.assignedToID = soldier.id;
              })
            );
          }
        } catch (datastoreError) {
          console.log('DataStore sync error (non-critical):', datastoreError);
        }
      }
      
      setSuccess(soldier.id ? 
        `Item assigned to ${soldier.rank || ''} ${soldier.lastName}` : 
        'Item unassigned successfully'
      );
    } catch (error) {
      console.error('Error assigning item:', error);
      setError('Failed to assign item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Find duplicate items based on NSN + Serial Number
  const findDuplicates = () => {
    if (!inventory || inventory.length === 0) {
      alert('No inventory items to check for duplicates.');
      return;
    }
    
    // Group by NSN + Serial Number
    const groups = {};
    inventory.forEach(item => {
      if (item.serialNumber) {
        const key = `${item.nsn}|${item.serialNumber}`;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(item);
      }
    });
    
    // Filter for groups with more than one item (duplicates)
    const duplicates = Object.entries(groups)
      .filter(([key, items]) => items.length > 1)
      .map(([key, items]) => ({
        key,
        nsn: items[0].nsn,
        serialNumber: items[0].serialNumber,
        lin: items[0].lin,
        items: items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // newest first
      }));
    
    if (duplicates.length === 0) {
      alert('No duplicates found in your inventory.');
      return;
    }
    
    // Initialize selection state - select all items except the newest (first) one
    const initialSelection = {};
    duplicates.forEach(group => {
      // Skip the first item (newest) and mark the rest for deletion
      group.items.slice(1).forEach(item => {
        initialSelection[item.id] = true;
      });
    });
    
    setSelectedItemsToDelete(initialSelection);
    setDuplicateGroups(duplicates);
    setShowDuplicatesModal(true);
  };
  
  // Toggle selection of an item for deletion
  const toggleItemSelection = (itemId) => {
    setSelectedItemsToDelete(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };
  
  // Delete selected duplicate items
  const deleteDuplicates = async () => {
    const itemsToDelete = Object.entries(selectedItemsToDelete)
      .filter(([id, isSelected]) => isSelected)
      .map(([id]) => id);
    
    if (itemsToDelete.length === 0) {
      alert('No items selected for deletion.');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete ${itemsToDelete.length} duplicate items?`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Delete items one by one
      const results = {
        success: 0,
        failed: 0
      };
      
      for (const id of itemsToDelete) {
        try {
          // Try direct deletion using a custom mutation that ignores version conflicts
          await client.graphql({
            query: `mutation ForceDeleteEquipmentItem($id: ID!) {
              deleteEquipmentItem(input: { id: $id }, condition: null) {
                id
              }
            }`,
            variables: { id }
          });
          
          console.log('Successfully deleted item with force delete approach:', id);
          results.success++;
        } catch (error) {
          console.error(`Error force deleting item ${id}:`, error);
          
          // Try the standard approach as fallback
          try {
            await client.graphql({
              query: deleteEquipmentItem,
              variables: {
                input: { id }
              }
            });
            
            console.log('Successfully deleted item with standard approach:', id);
            results.success++;
          } catch (fallbackError) {
            console.error(`Both delete approaches failed for item ${id}:`, fallbackError);
            results.failed++;
          }
        }
      }
      
      // Close modal and fetch fresh data directly
      setShowDuplicatesModal(false);
      await fetchDirectFromAPI();
      
      if (results.failed > 0) {
        alert(`Successfully deleted ${results.success} items. Failed to delete ${results.failed} items.`);
      } else {
        alert(`Successfully deleted all ${results.success} selected items.`);
      }
    } catch (error) {
      console.error('Error in duplicate deletion process:', error);
      setError('Failed to delete duplicate items. Please try again or use the debug page to reset sync.');
    } finally {
      setLoading(false);
    }
  };

  // Add a button to the component to refresh using the direct fetch method
  const handleForceRefresh = async () => {
    // Use the appropriate fetch method based on connectivity mode
    try {
      setLoading(true);
      if (isOnlineMode) {
        await fetchDirectFromAPI();
      } else {
        await fetchFromLocalDataStore();
      }
    } catch (error) {
      console.error('Error in force refresh:', error);
      setError('Failed to refresh inventory data.');
    } finally {
      setLoading(false);
    }
  };

  // Direct fetch method that matches the DataInspector approach
  const fetchDirectFromAPI = async () => {
    try {
      setLoading(true);
      setInventory([]); // Clear existing inventory
      
      // Get user's UIC
      const { username } = await getCurrentUser();
      const userResponse = await client.graphql({
        query: `query GetUserByOwner($owner: String!) {
          usersByOwner(owner: $owner, limit: 1) {
            items {
              id
              uicID
            }
          }
        }`,
        variables: { owner: username },
        authMode: 'userPool',
        headers: {
          'Cache-Control': 'no-cache',
          'x-cache-buster': new Date().getTime().toString()
        }
      });
      
      const userData = userResponse.data.usersByOwner.items[0];
      if (!userData || !userData.uicID) {
        setError('You must be assigned to a UIC to view inventory.');
        setLoading(false);
        return;
      }
      
      setUicID(userData.uicID);
      
      // Fetch equipment items directly, matching the debug tool approach
      const equipmentResponse = await client.graphql({
        query: `query EquipmentItemsByUicID($uicID: ID!) {
          equipmentItemsByUicID(
            uicID: $uicID,
            filter: { _deleted: { ne: true } }
          ) {
            items {
              id
              uicID
              equipmentMasterID
              nsn
              lin
              serialNumber
              stockNumber
              location
              assignedToID
              isPartOfGroup
              groupID
              maintenanceStatus
              createdAt
              updatedAt
              _version
              _deleted
              _lastChangedAt
            }
          }
        }`,
        variables: { uicID: userData.uicID },
        headers: {
          'Cache-Control': 'no-cache',
          'x-cache-buster': new Date().getTime().toString()
        }
      });
      
      const items = equipmentResponse.data.equipmentItemsByUicID.items;
      console.log('Direct API fetch returned:', items.length, 'items');
      
      // Get all soldier data for the UIC to handle assignments
      let soldiersMap = {};
      try {
        const soldiersResponse = await client.graphql({
          query: `query GetSoldiersByUIC($uicID: ID!) {
            soldiersByUicID(uicID: $uicID) {
              items {
                id
                firstName
                lastName
                rank
              }
            }
          }`,
          variables: { uicID: userData.uicID },
          headers: {
            'Cache-Control': 'no-cache',
            'x-cache-buster': new Date().getTime().toString()
          }
        });
        
        const soldiersList = soldiersResponse.data.soldiersByUicID.items;
        soldiersList.forEach(soldier => {
          soldiersMap[soldier.id] = soldier;
        });
      } catch (error) {
        console.error('Error fetching soldiers:', error);
      }
      
      // Process these items to add master data and soldier information
      const itemsWithDetails = await Promise.all(items.map(async (item) => {
        try {
          const masterResponse = await client.graphql({
            query: `query GetEquipmentMaster($id: ID!) {
              getEquipmentMaster(id: $id) {
                id
                nsn
                commonName
                isSerialTracked
                isSensitiveItem
                isConsumable
              }
            }`,
            variables: { id: item.equipmentMasterID },
            headers: {
              'Cache-Control': 'no-cache',
              'x-cache-buster': new Date().getTime().toString()
            }
          });
          
          const masterInfo = masterResponse.data.getEquipmentMaster;
          
          // Add soldier information if assigned
          let assignedToName = null;
          if (item.assignedToID && soldiersMap[item.assignedToID]) {
            const soldier = soldiersMap[item.assignedToID];
            assignedToName = `${soldier.rank || ''} ${soldier.lastName}, ${soldier.firstName}`;
          }
          
          return {
            ...item,
            commonName: masterInfo?.commonName || `Item ${item.nsn}`,
            isSerialTracked: masterInfo?.isSerialTracked || false,
            isSensitiveItem: masterInfo?.isSensitiveItem || false,
            isConsumable: masterInfo?.isConsumable || false,
            assignedToName: assignedToName
          };
        } catch (error) {
          console.error('Error fetching master data for item:', item.id, error);
          return {
            ...item,
            commonName: `Item ${item.nsn}`,
            isSerialTracked: false,
            isSensitiveItem: false,
            isConsumable: false
          };
        }
      }));
      
      console.log('Setting inventory with direct-fetched data:', itemsWithDetails.length, 'items');
      setInventory(itemsWithDetails);
    } catch (error) {
      console.error('Error in direct API fetch:', error);
      setError('Failed to load inventory directly from API.');
    } finally {
      setLoading(false);
    }
  };

  // After fetchDirectFromAPI, add this new function to find orphaned group items
  const findOrphanedGroupItems = async () => {
    try {
      setLoading(true);
      
      if (!uicID) {
        // Get user's UIC if we don't have it
        const { username } = await getCurrentUser();
        const userResponse = await client.graphql({
          query: `query GetUserByOwner($owner: String!) {
            usersByOwner(owner: $owner, limit: 1) {
              items {
                id
                uicID
              }
            }
          }`,
          variables: { owner: username }
        });
        
        const userData = userResponse.data.usersByOwner.items[0];
        if (!userData || !userData.uicID) {
          setError('You must be assigned to a UIC to perform this operation.');
          setLoading(false);
          return;
        }
        
        setUicID(userData.uicID);
      }
      
      // Fetch all equipment items that have a groupID
      const response = await client.graphql({
        query: `query GetItemsWithGroups($uicID: ID!) {
          equipmentItemsByUicID(
            uicID: $uicID,
            filter: { 
              isPartOfGroup: { eq: true },
              _deleted: { ne: true }
            }
          ) {
            items {
              id
              nsn
              lin
              serialNumber
              stockNumber
              equipmentMasterID
              isPartOfGroup
              groupID
              _version
            }
          }
        }`,
        variables: { uicID }
      });
      
      const groupedItems = response.data.equipmentItemsByUicID.items;
      
      if (groupedItems.length === 0) {
        alert('No items found that are part of a group.');
        setLoading(false);
        return;
      }
      
      // Get a list of all valid groups
      const groupsResponse = await client.graphql({
        query: `query GetGroups($uicID: ID!) {
          equipmentGroupsByUicID(
            uicID: $uicID,
            filter: { _deleted: { ne: true } }
          ) {
            items {
              id
            }
          }
        }`,
        variables: { uicID }
      });
      
      const validGroupIds = groupsResponse.data.equipmentGroupsByUicID.items.map(g => g.id);
      
      // Find items that reference deleted groups
      const orphaned = groupedItems.filter(item => 
        !validGroupIds.includes(item.groupID)
      );
      
      if (orphaned.length === 0) {
        alert('No orphaned items found. All grouped items reference valid groups.');
        setLoading(false);
        return;
      }
      
      // Add item details
      const orphanedWithDetails = await Promise.all(orphaned.map(async (item) => {
        try {
          const masterResponse = await client.graphql({
            query: `query GetEquipmentMaster($id: ID!) {
              getEquipmentMaster(id: $id) {
                id
                commonName
              }
            }`,
            variables: { id: item.equipmentMasterID }
          });
          
          const masterInfo = masterResponse.data.getEquipmentMaster;
          return {
            ...item,
            commonName: masterInfo?.commonName || `Item ${item.nsn}`
          };
        } catch (error) {
          return {
            ...item,
            commonName: `Item ${item.nsn}`
          };
        }
      }));
      
      setOrphanedItems(orphanedWithDetails);
      setShowOrphanedItemsModal(true);
    } catch (error) {
      console.error('Error finding orphaned items:', error);
      setError('Failed to find orphaned items. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to release orphaned items
  const handleReleaseOrphanedItems = async () => {
    if (orphanedItems.length === 0) {
      setShowOrphanedItemsModal(false);
      return;
    }
    
    if (!window.confirm(`Are you sure you want to release ${orphanedItems.length} orphaned items from deleted groups?`)) {
      return;
    }
    
    try {
      setProcessingOrphans(true);
      
      let successCount = 0;
      let failCount = 0;
      
      // Process each orphaned item
      for (const item of orphanedItems) {
        try {
          console.log(`Attempting to release item ${item.id}...`);
          
          // First attempt: Use direct mutation with condition: null
          try {
            await client.graphql({
              query: `mutation ReleaseOrphanedItem($id: ID!) {
                updateEquipmentItem(
                  input: {
                    id: $id,
                    isPartOfGroup: false,
                    groupID: null
                  },
                  condition: null
                ) {
                  id
                  isPartOfGroup
                  groupID
                }
              }`,
              variables: { id: item.id }
            });
            
            console.log(`Successfully released item ${item.id} using direct approach`);
            successCount++;
            continue; // Skip to next item
          } catch (directError) {
            console.error(`Direct approach failed for item ${item.id}:`, directError);
            // Continue to fallback approaches
          }
          
          // Second attempt: Get the latest version and update with that version
          try {
            // Get the current version of the item
            const getItemResponse = await client.graphql({
              query: `query GetEquipmentItem($id: ID!) {
                getEquipmentItem(id: $id) {
                  id
                  _version
                  isPartOfGroup
                  groupID
                }
              }`,
              variables: { id: item.id }
            });
            
            const currentItem = getItemResponse.data.getEquipmentItem;
            if (!currentItem) {
              throw new Error('Item not found');
            }
            
            // Check if the item is already released 
            if (!currentItem.isPartOfGroup && !currentItem.groupID) {
              console.log(`Item ${item.id} is already released, skipping...`);
              successCount++;
              continue; // Skip to next item
            }
            
            // Update with the latest version
            await client.graphql({
              query: updateEquipmentItem,
              variables: {
                input: {
                  id: item.id,
                  isPartOfGroup: false,
                  groupID: null,
                  _version: currentItem._version
                }
              }
            });
            
            console.log(`Successfully released item ${item.id} using versioned approach`);
            successCount++;
          } catch (versionedError) {
            console.error(`Versioned approach failed for item ${item.id}:`, versionedError);
            
            // Third attempt: Super aggressive approach - use raw DynamoDB update
            try {
              const rawResult = await client.graphql({
                query: `mutation ForceReleaseItem($id: ID!) {
                  updateEquipmentItem(
                    input: {
                      id: $id,
                      isPartOfGroup: false,
                      groupID: null
                    },
                    condition: {
                      id: {
                        eq: $id
                      }
                    }
                  ) {
                    id
                  }
                }`,
                variables: { id: item.id }
              });
              
              console.log(`Successfully released item ${item.id} using last-resort approach`, rawResult);
              successCount++;
            } catch (finalError) {
              console.error(`All approaches failed for item ${item.id}:`, finalError);
              failCount++;
            }
          }
        } catch (error) {
          console.error(`Error processing item ${item.id}:`, error);
          failCount++;
        }
      }
      
      // Sync changes to local DataStore if in online mode
      if (isOnlineMode) {
        try {
          await DataStoreUtil.clearAndSync();
        } catch (syncError) {
          console.error('Error syncing DataStore after releasing orphaned items:', syncError);
        }
      }
      
      // Refresh data
      await fetchDirectFromAPI();
      
      // Show result with detailed information
      setShowOrphanedItemsModal(false);
      
      if (failCount > 0) {
        setError(`Released ${successCount} orphaned items, but failed to release ${failCount} items. Try again for the remaining items.`);
      } else {
        setSuccess(`Successfully released all ${successCount} orphaned items. These items can now be added to new groups.`);
      }
    } catch (error) {
      console.error('Error releasing orphaned items:', error);
      setError('Failed to release orphaned items. Please try again.');
    } finally {
      setProcessingOrphans(false);
    }
  };

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <h2>Unit Inventory</h2>
        <div className="header-actions">
          <button 
            className="action-button" 
            onClick={handleSyncData}
            disabled={syncInProgress || loading || !isOnlineMode}
            title={isOnlineMode ? 'Sync with backend' : 'Switch to connected mode to sync'}
          >
            {syncInProgress ? 'Syncing...' : 'Sync Data'}
          </button>
          <button 
            className="action-button" 
            onClick={findDuplicates}
            disabled={loading || syncInProgress}
          >
            Find Duplicates
          </button>
          <button 
            className="action-button orange-button" 
            onClick={findOrphanedGroupItems}
            disabled={loading || syncInProgress}
          >
            Fix Orphaned Items
          </button>
          <button 
            className="action-button" 
            onClick={handleHardRefresh}
            disabled={loading || syncInProgress}
          >
            Hard Refresh
          </button>
          <button 
            className="action-button direct-fetch-button" 
            onClick={handleForceRefresh}
            disabled={loading}
          >
            {isOnlineMode ? 'Direct Fetch' : 'Refresh Local'}
          </button>
          <button 
            className="action-button debug-button" 
            onClick={() => setShowDebugPanel(!showDebugPanel)}
          >
            {showDebugPanel ? 'Hide Debug' : 'Show Debug'}
          </button>
          <button className="back-button" onClick={onBack}>
            &larr; Back
          </button>
        </div>
      </div>
      
      {/* Mode indicator */}
      <div className={`mode-indicator ${isOnlineMode ? 'online-mode' : 'offline-mode'}`}>
        {isOnlineMode 
          ? 'Connected Mode: Syncing with backend' 
          : 'Offline Mode: Using local data (toggle in header to sync)'
        }
      </div>
      
      {showDebugPanel && (
        <div className="debug-panel">
          <DataInspector />
        </div>
      )}
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Search inventory..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
      
      {loading && <div className="loading">Loading inventory...</div>}
      {error && (
        <div className="error-message">
          {error}
          {error.includes('sync') && (
            <div className="error-actions">
              <button 
                className="error-action-button" 
                onClick={() => setShowDebugPanel(true)}
              >
                Open Debug Tool
              </button>
            </div>
          )}
        </div>
      )}
      {success && (
        <div className="success-message">
          {success}
        </div>
      )}
      
      {!loading && inventory.length === 0 && (
        <div className="no-data">No equipment items found. Add some using the "Add New Equipment" button.</div>
      )}
      
      {!loading && inventory.length > 0 && (
        <div className="table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('lin')}>
                  LIN {sortBy === 'lin' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('nsn')}>
                  NSN {sortBy === 'nsn' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('commonName')}>
                  Name {sortBy === 'commonName' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('serialNumber')}>
                  Serial # {sortBy === 'serialNumber' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('stockNumber')}>
                  Stock # {sortBy === 'stockNumber' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('location')}>
                  Location {sortBy === 'location' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('assignedToID')}>
                  Assigned To {sortBy === 'assignedToID' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('maintenanceStatus')}>
                  Status {sortBy === 'maintenanceStatus' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedInventory().map(item => (
                <tr key={item.id} className={item.isPartOfGroup ? 'grouped-item' : ''}>
                  <td>{item.lin}</td>
                  <td>{item.nsn}</td>
                  <td>
                    {item.commonName}
                    {item.isPartOfGroup && (
                      <span className="group-badge" title="This item is part of a group">Group</span>
                    )}
                  </td>
                  <td>{item.serialNumber || '-'}</td>
                  <td>{item.stockNumber || '-'}</td>
                  <td>{item.location || '-'}</td>
                  <td>{item.assignedToName || (item.assignedToID ? `ID: ${item.assignedToID}` : '-')}</td>
                  <td>{item.maintenanceStatus || 'OPERATIONAL'}</td>
                  <td className="action-buttons">
                    <button onClick={() => handleEditItem(item)}>Edit</button>
                    <button onClick={() => handleDeleteItem(item.id)}>Delete</button>
                    <button onClick={() => handleAssignToUser(item)}>Assign</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Duplicates Modal */}
      {showDuplicatesModal && (
        <div className="modal-overlay">
          <div className="modal-content duplicates-modal">
            <h2>Duplicate Items</h2>
            <p>Found {duplicateGroups.length} groups of duplicate items with the same NSN and Serial Number.</p>
            <p>The newest item in each group is recommended to keep (unchecked by default).</p>
            
            <div className="duplicates-list">
              {duplicateGroups.map((group, groupIndex) => (
                <div key={group.key} className="duplicate-group">
                  <h3>Group {groupIndex + 1}: {group.lin} - {group.nsn}</h3>
                  <p>Serial Number: {group.serialNumber}</p>
                  
                  <table className="duplicates-table">
                    <thead>
                      <tr>
                        <th>Delete</th>
                        <th>Created</th>
                        <th>ID</th>
                        <th>Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((item, itemIndex) => (
                        <tr key={item.id} className={itemIndex === 0 ? 'newest-item' : ''}>
                          <td>
                            <input 
                              type="checkbox" 
                              checked={!!selectedItemsToDelete[item.id]} 
                              onChange={() => toggleItemSelection(item.id)}
                            />
                          </td>
                          <td>{new Date(item.createdAt).toLocaleString()}</td>
                          <td>{item.id.substring(0, 8)}...</td>
                          <td>{item.location || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
            
            <div className="modal-actions">
              <button 
                className="secondary-button" 
                onClick={() => setShowDuplicatesModal(false)}
              >
                Cancel
              </button>
              <button 
                className="primary-button"
                onClick={deleteDuplicates}
                disabled={Object.values(selectedItemsToDelete).filter(Boolean).length === 0}
              >
                Delete Selected Items
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Orphaned Items Modal */}
      {showOrphanedItemsModal && (
        <div className="modal-overlay">
          <div className="modal-content orphaned-modal">
            <h2>Orphaned Items</h2>
            <p>Found {orphanedItems.length} items that are marked as part of a group, but the group no longer exists.</p>
            <p>These items need to be released from their deleted groups before they can be added to new groups.</p>
            
            <div className="orphaned-items-list">
              <table className="orphaned-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>NSN</th>
                    <th>Serial #</th>
                    <th>Stock #</th>
                    <th>Deleted Group ID</th>
                  </tr>
                </thead>
                <tbody>
                  {orphanedItems.map(item => (
                    <tr key={item.id}>
                      <td>{item.commonName}</td>
                      <td>{item.nsn}</td>
                      <td>{item.serialNumber || '-'}</td>
                      <td>{item.stockNumber || '-'}</td>
                      <td className="group-id">{item.groupID}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="modal-actions">
              <button 
                className="secondary-button" 
                onClick={() => setShowOrphanedItemsModal(false)}
                disabled={processingOrphans}
              >
                Cancel
              </button>
              <button 
                className="primary-button"
                onClick={handleReleaseOrphanedItems}
                disabled={processingOrphans}
              >
                {processingOrphans ? 'Releasing...' : 'Release All Items'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {editItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Equipment</h2>
            
            <div className="form-group">
              <label>LIN:</label>
              <input 
                type="text" 
                value={editItem.lin} 
                onChange={(e) => setEditItem({...editItem, lin: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>NSN:</label>
              <input 
                type="text" 
                value={editItem.nsn} 
                readOnly 
                className="readonly-input"
              />
            </div>
            
            <div className="form-group">
              <label>Serial Number:</label>
              <input 
                type="text" 
                value={editItem.serialNumber || ''} 
                onChange={(e) => setEditItem({...editItem, serialNumber: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Stock Number:</label>
              <input 
                type="text" 
                value={editItem.stockNumber || ''} 
                onChange={(e) => setEditItem({...editItem, stockNumber: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Location:</label>
              <input 
                type="text" 
                value={editItem.location || ''} 
                onChange={(e) => setEditItem({...editItem, location: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Maintenance Status:</label>
              <select
                value={editItem.maintenanceStatus || 'OPERATIONAL'}
                onChange={(e) => setEditItem({...editItem, maintenanceStatus: e.target.value})}
              >
                <option value="OPERATIONAL">Operational</option>
                <option value="MAINTENANCE_REQUIRED">Maintenance Required</option>
                <option value="IN_MAINTENANCE">In Maintenance</option>
                <option value="DEADLINED">Deadlined</option>
                <option value="MISSING">Missing</option>
              </select>
            </div>
            
            <div className="modal-actions">
              <button className="secondary-button" onClick={() => setEditItem(null)}>
                Cancel
              </button>
              <button className="primary-button" onClick={handleSaveEdit}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryList; 