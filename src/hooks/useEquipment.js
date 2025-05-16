import { useState, useEffect, useCallback, useRef } from 'react';
import { generateClient } from 'aws-amplify/api';

// Client is created once at the module level
const client = generateClient();

/**
 * Custom hook for managing equipment data
 * Follows a "load once, refresh only on user action" pattern
 */
const useEquipment = (uicID) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [equipment, setEquipment] = useState([]);
  const [masterItems, setMasterItems] = useState({});
  const [groups, setGroups] = useState([]);
  const [groupsMap, setGroupsMap] = useState({});
  const [itemStatusMap, setItemStatusMap] = useState({});
  
  // Filtering and selection
  const [selectedItems, setSelectedItems] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBySoldier, setFilterBySoldier] = useState('all');
  const [filterByStatus, setFilterByStatus] = useState('all');
  
  // Track if initial data has been loaded
  const initialLoadComplete = useRef(false);

  // Load assigned equipment - no dependencies to prevent polling
  const loadAssignedEquipment = useCallback(async (currentUicID) => {
    if (!currentUicID) return [];
    
    try {
      setLoading(true);
      
      // Query for equipment items that have assignedToID
      const equipmentResponse = await client.graphql({
        query: `query GetAssignedEquipmentItemsByUIC($uicID: ID!) {
          equipmentItemsByUicID(
            uicID: $uicID,
            filter: { 
              assignedToID: { attributeExists: true },
              _deleted: { ne: true }
            }
          ) {
            items {
              id
              nsn
              lin
              serialNumber
              stockNumber
              location
              assignedToID
              groupID
              isPartOfGroup
              maintenanceStatus
              equipmentMasterID
              _version
            }
          }
        }`,
        variables: { uicID: currentUicID }
      });
      
      const items = equipmentResponse.data.equipmentItemsByUicID.items;
      
      // Get master equipment data for item details
      const masterIds = [...new Set(items.map(item => item.equipmentMasterID))];
      
      // Filter out masterIds that we already have in our state to avoid unnecessary API calls
      const newMasterIds = masterIds.filter(id => !(id in masterItems));
      
      if (newMasterIds.length > 0) {
        // Create a copy of current masterItems
        const updatedMasterItems = { ...masterItems };
        
        // Batch fetch master items to reduce API calls
        const batchSize = 25;
        for (let i = 0; i < newMasterIds.length; i += batchSize) {
          const batch = newMasterIds.slice(i, i + batchSize);
          const promises = batch.map(masterId => 
            client.graphql({
              query: `query GetEquipmentMaster($id: ID!) {
                getEquipmentMaster(id: $id) {
                  id
                  nsn
                  commonName
                  description
                }
              }`,
              variables: { id: masterId }
            })
          );
          
          const results = await Promise.all(promises);
          results.forEach((response, index) => {
            const masterData = response.data.getEquipmentMaster;
            // Store the result even if it's null to avoid refetching
            updatedMasterItems[batch[index]] = masterData;
          });
        }
        
        setMasterItems(updatedMasterItems);
      }
      
      setEquipment(items);
      
      return items;
    } catch (error) {
      console.error('Error loading assigned equipment:', error);
      setError('Failed to load equipment data');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);  // No dependencies, will be stable

  // Load equipment groups - no dependencies to prevent polling
  const loadEquipmentGroups = useCallback(async (currentUicID) => {
    if (!currentUicID) return [];
    
    try {
      const groupsResponse = await client.graphql({
        query: `query GetEquipmentGroupsByUIC($uicID: ID!) {
          equipmentGroupsByUicID(
            uicID: $uicID,
            filter: {
              assignedToID: { attributeExists: true },
              _deleted: { ne: true }
            }
          ) {
            items {
              id
              name
              description
              assignedToID
              _version
            }
          }
        }`,
        variables: { uicID: currentUicID }
      });
      
      const groupsList = groupsResponse.data.equipmentGroupsByUicID.items;
      
      // Create a map for quick lookup
      const groupsMapObj = {};
      groupsList.forEach(group => {
        groupsMapObj[group.id] = group;
      });
      
      setGroups(groupsList);
      setGroupsMap(groupsMapObj);
      
      return groupsList;
    } catch (error) {
      console.error('Error loading equipment groups:', error);
      setError('Failed to load equipment groups');
      return [];
    }
  }, []); // No dependencies, will be stable

  // Load hand receipt statuses - no dependencies to prevent polling
  const loadHandReceiptStatuses = useCallback(async (currentUicID) => {
    if (!currentUicID) return [];
    
    try {
      const response = await client.graphql({
        query: `query GetHandReceiptStatusesByUIC(
          $fromUIC: ID!, 
          $filter: ModelHandReceiptStatusFilterInput
        ) {
          handReceiptStatusesByFromUIC(
            fromUIC: $fromUIC,
            filter: $filter
          ) {
            items {
              id
              receiptNumber
              status
              fromUIC
              toSoldierID
              equipmentItemID
              issuedOn
              pdfS3Key
            }
          }
        }`,
        variables: { 
          fromUIC: currentUicID, 
          filter: { status: { eq: "ISSUED" } }
        }
      });
      
      const statusRecords = response.data.handReceiptStatusesByFromUIC.items;
      
      // Build item status map
      const statusMap = {};
      
      statusRecords.forEach(record => {
        // Add to item status map for locking items
        statusMap[record.equipmentItemID] = {
          status: 'HAND_RECEIPTED',
          receiptNumber: record.receiptNumber,
          soldierId: record.toSoldierID
        };
      });
      
      setItemStatusMap(statusMap);
      
      return statusRecords;
    } catch (error) {
      console.error('Error loading hand receipt statuses:', error);
      return [];
    }
  }, []); // No dependencies, will be stable

  // Load all data initially, but only once
  const loadAllData = useCallback(async (currentUicID) => {
    if (!currentUicID) return;
    
    setLoading(true);
    try {
      await loadEquipmentGroups(currentUicID);
      await loadAssignedEquipment(currentUicID);
      await loadHandReceiptStatuses(currentUicID);
      initialLoadComplete.current = true;
    } catch (error) {
      console.error('Error during initial data load:', error);
      setError('Failed to load equipment data.');
    } finally {
      setLoading(false);
    }
  }, [loadEquipmentGroups, loadAssignedEquipment, loadHandReceiptStatuses]);

  // Only load data once when the component mounts or uicID changes
  useEffect(() => {
    if (uicID && !initialLoadComplete.current) {
      loadAllData(uicID);
    }
  }, [uicID, loadAllData]);

  // Toggle selection of an item
  const toggleItemSelection = useCallback((item) => {
    // Check if this item is already on a hand receipt
    if (itemStatusMap[item.id] && itemStatusMap[item.id].status === 'HAND_RECEIPTED') {
      setError(`This item is currently on hand receipt ${itemStatusMap[item.id].receiptNumber} and cannot be selected.`);
      return;
    }
    
    setSelectedItems(prev => {
      if (prev.some(i => i.id === item.id)) {
        return prev.filter(i => i.id !== item.id);
      } else {
        return [...prev, {
          ...item,
          masterData: masterItems[item.equipmentMasterID]
        }];
      }
    });
  }, [itemStatusMap, masterItems]);

  // Toggle expansion of a group
  const toggleGroupExpansion = useCallback((groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  }, []);

  // Get group items
  const getGroupItems = useCallback((groupId) => {
    return equipment.filter(item => item.groupID === groupId);
  }, [equipment]);

  // Filter equipment based on search and filters
  const getFilteredEquipment = useCallback(() => {
    return equipment.filter(item => {
      // Safely access masterItems - check if the ID exists in masterItems first
      const masterItem = item.equipmentMasterID && (item.equipmentMasterID in masterItems) ? masterItems[item.equipmentMasterID] : null;
      const commonName = masterItem?.commonName || '';
      
      const inSearchTerm = searchTerm === '' ||
        commonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nsn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.lin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.stockNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by soldier
      const matchesSoldierFilter = filterBySoldier === 'all' || item.assignedToID === filterBySoldier;
      
      // Filter by maintenance status
      const matchesStatusFilter = filterByStatus === 'all' || item.maintenanceStatus === filterByStatus;
      
      return inSearchTerm && matchesSoldierFilter && matchesStatusFilter;
    });
  }, [equipment, masterItems, searchTerm, filterBySoldier, filterByStatus]);

  // Clear selected items
  const clearSelectedItems = useCallback(() => {
    setSelectedItems([]);
  }, []);

  // Explicit refresh after user action - this is the only way data should be refreshed after initial load
  const refreshEquipmentData = useCallback(async () => {
    if (!uicID) return;
    
    setLoading(true);
    try {
      await loadAssignedEquipment(uicID);
      await loadHandReceiptStatuses(uicID);
    } catch (error) {
      console.error('Error refreshing equipment data:', error);
      setError('Failed to refresh equipment data.');
    } finally {
      setLoading(false);
    }
  }, [uicID, loadAssignedEquipment, loadHandReceiptStatuses]);

  return {
    loading,
    error,
    setError,
    equipment,
    masterItems,
    groups,
    groupsMap,
    itemStatusMap,
    selectedItems,
    setSelectedItems,
    expandedGroups,
    searchTerm,
    setSearchTerm,
    filterBySoldier,
    setFilterBySoldier,
    filterByStatus,
    setFilterByStatus,
    toggleItemSelection,
    toggleGroupExpansion,
    getGroupItems,
    getFilteredEquipment,
    clearSelectedItems,
    refreshEquipmentData
  };
};

export default useEquipment; 