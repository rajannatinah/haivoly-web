import { useEffect, useState } from 'react';
import { Search, Filter, Download, Eye, RefreshCw, Trash2 } from 'lucide-react';
import { getActions } from '../services/api';
import { useConfirm } from '../components/ui/ConfirmProvider';
import type { Action } from '../types';

export function Actions() {
  const confirm = useConfirm();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('ALL');
  const [type, setType] = useState('ALL');
  const [data, setData] = useState<Action[]>([]);
  const [page, setPage] = useState(1);
  const limit = 10;

  const load = async () => {
    try {
      const res: any = await getActions({ q, status, type, page, limit });
      setData(res.data ?? res ?? []);
    } catch {
      setData(mock);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const handleDelete = async (a: Action) => {
    const ok = await confirm({
      title: `Supprimer l'action ${a.actionType} ?`,
      description: `L'action du ${new Date(a.timestamp).toLocaleString('fr-FR')} (${a.entityType} • ${a.entityId?.slice(0, 6) ?? '—'}) sera retirée de la liste locale. Cette action est irréversible côté affichage.`,
      confirmLabel: 'Supprimer',
      cancelLabel: 'Annuler',
      variant: 'danger',
    });
    if (!ok) return;
    setData((prev) => prev.filter((x) => x.id !== a.id));
  };

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
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>Actions mobiles</h1>
          <p style={{ color: '#667085', fontSize: 13, margin: '4px 0 0' }}>Historique complet • Filtrage • Recherche • Pagination • Suppression avec confirmation</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={load}>
            <RefreshCw size={16} /> Actualiser
          </button>
          <button className="btn btn-outline">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: 11, color: '#98A2B3' }} />
          <input className="input" placeholder="Rechercher utilisateur, action, entité, payload…" value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 34 }} />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Filter size={16} color="#667085" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input" style={{ minWidth: 150 }}>
            <option value="ALL">Tous statuts</option>
            <option value="SYNCED">SYNCED</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
            <option value="SYNCING">SYNCING</option>
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} className="input" style={{ minWidth: 180 }}>
            <option value="ALL">Tous types</option>
            <option value="CREATE_PARCELLE">CREATE_PARCELLE</option>
            <option value="CREATE_CULTURE">CREATE_CULTURE</option>
            <option value="CREATE_INTERVENTION">CREATE_INTERVENTION</option>
            <option value="CREATE_OBSERVATION">CREATE_OBSERVATION</option>
            <option value="CREATE_RECOLTE">CREATE_RECOLTE</option>
          </select>
        </div>
        <span className="badge">{filtered.length} résultat(s)</span>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Utilisateur</th>
                <th>Action</th>
                <th>Entité</th>
                <th>Sync</th>
                <th>Retries</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 12, color: '#667085' }}>{new Date(a.timestamp).toLocaleString('fr-FR')}</td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{a.user ? `${a.user.prenom} ${a.user.nom}` : a.userId.slice(0, 8)}</div>
                    <div style={{ fontSize: 11, color: '#98A2B3' }}>{a.user?.email ?? a.userId}</div>
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
                        <Eye size={14} /> Détails
                      </a>
                      <button
                        onClick={() => handleDelete(a)}
                        className="btn btn-ghost"
                        title="Supprimer de la liste"
                        aria-label="Supprimer"
                        style={{ padding: '6px 8px', fontSize: 12, color: '#D92D20', borderColor: '#FECACA', background: '#FEF3F2' }}
                      >
                        <Trash2 size={14} color="#D92D20" /> Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div style={{ padding: 28, textAlign: 'center', color: '#667085' }}>Aucune action trouvée.</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: 12, borderTop: '1px solid #EAECF0', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#667085' }}>Page {page} • {filtered.length} lignes</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Précédent
            </button>
            <button className="btn btn-outline" onClick={() => setPage((p) => p + 1)}>
              Suivant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const mock: Action[] = Array.from({ length: 18 }).map((_, i) => ({
  id: `a${i + 1}`,
  userId: `u${(i % 3) + 1}`,
  user: [{ id: 'u1', nom: 'Rakoto', prenom: 'Hery', email: 'hery@haivoly.mg' }, { id: 'u2', nom: 'Rabe', prenom: 'Mina', email: 'mina@haivoly.mg' }, { id: 'u3', nom: 'Andry', prenom: 'Tovo', email: 'tovo@haivoly.mg' }][i % 3],
  actionType: (['CREATE_PARCELLE', 'CREATE_CULTURE', 'CREATE_INTERVENTION', 'CREATE_OBSERVATION', 'CREATE_RECOLTE'] as const)[i % 5],
  entityType: (['PARCELLE', 'CULTURE', 'INTERVENTION', 'OBSERVATION', 'RECOLTE'] as const)[i % 5],
  entityId: `e${100 + i}`,
  payload: { note: `Payload #${i + 1}` },
  timestamp: new Date(Date.now() - i * 1000 * 60 * 23).toISOString(),
  syncStatus: (['SYNCED', 'PENDING', 'FAILED', 'SYNCED', 'SYNCED'] as const)[i % 5],
  retryCount: i % 3,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));
