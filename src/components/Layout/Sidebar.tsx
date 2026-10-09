import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Sparkles,
  Sprout,
  ChevronLeft,
  LogOut,
  Bell,
  ShieldCheck,
  Leaf,
  Users,
} from 'lucide-react';
import { useConfirm } from '../ui/ConfirmProvider';

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  onLogout: () => void;
}

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, badge: null, desc: 'Vue d’ensemble' },
  { to: '/actions', label: 'Actions mobiles', icon: Activity, badge: 'Live', desc: 'Flux & sync' },
  { to: '/recommandations', label: 'Recommandations', icon: Sparkles, badge: null, desc: '→ Mobile' },
];

const secondary = [
  { to: '/actions?status=PENDING', label: 'Queue offline', icon: ShieldCheck, badge: '7' },
  { to: '/actions?status=FAILED', label: 'À diagnostiquer', icon: Bell, badge: null },
];

export function Sidebar({ collapsed, onToggle, onLogout }: Props) {
  const { pathname } = useLocation();
  const confirm = useConfirm();

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Se déconnecter ?',
      description: 'Vous serez redirigé vers la page de connexion. Votre session locale sera fermée.',
      confirmLabel: 'Se déconnecter',
      cancelLabel: 'Rester connecté',
      variant: 'primary',
    });
    if (ok) onLogout();
  };

  return (
    <aside className={`sidebar ${collapsed ? 'is-collapsed' : ''}`} aria-label="Navigation principale">
      <div className="sidebar-inner">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-mark" aria-hidden>
            <Sprout size={18} color="white" strokeWidth={2.2} />
          </div>
          <div className="brand-text">
            <div className="brand-title">
              Haivoly <span className="brand-badge">PRO</span>
            </div>
            <div className="brand-subtitle">Suivi • Antananarivo</div>
          </div>
          <button
            className="sidebar-collapse"
            onClick={onToggle}
            aria-label={collapsed ? 'Étendre la barre latérale' : 'Réduire la barre latérale'}
            title={collapsed ? 'Étendre (⌘B)' : 'Réduire (⌘B)'}
          >
            <ChevronLeft size={14} style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 220ms var(--ease-spring)' }} />
          </button>
        </div>

        {/* Primary nav */}
        <nav className="nav" aria-label="Principal">
          <div className="nav-section">
            <div className="nav-section-title">
              <span>Général</span>
            </div>
          </div>
          {nav.map((item) => {
            const isActive = pathname === item.to || (item.to !== '/' && pathname.startsWith(item.to.split('?')[0]));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={() => `nav-item ${isActive ? 'is-active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <span className="nav-icon" aria-hidden>
                  <item.icon size={16} strokeWidth={2} />
                </span>
                <span className="nav-label">{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
                {!collapsed && <span className="nav-chevron" aria-hidden>›</span>}
                {collapsed && <span className="nav-tip">{item.label}</span>}
              </NavLink>
            );
          })}

          <div className="nav-section">
            <div className="nav-section-title">
              <span>Système</span>
            </div>
          </div>
          {secondary.map((item) => (
            <NavLink key={item.label} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`} title={collapsed ? item.label : undefined}>
              <span className="nav-icon">
                <item.icon size={15} />
              </span>
              <span className="nav-label">{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
              {collapsed && <span className="nav-tip">{item.label}</span>}
            </NavLink>
          ))}

          {/* Hint card when expanded */}
          {!collapsed && (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 14,
                background: 'rgba(255,255,255,.06)',
                border: '1px solid rgba(255,255,255,.08)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'white', fontWeight: 800, fontSize: 12.5 }}>
                <Leaf size={14} color="#86EFAC" /> Offline-first
              </div>
              <div style={{ fontSize: 11.5, lineHeight: 1.5, color: 'rgba(255,255,255,.64)', marginTop: 4, fontWeight: 500 }}>
                Actions mobiles → queue → sync robuste → recommandations → centre de notifications.
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <span className="badge" style={{ background: 'rgba(255,255,255,.10)', borderColor: 'rgba(255,255,255,.12)', color: 'white' }}>
                  <span className="kpi-dot" style={{ background: '#10B981' }} /> Sync 99.2%
                </span>
                <span className="badge" style={{ background: 'rgba(255,255,255,.10)', borderColor: 'rgba(255,255,255,.12)', color: 'white' }}>
                  <Users size={10} /> 128
                </span>
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="sidebar-foot">
          <div className="user-card">
            <div className="user-avatar">AD</div>
            <div className="user-meta">
              <div className="user-name">Admin Haivoly</div>
              <div className="user-email">admin@haivoly.mg</div>
            </div>
            <button className="user-action" onClick={handleLogout} aria-label="Se déconnecter" title="Se déconnecter">
              <LogOut size={15} />
            </button>
          </div>
          {!collapsed && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 2px 0', fontSize: 11, color: 'rgba(255,255,255,.42)', fontWeight: 600 }}>
              <span>© {new Date().getFullYear()} Haivoly</span>
              <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: '#22C55E', boxShadow: '0 0 0 4px rgba(34,197,94,.14)' }} /> Opérationnel
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
