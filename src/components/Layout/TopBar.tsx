import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, LogOut, Menu, Command, Sparkles } from 'lucide-react';
import { useConfirm } from '../ui/ConfirmProvider';

const titles: Record<string, { title: string; desc: string }> = {
  '/': { title: 'Dashboard', desc: 'Vue d’ensemble • temps réel • Antananarivo' },
  '/actions': { title: 'Actions mobiles', desc: 'Historique complet • filtrage • pagination' },
  '/recommandations': { title: 'Recommandations → Mobile', desc: 'Création web → sync offline → notification mobile' },
};

export function TopBar({ onMenu, onLogout }: { onMenu: () => void; onLogout: () => void }) {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const confirm = useConfirm();
  const meta = titles[pathname] ?? titles['/actions'] ?? { title: 'Haivoly', desc: 'Suivi & Dashboard' };

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Se déconnecter ?',
      description: 'Vous allez quitter le dashboard web. Il faudra vous reconnecter pour accéder aux données.',
      confirmLabel: 'Se déconnecter',
      cancelLabel: 'Annuler',
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
            aria-label="Ouvrir le menu"
            title="Menu (⌘B)"
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
          <button className="icon-btn mobile-header" onClick={onMenu} aria-label="Ouvrir le menu" style={{ width: 42, height: 42, background: '#0F1A0F', borderColor: '#0F1A0F', color: 'white' }}>
            <Menu size={18} />
          </button>
          <div className="topbar-title">
            <h1>
              {pathname === '/' ? <Sparkles size={16} color="#2E7D32" /> : null}
              {meta.title}
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
                <Command size={10} /> ⌘K
              </span>
            </h1>
            <p>{meta.desc}</p>
          </div>
        </div>

        <div className="topbar-actions">
          <div className="search" style={{ display: 'none' } as any}>
            <Search size={16} />
            <input className="input" placeholder="Rechercher (⌘K) — utilisateur, action, parcelle…" />
          </div>
          <button
            className="icon-btn has-dot"
            aria-label="Notifications"
            title="Notifications"
            onClick={() => nav('/recommandations')}
          >
            <Bell size={18} />
          </button>
          <button onClick={handleLogout} className="btn btn-outline" style={{ minHeight: 40, padding: '0 14px', gap: 8 }}>
            <LogOut size={16} /> <span className="hide-mobile">Déconnexion</span>
          </button>
        </div>
      </div>
    </header>
  );
}
