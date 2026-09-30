import {
  LayoutDashboard,
  KanbanSquare,
  UserPlus,
  UsersRound,
  CalendarDays,
  CalendarCheck,
  Wallet,
  MessagesSquare,
  ChartColumn,
  Trophy,
  FileSpreadsheet,
  Globe,
  ShieldCheck,
  House,
  ClipboardList,
  BadgeCheck,
  CircleUserRound,
  type LucideIcon,
} from 'lucide-react';
import { Role } from '../../types/api.js';

export interface NavItem {
  key: string;
  labelKey: string;
  icon: LucideIcon;
  path: string;
}

export interface NavGroup {
  labelKey: string;
  items: NavItem[];
}

// Ported from the design pack's assets/shell.js ROLES config — same
// per-role module visibility, following the TT §4.1 RBAC matrix — with
// static HTML hrefs replaced by React Router paths.
export const NAV_BY_ROLE: Record<Role, NavGroup[]> = {
  [Role.FULL_ADMIN]: [
    { labelKey: 'nav.overview', items: [{ key: 'dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, path: '/admin' }] },
    {
      labelKey: 'nav.studentsAndLogins',
      items: [
        { key: 'crm', labelKey: 'nav.crm', icon: KanbanSquare, path: '/admin/crm' },
        { key: 'student-new', labelKey: 'nav.studentsAndLogins', icon: UserPlus, path: '/admin/students/new' },
        { key: 'groups', labelKey: 'nav.groups', icon: UsersRound, path: '/admin/groups' },
        { key: 'timetable', labelKey: 'nav.timetable', icon: CalendarDays, path: '/admin/timetable' },
      ],
    },
    {
      labelKey: 'nav.attendance',
      items: [
        { key: 'attendance', labelKey: 'nav.attendance', icon: CalendarCheck, path: '/admin/attendance' },
        { key: 'payments', labelKey: 'nav.payments', icon: Wallet, path: '/admin/payments' },
        { key: 'chat', labelKey: 'nav.chat', icon: MessagesSquare, path: '/chat' },
      ],
    },
    {
      labelKey: 'nav.results',
      items: [
        { key: 'analytics', labelKey: 'nav.paymentAnalytics', icon: ChartColumn, path: '/admin/payment-analytics' },
        { key: 'results', labelKey: 'nav.results', icon: Trophy, path: '/admin/results' },
        { key: 'reports', labelKey: 'nav.reports', icon: FileSpreadsheet, path: '/admin/reports' },
      ],
    },
    {
      labelKey: 'nav.website',
      items: [
        { key: 'website', labelKey: 'nav.website', icon: Globe, path: '/admin/website' },
        { key: 'settings', labelKey: 'nav.settings', icon: ShieldCheck, path: '/admin/settings' },
      ],
    },
  ],
  [Role.ADMIN_STAFF]: [
    {
      labelKey: 'nav.studentsAndLogins',
      items: [
        { key: 'crm', labelKey: 'nav.crm', icon: KanbanSquare, path: '/admin/crm' },
        { key: 'student-new', labelKey: 'nav.newStudent', icon: UserPlus, path: '/admin/students/new' },
      ],
    },
    { labelKey: 'nav.attendance', items: [{ key: 'attendance', labelKey: 'nav.attendance', icon: CalendarCheck, path: '/admin/attendance' }] },
  ],
  [Role.CEO]: [
    {
      labelKey: 'nav.overview',
      items: [
        { key: 'ceo', labelKey: 'nav.overview', icon: LayoutDashboard, path: '/ceo' },
        { key: 'analytics', labelKey: 'nav.paymentAnalytics', icon: ChartColumn, path: '/admin/payment-analytics' },
        { key: 'reports', labelKey: 'nav.financialReports', icon: FileSpreadsheet, path: '/admin/reports' },
      ],
    },
  ],
  [Role.TEACHER]: [
    {
      labelKey: 'nav.myGroups',
      items: [
        { key: 'home', labelKey: 'nav.myGroups', icon: House, path: '/teacher' },
        { key: 'tasks', labelKey: 'nav.tasks', icon: ClipboardList, path: '/teacher/tasks' },
        { key: 'grading', labelKey: 'nav.grading', icon: BadgeCheck, path: '/teacher/grading' },
        { key: 'rating', labelKey: 'nav.groupRating', icon: Trophy, path: '/teacher/rating' },
        { key: 'chat', labelKey: 'nav.chat', icon: MessagesSquare, path: '/chat' },
      ],
    },
  ],
  [Role.STUDENT]: [
    {
      labelKey: 'nav.home',
      items: [
        { key: 'home', labelKey: 'nav.home', icon: House, path: '/student' },
        { key: 'tasks', labelKey: 'nav.tasks', icon: ClipboardList, path: '/student/tasks' },
        { key: 'results', labelKey: 'nav.myResults', icon: Trophy, path: '/student/results' },
        { key: 'chat', labelKey: 'nav.groupChat', icon: MessagesSquare, path: '/chat' },
      ],
    },
    {
      labelKey: 'nav.profile',
      items: [
        { key: 'attendance', labelKey: 'nav.attendance', icon: CalendarCheck, path: '/student/attendance' },
        { key: 'payments', labelKey: 'nav.payments', icon: Wallet, path: '/student/payments' },
        { key: 'profile', labelKey: 'nav.profile', icon: CircleUserRound, path: '/student/profile' },
      ],
    },
  ],
};

// Bottom tab bar (mobile, <1024px): at most 5 items, per TT/design ("the
// Full Administrator's fifth tab, 'More', opens the rest as a bottom sheet").
export const TABS_BY_ROLE: Record<Role, string[]> = {
  [Role.FULL_ADMIN]: ['dashboard', 'crm', 'attendance', 'payments'],
  [Role.ADMIN_STAFF]: ['crm', 'student-new', 'attendance'],
  [Role.CEO]: ['ceo', 'analytics', 'reports'],
  [Role.TEACHER]: ['home', 'tasks', 'grading', 'rating', 'chat'],
  [Role.STUDENT]: ['home', 'tasks', 'results', 'chat', 'profile'],
};
