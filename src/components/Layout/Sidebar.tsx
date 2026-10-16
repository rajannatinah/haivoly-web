import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Sparkles,
  Sprout,
  ChevronLeft,
  Map,
  TreePine,
  Wrench,
  Eye,
  Wheat,
  Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUtilisateur } from './UserProvider';

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

const NAV = [
  { to: '/', label: 'navigation.dashboard', icon: LayoutDashboard, desc: 'navigation.vueEnsemble' },
  { to: '/actions', label: 'navigation.actionsMobiles', icon: Activity, desc: 'navigation.fluxSync' },
  { to: '/recommandations', label: 'navigation.recommandations', icon: Sparkles, desc: 'navigation.versMobile' },
  { to: '/utilisateurs', label: 'navigation.utilisateurs', icon: Users, desc: 'navigation.perimetreComptes' },
  { to: '/parcelles', label: 'navigation.parcelles', icon: Map, desc: 'navigation.geometrie' },
  { to: '/cultures', label: 'navigation.cultures', icon: TreePine, desc: 'navigation.cycleVie' },
  { to: '/interventions', label: 'navigation.interventions', icon: Wrench, desc: 'navigation.travaux' },
  { to: '/observations', label: 'navigation.observations', icon: Eye, desc: 'navigation.terrain' },
  { to: '/recoltes', label: 'navigation.recoltes', icon: Wheat, desc: 'navigation.rendements' },
];


export function Sidebar({ collapsed, onToggle }: Readonly<Props>) {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { utilisateur, chargement } = useUtilisateur();

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
        </nav>
      </div>
    </aside>
  );
}
