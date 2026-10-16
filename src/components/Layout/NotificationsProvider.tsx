import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { ReactNode } from 'react';

import { getNombreNonLues } from '../../services/api';

/** Intervalle de rafraîchissement du compteur (le serveur n'a pas de push). */
const INTERVALE_MS = 30_000;

interface ContexteNotifications {
  /** Nombre de recommandations non lues de l'utilisateur connecté. */
  nonLues: number;
  chargement: boolean;
  /** À appeler après toute action qui change l'état lu/non-lu. */
  rafraichir: () => Promise<void>;
}

const Contexte = createContext<ContexteNotifications>({
  nonLues: 0,
  chargement: true,
  rafraichir: async () => {},
});

/**
 * Compteur de notifications partagé : la cloche de la barre du haut, la page
 * Recommandations et les modales de lecture lisent la même source, donc une
 * recommandation marquée lue met immédiatement le badge à jour partout.
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [nonLues, setNonLues] = useState(0);
  const [chargement, setChargement] = useState(true);

  const rafraichir = useCallback(async () => {
    try {
      setNonLues(await getNombreNonLues());
    } catch {
      // Un échec de compteur ne casse pas l'interface : le badge reste à sa
      // dernière valeur connue et le prochain cycle réessaiera.
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void rafraichir();
    const minuteur = setInterval(() => void rafraichir(), INTERVALE_MS);
    const surFocus = () => void rafraichir();
    window.addEventListener('focus', surFocus);
    return () => {
      clearInterval(minuteur);
      window.removeEventListener('focus', surFocus);
    };
  }, [rafraichir]);

  return (
    <Contexte.Provider value={{ nonLues, chargement, rafraichir }}>
      {children}
    </Contexte.Provider>
  );
}

export function useNotifications(): ContexteNotifications {
  return useContext(Contexte);
}
