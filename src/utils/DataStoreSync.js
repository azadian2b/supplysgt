import { DataStore } from '@aws-amplify/datastore';
import { User, UIC, UICMembershipRequest, UICCreationRequest, RequestStatus } from '../models';

/**
 * Utility class for managing DataStore synchronization
 */
class DataStoreUtil {
  /**
   * Clears the local DataStore and starts a fresh sync
   * @returns {Promise<void>}
   */
  static async clearAndSync() {
    console.log('Clearing local DataStore...');
    await DataStore.clear();

    console.log('Restarting sync process...');
    await DataStore.start();

    return new Promise(resolve => {
      // Add a subscription to wait for the sync to complete
      const subscription = DataStore.observe().subscribe({
        next: () => {
          console.log('DataStore sync event received');
        },
        error: (error) => {
          console.error('DataStore sync error:', error);
        },
        complete: () => {
          console.log('DataStore sync completed');
          subscription.unsubscribe();
          resolve();
        }
      });

      // Set a timeout in case the complete event never fires
      setTimeout(() => {
        subscription.unsubscribe();
        resolve();
      }, 5000);
    });
  }

  /**
   * Stops DataStore synchronization
   * @returns {Promise<void>}
   */
  static async stop() {
    console.log('Stopping DataStore...');
    try {
      await DataStore.stop();
      console.log('DataStore stopped successfully');
    } catch (error) {
      console.error('Error stopping DataStore:', error);
      // Continue anyway
    }
  }

  /**
   * Starts DataStore synchronization
   * @returns {Promise<void>}
   */
  static async start() {
    console.log('Starting DataStore...');
    try {
      await DataStore.start();
      console.log('DataStore started successfully');
    } catch (error) {
      console.error('Error starting DataStore:', error);
      // Try to restart - sometimes this helps with connection issues
      try {
        console.log('Attempting to restart DataStore...');
        await DataStore.clear();
        await DataStore.start();
        console.log('DataStore restarted successfully');
      } catch (restartError) {
        console.error('Failed to restart DataStore:', restartError);
        throw restartError;
      }
    }
  }

  /**
   * Clears specific items from the local DataStore
   * @param {*} modelClass - The model class to clear
   * @returns {Promise<void>}
   */
  static async clearModel(modelClass) {
    console.log(`Clearing ${modelClass.name} from local DataStore...`);
    const items = await DataStore.query(modelClass);
    await Promise.all(items.map(item => DataStore.delete(item)));
  }

  /**
   * Gets the current connectivity mode
   * @returns {boolean} True if in online mode, false if in offline mode
   */
  static isOnlineMode() {
    return localStorage.getItem('connectivityMode') !== 'offline';
  }

  /**
   * Sets the connectivity mode
   * @param {boolean} isOnline - True for online mode, false for offline mode
   */
  static async setConnectivityMode(isOnline) {
    const mode = isOnline ? 'online' : 'offline';
    const previousMode = localStorage.getItem('connectivityMode');

    // Only take action if the mode is actually changing
    if (previousMode === mode) {
      console.log(`Already in ${mode} mode, no change needed`);
      return;
    }

    console.log(`Changing connectivity mode from ${previousMode || 'default'} to ${mode}`);
    localStorage.setItem('connectivityMode', mode);

    // Dispatch a storage event so other tabs can react to the change
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'connectivityMode',
      newValue: mode,
      oldValue: previousMode,
      storageArea: localStorage
    }));

    // Apply the appropriate DataStore state
    if (isOnline) {
      await this.start();
    } else {
      await this.stop();
    }
  }

  /**
   * Synchronizes a specific entity from the API to the local DataStore
   * Useful after direct GraphQL API changes to ensure local state is consistent
   *
   * @param {*} modelClass - The model class (e.g., EquipmentItem)
   * @param {string} id - The ID of the entity to sync
   * @param {Function} apiFetchFn - Optional function to fetch the entity from API if needed
   * @returns {Promise<Object>} - The synchronized entity
   */
  static async syncEntity(modelClass, id, apiFetchFn = null) {
    console.log(`Syncing ${modelClass.name} with ID: ${id}`);

    // Only attempt sync in online mode
    if (!this.isOnlineMode()) {
      console.log('In offline mode, skipping sync');
      return await DataStore.query(modelClass, id);
    }

    try {
      // First try to directly query the entity to force a sync
      let entity = await DataStore.query(modelClass, id);

      // If entity doesn't exist locally and we have a fetch function, use it
      if (!entity && apiFetchFn) {
        console.log(`Entity not found in local DataStore, fetching from API...`);
        const apiData = await apiFetchFn(id);

        // Temporarily save to DataStore
        if (apiData) {
          try {
            // Remove fields that might cause conflicts
            const { _deleted, _lastChangedAt, createdAt, updatedAt, ...cleanData } = apiData;

            // Try to create a new instance and save it
            entity = await DataStore.save(new modelClass(cleanData));
            console.log(`Created entity in local DataStore`);
          } catch (saveError) {
            console.error(`Error saving entity to DataStore:`, saveError);
          }
        }
      }

      if (entity) {
        entity = await DataStore.query(modelClass, id);
        console.log(`Successfully checked local entity`);
      }

      return entity;
    } catch (error) {
      console.error(`Error syncing entity:`, error);
      throw error;
    }
  }

  /**
   * Gets the current sync status
   * @returns {Promise<Object>} The sync status
   */
  static async getStatus() {
    try {
      // Check network connectivity
      const isOnline = navigator.onLine;

      // Check if DataStore is ready
      let isDataStoreReady = false;
      try {
        // Try a simple query to see if DataStore is functioning
        await DataStore.query(UIC, undefined, { page: 0, limit: 1 });
        isDataStoreReady = true;
      } catch (error) {
        console.warn('DataStore not ready:', error);
        isDataStoreReady = false;
      }

      return {
        isOnline,
        isDataStoreReady,
        connectivityMode: this.isOnlineMode() ? 'online' : 'offline'
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Synchronizes UIC request changes
   * @param {string} requestId - The ID of the request
   * @param {string} requestType - Either 'membership' or 'creation'
   * @returns {Promise<void>}
   */
  static async syncUICRequest(requestId, requestType) {
    console.log(`Syncing UIC ${requestType} request: ${requestId}`);

    try {
      const Model = requestType === 'membership' ? UICMembershipRequest : UICCreationRequest;

      // Force a sync of the request
      await this.syncEntity(Model, requestId);

      // If it's a membership request, also sync the related UIC and User
      if (requestType === 'membership') {
        const request = await DataStore.query(Model, requestId);
        if (request) {
          await this.syncEntity(UIC, request.uicID);
          await this.syncEntity(User, request.userID);
        }
      }

      console.log(`Successfully synced UIC ${requestType} request`);
    } catch (error) {
      console.error(`Error syncing UIC ${requestType} request:`, error);
      throw error;
    }
  }

  /**
   * Handles UIC request approval/rejection
   * @param {string} requestId - The ID of the request
   * @param {string} requestType - Either 'membership' or 'creation'
   * @param {boolean} isApproved - Whether the request is approved
   * @param {string} approverId - The ID of the user approving/rejecting
   * @param {string} [rejectionReason] - Optional reason for rejection
   * @returns {Promise<void>}
   */
  static async handleUICRequest(requestId, requestType, isApproved, approverId, rejectionReason = null) {
    console.log(`Handling UIC ${requestType} request: ${requestId}`);

    try {
      const Model = requestType === 'membership' ? UICMembershipRequest : UICCreationRequest;
      const request = await DataStore.query(Model, requestId);

      if (!request) {
        throw new Error(`Request not found: ${requestId}`);
      }

      // Update the request status
      await DataStore.save(
        Model.copyOf(request, updated => {
          updated.status = isApproved ? RequestStatus.APPROVED : RequestStatus.REJECTED;
          updated.approvedBy = approverId;
          updated.approvedAt = new Date().toISOString();
          if (!isApproved && rejectionReason) {
            updated.rejectionReason = rejectionReason;
          }
        })
      );

      // Sync the changes
      await this.syncUICRequest(requestId, requestType);

      console.log(`Successfully handled UIC ${requestType} request`);
    } catch (error) {
      console.error(`Error handling UIC ${requestType} request:`, error);
      throw error;
    }
  }
}

export { DataStoreUtil };
export default DataStoreUtil;
