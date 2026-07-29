import { providerManager } from './provider-manager';
import { providerCache } from '@/cache/provider-cache';
import { credentialService } from './credential-service';
import { PaginatedSearchResults, ResourceType } from '@/types';
import { AppError } from '@/lib/app-error';

export class SearchService {
  /**
   * Performs a single-provider search auto-routed by resource type, utilizing session caching.
   */
  public async search(
    userId: string,
    type: ResourceType, 
    query: string, 
    page: number = 1
  ): Promise<{ results: PaginatedSearchResults; providerName: string }> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return {
        providerName: 'manual',
        results: { results: [], page: 1, pageSize: 10, hasMore: false, totalResults: 0 },
      };
    }

    const provider = providerManager.getPrimaryProviderForType(type);
    if (!provider) {
      // Return empty results gracefully if no provider configured
      return {
        providerName: 'manual',
        results: { results: [], page: 1, pageSize: 10, hasMore: false, totalResults: 0 },
      };
    }

    // Check shared session cache
    const cached = providerCache.getSearch(provider.name, trimmedQuery, page);
    if (cached) {
      return { providerName: provider.name, results: cached };
    }

    // Get the key if provider requires credentials
    let apiKey: string | null = null;
    if (provider.capabilities.supportsCredentials) {
      apiKey = await credentialService.getCredential(userId, provider.name);
      if (!apiKey) {
        throw AppError.unconfiguredProvider(provider.displayName);
      }
    }

    try {
      const results = await provider.searchNormalized(trimmedQuery, page, apiKey || undefined);
      providerCache.setSearch(provider.name, trimmedQuery, page, results);
      return { providerName: provider.name, results };
    } catch (err) {
      throw AppError.fromError(err);
    }
  }
}

export const searchService = new SearchService();
