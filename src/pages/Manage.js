import React, { useState, useEffect } from 'react';
import './Pages.css';
import '../App.css';
import '../components/equipment/ModalStyles.css';
import AddEquipmentModal from '../components/equipment/AddEquipmentModal';
import InventoryList from '../components/equipment/InventoryList';
import ManageGroupsModal from '../components/equipment/ManageGroupsModal3';
import EquipmentMasterModal from '../components/equipment/EquipmentMasterModal';

function Manage() {
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [showEquipmentMaster, setShowEquipmentMaster] = useState(false);
  
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
      
      <div className="button-container" style={{ maxWidth: '400px', margin: '2rem auto' }}>
        <button 
          className="nav-button"
          onClick={() => setShowAddEquipment(true)}
        >
          Add New Equipment
        </button>
        <button 
          className="nav-button"
          onClick={() => setShowEquipmentMaster(true)}
        >
          Manage Item Catalog
        </button>
        <button 
          className="nav-button"
          onClick={() => setShowInventory(true)}
        >
          View Inventory
        </button>
        <button 
          className="nav-button"
          onClick={() => setShowGroups(true)}
        >
          Manage Equipment Groups
        </button>
      </div>

      {!showAddEquipment && !showInventory && !showGroups && !showEquipmentMaster && (
        <p>Use the buttons above to add new equipment, update item details, view your unit's inventory, or manage equipment groups.</p>
      )}

      {showAddEquipment && (
        <div className="equipment-modal-overlay">
          <div className="equipment-modal-content">
            <button className="modal-close-button" onClick={() => setShowAddEquipment(false)}>×</button>
            <AddEquipmentModal onClose={() => setShowAddEquipment(false)} />
          </div>
        </div>
      )}

      {showEquipmentMaster && (
        <div className="equipment-modal-overlay">
          <div className="equipment-modal-content">
            <button className="modal-close-button" onClick={() => setShowEquipmentMaster(false)}>×</button>
            <EquipmentMasterModal onClose={() => setShowEquipmentMaster(false)} />
          </div>
        </div>
      )}

      {showInventory && (
        <div className="equipment-modal-overlay">
          <div className="equipment-modal-content">
            <button className="modal-close-button" onClick={() => setShowInventory(false)}>×</button>
            <InventoryList onBack={() => setShowInventory(false)} />
          </div>
        </div>
      )}

      {showGroups && (
        <div className="equipment-modal-overlay">
          <div className="equipment-modal-content">
            <button className="modal-close-button" onClick={() => setShowGroups(false)}>×</button>
            <ManageGroupsModal onBack={() => setShowGroups(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Manage; 