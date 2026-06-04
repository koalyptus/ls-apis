import { marked } from 'marked';
import * as cheerio from 'cheerio';
import type { ApiEntry, AuthType, SourceFetcher } from '../types';

const fetcher: SourceFetcher = {
  name: 'github-public-apis',
  sourceUrl: 'https://github.com/public-apis/public-apis',

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

  // Build a map of section IDs to category names
  // Find all h3s and their next table
  const sectionToCategory = new Map<string, string>();

  $('h3').each((_i, h3) => {
    const category = $(h3).text().trim();
    const nextTable = $(h3).next('table')[0];
    if (nextTable) {
      const tableId = $.html(nextTable).substring(0, 50);
      sectionToCategory.set(tableId, category);
    }
  });

  // Skip first table (it's metadata), process all other tables
  const tables = $('table');
  tables.each((tableIdx, table) => {
    if (tableIdx === 0) {
      return;
    }

    const $table = $(table);

    // Find category by looking at preceding elements
    let category = 'Public';
    let prev = $table[0].prev;
    while (prev && prev.type !== 'tag') {
      prev = prev.prev;
    }
    if (prev && prev.name === 'h3') {
      category = $(prev).text().trim();
    }

    const $tbody = $table.find('tbody');
    const rows = $tbody.length > 0 ? $tbody.find('tr') : $table.find('tr');
    rows.each((_i, row) => {
      const $row = $(row);
      const $cells = $row.find('td');

      if ($cells.length === 0) {
        return;
      }

      const nameCell = $cells.eq(0);
      const name = nameCell.text().trim();
      const link = nameCell.find('a').attr('href') || nameCell.text().trim();

      const description = $cells.eq(1).text().trim();
      const authRaw = $cells.eq(2).text().trim();
      const cors = $cells.eq(4).text().trim();

      if (!link.startsWith('http')) {
        return;
      }

      const authLower = authRaw.toLowerCase();
      const hasApiKey = authLower === 'yes' || authLower.includes('apikey');
      const hasOAuth = authLower.includes('oauth');
      let auth: AuthType = null;
      if (hasApiKey && hasOAuth) {
        auth = 'apiKey|OAuth';
      } else if (hasApiKey) {
        auth = 'apiKey';
      } else if (hasOAuth) {
        auth = 'OAuth';
      } else if (authLower.length > 0) {
        auth = authLower;
      }

      const entry: ApiEntry = {
        name,
        description,
        link,
        cors: cors.toLowerCase() || null,
        categories: [category],
        sources: [fetcher.name],
        auth,
        openapiSpec: null,
      };

      entries.push(entry);
    });
  });

  return entries;
}

export default fetcher;
