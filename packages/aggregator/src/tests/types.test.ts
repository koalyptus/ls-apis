import { describe, it, expect } from 'vitest';
import type { ApiEntry, SourceFetcher } from '../types';

describe('types', () => {
  describe('ApiEntry', () => {
    it('should have required fields', () => {
      const entry: ApiEntry = {
        name: 'Test API',
        description: null,
        link: 'https://test.com',
        auth: 'apiKey',
        cors: null,
        categories: ['Test'],
        sources: ['test-source'],
        openapiSpec: null,
      };

      expect(entry.name).toBe('Test API');
      expect(entry.link).toBe('https://test.com');
      expect(entry.categories).toEqual(['Test']);
      expect(entry.sources).toEqual(['test-source']);
      expect(entry.description).toBeNull();
    });

    it('should allow all fields', () => {
      const entry: ApiEntry = {
        name: 'Test API',
        description: 'A test API',
        link: 'https://test.com',
        auth: 'apiKey',
        cors: 'yes',
        categories: ['Test', 'Data'],
        openapiSpec: 'https://test.com/openapi.json',
        sources: ['test-source'],
      };

      expect(entry.description).toBe('A test API');
      expect(entry.auth).toBe('apiKey');
      expect(entry.cors).toBe('yes');
      expect(entry.categories).toHaveLength(2);
      expect(entry.openapiSpec).toBe('https://test.com/openapi.json');
    });
  });

  describe('SourceFetcher', () => {
    it('should have required fields', () => {
      const fetcher: SourceFetcher = {
        name: 'test-fetcher',
        fetchApis: async () => [],
      };

      expect(fetcher.name).toBe('test-fetcher');
      expect(typeof fetcher.fetchApis).toBe('function');
    });

    it('should return api entries', async () => {
      const entries: ApiEntry[] = [
        {
          name: 'Test API',
          description: null,
          link: 'https://test.com',
          auth: null,
          cors: null,
          categories: ['Test'],
          sources: ['test-fetcher'],
          openapiSpec: null,
        },
      ];

      const fetcher: SourceFetcher = {
        name: 'test-fetcher',
        fetchApis: async () => entries,
      };

      const result = await fetcher.fetchApis();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test API');
    });
  });
});
