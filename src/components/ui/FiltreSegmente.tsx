import type { ReactNode } from 'react';

export interface OptionSegment<T extends string> {
  valeur: T;
  libelle: string;
  icone?: ReactNode;
  /** Petit compteur collé au libellé (ex. nombre de non-lues). */
  badge?: number;
}

interface Props<T extends string> {
  options: OptionSegment<T>[];
  valeur: T;
  onChange: (valeur: T) => void;
  ariaLabel: string;
  idTest?: string;
}

/**
 * Filtre segmenté (« Reçues / Envoyées », « Toutes / Non lues / Lues »…) :
 * un seul choix actif à la fois, navigable au clavier comme une liste
 * d'onglets WAI-ARIA.
 */
export function FiltreSegmente<T extends string>({
  options,
  valeur,
  onChange,
  ariaLabel,
  idTest,
}: Readonly<Props<T>>) {
  return (
    <div className="seg" role="tablist" aria-label={ariaLabel} data-testid={idTest}>
      {options.map((option) => {
        const actif = option.valeur === valeur;
        return (
          <button
            key={option.valeur}
            type="button"
            role="tab"
            aria-selected={actif}
            tabIndex={actif ? 0 : -1}
            className={`seg-btn ${actif ? 'is-actif' : ''}`}
            data-testid={idTest ? `${idTest}-${option.valeur}` : undefined}
            onClick={() => onChange(option.valeur)}
          >
            {option.icone}
            <span>{option.libelle}</span>
            {typeof option.badge === 'number' && option.badge > 0 ? (
              <span className="seg-badge" aria-hidden>
                {option.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
