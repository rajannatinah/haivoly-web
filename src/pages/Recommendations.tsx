import { useEffect, useState } from 'react';
import { Send, Bell, AlertTriangle, CheckCircle2, Info, Plus, Trash2 } from 'lucide-react';
import { getRecommendations, createRecommendation, deleteRecommendation } from '../services/api';
import { useConfirm } from '../components/ui/ConfirmProvider';
import type { Recommendation } from '../types';

export function Recommendations() {
  const confirm = useConfirm();
  const [list, setList] = useState<Recommendation[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [userId, setUserId] = useState('');

  const load = async () => {
    try {
      const res: any = await getRecommendations();
      setList(res.data ?? res ?? []);
    } catch {
      setList(mock);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    const payload = { title, message, priority, userId: userId || 'all', type: 'INFO' };
    try {
      await createRecommendation(payload);
    } catch {
      setList((prev) => [{ id: `r${Date.now()}`, userId: userId || 'all', title, message, type: 'INFO', priority, createdAt: new Date().toISOString() } as any, ...prev]);
    }
    setTitle('');
    setMessage('');
    setUserId('');
    load();
  };

  const handleDelete = async (id: string, t: string) => {
    const ok = await confirm({
      title: `Supprimer "${t}" ?`,
      description: 'Cette recommandation sera définitivement supprimée. Les appareils mobiles ne la recevront plus. Cette action est irréversible.',
      confirmLabel: 'Supprimer',
      cancelLabel: 'Annuler',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteRecommendation(id);
    } catch {
      // fallback local
    }
    setList((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, margin: 0, display: 'flex', gap: 10, alignItems: 'center' }}>
          <Bell size={20} color="#2E7D32" /> Recommandations → Mobile
        </h1>
        <p style={{ color: '#667085', fontSize: 13, margin: '4px 0 0' }}>
          Créez des recommandations depuis le web — elles seront synchronisées vers l’app mobile (offline-first, badge non-lu, centre de notifications). Toute suppression demande confirmation.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 16 }}>
        <form onSubmit={handleCreate} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>Nouvelle recommandation</h3>
          <input className="input" placeholder="Titre (ex: Irrigation recommandée)" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <textarea className="input" placeholder="Message détaillé pour l’agriculteur…" value={message} onChange={(e) => setMessage(e.target.value)} required style={{ minHeight: 90, paddingTop: 10 }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <select className="input" value={priority} onChange={(e) => setPriority(e.target.value as any)} style={{ flex: 1 }}>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </select>
            <input className="input" placeholder="userId ou 'all' (broadcast)" value={userId} onChange={(e) => setUserId(e.target.value)} style={{ flex: 1 }} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>
            <Send size={16} /> Envoyer vers mobile
          </button>
          <div style={{ fontSize: 11, color: '#98A2B3', lineHeight: 1.5 }}>
            Architecture : Actions mobiles → Backend → Règle métier → Recommandation → Sync → Notification mobile (WebSocket / polling + persistance offline).
          </div>
        </form>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>File d’attente d’envoi</h3>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 520, overflow: 'auto' }}>
            {list.map((r) => (
              <div key={r.id} style={{ border: '1px solid #EAECF0', borderRadius: 12, padding: 12, background: r.priority === 'URGENT' ? '#FEF3F2' : r.priority === 'HIGH' ? '#FFFAEB' : 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}>
                    {r.priority === 'URGENT' ? <AlertTriangle size={14} color="#D92D20" /> : r.priority === 'HIGH' ? <AlertTriangle size={14} color="#F79009" /> : r.type === 'SUCCESS' ? <CheckCircle2 size={14} color="#039855" /> : <Info size={14} color="#1570EF" />}
                    {r.title}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span className={`badge ${r.priority === 'URGENT' ? 'badge-error' : r.priority === 'HIGH' ? 'badge-warning' : 'badge-info'}`}>{r.priority}</span>
                    <button
                      onClick={() => handleDelete(r.id, r.title)}
                      title="Supprimer"
                      aria-label={`Supprimer ${r.title}`}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        border: '1px solid #FECACA',
                        background: '#FEF3F2',
                        color: '#D92D20',
                        display: 'grid',
                        placeItems: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={14} color="#D92D20" />
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#344054', marginTop: 6, lineHeight: 1.5 }}>{r.message}</div>
                <div style={{ fontSize: 11, color: '#98A2B3', marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{r.user ? `${r.user.prenom} ${r.user.nom}` : r.userId} • {new Date(r.createdAt).toLocaleString('fr-FR')}</span>
                  <span className="badge">{r.readAt ? 'Lue' : 'Non lue'}</span>
                </div>
              </div>
            ))}
            {list.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#98A2B3', fontSize: 13 }}>Aucune recommandation.</div>}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, display: 'flex', gap: 8, alignItems: 'center' }}>
          <Plus size={16} color="#2E7D32" /> Règles métier extensibles
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: 12, marginTop: 12 }}>
          {[
            { title: 'Humidité basse → Irrigation', code: 'if (parcelle.humidite < 30) => HIGH' },
            { title: 'Mildiou si pluie >20mm', code: 'if (meteo.pluie >20 && culture.stade==="EN_COURS") => MEDIUM' },
            { title: 'Fenêtre récolte 3j', code: 'if (joursAvantRecolte <=3) => URGENT' },
            { title: 'Intervention en retard', code: 'if (joursDepuisDerniere >14) => WARNING' },
          ].map((r) => (
            <div key={r.title} style={{ border: '1px solid #EAECF0', borderRadius: 12, padding: 12, background: '#F9FAFB' }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{r.title}</div>
              <code style={{ fontSize: 11, background: 'white', border: '1px solid #EAECF0', padding: '6px 8px', borderRadius: 8, display: 'block', marginTop: 8 }}>{r.code}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const mock: Recommendation[] = [
  { id: '1', userId: 'u1', user: { id: 'u1', nom: 'Rakoto', prenom: 'Hery', email: 'hery@haivoly.mg' }, title: 'Irrigation recommandée', message: 'Parcelle Nord — prévoir irrigation 15mm dans 24h.', type: 'WARNING', priority: 'HIGH', createdAt: new Date().toISOString() },
  { id: '2', userId: 'all', title: 'Alerte météo', message: 'Pluies fortes attendues demain — sécuriser les récoltes.', type: 'ALERT', priority: 'URGENT', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: '3', userId: 'u2', user: { id: 'u2', nom: 'Rabe', prenom: 'Mina', email: 'mina@haivoly.mg' }, title: 'Fertilisation', message: 'Culture Maïs — apport azote conseillé stade 4 feuilles.', type: 'INFO', priority: 'MEDIUM', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() },
];
