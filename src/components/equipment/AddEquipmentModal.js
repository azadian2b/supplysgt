import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { createEquipmentMaster, createEquipmentItem, updateUIC, updateUser } from '../../graphql/mutations';
import { listUICS } from '../../graphql/queries';
import { useNavigate } from 'react-router-dom';
import './Equipment.css';

function AddEquipmentModal({ onClose }) {
  const [bulkData, setBulkData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showUICError, setShowUICError] = useState(false);
  const [availableUICs, setAvailableUICs] = useState([]);
  const [selectedUIC, setSelectedUIC] = useState('');
  const [loadingUICs, setLoadingUICs] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const client = generateClient();
  const navigate = useNavigate();

  // Load available UICs with valid uicCodes
  useEffect(() => {
    if (showUICError) {
      fetchAvailableUICs();
    }
  }, [showUICError]);

  const fetchAvailableUICs = async () => {
    try {
      setLoadingUICs(true);
      const result = await client.graphql({
        query: listUICS
      });
      
      // Filter to only include UICs with valid uicCodes
      const uics = result.data.listUICS.items.filter(uic => uic.uicCode && !uic._deleted);
      console.log('Available UICs:', uics);
      
      setAvailableUICs(uics);
      
      // If there are valid UICs, pre-select the first one
      if (uics.length > 0) {
        setSelectedUIC(uics[0].id);
      }
    } catch (error) {
      console.error('Error fetching UICs:', error);
    } finally {
      setLoadingUICs(false);
    }
  };

  const handleUICSelect = (e) => {
    setSelectedUIC(e.target.value);
  };
  
  const handleAssignUIC = async () => {
    if (!selectedUIC || !currentUser) return;
    
    try {
      setLoading(true);
      
      // Update the user's UIC
      await client.graphql({
        query: updateUser,
        variables: {
          input: {
            id: currentUser.id,
            uicID: selectedUIC,
            _version: currentUser._version
          }
        }
      });
      
      // Success! Close the error UI and try again
      setShowUICError(false);
      setError('');
      setSuccess('UIC assigned successfully. You can now add equipment.');
      
      // Optionally reload the page or reset the component state
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error assigning UIC:', error);
      setError('Failed to assign UIC. Please try the profile page instead.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDataChange = (e) => {
    setBulkData(e.target.value);
  };

  const handleNavigateToProfile = () => {
    navigate('/profile');
  };

  const parseCSVData = (data) => {
    // Split by newlines and filter out empty rows
    const rows = data.split('\n').filter(row => row.trim() !== '');
    
    // Map each row into an object
    return rows.map(row => {
      const [lin, nsn, serialNumber, stockNumber, location] = row.split('\t');
      return {
        lin: lin?.trim() || '',
        nsn: nsn?.trim() || '',
        serialNumber: serialNumber?.trim() || '',
        stockNumber: stockNumber?.trim() || '',
        location: location?.trim() || ''
      };
    });
  };

  const validateEquipmentData = (data) => {
    // Check for required fields
    const errors = [];
    data.forEach((item, index) => {
      if (!item.lin) {
        errors.push(`Row ${index + 1}: LIN is required`);
      }
      if (!item.nsn) {
        errors.push(`Row ${index + 1}: NSN is required`);
      }
    });
    return errors;
  };

  const handleAddEquipment = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Parse the CSV data
      const equipmentItems = parseCSVData(bulkData);
      
      // Validate data
      const validationErrors = validateEquipmentData(equipmentItems);
      if (validationErrors.length > 0) {
        setError(validationErrors.join('. '));
        setLoading(false);
        return;
      }

      // Get current user and their UIC
      const { username } = await getCurrentUser();
      console.log('Current authenticated username:', username);
      
      try {
        // First try to get the user directly by their username/owner field
        const userAttributes = await client.graphql({
          query: `query GetUserByUsername($owner: String!) {
            usersByOwner(
              owner: $owner,
              filter: { _deleted: { ne: true } }
            ) {
              items {
                id
                uicID
                firstName
                lastName
                role
                _version
                _deleted
                createdAt
              }
            }
          }`,
          variables: { owner: username }
        });
        
        console.log('Raw usersByOwner response:', JSON.stringify(userAttributes.data.usersByOwner, null, 2));
        
        // Filter out null items and ensure valid user records
        let validUserRecords = userAttributes.data.usersByOwner.items.filter(item => 
          item !== null && item.firstName && item.lastName && !item._deleted
        );
        
        // Sort by createdAt to get the most recent one
        validUserRecords = validUserRecords.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        console.log('Valid user records for this username:', validUserRecords);
        
        if (validUserRecords.length === 0) {
          // Fallback - try searching for the user by listing all users (if permissions allow)
          try {
            console.log("No valid user found with owner query, trying a more general approach...");
            const allUsersResult = await client.graphql({
              query: `query ListUsers {
                listUsers(filter: { owner: { eq: "${username}" }, _deleted: { ne: true } }) {
                  items {
                    id
                    owner
                    firstName
                    lastName
                    role
                    uicID
                    _version
                    _deleted
                    createdAt
                  }
                }
              }`
            });
            
            console.log("All matching users:", JSON.stringify(allUsersResult.data.listUsers.items, null, 2));
            
            validUserRecords = allUsersResult.data.listUsers.items.filter(item => 
              item !== null && item.firstName && item.lastName && !item._deleted
            );
            
            if (validUserRecords.length === 0) {
              setError('No valid user profile found. Please complete your profile setup first.');
              setLoading(false);
              return;
            }
          } catch (fallbackError) {
            console.error("Fallback query failed:", fallbackError);
            setError('Unable to find your user profile. Please complete your profile setup first.');
            setLoading(false);
            return;
          }
        }
        
        // Get the most recently created user record
        const userData = validUserRecords[0];
        console.log('Using user data:', userData);
        
        // Store the user data for UIC assignment if needed
        setCurrentUser(userData);
        
        if (!userData || !userData.uicID) {
          setError('You must be assigned to a UIC to add equipment.');
          setLoading(false);
          return;
        }
        
        // Fetch UIC directly to ensure we have complete and correct data
        let uicData = null;
        try {
          const uicResult = await client.graphql({
            query: `query GetUIC($id: ID!) {
              getUIC(id: $id) {
                id
                uicCode
                name
                _version
                _deleted
              }
            }`,
            variables: { id: userData.uicID }
          });
          
          uicData = uicResult.data.getUIC;
          console.log('UIC data:', JSON.stringify(uicData, null, 2));
          
          // Check if UIC is deleted
          if (uicData && uicData._deleted) {
            console.warn('UIC record is marked as deleted');
            setShowUICError(true);
            setLoading(false);
            return;
          }
        } catch (uicFetchError) {
          console.error('Error fetching UIC data:', uicFetchError);
          
          // Show UIC error UI instead of just a message
          setShowUICError(true);
          setLoading(false);
          return;
        }
        
        // If UIC data has no uicCode, provide guidance
        if (!uicData || !uicData.uicCode) {
          console.warn('UIC missing uicCode:', uicData);
          
          // Show UIC error UI instead of just a message
          setShowUICError(true);
          setLoading(false);
          return;
        }
        
        // Process each equipment item
        const results = [];
        for (const item of equipmentItems) {
          // Check if equipment master exists by NSN
          let equipmentMasterId;
          try {
            const equipmentMasterResult = await client.graphql({
              query: `query GetEquipmentMasterByNSN($nsn: String!) {
                equipmentMasterByNSN(nsn: $nsn) {
                  items {
                    id
                    nsn
                    commonName
                  }
                }
              }`,
              variables: { nsn: item.nsn }
            });
            
            const equipmentMasters = equipmentMasterResult.data.equipmentMasterByNSN.items;
            if (equipmentMasters && equipmentMasters.length > 0) {
              equipmentMasterId = equipmentMasters[0].id;
            }
          } catch (error) {
            console.log('Error looking up equipment master:', error);
          }

          // If equipment master doesn't exist, create it
          if (!equipmentMasterId) {
            const equipmentMasterRecord = await client.graphql({
              query: createEquipmentMaster,
              variables: {
                input: {
                  nsn: item.nsn,
                  commonName: `Item ${item.nsn}`, // Default name until updated
                  isSerialTracked: item.serialNumber ? true : false,
                  isSensitiveItem: false,
                  isConsumable: false,
                  isCyclicInventory: false,
                  isSensitiveInventory: false
                }
              }
            });
            equipmentMasterId = equipmentMasterRecord.data.createEquipmentMaster.id;
          }

          // Create the specific equipment item
          try {
            // We already verified the UIC has a valid uicCode in the user selection logic
            // So we can directly create the equipment item
            const equipmentItemResult = await client.graphql({
              query: createEquipmentItem,
              variables: {
                input: {
                  uicID: userData.uicID,
                  equipmentMasterID: equipmentMasterId,
                  nsn: item.nsn,
                  lin: item.lin,
                  serialNumber: item.serialNumber || null,
                  stockNumber: item.stockNumber || null,
                  location: item.location || null,
                  isPartOfGroup: false,
                  assignedToID: null,
                  maintenanceStatus: "OPERATIONAL"
                }
              }
            });
            
            results.push(equipmentItemResult.data.createEquipmentItem);
          } catch (error) {
            console.error('Error creating equipment item:', error);
            throw new Error(`Failed to create equipment item: ${error.message}`);
          }
        }

        setSuccess(`Successfully added ${results.length} equipment items`);
        setBulkData('');
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError(error.message || 'An error occurred while fetching user data');
      }
    } catch (error) {
      console.error('Error adding equipment:', error);
      // Provide a more specific error message for UIC issues
      if (error.message && error.message.includes('non-nullable type') && error.message.includes('uicCode')) {
        setError('Your UIC record is missing required data. Please contact an administrator to update your unit information. Specifically, the uicCode field is missing.');
      } else {
        setError(error.message || 'An error occurred while adding equipment');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {showUICError ? (
          <div className="uic-error-container">
            <h2>UIC Configuration Error</h2>
            <p>
              Your UIC (Unit Identification Code) record is missing required data that prevents
              you from adding equipment to your inventory.
            </p>
            
            {availableUICs.length > 0 ? (
              <div className="uic-selection">
                <h3>Option 1: Select an existing UIC</h3>
                <p>The following UICs have valid data. You can assign one to your profile:</p>
                
                <div className="form-group">
                  <select 
                    value={selectedUIC} 
                    onChange={handleUICSelect}
                    disabled={loading || loadingUICs}
                    className="uic-select"
                  >
                    {availableUICs.map(uic => (
                      <option key={uic.id} value={uic.id}>
                        {uic.uicCode} - {uic.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button 
                  className="primary-button" 
                  onClick={handleAssignUIC}
                  disabled={loading || !selectedUIC}
                >
                  {loading ? 'Assigning...' : 'Assign Selected UIC to My Profile'}
                </button>
                
                <div className="option-separator">
                  <span>OR</span>
                </div>
              </div>
            ) : loadingUICs ? (
              <div className="loading">Loading available UICs...</div>
            ) : (
              <p>No existing valid UICs were found in the system.</p>
            )}
            
            <div className="uic-error-steps">
              <h3>{availableUICs.length > 0 ? 'Option 2: ' : ''}Create a new UIC</h3>
              <ol>
                <li>Go to your Profile page</li>
                <li>Click on "Create New UIC"</li>
                <li>Enter a 6-character UIC ID (letters and numbers only)</li>
                <li>Enter a name for your UIC</li>
                <li>Save your profile</li>
                <li>Return to this screen and try adding equipment again</li>
              </ol>
            </div>
            
            <div className="modal-actions">
              <button className="secondary-button" onClick={onClose}>
                Cancel
              </button>
              <button className="primary-button" onClick={handleNavigateToProfile}>
                Go to Profile Page
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2>Add New Equipment</h2>
            <p className="instructions">
              Paste data from Excel in tab-delimited format with the following columns:
              <br />
              LIN (required), NSN (required), Serial Number, Stock Number, Location
            </p>
            
            <textarea
              className="bulk-input"
              placeholder="Paste tab-delimited data here..."
              value={bulkData}
              onChange={handleBulkDataChange}
              rows={10}
            />

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="modal-actions">
              <button 
                className="secondary-button"
                onClick={onClose}
              >
                Cancel
              </button>
              <button 
                className="primary-button"
                onClick={handleAddEquipment}
                disabled={loading || !bulkData.trim()}
              >
                {loading ? 'Adding...' : 'Add to Unit Inventory'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AddEquipmentModal; 