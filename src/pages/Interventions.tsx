import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, RefreshCw } from 'lucide-react';
import { agregeInterventions } from '../services/api';
import { messageErreur } from '../components/ui/ErrorState';
import { TableauDonnees, formateDate, formateNombre, type Colonne } from '../components/ui/TableauDonnees';
import type { Intervention } from '../types';

const TYPES_INTERVENTION = [
  'PLANTATION',
  'IRRIGATION',
  'FERTILISATION',
  'DESHERBAGE',
  'TRAITEMENT',
  'ENTRETIEN',
  'INSPECTION',
  'AUTRE',
] as const;

export function Interventions() {
  const { t } = useTranslation();
  const [lignes, setLignes] = useState<Intervention[]>([]);
  const [avertissements, setAvertissements] = useState<string[]>([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [type, setType] = useState('ALL');

  const charge = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    setAvertissements([]);
    try {
      const { items, erreurs } = await agregeInterventions();
      setLignes(items as Intervention[]);
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

  const filtrees = lignes.filter((i) => {
    if (type !== 'ALL' && i.type !== type) return false;
    if (!q) return true;
    const aiguille = q.toLowerCase();
    return (
      (i.description ?? '').toLowerCase().includes(aiguille) ||
      (i.produit ?? '').toLowerCase().includes(aiguille) ||
      (i.cultureNom ?? '').toLowerCase().includes(aiguille) ||
      (i.type ?? '').toLowerCase().includes(aiguille)
    );
  });

  const colonnes: Colonne<Intervention>[] = [
    { cle: 'type', entete: t('commun.colonnes.type'), rendu: (i) => <strong>{i.type}</strong> },
    { cle: 'culture', entete: t('commun.colonnes.culture'), rendu: (i) => i.cultureNom || '—' },
    { cle: 'description', entete: t('commun.colonnes.description'), rendu: (i) => i.description || '—' },
    { cle: 'produit', entete: t('commun.colonnes.produit'), rendu: (i) => i.produit || '—' },
    { cle: 'quantite', entete: t('commun.colonnes.quantite'), rendu: (i) => formateNombre(i.quantite, i.unite) },
    { cle: 'cout', entete: t('commun.colonnes.cout'), rendu: (i) => formateNombre(i.cout) },
    { cle: 'date', entete: t('commun.colonnes.date'), rendu: (i) => formateDate(i.date) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>{t('interventions.titre')}</h1>
          <p style={{ color: '#667085', fontSize: 13, margin: '4px 0 0' }}>
            {t('interventions.sousTitre')}
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
            placeholder={t('interventions.recherche')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ paddingLeft: 34 }}
          />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} className="input" style={{ minWidth: 170 }}>
          <option value="ALL">{t('commun.filtres.tousTypes')}</option>
          {TYPES_INTERVENTION.map((tp) => (
            <option key={tp} value={tp}>
              {t(`statuts.intervention.${tp}`)}
            </option>
          ))}
        </select>
      </div>

      <TableauDonnees
        colonnes={colonnes}
        lignes={filtrees}
        chargement={chargement}
        erreur={erreur}
        texteVide={t('interventions.vide')}
        avertissements={avertissements}
        cleLigne={(i) => i.id}
      />
    </div>
  );
}
