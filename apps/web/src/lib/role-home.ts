import { Role } from '../types/api.js';

export function roleHome(role: Role): string {
  switch (role) {
    case Role.FULL_ADMIN:
      return '/admin';
    case Role.ADMIN_STAFF:
      return '/admin/crm';
    case Role.CEO:
      return '/ceo';
    case Role.TEACHER:
      return '/teacher';
    case Role.STUDENT:
      return '/student';
  }
}
