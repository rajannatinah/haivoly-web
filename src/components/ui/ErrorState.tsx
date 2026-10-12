import { AlertTriangle, Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { i18n } from '../../i18n';

/** Message lisible pour une erreur d'API, sans divulguer d'information sensible. */
export function messageErreur(error: unknown): string {
  const err = error as {
    response?: { data?: { message?: string; code?: string }; status?: number };
    code?: string;
    message?: string;
  };

  const statut = err?.response?.status;
  const message = err?.response?.data?.message;

  if (message) return message;

  if (statut === 401) return i18n.t('commun.erreurs.sessionExpiree');
  if (statut === 403) return i18n.t('commun.erreurs.droitsInsuffisants');
  if (statut === 404) return i18n.t('commun.erreurs.introuvable');
  if (statut === 429) return i18n.t('commun.erreurs.tropRequetes');

  if (err?.code === 'ECONNABORTED' || err?.code === 'ERR_NETWORK') {
    return i18n.t('commun.erreurs.serveurInjoignable');
  }

  return err?.message ?? i18n.t('commun.erreurs.inattendue');
}

/** Bloc d'erreur réutilisable, avec action de nouvelle tentative. */
export function ErreurBloc({
  erreur,
  onRetry,
}: {
  erreur: string;
  onRetry?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        padding: 14,
        borderRadius: 12,
        border: '1px solid #FDA29B',
        background: '#FEF3F2',
        color: '#912018',
        fontSize: 13,
      }}
    >
      <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, marginBottom: 2 }}>{t('commun.etats.donneesIndisponibles')}</div>
        <div style={{ color: '#B42318', lineHeight: 1.5 }}>{erreur}</div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="btn btn-outline"
            style={{ marginTop: 10 }}
          >
            {t('commun.actions.reessayer')}
          </button>
        )}
      </div>
    </div>
  );
}

/** État vide explicite — jamais remplacé par des données inventées. */
export function VideBloc({ texte }: { texte: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '32px 16px',
        color: '#667085',
        fontSize: 13,
        textAlign: 'center',
      }}
    >
      <Inbox size={22} color="#98A2B3" />
      <div>{texte}</div>
    </div>
  );
}
