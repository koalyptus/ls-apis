import { describe, it, expect, vi, beforeAll } from 'vitest';
import axios from 'axios';
import fetcher from '../github-public-apis.fetcher';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockReadme = `
# Public APIs

| API | Description | Auth | HTTPS | CORS |
| --- | --- | --- | --- | --- |
| Test Weather | Weather data | apiKey | Yes | Yes |
| Test Finance | Finance data | OAuth | Yes | No |
| Test Animals | Animal facts | apiKey | Yes | Yes |
| Test Map | Map service | apiKey | Yes | Unknown |
`;

describe('sources/github-public-apis', () => {
  beforeAll(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('fetchApis', () => {
    it('should fetch APIs', async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: mockReadme });

      const entries = await fetcher.fetchApis();

      expect(entries.length).toBeGreaterThan(0);
    });

    it('should have entries with apiKey auth', async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: mockReadme });

      const entries = await fetcher.fetchApis();

      const authEntries = entries.filter((e) => e.auth === 'apiKey');
      expect(authEntries.length).toBeGreaterThan(0);
    });

    it('should have entries with various categories', async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: mockReadme });

      const entries = await fetcher.fetchApis();

      const categories = new Set(entries.flatMap((e) => e.categories));
      expect(categories.size).toBeGreaterThan(1);
    });
  });
});
