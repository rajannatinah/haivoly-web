// Haivoly Web — Types partagés avec mobile + backend

export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'DUPLICATE' | 'INVALID';

export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC' | 'LOGIN' | 'OTHER';

export type EntityType = 'PARCELLE' | 'POINT_GPS' | 'CULTURE' | 'INTERVENTION' | 'OBSERVATION' | 'PHOTO' | 'RECOLTE';

export interface UtilisateurPublic {
  id: string;
  nom: string;
  prenom: string | null;
  email?: string;
  /** Identifiant public affiché dans l'application mobile. */
  username?: string;
}

export interface Action {
  id: string;
  userId: string;
  utilisateur?: UtilisateurPublic | null;
  /** Orthographe historique (`user`) conservée comme repli de lecture. */
  user?: UtilisateurPublic | null;
  actionType: ActionType;
  entityType: EntityType;
  entityId: string | null;
  payload: Record<string, unknown> | null;
  timestamp: string;
  deviceId?: string | null;
  syncStatus: SyncStatus;
  retryCount: number;
  syncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown> | null;
}

export interface Recommendation {
  id: string;
  userId: string;
  utilisateur?: UtilisateurPublic | null;
  /** Orthographe historique (`user`) conservée comme repli de lecture. */
  user?: UtilisateurPublic | null;
  /** Émetteur (lot 9) : `null` sur les recommandations antérieures au patch. */
  createdById?: string | null;
  createur?: UtilisateurPublic | null;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ALERT';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  readAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
}

export interface DashboardStats {
  totalUsers: number;
  actionsToday: number;
  actionsSynced: number;
  actionsPending: number;
  actionsFailed: number;
  totalActions: number;
  recommendations: number;
  syncRate: number;
}

export interface PaginatedActions {
  data: Action[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}


export type StatutParcelle = 'ACTIVE' | 'ABANDONNEE' | 'ARCHIVEE' | 'SUPPRIMEE';
export type StatutCulture = 'PLANIFIEE' | 'EN_COURS' | 'RECOLTEE' | 'ABANDONNEE' | 'SUPPRIMEE';
export type StatutIntervention = 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
export type TypeIntervention =
  | 'PLANTATION' | 'IRRIGATION' | 'FERTILISATION' | 'DESHERBAGE'
  | 'TRAITEMENT' | 'ENTRETIEN' | 'INSPECTION' | 'AUTRE';

export interface PointGPS {
  id?: string;
  latitude: number;
  longitude: number;
  ordre?: number;
  parcelleId?: string;
  creeA?: string;
  modifieA?: string;
}

export interface Parcelle {
  id: string;
  nom: string;
  description?: string | null;
  superficie?: number | null;
  typeSol?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  statut?: StatutParcelle;
  raisonSuppression?: string | null;
  utilisateurId?: string;
  pointsGPS?: PointGPS[];
  creeA?: string;
  modifieA?: string;
}

export interface Culture {
  id: string;
  nom: string;
  type?: string | null;
  variete?: string | null;
  description?: string | null;
  stade?: string | null;
  datePlantation?: string | null;
  datePrevueRecolte?: string | null;
  statut?: StatutCulture;
  raisonSuppression?: string | null;
  parcelleId?: string;
  parcelle?: { id: string; nom: string } | null;
  creeA?: string;
  modifieA?: string;
}

export interface Intervention {
  id: string;
  type: TypeIntervention | string;
  description?: string | null;
  date?: string | null;
  statut?: StatutIntervention;
  produit?: string | null;
  quantite?: number | null;
  unite?: string | null;
  cout?: number | null;
  cultureId?: string;
  /** Ajoute par l'agregation cote web, absent du payload backend. */
  cultureNom?: string;
  creeA?: string;
  modifieA?: string;
}

export interface Observation {
  id: string;
  description: string;
  date?: string | null;
  cultureId?: string;
  /** Ajoute par l'agregation cote web, absent du payload backend. */
  cultureNom?: string;
  modifieA?: string;
}

export interface Recolte {
  id: string;
  /** Colonne `date` cote SQL : une DATE, donc 'aaaa-mm-jj' et non un instant. */
  dateRecolte?: string | null;
  quantite?: number | null;
  unite?: string | null;
  description?: string | null;
  prixVente?: number | null;
  coutRecolte?: number | null;
  cultureId?: string;
  culture?: Culture | null;
  creeA?: string;
  modifieA?: string;
}
