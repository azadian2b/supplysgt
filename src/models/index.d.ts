import { ModelInit, MutableModel, __modelMeta__, ManagedIdentifier } from "@aws-amplify/datastore";
// @ts-ignore
import { LazyLoading, LazyLoadingDisabled, AsyncCollection, AsyncItem } from "@aws-amplify/datastore";

export enum Role {
  COMMANDER = "COMMANDER",
  SUPPLY_SERGEANT = "SUPPLY_SERGEANT",
  FIRST_SERGEANT = "FIRST_SERGEANT",
  SOLDIER = "SOLDIER",
  PENDING = "PENDING"
}

export enum RequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
}

export enum HandReceiptStatusType {
  GENERATED = "GENERATED",
  ISSUED = "ISSUED",
  RETURNED = "RETURNED"
}

export enum MaintenanceStatus {
  OPERATIONAL = "OPERATIONAL",
  MAINTENANCE_REQUIRED = "MAINTENANCE_REQUIRED",
  IN_MAINTENANCE = "IN_MAINTENANCE",
  DEADLINED = "DEADLINED",
  MISSING = "MISSING"
}



type EagerUIC = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<UIC, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly uicCode: string;
  readonly name: string;
  readonly members?: (User | null)[] | null;
  readonly membershipRequests?: (UICMembershipRequest | null)[] | null;
  readonly soldiers?: (Soldier | null)[] | null;
  readonly equipmentItems?: (EquipmentItem | null)[] | null;
  readonly equipmentGroups?: (EquipmentGroup | null)[] | null;
  readonly handReceiptStatuses?: (HandReceiptStatus | null)[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyUIC = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<UIC, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly uicCode: string;
  readonly name: string;
  readonly members: AsyncCollection<User>;
  readonly membershipRequests: AsyncCollection<UICMembershipRequest>;
  readonly soldiers: AsyncCollection<Soldier>;
  readonly equipmentItems: AsyncCollection<EquipmentItem>;
  readonly equipmentGroups: AsyncCollection<EquipmentGroup>;
  readonly handReceiptStatuses: AsyncCollection<HandReceiptStatus>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type UIC = LazyLoading extends LazyLoadingDisabled ? EagerUIC : LazyUIC

export declare const UIC: (new (init: ModelInit<UIC>) => UIC) & {
  copyOf(source: UIC, mutator: (draft: MutableModel<UIC>) => MutableModel<UIC> | void): UIC;
}

type EagerUser = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<User, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly owner: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly rank: string;
  readonly role: Role | keyof typeof Role;
  readonly uicID?: string | null;
  readonly uic?: UIC | null;
  readonly membershipRequests?: (UICMembershipRequest | null)[] | null;
  readonly linkedSoldierId?: string | null;
  readonly soldiersLinked?: (Soldier | null)[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyUser = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<User, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly owner: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly rank: string;
  readonly role: Role | keyof typeof Role;
  readonly uicID?: string | null;
  readonly uic: AsyncItem<UIC | undefined>;
  readonly membershipRequests: AsyncCollection<UICMembershipRequest>;
  readonly linkedSoldierId?: string | null;
  readonly soldiersLinked: AsyncCollection<Soldier>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type User = LazyLoading extends LazyLoadingDisabled ? EagerUser : LazyUser

export declare const User: (new (init: ModelInit<User>) => User) & {
  copyOf(source: User, mutator: (draft: MutableModel<User>) => MutableModel<User> | void): User;
}

type EagerUICMembershipRequest = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<UICMembershipRequest, 'id'>;
    readOnlyFields: 'updatedAt';
  };
  readonly id: string;
  readonly userID: string;
  readonly uicID: string;
  readonly user?: User | null;
  readonly uic?: UIC | null;
  readonly requestedRole: Role | keyof typeof Role;
  readonly status: RequestStatus | keyof typeof RequestStatus;
  readonly createdAt: string;
  readonly updatedAt?: string | null;
}

type LazyUICMembershipRequest = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<UICMembershipRequest, 'id'>;
    readOnlyFields: 'updatedAt';
  };
  readonly id: string;
  readonly userID: string;
  readonly uicID: string;
  readonly user: AsyncItem<User | undefined>;
  readonly uic: AsyncItem<UIC | undefined>;
  readonly requestedRole: Role | keyof typeof Role;
  readonly status: RequestStatus | keyof typeof RequestStatus;
  readonly createdAt: string;
  readonly updatedAt?: string | null;
}

export declare type UICMembershipRequest = LazyLoading extends LazyLoadingDisabled ? EagerUICMembershipRequest : LazyUICMembershipRequest

export declare const UICMembershipRequest: (new (init: ModelInit<UICMembershipRequest>) => UICMembershipRequest) & {
  copyOf(source: UICMembershipRequest, mutator: (draft: MutableModel<UICMembershipRequest>) => MutableModel<UICMembershipRequest> | void): UICMembershipRequest;
}

type EagerSoldier = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Soldier, 'id'>;
  };
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly rank?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly uicID: string;
  readonly uic?: UIC | null;
  readonly role: Role | keyof typeof Role;
  readonly userId?: string | null;
  readonly user?: User | null;
  readonly hasAccount: boolean;
  readonly assignedEquipmentItems?: (EquipmentItem | null)[] | null;
  readonly assignedEquipmentGroups?: (EquipmentGroup | null)[] | null;
  readonly handReceiptStatuses?: (HandReceiptStatus | null)[] | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

type LazySoldier = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Soldier, 'id'>;
  };
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly rank?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly uicID: string;
  readonly uic: AsyncItem<UIC | undefined>;
  readonly role: Role | keyof typeof Role;
  readonly userId?: string | null;
  readonly user: AsyncItem<User | undefined>;
  readonly hasAccount: boolean;
  readonly assignedEquipmentItems: AsyncCollection<EquipmentItem>;
  readonly assignedEquipmentGroups: AsyncCollection<EquipmentGroup>;
  readonly handReceiptStatuses: AsyncCollection<HandReceiptStatus>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export declare type Soldier = LazyLoading extends LazyLoadingDisabled ? EagerSoldier : LazySoldier

export declare const Soldier: (new (init: ModelInit<Soldier>) => Soldier) & {
  copyOf(source: Soldier, mutator: (draft: MutableModel<Soldier>) => MutableModel<Soldier> | void): Soldier;
}

type EagerEquipmentMaster = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<EquipmentMaster, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly nsn: string;
  readonly commonName: string;
  readonly description?: string | null;
  readonly tmNumber?: string | null;
  readonly isSerialTracked: boolean;
  readonly isSensitiveItem: boolean;
  readonly isConsumable: boolean;
  readonly isCyclicInventory: boolean;
  readonly isSensitiveInventory: boolean;
  readonly storageRestrictions?: string | null;
  readonly maintenanceSchedule?: string | null;
  readonly imageKey?: string | null;
  readonly subComponents?: (string | null)[] | null;
  readonly equipmentItems?: (EquipmentItem | null)[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyEquipmentMaster = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<EquipmentMaster, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly nsn: string;
  readonly commonName: string;
  readonly description?: string | null;
  readonly tmNumber?: string | null;
  readonly isSerialTracked: boolean;
  readonly isSensitiveItem: boolean;
  readonly isConsumable: boolean;
  readonly isCyclicInventory: boolean;
  readonly isSensitiveInventory: boolean;
  readonly storageRestrictions?: string | null;
  readonly maintenanceSchedule?: string | null;
  readonly imageKey?: string | null;
  readonly subComponents?: (string | null)[] | null;
  readonly equipmentItems: AsyncCollection<EquipmentItem>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type EquipmentMaster = LazyLoading extends LazyLoadingDisabled ? EagerEquipmentMaster : LazyEquipmentMaster

export declare const EquipmentMaster: (new (init: ModelInit<EquipmentMaster>) => EquipmentMaster) & {
  copyOf(source: EquipmentMaster, mutator: (draft: MutableModel<EquipmentMaster>) => MutableModel<EquipmentMaster> | void): EquipmentMaster;
}

type EagerEquipmentItem = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<EquipmentItem, 'id'>;
  };
  readonly id: string;
  readonly uicID: string;
  readonly uic?: UIC | null;
  readonly equipmentMasterID: string;
  readonly equipmentMaster?: EquipmentMaster | null;
  readonly nsn: string;
  readonly lin: string;
  readonly serialNumber?: string | null;
  readonly stockNumber?: string | null;
  readonly location?: string | null;
  readonly assignedToID?: string | null;
  readonly assignedTo?: Soldier | null;
  readonly maintenanceStatus?: MaintenanceStatus | keyof typeof MaintenanceStatus | null;
  readonly isPartOfGroup?: boolean | null;
  readonly groupID?: string | null;
  readonly equipmentGroup?: EquipmentGroup | null;
  readonly handReceiptStatuses?: (HandReceiptStatus | null)[] | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

type LazyEquipmentItem = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<EquipmentItem, 'id'>;
  };
  readonly id: string;
  readonly uicID: string;
  readonly uic: AsyncItem<UIC | undefined>;
  readonly equipmentMasterID: string;
  readonly equipmentMaster: AsyncItem<EquipmentMaster | undefined>;
  readonly nsn: string;
  readonly lin: string;
  readonly serialNumber?: string | null;
  readonly stockNumber?: string | null;
  readonly location?: string | null;
  readonly assignedToID?: string | null;
  readonly assignedTo: AsyncItem<Soldier | undefined>;
  readonly maintenanceStatus?: MaintenanceStatus | keyof typeof MaintenanceStatus | null;
  readonly isPartOfGroup?: boolean | null;
  readonly groupID?: string | null;
  readonly equipmentGroup: AsyncItem<EquipmentGroup | undefined>;
  readonly handReceiptStatuses: AsyncCollection<HandReceiptStatus>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export declare type EquipmentItem = LazyLoading extends LazyLoadingDisabled ? EagerEquipmentItem : LazyEquipmentItem

export declare const EquipmentItem: (new (init: ModelInit<EquipmentItem>) => EquipmentItem) & {
  copyOf(source: EquipmentItem, mutator: (draft: MutableModel<EquipmentItem>) => MutableModel<EquipmentItem> | void): EquipmentItem;
}

type EagerEquipmentGroup = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<EquipmentGroup, 'id'>;
  };
  readonly id: string;
  readonly name: string;
  readonly description?: string | null;
  readonly uicID: string;
  readonly uic?: UIC | null;
  readonly equipmentItems?: (EquipmentItem | null)[] | null;
  readonly assignedToID?: string | null;
  readonly assignedTo?: Soldier | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

type LazyEquipmentGroup = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<EquipmentGroup, 'id'>;
  };
  readonly id: string;
  readonly name: string;
  readonly description?: string | null;
  readonly uicID: string;
  readonly uic: AsyncItem<UIC | undefined>;
  readonly equipmentItems: AsyncCollection<EquipmentItem>;
  readonly assignedToID?: string | null;
  readonly assignedTo: AsyncItem<Soldier | undefined>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export declare type EquipmentGroup = LazyLoading extends LazyLoadingDisabled ? EagerEquipmentGroup : LazyEquipmentGroup

export declare const EquipmentGroup: (new (init: ModelInit<EquipmentGroup>) => EquipmentGroup) & {
  copyOf(source: EquipmentGroup, mutator: (draft: MutableModel<EquipmentGroup>) => MutableModel<EquipmentGroup> | void): EquipmentGroup;
}

type EagerHandReceiptStatus = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<HandReceiptStatus, 'id'>;
  };
  readonly id: string;
  readonly receiptNumber: string;
  readonly status: HandReceiptStatusType | keyof typeof HandReceiptStatusType;
  readonly fromUIC: string;
  readonly uic?: UIC | null;
  readonly toSoldierID: string;
  readonly soldier?: Soldier | null;
  readonly equipmentItemID: string;
  readonly equipmentItem?: EquipmentItem | null;
  readonly issuedOn?: string | null;
  readonly returnedOn?: string | null;
  readonly pdfS3Key?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

type LazyHandReceiptStatus = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<HandReceiptStatus, 'id'>;
  };
  readonly id: string;
  readonly receiptNumber: string;
  readonly status: HandReceiptStatusType | keyof typeof HandReceiptStatusType;
  readonly fromUIC: string;
  readonly uic: AsyncItem<UIC | undefined>;
  readonly toSoldierID: string;
  readonly soldier: AsyncItem<Soldier | undefined>;
  readonly equipmentItemID: string;
  readonly equipmentItem: AsyncItem<EquipmentItem | undefined>;
  readonly issuedOn?: string | null;
  readonly returnedOn?: string | null;
  readonly pdfS3Key?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export declare type HandReceiptStatus = LazyLoading extends LazyLoadingDisabled ? EagerHandReceiptStatus : LazyHandReceiptStatus

export declare const HandReceiptStatus: (new (init: ModelInit<HandReceiptStatus>) => HandReceiptStatus) & {
  copyOf(source: HandReceiptStatus, mutator: (draft: MutableModel<HandReceiptStatus>) => MutableModel<HandReceiptStatus> | void): HandReceiptStatus;
}