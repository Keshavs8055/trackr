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

  constructor(apiKey: string | null = null) {
    super({ rateLimitPerMin: 60, maxRetries: 3 });
    this.apiKey = apiKey;
  }

  public isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }

  public setApiKey(key: string | null): void {
    this.apiKey = key;
  }

  public async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    const key = credentials.apiKey || credentials.key;
    if (!key || key.trim() === '') return false;

    try {
      // Validate by querying OMDb with a standard title
      const res = await fetch(`https://www.omdbapi.com/?apikey=${encodeURIComponent(key)}&t=Inception`);
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

  public async searchNormalized(queryStr: string, page: number = 1): Promise<PaginatedSearchResults> {
    if (!this.isConfigured()) {
      throw AppError.unconfiguredProvider(this.displayName);
    }
    if (!queryStr.trim()) {
      return { results: [], page: 1, pageSize: 10, hasMore: false, totalResults: 0 };
    }

    return this.executeWithRetry(async () => {
      const url = `https://www.omdbapi.com/?apikey=${encodeURIComponent(this.apiKey!)}&s=${encodeURIComponent(queryStr.trim())}&page=${page}`;
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
        const metaPreview = {
          imdbID: item.imdbID,
          year: item.Year,
          type: item.Type,
        };

        return {
          provider: this.name,
          providerId: item.imdbID,
          title: item.Title,
          subtitle: `${item.Type ? item.Type.toUpperCase() : 'MOVIE'} • ${item.Year || 'N/A'}`,
          description: `Type: ${item.Type || 'movie'}`,
          image: item.Poster && item.Poster !== 'N/A' ? item.Poster : undefined,
          type: item.Type === 'series' ? RESOURCE_TYPES.TV : RESOURCE_TYPES.MOVIE,
          year: parseInt(item.Year, 10) || undefined,
          metadataPreview: metaPreview,
          providerMetadata: {
            provider: this.name,
            providerId: item.imdbID,
            metadata: metaPreview,
            version: 1,
          },
        };
      });

      const hasMore = page * 10 < total;
      return {
        results,
        page,
        pageSize: 10,
        hasMore,
        totalResults: total,
      };
    });
  }

  public async getDetailsNormalized(providerId: string): Promise<{
    title: string;
    image?: string;
    metadata: Record<string, unknown>;
  }> {
    if (!this.isConfigured()) {
      throw AppError.unconfiguredProvider(this.displayName);
    }

    return this.executeWithRetry(async () => {
      const url = `https://www.omdbapi.com/?apikey=${encodeURIComponent(this.apiKey!)}&i=${encodeURIComponent(providerId)}&plot=full`;
      const res = await fetch(url);
      if (!res.ok) throw AppError.networkError(this.displayName);

      const data = await res.json();
      if (data.Response === 'False') {
        throw AppError.notFound(`Movie (${providerId})`);
      }

      // Map strictly useful movie metadata
      const metadata: Record<string, unknown> = {
        title: data.Title,
        year: parseInt(data.Year, 10) || data.Year,
        rated: data.Rated !== 'N/A' ? data.Rated : undefined,
        released: data.Released !== 'N/A' ? data.Released : undefined,
        runtime: data.Runtime !== 'N/A' ? data.Runtime : undefined,
        genre: data.Genre !== 'N/A' ? data.Genre : undefined,
        director: data.Director !== 'N/A' ? data.Director : undefined,
        actors: data.Actors !== 'N/A' ? data.Actors : undefined,
        overview: data.Plot !== 'N/A' ? data.Plot : undefined,
        language: data.Language !== 'N/A' ? data.Language : undefined,
        poster: data.Poster !== 'N/A' ? data.Poster : undefined,
        imdbRating: data.imdbRating !== 'N/A' ? data.imdbRating : undefined,
        imdbID: data.imdbID,
      };

      return {
        title: data.Title,
        image: data.Poster !== 'N/A' ? data.Poster : undefined,
        metadata,
      };
    });
  }
}
