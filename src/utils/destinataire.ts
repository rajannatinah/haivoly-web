import { i18n } from '../i18n';
import type { UtilisateurPublic } from '../types';


interface PorteurDestinataire {
  userId?: string;
  utilisateur?: UtilisateurPublic | null;
  user?: UtilisateurPublic | null;
}

function destinataire(brut: PorteurDestinataire): UtilisateurPublic | null {
  return brut.utilisateur ?? brut.user ?? null;
}

/** « Rindra Beta » — prénom d'abord, comme dans `nomComplet` du serveur. */
export function nomDestinataire(brut: PorteurDestinataire): string {
  const cible = destinataire(brut);
  const nom = [cible?.prenom, cible?.nom]
    .map((partie) => (partie ?? '').trim())
    .filter(Boolean)
    .join(' ');
  if (nom) return nom;
  // Sans relation, l'identifiant reste préférable à une ligne vide.
  return (brut.userId ?? '').slice(0, 8);
}

/** « Rindra Beta (@rin-da) » — ce que l'agriculteur verra dans son app. */
export function libelleDestinataire(brut: PorteurDestinataire): string {
  const cible = destinataire(brut);
  const nom = nomDestinataire(brut);
  return cible?.username ? `${nom} (@${cible.username})` : nom;
}

export function detailDestinataire(brut: PorteurDestinataire): string {
  const cible = destinataire(brut);
  return cible?.email ?? (cible?.username ? `@${cible.username}` : '');
}

/** Réponse de `POST /recommendations` : diffusion massive ou destinataire unique. */
interface ReponsePublication {
  data?: {
    count?: number;
    destinataires?: Array<{ nomComplet?: string; username?: string }>;
    destinataire?: { nomComplet?: string; username?: string; id?: string };
  };
}

export function compteRenduPublication(
  reponse: unknown,
  destinataireChoisi?: { nomComplet?: string; username?: string } | null,
): string {
  const corps = (reponse as ReponsePublication | null)?.data ?? null;

  const destinataireServeur = corps?.destinataire;
  if (destinataireServeur) {
    const nom =
      destinataireServeur.nomComplet ||
      (destinataireServeur.username ? `@${destinataireServeur.username}` : '') ||
      destinataireChoisi?.nomComplet ||
      '';
    return i18n.t('recommandations.compteRenduDestinataire', { nom });
  }

  const comptes = Array.isArray(corps?.destinataires) ? corps!.destinataires! : [];
  const nombre = Number(corps?.count ?? comptes.length) || 0;
  if (nombre > 0) {
    return i18n.t('recommandations.compteRenduDiffusion', { count: nombre });
  }

  // Réponse inattendue : rien n'est affirmé à l'utilisateur.
  return i18n.t('recommandations.compteRenduInconnu');
}
