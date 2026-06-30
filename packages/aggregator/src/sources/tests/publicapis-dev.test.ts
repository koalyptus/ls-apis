import { describe, it, expect, vi, beforeAll } from 'vitest';
import axios from 'axios';
import fetcher from '../publicapis-dev.fetcher';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

const mainPageHtml = `
<html>
<body>
  <a href="/category/animals">Animals</a>
  <a href="/category/finance">Finance</a>
  <a href="/category/weather">Weather</a>
</body>
</html>
`;

const categoryPageHtml = `
<html>
<body>
  <li role="group">
    <a href="https://api.animals.com">Animals API</a>
    <h2>Animal Facts</h2>
    <p>Get interesting facts about various animal species from around the world</p>
    <p>API Key</p>
    <p>CORS: Yes</p>
  </li>
  <li role="group">
    <a href="https://api.finance.com">Finance API</a>
    <h2>Stock Market Data</h2>
    <p>Real-time stock market data and historical prices for major exchanges</p>
    <p>OAuth</p>
    <p>CORS: No</p>
  </li>
  <li role="group">
    <a href="https://api.weather.com">Weather API</a>
    <h2>Weather Forecast</h2>
    <p>Current weather conditions and 7-day forecast for cities worldwide</p>
    <p>API Key, OAuth</p>
    <p>CORS: Yes</p>
  </li>
</body>
</html>
`;

describe('sources/publicapis-dev', () => {
  beforeAll(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('fetchApis', () => {
    it('should fetch APIs', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: mainPageHtml });
      vi.mocked(axios.get).mockResolvedValue({ data: categoryPageHtml });

      const entries = await fetcher.fetchApis();

      expect(entries.length).toBeGreaterThan(0);
    });

    it('should scrape APIs from the current /resource card markup', async () => {
      const updatedCategoryPageHtml = `
<html>
<body>
  <li>
    <a href="/resource/animal-facts/abc123" style="display:block;height:100%">
      <div>
        <h2>Animal Facts</h2>
        <p>Interesting facts about animals from around the world.</p>
      </div>
    </a>
  </li>
</body>
</html>`;

      const singleCategoryPageHtml = `
<html>
<body>
  <a href="/category/animals">Animals</a>
</body>
</html>`;

      vi.mocked(axios.get).mockResolvedValueOnce({ data: singleCategoryPageHtml });
      vi.mocked(axios.get).mockResolvedValue({ data: updatedCategoryPageHtml });

      const entries = await fetcher.fetchApis();

      expect(entries).toHaveLength(1);
      expect(entries[0]?.name).toBe('Animal Facts');
      expect(entries[0]?.description).toBe(
        'Interesting facts about animals from around the world.'
      );
      expect(entries[0]?.link).toBe('https://publicapis.dev/resource/animal-facts/abc123');
    });

    it('should have name and link for each entry', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: mainPageHtml });
      vi.mocked(axios.get).mockResolvedValue({ data: categoryPageHtml });

      const entries = await fetcher.fetchApis();

      entries.forEach((entry) => {
        expect(entry.name).toBeTruthy();
        expect(entry.link).toMatch(/^https?:\/\//);
      });
    });

    it('should detect apiKey auth', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: mainPageHtml });
      vi.mocked(axios.get).mockResolvedValue({ data: categoryPageHtml });

      const entries = await fetcher.fetchApis();

      const apiKeyEntries = entries.filter((e) => e.auth === 'apiKey');
      expect(apiKeyEntries.length).toBeGreaterThan(0);
    });

    it('should detect OAuth auth', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: mainPageHtml });
      vi.mocked(axios.get).mockResolvedValue({ data: categoryPageHtml });

      const entries = await fetcher.fetchApis();

      const oauthEntries = entries.filter((e) => e.auth === 'OAuth');
      expect(oauthEntries.length).toBeGreaterThan(0);
    });

    it('should detect apiKey|OAuth auth', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: mainPageHtml });
      vi.mocked(axios.get).mockResolvedValue({ data: categoryPageHtml });

      const entries = await fetcher.fetchApis();

      const combinedEntries = entries.filter((e) => e.auth === 'apiKey|OAuth');
      expect(combinedEntries.length).toBeGreaterThan(0);
    });

    it('should detect cors yes', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: mainPageHtml });
      vi.mocked(axios.get).mockResolvedValue({ data: categoryPageHtml });

      const entries = await fetcher.fetchApis();

      const corsEntries = entries.filter((e) => e.cors === 'yes');
      expect(corsEntries.length).toBeGreaterThan(0);
    });

    it('should assign correct categories', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: mainPageHtml });
      vi.mocked(axios.get).mockResolvedValue({ data: categoryPageHtml });

      const entries = await fetcher.fetchApis();

      const categories = new Set(entries.flatMap((e) => e.categories));
      expect(categories.has('Animals')).toBe(true);
      expect(categories.has('Finance')).toBe(true);
      expect(categories.has('Weather')).toBe(true);
    });

    it('should skip entries with github.com/marcelscruz links', async () => {
      const htmlWithSkip = `
<html>
<body>
  <li role="group">
    <a href="https://github.com/marcelscruz/public-apis">Repo</a>
    <h2>Skip This</h2>
    <p>Short desc</p>
  </li>
  <li role="group">
    <a href="https://api.real.com">Real API</a>
    <h2>Real Service</h2>
    <p>A longer description that passes the filter</p>
  </li>
</body>
</html>
`;

      vi.mocked(axios.get).mockResolvedValueOnce({ data: mainPageHtml });
      vi.mocked(axios.get).mockResolvedValue({ data: htmlWithSkip });

      const entries = await fetcher.fetchApis();

      expect(entries.every((e) => !e.link.includes('github.com/marcelscruz'))).toBe(true);
    });
  });
});
