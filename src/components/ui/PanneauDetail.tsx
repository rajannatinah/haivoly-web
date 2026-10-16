import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Modale } from './Modale';

export interface ChampDetail {
  libelle: string;
  valeur: ReactNode;
  /** Le champ occupe toute la largeur (messages longs, descriptions). */
  large?: boolean;
}

export interface SectionDetail {
  titre?: string;
  champs: ChampDetail[];
  /** Bloc JSON replié pour les données techniques (payload, metadata). */
  json?: { libelle: string; valeur: unknown };
}

interface Props {
  ouvert: boolean;
  onFermer: () => void;
  titre: string;
  sousTitre?: string;
  icone?: ReactNode;
  sections: SectionDetail[];
  /** Actions spécifiques à l'enregistrement (marquer lu, supprimer…). */
  actions?: ReactNode;
  largeur?: number;
  idTest?: string;
}

/** Valeur absente : tiret cadratin, jamais de valeur inventée. */
export function ouTiret(valeur: ReactNode): ReactNode {
  if (valeur === null || valeur === undefined || valeur === '') return '—';
  return valeur;
}

/**
 * Panneau de détail commun à toutes les pages : chaque enregistrement
 * (action, parcelle, culture, intervention, observation, récolte,
 * utilisateur, recommandation) s'ouvre dans la même mise en page, avec les
 * champs réels renvoyés par le serveur et rien d'autre.
 */
export function PanneauDetail({
  ouvert,
  onFermer,
  titre,
  sousTitre,
  icone,
  sections,
  actions,
  largeur = 620,
  idTest,
}: Readonly<Props>) {
  const { t } = useTranslation();

  return (
    <Modale
      ouvert={ouvert}
      titre={titre}
      sousTitre={sousTitre}
      icone={icone}
      onFermer={onFermer}
      largeur={largeur}
      idTest={idTest}
      pieds={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>
          <button type="button" className="btn btn-outline" onClick={onFermer}>
            {t('commun.confirmation.fermer')}
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sections.map((section, i) => (
          <section key={section.titre ?? i}>
            {section.titre ? <h3 className="detail-section-titre">{section.titre}</h3> : null}
            <div className="detail-grille">
              {section.champs.map((champ) => (
                <div
                  key={champ.libelle}
                  className="detail-champ"
                  style={champ.large ? { gridColumn: '1 / -1' } : undefined}
                >
                  <dt>{champ.libelle}</dt>
                  <dd>{ouTiret(champ.valeur)}</dd>
                </div>
              ))}
            </div>
            {section.json && section.json.valeur != null ? (
              <details className="detail-json" style={{ marginTop: 10 }}>
                <summary>{section.json.libelle}</summary>
                <pre>{JSON.stringify(section.json.valeur, null, 2)}</pre>
              </details>
            ) : null}
          </section>
        ))}
      </div>
    </Modale>
  );
}
