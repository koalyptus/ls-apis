import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  loadData,
  getApis,
  getProviders,
  getStats,
  getCategories,
  getProviderCounts,
} from '../src/data';
import { readFile } from 'node:fs/promises';

const mockData = {
  timestamp: '2026-05-28T00:00:00.000Z',
  providers: [
    { name: 'source-a', url: 'https://a.com' },
    { name: 'source-b', url: 'https://b.com' },
  ],
  apis: [
    {
      name: 'API One',
      description: 'First API',
      link: 'https://api1.com',
      auth: 'apiKey',
      cors: null,
      categories: ['weather', 'data'],
      openapiSpec: null,
      sources: ['source-a'],
    },
    {
      name: 'API Two',
      description: 'Second API',
      link: 'https://api2.com',
      auth: null,
      cors: 'yes',
      categories: ['finance'],
      openapiSpec: null,
      sources: ['source-a', 'source-b'],
    },
  ],
};

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

describe('data', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockData));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadData', () => {
    it('loads and parses data file', async () => {
      const data = await loadData();
      expect(data.timestamp).toBe('2026-05-28T00:00:00.000Z');
      expect(data.providers).toHaveLength(2);
      expect(data.apis).toHaveLength(2);
    });
  });

  describe('getApis', () => {
    it('returns all API entries', async () => {
      const apis = await getApis();
      expect(apis).toHaveLength(2);
      expect(apis[0].name).toBe('API One');
    });
  });

  describe('getProviders', () => {
    it('returns all providers', async () => {
      const providers = await getProviders();
      expect(providers).toHaveLength(2);
      expect(providers[0].name).toBe('source-a');
    });
  });

  describe('getCategories', () => {
    it('returns categories sorted by count desc then name asc', async () => {
      const cats = await getCategories();
      expect(cats).toHaveLength(3);
      expect(cats[0].name).toBe('data');
      expect(cats[0].count).toBe(1);
    });

    it('includes all unique categories', async () => {
      const cats = await getCategories();
      const names = cats.map((c) => c.name).sort();
      expect(names).toEqual(['data', 'finance', 'weather']);
    });
  });

  describe('getProviderCounts', () => {
    it('returns provider counts sorted by count desc then name asc', async () => {
      const providers = await getProviderCounts();
      expect(providers).toHaveLength(2);
      expect(providers[0].name).toBe('source-a');
      expect(providers[0].count).toBe(2);
    });

    it('includes all unique providers', async () => {
      const providers = await getProviderCounts();
      const names = providers.map((p) => p.name).sort();
      expect(names).toEqual(['source-a', 'source-b']);
    });
  });

  describe('getStats', () => {
    it('computes total APIs', async () => {
      const stats = await getStats();
      expect(stats.totalApis).toBe(2);
    });

    it('computes total providers', async () => {
      const stats = await getStats();
      expect(stats.totalProviders).toBe(2);
    });

    it('computes unique categories', async () => {
      const stats = await getStats();
      expect(stats.totalCategories).toBe(3);
    });
  });
});
