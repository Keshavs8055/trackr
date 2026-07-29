import { AICacheEntry } from '@/types';

class AICacheManager {
  private cache: Map<string, AICacheEntry> = new Map();
  private dbName = 'trackr_ai_cache_db';
  private storeName = 'ai_responses';
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      this.initDB();
    }
  }

  private initDB(): Promise<IDBDatabase | null> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve) => {
      try {
        const req = indexedDB.open(this.dbName, 1);
        req.onupgradeneeded = (e: any) => {
          const db = e.target.result as IDBDatabase;
          if (!db.objectStoreNames.contains(this.storeName)) {
            const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
            store.createIndex('targetId', 'targetId', { unique: false });
            store.createIndex('type', 'type', { unique: false });
          }
        };
        req.onsuccess = (e: any) => resolve(e.target.result as IDBDatabase);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
    return this.dbPromise;
  }

  /**
   * Retrieves cached response. Automatically invalidates if resource updatedAt timestamp has changed or entry is expired.
   */
  public async get<T>(key: string, currentTargetUpdatedAt?: number): Promise<T | null> {
    // 1. Check in-memory cache first
    let entry = this.cache.get(key);

    // 2. Fallback to IndexedDB
    if (!entry) {
      const db = await this.initDB();
      if (db) {
        entry = await new Promise<AICacheEntry | undefined>((resolve) => {
          try {
            const tx = db.transaction(this.storeName, 'readonly');
            const req = tx.objectStore(this.storeName).get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(undefined);
          } catch {
            resolve(undefined);
          }
        });
      }
    }

    if (!entry) return null;

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      await this.delete(key);
      return null;
    }

    // Check resource updated timestamp invalidation
    if (
      currentTargetUpdatedAt !== undefined &&
      entry.resourceUpdatedAtHash !== undefined &&
      entry.resourceUpdatedAtHash !== currentTargetUpdatedAt
    ) {
      await this.delete(key);
      return null;
    }

    // Touch memory cache
    this.cache.set(key, entry);
    return entry.data as T;
  }

  /**
   * Saves entry into AI cache (memory + IndexedDB vault).
   */
  public async set<T>(
    key: string,
    type: AICacheEntry['type'],
    data: T,
    options?: {
      targetId?: string;
      resourceUpdatedAtHash?: number;
      ttlMs?: number;
    }
  ): Promise<void> {
    const entry: AICacheEntry<T> = {
      id: `aicache_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      key,
      type,
      targetId: options?.targetId,
      data,
      resourceUpdatedAtHash: options?.resourceUpdatedAtHash,
      createdAt: Date.now(),
      expiresAt: options?.ttlMs ? Date.now() + options.ttlMs : undefined,
    };

    this.cache.set(key, entry as AICacheEntry);

    const db = await this.initDB();
    if (db) {
      try {
        const tx = db.transaction(this.storeName, 'readwrite');
        tx.objectStore(this.storeName).put(entry);
      } catch (err) {
        console.warn('Failed to save entry to IndexedDB AI cache:', err);
      }
    }
  }

  /**
   * Invalidates all cache entries linked to a specific resource ID.
   */
  public async invalidateTarget(targetId: string): Promise<void> {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.targetId === targetId) {
        this.cache.delete(key);
      }
    }

    const db = await this.initDB();
    if (db) {
      try {
        const tx = db.transaction(this.storeName, 'readwrite');
        const index = tx.objectStore(this.storeName).index('targetId');
        const req = index.getAllKeys(targetId);
        req.onsuccess = () => {
          const keys = req.result;
          const deleteTx = db.transaction(this.storeName, 'readwrite');
          const store = deleteTx.objectStore(this.storeName);
          keys.forEach((k) => store.delete(k));
        };
      } catch (err) {
        console.warn('Failed to invalidate target in IndexedDB AI cache:', err);
      }
    }
  }

  public async delete(key: string): Promise<void> {
    this.cache.delete(key);
    const db = await this.initDB();
    if (db) {
      try {
        const tx = db.transaction(this.storeName, 'readwrite');
        tx.objectStore(this.storeName).delete(key);
      } catch {}
    }
  }

  public async clearAll(): Promise<void> {
    this.cache.clear();
    const db = await this.initDB();
    if (db) {
      try {
        const tx = db.transaction(this.storeName, 'readwrite');
        tx.objectStore(this.storeName).clear();
      } catch {}
    }
  }
}

export const aiCache = new AICacheManager();
