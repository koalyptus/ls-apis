import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { search } from '@ls-apis/shared/search';
import { loadConfig } from '@ls-apis/shared/config';
import { getApis, getCategories, getProviderCounts } from '../data';
import { ToolName } from '../types';
import type { CallToolParams } from './types';

export async function handleCallTool(params: CallToolParams): Promise<CallToolResult> {
  if (params.name === ToolName.ListCategories) {
    const categories = await getCategories();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ total: categories.length, categories }, null, 2) as string,
        },
      ],
    };
  }

  if (params.name === ToolName.ListProviders) {
    const providers = await getProviderCounts();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ total: providers.length, providers }, null, 2) as string,
        },
      ],
    };
  }

  if (params.name !== ToolName.SearchApis) {
    throw new Error(`Unknown tool: ${params.name}`);
  }

  const args = params.arguments ?? {};
  const query = typeof args.query === 'string' ? args.query : undefined;
  const category = typeof args.category === 'string' ? args.category : undefined;
  const auth = typeof args.auth === 'string' ? args.auth : undefined;
  const limit = typeof args.limit === 'number' ? args.limit : (await loadConfig()).limit;

  const apis = await getApis();
  const results = search(apis, { query, category, auth, limit });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            total: results.length,
            results,
          },
          null,
          2
        ) as string,
      },
    ],
  };
}
