import { useLocation } from 'react-router-dom';
import { Menu, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { SelecteurLangue } from '../ui/SelecteurLangue';
import { ClocheNotifications } from './ClocheNotifications';
import { MenuUtilisateur } from './MenuUtilisateur';

/**
 * Titre et sous-titre par route, exprimés en clés de traduction. Chaque page
 * a désormais son propre titre (lot 9) : le repli sur « Actions mobiles »
 * affichait un titre faux sur la moitié de l'application.
 */
const TITRES: Record<string, { title: string; desc: string }> = {
  '/': { title: 'topbar.dashboard', desc: 'topbar.dashboardDesc' },
  '/actions': { title: 'topbar.actions', desc: 'topbar.actionsDesc' },
  '/recommandations': { title: 'topbar.recommandations', desc: 'topbar.recommandationsDesc' },
  '/utilisateurs': { title: 'navigation.utilisateurs', desc: 'navigation.perimetreComptes' },
  '/parcelles': { title: 'navigation.parcelles', desc: 'navigation.geometrie' },
  '/cultures': { title: 'navigation.cultures', desc: 'navigation.cycleVie' },
  '/interventions': { title: 'navigation.interventions', desc: 'navigation.travaux' },
  '/observations': { title: 'navigation.observations', desc: 'navigation.terrain' },
  '/recoltes': { title: 'navigation.recoltes', desc: 'navigation.rendements' },
  '/profil': { title: 'navigation.profil', desc: 'navigation.monCompte' },
};

export function TopBar({ onMenu, onLogout }: { onMenu: () => void; onLogout: () => void }) {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const meta = TITRES[pathname] ?? { title: 'topbar.fallback', desc: 'topbar.fallbackDesc' };

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="topbar-left">
          <button
            className="icon-btn mobile-header"
            onClick={onMenu}
            aria-label={t('commun.actions.ouvrirMenu')}
            title={t('topbar.menu')}
            style={{ width: 42, height: 42, background: '#0F1A0F', borderColor: '#0F1A0F', color: 'white' }}
          >
            <Menu size={18} />
          </button>
          <div className="topbar-title">
            <h1>
              {pathname === '/' ? <Sparkles size={16} color="#2E7D32" /> : null}
              {t(meta.title)}
            </h1>
            <p>{t(meta.desc)}</p>
          </div>
        </div>

        <div className="topbar-actions">
          <SelecteurLangue />
          <ClocheNotifications />
          <MenuUtilisateur onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
}
