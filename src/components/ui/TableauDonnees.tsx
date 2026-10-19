import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ErreurBloc, VideBloc } from './ErrorState';
import { formaterDate, formaterNombre } from '../../i18n';


export interface Colonne<T> {
  cle: string;
  entete: string;
  rendu: (ligne: T) => ReactNode;
  /** Tri par défaut sur cette colonne. */
  tri?: (a: T, b: T) => number;
  largeur?: string;
}

interface Props<T> {
  colonnes: Colonne<T>[];
  lignes: T[];
  chargement: boolean;
  erreur: string | null;
  texteVide: string;
  /** Avertissements non bloquants (ex. une culture injoignable sur N). */
  avertissements?: string[];
  cleLigne: (ligne: T) => string;
  surLigne?: (ligne: T) => void;
}

export function TableauDonnees<T>({
  colonnes,
  lignes,
  chargement,
  erreur,
  texteVide,
  avertissements,
  cleLigne,
  surLigne,
}: Readonly<Props<T>>) {
  const { t } = useTranslation();
  let contenu: ReactNode;

  if (erreur) {
    contenu = <ErreurBloc erreur={erreur} />;
  } else if (chargement) {
    contenu = (
      <div className="card" style={{ padding: 28, textAlign: 'center', color: '#667085' }}>
        {t('commun.etats.chargement')}
      </div>
    );
  } else if (lignes.length === 0) {
    contenu = <VideBloc texte={texteVide} />;
  } else {
    contenu = (
      <>
        {avertissements && avertissements.length > 0 && (
          <output
            className="card"
            style={{
              display: 'block',
              padding: '10px 12px',
              borderLeft: '3px solid #f79009',
              fontSize: 12,
              color: '#7a2e0e',
              background: '#fffcf5',
            }}
          >
            {t('commun.etats.affichagePartiel', { count: avertissements.length })}
            <details style={{ marginTop: 6 }}>
              <summary style={{ cursor: 'pointer' }}>{t('commun.etats.detailAvertissements')}</summary>
              <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                {avertissements.slice(0, 10).map((a) => (
                  <li key={a}>{a}</li>
                ))}
                {avertissements.length > 10 && <li>{t('commun.etats.etAutres', { count: avertissements.length - 10 })}</li>}
              </ul>
            </details>
          </output>
        )}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                  {colonnes.map((c) => (
                    <th
                      key={c.cle}
                      style={{
                        padding: '10px 12px',
                        fontWeight: 600,
                        color: '#475467',
                        borderBottom: '1px solid #eaecf0',
                        whiteSpace: 'nowrap',
                        width: c.largeur,
                      }}
                    >
                      {c.entete}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lignes.map((ligne) => (
                  <tr
                    key={cleLigne(ligne)}
                    onClick={surLigne ? () => surLigne(ligne) : undefined}
                    style={{
                      cursor: surLigne ? 'pointer' : 'default',
                      borderBottom: '1px solid #f2f4f7',
                    }}
                  >
                    {colonnes.map((c) => (
                      <td key={c.cle} style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                        {c.rendu(ligne)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#667085' }}>
          {lignes.length} ligne{lignes.length > 1 ? 's' : ''}
        </div>
      </>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {contenu}
    </div>
  );
}

/** Badge de statut coloré, cohérent entre les pages. */
export function BadgeStatut({ statut }: Readonly<{ statut?: string | null }>) {
  if (!statut) return <span style={{ color: '#98a2b3' }}>—</span>;
  const couleurs: Record<string, { fond: string; texte: string }> = {
    ACTIVE: { fond: '#ecfdf3', texte: '#027a48' },
    EN_COURS: { fond: '#eff8ff', texte: '#175cd3' },
    PLANIFIEE: { fond: '#f4f3ff', texte: '#5925dc' },
    RECOLTEE: { fond: '#ecfdf3', texte: '#027a48' },
    ABANDONNEE: { fond: '#fffcf5', texte: '#b54708' },
    ARCHIVEE: { fond: '#f9fafb', texte: '#475467' },
    SUPPRIMEE: { fond: '#fef3f2', texte: '#b42318' },
  };
  const c = couleurs[statut] ?? { fond: '#f9fafb', texte: '#475467' };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        background: c.fond,
        color: c.texte,
      }}
    >
      {statut}
    </span>
  );
}

/** Formate une date ISO en jj/mm/aaaa, sans inventer de valeur absente. */
export function formateDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return formaterDate(d);
}

/** Formate un nombre avec unité, sans inventer de valeur absente. */
export function formateNombre(v?: number | null, unite?: string | null): string {
  if (v === null || v === undefined) return '—';
  const s = formaterNombre(v);
  return unite ? `${s} ${unite}` : s;
}
