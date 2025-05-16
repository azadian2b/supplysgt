import React, { useState, useEffect } from 'react';
import { DataStore, SortDirection } from '@aws-amplify/datastore';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { User, UIC, UICMembershipRequest, Role, RequestStatus, Soldier } from '../models';
import { useNavigate } from 'react-router-dom';
import '../styles/ProfilePage.css';
import { generateClient } from 'aws-amplify/api';
import { createUIC } from '../graphql/mutations';
import { Amplify } from 'aws-amplify';
import { ROLES, getRoleLabel } from '../utils/roleUtils';
import { syncUserData, safeDataStoreQuery, safeDataStoreSave } from '../utils/DataSyncManager';

// Add this flag at the top of your file to control approval bypass
// Set to true to bypass approval process, false to use normal approval flow
const BYPASS_APPROVAL_PROCESS = true; // Toggle this manually

const ProfilePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState(null);
  const [uicList, setUicList] = useState([]);
  const [isCreatingNewUIC, setIsCreatingNewUIC] = useState(false);
  
  // Add function to force sync User data
  const forceSyncUserData = async () => {
    try {
      setLoading(true);
      console.log("Forcing sync of user data");
      
      // Get current authenticated user
      const { username } = await getCurrentUser();
      
      // Use our sync utility instead of direct DataStore calls
      const userData = await syncUserData(username);
      
      if (userData) {
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          rank: userData.rank,
          uicId: userData.uicID,
          role: userData.role,
          newUicId: '',
          newUicName: '',
        });
        setUserData(userData);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error syncing user data:", error);
      setLoading(false);
    }
  };
  
  // Add new state for UIC filtering
  const [uicFilterText, setUicFilterText] = useState('');
  const [showUicDropdown, setShowUicDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    rank: '',
    uicId: '',
    newUicId: '',
    newUicName: '',
    role: ROLES.SOLDIER,
  });
  
  const [errors, setErrors] = useState({});

  // Add this state for soldier linking
  const [soldiersList, setSoldiersList] = useState([]);
  const [showSoldierLinking, setShowSoldierLinking] = useState(false);
  const [selectedSoldierId, setSelectedSoldierId] = useState('');

  // Move fetchData outside of useEffect so it can be used in multiple places
  const fetchData = async () => {
    try {
      // Use our sync utility instead of direct DataStore calls
      await safeDataStoreQuery(User);
      
      // Get current authenticated user
      const { username } = await getCurrentUser();
      const userAttributes = await fetchUserAttributes();
      
      // Pre-fill names if available from user attributes
      if (userAttributes.name) {
        // Split name into first and last
        const nameParts = userAttributes.name.trim().split(/\s+/);
        const lastName = nameParts.pop() || "";
        const firstName = nameParts.join(" ");
        
        setFormData(prev => ({ 
          ...prev, 
          firstName: firstName,
          lastName: lastName 
        }));
      }
      
      // Fetch user profile if exists
      const existingUsers = await safeDataStoreQuery(User, u => u.owner.eq(username));
      const userProfile = existingUsers.length > 0 ? existingUsers[0] : null;
      
      if (userProfile) {
        setFormData({
          firstName: userProfile.firstName || '',
          lastName: userProfile.lastName || '',
          rank: userProfile.rank,
          uicId: userProfile.uicID,
          role: userProfile.role,
          newUicId: '',
          newUicName: '',
        });
        setUserData(userProfile);
      }
      
      // Fetch all UICs
      const allUICs = await safeDataStoreQuery(UIC);
      setUicList(allUICs);
      
      // Now we can call the function instead of redefining it
      await fetchUnlinkedSoldiers();
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  // Move this function outside of fetchData to make it accessible in the component
  const fetchUnlinkedSoldiers = async () => {
    if (formData.uicId) {
      try {
        const unlinkedSoldiers = await safeDataStoreQuery(
          Soldier, 
          s => s.uicID.eq(formData.uicId).and(s => s.hasAccount.eq(false)),
          { sort: s => s.lastName(SortDirection.ASCENDING) }
        );
        setSoldiersList(unlinkedSoldiers);
        if (unlinkedSoldiers.length > 0) {
          setShowSoldierLinking(true);
        } else {
          setShowSoldierLinking(false);
        }
      } catch (error) {
        console.error('Error fetching unlinked soldiers:', error);
        setSoldiersList([]);
        setShowSoldierLinking(false);
      }
    } else {
      setSoldiersList([]);
      setShowSoldierLinking(false);
    }
  };

  // Fetch existing data on component mount
  useEffect(() => {
    fetchData();
    verifyUICData();
  }, []);
  
  // Add a subscription to User model changes
  useEffect(() => {
    const subscription = DataStore.observe(User).subscribe({
      next: msg => {
        console.log('DataStore User event:', msg);
        // If the updated user is the current user, refresh data
        if (userData && msg.element.id === userData.id) {
          console.log('Current user data changed, refreshing...');
          fetchData();
        }
      },
      error: error => console.error('DataStore User subscription error:', error)
    });
    
    return () => subscription.unsubscribe();
  }, [userData]);
  
  // Add somewhere in your component to check sync status
  useEffect(() => {
    const subscription = DataStore.observe(UIC).subscribe({
      next: msg => console.log('DataStore UIC event:', msg),
      error: error => console.error('DataStore subscription error:', error)
    });
    
    return () => subscription.unsubscribe();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when field is changed
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const toggleUICCreation = () => {
    setIsCreatingNewUIC(!isCreatingNewUIC);
    if (!isCreatingNewUIC) {
      setFormData(prev => ({ ...prev, uicId: '' }));
    } else {
      setFormData(prev => ({ ...prev, newUicId: '', newUicName: '' }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.rank.trim()) newErrors.rank = 'Rank is required';
    
    if (isCreatingNewUIC) {
      if (!formData.newUicId.trim()) newErrors.newUicId = 'UIC ID is required';
      else if (!/^[a-zA-Z0-9]{6}$/.test(formData.newUicId)) newErrors.newUicId = 'UIC must be 6 alphanumeric characters';
      
      if (!formData.newUicName.trim()) newErrors.newUicName = 'UIC Name is required';
    } else {
      if (!formData.uicId) newErrors.uicId = 'Please select a UIC';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Filter UICs based on the input text - explicitly searching UIC id
  const filteredUicList = uicList.filter(uic => 
    uic.uicCode?.toLowerCase().includes(uicFilterText.toLowerCase())
  );
  
  // Handle UIC filter text change
  const handleUicFilterChange = (e) => {
    setUicFilterText(e.target.value);
    setShowUicDropdown(true);
    
    // Clear error when typing
    if (errors.uicId) {
      setErrors(prev => ({ ...prev, uicId: null }));
    }
  };
  
  // Handle selecting a UIC from the dropdown
  const handleUicSelect = (uicId) => {
    setFormData(prev => ({ ...prev, uicId }));
    setUicFilterText('');
    setShowUicDropdown(false);
    // Reset soldier linking when changing UIC
    setSelectedSoldierId('');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      const { username } = await getCurrentUser();
      const userAttributes = await fetchUserAttributes();
      
      let userUicId;
      let needsApproval = false;
      
      // Handle UIC creation or selection
      if (isCreatingNewUIC) {
        // Check if UIC already exists - need to check by uicCode now
        const existingUICs = await safeDataStoreQuery(UIC, u => u.uicCode.eq(formData.newUicId));
        const existingUIC = existingUICs.length > 0 ? existingUICs[0] : null;
        
        console.log('Checking for existing UIC with code:', formData.newUicId);
        console.log('Existing UIC check result:', existingUIC);
        
        if (existingUIC) {
          setErrors({ newUicId: 'This UIC already exists' });
          setSaving(false);
          return;
        }
        
        // Create new UIC with uicCode field
        console.log('Creating new UIC with code:', formData.newUicId);
        
        const client = generateClient();
        const result = await client.graphql({
          query: createUIC,
          variables: {
            input: {
              uicCode: formData.newUicId,  // Store 6-char code in uicCode field
              name: formData.newUicName,
            }
          }
        });
        
        console.log('API result:', result);
        userUicId = result.data.createUIC.id;  // Still use the AWS ID for references

        // ADD THIS BLOCK: Automatically create a Soldier record for the UIC creator
        // Split name into first and last name (assuming format is "FirstName LastName")
        const nameParts = formData.firstName.trim().split(/\s+/);
        const lastName = nameParts.pop() || ""; // Last word in name as lastName
        const firstName = nameParts.join(" "); // Rest of words as firstName

        // Create soldier record for the user
        await safeDataStoreSave(
          new Soldier({
            firstName: firstName,
            lastName: lastName,
            rank: formData.rank,
            email: userAttributes?.email || "", // Use email from user attributes if available
            uicID: userUicId,
            role: formData.role,
            userId: userData?.id || null, // Link to user if available
            hasAccount: true, // This user already has an account
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        );

        console.log('Created soldier record for UIC creator');
      } else {
        userUicId = formData.uicId;
        
        // Check if user is already a member of this UIC
        if (userData?.uicID !== userUicId) {
          // User is trying to join an existing UIC
          const selectedUIC = await safeDataStoreQuery(UIC, userUicId);
          
          if (selectedUIC) {
            if (!BYPASS_APPROVAL_PROCESS) {
              // NORMAL MODE: Create membership request and require approval
              console.log('Normal mode: Creating membership request');
              
              try {
                const membershipRequest = await safeDataStoreSave(
                  new UICMembershipRequest({
                    userID: userData?.id || username, // Use ID if available, otherwise username
                    uicID: userUicId,
                    requestedRole: formData.role,
                    status: RequestStatus.PENDING,
                    createdAt: new Date().toISOString(),
                  })
                );
                console.log('Created membership request:', membershipRequest);
                
                needsApproval = true;
              } catch (membershipError) {
                console.error('Error creating membership request:', membershipError);
                throw new Error(`Membership request failed: ${membershipError.message}`);
              }
            } else {
              // BYPASS MODE: Skip approval process
              console.log('BYPASS MODE: Skipping approval process');
              needsApproval = false;
            }
          }
        }
      }
      
      // Update or create user profile
      if (userData) {
        await safeDataStoreSave(
          userData,
          updated => {
            updated.firstName = formData.firstName;
            updated.lastName = formData.lastName;
            updated.rank = formData.rank;
            updated.role = needsApproval ? userData.role : formData.role;
            // Only update UIC if creating new one or already approved
            if (isCreatingNewUIC || !needsApproval) {
              updated.uicID = userUicId;
            }
          }
        );
        
        // NEW CODE: Sync changes to linked soldier record if one exists
        // Find soldier records linked to this user
        const linkedSoldiers = await safeDataStoreQuery(
          Soldier,
          s => s.userId.eq(userData.id)
        );
        
        if (linkedSoldiers.length > 0) {
          console.log('Found linked soldier record to update:', linkedSoldiers[0]);
          
          // Update the linked soldier record with the user's updated information
          await safeDataStoreSave(
            linkedSoldiers[0],
            updated => {
              updated.firstName = formData.firstName;
              updated.lastName = formData.lastName;
              updated.rank = formData.rank;
              // Only update role if we're not waiting on approval
              if (!needsApproval) {
                updated.role = formData.role;
              }
              // Add email if it's in the user attributes
              if (userAttributes?.email) {
                updated.email = userAttributes.email;
              }
              updated.updatedAt = new Date().toISOString();
            }
          );
          
          console.log('Updated linked soldier record with new user information');
        }
      } else {
        await safeDataStoreSave(
          new User({
            owner: username,
            firstName: formData.firstName,
            lastName: formData.lastName,
            rank: formData.rank,
            role: isCreatingNewUIC ? formData.role : Role.PENDING,
            uicID: isCreatingNewUIC ? userUicId : null, // Only set UIC for new UIC creation
          })
        );
      }
      
      // Inside the try block after checking for needsApproval
      if (selectedSoldierId) {
        try {
          // Get the selected soldier
          const soldier = await safeDataStoreQuery(Soldier, selectedSoldierId);
          
          if (soldier) {
            // Update the soldier to mark it as having an account and link to user
            await safeDataStoreSave(
              soldier,
              updated => {
                updated.hasAccount = true;
                updated.userId = userData?.id;
              }
            );
            
            // Store the reference to the soldier ID in the user
            if (userData) {
              await safeDataStoreSave(
                userData,
                updated => {
                  updated.linkedSoldierId = soldier.id;
                }
              );
            }
            
            console.log('Linked soldier record:', soldier);
          }
        } catch (soldierLinkError) {
          console.error('Error linking soldier record:', soldierLinkError);
        }
      }
      
      // Show success message and redirect
      alert(needsApproval 
        ? 'Profile updated. Your request to join the UIC is pending approval.' 
        : 'Profile updated successfully');
      
      navigate('/');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert(`Error saving profile: ${error.message || 'Unknown error'}`);
      setSaving(false);
    }
  };
  
  // Add this function to check what's in your database
  const verifyUICData = async () => {
    try {
      const allUICs = await safeDataStoreQuery(UIC);
      console.log('Current UICs in database:', allUICs.map(uic => ({
        id: uic.id,
        uicCode: uic.uicCode,
        name: uic.name
      })));
    } catch (error) {
      console.error('Error querying UICs:', error);
    }
  };
  
  // Add this function to reset all data in the database
  const resetAllData = async () => {
    if (!window.confirm('Are you sure you want to reset ALL data? This cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      // Delete all membership requests first (because of relationships)
      const allRequests = await safeDataStoreQuery(UICMembershipRequest);
      console.log(`Deleting ${allRequests.length} membership requests...`);
      await Promise.all(allRequests.map(request => DataStore.delete(request)));
      
      // Delete all users
      const allUsers = await safeDataStoreQuery(User);
      console.log(`Deleting ${allUsers.length} users...`);
      await Promise.all(allUsers.map(user => DataStore.delete(user)));
      
      // Delete all UICs
      const allUICs = await safeDataStoreQuery(UIC);
      console.log(`Deleting ${allUICs.length} UICs...`);
      await Promise.all(allUICs.map(uic => DataStore.delete(uic)));
      
      alert('All data has been reset. The page will now reload.');
      window.location.reload();
    } catch (error) {
      console.error('Error resetting data:', error);
      alert('An error occurred while resetting data. See console for details.');
      setLoading(false);
    }
  };
  
  // Add this function to your component
  const runDiagnostics = async () => {
    try {
      // Get all UICs using DataStore
      const dsUICs = await safeDataStoreQuery(UIC);
      console.log('UICs from DataStore:', dsUICs);
      
      // Try to get the UIC using its known ID
      if (dsUICs.length > 0) {
        const firstId = dsUICs[0].id;
        console.log('First UIC ID:', firstId);
        
        // Try direct lookup
        const directLookup = await safeDataStoreQuery(UIC, firstId);
        console.log('Direct lookup result:', directLookup);
        
        // Inspect all UIC fields
        console.log('First UIC full inspection:');
        for (const key in dsUICs[0]) {
          console.log(`${key}: ${dsUICs[0][key]} (${typeof dsUICs[0][key]})`);
        }
      }
    } catch (error) {
      console.error('Diagnostics error:', error);
    }
  };
  
  // Add this migration helper
  const migrateExistingData = async () => {
    if (!window.confirm('Migrate existing UICs to use the uicCode field? This will use the ID as the UIC code if none exists.')) {
      return;
    }
    
    try {
      setLoading(true);
      const allUICs = await safeDataStoreQuery(UIC);
      
      for (const uic of allUICs) {
        // Skip if uicCode is already set
        if (uic.uicCode) {
          console.log(`UIC ${uic.id} already has uicCode: ${uic.uicCode}`);
          continue;
        }
        
        // Use ID as the code or generate a random 6-char code
        const uicCode = (uic.id.length === 6) ? 
          uic.id : 
          Math.random().toString(36).substring(2, 8).toUpperCase();
        
        console.log(`Migrating UIC ${uic.id} to use uicCode: ${uicCode}`);
        
        await safeDataStoreSave(
          uic,
          updated => {
            updated.uicCode = uicCode;
          }
        );
      }
      
      alert('Migration completed. The page will now reload.');
      window.location.reload();
    } catch (error) {
      console.error('Error migrating data:', error);
      alert('An error occurred during migration. See console for details.');
    } finally {
      setLoading(false);
    }
  };
  
  // Add this function to standardize roles in existing data
  const standardizeRoles = async () => {
    if (!window.confirm('Standardize role values in all records? This will ensure consistency.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Fix roles in Soldier records
      const allSoldiers = await safeDataStoreQuery(Soldier);
      console.log(`Standardizing roles for ${allSoldiers.length} soldiers...`);
      
      for (const soldier of allSoldiers) {
        let needsUpdate = false;
        let standardRole = soldier.role;
        
        // Check if role is not in standard format
        if (soldier.role !== ROLES.COMMANDER && 
            soldier.role !== ROLES.SUPPLY_SERGEANT && 
            soldier.role !== ROLES.FIRST_SERGEANT && 
            soldier.role !== ROLES.SOLDIER && 
            soldier.role !== ROLES.PENDING) {
          
          // Try to match to standard format
          const upperRole = soldier.role.toUpperCase();
          if (upperRole.includes('COMMAND')) standardRole = ROLES.COMMANDER;
          else if (upperRole.includes('SUPPLY')) standardRole = ROLES.SUPPLY_SERGEANT;
          else if (upperRole.includes('FIRST')) standardRole = ROLES.FIRST_SERGEANT;
          else if (upperRole.includes('SOLDIER')) standardRole = ROLES.SOLDIER;
          else standardRole = ROLES.SOLDIER; // Default
          
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          await safeDataStoreSave(
            soldier,
            updated => {
              updated.role = standardRole;
            }
          );
          console.log(`Updated soldier ${soldier.id}'s role to ${standardRole}`);
        }
      }
      
      // Fix roles in User records
      const allUsers = await safeDataStoreQuery(User);
      console.log(`Standardizing roles for ${allUsers.length} users...`);
      
      for (const user of allUsers) {
        let needsUpdate = false;
        let standardRole = user.role;
        
        // Check if role is not in standard format
        if (user.role !== ROLES.COMMANDER && 
            user.role !== ROLES.SUPPLY_SERGEANT && 
            user.role !== ROLES.FIRST_SERGEANT && 
            user.role !== ROLES.SOLDIER && 
            user.role !== ROLES.PENDING) {
          
          // Try to match to standard format
          const upperRole = user.role.toUpperCase();
          if (upperRole.includes('COMMAND')) standardRole = ROLES.COMMANDER;
          else if (upperRole.includes('SUPPLY')) standardRole = ROLES.SUPPLY_SERGEANT;
          else if (upperRole.includes('FIRST')) standardRole = ROLES.FIRST_SERGEANT;
          else if (upperRole.includes('SOLDIER')) standardRole = ROLES.SOLDIER;
          else standardRole = ROLES.PENDING; // Default
          
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          await safeDataStoreSave(
            user,
            updated => {
              updated.role = standardRole;
            }
          );
          console.log(`Updated user ${user.id}'s role to ${standardRole}`);
        }
      }
      
      alert('Role standardization completed. The page will now reload.');
      window.location.reload();
    } catch (error) {
      console.error('Error standardizing roles:', error);
      alert('An error occurred during role standardization. See console for details.');
    } finally {
      setLoading(false);
    }
  };
  
  // Call this when a UIC is selected
  useEffect(() => {
    if (formData.uicId) {
      fetchUnlinkedSoldiers();
    }
  }, [formData.uicId]);
  
  // Add this function
  const addSelfToRoster = async () => {
    if (!userData || !userData.uicID) {
      alert('You need to join a UIC before you can add yourself to the roster.');
      return;
    }
    
    try {
      // Check if user is already in the roster
      const existingSoldiers = await safeDataStoreQuery(
        Soldier,
        s => s.userId.eq(userData.id)
      );
      
      if (existingSoldiers.length > 0) {
        alert('You are already in the roster.');
        return;
      }
      
      // Use firstName and lastName directly from userData
      await safeDataStoreSave(
        new Soldier({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          rank: userData.rank,
          email: '',
          uicID: userData.uicID,
          role: userData.role,
          userId: userData.id,
          hasAccount: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      );
      
      alert('You have been added to the roster successfully.');
    } catch (error) {
      console.error('Error adding self to roster:', error);
      alert('Failed to add yourself to the roster. See console for details.');
    }
  };
  
  // Add this migration function
  const migrateUserNames = async () => {
    if (!window.confirm('Migrate existing user records to use first name and last name fields? This will split current names.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Get all users
      const allUsers = await safeDataStoreQuery(User);
      console.log(`Migrating names for ${allUsers.length} users...`);
      
      let migratedCount = 0;
      
      for (const user of allUsers) {
        // Skip users that already have firstName and lastName
        if (user.firstName && user.lastName) {
          console.log(`User ${user.id} already has firstName and lastName`);
          continue;
        }
        
        // For users with only 'name' field
        if (user.name) {
          // Split name into first and last
          const nameParts = user.name.trim().split(/\s+/);
          const lastName = nameParts.pop() || "Unknown";
          const firstName = nameParts.length > 0 ? nameParts.join(" ") : "Unknown";
          
          // Update user record
          await safeDataStoreSave(
            user,
            updated => {
              updated.firstName = firstName;
              updated.lastName = lastName;
            }
          );
          
          console.log(`Migrated user ${user.id}: "${user.name}" → First: "${firstName}", Last: "${lastName}"`);
          migratedCount++;
        }
      }
      
      alert(`Name migration completed. Migrated ${migratedCount} users. The page will now reload.`);
      window.location.reload();
    } catch (error) {
      console.error('Error migrating user names:', error);
      alert('An error occurred during name migration. See console for details.');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div className="loading">Loading profile data...</div>;
  }
  
  return (
    <div className="profile-page">
      <h1>Update Your Profile</h1>
      
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-actions" style={{ marginBottom: '20px' }}>
          <button 
            type="button" 
            className="refresh-btn" 
            onClick={async () => {
              setLoading(true);
              await forceSyncUserData();
              await fetchData();
              setLoading(false);
            }}
          >
            Refresh Data
          </button>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">First Name:</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            {errors.firstName && <div className="error">{errors.firstName}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="lastName">Last Name:</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
            {errors.lastName && <div className="error">{errors.lastName}</div>}
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="rank">Rank:</label>
          <input
            type="text"
            id="rank"
            name="rank"
            value={formData.rank}
            onChange={handleChange}
            required
          />
          {errors.rank && <div className="error">{errors.rank}</div>}
        </div>
        
        <div className="form-group uic-toggle">
          <button 
            type="button" 
            className={`toggle-btn ${isCreatingNewUIC ? '' : 'active'}`}
            onClick={() => setIsCreatingNewUIC(false)}
          >
            Join Existing UIC
          </button>
          <button 
            type="button" 
            className={`toggle-btn ${isCreatingNewUIC ? 'active' : ''}`}
            onClick={() => setIsCreatingNewUIC(true)}
          >
            Create New UIC
          </button>
        </div>
        
        {isCreatingNewUIC ? (
          <>
            <div className="form-group">
              <label htmlFor="newUicId">New UIC ID (6 characters):</label>
              <input
                type="text"
                id="newUicId"
                name="newUicId"
                value={formData.newUicId}
                onChange={handleChange}
                pattern="[a-zA-Z0-9]{6}"
                maxLength={6}
                required
              />
              {errors.newUicId && <div className="error">{errors.newUicId}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="newUicName">UIC Name:</label>
              <input
                type="text"
                id="newUicName"
                name="newUicName"
                value={formData.newUicName}
                onChange={handleChange}
                required
              />
              {errors.newUicName && <div className="error">{errors.newUicName}</div>}
            </div>
          </>
        ) : (
          <div className="form-group">
            <label htmlFor="uicFilter">Select UIC:</label>
            <div className="uic-autocomplete">
              <input
                type="text"
                id="uicFilter"
                placeholder="Type to search UIC code"
                value={uicFilterText}
                onChange={handleUicFilterChange}
                onFocus={() => setShowUicDropdown(true)}
              />
              {showUicDropdown && filteredUicList.length > 0 && (
                <ul className="uic-dropdown">
                  {filteredUicList.map(uic => (
                    <li 
                      key={uic.id} 
                      onClick={() => handleUicSelect(uic.id)}
                      className={formData.uicId === uic.id ? 'selected' : ''}
                    >
                      {uic.uicCode} - {uic.name}
                    </li>
                  ))}
                </ul>
              )}
              {/* Display the selected UIC */}
              {formData.uicId && (
                <div className="selected-uic">
                  Selected UIC: {uicList.find(u => u.id === formData.uicId)?.uicCode} - {uicList.find(u => u.id === formData.uicId)?.name}
                </div>
              )}
              {errors.uicId && <div className="error">{errors.uicId}</div>}
            </div>
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="role">Role:</label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value={ROLES.SOLDIER}>{getRoleLabel(ROLES.SOLDIER)}</option>
            <option value={ROLES.SUPPLY_SERGEANT}>{getRoleLabel(ROLES.SUPPLY_SERGEANT)}</option>
            <option value={ROLES.FIRST_SERGEANT}>{getRoleLabel(ROLES.FIRST_SERGEANT)}</option>
            <option value={ROLES.COMMANDER}>{getRoleLabel(ROLES.COMMANDER)}</option>
          </select>
        </div>
        
        {!isCreatingNewUIC && formData.uicId && userData?.uicID !== formData.uicId && (
          <div className="notice">
            Note: Joining an existing UIC requires approval from UIC administrators.
          </div>
        )}
        
        {/* Add the soldier linking section */}
        {!isCreatingNewUIC && showSoldierLinking && (
          <div className="form-group">
            <label>Link to Existing Soldier Record:</label>
            <select
              value={selectedSoldierId}
              onChange={(e) => setSelectedSoldierId(e.target.value)}
            >
              <option value="">-- Select an existing record or leave blank --</option>
              {soldiersList.map(soldier => (
                <option key={soldier.id} value={soldier.id}>
                  {soldier.rank ? `${soldier.rank} ` : ''}{soldier.lastName}, {soldier.firstName}
                </option>
              ))}
            </select>
            <div className="helper-text">
              If you were previously added to the system by your unit, select your record here to link your account.
            </div>
          </div>
        )}
        
        <div className="form-actions">
          <button type="submit" className="save-btn" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
      
      {/* Add the admin reset section */}
      <div className="admin-section">
        <h3>Administration</h3>
        <div className="admin-buttons">
          <button type="button" className="reset-btn" onClick={resetAllData}>
            Reset All Data
          </button>
          <button type="button" className="diag-btn" onClick={runDiagnostics}>
            Run Diagnostics
          </button>
          <button type="button" className="migrate-btn" onClick={migrateExistingData}>
            Migrate UIC Data
          </button>
          <button type="button" className="std-roles-btn" onClick={standardizeRoles}>
            Standardize Roles
          </button>
          <button type="button" className="add-self-btn" onClick={addSelfToRoster}>
            Add Self to Roster
          </button>
          <button type="button" className="migrate-names-btn" onClick={migrateUserNames}>
            Migrate Names
          </button>
        </div>
        <p className="help-text">Use these tools to troubleshoot database issues.</p>
      </div>
    </div>
  );
};

export default ProfilePage; 