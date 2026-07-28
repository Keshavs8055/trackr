/**
 * IndexedDB storage engine for encrypted provider credentials and client vault settings.
 */

export interface StoredCredentialRecord {
  id: string; // trackr_cred_${userId}_${provider}
  userId: string;
  provider: string;
  encryptedData: string;
  fingerprint: string;
  enabled: boolean;
  updatedAt: number;
  version: string;
  schemaVersion: number;
}

const DB_NAME = 'trackr_secure_vault';
const DB_VERSION = 1;
const STORE_CREDENTIALS = 'credentials';
const STORE_SYSTEM = 'system';

function getIDB(): IDBFactory | null {
  if (typeof window !== 'undefined' && window.indexedDB) {
    return window.indexedDB;
  }
  return null;
}

class SecureStorage {
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  private fallbackStore: Map<string, StoredCredentialRecord> = new Map();
  private fallbackSystemStore: Map<string, string> = new Map();

  private getDB(): Promise<IDBDatabase | null> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve) => {
      const idb = getIDB();
      if (!idb) {
        resolve(null);
        return;
      }

      const request = idb.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_CREDENTIALS)) {
          db.createObjectStore(STORE_CREDENTIALS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_SYSTEM)) {
          db.createObjectStore(STORE_SYSTEM, { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = (err) => {
        console.warn('Failed to open IndexedDB vault, falling back to memory/local:', err);
        resolve(null);
      };
    });

    return this.dbPromise;
  }

  public async setCredential(record: StoredCredentialRecord): Promise<void> {
    this.fallbackStore.set(record.id, record);
    const db = await this.getDB();
    if (!db) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(record.id, JSON.stringify(record));
      }
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CREDENTIALS, 'readwrite');
      const store = tx.objectStore(STORE_CREDENTIALS);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async getCredential(id: string): Promise<StoredCredentialRecord | null> {
    const db = await this.getDB();
    if (!db) {
      if (typeof window !== 'undefined') {
        const item = localStorage.getItem(id);
        if (!item) return this.fallbackStore.get(id) || null;
        try {
          return JSON.parse(item);
        } catch {
          return this.fallbackStore.get(id) || null;
        }
      }
      return this.fallbackStore.get(id) || null;
    }

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_CREDENTIALS, 'readonly');
      const store = tx.objectStore(STORE_CREDENTIALS);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || this.fallbackStore.get(id) || null);
      req.onerror = () => resolve(this.fallbackStore.get(id) || null);
    });
  }

  public async deleteCredential(id: string): Promise<void> {
    this.fallbackStore.delete(id);
    const db = await this.getDB();
    if (!db) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(id);
      }
      return;
    }

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_CREDENTIALS, 'readwrite');
      const store = tx.objectStore(STORE_CREDENTIALS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  }

  public async getSystemKey(key: string): Promise<string | null> {
    const db = await this.getDB();
    if (!db) {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(`trackr_sys_${key}`) || this.fallbackSystemStore.get(key) || null;
      }
      return this.fallbackSystemStore.get(key) || null;
    }

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SYSTEM, 'readonly');
      const store = tx.objectStore(STORE_SYSTEM);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : this.fallbackSystemStore.get(key) || null);
      req.onerror = () => resolve(this.fallbackSystemStore.get(key) || null);
    });
  }

  public async setSystemKey(key: string, value: string): Promise<void> {
    this.fallbackSystemStore.set(key, value);
    const db = await this.getDB();
    if (!db) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`trackr_sys_${key}`, value);
      }
      return;
    }

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SYSTEM, 'readwrite');
      const store = tx.objectStore(STORE_SYSTEM);
      const req = store.put({ key, value });
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  }

  public async clearAll(): Promise<void> {
    this.fallbackStore.clear();
    this.fallbackSystemStore.clear();
    const db = await this.getDB();
    if (db) {
      const tx = db.transaction([STORE_CREDENTIALS, STORE_SYSTEM], 'readwrite');
      tx.objectStore(STORE_CREDENTIALS).clear();
      tx.objectStore(STORE_SYSTEM).clear();
    }
  }
}

export const secureStorage = new SecureStorage();
