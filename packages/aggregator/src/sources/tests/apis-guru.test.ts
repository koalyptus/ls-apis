import { describe, it, expect, vi } from 'vitest';

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
    it('should fetch APIs from API', async () => {
      const axios = await import('axios');
      vi.mocked(axios.default.get).mockResolvedValue({
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

      const { default: fetcher } = await import('../apis-guru.fetcher');
      const entries = await fetcher.fetchApis();

      expect(entries).toHaveLength(1);
      expect(entries[0].name).toBe('Test API');
      expect(entries[0].categories).toContain('test');
    });

    it('should use title or fallback to key', async () => {
      const axios = await import('axios');
      vi.mocked(axios.default.get).mockResolvedValue({
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

      const { default: fetcher } = await import('../apis-guru.fetcher');
      const entries = await fetcher.fetchApis();

      expect(entries[0].name).toBe('some-api');
    });

    it('should use x-apisguru-categories over tags', async () => {
      const axios = await import('axios');
      vi.mocked(axios.default.get).mockResolvedValue({
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

      const { default: fetcher } = await import('../apis-guru.fetcher');
      const entries = await fetcher.fetchApis();

      expect(entries[0].categories).toContain('custom');
    });

    it('should use tags when x-apisguru-categories not available', async () => {
      const axios = await import('axios');
      vi.mocked(axios.default.get).mockResolvedValue({
        data: {
          'test-api': {
            added: '2020-01-01',
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

      const { default: fetcher } = await import('../apis-guru.fetcher');
      const entries = await fetcher.fetchApis();

      expect(entries[0].categories).toContain('from-tags');
    });

    it('should use Uncategorized when no categories', async () => {
      const axios = await import('axios');
      vi.mocked(axios.default.get).mockResolvedValue({
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

      const { default: fetcher } = await import('../apis-guru.fetcher');
      const entries = await fetcher.fetchApis();

      expect(entries[0].categories).toContain('Uncategorized');
    });
  });
});
