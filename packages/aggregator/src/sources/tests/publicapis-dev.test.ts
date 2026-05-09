import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('node:fetch', () => ({
  default: vi.fn(),
}));

describe('sources/publicapis-dev', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchApis', () => {
    it('should fetch APIs from real source', async () => {
      const { default: fetcher } = await import('../publicapis-dev.fetcher');
      const entries = await fetcher.fetchApis();
      expect(entries.length).toBeGreaterThan(500);
    }, 120000);

    it('should have name and link for entries', async () => {
      const { default: fetcher } = await import('../publicapis-dev.fetcher');
      const entries = await fetcher.fetchApis();
      const withLink = entries.filter((e) => e.link.startsWith('https://'));
      expect(withLink.length).toBeGreaterThan(0);
    }, 120000);

    it('should have entries with apiKey auth', async () => {
      const { default: fetcher } = await import('../publicapis-dev.fetcher');
      const entries = await fetcher.fetchApis();
      const authEntries = entries.filter((e) => e.auth === 'apiKey');
      expect(authEntries.length).toBeGreaterThan(0);
    }, 120000);

    it('should have entries with OAuth auth', async () => {
      const { default: fetcher } = await import('../publicapis-dev.fetcher');
      const entries = await fetcher.fetchApis();
      const oauthEntries = entries.filter((e) => e.auth === 'OAuth');
      expect(oauthEntries.length).toBeGreaterThan(0);
    }, 120000);

    it('should have entries with cors yes', async () => {
      const { default: fetcher } = await import('../publicapis-dev.fetcher');
      const entries = await fetcher.fetchApis();
      const corsEntries = entries.filter((e) => e.cors === 'yes');
      expect(corsEntries.length).toBeGreaterThan(0);
    }, 120000);

    it('should have descriptions for most entries', async () => {
      const { default: fetcher } = await import('../publicapis-dev.fetcher');
      const entries = await fetcher.fetchApis();
      const withDesc = entries.filter((e) => e.description);
      expect(withDesc.length).toBeGreaterThan(100);
    }, 120000);

    it('should have various categories', async () => {
      const { default: fetcher } = await import('../publicapis-dev.fetcher');
      const entries = await fetcher.fetchApis();
      const categories = new Set(entries.flatMap((e) => e.categories));
      expect(categories.size).toBeGreaterThan(20);
    }, 120000);
  });
});
