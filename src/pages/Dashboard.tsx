import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Activity, CheckCircle2, Clock3, AlertTriangle, Sprout, TrendingUp, Bell } from 'lucide-react';
import { getDashboardStats, getActions, getRecommendations } from '../services/api';
import { ErreurBloc, VideBloc, messageErreur } from '../components/ui/ErrorState';
import { formaterDateHeure } from '../i18n';
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
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<Action[]>([]);
  const [recos, setRecos] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErreur(null);
    try {
      const [s, a, r] = await Promise.all([
        getDashboardStats(),
        getActions({ limit: 5, sort: 'timestamp:desc' }),
        getRecommendations({ limit: 3 }),
      ]);
      setStats(s as DashboardStats);
      setRecent(((a as any).data ?? (a as any) ?? []) as Action[]);
      setRecos(((r as any).data ?? (r as any) ?? []) as Recommendation[]);
    } catch (error) {
      // Aucune donnée de repli : une erreur est affichée telle quelle.
      setStats(null);
      setRecent([]);
      setRecos([]);
      setErreur(messageErreur(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#667085' }}>{t('dashboard.chargement')}</div>;

  /** Répartition réelle des activités récemment chargées (aucune valeur inventée). */
  const repRecent = (() => {
    const parType = new Map<string, number>();
    for (const action of recent) {
      parType.set(action.entityType, (parType.get(action.entityType) ?? 0) + 1);
    }
    const max = Math.max(1, ...parType.values());
    return [...parType.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, v]) => ({ label, v, pct: Math.round((v / max) * 100) }));
  })();

  if (erreur) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.6, margin: 0 }}>{t('dashboard.titre')}</h1>
        <ErreurBloc erreur={erreur} onRetry={() => void load()} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.6, margin: 0 }}>{t('dashboard.titre')}</h1>
        <p style={{ color: '#667085', margin: '6px 0 0', fontSize: 13.5 }}>{t('dashboard.sousTitre')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 14 }}>
        <StatCard icon={Users} label={t('dashboard.utilisateurs')} value={stats?.totalUsers ?? 0} hint={t('dashboard.actifsCeMois')} accent="#1570EF" />
        <StatCard icon={Activity} label={t('dashboard.aujourdHui')} value={stats?.actionsToday ?? 0} hint={t('dashboard.auTotal', { count: stats?.totalActions ?? 0 })} accent="#2E7D32" />
        <StatCard icon={CheckCircle2} label={t('dashboard.synchronisees')} value={stats?.actionsSynced ?? 0} hint={stats?.syncRate === undefined || stats?.syncRate === null ? '—' : t('dashboard.tauxSync', { count: stats.syncRate })} accent="#039855" />
        <StatCard icon={Clock3} label={t('dashboard.enAttente')} value={stats?.actionsPending ?? 0} hint={t('dashboard.queueOffline')} accent="#F79009" />
        <StatCard icon={AlertTriangle} label={t('dashboard.echouees')} value={stats?.actionsFailed ?? 0} hint={t('dashboard.aDiagnostiquer')} accent="#D92D20" />
        <StatCard icon={Bell} label={t('dashboard.recommandations')} value={stats?.recommendations ?? 0} hint={t('dashboard.actives')} accent="#6941C6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>{t('dashboard.dernieresActivites')}</h3>
            <a href="/actions" style={{ fontSize: 12, fontWeight: 700 }}>{t('commun.actions.voirTout')}</a>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>{t('commun.colonnes.heure')}</th>
                <th>{t('commun.colonnes.utilisateur')}</th>
                <th>{t('commun.colonnes.action')}</th>
                <th>{t('commun.colonnes.entite')}</th>
                <th>{t('commun.colonnes.sync')}</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr><td colSpan={5}><VideBloc texte={t('dashboard.aucuneActivite')} /></td></tr>
              )}
              {recent.map((a) => (
                <tr key={a.id}>
                  <td style={{ whiteSpace: 'nowrap', color: '#667085', fontSize: 12 }}>{formaterDateHeure(a.timestamp)}</td>
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
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, display: 'flex', gap: 8, alignItems: 'center' }}><TrendingUp size={16} color="#2E7D32" /> {t('dashboard.repartition')}</h3>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {repRecent.length === 0 ? (
                <VideBloc texte={t('dashboard.aucuneRepartition')} />
              ) : (
                repRecent.map((r) => (
                  <div key={r.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#344054', marginBottom: 4 }}>
                      <span>{r.label}</span>
                      <span>{r.v}</span>
                    </div>
                    <div style={{ height: 8, background: '#F2F4F7', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ width: `${r.pct}%`, height: '100%', background: '#2E7D32' }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, display: 'flex', gap: 8, alignItems: 'center' }}><Sprout size={16} color="#2E7D32" /> {t('dashboard.recommandationsRecentes')}</h3>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recos.length === 0 && <VideBloc texte={t('dashboard.aucuneRecommandation')} />}
              {recos.map((r) => (
                <div key={r.id} style={{ border: '1px solid #EAECF0', borderRadius: 12, padding: 12, background: r.priority === 'URGENT' ? '#FEF3F2' : 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{r.title}</div>
                    <span className={`badge ${r.priority === 'URGENT' ? 'badge-error' : r.priority === 'HIGH' ? 'badge-warning' : 'badge-info'}`}>{r.priority}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#667085', marginTop: 4, lineHeight: 1.5 }}>{r.message}</div>
                  <div style={{ fontSize: 11, color: '#98A2B3', marginTop: 6 }}>{formaterDateHeure(r.createdAt)} • {r.user ? `${r.user.prenom} ${r.user.nom}` : r.userId.slice(0, 6)}</div>
                </div>
              ))}
              <a href="/recommandations" style={{ fontSize: 12, fontWeight: 700, textAlign: 'center', display: 'block', marginTop: 4 }}>{t('dashboard.gererRecommandations')}</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
