import { Role } from '../../../common/enums/role.enum.js';
import type { PermissionKey } from '../../../common/enums/permission-key.js';

// Default grant matrix seeded on first boot, derived directly from TT §4.1's
// access table plus the Client's confirmed change that Administrative Staff
// may also record cash payments. Full Administrator is intentionally absent:
// RbacService.isGranted() always allows it, regardless of these rows.
// Full Administrator can edit all of this afterwards via the RBAC screen.
export const DEFAULT_ROLE_GRANTS: Array<{ role: Role; key: PermissionKey }> = [
  { role: Role.CEO, key: 'payments.read_financial' },
  { role: Role.CEO, key: 'results.read_scores' },
  { role: Role.CEO, key: 'reports.export_financial' },

  { role: Role.ADMIN_STAFF, key: 'crm.manage' },
  { role: Role.ADMIN_STAFF, key: 'credentials.create' },
  { role: Role.ADMIN_STAFF, key: 'attendance.record' },
  { role: Role.ADMIN_STAFF, key: 'payments.manage' },

  { role: Role.TEACHER, key: 'groups.view_own' },
  { role: Role.TEACHER, key: 'tasks.manage' },
  { role: Role.TEACHER, key: 'results.view_own_group' },
  { role: Role.TEACHER, key: 'chat.access' },

  { role: Role.STUDENT, key: 'payments.view_own' },
  { role: Role.STUDENT, key: 'attendance.view_own' },
  { role: Role.STUDENT, key: 'tasks.complete_own' },
  { role: Role.STUDENT, key: 'results.view_own' },
  { role: Role.STUDENT, key: 'chat.access' },
];
