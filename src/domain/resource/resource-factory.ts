import { Resource, ResourceType, RESOURCE_TYPES } from '@/types';
import { AppError } from '@/lib/app-error';
import { normalizeTag, extractUrl } from '@/lib/parser';

export class ResourceValidator {
  public static validateTitle(title: string): string {
    const trimmed = title ? title.trim() : '';
    if (!trimmed) {
      throw AppError.validationFailed('Resource title is required');
    }
    if (trimmed.length > 300) {
      throw AppError.validationFailed('Resource title must be under 300 characters');
    }
    return trimmed;
  }

  public static validateTags(tags?: string[]): string[] {
    if (!tags || !Array.isArray(tags)) return [];
    return Array.from(
      new Set(
        tags
          .map(t => normalizeTag(t))
          .filter(t => t.length > 0)
      )
    );
  }

  public static validateUrl(url?: string): string | undefined {
    if (!url || !url.trim()) return undefined;
    try {
      const parsed = new URL(url.trim());
      return parsed.href;
    } catch {
      return url.trim();
    }
  }
}

export class ResourceFactory {
  public static createResource(params: {
    userId: string;
    title: string;
    type?: ResourceType;
    tags?: string[];
    url?: string;
    rawInput?: string;
    notes?: string;
    image?: string;
    status?: string;
  }): Omit<Resource, 'id'> {
    const validTitle = ResourceValidator.validateTitle(params.title);
    let validTags = ResourceValidator.validateTags(params.tags);
    const validImage = ResourceValidator.validateUrl(params.image);

    // Detect URL if provided or embedded in title / rawInput
    const detectedUrl = params.url 
      ? ResourceValidator.validateUrl(params.url)
      : (extractUrl(params.rawInput || '') || extractUrl(params.title || ''));

    let inferredType = params.type;

    if (detectedUrl) {
      // Automatically assign 'link' tag for link resources
      if (!validTags.includes('link')) {
        validTags = [...validTags, 'link'];
      }

      // Infer type if unspecified or default 'note'
      if (!inferredType || inferredType === RESOURCE_TYPES.NOTE) {
        if (detectedUrl.includes('github.com')) {
          inferredType = RESOURCE_TYPES.GITHUB;
          if (!validTags.includes('github')) validTags.push('github');
        } else {
          inferredType = RESOURCE_TYPES.WEBSITE;
        }
      }
    }

    const timestamp = Date.now();

    return {
      userId: params.userId,
      title: validTitle,
      type: inferredType || RESOURCE_TYPES.NOTE,
      tags: validTags,
      url: detectedUrl || undefined,
      rawInput: params.rawInput?.trim() || validTitle,
      notes: params.notes?.trim() || undefined,
      image: validImage,
      status: params.status || 'planned',
      metadata: {},
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }
}
