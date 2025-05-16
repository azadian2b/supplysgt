import React, { useState, useEffect, useRef } from 'react';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import './Pages.css';
import './Issue.css';

// Import custom hooks
import useEquipment from '../hooks/useEquipment';
import useSoldiers from '../hooks/useSoldiers';
import usePdfGeneration from '../hooks/usePdfGeneration';
import useHandReceipts from '../hooks/useHandReceipts';

// Import components
import ActiveHandReceipts from '../components/ActiveHandReceipts';

// Create client at module level to prevent reinitialization
const client = generateClient();

function Issue() {
  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uicID, setUicID] = useState(null);
  const [uicCode, setUicCode] = useState('');
  const [uicName, setUicName] = useState('');
  const [receiptActions, setReceiptActions] = useState({}); // Tracks which receipts have been downloaded/issued
  
  // Flag to prevent reloading data
  const initialDataLoaded = useRef(false);

  // Custom hooks
  const { 
    equipment,
    masterItems,
    groups,
    groupsMap,
    itemStatusMap,
    selectedItems,
    expandedGroups,
    searchTerm,
    setSearchTerm,
    filterBySoldier,
    setFilterBySoldier,
    filterByStatus,
    setFilterByStatus,
    toggleItemSelection,
    toggleGroupExpansion,
    getGroupItems,
    getFilteredEquipment,
    clearSelectedItems,
    refreshEquipmentData,
    setError: setEquipmentError,
    setSelectedItems
  } = useEquipment(uicID);

  const {
    soldiers,
    soldiersMap,
    getSoldierFullName,
    loadSoldiers
  } = useSoldiers(uicID);

  const {
    generating,
    generatedPdfs,
    generatePdfs,
    downloadPdf,
    downloadAllPdfs,
    uploadPdfToS3
  } = usePdfGeneration(uicCode, uicName);

  const {
    activeHandReceipts,
    processingAction,
    loadActiveHandReceipts,
    getHandReceiptPdf,
    returnHandReceipt,
    returnHandReceiptItem,
    setError: setHandReceiptError,
    setSuccess: setHandReceiptSuccess
  } = useHandReceipts(uicID);

  // Load data only once on mount
  useEffect(() => {
    if (!initialDataLoaded.current) {
      loadInitialData();
      initialDataLoaded.current = true;
    }
  }, []);

  // Safely handle error propagation from hooks
  useEffect(() => {
    if (setEquipmentError && setEquipmentError !== error) {
      setError(setEquipmentError);
    }
  }, [setEquipmentError]);

  useEffect(() => {
    if (setHandReceiptError && setHandReceiptError !== error) {
      setError(setHandReceiptError);
    }
  }, [setHandReceiptError]);

  useEffect(() => {
    if (setHandReceiptSuccess && setHandReceiptSuccess !== success) {
      setSuccess(setHandReceiptSuccess);
    }
  }, [setHandReceiptSuccess]);

  // Load all necessary data
  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Get current user and UIC
      const { username } = await getCurrentUser();
      
      const userResponse = await client.graphql({
        query: `query GetUserByOwner($owner: String!) {
          usersByOwner(owner: $owner, limit: 1) {
            items {
              id
              uicID
            }
          }
        }`,
        variables: { owner: username }
      });
      
      const userData = userResponse.data.usersByOwner.items[0];
      if (!userData || !userData.uicID) {
        setError('You must be assigned to a UIC to view this page.');
        setLoading(false);
        return;
      }
      
      const uicData = await client.graphql({
        query: `query GetUIC($id: ID!) {
          getUIC(id: $id) {
            id
            uicCode
            name
          }
        }`,
        variables: { id: userData.uicID }
      });
      
      const uic = uicData.data.getUIC;
      if (!uic) {
        setError('Could not find the UIC you are assigned to.');
        setLoading(false);
        return;
      }
      
      setUicID(uic.id);
      setUicCode(uic.uicCode);
      setUicName(uic.name);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to load data. Please try again.');
      setLoading(false);
    }
  };

  // Mark items as issued (create HandReceiptStatus records) - this is an explicit user action
  const handleMarkItemsIssued = async (pdfFile) => {
    try {
      setError('');
      
      // Get hand receipt items
      const items = selectedItems.filter(item => 
        item.assignedToID === pdfFile.soldier.id
      );
      
      if (items.length === 0) {
        setError('Could not find items for this receipt.');
        return;
      }
      
      // Upload PDF to S3 first
      const s3Key = await uploadPdfToS3(pdfFile);
      
      // Create HandReceiptStatus records for each item
      for (const item of items) {
        try {
          // Create the HandReceiptStatus record
          await client.graphql({
            query: `mutation CreateHandReceiptStatus($input: CreateHandReceiptStatusInput!) {
              createHandReceiptStatus(input: $input) {
                id
                receiptNumber
                status
                equipmentItemID
                issuedOn
              }
            }`,
            variables: {
              input: {
                receiptNumber: pdfFile.receiptNumber,
                status: 'ISSUED',
                fromUIC: uicID,
                toSoldierID: item.assignedToID, 
                equipmentItemID: item.id,
                issuedOn: new Date().toISOString(),
                pdfS3Key: s3Key
              }
            }
          });
        } catch (error) {
          console.error(`Error creating HandReceiptStatus for item ${item.id}:`, error);
        }
      }
      
      // Mark this receipt as issued in local state
      setReceiptActions(prev => ({
        ...prev,
        [pdfFile.name]: { ...prev[pdfFile.name], issued: true }
      }));
      
      // Refresh data ONLY after this explicit user action
      refreshEquipmentData();
      loadActiveHandReceipts(uicID);
      
      setSuccess(`${items.length} items have been issued and locked on hand receipt ${pdfFile.receiptNumber}.`);
    } catch (error) {
      console.error('Error marking items as issued:', error);
      setError('Failed to issue items. Please try again.');
    }
  };

  // Handle PDF generation - explicit user action
  const handleGeneratePdfs = async () => {
    try {
      if (selectedItems.length === 0) {
        setError('Please select at least one item to generate hand receipts.');
        return;
      }
      
      setError('');
      setSuccess('');
      
      const pdfFiles = await generatePdfs(selectedItems, soldiersMap);
      
      setSuccess(`Generated ${pdfFiles.length} hand receipt${pdfFiles.length !== 1 ? 's' : ''}.`);
    } catch (error) {
      console.error('Error generating PDFs:', error);
      setError('Failed to generate hand receipts: ' + error.message);
    }
  };

  // Handle downloading PDF - user action, no data refetch needed
  const handleDownloadPdf = (pdfFile) => {
    downloadPdf(pdfFile);
    
    // Mark this PDF as downloaded so the Items Issued button can be enabled
    setReceiptActions(prev => ({
      ...prev,
      [pdfFile.name]: { ...prev[pdfFile.name], downloaded: true }
    }));
  };

  // View active hand receipt PDF - user action, no data refetch needed
  const handleViewActivePdf = async (receipt) => {
    try {
      if (!receipt.pdfS3Key) {
        setError('PDF not found for this receipt.');
        return;
      }
      
      const pdfUrl = await getHandReceiptPdf(receipt.pdfS3Key);
      if (pdfUrl) {
        window.open(pdfUrl, '_blank');
      }
    } catch (error) {
      console.error('Error viewing PDF:', error);
      setError('Failed to view PDF. Please try again.');
    }
  };

  const filteredEquipment = getFilteredEquipment();

  return (
    <div className="page-container">
      <h1>Issue Equipment</h1>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      {loading ? (
        <div className="loading">Loading data...</div>
      ) : (
        <div className="issue-container">
          <div className="issue-controls">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search equipment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="filter-controls">
              <div className="filter-group">
                <label>Filter by Soldier:</label>
                <select
                  value={filterBySoldier}
                  onChange={(e) => setFilterBySoldier(e.target.value)}
                >
                  <option value="all">All Soldiers</option>
                  {soldiers.map(soldier => (
                    <option key={soldier.id} value={soldier.id}>
                      {soldier.rank} {soldier.lastName}, {soldier.firstName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label>Filter by Status:</label>
                <select
                  value={filterByStatus}
                  onChange={(e) => setFilterByStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="OPERATIONAL">Operational</option>
                  <option value="MAINTENANCE_REQUIRED">Maintenance Required</option>
                  <option value="IN_MAINTENANCE">In Maintenance</option>
                  <option value="DEADLINED">Deadlined</option>
                  <option value="MISSING">Missing</option>
                </select>
              </div>
            </div>
            
            <div className="action-buttons">
              <button 
                className="primary-button"
                onClick={handleGeneratePdfs}
                disabled={selectedItems.length === 0 || generating}
              >
                {generating ? 'Generating...' : 'Generate Hand Receipts'}
              </button>
              
              {generatedPdfs.length > 0 && (
                <button 
                  className="secondary-button"
                  onClick={downloadAllPdfs}
                >
                  Download All Hand Receipts
                </button>
              )}
            </div>
          </div>
          
          <div className="equipment-list-container">
            <h2>Assigned Equipment</h2>
            
            {equipment.length === 0 ? (
              <p className="no-data-message">No assigned equipment found for this unit.</p>
            ) : (
              <div className="equipment-list">
                <div className="equipment-table">
                  <div className="equipment-table-header">
                    <div className="checkbox-cell">
                      <input 
                        type="checkbox" 
                        checked={filteredEquipment.length > 0 && 
                                filteredEquipment.every(item => selectedItems.some(selected => selected.id === item.id))}
                        onChange={() => {
                          // If all visible items are selected, deselect them
                          if (filteredEquipment.every(item => selectedItems.some(selected => selected.id === item.id))) {
                            // Remove all currently visible items from selection
                            setSelectedItems(selectedItems.filter(selected => 
                              !filteredEquipment.some(item => item.id === selected.id)
                            ));
                          } else {
                            // Add all currently visible items to selection
                            const visibleItemsToAdd = filteredEquipment.filter(item => 
                              !selectedItems.some(selected => selected.id === item.id) &&
                              // Don't select items that are on hand receipts
                              !(itemStatusMap[item.id] && itemStatusMap[item.id].status === 'HAND_RECEIPTED')
                            );
                            
                            setSelectedItems([...selectedItems, ...visibleItemsToAdd]);
                          }
                        }}
                      />
                    </div>
                    <div className="equipment-name">Item</div>
                    <div className="equipment-nsn">NSN</div>
                    <div className="equipment-serial">Serial #</div>
                    <div className="equipment-stock">Stock #</div>
                    <div className="equipment-soldier">Assigned To</div>
                    <div className="equipment-status">Status</div>
                  </div>
                  
                  {/* Groups section */}
                  {groups.map(group => {
                    const groupItems = getGroupItems(group.id);
                    const soldier = soldiersMap[group.assignedToID];
                    const isExpanded = expandedGroups[group.id];
                    
                    if (groupItems.length === 0) return null;
                    
                    // Check if any group items match the current filters
                    const hasVisibleItems = groupItems.some(item => 
                      (filterBySoldier === 'all' || item.assignedToID === filterBySoldier) &&
                      (filterByStatus === 'all' || item.maintenanceStatus === filterByStatus) &&
                      (searchTerm === '' || 
                        (masterItems[item.equipmentMasterID]?.commonName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.nsn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.stockNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
                      )
                    );
                    
                    if (!hasVisibleItems) return null;
                    
                    return (
                      <div key={group.id} className="equipment-group">
                        <div className="equipment-group-header" onClick={() => toggleGroupExpansion(group.id)}>
                          <div className="expand-icon">{isExpanded ? '▼' : '►'}</div>
                          <div className="group-name">{group.name}</div>
                          <div className="group-count">{groupItems.length} items</div>
                          <div className="group-assigned">
                            {soldier ? `${soldier.rank} ${soldier.lastName}, ${soldier.firstName}` : 'Unknown Soldier'}
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="equipment-group-items">
                            {groupItems.map(item => {
                              const masterData = masterItems[item.equipmentMasterID];
                              const isSelected = selectedItems.some(i => i.id === item.id);
                              
                              // Check if item matches the current filters
                              const matchesFilter = 
                                (filterBySoldier === 'all' || item.assignedToID === filterBySoldier) &&
                                (filterByStatus === 'all' || item.maintenanceStatus === filterByStatus) &&
                                (searchTerm === '' || 
                                  (masterData?.commonName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  item.nsn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (item.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (item.stockNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
                                );
                              
                              if (!matchesFilter) return null;
                              
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
                                      onChange={() => {}} // Handled by the row click
                                    />
                                  </div>
                                  <div className="equipment-name">{masterData ? masterData.commonName : `Item ${item.nsn}`}</div>
                                  <div className="equipment-nsn">{item.nsn}</div>
                                  <div className="equipment-serial">{item.serialNumber || '-'}</div>
                                  <div className="equipment-stock">{item.stockNumber || '-'}</div>
                                  <div className="equipment-soldier">
                                    {soldier ? `${soldier.rank} ${soldier.lastName}, ${soldier.firstName}` : '-'}
                                  </div>
                                  <div className="equipment-status">{item.maintenanceStatus || 'OPERATIONAL'}</div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Individual items not in groups */}
                  {filteredEquipment
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
                              onChange={() => {}} // Handled by the row click
                            />
                          </div>
                          <div className="equipment-name">{masterData ? masterData.commonName : `Item ${item.nsn}`}</div>
                          <div className="equipment-nsn">{item.nsn}</div>
                          <div className="equipment-serial">{item.serialNumber || '-'}</div>
                          <div className="equipment-stock">{item.stockNumber || '-'}</div>
                          <div className="equipment-soldier">
                            {soldier ? `${soldier.rank} ${soldier.lastName}, ${soldier.firstName}` : '-'}
                          </div>
                          <div className="equipment-status">{item.maintenanceStatus || 'OPERATIONAL'}</div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            )}
          </div>
          
          {generatedPdfs.length > 0 && (
            <div className="generated-pdfs">
              <h2>Generated Hand Receipts</h2>
              <div className="pdf-list">
                {generatedPdfs.map((pdf, index) => {
                  const receiptState = receiptActions[pdf.name] || {};
                  const isDownloaded = receiptState.downloaded;
                  const isIssued = receiptState.issued;

                  return (
                    <div key={index} className="pdf-item">
                      <div className="pdf-name">{pdf.name}</div>
                      <div className="pdf-actions">
                        <button 
                          className="download-button"
                          onClick={() => handleDownloadPdf(pdf)}
                        >
                          Download
                        </button>
                        
                        <button 
                          className={`issue-button ${isDownloaded && !isIssued ? 'active' : ''}`}
                          onClick={() => handleMarkItemsIssued(pdf)}
                          disabled={!isDownloaded || isIssued || processingAction}
                        >
                          Items Issued
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Add Active Hand Receipts component */}
          <ActiveHandReceipts 
            activeHandReceipts={activeHandReceipts}
            onViewPdf={handleViewActivePdf}
            onReturnItems={returnHandReceipt}
            onReturnSingleItem={returnHandReceiptItem}
            processingAction={processingAction}
          />
        </div>
      )}
    </div>
  );
}

export default Issue; 