import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Wallet, CalendarCheck } from 'lucide-react';
import { AppShell } from '../../components/AppShell/AppShell.js';
import { useAuth } from '../../lib/auth-context.js';
import { api } from '../../lib/api-client.js';
import {
  PaymentStatus,
  SubmissionStatus,
  type AttendanceRecord,
  type MyPaymentsResponse,
  type StudentTask,
} from '../../types/api.js';

const STATUS_PILL_CLASS: Record<PaymentStatus, string> = {
  [PaymentStatus.CURRENT]: 'pill st-paid',
  [PaymentStatus.OUTSTANDING]: 'pill st-due',
  [PaymentStatus.OVERDUE]: 'pill st-overdue',
};

export function StudentHome() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<StudentTask[] | null>(null);
  const [payments, setPayments] = useState<MyPaymentsResponse | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get<StudentTask[]>('/tasks/mine'),
      api.get<MyPaymentsResponse>('/payments/me'),
      api.get<AttendanceRecord[]>('/attendance/me'),
    ])
      .then(([t, p, a]) => {
        if (cancelled) return;
        setTasks(t);
        setPayments(p);
        setAttendance(a);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pendingTasks = tasks?.filter((task) => task.submissionStatus !== SubmissionStatus.GRADED) ?? [];
  const recentAttendance = attendance?.slice(0, 5) ?? [];
  const presentCount = attendance?.filter((r) => r.present).length ?? 0;
  const attendanceRate = attendance && attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : null;

  const taskTitle = (task: StudentTask) => {
    switch (i18n.language) {
      case 'ru':
        return task.titleRu;
      case 'uz-Latn':
        return task.titleUzLatn;
      case 'uz-Cyrl':
        return task.titleUzCyrl;
      default:
        return task.titleEn;
    }
  };

  return (
    <AppShell title={t('nav.home')} subtitle={user ? `${user.firstName} ${user.lastName}` : undefined}>
      {error && (
        <div className="card" style={{ borderColor: 'var(--coral)' }}>
          <p className="t-body">{error}</p>
        </div>
      )}

      <section className="section">
        <div className="section-head">
          <h2 className="t-h3">{t('nav.tasks')}</h2>
        </div>
        <div className="card stack-2">
          <div className="stat">
            <span className="stat-label">
              <ClipboardList className="ic ic-sm" />
              {t('nav.tasks')}
            </span>
            <span className="stat-value">{tasks === null ? '—' : pendingTasks.length}</span>
          </div>
          {tasks && tasks.length === 0 && <p className="t-caption muted">No tasks assigned yet.</p>}
          {tasks &&
            tasks.slice(0, 5).map((task) => (
              <div className="row between" key={task.id} style={{ padding: '8px 0', borderTop: '1px solid var(--outline)' }}>
                <span className="t-body">{taskTitle(task)}</span>
                <span className={`pill ${task.submissionStatus === SubmissionStatus.GRADED ? 'st-paid' : 'st-due'}`}>
                  {task.submissionStatus ?? 'NOT SUBMITTED'}
                </span>
              </div>
            ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="t-h3">{t('nav.payments')}</h2>
        </div>
        <div className="card row between">
          <span className="stat-label">
            <Wallet className="ic ic-sm" />
            {t('nav.payments')}
          </span>
          {payments && <span className={STATUS_PILL_CLASS[payments.status.status]}>{payments.status.status}</span>}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="t-h3">{t('nav.attendance')}</h2>
        </div>
        <div className="card stack-2">
          <div className="stat">
            <span className="stat-label">
              <CalendarCheck className="ic ic-sm" />
              {t('nav.attendance')}
            </span>
            <span className="stat-value">
              {attendanceRate === null ? '—' : attendanceRate}
              {attendanceRate !== null && <small>%</small>}
            </span>
          </div>
          {recentAttendance.map((record) => (
            <div className="row between" key={record.id} style={{ padding: '4px 0' }}>
              <span className="t-caption muted">{new Date(record.date).toLocaleDateString()}</span>
              <span className={`pill ${record.present ? 'st-present' : 'st-absent'}`}>{record.present ? 'Present' : 'Absent'}</span>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
