import React, { useState, useEffect } from 'react';
import { FaBoxes, FaLayerGroup, FaListAlt, FaPlus } from 'react-icons/fa';
import './Pages.css';
import '../App.css';
import '../components/equipment/ModalStyles.css';
import AddEquipmentModal from '../components/equipment/AddEquipmentModal';
import InventoryList from '../components/equipment/InventoryList';
import ManageGroupsModal from '../components/equipment/ManageGroupsModal3';
import EquipmentMasterModal from '../components/equipment/EquipmentMasterModal';
import { PageHeader } from '../components/ui/PageHeader';

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

  const actions = [
    {
      title: 'Add New Equipment',
      description: 'Create inventory records for items assigned to this UIC.',
      icon: <FaPlus />,
      onClick: () => setShowAddEquipment(true)
    },
    {
      title: 'Manage Item Catalog',
      description: 'Maintain NSNs, nomenclature, tracking flags, and catalog metadata.',
      icon: <FaListAlt />,
      onClick: () => setShowEquipmentMaster(true)
    },
    {
      title: 'View Inventory',
      description: 'Review, edit, assign, and repair current unit inventory records.',
      icon: <FaBoxes />,
      onClick: () => setShowInventory(true)
    },
    {
      title: 'Manage Equipment Groups',
      description: 'Group related components and assign equipment packages together.',
      icon: <FaLayerGroup />,
      onClick: () => setShowGroups(true)
    }
  ];

  return (
    <div className="page-container page-container-wide">
      <PageHeader
        title="Manage Equipment"
        subtitle="Add equipment, keep catalog records clean, review inventory, and organize deployable groups."
      />

      <div className="action-grid">
        {actions.map(action => (
          <button
            key={action.title}
            className="action-card"
            onClick={action.onClick}
          >
            <span className="action-card-icon">{action.icon}</span>
            <span className="action-card-copy">
              <strong>{action.title}</strong>
              <span>{action.description}</span>
            </span>
          </button>
        ))}
      </div>

      {!showAddEquipment && !showInventory && !showGroups && !showEquipmentMaster && (
        <p className="page-intro">Choose a workflow above to continue.</p>
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
