import axios from 'axios';
import * as cheerio from 'cheerio';
import type { ApiEntry, SourceFetcher } from '../types';

const PAGE_URL = 'https://mixedanalytics.com/blog/list-actually-free-open-no-auth-needed-apis/';
const REQUEST_TIMEOUT = 15000;

const fetcher: SourceFetcher = {
  name: 'mixedanalytics',
  sourceUrl: PAGE_URL,

  async fetchApis(): Promise<ApiEntry[]> {
    const res = await axios.get<string>(PAGE_URL, {
      timeout: REQUEST_TIMEOUT,
    });

    const $ = cheerio.load(res.data);
    const entries: ApiEntry[] = [];

    $('table#myTable tbody tr').each((_i, row) => {
      const cells = $(row).find('td');
      if (cells.length < 5) {
        return;
      }

      const category = cells.eq(1).text().trim();

      const nameCell = cells.eq(2);
      const nameLinks = nameCell.find('a');
      let name = '';
      let link = '';

      nameLinks.each((_j, el) => {
        const text = $(el).text().trim();
        const href = $(el).attr('href') || '';
        if (text) {
          name = text;
          link = href;
        }
      });

      if (!name || !link || !link.startsWith('http')) {
        return;
      }

      const description = cells.eq(3).text().trim() || null;

      entries.push({
        name,
        description,
        link,
        auth: 'no',
        cors: null,
        categories: [category],
        openapiSpec: null,
        sources: [fetcher.name],
      });
    });

    return entries;
  },
};

export default fetcher;
