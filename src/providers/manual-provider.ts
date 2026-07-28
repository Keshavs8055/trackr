import { BaseProvider } from './base-provider';
import { 
  ProviderCapabilities, 
  PROVIDERS, 
  ProviderName, 
  RESOURCE_TYPES, 
  ResourceType 
} from '@/types';

export class ManualProvider extends BaseProvider {
  public readonly name: ProviderName = PROVIDERS.MANUAL;
  public readonly displayName = 'Manual';
  public readonly description = 'Manual resource creation. Always available and offline-ready.';
  public readonly supportedTypes: ResourceType[] = Object.values(RESOURCE_TYPES);

  public readonly capabilities: ProviderCapabilities = {
    supportsSearch: false,
    supportsRefresh: false,
    supportsImages: false,
    supportsCredentials: false,
  };

  public isConfigured(): boolean {
    return true; // Manual provider is always active and ready
  }

  public override async validateCredentials(): Promise<boolean> {
    return true;
  }
}
