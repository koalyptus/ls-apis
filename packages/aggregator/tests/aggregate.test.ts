import { describe, it, expect } from 'vitest';
import { deduplicate } from '../src/aggregate';
import type { ApiEntry } from '../src/types';

describe('aggregate', () => {
  describe('deduplicate', () => {
    it('should deduplicate by link', () => {
      const entries: ApiEntry[] = [
        {
          name: 'API 1',
          link: 'https://api.example.com',
          categories: ['Test'],
          sources: ['source1'],
        },
        {
          name: 'API 1',
          link: 'https://api.example.com',
          categories: ['Test'],
          sources: ['source2'],
        },
      ];

      const result = deduplicate(entries);

      expect(result).toHaveLength(1);
      expect(result[0].sources).toEqual(['source1', 'source2']);
    });

    it('should normalize links (https, trailing slash)', () => {
      const entries: ApiEntry[] = [
        {
          name: 'API 1',
          link: 'https://api.example.com/',
          categories: ['Test'],
          sources: ['source1'],
        },
        {
          name: 'API 1',
          link: 'http://api.example.com',
          categories: ['Test'],
          sources: ['source2'],
        },
      ];

      const result = deduplicate(entries);

      expect(result).toHaveLength(1);
    });

    it('should combine categories', () => {
      const entries: ApiEntry[] = [
        {
          name: 'API 1',
          link: 'https://api.example.com',
          categories: ['Test'],
          sources: ['source1'],
        },
        {
          name: 'API 1',
          link: 'https://api.example.com',
          categories: ['Data'],
          sources: ['source1'],
        },
      ];

      const result = deduplicate(entries);

      expect(result[0].categories).toContain('Test');
      expect(result[0].categories).toContain('Data');
    });

    it('should keep unique entries', () => {
      const entries: ApiEntry[] = [
        {
          name: 'API 1',
          link: 'https://api1.example.com',
          categories: ['Test'],
          sources: ['source1'],
        },
        {
          name: 'API 2',
          link: 'https://api2.example.com',
          categories: ['Test'],
          sources: ['source1'],
        },
      ];

      const result = deduplicate(entries);

      expect(result).toHaveLength(2);
    });
  });
});
