import { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import { getHandReceiptedEquipment } from '../graphql/queries';

/**
 * Custom hook for loading and managing hand receipted equipment
 */
const useHandReceiptedEquipment = (uicID) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [handReceiptedItems, setHandReceiptedItems] = useState([]);
  const [soldiersMap, setSoldiersMap] = useState({});
  const [groups, setGroups] = useState([]);
  const [groupsMap, setGroupsMap] = useState({});
  const [masterItems, setMasterItems] = useState({});
  
  const client = generateClient();

  // Load hand-receipted equipment
  const loadHandReceiptedEquipment = useCallback(async () => {
    if (!uicID) return [];
    
    setLoading(true);
    setError('');
    
    try {
      console.log("Loading hand receipted equipment for UIC:", uicID);
      
      const response = await client.graphql({
        query: getHandReceiptedEquipment,
        variables: { uicID }
      });
      
      const handReceiptStatuses = response.data.handReceiptStatusesByFromUIC.items;
      console.log("Received hand receipt statuses:", handReceiptStatuses.length);
      
      // Build maps for soldiers, groups, and master items
      const soldiers = {};
      const groups = {};
      const masters = {};
      
      // Extract equipment items from hand receipt statuses
      const items = handReceiptStatuses.filter(status => status.equipmentItem).map(status => {
        const item = status.equipmentItem;
        
        // Build soldier map for display
        if (item.assignedTo) {
          soldiers[item.assignedToID] = item.assignedTo;
        }
        
        // Also check if we have a soldier directly on the status
        if (status.soldier) {
          soldiers[status.toSoldierID] = status.soldier;
        }
        
        // Build group map
        if (item.equipmentGroup) {
          groups[item.groupID] = item.equipmentGroup;
        }
        
        // Build master items map
        if (item.equipmentMaster) {
          masters[item.equipmentMasterID] = item.equipmentMaster;
        }
        
        return {
          ...item,
          receiptNumber: status.receiptNumber,
          issuedOn: status.issuedOn
        };
      });
      
      // Set state
      setSoldiersMap(soldiers);
      
      // Convert maps to arrays for rendering
      const groupsArray = Object.values(groups);
      setGroups(groupsArray);
      setGroupsMap(groups);
      
      setMasterItems(masters);
      setHandReceiptedItems(items);
      
      console.log("Processed data:", {
        items: items.length,
        soldiers: Object.keys(soldiers).length,
        groups: groupsArray.length,
        masters: Object.keys(masters).length
      });
      
      setLoading(false);
      return items;
    } catch (err) {
      console.error('Error loading hand-receipted equipment:', err);
      setError('Failed to load hand receipted equipment. Please try again.');
      setLoading(false);
      return [];
    }
  }, [uicID, client]);

  // Get group items
  const getGroupItems = useCallback((groupId) => {
    return handReceiptedItems.filter(item => item.groupID === groupId);
  }, [handReceiptedItems]);

  // Filter and sort equipment
  const filterAndSortEquipment = useCallback((searchTerm = '', filterBySoldier = 'all', sortBy = 'nomenclature', keepGrouped = true) => {
    if (!handReceiptedItems || handReceiptedItems.length === 0) {
      return [];
    }
    
    console.log("Filtering equipment from", handReceiptedItems.length, "items");
    console.log("Search term:", searchTerm);
    console.log("Filter by soldier:", filterBySoldier);
    
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
      const matchesSoldierFilter = filterBySoldier === 'all' || item.assignedToID === filterBySoldier;
      
      return inSearchTerm && matchesSoldierFilter;
    });
    
    console.log("Filtered to", filtered.length, "items");
    
    // Sort
    return [...filtered].sort((a, b) => {
      if (sortBy === 'nomenclature') {
        // Safely access masterItems for sorting
        const masterItemA = a.equipmentMasterID && (a.equipmentMasterID in masterItems) ? masterItems[a.equipmentMasterID] : null;
        const masterItemB = b.equipmentMasterID && (b.equipmentMasterID in masterItems) ? masterItems[b.equipmentMasterID] : null;
        
        const nameA = masterItemA?.commonName?.toLowerCase() || '';
        const nameB = masterItemB?.commonName?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
      } else if (sortBy === 'assignedTo') {
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
  }, [handReceiptedItems, masterItems, soldiersMap]);

  // Load data on mount
  useEffect(() => {
    if (uicID) {
      loadHandReceiptedEquipment();
    }
  }, [uicID]);

  return {
    loading,
    error,
    handReceiptedItems,
    soldiersMap,
    groups,
    groupsMap,
    masterItems,
    getGroupItems,
    filterAndSortEquipment,
    loadHandReceiptedEquipment
  };
};

export default useHandReceiptedEquipment; 