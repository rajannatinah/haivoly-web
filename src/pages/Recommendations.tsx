import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Bell, AlertTriangle, CheckCircle2, Info, Plus, Trash2 } from 'lucide-react';
import { getRecommendations, createRecommendation, deleteRecommendation } from '../services/api';
import { useConfirm } from '../components/ui/ConfirmProvider';
import { ErreurBloc, VideBloc, messageErreur } from '../components/ui/ErrorState';
import { formaterDateHeure } from '../i18n';
import type { Recommendation } from '../types';

export function Recommendations() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const [list, setList] = useState<Recommendation[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [userId, setUserId] = useState('');

  const [erreur, setErreur] = useState<string | null>(null);
  const [erreurEnvoi, setErreurEnvoi] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [chargement, setChargement] = useState(false);

  const load = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = (await getRecommendations()) as any;
      setList(res?.data ?? res ?? []);
    } catch (error) {
      // Aucune donnée de repli : l'erreur réelle est affichée.
      setList([]);
      setErreur(messageErreur(error));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message || envoiEnCours) return;

    setEnvoiEnCours(true);
    setErreurEnvoi(null);
    try {
      await createRecommendation({
        title,
        message,
        priority,
        userId: userId || 'all',
        type: 'INFO',
      });
      // Le formulaire n'est vidé que si le serveur a confirmé la publication.
      setTitle('');
      setMessage('');
      setUserId('');
      await load();
    } catch (error) {
      // Les valeurs saisies sont conservées pour permettre la correction.
      setErreurEnvoi(messageErreur(error));
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const handleDelete = async (id: string, titre: string) => {
    const ok = await confirm({
      title: t('recommandations.supprimerTitre', { titre }),
      description: t('recommandations.supprimerDescription'),
      confirmLabel: t('commun.actions.supprimer'),
      cancelLabel: t('commun.actions.annuler'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteRecommendation(id);
      // Retrait de la liste uniquement après confirmation du serveur.
      setList((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      setErreur(messageErreur(error));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {erreur && <ErreurBloc erreur={erreur} onRetry={() => void load()} />}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, margin: 0, display: 'flex', gap: 10, alignItems: 'center' }}>
          <Bell size={20} color="#2E7D32" /> {t('recommandations.titre')}
        </h1>
        <p style={{ color: '#667085', fontSize: 13, margin: '4px 0 0' }}>
          {t('recommandations.sousTitre')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 16 }}>
        {erreurEnvoi && <ErreurBloc erreur={erreurEnvoi} />}

      <form onSubmit={handleCreate} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>{t('recommandations.nouvelle')}</h3>
          <input className="input" placeholder={t('recommandations.titreExemple')} value={title} onChange={(e) => setTitle(e.target.value)} required />
          <textarea className="input" placeholder={t('recommandations.messagePlaceholder')} value={message} onChange={(e) => setMessage(e.target.value)} required style={{ minHeight: 90, paddingTop: 10 }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <select className="input" value={priority} onChange={(e) => setPriority(e.target.value as any)} style={{ flex: 1 }}>
              <option value="LOW">{t('recommandations.priorites.LOW')}</option>
              <option value="MEDIUM">{t('recommandations.priorites.MEDIUM')}</option>
              <option value="HIGH">{t('recommandations.priorites.HIGH')}</option>
              <option value="URGENT">{t('recommandations.priorites.URGENT')}</option>
            </select>
            <input className="input" placeholder={t('recommandations.userIdPlaceholder')} value={userId} onChange={(e) => setUserId(e.target.value)} style={{ flex: 1 }} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>
            <Send size={16} /> {t('recommandations.envoyerVersMobile')}
          </button>
          <div style={{ fontSize: 11, color: '#98A2B3', lineHeight: 1.5 }}>
            {t('recommandations.architecture')}
          </div>
        </form>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>{t('recommandations.fileAttente')}</h3>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 520, overflow: 'auto' }}>
            {list.map((r) => (
              <div key={r.id} style={{ border: '1px solid #EAECF0', borderRadius: 12, padding: 12, background: r.priority === 'URGENT' ? '#FEF3F2' : r.priority === 'HIGH' ? '#FFFAEB' : 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}>
                    {r.priority === 'URGENT' ? <AlertTriangle size={16} color="#D92D20" /> : r.priority === 'HIGH' ? <AlertTriangle size={16} color="#F79009" /> : r.type === 'SUCCESS' ? <CheckCircle2 size={16} color="#039855" /> : <Info size={16} color="#1570EF" />}
                    {r.title}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span className={`badge ${r.priority === 'URGENT' ? 'badge-error' : r.priority === 'HIGH' ? 'badge-warning' : 'badge-info'}`}>{r.priority}</span>
                    <button
                      onClick={() => handleDelete(r.id, r.title)}
                      title={t('commun.actions.supprimer')}
                      aria-label={t('recommandations.supprimerAria', { titre: r.title })}
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
                      <Trash2 size={16} color="#D92D20" />
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#344054', marginTop: 6, lineHeight: 1.5 }}>{r.message}</div>
                <div style={{ fontSize: 11, color: '#98A2B3', marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{r.user ? `${r.user.prenom} ${r.user.nom}` : r.userId} • {formaterDateHeure(r.createdAt)}</span>
                  <span className="badge">{r.readAt ? t('recommandations.lue') : t('recommandations.nonLue')}</span>
                </div>
              </div>
            ))}
            {list.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#98A2B3', fontSize: 13 }}>{t('recommandations.aucune')}</div>}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, display: 'flex', gap: 8, alignItems: 'center' }}>
          <Plus size={16} color="#2E7D32" /> {t('recommandations.reglesMetier')}
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
