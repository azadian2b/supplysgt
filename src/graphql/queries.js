/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getUIC = /* GraphQL */ `
  query GetUIC($id: ID!) {
    getUIC(id: $id) {
      id
      uicCode
      name
      members {
        nextToken
        startedAt
        __typename
      }
      membershipRequests {
        nextToken
        startedAt
        __typename
      }
      soldiers {
        nextToken
        startedAt
        __typename
      }
      equipmentItems {
        nextToken
        startedAt
        __typename
      }
      equipmentGroups {
        nextToken
        startedAt
        __typename
      }
      handReceiptStatuses {
        nextToken
        startedAt
        __typename
      }
      accountabilitySessions {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
      __typename
    }
  }
`;
export const listUICS = /* GraphQL */ `
  query ListUICS(
    $filter: ModelUICFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUICS(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        uicCode
        name
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const syncUICS = /* GraphQL */ `
  query SyncUICS(
    $filter: ModelUICFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncUICS(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        uicCode
        name
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const getUser = /* GraphQL */ `
  query GetUser($id: ID!) {
    getUser(id: $id) {
      id
      owner
      firstName
      lastName
      rank
      role
      uicID
      uic {
        id
        uicCode
        name
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      membershipRequests {
        nextToken
        startedAt
        __typename
      }
      linkedSoldierId
      soldiersLinked {
        nextToken
        startedAt
        __typename
      }
      conductedSessions {
        nextToken
        startedAt
        __typename
      }
      verifiedItems {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const listUsers = /* GraphQL */ `
  query ListUsers(
    $filter: ModelUserFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUsers(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        owner
        firstName
        lastName
        rank
        role
        uicID
        linkedSoldierId
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
export const syncUsers = /* GraphQL */ `
  query SyncUsers(
    $filter: ModelUserFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncUsers(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        owner
        firstName
        lastName
        rank
        role
        uicID
        linkedSoldierId
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
export const getUICMembershipRequest = /* GraphQL */ `
  query GetUICMembershipRequest($id: ID!) {
    getUICMembershipRequest(id: $id) {
      id
      userID
      uicID
      user {
        id
        owner
        firstName
        lastName
        rank
        role
        uicID
        linkedSoldierId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      uic {
        id
        uicCode
        name
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      requestedRole
      status
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const listUICMembershipRequests = /* GraphQL */ `
  query ListUICMembershipRequests(
    $filter: ModelUICMembershipRequestFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUICMembershipRequests(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userID
        uicID
        requestedRole
        status
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
export const syncUICMembershipRequests = /* GraphQL */ `
  query SyncUICMembershipRequests(
    $filter: ModelUICMembershipRequestFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncUICMembershipRequests(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        userID
        uicID
        requestedRole
        status
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
export const getSoldier = /* GraphQL */ `
  query GetSoldier($id: ID!) {
    getSoldier(id: $id) {
      id
      firstName
      lastName
      rank
      email
      phone
      uicID
      uic {
        id
        uicCode
        name
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      role
      userId
      user {
        id
        owner
        firstName
        lastName
        rank
        role
        uicID
        linkedSoldierId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      hasAccount
      assignedEquipmentItems {
        nextToken
        startedAt
        __typename
      }
      assignedEquipmentGroups {
        nextToken
        startedAt
        __typename
      }
      handReceiptStatuses {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const listSoldiers = /* GraphQL */ `
  query ListSoldiers(
    $filter: ModelSoldierFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listSoldiers(filter: $filter, limit: $limit, nextToken: $nextToken) {
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
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const syncSoldiers = /* GraphQL */ `
  query SyncSoldiers(
    $filter: ModelSoldierFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncSoldiers(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
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
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const getEquipmentMaster = /* GraphQL */ `
  query GetEquipmentMaster($id: ID!) {
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
      equipmentItems {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const listEquipmentMasters = /* GraphQL */ `
  query ListEquipmentMasters(
    $filter: ModelEquipmentMasterFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listEquipmentMasters(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
export const syncEquipmentMasters = /* GraphQL */ `
  query SyncEquipmentMasters(
    $filter: ModelEquipmentMasterFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncEquipmentMasters(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
export const getEquipmentItem = /* GraphQL */ `
  query GetEquipmentItem($id: ID!) {
    getEquipmentItem(id: $id) {
      id
      uicID
      uic {
        id
        uicCode
        name
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      equipmentMasterID
      equipmentMaster {
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
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nsn
      lin
      serialNumber
      stockNumber
      location
      assignedToID
      assignedTo {
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
        __typename
      }
      maintenanceStatus
      isPartOfGroup
      groupID
      equipmentGroup {
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
        __typename
      }
      handReceiptStatuses {
        nextToken
        startedAt
        __typename
      }
      accountabilityItems {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const listEquipmentItems = /* GraphQL */ `
  query ListEquipmentItems(
    $filter: ModelEquipmentItemFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listEquipmentItems(filter: $filter, limit: $limit, nextToken: $nextToken) {
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
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const syncEquipmentItems = /* GraphQL */ `
  query SyncEquipmentItems(
    $filter: ModelEquipmentItemFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncEquipmentItems(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
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
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const getEquipmentGroup = /* GraphQL */ `
  query GetEquipmentGroup($id: ID!) {
    getEquipmentGroup(id: $id) {
      id
      name
      description
      uicID
      uic {
        id
        uicCode
        name
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      equipmentItems {
        nextToken
        startedAt
        __typename
      }
      assignedToID
      assignedTo {
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
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const listEquipmentGroups = /* GraphQL */ `
  query ListEquipmentGroups(
    $filter: ModelEquipmentGroupFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listEquipmentGroups(filter: $filter, limit: $limit, nextToken: $nextToken) {
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
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const syncEquipmentGroups = /* GraphQL */ `
  query SyncEquipmentGroups(
    $filter: ModelEquipmentGroupFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncEquipmentGroups(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
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
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const getHandReceiptStatus = /* GraphQL */ `
  query GetHandReceiptStatus($id: ID!) {
    getHandReceiptStatus(id: $id) {
      id
      receiptNumber
      status
      fromUIC
      uic {
        id
        uicCode
        name
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      toSoldierID
      soldier {
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
        __typename
      }
      equipmentItemID
      equipmentItem {
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
        __typename
      }
      issuedOn
      returnedOn
      pdfS3Key
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const listHandReceiptStatuses = /* GraphQL */ `
  query ListHandReceiptStatuses(
    $filter: ModelHandReceiptStatusFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listHandReceiptStatuses(
      filter: $filter
      limit: $limit
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
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const syncHandReceiptStatuses = /* GraphQL */ `
  query SyncHandReceiptStatuses(
    $filter: ModelHandReceiptStatusFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncHandReceiptStatuses(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
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
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const getAccountabilitySession = /* GraphQL */ `
  query GetAccountabilitySession($id: ID!) {
    getAccountabilitySession(id: $id) {
      id
      uicID
      uic {
        id
        uicCode
        name
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      conductedByID
      conductedBy {
        id
        owner
        firstName
        lastName
        rank
        role
        uicID
        linkedSoldierId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      status
      startedAt
      completedAt
      itemCount
      accountedForCount
      accountabilityItems {
        nextToken
        startedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const listAccountabilitySessions = /* GraphQL */ `
  query ListAccountabilitySessions(
    $filter: ModelAccountabilitySessionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listAccountabilitySessions(
      filter: $filter
      limit: $limit
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
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const syncAccountabilitySessions = /* GraphQL */ `
  query SyncAccountabilitySessions(
    $filter: ModelAccountabilitySessionFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncAccountabilitySessions(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
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
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const getAccountabilityItem = /* GraphQL */ `
  query GetAccountabilityItem($id: ID!) {
    getAccountabilityItem(id: $id) {
      id
      sessionID
      session {
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
        __typename
      }
      equipmentItemID
      equipmentItem {
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
        __typename
      }
      status
      verificationMethod
      verifiedByID
      verifiedBy {
        id
        owner
        firstName
        lastName
        rank
        role
        uicID
        linkedSoldierId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      verifiedAt
      confirmationStatus
      confirmedAt
      notes
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const listAccountabilityItems = /* GraphQL */ `
  query ListAccountabilityItems(
    $filter: ModelAccountabilityItemFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listAccountabilityItems(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
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
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const syncAccountabilityItems = /* GraphQL */ `
  query SyncAccountabilityItems(
    $filter: ModelAccountabilityItemFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncAccountabilityItems(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
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
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const uICSByUicCode = /* GraphQL */ `
  query UICSByUicCode(
    $uicCode: String!
    $sortDirection: ModelSortDirection
    $filter: ModelUICFilterInput
    $limit: Int
    $nextToken: String
  ) {
    uICSByUicCode(
      uicCode: $uicCode
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        uicCode
        name
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        owner
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const usersByOwner = /* GraphQL */ `
  query UsersByOwner(
    $owner: String!
    $sortDirection: ModelSortDirection
    $filter: ModelUserFilterInput
    $limit: Int
    $nextToken: String
  ) {
    usersByOwner(
      owner: $owner
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        owner
        firstName
        lastName
        rank
        role
        uicID
        linkedSoldierId
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
export const usersByUicID = /* GraphQL */ `
  query UsersByUicID(
    $uicID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelUserFilterInput
    $limit: Int
    $nextToken: String
  ) {
    usersByUicID(
      uicID: $uicID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        owner
        firstName
        lastName
        rank
        role
        uicID
        linkedSoldierId
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
export const uICMembershipRequestsByUserID = /* GraphQL */ `
  query UICMembershipRequestsByUserID(
    $userID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelUICMembershipRequestFilterInput
    $limit: Int
    $nextToken: String
  ) {
    uICMembershipRequestsByUserID(
      userID: $userID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userID
        uicID
        requestedRole
        status
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
export const uICMembershipRequestsByUicID = /* GraphQL */ `
  query UICMembershipRequestsByUicID(
    $uicID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelUICMembershipRequestFilterInput
    $limit: Int
    $nextToken: String
  ) {
    uICMembershipRequestsByUicID(
      uicID: $uicID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userID
        uicID
        requestedRole
        status
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
export const soldiersByUicID = /* GraphQL */ `
  query SoldiersByUicID(
    $uicID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelSoldierFilterInput
    $limit: Int
    $nextToken: String
  ) {
    soldiersByUicID(
      uicID: $uicID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
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
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const soldiersByUserId = /* GraphQL */ `
  query SoldiersByUserId(
    $userId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelSoldierFilterInput
    $limit: Int
    $nextToken: String
  ) {
    soldiersByUserId(
      userId: $userId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
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
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const equipmentMasterByNSN = /* GraphQL */ `
  query EquipmentMasterByNSN(
    $nsn: String!
    $sortDirection: ModelSortDirection
    $filter: ModelEquipmentMasterFilterInput
    $limit: Int
    $nextToken: String
  ) {
    equipmentMasterByNSN(
      nsn: $nsn
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
export const equipmentItemsByUicID = /* GraphQL */ `
  query EquipmentItemsByUicID(
    $uicID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelEquipmentItemFilterInput
    $limit: Int
    $nextToken: String
  ) {
    equipmentItemsByUicID(
      uicID: $uicID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
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
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const equipmentItemsByEquipmentMasterID = /* GraphQL */ `
  query EquipmentItemsByEquipmentMasterID(
    $equipmentMasterID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelEquipmentItemFilterInput
    $limit: Int
    $nextToken: String
  ) {
    equipmentItemsByEquipmentMasterID(
      equipmentMasterID: $equipmentMasterID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
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
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const equipmentItemsByAssignedToID = /* GraphQL */ `
  query EquipmentItemsByAssignedToID(
    $assignedToID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelEquipmentItemFilterInput
    $limit: Int
    $nextToken: String
  ) {
    equipmentItemsByAssignedToID(
      assignedToID: $assignedToID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
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
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const equipmentItemsByGroupID = /* GraphQL */ `
  query EquipmentItemsByGroupID(
    $groupID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelEquipmentItemFilterInput
    $limit: Int
    $nextToken: String
  ) {
    equipmentItemsByGroupID(
      groupID: $groupID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
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
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const equipmentGroupsByUicID = /* GraphQL */ `
  query EquipmentGroupsByUicID(
    $uicID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelEquipmentGroupFilterInput
    $limit: Int
    $nextToken: String
  ) {
    equipmentGroupsByUicID(
      uicID: $uicID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
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
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const equipmentGroupsByAssignedToID = /* GraphQL */ `
  query EquipmentGroupsByAssignedToID(
    $assignedToID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelEquipmentGroupFilterInput
    $limit: Int
    $nextToken: String
  ) {
    equipmentGroupsByAssignedToID(
      assignedToID: $assignedToID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
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
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const handReceiptStatusesByReceiptNumber = /* GraphQL */ `
  query HandReceiptStatusesByReceiptNumber(
    $receiptNumber: String!
    $sortDirection: ModelSortDirection
    $filter: ModelHandReceiptStatusFilterInput
    $limit: Int
    $nextToken: String
  ) {
    handReceiptStatusesByReceiptNumber(
      receiptNumber: $receiptNumber
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
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
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const handReceiptStatusesByFromUIC = /* GraphQL */ `
  query HandReceiptStatusesByFromUIC(
    $fromUIC: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelHandReceiptStatusFilterInput
    $limit: Int
    $nextToken: String
  ) {
    handReceiptStatusesByFromUIC(
      fromUIC: $fromUIC
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
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
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const handReceiptStatusesByToSoldierID = /* GraphQL */ `
  query HandReceiptStatusesByToSoldierID(
    $toSoldierID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelHandReceiptStatusFilterInput
    $limit: Int
    $nextToken: String
  ) {
    handReceiptStatusesByToSoldierID(
      toSoldierID: $toSoldierID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
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
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const handReceiptStatusesByEquipmentItemID = /* GraphQL */ `
  query HandReceiptStatusesByEquipmentItemID(
    $equipmentItemID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelHandReceiptStatusFilterInput
    $limit: Int
    $nextToken: String
  ) {
    handReceiptStatusesByEquipmentItemID(
      equipmentItemID: $equipmentItemID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
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
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const accountabilitySessionsByUicID = /* GraphQL */ `
  query AccountabilitySessionsByUicID(
    $uicID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelAccountabilitySessionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    accountabilitySessionsByUicID(
      uicID: $uicID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
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
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const accountabilitySessionsByConductedByID = /* GraphQL */ `
  query AccountabilitySessionsByConductedByID(
    $conductedByID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelAccountabilitySessionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    accountabilitySessionsByConductedByID(
      conductedByID: $conductedByID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
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
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const accountabilityItemsBySessionID = /* GraphQL */ `
  query AccountabilityItemsBySessionID(
    $sessionID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelAccountabilityItemFilterInput
    $limit: Int
    $nextToken: String
  ) {
    accountabilityItemsBySessionID(
      sessionID: $sessionID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        sessionID
        equipmentItemID
        equipmentItem {
          id
          nsn
          lin
          serialNumber
          stockNumber
          assignedToID
          equipmentMasterID
          equipmentMaster {
            id
            commonName
            __typename
          }
          __typename
        }
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
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const accountabilityItemsByEquipmentItemID = /* GraphQL */ `
  query AccountabilityItemsByEquipmentItemID(
    $equipmentItemID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelAccountabilityItemFilterInput
    $limit: Int
    $nextToken: String
  ) {
    accountabilityItemsByEquipmentItemID(
      equipmentItemID: $equipmentItemID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
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
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const accountabilityItemsByVerifiedByID = /* GraphQL */ `
  query AccountabilityItemsByVerifiedByID(
    $verifiedByID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelAccountabilityItemFilterInput
    $limit: Int
    $nextToken: String
  ) {
    accountabilityItemsByVerifiedByID(
      verifiedByID: $verifiedByID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
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
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const getHandReceiptedEquipment = /* GraphQL */ `
  query GetHandReceiptedEquipment($uicID: ID!) {
    handReceiptStatusesByFromUIC(
      fromUIC: $uicID
      filter: { status: { eq: ISSUED } }
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
        soldier {
          id
          firstName
          lastName
          rank
          role
        }
        equipmentItem {
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
          assignedTo {
            id
            firstName
            lastName
            rank
            role
          }
          equipmentGroup {
            id
            name
            description
            assignedToID
          }
          equipmentMaster {
            id
            nsn
            commonName
            description
          }
        }
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
    }
  }
`;
