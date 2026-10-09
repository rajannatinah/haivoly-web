// Haivoly Web — Types partagés avec mobile + backend

export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'DUPLICATE' | 'INVALID';

export type ActionType =
  | 'CREATE_PARCELLE'
  | 'UPDATE_PARCELLE'
  | 'DELETE_PARCELLE'
  | 'CREATE_CULTURE'
  | 'UPDATE_CULTURE'
  | 'CREATE_INTERVENTION'
  | 'UPDATE_INTERVENTION'
  | 'CREATE_OBSERVATION'
  | 'CREATE_RECOLTE'
  | 'SYNC'
  | 'LOGIN'
  | 'OTHER';

export type EntityType = 'UTILISATEUR' | 'PARCELLE' | 'CULTURE' | 'INTERVENTION' | 'OBSERVATION' | 'RECOLTE' | 'PHOTO';

export interface Action {
  id: string;
  userId: string;
  user?: { id: string; nom: string; prenom: string; email: string };
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
  user?: { id: string; nom: string; prenom: string; email: string };
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
