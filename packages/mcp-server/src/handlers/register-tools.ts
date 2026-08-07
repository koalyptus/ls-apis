import type { McpServer } from '@modelcontextprotocol/server';
import { search } from '@ls-apis/shared/search';
import { loadConfig } from '@ls-apis/shared/config';
import { getApis, getCategories, getProviderCounts } from '../data';
import { ToolName } from '../types';
import { SearchApisInput, ListCategoriesInput, ListProvidersInput } from '../schemas';

/** JSON stringification shared by every tool response. */
function jsonContent(payload: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }] };
}

/**
 * Registers every ls-apis tool on the given server.
 * Must be called before `server.connect()`.
 */
export function registerTools(server: McpServer): void {
  server.registerTool(
    ToolName.SearchApis,
    {
      description:
        'Search public APIs from the ls-apis dataset. Filter by query, category, auth type, and limit results.',
      inputSchema: SearchApisInput,
    },
    async ({ query, category, auth, limit }) => {
      const effectiveLimit = limit ?? (await loadConfig()).limit;
      const apis = await getApis();
      // shared `search()` only filters/sorts — apply the tool's own `limit` here.
      const results = search(apis, { query, category, auth, limit: effectiveLimit }).slice(
        0,
        effectiveLimit
      );
      return jsonContent({ total: results.length, results });
    }
  );

  server.registerTool(
    ToolName.ListCategories,
    {
      description: 'List all API categories with the count of APIs in each, sorted by popularity.',
      inputSchema: ListCategoriesInput,
    },
    async () => {
      const categories = await getCategories();
      return jsonContent({ total: categories.length, categories });
    }
  );

  server.registerTool(
    ToolName.ListProviders,
    {
      description:
        'List all data providers with the number of APIs contributed by each, sorted by popularity.',
      inputSchema: ListProvidersInput,
    },
    async () => {
      const providers = await getProviderCounts();
      return jsonContent({ total: providers.length, providers });
    }
  );
}
