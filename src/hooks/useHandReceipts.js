import { useState, useEffect, useCallback, useRef } from 'react';
import { generateClient } from 'aws-amplify/api';
import { uploadData, getUrl } from 'aws-amplify/storage';

const client = generateClient(); // Define client outside of the hook if it's stable

/**
 * Custom hook for managing hand receipts
 */
const useHandReceipts = (uicID) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeHandReceipts, setActiveHandReceipts] = useState([]);
  const [processingAction, setProcessingAction] = useState(false);
  
  // Track if initial data has been loaded
  const initialLoadComplete = useRef(false);

  // Load active hand receipts - no dependencies to prevent polling
  const loadActiveHandReceipts = useCallback(async (currentUicID) => {
    if (!currentUicID) return;
    
    setLoading(true);
    try {
      // Query for hand receipt statuses that are ISSUED (not RETURNED)
      const response = await client.graphql({
        query: `query GetActiveHandReceipts($fromUIC: ID!, $status: HandReceiptStatusType!) {
          handReceiptStatusesByFromUIC(
            fromUIC: $fromUIC,
            filter: { status: { eq: $status } }
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
              soldier {
                id
                firstName
                lastName
                rank
              }
              equipmentItem {
                id
                nsn
                serialNumber
                stockNumber
                equipmentMasterID
                equipmentMaster {
                  commonName
                  description
                }
              }
              _version
            }
          }
        }`,
        variables: { 
          fromUIC: currentUicID,
          status: 'ISSUED'
        }
      });
      
      // Group hand receipt statuses by receipt number
      const statuses = response.data.handReceiptStatusesByFromUIC.items;
      const receiptMap = {};
      
      statuses.forEach(status => {
        if (!receiptMap[status.receiptNumber]) {
          receiptMap[status.receiptNumber] = {
            receiptNumber: status.receiptNumber,
            soldier: status.soldier,
            items: [],
            issuedOn: status.issuedOn,
            pdfS3Key: status.pdfS3Key
          };
        }
        
        if (status.equipmentItem) {
          receiptMap[status.receiptNumber].items.push({
            id: status.equipmentItem.id,
            nsn: status.equipmentItem.nsn,
            serialNumber: status.equipmentItem.serialNumber,
            stockNumber: status.equipmentItem.stockNumber,
            name: status.equipmentItem.equipmentMaster?.commonName || `Item ${status.equipmentItem.nsn}`,
            handReceiptStatusID: status.id,
            _version: status._version
          });
        }
      });
      
      const receipts = Object.values(receiptMap);
      setActiveHandReceipts(receipts);
      
      return receipts;
    } catch (err) {
      console.error("Error loading active hand receipts:", err);
      setError("Failed to load active hand receipts");
      return [];
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies, will be stable

  // Download a hand receipt PDF
  const getHandReceiptPdf = async (pdfS3Key) => {
    try {
      const result = await getUrl({
        key: pdfS3Key
      });
      
      return result.url.toString();
    } catch (err) {
      console.error("Error getting hand receipt PDF:", err);
      setError("Failed to download hand receipt");
      return null;
    }
  };

  // Return all items on a hand receipt
  const returnHandReceipt = async (receipt) => {
    if (!receipt || !receipt.items || receipt.items.length === 0) {
      setError("No items to return");
      return;
    }
    
    setProcessingAction(true);
    setError('');
    
    try {
      // Update HandReceiptStatus records for each item
      for (const item of receipt.items) {
        try {
          const statusResponse = await client.graphql({
            query: `query GetHandReceiptStatus($id: ID!) {
              getHandReceiptStatus(id: $id) {
                id
                status
                _version
              }
            }`,
            variables: {
              id: item.handReceiptStatusID
            }
          });
          
          const statusRecord = statusResponse.data.getHandReceiptStatus;
          
          if (!statusRecord || statusRecord.status !== 'ISSUED') {
            console.warn(`Item ${item.id} is not currently issued or status record not found`);
            continue;
          }
          
          // Update the status record
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
                id: item.handReceiptStatusID,
                status: 'RETURNED',
                returnedOn: new Date().toISOString(),
                _version: statusRecord._version
              }
            }
          });
        } catch (err) {
          console.error(`Error updating HandReceiptStatus for item ${item.id}:`, err);
        }
      }
      
      // This is an explicit action, so refresh active hand receipts
      if (uicID) {
        await loadActiveHandReceipts(uicID);
      }
      
      setSuccess(`${receipt.items.length} items have been returned from hand receipt ${receipt.receiptNumber}.`);
      return true;
    } catch (err) {
      console.error("Error returning hand receipt:", err);
      setError("Failed to return items");
      return false;
    } finally {
      setProcessingAction(false);
    }
  };

  // Return individual items
  const returnHandReceiptItem = async (receiptNumber, item) => {
    if (!item || !item.handReceiptStatusID) {
      setError("Invalid item to return");
      return;
    }
    
    setProcessingAction(true);
    setError('');
    
    try {
      // Get the status record
      const statusResponse = await client.graphql({
        query: `query GetHandReceiptStatus($id: ID!) {
          getHandReceiptStatus(id: $id) {
            id
            status
            _version
          }
        }`,
        variables: {
          id: item.handReceiptStatusID
        }
      });
      
      const statusRecord = statusResponse.data.getHandReceiptStatus;
      
      if (!statusRecord || statusRecord.status !== 'ISSUED') {
        setError(`Item is not currently issued or status record not found`);
        return false;
      }
      
      // Update the status record
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
            id: item.handReceiptStatusID,
            status: 'RETURNED',
            returnedOn: new Date().toISOString(),
            _version: statusRecord._version
          }
        }
      });
      
      // This is an explicit action, so refresh active hand receipts
      if (uicID) {
        await loadActiveHandReceipts(uicID);
      }
      
      setSuccess(`Item ${item.name || item.nsn} has been returned from hand receipt ${receiptNumber}.`);
      return true;
    } catch (err) {
      console.error("Error returning hand receipt item:", err);
      setError("Failed to return item");
      return false;
    } finally {
      setProcessingAction(false);
    }
  };

  // Only load data once on mount or uicID change
  useEffect(() => {
    if (uicID && !initialLoadComplete.current) {
      loadActiveHandReceipts(uicID);
      initialLoadComplete.current = true;
    }
  }, [uicID, loadActiveHandReceipts]);

  return {
    loading,
    error,
    success,
    setError,
    setSuccess,
    activeHandReceipts,
    processingAction,
    loadActiveHandReceipts,
    getHandReceiptPdf,
    returnHandReceipt,
    returnHandReceiptItem
  };
};

export default useHandReceipts; 