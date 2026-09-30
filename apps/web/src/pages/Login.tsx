import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, LogIn, Eye, EyeOff, KeyRound, UserCog } from 'lucide-react';
import { useAuth } from '../lib/auth-context.js';
import { ApiError } from '../lib/api-client.js';
import { SUPPORTED_LOCALES } from '../i18n/index.js';
import { roleHome } from '../lib/role-home.js';
import type { Locale } from '../types/api.js';

const LOCALE_LABEL: Record<Locale, string> = {
  en: 'EN',
  ru: 'RU',
  'uz-Latn': "O'Z",
  'uz-Cyrl': 'ЎЗ',
};

export function LoginPage() {
  const { t, i18n } = useTranslation();
  const { user, status, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authenticated' && user) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError(t('auth.invalidCredentials'));
      } else {
        setError(t('auth.invalidCredentials'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login">
      <section className="login-art" aria-hidden="true">
        <span className="shape" style={{ left: -60, bottom: 120, width: 320, height: 220, background: 'var(--sky)' }} />
        <span
          className="shape"
          style={{ left: 180, bottom: 40, width: 300, height: 180, background: 'var(--bg)', border: '1px solid var(--outline)' }}
        />
        <span
          className="shape"
          style={{ right: 80, top: 180, width: 120, height: 120, borderRadius: 999, background: 'var(--sky-bright)' }}
        />
        <a className="brand" href="/" style={{ padding: 0, position: 'relative' }}>
          <span className="brand-mark">H</span>
          <span className="brand-name">
            Helpdesk IT
            <small>Learning center · Tashkent</small>
          </span>
        </a>
        <div
          className="stack-2"
          style={{ position: 'relative', maxWidth: 440, marginBottom: 'auto', marginTop: 'var(--space-16)' }}
        >
          <h2 className="t-h1">Your lessons, tasks and group chat in one place.</h2>
          <p className="t-body-lg muted">For students, teachers and staff of Helpdesk IT.</p>
        </div>
      </section>

      <section className="login-side">
        <div className="card login-card">
          <div className="row between">
            <a className="brand" href="/" style={{ padding: 0 }}>
              <span className="brand-mark">H</span>
              <span className="brand-name">Helpdesk IT</span>
            </a>
          </div>
          <div className="stack-2">
            <h1 className="t-h2">{t('auth.title')}</h1>
            <p className="t-small muted">{t('auth.subtitle')}</p>
          </div>
          <div className="segmented" role="group" aria-label="Language">
            {SUPPORTED_LOCALES.map((loc) => (
              <button
                key={loc}
                type="button"
                aria-pressed={i18n.language === loc}
                lang={loc}
                onClick={() => void i18n.changeLanguage(loc)}
              >
                {LOCALE_LABEL[loc]}
              </button>
            ))}
          </div>
          <form className="stack" style={{ gap: 'var(--space-4)' }} onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="email">{t('auth.email')}</label>
              <div className="input-icon">
                <Mail className="ic" />
                <input
                  className="input"
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="password">{t('auth.password')}</label>
              <div className="input-icon pw">
                <Lock className="ic" />
                <input
                  className="input"
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  className="icon-btn"
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="ic" /> : <Eye className="ic" />}
                </button>
              </div>
            </div>
            {error && <p className="t-caption" style={{ color: 'var(--coral-ink)' }}>{error}</p>}
            <button className="btn btn-primary btn-block" type="submit" disabled={submitting} style={{ marginTop: 'var(--space-2)' }}>
              <LogIn className="ic" />
              {submitting ? t('common.loading') : t('auth.logIn')}
            </button>
          </form>
          <div className="stack-2">
            <p className="hint note" style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
              <KeyRound className="ic ic-sm" />
              <span>
                <b style={{ color: 'var(--ink)' }}>{t('auth.forgotPassword')}</b> {t('auth.forgotPasswordHint')}
              </span>
            </p>
            <p className="hint note" style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
              <UserCog className="ic ic-sm" />
              <span>{t('auth.accountsNote')}</span>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
