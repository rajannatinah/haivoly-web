import { describe, expect, it } from 'vitest';

import fr from '../i18n/locales/fr';
import en from '../i18n/locales/en';
import mg from '../i18n/locales/mg';
import { LANGUES_DISPONIBLES } from '../i18n';

/**
 * Contrôle automatique des dictionnaires de traduction.
 *
 * Deux défauts classiques passent inaperçus en revue : une clé ajoutée au
 * français mais absente d'une autre langue (l'utilisateur voit alors la clé
 * brute), et une clé devenue orpheline après un refactor. Les deux sont
 * détectés ici, sans avoir à exécuter l'interface.
 */

type Noeud = string | { [cle: string]: Noeud };

function aplatir(noeud: Noeud, prefixe = ''): Record<string, string> {
  const sortie: Record<string, string> = {};
  for (const [cle, valeur] of Object.entries(noeud)) {
    const chemin = prefixe ? `${prefixe}.${cle}` : cle;
    if (typeof valeur === 'string') {
      sortie[chemin] = valeur;
    } else {
      Object.assign(sortie, aplatir(valeur, chemin));
    }
  }
  return sortie;
}

const plat = {
  fr: aplatir(fr as Noeud),
  en: aplatir(en as Noeud),
  mg: aplatir(mg as Noeud),
};

describe('parité des dictionnaires', () => {
  it('expose exactement fr / en / mg', () => {
    expect([...LANGUES_DISPONIBLES].sort()).toEqual(['en', 'fr', 'mg']);
  });

  it.each(['en', 'mg'] as const)('%s possède exactement les clés du français', (lg) => {
    const clesFr = Object.keys(plat.fr).sort();
    const clesLg = Object.keys(plat[lg]).sort();

    const manquantes = clesFr.filter((c) => !clesLg.includes(c));
    const orphelines = clesLg.filter((c) => !clesFr.includes(c));

    expect({ manquantes, orphelines }).toEqual({ manquantes: [], orphelines: [] });
  });

  it.each(['en', 'mg'] as const)('%s ne contient aucune valeur vide', (lg) => {
    const vides = Object.entries(plat[lg])
      .filter(([, v]) => v.trim() === '')
      .map(([k]) => k);
    expect(vides).toEqual([]);
  });

  it.each(['en', 'mg'] as const)(
    '%s préserve les variables d’interpolation du français',
    (lg) => {
      const variables = (s: string) => (s.match(/\{\{\s*\w+\s*\}\}/g) ?? []).sort();
      const divergences = Object.entries(plat.fr)
        .filter(([cle]) => variables(cle in plat[lg] ? plat[lg][cle] : '').length !== variables(plat.fr[cle]).length)
        .map(([cle]) => `${cle}: fr=${variables(plat.fr[cle]).join(',')} ${lg}=${variables(plat[lg][cle]).join(',')}`);
      expect(divergences).toEqual([]);
    },
  );

  it('aucune langue ne conserve la valeur française par recopie aveugle', () => {
    /**
     * Un dictionnaire traduit à la va-vite recopie le français. On n'interdit
     * pas toute identité (noms propres, sigles techniques), mais un taux
     * d'identité élevé signale une traduction absente.
     */
    for (const lg of ['en', 'mg'] as const) {
      const cles = Object.keys(plat.fr);
      const identiques = cles.filter((c) => plat[lg][c] === plat.fr[c]);
      const taux = identiques.length / cles.length;
      expect(taux, `${lg}: ${identiques.length}/${cles.length} valeurs identiques au français`).toBeLessThan(0.35);
    }
  });
});
