import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { run } from '../src/index';
import { search, getCategories } from '../src/search';
import { formatResults, formatList } from '../src/formatter';
import { initColors, color } from '../src/colors';
import type { ApiEntry } from '../src/types';
import * as fs from 'node:fs/promises';

vi.mock('../src/config', () => ({
  loadConfig: vi.fn().mockResolvedValue({
    limit: 20,
    descriptionMaxLength: 250,
    colors: true,
  }),
}));

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

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

  describe('getCategories', () => {
    it('extracts unique categories with counts', () => {
      const categories = getCategories(mockApis);
      expect(categories.get('weather')).toBe(3);
      expect(categories.get('data')).toBe(1);
    });

    it('handles apis with multiple categories', () => {
      const multiCatApi: ApiEntry[] = [
        {
          name: 'Multi API',
          description: 'Test',
          link: 'https://test.com',
          categories: ['weather', 'data', 'storage'],
          auth: null,
          cors: null,
          openapiSpec: null,
          sources: [],
        },
      ];
      const categories = getCategories(multiCatApi);
      expect(categories.get('weather')).toBe(1);
      expect(categories.get('data')).toBe(1);
      expect(categories.get('storage')).toBe(1);
    });
  });
});

describe('formatter', () => {
  describe('formatResults text output', () => {
    it('formats results with header', () => {
      const output = formatResults(mockApis, mockApis.length, 10, {});
      expect(output).toContain('Found 4 APIs:');
    });

    it('includes API details', () => {
      const output = formatResults(mockApis, mockApis.length, 10, {});
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
      const output = formatResults(longApi, 1, 10, { descriptionMaxLength: 250 });
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
      const output = formatResults(shortApi, 1, 10, { descriptionMaxLength: 250 });
      expect(output).toContain('Short description');
      expect(output).not.toContain('...');
    });

    it('shows "and X more" when results exceed limit', () => {
      const output = formatResults(mockApis, mockApis.length, 2, {});
      expect(output).toContain('... and 2 more');
    });

    it('respects limit', () => {
      const output = formatResults(mockApis, mockApis.length, 1, {});
      expect(output).toContain('Weather API');
      expect(output).not.toContain('Weather2 API');
    });
  });

  describe('formatResults json output', () => {
    it('returns valid JSON array', () => {
      const output = formatResults(mockApis, mockApis.length, 10, { output: 'json' });
      const parsed = JSON.parse(output);
      expect(parsed).toHaveLength(4);
    });

    it('respects limit', () => {
      const output = formatResults(mockApis, mockApis.length, 2, { output: 'json' });
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

  describe('formatList', () => {
    it('formats categories alphabetically by default', () => {
      const categories = new Map([
        ['weather', 3],
        ['data', 1],
        ['analytics', 2],
      ]);
      const output = formatList(categories, 'categories', {});
      expect(output).toContain('Found 3 categories:');
      expect(output).toContain('analytics');
      expect(output).toContain('data');
      expect(output).toContain('weather');
    });

    it('sorts by count when specified', () => {
      const categories = new Map([
        ['weather', 3],
        ['data', 1],
        ['analytics', 2],
      ]);
      const output = formatList(categories, 'categories', { sort: 'count' });
      const weatherIdx = output.indexOf('weather');
      const dataIdx = output.indexOf('data');
      const analyticsIdx = output.indexOf('analytics');
      expect(weatherIdx).toBeLessThan(analyticsIdx);
      expect(analyticsIdx).toBeLessThan(dataIdx);
    });

    it('outputs JSON when specified', () => {
      const categories = new Map([['weather', 3]]);
      const output = formatList(categories, 'categories', { output: 'json' });
      const parsed = JSON.parse(output);
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toEqual({ name: 'weather', count: 3 });
    });
  });
});

describe('colors', () => {
  beforeEach(() => {
    initColors(true);
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
    initColors(true);
    expect(color.bold('hello')).toBe('hello');
    expect(color.cyan('hello')).toBe('hello');
    expect(color.green('hello')).toBe('hello');
    expect(color.yellow('hello')).toBe('hello');
  });
});

describe('run', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.mocked(fs.readFile).mockImplementation((path: string) => {
      if (path.includes('package.json')) {
        return Promise.resolve('{"version": "0.0.0"}');
      }
      return Promise.resolve(
        JSON.stringify({
          timestamp: '2026-05-09T00:00:00Z',
          providers: [{ name: 'test', url: 'https://test.com' }],
          apis: mockApis,
        })
      );
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('outputs results for query', async () => {
    await run(['-q', 'weather']);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 3 APIs:'));
  });

  it('outputs json format', async () => {
    await run(['-q', 'weather', '-o', 'json']);
    const jsonCall = consoleLogSpy.mock.calls.find(
      (c) => typeof c[0] === 'string' && c[0].startsWith('[')
    );
    expect(jsonCall).toBeDefined();
    expect(JSON.parse(jsonCall![0] as string)).toHaveLength(3);
  });

  it('respects limit', async () => {
    await run(['-q', 'weather', '-l', '2']);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 3 APIs:'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('... and 1 more'));
  });

  it('filters by category', async () => {
    await run(['-c', 'data']);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 1 APIs:'));
  });

  it('filters by auth', async () => {
    await run(['-a', 'oauth']);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 1 APIs:'));
  });

  it('sorts results', async () => {
    await run(['-q', 'weather', '-s', 'name']);
    const output = consoleLogSpy.mock.calls.map((c) => c[0]).join('');
    expect(output.indexOf('Weather API')).toBeLessThan(output.indexOf('Weather2 API'));
  });

  describe('categories command', () => {
    it('lists categories alphabetically by default', async () => {
      await run(['categories']);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 2 categories:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('data'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('weather'));
    });

    it('sorts by count', async () => {
      await run(['categories', '--sort', 'count']);
      const output = consoleLogSpy.mock.calls.map((c) => c[0]).join('');
      const weatherIdx = output.indexOf('weather');
      const dataIdx = output.indexOf('data');
      expect(weatherIdx).toBeLessThan(dataIdx);
    });

    it('outputs JSON format', async () => {
      await run(['categories', '--output', 'json']);
      const jsonCall = consoleLogSpy.mock.calls.find(
        (c) => typeof c[0] === 'string' && c[0].startsWith('[')
      );
      expect(jsonCall).toBeDefined();
      const parsed = JSON.parse(jsonCall![0] as string);
      expect(parsed).toHaveLength(2);
      expect(parsed[0]).toHaveProperty('name');
      expect(parsed[0]).toHaveProperty('count');
    });
  });
});
