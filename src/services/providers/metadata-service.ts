import { providerManager } from './provider-manager';
import { providerCache } from '@/cache/provider-cache';
import { credentialService } from './credential-service';
import { Resource, ResourceProviderMetadata } from '@/types';
import { AppError } from '@/lib/app-error';
import { OMDbAdapter, OpenLibraryAdapter, GithubAdapter } from '@/domain/adapters/provider-adapters';

const omdbAdapter = new OMDbAdapter();
const openLibraryAdapter = new OpenLibraryAdapter();
const githubAdapter = new GithubAdapter();

function adaptRawMetadata(providerName: string, raw: Record<string, unknown>): Record<string, unknown> {
  if (!raw) return {};
  if (providerName === 'omdb') return omdbAdapter.adapt(raw) as unknown as Record<string, unknown>;
  if (providerName === 'openlibrary') return openLibraryAdapter.adapt(raw) as unknown as Record<string, unknown>;
  if (providerName === 'github') return githubAdapter.adapt(raw) as unknown as Record<string, unknown>;
  return raw;
}

export class MetadataService {
  /**
   * Fetches provider details and returns normalized metadata object for initial creation.
   */
  public async fetchMetadataForCreation(
    userId: string,
    providerName: string,
    providerId: string
  ): Promise<{
    title: string;
    image?: string;
    providerMetadata: ResourceProviderMetadata;
    metadata: Record<string, unknown>;
    metadataVersion: number;
    metadataSource: { provider: string; version: string; schemaVersion: number };
  }> {
    if (!providerName || providerName === 'manual') {
      const source = { provider: 'manual', version: '2.0.0', schemaVersion: 1 };
      const providerMetadata: ResourceProviderMetadata = {
        provider: 'manual',
        metadata: {},
        version: 1,
        source,
      };

      return {
        title: '',
        providerMetadata,
        metadata: {},
        metadataVersion: 1,
        metadataSource: source,
      };
    }

    const provider = providerManager.getProvider(providerName);
    const source = { provider: providerName, version: '2.0.0', schemaVersion: 1 };
    
    // Check cache first
    const cachedMeta = providerCache.getMetadata(providerName, providerId);
    if (cachedMeta) {
      const providerMetadata: ResourceProviderMetadata = {
        provider: providerName,
        providerId,
        metadata: cachedMeta,
        version: 1,
        source,
      };

      return {
        title: (cachedMeta.title as string) || '',
        image: (cachedMeta.poster as string) || (cachedMeta.coverImage as string) || undefined,
        providerMetadata,
        metadata: cachedMeta,
        metadataVersion: 1,
        metadataSource: source,
      };
    }

    // Get the key if provider requires credentials
    let apiKey: string | null = null;
    if (provider.capabilities.supportsCredentials) {
      apiKey = await credentialService.getCredential(userId, providerName);
      if (!apiKey) {
        throw AppError.unconfiguredProvider(provider.displayName);
      }
    }

    const details = await provider.getDetailsNormalized(providerId, apiKey || undefined);
    const adapted = adaptRawMetadata(providerName, details.metadata);
    const enrichedMetadata = { ...details.metadata, ...adapted };

    providerCache.setMetadata(providerName, providerId, enrichedMetadata);

    const providerMetadata: ResourceProviderMetadata = {
      provider: providerName,
      providerId,
      metadata: enrichedMetadata,
      version: 1,
      source,
    };

    return {
      title: details.title,
      image: details.image,
      providerMetadata,
      metadata: enrichedMetadata,
      metadataVersion: 1,
      metadataSource: source,
    };
  }

  /**
   * Performs explicit manual metadata refresh.
   * Field Ownership Rule: User-managed fields (notes, tags, rawInput, title) are NEVER overwritten.
   */
  public async refreshResourceMetadata(userId: string, resource: Resource): Promise<Partial<Resource>> {
    const providerName = resource.providerMetadata?.provider || resource.provider;
    const providerId = resource.providerMetadata?.providerId || resource.providerId;

    if (!providerName || providerName === 'manual' || !providerId) {
      throw AppError.validationFailed('Manual resources do not support provider refresh.');
    }

    const provider = providerManager.getProvider(providerName);
    
    // Get the key if provider requires credentials
    let apiKey: string | null = null;
    if (provider.capabilities.supportsCredentials) {
      apiKey = await credentialService.getCredential(userId, providerName);
      if (!apiKey) {
        throw AppError.unconfiguredProvider(provider.displayName);
      }
    }

    const details = await provider.getDetailsNormalized(providerId, apiKey || undefined);
    const now = Date.now();
    const adapted = adaptRawMetadata(providerName, details.metadata);

    const existingMetadata = resource.providerMetadata?.metadata || resource.metadata || {};
    const updatedMetadata = {
      ...existingMetadata,
      ...details.metadata,
      ...adapted,
    };

    // Cache updated metadata
    providerCache.setMetadata(providerName, providerId, updatedMetadata);

    const providerMetadata: ResourceProviderMetadata = {
      provider: providerName,
      providerId,
      metadata: updatedMetadata,
      version: 1,
      source: {
        provider: providerName,
        version: '2.0.0',
        schemaVersion: 1,
      },
      lastSynced: now,
      providerUpdatedAt: now,
    };

    // Return ONLY provider-owned metadata updates
    return {
      providerMetadata,
      image: details.image || resource.image,
      metadata: updatedMetadata,
      providerUpdatedAt: now,
      lastSynced: now,
      metadataVersion: 1,
      metadataSource: providerMetadata.source,
    };
  }
}

export const metadataService = new MetadataService();

