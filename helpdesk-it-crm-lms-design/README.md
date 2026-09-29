# Helpdesk IT — CRM + LMS design (Skylearn)

HTML design mockups for the learning-center platform described in the Technical Task (TT V2), styled with the Skylearn design system. There are 29 screens covering all 5 roles plus the public website. Each screen is one responsive HTML file: at 1024px and wider it shows the web layout, and below that the mobile layout (bottom tab bar).

## Open it

Open `index.html` in a browser. It is a gallery that shows every screen in a web frame (1440) and a phone frame (390) side by side. You can also open any file in `screens/` directly.

If your browser blocks iframes from `file://`, serve the folder first:

```
python3 -m http.server 8080   # then open http://localhost:8080
```

## Structure

```
assets/skylearn.css   All design tokens (CSS variables) and component classes. This is the single source of truth.
assets/shell.js       Role-aware app shell. Sidebar on web, bottom tabs on mobile, top bar.
                      Nav items per role follow the TT's RBAC matrix (section 4.1).
assets/lucide.min.js  Icons (Lucide 0.460.0, a stand-in for Skylearn's illustrated set)
screens/*.html        29 screens. App screens declare <body data-role data-page data-title data-sub>.
index.html            Gallery viewer
tools-check-icons.js  node tools-check-icons.js screens/*.html   (finds unknown icon names)
```

## Roles and screens

| Role | Screens |
|---|---|
| Public | site-home (with trial-lesson form → CRM request), site-courses (catalog + pricing), site-teachers, site-news, login |
| Full Administrator | admin-dashboard, admin-groups, admin-timetable, admin-payments, admin-website, admin-settings (users, RBAC matrix, Telegram bot) |
| Administrative Staff | admin-crm, admin-student-new (student + login credentials + parent Telegram), admin-attendance |
| CEO (read only) | ceo-dashboard, admin-payment-analytics, admin-reports (Excel, daily/weekly/monthly) |
| Teacher | teacher-home, teacher-task-new, teacher-grading, teacher-rating |
| Student | student-home, student-task, student-score, student-results, student-attendance, student-payments, student-profile |
| Teacher + Student | chat |

## Notes for building it with Claude Code

- Port `assets/skylearn.css` first: its `:root` tokens become your theme (CSS variables, or Tailwind `theme.extend`). The component classes (`.btn`, `.card`, `.lesson-card`, `.answer-tile`, `.pill.st-*`, `.check`, `.table`, `.kanban`, `.chat`…) map one-to-one to React components.
- Port `assets/shell.js` as one `<AppShell role>` component. The `ROLES` object there is the nav config per role, taken from the RBAC matrix.
- Localization: the language switch shows EN / RU / O‘Z / ЎЗ. All copy in the mockups is English. Leave about 30% width headroom for the other languages.
- Scope rules that are built into the designs: tasks have no deadlines, payments are cash only per full 12-lesson cycle (no partial payments or discounts), groups hold at most 10 students, parents have no account (Telegram only), accounts are created by staff (no sign-up), and there is no teacher payroll and no code auto-grading.
- The Skylearn brand book, tokens and component guidelines are also in the "Skylearn" Design System artifact.
- Webfonts load from Google Fonts: Hubot Sans, Atkinson Hyperlegible, Lexend Deca and JetBrains Mono, with Nunito as the fallback.
