import { PluginAdapter, PluginSearchResult } from './plugin-adapter.interface';
import { ResourceType, RESOURCE_TYPES, PROVIDERS, SearchResult } from '@/types';
import { OMDbProvider } from '@/providers/omdb-provider';
import { OpenLibraryProvider } from '@/providers/openlibrary-provider';
import { TMDBProvider } from '@/providers/tmdb-provider';
import { GoogleBooksProvider } from '@/providers/google-books-provider';

export class PluginRegistry {
  private static instance: PluginRegistry | null = null;
  private plugins: Map<string, PluginAdapter> = new Map();

  private constructor() {
    this.registerBuiltInPlugins();
  }

  public static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  /**
   * Register default built-in providers into plugin registry
   */
  private registerBuiltInPlugins() {
    const omdb = new OMDbProvider();
    const openLibrary = new OpenLibraryProvider();
    const tmdb = new TMDBProvider();
    const googleBooks = new GoogleBooksProvider();

    // OMDb Plugin
    this.registerPlugin({
      id: PROVIDERS.OMDB,
      name: 'OMDb Movie Catalog',
      version: '1.0.0',
      description: 'Open Movie Database adapter for movies and TV series',
      supportedTypes: [RESOURCE_TYPES.MOVIE, RESOURCE_TYPES.TV],
      search: async (query: string, _type?: ResourceType, apiKey?: string) => {
        try {
          const paginated = await omdb.searchNormalized(query, 1, apiKey);
          return (paginated.results || []).map((r: SearchResult) => ({
            ...r,
            pluginId: PROVIDERS.OMDB,
            sourceProvider: PROVIDERS.OMDB,
          }));
        } catch {
          return [];
        }
      },
      fetchDetails: async (externalId: string, apiKey?: string) => {
        try {
          const res = await omdb.getDetailsNormalized(externalId, apiKey);
          return res.metadata || {};
        } catch {
          return {};
        }
      },
    });

    // Open Library Plugin
    this.registerPlugin({
      id: PROVIDERS.OPENLIBRARY,
      name: 'Open Library Books',
      version: '1.0.0',
      description: 'Open Library adapter for books and literary catalog',
      supportedTypes: [RESOURCE_TYPES.BOOK],
      search: async (query: string, _type?: ResourceType) => {
        try {
          const paginated = await openLibrary.searchNormalized(query, 1);
          return (paginated.results || []).map((r: SearchResult) => ({
            ...r,
            pluginId: PROVIDERS.OPENLIBRARY,
            sourceProvider: PROVIDERS.OPENLIBRARY,
          }));
        } catch {
          return [];
        }
      },
      fetchDetails: async (externalId: string) => {
        try {
          const res = await openLibrary.getDetailsNormalized(externalId);
          return res.metadata || {};
        } catch {
          return {};
        }
      },
    });

    // TMDb Plugin
    this.registerPlugin({
      id: PROVIDERS.TMDB,
      name: 'The Movie Database (TMDb)',
      version: '1.0.0',
      description: 'TMDb adapter for movies and television shows',
      supportedTypes: [RESOURCE_TYPES.MOVIE, RESOURCE_TYPES.TV],
      search: async (query: string, _type?: ResourceType, apiKey?: string) => {
        try {
          const paginated = await tmdb.searchNormalized(query, 1, apiKey);
          return (paginated.results || []).map((r: SearchResult) => ({
            ...r,
            pluginId: PROVIDERS.TMDB,
            sourceProvider: PROVIDERS.TMDB,
          }));
        } catch {
          return [];
        }
      },
      fetchDetails: async (externalId: string, apiKey?: string) => {
        try {
          const res = await tmdb.getDetailsNormalized(externalId, apiKey);
          return res.metadata || {};
        } catch {
          return {};
        }
      },
    });

    // Google Books Plugin
    this.registerPlugin({
      id: PROVIDERS.GOOGLE_BOOKS,
      name: 'Google Books API',
      version: '1.0.0',
      description: 'Google Books catalog search adapter',
      supportedTypes: [RESOURCE_TYPES.BOOK],
      search: async (query: string, _type?: ResourceType, apiKey?: string) => {
        try {
          const paginated = await googleBooks.searchNormalized(query, 1, apiKey);
          return (paginated.results || []).map((r: SearchResult) => ({
            ...r,
            pluginId: PROVIDERS.GOOGLE_BOOKS,
            sourceProvider: PROVIDERS.GOOGLE_BOOKS,
          }));
        } catch {
          return [];
        }
      },
      fetchDetails: async (externalId: string, apiKey?: string) => {
        try {
          const res = await googleBooks.getDetailsNormalized(externalId, apiKey);
          return res.metadata || {};
        } catch {
          return {};
        }
      },
    });
  }

  /**
   * Register a dynamic third-party or built-in plugin adapter
   */
  public registerPlugin(plugin: PluginAdapter): void {
    if (!plugin || !plugin.id) {
      throw new Error('Invalid plugin adapter: missing id');
    }
    this.plugins.set(plugin.id, plugin);
  }

  /**
   * Unregister a plugin by ID
   */
  public unregisterPlugin(id: string): boolean {
    return this.plugins.delete(id);
  }

  /**
   * Get a plugin adapter by ID
   */
  public getPlugin(id: string): PluginAdapter | undefined {
    return this.plugins.get(id);
  }

  /**
   * Get all registered plugins supporting a specific resource type
   */
  public getPluginsForType(type: ResourceType): PluginAdapter[] {
    return Array.from(this.plugins.values()).filter((p) => p.supportedTypes.includes(type));
  }

  /**
   * List all registered plugins
   */
  public getAllPlugins(): PluginAdapter[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Execute federated catalog searches across all matching registered plugins
   */
  public async searchAllPlugins(
    query: string,
    type?: ResourceType,
    apiKeys?: Record<string, string>
  ): Promise<PluginSearchResult[]> {
    if (!query || !query.trim()) return [];

    const targetPlugins = type ? this.getPluginsForType(type) : this.getAllPlugins();
    const searchPromises = targetPlugins.map(async (plugin) => {
      try {
        const key = apiKeys ? apiKeys[plugin.id] : undefined;
        return await plugin.search(query, type, key);
      } catch (err) {
        console.warn(`Plugin '${plugin.name}' search failed:`, err);
        return [];
      }
    });

    const resultsArray = await Promise.all(searchPromises);
    return resultsArray.flat();
  }
}

export const pluginRegistry = PluginRegistry.getInstance();
