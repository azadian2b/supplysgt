import { defineData } from '@aws-amplify/backend';
import type { Backend } from '../backend';

const schema = `type UIC @model
@auth(rules: [
  { allow: private },
  { allow: owner, operations: [read] }
]) {
  id: ID!
  uicCode: String! @index # Add this field for the 6-character code
  name: String!
  members: [User] @hasMany(indexName: "byUIC", fields: ["id"])
  membershipRequests: [UICMembershipRequest] @hasMany(indexName: "byUIC", fields: ["id"])
  soldiers: [Soldier] @hasMany(indexName: "byUIC", fields: ["id"])
  equipmentItems: [EquipmentItem] @hasMany(indexName: "byUIC", fields: ["id"])
  equipmentGroups: [EquipmentGroup] @hasMany(indexName: "byUIC", fields: ["id"])
  handReceiptStatuses: [HandReceiptStatus] @hasMany(indexName: "byFromUIC", fields: ["id"])
  accountabilitySessions: [AccountabilitySession] @hasMany(indexName: "byUIC", fields: ["id"])
  # Add relationship for additional UICs
  additionalUICs: [AdditionalUIC] @hasMany(indexName: "byUIC", fields: ["id"])
  _deleted: Boolean
  _version: Int
  _lastChangedAt: AWSTimestamp
}

type User @model
@auth(rules: [
  { allow: owner },
  { allow: private, operations: [read] }
]) {
  id: ID!
  owner: String! @index(name: "byOwner")
  firstName: String!
  lastName: String!
  rank: String!
  role: Role!
  uicID: ID @index(name: "byUIC")
  uic: UIC @belongsTo(fields: ["uicID"])
  # Add this field to establish the relationship with UICMembershipRequest
  membershipRequests: [UICMembershipRequest] @hasMany(indexName: "byUser", fields: ["id"])
  # Add relationship for UICCreationRequest
  uicCreationRequests: [UICCreationRequest] @hasMany(indexName: "byUser", fields: ["id"])
  # To avoid circular dependency, we'll just store the ID without @belongsTo
  linkedSoldierId: ID
  # Add a field to let us look up Users from Soldiers
  soldiersLinked: [Soldier] @hasMany(indexName: "byUser", fields: ["id"])
  conductedSessions: [AccountabilitySession] @hasMany(indexName: "byConductedBy", fields: ["id"])
  verifiedItems: [AccountabilityItem] @hasMany(indexName: "byVerifiedBy", fields: ["id"])
  # Add field for additional UICs that supply sergeants can work with
  additionalUICs: [AdditionalUIC] @hasMany(indexName: "byUser", fields: ["id"])
  _deleted: Boolean
  _version: Int
  _lastChangedAt: AWSTimestamp
}

type UICMembershipRequest @model
@auth(rules: [
  { allow: owner, ownerField: "userID" },
  { allow: private }
]) {
  id: ID!
  userID: ID! @index(name: "byUser")
  uicID: ID! @index(name: "byUIC")
  user: User @belongsTo(fields: ["userID"])
  uic: UIC @belongsTo(fields: ["uicID"])
  requestedRole: Role!
  status: RequestStatus!
  createdAt: AWSDateTime!
  approvedBy: ID
  approvedAt: AWSDateTime
  rejectionReason: String
  _deleted: Boolean
  _version: Int
  _lastChangedAt: AWSTimestamp
}

type UICCreationRequest @model
@auth(rules: [
  { allow: owner, ownerField: "requestedBy" },
  { allow: private }
]) {
  id: ID!
  requestedBy: ID! @index(name: "byUser")
  user: User @belongsTo(fields: ["requestedBy"])
  uicCode: String!
  uicName: String!
  status: RequestStatus!
  createdAt: AWSDateTime!
  approvedBy: ID
  approvedAt: AWSDateTime
  rejectionReason: String
  createdUIC: ID
  _deleted: Boolean
  _version: Int
  _lastChangedAt: AWSTimestamp
}

# New Soldier model for tracking all soldiers in a UIC
type Soldier @model
@auth(rules: [
  { allow: private },
  { allow: owner, ownerField: "uicID", operations: [read] }
]) {
  id: ID!
  firstName: String!
  lastName: String!
  rank: String
  email: String
  phone: String
  uicID: ID! @index(name: "byUIC")
  uic: UIC @belongsTo(fields: ["uicID"])
  role: Role!
  userId: ID @index(name: "byUser") # Added index for relationship
  user: User @belongsTo(fields: ["userId"]) # Keep this relationship
  hasAccount: Boolean! # Flag to indicate if the soldier has an app account
  assignedEquipmentItems: [EquipmentItem] @hasMany(indexName: "byAssignedTo", fields: ["id"])
  assignedEquipmentGroups: [EquipmentGroup] @hasMany(indexName: "byAssignedTo", fields: ["id"])
  handReceiptStatuses: [HandReceiptStatus] @hasMany(indexName: "byToSoldier", fields: ["id"])
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  _deleted: Boolean
  _version: Int
  _lastChangedAt: AWSTimestamp
}

enum Role {
  COMMANDER
  SUPPLY_SERGEANT
  FIRST_SERGEANT
  SOLDIER
  PENDING
}

enum RequestStatus {
  PENDING
  APPROVED
  REJECTED
}

# Equipment Master Item definition
type EquipmentMaster @model
@auth(rules: [
  { allow: private }
]) {
  id: ID!
  nsn: String! @index(name: "byNSN", queryField: "equipmentMasterByNSN")
  commonName: String!
  description: String
  tmNumber: String
  isSerialTracked: Boolean!
  isSensitiveItem: Boolean!
  isConsumable: Boolean!
  isCyclicInventory: Boolean!
  isSensitiveInventory: Boolean!
  storageRestrictions: String
  maintenanceSchedule: String
  imageKey: String  # S3 Storage key for the item image
  subComponents: [String]  # Array of NSNs for related components
  equipmentItems: [EquipmentItem] @hasMany(indexName: "byEquipmentMaster", fields: ["id"])
  _deleted: Boolean
  _version: Int
  _lastChangedAt: AWSTimestamp
}

# Specific Equipment Items based on the master item
type EquipmentItem @model
@auth(rules: [
  { allow: private }
]) {
  id: ID!
  uicID: ID! @index(name: "byUIC")
  uic: UIC @belongsTo(fields: ["uicID"])
  equipmentMasterID: ID! @index(name: "byEquipmentMaster")
  equipmentMaster: EquipmentMaster @belongsTo(fields: ["equipmentMasterID"])
  nsn: String!  # We'll still store the NSN for easier reference
  lin: String!
  serialNumber: String
  stockNumber: String
  location: String
  assignedToID: ID @index(name: "byAssignedTo")
  assignedTo: Soldier @belongsTo(fields: ["assignedToID"])
  maintenanceStatus: MaintenanceStatus
  isPartOfGroup: Boolean
  groupID: ID @index(name: "byEquipmentGroup")
  equipmentGroup: EquipmentGroup @belongsTo(fields: ["groupID"])
  handReceiptStatuses: [HandReceiptStatus] @hasMany(indexName: "byEquipmentItem", fields: ["id"])
  accountabilityItems: [AccountabilityItem] @hasMany(indexName: "byEquipmentItem", fields: ["id"])
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  _deleted: Boolean
  _version: Int
  _lastChangedAt: AWSTimestamp
}

# Groups of equipment items
type EquipmentGroup @model
@auth(rules: [
  { allow: private }
]) {
  id: ID!
  name: String!
  description: String
  uicID: ID! @index(name: "byUIC")
  uic: UIC @belongsTo(fields: ["uicID"])
  equipmentItems: [EquipmentItem] @hasMany(indexName: "byEquipmentGroup", fields: ["id"])
  assignedToID: ID @index(name: "byAssignedTo")
  assignedTo: Soldier @belongsTo(fields: ["assignedToID"])
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  _deleted: Boolean
  _version: Int
  _lastChangedAt: AWSTimestamp
}

# Hand Receipt Status to track issued equipment
type HandReceiptStatus @model
@auth(rules: [
  { allow: private }
]) {
  id: ID!
  receiptNumber: String! @index(name: "byReceiptNumber")
  status: HandReceiptStatusType!
  fromUIC: ID! @index(name: "byFromUIC")
  uic: UIC @belongsTo(fields: ["fromUIC"])
  toSoldierID: ID! @index(name: "byToSoldier")
  soldier: Soldier @belongsTo(fields: ["toSoldierID"])
  equipmentItemID: ID! @index(name: "byEquipmentItem")
  equipmentItem: EquipmentItem @belongsTo(fields: ["equipmentItemID"])
  issuedOn: AWSDateTime
  returnedOn: AWSDateTime
  pdfS3Key: String
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  _deleted: Boolean
  _version: Int
  _lastChangedAt: AWSTimestamp
}

enum HandReceiptStatusType {
  GENERATED
  ISSUED
  RETURNED
}

# Models for Equipment Accountability functionality
type AccountabilitySession @model
@auth(rules: [
  { allow: private }
]) {
  id: ID!
  uicID: ID! @index(name: "byUIC")
  uic: UIC @belongsTo(fields: ["uicID"])
  conductedByID: ID! @index(name: "byConductedBy")
  conductedBy: User @belongsTo(fields: ["conductedByID"])
  status: SessionStatus!
  startedAt: AWSDateTime!
  completedAt: AWSDateTime
  itemCount: Int!
  accountedForCount: Int!
  accountabilityItems: [AccountabilityItem] @hasMany(indexName: "bySession", fields: ["id"])
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  _deleted: Boolean
  _version: Int
  _lastChangedAt: AWSTimestamp
}

type AccountabilityItem @model
@auth(rules: [
  { allow: private }
]) {
  id: ID!
  sessionID: ID! @index(name: "bySession")
  session: AccountabilitySession @belongsTo(fields: ["sessionID"])
  equipmentItemID: ID! @index(name: "byEquipmentItem")
  equipmentItem: EquipmentItem @belongsTo(fields: ["equipmentItemID"])
  status: ItemStatus!
  verificationMethod: VerificationMethod!
  verifiedByID: ID @index(name: "byVerifiedBy")
  verifiedBy: User @belongsTo(fields: ["verifiedByID"])
  verifiedAt: AWSDateTime
  confirmationStatus: ConfirmationStatus
  confirmedAt: AWSDateTime
  notes: String
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  _deleted: Boolean
  _version: Int
  _lastChangedAt: AWSTimestamp
}

# Append-only events used by web and future Swift clients to queue offline
# accountability check-ins without mutating custody records while disconnected.
type AccountabilityCheckInEvent @model
@auth(rules: [
  { allow: private }
]) {
  id: ID!
  clientMutationId: String! @index(name: "byClientMutationId")
  deviceId: String!
  uicID: ID! @index(name: "byUIC")
  sessionID: ID! @index(name: "bySession")
  accountabilityItemID: ID @index(name: "byAccountabilityItem")
  equipmentItemID: ID! @index(name: "byEquipmentItem")
  snapshotToken: String!
  status: ItemStatus!
  verificationMethod: VerificationMethod!
  verifiedByID: ID
  verifiedAt: AWSDateTime!
  notes: String
  conflictStatus: CheckInConflictStatus!
  conflictReason: String
  appliedAt: AWSDateTime
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  _deleted: Boolean
  _version: Int
  _lastChangedAt: AWSTimestamp
}

enum CheckInConflictStatus {
  PENDING
  APPLIED
  STALE_ASSIGNMENT
  REJECTED
}

enum SessionStatus {
  ACTIVE
  COMPLETED
  CANCELLED
}

enum ItemStatus {
  ACCOUNTED_FOR
  NOT_ACCOUNTED_FOR
  VERIFICATION_PENDING
}

enum VerificationMethod {
  DIRECT
  SELF_SERVICE
}

enum ConfirmationStatus {
  PENDING
  CONFIRMED
  FAILED
}

enum MaintenanceStatus {
  OPERATIONAL
  MAINTENANCE_REQUIRED
  IN_MAINTENANCE
  DEADLINED
  MISSING
}

# New model for tracking additional UICs that supply sergeants can work with
type AdditionalUIC @model
@auth(rules: [
  { allow: owner, ownerField: "userID" },
  { allow: private }
]) {
  id: ID!
  userID: ID! @index(name: "byUser")
  uicID: ID! @index(name: "byUIC")
  user: User @belongsTo(fields: ["userID"])
  uic: UIC @belongsTo(fields: ["uicID"])
  status: RequestStatus!
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  _deleted: Boolean
  _version: Int
  _lastChangedAt: AWSTimestamp
}`;

const liveModelNameToTableNameMapping = {
  UIC: 'UIC-qugplf4h6zc73kxb34z4zewev4-dev',
  User: 'User-qugplf4h6zc73kxb34z4zewev4-dev',
  UICMembershipRequest:
    'UICMembershipRequest-qugplf4h6zc73kxb34z4zewev4-dev',
  UICCreationRequest: 'UICCreationRequest-qugplf4h6zc73kxb34z4zewev4-dev',
  Soldier: 'Soldier-qugplf4h6zc73kxb34z4zewev4-dev',
  EquipmentMaster: 'EquipmentMaster-qugplf4h6zc73kxb34z4zewev4-dev',
  EquipmentItem: 'EquipmentItem-qugplf4h6zc73kxb34z4zewev4-dev',
  EquipmentGroup: 'EquipmentGroup-qugplf4h6zc73kxb34z4zewev4-dev',
  HandReceiptStatus: 'HandReceiptStatus-qugplf4h6zc73kxb34z4zewev4-dev',
  AccountabilitySession:
    'AccountabilitySession-qugplf4h6zc73kxb34z4zewev4-dev',
  AccountabilityItem: 'AccountabilityItem-qugplf4h6zc73kxb34z4zewev4-dev',
  AccountabilityCheckInEvent:
    'AccountabilityCheckInEvent-qugplf4h6zc73kxb34z4zewev4-dev',
  AdditionalUIC: 'AdditionalUIC-qugplf4h6zc73kxb34z4zewev4-dev',
};

export const data = defineData({
  migratedAmplifyGen1DynamoDbTableMappings: [
    {
      branchName: 'gen2-offline-migration',
      modelNameToTableNameMapping: liveModelNameToTableNameMapping,
    },
    {
      branchName: 'main',
      modelNameToTableNameMapping: liveModelNameToTableNameMapping,
    },
  ],
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
  schema,
});

