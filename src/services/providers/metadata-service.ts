import { providerManager } from './provider-manager';
import { providerCache } from '@/cache/provider-cache';
import { Resource, ResourceProviderMetadata } from '@/types';
import { AppError } from '@/lib/app-error';

export class MetadataService {
  /**
   * Fetches provider details and returns normalized metadata object for initial creation.
   */
  public async fetchMetadataForCreation(
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

    const details = await provider.getDetailsNormalized(providerId);
    providerCache.setMetadata(providerName, providerId, details.metadata);

    const providerMetadata: ResourceProviderMetadata = {
      provider: providerName,
      providerId,
      metadata: details.metadata,
      version: 1,
      source,
    };

    return {
      title: details.title,
      image: details.image,
      providerMetadata,
      metadata: details.metadata,
      metadataVersion: 1,
      metadataSource: source,
    };
  }

  /**
   * Performs explicit manual metadata refresh.
   * Field Ownership Rule: User-managed fields (notes, tags, rawInput, title) are NEVER overwritten.
   */
  public async refreshResourceMetadata(resource: Resource): Promise<Partial<Resource>> {
    const providerName = resource.providerMetadata?.provider || resource.provider;
    const providerId = resource.providerMetadata?.providerId || resource.providerId;

    if (!providerName || providerName === 'manual' || !providerId) {
      throw AppError.validationFailed('Manual resources do not support provider refresh.');
    }

    const provider = providerManager.getProvider(providerName);
    if (!provider.isConfigured()) {
      throw AppError.unconfiguredProvider(provider.displayName);
    }

    const details = await provider.getDetailsNormalized(providerId);
    const now = Date.now();

    // Cache updated metadata
    providerCache.setMetadata(providerName, providerId, details.metadata);

    const existingMetadata = resource.providerMetadata?.metadata || resource.metadata || {};
    const updatedMetadata = {
      ...existingMetadata,
      ...details.metadata,
    };

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
