import { 
  PaginatedSearchResults, 
  ProviderCapabilities, 
  ProviderName, 
  ResourceType,
  SearchResult
} from '@/types';
import { AppError } from '@/lib/app-error';

export interface ProviderConfig {
  rateLimitPerMin?: number;
  maxRetries?: number;
  timeoutMs?: number;
}

export abstract class BaseProvider {
  public abstract readonly name: ProviderName;
  public abstract readonly displayName: string;
  public abstract readonly description: string;
  public abstract readonly supportedTypes: ResourceType[];
  public abstract readonly capabilities: ProviderCapabilities;
  
  protected config: ProviderConfig;
  private lastRequestTime: number = 0;

  constructor(config: ProviderConfig = { rateLimitPerMin: 60, maxRetries: 3, timeoutMs: 5000 }) {
    this.config = config;
  }

  public abstract isConfigured(): boolean;

  public async validateCredentials(_credentials: Record<string, string>): Promise<boolean> {
    return false;
  }

  public async searchNormalized(query: string, page: number = 1): Promise<PaginatedSearchResults> {
    if (!this.capabilities.supportsSearch) {
      return { results: [], page: 1, pageSize: 10, hasMore: false, totalResults: 0 };
    }
    if (!this.isConfigured()) {
      throw AppError.unconfiguredProvider(this.displayName);
    }
    return { results: [], page: 1, pageSize: 10, hasMore: false, totalResults: 0 };
  }

  public async getDetailsNormalized(providerId: string): Promise<{
    title: string;
    image?: string;
    metadata: Record<string, unknown>;
  }> {
    if (!this.isConfigured()) {
      throw AppError.unconfiguredProvider(this.displayName);
    }
    throw AppError.notFound(this.displayName);
  }

  protected async checkRateLimit(): Promise<void> {
    const minInterval = (60 * 1000) / (this.config.rateLimitPerMin || 60);
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;

    if (elapsed < minInterval) {
      const waitTime = minInterval - elapsed;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    this.lastRequestTime = Date.now();
  }

  protected async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastErr: unknown;
    const retries = this.config.maxRetries || 3;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        await this.checkRateLimit();
        return await fn();
      } catch (err) {
        lastErr = err;
        if (err instanceof AppError) {
          // Do not retry non-transient configuration/auth/validation/404 errors
          if (['UNCONFIGURED_PROVIDER', 'INVALID_API_KEY', 'VALIDATION_FAILED', 'NOT_FOUND', 'NO_RESULTS'].includes(err.code)) {
            throw err;
          }
        }
        // Exponential backoff for network/transient failures
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 400));
      }
    }
    throw AppError.fromError(lastErr);
  }
}
