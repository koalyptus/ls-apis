import type { ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';
import { getApis, getProviders, getStats, getCategories, getProviderCounts } from '../data';
import { ResourceUri } from '../types';

export async function handleReadResource(uri: ResourceUri): Promise<ReadResourceResult> {
  if (uri === ResourceUri.Data) {
    const apis = await getApis();
    const providers = await getProviders();
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ providers, apis }, null, 2) as string,
        },
      ],
    };
  }

  if (uri === ResourceUri.Categories) {
    const categories = await getCategories();
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ total: categories.length, categories }, null, 2) as string,
        },
      ],
    };
  }

  if (uri === ResourceUri.Providers) {
    const providers = await getProviderCounts();
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ total: providers.length, providers }, null, 2) as string,
        },
      ],
    };
  }

  if (uri === ResourceUri.Stats) {
    const stats = await getStats();
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(stats, null, 2) as string,
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
}
