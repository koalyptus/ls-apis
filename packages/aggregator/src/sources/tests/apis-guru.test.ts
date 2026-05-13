import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';
import fetcher from '../apis-guru.fetcher';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('node:fetch', () => ({
  default: vi.fn(),
}));

describe('sources/apis-guru', () => {
  describe('fetchApis', () => {
    it('should fetch APIs', async () => {
      vi.mocked(axios.get).mockResolvedValue({
        data: {
          'test-api': {
            added: '2020-01-01',
            preferred: '1.0.0',
            versions: {
              '1.0.0': {
                info: {
                  title: 'Test API',
                  description: 'A test API',
                  'x-apisguru-categories': ['test'],
                  'x-origin': [{ url: 'https://test.com' }],
                },
              },
            },
          },
        },
      });

      const entries = await fetcher.fetchApis();

      expect(entries).toHaveLength(1);
      expect(entries[0].name).toBe('Test API');
      expect(entries[0].categories).toContain('test');
    });

    it('should use title or fallback to key', async () => {
      vi.mocked(axios.get).mockResolvedValue({
        data: {
          'some-api': {
            added: '2020-01-01',
            preferred: '1.0.0',
            versions: {
              '1.0.0': {
                info: {},
              },
            },
          },
        },
      });

      const entries = await fetcher.fetchApis();

      expect(entries[0].name).toBe('some-api');
    });

    it('should use x-apisguru-categories over tags', async () => {
      vi.mocked(axios.get).mockResolvedValue({
        data: {
          'test-api': {
            added: '2020-01-01',
            preferred: '1.0.0',
            versions: {
              '1.0.0': {
                info: {
                  title: 'Test API',
                  'x-apisguru-categories': ['custom'],
                  tags: ['fallback'],
                },
              },
            },
          },
        },
      });

      const entries = await fetcher.fetchApis();

      expect(entries[0].categories).toContain('custom');
    });

    it('should use Uncategorized when x-apisguru-categories not available', async () => {
      vi.mocked(axios.get).mockResolvedValue({
        data: {
          'test-api': {
            added: '2023-01-01T00:00:00Z',
            updated: '2023-01-01T00:00:00Z',
            preferred: '1.0.0',
            versions: {
              '1.0.0': {
                info: {
                  title: 'Test API',
                  tags: ['from-tags'],
                },
              },
            },
          },
        },
      });

      const entries = await fetcher.fetchApis();

      expect(entries[0].categories).toEqual(['Uncategorized']);
    });

    it('should use Uncategorized when no categories', async () => {
      vi.mocked(axios.get).mockResolvedValue({
        data: {
          'test-api': {
            added: '2020-01-01',
            preferred: '1.0.0',
            versions: {
              '1.0.0': {
                info: {
                  title: 'Test API',
                },
              },
            },
          },
        },
      });

      const entries = await fetcher.fetchApis();

      expect(entries[0].categories).toContain('Uncategorized');
    });

    it('should populate openapiSpec from swaggerUrl', async () => {
      vi.mocked(axios.get).mockResolvedValue({
        data: {
          'test-api': {
            added: '2020-01-01',
            preferred: '1.0.0',
            versions: {
              '1.0.0': {
                info: {
                  title: 'Test API',
                },
                swaggerUrl: 'https://spec.example.com/openapi.json',
              },
            },
          },
        },
      });

      const entries = await fetcher.fetchApis();

      expect(entries[0].openapiSpec).toBe('https://spec.example.com/openapi.json');
    });
  });
});
