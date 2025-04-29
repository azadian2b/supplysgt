// Standard role values matching the enum in schema.graphql
export const ROLES = {
  COMMANDER: "COMMANDER",
  SUPPLY_SERGEANT: "SUPPLY_SERGEANT",
  FIRST_SERGEANT: "FIRST_SERGEANT", 
  SOLDIER: "SOLDIER",
  PENDING: "PENDING"
};

// For display purposes
export const ROLE_LABELS = {
  [ROLES.COMMANDER]: "Commander",
  [ROLES.SUPPLY_SERGEANT]: "Supply Sergeant",
  [ROLES.FIRST_SERGEANT]: "First Sergeant",
  [ROLES.SOLDIER]: "Soldier",
  [ROLES.PENDING]: "Pending"
};

// Helper to get role label
export const getRoleLabel = (role) => {
  return ROLE_LABELS[role] || role;
}; 