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

const MaintenanceStatus = {
  "OPERATIONAL": "OPERATIONAL",
  "MAINTENANCE_REQUIRED": "MAINTENANCE_REQUIRED",
  "IN_MAINTENANCE": "IN_MAINTENANCE",
  "DEADLINED": "DEADLINED",
  "MISSING": "MISSING"
};

const { UIC, User, UICMembershipRequest, Soldier, EquipmentMaster, EquipmentItem, EquipmentGroup, HandReceiptStatus } = initSchema(schema);

export {
  UIC,
  User,
  UICMembershipRequest,
  Soldier,
  EquipmentMaster,
  EquipmentItem,
  EquipmentGroup,
  HandReceiptStatus,
  Role,
  RequestStatus,
  HandReceiptStatusType,
  MaintenanceStatus
};