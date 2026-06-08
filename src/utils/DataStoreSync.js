import { DataStore } from './GraphQLDataStoreCompat';
import { UIC, UICMembershipRequest, UICCreationRequest, RequestStatus } from '../models';
import { resetApolloClientCache } from '../api/apolloClient';
import { getConnectivityModeSnapshot, setConnectivityMode } from '../offline/connectivityMode';
import { submitPendingCheckIns } from '../offline/offlineCustodyRepository';

class DataStoreUtil {
  static async clearAndSync() {
    await resetApolloClientCache();
    const checkInResult = await submitPendingCheckIns();
    return checkInResult;
  }

  static async stop() {
    await setConnectivityMode('offline');
  }

  static async start() {
    await setConnectivityMode('online');
  }

  static async clearModel(modelClass) {
    const items = await DataStore.query(modelClass);
    await Promise.all(items.map(item => DataStore.delete(item)));
  }

  static isOnlineMode() {
    return getConnectivityModeSnapshot() !== 'offline';
  }

  static async setConnectivityMode(isOnline) {
    const mode = isOnline ? 'online' : 'offline';
    await setConnectivityMode(mode);
    if (isOnline) {
      await submitPendingCheckIns();
    }
  }

  static async syncEntity(modelClass, id, apiFetchFn = null) {
    if (!this.isOnlineMode()) {
      return DataStore.query(modelClass, id, { fetchPolicy: 'cache-first' });
    }

    let entity = await DataStore.query(modelClass, id);
    if (!entity && apiFetchFn) {
      entity = await apiFetchFn(id);
    }
    return entity;
  }

  static async getStatus() {
    return {
      isOnline: navigator.onLine,
      isDataStoreReady: true,
      connectivityMode: this.isOnlineMode() ? 'online' : 'offline'
    };
  }

  static async syncUICRequest(requestId, requestType) {
    const Model = requestType === 'membership' ? UICMembershipRequest : UICCreationRequest;
    const request = await this.syncEntity(Model, requestId);
    if (requestType === 'membership' && request?.uicID) {
      await this.syncEntity(UIC, request.uicID);
    }
  }

  static async handleUICRequest(requestId, requestType, isApproved, approverId, rejectionReason = null) {
    const Model = requestType === 'membership' ? UICMembershipRequest : UICCreationRequest;
    const request = await DataStore.query(Model, requestId);
    if (!request) {
      throw new Error(`Request not found: ${requestId}`);
    }

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
  }
}

export { DataStoreUtil };
export default DataStoreUtil;
