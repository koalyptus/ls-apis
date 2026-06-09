import { describe, it, expect } from 'vitest';
import { search, getCategories, getProviders } from '../src/search.js';
import type { ApiEntry } from '../src/types.js';

const mockApis: ApiEntry[] = [
  {
    name: 'Weather API',
    description: 'Real-time weather data',
    link: 'https://weather.com',
    categories: ['weather', 'environment'],
    auth: 'apiKey',
    cors: null,
    openapiSpec: null,
    sources: ['test-source'],
  },
  {
    name: 'Finance API',
    description: 'Stock market data and analysis',
    link: 'https://finance.com',
    categories: ['finance'],
    auth: 'OAuth',
    cors: null,
    openapiSpec: null,
    sources: ['test-source'],
  },
  {
    name: 'Pet Store API',
    description: 'Cute pet photos and adoption info',
    link: 'https://pets.com',
    categories: ['animals', 'entertainment'],
    auth: null,
    cors: null,
    openapiSpec: null,
    sources: ['another-source'],
  },
  {
    name: 'No Auth API',
    description: 'Public data access',
    link: 'https://noauth.com',
    categories: ['data'],
    auth: 'no',
    cors: null,
    openapiSpec: null,
    sources: ['test-source'],
  },
];

describe('search', () => {
  it('returns all apis when no filters', () => {
    const results = search(mockApis, {});
    expect(results).toHaveLength(4);
  });

  it('filters by query matching name', () => {
    const results = search(mockApis, { query: 'weather' });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Weather API');
  });

  it('filters by query matching description', () => {
    const results = search(mockApis, { query: 'stock' });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Finance API');
  });

  it('filters by query case-insensitively', () => {
    const results = search(mockApis, { query: 'WEATHER' });
    expect(results).toHaveLength(1);
  });

  it('filters by category exact match', () => {
    const results = search(mockApis, { category: 'finance' });
    expect(results).toHaveLength(1);
  });

  it('filters by category partial match', () => {
    const results = search(mockApis, { category: 'inan' });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Finance API');
  });

  it('filters by auth type apiKey', () => {
    const results = search(mockApis, { auth: 'apiKey' });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Weather API');
  });

  it('filters by auth type OAuth', () => {
    const results = search(mockApis, { auth: 'OAuth' });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Finance API');
  });

  it('filters for no auth', () => {
    const results = search(mockApis, { auth: 'no' });
    expect(results).toHaveLength(1);
    expect(results[0].auth).toBe('no');
  });

  it('does not match null auth when filtering for no', () => {
    const results = search(mockApis, { auth: 'no' });
    expect(results.every((r) => r.auth === 'no')).toBe(true);
  });

  it('combines query and category', () => {
    const results = search(mockApis, { query: 'weather', category: 'finance' });
    expect(results).toHaveLength(0);
  });

  it('combines query, category, and auth', () => {
    const results = search(mockApis, { query: 'no', category: 'data', auth: 'no' });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('No Auth API');
  });

  describe('sorting', () => {
    it('sorts by name ascending', () => {
      const results = search(mockApis, { sort: 'name' });
      expect(results[0].name).toBe('Finance API');
      expect(results[1].name).toBe('No Auth API');
      expect(results[2].name).toBe('Pet Store API');
      expect(results[3].name).toBe('Weather API');
    });

    it('sorts by category', () => {
      const results = search(mockApis, { sort: 'category' });
      expect(results[0].categories[0]).toBe('animals');
    });

    it('sorts by auth alphabetically', () => {
      const results = search(mockApis, { sort: 'auth' });
      const values = results.map((r) => r.auth ?? '');
      expect(values[0]).toBe('');
      expect(values[1]).toBe('apiKey');
      expect(values[2]).toBe('no');
      expect(values[3]).toBe('OAuth');
    });
  });

  // Note: `limit` is applied by the CLI after search, not in search() itself
});

describe('getCategories', () => {
  it('extracts unique categories with counts', () => {
    const categories = getCategories(mockApis);
    expect(categories.get('weather')).toBe(1);
    expect(categories.get('environment')).toBe(1);
    expect(categories.get('finance')).toBe(1);
    expect(categories.get('animals')).toBe(1);
    expect(categories.get('entertainment')).toBe(1);
    expect(categories.get('data')).toBe(1);
  });

  it('returns count of 2 for shared category', () => {
    const shared: ApiEntry[] = [
      mockApis[0],
      {
        name: 'Another Weather',
        description: null,
        link: 'https://example.com',
        categories: ['weather'],
        auth: null,
        cors: null,
        openapiSpec: null,
        sources: [],
      },
    ];
    const categories = getCategories(shared);
    expect(categories.get('weather')).toBe(2);
  });

  it('returns empty map for empty apis', () => {
    const categories = getCategories([]);
    expect(categories.size).toBe(0);
  });
});

describe('getProviders', () => {
  it('counts APIs per provider source', () => {
    const counts = getProviders(mockApis);
    expect(counts.get('test-source')).toBe(3);
    expect(counts.get('another-source')).toBe(1);
  });

  it('returns empty map for empty apis', () => {
    const counts = getProviders([]);
    expect(counts.size).toBe(0);
  });
});
