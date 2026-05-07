import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { search } from '../src/index';
import { initColors, setColors, color } from '../src/colors';
import { readFile } from 'node:fs/promises';

vi.mock('../src/config', () => ({
  loadConfig: vi.fn().mockResolvedValue({
    limit: 20,
    descriptionMaxLength: 250,
    colors: true,
  }),
  CONFIG_DEFAULTS: {
    limit: 20,
    descriptionMaxLength: 250,
    colors: true,
  },
}));

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn().mockImplementation((path: string) => {
    if (path.includes('package.json')) {
      return Promise.resolve('{"version": "0.0.0"}');
    }
    return Promise.resolve(JSON.stringify([]));
  }),
}));

const mockApis = [
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

describe('ls-apis CLI', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockApis));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('search', () => {
    it('searches by query', async () => {
      await search({ query: 'weather', limit: 3 });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 3 APIs:'));
    });

    it('filters by category', async () => {
      await search({ category: 'weather', limit: 3 });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 3 APIs:'));
    });

    it('filters by auth', async () => {
      await search({ auth: 'apiKey', limit: 3 });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 2 APIs:'));
    });

    it('filters for no auth', async () => {
      await search({ auth: 'no', limit: 3 });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 1 APIs:'));
    });

    it('respects limit option', async () => {
      await search({ query: 'weather', limit: 2 });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 3 APIs:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('... and 1 more'));
    });

    it('outputs json format', async () => {
      await search({ query: 'weather', limit: 2, output: 'json' });
      const jsonCall = consoleLogSpy.mock.calls.find(
        (c) => typeof c[0] === 'string' && c[0].startsWith('[')
      );
      expect(jsonCall).toBeDefined();
      const parsed = JSON.parse(jsonCall![0] as string);
      expect(parsed).toHaveLength(2);
    });

    it('outputs text format by default', async () => {
      await search({ query: 'weather', limit: 1 });
      const textOutput = consoleLogSpy.mock.calls.map((c) => c[0]).join('');
      expect(textOutput).toContain('Weather API');
    });

    it('combines query and category', async () => {
      await search({ query: 'weather', category: 'data', limit: 3 });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 0 APIs:'));
    });

    it('combines all filters', async () => {
      await search({ query: 'weather', category: 'weather', auth: 'apiKey', limit: 3 });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 2 APIs:'));
    });

    it('truncates long descriptions to 250 chars', async () => {
      const longDescApi = [
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
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(longDescApi));
      await search({ limit: 1, descriptionMaxLength: 250 });
      const output = consoleLogSpy.mock.calls.map((c) => c[0]).join('');
      expect(output).toContain('A'.repeat(250) + '...');
      expect(output).not.toContain('A'.repeat(251));
    });

    it('does not truncate short descriptions', async () => {
      const shortDescApi = [
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
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(shortDescApi));
      await search({ limit: 1, descriptionMaxLength: 250 });
      const output = consoleLogSpy.mock.calls.map((c) => c[0]).join('');
      expect(output).toContain('Short description');
      expect(output).not.toContain('...');
    });

    describe('sorting', () => {
      it('sorts by name ascending', async () => {
        await search({ query: 'weather', limit: 10, sort: 'name' });
        const output = consoleLogSpy.mock.calls.map((c) => c[0]).join('');
        const weatherIdx = output.indexOf('Weather API');
        const weather2Idx = output.indexOf('Weather2 API');
        const weather3Idx = output.indexOf('Weather3 API');
        expect(weatherIdx).toBeGreaterThanOrEqual(0);
        expect(weatherIdx).toBeLessThan(weather2Idx);
        expect(weather2Idx).toBeLessThan(weather3Idx);
      });

      it('sorts by category', async () => {
        await search({ limit: 10, sort: 'category' });
        const output = consoleLogSpy.mock.calls.map((c) => c[0]).join('');
        const dataIdx = output.indexOf('Other API');
        const weatherIdx = output.indexOf('Weather API');
        expect(dataIdx).toBeLessThan(weatherIdx);
      });

      it('sorts by auth', async () => {
        await search({ limit: 10, sort: 'auth' });
        const output = consoleLogSpy.mock.calls.map((c) => c[0]).join('');
        const apiKeyIdx = output.indexOf('Weather API');
        const oauthIdx = output.indexOf('Weather3 API');
        expect(apiKeyIdx).toBeLessThan(oauthIdx);
      });
    });

    describe('colors', () => {
      beforeEach(() => {
        setColors(false);
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
        vi.unstubAllEnvs();
      });

      it('colors return plain text when disabled', () => {
        setColors(false);
        expect(color.bold('hello')).toBe('hello');
        expect(color.cyan('hello')).toBe('hello');
        expect(color.green('hello')).toBe('hello');
        expect(color.yellow('hello')).toBe('hello');
      });
    });
  });
});
