import { BaseProvider } from './base-provider';
import { 
  ProviderCapabilities, 
  PROVIDERS, 
  ProviderName, 
  RESOURCE_TYPES, 
  ResourceType 
} from '@/types';

export class TMDBProvider extends BaseProvider {
  public readonly name: ProviderName = PROVIDERS.TMDB;
  public readonly displayName = 'The Movie Database (TMDB)';
  public readonly description = 'Movie and TV show metadata enrichment provider (Architecture Stub).';
  public readonly supportedTypes: ResourceType[] = [RESOURCE_TYPES.MOVIE, RESOURCE_TYPES.TV];

  public readonly capabilities: ProviderCapabilities = {
    supportsSearch: true,
    supportsRefresh: true,
    supportsImages: true,
    supportsCredentials: true,
  };

  public isConfigured(): boolean {
    return false; // Architecture stub
  }
}
