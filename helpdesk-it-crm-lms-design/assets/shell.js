/* Skylearn app shell — builds the role-aware sidebar (web), top bar and
   bottom tab bar (mobile) around <main id="page">.
   Nav items per role follow the TT's RBAC matrix (section 4.1) — no extra panels.

   Usage on a screen:
   <body data-role="admin" data-page="crm" data-title="CRM" data-sub="Requests, trials and students">
     <main id="page"> …screen content… </main>
   </body>
*/
(function () {
  var ROLES = {
    admin: {
      label: 'Full Administrator', user: 'Doniyor Jaloliddinov', initials: 'DJ',
      groups: [
        { name: 'Overview', items: [['dashboard', 'Dashboard', 'layout-dashboard', 'admin-dashboard.html']] },
        { name: 'Students', items: [
          ['crm', 'CRM', 'kanban-square', 'admin-crm.html', 6],
          ['student-new', 'Students & logins', 'user-plus', 'admin-student-new.html'],
          ['groups', 'Groups', 'users-round', 'admin-groups.html'],
          ['timetable', 'Timetable', 'calendar-days', 'admin-timetable.html']
        ] },
        { name: 'Daily work', items: [
          ['attendance', 'Attendance', 'calendar-check', 'admin-attendance.html'],
          ['payments', 'Payments', 'wallet', 'admin-payments.html'],
          ['chat', 'Chat', 'messages-square', 'chat.html']
        ] },
        { name: 'Insights', items: [
          ['analytics', 'Payment analytics', 'chart-column', 'admin-payment-analytics.html'],
          ['results', 'Results & ratings', 'trophy', 'ceo-dashboard.html'],
          ['reports', 'Reports', 'file-spreadsheet', 'admin-reports.html']
        ] },
        { name: 'System', items: [
          ['website', 'Website', 'globe', 'admin-website.html'],
          ['settings', 'Users, roles & bot', 'shield-check', 'admin-settings.html']
        ] }
      ],
      tabs: ['dashboard', 'crm', 'attendance', 'payments', 'more']
    },
    staff: {
      label: 'Administrative Staff', user: 'Nilufar Qodirova', initials: 'NQ',
      groups: [
        { name: 'Students', items: [
          ['crm', 'CRM', 'kanban-square', 'admin-crm.html', 6],
          ['student-new', 'New student & login', 'user-plus', 'admin-student-new.html']
        ] },
        { name: 'Daily work', items: [['attendance', 'Attendance', 'calendar-check', 'admin-attendance.html']] }
      ],
      tabs: ['crm', 'student-new', 'attendance']
    },
    ceo: {
      label: 'CEO · read only', user: 'Bekzod Usmonov', initials: 'BU',
      groups: [
        { name: 'Insights', items: [
          ['ceo', 'Overview', 'layout-dashboard', 'ceo-dashboard.html'],
          ['analytics', 'Payment analytics', 'chart-column', 'admin-payment-analytics.html'],
          ['reports', 'Financial reports', 'file-spreadsheet', 'admin-reports.html']
        ] }
      ],
      tabs: ['ceo', 'analytics', 'reports']
    },
    teacher: {
      label: 'Teacher', user: 'Elena Sokolova', initials: 'ES',
      groups: [
        { name: 'Teaching', items: [
          ['home', 'My groups', 'house', 'teacher-home.html'],
          ['tasks', 'Tasks', 'clipboard-list', 'teacher-task-new.html'],
          ['grading', 'Grading', 'badge-check', 'teacher-grading.html', 9],
          ['rating', 'Group rating', 'trophy', 'teacher-rating.html'],
          ['chat', 'Chat', 'messages-square', 'chat.html']
        ] }
      ],
      tabs: ['home', 'tasks', 'grading', 'rating', 'chat']
    },
    student: {
      label: 'Student · Helpdesk IT-3', user: 'Aziz Rakhimov', initials: 'AR', streak: 12,
      groups: [
        { name: 'Learning', items: [
          ['home', 'Home', 'house', 'student-home.html'],
          ['tasks', 'Tasks', 'clipboard-list', 'student-task.html', 3],
          ['results', 'Results & rating', 'trophy', 'student-results.html'],
          ['chat', 'Group chat', 'messages-square', 'chat.html']
        ] },
        { name: 'My account', items: [
          ['attendance', 'Attendance', 'calendar-check', 'student-attendance.html'],
          ['payments', 'Payments', 'wallet', 'student-payments.html'],
          ['profile', 'Profile', 'circle-user-round', 'student-profile.html']
        ] }
      ],
      tabs: ['home', 'tasks', 'results', 'chat', 'profile'],
      tabLabels: { profile: 'Me' }
    }
  };

  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    for (var k in attrs || {}) n.setAttribute(k, attrs[k]);
    if (html != null) n.innerHTML = html;
    return n;
  }
  function icon(name, cls) { return '<i data-lucide="' + name + '" class="ic ' + (cls || '') + '"></i>'; }

  function build() {
    var b = document.body, role = ROLES[b.dataset.role], page = document.getElementById('page');
    if (!role || !page) { if (window.lucide) lucide.createIcons(); return; }
    var current = b.dataset.page, all = {};
    role.groups.forEach(function (g) { g.items.forEach(function (it) { all[it[0]] = it; }); });

    /* Sidebar */
    var side = el('aside', { class: 'sidebar', 'aria-label': 'Main navigation' });
    side.innerHTML = '<a class="brand" href="site-home.html"><span class="brand-mark">H</span><span class="brand-name">Helpdesk IT<small>Learning center</small></span></a>';
    role.groups.forEach(function (g) {
      var nav = el('nav', { class: 'nav' });
      nav.innerHTML = '<div class="nav-label">' + g.name + '</div>' + g.items.map(function (it) {
        return '<a class="nav-item" href="' + it[3] + '"' + (it[0] === current ? ' aria-current="page"' : '') + '>' + icon(it[2]) + '<span>' + it[1] + '</span>' + (it[4] ? '<span class="count">' + it[4] + '</span>' : '') + '</a>';
      }).join('');
      side.appendChild(nav);
    });
    side.appendChild(el('div', { class: 'sidebar-foot' },
      '<div class="role-chip"><span class="avatar sm">' + role.initials + '</span><span class="stack-2" style="gap:0"><b style="font-size:16px;line-height:22px">' + role.user + '</b><span class="t-caption muted">' + role.label + '</span></span></div>'));

    /* Top bar */
    var top = el('header', { class: 'topbar' });
    top.innerHTML =
      '<div class="topbar-title"><h1 class="t-h3">' + (b.dataset.title || '') + '</h1>' + (b.dataset.sub ? '<p class="t-caption hide-m">' + b.dataset.sub + '</p>' : '') + '</div>' +
      '<div class="topbar-actions">' +
      (role.streak ? '<span class="streak" title="' + role.streak + '-day streak">' + icon('flame') + '<b>' + role.streak + '</b></span>' : '') +
      '<button class="lang" type="button" aria-label="Language: English. Also Русский, O‘zbekcha, Ўзбекча">' + icon('languages', 'ic-sm') + 'EN<span class="long" style="color:var(--ink-muted);font-weight:400">· RU · O‘Z · ЎЗ</span></button>' +
      '<button class="icon-btn" type="button" aria-label="Notifications, 2 new">' + icon('bell') + '<span class="dot"></span></button>' +
      '<span class="avatar sm hide-m" aria-hidden="true">' + role.initials + '</span>' +
      '</div>';

    /* Bottom tab bar (mobile) */
    var tabbar = el('nav', { class: 'tabbar', 'aria-label': 'Main navigation' });
    tabbar.innerHTML = role.tabs.map(function (k) {
      if (k === 'more') {
        var inMore = !role.tabs.some(function (t) { return t === current; });
        return '<a class="tab" href="#more"' + (inMore ? ' aria-current="page"' : '') + ' onclick="document.getElementById(\'more-sheet\').hidden=false;return false;"><span class="tab-ic">' + icon('layout-grid') + '</span>More</a>';
      }
      var it = all[k], label = (role.tabLabels && role.tabLabels[k]) || it[1].split(' ')[0];
      if (k === 'student-new') label = 'New student';
      return '<a class="tab" href="' + it[3] + '"' + (k === current || (k === 'profile' && (current === 'attendance' || current === 'payments')) ? ' aria-current="page"' : '') + '><span class="tab-ic">' + icon(it[2]) + '</span>' + label + '</a>';
    }).join('');

    /* "More" sheet = the rest of the same sidebar items, for mobile */
    var sheet = null;
    if (role.tabs.indexOf('more') > -1) {
      sheet = el('div', { id: 'more-sheet', hidden: '', style: 'position:fixed;inset:0;z-index:40;background:rgba(15,23,42,.35);display:flex;align-items:flex-end' });
      var rest = Object.keys(all).filter(function (k) { return role.tabs.indexOf(k) < 0; });
      sheet.innerHTML = '<div style="width:100%;background:var(--bg);border-radius:28px 28px 0 0;padding:12px 16px calc(24px + env(safe-area-inset-bottom,0px));box-shadow:var(--shadow-modal)"><div style="width:48px;height:5px;border-radius:9px;background:var(--ink-faint);margin:0 auto 12px"></div><div class="nav">' +
        rest.map(function (k) { var it = all[k]; return '<a class="nav-item" href="' + it[3] + '"' + (k === current ? ' aria-current="page"' : '') + '>' + icon(it[2]) + '<span>' + it[1] + '</span></a>'; }).join('') + '</div></div>';
      sheet.addEventListener('click', function (e) { if (e.target === sheet) sheet.hidden = true; });
    }

    var app = el('div', { class: 'app' }), main = el('div', { class: 'main' });
    page.classList.add(page.dataset.full ? 'full' : 'content');
    b.insertBefore(app, page);
    main.appendChild(top); main.appendChild(page);
    app.appendChild(side); app.appendChild(main);
    b.appendChild(tabbar); if (sheet) b.appendChild(sheet);
    if (window.lucide) lucide.createIcons();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
