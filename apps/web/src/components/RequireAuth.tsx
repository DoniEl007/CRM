import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context.js';
import type { Role } from '../types/api.js';

export function RequireAuth({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const { user, status } = useAuth();

  if (status === 'loading') {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <p className="t-body muted">Loading…</p>
      </div>
    );
  }

  if (status === 'anonymous' || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
