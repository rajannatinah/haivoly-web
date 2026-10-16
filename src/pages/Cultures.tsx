import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, RefreshCw, Eye, TreePine } from 'lucide-react';
import { getCultures, normaliseListe } from '../services/api';
import { messageErreur } from '../components/ui/ErrorState';
import { TableauDonnees, BadgeStatut, formateDate, type Colonne } from '../components/ui/TableauDonnees';
import { PanneauDetail } from '../components/ui/PanneauDetail';
import { formaterDateHeure } from '../i18n';
import type { Culture } from '../types';

const STATUTS_CULTURE = ['PLANIFIEE', 'EN_COURS', 'RECOLTEE', 'ABANDONNEE', 'SUPPRIMEE'] as const;

export function Cultures() {
  const { t } = useTranslation();
  const [lignes, setLignes] = useState<Culture[]>([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [statut, setStatut] = useState('ALL');
  const [detail, setDetail] = useState<Culture | null>(null);

  const charge = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const reponse = await getCultures();
      setLignes(normaliseListe(reponse) as Culture[]);
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

  const filtrees = lignes.filter((c) => {
    if (statut !== 'ALL' && c.statut !== statut) return false;
    if (!q) return true;
    const aiguille = q.toLowerCase();
    return (
      c.nom?.toLowerCase().includes(aiguille) ||
      (c.variete ?? '').toLowerCase().includes(aiguille) ||
      (c.type ?? '').toLowerCase().includes(aiguille) ||
      (c.parcelle?.nom ?? '').toLowerCase().includes(aiguille)
    );
  });

  const colonnes: Colonne<Culture>[] = [
    { cle: 'nom', entete: t('commun.colonnes.culture'), rendu: (c) => <strong>{c.nom}</strong> },
    { cle: 'variete', entete: t('commun.colonnes.variete'), rendu: (c) => c.variete || '—' },
    { cle: 'parcelle', entete: t('commun.colonnes.parcelle'), rendu: (c) => c.parcelle?.nom || '—' },
    { cle: 'plantation', entete: t('commun.colonnes.plantation'), rendu: (c) => formateDate(c.datePlantation) },
    { cle: 'prevue', entete: t('commun.colonnes.recoltePrevue'), rendu: (c) => formateDate(c.datePrevueRecolte) },
    { cle: 'statut', entete: t('commun.colonnes.statut'), rendu: (c) => <BadgeStatut statut={c.statut} /> },
    {
      cle: 'actions',
      entete: t('commun.colonnes.actions'),
      largeur: '1%',
      rendu: (c) => (
        <button type="button" className="btn btn-ghost btn-mini" data-testid={`detail-${c.id}`} onClick={() => setDetail(c)}>
          <Eye size={15} /> {t('commun.actions.details')}
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>{t('cultures.titre')}</h1>
          <p style={{ color: '#667085', fontSize: 13, margin: '4px 0 0' }}>
            {t('cultures.sousTitre')}
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
            placeholder={t('cultures.recherche')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ paddingLeft: 34 }}
          />
        </div>
        <select value={statut} onChange={(e) => setStatut(e.target.value)} className="input" style={{ minWidth: 170 }}>
          <option value="ALL">{t('commun.filtres.tousStatuts')}</option>
          {STATUTS_CULTURE.map((st) => (
            <option key={st} value={st}>
              {t(`statuts.culture.${st}`)}
            </option>
          ))}
        </select>
      </div>

      <TableauDonnees
        colonnes={colonnes}
        lignes={filtrees}
        chargement={chargement}
        erreur={erreur}
        texteVide={t('cultures.vide')}
        cleLigne={(c) => c.id}
      />

      <PanneauDetail
        ouvert={detail !== null}
        onFermer={() => setDetail(null)}
        titre={t('detail.titreCulture')}
        sousTitre={detail?.nom}
        icone={<TreePine size={18} color="#2E7D32" />}
        idTest="detail-culture"
        sections={
          detail
            ? [
                {
                  titre: t('detail.informations'),
                  champs: [
                    { libelle: t('commun.colonnes.culture'), valeur: detail.nom },
                    { libelle: t('commun.colonnes.type'), valeur: detail.type },
                    { libelle: t('commun.colonnes.variete'), valeur: detail.variete },
                    { libelle: t('cultures.stade'), valeur: detail.stade },
                    { libelle: t('commun.colonnes.statut'), valeur: <BadgeStatut statut={detail.statut} /> },
                    { libelle: t('commun.colonnes.parcelle'), valeur: detail.parcelle?.nom },
                    { libelle: t('commun.colonnes.plantation'), valeur: formateDate(detail.datePlantation) },
                    { libelle: t('commun.colonnes.recoltePrevue'), valeur: formateDate(detail.datePrevueRecolte) },
                    { libelle: t('commun.colonnes.description'), valeur: <span style={{ whiteSpace: 'pre-wrap' }}>{detail.description}</span>, large: true },
                  ],
                },
                {
                  titre: t('detail.dates'),
                  champs: [
                    { libelle: t('commun.colonnes.creeLe'), valeur: formaterDateHeure(detail.creeA) },
                    { libelle: t('commun.colonnes.modifieeLe'), valeur: formaterDateHeure(detail.modifieA) },
                  ],
                },
                {
                  titre: t('detail.technique'),
                  champs: [{ libelle: t('detail.identifiant'), valeur: <code style={{ fontSize: 11 }}>{detail.id}</code>, large: true }],
                },
              ]
            : []
        }
      />
    </div>
  );
}
