/** Initiales affichées dans l'avatar, dérivées de l'utilisateur réel. */
export function initialesDe(
  u: { nom: string | null; prenom: string | null; email: string } | null,
): string {
  if (!u) return '··';
  const src = `${u.prenom ?? ''} ${u.nom ?? ''}`.trim();
  if (!src) return u.email.slice(0, 2).toUpperCase();
  return src
    .split(/\s+/)
    .slice(0, 2)
    .map((m) => m[0]?.toUpperCase() ?? '')
    .join('');
}
