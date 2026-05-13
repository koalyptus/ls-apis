import { describe, it, expect, vi } from 'vitest';
import fetcher from '../github-public-apis.fetcher';

const FETCH_TIMEOUT = 30000;

vi.mock('node:fetch', () => ({
  default: vi.fn(),
}));

describe('sources/github-public-apis', () => {
  describe('fetchApis', () => {
    it(
      'should fetch APIs',
      async () => {
        const entries = await fetcher.fetchApis();
        expect(entries.length).toBeGreaterThan(100);
      },
      FETCH_TIMEOUT
    );

    it(
      'should have entries with apiKey auth',
      async () => {
        const entries = await fetcher.fetchApis();
        const authEntries = entries.filter((e) => e.auth === 'apiKey');
        expect(authEntries.length).toBeGreaterThan(0);
      },
      FETCH_TIMEOUT
    );

    it(
      'should have entries with various categories',
      async () => {
        const entries = await fetcher.fetchApis();
        const categories = new Set(entries.flatMap((e) => e.categories));
        expect(categories.size).toBeGreaterThan(5);
      },
      FETCH_TIMEOUT
    );
  });
});
