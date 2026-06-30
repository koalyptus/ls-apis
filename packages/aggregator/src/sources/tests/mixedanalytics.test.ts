import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';
import fetcher from '../mixedanalytics.fetcher';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

const tableHtml = `
<html>
<body>
<figure class="wp-block-table">
<table id="myTable">
<thead>
<tr><th>#</th><th>CATEGORY</th><th>API NAME</th><th>DESCRIPTION</th><th>SAMPLE URL</th></tr>
</thead>
<tbody>
<tr>
  <td>1</td>
  <td>Art &amp; Images</td>
  <td><a href="https://api.artic.edu/docs/" target="_blank" rel="noreferrer noopener"></a><a target="_blank" href="https://api.artic.edu/docs/" rel="noreferrer noopener">Art Institute of Chicago</a></td>
  <td>Artwork from the museum</td>
  <td><a href="https://api.artic.edu/api/v1/artworks" target="_blank" rel="noreferrer noopener"></a><a target="_blank" href="https://api.artic.edu/api/v1/artworks" rel="noreferrer noopener">https://api.artic.edu/api/v1/artworks</a></td>
</tr>
<tr>
  <td>2</td>
  <td>Content</td>
  <td><a href="https://github.com/HackerNews/API" target="_blank" rel="noreferrer noopener"></a><a target="_blank" href="https://github.com/HackerNews/API" rel="noreferrer noopener">HackerNews</a></td>
  <td>Hacker News API</td>
  <td><a href="https://hacker-news.firebaseio.com/v0/item/8863.json" target="_blank" rel="noreferrer noopener"></a><a target="_blank" href="https://hacker-news.firebaseio.com/v0/item/8863.json" rel="noreferrer noopener">https://hacker-news.firebaseio.com/v0/item/8863.json</a></td>
</tr>
<tr>
  <td>3</td>
  <td>Crypto &amp; Finance</td>
  <td><a href="https://www.coingecko.com/en/api/documentation" target="_blank" rel="noreferrer noopener"></a><a target="_blank" href="https://www.coingecko.com/en/api/documentation" rel="noreferrer noopener">CoinGecko</a></td>
  <td>Cryptocurrency market data</td>
  <td><a href="https://api.coingecko.com/api/v3/coins/markets" target="_blank" rel="noreferrer noopener"></a><a target="_blank" href="https://api.coingecko.com/api/v3/coins/markets" rel="noreferrer noopener">https://api.coingecko.com/api/v3/coins/markets</a></td>
</tr>
<tr>
  <td>4</td>
  <td>Developer Tools</td>
  <td><a href="https://www.ipify.org/" target="_blank" rel="noreferrer noopener"></a><a target="_blank" href="https://www.ipify.org/" rel="noreferrer noopener">IPify</a></td>
  <td>Get public IP address</td>
  <td><a href="https://api.ipify.org?format=json" target="_blank" rel="noreferrer noopener"></a><a target="_blank" href="https://api.ipify.org?format=json" rel="noreferrer noopener">https://api.ipify.org?format=json</a></td>
</tr>
<tr>
  <td>5</td>
  <td>Fun &amp; Games</td>
  <td><a href="https://api.chucknorris.io/" target="_blank" rel="noreferrer noopener"></a><a target="_blank" href="https://api.chucknorris.io/" rel="noreferrer noopener">Chuck Norris Jokes</a></td>
  <td>Chuck Norris facts</td>
  <td><a href="https://api.chucknorris.io/jokes/random" target="_blank" rel="noreferrer noopener"></a><a target="_blank" href="https://api.chucknorris.io/jokes/random" rel="noreferrer noopener">https://api.chucknorris.io/jokes/random</a></td>
</tr>
</tbody>
</table>
</figure>
</body>
</html>
`;

const tableHtmlSingleLink = `
<html>
<body>
<figure class="wp-block-table">
<table id="myTable">
<thead>
<tr><th>#</th><th>CATEGORY</th><th>API NAME</th><th>DESCRIPTION</th><th>SAMPLE URL</th></tr>
</thead>
<tbody>
<tr>
  <td>1</td>
  <td>Crypto &amp; Finance</td>
  <td><a href="https://developers.coinbase.com/api/v2" target="_blank" rel="noreferrer noopener">CoinBase</a></td>
  <td>Currency codes and names</td>
  <td><a href="https://api.coinbase.com/v2/currencies" target="_blank" rel="noreferrer noopener">https://api.coinbase.com/v2/currencies</a></td>
</tr>
</tbody>
</table>
</figure>
</body>
</html>
`;

describe('sources/mixedanalytics', () => {
  describe('fetchApis', () => {
    it('should fetch and parse APIs from the table', async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: tableHtml });

      const entries = await fetcher.fetchApis();

      expect(entries).toHaveLength(5);
    });

    it('should extract name and link correctly', async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: tableHtml });

      const entries = await fetcher.fetchApis();

      expect(entries[0].name).toBe('Art Institute of Chicago');
      expect(entries[0].link).toBe('https://api.artic.edu/docs/');
      expect(entries[1].name).toBe('HackerNews');
      expect(entries[1].link).toBe('https://github.com/HackerNews/API');
    });

    it('should handle single-link rows (no empty first link)', async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: tableHtmlSingleLink });

      const entries = await fetcher.fetchApis();

      expect(entries).toHaveLength(1);
      expect(entries[0].name).toBe('CoinBase');
      expect(entries[0].link).toBe('https://developers.coinbase.com/api/v2');
    });

    it('should set auth to "no" for all entries', async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: tableHtml });

      const entries = await fetcher.fetchApis();

      entries.forEach((entry) => {
        expect(entry.auth).toBe('no');
      });
    });

    it('should extract category from the CATEGORY column', async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: tableHtml });

      const entries = await fetcher.fetchApis();

      expect(entries[0].categories).toEqual(['Art & Images']);
      expect(entries[1].categories).toEqual(['Content']);
      expect(entries[2].categories).toEqual(['Crypto & Finance']);
      expect(entries[3].categories).toEqual(['Developer Tools']);
      expect(entries[4].categories).toEqual(['Fun & Games']);
    });

    it('should extract description from the DESCRIPTION column', async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: tableHtml });

      const entries = await fetcher.fetchApis();

      expect(entries[0].description).toBe('Artwork from the museum');
      expect(entries[1].description).toBe('Hacker News API');
    });

    it('should set cors and openapiSpec to null', async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: tableHtml });

      const entries = await fetcher.fetchApis();

      entries.forEach((entry) => {
        expect(entry.cors).toBeNull();
        expect(entry.openapiSpec).toBeNull();
      });
    });

    it('should set sources to fetcher name', async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: tableHtml });

      const entries = await fetcher.fetchApis();

      entries.forEach((entry) => {
        expect(entry.sources).toEqual(['mixedanalytics']);
      });
    });

    it('should skip rows with no valid link', async () => {
      const html = `
<html>
<body>
<figure class="wp-block-table">
<table id="myTable">
<thead>
<tr><th>#</th><th>CATEGORY</th><th>API NAME</th><th>DESCRIPTION</th><th>SAMPLE URL</th></tr>
</thead>
<tbody>
<tr>
  <td>1</td>
  <td>Test</td>
  <td><a></a><a>No Link API</a></td>
  <td>Has no href</td>
  <td><a href="https://example.com">https://example.com</a></td>
</tr>
<tr>
  <td>2</td>
  <td>Test</td>
  <td><a href="https://valid.com/api" target="_blank"></a><a target="_blank" href="https://valid.com/api">Valid API</a></td>
  <td>Valid entry</td>
  <td><a href="https://valid.com/sample">https://valid.com/sample</a></td>
</tr>
</tbody>
</table>
</figure>
</body>
</html>
`;
      vi.mocked(axios.get).mockResolvedValue({ data: html });

      const entries = await fetcher.fetchApis();

      expect(entries).toHaveLength(1);
      expect(entries[0].name).toBe('Valid API');
    });

    it('should skip rows with non-http links', async () => {
      const html = `
<html>
<body>
<figure class="wp-block-table">
<table id="myTable">
<thead>
<tr><th>#</th><th>CATEGORY</th><th>API NAME</th><th>DESCRIPTION</th><th>SAMPLE URL</th></tr>
</thead>
<tbody>
<tr>
  <td>1</td>
  <td>Test</td>
  <td><a href="ftp://invalid.com" target="_blank"></a><a target="_blank" href="ftp://invalid.com">FTP API</a></td>
  <td>Uses ftp</td>
  <td><a href="https://example.com">https://example.com</a></td>
</tr>
</tbody>
</table>
</figure>
</body>
</html>
`;
      vi.mocked(axios.get).mockResolvedValue({ data: html });

      const entries = await fetcher.fetchApis();

      expect(entries).toHaveLength(0);
    });

    it('should return empty array for empty table', async () => {
      const html = `
<html>
<body>
<figure class="wp-block-table">
<table id="myTable">
<thead>
<tr><th>#</th><th>CATEGORY</th><th>API NAME</th><th>DESCRIPTION</th><th>SAMPLE URL</th></tr>
</thead>
<tbody>
</tbody>
</table>
</figure>
</body>
</html>
`;
      vi.mocked(axios.get).mockResolvedValue({ data: html });

      const entries = await fetcher.fetchApis();

      expect(entries).toHaveLength(0);
    });

    it('should have correct fetcher metadata', () => {
      expect(fetcher.name).toBe('mixedanalytics');
      expect(fetcher.sourceUrl).toBe(
        'https://mixedanalytics.com/blog/list-actually-free-open-no-auth-needed-apis/'
      );
    });
  });
});
