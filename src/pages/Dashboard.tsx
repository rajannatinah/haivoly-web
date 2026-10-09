import { useEffect, useState } from 'react';
import { Users, Activity, CheckCircle2, Clock3, AlertTriangle, Sprout, TrendingUp, Bell } from 'lucide-react';
import { getDashboardStats, getActions, getRecommendations } from '../services/api';
import type { DashboardStats, Action, Recommendation } from '../types';

function StatCard({ icon: Icon, label, value, hint, accent }: { icon: any; label: string; value: string | number; hint?: string; accent: string }) {
  return (
    <div className="card" style={{ padding: 16, display: 'flex', gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: `${accent}14`, border: `1px solid ${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={accent} />
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: '#667085' }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.6 }}>{value}</div>
        {hint && <div style={{ fontSize: 11, color: '#98A2B3' }}>{hint}</div>}
      </div>
    </div>
  );
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<Action[]>([]);
  const [recos, setRecos] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, a, r] = await Promise.all([
          getDashboardStats().catch(() => ({
            totalUsers: 128,
            actionsToday: 42,
            actionsSynced: 1240,
            actionsPending: 7,
            actionsFailed: 3,
            totalActions: 1250,
            recommendations: 5,
            syncRate: 99.2,
          })),
          getActions({ limit: 5, sort: 'timestamp:desc' }).catch(() => ({ data: mockActions.slice(0, 5) })),
          getRecommendations({ limit: 3 }).catch(() => ({ data: mockRecos.slice(0, 3) })),
        ]);
        setStats(s as any);
        setRecent((a as any).data ?? (a as any) ?? []);
        setRecos((r as any).data ?? (r as any) ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#667085' }}>Chargement du dashboard…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.6, margin: 0 }}>Dashboard</h1>
        <p style={{ color: '#667085', margin: '6px 0 0', fontSize: 13.5 }}>Suivi en temps réel des actions mobiles • Synchronisation • Recommandations → Mobile</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 14 }}>
        <StatCard icon={Users} label="Utilisateurs" value={stats?.totalUsers ?? 0} hint="actifs ce mois" accent="#1570EF" />
        <StatCard icon={Activity} label="Aujourd’hui" value={stats?.actionsToday ?? 0} hint={`${stats?.totalActions ?? 0} au total`} accent="#2E7D32" />
        <StatCard icon={CheckCircle2} label="Synchronisées" value={stats?.actionsSynced ?? 0} hint={`${stats?.syncRate ?? 99}% taux`} accent="#039855" />
        <StatCard icon={Clock3} label="En attente" value={stats?.actionsPending ?? 0} hint="queue offline" accent="#F79009" />
        <StatCard icon={AlertTriangle} label="Échouées" value={stats?.actionsFailed ?? 0} hint="à diagnostiquer" accent="#D92D20" />
        <StatCard icon={Bell} label="Recommandations" value={stats?.recommendations ?? 0} hint="actives" accent="#6941C6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>Dernières activités</h3>
            <a href="/actions" style={{ fontSize: 12, fontWeight: 700 }}>Voir tout →</a>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Heure</th>
                <th>Utilisateur</th>
                <th>Action</th>
                <th>Entité</th>
                <th>Sync</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((a) => (
                <tr key={a.id}>
                  <td style={{ whiteSpace: 'nowrap', color: '#667085', fontSize: 12 }}>{new Date(a.timestamp).toLocaleString('fr-FR')}</td>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{a.user ? `${a.user.prenom} ${a.user.nom}` : a.userId.slice(0, 8)}</div>
                    <div style={{ fontSize: 11, color: '#98A2B3' }}>{a.user?.email ?? ''}</div>
                  </td>
                  <td><span className="badge badge-primary">{a.actionType}</span></td>
                  <td style={{ fontSize: 12 }}>{a.entityType} • <span style={{ color: '#667085' }}>{a.entityId?.slice(0, 6) ?? '—'}</span></td>
                  <td>
                    <span className={`badge ${a.syncStatus === 'SYNCED' ? 'badge-success' : a.syncStatus === 'PENDING' ? 'badge-warning' : a.syncStatus === 'FAILED' ? 'badge-error' : 'badge-info'}`}>
                      {a.syncStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, display: 'flex', gap: 8, alignItems: 'center' }}><TrendingUp size={16} color="#2E7D32" /> Flux du jour</h3>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Parcelles créées', v: 8, max: 12 },
                { label: 'Cultures ajoutées', v: 14, max: 20 },
                { label: 'Interventions', v: 11, max: 15 },
                { label: 'Observations', v: 9, max: 15 },
              ].map((r) => (
                <div key={r.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#344054', marginBottom: 4 }}>
                    <span>{r.label}</span>
                    <span>{r.v}/{r.max}</span>
                  </div>
                  <div style={{ height: 8, background: '#F2F4F7', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${(r.v / r.max) * 100}%`, height: '100%', background: '#2E7D32' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, display: 'flex', gap: 8, alignItems: 'center' }}><Sprout size={16} color="#2E7D32" /> Recommandations récentes</h3>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recos.map((r) => (
                <div key={r.id} style={{ border: '1px solid #EAECF0', borderRadius: 12, padding: 12, background: r.priority === 'URGENT' ? '#FEF3F2' : 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{r.title}</div>
                    <span className={`badge ${r.priority === 'URGENT' ? 'badge-error' : r.priority === 'HIGH' ? 'badge-warning' : 'badge-info'}`}>{r.priority}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#667085', marginTop: 4, lineHeight: 1.5 }}>{r.message}</div>
                  <div style={{ fontSize: 11, color: '#98A2B3', marginTop: 6 }}>{new Date(r.createdAt).toLocaleString('fr-FR')} • {r.user ? `${r.user.prenom} ${r.user.nom}` : r.userId.slice(0, 6)}</div>
                </div>
              ))}
              <a href="/recommandations" style={{ fontSize: 12, fontWeight: 700, textAlign: 'center', display: 'block', marginTop: 4 }}>Gérer les recommandations →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const mockActions: Action[] = [
  { id: '1', userId: 'u1', user: { id: 'u1', nom: 'Rakoto', prenom: 'Hery', email: 'hery@haivoly.mg' }, actionType: 'CREATE_PARCELLE', entityType: 'PARCELLE', entityId: 'p1', payload: { nom: 'Parcelle Nord' }, timestamp: new Date().toISOString(), syncStatus: 'SYNCED', retryCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '2', userId: 'u2', user: { id: 'u2', nom: 'Rabe', prenom: 'Mina', email: 'mina@haivoly.mg' }, actionType: 'CREATE_CULTURE', entityType: 'CULTURE', entityId: 'c1', payload: { nom: 'Maïs' }, timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), syncStatus: 'PENDING', retryCount: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '3', userId: 'u1', user: { id: 'u1', nom: 'Rakoto', prenom: 'Hery', email: 'hery@haivoly.mg' }, actionType: 'CREATE_OBSERVATION', entityType: 'OBSERVATION', entityId: 'o1', payload: {}, timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), syncStatus: 'SYNCED', retryCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '4', userId: 'u3', user: { id: 'u3', nom: 'Andry', prenom: 'Tovo', email: 'tovo@haivoly.mg' }, actionType: 'CREATE_INTERVENTION', entityType: 'INTERVENTION', entityId: 'i1', payload: { type: 'IRRIGATION' }, timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), syncStatus: 'FAILED', retryCount: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '5', userId: 'u2', user: { id: 'u2', nom: 'Rabe', prenom: 'Mina', email: 'mina@haivoly.mg' }, actionType: 'CREATE_RECOLTE', entityType: 'RECOLTE', entityId: 'r1', payload: { quantite: 850 }, timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(), syncStatus: 'SYNCED', retryCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const mockRecos: Recommendation[] = [
  { id: 'r1', userId: 'u1', user: { id: 'u1', nom: 'Rakoto', prenom: 'Hery', email: 'hery@haivoly.mg' }, title: 'Irrigation recommandée', message: 'Parcelle Nord — humidité basse détectée. Prévoir irrigation dans 24h.', type: 'WARNING', priority: 'HIGH', createdAt: new Date().toISOString() },
  { id: 'r2', userId: 'u2', user: { id: 'u2', nom: 'Rabe', prenom: 'Mina', email: 'mina@haivoly.mg' }, title: 'Traitement préventif', message: 'Culture Maïs CMS 901 — risque mildiou si pluie > 20mm.', type: 'ALERT', priority: 'MEDIUM', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
  { id: 'r3', userId: 'u1', title: 'Récolte imminente', message: 'Parcelle Sud — fenêtre optimale dans 3 jours. Préparer logistique.', type: 'INFO', priority: 'URGENT', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString() },
];
