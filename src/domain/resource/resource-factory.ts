import { Resource, ResourceType, RESOURCE_TYPES } from '@/types';
import { AppError } from '@/lib/app-error';

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
          .map(t => t.replace(/^#/, '').toLowerCase().trim())
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
    rawInput?: string;
    notes?: string;
    image?: string;
    status?: string;
  }): Omit<Resource, 'id'> {
    const validTitle = ResourceValidator.validateTitle(params.title);
    const validTags = ResourceValidator.validateTags(params.tags);
    const validImage = ResourceValidator.validateUrl(params.image);
    const timestamp = Date.now();

    return {
      userId: params.userId,
      title: validTitle,
      type: params.type || RESOURCE_TYPES.NOTE,
      tags: validTags,
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
