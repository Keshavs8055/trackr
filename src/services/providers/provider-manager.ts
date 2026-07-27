import { BaseProvider } from '@/providers/base-provider';
import { ManualProvider } from '@/providers/manual-provider';
import { OMDbProvider } from '@/providers/omdb-provider';
import { OpenLibraryProvider } from '@/providers/openlibrary-provider';
import { TMDBProvider } from '@/providers/tmdb-provider';
import { GoogleBooksProvider } from '@/providers/google-books-provider';
import { 
  Integration, 
  ProviderCredentialStatus, 
  ProviderName, 
  ProviderStatus, 
  ResourceType, 
  RESOURCE_TYPES 
} from '@/types';
import { AppError } from '@/lib/app-error';

export class ProviderManager {
  private providers: Map<string, BaseProvider> = new Map();
  private credentialStatuses: Map<string, ProviderCredentialStatus> = new Map();

  constructor() {
    this.registerProvider(new ManualProvider());
    this.registerProvider(new OMDbProvider());
    this.registerProvider(new OpenLibraryProvider());
    this.registerProvider(new TMDBProvider());
    this.registerProvider(new GoogleBooksProvider());

    this.initializeDefaultStatuses();
  }

  public registerProvider(provider: BaseProvider): void {
    this.providers.set(provider.name, provider);
  }

  public getProvider(name: string): BaseProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw AppError.notFound(`Provider "${name}"`);
    }
    return provider;
  }

  public getAllProviders(): BaseProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Single-Provider Routing: Resolves the primary enabled provider for a given resource type.
   */
  public getPrimaryProviderForType(type: ResourceType): BaseProvider | null {
    const enabledProviders = this.getAllProviders().filter((p) => {
      if (p.name === 'manual') return false;
      const status = this.getProviderStatus(p.name);
      return p.supportedTypes.includes(type) && p.isConfigured() && status.enabled && status.status === 'CONNECTED';
    });

    if (enabledProviders.length > 0) {
      return enabledProviders[0];
    }
    return null;
  }

  public getIntegrationsStatus(): Integration[] {
    return this.getAllProviders().map((p) => {
      const credStatus = this.getProviderStatus(p.name);
      return {
        id: p.name,
        provider: p.name,
        name: p.displayName,
        enabled: credStatus.enabled,
        configured: credStatus.configured,
        status: credStatus.status,
        capabilities: p.capabilities,
        supportedTypes: p.supportedTypes,
        description: p.description,
      };
    });
  }

  public getProviderStatus(name: ProviderName | string): ProviderCredentialStatus {
    const provider = this.providers.get(name);
    if (!provider) {
      return {
        provider: name as ProviderName,
        configured: false,
        enabled: false,
        status: 'UNAVAILABLE',
      };
    }

    if (name === 'manual') {
      return {
        provider: name as ProviderName,
        configured: true,
        enabled: true,
        status: 'CONNECTED',
      };
    }

    if (name === 'openlibrary') {
      return {
        provider: name as ProviderName,
        configured: true,
        enabled: true,
        status: 'CONNECTED',
      };
    }

    const current = this.credentialStatuses.get(name);
    if (current) return current;

    const isConfigured = provider.isConfigured();
    return {
      provider: name as ProviderName,
      configured: isConfigured,
      enabled: isConfigured,
      status: isConfigured ? 'CONNECTED' : 'NOT_CONFIGURED',
    };
  }

  public setProviderCredentialStatus(status: ProviderCredentialStatus): void {
    this.credentialStatuses.set(status.provider, status);
  }

  private initializeDefaultStatuses(): void {
    this.getAllProviders().forEach((p) => {
      if (p.name === 'manual' || p.name === 'openlibrary') {
        this.credentialStatuses.set(p.name, {
          provider: p.name,
          configured: true,
          enabled: true,
          status: 'CONNECTED',
        });
      } else {
        const configured = p.isConfigured();
        this.credentialStatuses.set(p.name, {
          provider: p.name,
          configured,
          enabled: configured,
          status: configured ? 'CONNECTED' : 'NOT_CONFIGURED',
        });
      }
    });
  }
}

export const providerManager = new ProviderManager();
