import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleReadResource } from '..';
import { ResourceUri } from '../../types';

vi.mock('../../data', () => {
  const mockApis = [
    {
      name: 'Weather API',
      description: 'Weather data',
      link: 'https://weather.com',
      auth: 'apiKey',
      cors: null,
      categories: ['weather'],
      openapiSpec: null,
      sources: ['source-a'],
    },
    {
      name: 'Finance API',
      description: 'Finance data',
      link: 'https://finance.com',
      auth: 'OAuth',
      cors: null,
      categories: ['finance'],
      openapiSpec: null,
      sources: ['source-b'],
    },
  ];

  return {
    getApis: vi.fn().mockResolvedValue(mockApis),
    getProviders: vi.fn().mockResolvedValue([
      { name: 'source-a', url: 'https://a.com' },
      { name: 'source-b', url: 'https://b.com' },
    ]),
    getStats: vi.fn().mockResolvedValue({ totalApis: 2, totalProviders: 2, totalCategories: 2 }),
    getCategories: vi.fn().mockResolvedValue([
      { name: 'weather', count: 1 },
      { name: 'finance', count: 1 },
    ]),
    getProviderCounts: vi.fn().mockResolvedValue([
      { name: 'source-a', count: 2 },
      { name: 'source-b', count: 1 },
    ]),
  };
});

describe('handleReadResource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns full dataset for apis://data', async () => {
    const result = await handleReadResource(ResourceUri.Data);
    const parsed = JSON.parse(result.contents[0].text as string);
    expect(parsed.providers).toHaveLength(2);
    expect(parsed.apis).toHaveLength(2);
  });

  it('returns categories for apis://categories', async () => {
    const result = await handleReadResource(ResourceUri.Categories);
    const parsed = JSON.parse(result.contents[0].text as string);
    expect(parsed.total).toBe(2);
    expect(parsed.categories[0].name).toBe('weather');
  });

  it('returns providers for apis://providers', async () => {
    const result = await handleReadResource(ResourceUri.Providers);
    const parsed = JSON.parse(result.contents[0].text as string);
    expect(parsed.total).toBe(2);
    expect(parsed.providers[0].name).toBe('source-a');
    expect(parsed.providers[0].count).toBe(2);
  });

  it('returns stats for apis://stats', async () => {
    const result = await handleReadResource(ResourceUri.Stats);
    const parsed = JSON.parse(result.contents[0].text as string);
    expect(parsed.totalApis).toBe(2);
    expect(parsed.totalCategories).toBe(2);
  });

  it('throws for unknown resource', async () => {
    await expect(handleReadResource('apis://unknown' as ResourceUri)).rejects.toThrow(
      'Unknown resource'
    );
  });
});
