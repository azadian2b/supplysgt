import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import './DataInspector.css';

/**
 * Utility component to inspect and debug Amplify data issues
 */
function DataInspector() {
  const [indexedDBData, setIndexedDBData] = useState(null);
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const client = generateClient();

  // Function to scan all available IndexedDB databases
  const scanIndexedDB = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get list of all IndexedDB databases
      const databases = await window.indexedDB.databases();
      console.log('Available IndexedDB databases:', databases);
      
      // Look for Amplify-related databases
      const amplifyDatabases = databases.filter(db => 
        db.name.includes('amplify') || 
        db.name.includes('DataStore')
      );
      
      if (amplifyDatabases.length === 0) {
        setError('No Amplify databases found in IndexedDB');
        setLoading(false);
        return;
      }
      
      // Extract data from each database
      const dbData = {};
      
      for (const dbInfo of amplifyDatabases) {
        const dbName = dbInfo.name;
        dbData[dbName] = { stores: {} };
        
        // Open the database
        const dbOpenRequest = indexedDB.open(dbName);
        
        await new Promise((resolve, reject) => {
          dbOpenRequest.onerror = (event) => {
            console.error(`Error opening ${dbName}:`, event);
            reject(`Error opening ${dbName}`);
          };
          
          dbOpenRequest.onsuccess = async (event) => {
            const db = event.target.result;
            const storeNames = Array.from(db.objectStoreNames);
            
            // Load data from each object store
            for (const storeName of storeNames) {
              try {
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                
                // Get all records from this store
                const storeData = await new Promise((resolveStore, rejectStore) => {
                  const request = store.getAll();
                  
                  request.onerror = (e) => rejectStore(`Error reading ${storeName}`);
                  request.onsuccess = (e) => resolveStore(e.target.result);
                });
                
                dbData[dbName].stores[storeName] = storeData;
              } catch (storeError) {
                console.error(`Error reading store ${storeName}:`, storeError);
                dbData[dbName].stores[storeName] = { error: storeError.message };
              }
            }
            
            resolve();
          };
        });
      }
      
      setIndexedDBData(dbData);
      console.log('IndexedDB data:', dbData);
    } catch (error) {
      console.error('Error scanning IndexedDB:', error);
      setError(`Error scanning IndexedDB: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to fetch equipment items directly from API
  const fetchDirectFromAPI = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user's UIC
      const userResponse = await client.graphql({
        query: `query GetCurrentUser {
          usersByOwner(owner: "current", limit: 1) {
            items {
              id
              uicID
            }
          }
        }`
      });
      
      const userData = userResponse.data.usersByOwner.items[0];
      if (!userData) {
        setError('No user data found');
        setLoading(false);
        return;
      }
      
      // Fetch equipment items for this UIC - with ALL fields
      const equipmentResponse = await client.graphql({
        query: `query GetEquipmentByUIC($uicID: ID!) {
          equipmentItemsByUicID(uicID: $uicID) {
            items {
              id
              uicID
              equipmentMasterID
              nsn
              lin
              serialNumber
              stockNumber
              location
              maintenanceStatus
              isPartOfGroup
              groupID
              createdAt
              updatedAt
              _version
              _deleted
              _lastChangedAt
              __typename
            }
          }
        }`,
        variables: { uicID: userData.uicID }
      });
      
      const items = equipmentResponse.data.equipmentItemsByUicID.items;
      
      // Fetch DynamoDB direct info
      const region = (window.aws_config || {}).region || 'us-east-1';
      const tableName = 'EquipmentItem-' + (window.aws_config || {}).projectSuffix || 'unknown';
      
      setApiData({
        uicID: userData.uicID,
        itemCount: items.length,
        items,
        dynamoDBInfo: {
          region,
          tableName,
          url: `https://${region}.console.aws.amazon.com/dynamodb/home?region=${region}#tables:selected=${tableName}`
        }
      });
      
      console.log('API data:', items);
    } catch (error) {
      console.error('Error fetching from API:', error);
      setError(`Error fetching from API: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // New function to check for soft-deleted items
  const checkForSoftDeletedItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user's UIC
      const userResponse = await client.graphql({
        query: `query GetCurrentUser {
          usersByOwner(owner: "current", limit: 1) {
            items {
              id
              uicID
            }
          }
        }`
      });
      
      const userData = userResponse.data.usersByOwner.items[0];
      if (!userData) {
        setError('No user data found');
        setLoading(false);
        return;
      }
      
      // Fetch ALL equipment items for this UIC including "deleted" ones
      const equipmentResponse = await client.graphql({
        query: `query GetEquipmentByUIC($uicID: ID!) {
          equipmentItemsByUicID(uicID: $uicID) {
            items {
              id
              nsn
              lin
              serialNumber
              _version
              _lastChangedAt
              _deleted
              createdAt
              updatedAt
            }
          }
        }`,
        variables: { uicID: userData.uicID }
      });
      
      const allItems = equipmentResponse.data.equipmentItemsByUicID.items;
      const deletedItems = allItems.filter(item => item._deleted);
      const activeItems = allItems.filter(item => !item._deleted);
      
      // Look for duplicate serial numbers
      const serialNumberGroups = {};
      activeItems.forEach(item => {
        if (item.serialNumber) {
          const key = `${item.nsn}|${item.serialNumber}`;
          if (!serialNumberGroups[key]) {
            serialNumberGroups[key] = [];
          }
          serialNumberGroups[key].push(item);
        }
      });
      
      // Find groups with duplicates
      const duplicateGroups = Object.entries(serialNumberGroups)
        .filter(([key, items]) => items.length > 1)
        .map(([key, items]) => ({
          key,
          items: items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        }));
      
      setApiData({
        uicID: userData.uicID,
        totalItems: allItems.length,
        activeItems: activeItems.length,
        deletedItems: deletedItems.length,
        duplicateGroups: duplicateGroups.length,
        items: {
          deleted: deletedItems,
          duplicates: duplicateGroups
        }
      });
      
      console.log('Deleted & duplicate analysis:', {
        totalItems: allItems.length,
        activeItems: activeItems.length,
        deletedItems: deletedItems.length,
        duplicateGroups: duplicateGroups.length,
        deleted: deletedItems,
        duplicates: duplicateGroups
      });
    } catch (error) {
      console.error('Error checking for deleted items:', error);
      setError(`Error checking for deleted items: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to clear IndexedDB
  const clearIndexedDB = async (dbName = null) => {
    try {
      if (!window.confirm(dbName 
        ? `Are you sure you want to delete the "${dbName}" database?` 
        : 'Are you sure you want to delete ALL Amplify databases?')) {
        return;
      }
      
      setLoading(true);
      
      if (dbName) {
        // Delete specific database
        await window.indexedDB.deleteDatabase(dbName);
        console.log(`Deleted database: ${dbName}`);
      } else {
        // Delete all Amplify databases
        const databases = await window.indexedDB.databases();
        const amplifyDatabases = databases.filter(db => 
          db.name.includes('amplify') || 
          db.name.includes('DataStore')
        );
        
        for (const db of amplifyDatabases) {
          await window.indexedDB.deleteDatabase(db.name);
          console.log(`Deleted database: ${db.name}`);
        }
      }
      
      // Refresh the data
      await scanIndexedDB();
    } catch (error) {
      console.error('Error clearing IndexedDB:', error);
      setError(`Error clearing IndexedDB: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to directly delete an item from DynamoDB
  const deleteItemDirectly = async (id) => {
    if (!window.confirm(`Are you sure you want to delete item ${id.substring(0, 8)}...? This cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Execute a direct delete mutation with no condition
      const response = await client.graphql({
        query: `mutation ForceDeleteItem($id: ID!) {
          deleteEquipmentItem(input: { id: $id }, condition: null) {
            id
          }
        }`,
        variables: { id }
      });
      
      console.log('Direct delete response:', response);
      alert(`Item ${id.substring(0, 8)}... has been deleted directly from DynamoDB.`);
      
      // Refresh the data
      if (apiData.items.duplicates) {
        await checkForSoftDeletedItems();
      } else {
        await fetchDirectFromAPI();
      }
    } catch (error) {
      console.error('Error directly deleting item:', error);
      setError(`Failed to delete item: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to cleanup a duplicate group by keeping only the newest item
  const cleanupDuplicateGroup = async (group) => {
    if (!window.confirm(`Are you sure you want to clean up this group? This will keep the newest item and delete all others.`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Keep the newest item (first in the sorted list) and delete the rest
      const itemsToDelete = group.items.slice(1);
      const results = {
        success: 0,
        failed: 0,
        errors: []
      };
      
      for (const item of itemsToDelete) {
        try {
          await client.graphql({
            query: `mutation ForceDeleteItem($id: ID!) {
              deleteEquipmentItem(input: { id: $id }, condition: null) {
                id
              }
            }`,
            variables: { id: item.id }
          });
          
          results.success++;
          console.log(`Successfully deleted duplicate item ${item.id}`);
        } catch (error) {
          console.error(`Failed to delete item ${item.id}:`, error);
          results.failed++;
          results.errors.push({
            id: item.id,
            error: error.message
          });
        }
      }
      
      // Show results
      if (results.failed > 0) {
        alert(`Cleanup completed with issues. Successfully deleted ${results.success} items, ${results.failed} items failed.`);
      } else {
        alert(`Successfully cleaned up group. Deleted ${results.success} duplicate items.`);
      }
      
      // Refresh data
      await checkForSoftDeletedItems();
    } catch (error) {
      console.error('Error cleaning up duplicate group:', error);
      setError(`Error cleaning up duplicate group: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="data-inspector">
      <h2>Amplify Data Inspector</h2>
      
      <div className="inspector-actions">
        <button 
          onClick={scanIndexedDB}
          disabled={loading}
        >
          {loading ? 'Scanning...' : 'Scan IndexedDB'}
        </button>
        
        <button 
          onClick={fetchDirectFromAPI}
          disabled={loading}
        >
          {loading ? 'Fetching...' : 'Fetch from API'}
        </button>
        
        <button 
          onClick={checkForSoftDeletedItems}
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Check Deleted Items'}
        </button>
        
        <button 
          onClick={() => clearIndexedDB()}
          disabled={loading}
          className="danger-button"
        >
          Clear All Amplify Data
        </button>
      </div>
      
      {error && <div className="inspector-error">{error}</div>}
      
      {indexedDBData && (
        <div className="inspector-results">
          <h3>IndexedDB Data</h3>
          {Object.entries(indexedDBData).map(([dbName, dbData]) => (
            <div key={dbName} className="db-container">
              <div className="db-header">
                <h4>{dbName}</h4>
                <button
                  onClick={() => clearIndexedDB(dbName)}
                  className="small-button danger-button"
                >
                  Delete
                </button>
              </div>
              
              {Object.entries(dbData.stores).map(([storeName, storeData]) => (
                <div key={storeName} className="store-container">
                  <h5>{storeName} ({storeData.length || 0} items)</h5>
                  {storeData.length > 0 ? (
                    <pre className="data-preview">
                      {JSON.stringify(storeData.slice(0, 5), null, 2)}
                      {storeData.length > 5 && `\n... and ${storeData.length - 5} more items`}
                    </pre>
                  ) : (
                    <p>No items in this store</p>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      
      {apiData && apiData.items && apiData.items.duplicates && (
        <div className="inspector-results">
          <h3>Deleted & Duplicate Items Analysis</h3>
          <div className="summary-stats">
            <div>Total Items: {apiData.totalItems}</div>
            <div>Active Items: {apiData.activeItems}</div>
            <div>Deleted Items: {apiData.deletedItems}</div>
            <div>Duplicate Groups: {apiData.duplicateGroups}</div>
          </div>
          
          {apiData.duplicateGroups > 0 && (
            <div>
              <h4>Duplicate Items by Serial Number:</h4>
              {apiData.items.duplicates.map((group, index) => (
                <div key={group.key} className="duplicate-group">
                  <div className="duplicate-group-header">
                    <h5>Group {index + 1}: {group.key}</h5>
                    <button 
                      className="small-button cleanup-button"
                      onClick={() => cleanupDuplicateGroup(group)}
                      disabled={loading}
                    >
                      {loading ? 'Working...' : 'Auto-Clean'}
                    </button>
                  </div>
                  <table className="duplicates-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Created</th>
                        <th>Updated</th>
                        <th>Version</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((item, itemIndex) => (
                        <tr key={item.id} className={itemIndex === 0 ? 'newest-item' : ''}>
                          <td>{item.id.substring(0, 8)}...</td>
                          <td>{new Date(item.createdAt).toLocaleString()}</td>
                          <td>{new Date(item.updatedAt).toLocaleString()}</td>
                          <td>{item._version}</td>
                          <td>
                            <button
                              className="tiny-button danger-button"
                              onClick={() => deleteItemDirectly(item.id)}
                              disabled={loading || (itemIndex === 0 && group.items.length > 1)}
                              title={itemIndex === 0 && group.items.length > 1 ? "Can't delete the newest item" : "Delete this item"}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="info-note">The newest item (highlighted) will be kept during cleanup</div>
                </div>
              ))}
            </div>
          )}
          
          {apiData.deletedItems > 0 && (
            <div>
              <h4>Soft-Deleted Items:</h4>
              <table className="deleted-items-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>NSN</th>
                    <th>Serial</th>
                    <th>Deleted At</th>
                  </tr>
                </thead>
                <tbody>
                  {apiData.items.deleted.map(item => (
                    <tr key={item.id}>
                      <td>{item.id.substring(0, 8)}...</td>
                      <td>{item.nsn}</td>
                      <td>{item.serialNumber || '-'}</td>
                      <td>{new Date(item._lastChangedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {apiData && apiData.items && !apiData.items.duplicates && (
        <div className="inspector-results">
          <h3>Direct API Data</h3>
          <p>UIC: {apiData.uicID}</p>
          <p>Item count: {apiData.itemCount}</p>
          
          {apiData.dynamoDBInfo && (
            <div className="dynamodb-info">
              <p>DynamoDB Table: {apiData.dynamoDBInfo.tableName}</p>
              <p>
                <a 
                  href={apiData.dynamoDBInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dynamodb-link"
                >
                  Open in DynamoDB Console
                </a>
              </p>
            </div>
          )}
          
          <pre className="data-preview">
            {JSON.stringify(apiData.items.slice(0, 5), null, 2)}
            {apiData.items.length > 5 && `\n... and ${apiData.items.length - 5} more items`}
          </pre>
        </div>
      )}
    </div>
  );
}

export default DataInspector; 