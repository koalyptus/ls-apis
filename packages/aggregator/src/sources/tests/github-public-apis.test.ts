import { describe, it, expect } from 'vitest';
import { marked } from 'marked';
import * as cheerio from 'cheerio';
import type { ApiEntry } from '../types';

describe('sources/github-public-apis', () => {
  describe('parseMarkdownTable - real format', () => {
    it('should parse marked + cheerio output', () => {
      const markdown = `# Public APIs

| API | Description | Call this API |
| --- | --- | --- |
| [NASA APIs](https://api.nasa.gov) | NASA APIs | apiKey |
| [OpenWeather](https://openweathermap.org) | Weather data | No |
`;

      const html = marked.parse(markdown) as string;
      const $ = cheerio.load(html);

      const entries: ApiEntry[] = [];
      $('table').each((_tableIdx, table) => {
        const $table = $(table);
        if ($table.find('td').length === 0) return;

        $table.find('tr').each((_i, row) => {
          const $row = $(row);
          const $cells = $row.find('td');
          if ($cells.length === 0) return;

          const nameCell = $cells.eq(0);
          const name = nameCell.text().trim();
          const link = nameCell.find('a').attr('href');

          if (link?.startsWith('http')) {
            entries.push({
              name,
              link,
              auth: $cells.eq(2).text().trim(),
              categories: [],
              sources: [],
            });
          }
        });
      });

      expect(entries).toHaveLength(2);
      expect(entries[0].name).toBe('NASA APIs');
      expect(entries[0].link).toBe('https://api.nasa.gov');
      expect(entries[0].auth).toBe('apiKey');
    });
  });
});
