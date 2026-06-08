import { defineModel } from './modelBase';

const Role = {
  COMMANDER: 'COMMANDER',
  SUPPLY_SERGEANT: 'SUPPLY_SERGEANT',
  FIRST_SERGEANT: 'FIRST_SERGEANT',
  SOLDIER: 'SOLDIER',
  PENDING: 'PENDING'
};

const RequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

const HandReceiptStatusType = {
  GENERATED: 'GENERATED',
  ISSUED: 'ISSUED',
  RETURNED: 'RETURNED'
};

const SessionStatus = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

const ItemStatus = {
  ACCOUNTED_FOR: 'ACCOUNTED_FOR',
  NOT_ACCOUNTED_FOR: 'NOT_ACCOUNTED_FOR',
  VERIFICATION_PENDING: 'VERIFICATION_PENDING'
};

const VerificationMethod = {
  DIRECT: 'DIRECT',
  SELF_SERVICE: 'SELF_SERVICE'
};

const ConfirmationStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  FAILED: 'FAILED'
};

const MaintenanceStatus = {
  OPERATIONAL: 'OPERATIONAL',
  MAINTENANCE_REQUIRED: 'MAINTENANCE_REQUIRED',
  IN_MAINTENANCE: 'IN_MAINTENANCE',
  DEADLINED: 'DEADLINED',
  MISSING: 'MISSING'
};

const CheckInConflictStatus = {
  PENDING: 'PENDING',
  APPLIED: 'APPLIED',
  STALE_ASSIGNMENT: 'STALE_ASSIGNMENT',
  REJECTED: 'REJECTED'
};

const UIC = defineModel('UIC');
const User = defineModel('User');
const UICMembershipRequest = defineModel('UICMembershipRequest');
const UICCreationRequest = defineModel('UICCreationRequest');
const Soldier = defineModel('Soldier');
const EquipmentMaster = defineModel('EquipmentMaster');
const EquipmentItem = defineModel('EquipmentItem');
const EquipmentGroup = defineModel('EquipmentGroup');
const HandReceiptStatus = defineModel('HandReceiptStatus');
const AccountabilitySession = defineModel('AccountabilitySession');
const AccountabilityItem = defineModel('AccountabilityItem');
const AdditionalUIC = defineModel('AdditionalUIC');
const AccountabilityCheckInEvent = defineModel('AccountabilityCheckInEvent');

export {
  UIC,
  User,
  UICMembershipRequest,
  UICCreationRequest,
  Soldier,
  EquipmentMaster,
  EquipmentItem,
  EquipmentGroup,
  HandReceiptStatus,
  AccountabilitySession,
  AccountabilityItem,
  AdditionalUIC,
  AccountabilityCheckInEvent,
  Role,
  RequestStatus,
  HandReceiptStatusType,
  SessionStatus,
  ItemStatus,
  VerificationMethod,
  ConfirmationStatus,
  MaintenanceStatus,
  CheckInConflictStatus
};
