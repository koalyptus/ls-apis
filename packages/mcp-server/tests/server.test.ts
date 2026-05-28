import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  formatApiEntry,
  getListToolsResult,
  handleCallTool,
  getListResourcesResult,
  handleReadResource,
} from '../src/server';

vi.mock('../src/data', () => {
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

describe('formatApiEntry', () => {
  it('extracts relevant fields from an API entry', () => {
    const api = {
      name: 'Test API',
      description: 'A test',
      link: 'https://test.com',
      auth: 'apiKey',
      cors: 'yes',
      categories: ['test'],
      openapiSpec: null,
      sources: ['source'],
    };
    expect(formatApiEntry(api)).toEqual({
      name: 'Test API',
      description: 'A test',
      link: 'https://test.com',
      auth: 'apiKey',
      cors: 'yes',
      categories: ['test'],
      sources: ['source'],
    });
  });
});

describe('getListToolsResult', () => {
  it('returns search-apis, list-categories, and list-providers tool definitions', () => {
    const result = getListToolsResult();
    expect(result.tools).toHaveLength(3);
    expect(result.tools[0].name).toBe('search-apis');
    expect(result.tools[0].inputSchema.properties).toHaveProperty('query');
    expect(result.tools[0].inputSchema.properties).toHaveProperty('category');
    expect(result.tools[0].inputSchema.properties).toHaveProperty('auth');
    expect(result.tools[0].inputSchema.properties).toHaveProperty('limit');
    expect(result.tools[1].name).toBe('list-categories');
    expect(result.tools[2].name).toBe('list-providers');
  });
});

describe('handleCallTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns results for a query', async () => {
    const result = await handleCallTool({ name: 'search-apis', arguments: { query: 'weather' } });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.total).toBe(1);
    expect(parsed.results[0].name).toBe('Weather API');
  });

  it('returns all results with default limit', async () => {
    const result = await handleCallTool({ name: 'search-apis' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.total).toBe(2);
  });

  it('returns categories via list-categories tool', async () => {
    const result = await handleCallTool({ name: 'list-categories' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.total).toBe(2);
    expect(parsed.categories[0].name).toBe('weather');
    expect(parsed.categories[0].count).toBe(1);
  });

  it('returns providers via list-providers tool', async () => {
    const result = await handleCallTool({ name: 'list-providers' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.total).toBe(2);
    expect(parsed.providers[0].name).toBe('source-a');
    expect(parsed.providers[0].count).toBe(2);
  });

  it('throws for unknown tool', async () => {
    await expect(handleCallTool({ name: 'unknown-tool' })).rejects.toThrow('Unknown tool');
  });
});

describe('getListResourcesResult', () => {
  it('returns data, categories, providers, and stats resources', () => {
    const result = getListResourcesResult();
    expect(result.resources).toHaveLength(4);
    expect(result.resources[0].uri).toBe('apis://data');
    expect(result.resources[1].uri).toBe('apis://categories');
    expect(result.resources[2].uri).toBe('apis://providers');
    expect(result.resources[3].uri).toBe('apis://stats');
  });
});

describe('handleReadResource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns full dataset for apis://data', async () => {
    const result = await handleReadResource('apis://data');
    const parsed = JSON.parse(result.contents[0].text);
    expect(parsed.providers).toHaveLength(2);
    expect(parsed.apis).toHaveLength(2);
  });

  it('returns categories for apis://categories', async () => {
    const result = await handleReadResource('apis://categories');
    const parsed = JSON.parse(result.contents[0].text);
    expect(parsed.total).toBe(2);
    expect(parsed.categories[0].name).toBe('weather');
  });

  it('returns providers for apis://providers', async () => {
    const result = await handleReadResource('apis://providers');
    const parsed = JSON.parse(result.contents[0].text);
    expect(parsed.total).toBe(2);
    expect(parsed.providers[0].name).toBe('source-a');
    expect(parsed.providers[0].count).toBe(2);
  });

  it('returns stats for apis://stats', async () => {
    const result = await handleReadResource('apis://stats');
    const parsed = JSON.parse(result.contents[0].text);
    expect(parsed.totalApis).toBe(2);
    expect(parsed.totalCategories).toBe(2);
  });

  it('throws for unknown resource', async () => {
    await expect(handleReadResource('apis://unknown')).rejects.toThrow('Unknown resource');
  });
});
