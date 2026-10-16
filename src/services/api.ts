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
export interface DestinataireApercu {
  id: string;
  nom: string;
  prenom: string | null;
  nomComplet: string;
  username: string;
  email?: string;
  role: string;
  estVerifie: boolean;
}

export interface PageDestinataires {
  items: DestinataireApercu[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function rechercherUtilisateurs(
  q: string,
  options: { page?: number; limit?: number; signal?: AbortSignal } = {},
): Promise<PageDestinataires> {
  const params: Record<string, string | number> = { q };
  if (options.page) params.page = options.page;
  if (options.limit) params.limit = options.limit;

  const res = await api.get('/users/search', { params, signal: options.signal });
  const brute = res.data as { data?: Partial<PageDestinataires> } | null;
  const corps = brute?.data ?? (brute as Partial<PageDestinataires> | null);
  const items = Array.isArray(corps?.items)
    ? (corps!.items as DestinataireApercu[])
    : [];

  return {
    items,
    total: Number(corps?.total ?? items.length) || 0,
    page: Number(corps?.page ?? 1) || 1,
    limit: Number(corps?.limit ?? items.length) || items.length,
    totalPages: Number(corps?.totalPages ?? 1) || 1,
  };
}

export interface UtilisateurApercu {
  id: string;
  nom: string;
  prenom: string | null;
  nomComplet: string;
  username: string;
  email?: string;
  role: string;
  estVerifie: boolean;
}

export async function getUtilisateurs(): Promise<UtilisateurApercu[]> {
  const res = await api.get('/users');
  return liste(res.data) as UtilisateurApercu[];
}

export interface ProfilUtilisateur {
  id: string;
  nom: string;
  prenom: string | null;
  username: string;
  email: string;
  telephone: string | null;
  role: string;
  estVerifie: boolean;
  langue: string | null;
  motDePasseProvisoire: boolean;
  creeA: string;
}

export interface UpdateProfilPayload {
  nom?: string;
  prenom?: string;
  telephone?: string;
  username?: string;
  langue?: string;
}

export async function getProfil(): Promise<ProfilUtilisateur> {
  const res = await api.get('/users/me');
  const corps = res.data as { data?: ProfilUtilisateur };
  const profil = corps?.data;
  if (!profil?.id) {
    throw new Error('Réponse inattendue du serveur : profil absent.');
  }
  return profil;
}

export async function updateProfil(
  payload: UpdateProfilPayload,
): Promise<ProfilUtilisateur> {
  const res = await api.patch('/users/me', payload);
  const corps = res.data as { data?: ProfilUtilisateur };
  const profil = corps?.data;
  if (!profil?.id) {
    throw new Error('Réponse inattendue du serveur : profil absent.');
  }
  return profil;
}

export async function markRecommendationRead(id: string) {
  const res = await api.patch(`/recommendations/${id}/read`);
  return res.data;
}
export async function markRecommendationUnread(id: string) {
  const res = await api.patch(`/recommendations/${id}/unread`);
  return res.data;
}

/** Recommandations de l'utilisateur connecté (onglet « Reçues » + cloche). */
export async function getRecommendationsPourMoi(
  options: { unreadOnly?: boolean } = {},
) {
  const params = options.unreadOnly ? { unreadOnly: 'true' } : undefined;
  const res = await api.get('/recommendations/me', { params });
  return liste(res.data);
}

/** Compteur de non-lues pour le badge de la cloche. */
export async function getNombreNonLues(): Promise<number> {
  const res = await api.get('/recommendations/me/unread-count');
  const corps = res.data as { count?: number; data?: { count?: number } };
  return Number(corps?.count ?? corps?.data?.count ?? 0) || 0;
}

/** « Tout marquer comme lu » (mode lecture de l'onglet Reçues). */
export async function markAllRecommendationsRead(): Promise<number> {
  const res = await api.patch('/recommendations/read-all');
  const corps = res.data as { updated?: number; data?: { updated?: number } };
  return Number(corps?.updated ?? corps?.data?.updated ?? 0) || 0;
}
export async function deleteRecommendation(id: string) {
  const res = await api.delete(`/recommendations/${id}`);
  return res.data;
}

export interface RegisterPayload {
  nom: string;
  prenom?: string;
  email: string;
  username?: string;
  telephone?: string;
  langue?: string;
  role?: 'AGRICULTEUR' | 'PROPRIETAIRE';
  password: string;
}

export async function registerWeb(payload: RegisterPayload) {
  const res = await api.post('/auth/register', payload);
  const corps = res.data as { data?: any; message?: string };
  return corps?.data ?? corps;
}

export async function loginWeb(email: string, password: string) {
  const res = await api.post('/auth/login', { email, password });
  const corps = res.data as { data?: { access_token?: string; utilisateur?: unknown } };
  const accessToken = corps?.data?.access_token;
  if (!accessToken) {
    throw new Error(i18n.t('auth.reponseInattendue'));
  }
  return { access_token: accessToken, utilisateur: corps.data?.utilisateur };
}

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


function liste(reponse: unknown): unknown[] {
  if (Array.isArray(reponse)) return reponse;
  const enveloppe = reponse as { data?: unknown } | null;
  const data = enveloppe?.data;
  if (Array.isArray(data)) return data;
  const pagine = data as { items?: unknown } | null;
  if (pagine && Array.isArray(pagine.items)) return pagine.items;
  return [];
}

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
