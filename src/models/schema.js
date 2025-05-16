export const schema = {
    "models": {
        "UIC": {
            "name": "UIC",
            "fields": {
                "id": {
                    "name": "id",
                    "isArray": false,
                    "type": "ID",
                    "isRequired": true,
                    "attributes": []
                },
                "uicCode": {
                    "name": "uicCode",
                    "isArray": false,
                    "type": "String",
                    "isRequired": true,
                    "attributes": []
                },
                "name": {
                    "name": "name",
                    "isArray": false,
                    "type": "String",
                    "isRequired": true,
                    "attributes": []
                },
                "members": {
                    "name": "members",
                    "isArray": true,
                    "type": {
                        "model": "User"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "isArrayNullable": true,
                    "association": {
                        "connectionType": "HAS_MANY",
                        "associatedWith": [
                            "uic"
                        ]
                    }
                },
                "membershipRequests": {
                    "name": "membershipRequests",
                    "isArray": true,
                    "type": {
                        "model": "UICMembershipRequest"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "isArrayNullable": true,
                    "association": {
                        "connectionType": "HAS_MANY",
                        "associatedWith": [
                            "uic"
                        ]
                    }
                },
                "soldiers": {
                    "name": "soldiers",
                    "isArray": true,
                    "type": {
                        "model": "Soldier"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "isArrayNullable": true,
                    "association": {
                        "connectionType": "HAS_MANY",
                        "associatedWith": [
                            "uic"
                        ]
                    }
                },
                "equipmentItems": {
                    "name": "equipmentItems",
                    "isArray": true,
                    "type": {
                        "model": "EquipmentItem"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "isArrayNullable": true,
                    "association": {
                        "connectionType": "HAS_MANY",
                        "associatedWith": [
                            "uic"
                        ]
                    }
                },
                "equipmentGroups": {
                    "name": "equipmentGroups",
                    "isArray": true,
                    "type": {
                        "model": "EquipmentGroup"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "isArrayNullable": true,
                    "association": {
                        "connectionType": "HAS_MANY",
                        "associatedWith": [
                            "uic"
                        ]
                    }
                },
                "handReceiptStatuses": {
                    "name": "handReceiptStatuses",
                    "isArray": true,
                    "type": {
                        "model": "HandReceiptStatus"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "isArrayNullable": true,
                    "association": {
                        "connectionType": "HAS_MANY",
                        "associatedWith": [
                            "uic"
                        ]
                    }
                },
                "accountabilitySessions": {
                    "name": "accountabilitySessions",
                    "isArray": true,
                    "type": {
                        "model": "AccountabilitySession"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "isArrayNullable": true,
                    "association": {
                        "connectionType": "HAS_MANY",
                        "associatedWith": [
                            "uic"
                        ]
                    }
                },
                "createdAt": {
                    "name": "createdAt",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": false,
                    "attributes": [],
                    "isReadOnly": true
                },
                "updatedAt": {
                    "name": "updatedAt",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": false,
                    "attributes": [],
                    "isReadOnly": true
                }
            },
            "syncable": true,
            "pluralName": "UICS",
            "attributes": [
                {
                    "type": "model",
                    "properties": {}
                },
                {
                    "type": "key",
                    "properties": {
                        "name": "uICSByUicCode",
                        "fields": [
                            "uicCode"
                        ]
                    }
                },
                {
                    "type": "auth",
                    "properties": {
                        "rules": [
                            {
                                "allow": "private",
                                "operations": [
                                    "create",
                                    "update",
                                    "delete",
                                    "read"
                                ]
                            },
                            {
                                "provider": "userPools",
                                "ownerField": "owner",
                                "allow": "owner",
                                "operations": [
                                    "read"
                                ],
                                "identityClaim": "cognito:username"
                            }
                        ]
                    }
                }
            ]
        },
        "User": {
            "name": "User",
            "fields": {
                "id": {
                    "name": "id",
                    "isArray": false,
                    "type": "ID",
                    "isRequired": true,
                    "attributes": []
                },
                "owner": {
                    "name": "owner",
                    "isArray": false,
                    "type": "String",
                    "isRequired": true,
                    "attributes": []
                },
                "firstName": {
                    "name": "firstName",
                    "isArray": false,
                    "type": "String",
                    "isRequired": true,
                    "attributes": []
                },
                "lastName": {
                    "name": "lastName",
                    "isArray": false,
                    "type": "String",
                    "isRequired": true,
                    "attributes": []
                },
                "rank": {
                    "name": "rank",
                    "isArray": false,
                    "type": "String",
                    "isRequired": true,
                    "attributes": []
                },
                "role": {
                    "name": "role",
                    "isArray": false,
                    "type": {
                        "enum": "Role"
                    },
                    "isRequired": true,
                    "attributes": []
                },
                "uicID": {
                    "name": "uicID",
                    "isArray": false,
                    "type": "ID",
                    "isRequired": false,
                    "attributes": []
                },
                "uic": {
                    "name": "uic",
                    "isArray": false,
                    "type": {
                        "model": "UIC"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "association": {
                        "connectionType": "BELONGS_TO",
                        "targetNames": [
                            "uicID"
                        ]
                    }
                },
                "membershipRequests": {
                    "name": "membershipRequests",
                    "isArray": true,
                    "type": {
                        "model": "UICMembershipRequest"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "isArrayNullable": true,
                    "association": {
                        "connectionType": "HAS_MANY",
                        "associatedWith": [
                            "user"
                        ]
                    }
                },
                "linkedSoldierId": {
                    "name": "linkedSoldierId",
                    "isArray": false,
                    "type": "ID",
                    "isRequired": false,
                    "attributes": []
                },
                "soldiersLinked": {
                    "name": "soldiersLinked",
                    "isArray": true,
                    "type": {
                        "model": "Soldier"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "isArrayNullable": true,
                    "association": {
                        "connectionType": "HAS_MANY",
                        "associatedWith": [
                            "user"
                        ]
                    }
                },
                "conductedSessions": {
                    "name": "conductedSessions",
                    "isArray": true,
                    "type": {
                        "model": "AccountabilitySession"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "isArrayNullable": true,
                    "association": {
                        "connectionType": "HAS_MANY",
                        "associatedWith": [
                            "conductedBy"
                        ]
                    }
                },
                "verifiedItems": {
                    "name": "verifiedItems",
                    "isArray": true,
                    "type": {
                        "model": "AccountabilityItem"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "isArrayNullable": true,
                    "association": {
                        "connectionType": "HAS_MANY",
                        "associatedWith": [
                            "verifiedBy"
                        ]
                    }
                },
                "createdAt": {
                    "name": "createdAt",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": false,
                    "attributes": [],
                    "isReadOnly": true
                },
                "updatedAt": {
                    "name": "updatedAt",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": false,
                    "attributes": [],
                    "isReadOnly": true
                }
            },
            "syncable": true,
            "pluralName": "Users",
            "attributes": [
                {
                    "type": "model",
                    "properties": {}
                },
                {
                    "type": "key",
                    "properties": {
                        "name": "byOwner",
                        "fields": [
                            "owner"
                        ]
                    }
                },
                {
                    "type": "key",
                    "properties": {
                        "name": "byUIC",
                        "fields": [
                            "uicID"
                        ]
                    }
                },
                {
                    "type": "auth",
                    "properties": {
                        "rules": [
                            {
                                "provider": "userPools",
                                "ownerField": "owner",
                                "allow": "owner",
                                "identityClaim": "cognito:username",
                                "operations": [
                                    "create",
                                    "update",
                                    "delete",
                                    "read"
                                ]
                            },
                            {
                                "allow": "private",
                                "operations": [
                                    "read"
                                ]
                            }
                        ]
                    }
                }
            ]
        },
        "UICMembershipRequest": {
            "name": "UICMembershipRequest",
            "fields": {
                "id": {
                    "name": "id",
                    "isArray": false,
                    "type": "ID",
                    "isRequired": true,
                    "attributes": []
                },
                "userID": {
                    "name": "userID",
                    "isArray": false,
                    "type": "ID",
                    "isRequired": true,
                    "attributes": []
                },
                "uicID": {
                    "name": "uicID",
                    "isArray": false,
                    "type": "ID",
                    "isRequired": true,
                    "attributes": []
                },
                "user": {
                    "name": "user",
                    "isArray": false,
                    "type": {
                        "model": "User"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "association": {
                        "connectionType": "BELONGS_TO",
                        "targetNames": [
                            "userID"
                        ]
                    }
                },
                "uic": {
                    "name": "uic",
                    "isArray": false,
                    "type": {
                        "model": "UIC"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "association": {
                        "connectionType": "BELONGS_TO",
                        "targetNames": [
                            "uicID"
                        ]
                    }
                },
                "requestedRole": {
                    "name": "requestedRole",
                    "isArray": false,
                    "type": {
                        "enum": "Role"
                    },
                    "isRequired": true,
                    "attributes": []
                },
                "status": {
                    "name": "status",
                    "isArray": false,
                    "type": {
                        "enum": "RequestStatus"
                    },
                    "isRequired": true,
                    "attributes": []
                },
                "createdAt": {
                    "name": "createdAt",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": true,
                    "attributes": []
                },
                "updatedAt": {
                    "name": "updatedAt",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": false,
                    "attributes": [],
                    "isReadOnly": true
                }
            },
            "syncable": true,
            "pluralName": "UICMembershipRequests",
            "attributes": [
                {
                    "type": "model",
                    "properties": {}
                },
                {
                    "type": "key",
                    "properties": {
                        "name": "byUser",
                        "fields": [
                            "userID"
                        ]
                    }
                },
                {
                    "type": "key",
                    "properties": {
                        "name": "byUIC",
                        "fields": [
                            "uicID"
                        ]
                    }
                },
                {
                    "type": "auth",
                    "properties": {
                        "rules": [
                            {
                                "provider": "userPools",
                                "ownerField": "userID",
                                "allow": "owner",
                                "identityClaim": "cognito:username",
                                "operations": [
                                    "create",
                                    "update",
                                    "delete",
                                    "read"
                                ]
                            },
                            {
                                "allow": "private",
                                "operations": [
                                    "create",
                                    "update",
                                    "delete",
                                    "read"
                                ]
                            }
                        ]
                    }
                }
            ]
        },
        "Soldier": {
            "name": "Soldier",
            "fields": {
                "id": {
                    "name": "id",
                    "isArray": false,
                    "type": "ID",
                    "isRequired": true,
                    "attributes": []
                },
                "firstName": {
                    "name": "firstName",
                    "isArray": false,
                    "type": "String",
                    "isRequired": true,
                    "attributes": []
                },
                "lastName": {
                    "name": "lastName",
                    "isArray": false,
                    "type": "String",
                    "isRequired": true,
                    "attributes": []
                },
                "rank": {
                    "name": "rank",
                    "isArray": false,
                    "type": "String",
                    "isRequired": false,
                    "attributes": []
                },
                "email": {
                    "name": "email",
                    "isArray": false,
                    "type": "String",
                    "isRequired": false,
                    "attributes": []
                },
                "phone": {
                    "name": "phone",
                    "isArray": false,
                    "type": "String",
                    "isRequired": false,
                    "attributes": []
                },
                "uicID": {
                    "name": "uicID",
                    "isArray": false,
                    "type": "ID",
                    "isRequired": true,
                    "attributes": []
                },
                "uic": {
                    "name": "uic",
                    "isArray": false,
                    "type": {
                        "model": "UIC"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "association": {
                        "connectionType": "BELONGS_TO",
                        "targetNames": [
                            "uicID"
                        ]
                    }
                },
                "role": {
                    "name": "role",
                    "isArray": false,
                    "type": {
                        "enum": "Role"
                    },
                    "isRequired": true,
                    "attributes": []
                },
                "userId": {
                    "name": "userId",
                    "isArray": false,
                    "type": "ID",
                    "isRequired": false,
                    "attributes": []
                },
                "user": {
                    "name": "user",
                    "isArray": false,
                    "type": {
                        "model": "User"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "association": {
                        "connectionType": "BELONGS_TO",
                        "targetNames": [
                            "userId"
                        ]
                    }
                },
                "hasAccount": {
                    "name": "hasAccount",
                    "isArray": false,
                    "type": "Boolean",
                    "isRequired": true,
                    "attributes": []
                },
                "assignedEquipmentItems": {
                    "name": "assignedEquipmentItems",
                    "isArray": true,
                    "type": {
                        "model": "EquipmentItem"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "isArrayNullable": true,
                    "association": {
                        "connectionType": "HAS_MANY",
                        "associatedWith": [
                            "assignedTo"
                        ]
                    }
                },
                "assignedEquipmentGroups": {
                    "name": "assignedEquipmentGroups",
                    "isArray": true,
                    "type": {
                        "model": "EquipmentGroup"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "isArrayNullable": true,
                    "association": {
                        "connectionType": "HAS_MANY",
                        "associatedWith": [
                            "assignedTo"
                        ]
                    }
                },
                "handReceiptStatuses": {
                    "name": "handReceiptStatuses",
                    "isArray": true,
                    "type": {
                        "model": "HandReceiptStatus"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "isArrayNullable": true,
                    "association": {
                        "connectionType": "HAS_MANY",
                        "associatedWith": [
                            "soldier"
                        ]
                    }
                },
                "createdAt": {
                    "name": "createdAt",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": true,
                    "attributes": []
                },
                "updatedAt": {
                    "name": "updatedAt",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": true,
                    "attributes": []
                }
            },
            "syncable": true,
            "pluralName": "Soldiers",
            "attributes": [
                {
                    "type": "model",
                    "properties": {}
                },
                {
                    "type": "key",
                    "properties": {
                        "name": "byUIC",
                        "fields": [
                            "uicID"
                        ]
                    }
                },
                {
                    "type": "key",
                    "properties": {
                        "name": "byUser",
                        "fields": [
                            "userId"
                        ]
                    }
                },
                {
                    "type": "auth",
                    "properties": {
                        "rules": [
                            {
                                "allow": "private",
                                "operations": [
                                    "create",
                                    "update",
                                    "delete",
                                    "read"
                                ]
                            },
                            {
                                "provider": "userPools",
                                "ownerField": "uicID",
                                "allow": "owner",
                                "operations": [
                                    "read"
                                ],
                                "identityClaim": "cognito:username"
                            }
                        ]
                    }
                }
            ]
        },
        "EquipmentMaster": {
            "name": "EquipmentMaster",
            "fields": {
                "id": {
                    "name": "id",
                    "isArray": false,
                    "type": "ID",
                    "isRequired": true,
                    "attributes": []
                },
                "nsn": {
                    "name": "nsn",
                    "isArray": false,
                    "type": "String",
                    "isRequired": true,
                    "attributes": []
                },
                "commonName": {
                    "name": "commonName",
                    "isArray": false,
                    "type": "String",
                    "isRequired": true,
                    "attributes": []
                },
                "description": {
                    "name": "description",
                    "isArray": false,
                    "type": "String",
                    "isRequired": false,
                    "attributes": []
                },
                "tmNumber": {
                    "name": "tmNumber",
                    "isArray": false,
                    "type": "String",
                    "isRequired": false,
                    "attributes": []
                },
                "isSerialTracked": {
                    "name": "isSerialTracked",
                    "isArray": false,
                    "type": "Boolean",
                    "isRequired": true,
                    "attributes": []
                },
                "isSensitiveItem": {
                    "name": "isSensitiveItem",
                    "isArray": false,
                    "type": "Boolean",
                    "isRequired": true,
                    "attributes": []
                },
                "isConsumable": {
                    "name": "isConsumable",
                    "isArray": false,
                    "type": "Boolean",
                    "isRequired": true,
                    "attributes": []
                },
                "isCyclicInventory": {
                    "name": "isCyclicInventory",
                    "isArray": false,
                    "type": "Boolean",
                    "isRequired": true,
                    "attributes": []
                },
                "isSensitiveInventory": {
                    "name": "isSensitiveInventory",
                    "isArray": false,
                    "type": "Boolean",
                    "isRequired": true,
                    "attributes": []
                },
                "storageRestrictions": {
                    "name": "storageRestrictions",
                    "isArray": false,
                    "type": "String",
                    "isRequired": false,
                    "attributes": []
                },
                "maintenanceSchedule": {
                    "name": "maintenanceSchedule",
                    "isArray": false,
                    "type": "String",
                    "isRequired": false,
                    "attributes": []
                },
                "imageKey": {
                    "name": "imageKey",
                    "isArray": false,
                    "type": "String",
                    "isRequired": false,
                    "attributes": []
                },
                "subComponents": {
                    "name": "subComponents",
                    "isArray": true,
                    "type": "String",
                    "isRequired": false,
                    "attributes": [],
                    "isArrayNullable": true
                },
                "equipmentItems": {
                    "name": "equipmentItems",
                    "isArray": true,
                    "type": {
                        "model": "EquipmentItem"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "isArrayNullable": true,
                    "association": {
                        "connectionType": "HAS_MANY",
                        "associatedWith": [
                            "equipmentMaster"
                        ]
                    }
                },
                "createdAt": {
                    "name": "createdAt",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": false,
                    "attributes": [],
                    "isReadOnly": true
                },
                "updatedAt": {
                    "name": "updatedAt",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": false,
                    "attributes": [],
                    "isReadOnly": true
                }
            },
            "syncable": true,
            "pluralName": "EquipmentMasters",
            "attributes": [
                {
                    "type": "model",
                    "properties": {}
                },
                {
                    "type": "key",
                    "properties": {
                        "name": "byNSN",
                        "queryField": "equipmentMasterByNSN",
                        "fields": [
                            "nsn"
                        ]
                    }
                },
                {
                    "type": "auth",
                    "properties": {
                        "rules": [
                            {
                                "allow": "private",
                                "operations": [
                                    "create",
                                    "update",
                                    "delete",
                                    "read"
                                ]
                            }
                        ]
                    }
                }
            ]
        },
        "EquipmentItem": {
            "name": "EquipmentItem",
            "fields": {
                "id": {
                    "name": "id",
                    "isArray": false,
                    "type": "ID",
                    "isRequired": true,
                    "attributes": []
                },
                "uicID": {
                    "name": "uicID",
                    "isArray": false,
                    "type": "ID",
                    "isRequired": true,
                    "attributes": []
                },
                "uic": {
                    "name": "uic",
                    "isArray": false,
                    "type": {
                        "model": "UIC"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "association": {
                        "connectionType": "BELONGS_TO",
                        "targetNames": [
                            "uicID"
                        ]
                    }
                },
                "equipmentMasterID": {
                    "name": "equipmentMasterID",
                    "isArray": false,
                    "type": "ID",
                    "isRequired": true,
                    "attributes": []
                },
                "equipmentMaster": {
                    "name": "equipmentMaster",
                    "isArray": false,
                    "type": {
                        "model": "EquipmentMaster"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "association": {
                        "connectionType": "BELONGS_TO",
                        "targetNames": [
                            "equipmentMasterID"
                        ]
                    }
                },
                "nsn": {
                    "name": "nsn",
                    "isArray": false,
                    "type": "String",
                    "isRequired": true,
                    "attributes": []
                },
                "lin": {
                    "name": "lin",
                    "isArray": false,
                    "type": "String",
                    "isRequired": true,
                    "attributes": []
                },
                "serialNumber": {
                    "name": "serialNumber",
                    "isArray": false,
                    "type": "String",
                    "isRequired": false,
                    "attributes": []
                },
                "stockNumber": {
                    "name": "stockNumber",
                    "isArray": false,
                    "type": "String",
                    "isRequired": false,
                    "attributes": []
                },
                "location": {
                    "name": "location",
                    "isArray": false,
                    "type": "String",
                    "isRequired": false,
                    "attributes": []
                },
                "assignedToID": {
                    "name": "assignedToID",
                    "isArray": false,
                    "type": "ID",
                    "isRequired": false,
                    "attributes": []
                },
                "assignedTo": {
                    "name": "assignedTo",
                    "isArray": false,
                    "type": {
                        "model": "Soldier"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "association": {
                        "connectionType": "BELONGS_TO",
                        "targetNames": [
                            "assignedToID"
                        ]
                    }
                },
                "maintenanceStatus": {
                    "name": "maintenanceStatus",
                    "isArray": false,
                    "type": {
                        "enum": "MaintenanceStatus"
                    },
                    "isRequired": false,
                    "attributes": []
                },
                "isPartOfGroup": {
                    "name": "isPartOfGroup",
                    "isArray": false,
                    "type": "Boolean",
                    "isRequired": false,
                    "attributes": []
                },
                "groupID": {
                    "name": "groupID",
                    "isArray": false,
                    "type": "ID",
                    "isRequired": false,
                    "attributes": []
                },
                "equipmentGroup": {
                    "name": "equipmentGroup",
                    "isArray": false,
                    "type": {
                        "model": "EquipmentGroup"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "association": {
                        "connectionType": "BELONGS_TO",
                        "targetNames": [
                            "groupID"
                        ]
                    }
                },
                "handReceiptStatuses": {
                    "name": "handReceiptStatuses",
                    "isArray": true,
                    "type": {
                        "model": "HandReceiptStatus"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "isArrayNullable": true,
                    "association": {
                        "connectionType": "HAS_MANY",
                        "associatedWith": [
                            "equipmentItem"
                        ]
                    }
                },
                "accountabilityItems": {
                    "name": "accountabilityItems",
                    "isArray": true,
                    "type": {
                        "model": "AccountabilityItem"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "isArrayNullable": true,
                    "association": {
                        "connectionType": "HAS_MANY",
                        "associatedWith": [
                            "equipmentItem"
                        ]
                    }
                },
                "createdAt": {
                    "name": "createdAt",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": true,
                    "attributes": []
                },
                "updatedAt": {
                    "name": "updatedAt",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": true,
                    "attributes": []
                }
            },
            "syncable": true,
            "pluralName": "EquipmentItems",
            "attributes": [
                {
                    "type": "model",
                    "properties": {}
                },
                {
                    "type": "key",
                    "properties": {
                        "name": "byUIC",
                        "fields": [
                            "uicID"
                        ]
                    }
                },
                {
                    "type": "key",
                    "properties": {
                        "name": "byEquipmentMaster",
                        "fields": [
                            "equipmentMasterID"
                        ]
                    }
                },
                {
                    "type": "key",
                    "properties": {
                        "name": "byAssignedTo",
                        "fields": [
                            "assignedToID"
                        ]
                    }
                },
                {
                    "type": "key",
                    "properties": {
                        "name": "byEquipmentGroup",
                        "fields": [
                            "groupID"
                        ]
                    }
                },
                {
                    "type": "auth",
                    "properties": {
                        "rules": [
                            {
                                "allow": "private",
                                "operations": [
                                    "create",
                                    "update",
                                    "delete",
                                    "read"
                                ]
                            }
                        ]
                    }
                }
            ]
        },
        "EquipmentGroup": {
            "name": "EquipmentGroup",
            "fields": {
                "id": {
                    "name": "id",
                    "isArray": false,
                    "type": "ID",
                    "isRequired": true,
                    "attributes": []
                },
                "name": {
                    "name": "name",
                    "isArray": false,
                    "type": "String",
                    "isRequired": true,
                    "attributes": []
                },
                "description": {
                    "name": "description",
                    "isArray": false,
                    "type": "String",
                    "isRequired": false,
                    "attributes": []
                },
                "uicID": {
                    "name": "uicID",
                    "isArray": false,
                    "type": "ID",
                    "isRequired": true,
                    "attributes": []
                },
                "uic": {
                    "name": "uic",
                    "isArray": false,
                    "type": {
                        "model": "UIC"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "association": {
                        "connectionType": "BELONGS_TO",
                        "targetNames": [
                            "uicID"
                        ]
                    }
                },
                "equipmentItems": {
                    "name": "equipmentItems",
                    "isArray": true,
                    "type": {
                        "model": "EquipmentItem"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "isArrayNullable": true,
                    "association": {
                        "connectionType": "HAS_MANY",
                        "associatedWith": [
                            "equipmentGroup"
                        ]
                    }
                },
                "assignedToID": {
                    "name": "assignedToID",
                    "isArray": false,
                    "type": "ID",
                    "isRequired": false,
                    "attributes": []
                },
                "assignedTo": {
                    "name": "assignedTo",
                    "isArray": false,
                    "type": {
                        "model": "Soldier"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "association": {
                        "connectionType": "BELONGS_TO",
                        "targetNames": [
                            "assignedToID"
                        ]
                    }
                },
                "createdAt": {
                    "name": "createdAt",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": true,
                    "attributes": []
                },
                "updatedAt": {
                    "name": "updatedAt",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": true,
                    "attributes": []
                }
            },
            "syncable": true,
            "pluralName": "EquipmentGroups",
            "attributes": [
                {
                    "type": "model",
                    "properties": {}
                },
                {
                    "type": "key",
                    "properties": {
                        "name": "byUIC",
                        "fields": [
                            "uicID"
                        ]
                    }
                },
                {
                    "type": "key",
                    "properties": {
                        "name": "byAssignedTo",
                        "fields": [
                            "assignedToID"
                        ]
                    }
                },
                {
                    "type": "auth",
                    "properties": {
                        "rules": [
                            {
                                "allow": "private",
                                "operations": [
                                    "create",
                                    "update",
                                    "delete",
                                    "read"
                                ]
                            }
                        ]
                    }
                }
            ]
        },
        "HandReceiptStatus": {
            "name": "HandReceiptStatus",
            "fields": {
                "id": {
                    "name": "id",
                    "isArray": false,
                    "type": "ID",
                    "isRequired": true,
                    "attributes": []
                },
                "receiptNumber": {
                    "name": "receiptNumber",
                    "isArray": false,
                    "type": "String",
                    "isRequired": true,
                    "attributes": []
                },
                "status": {
                    "name": "status",
                    "isArray": false,
                    "type": {
                        "enum": "HandReceiptStatusType"
                    },
                    "isRequired": true,
                    "attributes": []
                },
                "fromUIC": {
                    "name": "fromUIC",
                    "isArray": false,
                    "type": "ID",
                    "isRequired": true,
                    "attributes": []
                },
                "uic": {
                    "name": "uic",
                    "isArray": false,
                    "type": {
                        "model": "UIC"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "association": {
                        "connectionType": "BELONGS_TO",
                        "targetNames": [
                            "fromUIC"
                        ]
                    }
                },
                "toSoldierID": {
                    "name": "toSoldierID",
                    "isArray": false,
                    "type": "ID",
                    "isRequired": true,
                    "attributes": []
                },
                "soldier": {
                    "name": "soldier",
                    "isArray": false,
                    "type": {
                        "model": "Soldier"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "association": {
                        "connectionType": "BELONGS_TO",
                        "targetNames": [
                            "toSoldierID"
                        ]
                    }
                },
                "equipmentItemID": {
                    "name": "equipmentItemID",
                    "isArray": false,
                    "type": "ID",
                    "isRequired": true,
                    "attributes": []
                },
                "equipmentItem": {
                    "name": "equipmentItem",
                    "isArray": false,
                    "type": {
                        "model": "EquipmentItem"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "association": {
                        "connectionType": "BELONGS_TO",
                        "targetNames": [
                            "equipmentItemID"
                        ]
                    }
                },
                "issuedOn": {
                    "name": "issuedOn",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": false,
                    "attributes": []
                },
                "returnedOn": {
                    "name": "returnedOn",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": false,
                    "attributes": []
                },
                "pdfS3Key": {
                    "name": "pdfS3Key",
                    "isArray": false,
                    "type": "String",
                    "isRequired": false,
                    "attributes": []
                },
                "createdAt": {
                    "name": "createdAt",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": true,
                    "attributes": []
                },
                "updatedAt": {
                    "name": "updatedAt",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": true,
                    "attributes": []
                }
            },
            "syncable": true,
            "pluralName": "HandReceiptStatuses",
            "attributes": [
                {
                    "type": "model",
                    "properties": {}
                },
                {
                    "type": "key",
                    "properties": {
                        "name": "byReceiptNumber",
                        "fields": [
                            "receiptNumber"
                        ]
                    }
                },
                {
                    "type": "key",
                    "properties": {
                        "name": "byFromUIC",
                        "fields": [
                            "fromUIC"
                        ]
                    }
                },
                {
                    "type": "key",
                    "properties": {
                        "name": "byToSoldier",
                        "fields": [
                            "toSoldierID"
                        ]
                    }
                },
                {
                    "type": "key",
                    "properties": {
                        "name": "byEquipmentItem",
                        "fields": [
                            "equipmentItemID"
                        ]
                    }
                },
                {
                    "type": "auth",
                    "properties": {
                        "rules": [
                            {
                                "allow": "private",
                                "operations": [
                                    "create",
                                    "update",
                                    "delete",
                                    "read"
                                ]
                            }
                        ]
                    }
                }
            ]
        },
        "AccountabilitySession": {
            "name": "AccountabilitySession",
            "fields": {
                "id": {
                    "name": "id",
                    "isArray": false,
                    "type": "ID",
                    "isRequired": true,
                    "attributes": []
                },
                "uicID": {
                    "name": "uicID",
                    "isArray": false,
                    "type": "ID",
                    "isRequired": true,
                    "attributes": []
                },
                "uic": {
                    "name": "uic",
                    "isArray": false,
                    "type": {
                        "model": "UIC"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "association": {
                        "connectionType": "BELONGS_TO",
                        "targetNames": [
                            "uicID"
                        ]
                    }
                },
                "conductedByID": {
                    "name": "conductedByID",
                    "isArray": false,
                    "type": "ID",
                    "isRequired": true,
                    "attributes": []
                },
                "conductedBy": {
                    "name": "conductedBy",
                    "isArray": false,
                    "type": {
                        "model": "User"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "association": {
                        "connectionType": "BELONGS_TO",
                        "targetNames": [
                            "conductedByID"
                        ]
                    }
                },
                "status": {
                    "name": "status",
                    "isArray": false,
                    "type": {
                        "enum": "SessionStatus"
                    },
                    "isRequired": true,
                    "attributes": []
                },
                "startedAt": {
                    "name": "startedAt",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": true,
                    "attributes": []
                },
                "completedAt": {
                    "name": "completedAt",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": false,
                    "attributes": []
                },
                "itemCount": {
                    "name": "itemCount",
                    "isArray": false,
                    "type": "Int",
                    "isRequired": true,
                    "attributes": []
                },
                "accountedForCount": {
                    "name": "accountedForCount",
                    "isArray": false,
                    "type": "Int",
                    "isRequired": true,
                    "attributes": []
                },
                "accountabilityItems": {
                    "name": "accountabilityItems",
                    "isArray": true,
                    "type": {
                        "model": "AccountabilityItem"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "isArrayNullable": true,
                    "association": {
                        "connectionType": "HAS_MANY",
                        "associatedWith": [
                            "session"
                        ]
                    }
                },
                "createdAt": {
                    "name": "createdAt",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": true,
                    "attributes": []
                },
                "updatedAt": {
                    "name": "updatedAt",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": true,
                    "attributes": []
                }
            },
            "syncable": true,
            "pluralName": "AccountabilitySessions",
            "attributes": [
                {
                    "type": "model",
                    "properties": {}
                },
                {
                    "type": "key",
                    "properties": {
                        "name": "byUIC",
                        "fields": [
                            "uicID"
                        ]
                    }
                },
                {
                    "type": "key",
                    "properties": {
                        "name": "byConductedBy",
                        "fields": [
                            "conductedByID"
                        ]
                    }
                },
                {
                    "type": "auth",
                    "properties": {
                        "rules": [
                            {
                                "allow": "private",
                                "operations": [
                                    "create",
                                    "update",
                                    "delete",
                                    "read"
                                ]
                            }
                        ]
                    }
                }
            ]
        },
        "AccountabilityItem": {
            "name": "AccountabilityItem",
            "fields": {
                "id": {
                    "name": "id",
                    "isArray": false,
                    "type": "ID",
                    "isRequired": true,
                    "attributes": []
                },
                "sessionID": {
                    "name": "sessionID",
                    "isArray": false,
                    "type": "ID",
                    "isRequired": true,
                    "attributes": []
                },
                "session": {
                    "name": "session",
                    "isArray": false,
                    "type": {
                        "model": "AccountabilitySession"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "association": {
                        "connectionType": "BELONGS_TO",
                        "targetNames": [
                            "sessionID"
                        ]
                    }
                },
                "equipmentItemID": {
                    "name": "equipmentItemID",
                    "isArray": false,
                    "type": "ID",
                    "isRequired": true,
                    "attributes": []
                },
                "equipmentItem": {
                    "name": "equipmentItem",
                    "isArray": false,
                    "type": {
                        "model": "EquipmentItem"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "association": {
                        "connectionType": "BELONGS_TO",
                        "targetNames": [
                            "equipmentItemID"
                        ]
                    }
                },
                "status": {
                    "name": "status",
                    "isArray": false,
                    "type": {
                        "enum": "ItemStatus"
                    },
                    "isRequired": true,
                    "attributes": []
                },
                "verificationMethod": {
                    "name": "verificationMethod",
                    "isArray": false,
                    "type": {
                        "enum": "VerificationMethod"
                    },
                    "isRequired": true,
                    "attributes": []
                },
                "verifiedByID": {
                    "name": "verifiedByID",
                    "isArray": false,
                    "type": "ID",
                    "isRequired": false,
                    "attributes": []
                },
                "verifiedBy": {
                    "name": "verifiedBy",
                    "isArray": false,
                    "type": {
                        "model": "User"
                    },
                    "isRequired": false,
                    "attributes": [],
                    "association": {
                        "connectionType": "BELONGS_TO",
                        "targetNames": [
                            "verifiedByID"
                        ]
                    }
                },
                "verifiedAt": {
                    "name": "verifiedAt",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": false,
                    "attributes": []
                },
                "confirmationStatus": {
                    "name": "confirmationStatus",
                    "isArray": false,
                    "type": {
                        "enum": "ConfirmationStatus"
                    },
                    "isRequired": false,
                    "attributes": []
                },
                "confirmedAt": {
                    "name": "confirmedAt",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": false,
                    "attributes": []
                },
                "notes": {
                    "name": "notes",
                    "isArray": false,
                    "type": "String",
                    "isRequired": false,
                    "attributes": []
                },
                "createdAt": {
                    "name": "createdAt",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": true,
                    "attributes": []
                },
                "updatedAt": {
                    "name": "updatedAt",
                    "isArray": false,
                    "type": "AWSDateTime",
                    "isRequired": true,
                    "attributes": []
                }
            },
            "syncable": true,
            "pluralName": "AccountabilityItems",
            "attributes": [
                {
                    "type": "model",
                    "properties": {}
                },
                {
                    "type": "key",
                    "properties": {
                        "name": "bySession",
                        "fields": [
                            "sessionID"
                        ]
                    }
                },
                {
                    "type": "key",
                    "properties": {
                        "name": "byEquipmentItem",
                        "fields": [
                            "equipmentItemID"
                        ]
                    }
                },
                {
                    "type": "key",
                    "properties": {
                        "name": "byVerifiedBy",
                        "fields": [
                            "verifiedByID"
                        ]
                    }
                },
                {
                    "type": "auth",
                    "properties": {
                        "rules": [
                            {
                                "allow": "private",
                                "operations": [
                                    "create",
                                    "update",
                                    "delete",
                                    "read"
                                ]
                            }
                        ]
                    }
                }
            ]
        }
    },
    "enums": {
        "Role": {
            "name": "Role",
            "values": [
                "COMMANDER",
                "SUPPLY_SERGEANT",
                "FIRST_SERGEANT",
                "SOLDIER",
                "PENDING"
            ]
        },
        "RequestStatus": {
            "name": "RequestStatus",
            "values": [
                "PENDING",
                "APPROVED",
                "REJECTED"
            ]
        },
        "HandReceiptStatusType": {
            "name": "HandReceiptStatusType",
            "values": [
                "GENERATED",
                "ISSUED",
                "RETURNED"
            ]
        },
        "SessionStatus": {
            "name": "SessionStatus",
            "values": [
                "ACTIVE",
                "COMPLETED",
                "CANCELLED"
            ]
        },
        "ItemStatus": {
            "name": "ItemStatus",
            "values": [
                "ACCOUNTED_FOR",
                "NOT_ACCOUNTED_FOR",
                "VERIFICATION_PENDING"
            ]
        },
        "VerificationMethod": {
            "name": "VerificationMethod",
            "values": [
                "DIRECT",
                "SELF_SERVICE"
            ]
        },
        "ConfirmationStatus": {
            "name": "ConfirmationStatus",
            "values": [
                "PENDING",
                "CONFIRMED",
                "FAILED"
            ]
        },
        "MaintenanceStatus": {
            "name": "MaintenanceStatus",
            "values": [
                "OPERATIONAL",
                "MAINTENANCE_REQUIRED",
                "IN_MAINTENANCE",
                "DEADLINED",
                "MISSING"
            ]
        }
    },
    "nonModels": {},
    "codegenVersion": "3.4.4",
    "version": "f5817cfca8403a673983220b2d706351"
};