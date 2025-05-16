import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { getUrl } from 'aws-amplify/storage';
import { createEquipmentGroup, updateEquipmentItem, deleteEquipmentGroup } from '../../graphql/mutations';
import { equipmentItemsByUicID, equipmentGroupsByUicID, equipmentItemsByGroupID } from '../../graphql/queries';
import { DataStore } from '@aws-amplify/datastore';
import DataStoreUtil from '../../utils/DataStoreSync';
import './Equipment.css';

/**
 * ManageGroupsModal component - Design 3: Visual drag-and-drop inspired grid layout
 * This design uses a tile-based interface where you can quickly group items
 * using a grid layout with visual cues and tabs for organization.
 */
function ManageGroupsModal3({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uicID, setUicID] = useState(null);
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'view', 'edit'
  
  // Create group state
  const [availableItems, setAvailableItems] = useState([]);
  const [baseItem, setBaseItem] = useState(null);
  const [selectedComponents, setSelectedComponents] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  
  // View groups state
  const [existingGroups, setExistingGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupItems, setGroupItems] = useState([]);
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [itemType, setItemType] = useState('all'); // 'all', 'weapons', 'optics', 'comms', etc.
  
  // Add state for confirm delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  
  const client = generateClient();

  // Fetch data on component mount
  useEffect(() => {
    fetchInitialData();
  }, []);
  
  // Fetch group items when a group is selected
  useEffect(() => {
    if (selectedGroup) {
      fetchGroupItems(selectedGroup.id);
    }
  }, [selectedGroup]);

  /**
   * Fetches initial data including available items and existing groups
   */
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get current user's UIC
      const { username } = await getCurrentUser();
      const userAttributes = await client.graphql({
        query: `query GetUser($owner: String!) {
          usersByOwner(owner: $owner) {
            items {
              id
              uicID
            }
          }
        }`,
        variables: { owner: username }
      });
      
      const userData = userAttributes.data.usersByOwner.items[0];
      if (!userData || !userData.uicID) {
        setError('You must be assigned to a UIC to manage equipment groups.');
        setLoading(false);
        return;
      }
      
      setUicID(userData.uicID);
      
      // Fetch available equipment items
      await fetchAvailableItems(userData.uicID);
      
      // Fetch existing groups
      await fetchExistingGroups(userData.uicID);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Fetches available equipment items (not in groups)
   */
  const fetchAvailableItems = async (uicID) => {
    try {
      const equipmentData = await client.graphql({
        query: `query EquipmentItemsByUicID($uicID: ID!) {
          equipmentItemsByUicID(
            uicID: $uicID,
            filter: { 
              isPartOfGroup: { ne: true },
              _deleted: { ne: true }
            }
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
              isPartOfGroup
              groupID
              _version
              _lastChangedAt
            }
          }
        }`,
        variables: { uicID: uicID }
      });
      
      const equipmentItems = equipmentData.data.equipmentItemsByUicID.items;
      
      // Double-check to ensure we only include items not already in groups
      const availableItems = equipmentItems.filter(item => !item.isPartOfGroup && !item.groupID);
      
      console.log(`Fetched ${equipmentItems.length} items, ${availableItems.length} available (not in groups)`);
      
      // Fetch additional details about each item
      const itemsWithDetails = await Promise.all(availableItems.map(async (item) => {
        try {
          const masterData = await client.graphql({
            query: `query GetEquipmentMaster($id: ID!) {
              getEquipmentMaster(id: $id) {
                id
                nsn
                commonName
                description
                imageKey
              }
            }`,
            variables: { id: item.equipmentMasterID }
          });
          
          const masterInfo = masterData.data.getEquipmentMaster;
          
          // Get image URL if imageKey exists
          let imageUrl = null;
          if (masterInfo?.imageKey) {
            try {
              const imageUrlResult = await getUrl({
                key: masterInfo.imageKey,
                options: {
                  expiresIn: 3600 // 1 hour
                }
              });
              imageUrl = imageUrlResult.url.toString();
            } catch (err) {
              console.error('Error getting image URL:', err);
            }
          }
          
          return {
            ...item,
            commonName: masterInfo?.commonName || `Item ${item.nsn}`,
            description: masterInfo?.description || '',
            imageKey: masterInfo?.imageKey || null,
            imageUrl: imageUrl,
            // Determine item type based on name/description for filtering
            type: determineItemType(masterInfo?.commonName || '', masterInfo?.description || '')
          };
        } catch (error) {
          console.error('Error fetching master data:', error);
          return {
            ...item,
            commonName: `Item ${item.nsn}`,
            description: '',
            type: 'other'
          };
        }
      }));
      
      setAvailableItems(itemsWithDetails);
    } catch (error) {
      console.error('Error fetching available items:', error);
      throw error;
    }
  };
  
  /**
   * Fetches existing equipment groups
   */
  const fetchExistingGroups = async (uicID) => {
    try {
      const groupsData = await client.graphql({
        query: `query GetGroupsWithItemCounts($uicID: ID!) {
          equipmentGroupsByUicID(
            uicID: $uicID,
            filter: { _deleted: { ne: true } }
          ) {
            items {
              id
              name
              description
              uicID
              createdAt
              updatedAt
              _version
            }
          }
        }`,
        variables: { uicID: uicID }
      });
      
      const groups = groupsData.data.equipmentGroupsByUicID.items;
      
      // For each group, get the number of items in it
      const groupsWithItemCounts = await Promise.all(groups.map(async (group) => {
        try {
          const countResponse = await client.graphql({
            query: `query CountItemsInGroup($groupID: ID!) {
              equipmentItemsByGroupID(
                groupID: $groupID,
                filter: { _deleted: { ne: true } }
              ) {
                items {
                  id
                }
              }
            }`,
            variables: { groupID: group.id }
          });
          
          const itemCount = countResponse.data.equipmentItemsByGroupID.items.length;
          
          return {
            ...group,
            itemCount
          };
        } catch (error) {
          console.error(`Error fetching item count for group ${group.id}:`, error);
          return {
            ...group,
            itemCount: 0
          };
        }
      }));
      
      setExistingGroups(groupsWithItemCounts);
    } catch (error) {
      console.error('Error fetching groups:', error);
      throw error;
    }
  };
  
  /**
   * Fetches items belonging to a specific group
   */
  const fetchGroupItems = async (groupID) => {
    try {
      setLoading(true);
      
      const response = await client.graphql({
        query: equipmentItemsByGroupID,
        variables: { groupID: groupID }
      });
      
      const items = response.data.equipmentItemsByGroupID.items;
      
      // Fetch additional details for each item
      const itemsWithDetails = await Promise.all(items.map(async (item) => {
        try {
          const masterData = await client.graphql({
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
          
          const masterInfo = masterData.data.getEquipmentMaster;
          
          // Get image URL if imageKey exists
          let imageUrl = null;
          if (masterInfo?.imageKey) {
            try {
              const imageUrlResult = await getUrl({
                key: masterInfo.imageKey,
                options: {
                  expiresIn: 3600 // 1 hour
                }
              });
              imageUrl = imageUrlResult.url.toString();
            } catch (err) {
              console.error('Error getting image URL:', err);
            }
          }
          
          return {
            ...item,
            commonName: masterInfo?.commonName || `Item ${item.nsn}`,
            imageKey: masterInfo?.imageKey || null,
            imageUrl: imageUrl
          };
        } catch (error) {
          return {
            ...item,
            commonName: `Item ${item.nsn}`
          };
        }
      }));
      
      setGroupItems(itemsWithDetails);
    } catch (error) {
      console.error('Error fetching group items:', error);
      setError('Failed to load group items.');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Determines item type based on name and description
   * This is used for categorizing items in the UI
   */
  const determineItemType = (name, description) => {
    const text = (name + ' ' + description).toLowerCase();
    
    if (/rifle|pistol|launcher|gun|m4|m16|m249|weapon/.test(text)) return 'weapons';
    if (/optic|sight|scope|acog|eotech|aimpoint/.test(text)) return 'optics';
    if (/radio|comms|communications|sincgars|antenna/.test(text)) return 'comms';
    if (/battery|power|charger/.test(text)) return 'power';
    if (/mount|rail|attachment/.test(text)) return 'attachments';
    if (/ammo|magazine|cartridge|round/.test(text)) return 'ammo';
    if (/case|bag|carrier|pouch/.test(text)) return 'storage';
    
    return 'other';
  };
  
  /**
   * Handles selecting a base item
   */
  const handleSelectBaseItem = (item) => {
    setBaseItem(item);
    // Include stock number in group name if available
    const stockPrefix = item.stockNumber ? `${item.stockNumber} - ` : '';
    setGroupName(`${stockPrefix}${item.commonName} Set`);
  };
  
  /**
   * Handles toggling a component item
   */
  const handleToggleComponent = (item) => {
    if (baseItem && item.id === baseItem.id) return; // Can't select base item as component
    
    const isSelected = selectedComponents.some(i => i.id === item.id);
    
    if (isSelected) {
      setSelectedComponents(selectedComponents.filter(i => i.id !== item.id));
    } else {
      setSelectedComponents([...selectedComponents, item]);
    }
  };
  
  /**
   * Sync the changes to the local DataStore
   */
  const syncChangesToDataStore = async () => {
    if (!DataStoreUtil.isOnlineMode()) {
      console.log('In offline mode - changes will not be synced to DataStore');
      return;
    }
    
    try {
      // Import the models
      const { EquipmentGroup, EquipmentItem } = await import('../../models');
      
      // For each modified item, update it in DataStore
      console.log('Syncing changes to local DataStore...');
      
      // The DataStore will naturally sync with the backend on its next sync cycle
      // but we can manually trigger saves for specific items we've modified
      
      // For now, let's just trigger a global sync for simplicity
      await DataStoreUtil.clearAndSync();
      
      console.log('DataStore sync completed');
    } catch (error) {
      console.error('Error syncing changes to DataStore:', error);
      // We won't block the UI for this error since the changes have been saved to the backend
    }
  };
  
  /**
   * Creates a new equipment group
   */
  const handleCreateGroup = async () => {
    if (!baseItem) {
      setError('Please select a base item for this group.');
      return;
    }
    
    if (!groupName.trim()) {
      setError('Please enter a name for this group.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Add stock number to group name if not already included
      if (baseItem.stockNumber && !groupName.includes(baseItem.stockNumber)) {
        const stockPrefix = `${baseItem.stockNumber} - `;
        if (!groupName.startsWith(stockPrefix)) {
          setGroupName(`${stockPrefix}${groupName}`);
        }
      }
      
      // Create the group
      const createResponse = await client.graphql({
        query: createEquipmentGroup,
        variables: {
          input: {
            name: groupName,
            description: groupDescription,
            uicID: uicID
          }
        }
      });
      
      const newGroup = createResponse.data.createEquipmentGroup;
      
      // Function to update an item with conflict handling
      const updateItemWithRetry = async (item) => {
        try {
          // Try to update the item first
          await client.graphql({
            query: updateEquipmentItem,
            variables: {
              input: {
                id: item.id,
                isPartOfGroup: true,
                groupID: newGroup.id,
                _version: item._version
              }
            }
          });
          return true;
        } catch (error) {
          // If there's a conflict error
          if (error.errors && error.errors.some(e => e.errorType === "ConflictUnhandled")) {
            console.log(`Version conflict for item ${item.id}, fetching latest version...`);
            
            // Get the latest version of the item
            try {
              const response = await client.graphql({
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
              
              const latestItem = response.data.getEquipmentItem;
              
              // If item is already part of a group, skip it
              if (latestItem.isPartOfGroup && latestItem.groupID) {
                console.log(`Item ${item.id} is already part of a group, skipping...`);
                return false;
              }
              
              // Try update again with the latest version
              await client.graphql({
                query: updateEquipmentItem,
                variables: {
                  input: {
                    id: item.id,
                    isPartOfGroup: true,
                    groupID: newGroup.id,
                    _version: latestItem._version
                  }
                }
              });
              return true;
            } catch (retryError) {
              console.error(`Failed to update item ${item.id} after retry:`, retryError);
              return false;
            }
          }
          
          console.error(`Error updating item ${item.id}:`, error);
          return false;
        }
      };
      
      // Update base item
      const baseItemUpdated = await updateItemWithRetry(baseItem);
      if (!baseItemUpdated) {
        setError('Failed to add base item to group. The item may have been modified by another user.');
      }
      
      // Update component items
      let componentsUpdated = 0;
      let componentsFailed = 0;
      
      for (const component of selectedComponents) {
        const success = await updateItemWithRetry(component);
        if (success) {
          componentsUpdated++;
        } else {
          componentsFailed++;
        }
      }
      
      // Show success message with warnings if some items failed
      let successMessage = `Successfully created equipment group "${groupName}"`;
      if (componentsFailed > 0) {
        successMessage += `. Note: ${componentsFailed} out of ${selectedComponents.length} components could not be added to the group.`;
      }
      setSuccess(successMessage);
      
      // Sync changes to local DataStore
      await syncChangesToDataStore();
      
      // Reset form but stay on create tab and keep success message
      handleResetCreateForm();
      
      // Refresh available items
      fetchAvailableItems(uicID);
      fetchExistingGroups(uicID);
    } catch (error) {
      console.error('Error creating group:', error);
      setError('Failed to create equipment group. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Reset the create form
   */
  const handleResetCreateForm = () => {
    setBaseItem(null);
    setSelectedComponents([]);
    setGroupName('');
    setGroupDescription('');
    setSearchTerm('');
    setItemType('all');
  };
  
  /**
   * Filter items based on search term and item type
   */
  const filteredItems = availableItems.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      item.lin?.toLowerCase().includes(searchLower) ||
      item.nsn?.toLowerCase().includes(searchLower) ||
      item.serialNumber?.toLowerCase().includes(searchLower) ||
      item.commonName?.toLowerCase().includes(searchLower);
      
    const matchesType = itemType === 'all' || item.type === itemType;
    
    return matchesSearch && matchesType;
  });
  
  /**
   * Calculate completion status for UI progress indicator
   */
  const completionStatus = () => {
    let steps = 0;
    let completed = 0;
    
    // Step 1: Base item
    steps++;
    if (baseItem) completed++;
    
    // Step 2: Group name
    steps++;
    if (groupName.trim()) completed++;
    
    // Step 3: At least one component (optional)
    if (selectedComponents.length > 0) {
      steps++;
      completed++;
    }
    
    return {
      percent: Math.round((completed / steps) * 100),
      completed,
      total: steps
    };
  };
  
  const status = completionStatus();

  /**
   * Opens the delete confirmation modal for a group
   */
  const handleDeleteGroupClick = (group) => {
    setGroupToDelete(group);
    setShowDeleteModal(true);
    setDeleteError('');
  };

  /**
   * Cancels the delete operation
   */
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setGroupToDelete(null);
  };

  /**
   * Confirms and executes the group deletion
   */
  const handleConfirmDelete = async () => {
    if (!groupToDelete) return;
    
    try {
      setDeleteLoading(true);
      setDeleteError('');
      
      // 1. Fetch all items in the group
      const response = await client.graphql({
        query: equipmentItemsByGroupID,
        variables: { groupID: groupToDelete.id }
      });
      
      const groupItems = response.data.equipmentItemsByGroupID.items;
      console.log(`Found ${groupItems.length} items in the group to release`);
      
      // 2. Release all items from the group
      let releasedCount = 0;
      let failedCount = 0;
      
      for (const item of groupItems) {
        try {
          // Custom update query that ignores version conflicts
          await client.graphql({
            query: `mutation ReleaseItemFromGroup($id: ID!) {
              updateEquipmentItem(
                input: { 
                  id: $id, 
                  isPartOfGroup: false, 
                  groupID: null 
                },
                condition: null
              ) {
                id
              }
            }`,
            variables: { id: item.id }
          });
          
          releasedCount++;
        } catch (error) {
          console.error(`Error releasing item ${item.id} from group:`, error);
          failedCount++;
        }
      }
      
      // 3. Fetch the latest version of the group to handle conflicts
      try {
        const getGroupResponse = await client.graphql({
          query: `query GetEquipmentGroup($id: ID!) {
            getEquipmentGroup(id: $id) {
              id
              _version
            }
          }`,
          variables: { id: groupToDelete.id }
        });
        
        const latestGroup = getGroupResponse.data.getEquipmentGroup;
        if (!latestGroup) {
          throw new Error("Couldn't fetch the latest version of the group");
        }
        
        // 4. Delete the group itself using the latest version
        await client.graphql({
          query: deleteEquipmentGroup,
          variables: {
            input: {
              id: groupToDelete.id,
              _version: latestGroup._version
            }
          }
        });
        
        // 5. Sync changes to local DataStore
        await syncChangesToDataStore();
        
        // 6. Show success message and refresh the view
        setSuccess(`Successfully deleted group "${groupToDelete.name}". Released ${releasedCount} items from the group.${
          failedCount > 0 ? ` Failed to release ${failedCount} items.` : ''
        }`);
        
        setShowDeleteModal(false);
        setGroupToDelete(null);
        
        // If we were viewing the deleted group, go back to the groups list
        if (selectedGroup && selectedGroup.id === groupToDelete.id) {
          setSelectedGroup(null);
        }
        
        // Refresh the groups list
        fetchExistingGroups(uicID);
      } catch (groupError) {
        console.error('Error fetching or deleting group:', groupError);
        
        // Fallback approach - try a direct deletion with condition: null to override version checking
        try {
          await client.graphql({
            query: `mutation ForceDeleteEquipmentGroup($id: ID!) {
              deleteEquipmentGroup(
                input: { id: $id },
                condition: null
              ) {
                id
              }
            }`,
            variables: { id: groupToDelete.id }
          });
          
          // Success with fallback approach
          await syncChangesToDataStore();
          
          setSuccess(`Successfully deleted group "${groupToDelete.name}" with force delete. Released ${releasedCount} items from the group.${
            failedCount > 0 ? ` Failed to release ${failedCount} items.` : ''
          }`);
          
          setShowDeleteModal(false);
          setGroupToDelete(null);
          
          if (selectedGroup && selectedGroup.id === groupToDelete.id) {
            setSelectedGroup(null);
          }
          
          fetchExistingGroups(uicID);
        } catch (fallbackError) {
          console.error('Fallback delete also failed:', fallbackError);
          throw new Error('Both delete approaches failed. The group may have been already deleted or modified.');
        }
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      setDeleteError(`Failed to delete group: ${error.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="equipment-groups-v3">
      <div className="groups-header">
        <h2>Manage Equipment Groups</h2>
        <button className="back-button" onClick={onBack}>
          &larr; Back
        </button>
      </div>
      
      {/* Tabs */}
      <div className="groups-tabs">
        <button 
          className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create Group
        </button>
        <button 
          className={`tab-button ${activeTab === 'view' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('view');
            setSelectedGroup(null);
          }}
        >
          View Groups
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      {/* Loading state with retry button */}
      {loading && (
        <div className="loading-overlay">
          <div>Loading...</div>
          <button 
            className="retry-button"
            onClick={() => {
              setLoading(false);
              handleResetCreateForm();
            }}
          >
            Cancel and Reset Form
          </button>
        </div>
      )}
      
      {/* Create Group Tab */}
      {activeTab === 'create' && (
        <div className="create-group-v3">
          {/* Progress Bar */}
          <div className="progress-container">
            <div className="progress-text">
              Group Setup: {status.completed} of {status.total} steps completed
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${status.percent}%` }}
              ></div>
            </div>
          </div>
          
          {/* Base Item Selection */}
          <div className="base-item-section">
            <h3>
              {baseItem ? 'Base Item Selected' : 'Select Base Item'}
              {baseItem && (
                <button 
                  className="clear-button"
                  onClick={() => setBaseItem(null)}
                >
                  Clear
                </button>
              )}
            </h3>
            
            {baseItem && (
              <div className="selected-base-v3">
                <div className="base-item-tile">
                  {baseItem.imageUrl ? (
                    <img 
                      src={baseItem.imageUrl} 
                      alt={baseItem.commonName} 
                      className="item-thumbnail" 
                    />
                  ) : (
                    <div className="item-icon" data-type={baseItem.type || 'other'}>
                      {baseItem.type === 'weapons' ? '🔫' : 
                       baseItem.type === 'optics' ? '🔍' : 
                       baseItem.type === 'comms' ? '📻' : '📦'}
                    </div>
                  )}
                  <div className="item-info">
                    <div className="item-name">{baseItem.commonName}</div>
                    <div className="item-details">
                      <span>NSN: {baseItem.nsn}</span>
                      {baseItem.serialNumber && <span>S/N: {baseItem.serialNumber}</span>}
                      {baseItem.stockNumber && <span>Stock #: {baseItem.stockNumber}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Components Section */}
          <div className="components-section">
            <h3>
              {selectedComponents.length > 0 
                ? `Components Selected (${selectedComponents.length})` 
                : 'Select Components'}
              {selectedComponents.length > 0 && (
                <button 
                  className="clear-button"
                  onClick={() => setSelectedComponents([])}
                >
                  Clear All
                </button>
              )}
            </h3>
            
            {selectedComponents.length > 0 && (
              <div className="selected-components-grid">
                {selectedComponents.map(component => (
                  <div 
                    key={component.id} 
                    className="component-tile"
                  >
                    {component.imageUrl ? (
                      <img 
                        src={component.imageUrl} 
                        alt={component.commonName} 
                        className="item-thumbnail" 
                      />
                    ) : (
                      <div className="item-icon" data-type={component.type || 'other'}>
                        {component.type === 'weapons' ? '🔫' : 
                         component.type === 'optics' ? '🔍' : 
                         component.type === 'comms' ? '📻' : '📦'}
                      </div>
                    )}
                    <div className="item-info">
                      <div className="item-name text-ellipsis" title={component.commonName}>{component.commonName}</div>
                      <div className="item-details">
                        <span className="text-ellipsis" title={`NSN: ${component.nsn}`}>NSN: {component.nsn}</span>
                        {component.serialNumber && <span className="text-ellipsis" title={`S/N: ${component.serialNumber}`}>S/N: {component.serialNumber}</span>}
                        {component.stockNumber && <span className="text-ellipsis" title={`Stock #: ${component.stockNumber}`}>Stock #: {component.stockNumber}</span>}
                      </div>
                    </div>
                    <button 
                      className="remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleComponent(component);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                
                <div className="add-component-tile">
                  <div className="add-icon">+</div>
                  <div>Add Component</div>
                </div>
              </div>
            )}
          </div>
          
          {/* Search and Filter */}
          <div className="search-filter-v3">
            <div className="search-box">
              <input 
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="filter-tabs">
              <button 
                className={`filter-tab ${itemType === 'all' ? 'active' : ''}`}
                onClick={() => setItemType('all')}
              >
                All
              </button>
              <button 
                className={`filter-tab ${itemType === 'weapons' ? 'active' : ''}`}
                onClick={() => setItemType('weapons')}
              >
                Weapons
              </button>
              <button 
                className={`filter-tab ${itemType === 'optics' ? 'active' : ''}`}
                onClick={() => setItemType('optics')}
              >
                Optics
              </button>
              <button 
                className={`filter-tab ${itemType === 'comms' ? 'active' : ''}`}
                onClick={() => setItemType('comms')}
              >
                Comms
              </button>
              <button 
                className={`filter-tab ${itemType === 'attachments' ? 'active' : ''}`}
                onClick={() => setItemType('attachments')}
              >
                Attachments
              </button>
            </div>
          </div>
          
          {/* Items Grid */}
          <div className="items-grid-v3">
            {filteredItems.length === 0 ? (
              <div className="no-items-found">No matching items found.</div>
            ) : (
              filteredItems.map(item => {
                const isBase = baseItem && baseItem.id === item.id;
                const isComponent = selectedComponents.some(c => c.id === item.id);
                
                return (
                  <div 
                    key={item.id}
                    className={`item-tile ${isBase ? 'is-base' : ''} ${isComponent ? 'is-component' : ''}`}
                    onClick={() => {
                      if (!isBase && !isComponent) {
                        if (!baseItem) {
                          handleSelectBaseItem(item);
                        } else {
                          handleToggleComponent(item);
                        }
                      } else if (isComponent) {
                        handleToggleComponent(item);
                      }
                    }}
                  >
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.commonName} 
                        className="item-thumbnail" 
                      />
                    ) : (
                      <div className="item-icon" data-type={item.type || 'other'}>
                        {item.type === 'weapons' ? '🔫' : 
                         item.type === 'optics' ? '🔍' : 
                         item.type === 'comms' ? '📻' : '📦'}
                      </div>
                    )}
                    <div className="item-info">
                      <div className="item-name">{item.commonName}</div>
                      <div className="item-details">
                        <span>NSN: {item.nsn}</span>
                        {item.serialNumber && <span>S/N: {item.serialNumber}</span>}
                        {item.stockNumber && <span>Stock #: {item.stockNumber}</span>}
                      </div>
                    </div>
                    {isBase && <div className="item-badge base">Base</div>}
                    {isComponent && <div className="item-badge component">Component</div>}
                  </div>
                );
              })
            )}
          </div>
          
          {/* Group Form - Moved to bottom */}
          <div className="group-details-form">
            <div className="form-group">
              <label>Group Name:</label>
              <input 
                type="text" 
                value={groupName} 
                onChange={(e) => setGroupName(e.target.value)} 
                placeholder="e.g., M4 Rifle Set"
                className={groupName ? 'valid' : ''}
              />
            </div>
            
            <div className="form-group">
              <label>Description (Optional):</label>
              <textarea 
                value={groupDescription} 
                onChange={(e) => setGroupDescription(e.target.value)} 
                placeholder="Enter details about this equipment group"
                rows={2}
              />
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="group-actions">
            <button 
              className="secondary-button"
              onClick={handleResetCreateForm}
            >
              Reset
            </button>
            <button 
              className="primary-button"
              onClick={handleCreateGroup}
              disabled={!baseItem || !groupName.trim()}
            >
              Create Group
            </button>
          </div>
        </div>
      )}
      
      {/* View Groups Tab - Add delete button to each group */}
      {activeTab === 'view' && !selectedGroup && (
        <div className="view-groups-v3">
          <h3>Your Equipment Groups</h3>
          
          {existingGroups.length === 0 ? (
            <div className="no-groups-message">
              You haven't created any equipment groups yet.
            </div>
          ) : (
            <div className="groups-grid">
              {existingGroups.map(group => (
                <div 
                  key={group.id}
                  className="group-tile"
                >
                  <div className="group-tile-content" onClick={() => setSelectedGroup(group)}>
                    <h4>{group.name}</h4>
                    {group.description && <p>{group.description}</p>}
                    <div className="group-item-count">
                      {group.itemCount} {group.itemCount === 1 ? 'item' : 'items'}
                    </div>
                  </div>
                  <div className="group-tile-actions">
                    <button 
                      className="delete-group-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGroupClick(group);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* View Single Group - Add delete button */}
      {activeTab === 'view' && selectedGroup && (
        <div className="view-single-group">
          <div className="group-header">
            <button 
              className="back-to-groups"
              onClick={() => setSelectedGroup(null)}
            >
              &larr; Back to Groups
            </button>
            <h3>{selectedGroup.name}</h3>
            <button 
              className="delete-group-btn"
              onClick={() => handleDeleteGroupClick(selectedGroup)}
            >
              Delete Group
            </button>
          </div>
          
          {selectedGroup.description && (
            <div className="group-description">
              {selectedGroup.description}
            </div>
          )}
          
          <h4>Group Items</h4>
          {groupItems.length === 0 ? (
            <div className="loading">Loading group items...</div>
          ) : (
            <div className="group-items-grid">
              {groupItems.map(item => (
                <div key={item.id} className="group-item-tile">
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.commonName} 
                      className="item-thumbnail" 
                    />
                  ) : (
                    <div className="item-icon">📦</div>
                  )}
                  <div className="item-name">{item.commonName}</div>
                  <div className="item-details">
                    <div>NSN: {item.nsn}</div>
                    <div>LIN: {item.lin}</div>
                    {item.serialNumber && <div>S/N: {item.serialNumber}</div>}
                    {item.stockNumber && <div>Stock #: {item.stockNumber}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Add Delete Group Confirmation Modal */}
      {showDeleteModal && groupToDelete && (
        <div className="modal-overlay">
          <div className="modal-content delete-confirmation-modal">
            <h2>Delete Equipment Group</h2>
            <p className="warning-text">
              Are you sure you want to delete the group "{groupToDelete.name}"?
            </p>
            
            <div className="warning-box">
              <p>This will remove the grouping relationship but will NOT delete the individual equipment items.</p>
              <p>All items in this group will be released and will become available as individual items.</p>
            </div>
            
            {deleteError && <div className="error-message">{deleteError}</div>}
            
            <div className="modal-actions">
              <button 
                className="secondary-button"
                onClick={handleCancelDelete}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button 
                className="delete-btn"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Group'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add some CSS for text ellipsis right after the return statement */}
      <style jsx>{`
        .text-ellipsis {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
          display: inline-block;
        }
        
        .retry-button {
          margin-top: 15px;
          padding: 8px 16px;
          background-color: #5a5a5a;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .retry-button:hover {
          background-color: #4a4a4a;
        }
        
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          z-index: 1000;
          font-size: 1.2rem;
        }
      `}</style>
    </div>
  );
}

export default ManageGroupsModal3; 