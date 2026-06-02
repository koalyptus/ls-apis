import { ToolName } from '../types';

export function getListToolsResult() {
  return {
    tools: [
      {
        name: ToolName.SearchApis,
        description:
          'Search public APIs from the ls-apis dataset. Filter by query, category, auth type, and limit results.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search term to match against API names and descriptions',
            },
            category: {
              type: 'string',
              description: 'Filter by category (e.g., weather, finance, animals)',
            },
            auth: {
              type: 'string',
              description: 'Filter by authentication type: apiKey, OAuth, or no',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return (default: 20)',
            },
          },
        },
      },
      {
        name: ToolName.ListCategories,
        description:
          'List all API categories with the count of APIs in each, sorted by popularity.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: ToolName.ListProviders,
        description:
          'List all data providers with the count of APIs contributed by each, sorted by popularity.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
}
