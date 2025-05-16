import React, { useState, useEffect } from 'react';
import { DataStore, SortDirection } from '@aws-amplify/datastore';
import { getCurrentUser } from 'aws-amplify/auth';
import { User, Soldier, UIC, Role } from '../models';
import './Pages.css';
import '../styles/Assign.css';
import '../styles/RosterStyles.css'; // Import new roster styling
import { ROLES, getRoleLabel } from '../utils/roleUtils'; // Import roles utilities
import AssignmentModal from '../components/assignment/AssignmentModal';
import DataStoreUtil from '../utils/DataStoreSync'; // Import DataStore utility

function Assign() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUIC, setCurrentUIC] = useState(null);
  const [soldiers, setSoldiers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingSoldier, setEditingSoldier] = useState(null);
  const [deletingSoldier, setDeletingSoldier] = useState(null);
  const [newSoldier, setNewSoldier] = useState({
    firstName: '',
    lastName: '',
    rank: '',
    email: '',
    role: ROLES.SOLDIER // Use standardized role value
  });
  const [formErrors, setFormErrors] = useState({});
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assigningSoldier, setAssigningSoldier] = useState(null);

  // Fetch the current user and UIC data
  useEffect(() => {
    const fetchUserAndSoldiers = async () => {
      try {
        setLoading(true);
        
        // Get current authenticated user
        const { username } = await getCurrentUser();
        
        // Get user profile
        const userProfiles = await DataStore.query(User, u => u.owner.eq(username));
        if (userProfiles.length === 0) {
          setLoading(false);
          return;
        }
        
        const userProfile = userProfiles[0];
        setCurrentUser(userProfile);
        
        // Get UIC
        if (userProfile.uicID) {
          const uic = await DataStore.query(UIC, userProfile.uicID);
          setCurrentUIC(uic);
          
          // Fetch soldiers for this UIC
          await fetchSoldiers(userProfile.uicID);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    
    fetchUserAndSoldiers();
  }, []);
  
  // Separate function to fetch soldiers that can be called after adding new soldiers
  const fetchSoldiers = async (uicID) => {
    try {
      const soldiersList = await DataStore.query(
        Soldier, 
        s => s.uicID.eq(uicID),
        {
          sort: s => s.lastName(SortDirection.ASCENDING)
        }
      );
      setSoldiers(soldiersList);
    } catch (error) {
      console.error('Error fetching soldiers:', error);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSoldier(prev => ({ ...prev, [name]: value }));
    
    // Clear any error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!newSoldier.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!newSoldier.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleAddSoldier = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      // Create new soldier record
      await DataStore.save(
        new Soldier({
          firstName: newSoldier.firstName,
          lastName: newSoldier.lastName,
          rank: newSoldier.rank,
          email: newSoldier.email,
          uicID: currentUIC.id,
          role: newSoldier.role,
          userId: null,
          hasAccount: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      );
      
      // Reset form
      setNewSoldier({
        firstName: '',
        lastName: '',
        rank: '',
        email: '',
        role: ROLES.SOLDIER // Use standardized role value
      });
      
      // Hide form
      setShowAddForm(false);
      
      // Refresh soldiers list
      await fetchSoldiers(currentUIC.id);
      
    } catch (error) {
      console.error('Error adding soldier:', error);
      alert('Failed to add soldier. Please try again.');
    }
  };
  
  // Add this function to handle editing a soldier
  const handleEditClick = (soldier) => {
    setEditingSoldier(soldier);
    setNewSoldier({
      firstName: soldier.firstName,
      lastName: soldier.lastName,
      rank: soldier.rank || '',
      email: soldier.email || '',
      role: soldier.role
    });
    setShowEditForm(true);
    setShowAddForm(false); // Close add form if it's open
    setFormErrors({});
  };

  // Close edit form
  const handleCancelEdit = () => {
    setShowEditForm(false);
    setEditingSoldier(null);
    setNewSoldier({
      firstName: '',
      lastName: '',
      rank: '',
      email: '',
      role: ROLES.SOLDIER
    });
  };

  // Save edited soldier data
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      if (!editingSoldier) {
        throw new Error('No soldier selected for editing');
      }
      
      // Update soldier record
      await DataStore.save(
        Soldier.copyOf(editingSoldier, updated => {
          updated.firstName = newSoldier.firstName;
          updated.lastName = newSoldier.lastName;
          updated.rank = newSoldier.rank;
          updated.email = newSoldier.email;
          updated.role = newSoldier.role;
          updated.updatedAt = new Date().toISOString();
        })
      );
      
      // NEW CODE: Sync changes to linked user profile if soldier has an account
      if (editingSoldier.hasAccount && editingSoldier.userId) {
        // Find the associated user record
        const linkedUser = await DataStore.query(User, editingSoldier.userId);
        
        if (linkedUser) {
          console.log('Found linked user account to update:', linkedUser);
          
          // Update the user record with the soldier's updated information
          await DataStore.save(
            User.copyOf(linkedUser, updated => {
              updated.firstName = newSoldier.firstName;
              updated.lastName = newSoldier.lastName;
              updated.rank = newSoldier.rank;
              // Only update role if the user's role is different
              // and the user isn't waiting on approval for another UIC
              if (updated.role !== newSoldier.role && updated.role !== 'PENDING') {
                updated.role = newSoldier.role;
              }
            })
          );
          
          console.log('Updated linked user profile with new soldier information');
        }
      }
      
      // Reset form
      setNewSoldier({
        firstName: '',
        lastName: '',
        rank: '',
        email: '',
        role: ROLES.SOLDIER
      });
      
      // Hide form
      setShowEditForm(false);
      setEditingSoldier(null);
      
      // Refresh soldiers list
      await fetchSoldiers(currentUIC.id);
      
    } catch (error) {
      console.error('Error updating soldier:', error);
      alert('Failed to update soldier. Please try again.');
    }
  };
  
  // Add these functions for delete functionality
  const handleDeleteClick = (soldier) => {
    setDeletingSoldier(soldier);
    setShowDeleteModal(true);
    // Close other forms if open
    setShowAddForm(false);
    setShowEditForm(false);
    setEditingSoldier(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingSoldier(null);
  };

  const handleConfirmDelete = async () => {
    try {
      if (!deletingSoldier) {
        throw new Error('No soldier selected for deletion');
      }
      
      // Check if this soldier has a linked user account
      if (deletingSoldier.hasAccount && deletingSoldier.userId) {
        // Find the associated user record
        const linkedUser = await DataStore.query(User, deletingSoldier.userId);
        
        if (linkedUser) {
          console.log('Found linked user account:', linkedUser);
          
          // Update the user record to remove the UIC and linkedSoldierId
          await DataStore.save(
            User.copyOf(linkedUser, updated => {
              // Clear UIC association (if it matches the current UIC)
              if (updated.uicID === currentUIC.id) {
                updated.uicID = null;
              }
              
              // Clear the linkedSoldierId reference
              updated.linkedSoldierId = null;
            })
          );
          
          console.log('Updated linked user to remove UIC association');
        }
      }
      
      // Delete the soldier record
      await DataStore.delete(deletingSoldier);
      
      // Hide modal
      setShowDeleteModal(false);
      setDeletingSoldier(null);
      
      // Refresh soldiers list
      await fetchSoldiers(currentUIC.id);
      
      // Show success message
      alert('Soldier was successfully deleted from the roster.');
      
    } catch (error) {
      console.error('Error deleting soldier:', error);
      alert('Failed to delete soldier. Please try again.');
    }
  };
  
  // Function to handle clicking the assign equipment button
  const handleAssignEquipment = (soldier) => {
    setAssigningSoldier(soldier);
    setShowAssignmentModal(true);
  };
  
  // Function to handle assignment completion
  const handleAssignmentComplete = async () => {
    // Refresh the soldiers list to show updated assignments
    try {
      // First try to sync the DataStore if in online mode
      const isOnlineMode = DataStoreUtil.isOnlineMode();
      
      if (isOnlineMode) {
        // If in online mode, we should force refresh assigned data
        console.log('Assignment completed, synchronizing DataStore...');
        
        // If we know which soldier was assigned to, specifically sync that one
        if (assigningSoldier) {
          await DataStoreUtil.syncEntity(Soldier, assigningSoldier.id);
        }
      }
      
      // Then fetch fresh data
      await fetchSoldiers(currentUIC.id);
      
    } catch (error) {
      console.error('Error refreshing soldiers after assignment:', error);
    }
  };
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!currentUser) {
    return (
      <div className="page-container">
        <h1>Assign Personnel</h1>
        <p>Please complete your profile before accessing this page.</p>
      </div>
    );
  }
  
  if (!currentUIC) {
    return (
      <div className="page-container">
        <h1>Assign Personnel</h1>
        <p>You need to join a UIC before you can manage personnel.</p>
      </div>
    );
  }
  
  // Check if user has appropriate role to manage personnel
  const canManagePersonnel = ['COMMANDER', 'FIRST_SERGEANT', 'SUPPLY_SERGEANT'].includes(currentUser.role);
  
  if (!canManagePersonnel) {
    return (
      <div className="page-container">
        <h1>Assign Personnel</h1>
        <p>You do not have permission to manage personnel in this UIC.</p>
      </div>
    );
  }
  
  return (
    <div className="page-container">
      <h1>UIC {currentUIC.uicCode} - Personnel Roster</h1>
      
      <div className="roster-actions">
        <button className="add-soldier-btn" onClick={() => {
          setShowAddForm(!showAddForm);
          if (showEditForm) {
            setShowEditForm(false);
            setEditingSoldier(null);
          }
          if (showDeleteModal) {
            setShowDeleteModal(false);
            setDeletingSoldier(null);
          }
          // Reset the form data when toggling
          if (!showAddForm) {
            setNewSoldier({
              firstName: '',
              lastName: '',
              rank: '',
              email: '',
              role: ROLES.SOLDIER
            });
            setFormErrors({});
          }
        }}>
          {showAddForm ? 'Cancel' : 'Add Soldier'}
        </button>
      </div>
      
      {showAddForm && (
        <div className="add-soldier-form">
          <h2>Add New Soldier</h2>
          <form onSubmit={handleAddSoldier}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={newSoldier.firstName}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.firstName && <div className="error">{formErrors.firstName}</div>}
              </div>
              
              <div className="form-group">
                <label htmlFor="lastName">Last Name *</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={newSoldier.lastName}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.lastName && <div className="error">{formErrors.lastName}</div>}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="rank">Rank</label>
                <input
                  type="text"
                  id="rank"
                  name="rank"
                  value={newSoldier.rank}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={newSoldier.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value={newSoldier.role}
                  onChange={handleInputChange}
                >
                  <option value={ROLES.SOLDIER}>{getRoleLabel(ROLES.SOLDIER)}</option>
                  <option value={ROLES.SUPPLY_SERGEANT}>{getRoleLabel(ROLES.SUPPLY_SERGEANT)}</option>
                  <option value={ROLES.FIRST_SERGEANT}>{getRoleLabel(ROLES.FIRST_SERGEANT)}</option>
                  <option value={ROLES.COMMANDER}>{getRoleLabel(ROLES.COMMANDER)}</option>
                </select>
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="submit-btn">Add Soldier</button>
              <button type="button" className="cancel-btn" onClick={() => setShowAddForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      
      {showEditForm && editingSoldier && (
        <div className="edit-soldier-form">
          <h2>Edit Soldier</h2>
          <form onSubmit={handleSaveEdit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={newSoldier.firstName}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.firstName && <div className="error">{formErrors.firstName}</div>}
              </div>
              
              <div className="form-group">
                <label htmlFor="lastName">Last Name *</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={newSoldier.lastName}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.lastName && <div className="error">{formErrors.lastName}</div>}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="rank">Rank</label>
                <input
                  type="text"
                  id="rank"
                  name="rank"
                  value={newSoldier.rank}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={newSoldier.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value={newSoldier.role}
                  onChange={handleInputChange}
                >
                  <option value={ROLES.SOLDIER}>{getRoleLabel(ROLES.SOLDIER)}</option>
                  <option value={ROLES.SUPPLY_SERGEANT}>{getRoleLabel(ROLES.SUPPLY_SERGEANT)}</option>
                  <option value={ROLES.FIRST_SERGEANT}>{getRoleLabel(ROLES.FIRST_SERGEANT)}</option>
                  <option value={ROLES.COMMANDER}>{getRoleLabel(ROLES.COMMANDER)}</option>
                </select>
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="submit-btn">Save Changes</button>
              <button type="button" className="cancel-btn" onClick={handleCancelEdit}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      
      {/* Delete Soldier Modal - new code */}
      {showDeleteModal && deletingSoldier && (
        <div className="delete-soldier-modal">
          <div className="modal-content">
            <h2>Delete Soldier</h2>
            <p className="warning-text">
              Are you sure you want to delete this soldier from the roster?
            </p>
            
            <div className="soldier-details">
              <p><strong>Name:</strong> {deletingSoldier.rank} {deletingSoldier.firstName} {deletingSoldier.lastName}</p>
              <p><strong>Role:</strong> {getRoleLabel(deletingSoldier.role)}</p>
              <p><strong>Status:</strong> {deletingSoldier.hasAccount ? 'Has account' : 'No account'}</p>
            </div>
            
            <div className="warning-box">
              <p>This action cannot be undone. The soldier will be permanently removed from the roster.</p>
              {deletingSoldier?.hasAccount && (
                <p>Note: This soldier has a user account. Deleting them from the roster will remove their UIC association, but their account will remain active.</p>
              )}
            </div>
            
            <div className="modal-actions">
              <button type="button" className="cancel-btn" onClick={handleCancelDelete}>Cancel</button>
              <button type="button" className="delete-btn" onClick={handleConfirmDelete}>Delete Soldier</button>
            </div>
          </div>
        </div>
      )}
      
      <div className="soldier-roster">
        <h2>Personnel Roster</h2>
        {soldiers.length === 0 ? (
          <p>No soldiers in this UIC yet. Add your first soldier using the button above.</p>
        ) : (
          <table className="roster-table">
            <thead>
              <tr>
                <th>Last Name</th>
                <th>First Name</th>
                <th>Rank</th>
                <th>Role</th>
                <th>Account Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {soldiers.map(soldier => (
                <tr key={soldier.id}>
                  <td>{soldier.lastName}</td>
                  <td>{soldier.firstName}</td>
                  <td>{soldier.rank || '-'}</td>
                  <td>{getRoleLabel(soldier.role)}</td>
                  <td>{soldier.hasAccount ? 'Active' : 'Not Registered'}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="edit-btn" 
                        onClick={() => handleEditClick(soldier)}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-btn" 
                        onClick={() => handleDeleteClick(soldier)}
                      >
                        Delete
                      </button>
                      <button 
                        className="assign-btn"
                        onClick={() => handleAssignEquipment(soldier)}
                      >
                        Assign Equipment
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Add Assignment Modal */}
      {showAssignmentModal && (
        <AssignmentModal
          onClose={() => {
            setShowAssignmentModal(false);
            setAssigningSoldier(null);
          }}
          uicID={currentUIC.id}
          preselectedSoldier={assigningSoldier}
          onAssignmentComplete={handleAssignmentComplete}
        />
      )}
    </div>
  );
}

export default Assign; 