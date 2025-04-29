import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';

/**
 * Utility to fix missing assignedToID attributes in DynamoDB
 * 
 * This script:
 * 1. Fetches all equipment items for the user's UIC
 * 2. Checks if each item has the assignedToID attribute
 * 3. Updates any item missing the attribute by setting it to null
 */
const FixMissingAttributes = {
  /**
   * Run the attribute fix process
   * @param {Object} options - Configuration options
   * @param {boolean} options.forceFixAll - Whether to update all items regardless of attribute presence
   * @param {Function} options.onProgress - Progress callback (percent, message)
   * @param {Function} options.onComplete - Completion callback (success, items, errors)
   * @param {Function} options.onError - Error callback (error)
   */
  async run({ forceFixAll = false, onProgress = () => {}, onComplete = () => {}, onError = () => {} }) {
    try {
      const client = generateClient();
      
      // Update progress
      onProgress(0, 'Authenticating user...');
      
      // Get the current user's UIC
      const { username } = await getCurrentUser();
      const userResponse = await client.graphql({
        query: `query GetUserByOwner($owner: String!) {
          usersByOwner(owner: $owner, limit: 1) {
            items {
              id
              uicID
              uic {
                uicCode
              }
            }
          }
        }`,
        variables: { owner: username }
      });
      
      const userData = userResponse.data.usersByOwner.items[0];
      if (!userData || !userData.uicID) {
        throw new Error('You must be assigned to a UIC to run this utility');
      }
      
      const uicID = userData.uicID;
      const uicCode = userData.uic?.uicCode || 'Unknown';
      
      onProgress(10, `Found UIC ${uicCode}, fetching equipment items...`);
      
      // Get detailed equipment items with all required fields
      const equipmentResponse = await client.graphql({
        query: `query GetAllEquipmentItemsDetailed($uicID: ID!) {
          equipmentItemsByUicID(
            uicID: $uicID,
            limit: 1000
          ) {
            items {
              id
              nsn
              lin
              serialNumber
              stockNumber
              location
              uicID
              equipmentMasterID
              maintenanceStatus
              isPartOfGroup
              groupID
              assignedToID
              createdAt
              updatedAt
              _version
              _lastChangedAt
              _deleted
            }
          }
        }`,
        variables: { uicID }
      });
      
      const items = equipmentResponse.data.equipmentItemsByUicID.items;
      
      onProgress(20, `Found ${items.length} equipment items. Running diagnostic scan...`);
      
      // Log diagnostic information about the items
      console.log("Item diagnostic sample:", items.slice(0, 2));
      console.log("Items with missing assignedToID:", items.filter(item => !('assignedToID' in item)).length);
      console.log("Items with undefined assignedToID:", items.filter(item => 'assignedToID' in item && item.assignedToID === undefined).length);
      console.log("Items with null assignedToID:", items.filter(item => 'assignedToID' in item && item.assignedToID === null).length);
      
      // Choose which items to update based on forceFixAll setting
      let itemsToFix = forceFixAll 
        ? items // Fix all items if forced
        : items.filter(item => !('assignedToID' in item) || item.assignedToID === undefined);
      
      if (itemsToFix.length === 0 && !forceFixAll) {
        onProgress(100, 'No items found with missing attributes. All items are correctly configured.');
        onComplete(true, [], []);
        return;
      }
      
      const itemCount = itemsToFix.length;
      onProgress(30, `${forceFixAll ? 'Force updating' : 'Fixing'} ${itemCount} equipment items...`);
      
      // Process items in batches to avoid overwhelming the API
      const batchSize = 5;
      const results = {
        success: [],
        errors: []
      };
      
      let processedCount = 0;
      
      for (let i = 0; i < itemsToFix.length; i += batchSize) {
        const batch = itemsToFix.slice(i, i + batchSize);
        
        // Process this batch in parallel
        const batchPromises = batch.map(async (item) => {
          try {
            // Ensure we have all required fields in the update
            const updateInput = {
              id: item.id,
              _version: item._version,
              
              // Include all required fields from schema, preserving existing values
              uicID: item.uicID,
              equipmentMasterID: item.equipmentMasterID,
              nsn: item.nsn,
              lin: item.lin,
              
              // Include the field we want to ensure exists
              assignedToID: item.assignedToID !== undefined ? item.assignedToID : null,
              
              // Include other important fields to ensure they're preserved
              serialNumber: item.serialNumber || null,
              stockNumber: item.stockNumber || null,
              location: item.location || null,
              maintenanceStatus: item.maintenanceStatus || 'OPERATIONAL',
              isPartOfGroup: item.isPartOfGroup !== undefined ? item.isPartOfGroup : false,
              groupID: item.groupID || null
            };
            
            // First attempt at updating
            try {
              const updateResult = await client.graphql({
                query: `mutation UpdateEquipmentItemWithAllFields($input: UpdateEquipmentItemInput!) {
                  updateEquipmentItem(input: $input) {
                    id
                    nsn
                    lin
                    assignedToID
                    _version
                  }
                }`,
                variables: { input: updateInput }
              });
              
              return {
                id: item.id,
                nsn: item.nsn,
                serialNumber: item.serialNumber,
                result: updateResult.data.updateEquipmentItem
              };
            } catch (error) {
              console.error(`Error updating item ${item.id}:`, error);
              
              // If it's a version conflict, try to get the latest version and retry
              if (error.message && error.message.includes("ConflictUnhandled")) {
                console.log(`Version conflict for item ${item.id}, getting fresh version...`);
                
                // Get fresh item
                const freshItemResponse = await client.graphql({
                  query: `query GetEquipmentItem($id: ID!) {
                    getEquipmentItem(id: $id) {
                      id
                      nsn
                      lin
                      serialNumber
                      stockNumber
                      location
                      uicID
                      equipmentMasterID
                      maintenanceStatus
                      isPartOfGroup
                      groupID
                      assignedToID
                      createdAt
                      updatedAt
                      _version
                      _lastChangedAt
                      _deleted
                    }
                  }`,
                  variables: { id: item.id }
                });
                
                const freshItem = freshItemResponse.data.getEquipmentItem;
                if (!freshItem) {
                  throw new Error(`Item ${item.id} could not be found on retry`);
                }
                
                // Prepare updated input with fresh version
                const retryInput = {
                  ...updateInput,
                  _version: freshItem._version,
                  // Include any values from the fresh item that might have changed
                  uicID: freshItem.uicID,
                  equipmentMasterID: freshItem.equipmentMasterID,
                  nsn: freshItem.nsn,
                  lin: freshItem.lin,
                  // Set assignedToID appropriately
                  assignedToID: freshItem.assignedToID !== undefined ? freshItem.assignedToID : null
                };
                
                // Retry update with fresh version
                const retryResult = await client.graphql({
                  query: `mutation RetryUpdateEquipmentItem($input: UpdateEquipmentItemInput!) {
                    updateEquipmentItem(input: $input) {
                      id
                      nsn
                      lin
                      assignedToID
                      _version
                    }
                  }`,
                  variables: { input: retryInput }
                });
                
                return {
                  id: item.id,
                  nsn: item.nsn,
                  serialNumber: item.serialNumber,
                  result: retryResult.data.updateEquipmentItem,
                  wasRetry: true
                };
              }
              
              // If it's not a version conflict, rethrow the error
              throw error;
            }
          } catch (error) {
            console.error(`Final error updating item ${item.id}:`, error);
            throw {
              id: item.id,
              nsn: item.nsn || 'Unknown',
              serialNumber: item.serialNumber || 'N/A',
              error: error.message || 'Unknown error'
            };
          }
        });
        
        // Wait for all promises in this batch to complete, capturing success and errors
        const batchResults = await Promise.allSettled(batchPromises);
        
        // Process results from this batch
        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            results.success.push(result.value);
          } else {
            results.errors.push(result.reason);
          }
        });
        
        // Update progress
        processedCount += batch.length;
        const progressPercent = 30 + Math.round((processedCount / itemCount) * 70);
        onProgress(
          progressPercent,
          `Fixed ${processedCount} of ${itemCount} items (${results.errors.length} errors)`
        );
      }
      
      // Done!
      onProgress(
        100,
        `Process complete. Fixed ${results.success.length} items with ${results.errors.length} errors.`
      );
      onComplete(results.errors.length === 0, results.success, results.errors);
      
    } catch (error) {
      console.error('Error in fix missing attributes utility:', error);
      onError(error);
    }
  }
};

export default FixMissingAttributes; 