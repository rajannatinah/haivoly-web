import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, RefreshCw, Eye, Map } from 'lucide-react';
import { getParcelles, normaliseListe } from '../services/api';
import { messageErreur } from '../components/ui/ErrorState';
import { TableauDonnees, BadgeStatut, formateDate, formateNombre, type Colonne } from '../components/ui/TableauDonnees';
import { PanneauDetail } from '../components/ui/PanneauDetail';
import { formaterDateHeure } from '../i18n';
import type { Parcelle } from '../types';

export function Parcelles() {
  const { t } = useTranslation();
  const [lignes, setLignes] = useState<Parcelle[]>([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<Parcelle | null>(null);

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
    {
      cle: 'actions',
      entete: t('commun.colonnes.actions'),
      largeur: '1%',
      rendu: (p) => (
        <button type="button" className="btn btn-ghost btn-mini" data-testid={`detail-${p.id}`} onClick={() => setDetail(p)}>
          <Eye size={15} /> {t('commun.actions.details')}
        </button>
      ),
    },
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

      <PanneauDetail
        ouvert={detail !== null}
        onFermer={() => setDetail(null)}
        titre={t('detail.titreParcelle')}
        sousTitre={detail?.nom}
        icone={<Map size={18} color="#2E7D32" />}
        idTest="detail-parcelle"
        sections={
          detail
            ? [
                {
                  titre: t('detail.informations'),
                  champs: [
                    { libelle: t('commun.colonnes.nom'), valeur: detail.nom },
                    { libelle: t('commun.colonnes.superficie'), valeur: formateNombre(detail.superficie) },
                    { libelle: t('commun.colonnes.typeSol'), valeur: detail.typeSol },
                    { libelle: t('commun.colonnes.statut'), valeur: <BadgeStatut statut={detail.statut} /> },
                    { libelle: t('commun.colonnes.sommets'), valeur: detail.pointsGPS?.length ?? null },
                    { libelle: t('commun.colonnes.description'), valeur: <span style={{ whiteSpace: 'pre-wrap' }}>{detail.description}</span>, large: true },
                  ],
                  json: detail.pointsGPS?.length
                    ? { libelle: t('detail.pointsGps'), valeur: detail.pointsGPS }
                    : undefined,
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
