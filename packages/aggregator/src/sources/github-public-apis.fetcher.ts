import { marked } from 'marked';
import * as cheerio from 'cheerio';
import type { ApiEntry, SourceFetcher } from '../types';

const fetcher: SourceFetcher = {
  name: 'github-public-apis',

  async fetchApis(): Promise<ApiEntry[]> {
    const res = await fetch(
      'https://raw.githubusercontent.com/public-apis/public-apis/master/README.md'
    );
    const markdown = await res.text();

    const entries = parseMarkdownTable(markdown);
    return entries;
  },
};

function parseMarkdownTable(markdown: string): ApiEntry[] {
  const entries: ApiEntry[] = [];

  const html = marked.parse(markdown) as string;
  const $ = cheerio.load(html);

  // Skip first table (it's metadata), process all other tables
  const tables = $('table');
  tables.each((tableIdx, table) => {
    if (tableIdx === 0) {
      return;
    }

    const $table = $(table);
    const tdCount = $table.find('td').length;

    if (tdCount === 0) {
      return;
    }

    $table.find('tr').each((_i, row) => {
      const $row = $(row);
      const $cells = $row.find('td');

      if ($cells.length === 0) {
        return;
      }

      // Format: API Name | Description | Auth | HTTPS | CORS
      // Link is inside the first cell as <a href="...">
      const nameCell = $cells.eq(0);
      const name = nameCell.text().trim();
      const link = nameCell.find('a').attr('href') || nameCell.text().trim();

      const description = $cells.eq(1).text().trim();
      const auth = $cells.eq(2).text().trim();
      const https = $cells.eq(3).text().trim();
      const cors = $cells.eq(4).text().trim();

      if (!link.startsWith('http')) {
        return;
      }

      const entry: ApiEntry = {
        name,
        description,
        link,
        https: https.toLowerCase() === 'yes',
        cors: cors.toLowerCase() || undefined,
        categories: ['Public'],
        sources: [fetcher.name],
      };

      if (auth.toLowerCase() === 'yes') {
        entry.auth = 'apiKey';
      } else if (auth.toLowerCase() !== 'no') {
        entry.auth = auth;
      }

      entries.push(entry);
    });
  });

  return entries;
}

export { parseMarkdownTable };
export default fetcher;
