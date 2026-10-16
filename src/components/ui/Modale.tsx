import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  ouvert: boolean;
  titre: string;
  sousTitre?: string;
  icone?: ReactNode;
  onFermer: () => void;
  children: ReactNode;
  /** Barre d'actions collée en bas de la modale. */
  pieds?: ReactNode;
  largeur?: number;
  idTest?: string;
}

/**
 * Modale générique : portail, fond cliquable, Échap, verrou de défilement et
 * focus initial — le même socle que `ConfirmDialog`, sans la sémantique de
 * confirmation. Sert au détail d'un enregistrement et à l'ajout d'une
 * recommandation.
 */
export function Modale({
  ouvert,
  titre,
  sousTitre,
  icone,
  onFermer,
  children,
  pieds,
  largeur = 560,
  idTest,
}: Readonly<Props>) {
  const { t } = useTranslation();
  const carte = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ouvert) return;
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFermer();
    };
    document.addEventListener('keydown', surTouche);
    const precedent = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const minuteur = setTimeout(
      () =>
        carte.current
          ?.querySelector<HTMLElement>(
            'input, textarea, select, button:not([data-fermeture])',
          )
          ?.focus(),
      30,
    );
    return () => {
      document.removeEventListener('keydown', surTouche);
      document.body.style.overflow = precedent;
      clearTimeout(minuteur);
    };
  }, [ouvert, onFermer]);

  if (!ouvert) return null;

  return createPortal(
    <div
      className="modale-fond"
      onClick={(e) => {
        if (e.target === e.currentTarget) onFermer();
      }}
    >
      <div
        ref={carte}
        className="modale-carte"
        role="dialog"
        aria-modal="true"
        aria-label={titre}
        data-testid={idTest}
        style={{ width: `min(${largeur}px, 94vw)` }}
      >
        <div className="modale-entete">
          {icone ? <span className="modale-icone">{icone}</span> : null}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2>{titre}</h2>
            {sousTitre ? <p>{sousTitre}</p> : null}
          </div>
          <button
            type="button"
            className="icon-btn"
            data-fermeture
            data-testid={idTest ? `${idTest}-fermer` : undefined}
            onClick={onFermer}
            aria-label={t('commun.confirmation.fermer')}
            title={t('commun.confirmation.fermer')}
            style={{ width: 34, height: 34 }}
          >
            <X size={16} />
          </button>
        </div>
        <div className="modale-corps">{children}</div>
        {pieds ? <div className="modale-pieds">{pieds}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
