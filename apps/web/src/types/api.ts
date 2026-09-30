// Mirrors backend enums/shapes (apps/backend/src/common/enums/role.enum.ts
// etc.) — kept in sync by hand since the two apps don't share a package.
// The backend is the actual source of truth/enforcement; these are only
// used here for UI decisions (nav visibility, labels), never for security.
//
// Plain `enum` is disallowed here (tsconfig's erasableSyntaxOnly) since it
// compiles to a runtime object rather than being erased — this
// const-object-plus-type pattern gives the same `Role.FULL_ADMIN` call-site
// syntax while staying erasable.

export const Role = {
  FULL_ADMIN: 'FULL_ADMIN',
  CEO: 'CEO',
  ADMIN_STAFF: 'ADMIN_STAFF',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export type Locale = 'en' | 'ru' | 'uz-Latn' | 'uz-Cyrl';

export interface CurrentUser {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  preferredLocale: Locale;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: CurrentUser;
}

export const TaskType = {
  FILE: 'FILE',
  TEXT: 'TEXT',
  MCQ: 'MCQ',
  AUTO_TEST: 'AUTO_TEST',
} as const;
export type TaskType = (typeof TaskType)[keyof typeof TaskType];

export const SubmissionStatus = {
  PENDING: 'PENDING',
  GRADED: 'GRADED',
} as const;
export type SubmissionStatus = (typeof SubmissionStatus)[keyof typeof SubmissionStatus];

export interface StudentTask {
  id: string;
  groupId: string;
  teacherUserId: string;
  titleEn: string;
  titleRu: string;
  titleUzLatn: string;
  titleUzCyrl: string;
  type: TaskType;
  submissionStatus: SubmissionStatus | null;
  createdAt: string;
}

export const PaymentStatus = {
  CURRENT: 'CURRENT',
  OUTSTANDING: 'OUTSTANDING',
  OVERDUE: 'OVERDUE',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export interface StudentPaymentStatus {
  studentUserId: string;
  status: PaymentStatus;
}

export interface PaymentCycle {
  id: string;
  studentUserId: string;
  cycleNumber: number;
  lessonsCount: number;
  amount: string;
  paidAt: string;
  recordedByUserId?: string;
  notes?: string;
}

export interface MyPaymentsResponse {
  payments: PaymentCycle[];
  status: StudentPaymentStatus;
}

export interface AttendanceRecord {
  id: string;
  studentUserId: string;
  groupId: string;
  date: string;
  present: boolean;
}

export interface AnalyticsOverview {
  activeStudents: number;
  totalTeachers: number;
  totalGroups: number;
  totalRevenueAllTime: string;
  outstandingCount: number;
  enrollmentTrend: Array<{ month: string; active: number; declined: number }>;
  revenueByMonth: Array<{ month: string; amount: string }>;
  attendanceRateByGroup: Array<{ groupId: string; groupName: string; ratePercent: number }>;
  teacherPerformance: Array<{
    teacherUserId: string;
    firstName: string;
    lastName: string;
    avgCorrectPercent: number;
    attendanceRatePercent: number;
  }>;
  topStudents: Array<{ studentUserId: string; firstName: string; lastName: string; correctCount: number; totalCount: number }>;
}
