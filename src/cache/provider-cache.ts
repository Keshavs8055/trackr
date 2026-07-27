import { PaginatedSearchResults, SearchResult } from '@/types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class ProviderCache {
  private searchCache: Map<string, CacheEntry<PaginatedSearchResults>> = new Map();
  private metadataCache: Map<string, CacheEntry<Record<string, unknown>>> = new Map();
  private ttlMs: number;

  constructor(ttlMinutes: number = 15) {
    this.ttlMs = ttlMinutes * 60 * 1000;
  }

  public getSearch(provider: string, query: string, page: number = 1): PaginatedSearchResults | null {
    const key = `${provider}:${query.toLowerCase().trim()}:p${page}`;
    const entry = this.searchCache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.searchCache.delete(key);
      return null;
    }
    return entry.data;
  }

  public setSearch(provider: string, query: string, page: number, results: PaginatedSearchResults): void {
    const key = `${provider}:${query.toLowerCase().trim()}:p${page}`;
    this.searchCache.set(key, { data: results, timestamp: Date.now() });
  }

  public getMetadata(provider: string, providerId: string): Record<string, unknown> | null {
    const key = `${provider}:${providerId}`;
    const entry = this.metadataCache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.metadataCache.delete(key);
      return null;
    }
    return entry.data;
  }

  public setMetadata(provider: string, providerId: string, metadata: Record<string, unknown>): void {
    const key = `${provider}:${providerId}`;
    this.metadataCache.set(key, { data: metadata, timestamp: Date.now() });
  }

  public clear(): void {
    this.searchCache.clear();
    this.metadataCache.clear();
  }
}

export const providerCache = new ProviderCache(15);
