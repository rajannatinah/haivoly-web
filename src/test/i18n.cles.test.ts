import { describe, expect, it } from 'vitest';

import fr from '../i18n/locales/fr';

/**
 * Clés orphelines : définies dans le dictionnaire mais plus appelées nulle
 * part. Elles n'apparaissent jamais à l'écran, donc aucune revue ne les
 * repère, et elles finissent par diverger entre langues.
 *
 * La collecte passe par `import.meta.glob` plutôt que par `node:fs` : le
 * projet web n'installe pas `@types/node`, et Vite sait déjà énumérer les
 * modules sources sans API système.
 */

type Noeud = string | { [cle: string]: Noeud };

function aplatir(noeud: Noeud, prefixe = ''): string[] {
  const sortie: string[] = [];
  for (const [cle, valeur] of Object.entries(noeud)) {
    const chemin = prefixe ? `${prefixe}.${cle}` : cle;
    if (typeof valeur === 'string') sortie.push(chemin);
    else sortie.push(...aplatir(valeur, chemin));
  }
  return sortie;
}

/** Sources applicatives, hors dictionnaires et hors tests eux-mêmes. */
const modules = import.meta.glob('../**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const sources = Object.entries(modules)
  .filter(([chemin]) => !chemin.includes('/i18n/') && !chemin.includes('/test/'))
  .map(([, contenu]) => contenu)
  .join('\n');

describe('clés de traduction réellement utilisées', () => {
  /**
   * Toute clé citée entre guillemets dans le code source compte comme
   * utilisée. Cela couvre `t('a.b')`, `i18n.t('a.b')` et les clés stockées
   * dans une constante puis passées à `t(item.label)` — cas du menu latéral.
   * Un simple regex sur `t(` ratait ces deux dernières formes.
   */
  const utilisees = new Set<string>();
  for (const m of sources.matchAll(/['"`]([a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9]*)+)['"`]/g)) {
    utilisees.add(m[1]);
  }

  /** Préfixes des clés construites dynamiquement, ex. `statuts.culture.${st}`. */
  const prefixesDynamiques = new Set<string>();
  for (const m of sources.matchAll(/t\(\s*[`'"]([a-zA-Z0-9_.]+)\.\$\{/g)) {
    prefixesDynamiques.add(m[1]);
  }

  it('aucune clé définie n’est orpheline', () => {
    const orphelines = aplatir(fr as Noeud).filter(
      (cle) =>
        !utilisees.has(cle) &&
        ![...prefixesDynamiques].some((p) => cle.startsWith(`${p}.`)),
    );
    expect(orphelines).toEqual([]);
  });

  it('le scan capture réellement les appels (garde-fou du test lui-même)', () => {
    /**
     * Sans cette assertion, un regex cassé rendrait le test des orphelines
     * aveugle dans un sens ou dans l'autre sans que rien ne le signale.
     */
    expect(utilisees.has('commun.actions.actualiser')).toBe(true);
    expect(prefixesDynamiques.has('statuts.culture')).toBe(true);
    expect(sources.length).toBeGreaterThan(10_000);
  });
});
