import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, RefreshCw, ShieldCheck, Clock3 } from 'lucide-react';
import { getUtilisateurs, type UtilisateurApercu } from '../services/api';
import { messageErreur } from '../components/ui/ErrorState';
import { TableauDonnees, type Colonne } from '../components/ui/TableauDonnees';

/** Badge coloré pour le rôle (valeur métier brute : PROPRIETAIRE/AGRICULTEUR). */
function BadgeRole({ role }: { role: string }) {
  const estProprietaire = role === 'PROPRIETAIRE';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        background: estProprietaire ? '#f4f3ff' : '#eff8ff',
        color: estProprietaire ? '#5925dc' : '#175cd3',
      }}
    >
      {role}
    </span>
  );
}

/** Badge d'état d'activation du compte (fait foi : la valeur serveur). */
function BadgeActivation({ estVerifie, libelleActif, libelleAttente }: { estVerifie: boolean; libelleActif: string; libelleAttente: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        background: estVerifie ? '#ecfdf3' : '#fffcf5',
        color: estVerifie ? '#027a48' : '#b54708',
      }}
    >
      {estVerifie ? <ShieldCheck size={12} /> : <Clock3 size={12} />}
      {estVerifie ? libelleActif : libelleAttente}
    </span>
  );
}

export function Utilisateurs() {
  const { t } = useTranslation();
  const [lignes, setLignes] = useState<UtilisateurApercu[]>([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [q, setQ] = useState('');

  const charge = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const comptes = await getUtilisateurs();
      setLignes(comptes);
    } catch (e) {
      setLignes([]);
      setErreur(messageErreur(e));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charge();
  }, [charge]);

  const filtres = lignes.filter((u) => {
    if (!q) return true;
    const aiguille = q.toLowerCase();
    return (
      u.nomComplet.toLowerCase().includes(aiguille) ||
      u.username.toLowerCase().includes(aiguille) ||
      (u.email ?? '').toLowerCase().includes(aiguille) ||
      u.role.toLowerCase().includes(aiguille)
    );
  });

  const colonnes: Colonne<UtilisateurApercu>[] = [
    {
      cle: 'nomComplet',
      entete: t('commun.colonnes.utilisateur'),
      rendu: (u) => (
        <div>
          <div style={{ fontWeight: 700 }}>{u.nomComplet}</div>
          <div style={{ fontSize: 11, color: '#98a2b3' }}>@{u.username}</div>
        </div>
      ),
    },
    {
      cle: 'email',
      entete: t('utilisateurs.colonnes.email'),
      rendu: (u) => u.email || '—',
    },
    {
      cle: 'role',
      entete: t('utilisateurs.colonnes.role'),
      rendu: (u) => <BadgeRole role={u.role} />,
    },
    {
      cle: 'statut',
      entete: t('commun.colonnes.statut'),
      rendu: (u) => (
        <BadgeActivation
          estVerifie={u.estVerifie}
          libelleActif={t('utilisateurs.actif')}
          libelleAttente={t('utilisateurs.enAttente')}
        />
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>{t('utilisateurs.titre')}</h1>
          <p style={{ color: '#667085', fontSize: 13, margin: '4px 0 0' }}>
            {t('utilisateurs.sousTitre')}
          </p>
        </div>
        <button className="btn btn-outline" onClick={() => void charge()} disabled={chargement}>
          <RefreshCw size={16} /> {t('commun.actions.actualiser')}
        </button>
      </div>

      <div className="card" style={{ padding: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: 11, color: '#98A2B3' }} />
          <input
            className="input"
            placeholder={t('utilisateurs.recherche')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ paddingLeft: 34 }}
          />
        </div>
      </div>

      <TableauDonnees
        colonnes={colonnes}
        lignes={filtres}
        chargement={chargement}
        erreur={erreur}
        texteVide={t('utilisateurs.vide')}
        cleLigne={(u) => u.id}
      />
    </div>
  );
}
