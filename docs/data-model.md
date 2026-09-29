# Data Model & Module Plan

Status: CONFIRMED by Client on 2026-09-29. Section "Confirmed decisions" below
records the choices; the entity list reflects them.

## Confirmed decisions

1. **Course ↔ Group:** independent. Groups are internal-only (named by staff),
   with no FK to catalog `Course` entries.
2. **Payment overdue tracking:** manual only. No automatic lesson counting
   from the timetable. Staff manually flags a student's payment status.
3. **RBAC:** configurable. Permissions are stored per role in the database and
   editable by Full Administrator via an admin screen (not hardcoded
   `@Roles()` checks). TT §4.1's matrix is the seeded default.
4. **Group membership:** many-to-many for students (a student can belong to
   multiple groups). A teacher can be assigned to multiple groups (already
   natural via `Group.teacherUserId` — no join table needed on the teacher
   side, since one teacher maps to many Group rows).

## Modules (NestJS modular monolith)

1. `identity` — Users, roles, auth (JWT), profiles (student/teacher extensions)
2. `crm` — Requests (lead lifecycle)
3. `catalog` — Public website content: Courses, News/Blog posts, Teacher public profiles, Contact inquiries
4. `groups` — Groups, group membership, schedule slots
5. `attendance` — Per-student per-day attendance records
6. `payments` — Payment cycles (12-lesson blocks), payment analytics
7. `tasks` — Task assignment, submissions, grading, per-group ratings
8. `chat` — Conversations (direct/group), messages
9. `notifications` — Telegram bot integration, parent linking, notification log
10. `files` — Object storage (MinIO) integration for avatars & task attachments
11. `reports` — Excel export (revenue, attendance, enrollment, performance)

## Entities (draft)

### identity
- `User`: id, email (unique, login), passwordHash, role (enum: FULL_ADMIN, CEO,
  ADMIN_STAFF, TEACHER, STUDENT), firstName, lastName, phone, avatarUrl,
  preferredLocale (en/ru/uz-Latn/uz-Cyrl), isActive, createdAt, updatedAt
- `StudentProfile`: userId (FK), parentTelegramUsername, parentChatId (nullable),
  parentLinked (bool), enrollmentDate
- `TeacherProfile`: userId (FK), bio (per-locale), publicPhotoUrl, subjects
- `Permission`: id, key (e.g. `crm.create`, `payments.record`,
  `attendance.record`, `system.rbac.manage`) — a fixed catalog of checkable
  actions per module
- `RolePermission`: role (enum), permissionId (FK), granted (bool) — seeded
  from TT §4.1's matrix as defaults; editable by Full Administrator via an
  admin screen. Guards check this table (cached in Redis) instead of
  hardcoding role checks, so permissions are configurable without a
  code change.

### crm
- `Request`: id, fullName, phone, email, source (WEBSITE | MANUAL),
  status (NEW → TRIAL_SCHEDULED → TRIAL_DONE → ACTIVE | DECLINED),
  declineReason (nullable), trialLessonDate (nullable), createdAt,
  convertedStudentUserId (nullable FK), courseInterest (FK → Course, nullable)

### catalog (public website)
- `Course`: id, title (per-locale), description (per-locale), price, category
  (IT | ENGLISH), isPublished
- `NewsPost`: id, title (per-locale), body (per-locale), coverImageUrl,
  publishedAt, authorUserId
- `ContactInquiry`: id, name, phone/email, message, createdAt → auto-creates a
  `Request`

### groups
- `Group`: id, name, teacherUserId (FK), capacity=10, isActive — no link to
  catalog `Course`
- `GroupMembership`: groupId, studentUserId, joinedAt (many-to-many; capacity
  enforced at application layer, max 10 per group)
- `ScheduleSlot`: id, groupId, dayOfWeek, startTime, endTime

### attendance
- `AttendanceRecord`: id, groupId, studentUserId, date, present (bool),
  markedByUserId, markedAt

### payments
- `PaymentCycle`: id, studentUserId, cycleNumber, lessonsCount=12, amount,
  paidAt, recordedByUserId (Full Admin or Admin Staff), notes
- `StudentPaymentStatus`: studentUserId, status (CURRENT | OUTSTANDING |
  OVERDUE), setByUserId, setAt, note — manually set/toggled by staff on the
  payment-analytics page; not derived from attendance or the timetable

### tasks
- `Task`: id, groupId, teacherUserId, title, description (per-locale), type
  (FILE | TEXT | MCQ | AUTO_TEST), attachmentFileKey (nullable), createdAt
  (no deadline field, per TT)
- `TaskQuestion` (for MCQ/AUTO_TEST): taskId, questionText, options[],
  correctOptionIndex
- `Submission`: id, taskId, studentUserId, textAnswer, fileKey, answers[],
  correctCount, totalCount, status (PENDING | GRADED), gradedByUserId,
  gradedAt, submittedAt
- Rating = per-group ranking by aggregate correctCount

### chat
- `Conversation`: id, type (DIRECT | GROUP), linkedGroupId (nullable)
- `ConversationParticipant`: conversationId, userId
- `Message`: id, conversationId, senderId, text, attachmentFileKey, sentAt

### notifications
- `TelegramLink`: studentUserId, telegramUsername, chatId (nullable),
  linkToken, linkedAt (nullable) — implements the one-time /start linking flow
  from TT §6.1
- `NotificationLog`: id, recipientType (USER | PARENT), recipientId/chatId,
  type (PAYMENT_DUE | NEW_ASSIGNMENT | GRADE_POSTED | CLASS_REMINDER |
  ABSENCE), payload, status (QUEUED | SENT | FAILED), sentAt

### files
- MinIO buckets: `avatars`, `task-attachments` — DB stores only object keys/URLs,
  never binary content

