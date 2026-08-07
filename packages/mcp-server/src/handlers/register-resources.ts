import type { McpServer } from '@modelcontextprotocol/server';
import { getApis, getProviders, getStats, getCategories, getProviderCounts } from '../data';
import { ResourceUri } from '../types';

const JSON_MIME = 'application/json';

/** Build a single-item JSON resource result. */
function jsonResource(uri: string, payload: unknown) {
  return {
    contents: [{ uri, mimeType: JSON_MIME, text: JSON.stringify(payload, null, 2) }],
  };
}

/**
 * Registers every ls-apis resource on the given server.
 * Must be called before `server.connect()`.
 */
export function registerResources(server: McpServer): void {
  server.registerResource(
    'Full API Dataset',
    ResourceUri.Data,
    {
      description: 'Complete aggregated API dataset with all entries',
      mimeType: JSON_MIME,
    },
    async (uri) => {
      const [apis, providers] = await Promise.all([getApis(), getProviders()]);
      return jsonResource(uri.href, { providers, apis });
    }
  );

  server.registerResource(
    'API Categories',
    ResourceUri.Categories,
    {
      description: 'All API categories with the count of APIs in each',
      mimeType: JSON_MIME,
    },
    async (uri) => {
      const categories = await getCategories();
      return jsonResource(uri.href, { total: categories.length, categories });
    }
  );

  server.registerResource(
    'API Providers',
    ResourceUri.Providers,
    {
      description: 'All data providers with the number of APIs contributed by each',
      mimeType: JSON_MIME,
    },
    async (uri) => {
      const providers = await getProviderCounts();
      return jsonResource(uri.href, { total: providers.length, providers });
    }
  );

  server.registerResource(
    'Dataset Statistics',
    ResourceUri.Stats,
    { description: 'Summary statistics about the API dataset', mimeType: JSON_MIME },
    async (uri) => jsonResource(uri.href, await getStats())
  );
}