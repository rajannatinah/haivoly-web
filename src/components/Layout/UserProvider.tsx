import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { getMe } from '../../services/api';
import type { UtilisateurConnecte } from '../../services/api';

interface ContexteUtilisateur {
  utilisateur: UtilisateurConnecte | null;
  chargement: boolean;
  definirUtilisateur: (utilisateur: UtilisateurConnecte) => void;
  effacerUtilisateur: () => void;
}

const Contexte = createContext<ContexteUtilisateur>({
  utilisateur: null,
  chargement: true,
  definirUtilisateur: () => undefined,
  effacerUtilisateur: () => undefined,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<UtilisateurConnecte | null>(null);
  const [chargement, setChargement] = useState(true);

  const definirUtilisateur = useCallback((compte: UtilisateurConnecte) => {
    setUtilisateur(compte);
    setChargement(false);
  }, []);

  const effacerUtilisateur = useCallback(() => {
    setUtilisateur(null);
    setChargement(false);
  }, []);

  useEffect(() => {
    let actif = true;
    // Sans jeton en stockage local, aucun appel réseau : évite un 401 parasite
    // dans la console au chargement de la page de connexion.
    if (!localStorage.getItem('haivoly_web_token')) {
      setUtilisateur(null);
      setChargement(false);
      return;
    }
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

  return (
    <Contexte.Provider value={{ utilisateur, chargement, definirUtilisateur, effacerUtilisateur }}>
      {children}
    </Contexte.Provider>
  );
}

export function useUtilisateur(): ContexteUtilisateur {
  return useContext(Contexte);
}
