import { credentialService } from '@/services/providers/credential-service';
import { aiCache } from '@/cache/ai-cache';
import { useAIStore } from '@/store/ai-store';
import { ActivityService } from '@/services/activity-service';

import {
  Resource,
  NLQueryResult,
  AISuggestion,
  AIDuplicateGroup,
  AIMetadataCleanupResult,
  Collection,
} from '@/types';
import {
  buildAutoTagPrompt,
  buildSimilarResourcesPrompt,
  buildNaturalLanguageQueryPrompt,
  buildSmartCollectionPrompt,
  buildMetadataCleanupPrompt,
  buildDuplicateDetectionPrompt,
} from '@/ai/prompts';
import { AppError } from '@/lib/app-error';

export class AIService {
  /**
   * Internal helper to fetch API key from credential vault or throw BYOK_KEY_REQUIRED.
   */
  private async getApiKey(userId: string): Promise<string> {
    const key = await credentialService.getCredential(userId, 'gemini');
    if (!key) {
      throw new AppError(
        'BYOK_KEY_REQUIRED',
        'Gemini API key is required. Please configure your key in Settings -> Integrations.'
      );
    }
    return key;
  }

  /**
   * Executes AI prompt with server route /api/ai or returns streamed text.
   */
  public async executePrompt(
    userId: string,
    prompt: string,
    options?: {
      stream?: boolean;
      onChunk?: (chunk: string) => void;
      responseMimeType?: string;
    }
  ): Promise<string> {
    const apiKey = await this.getApiKey(userId);
    const { settings } = useAIStore.getState();

    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-gemini-api-key': apiKey,
      },
      body: JSON.stringify({
        prompt,
        model: settings.selectedModel,
        temperature: settings.temperature,
        maxTokens: settings.maxOutputTokens,
        stream: options?.stream && settings.enableStreaming,
        responseMimeType: options?.responseMimeType,
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new AppError(
        errJson.errorCode || 'AI_EXECUTION_FAILED',
        errJson.message || `AI API error (${response.status})`
      );
    }

    if (options?.stream && settings.enableStreaming && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const rawChunk = decoder.decode(value, { stream: true });
        // Clean SSE formatting if present
        const cleanedChunk = rawChunk
          .replace(/^data:\s*/gm, '')
          .replace(/\n\n$/g, '');

        // Try extracting text from candidate JSON payload
        try {
          const lines = cleanedChunk.split('\n').filter((l) => l.trim().length > 0);
          for (const line of lines) {
            if (line.startsWith('{')) {
              const parsed = JSON.parse(line);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                fullText += text;
                options.onChunk?.(text);
              }
            } else {
              fullText += line;
              options.onChunk?.(line);
            }
          }
        } catch {
          fullText += cleanedChunk;
          options.onChunk?.(cleanedChunk);
        }
      }

      return fullText;
    } else {
      const resultJson = await response.json();
      return resultJson.data || '';
    }
  }

  /**
   * Generates auto-tags for a resource. Uses AI cache with automatic resource timestamp invalidation.
   */
  public async generateAutoTags(
    userId: string,
    resource: Resource,
    existingWorkspaceTags: string[] = []
  ): Promise<string[]> {
    const cacheKey = `autoTags:${resource.id}`;
    const cached = await aiCache.get<string[]>(cacheKey, resource.updatedAt);
    if (cached) return cached;

    const prompt = buildAutoTagPrompt(resource, existingWorkspaceTags);
    const rawOutput = await this.executePrompt(userId, prompt, { responseMimeType: 'application/json' });

    let tags: string[] = [];
    try {
      const match = rawOutput.match(/\[[\s\S]*\]/);
      if (match) {
        tags = JSON.parse(match[0]);
      }
    } catch {
      console.warn('Failed to parse auto-tags JSON output:', rawOutput);
    }

    const cleanTags = tags.map((t) => String(t).replace(/^#/, '').trim().toLowerCase());
    await aiCache.set(cacheKey, 'autoTags', cleanTags, {
      targetId: resource.id,
      resourceUpdatedAtHash: resource.updatedAt,
      ttlMs: 24 * 60 * 60 * 1000,
    });

    await ActivityService.getInstance().logActivity(userId, resource.id, 'note_added', {
      aiAction: 'auto_tag',
      generatedTags: cleanTags,
    });

    return cleanTags;
  }



  /**
   * Ranks similar resources in user archive.
   */
  public async findSimilarResources(
    userId: string,
    target: Resource,
    allResources: Resource[]
  ): Promise<Array<{ resource: Resource; matchScore: number; reason: string }>> {
    const cacheKey = `similarity:${target.id}`;
    const cached = await aiCache.get<Array<{ resourceId: string; matchScore: number; reason: string }>>(
      cacheKey,
      target.updatedAt
    );

    let rawMatches = cached;
    if (!rawMatches) {
      const candidates = allResources.filter((r) => r.id !== target.id);
      if (candidates.length === 0) return [];

      const prompt = buildSimilarResourcesPrompt(target, candidates);
      const rawText = await this.executePrompt(userId, prompt, { responseMimeType: 'application/json' });

      try {
        const match = rawText.match(/\[[\s\S]*\]/);
        if (match) {
          rawMatches = JSON.parse(match[0]);
          await aiCache.set(cacheKey, 'similarity', rawMatches, {
            targetId: target.id,
            resourceUpdatedAtHash: target.updatedAt,
            ttlMs: 48 * 60 * 60 * 1000,
          });
        }
      } catch {
        rawMatches = [];
      }
    }

    if (!rawMatches || !Array.isArray(rawMatches)) return [];

    const resourceMap = new Map(allResources.map((r) => [r.id, r]));
    return rawMatches
      .map((m) => {
        const res = resourceMap.get(m.resourceId);
        if (!res) return null;
        return { resource: res, matchScore: m.matchScore, reason: m.reason };
      })
      .filter((item): item is { resource: Resource; matchScore: number; reason: string } => item !== null);
  }

  /**
   * Processes natural language queries returning intent, confidence, reasoning, matching resources & suggested filters.
   */
  public async naturalLanguageQuery(
    userId: string,
    query: string,
    allResources: Resource[]
  ): Promise<NLQueryResult> {
    const { settings } = useAIStore.getState();
    const limitedResources = allResources.slice(0, settings.contextSize);
    const prompt = buildNaturalLanguageQueryPrompt(query, limitedResources);

    const rawText = await this.executePrompt(userId, prompt, { responseMimeType: 'application/json' });

    try {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        const result: NLQueryResult = JSON.parse(match[0]);
        return result;
      }
    } catch (err) {
      console.warn('Failed to parse NL query JSON response:', rawText);
    }

    return {
      intent: 'Search archive',
      confidence: 0.5,
      reasoning: 'Fallback query parsing due to non-structured response.',
      matchingResourceIds: allResources.filter((r) => r.title.toLowerCase().includes(query.toLowerCase())).map((r) => r.id),
      answer: `Found matching items for "${query}"`,
    };
  }

  /**
   * Generates smart collection details and rules.
   */
  public async generateSmartCollection(
    userId: string,
    userPrompt: string,
    availableResources: Resource[]
  ): Promise<Partial<Collection>> {
    const prompt = buildSmartCollectionPrompt(userPrompt, availableResources);
    const rawText = await this.executePrompt(userId, prompt, { responseMimeType: 'application/json' });

    try {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch {}

    return {
      title: userPrompt,
      description: 'AI Generated collection',
      isDynamic: true,
      rules: [],
    };
  }

  /**
   * Detects duplicate entries in user archive.
   */
  public async detectDuplicates(
    userId: string,
    allResources: Resource[]
  ): Promise<AIDuplicateGroup[]> {
    const prompt = buildDuplicateDetectionPrompt(allResources);
    const rawText = await this.executePrompt(userId, prompt, { responseMimeType: 'application/json' });

    try {
      const match = rawText.match(/\[[\s\S]*\]/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch {}

    return [];
  }

  /**
   * Clean metadata for a resource.
   */
  public async cleanMetadata(
    userId: string,
    resource: Resource
  ): Promise<AIMetadataCleanupResult> {
    const prompt = buildMetadataCleanupPrompt(resource);
    const rawText = await this.executePrompt(userId, prompt, { responseMimeType: 'application/json' });

    try {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch {}

    return { resourceId: resource.id };
  }
}

export const aiService = new AIService();
