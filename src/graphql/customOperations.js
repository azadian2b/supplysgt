export const getUICCreationRequest = /* GraphQL */ `
  query GetUICCreationRequest($id: ID!) {
    getUICCreationRequest(id: $id) {
      id
      requestedBy
      uicCode
      uicName
      status
      createdAt
      approvedBy
      approvedAt
      rejectionReason
      createdUIC
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;

export const listUICCreationRequests = /* GraphQL */ `
  query ListUICCreationRequests($filter: ModelUICCreationRequestFilterInput, $limit: Int, $nextToken: String) {
    listUICCreationRequests(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        requestedBy
        uicCode
        uicName
        status
        createdAt
        approvedBy
        approvedAt
        rejectionReason
        createdUIC
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;

export const createUICCreationRequest = /* GraphQL */ `
  mutation CreateUICCreationRequest($input: CreateUICCreationRequestInput!, $condition: ModelUICCreationRequestConditionInput) {
    createUICCreationRequest(input: $input, condition: $condition) {
      id
      requestedBy
      uicCode
      uicName
      status
      createdAt
      approvedBy
      approvedAt
      rejectionReason
      createdUIC
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;

export const updateUICCreationRequest = /* GraphQL */ `
  mutation UpdateUICCreationRequest($input: UpdateUICCreationRequestInput!, $condition: ModelUICCreationRequestConditionInput) {
    updateUICCreationRequest(input: $input, condition: $condition) {
      id
      requestedBy
      uicCode
      uicName
      status
      createdAt
      approvedBy
      approvedAt
      rejectionReason
      createdUIC
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;

export const deleteUICCreationRequest = /* GraphQL */ `
  mutation DeleteUICCreationRequest($input: DeleteUICCreationRequestInput!, $condition: ModelUICCreationRequestConditionInput) {
    deleteUICCreationRequest(input: $input, condition: $condition) {
      id
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;

export const createAccountabilityCheckInEvent = /* GraphQL */ `
  mutation CreateAccountabilityCheckInEvent($input: CreateAccountabilityCheckInEventInput!, $condition: ModelAccountabilityCheckInEventConditionInput) {
    createAccountabilityCheckInEvent(input: $input, condition: $condition) {
      id
      clientMutationId
      deviceId
      uicID
      sessionID
      accountabilityItemID
      equipmentItemID
      snapshotToken
      status
      verificationMethod
      verifiedByID
      verifiedAt
      notes
      conflictStatus
      conflictReason
      appliedAt
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;

export const updateAccountabilityCheckInEvent = /* GraphQL */ `
  mutation UpdateAccountabilityCheckInEvent($input: UpdateAccountabilityCheckInEventInput!, $condition: ModelAccountabilityCheckInEventConditionInput) {
    updateAccountabilityCheckInEvent(input: $input, condition: $condition) {
      id
      clientMutationId
      deviceId
      uicID
      sessionID
      accountabilityItemID
      equipmentItemID
      snapshotToken
      status
      verificationMethod
      verifiedByID
      verifiedAt
      notes
      conflictStatus
      conflictReason
      appliedAt
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;

export const getAccountabilityCheckInEvent = /* GraphQL */ `
  query GetAccountabilityCheckInEvent($id: ID!) {
    getAccountabilityCheckInEvent(id: $id) {
      id
      clientMutationId
      deviceId
      uicID
      sessionID
      accountabilityItemID
      equipmentItemID
      snapshotToken
      status
      verificationMethod
      verifiedByID
      verifiedAt
      notes
      conflictStatus
      conflictReason
      appliedAt
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;

export const listAccountabilityCheckInEvents = /* GraphQL */ `
  query ListAccountabilityCheckInEvents($filter: ModelAccountabilityCheckInEventFilterInput, $limit: Int, $nextToken: String) {
    listAccountabilityCheckInEvents(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        clientMutationId
        deviceId
        uicID
        sessionID
        accountabilityItemID
        equipmentItemID
        snapshotToken
        status
        verificationMethod
        verifiedByID
        verifiedAt
        notes
        conflictStatus
        conflictReason
        appliedAt
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;

export const deleteAccountabilityCheckInEvent = /* GraphQL */ `
  mutation DeleteAccountabilityCheckInEvent($input: DeleteAccountabilityCheckInEventInput!, $condition: ModelAccountabilityCheckInEventConditionInput) {
    deleteAccountabilityCheckInEvent(input: $input, condition: $condition) {
      id
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
