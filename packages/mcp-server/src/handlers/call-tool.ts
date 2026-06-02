import { search } from '@ls-apis/shared/search';
import { getApis, getCategories, getProviderCounts } from '../data';
import { ToolName } from '../types';

export interface CallToolParams {
  name: ToolName;
  arguments?: Record<string, unknown>;
}

export async function handleCallTool(params: CallToolParams) {
  if (params.name === ToolName.ListCategories) {
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

  if (params.name === ToolName.ListProviders) {
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

  if (params.name !== ToolName.SearchApis) {
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
