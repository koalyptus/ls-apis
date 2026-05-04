import { describe, it, expect } from 'vitest';
import { loadAllFetchers, isSourceFetcher } from '../index';

describe('sources/index', () => {
  describe('loadAllFetchers', () => {
    it('should load all fetchers', async () => {
      const fetchers = await loadAllFetchers();
      expect(fetchers.length).toBeGreaterThan(0);
    });

    it('should return array of fetchers', async () => {
      const fetchers = await loadAllFetchers();
      expect(Array.isArray(fetchers)).toBe(true);
    });

    it('should filter only valid fetchers', async () => {
      const fetchers = await loadAllFetchers();
      for (const fetcher of fetchers) {
        expect(isSourceFetcher(fetcher)).toBe(true);
      }
    });
  });

  describe('isSourceFetcher', () => {
    it('should accept valid fetcher object', () => {
      expect(isSourceFetcher({ name: 'test', fetchApis: async () => [] })).toBe(true);
    });

    it('should reject null explicitly', () => {
      expect(isSourceFetcher(null)).toBe(false);
    });

    it('should reject undefined', () => {
      expect(isSourceFetcher(undefined)).toBe(false);
    });

    it('should reject empty object', () => {
      expect(isSourceFetcher({})).toBe(false);
    });

    it('should reject missing name', () => {
      expect(isSourceFetcher({ fetchApis: async () => [] })).toBe(false);
    });

    it('should reject name that is not string', () => {
      expect(isSourceFetcher({ name: 123, fetchApis: async () => [] })).toBe(false);
    });

    it('should reject missing fetchApis', () => {
      expect(isSourceFetcher({ name: 'test' })).toBe(false);
    });

    it('should reject fetchApis that is not function', () => {
      expect(
        isSourceFetcher({
          name: 'test',
          fetchApis: 'not a function' as unknown as () => Promise<[]>,
        })
      ).toBe(false);
    });

    it('should accept fetcher with all required fields', () => {
      const fetcher = { name: 'valid', fetchApis: async () => [] };
      expect(isSourceFetcher(fetcher)).toBe(true);
    });

    it('should reject primitive string', () => {
      const result = isSourceFetcher('string' as unknown as object);
      expect(result).toBe(false);
    });

    it('should reject primitive number', () => {
      const result = isSourceFetcher(42 as unknown as object);
      expect(result).toBe(false);
    });

    it('should reject primitive boolean', () => {
      const result = isSourceFetcher(true as unknown as object);
      expect(result).toBe(false);
    });

    it('should reject function', () => {
      const result = isSourceFetcher(function () {} as unknown as object);
      expect(result).toBe(false);
    });
  });
});
