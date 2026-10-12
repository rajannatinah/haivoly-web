import { useEffect, useState, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Menu, Sprout, X } from 'lucide-react';

export function AppShell() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('haivoly_sidebar_collapsed') === '1';
    } catch {
      return false;
    }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem('haivoly_web_token');
    nav('/login', { replace: true });
  }, [nav]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem('haivoly_sidebar_collapsed', next ? '1' : '0');
      } catch {}
      return next;
    });
  }, []);

  // Keyboard shortcut ⌘B / Ctrl+B
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        if (window.innerWidth > 1024) toggleCollapsed();
        else setDrawerOpen((v) => !v);
      }
      if (e.key === 'Escape' && drawerOpen) setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleCollapsed, drawerOpen]);

  // Close drawer on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 1024 && drawerOpen) setDrawerOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [drawerOpen]);

  return (
    <div className="shell">
      <div className={`shell-inner ${collapsed ? 'is-collapsed' : ''}`}>
        {/* Desktop sidebar */}
        <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} onLogout={logout} />

        {/* Mobile drawer */}
        <div className={`drawer-backdrop ${drawerOpen ? 'is-open' : ''}`} onClick={() => setDrawerOpen(false)} aria-hidden />
        <div className={`drawer ${drawerOpen ? 'is-open' : ''}`} role="dialog" aria-modal="true" aria-label={t('sidebar.menu')}>
          {/* Reuse sidebar but always expanded inside drawer */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 12px', borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.03)' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'white', fontWeight: 900 }}>
                <span style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg,#2E7D32,#81C784)', display: 'grid', placeItems: 'center' }}>
                  <Sprout size={16} color="white" />
                </span>
                Haivoly
              </div>
              <button className="icon-btn" onClick={() => setDrawerOpen(false)} aria-label={t('commun.actions.fermerMenu')} style={{ background: 'rgba(255,255,255,.08)', borderColor: 'rgba(255,255,255,.12)', color: 'white' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <Sidebar collapsed={false} onToggle={() => setDrawerOpen(false)} onLogout={logout} />
            </div>
          </div>
        </div>

        {/* Mobile header duplicate for extra control */}
        <div className="main-wrap">
          {/* Mobile top bar hidden on desktop handled by TopBar but we keep one for drawer toggle */}
          <div className="mobile-header" style={{ height: 56, background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #E5E7EB', display: 'none', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', position: 'sticky', top: 0, zIndex: 30 } as any}>
            <button className="icon-btn" onClick={() => setDrawerOpen(true)} aria-label={t('commun.actions.ouvrirMenu')}>
              <Menu size={18} />
            </button>
            <div style={{ fontWeight: 900, letterSpacing: -0.02, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ width: 28, height: 28, borderRadius: 10, background: '#2E7D32', display: 'grid', placeItems: 'center' }}>
                <Sprout size={16} color="white" />
              </span>
              Haivoly
            </div>
            <span style={{ width: 40 }} />
          </div>

          <TopBar onMenu={() => setDrawerOpen(true)} onLogout={logout} />
          <main className="main-content">
            <div className="page">
              <Outlet />
            </div>
          </main>
          <footer style={{ borderTop: '1px solid #EAECF0', background: 'white', marginTop: 8 }}>
            <div style={{ maxWidth: 1440 - 32, margin: '0 auto', padding: '14px 22px', display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12, color: '#98A2B3', flexWrap: 'wrap' }}>
              <span>{t('pied.copyright', { annee: new Date().getFullYear() })} — {t('pied.slogan')}</span>
              <span style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                <span>{t('pied.ville')}</span>
                <span style={{ width: 1, height: 12, background: '#E5E7EB', display: 'inline-block' }} />
                <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ width: 7, height: 7, borderRadius: 999, background: '#10B981', boxShadow: '0 0 0 4px rgba(16,185,129,.14)' }} /> {t('pied.systemeOperationnel')}
                </span>
              </span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
