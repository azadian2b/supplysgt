/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createUIC = /* GraphQL */ `
  mutation CreateUIC(
    $input: CreateUICInput!
    $condition: ModelUICConditionInput
  ) {
    createUIC(input: $input, condition: $condition) {
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
export const updateUIC = /* GraphQL */ `
  mutation UpdateUIC(
    $input: UpdateUICInput!
    $condition: ModelUICConditionInput
  ) {
    updateUIC(input: $input, condition: $condition) {
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
export const deleteUIC = /* GraphQL */ `
  mutation DeleteUIC(
    $input: DeleteUICInput!
    $condition: ModelUICConditionInput
  ) {
    deleteUIC(input: $input, condition: $condition) {
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
export const createUser = /* GraphQL */ `
  mutation CreateUser(
    $input: CreateUserInput!
    $condition: ModelUserConditionInput
  ) {
    createUser(input: $input, condition: $condition) {
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
export const updateUser = /* GraphQL */ `
  mutation UpdateUser(
    $input: UpdateUserInput!
    $condition: ModelUserConditionInput
  ) {
    updateUser(input: $input, condition: $condition) {
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
export const deleteUser = /* GraphQL */ `
  mutation DeleteUser(
    $input: DeleteUserInput!
    $condition: ModelUserConditionInput
  ) {
    deleteUser(input: $input, condition: $condition) {
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
export const createUICMembershipRequest = /* GraphQL */ `
  mutation CreateUICMembershipRequest(
    $input: CreateUICMembershipRequestInput!
    $condition: ModelUICMembershipRequestConditionInput
  ) {
    createUICMembershipRequest(input: $input, condition: $condition) {
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
export const updateUICMembershipRequest = /* GraphQL */ `
  mutation UpdateUICMembershipRequest(
    $input: UpdateUICMembershipRequestInput!
    $condition: ModelUICMembershipRequestConditionInput
  ) {
    updateUICMembershipRequest(input: $input, condition: $condition) {
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
export const deleteUICMembershipRequest = /* GraphQL */ `
  mutation DeleteUICMembershipRequest(
    $input: DeleteUICMembershipRequestInput!
    $condition: ModelUICMembershipRequestConditionInput
  ) {
    deleteUICMembershipRequest(input: $input, condition: $condition) {
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
export const createSoldier = /* GraphQL */ `
  mutation CreateSoldier(
    $input: CreateSoldierInput!
    $condition: ModelSoldierConditionInput
  ) {
    createSoldier(input: $input, condition: $condition) {
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
export const updateSoldier = /* GraphQL */ `
  mutation UpdateSoldier(
    $input: UpdateSoldierInput!
    $condition: ModelSoldierConditionInput
  ) {
    updateSoldier(input: $input, condition: $condition) {
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
export const deleteSoldier = /* GraphQL */ `
  mutation DeleteSoldier(
    $input: DeleteSoldierInput!
    $condition: ModelSoldierConditionInput
  ) {
    deleteSoldier(input: $input, condition: $condition) {
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
export const createEquipmentMaster = /* GraphQL */ `
  mutation CreateEquipmentMaster(
    $input: CreateEquipmentMasterInput!
    $condition: ModelEquipmentMasterConditionInput
  ) {
    createEquipmentMaster(input: $input, condition: $condition) {
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
export const updateEquipmentMaster = /* GraphQL */ `
  mutation UpdateEquipmentMaster(
    $input: UpdateEquipmentMasterInput!
    $condition: ModelEquipmentMasterConditionInput
  ) {
    updateEquipmentMaster(input: $input, condition: $condition) {
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
export const deleteEquipmentMaster = /* GraphQL */ `
  mutation DeleteEquipmentMaster(
    $input: DeleteEquipmentMasterInput!
    $condition: ModelEquipmentMasterConditionInput
  ) {
    deleteEquipmentMaster(input: $input, condition: $condition) {
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
export const createEquipmentItem = /* GraphQL */ `
  mutation CreateEquipmentItem(
    $input: CreateEquipmentItemInput!
    $condition: ModelEquipmentItemConditionInput
  ) {
    createEquipmentItem(input: $input, condition: $condition) {
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
export const updateEquipmentItem = /* GraphQL */ `
  mutation UpdateEquipmentItem(
    $input: UpdateEquipmentItemInput!
    $condition: ModelEquipmentItemConditionInput
  ) {
    updateEquipmentItem(input: $input, condition: $condition) {
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
export const deleteEquipmentItem = /* GraphQL */ `
  mutation DeleteEquipmentItem(
    $input: DeleteEquipmentItemInput!
    $condition: ModelEquipmentItemConditionInput
  ) {
    deleteEquipmentItem(input: $input, condition: $condition) {
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
export const createEquipmentGroup = /* GraphQL */ `
  mutation CreateEquipmentGroup(
    $input: CreateEquipmentGroupInput!
    $condition: ModelEquipmentGroupConditionInput
  ) {
    createEquipmentGroup(input: $input, condition: $condition) {
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
export const updateEquipmentGroup = /* GraphQL */ `
  mutation UpdateEquipmentGroup(
    $input: UpdateEquipmentGroupInput!
    $condition: ModelEquipmentGroupConditionInput
  ) {
    updateEquipmentGroup(input: $input, condition: $condition) {
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
export const deleteEquipmentGroup = /* GraphQL */ `
  mutation DeleteEquipmentGroup(
    $input: DeleteEquipmentGroupInput!
    $condition: ModelEquipmentGroupConditionInput
  ) {
    deleteEquipmentGroup(input: $input, condition: $condition) {
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
export const createHandReceiptStatus = /* GraphQL */ `
  mutation CreateHandReceiptStatus(
    $input: CreateHandReceiptStatusInput!
    $condition: ModelHandReceiptStatusConditionInput
  ) {
    createHandReceiptStatus(input: $input, condition: $condition) {
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
export const updateHandReceiptStatus = /* GraphQL */ `
  mutation UpdateHandReceiptStatus(
    $input: UpdateHandReceiptStatusInput!
    $condition: ModelHandReceiptStatusConditionInput
  ) {
    updateHandReceiptStatus(input: $input, condition: $condition) {
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
export const deleteHandReceiptStatus = /* GraphQL */ `
  mutation DeleteHandReceiptStatus(
    $input: DeleteHandReceiptStatusInput!
    $condition: ModelHandReceiptStatusConditionInput
  ) {
    deleteHandReceiptStatus(input: $input, condition: $condition) {
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
export const createAccountabilitySession = /* GraphQL */ `
  mutation CreateAccountabilitySession(
    $input: CreateAccountabilitySessionInput!
    $condition: ModelAccountabilitySessionConditionInput
  ) {
    createAccountabilitySession(input: $input, condition: $condition) {
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
export const updateAccountabilitySession = /* GraphQL */ `
  mutation UpdateAccountabilitySession(
    $input: UpdateAccountabilitySessionInput!
    $condition: ModelAccountabilitySessionConditionInput
  ) {
    updateAccountabilitySession(input: $input, condition: $condition) {
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
export const deleteAccountabilitySession = /* GraphQL */ `
  mutation DeleteAccountabilitySession(
    $input: DeleteAccountabilitySessionInput!
    $condition: ModelAccountabilitySessionConditionInput
  ) {
    deleteAccountabilitySession(input: $input, condition: $condition) {
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
export const createAccountabilityItem = /* GraphQL */ `
  mutation CreateAccountabilityItem(
    $input: CreateAccountabilityItemInput!
    $condition: ModelAccountabilityItemConditionInput
  ) {
    createAccountabilityItem(input: $input, condition: $condition) {
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
export const updateAccountabilityItem = /* GraphQL */ `
  mutation UpdateAccountabilityItem(
    $input: UpdateAccountabilityItemInput!
    $condition: ModelAccountabilityItemConditionInput
  ) {
    updateAccountabilityItem(input: $input, condition: $condition) {
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
export const deleteAccountabilityItem = /* GraphQL */ `
  mutation DeleteAccountabilityItem(
    $input: DeleteAccountabilityItemInput!
    $condition: ModelAccountabilityItemConditionInput
  ) {
    deleteAccountabilityItem(input: $input, condition: $condition) {
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
