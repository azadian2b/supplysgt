import { useState, useEffect, useCallback, useRef } from 'react';
import { generateClient } from 'aws-amplify/api';
import { DataStore } from '@aws-amplify/datastore';
import { getUrl } from 'aws-amplify/storage';
import { updateEquipmentItem, updateEquipmentGroup } from '../../graphql/mutations';
import './Assignment.css';
import { EquipmentItem, EquipmentGroup } from '../../models';

/**
 * AssignmentModal component - Handles assignment of equipment items and groups to soldiers
 * 
 * Can be launched from two different contexts:
 * 1. From soldier view - prefills soldier, allows selecting equipment
 * 2. From equipment view - prefills equipment, allows selecting soldier
 */
function AssignmentModal({ 
  onClose, 
  uicID, 
  preselectedSoldier = null, 
  preselectedItem = null,
  preselectedGroup = null,
  onAssignmentComplete
}) {
  // Determine initial filter state based on props
  const initialShowAssigned = Boolean((preselectedItem && preselectedItem.assignedToID) || 
                              (preselectedGroup && preselectedGroup.assignedToID));

  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [soldiers, setSoldiers] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [groups, setGroups] = useState([]);
  
  // Active selection state
  const [selectedSoldier, setSelectedSoldier] = useState(preselectedSoldier);
  const [selectedItems, setSelectedItems] = useState(preselectedItem ? [preselectedItem] : []);
  const [selectedGroup, setSelectedGroup] = useState(preselectedGroup);
  
  // Filter state - simplified
  const [soldierSearchTerm, setSoldierSearchTerm] = useState('');
  const [equipmentSearchTerm, setEquipmentSearchTerm] = useState('');
  const [showAssignedItems, setShowAssignedItems] = useState(initialShowAssigned);
  
  // UI state
  const [activeTab, setActiveTab] = useState(preselectedGroup ? 'groups' : 'items');
  const [processingAssignment, setProcessingAssignment] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const assignmentDirection = preselectedSoldier ? 'toEquipment' : 'toSoldier';
  
  // Ref to track if initial data load has completed
  const initialLoadCompleteRef = useRef(false);
  
  // Ref for detecting clicks outside the dropdown
  const dropdownRef = useRef(null);
  
  // Create client outside of any callbacks to ensure stable reference
  const client = generateClient();
  
  // Helper to create a stable filter object
  const createFilter = (showAssigned) => {
    if (!showAssigned) {
      return {
        and: [
          { _deleted: { ne: true } },
          {
            or: [
              { assignedToID: { attributeExists: false } },
              { assignedToID: { eq: null } }
            ]
          }
        ]
      };
    }
    return { _deleted: { ne: true } };
  };

  // Set the active tab based on preselection (only needs to run once)
  useEffect(() => {
    if (preselectedGroup) {
      setActiveTab('groups');
    } else if (preselectedItem) {
      setActiveTab('items');
    }
  }, [preselectedItem, preselectedGroup]);
  
  // Set initial selected soldier only when the prop changes
  useEffect(() => {
    if (preselectedSoldier) {
      setSelectedSoldier(preselectedSoldier);
    }
  }, [preselectedSoldier]);

  // Primary data loading function - only called once
  useEffect(() => {
    // Skip if already loaded
    if (initialLoadCompleteRef.current) return;
    
    const loadAllData = async () => {
      console.log('Starting initial data load...');
      setLoading(true);
      try {
        // STEP 1: Load soldiers
        console.log('Loading soldiers for UIC:', uicID);
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
        setSoldiers(soldiersList);
        console.log('Loaded soldiers:', soldiersList.length);
        
        // STEP 2: Load equipment items based on filter
        const filter = createFilter(showAssignedItems);
        console.log('Loading equipment items with filter:', showAssignedItems ? 'showing assigned' : 'hiding assigned');
        
        const equipmentResponse = await client.graphql({
          query: `query GetEquipmentItemsByUIC($uicID: ID!, $filter: ModelEquipmentItemFilterInput) {
            equipmentItemsByUicID(uicID: $uicID, filter: $filter) {
              items {
                id
                nsn
                lin
                serialNumber
                stockNumber
                location
                equipmentMasterID
                assignedToID
                groupID
                isPartOfGroup
                maintenanceStatus
                _version
              }
            }
          }`,
          variables: { uicID, filter },
          headers: {
            "Cache-Control": "no-cache",
            "x-cache-buster": new Date().getTime().toString()
          }
        });
        
        const equipmentItems = equipmentResponse.data.equipmentItemsByUicID.items;
        console.log(`Found ${equipmentItems.length} equipment items matching filter`);
        
        // Process items with master data
        const itemsWithDetails = await Promise.all(
          equipmentItems.map(async (item) => {
            try {
              const masterResponse = await client.graphql({
                query: `query GetEquipmentMaster($id: ID!) {
                  getEquipmentMaster(id: $id) {
                    id
                    nsn
                    commonName
                    imageKey
                  }
                }`,
                variables: { id: item.equipmentMasterID }
              });
              
              const masterData = masterResponse.data.getEquipmentMaster;
              let imageUrl = null;
              
              if (masterData?.imageKey) {
                try {
                  const imageUrlResult = await getUrl({
                    key: masterData.imageKey,
                    options: { expiresIn: 3600 }
                  });
                  imageUrl = imageUrlResult.url.toString();
                } catch (err) {
                  console.error('Error getting image URL:', err);
                }
              }
              
              return {
                ...item,
                commonName: masterData?.commonName || `Item ${item.nsn}`,
                imageUrl
              };
            } catch (error) {
              console.error(`Error getting master data for item ${item.id}:`, error);
              return {
                ...item,
                commonName: `Item ${item.nsn}`
              };
            }
          })
        );
        
        setEquipment(itemsWithDetails);
        
        // STEP 3: Load equipment groups
        console.log('Loading equipment groups with filter:', showAssignedItems ? 'showing assigned' : 'hiding assigned');
        
        const groupsResponse = await client.graphql({
          query: `query GetEquipmentGroupsByUIC($uicID: ID!, $filter: ModelEquipmentGroupFilterInput) {
            equipmentGroupsByUicID(uicID: $uicID, filter: $filter) {
              items {
                id
                name
                description
                assignedToID
                _version
              }
            }
          }`,
          variables: { uicID, filter },
          headers: {
            "Cache-Control": "no-cache",
            "x-cache-buster": new Date().getTime().toString()
          }
        });
        
        const groupsList = groupsResponse.data.equipmentGroupsByUicID.items;
        console.log(`Found ${groupsList.length} equipment groups matching filter`);
        
        // Process groups with item counts
        const groupsWithCounts = await Promise.all(
          groupsList.map(async (group) => {
            try {
              const itemsResponse = await client.graphql({
                query: `query CountItemsInGroup($groupID: ID!) {
                  equipmentItemsByGroupID(groupID: $groupID) {
                    items {
                      id
                    }
                  }
                }`,
                variables: { groupID: group.id }
              });
              
              const groupItems = itemsResponse.data.equipmentItemsByGroupID.items;
              
              return {
                ...group,
                itemCount: groupItems.length
              };
            } catch (error) {
              console.error(`Error getting items for group ${group.id}:`, error);
              return {
                ...group,
                itemCount: 0
              };
            }
          })
        );
        
        setGroups(groupsWithCounts);
        console.log('Initial data load complete');
        
      } catch (error) {
        console.error('Error in initial data load:', error);
        setError('Failed to load data: ' + error.message);
      } finally {
        setLoading(false);
        // Mark initial load as complete to prevent re-running
        initialLoadCompleteRef.current = true;
      }
    };
    
    loadAllData();
  }, [uicID, initialShowAssigned]); // Stable dependencies that won't change during component lifecycle
  
  // Handle click outside dropdown to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle show assigned items toggle
  const handleShowAssignedToggle = async (checked) => {
    setShowAssignedItems(checked);
    
    // Reload data when the checkbox is manually toggled
    setLoading(true);
    
    try {
      console.log('Reloading data with filter changed to:', checked ? 'showing assigned' : 'hiding assigned');
      const filter = createFilter(checked);
      
      // Load equipment with new filter
      const equipmentResponse = await client.graphql({
        query: `query GetEquipmentItemsByUIC($uicID: ID!, $filter: ModelEquipmentItemFilterInput) {
          equipmentItemsByUicID(uicID: $uicID, filter: $filter) {
            items {
              id
              nsn
              lin
              serialNumber
              stockNumber
              location
              equipmentMasterID
              assignedToID
              groupID
              isPartOfGroup
              maintenanceStatus
              _version
            }
          }
        }`,
        variables: { uicID, filter },
        headers: {
          "Cache-Control": "no-cache",
          "x-cache-buster": new Date().getTime().toString()
        }
      });
      
      const equipmentItems = equipmentResponse.data.equipmentItemsByUicID.items;
      console.log(`Reload found ${equipmentItems.length} equipment items matching filter`);
      
      // Process items with master data
      const itemsWithDetails = await Promise.all(equipmentItems.map(async (item) => {
        try {
          const masterResponse = await client.graphql({
            query: `query GetEquipmentMaster($id: ID!) {
              getEquipmentMaster(id: $id) {
                id
                nsn
                commonName
                imageKey
              }
            }`,
            variables: { id: item.equipmentMasterID }
          });
          
          const masterData = masterResponse.data.getEquipmentMaster;
          let imageUrl = null;
          
          if (masterData?.imageKey) {
            try {
              const imageUrlResult = await getUrl({
                key: masterData.imageKey,
                options: { expiresIn: 3600 }
              });
              imageUrl = imageUrlResult.url.toString();
            } catch (err) { 
              console.error('Error getting image URL:', err); 
            }
          }
          
          return {
            ...item,
            commonName: masterData?.commonName || `Item ${item.nsn}`,
            imageUrl
          };
        } catch (error) {
          console.error(`Error getting master data for item ${item.id}:`, error);
          return {
            ...item,
            commonName: `Item ${item.nsn}`
          };
        }
      }));
      
      setEquipment(itemsWithDetails);
      
      // Load groups with new filter
      const groupsResponse = await client.graphql({
        query: `query GetEquipmentGroupsByUIC($uicID: ID!, $filter: ModelEquipmentGroupFilterInput) {
          equipmentGroupsByUicID(uicID: $uicID, filter: $filter) {
            items {
              id
              name
              description
              assignedToID
              _version
            }
          }
        }`,
        variables: { uicID, filter },
        headers: {
          "Cache-Control": "no-cache",
          "x-cache-buster": new Date().getTime().toString()
        }
      });
      
      const groupsList = groupsResponse.data.equipmentGroupsByUicID.items;
      console.log(`Reload found ${groupsList.length} equipment groups matching filter`);
      
      // Process groups with item counts
      const groupsWithCounts = await Promise.all(groupsList.map(async (group) => {
        try {
          const itemsResponse = await client.graphql({
            query: `query CountItemsInGroup($groupID: ID!) {
              equipmentItemsByGroupID(groupID: $groupID) {
                items {
                  id
                }
              }
            }`,
            variables: { groupID: group.id }
          });
          
          const groupItems = itemsResponse.data.equipmentItemsByGroupID.items;
          
          return {
            ...group,
            itemCount: groupItems.length
          };
        } catch (error) {
          console.error(`Error getting items for group ${group.id}:`, error);
          return {
            ...group,
            itemCount: 0
          };
        }
      }));
      
      setGroups(groupsWithCounts);
      console.log('Filter reload complete');
    } catch (error) {
      console.error('Error reloading data on filter change:', error);
      setError('Failed to reload data with new filter.');
    } finally {
      setLoading(false);
    }
  };

  // Handle soldier selection
  const handleSelectSoldier = (soldier) => {
    setSelectedSoldier(soldier);
    setSoldierSearchTerm('');
    setDropdownOpen(false);
    
    // If in "toEquipment" mode, reset equipment selections
    if (assignmentDirection === 'toEquipment') {
      setSelectedItems([]);
      setSelectedGroup(null);
    }
  };
  
  // Handle item selection
  const handleSelectItem = (item) => {
    // If item is already part of a group, it can't be individually assigned
    if (item.isPartOfGroup && item.groupID) {
      setError('This item is part of a group and cannot be individually assigned. Please assign the entire group instead.');
      return;
    }
    
    // If the item is already assigned to someone else, show an error
    if (item.assignedToID && item.assignedToID !== selectedSoldier?.id) {
      setError(`This item is already assigned to another soldier. Please unassign it first.`);
      return;
    }
    
    const isSelected = selectedItems.some(i => i.id === item.id);
    
    if (isSelected) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };
  
  // Handle group selection
  const handleSelectGroup = (group) => {
    // If the group is already assigned to someone else, show an error
    if (group.assignedToID && group.assignedToID !== selectedSoldier?.id) {
      setError(`This group is already assigned to another soldier. Please unassign it first.`);
      return;
    }
    
    if (selectedGroup && selectedGroup.id === group.id) {
      setSelectedGroup(null);
    } else {
      setSelectedGroup(group);
    }
  };
  
  // Filter soldiers based on search term
  const filteredSoldiers = soldiers.filter(soldier => {
    const searchTerm = soldierSearchTerm.toLowerCase();
    return (
      soldier.firstName.toLowerCase().includes(searchTerm) ||
      soldier.lastName.toLowerCase().includes(searchTerm) ||
      (soldier.rank && soldier.rank.toLowerCase().includes(searchTerm))
    );
  });
  
  // Filter equipment based on search term
  const filteredEquipment = equipment.filter(item => {
    const searchTerm = equipmentSearchTerm.toLowerCase();
    return (
      item.commonName.toLowerCase().includes(searchTerm) ||
      item.nsn.toLowerCase().includes(searchTerm) ||
      (item.serialNumber && item.serialNumber.toLowerCase().includes(searchTerm)) ||
      (item.stockNumber && item.stockNumber.toLowerCase().includes(searchTerm)) ||
      (item.lin && item.lin.toLowerCase().includes(searchTerm))
    );
  });

  // Handle the assignment
  const handleAssign = async () => {
    try {
      setProcessingAssignment(true);
      setError('');
      
      // Validate selections
      if (!selectedSoldier) {
        setError('Please select a soldier.');
        return;
      }
      
      if (activeTab === 'items' && selectedItems.length === 0) {
        setError('Please select at least one item to assign.');
        return;
      }
      
      if (activeTab === 'groups' && !selectedGroup) {
        setError('Please select a group to assign.');
        return;
      }
      
      let successCount = 0;
      let failCount = 0;
      
      // Assign individual items
      if (activeTab === 'items') {
        for (const item of selectedItems) {
          try {
            await client.graphql({
              query: updateEquipmentItem,
              variables: {
                input: {
                  id: item.id,
                  assignedToID: selectedSoldier.id,
                  _version: item._version
                }
              }
            });
            
            // Also update in local DataStore
            try {
              const localItem = await DataStore.query(EquipmentItem, item.id);
              if (localItem) {
                await DataStore.save(
                  EquipmentItem.copyOf(localItem, updated => {
                    updated.assignedToID = selectedSoldier.id;
                  })
                );
              }
            } catch (datastoreError) {
              console.log('DataStore sync error (non-critical):', datastoreError);
            }
            
            successCount++;
          } catch (error) {
            console.error(`Error assigning item ${item.id}:`, error);
            failCount++;
          }
        }
      }
      
      // Assign a group and all its items
      if (activeTab === 'groups' && selectedGroup) {
        try {
          // Assign the group itself
          await client.graphql({
            query: updateEquipmentGroup,
            variables: {
              input: {
                id: selectedGroup.id,
                assignedToID: selectedSoldier.id,
                _version: selectedGroup._version
              }
            }
          });
          
          // Get all items in the group
          const itemsResponse = await client.graphql({
            query: `query GetItemsInGroup($groupID: ID!) {
              equipmentItemsByGroupID(groupID: $groupID) {
                items {
                  id
                  _version
                }
              }
            }`,
            variables: { groupID: selectedGroup.id }
          });
          
          const groupItems = itemsResponse.data.equipmentItemsByGroupID.items;
          
          // Assign all items in the group
          for (const item of groupItems) {
            try {
              await client.graphql({
                query: updateEquipmentItem,
                variables: {
                  input: {
                    id: item.id,
                    assignedToID: selectedSoldier.id,
                    _version: item._version
                  }
                }
              });
              
              successCount++;
            } catch (error) {
              console.error(`Error assigning group item ${item.id}:`, error);
              failCount++;
            }
          }
        } catch (error) {
          console.error(`Error assigning group ${selectedGroup.id}:`, error);
          setError(`Failed to assign group: ${error.message}`);
        }
      }
      
      // Show success message
      if (failCount === 0) {
        setSuccess(`Successfully assigned ${successCount} ${successCount === 1 ? 'item' : 'items'} to ${selectedSoldier.rank || ''} ${selectedSoldier.lastName}.`);
      } else {
        setSuccess(`Assigned ${successCount} ${successCount === 1 ? 'item' : 'items'}, but failed to assign ${failCount} ${failCount === 1 ? 'item' : 'items'}.`);
      }
      
      // Notify parent component
      if (onAssignmentComplete) {
        onAssignmentComplete();
      }
      
      // Reset selections and reload data
      setSelectedItems([]);
      setSelectedGroup(null);
      
    } catch (error) {
      console.error('Error during assignment:', error);
      setError(`Assignment failed: ${error.message}`);
    } finally {
      setProcessingAssignment(false);
    }
  };
  
  // Handle unassignment
  const handleUnassign = async () => {
    try {
      setProcessingAssignment(true);
      setError('');
      
      // Validate selections
      if (activeTab === 'items' && selectedItems.length === 0) {
        setError('Please select at least one item to unassign.');
        return;
      }
      
      if (activeTab === 'groups' && !selectedGroup) {
        setError('Please select a group to unassign.');
        return;
      }
      
      let successCount = 0;
      let failCount = 0;
      
      // Unassign individual items
      if (activeTab === 'items') {
        for (const item of selectedItems) {
          try {
            await client.graphql({
              query: updateEquipmentItem,
              variables: {
                input: {
                  id: item.id,
                  assignedToID: null,
                  _version: item._version
                }
              }
            });
            
            successCount++;
          } catch (error) {
            console.error(`Error unassigning item ${item.id}:`, error);
            failCount++;
          }
        }
      }
      
      // Unassign a group and all its items
      if (activeTab === 'groups' && selectedGroup) {
        try {
          // Unassign the group itself
          await client.graphql({
            query: updateEquipmentGroup,
            variables: {
              input: {
                id: selectedGroup.id,
                assignedToID: null,
                _version: selectedGroup._version
              }
            }
          });
          
          // Get all items in the group
          const itemsResponse = await client.graphql({
            query: `query GetItemsInGroup($groupID: ID!) {
              equipmentItemsByGroupID(groupID: $groupID) {
                items {
                  id
                  _version
                }
              }
            }`,
            variables: { groupID: selectedGroup.id }
          });
          
          const groupItems = itemsResponse.data.equipmentItemsByGroupID.items;
          
          // Unassign all items in the group
          for (const item of groupItems) {
            try {
              await client.graphql({
                query: updateEquipmentItem,
                variables: {
                  input: {
                    id: item.id,
                    assignedToID: null,
                    _version: item._version
                  }
                }
              });
              
              successCount++;
            } catch (error) {
              console.error(`Error unassigning group item ${item.id}:`, error);
              failCount++;
            }
          }
        } catch (error) {
          console.error(`Error unassigning group ${selectedGroup.id}:`, error);
          setError(`Failed to unassign group: ${error.message}`);
        }
      }
      
      // Show success message
      if (failCount === 0) {
        setSuccess(`Successfully unassigned ${successCount} ${successCount === 1 ? 'item' : 'items'}.`);
      } else {
        setSuccess(`Unassigned ${successCount} ${successCount === 1 ? 'item' : 'items'}, but failed to unassign ${failCount} ${failCount === 1 ? 'item' : 'items'}.`);
      }
      
      // Notify parent component
      if (onAssignmentComplete) {
        onAssignmentComplete();
      }
      
      // Reset selections and reload data
      setSelectedItems([]);
      setSelectedGroup(null);
      
    } catch (error) {
      console.error('Error during unassignment:', error);
      setError(`Unassignment failed: ${error.message}`);
    } finally {
      setProcessingAssignment(false);
    }
  };

  // Format soldier display name
  const getSoldierDisplayName = (soldier) => {
    if (!soldier) return '';
    return `${soldier.rank || ''} ${soldier.lastName}, ${soldier.firstName}`.trim();
  };

  // Return the component JSX with updated UI for soldier selection
  return (
    <div className="modal-overlay">
      <div className="modal-content assignment-modal">
        <div className="modal-header">
          <h2>
            {assignmentDirection === 'toSoldier' 
              ? 'Assign Equipment to Soldier' 
              : 'Assign Soldier to Equipment'}
          </h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        {loading ? (
          <div className="loading">Loading data...</div>
        ) : (
          <div className="assignment-container">
            {/* Soldier Selection Section with Dropdown */}
            <div className="soldier-selection-section">
              <h3>Select Soldier</h3>
              
              <div className="soldier-dropdown-container" ref={dropdownRef}>
                <div 
                  className="soldier-dropdown-header"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {selectedSoldier ? (
                    <div className="selected-soldier">
                      {getSoldierDisplayName(selectedSoldier)}
                    </div>
                  ) : (
                    <div className="soldier-placeholder">Select a soldier</div>
                  )}
                  <div className="dropdown-arrow">▼</div>
                </div>
                
                {dropdownOpen && (
                  <div className="soldier-dropdown-content">
                    <input
                      type="text"
                      placeholder="Search soldiers..."
                      value={soldierSearchTerm}
                      onChange={(e) => setSoldierSearchTerm(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="soldier-search-input"
                    />
                    
                    <div className="soldier-dropdown-list">
                      {filteredSoldiers.length === 0 ? (
                        <div className="no-soldiers-message">
                          {soldiers.length === 0 
                            ? 'No soldiers found in this UIC.' 
                            : 'No soldiers match your search.'}
                        </div>
                      ) : (
                        filteredSoldiers.map(soldier => (
                          <div
                            key={soldier.id}
                            className={`soldier-dropdown-item ${selectedSoldier?.id === soldier.id ? 'selected' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectSoldier(soldier);
                            }}
                          >
                            {getSoldierDisplayName(soldier)}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Equipment Selection Section */}
            <div className="equipment-selection-section">
              <div className="tabs">
                <button 
                  className={`tab-button ${activeTab === 'items' ? 'active' : ''}`}
                  onClick={() => setActiveTab('items')}
                >
                  Individual Items
                </button>
                <button 
                  className={`tab-button ${activeTab === 'groups' ? 'active' : ''}`}
                  onClick={() => setActiveTab('groups')}
                >
                  Equipment Groups
                </button>
              </div>
              
              <div className="filter-options">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder={activeTab === 'items' ? "Search items..." : "Search groups..."}
                    value={equipmentSearchTerm}
                    onChange={(e) => setEquipmentSearchTerm(e.target.value)}
                  />
                </div>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={showAssignedItems}
                    onChange={(e) => handleShowAssignedToggle(e.target.checked)}
                  />
                  Show already assigned
                </label>
              </div>
              
              {/* Individual Items Tab */}
              {activeTab === 'items' && (
                <div className="items-list">
                  {filteredEquipment.length === 0 ? (
                    <p className="no-data-message">
                      No items found. {!showAssignedItems ? 
                        'Try checking "Show already assigned" to see all items.' : 
                        'Make sure equipment exists for this UIC.'}
                    </p>
                  ) : (
                    filteredEquipment.map(item => {
                      const isSelected = selectedItems.some(i => i.id === item.id);
                      const isAssigned = item.assignedToID !== null;
                      const isPartOfGroup = item.isPartOfGroup && item.groupID;
                      
                      return (
                        <div
                          key={item.id}
                          className={`
                            equipment-card 
                            ${isSelected ? 'selected' : ''} 
                            ${isAssigned ? 'assigned' : ''} 
                            ${isPartOfGroup ? 'in-group' : ''}
                          `}
                          onClick={() => handleSelectItem(item)}
                        >
                          <div className="equipment-icon">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.commonName} className="equipment-image" />
                            ) : (
                              <div className="placeholder-icon">📦</div>
                            )}
                          </div>
                          <div className="equipment-details">
                            <div className="equipment-name">{item.commonName}</div>
                            <div className="equipment-info">
                              <span>NSN: {item.nsn}</span>
                              {item.serialNumber && <span>S/N: {item.serialNumber}</span>}
                              {item.stockNumber && <span>Stock #: {item.stockNumber}</span>}
                            </div>
                            {isAssigned && (
                              <div className="assignment-badge">Assigned</div>
                            )}
                            {isPartOfGroup && (
                              <div className="group-badge">Part of a Group</div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
              
              {/* Groups Tab */}
              {activeTab === 'groups' && (
                <div className="groups-list">
                  {groups.length === 0 ? (
                    <p className="no-data-message">
                      No equipment groups found. {!showAssignedItems ? 
                        'Try checking "Show already assigned" to see all groups.' : 
                        'You may need to create equipment groups first in the Manage Equipment section.'}
                    </p>
                  ) : (
                    groups.map(group => {
                      const isSelected = selectedGroup?.id === group.id;
                      const isAssigned = group.assignedToID !== null;
                      
                      return (
                        <div
                          key={group.id}
                          className={`group-card ${isSelected ? 'selected' : ''} ${isAssigned ? 'assigned' : ''}`}
                          onClick={() => handleSelectGroup(group)}
                        >
                          <div className="group-name">{group.name}</div>
                          {group.description && (
                            <div className="group-description">{group.description}</div>
                          )}
                          <div className="group-info">
                            Contains {group.itemCount} {group.itemCount === 1 ? 'item' : 'items'}
                          </div>
                          {isAssigned && (
                            <div className="assignment-badge">Assigned</div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="modal-actions">
          <button 
            className="secondary-button" 
            onClick={onClose}
            disabled={processingAssignment}
          >
            Cancel
          </button>
          
          {showAssignedItems && (
            <button 
              className="danger-button"
              onClick={handleUnassign}
              disabled={
                processingAssignment || 
                (activeTab === 'items' && selectedItems.length === 0) ||
                (activeTab === 'groups' && !selectedGroup)
              }
            >
              {processingAssignment ? 'Processing...' : 'Unassign'}
            </button>
          )}
          
          <button 
            className="primary-button"
            onClick={handleAssign}
            disabled={
              processingAssignment || 
              !selectedSoldier || 
              (activeTab === 'items' && selectedItems.length === 0) ||
              (activeTab === 'groups' && !selectedGroup)
            }
          >
            {processingAssignment ? 'Processing...' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignmentModal;