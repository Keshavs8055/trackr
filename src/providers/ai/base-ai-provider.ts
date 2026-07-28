import { BaseProvider, ProviderConfig } from '../base-provider';

export interface AISummarizeOptions {
  maxLength?: number;
  format?: 'bullet_points' | 'paragraph';
}

export interface AITagOptions {
  maxTags?: number;
  existingTags?: string[];
}

export abstract class BaseAIProvider extends BaseProvider {
  public readonly isAIProvider = true;

  constructor(config?: ProviderConfig) {
    super(config || { rateLimitPerMin: 60, maxRetries: 2, timeoutMs: 10000 });
  }

  /**
   * Generates auto-tags for a resource based on title, content, or metadata
   */
  public abstract generateTags(
    text: string,
    options?: AITagOptions
  ): Promise<string[]>;

  /**
   * Summarizes resource notes or full content
   */
  public abstract summarize(
    text: string,
    options?: AISummarizeOptions
  ): Promise<string>;

  /**
   * Executes a natural language query or prompt
   */
  public abstract executePrompt(
    prompt: string,
    context?: Record<string, unknown>
  ): Promise<string>;
}
