import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, GraduationCap, UsersRound, Wallet, TriangleAlert } from 'lucide-react';
import { AppShell } from '../../components/AppShell/AppShell.js';
import { api } from '../../lib/api-client.js';
import type { AnalyticsOverview } from '../../types/api.js';

export function AdminDashboard() {
  const { t } = useTranslation();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<AnalyticsOverview>('/reports/analytics/overview')
      .then((data) => {
        if (!cancelled) setOverview(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const maxRevenue = overview ? Math.max(...overview.revenueByMonth.map((m) => Number(m.amount)), 1) : 1;

  return (
    <AppShell title={t('nav.dashboard')} subtitle="Helpdesk IT — overview">
      {error && (
        <div className="card" style={{ borderColor: 'var(--coral)' }}>
          <p className="t-body">{error}</p>
        </div>
      )}

      <section className="section">
        <div className="section-head">
          <h2 className="t-h3">{t('nav.overview')}</h2>
        </div>
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          <div className="card stat">
            <span className="stat-label">
              <GraduationCap className="ic ic-sm" />
              Active students
            </span>
            <span className="stat-value">{overview?.activeStudents ?? '—'}</span>
          </div>
          <div className="card stat">
            <span className="stat-label">
              <Users className="ic ic-sm" />
              Teachers
            </span>
            <span className="stat-value">{overview?.totalTeachers ?? '—'}</span>
          </div>
          <div className="card stat">
            <span className="stat-label">
              <UsersRound className="ic ic-sm" />
              Groups
            </span>
            <span className="stat-value">{overview?.totalGroups ?? '—'}</span>
          </div>
          <div className="card stat">
            <span className="stat-label">
              <Wallet className="ic ic-sm" />
              Revenue (all time)
            </span>
            <span className="stat-value">{overview ? Number(overview.totalRevenueAllTime).toLocaleString() : '—'}</span>
          </div>
          <div className="card stat">
            <span className="stat-label">
              <TriangleAlert className="ic ic-sm" />
              Outstanding / overdue
            </span>
            <span className="stat-value">{overview?.outstandingCount ?? '—'}</span>
          </div>
        </div>
      </section>

      {overview && overview.revenueByMonth.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2 className="t-h3">Revenue by month</h2>
          </div>
          <div className="card">
            <div className="bars">
              {overview.revenueByMonth.map((m) => (
                <div
                  key={m.month}
                  className="bar"
                  style={{ ['--v' as string]: String(Number(m.amount) / maxRevenue) }}
                  data-tip={`${m.month}: ${Number(m.amount).toLocaleString()}`}
                >
                  <span className="val">{Number(m.amount).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {overview && overview.topStudents.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2 className="t-h3">Top students</h2>
          </div>
          <div className="card stack-2">
            {overview.topStudents.map((s) => (
              <div className="row between" key={s.studentUserId} style={{ padding: '6px 0' }}>
                <span className="t-body">
                  {s.firstName} {s.lastName}
                </span>
                <span className="t-body num">
                  {s.correctCount}/{s.totalCount}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}
