import React, { useState, useEffect } from 'react';
import './Pages.css';
import AddEquipmentModal from '../components/equipment/AddEquipmentModal';
import InventoryList from '../components/equipment/InventoryList';
import ManageGroupsModal from '../components/equipment/ManageGroupsModal3';
import EquipmentMasterModal from '../components/equipment/EquipmentMasterModal';
import FixAttributesModal from '../components/admin/FixAttributesModal';

function Manage() {
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [showEquipmentMaster, setShowEquipmentMaster] = useState(false);
  const [showFixAttributesModal, setShowFixAttributesModal] = useState(false);
  
  // Check session storage for stored navigation state on component mount
  useEffect(() => {
    // Check if we should automatically open the inventory view
    const shouldOpenInventory = sessionStorage.getItem('openInventoryView');
    if (shouldOpenInventory === 'true') {
      // Open the inventory view
      setShowInventory(true);
      // Clear the session storage item so it doesn't persist across page visits
      sessionStorage.removeItem('openInventoryView');
    }
  }, []);

  return (
    <div className="page-container">
      <h1>Manage Equipment</h1>
      
      <div className="action-buttons">
        <button 
          className="primary-button"
          onClick={() => setShowAddEquipment(true)}
        >
          Add New Equipment
        </button>
        <button 
          className="master-button"
          onClick={() => setShowEquipmentMaster(true)}
        >
          Manage Item Catalog
        </button>
        <button 
          className="secondary-button"
          onClick={() => setShowInventory(true)}
        >
          View Inventory
        </button>
        <button 
          className="group-button"
          onClick={() => setShowGroups(true)}
        >
          Manage Equipment Groups
        </button>
      </div>
      
      <div className="admin-actions">
        <h3>Advanced Tools</h3>
        <button 
          className="admin-button"
          onClick={() => setShowFixAttributesModal(true)}
        >
          Fix Missing Attributes
        </button>
      </div>

      {!showAddEquipment && !showInventory && !showGroups && !showEquipmentMaster && !showFixAttributesModal && (
        <p>Use the buttons above to add new equipment, update item details, view your unit's inventory, or manage equipment groups.</p>
      )}

      {showAddEquipment && (
        <AddEquipmentModal onClose={() => setShowAddEquipment(false)} />
      )}

      {showEquipmentMaster && (
        <EquipmentMasterModal onClose={() => setShowEquipmentMaster(false)} />
      )}

      {showInventory && (
        <InventoryList onBack={() => setShowInventory(false)} />
      )}

      {showGroups && (
        <ManageGroupsModal onBack={() => setShowGroups(false)} />
      )}
      
      {showFixAttributesModal && (
        <FixAttributesModal onClose={() => setShowFixAttributesModal(false)} />
      )}
    </div>
  );
}

export default Manage; 