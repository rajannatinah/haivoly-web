import axios from 'axios';

import { i18n } from '../i18n';
import { config } from '../config';

export const api = axios.create({
  baseURL: config.apiUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('haivoly_web_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('haivoly_web_token');
    }
    return Promise.reject(err);
  },
);

// Actions
export async function getActions(params?: Record<string, string | number>) {
  const res = await api.get('/actions', { params });
  return res.data;
}
export async function getAction(id: string) {
  const res = await api.get(`/actions/${id}`);
  return res.data;
}
export async function getDashboardStats() {
  const res = await api.get('/actions/stats/dashboard');
  return res.data;
}
export async function syncActions(actions: unknown[]) {
  const res = await api.post('/actions/batch-sync', { actions });
  return res.data;
}

// Recommendations
export async function getRecommendations(params?: Record<string, string | number>) {
  const res = await api.get('/recommendations', { params });
  return res.data;
}
export async function createRecommendation(data: unknown) {
  const res = await api.post('/recommendations', data);
  return res.data;
}
export async function markRecommendationRead(id: string) {
  const res = await api.patch(`/recommendations/${id}/read`);
  return res.data;
}
export async function deleteRecommendation(id: string) {
  const res = await api.delete(`/recommendations/${id}`);
  return res.data;
}

// Auth (reuse backend auth)
/**
 * Connexion. Le backend enveloppe ses reponses dans
 * `{ success, data, message }` : le token est donc dans `data.access_token`,
 * PAS au premier niveau. L'ancienne version lisait `res.access_token`, qui
 * valait `undefined` — la connexion reelle ne pouvait pas aboutir.
 */
export async function loginWeb(email: string, password: string) {
  const res = await api.post('/auth/login', { email, password });
  const corps = res.data as { data?: { access_token?: string; utilisateur?: unknown } };
  const accessToken = corps?.data?.access_token;
  if (!accessToken) {
    throw new Error(i18n.t('auth.reponseInattendue'));
  }
  return { access_token: accessToken, utilisateur: corps.data?.utilisateur };
}

/**
 * Utilisateur connecté. Remplace l'identité fictive (« Admin Haivoly ») qui
 * était codée en dur dans la barre latérale : le backend est la source de
 * vérité pour l'identité comme pour le rôle.
 */
export interface UtilisateurConnecte {
  id: string;
  nom: string | null;
  prenom: string | null;
  email: string;
  role: string;
  estVerifie: boolean;
}

export async function getMe(): Promise<UtilisateurConnecte> {
  const res = await api.get('/auth/me');
  const corps = res.data as { data?: UtilisateurConnecte };
  const u = corps?.data;
  if (!u?.id) {
    throw new Error('Réponse inattendue du serveur : utilisateur absent.');
  }
  return u;
}

// ─── Données métier (pages parcelles / cultures / interventions / ───────────
//     observations / récoltes)
//
// CONTRAINTE BACKEND VERIFIEE : les interventions et les observations
// n'ont PAS de route de liste plate. Elles ne sont accessibles que via
// `GET /cultures/:cultureId/...`. Les deux agregations ci-dessous font donc
// un appel par culture (N+1). Pour un proprietaire avec quelques dizaines de
// cultures c'est acceptable ; au-dela il faudra ajouter au backend des routes
// plates `GET /interventions` et `GET /observations` filtrees par
// proprietaire. C'est documente comme limite connue.

export async function getParcelles() {
  const res = await api.get('/parcelles');
  return res.data;
}

export async function getParcelle(id: string) {
  const res = await api.get(`/parcelles/${id}`);
  return res.data;
}

export async function getCultures() {
  const res = await api.get('/cultures');
  return res.data;
}

export async function getCulture(id: string) {
  const res = await api.get(`/cultures/${id}`);
  return res.data;
}

export async function getInterventionsDeCulture(cultureId: string) {
  const res = await api.get(`/cultures/${cultureId}/interventions`);
  return res.data;
}

export async function getObservationsDeCulture(cultureId: string) {
  const res = await api.get(`/cultures/${cultureId}/observations`);
  return res.data;
}

export async function getRecoltes() {
  const res = await api.get('/recoltes');
  return res.data;
}

/**
 * Normalise la reponse du back en tableau.
 *
 * VERIFIE PAR APPEL REEL : `GET /parcelles`, `/cultures` et `/recoltes`
 * renvoient une ENVELOPPE PAGINEE
 *   { success: true, data: { items: [...], total, page, limit, totalPages } }
 * et non un tableau. Les formes acceptees sont donc, dans l'ordre :
 *   1. tableau brut
 *   2. { data: [...] }
 *   3. { data: { items: [...] } }   <- le cas reel
 * Une reponse inattendue donne un tableau vide, jamais une valeur inventee.
 */
function liste(reponse: unknown): unknown[] {
  if (Array.isArray(reponse)) return reponse;
  const enveloppe = reponse as { data?: unknown } | null;
  const data = enveloppe?.data;
  if (Array.isArray(data)) return data;
  const pagine = data as { items?: unknown } | null;
  if (pagine && Array.isArray(pagine.items)) return pagine.items;
  return [];
}

/**
 * Agrege les interventions de toutes les cultures du proprietaire.
 * Echec partiel tolere : une culture injoignable n'annule pas le reste,
 * mais l'appelant en est informe via `erreurs`.
 */
export async function agregeInterventions(): Promise<{ items: unknown[]; erreurs: string[] }> {
  const cultures = liste(await getCultures());
  const resultats = await Promise.allSettled(
    cultures.map((c) => getInterventionsDeCulture((c as { id: string }).id)),
  );
  const items: unknown[] = [];
  const erreurs: string[] = [];
  resultats.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      const culture = cultures[i] as { id: string; nom?: string };
      liste(r.value).forEach((it) => items.push({ ...it as object, cultureId: culture.id, cultureNom: culture.nom }));
    } else {
      erreurs.push(`culture ${(cultures[i] as { id: string }).id} : ${messageErreurAxios(r.reason)}`);
    }
  });
  return { items, erreurs };
}

/** Agrege les observations de toutes les cultures du proprietaire. */
export async function agregeObservations(): Promise<{ items: unknown[]; erreurs: string[] }> {
  const cultures = liste(await getCultures());
  const resultats = await Promise.allSettled(
    cultures.map((c) => getObservationsDeCulture((c as { id: string }).id)),
  );
  const items: unknown[] = [];
  const erreurs: string[] = [];
  resultats.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      const culture = cultures[i] as { id: string; nom?: string };
      liste(r.value).forEach((it) => items.push({ ...it as object, cultureId: culture.id, cultureNom: culture.nom }));
    } else {
      erreurs.push(`culture ${(cultures[i] as { id: string }).id} : ${messageErreurAxios(r.reason)}`);
    }
  });
  return { items, erreurs };
}

function messageErreurAxios(e: unknown): string {
  const err = e as { response?: { data?: { message?: string } }; message?: string };
  return err?.response?.data?.message ?? err?.message ?? 'erreur inconnue';
}

export { liste as normaliseListe };
