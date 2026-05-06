import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { search } from '../src/index';
import { readFile } from 'node:fs/promises';

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn().mockImplementation((path: string) => {
    if (path.includes('package.json')) {
      return Promise.resolve('{"version": "0.0.0"}');
    }
    return Promise.resolve(JSON.stringify([]));
  }),
}));

const mockApis = [
  { name: 'Weather API', description: 'Weather data', link: 'https://example.com', categories: ['weather'], auth: 'apiKey' },
  { name: 'Weather2 API', description: 'More weather', link: 'https://example2.com', categories: ['weather'], auth: 'apiKey' },
  { name: 'Weather3 API', description: 'Even more weather', link: 'https://example3.com', categories: ['weather'], auth: 'oauth' },
  { name: 'Other API', description: 'Something else', link: 'https://example4.com', categories: ['data'], auth: undefined },
];

describe('ls-apis CLI', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
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
      const jsonCall = consoleLogSpy.mock.calls.find((c) => typeof c[0] === 'string' && c[0].startsWith('['));
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
  });
});