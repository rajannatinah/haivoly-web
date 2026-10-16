import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, RefreshCw, Eye, Wheat } from 'lucide-react';
import { getRecoltes, normaliseListe } from '../services/api';
import { messageErreur } from '../components/ui/ErrorState';
import { TableauDonnees, formateDate, formateNombre, type Colonne } from '../components/ui/TableauDonnees';
import { formaterDevise, formaterDateHeure } from '../i18n';
import { PanneauDetail } from '../components/ui/PanneauDetail';
import type { Recolte } from '../types';

export function Recoltes() {
  const { t } = useTranslation();
  const [lignes, setLignes] = useState<Recolte[]>([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<Recolte | null>(null);

  const charge = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const reponse = await getRecoltes();
      setLignes(normaliseListe(reponse) as Recolte[]);
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

  const filtrees = lignes.filter((r) => {
    if (!q) return true;
    const aiguille = q.toLowerCase();
    return (
      (r.culture?.nom ?? '').toLowerCase().includes(aiguille) ||
      (r.unite ?? '').toLowerCase().includes(aiguille) ||
      (r.description ?? '').toLowerCase().includes(aiguille)
    );
  });

  // Totaux calculés ici, pas de valeur codée en dur.
  const montantTotal = filtrees.reduce(
    (somme, r) => somme + (typeof r.prixVente === 'number' ? r.prixVente : 0),
    0,
  );
  const coutTotal = filtrees.reduce(
    (somme, r) => somme + (typeof r.coutRecolte === 'number' ? (r.coutRecolte as number) : 0),
    0,
  );

  const colonnes: Colonne<Recolte>[] = [
    { cle: 'culture', entete: t('commun.colonnes.culture'), rendu: (r) => <strong>{r.culture?.nom ?? '—'}</strong> },
    { cle: 'date', entete: t('commun.colonnes.date'), rendu: (r) => formateDate(r.dateRecolte) },
    { cle: 'quantite', entete: t('commun.colonnes.quantite'), rendu: (r) => formateNombre(r.quantite, r.unite) },
    { cle: 'prix', entete: t('commun.colonnes.prix'), rendu: (r) => formateNombre(r.prixVente) },
    { cle: 'cout', entete: t('commun.colonnes.cout'), rendu: (r) => formateNombre(r.coutRecolte as unknown as number) },
    { cle: 'description', entete: t('commun.colonnes.description'), rendu: (r) => r.description || '—' },
    {
      cle: 'actions',
      entete: t('commun.colonnes.actions'),
      largeur: '1%',
      rendu: (r) => (
        <button type="button" className="btn btn-ghost btn-mini" data-testid={`detail-${r.id}`} onClick={() => setDetail(r)}>
          <Eye size={15} /> {t('commun.actions.details')}
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>{t('recoltes.titre')}</h1>
          <p style={{ color: '#667085', fontSize: 13, margin: '4px 0 0' }}>
            {t('recoltes.sousTitre')}
          </p>
        </div>
        <button className="btn btn-outline" onClick={() => void charge()} disabled={chargement}>
          <RefreshCw size={16} /> {t('commun.actions.actualiser')}
        </button>
      </div>

      {!chargement && !erreur && filtrees.length > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="card" style={{ padding: '10px 14px', flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 12, color: '#667085' }}>{t('recoltes.ventesCumulees')}</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{formaterDevise(montantTotal)}</div>
          </div>
          <div className="card" style={{ padding: '10px 14px', flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 12, color: '#667085' }}>{t('recoltes.coutsCumules')}</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{formaterDevise(coutTotal)}</div>
          </div>
          <div className="card" style={{ padding: '10px 14px', flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 12, color: '#667085' }}>{t('recoltes.margeBrute')}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: montantTotal - coutTotal >= 0 ? '#027a48' : '#b42318' }}>
              {formaterDevise(montantTotal - coutTotal)}
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: 11, color: '#98A2B3' }} />
          <input
            className="input"
            placeholder={t('recoltes.recherche')}
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
        texteVide={t('recoltes.vide')}
        cleLigne={(r) => r.id}
      />

      <PanneauDetail
        ouvert={detail !== null}
        onFermer={() => setDetail(null)}
        titre={t('detail.titreRecolte')}
        sousTitre={detail?.culture?.nom}
        icone={<Wheat size={18} color="#2E7D32" />}
        idTest="detail-recolte"
        sections={
          detail
            ? [
                {
                  titre: t('detail.informations'),
                  champs: [
                    { libelle: t('commun.colonnes.culture'), valeur: detail.culture?.nom },
                    { libelle: t('commun.colonnes.date'), valeur: formateDate(detail.dateRecolte) },
                    { libelle: t('commun.colonnes.quantite'), valeur: formateNombre(detail.quantite, detail.unite) },
                    { libelle: t('commun.colonnes.description'), valeur: <span style={{ whiteSpace: 'pre-wrap' }}>{detail.description}</span>, large: true },
                  ],
                },
                {
                  titre: t('detail.finances'),
                  champs: [
                    { libelle: t('commun.colonnes.prix'), valeur: detail.prixVente != null ? formaterDevise(detail.prixVente) : null },
                    { libelle: t('commun.colonnes.cout'), valeur: detail.coutRecolte != null ? formaterDevise(detail.coutRecolte) : null },
                    {
                      libelle: t('recoltes.margeBrute'),
                      valeur:
                        detail.prixVente != null && detail.coutRecolte != null
                          ? formaterDevise((detail.prixVente as number) - (detail.coutRecolte as number))
                          : null,
                    },
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
