import { getCurrentUser } from 'aws-amplify/auth';
import { getApolloClient, gql } from '../api/apolloClient';
import { createAccountabilityCheckInEvent } from '../graphql/customOperations';
import { OFFLINE_SCHEMA_VERSION, cacheKey, getCached, setCached, removeCached } from './offlineStore';

const DEVICE_ID_KEY = 'device-id';
const PINNED_UICS_KEY = userId => cacheKey('pinned-uics', userId);
const SNAPSHOT_KEY = (userId, uicID) => cacheKey('snapshot', OFFLINE_SCHEMA_VERSION, userId, uicID);
const OUTBOX_KEY = userId => cacheKey('check-in-outbox', OFFLINE_SCHEMA_VERSION, userId);

const SOLDIERS_BY_UIC = gql`
  query OfflineSoldiersByUIC($uicID: ID!, $nextToken: String) {
    soldiersByUicID(uicID: $uicID, limit: 1000, nextToken: $nextToken) {
      items {
        id
        firstName
        lastName
        rank
        email
        phone
        uicID
        role
        userId
        hasAccount
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
      }
      nextToken
      startedAt
    }
  }
`;

const EQUIPMENT_BY_UIC = gql`
  query OfflineEquipmentByUIC($uicID: ID!, $nextToken: String) {
    equipmentItemsByUicID(uicID: $uicID, limit: 1000, nextToken: $nextToken) {
      items {
        id
        uicID
        equipmentMasterID
        nsn
        lin
        serialNumber
        stockNumber
        location
        assignedToID
        maintenanceStatus
        isPartOfGroup
        groupID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
      }
      nextToken
      startedAt
    }
  }
`;

const GROUPS_BY_UIC = gql`
  query OfflineEquipmentGroupsByUIC($uicID: ID!, $nextToken: String) {
    equipmentGroupsByUicID(uicID: $uicID, limit: 1000, nextToken: $nextToken) {
      items {
        id
        name
        description
        uicID
        assignedToID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
      }
      nextToken
      startedAt
    }
  }
`;

const HAND_RECEIPTS_BY_UIC = gql`
  query OfflineHandReceiptsByUIC($uicID: ID!, $nextToken: String) {
    handReceiptStatusesByFromUIC(
      fromUIC: $uicID,
      filter: { status: { eq: ISSUED }, _deleted: { ne: true } },
      limit: 1000,
      nextToken: $nextToken
    ) {
      items {
        id
        receiptNumber
        status
        fromUIC
        toSoldierID
        equipmentItemID
        issuedOn
        returnedOn
        pdfS3Key
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
      }
      nextToken
      startedAt
    }
  }
`;

const ACCOUNTABILITY_SESSIONS_BY_UIC = gql`
  query OfflineAccountabilitySessionsByUIC($uicID: ID!, $nextToken: String) {
    accountabilitySessionsByUicID(
      uicID: $uicID,
      filter: { status: { eq: ACTIVE }, _deleted: { ne: true } },
      limit: 1000,
      nextToken: $nextToken
    ) {
      items {
        id
        uicID
        conductedByID
        status
        startedAt
        completedAt
        itemCount
        accountedForCount
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
      }
      nextToken
      startedAt
    }
  }
`;

const ACCOUNTABILITY_ITEMS_BY_SESSION = gql`
  query OfflineAccountabilityItemsBySession($sessionID: ID!, $nextToken: String) {
    accountabilityItemsBySessionID(sessionID: $sessionID, limit: 1000, nextToken: $nextToken) {
      items {
        id
        sessionID
        equipmentItemID
        status
        verificationMethod
        verifiedByID
        verifiedAt
        confirmationStatus
        confirmedAt
        notes
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
      }
      nextToken
      startedAt
    }
  }
`;

const GET_EQUIPMENT_MASTER = gql`
  query OfflineGetEquipmentMaster($id: ID!) {
    getEquipmentMaster(id: $id) {
      id
      nsn
      commonName
      description
      tmNumber
      isSerialTracked
      isSensitiveItem
      isConsumable
      isCyclicInventory
      isSensitiveInventory
      storageRestrictions
      maintenanceSchedule
      imageKey
      subComponents
      _version
      _deleted
      _lastChangedAt
    }
  }
`;

const CREATE_CHECK_IN_EVENT = gql(createAccountabilityCheckInEvent);

async function currentUserId() {
  const user = await getCurrentUser();
  return user?.userId || user?.username;
}

async function getDeviceId() {
  let deviceId = await getCached(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    await setCached(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

function liveItems(items = []) {
  return items.filter(item => item && item._deleted !== true);
}

async function collectConnection(client, query, variables, rootKey) {
  let nextToken = null;
  let items = [];
  let startedAt = null;

  do {
    const result = await client.query({
      query,
      variables: { ...variables, nextToken },
      fetchPolicy: 'network-only'
    });
    const connection = result.data?.[rootKey] || {};
    items = items.concat(liveItems(connection.items || []));
    nextToken = connection.nextToken;
    startedAt = connection.startedAt || startedAt;
  } while (nextToken);

  return { items, startedAt };
}

function buildCustodyRows({ soldiers, equipmentItems, equipmentGroups, equipmentMasters, handReceiptStatuses }) {
  const soldiersById = new Map(soldiers.map(soldier => [soldier.id, soldier]));
  const groupsById = new Map(equipmentGroups.map(group => [group.id, group]));
  const mastersById = new Map(equipmentMasters.map(master => [master.id, master]));
  const activeReceiptsByItemId = new Map(handReceiptStatuses.map(receipt => [receipt.equipmentItemID, receipt]));

  return equipmentItems.map(item => {
    const soldier = item.assignedToID ? soldiersById.get(item.assignedToID) : null;
    const group = item.groupID ? groupsById.get(item.groupID) : null;
    const master = item.equipmentMasterID ? mastersById.get(item.equipmentMasterID) : null;
    const receipt = activeReceiptsByItemId.get(item.id) || null;

    return {
      equipmentItemID: item.id,
      equipmentMasterID: item.equipmentMasterID,
      nsn: item.nsn,
      lin: item.lin,
      serialNumber: item.serialNumber,
      stockNumber: item.stockNumber,
      location: item.location,
      maintenanceStatus: item.maintenanceStatus,
      assignedToID: item.assignedToID,
      assignedToName: soldier ? `${soldier.rank || ''} ${soldier.lastName}, ${soldier.firstName}`.trim() : null,
      groupID: item.groupID,
      groupName: group?.name || null,
      commonName: master?.commonName || `Item ${item.nsn || ''}`,
      isSerialTracked: Boolean(master?.isSerialTracked),
      isSensitiveItem: Boolean(master?.isSensitiveItem),
      activeHandReceiptID: receipt?.id || null,
      receiptNumber: receipt?.receiptNumber || null,
      itemUpdatedAt: item.updatedAt,
      itemVersion: item._version
    };
  });
}

function buildSnapshotToken(parts) {
  const latest = [
    ...parts.soldiers,
    ...parts.equipmentItems,
    ...parts.equipmentGroups,
    ...parts.handReceiptStatuses,
    ...parts.accountabilitySessions,
    ...parts.accountabilityItems
  ].reduce((max, item) => {
    const candidate = Date.parse(item.updatedAt || item.createdAt || 0);
    return Number.isFinite(candidate) && candidate > max ? candidate : max;
  }, 0);

  return `uic:${parts.uicID}:schema:${OFFLINE_SCHEMA_VERSION}:latest:${latest}`;
}

export async function getPinnedUICs(userId = null) {
  const resolvedUserId = userId || await currentUserId();
  return getCached(PINNED_UICS_KEY(resolvedUserId), []);
}

export async function pinUIC(uicID, userId = null) {
  const resolvedUserId = userId || await currentUserId();
  const pinned = new Set(await getPinnedUICs(resolvedUserId));
  pinned.add(uicID);
  return setCached(PINNED_UICS_KEY(resolvedUserId), [...pinned]);
}

export async function unpinUIC(uicID, userId = null) {
  const resolvedUserId = userId || await currentUserId();
  const pinned = new Set(await getPinnedUICs(resolvedUserId));
  pinned.delete(uicID);
  return setCached(PINNED_UICS_KEY(resolvedUserId), [...pinned]);
}

export async function loadCachedUnitOfflineSnapshot(uicID, userId = null) {
  const resolvedUserId = userId || await currentUserId();
  return getCached(SNAPSHOT_KEY(resolvedUserId, uicID));
}

export async function cacheUnitOfflineSnapshot(snapshot, userId = null) {
  const resolvedUserId = userId || await currentUserId();
  return setCached(SNAPSHOT_KEY(resolvedUserId, snapshot.uicID), {
    ...snapshot,
    cachedForUserId: resolvedUserId,
    cachedAt: new Date().toISOString(),
    schemaVersion: OFFLINE_SCHEMA_VERSION
  });
}

export async function removeCachedUnitOfflineSnapshot(uicID, userId = null) {
  const resolvedUserId = userId || await currentUserId();
  await removeCached(SNAPSHOT_KEY(resolvedUserId, uicID));
}

export async function getUnitOfflineSnapshot(uicID) {
  const client = await getApolloClient();

  const [
    soldiersResult,
    equipmentResult,
    groupsResult,
    receiptsResult,
    sessionsResult
  ] = await Promise.all([
    collectConnection(client, SOLDIERS_BY_UIC, { uicID }, 'soldiersByUicID'),
    collectConnection(client, EQUIPMENT_BY_UIC, { uicID }, 'equipmentItemsByUicID'),
    collectConnection(client, GROUPS_BY_UIC, { uicID }, 'equipmentGroupsByUicID'),
    collectConnection(client, HAND_RECEIPTS_BY_UIC, { uicID }, 'handReceiptStatusesByFromUIC'),
    collectConnection(client, ACCOUNTABILITY_SESSIONS_BY_UIC, { uicID }, 'accountabilitySessionsByUicID')
  ]);

  const accountabilityItems = [];
  for (const session of sessionsResult.items) {
    const result = await collectConnection(client, ACCOUNTABILITY_ITEMS_BY_SESSION, { sessionID: session.id }, 'accountabilityItemsBySessionID');
    accountabilityItems.push(...result.items);
  }

  const masterIds = [...new Set(equipmentResult.items.map(item => item.equipmentMasterID).filter(Boolean))];
  const equipmentMasters = liveItems(await Promise.all(masterIds.map(async id => {
    const result = await client.query({
      query: GET_EQUIPMENT_MASTER,
      variables: { id },
      fetchPolicy: 'network-only'
    });
    return result.data?.getEquipmentMaster;
  })));

  const parts = {
    uicID,
    soldiers: soldiersResult.items,
    equipmentItems: equipmentResult.items,
    equipmentGroups: groupsResult.items,
    handReceiptStatuses: receiptsResult.items,
    accountabilitySessions: sessionsResult.items,
    accountabilityItems
  };

  const snapshot = {
    ...parts,
    equipmentMasters,
    custodyRows: buildCustodyRows({ ...parts, equipmentMasters }),
    snapshotToken: buildSnapshotToken(parts),
    serverStartedAt: Math.max(
      soldiersResult.startedAt || 0,
      equipmentResult.startedAt || 0,
      groupsResult.startedAt || 0,
      receiptsResult.startedAt || 0,
      sessionsResult.startedAt || 0
    )
  };

  return cacheUnitOfflineSnapshot(snapshot);
}

export async function getUnitSyncManifest(uicID) {
  const snapshot = await loadCachedUnitOfflineSnapshot(uicID);
  if (!snapshot) {
    return {
      uicID,
      schemaVersion: OFFLINE_SCHEMA_VERSION,
      cached: false
    };
  }

  return {
    uicID,
    schemaVersion: snapshot.schemaVersion,
    cached: true,
    cachedAt: snapshot.cachedAt,
    snapshotToken: snapshot.snapshotToken,
    counts: {
      soldiers: snapshot.soldiers?.length || 0,
      equipmentItems: snapshot.equipmentItems?.length || 0,
      equipmentGroups: snapshot.equipmentGroups?.length || 0,
      handReceiptStatuses: snapshot.handReceiptStatuses?.length || 0,
      accountabilitySessions: snapshot.accountabilitySessions?.length || 0,
      accountabilityItems: snapshot.accountabilityItems?.length || 0,
      queuedCheckIns: (await getPendingCheckInEvents()).filter(event => event.uicID === uicID).length
    }
  };
}

export async function queueCheckInEvent(event) {
  const userId = await currentUserId();
  const outbox = await getCached(OUTBOX_KEY(userId), []);
  const deviceId = await getDeviceId();
  const now = new Date().toISOString();
  const queuedEvent = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    clientMutationId: event.clientMutationId || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`),
    deviceId,
    conflictStatus: 'PENDING',
    createdAt: now,
    updatedAt: now,
    ...event,
    queuedAt: now,
    syncState: 'pending'
  };

  await setCached(OUTBOX_KEY(userId), [...outbox, queuedEvent]);
  return queuedEvent;
}

export async function getPendingCheckInEvents(userId = null) {
  const resolvedUserId = userId || await currentUserId();
  const outbox = await getCached(OUTBOX_KEY(resolvedUserId), []);
  return outbox.filter(event => event.syncState !== 'synced');
}

export async function submitPendingCheckIns() {
  const userId = await currentUserId();
  const outbox = await getCached(OUTBOX_KEY(userId), []);
  const pending = outbox.filter(event => event.syncState !== 'synced');
  if (pending.length === 0) {
    return { submitted: 0, failed: 0, failures: [] };
  }

  const client = await getApolloClient();
  const results = [];

  for (const event of pending) {
    try {
      const input = {
        id: event.id,
        clientMutationId: event.clientMutationId,
        deviceId: event.deviceId,
        uicID: event.uicID,
        sessionID: event.sessionID,
        accountabilityItemID: event.accountabilityItemID || null,
        equipmentItemID: event.equipmentItemID,
        snapshotToken: event.snapshotToken,
        status: event.status,
        verificationMethod: event.verificationMethod,
        verifiedByID: event.verifiedByID || null,
        verifiedAt: event.verifiedAt,
        notes: event.notes || null,
        conflictStatus: event.conflictStatus || 'PENDING',
        conflictReason: event.conflictReason || null,
        appliedAt: event.appliedAt || null,
        createdAt: event.createdAt,
        updatedAt: new Date().toISOString()
      };

      await client.mutate({
        mutation: CREATE_CHECK_IN_EVENT,
        variables: { input }
      });
      results.push({ ...event, syncState: 'synced', syncedAt: new Date().toISOString() });
    } catch (error) {
      console.error('Failed to submit offline check-in event:', error);
      results.push({ ...event, syncState: 'failed', lastError: error.message || String(error) });
    }
  }

  const untouched = outbox.filter(event => event.syncState === 'synced');
  await setCached(OUTBOX_KEY(userId), [...untouched, ...results]);

  const failed = results.filter(event => event.syncState === 'failed');
  return {
    submitted: results.length - failed.length,
    failed: failed.length,
    failures: failed
  };
}
