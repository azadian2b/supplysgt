import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { getHandReceiptedEquipment } from '../../../graphql/queries';

/**
 * Custom hook to manage hand-receipted equipment data
 * @param {string} uicID The UIC ID
 * @returns {Object} Equipment data and management functions
 */
const useHandReceiptedEquipment = (uicID) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [handReceiptedItems, setHandReceiptedItems] = useState([]);
  const [soldiers, setSoldiers] = useState([]);
  const [soldiersMap, setSoldiersMap] = useState({});
  const [groups, setGroups] = useState([]);
  const [groupsMap, setGroupsMap] = useState({});
  const [masterItems, setMasterItems] = useState({});
  const client = generateClient();
  
  // Load data when UIC changes
  useEffect(() => {
    if (uicID) {
      loadHandReceiptedEquipment();
    }
  }, [uicID]);
  
  // Load hand-receipted equipment
  const loadHandReceiptedEquipment = async () => {
    if (!uicID) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await client.graphql({
        query: getHandReceiptedEquipment,
        variables: { uicID }
      });
      
      const handReceiptStatuses = response.data.handReceiptStatusesByFromUIC.items;
      
      // Build maps for soldiers, groups, and master items
      const soldiersData = {};
      const groupsData = {};
      const mastersData = {};
      
      // Extract equipment items from hand receipt statuses
      const items = handReceiptStatuses.map(status => {
        const item = status.equipmentItem;
        
        // Build soldier map for display
        if (item.assignedTo) {
          soldiersData[item.assignedToID] = item.assignedTo;
        }
        
        // Build group map
        if (item.equipmentGroup) {
          groupsData[item.groupID] = item.equipmentGroup;
        }
        
        // Build master items map
        if (item.equipmentMaster) {
          mastersData[item.equipmentMasterID] = item.equipmentMaster;
        }
        
        return {
          ...item,
          receiptNumber: status.receiptNumber,
          issuedOn: status.issuedOn
        };
      });
      
      // Set state
      setSoldiersMap(soldiersData);
      setSoldiers(Object.values(soldiersData));
      
      // Convert maps to arrays for rendering
      const groupsArray = Object.values(groupsData);
      setGroups(groupsArray);
      setGroupsMap(groupsData);
      
      setMasterItems(mastersData);
      setHandReceiptedItems(items);
      setLoading(false);
      
      return items;
    } catch (error) {
      console.error('Error loading hand-receipted equipment:', error);
      setError('Failed to load equipment data. Please try again.');
      setLoading(false);
      throw error;
    }
  };
  
  // Get items that belong to a specific group
  const getGroupItems = (groupId) => {
    return handReceiptedItems.filter(item => item.groupID === groupId);
  };
  
  // Filter and sort items
  const filterAndSortItems = (
    searchTerm = '', 
    soldierFilter = 'all', 
    sortByField = 'nomenclature', 
    keepGrouped = true
  ) => {
    // Filter
    const filtered = handReceiptedItems.filter(item => {
      // Safely access masterItems - check if the ID exists in masterItems first
      const masterItem = item.equipmentMasterID && (item.equipmentMasterID in masterItems) ? masterItems[item.equipmentMasterID] : null;
      const commonName = masterItem?.commonName || '';
      
      const inSearchTerm = searchTerm === '' ||
        commonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nsn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by soldier
      const matchesSoldierFilter = soldierFilter === 'all' || item.assignedToID === soldierFilter;
      
      return inSearchTerm && matchesSoldierFilter;
    });
    
    // Sort
    return [...filtered].sort((a, b) => {
      if (sortByField === 'nomenclature') {
        // Safely access masterItems for sorting
        const masterItemA = a.equipmentMasterID && (a.equipmentMasterID in masterItems) ? masterItems[a.equipmentMasterID] : null;
        const masterItemB = b.equipmentMasterID && (b.equipmentMasterID in masterItems) ? masterItems[b.equipmentMasterID] : null;
        
        const nameA = masterItemA?.commonName?.toLowerCase() || '';
        const nameB = masterItemB?.commonName?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
      } else if (sortByField === 'assignedTo') {
        // Keep grouped items together if the setting is enabled
        if (keepGrouped) {
          if (a.groupID && b.groupID) {
            if (a.groupID === b.groupID) {
              const masterItemA = a.equipmentMasterID && (a.equipmentMasterID in masterItems) ? masterItems[a.equipmentMasterID] : null;
              const masterItemB = b.equipmentMasterID && (b.equipmentMasterID in masterItems) ? masterItems[b.equipmentMasterID] : null;
              
              const nameA = masterItemA?.commonName?.toLowerCase() || '';
              const nameB = masterItemB?.commonName?.toLowerCase() || '';
              return nameA.localeCompare(nameB);
            }
            return a.groupID.localeCompare(b.groupID);
          } else if (a.groupID) {
            return -1;
          } else if (b.groupID) {
            return 1;
          }
        }
        
        // Sort by soldier
        const soldierA = soldiersMap[a.assignedToID];
        const soldierB = soldiersMap[b.assignedToID];
        
        if (!soldierA && !soldierB) return 0;
        if (!soldierA) return 1;
        if (!soldierB) return -1;
        
        return `${soldierA.lastName}, ${soldierA.firstName}`.localeCompare(`${soldierB.lastName}, ${soldierB.firstName}`);
      }
      
      return 0;
    });
  };
  
  return {
    handReceiptedItems,
    soldiers,
    soldiersMap,
    groups,
    groupsMap,
    masterItems,
    loading,
    error,
    loadHandReceiptedEquipment,
    getGroupItems,
    filterAndSortItems
  };
};

export default useHandReceiptedEquipment; 