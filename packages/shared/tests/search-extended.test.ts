import { describe, it, expect } from 'vitest';
import { search, getCategories, getProviders } from '../src/search.js';
import type { ApiEntry } from '../src/types.js';

describe('search - extended edge cases', () => {
  const mockApis: ApiEntry[] = [
    {
      name: 'Weather API',
      description: 'Real-time weather data',
      link: 'https://weather.com',
      categories: ['weather', 'environment'],
      auth: 'apiKey',
      cors: 'yes',
      openapiSpec: 'https://spec.com',
      sources: ['source-a'],
    },
    {
      name: 'Finance API',
      description: 'Stock market data and analysis',
      link: 'https://finance.com',
      categories: ['finance', 'business'],
      auth: 'OAuth',
      cors: null,
      openapiSpec: null,
      sources: ['source-b'],
    },
    {
      name: 'Pet Store API',
      description: 'Cute pet photos and adoption info',
      link: 'https://pets.com',
      categories: ['animals', 'entertainment'],
      auth: null,
      cors: null,
      openapiSpec: null,
      sources: ['source-c'],
    },
    {
      name: 'No Auth API',
      description: 'Public data access',
      link: 'https://noauth.com',
      categories: ['data'],
      auth: 'no',
      cors: null,
      openapiSpec: null,
      sources: ['source-a'],
    },
  ];

  it('handles empty apis array', () => {
    const results = search([], { query: 'test' });
    expect(results).toHaveLength(0);
  });

  it('handles empty query string', () => {
    const results = search(mockApis, { query: '' });
    expect(results).toHaveLength(4);
  });

  it('handles query that matches nothing', () => {
    const results = search(mockApis, { query: 'nonexistent' });
    expect(results).toHaveLength(0);
  });

  it('handles case-insensitive query in description', () => {
    const results = search(mockApis, { query: 'REAL-TIME' });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Weather API');
  });

  it('handles query matching partial name', () => {
    const results = search(mockApis, { query: 'Weather' });
    expect(results).toHaveLength(1);
  });

  it('handles query matching partial description', () => {
    const results = search(mockApis, { query: 'stock' });
    expect(results).toHaveLength(1);
  });

  it('handles null description without error', () => {
    const apis: ApiEntry[] = [
      {
        name: 'A',
        description: null,
        link: 'https://a.com',
        categories: ['c'],
        auth: null,
        cors: null,
        openapiSpec: null,
        sources: [],
      },
    ];
    const results = search(apis, { query: 'test' });
    expect(results).toHaveLength(0);
  });

  it('handles empty category string', () => {
    const results = search(mockApis, { category: '' });
    expect(results).toHaveLength(4);
  });

  it('handles category that matches nothing', () => {
    const results = search(mockApis, { category: 'nonexistent' });
    expect(results).toHaveLength(0);
  });

  it('handles empty auth string', () => {
    const results = search(mockApis, { auth: '' });
    expect(results).toHaveLength(4);
  });

  it('handles auth that matches nothing', () => {
    const results = search(mockApis, { auth: 'nonexistent' });
    expect(results).toHaveLength(0);
  });

  it('handles invalid sort gracefully (default case)', () => {
    const results = search(mockApis, { sort: 'invalid' as 'name' });
    expect(results).toHaveLength(4);
  });

  it('does not mutate input array when sorting', () => {
    const original = [...mockApis];
    search(mockApis, { sort: 'name' });
    expect(mockApis).toEqual(original);
  });

  it('returns same reference for unsorted results (no mutation)', () => {
    const results1 = search(mockApis, {});
    const results2 = search(mockApis, {});
    expect(results1).toBe(results2);
  });

  it('handles apis with no categories', () => {
    const apis: ApiEntry[] = [
      {
        name: 'A',
        description: null,
        link: 'https://a.com',
        categories: [],
        auth: null,
        cors: null,
        openapiSpec: null,
        sources: [],
      },
    ];
    const results = search(apis, { category: 'test' });
    expect(results).toHaveLength(0);
  });

  it('handles apis with no sources', () => {
    const apis: ApiEntry[] = [
      {
        name: 'A',
        description: null,
        link: 'https://a.com',
        categories: ['c'],
        auth: null,
        cors: null,
        openapiSpec: null,
        sources: [],
      },
    ];
    const results = search(apis, {});
    expect(results).toHaveLength(1);
  });
});

describe('getCategories - extended', () => {
  it('handles empty apis array', () => {
    const categories = getCategories([]);
    expect(categories.size).toBe(0);
  });

  it('handles apis with empty categories arrays', () => {
    const apis: ApiEntry[] = [
      {
        name: 'A',
        description: null,
        link: 'https://a.com',
        categories: [],
        auth: null,
        cors: null,
        openapiSpec: null,
        sources: [],
      },
    ];
    const categories = getCategories(apis);
    expect(categories.size).toBe(0);
  });

  it('counts multiple apis with same category', () => {
    const apis: ApiEntry[] = [
      {
        name: 'A',
        description: null,
        link: 'https://a.com',
        categories: ['c1'],
        auth: null,
        cors: null,
        openapiSpec: null,
        sources: [],
      },
      {
        name: 'B',
        description: null,
        link: 'https://b.com',
        categories: ['c1'],
        auth: null,
        cors: null,
        openapiSpec: null,
        sources: [],
      },
      {
        name: 'C',
        description: null,
        link: 'https://c.com',
        categories: ['c1'],
        auth: null,
        cors: null,
        openapiSpec: null,
        sources: [],
      },
    ];
    const categories = getCategories(apis);
    expect(categories.get('c1')).toBe(3);
  });
});

describe('getProviders - extended', () => {
  it('handles empty apis array', () => {
    const counts = getProviders([]);
    expect(counts.size).toBe(0);
  });

  it('handles apis with empty sources arrays', () => {
    const apis: ApiEntry[] = [
      {
        name: 'A',
        description: null,
        link: 'https://a.com',
        categories: [],
        auth: null,
        cors: null,
        openapiSpec: null,
        sources: [],
      },
    ];
    const counts = getProviders(apis);
    expect(counts.size).toBe(0);
  });

  it('counts multiple apis from same source', () => {
    const apis: ApiEntry[] = [
      {
        name: 'A',
        description: null,
        link: 'https://a.com',
        categories: [],
        auth: null,
        cors: null,
        openapiSpec: null,
        sources: ['s1'],
      },
      {
        name: 'B',
        description: null,
        link: 'https://b.com',
        categories: [],
        auth: null,
        cors: null,
        openapiSpec: null,
        sources: ['s1'],
      },
      {
        name: 'C',
        description: null,
        link: 'https://c.com',
        categories: [],
        auth: null,
        cors: null,
        openapiSpec: null,
        sources: ['s2'],
      },
    ];
    const counts = getProviders(apis);
    expect(counts.get('s1')).toBe(2);
    expect(counts.get('s2')).toBe(1);
  });
});
