import axios from 'axios';
import * as cheerio from 'cheerio';
import * as https from 'https';
import type { ApiEntry, SourceFetcher } from '../types';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const CATEGORIES = [
  'animals',
  'anime',
  'anti-malware',
  'art-and-design',
  'authentication-and-authorization',
  'blockchain',
  'books',
  'business',
  'calendar',
  'cloud-storage-and-file-sharing',
  'continuous-integration',
  'cryptocurrency',
  'currency-exchange',
  'data-validation',
  'development',
  'dictionaries',
  'documents-and-productivity',
  'email',
  'entertainment',
  'environment',
  'events',
  'finance',
  'food-and-drink',
  'games-and-comics',
  'geocoding',
  'government',
  'health',
  'jobs',
  'machine-learning',
  'music',
  'news',
  'open-data',
  'open-source-projects',
  'patent',
  'personality',
  'phone',
  'photography',
  'podcasts',
  'programming',
  'science-and-math',
  'security',
  'shopping',
  'social',
  'sports-and-fitness',
  'test-data',
  'text-analysis',
  'tracking',
  'transportation',
  'url-shorteners',
  'vehicle',
  'video',
  'weather',
];

const BASE_URL = 'https://publicapis.dev';

function normalizeCategory(category: string): string {
  return category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const fetcher: SourceFetcher = {
  name: 'publicapis-dev',

  async fetchApis(): Promise<ApiEntry[]> {
    const allApis: ApiEntry[] = [];

    for (const category of CATEGORIES) {
      try {
        const url = `${BASE_URL}/category/${category}`;
        const res = await axios.get(url, {
          timeout: 10000,
          httpsAgent,
          headers: {
            'User-Agent': 'ls-apis/1.0 (aggregator)',
          },
        });

        const $ = cheerio.load(res.data);
        const categoryName = normalizeCategory(category);

        $('li[role="group"]').each((_i, el) => {
          const $item = $(el);
          const $anchors = $item.find('a');
          const apiLink = $anchors.first().attr('href')?.split('?')[0];

          if (!apiLink || apiLink.includes('github.com/marcelscruz')) return;

          const name = $item.find('h2').first().text().trim() || $item.find('[class*=heading]').first().text().trim();
          if (!name) return;

          const descriptions = $item.find('p').map((_j, pEl) => $(pEl).text().trim()).get();
          const description = descriptions.find(d => d && d.length > 20) || null;

          let auth: string | null = null;
          let cors: string | null = null;

          const itemText = $item.text().toLowerCase();

          if (itemText.includes('api key')) auth = 'apiKey';
          else if (itemText.includes('oauth')) auth = 'OAuth';

          if (itemText.includes('cors') && (itemText.includes('yes') || itemText.includes('✓'))) cors = 'yes';

          allApis.push({
            name,
            description: description || null,
            link: apiLink,
            auth,
            cors,
            categories: [categoryName],
            openapiSpec: null,
            sources: [fetcher.name],
          });
        });
      } catch (error) {
        console.error(`Failed to fetch ${category}: ${error}`);
      }
    }

    return allApis;
  },
};

export default fetcher;