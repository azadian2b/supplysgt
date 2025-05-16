// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';

const Role = {
  "COMMANDER": "COMMANDER",
  "SUPPLY_SERGEANT": "SUPPLY_SERGEANT",
  "FIRST_SERGEANT": "FIRST_SERGEANT",
  "SOLDIER": "SOLDIER",
  "PENDING": "PENDING"
};

const RequestStatus = {
  "PENDING": "PENDING",
  "APPROVED": "APPROVED",
  "REJECTED": "REJECTED"
};

const HandReceiptStatusType = {
  "GENERATED": "GENERATED",
  "ISSUED": "ISSUED",
  "RETURNED": "RETURNED"
};

const SessionStatus = {
  "ACTIVE": "ACTIVE",
  "COMPLETED": "COMPLETED",
  "CANCELLED": "CANCELLED"
};

const ItemStatus = {
  "ACCOUNTED_FOR": "ACCOUNTED_FOR",
  "NOT_ACCOUNTED_FOR": "NOT_ACCOUNTED_FOR",
  "VERIFICATION_PENDING": "VERIFICATION_PENDING"
};

const VerificationMethod = {
  "DIRECT": "DIRECT",
  "SELF_SERVICE": "SELF_SERVICE"
};

const ConfirmationStatus = {
  "PENDING": "PENDING",
  "CONFIRMED": "CONFIRMED",
  "FAILED": "FAILED"
};

const MaintenanceStatus = {
  "OPERATIONAL": "OPERATIONAL",
  "MAINTENANCE_REQUIRED": "MAINTENANCE_REQUIRED",
  "IN_MAINTENANCE": "IN_MAINTENANCE",
  "DEADLINED": "DEADLINED",
  "MISSING": "MISSING"
};

const { UIC, User, UICMembershipRequest, Soldier, EquipmentMaster, EquipmentItem, EquipmentGroup, HandReceiptStatus, AccountabilitySession, AccountabilityItem } = initSchema(schema);

export {
  UIC,
  User,
  UICMembershipRequest,
  Soldier,
  EquipmentMaster,
  EquipmentItem,
  EquipmentGroup,
  HandReceiptStatus,
  AccountabilitySession,
  AccountabilityItem,
  Role,
  RequestStatus,
  HandReceiptStatusType,
  SessionStatus,
  ItemStatus,
  VerificationMethod,
  ConfirmationStatus,
  MaintenanceStatus
};