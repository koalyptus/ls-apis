import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import fetcher from '../github-public-apis.fetcher';

const mockFetch = vi.hoisted(() => vi.fn());

vi.stubGlobal('fetch', mockFetch);

const mockReadme = `
# Public APIs

| Project | Description |
| --- | --- |
| public-apis | A collective list of free APIs |

## APIs

| API | Description | Auth | HTTPS | CORS |
| --- | --- | --- | --- | --- |
| [Test Weather](https://api.weather.com) | Weather data | apiKey | Yes | Yes |
| [Test Finance](https://api.finance.com) | Finance data | OAuth | Yes | No |
| [Test Animals](https://api.animals.com) | Animal facts | apiKey | Yes | Yes |
| [Test Map](https://api.maps.com) | Map service | apiKey | Yes | Unknown |
| [Test No Auth](https://api.noauth.com) | Free data | No | Yes | Yes |
`;

describe('sources/github-public-apis', () => {
  beforeAll(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  describe('fetchApis', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockReadme),
      } as Response);
    });

    it('should fetch APIs', async () => {
      const entries = await fetcher.fetchApis();

      expect(entries.length).toBeGreaterThan(0);
    });

    it('should have entries with apiKey auth', async () => {
      const entries = await fetcher.fetchApis();

      const authEntries = entries.filter((e) => e.auth === 'apiKey');
      expect(authEntries.length).toBeGreaterThan(0);
    });

    it('should have entries with no auth', async () => {
      const entries = await fetcher.fetchApis();

      const noAuthEntries = entries.filter((e) => e.auth === 'no');
      expect(noAuthEntries.length).toBeGreaterThan(0);
    });

    it('should assign default category', async () => {
      const entries = await fetcher.fetchApis();

      const categories = new Set(entries.flatMap((e) => e.categories));
      expect(categories.has('Public')).toBe(true);
    });
  });
});
