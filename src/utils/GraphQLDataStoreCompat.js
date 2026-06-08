import { generateClient } from 'aws-amplify/api';
import * as queries from '../graphql/queries';
import * as mutations from '../graphql/mutations';
import * as subscriptions from '../graphql/subscriptions';
import * as customOperations from '../graphql/customOperations';
import { getApolloClient, gql } from '../api/apolloClient';
import { hydrateModel, stripTypename } from '../models/modelBase';

export const SortDirection = {
  ASCENDING: 'ASCENDING',
  DESCENDING: 'DESCENDING'
};

let amplifyClient;

function getAmplifyClient() {
  if (!amplifyClient) {
    amplifyClient = generateClient();
  }
  return amplifyClient;
}

const operationMap = {
  UIC: {
    get: 'getUIC',
    list: 'listUICS',
    create: 'createUIC',
    update: 'updateUIC',
    delete: 'deleteUIC',
    root: { get: 'getUIC', list: 'listUICS', create: 'createUIC', update: 'updateUIC', delete: 'deleteUIC' },
    fields: ['id', 'uicCode', 'name']
  },
  User: {
    get: 'getUser',
    list: 'listUsers',
    create: 'createUser',
    update: 'updateUser',
    delete: 'deleteUser',
    root: { get: 'getUser', list: 'listUsers', create: 'createUser', update: 'updateUser', delete: 'deleteUser' },
    fields: ['id', 'owner', 'firstName', 'lastName', 'rank', 'role', 'uicID', 'linkedSoldierId']
  },
  UICMembershipRequest: {
    get: 'getUICMembershipRequest',
    list: 'listUICMembershipRequests',
    create: 'createUICMembershipRequest',
    update: 'updateUICMembershipRequest',
    delete: 'deleteUICMembershipRequest',
    root: {
      get: 'getUICMembershipRequest',
      list: 'listUICMembershipRequests',
      create: 'createUICMembershipRequest',
      update: 'updateUICMembershipRequest',
      delete: 'deleteUICMembershipRequest'
    },
    fields: ['id', 'userID', 'uicID', 'requestedRole', 'status', 'createdAt', 'approvedBy', 'approvedAt', 'rejectionReason']
  },
  UICCreationRequest: {
    get: 'getUICCreationRequest',
    list: 'listUICCreationRequests',
    create: 'createUICCreationRequest',
    update: 'updateUICCreationRequest',
    delete: 'deleteUICCreationRequest',
    root: {
      get: 'getUICCreationRequest',
      list: 'listUICCreationRequests',
      create: 'createUICCreationRequest',
      update: 'updateUICCreationRequest',
      delete: 'deleteUICCreationRequest'
    },
    fields: ['id', 'requestedBy', 'uicCode', 'uicName', 'status', 'createdAt', 'approvedBy', 'approvedAt', 'rejectionReason', 'createdUIC']
  },
  Soldier: {
    get: 'getSoldier',
    list: 'listSoldiers',
    create: 'createSoldier',
    update: 'updateSoldier',
    delete: 'deleteSoldier',
    root: { get: 'getSoldier', list: 'listSoldiers', create: 'createSoldier', update: 'updateSoldier', delete: 'deleteSoldier' },
    fields: ['id', 'firstName', 'lastName', 'rank', 'email', 'phone', 'uicID', 'role', 'userId', 'hasAccount', 'createdAt', 'updatedAt']
  },
  EquipmentMaster: {
    get: 'getEquipmentMaster',
    list: 'listEquipmentMasters',
    create: 'createEquipmentMaster',
    update: 'updateEquipmentMaster',
    delete: 'deleteEquipmentMaster',
    root: {
      get: 'getEquipmentMaster',
      list: 'listEquipmentMasters',
      create: 'createEquipmentMaster',
      update: 'updateEquipmentMaster',
      delete: 'deleteEquipmentMaster'
    },
    fields: [
      'id',
      'nsn',
      'commonName',
      'description',
      'tmNumber',
      'isSerialTracked',
      'isSensitiveItem',
      'isConsumable',
      'isCyclicInventory',
      'isSensitiveInventory',
      'storageRestrictions',
      'maintenanceSchedule',
      'imageKey',
      'subComponents'
    ]
  },
  EquipmentItem: {
    get: 'getEquipmentItem',
    list: 'listEquipmentItems',
    create: 'createEquipmentItem',
    update: 'updateEquipmentItem',
    delete: 'deleteEquipmentItem',
    root: {
      get: 'getEquipmentItem',
      list: 'listEquipmentItems',
      create: 'createEquipmentItem',
      update: 'updateEquipmentItem',
      delete: 'deleteEquipmentItem'
    },
    fields: [
      'id',
      'uicID',
      'equipmentMasterID',
      'nsn',
      'lin',
      'serialNumber',
      'stockNumber',
      'location',
      'assignedToID',
      'maintenanceStatus',
      'isPartOfGroup',
      'groupID',
      'createdAt',
      'updatedAt'
    ]
  },
  EquipmentGroup: {
    get: 'getEquipmentGroup',
    list: 'listEquipmentGroups',
    create: 'createEquipmentGroup',
    update: 'updateEquipmentGroup',
    delete: 'deleteEquipmentGroup',
    root: {
      get: 'getEquipmentGroup',
      list: 'listEquipmentGroups',
      create: 'createEquipmentGroup',
      update: 'updateEquipmentGroup',
      delete: 'deleteEquipmentGroup'
    },
    fields: ['id', 'name', 'description', 'uicID', 'assignedToID', 'createdAt', 'updatedAt']
  },
  HandReceiptStatus: {
    get: 'getHandReceiptStatus',
    list: 'listHandReceiptStatuses',
    create: 'createHandReceiptStatus',
    update: 'updateHandReceiptStatus',
    delete: 'deleteHandReceiptStatus',
    root: {
      get: 'getHandReceiptStatus',
      list: 'listHandReceiptStatuses',
      create: 'createHandReceiptStatus',
      update: 'updateHandReceiptStatus',
      delete: 'deleteHandReceiptStatus'
    },
    fields: ['id', 'receiptNumber', 'status', 'fromUIC', 'toSoldierID', 'equipmentItemID', 'issuedOn', 'returnedOn', 'pdfS3Key', 'createdAt', 'updatedAt']
  },
  AccountabilitySession: {
    get: 'getAccountabilitySession',
    list: 'listAccountabilitySessions',
    create: 'createAccountabilitySession',
    update: 'updateAccountabilitySession',
    delete: 'deleteAccountabilitySession',
    root: {
      get: 'getAccountabilitySession',
      list: 'listAccountabilitySessions',
      create: 'createAccountabilitySession',
      update: 'updateAccountabilitySession',
      delete: 'deleteAccountabilitySession'
    },
    fields: ['id', 'uicID', 'conductedByID', 'status', 'startedAt', 'completedAt', 'itemCount', 'accountedForCount', 'createdAt', 'updatedAt']
  },
  AccountabilityItem: {
    get: 'getAccountabilityItem',
    list: 'listAccountabilityItems',
    create: 'createAccountabilityItem',
    update: 'updateAccountabilityItem',
    delete: 'deleteAccountabilityItem',
    root: {
      get: 'getAccountabilityItem',
      list: 'listAccountabilityItems',
      create: 'createAccountabilityItem',
      update: 'updateAccountabilityItem',
      delete: 'deleteAccountabilityItem'
    },
    fields: [
      'id',
      'sessionID',
      'equipmentItemID',
      'status',
      'verificationMethod',
      'verifiedByID',
      'verifiedAt',
      'confirmationStatus',
      'confirmedAt',
      'notes',
      'createdAt',
      'updatedAt'
    ]
  },
  AdditionalUIC: {
    get: 'getAdditionalUIC',
    list: 'listAdditionalUICS',
    create: 'createAdditionalUIC',
    update: 'updateAdditionalUIC',
    delete: 'deleteAdditionalUIC',
    root: {
      get: 'getAdditionalUIC',
      list: 'listAdditionalUICS',
      create: 'createAdditionalUIC',
      update: 'updateAdditionalUIC',
      delete: 'deleteAdditionalUIC'
    },
    fields: ['id', 'userID', 'uicID', 'status', 'createdAt', 'updatedAt']
  },
  AccountabilityCheckInEvent: {
    get: 'getAccountabilityCheckInEvent',
    list: 'listAccountabilityCheckInEvents',
    create: 'createAccountabilityCheckInEvent',
    update: 'updateAccountabilityCheckInEvent',
    delete: 'deleteAccountabilityCheckInEvent',
    root: {
      get: 'getAccountabilityCheckInEvent',
      list: 'listAccountabilityCheckInEvents',
      create: 'createAccountabilityCheckInEvent',
      update: 'updateAccountabilityCheckInEvent',
      delete: 'deleteAccountabilityCheckInEvent'
    },
    fields: [
      'id',
      'clientMutationId',
      'deviceId',
      'uicID',
      'sessionID',
      'accountabilityItemID',
      'equipmentItemID',
      'snapshotToken',
      'status',
      'verificationMethod',
      'verifiedByID',
      'verifiedAt',
      'notes',
      'conflictStatus',
      'conflictReason',
      'appliedAt',
      'createdAt',
      'updatedAt'
    ]
  }
};

function modelName(ModelOrInstance) {
  return ModelOrInstance?.modelName || ModelOrInstance?.constructor?.modelName || ModelOrInstance?.__modelName || ModelOrInstance?.name;
}

function makeExpression(filter) {
  const expr = {
    filter,
    and(next) {
      return makeExpression({ and: [filter, expressionFilter(next)] });
    },
    or(next) {
      return makeExpression({ or: [filter, expressionFilter(next)] });
    }
  };
  return expr;
}

function fieldExpression(field) {
  const sortAccessor = direction => ({ field, direction });
  sortAccessor.eq = value => makeExpression({ [field]: { eq: value } });
  sortAccessor.ne = value => makeExpression({ [field]: { ne: value } });
  sortAccessor.in = value => makeExpression({ [field]: { in: value } });
  sortAccessor.contains = value => makeExpression({ [field]: { contains: value } });
  sortAccessor.beginsWith = value => makeExpression({ [field]: { beginsWith: value } });
  sortAccessor.attributeExists = value => makeExpression({ [field]: { attributeExists: value } });
  sortAccessor.gt = value => makeExpression({ [field]: { gt: value } });
  sortAccessor.ge = value => makeExpression({ [field]: { ge: value } });
  sortAccessor.lt = value => makeExpression({ [field]: { lt: value } });
  sortAccessor.le = value => makeExpression({ [field]: { le: value } });
  return sortAccessor;
}

function predicateBuilder() {
  return new Proxy({}, {
    get(_target, prop) {
      if (prop === 'or') {
        return callback => makeExpression({ or: callback(predicateBuilder()).map(expressionFilter) });
      }
      if (prop === 'and') {
        return callback => makeExpression({ and: callback(predicateBuilder()).map(expressionFilter) });
      }
      if (prop === 'syncStatus') {
        return () => makeExpression({});
      }
      return fieldExpression(prop);
    }
  });
}

function expressionFilter(expression) {
  return expression?.filter || expression || {};
}

function filterFromPredicate(predicate) {
  if (!predicate || typeof predicate !== 'function') return null;
  return expressionFilter(predicate(predicateBuilder()));
}

function sortFromOptions(options) {
  const sort = options?.sort;
  if (typeof sort !== 'function') return null;
  return sort(predicateBuilder());
}

function applySort(items, sortSpec) {
  if (!sortSpec?.field) return items;
  const direction = sortSpec.direction === SortDirection.DESCENDING ? -1 : 1;
  return [...items].sort((a, b) => {
    const left = a?.[sortSpec.field] ?? '';
    const right = b?.[sortSpec.field] ?? '';
    return String(left).localeCompare(String(right)) * direction;
  });
}

function operationDocument(source, operationName) {
  const operation = source[operationName] || customOperations[operationName];
  if (!operation) {
    throw new Error(`Missing GraphQL operation ${operationName}`);
  }
  return gql(operation);
}

function cleanInput(modelConfig, source, operation) {
  const clean = stripTypename(source);
  const allowed = new Set(modelConfig.fields);
  const input = {};

  for (const field of modelConfig.fields) {
    if (Object.prototype.hasOwnProperty.call(clean, field)) {
      input[field] = clean[field];
    }
  }

  if (operation !== 'create' && clean._version !== undefined) {
    input._version = clean._version;
  }

  if (clean.id && (operation !== 'create' || allowed.has('id'))) {
    input.id = clean.id;
  }

  return input;
}

async function query(Model, predicateOrId = null, options = {}) {
  const name = modelName(Model);
  const config = operationMap[name];
  if (!config) {
    throw new Error(`No GraphQL operation map for model ${name}`);
  }

  const client = await getApolloClient();

  if (typeof predicateOrId === 'string') {
    const result = await client.query({
      query: operationDocument(queries, config.get),
      variables: { id: predicateOrId },
      fetchPolicy: options.fetchPolicy || 'network-only'
    });
    return hydrateModel(Model, result.data?.[config.root.get]);
  }

  const filter = filterFromPredicate(predicateOrId);
  const limit = options?.limit || 1000;
  let nextToken = options?.nextToken || null;
  let items = [];

  do {
    const result = await client.query({
      query: operationDocument(queries, config.list),
      variables: {
        filter,
        limit,
        nextToken
      },
      fetchPolicy: options.fetchPolicy || 'network-only'
    });

    const connection = result.data?.[config.root.list] || {};
    items = items.concat(connection.items || []);
    nextToken = connection.nextToken;
  } while (nextToken && !options?.page);

  const hydrated = items.filter(item => item && item._deleted !== true).map(item => hydrateModel(Model, item));
  return applySort(hydrated, sortFromOptions(options));
}

async function save(modelInstance) {
  const name = modelName(modelInstance);
  const config = operationMap[name];
  if (!config) {
    throw new Error(`No GraphQL mutation map for model ${name}`);
  }

  const operation = modelInstance.__operation === 'update' || modelInstance._version !== undefined ? 'update' : 'create';
  const client = await getApolloClient();
  const result = await client.mutate({
    mutation: operationDocument(mutations, config[operation]),
    variables: {
      input: cleanInput(config, modelInstance, operation)
    }
  });

  return hydrateModel(modelInstance.constructor, result.data?.[config.root[operation]]);
}

async function remove(modelInstance) {
  const name = modelName(modelInstance);
  const config = operationMap[name];
  if (!config) {
    throw new Error(`No GraphQL delete map for model ${name}`);
  }

  const client = await getApolloClient();
  const input = { id: modelInstance.id };
  if (modelInstance._version !== undefined) {
    input._version = modelInstance._version;
  }

  const result = await client.mutate({
    mutation: operationDocument(mutations, config.delete),
    variables: { input }
  });

  return hydrateModel(modelInstance.constructor, result.data?.[config.root.delete]);
}

function observe(Model) {
  const name = modelName(Model);
  const createName = `onCreate${name}`;
  const updateName = `onUpdate${name}`;
  const deleteName = `onDelete${name}`;
  const available = [createName, updateName, deleteName].filter(key => subscriptions[key]);

  return {
    subscribe(observer = {}) {
      if (available.length === 0) {
        return { unsubscribe() {} };
      }

      const activeSubscriptions = available.map(operationName => {
        const subscription = getAmplifyClient().graphql({ query: subscriptions[operationName] });
        return subscription.subscribe({
          next: payload => {
            const root = Object.keys(payload?.data || {})[0];
            const element = payload?.data?.[root];
            observer.next?.({
              opType: operationName.includes('Create') ? 'INSERT' : operationName.includes('Delete') ? 'DELETE' : 'UPDATE',
              element: hydrateModel(Model, element)
            });
          },
          error: error => observer.error?.(error)
        });
      });

      return {
        unsubscribe() {
          activeSubscriptions.forEach(subscription => subscription.unsubscribe());
        }
      };
    }
  };
}

export const DataStore = {
  configure() {},
  async start() {},
  async stop() {},
  async clear() {},
  query,
  save,
  delete: remove,
  observe
};

export const __testing = {
  filterFromPredicate,
  sortFromOptions,
  cleanInput,
  operationMap
};

export default DataStore;
