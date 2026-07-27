import { Resource } from '@/types';

export class SearchIndexBuilder {
  public static buildSearchIndex(resource: Partial<Resource>): string {
    const parts: string[] = [];

    if (resource.title) parts.push(resource.title);
    if (resource.rawInput) parts.push(resource.rawInput);
    if (resource.notes) parts.push(resource.notes);
    if (resource.tags && resource.tags.length > 0) parts.push(resource.tags.join(' '));
    if (resource.type) parts.push(resource.type);
    if (resource.status) parts.push(resource.status);

    const meta = (resource.providerMetadata?.metadata || resource.metadata || {}) as Record<string, any>;
    
    // Add common metadata text values
    ['director', 'author', 'authors', 'publisher', 'language', 'genre', 'domain', 'plot', 'description'].forEach(key => {
      const val = meta[key];
      if (typeof val === 'string') parts.push(val);
      else if (Array.isArray(val)) parts.push(val.join(' '));
    });

    return parts.join(' ').toLowerCase().trim();
  }
}
