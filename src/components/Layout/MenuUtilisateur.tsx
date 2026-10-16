import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, CircleUser, LogOut, Settings } from 'lucide-react';

import { useConfirm } from '../ui/ConfirmProvider';
import { useMenuDeroulant } from '../ui/useMenuDeroulant';
import { useUtilisateur } from './UserProvider';
import { initialesDe } from '../../utils/initiales';

interface Props {
  onLogout: () => void;
}

/**
 * Le profil vit désormais dans la barre du haut (demande lot 9) : l'avatar
 * ouvre un menu déroulant avec Profil, Paramètres et Déconnexion — les trois
 * accès qui étaient dispersés entre la barre latérale et la barre du haut.
 */
export function MenuUtilisateur({ onLogout }: Readonly<Props>) {
  const { t } = useTranslation();
  const nav = useNavigate();
  const confirm = useConfirm();
  const { utilisateur, chargement } = useUtilisateur();
  const menu = useMenuDeroulant();

  const nomAffiche = chargement
    ? t('sidebar.chargementUtilisateur')
    : utilisateur
      ? [utilisateur.prenom, utilisateur.nom].filter(Boolean).join(' ') ||
        utilisateur.email
      : t('sidebar.utilisateurIndisponible');

  const aller = (chemin: string) => {
    menu.fermer();
    nav(chemin);
  };

  const deconnexion = async () => {
    menu.fermer();
    const ok = await confirm({
      title: t('topbar.deconnexion'),
      description: t('topbar.confirmationDeconnexion'),
      confirmLabel: t('commun.actions.seDeconnecter'),
      cancelLabel: t('commun.actions.resterConnecte'),
      variant: 'primary',
    });
    if (ok) onLogout();
  };

  return (
    <div className="menu" ref={menu.ref}>
      <button
        type="button"
        className="btn-profil"
        data-declencheur
        data-testid="menu-utilisateur"
        aria-expanded={menu.ouvert}
        aria-label={t('navigation.monCompte')}
        title={t('navigation.monCompte')}
        onClick={menu.basculer}
      >
        <span className="btn-profil-avatar" aria-hidden>
          {initialesDe(utilisateur)}
        </span>
        <span className="btn-profil-nom hide-mobile">{nomAffiche}</span>
        <ChevronDown size={14} className={`btn-profil-chevron ${menu.ouvert ? 'is-ouvert' : ''}`} aria-hidden />
      </button>

      {menu.ouvert ? (
        <div className="menu-panneau menu-profil" data-testid="menu-utilisateur-panneau" role="menu" aria-label={t('navigation.monCompte')}>
          <div className="menu-profil-entete">
            <div className="menu-profil-nom">{nomAffiche}</div>
            <div className="menu-profil-email">{utilisateur?.email ?? '—'}</div>
            {utilisateur?.role ? <span className={`badge ${utilisateur.role === 'PROPRIETAIRE' ? 'badge-primary' : 'badge-info'}`}>{utilisateur.role}</span> : null}
          </div>
          <div className="menu-separateur" role="separator" />
          <button type="button" className="menu-item" role="menuitem" data-testid="menu-profil" onClick={() => aller('/profil')}>
            <CircleUser size={16} /> {t('topbar.monProfil')}
          </button>
          <button type="button" className="menu-item" role="menuitem" data-testid="menu-parametres" onClick={() => aller('/profil?tab=parametres')}>
            <Settings size={16} /> {t('topbar.parametres')}
          </button>
          <div className="menu-separateur" role="separator" />
          <button type="button" className="menu-item menu-item-danger" role="menuitem" data-testid="menu-deconnexion" onClick={() => void deconnexion()}>
            <LogOut size={16} /> {t('commun.actions.seDeconnecter')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
