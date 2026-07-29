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

  public async generateTags(promptOrText: string, options?: AITagOptions & { apiKey?: string; model?: string }): Promise<string[]> {
    const rawText = await this.executePrompt(promptOrText, options);
    try {
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) return parsed.map((t: string) => String(t).replace(/^#/, '').trim().toLowerCase());
      }
    } catch {}
    return [];
  }

  public async summarize(promptOrText: string, options?: AISummarizeOptions & { apiKey?: string; model?: string }): Promise<string> {
    return await this.executePrompt(promptOrText, options);
  }

  public async executePrompt(prompt: string, options?: { apiKey?: string; model?: string; temperature?: number; maxTokens?: number }): Promise<string> {
    const apiKey = options?.apiKey || this.getApiKey();
    if (!apiKey) {
      throw AppError.unconfiguredProvider(this.displayName);
    }

    const model = options?.model || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options?.temperature ?? 0.2,
          maxOutputTokens: options?.maxTokens ?? 1024,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new AppError('AI_EXECUTION_FAILED', `Gemini request failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
}
