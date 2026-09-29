// Fixed catalog of checkable permission keys, one per module/action combo
// from TT §4.1. Full Administrator always bypasses these checks (see
// PermissionsGuard) since TT §4 defines it as "all privileges" and that must
// never be reconfigurable away. For the other four roles, each key's grant is
// stored per-role in `role_permissions` and is editable by Full Administrator.
export const PERMISSION_KEYS = [
  'website.edit',
  'crm.manage',
  'credentials.create',
  'groups.manage',
  'groups.view_own',
  'payments.manage',
  'payments.read_financial',
  'payments.view_own',
  'attendance.record',
  'attendance.view_own',
  'tasks.manage',
  'tasks.complete_own',
  'results.read_scores',
  'results.view_own_group',
  'results.view_own',
  'chat.access',
  'reports.export_all',
  'reports.export_financial',
  'system.rbac_manage',
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];
