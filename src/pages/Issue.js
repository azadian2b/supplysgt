import React, { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { uploadData, getUrl } from 'aws-amplify/storage';
import { PDFDocument } from 'pdf-lib';
import './Pages.css';
import './Issue.css';

function Issue() {
  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uicID, setUicID] = useState(null);
  const [uicCode, setUicCode] = useState('');
  const [uicName, setUicName] = useState('');
  const [equipment, setEquipment] = useState([]);
  const [soldiers, setSoldiers] = useState([]);
  const [soldiersMap, setSoldiersMap] = useState({});
  const [groups, setGroups] = useState([]);
  const [groupsMap, setGroupsMap] = useState({});
  const [masterItems, setMasterItems] = useState({});
  
  // Selection state
  const [selectedItems, setSelectedItems] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBySoldier, setFilterBySoldier] = useState('all');
  const [filterByStatus, setFilterByStatus] = useState('all');
  
  // PDF generation state
  const [generatedPdfs, setGeneratedPdfs] = useState([]);
  const [generating, setGenerating] = useState(false);
  
  // Hand Receipt Status tracking
  const [itemStatusMap, setItemStatusMap] = useState({}); // Maps item ID to its current hand receipt status
  const [receiptActions, setReceiptActions] = useState({}); // Tracks which receipts have been downloaded/issued/returned
  const [processingAction, setProcessingAction] = useState(false);
  
  const client = generateClient();

  // Load data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

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
      
      // Load assigned equipment, soldiers, and groups in parallel
      await Promise.all([
        loadAssignedEquipment(uic.id),
        loadSoldiers(uic.id),
        loadEquipmentGroups(uic.id),
        loadHandReceiptStatuses(uic.id)
      ]);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to load data. Please try again.');
      setLoading(false);
    }
  };

  // Load equipment items that are assigned to soldiers
  const loadAssignedEquipment = async (uicId) => {
    try {
      // Query for equipment items that have assignedToID
      const equipmentResponse = await client.graphql({
        query: `query GetAssignedEquipmentItemsByUIC($uicID: ID!) {
          equipmentItemsByUicID(
            uicID: $uicID,
            filter: { 
              assignedToID: { attributeExists: true },
              _deleted: { ne: true }
            }
          ) {
            items {
              id
              nsn
              lin
              serialNumber
              stockNumber
              location
              assignedToID
              groupID
              isPartOfGroup
              maintenanceStatus
              equipmentMasterID
              _version
            }
          }
        }`,
        variables: { uicID: uicId }
      });
      
      const items = equipmentResponse.data.equipmentItemsByUicID.items;
      
      // Get master equipment data for item details
      const masterIds = [...new Set(items.map(item => item.equipmentMasterID))];
      const masterItemsMap = {};
      
      for (const masterId of masterIds) {
        try {
          const masterResponse = await client.graphql({
            query: `query GetEquipmentMaster($id: ID!) {
              getEquipmentMaster(id: $id) {
                id
                nsn
                commonName
                description
              }
            }`,
            variables: { id: masterId }
          });
          
          const masterData = masterResponse.data.getEquipmentMaster;
          if (masterData) {
            masterItemsMap[masterId] = masterData;
          }
        } catch (err) {
          console.error(`Error fetching master data for ${masterId}:`, err);
        }
      }
      
      setMasterItems(masterItemsMap);
      setEquipment(items);
      
      return items;
    } catch (error) {
      console.error('Error loading assigned equipment:', error);
      throw error;
    }
  };

  // Load soldiers for the UIC
  const loadSoldiers = async (uicId) => {
    try {
      const soldiersResponse = await client.graphql({
        query: `query GetSoldiersByUIC($uicID: ID!) {
          soldiersByUicID(uicID: $uicID) {
            items {
              id
              firstName
              lastName
              rank
              role
              hasAccount
            }
          }
        }`,
        variables: { uicID: uicId }
      });
      
      const soldiersList = soldiersResponse.data.soldiersByUicID.items;
      
      // Create a map for quick lookup
      const soldiersMapObj = {};
      soldiersList.forEach(soldier => {
        soldiersMapObj[soldier.id] = soldier;
      });
      
      setSoldiers(soldiersList);
      setSoldiersMap(soldiersMapObj);
      
      return soldiersList;
    } catch (error) {
      console.error('Error loading soldiers:', error);
      throw error;
    }
  };

  // Load equipment groups
  const loadEquipmentGroups = async (uicId) => {
    try {
      const groupsResponse = await client.graphql({
        query: `query GetEquipmentGroupsByUIC($uicID: ID!) {
          equipmentGroupsByUicID(
            uicID: $uicID,
            filter: {
              assignedToID: { attributeExists: true },
              _deleted: { ne: true }
            }
          ) {
            items {
              id
              name
              description
              assignedToID
              _version
            }
          }
        }`,
        variables: { uicID: uicId }
      });
      
      const groupsList = groupsResponse.data.equipmentGroupsByUicID.items;
      
      // Create a map for quick lookup
      const groupsMapObj = {};
      groupsList.forEach(group => {
        groupsMapObj[group.id] = group;
      });
      
      setGroups(groupsList);
      setGroupsMap(groupsMapObj);
      
      return groupsList;
    } catch (error) {
      console.error('Error loading equipment groups:', error);
      throw error;
    }
  };

  // Toggle selection of an item
  const toggleItemSelection = (item) => {
    // Check if this item is already on a hand receipt
    if (itemStatusMap[item.id] && itemStatusMap[item.id].status === 'HAND_RECEIPTED') {
      setError(`This item is currently on hand receipt ${itemStatusMap[item.id].receiptNumber} and cannot be selected.`);
      return;
    }
    
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

  // Filter equipment based on search and filters
  const filteredEquipment = equipment.filter(item => {
    const inSearchTerm = searchTerm === '' ||
      (masterItems[item.equipmentMasterID]?.commonName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nsn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.stockNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by soldier
    const matchesSoldierFilter = filterBySoldier === 'all' || item.assignedToID === filterBySoldier;
    
    // Filter by maintenance status
    const matchesStatusFilter = filterByStatus === 'all' || item.maintenanceStatus === filterByStatus;
    
    return inSearchTerm && matchesSoldierFilter && matchesStatusFilter;
  });

  // Get group items
  const getGroupItems = (groupId) => {
    return equipment.filter(item => item.groupID === groupId);
  };

  // Format item description for 2062 form
  const formatItemDescription = (item) => {
    const masterData = masterItems[item.equipmentMasterID];
    const name = masterData?.commonName || `Item ${item.nsn}`;
    const serialPart = item.serialNumber ? `:${item.serialNumber}` : '';
    const stockPart = item.stockNumber ? ` - ${item.stockNumber}` : '';
    
    return `${name}${serialPart}${stockPart}`;
  };

  // Generate the hand receipt number
  const generateHandReceiptNumber = (soldier) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    const dateStr = `${year}${month}${day}`;
    const lastName = soldier.lastName.substring(0, 3).toUpperCase();
    const firstName = soldier.firstName.substring(0, 1).toUpperCase();
    
    return `${dateStr}${lastName}${firstName}`;
  };

  // Generate 2062 PDF for a given soldier and their equipment
  const generate2062Pdf = async (soldier, soldierItems) => {
    try {
      // Load the existing fillable PDF form
      const formUrl = `${process.env.PUBLIC_URL}/DA Form 2062.pdf`;
      const formBytes = await fetch(formUrl).then(res => res.arrayBuffer());
      
      // Load the PDF document, ignoring potential encryption
      const pdfDoc = await PDFDocument.load(formBytes, { 
        ignoreEncryption: true 
      });
      
      // Get the form from the document
      const form = pdfDoc.getForm();
      
      // Generate hand receipt number
      const receiptNumber = generateHandReceiptNumber(soldier);
      
      // Fill form fields
      // Main fields
      form.getTextField('form1[0].Page1[0].FROM[0]').setText(`${uicCode} - ${uicName}`);
      form.getTextField('form1[0].Page1[0].TO[0]').setText(`${soldier.rank} ${soldier.lastName}, ${soldier.firstName}`);
      form.getTextField('form1[0].Page1[0].RECPTNR[0]').setText(receiptNumber);
      
      // Item fields
      const maxItemsPerPage = 16; // Based on the form layout
      
      // ---- Group non-serialized, non-stock-numbered items ----
      const groupedItems = {};
      const individualItems = [];
      
      soldierItems.forEach(item => {
        if (!item.serialNumber && !item.stockNumber) {
          // Potentially groupable item
          const key = item.equipmentMasterID;
          if (!groupedItems[key]) {
            groupedItems[key] = {
              ...item, // Use first item as template
              quantity: 0
            };
          }
          groupedItems[key].quantity += 1;
        } else {
          // Individual item (serialized or has stock number)
          individualItems.push({ ...item, quantity: 1 });
        }
      });
      
      // Combine grouped and individual items into the final list for the form
      const formItems = [...Object.values(groupedItems), ...individualItems];
      // Sort for consistent order if needed (optional)
      formItems.sort((a, b) => (a.nsn || '').localeCompare(b.nsn || ''));
      
      // ---- Process items for the form ----
      formItems.forEach((item, index) => {
        // Determine if we're on the first page or need to use overflow fields
        const fieldSuffix = index === 0 ? '' : `_${index}`;
        
        // Account for page overflow
        if (index >= maxItemsPerPage) {
          console.log(`Warning: More than ${maxItemsPerPage} items, some may not fit on the form`);
          // We could handle this by creating additional form pages if needed
          return; // Skip items beyond first page for now
        }
        
        // Fill item fields
        // Stock number (NSN)
        form.getTextField(`form1[0].Page1[0].STOCKNRA${fieldSuffix}[0]`).setText(item.nsn);
        
        // Item description - Set smaller font size
        const description = formatItemDescription(item);
        const descriptionField = form.getTextField(`form1[0].Page1[0].ITEMDESA${fieldSuffix}[0]`);
        descriptionField.setFontSize(8); // Set font size to 8pt
        descriptionField.setText(description);
        
        // Unit of issue
        form.getTextField(`form1[0].Page1[0].UIA${fieldSuffix}[0]`).setText('ea');
        
        // Quantity - Use the calculated quantity
        form.getTextField(`form1[0].Page1[0].QTYAA${fieldSuffix}[0]`).setText(item.quantity.toString());
        //just set quantity authorized to quantity
        form.getTextField(`form1[0].Page1[0].QTYAUTHA${fieldSuffix}[0]`).setText(item.quantity.toString());
      });
      
      // Flatten the form (optional, makes it non-editable)
      form.flatten();
      
      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      
      // Convert to data URL for download
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const dataUrl = URL.createObjectURL(blob);
      
      return {
        name: `${receiptNumber}_${soldier.lastName}_${soldier.firstName}.pdf`,
        dataUrl: dataUrl,
        blob: blob
      };
    } catch (error) {
      console.error('Error generating PDF for soldier:', soldier.id, error);
      throw error;
    }
  };

  // Generate all 2062 PDFs for selected equipment
  const generatePdfs = async () => {
    try {
      if (selectedItems.length === 0) {
        setError('Please select at least one item to generate hand receipts.');
        return;
      }
      
      setGenerating(true);
      setError('');
      setSuccess('');
      
      // Group selected items by soldier
      const itemsBySoldier = {};
      
      selectedItems.forEach(item => {
        if (!itemsBySoldier[item.assignedToID]) {
          itemsBySoldier[item.assignedToID] = [];
        }
        itemsBySoldier[item.assignedToID].push(item);
      });
      
      // Generate a PDF for each soldier
      const pdfFiles = [];
      
      for (const soldierId in itemsBySoldier) {
        const soldier = soldiersMap[soldierId];
        if (!soldier) continue;
        
        const items = itemsBySoldier[soldierId];
        // Note: generate2062Pdf is now async
        const pdfFile = await generate2062Pdf(soldier, items);
        pdfFiles.push(pdfFile);
      }
      
      setGeneratedPdfs(pdfFiles);
      setSuccess(`Generated ${pdfFiles.length} hand receipt${pdfFiles.length !== 1 ? 's' : ''}.`);
    } catch (error) {
      console.error('Error generating PDFs:', error);
      setError('Failed to generate hand receipts. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Download a specific PDF
  const downloadPdf = (pdfFile) => {
    const link = document.createElement('a');
    link.href = pdfFile.dataUrl;
    link.download = pdfFile.name;
    link.click();
    
    // Mark this PDF as downloaded so the Items Issued button can be enabled
    setReceiptActions(prev => ({
      ...prev,
      [pdfFile.name]: { ...prev[pdfFile.name], downloaded: true }
    }));
  };

  // Download all generated PDFs as a ZIP file
  const downloadAllPdfs = async () => {
    try {
      if (generatedPdfs.length === 0) {
        setError('No hand receipts have been generated yet.');
        return;
      }
      
      // For a small number of PDFs, download them individually
      if (generatedPdfs.length <= 3) {
        generatedPdfs.forEach(pdf => downloadPdf(pdf));
        return;
      }
      
      // For larger numbers, it would be better to use JSZip 
      // but for simplicity we'll just download them individually
      generatedPdfs.forEach(pdf => downloadPdf(pdf));
    } catch (error) {
      console.error('Error downloading PDFs:', error);
      setError('Failed to download hand receipts. Please try again.');
    }
  };

  // Upload PDF to S3 and return the key
  const uploadPdfToS3 = async (pdfFile) => {
    try {
      const key = `hand-receipts/${pdfFile.name}`;
      
      // Upload the PDF to S3
      await uploadData({
        key,
        data: pdfFile.blob,
        options: {
          contentType: 'application/pdf'
        }
      });
      
      return key;
    } catch (error) {
      console.error('Error uploading PDF to S3:', error);
      throw error;
    }
  };
  
  // Get hand receipt items (both individual items and grouped items)
  const getHandReceiptItems = (pdfFile) => {
    // Find the soldier by looking at PDF filename
    // Format: YYYYMMDDLASF.pdf (where LAS=3 chars of last name, F=first char of first name)
    const nameParts = pdfFile.name.split('_');
    const receiptNumber = nameParts[0];
    
    // Find all selected items for this soldier's receipt 
    const soldierId = Object.keys(soldiersMap).find(id => {
      const soldier = soldiersMap[id];
      const lastName = soldier.lastName.substring(0, 3).toUpperCase();
      const firstName = soldier.firstName.substring(0, 1).toUpperCase();
      return receiptNumber.endsWith(`${lastName}${firstName}`);
    });
    
    if (!soldierId) return [];
    
    return selectedItems.filter(item => item.assignedToID === soldierId);
  };
  
  // Mark items as issued (create HandReceiptStatus records)
  const handleMarkItemsIssued = async (pdfFile) => {
    try {
      setProcessingAction(true);
      setError('');
      
      const items = getHandReceiptItems(pdfFile);
      if (items.length === 0) {
        setError('Could not find items for this receipt.');
        return;
      }
      
      // Upload PDF to S3 first
      const s3Key = await uploadPdfToS3(pdfFile);
      
      // Extract receipt number from filename
      const receiptNumber = pdfFile.name.split('_')[0];
      
      // Find the soldier ID
      const soldierId = items[0].assignedToID;
      
      // Create HandReceiptStatus records for each item
      for (const item of items) {
        try {
          // Create or update the HandReceiptStatus record
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
                receiptNumber,
                status: 'ISSUED',
                fromUIC: uicID,
                toSoldierID: soldierId, 
                equipmentItemID: item.id,
                issuedOn: new Date().toISOString(),
                pdfS3Key: s3Key
              }
            }
          });
          
          // Update local item status map
          setItemStatusMap(prev => ({
            ...prev,
            [item.id]: {
              status: 'HAND_RECEIPTED',
              receiptNumber,
              soldierId
            }
          }));
        } catch (error) {
          console.error(`Error creating HandReceiptStatus for item ${item.id}:`, error);
        }
      }
      
      // Mark this receipt as issued
      setReceiptActions(prev => ({
        ...prev,
        [pdfFile.name]: { ...prev[pdfFile.name], issued: true }
      }));
      
      setSuccess(`${items.length} items have been issued and locked on hand receipt ${receiptNumber}.`);
    } catch (error) {
      console.error('Error marking items as issued:', error);
      setError('Failed to issue items. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  };
  
  // Mark items as returned (update HandReceiptStatus records)
  const handleMarkItemsReturned = async (pdfFile) => {
    try {
      setProcessingAction(true);
      setError('');
      
      const items = getHandReceiptItems(pdfFile);
      if (items.length === 0) {
        setError('Could not find items for this receipt.');
        return;
      }
      
      // Extract receipt number from filename
      const receiptNumber = pdfFile.name.split('_')[0];
      
      // Update HandReceiptStatus records for each item
      for (const item of items) {
        try {
          // First, get the existing HandReceiptStatus record
          const getStatusResponse = await client.graphql({
            query: `query GetHandReceiptStatusByItemAndReceipt($receiptNumber: String!, $equipmentItemID: ID!) {
              handReceiptStatusByReceiptNumber(receiptNumber: $receiptNumber) {
                items {
                  id
                  receiptNumber
                  status
                  equipmentItemID
                  _version
                }
              }
            }`,
            variables: {
              receiptNumber,
              equipmentItemID: item.id
            }
          });
          
          const statusRecords = getStatusResponse.data.handReceiptStatusByReceiptNumber.items
            .filter(record => record.equipmentItemID === item.id && record.status === 'ISSUED');
          
          if (statusRecords.length === 0) {
            console.warn(`No active HandReceiptStatus found for item ${item.id} on receipt ${receiptNumber}`);
            continue;
          }
          
          // Update the status record
          const statusRecord = statusRecords[0];
          await client.graphql({
            query: `mutation UpdateHandReceiptStatus($input: UpdateHandReceiptStatusInput!) {
              updateHandReceiptStatus(input: $input) {
                id
                receiptNumber
                status
                returnedOn
              }
            }`,
            variables: {
              input: {
                id: statusRecord.id,
                status: 'RETURNED',
                returnedOn: new Date().toISOString(),
                _version: statusRecord._version
              }
            }
          });
          
          // Update local item status map
          setItemStatusMap(prev => ({
            ...prev,
            [item.id]: null // Remove status to indicate item is no longer on hand receipt
          }));
        } catch (error) {
          console.error(`Error updating HandReceiptStatus for item ${item.id}:`, error);
        }
      }
      
      // Mark this receipt as returned
      setReceiptActions(prev => ({
        ...prev,
        [pdfFile.name]: { ...prev[pdfFile.name], returned: true }
      }));
      
      setSuccess(`${items.length} items have been returned and released from hand receipt ${receiptNumber}.`);
    } catch (error) {
      console.error('Error marking items as returned:', error);
      setError('Failed to return items. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  };

  // Add this function to load existing hand receipt statuses
  const loadHandReceiptStatuses = async (uicId) => {
    try {
      // Define the query to accept a filter variable
      const query = `query GetHandReceiptStatusesByUIC(
        $fromUIC: ID!, 
        $filter: ModelHandReceiptStatusFilterInput
      ) {
        handReceiptStatusesByFromUIC(
          fromUIC: $fromUIC,
          filter: $filter
        ) {
          items {
            id
            receiptNumber
            status
            fromUIC
            toSoldierID
            equipmentItemID
            issuedOn
            pdfS3Key
          }
        }
      }`;
      
      // Define the filter object separately
      const filter = {
        status: { ne: "RETURNED" } // GraphQL client will handle enum conversion here
      };
      
      // Pass filter in the variables object
      const response = await client.graphql({
        query,
        variables: { 
          fromUIC: uicId, 
          filter: filter 
        }
      });
      
      const statusRecords = response.data.handReceiptStatusesByFromUIC.items;
      
      // Build item status map
      const statusMap = {};
      const actionsMap = {};
      
      statusRecords.forEach(record => {
        // Add to item status map for locking items
        if (record.status === 'ISSUED') {
          statusMap[record.equipmentItemID] = {
            status: 'HAND_RECEIPTED',
            receiptNumber: record.receiptNumber,
            soldierId: record.toSoldierID
          };
          
          // Track receipt actions status
          const soldier = soldiersMap[record.toSoldierID];
          if (soldier) {
            const lastName = soldier.lastName;
            const firstName = soldier.firstName;
            const pdfName = `${record.receiptNumber}_${lastName}_${firstName}.pdf`;
            
            // Mark the receipt as downloaded and issued since it's already in the system
            actionsMap[pdfName] = {
              downloaded: true,
              issued: true,
              returned: false
            };
          }
        }
      });
      
      setItemStatusMap(statusMap);
      setReceiptActions(actionsMap);
      
      return statusRecords;
    } catch (error) {
      console.error('Error loading hand receipt statuses:', error);
      return [];
    }
  };

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
                onClick={generatePdfs}
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
                    <div className="checkbox-cell"></div>
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
                  const isReturned = receiptState.returned;

                  return (
                    <div key={index} className="pdf-item">
                      <div className="pdf-name">{pdf.name}</div>
                      <div className="pdf-actions">
                        <button 
                          className="download-button"
                          onClick={() => downloadPdf(pdf)}
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
                        
                        <button 
                          className={`return-button ${isIssued && !isReturned ? 'active' : ''}`}
                          onClick={() => handleMarkItemsReturned(pdf)}
                          disabled={!isIssued || isReturned || processingAction}
                        >
                          Items Returned
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Issue; 