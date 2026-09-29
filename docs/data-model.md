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

## Design-pack review (2026-09-29)

The client provided a full HTML/CSS design pack (Skylearn design system, 29
screens) covering every role. Reviewing it against the backend surfaced two
direct conflicts with the decisions above, both resolved by keeping the
TT-based decision — the design screens will be adapted to match when the
frontend is built, not the other way around:

- **Payment overdue logic stays manual** (decision 2 above stands). The
  design's payments screen shows auto-computed "Overdue 11 days" driven by a
  lessons-used counter; that model was rejected since it re-links attendance
  to billing, contradicting TT §3.9.
- **Group stays independent of Course** (decision 1 above stands). The
  design's public site fuses a group card with its course's price/description;
  rejected for the same reason — no FK from `Group` to `Course`.

Two further design-only behaviors (not in the TT at all) were also declined:
- **Quiz retry-per-question model**: declined. MCQ/AUTO_TEST tasks keep
  one-shot grading (submit once, auto-graded immediately, no retries) as
  already built.
- **Gamification** (achievement badges, streak counters, star ratings):
  declined. Not part of the TT; the corresponding design screens will be
  simplified when building the frontend.

The design pack also surfaced several fields/entities the backend was
genuinely missing (either TT-required features not yet built, or reasonable
completions of already-planned ones). These are being added — see the entity
list below for what's already implemented (marked ✅) vs still planned:
- `Group.category` (IT | ENGLISH) — for filtering, not a Course link. ✅
- `ScheduleSlot.room`. ✅
- `StudentProfile.dateOfBirth`. ✅
- `Request.assignedGroupId` — the group a trial candidate is being considered
  for; set when scheduling the trial, used to pre-fill (not force) enrollment
  at activation. ✅
- Student activation is now one combined step (login + group enrollment +
  parent Telegram username + date of birth + interface language), matching
  the design's "New student & login" screen, instead of separate follow-up
  calls. ✅
- Password generation uses a human-readable "Word-NNNN-Word" format (e.g.
  "Sky-7429-Nord") instead of an opaque random string, and staff can
  regenerate a user's temporary password (`POST /users/:id/reset-password`,
  same Admin-Staff-can-only-target-Students restriction as creation). ✅
- `TeacherProfile` needs a public tagline (`titleEn/Ru/UzLatn/UzCyrl`, e.g.
  "Networking teacher") distinct from the bio, and `teachingLanguages`
  (planned).
- `NewsPost` entity + public/staff endpoints — TT §3.1 requires a news/blog
  section; only the course catalog was built so far (planned).
- Some minimal "About page" content model — TT §3.1 requires an editable
  About page; not yet built (planned).
- `Submission.comment` — free-text teacher feedback shown to the student
  alongside their grade (planned).
- `TaskQuestion.hint` — optional hint text per question (planned).
- Task creation targeting multiple groups in one call (fan out into one
  `Task` row per group) — API convenience, not a behavior change (planned).
- `POST /auth/change-password` — self-service password change was missing
  entirely (planned).
- `User.lastLoginAt` — shown in the staff user list (planned).

Declined as out of TT scope (design-only, not built unless requested later):
full-group waitlist state, weekly rank-trend snapshots on the teacher rating
dashboard.

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
  parentLinked (bool), enrollmentDate, dateOfBirth
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
  convertedStudentUserId (nullable FK), courseInterest (FK → Course, nullable),
  assignedGroupId (nullable FK → Group, set when scheduling the trial)

### catalog (public website)
- `Course`: id, title (per-locale), description (per-locale), price, category
  (IT | ENGLISH), isPublished
- `NewsPost`: id, title (per-locale), body (per-locale), coverImageUrl,
  publishedAt, authorUserId
- `ContactInquiry`: id, name, phone/email, message, createdAt → auto-creates a
  `Request`

### groups
- `Group`: id, name, category (IT | ENGLISH — for filtering only, not a
  Course FK), teacherUserId (FK), capacity=10, isActive — no link to
  catalog `Course`
- `GroupMembership`: groupId, studentUserId, joinedAt (many-to-many; capacity
  enforced at application layer, max 10 per group)
- `ScheduleSlot`: id, groupId, dayOfWeek, startTime, endTime, room (nullable)

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

