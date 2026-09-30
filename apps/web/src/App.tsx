import { Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './lib/auth-context.js';
import { roleHome } from './lib/role-home.js';
import { RequireAuth } from './components/RequireAuth.js';
import { Role } from './types/api.js';
import { LoginPage } from './pages/Login.js';
import { StudentHome } from './pages/student/StudentHome.js';
import { AdminDashboard } from './pages/admin/AdminDashboard.js';
import { ComingSoon } from './pages/ComingSoon.js';

function RoleHomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? roleHome(user.role) : '/login'} replace />;
}

export default function App() {
  const { t } = useTranslation();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RoleHomeRedirect />} />

      {/* Full Administrator */}
      <Route path="/admin" element={<RequireAuth roles={[Role.FULL_ADMIN]}><AdminDashboard /></RequireAuth>} />
      <Route path="/admin/crm" element={<RequireAuth roles={[Role.FULL_ADMIN, Role.ADMIN_STAFF]}><ComingSoon title={t('nav.crm')} /></RequireAuth>} />
      <Route path="/admin/students/new" element={<RequireAuth roles={[Role.FULL_ADMIN, Role.ADMIN_STAFF]}><ComingSoon title={t('nav.newStudent')} /></RequireAuth>} />
      <Route path="/admin/groups" element={<RequireAuth roles={[Role.FULL_ADMIN]}><ComingSoon title={t('nav.groups')} /></RequireAuth>} />
      <Route path="/admin/timetable" element={<RequireAuth roles={[Role.FULL_ADMIN]}><ComingSoon title={t('nav.timetable')} /></RequireAuth>} />
      <Route path="/admin/attendance" element={<RequireAuth roles={[Role.FULL_ADMIN, Role.ADMIN_STAFF]}><ComingSoon title={t('nav.attendance')} /></RequireAuth>} />
      <Route path="/admin/payments" element={<RequireAuth roles={[Role.FULL_ADMIN, Role.ADMIN_STAFF]}><ComingSoon title={t('nav.payments')} /></RequireAuth>} />
      <Route path="/admin/payment-analytics" element={<RequireAuth roles={[Role.FULL_ADMIN, Role.CEO]}><ComingSoon title={t('nav.paymentAnalytics')} /></RequireAuth>} />
      <Route path="/admin/results" element={<RequireAuth roles={[Role.FULL_ADMIN]}><ComingSoon title={t('nav.results')} /></RequireAuth>} />
      <Route path="/admin/reports" element={<RequireAuth roles={[Role.FULL_ADMIN, Role.CEO]}><ComingSoon title={t('nav.reports')} /></RequireAuth>} />
      <Route path="/admin/website" element={<RequireAuth roles={[Role.FULL_ADMIN]}><ComingSoon title={t('nav.website')} /></RequireAuth>} />
      <Route path="/admin/settings" element={<RequireAuth roles={[Role.FULL_ADMIN]}><ComingSoon title={t('nav.settings')} /></RequireAuth>} />

      {/* CEO */}
      <Route path="/ceo" element={<RequireAuth roles={[Role.CEO]}><ComingSoon title={t('nav.overview')} /></RequireAuth>} />

      {/* Teacher */}
      <Route path="/teacher" element={<RequireAuth roles={[Role.TEACHER]}><ComingSoon title={t('nav.myGroups')} /></RequireAuth>} />
      <Route path="/teacher/tasks" element={<RequireAuth roles={[Role.TEACHER]}><ComingSoon title={t('nav.tasks')} /></RequireAuth>} />
      <Route path="/teacher/grading" element={<RequireAuth roles={[Role.TEACHER]}><ComingSoon title={t('nav.grading')} /></RequireAuth>} />
      <Route path="/teacher/rating" element={<RequireAuth roles={[Role.TEACHER]}><ComingSoon title={t('nav.groupRating')} /></RequireAuth>} />

      {/* Student */}
      <Route path="/student" element={<RequireAuth roles={[Role.STUDENT]}><StudentHome /></RequireAuth>} />
      <Route path="/student/tasks" element={<RequireAuth roles={[Role.STUDENT]}><ComingSoon title={t('nav.tasks')} /></RequireAuth>} />
      <Route path="/student/results" element={<RequireAuth roles={[Role.STUDENT]}><ComingSoon title={t('nav.myResults')} /></RequireAuth>} />
      <Route path="/student/attendance" element={<RequireAuth roles={[Role.STUDENT]}><ComingSoon title={t('nav.attendance')} /></RequireAuth>} />
      <Route path="/student/payments" element={<RequireAuth roles={[Role.STUDENT]}><ComingSoon title={t('nav.payments')} /></RequireAuth>} />
      <Route path="/student/profile" element={<RequireAuth roles={[Role.STUDENT]}><ComingSoon title={t('nav.profile')} /></RequireAuth>} />

      {/* Shared */}
      <Route
        path="/chat"
        element={
          <RequireAuth roles={[Role.FULL_ADMIN, Role.TEACHER, Role.STUDENT]}>
            <ComingSoon title={t('nav.chat')} />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
