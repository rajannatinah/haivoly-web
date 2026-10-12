import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { getMe } from '../../services/api';
import type { UtilisateurConnecte } from '../../services/api';

/**
 * Utilisateur connecté, chargé depuis `GET /auth/me`.
 *
 * Tant que la requête n'a pas abouti, `utilisateur` vaut `null` : les
 * composants affichent alors un état neutre plutôt qu'une identité inventée.
 */
interface ContexteUtilisateur {
  utilisateur: UtilisateurConnecte | null;
  chargement: boolean;
}

const Contexte = createContext<ContexteUtilisateur>({ utilisateur: null, chargement: true });

export function UserProvider({ children }: { children: ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<UtilisateurConnecte | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    let actif = true;
    getMe()
      .then((u) => {
        if (actif) setUtilisateur(u);
      })
      .catch(() => {
        if (actif) setUtilisateur(null);
      })
      .finally(() => {
        if (actif) setChargement(false);
      });
    return () => {
      actif = false;
    };
  }, []);

  return <Contexte.Provider value={{ utilisateur, chargement }}>{children}</Contexte.Provider>;
}

export function useUtilisateur(): ContexteUtilisateur {
  return useContext(Contexte);
}
