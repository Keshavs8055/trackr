import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  deleteField,
  writeBatch,
  getDoc,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { PROVIDERS, Resource, ResourceProviderMetadata, RESOURCE_TYPES, ResourceType } from '@/types';
import { AppError } from '@/lib/app-error';
import { ResourceFactory } from '@/domain/resource/resource-factory';
import { SearchIndexBuilder } from '@/domain/search/search-index-builder';
import { EventBus } from '@/domain/events/event-bus';
import { extractStatusFromTags } from '@/lib/parser';
import { getDefaultStatusForType } from '@/domain/status/status-lifecycles';
import { providerManager } from '@/services/providers/provider-manager';
import { searchService } from '@/services/providers/search-service';
import { metadataService } from '@/services/providers/metadata-service';

export interface PaginatedResourcesResult {
  resources: Resource[];
  lastDocSnapshot: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

const DEFAULT_MOCK_RESOURCES: Resource[] = [
  {
    id: "mock-resource-1",
    userId: "mock-user-id",
    title: "Interstellar",
    type: RESOURCE_TYPES.MOVIE,
    providerMetadata: {
      provider: PROVIDERS.MANUAL,
      metadata: {},
      version: 1,
    },
    provider: PROVIDERS.MANUAL,
    tags: ["movie", "fav"],
    rawInput: "Interstellar #movie #fav",
    notes: "A beautiful sci-fi exploration of time and love.",
    metadata: {},
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: "mock-resource-2",
    userId: "mock-user-id",
    title: "Dune: Part Two",
    type: RESOURCE_TYPES.MOVIE,
    providerMetadata: {
      provider: PROVIDERS.MANUAL,
      metadata: {},
      version: 1,
    },
    provider: PROVIDERS.MANUAL,
    tags: ["movie", "scifi"],
    rawInput: "Dune: Part Two #movie #scifi",
    notes: "Visually stunning continuation of the desert saga.",
    metadata: {},
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
  },
  {
    id: "mock-resource-3",
    userId: "mock-user-id",
    title: "Atomic Habits by James Clear",
    type: RESOURCE_TYPES.BOOK,
    providerMetadata: {
      provider: PROVIDERS.MANUAL,
      metadata: {},
      version: 1,
    },
    provider: PROVIDERS.MANUAL,
    tags: ["book", "productivity"],
    rawInput: "Atomic Habits by James Clear #book #productivity",
    notes: "An easy way to build good habits and break bad ones.",
    metadata: {},
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
  },
  {
    id: "mock-resource-4",
    userId: "mock-user-id",
    title: "Kyoto Tempura Spots",
    type: RESOURCE_TYPES.NOTE,
    providerMetadata: {
      provider: PROVIDERS.MANUAL,
      metadata: {},
      version: 1,
    },
    provider: PROVIDERS.MANUAL,
    tags: ["travel", "food"],
    rawInput: "Kyoto Tempura Spots #travel #food",
    notes: "Amazing tempura in Gion district.",
    metadata: {},
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
  },
  {
    id: "mock-resource-5",
    userId: "mock-user-id",
    title: "Inception",
    type: RESOURCE_TYPES.MOVIE,
    providerMetadata: {
      provider: PROVIDERS.MANUAL,
      metadata: {},
      version: 1,
    },
    provider: PROVIDERS.MANUAL,
    tags: ["movies", "fav"],
    rawInput: "Inception #movies #fav",
    notes: "Mind-bending dream heist movie.",
    metadata: {},
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
  }
];

export class ResourceService {
  /**
   * Fetches resources for a user.
   * Performs a one-time lazy migration from legacy 'items' subcollection if resources is empty.
   */
  public async getResources(userId: string): Promise<Resource[]> {
    if (!userId) return [];

    // 1. Mock user support
    if (userId === 'mock-user-id') {
      return this.getMockResources();
    }

    try {
      const resourcesRef = collection(db, 'users', userId, 'resources');
      const q = query(resourcesRef);
      const snapshot = await getDocs(q);

      let resources = snapshot.docs.map(doc => this.normalizeResource(doc.id, userId, doc.data()));

      // 2. One-time lazy migration check if resources subcollection is empty
      const migrationKey = `trackr_migrated_resources_${userId}`;
      const isAlreadyMigrated = typeof window !== 'undefined' && localStorage.getItem(migrationKey) === 'true';

      if (resources.length === 0 && !isAlreadyMigrated) {
        resources = await this.migrateLegacyItems(userId);
      }

      resources.sort((a, b) => b.createdAt - a.createdAt);
      return resources;
    } catch (err) {
      console.error("Error fetching resources:", err);
      throw AppError.fromError(err);
    }
  }

  /**
   * Fetches resources for a user in paginated batches.
   */
  public async getResourcesPaginated(
    userId: string,
    pageSize: number = 15,
    lastDocSnapshot: QueryDocumentSnapshot<DocumentData> | null = null
  ): Promise<PaginatedResourcesResult> {
    if (!userId) {
      return { resources: [], lastDocSnapshot: null, hasMore: false };
    }

    // Mock user pagination support
    if (userId === 'mock-user-id') {
      const allMock = this.getMockResources();
      allMock.sort((a, b) => b.createdAt - a.createdAt);
      
      const startIndex = lastDocSnapshot ? (lastDocSnapshot as any)._offsetIndex || 0 : 0;
      const sliced = allMock.slice(startIndex, startIndex + pageSize);
      const nextIndex = startIndex + sliced.length;
      const hasMore = nextIndex < allMock.length;
      
      const dummySnapshot = hasMore ? ({ _offsetIndex: nextIndex } as any) : null;
      return {
        resources: sliced,
        lastDocSnapshot: dummySnapshot,
        hasMore,
      };
    }

    try {
      const resourcesRef = collection(db, 'users', userId, 'resources');
      const constraints: any[] = [orderBy('createdAt', 'desc'), limit(pageSize)];
      
      if (lastDocSnapshot) {
        constraints.push(startAfter(lastDocSnapshot));
      }

      const q = query(resourcesRef, ...constraints);
      const snapshot = await getDocs(q);

      const docs = snapshot.docs;
      let resources = docs.map(d => this.normalizeResource(d.id, userId, d.data()));

      // Lazy migration check if initial query returns empty
      if (resources.length === 0 && !lastDocSnapshot) {
        const migrationKey = `trackr_migrated_resources_${userId}`;
        const isAlreadyMigrated = typeof window !== 'undefined' && localStorage.getItem(migrationKey) === 'true';
        if (!isAlreadyMigrated) {
          const migrated = await this.migrateLegacyItems(userId);
          migrated.sort((a, b) => b.createdAt - a.createdAt);
          const sliced = migrated.slice(0, pageSize);
          return {
            resources: sliced,
            lastDocSnapshot: null,
            hasMore: migrated.length > pageSize,
          };
        }
      }

      const lastDoc = docs.length > 0 ? docs[docs.length - 1] : null;
      const hasMore = docs.length === pageSize;

      return {
        resources,
        lastDocSnapshot: lastDoc,
        hasMore,
      };
    } catch (err) {
      console.error("Error fetching paginated resources:", err);
      throw AppError.fromError(err);
    }
  }

  public async addResource(
    userId: string, 
    resourceInput: Omit<Resource, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
  ): Promise<Resource> {
    if (!userId) throw AppError.authRequired();

    const now = Date.now();
    const providerName = resourceInput.providerMetadata?.provider || resourceInput.provider || PROVIDERS.MANUAL;
    const providerId = resourceInput.providerMetadata?.providerId || resourceInput.providerId;
    const metadata = resourceInput.providerMetadata?.metadata || resourceInput.metadata || {};

    const providerMetadata: ResourceProviderMetadata = resourceInput.providerMetadata || {
      provider: providerName,
      providerId,
      metadata,
      version: resourceInput.metadataVersion || 1,
      source: resourceInput.metadataSource,
      lastSynced: resourceInput.lastSynced,
      providerUpdatedAt: resourceInput.providerUpdatedAt,
    };

    const resType = resourceInput.type || RESOURCE_TYPES.NOTE;
    const derivedStatus = extractStatusFromTags(resourceInput.tags || [], resType);
    const finalStatus = resourceInput.status || derivedStatus || getDefaultStatusForType(resType);

    const newResourceData: Omit<Resource, 'id'> = {
      ...resourceInput,
      userId,
      type: resType,
      status: finalStatus,
      createdAt: now,
      updatedAt: now,
      providerMetadata,
      // Legacy fields for Firestore & backward compatibility
      provider: providerName,
      providerId,
      metadata,
      metadataVersion: providerMetadata.version,
      metadataSource: providerMetadata.source,
      lastSynced: providerMetadata.lastSynced,
      providerUpdatedAt: providerMetadata.providerUpdatedAt,
    };

    const searchIndex = SearchIndexBuilder.buildSearchIndex(newResourceData);

    const finalResourceData: Omit<Resource, 'id'> = {
      ...newResourceData,
      searchIndex,
    };

    if (!finalResourceData.notes || finalResourceData.notes.trim() === '') {
      delete finalResourceData.notes;
    }

    // Mock User flow
    if (userId === 'mock-user-id') {
      const current = this.getMockResources();
      const newResource: Resource = {
        id: `mock-resource-${now}`,
        ...finalResourceData,
      };
      current.unshift(newResource);
      localStorage.setItem('mock-resources', JSON.stringify(current));
      EventBus.getInstance().publish('ResourceCreated', { resourceId: newResource.id, userId, resource: newResource });
      
      this.triggerBackgroundEnrichment(
        userId,
        newResource.id,
        newResource.type,
        newResource.title,
        newResource.provider,
        newResource.image,
        newResource.tags
      );

      return newResource;
    }

    // Recursively strip undefined values to ensure Firestore compatibility
    const cleanFirestoreData = (obj: any): any => {
      if (obj === null || typeof obj !== 'object') return obj;
      if ('_methodName' in obj || obj.constructor?.name === 'FieldValue') return obj;
      if (Array.isArray(obj)) return obj.map(cleanFirestoreData);
      const cleaned: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = cleanFirestoreData(value);
        }
      }
      return cleaned;
    };

    const finalPayload = cleanFirestoreData(newResourceData);

    try {
      const docRef = await addDoc(collection(db, 'users', userId, 'resources'), finalPayload);
      
      this.triggerBackgroundEnrichment(
        userId,
        docRef.id,
        newResourceData.type,
        newResourceData.title,
        newResourceData.provider,
        newResourceData.image,
        newResourceData.tags
      );

      return {
        id: docRef.id,
        ...newResourceData,
      };
    } catch (err) {
      console.error("Error adding resource:", err);
      throw AppError.fromError(err);
    }
  }

  public async updateResource(
    userId: string,
    id: string,
    update: Partial<Resource>
  ): Promise<void> {
    if (!userId) throw AppError.authRequired();

    const cleanUpdate: Record<string, unknown> = { ...update, updatedAt: Date.now() };

    if (update.tags && !update.status) {
      const derivedStatus = extractStatusFromTags(update.tags, update.type);
      if (derivedStatus) {
        cleanUpdate.status = derivedStatus;
      }
    }

    // Sync providerMetadata if legacy metadata or provider is passed
    if (cleanUpdate.providerMetadata) {
      const pMeta = cleanUpdate.providerMetadata as ResourceProviderMetadata;
      cleanUpdate.provider = pMeta.provider;
      cleanUpdate.providerId = pMeta.providerId;
      cleanUpdate.metadata = pMeta.metadata;
      cleanUpdate.metadataVersion = pMeta.version;
      cleanUpdate.metadataSource = pMeta.source;
      cleanUpdate.lastSynced = pMeta.lastSynced;
      cleanUpdate.providerUpdatedAt = pMeta.providerUpdatedAt;
    } else if (cleanUpdate.metadata || cleanUpdate.provider) {
      cleanUpdate.providerMetadata = {
        provider: (cleanUpdate.provider as string) || PROVIDERS.MANUAL,
        providerId: cleanUpdate.providerId as string | undefined,
        metadata: (cleanUpdate.metadata as Record<string, unknown>) || {},
        version: cleanUpdate.metadataVersion as number | undefined,
        source: cleanUpdate.metadataSource as any,
        lastSynced: cleanUpdate.lastSynced as number | undefined,
        providerUpdatedAt: cleanUpdate.providerUpdatedAt as number | undefined,
      };
    }

    const hasNotesProp = 'notes' in cleanUpdate;
    const isNotesEmpty = hasNotesProp && (!cleanUpdate.notes || (cleanUpdate.notes as string).trim() === '');

    if (isNotesEmpty) {
      if (userId === 'mock-user-id') {
        delete cleanUpdate.notes;
      } else {
        cleanUpdate.notes = deleteField();
      }
    }

    if (userId === 'mock-user-id') {
      const current = this.getMockResources();
      let updatedResource: Resource | undefined;
      const updated = current.map(item => {
        if (item.id === id) {
          const newItem = { ...item, ...cleanUpdate } as Resource;
          if (isNotesEmpty) delete newItem.notes;
          updatedResource = newItem;
          return newItem;
        }
        return item;
      });
      localStorage.setItem('mock-resources', JSON.stringify(updated));

      if (updatedResource) {
        this.triggerBackgroundEnrichment(
          userId,
          id,
          updatedResource.type,
          updatedResource.title,
          updatedResource.provider,
          updatedResource.image,
          updatedResource.tags
        );
      }
      return;
    }

    const cleanFirestoreData = (obj: any): any => {
      if (obj === null || typeof obj !== 'object') return obj;
      if ('_methodName' in obj || obj.constructor?.name === 'FieldValue') return obj;
      if (Array.isArray(obj)) return obj.map(cleanFirestoreData);
      const cleaned: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = cleanFirestoreData(value);
        }
      }
      return cleaned;
    };

    const finalUpdatePayload = cleanFirestoreData(cleanUpdate);

    try {
      const docRef = doc(db, 'users', userId, 'resources', id);
      await updateDoc(docRef, finalUpdatePayload);

      const currentResource = await this.getResourceById(userId, id);
      if (currentResource) {
        this.triggerBackgroundEnrichment(
          userId,
          id,
          currentResource.type,
          currentResource.title,
          currentResource.provider,
          currentResource.image,
          currentResource.tags
        );
      }
    } catch (err) {
      console.error("Error updating resource:", err);
      throw AppError.fromError(err);
    }
  }

  public async deleteResource(userId: string, id: string): Promise<void> {
    if (!userId) throw AppError.authRequired();

    if (userId === 'mock-user-id') {
      const current = this.getMockResources();
      const filtered = current.filter(r => r.id !== id);
      localStorage.setItem('mock-resources', JSON.stringify(filtered));
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', userId, 'resources', id));
    } catch (err) {
      console.error("Error deleting resource:", err);
      throw AppError.fromError(err);
    }
  }

  /**
   * Normalizes raw Firestore object to Resource
   */
  private normalizeResource(id: string, userId: string, data: any): Resource {
    const rawProviderMeta = data.providerMetadata;
    const provider = rawProviderMeta?.provider || data.provider || PROVIDERS.MANUAL;
    const providerId = rawProviderMeta?.providerId || data.providerId || undefined;
    const metadata = rawProviderMeta?.metadata || (data.metadata && typeof data.metadata === 'object' ? data.metadata : {});
    const metadataVersion = rawProviderMeta?.version || data.metadataVersion || undefined;
    const metadataSource = rawProviderMeta?.source || data.metadataSource || undefined;
    const lastSynced = rawProviderMeta?.lastSynced || data.lastSynced || undefined;
    const providerUpdatedAt = rawProviderMeta?.providerUpdatedAt || data.providerUpdatedAt || undefined;

    const providerMetadata: ResourceProviderMetadata = {
      provider,
      providerId,
      metadata,
      version: metadataVersion,
      source: metadataSource,
      lastSynced,
      providerUpdatedAt,
    };

    return {
      id,
      userId,
      title: typeof data.title === 'string' ? data.title : 'Untitled Resource',
      type: typeof data.type === 'string' ? (data.type as ResourceType) : RESOURCE_TYPES.NOTE,
      status: typeof data.status === 'string' ? data.status : undefined,
      notes: typeof data.notes === 'string' ? data.notes : undefined,
      tags: Array.isArray(data.tags) ? data.tags.filter((t: any) => typeof t === 'string') : [],
      image: typeof data.image === 'string' ? data.image : undefined,
      rawInput: typeof data.rawInput === 'string' ? data.rawInput : undefined,
      createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
      updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
      providerMetadata,
      // Legacy top-level accessors for backward compatibility
      provider,
      providerId: typeof providerId === 'string' ? providerId : undefined,
      metadata: typeof metadata === 'object' && metadata !== null ? metadata : {},
      metadataVersion,
      metadataSource,
      lastSynced,
      providerUpdatedAt,
    };
  }

  /**
   * One-time migration of legacy Firestore 'items' subcollection to 'resources'
   */
  private async migrateLegacyItems(userId: string): Promise<Resource[]> {
    const migrationKey = `trackr_migrated_resources_${userId}`;
    try {
      const legacyItemsRef = collection(db, 'users', userId, 'items');
      const legacySnapshot = await getDocs(query(legacyItemsRef));

      if (legacySnapshot.empty) {
        if (typeof window !== 'undefined') localStorage.setItem(migrationKey, 'true');
        return [];
      }

      const batch = writeBatch(db);
      const migratedResources: Resource[] = [];

      legacySnapshot.docs.forEach((legacyDoc) => {
        const data = legacyDoc.data();
        const resourceRef = doc(db, 'users', userId, 'resources', legacyDoc.id);
        
        const resourceData = {
          title: data.title || 'Untitled Resource',
          type: data.type || RESOURCE_TYPES.NOTE,
          provider: data.provider || PROVIDERS.MANUAL,
          providerId: data.providerId || null,
          status: data.status || null,
          notes: data.notes || null,
          tags: Array.isArray(data.tags) ? data.tags : [],
          metadata: data.metadata || {},
          image: data.image || null,
          rawInput: data.rawInput || null,
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
          userId,
        };

        batch.set(resourceRef, resourceData);
        migratedResources.push(this.normalizeResource(legacyDoc.id, userId, resourceData));
      });

      await batch.commit();
      if (typeof window !== 'undefined') localStorage.setItem(migrationKey, 'true');
      return migratedResources;
    } catch (e) {
      console.warn("Legacy items migration failed or skipped:", e);
      return [];
    }
  }

  /**
   * Handles local storage for mock user with legacy key migration
   */
  private getMockResources(): Resource[] {
    if (typeof window === 'undefined') return DEFAULT_MOCK_RESOURCES;

    const storedResources = localStorage.getItem('mock-resources');
    if (storedResources) {
      try {
        return JSON.parse(storedResources);
      } catch {
        // Fallback if parse fails
      }
    }

    // Check legacy mock items
    const storedItems = localStorage.getItem('mock-items');
    if (storedItems) {
      try {
        const items = JSON.parse(storedItems);
        const migrated: Resource[] = items.map((item: any) => ({
          ...item,
          type: item.type || RESOURCE_TYPES.NOTE,
          provider: item.provider || PROVIDERS.MANUAL,
          metadata: item.metadata || {},
        }));
        localStorage.setItem('mock-resources', JSON.stringify(migrated));
        return migrated;
      } catch {
        // Fallback
      }
    }

    localStorage.setItem('mock-resources', JSON.stringify(DEFAULT_MOCK_RESOURCES));
    return DEFAULT_MOCK_RESOURCES;
  }

  public async getResourceById(userId: string, id: string): Promise<Resource | null> {
    if (userId === 'mock-user-id') {
      const resources = this.getMockResources();
      return resources.find(r => r.id === id) || null;
    }
    
    try {
      const docRef = doc(db, 'users', userId, 'resources', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return this.normalizeResource(id, userId, snap.data());
    } catch (err) {
      console.error("Error getting resource by ID:", err);
      return null;
    }
  }

  private triggerBackgroundEnrichment(
    userId: string,
    id: string,
    type: ResourceType,
    title: string,
    currentProvider?: string,
    image?: string,
    tags?: string[]
  ): void {
    const provider = providerManager.getPrimaryProviderForType(type);
    if (!provider) return;

    const needsEnrichment = !currentProvider || currentProvider === 'manual';
    if (!needsEnrichment) return;

    (async () => {
      try {
        const searchResult = await searchService.search(userId, type, title, 1);
        const firstResult = searchResult.results.results?.[0];

        if (firstResult) {
          const enriched = await metadataService.fetchMetadataForCreation(
            userId,
            firstResult.provider,
            firstResult.providerId
          );

          EventBus.getInstance().publish('MetadataMatchFound', {
            resourceId: id,
            resourceTitle: title,
            type,
            provider: firstResult.provider,
            providerId: firstResult.providerId,
            image: enriched.image || firstResult.image || image,
            metadata: enriched.metadata || {},
            providerMetadata: enriched.providerMetadata,
            tags,
          });
        }
      } catch (err) {
        console.error("Background metadata enrichment failed:", err);
      }
    })();
  }
}

export const resourceService = new ResourceService();
