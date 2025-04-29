import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { createEquipmentGroup, updateEquipmentItem } from '../../graphql/mutations';
import { equipmentItemsByUicID, equipmentGroupsByUicID } from '../../graphql/queries';
import './Equipment.css';

/**
 * ManageGroupsModal component - Design 2: Searchable category-based approach
 * This design organizes items by categories and uses a mobile-friendly
 * filter-as-you-type interface with a bottom sliding tray for selected items.
 */
function ManageGroupsModal2({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uicID, setUicID] = useState(null);
  const [availableItems, setAvailableItems] = useState([]);
  const [existingGroups, setExistingGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [createMode, setCreateMode] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  
  // Group creation state
  const [baseItem, setBaseItem] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  
  // UI state
  const [showSelected, setShowSelected] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const client = generateClient();

  // Fetch available equipment items and existing groups on component mount
  useEffect(() => {
    fetchData();
  }, []);
  
  // Generate categories based on available items
  useEffect(() => {
    if (availableItems.length > 0) {
      const uniqueCategories = [...new Set(availableItems.map(item => item.commonName.split(' ')[0]))];
      setCategories(uniqueCategories);
    }
  }, [availableItems]);

  /**
   * Fetches equipment items and existing groups
   */
  const fetchData = async () => {
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
      
      // Fetch available equipment items that are not part of any group
      const equipmentData = await client.graphql({
        query: equipmentItemsByUicID,
        variables: { 
          uicID: userData.uicID,
          filter: { 
            isPartOfGroup: { ne: true },
            _deleted: { ne: true }
          }
        }
      });
      
      const equipmentItems = equipmentData.data.equipmentItemsByUicID.items;
      
      // Fetch additional details about each item (from equipmentMaster)
      const itemsWithDetails = await Promise.all(equipmentItems.map(async (item) => {
        try {
          const masterData = await client.graphql({
            query: `query GetEquipmentMaster($id: ID!) {
              getEquipmentMaster(id: $id) {
                id
                nsn
                commonName
              }
            }`,
            variables: { id: item.equipmentMasterID }
          });
          
          const masterInfo = masterData.data.getEquipmentMaster;
          return {
            ...item,
            commonName: masterInfo?.commonName || `Item ${item.nsn}`
          };
        } catch (error) {
          console.error('Error fetching master data:', error);
          return {
            ...item,
            commonName: `Item ${item.nsn}`
          };
        }
      }));
      
      setAvailableItems(itemsWithDetails);
      
      // Fetch existing equipment groups
      const groupsData = await client.graphql({
        query: equipmentGroupsByUicID,
        variables: { 
          uicID: userData.uicID,
          filter: { _deleted: { ne: true } }
        }
      });
      
      const groups = groupsData.data.equipmentGroupsByUicID.items;
      setExistingGroups(groups);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load equipment data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles selecting an item for the group
   */
  const handleSelectItem = (item) => {
    if (!baseItem) {
      // If no base item, set this as the base
      setBaseItem(item);
      setGroupName(`${item.commonName} Set`);
    } else {
      // Otherwise add/remove from selected components
      const isAlreadySelected = selectedItems.some(i => i.id === item.id);
      
      if (isAlreadySelected) {
        setSelectedItems(selectedItems.filter(i => i.id !== item.id));
      } else {
        setSelectedItems([...selectedItems, item]);
      }
    }
  };

  /**
   * Creates a new equipment group
   */
  const handleCreateGroup = async () => {
    if (!baseItem) {
      setError('Please select a base item for the group.');
      return;
    }
    
    if (!groupName.trim()) {
      setError('Please enter a name for the group.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Create the equipment group
      const createGroupResponse = await client.graphql({
        query: createEquipmentGroup,
        variables: {
          input: {
            name: groupName,
            description: groupDescription,
            uicID: uicID
          }
        }
      });
      
      const newGroup = createGroupResponse.data.createEquipmentGroup;
      
      // Update the base item
      await client.graphql({
        query: updateEquipmentItem,
        variables: {
          input: {
            id: baseItem.id,
            isPartOfGroup: true,
            groupID: newGroup.id
          }
        }
      });
      
      // Update all selected component items
      await Promise.all(selectedItems.map(component => 
        client.graphql({
          query: updateEquipmentItem,
          variables: {
            input: {
              id: component.id,
              isPartOfGroup: true,
              groupID: newGroup.id
            }
          }
        })
      ));
      
      setSuccess(`Created equipment group "${groupName}" with ${selectedItems.length + 1} items.`);
      
      // Reset state and refresh data
      setBaseItem(null);
      setSelectedItems([]);
      setGroupName('');
      setGroupDescription('');
      setCreateMode(false);
      fetchData();
    } catch (error) {
      console.error('Error creating equipment group:', error);
      setError('Failed to create equipment group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resets the create form
   */
  const handleCancelCreate = () => {
    setBaseItem(null);
    setSelectedItems([]);
    setGroupName('');
    setGroupDescription('');
    setCreateMode(false);
  };

  /**
   * Clears a previously selected base item
   */
  const handleClearBaseItem = () => {
    setBaseItem(null);
    setGroupName('');
  };

  /**
   * Filters items based on search term and selected category
   */
  const filteredItems = availableItems.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      item.lin?.toLowerCase().includes(searchLower) ||
      item.nsn?.toLowerCase().includes(searchLower) ||
      item.serialNumber?.toLowerCase().includes(searchLower) ||
      item.commonName?.toLowerCase().includes(searchLower);
      
    const matchesCategory = 
      selectedCategory === 'all' || 
      (item.commonName && item.commonName.toLowerCase().startsWith(selectedCategory.toLowerCase()));
      
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="equipment-groups-container">
      <div className="groups-header">
        <h2>Manage Equipment Groups</h2>
        <button className="back-button" onClick={onBack}>
          &larr; Back
        </button>
      </div>
      
      {loading && <div className="loading">Loading...</div>}
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      {!createMode && !viewMode && (
        <>
          <div className="groups-actions">
            <button 
              className="primary-button"
              onClick={() => setCreateMode(true)}
            >
              Create New Group
            </button>
          </div>
          
          <h3>Existing Equipment Groups</h3>
          {existingGroups.length === 0 ? (
            <div className="no-groups">No equipment groups have been created yet.</div>
          ) : (
            <div className="groups-list">
              {existingGroups.map(group => (
                <div 
                  key={group.id}
                  className="group-card"
                  onClick={() => {
                    setSelectedGroup(group);
                    setViewMode(true);
                  }}
                >
                  <h4>{group.name}</h4>
                  {group.description && <p>{group.description}</p>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      {createMode && (
        <div className="create-group-container">
          <h3>Create Equipment Group</h3>
          
          <div className="group-form">
            <div className="form-group">
              <label>Group Name:</label>
              <input 
                type="text" 
                value={groupName} 
                onChange={(e) => setGroupName(e.target.value)} 
                placeholder="e.g., M4 Rifle Set, SINCGARS Radio Set"
              />
            </div>
            
            <div className="form-group">
              <label>Description (Optional):</label>
              <textarea 
                value={groupDescription} 
                onChange={(e) => setGroupDescription(e.target.value)} 
                placeholder="Enter a description for this equipment group"
                rows={3}
              />
            </div>
          </div>
          
          {baseItem ? (
            <div className="base-item-container">
              <div className="base-item-header">
                <h4>Base Item:</h4>
                <button 
                  className="small-button"
                  onClick={handleClearBaseItem}
                >
                  Change
                </button>
              </div>
              <div className="base-item-card">
                <h5>{baseItem.commonName}</h5>
                <div className="item-details">
                  <div><strong>NSN:</strong> {baseItem.nsn}</div>
                  <div><strong>LIN:</strong> {baseItem.lin}</div>
                  {baseItem.serialNumber && (
                    <div><strong>S/N:</strong> {baseItem.serialNumber}</div>
                  )}
                </div>
              </div>
              
              <h4>Add Components</h4>
            </div>
          ) : (
            <div className="select-base-item">
              <h4>Select a Base Item</h4>
              <p>Choose the primary item that will serve as the base for this equipment group.</p>
            </div>
          )}
          
          <div className="search-and-filter">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="categories-filter">
              <button 
                className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`} 
                onClick={() => setSelectedCategory('all')}
              >
                All
              </button>
              {categories.map(category => (
                <button 
                  key={category}
                  className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          
          <div className="items-list">
            {filteredItems.length === 0 ? (
              <div className="no-items">No matching items found.</div>
            ) : (
              filteredItems.map(item => {
                const isBase = baseItem && baseItem.id === item.id;
                const isSelected = selectedItems.some(i => i.id === item.id);
                const isDisabled = (baseItem && !isBase && !isSelected && selectedItems.length >= 10);
                
                return (
                  <div 
                    key={item.id}
                    className={`item-row ${isBase ? 'is-base' : ''} ${isSelected ? 'is-selected' : ''} ${isDisabled ? 'is-disabled' : ''}`}
                    onClick={() => !isDisabled && handleSelectItem(item)}
                  >
                    <div className="item-details">
                      <h5>{item.commonName}</h5>
                      <div className="item-specs">
                        <span>NSN: {item.nsn}</span>
                        <span>LIN: {item.lin}</span>
                        {item.serialNumber && <span>S/N: {item.serialNumber}</span>}
                      </div>
                    </div>
                    <div className="item-status">
                      {isBase && <span className="status-badge base">Base</span>}
                      {isSelected && <span className="status-badge selected">Selected</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {(baseItem || selectedItems.length > 0) && (
            <div className={`selected-tray ${showSelected ? 'open' : ''}`}>
              <div 
                className="tray-header"
                onClick={() => setShowSelected(!showSelected)}
              >
                <span>Selected Items ({selectedItems.length + (baseItem ? 1 : 0)})</span>
                <span className="tray-toggle">{showSelected ? '▼' : '▲'}</span>
              </div>
              
              {showSelected && (
                <div className="tray-content">
                  {baseItem && (
                    <div className="tray-item is-base">
                      <div className="tray-item-name">{baseItem.commonName}</div>
                      <div className="tray-item-badge">Base</div>
                    </div>
                  )}
                  
                  {selectedItems.map(item => (
                    <div 
                      key={item.id} 
                      className="tray-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectItem(item);
                      }}
                    >
                      <div className="tray-item-name">{item.commonName}</div>
                      <div className="tray-item-remove">✕</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="action-buttons">
            <button 
              className="secondary-button"
              onClick={handleCancelCreate}
            >
              Cancel
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
    </div>
  );
}

export default ManageGroupsModal2; 