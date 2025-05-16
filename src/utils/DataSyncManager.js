import { DataStore } from '@aws-amplify/datastore';
import { User, UIC } from '../models';
import { Hub } from 'aws-amplify/utils';

// Track DataStore state to prevent concurrent operations
let isInitialized = false;
let isSyncing = false;
let isClearing = false;

// Initialize the DataStore once at startup
export const initializeDataStore = async () => {
  if (isInitialized) return;
  
  try {
    console.log("Initializing DataStore...");
    isInitialized = true;
    await DataStore.start();
    console.log("DataStore initialized");
  } catch (error) {
    console.error("Error initializing DataStore:", error);
    isInitialized = false;
    throw error;
  }
};

// Handle refresh of user data after login
export const syncUserData = async (username) => {
  if (isSyncing) {
    console.log("DataStore sync already in progress, waiting...");
    // Wait and try again after a short delay
    return new Promise((resolve) => {
      setTimeout(async () => {
        resolve(await syncUserData(username));
      }, 1000);
    });
  }

  try {
    isSyncing = true;
    console.log("Syncing user data for:", username);
    
    // Make sure DataStore is started
    if (!isInitialized) {
      await initializeDataStore();
    }
    
    // Force a sync of the User model
    const existingUsers = await DataStore.query(User, u => u.owner.eq(username));
    console.log("Fetched user data:", existingUsers);
    
    isSyncing = false;
    return existingUsers.length > 0 ? existingUsers[0] : null;
  } catch (error) {
    console.error("Error syncing user data:", error);
    isSyncing = false;
    throw error;
  }
};

// Safe version of DataStore clear that manages state
export const safeDataStoreClear = async () => {
  if (isClearing) {
    console.log("DataStore clear already in progress");
    return;
  }
  
  try {
    isClearing = true;
    console.log("Clearing DataStore...");
    
    // Stop DataStore before clearing
    await DataStore.stop();
    await DataStore.clear();
    
    // Restart DataStore
    await DataStore.start();
    
    console.log("DataStore cleared and restarted");
    isClearing = false;
  } catch (error) {
    console.error("Error clearing DataStore:", error);
    isClearing = false;
    
    // Try to recover by restarting DataStore
    try {
      await DataStore.start();
    } catch (startError) {
      console.error("Failed to restart DataStore after clear error:", startError);
    }
    
    throw error;
  }
};

// Listen for authentication events to trigger data sync
export const setupAuthListener = () => {
  Hub.listen('auth', async (data) => {
    const { payload } = data;
    console.log("Auth event:", payload.event);
    
    if (payload.event === 'signIn') {
      // Wait a moment for auth to complete
      setTimeout(async () => {
        try {
          // Clear local data and force a refresh from the server
          await safeDataStoreClear();
          console.log("DataStore cleared after sign-in");
        } catch (error) {
          console.error("Error handling sign-in data sync:", error);
        }
      }, 1000);
    }
    
    if (payload.event === 'signOut') {
      // Clear local data on sign out
      try {
        await safeDataStoreClear();
        console.log("DataStore cleared after sign-out");
      } catch (error) {
        console.error("Error clearing data on sign-out:", error);
      }
    }
  });
  
  console.log("Auth listener set up");
};

// Export a function to safely query the DataStore
export const safeDataStoreQuery = async (model, predicate = null, options = {}) => {
  try {
    if (!isInitialized) {
      await initializeDataStore();
    }
    return await DataStore.query(model, predicate, options);
  } catch (error) {
    console.error(`Error querying ${model.name}:`, error);
    throw error;
  }
};

// Export a function to safely save to DataStore
export const safeDataStoreSave = async (modelOrInstance, callback = null) => {
  try {
    if (!isInitialized) {
      await initializeDataStore();
    }
    
    if (callback) {
      // For copyOf pattern: modelOrInstance is a model instance, callback is the updater function
      return await DataStore.save(modelOrInstance, callback);
    } else {
      // For new instance: modelOrInstance is the instance to save
      return await DataStore.save(modelOrInstance);
    }
  } catch (error) {
    console.error(`Error saving to DataStore:`, error);
    
    // If we hit a DataStore error, try to recover
    if (error.name === 'DataStoreStateError') {
      console.log('Attempting to recover from DataStore state error...');
      await recoverDataStoreState();
      // Try the save operation again
      return callback ? 
        await DataStore.save(modelOrInstance, callback) :
        await DataStore.save(modelOrInstance);
    }
    
    throw error;
  }
};

// Function to attempt DataStore recovery
async function recoverDataStoreState() {
  try {
    // Check if DataStore needs to be started
    await DataStore.stop();
    console.log('DataStore stopped for recovery');
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Restart
    await DataStore.start();
    console.log('DataStore restarted after recovery');
    isInitialized = true;
  } catch (error) {
    console.error('Failed to recover DataStore state:', error);
    throw error;
  }
}; 