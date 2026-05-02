import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';

import fetcher from '../apis-guru.fetcher';

vi.mock('axios');

describe('sources/apis-guru', () => {
  describe('fetchApis', () => {
    it('should fetch and transform APIs from APIs.guru', async () => {
      vi.spyOn(axios, 'get').mockResolvedValue({
        data: {
          'whois-api': {
            added: '2020-01-01',
            updated: '2020-01-01',
            preferred: '2.0.0',
            versions: {
              '2.0.0': {
                info: {
                  title: 'Whois API',
                  description: 'WHOIS lookup API',
                  'x-origin': [{ url: 'https://whois.example.com' }],
                  tags: ['Utilities', 'Domain'],
                },
              },
            },
          },
        },
      });

      const entries = await fetcher.fetchApis();

      expect(entries).toHaveLength(1);
      expect(entries[0].name).toBe('Whois API');
      expect(entries[0].description).toBe('WHOIS lookup API');
      expect(entries[0].link).toBe('https://whois.example.com');
      expect(entries[0].categories).toEqual(['Utilities', 'Domain']);
      expect(entries[0].sources).toEqual(['apis-guru']);
    });

    it('should use key as fallback when title is missing', async () => {
      vi.spyOn(axios, 'get').mockResolvedValue({
        data: {
          'some-api-key': {
            added: '2020-01-01',
            updated: '2020-01-01',
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

      expect(entries[0].name).toBe('some-api-key');
    });

    it('should default to Uncategorized when no tags', async () => {
      vi.spyOn(axios, 'get').mockResolvedValue({
        data: {
          'test-api': {
            added: '2020-01-01',
            updated: '2020-01-01',
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

      expect(entries[0].categories).toEqual(['Uncategorized']);
    });

    it('should handle empty link gracefully', async () => {
      vi.spyOn(axios, 'get').mockResolvedValue({
        data: {
          'test-api': {
            added: '2020-01-01',
            updated: '2020-01-01',
            preferred: '1.0.0',
            versions: {
              '1.0.0': {
                info: {
                  title: 'Test API',
                  'x-origin': [],
                },
              },
            },
          },
        },
      });

      const entries = await fetcher.fetchApis();

      expect(entries[0].link).toBe('');
    });
  });
});
