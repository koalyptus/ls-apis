import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { deduplicate, normalizeEntry, runAggregation } from '../aggregate';
import type { ApiEntry } from '../types';

vi.mock('../src/sources/index', () => ({
  loadAllFetchers: vi.fn().mockResolvedValue([
    {
      name: 'test-fetcher',
      fetchApis: vi.fn().mockResolvedValue([
        {
          name: 'API 1',
          description: 'Test',
          link: 'https://test.com',
          auth: null,
          https: null,
          cors: null,
          categories: ['Test'],
          sources: ['test-fetcher'],
          openapiSpec: null,
        },
      ]),
    },
    {
      name: 'failing-fetcher',
      fetchApis: vi.fn().mockRejectedValue(new Error('Network error')),
    },
  ]),
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
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('runAggregation', () => {
    it('should exit with 1 on invalid JSON', async () => {
      const original = JSON.stringify;
      vi.spyOn(JSON, 'stringify').mockImplementationOnce((v) => {
        if (typeof v === 'object') return '{invalid';
        return original(v);
      });

      await runAggregation();

      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it.skip('should handle fetcher errors gracefully', async () => {
      await runAggregation();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('deduplicate', () => {
    it('should merge sources for duplicate links', () => {
      const entries: ApiEntry[] = [
        {
          name: 'API',
          description: null,
          link: 'https://a.com',
          auth: null,
          https: null,
          cors: null,
          categories: ['A'],
          sources: ['s1'],
          openapiSpec: null,
        },
        {
          name: 'API',
          description: null,
          link: 'https://a.com',
          auth: null,
          https: null,
          cors: null,
          categories: ['B'],
          sources: ['s2'],
          openapiSpec: null,
        },
      ];

      const result = deduplicate(entries);
      expect(result).toHaveLength(1);
      expect(result[0].sources).toContain('s1');
      expect(result[0].sources).toContain('s2');
    });

    it('should keep unique entries', () => {
      const entries: ApiEntry[] = [
        {
          name: 'A',
          description: null,
          link: 'https://a.com',
          auth: null,
          https: null,
          cors: null,
          categories: [],
          sources: [],
          openapiSpec: null,
        },
        {
          name: 'B',
          description: null,
          link: 'https://b.com',
          auth: null,
          https: null,
          cors: null,
          categories: [],
          sources: [],
          openapiSpec: null,
        },
      ];

      const result = deduplicate(entries);
      expect(result).toHaveLength(2);
    });

    it('should normalize http to https', () => {
      const entries: ApiEntry[] = [
        {
          name: 'A',
          description: null,
          link: 'http://a.com',
          auth: null,
          https: null,
          cors: null,
          categories: [],
          sources: [],
          openapiSpec: null,
        },
        {
          name: 'A',
          description: null,
          link: 'https://a.com',
          auth: null,
          https: null,
          cors: null,
          categories: [],
          sources: [],
          openapiSpec: null,
        },
      ];

      const result = deduplicate(entries);
      expect(result).toHaveLength(1);
    });
  });

  describe('normalizeEntry', () => {
    it('should use existing values', () => {
      const entry: ApiEntry = {
        name: 'Test',
        description: 'Desc',
        link: 'https://test.com',
        auth: 'ApiKey',
        https: true,
        cors: 'yes',
        categories: ['Test'],
        sources: ['src'],
        openapiSpec: 'url',
      };

      const result = normalizeEntry(entry);
      expect(result.description).toBe('Desc');
      expect(result.auth).toBe('ApiKey');
    });

    it('should set null for undefined', () => {
      const entry: ApiEntry = {
        name: 'Test',
        description: undefined as unknown as string | null,
        link: 'https://test.com',
        auth: undefined as unknown as string | null,
        https: undefined as unknown as boolean | null,
        cors: undefined as unknown as string | null,
        categories: ['Test'],
        sources: ['src'],
        openapiSpec: undefined as unknown as string | null,
      };

      const result = normalizeEntry(entry);
      expect(result.description).toBeNull();
      expect(result.auth).toBeNull();
    });
  });
});
