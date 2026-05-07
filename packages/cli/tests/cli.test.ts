import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { search } from '../src/search';
import { formatText, formatJson, formatResults } from '../src/formatter';
import { initColors, setColors, color } from '../src/colors';
import type { ApiEntry } from '../src/types';

const mockApis: ApiEntry[] = [
  {
    name: 'Weather API',
    description: 'Weather data',
    link: 'https://example.com',
    categories: ['weather'],
    auth: 'apiKey',
    cors: null,
    openapiSpec: null,
    sources: ['test'],
  },
  {
    name: 'Weather2 API',
    description: 'More weather',
    link: 'https://example2.com',
    categories: ['weather'],
    auth: 'apiKey',
    cors: null,
    openapiSpec: null,
    sources: ['test'],
  },
  {
    name: 'Weather3 API',
    description: 'Even more weather',
    link: 'https://example3.com',
    categories: ['weather'],
    auth: 'oauth',
    cors: null,
    openapiSpec: null,
    sources: ['test'],
  },
  {
    name: 'Other API',
    description: 'Something else',
    link: 'https://example4.com',
    categories: ['data'],
    auth: undefined,
    cors: null,
    openapiSpec: null,
    sources: ['test'],
  },
];

describe('search', () => {
  it('filters by query', () => {
    const results = search(mockApis, { query: 'weather' });
    expect(results).toHaveLength(3);
  });

  it('filters by category', () => {
    const results = search(mockApis, { category: 'weather' });
    expect(results).toHaveLength(3);
  });

  it('filters by auth', () => {
    const results = search(mockApis, { auth: 'apiKey' });
    expect(results).toHaveLength(2);
  });

  it('filters for no auth', () => {
    const results = search(mockApis, { auth: 'no' });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Other API');
  });

  it('combines query and category', () => {
    const results = search(mockApis, { query: 'weather', category: 'data' });
    expect(results).toHaveLength(0);
  });

  it('combines all filters', () => {
    const results = search(mockApis, { query: 'weather', category: 'weather', auth: 'apiKey' });
    expect(results).toHaveLength(2);
  });

  it('returns all apis when no filters', () => {
    const results = search(mockApis, {});
    expect(results).toHaveLength(4);
  });

  describe('sorting', () => {
    it('sorts by name ascending', () => {
      const results = search(mockApis, { sort: 'name' });
      expect(results[0].name).toBe('Other API');
      expect(results[1].name).toBe('Weather API');
      expect(results[2].name).toBe('Weather2 API');
      expect(results[3].name).toBe('Weather3 API');
    });

    it('sorts by category', () => {
      const results = search(mockApis, { sort: 'category' });
      expect(results[0].categories[0]).toBe('data');
    });

    it('sorts by auth', () => {
      const results = search(mockApis, { sort: 'auth' });
      const noAuth = results.find((r) => !r.auth);
      expect(noAuth).toBeDefined();
    });
  });
});

describe('formatter', () => {
  describe('formatText', () => {
    it('formats results with header', () => {
      const output = formatText(mockApis, mockApis.length, 10, {});
      expect(output).toContain('Found 4 APIs:');
    });

    it('includes API details', () => {
      const output = formatText(mockApis, mockApis.length, 10, {});
      expect(output).toContain('Weather API');
      expect(output).toContain('Weather data');
      expect(output).toContain('apiKey');
      expect(output).toContain('weather');
    });

    it('truncates long descriptions', () => {
      const longApi: ApiEntry[] = [
        {
          name: 'Long API',
          description: 'A'.repeat(300),
          link: 'https://example.com',
          categories: ['test'],
          auth: null,
          cors: null,
          openapiSpec: null,
          sources: ['test'],
        },
      ];
      const output = formatText(longApi, 1, 10, { descriptionMaxLength: 250 });
      expect(output).toContain('A'.repeat(250) + '...');
      expect(output).not.toContain('A'.repeat(251));
    });

    it('does not truncate short descriptions', () => {
      const shortApi: ApiEntry[] = [
        {
          name: 'Short API',
          description: 'Short description',
          link: 'https://example.com',
          categories: ['test'],
          auth: null,
          cors: null,
          openapiSpec: null,
          sources: ['test'],
        },
      ];
      const output = formatText(shortApi, 1, 10, { descriptionMaxLength: 250 });
      expect(output).toContain('Short description');
      expect(output).not.toContain('...');
    });

    it('shows "and X more" when results exceed limit', () => {
      const output = formatText(mockApis, mockApis.length, 2, {});
      expect(output).toContain('... and 2 more');
    });

    it('respects limit', () => {
      const output = formatText(mockApis, mockApis.length, 1, {});
      expect(output).toContain('Weather API');
      expect(output).not.toContain('Weather2 API');
    });
  });

  describe('formatJson', () => {
    it('returns valid JSON array', () => {
      const output = formatJson(mockApis, 10);
      const parsed = JSON.parse(output);
      expect(parsed).toHaveLength(4);
    });

    it('respects limit', () => {
      const output = formatJson(mockApis, 2);
      const parsed = JSON.parse(output);
      expect(parsed).toHaveLength(2);
    });
  });

  describe('formatResults', () => {
    it('routes to text format by default', () => {
      const output = formatResults(mockApis, mockApis.length, 10, {});
      expect(output).toContain('Found 4 APIs:');
    });

    it('routes to json format', () => {
      const output = formatResults(mockApis, mockApis.length, 10, { output: 'json' });
      const parsed = JSON.parse(output);
      expect(parsed).toHaveLength(4);
    });
  });
});

describe('colors', () => {
  beforeEach(() => {
    setColors(false);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('initColors with no-color disables colors', () => {
    initColors(true);
    expect(color.bold('test')).toBe('test');
    expect(color.cyan('test')).toBe('test');
  });

  it('initColors without no-color enables colors', () => {
    initColors(false);
    expect(color.bold('test')).not.toBe('test');
  });

  it('NO_COLOR environment variable disables colors', () => {
    vi.stubEnv('NO_COLOR', '1');
    initColors(false);
    expect(color.dim('test')).toBe('test');
  });

  it('colors return plain text when disabled', () => {
    setColors(false);
    expect(color.bold('hello')).toBe('hello');
    expect(color.cyan('hello')).toBe('hello');
    expect(color.green('hello')).toBe('hello');
    expect(color.yellow('hello')).toBe('hello');
  });
});
