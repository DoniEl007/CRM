import { AppShell } from '../components/AppShell/AppShell.js';

export function ComingSoon({ title }: { title: string }) {
  return (
    <AppShell title={title}>
      <section className="section">
        <div className="card">
          <p className="t-body muted">This screen is being built next.</p>
        </div>
      </section>
    </AppShell>
  );
}
