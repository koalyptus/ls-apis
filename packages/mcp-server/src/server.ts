import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { search } from '@ls-apis/shared/search';
import { getApis, getProviders, getStats, getCategories, getProviderCounts } from './data';
import { getVersion } from '@ls-apis/shared/data';

export function getListToolsResult() {
  return {
    tools: [
      {
        name: 'search-apis',
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
        name: 'list-categories',
        description:
          'List all API categories with the count of APIs in each, sorted by popularity.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'list-providers',
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

export interface CallToolParams {
  name: string;
  arguments?: Record<string, unknown>;
}

export async function handleCallTool(params: CallToolParams) {
  if (params.name === 'list-categories') {
    const categories = await getCategories();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ total: categories.length, categories }, null, 2),
        },
      ],
    };
  }

  if (params.name === 'list-providers') {
    const providers = await getProviderCounts();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ total: providers.length, providers }, null, 2),
        },
      ],
    };
  }

  if (params.name !== 'search-apis') {
    throw new Error(`Unknown tool: ${params.name}`);
  }

  const args = params.arguments ?? {};
  const query = typeof args.query === 'string' ? args.query : undefined;
  const category = typeof args.category === 'string' ? args.category : undefined;
  const auth = typeof args.auth === 'string' ? args.auth : undefined;
  const limit = typeof args.limit === 'number' ? args.limit : 20;

  const apis = await getApis();
  const results = search(apis, { query, category, auth, limit });

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(
          {
            total: results.length,
            results,
          },
          null,
          2
        ),
      },
    ],
  };
}

export function getListResourcesResult() {
  return {
    resources: [
      {
        uri: 'apis://data',
        name: 'Full API Dataset',
        description: 'Complete aggregated API dataset with all entries',
        mimeType: 'application/json',
      },
      {
        uri: 'apis://categories',
        name: 'API Categories',
        description: 'All API categories with the count of APIs in each',
        mimeType: 'application/json',
      },
      {
        uri: 'apis://providers',
        name: 'API Providers',
        description: 'All data providers with the count of APIs contributed by each',
        mimeType: 'application/json',
      },
      {
        uri: 'apis://stats',
        name: 'Dataset Statistics',
        description: 'Summary statistics about the API dataset',
        mimeType: 'application/json',
      },
    ],
  };
}

export async function handleReadResource(uri: string) {
  if (uri === 'apis://data') {
    const apis = await getApis();
    const providers = await getProviders();
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ providers, apis }, null, 2),
        },
      ],
    };
  }

  if (uri === 'apis://categories') {
    const categories = await getCategories();
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ total: categories.length, categories }, null, 2),
        },
      ],
    };
  }

  if (uri === 'apis://providers') {
    const providers = await getProviderCounts();
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ total: providers.length, providers }, null, 2),
        },
      ],
    };
  }

  if (uri === 'apis://stats') {
    const stats = await getStats();
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(stats, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
}

export async function startServer(): Promise<void> {
  const version = await getVersion(import.meta.url);
  const server = new Server(
    {
      name: 'ls-apis-mcp',
      version,
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, getListToolsResult);
  server.setRequestHandler(CallToolRequestSchema, async (request) =>
    handleCallTool(request.params)
  );
  server.setRequestHandler(ListResourcesRequestSchema, getListResourcesResult);
  server.setRequestHandler(ReadResourceRequestSchema, async (request) =>
    handleReadResource(request.params.uri)
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
