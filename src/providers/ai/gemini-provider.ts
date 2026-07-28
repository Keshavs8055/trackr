import { BaseAIProvider, AITagOptions, AISummarizeOptions } from './base-ai-provider';
import { ProviderCapabilities, ProviderName, PROVIDERS, ResourceType, RESOURCE_TYPES } from '@/types';
import { AppError } from '@/lib/app-error';

export class GeminiProvider extends BaseAIProvider {
  public readonly name: ProviderName = PROVIDERS.GEMINI;
  public readonly displayName = 'Google Gemini AI';
  public readonly description = 'BYOK Google Gemini API for auto-tagging, summaries, and semantic search.';
  public readonly supportedTypes: ResourceType[] = Object.values(RESOURCE_TYPES);

  public readonly capabilities: ProviderCapabilities = {
    supportsSearch: false,
    supportsRefresh: false,
    supportsImages: false,
    supportsCredentials: true,
    supportsAI: true,
    canSearch: false,
    canFetchMetadata: false,
    canRefresh: false,
    hasPosterImages: false,
    requiresAuthKey: true,
    rateLimitPerMin: 60,
  };

  constructor() {
    super({ rateLimitPerMin: 60, maxRetries: 2, timeoutMs: 10000 });
  }

  public async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    const key = credentials.apiKey || credentials.key;
    if (!key || key.trim().length < 8) return false;

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key.trim())}`);
      if (!res.ok) return false;
      const data = await res.json();
      return Array.isArray(data.models) && data.models.length > 0;
    } catch (err) {
      console.warn("Gemini key validation network failure:", err);
      return false;
    }
  }

  public async generateTags(_text: string, _options?: AITagOptions): Promise<string[]> {
    if (!this.isConfigured()) {
      throw AppError.unconfiguredProvider(this.displayName);
    }
    throw new AppError('AI_NOT_IMPLEMENTED', 'Gemini AI provider integration will be fully activated in Phase 10.');
  }

  public async summarize(_text: string, _options?: AISummarizeOptions): Promise<string> {
    if (!this.isConfigured()) {
      throw AppError.unconfiguredProvider(this.displayName);
    }
    throw new AppError('AI_NOT_IMPLEMENTED', 'Gemini AI provider integration will be fully activated in Phase 10.');
  }

  public async executePrompt(_prompt: string, _context?: Record<string, unknown>): Promise<string> {
    if (!this.isConfigured()) {
      throw AppError.unconfiguredProvider(this.displayName);
    }
    throw new AppError('AI_NOT_IMPLEMENTED', 'Gemini AI provider integration will be fully activated in Phase 10.');
  }
}
