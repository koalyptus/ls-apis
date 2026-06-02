import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleCallTool } from '..';
import { ToolName } from '../../types';

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

describe('handleCallTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns results for a query', async () => {
    const result = await handleCallTool({
      name: ToolName.SearchApis,
      arguments: { query: 'weather' },
    });
    const parsed = JSON.parse(result.content[0].text as string);
    expect(parsed.total).toBe(1);
    expect(parsed.results[0].name).toBe('Weather API');
  });

  it('returns all results with default limit', async () => {
    const result = await handleCallTool({ name: ToolName.SearchApis });
    const parsed = JSON.parse(result.content[0].text as string);
    expect(parsed.total).toBe(2);
  });

  it('returns categories via list-categories tool', async () => {
    const result = await handleCallTool({ name: ToolName.ListCategories });
    const parsed = JSON.parse(result.content[0].text as string);
    expect(parsed.total).toBe(2);
    expect(parsed.categories[0].name).toBe('weather');
    expect(parsed.categories[0].count).toBe(1);
  });

  it('returns providers via list-providers tool', async () => {
    const result = await handleCallTool({ name: ToolName.ListProviders });
    const parsed = JSON.parse(result.content[0].text as string);
    expect(parsed.total).toBe(2);
    expect(parsed.providers[0].name).toBe('source-a');
    expect(parsed.providers[0].count).toBe(2);
  });

  it('throws for unknown tool', async () => {
    await expect(handleCallTool({ name: 'unknown-tool' as ToolName })).rejects.toThrow(
      'Unknown tool'
    );
  });
});
