import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Download, Eye, RefreshCw } from 'lucide-react';
import { getActions, normaliseListe } from '../services/api';
import { ErreurBloc, VideBloc, messageErreur } from '../components/ui/ErrorState';
import { formaterDateHeure } from '../i18n';
import { detailDestinataire, libelleDestinataire } from '../utils/destinataire';
import type { Action } from '../types';

export function Actions() {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('ALL');
  const [type, setType] = useState('ALL');
  const [data, setData] = useState<Action[]>([]);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  const load = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (q) params.q = q;
      if (status !== 'ALL') params.syncStatus = status;
      if (type !== 'ALL') params.actionType = type;
      const res = await getActions(params);
      setData(normaliseListe(res) as Action[]);
    } catch (error) {
      // Aucune donnée de repli : on affiche l'erreur réelle.
      setData([]);
      setErreur(messageErreur(error));
    } finally {
      setChargement(false);
    }
  }, [q, status, type, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = data.filter((a) => {
    if (q && !JSON.stringify(a).toLowerCase().includes(q.toLowerCase())) return false;
    if (status !== 'ALL' && a.syncStatus !== status) return false;
    if (type !== 'ALL' && a.actionType !== type) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>{t('actions.titre')}</h1>
          <p style={{ color: '#667085', fontSize: 13, margin: '4px 0 0' }}>{t('actions.sousTitre')}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={load}>
            <RefreshCw size={16} /> {t('commun.actions.actualiser')}
          </button>
          <button className="btn btn-outline" onClick={() => void load()} disabled={chargement}>
            <Download size={16} /> {t('commun.actions.exportCsv')}
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: 11, color: '#98A2B3' }} />
          <input className="input" placeholder={t('actions.recherche')} value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 34 }} />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Filter size={16} color="#667085" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input" style={{ minWidth: 150 }}>
            <option value="ALL">{t('commun.filtres.tousStatuts')}</option>
            <option value="SYNCED">SYNCED</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
            <option value="SYNCING">SYNCING</option>
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} className="input" style={{ minWidth: 180 }}>
            <option value="ALL">{t('commun.filtres.tousTypes')}</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
        <span className="badge">{t('commun.etats.resultats', { count: filtered.length })}</span>
      </div>

      {erreur && <ErreurBloc erreur={erreur} onRetry={() => void load()} />}

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>{t('commun.colonnes.date')}</th>
                <th>{t('commun.colonnes.utilisateur')}</th>
                <th>{t('commun.colonnes.action')}</th>
                <th>{t('commun.colonnes.entite')}</th>
                <th>{t('commun.colonnes.sync')}</th>
                <th>{t('commun.colonnes.retries')}</th>
                <th style={{ textAlign: 'right' }}>{t('commun.colonnes.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 12, color: '#667085' }}>{formaterDateHeure(a.timestamp)}</td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{libelleDestinataire(a)}</div>
                    <div style={{ fontSize: 11, color: '#98A2B3' }}>{detailDestinataire(a) || a.userId}</div>
                  </td>
                  <td><span className="badge badge-primary">{a.actionType}</span></td>
                  <td>
                    <span className="badge">{a.entityType}</span> <span style={{ fontSize: 12, color: '#667085' }}>{a.entityId?.slice(0, 8) ?? '—'}</span>
                    {a.payload && <div style={{ fontSize: 11, color: '#667085', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{JSON.stringify(a.payload)}</div>}
                  </td>
                  <td>
                    <span className={`badge ${a.syncStatus === 'SYNCED' ? 'badge-success' : a.syncStatus === 'PENDING' ? 'badge-warning' : a.syncStatus === 'FAILED' ? 'badge-error' : 'badge-info'}`}>{a.syncStatus}</span>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>{a.retryCount}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                      <a href={`/actions/${a.id}`} className="btn btn-ghost" style={{ padding: '6px 8px', fontSize: 12 }}>
                        <Eye size={16} /> {t('commun.actions.details')}
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!erreur && filtered.length === 0 && (
          <VideBloc texte={chargement ? t('commun.etats.chargement') : t('actions.aucunFiltre')} />
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: 12, borderTop: '1px solid #EAECF0', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#667085' }}>{t('actions.page', { page, count: filtered.length })}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              {t('commun.actions.precedent')}
            </button>
            <button className="btn btn-outline" onClick={() => setPage((p) => p + 1)}>
              {t('commun.actions.suivant')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
