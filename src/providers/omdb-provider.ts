import { BaseProvider } from './base-provider';
import { 
  PaginatedSearchResults, 
  ProviderCapabilities, 
  PROVIDERS, 
  ProviderName, 
  RESOURCE_TYPES, 
  ResourceType, 
  SearchResult 
} from '@/types';
import { AppError } from '@/lib/app-error';

export class OMDbProvider extends BaseProvider {
  public readonly name: ProviderName = PROVIDERS.OMDB;
  public readonly displayName = 'OMDb API';
  public readonly description = 'Movie & TV show metadata provider. Requires an OMDb API key.';
  public readonly supportedTypes: ResourceType[] = [RESOURCE_TYPES.MOVIE, RESOURCE_TYPES.TV];

  public readonly capabilities: ProviderCapabilities = {
    supportsSearch: true,
    supportsRefresh: true,
    supportsImages: true,
    supportsCredentials: true,
  };

  private apiKey: string | null = null;

  constructor() {
    super({ rateLimitPerMin: 60, maxRetries: 3 });
  }

  public override setApiKey(key: string | null): void {
    this.apiKey = key;
    this.setConfigured(!!key);
  }

  public override getApiKey(): string | null {
    return this.apiKey;
  }

  public override async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    const key = credentials.apiKey || credentials.key;
    if (!key || key.trim() === '') return false;

    try {
      const res = await fetch(`https://www.omdbapi.com/?apikey=${encodeURIComponent(key.trim())}&t=Inception`);
      if (!res.ok) return false;
      const data = await res.json();
      if (data.Response === 'False' && data.Error === 'Invalid API key!') {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }


  public async searchNormalizedWithKey(queryStr: string, apiKey: string, page: number = 1): Promise<PaginatedSearchResults> {
    if (!apiKey || apiKey.trim() === '') {
      throw AppError.unconfiguredProvider(this.displayName);
    }
    if (!queryStr.trim()) {
      return { results: [], page: 1, pageSize: 10, hasMore: false, totalResults: 0 };
    }

    return this.executeWithRetry(async () => {
      const url = `https://www.omdbapi.com/?apikey=${encodeURIComponent(apiKey.trim())}&s=${encodeURIComponent(queryStr.trim())}&page=${page}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw AppError.networkError(this.displayName);
      }

      const data = await res.json();
      if (data.Response === 'False') {
        if (data.Error === 'Invalid API key!') {
          throw AppError.invalidApiKey(this.displayName);
        }
        if (data.Error === 'Movie not found!') {
          return { results: [], page: 1, pageSize: 10, hasMore: false, totalResults: 0 };
        }
        throw AppError.validationFailed(data.Error || 'Search failed');
      }

      const total = parseInt(data.totalResults || '0', 10);
      const results: SearchResult[] = (data.Search || []).map((item: any) => {
        return {
          provider: this.name,
          providerId: item.imdbID,
          title: item.Title,
          subtitle: `${item.Type ? item.Type.toUpperCase() : 'MOVIE'} • ${item.Year || 'N/A'}`,
          description: `Type: ${item.Type || 'movie'}`,
          image: item.Poster && item.Poster !== 'N/A' ? item.Poster : undefined,
          type: item.Type === 'series' ? RESOURCE_TYPES.TV : RESOURCE_TYPES.MOVIE,
          year: item.Year ? parseInt(item.Year, 10) : undefined,
          metadataPreview: {
            imdbID: item.imdbID,
            year: item.Year,
            type: item.Type,
          },
          providerMetadata: {
            provider: this.name,
            providerId: item.imdbID,
            lastSynced: Date.now(),
            version: 'v1',
            schemaVersion: 1,
            metadata: {
              imdbID: item.imdbID,
              poster: item.Poster !== 'N/A' ? item.Poster : null,
              year: item.Year,
              type: item.Type,
            },
          },
        };
      });

      return {
        results,
        page,
        pageSize: 10,
        hasMore: page * 10 < total,
        totalResults: total,
      };
    });
  }

  public override async searchNormalized(queryStr: string, page: number = 1, apiKey?: string): Promise<PaginatedSearchResults> {
    const key = apiKey || this.getApiKey();
    if (!key) {
      throw AppError.unconfiguredProvider(this.displayName);
    }
    return this.searchNormalizedWithKey(queryStr, key, page);
  }

  public override async getDetailsNormalized(providerId: string, apiKey?: string): Promise<{
    title: string;
    image?: string;
    metadata: Record<string, unknown>;
  }> {
    const key = apiKey || this.getApiKey();
    if (!key) {
      throw AppError.unconfiguredProvider(this.displayName);
    }

    return this.executeWithRetry(async () => {
      const url = `https://www.omdbapi.com/?apikey=${encodeURIComponent(key.trim())}&i=${encodeURIComponent(providerId)}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw AppError.networkError(this.displayName);
      }

      const data = await res.json();
      if (data.Response === 'False') {
        if (data.Error === 'Invalid API key!') {
          throw AppError.invalidApiKey(this.displayName);
        }
        throw AppError.notFound(`Movie (${providerId})`);
      }

      return {
        title: data.Title || 'Untitled Movie',
        image: data.Poster && data.Poster !== 'N/A' ? data.Poster : undefined,
        metadata: data,
      };
    });
  }
}

