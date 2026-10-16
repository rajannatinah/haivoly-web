import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  CheckCheck,
  Inbox,
  Info,
} from 'lucide-react';

import {
  getRecommendationsPourMoi,
  markAllRecommendationsRead,
  markRecommendationRead,
} from '../../services/api';
import { messageErreur } from '../ui/ErrorState';
import { useMenuDeroulant } from '../ui/useMenuDeroulant';
import { formaterDateHeure } from '../../i18n';
import { useNotifications } from './NotificationsProvider';
import { nomEmetteur } from '../../utils/emetteur';
import type { Recommendation } from '../../types';

const MAX_APERCUS = 8;

function iconeDe(r: Recommendation) {
  if (r.priority === 'URGENT') return <AlertTriangle size={15} color="#D92D20" />;
  if (r.priority === 'HIGH') return <AlertTriangle size={15} color="#F79009" />;
  if (r.type === 'SUCCESS') return <CheckCircle2 size={15} color="#039855" />;
  return <Info size={15} color="#1570EF" />;
}

/**
 * Cloche fonctionnelle : compteur de non-lues (badge), aperçu des dernières
 * notifications, « tout marquer comme lu » et ouverture du détail — qui marque
 * la notification lue puis redirige vers la page Recommandations.
 */
export function ClocheNotifications() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { nonLues, rafraichir } = useNotifications();
  const menu = useMenuDeroulant();

  const [liste, setListe] = useState<Recommendation[]>([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [traitement, setTraitement] = useState(false);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      setListe((await getRecommendationsPourMoi()) as Recommendation[]);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setChargement(false);
    }
  }, []);

  const ouvrir = () => {
    if (!menu.ouvert) void charger();
    menu.basculer();
  };

  const ouvrirDetail = async (r: Recommendation) => {
    menu.fermer();
    if (!r.readAt) {
      try {
        await markRecommendationRead(r.id);
        await rafraichir();
      } catch {
        // La navigation prime : l'état lu sera resynchronisé au chargement.
      }
    }
    nav(`/recommandations?detail=${r.id}`);
  };

  const toutMarquerLu = async () => {
    if (traitement) return;
    setTraitement(true);
    try {
      await markAllRecommendationsRead();
      setListe((prev) =>
        prev.map((r) => (r.readAt ? r : { ...r, readAt: new Date().toISOString() })),
      );
      await rafraichir();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setTraitement(false);
    }
  };

  const badge = nonLues > 99 ? '99+' : String(nonLues);

  return (
    <div className="menu" ref={menu.ref}>
      <button
        type="button"
        className="icon-btn"
        data-declencheur
        data-testid="cloche-notifications"
        aria-label={t('notifications.aria', { count: nonLues })}
        aria-expanded={menu.ouvert}
        title={t('topbar.notifications')}
        onClick={ouvrir}
      >
        <Bell size={18} />
        {nonLues > 0 ? (
          <span className="compte-notif" data-testid="badge-non-lues" aria-hidden>
            {badge}
          </span>
        ) : null}
      </button>

      {menu.ouvert ? (
        <div className="menu-panneau panneau-notif" data-testid="panneau-notifications" role="dialog" aria-label={t('topbar.notifications')}>
          <div className="panneau-notif-entete">
            <strong>{t('topbar.notifications')}</strong>
            <button
              type="button"
              className="btn btn-ghost btn-mini"
              data-testid="tout-marquer-lu"
              onClick={() => void toutMarquerLu()}
              disabled={traitement || nonLues === 0}
            >
              <CheckCheck size={14} /> {t('notifications.toutMarquerLu')}
            </button>
          </div>

          <div className="panneau-notif-liste">
            {erreur ? (
              <div className="panneau-notif-vide" role="alert">
                {erreur}{' '}
                <button type="button" className="btn btn-ghost btn-mini" onClick={() => void charger()}>
                  {t('commun.actions.reessayer')}
                </button>
              </div>
            ) : chargement ? (
              <div className="panneau-notif-vide">
                <span className="loading-dots"><i /><i /><i /></span>
              </div>
            ) : liste.length === 0 ? (
              <div className="panneau-notif-vide">
                <Inbox size={20} color="#98A2B3" />
                {t('notifications.aucune')}
              </div>
            ) : (
              liste.slice(0, MAX_APERCUS).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`notif-ligne ${r.readAt ? '' : 'non-lue'}`}
                  data-testid={`notif-${r.id}`}
                  onClick={() => void ouvrirDetail(r)}
                >
                  <span className="notif-icone">{iconeDe(r)}</span>
                  <span className="notif-corps">
                    <span className="notif-titre">
                      {!r.readAt ? <span className="notif-point" aria-label={t('recommandations.nonLue')} /> : null}
                      {r.title}
                    </span>
                    <span className="notif-message">{r.message}</span>
                    <span className="notif-meta">
                      {nomEmetteur(r)} • {formaterDateHeure(r.createdAt)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>

          <button
            type="button"
            className="panneau-notif-pied"
            onClick={() => {
              menu.fermer();
              nav('/recommandations');
            }}
          >
            {t('notifications.voirTout')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
