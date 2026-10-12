import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, RefreshCw } from 'lucide-react';
import { agregeObservations } from '../services/api';
import { messageErreur } from '../components/ui/ErrorState';
import { TableauDonnees, formateDate, type Colonne } from '../components/ui/TableauDonnees';
import type { Observation } from '../types';

export function Observations() {
  const { t } = useTranslation();
  const [lignes, setLignes] = useState<Observation[]>([]);
  const [avertissements, setAvertissements] = useState<string[]>([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [q, setQ] = useState('');

  const charge = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    setAvertissements([]);
    try {
      const { items, erreurs } = await agregeObservations();
      setLignes(items as Observation[]);
      setAvertissements(erreurs);
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

  const filtrees = lignes.filter((o) => {
    if (!q) return true;
    const aiguille = q.toLowerCase();
    return (
      o.description.toLowerCase().includes(aiguille) ||
      (o.cultureNom ?? '').toLowerCase().includes(aiguille)
    );
  });

  // L'entite Observation n'a ni type ni titre : seulement description + date.
  const colonnes: Colonne<Observation>[] = [
    { cle: 'description', entete: t('commun.colonnes.description'), rendu: (o) => <span style={{ whiteSpace: 'pre-wrap' }}>{o.description}</span> },
    { cle: 'culture', entete: t('commun.colonnes.culture'), rendu: (o) => o.cultureNom || '—' },
    { cle: 'date', entete: t('commun.colonnes.date'), rendu: (o) => formateDate(o.date) },
    { cle: 'modifie', entete: t('commun.colonnes.modifieeLe'), rendu: (o) => formateDate(o.modifieA) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>{t('observations.titre')}</h1>
          <p style={{ color: '#667085', fontSize: 13, margin: '4px 0 0' }}>
            {t('observations.sousTitre')}
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
            placeholder={t('observations.recherche')}
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
        texteVide={t('observations.vide')}
        avertissements={avertissements}
        cleLigne={(o) => o.id}
      />
    </div>
  );
}
