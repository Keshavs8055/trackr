import { BaseProvider } from './base-provider';
import { 
  PaginatedSearchResults, 
  ProviderCapabilities, 
  PROVIDERS, 
  ProviderName, 
  RESOURCE_TYPES, 
  ResourceType, 
  SearchResult 
} from '@/types';
import { AppError } from '@/lib/app-error';

export class OpenLibraryProvider extends BaseProvider {
  public readonly name: ProviderName = PROVIDERS.OPENLIBRARY;
  public readonly displayName = 'Open Library';
  public readonly description = 'Public book catalog and ISBN lookup provider. No API key required.';
  public readonly supportedTypes: ResourceType[] = [RESOURCE_TYPES.BOOK];

  public readonly capabilities: ProviderCapabilities = {
    supportsSearch: true,
    supportsRefresh: true,
    supportsImages: true,
    supportsCredentials: false,
  };

  public isConfigured(): boolean {
    return true; // Open Library is free & public
  }

  public override async validateCredentials(): Promise<boolean> {
    return true;
  }

  public async searchNormalized(queryStr: string, page: number = 1): Promise<PaginatedSearchResults> {
    if (!queryStr.trim()) {
      return { results: [], page: 1, pageSize: 10, hasMore: false, totalResults: 0 };
    }

    return this.executeWithRetry(async () => {
      const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(queryStr.trim())}&page=${page}&limit=10`;
      const res = await fetch(url);
      if (!res.ok) {
        throw AppError.networkError(this.displayName);
      }

      const data = await res.json();
      const numFound = data.numFound || 0;
      const docs = data.docs || [];

      const results: SearchResult[] = docs.map((doc: any) => {
        const coverId = doc.cover_i;
        const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : undefined;
        const author = Array.isArray(doc.author_name) ? doc.author_name[0] : doc.author_name;
        const providerId = doc.key ? doc.key.replace('/works/', '') : doc.isbn ? doc.isbn[0] : doc.title;
        const metaPreview = {
          author,
          publishYear: doc.first_publish_year,
          isbn: Array.isArray(doc.isbn) ? doc.isbn[0] : doc.isbn,
        };

        return {
          provider: this.name,
          providerId,
          title: doc.title || 'Untitled Book',
          subtitle: author ? `By ${author}` : 'Book',
          description: doc.first_publish_year ? `Published in ${doc.first_publish_year}` : undefined,
          image: coverUrl,
          type: RESOURCE_TYPES.BOOK,
          year: doc.first_publish_year || undefined,
          language: Array.isArray(doc.language) ? doc.language[0] : undefined,
          metadataPreview: metaPreview,
          providerMetadata: {
            provider: this.name,
            providerId,
            metadata: metaPreview,
            version: 1,
          },
        };
      });

      const hasMore = page * 10 < numFound;
      return {
        results,
        page,
        pageSize: 10,
        hasMore,
        totalResults: numFound,
      };
    });
  }

  public async getDetailsNormalized(providerId: string): Promise<{
    title: string;
    image?: string;
    metadata: Record<string, unknown>;
  }> {
    return this.executeWithRetry(async () => {
      const key = providerId.startsWith('OL') || providerId.startsWith('/works/') ? providerId : `OL${providerId}W`;
      const url = `https://openlibrary.org/works/${key.replace('/works/', '')}.json`;
      
      const res = await fetch(url);
      if (!res.ok) {
        throw AppError.notFound(`Book (${providerId})`);
      }

      const data = await res.json();
      const title = data.title || 'Untitled Book';

      let description: string | undefined = undefined;
      if (typeof data.description === 'string') {
        description = data.description;
      } else if (data.description && typeof data.description === 'object') {
        description = data.description.value;
      }

      const covers = Array.isArray(data.covers) && data.covers.length > 0 ? data.covers[0] : undefined;
      const coverUrl = covers ? `https://covers.openlibrary.org/b/id/${covers}-L.jpg` : undefined;

      // Map lightweight book metadata
      const metadata: Record<string, unknown> = {
        title,
        description,
        subjects: Array.isArray(data.subjects) ? data.subjects.slice(0, 5) : undefined,
        publishYear: data.first_publish_date || undefined,
        coverImage: coverUrl,
        openLibraryKey: key,
      };

      return {
        title,
        image: coverUrl,
        metadata,
      };
    });
  }
}
