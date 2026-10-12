import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, RefreshCw } from 'lucide-react';
import { getParcelles, normaliseListe } from '../services/api';
import { messageErreur } from '../components/ui/ErrorState';
import { TableauDonnees, BadgeStatut, formateDate, formateNombre, type Colonne } from '../components/ui/TableauDonnees';
import type { Parcelle } from '../types';

export function Parcelles() {
  const { t } = useTranslation();
  const [lignes, setLignes] = useState<Parcelle[]>([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [q, setQ] = useState('');

  const charge = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const reponse = await getParcelles();
      setLignes(normaliseListe(reponse) as Parcelle[]);
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

  const filtrees = lignes.filter((p) => {
    if (!q) return true;
    const aiguille = q.toLowerCase();
    return (
      p.nom?.toLowerCase().includes(aiguille) ||
      (p.description ?? '').toLowerCase().includes(aiguille) ||
      (p.typeSol ?? '').toLowerCase().includes(aiguille)
    );
  });

  const colonnes: Colonne<Parcelle>[] = [
    { cle: 'nom', entete: t('commun.colonnes.nom'), rendu: (p) => <strong>{p.nom}</strong> },
    { cle: 'description', entete: t('commun.colonnes.description'), rendu: (p) => p.description || '—' },
    { cle: 'superficie', entete: t('commun.colonnes.superficie'), rendu: (p) => formateNombre(p.superficie) },
    { cle: 'typeSol', entete: t('commun.colonnes.typeSol'), rendu: (p) => p.typeSol || '—' },
    { cle: 'statut', entete: t('commun.colonnes.statut'), rendu: (p) => <BadgeStatut statut={p.statut} /> },
    { cle: 'sommet', entete: t('commun.colonnes.sommets'), rendu: (p) => (p.pointsGPS?.length ? p.pointsGPS.length : '—') },
    { cle: 'cree', entete: t('commun.colonnes.creeLe'), rendu: (p) => formateDate(p.creeA) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>{t('parcelles.titre')}</h1>
          <p style={{ color: '#667085', fontSize: 13, margin: '4px 0 0' }}>
            {t('parcelles.sousTitre')}
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
            placeholder={t('parcelles.recherche')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ paddingLeft: 34 }}
          />
        </div>
      </div>

      <TableauDonnees
        colonnes={colonnes}
        lignes={filtrees}
        chargement={chargement}
        erreur={erreur}
        texteVide={t('parcelles.vide')}
        cleLigne={(p) => p.id}
      />
    </div>
  );
}
