import React, { useState, useEffect, useRef } from 'react';
import { generateClient } from 'aws-amplify/api';
import { uploadData, getUrl, remove } from 'aws-amplify/storage';
import { createEquipmentMaster, updateEquipmentMaster, deleteEquipmentMaster } from '../../graphql/mutations';
import './Equipment.css';

function EquipmentMasterModal({ onClose }) {
  const [loading, setLoading] = useState(true);
  const [equipmentMasters, setEquipmentMasters] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('nsn');
  const [sortDirection, setSortDirection] = useState('asc');
  const [editItem, setEditItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [oldImageKey, setOldImageKey] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  
  const fileInputRef = useRef(null);
  const client = generateClient();

  useEffect(() => {
    fetchEquipmentMasters();
  }, []);

  /**
   * Fetch all equipment master items from the API
   */
  const fetchEquipmentMasters = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const response = await client.graphql({
        query: `query ListEquipmentMasters {
          listEquipmentMasters(limit: 1000) {
            items {
              id
              nsn
              commonName
              description
              tmNumber
              isSerialTracked
              isSensitiveItem
              isConsumable
              isCyclicInventory
              isSensitiveInventory
              storageRestrictions
              maintenanceSchedule
              imageKey
              subComponents
              _version
              _deleted
            }
          }
        }`
      });
      
      // Filter out deleted items
      const items = response.data.listEquipmentMasters.items.filter(item => !item._deleted);
      
      // Add signed URLs for image keys
      const itemsWithUrls = await Promise.all(items.map(async (item) => {
        if (item.imageKey) {
          try {
            const imageUrlResult = await getUrl({
              key: item.imageKey,
              options: {
                expiresIn: 3600 // 1 hour
              }
            });
            return { ...item, imageUrl: imageUrlResult.url.toString() };
          } catch (error) {
            console.error('Error getting image URL:', error);
            return item;
          }
        }
        return item;
      }));
      
      setEquipmentMasters(itemsWithUrls);
    } catch (error) {
      console.error('Error fetching equipment masters:', error);
      setError('Failed to load equipment catalog. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle sorting the equipment masters
   */
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  /**
   * Filter and sort the equipment masters
   */
  const sortedMasters = () => {
    const filtered = equipmentMasters.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.nsn?.toLowerCase().includes(searchLower) ||
        item.commonName?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
      );
    });
    
    return filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      // Handle boolean values
      if (typeof aValue === 'boolean') {
        aValue = aValue ? 1 : 0;
        bValue = bValue ? 1 : 0;
      } else {
        // Handle null/undefined values for strings
        aValue = aValue || '';
        bValue = bValue || '';
      }
      
      // Sort based on direction
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  /**
   * Handle editing an equipment master item
   */
  const handleEditItem = (item) => {
    setEditItem({ ...item });
    setOldImageKey(item.imageKey);
    setUploadedImage(null);
    setValidationErrors({});
  };

  /**
   * Handle file selection for image upload
   */
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedImage(file);
    }
  };

  /**
   * Trigger file input click
   */
  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  /**
   * Remove selected image
   */
  const handleRemoveImage = () => {
    setUploadedImage(null);
    if (editItem && editItem.imageUrl) {
      setEditItem({ ...editItem, imageUrl: null, imageKey: null });
    }
  };

  /**
   * Upload image to S3
   */
  const uploadImage = async (file) => {
    try {
      const fileName = `equipment-master/${Date.now()}-${file.name}`;
      
      await uploadData({
        key: fileName,
        data: file,
        options: {
          contentType: file.type
        }
      });
      
      return fileName;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  /**
   * Delete image from S3
   */
  const deleteImage = async (imageKey) => {
    try {
      await remove({ key: imageKey });
      console.log('Image deleted successfully');
    } catch (error) {
      console.error('Error deleting image:', error);
      // Continue even if image deletion fails
    }
  };

  /**
   * Validate form input
   */
  const validateForm = () => {
    const errors = {};
    
    if (!editItem.nsn || editItem.nsn.trim() === '') {
      errors.nsn = 'NSN is required';
    }
    
    if (!editItem.commonName || editItem.commonName.trim() === '') {
      errors.commonName = 'Name is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle saving an equipment master item
   */
  const handleSaveEdit = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Handle image upload if there's a new image
      let imageKey = editItem.imageKey;
      
      if (uploadedImage) {
        // Upload the new image
        imageKey = await uploadImage(uploadedImage);
        
        // Delete the old image if it exists
        if (oldImageKey) {
          await deleteImage(oldImageKey);
        }
      } else if (editItem.imageKey === null && oldImageKey) {
        // If imageKey was set to null but there was an old image, delete it
        await deleteImage(oldImageKey);
      }
      
      // Prepare input for update
      const updateInput = {
        id: editItem.id,
        nsn: editItem.nsn,
        commonName: editItem.commonName,
        description: editItem.description || null,
        tmNumber: editItem.tmNumber || null,
        isSerialTracked: editItem.isSerialTracked,
        isSensitiveItem: editItem.isSensitiveItem,
        isConsumable: editItem.isConsumable,
        isCyclicInventory: editItem.isCyclicInventory || false,
        isSensitiveInventory: editItem.isSensitiveInventory || false,
        storageRestrictions: editItem.storageRestrictions || null,
        maintenanceSchedule: editItem.maintenanceSchedule || null,
        imageKey: imageKey,
        subComponents: editItem.subComponents || [],
        _version: editItem._version
      };
      
      // Update the equipment master
      await client.graphql({
        query: updateEquipmentMaster,
        variables: {
          input: updateInput
        }
      });
      
      setSuccess(`Equipment "${editItem.commonName}" updated successfully.`);
      setEditItem(null);
      
      // Refresh data
      await fetchEquipmentMasters();
    } catch (error) {
      console.error('Error updating equipment master:', error);
      setError(`Failed to update equipment master: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles creating a new equipment master item
   */
  const handleAddItem = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Handle image upload if there's an image
      let imageKey = null;
      if (uploadedImage) {
        imageKey = await uploadImage(uploadedImage);
      }
      
      // Prepare input for create
      const createInput = {
        nsn: editItem.nsn,
        commonName: editItem.commonName,
        description: editItem.description || null,
        tmNumber: editItem.tmNumber || null,
        isSerialTracked: editItem.isSerialTracked || false,
        isSensitiveItem: editItem.isSensitiveItem || false,
        isConsumable: editItem.isConsumable || false,
        isCyclicInventory: editItem.isCyclicInventory || false,
        isSensitiveInventory: editItem.isSensitiveInventory || false,
        storageRestrictions: editItem.storageRestrictions || null,
        maintenanceSchedule: editItem.maintenanceSchedule || null,
        imageKey: imageKey,
        subComponents: editItem.subComponents || []
      };
      
      // Create the equipment master
      await client.graphql({
        query: createEquipmentMaster,
        variables: {
          input: createInput
        }
      });
      
      setSuccess(`Equipment "${editItem.commonName}" created successfully.`);
      setEditItem(null);
      setShowAddForm(false);
      
      // Refresh data
      await fetchEquipmentMasters();
    } catch (error) {
      console.error('Error creating equipment master:', error);
      setError(`Failed to create equipment master: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles deleting an equipment master item
   */
  const handleDeleteItem = async (item) => {
    try {
      setLoading(true);
      setError('');
      
      // If the item has an image, delete it from S3
      if (item.imageKey) {
        await deleteImage(item.imageKey);
      }
      
      // Delete the equipment master
      await client.graphql({
        query: deleteEquipmentMaster,
        variables: {
          input: {
            id: item.id,
            _version: item._version
          }
        }
      });
      
      setSuccess(`Equipment "${item.commonName}" deleted successfully.`);
      setConfirmDelete(null);
      
      // Refresh data
      await fetchEquipmentMasters();
    } catch (error) {
      console.error('Error deleting equipment master:', error);
      setError(`Failed to delete equipment master: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditItem({
      ...editItem,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Function to start adding a new item
  const handleShowAddForm = () => {
    setEditItem({
      nsn: '',
      commonName: '',
      description: '',
      tmNumber: '',
      isSerialTracked: false,
      isSensitiveItem: false,
      isConsumable: false,
      isCyclicInventory: false,
      isSensitiveInventory: false,
      storageRestrictions: '',
      maintenanceSchedule: '',
      subComponents: []
    });
    setShowAddForm(true);
    setValidationErrors({});
    setUploadedImage(null);
  };

  return (
    <div className="equipment-master-modal">
      <div className="modal-header">
        <h2>{!editItem ? 'Equipment Catalog' : (showAddForm ? 'Add New Equipment' : 'Edit Equipment')}</h2>
        <button className="close-button" onClick={onClose}>&times;</button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      {confirmDelete && (
        <div className="delete-confirmation-modal">
          <div className="delete-confirmation-content">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete <strong>{confirmDelete.commonName}</strong>?</p>
            <p className="warning">This action cannot be undone. All associated equipment items will be orphaned.</p>
            <div className="confirmation-actions">
              <button 
                className="secondary-button"
                onClick={() => setConfirmDelete(null)}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="danger-button"
                onClick={() => handleDeleteItem(confirmDelete)}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {!editItem ? (
        // List View
        <>
          <div className="master-controls">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search by NSN, name, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <button 
              className="primary-button"
              onClick={handleShowAddForm}
            >
              Add New Equipment
            </button>
          </div>
          
          {loading ? (
            <div className="loading">Loading equipment catalog...</div>
          ) : sortedMasters().length === 0 ? (
            <div className="no-data">
              No equipment types found. 
              {searchTerm ? ' Try a different search term or ' : ' '}
              create a new type using the button above.
            </div>
          ) : (
            <div className="table-container">
              <table className="equipment-master-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('nsn')}>
                      NSN {sortBy === 'nsn' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => handleSort('commonName')}>
                      Name {sortBy === 'commonName' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th>Image</th>
                    <th onClick={() => handleSort('isSerialTracked')}>
                      Serial Tracked {sortBy === 'isSerialTracked' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => handleSort('isSensitiveItem')}>
                      Sensitive {sortBy === 'isSensitiveItem' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMasters().map(item => (
                    <tr key={item.id}>
                      <td>{item.nsn}</td>
                      <td>{item.commonName}</td>
                      <td className="thumbnail-cell">
                        {item.imageUrl && (
                          <img 
                            src={item.imageUrl} 
                            alt={item.commonName} 
                            className="item-thumbnail" 
                          />
                        )}
                      </td>
                      <td>{item.isSerialTracked ? 'Yes' : 'No'}</td>
                      <td>{item.isSensitiveItem ? 'Yes' : 'No'}</td>
                      <td>
                        <button
                          className="action-button"
                          onClick={() => handleEditItem(item)}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => setConfirmDelete(item)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        // Edit/Add View
        <div className="equipment-master-edit">
          <h3>{showAddForm ? 'Add New Equipment' : 'Edit Equipment Details'}</h3>
          
          <div className="edit-form-container">
            <div className="edit-form-main">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nsn">NSN*</label>
                  <input
                    type="text"
                    id="nsn"
                    name="nsn"
                    value={editItem.nsn || ''}
                    onChange={handleInputChange}
                    className={validationErrors.nsn ? 'invalid' : ''}
                    readOnly={!showAddForm} // NSN can only be set during creation
                  />
                  {validationErrors.nsn && <div className="error">{validationErrors.nsn}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="commonName">Common Name*</label>
                  <input
                    type="text"
                    id="commonName"
                    name="commonName"
                    value={editItem.commonName || ''}
                    onChange={handleInputChange}
                    className={validationErrors.commonName ? 'invalid' : ''}
                  />
                  {validationErrors.commonName && <div className="error">{validationErrors.commonName}</div>}
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={editItem.description || ''}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="tmNumber">TM Number</label>
                  <input
                    type="text"
                    id="tmNumber"
                    name="tmNumber"
                    value={editItem.tmNumber || ''}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="maintenanceSchedule">Maintenance Schedule</label>
                  <input
                    type="text"
                    id="maintenanceSchedule"
                    name="maintenanceSchedule"
                    value={editItem.maintenanceSchedule || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="storageRestrictions">Storage Restrictions</label>
                <textarea
                  id="storageRestrictions"
                  name="storageRestrictions"
                  value={editItem.storageRestrictions || ''}
                  onChange={handleInputChange}
                  rows="2"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group checkbox">
                  <input
                    type="checkbox"
                    id="isSerialTracked"
                    name="isSerialTracked"
                    checked={editItem.isSerialTracked || false}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="isSerialTracked">Serial Number Tracked</label>
                </div>
                
                <div className="form-group checkbox">
                  <input
                    type="checkbox"
                    id="isSensitiveItem"
                    name="isSensitiveItem"
                    checked={editItem.isSensitiveItem || false}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="isSensitiveItem">Sensitive Item</label>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group checkbox">
                  <input
                    type="checkbox"
                    id="isConsumable"
                    name="isConsumable"
                    checked={editItem.isConsumable || false}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="isConsumable">Consumable Item</label>
                </div>
                
                <div className="form-group checkbox">
                  <input
                    type="checkbox"
                    id="isCyclicInventory"
                    name="isCyclicInventory"
                    checked={editItem.isCyclicInventory || false}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="isCyclicInventory">Cyclic Inventory Required</label>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group checkbox">
                  <input
                    type="checkbox"
                    id="isSensitiveInventory"
                    name="isSensitiveInventory"
                    checked={editItem.isSensitiveInventory || false}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="isSensitiveInventory">Sensitive Inventory Required</label>
                </div>
              </div>
            </div>
            
            <div className="edit-form-image">
              <label>Equipment Image</label>
              <div 
                className={`image-upload-area ${(uploadedImage || editItem.imageUrl) ? 'has-image' : ''}`}
                onClick={handleImageClick}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  style={{ display: 'none' }}
                  accept="image/*"
                />
                
                {uploadedImage ? (
                  <div className="image-preview-container">
                    <img 
                      src={URL.createObjectURL(uploadedImage)} 
                      alt="Preview" 
                      className="image-preview" 
                    />
                    <button 
                      type="button" 
                      className="remove-image-button"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleRemoveImage();
                      }}
                    >
                      &times;
                    </button>
                  </div>
                ) : editItem.imageUrl ? (
                  <div className="image-preview-container">
                    <img 
                      src={editItem.imageUrl} 
                      alt={editItem.commonName} 
                      className="image-preview" 
                    />
                    <button 
                      type="button" 
                      className="remove-image-button"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleRemoveImage();
                      }}
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <div className="upload-icon">+</div>
                    <div>Click to upload image</div>
                    <div className="upload-note">Recommended: 500x500px, PNG or JPG</div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="modal-actions">
            <button 
              className="secondary-button"
              onClick={() => {
                setEditItem(null);
                setShowAddForm(false);
              }}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              className="primary-button"
              onClick={showAddForm ? handleAddItem : handleSaveEdit}
              disabled={loading}
            >
              {loading ? 'Saving...' : (showAddForm ? 'Add Equipment' : 'Save Changes')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EquipmentMasterModal;