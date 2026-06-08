const DEFAULT_ADMIN_EMAILS = ['nathaniel.mckinnon@gmail.com'];
const DEFAULT_ADMIN_SUBS = ['6448a458-b051-70f6-20e9-e367f821288c'];

const parseList = (value) => (
  value ? value.split(',').map(item => item.trim()).filter(Boolean) : []
);

const configuredAdminEmails = parseList(process.env.REACT_APP_SUPPLY_SGT_ADMIN_EMAILS);
const configuredAdminSubs = parseList(process.env.REACT_APP_SUPPLY_SGT_ADMIN_SUBS);

export const PLATFORM_ADMIN_EMAILS = configuredAdminEmails.length > 0
  ? configuredAdminEmails
  : DEFAULT_ADMIN_EMAILS;

export const PLATFORM_ADMIN_SUBS = configuredAdminSubs.length > 0
  ? configuredAdminSubs
  : DEFAULT_ADMIN_SUBS;

export const isPlatformAdminAttributes = (attributes = {}) => {
  const safeAttributes = attributes || {};

  return (
    PLATFORM_ADMIN_EMAILS.includes(safeAttributes.email) ||
    PLATFORM_ADMIN_SUBS.includes(safeAttributes.sub)
  );
};
