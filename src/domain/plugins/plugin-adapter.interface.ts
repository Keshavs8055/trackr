import { ResourceType, SearchResult } from '@/types';

export interface PluginSearchResult extends SearchResult {
  pluginId: string;
  sourceProvider: string;
}

export interface PluginAdapter {
  /** Unique identifier of the plugin adapter */
  id: string;
  /** Display name of the provider plugin */
  name: string;
  /** Version of the plugin implementation */
  version: string;
  /** Optional author/organization */
  author?: string;
  /** Description of provider capabilities */
  description?: string;
  /** Resource types handled by this plugin */
  supportedTypes: ResourceType[];

  /**
   * Search external provider catalog for resources matching query
   */
  search(query: string, type?: ResourceType, apiKey?: string): Promise<PluginSearchResult[]>;

  /**
   * Fetch rich catalog details for a specific external resource ID
   */
  fetchDetails(externalId: string, apiKey?: string): Promise<Record<string, unknown>>;

  /**
   * Optional connection check to verify API credentials
   */
  testConnection?(apiKey?: string): Promise<boolean>;
}
