import React, { useState } from 'react';

/**
 * Equipment selection component for Supply Sergeants to pick items for accountability
 */
const EquipmentSelect = ({
  equipment = { groups: [], groupsMap: {}, soldiersMap: {}, masterItems: {} },
  onStartAccountability,
  loading = false
}) => {
  const { groups, groupsMap, soldiersMap, masterItems } = equipment;
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBySoldier, setFilterBySoldier] = useState('all');
  const [sortBy, setSortBy] = useState('nomenclature');
  const [keepGrouped, setKeepGrouped] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});
  
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
  
  // Get filtered and sorted equipment list
  const getFilteredItems = () => {
    return equipment.filterAndSortItems(
      searchTerm, 
      filterBySoldier, 
      sortBy, 
      keepGrouped
    );
  };
  
  // Get items in a group
  const getGroupItems = (groupId) => {
    return equipment.getGroupItems(groupId).filter(item => {
      const inSearchTerm = searchTerm === '' ||
        (masterItems[item.equipmentMasterID]?.commonName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nsn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by soldier
      const matchesSoldierFilter = filterBySoldier === 'all' || item.assignedToID === filterBySoldier;
      
      return inSearchTerm && matchesSoldierFilter;
    });
  };
  
  // Handle start of accountability
  const handleStartAccountability = () => {
    if (selectedItems.length === 0) return;
    onStartAccountability(selectedItems);
  };
  
  const filteredItems = equipment.handReceiptedItems ? 
    equipment.filterAndSortItems(searchTerm, filterBySoldier, sortBy, keepGrouped) : 
    [];
  
  return (
    <div className="equipment-selection">
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
            {equipment.soldiers && equipment.soldiers.map(soldier => (
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
              checked={selectedItems.length > 0 && selectedItems.length === equipment.handReceiptedItems?.length}
              onChange={() => {
                if (selectedItems.length === equipment.handReceiptedItems?.length) {
                  setSelectedItems([]);
                } else if (equipment.handReceiptedItems) {
                  setSelectedItems([...equipment.handReceiptedItems]);
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
        {sortBy === 'nomenclature' && keepGrouped && groups && groups.map(group => {
          const groupItems = getGroupItems(group.id);
          
          if (groupItems.length === 0) return null;
          
          const isExpanded = expandedGroups[group.id];
          
          return (
            <div key={group.id} className="equipment-group">
              <div className="equipment-group-header" onClick={() => toggleGroupExpansion(group.id)}>
                <div className="expand-icon">{isExpanded ? '▼' : '►'}</div>
                <div className="group-name">{group.name}</div>
                <div className="group-count">{groupItems.length} items</div>
              </div>
              
              {isExpanded && (
                <div className="equipment-group-items">
                  {groupItems.map(item => {
                    const masterData = masterItems[item.equipmentMasterID];
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
                        <div className="equipment-name">{masterData ? masterData.commonName : `Item ${item.nsn}`}</div>
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
          filteredItems
            .filter(item => !item.isPartOfGroup || !item.groupID)
            .map(item => {
              const masterData = masterItems[item.equipmentMasterID];
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
                  <div className="equipment-name">{masterData ? masterData.commonName : `Item ${item.nsn}`}</div>
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
          filteredItems.map(item => {
            const masterData = masterItems[item.equipmentMasterID];
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
                <div className="equipment-name">{masterData ? masterData.commonName : `Item ${item.nsn}`}</div>
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
          onClick={handleStartAccountability}
          disabled={selectedItems.length === 0 || loading}
        >
          Conduct Accountability
        </button>
      </div>
    </div>
  );
};

export default EquipmentSelect; 