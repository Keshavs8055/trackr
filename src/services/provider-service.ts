import { providerManager } from './providers/provider-manager';
import { searchService } from './providers/search-service';
import { metadataService } from './providers/metadata-service';
import { credentialService } from './providers/credential-service';
import { auditLogService } from './providers/audit-log-service';
import { 
  Integration, 
  PaginatedSearchResults, 
  ProviderCredentialStatus, 
  ProviderName, 
  Resource, 
  ResourceType 
} from '@/types';

export class ProviderService {
  public getIntegrationsStatus(): Integration[] {
    return providerManager.getIntegrationsStatus();
  }

  public getProviderStatus(providerName: string): ProviderCredentialStatus {
    return providerManager.getProviderStatus(providerName);
  }

  public async search(
    type: ResourceType, 
    query: string, 
    page: number = 1
  ): Promise<{ results: PaginatedSearchResults; providerName: string }> {
    return searchService.search(type, query, page);
  }

  public async fetchMetadataForCreation(providerName: string, providerId: string) {
    return metadataService.fetchMetadataForCreation(providerName, providerId);
  }

  public async refreshResourceMetadata(resource: Resource): Promise<Partial<Resource>> {
    return metadataService.refreshResourceMetadata(resource);
  }

  public async configureProvider(userId: string, providerName: ProviderName | string, apiKey: string) {
    return credentialService.configureProvider(userId, providerName, apiKey);
  }

  public async rotateCredential(userId: string, providerName: ProviderName | string, newApiKey: string) {
    return credentialService.rotateCredential(userId, providerName, newApiKey);
  }

  public async revalidateCredential(userId: string, providerName: string) {
    return credentialService.revalidateCredential(userId, providerName);
  }

  public clearCredentialCache() {
    credentialService.clearMemoryCache();
  }

  public async setProviderEnabled(userId: string, providerName: ProviderName | string, enabled: boolean) {
    return credentialService.setProviderEnabled(userId, providerName, enabled);
  }

  public async disconnectProvider(userId: string, providerName: ProviderName | string) {
    return credentialService.disconnectProvider(userId, providerName);
  }

  public async testProviderConnection(providerName: string): Promise<{ success: boolean; message: string }> {
    return providerManager.testConnection(providerName);
  }

  public getProviderHealth(providerName: string) {
    return providerManager.getHealth(providerName);
  }

  public getAuditLogs() {
    return auditLogService.getRecentLogs();
  }

  public initializeCredentials(userId: string): void {
    credentialService.initializeCredentials(userId);
  }
}

export const providerService = new ProviderService();
