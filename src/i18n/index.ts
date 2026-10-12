import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import fr from './locales/fr';
import en from './locales/en';
import mg from './locales/mg';

/**
 * Instance i18n du web.
 *
 * Même architecture que le mobile (langues, résolution, persistance) pour que
 * les deux applications partagent le même comportement, mais stockage
 * `localStorage` au lieu d'AsyncStorage : c'est l'équivalent natif ici.
 */

export const LANGUES_DISPONIBLES = ['fr', 'en', 'mg'] as const;
export type Langue = (typeof LANGUES_DISPONIBLES)[number];

export const LANGUE_PAR_DEFAUT: Langue = 'fr';

export type ChoixLangue = Langue | 'system';
export const CHOIX_SYSTEME = 'system' as const;

const CLE_STOCKAGE = 'haivoly_web:langue';

/** Normalise une balise (`fr-FR`, `en-US`, `mg`) en langue supportée. */
export function resoudreLangue(balise: string | null | undefined): Langue {
  if (!balise) return LANGUE_PAR_DEFAUT;
  const code = balise.toLowerCase().split('-')[0];
  return (LANGUES_DISPONIBLES as readonly string[]).includes(code)
    ? (code as Langue)
    : LANGUE_PAR_DEFAUT;
}

/** Lit le choix persisté. `system` si rien n'a été enregistré. */
export function lireChoix(): ChoixLangue {
  try {
    const brut = localStorage.getItem(CLE_STOCKAGE);
    if (!brut) return CHOIX_SYSTEME;
    if (brut === CHOIX_SYSTEME) return CHOIX_SYSTEME;
    return resoudreLangue(brut);
  } catch {
    return CHOIX_SYSTEME;
  }
}

/** Langue du navigateur, ramenée à une langue supportée. */
export function langueDuSysteme(): Langue {
  try {
    return resoudreLangue(navigator.language);
  } catch {
    return LANGUE_PAR_DEFAUT;
  }
}

export function resoudreChoix(choix: ChoixLangue): Langue {
  return choix === CHOIX_SYSTEME ? langueDuSysteme() : choix;
}

export async function initialiserI18n(): Promise<void> {
  if (i18n.isInitialized) return;

  await i18n.use(initReactI18next).init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      mg: { translation: mg },
    },
    lng: resoudreChoix(lireChoix()),
    fallbackLng: LANGUE_PAR_DEFAUT,
    interpolation: { escapeValue: false },
    returnNull: false,
  });
}

/** Change de langue, persiste le choix et synchronise l'attribut `lang`. */
export async function changerLangue(choix: ChoixLangue): Promise<void> {
  try {
    localStorage.setItem(CLE_STOCKAGE, choix);
  } catch {
    // Stockage indisponible (mode privé) : le changement reste effectif
    // pour la session, sans persistance.
  }
  const langue = resoudreChoix(choix);
  await i18n.changeLanguage(langue);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = langue;
  }
}

export { i18n };
export default i18n;

/**
 * Balise BCP-47 utilisée par `Intl`.
 *
 * `mg` n'a pas de données de format fiables dans les moteurs courants : on
 * retombe sur `fr-MG`, le français étant la langue administrative et le
 * formatage attendu à Madagascar. Même règle que `baliseDeFormatage()` du
 * mobile, pour que les deux applications affichent les mêmes dates.
 */
export const BALISES_INTL: Record<Langue, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  mg: 'fr-MG',
};

export function baliseDeFormatage(langue?: string | null): string {
  return BALISES_INTL[resoudreLangue(langue ?? i18n.language)];
}

export function langueActive(): Langue {
  return resoudreLangue(i18n.language);
}

/** Date courte sans heure : `12/03/2026`. */
export function formaterDate(valeur: string | number | Date | null | undefined): string {
  if (valeur === null || valeur === undefined || valeur === '') return '—';
  const d = new Date(valeur);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat(baliseDeFormatage(), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/** Date et heure : `12/03/2026 14:30`. */
export function formaterDateHeure(valeur: string | number | Date | null | undefined): string {
  if (valeur === null || valeur === undefined || valeur === '') return '—';
  const d = new Date(valeur);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat(baliseDeFormatage(), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/** Nombre avec séparateurs de la langue active. */
export function formaterNombre(valeur: number | null | undefined, chiffres = 2): string {
  if (valeur === null || valeur === undefined || Number.isNaN(valeur)) return '—';
  return new Intl.NumberFormat(baliseDeFormatage(), {
    minimumFractionDigits: 0,
    maximumFractionDigits: chiffres,
  }).format(valeur);
}

/** Montant en ariary : `12 500 Ar`. */
export function formaterDevise(valeur: number | null | undefined): string {
  if (valeur === null || valeur === undefined || Number.isNaN(valeur)) return '—';
  return `${formaterNombre(valeur, 0)} Ar`;
}
