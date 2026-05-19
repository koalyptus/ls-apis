import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writeFile } from 'node:fs/promises';
import { loadAllFetchers } from '../sources/index';
import { runAggregation, deduplicateCategories } from '../aggregate';
import type { ApiEntry } from '../types';

vi.mock('../sources/index', () => ({
  loadAllFetchers: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  __esModule: true,
  default: {
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue('{}'),
    readdir: vi.fn().mockResolvedValue([]),
  },
  writeFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue('{}'),
  readdir: vi.fn().mockResolvedValue([]),
}));

describe('aggregate', () => {
  beforeEach(() => {
    vi.mocked(loadAllFetchers).mockResolvedValue([
      {
        name: 'test-fetcher',
        sourceUrl: 'https://test.com/data',
        fetchApis: vi.fn().mockResolvedValue([
          {
            name: 'API 1',
            description: 'Test',
            link: 'https://test.com',
            auth: null,
            cors: null,
            categories: ['Test'],
            sources: ['test-fetcher'],
            openapiSpec: null,
          },
        ]),
      },
      {
        name: 'failing-fetcher',
        sourceUrl: 'https://fail.com/data',
        fetchApis: vi.fn().mockRejectedValue(new Error('Network error')),
      },
    ]);

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('deduplicateCategories', () => {
    it('should drop entries that merge into more than 10 categories', () => {
      const entries: ApiEntry[] = Array.from({ length: 11 }, (_, i) => ({
        name: 'Merged API',
        description: null,
        link: 'https://merged.example.com',
        auth: null,
        cors: null,
        categories: [`Category ${i}`],
        openapiSpec: null,
        sources: ['test-fetcher'],
      }));

      const result = deduplicateCategories(entries, 250);
      expect(result).toHaveLength(0);
    });

    it('should keep entries with 10 or fewer merged categories', () => {
      const entries: ApiEntry[] = Array.from({ length: 10 }, (_, i) => ({
        name: 'OK API',
        description: null,
        link: 'https://ok.example.com',
        auth: null,
        cors: null,
        categories: [`Category ${i}`],
        openapiSpec: null,
        sources: ['test-fetcher'],
      }));

      const result = deduplicateCategories(entries, 250);
      expect(result).toHaveLength(1);
      expect(result[0].categories).toHaveLength(10);
    });
  });

  describe('runAggregation', () => {
    it('should write merged and normalized entries', async () => {
      const duplicateEntries: ApiEntry[] = [
        {
          name: 'API 1',
          description: 'Test',
          link: 'https://test.com',
          auth: null,
          cors: null,
          categories: ['Documents And Productivity', 'x'],
          sources: ['source-a'],
          openapiSpec: null,
        },
        {
          name: 'API 1',
          description: 'Test',
          link: 'https://test.com',
          auth: null,
          cors: null,
          categories: ['open_data'],
          sources: ['source-b'],
          openapiSpec: null,
        },
      ];

      vi.mocked(loadAllFetchers).mockResolvedValueOnce([
        {
          name: 'fetcher-a',
          sourceUrl: 'https://a.com/data',
          fetchApis: vi.fn().mockResolvedValue(duplicateEntries),
        },
      ]);

      await runAggregation();

      expect(writeFile).toHaveBeenCalled();
      const [, payload] = vi.mocked(writeFile).mock.calls[0];
      const parsed = JSON.parse(payload as string) as {
        apis: ApiEntry[];
        providers: Array<{ name: string; url: string }>;
      };

      expect(parsed.apis).toHaveLength(1);
      expect(parsed.apis[0].link).toBe('https://test.com');
      expect(parsed.apis[0].sources).toEqual(expect.arrayContaining(['source-a', 'source-b']));
      expect(parsed.apis[0].categories).toEqual(
        expect.arrayContaining(['Documents & Productivity', 'Open Data'])
      );
      expect(parsed.apis[0].categories).not.toContain('x');
      expect(parsed.providers).toEqual([{ name: 'fetcher-a', url: 'https://a.com/data' }]);
    });

    it('should exit with 1 on invalid JSON', async () => {
      const original = JSON.stringify;
      vi.spyOn(JSON, 'stringify').mockImplementationOnce((v) => {
        if (typeof v === 'object') {
          return '{invalid';
        }
        return original(v);
      });

      await runAggregation();

      expect(process.exit).toHaveBeenCalledWith(1);
    });
    it('should handle fetcher errors gracefully', async () => {
      await runAggregation();
      expect(console.error).toHaveBeenCalled();
    });
  });
});
