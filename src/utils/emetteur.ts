import type { Recommendation, UtilisateurPublic } from '../types';

/**
 * Émetteur d'une recommandation (lot 9). Les lignes antérieures au patch
 * backend n'ont pas de `createur` : on renvoie `null` et l'interface affiche
 * un tiret — aucune identité n'est inventée.
 */
export function emetteurDe(r: Recommendation): UtilisateurPublic | null {
  return r.createur ?? null;
}

/** « Rindra Beta (@rin-da) », ou chaîne vide si l'émetteur est inconnu. */
export function nomEmetteur(r: Recommendation): string {
  const c = emetteurDe(r);
  if (!c) return '';
  const nom = [c.prenom, c.nom]
    .map((p) => (p ?? '').trim())
    .filter(Boolean)
    .join(' ');
  const base = nom || c.username || c.id.slice(0, 8);
  return c.username && nom ? `${nom} (@${c.username})` : base;
}
