import { describe, it, expect } from 'vitest';
import type { SourceFetcher } from '../../types';
import { isSourceFetcher } from '../index';

describe('sources/index', () => {
  describe('isSourceFetcher', () => {
    it('should return true for valid source fetcher', () => {
      const fetcher: SourceFetcher = {
        name: 'test',
        fetchApis: async () => [],
      };

      expect(isSourceFetcher(fetcher)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isSourceFetcher(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isSourceFetcher(undefined)).toBe(false);
    });

    it('should return false for object without name', () => {
      expect(isSourceFetcher({ fetchApis: async () => [] })).toBe(false);
    });

    it('should return false for object without fetchApis', () => {
      expect(isSourceFetcher({ name: 'test' })).toBe(false);
    });

    it('should return false for string', () => {
      expect(isSourceFetcher('not an object')).toBe(false);
    });

    it('should return false for function without name', () => {
      const fetcher = () => {};
      expect(isSourceFetcher(fetcher)).toBe(false);
    });
  });
});
