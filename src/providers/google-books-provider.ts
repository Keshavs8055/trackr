import { BaseProvider } from './base-provider';
import { 
  ProviderCapabilities, 
  PROVIDERS, 
  ProviderName, 
  RESOURCE_TYPES, 
  ResourceType 
} from '@/types';

export class GoogleBooksProvider extends BaseProvider {
  public readonly name: ProviderName = PROVIDERS.GOOGLE_BOOKS;
  public readonly displayName = 'Google Books';
  public readonly description = 'Book metadata and author info provider (Architecture Stub).';
  public readonly supportedTypes: ResourceType[] = [RESOURCE_TYPES.BOOK];

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
