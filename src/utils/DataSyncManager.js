import { Hub } from 'aws-amplify/utils';
import { DataStore } from './GraphQLDataStoreCompat';
import { User } from '../models';
import { resetApolloClientCache } from '../api/apolloClient';
import { clearOfflineStore } from '../offline/offlineStore';

let isInitialized = false;
let isSyncing = false;
let isClearing = false;

export const initializeDataStore = async () => {
  if (isInitialized) return;
  isInitialized = true;
  await DataStore.start();
};

export const syncUserData = async (username) => {
  if (isSyncing) {
    return new Promise((resolve) => {
      setTimeout(async () => {
        resolve(await syncUserData(username));
      }, 1000);
    });
  }

  try {
    isSyncing = true;
    await initializeDataStore();
    const existingUsers = await DataStore.query(User, u => u.owner.eq(username));
    return existingUsers.length > 0 ? existingUsers[0] : null;
  } finally {
    isSyncing = false;
  }
};

export const safeDataStoreClear = async ({ restart = true, clearOffline = false } = {}) => {
  if (isClearing) return;

  try {
    isClearing = true;
    await DataStore.stop();
    await resetApolloClientCache();
    if (clearOffline) {
      await clearOfflineStore();
    }
    if (restart) {
      await DataStore.start();
      isInitialized = true;
    } else {
      isInitialized = false;
    }
  } finally {
    isClearing = false;
  }
};

export const setupAuthListener = () => {
  Hub.listen('auth', async ({ payload }) => {
    if (payload.event === 'signIn') {
      setTimeout(async () => {
        try {
          await safeDataStoreClear({ restart: true });
        } catch (error) {
          console.error('Error refreshing client data after sign-in:', error);
        }
      }, 1000);
    }

    if (payload.event === 'signOut') {
      try {
        await safeDataStoreClear({ restart: false, clearOffline: true });
      } catch (error) {
        console.error('Error clearing client data on sign-out:', error);
      }
    }
  });
};

export const safeDataStoreQuery = async (model, predicate = null, options = {}) => {
  await initializeDataStore();
  return DataStore.query(model, predicate, options);
};

export const safeDataStoreSave = async (modelOrInstance, callback = null) => {
  await initializeDataStore();
  if (callback) {
    if (!modelOrInstance?.constructor?.copyOf) {
      throw new Error('safeDataStoreSave update requires a model instance');
    }
    return DataStore.save(modelOrInstance.constructor.copyOf(modelOrInstance, callback));
  }
  return DataStore.save(modelOrInstance);
};
