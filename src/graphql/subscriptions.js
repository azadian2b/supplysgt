/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateUIC = /* GraphQL */ `
  subscription OnCreateUIC(
    $filter: ModelSubscriptionUICFilterInput
    $owner: String
  ) {
    onCreateUIC(filter: $filter, owner: $owner) {
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
export const onUpdateUIC = /* GraphQL */ `
  subscription OnUpdateUIC(
    $filter: ModelSubscriptionUICFilterInput
    $owner: String
  ) {
    onUpdateUIC(filter: $filter, owner: $owner) {
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
export const onDeleteUIC = /* GraphQL */ `
  subscription OnDeleteUIC(
    $filter: ModelSubscriptionUICFilterInput
    $owner: String
  ) {
    onDeleteUIC(filter: $filter, owner: $owner) {
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
export const onCreateUser = /* GraphQL */ `
  subscription OnCreateUser(
    $filter: ModelSubscriptionUserFilterInput
    $owner: String
  ) {
    onCreateUser(filter: $filter, owner: $owner) {
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
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onUpdateUser = /* GraphQL */ `
  subscription OnUpdateUser(
    $filter: ModelSubscriptionUserFilterInput
    $owner: String
  ) {
    onUpdateUser(filter: $filter, owner: $owner) {
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
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onDeleteUser = /* GraphQL */ `
  subscription OnDeleteUser(
    $filter: ModelSubscriptionUserFilterInput
    $owner: String
  ) {
    onDeleteUser(filter: $filter, owner: $owner) {
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
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onCreateUICMembershipRequest = /* GraphQL */ `
  subscription OnCreateUICMembershipRequest(
    $filter: ModelSubscriptionUICMembershipRequestFilterInput
    $userID: String
  ) {
    onCreateUICMembershipRequest(filter: $filter, userID: $userID) {
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
export const onUpdateUICMembershipRequest = /* GraphQL */ `
  subscription OnUpdateUICMembershipRequest(
    $filter: ModelSubscriptionUICMembershipRequestFilterInput
    $userID: String
  ) {
    onUpdateUICMembershipRequest(filter: $filter, userID: $userID) {
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
export const onDeleteUICMembershipRequest = /* GraphQL */ `
  subscription OnDeleteUICMembershipRequest(
    $filter: ModelSubscriptionUICMembershipRequestFilterInput
    $userID: String
  ) {
    onDeleteUICMembershipRequest(filter: $filter, userID: $userID) {
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
export const onCreateSoldier = /* GraphQL */ `
  subscription OnCreateSoldier(
    $filter: ModelSubscriptionSoldierFilterInput
    $uicID: String
  ) {
    onCreateSoldier(filter: $filter, uicID: $uicID) {
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
export const onUpdateSoldier = /* GraphQL */ `
  subscription OnUpdateSoldier(
    $filter: ModelSubscriptionSoldierFilterInput
    $uicID: String
  ) {
    onUpdateSoldier(filter: $filter, uicID: $uicID) {
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
export const onDeleteSoldier = /* GraphQL */ `
  subscription OnDeleteSoldier(
    $filter: ModelSubscriptionSoldierFilterInput
    $uicID: String
  ) {
    onDeleteSoldier(filter: $filter, uicID: $uicID) {
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
export const onCreateEquipmentMaster = /* GraphQL */ `
  subscription OnCreateEquipmentMaster(
    $filter: ModelSubscriptionEquipmentMasterFilterInput
  ) {
    onCreateEquipmentMaster(filter: $filter) {
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
export const onUpdateEquipmentMaster = /* GraphQL */ `
  subscription OnUpdateEquipmentMaster(
    $filter: ModelSubscriptionEquipmentMasterFilterInput
  ) {
    onUpdateEquipmentMaster(filter: $filter) {
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
export const onDeleteEquipmentMaster = /* GraphQL */ `
  subscription OnDeleteEquipmentMaster(
    $filter: ModelSubscriptionEquipmentMasterFilterInput
  ) {
    onDeleteEquipmentMaster(filter: $filter) {
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
export const onCreateEquipmentItem = /* GraphQL */ `
  subscription OnCreateEquipmentItem(
    $filter: ModelSubscriptionEquipmentItemFilterInput
  ) {
    onCreateEquipmentItem(filter: $filter) {
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
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onUpdateEquipmentItem = /* GraphQL */ `
  subscription OnUpdateEquipmentItem(
    $filter: ModelSubscriptionEquipmentItemFilterInput
  ) {
    onUpdateEquipmentItem(filter: $filter) {
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
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onDeleteEquipmentItem = /* GraphQL */ `
  subscription OnDeleteEquipmentItem(
    $filter: ModelSubscriptionEquipmentItemFilterInput
  ) {
    onDeleteEquipmentItem(filter: $filter) {
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
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const onCreateEquipmentGroup = /* GraphQL */ `
  subscription OnCreateEquipmentGroup(
    $filter: ModelSubscriptionEquipmentGroupFilterInput
  ) {
    onCreateEquipmentGroup(filter: $filter) {
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
export const onUpdateEquipmentGroup = /* GraphQL */ `
  subscription OnUpdateEquipmentGroup(
    $filter: ModelSubscriptionEquipmentGroupFilterInput
  ) {
    onUpdateEquipmentGroup(filter: $filter) {
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
export const onDeleteEquipmentGroup = /* GraphQL */ `
  subscription OnDeleteEquipmentGroup(
    $filter: ModelSubscriptionEquipmentGroupFilterInput
  ) {
    onDeleteEquipmentGroup(filter: $filter) {
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
export const onCreateHandReceiptStatus = /* GraphQL */ `
  subscription OnCreateHandReceiptStatus(
    $filter: ModelSubscriptionHandReceiptStatusFilterInput
  ) {
    onCreateHandReceiptStatus(filter: $filter) {
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
export const onUpdateHandReceiptStatus = /* GraphQL */ `
  subscription OnUpdateHandReceiptStatus(
    $filter: ModelSubscriptionHandReceiptStatusFilterInput
  ) {
    onUpdateHandReceiptStatus(filter: $filter) {
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
export const onDeleteHandReceiptStatus = /* GraphQL */ `
  subscription OnDeleteHandReceiptStatus(
    $filter: ModelSubscriptionHandReceiptStatusFilterInput
  ) {
    onDeleteHandReceiptStatus(filter: $filter) {
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
