import React, { useState, useEffect } from 'react';
import { DataStore, SortDirection } from '../utils/GraphQLDataStoreCompat';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { User, UIC, UICMembershipRequest, Role, RequestStatus, Soldier, AdditionalUIC, UICCreationRequest } from '../models';
import { useNavigate } from 'react-router-dom';
import '../styles/ProfilePage.css';
import { ROLES, getRoleLabel } from '../utils/roleUtils';
import { syncUserData, safeDataStoreQuery, safeDataStoreSave } from '../utils/DataSyncManager';
import { isPlatformAdminAttributes } from '../utils/adminUtils';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState(null);
  const [uicList, setUicList] = useState([]);
  const [isCreatingNewUIC, setIsCreatingNewUIC] = useState(false);
  const [additionalUICs, setAdditionalUICs] = useState([]);
  const [showAddUICForm, setShowAddUICForm] = useState(false);

  // Add new state for UIC approvals
  const [pendingUICCreations, setPendingUICCreations] = useState([]);
  const [pendingUICMemberships, setPendingUICMemberships] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

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

  // Add function to fetch additional UICs
  const fetchAdditionalUICs = async () => {
    if (userData?.role === ROLES.SUPPLY_SERGEANT) {
      try {
        const additionalUICsList = await safeDataStoreQuery(
          AdditionalUIC,
          a => a.userID.eq(userData.id)
        );
        setAdditionalUICs(additionalUICsList);
      } catch (error) {
        console.error('Error fetching additional UICs:', error);
      }
    }
  };

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

      // Fetch additional UICs if user is a supply sergeant
      if (userProfile?.role === ROLES.SUPPLY_SERGEANT) {
        await fetchAdditionalUICs();
      }

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
          s => s.uicID.eq(formData.uicId).and(s.hasAccount.eq(false)),
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
    // Initial profile/bootstrap load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // Re-subscribe when the current user record changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      const now = new Date().toISOString();
      const requestedRole = formData.role;
      let userUicId = isCreatingNewUIC ? null : formData.uicId;
      let needsApproval = false;

      if (isCreatingNewUIC) {
        const requestedUicCode = formData.newUicId.trim().toUpperCase();
        const existingUICs = await safeDataStoreQuery(UIC, u => u.uicCode.eq(requestedUicCode));
        const existingUIC = existingUICs.length > 0 ? existingUICs[0] : null;

        if (existingUIC) {
          setErrors({ newUicId: 'This UIC already exists' });
          setSaving(false);
          return;
        }

        needsApproval = true;
      } else {
        const isChangingUIC = userData?.uicID !== userUicId;
        const isChangingRole = Boolean(userData && userData.role !== requestedRole);
        needsApproval = isChangingUIC || isChangingRole || !userData;
      }

      // Update or create user profile
      let savedUser;
      if (userData) {
        savedUser = await safeDataStoreSave(
          userData,
          updated => {
            updated.firstName = formData.firstName;
            updated.lastName = formData.lastName;
            updated.rank = formData.rank;
            updated.role = needsApproval ? userData.role : requestedRole;
            if (!needsApproval) {
              updated.uicID = userUicId;
            }
          }
        );
      } else {
        savedUser = await safeDataStoreSave(
          new User({
            owner: username,
            firstName: formData.firstName,
            lastName: formData.lastName,
            rank: formData.rank,
            role: Role.PENDING,
            uicID: null,
          })
        );
      }

      if (isCreatingNewUIC) {
        const requestedUicCode = formData.newUicId.trim().toUpperCase();
        const existingRequests = await safeDataStoreQuery(
          UICCreationRequest,
          r => r.requestedBy.eq(savedUser.id).and(r.status.eq(RequestStatus.PENDING))
        );

        const duplicateRequest = existingRequests.find(
          request => request.uicCode === requestedUicCode
        );

        if (!duplicateRequest) {
          await safeDataStoreSave(
            new UICCreationRequest({
              requestedBy: savedUser.id,
              uicCode: requestedUicCode,
              uicName: formData.newUicName.trim(),
              status: RequestStatus.PENDING,
              createdAt: now
            })
          );
        }
      } else if (needsApproval) {
        const existingRequests = await safeDataStoreQuery(
          UICMembershipRequest,
          r => r.userID.eq(savedUser.id).and(r.uicID.eq(userUicId)).and(r.status.eq(RequestStatus.PENDING))
        );

        if (existingRequests.length === 0) {
          await safeDataStoreSave(
            new UICMembershipRequest({
              userID: savedUser.id,
              uicID: userUicId,
              requestedRole,
              status: RequestStatus.PENDING,
              createdAt: now
            })
          );
        }
      }

      if (savedUser) {
        // Update linked soldier record if one exists
        const linkedSoldiers = await safeDataStoreQuery(
          Soldier,
          s => s.userId.eq(savedUser.id)
        );

        if (linkedSoldiers.length > 0) {
          await safeDataStoreSave(
            linkedSoldiers[0],
            updated => {
              updated.firstName = formData.firstName;
              updated.lastName = formData.lastName;
              updated.rank = formData.rank;
              if (!needsApproval) {
                updated.role = requestedRole;
              }
              if (userAttributes?.email) {
                updated.email = userAttributes.email;
              }
              updated.updatedAt = now;
            }
          );
        }
      }

      // Handle soldier linking
      if (selectedSoldierId) {
        try {
          const soldier = await safeDataStoreQuery(Soldier, selectedSoldierId);

          if (soldier) {
            await safeDataStoreSave(
              soldier,
              updated => {
                updated.hasAccount = true;
                updated.userId = savedUser.id;
              }
            );

            savedUser = await safeDataStoreSave(
              savedUser,
              updated => {
                updated.linkedSoldierId = soldier.id;
              }
            );
          }
        } catch (soldierLinkError) {
          console.error('Error linking soldier record:', soldierLinkError);
        }
      }

      // Show success message and redirect
      alert(needsApproval
        ? 'Profile updated. Your request is pending approval.'
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

  // Call this when a UIC is selected
  useEffect(() => {
    if (formData.uicId) {
      fetchUnlinkedSoldiers();
    }
    // Soldier candidates depend on selected UIC.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.uicId]);

  /*
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

  */
  // Add function to handle adding a new UIC
  const handleAddUIC = async (uicId) => {
    if (!userData || userData.role !== ROLES.SUPPLY_SERGEANT) {
      return;
    }

    try {
      // Check if UIC already exists in additional UICs
      const existingUIC = additionalUICs.find(uic => uic.uicID === uicId);
      if (existingUIC) {
        alert('You already have access to this UIC');
        return;
      }

      // Create new additional UIC record
      await safeDataStoreSave(
        new AdditionalUIC({
          userID: userData.id,
          uicID: uicId,
          status: RequestStatus.PENDING,
          createdAt: new Date().toISOString(),
        })
      );

      // Refresh additional UICs list
      await fetchAdditionalUICs();
      setShowAddUICForm(false);

      alert('Request to add UIC has been submitted and is pending approval');
    } catch (error) {
      console.error('Error adding UIC:', error);
      alert('Failed to add UIC. Please try again.');
    }
  };

  // Add function to handle switching UIC
  const handleSwitchUIC = async (uicId) => {
    if (!userData) return;

    try {
      // Update user's current UIC
      await safeDataStoreSave(
        userData,
        updated => {
          updated.uicID = uicId;
        }
      );

      // Refresh user data
      await fetchData();
      alert('Successfully switched to the selected UIC');
    } catch (error) {
      console.error('Error switching UIC:', error);
      alert('Failed to switch UIC. Please try again.');
    }
  };

  // Add function to check if user is admin
  const checkIfAdmin = async () => {
    try {
      const userAttributes = await fetchUserAttributes();
      setIsAdmin(isPlatformAdminAttributes(userAttributes));
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  // Add function to fetch pending UIC creation requests
  const fetchPendingUICCreations = async () => {
    try {
      const requests = await safeDataStoreQuery(
        UICCreationRequest,
        r => r.status.eq(RequestStatus.PENDING)
      );
      setPendingUICCreations(requests);
    } catch (error) {
      console.error('Error fetching pending UIC creations:', error);
    }
  };

  // Add function to fetch pending UIC membership requests
  const fetchPendingUICMemberships = async () => {
    try {
      // If user is admin, get all pending requests
      if (isAdmin) {
        const requests = await safeDataStoreQuery(
          UICMembershipRequest,
          r => r.status.eq(RequestStatus.PENDING)
        );
        setPendingUICMemberships(requests);
        return;
      }

      // Otherwise, get requests for UICs where user is an approver
      const userUICs = await safeDataStoreQuery(
        User,
        u => u.or(u => [
          u.uicID.eq(userData?.uicID),
          u.id.eq(userData?.id)
        ])
      );

      const approverUICs = userUICs.filter(u =>
        u.role === ROLES.SUPPLY_SERGEANT ||
        u.role === ROLES.FIRST_SERGEANT ||
        u.role === ROLES.COMMANDER
      ).map(u => u.uicID);

      if (approverUICs.length > 0) {
        const requests = await safeDataStoreQuery(
          UICMembershipRequest,
          r => r.status.eq(RequestStatus.PENDING).and(r.uicID.in(approverUICs))
        );
        setPendingUICMemberships(requests);
      }
    } catch (error) {
      console.error('Error fetching pending UIC memberships:', error);
    }
  };

  // Add function to handle UIC creation approval
  const handleUICCreationApproval = async (requestId, isApproved) => {
    try {
      const request = await safeDataStoreQuery(UICCreationRequest, requestId);
      if (!request) {
        throw new Error('Request not found');
      }

      if (isApproved) {
        // Create the new UIC
        const newUIC = await safeDataStoreSave(
          new UIC({
            uicCode: request.uicCode,
            name: request.uicName
          })
        );

        // Update the request status
        await safeDataStoreSave(
          UICCreationRequest.copyOf(request, updated => {
            updated.status = RequestStatus.APPROVED;
            updated.approvedBy = userData?.id;
            updated.approvedAt = new Date().toISOString();
            updated.createdUIC = newUIC.id;
          })
        );
      } else {
        // Update the request status to rejected
        await safeDataStoreSave(
          UICCreationRequest.copyOf(request, updated => {
            updated.status = RequestStatus.REJECTED;
            updated.approvedBy = userData?.id;
            updated.approvedAt = new Date().toISOString();
          })
        );
      }

      // Refresh the lists
      await fetchPendingUICCreations();
      await fetchPendingUICMemberships();
    } catch (error) {
      console.error('Error handling UIC creation approval:', error);
      alert('Error handling approval. Please try again.');
    }
  };

  // Add function to handle UIC membership approval
  const handleUICMembershipApproval = async (requestId, isApproved) => {
    try {
      const request = await safeDataStoreQuery(UICMembershipRequest, requestId);
      if (!request) {
        throw new Error('Request not found');
      }

      if (isApproved) {
        // Update the user's UIC and role
        const user = await safeDataStoreQuery(User, request.userID);
        if (user) {
          await safeDataStoreSave(
            User.copyOf(user, updated => {
              updated.uicID = request.uicID;
              updated.role = request.requestedRole;
            })
          );
        }

        // Update the request status
        await safeDataStoreSave(
          UICMembershipRequest.copyOf(request, updated => {
            updated.status = RequestStatus.APPROVED;
            updated.approvedBy = userData?.id;
            updated.approvedAt = new Date().toISOString();
          })
        );
      } else {
        // Update the request status to rejected
        await safeDataStoreSave(
          UICMembershipRequest.copyOf(request, updated => {
            updated.status = RequestStatus.REJECTED;
            updated.approvedBy = userData?.id;
            updated.approvedAt = new Date().toISOString();
          })
        );
      }

      // Refresh the lists
      await fetchPendingUICMemberships();
    } catch (error) {
      console.error('Error handling UIC membership approval:', error);
      alert('Error handling approval. Please try again.');
    }
  };

  // Add useEffect to fetch pending requests
  useEffect(() => {
    if (userData) {
      checkIfAdmin();
      fetchPendingUICCreations();
      fetchPendingUICMemberships();
    }
    // Approval queues refresh when the current profile context changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  if (loading) {
    return <div className="loading">Loading profile data...</div>;
  }

  return (
    <div className="profile-page">
      <h1>Update Your Profile</h1>

      {/* Add UIC Approval Section */}
      {(isAdmin || userData?.role === ROLES.SUPPLY_SERGEANT ||
        userData?.role === ROLES.FIRST_SERGEANT ||
        userData?.role === ROLES.COMMANDER) && (
        <div className="uic-approval-section">
          <h2>UIC Approval Requests</h2>

          {/* UIC Creation Requests */}
          {isAdmin && pendingUICCreations.length > 0 && (
            <div className="approval-section">
              <h3>Pending UIC Creation Requests</h3>
              <div className="request-list">
                {pendingUICCreations.map(request => (
                  <div key={request.id} className="request-item">
                    <div className="request-info">
                      <p><strong>UIC Code:</strong> {request.uicCode}</p>
                      <p><strong>UIC Name:</strong> {request.uicName}</p>
                      <p><strong>Requested By:</strong> {request.user?.firstName} {request.user?.lastName}</p>
                    </div>
                    <div className="request-actions">
                      <button
                        onClick={() => handleUICCreationApproval(request.id, true)}
                        className="approve-btn"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleUICCreationApproval(request.id, false)}
                        className="reject-btn"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* UIC Membership Requests */}
          {pendingUICMemberships.length > 0 && (
            <div className="approval-section">
              <h3>Pending UIC Membership Requests</h3>
              <div className="request-list">
                {pendingUICMemberships.map(request => (
                  <div key={request.id} className="request-item">
                    <div className="request-info">
                      <p><strong>UIC:</strong> {request.uic?.uicCode} - {request.uic?.name}</p>
                      <p><strong>User:</strong> {request.user?.firstName} {request.user?.lastName}</p>
                      <p><strong>Requested Role:</strong> {request.requestedRole}</p>
                    </div>
                    <div className="request-actions">
                      <button
                        onClick={() => handleUICMembershipApproval(request.id, true)}
                        className="approve-btn"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleUICMembershipApproval(request.id, false)}
                        className="reject-btn"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingUICCreations.length === 0 && pendingUICMemberships.length === 0 && (
            <p>No pending requests to approve.</p>
          )}
        </div>
      )}

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

      {/* Add section for managing additional UICs */}
      {userData?.role === ROLES.SUPPLY_SERGEANT && (
        <div className="additional-uics-section">
          <h2>Manage Additional UICs</h2>

          <div className="current-uic">
            <h3>Current UIC</h3>
            <p>
              {uicList.find(u => u.id === userData.uicID)?.uicCode} -
              {uicList.find(u => u.id === userData.uicID)?.name}
            </p>
          </div>

          <div className="additional-uics-list">
            <h3>Additional UICs</h3>
            {additionalUICs.length === 0 ? (
              <p>No additional UICs added yet.</p>
            ) : (
              <div className="uic-list">
                {additionalUICs.map(uic => {
                  const uicDetails = uicList.find(u => u.id === uic.uicID);
                  return (
                    <div key={uic.id} className="uic-item">
                      <div className="uic-info">
                        <span>{uicDetails?.uicCode} - {uicDetails?.name}</span>
                        <span className="status">Status: {uic.status}</span>
                      </div>
                      {uic.status === RequestStatus.APPROVED && (
                        <button
                          onClick={() => handleSwitchUIC(uic.uicID)}
                          disabled={userData.uicID === uic.uicID}
                        >
                          {userData.uicID === uic.uicID ? 'Current UIC' : 'Switch to this UIC'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="add-uic-section">
            <button
              type="button"
              onClick={() => setShowAddUICForm(!showAddUICForm)}
            >
              {showAddUICForm ? 'Cancel' : 'Add New UIC'}
            </button>

            {showAddUICForm && (
              <div className="add-uic-form">
                <h3>Add New UIC</h3>
                <div className="uic-autocomplete">
                  <input
                    type="text"
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
                          onClick={() => {
                            handleAddUIC(uic.id);
                            setUicFilterText('');
                            setShowUicDropdown(false);
                          }}
                        >
                          {uic.uicCode} - {uic.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfilePage;
