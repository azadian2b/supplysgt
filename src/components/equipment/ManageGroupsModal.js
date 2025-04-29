import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { createEquipmentGroup, updateEquipmentItem } from '../../graphql/mutations';
import { equipmentItemsByUicID } from '../../graphql/queries';
import './Equipment.css';

/**
 * ManageGroupsModal component - Design 1: Two-panel layout with base item selection and component items
 */
function ManageGroupsModal({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uicID, setUicID] = useState(null);
  const [availableItems, setAvailableItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBaseItem, setSelectedBaseItem] = useState(null);
  const [selectedComponents, setSelectedComponents] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [activeStep, setActiveStep] = useState(1); // Step 1: Select base item, Step 2: Select components
  const client = generateClient();

  // Fetch available equipment items on component mount
  useEffect(() => {
    fetchEquipmentItems();
  }, []);

  /**
   * Fetches equipment items from the API that are not already part of a group
   */
  const fetchEquipmentItems = async () => {
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
      
      // Fetch equipment items that are NOT part of any group
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
    } catch (error) {
      console.error('Error fetching equipment items:', error);
      setError('Failed to load equipment items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles selecting a base item for the group
   */
  const handleSelectBaseItem = (item) => {
    setSelectedBaseItem(item);
    
    // Pre-fill group name based on selected item
    setGroupName(`${item.commonName} Set`);
    
    setActiveStep(2); // Move to component selection step
  };

  /**
   * Handles toggling a component item selection
   */
  const handleToggleComponent = (item) => {
    if (item.id === selectedBaseItem.id) {
      return; // Can't select base item as a component
    }
    
    const isAlreadySelected = selectedComponents.some(comp => comp.id === item.id);
    
    if (isAlreadySelected) {
      setSelectedComponents(selectedComponents.filter(comp => comp.id !== item.id));
    } else {
      setSelectedComponents([...selectedComponents, item]);
    }
  };

  /**
   * Creates the equipment group
   */
  const handleCreateGroup = async () => {
    if (!selectedBaseItem) {
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
      
      // Step 1: Create the equipment group
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
      
      // Step 2: Update the base item to be part of the group
      await client.graphql({
        query: updateEquipmentItem,
        variables: {
          input: {
            id: selectedBaseItem.id,
            isPartOfGroup: true,
            groupID: newGroup.id
          }
        }
      });
      
      // Step 3: Update all selected component items
      await Promise.all(selectedComponents.map(component => 
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
      
      setSuccess(`Created equipment group "${groupName}" with ${selectedComponents.length + 1} items.`);
      
      // Reset the form
      setSelectedBaseItem(null);
      setSelectedComponents([]);
      setGroupName('');
      setGroupDescription('');
      setActiveStep(1);
      
      // Refresh the available items
      fetchEquipmentItems();
    } catch (error) {
      console.error('Error creating equipment group:', error);
      setError('Failed to create equipment group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filters items based on the search term
   */
  const filteredItems = availableItems.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.lin?.toLowerCase().includes(searchLower) ||
      item.nsn?.toLowerCase().includes(searchLower) ||
      item.serialNumber?.toLowerCase().includes(searchLower) ||
      item.commonName?.toLowerCase().includes(searchLower)
    );
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
      
      <div className="group-creation-flow">
        <div className="step-indicators">
          <div className={`step-indicator ${activeStep === 1 ? 'active' : ''}`}>
            1. Select Base Item
          </div>
          <div className={`step-indicator ${activeStep === 2 ? 'active' : ''}`}>
            2. Add Components
          </div>
        </div>
        
        {/* Step 1 - Base Item Selection */}
        {activeStep === 1 && (
          <div className="step-content">
            <h3>Select a Base Item</h3>
            <p>Choose the primary item that will serve as the base for this equipment group.</p>
            
            <div className="search-container">
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="items-grid">
              {filteredItems.length === 0 ? (
                <div className="no-items">No eligible items found. Items that are already part of a group are not shown.</div>
              ) : (
                filteredItems.map(item => (
                  <div 
                    key={item.id} 
                    className="item-card"
                    onClick={() => handleSelectBaseItem(item)}
                  >
                    <div className="item-card-content">
                      <h4>{item.commonName}</h4>
                      <div className="item-details">
                        <div><strong>NSN:</strong> {item.nsn}</div>
                        <div><strong>LIN:</strong> {item.lin}</div>
                        {item.serialNumber && <div><strong>S/N:</strong> {item.serialNumber}</div>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {/* Step 2 - Component Selection and Group Creation */}
        {activeStep === 2 && selectedBaseItem && (
          <div className="step-content">
            <div className="selected-base-item">
              <h3>Base Item:</h3>
              <div className="selected-item-card">
                <h4>{selectedBaseItem.commonName}</h4>
                <div className="item-details">
                  <div><strong>NSN:</strong> {selectedBaseItem.nsn}</div>
                  <div><strong>LIN:</strong> {selectedBaseItem.lin}</div>
                  {selectedBaseItem.serialNumber && <div><strong>S/N:</strong> {selectedBaseItem.serialNumber}</div>}
                </div>
              </div>
            </div>
            
            <div className="group-form">
              <div className="form-group">
                <label>Group Name:</label>
                <input 
                  type="text" 
                  value={groupName} 
                  onChange={(e) => setGroupName(e.target.value)} 
                  placeholder="e.g., Rifle Set, Radio Package"
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
            
            <h3>Select Component Items</h3>
            <p>Choose additional items to include in this equipment group.</p>
            
            <div className="search-container">
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="component-selection">
              {filteredItems.filter(item => item.id !== selectedBaseItem.id).length === 0 ? (
                <div className="no-items">No eligible component items found.</div>
              ) : (
                <div className="items-grid">
                  {filteredItems
                    .filter(item => item.id !== selectedBaseItem.id)
                    .map(item => {
                      const isSelected = selectedComponents.some(comp => comp.id === item.id);
                      return (
                        <div 
                          key={item.id} 
                          className={`item-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleToggleComponent(item)}
                        >
                          <div className="item-card-content">
                            <h4>{item.commonName}</h4>
                            <div className="item-details">
                              <div><strong>NSN:</strong> {item.nsn}</div>
                              <div><strong>LIN:</strong> {item.lin}</div>
                              {item.serialNumber && <div><strong>S/N:</strong> {item.serialNumber}</div>}
                            </div>
                          </div>
                          {isSelected && <div className="selected-indicator">✓</div>}
                        </div>
                      );
                    })
                  }
                </div>
              )}
            </div>
            
            <div className="form-actions">
              <button 
                className="secondary-button" 
                onClick={() => {
                  setActiveStep(1);
                  setSelectedBaseItem(null);
                  setSelectedComponents([]);
                }}
              >
                Back
              </button>
              <button 
                className="primary-button" 
                onClick={handleCreateGroup}
                disabled={loading}
              >
                Create Equipment Group
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageGroupsModal; 