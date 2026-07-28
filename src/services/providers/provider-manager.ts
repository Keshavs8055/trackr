import { BaseProvider } from '@/providers/base-provider';
import { ManualProvider } from '@/providers/manual-provider';
import { OMDbProvider } from '@/providers/omdb-provider';
import { OpenLibraryProvider } from '@/providers/openlibrary-provider';
import { TMDBProvider } from '@/providers/tmdb-provider';
import { GoogleBooksProvider } from '@/providers/google-books-provider';
import { GeminiProvider } from '@/providers/ai/gemini-provider';
import { 
  ConnectionHealthStatus,
  Integration, 
  ProviderCredentialStatus, 
  ProviderHealth, 
  ProviderName, 
  ResourceType 
} from '@/types';
import { AppError } from '@/lib/app-error';

export class ProviderManager {
  private providers: Map<string, BaseProvider> = new Map();
  private credentialStatuses: Map<string, ProviderCredentialStatus> = new Map();
  private healthMap: Map<string, ProviderHealth> = new Map();

  constructor() {
    this.registerProvider(new ManualProvider());
    this.registerProvider(new OMDbProvider());
    this.registerProvider(new OpenLibraryProvider());
    this.registerProvider(new TMDBProvider());
    this.registerProvider(new GoogleBooksProvider());
    this.registerProvider(new GeminiProvider());

    this.initializeDefaultStatuses();
  }

  public registerProvider(provider: BaseProvider): void {
    this.providers.set(provider.name, provider);
    if (!this.healthMap.has(provider.name)) {
      this.healthMap.set(provider.name, {
        provider: provider.name,
        consecutiveFailures: 0,
        totalRequests: 0,
        totalSuccesses: 0,
        totalFailures: 0,
        isCoolingDown: false,
        connectionHealth: 'HEALTHY',
      });
    }
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
        provider: p.name as ProviderName,
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
        connectionHealth: 'FAILED',
      };
    }

    if (name === 'manual' || name === 'openlibrary' || name === 'google_books') {
      return {
        provider: name as ProviderName,
        configured: true,
        enabled: true,
        status: 'CONNECTED',
        connectionHealth: 'HEALTHY',
      };
    }

    const health = this.getHealth(name);
    const current = this.credentialStatuses.get(name);

    if (health.isCoolingDown && health.cooldownUntil && Date.now() < health.cooldownUntil) {
      return {
        provider: name as ProviderName,
        configured: provider.isConfigured(),
        enabled: true,
        status: 'RATE_LIMITED',
        connectionHealth: 'COOLING_DOWN',
        lastError: health.lastErrorMessage,
        retryCooldown: Math.ceil((health.cooldownUntil - Date.now()) / 1000),
      };
    }

    if (current) {
      return {
        ...current,
        connectionHealth: health.connectionHealth,
        lastError: health.lastErrorMessage,
      };
    }

    const isConfigured = provider.isConfigured();
    return {
      provider: name as ProviderName,
      configured: isConfigured,
      enabled: isConfigured,
      status: isConfigured ? 'CONNECTED' : 'NOT_CONFIGURED',
      connectionHealth: isConfigured ? health.connectionHealth : 'DEGRADED',
    };
  }

  public setProviderCredentialStatus(status: ProviderCredentialStatus): void {
    this.credentialStatuses.set(status.provider, status);
    const p = this.providers.get(status.provider);
    if (p) {
      p.setConfigured(status.configured && status.enabled);
    }
  }

  // --- Health Metrics & Cooldown Management ---

  public recordRequest(providerName: string): void {
    const h = this.getHealth(providerName);
    h.totalRequests += 1;
    h.lastRequestTimestamp = Date.now();
    this.healthMap.set(providerName, h);
  }

  public recordSuccess(providerName: string): void {
    const h = this.getHealth(providerName);
    h.totalSuccesses += 1;
    h.consecutiveFailures = 0;
    h.lastSuccessTimestamp = Date.now();
    h.isCoolingDown = false;
    h.cooldownUntil = undefined;
    h.connectionHealth = 'HEALTHY';
    this.healthMap.set(providerName, h);
  }

  public recordError(providerName: string, errorMessage: string): void {
    const h = this.getHealth(providerName);
    h.totalFailures += 1;
    h.consecutiveFailures += 1;
    h.lastErrorTimestamp = Date.now();
    h.lastErrorMessage = errorMessage;

    if (h.consecutiveFailures >= 3) {
      h.isCoolingDown = true;
      h.cooldownUntil = Date.now() + 60 * 1000;
      h.connectionHealth = 'COOLING_DOWN';
    } else {
      h.connectionHealth = 'DEGRADED';
    }
    this.healthMap.set(providerName, h);
  }

  public getHealth(providerName: string): ProviderHealth {
    const existing = this.healthMap.get(providerName);
    if (existing) {
      if (existing.isCoolingDown && existing.cooldownUntil && Date.now() >= existing.cooldownUntil) {
        existing.isCoolingDown = false;
        existing.cooldownUntil = undefined;
        existing.consecutiveFailures = 0;
        existing.connectionHealth = 'HEALTHY';
      }
      return existing;
    }
    return {
      provider: providerName,
      consecutiveFailures: 0,
      totalRequests: 0,
      totalSuccesses: 0,
      totalFailures: 0,
      isCoolingDown: false,
      connectionHealth: 'HEALTHY',
    };
  }

  public getAllHealth(): ProviderHealth[] {
    return Array.from(this.healthMap.values());
  }

  /**
   * Tests connection to a provider and records health diagnostics.
   */
  public async testConnection(providerName: string): Promise<{ success: boolean; message: string }> {
    const provider = this.getProvider(providerName);
    this.recordRequest(providerName);

    try {
      const apiKey = provider.getApiKey();
      const isValid = await provider.validateCredentials(apiKey ? { apiKey } : {});

      if (isValid) {
        this.recordSuccess(providerName);
        return { success: true, message: `Successfully connected to ${provider.displayName}` };
      } else {
        const msg = provider.isConfigured() 
          ? `Connection test failed for ${provider.displayName}: Invalid API Key or Unauthorized`
          : `${provider.displayName} is not configured yet.`;
        this.recordError(providerName, msg);
        return { success: false, message: msg };
      }
    } catch (err: any) {
      const errorMsg = err?.message || `Failed to connect to ${provider.displayName}`;
      this.recordError(providerName, errorMsg);
      return { success: false, message: errorMsg };
    }
  }

  private initializeDefaultStatuses(): void {
    this.getAllProviders().forEach((p) => {
      const configured = p.isConfigured();
      if (p.name === 'manual' || p.name === 'openlibrary' || p.name === 'google_books') {
        this.credentialStatuses.set(p.name, {
          provider: p.name as ProviderName,
          configured: true,
          enabled: true,
          status: 'CONNECTED',
          connectionHealth: 'HEALTHY',
        });
      } else {
        this.credentialStatuses.set(p.name, {
          provider: p.name as ProviderName,
          configured,
          enabled: configured,
          status: configured ? 'CONNECTED' : 'NOT_CONFIGURED',
          connectionHealth: configured ? 'HEALTHY' : 'DEGRADED',
        });
      }
    });
  }
}

export const providerManager = new ProviderManager();
