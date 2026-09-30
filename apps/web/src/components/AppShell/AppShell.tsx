import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Languages, LayoutGrid } from 'lucide-react';
import { useAuth } from '../../lib/auth-context.js';
import { NAV_BY_ROLE, TABS_BY_ROLE, type NavItem } from './nav-config.js';
import { SUPPORTED_LOCALES } from '../../i18n/index.js';
import type { Locale } from '../../types/api.js';

const LOCALE_LABEL: Record<Locale, string> = {
  en: 'EN',
  ru: 'RU',
  'uz-Latn': "O'Z",
  'uz-Cyrl': 'ЎЗ',
};

function initialsOf(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function AppShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [langOpen, setLangOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  if (!user) return null;

  const groups = NAV_BY_ROLE[user.role];
  const tabKeys = TABS_BY_ROLE[user.role];
  const allItems = groups.flatMap((g) => g.items);
  const tabItems = tabKeys
    .map((key) => allItems.find((it) => it.key === key))
    .filter((it): it is NavItem => Boolean(it));
  const moreItems = allItems.filter((it) => !tabKeys.includes(it.key));
  const showMoreTab = moreItems.length > 0;

  return (
    <div className="app">
      <aside className="sidebar" aria-label="Main navigation">
        <a className="brand" href="/">
          <span className="brand-mark">H</span>
          <span className="brand-name">
            Helpdesk IT
            <small>Learning center</small>
          </span>
        </a>
        {groups.map((group) => (
          <nav className="nav" key={group.labelKey}>
            <div className="nav-label">{t(group.labelKey)}</div>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.key} to={item.path} className="nav-item">
                  <Icon className="ic" />
                  <span>{t(item.labelKey)}</span>
                </NavLink>
              );
            })}
          </nav>
        ))}
        <div className="sidebar-foot">
          <div className="role-chip">
            <span className="avatar sm">{initialsOf(user.firstName, user.lastName)}</span>
            <span className="stack-2" style={{ gap: 0 }}>
              <b style={{ fontSize: 16, lineHeight: '22px' }}>
                {user.firstName} {user.lastName}
              </b>
              <span className="t-caption muted">{t(`roles.${user.role}`)}</span>
            </span>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-title">
            <h1 className="t-h3">{title}</h1>
            {subtitle && <p className="t-caption hide-m">{subtitle}</p>}
          </div>
          <div className="topbar-actions" style={{ position: 'relative' }}>
            <button
              className="lang"
              type="button"
              aria-label={`Language: ${LOCALE_LABEL[i18n.language as Locale] ?? 'EN'}`}
              onClick={() => setLangOpen((v) => !v)}
            >
              <Languages className="ic ic-sm" />
              {LOCALE_LABEL[i18n.language as Locale] ?? 'EN'}
            </button>
            {langOpen && (
              <div
                className="card"
                style={{ position: 'absolute', top: 52, right: 0, zIndex: 30, padding: 8, minWidth: 140 }}
              >
                {SUPPORTED_LOCALES.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    className="nav-item"
                    style={{ width: '100%' }}
                    onClick={() => {
                      void i18n.changeLanguage(loc);
                      setLangOpen(false);
                    }}
                  >
                    <span>{LOCALE_LABEL[loc]}</span>
                  </button>
                ))}
              </div>
            )}
            <button className="icon-btn" type="button" aria-label="Notifications">
              <Bell className="ic" />
            </button>
            <span className="avatar sm hide-m" aria-hidden="true">
              {initialsOf(user.firstName, user.lastName)}
            </span>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>

      <nav className="tabbar" aria-label="Main navigation">
        {tabItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.key} to={item.path} className="tab">
              <span className="tab-ic">
                <Icon className="ic" />
              </span>
              {t(item.labelKey).split(' ')[0]}
            </NavLink>
          );
        })}
        {showMoreTab && (
          <button className="tab" type="button" onClick={() => setMoreOpen(true)}>
            <span className="tab-ic">
              <LayoutGrid className="ic" />
            </span>
            {t('nav.more')}
          </button>
        )}
      </nav>

      {moreOpen && (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            background: 'rgba(15,23,42,.35)',
            display: 'flex',
            alignItems: 'flex-end',
          }}
          onClick={() => setMoreOpen(false)}
        >
          <div
            style={{
              width: '100%',
              background: 'var(--bg)',
              borderRadius: '28px 28px 0 0',
              padding: '12px 16px calc(24px + env(safe-area-inset-bottom, 0px))',
              boxShadow: 'var(--shadow-modal)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{ width: 48, height: 5, borderRadius: 9, background: 'var(--ink-faint)', margin: '0 auto 12px' }}
            />
            <div className="nav">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.key} to={item.path} className="nav-item" onClick={() => setMoreOpen(false)}>
                    <Icon className="ic" />
                    <span>{t(item.labelKey)}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
