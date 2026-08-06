import { Resource } from '@/types';

const DB_NAME = 'trackr_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'resources_cache';

export class IndexedDBCache {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('IndexedDB is not available on server-side'));
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        resolve(db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Bulk cache an array of resources into IndexedDB
   */
  public async cacheResources(resources: Resource[]): Promise<void> {
    if (typeof window === 'undefined' || !resources || resources.length === 0) return;
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      for (const res of resources) {
        if (res && res.id) {
          store.put(res);
        }
      }

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('Failed to bulk cache resources in IndexedDB:', err);
    }
  }

  /**
   * Asynchronously fetch all cached resources from IndexedDB for cold-start hydration
   */
  public async getCachedResources(): Promise<Resource[]> {
    if (typeof window === 'undefined') return [];
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      return new Promise((resolve) => {
        request.onsuccess = () => {
          const result = request.result || [];
          resolve(result as Resource[]);
        };
        request.onerror = () => {
          resolve([]);
        };
      });
    } catch (err) {
      console.warn('Failed to retrieve cached resources from IndexedDB:', err);
      return [];
    }
  }

  /**
   * Cache or update a single resource
   */
  public async cacheResource(resource: Resource): Promise<void> {
    if (typeof window === 'undefined' || !resource || !resource.id) return;
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(resource);

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('Failed to cache resource in IndexedDB:', err);
    }
  }

  /**
   * Remove a resource by ID from IndexedDB
   */
  public async removeResource(id: string): Promise<void> {
    if (typeof window === 'undefined' || !id) return;
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('Failed to remove resource from IndexedDB:', err);
    }
  }

  /**
   * Clear all cached resources from IndexedDB
   */
  public async clearCache(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('Failed to clear IndexedDB resource cache:', err);
    }
  }
}

export const indexedDBCache = new IndexedDBCache();
