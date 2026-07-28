export const RESOURCE_TYPES = {
  MOVIE: 'movie',
  BOOK: 'book',
  TV: 'tv',
  ARTICLE: 'article',
  WEBSITE: 'website',
  COURSE: 'course',
  GITHUB: 'github',
  TOOL: 'tool',
  PODCAST: 'podcast',
  GAME: 'game',
  NOTE: 'note',
  CUSTOM: 'custom',
} as const;

export type ResourceType = typeof RESOURCE_TYPES[keyof typeof RESOURCE_TYPES];

export const RESERVED_TYPE_TAGS: Record<string, ResourceType> = {
  movie: 'movie',
  movies: 'movie',
  book: 'book',
  books: 'book',
  tv: 'tv',
  show: 'tv',
  shows: 'tv',
  article: 'article',
  articles: 'article',
  website: 'website',
  websites: 'website',
  link: 'website',
  links: 'website',
  url: 'website',
  course: 'course',
  courses: 'course',
  github: 'github',
  repo: 'github',
  repos: 'github',
  tool: 'tool',
  tools: 'tool',
  podcast: 'podcast',
  podcasts: 'podcast',
  game: 'game',
  games: 'game',
  note: 'note',
  notes: 'note',
};

export const PROVIDERS = {
  MANUAL: 'manual',
  OMDB: 'omdb',
  OPENLIBRARY: 'openlibrary',
  TMDB: 'tmdb',
  GOOGLE_BOOKS: 'google_books',
  GEMINI: 'gemini',
} as const;

export type ProviderName = typeof PROVIDERS[keyof typeof PROVIDERS];

export type ProviderStatus = 
  | 'CONNECTED'
  | 'NOT_CONFIGURED'
  | 'DISABLED'
  | 'INVALID_CREDENTIALS'
  | 'RATE_LIMITED'
  | 'UNAVAILABLE';

export interface ProviderCapabilities {
  supportsSearch: boolean;
  supportsRefresh: boolean;
  supportsImages: boolean;
  supportsCredentials: boolean;
  supportsAI?: boolean;
  canSearch?: boolean;
  canFetchMetadata?: boolean;
  canRefresh?: boolean;
  hasPosterImages?: boolean;
  requiresAuthKey?: boolean;
  rateLimitPerMin?: number;
}

export type ConnectionHealthStatus = 'HEALTHY' | 'DEGRADED' | 'COOLING_DOWN' | 'FAILED';

export interface ProviderHealth {
  provider: ProviderName | string;
  lastRequestTimestamp?: number;
  lastSuccessTimestamp?: number;
  lastErrorTimestamp?: number;
  lastErrorMessage?: string;
  consecutiveFailures: number;
  totalRequests: number;
  totalSuccesses: number;
  totalFailures: number;
  isCoolingDown: boolean;
  cooldownUntil?: number;
  connectionHealth: ConnectionHealthStatus;
  rateLimitQuota?: {
    remainingRequests?: number;
    resetTime?: number;
  };
}

export interface SearchResult {
  provider: ProviderName | string;
  providerId: string;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  type: ResourceType;
  year?: number;
  language?: string;
  metadataPreview?: Record<string, unknown>;
  providerMetadata?: ResourceProviderMetadata;
}

export interface PaginatedSearchResults {
  results: SearchResult[];
  page: number;
  pageSize: number;
  hasMore: boolean;
  totalResults?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  createdAt: number;
}

export interface CollectionRule {
  field: 'type' | 'tag' | 'status' | 'year' | 'provider';
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
  value: string | number;
}

export interface Collection {
  id: string;
  userId: string;
  title: string;
  description?: string;
  coverImage?: string;
  resourceIds: string[]; // Manual ordered list of resource IDs
  itemIds?: string[]; // Backward-compatibility alias for resourceIds
  isDynamic?: boolean; // Smart dynamic collection toggle
  rules?: CollectionRule[]; // Dynamic matching rules
  parentId?: string; // Nested collection parent ID
  icon?: string; // Optional Lucide icon name
  color?: string; // Optional accent color code/class
  itemOrder?: string[]; // Manual drag-and-drop item ordering override
  createdAt: number;
  updatedAt: number;
}

export interface ResourceProviderMetadata {
  provider: ProviderName | string;
  providerId?: string;
  metadata: Record<string, unknown>;
  version?: number;
  source?: {
    provider: string;
    version: string;
    schemaVersion: number;
  };
  lastSynced?: number;
  providerUpdatedAt?: number;
}

export interface Resource {
  id: string;
  userId: string;
  title: string;
  type: ResourceType;
  status?: string;
  searchIndex?: string;
  notes?: string;
  tags: string[]; // stored without #, lowercase, canonical
  image?: string;
  url?: string; // Direct link URL for website / link resources
  rawInput?: string; // Exact string typed by user during creation
  createdAt: number;
  updatedAt: number;

  // Enriched provider metadata
  providerMetadata?: ResourceProviderMetadata;

  // Backward-compatibility legacy accessors (optional / deprecated)
  /** @deprecated Use providerMetadata.provider instead */
  provider?: ProviderName | string;
  /** @deprecated Use providerMetadata.providerId instead */
  providerId?: string;
  /** @deprecated Use providerMetadata.metadata instead */
  metadata?: Record<string, unknown>;
  /** @deprecated Use providerMetadata.version instead */
  metadataVersion?: number;
  /** @deprecated Use providerMetadata.source instead */
  metadataSource?: {
    provider: string;
    version: string;
    schemaVersion: number;
  };
  /** @deprecated Use providerMetadata.lastSynced instead */
  lastSynced?: number;
  /** @deprecated Use providerMetadata.providerUpdatedAt instead */
  providerUpdatedAt?: number;
}

// Backward-compatibility alias for legacy code
export type Item = Resource;

export interface ProviderCredentials {
  provider: ProviderName;
  encryptedKey: string;
  createdAt?: number;
  updatedAt: number;
}

export interface ProviderCredentialStatus {
  provider: ProviderName;
  configured: boolean;
  enabled: boolean;
  status: ProviderStatus;
  lastValidated?: number;
  lastError?: string;
  fingerprint?: string;
  retryCooldown?: number;
  connectionHealth?: ConnectionHealthStatus;
  rateLimitQuota?: {
    remainingRequests?: number;
    resetTime?: number;
  };
}

export interface Integration {
  id: string;
  provider: ProviderName;
  name: string;
  enabled: boolean;
  configured: boolean;
  status: ProviderStatus;
  capabilities: ProviderCapabilities;
  supportedTypes: ResourceType[];
  description: string;
  icon?: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: 'connect' | 'disconnect' | 'enable' | 'disable' | 'credential_update' | 'metadata_refresh' | 'revalidate_failed';
  provider: ProviderName | string;
  details?: Record<string, unknown>;
  timestamp: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errorCode?: string;
  details?: Record<string, unknown>;
}

export type ActivityAction = 
  | 'created' 
  | 'status_changed' 
  | 'note_added' 
  | 'metadata_refreshed' 
  | 'relationship_added'
  | 'deleted';

export interface ResourceActivity {
  id: string;
  userId: string;
  resourceId: string;
  resourceTitle?: string;
  action: ActivityAction;
  payload?: Record<string, unknown>;
  timestamp: number;
}

export interface ResourceNote {
  id: string;
  resourceId: string;
  userId: string;
  title: string;
  content: string;
  format: 'markdown';
  wikiLinks?: string[]; // Extracted [[Resource Title]] links
  createdAt: number;
  updatedAt: number;
}

export type RelationshipType = 
  | 'adaptation_of' 
  | 'sequel_to' 
  | 'prequel_to' 
  | 'repository_for' 
  | 'article_for' 
  | 'author_of' 
  | 'related_to';

export interface ResourceRelationship {
  id: string;
  userId: string;
  sourceResourceId: string;
  targetResourceId: string;
  type: RelationshipType;
  notes?: string;
  createdAt: number;
}
