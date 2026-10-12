import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, LogOut, Menu, Command, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '../ui/ConfirmProvider';
import { SelecteurLangue } from '../ui/SelecteurLangue';

/** Titre et sous-titre par route, exprimés en clés de traduction. */
const TITRES: Record<string, { title: string; desc: string }> = {
  '/': { title: 'topbar.dashboard', desc: 'topbar.dashboardDesc' },
  '/actions': { title: 'topbar.actions', desc: 'topbar.actionsDesc' },
  '/recommandations': { title: 'topbar.recommandations', desc: 'topbar.recommandationsDesc' },
};

export function TopBar({ onMenu, onLogout }: { onMenu: () => void; onLogout: () => void }) {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const confirm = useConfirm();
  const { t } = useTranslation();
  const meta = TITRES[pathname] ?? TITRES['/actions'] ?? { title: 'topbar.fallback', desc: 'topbar.fallbackDesc' };

  const handleLogout = async () => {
    const ok = await confirm({
      title: t('topbar.deconnexion'),
      description: t('topbar.confirmationDeconnexion'),
      confirmLabel: t('commun.actions.seDeconnecter'),
      cancelLabel: t('commun.actions.annuler'),
      variant: 'primary',
    });
    if (ok) onLogout();
  };

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="topbar-left">
          <button
            className="icon-btn"
            onClick={onMenu}
            aria-label={t('commun.actions.ouvrirMenu')}
            title={t('topbar.menu')}
            style={{
              width: 42,
              height: 42,
              background: '#0F1A0F',
              borderColor: '#0F1A0F',
              color: 'white',
              display: 'none',
            }}
          >
            <Menu size={18} />
          </button>
          {/* Mobile hamburger — visible ≤1024px via CSS */}
          <button className="icon-btn mobile-header" onClick={onMenu} aria-label={t('commun.actions.ouvrirMenu')} style={{ width: 42, height: 42, background: '#0F1A0F', borderColor: '#0F1A0F', color: 'white' }}>
            <Menu size={18} />
          </button>
          <div className="topbar-title">
            <h1>
              {pathname === '/' ? <Sparkles size={16} color="#2E7D32" /> : null}
              {t(meta.title)}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 0.06,
                  textTransform: 'uppercase',
                  background: '#F3F4F6',
                  border: '1px solid #E5E7EB',
                  color: '#475467',
                  padding: '2px 7px',
                  borderRadius: 999,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Command size={16} /> ⌘K
              </span>
            </h1>
            <p>{t(meta.desc)}</p>
          </div>
        </div>

        <div className="topbar-actions">
          <SelecteurLangue />
          <div className="search" style={{ display: 'none' } as any}>
            <Search size={16} />
            <input className="input" placeholder={t('topbar.recherchePlaceholder')} />
          </div>
          <button
            className="icon-btn has-dot"
            aria-label={t('topbar.notifications')}
            title={t('topbar.notifications')}
            onClick={() => nav('/recommandations')}
          >
            <Bell size={18} />
          </button>
          <button onClick={handleLogout} className="btn btn-outline">
            <LogOut size={16} /> <span className="hide-mobile">{t('topbar.deconnexion')}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
