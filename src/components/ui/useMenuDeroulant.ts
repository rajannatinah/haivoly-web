import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * État d'un menu déroulant : ouverture au clic, fermeture au clic extérieur,
 * à la touche Échap ou à la sélection d'un élément. Mutualisé entre le
 * sélecteur de langue, la cloche de notifications et le menu utilisateur pour
 * garantir un comportement identique (et accessible) aux trois menus.
 */
export function useMenuDeroulant() {
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const fermer = useCallback(() => setOuvert(false), []);
  const basculer = useCallback(() => setOuvert((v) => !v), []);

  useEffect(() => {
    if (!ouvert) return;

    const surClic = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) fermer();
    };
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        fermer();
        // Le focus revient au déclencheur : navigation clavier prévisible.
        ref.current?.querySelector<HTMLButtonElement>('[data-declencheur]')?.focus();
      }
    };

    document.addEventListener('mousedown', surClic);
    document.addEventListener('keydown', surTouche);
    return () => {
      document.removeEventListener('mousedown', surClic);
      document.removeEventListener('keydown', surTouche);
    };
  }, [ouvert, fermer]);

  return { ouvert, ouvrir: () => setOuvert(true), fermer, basculer, ref };
}
