import { describe, it, expect, vi } from 'vitest';
import { createTestServer, getTextContent } from './helpers';
import { registerTools } from '../register-tools';
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

describe('registerTools', () => {
  it('exposes search-apis, list-categories and list-providers over the protocol', async () => {
    const { client } = await createTestServer(registerTools);
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(
      [ToolName.SearchApis, ToolName.ListCategories, ToolName.ListProviders].sort()
    );
  });

  it('publishes a JSON Schema for search-apis arguments', async () => {
    const { client } = await createTestServer(registerTools);
    const { tools } = await client.listTools();
    const search = tools.find((t) => t.name === ToolName.SearchApis);
    expect(search?.inputSchema.properties).toHaveProperty('query');
    expect(search?.inputSchema.properties).toHaveProperty('category');
    expect(search?.inputSchema.properties).toHaveProperty('auth');
    expect(search?.inputSchema.properties).toHaveProperty('limit');
  });

  it('returns results for a query', async () => {
    const { client } = await createTestServer(registerTools);
    const result = await client.callTool({
      name: ToolName.SearchApis,
      arguments: { query: 'weather' },
    });
    const parsed = JSON.parse(getTextContent(result));
    expect(parsed.total).toBe(1);
    expect(parsed.results[0].name).toBe('Weather API');
  });

  it('returns all results with default limit', async () => {
    const { client } = await createTestServer(registerTools);
    const result = await client.callTool({ name: ToolName.SearchApis, arguments: {} });
    const parsed = JSON.parse(getTextContent(result));
    expect(parsed.total).toBe(2);
  });

  it('returns categories via list-categories tool', async () => {
    const { client } = await createTestServer(registerTools);
    const result = await client.callTool({ name: ToolName.ListCategories, arguments: {} });
    const parsed = JSON.parse(getTextContent(result));
    expect(parsed.total).toBe(2);
    expect(parsed.categories[0].name).toBe('weather');
    expect(parsed.categories[0].count).toBe(1);
  });

  it('returns providers via list-providers tool', async () => {
    const { client } = await createTestServer(registerTools);
    const result = await client.callTool({ name: ToolName.ListProviders, arguments: {} });
    const parsed = JSON.parse(getTextContent(result));
    expect(parsed.total).toBe(2);
    expect(parsed.providers[0].name).toBe('source-a');
    expect(parsed.providers[0].count).toBe(2);
  });

  it('rejects an unknown tool', async () => {
    const { client } = await createTestServer(registerTools);
    await expect(client.callTool({ name: 'not-a-tool', arguments: {} })).rejects.toThrow(
      /not-a-tool|not found|Unknown/i
    );
  });

  it('rejects a wrongly-typed argument', async () => {
    const { client } = await createTestServer(registerTools);
    const result = await client.callTool({
      name: ToolName.SearchApis,
      arguments: { limit: 'not-a-number' },
    });
    expect(result.isError).toBe(true);
    expect(getTextContent(result)).toMatch(/Input validation error/i);
  });
});
