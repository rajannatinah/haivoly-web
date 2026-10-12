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
  Map,
  TreePine,
  Wrench,
  Eye,
  Wheat,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '../ui/ConfirmProvider';
import { useUtilisateur } from './UserProvider';

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  onLogout: () => void;
}

const NAV = [
  { to: '/', label: 'navigation.dashboard', icon: LayoutDashboard, desc: 'navigation.vueEnsemble' },
  { to: '/actions', label: 'navigation.actionsMobiles', icon: Activity, desc: 'navigation.fluxSync' },
  { to: '/recommandations', label: 'navigation.recommandations', icon: Sparkles, desc: 'navigation.versMobile' },
  { to: '/parcelles', label: 'navigation.parcelles', icon: Map, desc: 'navigation.geometrie' },
  { to: '/cultures', label: 'navigation.cultures', icon: TreePine, desc: 'navigation.cycleVie' },
  { to: '/interventions', label: 'navigation.interventions', icon: Wrench, desc: 'navigation.travaux' },
  { to: '/observations', label: 'navigation.observations', icon: Eye, desc: 'navigation.terrain' },
  { to: '/recoltes', label: 'navigation.recoltes', icon: Wheat, desc: 'navigation.rendements' },
];

const SECONDARY = [
  { to: '/actions?status=PENDING', label: 'navigation.queueOffline', icon: ShieldCheck },
  { to: '/actions?status=FAILED', label: 'navigation.aDiagnostiquer', icon: Bell },
];

/** Initiales affichées dans l'avatar, dérivées de l'utilisateur réel. */
function initialesDe(u: { nom: string | null; prenom: string | null; email: string } | null): string {
  if (!u) return '··';
  const src = `${u.prenom ?? ''} ${u.nom ?? ''}`.trim();
  if (!src) return u.email.slice(0, 2).toUpperCase();
  return src
    .split(/\s+/)
    .slice(0, 2)
    .map((m) => m[0]?.toUpperCase() ?? '')
    .join('');
}


export function Sidebar({ collapsed, onToggle, onLogout }: Readonly<Props>) {
  const { pathname } = useLocation();
  const confirm = useConfirm();
  const { t } = useTranslation();
  const { utilisateur, chargement } = useUtilisateur();

  const handleLogout = async () => {
    const ok = await confirm({
      title: t('commun.actions.seDeconnecter'),
      description: t('sidebar.confirmationDeconnexion'),
      confirmLabel: t('commun.actions.seDeconnecter'),
      cancelLabel: t('commun.actions.resterConnecte'),
      variant: 'primary',
    });
    if (ok) onLogout();
  };

  return (
    <aside className={`sidebar ${collapsed ? 'is-collapsed' : ''}`} aria-label={t('navigation.navigationPrincipale')}>
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
            <div className="brand-subtitle">{t('navigation.suiviAntananarivo')}</div>
          </div>
          <button
            className="sidebar-collapse"
            onClick={onToggle}
            aria-label={collapsed ? t('sidebar.etendre') : t('sidebar.reduire')}
            title={collapsed ? t('sidebar.etendre') : t('sidebar.reduire')}
          >
            <ChevronLeft size={16} style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 220ms var(--ease-spring)' }} />
          </button>
        </div>

        {/* Primary nav */}
        <nav className="nav" aria-label={t('navigation.principal')}>
          <div className="nav-section">
            <div className="nav-section-title">
              <span>{t('navigation.general')}</span>
            </div>
          </div>
          {NAV.map((item) => {
            const isActive = pathname === item.to || (item.to !== '/' && pathname.startsWith(item.to.split('?')[0]));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={() => `nav-item ${isActive ? 'is-active' : ''}`}
                title={collapsed ? t(item.label) : undefined}
              >
                <span className="nav-icon" aria-hidden>
                  <item.icon size={16} strokeWidth={2} />
                </span>
                <span className="nav-label">{t(item.label)}</span>
                {!collapsed && <span className="nav-chevron" aria-hidden>›</span>}
                {collapsed && <span className="nav-tip">{t(item.label)}</span>}
              </NavLink>
            );
          })}

          <div className="nav-section">
            <div className="nav-section-title">
              <span>{t('navigation.systeme')}</span>
            </div>
          </div>
          {SECONDARY.map((item) => (
            <NavLink key={item.label} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`} title={collapsed ? t(item.label) : undefined}>
              <span className="nav-icon">
                <item.icon size={16} />
              </span>
              <span className="nav-label">{t(item.label)}</span>
              {collapsed && <span className="nav-tip">{t(item.label)}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-foot">
          <div className="user-card">
            <div className="user-avatar">{initialesDe(utilisateur)}</div>
            <div className="user-meta">
              <div className="user-name">
                {chargement
                  ? t('sidebar.chargementUtilisateur')
                  : utilisateur
                    ? [utilisateur.prenom, utilisateur.nom].filter(Boolean).join(' ') || utilisateur.email
                    : t('sidebar.utilisateurIndisponible')}
              </div>
              <div className="user-email">{utilisateur?.email ?? '—'}</div>
            </div>
            <button className="user-action" onClick={handleLogout} aria-label={t('commun.actions.seDeconnecter')} title={t('commun.actions.seDeconnecter')}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
